/**
 * 事件吞吐量性能基准测试
 * 
 * 测试高频事件触发、监听和传播的性能表现
 */

import { bench, describe } from 'vitest'
import { createEventManager } from '../../src/event/event-manager'

describe('事件吞吐量性能基准测试', () => {
  bench('触发 1000 个简单事件', () => {
    const events = createEventManager()
    let count = 0

    events.on('test-event', () => {
      count++
    })

    for (let i = 0; i < 1000; i++) {
      events.emit('test-event')
    }
  })

  bench('触发 10000 个简单事件', () => {
    const events = createEventManager()
    let count = 0

    events.on('test-event', () => {
      count++
    })

    for (let i = 0; i < 10000; i++) {
      events.emit('test-event')
    }
  })

  bench('单个事件 10 个监听器（1000次触发）', () => {
    const events = createEventManager()
    const counters: number[] = []

    for (let i = 0; i < 10; i++) {
      counters.push(0)
      events.on('test-event', () => {
        counters[i]++
      })
    }

    for (let i = 0; i < 1000; i++) {
      events.emit('test-event')
    }
  })

  bench('单个事件 50 个监听器（1000次触发）', () => {
    const events = createEventManager()
    const counters: number[] = []

    for (let i = 0; i < 50; i++) {
      counters.push(0)
      events.on('test-event', () => {
        counters[i]++
      })
    }

    for (let i = 0; i < 1000; i++) {
      events.emit('test-event')
    }
  })

  bench('100 个不同事件各触发 100 次', () => {
    const events = createEventManager()
    const counters: Record<string, number> = {}

    for (let i = 0; i < 100; i++) {
      const eventName = `event-${i}`
      counters[eventName] = 0
      events.on(eventName, () => {
        counters[eventName]++
      })
    }

    for (let i = 0; i < 100; i++) {
      for (let j = 0; j < 100; j++) {
        events.emit(`event-${i}`)
      }
    }
  })

  bench('带数据载荷的事件（1000次）', () => {
    const events = createEventManager()
    const results: any[] = []

    events.on('data-event', (payload: any) => {
      results.push(payload)
    })

    for (let i = 0; i < 1000; i++) {
      events.emit('data-event', {
        id: i,
        name: `item-${i}`,
        timestamp: Date.now(),
        data: { value: Math.random() },
      })
    }
  })

  bench('大数据载荷事件（100次）', () => {
    const events = createEventManager()
    const results: any[] = []

    events.on('big-data-event', (payload: any) => {
      results.push(payload)
    })

    for (let i = 0; i < 100; i++) {
      events.emit('big-data-event', {
        id: i,
        items: Array.from({ length: 100 }, (_, j) => ({
          id: j,
          value: Math.random(),
        })),
      })
    }
  })

  bench('通配符事件匹配（1000次）', () => {
    const events = createEventManager()
    let count = 0

    events.on('user:*', () => {
      count++
    })

    for (let i = 0; i < 1000; i++) {
      events.emit('user:login')
      events.emit('user:logout')
    }
  })

  bench('多层命名空间事件（1000次）', () => {
    const events = createEventManager()
    let count = 0

    events.on('app:user:auth:login', () => {
      count++
    })

    for (let i = 0; i < 1000; i++) {
      events.emit('app:user:auth:login')
    }
  })

  bench('异步事件处理（100次）', async () => {
    const events = createEventManager()
    const results: number[] = []

    events.on('async-event', async (data: number) => {
      await new Promise(resolve => setTimeout(resolve, 1))
      results.push(data)
    })

    for (let i = 0; i < 100; i++) {
      await events.emit('async-event', i)
    }
  })

  bench('事件监听器动态添加和移除（1000次）', () => {
    const events = createEventManager()

    for (let i = 0; i < 1000; i++) {
      const handler = () => { }
      events.on('dynamic-event', handler)
      events.emit('dynamic-event')
      events.off('dynamic-event', handler)
    }
  })

  bench('once 一次性监听器（1000个事件）', () => {
    const events = createEventManager()
    let count = 0

    for (let i = 0; i < 1000; i++) {
      events.once(`event-${i}`, () => {
        count++
      })
    }

    for (let i = 0; i < 1000; i++) {
      events.emit(`event-${i}`)
      events.emit(`event-${i}`) // 第二次触发应该无效
    }
  })

  bench('高频事件去重（10000次触发）', () => {
    const events = createEventManager()
    const seen = new Set<number>()

    events.on('high-freq-event', (id: number) => {
      if (!seen.has(id)) {
        seen.add(id)
      }
    })

    for (let i = 0; i < 10000; i++) {
      events.emit('high-freq-event', i % 100) // 只有100个不同的ID
    }
  })

  bench('事件冒泡模拟（100次，5层深度）', () => {
    const events = createEventManager()
    let count = 0

    // 注册不同层级的监听器
    events.on('level1', () => { count++ })
    events.on('level1:level2', () => { count++ })
    events.on('level1:level2:level3', () => { count++ })
    events.on('level1:level2:level3:level4', () => { count++ })
    events.on('level1:level2:level3:level4:level5', () => { count++ })

    for (let i = 0; i < 100; i++) {
      events.emit('level1')
      events.emit('level1:level2')
      events.emit('level1:level2:level3')
      events.emit('level1:level2:level3:level4')
      events.emit('level1:level2:level3:level4:level5')
    }
  })

  bench('批量事件注册和触发（1000次）', () => {
    const events = createEventManager()
    const counters: number[] = []

    // 注册10个监听器
    for (let i = 0; i < 10; i++) {
      counters.push(0)
      events.on('batch-event', () => {
        counters[i]++
      })
    }

    // 批量触发
    for (let i = 0; i < 1000; i++) {
      events.emit('batch-event')
    }
  })
})