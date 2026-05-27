"use client";

import { useMemo, useState } from "react";

import { type CreateLineFormState } from "@/components/create-line/create-line.types";

export function useCreateLineForm(defaults: Pick<CreateLineFormState, "lineName" | "location">) {
  const [created, setCreated] = useState(false);
  const [form, setForm] = useState<CreateLineFormState>({
    ...defaults,
    queueType: "clinic",
    estimatedMinutes: 8,
    capacity: 40,
    autoNotify: true,
    allowPause: true
  });

  const lineCode = useMemo(() => {
    const cleaned = form.lineName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase();
    return `${cleaned || "LIN"}-${Math.max(10, form.capacity + form.estimatedMinutes)}`;
  }, [form.capacity, form.estimatedMinutes, form.lineName]);

  function updateForm<Key extends keyof CreateLineFormState>(
    key: Key,
    value: CreateLineFormState[Key]
  ) {
    setCreated(false);
    setForm((current) => ({ ...current, [key]: value }));
  }

  return {
    created,
    form,
    lineCode,
    setCreated,
    updateForm
  };
}
