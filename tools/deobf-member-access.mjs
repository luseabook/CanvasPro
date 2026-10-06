// Rewrites static bracket member access to ordinary dot access when the property
// is an ASCII JavaScript identifier. This removes a common obfuscator/decompiler
// residue without touching dynamic keys, non-identifier properties, comments or
// string contents.
//
//   obj['name']     -> obj.name
//   obj?.['name']   -> obj?.name
//   obj['x-y']      -> unchanged
//
// Usage:
//   node tools/deobf-member-access.mjs <file-or-directory...>
//   node tools/deobf-member-access.mjs --write <file-or-directory...>
import fs from 'node:fs';
import path from 'node:path';
import { lex, stringValue } from './deobf-lex.mjs';

const CODE_EXT = /\.(?:js|cjs|mjs|jsx)$/i;
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const SKIP_DIRS = new Set(['.git', 'node_modules', 'vendor']);
const EXPRESSION_LEAD_KEYWORDS = new Set([
  'async', 'await', 'case', 'const', 'delete', 'do', 'else', 'get', 'in',
  'instanceof', 'let', 'new', 'of', 'return', 'set', 'static', 'throw',
  'typeof', 'var', 'void', 'yield',
]);

function canEndExpression(token) {
  if (!token) return false;
  if (token.kind === 'identifier') return !EXPRESSION_LEAD_KEYWORDS.has(token.value);
  if (['number', 'string', 'template', 'regex'].includes(token.kind)) return true;
  return token.kind === 'punct' && [')', ']'].includes(token.value);
}

export function plan(source) {
  const tokens = lex(source);
  const edits = [];
  for (let i = 1; i + 1 < tokens.length; i += 1) {
    const token = tokens[i];
    const open = tokens[i - 1];
    const close = tokens[i + 1];
    if (token.kind !== 'string') continue;
    if (open.kind !== 'punct' || open.value !== '[') continue;
    if (close.kind !== 'punct' || close.value !== ']') continue;

    const property = stringValue(token.value);
    if (!IDENTIFIER.test(property)) continue;

    const start = open.offset - 1;
    const stringStart = token.offset - token.value.length;
    const stringEnd = token.offset;
    const end = close.offset;
    if (start < 0 || end <= start) continue;

    // Comments between the brackets and literal may carry useful context. Only
    // rewrite whitespace-only padding, and assert every offset before editing.
    const before = source.slice(start, stringStart);
    const after = source.slice(stringEnd, end);
    if (!/^\[\s*$/.test(before) || !/^\s*\]$/.test(after)) continue;
    if (source.slice(stringStart, stringEnd) !== token.value) {
      throw new Error('lexer offset mismatch near ' + JSON.stringify(token.value));
    }

    const chain = tokens[i - 2];
    const optional = chain?.kind === 'punct' && chain.value === '?.';
    const base = optional ? tokens[i - 3] : chain;
    // A bare `['name']` is an array literal, not a computed member. Requiring a
    // complete expression before `[` distinguishes it from object access.
    if (!canEndExpression(base)) continue;
    edits.push({ start, end, text: (optional ? '' : '.') + property });
    i += 1;
  }
  return edits;
}

export function applyEdits(source, edits) {
  let output = source;
  for (const edit of [...edits].sort((a, b) => b.start - a.start)) {
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  }
  return output;
}

function collect(target, files) {
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    if (CODE_EXT.test(target)) files.push(target);
    return;
  }
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const child = path.join(target, entry.name);
    if (entry.isDirectory()) collect(child, files);
    else if (entry.isFile() && CODE_EXT.test(entry.name)) files.push(child);
  }
}

function main() {
  const args = process.argv.slice(2);
  const write = args.includes('--write');
  const targets = args.filter((arg) => !arg.startsWith('--'));
  if (!targets.length) {
    console.error('usage: node tools/deobf-member-access.mjs [--write] <file-or-directory...>');
    process.exit(2);
  }

  const files = [];
  for (const target of targets) collect(target, files);
  let touched = 0;
  let total = 0;
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const edits = plan(source);
    if (!edits.length) continue;
    touched += 1;
    total += edits.length;
    if (write) fs.writeFileSync(file, applyEdits(source, edits));
  }
  console.log((write ? 'rewritten' : 'planned') + ': ' + touched + ' file(s), ' + total + ' member access(es)');
}

if (process.argv[1] && process.argv[1].endsWith('deobf-member-access.mjs')) main();
