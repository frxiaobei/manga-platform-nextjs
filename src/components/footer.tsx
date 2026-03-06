import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-zinc-950 pt-32 pb-12 relative overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="mx-auto max-w-[1440px] px-8">
        <div className="flex flex-col lg:flex-row justify-between gap-24 mb-32">
          <div className="max-w-md">
            <div className="flex items-center gap-4 mb-8 group">
              <div className="size-10 rounded-xl bg-ansha flex items-center justify-center font-black text-xl shadow-[0_0_30px_rgba(230,126,34,0.3)]">
                M
              </div>
              <span className="text-2xl font-black tracking-tighter">角色坊</span>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed font-medium mb-10">
              漫剧角色图库商业化平台，提供高品质原创角色展示与交易服务。每一份创作都值得被尊重，每一个角色都拥有灵魂。
            </p>
            <div className="flex items-center gap-2 text-ansha/60 text-xs font-bold uppercase tracking-[0.3em]">
              <Sparkles size={14} />
              Crafted for creators
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-16">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-10">探索平台</h4>
              <ul className="space-y-6 text-sm font-bold">
                <li><Link href="/characters" className="text-muted-foreground hover:text-ansha transition-all hover:translate-x-1 inline-block">所有角色</Link></li>
                <li><Link href="/me" className="text-muted-foreground hover:text-ansha transition-all hover:translate-x-1 inline-block">个人中心</Link></li>
                <li><Link href="/promo/review" className="text-muted-foreground hover:text-ansha transition-all hover:translate-x-1 inline-block">评价换折扣</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-10">法律政策</h4>
              <ul className="space-y-6 text-sm font-bold">
                <li><span className="text-muted-foreground hover:text-white transition-colors cursor-pointer">用户协议</span></li>
                <li><span className="text-muted-foreground hover:text-white transition-colors cursor-pointer">隐私政策</span></li>
                <li><span className="text-muted-foreground hover:text-white transition-colors cursor-pointer">版权申明</span></li>
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-10">联系我们</h4>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 font-medium">有任何疑问或合作意向，欢迎随时联系。</p>
              <a href="mailto:support@manga.com" className="text-white font-black hover:text-ansha transition-colors underline underline-offset-[12px] decoration-white/10 hover:decoration-ansha/30 text-base">
                support@manga.com
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-12 border-t border-white/5 gap-8">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
            &copy; 2026 角色坊 &middot; PREMIUM CHARACTER DESIGN MARKETPLACE
          </div>
          <div className="flex items-center gap-8">
            <div className="size-2 rounded-full bg-ansha/20" />
            <div className="size-2 rounded-full bg-ansha/40" />
            <div className="size-2 rounded-full bg-ansha/60" />
          </div>
        </div>
      </div>
    </footer>
  );
}

