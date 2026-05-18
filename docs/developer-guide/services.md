# 服务

panel-flow 的核心服务实现。

## 服务架构

```
┌─────────────────────────────────────────────────────────────┐
│                      应用层                                  │
├─────────────────────────────────────────────────────────────┤
│  features/  →  功能特定的业务逻辑                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      核心服务层                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ai.service.ts           - 统一 AI 提供商接口               │
│  image-generation.service.ts - 图像生成                      │
│  tts.service.ts          - 文本转语音                       │
│  lip-sync.service.ts     - 唇音同步                         │
│  pipeline.service.ts     - 流水线引擎                       │
│  storyboard.service.ts  - 分镜管理                          │
│  character.service.ts   - 角色管理                          │
│  subtitle.service.ts    - 字幕生成与导出                    │
│  video-analysis.service.ts - 视频分析                       │
│  video-compositor.service.ts - 视频合成                     │
│  evaluation.service.ts   - 质量评测                         │
│  cost.service.ts         - 成本追踪                          │
│  quality-gate.service.ts - 质量门禁                         │
│                                                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      基础设施层                              │
├─────────────────────────────────────────────────────────────┤
│  apiClient.ts           - HTTP 客户端                       │
│  storage.service.ts      - 本地/云存储                       │
└─────────────────────────────────────────────────────────────┘
```

## AI 服务

统一的 AI 文本生成接口。

```typescript
import { aiService } from '@/core/services';

const result = await aiService.generate('写一个戏剧性场景', {
  provider: 'minimax',
  model: 'glm-5',
});
```

**支持的提供商**：智谱 (GLM-5) · MiniMax (M2.5) · 月之暗面 (Kimi K2.5) · 字节 (Doubao) · 阿里 (Qwen) · 百度 (ERNIE)

## 图像生成服务

```typescript
import { imageGenerationService } from '@/core/services';

const result = await imageGenerationService.generateImage({
  prompt: '现代城市夜景，电影级灯光',
  model: 'seedream-5.0',
  resolution: '16:9',
});
```

**支持的提供商**：Seedream 5.0（字节，推荐）· Kling 1.6（快手）· Vidu 2.0（生数）

## TTS 服务

```typescript
import { ttsService } from '@/core/services';

const result = await ttsService.synthesize({
  text: '欢迎使用 panel-flow',
  provider: 'edge',
  voice: 'zh-CN-XiaoxiaoNeural',
});
```

**提供商**：Edge TTS（免费）· CosyVoice 2.0（阿里）· KAN-TTS（阿里）

## 流水线服务

端到端视频生成流水线。

```typescript
import { pipelineService } from '@/core/services';

const result = await pipelineService.run({
  input: novelText,
  steps: ['import', 'analyze', 'script', 'storyboard', 'render', 'export'],
  options: { quality: 'high', resolution: '1080p' },
});
```

## 创建新服务

1. 在 `src/core/services/` 创建服务文件
2. 实现单例模式
3. 从 `src/core/services/index.ts` 导出

```typescript
// src/core/services/example.service.ts
class ExampleService {
  private static instance: ExampleService;

  static getInstance(): ExampleService {
    if (!ExampleService.instance) {
      ExampleService.instance = new ExampleService();
    }
    return ExampleService.instance;
  }
}

export const exampleService = ExampleService.getInstance();
```
