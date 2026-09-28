// ============================================================
// Edge Function: jackpots
// Public GET endpoint for the landing page: scrapes the Texas Lottery
// Powerball / Mega Millions pages server-side (the browser can't — no CORS)
// and returns the advertised annuitized jackpot + next draw date.
//
// Cached in-isolate and via Cache-Control for 15 minutes. Deploy with:
//   supabase functions deploy jackpots --no-verify-jwt
// ============================================================
import { corsHeaders } from "../_shared/cors.ts";

type Jackpot = { amountDisplay: string; nextDrawDate: string }; // YYYY-MM-DD

const PAGES = {
  powerball: {
    url: "https://www.texaslottery.com/export/sites/lottery/Games/Powerball/index.html",
    marker: "powerball.png",
  },
  megamillions: {
    url: "https://www.texaslottery.com/export/sites/lottery/Games/Mega_Millions/index.html",
    marker: "mega_millions.png",
  },
} as const;

const TTL_MS = 15 * 60 * 1000;

const JACKPOT_LINE_HTML =
  /Est\.\s*Annuitized\s+Jackpot\s+for\s+(\d{2}\/\d{2}\/\d{4})\s*:\s*<\/p>\s*<h1>(\$[^<]+)<\/h1>/i;
const JACKPOT_LINE_JINA_CURRENT =
  /Current Est\.\s*Annuitized\s+Jackpot\s+for\s+(\d{2}\/\d{2}\/\d{4})\s*:\s*\r?\n\s*#\s*(\$[^\r\n]+)/i;
const JACKPOT_LINE_JINA_ALT =
  /Est\.\s*Annuitized\s+Jackpot\s+for\s+(\d{2}\/\d{2}\/\d{4})\s+is\s*:\s*\r?\n\s*#\s*(\$[^\r\n]+)/i;

let cache: { at: number; body: Record<keyof typeof PAGES, Jackpot | null> } | null = null;

function toJackpot(m: RegExpMatchArray | null): Jackpot | null {
  if (!m) return null;
  const [mm, dd, yyyy] = m[1].split("/");
  return { nextDrawDate: `${yyyy}-${mm}-${dd}`, amountDisplay: m[2].trim() };
}

async function fetchText(url: string, accept: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: accept, "User-Agent": "LottoDream/1.0 (+https://lottodream.net)" },
      signal: AbortSignal.timeout(8000),
    });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

async function scrape(page: (typeof PAGES)[keyof typeof PAGES]): Promise<Jackpot | null> {
  const html = await fetchText(page.url, "text/html");
  if (html) {
    const idx = html.toLowerCase().indexOf(page.marker);
    if (idx !== -1) {
      const hit = toJackpot(html.slice(idx, idx + 1000).match(JACKPOT_LINE_HTML));
      if (hit) return hit;
    }
  }
  // Texas sometimes blocks datacenter IPs; Jina Reader renders the same page.
  const md = await fetchText(`https://r.jina.ai/${page.url}`, "text/markdown, text/plain");
  return md ? toJackpot(md.match(JACKPOT_LINE_JINA_CURRENT) ?? md.match(JACKPOT_LINE_JINA_ALT)) : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  if (!cache || Date.now() - cache.at > TTL_MS) {
    const [powerball, megamillions] = await Promise.all([
      scrape(PAGES.powerball),
      scrape(PAGES.megamillions),
    ]);
    // Keep the previous good value for a game if this scrape failed.
    const body = {
      powerball: powerball ?? cache?.body.powerball ?? null,
      megamillions: megamillions ?? cache?.body.megamillions ?? null,
    };
    cache = { at: Date.now(), body };
  }

  return new Response(JSON.stringify(cache.body), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=900, stale-while-revalidate=3600",
    },
  });
});
