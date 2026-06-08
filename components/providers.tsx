"use client";

import { ThemeProvider } from "next-themes";

import { MixpanelIdentity } from "@/components/analytics/mixpanel-identity";
import {
  AuthCodeRedirect,
  PendingAccountJoinRedirect
} from "@/components/tickets/pending-account-join";
import { TicketTurnNotifier } from "@/components/tickets/ticket-turn-notifier";

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
      <AuthCodeRedirect />
      <PendingAccountJoinRedirect />
      <TicketTurnNotifier />
      {children}
    </ThemeProvider>
  );
}
