/**
 * createLocaleAwarePlugin - 插件包装工具
 *
 * 将普通插件包装成支持自动语言同步的插件
 * 大幅减少样板代码，统一多语言管理
 */
import type { App } from 'vue';
import type { Engine } from '../types/engine';
import type { Plugin } from '../types/plugin';
import type { LocaleAwarePlugin } from './locale-manager';
/**
 * 创建支持语言同步的插件配置
 */
export interface CreateLocaleAwarePluginOptions {
    /**
     * 插件名称（唯一标识）
     * 用于在 LocaleManager 中注册
     */
    name: string;
    /**
     * 是否同步语言
     * @default true
     */
    syncLocale?: boolean;
    /**
     * 插件版本号
     * @default '1.0.0'
     */
    version?: string;
    /**
     * 自定义安装逻辑
     * 在插件本身的 install 方法执行后调用
     */
    afterInstall?: (engine: Engine, app: App) => void | Promise<void>;
}
/**
 * 创建支持自动语言同步的 Engine 插件
 *
 * @param plugin 原始插件实例（必须实现 LocaleAwarePlugin 接口）
 * @param options 配置选项
 * @returns Engine Plugin
 *
 * @example
 * ```typescript
 * // 1. 创建原始插件
 * const colorPlugin = createColorPlugin(options)
 *
 * // 2. 包装成 Engine 插件（自动同步语言）
 * const colorEnginePlugin = createLocaleAwarePlugin(colorPlugin, {
 *   name: 'color',
 *   syncLocale: true
 * })
 *
 * // 3. 在应用中使用
 * const engine = await createEngineApp({
 *   plugins: [colorEnginePlugin]
 * })
 *
 * // 4. 语言自动同步到所有插件
 * engine.localeManager.setLocale('en-US')
 * ```
 */
export declare function createLocaleAwarePlugin<T extends LocaleAwarePlugin>(plugin: T, options: CreateLocaleAwarePluginOptions): Plugin;
/**
 * 创建简化版的 LocaleAware Engine Plugin
 *
 * 适用于简单场景，直接传入插件创建函数和选项
 *
 * @example
 * ```typescript
 * export const createColorEnginePlugin = createSimpleLocaleAwarePlugin(
 *   createColorPlugin,
 *   'color'
 * )
 *
 * // 使用
 * const plugin = createColorEnginePlugin({ defaultTheme: 'blue' })
 * ```
 */
export declare function createSimpleLocaleAwarePlugin<TOptions, TPlugin extends LocaleAwarePlugin>(pluginFactory: (options: TOptions) => TPlugin, name: string): (options?: TOptions) => Plugin;
