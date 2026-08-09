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
import styles from "./layout.module.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: "Startup Zone — Founder–investor marketplace",
    template: "%s · Startup Zone",
  },
  description:
    "A focused marketplace where founders publish startups and aligned investors request a conversation.",
  keywords: ["startups", "founders", "investors", "Next.js", "Supabase"],
  authors: [{ name: "DanilYoh", url: "https://github.com/DanilYoh" }],
  openGraph: {
    title: "Startup Zone",
    description: "Where ambitious founders meet aligned capital.",
    type: "website",
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin", "cyrillic"],
});

const theme = createTheme({
  primaryColor: "blue",
  primaryShade: { light: 7, dark: 5 },
  defaultRadius: "lg",
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
      <body className={`${geistSans.variable} ${styles.body}`}>
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
