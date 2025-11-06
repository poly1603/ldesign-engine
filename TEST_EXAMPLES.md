# Engine Examples 测试指南

本文档提供了测试所有 engine 适配器 example 项目的快速指南。

## 🚀 快速测试

### 前置条件

确保已安装所有依赖：

```bash
# 在项目根目录
pnpm install
```

### 测试单个 Example

#### 1. Vue2 Example

```bash
cd packages/engine/packages/vue2/example
pnpm dev
```

访问：http://localhost:5176

**预期结果：**
- ✅ 页面正常加载，无 Vue 运行时警告
- ✅ 显示 "Vue 2 + LDesign Engine" 标题
- ✅ 控制台显示插件和中间件日志

---

#### 2. Svelte Example

```bash
cd packages/engine/packages/svelte/example
pnpm dev
```

访问：http://localhost:5177

**预期结果：**
- ✅ 页面正常加载，无 Svelte 5 组件 API 错误
- ✅ 显示 "Svelte + LDesign Engine" 标题
- ✅ 控制台显示引擎初始化日志

---

#### 3. Angular Example

```bash
cd packages/engine/packages/angular/example
pnpm dev
```

访问：http://localhost:5179

**预期结果：**
- ✅ 页面正常加载，无 JIT 编译错误
- ✅ 正确显示 "@ldesign/engine-angular" 文本
- ✅ 所有组件正常渲染

---

#### 4. Qwik Example（新建）

```bash
cd packages/engine/packages/qwik/example
pnpm install  # 首次需要安装依赖
pnpm dev
```

访问：http://localhost:5180

**预期结果：**
- ✅ 页面正常加载
- ✅ 显示 "Qwik + LDesign Engine" 标题
- ✅ 控制台显示引擎初始化日志

---

#### 5. Preact Example（新建）

```bash
cd packages/engine/packages/preact/example
pnpm install  # 首次需要安装依赖
pnpm dev
```

访问：http://localhost:5181

**预期结果：**
- ✅ 页面正常加载
- ✅ 显示 "Preact + LDesign Engine" 标题
- ✅ 控制台显示引擎初始化日志

---

## 📋 完整测试清单

### 所有 Example 端口

| 框架 | 开发端口 | 预览端口 | 状态 |
|------|---------|---------|------|
| React | 5175 | 4175 | ✅ 正常 |
| Vue2 | 5176 | 4176 | ✅ 已修复 |
| Svelte | 5177 | 4177 | ✅ 已修复 |
| Solid | 5178 | 4178 | ✅ 正常 |
| Angular | 5179 | 4179 | ✅ 已修复 |
| Qwik | 5180 | 4180 | ✅ 新建 |
| Preact | 5181 | 4181 | ✅ 新建 |
| Vue3 | 5182 | 4182 | ✅ 正常 |
| Lit | 5183 | 4183 | ✅ 正常 |

### 测试检查项

对于每个 example，检查以下内容：

- [ ] 开发服务器正常启动
- [ ] 页面无错误加载
- [ ] 控制台无错误信息
- [ ] 引擎初始化成功
- [ ] 插件系统工作正常
- [ ] 中间件系统工作正常
- [ ] 样式正确显示
- [ ] 构建命令正常工作

---

## 🔧 批量测试脚本

### PowerShell 脚本（Windows）

创建 `test-all-examples.ps1`：

```powershell
$examples = @(
    @{Name="vue2"; Port=5176; Path="packages/engine/packages/vue2/example"},
    @{Name="svelte"; Port=5177; Path="packages/engine/packages/svelte/example"},
    @{Name="angular"; Port=5179; Path="packages/engine/packages/angular/example"},
    @{Name="qwik"; Port=5180; Path="packages/engine/packages/qwik/example"},
    @{Name="preact"; Port=5181; Path="packages/engine/packages/preact/example"}
)

foreach ($example in $examples) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "测试 $($example.Name) Example" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    Push-Location $example.Path
    
    # 检查是否需要安装依赖
    if (-not (Test-Path "node_modules")) {
        Write-Host "安装依赖..." -ForegroundColor Yellow
        pnpm install
    }
    
    # 启动开发服务器（后台）
    Write-Host "启动开发服务器 (端口 $($example.Port))..." -ForegroundColor Green
    Start-Process -NoNewWindow pnpm -ArgumentList "dev"
    
    # 等待服务器启动
    Start-Sleep -Seconds 5
    
    # 打开浏览器
    Start-Process "http://localhost:$($example.Port)"
    
    # 等待用户确认
    Read-Host "按 Enter 继续下一个测试..."
    
    # 停止服务器
    Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force
    
    Pop-Location
}

Write-Host "所有测试完成！" -ForegroundColor Green
```

### Bash 脚本（Linux/Mac）

创建 `test-all-examples.sh`：

```bash
#!/bin/bash

examples=(
    "vue2:5176:packages/engine/packages/vue2/example"
    "svelte:5177:packages/engine/packages/svelte/example"
    "angular:5179:packages/engine/packages/angular/example"
    "qwik:5180:packages/engine/packages/qwik/example"
    "preact:5181:packages/engine/packages/preact/example"
)

for example in "${examples[@]}"; do
    IFS=':' read -r name port path <<< "$example"
    
    echo "========================================"
    echo "测试 $name Example"
    echo "========================================"
    
    cd "$path" || exit
    
    # 检查是否需要安装依赖
    if [ ! -d "node_modules" ]; then
        echo "安装依赖..."
        pnpm install
    fi
    
    # 启动开发服务器
    echo "启动开发服务器 (端口 $port)..."
    pnpm dev &
    PID=$!
    
    # 等待服务器启动
    sleep 5
    
    # 打开浏览器
    if command -v xdg-open > /dev/null; then
        xdg-open "http://localhost:$port"
    elif command -v open > /dev/null; then
        open "http://localhost:$port"
    fi
    
    # 等待用户确认
    read -p "按 Enter 继续下一个测试..."
    
    # 停止服务器
    kill $PID
    
    cd - || exit
done

echo "所有测试完成！"
```

---

## 🐛 常见问题

### 1. 端口被占用

**错误信息：**
```
Port 5176 is in use
```

**解决方案：**
```bash
# Windows
netstat -ano | findstr :5176
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5176 | xargs kill -9
```

### 2. 依赖安装失败

**解决方案：**
```bash
# 清理缓存
pnpm store prune

# 重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### 3. TypeScript 错误

**解决方案：**
```bash
# 重新构建类型
pnpm build

# 或者跳过类型检查
pnpm dev --no-type-check
```

---

## 📊 测试报告模板

测试完成后，可以使用以下模板记录结果：

```markdown
# Engine Examples 测试报告

测试日期：YYYY-MM-DD
测试人员：[姓名]

## 测试结果

| Example | 启动 | 加载 | 功能 | 构建 | 备注 |
|---------|------|------|------|------|------|
| Vue2    | ✅   | ✅   | ✅   | ✅   |      |
| Svelte  | ✅   | ✅   | ✅   | ✅   |      |
| Angular | ✅   | ✅   | ✅   | ✅   |      |
| Qwik    | ✅   | ✅   | ✅   | ✅   |      |
| Preact  | ✅   | ✅   | ✅   | ✅   |      |

## 发现的问题

1. [问题描述]
   - 影响范围：
   - 严重程度：
   - 解决方案：

## 建议

1. [改进建议]
```

---

## 📚 相关文档

- [EXAMPLE_FIXES.md](./EXAMPLE_FIXES.md) - 修复详情
- [README.md](./README.md) - Engine 文档
- [Launcher 文档](../../tools/launcher/README.md)

