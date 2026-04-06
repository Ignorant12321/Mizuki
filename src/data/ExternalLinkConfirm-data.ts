/**
 * 外链确认白名单
 * whiteListSite: 站点白名单（支持域名、完整 origin 或 URL 前缀）
 * whiteListPage: 页面白名单（当前页面路径命中后不拦截外链）
 */
export const externalLinkConfirmWhiteList = {
	whiteListSite: [
		// 网站备案信息
		"beian.mps.gov.cn",
		"beian.miit.gov.cn",
	] as string[],
	whiteListPage: [] as string[],
};
