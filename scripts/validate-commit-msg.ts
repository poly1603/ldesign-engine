#!/usr/bin/env tsx

import { readFileSync } from 'node:fs'
import chalk from 'chalk'

// Conventional Commits 规范的类型
const COMMIT_TYPES = [
  'feat', // 新功能
  'fix', // 修复 bug
  'docs', // 文档变更
  'style', // 代码格式（不影响代码运行的变动）
  'refactor', // 重构（既不是新增功能，也不是修改 bug 的代码变动）
  'perf', // 性能优化
  'test', // 增加测试
  'chore', // 构建过程或辅助工具的变动
  'ci', // CI 配置文件和脚本的变动
  'build', // 影响构建系统或外部依赖的变动
  'revert', // 回滚之前的提交
] as const

// 常见的作用域
const COMMON_SCOPES = [
  'core', // 核心功能
  'engine', // 引擎相关
  'plugin', // 插件系统
  'middleware', // 中间件
  'state', // 状态管理
  'event', // 事件系统
  'utils', // 工具函数
  'types', // 类型定义
  'config', // 配置相关
  'build', // 构建相关
  'deps', // 依赖相关
  'release', // 发布相关
  'docs', // 文档相关
  'test', // 测试相关
  'ci', // CI/CD 相关
  'scripts', // 脚本相关
] as const

interface CommitValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
  parsedCommit?: {
    type: string
    scope?: string
    breaking: boolean
    description: string
    body?: string
    footer?: string
  }
}

class CommitMessageValidator {
  private commitMessage: string

  constructor(commitMessage: string) {
    this.commitMessage = commitMessage.trim()
  }

  validate(): CommitValidationResult {
    const result: CommitValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    }

    if (!this.commitMessage) {
      result.isValid = false
      result.errors.push('提交信息不能为空')
      return result
    }

    // 解析提交信息
    const parsed = this.parseCommitMessage()
    if (!parsed) {
      result.isValid = false
      result.errors.push('提交信息格式不正确')
      result.suggestions.push('请使用 Conventional Commits 格式: type(scope): description')
      result.suggestions.push('示例: feat(engine): add new plugin system')
      return result
    }

    result.parsedCommit = parsed

    // 验证类型
    this.validateType(parsed.type, result)

    // 验证作用域
    this.validateScope(parsed.scope, result)

    // 验证描述
    this.validateDescription(parsed.description, result)

    // 验证整体长度
    this.validateLength(result)

    // 验证格式细节
    this.validateFormat(result)

