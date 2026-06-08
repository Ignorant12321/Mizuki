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
		name: "reset buttons stay mounted and are hidden without layout shift",
		pass:
			!displaySettings.includes("class:is-disabled") &&
			!displaySettings.includes("{#if hueNeedsReset}") &&
			!displaySettings.includes("{#if wallpaperModeNeedsReset}") &&
			!displaySettings.includes(
				"{#if wallpaperTransparencyNeedsReset}",
			) &&
			!displaySettings.includes("{#if effectsSettingsNeedReset}") &&
			!displaySettings.includes("{#if layoutSettingsNeedReset}") &&
			displaySettings.includes("class:is-hidden={!hueNeedsReset}") &&
			displaySettings.includes(
				"class:is-hidden={!wallpaperModeNeedsReset}",
			) &&
			displaySettings.includes(
				"class:is-hidden={!wallpaperTransparencyNeedsReset}",
			) &&
			displaySettings.includes(
				"class:is-hidden={!effectsSettingsNeedReset}",
			) &&
			displaySettings.includes(
				"class:is-hidden={!layoutSettingsNeedReset}",
			),
	},
	{
		name: "reset buttons live in the title row next to section titles",
		pass:
			displaySettings.includes('class="section-title-row"') &&
			displaySettings.includes(
				'class="section-title">{i18n(I18nKey.themeColor)}</div>',
			) &&
			displaySettings.includes("on:click|stopPropagation={resetHue}") &&
			displaySettings.indexOf('class="section-title-row"') <
				displaySettings.indexOf("on:click|stopPropagation={resetHue}"),
	},
	{
		name: "reset buttons do not bubble clicks to panel outside handler",
		pass:
			displaySettings.includes("on:click|stopPropagation={resetHue}") &&
			displaySettings.includes(
				"on:click|stopPropagation={resetWallpaperMode}",
			) &&
			displaySettings.includes(
				"on:click|stopPropagation={resetWallpaperTransparency}",
			) &&
			displaySettings.includes(
				"on:click|stopPropagation={resetEffectsSettings}",
			) &&
			displaySettings.includes(
				"on:click|stopPropagation={resetLayoutSettings}",
			),
	},
	{
		name: "title row styling supports inline reset buttons",
		pass:
			displaySettingsCss.includes(
				"#display-setting .section-title-row",
			) &&
			displaySettingsCss.includes("display: inline-flex") &&
			displaySettingsCss.includes("align-items: center") &&
			displaySettingsCss.includes(
				"#display-setting .section-reset-btn.is-hidden",
			) &&
			displaySettingsCss.includes("opacity: 0") &&
			displaySettingsCss.includes("pointer-events: none"),
	},
];

const failures = checks.filter((check) => !check.pass);

if (failures.length > 0) {
	console.error("Display settings reset layout checks failed:");
	for (const failure of failures) {
		console.error(`- ${failure.name}`);
	}
	process.exit(1);
}

console.log("Display settings reset layout checks passed.");
