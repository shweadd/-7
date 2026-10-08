// Находит, где в кадре лицо, чтобы обложки, полёт и субтитры его не перекрывали.
// Берёт несколько кадров по всему ролику и объединяет найденные рамки лица.
// Модель (SSD MobileNet) лежит внутри npm-пакета @vladmandic/face-api — ничего не скачивается.
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

const SAMPLE_FRAMES = 10;
const ANALYZE_W = 480;

/**
 * @returns {Promise<{x:number,y:number,width:number,height:number}|null>} рамка лица в долях
 *   кадра исходника (0..1, после поворота), или null, если лицо не найдено.
 */
export const detectFace = async ({ sourceAbs, srcW, srcH, durationSec }) => {
  const tf = require("@tensorflow/tfjs");
  const wasm = require("@tensorflow/tfjs-backend-wasm");
  wasm.setWasmPaths(
    path.dirname(
      require.resolve("@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm.wasm"),
    ) + path.sep,
  );
  await tf.setBackend("wasm");
  await tf.ready();
  const faceapi = require("@vladmandic/face-api/dist/face-api.node-wasm.js");
  const modelDir = path.join(
    path.dirname(require.resolve("@vladmandic/face-api/package.json")),
    "model",
  );
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelDir);

  const w = ANALYZE_W;
  const h = Math.round((ANALYZE_W * srcH) / srcW / 2) * 2;
  const raw = execFileSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    [
      "remotion",
      "ffmpeg",
      "-loglevel",
      "error",
      "-i",
      sourceAbs,
      // в ffmpeg из Remotion нет фильтра fps — прореживаем кадры выходным -r
      "-vf",
      `scale=${w}:${h}`,
      "-r",
      String(SAMPLE_FRAMES / Math.max(1, durationSec)),
      "-frames:v",
      String(SAMPLE_FRAMES),
      // в ffmpeg из Remotion нет muxer'а rawvideo, но image2pipe + кодек rawvideo даёт то же самое
      "-f",
      "image2pipe",
      "-c:v",
      "rawvideo",
      "-pix_fmt",
      "rgb24",
      "-",
    ],
    { maxBuffer: 1024 * 1024 * 200, shell: process.platform === "win32" },
  );

  const frameSize = w * h * 3;
  const boxes = [];
  for (let off = 0; off + frameSize <= raw.length; off += frameSize) {
    const tensor = tf.tensor3d(
      new Uint8Array(raw.buffer, raw.byteOffset + off, frameSize),
      [h, w, 3],
    );
    const detections = await faceapi.detectAllFaces(
      tensor,
      new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }),
    );
    tensor.dispose();
    // Берём самое крупное лицо в кадре — это говорящий.
    const best = detections.sort((a, b) => b.box.area - a.box.area)[0];
    if (best) boxes.push(best.box);
  }
  if (boxes.length === 0) return null;

  // Объединяем рамки со всех кадров: человек немного двигается.
  const x1 = Math.min(...boxes.map((b) => b.x));
  const y1 = Math.min(...boxes.map((b) => b.y));
  const x2 = Math.max(...boxes.map((b) => b.x + b.width));
  const y2 = Math.max(...boxes.map((b) => b.y + b.height));
  // Детектор даёт рамку от бровей до подбородка — добавляем лоб и волосы сверху.
  const top = Math.max(0, y1 - (y2 - y1) * 0.35);
  return {
    x: x1 / w,
    y: top / h,
    width: (x2 - x1) / w,
    height: (y2 - top) / h,
  };
};
