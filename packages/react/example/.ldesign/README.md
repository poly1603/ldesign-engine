# .ldesign 配置（React Example）

此目录包含示例应用的完整应用配置（app.config.*）与启动器配置（launcher.config.*）。

- app.config.ts：基础应用配置（注入 import.meta.env.appConfig，可在客户端通过 @ldesign/launcher/client 读取，支持 HMR）
- app.config.[development|production|staging|test].ts：按环境覆盖基础配置
- launcher.config.ts：基础启动器（Vite）配置
- launcher.config.[development|production|staging|test].ts：按环境的启动器配置（端口、sourcemap、压缩、Define、缓存等）

客户端访问方式：
- React：import { useAppConfig } from '@ldesign/launcher/client/react'
- 通用：import { getAppConfig, getEnvironment } from '@ldesign/launcher/client'

