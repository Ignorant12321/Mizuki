import Key from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";

import {
	DEFAULT_SONG,
	LOCAL_PLAYLIST,
	SKIP_ERROR_DELAY,
	STORAGE_KEY_VOLUME,
} from "@/components/widgets/music-player/constants";
import type {
	LyricLine,
	RepeatMode,
	Song,
} from "@/components/widgets/music-player/types";
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
	lyricLines: LyricLine[];
	lyricIsTimed: boolean;
	currentLyricIndex: number;
	lyricLoading: boolean;
	volume: number;
	isMuted: boolean;
	isShuffled: boolean;
	isRepeating: RepeatMode;
	showPlaylist: boolean;
	showLyrics: boolean;
	errorMessage: string;
	showError: boolean;
	isExpanded: boolean;
	isHidden: boolean;
	autoplayFailed: boolean;
	willAutoPlay: boolean;
}

interface ParsedLyric {
	lines: LyricLine[];
	timed: boolean;
}

function getAssetPath(path: string): string {
	if (!path) {
		return "";
	}
	if (
		path.startsWith("http://") ||
		path.startsWith("https://") ||
		path.startsWith("//")
	) {
		return path;
	}
	if (path.startsWith("/")) {
		return path;
	}
	return `/${path}`;
}

function normalizeDuration(duration: unknown): number {
	let dur = Number(duration ?? 0);
	if (dur > 10000) {
		dur = Math.floor(dur / 1000);
	}
	if (!Number.isFinite(dur) || dur <= 0) {
		dur = 0;
	}
	return dur;
}

function hasLyricTimestamp(text: string): boolean {
	return /\[\d{1,2}:\d{1,2}(?:\.\d{1,3})?\]/.test(text);
}

function isLikelyLyricUrl(value: string): boolean {
	const text = value.trim();
	if (!text) {
		return false;
	}
	if (/^(https?:)?\/\//.test(text)) {
		return true;
	}
	if (text.startsWith("/")) {
		return true;
	}
	if (/\.(lrc|txt)(\?.*)?$/i.test(text)) {
		return true;
	}
	return !text.includes("\n") && !text.includes("[") && text.includes("/");
}

function extractSongLyricFields(song: any): Pick<Song, "lyric" | "lyricUrl"> {
	const candidates: string[] = [];
	const pushCandidate = (value: unknown) => {
		if (typeof value !== "string") {
			return;
		}
		const trimmed = value.trim();
		if (trimmed) {
			candidates.push(trimmed);
		}
	};

	pushCandidate(song.lyric);
	pushCandidate(song.lrc);
	pushCandidate(song?.lrc?.lyric);
	pushCandidate(song?.lrc?.url);
	pushCandidate(song?.lyric?.lyric);
	pushCandidate(song?.lyric?.url);
	pushCandidate(song.lyricUrl);
	pushCandidate(song.lrcUrl);

	let lyric: string | undefined;
	let lyricUrl: string | undefined;
	for (const candidate of candidates) {
		if (
			!lyric &&
			(hasLyricTimestamp(candidate) || candidate.includes("\n"))
		) {
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

function parseLyricText(rawText: string): ParsedLyric {
	const source = rawText.replace(/\uFEFF/g, "").trim();
	if (!source) {
		return { lines: [], timed: false };
	}

	const result: LyricLine[] = [];
	let hasTimedLine = false;
	const rows = source.split(/\r?\n/);
	const timeTagReg = /\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?\]/g;

	for (const row of rows) {
		const matches = [...row.matchAll(timeTagReg)];
		const text = row.replace(/\[[^\]]*]/g, "").trim();
		if (matches.length === 0) {
			continue;
		}

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
			if (index === 0) {
				return true;
			}
			const prev = arr[index - 1];
			return prev.time !== line.time || prev.text !== line.text;
		});
		return { lines: deduped, timed: true };
	}

	const plainLines = rows.map((line) => line.trim()).filter(Boolean);
	return {
		lines: plainLines.map((text, index) => ({ time: index * 5, text })),
		timed: false,
	};
}

