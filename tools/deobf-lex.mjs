// Shared lexer for the de-obfuscation tools.
//
// A pure rename is a token-stream property, so every tool in this workflow reads
// the source the same way. Keeping one lexer means the gate, the namer and any
// future checker agree on where an identifier sits, especially for the positions
// where a rename would change data rather than a binding:
//
//   member access   obj._0x1a2b        `_0x1a2b` names a property
//   object key      { _0x1a2b: v }     `_0x1a2b` names a property
//   shorthand       { _0x1a2b }        the key IS the binding name
//
// Deliberately lexical rather than AST based: no JavaScript parser is available
// in this repository, and a rename is exactly what a token stream can prove.
//
// Known limit: brace classification is a heuristic, not a parse. A `{` is taken
// to open an object when the token before it can only start an expression
// (`=`, `(`, `,`, `[`, `:`, `return`, `const`, ...). That is enough to tell
// `const { a } = x` from a function body, which is the distinction the callers
// need; anything unrecognised is treated as a block, so a missed object costs a
// name that stays obfuscated rather than a wrong rename.
const PUNCTUATORS = [
  '>>>=', '...', '===', '!==', '**=', '<<=', '>>=', '>>>', '&&=', '||=', '??=',
  '=>', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '++', '--', '+=', '-=',
  '*=', '/=', '%=', '&=', '|=', '^=', '**', '<<', '>>',
  '{', '}', '(', ')', '[', ']', ';', ',', '<', '>', '+', '-', '*', '/', '%', '&',
  '|', '^', '!', '~', '?', ':', '=', '.', '@', '#',
].sort((a, b) => b.length - a.length);

// The previous token forms that can only be followed by an object literal or a
// destructuring pattern, never by a block.
const OBJECT_LEAD = new Set([
  '=', '(', ',', '[', ':', '?', '...',
  'const', 'let', 'var', 'return', 'typeof', 'await', 'yield', 'in', 'of', 'default',
]);

// A `/` is division when the previous token can end an expression, otherwise a
// regex literal starts. Both files are lexed by the same rule, so even a wrong
// guess stays consistent for comparison purposes.
const KEYWORDS_BEFORE_REGEX = new Set([
  'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'do',
  'else', 'case', 'yield', 'await', 'throw',
]);

export function lex(source) {
  const tokens = [];
  let i = 0;
  let previous = null;
  const push = (kind, value) => {
    const token = {
      kind,
      value,
      offset: i,
      // `obj.name` / `obj?.name`: the identifier is a member name, part of the
      // data being addressed, not a binding. Renaming it changes behaviour.
      member: previous !== null && previous.kind === 'punct' && (previous.value === '.' || previous.value === '?.'),
    };
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

// A `:` before a `{` is ambiguous: it introduces a property value (`{ a: {…} }`)
// or a switch label (`case 1: { … }`). Only the latter opens a block.
function isCaseLabel(tokens, colonIndex) {
  for (let index = colonIndex - 1; index >= 0; index -= 1) {
    const token = tokens[index];
    if (token.kind === 'identifier') return token.value === 'case' || token.value === 'default';
    if (token.kind === 'punct' && [';', '{', '}', '(', ')', ','].includes(token.value)) return false;
  }
  return false;
}

// Tags every token with the innermost enclosing bracket, and whether that bracket
// is a `{` that can only be an object literal / destructuring pattern.
export function withBrackets(tokens) {
  const stack = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const top = stack[stack.length - 1] || null;
    token.enclosing = top ? top.value : null;
    token.enclosingObjectish = top ? top.objectish : false;
    if (token.kind !== 'punct') continue;
    if (token.value === '{' || token.value === '[' || token.value === '(') {
      const previous = tokens[index - 1] || null;
      let objectish = false;
      if (token.value === '{' && previous !== null) {
        objectish = OBJECT_LEAD.has(previous.value);
        if (objectish && previous.value === ':') objectish = !isCaseLabel(tokens, index - 1);
      }
      stack.push({ value: token.value, objectish });
      continue;
    }
    if (token.value === '}' || token.value === ']' || token.value === ')') stack.pop();
  }
  return tokens;
}

// Positions where an identifier names data instead of a binding, and where
// renaming it would therefore change what the program does.
export function dataPositions(tokens) {
  const memberOrKey = new Set();
  const shorthand = new Set();
  // Indices of identifiers that name data. Used to decide which occurrences count
  // as "this name is already taken": `{ a: 1 }` alone does not reserve `a`,
  // because a local binding named `a` is legitimate.
  const dataIndices = new Set();
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.kind !== 'identifier') continue;
    const previous = tokens[index - 1];
    const next = tokens[index + 1];
    if (token.member) {
      memberOrKey.add(token.value);
      dataIndices.add(index);
      continue;
    }
    const previousIsSeparator = previous && previous.kind === 'punct' && (previous.value === '{' || previous.value === ',');
    const spread = previous && previous.kind === 'punct' && previous.value === '...';
    if (!token.enclosingObjectish || !previousIsSeparator || spread) continue;
    if (next && next.kind === 'punct' && next.value === ':') {
      memberOrKey.add(token.value); // { key: value }
      dataIndices.add(index);
      continue;
    }
    if (next && next.kind === 'punct' && (next.value === ',' || next.value === '}' || next.value === '=')) {
      // `{ key }` / `{ key = 1 }`: the property key *is* the binding name, so a
      // rename would rename the key in the produced or consumed object.
      shorthand.add(token.value);
    }
  }
  return { memberOrKey, shorthand, dataIndices };
}

// Names that cannot be used as a binding. The list mixes ES reserved words with
// the strict-mode restrictions, because every file here is an ES module and
// modules are always strict. A destructuring key may legitimately be one of
// these (`{ enum: value }` is fine), so a rename source position can hold one —
// the target position cannot.
export const RESERVED_BINDING_NAMES = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
  'delete', 'do', 'else', 'enum', 'export', 'extends', 'false', 'finally', 'for',
  'function', 'if', 'import', 'in', 'instanceof', 'new', 'null', 'return',
  'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void',
  'while', 'with', 'yield',
  'implements', 'interface', 'let', 'package', 'private', 'protected', 'public',
  'static', 'await',
  'arguments', 'eval',
]);

// Decodes a string literal to its value, so that `"a"` and `'a'` compare equal.
// Prettier rewrites quote style, and quote style is not part of the semantics.
export function stringValue(text) {
  if (text.length < 2) return text;
  const body = text.slice(1, -1);
  const SIMPLE = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' };
  return body.replace(
    /\\(x[0-9a-fA-F]{2}|u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|[\s\S])/g,
    (whole, group) => {
      if (group[0] === 'x') return String.fromCharCode(parseInt(group.slice(1), 16));
      if (group[0] === 'u') {
        const hex = group[1] === '{' ? group.slice(2, -1) : group.slice(1);
        return String.fromCodePoint(parseInt(hex, 16));
      }
      if (group === '\n') return '';
      return Object.prototype.hasOwnProperty.call(SIMPLE, group) ? SIMPLE[group] : group;
    },
  );
}
