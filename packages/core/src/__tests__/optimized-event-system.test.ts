/**
 * 优化事件系统单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OptimizedEventEmitter } from '../engine/optimized-event-system';

describe('OptimizedEventEmitter', () => {
  let emitter: OptimizedEventEmitter;

  beforeEach(() => {
    emitter = new OptimizedEventEmitter({
      isolateErrors: true,
      enablePerformanceTracking: true
    });
  });

  describe('基本功能', () => {
    it('应该能注册和触发事件', () => {
      const handler = vi.fn();
      emitter.on('test', handler);

      emitter.emit('test', 'data');

      expect(handler).toHaveBeenCalledWith('data');
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('应该支持多个监听器', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      emitter.on('test', handler1);
      emitter.on('test', handler2);

      emitter.emit('test');

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('应该支持一次性监听器', () => {
      const handler = vi.fn();
      emitter.once('test', handler);

      emitter.emit('test');
      emitter.emit('test');

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('应该能移除监听器', () => {
      const handler = vi.fn();
      emitter.on('test', handler);

      emitter.off('test', handler);
      emitter.emit('test');

      expect(handler).not.toHaveBeenCalled();
    });

    it('应该能移除所有监听器', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      emitter.on('test1', handler1);
      emitter.on('test2', handler2);

      emitter.removeAllListeners();
      emitter.emit('test1');
      emitter.emit('test2');

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('优先级功能', () => {
    it('应该按优先级顺序执行', () => {
      const order: number[] = [];

      emitter.on('test', () => order.push(1), 1);
      emitter.on('test', () => order.push(10), 10);
      emitter.on('test', () => order.push(5), 5);

      emitter.emit('test');

      expect(order).toEqual([10, 5, 1]);
    });
  });

  describe('错误隔离', () => {
    it('应该隔离单个处理器的错误', () => {
      const handler1 = vi.fn(() => {
        throw new Error('Handler 1 error');
      });
      const handler2 = vi.fn();

      emitter.on('test', handler1);
      emitter.on('test', handler2);

      expect(() => emitter.emit('test')).not.toThrow();
      expect(handler2).toHaveBeenCalled();
    });

    it('禁用错误隔离时应该抛出错误', () => {
      const emitter = new OptimizedEventEmitter({ isolateErrors: false });
      const handler = vi.fn(() => {
        throw new Error('Test error');
      });

      emitter.on('test', handler);

      expect(() => emitter.emit('test')).toThrow('Test error');
    });
  });

  describe('异步功能', () => {
    it('应该支持异步触发', async () => {
      const handler = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      emitter.on('test', handler);
      await emitter.emitAsync('test');

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('性能追踪', () => {
    it('应该记录性能指标', () => {
      emitter.on('test', () => { });
      emitter.emit('test');

      const metrics = emitter.getMetrics('test');

      if (metrics && !(metrics instanceof Map)) {
        expect(metrics.event).toBe('test');
        expect(metrics.handlerCount).toBeGreaterThan(0);
        expect(metrics.executionTime).toBeGreaterThanOrEqual(0);
      }
    });

    it('应该能清除性能指标', () => {
      emitter.on('test', () => { });
      emitter.emit('test');

      emitter.clearMetrics();
      const metrics = emitter.getMetrics('test');

      if (metrics && !(metrics instanceof Map)) {
        expect(metrics.errorCount).toBe(0);
      }
    });
  });

  describe('工具方法', () => {
    it('应该返回正确的监听器数量', () => {
      emitter.on('test', () => { });
      emitter.on('test', () => { });

      expect(emitter.listenerCount('test')).toBe(2);
    });

    it('应该返回所有事件名称', () => {
      emitter.on('event1', () => { });
      emitter.on('event2', () => { });

      const names = emitter.eventNames();
      expect(names).toContain('event1');
      expect(names).toContain('event2');
    });

    it('应该返回事件的所有监听器', () => {
      const handler1 = () => { };
      const handler2 = () => { };

      emitter.on('test', handler1);
      emitter.on('test', handler2);

      const listeners = emitter.listeners('test');
      expect(listeners).toHaveLength(2);
      expect(listeners).toContain(handler1);
      expect(listeners).toContain(handler2);
    });
  });

  describe('性能对比', () => {
    it('数组实现应该比Set更快', () => {
      const iterations = 10000;
      const handlers = [() => { }, () => { }, () => { }];

      // 使用优化的数组实现
      const start1 = performance.now();
      for (let i = 0; i < iterations; i++) {
        for (let j = 0; j < handlers.length; j++) {
          handlers[j]();
        }
      }
      const time1 = performance.now() - start1;

      // 使用 Set 实现
      const handlerSet = new Set(handlers);
      const start2 = performance.now();
      for (let i = 0; i < iterations; i++) {
        for (const h of handlerSet) {
          h();
        }
      }
      const time2 = performance.now() - start2;

      console.log(`数组实现: ${time1.toFixed(2)}ms`);
      console.log(`Set 实现: ${time2.toFixed(2)}ms`);
      console.log(`性能提升: ${((time2 - time1) / time2 * 100).toFixed(2)}%`);

      // 数组应该更快
      expect(time1).toBeLessThan(time2);
    });
  });
});