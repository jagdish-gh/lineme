"use client";

import { ChevronDown, Download, MapPin, Printer, QrCode } from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";

import { CopyLineCodeButton } from "@/components/manage-lines/copy-line-code-button";
import { ActionButton } from "@/components/ui/action-button";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";

type LineJoinQrCardProps = {
  className?: string;
  code: string;
  copiedLabel: string;
  copyLabel: string;
  description: string;
  downloadLabel: string;
  lineCodeLabel: string;
  lineNameLabel: string;
  lineName: string;
  lineStatus: "active" | "closed" | "paused";
  lineStatusLabel: string;
  lineType: string;
  lineTypeLabel: string;
  location: string | null;
  locationLabel: string;
  locale: string;
  posterFooter: string;
  posterSubtitle: string;
  printLabel: string;
  title: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function LineJoinQrCard({
  className,
  code,
  copiedLabel,
  copyLabel,
  description,
  downloadLabel,
  lineCodeLabel,
  lineNameLabel,
  lineName,
  lineStatus,
  lineStatusLabel,
  lineType,
  lineTypeLabel,
  location,
  locationLabel,
  locale,
  posterFooter,
  posterSubtitle,
  printLabel,
  title
}: LineJoinQrCardProps) {
  const [origin, setOrigin] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const joinPath = `/${locale}/join/${code}`;
  const joinUrl = useMemo(
    () => (origin ? `${origin}${joinPath}` : joinPath),
    [joinPath, origin]
  );

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const syncExpanded = () => setExpanded(mediaQuery.matches);

    syncExpanded();
    mediaQuery.addEventListener("change", syncExpanded);

    return () => mediaQuery.removeEventListener("change", syncExpanded);
  }, []);

  useEffect(() => {
    let active = true;

    async function generateQrCode() {
      const image = await QRCode.toDataURL(joinUrl, {
        color: {
          dark: "#0f172a",
          light: "#ffffff"
        },
        errorCorrectionLevel: "M",
        margin: 2,
        width: 320
      });

      if (active) {
        setQrCodeUrl(image);
      }
    }

    void generateQrCode();

    return () => {
      active = false;
    };
  }, [joinUrl]);

  function printQrPoster() {
    if (!qrCodeUrl) {
      return;
    }

    const printable = window.open("", "_blank", "width=860,height=1100");

    if (!printable) {
      window.print();
      return;
    }

    printable.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(lineName)} - LineME QR</title>
    <style>
      @page { margin: 16mm; size: A4; }
      * { box-sizing: border-box; }
      body {
        color: #0f172a;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        margin: 0;
      }
      .poster {
        align-items: center;
        border: 2px solid #0f766e;
        border-radius: 28px;
        display: flex;
        flex-direction: column;
        min-height: calc(100vh - 32mm);
        padding: 34px;
        text-align: center;
      }
      .eyebrow {
        color: #0f766e;
        font-size: 15px;
        font-weight: 800;
        letter-spacing: 0.14em;
        margin: 0 0 14px;
        text-transform: uppercase;
      }
      h1 {
        font-size: 44px;
        line-height: 1.08;
        margin: 0;
      }
      .subtitle {
        color: #334155;
        font-size: 20px;
        line-height: 1.5;
        margin: 18px auto 28px;
        max-width: 560px;
      }
      .qr-wrap {
        border: 1px solid #ccfbf1;
        border-radius: 28px;
        padding: 22px;
      }
      img {
        display: block;
        height: 320px;
        width: 320px;
      }
      .code-label {
        color: #475569;
        font-size: 14px;
        font-weight: 800;
        letter-spacing: 0.14em;
        margin: 26px 0 8px;
        text-transform: uppercase;
      }
      .code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
        font-size: 32px;
        font-weight: 900;
        letter-spacing: 0.18em;
        margin: 0;
      }
      .url {
        color: #0f766e;
        font-size: 17px;
        font-weight: 700;
        margin: 18px 0 0;
        overflow-wrap: anywhere;
      }
      .footer {
        color: #64748b;
        font-size: 14px;
        margin-top: auto;
        padding-top: 28px;
      }
    </style>
  </head>
  <body>
    <main class="poster">
      <p class="eyebrow">LineME</p>
      <h1>${escapeHtml(lineName)}</h1>
      <p class="subtitle">${escapeHtml(posterSubtitle)}</p>
      <div class="qr-wrap"><img alt="" src="${qrCodeUrl}" /></div>
      <p class="code-label">${escapeHtml(lineCodeLabel)}</p>
      <p class="code">${escapeHtml(code)}</p>
      <p class="url">${escapeHtml(joinUrl)}</p>
      <p class="footer">${escapeHtml(posterFooter)}</p>
    </main>
    <script>window.addEventListener("load", () => { window.print(); });</script>
  </body>
