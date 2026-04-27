<script lang="ts">
	import { tick } from "svelte";

	import Key from "../../../../i18n/i18nKey";
	import { i18n } from "../../../../i18n/translation";
	import type { LyricLine } from "../types";

	interface Props {
		lines: LyricLine[];
		isTimed: boolean;
		currentIndex: number;
		isLoading: boolean;
		compact?: boolean;
	}

	const {
		lines,
		isTimed,
		currentIndex,
		isLoading,
		compact = false,
	}: Props = $props();

	let lyricContainer: HTMLDivElement | undefined;

	function scrollActiveLine(behavior: ScrollBehavior = "smooth") {
		if (!lyricContainer || currentIndex < 0) {
			return;
		}

		const activeLine = lyricContainer.querySelector<HTMLElement>(
			`[data-lyric-index="${currentIndex}"]`,
		);
		if (!activeLine) {
			return;
		}

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

		lyricContainer.scrollTo({ top: targetTop, behavior });
	}

	$effect(() => {
		const activeIndex = currentIndex;
		const shouldScroll = isTimed && activeIndex >= 0 && lines.length > 0;
		if (!shouldScroll) {
			return;
		}

		void tick().then(() => scrollActiveLine("smooth"));
	});
</script>

<section
	class="lyrics-section"
	class:compact
	aria-label={i18n(Key.musicPlayerLyrics)}
>
	<div class="lyrics-panel" class:compact bind:this={lyricContainer}>
		{#if isLoading}
			<p class="lyrics-placeholder">
				{i18n(Key.musicPlayerLyricsLoading)}
			</p>
		{:else if lines.length === 0}
			<p class="lyrics-placeholder">{i18n(Key.musicPlayerLyricsEmpty)}</p>
		{:else}
			<div class="lyrics-spacer" aria-hidden="true"></div>
			{#each lines as line, index}
				<p
					class="lyric-line"
					class:active={isTimed && index === currentIndex}
					data-lyric-index={index}
				>
					{line.text}
				</p>
			{/each}
			<div class="lyrics-spacer" aria-hidden="true"></div>
		{/if}
	</div>
</section>

<style>
	.lyrics-section {
		margin: 0.58rem 0 0.62rem;
		min-width: 0;
	}

	.lyrics-section.compact {
		margin: 0.52rem 0 0.58rem;
	}

	.lyrics-panel {
		max-height: 8rem;
		overflow-y: auto;
		padding: 0.62rem 0.75rem;
		border-radius: 0.75rem;
		background: color-mix(in oklab, var(--primary) 5%, var(--card-bg));
		border: 1px solid color-mix(in oklab, var(--primary) 14%, transparent);
		scroll-behavior: smooth;
		scrollbar-width: thin;
		scrollbar-color: color-mix(in oklab, var(--line-color) 78%, transparent)
			transparent;
	}

	.lyrics-panel.compact {
		max-height: 7.2rem;
	}

	.lyrics-panel::-webkit-scrollbar {
		width: 7px;
	}

	.lyrics-panel::-webkit-scrollbar-track {
		background: transparent;
		margin-block: 0.25rem;
	}

	.lyrics-panel::-webkit-scrollbar-thumb {
		background: color-mix(in oklab, var(--line-color) 70%, transparent);
		border: 2px solid transparent;
		background-clip: content-box;
		border-radius: 9999px;
	}

	.lyrics-spacer {
		height: 2.45rem;
		pointer-events: none;
	}

	.lyric-line {
		margin: 0.28rem 0;
		font-size: 0.8rem;
		line-height: 1.45;
		text-align: center;
		color: var(--content-meta);
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
		padding: 1.15rem 0;
		font-size: 0.78rem;
		text-align: center;
		color: var(--content-meta);
		opacity: 0.72;
	}

	:global(.dark) .lyrics-panel {
		background: color-mix(in oklab, var(--primary) 8%, var(--card-bg));
		border-color: color-mix(in oklab, var(--primary) 18%, transparent);
	}

	@media (max-width: 520px) {
		.lyrics-panel,
		.lyrics-panel.compact {
			max-height: 6.4rem;
			padding: 0.55rem 0.62rem;
		}

		.lyric-line {
			font-size: 0.76rem;
		}
	}
</style>
