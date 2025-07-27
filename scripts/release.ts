#!/usr/bin/env tsx

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import chalk from 'chalk'
import ora from 'ora'

type ReleaseType = 'patch' | 'minor' | 'major' | 'prerelease'

interface ReleaseOptions {
  type?: ReleaseType
  skipChecks?: boolean
  dryRun?: boolean
  help?: boolean
}

interface PackageInfo {
  name: string
  version: string
  description: string
}

class ReleaseManager {
  private rootDir = process.cwd()
  private packageJsonPath = path.join(this.rootDir, 'package.json')

  // 读取 package.json
  private readPackageJson(): PackageInfo {
    try {
      const content = fs.readFileSync(this.packageJsonPath, 'utf8')
      return JSON.parse(content)
    }
 catch (error) {
      throw new Error(`无法读取 package.json: ${(error as Error).message}`)
    }
  }

  // 写入 package.json
  private writePackageJson(packageInfo: PackageInfo): void {
    try {
      const content = fs.readFileSync(this.packageJsonPath, 'utf8')
      const packageJson = JSON.parse(content)
      packageJson.version = packageInfo.version

      fs.writeFileSync(
        this.packageJsonPath,
        `${JSON.stringify(packageJson, null, 2)}\n`,
      )
    }
 catch (error) {
      throw new Error(`无法写入 package.json: ${(error as Error).message}`)
    }
  }

  // 检查工作区状态
  private checkWorkingDirectory(): boolean {
    try {
      const output = execSync('git status --porcelain', { encoding: 'utf8' })
      return output.trim() === ''
    }
 catch {
      return false
    }
  }

  // 获取当前版本
  private getCurrentVersion(): string {
    const packageInfo = this.readPackageJson()
    return packageInfo.version
  }

  // 计算新版本号
  private calculateNewVersion(currentVersion: string, releaseType: ReleaseType): string {
    const parts = currentVersion.split('.').map(Number)
    const [major, minor, patch] = parts

    switch (releaseType) {
      case 'major':
        return `${major + 1}.0.0`
      case 'minor':
        return `${major}.${minor + 1}.0`
      case 'patch':
        return `${major}.${minor}.${patch + 1}`
      case 'prerelease':
        return `${major}.${minor}.${patch + 1}-beta.0`
      default:
        throw new Error(`不支持的发布类型: ${releaseType}`)
    }
  }

  // 更新版本号
  private updateVersion(newVersion: string): void {
    const packageInfo = this.readPackageJson()
    packageInfo.version = newVersion
    this.writePackageJson(packageInfo)
  }

  // 生成 changelog
  private generateChangelog(currentVersion: string, newVersion: string): void {
    const spinner = ora('📝 生成 CHANGELOG...').start()

    try {
      // 这里可以集成 conventional-changelog 等工具
      // 简化实现，只添加基本的版本信息
      const changelogPath = path.join(this.rootDir, 'CHANGELOG.md')
      const date = new Date().toISOString().split('T')[0]
      const newEntry = `\n## [${newVersion}] - ${date}\n\n### Changed\n- Version bump from ${currentVersion} to ${newVersion}\n`

      if (fs.existsSync(changelogPath)) {
        const content = fs.readFileSync(changelogPath, 'utf8')
        const lines = content.split('\n')
        const insertIndex = lines.findIndex(line => line.startsWith('## [')) || 1
        lines.splice(insertIndex, 0, ...newEntry.split('\n'))
        fs.writeFileSync(changelogPath, lines.join('\n'))
      }
 else {
        const header = `# Changelog\n\nAll notable changes to @ldesign/engine will be documented in this file.\n`
        fs.writeFileSync(changelogPath, header + newEntry)
      }

      spinner.succeed(chalk.green('✅ CHANGELOG 已更新'))
    }
 catch (error) {
      spinner.fail(chalk.red('❌ 生成 CHANGELOG 失败'))
      throw error
    }
  }

  // 运行发布前检查
  private async runPreReleaseChecks(): Promise<boolean> {
    console.log(chalk.blue.bold('🔍 运行发布前检查...\n'))

    const checks = [
      {
        name: 'TypeScript 类型检查',
        command: 'pnpm typecheck',
        spinner: ora('🔍 TypeScript 类型检查...').start(),
      },
      {
        name: 'ESLint 检查',
        command: 'pnpm lint',
        spinner: ora('🔍 ESLint 检查...').start(),
      },
      {
        name: '测试用例',
        command: 'pnpm test:run',
        spinner: ora('🧪 运行测试...').start(),
      },
      {
        name: '项目构建',
        command: 'pnpm build',
        spinner: ora('📦 构建项目...').start(),
      },
      {
        name: '文档构建',
        command: 'pnpm docs:build',
        spinner: ora('📚 构建文档...').start(),
      },
    ]

    for (const check of checks) {
      try {
        execSync(check.command, { stdio: 'ignore' })
        check.spinner.succeed(chalk.green(`✅ ${check.name} 通过`))
      }
 catch {
        check.spinner.fail(chalk.red(`❌ ${check.name} 失败`))
        return false
      }
    }

    console.log(chalk.green.bold('\n✅ 所有发布前检查通过!'))
    return true
  }

