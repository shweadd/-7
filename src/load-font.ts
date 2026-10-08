import { continueRender, delayRender, staticFile } from "remotion";

// Montserrat Black: в отличие от TheBoldFont из шаблона, есть кириллица.
export const TheBoldFont = `Montserrat`;

let loaded = false;

const faces = [
  {
    file: "fonts/montserrat-latin-900-normal.woff2",
    unicodeRange:
      "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
  },
  {
    file: "fonts/montserrat-cyrillic-900-normal.woff2",
    unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116",
  },
];

export const loadFont = async (): Promise<void> => {
  if (loaded) {
    return Promise.resolve();
  }

  const waitForFont = delayRender();

  loaded = true;

  await Promise.all(
    faces.map(async ({ file, unicodeRange }) => {
      const font = new FontFace(
        TheBoldFont,
        `url('${staticFile(file)}') format('woff2')`,
        { weight: "900", unicodeRange },
      );
      await font.load();
      document.fonts.add(font);
    }),
  );

  continueRender(waitForFont);
};
