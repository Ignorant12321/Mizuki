import Key from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";

import {
	DEFAULT_SONG,
	LOCAL_PLAYLIST,
	SKIP_ERROR_DELAY,
	STORAGE_KEY_VOLUME,
} from "@/components/widgets/music-player/constants";
import type { RepeatMode, Song } from "@/components/widgets/music-player/types";
import { musicPlayerConfig } from "@/config";
import {
	buildPlaylistCacheKey,
	resolvePlaylistsFromConfig,
	type ResolvedPlaylistConfig,
} from "./musicPlaylistConfig";

export interface MusicPlayerState {
	currentSong: Song;
	playlist: Song[];
	playlists: ResolvedPlaylistConfig[];
	currentPlaylistIndex: number;
	currentPlaylistName: string;
	isPlaylistLoading: boolean;
	currentIndex: number;
	isPlaying: boolean;
	isLoading: boolean;
	currentTime: number;
	duration: number;
	volume: number;
	isMuted: boolean;
	isShuffled: boolean;
	isRepeating: RepeatMode;
	showPlaylist: boolean;
	errorMessage: string;
	showError: boolean;
	isExpanded: boolean;
	isHidden: boolean;
	autoplayFailed: boolean;
	willAutoPlay: boolean;
}

function getAssetPath(path: string): string {
	if (!path) {
		return "";
	}
	if (path.startsWith("http://") || path.startsWith("https://")) {
		return path;
	}
	if (path.startsWith("/")) {
		return path;
	}
	return `/${path}`;
}

class MusicPlayerStore {
	private audio: HTMLAudioElement | null = null;
	private state: MusicPlayerState;
	private isInitialized = false;
	private unregisterInteraction: (() => void) | undefined;
	private playlistRequestToken = 0;
	private playlistCache = new Map<string, Song[]>();
	private listeners = new Set<(state: MusicPlayerState) => void>();

	constructor() {
		this.state = this.createInitialState();
	}

	private createInitialState(): MusicPlayerState {
		return {
			currentSong: { ...DEFAULT_SONG },
			playlist: [],
			playlists: [],
			currentPlaylistIndex: 0,
			currentPlaylistName: "",
			isPlaylistLoading: false,
			currentIndex: 0,
			isPlaying: false,
			isLoading: false,
			currentTime: 0,
			duration: 0,
			volume: 0.7,
			isMuted: false,
			isShuffled: false,
			isRepeating: 2,
			showPlaylist: false,
			errorMessage: "",
			showError: false,
			isExpanded: false,
			isHidden: false,
			autoplayFailed: false,
			willAutoPlay: false,
		};
	}

	private createSnapshot(): MusicPlayerState {
		return {
			...this.state,
			currentSong: { ...this.state.currentSong },
			playlist: this.state.playlist.map((song) => ({ ...song })),
			playlists: this.state.playlists.map((playlist) => ({
				...playlist,
			})),
		};
	}

	getState(): MusicPlayerState {
		return this.createSnapshot();
	}

	getAudio(): HTMLAudioElement | null {
		return this.audio;
	}

	subscribe(listener: (state: MusicPlayerState) => void): () => void {
		this.listeners.add(listener);
		listener(this.createSnapshot());
		return () => {
			this.listeners.delete(listener);
		};
	}

	async initialize(): Promise<void> {
		if (typeof window === "undefined" || this.isInitialized) {
			return;
		}
		this.isInitialized = true;

		if (!musicPlayerConfig.enable) {
			return;
		}

		this.audio = new Audio();
		this.setupAudioListeners();
		this.loadVolumeFromStorage();
		this.registerInteractionHandler();
		await this.loadPlaylist();
	}

	private setupAudioListeners(): void {
		if (!this.audio) {
			return;
		}

		this.audio.volume = this.state.volume;
		this.audio.muted = this.state.isMuted;

		this.audio.addEventListener("play", () => {
			this.state.isPlaying = true;
			this.broadcastState();
		});

		this.audio.addEventListener("pause", () => {
			this.state.isPlaying = false;
			this.broadcastState();
		});

		this.audio.addEventListener("timeupdate", () => {
			if (this.audio) {
				this.state.currentTime = this.audio.currentTime;
				this.broadcastState();
			}
		});

		this.audio.addEventListener("ended", () => {
			this.handleAudioEnded();
		});

		this.audio.addEventListener("error", () => {
			this.handleAudioError();
		});

		this.audio.addEventListener("loadeddata", () => {
			this.handleAudioLoaded();
		});

		this.audio.addEventListener("loadstart", () => {
			this.state.isLoading = true;
			this.broadcastState();
		});
	}

	private handleAudioEnded(): void {
		if (this.state.isRepeating === 1) {
			if (this.audio) {
				this.audio.currentTime = 0;
				this.audio.play().catch(() => {});
			}
		} else {
			this.next(true);
		}
	}

