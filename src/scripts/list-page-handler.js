// Shared list page handler for searchable/filterable card grids.
(() => {
	if (typeof window.initListPageHandler === "function") {
		return;
	}

	window.initListPageHandler = function initListPageHandler(config) {
		var pageName = config.pageName || "List";
		var stateKey = config.stateKey;
		var searchInputId = config.searchInputId;
		var gridId = config.gridId;
		var cardSelector = config.cardSelector;
		var copySuccessTextId = config.copySuccessTextId;
		var mutationWatchIds = config.mutationWatchIds || [];
		// Fallback text only used when template does not provide copySuccessTextId.
		var defaultCopySuccessText = config.defaultCopySuccessText || "Copied";

		if (!stateKey || !searchInputId || !gridId || !cardSelector) {
			console.error("[" + pageName + " Global] Missing required config");
			return;
		}

		if (typeof window[stateKey] === "undefined") {
			window[stateKey] = {
				initialized: false,
				eventListeners: [],
				lifecycleListeners: [],
				mutationObserver: null,
				copySuccessText: defaultCopySuccessText,
				reinitTimer: null,
			};
		}

		var state = window[stateKey];
		console.log("[" + pageName + " Global] Script loaded");

		function cleanupEventListeners() {
			if (state.eventListeners.length === 0) {
				return;
			}
			console.log(
				"[" + pageName + " Global] Cleaning",
				state.eventListeners.length,
				"old listeners",
			);
			for (var i = 0; i < state.eventListeners.length; i++) {
				var listener = state.eventListeners[i];
				var element = listener[0];
				var type = listener[1];
				var handler = listener[2];
				if (element && element.removeEventListener) {
					element.removeEventListener(type, handler);
				}
			}
			state.eventListeners = [];
		}

		function cleanupLifecycleListeners() {
			if (!state.lifecycleListeners || state.lifecycleListeners.length === 0) {
				return;
			}
			for (var i = 0; i < state.lifecycleListeners.length; i++) {
				var listener = state.lifecycleListeners[i];
				var target = listener[0];
				var type = listener[1];
				var handler = listener[2];
				if (target && target.removeEventListener) {
					target.removeEventListener(type, handler);
				}
			}
			state.lifecycleListeners = [];
		}

		function scheduleInit(delay) {
			if (state.reinitTimer) {
				clearTimeout(state.reinitTimer);
			}
			state.reinitTimer = setTimeout(() => {
				state.reinitTimer = null;
				tryInit();
			}, delay);
		}

		function initPage() {
			console.log("[" + pageName + " Global] initPage called");

			var searchInput = document.getElementById(searchInputId);
			var grid = document.getElementById(gridId);
			var noResults = document.getElementById("no-results");

			if (!searchInput || !grid || !noResults) {
				return false;
			}

			var tagFilters = document.querySelectorAll(".filter-tag");
			var cards = document.querySelectorAll(cardSelector);
			var copyButtons = document.querySelectorAll(".copy-link-btn");

			console.log("[" + pageName + " Global] Found elements:", {
				cards: cards.length,
				filters: tagFilters.length,
				copyButtons: copyButtons.length,
			});

			if (copySuccessTextId) {
				var copySuccessTextElement =
					document.getElementById(copySuccessTextId);
				if (copySuccessTextElement) {
					state.copySuccessText = copySuccessTextElement.textContent;
				}
			}

			cleanupEventListeners();

			var currentTag = "all";
			var searchTerm = "";

			function filterCards() {
				var visibleCount = 0;
				for (var i = 0; i < cards.length; i++) {
					var card = cards[i];
					var title = (card.getAttribute("data-title") || "").toLowerCase();
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
					grid.classList.add("hidden");
				} else {
					noResults.classList.add("hidden");
					grid.classList.remove("hidden");
				}
			}

			var searchHandler = (e) => {
				searchTerm = e.target.value.toLowerCase();
				filterCards();
			};
			searchInput.addEventListener("input", searchHandler);
			state.eventListeners.push([searchInput, "input", searchHandler]);

			for (var i = 0; i < tagFilters.length; i++) {
				((button) => {
					var clickHandler = () => {
						for (var j = 0; j < tagFilters.length; j++) {
							tagFilters[j].classList.remove("active");
						}
						button.classList.add("active");
						currentTag = button.getAttribute("data-tag") || "all";
						filterCards();
					};
					button.addEventListener("click", clickHandler);
					state.eventListeners.push([button, "click", clickHandler]);
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
										state.copySuccessText +
										"</span></div>";
									button.classList.add("text-green-500");
									setTimeout(() => {
										button.innerHTML = originalHTML;
										button.classList.remove("text-green-500");
									}, 2000);
								})
								.catch((err) => {
									console.error(
										"[" + pageName + " Global] Copy failed:",
										err,
									);
								});
						}
					};
					button.addEventListener("click", clickHandler);
					state.eventListeners.push([button, "click", clickHandler]);
				})(copyButtons[i]);
			}

			state.initialized = true;
			console.log(
				"[" + pageName + " Global] Initialization complete with",
				state.eventListeners.length,
				"listeners",
			);
			return true;
		}

		function tryInit(retries) {
			retries = retries || 0;
			if (initPage()) {
				console.log("[" + pageName + " Global] Init succeeded");
				return;
			}
			if (retries < 5) {
				setTimeout(() => {
					tryInit(retries + 1);
				}, 100);
			}
		}

		function setupMutationObserver() {
			if (state.mutationObserver) {
				state.mutationObserver.disconnect();
			}

			state.mutationObserver = new MutationObserver((mutations) => {
				var shouldInit = false;
				for (var i = 0; i < mutations.length; i++) {
					var mutation = mutations[i];
					if (mutation.addedNodes && mutation.addedNodes.length > 0) {
						for (var j = 0; j < mutation.addedNodes.length; j++) {
							var node = mutation.addedNodes[j];
							if (node.nodeType !== 1) {
								continue;
							}
							if (node.id === gridId || mutationWatchIds.indexOf(node.id) >= 0) {
								shouldInit = true;
								break;
							}
							if (
								node.querySelector &&
								(node.querySelector("#" + gridId) ||
									mutationWatchIds.some((id) => node.querySelector("#" + id)))
							) {
								shouldInit = true;
								break;
							}
						}
					}
					if (shouldInit) break;
				}

				if (shouldInit) {
					console.log("[" + pageName + " Global] DOM mutation detected");
					state.initialized = false;
					scheduleInit(50);
				}
			});

			state.mutationObserver.observe(document.body, {
				childList: true,
				subtree: true,
			});
		}

		cleanupLifecycleListeners();

		if (document.readyState === "loading") {
			var domReadyHandler = () => {
				console.log("[" + pageName + " Global] DOMContentLoaded");
				tryInit();
			};
			document.addEventListener("DOMContentLoaded", domReadyHandler, {
				once: true,
			});
			state.lifecycleListeners.push([
				document,
				"DOMContentLoaded",
				domReadyHandler,
			]);
		} else {
			tryInit();
		}

		setupMutationObserver();

		var events = [
			"swup:contentReplaced",
			"swup:pageView",
			"astro:page-load",
			"astro:after-swap",
		];

		for (var i = 0; i < events.length; i++) {
			((eventName) => {
				var eventHandler = () => {
					console.log("[" + pageName + " Global] Event:", eventName);
					state.initialized = false;
					scheduleInit(100);
				};
				document.addEventListener(eventName, eventHandler);
				state.lifecycleListeners.push([document, eventName, eventHandler]);
			})(events[i]);
		}

		console.log("[" + pageName + " Global] All listeners registered");
	};
})();
