# 自动测试所有框架 Example 的启动脚本
# 此脚本会逐个启动每个框架的 example，等待启动完成，然后打开浏览器验证

param(
    [int]$WaitSeconds = 15,  # 等待服务器启动的秒数
    [switch]$SkipBrowser     # 跳过浏览器打开
)

$ErrorActionPreference = "Continue"

# 定义框架列表（按构建成功的顺序）
$frameworks = @(
    @{ Name = "React"; Path = "react"; Port = 5173 },
    @{ Name = "Vue"; Path = "vue"; Port = 5174 },
    @{ Name = "Svelte"; Path = "svelte"; Port = 5175 },
    @{ Name = "Solid"; Path = "solid"; Port = 5176 },
    @{ Name = "Lit"; Path = "lit"; Port = 5177 },
    @{ Name = "Preact"; Path = "preact"; Port = 5178 },
    @{ Name = "Alpine.js"; Path = "alpinejs"; Port = 5179 },
    @{ Name = "Angular"; Path = "angular"; Port = 5180 },
    @{ Name = "Astro"; Path = "astro"; Port = 5181 },
    @{ Name = "Remix"; Path = "remix"; Port = 5182 },
    @{ Name = "SvelteKit"; Path = "sveltekit"; Port = 5183 },
    @{ Name = "Next.js"; Path = "nextjs"; Port = 5184 },
    @{ Name = "Nuxt.js"; Path = "nuxtjs"; Port = 5185 }
)

$results = @()
$successCount = 0
$failCount = 0

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "开始测试所有框架 Example 启动" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

foreach ($framework in $frameworks) {
    $frameworkName = $framework.Name
    $frameworkPath = $framework.Path
    $port = $framework.Port
    $examplePath = "packages\engine\packages\$frameworkPath\example"
    
    Write-Host "`n----------------------------------------" -ForegroundColor Yellow
    Write-Host "测试框架: $frameworkName" -ForegroundColor Yellow
    Write-Host "路径: $examplePath" -ForegroundColor Gray
    Write-Host "----------------------------------------" -ForegroundColor Yellow
    
    # 检查目录是否存在
    if (-not (Test-Path $examplePath)) {
        Write-Host "❌ 目录不存在: $examplePath" -ForegroundColor Red
        $results += @{
            Framework = $frameworkName
            Status = "目录不存在"
            URL = ""
            Error = "目录不存在"
        }
        $failCount++
        continue
    }
    
    # 启动开发服务器
    Write-Host "🚀 启动开发服务器..." -ForegroundColor Cyan
    
    $job = Start-Job -ScriptBlock {
        param($path)
        Set-Location $path
        pnpm dev 2>&1
    } -ArgumentList (Resolve-Path $examplePath).Path
    
    # 等待服务器启动
    Write-Host "⏳ 等待 $WaitSeconds 秒让服务器启动..." -ForegroundColor Gray
    Start-Sleep -Seconds $WaitSeconds
    
    # 检查进程是否还在运行
    $jobState = $job.State
    if ($jobState -eq "Failed" -or $jobState -eq "Completed") {
        Write-Host "❌ 服务器启动失败" -ForegroundColor Red
        $output = Receive-Job -Job $job
        Write-Host "错误输出:" -ForegroundColor Red
        Write-Host $output -ForegroundColor Red
        
        $results += @{
            Framework = $frameworkName
            Status = "启动失败"
            URL = ""
            Error = $output
        }
        $failCount++
        
        Stop-Job -Job $job -ErrorAction SilentlyContinue
        Remove-Job -Job $job -ErrorAction SilentlyContinue
        continue
    }
    
    # 尝试检测实际的端口
    $output = Receive-Job -Job $job
    $url = "http://localhost:$port"
    
    # 尝试从输出中提取 URL
    if ($output -match "http://localhost:(\d+)") {
        $detectedPort = $matches[1]
        $url = "http://localhost:$detectedPort"
        Write-Host "✅ 检测到服务器 URL: $url" -ForegroundColor Green
    } else {
        Write-Host "⚠️  使用默认 URL: $url" -ForegroundColor Yellow
    }
    
    # 测试 URL 是否可访问
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ 服务器响应正常 (HTTP 200)" -ForegroundColor Green
            
            # 打开浏览器
            if (-not $SkipBrowser) {
                Write-Host "🌐 打开浏览器: $url" -ForegroundColor Cyan
                Start-Process $url
                
                Write-Host "`n请在浏览器中验证以下内容:" -ForegroundColor Yellow
                Write-Host "  1. 页面是否正常加载（无白屏、无错误）" -ForegroundColor Gray
                Write-Host "  2. 控制台是否有 Engine 相关的日志输出" -ForegroundColor Gray
                Write-Host "  3. 页面是否显示预期的内容" -ForegroundColor Gray
                Write-Host "`n按任意键继续测试下一个框架..." -ForegroundColor Yellow
                $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            }
            
            $results += @{
                Framework = $frameworkName
                Status = "成功"
                URL = $url
                Error = ""
            }
            $successCount++
        } else {
            Write-Host "❌ 服务器响应异常 (HTTP $($response.StatusCode))" -ForegroundColor Red
            $results += @{
                Framework = $frameworkName
                Status = "响应异常"
                URL = $url
                Error = "HTTP $($response.StatusCode)"
            }
            $failCount++
        }
    } catch {
        Write-Host "❌ 无法访问 URL: $url" -ForegroundColor Red
        Write-Host "错误: $($_.Exception.Message)" -ForegroundColor Red
        
        $results += @{
            Framework = $frameworkName
            Status = "URL 不可访问"
            URL = $url
            Error = $_.Exception.Message
        }
        $failCount++
    }
    
    # 停止开发服务器
    Write-Host "🛑 停止开发服务器..." -ForegroundColor Gray
    Stop-Job -Job $job -ErrorAction SilentlyContinue
    Remove-Job -Job $job -ErrorAction SilentlyContinue
    
    # 等待一下让端口释放
    Start-Sleep -Seconds 2
}

# 输出测试结果
Write-Host "`n`n========================================" -ForegroundColor Cyan
Write-Host "测试结果汇总" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "框架名称`t`t状态`t`tURL" -ForegroundColor Yellow
Write-Host "--------`t`t----`t`t---" -ForegroundColor Yellow

foreach ($result in $results) {
    $status = $result.Status
    $color = if ($status -eq "成功") { "Green" } else { "Red" }
    $tabs = if ($result.Framework.Length -lt 8) { "`t`t" } else { "`t" }
    Write-Host "$($result.Framework)$tabs$status`t`t$($result.URL)" -ForegroundColor $color
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ 成功: $successCount" -ForegroundColor Green
Write-Host "❌ 失败: $failCount" -ForegroundColor Red
Write-Host "📊 总计: $($results.Count)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 输出失败的详细信息
if ($failCount -gt 0) {
    Write-Host "`n失败详情:" -ForegroundColor Red
    foreach ($result in $results) {
        if ($result.Status -ne "成功") {
            Write-Host "`n框架: $($result.Framework)" -ForegroundColor Yellow
            Write-Host "状态: $($result.Status)" -ForegroundColor Red
            Write-Host "错误: $($result.Error)" -ForegroundColor Red
        }
    }
}

