// Один ролик SKIP / READ / STUDY одной командой:
//   npm run reel -- путь/к/видео.mp4 [--music=путь.mp3] [--plan-only] [--retranscribe]
// Шаги: копия исходника → транскрибация (кэш) → обложки (кэш) → plan.json → рендер в out/.
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  downloadWhisperModel,
  installWhisperCpp,
  toCaptions,
  transcribe,
} from "@remotion/install-whisper-cpp";
import {
  WHISPER_PATH,
  WHISPER_THREADS,
  WHISPER_VERSION,
} from "../whisper-config.mjs";
import { ensureCover, slugify } from "./fetch-covers.mjs";
import { detectFace } from "./detect-face.mjs";
import { buildPlan } from "./plan-skip-read-study.mjs";

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, "public");
const FORMAT_DIR = path.join(ROOT, "formats", "skip-read-study");

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) =>
  args
    .find((a) => a.startsWith(`--${name}=`))
    ?.split("=")
    .slice(1)
    .join("=");
const input = args.find((a) => !a.startsWith("--"));

if (!input) {
  console.error(
    "Использование: npm run reel -- путь/к/видео.mp4 [--music=трек.mp3] [--plan-only] [--retranscribe]",
  );
  process.exit(1);
}

const t0 = Date.now();
let tStep = t0;
const step = (label) => {
  const now = Date.now();
  console.log(`  ✓ ${label} (${((now - tStep) / 1000).toFixed(1)} с)`);
  tStep = now;
};

const npx = (cliArgs, opts = {}) =>
  execFileSync(process.platform === "win32" ? "npx.cmd" : "npx", cliArgs, {
    shell: process.platform === "win32",
    ...opts,
  });

// 1. Исходник — в public/reels/<slug>/
const inputAbs = path.resolve(input);
if (!existsSync(inputAbs)) {
  console.error(`Файл не найден: ${inputAbs}`);
  process.exit(1);
}
const slug = slugify(path.basename(inputAbs, path.extname(inputAbs))) || "reel";
const reelDir = path.join(PUBLIC, "reels", slug);
mkdirSync(reelDir, { recursive: true });
const sourceAbs = inputAbs.startsWith(PUBLIC + path.sep)
  ? inputAbs
  : path.join(reelDir, `source${path.extname(inputAbs).toLowerCase()}`);
if (sourceAbs !== inputAbs) copyFileSync(inputAbs, sourceAbs);
const videoRel = path.relative(PUBLIC, sourceAbs).split(path.sep).join("/");
console.log(`\n▶ ${slug}`);

const probe = JSON.parse(
  npx(
    [
      "remotion",
      "ffprobe",
      "-v",
      "error",
      "-print_format",
      "json",
      "-show_streams",
      "-show_format",
      sourceAbs,
    ],
    {
      encoding: "utf8",
    },
  ),
);
const vStream = probe.streams.find((s) => s.codec_type === "video");
const durationSec = Number(probe.format.duration);
const rotation = Math.abs(
  Number(
    vStream.side_data_list?.find((d) => d.rotation !== undefined)?.rotation ??
      0,
  ),
);
const [srcW, srcH] =
  rotation === 90
    ? [vStream.height, vStream.width]
    : [vStream.width, vStream.height];
const [num, den] = String(vStream.avg_frame_rate || "30/1")
  .split("/")
  .map(Number);
const srcFps = Math.round(num / (den || 1)) || 30;
// Рендерим всегда в 30 fps: для Reels хватает, а 60 fps рендерится вдвое дольше.
const fps = Math.min(30, srcFps);
step(`исходник ${srcW}×${srcH}, ${durationSec.toFixed(1)} с, ${srcFps} fps`);

// 2. Транскрибация (один раз на ролик; Whisper и модель — один раз на компьютер)
const formatConfig = JSON.parse(
  readFileSync(path.join(FORMAT_DIR, "books.json"), "utf8"),
);
const { model, language } = formatConfig.whisper;
const captionsPath = path.join(reelDir, "captions.json");
if (!existsSync(captionsPath) || flag("retranscribe")) {
  await installWhisperCpp({
    to: WHISPER_PATH,
    version: WHISPER_VERSION,
    printOutput: false,
  });
  await downloadWhisperModel({
    folder: WHISPER_PATH,
    model,
    printOutput: false,
  });
  step(
    `Whisper.cpp ${WHISPER_VERSION} + модель ${model} готовы (${WHISPER_PATH})`,
  );

  const wav = path.join(os.tmpdir(), `reel-${slug}-${Date.now()}.wav`);
  npx(
    [
      "remotion",
      "ffmpeg",
      "-loglevel",
      "error",
      "-y",
      "-i",
      sourceAbs,
      "-vn",
      "-ar",
      "16000",
      "-ac",
      "1",
      wav,
    ],
    {
      stdio: ["ignore", "inherit", "inherit"],
    },
  );
  try {
    const out = await transcribe({
      inputPath: wav,
      model,
      language,
      whisperPath: WHISPER_PATH,
      whisperCppVersion: WHISPER_VERSION,
      tokenLevelTimestamps: true,
      splitOnWord: true,
      printOutput: false,
      additionalArgs: ["-t", String(WHISPER_THREADS)],
    });
    const { captions } = toCaptions({ whisperCppOutput: out });
    writeFileSync(captionsPath, JSON.stringify(captions, null, 2));
  } finally {
    rmSync(wav, { force: true });
  }
  step(`транскрибация (${WHISPER_THREADS} потоков)`);
} else {
  step(
    "транскрибация уже есть — беру captions.json (--retranscribe чтобы пересчитать)",
  );
}
const captions = JSON.parse(readFileSync(captionsPath, "utf8"));

