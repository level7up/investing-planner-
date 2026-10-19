import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient, getCurrentUser, type CurrentUser } from "@/lib/supabase/server";

export type PageSession = { supabase: SupabaseClient; user: CurrentUser };

export async function requirePageSession(): Promise<PageSession> {
  await connection();
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) redirect("/login");
  return { supabase, user };
}
