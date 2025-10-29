/**
 * Angular 引擎状态服务
 */

import { Injectable } from '@angular/core'
import { BehaviorSubject, Observable } from 'rxjs'
import { EngineService } from './engine.service'

/**
 * 引擎状态服务
 * 
 * 提供响应式状态管理
 */
@Injectable({ providedIn: 'root' })
export class EngineStateService {
  constructor(private engine: EngineService) { }

  /**
   * 创建状态（读写）
   * 
   * @param path - 状态路径
   * @param defaultValue - 默认值
   * @returns [Observable, Setter] 元组
   */
  createState<T>(
    path: string,
    defaultValue?: T
  ): [Observable<T | undefined>, (value: T | ((prev: T | undefined) => T)) => void] {
    const initialValue = this.engine.state.get<T>(path) ?? defaultValue
    const subject = new BehaviorSubject<T | undefined>(initialValue)

    // 监听引擎状态变化 -> 更新 Subject
    this.engine.state.watch<T>(path, (newValue) => {
      subject.next(newValue)
    })

    // 更新函数
    const updateValue = (newValue: T | ((prev: T | undefined) => T)) => {
      const current = subject.getValue()
      const finalValue = typeof newValue === 'function'
        ? (newValue as (prev: T | undefined) => T)(current)
        : newValue

      this.engine.state.set(path, finalValue)
      subject.next(finalValue)
    }

    return [subject.asObservable(), updateValue]
  }

  /**
   * 创建只读状态
   * 
   * @param path - 状态路径
   * @param defaultValue - 默认值
   * @returns Observable
   */
  createStateValue<T>(path: string, defaultValue?: T): Observable<T | undefined> {
    const [value$] = this.createState<T>(path, defaultValue)
    return value$
  }

  /**
   * 获取状态值（非响应式）
   */
  get<T>(path: string): T | undefined {
    return this.engine.state.get<T>(path)
  }

  /**
   * 设置状态值
   */
  set<T>(path: string, value: T): void {
    this.engine.state.set(path, value)
  }

  /**
   * 删除状态
   */
  delete(path: string): void {
    this.engine.state.delete(path)
  }

  /**
   * 清空所有状态
   */
  clear(): void {
    this.engine.state.clear()
  }
}


