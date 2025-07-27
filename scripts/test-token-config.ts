#!/usr/bin/env tsx

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import chalk from 'chalk'

// 键盘按键常量
const KEYS = {
  UP: '\u001B[A',
  DOWN: '\u001B[B',
  ENTER: '\r',
  ESC: '\u001B[1b',
  CTRL_C: '\u0003',
  BACKSPACE: '\u007F',
  TAB: '\t',
}

interface TokenInfo {
  name: string
  envKey: string
  description: string
  icon: string
  category: string
  required: boolean
  getUrl: string
  instructions: string[]
  validationPattern?: RegExp
  validationMessage?: string
  isConfigured: boolean
  value?: string
}

const TOKEN_CONFIGS: TokenInfo[] = [
  {
    name: 'NPM Token',
    envKey: 'NPM_TOKEN',
    description: '用于发布包到 NPM 注册表的访问令牌',
    icon: '📦',
    category: 'NPM',
    required: true,
    getUrl: 'https://www.npmjs.com/settings/tokens',
    instructions: [
      '1. 访问 https://www.npmjs.com/settings/tokens',
      '2. 点击 "Generate New Token"',
      '3. 选择 "Automation" 类型',
      '4. 设置适当的权限范围',
      '5. 复制生成的 Token',
    ],
    validationPattern: /^npm_[A-Za-z0-9]{36}$/,
    validationMessage: 'NPM Token 应该以 "npm_" 开头，后跟 36 位字符',
    isConfigured: false,
  },
  {
    name: 'GitHub Token',
    envKey: 'GITHUB_TOKEN',
    description: '用于 GitHub Actions 和 API 访问的个人访问令牌',
    icon: '🐙',
    category: 'GitHub',
    required: true,
    getUrl: 'https://github.com/settings/tokens',
    instructions: [
      '1. 访问 https://github.com/settings/tokens',
      '2. 点击 "Generate new token (classic)"',
      '3. 设置 Token 名称和过期时间',
      '4. 选择权限：repo, workflow, write:packages',
      '5. 点击 "Generate token"',
      '6. 复制生成的 Token（只显示一次）',
    ],
    validationPattern: /^gh[ps]_[A-Za-z0-9]{36,255}$/,
    validationMessage: 'GitHub Token 应该以 "ghp_" 或 "ghs_" 开头',
    isConfigured: false,
  },
  {
    name: 'CodeCov Token',
    envKey: 'CODECOV_TOKEN',
    description: '用于上传测试覆盖率报告到 CodeCov',
    icon: '📊',
    category: '测试覆盖率',
    required: false,
    getUrl: 'https://codecov.io/',
    instructions: [
      '1. 访问 https://codecov.io/ 并登录',
      '2. 添加你的 GitHub 仓库',
      '3. 在仓库设置中找到 "Repository Upload Token"',
      '4. 复制 Upload Token',
    ],
    validationPattern: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
    validationMessage: 'CodeCov Token 应该是 UUID 格式',
    isConfigured: false,
  },
  {
    name: 'Snyk Token',
    envKey: 'SNYK_TOKEN',
    description: '用于安全漏洞扫描的 Snyk 认证令牌',
    icon: '🔒',
    category: '安全',
    required: false,
    getUrl: 'https://app.snyk.io/account',
    instructions: [
      '1. 访问 https://app.snyk.io/account',
      '2. 在 "General Account Settings" 中找到 Auth Token',
      '3. 点击 "Show" 显示 Token',
      '4. 复制 Token',
    ],
    validationPattern: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
    validationMessage: 'Snyk Token 应该是 UUID 格式',
    isConfigured: false,
  },
  {
    name: 'Netlify Token',
    envKey: 'NETLIFY_AUTH_TOKEN',
    description: '用于部署到 Netlify 的个人访问令牌',
    icon: '🌐',
    category: '部署',
    required: false,
    getUrl: 'https://app.netlify.com/user/applications',
    instructions: [
      '1. 访问 https://app.netlify.com/user/applications',
      '2. 在 "Personal access tokens" 部分',
      '3. 点击 "New access token"',
      '4. 输入描述并生成 Token',
      '5. 复制生成的 Token',
    ],
    isConfigured: false,
  },
  {
    name: 'Vercel Token',
    envKey: 'VERCEL_TOKEN',
    description: '用于部署到 Vercel 的访问令牌',
    icon: '▲',
    category: '部署',
    required: false,
    getUrl: 'https://vercel.com/account/tokens',
    instructions: [
      '1. 访问 https://vercel.com/account/tokens',
      '2. 点击 "Create Token"',
      '3. 输入 Token 名称和过期时间',
      '4. 选择适当的权限范围',
      '5. 复制生成的 Token',
    ],
    isConfigured: false,
  },
]

