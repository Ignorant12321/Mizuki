import fs from "node:fs";
import path from "node:path";

import {
	extractArrayBlock,
	getStringField,
	splitTopLevelObjects,
} from "./config.js";
import { collectMetingSongText } from "./lyrics.js";
import { PROJECT_ROOT } from "./paths.js";

export function extractGithubReposFromMarkdown(content) {
	const repos = new Set();
	const directiveRegex =
		/::+:github\{[^}]*repo\s*=\s*["']([^"']+)["'][^}]*\}/g;
	let match;

	while ((match = directiveRegex.exec(content)) !== null) {
		if (match[1]) {
			repos.add(match[1]);
		}
	}

	return repos;
}

const githubRepoDescriptionCache = new Map();

export async function fetchGithubRepoDescription(repo) {
	if (!repo || !repo.includes("/")) {
		return "";
	}

	if (githubRepoDescriptionCache.has(repo)) {
		return githubRepoDescriptionCache.get(repo);
	}

	try {
		const response = await fetch(`https://api.github.com/repos/${repo}`, {
			headers: {
				Accept: "application/vnd.github+json",
				"User-Agent": "Mizuki-font-compressor",
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const data = await response.json();
		const description = data.description
			? String(data.description).replace(/:[a-zA-Z0-9_]+:/g, "")
			: "";
		githubRepoDescriptionCache.set(repo, description);
		return description;
	} catch (error) {
		console.log(
			`⚠ Failed to fetch GitHub repo description for ${repo}: ${error.message}`,
		);
		githubRepoDescriptionCache.set(repo, "");
		return "";
	}
}

// 获取 Meting API 歌单数据中的文字
export async function fetchMetingPlaylistText() {
	try {
		// 读取配置文件获取音乐播放器配置
		const configPath = path.join(PROJECT_ROOT, "src/config.ts");
		const configContent = fs.readFileSync(configPath, "utf-8");

		// 检查音乐播放器是否启用
		const enableMatch = configContent.match(
			/musicPlayerConfig:\s*MusicPlayerConfig\s*=\s*\{[\s\S]*?enable:\s*(true|false)/,
		);
		if (!enableMatch || enableMatch[1] === "false") {
			console.log(
				"ℹ Music player disabled, skipping Meting API text collection",
			);
			return new Set();
		}

		const textSet = new Set();

		const playlistsBlock = extractArrayBlock(configContent, "playlists");
		if (!playlistsBlock) {
			console.log(
				"ℹ No music playlists found, skipping Meting API text collection",
			);
			return textSet;
		}

		const playlists = splitTopLevelObjects(playlistsBlock);
		if (playlists.length === 0) {
			console.log(
				"ℹ Music playlist list is empty, skipping Meting API text collection",
			);
			return textSet;
		}

		console.log(`ℹ Found ${playlists.length} music playlist config(s)`);

		const lyricUrlCache = new Map();
		for (const playlistConfig of playlists) {
			const name = getStringField(playlistConfig, "name") || "未命名歌单";
			const mode = getStringField(playlistConfig, "mode") || "meting";
			if (mode !== "meting") {
				continue;
			}

			const meting_api =
				getStringField(playlistConfig, "meting_api") ||
				"https://api.injahow.cn/meting/?server=:server&type=:type&id=:id&auth=:auth&r=:r";
			const meting_id = getStringField(playlistConfig, "id");
			const meting_server =
				getStringField(playlistConfig, "server") || "netease";
			const meting_type =
				getStringField(playlistConfig, "type") || "playlist";

			if (!meting_id) {
				console.log(
					`⚠ Skip music playlist "${name}" because id is empty`,
				);
				continue;
			}

			const apiUrl = meting_api
				.replace(":server", meting_server)
				.replace(":type", meting_type)
				.replace(":id", meting_id)
				.replace(":auth", "")
				.replace(":r", Date.now().toString());

			console.log(
				`ℹ Fetching music playlist "${name}" from Meting API...`,
			);
			console.log(`  URL: ${apiUrl}`);

			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000);

			try {
				const response = await fetch(apiUrl, {
					signal: controller.signal,
					headers: {
						"User-Agent":
							"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
					},
				});
				clearTimeout(timeoutId);

				if (!response.ok) {
					throw new Error(
						`HTTP ${response.status}: ${response.statusText}`,
					);
				}

				const playlist = await response.json();
				if (!Array.isArray(playlist)) {
					throw new Error("API response is not an array");
				}

				console.log(
					`✓ Successfully fetched ${playlist.length} songs from Meting API: ${name}`,
				);

				let songCount = 0;
				for (const song of playlist) {
					const hasSongText = await collectMetingSongText(
						song,
						textSet,
						{
							lyricUrlCache,
							logger: console.log,
						},
					);
					if (hasSongText) {
						songCount += 1;
					}
				}

				if (songCount === 0) {
					console.log(
						`⚠ No valid song data found in playlist: ${name}`,
					);
				}
			} catch (fetchError) {
				clearTimeout(timeoutId);
				if (fetchError.name === "AbortError") {
					console.log(
						`⚠ Meting API request timeout (10s), skipping music playlist: ${name}`,
					);
				} else {
					console.log(
						`⚠ Failed to fetch Meting API data for "${name}": ${fetchError.message}, skipping music text collection`,
					);
				}
			}
		}

		return textSet;
	} catch (error) {
		console.log(
			`⚠ Error processing Meting API config: ${error.message}, skipping music text collection`,
		);
		return new Set();
	}
}

// 获取 Bilibili 番剧数据中的文字
export async function fetchBilibiliAnimeText() {
	try {
		// 读取配置文件获取番剧配置
		const configPath = path.join(PROJECT_ROOT, "src/config.ts");
		const configContent = fs.readFileSync(configPath, "utf-8");

		// 检查番剧页面是否启用
		const featurePagesMatch = configContent.match(
			/featurePages:\s*\{([\s\S]*?)\}/,
		);
		if (featurePagesMatch) {
			const featureConfig = featurePagesMatch[1];
			const animeMatch = featureConfig.match(/anime:\s*(true|false)/);
			if (!animeMatch || animeMatch[1] === "false") {
				console.log(
					"ℹ Anime page disabled, skipping Bilibili text collection",
				);
				return new Set();
			}
		}

		// 提取番剧配置
		const animeModeMatch = configContent.match(
			/anime:\s*\{[\s\S]*?mode:\s*["']([^"']+)["']/,
		);
		const mode = animeModeMatch ? animeModeMatch[1] : "bangumi";

		if (mode !== "bilibili") {
			console.log(
				`ℹ Anime mode is not "bilibili", skipping Bilibili text collection`,
			);
			return new Set();
		}

		// 读取 bilibili-data.json 文件
		const dataFilePath = path.join(
			PROJECT_ROOT,
			"src/data/bilibili-data.json",
		);
		if (!fs.existsSync(dataFilePath)) {
			console.log(
				"ℹ Bilibili data file not found, skipping Bilibili text collection",
			);
			return new Set();
		}

		console.log("ℹ Reading anime data from Bilibili data file...");

		const textSet = new Set();
		const fileContent = fs.readFileSync(dataFilePath, "utf-8");
		const animeList = JSON.parse(fileContent);

		if (!Array.isArray(animeList)) {
			console.log(
				"⚠ Bilibili data is not an array, skipping text collection",
			);
			return new Set();
		}

		let processedCount = 0;

		// 处理每个动画条目
		for (const item of animeList) {
			// 提取标题
			const title = item.title || "";
			for (const char of title) {
				textSet.add(char);
			}

			// 提取描述/评价
			const description = item.description || item.evaluate || "";
			for (const char of description) {
				textSet.add(char);
			}

			// 提取工作室/地区
			const studio = item.studio || "";
			for (const char of studio) {
				textSet.add(char);
			}

			// 提取年份
			const year = item.year || "";
			for (const char of year) {
				textSet.add(char);
			}

			// 提取类型/标签/风格
			if (item.genre && Array.isArray(item.genre)) {
				item.genre.forEach((genre) => {
					if (typeof genre === "string") {
						for (const char of genre) {
							textSet.add(char);
						}
					}
				});
			}

			// 提取副标题（如果有）
			const subtitle = item.subtitle || "";
			if (subtitle) {
				for (const char of subtitle) {
					textSet.add(char);
				}
			}

			processedCount++;
		}

		if (processedCount > 0) {
			console.log(
				`✓ Successfully processed ${processedCount} anime items from Bilibili data`,
			);
		} else {
			console.log("⚠ No anime data found in Bilibili data file");
		}

		return textSet;
	} catch (error) {
		console.log(
			`⚠ Error processing Bilibili data: ${error.message}, skipping Bilibili text collection`,
		);
		return new Set();
	}
}

// 获取 Bangumi API 番剧数据中的文字
export async function fetchBangumiAnimeText() {
	try {
		// 读取配置文件获取番剧配置
		const configPath = path.join(PROJECT_ROOT, "src/config.ts");
		const configContent = fs.readFileSync(configPath, "utf-8");

		// 检查番剧页面是否启用
		const featurePagesMatch = configContent.match(
			/featurePages:\s*\{([\s\S]*?)\}/,
		);
		if (featurePagesMatch) {
			const featureConfig = featurePagesMatch[1];
			const animeMatch = featureConfig.match(/anime:\s*(true|false)/);
			if (!animeMatch || animeMatch[1] === "false") {
				console.log(
					"ℹ Anime page disabled, skipping Bangumi API text collection",
				);
				return new Set();
			}
		}

		// 提取番剧配置
		const bangumiUserIdMatch = configContent.match(
			/bangumi:\s*\{[\s\S]*?userId:\s*["']([^"']+)["']/,
		);
		const animeModeMatch = configContent.match(
			/anime:\s*\{[\s\S]*?mode:\s*["']([^"']+)["']/,
		);

		const userId = bangumiUserIdMatch ? bangumiUserIdMatch[1] : null;
		const mode = animeModeMatch ? animeModeMatch[1] : "bangumi";

		if (mode !== "bangumi" || !userId) {
			console.log(
				`ℹ Anime mode is not "bangumi" or no userId configured, skipping Bangumi API text collection`,
			);
			return new Set();
		}

		console.log("ℹ Fetching anime data from Bangumi API...");
		console.log(`  User ID: ${userId}`);

		const textSet = new Set();
		const BANGUMI_API_BASE = "https://api.bgm.tv";

		// Bangumi 收藏类型：1=想看，2=看过，3=在看，4=搁置，5=抛弃
		const collectionTypes = [1, 2, 3, 4, 5];

		// 获取单个收藏列表
		async function fetchCollection(userId, subjectType, type) {
			try {
				let allData = [];
				let offset = 0;
				const limit = 50;
				let hasMore = true;

				while (hasMore) {
					const controller = new AbortController();
					const timeoutId = setTimeout(
						() => controller.abort(),
						10000,
					);

					const response = await fetch(
						`${BANGUMI_API_BASE}/v0/users/${userId}/collections?subject_type=${subjectType}&type=${type}&limit=${limit}&offset=${offset}`,
						{
							signal: controller.signal,
							headers: {
								"User-Agent":
									"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
							},
						},
					);
					clearTimeout(timeoutId);

					if (!response.ok) {
						throw new Error(
							`HTTP ${response.status}: ${response.statusText}`,
						);
					}

					const data = await response.json();

					if (data.data && data.data.length > 0) {
						allData = [...allData, ...data.data];
					}

					if (!data.data || data.data.length < limit) {
						hasMore = false;
					} else {
						offset += limit;
					}

					// 防止请求过于频繁
					await new Promise((resolve) => setTimeout(resolve, 200));
				}

				return allData;
			} catch (error) {
				console.log(
					`⚠ Failed to fetch collection type ${type}: ${error.message}`,
				);
				return [];
			}
		}

		// 获取相关人员信息（制作公司等）
		async function fetchSubjectPersons(subjectId) {
			try {
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 5000);

				const response = await fetch(
					`${BANGUMI_API_BASE}/v0/subjects/${subjectId}/persons`,
					{
						signal: controller.signal,
						headers: {
							"User-Agent":
								"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
						},
					},
				);
				clearTimeout(timeoutId);

				if (!response.ok) {
					return [];
				}

				const data = await response.json();
				return Array.isArray(data) ? data : [];
			} catch (_error) {
				return [];
			}
		}

		let totalItems = 0;

		// 遍历所有收藏类型
		for (const type of collectionTypes) {
			const collections = await fetchCollection(userId, 2, type); // 2=动画

			if (collections.length === 0) {
				continue;
			}

			console.log(
				`✓ Fetched ${collections.length} items from collection type ${type}`,
			);
			totalItems += collections.length;

			// 处理每个动画条目
			for (const item of collections) {
				const subject = item.subject || {};

				// 提取标题
				const titleCn = subject.name_cn || "";
				const title = subject.name || "";

				for (const char of titleCn) {
					textSet.add(char);
				}
				for (const char of title) {
					textSet.add(char);
				}

				// 提取简介
				const summary = subject.short_summary || "";
				for (const char of summary) {
					textSet.add(char);
				}

				// 提取标签
				if (subject.tags && Array.isArray(subject.tags)) {
					subject.tags.forEach((tag) => {
						if (tag.name) {
							for (const char of tag.name) {
								textSet.add(char);
							}
						}
					});
				}

				// 获取制作公司信息（限制并发请求）
				if (item.subject_id && Math.random() < 0.3) {
					// 只获取30%的详细信息，避免请求过多
					const persons = await fetchSubjectPersons(item.subject_id);

					persons.forEach((person) => {
						if (person.name) {
							for (const char of person.name) {
								textSet.add(char);
							}
						}
						if (person.relation) {
							for (const char of person.relation) {
								textSet.add(char);
							}
						}
					});

					// 请求间隔
					await new Promise((resolve) => setTimeout(resolve, 100));
				}
			}
		}

		if (totalItems > 0) {
			console.log(
				`✓ Successfully processed ${totalItems} anime items from Bangumi API`,
			);
		} else {
			console.log("⚠ No anime data found from Bangumi API");
		}

		return textSet;
	} catch (error) {
		console.log(
			`⚠ Error processing Bangumi API config: ${error.message}, skipping anime text collection`,
		);
		return new Set();
	}
}
