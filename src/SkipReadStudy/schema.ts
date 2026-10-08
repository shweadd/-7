import { z } from "zod";

export const COLUMNS = ["skip", "read", "study"] as const;
export type Column = (typeof COLUMNS)[number];

export const COLUMN_COLORS: Record<Column, string> = {
  skip: "#FF4D4D",
  read: "#FFD23F",
  study: "#39E508",
};

const caption = z.object({
  text: z.string(),
  startMs: z.number(),
  endMs: z.number(),
  timestampMs: z.number().nullable(),
  confidence: z.number().nullable(),
});

export const skipReadStudySchema = z.object({
  format: z.literal("skip-read-study"),
  // Путь к исходнику относительно public/
  video: z.string(),
  width: z.number(),
  height: z.number(),
  fps: z.number(),
  // Всё время — в секундах исходника. Ролик начинается с trimStartSec и заканчивается на endSec.
  trimStartSec: z.number().min(0),
  endSec: z.number(),
  music: z.string().nullable(),
  musicStartSec: z.number(),
  musicVolume: z.number().min(0).max(1),
  // Рамка лица в долях кадра исходника (находит scripts/detect-face.mjs). null — не найдено.
  face: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    })
    .nullable()
    .optional(),
  hands: z.object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().min(0.05).max(1),
  }),
  books: z.array(
    z.object({
      title: z.string(),
      cover: z.string().nullable(),
      column: z.enum(COLUMNS).nullable(),
      // Когда звучит название — обложка появляется в руках
      appearSec: z.number(),
      // Когда закончилось слово-вердикт — обложка улетает в колонку
      verdictSec: z.number(),
    }),
  ),
  captions: z.array(caption),
  zooms: z.array(z.object({ startSec: z.number(), endSec: z.number() })),
  locked: z.boolean().optional(),
});

export type SkipReadStudyProps = z.infer<typeof skipReadStudySchema>;
export type PlanBook = SkipReadStudyProps["books"][number];
