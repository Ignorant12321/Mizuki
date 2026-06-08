import { readFileSync } from "node:fs";

const navbar = readFileSync(
	"src/components/organisms/navigation/Navbar.astro",
	"utf8",
);
const dropdown = readFileSync(
	"src/components/organisms/navigation/DropdownMenu.astro",
	"utf8",
);
const bannerCss = readFileSync("src/styles/banner.css", "utf8");

const checks = [
	{
		name: "navbar links appear in the tablet breakpoint",
		pass: navbar.includes(
			'id="navbar-links-container" class="hidden md:flex',
		),
	},
	{
		name: "mobile menu button hides when tablet text navigation is available",
		pass: navbar.includes("md:!hidden") || navbar.includes("md:hidden!"),
	},
	{
		name: "dropdown labels and expand arrows appear at tablet size while main icons wait until desktop",
		pass:
			dropdown.includes("md:w-auto") &&
			dropdown.includes("hidden md:inline") &&
			dropdown.includes('class="text-[1.1rem] hidden lg:inline') &&
			dropdown.includes(
				"dropdown-arrow ml-1 flex-shrink-0 hidden md:inline",
			),
	},
	{
		name: "tablet layout preserves the left sidebar in non-grid mode",
		pass:
			bannerCss.includes(
				"@media (min-width: 768px) and (max-width: 1279px)",
			) &&
			bannerCss.includes('#main-grid:not([data-layout-mode="grid"])') &&
			bannerCss.includes(
				"grid-template-columns: var(--sidebar-column-width) 1fr !important",
			) &&
			bannerCss.includes("grid-column: 1 / 2 !important") &&
			bannerCss.includes("grid-column: 2 / 3 !important"),
	},
];

const failures = checks.filter((check) => !check.pass);

if (failures.length > 0) {
	console.error("Responsive navbar/layout checks failed:");
	for (const failure of failures) {
		console.error(`- ${failure.name}`);
	}
	process.exit(1);
}

console.log("Responsive navbar/layout checks passed.");
