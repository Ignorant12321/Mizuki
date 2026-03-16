import "./list-page-handler.js";

(() => {
	if (typeof window.initListPageHandler !== "function") {
		console.error("[Friends Global] initListPageHandler is not available");
		return;
	}

	window.initListPageHandler({
		pageName: "Friends",
		stateKey: "friendsPageState",
		searchInputId: "friend-search",
		gridId: "friends-grid",
		cardSelector: ".friend-card",
		copySuccessTextId: "friends-copy-success-text",
		mutationWatchIds: ["friend-search"],
		defaultCopySuccessText: "已复制",
	});
})();
