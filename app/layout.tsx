import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const siteUrl = "https://crostachips.com";
const title = "CROSTA — Real Parmigiano. Impossible Crunch.";
const description =
  "Premium Parmesan crisps crafted from authentic Parmigiano Reggiano. Naturally high in protein. No seed oils. No fillers.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  keywords: [
    "Parmesan crisps",
    "Parmigiano Reggiano",
    "high protein snack",
    "keto snack",
    "premium snacks",
    "CROSTA",
  ],
  authors: [{ name: "CROSTA" }],
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "CROSTA",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "CROSTA — Real Parmigiano. Impossible Crunch.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  themeColor: "#0D0D0D",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} dark`}>
      <body className="bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
