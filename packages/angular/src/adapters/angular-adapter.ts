/**
 * Angular 框架适配器
 */

import { Injectable, VERSION } from '@angular/core'
import type { FrameworkAdapter, FrameworkInfo, LifecycleHookMap } from '@ldesign/engine-core'
import { createAngularStateAdapter } from './angular-state-adapter'
import { createAngularEventAdapter } from './angular-event-adapter'

/**
 * Angular 框架适配器
 *
 * 实现 FrameworkAdapter 接口,提供 Angular 特定的框架集成
 */
@Injectable({ providedIn: 'root' })
export class AngularFrameworkAdapter implements FrameworkAdapter<any, any, any> {
  /**
   * 获取框架信息
   */
  getFrameworkInfo(): FrameworkInfo {
    return {
      name: 'angular',
      version: VERSION.full,
      features: {
        reactive: true,
        components: true,
        directives: true,
        slots: true
      }
    }
  }

  /**
   * 获取生命周期钩子映射
   */
  getLifecycleHookMap(): LifecycleHookMap {
    return {
      beforeMount: 'ngOnInit',
      mounted: 'ngAfterViewInit',
      beforeUpdate: 'ngDoCheck',
      updated: 'ngAfterViewChecked',
      beforeUnmount: 'ngOnDestroy',
      unmounted: 'ngOnDestroy'
    }
  }

  /**
   * 创建状态适配器
   */
  createStateAdapter() {
    return createAngularStateAdapter()
  }

  /**
   * 创建事件适配器
   */
  createEventAdapter() {
    return createAngularEventAdapter()
  }

  /**
   * 挂载应用
   *
   * Angular 使用 bootstrapModule,这里不需要实现
   */
  mount(_app: any, _container: any): void {
    // Angular 使用 platformBrowserDynamic().bootstrapModule()
    // 不需要在这里实现
  }

  /**
   * 卸载应用
   *
   * Angular 使用 ApplicationRef.destroy()
   */
  unmount(_app: any): void {
    // Angular 的卸载由 ApplicationRef 管理
  }
}


