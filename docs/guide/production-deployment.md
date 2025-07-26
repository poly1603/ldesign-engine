# 生产部署

本章将详细介绍如何将基于 @ldesign/engine 的应用部署到生产环境，包括服务器配置、容器化部署、CDN 配置和监控设置。

## 部署前准备

### 生产环境检查清单

```typescript
// scripts/pre-deploy-check.ts
interface DeploymentCheck {
  name: string
  check: () => Promise<boolean>
  required: boolean
  description: string
}

const deploymentChecks: DeploymentCheck[] = [
  {
    name: '环境变量',
    required: true,
    description: '检查所有必需的环境变量是否已设置',
    check: async () => {
      const requiredEnvs = [
        'VITE_API_BASE_URL',
        'VITE_APP_TITLE',
        'NODE_ENV'
      ]
      
      return requiredEnvs.every(env => process.env[env])
    }
  },
  {
    name: '构建产物',
    required: true,
    description: '检查构建产物是否存在且完整',
    check: async () => {
      const fs = await import('fs')
      const path = await import('path')
      
      const distDir = path.resolve(process.cwd(), 'dist')
      const requiredFiles = ['index.html', 'assets']
      
      return requiredFiles.every(file => 
        fs.existsSync(path.join(distDir, file))
      )
    }
  },
  {
    name: '依赖安全检查',
    required: true,
    description: '检查依赖包是否存在安全漏洞',
    check: async () => {
      try {
        const { execSync } = await import('child_process')
        execSync('npm audit --audit-level=high', { stdio: 'pipe' })
        return true
      } catch {
        return false
      }
    }
  },
  {
    name: '代码质量',
    required: false,
    description: '检查代码是否通过 ESLint 和类型检查',
    check: async () => {
      try {
        const { execSync } = await import('child_process')
        execSync('npm run lint', { stdio: 'pipe' })
        execSync('npm run type-check', { stdio: 'pipe' })
        return true
      } catch {
        return false
      }
    }
  },
  {
    name: '测试覆盖率',
    required: false,
    description: '检查测试覆盖率是否达到要求',
    check: async () => {
      try {
        const { execSync } = await import('child_process')
        const output = execSync('npm run test:coverage', { 
          encoding: 'utf8',
          stdio: 'pipe'
        })
        
        // 解析覆盖率报告
        const coverageMatch = output.match(/All files\s+\|\s+(\d+\.?\d*)%/)
        const coverage = coverageMatch ? parseFloat(coverageMatch[1]) : 0
        
        return coverage >= 80 // 要求 80% 覆盖率
      } catch {
        return false
      }
    }
  }
]

async function runDeploymentChecks(): Promise<void> {
  console.log('🔍 开始部署前检查...')
  
  const results = await Promise.all(
    deploymentChecks.map(async (check) => {
      try {
        const passed = await check.check()
        return { ...check, passed }
      } catch (error) {
        return { ...check, passed: false, error }
      }
    })
  )
  
  console.log('\n📋 检查结果:')
  console.log('=' .repeat(60))
  
  let hasRequiredFailures = false
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌'
    const required = result.required ? '[必需]' : '[可选]'
    
    console.log(`${status} ${required} ${result.name}: ${result.description}`)
    
    if (!result.passed && result.required) {
      hasRequiredFailures = true
    }
    
    if (result.error) {
      console.log(`   错误: ${result.error}`)
    }
  })
  
  console.log('\n' + '=' .repeat(60))
  
  if (hasRequiredFailures) {
    console.error('❌ 部署前检查失败，请修复必需项后重试')
    process.exit(1)
  } else {
    console.log('✅ 部署前检查通过，可以继续部署')
  }
}

// 运行检查
if (require.main === module) {
  runDeploymentChecks().catch(console.error)
}

export { runDeploymentChecks }
```

### 环境配置

```bash
# .env.production
NODE_ENV=production
VITE_APP_TITLE=LDesign Engine
VITE_API_BASE_URL=https://api.example.com
VITE_CDN_BASE_URL=https://cdn.example.com
VITE_SENTRY_DSN=https://your-sentry-dsn
VITE_ANALYTICS_ID=GA_MEASUREMENT_ID
VITE_DEBUG=false
VITE_LOG_LEVEL=error

# 服务器配置
PORT=3000
HOST=0.0.0.0
SSL_CERT_PATH=/etc/ssl/certs/cert.pem
SSL_KEY_PATH=/etc/ssl/private/key.pem

# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
REDIS_URL=redis://localhost:6379

# 监控配置
MONITORING_ENABLED=true
HEALTH_CHECK_ENDPOINT=/health
METRICS_ENDPOINT=/metrics
```

