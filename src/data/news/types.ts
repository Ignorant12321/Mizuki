export interface NewsItem {
	title: string;
	link: string;
	pubDate?: string;
	description?: string;
	category?: string;
	sourceName: string;
	sourceUrl: string;
}

export interface NewsFeedSource {
	id: string;
	name: string;
	url: string;
}
