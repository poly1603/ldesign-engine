/**
 * 统一的引擎应用创建函数
 * 提供单一入口配置和创建整个应用
 */
import type { Component, App as VueApp } from 'vue';
import type { Middleware } from '../types/middleware';
import type { Plugin } from '../types/plugin';
import { type PerformanceBudget, type PerformanceMetric } from '../performance/performance-budget';
import { type ShortcutHandler, type ShortcutOptions } from '../shortcuts/shortcuts-manager';
import { EngineImpl } from './engine';
/**
 * 引擎应用配置选项
 */
export interface EngineAppOptions {
    /**
     * 根组件（可选，如果不提供则只创建引擎实例）
     */
    rootComponent?: Component;
    /**
     * 挂载元素（可选，提供时会自动挂载）
     */
    mountElement?: string | Element;
    /**
     * 基础配置
     */
    config?: {
        /** 应用名称 */
        name?: string;
        /** 应用版本 */
        version?: string;
        /** 是否开启调试模式 */
        debug?: boolean;
        /** 应用描述 */
        description?: string;
        /** 应用环境 */
        environment?: 'development' | 'production' | 'testing';
        /** 其他自定义配置 */
        [key: string]: unknown;
    };
    /**
     * 功能特性开关
     */
    features?: {
        /** 启用热重载 */
        enableHotReload?: boolean;
        /** 启用开发工具 */
        enableDevTools?: boolean;
        /** 启用性能监控 */
        enablePerformanceMonitoring?: boolean;
        /** 启用错误上报 */
        enableErrorReporting?: boolean;
        /** 启用安全防护 */
        enableSecurityProtection?: boolean;
        /** 启用缓存 */
        enableCaching?: boolean;
        /** 启用通知系统 */
        enableNotifications?: boolean;
    };
    /**
     * 日志配置
     */
    logger?: {
        /** 是否启用日志 */
        enabled?: boolean;
        /** 日志级别 */
        level?: 'debug' | 'info' | 'warn' | 'error';
        /** 最大日志数 */
        maxLogs?: number;
        /** 是否显示时间戳 */
        showTimestamp?: boolean;
        /** 是否显示上下文 */
        showContext?: boolean;
        /** 自定义日志前缀 */
        prefix?: string;
    };
    /**
     * 缓存配置
     */
    cache?: {
        /** 是否启用缓存 */
        enabled?: boolean;
        /** 默认缓存大小 */
        maxSize?: number;
        /** 默认TTL（毫秒） */
        defaultTTL?: number;
        /** 清理间隔（毫秒） */
        cleanupInterval?: number;
        /** 是否启用内存限制 */
        enableMemoryLimit?: boolean;
        /** 内存限制（MB） */
        memoryLimit?: number;
    };
    /**
     * 性能监控配置
     */
    performance?: {
        /** 是否启用性能监控 */
        enabled?: boolean;
        /** 采样率 (0-1) */
        sampleRate?: number;
        /** 是否监控内存 */
        monitorMemory?: boolean;
        /** 是否监控网络 */
        monitorNetwork?: boolean;
        /** 是否监控组件性能 */
        monitorComponents?: boolean;
        /** 报告间隔（毫秒） */
        reportInterval?: number;
        /** 性能预算 */
        budget?: PerformanceBudget;
        /** 预算超出回调 */
        onBudgetExceeded?: (metric: PerformanceMetric) => void;
    };
    /**
     * 插件列表
     */
    plugins?: Plugin[];
    /**
     * 中间件列表
     */
    middleware?: Middleware[];
    /**
     * Vue应用配置函数
     * 用于在挂载前配置Vue应用实例
     */
    setupApp?: (app: VueApp) => void | Promise<void>;
    /**
     * 引擎初始化完成回调
     */
    onReady?: (engine: EngineImpl) => void | Promise<void>;
    /**
     * 应用挂载完成回调
     */
    onMounted?: (engine: EngineImpl) => void | Promise<void>;
    /**
     * 错误处理
     */
    onError?: (error: Error, context: string) => void;
    /**
     * 快捷键配置
     */
    shortcuts?: {
        /** 快捷键映射 */
        keys?: Record<string, ShortcutHandler | [ShortcutHandler, ShortcutOptions]>;
        /** 作用域快捷键 */
        scopes?: Record<string, Record<string, ShortcutHandler>>;
        /** 冲突处理模式 */
        conflictMode?: 'error' | 'warn' | 'override';
        /** 是否启用 */
        enabled?: boolean;
    };
}
/**
 * 创建引擎应用
 *
 * 这是引擎的唯一入口函数，通过配置项控制所有功能
 *
 * @param options 引擎应用配置选项
 * @returns 引擎实例
 *
 * @example
 * ```typescript
 * // 最简单的使用
 * const engine = createEngineApp({
 *   rootComponent: App,
 *   mountElement: '#app'
 * })
 *
 * // 完整配置示例
 * const engine = createEngineApp({
 *   rootComponent: App,
 *   mountElement: '#app',
 *   config: {
 *     name: 'My App',
 *     version: '1.0.0',
 *     debug: true
 *   },
 *   features: {
 *     enableHotReload: true,
 *     enablePerformanceMonitoring: true,
 *     enableCaching: true
 *   },
 *   logger: {
 *     enabled: true,
 *     level: 'debug',
 *     maxLogs: 100
 *   },
 *   cache: {
 *     enabled: true,
 *     maxSize: 100,
 *     defaultTTL: 300000
 *   },
 *   performance: {
 *     enabled: true,
 *     sampleRate: 0.5,
 *     monitorMemory: true
 *   },
 *   plugins: [routerPlugin, storePlugin],
 *   middleware: [authMiddleware],
 *   setupApp: async (app) => {
 *     // 自定义Vue应用配置
 *     app.config.performance = true
 *   },
 *   onReady: async (engine) => {
 *
 *   },
 *   onMounted: async (engine) => {
 *
 *   },
 *   onError: (error, context) => {
 *     console.error(`Error in ${context}:`, error)
 *   }
 * })
 * ```
 */
export declare function createEngineApp(options?: EngineAppOptions): Promise<EngineImpl>;
/**
 * 创建引擎应用的简化版本
 * 自动挂载到 #app
 *
 * @param rootComponent 根组件
 * @param options 配置选项（不包括rootComponent和mountElement）
 * @returns 引擎实例
 *
 * @example
 * ```typescript
 * const engine = await createAndMountEngineApp(App, {
 *   config: { debug: true },
 *   plugins: [routerPlugin]
 * })
 * ```
 */
export declare function createAndMountEngineApp(rootComponent: Component, options?: Omit<EngineAppOptions, 'rootComponent' | 'mountElement'>): Promise<EngineImpl>;
