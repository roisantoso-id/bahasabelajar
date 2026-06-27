---
name: generate-tts
description: >
  预生成 / 补充印尼语发音音频（Azure TTS → Supabase Storage），供 H5 前端直读。
  当用户要「生成发音 / 补发音 / 预生成语音 / TTS / 改语速 / 改音色」，或排查
  「发音没声音 / 发音找不到」时使用；routine 每批新内容后也调它补发音。
---

# 印尼语发音预生成（gen-tts）

这套把所有印尼语文本（单词 / 文章句 / 例句）用 Azure Neural TTS 提前合成 mp3，
存进 Supabase Storage 的 `tts-cache` bucket。前端**算法寻址**直读，不实时调 Azure、
不依赖登录态，所以永不失败、不重复烧 token。

## 核心架构（务必理解，别走弯路）

- **算法寻址，不存地址**：前端拿到文本 `text`，当场算
  `路径 = <cat>/SHA-256("id-ID-GadisNeural|0.8|" + text).hex + ".mp3"`，
  直接去 `tts-cache` 取。脚本生成时用**完全相同**的算法存。两边永远对得上，
  所以**不需要**在 `words`/`articles` 表里存任何 `audio_url` 字段。
  → 「发音找不到」永远不是"地址没写进数据库"，而是「Storage 里没这个文件」或
    「语速/音色参数前后端不一致导致算出的 key 对不上」。
- **固定参数**：女声 `id-ID-GadisNeural` + 语速 `0.8`（数字倍率）。前端常量在
  `h5/index.html`：`TTS_VOICE_NAME` / `TTS_RATE`；脚本在 `scripts/gen-tts.js`：`VOICE` / `RATE`。
  **两边必须逐字节一致**，否则 hash 不同、前端读不到。
- **分文件夹**：`words/`（单词）、`sentences/`（文章句 + 例句）。
- **三层缓存**：前端 L1 IndexedDB（`v3|cat|text` 为 key）→ L2 Storage public → 兜底 Web Speech。

## ⚠️ Azure 语速的坑（踩过，别再踩）

Azure SSML `prosody rate` **不带正负号的百分比会被当成「加速」**：
`rate="75%"` ≈ **1.75 倍速（更快！）**。必须用**数字倍率**：`rate="0.8"` = 0.8 倍速（慢）。
`scripts/gen-tts.js` 已用数字倍率，别改回百分比。

## 常规用法：生成 / 补全发音

```bash
node scripts/gen-tts.js
```

- 自动从项目根 `.env` 读 `AZURE_SPEECH_KEY` 和 `SUPABASE_SERVICE_KEY`（已 gitignore）。
- 拉全库 `words` + `articles`，对每条 HEAD 检查 Storage 是否已存在，**只生成缺的**
  （旧的秒跳过），所以每次跑都安全、幂等。routine 每批新内容后跑它即补齐本批。
- 失败 0 才算干净；个别失败会重试 3 次，仍失败会打印，下次跑会补。
- 可选 env：`CONCURRENCY`（默认 4，Azure 免费层别调太高）、`DRY_RUN=1`（只统计不生成、不需 key）。

⏱ 几百条以内 1–2 分钟；全量 2203 条约 8–10 分钟。**大批量用前台 + `timeout: 600000` 同步跑**，
别用后台（本环境后台易被中断）。

## 改语速 / 改音色（牵一发动全身）

1. 改 `scripts/gen-tts.js` 的 `RATE`（和 `VOICE`），SSML 用数字倍率 `rate="${RATE}"`。
2. **同步**改 `h5/index.html` 的 `TTS_RATE`（和 `TTS_VOICE_NAME`），值必须一致。
3. bump `h5/index.html` 里 `_idbKey` 的版本号（`v3`→`v4`），作废用户本地旧缓存。
4. 部署前端（见下），然后**全量重跑** `node scripts/gen-tts.js`（新参数 = 新 key = 全新文件，
   会 upsert；旧参数的文件成孤儿，留着无害）。
5. 改前先用直链试听一两条再决定值（生成一句 → 打印 public URL 点开听），避免全量来回。

## 部署前端

前端是单文件 `h5/index.html`，改完复制到部署仓库推送（GitHub Pages 自动重建）：

```bash
cp h5/index.html ~/bahasabelajar-deploy/index.html
cd ~/bahasabelajar-deploy && git add index.html && git commit -m "<说明>" && git push
```

部署后真机需**强制刷新 / 关掉重开**（Service Worker 可能缓存旧页面）。

## 验证

```bash
# 统计两个文件夹的文件数（应 = words 数 / 文章句+例句数）
node -e '
const fs=require("fs"),p=require("path");
for(const l of fs.readFileSync(p.join(process.cwd(),".env"),"utf8").split("\n")){const m=l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].trim();}
const SB="https://bzdelpmcewjdvmgyafux.supabase.co",SV=process.env.SUPABASE_SERVICE_KEY;
async function c(prefix){let t=0,o=0;while(true){const r=await fetch(`${SB}/storage/v1/object/list/tts-cache`,{method:"POST",headers:{Authorization:`Bearer ${SV}`,"Content-Type":"application/json"},body:JSON.stringify({prefix,limit:1000,offset:o})});const rows=await r.json();if(!Array.isArray(rows))break;t+=rows.length;if(rows.length<1000)break;o+=1000;}return t;}
(async()=>{console.log("words/",await c("words/"));console.log("sentences/",await c("sentences/"));})();
'
```

## 排错

- **某条没声音** → 多半该文本没被预生成（新词 routine 没跑 gen-tts，或个别生成失败）。
  跑 `node scripts/gen-tts.js` 补即可。前端会自动降级 Web Speech，不会崩。
- **全部没声音** → 查 ① 前后端 `RATE`/`VOICE` 是否一致；② `.env` 的 key 是否有效
  （service_role 若被 Roll 过要更新 `.env`）；③ `tts-cache` bucket 是否 public。
- **想看真机错误** → 前端 `localStorage.tts_debug='1'` 开启失败 toast。

## 前置条件（一次性，已就绪）

- `tts-cache` bucket 已建且 public（read policy）。
- `.env` 已有 `AZURE_SPEECH_KEY` / `AZURE_SPEECH_REGION` / `SUPABASE_SERVICE_KEY`。
- service_role 仅本地脚本用，**绝不进前端 / 不提交 git**。
