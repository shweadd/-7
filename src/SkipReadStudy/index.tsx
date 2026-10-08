import { createTikTokStyleCaptions } from "@remotion/captions";
import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  Easing,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import SubtitlePage from "../CaptionedVideo/SubtitlePage";
import { loadFont } from "../load-font";
import { ColumnsHeader } from "./ColumnsHeader";
import { FlyingBook, handsBusy, landingFrame } from "./FlyingBook";
import {
  computeLayout,
  FRAME_H,
  FRAME_W,
  ZOOM_ORIGIN_Y,
  ZOOM_SCALE,
} from "./layout";
import { SkipReadStudyProps } from "./schema";

loadFont();

const SWITCH_CAPTIONS_EVERY_MS = 1200;
const ZOOM_IN_SEC = 0.6;
const ZOOM_OUT_SEC = 0.35;

export const calculateSkipReadStudyMetadata: CalculateMetadataFunction<
  SkipReadStudyProps
> = ({ props }) => ({
  fps: props.fps,
  width: FRAME_W,
  height: FRAME_H,
  durationInFrames: Math.max(
    1,
    Math.round((props.endSec - props.trimStartSec) * props.fps),
  ),
});

const useZoom = (zooms: SkipReadStudyProps["zooms"], trimStartSec: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps + trimStartSec;
  let scale = 1;
  for (const z of zooms) {
    if (t < z.startSec || t > z.endSec + ZOOM_OUT_SEC) continue;
    const zin = interpolate(t, [z.startSec, z.startSec + ZOOM_IN_SEC], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
    const zout = interpolate(t, [z.endSec, z.endSec + ZOOM_OUT_SEC], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    });
    scale = Math.max(scale, 1 + (ZOOM_SCALE - 1) * Math.min(zin, zout));
  }
  return scale;
};

export const SkipReadStudy: React.FC<SkipReadStudyProps> = (props) => {
  const {
    video,
    trimStartSec,
    books,
    captions,
    zooms,
    music,
    musicStartSec,
    musicVolume,
  } = props;
  const { fps, durationInFrames } = useVideoConfig();
  const zoom = useZoom(zooms, trimStartSec);
  const layout = useMemo(() => computeLayout(props), [props]);

  // Номер слота каждой книги в своей колонке — по порядку появления.
  const ordered = useMemo(() => {
    const counters: Record<string, number> = {};
    return [...books]
      .sort((a, b) => a.appearSec - b.appearSec)
      .map((book) => {
        const slotIndex = book.column
          ? (counters[book.column] = (counters[book.column] ?? -1) + 1)
          : 0;
        return { book, slotIndex };
      });
  }, [books]);

  const landings = useMemo(
    () =>
      ordered
        .filter(({ book }) => book.column !== null)
        .map(({ book }) => ({
          column: book.column!,
          frame: landingFrame(book, trimStartSec, fps),
        })),
    [ordered, trimStartSec, fps],
  );

  // Субтитры только для длинных ответов (их отбирает планировщик); время сдвигаем на trimStart.
  const pages = useMemo(() => {
    const shift = trimStartSec * 1000;
    return createTikTokStyleCaptions({
      combineTokensWithinMilliseconds: SWITCH_CAPTIONS_EVERY_MS,
      captions: captions.map((c) => ({
        ...c,
        startMs: c.startMs - shift,
        endMs: c.endMs - shift,
        timestampMs: c.timestampMs === null ? null : c.timestampMs - shift,
      })),
    }).pages;
  }, [captions, trimStartSec]);

  const musicFrom = Math.round(musicStartSec * fps);

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: `50% ${ZOOM_ORIGIN_Y * 100}%`,
        }}
      >
        <OffthreadVideo
          src={staticFile(video)}
          trimBefore={Math.round(trimStartSec * fps)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      <ColumnsHeader landings={landings} top={layout.panelTop} />

      {ordered.map(({ book, slotIndex }) => (
        <FlyingBook
          key={book.title}
          book={book}
          slotIndex={slotIndex}
          layout={layout}
          trimStartSec={trimStartSec}
        />
      ))}

      {pages.map((page, index) => {
        const nextPage = pages[index + 1] ?? null;
        const pageStart = Math.round((page.startMs / 1000) * fps);
        // Пока книга в руках — субтитр ждёт, потом показывается с правильной подсветкой слов.
        const busy = books
          .map((b) => handsBusy(b, trimStartSec, fps))
          .find((r) => pageStart >= r.from && pageStart < r.to);
        const from = busy ? busy.to : pageStart;
        const end = Math.min(
          nextPage ? Math.round((nextPage.startMs / 1000) * fps) : Infinity,
          Math.round(((page.startMs + page.durationMs) / 1000) * fps) +
            Math.round(0.3 * fps),
        );
        if (end - from <= 0 || from < 0) return null;
        return (
          <Sequence key={index} from={from} durationInFrames={end - from}>
            <Sequence from={pageStart - from} layout="none">
              <SubtitlePage page={page} bottom={layout.captionBottom} />
            </Sequence>
          </Sequence>
        );
      })}

      {music && durationInFrames > musicFrom ? (
        <Sequence from={musicFrom} layout="none">
          <Audio
            src={staticFile(music)}
            loop
            volume={(f) =>
              musicVolume *
              interpolate(
                f,
                [
                  0,
                  fps * 0.4,
                  durationInFrames - musicFrom - fps,
                  durationInFrames - musicFrom,
                ],
                [0, 1, 1, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              )
            }
          />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
