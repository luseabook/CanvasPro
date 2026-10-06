import { normalizeTextResultSources } from './textResultMetadata.js';
export const TEXT_RESULT_IMAGE_LIMIT = 24;
export function normalizeTextResultImages(value) {
  const map = new Map();
  for (const item of Array.isArray(value) ? value : []) {
    const response = normalizeTextResultSources([item])[0];
    if (!response || map.has(response.url)) continue;
    const textResultSources = normalizeTextResultSources([{ url: item.pageUrl }])[0];
    map.set(response.url, { ...response, pageUrl: textResultSources?.url || '' });
    if (map.size >= TEXT_RESULT_IMAGE_LIMIT) break;
  }
  return [...map.values()];
}
function readDestination(key, count) {
  if (key[count] !== '(') return null;
  let index = count + 1;
  while (/\s/.test(key[index] || '') && index < key.length) index++;
  const enabled = key[index] === '<';
  if (enabled) index++;
  const result = index;
  let enabled2 = 0;
  while (index < key.length && index - count <= 8192) {
    const data = key[index];
    if (data === '\\') {
      index += 2;
      continue;
    }
    if (enabled && data === '>') break;
    if (!enabled) {
      if (data === '(') enabled2++;
      if (data === ')') {
        if (!enabled2) break;
        enabled2--;
      }
      if (/\s/.test(data)) break;
    }
    index++;
  }
  const options = key.slice(result, index).replace(/\\([\\()[\]<>])/g, '$1');
  if (enabled) {
    if (key[index] !== '>') return null;
    index++;
  }
  const target = key.slice(index).match(/^\s*(?:"[^"\n]*"|'[^'\n]*')?\s*\)/);
  return target ? { url: options, end: index + target[0].length } : null;
}
export function parseTextResultImages(source) {
  const next = String(source || ''),
    current = [],
    entry = next.replace(
      /(^|\n)[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:\n[ \t]*\2[^\n]*(?=\n|$)|$)|(`+)[^\n]*?\3/g,
      (list) => ' '.repeat(list.length),
    ),
    record = /!\[((?:\\.|[^\]\\\n])*)\]\(/g;
  for (const payload of entry.matchAll(record)) {
    if (current.length >= TEXT_RESULT_IMAGE_LIMIT) break;
    if (payload.index > 0 && entry[payload.index - 1] === '\\') continue;
    const destination = readDestination(next, payload.index + payload[0].length - 1);
    if (!destination) continue;
    const handle =
        entry[payload.index - 1] === '[' && next[destination.end] === ']'
          ? readDestination(next, destination.end + 1)
          : null,
      args = normalizeTextResultImages([
        { url: destination.url, title: payload[1].replace(/\\(.)/g, '$1'), pageUrl: handle?.url },
      ])[0];
    if (args)
      current.push({
        ...args,
        start: handle ? payload.index - 1 : payload.index,
        end: handle ? handle.end : destination.end,
      });
  }
  return current;
}
export function textResultImagePresentationText(state, config) {
  const map2 = new Set(normalizeTextResultImages(config).map((scope) => scope.url));
  if (!map2.size) return state;
  let input = String(state || '');
  for (const response2 of parseTextResultImages(input).reverse()) {
    if (map2.has(response2.url))
      input = input.slice(0, response2.start) + input.slice(response2.end);
  }
  return input;
}
