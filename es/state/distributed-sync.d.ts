/**
 * Distributed State Synchronization System
 *
 * 分布式状态同步系统，支持：
 * - 多标签页/窗口同步 (BroadcastChannel)
 * - WebSocket 实时同步
 * - WebRTC P2P 同步
 * - 冲突解决策略
 * - 离线支持和重连机制
 */
import type { Logger } from '../types';
import { type ComputedRef, type Ref } from 'vue';
export type SyncStrategy = 'last-write-wins' | 'first-write-wins' | 'merge' | 'custom';
export type TransportType = 'broadcast' | 'websocket' | 'webrtc' | 'shared-worker';
export interface SyncMessage {
    id: string;
    type: 'state' | 'patch' | 'sync' | 'ack' | 'heartbeat';
    source: string;
    timestamp: number;
    data: any;
    version?: number;
    checksum?: string;
}
export interface SyncConfig {
    id?: string;
    transports?: TransportType[];
    strategy?: SyncStrategy;
    heartbeatInterval?: number;
    reconnectDelay?: number;
    maxReconnectAttempts?: number;
    conflictResolver?: (local: any, remote: any) => any;
    compress?: boolean;
    encrypt?: boolean;
    encryptionKey?: string;
    websocketUrl?: string;
    signalingServer?: string;
    iceServers?: RTCIceServer[];
    roomId?: string;
}
export interface SyncStatus {
    connected: boolean;
    syncing: boolean;
    lastSync: number;
    peers: number;
    errors: number;
    latency: number;
}
/**
 * 分布式状态同步管理器
 */
export declare class DistributedSync {
    private config;
    private logger?;
    private transports;
    private localState;
    private remoteState;
    private syncStatus;
    private syncQueue;
    private isSyncing;
    private version;
    private peerId;
    private listeners;
    constructor(config?: SyncConfig, logger?: Logger | undefined);
    /**
     * 初始化传输层
     */
    private initialize;
    /**
     * 创建传输实例
     */
    private createTransport;
    /**
     * 设置传输层
     */
    private setupTransport;
    /**
     * 设置状态值
     */
    set(key: string, value: any): Promise<void>;
    /**
     * 获取状态值
     */
    get<T = any>(key: string): T | undefined;
    /**
     * 批量更新状态
     */
    batch(updates: Record<string, any>): Promise<void>;
    /**
     * 监听状态变化
     */
    watch(key: string, callback: (value: any, oldValue: any) => void): () => void;
    /**
     * 全量同步
     */
    sync(): Promise<void>;
    /**
     * 广播消息
     */
    private broadcast;
    /**
     * 处理远程消息
     */
    private handleRemoteMessage;
    /**
     * 处理状态更新
     */
    private handleStateUpdate;
    /**
     * 处理批量更新
     */
    private handlePatchUpdate;
    /**
     * 处理同步请求
     */
    private handleSyncRequest;
    /**
     * 处理确认消息
     */
    private handleAck;
    /**
     * 解决冲突
     */
    private resolveConflict;
    /**
     * 发送确认消息
     */
    private sendAck;
    /**
     * 通知监听器
     */
    private notifyListeners;
    /**
     * 更新连接状态
     */
    private updateConnectionStatus;
    /**
     * 生成消息 ID
     */
    private generateMessageId;
    /**
     * 生成对等节点 ID
     */
    private generatePeerId;
    /**
     * 获取同步状态
     */
    getStatus(): SyncStatus;
    /**
     * 获取所有状态
     */
    getState(): Record<string, any>;
    /**
     * 清空状态
     */
    clear(): void;
    /**
     * 销毁
     */
    dispose(): Promise<void>;
}
/**
 * Vue 组合式 API
 */
export declare function useDistributedSync(config?: SyncConfig): {
    sync: DistributedSync;
    state: ComputedRef<Record<string, any>>;
    status: Ref<SyncStatus>;
    set: (key: string, value: any) => Promise<void>;
    get: <T = any>(key: string) => T | undefined;
    watch: (key: string, callback: (value: any, oldValue: any) => void) => () => void;
};
/**
 * 创建分布式同步实例
 */
export declare function createDistributedSync(config?: SyncConfig, logger?: Logger): DistributedSync;
