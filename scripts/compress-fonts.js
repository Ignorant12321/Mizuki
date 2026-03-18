import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Fontmin from "fontmin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, "../src/config.ts");
const compressFontsDataPath = path.join(
	__dirname,
	"../src/data/compress-fonts-data.ts",
);

function splitExtraText(rawText) {
	if (!rawText) return [];
	return rawText
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
}

function getDefaultExtraTextFromData() {
	if (!fs.existsSync(compressFontsDataPath)) {
		return "";
	}

	try {
		const content = fs.readFileSync(compressFontsDataPath, "utf-8");
		const match = content.match(
			/compressFontsExtraText\s*=\s*(["'`])([\s\S]*?)\1/m,
		);
		return match ? match[2].trim() : "";
	} catch {
		return "";
	}
}

// 读取配置文件获取语言设置和字体配置
async function getConfig() {
	const configContent = fs.readFileSync(configPath, "utf-8");

	// 提取语言设置
	const langMatch = configContent.match(/const SITE_LANG = ["'](.+?)["']/);
	const lang = langMatch ? langMatch[1] : "zh_CN";

	// 提取字体配置
	const fontConfigMatch = configContent.match(/font:\s*\{([\s\S]*?)\n\t\},/);
	if (!fontConfigMatch) {
		console.log("⚠ Font config not found, using default settings");
		return {
			lang,
			fonts: [],
			extraTextTerms: splitExtraText(getDefaultExtraTextFromData()),
		};
	}

	const fontConfigStr = fontConfigMatch[1];
	const fonts = [];
	const extraTextMatch = fontConfigStr.match(
		/extraText:\s*(["'`])([\s\S]*?)\1/m,
	);
	const extraTextFromConfig = extraTextMatch ? extraTextMatch[2].trim() : "";
	const fallbackExtraText = getDefaultExtraTextFromData();
	const resolvedExtraText = extraTextFromConfig || fallbackExtraText;
	const extraTextTerms = splitExtraText(resolvedExtraText);

	// 解析每个字体类别（asciiFont, cjkFont）
	const fontTypes = ["asciiFont", "cjkFont"];

	for (const fontType of fontTypes) {
		const regex = new RegExp(`${fontType}:\\s*\\{([\\s\\S]*?)\\}`, "m");
		const match = fontConfigStr.match(regex);

		if (match) {
			const fontConfig = match[1];

			// 提取 enableCompress
			const compressMatch = fontConfig.match(
				/enableCompress:\s*(true|false)/,
			);
			const enableCompress = compressMatch
				? compressMatch[1] === "true"
				: false;

			// 提取 localFonts 数组
			const localFontsMatch = fontConfig.match(
				/localFonts:\s*\[(.*?)\]/s,
			);
			let localFonts = [];

			if (localFontsMatch?.[1].trim()) {
				// 提取数组中的字符串
				const fontsStr = localFontsMatch[1];
				localFonts =
					fontsStr
						.match(/["']([^"']+)["']/g)
						?.map((s) => s.replace(/["']/g, "")) || [];
			}

			if (enableCompress && localFonts.length > 0) {
				fonts.push({
					type: fontType,
					files: localFonts,
					enableCompress,
				});
			}
		}
	}

	return { lang, fonts, extraTextTerms };
}

// 递归读取目录下所有文件
function readFilesRecursively(dir, fileList = []) {
	const files = fs.readdirSync(dir);

	files.forEach((file) => {
		const filePath = path.join(dir, file);
		const stat = fs.statSync(filePath);

		if (stat.isDirectory()) {
			readFilesRecursively(filePath, fileList);
		} else {
			fileList.push(filePath);
		}
	});

	return fileList;
}

// 提取文本内容
function extractText(content, ext) {
	let text = content;
	let frontmatterText = "";

	// 提取并处理 frontmatter 中的文本
	if (ext === ".md" || ext === ".mdx") {
		const frontmatterMatch = content.match(/^---[\s\S]*?---/m);
		if (frontmatterMatch) {
			const frontmatter = frontmatterMatch[0];

			// 提取 frontmatter 中的字符串值（包括有引号和无引号的）
			// 匹配 key: value 格式（无引号）
			const unquotedMatches = frontmatter.match(
				/^\s*\w+:\s*([^'"\n]+)$/gm,
			);
			if (unquotedMatches) {
				unquotedMatches.forEach((match) => {
					const value = match.replace(/^\s*\w+:\s*/, "").trim();
					// 排除布尔值、日期、数字等非文本内容
					if (!value.match(/^(true|false|\d{4}-\d{2}-\d{2}|\d+)$/)) {
						frontmatterText += `${value} `;
					}
				});
			}

			// 提取带引号的字符串值
			const quotedMatches = frontmatter.match(/:\s*['"]([^'"]+)['"]/g);
			if (quotedMatches) {
				quotedMatches.forEach((match) => {
					const value = match.replace(/:\s*['"]([^'"]+)['"]/, "$1");
					frontmatterText += `${value} `;
				});
			}

			// 提取列表项中的文本（如 tags 列表）
			const listMatches = frontmatter.match(/^\s*-\s*([^\n]+)$/gm);
			if (listMatches) {
				listMatches.forEach((match) => {
					const value = match.replace(/^\s*-\s*/, "").trim();
					frontmatterText += `${value} `;
				});
			}
		}

		// 移除 frontmatter 后继续处理正文
		text = text.replace(/^---[\s\S]*?---\s*/m, "");

		// 移除代码块中的内容（通常不需要特殊字体）
		text = text.replace(/```[\s\S]*?```/g, "");
		text = text.replace(/`[^`]+`/g, "");
	}

	// 移除 HTML 标签
	text = text.replace(/<[^>]*>/g, " ");

	// 移除 Markdown 语法
	text = text.replace(/[#*_~`[\]()]/g, " ");

	// 移除 URL
	text = text.replace(/https?:\/\/[^\s]+/g, "");

	// 移除多余的空白字符
	text = text.replace(/\s+/g, " ").trim();

	// 合并 frontmatter 文本和正文
	const finalText = `${frontmatterText} ${text}`.trim();

	return finalText;
}

// 获取 ASCII 字符集（用于 asciiFont）
function getAsciiCharset() {
	const chars = new Set();

	// 基本 ASCII 字符：空格到波浪号 (32-126)
	for (let i = 32; i <= 126; i++) {
		chars.add(String.fromCharCode(i));
	}

	// 常用符号和标点
	const common = " !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
	for (const char of common) {
		chars.add(char);
	}

	// 数字
	for (let i = 0; i <= 9; i++) {
		chars.add(String(i));
	}

	// 英文字母
	const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
	for (const char of alphabet) {
		chars.add(char);
	}

	const text = Array.from(chars).sort().join("");

	return text;
}

function addCharsToSet(targetSet, text) {
	if (!text) return;
	for (const char of text) {
		if (!char.trim()) continue;
		targetSet.add(char);
	}
}

function isLikelyLyricUrl(value) {
	if (typeof value !== "string") return false;
	const text = value.trim();
	if (!text) return false;
	if (/^(https?:)?\/\//i.test(text)) return true;
	if (text.startsWith("/")) return true;
	if (/\.lrc(\?.*)?$/i.test(text)) return true;
	if (/type=lrc/i.test(text)) return true;
	return false;
}

function normalizeLyricText(raw) {
	if (!raw) return "";
	return raw
		.replace(/^\uFEFF/, "")
		.replace(/\r/g, "")
		// 去掉 LRC 时间轴/元数据标签
		.replace(/\[(?:\d{1,2}:\d{1,2}(?:\.\d{1,3})?|[a-z]+:[^\]]*)\]/gi, " ")
		// 去掉简单 HTML 标签
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function toAbsoluteLyricUrl(rawUrl, baseUrl) {
	if (!rawUrl) return null;
	const decoded = rawUrl.trim().replace(/&amp;/g, "&");
	if (!decoded) return null;
	if (/^\/\//.test(decoded)) return `https:${decoded}`;
	try {
		return new URL(decoded, baseUrl).toString();
	} catch {
		return null;
	}
}

async function fetchLyricFromUrl(url) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 8000);
	try {
		const response = await fetch(url, {
			signal: controller.signal,
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
				Accept: "text/plain,application/json;q=0.9,*/*;q=0.8",
			},
		});
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		return await response.text();
	} finally {
		clearTimeout(timeoutId);
	}
}

// 获取 Meting API 歌单数据中的文字
async function fetchMetingPlaylistText() {
	try {
		// 读取配置文件获取音乐播放器配置
		const configPath = path.join(__dirname, "../src/config.ts");
		const configContent = fs.readFileSync(configPath, "utf-8");

		// 检查音乐播放器是否启用
		const enableMatch = configContent.match(
			/musicPlayerConfig[\s\S]*?enable:\s*(true|false)/,
		);
		if (!enableMatch || enableMatch[1] === "false") {
			console.log(
				"ℹ Music player disabled, skipping Meting API text collection",
			);
			return new Set();
		}

		// 提取整个 musicPlayerConfig 块
		let configStr = "";
		const startIndex = configContent.indexOf("musicPlayerConfig");
		if (startIndex !== -1) {
			let openBraces = 0;
			let started = false;
			for (let i = startIndex; i < configContent.length; i++) {
				const char = configContent[i];
				if (char === "{") {
					openBraces++;
					started = true;
				} else if (char === "}") {
					openBraces--;
				}
				if (started) {
					configStr += char;
					if (openBraces === 0) break;
				}
			}
		} else {
			return new Set();
		}

		// 提取配置值的工具函数
		const extractValue = (str, key) => {
			const match = str.match(new RegExp(`${key}:\\s*["']([^"']+)["']`));
			return match ? match[1] : null;
		};

		// 获取外层全局默认配置
		const globalMode = extractValue(configStr, "mode") || "meting";
		const globalApi =
			extractValue(configStr, "meting_api") ||
			"https://meting.mikus.ink/api?server=:server&type=:type&id=:id&auth=:auth&r=:r";
		const globalServer = extractValue(configStr, "server") || "netease";
		const globalType = extractValue(configStr, "type") || "playlist";
		const globalId = extractValue(configStr, "id");

		const requests = [];

		// 1. 添加主配置中的歌单（向下兼容）
		if (globalMode === "meting" && globalId) {
			requests.push({
				api: globalApi,
				server: globalServer,
				type: globalType,
				id: globalId,
			});
		}

		// 2. 提取 playlists 数组中的所有歌单
		const playlistsStartIndex = configStr.indexOf("playlists:");
		if (playlistsStartIndex !== -1) {
			// 按 "{" 分割，检查每个包含 "id:" 的代码块
			const parts = configStr.slice(playlistsStartIndex).split("{");
			for (const part of parts) {
				const block = part.split("}")[0]; // 取闭合大括号之前的内容
				if (block.includes("id:")) {
					const mode = extractValue(block, "mode");
					// 如果未配置 mode，则继承外层的 globalMode
					const isMeting =
						mode === "meting" || (!mode && globalMode === "meting");

					if (isMeting) {
						const id = extractValue(block, "id");
						// 确保是有引号的字符串 ID (避免匹配到 local 模式中的数字 id: 1)
						if (id) {
							requests.push({
								api:
									extractValue(block, "meting_api") ||
									globalApi,
								server:
									extractValue(block, "server") ||
									globalServer,
								type: extractValue(block, "type") || globalType,
								id: id,
							});
						}
					}
				}
			}
		}

		// 3. 去重并生成完整的请求 URL
		const uniqueRequests = [];
		const seenUrls = new Set();
		for (const req of requests) {
			const urlKey = `${req.api}|${req.server}|${req.type}|${req.id}`;
			if (!seenUrls.has(urlKey)) {
				seenUrls.add(urlKey);
				const apiUrl = req.api
					.replace(":server", req.server)
					.replace(":type", req.type)
					.replace(":id", req.id)
					.replace(":auth", "")
					.replace(":r", Date.now().toString());
				uniqueRequests.push(apiUrl);
			}
		}

		if (uniqueRequests.length === 0) {
			console.log(
				"ℹ No Meting API playlists found, skipping music text collection",
			);
			return new Set();
		}

		console.log(
			`ℹ Fetching music playlists from ${uniqueRequests.length} Meting API endpoints...`,
		);
		const textSet = new Set();
		const lyricUrls = new Set();
		let inlineLyricSongCount = 0;
		let lyricUrlCount = 0;

		// 4. 遍历所有 API 端点获取数据
		for (const apiUrl of uniqueRequests) {
			console.log(`  URL: ${apiUrl}`);
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

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
					`  ✓ Successfully fetched ${playlist.length} songs`,
				);

				// 提取歌曲信息中的文字
				let songCount = 0;
				playlist.forEach((song) => {
					const title = song.name ?? song.title ?? "";
					const artist = song.artist ?? song.author ?? "";
					const hasSongText = title.trim() || artist.trim();

					if (hasSongText) {
						songCount++;
					}
					addCharsToSet(textSet, title);
					addCharsToSet(textSet, artist);

					const lyricCandidates = [
						song.lyric,
						song.lrc,
						song?.lrc?.lyric,
						song?.lyric?.lyric,
						song.lyricUrl,
						song.lrcUrl,
					];

					let hasInlineLyric = false;
					for (const candidate of lyricCandidates) {
						if (typeof candidate !== "string") continue;
						const value = candidate.trim();
						if (!value) continue;

						if (isLikelyLyricUrl(value)) {
							const absoluteUrl = toAbsoluteLyricUrl(value, apiUrl);
							if (absoluteUrl) {
								lyricUrls.add(absoluteUrl);
							}
							continue;
						}

						const normalized = normalizeLyricText(value);
						if (normalized) {
							hasInlineLyric = true;
							addCharsToSet(textSet, normalized);
						}
					}

					if (hasInlineLyric) {
						inlineLyricSongCount++;
					}
				});

				if (songCount === 0) {
					console.log(
						"  ⚠ No valid song data found in this API response",
					);
				}
			} catch (fetchError) {
				clearTimeout(timeoutId);
				if (fetchError.name === "AbortError") {
					console.log(
						"  ⚠ Meting API request timeout (10s), skipping this playlist",
					);
				} else {
					console.log(
						`  ⚠ Failed to fetch Meting API data: ${fetchError.message}, skipping this playlist`,
					);
				}
			}
		}

		// 5. 拉取远程歌词 URL（通常来自 Meting 的 lrc 字段）
		if (lyricUrls.size > 0) {
			const maxLyricRequests = 120;
			const lyricUrlList = Array.from(lyricUrls).slice(0, maxLyricRequests);
			console.log(
				`ℹ Fetching lyrics from ${lyricUrlList.length}/${lyricUrls.size} lyric URLs...`,
			);

			for (const lyricUrl of lyricUrlList) {
				try {
					const lyricRaw = await fetchLyricFromUrl(lyricUrl);
					const lyricText = normalizeLyricText(lyricRaw);
					if (lyricText) {
						addCharsToSet(textSet, lyricText);
						lyricUrlCount++;
					}
				} catch (error) {
					const message =
						error?.name === "AbortError"
							? "timeout"
							: error?.message || "unknown error";
					console.log(`  ⚠ Failed lyric URL: ${lyricUrl} (${message})`);
				}
			}
		}

		if (inlineLyricSongCount > 0 || lyricUrlCount > 0) {
			console.log(
				`✓ Added lyric chars (inline songs: ${inlineLyricSongCount}, remote lyric files: ${lyricUrlCount})`,
			);
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
async function fetchBilibiliAnimeText() {
	try {
		// 读取配置文件获取番剧配置
		const configPath = path.join(__dirname, "../src/config.ts");
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
			__dirname,
			"../src/data/bilibili-data.json",
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
async function fetchBangumiAnimeText() {
	try {
		// 读取配置文件获取番剧配置
		const configPath = path.join(__dirname, "../src/config.ts");
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
// 获取 Markdown 文件中 GitHub 卡片的动态文字（官方 API 提权版）
async function fetchGitHubRepoText() {
	try {
		// 1. 确定内容目录（与 collectText 的解析逻辑保持一致）
		let contentDir;
		if (
			process.env.ENABLE_CONTENT_SYNC === "true" &&
			process.env.CONTENT_DIR
		) {
			contentDir = path.join(__dirname, "..", process.env.CONTENT_DIR);
		} else {
			contentDir = path.join(__dirname, "../src/content"); // 默认 Astro 内容目录
		}

		if (!fs.existsSync(contentDir)) {
			console.log(
				"ℹ Content directory not found, skipping GitHub text collection",
			);
			return new Set();
		}

		// 2. 复用全局的 readFilesRecursively 函数
		const files = readFilesRecursively(contentDir);
		const repos = new Set();

		// 3. 匹配 ::github{repo="xxx/yyy"}
		const githubRegex = /::github\{repo=["']([^"']+)["']\}/g;
		for (const file of files) {
			const ext = path.extname(file).toLowerCase();
			if (ext === ".md" || ext === ".mdx") {
				const content = fs.readFileSync(file, "utf-8");
				let match;
				while ((match = githubRegex.exec(content)) !== null) {
					repos.add(match[1]);
				}
			}
		}

		if (repos.size === 0) {
			console.log(
				"ℹ No GitHub cards found, skipping GitHub text collection",
			);
			return new Set();
		}

		console.log(
			`ℹ Fetching data for ${repos.size} GitHub repositories (via GitHub API)...`,
		);

		// 获取环境变量中的 GITHUB_TOKEN
		const token = process.env.GITHUB_TOKEN;
		if (!token) {
			console.log("  ⚠ WARNING: GITHUB_TOKEN is not set!");
			console.log(
				"    Without a token, you are limited to 60 requests/hour.",
			);
		} else {
			console.log(
				"  ℹ Using provided GITHUB_TOKEN for authentication (5000 requests/hr).",
			);
		}

		const textSet = new Set();

		// 【双保险】把常见的编程语言字符直接加入字体库，防止卡片上的语言标签缺字
		const commonLanguages =
			"TypeScriptJavaScriptHTMLCSSVueReactAstroPythonJavaC++GoRustRubyPHPSwiftKotlinShellObjective-C";
		for (const char of commonLanguages) textSet.add(char);

		// 4. 遍历请求 GitHub API 获取介绍文字
		for (const repo of repos) {
			const url = `https://api.github.com/repos/${repo}`;
			console.log(`  URL: ${url}`);

			let success = false;
			let retryCount = 2; // 最多重试 2 次

			while (retryCount >= 0 && !success) {
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

				try {
					const headers = {
						"User-Agent":
							"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
						Accept: "application/vnd.github.v3+json",
					};

					// 如果配置了 Token，就在请求头里带上
					if (token) {
						headers["Authorization"] = `Bearer ${token}`;
					}

					const response = await fetch(url, {
						signal: controller.signal,
						headers: headers,
					});

					clearTimeout(timeoutId);

					if (!response.ok) {
						// 专门捕捉速率限制错误
						if (
							response.status === 403 ||
							response.status === 429
						) {
							throw new Error(
								`API Rate Limit Exceeded or Forbidden (HTTP ${response.status})`,
							);
						}
						throw new Error(
							`HTTP ${response.status}: ${response.statusText}`,
						);
					}

					const data = await response.json();

					// 提取 API 返回的 JSON 数据：仓库名、描述、语言类型、全名
					const textToExtract =
						(data.name || "") +
						(data.description || "") +
						(data.language || "") +
						repo;

					let charCount = 0;
					for (const char of textToExtract) {
						textSet.add(char);
						charCount++;
					}

					if (charCount > 0) {
						console.log(
							`  ✓ Successfully extracted text from ${repo}`,
						);
					} else {
						console.log(`  ⚠ No text found for ${repo}`);
					}

					success = true; // 成功，跳出 while 循环
				} catch (fetchError) {
					clearTimeout(timeoutId);

					if (retryCount > 0) {
						console.log(
							`  ⚠ Fetch failed (${fetchError.message}), retrying... (${retryCount} left)`,
						);
						// 失败后等待 2 秒再重试，防止并发过高
						await new Promise((resolve) =>
							setTimeout(resolve, 2000),
						);
					} else {
						if (fetchError.name === "AbortError") {
							console.log(
								`  ⚠ GitHub API request timeout (10s), skipping ${repo}`,
							);
						} else {
							console.log(
								`  ⚠ Failed to fetch ${repo}: ${fetchError.message}`,
							);
						}
					}
				}
				retryCount--;
			}
		}

		return textSet;
	} catch (error) {
		console.log(
			`⚠ Error processing GitHub repos: ${error.message}, skipping GitHub text collection`,
		);
		return new Set();
	}
}

// 收集所有使用的文字（用于 CJK 字体）
async function collectText() {
	const { lang, extraTextTerms } = await getConfig();

	const textSet = new Set();

	// 1. 读取 src/data 目录
	const dataDir = path.join(__dirname, "../src/data");
	const dataFiles = readFilesRecursively(dataDir);

	dataFiles.forEach((file) => {
		if (file.endsWith(".ts") || file.endsWith(".js")) {
			const content = fs.readFileSync(file, "utf-8");

			// 改进的字符串匹配
			const patterns = [
				// 双引号字符串
				/"([^"\\]|\\.|\\n|\\t)*"/g,
				// 单引号字符串
				/'([^'\\]|\\.|\\n|\\t)*'/g,
				// 模板字符串
				/`([^`\\]|\\.|\\n|\\t)*`/g,
			];

			patterns.forEach((pattern) => {
				const matches = content.match(pattern);
				if (matches) {
					matches.forEach((match) => {
						let text = match;

						// 清理引号
						if (
							(text.startsWith('"') && text.endsWith('"')) ||
							(text.startsWith("'") && text.endsWith("'")) ||
							(text.startsWith("`") && text.endsWith("`"))
						) {
							text = text.slice(1, -1);
						}

						// 处理转义字符
						text = text
							.replace(/\\n/g, "\n")
							.replace(/\\t/g, "\t")
							.replace(/\\"/g, '"')
							.replace(/\\'/g, "'");

						for (const char of text) {
							textSet.add(char);
						}
					});
				}
			});

			// 简单正则作为补充
			const stringMatches = content.match(/["'`]([^"'`]+)["'`]/g);
			if (stringMatches) {
				stringMatches.forEach((match) => {
					const text = match.slice(1, -1);
					for (const char of text) {
						textSet.add(char);
					}
				});
			}
		}
	});

	// 2. 读取 src/config.ts 文件
	const configFile = path.join(__dirname, "../src/config.ts");
	if (fs.existsSync(configFile)) {
		const content = fs.readFileSync(configFile, "utf-8");

		// 改进的字符串匹配
		const patterns = [
			// 双引号字符串
			/"([^"\\]|\\.|\\n|\\t)*"/g,
			// 单引号字符串
			/'([^'\\]|\\.|\\n|\\t)*'/g,
			// 模板字符串
			/`([^`\\]|\\.|\\n|\\t)*`/g,
		];

		patterns.forEach((pattern) => {
			const matches = content.match(pattern);
			if (matches) {
				matches.forEach((match) => {
					// 清理引号和注释标记
					let text = match;

					// 移除字符串的引号
					if (
						(text.startsWith('"') && text.endsWith('"')) ||
						(text.startsWith("'") && text.endsWith("'")) ||
						(text.startsWith("`") && text.endsWith("`"))
					) {
						text = text.slice(1, -1);
					}

					// 处理转义字符
					text = text
						.replace(/\\n/g, "\n")
						.replace(/\\t/g, "\t")
						.replace(/\\"/g, '"')
						.replace(/\\'/g, "'");

					// 提取所有字符（包括中文）
					for (const char of text) {
						textSet.add(char);
					}
				});
			}
		});

		// 作为补充，还用原来的简单正则再扫一遍，确保不遗漏
		const simpleMatches = content.match(/["'`]([^"'`]+)["'`]/g);
		if (simpleMatches) {
			simpleMatches.forEach((match) => {
				const text = match.slice(1, -1);
				for (const char of text) {
					textSet.add(char);
				}
			});
		}
	}

	// 3. 读取对应语言的 i18n 文件
	const i18nFile = path.join(__dirname, `../src/i18n/languages/${lang}.ts`);
	if (fs.existsSync(i18nFile)) {
		const content = fs.readFileSync(i18nFile, "utf-8");

		// 改进的字符串匹配
		const patterns = [
			/"([^"\\]|\\.|\\n|\\t)*"/g,
			/'([^'\\]|\\.|\\n|\\t)*'/g,
			/`([^`\\]|\\.|\\n|\\t)*`/g,
		];

		patterns.forEach((pattern) => {
			const matches = content.match(pattern);
			if (matches) {
				matches.forEach((match) => {
					let text = match;

					if (
						(text.startsWith('"') && text.endsWith('"')) ||
						(text.startsWith("'") && text.endsWith("'")) ||
						(text.startsWith("`") && text.endsWith("`"))
					) {
						text = text.slice(1, -1);
					}

					// 处理转义字符
					text = text
						.replace(/\\n/g, "\n")
						.replace(/\\t/g, "\t")
						.replace(/\\"/g, '"')
						.replace(/\\'/g, "'");

					for (const char of text) {
						textSet.add(char);
					}
				});
			}
		});

		// 简单正则作为补充
		const stringMatches = content.match(/["'`]([^"'`]+)["'`]/g);
		if (stringMatches) {
			stringMatches.forEach((match) => {
				const text = match.slice(1, -1);
				for (const char of text) {
					textSet.add(char);
				}
			});
		}
	}

	// 4. 读取 content 目录（根据环境变量决定路径）
	let contentDir;
	if (process.env.ENABLE_CONTENT_SYNC === "true" && process.env.CONTENT_DIR) {
		// 使用环境变量指定的目录（以项目根目录为基准）
		contentDir = path.join(__dirname, "..", process.env.CONTENT_DIR);
		console.log(
			`ℹ Using external content directory: ${process.env.CONTENT_DIR}`,
		);
	} else {
		// 使用默认的 src/content 目录
		contentDir = path.join(__dirname, "../src/content");
	}

	// 检查目录是否存在
	if (!fs.existsSync(contentDir)) {
		console.log(`⚠ Content directory does not exist: ${contentDir}`);
		console.log("  Skipping content text collection");
	} else {
		const contentFiles = readFilesRecursively(contentDir);

		contentFiles.forEach((file) => {
			const ext = path.extname(file);
			if ([".md", ".mdx", ".ts", ".js"].includes(ext)) {
				const content = fs.readFileSync(file, "utf-8");
				const text = extractText(content, ext);
				for (const char of text) {
					// 只保留中文、日文、韩文等 CJK 字符和常用标点
					if (
						char.match(
							/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\u3000-\u303f\uff00-\uffef]/,
						)
					) {
						textSet.add(char);
					}
				}
			}
		});
	}

	// 添加常用标点符号和数字
	const commonChars = "0123456789，。！？；：\"\"''（）【】《》、·—…「」『』";
	for (const char of commonChars) {
		textSet.add(char);
	}

	// 添加英文字母（如果字体支持）
	const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
	for (const char of alphabet) {
		textSet.add(char);
	}

	// 5. 从 Meting API 获取歌单数据中的文字
	const metingTextSet = await fetchMetingPlaylistText();

	// 将 Meting API 的文字添加到主文字集合中
	for (const char of metingTextSet) {
		textSet.add(char);
	}

	if (metingTextSet.size > 0) {
		console.log(
			`✓ Added ${metingTextSet.size} unique characters from music playlist`,
		);
	}

	// 6. 从 Bangumi API 获取番剧数据中的文字
	const bangumiTextSet = await fetchBangumiAnimeText();

	// 将 Bangumi API 的文字添加到主文字集合中
	for (const char of bangumiTextSet) {
		textSet.add(char);
	}

	if (bangumiTextSet.size > 0) {
		console.log(
			`✓ Added ${bangumiTextSet.size} unique characters from Bangumi anime data`,
		);
	}

	// 7. 从 Bilibili 数据文件获取番剧数据中的文字
	const bilibiliTextSet = await fetchBilibiliAnimeText();

	// 将 Bilibili 数据的文字添加到主文字集合中
	for (const char of bilibiliTextSet) {
		textSet.add(char);
	}

	if (bilibiliTextSet.size > 0) {
		console.log(
			`✓ Added ${bilibiliTextSet.size} unique characters from Bilibili anime data`,
		);
	}

	// 8. 从 Markdown 文件中提取 GitHub 卡片文字
	const githubTextSet = await fetchGitHubRepoText();

	// 将 GitHub 的文字添加到主文字集合中
	for (const char of githubTextSet) {
		textSet.add(char);
	}

	if (githubTextSet.size > 0) {
		console.log(
			`✓ Added ${githubTextSet.size} unique characters from GitHub repositories`,
		);
	}

	// 从配置或默认 data 文件中添加补充文本（支持英文逗号分隔）
	for (const term of extraTextTerms) {
		for (const char of term) {
			textSet.add(char);
		}
	}

	const allText = Array.from(textSet).sort().join("");

	return allText;
}

// 压缩字体并输出到 dist 目录
async function compressFonts() {
	try {
		// 读取配置
		const { fonts } = await getConfig();

		if (fonts.length === 0) {
			console.log(
				"⚠ No fonts to compress (enableCompress=false or localFonts is empty)",
			);
			return;
		}

		console.log(`Found ${fonts.length} font configs to compress`);

		// 检查 dist 目录是否存在
		const distDir = path.join(__dirname, "../dist");
		if (!fs.existsSync(distDir)) {
			console.log(
				"⚠ dist directory does not exist, please run astro build first",
			);
			return;
		}

		// 创建 dist/assets/font 目录
		const distFontDir = path.join(distDir, "assets/font");
		if (!fs.existsSync(distFontDir)) {
			fs.mkdirSync(distFontDir, { recursive: true });
		}

		// 根据字体类型收集不同的字符集
		const cjkText = await collectText(); // CJK 字体使用完整字符集
		const asciiText = getAsciiCharset(); // ASCII 字体只使用 ASCII 字符集

		console.log("Starting font compression...");

		let totalOriginalSize = 0;
		let totalCompressedSize = 0;
		let processedCount = 0;

		// 用于收集所有错误
		const errors = [];

		// 遍历所有需要压缩的字体
		for (const fontConfig of fonts) {
			// 根据字体类型选择字符集
			const text = fontConfig.type === "asciiFont" ? asciiText : cjkText;

			for (const fontFile of fontConfig.files) {
				const fontSrc = path.join(
					__dirname,
					"../public/assets/font",
					fontFile,
				);
				const ext = path.extname(fontFile).toLowerCase();
				const baseName = path.basename(fontFile, ext);

				if (!fs.existsSync(fontSrc)) {
					const errorMsg = `❌ Config error [${fontConfig.type}]: Font file does not exist   In config: "${fontFile}"\n   Expected path: public/assets/font/${fontFile}\n   \n   Please check:\n   1. Is the filename correct (case sensitive)?\n   2. Is the file in public/assets/font/?\n   3. Is ${fontConfig.type}.localFonts in src/config.ts correct?`;

					errors.push(errorMsg);
					console.log(`\n${errorMsg}\n`);
					continue;
				}

				const originalSize = fs.statSync(fontSrc).size;
				totalOriginalSize += originalSize;

				// 根据文件类型决定处理方式
				if (ext === ".woff2" || ext === ".woff") {
					// woff/woff2 已经是 Web 优化格式，不支持进一步子集化压缩
					console.log(
						`⚠ Skipping ${fontFile} (already web-optimized format)`,
					);

					// 直接复制到 dist
					const destFile = path.join(distFontDir, fontFile);
					fs.copyFileSync(fontSrc, destFile);
					totalCompressedSize += originalSize;
					// 不计入处理数量
				} else if (ext === ".ttf" || ext === ".otf") {
					// TTF/OTF 需要压缩为 woff2
					console.log(`Compressing ${fontFile}...`);

					const fontmin = new Fontmin()
						.src(fontSrc)
						.use(
							Fontmin.glyph({
								text: text,
								hinting: false,
							}),
						)
						.use(
							Fontmin.ttf2woff2({
								deflate: true,
							}),
						)
						.dest(distFontDir);

					await new Promise((resolve, reject) => {
						fontmin.run((err, files) => {
							if (err) {
								reject(err);
							} else {
								resolve(files);
							}
						});
					});

					// 检查压缩结果
					const compressedFile = path.join(
						distFontDir,
						`${baseName}.woff2`,
					);

					if (fs.existsSync(compressedFile)) {
						const compressedSize = fs.statSync(compressedFile).size;
						totalCompressedSize += compressedSize;
						const reduction = (
							(1 - compressedSize / originalSize) *
							100
						).toFixed(2);

						console.log(
							`✓ ${fontFile} → ${baseName}.woff2 (${(compressedSize / 1024).toFixed(2)} KB, reduced ${reduction}%)`,
						);
						processedCount++;
					}
				} else {
					console.log(
						`⚠ Unsupported font format, skipping: ${fontFile}`,
					);
				}
			}
		}

		// 输出总结
		if (errors.length > 0) {
			console.log("\n❌ Font compression encountered errors!");
			console.log(`${errors.length} errors, please fix and retry.\n`);

			// 列出实际存在的字体文件
			const fontDir = path.join(__dirname, "../public/assets/font");
			if (fs.existsSync(fontDir)) {
				const actualFiles = fs
					.readdirSync(fontDir)
					.filter((f) =>
						[".ttf", ".otf", ".woff", ".woff2"].includes(
							path.extname(f).toLowerCase(),
						),
					);

				if (actualFiles.length > 0) {
					console.log("Available font files:");
					actualFiles.forEach((f) => console.log(`  - ${f}`));
				} else {
					console.log("  (font directory is empty)");
				}
			}

			process.exit(1);
		}

		if (processedCount > 0) {
			const totalReduction = (
				(1 - totalCompressedSize / totalOriginalSize) *
				100
			).toFixed(2);
			console.log("\n✓ Font optimization complete!");
			console.log(
				`  Files processed: ${processedCount}, Overall reduction: ${totalReduction}%`,
			);
		} else {
			console.log("\n⚠ No font files processed");
		}
	} catch (error) {
		console.error("❌ Font compression failed:", error);
		process.exit(1);
	}
}

// 运行压缩
compressFonts();
