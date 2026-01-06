/**
 * 状态持久化模块
 * 
 * 提供状态的持久化存储功能，支持多种存储适配器
 * 
 * @module state/persistence
 */

/**
 * 持久化适配器接口
 * 
 * 所有存储适配器必须实现此接口
 */
export interface PersistenceAdapter {
  /**
   * 保存数据
   * 
   * @param key - 存储键
   * @param value - 存储值
   */
  save(key: string, value: any): Promise<void> | void

  /**
   * 加载数据
   * 
   * @param key - 存储键
   * @returns 存储的值，不存在时返回 undefined
   */
  load(key: string): Promise<any> | any

  /**
   * 删除数据
   * 
   * @param key - 存储键
   */
  remove(key: string): Promise<void> | void

  /**
   * 清空所有数据
   */
  clear?(): Promise<void> | void

  /**
   * 获取所有键
   */
  keys?(): Promise<string[]> | string[]
}

/**
 * LocalStorage 持久化适配器
 * 
 * 使用浏览器的 localStorage 存储数据
 * 
 * @example
 * ```typescript
 * const adapter = new LocalStoragePersistence('myapp')
 * adapter.save('user', { name: 'Alice' })
 * const user = adapter.load('user')
 * ```
 */
export class LocalStoragePersistence implements PersistenceAdapter {
  private prefix: string

  /**
   * 构造函数
   * 
   * @param prefix - 存储键前缀，用于避免冲突
   */
  constructor(prefix = 'ldesign:state:') {
    this.prefix = prefix
  }

  /**
   * 保存数据到 localStorage
   */
  save(key: string, value: any): void {
    try {
      const serialized = JSON.stringify(value)
      localStorage.setItem(this.prefix + key, serialized)
    } catch (error) {
      console.error(`[Persistence] Failed to save key "${key}":`, error)
      throw error
    }
  }

  /**
   * 从 localStorage 加载数据
   */
  load(key: string): any {
    try {
      const data = localStorage.getItem(this.prefix + key)
      return data ? JSON.parse(data) : undefined
    } catch (error) {
      console.error(`[Persistence] Failed to load key "${key}":`, error)
      return undefined
    }
  }

  /**
   * 从 localStorage 删除数据
   */
  remove(key: string): void {
    localStorage.removeItem(this.prefix + key)
  }

  /**
   * 清空所有带前缀的数据
   */
  clear(): void {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(this.prefix)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
  }

  /**
   * 获取所有带前缀的键
   */
  keys(): string[] {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length))
      }
    }
    return keys
  }
}

/**
 * SessionStorage 持久化适配器
 * 
 * 使用浏览器的 sessionStorage 存储数据（仅在当前会话有效）
 */
export class SessionStoragePersistence implements PersistenceAdapter {
  private prefix: string

  constructor(prefix = 'ldesign:state:') {
    this.prefix = prefix
  }

  save(key: string, value: any): void {
    try {
      const serialized = JSON.stringify(value)
      sessionStorage.setItem(this.prefix + key, serialized)
    } catch (error) {
      console.error(`[Persistence] Failed to save key "${key}":`, error)
      throw error
    }
  }

  load(key: string): any {
    try {
      const data = sessionStorage.getItem(this.prefix + key)
      return data ? JSON.parse(data) : undefined
    } catch (error) {
      console.error(`[Persistence] Failed to load key "${key}":`, error)
      return undefined
    }
  }

  remove(key: string): void {
    sessionStorage.removeItem(this.prefix + key)
  }

  clear(): void {
    const keysToRemove: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith(this.prefix)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key))
  }

  keys(): string[] {
    const keys: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length))
      }
    }
    return keys
  }
}

/**
 * 内存持久化适配器
 * 
 * 仅在内存中存储数据，用于测试或不需要持久化的场景
 */
export class MemoryPersistence implements PersistenceAdapter {
  private storage = new Map<string, any>()

  save(key: string, value: any): void {
    this.storage.set(key, value)
  }

