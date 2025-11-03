# 修复所有框架适配包的 example package.json 文件
# 解决 PowerShell ConvertTo-Json 格式化问题和缺少依赖的问题

$ErrorActionPreference = "Stop"

# 定义框架配置
$frameworkConfigs = @{
    "alpinejs" = @{
        dependencies = @{
            "alpinejs" = "^3.13.0"
            "@ldesign/engine-core" = "workspace:*"
            "@ldesign/engine-alpinejs" = "workspace:*"
        }
        devDependencies = @{
            "@ldesign/launcher" = "workspace:*"
            "typescript" = "^5.3.0"
            "vite" = "^5.0.0"
        }
    }
    "angular" = @{
        dependencies = @{
            "@angular/core" = "^17.0.0"
            "@angular/common" = "^17.0.0"
            "@angular/platform-browser" = "^17.0.0"
            "@angular/platform-browser-dynamic" = "^17.0.0"
            "@ldesign/engine-core" = "workspace:*"
            "@ldesign/engine-angular" = "workspace:*"
        }
        devDependencies = @{
            "@ldesign/launcher" = "workspace:*"
            "@analogjs/vite-plugin-angular" = "^1.0.0"
            "typescript" = "^5.3.0"
            "vite" = "^5.0.0"
        }
    }
    "astro" = @{
        dependencies = @{
            "astro" = "^4.0.0"
            "@ldesign/engine-core" = "workspace:*"
            "@ldesign/engine-astro" = "workspace:*"
        }
        devDependencies = @{
            "@ldesign/launcher" = "workspace:*"
            "@astrojs/vite-plugin-astro" = "^1.0.0"
            "typescript" = "^5.3.0"
            "vite" = "^5.0.0"
        }
    }
    "preact" = @{
        dependencies = @{
            "preact" = "^10.19.0"
            "@ldesign/engine-core" = "workspace:*"
            "@ldesign/engine-preact" = "workspace:*"
        }
        devDependencies = @{
            "@ldesign/launcher" = "workspace:*"
            "@preact/preset-vite" = "^2.7.0"
            "typescript" = "^5.3.0"
            "vite" = "^5.0.0"
        }
    }
    "qwik" = @{
        dependencies = @{
            "@builder.io/qwik" = "^1.3.0"
            "@builder.io/qwik-city" = "^1.3.0"
            "@ldesign/engine-core" = "workspace:*"
            "@ldesign/engine-qwik" = "workspace:*"
        }
        devDependencies = @{
            "@ldesign/launcher" = "workspace:*"
            "@builder.io/qwik-vite" = "^1.3.0"
            "typescript" = "^5.3.0"
            "vite" = "^5.0.0"
        }
    }
    "remix" = @{
        dependencies = @{
            "@remix-run/react" = "^2.4.0"
            "@remix-run/node" = "^2.4.0"
            "react" = "^18.2.0"
            "react-dom" = "^18.2.0"
            "@ldesign/engine-core" = "workspace:*"
            "@ldesign/engine-remix" = "workspace:*"
        }
        devDependencies = @{
            "@ldesign/launcher" = "workspace:*"
            "@remix-run/dev" = "^2.4.0"
            "@types/react" = "^18.2.0"
            "@types/react-dom" = "^18.2.0"
            "typescript" = "^5.3.0"
            "vite" = "^5.0.0"
        }
    }
    "svelte" = @{
        dependencies = @{
            "svelte" = "^4.2.0"
            "@ldesign/engine-core" = "workspace:*"
            "@ldesign/engine-svelte" = "workspace:*"
        }
        devDependencies = @{
            "@ldesign/launcher" = "workspace:*"
            "@sveltejs/vite-plugin-svelte" = "^3.0.0"
            "svelte-check" = "^3.6.0"
            "tslib" = "^2.6.0"
            "typescript" = "^5.3.0"
            "vite" = "^5.0.0"
        }
    }
    "sveltekit" = @{
        dependencies = @{
            "svelte" = "^4.2.0"
            "@sveltejs/kit" = "^2.0.0"
            "@ldesign/engine-core" = "workspace:*"
            "@ldesign/engine-sveltekit" = "workspace:*"
        }
        devDependencies = @{
            "@ldesign/launcher" = "workspace:*"
            "@sveltejs/vite-plugin-svelte" = "^3.0.0"
            "svelte-check" = "^3.6.0"
            "tslib" = "^2.6.0"
            "typescript" = "^5.3.0"
            "vite" = "^5.0.0"
        }
    }
    "nextjs" = @{
        dependencies = @{
            "next" = "^14.0.0"
            "react" = "^18.2.0"
            "react-dom" = "^18.2.0"
            "@ldesign/engine-core" = "workspace:*"
            "@ldesign/engine-nextjs" = "workspace:*"
        }
        devDependencies = @{
            "@ldesign/launcher" = "workspace:*"
            "@types/react" = "^18.2.0"
            "@types/react-dom" = "^18.2.0"
            "typescript" = "^5.3.0"
            "vite" = "^5.0.0"
        }
    }
    "nuxtjs" = @{
        dependencies = @{
            "nuxt" = "^3.9.0"
            "vue" = "^3.4.0"
            "@ldesign/engine-core" = "workspace:*"
            "@ldesign/engine-nuxtjs" = "workspace:*"
        }
        devDependencies = @{
            "@ldesign/launcher" = "workspace:*"
            "typescript" = "^5.3.0"
            "vite" = "^5.0.0"
        }
    }
}

# 修复每个框架的 package.json
foreach ($framework in $frameworkConfigs.Keys) {
    $packageJsonPath = "packages\$framework\example\package.json"
    
    if (Test-Path $packageJsonPath) {
        Write-Host "修复 $framework 的 package.json..." -ForegroundColor Cyan
        
        $config = $frameworkConfigs[$framework]
        
        # 创建标准的 package.json 对象
        $packageJson = [ordered]@{
            name = "@ldesign/engine-$framework-example"
            version = "0.2.0"
            type = "module"
            private = $true
            description = "$framework Engine 示例项目 - 演示 createEngineApp 的使用"
            scripts = [ordered]@{
                dev = "launcher dev"
                build = "launcher build"
                preview = "launcher preview"
            }
            dependencies = $config.dependencies
            devDependencies = $config.devDependencies
        }
        
        # 转换为 JSON 并写入文件（使用标准格式）
        $jsonContent = $packageJson | ConvertTo-Json -Depth 10
        # 修复 PowerShell ConvertTo-Json 的格式问题
        $jsonContent = $jsonContent -replace '(?m)^\s+', '  ' # 统一缩进为2空格
        $jsonContent = $jsonContent -replace ':\s+', ': ' # 移除冒号后的多余空格
        
        # 写入文件
        [System.IO.File]::WriteAllText($packageJsonPath, $jsonContent, [System.Text.UTF8Encoding]::new($false))
        
        Write-Host "✓ $framework package.json 已修复" -ForegroundColor Green
    } else {
        Write-Host "⚠ 未找到 $packageJsonPath" -ForegroundColor Yellow
    }
}

Write-Host "`n所有 package.json 文件已修复完成！" -ForegroundColor Green
Write-Host "请运行 'pnpm install' 来安装依赖" -ForegroundColor Cyan

