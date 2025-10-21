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

class DependencyResolver {
  constructor(logger) {
    this.logger = logger;
    this.graph = {
      nodes: /* @__PURE__ */ new Map(),
      edges: /* @__PURE__ */ new Map(),
      roots: /* @__PURE__ */ new Set(),
      leaves: /* @__PURE__ */ new Set()
    };
    this.cycles = [];
    this.missing = /* @__PURE__ */ new Set();
    this.incompatible = [];
  }
  /**
   * 解析插件依赖并返回加载顺序
   */
  resolve(plugins) {
    this.reset();
    this.buildGraph(plugins);
    this.detectCycles();
    if (this.cycles.length > 0) {
      this.logger?.error("Circular dependencies detected", this.cycles);
      return {
        success: false,
        cycles: this.cycles,
        missing: Array.from(this.missing),
        incompatible: this.incompatible
      };
    }
    this.checkMissingDependencies();
    if (this.missing.size > 0 && !this.hasOnlyOptionalMissing()) {
      this.logger?.error("Missing required dependencies", Array.from(this.missing));
      return {
        success: false,
        missing: Array.from(this.missing),
        incompatible: this.incompatible
      };
    }
    this.checkVersionCompatibility(plugins);
    if (this.incompatible.length > 0) {
      const criticalIncompatible = this.incompatible.filter((i) => !this.isOptionalDependency(i.plugin, i.dependency));
      if (criticalIncompatible.length > 0) {
        this.logger?.error("Incompatible plugin versions", criticalIncompatible);
        return {
          success: false,
          incompatible: this.incompatible,
          missing: Array.from(this.missing)
        };
      }
    }
    const order = this.topologicalSort();
    if (!order) {
      return {
        success: false,
        cycles: this.cycles,
        missing: Array.from(this.missing),
        incompatible: this.incompatible
      };
    }
    const warnings = this.generateWarnings();
    this.logger?.info("Plugin dependency resolution completed", {
      totalPlugins: plugins.length,
      loadOrder: order.map((p) => p.name),
      warnings: warnings.length
    });
    return {
      success: true,
      order,
      warnings,
      missing: Array.from(this.missing).filter((m) => this.isOptionalDependency("", m)),
      incompatible: this.incompatible.filter((i) => this.isOptionalDependency(i.plugin, i.dependency))
    };
  }
  /**
   * 构建依赖图
   */
  buildGraph(plugins) {
    for (const plugin of plugins) {
      const dependencies = this.parseDependencies(plugin);
      const node = {
        plugin,
        dependencies,
        dependents: /* @__PURE__ */ new Set(),
        depth: 0,
        visited: false,
        processing: false
      };
      this.graph.nodes.set(plugin.name, node);
      this.graph.edges.set(plugin.name, /* @__PURE__ */ new Set());
    }
    for (const [name, node] of this.graph.nodes) {
      for (const dep of node.dependencies) {
        if (this.graph.nodes.has(dep.name)) {
          this.graph.edges.get(name).add(dep.name);
          this.graph.nodes.get(dep.name).dependents.add(name);
        } else if (dep.type === "required") {
          this.missing.add(dep.name);
        }
      }
    }
    for (const [name, node] of this.graph.nodes) {
      if (node.dependencies.length === 0 || node.dependencies.every((d) => d.type === "optional")) {
        this.graph.roots.add(name);
      }
      if (node.dependents.size === 0) {
        this.graph.leaves.add(name);
      }
    }
    this.calculateDepth();
  }
  /**
   * 解析插件依赖
   */
  parseDependencies(plugin) {
    const deps = [];
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (typeof dep === "string") {
          deps.push({ name: dep, type: "required" });
        } else if (typeof dep === "object") {
          deps.push(dep);
        }
      }
    }
    if (plugin.peerDependencies) {
      for (const dep of plugin.peerDependencies) {
        if (typeof dep === "string") {
          deps.push({ name: dep, type: "peer" });
        } else if (typeof dep === "object") {
          deps.push({ ...dep, type: "peer" });
        }
      }
    }
    if (plugin.optionalDependencies) {
      for (const dep of plugin.optionalDependencies) {
        if (typeof dep === "string") {
          deps.push({ name: dep, type: "optional" });
        } else if (typeof dep === "object") {
          deps.push({ ...dep, type: "optional" });
        }
      }
    }
    return deps;
  }
  /**
   * 检测循环依赖（使用 DFS）
   */
  detectCycles() {
    const visited = /* @__PURE__ */ new Set();
    const stack = /* @__PURE__ */ new Set();
    const dfs = (nodeName, path = []) => {
      if (stack.has(nodeName)) {
        const cycleStart = path.indexOf(nodeName);
        if (cycleStart !== -1) {
          const cycle = path.slice(cycleStart);
          cycle.push(nodeName);
          this.cycles.push(cycle);
          return;
        }
      }
      if (visited.has(nodeName)) {
        return;
      }
      visited.add(nodeName);
      stack.add(nodeName);
      path.push(nodeName);
      const edges = this.graph.edges.get(nodeName);
      if (edges) {
        for (const neighbor of edges) {
          dfs(neighbor, [...path]);
        }
      }
      stack.delete(nodeName);
    };
    for (const nodeName of this.graph.nodes.keys()) {
      if (!visited.has(nodeName)) {
        dfs(nodeName);
      }
    }
  }
  /**
   * 拓扑排序（使用 Kahn's 算法）
   */
  topologicalSort() {
    const inDegree = /* @__PURE__ */ new Map();
    const queue = [];
    const sorted = [];
    for (const [name] of this.graph.nodes) {
      inDegree.set(name, 0);
    }
    for (const [, edges] of this.graph.edges) {
      for (const target of edges) {
        inDegree.set(target, (inDegree.get(target) || 0) + 1);
      }
    }
    for (const [name, degree] of inDegree) {
      if (degree === 0) {
        queue.push(name);
      }
    }
    while (queue.length > 0) {
      const current = queue.shift();
      const node = this.graph.nodes.get(current);
      if (node) {
        sorted.push(node.plugin);
        const edges = this.graph.edges.get(current);
        if (edges) {
          for (const neighbor of edges) {
            const newDegree = (inDegree.get(neighbor) || 0) - 1;
            inDegree.set(neighbor, newDegree);
            if (newDegree === 0) {
              queue.push(neighbor);
            }
          }
        }
      }
    }
    if (sorted.length !== this.graph.nodes.size) {
      this.logger?.error("Topological sort failed - graph has cycles or disconnected components");
      return null;
    }
    return sorted;
  }
  /**
   * 计算节点深度
   */
  calculateDepth() {
    const visited = /* @__PURE__ */ new Set();
    const calculateNodeDepth = (nodeName) => {
      if (visited.has(nodeName)) {
        const node2 = this.graph.nodes.get(nodeName);
        return node2?.depth || 0;
      }
      visited.add(nodeName);
      const node = this.graph.nodes.get(nodeName);
      if (!node)
        return 0;
      let maxDepth = 0;
      const edges = this.graph.edges.get(nodeName);
      if (edges) {
        for (const dep of edges) {
          const depthValue = calculateNodeDepth(dep) + 1;
          maxDepth = Math.max(maxDepth, depthValue);
        }
      }
      node.depth = maxDepth;
      return maxDepth;
    };
    for (const nodeName of this.graph.nodes.keys()) {
      calculateNodeDepth(nodeName);
    }
  }
  /**
   * 检查缺失的依赖
   */
  checkMissingDependencies() {
    for (const [, node] of this.graph.nodes) {
      for (const dep of node.dependencies) {
        if (!this.graph.nodes.has(dep.name)) {
          if (dep.condition && !dep.condition()) {
            continue;
          }
          if (dep.type === "required") {
            this.missing.add(dep.name);
          }
        }
      }
    }
  }
  /**
   * 检查版本兼容性
   */
  checkVersionCompatibility(plugins) {
    const pluginVersions = /* @__PURE__ */ new Map();
    for (const plugin of plugins) {
      pluginVersions.set(plugin.name, plugin.version || "0.0.0");
    }
    for (const [pluginName, node] of this.graph.nodes) {
      for (const dep of node.dependencies) {
        const depVersion = pluginVersions.get(dep.name);
        if (!depVersion)
          continue;
        if (dep.version) {
          const compatible = this.isVersionCompatible(depVersion, dep.version);
          if (!compatible) {
            this.incompatible.push({
              plugin: pluginName,
              dependency: dep.name,
              reason: `Required ${this.formatVersionRequirement(dep.version)}, got ${depVersion}`
            });
          }
        }
      }
    }
  }
  /**
   * 检查版本兼容性
   */
  isVersionCompatible(version, requirement) {
    if (typeof requirement === "string") {
      if (requirement.startsWith("^")) {
        const reqMajor = requirement.slice(1).split(".")[0];
        const verMajor = version.split(".")[0];
        return reqMajor === verMajor;
      } else if (requirement.startsWith("~")) {
        const reqParts = requirement.slice(1).split(".");
        const verParts = version.split(".");
        return reqParts[0] === verParts[0] && reqParts[1] === verParts[1];
      } else {
        return version === requirement;
      }
    } else {
      const verParts = version.split(".").map(Number);
      if (requirement.exact) {
        return version === requirement.exact;
      }
      if (requirement.min) {
        const minParts = requirement.min.split(".").map(Number);
        for (let i = 0; i < minParts.length; i++) {
          if ((verParts[i] || 0) < minParts[i])
            return false;
          if ((verParts[i] || 0) > minParts[i])
            break;
        }
      }
      if (requirement.max) {
        const maxParts = requirement.max.split(".").map(Number);
        for (let i = 0; i < maxParts.length; i++) {
          if ((verParts[i] || 0) > maxParts[i])
            return false;
          if ((verParts[i] || 0) < maxParts[i])
            break;
        }
      }
      return true;
    }
  }
  /**
   * 格式化版本要求
   */
  formatVersionRequirement(requirement) {
    if (typeof requirement === "string") {
      return requirement;
    }
    if (requirement.exact) {
      return `= ${requirement.exact}`;
    }
    const parts = [];
    if (requirement.min)
      parts.push(`>= ${requirement.min}`);
    if (requirement.max)
      parts.push(`<= ${requirement.max}`);
    return parts.join(" and ");
  }
  /**
   * 检查是否只有可选依赖缺失
   */
  hasOnlyOptionalMissing() {
    for (const missing of this.missing) {
      let isOptional = false;
      for (const [, node] of this.graph.nodes) {
        const dep = node.dependencies.find((d) => d.name === missing);
        if (dep && dep.type === "optional") {
          isOptional = true;
          break;
        }
      }
      if (!isOptional) {
        return false;
      }
    }
    return true;
  }
  /**
   * 检查是否是可选依赖
   */
  isOptionalDependency(plugin, dependency) {
    if (!plugin) {
      for (const [, node2] of this.graph.nodes) {
        const dep2 = node2.dependencies.find((d) => d.name === dependency);
        if (dep2 && dep2.type === "optional") {
          return true;
        }
      }
      return false;
    }
    const node = this.graph.nodes.get(plugin);
    if (!node)
      return false;
    const dep = node.dependencies.find((d) => d.name === dependency);
    return dep?.type === "optional";
  }
  /**
   * 生成警告信息
   */
  generateWarnings() {
    const warnings = [];
    for (const missing of this.missing) {
      if (this.isOptionalDependency("", missing)) {
        warnings.push(`Optional dependency "${missing}" is not available`);
      }
    }
    for (const incomp of this.incompatible) {
      if (this.isOptionalDependency(incomp.plugin, incomp.dependency)) {
        warnings.push(`Optional dependency version mismatch: ${incomp.plugin} -> ${incomp.dependency}: ${incomp.reason}`);
      }
    }
    for (const [name, node] of this.graph.nodes) {
      if (node.depth > 5) {
        warnings.push(`Plugin "${name}" has a deep dependency chain (depth: ${node.depth})`);
      }
    }
    return warnings;
  }
  /**
   * 获取依赖图的可视化表示
   */
  getVisualization(format = "json") {
    switch (format) {
      case "mermaid":
        return this.toMermaid();
      case "dot":
        return this.toDot();
      default:
        return this.toJson();
    }
  }
  /**
   * 转换为 Mermaid 图
   */
  toMermaid() {
    const lines = ["graph TD"];
    for (const [from, edges] of this.graph.edges) {
      for (const to of edges) {
        const fromNode = this.graph.nodes.get(from);
        const dep = fromNode?.dependencies.find((d) => d.name === to);
        const style = dep?.type === "optional" ? "-.->|optional|" : "-->";
        lines.push(`  ${from}${style}${to}`);
      }
    }
    for (const missing of this.missing) {
      lines.push(`  ${missing}[${missing} - MISSING]`);
      lines.push(`  style ${missing} fill:#f96`);
    }
    return lines.join("\n");
  }
  /**
   * 转换为 DOT 图
   */
  toDot() {
    const lines = ["digraph Dependencies {"];
    for (const [from, edges] of this.graph.edges) {
      for (const to of edges) {
        const fromNode = this.graph.nodes.get(from);
        const dep = fromNode?.dependencies.find((d) => d.name === to);
        const style = dep?.type === "optional" ? "style=dashed" : "";
        lines.push(`  "${from}" -> "${to}" [${style}];`);
      }
    }
    for (const missing of this.missing) {
      lines.push(`  "${missing}" [style=filled,fillcolor=red,label="${missing} (MISSING)"];`);
    }
    lines.push("}");
    return lines.join("\n");
  }
  /**
   * 转换为 JSON
   */
  toJson() {
    const result = {
      nodes: Array.from(this.graph.nodes.entries()).map(([name, node]) => ({
        name,
        version: node.plugin.version,
        depth: node.depth,
        dependencies: node.dependencies,
        dependents: Array.from(node.dependents)
      })),
      edges: Array.from(this.graph.edges.entries()).map(([from, tos]) => ({
        from,
        to: Array.from(tos)
      })),
      roots: Array.from(this.graph.roots),
      leaves: Array.from(this.graph.leaves),
      cycles: this.cycles,
      missing: Array.from(this.missing),
      incompatible: this.incompatible
    };
    return JSON.stringify(result, null, 2);
  }
  /**
   * 重置解析器状态
   */
  reset() {
    this.graph = {
      nodes: /* @__PURE__ */ new Map(),
      edges: /* @__PURE__ */ new Map(),
      roots: /* @__PURE__ */ new Set(),
      leaves: /* @__PURE__ */ new Set()
    };
    this.cycles = [];
    this.missing = /* @__PURE__ */ new Set();
    this.incompatible = [];
  }
}
function createDependencyResolver(logger) {
  return new DependencyResolver(logger);
}

exports.DependencyResolver = DependencyResolver;
exports.createDependencyResolver = createDependencyResolver;
//# sourceMappingURL=dependency-resolver.cjs.map
