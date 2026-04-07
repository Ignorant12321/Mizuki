<script lang="ts">
import { onDestroy, onMount } from "svelte";

import { live2dConfig } from "@/config";
import {
	DISPLAY_SETTINGS_CHANGED_EVENT,
	getStoredLive2dEnabled,
} from "@utils/setting-utils";

	type Side = "left" | "right";
	const LIVE2D_BASE_WIDTH_PX = 300;
	const LIVE2D_BASE_HEIGHT_PX = 300;

	const DEFAULT_POSITION = {
		desktop: {
			side: "right" as Side,
			offset: "1rem",
			bottom: "0",
			scale: 1,
		},
		mobile: {
			side: "right" as Side,
			offset: "0.5rem",
			bottom: "0",
			scale: 0.8,
		},
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
			scale:
				toValidScale(
					live2dConfig.position?.desktop?.scale,
					DEFAULT_POSITION.desktop.scale,
				),
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
			scale:
				toValidScale(
					live2dConfig.position?.mobile?.scale,
					DEFAULT_POSITION.mobile.scale,
				),
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

	function toValidScale(value: unknown, fallback: number): number {
		const parsed =
			typeof value === "number"
				? value
				: typeof value === "string"
					? Number(value)
					: NaN;
		return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
	}

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
		root.style.setProperty(
			"--live2d-base-width",
			`${LIVE2D_BASE_WIDTH_PX}px`,
		);
		root.style.setProperty(
			"--live2d-base-height",
			`${LIVE2D_BASE_HEIGHT_PX}px`,
		);
		root.style.setProperty(
			"--live2d-scale-desktop",
			String(position.desktop.scale),
		);
		root.style.setProperty(
			"--live2d-scale-mobile",
			String(position.mobile.scale),
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
		if (!getStoredLive2dEnabled()) {
			removeCurrentWaifuDom();
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
				mobile: live2dConfig.mobile || getStoredLive2dEnabled(),
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

	function toNonNegativeInt(value: unknown): number | null {
		const parsed = Number(value);
		if (!Number.isInteger(parsed) || parsed < 0) {
			return null;
		}
		return parsed;
	}

	function removeCurrentWaifuDom() {
		cleanupToolVisibility?.();
		cleanupToolVisibility = null;
		const waifu = document.getElementById("waifu");
		if (waifu) {
			waifu.remove();
		}
	}

	async function applyLive2dByConsole(
		modelId: number | null,
		textureId: number,
	): Promise<void> {
		if (typeof window === "undefined") {
			return;
		}
		if (modelId !== null) {
			localStorage.setItem("modelId", String(modelId));
		}
		localStorage.setItem("modelTexturesId", String(textureId));
		localStorage.removeItem("waifu-display");
		removeCurrentWaifuDom();
		initLive2d();
	}

	function exposeLive2dConsoleFunction() {
		(window as any).live2d = async (...args: unknown[]) => {
			if (args.length === 1) {
				const textureId = toNonNegativeInt(args[0]);
				if (textureId === null) {
					console.warn(
						"live2d(texture) 参数必须是非负整数，例如 live2d(2)",
					);
					return;
				}
				await applyLive2dByConsole(null, textureId);
				return;
			}

			if (args.length === 2) {
				const modelId = toNonNegativeInt(args[0]);
				const textureId = toNonNegativeInt(args[1]);
				if (modelId === null || textureId === null) {
					console.warn(
						"live2d(modelId, texture) 参数必须是非负整数，例如 live2d(5, 2)",
					);
					return;
				}
				await applyLive2dByConsole(modelId, textureId);
				return;
			}

			console.warn(
				"用法：live2d(texture) 或 live2d(modelId, texture)，例如 live2d(2) / live2d(5, 2)",
			);
		};
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

	function syncLive2dState() {
		if (!getStoredLive2dEnabled()) {
			removeCurrentWaifuDom();
			return;
		}
		if (!document.getElementById("waifu")) {
			initLive2d();
		}
	}

	onMount(() => {
		mounted = true;
		applyPositionVars();
		exposeLive2dConsoleFunction();

		const onSwupPageView = () => {
			syncLive2dState();
		};
		document.addEventListener("swup:page:view", onSwupPageView);
		window.addEventListener(DISPLAY_SETTINGS_CHANGED_EVENT, syncLive2dState);
		window.addEventListener("storage", syncLive2dState);

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
			window.removeEventListener(
				DISPLAY_SETTINGS_CHANGED_EVENT,
				syncLive2dState,
			);
			window.removeEventListener("storage", syncLive2dState);
		};
	});

	onDestroy(() => {
		if (typeof window !== "undefined") {
			delete (window as any).live2d;
		}
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
