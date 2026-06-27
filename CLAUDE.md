# BahasaBelajar — 印尼语学习 app

个人用的印尼语学习应用，边学课本边迭代。

## 架构（现行）

```
手机浏览器  →  GitHub Pages (静态 H5)  →  Supabase (PostgreSQL + REST API)
```

- **前端**：`h5/index.html`，单文件 SPA，用 CDN 引入 Supabase JS 客户端。无构建步骤。
- **数据库**：Supabase。URL 和 anon key 已硬编码在 `h5/index.html` 顶部（anon key 公开是设计如此，RLS 控制写入）。
- **线上地址**：https://roisantoso-id.github.io/bahasabelajar/
- 早期的 `server.js` / `db.js` / `srs.js`（Node + 内置 sqlite）和 `miniprogram/`（微信小程序）是历史方案，**已弃用**，保留备查。现在一切走 Supabase + H5。

### Supabase 信息
- Project URL：`https://bzdelpmcewjdvmgyafux.supabase.co`
- 表：`words`、`grammar`、`learning`、`checkins`、`settings`、`articles`、`culture`、`profiles`、`article_notes`、`translations`、`qwen_usage`、`lessons`、`vocab_exam_bank`

### 内容架构（课程主线 · `supabase/lessons-schema.sql`）
- `lessons` 表 = 课本课程（第1课、2课…）。
- `words`/`articles` 加了 `lesson`(第几课)、`source`、`freq`(词频排名)；`grammar` 加了 `source`。`words.source` 默认 `routine`。
- **source 四类**：`core`(基础词库 id1-500) / `textbook`(课本课程词，带 lesson) / `routine`(routine 自动生成的拓展) / `user`(划词收藏)。
- **学习主线顺序**：startLearn 先 `textbook`(按 lesson、freq) → 不够再 `core`(按 freq)，**不含 routine**。`startExtra()` 学 routine+user 拓展词；`startLessonWords(no)` 学某课的词。
- 底部 tab：今日 · **课程** · 词库 · 日历 · 我的（文章/文化/拓展词 挪到「今日」页的「拓展」组）。
- 建表/权限 SQL 都在 `supabase/`：`schema.sql`（核心表）、`grants.sql`、`modules.sql`（文章+文化）、`routine-grants.sql`、`auth-notes-migration.sql`（登录+笔记）

### 登录 / 多用户（Supabase Auth）
- 邮箱+密码登录（`sb.auth.signInWithPassword` / `signUp`）。没登录显示 `v-auth` 全屏登录页，隐藏底部 tab。
- 每用户数据隔离靠 RLS：`learning`/`checkins`/`profiles`/`article_notes` 都有 `user_id`（默认 `auth.uid()`），策略 `auth.uid() = user_id`。
- `words`/`grammar`/`articles`/`culture` 仍公开只读，routine 照常用 anon 上传。
- 关键：需在 Supabase Dashboard 关闭 "Confirm email"，注册才能即时登录。
- ⚠️ 这套登录是 `auth-notes-migration.sql` 跑完才生效。前端对缺表/未登录做了**优雅降级**（try/catch，缺表用默认值，不崩）。

## 模块

| 模块 | 表 | 内容 | H5 视图 |
|------|----|------|---------|
| 登录 | auth.users, profiles | 邮箱+密码，多用户隔离 | v-auth |
| 今日/学习 | words, learning, checkins | SRS 间隔重复背词；每日目标取自 profiles | v-home, v-study |
| 语法笔记 | grammar | 词缀规则、句型 | v-grammar |
| 词库 | words | 搜索/分级浏览 | v-words |
| 印尼文章 | articles | 长文逐句对照（时政/经济/科技） | v-articles, v-article |
| 印尼文化 | culture | 文化卡片 + 相关词（入口在「今日」页） | v-culture |
| 日历 | checkins | 月历 + 连续天数 + 打卡标记（仿小程序） | v-calendar |
| 我的 | profiles | 头像/邮箱、统计、每日计划、退出登录、Supabase 配置 | v-profile |
| 划词翻译 | words + Qwen/MyMemory | 选中印尼语弹出释义；词库优先→Qwen(qwen-mt-turbo)，失败回退 MyMemory | #transPop |
| 文章笔记 | article_notes | 文章里划线+写笔记，高亮渲染，可删（按用户） | #noteEditor |
| 发音 | Qwen TTS / Web Speech | 🔊 默认 Qwen(qwen3-tts-flash)，失败/切换回退系统 id-ID；「我的」页可切引擎 | speak() / ttsEngine |

### Qwen 代理（Supabase Edge Function `qwen`）
- 翻译 + TTS 都经边缘函数 `supabase/functions/qwen/index.ts` 代理（百炼 key 存为 Supabase 密钥 `DASHSCOPE_KEY`，绝不进前端）。
- 为什么需要：静态站浏览器直连百炼被 CORS 拦，且 key 不能进公开页面。
- 翻译走工作区兼容端点（qwen-mt-turbo）；TTS 走 dashscope-intl（qwen3-tts-flash，返回音频 URL→函数取字节转 https 流回，避开混合内容）。
- ⚠️ Qwen TTS 不支持印尼语（用 auto，可能不准）；前端 `ttsEngine` 可切回免费 Web Speech。
- 部署步骤见 `QWEN-SETUP.md`。前端对函数未部署做了回退，未部署也不崩。

底部 tab：今日 · 文章 · 词库 · 日历 · 我的（`#tabBar`）。

打卡完成判定：当天 `new_learned >= profiles.daily_new_words` 时 `completed=1`，连续天数/日历据此计。

SRS 间隔（天）：`{1:1, 2:2, 3:4, 4:7, 5:15, 6:30, 7:60}`，逻辑在 `h5/index.html` 客户端实现。

