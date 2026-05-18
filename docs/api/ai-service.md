# AI 服务

统一的 AI 文本生成接口，支持多个提供商。

## 导入

```typescript
import { aiService } from '@/core/services';
```

## generate()

```typescript
async generate(
  prompt: string,
  options?: GenerationOptions
): Promise<GenerationResult>
```

**参数：**

| 参数                  | 类型     | 说明          |
| --------------------- | -------- | ------------- |
| `prompt`              | `string` | 输入提示词    |
| `options.provider`    | `string` | AI 提供商     |
| `options.model`       | `string` | 模型名称      |
| `options.maxTokens`   | `number` | 最大 token 数 |
| `options.temperature` | `number` | 随机性 (0-2)  |

**示例：**

```typescript
const result = await aiService.generate('写一段戏剧性场景', {
  provider: 'minimax',
  model: 'm2.5',
  maxTokens: 1000,
});
console.log(result.content);
```

## analyze()

分析内容并提取结构化信息。

```typescript
async analyze(content: string, options?: AnalysisOptions): Promise<AnalysisResult>
```

## chat()

多轮对话。

```typescript
async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResult>
```

## 支持的提供商

| 提供商   | 模型       |
| -------- | ---------- |
| 智谱     | GLM-5      |
| MiniMax  | M2.5       |
| 月之暗面 | Kimi K2.5  |
| 字节跳动 | Doubao 2.0 |
| 阿里云   | Qwen 2.5   |
| 百度     | ERNIE 4.0  |