  // Git 提交和标签
  private commitAndTag(version: string, dryRun: boolean): void {
    const commitMessage = `chore(release): bump version to ${version}`
    const tagName = `v${version}`

    if (dryRun) {
      console.log(chalk.yellow('🔍 Dry Run - 将执行的 Git 操作:'))
      console.log(chalk.gray(`  git add .`))
      console.log(chalk.gray(`  git commit -m "${commitMessage}"`))
      console.log(chalk.gray(`  git tag ${tagName}`))
      console.log(chalk.gray(`  git push origin main`))
      console.log(chalk.gray(`  git push origin ${tagName}`))
      return
    }

    const spinner = ora('📝 提交更改和创建标签...').start()

    try {
      // 提交更改
      execSync('git add .', { stdio: 'ignore' })
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'ignore' })

      // 创建标签
      execSync(`git tag ${tagName}`, { stdio: 'ignore' })

      spinner.succeed(chalk.green(`✅ 已创建提交和标签 ${tagName}`))
    }
 catch (error) {
      spinner.fail(chalk.red('❌ Git 操作失败'))
      throw error
    }
  }

  // 推送到远程仓库
  private pushToRemote(version: string, dryRun: boolean): void {
    if (dryRun) {
      console.log(chalk.yellow('🔍 Dry Run - 跳过推送到远程仓库'))
      return
    }

    const spinner = ora('⬆️  推送到远程仓库...').start()

    try {
      execSync('git push origin main', { stdio: 'ignore' })
      execSync(`git push origin v${version}`, { stdio: 'ignore' })

      spinner.succeed(chalk.green('✅ 已推送到远程仓库'))
    }
 catch (error) {
      spinner.fail(chalk.red('❌ 推送失败'))
      throw error
    }
  }

  // 发布到 NPM
  private publishToNpm(dryRun: boolean): void {
    if (dryRun) {
      console.log(chalk.yellow('🔍 Dry Run - 跳过发布到 NPM'))
      return
    }

    const spinner = ora('📦 发布到 NPM...').start()

    try {
      execSync('pnpm publish --access public', { stdio: 'ignore' })
      spinner.succeed(chalk.green('✅ 已发布到 NPM'))
    }
 catch (error) {
      spinner.fail(chalk.red('❌ NPM 发布失败'))
      throw error
    }
  }

  // 显示发布信息
  private displayReleaseInfo(currentVersion: string, newVersion: string, releaseType: ReleaseType): void {
    console.log(chalk.blue.bold('📋 发布信息:\n'))
    console.log(chalk.white(`📦 包名: @ldesign/engine`))
    console.log(chalk.white(`🏷️  当前版本: ${currentVersion}`))
    console.log(chalk.white(`🆕 新版本: ${newVersion}`))
    console.log(chalk.white(`📈 发布类型: ${releaseType}`))
    console.log(chalk.white(`📅 发布时间: ${new Date().toLocaleString()}`))
    console.log()
  }

  // 显示帮助信息
  private showHelp(): void {
    console.log(chalk.blue.bold('🚀 @ldesign/engine 发布工具\n'))
    console.log(chalk.yellow('用法:'))
    console.log(chalk.white('  pnpm release:patch       # 发布修复版本 (1.0.0 → 1.0.1)'))
    console.log(chalk.white('  pnpm release:minor       # 发布功能版本 (1.0.0 → 1.1.0)'))
    console.log(chalk.white('  pnpm release:major       # 发布重大版本 (1.0.0 → 2.0.0)'))
    console.log(chalk.white('  pnpm release --type=patch --dry-run  # 预览发布'))
    console.log(chalk.white('  pnpm release --help      # 显示帮助信息'))
    console.log()
    console.log(chalk.yellow('选项:'))
    console.log(chalk.white('  --type=TYPE              # 发布类型: patch, minor, major, prerelease'))
    console.log(chalk.white('  --skip-checks            # 跳过发布前检查'))
    console.log(chalk.white('  --dry-run                # 预览模式，不执行实际操作'))
    console.log()
    console.log(chalk.yellow('发布流程:'))
    console.log(chalk.white('  1. 🔍 检查工作区状态'))
    console.log(chalk.white('  2. 🔍 运行发布前检查'))
    console.log(chalk.white('  3. 📝 更新版本号'))
    console.log(chalk.white('  4. 📝 生成 CHANGELOG'))
    console.log(chalk.white('  5. 📝 Git 提交和标签'))
    console.log(chalk.white('  6. ⬆️  推送到远程仓库'))
    console.log(chalk.white('  7. 📦 发布到 NPM'))
  }

  // 解析命令行参数
  private parseArgs(): ReleaseOptions {
    const args = process.argv.slice(2)
    const options: ReleaseOptions = {}

    args.forEach((arg) => {
      if (arg.startsWith('--type=')) {
        options.type = arg.split('=')[1] as ReleaseType
      }
 else if (arg === '--skip-checks') {
        options.skipChecks = true
      }
 else if (arg === '--dry-run') {
        options.dryRun = true
      }
 else if (arg === '--help' || arg === '-h') {
        options.help = true
      }
    })

    // 从脚本名称推断发布类型
    const scriptName = process.argv[1]
    if (scriptName?.includes('release:patch'))
options.type = 'patch'
    else if (scriptName?.includes('release:minor'))
options.type = 'minor'
    else if (scriptName?.includes('release:major'))
options.type = 'major'
    else if (scriptName?.includes('release:prerelease'))
options.type = 'prerelease'

    return options
  }

  // 运行发布流程
  async run(): Promise<void> {
    const options = this.parseArgs()

    if (options.help) {
      this.showHelp()
      return
    }

    if (!options.type) {
      console.log(chalk.red('❌ 请指定发布类型'))
      console.log(chalk.yellow('💡 使用 --help 查看帮助信息'))
      process.exit(1)
    }

    const releaseType = options.type
    const dryRun = options.dryRun || false

    console.log(chalk.blue.bold(`🚀 开始 @ldesign/engine ${releaseType} 发布流程\n`))

    if (dryRun) {
      console.log(chalk.yellow('🔍 预览模式 - 不会执行实际操作\n'))
    }

    try {
      // 1. 检查工作区状态
      if (!this.checkWorkingDirectory()) {
        console.log(chalk.red('❌ 工作区有未提交的更改，请先提交或暂存'))
        process.exit(1)
      }

      // 2. 获取版本信息
      const currentVersion = this.getCurrentVersion()
      const newVersion = this.calculateNewVersion(currentVersion, releaseType)

      this.displayReleaseInfo(currentVersion, newVersion, releaseType)

      // 3. 运行发布前检查
      if (!options.skipChecks) {
        const checksPass = await this.runPreReleaseChecks()
        if (!checksPass) {
          console.log(chalk.red('\n❌ 发布前检查失败，请修复后重试'))
          process.exit(1)
        }
      }
 else {
        console.log(chalk.yellow('⚠️  跳过发布前检查'))
      }

      // 4. 更新版本号
      if (!dryRun) {
        this.updateVersion(newVersion)
        console.log(chalk.green(`✅ 版本号已更新: ${currentVersion} → ${newVersion}`))
      }
 else {
        console.log(chalk.yellow(`🔍 Dry Run - 版本号将更新: ${currentVersion} → ${newVersion}`))
      }

      // 5. 生成 CHANGELOG
      if (!dryRun) {
        this.generateChangelog(currentVersion, newVersion)
      }
 else {
        console.log(chalk.yellow('🔍 Dry Run - 跳过生成 CHANGELOG'))
      }

      // 6. Git 操作
      this.commitAndTag(newVersion, dryRun)
      this.pushToRemote(newVersion, dryRun)

      // 7. 发布到 NPM
      this.publishToNpm(dryRun)

      console.log(chalk.green.bold('\n🎉 发布完成!'))

      if (!dryRun) {
        console.log(chalk.white(`📦 @ldesign/engine@${newVersion} 已成功发布`))
        console.log(chalk.white(`🔗 NPM: https://www.npmjs.com/package/@ldesign/engine`))
        console.log(chalk.white(`🏷️  Git Tag: v${newVersion}`))
      }
    }
 catch (error) {
      console.error(chalk.red('❌ 发布过程中发生错误:'), error)
      process.exit(1)
    }
  }
}

// 运行发布流程
if (import.meta.url.includes('release.ts') || process.argv[1]?.includes('release.ts')) {
  const releaseManager = new ReleaseManager()
  releaseManager.run().catch(console.error)
}

export { ReleaseManager }
