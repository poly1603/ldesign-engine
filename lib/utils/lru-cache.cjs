/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:09 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
'use strict';

class LRUCache {
  constructor(options) {
    this.head = null;
    this.tail = null;
    this.maxSize = options.maxSize;
    this.onEvict = options.onEvict;
    this.cache = /* @__PURE__ */ new Map();
  }
  /**
   * 获取缓存值
   * @param key 缓存键
   * @returns 缓存值或undefined
   */
  get(key) {
    const node = this.cache.get(key);
    if (!node) {
      return void 0;
    }
    node.hits++;
    node.lastAccess = Date.now();
    this.moveToHead(node);
    return node.value;
  }
  /**
   * 设置缓存值
   * @param key 缓存键
   * @param value 缓存值
   */
  set(key, value) {
    const existingNode = this.cache.get(key);
    if (existingNode) {
      existingNode.value = value;
      existingNode.lastAccess = Date.now();
      this.moveToHead(existingNode);
      return;
    }
    const newNode = {
      key,
      value,
      prev: null,
      next: null,
      hits: 0,
      lastAccess: Date.now()
    };
    this.cache.set(key, newNode);
    this.addToHead(newNode);
    if (this.cache.size > this.maxSize) {
      this.removeTail();
    }
  }
  /**
   * 检查键是否存在
   * @param key 缓存键
   * @returns 是否存在
   */
  has(key) {
    return this.cache.has(key);
  }
  /**
   * 删除缓存项
   * @param key 缓存键
   * @returns 是否删除成功
   */
  delete(key) {
    const node = this.cache.get(key);
    if (!node) {
      return false;
    }
    this.removeNode(node);
    this.cache.delete(key);
    return true;
  }
  /**
   * 清空缓存
   */
  clear() {
    this.cache.clear();
    this.head = null;
    this.tail = null;
  }
  /**
   * 获取缓存大小
   */
  size() {
    return this.cache.size;
  }
  /**
   * 获取所有键
   */
  keys() {
    return Array.from(this.cache.keys());
  }
  /**
   * 获取缓存统计信息
   */
  getStats() {
    const nodes = Array.from(this.cache.values());
    const totalHits = nodes.reduce((sum, node) => sum + node.hits, 0);
    const totalAccess = nodes.length * Math.max(...nodes.map((n) => n.hits), 1);
    const mostUsed = nodes.sort((a, b) => b.hits - a.hits).slice(0, 5).map((node) => ({ key: node.key, hits: node.hits }));
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalAccess > 0 ? totalHits / totalAccess * 100 : 0,
      mostUsed
    };
  }
  /**
   * 将节点移动到头部
   * @private
   */
  moveToHead(node) {
    this.removeNode(node);
    this.addToHead(node);
  }
  /**
   * 添加节点到头部
   * @private
   */
  addToHead(node) {
    node.prev = null;
    node.next = this.head;
    if (this.head) {
      this.head.prev = node;
    }
    this.head = node;
    if (!this.tail) {
      this.tail = node;
    }
  }
  /**
   * 从链表中移除节点
   * @private
   */
  removeNode(node) {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }
    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }
  /**
   * 移除尾部节点（最久未使用）
   * @private
   */
  removeTail() {
    if (!this.tail) {
      return;
    }
    const key = this.tail.key;
    const value = this.tail.value;
    this.removeNode(this.tail);
    this.cache.delete(key);
    if (this.onEvict) {
      this.onEvict(key, value);
    }
  }
  /**
   * 迭代器支持
   */
  *[Symbol.iterator]() {
    let current = this.head;
    while (current) {
      yield [current.key, current.value];
      current = current.next;
    }
  }
}
function createLRUCache(options) {
  return new LRUCache(options);
}

exports.LRUCache = LRUCache;
exports.createLRUCache = createLRUCache;
//# sourceMappingURL=lru-cache.cjs.map
