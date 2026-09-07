import type { Metadata, Viewport } from "next";
import "./globals.css";
import { poppins } from "./fonts";
import { ThemeProvider } from "@/components/theme-provider";
import { LocaleProvider } from "@/lib/i18n/locale-provider";

export const metadata: Metadata = {
  title: "OpenQR — Free QR Code Generator",
  description:
    "Free, open-source, watermark-free QR code generator. Runs entirely in your browser — no tracking, no sign-up, no limits. Export PNG, SVG, and PDF at any size.",
  applicationName: "OpenQR",
  authors: [{ name: "Sam Moreton" }],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#10171F" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={poppins.variable}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <LocaleProvider>{children}</LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
