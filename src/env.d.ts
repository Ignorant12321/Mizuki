/// <reference types="astro/client" />

declare module "*.astro" {
	const AstroComponent: (...args: any[]) => any;
	export default AstroComponent;
}

declare module "*.svelte" {
	import type { Component } from "svelte";

	const SvelteComponent: Component<any>;
	export default SvelteComponent;
}

declare global {
	interface WindowEventMap {
		layoutChange: CustomEvent<{ layout: "list" | "grid" }>;
	}
}
