// Строит монтажный план формата SKIP / READ / STUDY из пословной транскрибации.
// План — обычный JSON, его можно поправить руками и перерендерить без повторной транскрибации.

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "of",
  "by",
  "to",
  "about",
  "with",
]);

const VERDICTS = {
  skip: ["skip", "skipped", "skipping", "skips"],
  read: ["read", "reading", "reads"],
  study: ["study", "studying", "studied", "studies"],
};

// Ответ длиннее стольких слов (не считая вердикта) получает субтитры.
const LONG_ANSWER_WORDS = 4;
// Вердикт должен прозвучать не позже чем через столько секунд после названия.
const MAX_VERDICT_DELAY_SEC = 8;
// Слова «про себя» — с них начинается наезд камеры.
const PERSONAL_WORDS = new Set([
  "i",
  "im",
  "ive",
  "id",
  "ill",
  "my",
  "me",
  "mine",
]);

export const normalizeTokens = (text) =>
  text
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/\$/g, " ")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

const levenshtein = (a, b) => {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(
        dp[j] + 1,
        dp[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      prev = tmp;
    }
  }
  return dp[b.length];
};

const tokenMatches = (word, key) => {
  if (word === key) return true;
  if (key.length < 4 || word.length < 3) return false;
  return 1 - levenshtein(word, key) / Math.max(word.length, key.length) >= 0.75;
};

const keyTokens = (phrase) =>
  normalizeTokens(phrase).filter((t) => !STOPWORDS.has(t));

// words: [{token, captionIndex}] — нормализованные слова транскрибации без стоп-слов.
const matchAt = (words, i, keys) => {
  if (!tokenMatches(words[i].token, keys[0])) return null;
  let k = 1;
  let j = i + 1;
  let misses = 0;
  while (k < keys.length && j < words.length && misses <= 1) {
    if (tokenMatches(words[j].token, keys[k])) {
      k++;
    } else {
      misses++;
    }
    j++;
  }
  const needed = keys.length <= 2 ? keys.length : Math.ceil(keys.length * 0.75);
  return k >= needed ? { matched: k, end: j - 1 } : null;
};

const verdictOf = (token) =>
  Object.entries(VERDICTS).find(([, forms]) => forms.includes(token))?.[0] ??
  null;

/**
 * @param {import("@remotion/captions").Caption[]} captions пословная транскрибация
 * @param {{title: string, aliases?: string[], cover?: string|null}[]} books
 */
export const buildPlan = ({
  captions,
  books,
  video,
  durationSec,
  width,
  height,
  fps,
  music,
}) => {
  const words = [];
  captions.forEach((c, captionIndex) => {
    for (const token of normalizeTokens(c.text)) {
      if (!STOPWORDS.has(token)) words.push({ token, captionIndex });
    }
  });

  const candidates = books.map((book) => ({
    book,
    variants: [book.title, ...(book.aliases ?? [])]
      .map(keyTokens)
      .filter((k) => k.length > 0),
  }));

  const sec = (ms) => Math.round(ms) / 1000;
  const used = new Set();
  const found = [];
  const warnings = [];

  for (let i = 0; i < words.length; i++) {
    let best = null;
    for (const cand of candidates) {
      if (used.has(cand.book.title)) continue;
      for (const keys of cand.variants) {
        const m = matchAt(words, i, keys);
        if (m && (!best || m.matched > best.matched)) best = { ...m, cand };
      }
    }
    if (!best) continue;

    const nameStart = captions[words[i].captionIndex];
    const nameEnd = captions[words[best.end].captionIndex];

    // Ищем вердикт сразу после названия.
    let verdict = null;
    for (let j = best.end + 1; j < words.length; j++) {
      const c = captions[words[j].captionIndex];
      if (c.startMs - nameEnd.endMs > MAX_VERDICT_DELAY_SEC * 1000) break;
      const v = verdictOf(words[j].token);
      if (v) {
        verdict = {
          column: v,
          captionIndex: words[j].captionIndex,
          wordIndex: j,
        };
        break;
      }
    }

    // Однословные названия («Principles», «Influence») принимаем, только если сразу есть вердикт —
    // иначе это, скорее всего, слово из чужого ответа.
    if (!verdict && best.cand.variants.every((k) => k.length === 1)) continue;

    used.add(best.cand.book.title);
    found.push({
      book: best.cand.book,
      nameStart,
      nameEnd,
      nameEndWord: best.end,
      verdict,
    });
    i = verdict ? verdict.wordIndex : best.end;
  }

  const lastCaption = captions[captions.length - 1];
  const trimStartSec = found.length
    ? Math.max(0, sec(found[0].nameStart.startMs) - 0.15)
    : 0;
  const endSec = Math.min(
    durationSec,
    lastCaption ? sec(lastCaption.endMs) + 0.6 : durationSec,
  );

  const planBooks = [];
  const subtitleCaptions = [];
  const zooms = [];

  found.forEach((f, idx) => {
    const next = found[idx + 1];
    const answerEndMs = next ? next.nameStart.startMs : endSec * 1000;
    if (!f.verdict) {
      warnings.push(
        `«${f.book.title}»: не нашёл SKIP/READ/STUDY после названия — впиши column в план руками`,
      );
    }
    const verdictCaption = f.verdict
      ? captions[f.verdict.captionIndex]
      : f.nameEnd;

    planBooks.push({
      title: f.book.title,
      cover: f.book.cover ?? null,
      column: f.verdict?.column ?? null,
      appearSec: sec(f.nameStart.startMs),
      verdictSec: sec(verdictCaption.endMs),
    });

    // Ответ = от вердикта до следующей книги.
    const answer = captions.filter(
      (c) => c.startMs >= verdictCaption.startMs && c.startMs < answerEndMs,
    );
    const answerWords = answer.flatMap((c) => normalizeTokens(c.text));
    if (answerWords.length - 1 >= LONG_ANSWER_WORDS) {
      // Само слово-вердикт не субтитруем: в этот момент книга ещё в руках, а вердикт видно по колонке.
      subtitleCaptions.push(...answer.slice(1));
      const personalIdx = answer.findIndex((c) =>
        normalizeTokens(c.text).some((t) => PERSONAL_WORDS.has(t)),
      );
      if (personalIdx !== -1) {
        zooms.push({
          startSec: sec(answer[personalIdx].startMs),
          endSec: sec(answer[answer.length - 1].endMs),
        });
      }
    }
  });

  if (found.length === 0) {
    warnings.push(
      "Не нашёл ни одной книги из списка — проверь books.json и captions.json",
    );
  }

  return {
    plan: {
      format: "skip-read-study",
      video,
      width,
      height,
      fps,
      trimStartSec,
      endSec,
      music: music ?? null,
      musicStartSec: 1,
      musicVolume: 0.15,
      // Где у Алекса руки: доли кадра (0..1). Подстрой один раз под ракурс съёмки.
      hands: { x: 0.5, y: 0.7, width: 0.3 },
      books: planBooks,
      captions: subtitleCaptions,
      zooms,
    },
    warnings,
  };
};
