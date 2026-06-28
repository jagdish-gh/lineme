"use client";

import { type CreateLineFormState, queueTypes } from "@/components/create-line/create-line.types";
import { Field } from "@/components/ui/field";
import { Disclosure } from "@/components/ui/disclosure";
import { FormSection } from "@/components/ui/form-section";
import { FormToggle } from "@/components/ui/form-toggle";
import { SelectField } from "@/components/ui/select-field";
import {
  BellRing,
  Building2,
  Hash,
  ListChecks,
  PauseCircle,
  PencilLine,
  Settings2,
  SlidersHorizontal
} from "lucide-react";
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
    <FormSection
      compact
      description={t("sections.details.description")}
      icon={Settings2}
      title={t("sections.details.title")}
    >
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            icon={Building2}
            label={t("fields.lineName")}
            placeholder={t("placeholders.lineName")}
            required
            value={form.lineName}
            onChange={(event) => onChange("lineName", event.target.value)}
          />
          <Field
            icon={Hash}
            label={t("fields.location")}
            placeholder={t("placeholders.location")}
            value={form.location}
            onChange={(event) => onChange("location", event.target.value)}
          />
        </div>

        <SelectField
          icon={ListChecks}
          label={t("fields.queueType")}
          options={queueTypes.map((type) => ({
            label: t(`types.${type}`),
            value: type
          }))}
          value={form.queueType}
          onChange={(event) => {
            const queueType = event.target.value as CreateLineFormState["queueType"];
            onChange("queueType", queueType);

            if (queueType !== "other") {
              onChange("customQueueType", "");
            }
          }}
        />

        {form.queueType === "other" ? (
          <Field
            icon={PencilLine}
            label={t("fields.customQueueType")}
            placeholder={t("placeholders.customQueueType")}
            required
            value={form.customQueueType}
            onChange={(event) => onChange("customQueueType", event.target.value)}
          />
        ) : null}

        <Disclosure
          description={t("advanced.description")}
          icon={SlidersHorizontal}
          title={t("advanced.title")}
        >
          <div className="grid gap-4">
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
          </div>
        </Disclosure>
      </div>
    </FormSection>
  );
}
