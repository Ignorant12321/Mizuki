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
// tag标签排序
export const tagPriority: string[] = ["私筑", "博引"];

// 导航链接数据
export const igNavsData: IgNavItem[] = [
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
		id: 5,
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
		desc: "一款开源的IT工具箱",
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
		desc: "零基础入门Python3的中文教程",
		siteurl: "https://www.runoob.com/python3/python3-tutorial.html",
		tags: ["博引", "授艺"],
	},
	{
		id: 9,
		title: "file-transfer-go",
		imgurl: "/assets/icon/fileTransferGo.svg",
		desc: "文件实时传输+屏幕共享一体化平台",
		siteurl: "https://transfer.52python.cn/",
		tags: ["博引", "器录"],
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
