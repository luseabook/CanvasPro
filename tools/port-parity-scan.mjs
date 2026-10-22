// Named-method scanner for the port-parity gate.
//
// Upstream is a de-obfuscated bundle, so one API can be written in five
// different shapes. The first version of the gate knew three of them and
// silently under-reported: `agentSessionStore` was measured at 18 missing APIs
// while the real number is 27, because `recordRunEvent: _0x1243ae` (alias
// property) and `getPersistenceError: () => ...` (arrow property) were invisible.
//
// The five shapes are split into two tiers on purpose.
//
//   STRICT (method definitions) — drives the missing-method comparison:
//     1. ['name'](args) {        computed key, survives minification
//     2. name(args) {            plain identifier at class-body indent
//     3. 'name'(args) {          quoted literal key + shorthand method
//
//   ALIAS (property assignments) — reported separately, never a hard gap:
//     4. name: identifier,       alias property pointing at a local function
//     5. name: (args) => ...     arrow property with its own body
//
// Why the split: shapes 4 and 5 cannot be told apart from configuration objects
// by syntax alone. Enabling them in the main comparison inflated upstream's
// method set by 171 files and produced 219 phantom gaps (`beforeActivate`,
// `renderImage`, `getTabLabel` — all event-handler properties). Matching still
// runs against the union of both tiers, so an API we implement as an arrow
// property is correctly seen as present.
//
// One exclusion was tried and reverted, worth recording: methods written inside
// an object literal passed to a call
// (`createCollaborationMedia({ onProgress(entry) { ... } })`) look exactly like
// configuration callbacks. Excluding them hid four real gaps —
// `modelServiceSettingsNavigator.clearFieldReveal`,
// `collaborationChatPosition.placeAt`, `storyClipFrames.upsert`,
// `agentModelControls.refreshMenu` — because those APIs *are* injected
// callbacks. A missed gap is worse than a phantom one, so no such filter exists.
// The cost is one known phantom (`SelectionController.resolveRect`, a spatial
// index option), to be recorded in the baseline's `equivalent` section.

/**
 * Returns the index just past the string or comment starting at `index`, or -1
 * when nothing literal starts there.
 * @param {string} source
 * @param {number} index
 * @returns {number}
 */
function skipLiteralAt(source, index) {
  const character = source[index];
  if (character === '"' || character === "'" || character === '`') {
    let cursor = index + 1;
    while (cursor < source.length && source[cursor] !== character) {
      if (source[cursor] === '\\') cursor += 1;
      cursor += 1;
    }
    return cursor + 1;
  }
  if (character === '/' && source[index + 1] === '/') {
    let cursor = index;
    while (cursor < source.length && source[cursor] !== '\n') cursor += 1;
    return cursor;
  }
  if (character === '/' && source[index + 1] === '*') {
    let cursor = index + 2;
    while (cursor < source.length && !(source[cursor] === '*' && source[cursor + 1] === '/'))
      cursor += 1;
    return cursor + 2;
  }
  return -1;
}

/**
 * Given the index of an opening bracket, returns the index just past its
 * matching close, or -1 when unbalanced.
 * @param {string} source
 * @param {number} openIndex
 * @param {string} openCharacter
 * @param {string} closeCharacter
 * @returns {number}
 */
function skipBalancedAt(source, openIndex, openCharacter, closeCharacter) {
  let depth = 0;
  for (let cursor = openIndex; cursor < source.length; cursor += 1) {
    const literalEnd = skipLiteralAt(source, cursor);
    if (literalEnd >= 0) {
      cursor = literalEnd - 1;
      continue;
    }
    const character = source[cursor];
    if (character === openCharacter) depth += 1;
    else if (character === closeCharacter) {
      depth -= 1;
      if (depth === 0) return cursor + 1;
    }
  }
  return -1;
}

/** True when only whitespace separates `index` from a `{`. */
function opensBlockAt(source, index) {
  let cursor = index;
  while (cursor < source.length && /\s/.test(source[cursor])) cursor += 1;
  return source[cursor] === '{';
}

