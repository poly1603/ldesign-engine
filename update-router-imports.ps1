# 批量更新所有 Engine 包的 Router 导入路径

$updates = @(
    @{ framework = 'solid'; file = 'packages/solid/src/engine-app.tsx' },
    @{ framework = 'svelte'; file = 'packages/svelte/src/engine-app.ts' },
    @{ framework = 'lit'; file = 'packages/lit/src/engine-app.ts' },
    @{ framework = 'preact'; file = 'packages/preact/src/engine-app.tsx' },
    @{ framework = 'qwik'; file = 'packages/qwik/src/engine-app.tsx' },
    @{ framework = 'angular'; file = 'packages/angular/src/engine-app.ts' },
    @{ framework = 'vue2'; file = 'packages/vue2/src/engine-app.ts' }
)

foreach ($update in $updates) {
    $framework = $update.framework
    $filePath = $update.file
    
    if (Test-Path $filePath) {
        Write-Host "Updating $filePath..."
        
        # 读取文件内容
        $content = Get-Content $filePath -Raw
        
        # 替换导入路径
        $oldImport = "import\('@ldesign/router'\)"
        $newImport = "import('@ldesign/router-$framework')"
        
        if ($content -match $oldImport) {
            $content = $content -replace $oldImport, $newImport
            
            # 同时更新错误消息中的包名
            $content = $content -replace "@ldesign/router\.", "@ldesign/router-$framework."
            $content = $content -replace "load @ldesign/router", "load @ldesign/router-$framework"
            
            # 写回文件
            Set-Content -Path $filePath -Value $content -NoNewline
            
            Write-Host "✓ Updated $framework" -ForegroundColor Green
        } else {
            Write-Host "○ $framework already updated or no router import found" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✗ $filePath not found" -ForegroundColor Red
    }
}

Write-Host "`nDone!" -ForegroundColor Cyan

