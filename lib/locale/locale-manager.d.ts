/**
 * LocaleManager - 统一的多语言管理中心
 *
 * @deprecated 已废弃，请使用新的插件系统
 *
 * 新的插件系统使用方法：
 * ```typescript
 * // 方式1：自动共享
 * app.use(createI18nPlugin())  // 会自动 provide locale
 * app.use(createColorPlugin()) // 会自动 inject 并使用共享的 locale
 *
 * // 方式2：显式共享
 * const locale = ref('zh-CN')
 * app.use(createI18nPlugin({ locale }))
 * app.use(createColorPlugin({ locale }))
 * ```
 *
 * 保留此文件仅用于向后兼容
 */
import type { Engine } from '../types/engine';
import { type Ref } from 'vue';
/**
 * 支持多语言的插件必须实现此接口
 */
export interface LocaleAwarePlugin {
    /**
     * 设置语言
     * @param locale 语言代码，如 'zh-CN', 'en-US'
     */
    setLocale: (locale: string) => void;
    /**
     * 当前语言（可选，响应式）
     * 如果提供，manager 会自动绑定到全局 locale
     */
    currentLocale?: Ref<string>;
}
/**
 * LocaleManager 配置选项
 */
export interface LocaleManagerOptions {
    /**
     * 初始语言
     * @default 'zh-CN'
     */
    initialLocale?: string;
    /**
     * 后备语言
     * @default 'en-US'
     */
    fallbackLocale?: string;
    /**
     * 是否自动持久化到 localStorage
     * @default true
     */
    persist?: boolean;
    /**
     * 存储键名
     * @default 'ldesign-locale'
     */
    storageKey?: string;
    /**
     * 语言变更前的钩子
     * 返回 false 可阻止切换
     */
    beforeChange?: (newLocale: string, oldLocale: string) => boolean | Promise<boolean>;
    /**
     * 语言变更后的钩子
     */
    afterChange?: (newLocale: string, oldLocale: string) => void | Promise<void>;
    /**
     * 错误处理
     */
    onError?: (error: Error) => void;
}
/**
 * LocaleManager 类
 */
export declare class LocaleManager {
    private engine;
    private plugins;
    private unwatchers;
    private readonly currentLocale;
    private readonly fallbackLocale;
    private readonly options;
    constructor(engine: Engine, options?: LocaleManagerOptions);
    /**
     * 获取当前语言
     */
    getLocale(): string;
    /**
     * 获取后备语言
     */
    getFallbackLocale(): string;
    /**
     * 获取当前语言的响应式引用
     */
    getLocaleRef(): Ref<string>;
    /**
     * 设置全局语言
     *
     * @param locale 语言代码
     * @returns Promise<boolean> 是否成功切换
     */
    setLocale(locale: string): Promise<boolean>;
    /**
     * 注册支持多语言的插件
     *
     * @param name 插件名称（唯一标识）
     * @param plugin 插件实例
     */
    register(name: string, plugin: LocaleAwarePlugin): void;
    /**
     * 注销插件
     *
     * @param name 插件名称
     */
    unregister(name: string): void;
    /**
     * 获取所有已注册的插件名称
     */
    getRegisteredPlugins(): string[];
    /**
     * 销毁 LocaleManager
     * 清理所有监听器
     */
    destroy(): void;
    /**
     * 设置同步机制
     * @private
     */
    private setupSync;
    /**
     * 同步语言到所有已注册的插件
     * @private
     */
    private syncToPlugins;
    /**
     * 从存储加载持久化的语言
     * @private
     */
    private loadPersistedLocale;
    /**
     * 持久化语言到存储
     * @private
     */
    private persistLocale;
    /**
     * 错误处理
     * @private
     */
    private handleError;
}
/**
 * 创建 LocaleManager 实例
 */
export declare function createLocaleManager(engine: Engine, options?: LocaleManagerOptions): LocaleManager;
