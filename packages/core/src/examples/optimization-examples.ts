/**
 * LDesign 优化功能使用示例
 * 展示如何在实际项目中使用各种优化组件
 */

import { OptimizedEventEmitter } from '../engine/optimized-event-system';
import { PluginResourceTracker, createTrackedPluginContext } from '../engine/plugin-resource-tracker';
import { EngineError, ErrorCode, getErrorManager, ErrorSeverity } from '../errors';
import { createBenchmark } from '../benchmark/performance-benchmark';

// ============================================================================
// 示例 1: 使用优化的事件系统
// ============================================================================

export function example1_OptimizedEventSystem() {
  console.log('\n📌 示例 1: 优化的事件系统\n');

  // 创建事件发射器
  const emitter = new OptimizedEventEmitter({
    isolateErrors: true,              // 错误隔离
    enableAsync: true,                // 异步支持
    maxListeners: 20,                 // 最大监听器数
    enablePerformanceTracking: true   // 性能追踪
  });

  // 注册高优先级监听器
  emitter.on('user:login', (user) => {
    console.log(`✅ [优先级10] 验证用户: ${user.name}`);
  }, 10);

  // 注册普通优先级监听器
  emitter.on('user:login', (user) => {
    console.log(`📊 [优先级0] 记录用户登录: ${user.name}`);
  }, 0);

  // 注册一次性监听器
  emitter.once('user:login', (user) => {
    console.log(`🎉 首次登录欢迎: ${user.name}`);
  });

  // 触发事件
  emitter.emit('user:login', { name: 'Alice', id: 1 });
  emitter.emit('user:login', { name: 'Bob', id: 2 });

  // 查看性能指标
  const metrics = emitter.getMetrics('user:login');
  if (metrics && !(metrics instanceof Map)) {
    console.log(`\n📈 性能指标:`);
    console.log(`   事件: ${metrics.event}`);
    console.log(`   处理器数量: ${metrics.handlerCount}`);
    console.log(`   执行时间: ${metrics.executionTime.toFixed(4)}ms`);
    console.log(`   错误次数: ${metrics.errorCount}`);
  }
}

// ============================================================================
// 示例 2: 插件资源追踪（防止内存泄漏）
// ============================================================================

export function example2_PluginResourceTracking() {
  console.log('\n📌 示例 2: 插件资源追踪\n');

  const tracker = new PluginResourceTracker();

  // 模拟插件上下文
  const engineContext = {
    on: (event: string, handler: Function) => {
      console.log(`📝 注册事件监听器: ${event}`);
    },
    off: (event: string, handler: Function) => {
      console.log(`🗑️  移除事件监听器: ${event}`);
    },
    hook: (lifecycle: string, handler: Function) => {
      console.log(`🔗 注册钩子: ${lifecycle}`);
    },
    removeHook: (lifecycle: string, handler: Function) => {
      console.log(`🔓 移除钩子: ${lifecycle}`);
    }
  };

  // 创建带追踪的插件上下文
  const pluginContext = createTrackedPluginContext(
    'my-plugin',
    tracker,
    engineContext
  );

  // 插件使用上下文注册资源
  pluginContext.on('data:update', () => { });
  pluginContext.on('data:delete', () => { });
  pluginContext.hook('beforeMount', () => { });

  // 注册自定义资源
  pluginContext.registerResource('websocket', () => {
    console.log('🔌 关闭 WebSocket 连接');
  });

  // 查看资源统计
  const stats = tracker.getResourceStats();
  console.log('\n📊 资源统计:');
  console.log(JSON.stringify(stats, null, 2));

  // 卸载插件（自动清理所有资源）
  console.log('\n🧹 卸载插件...');
  tracker.cleanupPlugin('my-plugin', {
    off: engineContext.off,
    removeHook: engineContext.removeHook
  });

  console.log('✅ 所有资源已清理');
}

// ============================================================================
// 示例 3: 统一错误处理
// ============================================================================

export function example3_UnifiedErrorHandling() {
  console.log('\n📌 示例 3: 统一错误处理\n');

  const errorManager = getErrorManager();

  // 注册全局错误处理器
  errorManager.register(async (error) => {
    console.log(`🚨 全局错误处理: ${error.toString()}`);
  });

  // 注册严重错误处理器
  errorManager.register(async (error) => {
    console.log(`💥 严重错误！需要立即处理！`);
    console.log(`   错误码: ${error.code}`);
    console.log(`   模块: ${error.context.module}`);
  }, ErrorSeverity.CRITICAL);

  // 模拟不同级别的错误
  try {
    throw new EngineError(
      ErrorCode.ENGINE_PLUGIN_LOAD_FAILED,
      '无法加载插件: my-plugin',
      {
        severity: ErrorSeverity.HIGH,
        context: {
          operation: 'loadPlugin',
          data: { pluginName: 'my-plugin' }
        }
      }
    );
  } catch (error) {
    if (error instanceof EngineError) {
      errorManager.handle(error);
    }
  }

  // 查看错误统计
  console.log('\n📊 错误统计:');
  const stats = errorManager.getStats();
  console.log(`   总错误数: ${stats.total}`);
  console.log(`   按严重级别:`, stats.bySeverity);
  console.log(`   按模块:`, stats.byModule);
}

