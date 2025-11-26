/**
 * 插件注册表
 * 
 * 提供插件元数据管理、搜索、版本检查等功能
 * 
 * @module plugin/plugin-registry
 */

/**
 * 插件元数据接口
 */
export interface PluginMetadata {
  /** 插件名称 */
  name: string
  /** 插件版本 */
  version: string
  /** 插件描述 */
  description: string
  /** 作者 */
  author: string
  /** 仓库地址 */
  repository?: string
  /** 主页 */
  homepage?: string
  /** 许可证 */
  license?: string
  /** 关键词 */
  keywords?: string[]
  /** 依赖项 */
  dependencies?: string[]
  /** 分类 */
  category?: string
  /** 标签 */
  tags?: string[]
  /** 下载量 */
  downloads?: number
  /** 评分 */
  rating?: number
  /** 创建时间 */
  createdAt?: Date
  /** 更新时间 */
  updatedAt?: Date
}

/**
 * 搜索选项
 */
export interface SearchOptions {
  /** 搜索查询 */
  query?: string
  /** 分类过滤 */
  category?: string
  /** 标签过滤 */
  tags?: string[]
  /** 关键词过滤 */
  keywords?: string[]
  /** 作者过滤 */
  author?: string
  /** 排序方式 */
  sortBy?: 'name' | 'downloads' | 'rating' | 'updated' | 'created'
  /** 排序顺序 */
  sortOrder?: 'asc' | 'desc'
  /** 分页：页码 */
  page?: number
  /** 分页：每页数量 */
  pageSize?: number
}

/**
 * 搜索结果
 */
export interface SearchResult {
  /** 插件列表 */
  plugins: PluginMetadata[]
  /** 总数 */
  total: number
  /** 当前页 */
  page: number
  /** 每页数量 */
  pageSize: number
  /** 总页数 */
  totalPages: number
}

/**
 * 插件注册表
 * 
 * 管理插件元数据，提供搜索、过滤、版本检查等功能
 * 
 * @example
 * ```typescript
 * const registry = new PluginRegistry()
 * 
 * // 注册插件
 * registry.register({
 *   name: 'router',
 *   version: '1.0.0',
 *   description: '路由插件',
 *   author: 'ldesign',
 *   keywords: ['router', 'navigation']
 * })
 * 
 * // 搜索插件
 * const results = registry.search({ query: 'router' })
 * 
 * // 获取插件信息
 * const plugin = registry.get('router')
 * ```
 */
export class PluginRegistry {
  /** 插件元数据存储 */
  private plugins = new Map<string, PluginMetadata>()

  /** 分类索引 */
  private categoryIndex = new Map<string, Set<string>>()

  /** 标签索引 */
  private tagIndex = new Map<string, Set<string>>()

  /** 关键词索引 */
  private keywordIndex = new Map<string, Set<string>>()

