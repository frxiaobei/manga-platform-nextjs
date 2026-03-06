import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-zinc-950 py-20">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="flex flex-col md:flex-row justify-between gap-20">
          <div className="max-w-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-8 rounded-xl bg-ansha flex items-center justify-center font-bold text-lg">
                M
              </div>
              <span className="text-xl font-bold tracking-tighter">角色坊</span>
            </div>
            <p className="text-white/40 leading-relaxed">
              漫剧角色图库商业化平台，提供高品质原创角色展示与交易服务。每一份创作都值得被尊重，每一个角色都拥有灵魂。
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20 mb-6">探索平台</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li><Link href="/characters" className="text-white/40 hover:text-ansha transition-colors">所有角色</Link></li>
                <li><Link href="/me" className="text-white/40 hover:text-ansha transition-colors">个人中心</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20 mb-6">法律政策</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li><span className="text-white/40">用户协议</span></li>
                <li><span className="text-white/40">隐私政策</span></li>
                <li><span className="text-white/40">版权申明</span></li>
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20 mb-6">联系我们</h4>
              <p className="text-sm text-white/40 leading-relaxed mb-4">有任何疑问或合作意向，欢迎随时联系。</p>
              <span className="text-white font-bold hover:text-ansha transition-colors underline underline-offset-8 decoration-white/10">support@manga.com</span>
            </div>
          </div>
        </div>
        <div className="mt-20 pt-10 border-t border-white/5 text-[10px] uppercase tracking-[0.25em] text-white/20 text-center font-bold">
          &copy; 2026 角色坊 &middot; ORIGINAL CHARACTER DESIGN MARKETPLACE
        </div>
      </div>
    </footer>
  );
}
