import type {
	AnnouncementConfig,
	CommentConfig,
	ExpressiveCodeConfig,
	FooterConfig,
	FullscreenWallpaperConfig,
	LicenseConfig,
	MusicPlayerConfig,
	NavBarConfig,
	PermalinkConfig,
	ProfileConfig,
	Live2DConfig,
	SakuraConfig,
	ShareConfig,
	SidebarLayoutConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

// 移除i18n导入以避免循环依赖

// 定义站点语言
const SITE_LANG = "zh_CN"; // 语言代码，例如：'en', 'zh_CN', 'ja' 等。
const SITE_TIMEZONE = 8; //设置你的网站时区 from -12 to 12 default in UTC+8
export const siteConfig: SiteConfig = {
	title: "Ignorant's Blog",
	subtitle: "Ignorant 的个人博客",
	siteURL: "https://218501.xyz/", // 请替换为你的站点URL，以斜杠结尾
	siteStartDate: "2026-01-01", // 站点开始运行日期，用于站点统计组件计算运行天数

	timeZone: SITE_TIMEZONE,

	lang: SITE_LANG,

	themeColor: {
		hue: 90, // 主题色的默认色相，范围从 0 到 360。例如：红色：0，青色：200，蓝绿色：250，粉色：345
		fixed: false, // 对访问者隐藏主题色选择器
	},

	// 特色页面开关配置（关闭未使用的页面有助于提升 SEO，关闭后请记得在 navbarConfig 中移除对应链接）
	featurePages: {
		anime: true, // 番剧页面开关
		diary: true, // 日记页面开关
		friends: true, // 友链页面开关
		projects: false, // 项目页面开关
		skills: false, // 技能页面开关
		timeline: false, // 时间线页面开关
		albums: true, // 相册页面开关
		devices: true, // 设备页面开关
	},

	// 顶栏标题配置
	navbarTitle: {
		// 显示模式："text-icon" 显示图标+文本，"logo" 仅显示Logo
		mode: "logo",
		// 顶栏标题文本
		text: "Ignorant",
		// 顶栏标题图标路径，默认使用 public/assets/home/home.png
		icon: "assets/home/home.png",
		// 网站Logo图片路径
		logo: "assets/home/default-logo.png",
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
		vmid: "2063167092", // 在此处设置你的Bilibili用户ID (vmid)，例如 "1129280784"
		fetchOnDev: true, // 是否在开发环境下获取 Bilibili 数据（默认 false）
		SESSDATA: "", // Bilibili SESSDATA（可选，用于获取观看进度，从浏览器cookie中获取）
		coverMirror: "", // 封面图片镜像源（可选，如果需要使用镜像源，例如 "https://images.weserv.nl/?url="）
		useWebp: true, // 是否使用WebP格式（默认 true）
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
		allowSwitch: true,
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
				"/assets/desktop-banner/1d.webp",
				"/assets/desktop-banner/2d.webp",
				"/assets/desktop-banner/3d.webp",
				"/assets/desktop-banner/4d.webp",
				"/assets/desktop-banner/5d.webp",
				"/assets/desktop-banner/6d.webp",
				"/assets/desktop-banner/7d.webp",
				"/assets/desktop-banner/8d.webp",
				"/assets/desktop-banner/9d.webp",
				"/assets/desktop-banner/10d.webp",
				"/assets/desktop-banner/11d.webp",
				"/assets/desktop-banner/12d.webp",
			], // 桌面横幅图片
			mobile: [
				"/assets/mobile-banner/1m.webp",
				"/assets/mobile-banner/2m.webp",
				"/assets/mobile-banner/3m.webp",
				"/assets/mobile-banner/4m.webp",
				"/assets/mobile-banner/5m.webp",
				"/assets/mobile-banner/6m.webp",
				"/assets/mobile-banner/7m.webp",
				"/assets/mobile-banner/8m.webp",
				"/assets/mobile-banner/9m.webp",
				"/assets/mobile-banner/10m.webp",
				"/assets/mobile-banner/11m.webp",
				"/assets/mobile-banner/12m.webp",
			], // 移动横幅图片
		}, // 使用本地横幅图片

		position: "center", // 等同于 object-position，仅支持 'top', 'center', 'bottom'。默认为 'center'

		carousel: {
			enable: true, // 为 true 时：为多张图片启用轮播。为 false 时：从数组中随机显示一张图片
			interval: 4.5, // 轮播间隔时间（秒）
		},

		waves: {
			enable: true, // 是否启用水波纹效果（注意：此功能性能开销较大）
			performanceMode: false, // 性能模式：减少动画复杂度(性能提升40%)
			mobileDisable: true, // 移动端禁用
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
		enable: true, // 启用目录功能
		mode: "float", // 目录显示模式："float" 悬浮按钮模式，"sidebar" 侧边栏模式
		depth: 2, // 目录深度，1-6，1 表示只显示 h1 标题，2 表示显示 h1 和 h2 标题，依此类推
		useJapaneseBadge: true, // 使用日语假名标记（あいうえお...）代替数字，开启后会将 1、2、3... 改为 あ、い、う...
	},
	showCoverInContent: true, // 在文章内容页显示文章封面
	generateOgImages: true, // 启用生成OpenGraph图片功能,注意开启后要渲染很长时间，不建议本地调试的时候开启
	favicon: [
		// 留空以使用默认 favicon
		{
			src: "/favicon/favicon.ico", // 图标文件路径
			// src: "/favicon/favicon2.ico", // 图标文件路径
			//   theme: 'light',              // 可选，指定主题 'light' | 'dark'
			//   sizes: '32x32',              // 可选，图标大小
		},
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
			localFonts: ["萝莉体 第二版.ttf"],
			enableCompress: true, // 启用字体子集优化，减少字体文件大小
		},
	},
	showLastModified: true, // 控制“上次编辑”卡片显示的开关
};
export const fullscreenWallpaperConfig: FullscreenWallpaperConfig = {
	src: {
		desktop: [
			"/assets/desktop-banner/1d.webp",
			"/assets/desktop-banner/2d.webp",
			"/assets/desktop-banner/3d.webp",
			"/assets/desktop-banner/4d.webp",
			"/assets/desktop-banner/5d.webp",
			"/assets/desktop-banner/6d.webp",
			"/assets/desktop-banner/7d.webp",
			"/assets/desktop-banner/8d.webp",
			"/assets/desktop-banner/9d.webp",
			"/assets/desktop-banner/10d.webp",
			"/assets/desktop-banner/11d.webp",
			"/assets/desktop-banner/12d.webp",
		], // 桌面横幅图片
		mobile: [
			"/assets/mobile-banner/1m.webp",
			"/assets/mobile-banner/2m.webp",
			"/assets/mobile-banner/3m.webp",
			"/assets/mobile-banner/4m.webp",
			"/assets/mobile-banner/5m.webp",
			"/assets/mobile-banner/6m.webp",
			"/assets/mobile-banner/7m.webp",
			"/assets/mobile-banner/8m.webp",
			"/assets/mobile-banner/9m.webp",
			"/assets/mobile-banner/10m.webp",
			"/assets/mobile-banner/11m.webp",
			"/assets/mobile-banner/12m.webp",
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
		{
			name: "器录",
			url: "/#/",
			icon: "material-symbols:service-toolbox",
			children: [
				{
					name: "时语",
					url: "/news/",
					icon: "material-symbols:rss-feed",
				},
				{
					name: "寄驿",
					url: "https://delivery.218501.xyz",
					external: true,
					icon: "material-symbols:moped-package-outline",
				},
				{
					name: "观流",
					url: "https://cloud.umami.is/share/kBYtuya0KQCIaPH3",
					external: true,
					icon: "material-symbols:monitor-heart-outline-rounded",
				},
			],
		},
		{
			name: "My",
			url: "/content/",
			icon: "material-symbols:person",
			children: [
				{
					name: "Gallery",
					url: "/albums/",
					icon: "material-symbols:photo-library",
				},
				{
					name: "Anime",
					url: "/anime/",
					icon: "material-symbols:movie",
				},
				{
					name: "Diary",
					url: "/diary/",
					icon: "material-symbols:book",
				},
				{
					name: "Devices",
					url: "devices/",
					icon: "material-symbols:devices",
					external: false,
				},
			],
		},
		// {
		// 	name: "Others",
		// 	url: "#",
		// 	icon: "material-symbols:more-rounded",
		// 	children: [
		// 		{
		// 			name: "Timeline",
		// 			url: "/timeline/",
		// 			icon: "material-symbols:timeline",
		// 		},
		// 		{
		// 			name: "Projects",
		// 			url: "/projects/",
		// 			icon: "material-symbols:work",
		// 		},
		// 		{
		// 			name: "Skills",
		// 			url: "/skills/",
		// 			icon: "material-symbols:psychology",
		// 		},
		// 	],
		// },
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
			],
		},
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "assets/images/lty.webp", // 相对于 /src 目录。如果以 '/' 开头，则相对于 /public 目录
	avatarFrame: "assets/images/avatarFrame.png",
	name: "北に向かう",
	bio: "世界は大きい、君は行かなければならない",
	typewriter: {
		enable: true, // 启用个人简介打字机效果
		speed: 80, // 打字速度（毫秒）
	},
	links: [
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/Ignorant12321",
		},
		{
			name: "Bilibili",
			icon: "fa6-brands:bilibili",
			url: "https://space.bilibili.com/2063167092",
		},
		{
			name: "Steam",
			icon: "fa6-brands:steam",
			url: "https://steamcommunity.com/profiles/76561199543339625/",
		},
		{
			name: "Gitee",
			icon: "simple-icons:gitee",
			url: "https://gitee.com/ignorantand",
		},
	],
};

