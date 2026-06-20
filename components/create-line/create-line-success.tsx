"use client";

import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Printer,
  QrCode,
  Settings2
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";

import { ActionButton } from "@/components/ui/action-button";

type CreateLineSuccessProps = {
  code: string;
  copiedLabel: string;
  copyLabel: string;
  customerDescription: string;
  customerLinkLabel: string;
  description: string;
  downloadQrLabel: string;
  lineId: string;
  lineCodeLabel: string;
  lineName: string;
  locale: string;
  manageDescription: string;
  manageLinkLabel: string;
  printQrLabel: string;
  qrDescription: string;
  qrPosterFooter: string;
  qrPosterSubtitle: string;
  qrTitle: string;
  title: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function CreateLineSuccess({
  code,
  copiedLabel,
  copyLabel,
  customerDescription,
  customerLinkLabel,
  description,
  downloadQrLabel,
  lineId,
  lineCodeLabel,
  lineName,
  locale,
  manageDescription,
  manageLinkLabel,
  printQrLabel,
  qrDescription,
  qrPosterFooter,
  qrPosterSubtitle,
  qrTitle,
  title
}: CreateLineSuccessProps) {
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [origin, setOrigin] = useState("");
  const joinPath = `/${locale}/join/${code}`;
  const joinUrl = useMemo(
    () => (origin ? `${origin}${joinPath}` : joinPath),
    [joinPath, origin]
  );

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

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
      <p class="subtitle">${escapeHtml(qrPosterSubtitle)}</p>
      <div class="qr-wrap"><img alt="" src="${qrCodeUrl}" /></div>
      <p class="code-label">${escapeHtml(lineCodeLabel)}</p>
      <p class="code">${escapeHtml(code)}</p>
      <p class="url">${escapeHtml(joinUrl)}</p>
      <p class="footer">${escapeHtml(qrPosterFooter)}</p>
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

  useEffect(() => {
    setOrigin(window.location.origin);
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

  return (
    <div
      className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 dark:border-emerald-400/20 dark:bg-emerald-400/10"
      role="status"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2
          aria-hidden="true"
          className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300"
        />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-emerald-950 dark:text-emerald-100">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-emerald-800 dark:text-emerald-200">
            {description}
          </p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3 rounded-xl border border-emerald-200 bg-white/80 p-3 dark:border-emerald-300/15 dark:bg-slate-950/30">
            <div>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                {lineCodeLabel}
              </p>
              <p className="mt-1 select-all font-mono text-xl font-bold tracking-[0.12em] text-slate-950 dark:text-white">
                {code}
              </p>
            </div>
            <ActionButton
              icon={copied ? Check : Copy}
              onClick={copyCode}
              size="small"
              type="button"
              variant="secondary"
            >
              {copied ? copiedLabel : copyLabel}
            </ActionButton>
          </div>

          <div className="mt-4 grid gap-4 rounded-xl border border-emerald-200 bg-white/85 p-4 dark:border-emerald-300/15 dark:bg-slate-950/30 lg:grid-cols-[minmax(0,0.72fr)_minmax(220px,0.28fr)]">
            <div className="flex min-w-0 flex-col">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-500/10 text-teal-700 dark:bg-teal-300/10 dark:text-teal-200">
                <QrCode aria-hidden="true" className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-950 dark:text-white">
                {qrTitle}
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {qrDescription}
              </p>
              <p className="mt-3 break-all rounded-xl bg-slate-950/[0.035] px-3 py-2 text-xs font-semibold text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                {joinUrl}
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <ActionButton
                  icon={Printer}
                  onClick={printQrPoster}
                  size="small"
                  type="button"
                  disabled={!qrCodeUrl}
                >
                  {printQrLabel}
                </ActionButton>
                <ActionButton
                  icon={Download}
                  onClick={downloadQrCode}
                  size="small"
                  type="button"
                  variant="secondary"
                  disabled={!qrCodeUrl}
                >
                  {downloadQrLabel}
                </ActionButton>
              </div>
            </div>
            <div className="grid place-items-center rounded-2xl bg-white p-3 shadow-sm dark:bg-white">
              {qrCodeUrl ? (
                <Image
                  alt=""
                  className="h-52 w-52"
                  height={208}
                  src={qrCodeUrl}
                  unoptimized
                  width={208}
                />
              ) : (
                <div className="grid h-52 w-52 place-items-center rounded-xl bg-slate-100 text-slate-400">
                  <QrCode aria-hidden="true" className="h-10 w-10" />
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col rounded-xl border border-emerald-200 bg-white/80 p-4 dark:border-emerald-300/15 dark:bg-slate-950/30">
              <p className="text-sm leading-6 text-emerald-800 dark:text-emerald-200">
                {customerDescription}
              </p>
              <Link
                href={`/${locale}/join/${code}`}
                className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:bg-teal-300 dark:text-slate-950 dark:hover:bg-teal-200"
              >
                <ExternalLink aria-hidden="true" className="h-4 w-4" />
                {customerLinkLabel}
              </Link>
            </div>
            <div className="flex flex-col rounded-xl border border-emerald-200 bg-white/80 p-4 dark:border-emerald-300/15 dark:bg-slate-950/30">
              <p className="text-sm leading-6 text-emerald-800 dark:text-emerald-200">
                {manageDescription}
              </p>
              <Link
                href={`/${locale}/manage/${lineId}`}
                className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
              >
                <Settings2 aria-hidden="true" className="h-4 w-4" />
                {manageLinkLabel}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
