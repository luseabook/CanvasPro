import { createDefaultCommentNoteStyle } from '../../components/commentNoteStyle.js';
import { findAvailablePosition, generateId, screenToWorld } from '../../core/math.js';
import { t } from '../../i18n/index.js';
import { getNodeSpawnPrefs } from '../nodeSpawn.js';
function getMimeExtension(_0x3f3b55, _0x43bf8b = 'bin') {
  const _0x4f2e86 = String(_0x3f3b55 || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (!_0x4f2e86.includes('/')) return _0x43bf8b;
  const _0x397ec3 = _0x4f2e86.split('/')[1] || _0x43bf8b;
  return _0x397ec3.replace(/[^a-z0-9]/g, '') || _0x43bf8b;
}
function buildSystemClipboardSignature({
  pastedMedia: _0x2b340d,
  pastedText: _0x2d31fd,
  pastedFiles: _0x4341f5,
}) {
  if (Array.isArray(_0x4341f5) && _0x4341f5.length > 0) {
    const _0x34f2f5 = _0x4341f5
      .map((_0x108201) => String(_0x108201?.path || _0x108201?.name || ''))
      .filter(Boolean)
      .slice(0, 8)
      .join('|');
    return 'files:' + _0x34f2f5 + '|len:' + _0x4341f5.length;
  }
  if (_0x2b340d?.mimeType) {
    const _0x284a2e = String(_0x2b340d.mimeType).toLowerCase(),
      _0x5ca084 = Number(_0x2b340d?.blob?.size) || 0;
    return 'media:' + _0x284a2e + '|' + _0x5ca084;
  }
  const _0x446aa1 = String(_0x2d31fd || '');
  if (!_0x446aa1.trim()) return '';
  const _0x16975a = _0x446aa1.slice(0, 0x100);
  return 'text:' + _0x16975a + '|len:' + _0x446aa1.length;
}
function resolvePastedMediaDescriptor(_0xf4f063, _0x197c3c = {}) {
  const _0x1504d5 = String(_0x197c3c.nodeName || _0x197c3c.name || '').trim(),
    _0x1c51fc = String(_0x197c3c.typeSlug || '').trim();
  if (_0xf4f063.startsWith('image/'))
    return {
      nodeType: 'source-image',
      nodeName: _0x1504d5 || t('canvasNodeFlows.paste.nodeName.image'),
      typeSlug: _0x1c51fc || 'image',
    };
  if (_0xf4f063.startsWith('video/'))
    return {
      nodeType: 'source-video',
      nodeName: _0x1504d5 || t('canvasNodeFlows.paste.nodeName.video'),
      typeSlug: _0x1c51fc || 'video',
    };
  if (_0xf4f063.startsWith('audio/'))
    return {
      nodeType: 'source-audio',
      nodeName: _0x1504d5 || t('canvasNodeFlows.paste.nodeName.audio'),
      typeSlug: _0x1c51fc || 'audio',
    };
  return null;
}
function centerNodeAtWorldPosition(_0x41572a, _0x2408ed, _0x13c76f) {
  const _0x1ca5f8 = Number(_0x41572a?.width) || 0,
    _0x1784ac = Number(_0x41572a?.height) || 0;
  return { ..._0x41572a, x: _0x2408ed - _0x1ca5f8 / 2, y: _0x13c76f - _0x1784ac / 2 };
}
function decodeBase64Bytes(_0x574ea4) {
  const _0x47e637 = String(_0x574ea4 || '').trim();
  if (!_0x47e637) return new Uint8Array();
  if (typeof atob === 'function') {
    const _0xfd77b8 = atob(_0x47e637),
      _0x153065 = new Uint8Array(_0xfd77b8.length);
    for (let _0x42f4e8 = 0; _0x42f4e8 < _0xfd77b8.length; _0x42f4e8 += 1) {
      _0x153065[_0x42f4e8] = _0xfd77b8.charCodeAt(_0x42f4e8);
    }
    return _0x153065;
  }
  if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(_0x47e637, 'base64'));
  return new Uint8Array();
}
function blobFromBase64(_0x2bc25f, _0x395393) {
  const _0x16439d = decodeBase64Bytes(_0x2bc25f);
  if (!_0x16439d.length) return null;
  return new Blob([_0x16439d], { type: _0x395393 || 'application/octet-stream' });
}
function normalizeSpawnDirection(_0x362ff1) {
  return _0x362ff1 === 'left' || _0x362ff1 === 'down' ? _0x362ff1 : 'right';
}
function getSequenceNodes(_0x3a8c3d, _0x368e73) {
  if (!_0x368e73 || !_0x3a8c3d || typeof _0x3a8c3d !== 'object') return {};
  return Object.fromEntries(
    Object.entries(_0x3a8c3d).filter(
      ([, _0x51ffa7]) => String(_0x51ffa7?.spawnSequenceKey || '') === _0x368e73,
    ),
  );
}
async function readElectronClipboardContents() {
  const _0x54eebd = globalThis?.window?.electronAPI?.clipboard;
  if (!_0x54eebd) return { pastedFiles: [], pastedMedia: null, pastedText: '', failed: false };
  const _0x375f71 = { pastedFiles: [], pastedMedia: null, pastedText: '', failed: false };
  try {
    if (typeof _0x54eebd.readFileReferences === 'function') {
      const _0x5a9fa6 = await _0x54eebd.readFileReferences();
      _0x5a9fa6?.ok && Array.isArray(_0x5a9fa6.files) && (_0x375f71.pastedFiles = _0x5a9fa6.files);
    }
    if (_0x375f71.pastedFiles.length === 0 && typeof _0x54eebd.readImage === 'function') {
      const _0x4aab26 = await _0x54eebd.readImage();
      if (_0x4aab26?.ok && _0x4aab26.dataBase64) {
        const _0x2cacfe = String(_0x4aab26.mimeType || 'image/png'),
          _0x3955f7 = blobFromBase64(_0x4aab26.dataBase64, _0x2cacfe);
        _0x3955f7 && (_0x375f71.pastedMedia = { mimeType: _0x2cacfe, blob: _0x3955f7 });
      }
    }
    if (typeof _0x54eebd.readText === 'function') {
      const _0x3dd122 = await _0x54eebd.readText();
      _0x3dd122?.ok && typeof _0x3dd122.text === 'string' && (_0x375f71.pastedText = _0x3dd122.text);
    }
  } catch (_0x3e5073) {
    (console.warn('[paste] Electron 剪贴板读取失败:', _0x3e5073), (_0x375f71.failed = true));
  }
  return _0x375f71;
}
async function readSystemClipboardContents() {
  let _0x4e7f33 = null,
    _0x2d4256 = '',
    _0x52e374 = [],
    _0x4f98a3 = false;
  const _0x3ff438 = await readElectronClipboardContents();
  ((_0x52e374 = _0x3ff438.pastedFiles),
    (_0x4e7f33 = _0x3ff438.pastedMedia),
    (_0x2d4256 = _0x3ff438.pastedText),
    (_0x4f98a3 = !!_0x3ff438.failed));
  try {
    const _0x3bcc81 = globalThis?.navigator?.clipboard,
      _0xb64896 = typeof _0x3bcc81?.read === 'function',
      _0x426569 = typeof _0x3bcc81?.readText === 'function';
    if (_0x52e374.length === 0 && !_0x4e7f33 && _0xb64896) {
      const _0x2c24ca = await _0x3bcc81.read();
      for (const _0x4ed5d6 of _0x2c24ca) {
        const _0x40a6be = _0x4ed5d6.types.find(
          (_0x4182af) =>
            _0x4182af.startsWith('image/') ||
            _0x4182af.startsWith('video/') ||
            _0x4182af.startsWith('audio/'),
        );
        if (!_0x4e7f33 && _0x40a6be) {
          _0x4e7f33 = { mimeType: _0x40a6be, blob: await _0x4ed5d6.getType(_0x40a6be) };
          continue;
        }
        if (!_0x2d4256 && _0x4ed5d6.types.includes('text/plain')) {
          const _0x3f1544 = await _0x4ed5d6.getType('text/plain');
          _0x2d4256 = await _0x3f1544.text();
        }
      }
    }
    !_0x2d4256 && _0x426569 && (_0x2d4256 = await _0x3bcc81.readText());
  } catch (_0x8ea037) {
    (console.warn('[paste] 剪贴板读取失败:', _0x8ea037), (_0x4f98a3 = true));
  }
  return {
    pastedFiles: _0x52e374,
    pastedMedia: _0x4e7f33,
    pastedText: _0x2d4256,
    clipboardReadFailed: _0x4f98a3,
  };
}
export function createAppCanvasNodeFlows({
  graphStore: _0x232205,
  commit: _0x121662,
  getCursorScreenPosition: _0x217380,
  getNodeDefaultSize: _0x5e30e0,
  getAIGenerationDefaultSizeByType: _0x3f2468,
  getAIGenerationNodeSize: _0x573d6b,
  createPanoramaNodeDataByType: _0x64efca,
  processFile: _0x3c1a9b,
  executeCommand: _0x8a019b,
  getCurrentProjectId: _0x57c8d1,
  showToast: _0xa183f,
  loadClipboardModule: loadClipboardModule = () => import('../clipboard.js'),
} = {}) {
  function _0x549398() {
    return _0x232205?.getStateRaw?.() ?? _0x232205?.getState?.() ?? {};
  }
  function _0x3af476(_0x5d3bcc = {}) {
    if (_0x5d3bcc.placement === 'viewport-center-sequence') return _0x2b1d5b();
    const _0x5b7920 = _0x217380?.() || {},
      _0x5b0a5b =
        typeof _0x5b7920.x === 'number' && Number.isFinite(_0x5b7920.x) ? _0x5b7920.x : window.innerWidth / 2,
      _0x170fa3 =
        typeof _0x5b7920.y === 'number' && Number.isFinite(_0x5b7920.y)
          ? _0x5b7920.y
          : window.innerHeight / 2,
      _0x34c955 =
        typeof _0x5d3bcc.screenX === 'number' && Number.isFinite(_0x5d3bcc.screenX)
          ? _0x5d3bcc.screenX
          : _0x5b0a5b,
      _0x5bf50b =
        typeof _0x5d3bcc.screenY === 'number' && Number.isFinite(_0x5d3bcc.screenY)
          ? _0x5d3bcc.screenY
          : _0x170fa3,
      { viewport: _0x17f63b } = _0x549398();
    return screenToWorld(_0x34c955, _0x5bf50b, _0x17f63b);
  }
  function _0x2b1d5b() {
    const _0x16fc90 = window.innerWidth / 2,
      _0x56a241 = window.innerHeight / 2,
      { viewport: _0x42ca43 } = _0x549398();
    return screenToWorld(_0x16fc90, _0x56a241, _0x42ca43);
  }
  function _0x3e727b(_0x3a1b7d, _0x10cb97, _0x51a427, _0x52e76c, _0x1b2c0e = {}) {
    const { x: _0x544551, y: _0xdfeb98 } = _0x3af476(_0x1b2c0e),
      _0x56d588 = generateId(_0x3a1b7d),
      _0x33043b =
        _0x3a1b7d === 'ai-text'
          ? _0x3f2468('ai-text')
          : _0x3a1b7d === 'ai-image' || _0x3a1b7d === 'ai-video'
            ? _0x573d6b(_0x10cb97, _0x51a427)
            : { width: _0x10cb97, height: _0x51a427 },
      _0x1f1cb1 = _0x33043b.width,
      _0x2c2c61 = _0x33043b.height,
      _0x53c86e = _0x64efca?.({
        type: _0x3a1b7d,
        id: _0x56d588,
        x: _0x544551 - _0x1f1cb1 / 2,
        y: _0xdfeb98 - _0x2c2c61 / 2,
        width: _0x1f1cb1,
        height: _0x2c2c61,
        name: _0x52e76c,
      }) || {
        id: _0x56d588,
        type: _0x3a1b7d,
        x: _0x544551 - _0x1f1cb1 / 2,
        y: _0xdfeb98 - _0x2c2c61 / 2,
        width: _0x1f1cb1,
        height: _0x2c2c61,
        name: _0x52e76c,
      };
    _0x3a1b7d === 'comment-note' &&
      ((_0x53c86e.name = ''), (_0x53c86e.content = ''), (_0x53c86e.style = createDefaultCommentNoteStyle()));
    if (_0x1b2c0e.placement === 'viewport-center-sequence') {
      const { spacing: _0x56fab1, direction: _0x3c1251, avoidOverlap: _0x5bf912 } = getNodeSpawnPrefs(),
        _0x395738 = normalizeSpawnDirection(_0x3c1251),
        _0x6b9b7a = _0x544551 - _0x1f1cb1 / 2,
        _0x53166c = _0xdfeb98 - _0x2c2c61 / 2,
        _0x2cc25e = _0x549398().nodes || {},
        _0x5c6424 = String(_0x1b2c0e.sequenceKey || '').trim(),
        _0x2d01f4 = _0x5bf912 ? _0x2cc25e : getSequenceNodes(_0x2cc25e, _0x5c6424),
        _0x4cc574 = findAvailablePosition(
          _0x2d01f4,
          _0x6b9b7a,
          _0x53166c,
          _0x1f1cb1,
          _0x2c2c61,
          _0x56fab1,
          _0x395738,
        );
      ((_0x53c86e.x = _0x4cc574.x), (_0x53c86e.y = _0x4cc574.y));
      if (_0x5c6424) _0x53c86e.spawnSequenceKey = _0x5c6424;
    }
    return (
      _0x232205.addNode(_0x53c86e),
      _0x232205.setSelectedNodes([_0x56d588]),
      _0x1b2c0e.skipCommit !== !![] && _0x121662(),
      _0x53c86e
    );
  }
  async function _0x254a54(_0x2d7cc9, _0x126973, _0x101a1a, _0x2089f7, _0x1b2c0e = {}) {
    if (!_0x2d7cc9 || !_0x126973) return false;
    const _0x10154f = resolvePastedMediaDescriptor(String(_0x126973), _0x1b2c0e);
    if (!_0x10154f) return false;
    const _0xfcf6c = getMimeExtension(_0x126973, 'dat'),
      _0xff4ee2 = 'pasted-' + _0x10154f.typeSlug + '-' + Date.now() + '.' + _0xfcf6c,
      _0x4c2c9b = new File([_0x2d7cc9], _0xff4ee2, { type: _0x126973 }),
      _0x874fcf = _0x57c8d1?.() || 'default_v2_project',
      _0x544cb3 = await _0x3c1a9b(_0x4c2c9b, _0x101a1a, _0x2089f7, _0x874fcf);
    if (!_0x544cb3) return false;
    const _0x1fdbef = centerNodeAtWorldPosition(_0x544cb3, _0x101a1a, _0x2089f7);
    if (_0x1b2c0e.placement === 'viewport-center-sequence') {
      const { spacing: _0x56fab1, direction: _0x3c1251, avoidOverlap: _0x5bf912 } = getNodeSpawnPrefs(),
        _0x395738 = normalizeSpawnDirection(_0x3c1251),
        _0x5aa505 = Number(_0x1fdbef.width) || 0x12c,
        _0x1761ac = Number(_0x1fdbef.height) || 200,
        _0x6b9b7a = _0x101a1a - _0x5aa505 / 2,
        _0x53166c = _0x2089f7 - _0x1761ac / 2,
        _0x2cc25e = _0x549398().nodes || {},
        _0x5c6424 = String(_0x1b2c0e.sequenceKey || '').trim(),
        _0x2d01f4 = _0x5bf912 ? _0x2cc25e : getSequenceNodes(_0x2cc25e, _0x5c6424),
        _0x4cc574 = findAvailablePosition(
          _0x2d01f4,
          _0x6b9b7a,
          _0x53166c,
          _0x5aa505,
          _0x1761ac,
          _0x56fab1,
          _0x395738,
        );
      ((_0x1fdbef.x = _0x4cc574.x), (_0x1fdbef.y = _0x4cc574.y));
      if (_0x5c6424) _0x1fdbef.spawnSequenceKey = _0x5c6424;
    }
    return (
      (_0x1fdbef.name = _0x10154f.nodeName),
      _0x232205.addNode(_0x1fdbef),
      _0x232205.setSelectedNodes([_0x1fdbef.id]),
      _0x121662(),
      true
    );
  }
  async function _0x3f5974(_0x7870da, _0x29532f, _0x39ac0c = {}) {
    const { x: _0x4d4d17, y: _0x1fa2ad } = _0x3af476(_0x39ac0c);
    return await _0x254a54(_0x7870da, _0x29532f, _0x4d4d17, _0x1fa2ad, _0x39ac0c);
  }
  function _0x3b38e3(_0x28646e) {
    if (typeof File !== 'function') return null;
    const _0x5a4477 = String(_0x28646e?.path || '').trim(),
      _0x253467 = String(_0x28646e?.name || _0x5a4477.split(/[\\/]/).pop() || 'clipboard-file'),
      _0x5a3c2b = String(_0x28646e?.type || '').trim();
    if (!_0x5a4477 || !_0x5a3c2b) return null;
    const _0x61a0ba = new File([], _0x253467, { type: _0x5a3c2b });
    try {
      Object.defineProperty(_0x61a0ba, 'path', { value: _0x5a4477, configurable: true });
    } catch {
      _0x61a0ba.path = _0x5a4477;
    }
    return _0x61a0ba;
  }
  async function _0x2153d3(_0x5cc147, _0x3eb44b, _0x5595e5) {
    const _0x42d400 = String(_0x5cc147?.type || '').trim(),
      _0x220b3e = resolvePastedMediaDescriptor(_0x42d400);
    if (!_0x220b3e) return false;
    const _0x22f61b = _0x3b38e3(_0x5cc147);
    if (!_0x22f61b) return false;
    const _0xfde7f2 = _0x57c8d1?.() || 'default_v2_project',
      _0x3bd428 = await _0x3c1a9b(_0x22f61b, _0x3eb44b, _0x5595e5, _0xfde7f2);
    if (!_0x3bd428) return false;
    const _0x5558a6 = centerNodeAtWorldPosition(_0x3bd428, _0x3eb44b, _0x5595e5);
    return (
      (_0x5558a6.name = _0x220b3e.nodeName),
      _0x232205.addNode(_0x5558a6),
      _0x232205.setSelectedNodes([_0x5558a6.id]),
      _0x121662(),
      true
    );
  }
  async function _0x47cdb5(_0x486cec, _0x5304f9, _0x2c090a) {
    if (!Array.isArray(_0x486cec) || _0x486cec.length === 0) return 0;
    let _0x23b493 = 0;
    for (const _0x527286 of _0x486cec) {
      const _0x5d2854 = _0x23b493 * 30,
        _0x2a1c93 = await _0x2153d3(_0x527286, _0x5304f9 + _0x5d2854, _0x2c090a + _0x5d2854);
      if (_0x2a1c93) _0x23b493 += 1;
    }
    return _0x23b493;
  }
  function _0x37d3a5(_0x358c49, _0x29482d, _0x2aefc5) {
    const { width: _0x115689, height: _0xc84d46 } = _0x5e30e0('source-text'),
      _0x3457d7 = generateId('source-text');
    (_0x232205.addNode({
      id: _0x3457d7,
      type: 'source-text',
      x: _0x29482d - _0x115689 / 2,
      y: _0x2aefc5 - _0xc84d46 / 2,
      width: _0x115689,
      height: _0xc84d46,
      name: t('canvasNodeFlows.paste.nodeName.text'),
      content: String(_0x358c49 || ''),
    }),
      _0x232205.setSelectedNodes([_0x3457d7]),
      _0x121662());
  }
  async function _0x16678c(_0x56083 = {}) {
    const { x: _0x2b6004, y: _0x57a6be } = _0x3af476(_0x56083),
      {
        getClipboard: _0x4f1a3f,
        getClipboardMeta: _0x5e2ca8,
        observeSystemClipboardSignature: _0x2d8888,
      } = await loadClipboardModule(),
      _0x166494 = _0x4f1a3f(),
      _0x1cd57a = _0x5e2ca8(),
      {
        pastedFiles: _0x385ae7,
        pastedMedia: _0x32f285,
        pastedText: _0x6c48ab,
        clipboardReadFailed: _0x3c904e,
      } = await readSystemClipboardContents(),
      _0x8b7e3a = String(_0x6c48ab || '').trim(),
      _0x4043c9 = (Array.isArray(_0x385ae7) && _0x385ae7.length > 0) || !!_0x32f285 || !!_0x8b7e3a,
      _0x44c6ad = _0x4043c9
        ? buildSystemClipboardSignature({
            pastedFiles: _0x385ae7,
            pastedMedia: _0x32f285,
            pastedText: _0x6c48ab,
          })
        : '',
      _0x4b1a7f = _0x166494 && _0x166494.length > 0,
      _0x95c327 = Number(_0x1cd57a?.copiedAt) || 0,
      _0x117960 = Number(_0x1cd57a?.systemCopiedAt) || 0,
      _0x2a5922 = String(_0x1cd57a?.systemSignatureAtCopy || ''),
      _0x5088b6 = String(_0x1cd57a?.systemSignature || '');
    _0x44c6ad && _0x2d8888(_0x44c6ad);
    if (_0x4b1a7f) {
      const _0x4c2eea = _0x117960 > _0x95c327 && _0x95c327 > 0,
        _0x3a2601 = _0x95c327 > _0x117960 && _0x117960 > 0,
        _0x16f10b = !!_0x2a5922 && !!_0x44c6ad,
        _0x5a9128 = _0x16f10b ? _0x2a5922 === _0x44c6ad : false,
        _0x218d1a = _0x16f10b ? _0x2a5922 !== _0x44c6ad : false,
        _0x482e42 = !_0x2a5922 && !!_0x5088b6 && _0x5088b6 === _0x44c6ad,
        _0x31d11a = !_0x4043c9 || _0x5a9128 || (_0x3a2601 && _0x482e42);
      if (_0x31d11a && !_0x4c2eea && !_0x218d1a) {
        _0x8a019b('paste', { x: _0x2b6004, y: _0x57a6be });
        return;
      }
    }
    if (Array.isArray(_0x385ae7) && _0x385ae7.length > 0) {
      const _0x2c5df1 = await _0x47cdb5(_0x385ae7, _0x2b6004, _0x57a6be);
      if (_0x2c5df1 > 0) {
        _0xa183f?.(
          _0x2c5df1 === 1
            ? t('canvasNodeFlows.paste.filePasted')
            : t('canvasNodeFlows.paste.filesPasted', { count: _0x2c5df1 }),
          'success',
        );
        return;
      }
    }
    if (_0x32f285) {
      const _0x23f80e = await _0x254a54(_0x32f285.blob, _0x32f285.mimeType, _0x2b6004, _0x57a6be);
      if (_0x23f80e) {
        const _0x555a6a = _0x32f285.mimeType.startsWith('image/')
          ? t('canvasNodeFlows.media.image')
          : _0x32f285.mimeType.startsWith('video/')
            ? t('canvasNodeFlows.media.video')
            : t('canvasNodeFlows.media.audio');
        _0xa183f?.(t('canvasNodeFlows.paste.mediaPasted', { label: _0x555a6a }), 'success');
        return;
      }
    }
    if (_0x8b7e3a) {
      (_0x37d3a5(_0x8b7e3a, _0x2b6004, _0x57a6be),
        _0xa183f?.(t('canvasNodeFlows.paste.textPasted'), 'success'));
      return;
    }
    if (_0x166494 && _0x166494.length > 0) {
      _0x8a019b('paste', { x: _0x2b6004, y: _0x57a6be });
      return;
    }
    if (_0x3c904e) {
      _0xa183f?.(t('canvasNodeFlows.paste.clipboardReadFailed'), 'error');
      return;
    }
    _0xa183f?.(t('canvasNodeFlows.paste.clipboardEmpty'), 'warning');
  }
  return {
    createNodeAtCursor: _0x3e727b,
    createMediaNodeFromBlob: _0x3f5974,
    handlePasteFromClipboard: _0x16678c,
  };
}
