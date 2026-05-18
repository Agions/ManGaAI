# 安装

panel-flow 的详细安装说明。

## 系统要求

### 最低要求

- **操作系统**：Windows 10+、macOS 10.15+、Ubuntu 20.04+
- **内存**：8GB
- **存储空间**：2GB

### 推荐配置

- **内存**：16GB+
- **显卡**：NVIDIA 6GB+ 显存（用于本地渲染）
- **存储**：SSD 10GB+

## Web 开发

```bash
# 克隆
git clone https://github.com/Agion/panel-flow.git
cd panel-flow

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

应用运行在 `http://localhost:5173`。

## 桌面应用（Tauri 2.0）

### macOS

```bash
# 安装 Rust 编译依赖
brew install rust cmake protobuf llvm
brew installwebkit2gtk python3 gtkmm3 libsoup3

# 构建
pnpm install
pnpm tauri build
```

### Linux（Ubuntu/Debian）

```bash
sudo apt update && sudo apt install -y \
  rustc cargo cmake ninja-build \
  libgtk-3-dev libwebkitgtk-6.0-dev

pnpm install
pnpm tauri build
```

### Windows

安装 [Rust](https://rustup.rs/) + [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)（勾选 "C++ 桌面开发"），然后：

```powershell
pnpm install
pnpm tauri build
```

构建输出：`src-tauri/target/release/bundle/`

## 文档构建

```bash
# 开发文档
pnpm docs:dev

# 构建文档
pnpm docs:build
```

## 故障排除

### 端口已被占用

```bash
# macOS/Linux
lsof -i :5173
kill -9 <PID>
```

### Tauri 构建失败

```bash
rustup update
cargo clean
pnpm tauri build
```

## 下一步

- [配置](./configuration.md) - AI API Key 配置
