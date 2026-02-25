<script>
	import { onDestroy, onMount } from "svelte";
	import { live2dConfig } from "@/config";

	// 全局状态引用
	let live2dInitialized = false;
	let waifuContainer;

	// 解决图片资源跨域问题 (非常重要，否则 Canvas 渲染会报错)
	function fixCrossOrigin() {
		if (typeof window !== "undefined") {
			const OriginalImage = window.Image;
			window.Image = function (...args) {
				const img = new OriginalImage(...args);
				img.crossOrigin = "anonymous";
				return img;
			};
		}
	}

	// 等待 DOM 和外部脚本加载完成后再初始化 Live2D
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
					console.log("Live2D initialized successfully (Svelte)");
				} else if (!waifuContainer) {
					console.warn("Live2D DOM elements not found, retrying...");
					setTimeout(initLive2d, 100);
				}
			} catch (e) {
				console.error("Live2D initialization error:", e);
			}
		} else {
			// 如果 initWidget 还未定义，稍后再试
			setTimeout(initLive2d, 100);
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
	});

	onDestroy(() => {
		// Svelte 组件销毁时不需要清理实例
		// 效仿原版 Pio：在 Astro 的 View Transitions 页面切换时保持看板娘状态存活
		console.log(
			"Live2D Svelte component destroyed (keeping instance alive)",
		);
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
			opacity: 1 !important;
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
