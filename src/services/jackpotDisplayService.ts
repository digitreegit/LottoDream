// ============================================
// Landing page — advertised annuitized jackpot + next draw date
// Web: the `jackpots` Edge Function (scrapes server-side; the browser is
//      blocked by CORS on texaslottery.com).
// Native: Texas Lottery HTML directly, then Jina Reader markdown.
// Both: EXPO_PUBLIC_LANDING_* env fallbacks.
// ============================================
import { Platform } from 'react-native';
import { EDGE_FUNCTIONS_URL } from '../config/constants';

export type LandingJackpotDisplay = {
  amountDisplay: string;
  nextDrawDate: Date;
};

const TX_POWERBALL_PAGE =
  'https://www.texaslottery.com/export/sites/lottery/Games/Powerball/index.html';
const TX_MEGA_PAGE =
  'https://www.texaslottery.com/export/sites/lottery/Games/Mega_Millions/index.html';

const JINA_PREFIX = 'https://r.jina.ai/';

const JACKPOT_LINE_HTML =
  /Est\.\s*Annuitized\s+Jackpot\s+for\s+(\d{2}\/\d{2}\/\d{4})\s*:\s*<\/p>\s*<h1>(\$[^<]+)<\/h1>/i;

/** Jina markdown: "Current Est. ... for MM/DD/YYYY:" then line "# $58 Million" */
const JACKPOT_LINE_JINA_CURRENT =
  /Current Est\.\s*Annuitized\s+Jackpot\s+for\s+(\d{2}\/\d{2}\/\d{4})\s*:\s*\r?\n\s*#\s*(\$[^\r\n]+)/i;

const JACKPOT_LINE_JINA_ALT =
  /Est\.\s*Annuitized\s+Jackpot\s+for\s+(\d{2}\/\d{2}\/\d{4})\s+is\s*:\s*\r?\n\s*#\s*(\$[^\r\n]+)/i;

function parseUsSlashDate(s: string): Date {
  const [mm, dd, yyyy] = s.split('/').map((x) => parseInt(x, 10));
  return new Date(yyyy, mm - 1, dd, 12, 0, 0, 0);
}

/** Exported for tests — slice after first `powerball.png` / `mega_millions.png` in page. */
export function parseTexasJackpotHero(
  html: string,
  markerImage: 'powerball.png' | 'mega_millions.png'
): LandingJackpotDisplay | null {
  const idx = html.toLowerCase().indexOf(markerImage);
  if (idx === -1) return null;
  const chunk = html.slice(idx, idx + 1000);
  const m = chunk.match(JACKPOT_LINE_HTML);
  if (!m) return null;
  return {
    nextDrawDate: parseUsSlashDate(m[1]),
    amountDisplay: m[2].trim(),
  };
}

async function fetchTexasHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'text/html',
        'User-Agent': 'LottoDream/1.0 (marketing landing; contact: app)',
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** Plain-text / markdown from Jina Reader (CORS allows browser fetch to r.jina.ai). */
async function fetchJinaReaderText(pageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(`${JINA_PREFIX}${pageUrl}`, {
      headers: { Accept: 'text/markdown, text/plain, */*' },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export function parseJinaJackpotMarkdown(text: string): LandingJackpotDisplay | null {
  const m = text.match(JACKPOT_LINE_JINA_CURRENT) ?? text.match(JACKPOT_LINE_JINA_ALT);
  if (!m) return null;
  return {
    nextDrawDate: parseUsSlashDate(m[1]),
    amountDisplay: m[2].trim(),
  };
}

function envJackpot(
  amountKey: string,
  dateKey: string
): LandingJackpotDisplay | null {
  const amount =
    typeof process !== 'undefined' && process.env
      ? (process.env as Record<string, string | undefined>)[amountKey]
      : undefined;
  const iso =
    typeof process !== 'undefined' && process.env
      ? (process.env as Record<string, string | undefined>)[dateKey]
      : undefined;
  if (!amount || !iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  return {
    amountDisplay: amount,
    nextDrawDate: new Date(`${iso}T12:00:00`),
  };
}

/**
 * Texas HTML when CORS allows; otherwise Jina markdown; then EXPO_PUBLIC_*:
 * EXPO_PUBLIC_LANDING_PB_JACKPOT, EXPO_PUBLIC_LANDING_PB_NEXT_DRAW_ISO (YYYY-MM-DD)
 * EXPO_PUBLIC_LANDING_MM_JACKPOT, EXPO_PUBLIC_LANDING_MM_NEXT_DRAW_ISO
 */
async function jackpotForTexasPage(
  pageUrl: string,
  marker: 'powerball.png' | 'mega_millions.png'
): Promise<LandingJackpotDisplay | null> {
  const html = await fetchTexasHtml(pageUrl);
  const fromHtml = html ? parseTexasJackpotHero(html, marker) : null;
  if (fromHtml) return fromHtml;
  const md = await fetchJinaReaderText(pageUrl);
  return md ? parseJinaJackpotMarkdown(md) : null;
}

type EdgeJackpot = { amountDisplay: string; nextDrawDate: string } | null;

function fromEdge(j: EdgeJackpot | undefined): LandingJackpotDisplay | null {
  if (!j?.amountDisplay || !/^\d{4}-\d{2}-\d{2}$/.test(j.nextDrawDate)) return null;
  return { amountDisplay: j.amountDisplay, nextDrawDate: new Date(`${j.nextDrawDate}T12:00:00`) };
}

/** Server-side scrape via the public `jackpots` Edge Function (GET, HTTP-cached). */
async function fetchEdgeJackpots(): Promise<[LandingJackpotDisplay | null, LandingJackpotDisplay | null]> {
  if (!EDGE_FUNCTIONS_URL) return [null, null];
  try {
    const res = await fetch(`${EDGE_FUNCTIONS_URL}/jackpots`);
    if (!res.ok) return [null, null];
    const body = (await res.json()) as { powerball?: EdgeJackpot; megamillions?: EdgeJackpot };
    return [fromEdge(body.powerball), fromEdge(body.megamillions)];
  } catch {
    return [null, null];
  }
}

export async function fetchLandingGameJackpots(): Promise<{
  powerball: LandingJackpotDisplay | null;
  megamillions: LandingJackpotDisplay | null;
}> {
  const pbEnv = envJackpot('EXPO_PUBLIC_LANDING_PB_JACKPOT', 'EXPO_PUBLIC_LANDING_PB_NEXT_DRAW_ISO');
  const mmEnv = envJackpot('EXPO_PUBLIC_LANDING_MM_JACKPOT', 'EXPO_PUBLIC_LANDING_MM_NEXT_DRAW_ISO');

  const [fromPb, fromMm] =
    Platform.OS === 'web'
      ? await fetchEdgeJackpots()
      : await Promise.all([
          jackpotForTexasPage(TX_POWERBALL_PAGE, 'powerball.png'),
          jackpotForTexasPage(TX_MEGA_PAGE, 'mega_millions.png'),
        ]);

  return {
    powerball: fromPb ?? pbEnv,
    megamillions: fromMm ?? mmEnv,
  };
}
