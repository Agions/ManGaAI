# 快速开始

在 5 分钟内启动并运行 panel-flow。

## 技术栈

|   类别   | 技术                                |
| :------: | ----------------------------------- |
| 前端框架 | React 18 · TypeScript 5 · Vite 5    |
| UI 组件  | shadcn/ui (Radix UI + Tailwind CSS) |
| 状态管理 | Zustand                             |
|  桌面端  | Tauri 2.0 (Rust)                    |
|   动画   | Framer Motion                       |
|  国际化  | i18next                             |

## 前置要求

- **Node.js** 18+
- **pnpm** 8+（或 npm 9+）
- **Git**
- AI 提供商的 API Key（见[配置](./configuration.md)）

## 安装

### 1. 克隆仓库

```bash
git clone https://github.com/Agion/panel-flow.git
cd panel-flow
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置 AI 提供商

在项目根目录创建 `.env.local`：

```bash
# 文字生成（至少配置一个）
VITE_MINIMAX_API_KEY=your_key_here
VITE_ALIBABA_API_KEY=your_key_here

# 图像生成（可选）
VITE_SEEDDREAM_API_KEY=your_key_here

# 语音合成
VITE_TTS_PROVIDER=edge
```

### 4. 运行

```bash
pnpm dev
```

应用将在 `http://localhost:5173` 可用。

## 七步工作流

```
📥 导入 → 🧠 AI分析 → 📝 脚本生成 → 🎬 分镜设计
                                             │
                    ┌──────────────────────────┤
                    │                          │
                    ▼                          ▼
              🖼️ 批量渲染  ◀──  🎭 角色设计
                    │
                    ▼
              📤 导出
```

1. **导入**：上传小说/脚本/提示词
2. **AI 分析**：多模型并行理解内容
3. **脚本生成**：生成结构化视频脚本
4. **分镜设计**：自动生成分镜图
5. **角色设计**：AI 创建角色参考图
6. **批量渲染**：多模型并行渲染
7. **导出**：MP4/WebM/MOV 视频

## 下一步

- [安装指南](./installation.md) - 详细安装说明
- [配置](./configuration.md) - 所有配置选项
