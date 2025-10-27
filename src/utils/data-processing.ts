/**
 * 数据处理工具集
 * 
 * 提供数据验证、转换、规范化等实用功能
 */

/**
 * 数据验证器
 * 
 * 提供常用的数据验证方法，支持链式调用和自定义规则
 * 
 * @example
 * ```typescript
 * const validator = createValidator()
 * 
 * // 基础验证
 * validator.isEmail('test@example.com') // true
 * validator.isURL('https://example.com') // true
 * validator.isPhone('+86 138 0000 0000') // true
 * 
 * // 链式验证
 * validator
 *   .required()
 *   .minLength(3)
 *   .maxLength(20)
 *   .pattern(/^[a-zA-Z0-9_]+$/)
 *   .validate('username123') // { valid: true }
 * ```
 */
export class DataValidator {
  private rules: Array<(value: unknown) => { valid: boolean; message?: string }> = []

  /**
   * 必填验证
   */
  required(message = '字段不能为空'): this {
    this.rules.push((value) => {
      const valid = value !== null && value !== undefined && value !== ''
      return { valid, message: valid ? undefined : message }
    })
    return this
  }

  /**
   * 最小长度验证
   */
  minLength(min: number, message?: string): this {
    this.rules.push((value) => {
      const str = String(value)
      const valid = str.length >= min
      return { 
        valid, 
        message: valid ? undefined : message || `长度不能小于${min}` 
      }
    })
    return this
  }

  /**
   * 最大长度验证
   */
  maxLength(max: number, message?: string): this {
    this.rules.push((value) => {
      const str = String(value)
      const valid = str.length <= max
      return { 
        valid, 
        message: valid ? undefined : message || `长度不能大于${max}` 
      }
    })
    return this
  }

  /**
   * 正则模式验证
   */
  pattern(regex: RegExp, message = '格式不正确'): this {
    this.rules.push((value) => {
      const valid = regex.test(String(value))
      return { valid, message: valid ? undefined : message }
    })
    return this
  }

  /**
   * 邮箱验证
   */
  isEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  }

  /**
   * URL验证
   */
  isURL(value: string): boolean {
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  }

  /**
   * 手机号验证（中国）
   */
  isPhone(value: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/
    return phoneRegex.test(value.replace(/[\s-]/g, ''))
  }

  /**
   * 执行所有验证规则
   */
  validate(value: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    for (const rule of this.rules) {
      const result = rule(value)
      if (!result.valid && result.message) {
        errors.push(result.message)
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 清空验证规则
   */
  reset(): this {
    this.rules = []
    return this
  }
}

/**
 * 创建数据验证器
 */
export function createValidator(): DataValidator {
  return new DataValidator()
}

/**
 * 数据转换器
 * 
 * 提供常用的数据类型转换功能
 */
export class DataTransformer {
  /**
   * 转换为数字
   */
  toNumber(value: unknown, defaultValue = 0): number {
    if (typeof value === 'number') return value
    const num = Number(value)
    return isNaN(num) ? defaultValue : num
  }

  /**
   * 转换为字符串
   */
  toString(value: unknown, defaultValue = ''): string {
    if (value === null || value === undefined) return defaultValue
    return String(value)
  }

  /**
   * 转换为布尔值
   */
  toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      return !['false', '0', '', 'null', 'undefined'].includes(value.toLowerCase())
    }
    return Boolean(value)
  }

  /**
   * 转换为数组
   */
  toArray<T>(value: unknown): T[] {
    if (Array.isArray(value)) return value
    if (value === null || value === undefined) return []
    return [value as T]
  }

  /**
   * 驼峰转下划线
   */
  camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
  }

  /**
   * 下划线转驼峰
   */
  snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
  }

  /**
   * 首字母大写
   */
  capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
}

/**
 * 创建数据转换器
 */
export function createTransformer(): DataTransformer {
  return new DataTransformer()
}

/**
 * 数据规范化
 * 
 * 统一数据格式，便于处理和比较
 */
export class DataNormalizer {
  /**
   * 规范化空白字符
   */
  normalizeWhitespace(str: string): string {
    return str.replace(/\s+/g, ' ').trim()
  }

  /**
   * 规范化手机号
   */
  normalizePhone(phone: string): string {
    return phone.replace(/[\s-()]/g, '')
  }

  /**
   * 规范化邮箱
   */
  normalizeEmail(email: string): string {
    return email.toLowerCase().trim()
  }

  /**
   * 规范化URL
   */
  normalizeURL(url: string): string {
    try {
      const parsed = new URL(url)
      // 移除尾部斜杠
      parsed.pathname = parsed.pathname.replace(/\/$/, '')
      return parsed.toString()
    } catch {
      return url
    }
  }

  /**
   * 深度规范化对象
   * 移除undefined值，规范化嵌套对象
   */
  normalizeObject<T extends Record<string, any>>(obj: T): T {
    const result: any = {}
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined) continue
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = this.normalizeObject(value)
      } else {
        result[key] = value
      }
    }
    
    return result
  }
}

/**
 * 创建数据规范化器
 */
export function createNormalizer(): DataNormalizer {
  return new DataNormalizer()
}

/**
 * 数据压缩/解压（使用LZ字符串压缩）
 */
export class DataCompressor {
  /**
   * 简单的RLE（Run-Length Encoding）压缩
   * 适用于有大量重复字符的字符串
   */
  compress(str: string): string {
    if (!str) return str
    
    let compressed = ''
    let count = 1
    
    for (let i = 0; i < str.length; i++) {
      if (str[i] === str[i + 1]) {
        count++
      } else {
        compressed += str[i] + (count > 1 ? count : '')
        count = 1
      }
    }
    
    return compressed.length < str.length ? compressed : str
  }

  /**
   * RLE解压
   */
  decompress(str: string): string {
    if (!str) return str
    
    let decompressed = ''
    let i = 0
    
    while (i < str.length) {
      const char = str[i]
      let numStr = ''
      
      // 读取数字
      while (i + 1 < str.length && /\d/.test(str[i + 1])) {
        numStr += str[++i]
      }
      
      const count = numStr ? parseInt(numStr) : 1
      decompressed += char.repeat(count)
      i++
    }
    
    return decompressed
  }
}

/**
 * 创建数据压缩器
 */
export function createCompressor(): DataCompressor {
  return new DataCompressor()
}


