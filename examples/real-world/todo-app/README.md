# Todo 应用示例

一个功能完整的 Todo 应用，展示 LDesign Engine 的核心功能。

## 📋 功能特性

- ✅ 添加、编辑、删除任务
- ✅ 标记任务完成/未完成
- ✅ 任务筛选（全部/进行中/已完成）
- ✅ 任务排序（拖拽排序）
- ✅ 状态持久化（本地存储）
- ✅ 撤销/重做功能
- ✅ 搜索任务
- ✅ 任务统计

## 🚀 运行项目

```bash
# 安装依赖
pnpm install

# 运行开发服务器
pnpm run dev

# 构建
pnpm run build
```

## 📖 技术要点

### 1. 状态管理

使用引擎的状态管理系统管理任务列表：

```typescript
// 任务状态接口
interface Task {
  id: string
  title: string
  completed: boolean
  createdAt: number
}

interface TodoState {
  tasks: Task[]
  filter: 'all' | 'active' | 'completed'
  searchQuery: string
}

// 初始化状态
engine.state.set('todos', {
  tasks: [],
  filter: 'all',
  searchQuery: ''
})
```

### 2. 状态持久化

自动保存任务到本地存储：

```typescript
// 监听任务变化
engine.state.watch('todos.tasks', (tasks) => {
  localStorage.setItem('todos', JSON.stringify(tasks))
})

// 应用启动时恢复
const savedTasks = localStorage.getItem('todos')
if (savedTasks) {
  engine.state.set('todos.tasks', JSON.parse(savedTasks))
}
```

### 3. 时间旅行（撤销/重做）

```typescript
// 启用时间旅行
engine.state.enableTimeTravel({
  maxSnapshots: 50
})

// 撤销
function undo() {
  engine.state.undo()
}

// 重做
function redo() {
  engine.state.redo()
}
```

### 4. 事件系统

使用事件通知任务变更：

```typescript
// 任务添加事件
engine.events.on('todo:added', (task) => {
  console.log('新任务:', task)
  // 显示通知
  engine.notifications.success(`添加任务: ${task.title}`)
})

// 任务完成事件
engine.events.on('todo:completed', (task) => {
  console.log('完成任务:', task)
})
```

### 5. 性能优化

使用虚拟滚动渲染大量任务：

```vue
<template>
  <VirtualScroll
    :items="filteredTasks"
    :item-height="60"
  >
    <template #default="{ item }">
      <TodoItem :task="item" />
    </template>
  </VirtualScroll>
</template>
```

## 📁 项目结构

```
todo-app/
├── src/
│   ├── components/
│   │   ├── TodoItem.vue      # 任务项组件
│   │   ├── TodoList.vue      # 任务列表
│   │   ├── TodoInput.vue     # 输入框
│   │   └── TodoFilter.vue    # 筛选器
│   ├── composables/
│   │   ├── useTodos.ts       # 任务管理逻辑
│   │   └── useTimeTravel.ts  # 时间旅行功能
│   ├── App.vue               # 主组件
│   └── main.ts               # 入口文件
├── index.html
├── package.json
└── README.md
```

## 🎯 学习目标

通过这个示例，你将学会：

1. **状态管理**
   - 如何组织应用状态
   - 状态的读取和更新
   - 响应式状态管理

2. **状态持久化**
   - 如何保存状态到本地
   - 应用启动时恢复状态
   - 增量更新策略

3. **时间旅行**
   - 启用撤销/重做功能
   - 快照管理
   - 历史记录浏览

4. **事件驱动**
   - 使用事件解耦组件
   - 事件监听和触发
   - 事件命名规范

5. **性能优化**
   - 虚拟滚动
   - 防抖/节流
   - 计算属性缓存

## 💡 扩展想法

你可以基于这个示例添加更多功能：

- 📅 任务到期日期
- 🏷️ 任务标签/分类
- ⭐ 任务优先级
- 📝 任务详细描述
- 📎 附件支持
- 👥 多用户协作
- 🔔 到期提醒
- 📊 任务统计图表
- 🎨 自定义主题
- 📱 移动端适配

## 🔗 相关资源

- [状态管理文档](/guide/state)
- [时间旅行功能](/guide/advanced-features#时间旅行)
- [事件系统文档](/guide/events)
- [性能优化指南](/guide/performance-optimization)


