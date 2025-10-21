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

class ManagerRegistry {
  constructor(logger) {
    this.managers = /* @__PURE__ */ new Map();
    this.initOrder = [];
    this.logger = logger;
  }
  // 注册管理器
  register(name, dependencies = [], lazy = false) {
    if (this.managers.has(name)) {
      this.logger?.warn(`Manager "${name}" already registered`);
      return;
    }
    const status = {
      name,
      initialized: false,
      dependencies,
      dependents: [],
      lazy
    };
    this.managers.set(name, status);
    dependencies.forEach((dep) => {
      const depStatus = this.managers.get(dep);
      if (depStatus) {
        depStatus.dependents.push(name);
      }
    });
    this.logger?.debug(`Manager "${name}" registered`, {
      dependencies,
      lazy
    });
  }
  // 标记管理器为已初始化
  markInitialized(name, error) {
    const status = this.managers.get(name);
    if (!status) {
      this.logger?.warn(`Manager "${name}" not found in registry`);
      return;
    }
    status.initialized = !error;
    status.initTime = Date.now();
    status.error = error;
    if (!error) {
      this.initOrder.push(name);
      this.logger?.debug(`Manager "${name}" initialized successfully`);
    } else {
      this.logger?.error(`Manager "${name}" initialization failed`, error);
    }
  }
  // 检查依赖是否满足
  checkDependencies(name) {
    const status = this.managers.get(name);
    if (!status) {
      return { satisfied: false, missing: [name] };
    }
    const missing = [];
    for (const dep of status.dependencies) {
      const depStatus = this.managers.get(dep);
      if (!depStatus || !depStatus.initialized) {
        missing.push(dep);
      }
    }
    return {
      satisfied: missing.length === 0,
      missing
    };
  }
  // 获取初始化顺序建议
  getInitializationOrder() {
    const order = [];
    const visited = /* @__PURE__ */ new Set();
    const visiting = /* @__PURE__ */ new Set();
    const visit = (name) => {
      if (visited.has(name))
        return;
      if (visiting.has(name)) {
        throw new Error(`Circular dependency detected involving "${name}"`);
      }
      visiting.add(name);
      const status = this.managers.get(name);
      if (status && !status.lazy) {
        status.dependencies.forEach((dep) => {
          const depStatus = this.managers.get(dep);
          if (depStatus && !depStatus.lazy) {
            visit(dep);
          }
        });
        order.push(name);
      }
      visiting.delete(name);
      visited.add(name);
    };
    for (const [name, status] of this.managers) {
      if (!status.lazy) {
        visit(name);
      }
    }
    return order;
  }
  // 获取管理器状态
  getStatus(name) {
    return this.managers.get(name);
  }
  // 获取所有管理器状态
  getAllStatus() {
    return Array.from(this.managers.values());
  }
  // 获取初始化统计
  getInitializationStats() {
    const all = this.getAllStatus();
    const initialized = all.filter((s) => s.initialized);
    const failed = all.filter((s) => s.error);
    const lazy = all.filter((s) => s.lazy);
    const initTimes = initialized.map((s) => s.initTime).filter((t) => t !== void 0);
    const averageInitTime = initTimes.length > 0 ? initTimes.reduce((sum, time) => sum + time, 0) / initTimes.length : 0;
    return {
      total: all.length,
      initialized: initialized.length,
      failed: failed.length,
      lazy: lazy.length,
      initOrder: [...this.initOrder],
      averageInitTime
    };
  }
  /**
   * 验证依赖关系图的完整性
   */
  validateDependencyGraph() {
    const errors = [];
    const warnings = [];
    try {
      this.getInitializationOrder();
    } catch (error) {
      errors.push(error.message);
    }
    for (const [name, status] of this.managers) {
      for (const dep of status.dependencies) {
        if (!this.managers.has(dep)) {
          errors.push(`Manager "${name}" depends on missing manager "${dep}"`);
        }
      }
    }
    for (const [name, status] of this.managers) {
      if (status.dependencies.length === 0 && status.dependents.length === 0) {
        warnings.push(`Manager "${name}" has no dependencies or dependents`);
      }
    }
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  // 生成依赖图的可视化表示
  generateDependencyGraph() {
    let graph = "digraph ManagerDependencies {\n";
    graph += "  rankdir=TB;\n";
    graph += "  node [shape=box];\n\n";
    for (const [name, status] of this.managers) {
      const color = status.lazy ? "lightblue" : "lightgreen";
      const style = status.initialized ? "solid" : "dashed";
      graph += `  "${name}" [fillcolor=${color}, style="filled, ${style}"];
`;
    }
    graph += "\n";
    for (const [name, status] of this.managers) {
      for (const dep of status.dependencies) {
        graph += `  "${dep}" -> "${name}";
`;
      }
    }
    graph += "}\n";
    return graph;
  }
  // 清理注册表
  clear() {
    this.managers.clear();
    this.initOrder = [];
    this.logger?.debug("Manager registry cleared");
  }
}
let globalRegistry;
function getGlobalManagerRegistry() {
  if (!globalRegistry) {
    globalRegistry = new ManagerRegistry();
  }
  return globalRegistry;
}
function setGlobalManagerRegistry(registry) {
  globalRegistry = registry;
}
function Manager(name, dependencies = [], lazy = false) {
  return function(constructor) {
    const registry = getGlobalManagerRegistry();
    registry.register(name, dependencies, lazy);
    return class extends constructor {
      constructor(...args) {
        super(...args);
        registry.markInitialized(name);
      }
    };
  };
}

exports.Manager = Manager;
exports.ManagerRegistry = ManagerRegistry;
exports.getGlobalManagerRegistry = getGlobalManagerRegistry;
exports.setGlobalManagerRegistry = setGlobalManagerRegistry;
//# sourceMappingURL=manager-registry.cjs.map
