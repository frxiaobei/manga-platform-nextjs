"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api, setAccessToken } from "@/lib/api-client";
import { supabase } from "@/lib/supabase/client";

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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) {
        setError(error.message);
        setGoogleRedirecting(false);
      }
    } catch {
      setError("无法发起 Google 登录，请稍后重试。");
      setGoogleRedirecting(false);
    }
  };

  return (
    <div className="min-h-[85dvh] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-ansha/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl glass rounded-[3rem] p-10 sm:p-16 md:p-20 shadow-2xl relative z-10 border-white/5"
      >
        <div className="text-center mb-12">
          <motion.div 
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            className="size-16 rounded-2xl bg-ansha flex items-center justify-center font-black text-3xl mx-auto mb-8 shadow-[0_10px_40px_rgba(230,126,34,0.4)]"
          >
            M
          </motion.div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles size={16} className="text-ansha" />
            <span className="text-ansha text-xs font-black uppercase tracking-[0.3em]">{isRegister ? "Join Us" : "Welcome Back"}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
            {isRegister ? "加入角色坊" : "欢迎回来"}
          </h1>
          <p className="text-muted-foreground font-medium text-lg text-pretty">
            {isRegister ? "创建您的账户以开始探索" : "登录您的账户以继续您的旅程"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mb-10">
          <div className="relative group">
            <Input
              type="email"
              placeholder="您的电子邮箱"
              label="邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-16 pl-14 rounded-2xl bg-white/5 border-white/5 focus:border-ansha/50 transition-all duration-500 font-medium"
              required
            />
            <Mail className="absolute left-5 top-[48px] text-white/20 group-focus-within:text-ansha transition-colors" size={20} />
          </div>

          <div className="relative group">
            <Input
              type="password"
              placeholder="您的登录密码"
              label="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-16 pl-14 rounded-2xl bg-white/5 border-white/5 focus:border-ansha/50 transition-all duration-500 font-medium"
              required
            />
            <Lock className="absolute left-5 top-[48px] text-white/20 group-focus-within:text-ansha transition-colors" size={20} />
          </div>

          {!isRegister && (
            <div className="flex justify-end">
              <button type="button" className="text-xs font-bold uppercase tracking-widest text-white/20 hover:text-ansha transition-all">
                忘记密码？
              </button>
            </div>
          )}

          {error && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm text-red-400 font-bold bg-red-400/10 p-4 rounded-xl border border-red-400/20"
            >
              {error}
            </motion.p>
          )}

          <Button type="submit" className="w-full h-16 rounded-2xl text-lg font-black italic tracking-tight group" disabled={submitting || googleRedirecting}>
            {submitting ? "正在处理..." : isRegister ? "立即创建账户" : "登录账户"}
            <ArrowRight size={22} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </form>

        <div className="relative mb-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em]">
            <span className="bg-zinc-950 px-6 text-white/10">Or Continue With</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full h-16 rounded-2xl mb-10 group border-white/5 hover:border-white/20"
          onClick={() => void handleGoogleLogin()}
          disabled={submitting || googleRedirecting}
        >
          <svg className="mr-3 size-6" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span className="text-base font-bold">Sign in with Google</span>
        </Button>

        <div className="text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs font-black uppercase tracking-[0.2em] text-white/20 hover:text-ansha transition-all"
          >
            {isRegister ? "已经有账户了？ 立即登录" : "还没有账户？ 立即创建"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

