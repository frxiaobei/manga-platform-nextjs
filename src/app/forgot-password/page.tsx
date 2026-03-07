"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";

type ForgotPasswordResponse = {
  message?: string;
  detail?: string;
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const payload = (await response.json().catch(() => ({}))) as ForgotPasswordResponse;
      if (!response.ok) {
        setError(payload.detail ?? "发送失败，请稍后重试");
        return;
      }

      setMessage(payload.message ?? "如果邮箱存在，我们已发送重置链接。");
    } catch {
      setError("请求失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">忘记密码</h1>
      <p className="mt-2 text-sm text-muted-foreground">输入注册邮箱，我们会发送密码重置链接进行邮箱验证。</p>

      <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm font-medium">
          注册邮箱
          <input
            className="h-10 rounded-md border bg-background px-3 text-sm"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>

        <Button type="submit" disabled={loading}>
          {loading ? "发送中..." : "发送重置链接"}
        </Button>
      </form>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}

      <p className="mt-6 text-sm">
        <Link href="/login" className="underline underline-offset-4">
          返回登录
        </Link>
      </p>
    </main>
  );
}
