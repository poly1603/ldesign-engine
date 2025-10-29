/**
 * Angular 引擎服务
 */

import { Injectable } from '@angular/core'
import { CoreEngineImpl, type Plugin, type Middleware, type CoreEngineConfig } from '@ldesign/engine-core'
import type { AngularEngine } from '../types'

/**
 * 引擎服务
 * 
 * Angular 应用的核心引擎服务
 */
@Injectable({ providedIn: 'root' })
export class EngineService implements AngularEngine {
  private engine: CoreEngineImpl

  constructor() {
    // 创建默认引擎实例
    this.engine = new CoreEngineImpl({
      name: 'Angular Engine',
      version: '1.0.0'
    })
  }

  /**
   * 初始化引擎
   */
  async init(config?: CoreEngineConfig): Promise<void> {
    if (config) {
      // 重新创建引擎实例
      this.engine = new CoreEngineImpl(config)
    }
    await this.engine.init()
  }

  /**
   * 注册插件
   */
  async use(plugin: Plugin): Promise<void> {
    return this.engine.use(plugin)
  }

  /**
   * 注册中间件
   */
  useMiddleware(middleware: Middleware): void {
    this.engine.middleware.use(middleware)
  }

  // 代理所有 CoreEngine 的属性和方法
  get state() {
    return this.engine.state
  }

  get events() {
    return this.engine.events
  }

  get lifecycle() {
    return this.engine.lifecycle
  }

  get logger() {
    return this.engine.logger
  }

  get plugins() {
    return this.engine.plugins
  }

  get middleware() {
    return this.engine.middleware
  }

  get config() {
    return this.engine.config
  }

  get version() {
    return this.engine.version
  }

  destroy(): void {
    this.engine.destroy()
  }
}


