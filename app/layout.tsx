import type { Metadata } from "next";
import { Cormorant_Garamond, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import Clarity from "@/components/Clarity";
import {
  SITE_AUTHOR,
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/site";
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
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_AUTHOR }],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: "/",
    type: "website",
    locale: SITE_LOCALE,
    siteName: SITE_NAME,
    // Image is provided by app/opengraph-image.tsx (auto-wired by Next).
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    // Image is provided by app/opengraph-image.tsx (auto-wired by Next).
  },
  // Cole aqui o token do Google Search Console para verificar o domínio:
  // verification: { google: "TOKEN_AQUI" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: "pt-BR",
      publisher: { "@id": `${SITE_URL}/#person` },
    },
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: SITE_AUTHOR,
      url: SITE_URL,
    },
  ],
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
      <body className="min-h-full bg-[#efe9dd] text-[#1a1613] font-serif">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Clarity />
        {children}
      </body>
    </html>
  );
}
