import { type FormQuestion } from "@/components/ui/question-builder.types";

export const queueTypes = ["clinic", "restaurant", "service", "event", "other"] as const;

export type QueueType = (typeof queueTypes)[number];

export type CreateLineFormState = {
  lineName: string;
  location: string;
  queueType: QueueType;
  customQueueType: string;
  estimatedMinutes: number | "";
  capacity: number | "";
  autoNotify: boolean;
  allowPause: boolean;
  joinQuestions: FormQuestion[];
};
