<script lang="ts">
	import { onDestroy, onMount } from "svelte";

	import { live2dConfig } from "@/config";

	type Side = "left" | "right";

	const DEFAULT_POSITION = {
		desktop: { side: "right" as Side, offset: "1rem", bottom: "0" },
		mobile: { side: "right" as Side, offset: "0.5rem", bottom: "0" },
		toggle: {
			offset: "0",
			hiddenOffset: "-100px",
			activeOffset: "-45px",
			hoverOffset: "-35px",
			mobileActiveOffset: "-30px",
		},
	};

	const position = {
		desktop: {
			side:
				live2dConfig.position?.desktop?.side ??
				DEFAULT_POSITION.desktop.side,
			offset:
				live2dConfig.position?.desktop?.offset ??
				DEFAULT_POSITION.desktop.offset,
			bottom:
				live2dConfig.position?.desktop?.bottom ??
				DEFAULT_POSITION.desktop.bottom,
		},
		mobile: {
			side:
				live2dConfig.position?.mobile?.side ??
				DEFAULT_POSITION.mobile.side,
			offset:
				live2dConfig.position?.mobile?.offset ??
				DEFAULT_POSITION.mobile.offset,
			bottom:
				live2dConfig.position?.mobile?.bottom ??
				DEFAULT_POSITION.mobile.bottom,
		},
		toggle: {
			offset:
				live2dConfig.position?.toggle?.offset ??
				DEFAULT_POSITION.toggle.offset,
			hiddenOffset:
				live2dConfig.position?.toggle?.hiddenOffset ??
				DEFAULT_POSITION.toggle.hiddenOffset,
			activeOffset:
				live2dConfig.position?.toggle?.activeOffset ??
				DEFAULT_POSITION.toggle.activeOffset,
			hoverOffset:
				live2dConfig.position?.toggle?.hoverOffset ??
				DEFAULT_POSITION.toggle.hoverOffset,
			mobileActiveOffset:
				live2dConfig.position?.toggle?.mobileActiveOffset ??
				DEFAULT_POSITION.toggle.mobileActiveOffset,
		},
	};

	let mounted = false;
	let retryCount = 0;
	let retryTimer: ReturnType<typeof setTimeout> | null = null;
	let bootstrapTimer: number | ReturnType<typeof setTimeout> | null = null;
	let toolAutoHideTimer: ReturnType<typeof setTimeout> | null = null;
	let tipsRevealTimer: ReturnType<typeof setTimeout> | null = null;
	const MAX_RETRIES = 20;
	const TOOL_AUTO_HIDE_DELAY = 2200;
	const TIPS_REVEAL_DELAY = 420;

	function applyPositionVars() {
		if (typeof document === "undefined") {
			return;
		}
		const root = document.documentElement;
		root.dataset.live2dDesktopSide = position.desktop.side;
		root.dataset.live2dMobileSide = position.mobile.side;
		root.style.setProperty(
			"--live2d-offset-desktop",
			position.desktop.offset,
		);
		root.style.setProperty(
			"--live2d-bottom-desktop",
			position.desktop.bottom,
		);
		root.style.setProperty(
			"--live2d-offset-mobile",
			position.mobile.offset,
		);
		root.style.setProperty(
			"--live2d-bottom-mobile",
			position.mobile.bottom,
		);
		root.style.setProperty(
			"--live2d-toggle-offset",
			position.toggle.offset,
		);
		root.style.setProperty(
			"--live2d-toggle-hidden-offset",
			position.toggle.hiddenOffset,
		);
		root.style.setProperty(
			"--live2d-toggle-active-offset",
			position.toggle.activeOffset,
		);
		root.style.setProperty(
			"--live2d-toggle-hover-offset",
			position.toggle.hoverOffset,
		);
		root.style.setProperty(
			"--live2d-toggle-mobile-active-offset",
			position.toggle.mobileActiveOffset,
		);
	}

	function patchImageCrossOrigin() {
		if (typeof window === "undefined") {
			return;
		}
		if ((window as any).__live2dImagePatched) {
			return;
		}
		const OriginalImage = window.Image;
		const PatchedImage = function (
			...args: ConstructorParameters<typeof Image>
		) {
			const img = new OriginalImage(...args);
			img.crossOrigin = "anonymous";
			return img;
		};
		PatchedImage.prototype = OriginalImage.prototype;
		Object.setPrototypeOf(PatchedImage, OriginalImage);
		window.Image = PatchedImage as unknown as typeof Image;
		(window as any).__live2dImagePatched = true;
	}

	function loadScript(src: string, id: string): Promise<void> {
		return new Promise((resolve, reject) => {
			if (document.querySelector(`#${id}`)) {
				resolve();
				return;
			}
			const script = document.createElement("script");
			script.id = id;
			script.src = src;
			script.type = "module";
			script.onload = () => resolve();
			script.onerror = () => reject(new Error(`Failed to load ${src}`));
			document.head.appendChild(script);
		});
	}

	function clearTipsRevealTimer() {
		if (tipsRevealTimer) {
			clearTimeout(tipsRevealTimer);
			tipsRevealTimer = null;
		}
	}

	function revealTipsAfterAvatar(waifuElement: HTMLElement) {
		clearTipsRevealTimer();
		waifuElement.classList.remove("live2d-model-ready");
		tipsRevealTimer = setTimeout(() => {
			if (mounted && document.body.contains(waifuElement)) {
				waifuElement.classList.add("live2d-model-ready");
			}
		}, TIPS_REVEAL_DELAY);
	}

	function getWaifuElements() {
		const waifu = document.getElementById("waifu");
		return {
			waifu,
			tool: waifu?.querySelector("#waifu-tool") as HTMLElement | null,
			canvas: waifu?.querySelector("#live2d") as HTMLElement | null,
		};
	}

	function scheduleRetry(reason: string) {
		if (!mounted) {
			return;
		}
		if (retryCount >= MAX_RETRIES) {
			console.error(
				`Live2D init failed after ${MAX_RETRIES} retries: ${reason}`,
			);
			return;
		}
		retryCount += 1;
		const delay = Math.min(100 * Math.pow(1.35, retryCount), 2000);
		if (retryTimer) {
			clearTimeout(retryTimer);
		}
		retryTimer = setTimeout(() => {
			retryTimer = null;
			initLive2d();
		}, delay);
	}

	function setupToolVisibility() {
		const { waifu, tool, canvas } = getWaifuElements();
		if (!waifu || !tool || !canvas) {
			return () => {};
		}

		const clearToolTimer = () => {
			if (toolAutoHideTimer) {
				clearTimeout(toolAutoHideTimer);
				toolAutoHideTimer = null;
			}
		};

		const hideTools = () => {
			waifu.classList.remove("waifu-tool-visible");
			clearToolTimer();
		};

		const showTools = () => {
			waifu.classList.add("waifu-tool-visible");
			clearToolTimer();
			toolAutoHideTimer = setTimeout(() => {
				hideTools();
			}, TOOL_AUTO_HIDE_DELAY);
		};

		const onPointerDown = (event: Event) => {
			const target = event.target;
			if (!(target instanceof Element)) {
				return;
			}
			const inWaifu = waifu.contains(target);
			const inTool = tool.contains(target);
			const inCanvas = canvas.contains(target);

			if (inWaifu && (inTool || inCanvas)) {
				showTools();
				return;
			}
			if (!inWaifu) {
				hideTools();
			}
		};

		document.addEventListener("pointerdown", onPointerDown, true);
		showTools();

		return () => {
			document.removeEventListener("pointerdown", onPointerDown, true);
			clearToolTimer();
		};
	}

	let cleanupToolVisibility: (() => void) | null = null;

	function initLive2d() {
		if (!mounted || typeof window === "undefined") {
			return;
		}
		if (document.getElementById("waifu")) {
			return;
		}

		const initWidget = (window as any).initWidget;
		if (typeof initWidget !== "function") {
			scheduleRetry("initWidget not ready");
			return;
		}

		try {
			const hasModelId = localStorage.getItem("modelId") !== null;
			if (!hasModelId) {
				localStorage.setItem("modelId", String(live2dConfig.modelId));
			}

			const hasTextureId = localStorage.getItem("modelTexturesId") !== null;
			if (!hasTextureId) {
				localStorage.setItem(
					"modelTexturesId",
					String(live2dConfig.modelTexturesId),
				);
			}

			const widgetOptions: Record<string, unknown> = {
				waifuPath: live2dConfig.paths.waifuTipsJson,
				cubism2Path: live2dConfig.paths.cubism2Core,
				cubism5Path: live2dConfig.paths.cubism5Core,
				tools: [...live2dConfig.tools],
				modelId: live2dConfig.modelId,
				logLevel: live2dConfig.logLevel,
				drag: live2dConfig.drag,
				mobile: live2dConfig.mobile,
			};
			const rawCdnPath =
				"cdnPath" in live2dConfig.paths
					? (live2dConfig.paths as { cdnPath?: string }).cdnPath
					: "";
			const cdnPath = (rawCdnPath ?? "").trim();
			if (cdnPath) {
				widgetOptions.cdnPath = cdnPath;
			}
			initWidget(widgetOptions);
		} catch (error) {
			console.error("Live2D initWidget error:", error);
			scheduleRetry("initWidget runtime error");
			return;
		}

		setTimeout(() => {
			const waifuElement = document.getElementById("waifu");
			if (!waifuElement) {
				scheduleRetry("waifu dom not created");
				return;
			}
			retryCount = 0;
			revealTipsAfterAvatar(waifuElement);

			const waifuTool = waifuElement.querySelector("#waifu-tool");
			if (
				live2dConfig.tools.includes("home") &&
				waifuTool instanceof HTMLElement &&
				!document.getElementById("waifu-tool-home")
			) {
				const homeBtn = document.createElement("span");
				homeBtn.id = "waifu-tool-home";
				homeBtn.innerHTML =
					'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor"><path d="M575.8 255.5c0 18-15 32.1-32 32.1h-32l.7 160.2c0 2.7-.2 5.4-.5 8.1V472c0 22.1-17.9 40-40 40H456c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1H416 392c-22.1 0-40-17.9-40-40V448 384c0-17.7-14.3-32-32-32H256c-17.7 0-32 14.3-32 32v64 24c0 22.1-17.9 40-40 40H160 128.1c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2H104c-22.1 0-40-17.9-40-40V360c0-.9 0-1.9 .1-2.8V287.6H32c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"/></svg>';
				homeBtn.onclick = () => {
					const swup = (window as any).swup;
					if (swup?.navigate) {
						swup.navigate("/");
					} else {
						window.location.href = "/";
					}
				};
				waifuTool.prepend(homeBtn);
			}

			cleanupToolVisibility?.();
			cleanupToolVisibility = setupToolVisibility();
		}, 250);
	}

	function bootstrapLive2d() {
		patchImageCrossOrigin();
		loadScript(live2dConfig.paths.waifuTipsJs, "live2d-tips-script")
			.then(() => {
				setTimeout(initLive2d, 100);
			})
			.catch((error) => {
				console.error("Live2D script load error:", error);
			});
	}

	onMount(() => {
		if (!live2dConfig.enable) {
			return;
		}
		mounted = true;
		applyPositionVars();

		const onSwupPageView = () => {
			if (!document.getElementById("waifu")) {
				initLive2d();
			}
		};
		document.addEventListener("swup:page:view", onSwupPageView);

		const runBootstrap = () => {
			bootstrapTimer = null;
			bootstrapLive2d();
		};
		if ("requestIdleCallback" in window) {
			bootstrapTimer = (window as any).requestIdleCallback(runBootstrap, {
				timeout: 1500,
			});
		} else {
			bootstrapTimer = setTimeout(runBootstrap, 300);
		}

		return () => {
			document.removeEventListener("swup:page:view", onSwupPageView);
		};
	});

	onDestroy(() => {
		mounted = false;
		if (retryTimer) {
			clearTimeout(retryTimer);
			retryTimer = null;
		}
		if (bootstrapTimer) {
			if ("cancelIdleCallback" in window) {
				(window as any).cancelIdleCallback(bootstrapTimer);
			} else {
				clearTimeout(bootstrapTimer as ReturnType<typeof setTimeout>);
			}
			bootstrapTimer = null;
		}
		if (toolAutoHideTimer) {
			clearTimeout(toolAutoHideTimer);
			toolAutoHideTimer = null;
		}
		clearTipsRevealTimer();
		cleanupToolVisibility?.();
		cleanupToolVisibility = null;
	});
