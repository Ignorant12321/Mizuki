import fs from "node:fs";
import path from "node:path";

import { PROJECT_ROOT } from "./paths.js";

// 读取配置文件获取语言设置和字体配置
export async function getConfig() {
	const configPath = path.join(PROJECT_ROOT, "src/config.ts");
	const configContent = fs.readFileSync(configPath, "utf-8");

	// 提取语言设置
	const langMatch = configContent.match(/const SITE_LANG = ["'](.+?)["']/);
	const lang = langMatch ? langMatch[1] : "zh_CN";

	// 提取字体配置
	const fontConfigMatch = configContent.match(/font:\s*\{([\s\S]*?)\n\t\},/);
	if (!fontConfigMatch) {
		console.log("⚠ Font config not found, using default settings");
		return { lang, fonts: [] };
	}

	const fontConfigStr = fontConfigMatch[1];
	const fonts = [];

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

	return { lang, fonts };
}

// Extracts an array literal from config.ts without evaluating user code.
export function extractArrayBlock(content, propertyName) {
	const propertyIndex = content.indexOf(`${propertyName}:`);
	if (propertyIndex === -1) {
		return null;
	}

	const arrayStart = content.indexOf("[", propertyIndex);
	if (arrayStart === -1) {
		return null;
	}

	let depth = 0;
	let inString = null;
	let escaped = false;

	for (let i = arrayStart; i < content.length; i += 1) {
		const char = content[i];

		if (inString) {
			if (escaped) {
				escaped = false;
				continue;
			}
			if (char === "\\") {
				escaped = true;
				continue;
			}
			if (char === inString) {
				inString = null;
			}
			continue;
		}

		if (char === '"' || char === "'" || char === "`") {
			inString = char;
			continue;
		}

		if (char === "[") {
			depth += 1;
		} else if (char === "]") {
			depth -= 1;
			if (depth === 0) {
				return content.slice(arrayStart + 1, i);
			}
		}
	}

	return null;
}

export function splitTopLevelObjects(arrayBlock) {
	const objects = [];
	let depth = 0;
	let inString = null;
	let escaped = false;
	let objectStart = -1;

	for (let i = 0; i < arrayBlock.length; i += 1) {
		const char = arrayBlock[i];

		if (inString) {
			if (escaped) {
				escaped = false;
				continue;
			}
			if (char === "\\") {
				escaped = true;
				continue;
			}
			if (char === inString) {
				inString = null;
			}
			continue;
		}

		if (char === '"' || char === "'" || char === "`") {
			inString = char;
			continue;
		}

		if (char === "{") {
			if (depth === 0) {
				objectStart = i;
			}
			depth += 1;
		} else if (char === "}") {
			depth -= 1;
			if (depth === 0 && objectStart !== -1) {
				objects.push(arrayBlock.slice(objectStart, i + 1));
				objectStart = -1;
			}
		}
	}

	return objects;
}

export function getStringField(source, fieldName) {
	const match = source.match(
		new RegExp(`${fieldName}:\\s*["']([^"']+)["']`, "m"),
	);
	return match ? match[1] : "";
}
