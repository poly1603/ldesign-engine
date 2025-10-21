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

var vue = require('vue');

class VirtualScroller {
  constructor(config = {}, logger) {
    this.logger = logger;
    this.items = vue.shallowRef([]);
    this.scrollOffset = vue.ref(0);
    this.clientSize = vue.ref(0);
    this.scrollSize = vue.ref(0);
    this.isScrolling = vue.ref(false);
    this.sizeCache = /* @__PURE__ */ new Map();
    this.offsetCache = /* @__PURE__ */ new Map();
    this.cacheAccessOrder = /* @__PURE__ */ new Set();
    this.maxCacheSize = 1e3;
    this.lastMeasuredIndex = -1;
    this.scrollTimer = null;
    this.rafId = null;
    this.lastScrollTime = 0;
    this.scrollVelocity = 0;
    this.config = {
      itemHeight: 50,
      buffer: 5,
      overscan: 3,
      horizontal: false,
      pageMode: false,
      preloadTime: 50,
      estimateSize: 50,
      keepAlive: false,
      threshold: 0.1,
      bidirectional: config.bidirectional ?? false,
      adaptiveBuffer: config.adaptiveBuffer ?? true,
      minBuffer: config.minBuffer || 3,
      maxBuffer: config.maxBuffer || 10,
      ...config
    };
    this.visibleRange = vue.computed(() => this.calculateVisibleRange());
    this.visibleItems = vue.computed(() => this.getVisibleItems());
    this.scrollState = vue.computed(() => this.getScrollState());
    this.logger?.debug("Virtual scroller initialized", this.config);
  }
  /**
   * 设置数据项
   */
  setItems(items) {
    this.items.value = items;
    this.resetCache();
    this.updateScrollSize();
  }
  /**
   * 更新容器尺寸
   */
  updateSize(clientSize) {
    this.clientSize.value = clientSize;
  }
  /**
   * 处理滚动事件
   */
  handleScroll(offset) {
    const now = Date.now();
    const timeDelta = now - this.lastScrollTime;
    if (timeDelta > 0) {
      const offsetDelta = offset - this.scrollOffset.value;
      this.scrollVelocity = offsetDelta / timeDelta;
    }
    this.scrollOffset.value = offset;
    this.lastScrollTime = now;
    this.isScrolling.value = true;
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
      this.scrollTimer = null;
    }
    this.scrollTimer = setTimeout(() => {
      this.isScrolling.value = false;
      this.scrollVelocity = 0;
      this.cleanupDistantCache();
      this.scrollTimer = null;
    }, 150);
    if (Math.abs(this.scrollVelocity) > 0.5) {
      this.predictivePreload();
    }
  }
  /**
   * 滚动到指定索引
   */
  scrollToIndex(index, align = "auto") {
    const targetOffset = this.getItemOffset(index);
    const itemSize = this.getItemSize(index);
    let offset = targetOffset;
    switch (align) {
      case "center":
        offset = targetOffset - (this.clientSize.value - itemSize) / 2;
        break;
      case "end":
        offset = targetOffset - this.clientSize.value + itemSize;
        break;
      case "auto": {
        const currentOffset = this.scrollOffset.value;
        const currentEnd = currentOffset + this.clientSize.value;
        if (targetOffset < currentOffset) {
          offset = targetOffset;
        } else if (targetOffset + itemSize > currentEnd) {
          offset = targetOffset - this.clientSize.value + itemSize;
        } else {
          return;
        }
        break;
      }
    }
    this.smoothScrollTo(Math.max(0, offset));
  }
  /**
   * 平滑滚动
   */
  smoothScrollTo(target) {
    const start = this.scrollOffset.value;
    const distance = target - start;
    const duration = Math.min(500, Math.abs(distance) * 2);
    const startTime = Date.now();
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeProgress = this.easeInOutCubic(progress);
      const currentOffset = start + distance * easeProgress;
      this.scrollOffset.value = currentOffset;
      if (progress < 1) {
        this.rafId = requestAnimationFrame(animate);
      }
    };
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    animate();
  }
  /**
   * 缓动函数
   */
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 + 4 * (t - 1) * (t - 1) * (t - 1);
  }
  /**
   * 计算可见范围（支持自适应缓冲区）
   */
  calculateVisibleRange() {
    let { buffer, overscan } = this.config;
    const { adaptiveBuffer, minBuffer, maxBuffer, bidirectional } = this.config;
    const scrollTop = this.scrollOffset.value;
    const clientHeight = this.clientSize.value;
    if (adaptiveBuffer) {
      const velocity = Math.abs(this.scrollVelocity);
      if (velocity > 2) {
        buffer = Math.min(maxBuffer, buffer + Math.floor(velocity));
      } else if (velocity < 0.5) {
        buffer = Math.max(minBuffer, buffer - 1);
      }
    }
    let startIndex = this.findNearestIndex(scrollTop);
    let endIndex = this.findNearestIndex(scrollTop + clientHeight);
    if (bidirectional || this.scrollVelocity < 0) {
      startIndex = Math.max(0, startIndex - buffer - overscan);
      endIndex = Math.min(this.items.value.length - 1, endIndex + buffer + overscan);
    } else {
      startIndex = Math.max(0, startIndex - Math.floor(buffer / 2) - overscan);
      endIndex = Math.min(this.items.value.length - 1, endIndex + buffer * 2 + overscan);
    }
    return { start: startIndex, end: endIndex };
  }
  /**
   * 二分查找最近的索引
   */
  findNearestIndex(offset) {
    const items = this.items.value;
    let low = 0;
    let high = items.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const midOffset = this.getItemOffset(mid);
      if (midOffset < offset) {
        low = mid + 1;
      } else if (midOffset > offset) {
        high = mid - 1;
      } else {
        return mid;
      }
    }
    return low;
  }
  /**
   * 获取可见项
   */
  getVisibleItems() {
    const { start, end } = this.visibleRange.value;
    const items = [];
    for (let i = start; i <= end; i++) {
      const item = this.items.value[i];
      if (!item)
        continue;
      items.push({
        index: i,
        data: item,
        offset: this.getItemOffset(i),
        size: this.getItemSize(i),
        visible: true
      });
    }
    return items;
  }
  /**
   * 获取项大小
   */
  getItemSize(index) {
    if (this.sizeCache.has(index)) {
      this.updateCacheAccess(index);
      return this.sizeCache.get(index);
    }
    const { itemHeight, estimateSize } = this.config;
    if (typeof itemHeight === "function") {
      const item = this.items.value[index];
      const size = itemHeight(index, item) || estimateSize;
      this.setCacheWithEviction(index, size, "size");
      return size;
    }
    return itemHeight;
  }
  /**
   * 获取项偏移
   */
  getItemOffset(index) {
    if (index < 0 || index >= this.items.value.length) {
      return 0;
    }
    if (this.offsetCache.has(index)) {
      this.updateCacheAccess(index);
      return this.offsetCache.get(index);
    }
    let offset = 0;
    if (this.lastMeasuredIndex >= 0 && index > this.lastMeasuredIndex) {
      offset = this.offsetCache.get(this.lastMeasuredIndex) || 0;
      for (let i = this.lastMeasuredIndex + 1; i <= index; i++) {
        offset += this.getItemSize(i - 1);
      }
    } else {
      for (let i = 0; i < index; i++) {
        offset += this.getItemSize(i);
      }
    }
    this.setCacheWithEviction(index, offset, "offset");
    this.lastMeasuredIndex = Math.max(this.lastMeasuredIndex, index);
    return offset;
  }
  /**
   * 更新滚动尺寸
   */
  updateScrollSize() {
    const itemCount = this.items.value.length;
    if (itemCount === 0) {
      this.scrollSize.value = 0;
      return;
    }
    const lastOffset = this.getItemOffset(itemCount - 1);
    const lastSize = this.getItemSize(itemCount - 1);
    this.scrollSize.value = lastOffset + lastSize;
  }
  /**
   * 预测性预加载
   */
  predictivePreload() {
    const { preloadTime } = this.config;
    const predictedOffset = this.scrollOffset.value + this.scrollVelocity * preloadTime;
    const predictedStart = this.findNearestIndex(predictedOffset);
    const predictedEnd = this.findNearestIndex(predictedOffset + this.clientSize.value);
    this.logger?.debug("Predictive preload", {
      velocity: this.scrollVelocity,
      predictedRange: { start: predictedStart, end: predictedEnd }
    });
  }
  /**
   * 获取滚动状态
   */
  getScrollState() {
    const { start, end } = this.visibleRange.value;
    return {
      offset: this.scrollOffset.value,
      clientSize: this.clientSize.value,
      scrollSize: this.scrollSize.value,
      startIndex: start,
      endIndex: end,
      visibleItems: end - start + 1
    };
  }
  /**
   * 重置缓存
   */
  resetCache() {
    this.sizeCache.clear();
    this.offsetCache.clear();
    this.cacheAccessOrder.clear();
    this.lastMeasuredIndex = -1;
  }
  /**
   * 更新缓存访问顺序 (LRU)
   */
  updateCacheAccess(index) {
    this.cacheAccessOrder.delete(index);
    this.cacheAccessOrder.add(index);
  }
  /**
   * 设置缓存并进行LRU驱逐
   */
  setCacheWithEviction(index, value, type) {
    const cache = type === "size" ? this.sizeCache : this.offsetCache;
    if (cache.size >= this.maxCacheSize && !cache.has(index)) {
      const lruIndex = this.cacheAccessOrder.values().next().value;
      if (lruIndex !== void 0) {
        this.sizeCache.delete(lruIndex);
        this.offsetCache.delete(lruIndex);
        this.cacheAccessOrder.delete(lruIndex);
      }
    }
    cache.set(index, value);
    this.updateCacheAccess(index);
  }
  /**
   * 清理远离当前视口的缓存
   */
  cleanupDistantCache() {
    const { start, end } = this.visibleRange.value;
    const keepDistance = 100;
    for (const index of this.cacheAccessOrder) {
      if (index < start - keepDistance || index > end + keepDistance) {
        this.sizeCache.delete(index);
        this.offsetCache.delete(index);
        this.cacheAccessOrder.delete(index);
      }
    }
  }
  /**
   * 更新项大小
   */
  updateItemSize(index, size) {
    const oldSize = this.sizeCache.get(index);
    if (oldSize !== size) {
      this.sizeCache.set(index, size);
      this.updateCacheAccess(index);
      for (let i = index + 1; i <= this.lastMeasuredIndex; i++) {
        this.offsetCache.delete(i);
        this.cacheAccessOrder.delete(i);
      }
      this.updateScrollSize();
    }
  }
  /**
   * 销毁
   */
  dispose() {
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
      this.scrollTimer = null;
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.resetCache();
    this.items.value = [];
    this.scrollOffset.value = 0;
    this.clientSize.value = 0;
    this.scrollSize.value = 0;
    this.isScrolling.value = false;
    this.scrollVelocity = 0;
    this.lastScrollTime = 0;
  }
}
class ComponentLazyLoader {
  constructor(config = {}, logger) {
    this.config = config;
    this.logger = logger;
    this.loadedComponents = /* @__PURE__ */ new Set();
    this.loadingComponents = /* @__PURE__ */ new Map();
    this.componentCache = /* @__PURE__ */ new Map();
    this.observers = /* @__PURE__ */ new Map();
    this.maxCacheSize = 50;
    this.loadTimeouts = /* @__PURE__ */ new Map();
    this.config = {
      delay: 0,
      timeout: 1e4,
      retries: 3,
      preload: false,
      distance: 50,
      ...config
    };
  }
  /**
   * 懒加载组件
   */
  async loadComponent(loader, key) {
    if (this.componentCache.has(key)) {
      return this.componentCache.get(key);
    }
    if (this.loadingComponents.has(key)) {
      return this.loadingComponents.get(key);
    }
    const loadPromise = this.loadWithRetry(loader, key);
    this.loadingComponents.set(key, loadPromise);
    try {
      const component = await loadPromise;
      if (this.componentCache.size >= this.maxCacheSize) {
        const firstKey = this.componentCache.keys().next().value;
        if (firstKey) {
          this.componentCache.delete(firstKey);
          this.loadedComponents.delete(firstKey);
        }
      }
      this.componentCache.set(key, component);
      this.loadedComponents.add(key);
      this.loadingComponents.delete(key);
      this.logger?.debug(`Component loaded: ${key}`);
      return component;
    } catch (error) {
      this.loadingComponents.delete(key);
      this.logger?.error(`Failed to load component: ${key}`, error);
      throw error;
    }
  }
  /**
   * 带重试的加载
   */
  async loadWithRetry(loader, key, attempt = 1) {
    const { timeout, retries, delay } = this.config;
    try {
      if (delay && attempt === 1) {
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, delay);
          this.loadTimeouts.set(`${key}_delay`, timer);
        });
        this.loadTimeouts.delete(`${key}_delay`);
      }
      const timeoutPromise = new Promise((_, reject) => {
        const timer = setTimeout(() => reject(new Error("Load timeout")), timeout);
        this.loadTimeouts.set(`${key}_timeout`, timer);
      });
      const result = await Promise.race([loader(), timeoutPromise]);
      this.clearTimeout(`${key}_timeout`);
      return result;
    } catch (error) {
      this.clearTimeout(`${key}_timeout`);
      if (attempt < retries) {
        this.logger?.debug(`Retrying component load: ${key} (attempt ${attempt + 1})`);
        await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 1e3));
        return this.loadWithRetry(loader, key, attempt + 1);
      }
      throw error;
    }
  }
  /**
   * Clear timeout helper
   */
  clearTimeout(key) {
    const timeout = this.loadTimeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.loadTimeouts.delete(key);
    }
  }
  /**
   * 观察元素并自动加载
   */
  observe(element, loader, key) {
    const { distance, preload } = this.config;
    const oldObserver = this.observers.get(key);
    if (oldObserver) {
      oldObserver.disconnect();
    }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting || preload && entry.boundingClientRect.top < distance) {
          this.loadComponent(loader, key).catch((error) => {
            this.logger?.error(`Failed to lazy load component: ${key}`, error);
          });
          observer.unobserve(element);
          observer.disconnect();
          this.observers.delete(key);
        }
      }
    }, {
      rootMargin: `${distance}px`,
      threshold: 0
    });
    observer.observe(element);
    this.observers.set(key, observer);
  }
  /**
   * 预加载组件
   */
  async preload(loaders) {
    const promises = loaders.map(({ key, loader }) => this.loadComponent(loader, key).catch((error) => {
      this.logger?.warn(`Failed to preload component: ${key}`, error);
    }));
    await Promise.all(promises);
  }
  /**
   * 获取加载状态
   */
  getLoadStatus() {
    return {
      loaded: Array.from(this.loadedComponents),
      loading: Array.from(this.loadingComponents.keys()),
      cached: this.componentCache.size
    };
  }
  /**
   * 清理缓存
   */
  clearCache(keys) {
    if (keys) {
      keys.forEach((key) => {
        this.componentCache.delete(key);
        this.loadedComponents.delete(key);
        this.loadingComponents.delete(key);
        const observer = this.observers.get(key);
        if (observer) {
          observer.disconnect();
          this.observers.delete(key);
        }
        this.clearTimeout(`${key}_timeout`);
        this.clearTimeout(`${key}_delay`);
      });
    } else {
      this.componentCache.clear();
      this.loadedComponents.clear();
      this.loadingComponents.clear();
      this.observers.forEach((observer) => observer.disconnect());
      this.observers.clear();
      this.loadTimeouts.forEach((timeout) => clearTimeout(timeout));
      this.loadTimeouts.clear();
    }
  }
  /**
   * 销毁
   */
  dispose() {
    this.clearCache();
    this.loadTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.loadTimeouts.clear();
    this.logger = void 0;
  }
}
class ResourcePreloader {
  constructor(logger) {
    this.logger = logger;
    this.preloadedResources = /* @__PURE__ */ new Set();
    this.preloadQueue = [];
    this.isPreloading = false;
    this.concurrentLoads = 3;
  }
  /**
   * 预加载资源
   */
  async preload(resources) {
    resources.forEach((resource) => {
      if (!this.preloadedResources.has(resource.url)) {
        this.preloadQueue.push({
          ...resource,
          priority: resource.priority || 0
        });
      }
    });
    this.preloadQueue.sort((a, b) => b.priority - a.priority);
    if (!this.isPreloading) {
      await this.processQueue();
    }
  }
  /**
   * 处理预加载队列
   */
  async processQueue() {
    this.isPreloading = true;
    while (this.preloadQueue.length > 0) {
      const batch = this.preloadQueue.splice(0, this.concurrentLoads);
      await Promise.all(batch.map((resource) => this.loadResource(resource)));
    }
    this.isPreloading = false;
  }
  /**
   * 加载单个资源
   */
  async loadResource(resource) {
    const { url, type } = resource;
    try {
      switch (type) {
        case "image":
          await this.preloadImage(url);
          break;
        case "script":
          await this.preloadScript(url);
          break;
        case "style":
          await this.preloadStyle(url);
          break;
        case "font":
          await this.preloadFont(url);
          break;
        case "data":
          await this.preloadData(url);
          break;
      }
      this.preloadedResources.add(url);
      this.logger?.debug(`Resource preloaded: ${url}`);
    } catch (error) {
      this.logger?.error(`Failed to preload resource: ${url}`, error);
    }
  }
  /**
   * 预加载图片
   */
  preloadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
  }
  /**
   * 预加载脚本
   */
  preloadScript(url) {
    return new Promise((resolve, reject) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "script";
      link.href = url;
      link.onload = () => resolve();
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }
  /**
   * 预加载样式
   */
  preloadStyle(url) {
    return new Promise((resolve, reject) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "style";
      link.href = url;
      link.onload = () => resolve();
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }
  /**
   * 预加载字体
   */
  preloadFont(url) {
    return new Promise((resolve, reject) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "font";
      link.href = url;
      link.crossOrigin = "anonymous";
      link.onload = () => resolve();
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }
  /**
   * 预加载数据
   */
  async preloadData(url) {
    const response = await fetch(url, { method: "HEAD" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  }
  /**
   * 检查资源是否已预加载
   */
  isPreloaded(url) {
    return this.preloadedResources.has(url);
  }
  /**
   * 获取预加载状态
   */
  getStatus() {
    return {
      preloaded: this.preloadedResources.size,
      queued: this.preloadQueue.length,
      isPreloading: this.isPreloading
    };
  }
}
function useVirtualScroll(items, config) {
  const scroller = new VirtualScroller(config);
  vue.watchEffect(() => {
    scroller.setItems(items.value);
  });
  vue.onUnmounted(() => scroller.dispose());
  return {
    scroller,
    visibleItems: scroller.visibleItems,
    scrollState: scroller.scrollState,
    handleScroll: (offset) => scroller.handleScroll(offset),
    scrollToIndex: (index, align) => scroller.scrollToIndex(index, align)
  };
}
function createComponentLazyLoader(config, logger) {
  return new ComponentLazyLoader(config, logger);
}
function createResourcePreloader(logger) {
  return new ResourcePreloader(logger);
}

exports.ComponentLazyLoader = ComponentLazyLoader;
exports.ResourcePreloader = ResourcePreloader;
exports.VirtualScroller = VirtualScroller;
exports.createComponentLazyLoader = createComponentLazyLoader;
exports.createResourcePreloader = createResourcePreloader;
exports.useVirtualScroll = useVirtualScroll;
//# sourceMappingURL=virtual-scroll.cjs.map
