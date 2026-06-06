"use client";

import { AlertTriangle, LoaderCircle, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

import { ActionButton } from "@/components/ui/action-button";

type ConfirmationDialogProps = {
  cancelLabel: string;
  confirmLabel: string;
  description: string;
  loading?: boolean;
  loadingLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
};

export function ConfirmationDialog({
  cancelLabel,
  confirmLabel,
  description,
  loading = false,
  loadingLabel,
  onCancel,
  onConfirm,
  open,
  title
}: ConfirmationDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const loadingRef = useRef(loading);
  const onCancelRef = useRef(onCancel);

  loadingRef.current = loading;
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loadingRef.current) {
        onCancelRef.current();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );

      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [open]);

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
      <div
        ref={dialogRef}
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        role="alertdialog"
        className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white p-6 shadow-2xl shadow-slate-950/20 dark:border-white/10 dark:bg-slate-900 sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-500/10 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300">
            <AlertTriangle aria-hidden="true" className="h-5 w-5" />
          </span>
          <button
            type="button"
            aria-label={cancelLabel}
            disabled={loading}
            onClick={onCancel}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-950/5 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <h2
          id={titleId}
          className="mt-5 text-xl font-semibold text-slate-950 dark:text-white"
        >
          {title}
        </h2>
        <p
          id={descriptionId}
          className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300"
        >
          {description}
        </p>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <ActionButton
            ref={cancelButtonRef}
            type="button"
            variant="secondary"
            size="small"
            disabled={loading}
            onClick={onCancel}
          >
            {cancelLabel}
          </ActionButton>
          <ActionButton
            type="button"
            variant="danger"
            size="small"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? (
              <LoaderCircle
                aria-hidden="true"
                className="h-4 w-4 animate-spin"
              />
            ) : null}
            {loading ? loadingLabel ?? confirmLabel : confirmLabel}
          </ActionButton>
        </div>
      </div>
    </div>,
    document.body
  );
}
