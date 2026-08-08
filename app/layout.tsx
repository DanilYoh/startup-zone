import type { Metadata } from "next";
import { Geist } from "next/font/google";
import {
  ColorSchemeScript,
  createTheme,
  MantineProvider,
  mantineHtmlProps,
} from "@mantine/core";
import "@mantine/core/styles.css";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: "Startup Zone — Build the right founding team",
    template: "%s · Startup Zone",
  },
  description:
    "A full-stack marketplace connecting startup founders, specialists, and early-stage investors.",
  keywords: ["startups", "founders", "investors", "Next.js", "Supabase"],
  authors: [{ name: "DanilYoh", url: "https://github.com/DanilYoh" }],
  openGraph: {
    title: "Startup Zone",
    description: "Find the right people to move a startup forward.",
    type: "website",
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin", "cyrillic"],
});

const theme = createTheme({
  primaryColor: "indigo",
  defaultRadius: "md",
  fontFamily: "var(--font-geist-sans), sans-serif",
  headings: {
    fontFamily: "var(--font-geist-sans), sans-serif",
  },
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body className={`${geistSans.variable} antialiased`}>
        <MantineProvider
          theme={theme}
          defaultColorScheme="auto"
          deduplicateInlineStyles
        >
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
