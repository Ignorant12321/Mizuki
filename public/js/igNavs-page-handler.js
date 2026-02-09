// 友情链接页面处理脚本
// 此脚本作为全局脚本加载，不受 Swup 页面切换影响

(() => {
	console.log("[IgNavs Global] Script loaded");

	// 使用全局变量存储状态
	if (typeof window.igNavsPageState === "undefined") {
		window.igNavsPageState = {
			initialized: false,
			eventListeners: [],
			mutationObserver: null,
			copySuccessText: "已复制", // 默认值，会被页面覆盖
		};
	}

	// 初始化函数
	function initIgNavsPage() {
		console.log("[IgNavs Global] initIgNavsPage called");

		var searchInput = document.getElementById("igNav-search");
		var igNavsGrid = document.getElementById("igNavs-grid");
		var noResults = document.getElementById("no-results");

		// 如果关键元素不存在，直接返回
		if (!searchInput || !igNavsGrid || !noResults) {
			return false;
		}

		var tagFilters = document.querySelectorAll(".filter-tag");
		var igNavCards = document.querySelectorAll(".igNav-card");
		var copyButtons = document.querySelectorAll(".copy-link-btn");

		console.log("[IgNavs Global] Found elements:", {
			cards: igNavCards.length,
			filters: tagFilters.length,
			copyButtons: copyButtons.length,
		});

		// 从页面获取复制成功文本
		var copySuccessTextElement = document.getElementById(
			"igNavs-copy-success-text",
		);
		if (copySuccessTextElement) {
			window.igNavsPageState.copySuccessText =
				copySuccessTextElement.textContent;
		}

		// 清理旧的事件监听器
		if (window.igNavsPageState.eventListeners.length > 0) {
			console.log(
				"[IgNavs Global] Cleaning",
				window.igNavsPageState.eventListeners.length,
				"old listeners",
			);
			for (
				var i = 0;
				i < window.igNavsPageState.eventListeners.length;
				i++
			) {
				var listener = window.igNavsPageState.eventListeners[i];
				var element = listener[0];
				var type = listener[1];
				var handler = listener[2];
				if (element && element.removeEventListener) {
					element.removeEventListener(type, handler);
				}
			}
			window.igNavsPageState.eventListeners = [];
		}

		var currentTag = "all";
		var searchTerm = "";

		// 过滤函数
		function filterIgNavs() {
			var visibleCount = 0;
			for (var i = 0; i < igNavCards.length; i++) {
				var card = igNavCards[i];
				var title = (
					card.getAttribute("data-title") || ""
				).toLowerCase();
				var desc = (card.getAttribute("data-desc") || "").toLowerCase();
				var tags = card.getAttribute("data-tags") || "";

				var matchesSearch =
					!searchTerm ||
					title.indexOf(searchTerm) >= 0 ||
					desc.indexOf(searchTerm) >= 0;
				var matchesTag =
					currentTag === "all" ||
					tags.split(",").indexOf(currentTag) >= 0;

				if (matchesSearch && matchesTag) {
					card.style.display = "";
					visibleCount++;
				} else {
					card.style.display = "none";
				}
			}

			if (visibleCount === 0) {
				noResults.classList.remove("hidden");
				igNavsGrid.classList.add("hidden");
			} else {
				noResults.classList.add("hidden");
				igNavsGrid.classList.remove("hidden");
			}
		}

		// 搜索功能
		var searchHandler = (e) => {
			searchTerm = e.target.value.toLowerCase();
			filterIgNavs();
		};
		searchInput.addEventListener("input", searchHandler);
		window.igNavsPageState.eventListeners.push([
			searchInput,
			"input",
			searchHandler,
		]);

		// 标签筛选
		for (var i = 0; i < tagFilters.length; i++) {
			((button) => {
				var clickHandler = () => {
					// 更新选中状态
					for (var j = 0; j < tagFilters.length; j++) {
						var btn = tagFilters[j];
						btn.classList.remove("active");
					}
					button.classList.add("active");

					currentTag = button.getAttribute("data-tag") || "all";
					filterIgNavs();
				};
				button.addEventListener("click", clickHandler);
				window.igNavsPageState.eventListeners.push([
					button,
					"click",
					clickHandler,
				]);
			})(tagFilters[i]);
		}

		// 复制链接功能
		for (var i = 0; i < copyButtons.length; i++) {
			((button) => {
				var clickHandler = () => {
					var url = button.getAttribute("data-url");
					if (!url) return;

					if (navigator.clipboard && navigator.clipboard.writeText) {
						navigator.clipboard
							.writeText(url)
							.then(() => {
								var originalHTML = button.innerHTML;
								button.innerHTML =
									'<div class="flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span class="text-xs">' +
									window.igNavsPageState.copySuccessText +
									"</span></div>";
								button.classList.add("text-green-500");
								setTimeout(() => {
									button.innerHTML = originalHTML;
									button.classList.remove("text-green-500");
								}, 2000);
							})
							.catch((err) => {
								console.error(
									"[IgNavs Global] Copy failed:",
									err,
								);
							});
					}
				};
				button.addEventListener("click", clickHandler);
				window.igNavsPageState.eventListeners.push([
					button,
					"click",
					clickHandler,
				]);
			})(copyButtons[i]);
		}

		window.igNavsPageState.initialized = true;
		console.log(
			"[IgNavs Global] ✅ Initialization complete with",
			window.igNavsPageState.eventListeners.length,
			"listeners",
		);
		return true;
	}

	// 带重试的初始化
	function tryInit(retries) {
		retries = retries || 0;
		if (initIgNavsPage()) {
			console.log("[IgNavs Global] Init succeeded");
			return;
		}
		if (retries < 5) {
			setTimeout(() => {
				tryInit(retries + 1);
			}, 100);
		}
	}

	// MutationObserver 监听 DOM 变化
	function setupMutationObserver() {
		if (window.igNavsPageState.mutationObserver) {
			window.igNavsPageState.mutationObserver.disconnect();
		}

		window.igNavsPageState.mutationObserver = new MutationObserver(
			(mutations) => {
				var shouldInit = false;
				for (var i = 0; i < mutations.length; i++) {
					var mutation = mutations[i];
					if (mutation.addedNodes && mutation.addedNodes.length > 0) {
						for (var j = 0; j < mutation.addedNodes.length; j++) {
							var node = mutation.addedNodes[j];
							if (node.nodeType === 1) {
								if (
									node.id === "igNavs-grid" ||
									node.id === "igNavs-search" ||
									(node.querySelector &&
										node.querySelector("#igNavs-grid"))
								) {
									shouldInit = true;
									break;
								}
							}
						}
					}
					if (shouldInit) break;
				}

				if (shouldInit) {
					console.log("[IgNavs Global] DOM mutation detected");
					window.igNavsPageState.initialized = false;
					setTimeout(() => {
						tryInit();
					}, 50);
				}
			},
		);

		window.igNavsPageState.mutationObserver.observe(document.body, {
			childList: true,
			subtree: true,
		});
	}

	// 页面加载时初始化
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", () => {
			console.log("[IgNavs Global] DOMContentLoaded");
			tryInit();
		});
	} else {
		tryInit();
	}

	// 启动 MutationObserver
	setupMutationObserver();

	// 监听所有可能的页面切换事件
	var events = [
		"swup:contentReplaced",
		"swup:pageView",
		"astro:page-load",
		"astro:after-swap",
	];

	for (var i = 0; i < events.length; i++) {
		((eventName) => {
			document.addEventListener(eventName, () => {
				console.log("[IgNavs Global] Event:", eventName);
				window.igNavsPageState.initialized = false;
				setTimeout(() => {
					tryInit();
				}, 100);
			});
		})(events[i]);
	}

	console.log("[IgNavs Global] All listeners registered");
})();
