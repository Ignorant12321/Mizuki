// Project data configuration file
// Used to manage data for the project display page

export interface Project {
	id: string;
	title: string;
	description: string;
	image: string;
	category: "web" | "mobile" | "desktop" | "other";
	techStack: string[];
	status: "completed" | "in-progress" | "planned";
	liveDemo?: string;
	sourceCode?: string;
	visitUrl?: string;
	startDate: string;
	endDate?: string;
	featured?: boolean;
	tags?: string[];
	showImage?: boolean;
}

export const projectsData: Project[] = [
	{
		id: "mizuki",
		title: "Mizuki",
		description:
			"基于LyraVoid/Mizuki魔改的个人博客，没错，就是你现在看到的这个博客！",
		image: "/assets/projects/Mizuki.webp",
		category: "web",
		techStack: ["Astro", "TypeScript", "Tailwind CSS", "Svelte"],
		status: "in-progress",
		sourceCode: "https://github.com/Ignorant12321/Mizuki",
		visitUrl: "https://blog-ignorant.pages.dev/",
		startDate: "2026-01-01",
		endDate: "2026-06-01",
		featured: true,
		tags: ["Blog"],
	},
	{
		id: "snippets-collection-pic",
		title: "随机图展示",
		description: "一个随机图展示页面，展示了各种随机图片。",
		image: "/assets/projects/snippets-collection-pic.webp",
		category: "web",
		techStack: ["JavaScript", "HTML", "CSS"],
		status: "completed",
		sourceCode: "https://github.com/Ignorant12321/snippets-collection",
		visitUrl: "https://pic.ssr.ddns-ip.net/",
		startDate: "2026-04-06",
		endDate: "2026-04-28",
		featured: true,
		tags: ["Snippets"],
	},
	{
		id: "snippets-collection-rss",
		title: "RSS 订阅",
		description:
			"一个 RSS 订阅页面，展示了各种 RSS 源的内容，提供了一个便捷的信息获取方式。",
		image: "/assets/projects/snippets-collection-rss.webp",
		category: "web",
		techStack: ["JavaScript", "HTML", "CSS"],
		status: "completed",
		sourceCode: "https://github.com/Ignorant12321/snippets-collection",
		visitUrl: "https://rss.ssr.ddns-ip.net/rss",
		startDate: "2026-04-06",
		endDate: "2026-04-28",
		featured: true,
		tags: ["Snippets"],
	},
	{
		id: "snippets-collection-github",
		title: "Github加速",
		description:
			"一个 Github 加速页面，提供了一个快速访问 Github 的方式，解决了访问 Github 慢的问题。",
		image: "/assets/projects/snippets-collection-github.webp",
		category: "web",
		techStack: ["JavaScript", "HTML", "CSS"],
		status: "completed",
		sourceCode: "https://github.com/Ignorant12321/snippets-collection",
		visitUrl: "https://home-gh.ssr.ddns-ip.net/",
		startDate: "2026-04-06",
		endDate: "2026-04-28",
		featured: true,
		tags: ["Snippets"],
	},
	{
		id: "pixel-bullet-hell",
		title: "PIXEL BULLET HELL",
		description:
			"A space defense pixel-art bullet-hell game built with JavaScript and HTML5 Canvas.",
		image: "/assets/projects/pixel-bullet-hell.webp",
		category: "web",
		techStack: ["JavaScript", "HTML", "CSS"],
		status: "completed",
		sourceCode: "https://github.com/Ignorant12321/PIXEL-BULLET-HELL",
		visitUrl: "https://pixel-bullet-hell.pages.dev/",
		startDate: "2026-04-25",
		endDate: "2026-04-27",
		featured: true,
		tags: ["Game"],
	},
	{
		id: "Edge-Bookmark-Editor",
		title: "Edge-Bookmark-Editor",
		description:
			"一个纯静态的 Edge 收藏夹编辑器，用来导入、编辑、整理并重新导出 Edge 的收藏夹 HTML。",
		image: "/assets/projects/Edge-Bookmark-Editor.webp",
		category: "web",
		techStack: ["JavaScript", "CSS", "HTML"],
		status: "completed",
		sourceCode: "https://github.com/Ignorant12321/Edge-Bookmark-Editor",
		visitUrl: "https://edge-bookmark-editor.pages.dev/",
		startDate: "2026-04-12",
		endDate: "2026-04-14",
		featured: true,
		tags: ["Bookmark"],
	},
	{
		id: "enchantment-system",
		title: "enchantment-system",
		description:
			"一款模仿咸鱼之王的附魔系统，支持多种附魔类型和效果，提供丰富的附魔组合和策略。",
		image: "/assets/projects/enchantment-system.webp",
		category: "web",
		techStack: ["JavaScript", "CSS", "HTML"],
		status: "completed",
		sourceCode: "https://github.com/Ignorant12321/Enchantment-System",
		visitUrl: "https://enchantment-system.pages.dev/",
		startDate: "2024-12-28",
		endDate: "2024-12-07",
		featured: true,
		tags: ["Game"],
	},
	{
		id: "chessboard-lottery",
		title: "chessboard-lottery",
		description:
			"模仿300游戏大作战的暑假活动做了一个棋盘抽奖系统，看看你是不是欧皇！！！",
		image: "/assets/projects/chessboard-lottery.webp",
		category: "web",
		techStack: ["JavaScript", "CSS", "HTML"],
		status: "completed",
		sourceCode: "https://github.com/Ignorant12321/Chessboard-Lottery",
		visitUrl: "https://chessboard-lottery.pages.dev/",
		startDate: "2025-01-17",
		endDate: "2025-06-01",
		featured: true,
		tags: ["Game"],
	},
];

// Get project statistics
export const getProjectStats = () => {
	const total = projectsData.length;
	const completed = projectsData.filter(
		(p) => p.status === "completed",
	).length;
	const inProgress = projectsData.filter(
		(p) => p.status === "in-progress",
	).length;
	const planned = projectsData.filter((p) => p.status === "planned").length;

	return {
		total,
		byStatus: {
			completed,
			inProgress,
			planned,
		},
	};
};

// Get projects by category
export const getProjectsByCategory = (category?: string) => {
	if (!category || category === "all") {
		return projectsData;
	}
	return projectsData.filter((p) => p.category === category);
};

// Get featured projects
export const getFeaturedProjects = () => {
	return projectsData.filter((p) => p.featured);
};

// Get all tech stacks
export const getAllTechStack = () => {
	const techSet = new Set<string>();
	projectsData.forEach((project) => {
		project.techStack.forEach((tech) => {
			techSet.add(tech);
		});
	});
	return Array.from(techSet).sort();
};
