"use client";

import { Asterisk, ChevronDown, Plus, Trash2 } from "lucide-react";

import { ActionButton } from "@/components/ui/action-button";
import { FormToggle } from "@/components/ui/form-toggle";
import { QuestionOptions } from "@/components/ui/question-options";
import {
  type FormQuestion,
  type QuestionType
} from "@/components/ui/question-builder.types";

export type { FormQuestion, QuestionType } from "@/components/ui/question-builder.types";

type QuestionBuilderLabels = {
  add: string;
  addOption: string;
  empty: string;
  fieldLabel: string;
  fieldPlaceholder?: string;
  optionLabel: string;
  optionPlaceholder?: string;
  remove: string;
  removeOption: string;
  required: string;
  typeLabel: string;
  types: Record<QuestionType, string>;
};

type QuestionBuilderProps = {
  labels: QuestionBuilderLabels;
  onAdd: () => void;
  onChange: (id: string, changes: Partial<Omit<FormQuestion, "id">>) => void;
  onRemove: (id: string) => void;
  questions: FormQuestion[];
};

export function QuestionBuilder({
  labels,
  onAdd,
  onChange,
  onRemove,
  questions
}: QuestionBuilderProps) {
  return (
    <div className="grid gap-4">
      {questions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/40 px-5 py-8 text-center text-sm text-slate-500 dark:border-white/15 dark:bg-white/5 dark:text-slate-400">
          {labels.empty}
        </div>
      ) : (
        questions.map((question) => (
          <div
            key={question.id}
            className="grid gap-4 rounded-2xl border border-slate-200/80 bg-white/65 p-4 dark:border-white/10 dark:bg-white/5"
          >
            <div className="flex items-start gap-3">
              <label className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {labels.fieldLabel}
                </span>
                <input
                  required
                  value={question.label}
                  placeholder={labels.fieldPlaceholder}
                  onChange={(event) => onChange(question.id, { label: event.target.value })}
                  className="mt-2 min-h-11 w-full rounded-xl border border-slate-950/10 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-teal-500/60 focus:ring-4 focus:ring-teal-500/10 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
              </label>
              <ActionButton
                aria-label={labels.remove}
                className="mt-6 shrink-0"
                icon={Trash2}
                onClick={() => onRemove(question.id)}
                size="icon"
                type="button"
                variant="danger"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <label>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {labels.typeLabel}
                </span>
                <span className="relative mt-2 block">
                  <select
                    value={question.type}
                    onChange={(event) =>
                      onChange(question.id, { type: event.target.value as QuestionType })
                    }
                    className="min-h-11 w-full appearance-none rounded-xl border border-slate-950/10 bg-white py-2 pl-3 pr-10 text-sm font-medium text-slate-800 outline-none transition focus:border-teal-500/60 focus:ring-4 focus:ring-teal-500/10 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  >
                    {(Object.keys(labels.types) as QuestionType[]).map((type) => (
                      <option key={type} value={type}>
                        {labels.types[type]}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    aria-hidden="true"
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400"
                  />
                </span>
              </label>

              <FormToggle
                checked={question.required}
                icon={Asterisk}
                label={labels.required}
                onChange={(required) => onChange(question.id, { required })}
              />
            </div>

            {question.type === "choice" ? (
              <QuestionOptions
                addLabel={labels.addOption}
                onChange={(options) => onChange(question.id, { options })}
                optionLabel={labels.optionLabel}
                options={question.options}
                placeholder={labels.optionPlaceholder}
                removeLabel={labels.removeOption}
              />
            ) : null}
          </div>
        ))
      )}

      <ActionButton
        className="justify-self-start"
        icon={Plus}
        onClick={onAdd}
        size="small"
        type="button"
        variant="secondary"
      >
        {labels.add}
      </ActionButton>
    </div>
  );
}
