// Removes the last visible trace of the obfuscator from a source file.
//
// The identifier rename (tools/deobf-rename.mjs) restored readable names, but
// two artefacts survive in the ported files, because neither is an identifier:
//
//   1. every string literal is written with `\xNN` escapes
//          '\x22a\x22\x3a\x20b'        instead of        '"a": b'
//   2. every integer literal is written in hexadecimal
//          0x1388                      instead of        5000
//
// Both are rewritten to their plain form. Neither changes a value:
//
//   * a literal is only rewritten when the decoded character can be written
//     literally in that quoting context, so `\x22` becomes `"` in a
//     single-quoted string but stays `\"` in a double-quoted one;
//   * `\x0a` / `\x0d` / `\x09` become the named escapes `\n` / `\r` / `\t`;
//   * control characters without a named escape, lone surrogates and the
//     invisible separators (U+00A0, U+2028, U+2029, U+FEFF) keep their escape,
//     because writing them literally is unreadable or unsafe;
//   * a hexadecimal integer is rewritten to decimal unless the spelling reads
//     as a deliberate constant: a zero-padded form, a long non-round value
//     (file signatures, FNV bases), a repeated-nibble pattern or a bit mask.
//     Single nibbles are always rewritten — see decimalForm below.
//
//   node tools/deobf-unescape.mjs <file...>                 report only
//   node tools/deobf-unescape.mjs --write <file...>         rewrite escapes
//   node tools/deobf-unescape.mjs --write --numbers <file...>
//   node tools/deobf-unescape.mjs --table                   hex value table
//
// Verify every rewritten file afterwards with
// tools/deobf-unescape-verify.mjs, which proves with the shared lexer that the
// token stream is unchanged and every literal decodes to the same value.
//
// The regex literals are located with tools/deobf-lex.mjs rather than by a
// second copy of the "is this slash a division" heuristic — that rule lives in
// exactly one place. Everything else is done by the scanner below.
import fs from 'node:fs';
import { lex } from './deobf-lex.mjs';

// Escapes that are both shorter and clearer than a numeric form.
const NAMED_ESCAPES = new Map([
  [0x08, '\\b'],
  [0x09, '\\t'],
  [0x0a, '\\n'],
  [0x0b, '\\v'],
  [0x0c, '\\f'],
  [0x0d, '\\r'],
]);

// Characters that must keep an escape even though they are printable:
// they are invisible or line-terminating, so a literal copy would be either
// unreadable or a syntax error in some quoting contexts.
const KEEP_ESCAPED = new Set([0x00a0, 0x2028, 0x2029, 0xfeff]);

const HEX_NUMBER = /\b0x([0-9a-fA-F]+)\b/g;

// True when the hexadecimal spelling is the shape an author writes on purpose:
// a repeated nibble or a repeated block (`0xffff`, `0xaaaa`, `0xff00`,
// `0xf0f0`), or a run of set bits (`0x7f`, `0xff`, `0x3ff`). Those are bit
// patterns and masks — the hexadecimal spelling is the point, and `65280` or
// `127` would be strictly worse.
function looksLikeBitPattern(digits) {
  const lower = digits.toLowerCase();
  if (new Set(lower).size === 1) return true;
  for (const size of [1, 2, 3]) {
    if (lower.length % size !== 0 || lower.length / size < 2) continue;
    if (lower.slice(0, size).repeat(lower.length / size) === lower) return true;
  }
  return false;
}

function looksLikeMask(value) {
  return value >= 7 && (value & (value + 1)) === 0;
}

// Every hexadecimal integer the obfuscator produced is rewritten to decimal.
// The number itself is never the interesting part of an obfuscated literal; the
// spelling is. Only the cases that read as a deliberate hexadecimal constant
// keep their spelling:
//
//   * long and not round                     `0x811c9dc5` (FNV basis),
//                                            `0x7fffffff` (int max),
//                                            `0x06054b50` (a ZIP signature)
//   * zero padded                            `0x0002`, `0x0a`
//   * a bit pattern or a mask                `0xaaaa`, `0xff00`, `0xff`, `0x7f`
//
// The obfuscator rewrote *every* integer, so `0x3c` is far more likely to be a
// converted 60 than a deliberate hexadecimal constant named by an author who
// uses decimal everywhere else in the file. A long spelling that is still a
// round decimal (`0xf4240` = 1000000) is a converted literal, not a constant.
//
// A single nibble is never a deliberate spelling: no author writes `0x0` for
// zero, and the codebase settles the question on its own — the same array holds
// `[0.1, 0.2, 0.5, 0x1, 0x2, 0x5, 0xa, 0xf]` and the same option list holds
// `[0xf, 30]`, with `maxDurationSeconds: 0xf` meaning fifteen seconds. So the
// pattern and mask exemptions start at two digits, and `0x7` is rewritten to 7
// even though it would read as a mask on its own.
function decimalForm(value, digits) {
  if (digits.length > 4 && value % 1000 !== 0) return null;
  if (digits.length > 1 && digits[0] === '0') return null;
  if (digits.length > 1 && looksLikeBitPattern(digits)) return null;
  if (digits.length > 1 && looksLikeMask(value)) return null;
  return String(value);
}

