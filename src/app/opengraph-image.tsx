import { ImageResponse } from "next/og";
import { OG_SIZE, OgFrame, ogAssets } from "@/lib/og";

export const alt = "Manifesto Tracker by Akar: track Malaysia’s manifestos and PRU pledges";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const { fonts, logo } = await ogAssets();
  return new ImageResponse(
    (
      <OgFrame logo={logo}>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>Manifesto Malaysia</div>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>& PRU tracker</div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 32, color: "rgba(255,255,255,0.8)" }}>
          Pledges, status and sources · Janji, status dan sumber
        </div>
      </OgFrame>
    ),
    { ...size, fonts },
  );
}
