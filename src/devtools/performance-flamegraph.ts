/**
 * 性能火焰图生成器
 * 
 * 可视化函数调用栈和性能热点，帮助快速定位性能瓶颈
 * 
 * @example
 * ```typescript
 * const flamegraph = createFlamegraph()
 * 
 * // 开始记录
 * flamegraph.start()
 * 
 * // 执行代码...
 * await performOperations()
 * 
 * // 停止记录并生成火焰图数据
 * const data = flamegraph.stop()
 * flamegraph.exportJSON('flamegraph.json')
 * ```
 */

/**
 * 调用栈帧
 */
export interface StackFrame {
  /** 函数名 */
  name: string
  /** 开始时间 */
  startTime: number
  /** 结束时间 */
  endTime?: number
  /** 持续时间 */
  duration?: number
  /** 子调用 */
  children: StackFrame[]
  /** 调用次数 */
  callCount: number
  /** 总耗时 */
  totalTime: number
  /** 自身耗时（不含子调用） */
  selfTime?: number
}

/**
 * 火焰图数据
 */
export interface FlamegraphData {
  /** 根节点 */
  root: StackFrame
  /** 总耗时 */
  totalDuration: number
  /** 开始时间 */
  startTime: number
  /** 结束时间 */
  endTime: number
  /** 热点函数（前10） */
  hotspots: Array<{
    name: string
    totalTime: number
    callCount: number
    averageTime: number
  }>
}

/**
 * 性能火焰图生成器
 */
export class PerformanceFlamegraph {
  private stack: StackFrame[] = []
  private root?: StackFrame
  private recording = false
  private startTimestamp = 0
  private functionStats = new Map<string, {
    totalTime: number
    callCount: number
  }>()

  /**
   * 开始记录
   */
  start(): void {
    if (this.recording) {
      console.warn('火焰图已在记录中')
      return
    }

    this.recording = true
    this.startTimestamp = performance.now()
    this.stack = []
    this.functionStats.clear()

    this.root = {
      name: 'root',
      startTime: this.startTimestamp,
      children: [],
      callCount: 1,
      totalTime: 0
    }
    this.stack.push(this.root)
  }

  /**
   * 停止记录
   */
  stop(): FlamegraphData {
    if (!this.recording || !this.root) {
      throw new Error('未开始记录')
    }

    this.recording = false
    const endTimestamp = performance.now()

    // 完成根节点
    this.root.endTime = endTimestamp
    this.root.duration = endTimestamp - this.root.startTime
    this.root.totalTime = this.root.duration

    // 计算自身耗时
    this.calculateSelfTime(this.root)

    // 生成热点列表
    const hotspots = Array.from(this.functionStats.entries())
      .map(([name, stats]) => ({
        name,
        totalTime: stats.totalTime,
        callCount: stats.callCount,
        averageTime: stats.totalTime / stats.callCount
      }))
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, 10)

    return {
      root: this.root,
      totalDuration: this.root.duration,
      startTime: this.root.startTime,
      endTime: endTimestamp,
      hotspots
    }
  }

  /**
   * 进入函数
   */
  enter(functionName: string): void {
    if (!this.recording) return

    const frame: StackFrame = {
      name: functionName,
      startTime: performance.now(),
      children: [],
      callCount: 1,
      totalTime: 0
    }

    // 添加到当前栈顶的子节点
    const parent = this.stack[this.stack.length - 1]
    if (parent) {
      parent.children.push(frame)
    }

    // 入栈
    this.stack.push(frame)
  }

  /**
   * 离开函数
   */
  exit(): void {
    if (!this.recording || this.stack.length <= 1) return

    const frame = this.stack.pop()!
    const endTime = performance.now()

    frame.endTime = endTime
    frame.duration = endTime - frame.startTime
    frame.totalTime = frame.duration

    // 更新统计
    const stats = this.functionStats.get(frame.name) || {
      totalTime: 0,
      callCount: 0
    }
    stats.totalTime += frame.totalTime
    stats.callCount++
    this.functionStats.set(frame.name, stats)
  }

  /**
   * 计算自身耗时
   */
  private calculateSelfTime(frame: StackFrame): void {
    let childrenTime = 0

    for (const child of frame.children) {
      this.calculateSelfTime(child)
      childrenTime += child.totalTime
    }

    frame.selfTime = (frame.duration || 0) - childrenTime
  }

  /**
   * 导出为JSON
   */
  exportJSON(filename?: string): string {
    if (!this.root) {
      throw new Error('没有记录数据')
    }

    const data = this.stop()
    const json = JSON.stringify(data, null, 2)

    if (filename && typeof window !== 'undefined') {
      // 浏览器环境：触发下载
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    }

    return json
  }

  /**
   * 生成文本报告
   */
  generateReport(): string {
    if (!this.root) return ''

    const lines: string[] = []
    lines.push('=== 性能火焰图报告 ===\n')

    const data = this.stop()
    lines.push(`总耗时: ${data.totalDuration.toFixed(2)}ms`)
    lines.push(`记录时间: ${new Date(data.startTime).toISOString()}\n`)

    lines.push('热点函数（前10）:')
    data.hotspots.forEach((hotspot, index) => {
      lines.push(
        `${index + 1}. ${hotspot.name}: ` +
        `${hotspot.totalTime.toFixed(2)}ms ` +
        `(调用${hotspot.callCount}次, ` +
        `平均${hotspot.averageTime.toFixed(2)}ms)`
      )
    })

    return lines.join('\n')
  }
}

/**
 * 创建性能火焰图
 */
export function createFlamegraph(): PerformanceFlamegraph {
  return new PerformanceFlamegraph()
}

/**
 * FlamegraphProfile装饰器
 * 
 * 自动记录函数执行时间
 * 
 * @example
 * ```typescript
 * class UserService {
 *   @FlamegraphProfile('fetchUser')
 *   async fetchUser(id: number) {
 *     return await api.getUser(id)
 *   }
 * }
 * ```
 */
export function FlamegraphProfile(name?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    const functionName = name || `${target.constructor.name}.${propertyKey}`

    descriptor.value = async function (...args: any[]) {
      const start = performance.now()

      try {
        const result = await originalMethod.apply(this, args)
        const duration = performance.now() - start

        console.log(`[Profile] ${functionName}: ${duration.toFixed(2)}ms`)

        return result
      } catch (error) {
        const duration = performance.now() - start
        console.error(`[Profile] ${functionName}: ${duration.toFixed(2)}ms (失败)`)
        throw error
      }
    }

    return descriptor
  }
}


