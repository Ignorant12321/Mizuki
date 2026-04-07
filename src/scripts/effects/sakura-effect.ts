/**
 * Sakura 特效模块
 * 管理樱花飘落特效的初始化
 */

import type { SakuraConfig } from "../../types/config";
import { initSakura, stopSakura } from "../../utils/sakura-manager";
import {
	SETTING_CHANGE_EVENT,
	getStoredSakuraEnabled,
} from "../../utils/setting-utils";

/**
 * Sakura 特效处理器类
 * 负责樱花飘落特效的初始化和状态管理
 */
export class SakuraEffectHandler {
	private initialized = false;
	private config: SakuraConfig | null = null;
	private boundSettingChangeHandler: ((event: Event) => void) | null = null;

	/**
	 * 初始化 Sakura 特效
	 */
	init(widgetConfigs: any): void {
		const sakuraConfig = widgetConfigs?.sakura;
		if (!sakuraConfig) {
			return;
		}

		this.config = sakuraConfig;
		this.syncWithSetting();
		this.setupSettingListener();
	}

	private setupSettingListener(): void {
		if (this.boundSettingChangeHandler) {
			return;
		}
		this.boundSettingChangeHandler = (event: Event) => {
			const customEvent = event as CustomEvent<{ key?: string }>;
			if (customEvent.detail?.key !== "sakuraEnabled") {
				return;
			}
			this.syncWithSetting();
		};
		window.addEventListener(
			SETTING_CHANGE_EVENT,
			this.boundSettingChangeHandler as EventListener,
		);
	}

	private syncWithSetting(): void {
		if (!this.config) {
			return;
		}
		const datasetValue = document.documentElement.dataset.sakuraEnabled;
		const enabledFromDataset =
			datasetValue === "true" ||
			(datasetValue !== "false" && getStoredSakuraEnabled());
		if (!enabledFromDataset) {
			stopSakura();
			(window as any).sakuraInitialized = false;
			this.initialized = false;
			return;
		}

		const nextConfig: SakuraConfig = {
			...this.config,
			enable: true,
		};
		initSakura(nextConfig);
		this.initialized = true;
		(window as any).sakuraInitialized = true;
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

	destroy(): void {
		if (this.boundSettingChangeHandler) {
			window.removeEventListener(
				SETTING_CHANGE_EVENT,
				this.boundSettingChangeHandler as EventListener,
			);
			this.boundSettingChangeHandler = null;
		}
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
