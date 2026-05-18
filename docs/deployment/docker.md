# Docker 部署

panel-flow 的 Docker 容器化部署。

## 快速开始

```bash
docker build -t panelflow .
docker run -p 8080:80 panelflow
```

## Docker Compose

```yaml
version: '3.8'
services:
  panelflow:
    build: .
    ports:
      - '8080:80'
    environment:
      - VITE_APP_MODE=web
      - VITE_APP_NAME=panel-flow
      - VITE_API_BASE_URL=https://api.example.com
      - VITE_MINIMAX_API_KEY=your_key
    restart: unless-stopped
```

## 多阶段构建

```dockerfile
# 构建阶段
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN corepack enable && pnpm install
COPY . .
RUN pnpm build

# 生产阶段
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 环境变量

```bash
# 构建时传入
docker build --build-arg VITE_MINIMAX_API_KEY=your_key -t panelflow .

# 运行时环境变量
docker run -p 8080:80 --env-file .env panelflow
```

## 构建产物

Docker 镜像构建产物为静态 Web 资源，部署在 Nginx 容器中。

## 注意事项

- 确保 `.env` 文件不包含在镜像中（已加入 `.dockerignore`）
- 生产环境建议使用 Docker Compose 或 Kubernetes 进行编排
