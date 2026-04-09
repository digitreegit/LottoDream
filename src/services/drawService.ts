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

function toNumber(value: any, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = parseInt(value, 10);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
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
  if (rows.length === 0) return 0;

  const draws = rows.map((row) => parseRow(row, game));

  let insertedCount = 0;
  for (let i = 0; i < draws.length; i += 500) {
    const batch = draws.slice(i, i + 500);
    const { error } = await supabase
      .from(config.dbTable)
      .upsert(batch, { onConflict: 'draw_date' });
    if (error) throw error;
    insertedCount += batch.length;
  }

  return insertedCount;
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
