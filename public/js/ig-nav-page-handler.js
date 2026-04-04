// 个人导航页面处理脚本
// 此脚本作为全局脚本加载，不受 Swup 页面切换影响

(() => {
	if (typeof window.igNavPageState === "undefined") {
		window.igNavPageState = {
			eventListeners: [],
			mutationObserver: null,
			copySuccessText: "已复制",
		};
	}

	function initIgNavPage() {
		var searchInput = document.getElementById("ig-nav-search");
		var igNavGrid = document.getElementById("ig-nav-grid");
		var noResults = document.getElementById("no-results");

		if (!searchInput || !igNavGrid || !noResults) {
			return false;
		}

		var tagFilters = document.querySelectorAll(".filter-tabs-item");
		var igNavCards = document.querySelectorAll(".ignav-card");
		var copyButtons = document.querySelectorAll(".copy-link-btn");

		var copySuccessTextElement = document.getElementById("ig-nav-copy-success-text");
		if (copySuccessTextElement) {
			window.igNavPageState.copySuccessText = copySuccessTextElement.textContent;
		}

		if (window.igNavPageState.eventListeners.length > 0) {
			for (var i = 0; i < window.igNavPageState.eventListeners.length; i++) {
				var listener = window.igNavPageState.eventListeners[i];
				var element = listener[0];
				var type = listener[1];
				var handler = listener[2];
				if (element && element.removeEventListener) {
					element.removeEventListener(type, handler);
				}
			}
			window.igNavPageState.eventListeners = [];
		}

		var searchTerm = "";

		function filterIgNavs() {
			var visibleCount = 0;
			for (var i = 0; i < igNavCards.length; i++) {
				var card = igNavCards[i];
				var title = (card.getAttribute("data-title") || "").toLowerCase();
				var desc = (card.getAttribute("data-desc") || "").toLowerCase();
				var matchesSearch =
					!searchTerm || title.indexOf(searchTerm) >= 0 || desc.indexOf(searchTerm) >= 0;
				var filteredByTag = card.classList.contains("filtered-out");

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
				noResults.classList.remove("hidden");
				igNavGrid.classList.add("hidden");
			} else {
				noResults.classList.add("hidden");
				igNavGrid.classList.remove("hidden");
			}
		}

		var searchHandler = (e) => {
			searchTerm = e.target.value.toLowerCase();
			filterIgNavs();
		};
		searchInput.addEventListener("input", searchHandler);
		window.igNavPageState.eventListeners.push([searchInput, "input", searchHandler]);

		for (var i = 0; i < tagFilters.length; i++) {
			((button) => {
				var clickHandler = () => {
					setTimeout(() => {
						filterIgNavs();
					}, 0);
				};
				button.addEventListener("click", clickHandler);
				window.igNavPageState.eventListeners.push([button, "click", clickHandler]);
			})(tagFilters[i]);
		}

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
									window.igNavPageState.copySuccessText +
									"</span></div>";
								button.classList.add("text-green-500");
								setTimeout(() => {
									button.innerHTML = originalHTML;
									button.classList.remove("text-green-500");
								}, 2000);
							})
							.catch((err) => {
								console.error("[IgNav Global] Copy failed:", err);
							});
					}
				};
				button.addEventListener("click", clickHandler);
				window.igNavPageState.eventListeners.push([button, "click", clickHandler]);
			})(copyButtons[i]);
		}

		filterIgNavs();
		return true;
	}

	function tryInit(retries) {
		retries = retries || 0;
		if (initIgNavPage()) {
			return;
		}
		if (retries < 5) {
			setTimeout(() => {
				tryInit(retries + 1);
			}, 100);
		}
	}

	function setupMutationObserver() {
		if (window.igNavPageState.mutationObserver) {
			window.igNavPageState.mutationObserver.disconnect();
		}

		window.igNavPageState.mutationObserver = new MutationObserver((mutations) => {
			var shouldInit = false;
			for (var i = 0; i < mutations.length; i++) {
				var mutation = mutations[i];
				if (mutation.addedNodes && mutation.addedNodes.length > 0) {
					for (var j = 0; j < mutation.addedNodes.length; j++) {
						var node = mutation.addedNodes[j];
						if (node.nodeType === 1) {
							if (
								node.id === "ig-nav-grid" ||
								node.id === "ig-nav-search" ||
								(node.querySelector && node.querySelector("#ig-nav-grid"))
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

		window.igNavPageState.mutationObserver.observe(document.body, {
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
