/**
 * Sakura 特效模块
 * 管理樱花飘落特效的初始化
 */

import type { SakuraConfig } from "../../types/config";
import { initSakura } from "../../utils/sakura-manager";
import { getStoredSakuraEnabled } from "../../utils/setting-utils";

/**
 * Sakura 特效处理器类
 * 负责樱花飘落特效的初始化和状态管理
 */
export class SakuraEffectHandler {
	private initialized = false;
	private config: SakuraConfig | null = null;
	private widgetConfigs: any = null;
	private settingsListenerRegistered = false;

	/**
	 * 初始化 Sakura 特效
	 */
	init(widgetConfigs: any): void {
		this.widgetConfigs = widgetConfigs;
		const sakuraConfig = this.getEffectiveConfig(widgetConfigs);
		if (!sakuraConfig) {
			return;
		}

		if (!this.settingsListenerRegistered) {
			window.addEventListener("display-settings:changed", () => {
				this.sync();
			});
			this.settingsListenerRegistered = true;
		}

		this.sync();
	}

	private sync(): void {
		const sakuraConfig = this.getEffectiveConfig(this.widgetConfigs);
		if (!sakuraConfig) {
			return;
		}

		this.config = sakuraConfig;
		initSakura(sakuraConfig);
		this.initialized = true;
		(window as any).sakuraInitialized = sakuraConfig.enable;
	}

	private getEffectiveConfig(widgetConfigs: any): SakuraConfig | null {
		const sakuraConfig = widgetConfigs?.sakura as SakuraConfig | undefined;
		if (!sakuraConfig) {
			return null;
		}

		return {
			...sakuraConfig,
			enable: getStoredSakuraEnabled(),
		};
	}

	/**
	 * 检查是否已初始化
	 */
	isInitialized(): boolean {
		return this.initialized;
	}

	/**
	 * 获取配置
	 */
	getConfig(): SakuraConfig | null {
		return this.config;
	}
}

// 创建全局实例
let globalSakuraEffectHandler: SakuraEffectHandler | null = null;

/**
 * 获取全局 Sakura 特效处理器实例
 */
export function getSakuraEffectHandler(): SakuraEffectHandler {
	if (!globalSakuraEffectHandler) {
		globalSakuraEffectHandler = new SakuraEffectHandler();
	}
	return globalSakuraEffectHandler;
}

/**
 * 初始化 Sakura 特效（便捷函数）
 */
export function setupSakura(widgetConfigs: any): void {
	const handler = getSakuraEffectHandler();
	handler.init(widgetConfigs);
}

/**
 * 设置 Sakura 特效初始化的 DOM 监听
 */
export function setupSakuraOnDOMReady(widgetConfigs: any): void {
	const handler = getSakuraEffectHandler();

	const init = () => {
		handler.init(widgetConfigs);
	};

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
}
