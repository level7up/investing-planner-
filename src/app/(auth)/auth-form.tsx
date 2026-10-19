"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register, type AuthState } from "./actions";

type AuthMode = "login" | "register";

interface AuthFormProps {
  mode: AuthMode;
  initialError?: string;
}

const COPY: Record<AuthMode, { title: string; subtitle: string; submit: string; pending: string; switchText: string; switchLink: string; switchHref: string }> = {
  login: {
    title: "تسجيل الدخول",
    subtitle: "ادخل لحسابك لمتابعة صفقاتك وخطط الخروج.",
    submit: "دخول",
    pending: "جارٍ الدخول…",
    switchText: "معندكش حساب؟",
    switchLink: "أنشئ حساب جديد",
    switchHref: "/register",
  },
  register: {
    title: "إنشاء حساب",
    subtitle: "سجّل حساب جديد واحفظ صفقاتك على السحابة من أي جهاز.",
    submit: "إنشاء الحساب",
    pending: "جارٍ الإنشاء…",
    switchText: "عندك حساب بالفعل؟",
    switchLink: "سجّل الدخول",
    switchHref: "/login",
  },
};

export function AuthForm({ mode, initialError }: AuthFormProps) {
  const action = mode === "login" ? login : register;
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(action, { error: initialError });
  const copy = COPY[mode];

  return (
    <main className="auth">
      <div className="auth-card">
        <p className="auth-brand">سجل صفقات المضاربة</p>
        <h1>{copy.title}</h1>
        <p className="auth-sub">{copy.subtitle}</p>

        {state.error && <p className="alert alert--error" role="alert">{state.error}</p>}
        {state.notice && <p className="alert alert--ok" role="status">{state.notice}</p>}

        <form action={formAction} className="auth-fields">
          <label className="f">
            البريد الإلكتروني
            <input name="email" type="email" required autoComplete="email" inputMode="email" dir="ltr" defaultValue={state.email} />
          </label>
          <label className="f">
            كلمة المرور
            <input name="password" type="password" required minLength={8} dir="ltr" autoComplete={mode === "login" ? "current-password" : "new-password"} />
          </label>
          {mode === "register" && (
            <label className="f">
              تأكيد كلمة المرور
              <input name="confirmPassword" type="password" required minLength={8} dir="ltr" autoComplete="new-password" />
            </label>
          )}
          <button className="btn btn-primary auth-submit" type="submit" disabled={isPending}>
            {isPending ? copy.pending : copy.submit}
          </button>
        </form>

        <p className="auth-switch">
          {copy.switchText} <Link href={copy.switchHref}>{copy.switchLink}</Link>
        </p>
      </div>
    </main>
  );
}
