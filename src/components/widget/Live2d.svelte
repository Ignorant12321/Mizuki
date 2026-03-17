<script>
	import { onDestroy, onMount } from "svelte";
	import { live2dConfig, siteConfig } from "@/config";

	// 全局状态引用
	let live2dInitialized = false;
	let live2dRetryCount = 0;
	let initRetryTimer = null;
	let toolAutoHideTimer = null;
	let isComponentMounted = false;
	let waifuContainer;
	let cleanupMobileToolToggle = () => {};
	let cleanupTouchEndHandler = () => {};
	let cleanupWheelGuard = () => {};
	let cleanupToggleReopenHandler = () => {};
	const MAX_INIT_RETRIES = 20;
	const live2dPosition = siteConfig.floatingWidgets?.live2d ?? {
		desktop: { side: "right", offset: "1.5rem", bottom: "0" },
		mobile: { side: "right", offset: "1.5rem", bottom: "0" },
		toggle: {
			offset: "0",
			hiddenOffset: "-100px",
			activeOffset: "-45px",
			hoverOffset: "-35px",
			mobileActiveOffset: "-30px",
		},
		timing: {
			enterExitDurationMs: 600,
			toolFadeDurationMs: 800,
			toolAutoHideDelayMs: 2200,
		},
		motion: {
			hiddenOffsetY: "calc(100% + 2rem)",
			idleOffsetY: "10px",
			hoverOffsetY: "0px",
		},
	};
	const live2dTiming = {
		enterExitDurationMs: Math.max(
			0,
			Number(live2dPosition.timing?.enterExitDurationMs ?? 1400),
		),
		toolFadeDurationMs: Math.max(
			0,
			Number(live2dPosition.timing?.toolFadeDurationMs ?? 80),
		),
		toolAutoHideDelayMs: Math.max(
			0,
			Number(live2dPosition.timing?.toolAutoHideDelayMs ?? 2200),
		),
	};
	const live2dMotion = {
		hiddenOffsetY:
			live2dPosition.motion?.hiddenOffsetY ?? "calc(100% + 2rem)",
		idleOffsetY: live2dPosition.motion?.idleOffsetY ?? "10px",
		hoverOffsetY: live2dPosition.motion?.hoverOffsetY ?? "0px",
	};
	const TOOL_AUTO_HIDE_DELAY = live2dTiming.toolAutoHideDelayMs;

	function applyPositionVars() {
		if (typeof document === "undefined") return;
		const root = document.documentElement;
		root.dataset.live2dDesktopSide = live2dPosition.desktop.side;
		root.dataset.live2dMobileSide = live2dPosition.mobile.side;
		root.style.setProperty(
			"--live2d-offset-desktop",
			live2dPosition.desktop.offset,
		);
		root.style.setProperty(
			"--live2d-bottom-desktop",
			live2dPosition.desktop.bottom,
		);
		root.style.setProperty(
			"--live2d-offset-mobile",
			live2dPosition.mobile.offset,
		);
		root.style.setProperty(
			"--live2d-bottom-mobile",
			live2dPosition.mobile.bottom,
		);
		root.style.setProperty(
			"--live2d-toggle-offset",
			live2dPosition.toggle.offset,
		);
		root.style.setProperty(
			"--live2d-toggle-hidden-offset",
			live2dPosition.toggle.hiddenOffset,
		);
		root.style.setProperty(
			"--live2d-toggle-active-offset",
			live2dPosition.toggle.activeOffset,
		);
		root.style.setProperty(
			"--live2d-toggle-hover-offset",
			live2dPosition.toggle.hoverOffset,
		);
		root.style.setProperty(
			"--live2d-toggle-mobile-active-offset",
			live2dPosition.toggle.mobileActiveOffset,
		);
		root.style.setProperty(
			"--live2d-enter-exit-duration",
			`${live2dTiming.enterExitDurationMs}ms`,
		);
		root.style.setProperty(
			"--live2d-tool-fade-duration",
			`${live2dTiming.toolFadeDurationMs}ms`,
		);
		root.style.setProperty(
			"--live2d-hidden-offset-y",
			live2dMotion.hiddenOffsetY,
		);
		root.style.setProperty(
			"--live2d-idle-offset-y",
			live2dMotion.idleOffsetY,
		);
		root.style.setProperty(
			"--live2d-hover-offset-y",
			live2dMotion.hoverOffsetY,
		);
	}

	// 解决图片资源跨域问题 (非常重要，否则 Canvas 渲染会报错)
	function fixCrossOrigin() {
		if (typeof window !== "undefined") {
			if (window.__live2dImagePatched) return;
			const OriginalImage = window.Image;
			const PatchedImage = function (...args) {
				const img = new OriginalImage(...args);
				img.crossOrigin = "anonymous";
				return img;
			};
			PatchedImage.prototype = OriginalImage.prototype;
			Object.setPrototypeOf(PatchedImage, OriginalImage);
			window.Image = PatchedImage;
			window.__live2dImagePatched = true;
		}
	}

	function scheduleInitRetry(reason) {
		if (!isComponentMounted || live2dInitialized) return;
		if (live2dRetryCount >= MAX_INIT_RETRIES) {
			console.error(
				`Live2D initialization aborted after ${MAX_INIT_RETRIES} retries (${reason})`,
			);
			return;
		}

		live2dRetryCount += 1;
		const delay = Math.min(100 * Math.pow(1.35, live2dRetryCount), 2000);

		if (initRetryTimer) {
			clearTimeout(initRetryTimer);
		}

		initRetryTimer = setTimeout(() => {
			initRetryTimer = null;
			initLive2d();
		}, delay);
	}

	function getLive2dElements() {
		const waifuEl = document.getElementById("waifu");
		return {
			waifuEl,
			waifuToolEl: waifuEl?.querySelector("#waifu-tool") ?? null,
			live2dEl: waifuEl?.querySelector("#live2d") ?? null,
		};
	}

	function isWaifuTemporarilyHiddenByUser() {
		if (typeof window === "undefined") return false;
		const hiddenAt = Number(localStorage.getItem("waifu-display") || 0);
		if (!Number.isFinite(hiddenAt) || hiddenAt <= 0) return false;
		return Date.now() - hiddenAt <= 86400000;
	}

	function armToggleReopenInit() {
		if (typeof window === "undefined") return () => {};
		const toggleEl = document.getElementById("waifu-toggle");
		if (!toggleEl) return () => {};
		let triggered = false;
		const onTogglePointerDown = () => {
			if (triggered) return;
			triggered = true;
			live2dInitialized = false;
			live2dRetryCount = 0;
			scheduleInitRetry("re-opened from waifu toggle");
		};
		toggleEl.addEventListener("pointerdown", onTogglePointerDown, true);
		return () => {
			toggleEl.removeEventListener(
				"pointerdown",
				onTogglePointerDown,
				true,
			);
		};
	}

	// 等待 DOM 和外部脚本加载完成后再初始化 Live2D
	function setupLive2dWheelGuard() {
		if (typeof window === "undefined") return () => {};
		const onWheelCapture = (event) => {
			const target = event.target;
			if (!(target instanceof Element)) return;
			if (target.closest("#waifu") || target.closest("#waifu-toggle")) {
				// 禁用 Live2D 区域的滚轮，避免误触缩放/库内手势
				event.preventDefault();
				event.stopPropagation();
			}
		};
		document.addEventListener("wheel", onWheelCapture, {
			capture: true,
			passive: false,
		});
		return () => {
			document.removeEventListener("wheel", onWheelCapture, {
				capture: true,
			});
		};
	}

	function setupToolAutoHide() {
		if (typeof window === "undefined") return () => {};
		const { waifuEl, waifuToolEl, live2dEl } = getLive2dElements();
		waifuContainer = waifuEl;
		if (!waifuEl || !waifuToolEl || !live2dEl) return () => {};

		const clearHideTimer = () => {
			if (toolAutoHideTimer) {
				clearTimeout(toolAutoHideTimer);
				toolAutoHideTimer = null;
			}
		};

		const hideTools = (waifuEl) => {
			if (!waifuEl) return;
			waifuEl.classList.remove("waifu-tool-visible");
			clearHideTimer();
		};

		const scheduleHide = (waifuEl) => {
			if (!waifuEl) return;
			clearHideTimer();
			toolAutoHideTimer = setTimeout(() => {
				hideTools(waifuEl);
			}, TOOL_AUTO_HIDE_DELAY);
		};

		const showTools = (waifuEl) => {
			if (!waifuEl) return;
			waifuEl.classList.add("waifu-tool-visible");
			scheduleHide(waifuEl);
		};

		// 默认隐藏
		waifuEl.classList.remove("waifu-tool-visible");

		// 使用 document 捕获阶段监听，避免被 Live2D 内部脚本阻断冒泡事件
		const onPointerDownCapture = (event) => {
			const target = event.target;
			if (!(target instanceof Element)) return;
			const clickedWaifu = target.closest("#waifu");
			const inThisWaifu = clickedWaifu === waifuEl;
			const inTool = waifuToolEl.contains(target);
			const inLive2d = live2dEl.contains(target);

			if (inThisWaifu && inTool) {
				// 点击工具栏：保持显示并续时
				scheduleHide(waifuEl);
				return;
			}

			if (inThisWaifu && inLive2d) {
				// 点击 Live2D 画布：显示工具栏
				showTools(waifuEl);
				return;
			}

			if (!inThisWaifu) {
				// 点击外部：立即隐藏
				hideTools(waifuEl);
			}
		};
		document.addEventListener("pointerdown", onPointerDownCapture, true);

		return () => {
			document.removeEventListener(
				"pointerdown",
				onPointerDownCapture,
				true,
			);
			clearHideTimer();
		};
	}

	function initLive2d() {
		if (
			typeof window !== "undefined" &&
			typeof initWidget !== "undefined"
		) {
			try {
				const existingWaifu = document.getElementById("waifu");
				if (!existingWaifu && !live2dInitialized) {
					initWidget({
						waifuPath: live2dConfig.waifuTipsPath,
						cdnPath:
							"https://fastly.jsdelivr.net/gh/fghrsh/live2d_api/",
						cubism2Path: live2dConfig.live2dPath + "live2d.min.js",
						cubism5Path:
							"https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js",
						tools: live2dConfig.tools,
						modelId: live2dConfig.modelId,
						logLevel: live2dConfig.logLevel,
						drag: live2dConfig.drag,
					});
				}

				setTimeout(() => {
					const { waifuEl, waifuToolEl } = getLive2dElements();
					if (!waifuEl || !waifuToolEl) {
						const hasToggle =
							!!document.getElementById("waifu-toggle");
						if (hasToggle && isWaifuTemporarilyHiddenByUser()) {
							live2dInitialized = true;
							live2dRetryCount = 0;
							cleanupToggleReopenHandler();
							cleanupToggleReopenHandler = armToggleReopenInit();
							console.info(
								"Live2D is hidden by user preference, skip retry until re-opened from toggle.",
							);
							return;
						}
						console.warn(
							"Live2D DOM elements not found, retrying...",
						);
						scheduleInitRetry("missing library-generated #waifu");
						return;
					}

					waifuContainer = waifuEl;
					live2dInitialized = true;
					live2dRetryCount = 0;
					console.log("Live2D initialized successfully (Svelte)");
					cleanupToggleReopenHandler();
					cleanupToggleReopenHandler = () => {};
					cleanupMobileToolToggle();
					cleanupMobileToolToggle = setupToolAutoHide();

					if (
						live2dConfig.tools.includes("home") &&
						!document.getElementById("waifu-tool-home")
					) {
						const homeBtn = document.createElement("span");
						homeBtn.id = "waifu-tool-home";
						homeBtn.innerHTML =
							'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor"><path d="M575.8 255.5c0 18-15 32.1-32 32.1h-32l.7 160.2c0 2.7-.2 5.4-.5 8.1V472c0 22.1-17.9 40-40 40H456c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1H416 392c-22.1 0-40-17.9-40-40V448 384c0-17.7-14.3-32-32-32H256c-17.7 0-32 14.3-32 32v64 24c0 22.1-17.9 40-40 40H160 128.1c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2H104c-22.1 0-40-17.9-40-40V360c0-.9 0-1.9 .1-2.8V287.6H32c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"/></svg>';
						homeBtn.onclick = () => {
							if (typeof window !== "undefined" && window.swup) {
								window.swup.navigate("/");
							} else {
								const tempLink = document.createElement("a");
								tempLink.href = "/";
								document.body.appendChild(tempLink);
								tempLink.click();
								document.body.removeChild(tempLink);
							}
						};
						waifuToolEl.prepend(homeBtn);
					}
				}, 250);
			} catch (e) {
				console.error("Live2D initialization error:", e);
				scheduleInitRetry("initWidget runtime error");
			}
		} else {
			// 如果 initWidget 还未定义，稍后再试
			scheduleInitRetry("initWidget not ready");
		}
	}

	// 加载必要的脚本
	function loadLive2dAssets() {
		if (typeof window === "undefined") return;
		// 加载 JS 脚本的 Promise 封装
		const loadScript = (src, id) => {
			return new Promise((resolve, reject) => {
				if (document.querySelector(`#${id}`)) {
					resolve();
					return;
				}
				const script = document.createElement("script");
				script.id = id;
				script.src = src;
				script.type = "module";
				script.onload = resolve;
				script.onerror = reject;
				document.head.appendChild(script);
			});
		};

		// 核心逻辑：加载 waifu-tips.js 后触发初始化
		loadScript(
			live2dConfig.live2dPath + "waifu-tips.js",
			"live2d-tips-script",
		)
			.then(() => {
				setTimeout(initLive2d, 100);
			})
			.catch((error) => {
				console.error("Failed to load Live2D scripts:", error);
			});
	}

	onMount(() => {
		isComponentMounted = true;
		applyPositionVars();
		if (!live2dConfig.enable) return;
		if (!live2dConfig.mobile) {
			// 移动端/小屏幕隐藏逻辑 (<768px)
			if (window.matchMedia("(max-width: 768px)").matches) {
				return;
			}
		}

		fixCrossOrigin();
		loadLive2dAssets();
		cleanupWheelGuard();
		cleanupWheelGuard = setupLive2dWheelGuard();

		// 触摸屏点击事件
		if (typeof window !== "undefined") {
			const handleTouchEnd = (e) => {
				const target = e.target;
				if (target && target.id === "live2d") {
					const touch = e.changedTouches[0];
					const clientX = touch ? touch.clientX : 0;
					const clientY = touch ? touch.clientY : 0;

					setTimeout(() => {
						const clickEvent = new MouseEvent("click", {
							bubbles: true,
							cancelable: true,
							view: window,
							clientX: clientX,
							clientY: clientY,
						});
						target.dispatchEvent(clickEvent);
					}, 50);
				}
			};

			window.addEventListener("touchend", handleTouchEnd, {
				capture: true,
				passive: true,
			});
			cleanupTouchEndHandler = () => {
				window.removeEventListener("touchend", handleTouchEnd, {
					capture: true,
				});
			};
		}
	});

	onDestroy(() => {
		isComponentMounted = false;
		if (initRetryTimer) {
			clearTimeout(initRetryTimer);
			initRetryTimer = null;
		}
		if (toolAutoHideTimer) {
			clearTimeout(toolAutoHideTimer);
			toolAutoHideTimer = null;
		}
		// Svelte 组件销毁时不需要清理实例
		// 效仿原版 Pio：在 Astro 的 View Transitions 页面切换时保持看板娘状态存活
		console.log(
			"Live2D Svelte component destroyed (keeping instance alive)",
		);
		cleanupMobileToolToggle();
		cleanupTouchEndHandler();
		cleanupWheelGuard();
		cleanupToggleReopenHandler();
	});
