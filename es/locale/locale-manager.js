/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:07 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
import { ref } from 'vue';

class LocaleManager {
  constructor(engine, options = {}) {
    this.engine = engine;
    this.plugins = /* @__PURE__ */ new Map();
    this.unwatchers = [];
    this.options = {
      initialLocale: options.initialLocale || "zh-CN",
      fallbackLocale: options.fallbackLocale || "en-US",
      persist: options.persist !== false,
      storageKey: options.storageKey || "ldesign-locale",
      beforeChange: options.beforeChange,
      afterChange: options.afterChange,
      onError: options.onError
    };
    this.fallbackLocale = this.options.fallbackLocale;
    const persistedLocale = this.loadPersistedLocale();
    this.currentLocale = ref(persistedLocale || this.options.initialLocale);
    this.setupSync();
    this.engine.logger.info("LocaleManager initialized", {
      currentLocale: this.currentLocale.value,
      fallbackLocale: this.fallbackLocale,
      persist: this.options.persist
    });
  }
  /**
   * 获取当前语言
   */
  getLocale() {
    return this.currentLocale.value;
  }
  /**
   * 获取后备语言
   */
  getFallbackLocale() {
    return this.fallbackLocale;
  }
  /**
   * 获取当前语言的响应式引用
   */
  getLocaleRef() {
    return this.currentLocale;
  }
  /**
   * 设置全局语言
   *
   * @param locale 语言代码
   * @returns Promise<boolean> 是否成功切换
   */
  async setLocale(locale) {
    const oldLocale = this.currentLocale.value;
    if (locale === oldLocale) {
      return true;
    }
    try {
      if (this.options.beforeChange) {
        const shouldContinue = await this.options.beforeChange(locale, oldLocale);
        if (shouldContinue === false) {
          this.engine.logger.debug("Locale change cancelled by beforeChange hook", {
            from: oldLocale,
            to: locale
          });
          return false;
        }
      }
      this.currentLocale.value = locale;
      this.engine.state.set("i18n.locale", locale);
      if (this.options.persist) {
        this.persistLocale(locale);
      }
      this.syncToPlugins(locale);
      this.engine.events.emit("i18n:locale-changed", {
        newLocale: locale,
        oldLocale,
        timestamp: Date.now()
      });
      if (this.options.afterChange) {
        await this.options.afterChange(locale, oldLocale);
      }
      this.engine.logger.info("Locale changed", {
        from: oldLocale,
        to: locale,
        pluginCount: this.plugins.size
      });
      return true;
    } catch (error) {
      this.handleError(error, "setLocale");
      return false;
    }
  }
  /**
   * 注册支持多语言的插件
   *
   * @param name 插件名称（唯一标识）
   * @param plugin 插件实例
   */
  register(name, plugin) {
    if (this.plugins.has(name)) {
      this.engine.logger.warn(`Plugin "${name}" is already registered in LocaleManager`);
      return;
    }
    this.plugins.set(name, plugin);
    try {
      plugin.setLocale(this.currentLocale.value);
      if (plugin.currentLocale) {
        plugin.currentLocale.value = this.currentLocale.value;
      }
      this.engine.logger.debug(`Plugin "${name}" registered to LocaleManager`, {
        currentLocale: this.currentLocale.value
      });
    } catch (error) {
      this.handleError(error, `register:${name}`);
    }
  }
  /**
   * 注销插件
   *
   * @param name 插件名称
   */
  unregister(name) {
    if (this.plugins.delete(name)) {
      this.engine.logger.debug(`Plugin "${name}" unregistered from LocaleManager`);
    }
  }
  /**
   * 获取所有已注册的插件名称
   */
  getRegisteredPlugins() {
    return Array.from(this.plugins.keys());
  }
  /**
   * 销毁 LocaleManager
   * 清理所有监听器
   */
  destroy() {
    this.unwatchers.forEach((unwatch) => unwatch());
    this.unwatchers = [];
    this.plugins.clear();
    this.engine.logger.debug("LocaleManager destroyed");
  }
  /**
   * 设置同步机制
   * @private
   */
  setupSync() {
    const unwatch = this.engine.state.watch("i18n.locale", (newLocale) => {
      if (newLocale && newLocale !== this.currentLocale.value) {
        this.setLocale(newLocale).catch((error) => {
          this.handleError(error, "state.watch");
        });
      }
    });
    this.unwatchers.push(unwatch);
    this.engine.state.set("i18n.locale", this.currentLocale.value);
    this.engine.state.set("i18n.fallbackLocale", this.fallbackLocale);
  }
  /**
   * 同步语言到所有已注册的插件
   * @private
   */
  syncToPlugins(locale) {
    this.plugins.forEach((plugin, name) => {
      try {
        plugin.setLocale(locale);
        if (plugin.currentLocale) {
          plugin.currentLocale.value = locale;
        }
      } catch (error) {
        this.handleError(error, `syncToPlugins:${name}`);
      }
    });
  }
  /**
   * 从存储加载持久化的语言
   * @private
   */
  loadPersistedLocale() {
    if (!this.options.persist || typeof window === "undefined") {
      return null;
    }
    try {
      const stored = localStorage.getItem(this.options.storageKey);
      if (stored) {
        this.engine.logger.debug("Loaded persisted locale", { locale: stored });
        return stored;
      }
    } catch (error) {
      this.handleError(error, "loadPersistedLocale");
    }
    return null;
  }
  /**
   * 持久化语言到存储
   * @private
   */
  persistLocale(locale) {
    if (typeof window === "undefined") {
      return;
    }
    try {
      localStorage.setItem(this.options.storageKey, locale);
    } catch (error) {
      this.handleError(error, "persistLocale");
    }
  }
  /**
   * 错误处理
   * @private
   */
  handleError(error, context) {
    this.engine.logger.error(`[LocaleManager:${context}]`, { error });
    if (this.options.onError) {
      try {
        this.options.onError(error);
      } catch (e) {
        this.engine.logger.error("Error in onError handler", { error: e });
      }
    }
  }
}
function createLocaleManager(engine, options) {
  return new LocaleManager(engine, options);
}

export { LocaleManager, createLocaleManager };
//# sourceMappingURL=locale-manager.js.map
