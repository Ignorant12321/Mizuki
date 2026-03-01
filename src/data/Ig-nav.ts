// 导航链接数据配置
// 用于管理导航链接页面的数据

export interface IgNavItem {
	id: number;
	title: string;
	imgurl: string;
	desc: string;
	siteurl: string;
	tags: string[];
}

// 导航链接数据
export const igNavsData: IgNavItem[] = [
	{
		id: 1,
		title: "寄驿",
		imgurl: "/assets/icon/StreamlineEmojisDeliveryTruck.svg",
		desc: "开箱即用的文件快传系统",
		siteurl: "https://filecodebox.ignorant.top",
		tags: ["Ignorant", "器录"],
	},
	{
		id: 2,
		title: "图阁",
		imgurl: "/assets/icon/StreamlineUltimateColorPictureSun.svg",
		desc: "支持多文件上传的图床",
		siteurl: "https://easyimage.ignorant.top",
		tags: ["Ignorant", "器录"],
	},
	{
		id: 5,
		title: "云汇",
		imgurl: "/assets/icon/StreamlineCyberColorHarddisk.svg",
		desc: "开源社区驱动的文件列表程序",
		siteurl: "https://openlist.ignorant.top",
		tags: ["Ignorant", "器录"],
	},
	{
		id: 4,
		title: "运序",
		imgurl: "/assets/icon/StreamlineFlexColorMonitorError.svg",
		desc: "轻量级开源监控工具",
		siteurl: "https://uptimeflare.218501.xyz/",
		tags: ["Ignorant", "观星"],
	},
	{
		id: 5,
		title: "溯踪",
		imgurl: "/assets/icon/FlatColorIconsStatistics.svg",
		desc: "网站浏览行为分析工具",
		siteurl: "https://cloud.umami.is/analytics/us/share/fl6gANbC7Y79IHZt",
		tags: ["Ignorant", "观星"],
	},
	{
		id: 6,
		title: "IT-Tools",
		imgurl: "/assets/icon/StreamlineUltimateColorToolBox.svg",
		desc: "一款开源的IT工具箱",
		siteurl: "https://it-tools.tech/",
		tags: ["外链"],
	},
	{
		id: 7,
		title: "Any-Listen",
		imgurl: "/assets/icon/anylisten.svg",
		desc: "一款跨平台的私人音乐播放服务",
		siteurl: "https://music.ignorant.top/",
		tags: ["Ignorant", "弦音"],
	},
];

// 获取所有友情链接数据
export function getIgNavsList(): IgNavItem[] {
	return igNavsData;
}

// 获取随机排序的友情链接数据
export function getShuffledIgNavsList(): IgNavItem[] {
	const shuffled = [...igNavsData];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}
