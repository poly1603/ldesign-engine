/**
 * Angular Engine Service
 * 
 * 提供引擎实例的依赖注入服务
 */

import { Injectable, InjectionToken } from '@angular/core'
import { BehaviorSubject, Observable } from 'rxjs'
import type { CoreEngine } from '@ldesign/engine-core'

/**
 * 引擎实例注入令牌
 */
export const ENGINE_TOKEN = new InjectionToken<CoreEngine>('ENGINE_TOKEN')

/**
 * 引擎服务
 * 
 * 提供引擎实例的访问和管理
 */
@Injectable()
export class EngineService {
  private engineSubject = new BehaviorSubject<CoreEngine | null>(null)
  public engine$ = this.engineSubject.asObservable()

  /**
   * 构造函数
   */
  constructor() {
    // 空构造函数，确保 Angular DI 正常工作
  }

  /**
   * 设置引擎实例
   */
  setEngine(engine: CoreEngine): void {
    this.engineSubject.next(engine)
  }

  /**
   * 获取引擎实例
   */
  getEngine(): CoreEngine | null {
    return this.engineSubject.value
  }

  /**
   * 获取引擎实例(Observable)
   */
  getEngine$(): Observable<CoreEngine | null> {
    return this.engine$
  }
}

