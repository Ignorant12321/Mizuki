import type { AnnouncementItem } from "src/types/config";

export const announcements: AnnouncementItem[] = [
	{
		id: "notice-001",
		title: "佳讯：",
		icon: "🎉",
		pinned: true,
		order: 1,
		// 使用 nowrap 确保文字与徽标在同一行不换行
		content: `<div style="white-space: nowrap; display: flex; align-items: center;">
            <span>本网站已接入</span>
            <a href="https://deepwiki.com/Ignorant12321/Mizuki" target="_blank" style="display: inline-flex; margin-left: 4px;">
                <img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki" style="height: 20px; vertical-align: middle;">
            </a>
        </div>`,
		date: "2026-02-12",
		closable: true,
		link: {
			enable: true,
			text: "立即体验",
			url: "https://deepwiki.com/Ignorant12321/Mizuki",
			external: true,
		},
	},
	{
		id: "json-notice-002",
		title: "系统维护通知",
		// 精简后的主题色 SVG
		icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor"><path d="M949.418667 902.186667l-223.317334-223.274667 205.994667-206.805333a34.432 34.432 0 0 0-2.816-50.986667 360.661333 360.661333 0 0 0-338.474667-61.824L376.405333 189.312a191.146667 191.146667 0 0 0-30.592-110.08 33.450667 33.450667 0 0 0-51.626666-5.333333l-219.392 218.88a33.365333 33.365333 0 0 0 5.205333 51.626666c33.408 21.674667 72.106667 32 110.506667 30.805334l169.984 214.4a360.832 360.832 0 0 0 62.72 339.626666c12.885333 15.786667 36.608 17.066667 50.986666 2.56l205.994667-206.805333 223.189333 223.189333a32.554667 32.554667 0 1 0 45.994667-45.994666z"/></svg>`,
		pinned: true,
		order: 3,
		closable: false,
		content: `<div style="line-height: 1.6;">
            <span>&nbsp;&nbsp;为了提供更稳定安全的服务，本站将于每日实行夜间安全维护，在此期间服务将暂时关闭，感谢您的理解。</span><br>
            <div style="text-align: center;">
            <span style="color: #211a62;">维护时段：</span>
            <span style="color: #ff4d4f; font-weight: bold;">00:00</span> 至 <span style="color: #52c41a; font-weight: bold;">08:00</span></div>
        </div>`,
		date: "2026-02-13",
		link: {
			enable: false,
			text: "",
			url: "",
			external: false,
		},
	},
];
