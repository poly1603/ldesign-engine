/**
 * 安全工具函数集
 * 
 * 提供加密、哈希、Token管理等安全相关功能
 */

/**
 * 简单的XOR加密/解密
 * 
 * 注意：这是简单的混淆，不适合存储敏感数据
 * 仅用于非关键数据的简单保护
 */
export class SimpleEncryption {
  /**
   * XOR加密
   */
  encrypt(text: string, key: string): string {
    if (!text || !key) return text
    
    let result = ''
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      result += String.fromCharCode(charCode)
    }
    
    return btoa(result) // Base64编码
  }

  /**
   * XOR解密
   */
  decrypt(encrypted: string, key: string): string {
    if (!encrypted || !key) return encrypted
    
    try {
      const text = atob(encrypted) // Base64解码
      let result = ''
      
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        result += String.fromCharCode(charCode)
      }
      
      return result
    } catch {
      return encrypted
    }
  }
}

/**
 * 创建简单加密器
 */
export function createSimpleEncryption(): SimpleEncryption {
  return new SimpleEncryption()
}

/**
 * 哈希工具
 * 
 * 提供简单的哈希算法（非加密级别）
 */
export class HashUtils {
  /**
   * 简单的字符串哈希（DJB2算法）
   * 
   * 时间复杂度：O(n)
   * 碰撞率：较低
   */
  hashString(str: string): number {
    let hash = 5381
    
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i) // hash * 33 + c
    }
    
    return hash >>> 0 // 转为无符号32位整数
  }

  /**
   * 对象哈希
   */
  hashObject(obj: any): number {
    return this.hashString(JSON.stringify(obj))
  }

  /**
   * 生成哈希码（16进制字符串）
   */
  hashCode(str: string): string {
    return this.hashString(str).toString(16)
  }

  /**
   * SHA-256哈希（使用Web Crypto API）
   */
  async sha256(text: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * MD5哈希（简单实现，不用于安全）
   */
  simpleMD5(str: string): string {
    // 这是一个简化版本，不是完整的MD5
    // 仅用于非安全场景的快速哈希
    let hash = 0
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    
    return Math.abs(hash).toString(16)
  }
}

/**
 * 创建哈希工具
 */
export function createHashUtils(): HashUtils {
  return new HashUtils()
}

/**
 * Token管理器
 * 
 * 管理访问令牌，支持过期检查和自动刷新
 */
export class TokenManager {
  private token: string | null = null
  private refreshToken: string | null = null
  private expiresAt: number = 0
  private refreshCallback?: () => Promise<{ token: string; refreshToken?: string; expiresIn: number }>

  /**
   * 设置Token
   */
  setToken(token: string, expiresIn: number, refreshToken?: string): void {
    this.token = token
    this.refreshToken = refreshToken || this.refreshToken
    this.expiresAt = Date.now() + expiresIn * 1000
  }

  /**
   * 获取Token
   */
  getToken(): string | null {
    return this.token
  }

  /**
   * 获取刷新Token
   */
  getRefreshToken(): string | null {
    return this.refreshToken
  }

  /**
   * 检查Token是否过期
   */
  isExpired(): boolean {
    if (!this.token) return true
    return Date.now() >= this.expiresAt
  }

  /**
   * 检查Token是否即将过期（5分钟内）
   */
  isExpiringSoon(): boolean {
    if (!this.token) return true
    return Date.now() >= this.expiresAt - 5 * 60 * 1000
  }

  /**
   * 设置刷新回调
   */
  setRefreshCallback(
    callback: () => Promise<{ token: string; refreshToken?: string; expiresIn: number }>
  ): void {
    this.refreshCallback = callback
  }

  /**
   * 刷新Token
   */
  async refresh(): Promise<void> {
    if (!this.refreshCallback) {
      throw new Error('未设置刷新回调')
    }

    const { token, refreshToken, expiresIn } = await this.refreshCallback()
    this.setToken(token, expiresIn, refreshToken)
  }

