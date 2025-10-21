import type { Logger } from '../types';
export interface ManagerStatus {
    name: string;
    initialized: boolean;
    initTime?: number;
    dependencies: string[];
    dependents: string[];
    lazy: boolean;
    error?: Error;
}
export declare class ManagerRegistry {
    private managers;
    private initOrder;
    private logger?;
    constructor(logger?: Logger);
    register(name: string, dependencies?: string[], lazy?: boolean): void;
    markInitialized(name: string, error?: Error): void;
    checkDependencies(name: string): {
        satisfied: boolean;
        missing: string[];
    };
    getInitializationOrder(): string[];
    getStatus(name: string): ManagerStatus | undefined;
    getAllStatus(): ManagerStatus[];
    getInitializationStats(): {
        total: number;
        initialized: number;
        failed: number;
        lazy: number;
        initOrder: string[];
        averageInitTime: number;
    };
    /**
     * 验证依赖关系图的完整性
     */
    validateDependencyGraph(): {
        valid: boolean;
        errors: string[];
        warnings?: string[];
    };
    generateDependencyGraph(): string;
    clear(): void;
}
export declare function getGlobalManagerRegistry(): ManagerRegistry;
export declare function setGlobalManagerRegistry(registry: ManagerRegistry): void;
export declare function Manager(name: string, dependencies?: string[], lazy?: boolean): <T extends new (...args: any[]) => object>(constructor: T) => {
    new (...args: any[]): {};
} & T;
