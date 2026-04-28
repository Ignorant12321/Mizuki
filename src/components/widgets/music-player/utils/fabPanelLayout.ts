export interface FabPanelLayoutInput {
	buttonTop: number;
	gap: number;
	panelHeight: number;
	viewportHeight: number;
	topMargin: number;
	bottomMargin: number;
}

export interface FabPanelLayout {
	top: number;
	maxHeight: number;
}

export function calculateFabPanelLayout({
	buttonTop,
	gap,
	panelHeight,
	viewportHeight,
	topMargin,
	bottomMargin,
}: FabPanelLayoutInput): FabPanelLayout {
	const naturalTop = buttonTop - gap - panelHeight;
	const top = Math.max(topMargin, naturalTop);

	return {
		top,
		maxHeight: Math.max(0, viewportHeight - top - bottomMargin),
	};
}