/**
 * Splits a raw parameter list into parameter descriptors.
 *
 * Only the arity is trustworthy for comparison: upstream parameter names are
 * obfuscated (`_0x5c67e1`) while the repo renames them, so name differences are
 * noise. A destructured parameter counts as one slot, matching how a caller
 * passes it.
 * @param {string} raw Text between the parentheses.
 * @returns {string[]} One entry per parameter, default value stripped.
 */
export function parseParameterList(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return [];
  const parts = [];
  let depth = 0;
  let current = '';
  for (let cursor = 0; cursor < trimmed.length; cursor += 1) {
    const character = trimmed[cursor];
    if (character === '(' || character === '[' || character === '{') depth += 1;
    else if (character === ')' || character === ']' || character === '}') depth -= 1;
    if (character === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += character;
  }
  parts.push(current);
  return parts.map((part) => part.trim().split('=')[0].trim()).filter((part) => part.length > 0);
}

/**
 * Scans a source string for named definitions.
 * @param {string} source
 * @param {boolean} includeAliases When true, shapes 4 and 5 are collected too.
 * @returns {Map<string, string[]>} Name -> parameter descriptors.
 */
function scanSignatures(source, includeAliases) {
  /** @type {Map<string, string[]>} */
  const signatures = new Map();

  /**
   * Records a definition. When the same name appears twice (overloads, or a
   * factory rebuilding an object) the widest arity wins, because that is the
   * contract a caller can rely on.
   * @returns {boolean} Whether the stored signature changed — the alias resolver
   * depends on this to terminate, since a rejected definition is not progress.
   */
  const record = (name, parameters) => {
    const existing = signatures.get(name);
    if (existing) {
      // Widening is finite (arity is bounded), so the fixpoint terminates.
      if (parameters.length <= existing.length) return false;
      signatures.set(name, parameters);
      return true;
    }
    signatures.set(name, parameters);
    return true;
  };

  const reserved = new Set([
    'if',
    'for',
    'while',
    'switch',
    'catch',
    'function',
    'return',
    'do',
    'else',
    'typeof',
    'new',
    'await',
    'yield',
    'with',
    'try',
    'throw',
    'delete',
    'void',
    'in',
    'of',
    'case',
    'default',
    'class',
    'const',
    'let',
    'var',
  ]);

  /** Reads the parameter text for a match whose `(` sits at `openParen`. */
  const parametersAt = (openParen) => {
    const closeParen = skipBalancedAt(source, openParen, '(', ')');
    if (closeParen < 0) return null;
    return {
      parameters: parseParameterList(source.slice(openParen + 1, closeParen - 1)),
      after: closeParen,
    };
  };

  // --- Shape 1: computed key `['name']( ... ) {` -----------------------------
  const computedKey = /\['([A-Za-z_$][\w$]*)'\]\s*\(/g;
  let match;
  while ((match = computedKey.exec(source)) !== null) {
    const openParen = match.index + match[0].length - 1;
    const read = parametersAt(openParen);
    if (!read || !opensBlockAt(source, read.after)) continue;
    // Distinguish a definition from property access: `obj['prop'](...)` is an
    // expression, a definition follows a statement boundary.
    const before = source.slice(Math.max(0, match.index - 1), match.index);
    if (/[A-Za-z0-9_$]/.test(before) || before === '.' || before === ')') continue;
    record(match[1], read.parameters);
  }

  // --- Shape 3: quoted literal key `'name'( ... ) {` ------------------------
  const quotedKey = /(['"])([A-Za-z_$][\w$]*)\1\s*\(/g;
  while ((match = quotedKey.exec(source)) !== null) {
    const openParen = match.index + match[0].length - 1;
    const read = parametersAt(openParen);
    if (!read || !opensBlockAt(source, read.after)) continue;
    const before = source.slice(Math.max(0, match.index - 1), match.index);
    if (before === '\\' || /[A-Za-z0-9_$]/.test(before)) continue;
    record(match[2], read.parameters);
  }

  // --- Shape 2: plain identifier at class-body indentation -------------------
  const plainMethod = /^[ \t]{2,6}([A-Za-z_$][\w$]*)\s*\(/gm;
  while ((match = plainMethod.exec(source)) !== null) {
    const name = match[1];
    if (reserved.has(name)) continue;
    const openParen = match.index + match[0].length - 1;
    const read = parametersAt(openParen);
    if (!read || !opensBlockAt(source, read.after)) continue;
    record(name, read.parameters);
  }

  if (!includeAliases) return signatures;

  // --- Shape 5: arrow property `name: (args) => ...` ------------------------
  const arrowProperty =
    /^[ \t]{2,8}([A-Za-z_$][\w$]*)\s*:\s*(?:async\s*)?(?:\(([^)]*)\)|([A-Za-z_$][\w$]*))\s*=>/gm;
  while ((match = arrowProperty.exec(source)) !== null) {
    record(match[1], parseParameterList(match[2] ?? match[3] ?? ''));
  }

  // --- Shape 4: alias property `name: identifier,` --------------------------
  // Resolved last so the target set is complete; repeats until stable in case
  // one alias points at another alias.
  /** @type {Map<string, string[]>} */
  const localFunctions = new Map();
  const functionDeclaration =
    /^[ \t]*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gm;
  while ((match = functionDeclaration.exec(source)) !== null) {
    const openParen = match.index + match[0].length - 1;
    const read = parametersAt(openParen);
    if (read) localFunctions.set(match[1], read.parameters);
  }

  const aliasProperty = /^[ \t]{2,8}([A-Za-z_$][\w$]*)\s*:\s*([A-Za-z_$][\w$]*)\s*[,}]/gm;
  const aliasCandidates = [];
  while ((match = aliasProperty.exec(source)) !== null) {
    aliasCandidates.push({ name: match[1], target: match[2] });
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const candidate of aliasCandidates) {
      const parameters = signatures.get(candidate.target) ?? localFunctions.get(candidate.target);
      if (!parameters) continue;
      if (record(candidate.name, parameters)) changed = true;
    }
  }

  return signatures;
}

/**
 * Strict method definitions (shapes 1–3). This is the set the gate compares.
 * @param {string} source
 * @returns {Map<string, string[]>}
 */
export function extractMethodSignatures(source) {
  return scanSignatures(source, false);
}

/**
 * Property-assignment APIs (shapes 4–5) that the strict scan did not already
 * find. Reported as `aliasMissing`, never as a hard gap.
 * @param {string} source
 * @returns {Map<string, string[]>}
 */
export function extractAliasSignatures(source) {
  const strict = scanSignatures(source, false);
  const combined = scanSignatures(source, true);
  /** @type {Map<string, string[]>} */
  const aliases = new Map();
  for (const [name, parameters] of combined) {
    if (!strict.has(name)) aliases.set(name, parameters);
  }
  return aliases;
}

/**
 * Module-scope `function name(...) { ... }` declarations.
 *
 * Kept out of the strict set on purpose: the hard gate compares the three method
 * shapes only, because a module-level helper may be inlined, merged or renamed
 * between versions without a feature being lost. That exclusion is also why 53
 * helpers that were really never ported stayed invisible, so this layer exists —
 * reported separately and never as a hard gap.
 *
 * Two constraints keep it from manufacturing noise:
 *  - column 0 only. An indented `function` is a closure inside some other body,
 *    and its name means nothing across versions.
 *  - `_0x` names dropped. Upstream mangles them and the repo renames them, so
 *    comparing them would report every renamed local as a gap.
 * @param {string} source
 * @returns {Map<string, string[]>} Name -> parameter descriptors.
 */
export function extractModuleFunctionSignatures(source) {
  /** @type {Map<string, string[]>} */
  const signatures = new Map();
  const declaration = /^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gm;
  let match;
  while ((match = declaration.exec(source)) !== null) {
    const name = match[1];
    if (name.startsWith('_0x')) continue;
    const openParen = match.index + match[0].length - 1;
    const closeParen = skipBalancedAt(source, openParen, '(', ')');
    if (closeParen < 0 || !opensBlockAt(source, closeParen)) continue;
    const parameters = parseParameterList(source.slice(openParen + 1, closeParen - 1));
    // Widest arity wins, same rule as the strict set: that is the contract a
    // caller can rely on when a factory rebuilds the same declaration.
    const existing = signatures.get(name);
    if (existing && parameters.length <= existing.length) continue;
    signatures.set(name, parameters);
  }
  return signatures;
}

/**
 * Names only, strict tier. Kept as the simple entry point for callers that do
 * not care about arity.
 * @param {string} source
 * @returns {Set<string>}
 */
export function extractMethodNames(source) {
  return new Set(extractMethodSignatures(source).keys());
}

// Receivers that own the method being called. Deliberately narrow: a bare
// `foo?.(…)` says nothing about where `foo` is supposed to live.
const OPTIONAL_CALL_RECEIVERS = 'this|node|target|current|entry|controller|owner';

/**
 * Definition forms that count as "this method exists somewhere in the repo".
 *
 * The bracket form is the one that matters most and the one that is easiest to
 * forget: `['_m']() {…}` is how every de-obfuscated method is written here. A
 * first cut of this scan omitted it and reported 43 false positives.
 */
const METHOD_DEFINITION_PATTERNS = [
  // ['_m']() {  /  ['_m']: value  /  ['_m']: function
  /\[\s*['"](_[A-Za-z][\w$]*)['"]\s*\]\s*[:(]/g,
  // shorthand method at line start: `_m(args) {` (optionally async/get/set/static)
  /^\s*(?:(?:async|get|set|static)\s+)?(_[A-Za-z][\w$]*)\s*\(/gm,
  // property assignment: `this._m = …` / `proto._m = …`
  /\.\s*(_[A-Za-z][\w$]*)\s*=(?!=)/g,
  // object literal / class field: `_m: …`
  /\b(_[A-Za-z][\w$]*)\s*:/g,
  // function declaration
  /function\s+(_[A-Za-z][\w$]*)\b/g,
];

/**
 * Finds optional calls to private methods that no file in the repo defines.
 *
 * This is a different failure class from a porting gap, and a nastier one:
 * `this['_mustRenderTerminalVideoState']?.(…)` with no definition is a silent
 * no-op, so the feature looks wired up, every unit test passes, and the parity
 * gate (which compares names per file) sees nothing wrong. 202/203 found six of
 * these in the video result module alone — three of them called by the renderer
 * coordinator, which then quietly skipped suspending media.
 *
 * Scope is the whole repo on purpose: these methods are mixed onto node
 * prototypes from sibling modules, so "defined in a different file" is normal.
 *
 * @param {Map<string, string>|Iterable<[string, string]>} sourcesByFile
 * @returns {Array<{method: string, files: string[], calls: number}>}
 */
export function findDanglingOptionalCalls(sourcesByFile) {
  const entries = sourcesByFile instanceof Map ? [...sourcesByFile] : Array.from(sourcesByFile);
  const dotCall = new RegExp(
    `\\b(?:${OPTIONAL_CALL_RECEIVERS})\\s*\\.\\s*(_[A-Za-z][\\w$]*)\\s*\\?\\.\\s*\\(`,
    'g'
  );
  const bracketCall = new RegExp(
    `\\b(?:${OPTIONAL_CALL_RECEIVERS})\\s*\\[\\s*['"](_[A-Za-z][\\w$]*)['"]\\s*\\]\\s*\\?\\.\\s*\\(`,
    'g'
  );

  /** @type {Map<string, {files: Set<string>, calls: number}>} */
  const callSites = new Map();
  /** @type {Set<string>} */
  const declared = new Set();
  for (const [file, source] of entries) {
    for (const pattern of [dotCall, bracketCall]) {
      pattern.lastIndex = 0;
      let call;
      while ((call = pattern.exec(source)) !== null) {
        const record = callSites.get(call[1]);
        if (record) {
          record.files.add(file);
          record.calls += 1;
        } else callSites.set(call[1], { files: new Set([file]), calls: 1 });
      }
    }
    for (const pattern of METHOD_DEFINITION_PATTERNS) {
      pattern.lastIndex = 0;
      let declaration;
      while ((declaration = pattern.exec(source)) !== null) declared.add(declaration[1]);
    }
  }

  const rows = [];
  for (const [method, record] of callSites) {
    if (declared.has(method)) continue;
    rows.push({ method, files: [...record.files].sort(), calls: record.calls });
  }
  return rows.sort(
    (left, right) => right.calls - left.calls || left.method.localeCompare(right.method)
  );
}
