/**
 * @ldesign/engine/core - 核心模块
 *
 * 提供引擎核心功能，不包含 Vue 集成。
 * 适用于需要轻量级引擎或非 Vue 环境的场景。
 */
export { ConfigManagerImpl, createConfigManager } from './config/config-manager';
export { EngineImpl } from './core/engine';
export { createErrorManager } from './errors/error-manager';
export { createEventManager, ENGINE_EVENTS } from './events/event-manager';
export { createLogger } from './logger/logger';
export { createMiddlewareManager } from './middleware/middleware-manager';
export { createPluginManager } from './plugins/plugin-manager';
export { createStateManager } from './state/state-manager';
export type { ConfigManager, Engine, EngineConfig, ErrorManager, EventManager, Logger, LogLevel, Middleware, MiddlewareContext, MiddlewareManager, Plugin, PluginContext, PluginManager, StateManager, } from './types';
export declare const version = "1.0.0";
