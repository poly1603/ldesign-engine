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

class NotificationStyleManager {
  constructor() {
    this.themes = {
      light: {
        background: "#ffffff",
        text: "#1f2937",
        border: "#e5e7eb",
        shadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
        success: "#10b981",
        error: "#ef4444",
        warning: "#f59e0b",
        info: "#3b82f6"
      },
      dark: {
        background: "#1f2937",
        text: "#f9fafb",
        border: "#374151",
        shadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
        success: "#34d399",
        error: "#f87171",
        warning: "#fbbf24",
        info: "#60a5fa"
      },
      auto: {
        background: "var(--notification-bg, #ffffff)",
        text: "var(--notification-text, #1f2937)",
        border: "var(--notification-border, #e5e7eb)",
        shadow: "var(--notification-shadow, 0 10px 25px rgba(0, 0, 0, 0.1))",
        success: "var(--notification-success, #10b981)",
        error: "var(--notification-error, #ef4444)",
        warning: "var(--notification-warning, #f59e0b)",
        info: "var(--notification-info, #3b82f6)"
      }
    };
    this.currentTheme = "light";
  }
  /**
   * 获取容器位置样式
   */
  getContainerStyles(position) {
    const baseStyles = {
      position: "fixed",
      zIndex: "9999",
      pointerEvents: "none",
      maxWidth: "400px",
      width: "100%"
    };
    switch (position) {
      case "top-left":
        return {
          ...baseStyles,
          top: "20px",
          left: "20px"
        };
      case "top-center":
        return {
          ...baseStyles,
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)"
        };
      case "top-right":
        return {
          ...baseStyles,
          top: "20px",
          right: "20px"
        };
      case "bottom-left":
        return {
          ...baseStyles,
          bottom: "20px",
          left: "20px"
        };
      case "bottom-center":
        return {
          ...baseStyles,
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)"
        };
      case "bottom-right":
        return {
          ...baseStyles,
          bottom: "20px",
          right: "20px"
        };
      default:
        return {
          ...baseStyles,
          top: "20px",
          right: "20px"
        };
    }
  }
  /**
   * 获取通知样式
   */
  getNotificationStyles(type = "info", theme = this.currentTheme) {
    const colors = this.themes[theme];
    const typeColor = colors[type];
    return {
      container: this.getContainerStyles("top-right"),
      notification: {
        background: colors.background,
        color: colors.text,
        borderRadius: "12px",
        boxShadow: colors.shadow,
        marginBottom: "12px",
        padding: "16px",
        pointerEvents: "auto",
        position: "relative",
        borderLeft: `4px solid ${typeColor}`,
        maxWidth: "100%",
        wordWrap: "break-word",
        fontSize: "14px",
        lineHeight: "1.5",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        border: `1px solid ${colors.border}`,
        backdropFilter: "blur(10px)",
        transition: "all 0.2s ease"
      },
      icon: {
        flexShrink: "0",
        width: "20px",
        height: "20px",
        color: typeColor,
        marginRight: "12px"
      },
      content: {
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        flex: "1",
        minWidth: "0"
      },
      title: {
        fontWeight: "600",
        fontSize: "14px",
        color: colors.text,
        marginBottom: "4px",
        lineHeight: "1.4"
      },
      message: {
        fontSize: "13px",
        color: colors.text,
        opacity: "0.8",
        lineHeight: "1.4",
        wordBreak: "break-word"
      },
      closeButton: {
        position: "absolute",
        top: "8px",
        right: "8px",
        background: "none",
        border: "none",
        fontSize: "18px",
        color: colors.text,
        opacity: "0.5",
        cursor: "pointer",
        padding: "0",
        width: "20px",
        height: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "4px",
        transition: "opacity 0.2s ease"
      },
      actions: {
        display: "flex",
        gap: "8px",
        marginTop: "12px",
        flexWrap: "wrap"
      },
      progress: {
        width: "100%",
        height: "4px",
        backgroundColor: colors.border,
        borderRadius: "2px",
        overflow: "hidden",
        marginTop: "8px"
      }
    };
  }
  /**
   * 获取操作按钮样式
   */
  getActionButtonStyles(style = "primary", theme = this.currentTheme) {
    const colors = this.themes[theme];
    const baseStyles = {
      padding: "6px 12px",
      borderRadius: "6px",
      fontSize: "12px",
      fontWeight: "500",
      cursor: "pointer",
      border: "none",
      transition: "all 0.2s ease",
      outline: "none"
    };
    switch (style) {
      case "primary":
        return {
          ...baseStyles,
          backgroundColor: colors.info,
          color: "#ffffff"
        };
      case "secondary":
        return {
          ...baseStyles,
          backgroundColor: "transparent",
          color: colors.text,
          border: `1px solid ${colors.border}`
        };
      case "danger":
        return {
          ...baseStyles,
          backgroundColor: colors.error,
          color: "#ffffff"
        };
      default:
        return baseStyles;
    }
  }
  /**
   * 获取进度条样式
   */
  getProgressBarStyles(value, color, theme = this.currentTheme) {
    const colors = this.themes[theme];
    return {
      width: `${Math.max(0, Math.min(100, value))}%`,
      height: "100%",
      backgroundColor: color || colors.info,
      borderRadius: "2px",
      transition: "width 0.3s ease"
    };
  }
  /**
   * 应用样式到元素
   */
  applyStyles(element, styles) {
    Object.entries(styles).forEach(([property, value]) => {
      if (value !== void 0) {
        element.style.setProperty(property, String(value));
      }
    });
  }
  /**
   * 设置主题
   */
  setTheme(theme) {
    this.currentTheme = theme;
  }
  /**
   * 获取当前主题
   */
  getTheme() {
    return this.currentTheme;
  }
  /**
   * 注册自定义主题
   */
  registerTheme(name, colors) {
    this.themes[name] = colors;
  }
  /**
   * 获取主题颜色
   */
  getThemeColors(theme = this.currentTheme) {
    return { ...this.themes[theme] };
  }
  /**
   * 检测系统主题偏好
   */
  detectSystemTheme() {
    if (typeof window === "undefined") {
      return "light";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  /**
   * 监听系统主题变化
   */
  watchSystemTheme(callback) {
    if (typeof window === "undefined") {
      return () => {
      };
    }
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      callback(e.matches ? "dark" : "light");
    };
    mediaQuery.addEventListener("change", handler);
    return () => {
      mediaQuery.removeEventListener("change", handler);
    };
  }
}
function createStyleManager() {
  return new NotificationStyleManager();
}

exports.NotificationStyleManager = NotificationStyleManager;
exports.createStyleManager = createStyleManager;
//# sourceMappingURL=style-manager.cjs.map
