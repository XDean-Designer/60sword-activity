# 剑琅选剑 · 定名宝剑活动页

静态 H5 活动页，可直接交给前端集成或部署。

## 目录结构

```
活动页5-html-副本/
├── index.html          # 入口，跳转 page5-1.html
├── page5-1.html        # 选剑页（7 页网格，63 把剑）
├── page5-2.html        # 定名页
├── css/
│   ├── tailwind.css    # 已编译样式（含思源黑体 @font-face）
│   └── page5-fx.css    # 动效样式
├── js/
│   ├── page5-state.js  # 选剑状态（sessionStorage）
│   └── page5-fx.js     # 粒子 / 网格动效
├── assets/images/
│   ├── page5-1/        # 选剑页 UI 切图
│   ├── page5-2/        # 定名页 UI 切图
│   ├── swords/         # 主套剑图标 sword-28 ~ sword-63（第 4~7 页网格）
│   └── swords2/        # 副套剑图标 sword-1 ~ sword-27（第 1~3 页网格）
├── assets/icons/dice-page3/  # 定名页骰子装饰矢量
├── fonts/              # 思源黑体 OTF（改样式后 rebuild 用）
├── src/input.css       # Tailwind 源文件
├── package.json        # npm run build:css
└── tailwind.config.js
```

## 本地预览

**必须用本地 HTTP 服务**（直接双击 HTML 可能因 `file://` 协议导致字体或脚本异常）：

```bash
cd 活动页5-html-副本
npx serve .
# 浏览器打开 http://localhost:3000
```

或任意静态服务器指向本目录即可。

## 页面流程

1. `page5-1.html` — 7×9 网格选剑，底部「下一页」翻页，选中后跳转定名
2. `page5-2.html` — 展示所选剑 + 定名交互（状态由 `page5-state.js` 传递）

## 修改样式

改 HTML 中的 Tailwind 类名后需重新编译：

```bash
npm install
npm run build:css
```

## 部署

- 将整个文件夹作为静态资源根目录上传即可
- GitHub Pages：根目录放 `.nojekyll`（已含），Source 选 main / root

## 注意事项

- 剑图路径：`assets/images/swords2/`（第 1~3 页，sword-1~27）与 `assets/images/swords/`（第 4~7 页，sword-28~63）
- 网格分页编号规则见 `page5-1.html` 内 `buildIconPages()` 注释
- 本包为独立交付副本，不含 Git 历史
