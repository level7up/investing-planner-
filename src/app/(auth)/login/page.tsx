import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "تسجيل الدخول · سجل الصفقات" };

const CONFIRM_ERROR = "رابط التفعيل غير صالح أو انتهت صلاحيته. سجّل الدخول أو أنشئ الحساب مرة أخرى.";

async function LoginWithParams({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  return <AuthForm mode="login" initialError={error === "confirm" ? CONFIRM_ERROR : undefined} />;
}

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <Suspense fallback={<AuthForm mode="login" />}>
      <LoginWithParams {...props} />
    </Suspense>
  );
}
