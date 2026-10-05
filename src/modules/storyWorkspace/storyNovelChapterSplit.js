/**
 * Split a novel into chapters.
 *
 * storyScriptImport's parser looks for episode markers (第 N 集/话/回), so a novel written with
 * 第 N 章 headings produced exactly one "chapter" covering the whole book — which is why an
 * imported novel always arrived as a single episode. Novels need their own splitter.
 */

// 第 12 章 / 第十二回 / 第3节 … plus the usual opening and closing sections.
const CHAPTER_HEADING_PATTERN =
  /^[\s\u3000]*(?:第[\s\u3000]*[0-9０-９零〇一二三四五六七八九十百千两]+[\s\u3000]*[章回节卷篇][\s\u3000:：.、\-—]*(.*))$/u;
const SPECIAL_HEADING_PATTERN = /^[\s\u3000]*(序章|序言|楔子|引子|前言|尾声|后记|终章|番外)[\s\u3000:：.、\-—]*(.*)$/u;
const LATIN_HEADING_PATTERN = /^[\s\u3000]*(?:chapter|part)[\s\u3000]*[0-9]+\b(.*)$/iu;

// Used only when the text has no recognisable headings at all.
export const FALLBACK_CHAPTER_CHARACTERS = 3000; // 3000

// A heading line must be short. Without this the pattern also matches body text that happens to
// start with 第N章 (a paragraph beginning "第1章正文。…" was treated as a heading, which left
// every chapter with an empty body and produced zero chapters overall). Real chapter headings
// are a handful of characters; body paragraphs are not.
export const NOVEL_HEADING_MAX_CHARACTERS = 40; // 40

function normalizeText(value) {
  return String(value ?? '').trim();
}

function headingTitle(line, maxCharacters = NOVEL_HEADING_MAX_CHARACTERS) {
  const value = normalizeText(line);
  if (!value) return null;
  if (value.length > maxCharacters) return null;
  const latin = LATIN_HEADING_PATTERN.exec(value);
  if (latin) return value;
  const chapter = CHAPTER_HEADING_PATTERN.exec(value);
  if (chapter) return value;
  const special = SPECIAL_HEADING_PATTERN.exec(value);
  if (special) return value;
  return null;
}

function pushChapter(chapters, title, lines) {
  const content = lines.join('\n').trim();
  if (!content) return;
  chapters.push({ title: normalizeText(title) || '第 ' + (chapters.length + 1) + ' 节', content: content });
}

/**
 * Fallback for text without headings: group paragraphs up to a comfortable size so the chapter
 * list still gives the user something to tick.
 */
function splitByParagraphGroups(text, limit = FALLBACK_CHAPTER_CHARACTERS) {
  const paragraphs = String(text ?? '')
    .split(/\n\s*\n/u)
    .map((part) => part.trim())
    .filter(Boolean);
  const chapters = [];
  let buffer = [];
  let size = 0;
  for (const paragraph of paragraphs) {
    const pieces = paragraph.length > limit ? [paragraph] : [paragraph];
    for (const piece of pieces) {
      if (buffer.length && size + piece.length > limit) {
        pushChapter(chapters, '', buffer);
        buffer = [];
        size = 0;
      }
      buffer.push(piece);
      size += piece.length;
    }
  }
  pushChapter(chapters, '', buffer);
  return chapters;
}

/**
 * @returns {Array<{ title: string, content: string, characters: number, splitFrom: 'heading'|'fallback' }>}
 */
export function splitNovelChapters(
  text,
  { fallbackCharacters = FALLBACK_CHAPTER_CHARACTERS, headingMaxCharacters = NOVEL_HEADING_MAX_CHARACTERS } = {},
) {
  const source = String(text ?? '');
  if (!normalizeText(source)) return [];

  const lines = source.split(/\r?\n/u);
  const headings = [];
  lines.forEach((line, index) => {
    const title = headingTitle(line, headingMaxCharacters);
    if (title) headings.push({ index: index, title: title });
  });

  const chapters = [];
  let splitFrom = 'heading';
  if (!headings.length) {
    splitFrom = 'fallback';
    for (const chapter of splitByParagraphGroups(source, fallbackCharacters)) chapters.push(chapter);
  } else {
    // Text before the first heading becomes its own opening chapter.
    const preamble = lines.slice(0, headings[0].index).join('\n').trim();
    if (preamble) pushChapter(chapters, '正文开头', preamble.split('\n'));
    headings.forEach((heading, position) => {
      const end = position + 1 < headings.length ? headings[position + 1].index : lines.length;
      pushChapter(chapters, heading.title, lines.slice(heading.index + 1, end));
    });
  }

  return chapters.map((chapter) => ({
    title: chapter.title,
    content: chapter.content,
    characters: chapter.content.length,
    splitFrom: splitFrom,
  }));
}
