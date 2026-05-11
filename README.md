<div align="center">

<a href="https://github.com/Jayczee/any-tool"><img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB4PSIxNiIgeT0iMTYiIHdpZHRoPSIzNjAiIGhlaWdodD0iMTYwIiBmaWxsPSIjMWExYTFhIiAvPgogIDxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjM2MCIgaGVpZ2h0PSIxNjAiIGZpbGw9IiNmNWY1ZjUiIHN0cm9rZT0iIzFhMWExYSIgc3Ryb2tlLXdpZHRoPSIzIiAvPgogIDx0ZXh0IHg9IjIwMCIgeT0iODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCBCbGFjayxBcmlhbCxzYW5zLXNlcmlmIiBmb250LXNpemU9IjcyIiBmb250LXdlaWdodD0iOTAwIiBmaWxsPSIjMWExYTFhIiBsZXR0ZXItc3BhY2luZz0iLTMiPkFOWTwvdGV4dD4KICA8dGV4dCB4PSIyMDAiIHk9IjE0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIEJsYWNrLEFyaWFsLHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNzIiIGZvbnQtd2VpZ2h0PSI5MDAiIGZpbGw9IiNmZjRkMDAiIGxldHRlci1zcGFjaW5nPSItMyI+VE9PTDwvdGV4dD4KPC9zdmc+" alt="ANY-TOOL" /></a>

<br /><br />

**A bunch of useful tools. No login, no ads, just stuff that works.**

<br />

---

<br />

[English](#english) · [中文](#中文)

</div>

---

<br />

<a id="english"></a>

## What's here

10 tools, built with Next.js and TypeScript. Some run entirely in the browser, a few need a tiny API route on the server side, and the video ones use ffmpeg compiled to WASM so there's zero upload.

[**JSON Formatter**](https://any-tool.fun/en/tools/json-formatter) — Pretty-print, minify, validate. *(browser only)*

[**Image Crusher**](https://any-tool.fun/en/tools/image-optimizer) — Compress images, resize, lock aspect ratio, pick format. *(browser + server)*

[**Image Converter**](https://any-tool.fun/en/tools/image-converter) — PNG to JPEG to WebP to AVIF to ICO. *(browser + server)*

[**Regex Lab**](https://any-tool.fun/en/tools/regex-tester) — Write regex, see matches highlighted, explain each token, benchmark speed, export to 6 languages. *(browser only)*

[**Video Slicer**](https://any-tool.fun/en/tools/video-trimmer) — Trim video right in the browser. ffmpeg compiled to WASM. No upload. *(browser + WASM)*

[**Video Speeder**](https://any-tool.fun/en/tools/video-speeder) — Speed up, slow down, timelapse, slow-mo. Audio pitch stays intact. *(browser + WASM)*

[**Audio Extractor**](https://any-tool.fun/en/tools/audio-extractor) — Yank audio out of video as MP3, WAV, AAC, or OGG. *(browser + WASM)*

[**Request Sender**](https://any-tool.fun/en/tools/request-sender) — Postman in a browser tab. Proxies through a server route to bypass CORS. *(browser + server)*

[**Code Snapshot**](https://any-tool.fun/en/tools/code-snapshot) — Screenshot code in macOS or brutalist window frame. *(browser only)*

[**Sub Converter**](https://any-tool.fun/en/tools/subconverter) — Convert proxy subscription links. 33 built-in ACL4SSR rule sets. *(browser + server)*

## Run your own

```bash
git clone https://github.com/Jayczee/any-tool.git
cd any-tool && npm install && npm run dev
```

```bash
docker build -t any-tool . && docker run -p 3000:3000 any-tool
```

MIT.

---

<br />

<a id="中文"></a>

## 有什么

10 个工具，Next.js + TypeScript 写的。大部分纯浏览器跑，有俩需要走一下服务端接口，视频相关的用 ffmpeg.wasm（编译到 WASM，不用上传文件）。

[**JSON 格式化**](https://any-tool.fun/zh/tools/json-formatter) — 格式化、压缩、校验。*(纯浏览器)*

[**图片粉碎机**](https://any-tool.fun/zh/tools/image-optimizer) — 压缩图片，调分辨率，锁定比例，选格式。*(浏览器 + 服务端)*

[**图片格式转换**](https://any-tool.fun/zh/tools/image-converter) — PNG / JPEG / WebP / AVIF / ICO 随便转。*(浏览器 + 服务端)*

[**正则实验室**](https://any-tool.fun/zh/tools/regex-tester) — 写正则，高亮匹配，逐字解析，跑分，导出 6 种语言。*(纯浏览器)*

[**视频切片机**](https://any-tool.fun/zh/tools/video-trimmer) — 浏览器里直接剪视频，ffmpeg 编译成 WASM，文件不上传。*(浏览器 + WASM)*

[**视频变速器**](https://any-tool.fun/zh/tools/video-speeder) — 加速、减速、延时、慢放，音频音调不变。*(浏览器 + WASM)*

[**音频提取器**](https://any-tool.fun/zh/tools/audio-extractor) — 从视频里把音频扒成 MP3 / WAV / AAC / OGG。*(浏览器 + WASM)*

[**请求发送器**](https://any-tool.fun/zh/tools/request-sender) — 浏览器里的 Postman，走服务端转发绕开跨域。*(浏览器 + 服务端)*

[**代码截图**](https://any-tool.fun/zh/tools/code-snapshot) — 代码截成 macOS 风或本站风的图。*(纯浏览器)*

[**订阅转换**](https://any-tool.fun/zh/tools/subconverter) — 代理订阅链接转换，自带 33 个 ACL4SSR 规则集。*(浏览器 + 服务端)*

## 自己跑

```bash
git clone https://github.com/Jayczee/any-tool.git
cd any-tool && npm install && npm run dev
```

```bash
docker build -t any-tool . && docker run -p 3000:3000 any-tool
```

MIT。