  /**
   * 获取有效Token（自动刷新）
   */
  async getValidToken(): Promise<string | null> {
    if (!this.token) return null

    if (this.isExpired() || this.isExpiringSoon()) {
      try {
        await this.refresh()
      } catch (error) {
        console.error('Token刷新失败:', error)
        return null
      }
    }

    return this.token
  }

  /**
   * 清除Token
   */
  clear(): void {
    this.token = null
    this.refreshToken = null
    this.expiresAt = 0
  }
}

/**
 * 创建Token管理器
 */
export function createTokenManager(): TokenManager {
  return new TokenManager()
}

/**
 * 权限验证器
 * 
 * 基于角色和权限的访问控制
 */
export class PermissionValidator {
  private permissions = new Set<string>()
  private roles = new Set<string>()
  private rolePermissions = new Map<string, Set<string>>()

  /**
   * 添加权限
   */
  addPermission(permission: string): void {
    this.permissions.add(permission)
  }

  /**
   * 移除权限
   */
  removePermission(permission: string): void {
    this.permissions.delete(permission)
  }

  /**
   * 检查是否有权限
   */
  hasPermission(permission: string): boolean {
    return this.permissions.has(permission)
  }

  /**
   * 添加角色
   */
  addRole(role: string, permissions: string[] = []): void {
    this.roles.add(role)
    
    if (!this.rolePermissions.has(role)) {
      this.rolePermissions.set(role, new Set())
    }
    
    const rolePerms = this.rolePermissions.get(role)!
    permissions.forEach(p => rolePerms.add(p))
  }

  /**
   * 检查是否有角色
   */
  hasRole(role: string): boolean {
    return this.roles.has(role)
  }

  /**
   * 检查角色权限
   */
  hasRolePermission(role: string, permission: string): boolean {
    const rolePerms = this.rolePermissions.get(role)
    return rolePerms ? rolePerms.has(permission) : false
  }

  /**
   * 检查是否有任一权限
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(p => this.hasPermission(p))
  }

  /**
   * 检查是否有所有权限
   */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(p => this.hasPermission(p))
  }

  /**
   * 清空所有权限
   */
  clear(): void {
    this.permissions.clear()
    this.roles.clear()
    this.rolePermissions.clear()
  }
}

/**
 * 创建权限验证器
 */
export function createPermissionValidator(): PermissionValidator {
  return new PermissionValidator()
}

/**
 * 生成随机字符串
 * 
 * @param length 长度
 * @param charset 字符集
 */
export function generateRandomString(
  length: number,
  charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): string {
  let result = ''
  const charsetLength = charset.length
  
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charsetLength))
  }
  
  return result
}

/**
 * 生成UUID v4
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // 降级方案
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * 生成安全的随机数
 */
export function secureRandom(min: number, max: number): number {
  const range = max - min
  const randomBuffer = new Uint32Array(1)
  crypto.getRandomValues(randomBuffer)
  return min + (randomBuffer[0] % range)
}

/**
 * Base64编码（URL安全）
 */
export function base64Encode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Base64解码（URL安全）
 */
export function base64Decode(str: string): string {
  const base64 = str
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  
  const pad = base64.length % 4
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64
  
  return atob(padded)
}

/**
 * 密码强度检查
 */
export function checkPasswordStrength(password: string): {
  score: number  // 0-4
  strength: 'very-weak' | 'weak' | 'medium' | 'strong' | 'very-strong'
  feedback: string[]
} {
  let score = 0
  const feedback: string[] = []

  if (password.length >= 8) {
    score++
  } else {
    feedback.push('密码长度至少8位')
  }

  if (/[a-z]/.test(password)) score++
  else feedback.push('包含小写字母')

  if (/[A-Z]/.test(password)) score++
  else feedback.push('包含大写字母')

  if (/\d/.test(password)) score++
  else feedback.push('包含数字')

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++
  else feedback.push('包含特殊字符')

  const strengths = ['very-weak', 'weak', 'medium', 'strong', 'very-strong'] as const

  return {
    score: Math.min(score, 4),
    strength: strengths[Math.min(score, 4)],
    feedback: score >= 4 ? ['密码强度很好'] : feedback
  }
}

/**
 * 安全的字符串比较（防止时序攻击）
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}


