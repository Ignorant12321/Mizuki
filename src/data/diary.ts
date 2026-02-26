import { getCollection } from "astro:content";

// 数据源配置: 'md' (Astro Content Collection) 或 'json'
const DATA_SOURCE: "md" | "json" = "md";

export interface DiaryItem {
	id: string | number; // 兼容原版 number 类型的 ID
	content: string;
	date: string;
	images?: string[];
	location?: string;
	mood?: string;
	tags?: string[];
}

// 内存缓存，避免在同一个构建周期内重复读取和排序文件
let cachedDiaryData: DiaryItem[] | null = null;

async function fetchDiaryData(): Promise<DiaryItem[]> {
	if (DATA_SOURCE === "json") {
		try {
			const module = await import("../data/diary-data.json");
			const rawData = module.default || module;
			return Array.isArray(rawData) ? rawData : [];
		} catch (error) {
			console.warn(
				"⚠️ [Diary] 未找到 src/data/diary-data.json 或格式错误，将返回空列表。",
			);
			return [];
		}
	}

	// 默认从 Astro Content 读取 Markdown
	const entries = await getCollection("diary");
	return entries.map((entry) => ({
		id: entry.data.id || entry.id, // 优先使用 frontmatter 中的 id
		content: entry.body || "",
		date: entry.data.date
			? new Date(entry.data.date).toISOString()
			: new Date().toISOString(),
		images: entry.data.images || [],
		location: entry.data.location || "",
		mood: entry.data.mood || "",
		tags: entry.data.tags || [],
	}));
}

export async function getDiaryData(): Promise<DiaryItem[]> {
	if (cachedDiaryData) return cachedDiaryData;

	const data = await fetchDiaryData();

	// 统一按时间倒序
	cachedDiaryData = data.sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
	);

	return cachedDiaryData;
}

export const getDiaryStats = async () => {
	const data = await getDiaryData();
	const total = data.length;

	if (total === 0) {
		return {
			total: 0,
			hasImages: 0,
			hasLocation: 0,
			hasMood: 0,
			imagePercentage: 0,
			locationPercentage: 0,
			moodPercentage: 0,
		};
	}

	const hasImages = data.filter((i) => i.images?.length).length;
	const hasLocation = data.filter((i) => !!i.location).length;
	const hasMood = data.filter((i) => !!i.mood).length;

	return {
		total,
		hasImages,
		hasLocation,
		hasMood,
		imagePercentage: Math.round((hasImages / total) * 100),
		locationPercentage: Math.round((hasLocation / total) * 100),
		moodPercentage: Math.round((hasMood / total) * 100),
	};
};

export const getDiaryList = async (limit?: number) => {
	const data = await getDiaryData();
	return limit && limit > 0 ? data.slice(0, limit) : data;
};

export const getLatestDiary = async () => {
	const list = await getDiaryList(1);
	return list[0];
};

export const getDiaryById = async (id: string | number) => {
	const data = await getDiaryData();
	return data.find((item) => String(item.id) === String(id));
};

export const getDiaryWithImages = async () => {
	const data = await getDiaryData();
	return data.filter((item) => item.images?.length);
};

export const getDiaryByTag = async (tag: string) => {
	const data = await getDiaryData();
	return data.filter((item) => item.tags?.includes(tag));
};

export const getAllTags = async () => {
	const data = await getDiaryData();
	const tags = new Set<string>();

	data.forEach((item) => {
		item.tags?.forEach((tag) => tags.add(tag));
	});

	return Array.from(tags).sort();
};

export default getDiaryData;
