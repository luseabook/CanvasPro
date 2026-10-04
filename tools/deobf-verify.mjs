// Lexical equivalence gate for de-obfuscation batches.
//
//   node tools/deobf-verify.mjs <original.js> <rewritten.js> [--explain]
//
// Proves that `rewritten.js` differs from `original.js` only by renaming
// identifiers: the two files must tokenize to the same sequence of token kinds
// and literal values, and the identifier positions must form a consistent
// rename map (one old name always maps to the same new name).
//
// On top of the token stream it rejects the three ways a rename can still change
// behaviour without changing tokens:
//   - renaming an exported name, or an identifier an export clause refers to;
//   - renaming an identifier used as a member name or an object key;
//   - renaming an identifier that would collide with a name the file already
//     uses, which silently shadows it (`const isPlainObject = isPlainObject(x)`).
//
// Deliberately lexical rather than AST based: no parser dependency is available
// in this repository, and a pure rename is exactly what a token stream proves.
// Anything the lexer cannot see (comment edits, formatting) is ignored on
// purpose; every other transformation is rejected.
import fs from 'node:fs';
import { lex, withBrackets, dataPositions, stringValue, RESERVED_BINDING_NAMES } from './deobf-lex.mjs';

// Prettier only emits a trailing comma in multi-line argument lists, arrays,
// object literals and parameter lists. Whether the list ended up on one line is
// a formatting decision, so drop those commas before comparing. A comma that
// follows `,`, `(` or `[` is NOT dropped: `[,]` is a one-element hole, not an
// empty list.
function dropNonSemanticTrailingCommas(tokens) {
  return tokens.filter((token, index) => {
    if (token.kind !== 'punct' || token.value !== ',') return true;
    const next = tokens[index + 1];
    if (!next || next.kind !== 'punct' || ![')', ']', '}'].includes(next.value)) return true;
    const previous = tokens[index - 1];
    if (!previous) return true;
    if (previous.kind === 'punct' && [',', '(', '['].includes(previous.value)) return true;
    return false;
  });
}

function describe(token) {
  return token.kind === 'identifier' || token.kind === 'punct'
    ? JSON.stringify(token.value)
    : token.kind + ' ' + token.value;
}

function lineOf(source, offset) {
  return source.slice(0, offset).split('\n').length;
}

// The export surface is the contract with every consumer, so a file-local rename
// must leave it untouched. Two things are checked:
//   - the set of exported names must be identical;
//   - identifiers inside an `export { ... }` clause must not be renamed, because a
//     bare `export { local }` would otherwise stop referring to an existing binding.
// Nothing else in the file is visible to other modules, which is what lets a
// module with consumers be renamed safely.
function exportSurface(source) {
  const names = new Set();
  const clauseIdentifiers = new Set();

  const declaration = /\bexport\s+(?:default\s+)?(?:async\s+)?(function|class|const|let|var)\s+([A-Za-z_$][\w$]*)/g;
  let match;
  while ((match = declaration.exec(source))) {
    names.add(match[2]);
  }
  if (/\bexport\s+default\b/.test(source)) names.add('default');

  const clause = /\bexport\s*\{([^}]*)\}/g;
  while ((match = clause.exec(source))) {
    for (const part of match[1].split(',')) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const pieces = trimmed.split(/\s+as\s+/);
      const local = pieces[0].trim();
      const exported = (pieces[1] || pieces[0]).trim();
      if (!local) continue;
      clauseIdentifiers.add(local);
      if (exported) names.add(exported);
    }
  }

  return { names: [...names].sort(), clauseIdentifiers };
}

