import { openQuickCapturePromptPresetDraft } from '../promptPresets.js';
import nodeRuntimeRegistry from '../../core/nodeRuntimeRegistry.js';
import appStore from '../../core/stores/appStore.js';
import { createGlobalCaptureReceiver } from './globalCaptureReceiver.js';

const COPY_FAILURE_REASONS = new Set([
    'no-selection',
    'no-selected-text',
    'copy-command-failed',
    'copy-command-timeout',
    'unsupported-platform',
    'capture-failed',
  ]),
  NODE_ACTION_CONFIGS = Object['freeze']({
    'source-text': {
      type: 'source-text',
      textField: 'content',
      nameKey: 'globalCapture.nodeNames.sourceText',
    },
    'ai-text': { type: 'ai-text', textField: 'prompt', nameKey: 'globalCapture.nodeNames.aiText' },
    'ai-image': { type: 'ai-image', textField: 'prompt', nameKey: 'globalCapture.nodeNames.aiImage' },
    'ai-video': { type: 'ai-video', textField: 'prompt', nameKey: 'globalCapture.nodeNames.aiVideo' },
  }),
  DEFAULT_MOUNT_ATTEMPTS = 30,
  DEFAULT_MOUNT_DELAY_MS = 16;

function getCommandFailureMessage(commandResult) {
  return String(commandResult?.['message'] || commandResult?.['errorCode'] || commandResult?.['error'] || '')[
    'trim'
  ]();
}

function waitForNextFrame(scheduleFrame) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
        if (settled) return;
        ((settled = true), clearTimeout(timeoutId), resolve());
      },
      timeoutId = setTimeout(finish, DEFAULT_MOUNT_DELAY_MS);
    if (typeof scheduleFrame === 'function') {
      scheduleFrame(finish);
      return;
    }
    if (typeof globalThis['requestAnimationFrame'] === 'function') {
      globalThis['requestAnimationFrame'](finish);
      return;
    }
  });
}

export async function waitForGlobalCaptureNodeMounted({
  nodeId: nodeId,
  isNodeMounted: isNodeMounted,
  scheduleFrame: scheduleFrame,
  attempts: attempts = DEFAULT_MOUNT_ATTEMPTS,
} = {}) {
  const normalizedNodeId = String(nodeId || '')['trim']();
  if (!normalizedNodeId || typeof isNodeMounted !== 'function') return false;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (isNodeMounted(normalizedNodeId) === true) return true;
    await waitForNextFrame(scheduleFrame);
  }
  return false;
}