  /**
   * 注册插件
   * 
   * @param metadata - 插件元数据
   * 
   * @example
   * ```typescript
   * registry.register({
   *   name: 'i18n',
   *   version: '2.0.0',
   *   description: '国际化插件',
   *   author: 'ldesign',
   *   category: 'utils',
   *   tags: ['i18n', 'locale'],
   *   keywords: ['internationalization', 'translation']
   * })
   * ```
   */
  register(metadata: PluginMetadata): void {
    // 保存插件
    this.plugins.set(metadata.name, metadata)

    // 更新分类索引
    if (metadata.category) {
      if (!this.categoryIndex.has(metadata.category)) {
        this.categoryIndex.set(metadata.category, new Set())
      }
      this.categoryIndex.get(metadata.category)!.add(metadata.name)
    }

    // 更新标签索引
    if (metadata.tags) {
      metadata.tags.forEach(tag => {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set())
        }
        this.tagIndex.get(tag)!.add(metadata.name)
      })
    }

    // 更新关键词索引
    if (metadata.keywords) {
      metadata.keywords.forEach(keyword => {
        if (!this.keywordIndex.has(keyword.toLowerCase())) {
          this.keywordIndex.set(keyword.toLowerCase(), new Set())
        }
        this.keywordIndex.get(keyword.toLowerCase())!.add(metadata.name)
      })
    }
  }

  /**
   * 批量注册插件
   * 
   * @param metadataList - 插件元数据列表
   */
  registerMany(metadataList: PluginMetadata[]): void {
    metadataList.forEach(metadata => this.register(metadata))
  }

  /**
   * 取消注册插件
   * 
   * @param name - 插件名称
   * @returns 是否成功
   */
  unregister(name: string): boolean {
    const metadata = this.plugins.get(name)
    if (!metadata) {
      return false
    }

    // 从插件存储中删除
    this.plugins.delete(name)

    // 从分类索引中删除
    if (metadata.category) {
      const categoryPlugins = this.categoryIndex.get(metadata.category)
      if (categoryPlugins) {
        categoryPlugins.delete(name)
        if (categoryPlugins.size === 0) {
          this.categoryIndex.delete(metadata.category)
        }
      }
    }

    // 从标签索引中删除
    if (metadata.tags) {
      metadata.tags.forEach(tag => {
        const tagPlugins = this.tagIndex.get(tag)
        if (tagPlugins) {
          tagPlugins.delete(name)
          if (tagPlugins.size === 0) {
            this.tagIndex.delete(tag)
          }
        }
      })
    }

    // 从关键词索引中删除
    if (metadata.keywords) {
      metadata.keywords.forEach(keyword => {
        const keywordPlugins = this.keywordIndex.get(keyword.toLowerCase())
        if (keywordPlugins) {
          keywordPlugins.delete(name)
          if (keywordPlugins.size === 0) {
            this.keywordIndex.delete(keyword.toLowerCase())
          }
        }
      })
    }

    return true
  }

  /**
   * 获取插件信息
   * 
   * @param name - 插件名称
   * @returns 插件元数据
   */
  get(name: string): PluginMetadata | undefined {
    return this.plugins.get(name)
  }

  /**
   * 检查插件是否存在
   * 
   * @param name - 插件名称
   * @returns 是否存在
   */
  has(name: string): boolean {
    return this.plugins.has(name)
  }

  /**
   * 获取所有插件
   * 
   * @returns 插件列表
   */
  getAll(): PluginMetadata[] {
    return Array.from(this.plugins.values())
  }

  /**
   * 搜索插件
   * 
   * @param options - 搜索选项
   * @returns 搜索结果
   * 
   * @example
   * ```typescript
   * // 简单搜索
   * const results = registry.search({ query: 'router' })
   * 
   * // 高级搜索
   * const results = registry.search({
   *   category: 'utils',
   *   tags: ['i18n'],
   *   sortBy: 'downloads',
   *   sortOrder: 'desc',
   *   page: 1,
   *   pageSize: 10
   * })
   * ```
   */
  search(options: SearchOptions = {}): SearchResult {
    let plugins = this.getAll()

    // 文本搜索
    if (options.query) {
      const query = options.query.toLowerCase()
      plugins = plugins.filter(plugin => 
        plugin.name.toLowerCase().includes(query) ||
        plugin.description.toLowerCase().includes(query) ||
        plugin.keywords?.some(k => k.toLowerCase().includes(query)) ||
        plugin.tags?.some(t => t.toLowerCase().includes(query))
      )
    }

    // 分类过滤
    if (options.category) {
      plugins = plugins.filter(plugin => plugin.category === options.category)
    }

    // 标签过滤
    if (options.tags && options.tags.length > 0) {
      plugins = plugins.filter(plugin => 
        plugin.tags && options.tags!.some(tag => plugin.tags!.includes(tag))
      )
    }

    // 关键词过滤
    if (options.keywords && options.keywords.length > 0) {
      plugins = plugins.filter(plugin =>
        plugin.keywords && options.keywords!.some(kw => plugin.keywords!.includes(kw))
      )
    }

    // 作者过滤
    if (options.author) {
      plugins = plugins.filter(plugin => plugin.author === options.author)
    }

    // 排序
    const sortBy = options.sortBy || 'name'
    const sortOrder = options.sortOrder || 'asc'
    
    plugins.sort((a, b) => {
      let compare = 0

      switch (sortBy) {
        case 'name':
          compare = a.name.localeCompare(b.name)
          break
        case 'downloads':
          compare = (a.downloads || 0) - (b.downloads || 0)
          break
        case 'rating':
          compare = (a.rating || 0) - (b.rating || 0)
          break
        case 'updated':
          compare = (a.updatedAt?.getTime() || 0) - (b.updatedAt?.getTime() || 0)
          break
        case 'created':
          compare = (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0)
          break
      }

      return sortOrder === 'asc' ? compare : -compare
    })

    // 分页
    const page = options.page || 1
    const pageSize = options.pageSize || 10
    const total = plugins.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const end = start + pageSize

    return {
      plugins: plugins.slice(start, end),
      total,
      page,
      pageSize,
      totalPages
    }
  }

  /**
   * 按分类获取插件
   * 
   * @param category - 分类名称
   * @returns 插件列表
   */
  getByCategory(category: string): PluginMetadata[] {
    const pluginNames = this.categoryIndex.get(category)
    if (!pluginNames) {
      return []
    }

    return Array.from(pluginNames)
      .map(name => this.plugins.get(name)!)
      .filter(Boolean)
  }

  /**
   * 按标签获取插件
   * 
   * @param tag - 标签
   * @returns 插件列表
   */
  getByTag(tag: string): PluginMetadata[] {
    const pluginNames = this.tagIndex.get(tag)
    if (!pluginNames) {
      return []
    }

    return Array.from(pluginNames)
      .map(name => this.plugins.get(name)!)
      .filter(Boolean)
  }

  /**
   * 检查版本兼容性
   * 
   * @param name - 插件名称
   * @param version - 期望版本
   * @returns 是否兼容
   */
  checkCompatibility(name: string, version: string): boolean {
    const metadata = this.plugins.get(name)
    if (!metadata) {
      return false
    }

    // 简单的版本比较（实际应用中应使用 semver 库）
    return metadata.version === version
  }

  /**
   * 获取所有分类
   * 
   * @returns 分类列表
   */
  getCategories(): string[] {
    return Array.from(this.categoryIndex.keys())
  }

  /**
   * 获取所有标签
   * 
   * @returns 标签列表
   */
  getTags(): string[] {
    return Array.from(this.tagIndex.keys())
  }

  /**
   * 获取统计信息
   * 
   * @returns 统计信息
   */
  getStats(): {
    totalPlugins: number
    totalCategories: number
    totalTags: number
    topDownloads: PluginMetadata[]
    topRated: PluginMetadata[]
  } {
    const all = this.getAll()

    return {
      totalPlugins: all.length,
      totalCategories: this.categoryIndex.size,
      totalTags: this.tagIndex.size,
      topDownloads: all
        .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
        .slice(0, 10),
      topRated: all
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 10)
    }
  }

  /**
   * 清空注册表
   */
  clear(): void {
    this.plugins.clear()
    this.categoryIndex.clear()
    this.tagIndex.clear()
    this.keywordIndex.clear()
  }

  /**
   * 获取插件数量
   * 
   * @returns 插件数量
   */
  size(): number {
    return this.plugins.size
  }
}

/**
 * 创建插件注册表
 * 
 * @returns 插件注册表实例
 * 
 * @example
 * ```typescript
 * import { createPluginRegistry } from '@ldesign/engine-core'
 * 
 * const registry = createPluginRegistry()
 * ```
 */
export function createPluginRegistry(): PluginRegistry {
  return new PluginRegistry()
}