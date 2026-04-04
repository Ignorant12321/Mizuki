// 导航数据配置

export interface NavigationItem {
	id: number;
	title: string;
	imgurl: string;
	desc: string;
	siteurl: string;
	tags: string[];
}

// 标签固定优先级（为空时保持默认顺序）
export const tagPriority: string[] = ["私筑", "博引"];

export const navigationData: NavigationItem[] = [
	{
		id: 1,
		title: "寄驿",
		imgurl: "/assets/icon/StreamlineEmojisDeliveryTruck.svg",
		desc: "开箱即用的文件快传系统",
		siteurl: "https://filecodebox.ignorant.top",
		tags: ["私筑", "器录"],
	},
	{
		id: 2,
		title: "图阁",
		imgurl: "/assets/icon/StreamlineUltimateColorPictureSun.svg",
		desc: "支持多文件上传的图床",
		siteurl: "https://easyimage.ignorant.top",
		tags: ["私筑", "器录"],
	},
	{
		id: 3,
		title: "云汇",
		imgurl: "/assets/icon/StreamlineCyberColorHarddisk.svg",
		desc: "开源社区驱动的文件列表程序",
		siteurl: "https://openlist.ignorant.top",
		tags: ["私筑", "器录"],
	},
	{
		id: 4,
		title: "运序",
		imgurl: "/assets/icon/StreamlineFlexColorMonitorError.svg",
		desc: "轻量级开源监控工具",
		siteurl: "https://uptimeflare.218501.xyz/",
		tags: ["私筑", "观星"],
	},
	{
		id: 5,
		title: "溯踪",
		imgurl: "/assets/icon/FlatColorIconsStatistics.svg",
		desc: "网站浏览行为分析工具",
		siteurl: "https://cloud.umami.is/analytics/us/share/fl6gANbC7Y79IHZt",
		tags: ["私筑", "观星"],
	},
	{
		id: 6,
		title: "IT-Tools",
		imgurl: "/assets/icon/StreamlineUltimateColorToolBox.svg",
		desc: "一款开源的 IT 工具箱",
		siteurl: "https://it-tools.tech/",
		tags: ["博引", "器录"],
	},
	{
		id: 7,
		title: "Navidrome",
		imgurl: "/assets/icon/Navidrome.svg",
		desc: "个人音乐库管理与流媒体服务",
		siteurl: "https://music.ignorant.top/",
		tags: ["私筑", "弦音"],
	},
	{
		id: 8,
		title: "Python 教程",
		imgurl: "/assets/icon/VscodeIconsFileTypePython.svg",
		desc: "零基础入门 Python3 的中文教程",
		siteurl: "https://www.runoob.com/python3/python3-tutorial.html",
		tags: ["博引", "授艺"],
	},
];

export function getNavigationList(): NavigationItem[] {
	return navigationData;
}

export function getShuffledNavigationList(): NavigationItem[] {
	const shuffled = [...navigationData];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}
