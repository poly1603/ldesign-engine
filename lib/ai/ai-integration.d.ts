/**
 * AI 集成模块
 * 支持多种 AI 提供商，提供智能分析、代码优化、错误诊断等功能
 */
import type { Engine } from '../types';
export interface AIConfig {
    provider: AIProvider;
    apiKey?: string;
    endpoint?: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    features?: AIFeatures;
    cache?: boolean;
    timeout?: number;
}
export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'azure' | 'local' | 'custom';
export interface AIFeatures {
    codeGeneration?: boolean;
    codeOptimization?: boolean;
    errorAnalysis?: boolean;
    performanceOptimization?: boolean;
    securityAnalysis?: boolean;
    documentation?: boolean;
    testing?: boolean;
    translation?: boolean;
}
export interface AIAnalysisResult {
    suggestions: AISuggestion[];
    confidence: number;
    reasoning?: string;
    metadata?: Record<string, unknown>;
}
export interface AISuggestion {
    type: 'error' | 'warning' | 'optimization' | 'security' | 'style';
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    code?: string;
    diff?: string;
    fix?: () => Promise<void>;
    learnMore?: string;
}
export interface CodeAnalysisRequest {
    code: string;
    language?: string;
    context?: string;
    intent?: string;
    rules?: string[];
}
export interface ErrorAnalysisRequest {
    error: Error;
    context?: Record<string, unknown>;
    stackTrace?: string;
    previousFixes?: string[];
}
export interface PerformanceAnalysisRequest {
    metrics: Record<string, number>;
    code?: string;
    threshold?: Record<string, number>;
}
export declare class AIIntegration {
    private config;
    private provider?;
    private cache;
    private engine?;
    private logger?;
    private requestQueue;
    private isProcessing;
    private rateLimiter;
    constructor(config: AIConfig, engine?: Engine);
    private initializeProvider;
    /**
     * 分析代码并提供优化建议
     */
    analyzeCode(request: CodeAnalysisRequest): Promise<AIAnalysisResult>;
    /**
     * 分析错误并提供修复建议
     */
    analyzeError(request: ErrorAnalysisRequest): Promise<AIAnalysisResult>;
    /**
     * 优化性能
     */
    optimizePerformance(request: PerformanceAnalysisRequest): Promise<AIAnalysisResult>;
    /**
     * 生成代码
     */
    generateCode(description: string, language?: string, context?: string): Promise<string>;
    /**
     * 生成文档
     */
    generateDocumentation(code: string, format?: string): Promise<string>;
    /**
     * 生成测试
     */
    generateTests(code: string, framework?: string): Promise<string>;
    /**
     * 安全分析
     */
    analyzeSecuirty(code: string): Promise<AIAnalysisResult>;
    /**
     * 智能代码补全
     */
    autocomplete(code: string, cursorPosition: number, maxSuggestions?: number): Promise<string[]>;
    /**
     * 代码重构建议
     */
    suggestRefactoring(code: string): Promise<AIAnalysisResult>;
    private buildCodeAnalysisPrompt;
    private buildErrorAnalysisPrompt;
    private buildPerformancePrompt;
    private parseAnalysisResponse;
    private parseTextResponse;
    private extractCodeFromResponse;
    private parseCompletions;
    private createErrorFix;
    private getCacheKey;
    private hashString;
    private executeWithRateLimit;
    private processQueue;
    private waitForToken;
    private refillTokens;
    private createOpenAIProvider;
    private createAnthropicProvider;
    private createGeminiProvider;
    private createLocalProvider;
    /**
     * 配置 AI 提供商
     */
    configure(config: Partial<AIConfig>): void;
    /**
     * 清除缓存
     */
    clearCache(): void;
    /**
     * 获取使用统计
     */
    getStats(): {
        provider: string;
        cacheSize: number;
        queueLength: number;
        rateLimitStatus: {
            tokens: number;
            maxTokens: number;
        };
    };
    /**
     * 销毁
     */
    destroy(): void;
}
export declare function createAIIntegration(config: AIConfig, engine?: Engine): AIIntegration;
