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
		currentIndex;
		isOpen = false;
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
		height: 2.15rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
		padding: 0 0.7rem;
		border-radius: 0.82rem;
		border: 1px solid color-mix(in oklab, var(--primary) 24%, var(--line-color));
		background: var(--btn-regular-bg);
		color: var(--btn-content);
		cursor: pointer;
		transition:
			border-color 150ms ease,
			background 150ms ease,
			box-shadow 180ms ease;
	}

	.playlist-trigger:hover:not(:disabled) {
		border-color: color-mix(in oklab, var(--primary) 38%, var(--line-color));
		background: var(--btn-regular-bg-hover);
	}

	.playlist-trigger:focus-visible {
		outline: none;
		border-color: color-mix(in oklab, var(--primary) 44%, var(--line-color));
		box-shadow: 0 0 0 2px color-mix(in oklab, var(--primary) 24%, transparent);
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
		gap: 0.16rem;
		padding: 0.3rem;
		max-height: 9.5rem;
		overflow-y: auto;
		border-radius: 0.88rem;
		border: 1px solid color-mix(in oklab, var(--primary) 24%, var(--line-color));
		background: var(--float-panel-bg);
		box-shadow: 0 10px 24px color-mix(in oklab, black 16%, transparent);
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
		border: 0;
		border-radius: 0.62rem;
		background: transparent;
		cursor: pointer;
		transition: background 130ms ease;
	}

	.playlist-option:hover {
		background: var(--btn-plain-bg-hover);
	}

	.playlist-option-label {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.98rem;
		font-weight: 600;
		line-height: 1;
		color: var(--btn-content);
	}

	.playlist-option.selected {
		background: color-mix(in oklab, var(--primary) 22%, var(--btn-regular-bg));
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
