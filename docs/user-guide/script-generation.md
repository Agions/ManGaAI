# 脚本生成

从分析结果生成结构化视频脚本。

## 脚本格式

```typescript
interface Script {
  id: string;
  title: string;
  content: string;
  segments: ScriptSegment[];
}

interface ScriptSegment {
  id: string;
  type: 'narration' | 'dialogue' | 'action';
  startTime: number;
  endTime: number;
  content: string;
  character?: string;
  emotion?: string;
}
```

## 脚本风格

| 风格          | 适用场景   |
| ------------- | ---------- |
| `dramatic`    | 电影、短片 |
| `comedic`     | 喜剧、小品 |
| `documentary` | 教育内容   |
| `commercial`  | 广告、宣传 |

## 使用脚本编辑器

1. **查看脚本**：点击任意片段预览
2. **编辑内容**：双击编辑文本
3. **调整时间**：拖动片段边缘调整时长
4. **重新排序**：拖动片段重新排序
5. **添加片段**：点击 "+" 添加新片段

## 最佳实践

- 目标 60% 对话、40% 旁白
- 包含摄像机/屏幕方向指示
- 为清晰起见添加舞台指导
