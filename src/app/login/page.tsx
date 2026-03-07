"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";

type LoginResponse = {
  token?: string;
  detail?: string;
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenHint, setTokenHint] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setTokenHint(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json().catch(() => ({}))) as LoginResponse;

      if (!response.ok || !payload.token) {
        setError(payload.detail ?? "登录失败，请检查邮箱和密码");
        return;
      }

      setTokenHint(`${payload.token.slice(0, 16)}...`);
    } catch {
      setError("登录请求失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">登录</h1>
      <p className="mt-2 text-sm text-muted-foreground">使用邮箱密码登录。忘记密码可通过邮件重置。</p>

      <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm font-medium">
          邮箱
          <input
            className="h-10 rounded-md border bg-background px-3 text-sm"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          密码
          <input
            className="h-10 rounded-md border bg-background px-3 text-sm"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="至少 8 位"
            required
          />
        </label>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">忘记密码？</span>
          <Link href="/forgot-password" className="font-medium underline underline-offset-4">
            去重置
          </Link>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "登录中..." : "登录"}
        </Button>
      </form>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {tokenHint ? <p className="mt-4 text-sm text-emerald-700">登录成功，Token: {tokenHint}</p> : null}
    </main>
  );
}
