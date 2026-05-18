# 图像生成

多提供商图像生成。

## 导入

```typescript
import { imageGenerationService } from '@/core/services';
```

## generateImage()

```typescript
async generateImage(options: ImageGenerationOptions): Promise<ImageResult>
```

**参数：**

| 参数                 | 类型     | 说明                      |
| -------------------- | -------- | ------------------------- |
| `options.prompt`     | `string` | 图像描述词                |
| `options.model`      | `string` | 模型名称                  |
| `options.resolution` | `string` | 分辨率，如 `16:9`、`9:16` |

**示例：**

```typescript
const result = await imageGenerationService.generateImage({
  prompt: '现代城市夜景，电影级灯光，温暖色调',
  model: 'seedream-5.0',
  resolution: '16:9',
});
```

## 支持的提供商

| 提供商   | 模型         | 适用场景         |
| -------- | ------------ | ---------------- |
| 字节跳动 | Seedream 5.0 | 动画、插画，推荐 |
| 快手     | Kling 1.6    | 图像+视频生成    |
| 生数科技 | Vidu 2.0     | 高一致性         |
