import { getModelManifest, sanitizeModelUiSchemaParams } from '../../manifests/index.js';
import { beginModalInteraction } from '../../services/modalInteractionScope.js';
import { worldToScreen } from '../../core/math.js';
import { bindImageOverlayViewportPreview } from '../../modules/imageOverlayViewportPreview.js';
import {
  createCanvasMediaFocusSurface,
  positionCanvasEditorToolbar,
  renderCanvasEditorSubmitButton,
} from './canvasEditorSurface.js';
import { t } from '../../i18n/index.js';
import { createModelProviderProfileControl } from './modelProviderProfileControl.js';
let closeActiveEditor = null;
export function openCanvasGenerationEditor({
  store: store,
  sourceNodeId: sourceNodeId,
  modelId: modelId,
  returnFocus: returnFocus,
  settingsKey: settingsKey,
  overlayDataKey: overlayDataKey,
  renderSelector: renderSelector,
  bindSelector: bindSelector,
  selectorOptions: selectorOptions = {},
  acquireMedia: acquireMedia,
  unavailableMessage: unavailableMessage = '',
  allowedModelIds: allowedModelIds = [modelId],
}) {
  closeActiveEditor?.();
  const run = () => store['getStateRaw']?.() || store['getState'](),
    source = run()['nodes']?.[sourceNodeId];
  if (!source) return Promise['resolve'](null);
  const generationParamsByModel = source[settingsKey] || {},
    modelId2 = allowedModelIds['includes'](generationParamsByModel['modelId'])
      ? generationParamsByModel['modelId']
      : modelId,
    provider = getModelManifest(modelId2);
  let modelId3 = {
    modelId: modelId2,
    provider: provider['provider'],
    generationParams: sanitizeModelUiSchemaParams(modelId2, generationParamsByModel['generationParams']),
    generationParamsByModel: generationParamsByModel['generationParamsByModel'] || {},
    providerProfileId: generationParamsByModel['providerProfileId'] || '',
    providerProfileIdByModel: generationParamsByModel['providerProfileIdByModel'] || {},
  };
  const args = {
      ...modelId3,
      ...selectorOptions,
      className: 'canvas-function-controls ' + (selectorOptions['className'] || ''),
    },
    target = document['getElementById'](sourceNodeId);
  if (!target) return Promise['resolve'](null);
  const {
      overlay: overlay,
      release: release,
      update: update,
    } = createCanvasMediaFocusSurface({ root: document['getElementById']('v2-wrap'), target: target }),
    value = acquireMedia?.({ target: target, source: source, overlay: overlay });
  overlay['dataset'][overlayDataKey] = '';
  const el = document['createElement']('button');
  ((el['type'] = 'button'),
    (el['className'] = 'v2-annotate-btn icon-only act-cancel'),
    el['setAttribute']('aria-label', t('imageAnnotate.toolbar.cancel')),
    (el['dataset']['tooltip'] = t('imageAnnotate.toolbar.cancel')),
    (el['innerHTML'] =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M18 6L6 18M6 6l12 12"/></svg>'));
  const panel = document['createElement']('div');
  ((panel['className'] = 'v2-annotate-toolbar v2-annotate-generation-toolbar'),
    (panel['innerHTML'] =
      renderSelector(args) + renderCanvasEditorSubmitButton(t('imageAnnotate.actions.generate'))));
  const el2 = panel['querySelector']('.img-gen-btn');
  return (
    unavailableMessage &&
      ((el2['disabled'] = !![]),
      el2['setAttribute']('aria-label', unavailableMessage),
      (el2['dataset']['tooltip'] = unavailableMessage),
      (el2['title'] = unavailableMessage)),
    panel['prepend'](el),
    overlay['append'](panel),
    document['body']['append'](overlay),
    new Promise((handler) => {
      let item = ![],
        key,
        el3,
        beginModalInteraction2,
        index,
        bindImageOverlayViewportPreview2,
        requestAnimationFrame2,
        result;
      const onClose = (value2 = null) => {
          if (item) return;
          ((item = !![]),
            cancelAnimationFrame(requestAnimationFrame2),
            index?.(),
            bindImageOverlayViewportPreview2?.(),
            window['removeEventListener']('resize', updateView),
            window['removeEventListener']('aicanvas:active-canvas-changed', data),
            key?.['destroy'](),
            el3?.['remove'](),
            beginModalInteraction2?.(),
            release(),
            value?.());
          if (closeActiveEditor === onClose) closeActiveEditor = null;
          handler(value2);
        },
        updateView = (viewport) => {
          const state = run(),
            node = state['nodes']?.[sourceNodeId];
          if (!node || !target['isConnected']) return onClose();
          result = { node: node, viewport: viewport?.['viewport'] || state['viewport'] };
          const top = {
              ...worldToScreen(node['x'], node['y'], result['viewport']),
              width: node['width'] * result['viewport']['zoom'],
              height: node['height'] * result['viewport']['zoom'],
            },
            center = top['x'] + top['width'] / 2;
          (update(top),
            positionCanvasEditorToolbar(panel, {
              center: center,
              top: top['y'] + top['height'] + 14,
            }));
        },
        data = () => onClose();
      ((closeActiveEditor = onClose),
        window['addEventListener']('aicanvas:active-canvas-changed', data),
        window['addEventListener']('resize', updateView),
        el['addEventListener']('click', () => onClose()),
        el2['addEventListener'](
          'click',
          () =>
            !unavailableMessage &&
            onClose({
              ...modelId3,
              generationParams: sanitizeModelUiSchemaParams(
                modelId3['modelId'],
                modelId3['generationParams'],
              ),
            }),
        ),
        (key = bindSelector(panel, {
          ...args,
          floatingMenuHost: overlay,
          modelSubmenuPlacement: 'viewport-auto-up',
          schemaPopupPlacement: 'portal-auto-up',
          onChange(options) {
            if (!allowedModelIds['includes'](options['modelId'])) return;
            ((modelId3 = options),
              el3?.['sync'](),
              run()['nodes']?.[sourceNodeId] &&
                store['updateNodeData'](sourceNodeId, {
                  [settingsKey]: {
                    modelId: modelId3['modelId'],
                    generationParams: sanitizeModelUiSchemaParams(
                      modelId3['modelId'],
                      modelId3['generationParams'],
                    ),
                    generationParamsByModel: modelId3['generationParamsByModel'] || {},
                    providerProfileId: modelId3['providerProfileId'],
                    providerProfileIdByModel: modelId3['providerProfileIdByModel'] || {},
                  },
                }));
          },
        })),
        (el3 = createModelProviderProfileControl({
          panel: panel['querySelector']('.img-model-wrap'),
          getNodeData: () => ({ ...modelId3, model: modelId3['modelId'] }),
          onChange: (next) => {
            if (item) return;
            (key['applyProviderProfilePatch'](next), el3?.['sync'](), updateView());
          },
        })),
        (beginModalInteraction2 = beginModalInteraction({
          root: overlay,
          onClose: onClose,
          returnFocus: returnFocus,
        })),
        (index = store['subscribeSelector'](
          (state2) => {
            const box = state2['nodes']?.[sourceNodeId],
              box2 = state2['viewport'];
            return [
              !!box,
              box?.['x'],
              box?.['y'],
              box?.['width'],
              box?.['height'],
              box2?.['x'],
              box2?.['y'],
              box2?.['zoom'],
            ];
          },
          () => updateView(),
        )),
        (bindImageOverlayViewportPreview2 = bindImageOverlayViewportPreview({
          getView: () => result,
          updateView: updateView,
        })),
        updateView(),
        (requestAnimationFrame2 = requestAnimationFrame(() => overlay['classList']['add']('visible'))));
    })
  );
}
