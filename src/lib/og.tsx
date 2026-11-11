import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Shared look for generated share images (WhatsApp, Facebook, X, LinkedIn previews).
export const OG_SIZE = { width: 1200, height: 630 };
export const NAVY = "#002a4d";
export const GOLD = "#f9bb00";

export async function ogAssets() {
  const [regular, heavy, logo] = await Promise.all([
    readFile(join(process.cwd(), "src/app/fonts/og/PlusJakartaSans-500.woff")),
    readFile(join(process.cwd(), "src/app/fonts/og/PlusJakartaSans-800.woff")),
    readFile(join(process.cwd(), "src/app/apple-icon.png")),
  ]);
  return {
    fonts: [
      { name: "Jakarta", data: regular, weight: 500 as const, style: "normal" as const },
      { name: "Jakarta", data: heavy, weight: 800 as const, style: "normal" as const },
    ],
    logo: `data:image/png;base64,${logo.toString("base64")}`,
  };
}

export function OgFrame({ logo, children }: { logo: string; children: React.ReactNode }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: NAVY, color: "white", fontFamily: "Jakarta", padding: "64px 72px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width={64} height={64} alt="" style={{ borderRadius: 14, background: "white" }} />
        <div style={{ display: "flex", fontSize: 30, fontWeight: 800 }}>Manifesto Tracker by Akar</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center" }}>{children}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 26, color: "rgba(255,255,255,0.7)" }}>
        <div style={{ display: "flex" }}>manifesto.akar.asia</div>
        <div style={{ display: "flex", width: 120, height: 8, borderRadius: 4, background: GOLD }} />
      </div>
    </div>
  );
}
