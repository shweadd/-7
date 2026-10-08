import React from "react";
import {
  Audio,
  Easing,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BookCover } from "./BookCover";
import { Layout, SLOT_W } from "./layout";
import { PlanBook } from "./schema";

// Тайминги анимации (сек)
const APPEAR_LEAD = 0.1; // обложка чуть раньше названия
const FLY_DELAY = 0.15; // пауза после вердикта
export const FLY_DURATION = 0.55;

/**
 * Книга целиком: появляется в руках → после вердикта улетает в колонку со звуком → лежит в колонке.
 * Время — в кадрах ролика (уже за вычетом trimStart).
 */
export const FlyingBook: React.FC<{
  readonly book: PlanBook;
  readonly slotIndex: number;
  readonly layout: Layout;
  readonly trimStartSec: number;
}> = ({ book, slotIndex, layout, trimStartSec }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const appearFrame = Math.round(
    (book.appearSec - APPEAR_LEAD - trimStartSec) * fps,
  );
  const flyFrame = Math.round(
    (book.verdictSec + FLY_DELAY - trimStartSec) * fps,
  );
  const flyFrames = Math.round(FLY_DURATION * fps);

  if (frame < appearFrame) {
    return null;
  }

  const handsW = layout.hands.width;
  const from = { x: layout.hands.x, y: layout.hands.y };

  const appear = spring({
    frame: frame - appearFrame,
    fps,
    config: { damping: 14, stiffness: 180 },
    durationInFrames: Math.round(0.4 * fps),
  });
  // лёгкое «покачивание в руках»
  const bob = Math.sin((frame - appearFrame) / 9) * 6;

  let x = from.x;
  let y = from.y + bob + interpolate(appear, [0, 1], [80, 0]);
  let width = handsW * interpolate(appear, [0, 1], [0.7, 1]);
  let rotate = -4;
  let opacity = interpolate(appear, [0, 0.5], [0, 1], {
    extrapolateRight: "clamp",
  });

  if (frame >= flyFrame) {
    const t = interpolate(frame, [flyFrame, flyFrame + flyFrames], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    });

    if (book.column === null) {
      // Вердикт не распознан — просто растворяем обложку.
      opacity = 1 - t;
    } else {
      const to = layout.slotCenter(book.column, slotIndex);
      // Кривая Безье, огибающая лицо (контрольная точка считается в layout.ts).
      // Ширина считается от того же t, что и позиция — так проверка траектории совпадает с отрисовкой.
      const c = layout.flight(to);
      x = (1 - t) ** 2 * from.x + 2 * (1 - t) * t * c.x + t ** 2 * to.x;
      y = (1 - t) ** 2 * from.y + 2 * (1 - t) * t * c.y + t ** 2 * to.y;
      width = handsW + (SLOT_W - handsW) * t;
      rotate = interpolate(t, [0, 0.6, 1], [-4, 14, 0]);
      // маленький «шлепок» при приземлении
      const land = spring({
        frame: frame - flyFrame - flyFrames,
        fps,
        config: { damping: 9, stiffness: 260 },
      });
      if (frame >= flyFrame + flyFrames) {
        width = SLOT_W * interpolate(land, [0, 1], [1.12, 1]);
      }
    }
  }

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x - width / 2,
          top: y - (width * 1.5) / 2,
          transform: `rotate(${rotate}deg)`,
          opacity,
        }}
      >
        <BookCover title={book.title} cover={book.cover} width={width} />
      </div>
      {book.column !== null ? (
        <Sequence
          from={flyFrame}
          durationInFrames={Math.round(1 * fps)}
          layout="none"
        >
          <Audio src={staticFile("sfx/whoosh.wav")} volume={0.8} />
        </Sequence>
      ) : null}
    </>
  );
};

/** Кадр, на котором книга долетает до колонки (для «пульса» заголовка). */
export const landingFrame = (
  book: PlanBook,
  trimStartSec: number,
  fps: number,
) =>
  Math.round((book.verdictSec + FLY_DELAY + FLY_DURATION - trimStartSec) * fps);

/**
 * Отрезок кадров, когда обложка в нижней половине кадра (в руках и начало полёта).
 * В это время субтитры не показываем, чтобы текст не лез на книгу.
 */
export const handsBusy = (
  book: PlanBook,
  trimStartSec: number,
  fps: number,
) => ({
  from: Math.round((book.appearSec - APPEAR_LEAD - trimStartSec) * fps),
  to: Math.round(
    (book.verdictSec + FLY_DELAY + FLY_DURATION * 0.6 - trimStartSec) * fps,
  ),
});
