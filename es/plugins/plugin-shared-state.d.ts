/**
 * Plugin Shared State System
 *
 * Provides reactive state sharing between plugins with:
 * - Namespace isolation
 * - Type safety
 * - Cross-plugin communication
 * - State synchronization
 */
import type { Logger, Plugin } from '../types';
import { type ComputedRef, type Ref, type WatchCallback } from 'vue';
import { ReactiveStateManager } from '../state/reactive-state';
export type AccessLevel = 'private' | 'protected' | 'public';
export interface PluginStateMetadata {
    pluginName: string;
    key: string;
    access: AccessLevel;
    description?: string;
    type?: string;
    readonly?: boolean;
    persist?: boolean;
}
export interface SharedStateEntry<T = unknown> {
    value: Ref<T>;
    metadata: PluginStateMetadata;
    watchers: Set<WatchCallback<T, T>>;
    dependencies: Set<string>;
}
export interface PluginStateContext {
    pluginName: string;
    permissions: Set<string>;
    dependencies: string[];
}
export interface PluginMessage<T = unknown> {
    from: string;
    to: string | '*';
    type: string;
    data: T;
    timestamp: number;
}
/**
 * Plugin Shared State Manager
 *
 * Manages shared state between plugins with proper isolation and access control
 */
export declare class PluginSharedStateManager {
    private logger?;
    private namespaces;
    private sharedStates;
    private pluginContexts;
    private messageBus;
    private messageHandlers;
    private globalComputed;
    constructor(logger?: Logger | undefined);
    /**
     * Register a plugin with the shared state system
     */
    registerPlugin(plugin: Plugin): void;
    /**
     * Unregister a plugin from the shared state system
     */
    unregisterPlugin(pluginName: string): void;
    /**
     * Get a plugin's isolated namespace
     */
    getNamespace(pluginName: string): ReactiveStateManager | undefined;
    /**
     * Create a shared state that can be accessed by other plugins
     */
    createSharedState<T = unknown>(pluginName: string, key: string, initialValue: T, options?: {
        access?: AccessLevel;
        description?: string;
        readonly?: boolean;
        persist?: boolean;
    }): Ref<T>;
    /**
     * Access a shared state from another plugin
     */
    accessSharedState<T = unknown>(requestingPlugin: string, ownerPlugin: string, key: string): Ref<T> | undefined;
    /**
     * Watch a shared state for changes
     */
    watchSharedState<T = unknown>(pluginName: string, ownerPlugin: string, key: string, callback: WatchCallback<T, T>): () => void;
    /**
     * Create a computed state that derives from multiple shared states
     */
    createGlobalComputed<T = unknown>(key: string, getter: () => T, options?: {
        cache?: boolean;
        description?: string;
    }): ComputedRef<T>;
    /**
     * Get a global computed state
     */
    getGlobalComputed<T = unknown>(key: string): ComputedRef<T> | undefined;
    /**
     * Send a message to another plugin or broadcast to all
     */
    sendMessage<T = unknown>(from: string, to: string | '*', type: string, data: T): void;
    /**
     * Subscribe to messages for a plugin
     */
    onMessage(pluginName: string, handler: (message: PluginMessage) => void, filter?: (message: PluginMessage) => boolean): () => void;
    /**
     * Create a reactive bridge between plugins
     */
    createBridge<T = unknown>(sourcePlugin: string, sourceKey: string, targetPlugin: string, targetKey: string, transformer?: (value: T) => unknown): () => void;
    /**
     * Synchronize state between multiple plugins
     */
    synchronize(plugins: string[], key: string, options?: {
        bidirectional?: boolean;
        debounce?: number;
    }): () => void;
    /**
     * Get state dependency graph
     */
    getDependencyGraph(): Record<string, string[]>;
    /**
     * Get state statistics
     */
    getStats(): {
        totalPlugins: number;
        totalSharedStates: number;
        totalGlobalComputed: number;
        totalMessages: number;
        memoryUsage: string;
    };
    private checkAccess;
    private setupPersistence;
    private debounce;
    /**
     * Dispose and clean up all resources
     */
    dispose(): void;
}
/**
 * Create a plugin shared state manager
 */
export declare function createPluginSharedStateManager(logger?: Logger): PluginSharedStateManager;
/**
 * Plugin state composable for Vue components
 */
export declare function usePluginState<T = unknown>(pluginName: string, key: string, defaultValue?: T): {
    state: Ref<T | undefined>;
    setState: (value: T) => void;
    watchState: (callback: WatchCallback<T | undefined, T | undefined>) => () => void;
};
