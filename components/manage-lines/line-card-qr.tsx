"use client";

import { QrCode } from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";

type LineCardQrProps = {
  code: string;
  label: string;
  locale: string;
};

export function LineCardQr({ code, label, locale }: LineCardQrProps) {
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
        margin: 1,
        width: 104
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
      aria-label={label}
      className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl border border-slate-950/10 bg-white p-1.5 shadow-sm dark:border-white/10 dark:bg-white"
      title={label}
    >
      {qrCodeUrl ? (
        <Image
          alt=""
          className="h-full w-full"
          height={68}
          src={qrCodeUrl}
          unoptimized
          width={68}
        />
      ) : (
        <QrCode aria-hidden="true" className="h-7 w-7 text-slate-400" />
      )}
    </div>
  );
}
