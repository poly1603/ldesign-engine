/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:07 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
import { MemoryMonitor } from './memory-monitor.js';
import { ResourceManager } from './resource-manager.js';

function createManagedContext() {
  const resources = new ResourceManager();
  const memoryMonitor = new MemoryMonitor({
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
    memoryMonitor,
    /**
     * 清理所有资源
     */
    destroy() {
      memoryMonitor.destroy();
      resources.destroy();
    },
    /**
     * 获取统计信息
     */
    getStats() {
      return {
        memory: memoryMonitor.getStats(),
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

export { MemoryMonitor, ResourceManager, createManagedContext, destroyGlobalContext, getGlobalContext };
//# sourceMappingURL=memory-management.js.map
