import type { Metadata } from "next";
import { Geist, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
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
      className={`${geistSans.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white text-neutral-900">{children}</body>
    </html>
  );
}
