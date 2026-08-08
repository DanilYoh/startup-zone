import type { Config } from "tailwindcss";

export default {
  darkMode: ["selector", '[data-mantine-color-scheme="dark"]'],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--mantine-color-body)",
        foreground: "var(--mantine-color-text)",
        card: {
          DEFAULT: "var(--mantine-color-default)",
          foreground: "var(--mantine-color-text)",
        },
        popover: {
          DEFAULT: "var(--mantine-color-default)",
          foreground: "var(--mantine-color-text)",
        },
        primary: {
          DEFAULT: "var(--mantine-primary-color-filled)",
          foreground: "var(--mantine-primary-color-contrast)",
        },
        secondary: {
          DEFAULT: "var(--mantine-color-default-hover)",
          foreground: "var(--mantine-color-text)",
        },
        muted: {
          DEFAULT: "var(--mantine-color-default-hover)",
          foreground: "var(--mantine-color-dimmed)",
        },
        accent: {
          DEFAULT: "var(--mantine-color-default-hover)",
          foreground: "var(--mantine-color-text)",
        },
        destructive: {
          DEFAULT: "var(--mantine-color-error)",
          foreground: "var(--mantine-color-white)",
        },
        border: "var(--mantine-color-default-border)",
        input: "var(--mantine-color-default-border)",
        ring: "var(--mantine-primary-color-filled)",
      },
      borderRadius: {
        lg: "var(--mantine-radius-lg)",
        md: "var(--mantine-radius-md)",
        sm: "var(--mantine-radius-sm)",
      },
    },
  },
  plugins: [],
} satisfies Config;
