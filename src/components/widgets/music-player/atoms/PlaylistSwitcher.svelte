	<script lang="ts">
	import Icon from "@iconify/svelte";
	import { onMount } from "svelte";

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

	let isOpen = $state(false);
	let rootEl: HTMLDivElement | null = null;
	let triggerEl: HTMLButtonElement | null = null;

	function getCurrentName(): string {
		return playlists[currentIndex]?.name ?? "-";
	}

	function canOpen(): boolean {
		return !isLoading && playlists.length > 0;
	}

	function toggleMenu(): void {
		if (!canOpen()) {
			return;
		}
		isOpen = !isOpen;
	}

	function closeMenu(focusTrigger = false): void {
		isOpen = false;
		if (focusTrigger) {
			triggerEl?.focus();
		}
	}

	function selectOption(index: number): void {
		onSelect(index);
		closeMenu();
	}

	function handleTriggerClick(event: MouseEvent): void {
		event.stopPropagation();
		toggleMenu();
	}

	function handleOptionClick(event: MouseEvent, index: number): void {
		event.stopPropagation();
		selectOption(index);
	}

	function onTriggerKeyDown(event: KeyboardEvent): void {
		if (event.key === "Escape") {
			event.preventDefault();
			closeMenu(true);
		}
	}

	function onOptionKeyDown(event: KeyboardEvent, index: number): void {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			selectOption(index);
			return;
		}
		if (event.key === "Escape") {
			event.preventDefault();
			closeMenu(true);
		}
	}

	function onMenuKeyDown(event: KeyboardEvent): void {
		if (event.key === "Escape") {
			event.preventDefault();
			closeMenu(true);
		}
	}

	onMount(() => {
		const handleWindowPointerDown = (event: PointerEvent) => {
			if (!isOpen || !rootEl) {
				return;
			}
			if (rootEl.contains(event.target as Node)) {
				return;
			}
			closeMenu();
		};

		window.addEventListener("pointerdown", handleWindowPointerDown, true);

		return () => {
			window.removeEventListener(
				"pointerdown",
				handleWindowPointerDown,
				true,
			);
		};
	});

	$effect(() => {
		if (!canOpen() && isOpen) {
			isOpen = false;
		}
	});
</script>

