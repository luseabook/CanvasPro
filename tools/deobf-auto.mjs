// Derives readable names for `_0x` identifiers from how they are used.
//
//   node tools/deobf-auto.mjs <file.js> [--explain]
//
// Prints a rename map as JSON on stdout. It does not touch the file: review the
// map, then apply it with tools/deobf-rename.mjs and prove it with
// tools/deobf-verify.mjs.
//
// Names come from evidence, in priority order:
//   1. destructuring key          `{ nodeId: _0x12ab }`      -> nodeId
//   2. accessed property set      `x['classList']`, `x['style']` -> el
//   3. being called               `_0x12ab(...)`             -> handler
//   4. rest parameter             `(..._0x12ab)`             -> args
//   5. assigned from a factory    `_0x12ab = createFoo(...)` -> foo
//   6. value shape                compared with numbers / strings / booleans
//   7. fallback                   `value`, `value2`, ...
//
// The map is injective: no two names collapse onto the same identifier, so a
// rename can never introduce a redeclaration in an overlapping scope.
import fs from 'node:fs';

const OBF = /_0x[0-9a-f]{4,}/g;

// Property -> category. Enough to recognise the recurring shapes in this
// codebase; anything unmatched falls through to the generic names below.
const CATEGORIES = [
  {
    name: 'el',
    props: ['classList', 'style', 'dataset', 'setAttribute', 'appendChild', 'innerHTML', 'textContent', 'querySelector', 'querySelectorAll', 'children', 'addEventListener', 'removeEventListener', 'getBoundingClientRect', 'clientWidth', 'clientHeight', 'offsetWidth', 'offsetHeight', 'getContext', 'hidden', 'disabled', 'value', 'focus', 'click', 'remove', 'closest', 'parentNode', 'firstChild', 'insertBefore', 'removeChild', 'createElement', 'isConnected'],
  },
  { name: 'store', props: ['getState', 'getStateRaw', 'setState', 'subscribe', 'subscribeSelector', 'updateNodeData', 'dispatch', 'getIncomingEdges', 'commit'] },
  { name: 'child', props: ['pid', 'stdout', 'stderr', 'exitCode', 'killed', 'spawn', 'kill', 'signalCode'] },
  { name: 'list', props: ['map', 'filter', 'forEach', 'push', 'some', 'every', 'find', 'findIndex', 'reduce', 'length', 'slice', 'concat', 'includes', 'join', 'sort', 'flatMap', 'indexOf'] },
  { name: 'promise', props: ['then', 'catch', 'finally', 'resolve', 'reject', 'all', 'allSettled'] },
  { name: 'error', props: ['message', 'stack', 'name', 'cause'] },
  { name: 'event', props: ['preventDefault', 'stopPropagation', 'clientX', 'clientY', 'key', 'target', 'currentTarget', 'deltaY', 'pointerId', 'button'] },
  { name: 'box', props: ['width', 'height', 'x', 'y', 'zoom', 'scale', 'top', 'left', 'right', 'bottom'] },
  { name: 'ctx', props: ['fillStyle', 'strokeStyle', 'beginPath', 'drawImage', 'fillRect', 'clearRect', 'save', 'restore', 'lineTo', 'fillText'] },
  { name: 'dom', props: ['documentElement', 'body', 'head', 'activeElement', 'createRange', 'createTreeWalker', 'getSelection', 'execCommand', 'document', 'defaultView'] },
  { name: 'map', props: ['get', 'set', 'has', 'delete', 'keys', 'values', 'entries', 'clear'] },
  { name: 'response', props: ['ok', 'status', 'json', 'text', 'headers', 'url', 'success'] },
  { name: 'canvas', props: ['canvas', 'CanvasTabManager'] },
  { name: 'timer', props: ['unref', 'refresh'] },
];

const FALLBACKS = ['value', 'item', 'key', 'index', 'result', 'data', 'options', 'target', 'source', 'next', 'current', 'entry', 'record', 'payload', 'handle', 'state', 'config', 'scope', 'input', 'output'];

function unique(base, used) {
  const cleaned = String(base).replace(/[^A-Za-z0-9_$]/g, '') || 'value';
  const safe = /^[0-9]/.test(cleaned) ? 'v' + cleaned : cleaned;
  if (!used.has(safe)) {
    used.add(safe);
    return safe;
  }
  for (let suffix = 2; suffix < 200; suffix += 1) {
    const candidate = safe + suffix;
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
  }
  return safe + '_';
}

