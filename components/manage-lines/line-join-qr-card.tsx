"use client";

import { Download, Printer, QrCode } from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";

import { ActionButton } from "@/components/ui/action-button";
import { Surface } from "@/components/ui/surface";

type LineJoinQrCardProps = {
  code: string;
  description: string;
  downloadLabel: string;
  lineCodeLabel: string;
  lineName: string;
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
  code,
  description,
  downloadLabel,
  lineCodeLabel,
  lineName,
  locale,
  posterFooter,
  posterSubtitle,
  printLabel,
  title
}: LineJoinQrCardProps) {
  const [origin, setOrigin] = useState("");
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
    <Surface className="mt-5 p-5 sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-500/10 text-teal-700 dark:bg-teal-300/10 dark:text-teal-200">
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
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
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
    </Surface>
  );
}
