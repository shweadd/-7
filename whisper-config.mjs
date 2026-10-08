import os from "node:os";
import path from "node:path";

// Where to install Whisper.cpp to.
// Общий кэш в домашней папке: Whisper.cpp и модели качаются один раз на компьютер,
// а не заново в каждый клон проекта. Переопределяется переменной REELS_WHISPER_PATH.
export const WHISPER_PATH =
  process.env.REELS_WHISPER_PATH ??
  path.join(os.homedir(), ".cache", "reels-whisper", "whisper.cpp");

// Сколько потоков CPU отдать Whisper (по умолчанию whisper.cpp берёт только 4).
export const WHISPER_THREADS = Math.max(
  1,
  Math.min(8, os.availableParallelism?.() ?? os.cpus().length),
);

// The version of Whisper.cpp to install
export const WHISPER_VERSION = "1.6.0";

// Which model to use.
// | Model            | Disk   | Mem      |
// |------------------|--------|----------|
// | tiny             | 75 MB  | ~390 MB  |
// | tiny.en          | 75 MB  | ~390 MB  |
// | base             | 142 MB | ~500 MB  |
// | base.en          | 142 MB | ~500 MB  |
// | small            | 466 MB | ~1.0 GB  |
// | small.en         | 466 MB | ~1.0 GB  |
// | medium           | 1.5 GB | ~2.6 GB  |
// | medium.en        | 1.5 GB | ~2.6 GB  |
// | large-v1         | 2.9 GB | ~4.7 GB  |
// | large-v2         | 2.9 GB | ~4.7 GB  |
// | large-v3         | 2.9 GB | ~4.7 GB  |
// | large-v3-turbo   | 1.5 GB | ~4.7 GB  | // Only supported from Whisper.cpp 1.7.2 and higher
// | large            | 2.9 GB | ~4.7 GB  |

/**
 * @type {import('@remotion/install-whisper-cpp').WhisperModel}
 */
export const WHISPER_MODEL = "medium";

// Language to transcribe
// If you set another language than 'en', remove .en from the WHISPER_MODEL
// List of languages: https://github.com/openai/whisper/blob/main/whisper/tokenizer.py
/**
 * @type {import('@remotion/install-whisper-cpp').Language}
 */
export const WHISPER_LANG = "ru";
