import fs from "node:fs";
import path from "node:path";
import Fontmin from "fontmin";

import { collectText, getAsciiCharset } from "./collect-text.js";
import { getConfig } from "./config.js";
import { PROJECT_ROOT } from "./paths.js";

// 压缩字体并输出到 dist 目录
export async function compressFonts() {
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
		const distDir = path.join(PROJECT_ROOT, "dist");
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
					PROJECT_ROOT,
					"public/assets/font",
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
			const fontDir = path.join(PROJECT_ROOT, "public/assets/font");
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

// 更新 dist 中的 CSS，将 ttf 引用替换为 woff2（子集优化后）或保持原样
export async function updateCssFontReferences() {
	try {
		const { fonts } = await getConfig();
		const distDir = path.join(PROJECT_ROOT, "dist");
		const publicFontDir = path.join(PROJECT_ROOT, "public/assets/font");

		// 查找所有 CSS 文件（包括 _astro 目录）
		const cssFiles = [];
		function findCssFiles(dir) {
			if (!fs.existsSync(dir)) return;
			const files = fs.readdirSync(dir);
			files.forEach((file) => {
				const filePath = path.join(dir, file);
				const stat = fs.statSync(filePath);
				if (stat.isDirectory()) {
					findCssFiles(filePath);
				} else if (file.endsWith(".css")) {
					cssFiles.push(filePath);
				}
			});
		}
		findCssFiles(distDir);

		if (cssFiles.length === 0) {
			console.log("⚠ No CSS files found in dist");
			return;
		}

		for (const fontConfig of fonts) {
			for (const fontFile of fontConfig.files) {
				const ext = path.extname(fontFile).toLowerCase();
				const baseName = path.basename(fontFile, ext);
				const ttfFile = fontFile;
				const woff2File = `${baseName}.woff2`;

				// 检查 woff2 是否存在（构建生成的或用户提供的）
				const distWoff2 = path.join(
					PROJECT_ROOT,
					`dist/assets/font/${woff2File}`,
				);
				const publicWoff2 = path.join(
					publicFontDir,
					`${baseName}.woff2`,
				);
				const hasWoff2 =
					fs.existsSync(distWoff2) || fs.existsSync(publicWoff2);

				if (!hasWoff2) {
					console.log(
						`⚠ No woff2 found for ${baseName}, keeping ttf reference`,
					);
					continue;
				}

				// 更新每个 CSS 文件
				for (const cssFile of cssFiles) {
					let cssContent = fs.readFileSync(cssFile, "utf-8");
					const originalContent = cssContent;

					// 匹配 @font-face 规则中引用该字体的 src
					// 匹配格式: url("/assets/font/xxx.ttf") 或 url("/assets/font/xxx.ttf") format("truetype")
					const ttfPattern = new RegExp(
						`url\\(["']?/assets/font/${baseName}\\.ttf["']?\\)\\s*format\\(["']truetype["']\\)`,
						"g",
					);

					if (fontConfig.enableCompress) {
						// 子集优化：直接替换为 woff2（子集化后的）
						cssContent = cssContent.replace(
							ttfPattern,
							`url("/assets/font/${woff2File}") format("woff2")`,
						);
					} else {
						// 未开启子集优化：使用原始 woff2（如果有），降级到 ttf
						if (fs.existsSync(publicWoff2)) {
							cssContent = cssContent.replace(
								ttfPattern,
								`url("/assets/font/${woff2File}") format("woff2"), url("/assets/font/${baseName}.ttf") format("truetype")`,
							);
						}
					}

					if (cssContent !== originalContent) {
						fs.writeFileSync(cssFile, cssContent);
						console.log(`✓ Updated CSS: ${cssFile} (${baseName})`);
					}
				}
			}
		}

		// 处理未在 config 中配置但用户直接放在 font 目录的 woff2
		// 扫描 public/font 目录下的 woff2，检查是否有对应的 ttf 被 CSS 引用
		const publicFiles = fs.readdirSync(publicFontDir);
		for (const file of publicFiles) {
			if (file.endsWith(".woff2")) {
				const baseName = path.basename(file, ".woff2");
				const ttfFile = `${baseName}.ttf`;

				// 检查是否有 CSS 引用了这个 ttf
				for (const cssFile of cssFiles) {
					let cssContent = fs.readFileSync(cssFile, "utf-8");
					const ttfPattern = new RegExp(
						`url\\(["']?/assets/font/${baseName}\\.ttf["']?\\)\\s*format\\(["']truetype["']\\)`,
						"g",
					);

					if (cssContent.match(ttfPattern)) {
						// 替换为 woff2 + ttf fallback
						cssContent = cssContent.replace(
							ttfPattern,
							`url("/assets/font/${file}") format("woff2"), url("/assets/font/${ttfFile}") format("truetype")`,
						);
						fs.writeFileSync(cssFile, cssContent);
						console.log(
							`✓ Updated CSS: ${cssFile} (${baseName} - woff2 fallback)`,
						);
					}
				}
			}
		}
	} catch (error) {
		console.error("⚠ CSS font reference update failed:", error.message);
		// 不退出，只是警告
	}
}
