import type { Metadata } from "next";
import "./globals.css";
import { SavedProvider } from "@/lib/saved/local-saved";
import { SiteHeader } from "@/components/layout/SiteChrome";
import { PageMain } from "@/components/layout/PageMain";
import { ChatWidget } from "@/components/chat/ChatWidget";
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
  title: "OpenHands | Essential help should never be hard to find",
  description:
    "OpenHands bridges essential needs with people ready to help. Find support, offer help, and strengthen your community.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-sans min-h-screen overflow-x-hidden bg-teal-50 text-teal-900 antialiased">
        <SavedProvider>
          <SiteHeader />
          <PageMain>{children}</PageMain>
          <ChatWidget />
        </SavedProvider>
      </body>
    </html>
  );
}
