import type { Engine } from '../../types';
import { type ComputedRef } from 'vue';
/**
 * 获取引擎实例的组合式函数
 *
 * @returns 引擎实例
 * @throws 如果引擎未找到则抛出错误
 *
 * @example
 * ```vue
 * <script setup>
 * import { useEngine } from '@ldesign/engine'
 *
 * const engine = useEngine()
 * logger.debug('App name:', engine.config.get('app.name'))
 * </script>
 * ```
 */
export declare function useEngine(): Engine;
/**
 * 检查引擎是否可用的组合式函数
 *
 * @returns 引擎是否可用的响应式引用
 *
 * @example
 * ```vue
 * <script setup>
 * import { useEngineAvailable } from '@ldesign/engine'
 *
 * const isEngineAvailable = useEngineAvailable()
 * </script>
 *
 * <template>
 *   <div v-if="isEngineAvailable">
 *     Engine is ready!
 *   </div>
 * </template>
 * ```
 */
export declare function useEngineAvailable(): ComputedRef<boolean>;
/**
 * 获取引擎配置的组合式函数
 */
export declare function useEngineConfig(): import("../../types").ConfigManager<Record<string, unknown>>;
/**
 * 获取引擎插件管理器的组合式函数
 */
export declare function useEnginePlugins(): import("../../types").PluginManager<Engine>;
/**
 * 获取引擎中间件管理器的组合式函数
 */
export declare function useEngineMiddleware(): import("../../types").MiddlewareManager;
/**
 * 获取引擎事件管理器的组合式函数
 */
export declare function useEngineEvents(): import("../../types").EventManager<import("../../types").EventMap>;
/**
 * 获取引擎状态管理器的组合式函数
 */
export declare function useEngineState(): import("../../types").StateManager<import("../../types").StateMap>;
/**
 * 获取引擎日志器的组合式函数
 */
export declare function useEngineLogger(): import("../../types").Logger;
/**
 * 获取引擎通知管理器的组合式函数
 */
export declare function useEngineNotifications(): import("../../notifications/notification-system").NotificationSystem;
/**
 * 获取引擎错误管理器的组合式函数
 */
export declare function useEngineErrors(): import("../../types").ErrorManager;
