# 类型定义迁移说明

## 状态

- `legacy.types.ts` - 旧版类型定义，保留用于向后兼容
- `index.ts` - 新版统一类型定义

## 迁移对照表

### 已迁移类型

| 旧版 (legacy.types.ts) | 新版 (index.ts) |
|----------------------|-----------------|
| ScriptSegment | ScriptSegment |
| Script | ScriptData |
| ProjectData | ProjectData |
| VideoMetadata | VideoInfo |
| VideoAnalysis | VideoAnalysis |
| AIModelSettings | AIModelSettings |
| Timeline, TimelineSegment | Timeline (legacy export) |

### 仍在使用旧版的地方

- legacy 服务
- 旧版组件

## 推荐

新代码请使用 `index.ts` 中的类型定义：

```typescript
// 推荐
import type { ScriptData, VideoInfo, ScriptSegment } from '@/core/types';

// 不推荐（遗留代码）
import type { Script, ScriptSegment, ProjectData } from '@/core/types/legacy.types';
```
