"use client";

import { Disclosure } from "@/components/ui/disclosure";
import { QuestionBuilder } from "@/components/ui/question-builder";
import { type FormQuestion } from "@/components/ui/question-builder.types";
import { ClipboardList } from "lucide-react";
import { useTranslations } from "next-intl";

type JoinerQuestionsProps = {
  onAdd: () => void;
  onChange: (id: string, changes: Partial<Omit<FormQuestion, "id">>) => void;
  onRemove: (id: string) => void;
  questions: FormQuestion[];
};

export function JoinerQuestions({
  onAdd,
  onChange,
  onRemove,
  questions
}: JoinerQuestionsProps) {
  const t = useTranslations("createLine.questions");

  return (
    <Disclosure
      description={t("summary", { count: questions.length })}
      icon={ClipboardList}
      title={t("title")}
    >
      <div className="grid gap-4">
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          {t("description")}
        </p>
        <QuestionBuilder
          labels={{
            add: t("add"),
            addOption: t("addOption"),
            empty: t("empty"),
            fieldLabel: t("fieldLabel"),
            fieldPlaceholder: t("fieldPlaceholder"),
            optionLabel: t("optionLabel"),
            optionPlaceholder: t("optionPlaceholder"),
            remove: t("remove"),
            removeOption: t("removeOption"),
            required: t("required"),
            typeLabel: t("typeLabel"),
            types: {
              text: t("types.text"),
              phone: t("types.phone"),
              email: t("types.email"),
              number: t("types.number"),
              choice: t("types.choice")
            }
          }}
          onAdd={onAdd}
          onChange={onChange}
          onRemove={onRemove}
          questions={questions}
        />
      </div>
    </Disclosure>
  );
}
