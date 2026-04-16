// ============================================
// Ticket & Saved Numbers Service
// Shared persistence for web and mobile
// ============================================
import { supabase } from '../config/supabase';
import { POINTS_PER_TICKET, getGameConfig } from '../config/constants';
import { getCurrentUser, getProfile } from './authService';
import {
  GameType,
  NumberCollectionItem,
  PredictionSet,
  SavedNumberSet,
  TicketPurchase,
} from '../types';
import type { PostgrestError } from '@supabase/supabase-js';

function formatPostgrestError(error: PostgrestError | null): string {
  if (!error) return 'Unknown database error.';
  const raw = [error.message, error.details, error.hint].filter(Boolean).join(' — ');
  if (/could not find the table.*saved_numbers|saved_numbers.*schema cache/i.test(raw)) {
    return (
      '데이터베이스에 saved_numbers 테이블이 없습니다. Supabase 대시보드 → SQL Editor에서 ' +
      '프로젝트 루트의 supabase/migrations/20260416120000_create_saved_numbers.sql 내용을 실행한 뒤 다시 시도해주세요.'
    );
  }
  if (/could not find the table.*number_collection|number_collection.*schema cache/i.test(raw)) {
    return (
      '데이터베이스에 number_collection_items 테이블이 없습니다. Supabase SQL Editor에서 ' +
      'supabase/migrations/20260416140000_create_number_collection_items.sql 을 실행해주세요.'
    );
  }
  return raw || 'Database error.';
}

function mapWhites(row: any): number[] {
  return [row.n1, row.n2, row.n3, row.n4, row.n5].map((value) => Number(value));
}

function nextDrawDate(game: GameType): string {
  const now = new Date();
  const schedule = game === 'powerball' ? [1, 3, 6] : [2, 5];
  const current = new Date(now);
  current.setHours(0, 0, 0, 0);

  for (let offset = 0; offset < 8; offset++) {
    const candidate = new Date(current);
    candidate.setDate(current.getDate() + offset);
    if (schedule.includes(candidate.getDay())) {
      if (offset > 0 || now.getHours() < 22) {
        return candidate.toISOString().slice(0, 10);
      }
    }
  }

  return current.toISOString().slice(0, 10);
}

export async function savePredictionSet(prediction: PredictionSet): Promise<{ error: string | null }> {
  const {
    data: { session },
    error: sessionErr,
  } = await supabase.auth.getSession();

  const user = session?.user;
  if (!user) {
    return {
      error:
        sessionErr?.message ||
        'Sign in is required to save numbers. Try signing out and back in if this persists.',
    };
  }

  const w = prediction.whites;
  if (!Array.isArray(w) || w.length !== 5 || w.some((n) => typeof n !== 'number' || !Number.isFinite(n))) {
    return { error: 'Invalid number set (expected 5 main numbers).' };
  }
  const pb = prediction.powerball;
  if (typeof pb !== 'number' || !Number.isFinite(pb)) {
    return { error: 'Invalid bonus ball.' };
  }

  const { data, error } = await supabase
    .from('saved_numbers')
    .insert({
      user_id: user.id,
      game: prediction.game,
      name: `${prediction.game}-${prediction.mode}-${new Date().toISOString().slice(0, 10)}`,
      n1: w[0],
      n2: w[1],
      n3: w[2],
      n4: w[3],
      n5: w[4],
      powerball: pb,
    })
    .select('id')
    .maybeSingle();

  if (error) {
    return { error: formatPostgrestError(error) };
  }
  if (!data?.id) {
    return {
      error:
        'Save did not complete. If you recently signed up, ensure your profile exists (try signing out and in).',
    };
  }

  return { error: null };
}

export async function purchasePredictionSet(prediction: PredictionSet): Promise<{ error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in is required to purchase tickets.' };

  const profile = await getProfile();
  if (!profile) return { error: 'Profile not found.' };
  if ((profile.points || 0) < POINTS_PER_TICKET) {
    return { error: `Not enough points. You need ${POINTS_PER_TICKET} points.` };
  }

  const updatedPoints = (profile.points || 0) - POINTS_PER_TICKET;
  const drawDate = nextDrawDate(prediction.game);

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ points: updatedPoints })
    .eq('id', user.id);

  if (profileError) return { error: profileError.message };

  const { error: transactionError } = await supabase.from('point_transactions').insert({
    user_id: user.id,
    amount: -POINTS_PER_TICKET,
    type: 'ticket',
    description: `Ticket purchase for ${prediction.game} ${drawDate}`,
  });

  if (transactionError) return { error: transactionError.message };

  const { error: ticketError } = await supabase.from('tickets').insert({
    user_id: user.id,
    game: prediction.game,
    n1: prediction.whites[0],
    n2: prediction.whites[1],
    n3: prediction.whites[2],
    n4: prediction.whites[3],
    n5: prediction.whites[4],
    powerball: prediction.powerball,
    draw_date: drawDate,
    points_spent: POINTS_PER_TICKET,
    status: 'purchased',
  });

  return { error: ticketError?.message || null };
}

