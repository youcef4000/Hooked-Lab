import { ImageResponse } from "next/og";

/* ============================================================================
   Image d'apercu des liens (WhatsApp, Facebook, Messenger, TikTok).

   Un lien partage sans image apparait nu, et se fait ignorer. Celle-ci est
   generee une fois a la construction, aux couleurs du site : le monogramme
   en barres d'or, le nom, la promesse.
   ========================================================================== */

export const alt = "Hooked Lab — Décortique les créatives qui vendent";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BARRES = [
  { x: 0, h: 128, y: 0 },
  { x: 34, h: 40, y: 44 },
  { x: 68, h: 40, y: 44 },
  { x: 102, h: 128, y: 0 },
];

export default function ImageApercu() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: "#07060a",
          backgroundImage:
            "radial-gradient(circle at 82% 18%, rgba(201,162,39,0.28), transparent 46%), radial-gradient(circle at 10% 100%, rgba(184,115,51,0.18), transparent 40%)",
          color: "#f6f2ea",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ display: "flex", position: "relative", width: 124, height: 128 }}>
            {BARRES.map((b, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: b.x,
                  top: b.y,
                  width: 22,
                  height: b.h,
                  borderRadius: 11,
                  background: "linear-gradient(180deg, #f2dfa0, #c9a227 60%, #8c6b3f)",
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 52, fontWeight: 600, letterSpacing: -1 }}>
            Hooked&nbsp;<span style={{ color: "#e0be55" }}>Lab</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", fontSize: 66, fontWeight: 600, lineHeight: 1.06, letterSpacing: -2, maxWidth: 980 }}>
            Chaque créative virale cache un produit gagnant.
          </div>
          <div style={{ display: "flex", gap: 14, fontSize: 26, color: "#b6afbd" }}>
            {["Script", "Angles", "Sourcing 1688", "Rentabilité COD"].map((t) => (
              <div
                key={t}
                style={{
                  display: "flex",
                  padding: "8px 20px",
                  borderRadius: 999,
                  border: "1px solid rgba(201,162,39,0.45)",
                  color: "#f2dfa0",
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
