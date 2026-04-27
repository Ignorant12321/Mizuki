<script lang="ts">
	import Icon from "@iconify/svelte";

	import Key from "../../../../i18n/i18nKey";
	import { i18n } from "../../../../i18n/translation";
	import type { ResolvedPlaylistConfig } from "../../../../stores/musicPlaylistConfig";

	interface Props {
		playlists: ResolvedPlaylistConfig[];
		currentIndex: number;
		isLoading?: boolean;
		onSelect: (index: number) => void;
	}

	let { playlists, currentIndex, isLoading = false, onSelect }: Props =
		$props();

	function getSafeIndex(): number {
		if (playlists.length === 0) {
			return -1;
		}

		return currentIndex >= 0 && currentIndex < playlists.length
			? currentIndex
			: 0;
	}

	function getCurrentName(): string {
		const safeIndex = getSafeIndex();
		return safeIndex >= 0 ? playlists[safeIndex]?.name ?? "-" : "-";
	}

	function canSwitch(): boolean {
		return !isLoading && playlists.length > 1;
	}

	function selectOffset(offset: -1 | 1): void {
		if (!canSwitch()) {
			return;
		}

		const safeIndex = getSafeIndex();
		const nextIndex =
			(safeIndex + offset + playlists.length) % playlists.length;

		if (nextIndex !== currentIndex) {
			onSelect(nextIndex);
		}
	}
</script>

<div class="playlist-switcher">
	<div class="playlist-switcher-title">
		<span class="title-main">
			<Icon icon="material-symbols:library-music-rounded" class="text-base" />
			<span>{i18n(Key.musicPlayerPlaylistSource)}</span>
		</span>
		{#if playlists.length > 1}
			<span class="playlist-index">{getSafeIndex() + 1}/{playlists.length}</span>
		{/if}
	</div>

	<div class="playlist-source-bar" class:is-loading={isLoading}>
		<button
			type="button"
			class="source-step-btn"
			onclick={() => selectOffset(-1)}
			disabled={!canSwitch()}
			title="上一个歌单"
			aria-label="上一个歌单"
		>
			<Icon icon="material-symbols:chevron-left-rounded" />
		</button>

		<div
			class="source-current"
			role="status"
			aria-live="polite"
			aria-label={`${i18n(Key.musicPlayerPlaylistSource)}：${getCurrentName()}`}
		>
			{#if isLoading}
				<span class="source-loading" aria-hidden="true">
					<Icon icon="material-symbols:progress-activity-rounded" />
				</span>
			{/if}
			<span class="source-name">{getCurrentName()}</span>
		</div>

		<button
			type="button"
			class="source-step-btn"
			onclick={() => selectOffset(1)}
			disabled={!canSwitch()}
			title="下一个歌单"
			aria-label="下一个歌单"
		>
			<Icon icon="material-symbols:chevron-right-rounded" />
		</button>
	</div>
</div>

<style>
	.playlist-switcher {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.34rem;
	}

	.playlist-switcher-title {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0 0.05rem;
		font-size: 0.78rem;
		font-weight: 700;
		line-height: 1.2;
		color: var(--content-meta);
	}

	.title-main {
		min-width: 0;
		display: inline-flex;
		align-items: center;
		gap: 0.32rem;
	}

	.playlist-index {
		flex-shrink: 0;
		padding: 0.1rem 0.38rem;
		border-radius: 9999px;
		font-size: 0.68rem;
		font-weight: 800;
		line-height: 1;
		color: var(--content-meta);
		background: transparent;
		border: 1px solid color-mix(in oklab, var(--line-color) 86%, transparent);
	}

	.playlist-source-bar {
		display: grid;
		grid-template-columns: 2rem minmax(0, 1fr) 2rem;
		align-items: center;
		gap: 0.38rem;
		padding: 0.1rem 0;
		border-radius: 0;
		border: 0;
		background: transparent;
		transition: border-color 150ms ease, background 150ms ease;
	}

	.playlist-source-bar:hover {
		border-color: transparent;
	}

	.source-step-btn {
		width: 2rem;
		height: 2rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 9999px;
		border: 0;
		background: transparent;
		color: var(--primary);
		font-size: 1.2rem;
		cursor: pointer;
		transition:
			background 150ms ease,
			border-color 150ms ease,
			transform 150ms ease,
			opacity 150ms ease;
	}

	.source-step-btn:hover:not(:disabled) {
		background: color-mix(in oklab, var(--primary) 7%, transparent);
		border-color: transparent;
		transform: translateY(-1px);
	}

	.source-step-btn:active:not(:disabled) {
		transform: scale(0.96);
	}

	.source-step-btn:focus-visible {
		outline: none;
		box-shadow: 0 0 0 2px color-mix(in oklab, var(--primary) 22%, transparent);
	}

	.source-step-btn:disabled {
		opacity: 0.42;
		cursor: not-allowed;
	}

	.source-current {
		min-width: 0;
		height: 2.05rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.34rem;
		padding: 0 0.72rem;
		border-radius: 9999px;
		border: 0;
		background: transparent;
		color: var(--btn-content);
	}

	.source-name {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.96rem;
		font-weight: 800;
		line-height: 1;
	}

	.source-loading {
		flex-shrink: 0;
		font-size: 0.92rem;
		color: var(--primary);
		animation: switcherSpin 1s linear infinite;
	}

	:global(.dark) .playlist-source-bar {
		background: transparent;
		border-color: color-mix(in oklab, var(--line-color) 84%, transparent);
	}

	:global(.dark) .source-step-btn {
		background: transparent;
	}

	:global(.dark) .source-current {
		background: transparent;
	}

	@keyframes switcherSpin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 520px) {
		.playlist-source-bar {
			grid-template-columns: 1.9rem minmax(0, 1fr) 1.9rem;
			gap: 0.3rem;
			padding: 0.24rem;
		}

		.source-step-btn {
			width: 1.9rem;
			height: 1.9rem;
		}

		.source-current {
			height: 1.95rem;
			padding: 0 0.54rem;
		}

		.source-name {
			font-size: 0.92rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.playlist-source-bar,
		.source-step-btn {
			transition: none;
		}

		.source-loading {
			animation: none;
		}
	}
</style>
