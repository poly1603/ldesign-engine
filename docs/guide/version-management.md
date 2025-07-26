# 版本管理

本章将详细介绍 @ldesign/engine 项目的版本管理策略，包括语义化版本控制、发布流程、变更日志管理和向后兼容性处理。

## 语义化版本控制

@ldesign/engine 遵循 [语义化版本控制 2.0.0](https://semver.org/lang/zh-CN/) 规范。

### 版本号格式

```
主版本号.次版本号.修订号 (MAJOR.MINOR.PATCH)
```

- **主版本号 (MAJOR)**：当你做了不兼容的 API 修改
- **次版本号 (MINOR)**：当你做了向下兼容的功能性新增
- **修订号 (PATCH)**：当你做了向下兼容的问题修正

### 版本号示例

```typescript
// 版本号解析工具
interface VersionInfo {
  major: number
  minor: number
  patch: number
  prerelease?: string
  build?: string
}

class VersionManager {
  static parseVersion(version: string): VersionInfo {
    const regex = /^(\d+)\.(\d+)\.(\d+)(?:-(\w+(?:\.\d+)?))?(?:\+(\w+))?$/
    const match = version.match(regex)
    
    if (!match) {
      throw new Error(`Invalid version format: ${version}`)
    }
    
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4],
      build: match[5]
    }
  }
  
  static compareVersions(v1: string, v2: string): number {
    const version1 = this.parseVersion(v1)
    const version2 = this.parseVersion(v2)
    
    // 比较主版本号
    if (version1.major !== version2.major) {
      return version1.major - version2.major
    }
    
    // 比较次版本号
    if (version1.minor !== version2.minor) {
      return version1.minor - version2.minor
    }
    
    // 比较修订号
    if (version1.patch !== version2.patch) {
      return version1.patch - version2.patch
    }
    
    // 比较预发布版本
    if (version1.prerelease && !version2.prerelease) return -1
    if (!version1.prerelease && version2.prerelease) return 1
    if (version1.prerelease && version2.prerelease) {
      return version1.prerelease.localeCompare(version2.prerelease)
    }
    
    return 0
  }
  
  static isCompatible(currentVersion: string, requiredVersion: string): boolean {
    const current = this.parseVersion(currentVersion)
    const required = this.parseVersion(requiredVersion)
    
    // 主版本号必须相同
    if (current.major !== required.major) {
      return false
    }
    
    // 当前版本必须大于等于要求版本
    return this.compareVersions(currentVersion, requiredVersion) >= 0
  }
  
  static getNextVersion(currentVersion: string, type: 'major' | 'minor' | 'patch'): string {
    const version = this.parseVersion(currentVersion)
    
    switch (type) {
      case 'major':
        return `${version.major + 1}.0.0`
      case 'minor':
        return `${version.major}.${version.minor + 1}.0`
      case 'patch':
        return `${version.major}.${version.minor}.${version.patch + 1}`
      default:
        throw new Error(`Invalid version type: ${type}`)
    }
  }
}

// 使用示例
console.log(VersionManager.parseVersion('1.2.3-alpha.1+build.123'))
// { major: 1, minor: 2, patch: 3, prerelease: 'alpha.1', build: 'build.123' }

console.log(VersionManager.compareVersions('1.2.3', '1.2.4')) // -1
console.log(VersionManager.isCompatible('1.2.3', '1.2.0')) // true
console.log(VersionManager.getNextVersion('1.2.3', 'minor')) // '1.3.0'
```

### 预发布版本

```bash
# 预发布版本示例
1.0.0-alpha.1    # Alpha 版本
1.0.0-beta.1     # Beta 版本
1.0.0-rc.1       # Release Candidate 版本
```

## 发布流程

### 自动化发布脚本

```typescript
// scripts/release.ts
import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

interface ReleaseOptions {
  type: 'major' | 'minor' | 'patch' | 'prerelease'
  prerelease?: string
  dryRun?: boolean
  skipTests?: boolean
  skipBuild?: boolean
}

class ReleaseManager {
  private packageJsonPath: string
  private changelogPath: string
  
  constructor() {
    this.packageJsonPath = join(process.cwd(), 'package.json')
    this.changelogPath = join(process.cwd(), 'CHANGELOG.md')
  }
  
  async release(options: ReleaseOptions): Promise<void> {
    console.log('🚀 开始发布流程...')
    
    try {
      // 1. 检查工作目录状态
      this.checkWorkingDirectory()
      
      // 2. 运行测试
      if (!options.skipTests) {
        await this.runTests()
      }
      
      // 3. 构建项目
      if (!options.skipBuild) {
        await this.buildProject()
      }
      
      // 4. 更新版本号
      const newVersion = this.updateVersion(options)
      
      // 5. 生成变更日志
      await this.generateChangelog(newVersion)
      
      // 6. 提交更改
      if (!options.dryRun) {
        this.commitChanges(newVersion)
      }
      
      // 7. 创建标签
      if (!options.dryRun) {
        this.createTag(newVersion)
      }
      
      // 8. 发布到 npm
      if (!options.dryRun) {
        await this.publishToNpm(options.prerelease)
      }
      
      // 9. 推送到远程仓库
      if (!options.dryRun) {
        this.pushToRemote(newVersion)
      }
      
      console.log(`✅ 发布完成！版本: ${newVersion}`)
      
    } catch (error) {
      console.error('❌ 发布失败:', error)
      process.exit(1)
    }
  }
  
  private checkWorkingDirectory(): void {
    console.log('🔍 检查工作目录状态...')
    
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' })
      if (status.trim()) {
        throw new Error('工作目录不干净，请先提交或暂存更改')
      }
    } catch (error) {
      throw new Error('无法检查 Git 状态')
    }
    
    // 检查当前分支
    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim()
      if (branch !== 'main' && branch !== 'master') {
        console.warn(`⚠️  当前分支: ${branch}，建议在主分支发布`)
      }
    } catch (error) {
      console.warn('无法检查当前分支')
    }
  }
  
  private async runTests(): Promise<void> {
    console.log('🧪 运行测试...')
    
    try {
      execSync('npm run test', { stdio: 'inherit' })
      execSync('npm run lint', { stdio: 'inherit' })
      execSync('npm run type-check', { stdio: 'inherit' })
    } catch (error) {
      throw new Error('测试失败，请修复后重试')
    }
  }
  
  private async buildProject(): Promise<void> {
    console.log('🔨 构建项目...')
    
    try {
      execSync('npm run build', { stdio: 'inherit' })
    } catch (error) {
      throw new Error('构建失败，请检查代码')
    }
  }
  
  private updateVersion(options: ReleaseOptions): string {
    console.log('📝 更新版本号...')
    
    const packageJson = JSON.parse(readFileSync(this.packageJsonPath, 'utf8'))
    const currentVersion = packageJson.version
    
    let newVersion: string
    
    if (options.type === 'prerelease') {
      if (!options.prerelease) {
        throw new Error('预发布版本需要指定预发布标识符')
      }
      
      const versionInfo = VersionManager.parseVersion(currentVersion)
      if (versionInfo.prerelease) {
        // 增加预发布版本号
        const prereleaseMatch = versionInfo.prerelease.match(/(\w+)\.(\d+)/)
        if (prereleaseMatch && prereleaseMatch[1] === options.prerelease) {
          const prereleaseNumber = parseInt(prereleaseMatch[2], 10) + 1
          newVersion = `${versionInfo.major}.${versionInfo.minor}.${versionInfo.patch}-${options.prerelease}.${prereleaseNumber}`
        } else {
          newVersion = `${versionInfo.major}.${versionInfo.minor}.${versionInfo.patch}-${options.prerelease}.1`
        }
      } else {
        // 创建新的预发布版本
        newVersion = `${versionInfo.major}.${versionInfo.minor}.${versionInfo.patch + 1}-${options.prerelease}.1`
      }
    } else {
      newVersion = VersionManager.getNextVersion(currentVersion, options.type)
    }
    
    packageJson.version = newVersion
    writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
    
    console.log(`版本号已更新: ${currentVersion} → ${newVersion}`)
    return newVersion
  }
  
  private async generateChangelog(version: string): Promise<void> {
    console.log('📋 生成变更日志...')
    
    try {
      // 获取上一个版本的标签
      const lastTag = this.getLastTag()
      
      // 获取提交记录
      const commits = this.getCommitsSinceTag(lastTag)
      
      // 分类提交
      const categorizedCommits = this.categorizeCommits(commits)
      
      // 生成变更日志内容
      const changelogContent = this.formatChangelog(version, categorizedCommits)
      
      // 更新 CHANGELOG.md
      this.updateChangelogFile(changelogContent)
      
    } catch (error) {
      console.warn('生成变更日志失败:', error)
    }
  }
  
  private getLastTag(): string {
    try {
      return execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim()
    } catch {
      return '' // 没有标签
    }
  }
  
  private getCommitsSinceTag(tag: string): Array<{ hash: string; message: string; author: string; date: string }> {
    const command = tag 
      ? `git log ${tag}..HEAD --pretty=format:"%H|%s|%an|%ad" --date=short`
      : 'git log --pretty=format:"%H|%s|%an|%ad" --date=short'
    
    try {
      const output = execSync(command, { encoding: 'utf8' })
      return output.trim().split('\n').filter(Boolean).map(line => {
        const [hash, message, author, date] = line.split('|')
        return { hash, message, author, date }
      })
    } catch {
      return []
    }
  }
  
  private categorizeCommits(commits: Array<{ hash: string; message: string; author: string; date: string }>) {
    const categories = {
      breaking: [] as typeof commits,
      features: [] as typeof commits,
      fixes: [] as typeof commits,
      docs: [] as typeof commits,
      style: [] as typeof commits,
      refactor: [] as typeof commits,
      perf: [] as typeof commits,
      test: [] as typeof commits,
      chore: [] as typeof commits,
      other: [] as typeof commits
    }
    
    commits.forEach(commit => {
      const message = commit.message.toLowerCase()
      
      if (message.includes('breaking change') || message.includes('!:')) {
        categories.breaking.push(commit)
      } else if (message.startsWith('feat')) {
        categories.features.push(commit)
      } else if (message.startsWith('fix')) {
        categories.fixes.push(commit)
      } else if (message.startsWith('docs')) {
        categories.docs.push(commit)
      } else if (message.startsWith('style')) {
        categories.style.push(commit)
      } else if (message.startsWith('refactor')) {
        categories.refactor.push(commit)
      } else if (message.startsWith('perf')) {
        categories.perf.push(commit)
      } else if (message.startsWith('test')) {
        categories.test.push(commit)
      } else if (message.startsWith('chore')) {
        categories.chore.push(commit)
      } else {
        categories.other.push(commit)
      }
    })
    
    return categories
  }
  
  private formatChangelog(version: string, categories: any): string {
    const date = new Date().toISOString().split('T')[0]
    let content = `## [${version}] - ${date}\n\n`
    
    if (categories.breaking.length > 0) {
      content += '### ⚠️ BREAKING CHANGES\n\n'
      categories.breaking.forEach((commit: any) => {
        content += `- ${commit.message} ([${commit.hash.slice(0, 7)}](../../commit/${commit.hash}))\n`
      })
      content += '\n'
    }
    
    if (categories.features.length > 0) {
      content += '### ✨ Features\n\n'
      categories.features.forEach((commit: any) => {
        content += `- ${commit.message} ([${commit.hash.slice(0, 7)}](../../commit/${commit.hash}))\n`
      })
      content += '\n'
    }
    
    if (categories.fixes.length > 0) {
      content += '### 🐛 Bug Fixes\n\n'
      categories.fixes.forEach((commit: any) => {
        content += `- ${commit.message} ([${commit.hash.slice(0, 7)}](../../commit/${commit.hash}))\n`
      })
      content += '\n'
    }
    
    if (categories.perf.length > 0) {
      content += '### ⚡ Performance Improvements\n\n'
      categories.perf.forEach((commit: any) => {
        content += `- ${commit.message} ([${commit.hash.slice(0, 7)}](../../commit/${commit.hash}))\n`
      })
      content += '\n'
    }
    
    if (categories.docs.length > 0) {
      content += '### 📚 Documentation\n\n'
      categories.docs.forEach((commit: any) => {
        content += `- ${commit.message} ([${commit.hash.slice(0, 7)}](../../commit/${commit.hash}))\n`
      })
      content += '\n'
    }
    
    if (categories.refactor.length > 0) {
      content += '### ♻️ Code Refactoring\n\n'
      categories.refactor.forEach((commit: any) => {
        content += `- ${commit.message} ([${commit.hash.slice(0, 7)}](../../commit/${commit.hash}))\n`
      })
      content += '\n'
    }
    
    return content
  }
  
  private updateChangelogFile(newContent: string): void {
    try {
      let existingContent = ''
      try {
        existingContent = readFileSync(this.changelogPath, 'utf8')
      } catch {
        // 文件不存在，创建新文件
        existingContent = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n'
      }
      
      // 在现有内容前插入新内容
      const lines = existingContent.split('\n')
      const insertIndex = lines.findIndex(line => line.startsWith('## [')) || 3
      
      lines.splice(insertIndex, 0, newContent)
      
      writeFileSync(this.changelogPath, lines.join('\n'))
    } catch (error) {
      console.warn('更新变更日志文件失败:', error)
    }
  }
  
  private commitChanges(version: string): void {
    console.log('📝 提交更改...')
    
    try {
      execSync('git add package.json CHANGELOG.md')
      execSync(`git commit -m "chore(release): ${version}"`)
    } catch (error) {
      throw new Error('提交更改失败')
    }
  }
  
  private createTag(version: string): void {
    console.log('🏷️  创建标签...')
    
    try {
      execSync(`git tag -a v${version} -m "Release ${version}"`)
    } catch (error) {
      throw new Error('创建标签失败')
    }
  }
  
  private async publishToNpm(prerelease?: string): Promise<void> {
    console.log('📦 发布到 npm...')
    
    try {
      const publishCommand = prerelease 
        ? `npm publish --tag ${prerelease}`
        : 'npm publish'
      
      execSync(publishCommand, { stdio: 'inherit' })
    } catch (error) {
      throw new Error('发布到 npm 失败')
    }
  }
  
  private pushToRemote(version: string): void {
    console.log('🚀 推送到远程仓库...')
    
    try {
      execSync('git push origin main')
      execSync(`git push origin v${version}`)
    } catch (error) {
      throw new Error('推送到远程仓库失败')
    }
  }
}

