# 最终集成计划 - Qwik, Angular, Vue2

**生成时间**: 2025-11-05  
**当前进度**: 67% (6/9 框架完成)  
**剩余框架**: 3个（Qwik, Angular, Vue2）

---

## 📋 执行计划

### 阶段 1: Qwik 框架集成（进行中 - 30%）

**已完成**:
- ✅ 添加 RouterConfig 接口到 engine-app.ts
- ✅ 在 QwikEngineAppOptions 中添加 router 选项
- ✅ 在 createEngineApp 中添加路由插件加载逻辑
- ✅ 更新 package.json 添加路由依赖
- ✅ 创建 Home.tsx 页面

**待完成**（预计 30分钟）:
- [ ] 创建 About.tsx 页面
- [ ] 创建 User.tsx 页面
- [ ] 创建 Navigation.tsx 组件
- [ ] 创建 RouterView.tsx 组件
- [ ] 更新 main.tsx 配置路由
- [ ] 更新 App.tsx 使用路由组件
- [ ] 更新 example/package.json
- [ ] 复制样式文件
- [ ] 生成 ROUTER_INTEGRATION.md

### 阶段 2: Angular 框架集成（预计 60分钟）

**核心任务**:
1. 添加 RouterConfig 接口到 engine-app.ts
2. 在 AngularEngineAppOptions 中添加 router 选项
3. 在 createEngineApp 中添加路由插件加载逻辑
4. 更新 package.json 添加路由依赖
5. 创建 3 个页面组件（.ts 文件）
6. 创建导航组件
7. 创建路由视图组件
8. 更新配置文件
9. 复制样式文件
10. 生成文档

**Angular 特殊考虑**:
- 使用 @Component 装饰器
- 可能需要与 @angular/router 集成
- 使用 RxJS
- 依赖注入系统

### 阶段 3: Vue2 框架集成（预计 60分钟）

**重要**: Vue2 router 包不存在，需要创建

**选项 A: 创建 @ldesign/router-vue2 包**（推荐）
1. 在 packages/router 下创建 router-vue2 目录
2. 参考 router-vue3 的实现
3. 适配 Vue2 的 API（Options API）
4. 创建 Vue2 特定的路由适配器

**选项 B: 使用 vue-router 2.x 直接集成**
1. 在 engine-vue2 中直接集成 vue-router
2. 创建适配层连接到 engine

**推荐选项 A**，因为：
- 保持架构一致性
- 可复用 router-core
- 更好的类型支持
- 统一的 API

---

## 🎯 Qwik 框架详细步骤

### 1. 创建 About.tsx

```typescript
import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { getEngine } from '@ldesign/engine-qwik'

export default component$(() => {
  const events = useSignal<string[]>([])
  const engine = getEngine()

  useVisibleTask$(() => {
    const unsubscribe = engine.events.on('*', (event: string, data: any) => {
      const eventStr = `[${new Date().toLocaleTimeString()}] ${event}: ${JSON.stringify(data)}`
      events.value = [eventStr, ...events.value].slice(0, 10)
    })
    return () => unsubscribe()
  })

  const triggerEvent = $(() => {
    engine.events.emit('custom:test', {
      message: 'Hello from About page!',
      timestamp: Date.now(),
    })
  })

  return (
    <div class="about">
      <div class="header">
        <h1>ℹ️ 关于</h1>
        <p>了解 LDesign Engine 的详细信息</p>
      </div>

      <div class="info-card">
        <h2>引擎信息</h2>
        {/* 引擎信息展示 */}
      </div>

      <div class="event-demo">
        <h2>事件系统演示</h2>
        <div class="event-log">
          {events.value.length === 0 ? (
            <div class="event-item">暂无事件...</div>
          ) : (
            events.value.map((event) => (
              <div class="event-item" key={event}>{event}</div>
            ))
          )}
        </div>
        <button onClick$={triggerEvent}>触发测试事件</button>
      </div>
    </div>
  )
})
```

### 2. 创建 User.tsx

```typescript
import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { getEngine } from '@ldesign/engine-qwik'

const mockUsers = {
  '1': { id: '1', name: '张三', email: 'zhangsan@example.com', role: '管理员', avatar: '👨‍💼' },
  '2': { id: '2', name: '李四', email: 'lisi@example.com', role: '开发者', avatar: '👨‍💻' },
  '3': { id: '3', name: '王五', email: 'wangwu@example.com', role: '设计师', avatar: '👨‍🎨' },
}

export default component$(() => {
  const userId = useSignal('1')
  const user = useSignal(mockUsers['1'])
  const engine = getEngine()

  useVisibleTask$(() => {
    if (engine.router) {
      const route = engine.router.getCurrentRoute()
      userId.value = route.value?.params?.id || '1'
      user.value = mockUsers[userId.value] || mockUsers['1']
    }
  })

  const switchUser = $((id: string) => {
    if (engine.router) {
      engine.router.push(`/user/${id}`)
    }
  })

  return (
    <div class="user">
      <div class="header">
        <h1>👤 用户详情</h1>
      </div>

      <div class="user-card">
        <div class="avatar">{user.value.avatar}</div>
        <h2 class="user-name">{user.value.name}</h2>
        <p class="user-email">{user.value.email}</p>
        <span class="user-role">{user.value.role}</span>

        <div class="user-selector">
          <button onClick$={() => switchUser('1')}>用户 1</button>
          <button onClick$={() => switchUser('2')}>用户 2</button>
          <button onClick$={() => switchUser('3')}>用户 3</button>
        </div>
      </div>
    </div>
  )
})
```

