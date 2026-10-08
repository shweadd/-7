import { COLUMNS, Column, SkipReadStudyProps } from "./schema";

// Геометрия кадра 1080×1920. Главное правило: обложки, полёт и субтитры не заходят на лицо.
export const FRAME_W = 1080;
export const FRAME_H = 1920;

const PANEL_TOP_MAX = 170; // ниже верхнего интерфейса Reels
const PANEL_TOP_MIN = 60;
const PANEL_SIDE = 36;
const COLUMN_GAP = 18;
export const HEADER_H = 84;
export const COLUMN_W = (FRAME_W - PANEL_SIDE * 2 - COLUMN_GAP * 2) / 3;
export const SLOT_W = 96;
export const SLOT_H = SLOT_W * 1.5;
const SLOT_GAP = 14;
export const PANEL_H = HEADER_H + SLOT_GAP + SLOT_H;

const FACE_MARGIN = 36;
const BOTTOM_SAFE = 230; // нижний интерфейс Reels (подпись, кнопки)
const CAPTION_H = 150;
const CAPTION_BOTTOM_DEFAULT = 350;

export const ZOOM_SCALE = 1.12;
export const ZOOM_ORIGIN_Y = 0.42;

export type Rect = { x: number; y: number; w: number; h: number };

const intersects = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export const columnLeft = (column: Column) =>
  PANEL_SIDE + COLUMNS.indexOf(column) * (COLUMN_W + COLUMN_GAP);

/** Рамка лица в пикселях итогового кадра, с учётом кропа object-fit: cover, наезда и запаса. */
const faceRect = (props: SkipReadStudyProps): Rect | null => {
  if (!props.face) return null;
  const s = Math.max(FRAME_W / props.width, FRAME_H / props.height);
  const dw = props.width * s;
  const dh = props.height * s;
  const ox = (FRAME_W - dw) / 2;
  const oy = (FRAME_H - dh) / 2;
  let x1 = ox + props.face.x * dw;
  let y1 = oy + props.face.y * dh;
  let x2 = x1 + props.face.width * dw;
  let y2 = y1 + props.face.height * dh;
  if (props.zooms.length > 0) {
    // при наезде лицо растёт от точки (50%, 42%)
    const cx = FRAME_W / 2;
    const cy = FRAME_H * ZOOM_ORIGIN_Y;
    x1 = Math.min(x1, cx + (x1 - cx) * ZOOM_SCALE);
    y1 = Math.min(y1, cy + (y1 - cy) * ZOOM_SCALE);
    x2 = Math.max(x2, cx + (x2 - cx) * ZOOM_SCALE);
    y2 = Math.max(y2, cy + (y2 - cy) * ZOOM_SCALE);
  }
  return {
    x: x1 - FACE_MARGIN,
    y: y1 - FACE_MARGIN,
    w: x2 - x1 + FACE_MARGIN * 2,
    h: y2 - y1 + FACE_MARGIN * 2,
  };
};

export type Layout = ReturnType<typeof computeLayout>;

export const computeLayout = (props: SkipReadStudyProps) => {
  const face = faceRect(props);
  const warnings: string[] = [];

  // 1. Колонки: как можно ниже к 170px, но над лицом.
  const panelTop = Math.max(
    PANEL_TOP_MIN,
    Math.min(PANEL_TOP_MAX, (face ? face.y : Infinity) - PANEL_H),
  );
  const panelRect: Rect = { x: 0, y: panelTop, w: FRAME_W, h: PANEL_H };
  if (face && intersects(panelRect, face)) {
    warnings.push("колонки задевают лицо — человек слишком высоко в кадре");
  }

  // 2. Обложки в колонке — один ряд «веером», чтобы панель была низкой.
  const counts: Record<Column, number> = { skip: 0, read: 0, study: 0 };
  for (const b of props.books) if (b.column) counts[b.column]++;
  const slotCenter = (column: Column, index: number) => {
    const n = Math.max(1, counts[column]);
    const step =
      n > 1 ? Math.min(SLOT_W + 8, (COLUMN_W - 16 - SLOT_W) / (n - 1)) : 0;
    const rowW = SLOT_W + step * (n - 1);
    return {
      x: columnLeft(column) + (COLUMN_W - rowW) / 2 + index * step + SLOT_W / 2,
      y: panelTop + HEADER_H + SLOT_GAP + SLOT_H / 2,
    };
  };

  // 3. Обложка «в руках»: не выше подбородка и не ниже нижнего интерфейса.
  let handsW = props.hands.width * FRAME_W;
  let handsCY = props.hands.y * FRAME_H;
  if (face) {
    const minTop = face.y + face.h;
    const maxBottom = FRAME_H - BOTTOM_SAFE;
    const maxH = Math.max(0, maxBottom - minTop);
    if (handsW * 1.5 > maxH) handsW = Math.max(120, maxH / 1.5);
    handsCY = Math.min(
      Math.max(handsCY, minTop + (handsW * 1.5) / 2),
      maxBottom - (handsW * 1.5) / 2,
    );
    if (maxH < 180)
      warnings.push("под лицом мало места — обложка в руках будет маленькой");
  }
  const hands = { x: props.hands.x * FRAME_W, y: handsCY, width: handsW };

  // 4. Субтитры: под лицом.
  let captionBottom = CAPTION_BOTTOM_DEFAULT;
  if (face) {
    const captionTop = FRAME_H - captionBottom - CAPTION_H;
    const faceBottom = face.y + face.h;
    if (captionTop < faceBottom) {
      captionBottom = Math.max(
        BOTTOM_SAFE - 60,
        FRAME_H - faceBottom - CAPTION_H,
      );
      if (FRAME_H - captionBottom - CAPTION_H < faceBottom) {
        warnings.push("субтитрам не хватает места под лицом");
      }
    }
  }

  // 5. Траектория полёта: квадратичная кривая Безье, контрольная точка сбоку от лица.
  //    Отодвигаем её, пока ни одна точка траектории не задевает лицо.
  const flight = (to: { x: number; y: number }) => {
    const p0 = { x: hands.x, y: hands.y };
    const at = (c: { x: number; y: number }, t: number) => ({
      x: (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * c.x + t ** 2 * to.x,
      y: (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * c.y + t ** 2 * to.y,
    });
    const widthAt = (t: number) => handsW + (SLOT_W - handsW) * t;
    const clear = (c: { x: number; y: number }) => {
      if (!face) return true;
      for (let t = 0; t <= 1.0001; t += 0.04) {
        const p = at(c, t);
        const w = widthAt(t);
        const r = { x: p.x - w / 2, y: p.y - (w * 1.5) / 2, w, h: w * 1.5 };
        if (intersects(r, face)) return false;
      }
      return true;
    };
    const straight = { x: (p0.x + to.x) / 2, y: (p0.y + to.y) / 2 - 160 };
    if (!face || clear(straight)) return straight;

    const roomLeft = face.x;
    const roomRight = FRAME_W - (face.x + face.w);
    const preferLeft =
      to.x < FRAME_W / 2 - 1 ||
      (Math.abs(to.x - FRAME_W / 2) < 1 && roomLeft >= roomRight);
    const sides = preferLeft ? [-1, 1] : [1, -1];
    const cy = face.y + face.h / 2;
    for (const side of sides) {
      for (let k = 0; k <= 900; k += 30) {
        const c = { x: side < 0 ? face.x - k : face.x + face.w + k, y: cy };
        if (clear(c)) return c;
      }
    }
    return { x: preferLeft ? -400 : FRAME_W + 400, y: cy };
  };

  return { face, panelTop, slotCenter, hands, captionBottom, flight, warnings };
};
