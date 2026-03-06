import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Manga Platform",
  description: "Manga character platform migrated to Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
