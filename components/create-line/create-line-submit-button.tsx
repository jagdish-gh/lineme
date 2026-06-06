import {
  ArrowRight,
  ClipboardCheck,
  LoaderCircle,
  ShieldCheck
} from "lucide-react";

import { ActionButton } from "@/components/ui/action-button";

type CreateLineSubmitButtonProps = {
  authenticated: boolean;
  createLabel: string;
  loading: boolean;
  loadingLabel: string;
  signInLabel: string;
};

export function CreateLineSubmitButton({
  authenticated,
  createLabel,
  loading,
  loadingLabel,
  signInLabel
}: CreateLineSubmitButtonProps) {
  const LeadingIcon = authenticated ? ClipboardCheck : ShieldCheck;

  return (
    <ActionButton
      className="group relative w-full px-12"
      disabled={loading}
      type="submit"
    >
      <span className="inline-flex min-w-0 items-center justify-center gap-3 text-center">
        {loading ? (
          <LoaderCircle aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin" />
        ) : (
          <LeadingIcon aria-hidden="true" className="h-4 w-4 shrink-0" />
        )}
        <span>{loading ? loadingLabel : authenticated ? createLabel : signInLabel}</span>
      </span>
      <ArrowRight
        aria-hidden="true"
        className="absolute right-5 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
      />
    </ActionButton>
  );
}
