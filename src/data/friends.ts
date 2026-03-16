// 友情链接数据配置
// 用于管理友情链接页面的数据

export interface FriendItem {
	id: number;
	title: string;
	imgurl: string;
	desc: string;
	siteurl: string;
	tags: string[];
}

// 友情链接数据
export const friendsData: FriendItem[] = [
	{
		id: 1,
		title: "二叉树树",
		imgurl: "https://q2.qlogo.cn/headimg_dl?dst_uin=2726730791&spec=0",
		desc: "Protect What You Love.",
		siteurl: "https://2x.nz/",
		tags: ["Blog"],
	},
	{
		id: 2,
		title: "まつざか ゆき",
		imgurl: "https://blog.mysqil.com/_astro/avatar.BDCKBkzJ_UdsLk.webp",
		desc: "世界は大きい、君は行かなければならない",
		siteurl: "https://blog.mysqil.com/",
		tags: ["Blog"],
	},
	{
		id: 3,
		title: "Yu Qi",
		imgurl: "https://yqamm.eu.cc/_astro/avatar.DsloLJ2B_Z1z32Q.webp",
		desc: "生命绚烂，别被黑暗压垮",
		siteurl: "https://yqamm.eu.cc",
		tags: ["Blog", "Friend"],
	},
	{
		id: 4,
		title: "夏夜流萤",
		imgurl: "https://q1.qlogo.cn/g?b=qq&nk=7618557&s=640",
		desc: "飞萤之火自无梦的长夜亮起，绽放在终竟的明天。",
		siteurl: "https://blog.cuteleaf.cn",
		tags: ["Blog"],
	},
];

// 获取所有友情链接数据
export function getFriendsList(): FriendItem[] {
	return friendsData;
}

// 获取随机排序的友情链接数据
export function getShuffledFriendsList(): FriendItem[] {
	const shuffled = [...friendsData];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}
