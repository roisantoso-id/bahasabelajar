# 每日内容 Routine（定时任务照此执行）

每次触发时，按以下步骤生成「少而精」的一批内容并上传到 Supabase。
工作目录：项目根目录。所有上传脚本在 `scripts/`，会自动去重。

## 产出目标（每批）

- **约 30 个新词**（中级时政/经济/科技/日常高频词，优先和当批文章相关，做到词与阅读打通）
- **2 篇文章**（中高级报刊体，逐句对照，每句带 me-/ber-/per-an/ke-an 等词缀注释）
- **语法**：不强制。仅当遇到当批内容里值得讲的新句型/词缀规则时才加 1 条，避免注水。

## 步骤

### 1. 文章（先做，便于据此选词）
1. 用 WebSearch 搜 2 个**当前**印尼语题材，轮换 时政 / 经济与产业 / 科技 / 猎奇社会（每 4 批一轮）。
   - **正刊信源**（严肃新闻）：`kompas.com`、`tempo.co`、`cnnindonesia.com`、`katadata.co.id`、`antaranews.com`、`kontan.co.id`、`detik.com`、`tirto.id`、`bisnis.com`、`republika.co.id`、`liputan6.com`
   - **猎奇/病毒信源**（适合猎奇社会批次）：`tribunnews.com`、`kumparan.com`、`idntimes.com`、`merdeka.com`、`suara.com`、`viva.co.id`
   - 注意：bbc.com 不可访问。必要时 WebFetch 取 1-2 篇原文，校准地道的报刊语体与真实数据。
2. 据此写 2 篇文章，每篇 14-16 句。**事实要准**，数字按报道写，不编造具体引语。
   - 格式：`{title(印尼语), title_zh, level:3, category:"时政"/"经济"/"科技"/"猎奇", summary, sentences:[{id:印尼语句, zh:中文, note:词缀/语法注释}]}`
   - **猎奇批次选题方向**：印尼奇闻趣事（鳄鱼/火山/神话）、病毒社媒事件、奇特饮食/风俗、野生动物入侵、名人搞笑糗事、印尼版「世界之最」等，要真实有趣、语言地道。
   - 注释专挑词缀（拆词根），把阅读和语法模块挂钩。
3. 写到 `seed/_tmp-articles.json`，上传：`node scripts/add-articles.js seed/_tmp-articles.json`（按标题去重）。

### 2. 新词
1. 从两篇文章里抽高频生词 + 补充同主题常用词，凑到约 30 个。
2. 格式：`{word, pos, meaning, level, examples:[{id:印尼语例句, zh:中文}]}`
   - pos 合法值：`pron. n. v. adj. adv. prep. conj. interj. num. 短语`
   - level：1 入门 / 2 初级 / 3 中级
   - 每词至少 1 个自然例句 + 翻译。
3. 写到 `seed/_tmp-words.json`，上传：`node scripts/add-words.js seed/_tmp-words.json`（按 word 去重，已存在的自动跳过）。

### 3. 收尾
- 删除 `seed/_tmp-*.json` 临时文件。
- 内容存在 Supabase，线上 H5 实时拉取，**无需重新部署**。
- 简短报告：本批上传了 X 词、Y 篇文章（及跳过数）。

## 注意
- JSON 字符串里别用中文弯引号 `""`，用直角括号 `「」`。
- 题材在**四类**间轮换（时政→经济→科技→猎奇→时政…），别老重复同一话题；标题去重会挡掉同名文章，但要主动求新。
- 猎奇批次可适当降低 level 到 2（初级），语言更口语化，但仍要真实事件。
- 宁可少而精：30 词宁缺毋滥，生僻词不如不收。
