# panel-flow

**AI 驱动的视频脚本创作平台** — 将小说、剧本或提示词转化为专业级视频内容

<div align="center">

**MIT License · React 18 + Tauri 2.0 + TypeScript 5**

[![CI](https://img.shields.io/github/actions/workflow/status/Agion/PanelFlow/ci.yml?style=flat-square&label=CI)](https://github.com/Agion/PanelFlow/actions)
[![License](https://img.shields.io/badge/License-MIT-45B8AC?style=flat-square)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)

</div>

---

## 七步工作流

```
📥 导入 ──▶ 🧠 AI分析 ──▶ 📝 脚本生成 ──▶ 🎬 分镜设计
                                              │
                   ┌──────────────────────────┤
                   │                          │
                   ▼                          ▼
             🖼️ 批量渲染  ◀──  🎭 角色设计
                   │
                   ▼
             🎞️ 合成导出
```

|    步骤     | 功能             | 说明                              |
| :---------: | ---------------- | --------------------------------- |
|   📥 导入   | 小说/剧本/提示词 | 自动编码检测，智能章节切分        |
| 🧠 AI 分析  | 多模型并行       | GLM-5、M2.5、Kimi K2.5 等         |
| 📝 脚本生成 | 结构化视频脚本   | 分镜、对话、场景描述              |
| 🎬 分镜设计 | 自动分镜图       | 镜头角度、构图参考                |
| 🎭 角色设计 | AI 角色一致性    | 种子机制，批量零走样              |
| 🖼️ 批量渲染 | 多模型并行       | Seedream 5.0、Kling 1.6、Vidu 2.0 |
| 🎞️ 合成导出 | MP4/WebM/MOV     | TTS 唇形同步，字幕嵌入            |

---

## 快速开始

```bash
git clone https://github.com/Agion/panel-flow.git
cd panel-flow
pnpm install
pnpm dev
```

配置 `.env.local`：

```bash
# 文字生成（至少配置一个）
VITE_ALIBABA_API_KEY=your_key_here

# 图像生成（可选）
VITE_SEEDDREAM_API_KEY=your_key_here
```

访问 `http://localhost:5173`

---

## 技术栈

|   类别   | 技术                                |
| :------: | ----------------------------------- |
| 前端框架 | React 18 · TypeScript 5 · Vite 5    |
| UI 组件  | shadcn/ui (Radix UI + Tailwind CSS) |
| 状态管理 | Zustand                             |
|  桌面端  | Tauri 2.0 (Rust)                    |
|   动画   | Framer Motion                       |
|  国际化  | i18next                             |
|   测试   | Jest · React Testing Library        |

---

## 支持的 AI 模型

**文字生成**：GLM-5（智谱）· M2.5（MiniMax）· Kimi K2.5（月之暗面）· Doubao 2.0（字节）· Qwen 2.5（阿里）· ERNIE 4.0（百度）

**图像生成**：Seedream 5.0（字节，推荐）· Kling 1.6（快手）· Vidu 2.0（生数）

**语音合成**：Edge TTS（免费）· CosyVoice 2.0（阿里）· KAN-TTS（阿里）

---

## 项目结构

```
PanelFlow/
├── src/
│   ├── components/ui/         # shadcn/ui 扁平组件（button.tsx, card.tsx 等）
│   ├── features/              # 功能模块（DDD 风格）
│   │   ├── ai/                # AI 模型选择
│   │   ├── audio/             # 音频编辑
│   │   ├── character/         # 角色设计
│   │   ├── cost/              # 成本追踪
│   │   ├── editor/            # 可视化编辑器（Timeline）
│   │   ├── export/            # 导出功能
│   │   ├── home/              # 首页
│   │   ├── manga-pipeline/    # 漫画流水线
│   │   ├── notification/       # 通知系统
│   │   ├── project/           # 项目管理
│   │   ├── script/            # 脚本生成
│   │   ├── storyboard/        # 分镜编辑
│   │   ├── subtitle/          # 字幕编辑
│   │   ├── video/             # 视频播放/导出
│   │   └── video-export/      # 视频导出
│   ├── shared/                # 共享基础设施
│   │   ├── components/ui/     # 可复用 UI 组件
│   │   ├── hooks/             # 可复用 Hooks
│   │   ├── services/          # 存储、API 客户端
│   │   ├── stores/            # Zustand 状态存储
│   │   ├── types/             # 共享类型
│   │   └── utils/             # 工具函数
│   ├── core/                  # 核心服务
│   │   ├── pipeline/          # 流水线引擎
│   │   └── services/          # 30+ AI/视频服务
│   └── pages/                 # 路由级页面
├── src-tauri/                 # Tauri 桌面端（Rust）
├── docs/                      # VitePress 文档
└── scripts/                   # 构建脚本
```

---

## 文档

| 文档                                                    | 说明            |
| ------------------------------------------------------- | --------------- |
| [快速开始](./docs/getting-started/quick-start.md)       | 5 分钟启动      |
| [配置](./docs/getting-started/configuration.md)         | AI API Key 配置 |
| [架构](./docs/developer-guide/architecture.md)          | 技术架构        |
| [项目结构](./docs/developer-guide/project-structure.md) | 目录说明        |

---

如果你觉得 panel-flow 有帮助，请给我们一个 ⭐

MIT License · © 2026 Agions
