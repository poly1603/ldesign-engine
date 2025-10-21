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

class EnvironmentManagerImpl {
  constructor(logger) {
    this.changeListeners = [];
    this.featureListeners = /* @__PURE__ */ new Map();
    this.logger = logger;
    this.environmentInfo = this.detectEnvironment();
    this.adaptation = this.createDefaultAdaptation();
    this.setupEnvironmentListeners();
  }
  detect() {
    return { ...this.environmentInfo };
  }
  getEnvironment() {
    return this.environmentInfo.environment;
  }
  getPlatform() {
    return this.environmentInfo.platform;
  }
  getBrowser() {
    return {
      name: this.environmentInfo.browser.name,
      version: this.environmentInfo.browser.version
    };
  }
  getDevice() {
    return {
      type: this.environmentInfo.device.type,
      isMobile: this.environmentInfo.device.isMobile
    };
  }
  hasFeature(feature) {
    return this.environmentInfo.features[feature] || false;
  }
  getFeatures() {
    return { ...this.environmentInfo.features };
  }
  checkCompatibility(requirements) {
    if (requirements.browser) {
      const browserReq = requirements.browser?.[this.environmentInfo.browser.name];
      if (browserReq && !this.isVersionCompatible(this.environmentInfo.browser.version, browserReq)) {
        return false;
      }
    }
    if (requirements.features && Array.isArray(requirements.features)) {
      for (const feature of requirements.features) {
        if (!this.hasFeature(feature)) {
          return false;
        }
      }
    }
    return true;
  }
  getAdaptation() {
    return { ...this.adaptation };
  }
  setAdaptation(adaptation) {
    this.adaptation = {
      ...this.adaptation,
      ...adaptation,
      fallbacks: { ...this.adaptation.fallbacks, ...adaptation.fallbacks },
      optimizations: {
        ...this.adaptation.optimizations,
        ...adaptation.optimizations
      },
      compatibility: {
        ...this.adaptation.compatibility,
        ...adaptation.compatibility
      }
    };
    this.logger?.debug("Environment adaptation updated", adaptation);
  }
  adaptForEnvironment(env) {
    const adaptation = {
      fallbacks: {
        storage: env.features.hasLocalStorage ? "memory" : "cookie",
        animation: env.device.isMobile ? "css" : "js",
        networking: env.features.hasServiceWorkers ? "fetch" : "xhr"
      },
      optimizations: {
        enableLazyLoading: env.device.isMobile,
        enableCodeSplitting: env.environment === "production",
        enableImageOptimization: env.device.isMobile,
        enableCaching: env.environment === "production",
        maxConcurrentRequests: env.device.isMobile ? 4 : 8
      },
      compatibility: {
        enablePolyfills: env.browser.name === "ie",
        supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
        minimumVersions: {
          chrome: "80",
          firefox: "75",
          safari: "13",
          edge: "80"
        }
      }
    };
    return adaptation;
  }
  getPerformanceInfo() {
    return { ...this.environmentInfo.performance };
  }
  monitorPerformance(callback) {
    const monitor = () => {
      const perfInfo = this.detectPerformanceInfo();
      callback(perfInfo);
    };
    setInterval(monitor, 5e3);
    monitor();
  }
  onEnvironmentChange(callback) {
    this.changeListeners.push(callback);
    return () => {
      const index = this.changeListeners.indexOf(callback);
      if (index > -1) {
        this.changeListeners.splice(index, 1);
      }
    };
  }
  onFeatureChange(feature, callback) {
    if (!this.featureListeners.has(feature)) {
      this.featureListeners.set(feature, []);
    }
    const listeners = this.featureListeners.get(feature);
    listeners?.push(callback);
    return () => {
      const listeners2 = this.featureListeners.get(feature);
      if (listeners2) {
        const index = listeners2.indexOf(callback);
        if (index > -1) {
          listeners2.splice(index, 1);
        }
      }
    };
  }
  // 私有方法
  detectEnvironment() {
    return {
      environment: this.detectEnv(),
      platform: this.detectPlatform(),
      browser: this.detectBrowser(),
      device: this.detectDevice(),
      features: this.detectFeatures(),
      performance: this.detectPerformanceInfo(),
      screen: this.detectScreenInfo(),
      timezone: this.detectTimezone()
    };
  }
  detectEnv() {
    try {
      if (typeof process !== "undefined" && process.env) {
        const nodeEnv = process.env.NODE_ENV;
        if (nodeEnv === "production")
          return "production";
        if (nodeEnv === "test")
          return "test";
      }
      if (typeof globalThis !== "undefined" && globalThis.__vitest__ !== void 0) {
        return "test";
      }
      if (typeof window !== "undefined" && window.__karma__ !== void 0) {
        return "test";
      }
      return "development";
    } catch {
      return "development";
    }
  }
  detectPlatform() {
    if (typeof window !== "undefined") {
      const w = window;
      const processKey = "process";
      if (w.require && w[processKey]?.type) {
        return "electron";
      }
      if (typeof globalThis.importScripts === "function") {
        return "webworker";
      }
      return "browser";
    }
    try {
      if (typeof process !== "undefined" && process.versions?.node) {
        return "node";
      }
      return "unknown";
    } catch {
      return "unknown";
    }
  }
  detectBrowser() {
    if (typeof navigator === "undefined") {
      return { name: "unknown", version: "", userAgent: "" };
    }
    const userAgent = navigator.userAgent;
    let name = "unknown";
    let version = "";
    if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
      name = "chrome";
      const match = userAgent.match(/Chrome\/(\d+)/);
      version = match ? match[1] : "";
    } else if (userAgent.includes("Edg")) {
      name = "edge";
      const match = userAgent.match(/Edg\/(\d+)/);
      version = match ? match[1] : "";
    } else if (userAgent.includes("Firefox")) {
      name = "firefox";
      const match = userAgent.match(/Firefox\/(\d+)/);
      version = match ? match[1] : "";
    } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
      name = "safari";
      const match = userAgent.match(/Version\/(\d+)/);
      version = match ? match[1] : "";
    } else if (userAgent.includes("MSIE") || userAgent.includes("Trident")) {
      name = "ie";
      const match = userAgent.match(/(?:MSIE |rv:)(\d+)/);
      version = match ? match[1] : "";
    } else if (userAgent.includes("Opera") || userAgent.includes("OPR")) {
      name = "opera";
      const match = userAgent.match(/(?:Opera|OPR)\/(\d+)/);
      version = match ? match[1] : "";
    }
    return { name, version, userAgent };
  }
  detectDevice() {
    if (typeof navigator === "undefined") {
      return {
        type: "unknown",
        isMobile: false,
        isTablet: false,
        isDesktop: false,
        isTouchDevice: false
      };
    }
    const userAgent = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?=.*Tablet)|Tablet/i.test(userAgent);
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    let type = "desktop";
    if (isTablet) {
      type = "tablet";
    } else if (isMobile) {
      type = "mobile";
    }
    return {
      type,
      isMobile,
      isTablet,
      isDesktop: type === "desktop",
      isTouchDevice
    };
  }
  detectFeatures() {
    const hasWindow = typeof window !== "undefined";
    const hasNavigator = typeof navigator !== "undefined";
    return {
      // Storage APIs
      hasLocalStorage: hasWindow && "localStorage" in window,
      hasSessionStorage: hasWindow && "sessionStorage" in window,
      hasIndexedDB: hasWindow && "indexedDB" in window,
      // Worker APIs
      hasWebWorkers: hasWindow && "Worker" in window,
      hasServiceWorkers: hasNavigator && "serviceWorker" in navigator,
      // Graphics APIs
      hasWebGL: hasWindow && this.checkWebGL(),
      hasWebGL2: hasWindow && this.checkWebGL2(),
      hasWebAssembly: typeof WebAssembly !== "undefined",
      // Network APIs
      hasOnlineDetection: hasNavigator && "onLine" in navigator,
      hasNetworkInformation: hasNavigator && "connection" in navigator,
      // Performance APIs
      hasPerformanceAPI: hasWindow && "performance" in window,
      hasIntersectionObserver: hasWindow && "IntersectionObserver" in window,
      hasMutationObserver: hasWindow && "MutationObserver" in window,
      hasResizeObserver: hasWindow && "ResizeObserver" in window,
      // Media APIs
      hasMediaDevices: hasNavigator && "mediaDevices" in navigator,
      hasGetUserMedia: hasNavigator && "getUserMedia" in navigator,
      // Other APIs
      hasClipboardAPI: hasNavigator && "clipboard" in navigator,
      hasNotificationAPI: hasWindow && "Notification" in window,
      hasGeolocationAPI: hasNavigator && "geolocation" in navigator
    };
  }
  detectPerformanceInfo() {
    const info = {};
    if (typeof performance !== "undefined" && "memory" in performance) {
      const memory = performance.memory;
      if (!memory)
        return info;
      info.memory = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };
    }
    if (typeof navigator !== "undefined" && "connection" in navigator) {
      const connection = navigator.connection;
      if (!connection)
        return info;
      info.connection = {
        effectiveType: connection.effectiveType || "unknown",
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        saveData: connection.saveData || false
      };
    }
    return info;
  }
  detectScreenInfo() {
    if (typeof screen === "undefined") {
      return {
        width: 0,
        height: 0,
        availWidth: 0,
        availHeight: 0,
        colorDepth: 0,
        pixelRatio: 1
      };
    }
    return {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      colorDepth: screen.colorDepth,
      pixelRatio: typeof window !== "undefined" ? window.devicePixelRatio : 1,
      orientation: typeof screen.orientation !== "undefined" ? screen.orientation.type : void 0
    };
  }
  detectTimezone() {
    const now = /* @__PURE__ */ new Date();
    const january = new Date(now.getFullYear(), 0, 1);
    const july = new Date(now.getFullYear(), 6, 1);
    const offset = -now.getTimezoneOffset();
    const dst = offset !== -january.getTimezoneOffset() || offset !== -july.getTimezoneOffset();
    return {
      name: Intl.DateTimeFormat().resolvedOptions().timeZone,
      offset,
      dst
    };
  }
  checkWebGL() {
    try {
      if (typeof document === "undefined")
        return false;
      const canvas = document.createElement("canvas");
      return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
    } catch {
      return false;
    }
  }
  checkWebGL2() {
    try {
      if (typeof document === "undefined")
        return false;
      const canvas = document.createElement("canvas");
      return !!canvas.getContext("webgl2");
    } catch {
      return false;
    }
  }
  createDefaultAdaptation() {
    return {
      fallbacks: {
        storage: "memory",
        animation: "css",
        networking: "fetch"
      },
      optimizations: {
        enableLazyLoading: false,
        enableCodeSplitting: false,
        enableImageOptimization: false,
        enableCaching: true,
        maxConcurrentRequests: 6
      },
      compatibility: {
        enablePolyfills: false,
        supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
        minimumVersions: {
          chrome: "80",
          firefox: "75",
          safari: "13",
          edge: "80"
        }
      }
    };
  }
  setupEnvironmentListeners() {
    if (typeof window === "undefined")
      return;
    window.addEventListener("online", () => this.handleEnvironmentChange());
    window.addEventListener("offline", () => this.handleEnvironmentChange());
    if (screen.orientation) {
      screen.orientation.addEventListener("change", () => this.handleEnvironmentChange());
    }
    window.addEventListener("resize", () => this.handleEnvironmentChange());
  }
  handleEnvironmentChange() {
    const newInfo = this.detectEnvironment();
    const hasChanged = JSON.stringify(newInfo) !== JSON.stringify(this.environmentInfo);
    if (hasChanged) {
      this.environmentInfo = newInfo;
      this.changeListeners.forEach((callback) => {
        try {
          callback(newInfo);
        } catch (error) {
          this.logger?.error("Error in environment change callback", error);
        }
      });
    }
  }
  isVersionCompatible(current, required) {
    const currentParts = current.split(".").map(Number);
    const requiredParts = required.split(".").map(Number);
    for (let i = 0; i < Math.max(currentParts.length, requiredParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const requiredPart = requiredParts[i] || 0;
      if (currentPart > requiredPart)
        return true;
      if (currentPart < requiredPart)
        return false;
    }
    return true;
  }
}
function createEnvironmentManager(logger) {
  return new EnvironmentManagerImpl(logger);
}
let globalEnvironmentManager;
function getGlobalEnvironmentManager() {
  if (!globalEnvironmentManager) {
    globalEnvironmentManager = createEnvironmentManager();
  }
  return globalEnvironmentManager;
}
function setGlobalEnvironmentManager(manager) {
  globalEnvironmentManager = manager;
}

exports.EnvironmentManagerImpl = EnvironmentManagerImpl;
exports.createEnvironmentManager = createEnvironmentManager;
exports.getGlobalEnvironmentManager = getGlobalEnvironmentManager;
exports.setGlobalEnvironmentManager = setGlobalEnvironmentManager;
//# sourceMappingURL=environment-manager.cjs.map
