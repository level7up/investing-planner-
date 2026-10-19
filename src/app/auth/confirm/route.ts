import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const OTP_TYPES: readonly EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

const isOtpType = (value: string | null): value is EmailOtpType =>
  value !== null && (OTP_TYPES as readonly string[]).includes(value);

async function confirm(searchParams: URLSearchParams): Promise<boolean> {
  const supabase = await createClient();
  const code = searchParams.get("code");
  if (code) return !(await supabase.auth.exchangeCodeForSession(code)).error;

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  if (!tokenHash || !isOtpType(type)) return false;
  return !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
}

export async function GET(request: NextRequest) {
  const isConfirmed = await confirm(request.nextUrl.searchParams);
  const target = isConfirmed ? "/" : "/login?error=confirm";
  return NextResponse.redirect(new URL(target, request.url));
}
