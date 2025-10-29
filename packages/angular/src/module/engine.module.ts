/**
 * Angular 引擎模块
 */

import { NgModule, ModuleWithProviders, InjectionToken } from '@angular/core'
import { EngineService } from '../services/engine.service'
import { EngineStateService } from '../services/engine-state.service'
import { EngineEventsService } from '../services/engine-events.service'
import type { AngularEngineConfig } from '../types'

/**
 * 引擎配置注入令牌
 */
export const ENGINE_CONFIG = new InjectionToken<AngularEngineConfig>('ENGINE_CONFIG')

/**
 * 引擎模块
 * 
 * @example
 * ```typescript
 * import { EngineModule } from '@ldesign/engine-angular'
 * 
 * @NgModule({
 *   imports: [
 *     EngineModule.forRoot({
 *       config: {
 *         name: 'My App',
 *         version: '1.0.0'
 *       }
 *     })
 *   ]
 * })
 * export class AppModule {}
 * ```
 */
@NgModule({})
export class EngineModule {
  /**
   * 配置根模块
   */
  static forRoot(config?: AngularEngineConfig): ModuleWithProviders<EngineModule> {
    return {
      ngModule: EngineModule,
      providers: [
        {
          provide: ENGINE_CONFIG,
          useValue: config || {}
        },
        EngineService,
        EngineStateService,
        EngineEventsService
      ]
    }
  }

  constructor(
    private engine: EngineService,
    // @Optional() @Inject(ENGINE_CONFIG) private config: AngularEngineConfig
  ) {
    // 初始化引擎（在构造函数中异步初始化）
    // 可以在 APP_INITIALIZER 中进行
  }
}

/**
 * 引擎初始化工厂函数
 * 
 * 用于 APP_INITIALIZER
 */
export function engineInitializerFactory(
  engine: EngineService,
  config?: AngularEngineConfig
) {
  return async () => {
    if (config?.config) {
      await engine.init(config.config)
    }

    if (config?.middleware) {
      config.middleware.forEach(m => engine.useMiddleware(m))
    }

    if (config?.plugins) {
      for (const plugin of config.plugins) {
        await engine.use(plugin)
      }
    }
  }
}