## 静态文件部署

### Nginx 配置

```nginx
# /etc/nginx/sites-available/ldesign-engine
server {
    listen 80;
    listen [::]:80;
    server_name example.com www.example.com;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name example.com www.example.com;
    
    # SSL 配置
    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # 根目录
    root /var/www/ldesign-engine/dist;
    index index.html;
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Brotli 压缩（如果支持）
    brotli on;
    brotli_comp_level 6;
    brotli_types
        text/plain
        text/css
        application/json
        application/javascript
        text/xml
        application/xml
        application/xml+rss
        text/javascript;
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary "Accept-Encoding";
        
        # 预压缩文件
        location ~* \.(js|css)$ {
            gzip_static on;
            brotli_static on;
        }
    }
    
    # HTML 文件缓存
    location ~* \.html$ {
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
        add_header Vary "Accept-Encoding";
    }
    
    # API 代理
    location /api/ {
        proxy_pass http://backend-server;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
        
        # 预加载关键资源
        location = /index.html {
            add_header Link "</assets/main.js>; rel=preload; as=script";
            add_header Link "</assets/main.css>; rel=preload; as=style";
        }
    }
    
    # 健康检查
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # 禁止访问敏感文件
    location ~ /\. {
        deny all;
    }
    
    location ~ /(package\.json|package-lock\.json|yarn\.lock)$ {
        deny all;
    }
}

# 后端服务器配置
upstream backend-server {
    server 127.0.0.1:8080;
    # 可以添加多个服务器实现负载均衡
    # server 127.0.0.1:8081;
    # server 127.0.0.1:8082;
}
```

### Apache 配置

```apache
# /etc/apache2/sites-available/ldesign-engine.conf
<VirtualHost *:80>
    ServerName example.com
    ServerAlias www.example.com
    
    # 重定向到 HTTPS
    Redirect permanent / https://example.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName example.com
    ServerAlias www.example.com
    DocumentRoot /var/www/ldesign-engine/dist
    
    # SSL 配置
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/cert.pem
    SSLCertificateKeyFile /etc/ssl/private/key.pem
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
    SSLCipherSuite ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384
    
    # 安全头
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    
    # 压缩
    LoadModule deflate_module modules/mod_deflate.so
    <Location />
        SetOutputFilter DEFLATE
        SetEnvIfNoCase Request_URI \
            \.(?:gif|jpe?g|png)$ no-gzip dont-vary
        SetEnvIfNoCase Request_URI \
            \.(?:exe|t?gz|zip|bz2|sit|rar)$ no-gzip dont-vary
    </Location>
    
    # 缓存配置
    <LocationMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
        Header set Cache-Control "public, immutable"
    </LocationMatch>
    
    <LocationMatch "\.html$">
        ExpiresActive On
        ExpiresDefault "access plus 1 hour"
        Header set Cache-Control "public, must-revalidate"
    </LocationMatch>
    
    # SPA 路由支持
    <Directory "/var/www/ldesign-engine/dist">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # API 代理
    ProxyPreserveHost On
    ProxyPass /api/ http://localhost:8080/
    ProxyPassReverse /api/ http://localhost:8080/
    
    # 日志
    ErrorLog ${APACHE_LOG_DIR}/ldesign-engine_error.log
    CustomLog ${APACHE_LOG_DIR}/ldesign-engine_access.log combined
</VirtualHost>
```

## 容器化部署

### Dockerfile

```dockerfile
# 多阶段构建
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./
COPY pnpm-lock.yaml ./

# 安装 pnpm
RUN npm install -g pnpm

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN pnpm run build

# 生产阶段
FROM nginx:alpine AS production

# 安装必要工具
RUN apk add --no-cache curl

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf /etc/nginx/conf.d/default.conf

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 创建非 root 用户
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001

# 设置权限
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# 创建 PID 目录
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# 切换到非 root 用户
USER nginx

# 暴露端口
EXPOSE 80

# 启动命令
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  # 前端应用
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: ldesign-engine-frontend
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/ssl:ro
      - ./logs:/var/log/nginx
    environment:
      - NODE_ENV=production
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - app-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`example.com`)"
      - "traefik.http.routers.frontend.tls=true"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
  
  # 后端 API
  backend:
    image: ldesign-engine-api:latest
    container_name: ldesign-engine-backend
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - database
      - redis
    restart: unless-stopped
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
  
  # 数据库
  database:
    image: postgres:15-alpine
    container_name: ldesign-engine-db
    environment:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 30s
      timeout: 10s
      retries: 3
  
  # Redis 缓存
  redis:
    image: redis:7-alpine
    container_name: ldesign-engine-redis
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
  
  # 监控
  prometheus:
    image: prom/prometheus:latest
    container_name: ldesign-engine-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
    restart: unless-stopped
    networks:
      - app-network
  
  # 日志收集
  grafana:
    image: grafana/grafana:latest
    container_name: ldesign-engine-grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
    restart: unless-stopped
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  app-network:
    driver: bridge
```

