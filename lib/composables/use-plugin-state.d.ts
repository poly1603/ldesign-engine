/**
 * 通用的插件状态管理组合式函数
 * 提供统一的状态共享机制
 */
import { type InjectionKey, type Ref } from 'vue';
/**
 * 通用的插件状态钩子
 * 尝试注入共享状态，如果不存在则创建新的
 *
 * @param key - 注入键，建议使用字符串以便跨应用共享
 * @param defaultValue - 默认值
 * @returns 响应式状态引用
 */
export declare function usePluginState<T>(key: string | InjectionKey<Ref<T>>, defaultValue: T): Ref<T>;
/**
 * 常用状态的便捷钩子
 */
/**
 * 使用共享的 locale 状态
 */
export declare function useLocale(defaultValue?: string): Ref<string>;
/**
 * 使用共享的主题状态
 */
export declare function useTheme(defaultValue?: string): Ref<string>;
/**
 * 使用共享的尺寸状态
 */
export declare function useSize(defaultValue?: string): Ref<string>;
/**
 * 使用共享的暗黑模式状态
 */
export declare function useDark(defaultValue?: boolean): Ref<boolean>;
/**
 * 创建自定义的共享状态钩子
 *
 * @example
 * ```ts
 * // 创建自定义状态钩子
 * const useUserPreference = createSharedState('user-preference', {
 *   language: 'zh-CN',
 *   timezone: 'Asia/Shanghai'
 * })
 *
 * // 在组件中使用
 * const preference = useUserPreference()
 * ```
 */
export declare function createSharedState<T>(key: string, defaultValue: T): () => Ref<T, T>;
/**
 * 批量获取多个共享状态
 *
 * @example
 * ```ts
 * const { locale, theme, size } = usePluginStates({
 *   locale: 'zh-CN',
 *   theme: 'blue',
 *   size: 'medium'
 * })
 * ```
 */
export declare function usePluginStates<T extends Record<string, any>>(states: T): {
    [K in keyof T]: Ref<T[K]>;
};
