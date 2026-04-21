import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Essentia App",
  description: "Audio analysis powered by Essentia",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <header className="border-b border-[#282828] bg-[#181818] px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-bold text-base tracking-tight text-white">
            You Music
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/" className="text-[#b3b3b3] hover:text-white transition-colors">ホーム</Link>
            <Link href="/history" className="text-[#b3b3b3] hover:text-white transition-colors">履歴</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
