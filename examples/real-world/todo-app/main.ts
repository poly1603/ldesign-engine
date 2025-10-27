/**
 * Todo 应用示例
 * 
 * 功能：
 * - 任务增删改查
 * - 状态持久化
 * - 撤销/重做
 * - 任务筛选
 */

import { createEngine } from '@ldesign/engine'
import { createApp } from 'vue'
import App from './App.vue'

// 任务接口
export interface Task {
  id: string
  title: string
  completed: boolean
  createdAt: number
  updatedAt?: number
}

export interface TodoState {
  tasks: Task[]
  filter: 'all' | 'active' | 'completed'
  searchQuery: string
}

// 创建引擎
const engine = createEngine({
  debug: true,
  logger: {
    level: 'info',
    prefix: '[TodoApp]'
  }
})

// 初始化状态
const savedTasks = localStorage.getItem('todos')
const initialTasks: Task[] = savedTasks ? JSON.parse(savedTasks) : []

engine.state.set('todos', {
  tasks: initialTasks,
  filter: 'all',
  searchQuery: ''
} as TodoState)

// 启用时间旅行（撤销/重做）
engine.state.enableTimeTravel({
  maxSnapshots: 50,
  autoSnapshot: true,
  snapshotInterval: 1000
})

// 状态持久化
engine.state.watch('todos.tasks', (tasks: Task[]) => {
  localStorage.setItem('todos', JSON.stringify(tasks))
  engine.logger.info('任务已保存到本地存储')
})

// 任务管理方法
export const todoManager = {
  // 添加任务
  addTask(title: string): Task {
    const state = engine.state.get<TodoState>('todos')!

    const task: Task = {
      id: `task-${Date.now()}-${Math.random()}`,
      title,
      completed: false,
      createdAt: Date.now()
    }

    engine.state.set('todos.tasks', [...state.tasks, task])

    engine.events.emit('todo:added', task)
    engine.notifications.success(`添加任务: ${title}`)
    engine.logger.info('添加任务', task)

    return task
  },

  // 更新任务
  updateTask(id: string, updates: Partial<Task>): void {
    const state = engine.state.get<TodoState>('todos')!

    const updatedTasks = state.tasks.map(task =>
      task.id === id
        ? { ...task, ...updates, updatedAt: Date.now() }
        : task
    )

    engine.state.set('todos.tasks', updatedTasks)

    engine.events.emit('todo:updated', { id, updates })
    engine.logger.info('更新任务', { id, updates })
  },

  // 删除任务
  deleteTask(id: string): void {
    const state = engine.state.get<TodoState>('todos')!
    const task = state.tasks.find(t => t.id === id)

    if (!task) return

    const filteredTasks = state.tasks.filter(t => t.id !== id)
    engine.state.set('todos.tasks', filteredTasks)

    engine.events.emit('todo:deleted', { id, task })
    engine.notifications.info(`删除任务: ${task.title}`)
    engine.logger.info('删除任务', { id })
  },

  // 切换完成状态
  toggleTask(id: string): void {
    const state = engine.state.get<TodoState>('todos')!
    const task = state.tasks.find(t => t.id === id)

    if (!task) return

    const newCompleted = !task.completed
    this.updateTask(id, { completed: newCompleted })

    engine.events.emit(
      newCompleted ? 'todo:completed' : 'todo:uncompleted',
      task
    )

    engine.notifications.show({
      type: newCompleted ? 'success' : 'info',
      message: newCompleted ? '任务已完成' : '任务标记为未完成'
    })
  },

  // 清除已完成任务
  clearCompleted(): void {
    const state = engine.state.get<TodoState>('todos')!
    const completedTasks = state.tasks.filter(t => t.completed)
    const remainingTasks = state.tasks.filter(t => !t.completed)

    if (completedTasks.length === 0) {
      engine.notifications.info('没有已完成的任务')
      return
    }

    engine.state.set('todos.tasks', remainingTasks)

    engine.events.emit('todo:cleared', completedTasks)
    engine.notifications.success(`清除了 ${completedTasks.length} 个已完成任务`)
    engine.logger.info('清除已完成任务', { count: completedTasks.length })
  },

  // 全部标记为完成
  completeAll(): void {
    const state = engine.state.get<TodoState>('todos')!
    const updatedTasks = state.tasks.map(task => ({
      ...task,
      completed: true,
      updatedAt: Date.now()
    }))

    engine.state.set('todos.tasks', updatedTasks)

    engine.events.emit('todo:completed-all')
    engine.notifications.success('所有任务已标记为完成')
  },

  // 设置筛选器
  setFilter(filter: 'all' | 'active' | 'completed'): void {
    engine.state.set('todos.filter', filter)
    engine.logger.debug('设置筛选器', { filter })
  },

  // 设置搜索关键词
  setSearchQuery(query: string): void {
    engine.state.set('todos.searchQuery', query)
  },

  // 获取筛选后的任务
  getFilteredTasks(): Task[] {
    const state = engine.state.get<TodoState>('todos')!
    let tasks = state.tasks

    // 应用筛选器
    switch (state.filter) {
      case 'active':
        tasks = tasks.filter(t => !t.completed)
        break
      case 'completed':
        tasks = tasks.filter(t => t.completed)
        break
    }

    // 应用搜索
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase()
      tasks = tasks.filter(t =>
        t.title.toLowerCase().includes(query)
      )
    }

    return tasks
  },

  // 获取统计信息
  getStats() {
    const state = engine.state.get<TodoState>('todos')!
    const total = state.tasks.length
    const completed = state.tasks.filter(t => t.completed).length
    const active = total - completed

    return {
      total,
      completed,
      active,
      completionRate: total > 0 ? (completed / total) * 100 : 0
    }
  },

  // 撤销
  undo(): boolean {
    if (engine.state.canUndo()) {
      engine.state.undo()
      engine.notifications.info('已撤销')
      return true
    }
    return false
  },

  // 重做
  redo(): boolean {
    if (engine.state.canRedo()) {
      engine.state.redo()
      engine.notifications.info('已重做')
      return true
    }
    return false
  }
}

// 全局快捷键
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + Z: 撤销
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    todoManager.undo()
  }

  // Ctrl/Cmd + Shift + Z 或 Ctrl/Cmd + Y: 重做
  if (
    (e.ctrlKey || e.metaKey) &&
    ((e.key === 'z' && e.shiftKey) || e.key === 'y')
  ) {
    e.preventDefault()
    todoManager.redo()
  }
})

// 创建并挂载应用
const app = createApp(App)
engine.install(app)

// 提供 todoManager
app.provide('todoManager', todoManager)

app.mount('#app')

// 应用启动日志
engine.logger.info('Todo 应用已启动')
const stats = todoManager.getStats()
engine.logger.info('任务统计', stats)

// 导出引擎和管理器
export { engine }


