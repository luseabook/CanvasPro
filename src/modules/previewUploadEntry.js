import appStore from '../core/stores/appStore.js';
import { t } from '../i18n/index.js';
import { uploadFile } from './project.js';
import { isPreviewModeEnabled } from './previewMode.js';
import {
  applyUploadedPreviewAudioResult,
  applyUploadedPreviewImageResult,
  applyUploadedPreviewVideoResult,
} from './previewUploadResult.js';
const PREVIEW_UPLOAD_TYPES = {
  image: {
    accept: 'image/*',
    mimePrefix: 'image/',
    labelKey: 'previewUpload.types.image',
    successMessageKey: 'previewUpload.success.image',
    applyResult: applyUploadedPreviewImageResult,
    nodeTypes: new Set(['source-image', 'image', 'ai-image']),
  },
  video: {
    accept: 'video/*',
    mimePrefix: 'video/',
    labelKey: 'previewUpload.types.video',
    successMessageKey: 'previewUpload.success.video',
    applyResult: applyUploadedPreviewVideoResult,
    nodeTypes: new Set(['source-video', 'video', 'ai-video']),
  },
  audio: {
    accept: 'audio/*',
    mimePrefix: 'audio/',
    labelKey: 'previewUpload.types.audio',
    successMessageKey: 'previewUpload.success.audio',
    applyResult: applyUploadedPreviewAudioResult,
    nodeTypes: new Set(['ai-audio']),
  },
};
function previewUploadText(value, item = {}) {
  return t('previewUpload.' + value, item);
}
function getPreviewUploadTypeLabel(key) {
  return t(key.labelKey);
}
function getPreviewUploadSuccessMessage(index) {
  return t(index.successMessageKey);
}
function getState(store) {
  return store?.getState?.() || {};
}
function getToast(result) {
  return typeof result === 'function' ? result : globalThis.window?.showToast;
}
function setButtonBusy(el, data) {
  if (!el) return;
  if (data) {
    !el.dataset.previewUploadLabel &&
      (el.dataset.previewUploadLabel = el.textContent || previewUploadText('upload'));
    ((el.disabled = true), (el.textContent = previewUploadText('uploading')));
    return;
  }
  ((el.disabled = false), (el.textContent = el.dataset.previewUploadLabel || previewUploadText('upload')));
}
export function resolvePreviewUploadTarget(options = {}) {
  const list = Array.isArray(options.selectedNodeIds) ? options.selectedNodeIds.filter(Boolean) : [];
  if (list.length !== 1) return { ok: false, message: previewUploadText('selectSingleNode') };
  const nodeId = list[0],
    node = options.nodes?.[nodeId];
  if (!node) return { ok: false, message: previewUploadText('selectedNodeMissing') };
  const target = String(node.type || '').trim();
  for (const [kind, accept] of Object.entries(PREVIEW_UPLOAD_TYPES)) {
    if (!accept.nodeTypes.has(target)) continue;
    return {
      ok: true,
      kind: kind,
      nodeId: nodeId,
      node: node,
      accept: accept.accept,
      mimePrefix: accept.mimePrefix,
      label: getPreviewUploadTypeLabel(accept),
      successMessage: getPreviewUploadSuccessMessage(accept),
      applyResult: accept.applyResult,
    };
  }
  return { ok: false, message: previewUploadText('unsupportedNode') };
}
export async function handlePreviewUploadFile({
  file: file,
  button: button = null,
  storeApi: storeApi = appStore,
  uploadFileImpl: uploadFileImpl = uploadFile,
  showToast: showToast = null,
  getProjectId: getProjectId = () => globalThis.window?.currentProjectId || 'default_v2_project',
  applyResults: applyResults = {},
} = {}) {
  const toast = getToast(showToast),
    label = resolvePreviewUploadTarget(getState(storeApi));
  if (!label.ok) return (toast?.(label.message, 'warn'), false);
  if (!file) return false;
  if (!String(file.type || '').startsWith(label.mimePrefix))
    return (toast?.(previewUploadText('invalidFileType', { label: label.label }), 'error'), false);
  setButtonBusy(button, true);
  try {
    const uploadRes = await uploadFileImpl(file, getProjectId()),
      handler = applyResults[label.kind] || label.applyResult;
    return (
      handler({ nodeId: label.nodeId, uploadRes: uploadRes, fileName: file.name }),
      toast?.(label.successMessage, 'success'),
      true
    );
  } catch (error) {
    return (toast?.(error?.message || previewUploadText('uploadFailed'), 'error'), false);
  } finally {
    setButtonBusy(button, false);
  }
}
export function bindPreviewUploadEntry({
  button: button2,
  input: input2,
  storeApi: storeApi = appStore,
  uploadFileImpl: uploadFileImpl = uploadFile,
  showToast: showToast = null,
  getProjectId: getProjectId2,
  applyResults: applyResults2,
} = {}) {
  if (!button2 || !input2) return null;
  const toast2 = getToast(showToast),
    source = () => {
      if (!isPreviewModeEnabled()) return;
      const error2 = resolvePreviewUploadTarget(getState(storeApi));
      if (!error2.ok) {
        toast2?.(error2.message, 'warn');
        return;
      }
      ((input2.accept = error2.accept), (input2.value = ''), input2.click?.());
    },
    async2 = async () => {
      const file2 = input2.files?.[0];
      if (!file2) return;
      try {
        await handlePreviewUploadFile({
          file: file2,
          button: button2,
          storeApi: storeApi,
          uploadFileImpl: uploadFileImpl,
          showToast: showToast,
          getProjectId: getProjectId2,
          applyResults: applyResults2,
        });
      } finally {
        input2.value = '';
      }
    };
  return (
    button2.addEventListener('click', source),
    input2.addEventListener('change', async2),
    () => {
      (button2.removeEventListener?.('click', source), input2.removeEventListener?.('change', async2));
    }
  );
}

