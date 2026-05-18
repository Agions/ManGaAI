# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-05-07

### 🎉 Project Renamed

- **Project Name**: Nova → ManGaAI → **PanelFlow**
- New ASCII art logo
- Updated all documentation references
- GitHub: https://github.com/Agions/PanelFlow

### 🗑️ UI 组件库迁移

- **antd 完全移除**: 62 个 antd 组件引用 → 0
- **@ant-design/icons 完全移除**: 14 个引用 → 0
- **迁移至 shadcn/ui**: 基于 Radix UI + Tailwind CSS 的全新组件系统
- **CSS 清理**: 移除 197 行 antd 相关 CSS

### ✨ New Features

- Professional tool-style UI redesign
- Enhanced workflow system
- Improved code architecture

### 🔧 Configuration Updates

- Package name: `manga-ai` → `PanelFlow`
- Tauri identifier: `com.mangaai.app` → `com.PanelFlow.app`
- Window title updated to PanelFlow branding
- Storage key prefix updated to `PanelFlow_`

### ✨ Added

- **8-Step Drama Workflow**: Novel → Script → Storyboard → Character → Scene → Animation → Voiceover → Export
- **Novel Parser**: Automatic novel-to-script conversion with character extraction
- **Storyboard Generator**: AI-powered panel generation from script scenes
- **Character Consistency**: Character appearance and personality management
- **Drama Style System**: Genre/tone/pacing/art style management
- **Vision Service**: Advanced scene detection, object detection, emotion analysis
- **Novel Service**: Parse novels, convert to scripts, generate storyboards
- **Model Selector**: Smart AI model selection with cost estimation
- **Script Generator**: AI-powered script generation
- **Storyboard Generator**: Automatic storyboard creation
- **Character Designer**: AI character generation with consistency
- **Project Management**: Complete project lifecycle management
- **Storage Service**: Persistent local storage

### 📝 Documentation

- Complete README rewrite in English
- Added comprehensive project structure documentation
- Updated AI model support (2026 latest models)
- Mermaid tech architecture diagrams

### 🔧 Technical

- React 18 + TypeScript + Vite
- Shadcn UI + Framer Motion
- Tauri for desktop application
- Zustand for state management
- Modular architecture with service layer
- FFmpeg integration

### 🤖 LLM Models (2026 Latest)

- 智谱 GLM-5
- MiniMax M2.5
- 月之暗面 Kimi K2.5
- 字节 Doubao 2.0
- 阿里 Qwen 2.5
- 百度 ERNIE 4.0

## [0.1.0] - 2026-02-16

### Added

- Project initialization
- Basic project structure
- TypeScript configuration
- Development environment setup