	private handleAudioError(): void {
		this.state.isLoading = false;
		this.showError(i18n(Key.musicPlayerErrorSong));

		if (this.state.playlist.length > 1) {
			setTimeout(
				() =>
					this.next(
						this.state.isPlaying || this.state.willAutoPlay,
					),
				SKIP_ERROR_DELAY,
			);
		} else if (this.state.playlist.length <= 1) {
			this.showError(i18n(Key.musicPlayerErrorEmpty));
		}
		this.broadcastState();
	}

	private handleAudioLoaded(): void {
		this.state.isLoading = false;
		if (this.audio?.duration && this.audio.duration > 1) {
			this.state.duration = Math.floor(this.audio.duration);
			this.state.currentSong = {
				...this.state.currentSong,
				duration: this.state.duration,
			};
		}

		if (this.state.willAutoPlay || this.state.isPlaying) {
			const playPromise = this.audio?.play();
			if (playPromise !== undefined) {
				playPromise.catch(() => {
					this.state.autoplayFailed = true;
					this.state.isPlaying = false;
				});
			}
		}
		this.broadcastState();
	}

	private loadVolumeFromStorage(): void {
		if (typeof localStorage !== "undefined") {
			const savedVolume = localStorage.getItem(STORAGE_KEY_VOLUME);
			if (savedVolume) {
				const volume = parseFloat(savedVolume);
				if (!isNaN(volume) && volume >= 0 && volume <= 1) {
					this.state.volume = volume;
					this.state.isMuted = volume === 0;
					if (this.audio) {
						this.audio.volume = volume;
						this.audio.muted = this.state.isMuted;
					}
				}
			}
		}
	}

	private registerInteractionHandler(): void {
		const handler = () => {
			if (this.state.autoplayFailed && this.audio) {
				const playPromise = this.audio.play();
				if (playPromise !== undefined) {
					playPromise
						.then(() => {
							this.state.autoplayFailed = false;
						})
						.catch(() => {});
				}
			}
		};
		document.addEventListener("click", handler, { once: true });
		document.addEventListener("keydown", handler, { once: true });
		this.unregisterInteraction = () => {
			document.removeEventListener("click", handler);
			document.removeEventListener("keydown", handler);
		};
	}

	private async loadPlaylist(): Promise<void> {
		const playlists = resolvePlaylistsFromConfig(musicPlayerConfig);
		this.state.playlists = playlists;
		this.state.currentPlaylistIndex = 0;
		this.state.currentPlaylistName = playlists[0]?.name ?? "";

		if (playlists.length === 0) {
			this.showError(i18n(Key.musicPlayerErrorNoPlaylists));
			this.broadcastState();
			return;
		}

		await this.loadPlaylistAtIndex(0, false);
	}

	private cloneSongs(songs: Song[]): Song[] {
		return songs.map((song) => ({ ...song }));
	}

	private async loadPlaylistAtIndex(
		index: number,
		autoPlay: boolean,
	): Promise<void> {
		const source = this.state.playlists[index];
		if (!source) {
			return;
		}

		this.state.currentPlaylistIndex = index;
		this.state.currentPlaylistName = source.name;
		this.state.isPlaylistLoading = true;
		this.state.isLoading = false;
		this.broadcastState();

		if (this.audio) {
			this.audio.pause();
		}

		const shouldAutoPlay = autoPlay;
		const requestToken = ++this.playlistRequestToken;

		if (source.mode === "local") {
			const cacheKey = buildPlaylistCacheKey(source);
			this.playlistCache.set(cacheKey, this.cloneSongs(LOCAL_PLAYLIST));
			this.applyPlaylistSongs(
				index,
				this.cloneSongs(LOCAL_PLAYLIST),
				shouldAutoPlay,
			);
			this.state.isPlaylistLoading = false;
			this.broadcastState();
			return;
		}

		const cacheKey = buildPlaylistCacheKey(source);
		const cachedSongs = this.playlistCache.get(cacheKey);
		if (cachedSongs) {
			this.applyPlaylistSongs(
				index,
				this.cloneSongs(cachedSongs),
				shouldAutoPlay,
			);
			this.state.isPlaylistLoading = false;
			this.broadcastState();
			return;
		}

		this.state.playlist = [];
		this.state.currentIndex = 0;
		this.resetCurrentTrack();
		this.broadcastState();

		const songs = await this.fetchMetingSongs(source, requestToken);
		if (requestToken !== this.playlistRequestToken) {
			return;
		}

		if (!songs) {
			this.state.isPlaylistLoading = false;
			this.broadcastState();
			return;
		}

		this.playlistCache.set(cacheKey, this.cloneSongs(songs));
		this.applyPlaylistSongs(index, songs, shouldAutoPlay);
		this.state.isPlaylistLoading = false;
		this.broadcastState();
	}

