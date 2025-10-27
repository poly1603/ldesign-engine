/**
 * 事件流可视化
 * 
 * 可视化事件的触发、传播和处理过程，帮助理解事件系统的工作流程
 */

/**
 * 事件流节点
 */
export interface EventFlowNode {
  /** 事件ID */
  id: string
  /** 事件名称 */
  event: string
  /** 触发时间 */
  timestamp: number
  /** 数据 */
  data: unknown
  /** 处理器数量 */
  handlerCount: number
  /** 处理耗时 */
  duration?: number
  /** 状态 */
  status: 'pending' | 'processing' | 'completed' | 'failed'
  /** 错误信息 */
  error?: string
}

/**
 * 事件流连接
 */
export interface EventFlowEdge {
  /** 源事件 */
  from: string
  /** 目标事件 */
  to: string
  /** 连接类型 */
  type: 'trigger' | 'chain' | 'bubble'
}

/**
 * 事件流图
 */
export interface EventFlowGraph {
  /** 节点 */
  nodes: EventFlowNode[]
  /** 连接 */
  edges: EventFlowEdge[]
}

/**
 * 事件流可视化器
 */
export class EventFlowVisualizer {
  private nodes = new Map<string, EventFlowNode>()
  private edges: EventFlowEdge[] = []
  private maxNodes = 500
  private recording = false

  /**
   * 开始记录
   */
  start(): void {
    this.recording = true
    this.nodes.clear()
    this.edges = []
  }

  /**
   * 停止记录
   */
  stop(): void {
    this.recording = false
  }

  /**
   * 记录事件
   */
  recordEvent(
    event: string,
    data: unknown,
    handlerCount: number
  ): string {
    if (!this.recording) return ''

    const id = this.generateId()
    const node: EventFlowNode = {
      id,
      event,
      timestamp: Date.now(),
      data,
      handlerCount,
      status: 'pending'
    }

    this.nodes.set(id, node)

    // 限制节点数量
    if (this.nodes.size > this.maxNodes) {
      const firstKey = this.nodes.keys().next().value
      this.nodes.delete(firstKey)
    }

    return id
  }

  /**
   * 更新事件状态
   */
  updateEventStatus(
    id: string,
    status: EventFlowNode['status'],
    duration?: number,
    error?: string
  ): void {
    const node = this.nodes.get(id)
    if (node) {
      node.status = status
      node.duration = duration
      node.error = error
    }
  }

  /**
   * 记录事件连接
   */
  recordEdge(from: string, to: string, type: EventFlowEdge['type']): void {
    if (!this.recording) return

    this.edges.push({ from, to, type })

    // 限制边数量
    if (this.edges.length > this.maxNodes * 2) {
      this.edges.shift()
    }
  }

  /**
   * 获取事件流图
   */
  getGraph(): EventFlowGraph {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: [...this.edges]
    }
  }

  /**
   * 获取事件统计
   */
  getStats(): {
    totalEvents: number
    completedEvents: number
    failedEvents: number
    averageDuration: number
    eventsByType: Record<string, number>
  } {
    const nodes = Array.from(this.nodes.values())
    const completed = nodes.filter(n => n.status === 'completed')
    const failed = nodes.filter(n => n.status === 'failed')

    const eventsByType: Record<string, number> = {}
    for (const node of nodes) {
      eventsByType[node.event] = (eventsByType[node.event] || 0) + 1
    }

    const totalDuration = completed.reduce((sum, n) => sum + (n.duration || 0), 0)
    const averageDuration = completed.length > 0 
      ? totalDuration / completed.length 
      : 0

    return {
      totalEvents: nodes.length,
      completedEvents: completed.length,
      failedEvents: failed.length,
      averageDuration,
      eventsByType
    }
  }

  /**
   * 生成Mermaid图表
   */
  generateMermaidDiagram(): string {
    const lines: string[] = ['graph LR']

    // 添加节点
    for (const node of this.nodes.values()) {
      const style = node.status === 'failed' ? ':::error' 
                  : node.status === 'completed' ? ':::success'
                  : ':::pending'
      
      lines.push(`  ${node.id}["${node.event} (${node.duration?.toFixed(1) || '?'}ms)"]${style}`)
    }

    // 添加边
    for (const edge of this.edges) {
      const arrow = edge.type === 'trigger' ? '-->' 
                  : edge.type === 'chain' ? '==>'
                  : '-.-->'
      lines.push(`  ${edge.from} ${arrow} ${edge.to}`)
    }

    // 添加样式
    lines.push('  classDef success fill:#4CAF50,stroke:#2E7D32,color:#fff')
    lines.push('  classDef error fill:#f44336,stroke:#c62828,color:#fff')
    lines.push('  classDef pending fill:#FF9800,stroke:#F57C00,color:#fff')

    return lines.join('\n')
  }

  /**
   * 导出为JSON
   */
  exportJSON(): string {
    return JSON.stringify({
      graph: this.getGraph(),
      stats: this.getStats(),
      mermaid: this.generateMermaidDiagram()
    }, null, 2)
  }

  /**
   * 生成ID
   */
  private generateId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 清空数据
   */
  clear(): void {
    this.nodes.clear()
    this.edges = []
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.stop()
    this.clear()
  }
}

/**
 * 创建事件流可视化器
 */
export function createEventFlowVisualizer(): EventFlowVisualizer {
  return new EventFlowVisualizer()
}


