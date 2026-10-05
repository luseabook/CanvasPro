import { desktopBridge } from '../services/desktopBridge.js';
import { buildClipboardMediaSignature, clipboardImageBlobFromBase64 } from './clipboardMediaSignature.js';
const CLIPBOARD_GRAPH_SCHEMA_VERSION = 1;
let clipData = null,
  clipMeta = { copiedAt: 0, systemSignatureAtCopy: '', systemCopiedAt: 0, systemSignature: '' };
function buildClipboardSignatureFromReadResult({
  files: files = [],
  mediaType: mediaType = '',
  mediaSize: mediaSize = 0,
  text: text = '',
} = {}) {
  if (Array['isArray'](files) && files['length'] > 0) {
    const value = files['map']((error) => String(error?.['path'] || error?.['name'] || ''))
      ['filter'](Boolean)
      ['slice'](0, 8)
      ['join']('|');
    return 'files:' + value + '|len:' + files['length'];
  }
  if (mediaType) return 'media:' + String(mediaType)['toLowerCase']() + '|' + (Number(mediaSize) || 0);
  const list = String(text || '');
  if (!list['trim']()) return '';
  const item = list['slice'](0, 256);
  return 'text:' + item + '|len:' + list['length'];
}
function cloneJson(key) {
  return JSON['parse'](JSON['stringify'](key));
}
function normalizeNodeClipboardPayload(list2, { edges: edges = [] } = {}) {
  if (!Array['isArray'](list2) || list2['length'] === 0) return null;
  return {
    schemaVersion: CLIPBOARD_GRAPH_SCHEMA_VERSION,
    nodes: cloneJson(list2),
    edges: Array['isArray'](edges) ? cloneJson(edges) : [],
  };
}
async function captureElectronClipboardSignatureBestEffort() {
  const enabled = desktopBridge['clipboard'];
  if (!enabled['canUseFiles']() && !enabled['canUseImages']() && !enabled['canUseText']()) return '';
  try {
    if (typeof enabled['readFileReferences'] === 'function') {
      const files2 = await enabled['readFileReferences']();
      if (files2?.['ok'] && Array['isArray'](files2['files']) && files2['files']['length'] > 0) {
        const clipboardSignatureFromReadResult = buildClipboardSignatureFromReadResult({ files: files2['files'] });
        if (clipboardSignatureFromReadResult) return clipboardSignatureFromReadResult;
      }
    }
    if (typeof enabled['readImage'] === 'function') {
      const response = await enabled['readImage']();
      if (response?.['ok'] && response['dataBase64'])
        return await buildClipboardMediaSignature(
          clipboardImageBlobFromBase64(response['dataBase64'], response['mimeType'] || 'image/png'),
        );
    }
    if (typeof enabled['readText'] === 'function') {
      const text2 = await enabled['readText']();
      if (text2?.['ok'] && typeof text2['text'] === 'string') {
        const clipboardSignatureFromReadResult2 = buildClipboardSignatureFromReadResult({ text: text2['text'] });
        if (clipboardSignatureFromReadResult2) return clipboardSignatureFromReadResult2;
      }
    }
  } catch (index) {}
  return '';
}
async function captureSystemClipboardSignatureBestEffort() {
  const captureElectronClipboardSignatureBestEffort2 = await captureElectronClipboardSignatureBestEffort();
  if (captureElectronClipboardSignatureBestEffort2) return captureElectronClipboardSignatureBestEffort2;
  try {
    const result = globalThis?.['navigator']?.['clipboard'],
      data = typeof result?.['read'] === 'function',
      options = typeof result?.['readText'] === 'function';
    if (data) {
      const target = await result['read']();
      for (const source of target) {
        const next = source['types']['find'](
          (current) =>
            current['startsWith']('image/') ||
            current['startsWith']('video/') ||
            current['startsWith']('audio/'),
        );
        if (next) {
          const entry = await source['getType'](next);
          return await buildClipboardMediaSignature(entry, next);
        }
        if (source['types']['includes']('text/plain')) {
          const response2 = await source['getType']('text/plain'),
            text3 = await response2['text'](),
            clipboardSignatureFromReadResult3 = buildClipboardSignatureFromReadResult({ text: text3 });
          if (clipboardSignatureFromReadResult3) return clipboardSignatureFromReadResult3;
        }
      }
    }
    if (options) {
      const text4 = await result['readText']();
      return buildClipboardSignatureFromReadResult({ text: text4 });
    }
  } catch (record) {}
  return '';
}
export function markSystemClipboardWrite({
  signature: signature = '',
  mediaType: mediaType = '',
  mediaSize: mediaSize = 0,
  text: text = '',
} = {}) {
  const systemSignature =
    String(signature || '')['trim']() ||
    buildClipboardSignatureFromReadResult({ mediaType: mediaType, mediaSize: mediaSize, text: text });
  clipMeta = {
    ...clipMeta,
    systemCopiedAt: Date['now'](),
    systemSignature: systemSignature || clipMeta['systemSignature'] || '',
  };
}
export function observeSystemClipboardSignature(payload) {
  const systemSignature2 = String(payload || '')['trim']();
  if (!systemSignature2) return;
  clipMeta = { ...clipMeta, systemSignature: systemSignature2 };
}
export function setClipboard(handle, state = {}) {
  const nodeClipboardPayload = normalizeNodeClipboardPayload(handle, state);
  if (!nodeClipboardPayload) {
    ((clipData = null), (clipMeta = { ...clipMeta, copiedAt: 0, systemSignatureAtCopy: '' }));
    return;
  }
  clipData = nodeClipboardPayload;
  const copiedAt = Date['now']();
  ((clipMeta = {
    ...clipMeta,
    copiedAt: copiedAt,
    systemSignatureAtCopy: clipMeta['systemSignature'] || '',
  }),
    Promise['resolve']()
      ['then'](async () => {
        const systemSignatureAtCopy = await captureSystemClipboardSignatureBestEffort();
        if (!clipData) return;
        if (clipMeta['copiedAt'] !== copiedAt) return;
        clipMeta = {
          ...clipMeta,
          systemSignatureAtCopy: systemSignatureAtCopy || clipMeta['systemSignatureAtCopy'] || '',
        };
      })
      ['catch'](() => {}));
}
export function getClipboard() {
  if (!clipData) return null;
  if (Array['isArray'](clipData)) return cloneJson(clipData);
  return cloneJson(Array['isArray'](clipData['nodes']) ? clipData['nodes'] : []);
}
export function getClipboardGraph() {
  if (!clipData) return null;
  if (Array['isArray'](clipData))
    return { schemaVersion: CLIPBOARD_GRAPH_SCHEMA_VERSION, nodes: cloneJson(clipData), edges: [] };
  return {
    schemaVersion: CLIPBOARD_GRAPH_SCHEMA_VERSION,
    nodes: cloneJson(Array['isArray'](clipData['nodes']) ? clipData['nodes'] : []),
    edges: cloneJson(Array['isArray'](clipData['edges']) ? clipData['edges'] : []),
  };
}
export function getClipboardMeta() {
  return { ...clipMeta };
}
