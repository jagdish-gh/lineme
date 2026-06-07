"use client";

import { LogIn, Smartphone, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

import { ActionButton } from "@/components/ui/action-button";

type JoinAuthDialogProps = {
  anonymousLabel: string;
  closeLabel: string;
  description: string;
  loginLabel: string;
  onAnonymous: () => void;
  onClose: () => void;
  onLogin: () => void;
  open: boolean;
  title: string;
};

export function JoinAuthDialog({
  anonymousLabel,
  closeLabel,
  description,
  loginLabel,
  onAnonymous,
  onClose,
  onLogin,
  open,
  title
}: JoinAuthDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);

  closeRef.current = onClose;

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeRef.current();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        role="dialog"
        className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white p-6 shadow-2xl shadow-slate-950/20 dark:border-white/10 dark:bg-slate-900 sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal-500/10 text-teal-700 dark:bg-teal-300/10 dark:text-teal-200">
            <LogIn aria-hidden="true" className="h-5 w-5" />
          </span>
          <button
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-950/5 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
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

        <div className="mt-7 grid gap-3">
          <ActionButton type="button" onClick={onLogin}>
            <LogIn aria-hidden="true" className="h-4 w-4" />
            {loginLabel}
          </ActionButton>
          <ActionButton
            type="button"
            variant="secondary"
            onClick={onAnonymous}
          >
            <Smartphone aria-hidden="true" className="h-4 w-4" />
            {anonymousLabel}
          </ActionButton>
        </div>
      </div>
    </div>,
    document.body
  );
}