function escapeFor(code) {
  return code <= 0xff
    ? '\\x' + code.toString(16).padStart(2, '0')
    : '\\u' + code.toString(16).padStart(4, '0');
}

// --- scanning -------------------------------------------------------------

// Locates the regex literals so the scanner below never mistakes a quote inside
// `/['"]/` for the start of a string. Only `regex` tokens are taken from the
// shared lexer; string and template spans are not usable for rewriting because
// a template with substitutions produces a final token spanning the whole
// template, including its `${…}` code.
function regexSpans(source) {
  const spans = [];
  for (const token of lex(source)) {
    if (token.kind !== 'regex') continue;
    const end = token.offset;
    const start = end - token.value.length;
    if (start >= 0 && end <= source.length && source[start] === '/') spans.push([start, end]);
  }
  spans.sort((a, b) => a[0] - b[0]);
  return spans;
}

function scan(source) {
  const regexes = regexSpans(source);
  // Spaces between literals (a template chunk, the code of a substitution) are
  // recorded separately: a number inside `\`${a ? 1 : 0}\`` is code and must be
  // rewritten, a number inside a chunk is text and must not be.
  const literals = [];
  const expressions = [];
  const comments = [];

  const regexAt = (index) => {
    for (const [start, end] of regexes) {
      if (index === start) return end;
      if (start > index) break;
    }
    return -1;
  };

  const skipString = (index) => {
    const quote = source[index];
    let i = index + 1;
    while (i < source.length) {
      if (source[i] === '\\') {
        i += 2;
        continue;
      }
      if (source[i] === quote) return i + 1;
      if (source[i] === '\n') return i;
      i += 1;
    }
    return i;
  };

  // Walks a template from its opening backtick, records every literal chunk and
  // recurses into the substitutions. Returns the index after the closing
  // backtick.
  const skipTemplate = (index) => {
    let i = index + 1;
    let chunkStart = i;
    while (i < source.length) {
      const char = source[i];
      if (char === '\\') {
        i += 2;
        continue;
      }
      if (char === '`') {
        literals.push({ start: chunkStart, end: i, quote: '`', leading: chunkStart === index + 1, trailing: true });
        return i + 1;
      }
      if (char === '$' && source[i + 1] === '{') {
        literals.push({ start: chunkStart, end: i, quote: '`', leading: chunkStart === index + 1, trailing: false });
        const after = skipExpression(i + 2);
        expressions.push([i + 2, after - 1]);
        i = after;
        chunkStart = i;
        continue;
      }
      i += 1;
    }
    literals.push({ start: chunkStart, end: i, quote: '`', leading: chunkStart === index + 1, trailing: true });
    return i;
  };

  // Walks the code of a `${…}` substitution up to its matching brace.
  //
  // `level` counts relative to the `{` this call was entered on, so it always
  // starts at 1. Nesting is expressed by recursion, never by a starting level:
  // a nested template inside a substitution re-enters here for its own `${…}`
  // with a fresh counter. Passing an absolute depth instead makes a nested
  // template wait for braces that never come and swallow the rest of the file.
  const skipExpression = (index) => {
    let i = index;
    let level = 1;
    while (i < source.length) {
      const char = source[i];
      const regexEnd = regexAt(i);
      if (regexEnd !== -1) {
        i = regexEnd;
        continue;
      }
      if (char === '/' && source[i + 1] === '/') {
        const start = i;
        while (i < source.length && source[i] !== '\n') i += 1;
        comments.push([start, i]);
        continue;
      }
      if (char === '/' && source[i + 1] === '*') {
        const start = i;
        i += 2;
        while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) i += 1;
        i = Math.min(i + 2, source.length);
        comments.push([start, i]);
        continue;
      }
      if (char === '"' || char === "'") {
        const start = i;
        const end = skipString(i);
        literals.push({ start: start + 1, end: end - 1, quote: char, leading: false, trailing: false });
        i = end;
        continue;
      }
      if (char === '`') {
        i = skipTemplate(i);
        continue;
      }
      if (char === '{') {
        level += 1;
        i += 1;
        continue;
      }
      if (char === '}') {
        level -= 1;
        i += 1;
        if (level === 0) return i;
        continue;
      }
      i += 1;
    }
    return i;
  };

  let i = 0;
  while (i < source.length) {
    const char = source[i];
    const regexEnd = regexAt(i);
    if (regexEnd !== -1) {
      i = regexEnd;
      continue;
    }
    if (char === '/' && source[i + 1] === '/') {
      const start = i;
      while (i < source.length && source[i] !== '\n') i += 1;
      comments.push([start, i]);
      continue;
    }
    if (char === '/' && source[i + 1] === '*') {
      const start = i;
      i += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) i += 1;
      i = Math.min(i + 2, source.length);
      comments.push([start, i]);
      continue;
    }
    if (char === '"' || char === "'") {
      const start = i;
      const end = skipString(i);
      literals.push({ start: start + 1, end: end - 1, quote: char, leading: false, trailing: false });
      i = end;
      continue;
    }
    if (char === '`') {
      i = skipTemplate(i);
      continue;
    }
    i += 1;
  }

  return { literals, expressions, comments };
}