const OPTIMISTIC_IMAGE_PREVIEW_SELECTOR = '.preview-upload-optimistic-media';
const DEFAULT_OPTIMISTIC_PREVIEW_FINALIZE_DELAY_MS = 350;
const DEFAULT_OPTIMISTIC_PREVIEW_COMMIT_TIMEOUT_MS = 30000;

function shouldReadPreviewUploadNaturalSize(options2 = {}) {
  return options2['kind'] === 'image';
}

function setToolbarUploadButtonBusy(enabled, next) {
  if (!enabled) return;
  ((enabled['disabled'] = next === true),
    enabled['classList']?.['toggle']?.('is-uploading', next === true),
    enabled['classList']?.['toggle']?.('is-task-running', next === true),
    next === true
      ? enabled['setAttribute']?.('aria-busy', 'true')
      : enabled['removeAttribute']?.('aria-busy'));
}

function createToolbarUploadInput(el2) {
  const enabled2 = el2?.['ownerDocument'] || globalThis['document'] || null;
  if (!enabled2?.['createElement']) return null;
  const el3 = enabled2['createElement']('input');
  ((el3['type'] = 'file'), (el3['hidden'] = true), (el3['className'] = 'node-toolbar-upload-input'));
  const current =
    el2?.['closest']?.('.node-floating-toolbar') || el2?.['parentNode'] || enabled2['body'] || null;
  return (current?.['appendChild']?.(el3), el3);
}

function getUrlApi() {
  return globalThis['URL'] || globalThis['webkitURL'] || null;
}

function safelyCreateObjectUrl(enabled3) {
  const urlApi = getUrlApi();
  if (!enabled3 || typeof urlApi?.['createObjectURL'] !== 'function') return '';
  try {
    return String(urlApi['createObjectURL'](enabled3) || '')['trim']();
  } catch {
    return '';
  }
}

function safelyRevokeObjectUrl(enabled4) {
  if (!enabled4 || !String(enabled4)['startsWith']('blob:')) return;
  const urlApi2 = getUrlApi();
  try {
    urlApi2?.['revokeObjectURL']?.(enabled4);
  } catch {}
}

