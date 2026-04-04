// 导航页面处理脚本
// 此脚本作为全局脚本加载，不受 Swup 页面切换影响

(() => {
	if (typeof window.navigationPageState === "undefined") {
		window.navigationPageState = {
			initialized: false,
			initializedFor: null,
			eventListeners: [],
			mutationObserver: null,
			copySuccessText: "已复制",
		};
	}

	function initNavigationPage() {
		var searchInput = document.getElementById("navigation-search");
		var navigationGrid = document.getElementById("navigation-grid");
		var noResults = document.getElementById("no-results");

		if (!searchInput || !navigationGrid || !noResults) {
			return false;
		}

		var navigationCards = document.querySelectorAll(".navigation-card");
		var copyButtons = document.querySelectorAll(".copy-link-btn");

		if (
			window.navigationPageState.initialized &&
			window.navigationPageState.initializedFor === navigationGrid
		) {
			return true;
		}

		var copySuccessTextElement = document.getElementById("navigation-copy-success-text");
		if (copySuccessTextElement) {
			window.navigationPageState.copySuccessText = copySuccessTextElement.textContent;
		}

		if (window.navigationPageState.eventListeners.length > 0) {
			for (var i = 0; i < window.navigationPageState.eventListeners.length; i++) {
				var listener = window.navigationPageState.eventListeners[i];
				var element = listener[0];
				var type = listener[1];
				var handler = listener[2];
				if (element && element.removeEventListener) {
					element.removeEventListener(type, handler);
				}
			}
			window.navigationPageState.eventListeners = [];
		}

		var searchTerm = "";
		var searchRafId = 0;

		function filterNavigationItems() {
			var visibleCount = 0;
			for (var i = 0; i < navigationCards.length; i++) {
				var card = navigationCards[i];
				var title = (card.getAttribute("data-title") || "").toLowerCase();
				var desc = (card.getAttribute("data-desc") || "").toLowerCase();
				var matchesSearch =
					!searchTerm || title.indexOf(searchTerm) >= 0 || desc.indexOf(searchTerm) >= 0;
				var filteredByTag =
					card.classList.contains("filtered-out") ||
					card.classList.contains("is-filter-hiding");

				if (matchesSearch) {
					card.style.display = "";
				} else {
					card.style.display = "none";
				}

				if (matchesSearch && !filteredByTag) {
					visibleCount++;
				}
			}

			if (visibleCount === 0) {
				noResults.classList.add("is-visible");
				navigationGrid.classList.add("hidden");
			} else {
				noResults.classList.remove("is-visible");
				navigationGrid.classList.remove("hidden");
			}
		}

		var searchHandler = (e) => {
			searchTerm = e.target.value.toLowerCase();
			if (searchRafId) {
				cancelAnimationFrame(searchRafId);
			}
			searchRafId = requestAnimationFrame(() => {
				searchRafId = 0;
				filterNavigationItems();
			});
		};
		searchInput.addEventListener("input", searchHandler);
		window.navigationPageState.eventListeners.push([searchInput, "input", searchHandler]);

		var pageRoot = navigationGrid.closest(".card-base");
		var filterChangedHandler = (e) => {
			var sourceContainer = e && e.detail ? e.detail.container : null;
			if (!navigationGrid.isConnected) return;
			if (
				sourceContainer &&
				pageRoot &&
				!pageRoot.contains(sourceContainer)
			) {
				return;
			}
			filterNavigationItems();
		};
		document.addEventListener("filter-tabs:changed", filterChangedHandler);
		window.navigationPageState.eventListeners.push([
			document,
			"filter-tabs:changed",
			filterChangedHandler,
		]);

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
									window.navigationPageState.copySuccessText +
									"</span></div>";
								button.classList.add("text-green-500");
								setTimeout(() => {
									button.innerHTML = originalHTML;
									button.classList.remove("text-green-500");
								}, 2000);
							})
							.catch((err) => {
								console.error("[Navigation Global] Copy failed:", err);
							});
					}
				};
				button.addEventListener("click", clickHandler);
				window.navigationPageState.eventListeners.push([button, "click", clickHandler]);
			})(copyButtons[i]);
		}

		filterNavigationItems();
		window.navigationPageState.initialized = true;
		window.navigationPageState.initializedFor = navigationGrid;
		return true;
	}

	function tryInit(retries) {
		retries = retries || 0;
		if (initNavigationPage()) {
			return;
		}
		if (retries < 5) {
			setTimeout(() => {
				tryInit(retries + 1);
			}, 100);
		}
	}

	function setupMutationObserver() {
		if (window.navigationPageState.mutationObserver) {
			window.navigationPageState.mutationObserver.disconnect();
		}

		window.navigationPageState.mutationObserver = new MutationObserver((mutations) => {
			var shouldInit = false;
			for (var i = 0; i < mutations.length; i++) {
				var mutation = mutations[i];
				if (mutation.addedNodes && mutation.addedNodes.length > 0) {
					for (var j = 0; j < mutation.addedNodes.length; j++) {
						var node = mutation.addedNodes[j];
						if (node.nodeType === 1) {
							if (
								node.id === "navigation-grid" ||
								node.id === "navigation-search" ||
								(node.querySelector && node.querySelector("#navigation-grid"))
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
				setTimeout(() => {
					tryInit();
				}, 50);
			}
		});

		window.navigationPageState.mutationObserver.observe(document.body, {
			childList: true,
			subtree: true,
		});
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", () => {
			tryInit();
		});
	} else {
		tryInit();
	}

	setupMutationObserver();

	var events = ["swup:contentReplaced", "swup:pageView", "astro:page-load", "astro:after-swap"];
	for (var i = 0; i < events.length; i++) {
		((eventName) => {
			document.addEventListener(eventName, () => {
				setTimeout(() => {
					tryInit();
				}, 100);
			});
		})(events[i]);
	}
})();
