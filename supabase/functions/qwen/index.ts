// Supabase Edge Function: qwen
// 代理百炼 Qwen —— 翻译(qwen-mt-turbo) 和 TTS(qwen3-tts-flash)
// 防盗刷：① 必须带有效登录 token ② 每用户每日调用上限
//
// 部署：Dashboard → Edge Functions → 函数名 qwen → 粘贴本文件 → "Verify JWT" 关闭 → Deploy
//   （JWT 由本函数内部手动校验，所以平台层 Verify JWT 关掉，避免 CORS 预检被拦）
// 密钥：Edge Functions → Secrets 添加 DASHSCOPE_KEY = 你的 sk-ws-... key
//   （SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 是平台自带，无需设置）
// 可选：再加 Secret QWEN_DAILY_CAP 调整每人每日上限（默认 300）
// 还需在 SQL Editor 建用量表（见 supabase/qwen-usage.sql）

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const DASHSCOPE_KEY = Deno.env.get("DASHSCOPE_KEY") ?? "";
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
  if (!DASHSCOPE_KEY) return j({ error: "DASHSCOPE_KEY 未设置" }, 500);

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
  const { action, text, voice } = body || {};
  if (!text || typeof text !== "string" || text.length > 2000) return j({ error: "no/too-long text" }, 400);

  // 先计数（即使后续失败也计，避免被刷）
  await admin.from("qwen_usage").upsert({ user_id: user.id, day: today, count: used + 1 }, { onConflict: "user_id,day" });

  try {
    if (action === "translate") {
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

    if (action === "tts") {
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
