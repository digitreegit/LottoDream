// ============================================
// Lottery Data Service
// Fetches historical draws from NY Open Data API
// Supports Powerball & Mega Millions
// ============================================
import { supabase } from '../config/supabase';
import { getGameConfig } from '../config/constants';
import { Draw, GameType } from '../types';

interface NYOpenDataRow {
  draw_date: string;
  winning_numbers: string; // "01 02 03 04 05"
  multiplier?: string;
  mega_ball?: string; // Mega Millions specific
  megaplier?: string;
  [key: string]: any;
}

interface OfficialDrawRow {
  draw_date?: string;
  field_draw_date?: string;
  date?: string;
  values?: Record<string, any>;
  winning_numbers?: string;
  field_winning_numbers?: string;
  white_balls?: string;
  whiteBalls?: string;
  powerball?: string | number;
  power_ball?: string | number;
  red_ball?: string | number;
  mega_ball?: string | number;
  megaBall?: string | number;
  multiplier?: string | number;
  powerplay?: string | number;
  megaplier?: string | number;
  [key: string]: any;
}

interface SyncMetaData {
  last_official_sync_at?: string;
  official_source_url?: string;
  official_rows_synced?: number;
  official_rows_received?: number;
  official_rows_rejected?: number;
  official_reject_reasons?: Record<string, number>;
}

interface OfficialFetchResult {
  sourceUrl: string;
  rows: OfficialDrawRow[];
}

const OFFICIAL_SYNC_COOLDOWN_HOURS = 4;

