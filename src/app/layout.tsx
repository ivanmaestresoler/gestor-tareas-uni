import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { NavLinks } from "@/components/NavLinks";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tareas Uni",
  description: "Gestor de tareas, entregas y exámenes de la universidad",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-zinc-50/85 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/85">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="grid size-7 place-items-center rounded-lg bg-indigo-600 text-sm text-white">
                ✓
              </span>
              <span>Tareas Uni</span>
            </Link>
            <NavLinks />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-28 sm:pb-12">{children}</main>
      </body>
    </html>
  );
}
