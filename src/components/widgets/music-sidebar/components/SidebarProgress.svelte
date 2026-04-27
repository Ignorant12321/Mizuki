<script lang="ts">
	interface Props {
		currentTime: number;
		duration: number;
		onSeek: (time: number) => void;
	}

	const { currentTime, duration, onSeek }: Props = $props();

	const progressPercent = $derived(
		duration > 0
			? Math.max(0, Math.min(100, (currentTime / duration) * 100))
			: 0,
	);

	const currentTimeLabel = $derived(formatTime(currentTime));
	const durationLabel = $derived(formatTime(duration));

	function formatTime(seconds: number): string {
		if (!Number.isFinite(seconds) || seconds < 0) {
			return "0:00";
		}
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	}

	function handleClick(event: MouseEvent) {
		const el = event.currentTarget as HTMLElement | null;
		if (!el || duration <= 0) {
			return;
		}
		const rect = el.getBoundingClientRect();
		const percent = (event.clientX - rect.left) / rect.width;
		const clamped = Math.max(0, Math.min(1, percent));
		const time = clamped * duration;
		onSeek(time);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			const time = duration * 0.5;
			onSeek(time);
		}
	}
</script>

<div class="sidebar-progress-wrapper">
	<span class="progress-time" aria-live="polite">{currentTimeLabel}</span>
	<div
		class="sidebar-progress-bar"
		onclick={handleClick}
		onkeydown={handleKeyDown}
		role="slider"
		tabindex="0"
		aria-label="Music progress"
		aria-valuemin="0"
		aria-valuemax="100"
		aria-valuenow={progressPercent}
	>
		<div
			class="sidebar-progress-fill"
			style={`width: ${progressPercent}%`}
		></div>
	</div>
	<span class="progress-time">{durationLabel}</span>
</div>

<style>
	.sidebar-progress-wrapper {
		display: grid;
		grid-template-columns: 2.35rem minmax(0, 1fr) 2.35rem;
		align-items: center;
		gap: 0.45rem;
		margin-top: 0.15rem;
	}

	.progress-time {
		font-size: 0.68rem;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		color: var(--content-meta);
		font-variant-numeric: tabular-nums;
		text-align: center;
		white-space: nowrap;
		user-select: none;
	}

	.sidebar-progress-bar {
		position: relative;
		width: 100%;
		height: 0.375rem;
		border-radius: 9999px;
		background: color-mix(
			in srgb,
			var(--btn-regular-bg) 80%,
			var(--content-meta) 20%
		);
		overflow: hidden;
		cursor: pointer;
	}

	.sidebar-progress-fill {
		height: 100%;
		border-radius: inherit;
		background: var(--primary);
		transition: width 100ms linear;
		min-width: 0;
	}

	.sidebar-progress-bar:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}

	@media (max-width: 520px) {
		.sidebar-progress-wrapper {
			grid-template-columns: 2.1rem minmax(0, 1fr) 2.1rem;
			gap: 0.35rem;
		}

		.progress-time {
			font-size: 0.62rem;
		}
	}
</style>
