# 分镜设计

将脚本转换为可视化分镜面板。

## StoryboardFrame 结构

```typescript
interface StoryboardFrame {
  id: string;
  title: string;
  sceneDescription: string;
  composition: string;
  cameraType: CameraType; // wide | medium | closeup | pan | tilt | dolly
  dialogue?: string;
  duration: number;
  imageUrl?: string;
}
```

## 摄像机类型

| 类型      | 说明 | 用途       |
| --------- | ---- | ---------- |
| `wide`    | 全景 | 场景设定   |
| `medium`  | 中景 | 对话       |
| `closeup` | 特写 | 情感、细节 |
| `pan`     | 横摇 | 跟随动作   |
| `tilt`    | 竖摇 | 垂直揭示   |
| `dolly`   | 推拉 | 强调       |

## 构图类型

`center`（中心构图）· `rule-of-thirds`（三分法）· `diagonal`（对角线）· `symmetrical`（对称式）· `triangular`（三角形）

## 故事板编辑器

- **左侧**：帧列表（缩略图）
- **中间**：预览/编辑所选帧
- **右侧**：帧属性

### 操作

1. **生成帧**：AI 从脚本生成帧
2. **添加帧**：手动插入新帧
3. **删除帧**：删除选中帧
4. **重新排序**：拖动重新排序
5. **生成图片**：为帧创建图片
6. **批量生成**：一次生成所有帧图片

## 最佳实践

- 包含场景设定的全景 + 情感特写
- 变化镜头类型保持视觉兴趣
- 每帧通常 3-5 秒