function getMountedPreviewElement(entry) {
  const enabled5 = String(entry || '')['trim']();
  if (!enabled5) return null;
  const record = globalThis['window']?.['v2Renderer'];
  try {
    record?.['hydrateDeferredNodeForImmediateMedia']?.(enabled5);
  } catch {}
  try {
    const payload = record?.['queryMountedNodeElement']?.(enabled5, '.img-node-preview');
    if (payload) return payload;
  } catch {}
  const handle = globalThis['document'],
    el4 = typeof record?.['getMountedWrapper'] === 'function' ? record['getMountedWrapper'](enabled5) : null;
  if (el4?.['querySelector']) return el4['querySelector']('.img-node-preview');
  const state = typeof handle?.['getElementById'] === 'function' ? handle['getElementById'](enabled5) : null;
  return state?.['querySelector']?.('.img-node-preview') || null;
}

function clearExistingOptimisticImagePreview(enabled6) {
  if (!enabled6) return;
  if (typeof enabled6['_previewUploadOptimisticCleanup'] === 'function') {
    enabled6['_previewUploadOptimisticCleanup']({ delayMs: 0, force: true });
    return;
  }
  enabled6['querySelectorAll']?.(OPTIMISTIC_IMAGE_PREVIEW_SELECTOR)?.['forEach']((config) =>
    config['remove']?.(),
  );
}

function hasClassName(el5, scope) {
  return (
    el5?.['classList']?.['contains']?.(scope) ||
    String(el5?.['className'] || '')
      ['split'](/\s+/)
      ['includes'](scope)
  );
}

function getPreviewImageElements(output) {
  const list2 = Array['from'](output?.['querySelectorAll']?.('img') || []);
  return list2['filter']((value2) => !hasClassName(value2, 'preview-upload-optimistic-media'));
}

function getImageElementSrc(value3) {
  return String(value3?.['currentSrc'] || value3?.['src'] || value3?.['getAttribute']?.('src') || '')[
    'trim'
  ]();
}

function getImageElementAttributeSrc(value4) {
  return String(value4?.['src'] || value4?.['getAttribute']?.('src') || '')['trim']();
}

function normalizeUrlPathForCompare(value5 = '') {
  const enabled7 = String(value5 || '')['trim']();
  if (!enabled7) return '';
  try {
    return new URL(enabled7, 'http://aic.local')['pathname']['replace'](/\/+/g, '/');
  } catch {
    return enabled7['split']('?')[0]['split']('#')[0]['replace'](/\\/g, '/');
  }
}

function imageSrcMatchesExpected(value6 = '', value7 = []) {
  const urlPathForCompare = normalizeUrlPathForCompare(value6);
  if (!urlPathForCompare) return false;
  const list3 = value7['map']((value8) => normalizeUrlPathForCompare(value8))['filter'](Boolean);
  if (list3['length'] === 0) return true;
  return list3['some']((value9) => urlPathForCompare === value9 || urlPathForCompare['endsWith'](value9));
}

function toUploadedPreviewLocalUrl(value10 = '') {
  const enabled8 = String(value10 || '')
    ['trim']()
    ['replace'](/\\/g, '/');
  if (!enabled8) return '';
  if (/^(?:https?:|blob:|data:|aic-local-preview:)/i['test'](enabled8)) return enabled8;
  return enabled8['startsWith']('/') ? enabled8 : '/' + enabled8;
}

function resolveUploadedPreviewImageExpectedUrls(options3 = {}) {
  return Array['from'](
    new Set(
      [
        options3?.['displayUrl'],
        options3?.['originalUrl'],
        options3?.['url'],
        toUploadedPreviewLocalUrl(options3?.['displayLocalPath']),
        toUploadedPreviewLocalUrl(options3?.['originalLocalPath']),
        toUploadedPreviewLocalUrl(options3?.['localPath']),
      ]
        ['map']((value11) => String(value11 || '')['trim']())
        ['filter'](Boolean),
    ),
  );
}