// 3. Где лицо — чтобы обложки, полёт и субтитры его не перекрывали (кэш в face.json)
const facePath = path.join(reelDir, "face.json");
let face = null;
if (existsSync(facePath) && !flag("retranscribe")) {
  face = JSON.parse(readFileSync(facePath, "utf8"));
} else {
  face = await detectFace({ sourceAbs, srcW, srcH, durationSec });
  writeFileSync(facePath, JSON.stringify(face, null, 2));
}
step(
  face
    ? `лицо: ${Math.round(face.y * 100)}–${Math.round((face.y + face.height) * 100)}% высоты кадра`
    : "лицо не найдено — раскладка по умолчанию (проверь превью!)",
);

// 4. Музыка (необязательно): --music=файл или первый трек из public/music/
let music = null;
const musicArg = option("music");
if (musicArg) {
  const abs = path.resolve(musicArg);
  const dest = abs.startsWith(PUBLIC + path.sep)
    ? abs
    : path.join(PUBLIC, "music", path.basename(abs));
  if (dest !== abs) {
    mkdirSync(path.dirname(dest), { recursive: true });
    copyFileSync(abs, dest);
  }
  music = path.relative(PUBLIC, dest).split(path.sep).join("/");
} else if (existsSync(path.join(PUBLIC, "music"))) {
  const track = readdirSync(path.join(PUBLIC, "music")).find((f) =>
    /\.(mp3|m4a|wav|aac|ogg)$/i.test(f),
  );
  if (track) music = `music/${track}`;
}

// 5. План + обложки
const { plan, warnings } = buildPlan({
  captions,
  books: formatConfig.books,
  video: videoRel,
  durationSec,
  width: srcW,
  height: srcH,
  fps,
  music,
});
plan.face = face;
const byTitle = new Map(formatConfig.books.map((b) => [b.title, b]));
await Promise.all(
  plan.books.map(async (b) => {
    b.cover = await ensureCover(byTitle.get(b.title));
  }),
);

const planPath = path.join(reelDir, "plan.json");
const prevPlan = existsSync(planPath)
  ? JSON.parse(readFileSync(planPath, "utf8"))
  : null;
if (prevPlan?.locked) {
  console.log(
    '  • plan.json помечен "locked": true — не перезаписываю, рендерю как есть',
  );
} else {
  // Ракурс («где руки») переносим из прошлого плана этого ролика, если его подстраивали.
  if (prevPlan?.hands) plan.hands = prevPlan.hands;
  writeFileSync(planPath, JSON.stringify(plan, null, 2));
}
step(
  `план: ${plan.books.length} книг, субтитры на ${plan.captions.length} слов, наездов: ${plan.zooms.length}`,
);

for (const b of plan.books) {
  const col = (b.column ?? "???").toUpperCase().padEnd(5);
  console.log(
    `     ${b.appearSec.toFixed(1).padStart(5)} с  ${col}  ${b.title}${b.cover ? "" : "  (без обложки)"}`,
  );
}
for (const w of warnings) console.log(`  ⚠ ${w}`);

const planRel = path.relative(ROOT, planPath);
if (flag("plan-only")) {
  console.log(`\nПревью и правки: npx remotion studio --props=${planRel}`);
  process.exit(0);
}

// 6. Рендер
mkdirSync(path.join(ROOT, "out"), { recursive: true });
const outFile = path.join("out", `${slug}.mp4`);
npx(
  [
    "remotion",
    "render",
    "SkipReadStudy",
    outFile,
    `--props=${planRel}`,
    "--concurrency=100%",
    "--x264-preset=veryfast",
    "--crf=20",
    "--log=error",
    ...(process.env.REELS_RENDER_ARGS
      ? process.env.REELS_RENDER_ARGS.split(" ")
      : []),
  ],
  { stdio: "inherit" },
);
step("рендер");
console.log(
  `\n✔ Готово за ${((Date.now() - t0) / 1000).toFixed(0)} с → ${outFile}`,
);
console.log(
  `  Поправить: ${planRel} (или npx remotion studio --props=${planRel}), затем npm run reel -- ${input}`,
);
