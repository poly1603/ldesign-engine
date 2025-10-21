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

class NotificationAnimationManager {
  constructor() {
    this.defaultConfig = {
      duration: 350,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      delay: 0
    };
    this.animations = {
      slide: {
        enter: [
          {
            transform: "translateX(var(--enter-x, 100%)) translateY(var(--enter-y, 0))",
            opacity: "0",
            height: "0px",
            marginBottom: "0px",
            paddingTop: "0px",
            paddingBottom: "0px"
          },
          {
            transform: "translateX(0) translateY(0)",
            opacity: "1",
            height: "auto",
            marginBottom: "12px",
            paddingTop: "16px",
            paddingBottom: "16px"
          }
        ],
        exit: [
          {
            transform: "translateX(0) translateY(0)",
            opacity: "1"
          },
          {
            transform: "translateX(var(--exit-x, 100%)) translateY(var(--exit-y, 0))",
            opacity: "0"
          }
        ]
      },
      fade: {
        enter: [
          {
            opacity: "0",
            transform: "scale(0.95)",
            height: "0px",
            marginBottom: "0px",
            paddingTop: "0px",
            paddingBottom: "0px"
          },
          {
            opacity: "1",
            transform: "scale(1)",
            height: "auto",
            marginBottom: "12px",
            paddingTop: "16px",
            paddingBottom: "16px"
          }
        ],
        exit: [
          {
            opacity: "1",
            transform: "scale(1)"
          },
          {
            opacity: "0",
            transform: "scale(0.95)"
          }
        ]
      },
      bounce: {
        enter: [
          {
            transform: "scale(0.3)",
            opacity: "0",
            height: "0px",
            marginBottom: "0px",
            paddingTop: "0px",
            paddingBottom: "0px"
          },
          {
            transform: "scale(1.05)",
            opacity: "0.8",
            height: "auto",
            marginBottom: "12px",
            paddingTop: "16px",
            paddingBottom: "16px"
          },
          {
            transform: "scale(0.9)",
            opacity: "0.9",
            height: "auto",
            marginBottom: "12px",
            paddingTop: "16px",
            paddingBottom: "16px"
          },
          {
            transform: "scale(1)",
            opacity: "1",
            height: "auto",
            marginBottom: "12px",
            paddingTop: "16px",
            paddingBottom: "16px"
          }
        ],
        exit: [
          {
            transform: "scale(1)",
            opacity: "1"
          },
          {
            transform: "scale(0.9)",
            opacity: "0.8"
          },
          {
            transform: "scale(0.3)",
            opacity: "0"
          }
        ]
      },
      scale: {
        enter: [
          {
            transform: "scale(0)",
            opacity: "0",
            height: "0px",
            marginBottom: "0px",
            paddingTop: "0px",
            paddingBottom: "0px"
          },
          {
            transform: "scale(1)",
            opacity: "1",
            height: "auto",
            marginBottom: "12px",
            paddingTop: "16px",
            paddingBottom: "16px"
          }
        ],
        exit: [
          {
            transform: "scale(1)",
            opacity: "1"
          },
          {
            transform: "scale(0)",
            opacity: "0"
          }
        ]
      },
      flip: {
        enter: [
          {
            transform: "rotateY(-90deg)",
            opacity: "0",
            height: "0px",
            marginBottom: "0px",
            paddingTop: "0px",
            paddingBottom: "0px"
          },
          {
            transform: "rotateY(0deg)",
            opacity: "1",
            height: "auto",
            marginBottom: "12px",
            paddingTop: "16px",
            paddingBottom: "16px"
          }
        ],
        exit: [
          {
            transform: "rotateY(0deg)",
            opacity: "1"
          },
          {
            transform: "rotateY(90deg)",
            opacity: "0"
          }
        ]
      }
    };
  }
  /**
   * 获取位置相关的动画变量
   */
  getPositionVariables(position) {
    const variables = {};
    switch (position) {
      case "top-left":
        variables["--enter-x"] = "-100%";
        variables["--exit-x"] = "-100%";
        variables["--enter-y"] = "0";
        variables["--exit-y"] = "0";
        break;
      case "top-center":
        variables["--enter-x"] = "0";
        variables["--exit-x"] = "0";
        variables["--enter-y"] = "-100%";
        variables["--exit-y"] = "-100%";
        break;
      case "top-right":
        variables["--enter-x"] = "100%";
        variables["--exit-x"] = "100%";
        variables["--enter-y"] = "0";
        variables["--exit-y"] = "0";
        break;
      case "bottom-left":
        variables["--enter-x"] = "-100%";
        variables["--exit-x"] = "-100%";
        variables["--enter-y"] = "0";
        variables["--exit-y"] = "0";
        break;
      case "bottom-center":
        variables["--enter-x"] = "0";
        variables["--exit-x"] = "0";
        variables["--enter-y"] = "100%";
        variables["--exit-y"] = "100%";
        break;
      case "bottom-right":
        variables["--enter-x"] = "100%";
        variables["--exit-x"] = "100%";
        variables["--enter-y"] = "0";
        variables["--exit-y"] = "0";
        break;
    }
    return variables;
  }
  /**
   * 应用位置变量到元素
   */
  applyPositionVariables(element, position) {
    const variables = this.getPositionVariables(position);
    Object.entries(variables).forEach(([key, value]) => {
      element.style.setProperty(key, value);
    });
  }
  /**
   * 执行进入动画
   */
  async animateIn(element, animation = "slide", position = "top-right", config) {
    const finalConfig = { ...this.defaultConfig, ...config };
    const keyframes = this.animations[animation];
    if (!keyframes) {
      throw new Error(`Unknown animation: ${animation}`);
    }
    this.applyPositionVariables(element, position);
    const animationInstance = element.animate(keyframes.enter, {
      duration: finalConfig.duration,
      easing: finalConfig.easing,
      delay: finalConfig.delay,
      fill: "forwards"
    });
    await animationInstance.finished;
  }
  /**
   * 执行退出动画
   */
  async animateOut(element, animation = "slide", position = "top-right", config) {
    const finalConfig = { ...this.defaultConfig, ...config };
    const keyframes = this.animations[animation];
    if (!keyframes) {
      throw new Error(`Unknown animation: ${animation}`);
    }
    this.applyPositionVariables(element, position);
    const animationInstance = element.animate(keyframes.exit, {
      duration: finalConfig.duration,
      easing: finalConfig.easing,
      delay: finalConfig.delay,
      fill: "forwards"
    });
    await animationInstance.finished;
  }
  /**
   * 设置默认动画配置
   */
  setDefaultConfig(config) {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }
  /**
   * 获取默认动画配置
   */
  getDefaultConfig() {
    return { ...this.defaultConfig };
  }
  /**
   * 注册自定义动画
   */
  registerAnimation(name, keyframes) {
    this.animations[name] = keyframes;
  }
  /**
   * 获取所有可用的动画名称
   */
  getAvailableAnimations() {
    return Object.keys(this.animations);
  }
}
function createAnimationManager() {
  return new NotificationAnimationManager();
}

exports.NotificationAnimationManager = NotificationAnimationManager;
exports.createAnimationManager = createAnimationManager;
//# sourceMappingURL=animation-manager.cjs.map