// ============================================================================
// 示例 4: 性能基准测试
// ============================================================================

export async function example4_PerformanceBenchmark() {
  console.log('\n📌 示例 4: 性能基准测试\n');

  const benchmark = createBenchmark();

  // 对比 Set vs Array 性能
  const handlers = [
    () => Math.random(),
    () => Math.random(),
    () => Math.random()
  ];

  await benchmark.compare(
    'Set 遍历',
    () => {
      const set = new Set(handlers);
      for (const h of set) h();
    },
    'Array 遍历',
    () => {
      for (let i = 0; i < handlers.length; i++) {
        handlers[i]();
      }
    },
    { iterations: 100000 }
  );
}

// ============================================================================
// 示例 5: 综合应用场景
// ============================================================================

export class OptimizedEngine {
  private emitter: OptimizedEventEmitter;
  private pluginTracker: PluginResourceTracker;
  private plugins = new Map<string, any>();

  constructor() {
    this.emitter = new OptimizedEventEmitter({
      isolateErrors: true,
      enablePerformanceTracking: true
    });

    this.pluginTracker = new PluginResourceTracker();

    // 注册错误处理
    this.setupErrorHandling();
  }

  private setupErrorHandling() {
    const errorManager = getErrorManager();

    errorManager.register(async (error) => {
      // 发送到日志系统
      console.error('[Engine Error]', error.toJSON());

      // 触发错误事件
      this.emitter.emit('error', error);
    });
  }

  async loadPlugin(name: string, plugin: any) {
    try {
      // 创建带追踪的上下文
      const context = createTrackedPluginContext(
        name,
        this.pluginTracker,
        {
          on: this.emitter.on.bind(this.emitter),
          off: this.emitter.off.bind(this.emitter),
          emit: this.emitter.emit.bind(this.emitter)
        }
      );

      // 安装插件
      await plugin.install(context);
      this.plugins.set(name, plugin);

      // 触发加载成功事件
      this.emitter.emit('plugin:loaded', { name });

      console.log(`✅ 插件已加载: ${name}`);
    } catch (error) {
      const engineError = new EngineError(
        ErrorCode.ENGINE_PLUGIN_LOAD_FAILED,
        `Failed to load plugin: ${name}`,
        {
          context: {
            operation: 'loadPlugin',
            data: { pluginName: name }
          },
          originalError: error as Error
        }
      );

      await getErrorManager().handle(engineError);
      throw engineError;
    }
  }

  async unloadPlugin(name: string) {
    if (!this.plugins.has(name)) {
      throw new EngineError(
        ErrorCode.ENGINE_PLUGIN_NOT_FOUND,
        `Plugin not found: ${name}`
      );
    }

    // 自动清理所有资源
    await this.pluginTracker.cleanupPlugin(name, {
      off: this.emitter.off.bind(this.emitter),
      removeHook: () => { } // 如果有钩子系统
    });

    this.plugins.delete(name);
    this.emitter.emit('plugin:unloaded', { name });

    console.log(`✅ 插件已卸载: ${name}`);
  }

  getStats() {
    return {
      plugins: Array.from(this.plugins.keys()),
      resources: this.pluginTracker.getResourceStats(),
      events: this.emitter.eventNames().map(event => ({
        name: event,
        listeners: this.emitter.listenerCount(event as string),
        metrics: this.emitter.getMetrics(event as string)
      }))
    };
  }
}

// ============================================================================
// 运行所有示例
// ============================================================================

export async function runAllExamples() {
  console.log('🚀 LDesign 优化功能示例演示');
  console.log('='.repeat(60));

  example1_OptimizedEventSystem();
  example2_PluginResourceTracking();
  example3_UnifiedErrorHandling();
  await example4_PerformanceBenchmark();

  console.log('\n📌 示例 5: 综合应用\n');
  const engine = new OptimizedEngine();

  // 加载插件
  await engine.loadPlugin('analytics', {
    install: (ctx: any) => {
      ctx.on('user:action', (action: any) => {
        console.log('📊 Analytics: 记录用户行为', action);
      });

      ctx.registerResource('analytics-connection', () => {
        console.log('🔌 关闭 Analytics 连接');
      });
    }
  });

  // 查看统计
  console.log('\n📊 引擎统计:');
  console.log(JSON.stringify(engine.getStats(), null, 2));

  // 卸载插件
  await engine.unloadPlugin('analytics');

  console.log('\n' + '='.repeat(60));
  console.log('✅ 所有示例运行完成！');
}

// 如果直接运行此文件
if (require.main === module) {
  runAllExamples().catch(console.error);
}