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
let batchExportPending = false;
const batchExportListeners = new Set();
export function isNodeBatchExportPending() {
  return batchExportPending;
}
export function subscribeNodeBatchExportPending(handler) {
  batchExportListeners['add'](handler);
  try {
    handler(batchExportPending);
  } catch {}
  return () => batchExportListeners['delete'](handler);
}
function setBatchExportPending(value) {
  batchExportPending = value;
  for (const run of batchExportListeners) {
    try {
      run(value);
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
function trimText(item) {
  return String(item || '')['trim']();
}
function firstNonEmpty(...args) {
  for (const key of args) {
    const trimText2 = trimText(key);
    if (trimText2) return trimText2;
  }
  return '';
}
function firstNonEmptyRaw(...args2) {
  for (const index of args2) {
    const result = String(index ?? '');
    if (result['trim']()) return result;
  }
  return '';
}
function getNodeName(error, data = '') {
  return firstNonEmpty(error?.['name'], error?.['label'], error?.['title'], error?.['fileName'], data);
}
function pickPrimaryItem(list, options) {
  if (!Array['isArray'](list) || list['length'] <= 0) return null;
  const target = Number['isFinite'](Number(options)) ? Math['max'](0, Math['trunc'](Number(options))) : 0;
  return list[Math['min'](target, list['length'] - 1)] || list[0] || null;
}
function collectSources(...list2) {
  return list2['filter']((source) => source && typeof source === 'object' && !Array['isArray'](source));
}
function pickLocalPath(next, current) {
  for (const entry of next) {
    for (const record of current) {
      const canvasLocalPath = normalizeCanvasLocalPath(entry?.[record]);
      if (canvasLocalPath) return canvasLocalPath;
    }
  }
  return '';
}
function pickRemoteUrl(payload, handle) {
  for (const config of payload) {
    for (const scope of handle) {
      const trimText3 = trimText(config?.[scope]);
      if (isRemoteHttpUrl(trimText3)) return trimText3;
    }
  }
  return '';
}
function pickFileNameHint(input) {
  for (const output of input) {
    const nonEmpty = firstNonEmpty(output?.['fileName'], output?.['filename']);
    if (nonEmpty) return nonEmpty;
  }
  return '';
}
function buildTextExportItem(value2, nodeId) {
  let text = '';
  if (isNodeType(value2, ['source-text', 'text'])) text = firstNonEmptyRaw(value2?.['content']);
  else
    isNodeType(value2, 'ai-text') &&
      (text = firstNonEmptyRaw(value2?.['outputText'], value2?.['resultText']));
  if (!text['trim']()) return null;
  return {
    nodeId: nodeId,
    nodeName: getNodeName(value2, nodeId),
    nodeType: trimText(value2?.['type']),
    kind: 'text',
    text: text,
  };
}
function buildImageExportItem(value3, nodeId2) {
  const primaryItem = pickPrimaryItem(value3?.['images'], value3?.['mainImageIndex']),
    sources = collectSources(primaryItem, value3),
    localPath = pickLocalPath(sources, IMAGE_LOCAL_KEYS),
    url = localPath ? '' : pickRemoteUrl(sources, IMAGE_REMOTE_KEYS);
  if (!localPath && !url) return null;
  return {
    nodeId: nodeId2,
    nodeName: getNodeName(value3, nodeId2),
    nodeType: trimText(value3?.['type']),
    kind: 'image',
    localPath: localPath,
    url: url,
    filenameHint: pickFileNameHint(sources),
  };
}
function buildVideoExportItem(value4, nodeId3) {
  const primaryItem2 = pickPrimaryItem(value4?.['videos'], value4?.['mainVideoIndex']),
    sources2 = collectSources(primaryItem2, value4);
  let localPath2 = '';
  for (const value5 of sources2) {
    localPath2 = resolveCanvasVideoLocalPath(value5);
    if (localPath2) break;
  }
  const url2 = localPath2 ? '' : pickRemoteUrl(sources2, VIDEO_REMOTE_KEYS);
  if (!localPath2 && !url2) return null;
  return {
    nodeId: nodeId3,
    nodeName: getNodeName(value4, nodeId3),
    nodeType: trimText(value4?.['type']),
    kind: 'video',
    localPath: localPath2,
    url: url2,
    filenameHint: pickFileNameHint(sources2),
  };
}
function buildAudioExportItem(value6, nodeId4) {
  const sources3 = collectSources(value6),
    localPath3 = resolveCanvasAudioLocalPath(value6),
    url3 = localPath3 ? '' : pickRemoteUrl(sources3, AUDIO_REMOTE_KEYS);
  if (!localPath3 && !url3) return null;
  return {
    nodeId: nodeId4,
    nodeName: getNodeName(value6, nodeId4),
    nodeType: trimText(value6?.['type']),
    kind: 'audio',
    localPath: localPath3,
    url: url3,
    filenameHint: pickFileNameHint(sources3),
  };
}
function buildExportItem(enabled, value7) {
  if (!enabled || typeof enabled !== 'object') return null;
  if (isNodeType(enabled, TEXT_NODE_TYPES)) return buildTextExportItem(enabled, value7);
  if (isNodeType(enabled, IMAGE_NODE_TYPES)) return buildImageExportItem(enabled, value7);
  if (isNodeType(enabled, VIDEO_NODE_TYPES)) return buildVideoExportItem(enabled, value7);
  if (isNodeType(enabled, AUDIO_NODE_TYPES)) return buildAudioExportItem(enabled, value7);
  return null;
}
function normalizeSelectedIds(value8) {
  if (value8 instanceof Set) return Array['from'](value8);
  return Array['isArray'](value8) ? value8 : [];
}
export function collectSelectedNodeExportItems({
  nodes: nodes = {},
  selectedNodeIds: selectedNodeIds = [],
} = {}) {
  const items = [],
    skipped = [];
  for (const value9 of normalizeSelectedIds(selectedNodeIds)) {
    const nodeId5 = trimText(value9);
    if (!nodeId5) continue;
    const value10 = nodes?.[nodeId5],
      exportItem = buildExportItem(value10, nodeId5);
    if (exportItem) {
      items['push'](exportItem);
      continue;
    }
    value10 &&
      skipped['push']({
        nodeId: nodeId5,
        nodeName: getNodeName(value10, nodeId5),
        nodeType: trimText(value10?.['type']),
        reason: 'NO_EXPORTABLE_CONTENT',
      });
  }
  return { items: items, skipped: skipped };
}
export function hasBatchExportableSelection(nodes2 = {}, selectedNodeIds2 = []) {
  return (
    collectSelectedNodeExportItems({ nodes: nodes2, selectedNodeIds: selectedNodeIds2 })['items']['length'] >
    0
  );
}
function resolveTextDownloadFilename(value11) {
  const nonEmpty2 = firstNonEmpty(value11?.['nodeName'], value11?.['nodeId'], 'text'),
    value12 = nonEmpty2['replace'](/[\\/:*?"<>|\x00-\x1F]/g, '_')
      ['replace'](/[. ]+$/g, '')
      ['trim'](),
    list3 = (value12 || 'text')['replace'](/\.txt$/i, ''),
    value13 = list3['slice'](0, 156)['replace'](/[. ]+$/g, '');
  return (value13 || 'text') + '.txt';
}
function normalizeDownloadFailureMessage(error2, value14) {
  return firstNonEmpty(error2?.['message'], error2?.['error']?.['message'], error2?.['error'], value14);
}
export async function downloadNodeOutput({
  node: node,
  nodeId: nodeId6,
  showToast: showToast = globalThis['window']?.['showToast'],
  saveTextDownload: saveTextDownload2 = saveTextDownload,
  saveMediaDownload: saveMediaDownload2 = saveMediaDownload,
  resolveNodeMediaDownloadFilename: resolveNodeMediaDownloadFilename2 = resolveNodeMediaDownloadFilename,
  downloadDependencies: downloadDependencies = {},
} = {}) {
  const nodeId7 = firstNonEmpty(nodeId6, node?.['id'], 'node'),
    { items: items2, skipped: skipped2 } = collectSelectedNodeExportItems({
      nodes: { [nodeId7]: node },
      selectedNodeIds: [nodeId7],
    }),
    nodeName = items2[0] || null;
  if (!nodeName)
    return (
      show(showToast, t('nodeBatchExport.toasts.noExportable'), 'warn'),
      {
        success: false,
        canceled: false,
        code: 'NO_EXPORTABLE_ITEMS',
        nodeId: nodeId7,
        kind: '',
        filename: '',
        skipped: skipped2,
        saveResult: null,
      }
    );
  let filename = '';
  try {
    nodeName['kind'] === 'text'
      ? (filename = resolveTextDownloadFilename(nodeName))
      : (filename = resolveNodeMediaDownloadFilename2({
          nodeName: nodeName['nodeName'],
          fileName: nodeName['filenameHint'],
          kind: nodeName['kind'],
          sources: [nodeName['localPath'], nodeName['url']],
          fallbackBase: nodeName['kind'],
        }));
    const saveResult =
      nodeName['kind'] === 'text'
        ? await saveTextDownload2(
            { filename: filename, content: nodeName['text'], mimeType: 'text/plain;charset=utf-8' },
            downloadDependencies,
          )
        : await saveMediaDownload2(
            {
              kind: nodeName['kind'],
              localPath: nodeName['localPath'],
              url: nodeName['url'],
              filename: filename,
            },
            downloadDependencies,
          );
    if (saveResult?.['canceled'])
      return {
        success: false,
        canceled: true,
        code: 'CANCELED',
        nodeId: nodeId7,
        kind: nodeName['kind'],
        filename: filename,
        skipped: skipped2,
        saveResult: saveResult,
      };
    if (saveResult?.['success'] === false) {
      const message = normalizeDownloadFailureMessage(saveResult, t('nodeBatchExport.toasts.failed'));
      return (
        show(showToast, t('nodeBatchExport.toasts.failedWithMessage', { message: message }), 'error'),
        {
          success: false,
          canceled: false,
          code: firstNonEmpty(saveResult?.['code'], 'DOWNLOAD_FAILED'),
          error: message,
          nodeId: nodeId7,
          kind: nodeName['kind'],
          filename: filename,
          skipped: skipped2,
          saveResult: saveResult,
        }
      );
    }
    return (
      show(showToast, t('nodeBatchExport.toasts.completed', { count: 1 }), 'success'),
      {
        success: true,
        canceled: false,
        code: 'DOWNLOADED',
        nodeId: nodeId7,
        kind: nodeName['kind'],
        filename: filename,
        skipped: skipped2,
        saveResult: saveResult || null,
      }
    );
  } catch (error3) {
    const message2 = firstNonEmpty(error3?.['message'], error3, t('nodeBatchExport.toasts.failed'));
    return (
      show(showToast, t('nodeBatchExport.toasts.failedWithMessage', { message: message2 }), 'error'),
      {
        success: false,
        canceled: false,
        code: 'DOWNLOAD_FAILED',
        error: message2,
        nodeId: nodeId7,
        kind: nodeName['kind'],
        filename: filename,
        skipped: skipped2,
        saveResult: null,
      }
    );
  }
}
function mergeSkipped(...list4) {
  return list4['flatMap']((value15) => (Array['isArray'](value15) ? value15 : []));
}
function show(handler2, value16, value17) {
  if (typeof handler2 === 'function') handler2(value16, value17);
}
export async function exportSelectedNodesBatch({
  state: state = {},
  electronAPI: electronAPI = desktopBridge['nodeExport']['isAvailable']()
    ? { nodeExport: desktopBridge['nodeExport'] }
    : null,
  showToast: showToast = globalThis['window']?.['showToast'],
  consoleObject: consoleObject = globalThis['console'],
} = {}) {
  if (batchExportPending) return { success: false, code: 'EXPORT_IN_PROGRESS' };
  const selectedNodeIds3 = normalizeSelectedIds(state?.['selectedNodeIds']),
    { items: items3, skipped: skipped3 } = collectSelectedNodeExportItems({
      nodes: state?.['nodes'] || {},
      selectedNodeIds: selectedNodeIds3,
    });
  if (items3['length'] <= 0)
    return (
      show(showToast, t('nodeBatchExport.toasts.noExportable'), 'warn'),
      skipped3['length'] > 0 && consoleObject?.['info']?.('[node-batch-export] skipped', skipped3),
      {
        success: false,
        canceled: false,
        code: 'NO_EXPORTABLE_ITEMS',
        exportedCount: 0,
        skipped: skipped3,
        counts: {},
      }
    );
  const run2 = electronAPI?.['nodeExport']?.['exportSelected'];
  if (typeof run2 !== 'function')
    return (
      show(showToast, t('nodeBatchExport.toasts.unsupported'), 'error'),
      { success: false, canceled: false, code: 'UNSUPPORTED', exportedCount: 0, skipped: skipped3, counts: {} }
    );
  setBatchExportPending(true);
  try {
    show(showToast, t('nodeBatchExport.toasts.started'), 'info');
    const items4 = getDownloadUseOriginalFilename()
        ? items3['map']((nodeName2) => {
            if (nodeName2['kind'] === 'text') return nodeName2;
            const filenameBase = resolveNodeMediaDownloadFilename({
              nodeName: nodeName2['nodeName'],
              fileName: nodeName2['filenameHint'],
              kind: nodeName2['kind'],
              sources: [nodeName2['localPath'], nodeName2['url']],
              useOriginalFilename: true,
            });
            return {
              ...nodeName2,
              filenameBase: filenameBase['slice'](0, filenameBase['lastIndexOf']('.')),
            };
          })
        : items3,
      exported = await run2({ items: items4 });
    if (exported?.['canceled']) return exported;
    const skipped4 = mergeSkipped(skipped3, exported?.['skipped']);
    if (exported?.['success'])
      return (
        skipped4['length'] > 0
          ? (consoleObject?.['info']?.('[node-batch-export] skipped', skipped4),
            show(
              showToast,
              t('nodeBatchExport.toasts.completedWithSkipped', {
                exported: exported['exportedCount'] || 0,
                skipped: skipped4['length'],
              }),
              'success',
            ))
          : show(
              showToast,
              t('nodeBatchExport.toasts.completed', { count: exported['exportedCount'] || 0 }),
              'success',
            ),
        { ...exported, skipped: skipped4 }
      );
    if (exported?.['code'] === 'NO_EXPORTABLE_ITEMS')
      return (
        show(showToast, t('nodeBatchExport.toasts.noExportable'), 'warn'),
        { ...exported, skipped: skipped4 }
      );
    const value18 = exported?.['message'] || exported?.['error'] || t('nodeBatchExport.toasts.failed');
    return (show(showToast, value18, 'error'), { ...exported, skipped: skipped4 });
  } catch (error4) {
    const message3 = String(error4?.['message'] || error4 || '');
    return (
      show(
        showToast,
        t('nodeBatchExport.toasts.failedWithMessage', {
          message: message3 || t('nodeBatchExport.toasts.failed'),
        }),
        'error',
      ),
      { success: false, canceled: false, error: message3, exportedCount: 0, skipped: skipped3, counts: {} }
    );
  } finally {
    setBatchExportPending(false);
  }
}
