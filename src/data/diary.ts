import { getCollection } from "astro:content";

// ===================================================================================
// 配置区域
// ===================================================================================

// 🔴 在这里切换数据源: 'md' (Markdown) 或 'json' (src/data/diary.json)
const DATA_SOURCE: "md" | "json" = "md";

// ===================================================================================
// 接口定义
// ===================================================================================
export interface DiaryItem {
	id: string;
	content: string;
	date: string; // ISO 8601 string
	images?: string[];
	location?: string;
	mood?: string;
	tags?: string[];
}

// ===================================================================================
// 数据获取策略 (Strategy)
// ===================================================================================

/**
 * 策略 A: 从 Astro Content Collections (Markdown) 读取
 */
async function fetchFromMarkdown(): Promise<DiaryItem[]> {
	const allEntries = await getCollection("diary");

	const mappedData = allEntries.map((entry) => {
		let finalId: string;
		if (entry.data.id) {
			finalId = String(entry.data.id);
		} else if (entry.data.date) {
			finalId = new Date(entry.data.date).toISOString(); // 其次：使用日期
		} else {
			finalId = entry.id; // 最后：使用文件名
		}

		return {
			id: finalId,
			content: entry.body || "",
			date: entry.data.date
				? new Date(entry.data.date).toISOString()
				: new Date().toISOString(),
			images: entry.data.images || [],
			location: entry.data.location || "",
			mood: entry.data.mood || "",
			tags: entry.data.tags || [],
		};
	});

	return mappedData;
}

/**
 * 策略 B: 从 JSON 文件读取
 * 文件位于 src/data/diary.json
 */
async function fetchFromJson(): Promise<DiaryItem[]> {
	try {
		// 使用动态导入，避免构建时如果文件不存在导致报错
		// @ts-ignore: 忽略可能找不到文件的 TS 提示
		const jsonModule = await import("../data/diary.json");
		const rawData = (jsonModule.default || jsonModule) as any[];

		// 必须进行数据清洗，确保符合 DiaryItem 接口，防止 TS 报错
		return rawData.map((item: any) => ({
			id: String(item.id),
			content: item.content || "",
			date: item.date || new Date().toISOString(),
			images: item.images || [],
			location: item.location || "",
			mood: item.mood || "",
			tags: item.tags || [],
		}));
	} catch (error) {
		console.warn("⚠️ 未找到 src/data/diary.json 或格式错误，返回空列表。");
		return [];
	}
}

// ===================================================================================
// 核心调度函数
// ===================================================================================

async function getAllDiaryData(): Promise<DiaryItem[]> {
	let data: DiaryItem[] = [];

	if (DATA_SOURCE === "json") {
		data = await fetchFromJson();
	} else {
		// 默认为 md
		data = await fetchFromMarkdown();
	}

	// 统一按日期倒序排序
	return data.sort((a, b) => {
		return new Date(b.date).getTime() - new Date(a.date).getTime();
	});
}

// ===================================================================================
// 5. 导出 API (保持原有签名)
// ===================================================================================

export const getDiaryData = getAllDiaryData;

export const getDiaryStats = async () => {
	const diaryData = await getDiaryData();
	const total = diaryData.length;
	// 辅助函数：避免重复计算 filter
	const count = (predicate: (item: DiaryItem) => any) =>
		diaryData.filter(predicate).length;

	const hasImages = count((i) => i.images && i.images.length > 0);
	const hasLocation = count((i) => !!i.location); // !!强制转布尔
	const hasMood = count((i) => !!i.mood);

	return {
		total,
		hasImages,
		hasLocation,
		hasMood,
		imagePercentage: total > 0 ? Math.round((hasImages / total) * 100) : 0,
		locationPercentage:
			total > 0 ? Math.round((hasLocation / total) * 100) : 0,
		moodPercentage: total > 0 ? Math.round((hasMood / total) * 100) : 0,
	};
};

export const getDiaryList = async (limit?: number) => {
	const sortedData = await getDiaryData();
	if (limit && limit > 0) {
		return sortedData.slice(0, limit);
	}
	return sortedData;
};

export const getLatestDiary = async () => {
	const list = await getDiaryList(1);
	return list[0];
};

export const getDiaryById = async (id: string) => {
	const diaryData = await getDiaryData();
	return diaryData.find((item) => item.id === id);
};

export const getDiaryWithImages = async () => {
	const diaryData = await getDiaryData();
	return diaryData.filter((item) => item.images && item.images.length > 0);
};

export const getDiaryByTag = async (tag: string) => {
	const diaryData = await getDiaryData();
	return diaryData.filter((item) => item.tags?.includes(tag));
};

export const getAllTags = async () => {
	const diaryData = await getDiaryData();
	const tags = new Set<string>();
	diaryData.forEach((item) => {
		if (item.tags) {
			item.tags.forEach((tag) => tags.add(tag));
		}
	});
	return Array.from(tags).sort();
};

export default getDiaryData;
