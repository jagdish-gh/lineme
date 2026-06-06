"use client";

import { useEffect, useRef, useState } from "react";

import { loadCreateLineDraft } from "@/components/create-line/create-line-draft";
import { type CreateLineFormState } from "@/components/create-line/create-line.types";
import { type FormQuestion } from "@/components/ui/question-builder.types";

type CreateLineDefaults = Pick<CreateLineFormState, "lineName" | "location" | "joinQuestions">;

export function useCreateLineForm(defaults: CreateLineDefaults) {
  const nextQuestionId = useRef(defaults.joinQuestions.length + 1);
  const [form, setForm] = useState<CreateLineFormState>({
    ...defaults,
    queueType: "clinic",
    customQueueType: "",
    estimatedMinutes: "",
    capacity: "",
    autoNotify: true,
    allowPause: true,
    joinQuestions: defaults.joinQuestions
  });

  useEffect(() => {
    const draft = loadCreateLineDraft();

    if (draft) {
      setForm(draft);
      nextQuestionId.current = draft.joinQuestions.length + 1;
    }
  }, []);

  function updateForm<Key extends keyof CreateLineFormState>(
    key: Key,
    value: CreateLineFormState[Key]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function addQuestion(label: string) {
    const question: FormQuestion = {
      id: `question-${nextQuestionId.current}`,
      label,
      options: [],
      required: false,
      type: "text"
    };

    nextQuestionId.current += 1;
    setForm((current) => ({
      ...current,
      joinQuestions: [...current.joinQuestions, question]
    }));
  }

  function updateQuestion(id: string, changes: Partial<Omit<FormQuestion, "id">>) {
    setForm((current) => ({
      ...current,
      joinQuestions: current.joinQuestions.map((question) =>
        question.id === id ? { ...question, ...changes } : question
      )
    }));
  }

  function removeQuestion(id: string) {
    setForm((current) => ({
      ...current,
      joinQuestions: current.joinQuestions.filter((question) => question.id !== id)
    }));
  }

  return {
    addQuestion,
    form,
    removeQuestion,
    updateForm,
    updateQuestion
  };
}
