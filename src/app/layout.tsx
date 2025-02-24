import "../styles/globals.css";
import { Inter } from "next/font/google";

import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import ConnectWalletModal from "@/components/ConnectWalletModal";
import ClientProviders from "./ClientProviders";
import DisclaimerModal from "@/components/DisclaimerModal";
import DisclaimerWrapper from "@/components/DisclaimerWrapper";
import { Metadata, Viewport } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Optopus | Options for Crypto",
  description: "Invest in Tokens Risk-Free. Return it anytime. Get Money Back.",
  keywords:
    "crypto options, Ethereum options, DeFi, risk-free investing, Base, DeFi, decentralized finance",
  metadataBase: new URL("https://optopus.com"),
  openGraph: {
    title: "Optopus | Options for Crypto",
    description:
      "Invest in Tokens Risk-Free. Return it anytime. Get Money Back.",
    url: "https://optopus.com",
    siteName: "Optopus",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Optopus platform for crypto options",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@Optopus",
    title: "Optopus | Options for Crypto",
    description:
      "Invest in Tokens Risk-Free. Return it anytime. Get Money Back.",
    images: ["/og-image.png"],
  },
  robots: "index, follow",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  creator: "Optopus Team",
  applicationName: "Optopus",
  generator: "Next.js",
  publisher: "Optopus",
  category: "Finance, Decentralized Finance",
};

export const viewport: Viewport = {
  themeColor: "#6B46C1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="optopus">
      <body className={inter.className}>
        <ClientProviders>
          <DisclaimerWrapper>
            <Navbar />
            <main className="mb-16 sm:mb-0">{children}</main>
            <BottomNav />
            <ConnectWalletModal />
          </DisclaimerWrapper>
        </ClientProviders>
      </body>
    </html>
  );
}
