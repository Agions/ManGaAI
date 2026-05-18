# 配置

panel-flow 的配置选项。

## 环境变量

在项目根目录创建 `.env.local`：

### 文字生成模型

```bash
# 智谱 GLM-5
VITE_ALIBABA_API_KEY=your_key

# MiniMax M2.5
VITE_MINIMAX_API_KEY=your_key

# 月之暗面 Kimi K2.5
VITE_KIMI_API_KEY=your_key

# 字节 Doubao 2.0
VITE_DOUBAO_API_KEY=your_key

# 阿里云 Qwen 2.5
VITE_QWEN_API_KEY=your_key

# 百度 ERNIE 4.0
VITE_ERNIE_API_KEY=your_key
```

### 图像生成

```bash
# 字节 Seedream 5.0
VITE_SEEDDREAM_API_KEY=your_key

# 快手 Kling 1.6
VITE_KLING_API_KEY=your_key
```

### 语音合成

```bash
# TTS 提供商：edge | cosyvoice | kantts
VITE_TTS_PROVIDER=edge

# 阿里云 CosyVoice 2.0（如使用 cosyvoice）
VITE_COSYVOICE_API_KEY=your_key
```

### 应用配置

```bash
VITE_APP_MODE=web|desktop
VITE_API_BASE_URL=https://api.example.com
```

## 支持的模型（v1.0.0）

### 文字生成

| 模型       | 提供商   | 上下文 |
| ---------- | -------- | ------ |
| GLM-5      | 智谱 AI  | 128k   |
| M2.5       | MiniMax  | 128k   |
| Kimi K2.5  | 月之暗面 | 200k   |
| Doubao 2.0 | 字节跳动 | 128k   |
| Qwen 2.5   | 阿里云   | 128k   |
| ERNIE 4.0  | 百度     | 128k   |

### 图像生成

| 模型         | 提供商   | 特性              |
| ------------ | -------- | ----------------- |
| Seedream 5.0 | 字节跳动 | 2K直出、AI 4K增强 |
| Kling 1.6    | 快手     | 图像+视频生成     |
| Vidu 2.0     | 生数科技 | 高一致性          |

### 语音合成

| 服务          | 提供商 | 特性               |
| ------------- | ------ | ------------------ |
| Edge TTS      | 微软   | 免费、中文优化     |
| CosyVoice 2.0 | 阿里云 | 3秒克隆、方言/情感 |
| KAN-TTS       | 阿里云 | 神经网络、多语言   |
