// Applies a de-obfuscation rename map to one file.
//
//   node tools/deobf-rename.mjs <target.js> <mapping.json>
//
// The map is file-scoped: { "_0x12ab": "meaningfulName", ... }. Every `_0x`
// name present in the target must appear in the map, otherwise nothing is
// written — a partial map is how names get silently missed. Only identifiers
// are replaced, nothing else. Verify the result afterwards with
// tools/deobf-verify.mjs against the pre-rename copy.
import fs from 'node:fs';
import { RESERVED_BINDING_NAMES } from './deobf-lex.mjs';

const [targetPath, mappingPath] = process.argv.slice(2);
if (!targetPath || !mappingPath) {
  console.error('usage: node tools/deobf-rename.mjs <target.js> <mapping.json>');
  process.exit(2);
}

const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
for (const [from, to] of Object.entries(mapping)) {
  if (!/^_0x[0-9a-f]{4,}$/.test(from)) {
    console.error('mapping key is not an obfuscated name: ' + from);
    process.exit(2);
  }
  if (typeof to !== 'string' || !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(to)) {
    console.error('mapping value is not a plain identifier: ' + from + ' -> ' + String(to));
    process.exit(2);
  }
  if (/^_0x[0-9a-f]{4,}$/.test(to)) {
    console.error('mapping value is itself an obfuscated name: ' + from + ' -> ' + to);
    process.exit(2);
  }
  if (RESERVED_BINDING_NAMES.has(to)) {
    console.error('mapping value is a reserved word and cannot be a binding: ' + from + ' -> ' + to);
    process.exit(2);
  }
}

const source = fs.readFileSync(targetPath, 'utf8');
const present = new Set(source.match(/\b_0x[0-9a-f]{4,}\b/g) || []);

const unmapped = [...present].filter(name => !(name in mapping));
if (unmapped.length) {
  console.error('refusing to write: ' + unmapped.length + ' unmapped name(s) present:');
  for (const name of unmapped.slice(0, 30)) console.error('  ' + name);
  process.exit(1);
}

const unused = Object.keys(mapping).filter(name => !present.has(name));
if (unused.length) {
  console.warn('note: ' + unused.length + ' mapping entr(ies) not present in this file: ' + unused.join(', '));
}

const keys = Object.keys(mapping).sort((a, b) => b.length - a.length);
const pattern = new RegExp('\\b(' + keys.join('|') + ')\\b', 'g');
const rewritten = source.replace(pattern, match => mapping[match]);

const leftover = rewritten.match(/\b_0x[0-9a-f]{4,}\b/g);
if (leftover) {
  console.error('refusing to write: obfuscated names remain: ' + [...new Set(leftover)].join(', '));
  process.exit(1);
}

if (rewritten === source) {
  console.error('nothing to do: rewrite produced identical content');
  process.exit(1);
}

fs.writeFileSync(targetPath, rewritten);
console.log('renamed ' + present.size + ' name(s) in ' + targetPath);
