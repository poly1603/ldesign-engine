/**
 * 手动测试脚本 - 验证核心功能
 */

const { createCoreEngine, definePlugin, defineMiddleware } = require('./lib/index.cjs')

async function test() {
  console.log('🧪 开始测试 @ldesign/engine-core...\n')

  // 测试 1: 创建引擎
  console.log('✓ 测试 1: 创建引擎')
  const engine = createCoreEngine({
    name: 'Test Engine',
    debug: true,
  })
  console.log('  引擎名称:', engine.config.name)
  console.log('  调试模式:', engine.config.debug)

  // 测试 2: 初始化引擎
  console.log('\n✓ 测试 2: 初始化引擎')
  await engine.init()
  console.log('  引擎已初始化')

  // 测试 3: 插件系统
  console.log('\n✓ 测试 3: 插件系统')
  const testPlugin = definePlugin({
    name: 'test-plugin',
    version: '1.0.0',
    install(context) {
      console.log('  插件安装:', context.engine.config.name)
      context.engine.state.set('pluginData', { installed: true })
    },
  })
  await engine.use(testPlugin)
  console.log('  插件已注册:', engine.plugins.has('test-plugin'))
  console.log('  插件数据:', engine.state.get('pluginData'))

  // 测试 4: 中间件系统
  console.log('\n✓ 测试 4: 中间件系统')
  const testMiddleware = defineMiddleware({
    name: 'test-middleware',
    priority: 10,
    async execute(context, next) {
      console.log('  中间件执行前:', context.data)
      context.data.processed = true
      await next()
      console.log('  中间件执行后:', context.data)
    },
  })
  engine.middleware.use(testMiddleware)
  await engine.middleware.execute({ data: { value: 'test' } })
  console.log('  中间件数量:', engine.middleware.size())

  // 测试 5: 生命周期系统
  console.log('\n✓ 测试 5: 生命周期系统')
  let lifecycleTriggered = false
  engine.lifecycle.on('custom-hook', () => {
    lifecycleTriggered = true
    console.log('  生命周期钩子触发')
  })
  await engine.lifecycle.trigger('custom-hook')
  console.log('  钩子已触发:', lifecycleTriggered)

  // 测试 6: 事件系统
  console.log('\n✓ 测试 6: 事件系统')
  let eventReceived = null
  engine.events.on('test-event', (payload) => {
    eventReceived = payload
    console.log('  事件接收:', payload)
  })
  engine.events.emit('test-event', { message: 'Hello' })
  console.log('  事件已触发:', eventReceived !== null)

  // 测试 7: 状态管理
  console.log('\n✓ 测试 7: 状态管理')
  engine.state.set('count', 0)
  engine.state.set('count', 1)
  console.log('  状态值:', engine.state.get('count'))
  console.log('  状态存在:', engine.state.has('count'))
  console.log('  所有状态键:', engine.state.keys())

  // 测试 8: 销毁引擎
  console.log('\n✓ 测试 8: 销毁引擎')
  await engine.destroy()
  console.log('  引擎已销毁')
  console.log('  插件数量:', engine.plugins.getAll().length)
  console.log('  中间件数量:', engine.middleware.size())

  console.log('\n✅ 所有测试通过!')
}

test().catch((error) => {
  console.error('\n❌ 测试失败:', error)
  process.exit(1)
})

