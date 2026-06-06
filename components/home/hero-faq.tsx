"use client";

import { CircleHelp } from "lucide-react";
import { useTranslations } from "next-intl";

import { Faq } from "@/components/ui/faq";

const faqKeys = ["what", "how", "account", "install", "turn", "who"] as const;

export function HeroFaq() {
  const t = useTranslations("faq");

  return (
    <Faq
      icon={CircleHelp}
      items={faqKeys.map((key) => ({
        id: key,
        question: t(`items.${key}.question`),
        answer: t(`items.${key}.answer`)
      }))}
      subtitle={t("subtitle")}
      title={t("title")}
    />
  );
}
