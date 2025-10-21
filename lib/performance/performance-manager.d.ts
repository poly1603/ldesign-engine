import type { Engine } from '../types';
export interface PerformanceMetrics {
    timestamp: number;
    duration: number;
    memory?: {
        used: number;
        total: number;
        limit: number;
    };
    network?: {
        latency: number;
        bandwidth: number;
        connectionType?: string;
        requests?: number;
        totalSize?: number;
        averageTime?: number;
    };
    rendering?: {
        fps: number;
        droppedFrames: number;
        renderTime: number;
        frameTime?: number;
    };
    custom?: Record<string, number>;
}
export declare enum PerformanceEventType {
    NAVIGATION = "navigation",
    RESOURCE_LOAD = "resource_load",
    USER_INTERACTION = "user_interaction",
    COMPONENT_RENDER = "component_render",
    API_CALL = "api_call",
    NETWORK = "network",
    RENDER = "render",
    CUSTOM = "custom"
}
export interface PerformanceEvent {
    id: string;
    type: PerformanceEventType;
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    metadata?: Record<string, unknown>;
    metrics?: Partial<PerformanceMetrics>;
}
export interface PerformanceThresholds {
    responseTime?: {
        good: number;
        poor: number;
    };
    fps?: {
        good: number;
        poor: number;
    };
    memory?: {
        warning: number;
        critical: number;
    };
    bundleSize?: {
        warning: number;
        critical: number;
    };
}
export interface PerformanceReport {
    summary: {
        totalEvents: number;
        averageResponseTime: number;
        averageFPS: number;
        memoryUsage: number;
        timeRange: {
            start: number;
            end: number;
        };
    };
    events: PerformanceEvent[];
    metrics: PerformanceMetrics[];
    violations: PerformanceViolation[];
    recommendations: string[];
}
export interface PerformanceViolation {
    type: 'threshold' | 'memory_leak' | 'slow_operation';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    details: unknown;
    timestamp: number;
}
export interface PerformanceManager {
    startEvent: (type: PerformanceEventType, name: string, metadata?: Record<string, unknown>) => string;
    endEvent: (id: string, metadata?: Record<string, unknown>) => void;
    recordEvent: (event: Omit<PerformanceEvent, 'id'>) => string;
    collectMetrics: () => PerformanceMetrics;
    recordMetrics: (metrics: Partial<PerformanceMetrics>) => void;
    startMonitoring: () => void;
    stopMonitoring: () => void;
    isMonitoring: () => boolean;
    getEvents: (filter?: Partial<PerformanceEvent>) => PerformanceEvent[];
    getMetrics: (timeRange?: {
        start: number;
        end: number;
    }) => PerformanceMetrics[];
    getReport: (timeRange?: {
        start: number;
        end: number;
    }) => PerformanceReport;
    setThresholds: (thresholds: Partial<PerformanceThresholds>) => void;
    getThresholds: () => PerformanceThresholds;
    onViolation: (callback: (violation: PerformanceViolation) => void) => void;
    onMetrics: (callback: (metrics: PerformanceMetrics) => void) => void;
    clearData: (olderThan?: number) => void;
    exportData: () => string;
    importData: (data: string) => void;
}
export declare class PerformanceManagerImpl implements PerformanceManager {
    private events;
    private metrics;
    private thresholds;
    private violationCallbacks;
    private metricsCallbacks;
    private monitoring;
    private fpsMonitor;
    private memoryMonitor;
    private performanceObserver?;
    private engine?;
    private eventIdCounter;
    private maxEvents;
    private maxMetrics;
    private destroyed;
    constructor(thresholds?: PerformanceThresholds, engine?: Engine);
    startEvent(type: PerformanceEventType, name: string, metadata?: Record<string, unknown>): string;
    endEvent(id: string, metadata?: Record<string, unknown>): void;
    recordEvent(event: Omit<PerformanceEvent, 'id'>): string;
    collectMetrics(): PerformanceMetrics;
    recordMetrics(metrics: Partial<PerformanceMetrics>): void;
    startMonitoring(): void;
    stopMonitoring(): void;
    isMonitoring(): boolean;
    getEvents(filter?: Partial<PerformanceEvent>): PerformanceEvent[];
    getMetrics(timeRange?: {
        start: number;
        end: number;
    }): PerformanceMetrics[];
    getReport(timeRange?: {
        start: number;
        end: number;
    }): PerformanceReport;
    setThresholds(thresholds: Partial<PerformanceThresholds>): void;
    getThresholds(): PerformanceThresholds;
    onViolation(callback: (violation: PerformanceViolation) => void): void;
    onMetrics(callback: (metrics: PerformanceMetrics) => void): () => void;
    clearData(olderThan?: number): void;
    exportData(): string;
    importData(data: string): void;
    private handlePerformanceEntry;
    private getEventTypeFromEntry;
    private getEntryMetadata;
    private checkThresholdViolations;
    private checkMetricsViolations;
    private reportViolation;
    private getViolations;
    private generateRecommendations;
    updateThresholds(thresholds: Partial<PerformanceThresholds>): void;
    generateReport(timeRange?: {
        start: number;
        end: number;
    }): PerformanceReport;
    mark(name: string): void;
    measure(name: string, startMark?: string, endMark?: string): void;
    getMarks(): PerformanceEntry[];
    getMeasures(): PerformanceEntry[];
    clearEvents(): void;
    clearMetrics(): void;
    clearMarks(): void;
    clearMeasures(): void;
    /**
     * 获取内存趋势分析
     */
    getMemoryTrend(): {
        average: number;
        peak: number;
        current: number;
        trend: 'increasing' | 'stable' | 'decreasing';
    } | null;
    /**
     * 获取内存信息（立即）
     */
    getMemoryInfo(): PerformanceMetrics['memory'] | undefined;
    destroy(): void;
}
export declare function createPerformanceManager(thresholds?: PerformanceThresholds, engine?: Engine): PerformanceManager;
export declare function performance(name?: string): (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function getGlobalPerformanceManager(): PerformanceManager;
export declare function setGlobalPerformanceManager(manager: PerformanceManager): void;
