"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, User } from "lucide-react";
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
    <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 h-16 w-[calc(100%-3rem)] max-w-[1400px] glass rounded-2xl flex items-center px-6 md:px-8">
      <div className="flex w-full items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group" onClick={closeMobileMenu}>
          <div className="size-10 rounded-xl bg-ansha flex items-center justify-center font-black text-xl shadow-[0_0_30px_rgba(230,126,34,0.4)] group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
            M
          </div>
          <span className="text-xl font-black tracking-tighter hidden sm:block">角色坊</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-12">
          <Link href="/" className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-ansha transition-all duration-300">首页</Link>
          <Link href="/characters" className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-ansha transition-all duration-300">角色图库</Link>
          
          {isLoggedIn ? (
            <Link href="/me" className="group flex items-center gap-3 pl-6 border-l border-white/10 ml-4">
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-ansha transition-colors">Personal</p>
                <p className="text-xs font-bold text-white/90">{getUserDisplayName(user?.email ?? "")}</p>
              </div>
              {user?.avatar ? (
                <img src={user.avatar} alt={user.email} className="size-10 rounded-xl object-cover border border-white/10 group-hover:border-ansha transition-colors" />
              ) : (
                <div className="size-10 rounded-xl bg-white/5 border border-white/10 text-xs font-bold flex items-center justify-center group-hover:border-ansha transition-colors">
                  <User size={18} className="text-muted-foreground" />
                </div>
              )}
            </Link>
          ) : (
            <Link href="/login" className="ml-4">
              <Button size="sm" className="rounded-xl px-6 h-10 font-bold tracking-tight">登录账户</Button>
            </Link>
          )}
        </nav>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          className="inline-flex md:hidden size-10 items-center justify-center rounded-xl glass text-white transition-all hover:scale-105 active:scale-95"
          aria-label={isMobileMenuOpen ? "关闭导航菜单" : "打开导航菜单"}
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="absolute top-20 left-0 right-0 glass rounded-2xl p-6 md:hidden">
          <nav className="flex flex-col gap-3">
            <Link
              href="/"
              onClick={closeMobileMenu}
              className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <span className="text-sm font-black uppercase tracking-[0.2em]">首页</span>
              <div className="size-2 rounded-full bg-ansha opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              href="/characters"
              onClick={closeMobileMenu}
              className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <span className="text-sm font-black uppercase tracking-[0.2em]">角色图库</span>
              <div className="size-2 rounded-full bg-ansha opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            {isLoggedIn ? (
              <Link
                href="/me"
                onClick={closeMobileMenu}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.email} className="size-10 rounded-xl object-cover" />
                ) : (
                  <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <User size={20} />
                  </div>
                )}
                <span className="text-sm font-bold">{getUserDisplayName(user?.email ?? "")}</span>
              </Link>
            ) : (
              <Link href="/login" onClick={closeMobileMenu} className="mt-2">
                <Button className="w-full rounded-xl h-12 text-base font-bold">登录账户</Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
