import type { Component } from 'vue';
import type { ErrorHandler, ErrorInfo, ErrorManager, Logger } from '../types';
import type { Engine } from '../types/engine';
export interface RecoveryStrategy {
    name?: string;
    canRecover: (error: ErrorInfo | Error) => boolean;
    recover: (error: ErrorInfo | Error, context?: ErrorContext) => Promise<boolean>;
    priority: number;
    maxAttempts?: number;
}
export interface ErrorContext {
    component?: string | Component | unknown;
    module?: string;
    action?: string;
    user?: string;
    timestamp?: number;
    environment?: Record<string, unknown>;
    stack?: string;
    data?: unknown;
    info?: string;
}
export interface ErrorReport {
    id: string;
    error: Error | ErrorInfo;
    context: ErrorContext;
    handled: boolean;
    recovered: boolean;
    attempts: number;
    timestamp: number;
    fingerprint: string;
}
export interface ErrorStatistics {
    total: number;
    handled: number;
    recovered: number;
    byType: Map<string, number>;
    byModule: Map<string, number>;
    byCategory: Map<string, number>;
    timeline: Array<{
        time: number;
        count: number;
    }>;
    recent24h: number;
    recentHour: number;
}
export type ErrorFilter = (error: Error | ErrorInfo) => boolean;
export declare enum ErrorCategory {
    NETWORK = "network",
    COMPONENT = "component",
    PLUGIN = "plugin",
    STATE = "state",
    SECURITY = "security",
    PERFORMANCE = "performance",
    UNKNOWN = "unknown"
}
export declare class ErrorManagerImpl implements ErrorManager {
    private errorHandlers;
    private errors;
    private errorReports;
    private maxErrors;
    private maxReports;
    private maxErrorCounts;
    private maxErrorTypes;
    private errorCounts;
    private statistics;
    private recoveryStrategies;
    private filters;
    private lastErrorTime;
    private errorBurst;
    private reportingEndpoint?;
    private errorQueue;
    private isReporting;
    private batchReportInterval;
    private cleanupTimer;
    private globalErrorHandler;
    private unhandledRejectionHandler;
    private engine?;
    private logger?;
    constructor(engineOrLogger?: Engine | Logger);
    onError(handler: ErrorHandler): void;
    offError(handler: ErrorHandler): void;
    captureError(error: Error, component?: unknown, info?: string): void;
    private addError;
    private notifyHandlers;
    getErrors(): ErrorInfo[];
    hasErrors(): boolean;
    clearErrors(): void;
    handle(error: Error, context?: string): void;
    setMaxErrors(max: number): void;
    getMaxErrors(): number;
    getErrorsByLevel(level: ErrorInfo['level']): ErrorInfo[];
    getErrorsByTimeRange(startTime: number, endTime: number): ErrorInfo[];
    getRecentErrors(count: number): ErrorInfo[];
    searchErrors(query: string): ErrorInfo[];
    getErrorStats(): {
        total: number;
        byLevel: Record<string, number>;
        recent24h: number;
        recentHour: number;
    };
    exportErrors(format?: 'json' | 'csv'): string;
    createErrorReport(): {
        summary: ReturnType<ErrorManagerImpl['getErrorStats']>;
        recentErrors: ErrorInfo[];
        topErrors: Array<{
            message: string;
            count: number;
        }>;
    };
    private initStatistics;
    private setupGlobalHandlers;
    private setupDefaultRecoveryStrategies;
    private detectErrorBurst;
    private categorizeError;
    private updateErrorStats;
    private attemptRecovery;
    getCategoryStats(): Record<ErrorCategory, number>;
    private generateErrorFingerprint;
    private startCleanupTimer;
    private stopCleanupTimer;
    private cleanupOldData;
    private removeGlobalHandlers;
    destroy(): void;
}
export declare function createErrorManager(logger?: Logger): ErrorManager;
export declare const errorHandlers: {
    console: (errorInfo: ErrorInfo) => void;
    notification: (notificationManager: {
        show: (options: {
            type: string;
            title: string;
            message: string;
            duration?: number;
        }) => void;
    }) => (errorInfo: ErrorInfo) => void;
    remote: (config: {
        endpoint: string;
        apiKey?: string;
    }) => (errorInfo: ErrorInfo) => Promise<void>;
    localStorage: (key?: string) => (errorInfo: ErrorInfo) => void;
};
export declare function createErrorBoundary(errorManager: ErrorManager): {
    name: string;
    data(): {
        hasError: boolean;
        error: Error | null;
    };
    errorCaptured(error: Error, component: Component, info: string): boolean;
    render(): unknown;
};
