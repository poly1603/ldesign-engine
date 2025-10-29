# Angular Engine Examples

由于 Angular 通常使用 Angular CLI 而不是 Vite，我们提供基于 Angular CLI 的示例项目结构。

## 快速开始

### 1. 创建新项目

```bash
ng new my-engine-app
cd my-engine-app
```

### 2. 安装依赖

```bash
pnpm add @ldesign/engine-angular @ldesign/engine-core
```

### 3. 配置模块 (app.module.ts)

```typescript
import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { EngineModule } from '@ldesign/engine-angular'
import { AppComponent } from './app.component'
import { CounterComponent } from './counter/counter.component'
import { EventDemoComponent } from './event-demo/event-demo.component'

@NgModule({
  declarations: [
    AppComponent,
    CounterComponent,
    EventDemoComponent
  ],
  imports: [
    BrowserModule,
    EngineModule.forRoot({
      config: {
        name: 'Angular Engine Demo',
        version: '1.0.0',
        debug: true
      }
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

### 4. 示例组件

查看 `components/` 目录中的示例组件：

- `counter.component.ts` - 计数器示例（状态管理）
- `event-demo.component.ts` - 事件系统示例

## 完整示例

请参考 Angular 官方文档创建完整的应用：
https://angular.io/guide/setup-local

然后按照上述步骤集成 @ldesign/engine-angular。


