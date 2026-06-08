import { readFileSync } from "node:fs";

const displaySettings = readFileSync(
	"src/components/features/settings/DisplaySettings.svelte",
	"utf8",
);
const displaySettingsCss = readFileSync(
	"src/styles/display-settings.css",
	"utf8",
);

const checks = [
	{
		name: "panel header chrome is hidden",
		pass:
			!displaySettings.includes('class="panel-header"') &&
			!displaySettings.includes("I18nKey.displaySettings") &&
			!displaySettings.includes("material-symbols:palette-outline") &&
			!displaySettings.includes("material-symbols:close-rounded") &&
			!displaySettings.includes('class="panel-close-btn"'),
	},
	{
		name: "panel scroll gutter is compact like Firefly",
		pass:
			displaySettingsCss.includes("--panel-scroll-safe-right: 0.55rem") &&
			displaySettingsCss.includes(
				"padding: 0.85rem 0.55rem 0.9rem 0.85rem",
			) &&
			displaySettingsCss.includes("scrollbar-gutter: stable") &&
			!displaySettingsCss.includes("scrollbar-gutter: stable both-edges"),
	},
	{
		name: "panel scrollbar is pale gray and theme-tinted when active",
		pass:
			displaySettingsCss.includes("--panel-scrollbar-thumb") &&
			displaySettingsCss.includes("--panel-scrollbar-thumb-active") &&
			displaySettingsCss.includes(
				"#display-setting .panel-scroll::-webkit-scrollbar-thumb:active",
			) &&
			displaySettingsCss.includes(
				"background: var(--panel-scrollbar-thumb-active)",
			),
	},
];

const failures = checks.filter((check) => !check.pass);

if (failures.length > 0) {
	console.error("Display settings panel chrome checks failed:");
	for (const failure of failures) {
		console.error(`- ${failure.name}`);
	}
	process.exit(1);
}

console.log("Display settings panel chrome checks passed.");