</script>

<style global>
	:global(#waifu, #waifu-toggle) {
		z-index: 3000 !important;
	}

	:global(#waifu-tool) {
		z-index: 3001 !important;
		opacity: 0 !important;
		visibility: hidden !important;
		pointer-events: none !important;
		transition: opacity 220ms ease !important;
	}

	:global(#waifu.waifu-tool-visible #waifu-tool) {
		opacity: 1 !important;
		visibility: visible !important;
		pointer-events: auto !important;
	}

	:global(#waifu:not(.live2d-model-ready) #waifu-tips) {
		opacity: 0 !important;
		visibility: hidden !important;
	}

	:global(#waifu.live2d-model-ready #waifu-tips) {
		opacity: 1 !important;
		visibility: visible !important;
		transition: opacity 220ms ease !important;
	}

	:global(#waifu) {
		left: auto !important;
		right: auto !important;
		bottom: var(--live2d-bottom-desktop, 0) !important;
	}

	:global(html[data-live2d-desktop-side="left"] #waifu) {
		left: var(--live2d-offset-desktop, 1rem) !important;
		right: auto !important;
	}

	:global(html[data-live2d-desktop-side="right"] #waifu) {
		left: auto !important;
		right: var(--live2d-offset-desktop, 1rem) !important;
	}

	:global(#waifu-toggle) {
		left: auto !important;
		right: auto !important;
		margin-left: 0 !important;
		margin-right: 0 !important;
		transition:
			margin-left 1s,
			margin-right 1s,
			transform 0.3s ease;
	}

	:global(html[data-live2d-desktop-side="left"] #waifu-toggle) {
		left: var(--live2d-toggle-offset, 0) !important;
		right: auto !important;
		transform: none;
		margin-left: var(--live2d-toggle-hidden-offset, -100px) !important;
		margin-right: 0 !important;
	}

	:global(html[data-live2d-desktop-side="right"] #waifu-toggle) {
		left: auto !important;
		right: var(--live2d-toggle-offset, 0) !important;
		transform: rotateY(180deg);
		margin-left: 0 !important;
		margin-right: var(--live2d-toggle-hidden-offset, -100px) !important;
	}

	:global(
		html[data-live2d-desktop-side="left"] #waifu-toggle.waifu-toggle-active
	) {
		margin-left: var(--live2d-toggle-active-offset, -45px) !important;
		margin-right: 0 !important;
	}

	:global(
		html[data-live2d-desktop-side="right"] #waifu-toggle.waifu-toggle-active
	) {
		margin-left: 0 !important;
		margin-right: var(--live2d-toggle-active-offset, -45px) !important;
	}

	:global(html[data-live2d-desktop-side="left"] #waifu-toggle:hover) {
		margin-left: var(--live2d-toggle-hover-offset, -35px) !important;
		margin-right: 0 !important;
	}

	:global(html[data-live2d-desktop-side="right"] #waifu-toggle:hover) {
		margin-left: 0 !important;
		margin-right: var(--live2d-toggle-hover-offset, -35px) !important;
	}

	@media (max-width: 768px), (hover: none) {
		:global(html[data-live2d-mobile-side="left"] #waifu) {
			left: var(--live2d-offset-mobile, 0.5rem) !important;
			right: auto !important;
			bottom: var(--live2d-bottom-mobile, 0) !important;
		}

		:global(html[data-live2d-mobile-side="right"] #waifu) {
			left: auto !important;
			right: var(--live2d-offset-mobile, 0.5rem) !important;
			bottom: var(--live2d-bottom-mobile, 0) !important;
		}

		:global(html[data-live2d-mobile-side="left"] #waifu-toggle) {
			left: var(--live2d-toggle-offset, 0) !important;
			right: auto !important;
			transform: none;
			margin-left: var(--live2d-toggle-hidden-offset, -100px) !important;
			margin-right: 0 !important;
		}

		:global(html[data-live2d-mobile-side="right"] #waifu-toggle) {
			left: auto !important;
			right: var(--live2d-toggle-offset, 0) !important;
			transform: rotateY(180deg);
			margin-left: 0 !important;
			margin-right: var(--live2d-toggle-hidden-offset, -100px) !important;
		}
	}
</style>
