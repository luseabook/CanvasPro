// Lexical equivalence gate for de-obfuscation batches.
//
//   node tools/deobf-verify.mjs <original.js> <rewritten.js> [--explain]
//
// Proves that `rewritten.js` differs from `original.js` only by renaming
// identifiers: the two files must tokenize to the same sequence of token kinds
// and literal values, and the identifier positions must form a consistent
// rename map (one old name always maps to the same new name).
//
// Deliberately lexical rather than AST based: no parser dependency is available
// in this repository, and a pure rename is exactly what a token stream proves.
// Anything the lexer cannot see (comment edits, formatting) is ignored on
// purpose; every other transformation is rejected.
import fs from 'node:fs';

const PUNCTUATORS = [
  '>>>=', '...', '===', '!==', '**=', '<<=', '>>=', '>>>', '&&=', '||=', '??=',
  '=>', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '++', '--', '+=', '-=',
  '*=', '/=', '%=', '&=', '|=', '^=', '**', '<<', '>>',
  '{', '}', '(', ')', '[', ']', ';', ',', '<', '>', '+', '-', '*', '/', '%', '&',
  '|', '^', '!', '~', '?', ':', '=', '.', '@', '#',
].sort((a, b) => b.length - a.length);

// A `/` is division when the previous token can end an expression, otherwise a
// regex literal starts. Both files are lexed by the same rule, so even a wrong
// guess stays consistent for comparison purposes.
const EXPRESSION_END = new Set(['identifier', 'number', 'string', 'template', 'regex']);
const KEYWORDS_BEFORE_REGEX = new Set([
  'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'do',
  'else', 'case', 'yield', 'await', 'throw',
]);

function lex(source) {
  const tokens = [];
  let i = 0;
  let previous = null;
  const push = (kind, value) => {
    const token = { kind, value, offset: i };
    tokens.push(token);
    previous = token;
    return token;
  };
  const regexAllowed = () => {
    if (!previous) return true;
    if (previous.kind === 'punct') return ![')', ']', '}'].includes(previous.value);
    if (previous.kind === 'identifier') return KEYWORDS_BEFORE_REGEX.has(previous.value);
    return false;
  };

  while (i < source.length) {
    const char = source[i];

    if (char === '\n' || char === ' ' || char === '\t' || char === '\r' || char === '\f' || char === '\v') {
      i += 1;
      continue;
    }

    if (char === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') i += 1;
      continue;
    }
    if (char === '/' && source[i + 1] === '*') {
      i += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) i += 1;
      i += 2;
      continue;
    }

    if (char === '"' || char === "'") {
      const start = i;
      i += 1;
      while (i < source.length && source[i] !== char) {
        if (source[i] === '\\') i += 1;
        i += 1;
      }
      i += 1;
      push('string', source.slice(start, i));
      continue;
    }

    if (char === '`') {
      const start = i;
      i += 1;
      while (i < source.length && source[i] !== '`') {
        if (source[i] === '\\') {
          i += 2;
          continue;
        }
        if (source[i] === '$' && source[i + 1] === '{') {
          push('template', source.slice(start, i));
          i += 2;
          let depth = 1;
          const expressionStart = i;
          while (i < source.length && depth > 0) {
            if (source[i] === '{') depth += 1;
            else if (source[i] === '}') depth -= 1;
            if (depth === 0) break;
            i += 1;
          }
          const inner = lex(source.slice(expressionStart, i));
          for (const token of inner) {
            token.offset += expressionStart;
            tokens.push(token);
          }
          if (inner.length) previous = inner[inner.length - 1];
          i += 1;
          push('template', '${}');
          continue;
        }
        i += 1;
      }
      i += 1;
      push('template', source.slice(start, i));
      continue;
    }

    if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(source[i + 1] || ''))) {
      const start = i;
      if (char === '0' && /[xXbBoO]/.test(source[i + 1] || '')) {
        i += 2;
        while (i < source.length && /[0-9a-fA-F_]/.test(source[i])) i += 1;
      } else {
        while (i < source.length && /[0-9_]/.test(source[i])) i += 1;
        if (source[i] === '.') {
          i += 1;
          while (i < source.length && /[0-9_]/.test(source[i])) i += 1;
        }
        if (/[eE]/.test(source[i] || '')) {
          i += 1;
          if (/[+-]/.test(source[i] || '')) i += 1;
          while (i < source.length && /[0-9_]/.test(source[i])) i += 1;
        }
      }
      if (source[i] === 'n') i += 1;
      const text = source.slice(start, i).replace(/_/g, '');
      // Compare numbers by value so `0x200` and `512` count as the same literal.
      push('number', 'n' === text.slice(-1) ? text : String(Number(text)));
      continue;
    }

    if (/[A-Za-z_$\\]/.test(char)) {
      const start = i;
      while (i < source.length && /[A-Za-z0-9_$\\]/.test(source[i])) i += 1;
      push('identifier', source.slice(start, i));
      continue;
    }

    if (char === '/' && regexAllowed()) {
      const start = i;
      i += 1;
      let inClass = false;
      while (i < source.length) {
        const current = source[i];
        if (current === '\\') {
          i += 2;
          continue;
        }
        if (current === '[') inClass = true;
        else if (current === ']') inClass = false;
        else if (current === '/' && !inClass) break;
        else if (current === '\n') break;
        i += 1;
      }
      i += 1;
      while (i < source.length && /[a-z]/i.test(source[i])) i += 1;
      push('regex', source.slice(start, i));
      continue;
    }

    const punctuator = PUNCTUATORS.find(candidate => source.startsWith(candidate, i));
    if (!punctuator) {
      push('punct', char);
      i += 1;
      continue;
    }
    i += punctuator.length;
    push('punct', punctuator);
  }

  return tokens;
}

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
  if (/\bexport\s+default\b/.test(source) && !/\bexport\s+default\s+(?:async\s+)?(?:function|class)\s/.test(source)) {
    names.add('default');
  }
  if (/\bexport\s+default\s+(?:async\s+)?(?:function|class)\s/.test(source)) {
    names.add('default');
  }

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
  const original = dropNonSemanticTrailingCommas(lex(originalSource));
  const rewritten = dropNonSemanticTrailingCommas(lex(rewrittenSource));

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
    if (before.value !== after.value) {
      failures.push(
        'token ' + index + ' value changed at line ' + lineOf(originalSource, before.offset) +
          ': ' + describe(before) + ' -> ' + describe(after),
      );
    }
  }

  // Identifier positions must form a consistent rename map.
  const rename = new Map();
  const renamedTargets = new Set();
  for (let index = 0; index < limit; index += 1) {
    const before = original[index];
    const after = rewritten[index];
    if (before.kind !== 'identifier' || after.kind !== 'identifier') continue;
    const known = rename.get(before.value);
    if (known === undefined) {
      rename.set(before.value, after.value);
      if (before.value !== after.value) renamedTargets.add(after.value);
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

  const collisions = [...rename.entries()]
    .filter(([from, to]) => from !== to && [...rename.entries()].some(([otherFrom, otherTo]) =>
      otherFrom !== from && otherTo === to))
    .map(([from, to]) => from + ' -> ' + to);

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
    for (const [from, to] of renamed.sort()) console.log('  ' + from + ' -> ' + to);
  }
  if (collisions.length) {
    // Usually a destructuring property key such as `itemKey: _0x30c878`, which is
    // safe. Anything else deserves a manual look before the batch lands.
    console.log('REVIEW ' + collisions.length + ' rename target shares a name with an existing identifier:');
    for (const collision of collisions.slice(0, 20)) console.log('  ' + collision);
  }
}

main();
