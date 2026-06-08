<script lang="ts">
	import Icon from "@iconify/svelte";

	import type { Song } from "../../music-player/types";

	interface Props {
		song: Song;
		index: number;
		isCurrent: boolean;
		isPlaying: boolean;
		onclick: () => void;
	}

	const { song, index, isCurrent, isPlaying, onclick }: Props = $props();
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
	class="track-list-item"
	class:is-current={isCurrent}
	{onclick}
	onkeydown={(e) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			onclick();
		}
	}}
	role="option"
	tabindex="0"
	aria-selected={isCurrent}
	aria-label={`播放 ${song.title} - ${song.artist}`}
>
	<div class="track-index">
		{#if isCurrent && isPlaying}
			<span class="now-playing">
				<Icon
					icon="material-symbols:graphic-eq-rounded"
					style="color: var(--primary);"
				/>
			</span>
		{:else}
			<span class="index-number">{index + 1}</span>
		{/if}
	</div>

	<div class="cover-shell" data-cover-state={coverState}>
		<div class="cover-skeleton" aria-hidden="true"></div>
		<img
			bind:this={coverImage}
			src={getAssetPath(song.cover)}
			alt={song.title}
			loading="lazy"
			decoding="async"
			class="item-cover"
			onload={markCoverLoaded}
			onerror={markCoverError}
		/>
		<div class="cover-fallback" aria-hidden="true">
			<Icon icon="material-symbols:music-note-rounded" />
		</div>
	</div>
	<div class="content">
		<div class="item-title" class:active={isCurrent}>{song.title}</div>
		<div class="item-artist" class:active={isCurrent}>{song.artist}</div>
	</div>
</div>

<style>
	.track-list-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.56rem 0.62rem;
		border-radius: 0.92rem;
		cursor: pointer;
		border: 1px solid color-mix(in oklab, var(--line-color) 88%, transparent);
		background: color-mix(in oklab, var(--card-bg) 95%, white 5%);
		transition: border-color 180ms ease;
	}

	.track-list-item:hover {
		border-color: color-mix(in oklab, var(--primary) 30%, var(--line-color));
	}

	.track-list-item.is-current {
		background: color-mix(in oklab, var(--primary) 8%, transparent);
		border-color: color-mix(in oklab, var(--primary) 24%, transparent);
		box-shadow: inset 0 0 0 1px
			color-mix(in oklab, var(--primary) 14%, transparent);
	}

	.track-index {
		width: 1.35rem;
		flex: 0 0 1.35rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.index-number {
		font-size: 0.86rem;
		color: var(--content-meta);
		font-variant-numeric: tabular-nums;
	}

	.cover-shell {
		position: relative;
		width: 2.28rem;
		height: 2.28rem;
		border-radius: 0.62rem;
		overflow: hidden;
		flex-shrink: 0;
		background: var(--btn-regular-bg);
		border: 1px solid color-mix(in oklab, var(--line-color) 68%, transparent);
	}

	.cover-skeleton,
	.cover-fallback {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: opacity 180ms ease;
	}

	.cover-skeleton {
		background: linear-gradient(
			90deg,
			color-mix(in oklab, var(--line-color) 72%, transparent) 0%,
			color-mix(in oklab, white 28%, var(--line-color)) 45%,
			color-mix(in oklab, var(--line-color) 72%, transparent) 100%
		);
		background-size: 220% 100%;
		animation: coverSkeletonSweep 1.1s ease-in-out infinite;
		opacity: 1;
	}

	.cover-fallback {
		font-size: 1.1rem;
		color: var(--content-meta);
		background: color-mix(in oklab, var(--btn-regular-bg) 88%, white 12%);
		opacity: 0;
	}

	.item-cover {
		position: relative;
		z-index: 1;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0;
		transition: opacity 180ms ease;
	}

	.cover-shell[data-cover-state="loaded"] .item-cover {
		opacity: 1;
	}

	.cover-shell[data-cover-state="loaded"] .cover-skeleton,
	.cover-shell[data-cover-state="loaded"] .cover-fallback,
	.cover-shell[data-cover-state="error"] .cover-skeleton,
	.cover-shell[data-cover-state="error"] .item-cover {
		opacity: 0;
	}

	.cover-shell[data-cover-state="error"] .cover-fallback {
		opacity: 1;
	}

	.content {
		flex: 1;
		min-width: 0;
	}

	.item-title {
		font-size: 0.93rem;
		font-weight: 600;
		color: var(--content-main);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.item-title.active {
		color: color-mix(in oklab, var(--primary) 84%, var(--content-main));
	}

	:global(.dark) .item-title {
		color: rgb(229 229 229);
	}

	.item-artist {
		font-size: 0.78rem;
		color: var(--content-meta);
		margin-top: 0.08rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.item-artist.active {
		color: color-mix(in oklab, var(--primary) 84%, var(--content-main));
	}

	:global(.dark) .item-artist {
		color: rgb(163 163 163);
	}

	:global(.dark) .item-artist.active,
	:global(.dark) .item-title.active {
		color: var(--primary);
	}

	/* svelte-ignore css_unused_selector */
	.now-playing {
		color: var(--primary);
		fill: currentColor;
		font-size: 1.05rem;
		flex-shrink: 0;
	}

	/* svelte-ignore css_unused_selector */
	:global(.dark) .now-playing {
		color: var(--primary);
	}

	@keyframes coverSkeletonSweep {
		from {
			background-position: 110% 0;
		}
		to {
			background-position: -110% 0;
		}
	}
</style>
