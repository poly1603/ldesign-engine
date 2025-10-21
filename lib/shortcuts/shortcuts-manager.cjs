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

function parseShortcut(key) {
  const parts = key.toLowerCase().split("+").map((p) => p.trim());
  return {
    ctrl: parts.includes("ctrl") || parts.includes("control"),
    shift: parts.includes("shift"),
    alt: parts.includes("alt"),
    meta: parts.includes("meta") || parts.includes("cmd") || parts.includes("command"),
    key: parts[parts.length - 1]
    // 最后一部分是实际的键
  };
}
function matchShortcut(event, shortcut) {
  const parsed = parseShortcut(shortcut);
  const eventKey = event.key.toLowerCase();
  if (parsed.ctrl !== (event.ctrlKey || event.metaKey))
    return false;
  if (parsed.shift !== event.shiftKey)
    return false;
  if (parsed.alt !== event.altKey)
    return false;
  if (parsed.meta !== event.metaKey)
    return false;
  const keyMap = {
    "esc": ["escape", "esc"],
    "escape": ["escape", "esc"],
    "enter": ["enter", "return"],
    "return": ["enter", "return"],
    "space": [" ", "space", "spacebar"],
    "spacebar": [" ", "space", "spacebar"],
    "up": ["arrowup", "up"],
    "down": ["arrowdown", "down"],
    "left": ["arrowleft", "left"],
    "right": ["arrowright", "right"],
    "del": ["delete", "del"],
    "delete": ["delete", "del"],
    "backspace": ["backspace"],
    "tab": ["tab"],
    "/": ["/", "slash"],
    "\\": ["\\", "backslash"],
    "?": ["?", "question"],
    ".": [".", "period"],
    ",": [",", "comma"]
  };
  const normalizedKey = parsed.key;
  const possibleKeys = keyMap[normalizedKey] || [normalizedKey];
  return possibleKeys.includes(eventKey);
}
function isInInput(event) {
  const target = event.target;
  if (!target)
    return false;
  const tagName = target.tagName.toLowerCase();
  const isContentEditable = target.isContentEditable;
  const isInput = tagName === "input" || tagName === "textarea" || tagName === "select";
  return isInput || isContentEditable;
}
class ShortcutsManager {
  constructor() {
    this.shortcuts = /* @__PURE__ */ new Map();
    this.scopes = /* @__PURE__ */ new Map();
    this.activeScopes = /* @__PURE__ */ new Set(["global"]);
    this.enabled = true;
    this.conflictMode = "warn";
    this.init();
  }
  /**
   * 初始化
   */
  init() {
    this.listener = (event) => this.handleKeyPress(event);
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", this.listener);
    }
    this.scopes.set("global", {
      name: "global",
      description: "\u5168\u5C40\u5FEB\u6377\u952E",
      shortcuts: /* @__PURE__ */ new Map()
    });
  }
  /**
   * 注册快捷键
   */
  register(key, handler, options) {
    const defaultOptions = {
      description: "",
      scope: "global",
      preventDefault: true,
      stopPropagation: false,
      allowInInput: false,
      enabled: true,
      priority: 0
    };
    const mergedOptions = { ...defaultOptions, ...options };
    const scopeName = mergedOptions.scope;
    if (this.checkConflict(key, scopeName)) {
      if (this.conflictMode === "error") {
        throw new Error(`\u5FEB\u6377\u952E ${key} \u5728\u4F5C\u7528\u57DF ${scopeName} \u4E2D\u5DF2\u5B58\u5728`);
      } else if (this.conflictMode === "warn") {
        console.warn(`\u5FEB\u6377\u952E ${key} \u5728\u4F5C\u7528\u57DF ${scopeName} \u4E2D\u5DF2\u5B58\u5728\uFF0C\u5C06\u88AB\u8986\u76D6`);
      }
    }
    const shortcut = {
      key,
      handler,
      options: mergedOptions
    };
    const fullKey = `${scopeName}:${key}`;
    this.shortcuts.set(fullKey, shortcut);
    if (!this.scopes.has(scopeName)) {
      this.scopes.set(scopeName, {
        name: scopeName,
        shortcuts: /* @__PURE__ */ new Map()
      });
    }
    const scope = this.scopes.get(scopeName);
    if (scope) {
      scope.shortcuts.set(key, shortcut);
    }
  }
  /**
   * 批量注册快捷键
   */
  registerBatch(shortcuts) {
    Object.entries(shortcuts).forEach(([key, value]) => {
      if (typeof value === "function") {
        this.register(key, value);
      } else {
        const [handler, options] = value;
        this.register(key, handler, options);
      }
    });
  }
  /**
   * 注册作用域快捷键
   */
  registerScope(scopeName, shortcuts) {
    Object.entries(shortcuts).forEach(([key, handler]) => {
      this.register(key, handler, { scope: scopeName });
    });
  }
  /**
   * 注销快捷键
   */
  unregister(key, scope = "global") {
    const fullKey = `${scope}:${key}`;
    const deleted = this.shortcuts.delete(fullKey);
    const scopeGroup = this.scopes.get(scope);
    if (scopeGroup) {
      scopeGroup.shortcuts.delete(key);
    }
    return deleted;
  }
  /**
   * 清空作用域的所有快捷键
   */
  clearScope(scope) {
    const scopeGroup = this.scopes.get(scope);
    if (scopeGroup) {
      scopeGroup.shortcuts.forEach((shortcut) => {
        const fullKey = `${scope}:${shortcut.key}`;
        this.shortcuts.delete(fullKey);
      });
      scopeGroup.shortcuts.clear();
    }
  }
  /**
   * 启用/禁用快捷键
   */
  setEnabled(key, enabled, scope = "global") {
    const fullKey = `${scope}:${key}`;
    const shortcut = this.shortcuts.get(fullKey);
    if (shortcut) {
      shortcut.options.enabled = enabled;
    }
  }
  /**
   * 激活作用域
   */
  activateScope(scope) {
    this.activeScopes.add(scope);
  }
  /**
   * 停用作用域
   */
  deactivateScope(scope) {
    if (scope !== "global") {
      this.activeScopes.delete(scope);
    }
  }
  /**
   * 设置独占作用域（只有该作用域生效）
   */
  setExclusiveScope(scope) {
    this.activeScopes.clear();
    this.activeScopes.add(scope);
    if (scope !== "global") {
      this.activeScopes.add("global");
    }
  }
  /**
   * 重置作用域
   */
  resetScopes() {
    this.activeScopes.clear();
    this.activeScopes.add("global");
  }
  /**
   * 检查快捷键冲突
   */
  checkConflict(key, scope = "global") {
    const fullKey = `${scope}:${key}`;
    return this.shortcuts.has(fullKey);
  }
  /**
   * 获取所有冲突的快捷键
   */
  getConflicts() {
    const conflicts = /* @__PURE__ */ new Map();
    this.scopes.forEach((scopeGroup, scopeName) => {
      scopeGroup.shortcuts.forEach((shortcut) => {
        if (!conflicts.has(shortcut.key)) {
          conflicts.set(shortcut.key, []);
        }
        const scopes = conflicts.get(shortcut.key);
        scopes?.push(scopeName);
      });
    });
    const realConflicts = /* @__PURE__ */ new Map();
    conflicts.forEach((scopes, key) => {
      if (scopes.length > 1) {
        realConflicts.set(key, scopes);
      }
    });
    return realConflicts;
  }
  /**
   * 处理按键事件
   */
  handleKeyPress(event) {
    if (!this.enabled)
      return;
    const matches = [];
    this.activeScopes.forEach((scope) => {
      this.shortcuts.forEach((shortcut, fullKey) => {
        if (!fullKey.startsWith(`${scope}:`))
          return;
        if (!shortcut.options.enabled)
          return;
        if (!shortcut.options.allowInInput && isInInput(event))
          return;
        if (matchShortcut(event, shortcut.key)) {
          matches.push(shortcut);
        }
      });
    });
    matches.sort((a, b) => b.options.priority - a.options.priority);
    if (matches.length > 0) {
      const shortcut = matches[0];
      if (shortcut.options.preventDefault) {
        event.preventDefault();
      }
      if (shortcut.options.stopPropagation) {
        event.stopPropagation();
      }
      shortcut.handler(event);
    }
  }
  /**
   * 设置冲突处理模式
   */
  setConflictMode(mode) {
    this.conflictMode = mode;
  }
  /**
   * 启用/禁用管理器
   */
  setManagerEnabled(enabled) {
    this.enabled = enabled;
  }
  /**
   * 获取快捷键列表
   */
  getShortcuts(scope) {
    if (scope) {
      const scopeGroup = this.scopes.get(scope);
      return scopeGroup ? Array.from(scopeGroup.shortcuts.values()) : [];
    }
    return Array.from(this.shortcuts.values());
  }
  /**
   * 获取快捷键描述（用于显示帮助）
   */
  getShortcutHelp() {
    const help = /* @__PURE__ */ new Map();
    this.scopes.forEach((scopeGroup, scopeName) => {
      const shortcuts = [];
      scopeGroup.shortcuts.forEach((shortcut) => {
        if (shortcut.options.description) {
          shortcuts.push({
            key: shortcut.key,
            description: shortcut.options.description
          });
        }
      });
      if (shortcuts.length > 0) {
        help.set(scopeName, shortcuts);
      }
    });
    return help;
  }
  /**
   * 导出配置
   */
  export() {
    const shortcuts = [];
    this.shortcuts.forEach((shortcut, fullKey) => {
      const [scope] = fullKey.split(":");
      shortcuts.push({
        key: shortcut.key,
        scope,
        description: shortcut.options.description,
        enabled: shortcut.options.enabled
      });
    });
    return {
      shortcuts,
      activeScopes: Array.from(this.activeScopes)
    };
  }
  /**
   * 销毁
   */
  destroy() {
    if (this.listener && typeof window !== "undefined") {
      window.removeEventListener("keydown", this.listener);
    }
    this.shortcuts.clear();
    this.scopes.clear();
    this.activeScopes.clear();
  }
}

exports.ShortcutsManager = ShortcutsManager;
//# sourceMappingURL=shortcuts-manager.cjs.map