// 新版 Live2D Widget 配置
export const live2dConfig: Live2DConfig = {
	enable: true,
	drag: false,
	modelId: 1,
	logLevel: "warn",
	live2dPath:
		"https://fastly.jsdelivr.net/npm/live2d-widgets@1.0.0-rc.6/dist/",
	waifuPath: "/live2d/waifu-tips.json",
	tools: [
		"hitokoto",
		"asteroids",
		"switch-model",
		"switch-texture",
		"photo",
		"info",
		"quit",
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
	 * - %postname% : 文章文件名（slug）
	 * - %category% : 分类名（无分类时为 "uncategorized"）
	 *
	 * 示例：
	 * - "%year%-%monthnum%-%postname%" => "/2024-12-my-post/"
	 * - "%post_id%-%postname%" => "/42-my-post/"
	 * - "%category%-%postname%" => "/tech-my-post/"
	 *
	 * 注意：不支持斜杠 "/"，所有生成的链接都在根目录下
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
	twikoo: {
		envId: "https://comment-01.218501.xyz",
		lang: SITE_LANG,
	},
};

export const shareConfig: ShareConfig = {
	enable: true, // 启用分享功能
};

export const announcementConfig: AnnouncementConfig = {
	title: "", // 公告标题，填空使用i18n字符串Key.announcement
	content: "孩儿立志出乡关，学不成名誓不还", // 公告内容
	closable: false, // 允许用户关闭公告
	link: {
		enable: true, // 启用链接
		text: "Learn More", // 链接文本
		url: "/about/", // 链接 URL
		external: false, // 内部链接
	},
};

export const musicPlayerConfig: MusicPlayerConfig = {
	enable: true, // 启用音乐播放器功能
	mode: "meting", // 音乐播放器模式，可选 "local" 或 "meting"
	meting_api:
		"https://api.injahow.cn/meting/?server=:server&type=:type&id=:id&auth=:auth&r=:r", // Meting API 地址
	id: "17699694803", // 歌单ID
	server: "netease", // 音乐源服务器。有的meting的api源支持更多平台,一般来说,netease=网易云音乐, tencent=QQ音乐, kugou=酷狗音乐, xiami=虾米音乐, baidu=百度音乐
	type: "playlist", // 播单类型
};

export const footerConfig: FooterConfig = {
	enable: true, // 是否启用Footer HTML注入功能
	customHtml: "",
	// HTML格式的自定义页脚信息，例如备案号等，默认留空
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
	// 侧边栏位置：单侧(unilateral)或双侧(both)
	position: "both",

	// 侧边栏组件配置列表
	components: [
		{
			// 组件类型：用户资料组件
			type: "profile",
			// 是否启用该组件
			enable: true,
			// 组件显示顺序（数字越小越靠前）
			order: 1,
			// 组件位置："top" 表示固定在顶部
			position: "sticky",
			// 所在侧边栏
			sidebar: "right",
			// CSS 类名，用于应用样式和动画
			class: "onload-animation",
			// 动画延迟时间（毫秒），用于错开动画效果
			animationDelay: 0,
		},
		{
			// 组件类型：公告组件
			type: "announcement",
			// 是否启用该组件（现在通过统一配置控制）
			enable: true,
			// 组件显示顺序
			order: 2,
			// 组件位置："top" 表示固定在顶部
			position: "sticky",
			// 所在侧边栏
			sidebar: "right",
			// CSS 类名
			class: "onload-animation",
			// 动画延迟时间
			animationDelay: 50,
		},
		{
			// 组件类型：站点统计组件
			type: "site-stats",
			// 是否启用该组件
			enable: true,
			// 组件显示顺序
			order: 3,
			// 组件位置
			position: "top",
			// 所在侧边栏
			sidebar: "left",
			// CSS 类名
			class: "onload-animation",
			// 动画延迟时间
			animationDelay: 100,
		},
		{
			// 组件类型：分类组件
			type: "categories",
			// 是否启用该组件
			enable: true,
			// 组件显示顺序
			order: 4,
			// 组件位置："sticky" 表示粘性定位，可滚动
			position: "top",
			// 所在侧边栏
			sidebar: "left",
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
			// 是否启用该组件
			enable: true,
			// 组件显示顺序
			order: 5,
			// 组件位置："sticky" 表示粘性定位
			position: "top",
			// 所在侧边栏
			sidebar: "left",
			// CSS 类名
			class: "onload-animation",
			// 动画延迟时间
			animationDelay: 200,
			// 响应式配置
			responsive: {
				// 折叠阈值：当标签数量超过20个时自动折叠
				collapseThreshold: 20,
			},
		},
		{
			// 组件类型：日历组件(移动端不显示)
			type: "calendar",
			// 是否启用该组件
			enable: true,
			// 组件显示顺序
			order: 6,
			// 组件位置
			position: "sticky",
			// 所在侧边栏
			sidebar: "right",
			// CSS 类名
			class: "onload-animation",
			// 动画延迟时间
			animationDelay: 250,
		},
	],

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
		// 不同设备的布局模式
		// hidden: 隐藏侧边栏
		// sidebar: 显示侧边栏
		layout: {
			// 移动端：显示侧边栏(抽屉模式)
			mobile: "sidebar",
			// 平板端：显示侧边栏(抽屉模式)
			tablet: "sidebar",
			// 桌面端：显示侧边栏
			desktop: "sidebar",
		},
	},
};

export const sakuraConfig: SakuraConfig = {
	enable: true, // 默认关闭樱花特效
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

// 导出所有配置的统一接口
export const widgetConfigs = {
	profile: profileConfig,
	announcement: announcementConfig,
	music: musicPlayerConfig,
	layout: sidebarLayoutConfig,
	sakura: sakuraConfig,
	fullscreenWallpaper: fullscreenWallpaperConfig,
	share: shareConfig, // 添加分享配置
} as const;

export const umamiConfig = {
	enabled: true, // 是否显示Umami统计
	apiKey:
		import.meta.env.UMAMI_API_KEY || "api_ds6dVQgZUWwrcA8S1UWP64cLi7x7twnN", // API密钥优先从环境变量读取，否则使用配置文件中的值
	baseUrl: "https://api.umami.is", // Umami Cloud API地址
	scripts: `
<script defer src="https://cloud.umami.is/script.js" data-website-id="76481de8-a898-442f-8bcf-45eac353add1"></script>
  `.trim(), // 上面填你要插入的Script,不用再去Layout中插入
} as const;
