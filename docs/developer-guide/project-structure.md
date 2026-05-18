# 项目结构

panel-flow 的详细文件组织。

## 根目录结构

```
PanelFlow/
├── .github/                    # GitHub 工作流和模板
│   ├── workflows/            # CI/CD 流水线
│   ├── ISSUES_TEMPLATE/       # Issue 模板
│   └── PULL_REQUEST_TEMPLATE.md
├── public/                     # 静态资源
├── src/                        # 源代码
├── src-tauri/                  # Tauri 桌面端（Rust）
├── docs/                       # VitePress 文档
├── scripts/                    # 构建脚本
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 源代码结构 (`src/`)

```
src/
├── App.tsx                   # 根组件
├── main.tsx                  # 入口文件
├── ErrorBoundary.tsx         # 错误边界
│
├── components/ui/            # shadcn/ui 扁平组件
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── select.tsx
│   └── ...                   # 每个组件独立文件
│
├── pages/                    # 路由级页面
│   ├── HomePage.tsx
│   ├── ProjectEditPage.tsx
│   └── SettingsPage.tsx
│
├── features/                 # 功能模块 (DDD)
│   ├── ai/                   # AI 模型选择
│   ├── audio/                # 音频处理
│   ├── character/            # 角色管理
│   ├── cost/                 # 成本追踪
│   ├── editor/               # 可视化编辑器（Timeline/SimpleTimeline）
│   ├── export/               # 导出功能
│   ├── home/                 # 首页
│   ├── manga-pipeline/       # 漫画流水线
│   ├── notification/         # 通知系统
│   ├── project/              # 项目管理
│   ├── script/               # 脚本生成
│   ├── storyboard/           # 分镜编辑
│   ├── subtitle/             # 字幕编辑
│   ├── video/                # 视频播放/导出
│   └── video-export/         # 视频导出
│
├── shared/                   # 共享基础设施
│   ├── components/ui/       # 可复用 UI 组件
│   ├── hooks/               # useDebounce, useLocalStorage 等
│   ├── services/            # API 客户端、存储抽象
│   ├── stores/              # Zustand 状态存储
│   ├── types/               # 共享类型
│   └── utils/               # formatTime, debounce 等
│
└── core/                     # 核心服务
    ├── config/              # 应用配置
    ├── constants/           # 常量
    ├── data/                # 静态数据
    ├── hooks/               # 核心 Hooks
    ├── pipeline/            # 流水线引擎
    ├── router/              # 路由工具
    └── services/            # AI、TTS、图像生成等 30+ 服务
```

## 功能模块模式

每个功能遵循此结构：

```
features/[名称]/
├── components/
│   └── FeatureName.tsx      # 主组件
├── hooks/
│   └── useFeatureName.ts    # 自定义 Hooks
├── services/
│   └── feature.service.ts    # 业务逻辑
├── types/
│   └── types.ts              # 功能特定类型
└── index.ts                  # 公开 API (桶导出)
```

## 命名规范

| 类型     | 规范                      | 示例                  |
| -------- | ------------------------- | --------------------- |
| 组件     | PascalCase                | `WorkflowEditor.tsx`  |
| Hooks    | camelCase 带 `use` 前缀   | `useWorkflow.ts`      |
| 服务     | camelCase                 | `workflow.service.ts` |
| 类型     | PascalCase                | `WorkflowState.ts`    |
| 存储     | camelCase 带 `store` 后缀 | `workflowStore.ts`    |
| 工具函数 | camelCase                 | `formatDate.ts`       |
| 常量     | SCREAMING_SNAKE           | `MAX_FILE_SIZE`       |

## 导入路径

```typescript
// shadcn/ui 组件 — 直接导入（推荐）
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';

// shared 共享模块
import { useDebounce } from '@/shared/hooks';
import { projectStore } from '@/shared/stores';
import type { Project } from '@/shared/types';

// features 功能模块
import { scriptService } from '@/features/script';

// core 核心服务
import { aiService } from '@/core/services';
import { pipelineService } from '@/core/services';

// 相对导入（用于近邻文件）
import { useState } from 'react';
import './styles.css';
```

> **注意**：`@/components/ui/ui-components` 桶导出已废弃，请直接导入 `@/components/ui/button` 等。

## 关键文件

| 文件                      | 用途             |
| ------------------------- | ---------------- |
| `src/App.tsx`             | 根组件，路由配置 |
| `src/main.tsx`            | 入口文件         |
| `src/shared/stores/*.ts`  | Zustand 状态存储 |
| `src/core/services/*.ts`  | 核心服务实现     |
| `src/features/*/index.ts` | 功能公开 API     |
