"use client";

import { Faq } from "@/components/ui/faq";
import { CircleHelp } from "lucide-react";
import { useTranslations } from "next-intl";

const faqKeys = [
  "lineDetails",
  "otherType",
  "advanced",
  "qrCode",
  "questions",
  "answerTypes",
  "multipleChoice",
  "required",
  "editQuestions",
  "after"
] as const;

export function CreateLineFaq() {
  const t = useTranslations("createLine.faq");

  return (
    <Faq
      className="max-w-none"
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