</script>

<style global>
	/* 使用 global 确保 Svelte 样式能够穿透到 JS 动态生成的元素上 */
	:global(#waifu, #waifu-toggle) {
		z-index: 40 !important;
	}
	:global(#waifu-tool) {
		z-index: 60 !important;
		opacity: 0 !important;
		visibility: hidden !important;
		pointer-events: none !important;
		transition: opacity var(--live2d-tool-fade-duration, 80ms) ease !important;
	}
	:global(#waifu:hover #waifu-tool) {
		opacity: 0 !important;
		visibility: hidden !important;
		pointer-events: none !important;
	}
	:global(#waifu.waifu-tool-visible #waifu-tool) {
		opacity: 1 !important;
		visibility: visible !important;
		pointer-events: auto !important;
	}

	:global(#waifu) {
		left: auto !important;
		right: auto !important;
		bottom: var(--live2d-bottom-desktop, 0) !important;
		opacity: 0 !important;
		transform: translateY(
			var(--live2d-hidden-offset-y, calc(100% + 2rem))
		) !important;
		transition:
			transform var(--live2d-enter-exit-duration, 1400ms)
				cubic-bezier(0.22, 1, 0.36, 1),
			opacity var(--live2d-enter-exit-duration, 1400ms)
				cubic-bezier(0.22, 1, 0.36, 1) !important;
		will-change: transform, opacity;
		pointer-events: none;
	}

	:global(html[data-live2d-desktop-side="left"] #waifu) {
		left: var(--live2d-offset-desktop, 1.5rem) !important;
		right: auto !important;
	}

	:global(html[data-live2d-desktop-side="right"] #waifu) {
		left: auto !important;
		right: var(--live2d-offset-desktop, 1.5rem) !important;
	}

	:global(#waifu.waifu-active) {
		opacity: 1 !important;
		transform: translateY(var(--live2d-idle-offset-y, 10px)) !important;
		pointer-events: auto;
	}

	:global(#waifu.waifu-active:hover) {
		transform: translateY(var(--live2d-hover-offset-y, 0px)) !important;
	}

	:global(#waifu:not(.waifu-active)) {
		opacity: 0 !important;
		transform: translateY(
			var(--live2d-hidden-offset-y, calc(100% + 2rem))
		) !important;
		pointer-events: none;
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
			left: var(--live2d-offset-mobile, 1.5rem) !important;
			right: auto !important;
			bottom: var(--live2d-bottom-mobile, 0) !important;
		}

		:global(html[data-live2d-mobile-side="right"] #waifu) {
			left: auto !important;
			right: var(--live2d-offset-mobile, 1.5rem) !important;
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

		:global(
			html[data-live2d-mobile-side="left"]
				#waifu-toggle.waifu-toggle-active
		) {
			margin-left: var(
				--live2d-toggle-mobile-active-offset,
				-30px
			) !important;
			margin-right: 0 !important;
		}

		:global(
			html[data-live2d-mobile-side="right"]
				#waifu-toggle.waifu-toggle-active
		) {
			margin-left: 0 !important;
			margin-right: var(
				--live2d-toggle-mobile-active-offset,
				-30px
			) !important;
		}

		:global(html[data-live2d-mobile-side="left"] #waifu-toggle:hover) {
			margin-left: var(--live2d-toggle-hover-offset, -35px) !important;
			margin-right: 0 !important;
		}

		:global(html[data-live2d-mobile-side="right"] #waifu-toggle:hover) {
			margin-left: 0 !important;
			margin-right: var(--live2d-toggle-hover-offset, -35px) !important;
		}
	}
</style>
