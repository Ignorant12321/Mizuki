import fs from "node:fs";
import path from "node:path";

import { getConfig } from "./config.js";
import {
	extractGithubReposFromMarkdown,
	fetchBangumiAnimeText,
	fetchBilibiliAnimeText,
	fetchGithubRepoDescription,
	fetchMetingPlaylistText,
} from "./external-text.js";
import { PROJECT_ROOT } from "./paths.js";

export function addTextFromContent(content, textSet) {
	// 统一提取字符串字面量，既适用于 TS/JS，也适用于 JSON 文本源
	const patterns = [
		/"([^"\\]|\\.|\\n|\\t)*"/g,
		/'([^'\\]|\\.|\\n|\\t)*'/g,
		/`([^`\\]|\\.|\\n|\\t)*`/g,
	];

	for (const pattern of patterns) {
		const matches = content.match(pattern);
		if (!matches) {
			continue;
		}

		for (const match of matches) {
			let text = match;

			if (
				(text.startsWith('"') && text.endsWith('"')) ||
				(text.startsWith("'") && text.endsWith("'")) ||
				(text.startsWith("`") && text.endsWith("`"))
			) {
				text = text.slice(1, -1);
			}

			text = text
				.replace(/\\n/g, "\n")
				.replace(/\\t/g, "\t")
				.replace(/\\"/g, '"')
				.replace(/\\'/g, "'");

			for (const char of text) {
				textSet.add(char);
			}
		}
	}

	const stringMatches = content.match(/["'`]([^"'`]+)["'`]/g);
	if (stringMatches) {
		for (const match of stringMatches) {
			const text = match.slice(1, -1);
			for (const char of text) {
				textSet.add(char);
			}
		}
	}
}

export function addTextFromFile(filePath, textSet) {
	if (!fs.existsSync(filePath)) {
		return;
	}

	const content = fs.readFileSync(filePath, "utf-8");
	addTextFromContent(content, textSet);
}

// 递归读取目录下所有文件
export function readFilesRecursively(dir, fileList = []) {
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
export function extractText(content, ext) {
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
export function getAsciiCharset() {
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

// 收集所有使用的文字（用于 CJK 字体）
export async function collectText() {
	const { lang } = await getConfig();

	const textSet = new Set();

	// 1. 读取 src/data 目录
	const dataDir = path.join(PROJECT_ROOT, "src/data");
	const dataFiles = readFilesRecursively(dataDir);

	dataFiles.forEach((file) => {
		if (file.endsWith(".ts") || file.endsWith(".js")) {
			const content = fs.readFileSync(file, "utf-8");
			addTextFromContent(content, textSet);
		}
	});

	// 2. 读取音乐播放器本地播放列表 constants 文件
	const musicConstantsFile = path.join(
		PROJECT_ROOT,
		"src/components/widgets/music-player/constants.ts",
	);
	if (fs.existsSync(musicConstantsFile)) {
		const content = fs.readFileSync(musicConstantsFile, "utf-8");
		addTextFromContent(content, textSet);
	}

	// 3. 读取 src/config.ts 文件
	const configFile = path.join(PROJECT_ROOT, "src/config.ts");
	if (fs.existsSync(configFile)) {
		const content = fs.readFileSync(configFile, "utf-8");
		addTextFromContent(content, textSet);
	}

	// 4. 读取对应语言的 i18n 文件
	const i18nFile = path.join(PROJECT_ROOT, `src/i18n/languages/${lang}.ts`);
	if (fs.existsSync(i18nFile)) {
		const content = fs.readFileSync(i18nFile, "utf-8");
		addTextFromContent(content, textSet);
	}

	// 4.5 读取额外补字表以及 Live2D 相关文案
	addTextFromFile(
		path.join(PROJECT_ROOT, "src/data/compress-fonts-data.ts"),
		textSet,
	);
	addTextFromFile(
		path.join(PROJECT_ROOT, "src/components/features/live2d/Live2D.svelte"),
		textSet,
	);
	addTextFromFile(
		path.join(PROJECT_ROOT, "public/assets/live2d/waifu-tips.json"),
		textSet,
	);

	// 5. 读取 content 目录（根据环境变量决定路径）
	let contentDir;
	if (process.env.ENABLE_CONTENT_SYNC === "true" && process.env.CONTENT_DIR) {
		// 使用环境变量指定的目录（以项目根目录为基准）
		contentDir = path.join(PROJECT_ROOT, process.env.CONTENT_DIR);
		console.log(
			`ℹ Using external content directory: ${process.env.CONTENT_DIR}`,
		);
	} else {
		// 使用默认的 src/content 目录
		contentDir = path.join(PROJECT_ROOT, "src/content");
	}

	// 检查目录是否存在
	if (!fs.existsSync(contentDir)) {
		console.log(`⚠ Content directory does not exist: ${contentDir}`);
		console.log("  Skipping content text collection");
	} else {
		const contentFiles = readFilesRecursively(contentDir);
		const githubRepos = new Set();

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

				if (ext === ".md" || ext === ".mdx") {
					const repos = extractGithubReposFromMarkdown(content);
					for (const repo of repos) {
						githubRepos.add(repo);
					}
				}
			}
		});

		if (githubRepos.size > 0) {
			console.log(
				`ℹ Fetching GitHub card descriptions from ${githubRepos.size} repo(s)`,
			);
			for (const repo of githubRepos) {
				const description = await fetchGithubRepoDescription(repo);
				if (description) {
					for (const char of description) {
						textSet.add(char);
					}
				}
			}
		}
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

	// 6. 从 Meting API 获取歌单数据中的文字
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

	// 7. 从 Bangumi API 获取番剧数据中的文字
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

	// 8. 从 Bilibili 数据文件获取番剧数据中的文字
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

	const allText = Array.from(textSet).sort().join("");

	return allText;
}
