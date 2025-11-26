/**
 * 状态更新性能基准测试
 * 
 * 测试状态设置、获取、监听和批量操作的性能表现
 */

import { bench, describe } from 'vitest'
import { createStateManager } from '../../src/state/state-manager'

describe('状态更新性能基准测试', () => {
  bench('设置 1000 个简单状态', () => {
    const state = createStateManager()

    for (let i = 0; i < 1000; i++) {
      state.set(`key-${i}`, i)
    }
  })

  bench('设置 10000 个简单状态', () => {
    const state = createStateManager()

    for (let i = 0; i < 10000; i++) {
      state.set(`key-${i}`, i)
    }
  })

  bench('获取 1000 个状态值', () => {
    const state = createStateManager()

    // 预设值
    for (let i = 0; i < 1000; i++) {
      state.set(`key-${i}`, i)
    }

    // 获取
    for (let i = 0; i < 1000; i++) {
      state.get(`key-${i}`)
    }
  })

  bench('更新现有状态（1000次）', () => {
    const state = createStateManager()

    // 初始化
    for (let i = 0; i < 100; i++) {
      state.set(`key-${i}`, 0)
    }

    // 重复更新
    for (let i = 0; i < 1000; i++) {
      const key = `key-${i % 100}`
      const current = state.get(key) as number
      state.set(key, current + 1)
    }
  })

  bench('状态监听和触发（1000次更新）', () => {
    const state = createStateManager()
    let count = 0

    state.watch('counter', () => {
      count++
    })

    for (let i = 0; i < 1000; i++) {
      state.set('counter', i)
    }
  })

  bench('多个监听器（10个监听器，1000次更新）', () => {
    const state = createStateManager()
    const counters: number[] = Array(10).fill(0)

    for (let i = 0; i < 10; i++) {
      state.watch('shared-key', () => {
        counters[i]++
      })
    }

    for (let i = 0; i < 1000; i++) {
      state.set('shared-key', i)
    }
  })

  bench('对象状态更新（1000次）', () => {
    const state = createStateManager()

    for (let i = 0; i < 1000; i++) {
      state.set('user', {
        id: i,
        name: `user-${i}`,
        email: `user-${i}@example.com`,
        profile: {
          age: 20 + (i % 50),
          city: 'City',
        },
      })
    }
  })

  bench('数组状态更新（1000次）', () => {
    const state = createStateManager()

    for (let i = 0; i < 1000; i++) {
      state.set('items', Array.from({ length: 10 }, (_, j) => ({
        id: j,
        value: Math.random(),
      })))
    }
  })

  bench('批量状态设置（100批次，每批10个键）', () => {
    const state = createStateManager()

    for (let batch = 0; batch < 100; batch++) {
      for (let i = 0; i < 10; i++) {
        state.set(`key-${batch}-${i}`, `value-${i}`)
      }
    }
  })

  bench('批量状态获取（1000次，每次获取10个键）', () => {
    const state = createStateManager()

    // 预设值
    for (let i = 0; i < 100; i++) {
      state.set(`key-${i}`, i)
    }

    // 批量获取
    for (let i = 0; i < 1000; i++) {
      for (let j = 0; j < 10; j++) {
        state.get(`key-${(i + j) % 100}`)
      }
    }
  })

  bench('状态删除和重建（1000次）', () => {
    const state = createStateManager()

    for (let i = 0; i < 1000; i++) {
      state.set('temp-key', i)
      state.delete('temp-key')
    }
  })

  bench('深层对象状态更新（1000次）', () => {
    const state = createStateManager()

    for (let i = 0; i < 1000; i++) {
      state.set('deep-object', {
        level1: {
          level2: {
            level3: {
              level4: {
                value: i,
              },
            },
          },
        },
      })
    }
  })

  bench('状态克隆检测（1000次相同值设置）', () => {
    const state = createStateManager()
    const obj = { id: 1, name: 'test' }

    for (let i = 0; i < 1000; i++) {
      state.set('object', obj)
    }
  })

  bench('状态快照和恢复（100次）', () => {
    const state = createStateManager()

    // 设置初始状态
    for (let i = 0; i < 50; i++) {
      state.set(`key-${i}`, i)
    }

    // 快照和恢复
    for (let i = 0; i < 100; i++) {
      const snapshot = state.getAll()
      state.clear()
      // 恢复快照
      Object.entries(snapshot).forEach(([key, value]) => {
        state.set(key, value)
      })
    }
  })

  bench('并发状态更新模拟（1000次）', () => {
    const state = createStateManager()

    // 模拟多个"并发"更新
    for (let i = 0; i < 1000; i++) {
      state.set(`key-${i % 10}`, i)
      state.get(`key-${(i + 1) % 10}`)
      state.set(`key-${(i + 2) % 10}`, i * 2)
    }
  })

  bench('状态依赖链（100次更新）', () => {
    const state = createStateManager()

    // 设置依赖链: a -> b -> c
    state.watch('a', (newValue) => {
      state.set('b', (newValue as number) * 2)
    })

    state.watch('b', (newValue) => {
      state.set('c', (newValue as number) * 2)
    })

    for (let i = 0; i < 100; i++) {
      state.set('a', i)
    }
  })

  bench('大量状态键存在性检查（10000次）', () => {
    const state = createStateManager()

    // 预设1000个键
    for (let i = 0; i < 1000; i++) {
      state.set(`key-${i}`, i)
    }

    // 检查存在性
    for (let i = 0; i < 10000; i++) {
      state.has(`key-${i % 1000}`)
    }
  })

  bench('状态清空和重新填充（100次）', () => {
    const state = createStateManager()

    for (let cycle = 0; cycle < 100; cycle++) {
      // 填充
      for (let i = 0; i < 50; i++) {
        state.set(`key-${i}`, i)
      }

      // 清空
      state.clear()
    }
  })
})