export function installGlobalTextPresetBridge({
  textPresetApi: textPresetApi,
  showToast: showToast,
  translate: translate,
  openDraft: openDraft = openQuickCapturePromptPresetDraft,
  executeCanvasCommand: executeCanvasCommand,
  isNodeMounted: isNodeMounted = (candidateNodeId) =>
    globalThis['window']?.['v2Renderer']?.['isNodeMounted']?.(candidateNodeId) === true,
  isNodeGenerationReady: isNodeGenerationReady = (candidateNodeId) =>
    typeof nodeRuntimeRegistry['resolve'](candidateNodeId, { store: appStore })?.['runGeneration'] ===
    'function',
  scheduleFrame: scheduleFrame = (callback) => {
    if (typeof globalThis['window']?.['requestAnimationFrame'] === 'function') {
      globalThis['window']['requestAnimationFrame'](callback);
      return;
    }
    globalThis['setTimeout']?.(callback, DEFAULT_MOUNT_DELAY_MS);
  },
  consoleObject: consoleObject = console,
  getCanvasIdentity: getCanvasIdentity = () => '',
} = {}) {
  if (!textPresetApi) return () => {};
  let disposed = false;
  const resolveText =
    typeof translate === 'function'
      ? translate
      : (key, params = {}) => String(key || '')['replace'](/\{(\w+)\}/g, (match, name) => params[name] || '');

  async function handlePresetDraft(text) {
    const draftResult = await openDraft(text);
    return (
      !draftResult?.['hasConfiguredDefault'] &&
        showToast?.(resolveText('globalTextPreset.defaultMissing'), 'warn'),
      { ok: true }
    );
  }

  async function createCaptureNode(actionId, text) {
    const actionConfig = NODE_ACTION_CONFIGS[actionId];
    if (!actionConfig || typeof executeCanvasCommand !== 'function')
      return { ok: false, reason: 'canvas-command-unavailable' };
    const createResult = await executeCanvasCommand('node.create', {
      type: actionConfig['type'],
      name: resolveText(actionConfig['nameKey']),
      [actionConfig['textField']]: text,
      placement: 'viewport-center-sequence',
      sequenceKey: 'global-capture',
    });
    if (createResult?.['ok'] === false)
      return {
        ok: false,
        reason: getCommandFailureMessage(createResult) || 'node-create-failed',
        retryable: Boolean(
          createResult['errorCode'] && createResult['errorCode'] !== 'COMMAND_EXECUTION_FAILED',
        ),
      };
    const createdNodeId = String(
      createResult?.['result']?.['nodeId'] || createResult?.['result']?.['node']?.['id'] || '',
    )['trim']();
    return createdNodeId
      ? { ok: true, nodeId: createdNodeId, result: createResult }
      : { ok: false, reason: 'node-id-missing' };
  }

  async function runCaptureGeneration(nodeId, isCanvasCurrent) {
    const mounted = await waitForGlobalCaptureNodeMounted({
      nodeId: nodeId,
      isNodeMounted: (candidateNodeId) =>
        !isCanvasCurrent() || isNodeGenerationReady(candidateNodeId) || isNodeMounted(candidateNodeId),
      scheduleFrame: scheduleFrame,
    });
    if (!isCanvasCurrent()) return { ok: false, reason: 'canvas-changed' };
    if (!mounted) return { ok: false, reason: 'node-not-ready' };
    const generationResult = await executeCanvasCommand('generation.run', { nodeId: nodeId });
    return generationResult?.['ok'] === false
      ? { ok: false, reason: getCommandFailureMessage(generationResult) || 'generation-failed' }
      : { ok: true, result: generationResult };
  }

  async function handleSelectedText(payload = {}) {
    const canvasIdentity = getCanvasIdentity(),
      isCanvasCurrent = () => !disposed && canvasIdentity === getCanvasIdentity(),
      text = String(payload?.['text'] || '')['trim']();
    if (!text)
      return (
        showToast?.(resolveText('globalTextPreset.noSelectedText'), 'warn'),
        { ok: false, reason: 'no-selected-text', retryable: true }
      );
    const actionId = String(payload?.['actionId'] || '')['trim']();
    try {
      if (actionId === 'preset-draft') return await handlePresetDraft(text);
      if (!NODE_ACTION_CONFIGS[actionId])
        return (
          showToast?.(resolveText('globalCapture.unsupportedAction'), 'error'),
          { ok: false, reason: 'unsupported-action', retryable: false }
        );
      const shouldRunImmediately = payload?.['runImmediately'] === true && actionId !== 'source-text';
      shouldRunImmediately && showToast?.(resolveText('globalCapture.preparingGeneration'), 'info');
      const createOutcome = await createCaptureNode(actionId, text);
      if (!isCanvasCurrent())
        return { ok: createOutcome['ok'], reason: createOutcome['reason'], retryable: false };
      if (!createOutcome['ok'])
        return (
          showToast?.(
            resolveText('globalCapture.actionFailed', { reason: createOutcome['reason'] }),
            'error',
          ),
          createOutcome
        );
      if (!shouldRunImmediately)
        return (showToast?.(resolveText('globalCapture.nodeAdded'), 'success'), { ok: true });
      return (
        void runCaptureGeneration(createOutcome['nodeId'], isCanvasCurrent)
          ['then']((generationOutcome) => {
            if (!isCanvasCurrent()) return;
            showToast?.(
              generationOutcome['ok']
                ? resolveText('globalCapture.generationStarted')
                : resolveText('globalCapture.generationFailed', { reason: generationOutcome['reason'] }),
              generationOutcome['ok'] ? 'success' : 'error',
            );
          })
          ['catch']((error) => {
            if (isCanvasCurrent())
              showToast?.(
                resolveText('globalCapture.generationFailed', {
                  reason: String(error?.['message'] || error),
                }),
                'error',
              );
          }),
        { ok: true }
      );
    } catch (error) {
      return (
        consoleObject['error']?.('[globalCapture] failed to handle selected text', error),
        showToast?.(
          resolveText('globalCapture.actionFailed', { reason: String(error?.['message'] || error || '') }),
          'error',
        ),
        { ok: false, reason: String(error?.['message'] || error || ''), retryable: false }
      );
    }
  }

  const disposers = [],
    receiver = createGlobalCaptureReceiver({ api: textPresetApi, handle: handleSelectedText }),
    selectedTextUnsubscribe = textPresetApi['onSelectedText']?.((payload = {}) =>
      receiver['receive'](payload),
    );
  typeof selectedTextUnsubscribe === 'function' && disposers['push'](selectedTextUnsubscribe);
  const shortcutStatusUnsubscribe = textPresetApi['onGlobalShortcutStatus']?.((status = {}) => {
    if (status?.['registered'] === false && status?.['reason'] === 'registration-failed') {
      showToast?.(
        resolveText('globalTextPreset.shortcutRegistrationFailed', {
          accelerator: status?.['accelerator'] || 'Alt+C',
        }),
        'warn',
      );
      return;
    }
    status?.['registered'] === true &&
      COPY_FAILURE_REASONS['has'](status?.['reason']) &&
      showToast?.(resolveText('globalTextPreset.noSelectedText'), 'warn');
  });
  return (
    typeof shortcutStatusUnsubscribe === 'function' && disposers['push'](shortcutStatusUnsubscribe),
    () => {
      ((disposed = true), receiver['dispose'](), disposers['forEach']((dispose) => dispose()));
    }
  );
}
