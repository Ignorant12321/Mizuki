import type { APIRoute } from "astro";

import { formatNewsDate, getNewsList } from "../../data/news";

export const GET: APIRoute = async () => {
	const items = await getNewsList();

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
};
