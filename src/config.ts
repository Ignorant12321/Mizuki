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
	ClickEffectConfig,
	DisplaySettingsConfig,
	Live2DConfig,
	SakuraConfig,
	ShareConfig,
	SidebarLayoutConfig,
	SiteConfig,
	ExternalLinkConfirmConfig,
	FloatingWidgetsConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

// 移除i18n导入以避免循环依赖

// 定义站点语言
const SITE_LANG = "zh_CN"; // 语言代码，例如：'en', 'zh_CN', 'ja' 等。
const SITE_TIMEZONE = 8; //设置你的网站时区 from -12 to 12 default in UTC+8

const floatingWidgetsConfig: FloatingWidgetsConfig = {
	backToTop: {
		enable: true,
		desktop: { side: "left", offset: "-4rem", bottom: "15rem" },
		mobile: { side: "left", offset: "1rem", bottom: "15rem" },
	},
	backToBottom: {
		enable: true,
		desktop: { side: "left", offset: "-4rem", bottom: "5rem" },
		mobile: { side: "left", offset: "1rem", bottom: "5rem" },
	},
	floatingTOC: {
		enable: true,
		desktop: { side: "left", offset: "-4rem", bottom: "10rem" },
		mobile: { side: "left", offset: "1rem", bottom: "10rem" },
	},
	musicPlayer: {
		desktop: { side: "left", offset: "1.25rem", bottom: "1rem" },
		mobile: { side: "left", offset: "1.3rem", bottom: "1rem" },
		mobileExpanded: { side: "left", offset: "0.5rem" },
		mobilePlaylist: { side: "left", offset: "0.5rem", bottom: "5rem" },
	},
	live2d: {
		// Live2D 主体位置（看板娘本体）
		desktop: { side: "right", offset: "1.5rem", bottom: "0" },
		mobile: { side: "right", offset: "1.5rem", bottom: "0" },
		// side 表示固定在左侧或右侧，offset 表示距离该侧边的距离
		// 唤醒按钮默认跟随对应端的 side，不单独设置左右侧
		toggle: {
			offset: "0", // 按钮距离当前侧边的距离
			hiddenOffset: "-100px", // 隐藏状态偏移（越小越靠外）
			activeOffset: "-45px", // 展开后默认偏移
			hoverOffset: "-35px", // 鼠标悬浮按钮时偏移
			mobileActiveOffset: "-30px", // 移动端展开偏移
		},
		// 动画/交互时序（单位 ms）
		timing: {
			enterExitDurationMs: 3000, // 看板娘出场/退场时长
			toolFadeDurationMs: 1000, // 工具栏淡入淡出时长
			toolAutoHideDelayMs: 2000, // 工具栏自动隐藏延迟
		},
		// 看板娘纵向位移（支持 px/rem/calc）
		motion: {
			hiddenOffsetY: "calc(100% + 2rem)", // 隐藏时向下沉没偏移
			idleOffsetY: "20px", // 非悬浮时下沉一点（更“矮”）
			hoverOffsetY: "10px", // 悬浮时回到正常高度
		},
	},
};

