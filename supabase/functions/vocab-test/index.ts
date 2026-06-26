import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VT_BANDS: Record<number, number> = { 1: 1000, 2: 3000, 3: 6000 }
const LV_NAMES: Record<number, string> = { 1: '入门高频词', 2: '初级词', 3: '中级词' }

const VT_LEVELS = [
  { key: 'buta',     max: 200      },
  { key: 'pemula',   max: 1000     },
  { key: 'menengah', max: 3000     },
  { key: 'jago',     max: 6500     },
  { key: 'master',   max: Infinity },
]

function wilsonCI(k: number, n: number, z = 1.96): [number, number] {
  if (!n) return [0, 1]
  const p = k / n
  const denom = 1 + z * z / n
  const center = (p + z * z / (2 * n)) / denom
  const margin = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / denom
  return [Math.max(0, center - margin), Math.min(1, center + margin)]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const body = await req.json()
    const samples: { level: number; sampled: number; known: number }[] = body.samples || []

    let estimate = 0, ciLow = 0, ciHigh = 0
    const rows = samples.map(s => {
      const [pL, pH] = wilsonCI(s.known, s.sampled)
      const rate = s.sampled ? s.known / s.sampled : 0
      const band = VT_BANDS[s.level] || 1000
      const est = Math.round(rate * band)
      ciLow += Math.round(pL * band)
      ciHigh += Math.round(pH * band)
      estimate += est
      return { level: s.level, name: LV_NAMES[s.level] || '', sampled: s.sampled, known: s.known, est }
    })

    estimate = Math.round(estimate / 10) * 10
    ciLow = Math.round(ciLow / 10) * 10
    ciHigh = Math.round(ciHigh / 10) * 10
    const lvInfo = VT_LEVELS.find(l => estimate < l.max) || VT_LEVELS[VT_LEVELS.length - 1]

    // Store result if user is authenticated
    let stored = false
    const authHeader = req.headers.get('authorization')
    if (authHeader) {
      try {
        const sbUrl = Deno.env.get('SUPABASE_URL')!
        const sbServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const token = authHeader.replace('Bearer ', '')
        const sb = createClient(sbUrl, sbServiceKey)
        const { data: { user } } = await sb.auth.getUser(token)
        if (user) {
          await sb.from('vocab_tests').insert({
            user_id: user.id,
            estimate,
            ci_low: ciLow,
            ci_high: ciHigh,
            level_key: lvInfo!.key,
            raw: rows,
          })
          stored = true
        }
      } catch (_) { /* non-fatal */ }
    }

    return Response.json({ estimate, ciLow, ciHigh, lvInfo, rows, stored }, { headers: CORS })
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 400, headers: CORS })
  }
})
