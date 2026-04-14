// Projects page filter handler
// Supports combined filtering by tabs (category) and search text

(() => {
	if (typeof window.projectsPageState === "undefined") {
		window.projectsPageState = {
			initialized: false,
			initializedFor: null,
			eventListeners: [],
			mutationObserver: null,
		};
	}

	function initProjectsPage() {
		var searchInput = document.getElementById("project-search");
		var projectsGrid = document.getElementById("projects-grid");
		var noResults = document.getElementById("no-results");

		if (!searchInput || !projectsGrid || !noResults) {
			return false;
		}

		var projectCards = projectsGrid.querySelectorAll(".project-card");

		if (
			window.projectsPageState.initialized &&
			window.projectsPageState.initializedFor === projectsGrid
		) {
			return true;
		}

		if (window.projectsPageState.eventListeners.length > 0) {
			for (var i = 0; i < window.projectsPageState.eventListeners.length; i++) {
				var listener = window.projectsPageState.eventListeners[i];
				var element = listener[0];
				var type = listener[1];
				var handler = listener[2];
				if (element && element.removeEventListener) {
					element.removeEventListener(type, handler);
				}
			}
			window.projectsPageState.eventListeners = [];
		}

		var searchTerm = ((searchInput.value || "") + "").trim().toLowerCase();
		var searchRafId = 0;

		function filterProjects() {
			var visibleCount = 0;

			for (var i = 0; i < projectCards.length; i++) {
				var card = projectCards[i];
				var searchText = (card.getAttribute("data-search-text") || "").toLowerCase();
				var matchesSearch = !searchTerm || searchText.indexOf(searchTerm) !== -1;
				var filteredByCategory =
					card.classList.contains("filtered-out") ||
					card.classList.contains("is-filter-hiding");

				card.classList.toggle("search-hidden", !matchesSearch);

				if (matchesSearch && !filteredByCategory) {
					visibleCount++;
				}
			}

			if (visibleCount === 0) {
				noResults.classList.add("is-visible");
				projectsGrid.classList.add("hidden");
			} else {
				noResults.classList.remove("is-visible");
				projectsGrid.classList.remove("hidden");
			}
		}

		var searchHandler = (e) => {
			searchTerm = (e.target.value || "").trim().toLowerCase();
			if (searchRafId) {
				cancelAnimationFrame(searchRafId);
			}
			searchRafId = requestAnimationFrame(() => {
				searchRafId = 0;
				filterProjects();
			});
		};
		searchInput.addEventListener("input", searchHandler);
		window.projectsPageState.eventListeners.push([searchInput, "input", searchHandler]);

		var pageRoot = projectsGrid.closest(".card-base");
		var filterChangedHandler = (e) => {
			var sourceContainer = e && e.detail ? e.detail.container : null;
			if (!projectsGrid.isConnected) return;
			if (
				sourceContainer &&
				pageRoot &&
				!pageRoot.contains(sourceContainer)
			) {
				return;
			}
			filterProjects();
		};
		document.addEventListener("filter-tabs:changed", filterChangedHandler);
		window.projectsPageState.eventListeners.push([
			document,
			"filter-tabs:changed",
			filterChangedHandler,
		]);

		filterProjects();
		window.projectsPageState.initialized = true;
		window.projectsPageState.initializedFor = projectsGrid;
		return true;
	}

	function tryInit(retries) {
		retries = retries || 0;
		if (initProjectsPage()) {
			return;
		}
		if (retries < 5) {
			setTimeout(() => {
				tryInit(retries + 1);
			}, 100);
		}
	}

	function setupMutationObserver() {
		if (window.projectsPageState.mutationObserver) {
			window.projectsPageState.mutationObserver.disconnect();
		}

		window.projectsPageState.mutationObserver = new MutationObserver((mutations) => {
			var shouldInit = false;
			for (var i = 0; i < mutations.length; i++) {
				var mutation = mutations[i];
				if (mutation.addedNodes && mutation.addedNodes.length > 0) {
					for (var j = 0; j < mutation.addedNodes.length; j++) {
						var node = mutation.addedNodes[j];
						if (node.nodeType === 1) {
							if (
								node.id === "projects-grid" ||
								node.id === "project-search" ||
								(node.querySelector && node.querySelector("#projects-grid"))
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

		window.projectsPageState.mutationObserver.observe(document.body, {
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
