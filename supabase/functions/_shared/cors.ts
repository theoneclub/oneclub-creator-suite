// Called directly from a browser (your Horizons frontend), so CORS must be
// handled explicitly — Edge Functions don't get this for free.
// Access-Control-Allow-Origin is wildcarded because there's no per-request
// auth boundary here (member_id is a trusted client-supplied param, matching
// the rest of this platform's existing security model) — CORS is not a
// security control in that setup, just a browser-fetch requirement. Narrow
// this to your real domain once you're ready to lock it down.
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
}

export function handleOptions(req: Request): Response | null {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  return null
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