  load(key: string): any {
    return this.storage.get(key)
  }

  remove(key: string): void {
    this.storage.delete(key)
  }

  clear(): void {
    this.storage.clear()
  }

  keys(): string[] {
    return Array.from(this.storage.keys())
  }
}

/**
 * IndexedDB 持久化适配器
 * 
 * 使用浏览器的 IndexedDB 存储大量数据
 * 适合存储大型对象或二进制数据
 */
export class IndexedDBPersistence implements PersistenceAdapter {
  private dbName: string
  private storeName: string
  private db: IDBDatabase | null = null
  private initPromise: Promise<void>

  constructor(dbName = 'ldesign-engine', storeName = 'state') {
    this.dbName = dbName
    this.storeName = storeName
    this.initPromise = this.init()
  }

  /**
   * 初始化 IndexedDB
   */
  private async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName)
        }
      }
    })
  }

  /**
   * 确保数据库已初始化
   */
  private async ensureDB(): Promise<IDBDatabase> {
    await this.initPromise
    if (!this.db) {
      throw new Error('IndexedDB not initialized')
    }
    return this.db
  }

  async save(key: string, value: any): Promise<void> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put(value, key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async load(key: string): Promise<any> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async remove(key: string): Promise<void> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clear(): Promise<void> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async keys(): Promise<string[]> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAllKeys()

      request.onsuccess = () => resolve(request.result as string[])
      request.onerror = () => reject(request.error)
    })
  }
}

/**
 * 持久化配置
 */
export interface PersistenceConfig {
  /** 持久化适配器 */
  adapter: PersistenceAdapter
  /** 需要持久化的键（如果为空则持久化所有键） */
  include?: string[]
  /** 不需要持久化的键 */
  exclude?: string[]
  /** 是否自动保存 */
  autoSave?: boolean
  /** 自动保存延迟（毫秒） */
  saveDelay?: number
  /** 是否在加载时自动恢复 */
  autoRestore?: boolean
  /** 是否启用压缩 */
  compress?: boolean
  /** 当前版本号 */
  version?: number
  /** 版本迁移函数 */
  migrate?: StateMigration[]
}

/**
 * 状态迁移定义
 */
export interface StateMigration {
  /** 源版本 */
  fromVersion: number
  /** 目标版本 */
  toVersion: number
  /** 迁移函数 */
  migrate: (state: Record<string, unknown>) => Record<string, unknown>
}

/**
 * 压缩存储适配器
 *
 * 使用 LZ-based 压缩算法减小存储空间
 *
 * @example
 * ```typescript
 * const adapter = new CompressedStorageAdapter(
 *   new LocalStoragePersistence('myapp'),
 *   { compressionLevel: 'default' }
 * )
 * ```
 */
export class CompressedStorageAdapter implements PersistenceAdapter {
  constructor(
    private baseAdapter: PersistenceAdapter,
    private options: { compressionLevel?: 'fast' | 'default' | 'best' } = {}
  ) {}

  async save(key: string, value: unknown): Promise<void> {
    const serialized = JSON.stringify(value)
    const compressed = this.compress(serialized)
    await this.baseAdapter.save(key, { __compressed: true, data: compressed })
  }

  async load(key: string): Promise<unknown> {
    const stored = await this.baseAdapter.load(key)
    if (!stored) return undefined

    if (stored.__compressed && stored.data) {
      const decompressed = this.decompress(stored.data)
      return JSON.parse(decompressed)
    }

    return stored
  }

  async remove(key: string): Promise<void> {
    await this.baseAdapter.remove(key)
  }

  async clear(): Promise<void> {
    await this.baseAdapter.clear?.()
  }

  async keys(): Promise<string[]> {
    return await this.baseAdapter.keys?.() ?? []
  }

