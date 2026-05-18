# PanelFlow 开发指南

## 项目概述

PanelFlow 是 AI 驱动的视频脚本创作平台，将小说、剧本或提示词转化为专业级视频内容。

## 技术栈

- **前端框架**：React 18 · TypeScript 5 · Vite 5
- **UI 组件**：shadcn/ui (Radix UI + Tailwind CSS)
- **状态管理**：Zustand
- **桌面端**：Tauri 2.0 (Rust)
- **动画**：Framer Motion
- **国际化**：i18next
- **测试**：Jest · React Testing Library

## 项目结构

```
src/
├── components/              # UI 组件
│   ├── ui/                 # 基础 UI 组件（扁平结构，每个组件独立文件）
│   │   ├── button.tsx      # 直引方式
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ui-components.tsx  # barrel 导出（已废弃）
│   └── layout/             # 布局组件
├── features/                # 功能模块（DDD 风格）
│   ├── ai/                 # AI 模型选择
│   ├── audio/              # 音频编辑
│   ├── character/          # 角色设计
│   ├── editor/             # 可视化编辑器（Timeline）
│   ├── project/            # 项目管理
│   ├── script/             # 脚本生成
│   ├── storyboard/         # 分镜编辑
│   └── video/              # 视频播放/导出
├── shared/                  # 共享基础设施
│   ├── components/ui/      # 可复用 UI 组件
│   ├── hooks/              # 可复用 React Hooks
│   ├── services/           # 存储、API 客户端
│   ├── stores/             # Zustand 状态存储
│   ├── types/              # 共享类型定义
│   └── utils/              # 工具函数
├── core/                    # 核心服务
│   ├── services/           # AI、视频等 30+ 服务
│   ├── pipeline/            # 流水线引擎
│   ├── hooks/              # 核心 Hooks
│   └── data/               # 静态数据
├── pages/                   # 路由级页面
└── App.tsx                  # 根组件
src-tauri/                   # Tauri 桌面端（Rust）
```

## 开发指南

### 添加新服务

1. 在 `src/core/services/` 创建服务文件
2. 使用单例模式导出
3. 从 `src/core/services/index.ts` 导出

```typescript
// src/core/services/example.service.ts
class ExampleService {
  private static instance: ExampleService;

  static getInstance(): ExampleService {
    if (!ExampleService.instance) {
      ExampleService.instance = new ExampleService();
    }
    return ExampleService.instance;
  }
}

export const exampleService = ExampleService.getInstance();
```

### 添加新状态

1. 在 `src/shared/stores/` 创建 store 文件
2. 使用 Zustand 的 persist 中间件
3. 配置防抖存储以优化性能

```typescript
// src/shared/stores/example.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ExampleState {
  data: string;
  setData: (data: string) => void;
}

export const useExampleStore = create<ExampleState>()(
  persist(
    (set) => ({
      data: '',
      setData: (data) => set({ data }),
    }),
    {
      name: 'example-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### 添加新组件

1. 在 `src/components/ui/` 创建组件文件（每个组件独立文件）
2. 从 `ui-components.tsx` 导出（或直引使用）

```typescript
// src/components/ui/example.tsx
import { cn } from '@/shared/utils/class-names';

interface ExampleProps {
  className?: string;
  children?: React.ReactNode;
}

export function Example({ className, children }: ExampleProps) {
  return <div className={cn('some-class', className)}>{children}</div>;
}
```

## 命令

```bash
# 开发模式
pnpm dev

# 生产构建
pnpm build

# 类型检查
pnpm build:check

# 运行测试
pnpm test

# 快速测试（含覆盖率）
pnpm test:fast

# 监听模式
pnpm test:watch

# 构建 Tauri 桌面应用
pnpm tauri build

# 代码检查
pnpm lint

# 自动修复代码检查问题
pnpm lint:fix

# 构建文档
pnpm docs:vp:build

# 开发文档
pnpm docs:vp:dev
```

## AI 服务使用

```typescript
import { aiService } from '@/core/services';

// 文本生成
const result = await aiService.generate('写一段戏剧性场景', {
  provider: 'minimax',
  model: 'M2.5',
  maxTokens: 1000,
});
console.log(result.content);

// 多轮对话
const chatResult = await aiService.chat(messages, {
  provider: 'minimax',
  model: 'M2.5',
});
```

## 测试

- 使用 TypeScript 严格模式
- 使用函数式组件 + Hooks
- 遵循 React 组件拆分原则
- 使用 ESLint + Prettier 格式化

## 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### 类型

| Type       | Description              |
| ---------- | ------------------------ |
| `feat`     | 新功能                   |
| `fix`      | Bug 修复                 |
| `docs`     | 文档变更                 |
| `style`    | 代码格式化（无逻辑变更） |
| `refactor` | 代码重构                 |
| `perf`     | 性能改进                 |
| `test`     | 添加或更新测试           |
| `build`    | 构建系统变更             |
| `ci`       | CI/CD 配置变更           |
| `chore`    | 其他变更                 |

### 示例

```bash
# 新功能
git commit -m "feat(editor): add video preview functionality"

# Bug 修复
git commit -m "fix(workflow): resolve pipeline cancellation issue"

# 文档
git commit -m "docs(readme): update installation instructions"

# 重构
git commit -m "refactor(services): extract common retry logic"
```
