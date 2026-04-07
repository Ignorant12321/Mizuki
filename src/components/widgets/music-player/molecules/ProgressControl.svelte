<script lang="ts">
	import ProgressBar from "../atoms/ProgressBar.svelte";

	interface Props {
		currentTime: number;
		duration: number;
		onProgressClick: (event: MouseEvent) => void;
		onProgressKeyDown: (event: KeyboardEvent) => void;
	}

	const { currentTime, duration, onProgressClick, onProgressKeyDown }: Props =
		$props();

	function formatTime(seconds: number): string {
		if (!Number.isFinite(seconds) || seconds < 0) {
			return "0:00";
		}
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	}
</script>

<div class="progress-section progress-row mb-4">
	<span class="progress-time">{formatTime(currentTime)}</span>
	<ProgressBar
		{currentTime}
		{duration}
		onclick={onProgressClick}
		onkeydown={onProgressKeyDown}
	/>
	<span class="progress-time">{formatTime(duration)}</span>
</div>

<style>
	.progress-row {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 0.5rem;
	}

	.progress-time {
		min-width: 2.3rem;
		text-align: center;
		font-size: 0.68rem;
		color: var(--text-tertiary);
		font-variant-numeric: tabular-nums;
		user-select: none;
	}
</style>
