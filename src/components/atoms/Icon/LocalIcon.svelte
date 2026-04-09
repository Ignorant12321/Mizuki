<script lang="ts">
	/**
	 * Local Icon component for Svelte
	 * Uses icons from @iconify-json packages installed locally - no CDN required
	 */
	interface Props {
		icon: string;
		class?: string;
	}

	const { icon, class: className = "" }: Props = $props();

	const iconSetMap: Record<string, string> = {
		"material-symbols": "@iconify-json/material-symbols",
		"material-symbols-outlined": "@iconify-json/material-symbols",
		mdi: "@iconify-json/mdi",
		"fa7-solid": "@iconify-json/fa7-solid",
		"fa7-regular": "@iconify-json/fa7-regular",
		"fa7-brands": "@iconify-json/fa7-brands",
		"simple-icons": "@iconify-json/simple-icons",
	};

	const iconParts = $derived(icon.includes(":") ? icon.split(":") : ["mdi", icon]);
	const collection = $derived(iconParts[0] ?? "mdi");
	const name = $derived(iconParts[1] ?? icon);
	const packageName = $derived(iconSetMap[collection]);
	let svgContent = $state("");

	async function loadIcon(
		iconName: string,
		iconPackageName: string | undefined,
		iconKey: string,
		svgClassName: string,
	) {
		if (!iconPackageName) {
			svgContent = "";
			return;
		}

		try {
			const iconsData = await import(
				/* @vite-ignore */ `${iconPackageName}/icons.json`
			);
			const icons = iconsData.icons || {};
			const iconData = icons[iconKey];

			if (iconData) {
				const viewBox = iconData.viewBox || "0 0 24 24";
				const body = iconData.body;

				if (body) {
					svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" class="${svgClassName}">${body}</svg>`;
					return;
				}
			}

			svgContent = "";
		} catch (e) {
			svgContent = "";
			console.warn(`Failed to load icon ${iconName} from ${iconPackageName}:`, e);
		}
	}

	$effect(() => {
		void loadIcon(icon, packageName, name, className);
	});
</script>

{#if svgContent}
	{@html svgContent}
{:else}
	<span class={className}>●</span>
{/if}
