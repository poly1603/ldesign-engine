/**
 * @ldesign/engine/angular - Angular 集成导出
 * 
 * 导出 Angular 相关的集成功能，包括服务、指令等。
 * 
 * @packageDocumentation
 * 
 * @example
 * ```typescript
 * import { EngineModule } from '@ldesign/engine/angular'
 * 
 * @NgModule({
 *   imports: [
 *     EngineModule.forRoot({
 *       name: 'My Angular App',
 *       debug: true
 *     })
 *   ]
 * })
 * export class AppModule { }
 * ```
 */

// 重新导出 Angular 包的所有功能
export * from '@ldesign/engine-angular'