划词翻译：仅在印尼语文本（`.sent-id / .ex-sentence / .rex-sentence`）上启用；机翻接口 `api.mymemory.translated.net`（免费、无 key、id→zh-CN）。

---

## 如何更新内容（最常见）

内容数据存在 Supabase，本地 `seed/*.json` 是源文件。流程：**改 JSON → 跑上传脚本**。

### 加单词（已有带去重的脚本）
1. 编辑一个 JSON 文件，格式：`{word, pos, meaning, level, examples:[{id, zh}]}`
   - pos 取值：`pron. n. v. adj. adv. prep. conj. interj. num. 短语`
   - level：1 入门 / 2 初级 / 3 中级
2. 跑：`node scripts/add-words.js <文件路径>` —— 自动按 word 去重，已存在的跳过。
   - 前提：`words`/`grammar` 表需有写权限，已通过 `supabase/routine-grants.sql` 开放。

### 加文章 / 文化卡
- 文章（带去重，按 title）：写 JSON → `node scripts/add-articles.js <文件路径>`
   - 格式：`{title, title_zh, level, category, summary, sentences:[{id(印尼语句), zh(翻译), note(词缀/语法注释)}]}`
- 文化卡：`seed/culture.json` → `node scripts/upload-modules.js`（仅在表为空时插入）
   - 格式：`{title, title_id, category, emoji, body, terms:[{word, meaning}]}`
- 旧的全量导入脚本 `upload-modules.js` 只在表为空时插入。**要重新全量导入需先清空表**：
   ```sql
   truncate articles restart identity;   -- 或 culture
   ```

### JSON 注意事项
- 字符串内不要用中文弯引号 `“”`（会被当成字符串结束符导致解析失败）。用直角括号 `「」` 代替。
- 改完务必本地验证：`node -e "require('./seed/articles.json')"`

### 新增一个全新模块（需要建表）
anon key **不能建表**。流程：
1. 在 `supabase/` 写建表 SQL（表 + RLS `using/with check` 策略 + `grant select,insert` + sequence 授权）。
2. 在 Supabase **SQL Editor** 手动跑一次（这一步必须人来做）。
3. 在 `h5/index.html` 加视图 + tab + 加载函数。
4. 写内容 JSON + 上传脚本，跑上传。

> 新的 `BIPA 模拟测评` 题库也按这个流程走，但它是单独的 `vocab_exam_bank` 表，见 `supabase/vocab-exam-schema.sql` 和 `supabase/vocab-exam-seed.sql`。

---

## 每日内容 Routine（自动）

有一个 **scheduled task**（`bahasa-daily-content`）每天两次（雅加达时间约 08:08 / 20:08）自动生成并上传新内容。

- 触发后，Claude 在新会话里读 `routines/daily-content.md` 并照做：搜真实印尼语报道 → 写 2 篇逐句对照文章 + 约 30 个相关新词 → 跑 `scripts/add-articles.js` 和 `scripts/add-words.js` 上传（自动去重）。
- 内容进 Supabase，线上 H5 实时拉取，**无需重新部署**。
- 任务存在 `~/.claude/scheduled-tasks/bahasa-daily-content/`，可在 app 侧栏「Scheduled」里管理。运行需本 app 开着；关着时下次打开会补跑。
- **首次需点一次「Run now」预授权工具**（WebSearch / WebFetch / Bash），否则自动运行会卡在权限弹窗。
- 调量/改时间：改那个任务的 prompt 或 cron（`8 8,20 * * *`）。语法规则有限，routine 不强制每次加。

写权限：`words`/`grammar` 的 insert 由 `supabase/routine-grants.sql` 开放；`articles`/`culture` 由 `supabase/modules.sql` 开放。

---

## 如何更新前端 / 部署

前端就是 `h5/index.html` 一个文件。改完后推到部署仓库即可，GitHub Pages 自动重建（约 1–2 分钟）。

更短的部署/更新速查见 [UPDATE_GUIDE.md](/Users/mac/Desktop/roi/Bantu/BahasaBelajar/UPDATE_GUIDE.md)。

部署仓库（独立于本项目，只含 `index.html`）：仓库 `roisantoso-id/bahasabelajar`，分支 `master`，Pages 从根目录服务。

```bash
# 1. 本项目 h5/index.html 改好后，复制到部署仓库的克隆目录
cp h5/index.html <部署仓库克隆路径>/index.html
# 2. 如果 h5/img/ 有改动，也一起复制
cp -r h5/img <部署仓库克隆路径>/img
# 3. 提交推送
cd <部署仓库克隆路径>
git add -A && git commit -m "更新说明" && git push
```

> ⚠️ 之前的部署仓库克隆在 `/tmp/bahasabelajar-deploy`，**重启会丢**。若目录不存在，重新克隆到一个稳定位置：
> ```bash
> gh repo clone roisantoso-id/bahasabelajar ~/bahasabelajar-deploy
> ```

验证线上是否更新：
```bash
curl -s https://roisantoso-id.github.io/bahasabelajar/ | grep -c "<要找的字符串>"
gh api repos/roisantoso-id/bahasabelajar/pages/builds/latest --jq '.status'   # built = 完成
```

### 本地预览
`h5/index.html` 用纯静态服务器跑（Python http.server 在沙箱里会被拦，用 Node）：
```bash
node h5/serve.js          # http://localhost:4173
```

---

## 学习进度

跟着课本《新编基础印度尼西亚语》学，目前在 **第 2 课**。已学词汇/语法随学随加进 app。
- 单词库：约 553 词
- 语法：第 2 课 14 条规则（ber-/me- 系列、per-an、-nya、KPST 规则、kami vs kita 等）
- kami = 我们（**不含**听话者）；kita = 咱们（含在场所有人）
