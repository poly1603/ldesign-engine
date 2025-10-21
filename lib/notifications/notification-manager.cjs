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

var styleManager = require('./style-manager.cjs');

class NotificationManagerImpl {
  constructor(logger) {
    this.notifications = /* @__PURE__ */ new Map();
    this.containers = /* @__PURE__ */ new Map();
    this.maxNotifications = 5;
    this.defaultDuration = 4e3;
    this.defaultPosition = "top-right";
    this.defaultTheme = "light";
    this.idCounter = 0;
    this.defaultOptions = {
      position: "top-right",
      duration: 4e3,
      theme: "light",
      type: "info",
      closable: true,
      persistent: false
    };
    this.logger = logger;
    this.styleManager = styleManager.createStyleManager();
    this.initializeContainers();
    this.setupThemeWatcher();
    this.injectStyles();
    this.startCleanup();
  }
  /**
   * 初始化所有位置的容器
   */
  initializeContainers() {
    if (typeof document === "undefined") {
      return;
    }
    const positions = [
      "top-left",
      "top-center",
      "top-right",
      "bottom-left",
      "bottom-center",
      "bottom-right"
    ];
    positions.forEach((position) => {
      this.createContainer(position);
    });
  }
  /**
   * 创建指定位置的容器
   */
  createContainer(position) {
    const existing = this.containers.get(position);
    if (existing) {
      return existing;
    }
    const container = document.createElement("div");
    container.id = `engine-notifications-${position}`;
    container.className = "engine-notifications-container";
    const styles = this.styleManager.getContainerStyles(position);
    this.styleManager.applyStyles(container, styles);
    document.body.appendChild(container);
    this.containers.set(position, container);
    return container;
  }
  /**
   * 设置主题监听器
   */
  setupThemeWatcher() {
    if (this.defaultTheme === "auto") {
      this.themeUnsubscribe = this.styleManager.watchSystemTheme((systemTheme) => {
        this.styleManager.setTheme(systemTheme);
        this.updateAllNotificationStyles();
      });
    }
  }
  /**
   * 更新所有通知的样式
   */
  updateAllNotificationStyles() {
    this.notifications.forEach((notification) => {
      if (notification.element && notification.visible) {
        this.updateNotificationStyles(notification);
      }
    });
  }
  show(options) {
    const id = this.generateId();
    const notification = {
      id,
      createdAt: Date.now(),
      visible: true,
      type: options.type || "info",
      duration: options.duration ?? this.defaultDuration,
      closable: options.closable ?? true,
      position: options.position || this.defaultPosition,
      theme: options.theme || this.defaultTheme,
      ...options
    };
    const position = notification.position || this.defaultPosition;
    this.enforceMaxNotifications(position);
    this.notifications.set(id, notification);
    this.renderNotification(notification);
    if (notification.duration && notification.duration > 0 && !notification.persistent) {
      notification.timeoutId = window.setTimeout(() => {
        this.hide(id);
      }, notification.duration);
    }
    if (notification.onShow) {
      try {
        notification.onShow();
      } catch (error) {
        this.logger?.error("Error in notification onShow callback", error);
      }
    }
    this.logger?.debug("Notification shown", { id, options });
    return id;
  }
  async hide(id) {
    const notification = this.notifications.get(id);
    if (!notification || !notification.visible) {
      return;
    }
    notification.visible = false;
    if (notification.timeoutId) {
      clearTimeout(notification.timeoutId);
      notification.timeoutId = void 0;
    }
    if (notification.onClose) {
      try {
        notification.onClose();
      } catch (error) {
        this.logger?.error("Error in notification onClose callback", error);
      }
    }
    await this.removeNotificationElement(notification);
    this.notifications.delete(id);
    this.logger?.debug("Notification hidden", { id });
  }
  async hideAll() {
    const hidePromises = Array.from(this.notifications.keys()).map((id) => this.hide(id));
    await Promise.all(hidePromises);
  }
  getAll() {
    return Array.from(this.notifications.values()).filter((notification) => !!notification.id && notification.visible !== false).map((notification) => ({
      id: notification.id,
      title: notification.title || "",
      message: notification.message,
      type: notification.type || "info",
      position: notification.position || "top-right",
      duration: notification.duration || 3e3,
      theme: notification.theme || "light",
      animation: notification.animation || "fade",
      icon: notification.icon,
      actions: notification.actions || [],
      group: notification.group,
      persistent: notification.persistent || false,
      closable: notification.closable !== false,
      priority: notification.priority || 0,
      metadata: notification.metadata,
      timestamp: notification.createdAt || Date.now(),
      isVisible: notification.visible !== false,
      isAnimating: notification.isAnimating || false,
      showProgress: !!notification.progress,
      progress: notification.progress,
      createdAt: notification.createdAt,
      visible: notification.visible,
      element: notification.element,
      timeoutId: notification.timeoutId
    }));
  }
  // 添加缺失的方法以满足测试需求
  destroy() {
    this.clear();
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = void 0;
    }
    this.cleanupThemeWatcher();
    void this.destroyInternal();
  }
  setPosition(position) {
    this.defaultOptions.position = position;
  }
  getPosition() {
    return this.defaultOptions.position || "top-right";
  }
  setTheme(theme) {
    this.defaultOptions.theme = theme;
    this.setThemeInternal(theme);
  }
  getTheme() {
    return this.getThemeInternal();
  }
  setMaxNotifications(max) {
    this.setMaxNotificationsInternal(max);
  }
  getMaxNotifications() {
    return this.maxNotifications;
  }
  setDefaultDuration(duration) {
    this.defaultOptions.duration = duration;
  }
  getDefaultDuration() {
    return this.defaultOptions.duration || 3e3;
  }
  getStats() {
    return this.getStatsInternal();
  }
  generateId() {
    return `notification-${++this.idCounter}-${Date.now()}`;
  }
  enforceMaxNotifications(position) {
    const visibleNotifications = Array.from(this.notifications.values()).filter((n) => n.visible && n.position === position).sort((a, b) => {
      if (a.priority !== b.priority) {
        return (a.priority || 0) - (b.priority || 0);
      }
      return a.createdAt - b.createdAt;
    });
    while (visibleNotifications.length >= this.maxNotifications) {
      const toRemove = visibleNotifications.shift();
      if (toRemove) {
        this.hide(toRemove.id);
      }
    }
  }
  async renderNotification(notification) {
    const position = notification.position || this.defaultPosition;
    const container = this.createContainer(position);
    if (!container) {
      return;
    }
    const element = this.createNotificationElement(notification);
    notification.element = element;
    element.classList.add("notification-enter");
    if (notification.position?.includes("left")) {
      element.classList.add("notification-position-left");
    } else if (notification.position?.includes("center")) {
      element.classList.add("notification-position-center");
    }
    if (notification.position?.startsWith("bottom")) {
      container.insertBefore(element, container.firstChild);
    } else {
      container.appendChild(element);
    }
    void element.offsetHeight;
    return new Promise((resolve) => {
      element.classList.add("notification-enter-active");
      element.classList.remove("notification-enter");
      const handleTransitionEnd = () => {
        element.removeEventListener("transitionend", handleTransitionEnd);
        element.classList.remove("notification-enter-active");
        resolve();
      };
      element.addEventListener("transitionend", handleTransitionEnd);
      setTimeout(() => {
        element.removeEventListener("transitionend", handleTransitionEnd);
        element.classList.remove("notification-enter-active");
        resolve();
      }, 500);
    });
  }
  createNotificationElement(notification) {
    const element = document.createElement("div");
    element.id = `notification-${notification.id}`;
    element.className = "engine-notification";
    const styles = this.styleManager.getNotificationStyles(notification.type, notification.theme);
    this.styleManager.applyStyles(element, styles.notification);
    if (notification.style) {
      this.styleManager.applyStyles(element, notification.style);
    }
    if (notification.className) {
      element.className += ` ${notification.className}`;
    }
    if (notification.maxWidth) {
      element.style.maxWidth = `${notification.maxWidth}px`;
    }
    if (notification.zIndex) {
      element.style.zIndex = notification.zIndex.toString();
    }
    const content = document.createElement("div");
    const contentStyles = this.styleManager.getNotificationStyles(notification.type, notification.theme);
    this.styleManager.applyStyles(content, contentStyles.content);
    const iconContainer = this.createIconElement(notification);
    if (iconContainer) {
      content.appendChild(iconContainer);
    }
    const textContent = document.createElement("div");
    textContent.style.flex = "1";
    textContent.style.minWidth = "0";
    if (notification.title) {
      const titleElement = document.createElement("div");
      titleElement.className = "engine-notification-title";
      if (notification.allowHTML) {
        titleElement.innerHTML = notification.title;
      } else {
        titleElement.textContent = notification.title;
      }
      this.styleManager.applyStyles(titleElement, contentStyles.title);
      textContent.appendChild(titleElement);
    }
    const messageElement = document.createElement("div");
    messageElement.className = "engine-notification-message";
    if (notification.allowHTML && notification.message) {
      messageElement.innerHTML = notification.message;
    } else if (notification.message) {
      messageElement.textContent = notification.message;
    } else {
      messageElement.textContent = "";
    }
    this.styleManager.applyStyles(messageElement, contentStyles.message);
    textContent.appendChild(messageElement);
    content.appendChild(textContent);
    if (notification.progress) {
      const progressContainer = this.createProgressElement(notification.progress, notification.theme);
      textContent.appendChild(progressContainer);
    }
    if (notification.actions && notification.actions.length > 0) {
      const actionsContainer = this.createActionsElement(notification.actions, notification);
      textContent.appendChild(actionsContainer);
    }
    if (notification.closable) {
      const closeButton = this.createCloseButton(notification);
      element.appendChild(closeButton);
    }
    if (notification.onClick) {
      element.style.cursor = "pointer";
      const clickHandler = (e) => {
        if (e.target.closest(".engine-notification-close, .engine-notification-actions")) {
          return;
        }
        if (notification.onClick) {
          try {
            notification.onClick();
          } catch (error) {
            this.logger?.error("Error in notification onClick callback", error);
          }
        }
      };
      element.addEventListener("click", clickHandler);
      element.__clickHandler = clickHandler;
    }
    element.appendChild(content);
    return element;
  }
  /**
   * 创建图标元素
   */
  createIconElement(notification) {
    const iconContainer = document.createElement("div");
    iconContainer.className = "engine-notification-icon";
    const styles = this.styleManager.getNotificationStyles(notification.type, notification.theme);
    this.styleManager.applyStyles(iconContainer, styles.icon);
    if (notification.icon) {
      if (typeof notification.icon === "string") {
        iconContainer.innerHTML = notification.icon;
      } else {
        iconContainer.appendChild(notification.icon);
      }
    } else {
      iconContainer.innerHTML = this.getTypeIcon(notification.type);
    }
    iconContainer.style.color = this.getTypeColor(notification.type);
    return iconContainer;
  }
  /**
   * 创建进度条元素
   */
  createProgressElement(progress, theme) {
    const container = document.createElement("div");
    container.className = "engine-notification-progress";
    const styles = this.styleManager.getNotificationStyles("info", theme);
    this.styleManager.applyStyles(container, styles.progress);
    const bar = document.createElement("div");
    bar.className = "engine-notification-progress-bar";
    const barStyles = this.styleManager.getProgressBarStyles(progress.value, progress.color, theme);
    this.styleManager.applyStyles(bar, barStyles);
    container.appendChild(bar);
    if (progress.showText) {
      const text = document.createElement("div");
      text.className = "engine-notification-progress-text";
      text.textContent = `${Math.round(progress.value)}%`;
      text.style.fontSize = "11px";
      text.style.marginTop = "4px";
      text.style.textAlign = "center";
      container.appendChild(text);
    }
    return container;
  }
  /**
   * 创建操作按钮容器
   */
  createActionsElement(actions, notification) {
    const container = document.createElement("div");
    container.className = "engine-notification-actions";
    const styles = this.styleManager.getNotificationStyles(notification.type, notification.theme);
    this.styleManager.applyStyles(container, styles.actions);
    actions.forEach((action) => {
      const button = document.createElement("button");
      button.className = "engine-notification-action";
      button.textContent = action.label;
      const buttonStyles = this.styleManager.getActionButtonStyles(action.style, notification.theme);
      this.styleManager.applyStyles(button, buttonStyles);
      if (action.loading) {
        button.disabled = true;
        button.textContent = "...";
      }
      const actionHandler = async (e) => {
        e.stopPropagation();
        try {
          button.disabled = true;
          button.textContent = "...";
          await action.action();
          this.hide(notification.id);
        } catch (error) {
          this.logger?.error("Error in notification action", error);
        } finally {
          button.disabled = false;
          button.textContent = action.label;
        }
      };
      button.addEventListener("click", actionHandler);
      button.__actionHandler = actionHandler;
      container.appendChild(button);
    });
    return container;
  }
  /**
   * 创建关闭按钮
   */
  createCloseButton(notification) {
    const button = document.createElement("button");
    button.className = "engine-notification-close";
    button.innerHTML = "\xD7";
    button.setAttribute("aria-label", "Close notification");
    const styles = this.styleManager.getNotificationStyles(notification.type, notification.theme);
    this.styleManager.applyStyles(button, styles.closeButton);
    const closeHandler = (e) => {
      e.stopPropagation();
      this.hide(notification.id);
    };
    const enterHandler = () => {
      button.style.opacity = "0.8";
    };
    const leaveHandler = () => {
      button.style.opacity = "0.5";
    };
    button.addEventListener("click", closeHandler);
    button.addEventListener("mouseenter", enterHandler);
    button.addEventListener("mouseleave", leaveHandler);
    button.__handlers = { closeHandler, enterHandler, leaveHandler };
    return button;
  }
  /**
   * 更新通知样式
   */
  updateNotificationStyles(notification) {
    if (!notification.element)
      return;
    const styles = this.styleManager.getNotificationStyles(notification.type, notification.theme);
    this.styleManager.applyStyles(notification.element, styles.notification);
  }
  /**
   * 注入CSS样式
   */
  injectStyles() {
    if (typeof document === "undefined")
      return;
    const styleId = "notification-animations";
    if (document.getElementById(styleId))
      return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .notification-enter {
        height: 0 !important;
        opacity: 0 !important;
        overflow: hidden !important;
        margin-bottom: 0 !important;
        padding-top: 0 !important;
        padding-bottom: 0 !important;
        transform: translateX(100%) !important;
      }

      .notification-enter.notification-position-left {
        transform: translateX(-100%) !important;
      }

      .notification-enter.notification-position-center {
        transform: translateY(-100%) !important;
      }

      .notification-enter-active {
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
        height: auto !important;
        opacity: 1 !important;
        overflow: visible !important;
        margin-bottom: 12px !important;
        padding-top: 16px !important;
        padding-bottom: 16px !important;
        transform: translateX(0) translateY(0) !important;
      }

      .notification-leave {
        transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }

      .notification-leave-active {
        height: 0 !important;
        opacity: 0 !important;
        overflow: hidden !important;
        margin-bottom: 0 !important;
        padding-top: 0 !important;
        padding-bottom: 0 !important;
        transform: translateX(100%) !important;
      }

      .notification-leave-active.notification-position-left {
        transform: translateX(-100%) !important;
      }

      .notification-leave-active.notification-position-center {
        transform: translateY(-100%) !important;
      }
    `;
    document.head.appendChild(style);
  }
  /**
   * 移除通知元素（带动画）
   */
  async removeNotificationElement(notification) {
    if (!notification.element)
      return;
    const position = notification.position || this.defaultPosition;
    const container = this.containers.get(position);
    if (!container)
      return;
    try {
      const elementToRemove = notification.element;
      const allElements = Array.from(container.children);
      const elementIndex = allElements.indexOf(elementToRemove);
      if (elementIndex === -1)
        return;
      const elementHeight = this.getElementTotalHeight(elementToRemove);
      const elementsToMove = this.getElementsToMove(allElements, elementIndex, position);
      if (elementsToMove.length > 0) {
        this.startOtherElementsAnimation(elementsToMove, elementHeight, position);
      }
      elementToRemove.classList.add("notification-leave");
      if (notification.position?.includes("left")) {
        elementToRemove.classList.add("notification-position-left");
      } else if (notification.position?.includes("center")) {
        elementToRemove.classList.add("notification-position-center");
      }
      return new Promise((resolve) => {
        elementToRemove.classList.add("notification-leave-active");
        const handleTransitionEnd = () => {
          elementToRemove.removeEventListener("transitionend", handleTransitionEnd);
          elementToRemove.remove();
          notification.element = void 0;
          resolve();
        };
        elementToRemove.addEventListener("transitionend", handleTransitionEnd);
        setTimeout(() => {
          elementToRemove.removeEventListener("transitionend", handleTransitionEnd);
          if (elementToRemove.parentNode) {
            elementToRemove.remove();
          }
          notification.element = void 0;
          resolve();
        }, 400);
      });
    } catch (error) {
      this.logger?.error("Error in notification exit animation", error);
      if (notification.element) {
        notification.element.remove();
        notification.element = void 0;
      }
    }
  }
  /**
   * 获取元素的总高度（包括margin）
   */
  getElementTotalHeight(element) {
    const computedStyle = window.getComputedStyle(element);
    const height = element.offsetHeight;
    const marginTop = Number.parseInt(computedStyle.marginTop) || 0;
    const marginBottom = Number.parseInt(computedStyle.marginBottom) || 0;
    return height + marginTop + marginBottom;
  }
  /**
   * 获取需要移动的元素
   */
  getElementsToMove(allElements, removedIndex, position) {
    const isBottomPosition = position.startsWith("bottom");
    if (isBottomPosition) {
      return allElements.slice(0, removedIndex);
    } else {
      return allElements.slice(removedIndex + 1);
    }
  }
  /**
   * 立即开始其他元素的移动动画
   */
  startOtherElementsAnimation(elements, moveDistance, position) {
    const isBottomPosition = position.startsWith("bottom");
    const direction = isBottomPosition ? moveDistance : -moveDistance;
    elements.forEach((element) => {
      element.style.transition = "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)";
      element.style.transform = `translateY(${direction}px)`;
      const cleanup = () => {
        element.style.transition = "";
        element.style.transform = "";
        element.removeEventListener("transitionend", cleanup);
      };
      element.addEventListener("transitionend", cleanup);
      setTimeout(cleanup, 400);
    });
  }
  /**
   * 根据类型返回颜色
   */
  getTypeColor(type) {
    if (!type)
      type = "info";
    switch (type) {
      case "success":
        return "#10b981";
      case "error":
        return "#ef4444";
      case "warning":
        return "#f59e0b";
      case "info":
      default:
        return "#3b82f6";
    }
  }
  /**
   * 根据类型返回SVG图标
   */
  getTypeIcon(type) {
    if (!type)
      type = "info";
    switch (type) {
      case "success":
        return `<svg viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>`;
      case "error":
        return `<svg viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>`;
      case "warning":
        return `<svg viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>`;
      case "info":
      default:
        return `<svg viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>`;
    }
  }
  /**
   * 设置主题（内部方法）
   */
  setThemeInternal(theme) {
    this.defaultTheme = theme;
    this.styleManager.setTheme(theme === "auto" ? this.styleManager.detectSystemTheme() : theme);
    this.updateAllNotificationStyles();
  }
  /**
   * 内部获取主题方法
   */
  getThemeInternal() {
    return this.defaultTheme;
  }
  /**
   * 内部方法：设置最大通知数量
   */
  setMaxNotificationsInternal(max) {
    this.maxNotifications = max;
    const positions = [
      "top-left",
      "top-center",
      "top-right",
      "bottom-left",
      "bottom-center",
      "bottom-right"
    ];
    positions.forEach((position) => {
      this.enforceMaxNotifications(position);
    });
  }
  /**
   * 内部统计方法
   */
  getStatsInternal() {
    const byType = {
      success: 0,
      error: 0,
      warning: 0,
      info: 0
    };
    const byPosition = {
      "top-left": 0,
      "top-center": 0,
      "top-right": 0,
      "bottom-left": 0,
      "bottom-center": 0,
      "bottom-right": 0
    };
    let visible = 0;
    Array.from(this.notifications.values()).forEach((notification) => {
      if (notification.visible) {
        visible++;
      }
      const type = notification.type || "info";
      byType[type]++;
      const position = notification.position || "top-right";
      byPosition[position]++;
    });
    return {
      total: this.notifications.size,
      visible,
      byType,
      byPosition
    };
  }
  /**
   * 内部销毁方法
   */
  async destroyInternal() {
    await this.hideAll();
    this.containers.forEach((container) => {
      const elements = container.querySelectorAll(".engine-notification");
      elements.forEach((el) => this.cleanupElement(el));
      container.remove();
    });
    this.containers.clear();
    this.notifications.forEach((notification) => {
      if (notification.timeoutId) {
        clearTimeout(notification.timeoutId);
        notification.timeoutId = void 0;
      }
      if (notification.element) {
        this.cleanupElement(notification.element);
        notification.element = void 0;
      }
    });
    this.notifications.clear();
    const styleElement = document.getElementById("notification-animations");
    if (styleElement) {
      styleElement.remove();
    }
  }
  // 添加缺失的方法
  update(id, options) {
    const notification = this.notifications.get(id);
    if (notification) {
      Object.assign(notification, options);
    }
  }
  get(id) {
    const notification = this.notifications.get(id);
    if (notification && notification.visible) {
      return {
        id: notification.id,
        title: notification.title || "",
        message: notification.message,
        type: notification.type || "info",
        position: notification.position || "top-right",
        duration: notification.duration || 3e3,
        animation: notification.animation || "fade",
        theme: notification.theme || "light",
        icon: notification.icon || "",
        actions: notification.actions || [],
        closable: notification.closable !== false,
        persistent: notification.persistent || false,
        showProgress: !!notification.progress,
        progress: notification.progress,
        group: notification.group,
        priority: notification.priority || 0,
        metadata: notification.metadata || {},
        timestamp: notification.createdAt,
        isVisible: notification.visible,
        isAnimating: notification.isAnimating || false
      };
    }
    return void 0;
  }
  clear() {
    this.hideAll();
  }
  /**
   * 启动定期清理
   */
  startCleanup() {
    this.cleanupInterval = window.setInterval(() => {
      this.cleanupExpiredNotifications();
    }, 6e4);
  }
  /**
   * 清理过期通知
   */
  cleanupExpiredNotifications() {
    const now = Date.now();
    const expiredNotifications = [];
    this.notifications.forEach((notification, id) => {
      if (!notification.visible && now - notification.createdAt > 6e5) {
        expiredNotifications.push(id);
      }
    });
    expiredNotifications.forEach((id) => {
      const notification = this.notifications.get(id);
      if (notification?.element) {
        this.cleanupElement(notification.element);
      }
      this.notifications.delete(id);
    });
  }
  /**
   * 清理元素的事件监听器
   */
  cleanupElement(element) {
    if (!element)
      return;
    const clickHandler = element.__clickHandler;
    if (clickHandler) {
      element.removeEventListener("click", clickHandler);
      delete element.__clickHandler;
    }
    const buttons = element.querySelectorAll("button");
    buttons.forEach((button) => {
      const handlers = button.__handlers;
      if (handlers) {
        button.removeEventListener("click", handlers.closeHandler || handlers.actionHandler);
        button.removeEventListener("mouseenter", handlers.enterHandler);
        button.removeEventListener("mouseleave", handlers.leaveHandler);
        delete button.__handlers;
      }
      const actionHandler = button.__actionHandler;
      if (actionHandler) {
        button.removeEventListener("click", actionHandler);
        delete button.__actionHandler;
      }
    });
    element.innerHTML = "";
  }
  /**
   * 清理主题监听器
   */
  cleanupThemeWatcher() {
    if (this.themeUnsubscribe) {
      try {
        this.themeUnsubscribe();
      } catch {
      }
      this.themeUnsubscribe = void 0;
    }
    if (this.styleManager && typeof this.styleManager.cleanup === "function") {
      this.styleManager.cleanup();
    }
  }
  setDefaultOptions(options) {
    Object.assign(this.defaultOptions, options);
  }
  getDefaultOptions() {
    return { ...this.defaultOptions };
  }
}
function createNotificationManager(logger) {
  return new NotificationManagerImpl(logger);
}
const notificationTypes = {
  success: (message, title, options) => ({
    type: "success",
    message,
    title,
    ...options
  }),
  error: (message, title, options) => ({
    type: "error",
    message,
    title,
    duration: 0,
    // 错误通知默认不自动关闭
    ...options
  }),
  warning: (message, title, options) => ({
    type: "warning",
    message,
    title,
    ...options
  }),
  info: (message, title, options) => ({
    type: "info",
    message,
    title,
    ...options
  })
};
function createNotificationHelpers(manager) {
  return {
    success: (message, title, options) => {
      return manager.show(notificationTypes.success(message, title, options));
    },
    error: (message, title, options) => {
      return manager.show(notificationTypes.error(message, title, options));
    },
    warning: (message, title, options) => {
      return manager.show(notificationTypes.warning(message, title, options));
    },
    info: (message, title, options) => {
      return manager.show(notificationTypes.info(message, title, options));
    },
    // 批量通知
    batch: (notifications) => {
      return notifications.map((notification) => manager.show(notification));
    },
    // 进度通知
    progress: (message, initialValue = 0, options) => {
      const id = manager.show({
        type: "info",
        message,
        duration: 0,
        closable: false,
        progress: {
          value: initialValue,
          max: 100,
          showText: true
        },
        ...options
      });
      return {
        id,
        update: (_value, _newMessage) => {
        },
        complete: (successMessage) => {
          manager.hide(id);
          if (successMessage) {
            manager.show({
              type: "success",
              message: successMessage,
              duration: 3e3
            });
          }
        },
        error: (errorMessage) => {
          manager.hide(id);
          if (errorMessage) {
            manager.show({
              type: "error",
              message: errorMessage,
              duration: 0
            });
          }
        }
      };
    },
    // 确认通知
    confirm: (message, title, options) => {
      return new Promise((resolve) => {
        manager.show({
          type: "warning",
          message,
          title,
          duration: 0,
          closable: false,
          actions: [
            {
              label: "\u786E\u8BA4",
              style: "primary",
              action: () => {
                resolve(true);
              }
            },
            {
              label: "\u53D6\u6D88",
              style: "secondary",
              action: () => {
                resolve(false);
              }
            }
          ],
          ...options
        });
      });
    },
    // 加载通知
    loading: (message, options) => {
      const id = manager.show({
        type: "info",
        message,
        duration: 0,
        closable: false,
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="31.416" stroke-dashoffset="31.416">
            <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
            <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
          </circle>
        </svg>`,
        ...options
      });
      return {
        id,
        update: (_newMessage) => {
        },
        success: (successMessage) => {
          manager.hide(id);
          manager.show({
            type: "success",
            message: successMessage,
            duration: 3e3
          });
        },
        error: (errorMessage) => {
          manager.hide(id);
          manager.show({
            type: "error",
            message: errorMessage,
            duration: 0
          });
        },
        hide: () => {
          manager.hide(id);
        }
      };
    },
    // 分组通知
    group: (groupId, notifications) => {
      return notifications.map((notification) => manager.show({
        ...notification,
        group: groupId
      }));
    },
    // 清除分组
    clearGroup: (groupId) => {
      const allNotifications = manager.getAll();
      allNotifications.forEach((notification) => {
        if (notification.group === groupId) ;
      });
    }
  };
}

exports.NotificationManagerImpl = NotificationManagerImpl;
exports.createNotificationHelpers = createNotificationHelpers;
exports.createNotificationManager = createNotificationManager;
exports.notificationTypes = notificationTypes;
//# sourceMappingURL=notification-manager.cjs.map