</html>`);
    printable.document.close();
  }

  function downloadQrCode() {
    if (!qrCodeUrl) {
      return;
    }

    const link = document.createElement("a");
    link.download = `lineme-${code}-qr.png`;
    link.href = qrCodeUrl;
    link.click();
  }

  return (
    <Surface className={cn("overflow-hidden", className)}>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-start justify-between gap-4 p-5 text-left transition hover:bg-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-teal-500 sm:p-6 dark:hover:bg-white/5"
      >
        <span className="min-w-0">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            {lineNameLabel}
          </span>
          <span className="mt-1 block break-words text-2xl font-semibold text-slate-950 dark:text-white sm:text-3xl">
            {lineName}
          </span>
          <span className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`w-fit shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                lineStatus === "active"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                  : lineStatus === "paused"
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-200"
                    : "bg-slate-500/10 text-slate-600 dark:text-slate-300"
              }`}
            >
              {lineStatusLabel}
            </span>
            <span className="font-mono text-sm font-bold tracking-[0.1em] text-slate-700 dark:text-slate-200">
              {code}
            </span>
          </span>
        </span>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-950/[0.035] text-slate-500 dark:bg-white/[0.06] dark:text-slate-300">
          <ChevronDown
            aria-hidden="true"
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {expanded ? (
        <div className="border-t border-slate-950/5 p-5 pt-5 sm:p-6 dark:border-white/10">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-950/[0.035] p-4 dark:bg-white/[0.06]">
              <dt className="text-xs text-slate-500 dark:text-slate-400">
                {lineTypeLabel}
              </dt>
              <dd className="mt-1 font-semibold text-slate-900 dark:text-white">
                {lineType}
              </dd>
            </div>
            <div className="rounded-2xl bg-slate-950/[0.035] p-4 dark:bg-white/[0.06]">
              <dt className="text-xs text-slate-500 dark:text-slate-400">
                {lineCodeLabel}
              </dt>
              <dd className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <span className="select-all font-mono text-base font-bold tracking-[0.1em] text-slate-900 dark:text-white">
                  {code}
                </span>
                <CopyLineCodeButton
                  code={code}
                  copiedLabel={copiedLabel}
                  copyLabel={copyLabel}
                />
              </dd>
            </div>
            {location ? (
              <div className="rounded-2xl bg-slate-950/[0.035] p-4 sm:col-span-2 dark:bg-white/[0.06]">
                <dt className="text-xs text-slate-500 dark:text-slate-400">
                  {locationLabel}
                </dt>
                <dd className="mt-1 flex items-start gap-2 font-semibold text-slate-900 dark:text-white">
                  <MapPin
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-300"
                  />
                  {location}
                </dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-5 grid gap-5 border-t border-slate-950/5 pt-5 dark:border-white/10">
            <div className="min-w-0">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-500/10 text-teal-700 dark:bg-teal-300/10 dark:text-teal-200">
                <QrCode aria-hidden="true" className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">
                {title}
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                {description}
              </p>
              <p className="mt-3 break-all rounded-xl bg-slate-950/[0.035] px-3 py-2 text-xs font-semibold text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                {joinUrl}
              </p>
              <div className="mt-4 grid gap-2">
                <ActionButton
                  disabled={!qrCodeUrl}
                  icon={Printer}
                  onClick={printQrPoster}
                  size="small"
                  type="button"
                >
                  {printLabel}
                </ActionButton>
                <ActionButton
                  disabled={!qrCodeUrl}
                  icon={Download}
                  onClick={downloadQrCode}
                  size="small"
                  type="button"
                  variant="secondary"
                >
                  {downloadLabel}
                </ActionButton>
              </div>
            </div>
            <button
              type="button"
              aria-label={downloadLabel}
              disabled={!qrCodeUrl}
              onClick={downloadQrCode}
              className="grid place-items-center justify-self-center rounded-2xl bg-white p-3 shadow-sm transition hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-wait dark:bg-white"
              title={downloadLabel}
            >
              {qrCodeUrl ? (
                <Image
                  alt=""
                  className="h-44 w-44 sm:h-52 sm:w-52 lg:h-44 lg:w-44"
                  height={176}
                  src={qrCodeUrl}
                  unoptimized
                  width={176}
                />
              ) : (
                <div className="grid h-44 w-44 place-items-center rounded-xl bg-slate-100 text-slate-400 sm:h-52 sm:w-52 lg:h-44 lg:w-44">
                  <QrCode aria-hidden="true" className="h-10 w-10" />
                </div>
              )}
            </button>
          </div>
        </div>
      ) : null}
    </Surface>
  );
}
