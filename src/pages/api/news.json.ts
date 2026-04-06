import fs from "fs/promises";
import path from "path";

import type { APIRoute } from "astro";

import { formatNewsDate } from "../../data/news";

export const GET: APIRoute = async () => {
	try {
		const snapshotPath = path.join(
			process.cwd(),
			"src",
			"data",
			"news-data.json",
		);
		const raw = await fs.readFile(snapshotPath, "utf-8");
		const parsed = JSON.parse(raw);
		const items = Array.isArray(parsed) ? parsed : [];

		return new Response(
			JSON.stringify({
				items: items.map((item) => ({
					title: item.title,
					link: item.link,
					pubDate: formatNewsDate(item.pubDate),
					description: item.description,
					category: item.category,
					sourceName: item.sourceName,
				})),
			}),
			{
				headers: {
					"Content-Type": "application/json; charset=utf-8",
					"Cache-Control": "public, max-age=60",
				},
			},
		);
	} catch {
		return new Response(JSON.stringify({ items: [] }), {
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Cache-Control": "public, max-age=60",
			},
		});
	}
};
