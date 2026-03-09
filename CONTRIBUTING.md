# ManGa AI 开发指南

## 项目概述

ManGa AI 是一款专业的 AI 漫剧视频智能创作平台，将小说/剧本自动转化为高质量动态漫剧视频。

## 技术栈

- **前端框架**: React 18 + TypeScript 5
- **构建工具**: Vite
- **UI 组件库**: Ant Design 5
- **状态管理**: Zustand
- **桌面端**: Tauri (Rust)
- **动画**: Framer Motion

## 项目结构

```
src/
├── core/                      # 核心模块
│   ├── config/               # 配置文件
│   │   ├── app.config.ts    # 应用配置
│   │   └── models.config.ts  # AI 模型配置
│   ├── services/            # 业务服务
│   │   ├── ai.service.ts    # AI 服务
│   │   ├── video.service.ts # 视频处理服务
│   │   └── ...
│   ├── stores/              # 状态管理
│   │   ├── app.store.ts     # 应用状态
│   │   ├── project.store.ts # 项目状态
│   │   └── workflow.store.ts# 工作流状态
│   ├── types/               # 类型定义
│   └── utils/               # 工具函数
│       ├── requestCache.ts   # 请求缓存
│       └── retryRequest.ts   # 重试机制
├── components/              # UI 组件
│   ├── common/             # 通用组件
│   ├── layout/             # 布局组件
│   └── business/           # 业务组件
│       └── VideoEditor/     # 视频编辑器（已拆分）
├── context/                 # React Context
└── pages/                   # 页面组件
```

## 开发指南

### 添加新服务

1. 在 `src/core/services/` 下创建服务文件
2. 使用单例模式导出
3. 在 `src/core/services/index.ts` 中导出

```typescript
// 示例: src/core/services/example.service.ts
class ExampleService {
  // 服务逻辑
}

export const exampleService = new ExampleService();
```

### 添加新状态

1. 在 `src/core/stores/` 下创建 store 文件
2. 使用 Zustand 的 persist 中间件
3. 配置防抖存储优化性能

```typescript
// 示例: src/core/stores/example.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createDebouncedStorage } from './middlewares/persistWithDebounce';

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
      storage: createJSONStorage(() => createDebouncedStorage(localStorage, 1000)),
    }
  )
);
```

### 添加新组件

1. 在 `src/components/` 下创建组件目录
2. 遵循组件拆分原则
3. 使用 hooks 分离逻辑

### AI 服务使用

```typescript
import { aiService } from '@/core/services/ai.service';

// 生成脚本
const script = await aiService.generateScript(model, settings, {
  topic: '主题',
  style: 'professional',
  tone: '正式',
  length: 'medium',
  audience: '技术人员',
  language: 'zh',
});

// 流式生成
for await (const chunk of aiService.streamGenerate(prompt, options)) {
  // 处理流式输出
  updateUI(chunk);
}

// 批量生成
const results = await aiService.batchGenerate(prompts, {
  model: 'glm-5',
  provider: 'zhipu',
  concurrency: 3,
});
```

### 使用工作流 Store

```typescript
import { useWorkflowStore, STEP_ORDER } from '@/core/stores/workflow.store';

// 启动工作流
useWorkflowStore.getState().startWorkflow('import');

// 步骤进度更新
useWorkflowStore.getState().setStepProgress('generate', 50);

// 完成步骤并传递数据
useWorkflowStore.getState().completeStep('generate', { script: data });

// 验证步骤
const { valid, errors } = useWorkflowStore.getState().validateStep('generate');
```

## 命令

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 运行测试
npm test

# 构建 Tauri 桌面端
npm run tauri build
```

## 代码规范

- 使用 TypeScript 严格模式
- 组件使用函数式组件 + Hooks
- 遵循 React 组件拆分原则
- 使用 ESLint + Prettier 格式化

## 测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- ai.service.test.ts

# 监听模式
npm test -- --watch
```
