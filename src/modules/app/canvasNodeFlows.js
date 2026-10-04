import { createDefaultCommentNoteStyle } from '../../components/commentNoteStyle.js';
import { findAvailablePosition, generateId, screenToWorld } from '../../core/math.js';
import { t } from '../../i18n/index.js';
import { getNodeSpawnPrefs } from '../nodeSpawn.js';
function getMimeExtension(value, item = 'bin') {
  const list = String(value || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (!list.includes('/')) return item;
  const key = list.split('/')[1] || item;
  return key.replace(/[^a-z0-9]/g, '') || item;
}
function buildSystemClipboardSignature({
  pastedMedia: pastedMedia,
  pastedText: pastedText,
  pastedFiles: pastedFiles,
}) {
  if (Array.isArray(pastedFiles) && pastedFiles.length > 0) {
    const index = pastedFiles
      .map((error) => String(error?.path || error?.name || ''))
      .filter(Boolean)
      .slice(0, 8)
      .join('|');
    return 'files:' + index + '|len:' + pastedFiles.length;
  }
  if (pastedMedia?.mimeType) {
    const result = String(pastedMedia.mimeType).toLowerCase(),
      data = Number(pastedMedia?.blob?.size) || 0;
    return 'media:' + result + '|' + data;
  }
  const list2 = String(pastedText || '');
  if (!list2.trim()) return '';
  const options = list2.slice(0, 0x100);
  return 'text:' + options + '|len:' + list2.length;
}
function resolvePastedMediaDescriptor(target, error2 = {}) {
  const nodeName = String(error2.nodeName || error2.name || '').trim(),
    typeSlug = String(error2.typeSlug || '').trim();
  if (target.startsWith('image/'))
    return {
      nodeType: 'source-image',
      nodeName: nodeName || t('canvasNodeFlows.paste.nodeName.image'),
      typeSlug: typeSlug || 'image',
    };
  if (target.startsWith('video/'))
    return {
      nodeType: 'source-video',
      nodeName: nodeName || t('canvasNodeFlows.paste.nodeName.video'),
      typeSlug: typeSlug || 'video',
    };
  if (target.startsWith('audio/'))
    return {
      nodeType: 'source-audio',
      nodeName: nodeName || t('canvasNodeFlows.paste.nodeName.audio'),
      typeSlug: typeSlug || 'audio',
    };
  return null;
}
function centerNodeAtWorldPosition(box, x2, y2) {
  const source = Number(box?.width) || 0,
    next = Number(box?.height) || 0;
  return { ...box, x: x2 - source / 2, y: y2 - next / 2 };
}
function decodeBase64Bytes(current) {
  const enabled = String(current || '').trim();
  if (!enabled) return new Uint8Array();
  if (typeof atob === 'function') {
    const list3 = atob(enabled),
      uint8Array = new Uint8Array(list3.length);
    for (let entry = 0; entry < list3.length; entry += 1) {
      uint8Array[entry] = list3.charCodeAt(entry);
    }
    return uint8Array;
  }
  if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(enabled, 'base64'));
  return new Uint8Array();
}
function blobFromBase64(record, type2) {
  const list4 = decodeBase64Bytes(record);
  if (!list4.length) return null;
  return new Blob([list4], { type: type2 || 'application/octet-stream' });
}
function normalizeSpawnDirection(payload) {
  return payload === 'left' || payload === 'down' ? payload : 'right';
}
function getSequenceNodes(enabled2, enabled3) {
  if (!enabled3 || !enabled2 || typeof enabled2 !== 'object') return {};
  return Object.fromEntries(
    Object.entries(enabled2).filter(([, handle]) => String(handle?.spawnSequenceKey || '') === enabled3),
  );
}
async function readElectronClipboardContents() {
  const enabled4 = globalThis?.window?.electronAPI?.clipboard;
  if (!enabled4) return { pastedFiles: [], pastedMedia: null, pastedText: '', failed: false };
  const state = { pastedFiles: [], pastedMedia: null, pastedText: '', failed: false };
  try {
    if (typeof enabled4.readFileReferences === 'function') {
      const response = await enabled4.readFileReferences();
      response?.ok && Array.isArray(response.files) && (state.pastedFiles = response.files);
    }
    if (state.pastedFiles.length === 0 && typeof enabled4.readImage === 'function') {
      const response2 = await enabled4.readImage();
      if (response2?.ok && response2.dataBase64) {
        const mimeType = String(response2.mimeType || 'image/png'),
          blob = blobFromBase64(response2.dataBase64, mimeType);
        blob && (state.pastedMedia = { mimeType: mimeType, blob: blob });
      }
    }
    if (typeof enabled4.readText === 'function') {
      const response3 = await enabled4.readText();
      response3?.ok && typeof response3.text === 'string' && (state.pastedText = response3.text);
    }
  } catch (config) {
    (console.warn('[paste] Electron 剪贴板读取失败:', config), (state.failed = true));
  }
  return state;
}
async function readSystemClipboardContents() {
  let pastedMedia2 = null,
    pastedText2 = '',
    pastedFiles2 = [],
    clipboardReadFailed = false;
  const electronClipboardContents = await readElectronClipboardContents();
  ((pastedFiles2 = electronClipboardContents.pastedFiles),
    (pastedMedia2 = electronClipboardContents.pastedMedia),
    (pastedText2 = electronClipboardContents.pastedText),
    (clipboardReadFailed = !!electronClipboardContents.failed));
  try {
    const scope = globalThis?.navigator?.clipboard,
      input = typeof scope?.read === 'function',
      output = typeof scope?.readText === 'function';
    if (pastedFiles2.length === 0 && !pastedMedia2 && input) {
      const value2 = await scope.read();
      for (const value3 of value2) {
        const mimeType2 = value3.types.find(
          (item2) => item2.startsWith('image/') || item2.startsWith('video/') || item2.startsWith('audio/'),
        );
        if (!pastedMedia2 && mimeType2) {
          pastedMedia2 = { mimeType: mimeType2, blob: await value3.getType(mimeType2) };
          continue;
        }
        if (!pastedText2 && value3.types.includes('text/plain')) {
          const response4 = await value3.getType('text/plain');
          pastedText2 = await response4.text();
        }
      }
    }
    !pastedText2 && output && (pastedText2 = await scope.readText());
  } catch (value4) {
    (console.warn('[paste] 剪贴板读取失败:', value4), (clipboardReadFailed = true));
  }
  return {
    pastedFiles: pastedFiles2,
    pastedMedia: pastedMedia2,
    pastedText: pastedText2,
    clipboardReadFailed: clipboardReadFailed,
  };
}
export function createAppCanvasNodeFlows({
  graphStore: graphStore,
  commit: commit,
  getCursorScreenPosition: getCursorScreenPosition,
  getNodeDefaultSize: getNodeDefaultSize,
  getAIGenerationDefaultSizeByType: getAIGenerationDefaultSizeByType,
  getAIGenerationNodeSize: getAIGenerationNodeSize,
  createPanoramaNodeDataByType: createPanoramaNodeDataByType,
  processFile: processFile,
  executeCommand: executeCommand,
  getCurrentProjectId: getCurrentProjectId,
  showToast: showToast,
  loadClipboardModule: loadClipboardModule = () => import('../clipboard.js'),
} = {}) {
  function run() {
    return graphStore?.getStateRaw?.() ?? graphStore?.getState?.() ?? {};
  }
  function run2(options2 = {}) {
    if (options2.placement === 'viewport-center-sequence') return run3();
    const box2 = getCursorScreenPosition?.() || {},
      value5 = typeof box2.x === 'number' && Number.isFinite(box2.x) ? box2.x : window.innerWidth / 2,
      value6 = typeof box2.y === 'number' && Number.isFinite(box2.y) ? box2.y : window.innerHeight / 2,
      value7 =
        typeof options2.screenX === 'number' && Number.isFinite(options2.screenX) ? options2.screenX : value5,
      value8 =
        typeof options2.screenY === 'number' && Number.isFinite(options2.screenY) ? options2.screenY : value6,
      { viewport: viewport } = run();
    return screenToWorld(value7, value8, viewport);
  }
  function run3() {
    const value9 = window.innerWidth / 2,
      value10 = window.innerHeight / 2,
      { viewport: viewport2 } = run();
    return screenToWorld(value9, value10, viewport2);
  }
  function createNodeAtCursor(type3, width2, height2, name2, value11 = {}) {
    const { x: x3, y: y3 } = run2(value11),
      id2 = generateId(type3),
      box3 =
        type3 === 'ai-text'
          ? getAIGenerationDefaultSizeByType('ai-text')
          : type3 === 'ai-image' || type3 === 'ai-video'
            ? getAIGenerationNodeSize(width2, height2)
            : { width: width2, height: height2 },
      width3 = box3.width,
      height3 = box3.height,
      box4 = createPanoramaNodeDataByType?.({
        type: type3,
        id: id2,
        x: x3 - width3 / 2,
        y: y3 - height3 / 2,
        width: width3,
        height: height3,
        name: name2,
      }) || {
        id: id2,
        type: type3,
        x: x3 - width3 / 2,
        y: y3 - height3 / 2,
        width: width3,
        height: height3,
        name: name2,
      };
    type3 === 'comment-note' &&
      ((box4.name = ''), (box4.content = ''), (box4.style = createDefaultCommentNoteStyle()));
    if (value11.placement === 'viewport-center-sequence') {
      const { spacing: spacing, direction: direction, avoidOverlap: avoidOverlap } = getNodeSpawnPrefs(),
        spawnDirection = normalizeSpawnDirection(direction),
        value12 = x3 - width3 / 2,
        value13 = y3 - height3 / 2,
        value14 = run().nodes || {},
        value15 = String(value11.sequenceKey || '').trim(),
        value16 = avoidOverlap ? value14 : getSequenceNodes(value14, value15),
        box5 = findAvailablePosition(value16, value12, value13, width3, height3, spacing, spawnDirection);
      ((box4.x = box5.x), (box4.y = box5.y));
      if (value15) box4.spawnSequenceKey = value15;
    }
    return (
      graphStore.addNode(box4),
      graphStore.setSelectedNodes([id2]),
      value11.skipCommit !== !![] && commit(),
      box4
    );
  }
  async function run4(enabled5, type4, value17, value18, value11 = {}) {
    if (!enabled5 || !type4) return false;
    const pastedMediaDescriptor = resolvePastedMediaDescriptor(String(type4), value11);
    if (!pastedMediaDescriptor) return false;
    const mimeExtension = getMimeExtension(type4, 'dat'),
      value19 = 'pasted-' + pastedMediaDescriptor.typeSlug + '-' + Date.now() + '.' + mimeExtension,
      file = new File([enabled5], value19, { type: type4 }),
      value20 = getCurrentProjectId?.() || 'default_v2_project',
      enabled6 = await processFile(file, value17, value18, value20);
    if (!enabled6) return false;
    const box6 = centerNodeAtWorldPosition(enabled6, value17, value18);
    if (value11.placement === 'viewport-center-sequence') {
      const { spacing: spacing, direction: direction, avoidOverlap: avoidOverlap } = getNodeSpawnPrefs(),
        spawnDirection = normalizeSpawnDirection(direction),
        value21 = Number(box6.width) || 0x12c,
        value22 = Number(box6.height) || 200,
        value12 = value17 - value21 / 2,
        value13 = value18 - value22 / 2,
        value14 = run().nodes || {},
        value15 = String(value11.sequenceKey || '').trim(),
        value16 = avoidOverlap ? value14 : getSequenceNodes(value14, value15),
        box5 = findAvailablePosition(value16, value12, value13, value21, value22, spacing, spawnDirection);
      ((box6.x = box5.x), (box6.y = box5.y));
      if (value15) box6.spawnSequenceKey = value15;
    }
    return (
      (box6.name = pastedMediaDescriptor.nodeName),
      graphStore.addNode(box6),
      graphStore.setSelectedNodes([box6.id]),
      commit(),
      true
    );
  }
  async function createMediaNodeFromBlob(value23, value24, value25 = {}) {
    const { x: x4, y: y4 } = run2(value25);
    return await run4(value23, value24, x4, y4, value25);
  }
  function run5(error3) {
    if (typeof File !== 'function') return null;
    const value26 = String(error3?.path || '').trim(),
      value27 = String(error3?.name || value26.split(/[\\/]/).pop() || 'clipboard-file'),
      type5 = String(error3?.type || '').trim();
    if (!value26 || !type5) return null;
    const file2 = new File([], value27, { type: type5 });
    try {
      Object.defineProperty(file2, 'path', { value: value26, configurable: true });
    } catch {
      file2.path = value26;
    }
    return file2;
  }
  async function run6(value28, value29, value30) {
    const value31 = String(value28?.type || '').trim(),
      pastedMediaDescriptor2 = resolvePastedMediaDescriptor(value31);
    if (!pastedMediaDescriptor2) return false;
    const enabled7 = run5(value28);
    if (!enabled7) return false;
    const value32 = getCurrentProjectId?.() || 'default_v2_project',
      enabled8 = await processFile(enabled7, value29, value30, value32);
    if (!enabled8) return false;
    const error4 = centerNodeAtWorldPosition(enabled8, value29, value30);
    return (
      (error4.name = pastedMediaDescriptor2.nodeName),
      graphStore.addNode(error4),
      graphStore.setSelectedNodes([error4.id]),
      commit(),
      true
    );
  }
  async function run7(list5, value33, value34) {
    if (!Array.isArray(list5) || list5.length === 0) return 0;
    let value35 = 0;
    for (const value36 of list5) {
      const value37 = value35 * 30,
        value38 = await run6(value36, value33 + value37, value34 + value37);
      if (value38) value35 += 1;
    }
    return value35;
  }
  function run8(value39, x5, y5) {
    const { width: width4, height: height4 } = getNodeDefaultSize('source-text'),
      id3 = generateId('source-text');
    (graphStore.addNode({
      id: id3,
      type: 'source-text',
      x: x5 - width4 / 2,
      y: y5 - height4 / 2,
      width: width4,
      height: height4,
      name: t('canvasNodeFlows.paste.nodeName.text'),
      content: String(value39 || ''),
    }),
      graphStore.setSelectedNodes([id3]),
      commit());
  }
  async function handlePasteFromClipboard(options3 = {}) {
    const { x: x6, y: y6 } = run2(options3),
      {
        getClipboard: getClipboard,
        getClipboardMeta: getClipboardMeta,
        observeSystemClipboardSignature: observeSystemClipboardSignature,
      } = await loadClipboardModule(),
      list6 = getClipboard(),
      value40 = getClipboardMeta(),
      {
        pastedFiles: pastedFiles3,
        pastedMedia: pastedMedia3,
        pastedText: pastedText3,
        clipboardReadFailed: clipboardReadFailed2,
      } = await readSystemClipboardContents(),
      enabled9 = String(pastedText3 || '').trim(),
      enabled10 = (Array.isArray(pastedFiles3) && pastedFiles3.length > 0) || !!pastedMedia3 || !!enabled9,
      enabled11 = enabled10
        ? buildSystemClipboardSignature({
            pastedFiles: pastedFiles3,
            pastedMedia: pastedMedia3,
            pastedText: pastedText3,
          })
        : '',
      value41 = list6 && list6.length > 0,
      count = Number(value40?.copiedAt) || 0,
      count2 = Number(value40?.systemCopiedAt) || 0,
      enabled12 = String(value40?.systemSignatureAtCopy || ''),
      enabled13 = String(value40?.systemSignature || '');
    enabled11 && observeSystemClipboardSignature(enabled11);
    if (value41) {
      const enabled14 = count2 > count && count > 0,
        value42 = count > count2 && count2 > 0,
        value43 = !!enabled12 && !!enabled11,
        value44 = value43 ? enabled12 === enabled11 : false,
        enabled15 = value43 ? enabled12 !== enabled11 : false,
        value45 = !enabled12 && !!enabled13 && enabled13 === enabled11,
        value46 = !enabled10 || value44 || (value42 && value45);
      if (value46 && !enabled14 && !enabled15) {
        executeCommand('paste', { x: x6, y: y6 });
        return;
      }
    }
    if (Array.isArray(pastedFiles3) && pastedFiles3.length > 0) {
      const count3 = await run7(pastedFiles3, x6, y6);
      if (count3 > 0) {
        showToast?.(
          count3 === 1
            ? t('canvasNodeFlows.paste.filePasted')
            : t('canvasNodeFlows.paste.filesPasted', { count: count3 }),
          'success',
        );
        return;
      }
    }
    if (pastedMedia3) {
      const value47 = await run4(pastedMedia3.blob, pastedMedia3.mimeType, x6, y6);
      if (value47) {
        const label = pastedMedia3.mimeType.startsWith('image/')
          ? t('canvasNodeFlows.media.image')
          : pastedMedia3.mimeType.startsWith('video/')
            ? t('canvasNodeFlows.media.video')
            : t('canvasNodeFlows.media.audio');
        showToast?.(t('canvasNodeFlows.paste.mediaPasted', { label: label }), 'success');
        return;
      }
    }
    if (enabled9) {
      (run8(enabled9, x6, y6), showToast?.(t('canvasNodeFlows.paste.textPasted'), 'success'));
      return;
    }
    if (list6 && list6.length > 0) {
      executeCommand('paste', { x: x6, y: y6 });
      return;
    }
    if (clipboardReadFailed2) {
      showToast?.(t('canvasNodeFlows.paste.clipboardReadFailed'), 'error');
      return;
    }
    showToast?.(t('canvasNodeFlows.paste.clipboardEmpty'), 'warning');
  }
  return {
    createNodeAtCursor: createNodeAtCursor,
    createMediaNodeFromBlob: createMediaNodeFromBlob,
    handlePasteFromClipboard: handlePasteFromClipboard,
  };
}
