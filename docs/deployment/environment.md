# 环境变量

panel-flow 环境变量配置说明。

## 变量命名规范

| 前缀    | 用途                     |
| ------- | ------------------------ |
| `VITE_` | 客户端侧（暴露给浏览器） |

## AI 提供商配置

### 文字生成

```bash
VITE_MINIMAX_API_KEY=your_key
VITE_ALIBABA_API_KEY=your_key
VITE_KIMI_API_KEY=your_key
VITE_DOUBAO_API_KEY=your_key
VITE_QWEN_API_KEY=your_key
VITE_ERNIE_API_KEY=your_key
```

### 图像生成

```bash
VITE_SEEDDREAM_API_KEY=your_key
VITE_KLING_API_KEY=your_key
```

### 语音合成

```bash
VITE_TTS_PROVIDER=edge  # edge | cosyvoice | kantts
```

## 应用配置

```bash
VITE_APP_MODE=web              # web | desktop
VITE_APP_NAME=panel-flow
VITE_API_BASE_URL=https://api.example.com
```

## .env 文件

**重要：切勿将 `.env` 文件提交到版本控制**。`.gitignore` 已包含以下规则：

```
.env
.env.local
.env.*.local
```

## 配置示例

创建 `.env.local` 文件进行本地开发配置：

```bash
VITE_APP_MODE=web
VITE_APP_NAME=panel-flow-dev
VITE_API_BASE_URL=http://localhost:3000
VITE_MINIMAX_API_KEY=your_dev_key
```
