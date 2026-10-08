import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { TheBoldFont } from "../load-font";

const hue = (s: string) => {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
};

/** Обложка книги; если картинки нет — аккуратная текстовая обложка. */
export const BookCover: React.FC<{
  readonly title: string;
  readonly cover: string | null;
  readonly width: number;
}> = ({ title, cover, width }) => {
  const height = width * 1.5;
  const radius = Math.max(4, width * 0.04);

  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        overflow: "hidden",
        position: "relative",
        boxShadow: `0 ${width * 0.05}px ${width * 0.12}px rgba(0,0,0,0.55)`,
      }}
    >
      {cover ? (
        <Img
          src={staticFile(cover)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <AbsoluteFill
          style={{
            background: `linear-gradient(160deg, hsl(${hue(title)} 55% 38%), hsl(${(hue(title) + 40) % 360} 60% 18%))`,
            justifyContent: "center",
            alignItems: "center",
            padding: width * 0.1,
            textAlign: "center",
            color: "white",
            fontFamily: TheBoldFont,
            fontWeight: 900,
            fontSize: width * 0.12,
            lineHeight: 1.1,
            textTransform: "uppercase",
          }}
        >
          {title}
        </AbsoluteFill>
      )}
      {/* корешок */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.35) 0%, rgba(255,255,255,0.12) 4%, rgba(0,0,0,0) 9%)",
        }}
      />
    </div>
  );
};
