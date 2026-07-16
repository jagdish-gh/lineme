"use client";

import { ThemeProvider } from "next-themes";

import { MixpanelIdentity } from "@/components/analytics/mixpanel-identity";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import {
  AuthCodeRedirect,
  PendingAccountJoinRedirect
} from "@/components/tickets/pending-account-join";
import { PushNotificationPrompt } from "@/components/tickets/push-notification-prompt";
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
      <ServiceWorkerRegistration />
      <AuthCodeRedirect />
      <PendingAccountJoinRedirect />
      <PushNotificationPrompt />
      <TicketTurnNotifier />
      {children}
    </ThemeProvider>
  );
}
