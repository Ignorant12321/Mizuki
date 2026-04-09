<script lang="ts">
	import Icon from "@iconify/svelte";

	import Key from "../../../../i18n/i18nKey";
	import { i18n } from "../../../../i18n/translation";

	interface Props {
		cover: string;
		isPlaying: boolean;
		isLoading: boolean;
		size?: "mini" | "expanded" | "orb";
		onclick?: () => void;
		interactive?: boolean;
	}

	const {
		cover,
		isPlaying,
		isLoading,
		size = "mini",
		onclick,
		interactive = false,
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

	const containerClasses = {
		mini: "cover-container relative w-12 h-12 rounded-full overflow-hidden",
		expanded:
			"cover-container relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0",
	};
</script>

{#if size === "orb"}
	<div
		class="orb-player w-12 h-12 bg-[var(--primary)] rounded-full shadow-lg cursor-pointer transition-all duration-500 ease-in-out flex items-center justify-center hover:scale-110 active:scale-95"
		{onclick}
		onkeydown={(e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				onclick?.();
			}
		}}
		role="button"
		tabindex="0"
		aria-label={i18n(Key.musicPlayerShow)}
	>
		{#if isLoading}
			<Icon icon="eos-icons:loading" class="text-white text-lg" />
		{:else if isPlaying}
			<div class="flex space-x-0.5">
				<div
					class="w-0.5 h-3 bg-white rounded-full animate-pulse"
				></div>
				<div
					class="w-0.5 h-4 bg-white rounded-full animate-pulse"
					style="animation-delay: 150ms;"
				></div>
				<div
					class="w-0.5 h-2 bg-white rounded-full animate-pulse"
					style="animation-delay: 300ms;"
				></div>
			</div>
		{:else}
			<Icon
				icon="material-symbols:music-note"
				class="text-white text-lg"
			/>
		{/if}
	</div>
{:else if interactive}
	<div
		class={`${containerClasses[size]} music-cover cursor-pointer`}
		{onclick}
		onkeydown={(e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				onclick?.();
			}
		}}
		role="button"
		tabindex="0"
		aria-label={isPlaying
			? i18n(Key.musicPlayerPause)
			: i18n(Key.musicPlayerPlay)}
	>
		<div
			class="cover-disc spinning"
			class:paused={!isPlaying || isLoading}
		></div>
		<div
			class="cover-label spinning"
			class:paused={!isPlaying || isLoading}
		>
			<img
				src={getAssetPath(cover)}
				alt={i18n(Key.musicPlayerCover)}
				loading="eager"
				fetchpriority="high"
				class="cover-art w-full h-full object-cover transition-transform duration-300"
				class:animate-pulse={isLoading}
			/>
		</div>
		<span class="cover-hole" aria-hidden="true"></span>
		<div
			class="cover-hover-mask absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
		>
			{#if isLoading}
				<Icon icon="eos-icons:loading" class="text-white text-xl" />
			{:else if isPlaying}
				<Icon
					icon="material-symbols:pause"
					class="text-white text-xl"
				/>
			{:else}
				<Icon
					icon="material-symbols:play-arrow"
					class="text-white text-xl"
				/>
			{/if}
		</div>
	</div>
{:else}
	<div class={`${containerClasses[size]} music-cover`}>
		<div
			class="cover-disc spinning"
			class:paused={!isPlaying || isLoading}
		></div>
		<div
			class="cover-label spinning"
			class:paused={!isPlaying || isLoading}
		>
			<img
				src={getAssetPath(cover)}
				alt={i18n(Key.musicPlayerCover)}
				loading="eager"
				fetchpriority="high"
				class="cover-art w-full h-full object-cover transition-transform duration-300"
				class:animate-pulse={isLoading}
			/>
		</div>
		<span class="cover-hole" aria-hidden="true"></span>
	</div>
{/if}

<style>
	.music-cover {
		isolation: isolate;
		border: 1px solid color-mix(in oklab, white 16%, var(--line-color));
		background: radial-gradient(
			circle at 50% 50%,
			color-mix(in oklab, white 10%, var(--card-bg)) 0% 15%,
			color-mix(in oklab, black 54%, var(--card-bg)) 16% 56%,
			color-mix(in oklab, black 70%, var(--card-bg)) 57% 100%
		);
		transition:
			transform 0.25s ease,
			border-color 0.25s ease;
	}

	.music-cover:hover {
		transform: translateY(-1px) scale(1.02);
		border-color: color-mix(in oklab, var(--primary) 24%, var(--line-color));
	}

	.music-cover:active {
		transform: scale(0.98);
	}

	.cover-disc {
		position: absolute;
		inset: 0;
		border-radius: inherit;
		transform-origin: center;
		will-change: transform;
		background: radial-gradient(
			circle at 50% 50%,
			color-mix(in oklab, white 12%, var(--card-bg)) 0% 8%,
			color-mix(in oklab, black 56%, var(--card-bg)) 9% 32%,
			color-mix(in oklab, black 72%, var(--card-bg)) 33% 100%
		);
	}

	.cover-disc::before,
	.cover-disc::after {
		content: "";
		position: absolute;
		inset: 0;
		border-radius: inherit;
		pointer-events: none;
	}

	.cover-disc::before {
		inset: 2px;
		background: repeating-radial-gradient(
			circle at 50% 50%,
			color-mix(in oklab, white 34%, transparent) 0 0.9px,
			color-mix(in oklab, black 20%, transparent) 1.1px 2.8px
		);
		opacity: 0.62;
		z-index: 1;
	}

	.cover-disc::after {
		background:
			repeating-radial-gradient(
				circle at 50% 50%,
				transparent 0 5px,
				color-mix(in oklab, white 18%, transparent) 5.2px 5.7px,
				transparent 6px 10px
			),
			conic-gradient(
				from 18deg,
				color-mix(in oklab, white 10%, transparent),
				color-mix(in oklab, black 12%, transparent),
				color-mix(in oklab, white 8%, transparent),
				color-mix(in oklab, black 10%, transparent),
				color-mix(in oklab, white 10%, transparent)
			);
		opacity: 0.5;
		mix-blend-mode: soft-light;
		z-index: 4;
	}

	.cover-label {
		position: absolute;
		inset: 20%;
		z-index: 2;
		border-radius: 9999px;
		overflow: hidden;
		background: radial-gradient(
			circle,
			color-mix(in oklab, var(--primary) 20%, var(--card-bg)) 0%,
			color-mix(in oklab, black 20%, var(--card-bg)) 100%
		);
		border: 1px solid color-mix(in oklab, white 26%, transparent);
		transform-origin: center;
		will-change: transform;
	}

	.cover-label::after {
		content: "";
		position: absolute;
		inset: 10%;
		border-radius: inherit;
		border: 1px solid color-mix(in oklab, white 24%, transparent);
		pointer-events: none;
		z-index: 3;
	}

	.cover-art {
		position: relative;
		z-index: 2;
		transform: scale(1.08);
		filter: saturate(1.08) contrast(1.05) brightness(1.04);
		will-change: transform;
	}

	.cover-hole {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 10%;
		height: 10%;
		transform: translate(-50%, -50%);
		z-index: 5;
		border-radius: 9999px;
		background: radial-gradient(
			circle,
			color-mix(in oklab, black 92%, transparent) 0% 60%,
			color-mix(in oklab, white 24%, transparent) 61% 100%
		);
		box-shadow: none;
	}

	.cover-hover-mask {
		z-index: 6;
		background: radial-gradient(
			circle at 50% 50%,
			color-mix(in oklab, black 24%, transparent) 0% 35%,
			color-mix(in oklab, black 62%, transparent) 100%
		);
	}

	.cover-disc.spinning,
	.cover-label.spinning {
		animation: spin-continuous 5.2s linear infinite;
		animation-play-state: running;
	}

	.cover-disc.paused,
	.cover-label.paused {
		animation-play-state: paused;
	}

	@keyframes spin-continuous {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
