// Скачивает обложки книг в public/covers/<slug>.jpg (один раз, дальше берутся из кэша).
// Источники: Open Library, затем Google Books. Если сети нет — в ролике будет текстовая обложка.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const COVERS_DIR = path.join(process.cwd(), "public", "covers");

export const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/\$/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const coverFileFor = (title) => `covers/${slugify(title)}.jpg`;

const fetchWithTimeout = async (url, ms = 8000) => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
};

const fromOpenLibrary = async ({ title, author }) => {
  const q = new URLSearchParams({ title, limit: "5", fields: "cover_i,title" });
  if (author) q.set("author", author);
  const res = await fetchWithTimeout(
    `https://openlibrary.org/search.json?${q}`,
  );
  if (!res.ok) return null;
  const json = await res.json();
  const doc = json.docs?.find((d) => d.cover_i);
  return doc
    ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
    : null;
};

const fromGoogleBooks = async ({ title, author }) => {
  const q = `intitle:${title}${author ? ` inauthor:${author}` : ""}`;
  const res = await fetchWithTimeout(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=5`,
  );
  if (!res.ok) return null;
  const json = await res.json();
  const links = json.items?.map((i) => i.volumeInfo?.imageLinks).find(Boolean);
  const url = links?.thumbnail ?? links?.smallThumbnail;
  return url
    ? url.replace("http://", "https://").replace("&edge=curl", "") +
        "&fife=w600"
    : null;
};

/** Возвращает путь (относительно public/) к обложке или null. */
export const ensureCover = async (book) => {
  const rel = book.cover ?? coverFileFor(book.title);
  const abs = path.join(process.cwd(), "public", rel);
  if (existsSync(abs)) return rel;
  if (book.cover) return null; // явно указанный файл отсутствует

  for (const source of [fromOpenLibrary, fromGoogleBooks]) {
    try {
      const url = await source(book);
      if (!url) continue;
      const res = await fetchWithTimeout(url);
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 2000) continue; // заглушка «нет обложки»
      mkdirSync(path.dirname(abs), { recursive: true });
      writeFileSync(abs, buf);
      return rel;
    } catch {
      // сеть недоступна или таймаут — пробуем следующий источник
    }
  }
  return null;
};

// Запуск напрямую: node scripts/fetch-covers.mjs — докачать обложки для всех книг из списка.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { readFileSync } = await import("node:fs");
  const { books } = JSON.parse(
    readFileSync(
      path.join(process.cwd(), "formats/skip-read-study/books.json"),
      "utf8",
    ),
  );
  for (const book of books) {
    const rel = await ensureCover(book);
    console.log(
      `${rel ? "✓" : "✗"} ${book.title}${rel ? ` → public/${rel}` : ""}`,
    );
  }
}