function toNumber(value: any, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = parseInt(value, 10);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function toNullableNumber(value: any): number | null {
  const parsed = toNumber(value, NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDraw(raw: any, game: GameType): Draw {
  const bonus =
    raw.powerball ??
    raw.mega_ball ??
    raw.megaball ??
    raw.bonus_ball ??
    raw.megaBall;

  return {
    ...raw,
    game,
    draw_date: String(raw.draw_date).split('T')[0],
    n1: toNumber(raw.n1),
    n2: toNumber(raw.n2),
    n3: toNumber(raw.n3),
    n4: toNumber(raw.n4),
    n5: toNumber(raw.n5),
    powerball: toNumber(bonus),
    powerplay: raw.powerplay == null ? null : toNumber(raw.powerplay),
  };
}

function normalizeDate(value: unknown): string | null {
  if (!value) return null;
  const asString = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(asString)) return asString;
  const parsed = new Date(asString);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function parseWinningNumbersStrict(raw: string, expectedWhiteCount: number): { whites: number[]; bonus?: number } | null {
  const nums = raw.match(/\d+/g)?.map(Number) || [];
  if (nums.length < expectedWhiteCount) return null;
  return {
    whites: nums.slice(0, expectedWhiteCount),
    bonus: nums[expectedWhiteCount],
  };
}

function getFirstDefined<T>(...values: T[]): T | undefined {
  for (const value of values) {
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function parseOfficialRow(
  row: OfficialDrawRow,
  game: GameType,
  config: ReturnType<typeof getGameConfig>
): { draw: Omit<Draw, 'id' | 'created_at'> | null; reason?: string } {
  const rawDate =
    row.draw_date ??
    row.field_draw_date ??
    row.date ??
    row.values?.draw_date ??
    row.values?.field_draw_date ??
    row.values?.date;
  const date = normalizeDate(rawDate);
  if (!date) return { draw: null, reason: 'invalid_date' };

  const values = row.values || {};
  // Strict schema priority for official feeds.
  const winningRaw = getFirstDefined(
    row.field_winning_numbers,
    row.winning_numbers,
    row.white_balls,
    row.whiteBalls,
    values.field_winning_numbers,
    values.winning_numbers,
    values.white_balls,
    values.whiteBalls,
    ''
  );

  const parsed = parseWinningNumbersStrict(String(winningRaw), config.whiteCount);
  if (!parsed) return { draw: null, reason: 'invalid_winning_numbers' };
  const whiteParts = parsed.whites;
  const bonusFromField = toNumber(
    row.powerball ??
      row.power_ball ??
      row.red_ball ??
      row.mega_ball ??
      row.megaBall ??
      values.powerball ??
      values.power_ball ??
      values.red_ball ??
      values.mega_ball ??
      values.megaBall,
    NaN
  );
  const bonus =
    parsed.bonus ?? (Number.isFinite(bonusFromField) ? bonusFromField : NaN);

  const hasValidWhites =
    whiteParts.length === config.whiteCount &&
    whiteParts.every((n) => n >= 1 && n <= config.whiteMax) &&
    new Set(whiteParts).size === config.whiteCount;
  const hasValidBonus = Number.isFinite(bonus) && bonus >= 1 && bonus <= config.bonusMax;

  if (!hasValidWhites || !hasValidBonus) {
    if (!hasValidWhites) return { draw: null, reason: 'invalid_white_range_or_duplicate' };
    return { draw: null, reason: 'invalid_bonus_range' };
  }

  return {
    draw: {
      game,
      draw_date: date,
      n1: whiteParts[0],
      n2: whiteParts[1],
      n3: whiteParts[2],
      n4: whiteParts[3],
      n5: whiteParts[4],
      powerball: bonus,
      powerplay:
        row.multiplier != null
          ? toNullableNumber(row.multiplier)
          : row.powerplay != null
            ? toNullableNumber(row.powerplay)
            : row.megaplier != null
              ? toNullableNumber(row.megaplier)
              : values.multiplier != null
                ? toNullableNumber(values.multiplier)
                : values.powerplay != null
                  ? toNullableNumber(values.powerplay)
                  : values.megaplier != null
                    ? toNullableNumber(values.megaplier)
                    : null,
    },
  };
}

async function upsertDrawBatches(table: string, draws: Omit<Draw, 'id' | 'created_at'>[]): Promise<number> {
  if (draws.length === 0) return 0;
  let insertedCount = 0;
  for (let i = 0; i < draws.length; i += 500) {
    const batch = draws.slice(i, i + 500);
    const { error } = await supabase
      .from(table)
      .upsert(batch, { onConflict: 'draw_date' });
    if (error) throw error;
    insertedCount += batch.length;
  }
  return insertedCount;
}

function extractRowsFromPayload(payload: any): OfficialDrawRow[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.draws)) return payload.draws;
  if (Array.isArray(payload?.records)) return payload.records;
  return [];
}

async function fetchOfficialRows(config: ReturnType<typeof getGameConfig>): Promise<OfficialFetchResult | null> {
  for (const url of config.officialApiUrls) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json,text/plain,*/*',
          'Accept-Encoding': 'gzip, deflate',
        },
      });
      if (!response.ok) continue;
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('json')) continue;
      const payload = await response.json();
      const rows = extractRowsFromPayload(payload);
      if (rows.length > 0) {
        return { sourceUrl: url, rows };
      }
    } catch {
      // try next official endpoint
    }
  }
  return null;
}

async function getSyncMeta(game: GameType): Promise<SyncMetaData> {
  const { data, error } = await supabase
    .from('stats_cache')
    .select('data')
    .eq('stat_type', 'official_sync')
    .eq('stat_range', game)
    .maybeSingle();
  if (error) return {};
  return (data?.data || {}) as SyncMetaData;
}

async function setSyncMeta(game: GameType, meta: SyncMetaData): Promise<void> {
  await supabase
    .from('stats_cache')
    .upsert(
      {
        stat_type: 'official_sync',
        stat_range: game,
        data: meta,
        computed_at: new Date().toISOString(),
      },
      { onConflict: 'stat_type,stat_range' }
    );
}

function shouldRunOfficialSync(lastSyncedAt?: string): boolean {
  if (!lastSyncedAt) return true;
  const last = new Date(lastSyncedAt).getTime();
  if (Number.isNaN(last)) return true;
  const cooldownMs = OFFICIAL_SYNC_COOLDOWN_HOURS * 60 * 60 * 1000;
  return Date.now() - last >= cooldownMs;
}

/**
 * Fetch draws and upsert into Supabase for a given game.
 */
export async function fetchAndSyncDraws(game: GameType = 'powerball'): Promise<number> {
  const config = getGameConfig(game);

  const { data: latestDraw } = await supabase
    .from(config.dbTable)
    .select('draw_date')
    .order('draw_date', { ascending: false })
    .limit(1)
    .single();

  const lastDate = latestDraw?.draw_date || '2010-01-01';

  // Re-sync a recent window so parser/schema fixes can repair previously stored rows.
  const repairStartDate = new Date(lastDate);
  repairStartDate.setDate(repairStartDate.getDate() - 120);
  const repairStart = repairStartDate.toISOString().slice(0, 10);

  const whereClause = `draw_date >= '${repairStart}'`;
  const url = `${config.apiUrl}?$where=${encodeURIComponent(whereClause)}&$order=draw_date DESC&$limit=5000`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const rows: NYOpenDataRow[] = await response.json();
  const draws = rows.map((row) => parseRow(row, game));
  const nyCount = await upsertDrawBatches(config.dbTable, draws);

  // Best-effort official latest sync (MUSL/operator endpoint) to keep newest draws fresh.
  let officialCount = 0;
  try {
    const syncMeta = await getSyncMeta(game);
    if (shouldRunOfficialSync(syncMeta.last_official_sync_at)) {
      const officialFetch = await fetchOfficialRows(config);
      const officialRows = officialFetch?.rows || [];
      const rejectedReasons: Record<string, number> = {};
      const officialDraws: Omit<Draw, 'id' | 'created_at'>[] = [];
      for (const row of officialRows) {
        const parsed = parseOfficialRow(row, game, config);
        if (parsed.draw) {
          officialDraws.push(parsed.draw);
        } else {
          const reason = parsed.reason || 'unknown';
          rejectedReasons[reason] = (rejectedReasons[reason] || 0) + 1;
        }
      }
      officialCount = await upsertDrawBatches(config.dbTable, officialDraws);
      await setSyncMeta(game, {
        last_official_sync_at: new Date().toISOString(),
        official_source_url: officialFetch?.sourceUrl || config.officialApiUrls[0],
        official_rows_synced: officialCount,
        official_rows_received: officialRows.length,
        official_rows_rejected: officialRows.length - officialDraws.length,
        official_reject_reasons: rejectedReasons,
      });
    }
  } catch {
    // Do not block base NY sync when official endpoint/meta persistence fails.
  }

  return nyCount + officialCount;
}

/**
 * Fetch all draws from Supabase for a given game
 */
export async function getAllDraws(game: GameType = 'powerball'): Promise<Draw[]> {
  const config = getGameConfig(game);
  const { data, error } = await supabase
    .from(config.dbTable)
    .select('*')
    .order('draw_date', { ascending: false });

  if (error) throw error;
  return (data || []).map((d: any) => normalizeDraw(d, game));
}

/**
 * Fetch recent N draws for a given game
 */
export async function getRecentDraws(count: number, game: GameType = 'powerball'): Promise<Draw[]> {
  const config = getGameConfig(game);
  const { data, error } = await supabase
    .from(config.dbTable)
    .select('*')
    .order('draw_date', { ascending: false })
    .limit(count);

  if (error) throw error;
  return (data || []).map((d: any) => normalizeDraw(d, game));
}

/**
 * Get the latest draw result for a given game
 */
export async function getLatestDraw(game: GameType = 'powerball'): Promise<Draw | null> {
  const config = getGameConfig(game);
  const { data, error } = await supabase
    .from(config.dbTable)
    .select('*')
    .order('draw_date', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data ? normalizeDraw(data, game) : null;
}

/**
 * Fetch draws directly from the API (without DB)
 */
export async function fetchDrawsFromAPI(limit = 500, game: GameType = 'powerball'): Promise<Draw[]> {
  const config = getGameConfig(game);
  const url = `${config.apiUrl}?$order=draw_date DESC&$limit=${limit}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`API error: ${response.status}`);

  const rows: NYOpenDataRow[] = await response.json();
  return rows.map((row) => ({
    ...parseRow(row, game),
    id: undefined,
    created_at: undefined,
  }));
}

// Parse a NY Open Data row — handles both Powerball and Mega Millions formats
function parseRow(row: NYOpenDataRow, game: GameType): Omit<Draw, 'id' | 'created_at'> {
  // Powerball often includes bonus in winning_numbers, Mega Millions may expose bonus as mega_ball.
  const parts = (row.winning_numbers.match(/\d+/g) || []).map(Number);
  const parsedMegaBall = toNumber(
    row.mega_ball ?? row.megaball ?? row.bonus_ball ?? row.megaBall,
    NaN
  );
  const bonusBall = parts[5] ?? (Number.isFinite(parsedMegaBall) ? parsedMegaBall : 0);

  return {
    game,
    draw_date: row.draw_date.split('T')[0],
    n1: parts[0],
    n2: parts[1],
    n3: parts[2],
    n4: parts[3],
    n5: parts[4],
    powerball: bonusBall,
    powerplay: row.multiplier ? parseInt(row.multiplier, 10) : row.megaplier ? parseInt(row.megaplier, 10) : null,
  };
}
