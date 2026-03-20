import { visit } from "unist-util-visit";

function toClassNameList(value) {
	if (Array.isArray(value)) return value.filter(Boolean);
	if (typeof value === "string" && value) return [value];
	return [];
}

export function rehypeImageWidth(options = {}) {
	const regex = / w-([0-9]+)%/;
	const captionTemplate =
		typeof options?.text === "string" && options.text.trim()
			? options.text
			: "{alt}";

	function appendStyle(originStyle, styleChunk) {
		const base = typeof originStyle === "string" ? originStyle.trim() : "";
		if (!base) return styleChunk;
		if (base.endsWith(";")) return `${base} ${styleChunk}`;
		return `${base}; ${styleChunk}`;
	}

	function formatCaption(template, alt, index) {
		return String(template)
			.replaceAll("{alt}", alt)
			.replaceAll("{index}", String(index))
			.trim();
	}

	return (tree) => {
		let imageIndex = 0;
		visit(tree, "element", (node, index, parent) => {
			if (node.tagName !== "img") return;
			imageIndex += 1;
			node.properties = node.properties || {};

			const alt = String(node.properties.alt || "");
			const match = alt.match(regex);
			if (match) {
				const width = match[1];
				node.properties.alt = alt.replace(regex, "").trim();
				node.properties.style = appendStyle(
					node.properties.style,
					`width: ${width}%; display: block;`,
				);
				delete node.properties.width;
				delete node.properties.height;
			}

			const imageClassName = toClassNameList(node.properties.className);
			if (!imageClassName.includes("md-image")) {
				imageClassName.push("md-image");
			}
			node.properties.className = imageClassName;
			const altText = String(node.properties.alt || "").trim();
			const captionText = altText
				? formatCaption(captionTemplate, altText, imageIndex)
				: "";

			if (!parent || index === undefined) return;

			if (parent.tagName === "figure") {
				parent.properties = parent.properties || {};
				const figureClassName = toClassNameList(parent.properties.className);
				if (!figureClassName.includes("md-figure")) {
					figureClassName.push("md-figure");
				}
				parent.properties.className = figureClassName;

				const hasCaption = (parent.children || []).some((child) => {
					if (child?.type !== "element") return false;
					return child.tagName === "figcaption";
				});
				if (!hasCaption && captionText) {
					parent.children.push({
						type: "element",
						tagName: "figcaption",
						properties: { className: ["md-figcaption"] },
						children: [{ type: "text", value: captionText }],
					});
				}
				return;
			}

			const figureChildren = [node];
			if (captionText) {
				figureChildren.push({
					type: "element",
					tagName: "figcaption",
					properties: {
						className: ["md-figcaption"],
					},
					children: [{ type: "text", value: captionText }],
				});
			}

			parent.children[index] = {
				type: "element",
				tagName: "figure",
				properties: {
					className: ["md-figure"],
				},
				children: figureChildren,
			};
		});
		return tree;
	};
}
