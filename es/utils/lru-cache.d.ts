/**
 * LRU (Least Recently Used) Cache Implementation
 * 提供高效的LRU缓存，自动淘汰最久未使用的项
 */
export interface LRUCacheOptions {
    maxSize: number;
    onEvict?: (key: string, value: unknown) => void;
}
/**
 * LRU缓存类
 * 使用双向链表+Map实现O(1)时间复杂度的get/set操作
 */
export declare class LRUCache<T = unknown> {
    private maxSize;
    private cache;
    private head;
    private tail;
    private onEvict?;
    constructor(options: LRUCacheOptions);
    /**
     * 获取缓存值
     * @param key 缓存键
     * @returns 缓存值或undefined
     */
    get(key: string): T | undefined;
    /**
     * 设置缓存值
     * @param key 缓存键
     * @param value 缓存值
     */
    set(key: string, value: T): void;
    /**
     * 检查键是否存在
     * @param key 缓存键
     * @returns 是否存在
     */
    has(key: string): boolean;
    /**
     * 删除缓存项
     * @param key 缓存键
     * @returns 是否删除成功
     */
    delete(key: string): boolean;
    /**
     * 清空缓存
     */
    clear(): void;
    /**
     * 获取缓存大小
     */
    size(): number;
    /**
     * 获取所有键
     */
    keys(): string[];
    /**
     * 获取缓存统计信息
     */
    getStats(): {
        size: number;
        maxSize: number;
        hitRate: number;
        mostUsed: Array<{
            key: string;
            hits: number;
        }>;
    };
    /**
     * 将节点移动到头部
     * @private
     */
    private moveToHead;
    /**
     * 添加节点到头部
     * @private
     */
    private addToHead;
    /**
     * 从链表中移除节点
     * @private
     */
    private removeNode;
    /**
     * 移除尾部节点（最久未使用）
     * @private
     */
    private removeTail;
    /**
     * 迭代器支持
     */
    [Symbol.iterator](): Iterator<[string, T]>;
}
/**
 * 创建LRU缓存实例
 */
export declare function createLRUCache<T = unknown>(options: LRUCacheOptions): LRUCache<T>;
