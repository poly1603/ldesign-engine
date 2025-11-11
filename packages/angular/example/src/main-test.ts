/**
 * 测试文件 - 验证 Analog 编译是否正常
 */
import '@angular/compiler'
import 'zone.js'
import { bootstrapApplication } from '@angular/platform-browser'
import { Component } from '@angular/core'

console.log('🔥 [Test] main-test.ts 开始执行')

@Component({
  selector: 'app-test',
  standalone: true,
  template: '<h1>Test Component</h1>',
})
class TestComponent {}

bootstrapApplication(TestComponent).then(() => {
  console.log('✅ Angular 应用启动成功')
}).catch((error) => {
  console.error('❌ Angular 应用启动失败:', error)
})