// --- rewriting ------------------------------------------------------------

// Splits a literal body into raw text (kept verbatim) and decoded code points
// (re-emitted in the shortest safe spelling).
function splitBody(body) {
  const items = [];
  let plain = '';
  let i = 0;
  const flush = () => {
    if (plain) items.push({ raw: plain });
    plain = '';
  };
  while (i < body.length) {
    const char = body[i];
    if (char !== '\\') {
      plain += char;
      i += 1;
      continue;
    }
    const rest = body.slice(i);
    let match = /^\\x([0-9a-fA-F]{2})/.exec(rest);
    if (match) {
      flush();
      items.push({ code: parseInt(match[1], 16) });
      i += match[0].length;
      continue;
    }
    match = /^\\u\{([0-9a-fA-F]+)\}/.exec(rest);
    if (match) {
      const code = parseInt(match[1], 16);
      if (code <= 0x10ffff) {
        flush();
        items.push({ code });
        i += match[0].length;
        continue;
      }
    }
    match = /^\\u([0-9a-fA-F]{4})/.exec(rest);
    if (match) {
      flush();
      items.push({ code: parseInt(match[1], 16) });
      i += match[0].length;
      continue;
    }
    // `\n`, `\\`, `\'`, `\$`, a line continuation, an octal-like `\0`: left
    // exactly as found. They are already the plain spelling.
    plain += rest.slice(0, 2);
    i += Math.min(2, rest.length);
  }
  flush();
  return items;
}

function nextCharIsBrace(items, index) {
  const next = items[index + 1];
  if (!next) return false;
  if (next.code !== undefined) return next.code === 0x7b;
  return next.raw[0] === '{';
}

function emit(items, quote) {
  let out = '';
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (item.raw !== undefined) {
      out += item.raw;
      continue;
    }
    const code = item.code;
    // A lone surrogate written literally would corrupt the file; keep the escape.
    if (code >= 0xd800 && code <= 0xdfff) {
      out += escapeFor(code);
      continue;
    }
    if (code < 0x20 || code === 0x7f) {
      out += NAMED_ESCAPES.has(code) ? NAMED_ESCAPES.get(code) : escapeFor(code);
      continue;
    }
    if (KEEP_ESCAPED.has(code)) {
      out += escapeFor(code);
      continue;
    }
    const char = String.fromCodePoint(code);
    if (char === '\\') {
      out += '\\\\';
      continue;
    }
    if (quote === '`') {
      if (char === '`') out += '\\`';
      else if (char === '$' && nextCharIsBrace(items, index)) out += '\\$';
      else out += char;
      continue;
    }
    out += char === quote ? '\\' + quote : char;
  }
  return out;
}

function rewriteLiteral(source, literal) {
  const body = source.slice(literal.start, literal.end);
  if (!body.includes('\\')) return null;
  const items = splitBody(body);
  if (!items.some((item) => item.code !== undefined)) return null;
  const next = emit(items, literal.quote);
  if (next === body) return null;
  return { text: next, escapes: items.filter((item) => item.code !== undefined).length };
}

