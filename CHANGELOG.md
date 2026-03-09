# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-02-22

### 🎉 项目重命名
- 项目名称统一为 **ManGaAI**
- 全新品牌标识、ASCII Art Logo
- 更新所有配置、代码注释、文档引用

### ✨ 工作流引擎升级
- **Step 6 场景渲染**: 完整实现，融合角色外观 + 分镜 Prompt 生成渲染描述
- **Step 7 动态合成**: 镜头运动系统（推拉摇移）、Ken Burns 效果、转场逻辑
- **Step 8 配音配乐**: 对白收集 + 角色配音映射 + 氛围 BGM 匹配
- **Step 9 导出发布**: 时间轴编排、多轨合成配置、导出参数（格式/分辨率/编码）

### 📝 文档重写
- README.md 全面重写，专业排版
- 9步工作流每步标注输入→处理→输出
- Mermaid 技术架构图
- 快速开始指南

### 🔧 代码改进
- 存储 key 前缀从 `cineforge_` 更新为 `inkmotion_`
- Tauri bundle identifier 更新为 `com.inkmotion.app`
- 版本号升级至 2.0.0

## [1.1.0] - 2026-02-17

### Renamed
- **Project Name**: Nova → **ManGaAI**
  - New ASCII art logo
  - Updated all documentation references
  - GitHub: https://github.com/Agions/ManGaAI

### Added
- **8-Step Drama Workflow**: Novel → Script → Storyboard → Character → Scene → Animation → Voiceover → Export
- **Novel Parser**: Automatic novel-to-script conversion with character extraction
- **Storyboard Generator**: AI-powered panel generation from script scenes
- **Character Consistency**: Character appearance and personality management
- **Drama Style System**: Genre/tone/pacing/art style management for comic dramas
- **Vision Service**: Advanced scene detection, object detection (10 classes), 5-dimension emotion analysis
- **Novel Service**: Parse novels, convert to scripts, generate storyboards

### Updated
- **LLM Models (2026 Latest)**:
  - Baidu ERNIE 5.0 (2026-01)
  - Alibaba Qwen 3.5 (2026-01)
  - Moonshot Kimi k2.5 (2025-07)
  - Zhipu GLM-5 (2026-01)
  - MiniMax M2.5 (2025-12)
- **Constants**: Centralized LLM_MODELS with accurate pricing and capabilities
- **AI Service**: Model recommendation and info query methods
- **ModelSelector**: Updated to use new model configuration

### Technical
- Added `useNovel` hook for novel parsing and script generation
- Added `useConsistency` hook for character and style management
- Added `novel.service.ts` for novel-to-script conversion
- Added `consistency.service.ts` for character consistency
- Added `drama.workflow.service.ts` for drama generation workflow
- Added `vision.service.ts` for video analysis

## [1.0.0] - 2026-02-17

### Added
- Initial release of **ManGaAI**
- AI-powered video content creation platform
- Support for 8 major AI providers (OpenAI, Anthropic, Google, Baidu, Alibaba, Zhipu, iFlytek, Tencent)
- Professional video upload and analysis
- AI script generation with multiple styles and tones
- Video export with subtitle support
- Multi-language support (Chinese, English)
- Dark mode support
- Local storage management
- FFmpeg integration for video processing

### Features
- **Model Selector**: Smart AI model selection with cost estimation
- **Novel Parser**: Upload and parse novels (TXT/EPUB/PDF)
- **Script Generator**: AI-powered script generation from novels
- **Storyboard Generator**: Automatic storyboard creation from scripts
- **Character Designer**: AI character generation with consistency
- **Project Management**: Complete project lifecycle management
- **Storage Service**: Persistent local storage for projects and settings

### Technical
- React 18 + TypeScript + Vite
- Ant Design 5 + Framer Motion
- Tauri for desktop application
- Zustand for state management
- Modular architecture with service layer

## [0.1.0] - 2026-02-16

### Added
- Project initialization
- Basic project structure
- TypeScript configuration
- Development environment setup
