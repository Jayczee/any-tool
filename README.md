# ANY-TOOL

A collection of high-impact, production-grade tools for modern builders. No fluff, just utility.

## Tools

| Tool | Description | Type |
|------|-------------|------|
| JSON Formatter | Format, minify, validate JSON in real-time | Frontend |
| Image Crusher | Compress images with custom resolution, quality, format | Full-stack |
| Image Converter | Convert between PNG, JPEG, WebP, AVIF, TIFF, ICO | Full-stack |
| Regex Lab | Match, replace, explain, benchmark, export regex patterns | Frontend |
| Video Slicer | Trim videos with client-side ffmpeg.wasm | Frontend |
| Video Speeder | Speed up / slow down video with audio sync | Frontend |
| Audio Extractor | Extract MP3, WAV, AAC, OGG audio from video | Frontend |
| Request Sender | HTTP client with curl import/export, auth, history | Full-stack |
| Code Snapshot | Turn code into macOS or brutalist screenshots | Frontend |
| Sub Converter | Convert proxy subscriptions with ACL4SSR rule sets | Full-stack |

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Brutalist CSS (hard borders, offset shadows, no radii)
- **Image Processing**: Sharp
- **Video Processing**: ffmpeg.wasm (client-side)
- **Syntax Highlight**: highlight.js
- **Screenshot Export**: html2canvas
- **i18n**: Built-in dictionary (English / Chinese)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Docker

```bash
docker build -t any-tool .
docker run -p 3000:3000 any-tool
```

## Project Structure

```
src/
  app/
    [lang]/              # i18n routes (en, zh)
      dictionaries/      # Translation files
      tools/             # Tool detail + browse pages
    api/tools/           # Server-side API routes
  components/
    tools/               # Tool implementations
    LangSwitcher.tsx     # Language toggle
    ToolCard.tsx         # Shared tool card
    SearchBox.tsx        # Fuzzy search with dropdown
  lib/
    tools.ts             # Tool definitions
  proxy.ts               # Locale detection + redirect
```

## License

MIT

---

# ANY-TOOL (中文)

为现代构建者打造的高冲击力、生产级工具集。拒绝花哨，只求实用。

## 工具列表

| 工具 | 简介 | 类型 |
|------|------|------|
| JSON 格式化 | 实时格式化、压缩、校验 JSON | 前端 |
| 图片粉碎机 | 自定义分辨率、质量、格式压缩图片 | 全栈 |
| 图片格式转换 | PNG / JPEG / WebP / AVIF / TIFF / ICO 互转 | 全栈 |
| 正则实验室 | 匹配、替换、解析、性能测试、导出正则 | 前端 |
| 视频切片机 | 客户端 ffmpeg.wasm 裁剪视频 | 前端 |
| 视频变速器 | 加速/减速视频，音频同步变速 | 前端 |
| 音频提取器 | 从视频提取 MP3 / WAV / AAC / OGG | 前端 |
| 请求发送器 | HTTP 客户端，curl 导入导出，认证，历史记录 | 全栈 |
| 代码截图 | 代码转 macOS/工具站风格截图，语法高亮 | 前端 |
| 订阅转换 | 代理订阅链接转换，33 个 ACL4SSR 规则集 | 全栈 |

## 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **样式**: 粗野主义 CSS（硬边框、偏移阴影、无圆角）
- **图片处理**: Sharp
- **视频处理**: ffmpeg.wasm（客户端）
- **代码高亮**: highlight.js
- **截图导出**: html2canvas
- **国际化**: 内置字典（英文 / 中文）

## 本地运行

```bash
npm install
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)。

## Docker 部署

```bash
docker build -t any-tool .
docker run -p 3000:3000 any-tool
```

## 许可证

MIT
