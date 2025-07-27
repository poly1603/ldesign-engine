import { beforeEach, describe, expect, it } from 'vitest'
import { createEngine } from '../src/index'
import type { Engine } from '../src/types'

describe('engine', () => {
  let engine: Engine

  beforeEach(() => {
    engine = createEngine({
      name: 'TestEngine',
      version: '1.0.0',
    })
  })

  it('should create engine with correct name and version', () => {
    expect(engine.name).toBe('TestEngine')
    expect(engine.version).toBe('1.0.0')
  })

  it('should have correct initial state', () => {
    expect(engine.state).toBe('created')
  })

  it('should provide and inject dependencies', () => {
    const testValue = { test: 'value' }
    engine.provide('test', testValue)

    const injected = engine.inject('test')
    expect(injected).toBe(testValue)
  })

  it('should manage configuration', () => {
    engine.setConfig('test.key', 'test-value')
    expect(engine.getConfig('test.key')).toBe('test-value')
  })

  it('should handle events', () => {
    let eventFired = false
    let eventData: any = null

    engine.on('test-event', (data) => {
      eventFired = true
      eventData = data
    })

    engine.emit('test-event', { message: 'hello' })

    expect(eventFired).toBe(true)
    expect(eventData).toEqual({ message: 'hello' })
  })

  it('should add and execute middleware', async () => {
    let middlewareExecuted = false

    engine.addMiddleware('beforeMount', async (context, next) => {
      middlewareExecuted = true
      await next()
    })

    // Create a mock DOM element for mounting
    const mockElement = document.createElement('div')
    document.body.appendChild(mockElement)

    try {
      await engine.mount(mockElement)
      expect(middlewareExecuted).toBe(true)
    }
 catch (error) {
      // Mount might fail in test environment, but middleware should still execute
      expect(middlewareExecuted).toBe(true)
    }
 finally {
      document.body.removeChild(mockElement)
    }
  })

  it('should manage plugins', async () => {
    const testPlugin = {
      name: 'test-plugin',
      install: (engine: Engine) => {
        engine.provide('plugin-test', 'plugin-value')
      },
    }

    await engine.use(testPlugin)

    expect(engine.hasPlugin('test-plugin')).toBe(true)
    expect(engine.inject('plugin-test')).toBe('plugin-value')
  })
})
