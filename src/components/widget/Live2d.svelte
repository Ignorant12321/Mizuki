<script>
	import { onDestroy, onMount } from "svelte";
	import { live2dConfig } from "@/config";

	// 全局状态引用
	let live2dInitialized = false;
	let live2dRetryCount = 0;
	let initRetryTimer = null;
	let isComponentMounted = false;
	let waifuContainer;
	let cleanupMobileToolToggle = () => {};
	let cleanupTouchEndHandler = () => {};
	const MAX_INIT_RETRIES = 20;

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
		const delay = Math.min(
			100 * Math.pow(1.35, live2dRetryCount),
			2000,
		);

		if (initRetryTimer) {
			clearTimeout(initRetryTimer);
		}

		initRetryTimer = setTimeout(() => {
			initRetryTimer = null;
			initLive2d();
		}, delay);
	}

	// 等待 DOM 和外部脚本加载完成后再初始化 Live2D
	function setupMobileToolToggle() {
		if (typeof window === "undefined") return () => {};

		const isTouchLikeDevice = window.matchMedia(
			"(hover: none), (pointer: coarse)",
		).matches;
		if (!isTouchLikeDevice) return () => {};

		const waifuEl = document.getElementById("waifu");
		if (!waifuEl) return () => {};

		const toggleTools = (event) => {
			const target = event.target;
			if (!(target instanceof Element)) return;
			if (target.closest("#waifu-tool")) return;

			if (target.closest("#waifu")) {
				waifuEl.classList.toggle("waifu-tool-visible");
			}
		};

		const hideToolsOnOutsideClick = (event) => {
			const target = event.target;
			if (!(target instanceof Node)) return;
			if (!waifuEl.contains(target)) {
				waifuEl.classList.remove("waifu-tool-visible");
			}
		};

		waifuEl.addEventListener("click", toggleTools);
		document.addEventListener("click", hideToolsOnOutsideClick, true);

		return () => {
			waifuEl.removeEventListener("click", toggleTools);
			document.removeEventListener("click", hideToolsOnOutsideClick, true);
		};
	}

	function initLive2d() {
		if (
			typeof window !== "undefined" &&
			typeof initWidget !== "undefined"
		) {
			try {
				// 确保 DOM 元素存在且未被初始化过
				if (waifuContainer && !live2dInitialized) {
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
					live2dInitialized = true;
					live2dRetryCount = 0;
					console.log("Live2D initialized successfully (Svelte)");
					cleanupMobileToolToggle();
					cleanupMobileToolToggle = setupMobileToolToggle();

					// 添加返回主页按钮
					if (live2dConfig.tools.includes("home")) {
						setTimeout(() => {
							const toolMenu =
								document.getElementById("waifu-tool");
							if (
								toolMenu &&
								!document.getElementById("waifu-tool-home")
							) {
								const homeBtn = document.createElement("span");
								homeBtn.id = "waifu-tool-home";

								// 注入房屋形状的 SVG 图标
								homeBtn.innerHTML =
									'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor"><path d="M575.8 255.5c0 18-15 32.1-32 32.1h-32l.7 160.2c0 2.7-.2 5.4-.5 8.1V472c0 22.1-17.9 40-40 40H456c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1H416 392c-22.1 0-40-17.9-40-40V448 384c0-17.7-14.3-32-32-32H256c-17.7 0-32 14.3-32 32v64 24c0 22.1-17.9 40-40 40H160 128.1c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2H104c-22.1 0-40-17.9-40-40V360c0-.9 0-1.9 .1-2.8V287.6H32c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"/></svg>';

								// 点击跳转到主页 (适配无刷新路由)
								homeBtn.onclick = () => {
									// 优先检测是否启用了 Swup 无刷新路由
									if (
										typeof window !== "undefined" &&
										window.swup
									) {
										window.swup.navigate("/");
									}
									// 兜底方案：模拟真实点击 a 标签，让各种前端路由（如 Astro View Transitions）自动拦截并接管
									else {
										const tempLink =
											document.createElement("a");
										tempLink.href = "/";
										document.body.appendChild(tempLink);
										tempLink.click();
										document.body.removeChild(tempLink);
									}
								};

								// 将按钮插入到工具栏最上面
								toolMenu.prepend(homeBtn);
							}
						}, 500); // 延时 500ms 确保原版内部工具已经挂载完毕
					}
				} else if (!waifuContainer) {
					console.warn("Live2D DOM elements not found, retrying...");
					scheduleInitRetry("missing #waifu container");
				}
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
		if (!live2dConfig.enable) return;
		if (!live2dConfig.mobile) {
			// 移动端/小屏幕隐藏逻辑 (<768px)
			if (window.matchMedia("(max-width: 768px)").matches) {
				return;
			}
		}

		fixCrossOrigin();
		loadLive2dAssets();

		// 拦截滚轮事件，防止在看板娘上滚动时页面卡顿
		const canvas = document.getElementById("live2d");
		if (canvas) {
			canvas.addEventListener(
				"wheel",
				(e) => {
					e.stopImmediatePropagation();
				},
				{ passive: true, capture: true },
			);
		}
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
		// Svelte 组件销毁时不需要清理实例
		// 效仿原版 Pio：在 Astro 的 View Transitions 页面切换时保持看板娘状态存活
		console.log(
			"Live2D Svelte component destroyed (keeping instance alive)",
		);
		cleanupMobileToolToggle();
		cleanupTouchEndHandler();
	});
</script>

{#if live2dConfig.enable}
	<div id="waifu" bind:this={waifuContainer}>
		<div id="waifu-tips"></div>
		<canvas id="live2d" width="800" height="800"></canvas>
		<div id="waifu-tool"></div>
	</div>
{/if}

<style global>
	/* 使用 global 确保 Svelte 样式能够穿透到 JS 动态生成的元素上 */

	@media (max-width: 768px), (hover: none) {
		:global(#waifu-toggle.waifu-toggle-active) {
			margin-left: -30px !important;
		}
		:global(#waifu-tool) {
			opacity: 0 !important;
			pointer-events: none;
		}
		:global(#waifu.waifu-tool-visible #waifu-tool) {
			opacity: 1 !important;
			pointer-events: auto;
		}
	}

	:global(#waifu, #waifu-tool, #waifu-toggle) {
		z-index: 40 !important;
	}

	:global(#waifu) {
		left: auto !important;
		right: 1.5rem !important; /* 强制靠右对齐 */
	}

	/* 将 waifu-toggle 固定到右侧 */
	:global(#waifu-toggle) {
		left: auto !important;
		right: 0 !important;
		transform: rotateY(180deg);
		margin-right: -100px;
		transition: margin-right 1s;
	}

	/* 从右侧滑入/滑出的过渡效果 */
	:global(#waifu-toggle.waifu-toggle-active) {
		margin-right: -45px !important;
	}
	:global(#waifu-toggle:hover) {
		margin-right: -35px !important;
	}

	/* 移动端也保持右侧行为 */
	@media (max-width: 768px), (hover: none) {
		:global(#waifu-toggle.waifu-toggle-active) {
			margin-right: -30px !important;
			margin-left: 0 !important;
		}
	}
</style>
