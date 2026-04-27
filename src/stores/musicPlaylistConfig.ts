import {
	DEFAULT_METING_API,
	DEFAULT_METING_SERVER,
	DEFAULT_METING_TYPE,
} from "@/components/widgets/music-player/constants";
import type {
	LocalAudioSong,
	MusicPlayerConfig,
	MusicPlaylistConfig,
} from "@/types/config";

export interface ResolvedPlaylistConfig {
	name: string;
	mode: "meting" | "local";
	meting_api: string;
	id: string;
	server: string;
	type: string;
	audioList: LocalAudioSong[];
}

function normalizePlaylists(
	playlists: MusicPlaylistConfig[] | undefined,
): ResolvedPlaylistConfig[] {
	return (playlists ?? [])
		.filter((playlist) => !!playlist?.name)
		.map((playlist) => ({
			name: playlist.name,
			mode: playlist.mode ?? "meting",
			meting_api: playlist.meting_api ?? DEFAULT_METING_API,
			id: playlist.id ?? "",
			server: playlist.server ?? DEFAULT_METING_SERVER,
			type: playlist.type ?? DEFAULT_METING_TYPE,
			audioList: playlist.audioList ?? [],
		}));
}

function normalizeLegacyPlaylistConfig(
	config: MusicPlayerConfig,
): ResolvedPlaylistConfig | null {
	const hasLegacyConfig =
		!!config.mode ||
		!!config.meting_api ||
		!!config.id ||
		!!config.server ||
		!!config.type;

	if (!hasLegacyConfig) {
		return null;
	}

	return {
		name: config.legacyPlaylistName ?? "默认歌单",
		mode: config.mode ?? "meting",
		meting_api: config.meting_api ?? DEFAULT_METING_API,
		id: config.id ?? "",
		server: config.server ?? DEFAULT_METING_SERVER,
		type: config.type ?? DEFAULT_METING_TYPE,
		audioList: [],
	};
}

export function resolvePlaylistsFromConfig(
	config: MusicPlayerConfig,
): ResolvedPlaylistConfig[] {
	const playlists = normalizePlaylists(config.playlists);
	if (playlists.length > 0) {
		return playlists;
	}

	const legacyPlaylist = normalizeLegacyPlaylistConfig(config);
	return legacyPlaylist ? [legacyPlaylist] : [];
}

export function buildPlaylistCacheKey(source: ResolvedPlaylistConfig): string {
	return `${source.name}:${source.mode}:${source.meting_api}:${source.server}:${source.type}:${source.id}`;
}
