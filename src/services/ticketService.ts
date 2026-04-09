// ============================================
// Ticket & Saved Numbers Service
// Shared persistence for web and mobile
// ============================================
import { supabase } from '../config/supabase';
import { POINTS_PER_TICKET } from '../config/constants';
import { getCurrentUser, getProfile } from './authService';
import { GameType, PredictionSet, SavedNumberSet, TicketPurchase } from '../types';

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
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in is required to save numbers.' };

  const { error } = await supabase.from('saved_numbers').insert({
    user_id: user.id,
    game: prediction.game,
    name: `${prediction.game}-${prediction.mode}-${new Date().toLocaleDateString()}`,
    n1: prediction.whites[0],
    n2: prediction.whites[1],
    n3: prediction.whites[2],
    n4: prediction.whites[3],
    n5: prediction.whites[4],
    powerball: prediction.powerball,
  });

  return { error: error?.message || null };
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