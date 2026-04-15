import I18nKey from "../i18n/i18nKey";

export interface CollectionItem {
	id: number;
	titleKey: I18nKey;
	imgurl: string;
	descKey: I18nKey;
	siteurl: string;
	tagKeys: I18nKey[];
	external?: boolean;
	feature?: "news" | "navigation";
}

export const collectionTagPriorityKeys: I18nKey[] = [
	I18nKey.collectionTagInternal,
	I18nKey.collectionTagNews,
	I18nKey.collectionTagNavigation,
	I18nKey.collectionTagCloud,
];

export const collectionData: CollectionItem[] = [
	{
		id: 1,
		titleKey: I18nKey.collectionNewsTitle,
		imgurl: "/assets/icon/news.svg",
		descKey: I18nKey.collectionNewsDescription,
		siteurl: "/news/",
		tagKeys: [I18nKey.collectionTagInternal, I18nKey.collectionTagNews],
		external: false,
		feature: "news",
	},
	{
		id: 2,
		titleKey: I18nKey.collectionNavigationTitle,
		imgurl: "/assets/icon/navigation.svg",
		descKey: I18nKey.collectionNavigationDescription,
		siteurl: "/navigation/",
		tagKeys: [
			I18nKey.collectionTagInternal,
			I18nKey.collectionTagNavigation,
		],
		external: false,
		feature: "navigation",
	},
	{
		id: 3,
		titleKey: I18nKey.collectionFilesTitle,
		imgurl: "/assets/icon/fileTransferGo.svg",
		descKey: I18nKey.collectionFilesDescription,
		siteurl: "/files/",
		tagKeys: [I18nKey.collectionTagInternal, I18nKey.collectionTagCloud],
		external: false,
	},
];

export function getCollectionList(): CollectionItem[] {
	return collectionData;
}
