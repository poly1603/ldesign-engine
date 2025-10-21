/**
 * Vue DevTools 集成
 *
 * 提供与 Vue DevTools 的深度集成,允许在开发工具中查看和调试引擎状态
 */
import type { App } from 'vue';
import type { Engine } from '../types';
export interface DevToolsTimelineEvent {
    time: number;
    title: string;
    subtitle?: string;
    data?: Record<string, unknown>;
    groupId?: string;
    logType?: 'default' | 'warning' | 'error';
}
export interface DevToolsInspectorState {
    key: string;
    value: unknown;
    editable?: boolean;
    type?: string;
}
export interface DevToolsInspectorTreeNode {
    id: string;
    label: string;
    children?: DevToolsInspectorTreeNode[];
}
export interface DevToolsOptions {
    /**
     * 是否启用 DevTools 集成
     * @default process.env.NODE_ENV !== 'production'
     */
    enabled?: boolean;
    /**
     * 时间线事件的最大数量
     * @default 1000
     */
    maxTimelineEvents?: number;
    /**
     * 是否记录性能事件
     * @default true
     */
    trackPerformance?: boolean;
    /**
     * 是否记录状态变化
     * @default true
     */
    trackStateChanges?: boolean;
    /**
     * 是否记录错误
     * @default true
     */
    trackErrors?: boolean;
}
/**
 * DevTools 集成管理器
 */
export declare class DevToolsIntegration {
    private logger;
    private app?;
    private engine?;
    private options;
    private timelineEvents;
    private devtoolsApi;
    constructor(options?: DevToolsOptions);
    /**
     * 初始化 DevTools 集成
     */
    init(app: App, engine: Engine): void;
    /**
     * 设置 DevTools
     */
    private setupDevTools;
    /**
     * 注册自定义检查器
     */
    private registerInspector;
    /**
     * 注册时间线层
     */
    private registerTimeline;
    /**
     * 设置事件监听
     */
    private setupEventListeners;
    /**
     * 获取检查器树
     */
    private getInspectorTree;
    /**
     * 获取检查器状态
     */
    private getInspectorState;
    /**
     * 获取配置状态
     */
    private getConfigState;
    /**
     * 获取状态状态
     */
    private getStateState;
    /**
     * 获取性能状态
     */
    private getPerformanceState;
    /**
     * 获取错误状态
     */
    private getErrorsState;
    /**
     * 编辑检查器状态
     */
    private editInspectorState;
    /**
     * 添加时间线事件
     */
    addTimelineEvent(layerId: string, event: DevToolsTimelineEvent): void;
    /**
     * 销毁 DevTools 集成
     */
    destroy(): void;
}
/**
 * 创建 DevTools 集成实例
 */
export declare function createDevToolsIntegration(options?: DevToolsOptions): DevToolsIntegration;
