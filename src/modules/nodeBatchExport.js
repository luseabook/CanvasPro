import { t } from '../i18n/index.js';
import { isNodeType } from './registry.js';
import {
  isRemoteHttpUrl,
  normalizeCanvasLocalPath,
  resolveCanvasAudioLocalPath,
  resolveCanvasVideoLocalPath,
} from '../services/canvasMediaLocalService.js';
import { desktopBridge } from '../services/desktopBridge.js';
import { saveMediaDownload, saveTextDownload } from '../services/downloadSaveService.js';
import { resolveNodeMediaDownloadFilename } from '../components/nodeToolbar/mediaDownloadFilename.js';
import { getDownloadUseOriginalFilename } from '../services/downloadNamingService.js';
const TEXT_NODE_TYPES = Object['freeze'](['source-text', 'text', 'ai-text']),
  IMAGE_NODE_TYPES = Object['freeze'](['source-image', 'image', 'ai-image']),
  VIDEO_NODE_TYPES = Object['freeze'](['source-video', 'video', 'ai-video']),
  AUDIO_NODE_TYPES = Object['freeze'](['source-audio', 'audio', 'ai-audio']);
let batchExportPending = ![];
const batchExportListeners = new Set();
export function isNodeBatchExportPending() {
  return batchExportPending;
}
export function subscribeNodeBatchExportPending(_0x4aa08d) {
  batchExportListeners['add'](_0x4aa08d);
  try {
    _0x4aa08d(batchExportPending);
  } catch {}
  return () => batchExportListeners['delete'](_0x4aa08d);
}
function setBatchExportPending(_0x5bb3d8) {
  batchExportPending = _0x5bb3d8;
  for (const _0x18bed3 of batchExportListeners) {
    try {
      _0x18bed3(_0x5bb3d8);
    } catch {}
  }
}
const IMAGE_LOCAL_KEYS = Object['freeze']([
    'localPath',
    'originalLocalPath',
    'displayLocalPath',
    'sourceUrl',
    'imageUrl',
    'src',
    'url',
    'resultUrl',
  ]),
  IMAGE_REMOTE_KEYS = Object['freeze'](['sourceUrl', 'imageUrl', 'src', 'url', 'resultUrl']),
  VIDEO_REMOTE_KEYS = Object['freeze'](['videoUrl', 'src', 'url', 'resultUrl']),
  AUDIO_REMOTE_KEYS = Object['freeze'](['audioUrl', 'src', 'url', 'resultUrl']);
