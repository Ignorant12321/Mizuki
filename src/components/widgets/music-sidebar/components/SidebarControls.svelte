<script lang="ts">
	import Icon from "@iconify/svelte";

	import Key from "../../../../i18n/i18nKey";
	import { i18n } from "../../../../i18n/translation";
	import NextButton from "../../music-player/atoms/NextButton.svelte";
	import PlayButton from "../../music-player/atoms/PlayButton.svelte";
	import PrevButton from "../../music-player/atoms/PrevButton.svelte";

	interface Props {
		isPlaying: boolean;
		isShuffled: boolean;
		repeatMode: number;
		showLyrics: boolean;
		volume: number;
		isMuted: boolean;
		isPanelVisible?: boolean;
		onToggleMode?: () => void;
		onPrev: () => void;
		onNext: () => void;
		onTogglePlay: () => void;
		onTogglePlaylist: () => void;
		onToggleLyrics: () => void;
		onToggleMute: () => void;
		onTogglePanelVisibility?: () => void;
	}

	const {
		isPlaying,
		isShuffled,
		repeatMode,
		showLyrics,
		volume,
		isMuted,
		isPanelVisible = true,
		onToggleMode,
		onPrev,
		onNext,
		onTogglePlay,
		onTogglePlaylist,
		onToggleLyrics,
		onToggleMute,
		onTogglePanelVisibility,
	}: Props = $props();

	const repeatIcon = $derived(
		isShuffled
			? "material-symbols:shuffle-rounded"
			: repeatMode === 1
				? "material-symbols:repeat-one-rounded"
				: "material-symbols:repeat-rounded",
	);

	const modeActive = $derived(isShuffled || repeatMode > 0);
	const volumeIcon = $derived(
		isMuted || volume === 0
			? "material-symbols:volume-off-rounded"
			: "material-symbols:volume-up-rounded",
	);
</script>

<div class="controls-row">
	{#if onTogglePanelVisibility}
		<button
			class="icon-btn visibility-btn"
			onclick={onTogglePanelVisibility}
			aria-label={isPanelVisible
				? i18n(Key.musicPlayerHide)
				: i18n(Key.musicPlayerShow)}
			title={isPanelVisible
				? i18n(Key.musicPlayerHide)
				: i18n(Key.musicPlayerShow)}
		>
			<Icon
				icon={isPanelVisible
					? "material-symbols:visibility-off-rounded"
					: "material-symbols:visibility-rounded"}
			/>
		</button>
	{:else}
		<button
			class="icon-btn mute-btn"
			class:active-mode={isMuted || volume === 0}
			onclick={onToggleMute}
			aria-label={i18n(Key.musicPlayerVolume)}
			title={i18n(Key.musicPlayerVolume)}
		>
			<Icon icon={volumeIcon} />
		</button>
	{/if}
	<button
		class="icon-btn mode-btn"
		class:active-mode={modeActive}
		onclick={() => onToggleMode?.()}
		aria-label="Repeat mode"
	>
		<Icon icon={repeatIcon} class="text-xl" />
	</button>
	<PrevButton onclick={onPrev} disabled={false} />
	<PlayButton {isPlaying} isLoading={false} onclick={onTogglePlay} />
	<NextButton onclick={onNext} disabled={false} />
	<button
		class="icon-btn list-btn"
		onclick={onTogglePlaylist}
		aria-label={i18n(Key.musicPlayerSongSource)}
		title={i18n(Key.musicPlayerSongSource)}
	>
		<Icon icon="material-symbols:queue-music-rounded" />
	</button>
	<button
		class="icon-btn lyrics-btn"
		class:active-mode={showLyrics}
		onclick={onToggleLyrics}
		aria-label={i18n(Key.musicPlayerLyrics)}
		title={i18n(Key.musicPlayerLyrics)}
	>
		<Icon icon="material-symbols:subtitles-rounded" />
	</button>
</div>

<style>
	.controls-row {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		align-items: center;
		justify-items: center;
		gap: 0.12rem;
		width: 100%;
		min-width: 0;
		overflow: hidden;
		margin-top: 0.75rem;
		padding-inline: 0;
	}

	.icon-btn {
		width: 1.75rem;
		height: 1.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--content-main);
		transition:
			color 150ms ease,
			transform 150ms ease;
		justify-self: center;
	}

	.icon-btn:hover {
		color: var(--primary);
	}

	.icon-btn:active {
		transform: scale(0.96);
	}

	.mute-btn,
	.visibility-btn,
	.mode-btn,
	.lyrics-btn,
	.list-btn {
		color: var(--content-meta);
	}

	.active-mode {
		color: var(--primary);
	}

	.controls-row :global(button) {
		flex-shrink: 0;
		justify-self: center;
		min-width: 0;
	}

	.controls-row :global(.btn-plain) {
		width: 2.1rem;
		height: 2.1rem;
		padding: 0;
		border-radius: 0.6rem;
	}

	.controls-row :global(.btn-regular) {
		width: 2.65rem;
		height: 2.65rem;
	}

	@media (max-width: 520px) {
		.controls-row {
			gap: 0.08rem;
			padding-inline: 0;
		}

		.controls-row :global(.btn-plain) {
			width: 1.95rem;
			height: 1.95rem;
			padding: 0;
			border-radius: 0.6rem;
		}

		.controls-row :global(.btn-regular) {
			width: 2.5rem;
			height: 2.5rem;
		}

		.icon-btn {
			width: 1.65rem;
			height: 1.65rem;
		}
	}
</style>
