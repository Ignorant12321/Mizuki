<script lang="ts">
	import Icon from "@iconify/svelte";
	import { onDestroy, onMount } from "svelte";
	import { slide } from "svelte/transition";
	import { musicPlayerConfig, siteConfig } from "../../config";
	import Key from "../../i18n/i18nKey";
	import { i18n } from "../../i18n/translation";

	// 基础配置获取
	let globalMode = musicPlayerConfig.mode ?? "meting";
	let globalMetingApi = musicPlayerConfig.meting_api;
	const musicPlayerPosition = siteConfig.floatingWidgets?.musicPlayer ?? {
		desktop: { left: "1.25rem", bottom: "1rem" },
		mobile: { left: "1.3rem", bottom: "0.5rem" },
		mobileExpanded: { left: "0.5rem" },
		mobilePlaylist: { left: "0.5rem", bottom: "5rem" },
	};

	// 【核心逻辑】：向下兼容，如果没有配置 playlists 数组，自动用原版的根配置兜底
	let playlistsConfig =
		musicPlayerConfig.playlists && musicPlayerConfig.playlists.length > 0
			? musicPlayerConfig.playlists
			: [
					{
						name: "默认歌单",
						mode: globalMode,
						meting_api: globalMetingApi,
						server: musicPlayerConfig.server,
						type: musicPlayerConfig.type,
						id: musicPlayerConfig.id,
					},
				];

	let currentListIndex = 0;
	let playlistCache: Record<string, Song[]> = {}; // 歌单缓存池

	// 播放器状态
	let isPlaying = false;
	let isExpanded = false;
	let isHidden = true;
	let showPlaylist = false;
	let currentTime = 0;
	let duration = 0;

	// 音量与设置
	const STORAGE_KEY_VOLUME = "music-player-volume";
	let volume = 0.7;
	let isMuted = false;
	let isLoading = false;
	let isShuffled = true;
	let isRepeating = 2; // 0: 不循环, 1: 单曲循环, 2: 列表循环
	let errorMessage = "";
	let showError = false;

	// 当前歌曲信息
	let currentSong = {
		title: "Sample Song",
		artist: "Sample Artist",
		cover: "/favicon/favicon.ico",
		url: "",
		duration: 0,
	};

	type Song = {
		id: number;
		title: string;
		artist: string;
		cover: string;
		url: string;
		duration: number;
	};

	let playlist: Song[] = [];
	let currentIndex = 0;
	let audio: HTMLAudioElement;
	let progressBar: HTMLElement;
	let volumeBar: HTMLElement;

	const localPlaylist: Song[] = [
		{
			id: 1,
			title: "勾指起誓",
			artist: "洛天依、ilem",
			cover: "/assets/music/cover/勾指起誓 - 洛天依、ilem.jpg",
			url: "/assets/music/url/勾指起誓 - 洛天依、ilem.mp3",
			duration: 240,
		},
		{
			id: 2,
			title: "霜雪千年 (cover 洛天依乐正绫)",
			artist: "真栗",
			cover: "assets/music/cover/霜雪千年 (cover 洛天依乐正绫) - 真栗.jpg",
			url: "assets/music/url/霜雪千年 (cover 洛天依乐正绫) - 真栗.mp3",
			duration: 180,
		},
		{
			id: 3,
			title: "权御天下",
			artist: "洛天依",
			cover: "assets/music/cover/权御天下 - 洛天依.jpg",
			url: "assets/music/url/权御天下 - 洛天依.mp3",
			duration: 200,
		},
		{
			id: 4,
			title: "达拉崩吧 (Live)",
			artist: "周深",
			cover: "assets/music/cover/达拉崩吧 (Live) - 周深.jpg",
			url: "assets/music/url/达拉崩吧 (Live) - 周深.mp3",
			duration: 200,
		},
		{
			id: 5,
			title: "蝴蝶",
			artist: "洛天依",
			cover: "assets/music/cover/蝴蝶 - 洛天依.jpg",
			url: "assets/music/url/蝴蝶 - 洛天依.mp3",
			duration: 200,
		},
	];

	function loadVolumeSettings() {
		try {
			if (typeof localStorage !== "undefined") {
				const savedVolume = localStorage.getItem(STORAGE_KEY_VOLUME);
				if (savedVolume !== null && !isNaN(parseFloat(savedVolume))) {
					volume = parseFloat(savedVolume);
				}
			}
		} catch (e) {
			console.warn("Failed to load volume settings:", e);
		}
	}

	function saveVolumeSettings() {
		try {
			if (typeof localStorage !== "undefined") {
				localStorage.setItem(STORAGE_KEY_VOLUME, volume.toString());
			}
		} catch (e) {
			console.warn("Failed to save volume settings:", e);
		}
	}

	function parseMetingSong(song: any): Song {
		let title = song.name ?? song.title ?? i18n(Key.unknownSong);
		let artist = song.artist ?? song.author ?? i18n(Key.unknownArtist);
		let dur = song.duration ?? 0;
		if (dur > 10000) dur = Math.floor(dur / 1000);
		if (!Number.isFinite(dur) || dur <= 0) dur = 0;
		return {
			id: song.id,
			title,
			artist,
			cover: song.pic ?? "",
			url: song.url ?? "",
			duration: dur,
		};
	}

	// 新增：平滑过渡歌曲状态的辅助函数
	function syncCurrentSongWithPlaylist() {
		if (!currentSong.url) {
			// 如果播放器刚初始化，什么都没播放，默认加载新歌单的第一首歌
			currentIndex = 0;
			if (playlist.length > 0) loadSong(playlist[0]);
		} else {
			// 如果已经有歌曲在播放，去新歌单里找找看有没有同一首歌
			const foundIndex = playlist.findIndex(
				(s) => s.url === currentSong.url,
			);
			// 如果新歌单里没这首歌，会变成 -1，当前播放不会被打断，点“下一首”会自动从新歌单第一首开始
			currentIndex = foundIndex;
		}
	}

	// 核心：智能加载歌单数据 (兼顾 local 和 meting，以及独立 API)
	async function loadPlaylistData(listIndex = 0) {
		if (playlistsConfig.length === 0) return;
		const config = playlistsConfig[listIndex];
		const currentMode = config.mode ?? globalMode;

		let cacheKey = "";
		if (currentMode === "local") {
			cacheKey = `local-${config.name}`;
		} else {
			cacheKey = `meting-${config.server}-${config.type}-${config.id}`;
		}

		// 如果有缓存，直接用缓存
		if (playlistCache[cacheKey]) {
			playlist = playlistCache[cacheKey];
			syncCurrentSongWithPlaylist(); // 替换了原来的强制切歌
			return;
		}

		// 处理 Local 模式
		if (currentMode === "local") {
			const localData = config.audioList ?? localPlaylist;
			playlistCache[cacheKey] = [...localData];
			if (listIndex === currentListIndex) {
				playlist = playlistCache[cacheKey];
				syncCurrentSongWithPlaylist(); // 替换了原来的强制切歌
			}
			return;
		}

		// 处理 Meting 模式
		const currentApi = config.meting_api ?? globalMetingApi;
		if (!currentApi || !config.id) return;

		isLoading = true;
		const apiUrl = currentApi
			.replace(":server", config.server ?? "netease")
			.replace(":type", config.type ?? "playlist")
			.replace(":id", config.id)
			.replace(":auth", "")
			.replace(":r", Date.now().toString());

		try {
			const res = await fetch(apiUrl);
			if (!res.ok) throw new Error("meting api error");
			const list = await res.json();
			const newPlaylist = list.map(parseMetingSong);

			playlistCache[cacheKey] = newPlaylist;
			if (listIndex === currentListIndex) {
				playlist = newPlaylist;
				syncCurrentSongWithPlaylist(); // 替换了原来的强制切歌
			}
		} catch (e) {
			showErrorMessage(i18n(Key.musicPlayerErrorPlaylist));
		} finally {
			isLoading = false;
		}
	}

	// 切换歌单操作
	function switchPlaylist(index: number) {
		if (currentListIndex === index) return;
		currentListIndex = index;

		// 仅仅加载新歌单数据更新UI，不再去管 audio 的 pause 和 play
		loadPlaylistData(index);
	}

	function togglePlay() {
		if (!audio || !currentSong.url) return;
		if (isPlaying) {
			audio.pause();
		} else {
			audio.play().catch(() => {});
		}
	}

	function toggleExpanded() {
		isExpanded = !isExpanded;
		if (isExpanded) {
			showPlaylist = false;
			isHidden = false;
		}
	}

	function toggleHidden() {
		isHidden = !isHidden;
		if (isHidden) {
			isExpanded = false;
			showPlaylist = false;
		}
	}

	function togglePlaylist() {
		showPlaylist = !showPlaylist;
	}

	function toggleShuffle() {
		isShuffled = !isShuffled;
	}

	function toggleRepeat() {
		isRepeating = (isRepeating + 1) % 3;
	}

	function previousSong() {
		if (playlist.length <= 1) return;
		const newIndex =
			currentIndex > 0 ? currentIndex - 1 : playlist.length - 1;
		playSong(newIndex);
	}

	function nextSong(autoPlay: boolean = true) {
		if (playlist.length <= 1) return;

		let newIndex: number;
		if (isShuffled) {
			do {
				newIndex = Math.floor(Math.random() * playlist.length);
			} while (newIndex === currentIndex && playlist.length > 1);
		} else {
			newIndex =
				currentIndex < playlist.length - 1 ? currentIndex + 1 : 0;
		}
		playSong(newIndex, autoPlay);
	}

	let willAutoPlay = false;

	function playSong(index: number, autoPlay = true) {
		if (index < 0 || index >= playlist.length) return;
		willAutoPlay = autoPlay;
		currentIndex = index;
		loadSong(playlist[currentIndex]);
	}

	function handlePlaylistClick(index: number) {
		if (index === currentIndex) {
			// 如果点的是当前歌曲，直接切换 播放/暂停 状态
			togglePlay();
		} else {
			// 如果点的是其他歌曲，则切歌
			playSong(index);
		}
	}

	function getAssetPath(path: string): string {
		if (path.startsWith("http://") || path.startsWith("https://"))
			return path;
		if (path.startsWith("/")) return path;
		return `/${path}`;
	}

	function loadSong(song: typeof currentSong) {
		if (!song) return;
		if (song.url !== currentSong.url) {
			currentSong = { ...song };
			if (song.url) {
				isLoading = true;
			} else {
				isLoading = false;
			}
		}
	}

	let autoplayFailed = false;

	function handleLoadSuccess() {
		isLoading = false;
		if (audio?.duration && audio.duration > 1) {
			duration = Math.floor(audio.duration);
			if (playlist[currentIndex])
				playlist[currentIndex].duration = duration;
			currentSong.duration = duration;
		}

		if (willAutoPlay || isPlaying) {
			const playPromise = audio.play();
			if (playPromise !== undefined) {
				playPromise.catch((error) => {
					console.warn("自动播放被拦截，等待用户交互:", error);
					autoplayFailed = true;
					isPlaying = false;
				});
			}
		}
	}

	function handleUserInteraction() {
		if (autoplayFailed && audio) {
			const playPromise = audio.play();
			if (playPromise !== undefined) {
				playPromise
					.then(() => {
						autoplayFailed = false;
					})
					.catch(() => {});
			}
		}
	}

	function handleLoadError(_event: Event) {
		if (!currentSong.url) return;
		isLoading = false;
		showErrorMessage(i18n(Key.musicPlayerErrorSong));

		const shouldContinue = isPlaying || willAutoPlay;
		if (playlist.length > 1) {
			setTimeout(() => nextSong(shouldContinue), 1000);
		} else {
			showErrorMessage(i18n(Key.musicPlayerErrorEmpty));
		}
	}

	function handleLoadStart() {}

	function handleAudioEnded() {
		if (isRepeating === 1) {
			audio.currentTime = 0;
			audio.play().catch(() => {});
		} else if (isRepeating === 2 || isShuffled) {
			nextSong(true);
		} else {
			isPlaying = false;
		}
	}

	function showErrorMessage(message: string) {
		errorMessage = message;
		showError = true;
		setTimeout(() => {
			showError = false;
		}, 3000);
	}

	function hideError() {
		showError = false;
	}

	function setProgress(event: MouseEvent) {
		if (!audio || !progressBar) return;
		const rect = progressBar.getBoundingClientRect();
		const percent = (event.clientX - rect.left) / rect.width;
		const newTime = percent * duration;
		audio.currentTime = newTime;
		currentTime = newTime;
	}

	let isVolumeDragging = false;
	let isPointerDown = false;
	let volumeBarRect: DOMRect | null = null;
	let rafId: number | null = null;

	function startVolumeDrag(event: PointerEvent) {
		if (!volumeBar) return;
		event.preventDefault();

		isPointerDown = true;
		volumeBar.setPointerCapture(event.pointerId);

		volumeBarRect = volumeBar.getBoundingClientRect();
		updateVolumeLogic(event.clientX);
	}

	function handleVolumeMove(event: PointerEvent) {
		if (!isPointerDown) return;
		event.preventDefault();

		isVolumeDragging = true;
		if (rafId) return;

		rafId = requestAnimationFrame(() => {
			updateVolumeLogic(event.clientX);
			rafId = null;
		});
	}

	function stopVolumeDrag(event: PointerEvent) {
		if (!isPointerDown) return;
		isPointerDown = false;
		isVolumeDragging = false;
		volumeBarRect = null;
		if (volumeBar) {
			volumeBar.releasePointerCapture(event.pointerId);
		}

		if (rafId) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
		saveVolumeSettings();
	}

	function updateVolumeLogic(clientX: number) {
		if (!audio || !volumeBar) return;
		const rect = volumeBarRect || volumeBar.getBoundingClientRect();
		const percent = Math.max(
			0,
			Math.min(1, (clientX - rect.left) / rect.width),
		);
		volume = percent;
	}

	function toggleMute() {
		isMuted = !isMuted;
	}

	function formatTime(seconds: number): string {
		if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	}

	const interactionEvents = ["click", "keydown", "touchstart"];
	onMount(() => {
		loadVolumeSettings();
		interactionEvents.forEach((event) => {
			document.addEventListener(event, handleUserInteraction, {
				capture: true,
			});
		});

		if (!musicPlayerConfig.enable) return;

		if (playlistsConfig.length > 0) {
			// 只加载第一个歌单，不再执行 preloadOtherPlaylists
			loadPlaylistData(0);
		} else {
			showErrorMessage("播放列表配置为空");
		}
	});

	onDestroy(() => {
		if (typeof document !== "undefined") {
			interactionEvents.forEach((event) => {
				document.removeEventListener(event, handleUserInteraction, {
					capture: true,
				});
			});
		}
	});
