import { createDefaultCommentNoteStyle } from '../../components/commentNoteStyle.js';
import {
  findAvailablePosition,
  generateId,
  getViewportScreenCenter,
  screenToWorld,
} from '../../core/math.js';
import { t } from '../../i18n/index.js';
import { getNodeSpawnPrefs } from '../nodeSpawn.js';
import { desktopBridge } from '../../services/desktopBridge.js';
import { buildClipboardMediaSignature, clipboardImageBlobFromBase64 } from '../clipboardMediaSignature.js';
function getMimeExtension(value, item = 'bin') {
  const list = String(value || '')
    ['split'](';')[0]
    ['trim']()
    ['toLowerCase']();
  if (!list['includes']('/')) return item;
  const key = list['split']('/')[1] || item;
  return key['replace'](/[^a-z0-9]/g, '') || item;
}
async function buildSystemClipboardSignature({
  pastedMedia: pastedMedia,
  pastedText: pastedText,
  pastedFiles: pastedFiles,
}) {
  if (Array['isArray'](pastedFiles) && pastedFiles['length'] > 0) {
    const index = pastedFiles['map']((error) =>
      String(error?.['path'] || error?.['name'] || ''),
    )
      ['filter'](Boolean)
      ['slice'](0, 8)
      ['join']('|');
    return 'files:' + index + '|len:' + pastedFiles['length'];
  }
  if (pastedMedia?.['mimeType'])
    return await buildClipboardMediaSignature(pastedMedia['blob'], pastedMedia['mimeType']);
  const list2 = String(pastedText || '');
  if (!list2['trim']()) return '';
  const result = list2['slice'](0, 256);
  return 'text:' + result + '|len:' + list2['length'];
}
function resolvePastedMediaDescriptor(data, error2 = {}) {
  const nodeName = String(error2['nodeName'] || error2['name'] || '')['trim'](),
    typeSlug = String(error2['typeSlug'] || '')['trim']();
  if (data['startsWith']('image/'))
    return {
      nodeType: 'source-image',
      nodeName: nodeName || t('canvasNodeFlows.paste.nodeName.image'),
      typeSlug: typeSlug || 'image',
    };
  if (data['startsWith']('video/'))
    return {
      nodeType: 'source-video',
      nodeName: nodeName || t('canvasNodeFlows.paste.nodeName.video'),
      typeSlug: typeSlug || 'video',
    };
  if (data['startsWith']('audio/'))
    return {
      nodeType: 'source-audio',
      nodeName: nodeName || t('canvasNodeFlows.paste.nodeName.audio'),
      typeSlug: typeSlug || 'audio',
    };
  return null;
}
function centerNodeAtWorldPosition(box, x2, y2) {
  const options = Number(box?.['width']) || 0,
    target = Number(box?.['height']) || 0;
  return { ...box, x: x2 - options / 2, y: y2 - target / 2 };
}
function normalizeSpawnDirection(source) {
  return source === 'left' || source === 'down' ? source : 'right';
}
function toFinitePositiveNumber(next, current) {
  const count = Number(next);
  return Number['isFinite'](count) && count > 0 ? count : current;
}
function getCssPixelValue(entry, record = 0) {
  const dom = globalThis['document'];
  if (!dom) return record;
  try {
    const payload = globalThis['getComputedStyle']?.(dom['body'])?.['getPropertyValue']?.(entry),
      handle = Number['parseFloat'](payload);
    return Number['isFinite'](handle) ? handle : record;
  } catch {
    return record;
  }
}
function getVisibleCanvasCenterScreenPosition(options2 = {}) {
  const state = globalThis['window'] || {},
    toFinitePositiveNumber2 = toFinitePositiveNumber(state['innerWidth'], 0),
    toFinitePositiveNumber3 = toFinitePositiveNumber(state['innerHeight'], 0);
  let config = toFinitePositiveNumber2;
  try {
    const el = globalThis['document'],
      el2 = el?.['body'];
    if (
      el2?.['classList']?.['contains']?.('agent-sidebar-open') &&
      !el2['classList']['contains']('agent-sidebar-collapsed')
    ) {
      const el3 = el['querySelector']?.('.agent-sidebar.is-open'),
        count2 = Number(el3?.['getBoundingClientRect']?.()?.['width']),
        scope =
          Number['isFinite'](count2) && count2 > 0
            ? count2
            : getCssPixelValue('--agent-sidebar-width', 0);
      config = Math['max'](1, toFinitePositiveNumber2 - scope);
    }
  } catch {}
  return getViewportScreenCenter(options2, config, toFinitePositiveNumber3);
}
function getSequenceNodes(enabled, enabled2) {
  if (!enabled2 || !enabled || typeof enabled !== 'object') return {};
  return Object['fromEntries'](
    Object['entries'](enabled)['filter'](
      ([, input]) => String(input?.['spawnSequenceKey'] || '') === enabled2,
    ),
  );
}
async function readElectronClipboardContents() {
  const enabled3 = desktopBridge['clipboard'];
  if (!enabled3['canUseFiles']() && !enabled3['canUseImages']() && !enabled3['canUseText']())
    return { pastedFiles: [], pastedMedia: null, pastedText: '', failed: false };
  const output = {
    pastedFiles: [],
    pastedMedia: null,
    pastedText: '',
    failed: false,
    imageReadSucceeded: false,
  };
  try {
    if (typeof enabled3['readFileReferences'] === 'function') {
      const response = await enabled3['readFileReferences']();
      if (response?.['reason'] === 'read-failed') output['failed'] = true;
      response?.['ok'] &&
        Array['isArray'](response['files']) &&
        (output['pastedFiles'] = response['files']);
    }
    if (output['pastedFiles']['length'] === 0 && typeof enabled3['readImage'] === 'function') {
      const response2 = await enabled3['readImage']();
      output['imageReadSucceeded'] = response2?.['ok'] === true || response2?.['reason'] === 'no-image';
      if (response2?.['reason'] && response2['reason'] !== 'no-image') output['failed'] = true;
      if (response2?.['ok'] && response2['dataBase64']) {
        const mimeType = String(response2['mimeType'] || 'image/png'),
          blob = clipboardImageBlobFromBase64(response2['dataBase64'], mimeType);
        blob && (output['pastedMedia'] = { mimeType: mimeType, blob: blob });
      }
    }
    if (typeof enabled3['readText'] === 'function') {
      const response3 = await enabled3['readText']();
      if (response3?.['reason'] === 'read-failed') output['failed'] = true;
      response3?.['ok'] &&
        typeof response3['text'] === 'string' &&
        (output['pastedText'] = response3['text']);
    }
  } catch (value2) {
    (console['warn']('[paste] Electron 剪贴板读取失败:', value2), (output['failed'] = true));
  }
  return output;
}
async function readSystemClipboardContents() {
  let pastedMedia2 = null,
    pastedText2 = '',
    pastedFiles2 = [],
    clipboardReadFailed = false;
  const electronClipboardContents = await readElectronClipboardContents();
  ((pastedFiles2 = electronClipboardContents['pastedFiles']),
    (pastedMedia2 = electronClipboardContents['pastedMedia']),
    (pastedText2 = electronClipboardContents['pastedText']),
    (clipboardReadFailed = !!electronClipboardContents['failed']));
  try {
    const value3 = globalThis?.['navigator']?.['clipboard'],
      value4 = typeof value3?.['read'] === 'function',
      value5 = typeof value3?.['readText'] === 'function';
    if (pastedFiles2['length'] === 0 && !pastedMedia2 && value4) {
      const value6 = await value3['read']();
      for (const value7 of value6) {
        const mimeType2 = value7['types']['find'](
          (value8) =>
            value8['startsWith']('image/') ||
            value8['startsWith']('video/') ||
            value8['startsWith']('audio/'),
        );
        if (!pastedMedia2 && mimeType2) {
          pastedMedia2 = { mimeType: mimeType2, blob: await value7['getType'](mimeType2) };
          continue;
        }
        if (!pastedText2 && value7['types']['includes']('text/plain')) {
          const response4 = await value7['getType']('text/plain');
          pastedText2 = await response4['text']();
        }
      }
    }
    !pastedText2 &&
      !pastedMedia2 &&
      pastedFiles2['length'] === 0 &&
      value5 &&
      (pastedText2 = await value3['readText']());
  } catch (value9) {
    (console['warn']('[paste] 剪贴板读取失败:', value9),
      (clipboardReadFailed = !!electronClipboardContents['failed'] || !electronClipboardContents['imageReadSucceeded']));
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
  getCanvasIdentity: getCanvasIdentity = () => getCurrentProjectId?.(),
  showToast: showToast,
  loadClipboardModule: loadClipboardModule = () => import('../clipboard.js'),
} = {}) {
  function run(args = {}) {
    const canvasIdentity = getCanvasIdentity();
    return {
      ...args,
      projectId: getCurrentProjectId?.() || 'default_v2_project',
      isImportCurrent: () => canvasIdentity === getCanvasIdentity() && args['isImportCurrent']?.() !== false,
    };
  }
  function run2() {
    return graphStore?.['getStateRaw']?.() ?? graphStore?.['getState']?.() ?? {};
  }
  function run3(options3 = {}) {
    if (options3['placement'] === 'viewport-center-sequence') return run4();
    const { viewport: viewport } = run2(),
      box2 = getVisibleCanvasCenterScreenPosition(viewport),
      box3 = getCursorScreenPosition?.() || {},
      value10 =
        typeof box3['x'] === 'number' && Number['isFinite'](box3['x'])
          ? box3['x']
          : box2['x'],
      value11 =
        typeof box3['y'] === 'number' && Number['isFinite'](box3['y'])
          ? box3['y']
          : box2['y'],
      value12 =
        typeof options3['screenX'] === 'number' && Number['isFinite'](options3['screenX'])
          ? options3['screenX']
          : value10,
      value13 =
        typeof options3['screenY'] === 'number' && Number['isFinite'](options3['screenY'])
          ? options3['screenY']
          : value11;
    return screenToWorld(value12, value13, viewport);
  }
  function run4() {
    const { viewport: viewport2 } = run2(),
      { x: x3, y: y3 } = getVisibleCanvasCenterScreenPosition(viewport2);
    return screenToWorld(x3, y3, viewport2);
  }
  function createNodeAtCursor(type2, width2, height2, name2, value14 = {}) {
    const { x: x4, y: y4 } = run3(value14),
      id2 = generateId(type2),
      box4 =
        type2 === 'ai-text'
          ? getAIGenerationDefaultSizeByType('ai-text')
          : type2 === 'ai-image' || type2 === 'ai-video'
            ? getAIGenerationNodeSize(width2, height2)
            : { width: width2, height: height2 },
      width3 = box4['width'],
      height3 = box4['height'],
      box5 = createPanoramaNodeDataByType?.({
        type: type2,
        id: id2,
        x: x4 - width3 / 2,
        y: y4 - height3 / 2,
        width: width3,
        height: height3,
        name: name2,
      }) || {
        id: id2,
        type: type2,
        x: x4 - width3 / 2,
        y: y4 - height3 / 2,
        width: width3,
        height: height3,
        name: name2,
      };
    type2 === 'comment-note' &&
      ((box5['name'] = ''),
      (box5['content'] = ''),
      (box5['style'] = createDefaultCommentNoteStyle()));
    if (value14['placement'] === 'viewport-center-sequence') {
      const { spacing: spacing, direction: direction, avoidOverlap: avoidOverlap } = getNodeSpawnPrefs(),
        spawnDirection = normalizeSpawnDirection(direction),
        value15 = x4 - width3 / 2,
        value16 = y4 - height3 / 2,
        value17 = run2()['nodes'] || {},
        value18 = String(value14['sequenceKey'] || '')['trim'](),
        value19 = avoidOverlap ? value17 : getSequenceNodes(value17, value18),
        box6 = findAvailablePosition(
          value19,
          value15,
          value16,
          width3,
          height3,
          spacing,
          spawnDirection,
        );
      ((box5['x'] = box6['x']), (box5['y'] = box6['y']));
      if (value18) box5['spawnSequenceKey'] = value18;
    }
    (graphStore['addNode'](box5), graphStore['setSelectedNodes']([id2]));
    if (value14['skipCommit'] !== true) commit();
    return box5;
  }
  async function run5(enabled4, type3, value20, value21, value22 = {}) {
    if (!enabled4 || !type3) return false;
    const pastedMediaDescriptor = resolvePastedMediaDescriptor(String(type3), value22);
    if (!pastedMediaDescriptor) return false;
    const mimeExtension = getMimeExtension(type3, 'dat'),
      value23 = 'pasted-' + pastedMediaDescriptor['typeSlug'] + '-' + Date['now']() + '.' + mimeExtension,
      file = new File([enabled4], value23, { type: type3 }),
      value24 = value22['projectId'] || getCurrentProjectId?.() || 'default_v2_project',
      enabled5 = await processFile(file, value20, value21, value24);
    if (!enabled5) return false;
    if (value22['isImportCurrent']?.() === false) return false;
    const box7 = centerNodeAtWorldPosition(enabled5, value20, value21);
    if (value22['placement'] === 'viewport-center-sequence') {
      const { spacing: spacing2, direction: direction2, avoidOverlap: avoidOverlap2 } = getNodeSpawnPrefs(),
        spawnDirection2 = normalizeSpawnDirection(direction2),
        value25 = Number(box7['width']) || 300,
        value26 = Number(box7['height']) || 200,
        value27 = value20 - value25 / 2,
        value28 = value21 - value26 / 2,
        value29 = run2()['nodes'] || {},
        value30 = String(value22['sequenceKey'] || '')['trim'](),
        value31 = avoidOverlap2 ? value29 : getSequenceNodes(value29, value30),
        box8 = findAvailablePosition(
          value31,
          value27,
          value28,
          value25,
          value26,
          spacing2,
          spawnDirection2,
        );
      ((box7['x'] = box8['x']), (box7['y'] = box8['y']));
      if (value30) box7['spawnSequenceKey'] = value30;
    }
    return (
      (box7['name'] = pastedMediaDescriptor['nodeName']),
      graphStore['addNode'](box7),
      graphStore['setSelectedNodes']([box7['id']]),
      commit(),
      value22['returnNode'] === true ? box7 : true
    );
  }
  async function createMediaNodeFromBlob(value32, value33, value34 = {}) {
    value34 = run(value34);
    const { x: x5, y: y5 } = run3(value34);
    return await run5(value32, value33, x5, y5, value34);
  }
  function run6(error3) {
    if (typeof File !== 'function') return null;
    const value35 = String(error3?.['path'] || '')['trim'](),
      value36 = String(error3?.['name'] || value35['split'](/[\\/]/)['pop']() || 'clipboard-file'),
      type4 = String(error3?.['type'] || '')['trim']();
    if (!value35 || !type4) return null;
    const file2 = new File([], value36, { type: type4 });
    try {
      Object['defineProperty'](file2, 'path', { value: value35, configurable: true });
    } catch {
      file2['path'] = value35;
    }
    return file2;
  }
  async function run7(value37, value38, value39, enabled6) {
    const value40 = String(value37?.['type'] || '')['trim'](),
      pastedMediaDescriptor2 = resolvePastedMediaDescriptor(value40);
    if (!pastedMediaDescriptor2) return false;
    const enabled7 = run6(value37);
    if (!enabled7) return false;
    const value41 = enabled6['projectId'],
      enabled8 = await processFile(enabled7, value38, value39, value41);
    if (!enabled8 || !enabled6['isImportCurrent']()) return false;
    const error4 = centerNodeAtWorldPosition(enabled8, value38, value39);
    return (
      (error4['name'] = pastedMediaDescriptor2['nodeName']),
      graphStore['addNode'](error4),
      graphStore['setSelectedNodes']([error4['id']]),
      commit(),
      true
    );
  }
  async function run8(list3, value42, value43, enabled9) {
    if (!Array['isArray'](list3) || list3['length'] === 0) return 0;
    let value44 = 0;
    for (const value45 of list3) {
      if (!enabled9['isImportCurrent']()) break;
      const value46 = value44 * 30,
        value47 = await run7(value45, value42 + value46, value43 + value46, enabled9);
      if (value47) value44 += 1;
    }
    return value44;
  }
  function run9(value48, x6, y6) {
    const { width: width4, height: height4 } = getNodeDefaultSize('source-text'),
      id3 = generateId('source-text');
    (graphStore['addNode']({
      id: id3,
      type: 'source-text',
      x: x6 - width4 / 2,
      y: y6 - height4 / 2,
      width: width4,
      height: height4,
      name: t('canvasNodeFlows.paste.nodeName.text'),
      content: String(value48 || ''),
    }),
      graphStore['setSelectedNodes']([id3]),
      commit());
  }
  async function handlePasteFromClipboard(enabled10 = {}) {
    enabled10 = run(enabled10);
    const { x: x7, y: y7 } = run3(enabled10),
      {
        getClipboard: getClipboard,
        getClipboardMeta: getClipboardMeta,
        observeSystemClipboardSignature: observeSystemClipboardSignature,
      } = await loadClipboardModule();
    if (!enabled10['isImportCurrent']()) return;
    const list4 = getClipboard(),
      value49 = getClipboardMeta(),
      {
        pastedFiles: pastedFiles3,
        pastedMedia: pastedMedia3,
        pastedText: pastedText3,
        clipboardReadFailed: clipboardReadFailed2,
      } = await readSystemClipboardContents();
    if (!enabled10['isImportCurrent']()) return;
    const enabled11 = String(pastedText3 || '')['trim'](),
      enabled12 = (Array['isArray'](pastedFiles3) && pastedFiles3['length'] > 0) || !!pastedMedia3 || !!enabled11,
      enabled13 = enabled12
        ? await buildSystemClipboardSignature({
            pastedFiles: pastedFiles3,
            pastedMedia: pastedMedia3,
            pastedText: pastedText3,
          })
        : '';
    if (!enabled10['isImportCurrent']()) return;
    const value50 = list4 && list4['length'] > 0,
      count3 = Number(value49?.['copiedAt']) || 0,
      count4 = Number(value49?.['systemCopiedAt']) || 0,
      enabled14 = String(value49?.['systemSignatureAtCopy'] || ''),
      enabled15 = String(value49?.['systemSignature'] || '');
    enabled13 && observeSystemClipboardSignature(enabled13);
    if (value50) {
      const enabled16 = count4 > count3 && count3 > 0,
        value51 = count3 > count4 && count4 > 0,
        value52 = !!enabled14 && !!enabled13,
        value53 = value52 ? enabled14 === enabled13 : false,
        enabled17 = value52 ? enabled14 !== enabled13 : false,
        value54 = !enabled14 && !!enabled15 && enabled15 === enabled13,
        value55 = (!enabled12 && !clipboardReadFailed2) || value53 || (value51 && value54);
      if (value55 && !enabled16 && !enabled17) {
        executeCommand('paste', { x: x7, y: y7 });
        return;
      }
    }
    if (Array['isArray'](pastedFiles3) && pastedFiles3['length'] > 0) {
      const count5 = await run8(pastedFiles3, x7, y7, enabled10);
      if (!enabled10['isImportCurrent']()) return;
      if (count5 > 0) {
        showToast?.(
          count5 === 1
            ? t('canvasNodeFlows.paste.filePasted')
            : t('canvasNodeFlows.paste.filesPasted', { count: count5 }),
          'success',
        );
        return;
      }
    }
    if (pastedMedia3) {
      const value56 = await run5(
        pastedMedia3['blob'],
        pastedMedia3['mimeType'],
        x7,
        y7,
        enabled10,
      );
      if (!enabled10['isImportCurrent']()) return;
      if (value56) {
        const label = pastedMedia3['mimeType']['startsWith']('image/')
          ? t('canvasNodeFlows.media.image')
          : pastedMedia3['mimeType']['startsWith']('video/')
            ? t('canvasNodeFlows.media.video')
            : t('canvasNodeFlows.media.audio');
        showToast?.(t('canvasNodeFlows.paste.mediaPasted', { label: label }), 'success');
        return;
      }
    }
    if (enabled11) {
      (run9(enabled11, x7, y7),
        showToast?.(t('canvasNodeFlows.paste.textPasted'), 'success'));
      return;
    }
    if (list4 && list4['length'] > 0 && !clipboardReadFailed2) {
      executeCommand('paste', { x: x7, y: y7 });
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
