import appStore from '../../core/stores/appStore.js';
import { t } from '../../i18n/index.js';
import { bindImageFunctionControls } from '../imageFunctionControls.js';
import { resetGenerateButtonIdleUi, setGenerateButtonLoadingUi } from '../previewGenerateButtonUi.js';
import { buildLocalEditState, LOCAL_EDIT_STATE_KEY } from './stateAdapters.js';
import { runGenerationResultFlow } from './generationResultFlow.js';
const text = (value) => t('imageAnnotate.localEdit.' + value),
  getSubmitLabel = (item) => text(item === 'erase' ? 'generateErase' : 'generateRepaint');
export function persistLocalEditState(scene) {
  if (!scene._isGenerationScene() || !scene.nodeId) return;
  const tool = appStore.getStateRaw();
  if (!tool.nodes?.[scene.nodeId]) return;
  appStore.updateNodeData(scene.nodeId, {
    [LOCAL_EDIT_STATE_KEY]: buildLocalEditState({
      scene: scene._mode.scene,
      promptText: scene.promptText,
      commands: scene._commands,
      tool: tool.annotate?.tool,
      brushSizePx: tool.annotate?.brushSizePx,
    }),
  });
}
export function syncLocalEditMode(key) {
  const el = key.generationToolbarEl;
  if (!el) return;
  const index = key._mode.scene;
  for (const el2 of el.querySelectorAll('[data-local-edit-scene]')) {
    const result = el2.dataset.localEditScene === index;
    (el2.classList.toggle('active', result), el2.setAttribute('aria-pressed', String(result)));
  }
  el.querySelector('.v2-annotate-gen-prompt-wrap').hidden = index === 'erase';
  const el3 = el.querySelector('.go');
  ((el3.title = getSubmitLabel(index)), el3.setAttribute('aria-label', el3.title));
}
export function switchLocalEditMode(enabled, data) {
  if (
    !enabled.active ||
    !enabled._isGenerationScene() ||
    enabled._localEditSubmission ||
    enabled._draft
  )
    return false;
  if (data !== 'repaint' && data !== 'erase') return false;
  if (data === enabled._mode.scene) return false;
  return (
    enabled._closeGenerationMenus(),
    (enabled._mode.scene = data),
    syncLocalEditMode(enabled),
    persistLocalEditState(enabled),
    enabled._updateView(enabled._view),
    true
  );
}
export function bindLocalEditControls(selection) {
  const el4 = selection.generationToolbarEl;
  if (!el4) return;
  (el4.addEventListener('pointerdown', (event) => event.stopPropagation()),
    el4.querySelector('.v2-annotate-gen-prompt-input').addEventListener('input', (event2) => {
      ((selection.promptText = event2.target.value), persistLocalEditState(selection));
    }));
  for (const el5 of el4.querySelectorAll('[data-local-edit-scene]')) {
    el5.addEventListener('click', (event3) => {
      (event3.stopPropagation(), switchLocalEditMode(selection, el5.dataset.localEditScene));
    });
  }
  ((selection._functionControls = bindImageFunctionControls(el4, {
    selection: selection._functionSelection,
    onChange: (model) => {
      ((selection._functionSelection = model),
        (selection.model = model.modelId),
        (selection.provider = model.provider),
        (selection.imageSize = model.generationParams.imageSize || selection.imageSize),
        appStore.updateNodeData(selection.nodeId, {
          model: model.modelId,
          provider: model.provider,
          generationParams: model.generationParams,
          generationParamsByModel: model.generationParamsByModel,
          providerProfileId: model.providerProfileId,
          providerProfileIdByModel: model.providerProfileIdByModel,
        }));
    },
    onResize: () => selection.active && selection._updateView(selection._view),
  })),
    el4.querySelector('.go').addEventListener('click', (event4) => {
      (event4.stopPropagation(), void selection._save());
    }),
    el4.querySelector('.debug-wrench-btn').addEventListener('click', (event5) => {
      (event5.stopPropagation(), void selection._handleDebugRequest());
    }),
    syncLocalEditMode(selection));
}
export async function submitLocalEdit(enabled2, args, options, handler = runGenerationResultFlow) {
  if (enabled2._localEditSubmission || !enabled2.active) return;
  const target = enabled2._localEditSession,
    source = globalThis.window?.CanvasTabManager?.getActiveCanvasId?.(),
    next = globalThis.window?.currentProjectId,
    scene2 = enabled2._mode.scene,
    sourceNode = { ...args },
    el6 = enabled2.generationToolbarEl,
    el7 = el6.querySelector('.go'),
    current = {};
  ((enabled2._localEditSubmission = current), enabled2._closeGenerationMenus());
  const list = [...el6.querySelectorAll('button, input')],
    entry = list.map((el8) => el8.disabled);
  (list.forEach((el9) => {
    el9.disabled = true;
  }),
    el6.setAttribute('aria-busy', 'true'),
    setGenerateButtonLoadingUi(el7, { title: t('imageAnnotate.actions.generating') }));
  globalThis.window?.matchMedia?.('(prefers-reduced-motion: reduce)').matches &&
    (el7.querySelector('svg').style.animation = 'none');
  const run = () =>
    enabled2.active &&
    enabled2._localEditSession === target &&
    enabled2.nodeId === sourceNode.id &&
    !!appStore.getStateRaw().nodes?.[sourceNode.id] &&
    globalThis.window?.CanvasTabManager?.getActiveCanvasId?.() === source &&
    globalThis.window?.currentProjectId === next;
  let enabled3 = null;
  try {
    enabled3 = await enabled2._buildGenerationPayload(sourceNode, options);
    if (!enabled3?.payload || !run()) return;
    const built = enabled3;
    ((enabled3 = null),
      await handler({
        scene: scene2,
        built: built,
        sourceNode: sourceNode,
        fallbackModel: built.payload.model,
        fallbackProvider: built.payload.provider,
        exitController: (record) => {
          if (run()) enabled2.exit(record);
        },
        notify: (payload, handle) => window.showToast?.(payload, handle),
      }));
  } catch (error) {
    if (run()) window.showToast?.(error?.message || t('imageAnnotate.toasts.saveFailed'), 'error');
  } finally {
    if (enabled3?.inputUrl) URL.revokeObjectURL(enabled3.inputUrl);
    if (enabled2._localEditSubmission === current) enabled2._localEditSubmission = null;
    enabled2.generationToolbarEl === el6 &&
      (list.forEach((el10, state) => {
        el10.disabled = entry[state];
      }),
      el6.removeAttribute('aria-busy'),
      resetGenerateButtonIdleUi(el7, getSubmitLabel(scene2)));
  }
}
