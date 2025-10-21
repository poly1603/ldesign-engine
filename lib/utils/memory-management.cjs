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

var memoryMonitor = require('./memory-monitor.cjs');
var resourceManager = require('./resource-manager.cjs');

function createManagedContext() {
  const resources = new resourceManager.ResourceManager();
  const memoryMonitor$1 = new memoryMonitor.MemoryMonitor({
    autoStart: true,
    onWarning: (info) => {
      console.warn("[Memory Warning]", info.message);
    },
    onError: (info) => {
      console.error("[Memory Error]", info.message);
    }
  });
  return {
    resources,
    memoryMonitor: memoryMonitor$1,
    /**
     * 清理所有资源
     */
    destroy() {
      memoryMonitor$1.destroy();
      resources.destroy();
    },
    /**
     * 获取统计信息
     */
    getStats() {
      return {
        memory: memoryMonitor$1.getStats(),
        resources: resources.getStats()
      };
    }
  };
}
let globalContext = null;
function getGlobalContext() {
  if (!globalContext) {
    globalContext = createManagedContext();
  }
  return globalContext;
}
function destroyGlobalContext() {
  if (globalContext) {
    globalContext.destroy();
    globalContext = null;
  }
}

exports.MemoryMonitor = memoryMonitor.MemoryMonitor;
exports.ResourceManager = resourceManager.ResourceManager;
exports.createManagedContext = createManagedContext;
exports.destroyGlobalContext = destroyGlobalContext;
exports.getGlobalContext = getGlobalContext;
//# sourceMappingURL=memory-management.cjs.map