### Kubernetes 部署

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ldesign-engine

---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ldesign-engine-config
  namespace: ldesign-engine
data:
  NODE_ENV: "production"
  API_BASE_URL: "https://api.example.com"
  LOG_LEVEL: "info"

---
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: ldesign-engine-secret
  namespace: ldesign-engine
type: Opaque
data:
  DATABASE_URL: <base64-encoded-database-url>
  JWT_SECRET: <base64-encoded-jwt-secret>
  REDIS_URL: <base64-encoded-redis-url>

---
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ldesign-engine-frontend
  namespace: ldesign-engine
  labels:
    app: ldesign-engine-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ldesign-engine-frontend
  template:
    metadata:
      labels:
        app: ldesign-engine-frontend
    spec:
      containers:
      - name: frontend
        image: ldesign-engine:latest
        ports:
        - containerPort: 80
        envFrom:
        - configMapRef:
            name: ldesign-engine-config
        - secretRef:
            name: ldesign-engine-secret
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL

---
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: ldesign-engine-frontend-service
  namespace: ldesign-engine
spec:
  selector:
    app: ldesign-engine-frontend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: ClusterIP

---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ldesign-engine-ingress
  namespace: ldesign-engine
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
spec:
  tls:
  - hosts:
    - example.com
    secretName: ldesign-engine-tls
  rules:
  - host: example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ldesign-engine-frontend-service
            port:
              number: 80

---
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ldesign-engine-frontend-hpa
  namespace: ldesign-engine
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ldesign-engine-frontend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## CDN 配置

### CloudFlare 配置

```javascript
// cloudflare-worker.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // 静态资源缓存策略
  if (isStaticAsset(url.pathname)) {
    return handleStaticAsset(request)
  }
  
  // API 请求
  if (url.pathname.startsWith('/api/')) {
    return handleApiRequest(request)
  }
  
  // SPA 路由
  return handleSpaRouting(request)
}

function isStaticAsset(pathname) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot']
  return staticExtensions.some(ext => pathname.endsWith(ext))
}

async function handleStaticAsset(request) {
  const cache = caches.default
  const cacheKey = new Request(request.url, request)
  
  // 检查缓存
  let response = await cache.match(cacheKey)
  
  if (!response) {
    // 从源站获取
    response = await fetch(request)
    
    if (response.ok) {
      // 设置缓存头
      const headers = new Headers(response.headers)
      headers.set('Cache-Control', 'public, max-age=31536000, immutable')
      headers.set('Vary', 'Accept-Encoding')
      
      response = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      })
      
      // 缓存响应
      event.waitUntil(cache.put(cacheKey, response.clone()))
    }
  }
  
  return response
}

async function handleApiRequest(request) {
  // API 请求不缓存，直接转发
  const response = await fetch(request)
  
  // 添加 CORS 头
  const headers = new Headers(response.headers)
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}

async function handleSpaRouting(request) {
  const url = new URL(request.url)
  
  // 对于 SPA 路由，返回 index.html
  if (!url.pathname.includes('.')) {
    const indexRequest = new Request(url.origin + '/index.html', request)
    return fetch(indexRequest)
  }
  
  return fetch(request)
}
```

### AWS CloudFront 配置

