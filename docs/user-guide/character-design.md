# 角色设计

为视频设计和管理角色。

## 角色结构

```typescript
interface Character {
  id: string;
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'extra';
  description: string;
  appearance: CharacterAppearance;
  consistency: CharacterConsistency;
  voice?: TTSVoice;
  tags: string[];
}
```

## 一致性管理

AI 图像生成中保持一致的角色外观：

```typescript
interface CharacterConsistency {
  seed: number;
  weights?: Record<string, number>;
  referenceImages: string[];
}
```

### 保持一致性

1. **设置种子**：锁定随机种子获得可重复结果
2. **添加参考**：上传 3+ 参考图片
3. **定义权重**：调整特征重要性（如 `{ "face": 0.9, "hair": 0.7 }`）

## 角色模板

| 模板                  | 说明     |
| --------------------- | -------- |
| `professional_male`   | 商务装束 |
| `professional_female` | 商务装束 |
| `casual_youth`        | 现代休闲 |
| `fantasy_hero`        | 史诗奇幻 |
| `sci_fi_crew`         | 科幻太空 |

## 最佳实践

- 使用 3+ 参考图片获得最佳一致性
- 为每个角色创建 4-6 个表情变体
- 将 TTS 语音与角色性格匹配
