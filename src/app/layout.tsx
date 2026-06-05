import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RayCards — AI Flashcard Generator",
  description:
    "Transform scientific textbook pages into smart, structured flashcards using the Gemini AI. Stop wasting hours on manual summarizing — focus on learning.",
  keywords: ["flashcards", "AI", "study", "Gemini", "textbook", "hackathon"],
  authors: [{ name: "RayCards Team" }],
  openGraph: {
    title: "RayCards — AI Flashcard Generator",
    description: "Transform scientific textbooks into AI-powered flashcards instantly.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#0a0a0f] text-white antialiased min-h-screen overflow-x-hidden">
        <header className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-shadow">
                <span className="text-sm font-bold">R</span>
              </div>
              <span className="font-semibold text-lg tracking-tight">
                Ray<span className="text-violet-400">Cards</span>
              </span>
            </a>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Powered by Gemini AI
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">{children}</main>
      </body>
    </html>
  );
}
