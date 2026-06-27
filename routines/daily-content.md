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
   - 格式：`{title(印尼语), title_zh, level:3, category:"时政"/"经济"/"科技"/"猎奇", image_url, summary, sentences:[{id:印尼语句, zh:中文, note:词缀/语法注释}]}`
   - **`image_url`（封面图）**：用 WebFetch 取原文页面的 `og:image` meta 标签 content URL 填进去（前端列表/详情会显示）。取不到就省略该字段，别编造。
     - 常见坑：WebFetch 把页面转 markdown 时常把 `<head>` 吞掉，导致取不到 og:image。这时改让它「列出文章正文的 lead 图 URL」，认 CDN 域名（cdn.antaranews.com / akcdn.detik.net.id / cdn1.katadata.co.id 等），挑发布日期当天那张。务必 https 且能热链。
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

### 3. 测评题目（从当批内容自动生成）
从刚写的文章和新词里自动生成一批 BIPA 测评题，上传到 `vocab_exam_bank`。

**生成规则：**

1. **单词题（word）**：从本批新词里挑 6-10 个，生成 `Kata "X" berarti ...` 格式。
   - 4 个选项（1 个正确中文释义 + 3 个干扰项，干扰项从同批其他词的释义里选或自编近义词）
   - difficulty 跟词的 level 对应：level 1→easy, 2→medium, 3→hard
   - explain 写中文解释

2. **句子题（sentence）**：从本批文章里挑 4-6 个好句，挖空关键词做填空题。
   - 格式：`原句把关键词替换为 ___`，4 个选项
   - 被挖掉的词就是答案，干扰项选语法/语义近似但不对的词
   - difficulty 跟文章 level 对应

3. **阅读题（reading）**：从本批 2 篇文章里各取 3-4 句做一个阅读小段，出 2-3 道理解题。
   - passage_title = 文章标题（印尼语），passage_text = 截取的 3-4 句原文拼接
   - 每题有 passage_title 和 passage_text（同一篇共享），sort_order 从 1 开始
   - difficulty 跟文章 level 对应

**JSON 格式**（写到 `seed/_tmp-exam.json`）：
```json
[
  {
    "section": "word",
    "difficulty": "medium",
    "prompt": "Kata \"inflasi\" berarti ...",
    "options": ["通货膨胀", "利率", "汇率", "预算"],
    "answer": "通货膨胀",
    "explain": "inflasi = 通货膨胀"
  },
  {
    "section": "sentence",
    "difficulty": "hard",
    "prompt": "Pemerintah ___ kebijakan baru untuk menstabilkan harga.",
    "options": ["mengeluarkan", "menghapus", "menyimpan", "menutup"],
    "answer": "mengeluarkan",
    "explain": "mengeluarkan kebijakan = 出台政策"
  },
  {
    "section": "reading",
    "difficulty": "medium",
    "prompt": "Di mana festival itu diadakan?",
    "options": ["Jakarta", "Bandung", "Yogyakarta", "Bali"],
    "answer": "Jakarta",
    "explain": "文中第一句提到 di Jakarta",
    "passage_title": "Festival Budaya",
    "passage_text": "Pemerintah kota mengadakan festival budaya di Jakarta. ...",
    "sort_order": 1
  }
]
```

上传：`node scripts/add-exam-questions.js seed/_tmp-exam.json`（按 prompt 去重，已存在的跳过）。

### 3.6 生成发音（新词/新句的 TTS）
上传完新词和文章后，给本批新内容预生成发音并存入 Supabase Storage：

```
node scripts/gen-tts.js
```

- 女声（id-ID-GadisNeural）+ 0.8 慢速，存进 `tts-cache` bucket，按 `words/` 与 `sentences/` 分类。
- 脚本自动从 `.env` 读 Azure / service_role key（不进 git），拉全库做去重，**只生成 Storage 里还没有的**（旧内容秒跳过），所以每批只新增本批音频，约几十条、1-2 分钟。
- 前端用**算法寻址**（前端按 `SHA-256(voice|rate|text)` 现算 Storage 路径），所以**无需把音频地址写进 words/articles 表** —— 只要音频按约定 key 存在 Storage，前端必能找到。
- 失败不阻断本批其它产出；下次 routine 会自动补齐漏掉的。

### 4. 收尾
- 删除 `seed/_tmp-*.json` 临时文件。
- 内容存在 Supabase，线上 H5 实时拉取，**无需重新部署**。
- 简短报告：本批上传了 X 词、Y 篇文章、Z 道测评题（及各自跳过数）。

## 注意
- JSON 字符串里别用中文弯引号 `""`，用直角括号 `「」`。
- 题材在**四类**间轮换（时政→经济→科技→猎奇→时政…），别老重复同一话题；标题去重会挡掉同名文章，但要主动求新。
- 猎奇批次可适当降低 level 到 2（初级），语言更口语化，但仍要真实事件。
- 宁可少而精：30 词宁缺毋滥，生僻词不如不收。
