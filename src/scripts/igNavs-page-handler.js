import "./list-page-handler.js";

(() => {
	if (typeof window.initListPageHandler !== "function") {
		console.error("[IgNavs Global] initListPageHandler is not available");
		return;
	}

	window.initListPageHandler({
		pageName: "IgNavs",
		stateKey: "igNavsPageState",
		searchInputId: "igNav-search",
		gridId: "igNavs-grid",
		cardSelector: ".igNav-card",
		copySuccessTextId: "igNavs-copy-success-text",
		mutationWatchIds: ["igNav-search"],
	});
})();
