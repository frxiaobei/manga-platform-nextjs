"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api, setAccessToken } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleRedirecting, setGoogleRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = isRegister
        ? await api.auth.register(email, password)
        : await api.auth.login(email, password);
      setAccessToken(response.token);
      router.push("/");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "detail" in err) {
        setError((err as { detail?: string }).detail ?? "登录失败，请稍后重试。");
      } else {
        setError("登录失败，请稍后重试。");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleRedirecting(true);
    setError(null);

    try {
      const response = await api.auth.googleUrl();
      window.location.assign(response.url);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "detail" in err) {
        setError((err as { detail?: string }).detail ?? "无法发起 Google 登录，请稍后重试。");
      } else {
        setError("无法发起 Google 登录，请稍后重试。");
      }
      setGoogleRedirecting(false);
    }
  };

  return (
    <div className="min-h-[80dvh] flex items-center justify-center px-4 py-8 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-zinc-900 border border-white/5 rounded-[2rem] sm:rounded-[2.5rem] md:rounded-[3rem] p-6 sm:p-8 md:p-12 shadow-2xl"
      >
        <div className="text-center mb-8 sm:mb-10">
          <div className="size-12 rounded-2xl bg-ansha flex items-center justify-center font-bold text-2xl mx-auto mb-6 shadow-[0_0_20px_rgba(230,126,34,0.3)]">
            M
          </div>
          <h1 className="text-3xl font-bold tracking-tighter mb-2">
            {isRegister ? "加入角色坊" : "欢迎回来"}
          </h1>
          <p className="text-white/40 text-sm">
            {isRegister ? "创建您的账户以开始探索" : "登录您的账户以继续您的旅程"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 mb-7 sm:mb-8">
          <div className="relative">
            <Input
              type="email"
              placeholder="您的电子邮箱"
              label="邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-12"
              required
            />
            <Mail className="absolute left-4 top-[46px] text-white/20" size={20} />
          </div>

          <div className="relative">
            <Input
              type="password"
              placeholder="您的登录密码"
              label="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-12"
              required
            />
            <Lock className="absolute left-4 top-[46px] text-white/20" size={20} />
          </div>

          {!isRegister && (
            <div className="flex justify-end">
              <button type="button" className="text-xs text-white/40 hover:text-ansha transition-colors">
                忘记密码？
              </button>
            </div>
          )}

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <Button type="submit" className="w-full h-14 min-h-11 rounded-2xl" disabled={submitting || googleRedirecting}>
            {submitting ? "提交中..." : isRegister ? "立即注册" : "登录账户"}
            <ArrowRight size={18} className="ml-2" />
          </Button>
        </form>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-widest">
            <span className="bg-zinc-900 px-4 text-white/20">或者通过</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full h-14 min-h-11 rounded-2xl mb-7 sm:mb-8 group"
          onClick={() => void handleGoogleLogin()}
          disabled={submitting || googleRedirecting}
        >
          <svg className="mr-2 size-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {googleRedirecting ? "跳转中..." : "使用 Google 登录"}
        </Button>

        <div className="text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-sm text-white/40 hover:text-white transition-colors"
          >
            {isRegister ? "已经有账户了？ 立即登录" : "还没有账户？ 立即创建"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
