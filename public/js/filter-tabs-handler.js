// Shared filter handler for FilterTabs atom component
// Works with Swup page transitions
// FilterTabs renders data-filter-attr and data-filter-value on each button
// Cards/entries should have a matching data attribute (e.g. data-category, data-type)

(function () {
	function clearHideTimer(item) {
		if (item.__filterHideTimer) {
			clearTimeout(item.__filterHideTimer);
			item.__filterHideTimer = null;
		}
	}

	function applyFilterState(item, shouldShow) {
		var animate = item.dataset.filterAnimate === "fade";

		if (shouldShow) {
			clearHideTimer(item);
			item.classList.remove("filtered-out", "is-filter-hiding");

			if (animate) {
				item.classList.add("is-filter-showing");
				requestAnimationFrame(function () {
					requestAnimationFrame(function () {
						item.classList.remove("is-filter-showing");
					});
				});
			}
			return;
		}

		if (!animate) {
			item.classList.add("filtered-out");
			return;
		}

		clearHideTimer(item);
		if (item.classList.contains("filtered-out")) {
			return;
		}

		item.classList.add("is-filter-hiding");
		item.__filterHideTimer = setTimeout(function () {
			item.classList.add("filtered-out");
			item.classList.remove("is-filter-hiding");
			item.__filterHideTimer = null;
		}, 180);
	}

	function initFilterTabs() {
		var containers = document.querySelectorAll(".filter-tabs");

		containers.forEach(function (container) {
			if (container.dataset.initialized) return;
			container.dataset.initialized = "true";

			var tabs = container.querySelectorAll(".filter-tabs-item");
			var filterAttr = tabs[0] ? tabs[0].dataset.filterAttr : null;
			if (!filterAttr) return;
			var noResultsSelector = container.dataset.filterEmpty || "#no-results";

			var dataSelector = "[data-" + filterAttr + "]";
			var parent = container.closest(".card-base") || document;
			var items = parent.querySelectorAll(dataSelector);
			var noResults = null;
			if (noResultsSelector !== "none") {
				try {
					noResults = parent.querySelector(noResultsSelector);
				} catch (_error) {
					noResults = parent.querySelector("#no-results");
				}
			}

			if (items.length === 0) return;

			tabs.forEach(function (tab) {
				tab.addEventListener("click", function () {
					tabs.forEach(function (t) {
						t.classList.remove("active");
					});
					tab.classList.add("active");

					var activeValue = tab.dataset.filterValue || "all";
					var visibleCount = 0;

					items.forEach(function (item) {
						var itemValue = item.dataset[filterAttr];
						var match =
							activeValue === "all" || (itemValue && itemValue.split(",").indexOf(activeValue) !== -1);

						applyFilterState(item, match);
						if (match) {
							visibleCount++;
						}
					});

					if (noResults) {
						noResults.classList.toggle("hidden", visibleCount > 0);
					}

					document.dispatchEvent(
						new CustomEvent("filter-tabs:changed", {
							detail: {
								container: container,
								filterAttr: filterAttr,
								activeValue: activeValue,
								visibleCount: visibleCount,
							},
						}),
					);
				});
			});
		});
	}

	function onInit() {
		if (document.querySelector(".filter-tabs")) {
			initFilterTabs();
		}
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", onInit);
	} else {
		onInit();
	}

	document.addEventListener("astro:page-load", onInit);
})();
