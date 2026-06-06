import { type CreateLineFormState } from "@/components/create-line/create-line.types";
import {
  type CreatedLine,
  type CreateLineErrorCode
} from "@/lib/lines/create-line";

type CreateLineResponse = CreatedLine & {
  code?: CreateLineErrorCode;
};

export class CreateLineRequestError extends Error {
  constructor(public readonly code: CreateLineErrorCode) {
    super(code);
  }
}

export async function createLine(form: CreateLineFormState) {
  const response = await fetch("/api/lines", {
    body: JSON.stringify(form),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });
  const data = (await response.json()) as CreateLineResponse;

  if (!response.ok) {
    throw new CreateLineRequestError(data.code ?? "create_failed");
  }

  return data;
}
