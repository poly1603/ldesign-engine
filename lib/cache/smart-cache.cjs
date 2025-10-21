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

class SmartCacheStrategy {
  constructor(cache, config = {}, logger) {
    this.cache = cache;
    this.logger = logger;
    this.accessPatterns = /* @__PURE__ */ new Map();
    this.config = {
      enablePatternLearning: config.enablePatternLearning ?? true,
      enablePredictivePrefetch: config.enablePredictivePrefetch ?? true,
      enableAdaptiveTTL: config.enableAdaptiveTTL ?? true,
      minAccessForPrediction: config.minAccessForPrediction || 3,
      patternWindow: config.patternWindow || 10 * 60 * 1e3,
      // 10分钟
      prefetchThreshold: config.prefetchThreshold || 0.7
    };
    if (this.config.enablePredictivePrefetch) {
      this.startPredictionEngine();
    }
    this.startPatternCleanup();
  }
  /**
   * 记录访问模式
   */
  recordAccess(key) {
    if (!this.config.enablePatternLearning) {
      return;
    }
    const now = Date.now();
    let pattern = this.accessPatterns.get(key);
    if (!pattern) {
      pattern = {
        key,
        accessCount: 0,
        lastAccess: now,
        firstAccess: now,
        averageInterval: 0,
        trend: "stable",
        predictedNextAccess: 0
      };
      this.accessPatterns.set(key, pattern);
    }
    const interval = now - pattern.lastAccess;
    pattern.accessCount++;
    pattern.lastAccess = now;
    if (pattern.accessCount > 1) {
      pattern.averageInterval = pattern.averageInterval === 0 ? interval : pattern.averageInterval * 0.7 + interval * 0.3;
    }
    this.analyzeTrend(pattern);
    if (pattern.accessCount >= this.config.minAccessForPrediction) {
      pattern.predictedNextAccess = now + pattern.averageInterval;
    }
    this.logger?.debug(`Access pattern updated for ${key}`, {
      count: pattern.accessCount,
      interval: pattern.averageInterval.toFixed(0)
    });
  }
  /**
   * 分析访问趋势
   */
  analyzeTrend(pattern) {
    if (pattern.accessCount < 5) {
      pattern.trend = "stable";
      return;
    }
    const totalTime = pattern.lastAccess - pattern.firstAccess;
    const expectedAccesses = totalTime / pattern.averageInterval;
    const actualAccesses = pattern.accessCount;
    const ratio = actualAccesses / expectedAccesses;
    if (ratio > 1.2) {
      pattern.trend = "increasing";
    } else if (ratio < 0.8) {
      pattern.trend = "decreasing";
    } else {
      pattern.trend = "stable";
    }
  }
  /**
   * 计算自适应TTL
   */
  calculateAdaptiveTTL(key, defaultTTL) {
    if (!this.config.enableAdaptiveTTL) {
      return defaultTTL;
    }
    const pattern = this.accessPatterns.get(key);
    if (!pattern || pattern.accessCount < this.config.minAccessForPrediction) {
      return defaultTTL;
    }
    if (pattern.averageInterval < 6e4) {
      return Math.max(pattern.averageInterval * 2, 3e4);
    } else if (pattern.averageInterval < 3e5) {
      return Math.max(pattern.averageInterval * 1.5, 6e4);
    } else {
      return Math.min(pattern.averageInterval * 2, defaultTTL * 2);
    }
  }
  /**
   * 获取预测性预取建议
   */
  getPrefetchCandidates() {
    if (!this.config.enablePredictivePrefetch) {
      return [];
    }
    const now = Date.now();
    const candidates = [];
    for (const pattern of this.accessPatterns.values()) {
      if (pattern.accessCount < this.config.minAccessForPrediction) {
        continue;
      }
      now - pattern.lastAccess;
      const timeUntilPredicted = pattern.predictedNextAccess - now;
      if (timeUntilPredicted > 0 && timeUntilPredicted < pattern.averageInterval * 0.5) {
        let confidence = 0.5;
        if (pattern.trend === "increasing") {
          confidence = 0.9;
        } else if (pattern.trend === "stable") {
          confidence = 0.7;
        } else {
          confidence = 0.4;
        }
        if (pattern.accessCount > 10) {
          confidence += 0.1;
        }
        if (confidence >= this.config.prefetchThreshold) {
          candidates.push({ key: pattern.key, confidence });
        }
      }
    }
    candidates.sort((a, b) => b.confidence - a.confidence);
    return candidates.slice(0, 10).map((c) => c.key);
  }
  /**
   * 启动预测引擎
   */
  startPredictionEngine() {
    this.predictionTimer = setInterval(() => {
      const candidates = this.getPrefetchCandidates();
      if (candidates.length > 0) {
        this.logger?.debug("Predictive prefetch candidates", {
          count: candidates.length,
          keys: candidates.slice(0, 3)
        });
      }
    }, 1e4);
  }
  /**
   * 启动模式清理
   */
  startPatternCleanup() {
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldPatterns();
    }, 6e4);
  }
  /**
   * 清理过期的访问模式
   */
  cleanupOldPatterns() {
    const now = Date.now();
    const expiredKeys = [];
    for (const [key, pattern] of this.accessPatterns) {
      if (now - pattern.lastAccess > this.config.patternWindow) {
        expiredKeys.push(key);
      }
    }
    expiredKeys.forEach((key) => this.accessPatterns.delete(key));
    if (expiredKeys.length > 0) {
      this.logger?.debug("Cleaned old access patterns", {
        removed: expiredKeys.length
      });
    }
  }
  /**
   * 获取访问模式统计
   */
  getStats() {
    const patterns = Array.from(this.accessPatterns.values());
    return {
      totalPatterns: patterns.length,
      highFrequency: patterns.filter((p) => p.averageInterval < 6e4).length,
      mediumFrequency: patterns.filter((p) => p.averageInterval >= 6e4 && p.averageInterval < 3e5).length,
      lowFrequency: patterns.filter((p) => p.averageInterval >= 3e5).length,
      increasingTrend: patterns.filter((p) => p.trend === "increasing").length,
      decreasingTrend: patterns.filter((p) => p.trend === "decreasing").length
    };
  }
  /**
   * 销毁智能缓存策略
   */
  destroy() {
    if (this.predictionTimer) {
      clearInterval(this.predictionTimer);
      this.predictionTimer = void 0;
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = void 0;
    }
    this.accessPatterns.clear();
  }
}
function createSmartCacheStrategy(cache, config, logger) {
  return new SmartCacheStrategy(cache, config, logger);
}

exports.SmartCacheStrategy = SmartCacheStrategy;
exports.createSmartCacheStrategy = createSmartCacheStrategy;
//# sourceMappingURL=smart-cache.cjs.map
