# BahasaBelajar — 部署 & 交接文档

> 更短的日常操作版见 [UPDATE_GUIDE.md](/Users/mac/Desktop/roi/Bantu/BahasaBelajar/UPDATE_GUIDE.md)

## 项目架构

```
手机浏览器 → GitHub Pages (静态 H5) → Supabase (PostgreSQL + Edge Functions)
```

- **前端**：`h5/index.html`，单文件 SPA，无构建步骤
- **图片资源**：`h5/img/`（等级徽章 + app logo）
- **部署仓库**（GitHub Pages）：`roisantoso-id/bahasabelajar`，分支 `master`
- **Supabase Project URL**：`https://bzdelpmcewjdvmgyafux.supabase.co`
- **线上地址**：`https://roisantoso-id.github.io/bahasabelajar/`

---

## 一、前端部署到 GitHub Pages

### 部署仓库克隆（第一次）

```bash
gh repo clone roisantoso-id/bahasabelajar ~/bahasabelajar-deploy
```

### 每次更新流程

```bash
# 1. 复制改好的文件到部署仓库
cp h5/index.html ~/bahasabelajar-deploy/index.html

# 如果 h5/img/ 有新图片也一起复制
cp -r h5/img ~/bahasabelajar-deploy/img

# 2. 提交推送
cd ~/bahasabelajar-deploy
git add -A
git commit -m "更新说明"
git push
```

### 验证是否部署成功

```bash
# 查看 Pages 构建状态（built = 完成，约 1-2 分钟）
gh api repos/roisantoso-id/bahasabelajar/pages/builds/latest --jq '.status'

# 验证线上内容
curl -s https://roisantoso-id.github.io/bahasabelajar/ | grep -c "BahasaBelajar"
```

---

## 二、词汇测评题库

这套新的 `BIPA 模拟测评` 现在改成 **Supabase 表驱动**：

- 前端只负责读取 `public.vocab_exam_bank`
- 题目更新只改 Supabase 数据，不需要重新部署网页
- 题库表结构和初始数据分别放在：
  - `supabase/vocab-exam-schema.sql`
  - `supabase/vocab-exam-seed.sql`

你需要在 Supabase Dashboard 里先执行这两个 SQL 文件。之后再更新题目，直接在这张表里增删改即可。

网页部署时只需要同步前端文件：

```bash
cp h5/index.html ~/bahasabelajar-deploy/index.html
cp -r h5/img ~/bahasabelajar-deploy/img
```

如果以后你想把测评结果也存库，再另外加结果表和写入逻辑；当前这版先不需要。

---

## 三、Supabase 建表 SQL

在 Supabase Dashboard → **SQL Editor** 手动执行（anon key 无法建表，必须在 Dashboard 跑）。

> 其余表的建表 SQL 在 `supabase/` 目录下各 `.sql` 文件中。当前测评题库本身不需要数据库表。

> 这条现在改掉了：`BIPA 模拟测评` 需要 `vocab_exam_bank` 表，见上面的两个 SQL 文件。

---

## 四、内容更新（词汇 / 文章）

内容数据存在 Supabase，本地 `seed/*.json` 是源文件。

```bash
# 上传单词（按 word 去重，已存在跳过）
node scripts/add-words.js <json文件路径>

# 上传文章（按 title 去重）
node scripts/add-articles.js <json文件路径>
```

JSON 格式见 `CLAUDE.md`「如何更新内容」章节。

---

## 五、本地预览

```bash
node h5/serve.js
# 打开 http://localhost:4173
```

---

## 六、当前功能清单

| 功能 | 状态 |
|------|------|
| 邮箱登录 / 注册 | ✅ |
| SRS 背单词（间隔重复） | ✅ |
| 课程主线（课本课次） | ✅ |
| 语法笔记 | ✅ |
| 词库浏览 / 搜索 | ✅ |
| 印尼语文章（逐句对照） | ✅ |
| 印尼文化卡片 | ✅ |
| 日历打卡 | ✅ |
| 划词翻译（Qwen + MyMemory 降级） | ✅ |
| 文章笔记 | ✅ |
| 发音（Qwen TTS / Web Speech） | ✅ |
| BIPA 模拟测评（三段式） | ✅ |
| 词汇 / 句子 / 阅读题库 | ✅ |
| 结果分享 | ✅ |
| 测评结果存库 | ⏳ 可选，当前不需要 |
| PWA 图标（logo.png） | ✅ |
| 每日内容 Routine（定时任务） | ✅ |

---

## 七、关键配置（已硬编码在 h5/index.html 顶部）

```js
const SUPABASE_URL = 'https://bzdelpmcewjdvmgyafux.supabase.co'
const SUPABASE_KEY = 'eyJhbGci...'   // anon key，公开设计，RLS 控制写入
```

Qwen API key 存在 Supabase 密钥 `DASHSCOPE_KEY`，通过 Edge Function `qwen` 代理，不进前端。

---

## 八、目录结构

```
BahasaBelajar/
├── h5/
│   ├── index.html        # 全部前端（单文件 SPA）
│   ├── serve.js          # 本地预览服务器
│   └── img/              # 图片资源
│       ├── logo.png          # App 图标（1254×1254）
│       └── ...               # 旧的词汇估算图卡可保留，不再是必需项
├── supabase/
│   ├── functions/
│   │   └── qwen/index.ts         # Qwen 翻译+TTS 代理
│   ├── schema.sql            # 核心表
│   ├── grants.sql            # 权限
│   ├── modules.sql           # 文章+文化表
│   ├── routine-grants.sql    # routine 写权限
│   ├── auth-notes-migration.sql  # 登录+笔记表
│   ├── vocab-exam-schema.sql     # BIPA 模拟测评题库表
│   └── vocab-exam-seed.sql       # BIPA 模拟测评初始题库
├── scripts/
│   ├── add-words.js          # 上传词汇
│   └── add-articles.js       # 上传文章
├── seed/                     # 内容 JSON 源文件
├── routines/
│   └── daily-content.md      # 每日内容定时任务 prompt
├── CLAUDE.md                 # 项目说明（给 Claude Code 用）
└── DEPLOY.md                 # 本文档（部署交接）
```