### 3. 创建 Navigation.tsx

```typescript
import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { getEngine } from '@ldesign/engine-qwik'

export default component$(() => {
  const currentPath = useSignal('/')
  const engine = getEngine()

  useVisibleTask$(() => {
    if (engine.router) {
      const route = engine.router.getCurrentRoute()
      currentPath.value = route.value?.path || '/'
      
      const unsubscribe = engine.events.on('router:navigated', () => {
        if (engine.router) {
          const route = engine.router.getCurrentRoute()
          currentPath.value = route.value?.path || '/'
        }
      })
      return () => unsubscribe()
    }
  })

  const navigate = $((path: string, event: Event) => {
    event.preventDefault()
    if (engine.router) {
      engine.router.push(path)
    }
  })

  const isActive = (path: string) => {
    return currentPath.value === path || currentPath.value.startsWith(path + '/')
  }

  return (
    <nav class="navigation">
      <div class="nav-container">
        <div class="nav-brand">
          <h1>🚀 Qwik + LDesign Engine</h1>
        </div>
        <div class="nav-links">
          <a href="/" class={isActive('/') ? 'nav-link active' : 'nav-link'} onClick$={(e) => navigate('/', e)}>
            🏠 首页
          </a>
          <a href="/about" class={isActive('/about') ? 'nav-link active' : 'nav-link'} onClick$={(e) => navigate('/about', e)}>
            ℹ️ 关于
          </a>
          <a href="/user/1" class={isActive('/user') ? 'nav-link active' : 'nav-link'} onClick$={(e) => navigate('/user/1', e)}>
            👤 用户
          </a>
        </div>
      </div>
    </nav>
  )
})
```

### 4. 创建 RouterView.tsx

```typescript
import { component$, useSignal, useVisibleTask$, Slot } from '@builder.io/qwik'
import { getEngine } from '@ldesign/engine-qwik'

export default component$(() => {
  const CurrentComponent = useSignal<any>(null)
  const engine = getEngine()

  useVisibleTask$(() => {
    if (!engine.router) {
      console.warn('Router not available')
      return
    }

    const updateComponent = () => {
      if (engine.router) {
        const route = engine.router.getCurrentRoute()
        if (route.value?.component) {
          CurrentComponent.value = route.value.component
        }
      }
    }

    updateComponent()
    const unsubscribe = engine.events.on('router:navigated', updateComponent)
    return () => unsubscribe()
  })

  return (
    <div class="router-view">
      {CurrentComponent.value ? (
        <CurrentComponent.value />
      ) : (
        <div>Loading...</div>
      )}
    </div>
  )
})
```

---

## 🚀 快速完成命令

### Qwik 剩余工作

```powershell
# 更新 example/package.json
# 复制样式
Copy-Item "packages\engine\packages\react\example\src\App.css" "packages\engine\packages\qwik\example\src\App.css"

# 生成文档
(Get-Content "packages\engine\packages\react\ROUTER_INTEGRATION.md") -replace 'React', 'Qwik' -replace 'react', 'qwik' | Set-Content "packages\engine\packages\qwik\ROUTER_INTEGRATION.md"
```

---

## 📊 预计时间表

| 任务 | 预计时间 | 状态 |
|------|---------|------|
| 完成 Qwik | 30分钟 | ⏳ 30% 完成 |
| 完成 Angular | 60分钟 | ⏸️ 待开始 |
| 创建 Vue2 router 包 | 45分钟 | ⏸️ 待开始 |
| 完成 Vue2 集成 | 30分钟 | ⏸️ 待开始 |
| 测试所有框架 | 30分钟 | ⏸️ 待开始 |
| 生成最终文档 | 15分钟 | ⏸️ 待开始 |
| **总计** | **~3.5小时** | **67% 完成** |

---

## ✅ 建议

1. **立即完成 Qwik**（30分钟）- 已经开始，快速完成
2. **然后 Angular**（60分钟）- 相对复杂
3. **最后 Vue2**（75分钟）- 需要创建 router 包

**总预计时间**: ~2.5小时

---

**报告生成时间**: 2025-11-05  
**当前状态**: Qwik 30% 完成  
**下一步**: 完成 Qwik 剩余 70%