export async function addDemoPoints(amount = 30): Promise<{ error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in is required.' };

  const profile = await getProfile();
  if (!profile) return { error: 'Profile not found.' };

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ points: (profile.points || 0) + amount })
    .eq('id', user.id);

  if (profileError) return { error: profileError.message };

  const { error } = await supabase.from('point_transactions').insert({
    user_id: user.id,
    amount,
    type: 'purchase',
    description: `Demo point charge: +${amount}`,
  });

  return { error: error?.message || null };
}

export async function getSavedNumberSets(limit = 20): Promise<SavedNumberSet[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('saved_numbers')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data || []).map((row: any) => ({
    id: String(row.id),
    user_id: row.user_id,
    game: row.game,
    name: row.name,
    whites: mapWhites(row),
    powerball: Number(row.powerball),
    created_at: row.created_at,
  }));
}

export type NumberCollectionSource = 'manual' | 'analysis_tracking' | 'history_watch';

export async function getNumberCollectionItems(limit = 50): Promise<NumberCollectionItem[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('number_collection_items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data || []).map((row: any) => ({
    id: String(row.id),
    user_id: row.user_id,
    game: row.game as GameType,
    name: row.name,
    source: String(row.source || 'manual'),
    whites: mapWhites(row),
    powerball: Number(row.powerball),
    created_at: row.created_at,
  }));
}

export async function addNumberCollectionItem(input: {
  game: GameType;
  name?: string;
  source: NumberCollectionSource;
  whites: number[];
  powerball: number;
}): Promise<{ error: string | null }> {
  const {
    data: { session },
    error: sessionErr,
  } = await supabase.auth.getSession();

  const user = session?.user;
  if (!user) {
    return {
      error:
        sessionErr?.message ||
        'Sign in is required. Try signing out and back in if this persists.',
    };
  }

  const cfg = getGameConfig(input.game);
  const w = input.whites;
  if (!Array.isArray(w) || w.length !== 5 || w.some((n) => typeof n !== 'number' || !Number.isFinite(n))) {
    return { error: 'Enter exactly 5 main numbers.' };
  }
  const sorted = [...w].sort((a, b) => a - b);
  if (new Set(sorted).size !== 5) {
    return { error: 'Main numbers must be unique.' };
  }
  for (const n of sorted) {
    if (n < 1 || n > cfg.whiteMax) {
      return { error: `Each main number must be between 1 and ${cfg.whiteMax}.` };
    }
  }
  const pb = input.powerball;
  if (typeof pb !== 'number' || !Number.isFinite(pb) || pb < 1 || pb > cfg.bonusMax) {
    return { error: `${cfg.bonusLabel} must be between 1 and ${cfg.bonusMax}.` };
  }

  const row: Record<string, unknown> = {
    user_id: user.id,
    game: input.game,
    source: input.source,
    n1: sorted[0],
    n2: sorted[1],
    n3: sorted[2],
    n4: sorted[3],
    n5: sorted[4],
    powerball: pb,
  };
  const trimmedName = input.name?.trim();
  if (trimmedName) row.name = trimmedName;

  // Avoid .select() after insert: some projects return no row (RLS/PostgREST) even when insert succeeds.
  const { error } = await supabase.from('number_collection_items').insert(row as any);

  if (error) {
    return { error: formatPostgrestError(error) };
  }
  return { error: null };
}

export async function deleteNumberCollectionItem(id: string): Promise<{ error: string | null }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return { error: 'Sign in is required.' };

  const { error } = await supabase
    .from('number_collection_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  return { error: error ? formatPostgrestError(error) : null };
}

export async function getTicketPurchases(limit = 20): Promise<TicketPurchase[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data || []).map((row: any) => ({
    id: String(row.id),
    user_id: row.user_id,
    game: row.game,
    whites: mapWhites(row),
    powerball: Number(row.powerball),
    draw_date: row.draw_date,
    points_spent: Number(row.points_spent),
    status: row.status,
    prize_amount: row.prize_amount == null ? undefined : Number(row.prize_amount),
    created_at: row.created_at,
  }));
}