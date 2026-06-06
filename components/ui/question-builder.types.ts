export type QuestionType = "text" | "phone" | "email" | "number" | "choice";

export type FormQuestion = {
  id: string;
  label: string;
  options: string[];
  required: boolean;
  type: QuestionType;
};
