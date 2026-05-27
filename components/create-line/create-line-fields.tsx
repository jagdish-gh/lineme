"use client";

import { Field } from "@/components/ui/field";
import { FormToggle } from "@/components/ui/form-toggle";
import { Surface } from "@/components/ui/surface";
import { type CreateLineFormState, queueTypes } from "@/components/create-line/create-line.types";
import { BellRing, Building2, Hash, PauseCircle, Timer, Users } from "lucide-react";
import { useTranslations } from "next-intl";

type CreateLineFieldsProps = {
  form: CreateLineFormState;
  onChange: <Key extends keyof CreateLineFormState>(
    key: Key,
    value: CreateLineFormState[Key]
  ) => void;
};

export function CreateLineFields({ form, onChange }: CreateLineFieldsProps) {
  const t = useTranslations("createLine");

  return (
    <Surface className="grid gap-5 p-5 sm:p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          icon={Building2}
          label={t("fields.lineName")}
          value={form.lineName}
          onChange={(event) => onChange("lineName", event.target.value)}
        />
        <Field
          icon={Hash}
          label={t("fields.location")}
          value={form.location}
          onChange={(event) => onChange("location", event.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {t("fields.queueType")}
        </label>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          {queueTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onChange("queueType", type)}
              className={
                form.queueType === type
                  ? "min-h-12 rounded-2xl bg-slate-950 px-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition dark:bg-white dark:text-slate-950"
                  : "min-h-12 rounded-2xl border border-slate-950/10 bg-white/70 px-3 text-sm font-semibold text-slate-700 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
              }
            >
              {t(`types.${type}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          icon={Timer}
          label={t("fields.estimatedMinutes")}
          min={2}
          max={60}
          type="number"
          value={form.estimatedMinutes}
          suffix={t("minutes")}
          onChange={(event) => onChange("estimatedMinutes", Number(event.target.value))}
        />
        <Field
          icon={Users}
          label={t("fields.capacity")}
          min={5}
          max={250}
          type="number"
          value={form.capacity}
          suffix={t("people")}
          onChange={(event) => onChange("capacity", Number(event.target.value))}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FormToggle
          checked={form.autoNotify}
          icon={BellRing}
          label={t("fields.autoNotify")}
          onChange={(checked) => onChange("autoNotify", checked)}
        />
        <FormToggle
          checked={form.allowPause}
          icon={PauseCircle}
          label={t("fields.allowPause")}
          onChange={(checked) => onChange("allowPause", checked)}
        />
      </div>
    </Surface>
  );
}