function getMountedPreviewImageSrc(value12) {
  const previewImageElements = getPreviewImageElements(value12);
  for (const value13 of previewImageElements) {
    const imageElementSrc = getImageElementSrc(value13);
    if (imageElementSrc) return imageElementSrc;
  }
  return '';
}

function waitForUploadedPreviewImageCommit({
  nodeId: nodeId2,
  previousSrc: previousSrc = '',
  expectedUrls: expectedUrls = [],
  timeoutMs: timeoutMs = DEFAULT_OPTIMISTIC_PREVIEW_COMMIT_TIMEOUT_MS,
  onPoll: onPoll = null,
} = {}) {
  const enabled9 = String(nodeId2 || '')['trim']();
  if (!enabled9) return Promise['resolve'](false);
  return new Promise((handler2) => {
    let value14 = false,
      setTimeout2 = null,
      setTimeout3 = null;
    const map = new Set(),
      list4 = [],
      handler3 = (value15) => {
        if (value14) return;
        value14 = true;
        if (setTimeout2 !== null) clearTimeout(setTimeout2);
        if (setTimeout3 !== null) clearTimeout(setTimeout3);
        for (const run of list4['splice'](0)) run();
        handler2(value15);
      },
      handler4 = (el6) => {
        if (!el6?.['addEventListener'] || map['has'](el6)) return;
        map['add'](el6);
        const value16 =
          String(el6['currentSrc'] || '')['trim']() ||
          getImageElementAttributeSrc(el6) ||
          getImageElementSrc(el6);
        if (el6['complete'] && value16 !== previousSrc && imageSrcMatchesExpected(value16, expectedUrls)) {
          handler3(true);
          return;
        }
        const value17 = () => {
            const value18 = String(el6['currentSrc'] || '')['trim']() || getImageElementSrc(el6);
            value18 !== previousSrc && imageSrcMatchesExpected(value18, expectedUrls) && handler3(true);
          },
          value19 = () => {
            const imageElementAttributeSrc = getImageElementAttributeSrc(el6) || getImageElementSrc(el6);
            imageElementAttributeSrc !== previousSrc &&
              imageSrcMatchesExpected(imageElementAttributeSrc, expectedUrls) &&
              handler3(true);
          };
        (el6['addEventListener']('load', value17, { once: true }),
          el6['addEventListener']('error', value19, { once: true }),
          list4['push'](() => {
            (el6['removeEventListener']?.('load', value17), el6['removeEventListener']?.('error', value19));
          }));
      },
      handler5 = () => {
        if (typeof onPoll === 'function') onPoll();
        const mountedPreviewElement = getMountedPreviewElement(enabled9),
          previewImageElements2 = getPreviewImageElements(mountedPreviewElement);
        for (const value20 of previewImageElements2) {
          const imageElementAttributeSrc2 =
            getImageElementAttributeSrc(value20) || getImageElementSrc(value20);
          if (!imageElementAttributeSrc2 || imageElementAttributeSrc2 === previousSrc) continue;
          if (!imageSrcMatchesExpected(imageElementAttributeSrc2, expectedUrls)) continue;
          return (handler4(value20), false);
        }
        return false;
      },
      handler6 = () => {
        if (value14 || handler5()) return;
        setTimeout2 = setTimeout(handler6, 80);
      };
    ((setTimeout3 = setTimeout(() => handler3(false), Math['max'](0, Number(timeoutMs) || 0))), handler6());
  });
}

