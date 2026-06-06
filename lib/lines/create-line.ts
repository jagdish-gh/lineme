import {
  type CreateLineFormState,
  queueTypes
} from "@/components/create-line/create-line.types";
import {
  type FormQuestion,
  type QuestionType
} from "@/components/ui/question-builder.types";

export type CreateLineErrorCode =
  | "authentication_required"
  | "configuration"
  | "create_failed"
  | "database_not_ready"
  | "invalid_capacity"
  | "invalid_custom_type"
  | "invalid_estimate"
  | "invalid_line_name"
  | "invalid_location"
  | "invalid_questions"
  | "invalid_request";

export type CreatedLine = {
  id: string;
  publicCode: string;
};

type ValidationResult =
  | { data: CreateLineFormState; success: true }
  | { code: CreateLineErrorCode; success: false };

const questionTypes: QuestionType[] = [
  "text",
  "phone",
  "email",
  "number",
  "choice"
];

function isOptionalInteger(value: unknown, minimum: number, maximum: number) {
  return (
    value === "" ||
    (typeof value === "number" &&
      Number.isInteger(value) &&
      value >= minimum &&
      value <= maximum)
  );
}

function normalizeQuestions(value: unknown): FormQuestion[] | null {
  if (!Array.isArray(value) || value.length > 20) {
    return null;
  }

  const questions: FormQuestion[] = [];

  for (const [index, item] of value.entries()) {
    if (!item || typeof item !== "object") {
      return null;
    }

    const question = item as Partial<FormQuestion>;
    const label = typeof question.label === "string" ? question.label.trim() : "";
    const type = question.type;

    if (
      label.length < 1 ||
      label.length > 120 ||
      !type ||
      !questionTypes.includes(type)
    ) {
      return null;
    }

    const options =
      type === "choice" && Array.isArray(question.options)
        ? question.options
            .filter((option): option is string => typeof option === "string")
            .map((option) => option.trim())
            .filter(Boolean)
        : [];

    if (type === "choice" && (options.length < 2 || options.length > 20)) {
      return null;
    }

    questions.push({
      id: `question-${index + 1}`,
      label,
      options,
      required: question.required === true,
      type
    });
  }

  return questions;
}

export function validateCreateLine(value: unknown): ValidationResult {
  if (!value || typeof value !== "object") {
    return { code: "invalid_request", success: false };
  }

  const input = value as Partial<CreateLineFormState>;
  const lineName = typeof input.lineName === "string" ? input.lineName.trim() : "";
  const location = typeof input.location === "string" ? input.location.trim() : "";
  const customQueueType =
    typeof input.customQueueType === "string" ? input.customQueueType.trim() : "";

  if (lineName.length < 2 || lineName.length > 100) {
    return { code: "invalid_line_name", success: false };
  }

  if (location.length > 160) {
    return { code: "invalid_location", success: false };
  }

  if (!input.queueType || !queueTypes.includes(input.queueType)) {
    return { code: "invalid_request", success: false };
  }

  if (
    input.queueType === "other" &&
    (customQueueType.length < 2 || customQueueType.length > 80)
  ) {
    return { code: "invalid_custom_type", success: false };
  }

  if (!isOptionalInteger(input.estimatedMinutes, 2, 60)) {
    return { code: "invalid_estimate", success: false };
  }

  if (!isOptionalInteger(input.capacity, 5, 250)) {
    return { code: "invalid_capacity", success: false };
  }

  const joinQuestions = normalizeQuestions(input.joinQuestions);

  if (!joinQuestions) {
    return { code: "invalid_questions", success: false };
  }

  return {
    data: {
      allowPause: input.allowPause !== false,
      autoNotify: input.autoNotify !== false,
      capacity: input.capacity ?? "",
      customQueueType: input.queueType === "other" ? customQueueType : "",
      estimatedMinutes: input.estimatedMinutes ?? "",
      joinQuestions,
      lineName,
      location,
      queueType: input.queueType
    },
    success: true
  };
}

export function toCreateLineRpcParams(form: CreateLineFormState) {
  return {
    p_allow_pause: form.allowPause,
    p_auto_notify: form.autoNotify,
    p_custom_line_type:
      form.queueType === "other" ? form.customQueueType : null,
    p_daily_capacity: form.capacity === "" ? null : form.capacity,
    p_estimated_service_minutes:
      form.estimatedMinutes === "" ? null : form.estimatedMinutes,
    p_line_type: form.queueType,
    p_location: form.location,
    p_name: form.lineName,
    p_questions: form.joinQuestions.map(({ label, options, required, type }) => ({
      label,
      options,
      required,
      type
    }))
  };
}
