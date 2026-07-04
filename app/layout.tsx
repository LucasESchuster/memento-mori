import type { Metadata } from "next";
import { Cormorant_Garamond, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import Clarity from "@/components/Clarity";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Memento Mori — Lembra-te de que és mortal",
  description:
    "Visualize sua vida em semanas. Uma meditação sobre o tempo que resta.",
  openGraph: {
    title: "Memento Mori",
    description:
      "Visualize sua vida em semanas. Uma meditação sobre o tempo que resta.",
    type: "website",
    locale: "pt_BR",
    siteName: "Memento Mori",
  },
  twitter: {
    card: "summary_large_image",
    title: "Memento Mori",
    description: "Visualize sua vida em semanas.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${cormorant.variable} ${plexMono.variable} ${plexSans.variable} h-full antialiased`}
    >
      <Clarity />
      <body className="min-h-full bg-[#efe9dd] text-[#1a1613] font-serif">
        {children}
      </body>
    </html>
  );
}
