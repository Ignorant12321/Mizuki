<script lang="ts">
	import Icon from "@iconify/svelte";
	import { onDestroy, onMount, tick } from "svelte";
	import { slide } from "svelte/transition";
	import { musicPlayerConfig, siteConfig } from "../../config";
	import Key from "../../i18n/i18nKey";
	import { i18n } from "../../i18n/translation";

	// 基础配置获取
	let globalMode = musicPlayerConfig.mode ?? "meting";
	let globalMetingApi = musicPlayerConfig.meting_api;
	const musicPlayerPosition = siteConfig.floatingWidgets?.musicPlayer ?? {
		desktop: { side: "left", offset: "1.25rem", bottom: "1rem" },
		mobile: { side: "left", offset: "1.3rem", bottom: "0.5rem" },
		mobileExpanded: { side: "left", offset: "0.5rem" },
		mobilePlaylist: { side: "left", offset: "0.5rem", bottom: "5rem" },
	};
	type FloatingWidgetSide = "left" | "right";
	type FloatingWidgetPosition = {
		side: FloatingWidgetSide;
		offset: string;
		bottom: string;
	};
	type FloatingWidgetHorizontalPosition = {
		side: FloatingWidgetSide;
		offset: string;
	};

	function getHorizontalInsetVars(position: FloatingWidgetHorizontalPosition) {
		return {
			left: position.side === "left" ? position.offset : "auto",
			right: position.side === "right" ? position.offset : "auto",
		};
	}

	function getInsetVars(position: FloatingWidgetPosition) {
		return {
			...getHorizontalInsetVars(position),
			bottom: position.bottom,
		};
	}

	const musicPlayerDesktopVars = getInsetVars(musicPlayerPosition.desktop);
	const musicPlayerMobileVars = getInsetVars(musicPlayerPosition.mobile);
	const musicPlayerExpandedMobileVars = getHorizontalInsetVars(
		musicPlayerPosition.mobileExpanded,
	);
	const musicPlayerPlaylistMobileVars = getInsetVars(
		musicPlayerPosition.mobilePlaylist,
	);
	const musicPlayerPositionStyle = `--music-player-left-desktop:${musicPlayerDesktopVars.left};--music-player-right-desktop:${musicPlayerDesktopVars.right};--music-player-bottom-desktop:${musicPlayerDesktopVars.bottom};--music-player-left-mobile:${musicPlayerMobileVars.left};--music-player-right-mobile:${musicPlayerMobileVars.right};--music-player-bottom-mobile:${musicPlayerMobileVars.bottom};--music-player-expanded-left-mobile:${musicPlayerExpandedMobileVars.left};--music-player-expanded-right-mobile:${musicPlayerExpandedMobileVars.right};--music-player-playlist-left-mobile:${musicPlayerPlaylistMobileVars.left};--music-player-playlist-right-mobile:${musicPlayerPlaylistMobileVars.right};--music-player-playlist-bottom-mobile:${musicPlayerPlaylistMobileVars.bottom};--music-player-content-left-desktop:${musicPlayerPosition.desktop.side === "left" ? "0" : "auto"};--music-player-content-right-desktop:${musicPlayerPosition.desktop.side === "right" ? "0" : "auto"};--music-player-content-left-mobile:${musicPlayerPosition.mobile.side === "left" ? "0" : "auto"};--music-player-content-right-mobile:${musicPlayerPosition.mobile.side === "right" ? "0" : "auto"};--music-player-content-left-expanded-mobile:${musicPlayerPosition.mobileExpanded.side === "left" ? "0" : "auto"};--music-player-content-right-expanded-mobile:${musicPlayerPosition.mobileExpanded.side === "right" ? "0" : "auto"};`;

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
		id: number | string;
		title: string;
		artist: string;
		cover: string;
		url: string;
		duration: number;
		lyric?: string;
		lyricUrl?: string;
	};

	type LyricLine = {
		time: number;
		text: string;
	};

	type ParsedLyric = {
		lines: LyricLine[];
		timed: boolean;
	};

	let playlist: Song[] = [];
	let currentIndex = 0;
	let audio: HTMLAudioElement;
	let progressBar: HTMLElement;
	let volumeBar: HTMLElement;
	let lyricContainer: HTMLDivElement;

	let lyricLines: LyricLine[] = [];
	let lyricIsTimed = false;
	let currentLyricIndex = -1;
	let lyricLoading = false;
	let lyricRequestToken = 0;
	let lyricCache: Record<string, ParsedLyric> = {};

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

	function normalizeDuration(duration: unknown): number {
		let dur = Number(duration ?? 0);
		if (dur > 10000) dur = Math.floor(dur / 1000);
		if (!Number.isFinite(dur) || dur <= 0) dur = 0;
		return dur;
	}

	function hasLyricTimestamp(text: string): boolean {
		return /\[\d{1,2}:\d{1,2}(?:\.\d{1,3})?\]/.test(text);
	}

	function isLikelyLyricUrl(value: string): boolean {
		const text = value.trim();
		if (!text) return false;
		if (/^(https?:)?\/\//.test(text)) return true;
		if (text.startsWith("/")) return true;
		if (/\.(lrc|txt)(\?.*)?$/i.test(text)) return true;
		if (!text.includes("\n") && !text.includes("[") && text.includes("/"))
			return true;
		return false;
	}

	function extractSongLyricFields(song: any): Pick<Song, "lyric" | "lyricUrl"> {
		const candidates: string[] = [];
		const pushCandidate = (value: unknown) => {
			if (typeof value !== "string") return;
			const trimmed = value.trim();
			if (!trimmed) return;
			candidates.push(trimmed);
		};

		pushCandidate(song.lyric);
		pushCandidate(song.lrc);
		pushCandidate(song?.lrc?.lyric);
		pushCandidate(song?.lrc?.url);
		pushCandidate(song?.lyric?.lyric);
		pushCandidate(song.lyricUrl);
		pushCandidate(song.lrcUrl);

		let lyric: string | undefined;
		let lyricUrl: string | undefined;
		for (const candidate of candidates) {
			if (!lyric && (hasLyricTimestamp(candidate) || candidate.includes("\n"))) {
				lyric = candidate;
				continue;
			}
			if (!lyricUrl && isLikelyLyricUrl(candidate)) {
				lyricUrl = candidate;
			}
		}

		if (!lyric && !lyricUrl && candidates.length > 0) {
			lyric = candidates[0];
		}

		return { lyric, lyricUrl };
	}

	function parseLocalSong(song: any): Song {
		const { lyric, lyricUrl } = extractSongLyricFields(song);
		return {
			id: song.id ?? `${song.title ?? "song"}-${song.url ?? ""}`,
			title: song.title ?? i18n(Key.unknownSong),
			artist: song.artist ?? song.author ?? i18n(Key.unknownArtist),
			cover: song.cover ?? song.pic ?? "",
			url: song.url ?? "",
			duration: normalizeDuration(song.duration),
			lyric,
			lyricUrl,
		};
	}

	function parseLyricText(rawText: string): ParsedLyric {
		const source = rawText.replace(/\uFEFF/g, "").trim();
		if (!source) return { lines: [], timed: false };

		const result: LyricLine[] = [];
		let hasTimedLine = false;
		const rows = source.split(/\r?\n/);
		const timeTagReg = /\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?\]/g;

		for (const row of rows) {
			const matches = [...row.matchAll(timeTagReg)];
			const text = row.replace(/\[[^\]]*]/g, "").trim();
			if (matches.length === 0) continue;

			hasTimedLine = true;
			const normalizedText = text || "♪";
			for (const match of matches) {
				const min = Number(match[1] ?? 0);
				const sec = Number(match[2] ?? 0);
				const msRaw = match[3] ?? "0";
				const ms = Number(msRaw.padEnd(3, "0").slice(0, 3));
				const time = min * 60 + sec + ms / 1000;
				result.push({ time, text: normalizedText });
			}
		}

		if (hasTimedLine) {
			result.sort((a, b) => a.time - b.time);
			const deduped = result.filter((line, index, arr) => {
				if (index === 0) return true;
				const prev = arr[index - 1];
				return prev.time !== line.time || prev.text !== line.text;
			});
			return { lines: deduped, timed: true };
		}

		const plainLines = rows.map((line) => line.trim()).filter(Boolean);
		if (plainLines.length === 0) return { lines: [], timed: false };
		return {
			lines: plainLines.map((text, index) => ({ time: index * 5, text })),
			timed: false,
		};
	}

	function clearLyrics() {
		lyricLines = [];
		lyricIsTimed = false;
		currentLyricIndex = -1;
		lyricLoading = false;
	}

	function getLyricCacheKey(song: Song): string {
		return `${song.id ?? "unknown"}::${song.url}`;
	}

	async function fetchLyricByUrl(url: string): Promise<string> {
		try {
			const response = await fetch(getAssetPath(url));
			if (!response.ok) return "";
			return await response.text();
		} catch {
			return "";
		}
	}

	async function resolveSongLyricText(song: Song): Promise<string> {
		if (song.lyric) {
			if (isLikelyLyricUrl(song.lyric) && !hasLyricTimestamp(song.lyric)) {
				const remoteLyric = await fetchLyricByUrl(song.lyric);
				if (remoteLyric) return remoteLyric;
			} else {
				return song.lyric;
			}
		}

		if (song.lyricUrl) {
			return await fetchLyricByUrl(song.lyricUrl);
		}

		return "";
	}

	async function applyLyricResult(parsed: ParsedLyric) {
		lyricLines = parsed.lines;
		lyricIsTimed = parsed.timed;
		currentLyricIndex = -1;
		lyricLoading = false;
		syncLyricWithCurrentTime();
		await tick();
		scrollActiveLyricLine("auto");
	}

	function syncLyricWithCurrentTime() {
		if (!lyricIsTimed || lyricLines.length === 0) {
			currentLyricIndex = -1;
			return;
		}
		const time = Number.isFinite(currentTime) ? currentTime : 0;
		let activeIndex = -1;
		for (let i = 0; i < lyricLines.length; i++) {
			if (time >= lyricLines[i].time) {
				activeIndex = i;
			} else {
				break;
			}
		}

		if (activeIndex !== currentLyricIndex) {
			currentLyricIndex = activeIndex;
			scrollActiveLyricLine("auto");
		}
	}

	function scrollActiveLyricLine(behavior: ScrollBehavior = "smooth") {
		if (!lyricContainer || currentLyricIndex < 0) return;
		const activeLine = lyricContainer.querySelector<HTMLElement>(
			`[data-lyric-index="${currentLyricIndex}"]`,
		);
		if (!activeLine) return;

		const containerRect = lyricContainer.getBoundingClientRect();
		const lineRect = activeLine.getBoundingClientRect();
		const containerCenterY = containerRect.top + containerRect.height / 2;
		const lineCenterY = lineRect.top + lineRect.height / 2;
		const delta = lineCenterY - containerCenterY;
		const maxScrollTop =
			lyricContainer.scrollHeight - lyricContainer.clientHeight;
		const targetTop = Math.max(
			0,
			Math.min(maxScrollTop, lyricContainer.scrollTop + delta),
		);

		lyricContainer.scrollTo({
			top: targetTop,
			behavior,
		});
	}

	async function loadLyricsForSong(song: Song) {
		const cacheKey = getLyricCacheKey(song);
		const requestToken = ++lyricRequestToken;
		currentLyricIndex = -1;

		if (!song.url) {
			clearLyrics();
			return;
		}

		if (lyricCache[cacheKey]) {
			await applyLyricResult(lyricCache[cacheKey]);
			return;
		}

		lyricLoading = true;
		try {
			const rawLyric = await resolveSongLyricText(song);
			if (requestToken !== lyricRequestToken) return;

			const parsed = parseLyricText(rawLyric);
			lyricCache[cacheKey] = parsed;
			await applyLyricResult(parsed);
		} catch {
			if (requestToken !== lyricRequestToken) return;
			const parsed = { lines: [], timed: false };
			lyricCache[cacheKey] = parsed;
			await applyLyricResult(parsed);
		}
	}

	function handleTimeUpdate() {
		if (!audio) return;
		currentTime = audio.currentTime;
		syncLyricWithCurrentTime();
	}

	function parseMetingSong(song: any): Song {
		let title = song.name ?? song.title ?? i18n(Key.unknownSong);
		let artist = song.artist ?? song.author ?? i18n(Key.unknownArtist);
		const { lyric, lyricUrl } = extractSongLyricFields(song);
		return {
			id: song.id ?? `${title}-${song.url ?? ""}`,
			title,
			artist,
			cover: song.pic ?? "",
			url: song.url ?? "",
			duration: normalizeDuration(song.duration),
			lyric,
			lyricUrl,
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
			const safeLocalData = Array.isArray(localData) ? localData : [];
			playlistCache[cacheKey] = safeLocalData.map(parseLocalSong);
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
			const safeList = Array.isArray(list) ? list : [];
			const newPlaylist = safeList.map(parseMetingSong);

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

	function loadSong(song: Song) {
		if (!song) return;
		if (song.url !== currentSong.url) {
			currentSong = { ...song };
			currentTime = 0;
			duration = song.duration ?? 0;
			currentLyricIndex = -1;
			if (song.url) {
				isLoading = true;
				loadLyricsForSong(song);
			} else {
				isLoading = false;
				clearLyrics();
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
		syncLyricWithCurrentTime();
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

	$: if (isExpanded && lyricContainer && currentLyricIndex >= 0) {
		scrollActiveLyricLine("auto");
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
	on:timeupdate={handleTimeUpdate}
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
	<div class="music-player-anchor" style={musicPlayerPositionStyle}>
	{#if showError}
		<div class="music-player-error z-60 max-w-sm">
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
					class="cover-container music-cover relative w-12 h-12 rounded-full overflow-hidden cursor-pointer"
					class:spinning={isPlaying && !isLoading}
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
					<div class="cover-disc" class:spinning={isPlaying && !isLoading}>
						<div class="cover-label">
							<img
								src={getAssetPath(currentSong.cover)}
								alt={i18n(Key.musicPlayerCover)}
								class="cover-art w-full h-full object-cover transition-transform duration-300"
								class:animate-pulse={isLoading}
							/>
						</div>
						<span class="cover-hole" aria-hidden="true"></span>
					</div>
					<div
						class="cover-hover-mask absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
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
					class="cover-container music-cover relative w-16 h-16 rounded-full overflow-hidden shrink-0"
					class:spinning={isPlaying && !isLoading}
				>
					<div class="cover-disc" class:spinning={isPlaying && !isLoading}>
						<div class="cover-label">
							<img
								src={getAssetPath(currentSong.cover)}
								alt={i18n(Key.musicPlayerCover)}
								class="cover-art w-full h-full object-cover transition-transform duration-300"
								class:animate-pulse={isLoading}
							/>
						</div>
						<span class="cover-hole" aria-hidden="true"></span>
					</div>
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
				<div class="progress-row flex items-center gap-2">
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
					<div class="progress-time shrink-0 text-xs text-30 tabular-nums">
						{formatTime(currentTime)} / {formatTime(duration)}
					</div>
				</div>
			</div>
			<div class="lyrics-section mb-4">
				<div class="lyrics-panel custom-scrollbar" bind:this={lyricContainer}>
					{#if lyricLoading}
						<p class="lyrics-placeholder">歌词加载中...</p>
					{:else if lyricLines.length === 0}
						<p class="lyrics-placeholder">暂无歌词</p>
					{:else}
						<div class="lyrics-spacer" aria-hidden="true"></div>
						{#each lyricLines as line, lyricIndex}
							<p
								class="lyric-line"
								class:active={lyricIsTimed &&
									lyricIndex === currentLyricIndex}
								data-lyric-index={lyricIndex}
							>
								{line.text}
							</p>
						{/each}
						<div class="lyrics-spacer" aria-hidden="true"></div>
					{/if}
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
				class="playlist-panel music-surface float-panel w-[22rem] max-h-[32rem] overflow-hidden z-50 flex flex-col rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-(--card-bg) border border-(--line-divider)/50"
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
	</div>

	<style>
		/* 定制化横向和纵向滚动条，保留滑动体验但不臃肿 */
		.music-player-anchor {
			--music-player-left: var(--music-player-left-desktop);
			--music-player-right: var(--music-player-right-desktop);
			--music-player-bottom: var(--music-player-bottom-desktop);
			--music-player-content-left: var(--music-player-content-left-desktop);
			--music-player-content-right: var(--music-player-content-right-desktop);
			--music-player-expanded-left: var(--music-player-expanded-left-mobile);
			--music-player-expanded-right: var(
				--music-player-expanded-right-mobile
			);
			--music-player-playlist-left: var(--music-player-left-desktop);
			--music-player-playlist-right: var(--music-player-right-desktop);
			--music-player-playlist-bottom: calc(
				var(--music-player-bottom-desktop) + 4rem
			);
		}
		.music-player-error {
			position: fixed;
			left: var(--music-player-left);
			right: var(--music-player-right);
			bottom: calc(var(--music-player-bottom) + 4rem);
		}
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
		.music-action-btn,
		.play-main-btn {
			flex: 0 0 auto;
			aspect-ratio: 1 / 1;
			box-sizing: border-box;
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
		.lyrics-panel {
			max-height: 8rem;
			overflow-y: auto;
			padding: 0.625rem 0.75rem;
			border-radius: 0.875rem;
			background: color-mix(in oklab, var(--primary) 5%, var(--card-bg));
			border: 1px solid color-mix(in oklab, var(--primary) 14%, transparent);
			scroll-behavior: smooth;
		}
		.lyrics-spacer {
			height: 2.75rem;
			pointer-events: none;
		}
		.lyric-line {
			margin: 0.25rem 0;
			font-size: 0.8rem;
			line-height: 1.45;
			text-align: center;
			color: var(--text-secondary);
			opacity: 0.72;
			transition:
				color 0.22s ease,
				opacity 0.22s ease,
				transform 0.22s ease;
		}
		.lyric-line.active {
			color: var(--primary);
			opacity: 1;
			font-weight: 600;
			transform: scale(1.02);
		}
		.lyrics-placeholder {
			margin: 0;
			padding: 1.2rem 0;
			font-size: 0.8rem;
			text-align: center;
			color: var(--text-tertiary);
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
			left: var(--music-player-left);
			right: var(--music-player-right);
			bottom: var(--music-player-bottom);
		}
		.mini-player {
			width: 17.5rem;
			position: absolute;
			bottom: 0;
			left: var(--music-player-content-left);
			right: var(--music-player-content-right);
		}
		.expanded-player {
			width: 20rem;
			position: absolute;
			bottom: 0;
			left: var(--music-player-content-left);
			right: var(--music-player-content-right);
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
		.progress-bar:hover,
		.bottom-controls > div:hover {
			transform: scaleY(1.2);
			transition: transform 0.2s ease;
		}
		.playlist-panel {
			position: fixed;
			left: var(--music-player-playlist-left);
			right: var(--music-player-playlist-right);
			bottom: var(--music-player-playlist-bottom);
		}
		@media (max-width: 768px) {
			.music-player-anchor {
				--music-player-left: var(--music-player-left-mobile);
				--music-player-right: var(--music-player-right-mobile);
				--music-player-bottom: var(--music-player-bottom-mobile);
				--music-player-content-left: var(--music-player-content-left-mobile);
				--music-player-content-right: var(--music-player-content-right-mobile);
				--music-player-expanded-left: var(--music-player-expanded-left-mobile);
				--music-player-expanded-right: var(
					--music-player-expanded-right-mobile
				);
				--music-player-playlist-left: var(
					--music-player-playlist-left-mobile
				);
				--music-player-playlist-right: var(
					--music-player-playlist-right-mobile
				);
				--music-player-playlist-bottom: var(
					--music-player-playlist-bottom-mobile
				);
			}
			.music-player {
				max-width: 280px !important;
				left: var(--music-player-left) !important;
				right: var(--music-player-right) !important;
				bottom: var(--music-player-bottom) !important;
			}
			.mini-player {
				width: 280px;
			}
			.music-player.expanded {
				--music-player-content-left: var(
					--music-player-content-left-expanded-mobile
				);
				--music-player-content-right: var(
					--music-player-content-right-expanded-mobile
				);
				width: calc(100vw - 16px);
				max-width: none;
				left: var(--music-player-expanded-left) !important;
				right: var(--music-player-expanded-right) !important;
			}
			.playlist-panel {
				width: calc(100vw - 16px) !important;
				left: var(--music-player-playlist-left) !important;
				right: var(--music-player-playlist-right) !important;
				bottom: var(--music-player-playlist-bottom) !important;
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
			.progress-row {
				gap: 0.5rem;
			}
			.progress-time {
				font-size: 0.68rem;
			}
			.lyrics-panel {
				max-height: 6.75rem;
			}
			.lyrics-spacer {
				height: 2.2rem;
			}
			.lyric-line {
				font-size: 0.75rem;
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
			.music-player .playlist-tab-btn,
			.playlist-item {
				min-height: 44px;
			}
			.music-player .music-action-btn,
			.music-player .play-main-btn {
				min-height: 0;
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
		.music-cover {
			isolation: isolate;
			border: 1px solid color-mix(in oklab, white 16%, var(--line-color));
			background: radial-gradient(
				circle at 50% 50%,
				color-mix(in oklab, white 10%, var(--card-bg)) 0% 15%,
				color-mix(in oklab, black 54%, var(--card-bg)) 16% 56%,
				color-mix(in oklab, black 70%, var(--card-bg)) 57% 100%
			);
			box-shadow:
				0 8px 16px color-mix(in oklab, black 30%, transparent),
				inset 0 0 0 1px color-mix(in oklab, white 16%, transparent),
				inset 0 0 16px color-mix(in oklab, black 20%, transparent);
			transition:
				transform 0.25s ease,
				box-shadow 0.25s ease,
				border-color 0.25s ease;
		}
		.music-cover .cover-disc {
			position: absolute;
			inset: 0;
			border-radius: inherit;
			transform-origin: center;
			will-change: transform;
			background: radial-gradient(
				circle at 50% 50%,
				color-mix(in oklab, white 12%, var(--card-bg)) 0% 8%,
				color-mix(in oklab, black 56%, var(--card-bg)) 9% 32%,
				color-mix(in oklab, black 72%, var(--card-bg)) 33% 100%
			);
		}
		.music-cover .cover-disc::before,
		.music-cover .cover-disc::after {
			content: "";
			position: absolute;
			inset: 0;
			border-radius: inherit;
			pointer-events: none;
		}
		.music-cover .cover-disc::before {
			inset: 2px;
			background: repeating-radial-gradient(
				circle at 50% 50%,
				color-mix(in oklab, white 24%, transparent) 0 0.75px,
				color-mix(in oklab, black 12%, transparent) 1.25px 2.75px
			);
			opacity: 0.42;
			box-shadow: inset 0 0 0 1px color-mix(in oklab, white 12%, transparent);
			z-index: 1;
		}
		.music-cover .cover-disc::after {
			background:
				linear-gradient(
					130deg,
					color-mix(in oklab, white 36%, transparent) 0%,
					transparent 42%
				),
				radial-gradient(
					circle at 30% 24%,
					color-mix(in oklab, white 22%, transparent) 0% 18%,
					transparent 38%
				);
			mix-blend-mode: screen;
			opacity: 0.52;
			z-index: 4;
		}
		.music-cover .cover-label {
			position: absolute;
			inset: 20%;
			z-index: 2;
			border-radius: 9999px;
			overflow: hidden;
			background: radial-gradient(
				circle,
				color-mix(in oklab, var(--primary) 20%, var(--card-bg)) 0%,
				color-mix(in oklab, black 20%, var(--card-bg)) 100%
			);
			border: 1px solid color-mix(in oklab, white 26%, transparent);
			box-shadow:
				0 2px 6px color-mix(in oklab, black 26%, transparent),
				inset 0 0 0 1px color-mix(in oklab, white 12%, transparent);
		}
		.music-cover .cover-label::after {
			content: "";
			position: absolute;
			inset: 10%;
			border-radius: inherit;
			border: 1px solid color-mix(in oklab, white 24%, transparent);
			pointer-events: none;
			z-index: 3;
		}
		.music-cover .cover-hole {
			position: absolute;
			top: 50%;
			left: 50%;
			width: 10%;
			height: 10%;
			transform: translate(-50%, -50%);
			z-index: 5;
			border-radius: 9999px;
			background: radial-gradient(
				circle,
				color-mix(in oklab, black 92%, transparent) 0% 60%,
				color-mix(in oklab, white 24%, transparent) 61% 100%
			);
			box-shadow: 0 0 0 1px color-mix(in oklab, black 42%, transparent);
		}
		.music-cover:hover {
			transform: translateY(-1px) scale(1.02);
			border-color: color-mix(in oklab, var(--primary) 24%, var(--line-color));
			box-shadow:
				0 8px 18px color-mix(in oklab, black 34%, transparent),
				inset 0 0 0 1px color-mix(in oklab, var(--primary) 12%, transparent),
				inset 0 0 18px color-mix(in oklab, black 32%, transparent);
		}
		.music-cover:active {
			transform: scale(0.98);
		}
		.music-cover:hover .cover-disc {
			transform: scale(1.02);
		}
		.music-cover .cover-art {
			position: relative;
			z-index: 2;
			transform: scale(1.08);
			filter: saturate(1.08) contrast(1.05) brightness(1.04);
			will-change: transform;
		}
		.music-cover .cover-hover-mask {
			z-index: 6;
			background: radial-gradient(
				circle at 50% 50%,
				color-mix(in oklab, black 24%, transparent) 0% 35%,
				color-mix(in oklab, black 62%, transparent) 100%
			);
		}
		.music-cover .cover-disc.spinning {
			animation: spin-continuous 5.2s linear infinite;
		}
		.music-cover.spinning .cover-disc::after {
			animation: spin-continuous 11s linear infinite reverse;
		}
		:global(html.dark) .music-cover,
		:global(.dark) .music-cover {
			border-color: color-mix(in oklab, white 28%, var(--line-color));
			box-shadow:
				0 10px 20px color-mix(in oklab, black 46%, transparent),
				inset 0 0 0 1px color-mix(in oklab, white 24%, transparent),
				inset 0 0 14px color-mix(in oklab, white 8%, transparent);
		}
		:global(html.dark) .music-cover .cover-disc::before,
		:global(.dark) .music-cover .cover-disc::before {
			opacity: 0.5;
		}
		:global(html.dark) .music-cover .cover-disc::after,
		:global(.dark) .music-cover .cover-disc::after {
			opacity: 0.6;
		}
		:global(html.dark) .music-cover .cover-label,
		:global(.dark) .music-cover .cover-label {
			border-color: color-mix(in oklab, white 36%, transparent);
			box-shadow:
				0 2px 8px color-mix(in oklab, black 40%, transparent),
				inset 0 0 0 1px color-mix(in oklab, white 16%, transparent);
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
