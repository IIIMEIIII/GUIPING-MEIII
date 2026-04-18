# GUIPING MEI — Portfolio Website

个人作品集网站，面向独立设计师 / 视觉艺术家 / 创意开发者，黑底极简高对比风格，配备 Three.js 3D 放射式作品展示装置。

---

## ✅ 已完成功能

### 主页 (`index.html`)
- **Loader** — 全屏背景图（loader-bg.jpg）+ 进度条动画，约 2.2s 后淡出
- **导航栏** — 始终透明，含 WORKS / ABOUT / CONTACT 三个链接；移动端汉堡菜单
- **Hero 3D 装置** — Three.js 放射式圆形卡片展示（8张），支持鼠标拖拽/触摸旋转，自动慢速旋转；点击卡片跳转对应作品页（work-1~4），其余卡片弹出 Modal
- **姓名 3D 旋转** — `GUIPING MEI` 文字随鼠标位移产生逐字 rotateX/rotateY 视差效果
- **SOUND ARCHIVE** — 4张专辑卡片堆叠展示（金属银灰箱 + 亚克力面板），点击卡片弹出播放器；专辑 4（KIKUOWORLD）已挂载 `audio/biosphere-ha.mp3`，其余 3 张曲目待填入
- **SELECTED WORKS** — 全屏宽度轮播（dial 风格），4项 + 左右箭头 + 圆点导航 + 触摸/键盘支持；点击当前项跳转详情页
- **ABOUT** — 简介 + 技能标签 + 数据统计（5+年 / 40+项目 / 20+客户）
- **SERVICES** — 4项服务列表（悬停滑入动画）
- **CONTACT CTA** — 磁性按钮跳转 contact.html + Instagram / Behance 等社交链接
- **Footer** — © 2026 GUIPING MEI
- **自定义鼠标** — 跟随圆点 + 动效圆环（桌面端）
- **滚动渐现动画** — IntersectionObserver 驱动

### 联系页 (`contact.html`)
- 大号 CONTACT 标题页
- 3 列联系信息：
  - **WeChat** M_paradisemi
  - **Instagram** @mi_paradisee（链接：instagram.com/mi_paradisee）
  - **IT 电话** +39 344 6875 847
  - **CN 电话** +86 183 2320 9388
  - **Email** 18323209388@163.com
- 返回首页按钮

### 作品详情页（`work-1.html` ~ `work-4.html`）
| 文件 | 作品 |
|---|---|
| work-1.html | Gothic Twilight — Fashion Photography 2026 |
| work-2.html | Stay On Stage — Conceptual Styling 2026 |
| work-3.html | Bloom Structure — Wearable Art 2026 |
| work-4.html | Rope Anatomy — Fashion Design 2023 |

- 全屏 Hero 图 + 渐变遮罩
- INFO ROW（Category / Year / Medium / Role）
- 项目描述 + 标签
- 全幅图片展示
- 下一作品跳转 / 返回全部作品
- Footer: © 2026 GUIPING MEI
- ⚠️ Creative Notes 区块已移除

---

## 📁 文件结构

```
index.html              — 主页
contact.html            — 联系页
work-1.html             — Gothic Twilight 详情
work-2.html             — Stay On Stage 详情
work-3.html             — Bloom Structure 详情
work-4.html             — Rope Anatomy 详情

css/
  style.css             — 主页样式
  work-detail.css       — 作品详情页样式（共用）

js/
  main.js               — 主页 JS（Loader/Nav/Name3D/Carousel/AlbumPlayer/Cursor）
  three-scene.js        — Three.js 3D 放射场景
  work-detail.js        — 作品详情页公共 JS（NavScrolled/Reveal）

images/
  loader-bg.jpg         — Loader 背景图
  work-1.jpg            — Gothic Twilight
  work-2.jpg            — Stay On Stage
  work-3.jpg            — Bloom Structure
  work-4.jpg            — Rope Anatomy
  album/
    album-1.jpg         — SALLY FACE 专辑封面
    album-2.jpg         — RED FACE 专辑封面
    album-3.jpg         — FILM STRIP 专辑封面
    album-4.jpg         — KIKUOWORLD 专辑封面

audio/
  biosphere-ha.mp3      — 专辑 4 音频（Biosphere - Hå）
```

---

## 🎵 专辑音频状态

| # | 专辑名 | 状态 |
|---|---|---|
| 01 | SALLY FACE | 待填入音频 |
| 02 | RED FACE | 待填入音频 |
| 03 | FILM STRIP | 待填入音频 |
| 04 | KIKUOWORLD | ✅ `audio/biosphere-ha.mp3` |

**填入方式**：在 `js/main.js` 的 `ALBUMS` 数组中，将对应条目的 `src` 字段改为音频文件路径，并将文件放入 `audio/` 目录。

---

## 🔧 内容定制方法

### 修改 3D 展示卡片
编辑 `js/three-scene.js` 中的 `WORKS` 数组：
```js
const WORKS = [
  {
    title: '作品名称',
    category: '分类',
    year: '2026',
    desc: '描述文字',
    image: 'images/work-1.jpg',   // 图片路径，留空使用渐变色
    color1: '#0d1b2a',            // 渐变起始色
    color2: '#1b2a4a',            // 渐变结束色
  },
  // ...
];
```

### 修改个人信息
- **姓名/头衔**：`index.html` Hero 区块 `#heroName3d` 及 `.hero-title`
- **About 内容**：`index.html` `#about` 区块
- **联系方式**：`contact.html`

---

## ⏳ 待办 / 计划

- [ ] 为专辑 1~3 上传音频文件并填入 `js/main.js` 的 `ALBUMS[0~2].src`
- [ ] 按需为 `WORKS` 数组中的卡片 5~8 创建独立详情页（当前使用 Modal 弹出）
- [ ] 可扩展更多作品详情页（work-5.html 等）
- [ ] 可按需添加 Behance / Github / LinkedIn 真实链接
- [ ] SEO meta tags（og:image / description）
- [ ] 可选：添加页面过渡动画

---

## 🚀 发布

点击顶部 **Publish 标签** 一键发布，获取在线网址。
