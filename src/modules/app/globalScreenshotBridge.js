import { REVERSE_IMAGE_PROMPT_PRESET_PROMPT } from '../promptPresets.js';
import { waitForGlobalCaptureNodeMounted } from './globalTextPresetBridge.js';
function createBlobFromBase64(value, type = 'image/png') {
  const list = atob(String(value || '')),
    list2 = [];
  for (let item = 0; item < list['length']; item += 8192) {
    const list3 = list['slice'](item, item + 8192),
      uint8Array = new Uint8Array(list3['length']);
    for (let key = 0; key < list3['length']; key += 1) {
      uint8Array[key] = list3['charCodeAt'](key);
    }
    list2['push'](uint8Array);
  }
  return new Blob(list2, { type: type });
}
export function installGlobalScreenshotBridge({
  screenshotApi: screenshotApi,
  createMediaNodeFromBlob: createMediaNodeFromBlob,
  showToast: showToast,
  translate: translate,
  executeCanvasCommand: executeCanvasCommand,
  isNodeMounted: isNodeMounted,
  scheduleFrame: scheduleFrame,
  getCanvasIdentity: getCanvasIdentity = () => '',
  consoleObject: consoleObject = console,
} = {}) {
  if (!screenshotApi) return;
  const name =
    typeof translate === 'function'
      ? translate
      : (index, result = {}) =>
          String(index || '')['replace'](/\{(\w+)\}/g, (data, options) => result[options] || '');
  (screenshotApi['onGlobalCapture']?.(async (options2 = {}) => {
    const canvasIdentity = getCanvasIdentity(),
      isImportCurrent = () => canvasIdentity === getCanvasIdentity(),
      target = options2?.['actionId'] === 'reverse-prompt';
    let nodeId = '';
    try {
      const enabled = String(options2?.['pngBase64'] || '')['trim']();
      if (!enabled) return;
      const source = String(options2?.['mimeType'] || 'image/png') || 'image/png',
        blobFromBase64 = createBlobFromBase64(enabled, source),
        sourceId = await createMediaNodeFromBlob?.(blobFromBase64, source, {
          name: name('globalScreenshot.nodeName'),
          placement: 'viewport-center-sequence',
          sequenceKey: 'global-screenshot',
          ...(target ? { returnNode: true, isImportCurrent: isImportCurrent } : {}),
        });
      if (!isImportCurrent()) return;
      if (target && sourceId?.['id']) {
        const run = async (next, current) => {
            if (!isImportCurrent()) throw new Error('canvas-changed');
            const error = await executeCanvasCommand?.(next, current);
            if (error?.['ok'] !== true)
              throw new Error(error?.['message'] || error?.['errorCode'] || 'canvas-command-failed');
            return error['result'];
          },
          entry = await run('node.createConnected', {
            sourceId: sourceId['id'],
            type: 'ai-text',
            inheritSource: false,
            name: name('globalScreenshot.reverseNodeName'),
          });
        nodeId = entry?.['nodeId'];
        if (!nodeId) throw new Error('node-id-missing');
        await run('node.setPrompt', { nodeId: nodeId, text: REVERSE_IMAGE_PROMPT_PRESET_PROMPT });
        if (options2['runImmediately'] === true) {
          const waitForGlobalCaptureNodeMounted2 = await waitForGlobalCaptureNodeMounted({
            nodeId: nodeId,
            isNodeMounted: isNodeMounted,
            scheduleFrame: scheduleFrame,
          });
          if (!isImportCurrent()) return;
          if (!waitForGlobalCaptureNodeMounted2) throw new Error('node-not-ready');
          await run('generation.run', { nodeId: nodeId });
        }
        if (isImportCurrent())
          showToast?.(
            name(
              options2['runImmediately'] === true
                ? 'globalScreenshot.reverseStarted'
                : 'globalScreenshot.reverseCreated',
            ),
            'success',
          );
        return;
      }
      sourceId
        ? showToast?.(name('globalScreenshot.added'), 'success')
        : showToast?.(name('globalScreenshot.importFailed'), 'error');
    } catch (record) {
      consoleObject['error']?.('[screenshot] failed to import global capture', record);
      if (isImportCurrent())
        showToast?.(
          name(nodeId ? 'globalScreenshot.reverseFailed' : 'globalScreenshot.importFailed'),
          'error',
        );
    }
  }),
    screenshotApi['onGlobalShortcutStatus']?.((accelerator = {}) => {
      if (accelerator?.['registered'] === false && accelerator?.['reason'] === 'registration-failed') {
        showToast?.(
          name('globalScreenshot.shortcutRegistrationFailed', {
            accelerator: accelerator?.['accelerator'] || 'Alt+Q',
          }),
          'warn',
        );
        return;
      }
      accelerator?.['registered'] === true &&
        accelerator?.['ok'] === false &&
        showToast?.(name('globalScreenshot.captureFailed'), 'error');
    }));
}