function collect(match, key, into) {
  if (!into.has(match[1])) into.set(match[1], new Set());
  if (key) into.get(match[1]).add(key);
}

function main() {
  const args = process.argv.slice(2).filter(argument => argument !== '--explain');
  const explain = process.argv.includes('--explain');
  const path = args[0];
  if (!path) {
    console.error('usage: node tools/deobf-auto.mjs <file.js> [--explain]');
    process.exit(2);
  }
  const source = fs.readFileSync(path, 'utf8');
  const names = [...new Set(source.match(OBF) || [])];
  if (!names.length) {
    console.log('{}');
    return;
  }

  // Identifiers must never be renamed where they name data rather than a binding.
  const protectedNames = new Set();
  for (const match of source.matchAll(/\.\s*(_0x[0-9a-f]{4,})\b/g)) protectedNames.add(match[1]);
  for (const match of source.matchAll(/([{,]\s*)(_0x[0-9a-f]{4,})\s*:/g)) protectedNames.add(match[2]);
  // `...spread` is not a member access; keep those names eligible.
  for (const name of [...protectedNames]) {
    const memberUses = source.match(new RegExp('(?<!\\.)\\.\\s*' + name + '\\b', 'g')) || [];
    if (!memberUses.length) protectedNames.delete(name);
  }

  const props = new Map();
  const destructured = new Map();
  const called = new Set();
  const rest = new Set();
  const fromFactory = new Map();
  const comparedToNumber = new Set();
  const booleanOnly = new Set();
  const declarationKind = new Map();

  for (const match of source.matchAll(/\b(_0x[0-9a-f]{4,})\s*\[\s*'([^']+)'\s*\]/g)) collect(match, match[2], props);
  for (const match of source.matchAll(/\b(_0x[0-9a-f]{4,})\s*(?!\[)\.\s*([A-Za-z_$][\w$]*)/g)) collect(match, match[2], props);
  for (const match of source.matchAll(/([A-Za-z_$][\w$]*)\s*:\s*(_0x[0-9a-f]{4,})\b/g)) {
    if (!destructured.has(match[2])) destructured.set(match[2], match[1]);
  }
  for (const match of source.matchAll(/\b(_0x[0-9a-f]{4,})\s*\(/g)) called.add(match[1]);
  for (const match of source.matchAll(/\.\.\.\s*(_0x[0-9a-f]{4,})\b/g)) rest.add(match[1]);
  for (const match of source.matchAll(/\b(_0x[0-9a-f]{4,})\s*=\s*(?:await\s+)?(?:new\s+)?([A-Za-z_$][\w$]*)\s*\(/g)) {
    if (!fromFactory.has(match[1])) fromFactory.set(match[1], match[2]);
  }
  for (const match of source.matchAll(/(?:function|const|let|var)\s+(_0x[0-9a-f]{4,})\b/g)) {
    if (!declarationKind.has(match[1])) declarationKind.set(match[1], 'function');
  }
  for (const match of source.matchAll(/\b(_0x[0-9a-f]{4,})\s*(?:===|!==|==|!=|<=|>=|<|>)\s*[0-9]/g)) comparedToNumber.add(match[1]);
  for (const match of source.matchAll(/!\s*(_0x[0-9a-f]{4,})\b/g)) booleanOnly.add(match[1]);

  // Shape evidence: a literal or constructor on the right hand side, or the
  // default value of a parameter, says more than a bare fallback name.
  const shape = new Map();
  const setShape = (name, kind) => {
    if (!shape.has(name)) shape.set(name, kind);
  };
  const SHAPE_PATTERNS = [
    [/=\s*new Map\s*\(/, 'map'],
    [/=\s*new Set\s*\(/, 'set'],
    [/=\s*new WeakMap\s*\(/, 'weakMap'],
    [/=\s*\[\]/, 'list'],
    [/=\s*\{\}/, 'object'],
    [/=\s*''/, 'text'],
    [/=\s*(?:!\[\]|false)\b/, 'enabled'],
    [/=\s*(?:0x0|0)\b/, 'count'],
    [/=\s*document\s*\./, 'el'],
    [/=\s*new Error\s*\(/, 'error'],
  ];
  for (const [pattern, kind] of SHAPE_PATTERNS) {
    const finder = new RegExp('\\b(_0x[0-9a-f]{4,})\\s*' + pattern.source.slice(1), 'g');
    for (const match of source.matchAll(finder)) setShape(match[1], kind);
  }
  for (const match of source.matchAll(/\(\s*(_0x[0-9a-f]{4,})\s*=\s*(\{\}|\[\]|null|!\[\])\s*[,)]/g)) {
    setShape(match[1], { '{}': 'options', '[]': 'list', null: 'value', '![]': 'enabled' }[match[2]]);
  }
  // Callback parameters of the array helpers iterate items.
  const callbackParam = new Set();
  for (const match of source.matchAll(/\.(?:map|filter|forEach|some|every|find|findIndex|reduce|flatMap|sort)\s*\(\s*(?:\(\s*)?(_0x[0-9a-f]{4,})\b/g)) {
    callbackParam.add(match[1]);
  }
  // Anything holding the canvas node table is store state.
  const stateLike = new Set();
  for (const match of source.matchAll(/\b(_0x[0-9a-f]{4,})\s*\[\s*'(?:nodes|edges|selectedNodeIds)'\s*\]/g)) stateLike.add(match[1]);

  const used = new Set();
  const map = {};
  const reasons = {};
  for (const name of names) {
    if (protectedNames.has(name)) continue;

    if (destructured.has(name)) {
      map[name] = unique(destructured.get(name), used);
      reasons[name] = 'destructuring key';
      continue;
    }

    const accessed = props.get(name);
    if (accessed && accessed.size) {
      let best = null;
      let bestScore = 0;
      for (const category of CATEGORIES) {
        const score = category.props.filter(property => accessed.has(property)).length;
        if (score > bestScore) {
          bestScore = score;
          best = category.name;
        }
      }
      if (best) {
        map[name] = unique(best, used);
        reasons[name] = 'properties: ' + [...accessed].slice(0, 4).join(',');
        continue;
      }
    }

    if (called.has(name)) {
      map[name] = unique(declarationKind.get(name) === 'function' ? 'run' : 'handler', used);
      reasons[name] = 'called';
      continue;
    }

    if (rest.has(name)) {
      map[name] = unique('args', used);
      reasons[name] = 'rest parameter';
      continue;
    }

    if (fromFactory.has(name)) {
      const callee = fromFactory.get(name);
      const isBuiltin = /^(String|Number|Boolean|Array|Object|JSON|Math|Date|Set|Map|WeakMap|Promise|parseInt|parseFloat)$/.test(callee);
      if (!isBuiltin && !/^_0x/.test(callee)) {
        // `urlToLocalPath` -> LocalPath, `normalizeLocalPath` -> LocalPath,
        // `firstNode` -> Node; keep the noun's original casing.
        let stem = callee.replace(/^[a-z][A-Za-z0-9]*To(?=[A-Z])/, '');
        stem = stem.replace(/^(create|build|make|resolve|read|load|parse|normalize|get|first|last|collect|compute|derive|ensure|apply|merge|pick|select|find|new)/, '') || stem;
        const derived = stem.charAt(0).toLowerCase() + stem.slice(1);
        if (derived) {
          map[name] = unique(derived, used);
          reasons[name] = 'created by ' + callee;
          continue;
        }
      }
    }

    if (booleanOnly.has(name)) {
      map[name] = unique('enabled', used);
      reasons[name] = 'used as a boolean';
      continue;
    }

    if (comparedToNumber.has(name)) {
      map[name] = unique('count', used);
      reasons[name] = 'compared with a number';
      continue;
    }

    if (stateLike.has(name)) {
      map[name] = unique('state', used);
      reasons[name] = 'holds nodes/edges';
      continue;
    }

    if (shape.has(name)) {
      const kind = shape.get(name);
      map[name] = unique(kind, used);
      reasons[name] = 'shape: ' + kind;
      continue;
    }

    if (callbackParam.has(name)) {
      map[name] = unique('item', used);
      reasons[name] = 'array callback parameter';
      continue;
    }

    map[name] = unique(FALLBACKS.find(candidate => !used.has(candidate)) || 'value', used);
    reasons[name] = 'fallback';
  }

  console.log(JSON.stringify(map, null, 2));
  if (explain) {
    for (const [from, to] of Object.entries(map)) console.error('  ' + from + ' -> ' + to + '  (' + reasons[from] + ')');
    for (const name of protectedNames) console.error('  kept: ' + name + '  (used as a property name)');
  }
}

main();