<div class="playlist-switcher" bind:this={rootEl}>
	<div class="playlist-switcher-title">
		<Icon icon="material-symbols:queue-music-rounded" class="text-lg" />
		<span>{i18n(Key.musicPlayerPlaylistSource)}</span>
		{#if isLoading}
			<span class="switcher-loading">
				<Icon icon="material-symbols:progress-activity-rounded" />
			</span>
		{/if}
	</div>

	<div class="playlist-dropdown" class:open={isOpen}>
		<button
			type="button"
			class="playlist-trigger"
			bind:this={triggerEl}
			onclick={handleTriggerClick}
			onkeydown={onTriggerKeyDown}
			disabled={!canOpen()}
			aria-haspopup="listbox"
			aria-expanded={isOpen}
			aria-label={i18n(Key.musicPlayerPlaylistSource)}
		>
			<span class="playlist-current-label">{getCurrentName()}</span>
			<span class="playlist-arrow">
				<Icon
					icon="material-symbols:keyboard-arrow-down-rounded"
					style="color: inherit"
				/>
			</span>
		</button>

		{#if isOpen}
			<div
				class="playlist-menu"
				role="listbox"
				tabindex="-1"
				onkeydown={onMenuKeyDown}
			>
				{#each playlists as playlist, index}
					<button
						type="button"
						role="option"
						class="playlist-option"
						class:selected={index === currentIndex}
						aria-selected={index === currentIndex}
						onclick={(event) => handleOptionClick(event, index)}
						onkeydown={(event) => onOptionKeyDown(event, index)}
					>
						<span class="playlist-option-label">{playlist.name}</span>
						{#if index === currentIndex}
							<span class="playlist-check">
								<Icon icon="material-symbols:check-rounded" />
							</span>
						{/if}
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.playlist-switcher {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		--playlist-trigger-border: color-mix(
			in oklab,
			var(--content-main) 16%,
			var(--line-color)
		);
		--playlist-trigger-border-hover: color-mix(
			in oklab,
			var(--content-main) 24%,
			var(--line-color)
		);
		--playlist-trigger-border-focus: color-mix(
			in oklab,
			var(--content-main) 28%,
			var(--line-color)
		);
		--playlist-trigger-focus-ring: color-mix(
			in oklab,
			var(--content-main) 14%,
			transparent
		);
		--playlist-menu-border: color-mix(
			in oklab,
			var(--content-main) 18%,
			var(--line-color)
		);
		--playlist-menu-bg: var(--card-bg-transparent);
		--playlist-menu-shadow: 0 10px 24px color-mix(
			in oklab,
			black 10%,
			transparent
		);
		--playlist-option-text: var(--content-main);
		--playlist-option-text-hover: color-mix(
			in oklab,
			var(--content-main) 92%,
			transparent
		);
		--playlist-option-border-hover: color-mix(
			in oklab,
			var(--content-main) 22%,
			transparent
		);
		--playlist-option-selected-border: color-mix(
			in oklab,
			var(--primary) 38%,
			transparent
		);
		--playlist-option-selected-border-hover: color-mix(
			in oklab,
			var(--primary) 58%,
			transparent
		);
		--playlist-option-selected-text: var(--primary);
	}

	:global(.dark) .playlist-switcher {
		--playlist-trigger-border: color-mix(
			in oklab,
			white 18%,
			var(--line-color)
		);
		--playlist-trigger-border-hover: color-mix(
			in oklab,
			white 28%,
			var(--line-color)
		);
		--playlist-trigger-border-focus: color-mix(
			in oklab,
			white 30%,
			var(--line-color)
		);
		--playlist-trigger-focus-ring: color-mix(
			in oklab,
			white 12%,
			transparent
		);
		--playlist-menu-border: color-mix(
			in oklab,
			white 14%,
			var(--line-color)
		);
		--playlist-option-text: rgb(229 229 229);
		--playlist-option-text-hover: rgb(245 245 245);
		--playlist-option-border-hover: color-mix(
			in oklab,
			white 16%,
			transparent
		);
	}

	.playlist-switcher-title {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding-left: 0.05rem;
		font-size: 0.78rem;
		font-weight: 600;
		line-height: 1.2;
		color: var(--content-meta);
	}

	/* svelte-ignore css_unused_selector */
	.switcher-loading {
		margin-left: auto;
		font-size: 0.95rem;
		color: var(--primary);
		animation: switcherSpin 1s linear infinite;
	}

	.playlist-dropdown {
		position: relative;
		z-index: 2;
	}

	.playlist-trigger {
		width: 100%;
		height: 2.05rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
		padding: 0 0.7rem;
		border-radius: 0.7rem;
		border: 1px solid var(--playlist-trigger-border);
		background: transparent;
		color: var(--btn-content);
		cursor: pointer;
		transition: border-color 150ms ease, color 150ms ease;
	}

	.playlist-trigger:hover:not(:disabled) {
		border-color: var(--playlist-trigger-border-hover);
	}

	.playlist-trigger:focus-visible {
		outline: none;
		border-color: var(--playlist-trigger-border-focus);
		box-shadow: 0 0 0 1px var(--playlist-trigger-focus-ring);
	}

	.playlist-trigger:disabled {
		opacity: 0.74;
		cursor: not-allowed;
	}

	.playlist-current-label {
		min-width: 0;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.98rem;
		font-weight: 700;
		line-height: 1.1;
		text-align: left;
		color: var(--btn-content);
	}

	/* svelte-ignore css_unused_selector */
	.playlist-arrow {
		flex-shrink: 0;
		font-size: 1rem;
		color: var(--content-meta) !important;
		fill: currentColor;
		transition: transform 180ms ease;
	}

	/* svelte-ignore css_unused_selector */
	.playlist-dropdown.open .playlist-arrow {
		transform: rotate(180deg);
	}

	.playlist-menu {
		position: absolute;
		top: calc(100% + 0.36rem);
		left: 0;
		right: 0;
		display: flex;
		flex-direction: column;
		gap: 0.18rem;
		padding: 0.22rem;
		max-height: 9.5rem;
		overflow-y: auto;
		border-radius: 0.78rem;
		border: 1px solid var(--playlist-menu-border);
		background: var(--playlist-menu-bg);
		box-shadow: var(--playlist-menu-shadow);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		transform-origin: top center;
		z-index: 80;
		scrollbar-width: thin;
		scrollbar-color: color-mix(in oklab, var(--primary) 40%, transparent)
			transparent;
	}

	.playlist-menu::-webkit-scrollbar {
		width: 6px;
	}

	.playlist-menu::-webkit-scrollbar-thumb {
		background: color-mix(in oklab, var(--primary) 36%, transparent);
		border-radius: 9999px;
	}

	.playlist-option {
		height: 2.15rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0 0.62rem;
		border: 1px solid transparent;
		border-radius: 0.58rem;
		background: transparent;
		cursor: pointer;
		transition: border-color 130ms ease, color 130ms ease;
	}

	.playlist-option:hover {
		border-color: var(--playlist-option-border-hover);
	}

	.playlist-option:hover .playlist-option-label {
		color: var(--playlist-option-text-hover);
	}

	.playlist-option-label {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.98rem;
		font-weight: 600;
		line-height: 1;
		color: var(--playlist-option-text);
	}

	.playlist-option.selected .playlist-option-label {
		color: var(--playlist-option-selected-text);
	}

	.playlist-option.selected:hover .playlist-option-label {
		color: var(--playlist-option-selected-text);
	}

	.playlist-option.selected {
		border-color: var(--playlist-option-selected-border);
		color: var(--playlist-option-selected-text);
	}

	.playlist-option.selected:hover {
		border-color: var(--playlist-option-selected-border-hover);
	}

	/* svelte-ignore css_unused_selector */
	.playlist-check {
		flex-shrink: 0;
		font-size: 0.95rem;
		color: var(--primary);
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
		.playlist-trigger,
		.playlist-option {
			height: 2.05rem;
		}

		.playlist-current-label,
		.playlist-option-label {
			font-size: 0.95rem;
		}
	}
</style>
