# 启动所有框架示例项目
# 用于检查配置面板显示情况

Write-Host "🚀 启动所有框架示例项目..." -ForegroundColor Green
Write-Host ""

$projectRoot = $PSScriptRoot

# 定义所有框架及其端口
$frameworks = @()
$frameworks += @{name="Vue3"; path="packages\vue3\example"; port=5174}
$frameworks += @{name="React"; path="packages\react\example"; port=5175}
$frameworks += @{name="Vue2"; path="packages\vue2\example"; port=5176}
$frameworks += @{name="Svelte"; path="packages\svelte\example"; port=5177}
$frameworks += @{name="Lit"; path="packages\lit\example"; port=5178}
$frameworks += @{name="Angular"; path="packages\angular\example"; port=5179}
$frameworks += @{name="Qwik"; path="packages\qwik\example"; port=5180}
$frameworks += @{name="Preact"; path="packages\preact\example"; port=5181}
$frameworks += @{name="Solid"; path="packages\solid\example"; port=5182}

$processes = @()

foreach ($fw in $frameworks) {
    $fullPath = Join-Path $projectRoot $fw.path
    
    if (Test-Path $fullPath) {
        Write-Host "启动 $($fw.name) (端口 $($fw.port))..." -ForegroundColor Cyan
        
        # 启动新的PowerShell窗口运行dev命令
        $process = Start-Process powershell -ArgumentList `
            "-NoExit", `
            "-Command", `
            "cd '$fullPath'; Write-Host '🚀 启动 $($fw.name) 示例...' -ForegroundColor Green; pnpm dev" `
            -PassThru
        
        $processes += @{
            Name = $fw.name
            Port = $fw.port
            Process = $process
        }
        
        Start-Sleep -Seconds 2
    } else {
        Write-Host "⚠️  $($fw.name) 示例目录不存在: $fullPath" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ 所有示例项目已启动!" -ForegroundColor Green
Write-Host ""
Write-Host "访问地址:" -ForegroundColor Cyan
Write-Host "  Vue3:    http://localhost:5174/#/" -ForegroundColor White
Write-Host "  React:   http://localhost:5175/" -ForegroundColor White
Write-Host "  Vue2:    http://localhost:5176/#/" -ForegroundColor White
Write-Host "  Svelte:  http://localhost:5177/" -ForegroundColor White
Write-Host "  Lit:     http://localhost:5178/" -ForegroundColor White
Write-Host "  Angular: http://localhost:5179/#/" -ForegroundColor White
Write-Host "  Qwik:    http://localhost:5180/" -ForegroundColor White
Write-Host "  Preact:  http://localhost:5181/" -ForegroundColor White
Write-Host "  Solid:   http://localhost:5182/" -ForegroundColor White
Write-Host ""
Write-Host "按 Ctrl+C 停止所有服务..." -ForegroundColor Yellow
Write-Host ""

# 等待用户中断
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host ""
    Write-Host "🛑 正在停止所有服务..." -ForegroundColor Yellow
    foreach ($proc in $processes) {
        if ($proc.Process -and !$proc.Process.HasExited) {
            Stop-Process -Id $proc.Process.Id -Force -ErrorAction SilentlyContinue
            Write-Host "  已停止 $($proc.Name)" -ForegroundColor Gray
        }
    }
    Write-Host "✅ 所有服务已停止" -ForegroundColor Green
}

