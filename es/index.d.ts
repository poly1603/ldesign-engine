/**
 * @ldesign/engine - Vue3应用引擎
 *
 * 🚀 一个强大而简洁的Vue3应用引擎，通过统一的API配置所有功能
 *
 * @example
 * ```typescript
 * import { createEngineApp } from '@ldesign/engine'
 *
 * const engine = await createEngineApp({
 *   rootComponent: App,
 *   mountElement: '#app',
 *   config: {
 *     name: 'My App',
 *     version: '1.0.0',
 *     debug: true
 *   },
 *   features: {
 *     enableCaching: true,
 *     enablePerformanceMonitoring: true
 *   },
 *   plugins: [routerPlugin, storePlugin]
 * })
 * ```
 */
export { createSharedState, useDark, useLocale, usePluginState, usePluginStates, useSize, useTheme } from './composables/use-plugin-state';
export { createAndMountEngineApp, createEngineApp, type EngineAppOptions } from './core/create-engine-app';
export { createModuleLoader, ModuleLoader, type ModuleLoaderConfig, type ModuleMetadata, type ModuleLoadOptions, getGlobalModuleLoader, setGlobalModuleLoader, LazyModule } from './core/module-loader';
export { createObjectPoolManager, ObjectPoolManager, ObjectPool, TaskPool, NotificationPool, RequestPool, getGlobalObjectPoolManager, setGlobalObjectPoolManager, Pooled } from './core/object-pools';
export { createLocaleAwarePlugin, type CreateLocaleAwarePluginOptions, createLocaleManager, createSimpleLocaleAwarePlugin, type LocaleAwarePlugin, LocaleManager, type LocaleManagerOptions } from './locale';
export * from './performance/performance-monitor';
export { createProfiler, Profiler, type ProfilerConfig, type FunctionCallRecord, type ComponentRenderRecord, type PerformanceProfileReport, Profile, getGlobalProfiler, setGlobalProfiler } from './performance/profiler';
export { createI18nEnginePlugin } from './plugins/i18n';
export type { I18nEnginePluginOptions } from './plugins/i18n';
export type { ConfigManager, EngineConfig } from './types/config';
export type { Engine } from './types/engine';
export type { LogEntry, Logger, LogLevel } from './types/logger';
export type { Middleware, MiddlewareContext, MiddlewareNext, MiddlewareRequest, MiddlewareResponse } from './types/middleware';
export type { Plugin, PluginContext, PluginInfo, PluginMetadata, PluginStatus } from './types/plugin';
export { debounce, deepClone, generateId, throttle, createLRUCache, LRUCache, type LRUCacheOptions } from './utils/index';
export { SmartCacheStrategy, createSmartCacheStrategy, type SmartCacheConfig } from './cache/smart-cache';
export { useCache, useConfig, useEngine, useErrorHandler, useEvents, useLogger, useNotification, usePerformance, usePlugins } from './vue/composables';
export declare const version = "1.0.0";