</script>

<audio
	bind:this={audio}
	src={getAssetPath(currentSong.url)}
	bind:volume
	bind:muted={isMuted}
	on:play={() => (isPlaying = true)}
	on:pause={() => (isPlaying = false)}
	on:timeupdate={() => (currentTime = audio.currentTime)}
	on:ended={handleAudioEnded}
	on:error={handleLoadError}
	on:loadeddata={handleLoadSuccess}
	on:loadstart={handleLoadStart}
	preload="auto"
></audio>

<svelte:window
	on:pointermove={handleVolumeMove}
	on:pointerup={stopVolumeDrag}
/>

{#if musicPlayerConfig.enable}
	{#if showError}
		<div class="fixed bottom-20 left-5 z-60 max-w-sm">
			<div
				class="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up"
			>
				<Icon icon="material-symbols:error" class="text-xl shrink-0" />
				<span class="text-sm flex-1">{errorMessage}</span>
				<button
					on:click={hideError}
					class="text-white/80 hover:text-white transition-colors"
				>
					<Icon icon="material-symbols:close" class="text-lg" />
				</button>
			</div>
		</div>
	{/if}

	<div
		class="music-player fixed z-50 transition-all duration-300 ease-in-out"
		class:expanded={isExpanded}
		class:hidden-mode={isHidden}
		style={`--music-player-left-desktop:${musicPlayerPosition.desktop.left};--music-player-bottom-desktop:${musicPlayerPosition.desktop.bottom};--music-player-left-mobile:${musicPlayerPosition.mobile.left};--music-player-bottom-mobile:${musicPlayerPosition.mobile.bottom};--music-player-expanded-left-mobile:${musicPlayerPosition.mobileExpanded.left};--music-player-playlist-left-mobile:${musicPlayerPosition.mobilePlaylist.left};--music-player-playlist-bottom-mobile:${musicPlayerPosition.mobilePlaylist.bottom};`}
	>
		<div
			class="orb-player w-12 h-12 rounded-full cursor-pointer transition-all duration-500 ease-in-out flex items-center justify-center hover:scale-110 active:scale-95"
			class:opacity-0={!isHidden}
			class:scale-0={!isHidden}
			class:pointer-events-none={!isHidden}
			on:click={toggleHidden}
			on:keydown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					toggleHidden();
				}
			}}
			role="button"
			tabindex="0"
			aria-label={i18n(Key.musicPlayerShow)}
		>
			{#if isLoading}
				<span class="orb-spinner" aria-hidden="true"></span>
			{:else if isPlaying}
				<div class="orb-content flex items-end space-x-[2px] h-[16px]">
					<div class="w-[2px] orb-bar rounded-sm music-bar bar-1"></div>
					<div class="w-[2px] orb-bar rounded-sm music-bar bar-2"></div>
					<div class="w-[2px] orb-bar rounded-sm music-bar bar-3"></div>
					<div class="w-[2px] orb-bar rounded-sm music-bar bar-4"></div>
					<div class="w-[2px] orb-bar rounded-sm music-bar bar-5"></div>
				</div>
			{:else}
				<Icon
					icon="material-symbols:music-note"
					class="orb-icon text-lg"
				/>
			{/if}
		</div>
		<div
			class="mini-player music-surface card-base bg-(--float-panel-bg) shadow-xl rounded-2xl p-3 transition-all duration-500 ease-in-out"
			class:opacity-0={isExpanded || isHidden}
			class:scale-95={isExpanded || isHidden}
			class:pointer-events-none={isExpanded || isHidden}
		>
			<div class="flex items-center gap-3">
				<div
					class="cover-container relative w-12 h-12 rounded-full overflow-hidden cursor-pointer"
					on:click={togglePlay}
					on:keydown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							togglePlay();
						}
					}}
					role="button"
					tabindex="0"
					aria-label={isPlaying
						? i18n(Key.musicPlayerPause)
						: i18n(Key.musicPlayerPlay)}
				>
					<img
						src={getAssetPath(currentSong.cover)}
						alt={i18n(Key.musicPlayerCover)}
						class="w-full h-full object-cover transition-transform duration-300"
						class:spinning={isPlaying && !isLoading}
						class:animate-pulse={isLoading}
					/>
					<div
						class="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
					>
						{#if isLoading}
							<Icon
								icon="eos-icons:loading"
								class="text-white text-xl"
							/>
						{:else if isPlaying}
							<Icon
								icon="material-symbols:pause"
								class="text-white text-xl"
							/>
						{:else}
							<Icon
								icon="material-symbols:play-arrow"
								class="text-white text-xl"
							/>
						{/if}
					</div>
				</div>
				<div
					class="flex-1 min-w-0 cursor-pointer"
					on:click={toggleExpanded}
					on:keydown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							toggleExpanded();
						}
					}}
					role="button"
					tabindex="0"
					aria-label={i18n(Key.musicPlayerExpand)}
				>
					<div class="text-sm font-medium text-90 truncate">
						{currentSong.title}
					</div>
					<div class="text-xs text-50 truncate">
						{currentSong.artist}
					</div>
				</div>
				<div class="flex items-center gap-1">
					<button
						class="music-action-btn w-8 h-8 rounded-lg flex items-center justify-center"
						on:click|stopPropagation={toggleHidden}
						title={i18n(Key.musicPlayerHide)}
					>
						<Icon
							icon="material-symbols:visibility-off"
							class="text-lg"
						/>
					</button>
					<button
						class="music-action-btn w-8 h-8 rounded-lg flex items-center justify-center"
						on:click|stopPropagation={toggleExpanded}
					>
						<Icon
							icon="material-symbols:expand-less"
							class="text-lg"
						/>
					</button>
				</div>
			</div>
		</div>
		<div
			class="expanded-player music-surface card-base bg-(--float-panel-bg) shadow-xl rounded-2xl p-4 transition-all duration-500 ease-in-out"
			class:opacity-0={!isExpanded}
			class:scale-95={!isExpanded}
			class:pointer-events-none={!isExpanded}
		>
			<div class="flex items-center gap-4 mb-4">
				<div
					class="cover-container relative w-16 h-16 rounded-full overflow-hidden shrink-0"
				>
					<img
						src={getAssetPath(currentSong.cover)}
						alt={i18n(Key.musicPlayerCover)}
						class="w-full h-full object-cover transition-transform duration-300"
						class:spinning={isPlaying && !isLoading}
						class:animate-pulse={isLoading}
					/>
				</div>
				<div class="flex-1 min-w-0">
					<div
						class="song-title text-lg font-bold text-90 truncate mb-1"
					>
						{currentSong.title}
					</div>
					<div class="song-artist text-sm text-50 truncate">
						{currentSong.artist}
					</div>
					<div class="text-xs text-30 mt-1">
						{formatTime(currentTime)} / {formatTime(duration)}
					</div>
				</div>
				<div class="flex items-center gap-1">
					<button
						class="music-action-btn w-8 h-8 rounded-lg flex items-center justify-center"
						on:click={toggleHidden}
						title={i18n(Key.musicPlayerHide)}
					>
						<Icon
							icon="material-symbols:visibility-off"
							class="text-lg"
						/>
					</button>
					<button
						class="music-action-btn w-8 h-8 rounded-lg flex items-center justify-center"
						class:control-active={showPlaylist}
						on:click={togglePlaylist}
						title={i18n(Key.musicPlayerPlaylist)}
					>
						<Icon
							icon="material-symbols:queue-music"
							class="text-lg"
						/>
					</button>
				</div>
			</div>
			<div class="progress-section mb-4">
				<div
					class="progress-bar music-track flex-1 h-2 bg-(--btn-regular-bg) rounded-full cursor-pointer"
					bind:this={progressBar}
					on:click={setProgress}
					on:keydown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							const percent = 0.5;
							const newTime = percent * duration;
							if (audio) {
								audio.currentTime = newTime;
								currentTime = newTime;
							}
						}
					}}
					role="slider"
					tabindex="0"
					aria-label={i18n(Key.musicPlayerProgress)}
					aria-valuemin="0"
					aria-valuemax="100"
					aria-valuenow={duration > 0
						? (currentTime / duration) * 100
						: 0}
				>
					<div
						class="music-track-fill h-full bg-(--primary) rounded-full transition-all duration-100"
						style="width: {duration > 0
							? (currentTime / duration) * 100
							: 0}%"
					></div>
				</div>
			</div>
			<div class="controls flex items-center justify-center gap-2 mb-4">
				<button
					class="music-action-btn w-10 h-10 rounded-lg"
					class:control-active={isShuffled}
					on:click={toggleShuffle}
					disabled={playlist.length <= 1}
				>
					<Icon icon="material-symbols:shuffle" class="text-lg" />
				</button>
				<button
					class="music-action-btn w-10 h-10 rounded-lg"
					on:click={previousSong}
					disabled={playlist.length <= 1}
				>
					<Icon
						icon="material-symbols:skip-previous"
						class="text-xl"
					/>
				</button>
				<button
					class="play-main-btn w-12 h-12 rounded-full flex items-center justify-center"
					class:opacity-50={isLoading}
					disabled={isLoading}
					on:click={togglePlay}
				>
					{#if isLoading}
						<Icon icon="eos-icons:loading" class="text-xl" />
					{:else if isPlaying}
						<Icon icon="material-symbols:pause" class="text-xl" />
					{:else}
						<Icon
							icon="material-symbols:play-arrow"
							class="text-xl"
						/>
					{/if}
				</button>
				<button
					class="music-action-btn w-10 h-10 rounded-lg"
					on:click={() => nextSong()}
					disabled={playlist.length <= 1}
				>
					<Icon icon="material-symbols:skip-next" class="text-xl" />
				</button>
				<button
					class="music-action-btn w-10 h-10 rounded-lg"
					class:control-active={isRepeating > 0}
					on:click={toggleRepeat}
				>
					{#if isRepeating === 1}
						<Icon
							icon="material-symbols:repeat-one"
							class="text-lg"
						/>
					{:else if isRepeating === 2}
						<Icon icon="material-symbols:repeat" class="text-lg" />
					{:else}
						<Icon
							icon="material-symbols:repeat"
							class="text-lg opacity-50"
						/>
					{/if}
				</button>
			</div>
			<div class="bottom-controls flex items-center gap-2">
				<button
					class="music-action-btn w-8 h-8 rounded-lg"
					on:click={toggleMute}
				>
					{#if isMuted || volume === 0}
						<Icon
							icon="material-symbols:volume-off"
							class="text-lg"
						/>
					{:else if volume < 0.5}
						<Icon
							icon="material-symbols:volume-down"
							class="text-lg"
						/>
					{:else}
						<Icon
							icon="material-symbols:volume-up"
							class="text-lg"
						/>
					{/if}
				</button>
				<div
					class="music-track flex-1 h-2 bg-(--btn-regular-bg) rounded-full cursor-pointer touch-none"
					bind:this={volumeBar}
					on:pointerdown={startVolumeDrag}
					on:keydown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							if (e.key === "Enter") toggleMute();
						}
					}}
					role="slider"
					tabindex="0"
					aria-label={i18n(Key.musicPlayerVolume)}
					aria-valuemin="0"
					aria-valuemax="100"
					aria-valuenow={volume * 100}
				>
					<div
						class="music-track-fill h-full bg-(--primary) rounded-full transition-all"
						class:duration-100={!isVolumeDragging}
						class:duration-0={isVolumeDragging}
						style="width: {volume * 100}%"
					></div>
				</div>
				<button
					class="music-action-btn w-8 h-8 rounded-lg flex items-center justify-center"
					on:click={toggleExpanded}
					title={i18n(Key.musicPlayerCollapse)}
				>
					<Icon icon="material-symbols:expand-more" class="text-lg" />
				</button>
			</div>
		</div>
		{#if showPlaylist}
			<div
				class="playlist-panel music-surface float-panel fixed bottom-20 left-5 w-[22rem] max-h-[32rem] overflow-hidden z-50 flex flex-col rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-(--card-bg) border border-(--line-divider)/50"
				in:slide={{ duration: 300, axis: "y" }}
				out:slide={{ duration: 200, axis: "y" }}
			>
				<div
					class="flex flex-col pt-6 px-6 pb-3 border-b border-(--line-divider)/40 gap-4 shrink-0"
				>
					<div class="flex items-center justify-between w-full">
						<h3
							class="text-[1.35rem] font-bold text-90 tracking-wide"
						>
							{i18n(Key.musicPlayerPlaylist)}
						</h3>
						<button
							class="playlist-close-btn w-8 h-8 rounded-full flex items-center justify-center text-50 hover:text-90 hover:bg-(--btn-regular-bg) transition-colors"
							on:click={togglePlaylist}
						>
							<Icon
								icon="material-symbols:close-rounded"
								class="text-[1.35rem]"
							/>
						</button>
					</div>

					{#if playlistsConfig.length > 1}
						<div
							class="custom-scrollbar flex items-center gap-3 overflow-x-auto w-full pb-1"
						>
							{#each playlistsConfig as pConfig, pIndex}
								<button
									class="playlist-tab-btn shrink-0 px-4 py-1.5 text-[13px] font-medium rounded-full transition-all duration-300"
									class:tab-active={currentListIndex === pIndex}
									on:click={() => switchPlaylist(pIndex)}
								>
									{pConfig.name}
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<div
					class="custom-scrollbar playlist-content overflow-y-auto flex-1 p-2"
				>
					{#each playlist as song, index}
						<div
							class="playlist-item playlist-item-base flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-200"
							class:item-active={index === currentIndex}
							on:click={() => handlePlaylistClick(index)}
							on:keydown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									handlePlaylistClick(index);
								}
							}}
							role="button"
							tabindex="0"
							aria-label="播放 {song.title} - {song.artist}"
						>
							<div
								class="w-5 flex items-center justify-center shrink-0"
							>
								{#if index === currentIndex && isPlaying}
									<Icon
										icon="material-symbols:graphic-eq"
										class="text-(--primary) text-xl animate-pulse"
									/>
								{:else if index === currentIndex}
									<Icon
										icon="material-symbols:graphic-eq"
										class="text-(--primary) text-xl opacity-50"
									/>
								{:else}
									<span
										class="text-[15px] font-medium text-40"
										>{index + 1}</span
									>
								{/if}
							</div>

							<div
								class="w-[2.75rem] h-[2.75rem] rounded-lg overflow-hidden shrink-0 shadow-sm border border-black/5 dark:border-white/5 bg-(--btn-regular-bg)"
							>
								<img
									src={getAssetPath(song.cover)}
									alt={song.title}
									loading="lazy"
									class="w-full h-full object-cover"
								/>
							</div>

							<div
								class="flex-1 min-w-0 flex flex-col justify-center gap-[2px]"
							>
								<div
									class="text-[15px] font-medium truncate transition-colors {index ===
									currentIndex
										? 'text-(--primary)'
										: 'text-90'}"
								>
									{song.title}
								</div>
								<div
									class="text-[13px] truncate transition-colors {index ===
									currentIndex
										? 'text-(--primary)/80'
										: 'text-50'}"
								>
									{song.artist}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<style>
		/* 定制化横向和纵向滚动条，保留滑动体验但不臃肿 */
		.custom-scrollbar::-webkit-scrollbar {
			height: 4px;
			width: 4px;
		}
		.custom-scrollbar::-webkit-scrollbar-track {
			background: transparent;
		}
		.custom-scrollbar::-webkit-scrollbar-thumb {
			background: var(--btn-regular-bg);
			border-radius: 4px;
		}
		.custom-scrollbar::-webkit-scrollbar-thumb:hover {
			background: var(--primary);
		}

		.orb-player {
			position: relative;
			color: var(--primary);
			background: linear-gradient(
				160deg,
				color-mix(in oklab, var(--primary) 12%, var(--card-bg)) 0%,
				var(--card-bg) 80%
			);
			border: 1px solid
				color-mix(in oklab, var(--primary) 18%, var(--line-color));
			box-shadow:
				0 0 0 1px color-mix(in oklab, var(--primary) 25%, transparent),
				0 8px 24px color-mix(in oklab, var(--primary) 22%, transparent);
			backdrop-filter: blur(10px);
			-webkit-backdrop-filter: blur(10px);
			transition:
				transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
				box-shadow 0.28s cubic-bezier(0.22, 1, 0.36, 1),
				background 0.28s cubic-bezier(0.22, 1, 0.36, 1);
		}
		.orb-content {
			position: relative;
			z-index: 1;
			transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
		}
		.orb-icon {
			color: var(--primary);
			filter: drop-shadow(
				0 1px 0 color-mix(in oklab, var(--card-bg) 70%, transparent)
			);
			transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
		}
		.orb-spinner {
			width: 1.05rem;
			height: 1.05rem;
			border-radius: 9999px;
			border: 2px solid color-mix(in oklab, var(--primary) 28%, transparent);
			border-top-color: var(--primary);
			filter: drop-shadow(
				0 1px 0 color-mix(in oklab, var(--card-bg) 70%, transparent)
			);
			animation: orbSpin 0.95s linear infinite;
		}
		.orb-bar {
			background: color-mix(in oklab, var(--primary) 85%, white 15%);
			border-radius: 9999px;
			filter: drop-shadow(
				0 1px 0 color-mix(in oklab, var(--card-bg) 70%, transparent)
			);
		}
		.orb-player::before {
			content: "";
			position: absolute;
			inset: -0.125rem;
			background: linear-gradient(
				45deg,
				var(--primary),
				transparent,
				var(--primary)
			);
			border-radius: 50%;
			z-index: -1;
			opacity: 0;
			transition: opacity 0.3s ease;
		}
		.orb-player:hover::before {
			opacity: 0.22;
		}
		.orb-player:hover {
			box-shadow:
				0 0 0 1px color-mix(in oklab, var(--primary) 35%, transparent),
				0 12px 30px color-mix(in oklab, var(--primary) 30%, transparent);
		}
		.orb-player:hover .orb-icon,
		.orb-player:hover .orb-content {
			transform: scale(1.08);
		}
		.orb-player:active {
			background: color-mix(
				in oklab,
				var(--primary) 14%,
				var(--btn-card-bg-active)
			);
		}
		.orb-player .animate-pulse {
			animation: orbPulse 1.5s ease-in-out infinite;
		}
		.play-main-btn {
			color: var(--primary);
			background: linear-gradient(
				160deg,
				color-mix(in oklab, var(--primary) 12%, var(--card-bg)) 0%,
				var(--card-bg) 80%
			);
			border: 1px solid
				color-mix(in oklab, var(--primary) 18%, var(--line-color));
			box-shadow:
				0 0 0 1px color-mix(in oklab, var(--primary) 25%, transparent),
				0 8px 24px color-mix(in oklab, var(--primary) 22%, transparent);
			backdrop-filter: blur(8px);
			-webkit-backdrop-filter: blur(8px);
			transition:
				transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
				box-shadow 0.28s cubic-bezier(0.22, 1, 0.36, 1),
				background 0.28s cubic-bezier(0.22, 1, 0.36, 1);
		}
		.play-main-btn :global(svg) {
			transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
		}
		.play-main-btn:hover:not(:disabled) {
			transform: scale(1.03);
			box-shadow:
				0 0 0 1px color-mix(in oklab, var(--primary) 35%, transparent),
				0 12px 30px color-mix(in oklab, var(--primary) 30%, transparent);
		}
		.play-main-btn:hover:not(:disabled) :global(svg) {
			transform: scale(1.04);
		}
		.play-main-btn:active:not(:disabled) {
			transform: scale(0.94);
			background: color-mix(
				in oklab,
				var(--primary) 14%,
				var(--btn-card-bg-active)
			);
		}
		.music-surface {
			background: linear-gradient(
				180deg,
				color-mix(in oklab, var(--primary) 6%, var(--card-bg)) 0%,
				var(--card-bg) 35%
			) !important;
			border: 1px solid
				color-mix(in oklab, var(--primary) 20%, var(--line-color)) !important;
			box-shadow:
				0 0 0 1px color-mix(in oklab, var(--primary) 12%, transparent),
				0 14px 32px color-mix(in oklab, black 18%, transparent) !important;
			backdrop-filter: blur(10px);
			-webkit-backdrop-filter: blur(10px);
		}
		.music-action-btn,
		.playlist-close-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 0;
			line-height: 1;
			background: linear-gradient(
				160deg,
				color-mix(in oklab, var(--primary) 9%, var(--card-bg)) 0%,
				color-mix(in oklab, var(--primary) 3%, var(--card-bg)) 100%
			);
			border: 1px solid transparent;
			box-shadow: 0 0 0 1px
				color-mix(in oklab, var(--primary) 10%, transparent);
			transition:
				transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
				background 0.22s cubic-bezier(0.22, 1, 0.36, 1),
				box-shadow 0.22s cubic-bezier(0.22, 1, 0.36, 1),
				border-color 0.22s cubic-bezier(0.22, 1, 0.36, 1);
		}
		.playlist-tab-btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			padding: 0.375rem 1rem;
			line-height: 1.2;
			background: linear-gradient(
				160deg,
				color-mix(in oklab, var(--primary) 9%, var(--card-bg)) 0%,
				color-mix(in oklab, var(--primary) 3%, var(--card-bg)) 100%
			);
			border: 1px solid transparent;
			box-shadow: 0 0 0 1px
				color-mix(in oklab, var(--primary) 10%, transparent);
			min-height: 2.25rem;
		}
		.music-action-btn,
		.playlist-close-btn {
			color: var(--primary);
		}
		.playlist-tab-btn {
			color: var(--text-secondary);
		}
		.music-action-btn:hover,
		.playlist-close-btn:hover,
		.playlist-tab-btn:hover {
			background: color-mix(
				in oklab,
				var(--primary) 10%,
				var(--btn-regular-bg)
			);
			border-color: color-mix(
				in oklab,
				var(--primary) 20%,
				transparent
			);
			box-shadow:
				0 0 0 1px color-mix(in oklab, var(--primary) 22%, transparent),
				0 6px 16px color-mix(in oklab, var(--primary) 20%, transparent);
		}
		.music-action-btn:active,
		.playlist-close-btn:active,
		.playlist-tab-btn:active {
			transform: scale(0.94);
		}
		.music-action-btn:disabled {
			opacity: 0.45;
			cursor: not-allowed;
			box-shadow: none;
		}
		.controls .music-action-btn,
		.controls .play-main-btn {
			flex-shrink: 0;
			vertical-align: middle;
		}
		.controls .music-action-btn :global(svg),
		.controls .play-main-btn :global(svg) {
			display: block;
			line-height: 1;
		}
		.music-action-btn.control-active,
		.playlist-tab-btn.tab-active {
			background: color-mix(
				in oklab,
				var(--primary) 16%,
				var(--btn-card-bg-active)
			);
			border-color: color-mix(in oklab, var(--primary) 30%, transparent);
			box-shadow: inset 0 0 0 1px
				color-mix(in oklab, var(--primary) 22%, transparent);
		}
		.music-track {
			background: color-mix(in oklab, var(--primary) 9%, var(--line-color)) !important;
			border: 1px solid color-mix(in oklab, var(--primary) 16%, transparent);
		}
		.music-track-fill {
			background: color-mix(in oklab, var(--primary) 88%, white 12%) !important;
		}
		.playlist-item-base {
			border: 1px solid transparent;
			background: color-mix(in oklab, var(--primary) 4%, transparent);
		}
		.playlist-item-base:hover {
			border-color: color-mix(in oklab, var(--primary) 18%, transparent);
			box-shadow: inset 0 0 0 1px
				color-mix(in oklab, var(--primary) 16%, transparent);
		}
		.playlist-item-base.item-active {
			background: color-mix(in oklab, var(--primary) 12%, transparent);
			border-color: color-mix(in oklab, var(--primary) 28%, transparent);
			box-shadow: inset 0 0 0 1px
				color-mix(in oklab, var(--primary) 22%, transparent);
		}
		@keyframes orbPulse {
			0%,
			100% {
				transform: scaleY(0.5);
			}
			50% {
				transform: scaleY(1);
			}
		}
		.music-player.hidden-mode {
			width: 3rem;
			height: 3rem;
		}
		.music-player {
			max-width: 20rem;
			user-select: none;
			left: var(--music-player-left-desktop);
			bottom: var(--music-player-bottom-desktop);
		}
		.mini-player {
			width: 17.5rem;
			position: absolute;
			bottom: 0;
			left: 0;
		}
		.expanded-player {
			width: 20rem;
			position: absolute;
			bottom: 0;
			left: 0;
		}
		.animate-pulse {
			animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
		}
		@keyframes pulse {
			0%,
			100% {
				opacity: 1;
			}
			50% {
				opacity: 0.5;
			}
		}
		@keyframes orbSpin {
			to {
				transform: rotate(360deg);
			}
		}
		.progress-section div:hover,
		.bottom-controls > div:hover {
			transform: scaleY(1.2);
			transition: transform 0.2s ease;
		}
		@media (max-width: 768px) {
			.music-player {
				max-width: 280px !important;
				left: var(--music-player-left-mobile) !important;
				bottom: var(--music-player-bottom-mobile) !important;
			}
			.mini-player {
				width: 280px;
			}
			.music-player.expanded {
				width: calc(100vw - 16px);
				max-width: none;
				left: var(--music-player-expanded-left-mobile) !important;
			}
			.playlist-panel {
				width: calc(100vw - 16px) !important;
				left: var(--music-player-playlist-left-mobile) !important;
				bottom: var(--music-player-playlist-bottom-mobile) !important;
				max-width: none;
			}
			.controls {
				gap: 8px;
			}
			.controls button {
				width: 36px;
				height: 36px;
			}
			.controls button:nth-child(3) {
				width: 44px;
				height: 44px;
			}
		}
		@media (max-width: 480px) {
			.music-player {
				max-width: 260px;
			}
			.song-title {
				font-size: 14px;
			}
			.song-artist {
				font-size: 12px;
			}
			.controls {
				gap: 6px;
				margin-bottom: 12px;
			}
			.controls button {
				width: 32px;
				height: 32px;
			}
			.controls button:nth-child(3) {
				width: 40px;
				height: 40px;
			}
			.playlist-item {
				padding: 8px 12px;
			}
			.playlist-item .w-10 {
				width: 32px;
				height: 32px;
			}
		}
		@keyframes slide-up {
			from {
				transform: translateY(100%);
				opacity: 0;
			}
			to {
				transform: translateY(0);
				opacity: 1;
			}
		}
		.animate-slide-up {
			animation: slide-up 0.3s ease-out;
		}
		@media (hover: none) and (pointer: coarse) {
			.music-player button,
			.playlist-item {
				min-height: 44px;
			}
			.progress-section > div,
			.bottom-controls > div:nth-child(2) {
				height: 12px;
			}
		}
		@keyframes spin-continuous {
			from {
				transform: rotate(0deg);
			}
			to {
				transform: rotate(360deg);
			}
		}
		.cover-container img {
			animation: spin-continuous 3s linear infinite;
			animation-play-state: paused;
		}
		.cover-container img.spinning {
			animation-play-state: running;
		}
		button.bg-\[var\(--primary\)\] {
			box-shadow: 0 0 0 2px var(--primary);
			border: none;
		}
	</style>

	<style>
		.music-bar {
			transform-origin: bottom;
			animation: orbBarsWave 2.1s linear infinite;
			will-change: transform;
		}
		.bar-1 {
			height: 58%;
			animation-delay: 0ms;
		}
		.bar-2 {
			height: 90%;
			animation-delay: -420ms;
		}
		.bar-3 {
			height: 70%;
			animation-delay: -840ms;
		}
		.bar-4 {
			height: 82%;
			animation-delay: -1260ms;
		}
		.bar-5 {
			height: 52%;
			animation-delay: -1680ms;
		}
		@keyframes orbBarsWave {
			0% {
				transform: scaleY(0.34);
			}
			20% {
				transform: scaleY(0.92);
			}
			45% {
				transform: scaleY(0.52);
			}
			70% {
				transform: scaleY(0.88);
			}
			100% {
				transform: scaleY(0.34);
			}
		}
	</style>
{/if}
