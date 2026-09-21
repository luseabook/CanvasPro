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
    const _0x54ae15 = files
      .map((_0x38a00f) => String(_0x38a00f?.path || _0x38a00f?.name || ''))
      .filter(Boolean)
      .slice(0, 8)
      .join('|');
    return 'files:' + _0x54ae15 + '|len:' + files.length;
  }
  if (mediaType) return 'media:' + String(mediaType).toLowerCase() + '|' + (Number(mediaSize) || 0);
  const _0x56f8b3 = String(text || '');
  if (!_0x56f8b3.trim()) return '';
  const _0x49f3d8 = _0x56f8b3.slice(0, 0x100);
  return 'text:' + _0x49f3d8 + '|len:' + _0x56f8b3.length;
}
function cloneJson(_0x352c9a) {
  return JSON.parse(JSON.stringify(_0x352c9a));
}
function normalizeNodeClipboardPayload(_0x439b28, { edges: edges = [] } = {}) {
  if (!Array.isArray(_0x439b28) || _0x439b28.length === 0) return null;
  return {
    schemaVersion: CLIPBOARD_GRAPH_SCHEMA_VERSION,
    nodes: cloneJson(_0x439b28),
    edges: Array.isArray(edges) ? cloneJson(edges) : [],
  };
}
function getBase64ByteLength(_0x92c09a) {
  const _0x5cc8a8 = String(_0x92c09a || '').replace(/\s/g, '');
  if (!_0x5cc8a8) return 0;
  const _0x12149d = _0x5cc8a8.endsWith('==') ? 2 : _0x5cc8a8.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((_0x5cc8a8.length * 3) / 4) - _0x12149d);
}
async function captureElectronClipboardSignatureBestEffort() {
  const _0x4bbda9 = globalThis?.window?.electronAPI?.clipboard;
  if (!_0x4bbda9) return '';
  try {
    if (typeof _0x4bbda9.readFileReferences === 'function') {
      const _0x3d0b71 = await _0x4bbda9.readFileReferences();
      if (_0x3d0b71?.ok && Array.isArray(_0x3d0b71.files) && _0x3d0b71.files.length > 0) {
        const _0x40eed0 = buildClipboardSignatureFromReadResult({ files: _0x3d0b71.files });
        if (_0x40eed0) return _0x40eed0;
      }
    }
    if (typeof _0x4bbda9.readImage === 'function') {
      const _0x41b3f3 = await _0x4bbda9.readImage();
      if (_0x41b3f3?.ok && _0x41b3f3.dataBase64) {
        const _0x1194f1 = buildClipboardSignatureFromReadResult({
          mediaType: String(_0x41b3f3.mimeType || 'image/png'),
          mediaSize: getBase64ByteLength(_0x41b3f3.dataBase64),
        });
        if (_0x1194f1) return _0x1194f1;
      }
    }
    if (typeof _0x4bbda9.readText === 'function') {
      const _0x5e60ab = await _0x4bbda9.readText();
      if (_0x5e60ab?.ok && typeof _0x5e60ab.text === 'string') {
        const _0x53126f = buildClipboardSignatureFromReadResult({ text: _0x5e60ab.text });
        if (_0x53126f) return _0x53126f;
      }
    }
  } catch (_0x13975f) {}
  return '';
}
async function captureSystemClipboardSignatureBestEffort() {
  const _0x2461a6 = await captureElectronClipboardSignatureBestEffort();
  if (_0x2461a6) return _0x2461a6;
  try {
    const _0xd4a125 = globalThis?.navigator?.clipboard,
      _0x26ffca = typeof _0xd4a125?.read === 'function',
      _0x391dae = typeof _0xd4a125?.readText === 'function';
    if (_0x26ffca) {
      const _0x589858 = await _0xd4a125.read();
      for (const _0x6cc73a of _0x589858) {
        const _0x196724 = _0x6cc73a.types.find(
          (_0x39eca7) =>
            _0x39eca7.startsWith('image/') ||
            _0x39eca7.startsWith('video/') ||
            _0x39eca7.startsWith('audio/'),
        );
        if (_0x196724) {
          const _0x4f58b7 = await _0x6cc73a.getType(_0x196724);
          return buildClipboardSignatureFromReadResult({
            mediaType: _0x196724,
            mediaSize: _0x4f58b7?.size || 0,
          });
        }
        if (_0x6cc73a.types.includes('text/plain')) {
          const _0x20de91 = await _0x6cc73a.getType('text/plain'),
            _0x230bb2 = await _0x20de91.text(),
            _0x24e63a = buildClipboardSignatureFromReadResult({ text: _0x230bb2 });
          if (_0x24e63a) return _0x24e63a;
        }
      }
    }
    if (_0x391dae) {
      const _0x4efe1d = await _0xd4a125.readText();
      return buildClipboardSignatureFromReadResult({ text: _0x4efe1d });
    }
  } catch (_0x4c5cfd) {}
  return '';
}
export function markSystemClipboardWrite({
  signature: signature = '',
  mediaType: mediaType = '',
  mediaSize: mediaSize = 0,
  text: text = '',
} = {}) {
  const _0x348c5c =
    String(signature || '').trim() ||
    buildClipboardSignatureFromReadResult({ mediaType: mediaType, mediaSize: mediaSize, text: text });
  clipMeta = {
    ...clipMeta,
    systemCopiedAt: Date.now(),
    systemSignature: _0x348c5c || clipMeta.systemSignature || '',
  };
}
export function observeSystemClipboardSignature(_0x6cfd4a) {
  const _0x117b77 = String(_0x6cfd4a || '').trim();
  if (!_0x117b77) return;
  clipMeta = { ...clipMeta, systemSignature: _0x117b77 };
}
export function setClipboard(_0x373888, _0x50b5e9 = {}) {
  const _0x586906 = normalizeNodeClipboardPayload(_0x373888, _0x50b5e9);
  if (!_0x586906) {
    ((clipData = null), (clipMeta = { ...clipMeta, copiedAt: 0, systemSignatureAtCopy: '' }));
    return;
  }
  clipData = _0x586906;
  const _0x18f6c3 = Date.now();
  ((clipMeta = { ...clipMeta, copiedAt: _0x18f6c3, systemSignatureAtCopy: clipMeta.systemSignature || '' }),
    Promise.resolve()
      .then(async () => {
        const _0x56c6d1 = await captureSystemClipboardSignatureBestEffort();
        if (!clipData) return;
        if (clipMeta.copiedAt !== _0x18f6c3) return;
        clipMeta = { ...clipMeta, systemSignatureAtCopy: _0x56c6d1 || clipMeta.systemSignatureAtCopy || '' };
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
