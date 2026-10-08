import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { TheBoldFont } from "../load-font";
import { COLUMN_W, columnLeft, HEADER_H } from "./layout";
import { COLUMN_COLORS, COLUMNS } from "./schema";

/** Три плашки SKIP | READ | STUDY. Плашка «подпрыгивает», когда в неё прилетает книга. */
export const ColumnsHeader: React.FC<{
  readonly landings: { column: (typeof COLUMNS)[number]; frame: number }[];
  readonly top: number;
}> = ({ landings, top }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const intro = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: 8,
  });

  return (
    <>
      {COLUMNS.map((column) => {
        const landed = landings.filter(
          (l) => l.column === column && l.frame <= frame,
        );
        const lastLanding = landed[landed.length - 1];
        const pulse = lastLanding
          ? spring({
              frame: frame - lastLanding.frame,
              fps,
              config: { damping: 8, stiffness: 300 },
            })
          : 1;
        const scale = lastLanding ? interpolate(pulse, [0, 1], [1.15, 1]) : 1;
        const count = landed.length;

        return (
          <div
            key={column}
            style={{
              position: "absolute",
              left: columnLeft(column),
              top,
              width: COLUMN_W,
              height: HEADER_H,
              borderRadius: 22,
              backgroundColor: COLUMN_COLORS[column],
              boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 14,
              fontFamily: TheBoldFont,
              fontWeight: 900,
              fontSize: 50,
              color: "#111",
              letterSpacing: 1,
              opacity: intro,
              transform: `translateY(${interpolate(intro, [0, 1], [-30, 0])}px) scale(${scale})`,
            }}
          >
            {column.toUpperCase()}
            {count > 0 ? (
              <span
                style={{
                  fontSize: 30,
                  minWidth: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: "rgba(0,0,0,0.85)",
                  color: COLUMN_COLORS[column],
                  display: "inline-flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {count}
              </span>
            ) : null}
          </div>
        );
      })}
    </>
  );
};