  /**
   * 简单的 LZW 压缩实现
   */
  private compress(str: string): string {
    if (str.length < 100) return str // 短字符串不压缩

    const dict: Map<string, number> = new Map()
    let data = (str + '').split('')
    let out: number[] = []
    let currChar: string
    let phrase = data[0]
    let code = 256

    for (let i = 0; i < 256; i++) {
      dict.set(String.fromCharCode(i), i)
    }

    for (let i = 1; i < data.length; i++) {
      currChar = data[i]
      if (dict.has(phrase + currChar)) {
        phrase += currChar
      } else {
        out.push(dict.get(phrase)!)
        dict.set(phrase + currChar, code)
        code++
        phrase = currChar
      }
    }
    out.push(dict.get(phrase)!)

    // 转换为 Base64 字符串
    const bytes = new Uint16Array(out)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  /**
   * LZW 解压缩
   */
  private decompress(compressed: string): string {
    if (!compressed.startsWith('AA')) {
      // 非压缩数据
      return compressed
    }

    try {
      const binary = atob(compressed)
      const bytes = new Uint16Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      const data = Array.from(bytes)

      const dict: Map<number, string> = new Map()
      for (let i = 0; i < 256; i++) {
        dict.set(i, String.fromCharCode(i))
      }

      let currChar = String.fromCharCode(data[0])
      let oldPhrase = currChar
      let out = [currChar]
      let code = 256
      let phrase: string

      for (let i = 1; i < data.length; i++) {
        let currCode = data[i]
        if (currCode < 256) {
          phrase = String.fromCharCode(currCode)
        } else {
          phrase = dict.has(currCode) ? dict.get(currCode)! : oldPhrase + currChar
        }
        out.push(phrase)
        currChar = phrase.charAt(0)
        dict.set(code, oldPhrase + currChar)
        code++
        oldPhrase = phrase
      }
      return out.join('')
    } catch {
      return compressed
    }
  }
}

/**
 * 版本化存储适配器
 *
 * 支持状态版本迁移
 *
 * @example
 * ```typescript
 * const adapter = new VersionedStorageAdapter(
 *   new LocalStoragePersistence('myapp'),
 *   {
 *     currentVersion: 2,
 *     migrations: [
 *       {
 *         fromVersion: 1,
 *         toVersion: 2,
 *         migrate: (state) => ({
 *           ...state,
 *           newField: state.oldField ?? 'default'
 *         })
 *       }
 *     ]
 *   }
 * )
 * ```
 */
export class VersionedStorageAdapter implements PersistenceAdapter {
  constructor(
    private baseAdapter: PersistenceAdapter,
    private options: {
      currentVersion: number
      migrations?: StateMigration[]
    }
  ) {}

  async save(key: string, value: unknown): Promise<void> {
    const wrapped = {
      __version: this.options.currentVersion,
      __timestamp: Date.now(),
      data: value
    }
    await this.baseAdapter.save(key, wrapped)
  }

  async load(key: string): Promise<unknown> {
    const stored = await this.baseAdapter.load(key)
    if (!stored) return undefined

    // 检查是否是版本化数据
    if (stored.__version !== undefined) {
      let data = stored.data
      let version = stored.__version

      // 运行迁移
      if (version < this.options.currentVersion && this.options.migrations) {
        data = this.runMigrations(data, version, this.options.currentVersion)

        // 保存迁移后的数据
        await this.save(key, data)
      }

      return data
    }

    // 旧格式数据，返回原始值
    return stored
  }

  async remove(key: string): Promise<void> {
    await this.baseAdapter.remove(key)
  }

  async clear(): Promise<void> {
    await this.baseAdapter.clear?.()
  }

  async keys(): Promise<string[]> {
    return await this.baseAdapter.keys?.() ?? []
  }

