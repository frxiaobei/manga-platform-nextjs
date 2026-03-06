import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "角色坊 - 原创角色设计平台",
  description: "汇集顶尖原画师的精品角色，从清冷仙子到霸道魔尊，每一个角色都拥有独特的灵魂与背景设定。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-dvh overflow-x-hidden bg-zinc-950 text-white selection:bg-ansha selection:text-white antialiased">
        <Providers>
          <Header />
          <main className="pt-20 pb-20">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