// --- entry point ----------------------------------------------------------

function insideAny(spans, index) {
  for (const [start, end] of spans) {
    if (index >= start && index < end) return true;
    if (start > index) break;
  }
  return false;
}

function rewriteSource(source, options) {
  const { literals, expressions, comments } = scan(source);
  const edits = [];
  let escapeCount = 0;

  for (const literal of literals) {
    const result = rewriteLiteral(source, literal);
    if (!result) continue;
    edits.push({ start: literal.start, end: literal.end, text: result.text });
    escapeCount += result.escapes;
  }

  let numberCount = 0;
  const changeTable = [];
  if (options.numbers) {
    const protectedSpans = [...comments];
    for (const literal of literals) {
      protectedSpans.push([literal.start - (literal.quote === '`' ? 1 : 1), literal.end]);
    }
    for (const [start, end] of expressions) protectedSpans.push([start, end]);
    for (const [start, end] of regexSpans(source)) protectedSpans.push([start, end]);
    protectedSpans.sort((a, b) => a[0] - b[0]);

    HEX_NUMBER.lastIndex = 0;
    let match;
    while ((match = HEX_NUMBER.exec(source)) !== null) {
      if (insideAny(protectedSpans, match.index)) continue;
      const hex = match[1];
      const value = parseInt(hex, 16);
      const decimal = decimalForm(value, hex);
      if (decimal === null) continue;
      edits.push({ start: match.index, end: match.index + match[0].length, text: decimal });
      changeTable.push({ hex: '0x' + hex, decimal, value });
      numberCount += 1;
    }
  }

  if (!edits.length) return { source, escapes: 0, numbers: 0, table: [] };

  // Apply from the end so earlier offsets stay valid.
  const ordered = [...edits].sort((a, b) => b.start - a.start);
  let out = source;
  let previousStart = Infinity;
  for (const edit of ordered) {
    if (edit.end > previousStart) {
      console.error('refusing to write: overlapping rewrite at offset ' + edit.start);
      return null;
    }
    previousStart = edit.start;
    out = out.slice(0, edit.start) + edit.text + out.slice(edit.end);
  }
  return { source: out, escapes: escapeCount, numbers: numberCount, table: changeTable };
}

function main() {
  const args = process.argv.slice(2);
  const write = args.includes('--write');
  const numbers = args.includes('--numbers');
  const table = args.includes('--table');
  const files = args.filter((arg) => !arg.startsWith('--'));

  if (table) {
    const seen = new Map();
    for (const file of files) {
      const result = rewriteSource(fs.readFileSync(file, 'utf8'), { numbers: true });
      if (result === null) process.exit(1);
      for (const entry of result.table) {
        seen.set(entry.hex, (seen.get(entry.hex) || 0) + 1);
      }
    }
    for (const [hex, count] of [...seen.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(hex.padEnd(10) + String(parseInt(hex.slice(2), 16)).padStart(10) + String(count).padStart(7));
    }
    console.log('total distinct: ' + seen.size + ', total rewrites: ' +
      [...seen.values()].reduce((sum, count) => sum + count, 0));
    return;
  }

  if (!files.length) {
    console.error('usage: node tools/deobf-unescape.mjs [--write] [--numbers] <file...>');
    process.exit(2);
  }

  let totalEscapes = 0;
  let totalNumbers = 0;
  let changed = 0;
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const result = rewriteSource(source, { numbers });
    if (result === null) process.exit(1);
    if (!result.escapes && !result.numbers) continue;
    changed += 1;
    totalEscapes += result.escapes;
    totalNumbers += result.numbers;
    if (write) {
      if (result.source === source) {
        console.error('nothing to do: ' + file);
        process.exit(1);
      }
      fs.writeFileSync(file, result.source);
    }
    console.log(
      (write ? 'rewrote ' : 'would rewrite ') + file +
        '  escapes=' + result.escapes + ' numbers=' + result.numbers,
    );
  }
  console.log('---');
  console.log(
    (write ? 'rewritten' : 'planned') + ': ' + changed + ' file(s), ' +
      totalEscapes + ' escape(s), ' + totalNumbers + ' number(s)',
  );
}

export { scan, splitBody, emit, rewriteSource, decimalForm };

if (process.argv[1] && process.argv[1].endsWith('deobf-unescape.mjs')) main();
