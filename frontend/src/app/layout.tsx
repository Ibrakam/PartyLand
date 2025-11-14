import type { Metadata } from "next";
import "./globals.css";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { CartProvider } from "@/contexts/CartContext";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/contexts/LanguageContext";
import StructuredDataScript from "@/components/StructuredDataScript";

export const metadata: Metadata = {
  title: "PartyLand - Every Party Magic",
  description: "Everything you need for unforgettable children's parties",
  keywords: ["party supplies", "children's parties", "party decorations", "birthday party", "party store"],
  authors: [{ name: "PartyLand" }],
  creator: "PartyLand",
  publisher: "PartyLand",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "PartyLand - Every Party Magic",
    description: "Everything you need for unforgettable children's parties",
    siteName: "PartyLand",
  },
  twitter: {
    card: "summary_large_image",
    title: "PartyLand - Every Party Magic",
    description: "Everything you need for unforgettable children's parties",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <StructuredDataScript />
        <ErrorReporter />
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="false"
          data-custom-data='{"appName": "PartyLand", "version": "1.0.0"}'
        />
        <LanguageProvider>
          <CartProvider>
            {children}
            <Toaster />
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