// CLI 接口
if (require.main === module) {
  const args = process.argv.slice(2)
  const type = args[0] as 'major' | 'minor' | 'patch' | 'prerelease'
  const prerelease = args[1]
  
  if (!['major', 'minor', 'patch', 'prerelease'].includes(type)) {
    console.error('用法: npm run release <major|minor|patch|prerelease> [prerelease-identifier]')
    process.exit(1)
  }
  
  const releaseManager = new ReleaseManager()
  releaseManager.release({
    type,
    prerelease,
    dryRun: process.env.DRY_RUN === 'true',
    skipTests: process.env.SKIP_TESTS === 'true',
    skipBuild: process.env.SKIP_BUILD === 'true'
  })
}

export { ReleaseManager, VersionManager }
```

### Package.json 脚本配置

```json
{
  "scripts": {
    "release:patch": "tsx scripts/release.ts patch",
    "release:minor": "tsx scripts/release.ts minor",
    "release:major": "tsx scripts/release.ts major",
    "release:alpha": "tsx scripts/release.ts prerelease alpha",
    "release:beta": "tsx scripts/release.ts prerelease beta",
    "release:rc": "tsx scripts/release.ts prerelease rc",
    "release:dry-run": "DRY_RUN=true tsx scripts/release.ts patch",
    "version:check": "tsx scripts/version-check.ts",
    "changelog:generate": "tsx scripts/changelog.ts"
  }
}
```

## 分支管理策略

### Git Flow 工作流

```bash
# 主要分支
main/master     # 生产环境分支
develop         # 开发分支

