<div align="center">

<br />

<svg width="500" height="130" xmlns="http://www.w3.org/2000/svg">
  <rect x="8" y="8" width="480" height="110" fill="#1a1a1a" />
  <rect x="2" y="2" width="480" height="110" fill="#f5f5f5" stroke="#1a1a1a" stroke-width="3" />
  <text x="250" y="78" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-size="63" font-weight="900" fill="#1a1a1a" letter-spacing="-3">ANY <tspan fill="#ff4d00">TOOL</tspan></text>
</svg>

<br /><br />

**A bunch of useful tools. No login, no ads, just stuff that works.**

<br />

</div>

---

## What's here

10 tools, built with Next.js and TypeScript. Some run entirely in the browser, a few need a tiny API route on the server side, and the video ones use ffmpeg compiled to WASM so there's zero upload.

| Tool | What it does | How it runs |
|------|-------------|-------------|
| JSON Formatter | Pretty-print, minify, validate JSON | Browser only |
| Image Crusher | Compress images, resize, lock aspect ratio, pick format | Browser + Server |
| Image Converter | Convert PNG / JPEG / WebP / AVIF / TIFF / ICO | Browser + Server |
| Regex Lab | Match, replace, explain, benchmark, export to 6 languages | Browser only |
| Video Slicer | Trim video with ffmpeg.wasm, no upload | Browser + WASM |
| Video Speeder | Speed up / slow down, timelapse, slow-mo, audio sync | Browser + WASM |
| Audio Extractor | Extract MP3 / WAV / AAC / OGG from video | Browser + WASM |
| Request Sender | Postman in a tab, curl import/export, proxy for CORS | Browser + Server |
| Code Snapshot | Screenshot code in macOS or brutalist window frame | Browser only |
| Sub Converter | Convert proxy subscriptions, 33 ACL4SSR rulesets | Browser + Server |

## Run your own

```bash
git clone https://github.com/Jayczee/any-tool.git
cd any-tool && npm install && npm run dev
```

```bash
docker build -t any-tool . && docker run -p 3000:3000 any-tool
```

MIT.
