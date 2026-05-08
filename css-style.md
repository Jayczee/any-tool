# ANY-TOOL 视觉风格指南 (Brutalist Design System)

为了保持项目风格的统一性，所有后续的 UI 开发和组件设计必须遵循本指南。本风格摒弃了平庸的“AI 审美”，追求大胆、原始且具有高度冲击力的视觉表现。

## 1. 核心设计原则

- **拒绝平滑 (No Smoothness)**：严禁使用大圆角、浅阴影和极细的线条。
- **原始力量 (Raw Utility)**：UI 应该看起来像是一个正在运行的工业仪器，而不是一个精致的消费品。
- **高对比度 (High Contrast)**：背景、文字和边框之间必须有极强的视觉区分。
- **排版优先 (Typography as UI)**：字体不仅仅是信息，更是装饰。使用粗大的字体和大写字母。

## 2. 视觉规范 (Visual Tokens)

### 2.1 基础属性
- **边框 (Borders)**: 必须使用实线，宽度统一为 `3px`。变量：`--border-width`。
- **圆角 (Radius)**: 默认为 `0px`。禁止使用任何 `border-radius`，除非是圆形图标。
- **阴影 (Shadows)**: 禁止使用模糊阴影。必须使用硬阴影 (Hard Offset Shadows)。
  - 默认状态: `6px 6px 0px var(--border)`
  - 悬停状态: `10px 10px 0px var(--border)`
- **间距 (Spacing)**: 采用大胆的留白。组件之间使用 `gap: 2rem` 或更大。

### 2.2 色彩体系
- **背景 (Background)**: `#f5f5f5` (Light) / `#121212` (Dark)
- **文字 (Foreground)**: `#1a1a1a` (Light) / `#f5f5f5` (Dark)
- **强调色 (Accent)**: `#ff4d00` (Safety Orange) - 用于警告、主按钮。
- **次要色 (Secondary)**: `#00e676` (Neon Green) - 用于成功状态、次要操作。

## 3. 组件开发要求

### 3.1 容器 (Cards/Containers)
- 使用 `.brutalist-card` 类。
- 必须包含 `3px` 黑色边框。
- 必须包含偏移阴影。
- 悬停时通过 `transform: translate(-4px, -4px)` 配合阴影变化产生交互感。

### 3.2 按钮 (Buttons)
- 使用 `.brutalist-button` 类。
- 文本一律大写 (`text-transform: uppercase`)。
- 字体加粗 (`font-weight: 800`)。
- 点击时应有位移效果，模拟物理按键的压下感。

### 3.3 输入框与表单 (Inputs)
- 严禁隐藏输入框边框。
- 获焦 (Focus) 时背景色或边框色应有剧烈变化。
- 错误提示必须以高亮色块（如背景色为强调色）的形式展示，而非简单的红色文字。

## 4. 动画规范 (Framer Motion)

- **物理感**: 动画应具有“重量感”，避免过度轻飘的淡入淡出。
- **阶梯式加载 (Staggered Reveals)**: 列表或网格项进入页面时应有明显的先后顺序。
- **硬切换**: 状态切换时首选即时变化或快速的弹簧动画 (`type: "spring", stiffness: 300`)。

## 5. 禁止事项 (Strictly Prohibited)

1.  **禁止使用 Tailwind CSS**: 除非用户明确要求，否则一律使用 CSS 变量和原生 CSS。
2.  **禁止使用渐变色**: 除非是为了模拟极其廉价的复古效果，否则只允许使用纯色。
3.  **禁止使用 Inter, Roboto 等通用字体**: 优先使用 `Arial Black` 或 `System Mono` 堆栈。
4.  **禁止使用淡色边框**: 边框色必须与文字颜色一致（通常为黑色或纯白）。

---
*遵循本指南，构建最硬核的工具集。*
