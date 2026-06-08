import { readFileSync } from "node:fs";

const navbar = readFileSync(
	"src/components/organisms/navigation/Navbar.astro",
	"utf8",
);
const musicPlayer = readFileSync(
	"src/components/widgets/music-player/MusicPlayer.svelte",
	"utf8",
);

const beforeOpenEvent = '"display-settings:before-open"';
const displaySettingsToggle = "panelManager.togglePanel('display-setting')";
const eventIndex = navbar.indexOf(beforeOpenEvent);
const toggleIndex = navbar.indexOf(displaySettingsToggle);

const checks = [
	{
		name: "display settings button announces before opening",
		pass: eventIndex !== -1,
	},
	{
		name: "display settings before-open event is dispatched before toggling panel",
		pass: eventIndex !== -1 && toggleIndex !== -1 && eventIndex < toggleIndex,
	},
	{
		name: "music player listens for display settings before-open event",
		pass:
			musicPlayer.includes(beforeOpenEvent) &&
			musicPlayer.includes("window.addEventListener") &&
			musicPlayer.includes("window.removeEventListener"),
	},
	{
		name: "display settings before-open event collapses music panel",
		pass:
			musicPlayer.includes(beforeOpenEvent) &&
			musicPlayer.includes("musicPlayerStore.setExpanded(false)"),
	},
];

const failures = checks.filter((check) => !check.pass);

if (failures.length > 0) {
	console.error("Display settings music panel coordination checks failed:");
	for (const failure of failures) {
		console.error(`- ${failure.name}`);
	}
	process.exit(1);
}

console.log("Display settings music panel coordination checks passed.");
