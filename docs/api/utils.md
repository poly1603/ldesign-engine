# 工具函数 API

LDesign Engine 提供了丰富的工具函数，帮助你简化开发。

## 导入

```typescript
import {
  debounce,
  throttle,
  deepClone,
  deepMerge,
  isPlainObject,
  isPromise
} from '@ldesign/engine/utils'
```

## 函数工具

### debounce

创建一个防抖函数。

**类型签名**

```typescript
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options?: {
    leading?: boolean
    trailing?: boolean
    maxWait?: number
  }
): DebouncedFunction<T>

interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T>
  cancel(): void
  flush(): ReturnType<T>
  pending(): boolean
}
```

**参数**

- `func`: 要防抖的函数
- `wait`: 延迟时间（毫秒）
- `options`: 可选配置
  - `leading`: 是否在延迟开始前调用 (默认: `false`)
  - `trailing`: 是否在延迟结束后调用 (默认: `true`)
  - `maxWait`: 最大等待时间

**返回值**

返回新的防抖函数，包含以下方法：
- `cancel()`: 取消延迟的函数调用
- `flush()`: 立即调用延迟的函数
- `pending()`: 检查是否有延迟的函数调用

**示例**

```typescript
// 基础用法
const debouncedSearch = debounce((query: string) => {
  console.log('搜索:', query)
}, 300)

debouncedSearch('hello')
debouncedSearch('hello world') // 只会执行这一次

// 取消防抖
debouncedSearch.cancel()

// 立即执行
debouncedSearch.flush()

// 检查状态
if (debouncedSearch.pending()) {
  console.log('有延迟的调用')
}

// 带选项
const debouncedWithLeading = debounce(
  (value: string) => console.log(value),
  300,
  { leading: true, trailing: false }
)
```

### throttle

创建一个节流函数。

**类型签名**

```typescript
function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options?: {
    leading?: boolean
    trailing?: boolean
  }
): ThrottledFunction<T>
```

**参数**

- `func`: 要节流的函数
- `wait`: 节流时间（毫秒）
- `options`: 可选配置
  - `leading`: 是否在节流开始时调用 (默认: `true`)
  - `trailing`: 是否在节流结束时调用 (默认: `true`)

**示例**

```typescript
const throttledScroll = throttle((event: Event) => {
  console.log('滚动:', event)
}, 100)

window.addEventListener('scroll', throttledScroll)

// 只在开始时执行
const leadingOnly = throttle(
  handler,
  100,
  { leading: true, trailing: false }
)

// 只在结束时执行
const trailingOnly = throttle(
  handler,
  100,
  { leading: false, trailing: true }
)
```

### memoize

创建一个记忆化函数。

**类型签名**

```typescript
function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): T & {
  cache: Map<string, ReturnType<T>>
  clear(): void
}
```

**参数**

- `func`: 要记忆化的函数
- `resolver`: 自定义缓存键生成函数

**示例**

```typescript
const expensiveOperation = memoize((n: number) => {
  console.log('计算中...')
  return n * n
})

console.log(expensiveOperation(5)) // 计算中... 25
console.log(expensiveOperation(5)) // 25 (从缓存)

// 清除缓存
expensiveOperation.clear()

// 自定义缓存键
const memoized = memoize(
  (a: number, b: number) => a + b,
  (a, b) => `${a}-${b}`
)
```

## 对象工具

### deepClone

深度克隆对象。

**类型签名**

```typescript
function deepClone<T>(value: T): T
```

**示例**

```typescript
const obj = {
  name: 'Alice',
  age: 30,
  address: {
    city: 'Beijing',
    country: 'China'
  },
  hobbies: ['reading', 'coding']
}

const cloned = deepClone(obj)
cloned.address.city = 'Shanghai'

console.log(obj.address.city) // 'Beijing' (原对象未改变)
console.log(cloned.address.city) // 'Shanghai'
```

### deepMerge

深度合并对象。

**类型签名**

```typescript
function deepMerge<T extends object>(...sources: Partial<T>[]): T
```

**示例**

```typescript
const obj1 = {
  a: 1,
  b: { x: 1, y: 2 }
}

const obj2 = {
  b: { y: 3, z: 4 },
  c: 3
}

const merged = deepMerge(obj1, obj2)
// 结果: { a: 1, b: { x: 1, y: 3, z: 4 }, c: 3 }
```

### pick

从对象中选择指定属性。

**类型签名**

```typescript
function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K>
```

**示例**

```typescript
const user = {
  id: '123',
  name: 'Alice',
  email: 'alice@example.com',
  password: 'secret'
}

const publicData = pick(user, ['id', 'name', 'email'])
// 结果: { id: '123', name: 'Alice', email: 'alice@example.com' }
```

### omit

从对象中排除指定属性。

**类型签名**

```typescript
function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K>
```

**示例**

```typescript
const user = {
  id: '123',
  name: 'Alice',
  password: 'secret',
  token: 'xyz'
}

const safeData = omit(user, ['password', 'token'])
// 结果: { id: '123', name: 'Alice' }
```

## 类型检查

### isPlainObject

检查值是否为纯对象。

