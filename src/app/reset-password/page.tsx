"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type VerifyState = "loading" | "ready" | "error";

type ResetPasswordResponse = {
  detail?: string;
};

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const hasVerifiedRef = useRef(false);
  const supabase = getSupabaseBrowserClient();

  const [verifyState, setVerifyState] = useState<VerifyState>("loading");
  const [verifyMessage, setVerifyMessage] = useState("正在验证重置链接...");
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (hasVerifiedRef.current) return;
    hasVerifiedRef.current = true;

    async function verifyRecoveryLink() {
      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      const urlAccessToken = searchParams.get("access_token");
      const urlRefreshToken = searchParams.get("refresh_token");

      let verifyError: string | null = null;

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) verifyError = error.message;
      } else if (tokenHash && type === "recovery") {
        const { error } = await supabase.auth.verifyOtp({
          type: "recovery",
          token_hash: tokenHash,
        });
        if (error) verifyError = error.message;
      } else if (urlAccessToken && urlRefreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: urlAccessToken,
          refresh_token: urlRefreshToken,
        });
        if (error) verifyError = error.message;
      } else {
        verifyError = "链接无效或已过期，请重新申请密码重置邮件。";
      }

      if (verifyError) {
        setVerifyState("error");
        setVerifyMessage(verifyError);
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session?.access_token) {
        setVerifyState("error");
        setVerifyMessage(error?.message ?? "会话验证失败，请重新发起重置流程。");
        return;
      }

      setAccessToken(data.session.access_token);
      setVerifyState("ready");
      setVerifyMessage("邮箱验证成功，请设置新密码。");
    }

    void verifyRecoveryLink();
  }, [searchParams]);

  async function handleUpdatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUpdateError(null);
    setUpdateSuccess(null);

    if (!accessToken) {
      setUpdateError("认证状态失效，请刷新页面后重试。");
      return;
    }

    if (password.length < 8) {
      setUpdateError("密码长度不能少于 8 位。");
      return;
    }

    if (password !== confirmPassword) {
      setUpdateError("两次输入的密码不一致。");
      return;
    }

    setUpdating(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ password }),
      });

      const payload = (await response.json().catch(() => ({}))) as ResetPasswordResponse;

      if (!response.ok) {
        setUpdateError(payload.detail ?? "密码更新失败，请稍后重试。");
        return;
      }

      await supabase.auth.signOut();
      setUpdateSuccess("密码已更新，请使用新密码重新登录。");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setUpdateError("请求失败，请稍后重试。");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">重置密码</h1>
      <p className="mt-2 text-sm text-muted-foreground">{verifyMessage}</p>

      {verifyState === "loading" ? <p className="mt-6 text-sm">正在处理，请稍候...</p> : null}
      {verifyState === "error" ? (
        <p className="mt-6 text-sm">
          <Link href="/forgot-password" className="underline underline-offset-4">
            返回忘记密码页面重新发起
          </Link>
        </p>
      ) : null}

      {verifyState === "ready" ? (
        <form className="mt-8 flex flex-col gap-4" onSubmit={handleUpdatePassword}>
          <label className="flex flex-col gap-2 text-sm font-medium">
            新密码
            <input
              className="h-10 rounded-md border bg-background px-3 text-sm"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="至少 8 位"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium">
            确认新密码
            <input
              className="h-10 rounded-md border bg-background px-3 text-sm"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="再次输入新密码"
              required
            />
          </label>

          <Button type="submit" disabled={updating}>
            {updating ? "更新中..." : "更新密码"}
          </Button>

          {updateError ? <p className="text-sm text-red-600">{updateError}</p> : null}
          {updateSuccess ? (
            <p className="text-sm text-emerald-700">
              {updateSuccess} <Link href="/login" className="underline underline-offset-4">去登录</Link>
            </p>
          ) : null}
        </form>
      ) : null}
    </main>
  );
}
