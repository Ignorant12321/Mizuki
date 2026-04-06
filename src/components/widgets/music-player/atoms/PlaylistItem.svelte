<script lang="ts">
	import Icon from "@iconify/svelte";

	import type { Song } from "../types";

	interface Props {
		song: Song;
		index: number;
		isCurrent: boolean;
		isPlaying: boolean;
		onclick: () => void;
		lazy?: boolean;
	}

	const {
		song,
		index,
		isCurrent,
		isPlaying,
		onclick,
		lazy = true,
	}: Props = $props();

	function getAssetPath(path: string): string {
		if (path.startsWith("http://") || path.startsWith("https://")) {
			return path;
		}
		if (path.startsWith("/")) {
			return path;
		}
		return `/${path}`;
	}
</script>

<div
	class="playlist-item"
	class:item-active={isCurrent}
	{onclick}
	onkeydown={(e) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			onclick();
		}
	}}
	role="button"
	tabindex="0"
	aria-label="播放 {song.title} - {song.artist}"
>
	<div class="song-order">
		{#if isCurrent && isPlaying}
			<Icon
				icon="material-symbols:graphic-eq"
				class="order-icon animate-pulse"
			/>
		{:else if isCurrent}
			<Icon icon="material-symbols:pause" class="order-icon" />
		{:else}
			<span class="order-index">{index + 1}</span>
		{/if}
	</div>

	<div class="song-cover-shell">
		<img
			src={getAssetPath(song.cover)}
			alt={song.title}
			loading={lazy ? "lazy" : "eager"}
			decoding="async"
			class="song-cover"
		/>
	</div>

	<div class="song-meta">
		<div class="song-title">{song.title}</div>
		<div class="song-artist">{song.artist}</div>
	</div>
</div>

<style>
	.playlist-item {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		padding: 0.6rem 0.75rem;
		border-radius: 0.9rem;
		cursor: pointer;
		border: 1px solid transparent;
		background: color-mix(in oklab, var(--primary) 3%, transparent);
		transition:
			background 180ms ease,
			border-color 180ms ease,
			transform 180ms ease,
			box-shadow 180ms ease;
	}

	.playlist-item:hover {
		background: color-mix(in oklab, var(--primary) 7%, transparent);
		border-color: color-mix(in oklab, var(--primary) 26%, transparent);
		transform: translateY(-1px);
	}

	.playlist-item.item-active {
		background: color-mix(in oklab, var(--primary) 12%, transparent);
		border-color: color-mix(in oklab, var(--primary) 35%, transparent);
		box-shadow: inset 0 0 0 1px
			color-mix(in oklab, var(--primary) 22%, transparent);
	}

	.song-order {
		width: 1.35rem;
		flex: 0 0 1.35rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.order-index {
		font-size: 0.95rem;
		font-variant-numeric: tabular-nums;
		color: var(--content-meta);
	}

	.order-icon {
		font-size: 1.05rem;
		color: var(--primary);
	}

	.song-cover-shell {
		width: 2.45rem;
		height: 2.45rem;
		border-radius: 0.66rem;
		overflow: hidden;
		background: color-mix(in oklab, var(--btn-regular-bg) 84%, white 16%);
		flex: 0 0 2.45rem;
		border: 1px solid color-mix(in oklab, var(--line-color) 65%, transparent);
	}

	.song-cover {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.song-meta {
		flex: 1;
		min-width: 0;
	}

	.song-title {
		font-size: 1.03rem;
		font-weight: 600;
		line-height: 1.2;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--content-main);
	}

	.item-active .song-title {
		color: var(--primary);
	}

	.song-artist {
		font-size: 0.8rem;
		margin-top: 0.18rem;
		color: var(--content-meta);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.item-active .song-artist {
		color: color-mix(in oklab, var(--primary) 82%, var(--content-meta));
	}
</style>