    return result
  }

  private parseCommitMessage() {
    // 匹配 Conventional Commits 格式
    // type(scope): description
    // type: description
    // type(scope)!: description (breaking change)
    // type!: description (breaking change)
    const conventionalPattern = /^(\w+)(\(([^)]+)\))?(!)?: (.+)$/
    const match = this.commitMessage.match(conventionalPattern)

    if (!match) {
      return null
    }

    const [, type, , scope, breaking, description] = match
    const lines = this.commitMessage.split('\n')
    const body = lines.slice(1).join('\n').trim()

    return {
      type: type.toLowerCase(),
      scope: scope?.toLowerCase(),
      breaking: !!breaking,
      description: description.trim(),
      body: body || undefined,
    }
  }

  private validateType(type: string, result: CommitValidationResult): void {
    if (!COMMIT_TYPES.includes(type as any)) {
      result.errors.push(`无效的提交类型: "${type}"`)
      result.suggestions.push(`有效的类型: ${COMMIT_TYPES.join(', ')}`)
      result.isValid = false
    }
  }

  private validateScope(scope: string | undefined, result: CommitValidationResult): void {
    if (scope) {
      // 检查作用域格式
      if (!/^[a-z0-9-]+$/.test(scope)) {
        result.errors.push(`作用域格式不正确: "${scope}"`)
        result.suggestions.push('作用域应该只包含小写字母、数字和连字符')
        result.isValid = false
      }

      // 建议常见作用域
      if (!COMMON_SCOPES.includes(scope as any)) {
        result.warnings.push(`不常见的作用域: "${scope}"`)
        result.suggestions.push(`常见作用域: ${COMMON_SCOPES.join(', ')}`)
      }
    }
  }

  private validateDescription(description: string, result: CommitValidationResult): void {
    // 检查描述长度
    if (description.length < 10) {
      result.warnings.push('描述过短，建议至少 10 个字符')
    }

    if (description.length > 72) {
      result.errors.push('描述过长，不应超过 72 个字符')
      result.isValid = false
    }

    // 检查描述格式
    if (description[0] !== description[0].toLowerCase()) {
      result.warnings.push('描述应该以小写字母开头')
    }

    if (description.endsWith('.')) {
      result.warnings.push('描述不应该以句号结尾')
    }

    // 检查是否使用了动词开头
    const verbPattern = /^(add|remove|fix|update|refactor|improve|implement|create|delete|modify|change|enhance)/i
    if (!verbPattern.test(description)) {
      result.suggestions.push('建议使用动词开头，如: add, fix, update, refactor 等')
    }
  }

  private validateLength(result: CommitValidationResult): void {
    const firstLine = this.commitMessage.split('\n')[0]

    if (firstLine.length > 100) {
      result.errors.push('提交信息首行过长，不应超过 100 个字符')
      result.isValid = false
    }

    if (firstLine.length > 72) {
      result.warnings.push('提交信息首行较长，建议不超过 72 个字符')
    }
  }

  private validateFormat(result: CommitValidationResult): void {
    const lines = this.commitMessage.split('\n')

    // 检查是否有空行分隔
    if (lines.length > 1 && lines[1] !== '') {
      result.warnings.push('建议在标题和正文之间添加空行')
    }

    // 检查正文行长度
    for (let i = 2; i < lines.length; i++) {
      if (lines[i].length > 72) {
        result.warnings.push(`正文第 ${i - 1} 行过长，建议不超过 72 个字符`)
      }
    }
  }

  static validateCommitFile(filePath: string): CommitValidationResult {
    try {
      const commitMessage = readFileSync(filePath, 'utf-8')
      const validator = new CommitMessageValidator(commitMessage)
      return validator.validate()
    }
 catch (error) {
      return {
        isValid: false,
        errors: [`无法读取提交信息文件: ${error}`],
        warnings: [],
        suggestions: [],
      }
    }
  }

  static displayValidationResult(result: CommitValidationResult): void {
    console.log(chalk.blue.bold('📝 提交信息验证结果\n'))

    if (result.parsedCommit) {
      console.log(chalk.cyan.bold('解析结果:'))
      console.log(chalk.white(`  类型: ${result.parsedCommit.type}`))
      if (result.parsedCommit.scope) {
        console.log(chalk.white(`  作用域: ${result.parsedCommit.scope}`))
      }
      if (result.parsedCommit.breaking) {
        console.log(chalk.red(`  破坏性变更: 是`))
      }
      console.log(chalk.white(`  描述: ${result.parsedCommit.description}`))
      console.log()
    }

    // 显示错误
    if (result.errors.length > 0) {
      console.log(chalk.red.bold('❌ 错误:'))
      result.errors.forEach((error) => {
        console.log(chalk.red(`  • ${error}`))
      })
      console.log()
    }

    // 显示警告
    if (result.warnings.length > 0) {
      console.log(chalk.yellow.bold('⚠️  警告:'))
      result.warnings.forEach((warning) => {
        console.log(chalk.yellow(`  • ${warning}`))
      })
      console.log()
    }

    // 显示建议
    if (result.suggestions.length > 0) {
      console.log(chalk.blue.bold('💡 建议:'))
      result.suggestions.forEach((suggestion) => {
        console.log(chalk.blue(`  • ${suggestion}`))
      })
      console.log()
    }

    // 显示最终结果
    if (result.isValid) {
      console.log(chalk.green.bold('✅ 提交信息格式正确!'))
    }
 else {
      console.log(chalk.red.bold('❌ 提交信息格式不正确，请修改后重试'))
    }

    console.log()
    console.log(chalk.gray.bold('📖 Conventional Commits 格式说明:'))
    console.log(chalk.gray('  格式: type(scope): description'))
    console.log(chalk.gray('  示例: feat(engine): add new plugin system'))
    console.log(chalk.gray('  破坏性变更: feat(engine)!: remove deprecated API'))
    console.log()
    console.log(chalk.gray.bold('🏷️  常用类型:'))
    console.log(chalk.gray(`  ${COMMIT_TYPES.slice(0, 6).join(', ')}`))
    console.log(chalk.gray(`  ${COMMIT_TYPES.slice(6).join(', ')}`))
    console.log()
  }

  static generateExamples(): void {
    console.log(chalk.green.bold('✨ 提交信息示例:\n'))

    const examples = [
      {
        type: 'feat',
        scope: 'engine',
        description: 'add plugin hot-reload support',
        explanation: '新增功能：引擎支持插件热重载',
      },
      {
        type: 'fix',
        scope: 'state',
        description: 'resolve memory leak in state manager',
        explanation: '修复：状态管理器内存泄漏问题',
      },
      {
        type: 'docs',
        scope: 'api',
        description: 'update plugin development guide',
        explanation: '文档：更新插件开发指南',
      },
      {
        type: 'refactor',
        scope: 'core',
        description: 'simplify event handling logic',
        explanation: '重构：简化事件处理逻辑',
      },
      {
        type: 'perf',
        scope: 'middleware',
        description: 'optimize middleware execution order',
        explanation: '性能：优化中间件执行顺序',
      },
      {
        type: 'test',
        scope: 'utils',
        description: 'add unit tests for helper functions',
        explanation: '测试：为工具函数添加单元测试',
      },
    ]

    examples.forEach((example, index) => {
      const commitMsg = `${example.type}(${example.scope}): ${example.description}`
      console.log(chalk.cyan(`${index + 1}. ${commitMsg}`))
      console.log(chalk.gray(`   ${example.explanation}`))
      console.log()
    })

    console.log(chalk.yellow.bold('🚨 破坏性变更示例:'))
    console.log(chalk.red('feat(engine)!: remove deprecated plugin API'))
    console.log(chalk.gray('   感叹号表示这是一个破坏性变更'))
    console.log()
  }
}

