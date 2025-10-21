/**
 * Virtual Scrolling System
 *
 * 高性能虚拟滚动和组件懒加载系统
 * - 虚拟列表渲染
 * - 动态高度支持
 * - 组件懒加载
 * - 资源预加载
 * - 滚动性能优化
 */
import type { Logger } from '../types';
import { type Component, type ComputedRef, type Ref } from 'vue';
export interface VirtualItem<T = any> {
    index: number;
    data: T;
    offset: number;
    size: number;
    visible: boolean;
}
export interface VirtualScrollConfig {
    itemHeight?: number | ((index: number, item: any) => number);
    buffer?: number;
    overscan?: number;
    horizontal?: boolean;
    pageMode?: boolean;
    preloadTime?: number;
    estimateSize?: number;
    keepAlive?: boolean;
    threshold?: number;
    bidirectional?: boolean;
    adaptiveBuffer?: boolean;
    minBuffer?: number;
    maxBuffer?: number;
}
export interface ScrollState {
    offset: number;
    clientSize: number;
    scrollSize: number;
    startIndex: number;
    endIndex: number;
    visibleItems: number;
}
export interface LazyComponentConfig {
    loading?: Component;
    error?: Component;
    delay?: number;
    timeout?: number;
    retries?: number;
    preload?: boolean;
    distance?: number;
}
/**
 * 虚拟滚动管理器
 */
export declare class VirtualScroller<T = any> {
    private logger?;
    private items;
    private scrollOffset;
    private clientSize;
    private scrollSize;
    private isScrolling;
    private sizeCache;
    private offsetCache;
    private cacheAccessOrder;
    private readonly maxCacheSize;
    private lastMeasuredIndex;
    private config;
    readonly visibleRange: ComputedRef<{
        start: number;
        end: number;
    }>;
    readonly visibleItems: ComputedRef<VirtualItem<T>[]>;
    readonly scrollState: ComputedRef<ScrollState>;
    private scrollTimer;
    private rafId;
    private lastScrollTime;
    private scrollVelocity;
    constructor(config?: VirtualScrollConfig, logger?: Logger | undefined);
    /**
     * 设置数据项
     */
    setItems(items: T[]): void;
    /**
     * 更新容器尺寸
     */
    updateSize(clientSize: number): void;
    /**
     * 处理滚动事件
     */
    handleScroll(offset: number): void;
    /**
     * 滚动到指定索引
     */
    scrollToIndex(index: number, align?: 'start' | 'center' | 'end' | 'auto'): void;
    /**
     * 平滑滚动
     */
    private smoothScrollTo;
    /**
     * 缓动函数
     */
    private easeInOutCubic;
    /**
     * 计算可见范围（支持自适应缓冲区）
     */
    private calculateVisibleRange;
    /**
     * 二分查找最近的索引
     */
    private findNearestIndex;
    /**
     * 获取可见项
     */
    private getVisibleItems;
    /**
     * 获取项大小
     */
    private getItemSize;
    /**
     * 获取项偏移
     */
    private getItemOffset;
    /**
     * 更新滚动尺寸
     */
    private updateScrollSize;
    /**
     * 预测性预加载
     */
    private predictivePreload;
    /**
     * 获取滚动状态
     */
    private getScrollState;
    /**
     * 重置缓存
     */
    private resetCache;
    /**
     * 更新缓存访问顺序 (LRU)
     */
    private updateCacheAccess;
    /**
     * 设置缓存并进行LRU驱逐
     */
    private setCacheWithEviction;
    /**
     * 清理远离当前视口的缓存
     */
    private cleanupDistantCache;
    /**
     * 更新项大小
     */
    updateItemSize(index: number, size: number): void;
    /**
     * 销毁
     */
    dispose(): void;
}
/**
 * 组件懒加载器
 */
export declare class ComponentLazyLoader {
    private config;
    private logger?;
    private loadedComponents;
    private loadingComponents;
    private componentCache;
    private observers;
    private readonly maxCacheSize;
    private loadTimeouts;
    constructor(config?: LazyComponentConfig, logger?: Logger | undefined);
    /**
     * 懒加载组件
     */
    loadComponent(loader: () => Promise<Component>, key: string): Promise<Component>;
    /**
     * 带重试的加载
     */
    private loadWithRetry;
    /**
     * Clear timeout helper
     */
    private clearTimeout;
    /**
     * 观察元素并自动加载
     */
    observe(element: Element, loader: () => Promise<Component>, key: string): void;
    /**
     * 预加载组件
     */
    preload(loaders: Array<{
        key: string;
        loader: () => Promise<Component>;
    }>): Promise<void>;
    /**
     * 获取加载状态
     */
    getLoadStatus(): {
        loaded: string[];
        loading: string[];
        cached: number;
    };
    /**
     * 清理缓存
     */
    clearCache(keys?: string[]): void;
    /**
     * 销毁
     */
    dispose(): void;
}
/**
 * 资源预加载器
 */
export declare class ResourcePreloader {
    private logger?;
    private preloadedResources;
    private preloadQueue;
    private isPreloading;
    private concurrentLoads;
    constructor(logger?: Logger | undefined);
    /**
     * 预加载资源
     */
    preload(resources: Array<{
        url: string;
        type: 'image' | 'script' | 'style' | 'font' | 'data';
        priority?: number;
    }>): Promise<void>;
    /**
     * 处理预加载队列
     */
    private processQueue;
    /**
     * 加载单个资源
     */
    private loadResource;
    /**
     * 预加载图片
     */
    private preloadImage;
    /**
     * 预加载脚本
     */
    private preloadScript;
    /**
     * 预加载样式
     */
    private preloadStyle;
    /**
     * 预加载字体
     */
    private preloadFont;
    /**
     * 预加载数据
     */
    private preloadData;
    /**
     * 检查资源是否已预加载
     */
    isPreloaded(url: string): boolean;
    /**
     * 获取预加载状态
     */
    getStatus(): {
        preloaded: number;
        queued: number;
        isPreloading: boolean;
    };
}
/**
 * Vue 组合式 API
 */
export declare function useVirtualScroll<T = any>(items: Ref<T[]>, config?: VirtualScrollConfig): {
    scroller: VirtualScroller<T>;
    visibleItems: ComputedRef<VirtualItem<T>[]>;
    scrollState: ComputedRef<ScrollState>;
    handleScroll: (offset: number) => void;
    scrollToIndex: (index: number, align?: 'start' | 'center' | 'end' | 'auto') => void;
};
/**
 * 创建组件懒加载器
 */
export declare function createComponentLazyLoader(config?: LazyComponentConfig, logger?: Logger): ComponentLazyLoader;
/**
 * 创建资源预加载器
 */
export declare function createResourcePreloader(logger?: Logger): ResourcePreloader;
