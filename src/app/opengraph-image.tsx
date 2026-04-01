import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Dictou — La dictée intelligente pour les enfants";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #faf5ff 0%, #ede9fe 50%, #fce7f3 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 120, marginBottom: 20 }}>✏️</div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "#7c3aed",
            letterSpacing: "-2px",
          }}
        >
          Dictou
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#6b7280",
            marginTop: 16,
            textAlign: "center",
            maxWidth: 800,
          }}
        >
          La dictée intelligente pour les enfants 🦆
        </div>
        <div
          style={{
            marginTop: 40,
            display: "flex",
            gap: 16,
          }}
        >
          {["CP", "CE1", "CE2", "CM1", "CM2"].map((level) => (
            <div
              key={level}
              style={{
                background: "#7c3aed",
                color: "white",
                borderRadius: 999,
                padding: "8px 20px",
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              {level}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