```json
{
  "DistributionConfig": {
    "CallerReference": "ldesign-engine-distribution",
    "Comment": "LDesign Engine CDN Distribution",
    "DefaultRootObject": "index.html",
    "Origins": {
      "Quantity": 1,
      "Items": [
        {
          "Id": "S3-ldesign-engine",
          "DomainName": "ldesign-engine.s3.amazonaws.com",
          "S3OriginConfig": {
            "OriginAccessIdentity": "origin-access-identity/cloudfront/ABCDEFG1234567"
          }
        }
      ]
    },
    "DefaultCacheBehavior": {
      "TargetOriginId": "S3-ldesign-engine",
      "ViewerProtocolPolicy": "redirect-to-https",
      "TrustedSigners": {
        "Enabled": false,
        "Quantity": 0
      },
      "ForwardedValues": {
        "QueryString": false,
        "Cookies": {
          "Forward": "none"
        }
      },
      "MinTTL": 0,
      "DefaultTTL": 86400,
      "MaxTTL": 31536000,
      "Compress": true
    },
    "CacheBehaviors": {
      "Quantity": 3,
      "Items": [
        {
          "PathPattern": "*.js",
          "TargetOriginId": "S3-ldesign-engine",
          "ViewerProtocolPolicy": "redirect-to-https",
          "MinTTL": 31536000,
          "DefaultTTL": 31536000,
          "MaxTTL": 31536000,
          "Compress": true
        },
        {
          "PathPattern": "*.css",
          "TargetOriginId": "S3-ldesign-engine",
          "ViewerProtocolPolicy": "redirect-to-https",
          "MinTTL": 31536000,
          "DefaultTTL": 31536000,
          "MaxTTL": 31536000,
          "Compress": true
        },
        {
          "PathPattern": "/api/*",
          "TargetOriginId": "API-Gateway",
          "ViewerProtocolPolicy": "redirect-to-https",
          "MinTTL": 0,
          "DefaultTTL": 0,
          "MaxTTL": 0,
          "Compress": false
        }
      ]
    },
    "CustomErrorResponses": {
      "Quantity": 2,
      "Items": [
        {
          "ErrorCode": 403,
          "ResponsePagePath": "/index.html",
          "ResponseCode": "200",
          "ErrorCachingMinTTL": 300
        },
        {
          "ErrorCode": 404,
          "ResponsePagePath": "/index.html",
          "ResponseCode": "200",
          "ErrorCachingMinTTL": 300
        }
      ]
    },
    "Enabled": true,
    "PriceClass": "PriceClass_All"
  }
}
```

## 监控和日志

### 应用监控

```typescript
// src/monitoring/index.ts
import { Engine } from '@ldesign/engine'

interface MonitoringConfig {
  enabled: boolean
  endpoint: string
  apiKey: string
  sampleRate: number
  environment: string
}

class ApplicationMonitoring {
  private config: MonitoringConfig
  private metrics: Map<string, number> = new Map()
  private errors: Array<any> = []
  
  constructor(config: MonitoringConfig) {
    this.config = config
    this.setupMonitoring()
  }
  
  private setupMonitoring() {
    if (!this.config.enabled) return
    
    // 性能监控
    this.setupPerformanceMonitoring()
    
    // 错误监控
    this.setupErrorMonitoring()
    
    // 用户行为监控
    this.setupUserBehaviorMonitoring()
    
    // 定期发送数据
    setInterval(() => {
      this.sendMetrics()
    }, 30000) // 每30秒发送一次
  }
  
  private setupPerformanceMonitoring() {
    // 页面加载性能
    if (typeof window !== 'undefined' && window.performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
          
          this.recordMetric('page_load_time', navigation.loadEventEnd - navigation.fetchStart)
          this.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart)
          this.recordMetric('first_paint', this.getFirstPaint())
          this.recordMetric('first_contentful_paint', this.getFirstContentfulPaint())
        }, 0)
      })
    }
    
    // 资源加载性能
    if (typeof window !== 'undefined') {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming
            this.recordMetric(`resource_load_time_${this.getResourceType(resourceEntry.name)}`, resourceEntry.duration)
          }
        })
      })
      
      observer.observe({ entryTypes: ['resource'] })
    }
  }
  
  private setupErrorMonitoring() {
    // 全局错误捕获
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.recordError({
          type: 'javascript_error',
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack,
          timestamp: new Date().toISOString()
        })
      })
      
      window.addEventListener('unhandledrejection', (event) => {
        this.recordError({
          type: 'unhandled_promise_rejection',
          message: event.reason?.message || String(event.reason),
          stack: event.reason?.stack,
          timestamp: new Date().toISOString()
        })
      })
    }
    
    // 引擎错误监控
    if (this.engine) {
      this.engine.on('error', (error, context) => {
        this.recordError({
          type: 'engine_error',
          message: error.message,
          stack: error.stack,
          context,
          timestamp: new Date().toISOString()
        })
      })
    }
  }
  
  private setupUserBehaviorMonitoring() {
    if (typeof window === 'undefined') return
    
    // 页面访问
    this.recordEvent('page_view', {
      url: window.location.href,
      referrer: document.referrer,
      timestamp: new Date().toISOString()
    })
    
    // 用户交互
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      if (target.tagName === 'BUTTON' || target.tagName === 'A') {
        this.recordEvent('user_interaction', {
          type: 'click',
          element: target.tagName,
          text: target.textContent?.slice(0, 50),
          timestamp: new Date().toISOString()
        })
      }
    })
    
    // 页面停留时间
    let startTime = Date.now()
    window.addEventListener('beforeunload', () => {
      const duration = Date.now() - startTime
      this.recordMetric('page_duration', duration)
    })
  }
  
  private getFirstPaint(): number {
    const paintEntries = performance.getEntriesByType('paint')
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')
    return firstPaint ? firstPaint.startTime : 0
  }
  
  private getFirstContentfulPaint(): number {
    const paintEntries = performance.getEntriesByType('paint')
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint')
    return firstContentfulPaint ? firstContentfulPaint.startTime : 0
  }
  
  private getResourceType(url: string): string {
    if (url.endsWith('.js')) return 'javascript'
    if (url.endsWith('.css')) return 'stylesheet'
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image'
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font'
    return 'other'
  }
  
  private recordMetric(name: string, value: number) {
    this.metrics.set(name, value)
  }
  
  private recordError(error: any) {
    this.errors.push(error)
    
    // 立即发送严重错误
    if (this.isCriticalError(error)) {
      this.sendErrorImmediately(error)
    }
  }
  
  private recordEvent(name: string, data: any) {
    // 采样
    if (Math.random() > this.config.sampleRate) return
    
    this.sendEvent(name, data)
  }
  
  private isCriticalError(error: any): boolean {
    const criticalPatterns = [
      'ChunkLoadError',
      'Network Error',
      'Authentication Failed'
    ]
    
    return criticalPatterns.some(pattern => 
      error.message?.includes(pattern)
    )
  }
  
  private async sendMetrics() {
    if (this.metrics.size === 0 && this.errors.length === 0) return
    
    const payload = {
      timestamp: new Date().toISOString(),
      environment: this.config.environment,
      metrics: Object.fromEntries(this.metrics),
      errors: this.errors.splice(0), // 清空错误数组
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(payload)
      })
      
      // 清空已发送的指标
      this.metrics.clear()
    } catch (error) {
      console.error('发送监控数据失败:', error)
    }
  }
  
  private async sendErrorImmediately(error: any) {
    try {
      await fetch(this.config.endpoint + '/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          environment: this.config.environment,
          error,
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      })
    } catch (sendError) {
      console.error('发送错误数据失败:', sendError)
    }
  }
  
  private async sendEvent(name: string, data: any) {
    try {
      await fetch(this.config.endpoint + '/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          environment: this.config.environment,
          event: name,
          data,
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      })
    } catch (error) {
      console.error('发送事件数据失败:', error)
    }
  }
}

// 初始化监控
const monitoring = new ApplicationMonitoring({
  enabled: import.meta.env.PROD,
  endpoint: import.meta.env.VITE_MONITORING_ENDPOINT,
  apiKey: import.meta.env.VITE_MONITORING_API_KEY,
  sampleRate: 0.1, // 10% 采样率
  environment: import.meta.env.MODE
})

export default monitoring
```

