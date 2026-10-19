"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const MIN_PASSWORD_LENGTH = 8;

export type AuthState = { error?: string; notice?: string; email?: string };

const credentialsSchema = z.object({
  email: z.email("أدخل بريد إلكتروني صحيح").trim().toLowerCase(),
  password: z.string().min(MIN_PASSWORD_LENGTH, `كلمة المرور لازم تكون ${MIN_PASSWORD_LENGTH} حروف على الأقل`),
});

const registerSchema = credentialsSchema
  .extend({ confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, { message: "كلمتا المرور غير متطابقتين" });

const field = (formData: FormData, name: string): string => {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
};

async function siteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  const headerList = await headers();
  const origin = headerList.get("origin");
  if (origin) return origin;
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const protocol = headerList.get("x-forwarded-proto") ?? "https";
  return `${protocol}://${host}`;
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = field(formData, "email");
  const parsed = credentialsSchema.safeParse({ email, password: field(formData, "password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message, email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const message =
      error.code === "email_not_confirmed"
        ? "لازم تأكد بريدك الإلكتروني الأول. راجع صندوق الوارد."
        : "البريد الإلكتروني أو كلمة المرور غير صحيحة";
    return { error: message, email };
  }
  redirect("/");
}

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = field(formData, "email");
  const parsed = registerSchema.safeParse({
    email,
    password: field(formData, "password"),
    confirmPassword: field(formData, "confirmPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message, email };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/confirm` },
  });
  if (error) {
    console.error("Sign up failed", { code: error.code, status: error.status });
    const message = error.code === "user_already_exists" ? "البريد ده مسجل بالفعل. سجّل دخول بدلًا من ذلك." : "تعذّر إنشاء الحساب، حاول مرة أخرى.";
    return { error: message, email };
  }
  if (data.session) redirect("/");
  return { notice: "تم إنشاء الحساب. افتح الرابط اللي وصلك على البريد لتفعيل الحساب ثم سجّل الدخول.", email };
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
