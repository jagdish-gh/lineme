"use client";

import { MessageSquarePlus, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ActionButton } from "@/components/ui/action-button";

type RequestInfoDialogProps = {
  cancelLabel: string;
  description: string;
  errorMessage: string;
  loading: boolean;
  memberLabel: string;
  onCancel: () => void;
  onSubmit: (prompt: string) => void;
  open: boolean;
  placeholder: string;
  submitLabel: string;
  submittingLabel: string;
  title: string;
};

export function RequestInfoDialog({
  cancelLabel,
  description,
  errorMessage,
  loading,
  memberLabel,
  onCancel,
  onSubmit,
  open,
  placeholder,
  submitLabel,
  submittingLabel,
  title
}: RequestInfoDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    if (!open) {
      setPrompt("");
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    textareaRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [loading, onCancel, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onCancel();
        }
      }}
    >
      <form
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        role="dialog"
        className="w-full max-w-lg rounded-[2rem] border border-white/70 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900 sm:p-7"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(prompt.trim());
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/10 text-violet-700 dark:text-violet-200">
            <MessageSquarePlus aria-hidden="true" className="h-5 w-5" />
          </span>
          <button
            type="button"
            aria-label={cancelLabel}
            disabled={loading}
            onClick={onCancel}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-950/5 dark:text-slate-400 dark:hover:bg-white/10"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <h2 id={titleId} className="mt-5 text-xl font-semibold text-slate-950 dark:text-white">
          {title}
        </h2>
        <p className="mt-1 text-sm font-semibold text-teal-700 dark:text-teal-200">
          {memberLabel}
        </p>
        <p id={descriptionId} className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {description}
        </p>
        <textarea
          ref={textareaRef}
          required
          maxLength={300}
          rows={4}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={placeholder}
          className="mt-5 w-full resize-none rounded-2xl border border-slate-950/10 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-teal-500/60 focus:ring-4 focus:ring-teal-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
        />
        {errorMessage ? (
          <p role="alert" className="mt-3 text-sm font-medium text-rose-600 dark:text-rose-300">
            {errorMessage}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <ActionButton type="button" size="small" variant="secondary" disabled={loading} onClick={onCancel}>
            {cancelLabel}
          </ActionButton>
          <ActionButton type="submit" size="small" disabled={loading || !prompt.trim()}>
            {loading ? submittingLabel : submitLabel}
          </ActionButton>
        </div>
      </form>
    </div>,
    document.body
  );
}