class MusicPlayerStore {
	private audio: HTMLAudioElement | null = null;
	private state: MusicPlayerState;
	private isInitialized = false;
	private unregisterInteraction: (() => void) | undefined;
	private playlistRequestToken = 0;
	private playlistCache = new Map<string, Song[]>();
	private lyricRequestToken = 0;
	private lyricCache = new Map<string, ParsedLyric>();
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
			lyricLines: [],
			lyricIsTimed: false,
			currentLyricIndex: -1,
			lyricLoading: false,
			volume: 0.7,
			isMuted: false,
			isShuffled: false,
			isRepeating: 2,
			showPlaylist: false,
			showLyrics: false,
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
			lyricLines: this.state.lyricLines.map((line) => ({ ...line })),
			playlists: this.state.playlists.map((playlist) => ({
				...playlist,
				audioList: playlist.audioList.map((song) => ({ ...song })),
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
				this.syncLyricsWithCurrentTime();
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
					this.next(this.state.isPlaying || this.state.willAutoPlay),
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
			const localSongs =
				source.audioList.length > 0
					? source.audioList.map((song) =>
							this.convertLocalSong(song),
						)
					: this.cloneSongs(LOCAL_PLAYLIST);
			this.playlistCache.set(cacheKey, this.cloneSongs(localSongs));
			this.applyPlaylistSongs(
				index,
				this.cloneSongs(localSongs),
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
		this.clearLyrics();
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
		const { lyric, lyricUrl } = extractSongLyricFields(song);

		return {
			id: song.id ?? 0,
			title,
			artist,
			cover: song.pic ?? "",
			url: song.url ?? "",
			duration: normalizeDuration(song.duration),
			lyric,
			lyricUrl,
		};
	}

	private convertLocalSong(song: any): Song {
		const { lyric, lyricUrl } = extractSongLyricFields(song);
		return {
			id: song.id ?? `${song.title ?? "song"}-${song.url ?? ""}`,
			title: song.title ?? song.name ?? i18n(Key.unknownSong),
			artist: song.artist ?? song.author ?? i18n(Key.unknownArtist),
			cover: song.cover ?? song.pic ?? "",
			url: song.url ?? "",
			duration: normalizeDuration(song.duration),
			lyric,
			lyricUrl,
		};
	}

	private loadSong(song: Song, autoPlay = true): void {
		if (!song) {
			return;
		}
		if (song.url !== this.state.currentSong.url) {
			this.state.currentSong = { ...song };
			this.state.currentTime = 0;
			this.state.duration = song.duration ?? 0;
			if (song.url) {
				this.state.isLoading = true;
			} else {
				this.state.isLoading = false;
			}
		}
		void this.loadLyricsForSong(song);
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

	private clearLyrics(): void {
		this.lyricRequestToken++;
		this.state.lyricLines = [];
		this.state.lyricIsTimed = false;
		this.state.currentLyricIndex = -1;
		this.state.lyricLoading = false;
	}

	private getLyricCacheKey(song: Song): string {
		return `${song.id ?? "unknown"}::${song.url}`;
	}

	private async fetchLyricByUrl(url: string): Promise<string> {
		try {
			const response = await fetch(getAssetPath(url));
			if (!response.ok) {
				return "";
			}
			return await response.text();
		} catch {
			return "";
		}
	}

	private async resolveSongLyricText(song: Song): Promise<string> {
		if (song.lyric) {
			if (
				isLikelyLyricUrl(song.lyric) &&
				!hasLyricTimestamp(song.lyric)
			) {
				const remoteLyric = await this.fetchLyricByUrl(song.lyric);
				if (remoteLyric) {
					return remoteLyric;
				}
			} else {
				return song.lyric;
			}
		}

		if (song.lyricUrl) {
			return await this.fetchLyricByUrl(song.lyricUrl);
		}

		return "";
	}

	private applyLyricResult(parsed: ParsedLyric): void {
		this.state.lyricLines = parsed.lines.map((line) => ({ ...line }));
		this.state.lyricIsTimed = parsed.timed;
		this.state.currentLyricIndex = -1;
		this.state.lyricLoading = false;
		this.syncLyricsWithCurrentTime();
		this.broadcastState();
	}

	private syncLyricsWithCurrentTime(): void {
		if (!this.state.lyricIsTimed || this.state.lyricLines.length === 0) {
			this.state.currentLyricIndex = -1;
			return;
		}

		const time = Number.isFinite(this.state.currentTime)
			? this.state.currentTime
			: 0;
		let activeIndex = -1;
		for (let i = 0; i < this.state.lyricLines.length; i++) {
			if (time >= this.state.lyricLines[i].time) {
				activeIndex = i;
			} else {
				break;
			}
		}

		this.state.currentLyricIndex = activeIndex;
	}

	private async loadLyricsForSong(song: Song): Promise<void> {
		const cacheKey = this.getLyricCacheKey(song);
		const requestToken = ++this.lyricRequestToken;
		this.state.currentLyricIndex = -1;

		if (!song.url) {
			this.clearLyrics();
			this.broadcastState();
			return;
		}

		const cachedLyric = this.lyricCache.get(cacheKey);
		if (cachedLyric) {
			this.applyLyricResult(cachedLyric);
			return;
		}

		this.state.lyricLoading = true;
		this.state.lyricLines = [];
		this.state.lyricIsTimed = false;
		this.broadcastState();

		try {
			const rawLyric = await this.resolveSongLyricText(song);
			if (requestToken !== this.lyricRequestToken) {
				return;
			}

			const parsed = parseLyricText(rawLyric);
			this.lyricCache.set(cacheKey, parsed);
			this.applyLyricResult(parsed);
		} catch {
			if (requestToken !== this.lyricRequestToken) {
				return;
			}

			const parsed = { lines: [], timed: false };
			this.lyricCache.set(cacheKey, parsed);
			this.applyLyricResult(parsed);
		}
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
			this.syncLyricsWithCurrentTime();
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
		if (this.state.showPlaylist) {
			this.state.showLyrics = false;
		}
		this.broadcastState();
	}

	toggleLyrics(): void {
		this.state.showLyrics = !this.state.showLyrics;
		if (this.state.showLyrics) {
			this.state.showPlaylist = false;
		}
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
			this.state.showLyrics = false;
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
		this.syncLyricsWithCurrentTime();
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
