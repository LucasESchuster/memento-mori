import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION } from "@/lib/site";

export const alt = "Memento Mori — Visualize sua vida em semanas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#efe9dd";
const INK = "#1a1613";
const INK_SOFT = "#5c5449";
const INK_MUTE = "#6b6259";
const RULE = "#d4cab5";
const CREAM_STRONG = "#c9c0ae";
const TERRACOTTA = "#a04e2a";

// A small memento-mori week grid motif, rendered with divs so no assets are
// needed. Fills roughly the first fifth of the squares to echo "weeks lived".
function WeekGrid() {
  const cols = 20;
  const rows = 6;
  const total = cols * rows;
  const filled = Math.round(total * 0.32);
  const cells = Array.from({ length: total });
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        width: cols * 20,
        gap: 6,
      }}
    >
      {cells.map((_, i) => (
        <div
          key={i}
          style={{
            width: 14,
            height: 14,
            background: i < filled ? INK : "transparent",
            border: `1px solid ${i < filled ? INK : CREAM_STRONG}`,
          }}
        />
      ))}
    </div>
  );
}

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PAPER,
          color: INK,
          padding: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: INK_MUTE,
          }}
        >
          <span>Memento Mori</span>
          <span style={{ color: TERRACOTTA }}>Lembra-te de que és mortal</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 150,
              lineHeight: 1,
              letterSpacing: -4,
            }}
          >
            Memento{" "}
            <span style={{ color: INK_SOFT, fontStyle: "italic", marginLeft: 24 }}>
              mori.
            </span>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 32,
              maxWidth: 760,
              fontSize: 34,
              fontStyle: "italic",
              color: INK_SOFT,
            }}
          >
            {SITE_DESCRIPTION}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            borderTop: `2px solid ${RULE}`,
            paddingTop: 32,
          }}
        >
          <span style={{ fontSize: 22, color: INK_MUTE }}>
            Cada quadrado é uma semana de vida.
          </span>
          <WeekGrid />
        </div>
      </div>
    ),
    { ...size },
  );
}
