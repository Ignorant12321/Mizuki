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
	let coverState = $state<"loading" | "loaded" | "error">("loading");
	let coverImage: HTMLImageElement | undefined = $state();

	$effect(() => {
		song.cover;
		coverState = song.cover ? "loading" : "error";
		queueMicrotask(syncCoverState);
	});

	function getAssetPath(path: string): string {
		if (path.startsWith("http://") || path.startsWith("https://")) {
			return path;
		}
		if (path.startsWith("/")) {
			return path;
		}
		return `/${path}`;
	}

	function markCoverLoaded(): void {
		coverState = "loaded";
	}

	function markCoverError(): void {
		coverState = "error";
	}

	function syncCoverState(): void {
		if (!coverImage?.complete) {
			return;
		}

		if (coverImage.naturalWidth > 0) {
			markCoverLoaded();
		} else {
			markCoverError();
		}
	}
</script>

<div
	class="playlist-item playlist-item-base"
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
			<span class="order-icon animate-pulse">
				<Icon icon="material-symbols:graphic-eq" />
			</span>
		{:else if isCurrent}
			<span class="order-icon">
				<Icon icon="material-symbols:pause" />
			</span>
		{:else}
			<span class="order-index">{index + 1}</span>
		{/if}
	</div>

	<div class="song-cover-shell" data-cover-state={coverState}>
		<div class="song-cover-skeleton" aria-hidden="true"></div>
		<img
			bind:this={coverImage}
			src={getAssetPath(song.cover)}
			alt={song.title}
			loading={lazy ? "lazy" : "eager"}
			decoding="async"
			class="song-cover"
			onload={markCoverLoaded}
			onerror={markCoverError}
		/>
		<div class="song-cover-fallback" aria-hidden="true">
			<Icon icon="material-symbols:music-note-rounded" />
		</div>
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
		transition: border-color 180ms ease;
	}

	.playlist-item:hover {
		border-color: color-mix(in oklab, var(--primary) 36%, transparent);
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

	/* svelte-ignore css_unused_selector */
	.order-icon {
		font-size: 1.05rem;
		color: var(--primary);
	}

	.song-cover-shell {
		position: relative;
		width: 2.45rem;
		height: 2.45rem;
		border-radius: 0.66rem;
		overflow: hidden;
		background: color-mix(in oklab, var(--btn-regular-bg) 84%, white 16%);
		flex: 0 0 2.45rem;
		border: 1px solid color-mix(in oklab, var(--line-color) 65%, transparent);
	}

	.song-cover-skeleton,
	.song-cover-fallback {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: opacity 180ms ease;
	}

	.song-cover-skeleton {
		background: linear-gradient(
			90deg,
			color-mix(in oklab, var(--line-color) 72%, transparent) 0%,
			color-mix(in oklab, white 28%, var(--line-color)) 45%,
			color-mix(in oklab, var(--line-color) 72%, transparent) 100%
		);
		background-size: 220% 100%;
		animation: songCoverSkeletonSweep 1.1s ease-in-out infinite;
		opacity: 1;
	}

	.song-cover-fallback {
		font-size: 1.14rem;
		color: var(--content-meta);
		background: color-mix(in oklab, var(--btn-regular-bg) 88%, white 12%);
		opacity: 0;
	}

	.song-cover {
		position: relative;
		z-index: 1;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0;
		transition: opacity 180ms ease;
	}

	.song-cover-shell[data-cover-state="loaded"] .song-cover {
		opacity: 1;
	}

	.song-cover-shell[data-cover-state="loaded"] .song-cover-skeleton,
	.song-cover-shell[data-cover-state="loaded"] .song-cover-fallback,
	.song-cover-shell[data-cover-state="error"] .song-cover-skeleton,
	.song-cover-shell[data-cover-state="error"] .song-cover {
		opacity: 0;
	}

	.song-cover-shell[data-cover-state="error"] .song-cover-fallback {
		opacity: 1;
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

	@keyframes songCoverSkeletonSweep {
		from {
			background-position: 110% 0;
		}
		to {
			background-position: -110% 0;
		}
	}
</style>
