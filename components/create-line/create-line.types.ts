export const queueTypes = ["clinic", "restaurant", "service", "event"] as const;

export type QueueType = (typeof queueTypes)[number];

export type CreateLineFormState = {
  lineName: string;
  location: string;
  queueType: QueueType;
  estimatedMinutes: number;
  capacity: number;
  autoNotify: boolean;
  allowPause: boolean;
};
