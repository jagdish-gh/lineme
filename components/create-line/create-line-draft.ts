import { type CreateLineFormState } from "@/components/create-line/create-line.types";

const CREATE_LINE_DRAFT_KEY = "lineme:create-line-draft:v1";

export function loadCreateLineDraft() {
  try {
    const value = window.sessionStorage.getItem(CREATE_LINE_DRAFT_KEY);
    return value ? (JSON.parse(value) as CreateLineFormState) : null;
  } catch {
    return null;
  }
}

export function saveCreateLineDraft(draft: CreateLineFormState) {
  window.sessionStorage.setItem(CREATE_LINE_DRAFT_KEY, JSON.stringify(draft));
}

export function clearCreateLineDraft() {
  window.sessionStorage.removeItem(CREATE_LINE_DRAFT_KEY);
}