export const siteConfig: SiteConfig = {
	title: "Ignorant's Blog",
	subtitle: "Ignorant 的个人博客",
	siteURL: "https://ignorant.top/", // 请替换为你的站点URL，以斜杠结尾
	siteStartDate: "2026-02-01", // 站点开始运行日期，用于站点统计组件计算运行天数

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
		allowSwitch: true,
	},

	// 首页分页配置
	homePage: {
		postPageSize: 1,
	},

	// 通用分页配置（首页/日记 + 不同端显示数量）
	pagination: {
		homePageSize: 5,
		diaryPageSize: 3,
		mobileVisiblePages: 3,
		desktopVisiblePages: 5,
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
			performanceMode: true, // 性能模式：减少动画复杂度(性能提升40%)
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
	floatingWidgets: floatingWidgetsConfig,
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
		// 额外字体文本，多个词请使用英文逗号分隔；留空则读取 src/data/compress-fonts-data.ts
		extraText: "",
		asciiFont: {
			// 英文字体 - 优先级最高
			// 指定为英文字体则无论字体包含多大范围，都只会保留 ASCII 字符子集
			fontFamily: "ZenMaruGothic-Medium",
			fontWeight: "400",
			localFonts: ["ZenMaruGothic-Medium.ttf"],
			enableCompress: false, // 启用字体子集优化，减少字体文件大小
		},
		cjkFont: {
			// 中日韩字体 - 作为回退字体
			fontFamily: "萝莉体 第二版",
			fontWeight: "500",
			localFonts: ["萝莉体 第二版.ttf"],
			enableCompress: false, // 启用字体子集优化，减少字体文件大小
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
			name: "Diary",
			url: "/diary/",
			icon: "material-symbols:book",
		},
		{
			name: "津渡",
			url: "/Ig-nav/",
			icon: "mdi:navigation-variant",
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
					name: "Devices",
					url: "devices/",
					icon: "material-symbols:devices",
					external: false,
				},
				{
					name: "时语",
					url: "/news/",
					icon: "material-symbols:rss-feed",
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
	avatar: "assets/images/avatar.webp", // 相对于 /src 目录。如果以 '/' 开头，则相对于 /public 目录
	avatarFrame: {
		enable: true,
		// image: "assets/images/avatar_frame_profile.webp",
		image: "assets/images/avatar_frame_profile_01.webp",
		scale: 1.25,
		offsetX: 0,
		offsetY: 1,
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
		envId: "https://twikoo-vercel-01.ignorant.top",
		lang: SITE_LANG,
	},
};

export const shareConfig: ShareConfig = {
	enable: true, // 启用分享功能
	avatarFrame: {
		enable: true,
		image: "assets/images/avatar_frame_share.webp",
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
	closable: true,
	itemsPerPage: 1,
	content: [], // 留空则读取 src/data/announcement.json
};

export const musicPlayerConfig: MusicPlayerConfig = {
	enable: true,
	mode: "meting",
	meting_api:
		"https://api.injahow.cn/meting/?server=:server&type=:type&id=:id&auth=:auth&r=:r",
	id: "17699694803",
	server: "netease",
	type: "playlist",

	playlists: [
		{
			name: "洛天依",
			server: "netease",
			type: "playlist",
			id: "17699694803",
		},
		{
			name: "游四方",
			mode: "meting",
			meting_api:
				"https://meting.mikus.ink/api?server=:server&type=:type&id=:id&auth=:auth&r=:r",
			server: "netease",
			type: "playlist",
			id: "17699636947",
		},
		// {
		// 	name: "B站歌单",
		// 	mode: "local",
		// 	audioList: [
		// 		{
		// 			id: 1,
		// 			title: "勾指起誓",
		// 			artist: "洛天依、ilem",
		// 			cover: "/assets/music/cover/勾指起誓 - 洛天依、ilem.jpg",
		// 			url: "/assets/music/url/勾指起誓 - 洛天依、ilem.mp3",
		// 			duration: 240,
		// 		},
		// 		{
		// 			id: 2,
		// 			title: "霜雪千年 (cover 洛天依乐正绫)",
		// 			artist: "真栗",
		// 			cover: "assets/music/cover/霜雪千年 (cover 洛天依乐正绫) - 真栗.jpg",
		// 			url: "assets/music/url/霜雪千年 (cover 洛天依乐正绫) - 真栗.mp3",
		// 			duration: 180,
		// 		},
		// 	],
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
		left: ["profile", "announcement"],
		right: ["site-stats", "tags", "categories", "calendar"],
		drawer: ["profile", "announcement"],
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
	enable: true, // 默认关闭樱花特效
	mobile: true, // 是否在移动端启用
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

// 鼠标点击效果
export const clickEffectConfig: ClickEffectConfig = {
	enable: true, // 是否在桌面端启用点击效果
	mobile: false, // 是否在移动端启用点击效果
	blacklist: ["#waifu"], // 黑名单，点击这些元素不会触发效果
};

// Live2D Widget 配置
export const live2dConfig: Live2DConfig = {
	enable: false,
	mobile: true,
	drag: false,
	modelId: 1,
	logLevel: "warn",
	live2dPath:
		"https://fastly.jsdelivr.net/npm/live2d-widgets@1.0.0-rc.6/dist/",
	// live2dPath: "/assets/live2d/",
	waifuTipsPath: "/assets/live2d/waifu-tips.json",
	tools: [
		"home",
		"hitokoto",
		// "asteroids",
		"switch-model",
		"switch-texture",
		"photo",
		// "info",
		"quit",
	],
};

export const displaySettingsConfig: DisplaySettingsConfig = {
	panel: {
		fixed: true,
		top: "6rem",
		right: "1rem",
		width: "20rem",
		maxHeight: "calc(100vh - 7rem)",
		zIndex: 120,
	},
	themeColor: {
		enable: !siteConfig.themeColor.fixed,
		allowReset: true,
		min: 0,
		max: 360,
		step: 5,
		defaultValue: siteConfig.themeColor.hue,
	},
	wallpaperMode: {
		enable: true,
		options: ["banner", "fullscreen", "none"],
		defaultMode: siteConfig.wallpaperMode.defaultMode,
	},
	fullscreenWallpaper: {
		opacity: {
			enable: true,
			min: 0,
			max: 1,
			step: 0.05,
			defaultValue: fullscreenWallpaperConfig.opacity ?? 0.8,
			unit: "%",
		},
		blur: {
			enable: true,
			min: 0,
			max: 20,
			step: 0.5,
			defaultValue: fullscreenWallpaperConfig.blur ?? 0,
			unit: "px",
		},
	},
	effects: {
		live2d: {
			enable: live2dConfig.enable || live2dConfig.mobile,
			allowSwitch: true,
			defaultValue: live2dConfig.enable,
		},
		clickEffect: {
			enable:
				clickEffectConfig.enable || clickEffectConfig.mobile === true,
			allowSwitch: true,
			defaultValue: clickEffectConfig.enable,
		},
		waves: {
			enable: !!siteConfig.banner.waves,
			allowSwitch: true,
			defaultValue: siteConfig.banner.waves?.enable ?? false,
		},
		sakura: {
			enable: sakuraConfig.enable || sakuraConfig.mobile === true,
			allowSwitch: true,
			defaultValue: sakuraConfig.enable,
		},
	},
	postListLayout: {
		enable: true,
		allowSwitch: siteConfig.postListLayout.allowSwitch,
		options: ["list", "grid"],
		defaultMode: siteConfig.postListLayout.defaultMode,
	},
};

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

// 导出所有配置的统一接口
export const widgetConfigs = {
	profile: profileConfig,
	announcement: announcementConfig,
	music: musicPlayerConfig,
	layout: sidebarLayoutConfig,
	sakura: sakuraConfig,
	fullscreenWallpaper: fullscreenWallpaperConfig,
	live2dConfig: live2dConfig,
	share: shareConfig,
} as const;

// umamiConfig相关配置已移动至astro.config.mjs中,统计脚本请自行在Layout.astro文件的<head>中插入
