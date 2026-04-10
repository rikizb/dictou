import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { frFR } from "@clerk/localizations";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = "https://www.dictou.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dictou — La dictée intelligente pour les enfants",
    template: "%s | Dictou",
  },
  description:
    "Dictou aide les enfants du CP au CM2 à progresser en orthographe grâce à des phrases générées par l'IA, adaptées à leurs mots à apprendre. Gratuit, fun et efficace.",
  keywords: [
    "dictée enfant",
    "orthographe primaire",
    "apprendre dictée",
    "exercice dictée CP CE1 CE2 CM1 CM2",
    "révision orthographe",
    "application dictée scolaire",
    "dictée intelligente IA",
    "Dictou",
  ],
  authors: [{ name: "Dictou" }],
  creator: "Dictou",
  publisher: "Dictou",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteUrl,
    siteName: "Dictou",
    title: "Dictou — La dictée intelligente pour les enfants",
    description:
      "Des phrases générées par l'IA pour apprendre l'orthographe en s'amusant. Pour les enfants du CP au CM2.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Dictou — La dictée intelligente pour les enfants",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dictou — La dictée intelligente pour les enfants",
    description:
      "Des phrases générées par l'IA pour apprendre l'orthographe en s'amusant.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>✏️</text></svg>",
      },
    ],
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={frFR}>
      <html lang="fr">
        <body className={inter.className}>
          {children}
          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: "12px",
                background: "#1e1e2e",
                color: "#fff",
                fontSize: "14px",
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