```typescript
function isPlainObject(value: unknown): value is Record<string, any>

isPlainObject({}) // true
isPlainObject({ a: 1 }) // true
isPlainObject([]) // false
isPlainObject(null) // false
isPlainObject(new Date()) // false
```

### isPromise

检查值是否为 Promise。

```typescript
function isPromise(value: unknown): value is Promise<any>

isPromise(Promise.resolve()) // true
isPromise(async () => {}) // false
isPromise({ then: () => {} }) // true
```

### isFunction

检查值是否为函数。

```typescript
function isFunction(value: unknown): value is Function

isFunction(() => {}) // true
isFunction(function() {}) // true
isFunction(class {}) // true
isFunction({}) // false
```

## 数组工具

### chunk

将数组拆分成指定大小的块。

```typescript
function chunk<T>(array: T[], size: number): T[][]

chunk([1, 2, 3, 4, 5], 2)
// 结果: [[1, 2], [3, 4], [5]]
```

### unique

数组去重。

```typescript
function unique<T>(array: T[], key?: keyof T): T[]

// 基础类型去重
unique([1, 2, 2, 3, 3, 4]) // [1, 2, 3, 4]

// 对象数组去重
const users = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 1, name: 'Alice' }
]
unique(users, 'id') // [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
```

### groupBy

按指定键分组。

```typescript
function groupBy<T>(array: T[], key: keyof T): Record<string, T[]>

const users = [
  { name: 'Alice', role: 'admin' },
  { name: 'Bob', role: 'user' },
  { name: 'Charlie', role: 'admin' }
]

groupBy(users, 'role')
// 结果: {
//   admin: [{ name: 'Alice', role: 'admin' }, { name: 'Charlie', role: 'admin' }],
//   user: [{ name: 'Bob', role: 'user' }]
// }
```

## 字符串工具

### camelCase

转换为驼峰命名。

```typescript
function camelCase(str: string): string

camelCase('hello-world') // 'helloWorld'
camelCase('hello_world') // 'helloWorld'
camelCase('hello world') // 'helloWorld'
```

### kebabCase

转换为短横线命名。

```typescript
function kebabCase(str: string): string

kebabCase('helloWorld') // 'hello-world'
kebabCase('HelloWorld') // 'hello-world'
```

### snakeCase

转换为下划线命名。

```typescript
function snakeCase(str: string): string

snakeCase('helloWorld') // 'hello_world'
snakeCase('HelloWorld') // 'hello_world'
```

## 异步工具

### sleep

延迟执行。

```typescript
function sleep(ms: number): Promise<void>

async function example() {
  console.log('开始')
  await sleep(1000)
  console.log('1秒后')
}
```

### retry

重试失败的异步操作。

```typescript
function retry<T>(
  fn: () => Promise<T>,
  options?: {
    times?: number
    delay?: number
    onError?: (error: Error, attempt: number) => void
  }
): Promise<T>

async function fetchData() {
  const data = await retry(
    () => fetch('/api/data').then(r => r.json()),
    {
      times: 3,
      delay: 1000,
      onError: (error, attempt) => {
        console.log(`尝试 ${attempt} 失败:`, error)
      }
    }
  )
  return data
}
```

### timeout

为 Promise 添加超时。

```typescript
function timeout<T>(
  promise: Promise<T>,
  ms: number,
  message?: string
): Promise<T>

async function example() {
  try {
    const result = await timeout(
      fetch('/api/slow'),
      5000,
      '请求超时'
    )
  } catch (error) {
    console.error(error) // '请求超时'
  }
}
```

## 性能工具

### once

确保函数只执行一次。

```typescript
function once<T extends (...args: any[]) => any>(func: T): T

const initialize = once(() => {
  console.log('初始化')
  return { initialized: true }
})

initialize() // 输出: '初始化'
initialize() // 不执行
initialize() // 不执行
```

### batch

批量处理。

```typescript
function batch<T, R>(
  items: T[],
  processor: (batch: T[]) => Promise<R>,
  batchSize: number
): Promise<R[]>

const items = Array.from({ length: 100 }, (_, i) => i)

const results = await batch(
  items,
  async (batch) => {
    // 处理每批数据
    return batch.reduce((sum, n) => sum + n, 0)
  },
  10 // 每批10个
)
```

## URL 工具

### parseQuery

解析 URL 查询字符串。

```typescript
function parseQuery(search: string): Record<string, string>

parseQuery('?name=Alice&age=30')
// 结果: { name: 'Alice', age: '30' }
```

### stringifyQuery

序列化对象为查询字符串。

```typescript
function stringifyQuery(params: Record<string, any>): string

stringifyQuery({ name: 'Alice', age: 30 })
// 结果: 'name=Alice&age=30'
```

## 随机工具

### randomString

生成随机字符串。

```typescript
function randomString(length: number, charset?: string): string

randomString(8) // 'a8Kj9pLm'
randomString(16, 'ABCDEF0123456789') // 'A3F8D12E'
```

### randomNumber

生成随机数。

```typescript
function randomNumber(min: number, max: number): number

randomNumber(1, 100) // 42
```

## 相关资源

- [核心概念](/guide/core-concepts)
- [性能优化](/guide/performance-optimization)
- [TypeScript 支持](/guide/typescript)


