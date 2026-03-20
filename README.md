# 日文小说阅读器 (Japanese Novel Reader)

一个现代化的日文小说阅读网站，使用 React + TypeScript + Vite 构建，数据来源于 [小説家になろう](https://syosetu.com/)。

## 功能特性

- 📚 热门小说排行榜（每日更新）
- 🆕 最新更新小说列表
- 🔍 按标题/作者搜索，支持**分页加载更多**
- 📖 小说详情页，含章节列表与**章节搜索过滤**
- 📄 站内阅读，支持所有章节
- 🌙 **夜间模式**（持久化保存）
- 🔤 **字体大小调节**（持久化保存）
- ⏭️ 上下章导航，支持键盘方向键 & **触摸滑动切换**
- 📜 阅读进度条 & 返回顶部按钮
- 🕐 阅读历史记录（最多 20 条，可清除）
- 🔗 导航栏活跃路由高亮
- ⚠️ 完善的错误状态与加载状态提示

## 技术栈

| 技术 | 版本 |
|------|------|
| React | 18 |
| TypeScript | 5 |
| Vite | 5 |
| Tailwind CSS | 3 |
| React Router | 6 |
| Axios | 1 |
| Lucide React | 0.294 |
| Express | 5 |
| Cheerio | 1 |

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器（前端 + 后端同时启动）

```bash
npm run dev
```

浏览器访问 http://localhost:3000

### 3. 构建生产版本

```bash
npm run build
```

## 部署

### Vercel（推荐，支持完整 API）

直接连接 GitHub 仓库部署至 Vercel，无需额外配置。

### GitHub Pages（仅静态前端）

推送到 `main` 分支后，GitHub Actions 自动构建并部署。

> **注意**：GitHub Pages 部署为纯静态前端，API 请求需配置 `VITE_API_URL` 环境变量指向独立部署的后端。

## 项目结构

```
novel-spider/
├── api/                        # Vercel Serverless/Edge Functions
│   ├── index.js                # 主 API 入口 (popular/latest/search/novel)
│   └── novel/[ncode]/
│       ├── chapters.js         # 章节目录 (Edge Runtime)
│       └── chapter/[num].js    # 章节内容 (Edge Runtime)
├── server/
│   └── index.js                # Express 开发服务器
├── src/
│   ├── components/
│   │   ├── Header.tsx          # 导航栏（含活跃路由高亮）
│   │   └── NovelCard.tsx       # 小说卡片
│   ├── pages/
│   │   ├── Home.tsx            # 首页（热门 + 最新 + 阅读历史）
│   │   ├── Search.tsx          # 搜索页（含分页加载更多）
│   │   ├── NovelDetail.tsx     # 小说详情页（含章节过滤）
│   │   └── Reader.tsx          # 阅读页（夜间模式 + 字体调节 + 触摸滑动）
│   ├── hooks/
│   │   └── useReadingProgress.ts  # 阅读进度 localStorage 管理
│   ├── api.ts                  # API 客户端
│   ├── types.ts                # TypeScript 类型定义
│   └── App.tsx                 # 路由配置
├── vercel.json                 # Vercel 路由配置
└── .github/workflows/
    └── deploy.yml              # GitHub Pages 自动部署
```

## 许可证

MIT
