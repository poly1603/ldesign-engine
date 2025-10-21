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

class NotificationSystem {
  constructor(engine) {
    this.instances = /* @__PURE__ */ new Map();
    this.containers = /* @__PURE__ */ new Map();
    this.idCounter = 0;
    this.zIndexBase = 2e3;
    this.autoCloseTimers = /* @__PURE__ */ new Map();
    this.engine = engine;
    this.logger = engine?.logger;
    this.initialize();
  }
  initialize() {
    this.injectStyles();
    this.setupContainers();
    this.bindGlobalEvents();
  }
  // ==================== 公共API ====================
  /**
   * 显示通知
   */
  show(options) {
    const style = options.style || this.inferStyle(options);
    const id = options.id || this.generateId();
    const notification = this.createInstance(id, { ...options, style });
    this.instances.set(id, notification);
    this.renderNotification(notification);
    this.setupAutoClose(notification);
    options.onShow?.();
    this.logger?.debug(`Notification shown: ${id}`);
    return notification;
  }
  /**
   * 显示对话框
   */
  dialog(options) {
    return new Promise((resolve) => {
      this.show({
        style: "dialog",
        modal: true,
        closable: true,
        position: "center",
        ...options,
        content: options.content || "",
        onClose: (result) => {
          options.onClose?.(result);
          resolve(result);
        }
      });
    });
  }
  /**
   * 显示确认对话框
   */
  confirm(content, options) {
    return new Promise((resolve) => {
      this.show({
        style: "dialog",
        modal: true,
        title: "\u786E\u8BA4",
        content,
        position: "center",
        actions: [
          { text: "\u53D6\u6D88", type: "secondary", handler: () => resolve(false) },
          { text: "\u786E\u5B9A", type: "primary", handler: () => resolve(true) }
        ],
        ...options
      });
    });
  }
  /**
   * 显示输入对话框
   */
  async prompt(content, defaultValue = "", options) {
    return new Promise((resolve) => {
      const inputValue = defaultValue;
      const instance = this.show({
        style: "dialog",
        modal: true,
        title: "\u8F93\u5165",
        content: `
          <div>${content}</div>
          <input type="text" class="notification-input" value="${defaultValue}" />
        `,
        html: true,
        position: "center",
        actions: [
          { text: "\u53D6\u6D88", type: "secondary", handler: () => resolve(null) },
          {
            text: "\u786E\u5B9A",
            type: "primary",
            handler: () => {
              const input = instance.element.querySelector(".notification-input");
              resolve(input?.value || inputValue);
            }
          }
        ],
        ...options
      });
      setTimeout(() => {
        const input = instance.element.querySelector(".notification-input");
        input?.focus();
        input?.select();
      }, 100);
    });
  }
  /**
   * 快捷方法
   */
  success(content, options) {
    return this.show({ type: "success", content, ...options });
  }
  error(content, options) {
    return this.show({ type: "error", content, duration: 0, ...options });
  }
  warning(content, options) {
    return this.show({ type: "warning", content, ...options });
  }
  info(content, options) {
    return this.show({ type: "info", content, ...options });
  }
  loading(content, options) {
    return this.show({ type: "loading", content, duration: 0, ...options });
  }
  /**
   * 关闭通知
   */
  async close(id, result) {
    const instance = this.instances.get(id);
    if (!instance)
      return;
    await instance.close(result);
  }
  /**
   * 关闭所有通知
   */
  async closeAll() {
    const promises = Array.from(this.instances.values()).map((i) => i.close());
    await Promise.all(promises);
  }
  // ==================== 私有方法 ====================
  inferStyle(options) {
    if (options.modal)
      return "dialog";
    if (options.actions?.length)
      return "notification";
    if (options.duration && options.duration <= 3e3)
      return "message";
    return "toast";
  }
  generateId() {
    return `notification_${++this.idCounter}_${Date.now()}`;
  }
  createInstance(id, options) {
    const element = this.createElement(options);
    const instance = {
      id,
      options,
      element,
      visible: false,
      close: async (result) => {
        if (options.beforeClose) {
          const canClose = await options.beforeClose(result);
          if (!canClose)
            return;
        }
        await this.hideInstance(instance, result);
      },
      update: (newOptions) => {
        Object.assign(options, newOptions);
        this.updateElement(instance);
      },
      setProgress: (value) => {
        if (options.progress) {
          options.progress.value = value;
          this.updateProgress(instance);
        }
      }
    };
    return instance;
  }
  createElement(options) {
    const element = document.createElement("div");
    element.className = `notification notification-${options.style} notification-${options.type}`;
    if (options.customClass) {
      element.className += ` ${options.customClass}`;
    }
    switch (options.style) {
      case "dialog":
        this.createDialogStructure(element, options);
        break;
      case "notification":
        this.createNotificationStructure(element, options);
        break;
      default:
        this.createMessageStructure(element, options);
    }
    return element;
  }
  createDialogStructure(element, options) {
    if (options.modal) {
      const mask = document.createElement("div");
      mask.className = "notification-mask";
      element.appendChild(mask);
    }
    const dialog = document.createElement("div");
    dialog.className = "notification-dialog";
    if (options.title || options.closable) {
      const header = document.createElement("div");
      header.className = "notification-header";
      if (options.title) {
        const title = document.createElement("h3");
        title.textContent = options.title;
        header.appendChild(title);
      }
      if (options.closable) {
        const closeBtn = document.createElement("button");
        closeBtn.className = "notification-close";
        closeBtn.innerHTML = "\xD7";
        closeBtn.onclick = () => this.instances.get(options.id)?.close();
        header.appendChild(closeBtn);
      }
      dialog.appendChild(header);
    }
    const body = document.createElement("div");
    body.className = "notification-body";
    if (options.html) {
      body.innerHTML = options.content;
    } else {
      body.textContent = options.content;
    }
    dialog.appendChild(body);
    if (options.actions?.length) {
      const footer = document.createElement("div");
      footer.className = "notification-footer";
      options.actions.forEach((action) => {
        const btn = document.createElement("button");
        btn.className = `notification-btn notification-btn-${action.type || "secondary"}`;
        btn.textContent = action.text;
        btn.onclick = () => action.handler?.(this.instances.get(options.id));
        footer.appendChild(btn);
      });
      dialog.appendChild(footer);
    }
    element.appendChild(dialog);
  }
  createNotificationStructure(element, options) {
    if (options.icon !== false) {
      const icon = document.createElement("div");
      icon.className = "notification-icon";
      icon.innerHTML = this.getIcon(options.type || "info");
      element.appendChild(icon);
    }
    const content = document.createElement("div");
    content.className = "notification-content";
    if (options.title) {
      const title = document.createElement("div");
      title.className = "notification-title";
      title.textContent = options.title;
      content.appendChild(title);
    }
    const text = document.createElement("div");
    text.className = "notification-text";
    if (options.html) {
      text.innerHTML = options.content;
    } else {
      text.textContent = options.content;
    }
    content.appendChild(text);
    if (options.progress) {
      const progress = document.createElement("div");
      progress.className = "notification-progress";
      const bar = document.createElement("div");
      bar.className = "notification-progress-bar";
      bar.style.width = `${options.progress.value / (options.progress.max || 100) * 100}%`;
      progress.appendChild(bar);
      content.appendChild(progress);
    }
    if (options.actions?.length) {
      const actions = document.createElement("div");
      actions.className = "notification-actions";
      options.actions.forEach((action) => {
        const btn = document.createElement("button");
        btn.className = `notification-action notification-action-${action.type || "secondary"}`;
        btn.textContent = action.text;
        btn.onclick = () => action.handler?.(this.instances.get(options.id));
        actions.appendChild(btn);
      });
      content.appendChild(actions);
    }
    element.appendChild(content);
    if (options.closable) {
      const closeBtn = document.createElement("button");
      closeBtn.className = "notification-close";
      closeBtn.innerHTML = "\xD7";
      closeBtn.onclick = () => this.instances.get(options.id)?.close();
      element.appendChild(closeBtn);
    }
  }
  createMessageStructure(element, options) {
    const icon = document.createElement("span");
    icon.className = "notification-icon";
    icon.innerHTML = this.getIcon(options.type || "info");
    element.appendChild(icon);
    const content = document.createElement("span");
    content.className = "notification-content";
    if (options.html) {
      content.innerHTML = options.content;
    } else {
      content.textContent = options.content;
    }
    element.appendChild(content);
    if (options.closable) {
      const closeBtn = document.createElement("button");
      closeBtn.className = "notification-close";
      closeBtn.innerHTML = "\xD7";
      closeBtn.onclick = () => this.instances.get(options.id)?.close();
      element.appendChild(closeBtn);
    }
  }
  getIcon(type) {
    const icons = {
      success: "\u2713",
      error: "\u2715",
      warning: "\u26A0",
      info: "\u2139",
      loading: "\u27F3"
    };
    return icons[type] || icons.info;
  }
  renderNotification(instance) {
    const { position = "top-right", style = "toast" } = instance.options;
    const container = style === "dialog" ? document.body : this.getContainer(position);
    container.appendChild(instance.element);
    instance.visible = true;
    requestAnimationFrame(() => {
      instance.element.classList.add("notification-show");
    });
    if (style !== "dialog") {
      this.adjustPositions(position);
    }
  }
  async hideInstance(instance, result) {
    if (!instance.visible)
      return;
    instance.visible = false;
    instance.element.classList.add("notification-hide");
    const tid = this.autoCloseTimers.get(instance.id);
    if (tid) {
      clearTimeout(tid);
      this.autoCloseTimers.delete(instance.id);
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
    instance.element.remove();
    this.instances.delete(instance.id);
    instance.options.onClose?.(result);
    if (instance.options.style !== "dialog") {
      this.adjustPositions(instance.options.position || "top-right");
    }
  }
  updateElement(instance) {
    const newElement = this.createElement(instance.options);
    instance.element.replaceWith(newElement);
    instance.element = newElement;
  }
  updateProgress(instance) {
    const bar = instance.element.querySelector(".notification-progress-bar");
    if (bar && instance.options.progress) {
      const { value, max = 100 } = instance.options.progress;
      bar.style.width = `${value / max * 100}%`;
    }
  }
  setupAutoClose(instance) {
    const { duration, persistent } = instance.options;
    if (!duration || duration <= 0 || persistent)
      return;
    const timerId = window.setTimeout(() => {
      instance.close();
      this.autoCloseTimers.delete(instance.id);
    }, duration);
    this.autoCloseTimers.set(instance.id, timerId);
    instance.element.addEventListener("mouseenter", () => {
      const tid = this.autoCloseTimers.get(instance.id);
      if (tid) {
        clearTimeout(tid);
        this.autoCloseTimers.delete(instance.id);
      }
    });
    instance.element.addEventListener("mouseleave", () => {
      const newTid = window.setTimeout(() => {
        instance.close();
        this.autoCloseTimers.delete(instance.id);
      }, duration);
      this.autoCloseTimers.set(instance.id, newTid);
    });
  }
  getContainer(position) {
    let container = this.containers.get(position);
    if (!container) {
      container = document.createElement("div");
      container.className = `notification-container notification-container-${position}`;
      document.body.appendChild(container);
      this.containers.set(position, container);
    }
    return container;
  }
  setupContainers() {
  }
  bindGlobalEvents() {
    this.keydownHandler = (e) => {
      if (e.key === "Escape") {
        const dialogs = Array.from(this.instances.values()).filter((i) => i.options.style === "dialog" && i.visible).sort((a, b) => (b.element.style.zIndex || "0").localeCompare(a.element.style.zIndex || "0"));
        if (dialogs[0]?.options.closable) {
          dialogs[0].close();
        }
      }
    };
    document.addEventListener("keydown", this.keydownHandler);
  }
  adjustPositions(position) {
    const container = this.containers.get(position);
    if (!container)
      return;
    const notifications = Array.from(container.children);
    let offset = 0;
    notifications.forEach((el) => {
      el.style.transform = `translateY(${offset}px)`;
      offset += el.offsetHeight + 10;
    });
  }
  injectStyles() {
    if (this.styleElement)
      return;
    const style = document.createElement("style");
    style.id = "unified-notification-styles";
    style.textContent = `
      .notification-container {
        position: fixed;
        z-index: 2000;
        pointer-events: none;
      }
      
      .notification-container-top { top: 20px; left: 50%; transform: translateX(-50%); }
      .notification-container-top-left { top: 20px; left: 20px; }
      .notification-container-top-right { top: 20px; right: 20px; }
      .notification-container-bottom { bottom: 20px; left: 50%; transform: translateX(-50%); }
      .notification-container-bottom-left { bottom: 20px; left: 20px; }
      .notification-container-bottom-right { bottom: 20px; right: 20px; }
      .notification-container-center { top: 50%; left: 50%; transform: translate(-50%, -50%); }
      
      .notification {
        pointer-events: auto;
        opacity: 0;
        transition: all 0.3s ease;
        margin-bottom: 10px;
      }
      
      .notification-show {
        opacity: 1;
      }
      
      .notification-hide {
        opacity: 0;
        transform: scale(0.9);
      }
      
      /* Message\u6837\u5F0F */
      .notification-message, .notification-toast {
        display: inline-flex;
        align-items: center;
        padding: 12px 16px;
        border-radius: 4px;
        background: white;
        box-shadow: 0 2px 12px rgba(0,0,0,0.1);
        font-size: 14px;
        max-width: 400px;
      }
      
      .notification-message .notification-icon,
      .notification-toast .notification-icon {
        margin-right: 8px;
        font-size: 16px;
      }
      
      .notification-message .notification-close,
      .notification-toast .notification-close {
        margin-left: 12px;
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        opacity: 0.5;
        padding: 0;
      }
      
      .notification-message .notification-close:hover,
      .notification-toast .notification-close:hover {
        opacity: 1;
      }
      
      /* Dialog\u6837\u5F0F */
      .notification-dialog {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        min-width: 400px;
        max-width: 90vw;
        max-height: 90vh;
        overflow: hidden;
        z-index: 2100;
      }
      
      .notification-mask {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 2099;
      }
      
      .notification-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid #e8e8e8;
      }
      
      .notification-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
      
      .notification-body {
        padding: 20px;
        max-height: 60vh;
        overflow-y: auto;
      }
      
      .notification-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 16px 20px;
        border-top: 1px solid #e8e8e8;
      }
      
      .notification-btn {
        padding: 8px 16px;
        border-radius: 4px;
        border: 1px solid #d9d9d9;
        background: white;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
      }
      
      .notification-btn-primary {
        background: #409eff;
        border-color: #409eff;
        color: white;
      }
      
      .notification-btn-danger {
        background: #f56c6c;
        border-color: #f56c6c;
        color: white;
      }
      
      /* Notification\u6837\u5F0F */
      .notification-notification {
        display: flex;
        align-items: flex-start;
        padding: 16px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        min-width: 320px;
        max-width: 420px;
      }
      
      .notification-notification .notification-icon {
        font-size: 24px;
        margin-right: 12px;
        flex-shrink: 0;
      }
      
      .notification-notification .notification-content {
        flex: 1;
      }
      
      .notification-notification .notification-title {
        font-weight: 600;
        margin-bottom: 4px;
      }
      
      .notification-notification .notification-close {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        opacity: 0.5;
        padding: 0;
        margin-left: 12px;
      }
      
      .notification-progress {
        height: 4px;
        background: #f0f0f0;
        border-radius: 2px;
        margin-top: 8px;
        overflow: hidden;
      }
      
      .notification-progress-bar {
        height: 100%;
        background: #409eff;
        transition: width 0.3s;
      }
      
      .notification-actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }
      
      .notification-action {
        padding: 4px 12px;
        border-radius: 4px;
        border: 1px solid #d9d9d9;
        background: white;
        cursor: pointer;
        font-size: 12px;
      }
      
      /* \u7C7B\u578B\u6837\u5F0F */
      .notification-success { border-left: 4px solid #67c23a; }
      .notification-success .notification-icon { color: #67c23a; }
      
      .notification-error { border-left: 4px solid #f56c6c; }
      .notification-error .notification-icon { color: #f56c6c; }
      
      .notification-warning { border-left: 4px solid #e6a23c; }
      .notification-warning .notification-icon { color: #e6a23c; }
      
      .notification-info { border-left: 4px solid #409eff; }
      .notification-info .notification-icon { color: #409eff; }
      
      .notification-loading .notification-icon {
        color: #409eff;
        animation: notification-spin 1s linear infinite;
      }
      
      @keyframes notification-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      /* \u8F93\u5165\u6846\u6837\u5F0F */
      .notification-input {
        width: 100%;
        padding: 8px;
        margin-top: 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
      }
    `;
    document.head.appendChild(style);
    this.styleElement = style;
  }
  /**
   * 销毁系统
   */
  async destroy() {
    await this.closeAll();
    if (this.keydownHandler) {
      document.removeEventListener("keydown", this.keydownHandler);
      this.keydownHandler = void 0;
    }
    this.containers.forEach((container) => container.remove());
    this.containers.clear();
    this.styleElement?.remove();
    this.styleElement = void 0;
    for (const tid of this.autoCloseTimers.values()) {
      clearTimeout(tid);
    }
    this.autoCloseTimers.clear();
  }
}
function createNotificationSystem(engine) {
  return new NotificationSystem(engine);
}
function createUnifiedNotificationSystem(engine) {
  return createNotificationSystem(engine);
}

exports.NotificationSystem = NotificationSystem;
exports.UnifiedNotificationSystem = NotificationSystem;
exports.createNotificationSystem = createNotificationSystem;
exports.createUnifiedNotificationSystem = createUnifiedNotificationSystem;
//# sourceMappingURL=notification-system.cjs.map
