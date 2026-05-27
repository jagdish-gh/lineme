import { type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Surface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[2rem] border border-white/60 bg-white/65 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-white/10",
        className
      )}
      {...props}
    />
  );
}
