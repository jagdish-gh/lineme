"use client";

import { CircleHelp } from "lucide-react";
import { useTranslations } from "next-intl";

import { Faq } from "@/components/ui/faq";

const faqKeys = [
  "howToJoin",
  "findCode",
  "account",
  "ticket",
  "rejoin",
  "privacy"
] as const;

export function JoinLineFaq() {
  const t = useTranslations("joinLine.faq");

  return (
    <Faq
      className="mx-0 w-full max-w-none [&>div:first-child]:inset-0"
      icon={CircleHelp}
      items={faqKeys.map((key) => ({
        id: key,
        question: t(`items.${key}.question`),
        answer: t(`items.${key}.answer`)
      }))}
      openItemIndex={null}
      subtitle={t("subtitle")}
      title={t("title")}
    />
  );
}
