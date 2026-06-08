import { readFileSync } from "node:fs";

const displaySettingsCss = readFileSync(
	"src/styles/display-settings.css",
	"utf8",
);

const checks = [
	{
		name: "switch buttons reserve motion layers",
		pass:
			displaySettingsCss.includes("position: relative") &&
			displaySettingsCss.includes("overflow: hidden") &&
			displaySettingsCss.includes("will-change: transform"),
	},
	{
		name: "switch buttons have Firefly-like active scale feedback",
		pass:
			displaySettingsCss.includes(
				"#display-setting .mode-button:active",
			) &&
			displaySettingsCss.includes(
				"#display-setting .toggle-button:active",
			) &&
			displaySettingsCss.includes(
				"#display-setting .effect-row:active",
			) &&
			displaySettingsCss.includes("transform: scale(0.965)"),
	},
	{
		name: "switch buttons use a soft theme pulse on interaction",
		pass:
			displaySettingsCss.includes(
				"#display-setting .mode-button::before",
			) &&
			displaySettingsCss.includes(
				"#display-setting .toggle-button::before",
			) &&
			displaySettingsCss.includes(
				"#display-setting .effect-row::before",
			) &&
			displaySettingsCss.includes("radial-gradient") &&
			displaySettingsCss.includes("pointer-events: none"),
	},
	{
		name: "switch thumbs respond while pressing the row",
		pass:
			displaySettingsCss.includes(
				"#display-setting .effect-row:active .effect-thumb",
			) && displaySettingsCss.includes("scale(1.08)"),
	},
];

const failures = checks.filter((check) => !check.pass);

if (failures.length > 0) {
	console.error("Display settings button motion checks failed:");
	for (const failure of failures) {
		console.error(`- ${failure.name}`);
	}
	process.exit(1);
}

console.log("Display settings button motion checks passed.");
