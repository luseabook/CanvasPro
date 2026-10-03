import { createGlobalCaptureWindowController } from './globalCaptureWindowController.js';
import { runCleanupSteps } from '../src/utils/cleanupSteps.js';
import { createGlobalTextPresetShortcutController } from './globalTextPresetShortcutController.js';
import { createSelectedTextCaptureController } from './selectedTextCapture.js';
export function createGlobalCaptureControllers({
  dirname: dirname,
  accelerator: accelerator = 'Control+Alt+Shift+C',
  focusCanvas: focusCanvas,
  getMainWindow: getMainWindow,
  logDiagnosticEvent: logDiagnosticEvent,
  selectedTextCaptureController: selectedTextCaptureController = null,
  globalShortcutApi: globalShortcutApi = null,
} = {}) {
  let shortcutController = null;
  const selectedTextCapture =
      selectedTextCaptureController ||
      createSelectedTextCaptureController({
        onKeyReleased: (releasePayload) => shortcutController?.['releaseShortcutKey'](releasePayload),
      }),
    captureWindowController = createGlobalCaptureWindowController({
      dirname: dirname,
      onAction: (capturePayload, dispatchOptions) =>
        shortcutController?.['dispatchCaptureAction']?.(capturePayload, dispatchOptions) || {
          ok: ![],
          reason: 'controller-unavailable',
        },
      logDiagnosticEvent: logDiagnosticEvent,
    });
  shortcutController = createGlobalTextPresetShortcutController({
    accelerator: accelerator,
    ...(globalShortcutApi ? { globalShortcutApi: globalShortcutApi } : {}),
    copySelectedText: selectedTextCapture['capture'],
    hasKeyReleaseTracking: () => selectedTextCapture['isKeyReleaseTrackingAvailable']?.() === !![],
    focusCanvas: focusCanvas,
    getMainWindow: getMainWindow,
    showCapturePanel: captureWindowController['show'],
    hideCapturePanel: captureWindowController['hide'],
    isCapturePanelVisible: captureWindowController['isVisible'],
    logDiagnosticEvent: logDiagnosticEvent,
  });
  const managedCaptureWindowController = {
    ...captureWindowController,
    prewarm: () => Promise['all']([captureWindowController['prewarm'](), selectedTextCapture['prewarm']()]),
    destroy: () => runCleanupSteps([
      () => shortcutController.destroy(),
      () => selectedTextCapture.destroy(),
      () => captureWindowController.destroy(),
    ], { onError: error => logDiagnosticEvent?.({ type: 'global_capture.cleanup_failed', level: 'warn', source: 'main', error }) }),
  };
  return {
    globalCaptureWindowController: managedCaptureWindowController,
    globalTextPresetShortcutController: shortcutController,
  };
}
