import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** Renders a real, scannable QR code (data URL) for the given text. */
export function QR({ value, size = 160, className, dark = "#0A2540" }: { value: string; size?: number; className?: string; dark?: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let live = true;
    QRCode.toDataURL(value, { width: size * 2, margin: 1, color: { dark, light: "#ffffff" }, errorCorrectionLevel: "M" })
      .then((u) => live && setSrc(u))
      .catch(() => live && setSrc(""));
    return () => {
      live = false;
    };
  }, [value, size, dark]);
  return src ? (
    <img src={src} width={size} height={size} alt={`QR code for ${value}`} className={className} />
  ) : (
    <div style={{ width: size, height: size }} className={`skeleton ${className ?? ""}`} />
  );
}

export async function downloadQR(value: string, filename: string) {
  const url = await QRCode.toDataURL(value, { width: 800, margin: 2, color: { dark: "#0A2540", light: "#ffffff" } });
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}
