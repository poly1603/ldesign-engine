import type { Logger } from '../types';
export type Environment = 'development' | 'production' | 'test';
export type Platform = 'browser' | 'node' | 'webworker' | 'electron' | 'unknown';
export type Browser = 'chrome' | 'firefox' | 'safari' | 'edge' | 'ie' | 'opera' | 'unknown';
export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown';
export interface EnvironmentInfo {
    environment: Environment;
    platform: Platform;
    browser: {
        name: Browser;
        version: string;
        userAgent: string;
    };
    device: {
        type: DeviceType;
        isMobile: boolean;
        isTablet: boolean;
        isDesktop: boolean;
        isTouchDevice: boolean;
    };
    features: {
        hasLocalStorage: boolean;
        hasSessionStorage: boolean;
        hasIndexedDB: boolean;
        hasWebWorkers: boolean;
        hasServiceWorkers: boolean;
        hasWebGL: boolean;
        hasWebGL2: boolean;
        hasWebAssembly: boolean;
        hasOnlineDetection: boolean;
        hasNetworkInformation: boolean;
        hasPerformanceAPI: boolean;
        hasIntersectionObserver: boolean;
        hasMutationObserver: boolean;
        hasResizeObserver: boolean;
        hasMediaDevices: boolean;
        hasGetUserMedia: boolean;
        hasClipboardAPI: boolean;
        hasNotificationAPI: boolean;
        hasGeolocationAPI: boolean;
    };
    performance: {
        memory?: {
            used: number;
            total: number;
            limit: number;
        };
        connection?: {
            effectiveType: string;
            downlink: number;
            rtt: number;
            saveData: boolean;
        };
    };
    screen: {
        width: number;
        height: number;
        availWidth: number;
        availHeight: number;
        colorDepth: number;
        pixelRatio: number;
        orientation?: string;
    };
    timezone: {
        name: string;
        offset: number;
        dst: boolean;
    };
}
export interface EnvironmentAdaptation {
    fallbacks: {
        storage: 'memory' | 'cookie' | 'none';
        animation: 'css' | 'js' | 'none';
        networking: 'fetch' | 'xhr' | 'none';
    };
    optimizations: {
        enableLazyLoading: boolean;
        enableCodeSplitting: boolean;
        enableImageOptimization: boolean;
        enableCaching: boolean;
        maxConcurrentRequests: number;
    };
    compatibility: {
        enablePolyfills: boolean;
        supportedBrowsers: string[];
        minimumVersions: Record<string, string>;
    };
}
export interface EnvironmentManager {
    detect: () => EnvironmentInfo;
    getEnvironment: () => Environment;
    getPlatform: () => Platform;
    getBrowser: () => {
        name: Browser;
        version: string;
    };
    getDevice: () => {
        type: DeviceType;
        isMobile: boolean;
    };
    hasFeature: (feature: string) => boolean;
    getFeatures: () => Record<string, boolean>;
    checkCompatibility: (requirements: Record<string, unknown>) => boolean;
    getAdaptation: () => EnvironmentAdaptation;
    setAdaptation: (adaptation: Partial<EnvironmentAdaptation>) => void;
    adaptForEnvironment: (env: EnvironmentInfo) => EnvironmentAdaptation;
    getPerformanceInfo: () => EnvironmentInfo['performance'];
    monitorPerformance: (callback: (info: EnvironmentInfo['performance']) => void) => void;
    onEnvironmentChange: (callback: (info: EnvironmentInfo) => void) => () => void;
    onFeatureChange: (feature: string, callback: (available: boolean) => void) => () => void;
}
export declare class EnvironmentManagerImpl implements EnvironmentManager {
    private environmentInfo;
    private adaptation;
    private changeListeners;
    private featureListeners;
    private logger?;
    constructor(logger?: Logger);
    detect(): EnvironmentInfo;
    getEnvironment(): Environment;
    getPlatform(): Platform;
    getBrowser(): {
        name: Browser;
        version: string;
    };
    getDevice(): {
        type: DeviceType;
        isMobile: boolean;
    };
    hasFeature(feature: string): boolean;
    getFeatures(): Record<string, boolean>;
    checkCompatibility(requirements: {
        browser?: Partial<Record<Browser, string>>;
        features?: string[];
    }): boolean;
    getAdaptation(): EnvironmentAdaptation;
    setAdaptation(adaptation: Partial<EnvironmentAdaptation>): void;
    adaptForEnvironment(env: EnvironmentInfo): EnvironmentAdaptation;
    getPerformanceInfo(): EnvironmentInfo['performance'];
    monitorPerformance(callback: (info: EnvironmentInfo['performance']) => void): void;
    onEnvironmentChange(callback: (info: EnvironmentInfo) => void): () => void;
    onFeatureChange(feature: string, callback: (available: boolean) => void): () => void;
    private detectEnvironment;
    private detectEnv;
    private detectPlatform;
    private detectBrowser;
    private detectDevice;
    private detectFeatures;
    private detectPerformanceInfo;
    private detectScreenInfo;
    private detectTimezone;
    private checkWebGL;
    private checkWebGL2;
    private createDefaultAdaptation;
    private setupEnvironmentListeners;
    private handleEnvironmentChange;
    private isVersionCompatible;
}
export declare function createEnvironmentManager(logger?: Logger): EnvironmentManager;
export declare function getGlobalEnvironmentManager(): EnvironmentManager;
export declare function setGlobalEnvironmentManager(manager: EnvironmentManager): void;