## 部署自动化

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
  
  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.PROD_API_BASE_URL }}
          VITE_CDN_BASE_URL: ${{ secrets.PROD_CDN_BASE_URL }}
      
      - name: Run security audit
        run: npm audit --audit-level=high
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
  
  docker:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    permissions:
      contents: read
      packages: write
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist
          path: dist/
      
      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
  
  deploy:
    needs: [build, docker]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    environment:
      name: production
      url: https://example.com
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Kubernetes
        uses: azure/k8s-deploy@v1
        with:
          manifests: |
            k8s/namespace.yaml
            k8s/configmap.yaml
            k8s/secret.yaml
            k8s/deployment.yaml
            k8s/service.yaml
            k8s/ingress.yaml
          images: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          kubeconfig: ${{ secrets.KUBE_CONFIG }}
      
      - name: Verify deployment
        run: |
          kubectl rollout status deployment/ldesign-engine-frontend -n ldesign-engine
          kubectl get services -n ldesign-engine
      
      - name: Run smoke tests
        run: |
          sleep 30
          curl -f https://example.com/health || exit 1
          curl -f https://example.com/ || exit 1
      
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()
```

## 总结

生产部署是应用开发的最后一个关键环节。通过本章的学习，您应该掌握了：

### 关键部署要点

1. **部署前检查**：确保代码质量、安全性和完整性
2. **多种部署方式**：静态文件、容器化、Kubernetes
3. **CDN 配置**：优化全球访问速度
4. **监控和日志**：实时监控应用状态
5. **自动化部署**：CI/CD 流水线

### 最佳实践

- 使用多阶段构建减小镜像大小
- 配置适当的缓存策略
- 实施健康检查和自动恢复
- 设置监控和告警
- 使用蓝绿部署或滚动更新
- 定期备份和灾难恢复测试

通过遵循这些实践，您可以确保 @ldesign/engine 应用在生产环境中稳定、高效地运行。