  /**
   * 运行迁移
   */
  private runMigrations(
    data: Record<string, unknown>,
    fromVersion: number,
    toVersion: number
  ): Record<string, unknown> {
    if (!this.options.migrations) return data

    let currentData = data
    let currentVersion = fromVersion

    // 按版本顺序排序迁移
    const sortedMigrations = [...this.options.migrations].sort(
      (a, b) => a.fromVersion - b.fromVersion
    )

    for (const migration of sortedMigrations) {
      if (
        migration.fromVersion >= currentVersion &&
        migration.toVersion <= toVersion
      ) {
        try {
          console.log(
            `[VersionedStorage] Running migration v${migration.fromVersion} -> v${migration.toVersion}`
          )
          currentData = migration.migrate(currentData)
          currentVersion = migration.toVersion
        } catch (error) {
          console.error(
            `[VersionedStorage] Migration failed v${migration.fromVersion} -> v${migration.toVersion}:`,
            error
          )
          throw error
        }
      }
    }

    return currentData
  }
}

/**
 * 选择性持久化适配器
 *
 * 只持久化指定的键
 *
 * @example
 * ```typescript
 * const adapter = new SelectivePersistenceAdapter(
 *   new LocalStoragePersistence('myapp'),
 *   {
 *     include: ['user', 'settings'],
 *     exclude: ['temp', /^cache:/]
 *   }
 * )
 * ```
 */
export class SelectivePersistenceAdapter implements PersistenceAdapter {
  constructor(
    private baseAdapter: PersistenceAdapter,
    private options: {
      include?: (string | RegExp)[]
      exclude?: (string | RegExp)[]
    } = {}
  ) {}

  private shouldPersist(key: string): boolean {
    // 检查排除列表
    if (this.options.exclude) {
      for (const pattern of this.options.exclude) {
        if (typeof pattern === 'string') {
          if (key === pattern) return false
        } else {
          if (pattern.test(key)) return false
        }
      }
    }

    // 检查包含列表（如果有定义）
    if (this.options.include && this.options.include.length > 0) {
      for (const pattern of this.options.include) {
        if (typeof pattern === 'string') {
          if (key === pattern) return true
        } else {
          if (pattern.test(key)) return true
        }
      }
      return false
    }

    return true
  }

  async save(key: string, value: unknown): Promise<void> {
    if (!this.shouldPersist(key)) return
    await this.baseAdapter.save(key, value)
  }

  async load(key: string): Promise<unknown> {
    if (!this.shouldPersist(key)) return undefined
    return await this.baseAdapter.load(key)
  }

  async remove(key: string): Promise<void> {
    await this.baseAdapter.remove(key)
  }

  async clear(): Promise<void> {
    await this.baseAdapter.clear?.()
  }

  async keys(): Promise<string[]> {
    const allKeys = await this.baseAdapter.keys?.() ?? []
    return allKeys.filter(key => this.shouldPersist(key))
  }
}

/**
 * 创建增强的持久化适配器
 *
 * 组合压缩、版本化和选择性持久化功能
 *
 * @param baseAdapter - 基础适配器
 * @param options - 配置选项
 * @returns 增强后的适配器
 *
 * @example
 * ```typescript
 * const adapter = createEnhancedPersistence(
 *   new LocalStoragePersistence('myapp'),
 *   {
 *     compress: true,
 *     version: 2,
 *     migrations: [{ fromVersion: 1, toVersion: 2, migrate: ... }],
 *     include: ['user', 'settings']
 *   }
 * )
 * ```
 */
export function createEnhancedPersistence(
  baseAdapter: PersistenceAdapter,
  options: {
    compress?: boolean
    version?: number
    migrations?: StateMigration[]
    include?: (string | RegExp)[]
    exclude?: (string | RegExp)[]
  } = {}
): PersistenceAdapter {
  let adapter: PersistenceAdapter = baseAdapter

  // 应用选择性持久化
  if (options.include || options.exclude) {
    adapter = new SelectivePersistenceAdapter(adapter, {
      include: options.include,
      exclude: options.exclude
    })
  }

  // 应用版本化
  if (options.version) {
    adapter = new VersionedStorageAdapter(adapter, {
      currentVersion: options.version,
      migrations: options.migrations
    })
  }

  // 应用压缩
  if (options.compress) {
    adapter = new CompressedStorageAdapter(adapter)
  }

  return adapter
}
