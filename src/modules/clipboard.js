const CLIPBOARD_GRAPH_SCHEMA_VERSION = 1;
let clipData = null,
  clipMeta = { copiedAt: 0, systemSignatureAtCopy: '', systemCopiedAt: 0, systemSignature: '' };
function buildClipboardSignatureFromReadResult({
  files: files = [],
  mediaType: mediaType = '',
  mediaSize: mediaSize = 0,
  text: text = '',
} = {}) {
  if (Array.isArray(files) && files.length > 0) {
    const value = files
      .map((error) => String(error?.path || error?.name || ''))
      .filter(Boolean)
      .slice(0, 8)
      .join('|');
    return 'files:' + value + '|len:' + files.length;
  }
  if (mediaType) return 'media:' + String(mediaType).toLowerCase() + '|' + (Number(mediaSize) || 0);
  const list = String(text || '');
  if (!list.trim()) return '';
  const item = list.slice(0, 0x100);
  return 'text:' + item + '|len:' + list.length;
}
function cloneJson(key) {
  return JSON.parse(JSON.stringify(key));
}
function normalizeNodeClipboardPayload(list2, { edges: edges = [] } = {}) {
  if (!Array.isArray(list2) || list2.length === 0) return null;
  return {
    schemaVersion: CLIPBOARD_GRAPH_SCHEMA_VERSION,
    nodes: cloneJson(list2),
    edges: Array.isArray(edges) ? cloneJson(edges) : [],
  };
}
function getBase64ByteLength(index) {
  const list3 = String(index || '').replace(/\s/g, '');
  if (!list3) return 0;
  const result = list3.endsWith('==') ? 2 : list3.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((list3.length * 3) / 4) - result);
}
async function captureElectronClipboardSignatureBestEffort() {
  const enabled = globalThis?.window?.electronAPI?.clipboard;
  if (!enabled) return '';
  try {
    if (typeof enabled.readFileReferences === 'function') {
      const files2 = await enabled.readFileReferences();
      if (files2?.ok && Array.isArray(files2.files) && files2.files.length > 0) {
        const clipboardSignatureFromReadResult = buildClipboardSignatureFromReadResult({
          files: files2.files,
        });
        if (clipboardSignatureFromReadResult) return clipboardSignatureFromReadResult;
      }
    }
    if (typeof enabled.readImage === 'function') {
      const response = await enabled.readImage();
      if (response?.ok && response.dataBase64) {
        const clipboardSignatureFromReadResult2 = buildClipboardSignatureFromReadResult({
          mediaType: String(response.mimeType || 'image/png'),
          mediaSize: getBase64ByteLength(response.dataBase64),
        });
        if (clipboardSignatureFromReadResult2) return clipboardSignatureFromReadResult2;
      }
    }
    if (typeof enabled.readText === 'function') {
      const text2 = await enabled.readText();
      if (text2?.ok && typeof text2.text === 'string') {
        const clipboardSignatureFromReadResult3 = buildClipboardSignatureFromReadResult({ text: text2.text });
        if (clipboardSignatureFromReadResult3) return clipboardSignatureFromReadResult3;
      }
    }
  } catch (data) {}
  return '';
}
async function captureSystemClipboardSignatureBestEffort() {
  const captureElectronClipboardSignatureBestEffort2 = await captureElectronClipboardSignatureBestEffort();
  if (captureElectronClipboardSignatureBestEffort2) return captureElectronClipboardSignatureBestEffort2;
  try {
    const options = globalThis?.navigator?.clipboard,
      target = typeof options?.read === 'function',
      source = typeof options?.readText === 'function';
    if (target) {
      const next = await options.read();
      for (const current of next) {
        const mediaType2 = current.types.find(
          (item2) => item2.startsWith('image/') || item2.startsWith('video/') || item2.startsWith('audio/'),
        );
        if (mediaType2) {
          const mediaSize2 = await current.getType(mediaType2);
          return buildClipboardSignatureFromReadResult({
            mediaType: mediaType2,
            mediaSize: mediaSize2?.size || 0,
          });
        }
        if (current.types.includes('text/plain')) {
          const response2 = await current.getType('text/plain'),
            text3 = await response2.text(),
            clipboardSignatureFromReadResult4 = buildClipboardSignatureFromReadResult({ text: text3 });
          if (clipboardSignatureFromReadResult4) return clipboardSignatureFromReadResult4;
        }
      }
    }
    if (source) {
      const text4 = await options.readText();
      return buildClipboardSignatureFromReadResult({ text: text4 });
    }
  } catch (entry) {}
  return '';
}
export function markSystemClipboardWrite({
  signature: signature = '',
  mediaType: mediaType = '',
  mediaSize: mediaSize = 0,
  text: text = '',
} = {}) {
  const systemSignature =
    String(signature || '').trim() ||
    buildClipboardSignatureFromReadResult({ mediaType: mediaType, mediaSize: mediaSize, text: text });
  clipMeta = {
    ...clipMeta,
    systemCopiedAt: Date.now(),
    systemSignature: systemSignature || clipMeta.systemSignature || '',
  };
}
export function observeSystemClipboardSignature(record) {
  const systemSignature2 = String(record || '').trim();
  if (!systemSignature2) return;
  clipMeta = { ...clipMeta, systemSignature: systemSignature2 };
}
export function setClipboard(payload, handle = {}) {
  const nodeClipboardPayload = normalizeNodeClipboardPayload(payload, handle);
  if (!nodeClipboardPayload) {
    ((clipData = null), (clipMeta = { ...clipMeta, copiedAt: 0, systemSignatureAtCopy: '' }));
    return;
  }
  clipData = nodeClipboardPayload;
  const copiedAt = Date.now();
  ((clipMeta = { ...clipMeta, copiedAt: copiedAt, systemSignatureAtCopy: clipMeta.systemSignature || '' }),
    Promise.resolve()
      .then(async () => {
        const systemSignatureAtCopy = await captureSystemClipboardSignatureBestEffort();
        if (!clipData) return;
        if (clipMeta.copiedAt !== copiedAt) return;
        clipMeta = {
          ...clipMeta,
          systemSignatureAtCopy: systemSignatureAtCopy || clipMeta.systemSignatureAtCopy || '',
        };
      })
      .catch(() => {}));
}
export function getClipboard() {
  if (!clipData) return null;
  if (Array.isArray(clipData)) return cloneJson(clipData);
  return cloneJson(Array.isArray(clipData.nodes) ? clipData.nodes : []);
}
export function getClipboardGraph() {
  if (!clipData) return null;
  if (Array.isArray(clipData))
    return { schemaVersion: CLIPBOARD_GRAPH_SCHEMA_VERSION, nodes: cloneJson(clipData), edges: [] };
  return {
    schemaVersion: CLIPBOARD_GRAPH_SCHEMA_VERSION,
    nodes: cloneJson(Array.isArray(clipData.nodes) ? clipData.nodes : []),
    edges: cloneJson(Array.isArray(clipData.edges) ? clipData.edges : []),
  };
}
export function getClipboardMeta() {
  return { ...clipMeta };
}