class TokenConfigManager {
  private selectedIndex = 0
  private selectedCategory = '全部'
  private isRunning = true
  private envFilePath = join(process.cwd(), '.env.local')
  private categories = ['全部', ...new Set(TOKEN_CONFIGS.map(token => token.category))]
  private categoryIndex = 0

  constructor() {
    // 设置原始模式以捕获键盘事件
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(true)
    }
    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    // 检查现有配置
    this.checkExistingConfigs()
  }

  private checkExistingConfigs(): void {
    TOKEN_CONFIGS.forEach((config) => {
      // 检查环境变量
      const envValue = process.env[config.envKey]
      if (envValue) {
        config.isConfigured = true
        config.value = envValue
        return
      }

      // 检查 .env.local 文件
      if (existsSync(this.envFilePath)) {
        const envContent = readFileSync(this.envFilePath, 'utf-8')
        const match = envContent.match(new RegExp(`^${config.envKey}=(.+)$`, 'm'))
        if (match) {
          config.isConfigured = true
          config.value = match[1]
        }
      }
    })
  }

  private getFilteredTokens(): TokenInfo[] {
    if (this.selectedCategory === '全部') {
      return TOKEN_CONFIGS
    }
    return TOKEN_CONFIGS.filter(token => token.category === this.selectedCategory)
  }

  private waitForKeyPress(): Promise<string> {
    return new Promise((resolve) => {
      const onKeyPress = (key: string) => {
        process.stdin.off('data', onKeyPress)
        resolve(key)
      }
      process.stdin.on('data', onKeyPress)
    })
  }

  private waitForInput(): Promise<string> {
    return new Promise((resolve) => {
      // 临时恢复正常模式以接收输入
      if (process.stdin.setRawMode) {
        process.stdin.setRawMode(false)
      }

      let input = ''
      const onData = (chunk: string) => {
        if (chunk === '\n' || chunk === '\r') {
          process.stdin.off('data', onData)
          // 重新设置原始模式
          if (process.stdin.setRawMode) {
            process.stdin.setRawMode(true)
          }
          resolve(input.trim())
        }
 else if (chunk === KEYS.BACKSPACE) {
          if (input.length > 0) {
            input = input.slice(0, -1)
            process.stdout.write('\b \b')
          }
        }
 else if (chunk >= ' ' && chunk <= '~') {
          input += chunk
          process.stdout.write('*') // 隐藏实际输入
        }
      }

      process.stdin.on('data', onData)
    })
  }

  private displayMainMenu(): void {
    console.clear()

    console.log(chalk.magenta.bold('🔐 @ldesign/engine Token 配置管理器'))
    console.log(chalk.gray('安全地管理项目所需的各种 API Token\n'))

    // 显示统计信息
    const totalTokens = TOKEN_CONFIGS.length
    const configuredTokens = TOKEN_CONFIGS.filter(token => token.isConfigured).length
    const requiredTokens = TOKEN_CONFIGS.filter(token => token.required).length
    const requiredConfigured = TOKEN_CONFIGS.filter(token => token.required && token.isConfigured).length

    console.log(chalk.yellow.bold('📊 配置状态:'))
    console.log(chalk.white(`  总计: ${configuredTokens}/${totalTokens} 已配置`))
    console.log(chalk.white(`  必需: ${requiredConfigured}/${requiredTokens} 已配置`))

    if (requiredConfigured === requiredTokens) {
      console.log(chalk.green('  ✅ 所有必需 Token 已配置'))
    }
 else {
      console.log(chalk.red('  ❌ 还有必需 Token 未配置'))
    }
    console.log()

    // 显示分类选择
    console.log(chalk.blue.bold('📂 选择类别:'))
    this.categories.forEach((category, index) => {
      const categoryTokens = category === '全部'
        ? TOKEN_CONFIGS
        : TOKEN_CONFIGS.filter(token => token.category === category)
      const configuredCount = categoryTokens.filter(token => token.isConfigured).length

      if (category === this.selectedCategory) {
        console.log(chalk.bgBlue.white(`❯ ${category} (${configuredCount}/${categoryTokens.length})`))
      }
 else {
        console.log(chalk.gray(`  ${category} (${configuredCount}/${categoryTokens.length})`))
      }
    })
    console.log()

    // 显示当前分类的 Token
    const filteredTokens = this.getFilteredTokens()
    console.log(chalk.blue.bold(`🔑 ${this.selectedCategory} Token:`))

    if (filteredTokens.length === 0) {
      console.log(chalk.gray('  暂无 Token'))
    }
 else {
      filteredTokens.forEach((token, index) => {
        const isSelected = index === this.selectedIndex
        const statusIcon = token.isConfigured ? chalk.green('✅') : chalk.red('❌')
        const requiredIcon = token.required ? chalk.yellow('⭐') : ''
        const maskedValue = token.value ? this.maskToken(token.value) : ''

        if (isSelected) {
          console.log(chalk.bgGreen.black(`❯ ${token.icon} ${token.name} ${statusIcon}${requiredIcon}`))
          console.log(chalk.bgGreen.black(`  ${token.description}`))
          if (token.isConfigured) {
            console.log(chalk.bgGreen.black(`  值: ${maskedValue}`))
          }
        }
 else {
          console.log(chalk.gray(`  ${token.icon} ${token.name} ${statusIcon}${requiredIcon}`))
          console.log(chalk.gray(`  ${token.description}`))
          if (token.isConfigured) {
            console.log(chalk.gray(`  值: ${maskedValue}`))
          }
        }
        console.log()
      })
    }

    console.log(chalk.gray('操作说明:'))
    console.log(chalk.gray('  Tab - 切换类别'))
    console.log(chalk.gray('  ↑↓ - 选择 Token'))
    console.log(chalk.gray('  Enter - 配置 Token'))
    console.log(chalk.gray('  Ctrl+C - 退出'))
  }

  private maskToken(token: string): string {
    if (token.length <= 8) {
      return '*'.repeat(token.length)
    }
    return token.substring(0, 4) + '*'.repeat(Math.min(token.length - 8, 20)) + token.substring(token.length - 4)
  }

  private displayTokenConfig(token: TokenInfo): void {
    console.clear()

    console.log(chalk.blue.bold(`🔧 配置 ${token.name}\n`))

    console.log(chalk.white(`${token.icon} ${token.name}`))
    console.log(chalk.white(`📝 描述: ${token.description}`))
    console.log(chalk.white(`🔗 获取地址: ${token.getUrl}`))
    console.log(chalk.white(`⚙️  环境变量: ${token.envKey}`))

    if (token.required) {
      console.log(chalk.yellow('⭐ 此 Token 为必需配置'))
    }
    console.log()

    console.log(chalk.yellow.bold('📋 获取步骤:'))
    token.instructions.forEach((instruction, index) => {
      console.log(chalk.white(`   ${instruction}`))
    })
    console.log()

    if (token.validationPattern) {
      console.log(chalk.cyan.bold('ℹ️  格式要求:'))
      console.log(chalk.white(`   ${token.validationMessage}`))
      console.log()
    }

    if (token.isConfigured) {
      console.log(chalk.green.bold('✅ 当前状态: 已配置'))
      console.log(chalk.gray(`   Token: ${this.maskToken(token.value!)}`))
      console.log()
      console.log(chalk.yellow('选择操作:'))
      console.log(chalk.white('  1. 重新配置 Token'))
      console.log(chalk.white('  2. 删除配置'))
      console.log(chalk.white('  3. 测试 Token'))
      console.log(chalk.white('  4. 返回主菜单'))
    }
 else {
      console.log(chalk.red.bold('❌ 当前状态: 未配置'))
      console.log()
      console.log(chalk.yellow('选择操作:'))
      console.log(chalk.white('  1. 配置 Token'))
      console.log(chalk.white('  2. 返回主菜单'))
    }
  }

  private validateToken(token: TokenInfo, value: string): boolean {
    if (!token.validationPattern) {
      return true
    }
    return token.validationPattern.test(value)
  }

  private async configureToken(token: TokenInfo): Promise<void> {
    console.clear()
    console.log(chalk.blue.bold(`🔧 配置 ${token.name}\n`))

    if (token.validationPattern) {
      console.log(chalk.cyan(`格式要求: ${token.validationMessage}`))
      console.log()
    }

    console.log(chalk.yellow('请输入 Token (输入将被隐藏):'))

    const tokenValue = await this.waitForInput()

    if (!tokenValue.trim()) {
      console.log(chalk.red('\n❌ Token 不能为空'))
      console.log(chalk.gray('按任意键继续...'))
      await this.waitForKeyPress()
      return
    }

    // 验证 Token 格式
    if (!this.validateToken(token, tokenValue.trim())) {
      console.log(chalk.red('\n❌ Token 格式不正确'))
      console.log(chalk.yellow(`期望格式: ${token.validationMessage}`))
      console.log(chalk.gray('按任意键继续...'))
      await this.waitForKeyPress()
      return
    }

    // 保存到 .env.local 文件
    this.saveTokenToEnvFile(token.envKey, tokenValue.trim())

    token.isConfigured = true
    token.value = tokenValue.trim()

    console.log(chalk.green('\n✅ Token 配置成功!'))
    console.log(chalk.gray('按任意键继续...'))
    await this.waitForKeyPress()
  }

  private saveTokenToEnvFile(envKey: string, token: string): void {
    let envContent = ''

    if (existsSync(this.envFilePath)) {
      envContent = readFileSync(this.envFilePath, 'utf-8')
    }

    const lines = envContent.split('\n')
    const existingIndex = lines.findIndex(line => line.startsWith(`${envKey}=`))

    if (existingIndex >= 0) {
      lines[existingIndex] = `${envKey}=${token}`
    }
 else {
      lines.push(`${envKey}=${token}`)
    }

    writeFileSync(this.envFilePath, `${lines.filter(line => line.trim()).join('\n')}\n`)
  }

  private removeTokenFromEnvFile(envKey: string): void {
    if (!existsSync(this.envFilePath)) {
      return
    }

    const envContent = readFileSync(this.envFilePath, 'utf-8')
    const lines = envContent.split('\n')
    const filteredLines = lines.filter(line => !line.startsWith(`${envKey}=`))

    writeFileSync(this.envFilePath, `${filteredLines.filter(line => line.trim()).join('\n')}\n`)
  }

  private async removeToken(token: TokenInfo): Promise<void> {
    console.clear()
    console.log(chalk.red.bold(`🗑️  删除 ${token.name} 配置\n`))
    console.log(chalk.yellow('确认删除配置? (y/N)'))

    const confirmation = await this.waitForKeyPress()

    if (confirmation.toLowerCase() === 'y') {
      this.removeTokenFromEnvFile(token.envKey)
      token.isConfigured = false
      token.value = undefined

      console.log(chalk.green('\n✅ 配置已删除'))
    }
 else {
      console.log(chalk.gray('\n取消删除'))
    }

    console.log(chalk.gray('按任意键继续...'))
    await this.waitForKeyPress()
  }

  private async testToken(token: TokenInfo): Promise<void> {
    console.clear()
    console.log(chalk.blue.bold(`🧪 测试 ${token.name}\n`))

    console.log(chalk.yellow('Token 测试功能开发中...'))
    console.log(chalk.gray('将来会添加实际的 API 测试功能'))
    console.log()
    console.log(chalk.gray('按任意键继续...'))
    await this.waitForKeyPress()
  }

  private async handleTokenConfig(token: TokenInfo): Promise<void> {
    while (true) {
      this.displayTokenConfig(token)
      const key = await this.waitForKeyPress()

      if (key === KEYS.CTRL_C || key === KEYS.ESC) {
        break
      }

      if (token.isConfigured) {
        switch (key) {
          case '1':
            await this.configureToken(token)
            break
          case '2':
            await this.removeToken(token)
            break
          case '3':
            await this.testToken(token)
            break
          case '4':
            return
        }
      }
 else {
        switch (key) {
          case '1':
            await this.configureToken(token)
            break
          case '2':
            return
        }
      }
    }
  }

  async run(): Promise<void> {
    try {
      while (this.isRunning) {
        this.displayMainMenu()
        const key = await this.waitForKeyPress()

        if (key === KEYS.CTRL_C) {
          this.isRunning = false
          break
        }

        if (key === KEYS.TAB) {
          // 切换分类
          this.categoryIndex = (this.categoryIndex + 1) % this.categories.length
          this.selectedCategory = this.categories[this.categoryIndex]
          this.selectedIndex = 0
          continue
        }

        const filteredTokens = this.getFilteredTokens()

        if (key === KEYS.UP) {
          this.selectedIndex = Math.max(0, this.selectedIndex - 1)
          continue
        }

        if (key === KEYS.DOWN) {
          this.selectedIndex = Math.min(filteredTokens.length - 1, this.selectedIndex + 1)
          continue
        }

        if (key === KEYS.ENTER && filteredTokens.length > 0) {
          const selectedToken = filteredTokens[this.selectedIndex]
          await this.handleTokenConfig(selectedToken)
        }
      }
    }
 finally {
      // 恢复终端设置
      if (process.stdin.setRawMode) {
        process.stdin.setRawMode(false)
      }
      process.stdin.pause()
    }

    console.clear()
    console.log(chalk.green.bold('🎉 感谢使用 @ldesign/engine Token 配置管理器!'))
    console.log(chalk.gray('所有配置已安全保存到 .env.local 文件'))
  }
}

// 运行 Token 配置管理器
if (import.meta.url.includes('test-token-config.ts') || process.argv[1]?.includes('test-token-config.ts')) {
  const tokenManager = new TokenConfigManager()
  tokenManager.run().catch(console.error)
}

export { TokenConfigManager }