	selectPlaylist(index: number): void {
		if (index < 0 || index >= this.state.playlists.length) {
			return;
		}

		if (
			index === this.state.currentPlaylistIndex &&
			this.state.playlist.length > 0
		) {
			return;
		}

		const shouldAutoPlay = this.state.isPlaying;
		void this.loadPlaylistAtIndex(index, shouldAutoPlay);
	}

	private applyPlaylistSongs(
		index: number,
		songs: Song[],
		autoPlay: boolean,
	): void {
		this.state.playlist = this.cloneSongs(songs);
		this.state.currentIndex = 0;
		if (this.state.playlist.length === 0) {
			this.resetCurrentTrack();
			this.showError(i18n(Key.musicPlayerErrorEmpty));
			return;
		}
		this.loadSong(this.state.playlist[0], autoPlay);
		this.state.currentPlaylistIndex = index;
		this.state.currentPlaylistName =
			this.state.playlists[index]?.name ?? this.state.currentPlaylistName;
	}

	private resetCurrentTrack(): void {
		this.state.currentSong = { ...DEFAULT_SONG };
		this.state.currentIndex = 0;
		this.state.currentTime = 0;
		this.state.duration = 0;
		this.state.isLoading = false;
		this.state.willAutoPlay = false;
		if (this.audio) {
			this.audio.removeAttribute("src");
			this.audio.load();
		}
	}

	private async fetchMetingSongs(
		source: ResolvedPlaylistConfig,
		requestToken: number,
	): Promise<Song[] | null> {
		const { meting_api, server, type, id } = source;
		if (!meting_api || !id) {
			this.state.isLoading = false;
			if (requestToken === this.playlistRequestToken) {
				this.showError(i18n(Key.musicPlayerErrorPlaylist));
			}
			return null;
		}

		this.state.isLoading = true;
		this.broadcastState();

		const apiUrl = meting_api
			.replace(":server", server)
			.replace(":type", type)
			.replace(":id", id)
			.replace(":auth", "")
			.replace(":r", Date.now().toString());

		try {
			const res = await fetch(apiUrl);
			if (!res.ok) {
				throw new Error("meting api error");
			}
			const list: any[] = await res.json();
			return list.map((song) => this.convertMetingSong(song));
		} catch (_error) {
			this.state.isLoading = false;
			if (requestToken === this.playlistRequestToken) {
				this.showError(i18n(Key.musicPlayerErrorPlaylist));
			}
			return null;
		}
	}

	private convertMetingSong(song: any): Song {
		const title = song.name ?? song.title ?? i18n(Key.unknownSong);
		const artist = song.artist ?? song.author ?? i18n(Key.unknownArtist);
		let dur = song.duration ?? 0;
		if (typeof dur === "string") {
			dur = parseInt(dur, 10);
		}
		if (dur > 10000) {
			dur = Math.floor(dur / 1000);
		}
		if (!Number.isFinite(dur) || dur <= 0) {
			dur = 0;
		}

		return {
			id:
				typeof song.id === "string"
					? parseInt(song.id, 10)
					: (song.id ?? 0),
			title,
			artist,
			cover: song.pic ?? "",
			url: song.url ?? "",
			duration: dur,
		};
	}

	private loadSong(song: Song, autoPlay = true): void {
		if (!song) {
			return;
		}
		if (song.url !== this.state.currentSong.url) {
			this.state.currentSong = { ...song };
			if (song.url) {
				this.state.isLoading = true;
			} else {
				this.state.isLoading = false;
			}
		}
		this.state.willAutoPlay = autoPlay;
		if (this.audio) {
			if (this.audio.src && song.url) {
				this.audio.src = "";
			}
			this.audio.src = getAssetPath(song.url);
			this.audio.load();
		}
		this.broadcastState();
	}

	private showError(message: string): void {
		this.state.errorMessage = message;
		this.state.showError = true;
		setTimeout(() => {
			this.state.showError = false;
			this.broadcastState();
		}, 3000);
		this.broadcastState();
	}

	hideError(): void {
		this.state.showError = false;
		this.broadcastState();
	}

	toggle(): void {
		if (!this.audio || !this.state.currentSong.url) {
			return;
		}
		if (this.state.isPlaying) {
			this.audio.pause();
		} else {
			this.audio.play().catch(() => {});
		}
	}

	play(): void {
		if (!this.audio || !this.state.currentSong.url) {
			return;
		}
		this.audio.play().catch(() => {});
	}

	pause(): void {
		if (!this.audio) {
			return;
		}
		this.audio.pause();
	}