function trimText(_0x2a777d) {
  return String(_0x2a777d || '')['trim']();
}
function firstNonEmpty(..._0x504520) {
  for (const _0x4be29a of _0x504520) {
    const _0xd290b6 = trimText(_0x4be29a);
    if (_0xd290b6) return _0xd290b6;
  }
  return '';
}
function firstNonEmptyRaw(..._0x7135f4) {
  for (const _0x1c7afb of _0x7135f4) {
    const _0xb77b74 = String(_0x1c7afb ?? '');
    if (_0xb77b74['trim']()) return _0xb77b74;
  }
  return '';
}
function getNodeName(_0xab591d, _0x52bec0 = '') {
  return firstNonEmpty(
    _0xab591d?.['name'],
    _0xab591d?.['label'],
    _0xab591d?.['title'],
    _0xab591d?.['fileName'],
    _0x52bec0,
  );
}
function pickPrimaryItem(_0x193bff, _0x568c89) {
  if (!Array['isArray'](_0x193bff) || _0x193bff['length'] <= 0x0) return null;
  const _0x44ffda = Number['isFinite'](Number(_0x568c89))
    ? Math['max'](0x0, Math['trunc'](Number(_0x568c89)))
    : 0x0;
  return _0x193bff[Math['min'](_0x44ffda, _0x193bff['length'] - 0x1)] || _0x193bff[0x0] || null;
}
function collectSources(..._0x2d17ce) {
  return _0x2d17ce['filter'](
    (_0x12f7eb) => _0x12f7eb && typeof _0x12f7eb === 'object' && !Array['isArray'](_0x12f7eb),
  );
}
function pickLocalPath(_0x417064, _0x57122a) {
  for (const _0x56370a of _0x417064) {
    for (const _0x245d14 of _0x57122a) {
      const _0x17e723 = normalizeCanvasLocalPath(_0x56370a?.[_0x245d14]);
      if (_0x17e723) return _0x17e723;
    }
  }
  return '';
}
function pickRemoteUrl(_0xa1f00f, _0x51d832) {
  for (const _0x35f687 of _0xa1f00f) {
    for (const _0x4c4b87 of _0x51d832) {
      const _0xae409f = trimText(_0x35f687?.[_0x4c4b87]);
      if (isRemoteHttpUrl(_0xae409f)) return _0xae409f;
    }
  }
  return '';
}
function pickFileNameHint(_0xdacc06) {
  for (const _0x347bea of _0xdacc06) {
    const _0x3a1ed8 = firstNonEmpty(_0x347bea?.['fileName'], _0x347bea?.['filename']);
    if (_0x3a1ed8) return _0x3a1ed8;
  }
  return '';
}
function buildTextExportItem(_0x101813, _0x2fa167) {
  let _0x1049e7 = '';
  if (isNodeType(_0x101813, ['source-text', 'text'])) _0x1049e7 = firstNonEmptyRaw(_0x101813?.['content']);
  else
    isNodeType(_0x101813, 'ai-text') &&
      (_0x1049e7 = firstNonEmptyRaw(_0x101813?.['outputText'], _0x101813?.['resultText']));
  if (!_0x1049e7['trim']()) return null;
  return {
    nodeId: _0x2fa167,
    nodeName: getNodeName(_0x101813, _0x2fa167),
    nodeType: trimText(_0x101813?.['type']),
    kind: 'text',
    text: _0x1049e7,
  };
}
function buildImageExportItem(_0x11e98c, _0x564248) {
  const _0x11e2a6 = pickPrimaryItem(_0x11e98c?.['images'], _0x11e98c?.['mainImageIndex']),
    _0x5c009f = collectSources(_0x11e2a6, _0x11e98c),
    _0x598017 = pickLocalPath(_0x5c009f, IMAGE_LOCAL_KEYS),
    _0x26d192 = _0x598017 ? '' : pickRemoteUrl(_0x5c009f, IMAGE_REMOTE_KEYS);
  if (!_0x598017 && !_0x26d192) return null;
  return {
    nodeId: _0x564248,
    nodeName: getNodeName(_0x11e98c, _0x564248),
    nodeType: trimText(_0x11e98c?.['type']),
    kind: 'image',
    localPath: _0x598017,
    url: _0x26d192,
    filenameHint: pickFileNameHint(_0x5c009f),
  };
}
function buildVideoExportItem(_0x80d073, _0x45aa38) {
  const _0x4612f0 = pickPrimaryItem(_0x80d073?.['videos'], _0x80d073?.['mainVideoIndex']),
    _0x26c091 = collectSources(_0x4612f0, _0x80d073);
  let _0x45d8d1 = '';
  for (const _0x10b5ca of _0x26c091) {
    _0x45d8d1 = resolveCanvasVideoLocalPath(_0x10b5ca);
    if (_0x45d8d1) break;
  }
  const _0x117b5d = _0x45d8d1 ? '' : pickRemoteUrl(_0x26c091, VIDEO_REMOTE_KEYS);
  if (!_0x45d8d1 && !_0x117b5d) return null;
  return {
    nodeId: _0x45aa38,
    nodeName: getNodeName(_0x80d073, _0x45aa38),
    nodeType: trimText(_0x80d073?.['type']),
    kind: 'video',
    localPath: _0x45d8d1,
    url: _0x117b5d,
    filenameHint: pickFileNameHint(_0x26c091),
  };
}
function buildAudioExportItem(_0x249c4b, _0x571bd4) {
  const _0xadf97a = collectSources(_0x249c4b),
    _0x45c77f = resolveCanvasAudioLocalPath(_0x249c4b),
    _0x44767e = _0x45c77f ? '' : pickRemoteUrl(_0xadf97a, AUDIO_REMOTE_KEYS);
  if (!_0x45c77f && !_0x44767e) return null;
  return {
    nodeId: _0x571bd4,
    nodeName: getNodeName(_0x249c4b, _0x571bd4),
    nodeType: trimText(_0x249c4b?.['type']),
    kind: 'audio',
    localPath: _0x45c77f,
    url: _0x44767e,
    filenameHint: pickFileNameHint(_0xadf97a),
  };
}
function buildExportItem(_0x1ea6c2, _0x21bef3) {
  if (!_0x1ea6c2 || typeof _0x1ea6c2 !== 'object') return null;
  if (isNodeType(_0x1ea6c2, TEXT_NODE_TYPES)) return buildTextExportItem(_0x1ea6c2, _0x21bef3);
  if (isNodeType(_0x1ea6c2, IMAGE_NODE_TYPES)) return buildImageExportItem(_0x1ea6c2, _0x21bef3);
  if (isNodeType(_0x1ea6c2, VIDEO_NODE_TYPES)) return buildVideoExportItem(_0x1ea6c2, _0x21bef3);
  if (isNodeType(_0x1ea6c2, AUDIO_NODE_TYPES)) return buildAudioExportItem(_0x1ea6c2, _0x21bef3);
  return null;
}
function normalizeSelectedIds(_0x40158f) {
  if (_0x40158f instanceof Set) return Array['from'](_0x40158f);
  return Array['isArray'](_0x40158f) ? _0x40158f : [];
}
export function collectSelectedNodeExportItems({
  nodes: nodes = {},
  selectedNodeIds: selectedNodeIds = [],
} = {}) {
  const _0xa5605c = [],
    _0x51af85 = [];
  for (const _0x577a8a of normalizeSelectedIds(selectedNodeIds)) {
    const _0x7fbdfe = trimText(_0x577a8a);
    if (!_0x7fbdfe) continue;
    const _0x3285e7 = nodes?.[_0x7fbdfe],
      _0x5cbded = buildExportItem(_0x3285e7, _0x7fbdfe);
    if (_0x5cbded) {
      _0xa5605c['push'](_0x5cbded);
      continue;
    }
    _0x3285e7 &&
      _0x51af85['push']({
        nodeId: _0x7fbdfe,
        nodeName: getNodeName(_0x3285e7, _0x7fbdfe),
        nodeType: trimText(_0x3285e7?.['type']),
        reason: 'NO_EXPORTABLE_CONTENT',
      });
  }
  return { items: _0xa5605c, skipped: _0x51af85 };
}
export function hasBatchExportableSelection(_0x3a3dcc = {}, _0x330528 = []) {
  return (
    collectSelectedNodeExportItems({ nodes: _0x3a3dcc, selectedNodeIds: _0x330528 })['items']['length'] > 0x0
  );
}
function resolveTextDownloadFilename(_0x2cdf17) {
  const _0x5a821c = firstNonEmpty(_0x2cdf17?.['nodeName'], _0x2cdf17?.['nodeId'], 'text'),
    _0x9dcc90 = _0x5a821c['replace'](/[\\/:*?"<>|\x00-\x1F]/g, '_')
      ['replace'](/[. ]+$/g, '')
      ['trim'](),
    _0x4d2e9f = (_0x9dcc90 || 'text')['replace'](/\.txt$/i, ''),
    _0x11f014 = _0x4d2e9f['slice'](0x0, 0x9c)['replace'](/[. ]+$/g, '');
  return (_0x11f014 || 'text') + '.txt';
}
function normalizeDownloadFailureMessage(_0x25917e, _0x97a73e) {
  return firstNonEmpty(
    _0x25917e?.['message'],
    _0x25917e?.['error']?.['message'],
    _0x25917e?.['error'],
    _0x97a73e,
  );
}
export async function downloadNodeOutput({
  node: _0x33e16b,
  nodeId: _0x3fe52a,
  showToast: showToast = globalThis['window']?.['showToast'],
  saveTextDownload: _0x3d6b11 = saveTextDownload,
  saveMediaDownload: _0x4ccc4b = saveMediaDownload,
  resolveNodeMediaDownloadFilename: _0x3fc3c6 = resolveNodeMediaDownloadFilename,
  downloadDependencies: downloadDependencies = {},
} = {}) {
  const _0x3b4fef = firstNonEmpty(_0x3fe52a, _0x33e16b?.['id'], 'node'),
    { items: _0x14e881, skipped: _0x57f7c0 } = collectSelectedNodeExportItems({
      nodes: { [_0x3b4fef]: _0x33e16b },
      selectedNodeIds: [_0x3b4fef],
    }),
    _0x23eea0 = _0x14e881[0x0] || null;
  if (!_0x23eea0)
    return (
      show(showToast, t('nodeBatchExport.toasts.noExportable'), 'warn'),
      {
        success: ![],
        canceled: ![],
        code: 'NO_EXPORTABLE_ITEMS',
        nodeId: _0x3b4fef,
        kind: '',
        filename: '',
        skipped: _0x57f7c0,
        saveResult: null,
      }
    );
  let _0x4bef0b = '';
  try {
    _0x23eea0['kind'] === 'text'
      ? (_0x4bef0b = resolveTextDownloadFilename(_0x23eea0))
      : (_0x4bef0b = _0x3fc3c6({
          nodeName: _0x23eea0['nodeName'],
          fileName: _0x23eea0['filenameHint'],
          kind: _0x23eea0['kind'],
          sources: [_0x23eea0['localPath'], _0x23eea0['url']],
          fallbackBase: _0x23eea0['kind'],
        }));
    const _0x4f38c3 =
      _0x23eea0['kind'] === 'text'
        ? await _0x3d6b11(
            { filename: _0x4bef0b, content: _0x23eea0['text'], mimeType: 'text/plain;charset=utf-8' },
            downloadDependencies,
          )
        : await _0x4ccc4b(
            {
              kind: _0x23eea0['kind'],
              localPath: _0x23eea0['localPath'],
              url: _0x23eea0['url'],
              filename: _0x4bef0b,
            },
            downloadDependencies,
          );
    if (_0x4f38c3?.['canceled'])
      return {
        success: ![],
        canceled: !![],
        code: 'CANCELED',
        nodeId: _0x3b4fef,
        kind: _0x23eea0['kind'],
        filename: _0x4bef0b,
        skipped: _0x57f7c0,
        saveResult: _0x4f38c3,
      };
    if (_0x4f38c3?.['success'] === ![]) {
      const _0x508f23 = normalizeDownloadFailureMessage(_0x4f38c3, t('nodeBatchExport.toasts.failed'));
      return (
        show(showToast, t('nodeBatchExport.toasts.failedWithMessage', { message: _0x508f23 }), 'error'),
        {
          success: ![],
          canceled: ![],
          code: firstNonEmpty(_0x4f38c3?.['code'], 'DOWNLOAD_FAILED'),
          error: _0x508f23,
          nodeId: _0x3b4fef,
          kind: _0x23eea0['kind'],
          filename: _0x4bef0b,
          skipped: _0x57f7c0,
          saveResult: _0x4f38c3,
        }
      );
    }
    return (
      show(showToast, t('nodeBatchExport.toasts.completed', { count: 0x1 }), 'success'),
      {
        success: !![],
        canceled: ![],
        code: 'DOWNLOADED',
        nodeId: _0x3b4fef,
        kind: _0x23eea0['kind'],
        filename: _0x4bef0b,
        skipped: _0x57f7c0,
        saveResult: _0x4f38c3 || null,
      }
    );
  } catch (_0x51c54c) {
    const _0x4a3f9d = firstNonEmpty(_0x51c54c?.['message'], _0x51c54c, t('nodeBatchExport.toasts.failed'));
    return (
      show(showToast, t('nodeBatchExport.toasts.failedWithMessage', { message: _0x4a3f9d }), 'error'),
      {
        success: ![],
        canceled: ![],
        code: 'DOWNLOAD_FAILED',
        error: _0x4a3f9d,
        nodeId: _0x3b4fef,
        kind: _0x23eea0['kind'],
        filename: _0x4bef0b,
        skipped: _0x57f7c0,
        saveResult: null,
      }
    );
  }
}
function mergeSkipped(..._0x1e03e7) {
  return _0x1e03e7['flatMap']((_0x5072b8) => (Array['isArray'](_0x5072b8) ? _0x5072b8 : []));
}
function show(_0x5d1fa3, _0xe0a26e, _0x374f74) {
  if (typeof _0x5d1fa3 === 'function') _0x5d1fa3(_0xe0a26e, _0x374f74);
}
export async function exportSelectedNodesBatch({
  state: state = {},
  electronAPI: electronAPI = desktopBridge['nodeExport']['isAvailable']()
    ? { nodeExport: desktopBridge['nodeExport'] }
    : null,
  showToast: showToast = globalThis['window']?.['showToast'],
  consoleObject: consoleObject = globalThis['console'],
} = {}) {
  if (batchExportPending) return { success: ![], code: 'EXPORT_IN_PROGRESS' };
  const _0x181020 = normalizeSelectedIds(state?.['selectedNodeIds']),
    { items: _0x2d2fab, skipped: _0x23bf74 } = collectSelectedNodeExportItems({
      nodes: state?.['nodes'] || {},
      selectedNodeIds: _0x181020,
    });
  if (_0x2d2fab['length'] <= 0x0)
    return (
      show(showToast, t('nodeBatchExport.toasts.noExportable'), 'warn'),
      _0x23bf74['length'] > 0x0 && consoleObject?.['info']?.('[node-batch-export]\x20skipped', _0x23bf74),
      {
        success: ![],
        canceled: ![],
        code: 'NO_EXPORTABLE_ITEMS',
        exportedCount: 0x0,
        skipped: _0x23bf74,
        counts: {},
      }
    );
  const _0x52ae9a = electronAPI?.['nodeExport']?.['exportSelected'];
  if (typeof _0x52ae9a !== 'function')
    return (
      show(showToast, t('nodeBatchExport.toasts.unsupported'), 'error'),
      { success: ![], canceled: ![], code: 'UNSUPPORTED', exportedCount: 0x0, skipped: _0x23bf74, counts: {} }
    );
  setBatchExportPending(!![]);
  try {
    show(showToast, t('nodeBatchExport.toasts.started'), 'info');
    const _0x22e7c9 = getDownloadUseOriginalFilename()
        ? _0x2d2fab['map']((_0x3e3f9b) => {
            if (_0x3e3f9b['kind'] === 'text') return _0x3e3f9b;
            const _0x2909ae = resolveNodeMediaDownloadFilename({
              nodeName: _0x3e3f9b['nodeName'],
              fileName: _0x3e3f9b['filenameHint'],
              kind: _0x3e3f9b['kind'],
              sources: [_0x3e3f9b['localPath'], _0x3e3f9b['url']],
              useOriginalFilename: !![],
            });
            return { ..._0x3e3f9b, filenameBase: _0x2909ae['slice'](0x0, _0x2909ae['lastIndexOf']('.')) };
          })
        : _0x2d2fab,
      _0x1d1515 = await _0x52ae9a({ items: _0x22e7c9 });
    if (_0x1d1515?.['canceled']) return _0x1d1515;
    const _0x24c3c2 = mergeSkipped(_0x23bf74, _0x1d1515?.['skipped']);
    if (_0x1d1515?.['success'])
      return (
        _0x24c3c2['length'] > 0x0
          ? (consoleObject?.['info']?.('[node-batch-export] skipped', _0x24c3c2),
            show(
              showToast,
              t('nodeBatchExport.toasts.completedWithSkipped', {
                exported: _0x1d1515['exportedCount'] || 0x0,
                skipped: _0x24c3c2['length'],
              }),
              'success',
            ))
          : show(
              showToast,
              t('nodeBatchExport.toasts.completed', { count: _0x1d1515['exportedCount'] || 0x0 }),
              'success',
            ),
        { ..._0x1d1515, skipped: _0x24c3c2 }
      );
    if (_0x1d1515?.['code'] === 'NO_EXPORTABLE_ITEMS')
      return (
        show(showToast, t('nodeBatchExport.toasts.noExportable'), 'warn'),
        { ..._0x1d1515, skipped: _0x24c3c2 }
      );
    const _0x15e2f5 = _0x1d1515?.['message'] || _0x1d1515?.['error'] || t('nodeBatchExport.toasts.failed');
    return (show(showToast, _0x15e2f5, 'error'), { ..._0x1d1515, skipped: _0x24c3c2 });
  } catch (_0x2a7690) {
    const _0xabf8af = String(_0x2a7690?.['message'] || _0x2a7690 || '');
    return (
      show(
        showToast,
        t('nodeBatchExport.toasts.failedWithMessage', {
          message: _0xabf8af || t('nodeBatchExport.toasts.failed'),
        }),
        'error',
      ),
      { success: ![], canceled: ![], error: _0xabf8af, exportedCount: 0x0, skipped: _0x23bf74, counts: {} }
    );
  } finally {
    setBatchExportPending(![]);
  }
}
