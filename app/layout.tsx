import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/demo-auth";
import { SavedProvider } from "@/lib/saved/local-saved";
import { FloatingAssistant, SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { Playfair_Display, Inter } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "OpenHands — Essential help should never be hard to find",
  description:
    "OpenHands bridges essential needs with people ready to help. Find support, offer help, and strengthen your community.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className={`font-sans min-h-screen bg-teal-50 text-teal-900 antialiased`}>
        <AuthProvider>
          <SavedProvider>
            <SiteHeader />
            <main id="main" className="mx-auto min-h-[70vh] max-w-6xl px-4 py-6">
              {children}
            </main>
            <SiteFooter />
            <FloatingAssistant />
          </SavedProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