function applyOptimisticImageUploadPreview({ nodeId: nodeId3, file: file3 } = {}) {
  if (!String(file3?.['type'] || '')['startsWith']('image/')) return null;
  const mountedPreviewElement2 = getMountedPreviewElement(nodeId3),
    el7 = mountedPreviewElement2?.['ownerDocument'] || globalThis['document'];
  if (!mountedPreviewElement2?.['appendChild'] || !el7?.['createElement']) return null;
  const safelyCreateObjectUrl2 = safelyCreateObjectUrl(file3);
  if (!safelyCreateObjectUrl2) return null;
  clearExistingOptimisticImagePreview(mountedPreviewElement2);
  const mountedPreviewImageSrc = getMountedPreviewImageSrc(mountedPreviewElement2),
    el8 = el7['createElement']('img');
  ((el8['className'] = 'preview-upload-optimistic-media'),
    (el8['draggable'] = false),
    (el8['alt'] = ''),
    (el8['dataset']['previewUploadOptimistic'] = 'true'),
    (el8['src'] = safelyCreateObjectUrl2));
  let value21 = false,
    setTimeout4 = null,
    value22 = null;
  const run2 = (el9 = getMountedPreviewElement(nodeId3)) => {
      if (value21 || !el9?.['appendChild']) return false;
      return (
        value22 &&
          value22 !== el9 &&
          value22['_previewUploadOptimisticCleanup'] === run3 &&
          delete value22['_previewUploadOptimisticCleanup'],
        el8['parentNode'] !== el9 && el9['appendChild'](el8),
        (el9['_previewUploadOptimisticCleanup'] = run3),
        (value22 = el9),
        true
      );
    },
    handler7 = () => {
      if (value21) return;
      ((value21 = true),
        (setTimeout4 = null),
        el8['remove']?.(),
        safelyRevokeObjectUrl(safelyCreateObjectUrl2),
        value22?.['_previewUploadOptimisticCleanup'] === run3 &&
          delete value22['_previewUploadOptimisticCleanup']);
    };
  function run3({ delayMs: delayMs = 0, force: force = false } = {}) {
    if (value21) return;
    setTimeout4 !== null && (clearTimeout(setTimeout4), (setTimeout4 = null));
    const run4 = () => {
        handler7();
      },
      count = Math['max'](0, Number(delayMs) || 0);
    !force && count > 0 && typeof setTimeout === 'function'
      ? (setTimeout4 = setTimeout(run4, count))
      : run4();
  }
  return (
    run2(mountedPreviewElement2),
    {
      cleanup: run3,
      ensureMounted: run2,
      objectUrl: safelyCreateObjectUrl2,
      previousMediaSrc: mountedPreviewImageSrc,
    }
  );
}

function flushUploadedPreviewNode(value23) {
  const enabled10 = String(value23 || '')['trim']();
  if (!enabled10) return false;
  try {
    return globalThis['window']?.['v2Renderer']?.['flushNode']?.(enabled10) === true;
  } catch {
    return false;
  }
}

export function bindPreviewUploadToolbarAction({
  button: button3,
  input: input = null,
  storeApi: storeApi = appStore,
  uploadFileImpl: uploadFileImpl = uploadFile,
  showToast: showToast = null,
  getProjectId: getProjectId3,
  applyResults: applyResults3,
} = {}) {
  if (!button3) return () => {};
  const el10 = input || createToolbarUploadInput(button3);
  if (!el10) return () => {};
  const toast3 = getToast(showToast),
    value24 = (value25) => {
      (value25?.['preventDefault']?.(), value25?.['stopPropagation']?.());
      const response = resolvePreviewUploadTarget(getState(storeApi));
      if (!response['ok']) {
        toast3?.(response['message'], 'warn');
        return;
      }
      ((el10['accept'] = response['accept']), (el10['value'] = ''), el10['click']?.());
    },
    async3 = async () => {
      const enabled11 = el10['files']?.[0];
      if (!enabled11) return;
      setToolbarUploadButtonBusy(button3, true);
      try {
        await handlePreviewUploadFile({
          file: enabled11,
          button: null,
          storeApi: storeApi,
          uploadFileImpl: uploadFileImpl,
          showToast: showToast,
          getProjectId: getProjectId3,
          applyResults: applyResults3,
        });
      } finally {
        (setToolbarUploadButtonBusy(button3, false), (el10['value'] = ''));
      }
    };
  return (
    button3['addEventListener']('click', value24),
    el10['addEventListener']('change', async3),
    () => {
      (button3['removeEventListener']?.('click', value24), el10['removeEventListener']?.('change', async3));
    }
  );
}
