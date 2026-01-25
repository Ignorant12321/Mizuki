// 设备数据配置文件

export interface Device {
	name: string;
	image: string;
	specs: string;
	description: string;
	link: string;
}

// 设备类别类型，支持品牌和自定义类别
export type DeviceCategory = {
	[categoryName: string]: Device[];
} & {
	自定义?: Device[];
};

export const devicesData: DeviceCategory = {
	Phone: [
		{
			name: "vivo Y74s",
			image: "/images/device/vivo Y74s.webp",
			specs: "Blue | 12G+256GB",
			description: "44W闪充 | 天玑810芯片",
			link: "https://shop.vivo.com.cn/product/10007009",
		},
	],
	Matepad: [
		{
			name: "HUAWEI MatePad Air 12",
			image: "/images/device/HUAWEI MatePad Air 12.png",
			specs: "Grey | 12GB+256GB",
			description: "12 英寸云晰柔光屏 | HarmonyOS 6",
			link: "https://consumer.huawei.com/cn/tablets/matepad-air/",
		},
	],
	Laptop: [
		{
			name: "HASEE S7-DA7NP",
			image: "/images/device/HASEE S7-DA7NP.png",
			specs: "Grey | 16GB+512GB",
			description: "12代英特尔 酷睿 i7-1255U",
			link: "http://www.hasee.com/goods/detail/42",
		},
	],
};
