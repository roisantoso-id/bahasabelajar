// Supabase Edge Function: qwen
// 代理百炼 Qwen —— 翻译(qwen-mt-turbo)
// 代理 Azure Speech —— TTS(id-ID-ArdiNeural / id-ID-GadisNeural)
// 防盗刷：① 必须带有效登录 token ② 每用户每日调用上限
//
// 部署：Dashboard → Edge Functions → 函数名 qwen → 粘贴本文件 → "Verify JWT" 关闭 → Deploy
//   （JWT 由本函数内部手动校验，所以平台层 Verify JWT 关掉，避免 CORS 预检被拦）
// 密钥（Dashboard → Project Settings → Edge Functions → Secrets）：
//   DASHSCOPE_KEY     = 你的百炼 sk-ws-... key（翻译用）
//   AZURE_SPEECH_KEY  = 你的 Azure Speech 订阅 key
//   AZURE_SPEECH_REGION = eastus（或你的地区）
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 平台自带，无需设置
// 可选：QWEN_DAILY_CAP 调整每人每日上限（默认 300）

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const DASHSCOPE_KEY = Deno.env.get("DASHSCOPE_KEY") ?? "";
const AZURE_SPEECH_KEY = Deno.env.get("AZURE_SPEECH_KEY") ?? "";
const AZURE_SPEECH_REGION = Deno.env.get("AZURE_SPEECH_REGION") ?? "eastus";
const SB_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SVC_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const DAILY_CAP = Number(Deno.env.get("QWEN_DAILY_CAP") ?? "300");

const MT_URL = "https://ws-bkr28ucqmu5st5cz.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions";
const TTS_URL = "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
};
function j(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  // Azure TTS 不依赖 Dashscope，单独判断


  // —— 层1：必须登录 ——
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return j({ error: "未登录" }, 401);
  const admin = createClient(SB_URL, SVC_KEY, { auth: { persistSession: false } });
  const { data: { user }, error: uerr } = await admin.auth.getUser(token);
  if (uerr || !user) return j({ error: "登录无效" }, 401);

  // —— 层2：每用户每日上限 ——
  const today = new Date().toISOString().slice(0, 10);
  const { data: row } = await admin.from("qwen_usage").select("count").eq("user_id", user.id).eq("day", today).maybeSingle();
  const used = row?.count ?? 0;
  if (used >= DAILY_CAP) return j({ error: "今日用量已达上限", cap: DAILY_CAP }, 429);

  let body: any;
  try { body = await req.json(); } catch { return j({ error: "bad json" }, 400); }
  const { action, text, voice, rate } = body || {};
  if (!text || typeof text !== "string" || text.length > 2000) return j({ error: "no/too-long text" }, 400);

  // 先计数
  await admin.from("qwen_usage").upsert({ user_id: user.id, day: today, count: used + 1 }, { onConflict: "user_id,day" });

  try {
    if (action === "translate") {
      if (!DASHSCOPE_KEY) return j({ error: "DASHSCOPE_KEY 未设置" }, 500);
      const r = await fetch(MT_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${DASHSCOPE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen-mt-turbo",
          messages: [{ role: "user", content: text }],
          translation_options: { source_lang: "Indonesian", target_lang: "Chinese" },
        }),
      });
      const d = await r.json();
      const translation = d?.choices?.[0]?.message?.content ?? "";
      if (!translation) return j({ error: "empty translation", detail: d }, 502);
      return j({ translation });
    }

    if (action === "azure_tts") {
      if (!AZURE_SPEECH_KEY) return j({ error: "AZURE_SPEECH_KEY 未设置" }, 500);

      // cache key 含 voice + rate，不同设置分开存
      const voiceName = voice === "female" ? "id-ID-GadisNeural" : "id-ID-ArdiNeural";
      const rateVal   = typeof rate === "number" && rate > 0 ? rate : 1.0;
      const cacheInput = `${voiceName}|${rateVal}|${text}`;
      const hashBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(cacheInput));
      const key = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("") + ".mp3";

      // 先查 Storage 缓存
      const { data: { publicUrl } } = admin.storage.from("tts-cache").getPublicUrl(key);
      const head = await fetch(publicUrl, { method: "HEAD" });
      if (head.ok) return j({ url: publicUrl });

      // 缓存未命中 → 调 Azure TTS（带 prosody rate）
      const esc = (s: string) => s.replace(/[<>&'"]/g, c => ({"<":"&lt;",">":"&gt;","&":"&amp;","'":"&apos;",'"':"&quot;"}[c] ?? c));
      const rateStr = rateVal !== 1.0 ? ` rate="${Math.round(rateVal * 100)}%"` : "";
      const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='id-ID'><voice name='${voiceName}'><prosody${rateStr}>${esc(text)}</prosody></voice></speak>`;
      const azureResp = await fetch(`https://${AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": AZURE_SPEECH_KEY,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
          "User-Agent": "BahasaBelajar",
        },
        body: ssml,
      });
      if (!azureResp.ok) {
        const msg = await azureResp.text().catch(() => "");
        return j({ error: `Azure TTS ${azureResp.status}`, detail: msg }, 502);
      }
      const audioBuf = await azureResp.arrayBuffer();

      // 上传到 Supabase Storage（异步，不阻塞返回）
      admin.storage.from("tts-cache").upload(key, audioBuf, {
        contentType: "audio/mpeg",
        cacheControl: "31536000",
        upsert: false,
      }).catch(() => {});

      return j({ url: publicUrl });
    }

    if (action === "tts") {
      if (!DASHSCOPE_KEY) return j({ error: "DASHSCOPE_KEY 未设置" }, 500);
      const r = await fetch(TTS_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${DASHSCOPE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen3-tts-flash",
          input: { text, voice: voice || "Cherry", language_type: "auto" },
        }),
      });
      const d = await r.json();
      const url = d?.output?.audio?.url;
      if (!url) return j({ error: "no audio url", detail: d }, 502);
      const audio = await fetch(url);
      if (!audio.ok) return j({ error: "fetch audio failed " + audio.status }, 502);
      const buf = await audio.arrayBuffer();
      return new Response(buf, { headers: { ...CORS, "Content-Type": "audio/wav", "Cache-Control": "no-store" } });
    }

    return j({ error: "unknown action" }, 400);
  } catch (e) {
    return j({ error: String(e) }, 500);
  }
});
