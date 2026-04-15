import I18nKey from "./i18n/i18nKey";
import type {
	AnnouncementConfig,
	ClickEffectConfig,
	CommentConfig,
	ExpressiveCodeConfig,
	ExternalLinkConfirmConfig,
	FooterConfig,
	FullscreenWallpaperConfig,
	LicenseConfig,
	MusicPlayerConfig,
	NavBarConfig,
	PermalinkConfig,
	ProfileConfig,
	RandomPostsConfig,
	RelatedPostsConfig,
	SakuraConfig,
	ShareConfig,
	SidebarLayoutConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

export const clickEffectConfig: ClickEffectConfig = {
	enable: true, // 启用点击特效
	mobile: false, // 移动端默认关闭，避免触屏场景过于频繁
	blacklist: {
		paths: [], // "/about" 精确匹配，"/posts/" 匹配该前缀下所有页面
		selectors: [
			// "a",
			// "[data-no-click-effect]",
		],
	},
};

// 外链二次确认弹窗配置
export const externalLinkConfirmConfig: ExternalLinkConfirmConfig = {
	enable: true, // 是否启用外部链接确认功能
	title: "喂！要出站啦！",
	description: "要探险未知世界吗？目标地址是：",
	warningText: "外面的世界很危险，大灰狼出没警告！",
	confirmText: "我意已决",
	cancelText: "点错了",
	background:
		"https://api.nekosapi.com/v4/images/random/file?rating=suggestive&10",
	iconSvg: "/assets/icon/ExternLinkIcon.svg",
	// 白名单在src/data/ExternalLinkConfirm-data.ts文件中配置
	// whiteListSite: [],
	// whiteListPage: [],
};

// 定义站点语言
const SITE_LANG = "zh_CN"; // 语言代码，例如：'en', 'zh_CN', 'ja' 等。
const SITE_TIMEZONE = 8; //设置你的网站时区 from -12 to 12 default in UTC+8
export const siteConfig: SiteConfig = {
	title: "Ignorant",
	subtitle: "Ignorant's Blog",
	siteURL: "https://ignorant.top/", // 请替换为你的站点URL，以斜杠结尾
	siteStartDate: "2025-01-01", // 站点开始运行日期，用于站点统计组件计算运行天数

	timeZone: SITE_TIMEZONE,

	lang: SITE_LANG,

	themeColor: {
		hue: 180, // 主题色的默认色相，范围从 0 到 360。例如：红色：0，青色：200，蓝绿色：250，粉色：345
		fixed: false, // 对访问者隐藏主题色选择器
	},

	// 特色页面开关配置（关闭未使用的页面有助于提升 SEO，关闭后请记得在 navbarConfig 中移除对应链接）
	featurePages: {
		anime: true, // 番剧页面开关
		diary: true, // 日记页面开关
		friends: true, // 友链页面开关
		navigation: true, // 导航页面开关
		news: true, // 新闻页面开关
		projects: true, // 项目页面开关
		skills: true, // 技能页面开关
		timeline: true, // 时间线页面开关
		albums: true, // 相册页面开关
		devices: true, // 设备页面开关
	},

	diary: {
		// 日记数据源：
		// - "json" -> src/data/diary-data.json
		// - "md" -> src/content/diary/*.md
		dataSource: "md", // "json" | "md"
		pageSize: 3, // 日记分页大小
	},

	news: {
		mode: "online", // 新闻页面模式："online" 在线模式，使用在线RSS源；"local" 本地模式，使用本地构筑时拉取的RSS源新闻
		title: "时语",
		subtitle: "倾听世界之声",
		initialVisible: 5,
		loadMoreStep: 3,
		feeds: [
			// {
			// 	id: "zaobao-china",
			// 	name: "联合早报 · 中国",
			// 	url: "https://rss.ssr.ddns-ip.net/rss?source=zaobao-china",
			// },
			// {
			// 	id: "zaobao-world",
			// 	name: "联合早报 · 国际",
			// 	url: "https://rss.ssr.ddns-ip.net/rss?source=zaobao-world",
			// },
			{
				id: "csdn-geeknews",
				name: "CSDN · 极客日报",
				url: "https://rss.ssr.ddns-ip.net/rss?source=csdn-geeknews",
			},
			// {
			// 	id: "bilibili-hot",
			// 	name: "bilibili 排行榜 · 全站",
			// 	url: "https://rss.ssr.ddns-ip.net/rss?source=bilibili-hot",
			// },
		],
	},

	pagination: {
		visiblePages: {
			mobile: 3, // 移动端分页条显示页码数量
			desktop: 5, // 桌面端分页条显示页码数量
		},
	},

	// 顶栏标题配置
	navbarTitle: {
		// 显示模式："text-icon" 显示图标+文本，"logo" 仅显示Logo
		mode: "logo",
		// 顶栏标题文本
		text: "Ignorant",
		// 顶栏标题图标路径，默认使用 public/assets/home/home.webp
		icon: "assets/home/home.webp",
		// 网站Logo图片路径
		logo: "assets/home/default-logo.webp",
	},

	// 页面自动缩放配置
	pageScaling: {
		enable: true, // 是否开启自动缩放
		targetWidth: 2000, // 目标宽度，低于此宽度时开始缩放
	},

	bangumi: {
		userId: "1204025", // 在此处设置你的Bangumi用户ID，可以设置为 "sai" 测试
		fetchOnDev: true, // 是否在开发环境下获取 Bangumi 数据（默认 false），获取前先执行 pnpm build 构建 json 文件
	},

	bilibili: {
		vmid: "2063167092", // 在此处设置你的Bilibili用户ID (uid)，例如 "1129280784"
		fetchOnDev: true, // 是否在开发环境下获取 Bilibili 数据（默认 false）
		coverMirror: "", // 封面图片镜像源（可选，如果需要使用镜像源，例如 "https://images.weserv.nl/?url="）
		useWebp: true, // 是否使用WebP格式（默认 true）

		// bilibili 观看进度配置说明(可选，如需配置仔细阅读):
		// 1. 本地开发：请在 .env 文件中填写 BILI_SESSDATA=your_SESSDATA
		// 2. 远程构建：请在 GitHub 仓库 Settings -> Secrets 中添加 BILI_SESSDATA
		// 注意：SESSDATA 为账号凭证，为防止泄露，切记不可使用硬编码。
		// 安全提示：如 SESSDATA 已泄露，请打开 B站手机端 —— 我的 —— 设置 —— 安全隐私 —— 登陆设备管理 —— 一键退登，销毁已泄露的账号凭证
	},

	anime: {
		mode: "bangumi", // 番剧页面模式："bangumi" 使用Bangumi API，"local" 使用本地配置，"bilibili" 使用Bilibili API
	},

	// 文章列表布局配置
	postListLayout: {
		// 默认布局模式："list" 列表模式（单列布局），"grid" 网格模式（双列布局）
		// 注意：如果侧边栏配置启用了"both"双侧边栏，则无法使用文章列表"grid"网格（双列）布局
		defaultMode: "list",
		// 是否允许用户切换布局
		allowSwitch: false,
		// 首页文章分页大小
		pageSize: 8,
		// 文章列表页分类导航条配置
		categoryBar: {
			enable: true, // 是否在文章列表页显示分类导航条
		},
	},

	// 标签样式配置
	tagStyle: {
		// 是否使用新样式（悬停高亮样式）还是旧样式（外框常亮样式）
		useNewStyle: false,
	},

	// 壁纸模式配置
	wallpaperMode: {
		// 默认壁纸模式：banner=顶部横幅，fullscreen=全屏壁纸，none=无壁纸
		defaultMode: "banner",
		// 整体布局方案切换按钮显示设置（默认："desktop"）
		// "off" = 不显示
		// "mobile" = 仅在移动端显示
		// "desktop" = 仅在桌面端显示
		// "both" = 在所有设备上显示
		showModeSwitchOnMobile: "desktop",
	},

	banner: {
		// 支持单张图片或图片数组，当数组长度 > 1 时自动启用轮播
		src: {
			desktop: [
				"/assets/desktop-banner/1.webp",
				"/assets/desktop-banner/2.webp",
				"/assets/desktop-banner/3.webp",
				"/assets/desktop-banner/4.webp",
			], // 桌面横幅图片
			mobile: [
				"/assets/mobile-banner/1.webp",
				"/assets/mobile-banner/2.webp",
				"/assets/mobile-banner/3.webp",
				"/assets/mobile-banner/4.webp",
			], // 移动横幅图片
		}, // 使用本地横幅图片

		position: "center", // 等同于 object-position，仅支持 'top', 'center', 'bottom'。默认为 'center'

		carousel: {
			enable: true, // 为 true 时：为多张图片启用轮播。为 false 时：从数组中随机显示一张图片
			interval: 3, // 轮播间隔时间（秒）
		},

		waves: {
			enable: true, // 是否启用水波纹效果（注意：此功能性能开销较大）
			performanceMode: true, // 性能模式：减少动画复杂度(性能提升40%)
			mobileDisable: false, // 移动端禁用
		},

		// PicFlow API支持(智能图片API)
		imageApi: {
			enable: false, // 启用图片API
			url: "http://domain.com/api_v2.php?format=text&count=4", // API地址，返回每行一个图片链接的文本
		},
		// 这里需要使用PicFlow API的Text返回类型,所以我们需要format=text参数
		// 项目地址:https://github.com/matsuzaka-yuki/PicFlow-API
		// 请自行搭建API

		homeText: {
			enable: true, // 在主页显示自定义文本
			title: "精神の隅", // 主页横幅主标题

			subtitle: [
				"说好从今以后都牵着手，因为要走很远",
				"在这亭台回眸千年后，忆起你是谁，只消月色隐约便足以勾勒这是非",
				"达拉崩吧斑得贝迪卜多比鲁翁",
				"选贤臣，任能将，覆江东云雨，尽风流",
				"还有我，陪你在雨里放肆奔跑啊。地球上，天空下，我们做一对傻瓜",
			],
			typewriter: {
				enable: true, // 启用副标题打字机效果

				speed: 100, // 打字速度（毫秒）
				deleteSpeed: 50, // 删除速度（毫秒）
				pauseTime: 2000, // 完全显示后的暂停时间（毫秒）
			},
		},

		credit: {
			enable: false, // 显示横幅图片来源文本

			text: "Describe", // 要显示的来源文本
			url: "", // （可选）原始艺术品或艺术家页面的 URL 链接
		},

		navbar: {
			transparentMode: "semifull", // 导航栏透明模式："semi" 半透明加圆角，"full" 完全透明，"semifull" 动态透明
		},
	},
	toc: {
		enable: true, // 总开关，启用目录功能
		mobileTop: false, // 手机端顶部 TOC 按钮
		desktopSidebar: true, // 电脑端右侧边栏 TOC
		floating: true, // 悬浮 TOC 按钮
		depth: 2, // 目录深度，1-6，1 表示只显示 h1 标题，2 表示显示 h1 和 h2 标题，依此类推
		useJapaneseBadge: true, // 使用日语假名标记（あいうえお...）代替数字，开启后会将 1、2、3... 改为 あ、い、う...
	},
	showCoverInContent: true, // 在文章内容页显示文章封面
	generateOgImages: false, // 启用生成OpenGraph图片功能,注意开启后要渲染很长时间，不建议本地调试的时候开启
	favicon: [
		// 留空以使用默认 favicon
		// {
		//   src: '/favicon/icon.png',    // 图标文件路径
		//   theme: 'light',              // 可选，指定主题 'light' | 'dark'
		//   sizes: '32x32',              // 可选，图标大小
		// }
	],

	// 字体配置
	font: {
		// 注意：自定义字体需要在 src/styles/main.css 中引入字体文件
		// 注意：字体子集优化功能目前仅支持 TTF 格式字体,开启后需要在生产环境才能看到效果,在Dev环境下显示的是浏览器默认字体!
		asciiFont: {
			// 英文字体 - 优先级最高
			// 指定为英文字体则无论字体包含多大范围，都只会保留 ASCII 字符子集
			fontFamily: "ZenMaruGothic-Medium",
			fontWeight: "400",
			localFonts: ["ZenMaruGothic-Medium.ttf"],
			enableCompress: true, // 启用字体子集优化，减少字体文件大小
		},
		cjkFont: {
			// 中日韩字体 - 作为回退字体
			fontFamily: "萝莉体 第二版",
			fontWeight: "500",
			localFonts: ["loli.ttf"],
			enableCompress: true, // 启用字体子集优化，减少字体文件大小
		},
		blacklist: {
			// 黑名单中的选择器将回退到系统字体，不使用全局自定义字体
			selectors: [
				".tk-comments-container", // Twikoo 评论区
				".news-card", // 新闻卡片
			],
		},
	},
	showLastModified: true, // 控制"上次编辑"卡片显示的开关
	pageProgressBar: {
		enable: true, // 启用页面顶部进度条
		height: 3, // 进度条高度 3px
		duration: 6000, // 动画时长 6s
	},
	clickEffect: clickEffectConfig,

	thirdPartyAnalytics: {
		enable: false, // 是否启用第三方统计（Microsoft Clarity），默认关闭，启用可能影响 Lighthouse 评分
		clarityId: "", // Clarity 项目 ID
	},
};
export const fullscreenWallpaperConfig: FullscreenWallpaperConfig = {
	src: {
		desktop: [
			"/assets/desktop-banner/1.webp",
			"/assets/desktop-banner/2.webp",
			"/assets/desktop-banner/3.webp",
			"/assets/desktop-banner/4.webp",
		], // 桌面横幅图片
		mobile: [
			"/assets/mobile-banner/1.webp",
			"/assets/mobile-banner/2.webp",
			"/assets/mobile-banner/3.webp",
			"/assets/mobile-banner/4.webp",
		], // 移动横幅图片
	}, // 使用本地横幅图片
	position: "center", // 壁纸位置，等同于 object-position
	carousel: {
		enable: true, // 启用轮播
		interval: 5, // 轮播间隔时间（秒）
	},
	zIndex: -1, // 层级，确保壁纸在背景层
	opacity: 0.8, // 壁纸透明度
	blur: 1, // 背景模糊程度
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		LinkPreset.Diary,
		{
			name: "私馆",
			nameKey: I18nKey.navMy,
			url: "/content/",
			icon: "material-symbols:person",
			children: [
				{
					name: "追光",
					nameKey: I18nKey.albums,
					url: "/albums/",
					icon: "material-symbols:photo-library",
				},
				{
					name: "逐影",
					nameKey: I18nKey.anime,
					url: "/anime/",
					icon: "material-symbols:movie",
				},
				{
					name: "铸器",
					url: "/projects/",
					icon: "material-symbols:exercise",
				},
				// {
				// 	name: "物志",
				// 	nameKey: I18nKey.devices,
				// 	url: "/devices/",
				// 	icon: "material-symbols:devices",
				// 	external: false,
				// },
			],
		},
		{
			name: "About",
			url: "/content/",
			icon: "material-symbols:info",
			children: [
				{
					name: "关于",
					url: "/about/",
					icon: "material-symbols:person",
				},
				{
					name: "Friends",
					url: "/friends/",
					icon: "material-symbols:group",
				},
				{
					name: "荟萃",
					nameKey: I18nKey.collection,
					url: "/collection/",
					icon: "material-symbols:work",
				},
			],
		},
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "assets/images/avatar.webp", // 相对于 /src 目录。如果以 '/' 开头，则相对于 /public 目录
	avatarFrame: {
		enable: true,
		image: "assets/images/avatar_frame_profile_01.webp",
		scale: 1.2,
		offsetX: -2,
		offsetY: 2,
	},
	name: "北に向かう",
	bio: "孩儿立志出乡关，学不成名誓不还",
	typewriter: {
		enable: true, // 启用个人简介打字机效果
		speed: 80, // 打字速度（毫秒）
	},
	links: [
		{
			name: "GitHub",
			icon: "fa7-brands:github",
			url: "https://github.com/Ignorant12321",
		},
		{
			name: "Bilibili",
			icon: "fa7-brands:bilibili",
			url: "https://space.bilibili.com/2063167092",
		},
		{
			name: "Steam",
			icon: "fa7-brands:steam",
			url: "https://steamcommunity.com/profiles/76561199543339625/",
		},
		{
			name: "Gitee",
			icon: "simple-icons:gitee",
			url: "https://gitee.com/ignorantand",
		},
		{
			name: "Gravatar",
			icon: "simple-icons:gravatar",
			url: "https://gravatar.com/ignorant12321",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

// Permalink 固定链接配置
export const permalinkConfig: PermalinkConfig = {
	enable: false, // 是否启用全局 permalink 功能，关闭时使用默认的文件名作为链接
	/**
	 * permalink 格式模板
	 * 支持的占位符：
	 * - %year% : 4位年份 (2024)
	 * - %monthnum% : 2位月份 (01-12)
	 * - %day% : 2位日期 (01-31)
	 * - %hour% : 2位小时 (00-23)
	 * - %minute% : 2位分钟 (00-59)
	 * - %second% : 2位秒数 (00-59)
	 * - %post_id% : 文章序号（按发布时间升序排列，最早的文章为1）
	 * - %postname% : 文章文件名（slug，通常为全小写）
	 * - %raw_postname% : 文章原始文件名（保留大小写）
	 * - %category% : 分类名（无分类时为 "uncategorized"）
	 *
	 * 示例：
	 * - "%year%-%monthnum%-%postname%" => "/2024-12-my-post/"
	 * - "%post_id%-%postname%" => "/42-my-post/"
	 * - "%category%-%postname%" => "/tech-my-post/"
	 * - "%year%/%monthnum%/%day%/%postname%" => "/2024/12/01/my-post/"
	 *
	 * 注意：支持使用斜杠 "/" 构建嵌套路径。
	 */
	format: "%postname%", // 默认使用文件名
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// 注意：某些样式（如背景颜色）已被覆盖，请参阅 astro.config.mjs 文件。
	// 请选择深色主题，因为此博客主题目前仅支持深色背景
	theme: "github-dark",
	// 是否在主题切换时隐藏代码块以避免卡顿问题
	hideDuringThemeTransition: true,
};

export const commentConfig: CommentConfig = {
	enable: true, // 启用评论功能。当设置为 false 时，评论组件将不会显示在文章区域。
	system: "twikoo", // 评论系统选择: "twikoo" | "giscus"
	twikoo: {
		envId: "https://twikoo-vercel-01.ignorant.top",
		lang: SITE_LANG,
	},
	giscus: {
		repo: "Ignorant12321/giscus-comment",
		repoId: "R_kgDOR4juSQ",
		category: "Announcements",
		categoryId: "Blog Comments",
		mapping: "pathname",
		strict: "0",
		reactionsEnabled: "1",
		emitMetadata: "0",
		inputPosition: "top",
		theme: "preferred_color_scheme",
		lang: SITE_LANG,
		loading: "lazy",
	},
};

export const shareConfig: ShareConfig = {
	enable: true, // 启用分享功能
	avatarFrame: {
		enable: true,
		image: "assets/images/avatar_frame_share_01.webp",
		scale: 1.1,
		offsetX: 0,
		offsetY: 5,
	},
};

export const announcementConfig: AnnouncementConfig = {
	title: "公告栏",
	placeholder: {
		latest: {
			text: "太棒了，您已读完所有公告！",
			icon: "fa7-solid:face-smile-wink",
		},
		history: {
			text: "空空如也，暂无历史记录",
			icon: "fa7-solid:box-open",
		},
	},
	closable: true, // 允许用户关闭公告
	itemsPerPage: 1,
};

export const musicPlayerConfig: MusicPlayerConfig = {
	enable: true, // 启用音乐播放器功能
	showFloatingPlayer: true, // 显示悬浮播放器 UI
	floatingEntryMode: "fab", // 悬浮入口模式："default" 为独立悬浮播放器，"fab" 为集成到通用 FAB 组
	playlists: [
		{
			name: "洛天依",
			mode: "meting",
			meting_api:
				// "https://api.injahow.cn/meting/?server=:server&type=:type&id=:id&auth=:auth&r=:r",
				"https://meting.mysqil.com/api?server=:server&type=:type&id=:id&auth=:auth&r=:r",
			server: "netease",
			type: "playlist",
			id: "17699694803",
		},
		{
			name: "游四方",
			mode: "meting",
			meting_api:
				"https://api.qijieya.cn/meting/?server=:server&type=:type&id=:id&auth=:auth&r=:r",
			server: "netease",
			type: "playlist",
			id: "17699636947",
		},
		// {
		// 	name: "本地",
		// 	mode: "local",
		// },
	],
};

export const footerConfig: FooterConfig = {
	enable: true, // 是否启用Footer HTML注入功能
	customHtml: "", // HTML格式的自定义页脚信息，例如备案号等，默认留空
	// 也可以直接编辑 FooterConfig.html 文件来添加备案号等自定义内容
	// 注意：若 customHtml 不为空，则使用 customHtml 中的内容；若 customHtml 留空，则使用 FooterConfig.html 文件中的内容
	// FooterConfig.html 可能会在未来的某个版本弃用
};

/**
 * 侧边栏布局配置
 * 用于控制侧边栏组件的显示、排序、动画和响应式行为
 * sidebar: 控制组件所在的侧边栏（left 或 right）。注意：移动端通常不显示右侧栏内容。若组件设置在 right，请确保 layout.position 为 "both"。
 */
export const sidebarLayoutConfig: SidebarLayoutConfig = {
	// 侧边栏组件属性配置列表
	properties: [
		{
			// 组件类型：用户资料组件
			type: "profile",
			// 组件位置："top" 表示固定在顶部
			position: "top",
			// CSS 类名，用于应用样式和动画
			class: "onload-animation",
			// 动画延迟时间（毫秒），用于错开动画效果
			animationDelay: 0,
		},
		{
			// 组件类型：公告组件
			type: "announcement",
			// 组件位置："top" 表示固定在顶部
			position: "top",
			// CSS 类名
			class: "onload-animation",
			// 动画延迟时间
			animationDelay: 50,
		},
		{
			// 组件类型：侧栏音乐组件
			type: "music-sidebar",
			position: "sticky",
			class: "onload-animation",
			animationDelay: 100,
		},
		{
			// 组件类型：分类组件
			type: "categories",
			// 组件位置："sticky" 表示粘性定位，可滚动
			position: "top",
			// CSS 类名
			class: "onload-animation",
			// 动画延迟时间
			animationDelay: 150,
			// 响应式配置
			responsive: {
				// 折叠阈值：当分类数量超过5个时自动折叠
				collapseThreshold: 5,
			},
		},
		{
			// 组件类型：标签组件
			type: "tags",
			// 组件位置："sticky" 表示粘性定位
			position: "top",
			// CSS 类名
			class: "onload-animation",
			// 动画延迟时间
			animationDelay: 250,
			// 响应式配置
			responsive: {
				// 折叠阈值：当标签数量超过20个时自动折叠
				collapseThreshold: 20,
			},
		},
		{
			// 组件类型：卡片式目录组件
			type: "card-toc",
			// 组件位置
			position: "sticky",
			// CSS 类名
			class: "onload-animation",
			// 动画延迟时间
			animationDelay: 200,
		},
		{
			// 组件类型：站点统计组件
			type: "site-stats",
			// 组件位置
			position: "top",
			// CSS 类名
			class: "onload-animation",
			// 动画延迟时间
			animationDelay: 200,
		},
		{
			// 组件类型：日历组件(移动端不显示)
			type: "calendar",
			// 组件位置
			position: "top",
			// CSS 类名
			class: "onload-animation",
			// 动画延迟时间
			animationDelay: 250,
		},
	],

	// 侧栏组件布局配置
	components: {
		left: ["profile", "announcement", "tags", "card-toc"],
		right: ["site-stats", "calendar", "categories", "music-sidebar"],
		drawer: [
			"profile",
			"announcement",
			"music-sidebar",
			"categories",
			"tags",
		],
	},

	// 默认动画配置
	defaultAnimation: {
		// 是否启用默认动画
		enable: true,
		// 基础延迟时间（毫秒）
		baseDelay: 0,
		// 递增延迟时间（毫秒），每个组件依次增加的延迟
		increment: 50,
	},

	// 响应式布局配置
	responsive: {
		// 断点配置（像素值）
		breakpoints: {
			// 移动端断点：屏幕宽度小于768px
			mobile: 768,
			// 平板端断点：屏幕宽度小于1280px
			tablet: 1280,
			// 桌面端断点：屏幕宽度大于等于1280px
			desktop: 1280,
		},
	},
};

export const sakuraConfig: SakuraConfig = {
	enable: false, // 默认关闭樱花特效
	mobile: true, // 移动端启用
	sakuraNum: 21, // 樱花数量
	limitTimes: -1, // 樱花越界限制次数，-1为无限循环
	size: {
		min: 0.5, // 樱花最小尺寸倍数
		max: 1.1, // 樱花最大尺寸倍数
	},
	opacity: {
		min: 0.3, // 樱花最小不透明度
		max: 0.9, // 樱花最大不透明度
	},
	speed: {
		horizontal: {
			min: -1.7, // 水平移动速度最小值
			max: -1.2, // 水平移动速度最大值
		},
		vertical: {
			min: 1.5, // 垂直移动速度最小值
			max: 2.2, // 垂直移动速度最大值
		},
		rotation: 0.03, // 旋转速度
		fadeSpeed: 0.03, // 消失速度，不应大于最小不透明度
	},
	zIndex: 100, // 层级，确保樱花在合适的层级显示
};

// Live2D 看板娘配置
export const live2dConfig = {
	enable: true,
	mobile: true,
	drag: false,
	logLevel: "warn",
	modelId: 2, // 初始模型 ID（仅在 localStorage 没有 modelId 时生效；当前对应 HyperdimensionNeptunia）
	modelTexturesId: 17, // 初始外观/变体 ID（仅在 localStorage 没有 modelTexturesId 时生效；当前对应 vert_classic）
	tools: [
		// "home",
		"hitokoto",
		// "asteroids",
		"switch-model",
		"switch-texture",
		"photo",
		"quit",
	],
	paths: {
		waifuCss: "/assets/live2d/waifu.css", // Live2D 样式文件（对应：src/layouts/Layout.astro）
		waifuTipsJs: "/assets/live2d/waifu-tips.js", // Live2D 主脚本（对应：src/components/features/live2d/Live2D.svelte）
		waifuTipsJson: "/assets/live2d/waifu-tips.json", // 提示词与模型清单（对应：src/components/features/live2d/Live2D.svelte -> waifuPath）
		cubism2Core: "/assets/live2d/live2d.min.js", // Cubism2 内核（对应：src/components/features/live2d/Live2D.svelte -> cubism2Path）
		cubism5Core:
			"https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js", // Cubism5 内核（对应：src/components/features/live2d/Live2D.svelte -> cubism5Path）
		// cdnPath: "https://cdn.jsdelivr.net/gh/fghrsh/live2d_api/", // 模型 CDN 根路径（对应：src/components/features/live2d/Live2D.svelte -> cdnPath）。默认留空，可直接注释此行保持本地/JSON 模式。
		// 优先级：cdnPath 非空时，模型走 CDN 的 model_list.json；
		// 否则走 waifuTipsJson 内 models[].model + models[].textures，
		// 或 models[].variants[].model + models[].variants[].textures。
		// 注意：waifuTipsJson 的提示词/交互文案始终生效，不受 cdnPath 影响。
		// 本地真皮肤格式示例：
		// { model: "/assets/live2d/models/Pio/index.json", textures: ["textures/default.png", "textures/maid.png"] }
		// 本地角色变体示例：
		// { name: "Shizuku", variants: [{ name: "48", model: "/assets/live2d/models/ShizukuTalk/shizuku-48/index.json" }, { name: "Pajama", model: "/assets/live2d/models/ShizukuTalk/shizuku-pajama/index.json" }] }
		// 衣服切换说明：modelTexturesId 由 localStorage 优先；本地模式下它表示当前角色内的“外观索引”（可对应皮肤或变体）。
		// live2d(2)      // 当前模型切到皮肤 2
		// live2d(5, 3)   // 切到模型 5 + 皮肤 3
	},
	position: {
		desktop: {
			side: "left",
			offset: "1rem",
			bottom: "0",
			scale: 1, // 基于 300x300 的桌面端缩放比例
		},
		mobile: {
			side: "left",
			offset: "0.5rem",
			bottom: "0",
			scale: 0.75, // 基于 300x300 的移动端缩放比例
		},
	},
} as const;

// 相关文章配置
export const relatedPostsConfig: RelatedPostsConfig = {
	enable: true,
	maxCount: 5,
};

// 随机文章配置
export const randomPostsConfig: RandomPostsConfig = {
	enable: true,
	maxCount: 5,
};

// 导出所有配置的统一接口
export const widgetConfigs = {
	profile: profileConfig,
	announcement: announcementConfig,
	music: musicPlayerConfig,
	layout: sidebarLayoutConfig,
	sakura: sakuraConfig,
	fullscreenWallpaper: fullscreenWallpaperConfig,
	live2d: live2dConfig,
	share: shareConfig,
	relatedPosts: relatedPostsConfig,
	randomPosts: randomPostsConfig,
} as const;

// umamiConfig相关配置已移动至astro.config.mjs中,统计脚本请自行在Layout.astro文件的<head>中插入
