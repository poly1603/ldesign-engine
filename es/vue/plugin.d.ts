import type { App, Component, Plugin } from 'vue';
import type { Engine } from '../types';
/**
 * Vue插件选项接口
 */
export interface VueEnginePluginOptions {
    /** 是否在开发环境下启用调试模式 */
    debug?: boolean;
    /** 是否自动注册全局组件 */
    registerComponents?: boolean;
    /** 是否自动注册全局指令 */
    registerDirectives?: boolean;
    /** 内部使用：是否注册指令（带下划线前缀避免外部使用） */
    _registerDirectives?: boolean;
    /** 全局属性名称 */
    globalPropertyName?: string;
    /** 注入键名 */
    injectKey?: string;
    /** 是否在window上暴露引擎实例（仅开发环境） */
    exposeGlobal?: boolean;
    /** 引擎配置 */
    config?: Record<string, unknown>;
    /** 插件列表 (引擎插件，不是Vue插件) */
    plugins?: import('../types').Plugin<Engine>[];
}
/**
 * 创建Vue引擎插件
 *
 * @param options 插件选项
 * @returns Vue插件
 *
 * @example
 * ```typescript
 * import { createApp } from 'vue'
 * import { createVueEnginePlugin } from '@ldesign/engine'
 * import App from './App.vue'
 *
 * const app = createApp(App)
 *
 * // 使用插件
 * app.use(createVueEnginePlugin({
 *   config: {
 *     debug: true,
 *     app: { name: 'My App' }
 *   },
 *   plugins: [
 *     // 引擎插件
 *   ]
 * }))
 *
 * app.mount('#app')
 * ```
 */
export declare function createVueEnginePlugin(options?: VueEnginePluginOptions): Plugin;
/**
 * 简化的Vue引擎插件安装函数
 *
 * @param app Vue应用实例
 * @param options 引擎选项
 * @returns 引擎实例
 *
 * @example
 * ```typescript
 * import { createApp } from 'vue'
 * import { installEngine } from '@ldesign/engine'
 * import App from './App.vue'
 *
 * const app = createApp(App)
 *
 * // 简化安装
 * const engine = installEngine(app, {
 *   config: { debug: true }
 * })
 *
 * app.mount('#app')
 * ```
 */
export declare function installEngine(app: App, options?: VueEnginePluginOptions): Promise<Engine>;
/**
 * 一键创建和挂载Vue应用
 *
 * @param rootComponent 根组件
 * @param selector 挂载选择器
 * @param options 引擎选项
 * @returns 引擎实例
 *
 * @example
 * ```typescript
 * import { createAndMountApp } from '@ldesign/engine'
 * import App from './App.vue'
 *
 * // 一键创建和挂载
 * const engine = await createAndMountApp(App, '#app', {
 *   config: {
 *     debug: true,
 *     app: { name: 'My App' }
 *   }
 * })
 *
 * logger.debug('应用已启动:', engine.config.get('app.name'))
 * ```
 */
export declare function createAndMountApp(rootComponent: Component, selector: string | Element, options?: VueEnginePluginOptions): Promise<Engine>;
/**
 * Vue 3.3+ defineModel 增强
 *
 * @param key 状态键
 * @param defaultValue 默认值
 * @returns 模型引用
 *
 * @example
 * ```vue
 * <script setup>
 * import { defineEngineModel } from '@ldesign/engine'
 *
 * // 定义与引擎状态绑定的模型
 * const theme = defineEngineModel('theme', 'light')
 * </script>
 *
 * <template>
 *   <select v-model="theme">
 *     <option value="light">亮色</option>
 *     <option value="dark">暗色</option>
 *   </select>
 * </template>
 * ```
 */
export declare function defineEngineModel<T>(key: string, defaultValue: T): {
    get: () => T;
    set: (_value: T) => void;
};
/**
 * Vue组件增强装饰器
 *
 * @param options 组件选项
 * @param options.performance 是否启用性能监控
 * @param options.errorBoundary 是否启用错误边界
 * @param options.cache 是否启用组件缓存
 * @param options.memoryManagement 是否启用内存管理
 * @returns 装饰器函数
 *
 * @example
 * ```typescript
 * import { engineComponent } from '@ldesign/engine'
 *
 * @engineComponent({
 *   performance: true, // 启用性能监控
 *   errorBoundary: true, // 启用错误边界
 *   cache: true // 启用组件缓存
 * })
 * export default defineComponent({
 *   name: 'MyComponent',
 *   // ...
 * })
 * ```
 */
export declare function engineComponent(options?: {
    performance?: boolean;
    errorBoundary?: boolean;
    cache?: boolean;
    memoryManagement?: boolean;
}): <T extends Record<string, unknown>>(component: T) => T;
/**
 * 开发工具集成
 */
export declare function setupDevtools(engine: Engine): void;
