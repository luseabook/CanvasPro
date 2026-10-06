function candidateKey(value) {
  return value.origin === 'asset'
    ? 'asset:' + value.assetId + ':' + (value.assetIndex ?? 0)
    : 'node:' + value.nodeId;
}
const WORD = /[\p{L}\p{N}_-]/u;
export function matchPromptMentions(name, item = []) {
  const key = { children: new Map() };
  for (const index of item) {
    if (index.pillKind || index.missingAsset) continue;
    for (const result of [index.label, index.refLabel, index.assetName]) {
      const enabled = String(result || '')
        .trim()
        .replace(/^[@＠]+/, '');
      if (!enabled) continue;
      let el = key;
      for (const data of enabled.toLowerCase()) {
        if (!el.children.has(data)) el.children.set(data, { children: new Map() });
        el = el.children.get(data);
      }
      ((el.candidates ||= new Map()), el.candidates.set(candidateKey(index), index));
    }
  }
  const list = [];
  for (let start = 0; start < name.length; start += 1) {
    if (!/[@＠]/.test(name[start])) continue;
    if (start && /[a-z0-9_@＠.]/i.test(name[start - 1])) continue;
    let el2 = key,
      options = null;
    for (let end = start + 1; end < name.length;) {
      const list2 = String.fromCodePoint(name.codePointAt(end));
      el2 = el2.children.get(list2.toLowerCase());
      if (!el2) break;
      end += list2.length;
      const enabled2 = name[end] || '',
        target =
          !enabled2 ||
          !WORD.test(enabled2) ||
          (/[a-z0-9]/i.test(list2) && /\p{Script=Han}/u.test(enabled2));
      el2.candidates &&
        target &&
        (options = {
          start: start,
          end: end,
          name: name.slice(start + 1, end),
          candidates: [...el2.candidates.values()],
        });
    }
    if (options) (list.push(options), (start = options.end - 1));
    else {
      const name2 = name.slice(start + 1).match(/^[\p{L}\p{N}_-]+/u)?.[0];
      name2 &&
        (list.push({
          start: start,
          end: start + 1 + name2.length,
          name: name2,
          candidates: [],
        }),
        (start += name2.length));
    }
  }
  return list;
}
