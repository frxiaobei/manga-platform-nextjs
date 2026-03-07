"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser, getUserDisplayName } from "@/lib/auth-client";
import { getAccessToken } from "@/lib/api-client";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const token = getAccessToken();
  const meQuery = useCurrentUser();
  const user = meQuery.data;
  const isLoggedIn = Boolean(token && user);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-20 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3 group" onClick={closeMobileMenu}>
          <div className="size-10 rounded-2xl bg-ansha flex items-center justify-center font-bold text-xl shadow-[0_0_20px_rgba(230,126,34,0.3)] group-hover:scale-110 transition-transform">
            M
          </div>
          <span className="text-xl md:text-2xl font-bold tracking-tighter">角色坊</span>
        </Link>
        <nav className="hidden md:flex items-center gap-10">
          <Link href="/" className="text-sm font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">首页</Link>
          <Link href="/characters" className="text-sm font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">角色图库</Link>
          {isLoggedIn ? (
            <Link href="/me" className="inline-flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-2 hover:border-white/20 transition-colors">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.email} className="size-8 rounded-xl object-cover" />
              ) : (
                <div className="size-8 rounded-xl bg-white/10 text-xs font-bold flex items-center justify-center">
                  {getUserDisplayName(user?.email ?? "", user?.name).slice(0, 1).toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium text-white/80">{getUserDisplayName(user?.email ?? "", user?.name)}</span>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="secondary" className="rounded-2xl px-8 h-12">登录账户</Button>
            </Link>
          )}
        </nav>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          className="inline-flex md:hidden size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition-colors hover:border-white/20 hover:bg-white/10"
          aria-label={isMobileMenuOpen ? "关闭导航菜单" : "打开导航菜单"}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-zinc-950/95 px-6 py-4">
          <nav className="flex flex-col gap-2">
            <Link
              href="/"
              onClick={closeMobileMenu}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold tracking-widest text-white/80 transition-colors hover:border-white/20 hover:text-white"
            >
              首页
            </Link>
            <Link
              href="/characters"
              onClick={closeMobileMenu}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold tracking-widest text-white/80 transition-colors hover:border-white/20 hover:text-white"
            >
              角色图库
            </Link>
            {isLoggedIn ? (
              <Link
                href="/me"
                onClick={closeMobileMenu}
                className="inline-flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 hover:border-white/20 transition-colors"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.email} className="size-8 rounded-xl object-cover" />
                ) : (
                  <div className="size-8 rounded-xl bg-white/10 text-xs font-bold flex items-center justify-center">
                    {getUserDisplayName(user?.email ?? "", user?.name).slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-white/80">{getUserDisplayName(user?.email ?? "", user?.name)}</span>
              </Link>
            ) : (
              <Link href="/login" onClick={closeMobileMenu}>
                <Button variant="secondary" className="w-full rounded-2xl h-12">登录账户</Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
