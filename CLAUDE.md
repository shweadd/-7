# reels-montage

Remotion-проект для монтажа вертикальных рилсов (1080×1920) с человеком в кадре и пословными субтитрами на русском.

- Ролик формата SKIP / READ / STUDY (книги, колонки) → скилл `skip-read-study`, команда `npm run reel -- <видео>`.
  Ничего не пиши с нуля, цель — ролик за ≤5 минут.
- Главное правило монтажа: книги/объекты и текст **не заходят на лицо** человека (см. `src/SkipReadStudy/layout.ts`).
- Перед любой работой с Remotion загружай скилл `remotion-best-practices` (роутер), для субтитров — `remotion-captions`,
  для нарезки/обрезки/склеек — `remotion-markup` (video-editing, silence-detection, cropping, transitions, sfx).
- Транскрибация: `node sub.mjs <файл>` → JSON с `Caption[]` рядом с видео. Конфиг — `whisper-config.mjs` (язык `ru`).
- Шрифт субтитров — Montserrat 900 из `public/fonts` (кириллица). Не возвращай `theboldfont.ttf`: в нём нет кириллицы.
- Проверка перед коммитом: `npm run lint`.
- Пользователь общается по-русски.
