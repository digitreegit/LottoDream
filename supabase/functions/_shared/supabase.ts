// Shared Supabase helpers for Edge Functions.
import { createClient, type User } from "https://esm.sh/@supabase/supabase-js@2.45.4";

/** Service-role client for trusted reads/writes (bypasses RLS). */
export const admin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

/** Resolve the calling user from the request's Supabase JWT. */
export async function getCaller(req: Request): Promise<User | null> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
  );
  const { data: { user }, error } = await supabase.auth.getUser();
  return error ? null : user;
}

/** Recompute profiles.subscription_* from every provider's subscription rows. */
export async function refreshEntitlement(userId: string): Promise<void> {
  const { error } = await admin.rpc("refresh_entitlement", { p_user_id: userId });
  if (error) throw new Error(`refresh_entitlement failed: ${error.message}`);
}