# 支持分支
feature/*       # 功能分支
release/*       # 发布分支
hotfix/*        # 热修复分支
```

### 分支管理脚本

```typescript
// scripts/branch-manager.ts
class BranchManager {
  static createFeatureBranch(featureName: string): void {
    const branchName = `feature/${featureName}`
    
    try {
      // 切换到 develop 分支并拉取最新代码
      execSync('git checkout develop')
      execSync('git pull origin develop')
      
      // 创建并切换到功能分支
      execSync(`git checkout -b ${branchName}`)
      
      console.log(`✅ 功能分支 ${branchName} 创建成功`)
    } catch (error) {
      console.error('创建功能分支失败:', error)
    }
  }
  
  static createReleaseBranch(version: string): void {
    const branchName = `release/${version}`
    
    try {
      // 切换到 develop 分支并拉取最新代码
      execSync('git checkout develop')
      execSync('git pull origin develop')
      
      // 创建发布分支
      execSync(`git checkout -b ${branchName}`)
      
      // 更新版本号
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
      packageJson.version = version
      writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n')
      
      // 提交版本更新
      execSync('git add package.json')
      execSync(`git commit -m "chore: bump version to ${version}"`)
      
      console.log(`✅ 发布分支 ${branchName} 创建成功`)
    } catch (error) {
      console.error('创建发布分支失败:', error)
    }
  }
  
  static createHotfixBranch(version: string): void {
    const branchName = `hotfix/${version}`
    
    try {
      // 切换到 main 分支并拉取最新代码
      execSync('git checkout main')
      execSync('git pull origin main')
      
      // 创建热修复分支
      execSync(`git checkout -b ${branchName}`)
      
      console.log(`✅ 热修复分支 ${branchName} 创建成功`)
    } catch (error) {
      console.error('创建热修复分支失败:', error)
    }
  }
  
  static finishFeatureBranch(featureName: string): void {
    const branchName = `feature/${featureName}`
    
    try {
      // 切换到功能分支
      execSync(`git checkout ${branchName}`)
      
      // 拉取 develop 最新代码并合并
      execSync('git fetch origin develop')
      execSync('git rebase origin/develop')
      
      // 切换到 develop 分支
      execSync('git checkout develop')
      execSync('git pull origin develop')
      
      // 合并功能分支
      execSync(`git merge --no-ff ${branchName}`)
      
      // 删除功能分支
      execSync(`git branch -d ${branchName}`)
      
      // 推送到远程
      execSync('git push origin develop')
      execSync(`git push origin --delete ${branchName}`)
      
      console.log(`✅ 功能分支 ${branchName} 合并完成`)
    } catch (error) {
      console.error('合并功能分支失败:', error)
    }
  }
  
  static finishReleaseBranch(version: string): void {
    const branchName = `release/${version}`
    
    try {
      // 切换到发布分支
      execSync(`git checkout ${branchName}`)
      
      // 合并到 main 分支
      execSync('git checkout main')
      execSync('git pull origin main')
      execSync(`git merge --no-ff ${branchName}`)
      
      // 创建标签
      execSync(`git tag -a v${version} -m "Release ${version}"`)
      
      // 合并到 develop 分支
      execSync('git checkout develop')
      execSync('git pull origin develop')
      execSync(`git merge --no-ff ${branchName}`)
      
      // 删除发布分支
      execSync(`git branch -d ${branchName}`)
      
      // 推送所有更改
      execSync('git push origin main')
      execSync('git push origin develop')
      execSync(`git push origin v${version}`)
      execSync(`git push origin --delete ${branchName}`)
      
      console.log(`✅ 发布分支 ${branchName} 合并完成`)
    } catch (error) {
      console.error('合并发布分支失败:', error)
    }
  }
}
```

## 向后兼容性

### 兼容性检查工具

```typescript
// scripts/compatibility-check.ts
interface CompatibilityIssue {
  type: 'breaking' | 'deprecated' | 'warning'
  category: 'api' | 'config' | 'behavior'
  description: string
  migration?: string
  since?: string
}

class CompatibilityChecker {
  private issues: CompatibilityIssue[] = []
  
  checkApiCompatibility(oldApi: any, newApi: any): CompatibilityIssue[] {
    const issues: CompatibilityIssue[] = []
    
    // 检查删除的方法
    for (const method in oldApi) {
      if (!(method in newApi)) {
        issues.push({
          type: 'breaking',
          category: 'api',
          description: `方法 '${method}' 已被删除`,
          migration: `请使用替代方法或更新代码`
        })
      }
    }
    
    // 检查方法签名变化
    for (const method in newApi) {
      if (method in oldApi) {
        const oldSignature = this.getMethodSignature(oldApi[method])
        const newSignature = this.getMethodSignature(newApi[method])
        
        if (oldSignature !== newSignature) {
          issues.push({
            type: 'breaking',
            category: 'api',
            description: `方法 '${method}' 的签名已更改`,
            migration: `请更新方法调用以匹配新签名`
          })
        }
      }
    }
    
    return issues
  }
  
  checkConfigCompatibility(oldConfig: any, newConfig: any): CompatibilityIssue[] {
    const issues: CompatibilityIssue[] = []
    
    // 检查删除的配置项
    for (const key in oldConfig) {
      if (!(key in newConfig)) {
        issues.push({
          type: 'breaking',
          category: 'config',
          description: `配置项 '${key}' 已被删除`,
          migration: `请从配置中移除此项或使用新的配置项`
        })
      }
    }
    
    // 检查配置项类型变化
    for (const key in newConfig) {
      if (key in oldConfig) {
        const oldType = typeof oldConfig[key]
        const newType = typeof newConfig[key]
        
        if (oldType !== newType) {
          issues.push({
            type: 'breaking',
            category: 'config',
            description: `配置项 '${key}' 的类型从 ${oldType} 更改为 ${newType}`,
            migration: `请更新配置值以匹配新类型`
          })
        }
      }
    }
    
    return issues
  }
  
  private getMethodSignature(method: Function): string {
    return method.toString().split('{')[0].trim()
  }
  
  generateMigrationGuide(issues: CompatibilityIssue[]): string {
    let guide = '# 迁移指南\n\n'
    
    const breakingChanges = issues.filter(issue => issue.type === 'breaking')
    const deprecations = issues.filter(issue => issue.type === 'deprecated')
    const warnings = issues.filter(issue => issue.type === 'warning')
    
    if (breakingChanges.length > 0) {
      guide += '## ⚠️ 破坏性变更\n\n'
      breakingChanges.forEach(issue => {
        guide += `### ${issue.description}\n\n`
        if (issue.migration) {
          guide += `**迁移方法**: ${issue.migration}\n\n`
        }
      })
    }
    
    if (deprecations.length > 0) {
      guide += '## 🚨 废弃功能\n\n'
      deprecations.forEach(issue => {
        guide += `### ${issue.description}\n\n`
        if (issue.migration) {
          guide += `**替代方案**: ${issue.migration}\n\n`
        }
        if (issue.since) {
          guide += `**废弃版本**: ${issue.since}\n\n`
        }
      })
    }
    
    if (warnings.length > 0) {
      guide += '## ⚡ 注意事项\n\n'
      warnings.forEach(issue => {
        guide += `### ${issue.description}\n\n`
        if (issue.migration) {
          guide += `**建议**: ${issue.migration}\n\n`
        }
      })
    }
    
    return guide
  }
}

// 使用示例
const checker = new CompatibilityChecker()
const issues = [
  ...checker.checkApiCompatibility(oldApi, newApi),
  ...checker.checkConfigCompatibility(oldConfig, newConfig)
]

const migrationGuide = checker.generateMigrationGuide(issues)
console.log(migrationGuide)
```

### 废弃功能管理

```typescript
// src/utils/deprecation.ts
interface DeprecationOptions {
  since: string
  removeIn?: string
  replacement?: string
  url?: string
}

class DeprecationManager {
  private static warnings = new Set<string>()
  
  static deprecate(
    feature: string, 
    options: DeprecationOptions
  ): void {
    const key = `${feature}-${options.since}`
    
    // 避免重复警告
    if (this.warnings.has(key)) {
      return
    }
    
    this.warnings.add(key)
    
    let message = `⚠️  DEPRECATED: ${feature} 已在版本 ${options.since} 中废弃`
    
    if (options.removeIn) {
      message += `，将在版本 ${options.removeIn} 中移除`
    }
    
    if (options.replacement) {
      message += `。请使用 ${options.replacement} 替代`
    }
    
    if (options.url) {
      message += `。详情请参考: ${options.url}`
    }
    
    console.warn(message)
    
    // 在开发环境中显示堆栈跟踪
    if (process.env.NODE_ENV === 'development') {
      console.trace('调用堆栈:')
    }
  }
  
  static createDeprecatedMethod<T extends Function>(
    originalMethod: T,
    feature: string,
    options: DeprecationOptions
  ): T {
    return ((...args: any[]) => {
      this.deprecate(feature, options)
      return originalMethod.apply(this, args)
    }) as any
  }
  
  static createDeprecatedProperty<T>(
    obj: any,
    propertyName: string,
    value: T,
    options: DeprecationOptions
  ): void {
    let hasWarned = false
    
    Object.defineProperty(obj, propertyName, {
      get() {
        if (!hasWarned) {
          DeprecationManager.deprecate(`属性 ${propertyName}`, options)
          hasWarned = true
        }
        return value
      },
      set(newValue: T) {
        if (!hasWarned) {
          DeprecationManager.deprecate(`属性 ${propertyName}`, options)
          hasWarned = true
        }
        value = newValue
      },
      enumerable: true,
      configurable: true
    })
  }
}

// 使用示例
class Engine {
  // 废弃的方法
  oldMethod = DeprecationManager.createDeprecatedMethod(
    this.newMethod,
    'Engine.oldMethod()',
    {
      since: '2.0.0',
      removeIn: '3.0.0',
      replacement: 'Engine.newMethod()',
      url: 'https://docs.example.com/migration-guide'
    }
  )
  
  newMethod() {
    // 新的实现
  }
  
  constructor() {
    // 废弃的属性
    DeprecationManager.createDeprecatedProperty(
      this,
      'oldProperty',
      'default value',
      {
        since: '2.1.0',
        removeIn: '3.0.0',
        replacement: 'newProperty'
      }
    )
  }
}

export { DeprecationManager }
```

## 版本检查和更新

### 版本检查工具

```typescript
// src/utils/version-check.ts
class VersionChecker {
  private static readonly CHECK_INTERVAL = 24 * 60 * 60 * 1000 // 24小时
  private static readonly STORAGE_KEY = 'ldesign-engine-version-check'
  
  static async checkForUpdates(): Promise<{
    hasUpdate: boolean
    currentVersion: string
    latestVersion?: string
    updateInfo?: any
  }> {
    const currentVersion = this.getCurrentVersion()
    
    // 检查是否需要检查更新
    if (!this.shouldCheckForUpdates()) {
      return { hasUpdate: false, currentVersion }
    }
    
    try {
      const latestInfo = await this.fetchLatestVersion()
      const hasUpdate = VersionManager.compareVersions(latestInfo.version, currentVersion) > 0
      
      // 更新检查时间
      this.updateLastCheckTime()
      
      return {
        hasUpdate,
        currentVersion,
        latestVersion: latestInfo.version,
        updateInfo: latestInfo
      }
    } catch (error) {
      console.warn('检查更新失败:', error)
      return { hasUpdate: false, currentVersion }
    }
  }
  
  private static getCurrentVersion(): string {
    // 从 package.json 或构建时注入的版本信息获取
    return process.env.PACKAGE_VERSION || '0.0.0'
  }
  
  private static shouldCheckForUpdates(): boolean {
    if (typeof localStorage === 'undefined') return false
    
    const lastCheck = localStorage.getItem(this.STORAGE_KEY)
    if (!lastCheck) return true
    
    const lastCheckTime = parseInt(lastCheck, 10)
    const now = Date.now()
    
    return (now - lastCheckTime) > this.CHECK_INTERVAL
  }
  
  private static async fetchLatestVersion(): Promise<any> {
    const response = await fetch('https://registry.npmjs.org/@ldesign/engine/latest')
    if (!response.ok) {
      throw new Error('获取版本信息失败')
    }
    
    return response.json()
  }
  
  private static updateLastCheckTime(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, Date.now().toString())
    }
  }
  
  static async notifyUpdate(updateInfo: any): Promise<void> {
    if (typeof window === 'undefined') return
    
    const shouldNotify = confirm(
      `发现新版本 ${updateInfo.latestVersion}！\n` +
      `当前版本: ${updateInfo.currentVersion}\n` +
      `是否查看更新说明？`
    )
    
    if (shouldNotify) {
      window.open(
        `https://github.com/ldesign/engine/releases/tag/v${updateInfo.latestVersion}`,
        '_blank'
      )
    }
  }
}

// 自动检查更新
if (typeof window !== 'undefined') {
  VersionChecker.checkForUpdates().then(result => {
    if (result.hasUpdate) {
      VersionChecker.notifyUpdate(result)
    }
  })
}

export { VersionChecker }
```

## 总结

版本管理是软件开发生命周期中的关键环节。通过本章的学习，您应该掌握了：

### 核心概念

1. **语义化版本控制**：规范的版本号格式和含义
2. **自动化发布**：减少人工错误，提高发布效率
3. **分支管理**：清晰的开发流程和代码组织
4. **向后兼容性**：平滑的版本升级体验
5. **变更日志**：详细的版本变更记录

### 最佳实践

- 严格遵循语义化版本控制规范
- 使用自动化工具管理发布流程
- 维护清晰的分支策略
- 提供详细的迁移指南
- 及时废弃过时功能
- 定期检查和更新依赖

通过实施这些版本管理策略，您可以确保 @ldesign/engine 项目的稳定发展和用户体验。