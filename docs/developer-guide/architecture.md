# 架构

panel-flow 采用基于功能模块化的 DDD 架构。

## 高层架构

```
┌──────────────────────────────────────────────────────────────────────┐
│                          panel-flow 应用                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│   │   页面      │───▶│  功能模块   │───▶│  共享模块   │             │
│   │  (路由)     │    │  (领域驱动) │    │  (通用)     │             │
│   └─────────────┘    └─────────────┘    └─────────────┘             │
│                           │                    │                    │
│                           ▼                    ▼                    │
│                    ┌─────────────────────────────┐                  │
│                    │      核心服务               │                  │
│                    │  (AI、流水线、工作流)        │                  │
│                    └─────────────────────────────┘                  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## 目录结构

```
src/
├── App.tsx                 # 应用入口
├── main.tsx               # React 渲染入口
├── ErrorBoundary.tsx      # 错误边界
├── components/ui/         # shadcn/ui 扁平组件（button.tsx, card.tsx 等）
├── pages/                 # 路由级页面
│   ├── HomePage.tsx
│   ├── ProjectEditPage.tsx
│   └── SettingsPage.tsx
├── features/              # 功能模块 (DDD)
│   ├── ai/                 # AI 模型选择
│   ├── audio/              # 音频处理
│   ├── character/          # 角色设计
│   ├── cost/               # 成本追踪
│   ├── editor/             # 可视化编辑器（Timeline/SimpleTimeline）
│   ├── export/             # 导出功能
│   ├── home/               # 首页
│   ├── manga-pipeline/     # 漫画流水线
│   ├── notification/       # 通知系统
│   ├── project/            # 项目管理
│   ├── script/             # 脚本生成
│   ├── storyboard/         # 分镜编辑器
│   ├── subtitle/           # 字幕编辑
│   ├── video/              # 视频播放
│   └── video-export/       # 视频导出
├── shared/                 # 共享基础设施
│   ├── components/ui/     # 可复用 UI 组件
│   ├── hooks/              # 可复用 React Hooks
│   ├── services/           # 存储/HTTP 等基础设施
│   ├── stores/             # Zustand 状态存储
│   ├── types/              # 共享类型定义
│   ├── utils/              # 工具函数
│   └── config/             # 共享配置
├── core/                   # 核心服务
│   ├── config/             # 工作流配置
│   ├── constants/          # 常量
│   ├── data/               # 静态数据
│   ├── hooks/              # 核心 Hooks
│   ├── pipeline/           # 流水线引擎
│   ├── router/             # 路由工具
│   └── services/           # 核心服务（AI、Cost、Pipeline 等 30+ 服务）
└── types/                  # 全局类型声明
```

## 功能模块结构

每个功能遵循一致的结构：

```
features/[功能名称]/
├── components/           # 功能特定的 React 组件
├── hooks/                # 功能特定的 Hooks
├── services/             # 功能特定的服务
├── types/                # 功能特定的类型
└── index.ts              # 公开 API (桶导出)
```

## 服务架构

### AI 服务层

```
┌─────────────────────────────────────────┐
│           AI 服务 (ai.service.ts)       │
├─────────────────────────────────────────┤
│  统一接口，支持所有 AI 提供商             │
│  - 智谱 (GLM-5)                         │
│  - MiniMax (M2.5)                       │
│  - 月之暗面 (Kimi K2.5)                  │
│  - 字节跳动 (Doubao, Seedream)            │
│  - 阿里云 (Qwen, CosyVoice)              │
│  - 百度 (ERNIE)                          │
└─────────────────────────────────────────┘
```

### 流水线服务

n8n 风格的可视化工作流引擎，编排 AI 服务：

```
PipelineService → StepService → CheckpointService
     ↓
  [AI分析] → [脚本生成] → [分镜] → [渲染] → [导出]
```

## 状态管理

### 存储架构

| 存储               | 用途              | 持久化       |
| ------------------ | ----------------- | ------------ |
| `projectStore`     | 项目数据          | localStorage |
| `workflowStore`    | 工作流状态        | localStorage |
| `appStore`         | UI 状态 (主题)    | 否           |
| `videoEditorStore` | 时间线/编辑器状态 | 否           |

## 安全性

- API 密钥存储在环境变量 (`VITE_*`)
- 密钥不暴露在客户端包中 (Tauri 桌面端)
- Web 模式通过后端代理进行 API 调用

## 下一步

- [项目结构](project-structure.md) - 详细文件组织
- [服务](services.md) - 服务实现
