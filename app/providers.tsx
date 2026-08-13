"use client";

import { MantineProvider, type MantineThemeOverride } from "@mantine/core";

type AppProvidersProps = {
  children: React.ReactNode;
  nonce: string;
  theme: MantineThemeOverride;
};

export function AppProviders({ children, nonce, theme }: AppProvidersProps) {
  return (
    <MantineProvider
      theme={theme}
      forceColorScheme="dark"
      getStyleNonce={() => nonce}
    >
      {children}
    </MantineProvider>
  );
}
