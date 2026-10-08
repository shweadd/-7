# reels-montage

Монтаж вертикальных рилсов (Instagram Reels, 1080×1920) с человеком в кадре на [Remotion](https://www.remotion.dev).
Основа — официальный шаблон `npx create-video@latest --tiktok`: видео + анимированные пословные субтитры, которые
генерируются локальной транскрибацией [Whisper.cpp](https://github.com/ggerganov/whisper.cpp).

Что изменено относительно шаблона:

- Транскрибация настроена на **русский**: `whisper-config.mjs` → модель `medium` (мультиязычная), язык `ru`.
- Шрифт субтитров заменён на **Montserrat Black** (`public/fonts`, лицензия OFL) — в шрифте шаблона нет кириллицы.
- В `.claude/skills` лежат официальные скиллы Remotion для Claude Code (`npx skills add remotion-dev/skills`),
  оставлены только нужные для монтажа: best-practices, captions, markup, multimedia, render, studio, docs, create, upgrade.

## Быстрый старт

Нужны Node.js 18+ и ~3 ГБ свободного места (Whisper + модель).

```console
npm i
```

1. Положи исходники (говорящая голова) в `public/` — `mp4`, `mov`, `mkv` или `webm`.
2. Сделай субтитры (первый запуск сам скачает и соберёт Whisper.cpp и модель ~1.5 ГБ):

   ```console
   npm run create-subtitles                 # все видео в public/
   node sub.mjs public/my-reel.mp4          # одно видео
   ```

   Рядом с видео появится `my-reel.json` — его можно поправить руками (опечатки, лишние слова).
3. Превью и правки: `npm run dev` → Remotion Studio, композиция `CaptionedVideo`, в пропсах укажи свой файл.
4. Рендер:

   ```console
   npx remotion render CaptionedVideo out/my-reel.mp4 --props='{"src":"my-reel.mp4"}'
   ```

## Где запускать транскрибацию

Whisper.cpp работает на любой машине с Node.js — на своём компе **или** в облачной сессии Claude Code.
В облаке ей нужен доступ в сеть к `huggingface.co` (модели) и `github.com` (исходники whisper.cpp).
На CPU транскрибация `medium` идёт примерно в реальном времени или медленнее; для скорости можно взять `small`,
для качества — `large-v3-turbo` (нужно поднять `WHISPER_VERSION` до `1.7.2+`).

## Настройка модели

`whisper-config.mjs`:

| Модель   | Размер | Для русского                   |
|----------|--------|--------------------------------|
| `small`  | 466 МБ | быстро, ошибки в терминах      |
| `medium` | 1.5 ГБ | по умолчанию, хороший баланс   |
| `large-v3-turbo` | 1.5 ГБ | лучше, нужен Whisper.cpp ≥ 1.7.2 |

Модели с суффиксом `.en` — только английские, для русского не подходят.

## Лицензия Remotion

Remotion бесплатен для физлиц и команд до 3 человек, дальше — [платная лицензия](https://www.remotion.pro/license).