	next(autoPlay = true): void {
		if (this.state.playlist.length <= 1) {
			return;
		}

		let newIndex: number;
		if (this.state.isShuffled) {
			do {
				newIndex = Math.floor(
					Math.random() * this.state.playlist.length,
				);
			} while (
				newIndex === this.state.currentIndex &&
				this.state.playlist.length > 1
			);
		} else {
			newIndex =
				this.state.currentIndex < this.state.playlist.length - 1
					? this.state.currentIndex + 1
					: 0;
		}

		this.state.currentIndex = newIndex;
		this.loadSong(this.state.playlist[newIndex], autoPlay);
	}

	prev(): void {
		if (this.state.playlist.length <= 1) {
			return;
		}
		const newIndex =
			this.state.currentIndex > 0
				? this.state.currentIndex - 1
				: this.state.playlist.length - 1;
		this.state.currentIndex = newIndex;
		this.loadSong(this.state.playlist[newIndex], true);
	}

	playIndex(index: number): void {
		if (index < 0 || index >= this.state.playlist.length) {
			return;
		}
		this.state.currentIndex = index;
		this.loadSong(this.state.playlist[index], true);
	}

	seek(time: number): void {
		if (!this.audio) {
			return;
		}
		if (time >= 0 && time <= this.state.duration) {
			this.audio.currentTime = time;
			this.state.currentTime = time;
			this.broadcastState();
		}
	}

	setVolume(volume: number): void {
		const clampedVolume = Math.max(0, Math.min(1, volume));
		this.state.volume = clampedVolume;
		this.state.isMuted = clampedVolume === 0;
		if (this.audio) {
			this.audio.volume = clampedVolume;
			this.audio.muted = this.state.isMuted;
		}
		if (typeof localStorage !== "undefined") {
			localStorage.setItem(STORAGE_KEY_VOLUME, String(clampedVolume));
		}
		this.broadcastState();
	}

	toggleMute(): void {
		this.state.isMuted = !this.state.isMuted;
		if (this.audio) {
			this.audio.muted = this.state.isMuted;
		}
		this.broadcastState();
	}

	toggleShuffle(): void {
		this.state.isShuffled = !this.state.isShuffled;
		if (this.state.isShuffled) {
			this.state.isRepeating = 0;
		}
		this.broadcastState();
	}

	toggleRepeat(): void {
		this.state.isRepeating = ((this.state.isRepeating + 1) %
			3) as RepeatMode;
		if (this.state.isRepeating !== 0) {
			this.state.isShuffled = false;
		}
		this.broadcastState();
	}

	toggleMode(): void {
		if (this.state.isShuffled) {
			this.toggleShuffle();
			return;
		}
		if (this.state.isRepeating === 2) {
			this.toggleRepeat();
			this.toggleShuffle();
			return;
		}
		this.toggleRepeat();
	}

	togglePlaylist(): void {
		this.state.showPlaylist = !this.state.showPlaylist;
		this.broadcastState();
	}

	toggleExpanded(): void {
		this.setExpanded(!this.state.isExpanded);
	}

	setExpanded(expanded: boolean): void {
		if (this.state.isExpanded === expanded) {
			return;
		}

		this.state.isExpanded = expanded;
		// 保持与原先 usePlayerState.toggleExpandedUI 一致的联动行为：
		// 展开时强制取消隐藏，并关闭播放列表，避免状态组合异常
		if (expanded) {
			this.state.showPlaylist = false;
			this.state.isHidden = false;
		}
		this.broadcastState();
	}

	toggleHidden(): void {
		this.state.isHidden = !this.state.isHidden;
		// 保持与原先 usePlayerState.toggleHiddenUI 一致的联动行为：
		// 隐藏时收起播放器并关闭播放列表，防止展开 UI 悬挂在小球旁边
		if (this.state.isHidden) {
			this.state.isExpanded = false;
			this.state.showPlaylist = false;
		}
		this.broadcastState();
	}

	canSkip(): boolean {
		return this.state.playlist.length > 1;
	}

	setProgress(percent: number): void {
		if (!this.audio) {
			return;
		}
		const newTime = percent * this.state.duration;
		this.audio.currentTime = newTime;
		this.state.currentTime = newTime;
		this.broadcastState();
	}

	private broadcastState(): void {
		const snapshot = this.createSnapshot();

		for (const listener of this.listeners) {
			listener(snapshot);
		}

		if (typeof window === "undefined") {
			return;
		}
		window.dispatchEvent(
			new CustomEvent("music-sidebar:state", {
				detail: snapshot,
			}),
		);
	}

	destroy(): void {
		if (this.unregisterInteraction) {
			this.unregisterInteraction();
		}
		if (this.audio) {
			this.audio.pause();
			this.audio.src = "";
			this.audio = null;
		}
		this.isInitialized = false;
	}
}

export const musicPlayerStore = new MusicPlayerStore();
