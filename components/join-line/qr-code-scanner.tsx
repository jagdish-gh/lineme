"use client";

import { Camera, CameraOff, LoaderCircle, ScanLine, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { normalizeLineCode } from "@/lib/lines/public-line";

type QrCodeScannerProps = {
  onCode: (code: string) => void;
};

type DetectedBarcode = {
  rawValue: string;
};

type BarcodeDetectorInstance = {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
};

type BarcodeDetectorConstructor = new (options: {
  formats: string[];
}) => BarcodeDetectorInstance;

export function QrCodeScanner({ onCode }: QrCodeScannerProps) {
  const t = useTranslations("joinLine.scanner");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const [status, setStatus] = useState<
    "idle" | "starting" | "scanning" | "unsupported" | "error"
  >("idle");

  function stopScanner() {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStatus("idle");
  }

  useEffect(() => stopScanner, []);

  async function startScanner() {
    const Detector = (
      window as typeof window & {
        BarcodeDetector?: BarcodeDetectorConstructor;
      }
    ).BarcodeDetector;

    if (!Detector || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      return;
    }

    setStatus("starting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" } }
      });
      const video = videoRef.current;

      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();
      setStatus("scanning");

      const detector = new Detector({ formats: ["qr_code"] });

      async function scanFrame() {
        if (!videoRef.current || !streamRef.current) {
          return;
        }

        try {
          const results = await detector.detect(videoRef.current);
          const code = results
            .map((result) => normalizeLineCode(result.rawValue))
            .find((value) => value.length === 10);

          if (code) {
            stopScanner();
            onCode(code);
            return;
          }
        } catch {
          // Some browsers throw while the first camera frames are still loading.
        }

        frameRef.current = window.requestAnimationFrame(scanFrame);
      }

      frameRef.current = window.requestAnimationFrame(scanFrame);
    } catch {
      stopScanner();
      setStatus("error");
    }
  }

  if (status === "idle") {
    return (
      <button
        type="button"
        onClick={startScanner}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-950/10 bg-white/75 px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
      >
        <ScanLine aria-hidden="true" className="h-4 w-4 text-teal-600 dark:text-teal-300" />
        {t("start")}
      </button>
    );
  }

  if (status === "unsupported" || status === "error") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
        <div className="flex items-start gap-3">
          <CameraOff aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">
              {status === "unsupported" ? t("unsupportedTitle") : t("errorTitle")}
            </p>
            <p className="mt-1 text-xs leading-5">
              {status === "unsupported"
                ? t("unsupportedDescription")
                : t("errorDescription")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-950/10 bg-slate-950 dark:border-white/10">
      <div className="relative aspect-[4/3]">
        <video
          ref={videoRef}
          aria-label={t("videoLabel")}
          className="h-full w-full object-cover"
          muted
          playsInline
        />
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="h-44 w-44 rounded-3xl border-2 border-white/90 shadow-[0_0_0_999px_rgba(2,6,23,0.38)]" />
        </div>
        {status === "starting" ? (
          <div className="absolute inset-0 grid place-items-center bg-slate-950/70 text-white">
            <LoaderCircle aria-hidden="true" className="h-7 w-7 animate-spin" />
          </div>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-3 bg-slate-950 px-4 py-3 text-white">
        <span className="inline-flex items-center gap-2 text-xs font-semibold">
          <Camera aria-hidden="true" className="h-4 w-4 text-teal-300" />
          {t("pointCamera")}
        </span>
        <button
          type="button"
          onClick={stopScanner}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
        >
          <X aria-hidden="true" className="h-4 w-4" />
          <span className="sr-only">{t("close")}</span>
        </button>
      </div>
    </div>
  );
}
