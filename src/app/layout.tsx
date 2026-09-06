import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toast";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "https://xerova-lab.vercel.app"
  ),
  title: {
    default: "XEROVA | AI-Powered Cybersecurity & Threat Intelligence",
    template: "%s | XEROVA",
  },
  description:
    "XEROVA is an AI-powered cybersecurity and threat intelligence platform for analyzing IPs, URLs, domains, hashes, CVEs, and other indicators of compromise.",
  applicationName: "XEROVA",
  keywords: [
    "XEROVA",
    "cybersecurity",
    "threat intelligence",
    "IOC analyzer",
    "SOC platform",
    "IP reputation",
    "URL scanner",
    "domain analysis",
    "CVE lookup",
    "file hash analysis",
    "browser security",
    "anti-quishing",
    "AI threat detection",
  ],
  authors: [{ name: "XEROVA Team" }],
  creator: "XEROVA",
  publisher: "XEROVA",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "XEROVA",
    title: "XEROVA | AI-Powered Cybersecurity & Threat Intelligence",
    description:
      "XEROVA is an AI-powered cybersecurity and threat intelligence platform for analyzing IPs, URLs, domains, hashes, CVEs, and other indicators of compromise.",
    images: [
      {
        url: "/xerova-icon.svg",
        width: 1200,
        height: 630,
        alt: "XEROVA | AI-Powered Cybersecurity & Threat Intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "XEROVA | AI-Powered Cybersecurity & Threat Intelligence",
    description:
      "XEROVA is an AI-powered cybersecurity and threat intelligence platform for analyzing IPs, URLs, domains, hashes, CVEs, and other indicators of compromise.",
    images: ["/xerova-icon.svg"],
    creator: "@xerova",
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
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/xerova-icon.svg",
  },
  verification: {
    google: "9FYatIUg8obVskXo95Z-fCQL9T4pULNZlltIlpIjN_8",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
        >
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