function main() {
  const args = process.argv.slice(2).filter(arg => arg !== '--explain');
  const explain = process.argv.includes('--explain');
  if (args.length !== 2) {
    console.error('usage: node tools/deobf-verify.mjs <original.js> <rewritten.js> [--explain]');
    process.exit(2);
  }
  const [originalPath, rewrittenPath] = args;
  const originalSource = fs.readFileSync(originalPath, 'utf8');
  const rewrittenSource = fs.readFileSync(rewrittenPath, 'utf8');
  const original = withBrackets(dropNonSemanticTrailingCommas(lex(originalSource)));
  const rewritten = withBrackets(dropNonSemanticTrailingCommas(lex(rewrittenSource)));

  const failures = [];

  if (original.length !== rewritten.length) {
    failures.push(
      'token count differs: ' + original.length + ' -> ' + rewritten.length +
        ' (rewriting must not add or remove tokens)',
    );
  }

  const limit = Math.min(original.length, rewritten.length);
  for (let index = 0; index < limit; index += 1) {
    const before = original[index];
    const after = rewritten[index];
    if (before.kind !== after.kind) {
      failures.push(
        'token ' + index + ' kind changed at line ' + lineOf(originalSource, before.offset) +
          ': ' + describe(before) + ' -> ' + describe(after),
      );
      continue;
    }
    if (before.kind === 'identifier') continue;
    // Compare string literals by value: prettier rewrites `"a"` to `'a'`.
    const same = before.kind === 'string'
      ? stringValue(before.value) === stringValue(after.value)
      : before.value === after.value;
    if (!same) {
      failures.push(
        'token ' + index + ' value changed at line ' + lineOf(originalSource, before.offset) +
          ': ' + describe(before) + ' -> ' + describe(after),
      );
    }
  }

  // Identifier positions must form a consistent rename map.
  const rename = new Map();
  for (let index = 0; index < limit; index += 1) {
    const before = original[index];
    const after = rewritten[index];
    if (before.kind !== 'identifier' || after.kind !== 'identifier') continue;
    const known = rename.get(before.value);
    if (known === undefined) {
      rename.set(before.value, after.value);
      continue;
    }
    if (known !== after.value) {
      failures.push(
        'inconsistent rename of ' + JSON.stringify(before.value) + ': ' + JSON.stringify(known) +
          ' at one place, ' + JSON.stringify(after.value) + ' at line ' +
          lineOf(originalSource, before.offset),
      );
    }
  }

  const before = exportSurface(originalSource);
  const after = exportSurface(rewrittenSource);
  if (before.names.join(',') !== after.names.join(',')) {
    failures.push(
      'export surface changed: [' + before.names.join(', ') + '] -> [' + after.names.join(', ') + ']',
    );
  }
  for (const [from, to] of rename) {
    if (from !== to && before.clauseIdentifiers.has(from)) {
      failures.push(
        'identifier ' + JSON.stringify(from) + ' is referenced by an export clause and must not be renamed',
      );
    }
  }

  // Renaming an identifier where it names data rather than a binding.
  const positions = dataPositions(original);
  const badPositions = [];
  for (const [from, to] of rename) {
    if (from === to) continue;
    if (positions.memberOrKey.has(from)) badPositions.push('member name or object key `' + from + '`');
    if (positions.shorthand.has(from)) badPositions.push('shorthand property `{ ' + from + ' }`');
  }
  if (badPositions.length) {
    failures.push(
      'identifiers used as member names or object keys must not be renamed: ' +
        [...new Set(badPositions)].slice(0, 10).join(', '),
    );
  }

  // A binding name may not be a reserved word. The token stream cannot see this,
  // because both sides lex as plain identifiers, so `{ enum: _0x1 }` renaming its
  // binding to `enum` would pass the stream comparison and then fail to parse.
  const reservedTargets = [];
  for (const [from, to] of rename) {
    if (from !== to && RESERVED_BINDING_NAMES.has(to)) reservedTargets.push(from + ' -> ' + to);
  }
  if (reservedTargets.length) {
    failures.push(
      'rename target is a reserved word: ' + reservedTargets.slice(0, 10).join(', '),
    );
  }

  // A rename target must be a name the file did not already use as a binding or
  // reference. Otherwise the rename silently shadows an existing name and later
  // references keep the new meaning: `const isPlainObject = isPlainObject(x)`.
  // Occurrences that name data are excluded, so a local binding may legitimately
  // take its name from a destructuring key (`{ sanitizePromptHtml: sanitizePromptHtml }`).
  const renamedFrom = new Set([...rename.entries()].filter(([from, to]) => from !== to).map(([from]) => from));
  const existing = new Set();
  for (let index = 0; index < original.length; index += 1) {
    const token = original[index];
    if (token.kind !== 'identifier') continue;
    if (positions.dataIndices.has(index)) continue;
    if (renamedFrom.has(token.value)) continue;
    existing.add(token.value);
  }
  const shadowing = [];
  for (const [from, to] of rename) {
    if (from === to) continue;
    if (existing.has(to)) shadowing.push(from + ' -> ' + to);
  }
  if (shadowing.length) {
    failures.push(
      'rename target shadows a name the file already uses: ' + shadowing.slice(0, 10).join(', '),
    );
  }

  // The rename map must be injective. Two different old names collapsing onto one
  // new name means two distinct bindings now share a name, which is either a
  // redeclaration ("Identifier 'value_' has already been declared") or a silent
  // merge of unrelated values.
  const byTarget = new Map();
  for (const [from, to] of rename) {
    if (from === to) continue;
    if (!byTarget.has(to)) byTarget.set(to, []);
    byTarget.get(to).push(from);
  }
  const merged = [...byTarget.entries()].filter(([, sources]) => sources.length > 1);
  if (merged.length) {
    failures.push(
      'rename map is not injective: ' +
        merged.slice(0, 10).map(([to, sources]) => sources.join('+') + ' -> ' + to).join(', '),
    );
  }

  const renamed = [...rename.entries()].filter(([from, to]) => from !== to);

  if (failures.length) {
    console.error('FAIL ' + originalPath + ' -> ' + rewrittenPath);
    for (const failure of failures.slice(0, 40)) console.error('  - ' + failure);
    if (failures.length > 40) console.error('  ... ' + (failures.length - 40) + ' more');
    process.exit(1);
  }

  console.log(
    'PASS ' + rewrittenPath + ': identical token stream (' + original.length +
      ' tokens); ' + renamed.length + ' identifiers renamed',
  );
  if (explain) {
    for (const [from, to] of [...renamed].sort()) console.log('  ' + from + ' -> ' + to);
  }
}

main();
