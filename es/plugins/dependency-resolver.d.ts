/**
 * Plugin Dependency Resolver
 *
 * 提供插件依赖解析功能：
 * - 拓扑排序确定加载顺序
 * - 循环依赖检测
 * - 可选依赖支持
 * - 版本兼容性检查
 * - 依赖图可视化
 */
import type { Logger, Plugin } from '../types';
export type DependencyType = 'required' | 'optional' | 'peer';
export interface VersionRange {
    min?: string;
    max?: string;
    exact?: string;
}
export interface PluginDependency {
    name: string;
    type?: DependencyType;
    version?: string | VersionRange;
    condition?: () => boolean;
}
export interface PluginNode {
    plugin: Plugin;
    dependencies: PluginDependency[];
    dependents: Set<string>;
    depth: number;
    visited: boolean;
    processing: boolean;
}
export interface ResolutionResult {
    success: boolean;
    order?: Plugin[];
    cycles?: string[][];
    missing?: string[];
    incompatible?: Array<{
        plugin: string;
        dependency: string;
        reason: string;
    }>;
    warnings?: string[];
}
export interface DependencyGraph {
    nodes: Map<string, PluginNode>;
    edges: Map<string, Set<string>>;
    roots: Set<string>;
    leaves: Set<string>;
}
/**
 * 插件依赖解析器
 */
export declare class DependencyResolver {
    private logger?;
    private graph;
    private cycles;
    private missing;
    private incompatible;
    constructor(logger?: Logger | undefined);
    /**
     * 解析插件依赖并返回加载顺序
     */
    resolve(plugins: Plugin[]): ResolutionResult;
    /**
     * 构建依赖图
     */
    private buildGraph;
    /**
     * 解析插件依赖
     */
    private parseDependencies;
    /**
     * 检测循环依赖（使用 DFS）
     */
    private detectCycles;
    /**
     * 拓扑排序（使用 Kahn's 算法）
     */
    private topologicalSort;
    /**
     * 计算节点深度
     */
    private calculateDepth;
    /**
     * 检查缺失的依赖
     */
    private checkMissingDependencies;
    /**
     * 检查版本兼容性
     */
    private checkVersionCompatibility;
    /**
     * 检查版本兼容性
     */
    private isVersionCompatible;
    /**
     * 格式化版本要求
     */
    private formatVersionRequirement;
    /**
     * 检查是否只有可选依赖缺失
     */
    private hasOnlyOptionalMissing;
    /**
     * 检查是否是可选依赖
     */
    private isOptionalDependency;
    /**
     * 生成警告信息
     */
    private generateWarnings;
    /**
     * 获取依赖图的可视化表示
     */
    getVisualization(format?: 'mermaid' | 'dot' | 'json'): string;
    /**
     * 转换为 Mermaid 图
     */
    private toMermaid;
    /**
     * 转换为 DOT 图
     */
    private toDot;
    /**
     * 转换为 JSON
     */
    private toJson;
    /**
     * 重置解析器状态
     */
    private reset;
}
/**
 * 创建依赖解析器实例
 */
export declare function createDependencyResolver(logger?: Logger): DependencyResolver;
