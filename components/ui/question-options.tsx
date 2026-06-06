"use client";

import { Plus, Trash2 } from "lucide-react";

import { ActionButton } from "@/components/ui/action-button";

type QuestionOptionsProps = {
  addLabel: string;
  onChange: (options: string[]) => void;
  optionLabel: string;
  options: string[];
  placeholder?: string;
  removeLabel: string;
};

export function QuestionOptions({
  addLabel,
  onChange,
  optionLabel,
  options,
  placeholder,
  removeLabel
}: QuestionOptionsProps) {
  return (
    <div className="rounded-xl bg-slate-950/[0.03] p-3 dark:bg-white/5">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        {optionLabel}
      </p>
      <div className="mt-3 grid gap-2">
        {options.map((option, optionIndex) => (
          <div key={`option-${optionIndex}`} className="flex gap-2">
            <input
              value={option}
              placeholder={placeholder}
              onChange={(event) =>
                onChange(
                  options.map((currentOption, currentIndex) =>
                    currentIndex === optionIndex ? event.target.value : currentOption
                  )
                )
              }
              className="min-h-10 min-w-0 flex-1 rounded-xl border border-slate-950/10 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-teal-500/60 focus:ring-4 focus:ring-teal-500/10 dark:border-white/10 dark:bg-white/10 dark:text-white"
            />
            <ActionButton
              aria-label={removeLabel}
              icon={Trash2}
              onClick={() =>
                onChange(options.filter((_, currentIndex) => currentIndex !== optionIndex))
              }
              size="icon"
              type="button"
              variant="danger"
            />
          </div>
        ))}
        <ActionButton
          icon={Plus}
          onClick={() => onChange([...options, ""])}
          size="small"
          type="button"
          variant="secondary"
        >
          {addLabel}
        </ActionButton>
      </div>
    </div>
  );
}