// 命令行使用
function main() {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    console.log(chalk.blue.bold('📝 @ldesign/engine 提交信息验证工具\n'))
    console.log(chalk.white('用法:'))
    console.log(chalk.gray('  tsx scripts/validate-commit-msg.ts [选项] [提交信息文件]'))
    console.log()
    console.log(chalk.white('选项:'))
    console.log(chalk.gray('  --help, -h     显示帮助信息'))
    console.log(chalk.gray('  --examples, -e 显示提交信息示例'))
    console.log(chalk.gray('  --message, -m  直接验证提交信息'))
    console.log()
    console.log(chalk.white('示例:'))
    console.log(chalk.gray('  tsx scripts/validate-commit-msg.ts .git/COMMIT_EDITMSG'))
    console.log(chalk.gray('  tsx scripts/validate-commit-msg.ts -m "feat(engine): add new feature"'))
    console.log(chalk.gray('  tsx scripts/validate-commit-msg.ts --examples'))
    return
  }

  if (args.includes('--examples') || args.includes('-e')) {
    CommitMessageValidator.generateExamples()
    return
  }

  const messageIndex = args.findIndex(arg => arg === '--message' || arg === '-m')
  if (messageIndex !== -1 && args[messageIndex + 1]) {
    const message = args[messageIndex + 1]
    const validator = new CommitMessageValidator(message)
    const result = validator.validate()
    CommitMessageValidator.displayValidationResult(result)
    process.exit(result.isValid ? 0 : 1)
    return
  }

  // 验证提交信息文件
  const filePath = args[0] || '.git/COMMIT_EDITMSG'
  const result = CommitMessageValidator.validateCommitFile(filePath)
  CommitMessageValidator.displayValidationResult(result)
  process.exit(result.isValid ? 0 : 1)
}

// 如果直接运行此脚本
if (import.meta.url.includes('validate-commit-msg.ts') || process.argv[1]?.includes('validate-commit-msg.ts')) {
  main()
}

export { CommitMessageValidator }
