"use client";

import { ThemeProvider } from "next-themes";

import { MixpanelIdentity } from "@/components/analytics/mixpanel-identity";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      storageKey="lineme-theme"
    >
      <MixpanelIdentity />
      {children}
    </ThemeProvider>
  );
}
