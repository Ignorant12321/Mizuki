import { getCollection } from "astro:content";

import { siteConfig } from "../config";

export interface DiaryItem {
	id: string | number;
	content: string;
	date: string;
	images?: string[];
	location?: string;
	mood?: string;
	tags?: string[];
}

let cachedDiaryData: DiaryItem[] | null = null;

function normalizeDiaryItem(item: DiaryItem): DiaryItem {
	const parsedDate = new Date(item.date);
	const normalizedDate = Number.isNaN(parsedDate.getTime())
		? new Date().toISOString()
		: parsedDate.toISOString();

	return {
		id: item.id,
		content: item.content ?? "",
		date: normalizedDate,
		images: item.images ?? [],
		location: item.location ?? "",
		mood: item.mood ?? "",
		tags: item.tags ?? [],
	};
}

async function fetchDiaryData(): Promise<DiaryItem[]> {
	if (siteConfig.diary?.dataSource === "md") {
		const entries = await getCollection("diary");
		return entries.map((entry) =>
			normalizeDiaryItem({
				id: entry.data.id ?? entry.id,
				content: entry.body ?? "",
				date: entry.data.date.toISOString(),
				images: entry.data.images,
				location: entry.data.location,
				mood: entry.data.mood,
				tags: entry.data.tags,
			}),
		);
	}

	const module = await import("./diary-data.json");
	const rawJson = module.default;
	if (!Array.isArray(rawJson)) {
		return [];
	}

	return rawJson.map((item) => normalizeDiaryItem(item as DiaryItem));
}

export async function getDiaryData(): Promise<DiaryItem[]> {
	if (cachedDiaryData) return cachedDiaryData;

	const data = await fetchDiaryData();
	cachedDiaryData = [...data].sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
	);

	return cachedDiaryData;
}

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
