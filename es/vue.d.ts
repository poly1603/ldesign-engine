/**
 * @ldesign/engine/vue - Vue集成模块
 *
 * 提供Vue相关的集成功能
 */
export { commonDirectives, createDirectiveManager } from './directives/directive-manager';
export type { DirectiveManager, EngineDirective, } from './types';
export { useEngine, useEngineAvailable, useEngineConfig, useEngineErrors, useEngineEvents, useEngineLogger, useEngineMiddleware, useEngineNotifications, useEnginePlugins, useEngineState } from './vue/composables';
export { createVueEnginePlugin as LDesignEnginePlugin } from './vue/plugin';
