"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { logout } from "@/app/(auth)/actions";

const TABS = [
  { href: "/", label: "الصفقات" },
  { href: "/gold", label: "الذهب" },
  { href: "/wallet", label: "المحفظة" },
] as const;

interface AppHeaderProps {
  email: string;
  actions?: ReactNode;
}

export function AppHeader({ email, actions }: AppHeaderProps) {
  const pathname = usePathname();
  return (
    <>
      <div className="account">
        <span dir="ltr">{email}</span>
        <div className="account-actions">
          {actions}
          <form action={logout}>
            <button className="btn btn-secondary btn-sm" type="submit">تسجيل الخروج</button>
          </form>
        </div>
      </div>
      <nav className="tabs" aria-label="الأقسام">
        {TABS.map((tab) => (
          <Link key={tab.href} href={tab.href} className="tab" aria-current={pathname === tab.href ? "page" : undefined}>
            {tab.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
