"use client";

import { UserRound } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

type OAuthAvatarProps = {
  className?: string;
  fallbackClassName?: string;
  size: number;
  src: string | null;
};

export function OAuthAvatar({
  className,
  fallbackClassName,
  size,
  src
}: OAuthAvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src && src !== failedSrc);

  if (!showImage || !src) {
    return (
      <UserRound
        aria-hidden="true"
        className={cn("h-5 w-5", fallbackClassName)}
      />
    );
  }

  return (
    <Image
      alt=""
      className={cn("h-full w-full object-cover", className)}
      height={size}
      onError={() => setFailedSrc(src)}
      referrerPolicy="no-referrer"
      src={src}
      width={size}
    />
  );
}

