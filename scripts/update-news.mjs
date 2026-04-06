import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import ts from "typescript";

import { parseBilibiliFeed } from "./news/bilibili.mjs";
import { parseCsdnFeed } from "./news/csdn.mjs";
import { dedupeAndSort, fetchXmlWithRetry } from "./news/common.mjs";
import { parseGenericRss } from "./news/rss-generic.mjs";
import { parseZaobaoFeed } from "./news/zaobao.mjs";

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(ROOT_DIR, "../src/config.ts");
const OUTPUT_FILE = path.join(ROOT_DIR, "../src/data/news-data.json");

function pickParser(source) {
	const fingerprint = `${String(source.id || "").toLowerCase()} ${String(source.name || "").toLowerCase()} ${String(source.url || "").toLowerCase()}`;
	if (fingerprint.includes("zaobao")) {
		return parseZaobaoFeed;
	}
	if (fingerprint.includes("csdn")) {
		return parseCsdnFeed;
	}
	if (fingerprint.includes("bilibili")) {
		return parseBilibiliFeed;
	}
	return parseGenericRss;
}

async function getNewsFeedsFromConfig() {
	const configContent = await fs.readFile(CONFIG_PATH, "utf-8");
	const sourceFile = ts.createSourceFile(
		CONFIG_PATH,
		configContent,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TS,
	);

	let siteConfigObject = null;

	for (const statement of sourceFile.statements) {
		if (!ts.isVariableStatement(statement)) {
			continue;
		}

		for (const declaration of statement.declarationList.declarations) {
			if (
				ts.isIdentifier(declaration.name) &&
				declaration.name.text === "siteConfig" &&
				declaration.initializer &&
				ts.isObjectLiteralExpression(declaration.initializer)
			) {
				siteConfigObject = declaration.initializer;
				break;
			}
		}

		if (siteConfigObject) {
			break;
		}
	}

	if (!siteConfigObject) {
		console.warn("Warning: failed to locate siteConfig in src/config.ts");
		return [];
	}

	const newsProperty = siteConfigObject.properties.find((property) => {
		return (
			ts.isPropertyAssignment(property) &&
			((ts.isIdentifier(property.name) &&
				property.name.text === "news") ||
				(ts.isStringLiteral(property.name) &&
					property.name.text === "news"))
		);
	});

	if (!newsProperty || !ts.isPropertyAssignment(newsProperty)) {
		console.warn(
			"Warning: failed to locate siteConfig.news in src/config.ts",
		);
		return [];
	}

	if (!ts.isObjectLiteralExpression(newsProperty.initializer)) {
		console.warn("Warning: siteConfig.news is not an object literal");
		return [];
	}

	const feedsProperty = newsProperty.initializer.properties.find(
		(property) => {
			return (
				ts.isPropertyAssignment(property) &&
				((ts.isIdentifier(property.name) &&
					property.name.text === "feeds") ||
					(ts.isStringLiteral(property.name) &&
						property.name.text === "feeds"))
			);
		},
	);

	if (!feedsProperty || !ts.isPropertyAssignment(feedsProperty)) {
		console.warn(
			"Warning: failed to locate siteConfig.news.feeds in src/config.ts",
		);
		return [];
	}

	if (!ts.isArrayLiteralExpression(feedsProperty.initializer)) {
		console.warn("Warning: siteConfig.news.feeds is not an array literal");
		return [];
	}

	const feeds = [];

	for (const element of feedsProperty.initializer.elements) {
		if (!ts.isObjectLiteralExpression(element)) {
			continue;
		}

		const getStringProperty = (name) => {
			const property = element.properties.find((item) => {
				return (
					ts.isPropertyAssignment(item) &&
					((ts.isIdentifier(item.name) && item.name.text === name) ||
						(ts.isStringLiteral(item.name) &&
							item.name.text === name))
				);
			});

			if (!property || !ts.isPropertyAssignment(property)) {
				return undefined;
			}

			const initializer = property.initializer;
			if (
				ts.isStringLiteral(initializer) ||
				ts.isNoSubstitutionTemplateLiteral(initializer)
			) {
				return initializer.text;
			}

			return undefined;
		};

		const id = getStringProperty("id");
		const name = getStringProperty("name");
		const url = getStringProperty("url");

		if (id && name && url) {
			feeds.push({ id, name, url });
		}
	}

	return feeds;
}

async function fetchNewsListBySource(source) {
	console.log(`[news] fetching: ${source.name} (${source.url})`);
	try {
		const xml = await fetchXmlWithRetry(source.url);
		const parser = pickParser(source);
		const items = parser(xml, source);
		console.log(`[news] fetched: ${source.name} -> ${items.length} items`);
		return items;
	} catch (error) {
		let reason = String(error);
		if (error instanceof Error) {
			reason = `${error.name}: ${error.message}`;
			const cause = error.cause;
			if (cause) {
				const causeText =
					cause instanceof Error
						? `${cause.name}: ${cause.message}`
						: String(cause);
				reason = `${reason} | cause=${causeText}`;
			}
		}
		console.warn(`[news] failed: ${source.name} -> ${reason}`);
		return [];
	}
}

async function updateNewsSnapshot() {
	const feeds = await getNewsFeedsFromConfig();
	console.log(
		`[news] mode=local snapshot update started, feeds=${feeds.length}`,
	);
	if (feeds.length === 0) {
		console.warn("Warning: no news feeds found in src/config.ts");
		await fs.writeFile(OUTPUT_FILE, "[]\n", "utf-8");
		console.log(`[news] snapshot written: ${OUTPUT_FILE} (0 items)`);
		return;
	}

	const listBySource = await Promise.all(
		feeds.map((source) => fetchNewsListBySource(source)),
	);
	const deduped = dedupeAndSort(listBySource.flat());

	await fs.writeFile(
		OUTPUT_FILE,
		`${JSON.stringify(deduped, null, 2)}\n`,
		"utf-8",
	);
	const successFeeds = listBySource.filter(
		(items) => items.length > 0,
	).length;
	console.log(
		`[news] snapshot written: ${OUTPUT_FILE} (${deduped.length} items, successful_feeds=${successFeeds}/${feeds.length})`,
	);
}

updateNewsSnapshot().catch(async (error) => {
	console.error("✘ Failed to update news snapshot");
	console.error(error);
	await fs.writeFile(OUTPUT_FILE, "[]\n", "utf-8");
	process.exit(0);
});
