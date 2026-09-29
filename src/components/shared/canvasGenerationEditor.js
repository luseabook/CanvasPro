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
  store: _0x1936c,
  sourceNodeId: _0x3133c8,
  modelId: _0x44a098,
  returnFocus: _0x52b961,
  settingsKey: _0x5961e5,
  overlayDataKey: _0x11f635,
  renderSelector: _0x234afd,
  bindSelector: _0x46edf2,
  selectorOptions: _0x19ce40 = {},
  acquireMedia: _0x51e24e,
  unavailableMessage: unavailableMessage = '',
  allowedModelIds: allowedModelIds = [_0x44a098],
}) {
  closeActiveEditor?.();
  const _0x42eca9 = () => _0x1936c['getStateRaw']?.() || _0x1936c['getState'](),
    _0x4d633e = _0x42eca9()['nodes']?.[_0x3133c8];
  if (!_0x4d633e) return Promise['resolve'](null);
  const _0x4c7893 = _0x4d633e[_0x5961e5] || {},
    _0x31c48d = allowedModelIds['includes'](_0x4c7893['modelId']) ? _0x4c7893['modelId'] : _0x44a098,
    _0x3fa0a8 = getModelManifest(_0x31c48d);
  let _0x3104c7 = {
    modelId: _0x31c48d,
    provider: _0x3fa0a8['provider'],
    generationParams: sanitizeModelUiSchemaParams(_0x31c48d, _0x4c7893['generationParams']),
    generationParamsByModel: _0x4c7893['generationParamsByModel'] || {},
    providerProfileId: _0x4c7893['providerProfileId'] || '',
    providerProfileIdByModel: _0x4c7893['providerProfileIdByModel'] || {},
  };
  const _0x1d3f07 = {
      ..._0x3104c7,
      ..._0x19ce40,
      className: 'canvas-function-controls ' + (_0x19ce40['className'] || ''),
    },
    _0x24db02 = document['getElementById'](_0x3133c8);
  if (!_0x24db02) return Promise['resolve'](null);
  const {
      overlay: _0x244ed9,
      release: _0x45e9ef,
      update: _0x8b0bb1,
    } = createCanvasMediaFocusSurface({ root: document['getElementById']('v2-wrap'), target: _0x24db02 }),
    _0x3d8630 = _0x51e24e?.({ target: _0x24db02, source: _0x4d633e, overlay: _0x244ed9 });
  _0x244ed9['dataset'][_0x11f635] = '';
  const _0x1c73c9 = document['createElement']('button');
  ((_0x1c73c9['type'] = 'button'),
    (_0x1c73c9['className'] = 'v2-annotate-btn\x20icon-only\x20act-cancel'),
    _0x1c73c9['setAttribute']('aria-label', t('imageAnnotate.toolbar.cancel')),
    (_0x1c73c9['dataset']['tooltip'] = t('imageAnnotate.toolbar.cancel')),
    (_0x1c73c9['innerHTML'] =
      '<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22\x20width=\x2218\x22\x20height=\x2218\x22><path\x20d=\x22M18\x206L6\x2018M6\x206l12\x2012\x22/></svg>'));
  const _0x3193ee = document['createElement']('div');
  ((_0x3193ee['className'] = 'v2-annotate-toolbar v2-annotate-generation-toolbar'),
    (_0x3193ee['innerHTML'] =
      _0x234afd(_0x1d3f07) + renderCanvasEditorSubmitButton(t('imageAnnotate.actions.generate'))));
  const _0x3f71a9 = _0x3193ee['querySelector']('.img-gen-btn');
  return (
    unavailableMessage &&
      ((_0x3f71a9['disabled'] = !![]),
      _0x3f71a9['setAttribute']('aria-label', unavailableMessage),
      (_0x3f71a9['dataset']['tooltip'] = unavailableMessage),
      (_0x3f71a9['title'] = unavailableMessage)),
    _0x3193ee['prepend'](_0x1c73c9),
    _0x244ed9['append'](_0x3193ee),
    document['body']['append'](_0x244ed9),
    new Promise((_0x5895c8) => {
      let _0x54e49e = ![],
        _0x107515,
        _0x471849,
        _0x1e3068,
        _0x447dc5,
        _0x1cd279,
        _0x32cb84,
        _0x3a8c56;
      const _0x4be009 = (_0x4cc596 = null) => {
          if (_0x54e49e) return;
          ((_0x54e49e = !![]),
            cancelAnimationFrame(_0x32cb84),
            _0x447dc5?.(),
            _0x1cd279?.(),
            window['removeEventListener']('resize', _0x43bdb9),
            window['removeEventListener']('aicanvas:active-canvas-changed', _0x180beb),
            _0x107515?.['destroy'](),
            _0x471849?.['remove'](),
            _0x1e3068?.(),
            _0x45e9ef(),
            _0x3d8630?.());
          if (closeActiveEditor === _0x4be009) closeActiveEditor = null;
          _0x5895c8(_0x4cc596);
        },
        _0x43bdb9 = (_0x1838aa) => {
          const _0x331913 = _0x42eca9(),
            _0x250994 = _0x331913['nodes']?.[_0x3133c8];
          if (!_0x250994 || !_0x24db02['isConnected']) return _0x4be009();
          _0x3a8c56 = { node: _0x250994, viewport: _0x1838aa?.['viewport'] || _0x331913['viewport'] };
          const _0x2a2d6f = {
              ...worldToScreen(_0x250994['x'], _0x250994['y'], _0x3a8c56['viewport']),
              width: _0x250994['width'] * _0x3a8c56['viewport']['zoom'],
              height: _0x250994['height'] * _0x3a8c56['viewport']['zoom'],
            },
            _0x592353 = _0x2a2d6f['x'] + _0x2a2d6f['width'] / 0x2;
          (_0x8b0bb1(_0x2a2d6f),
            positionCanvasEditorToolbar(_0x3193ee, {
              center: _0x592353,
              top: _0x2a2d6f['y'] + _0x2a2d6f['height'] + 0xe,
            }));
        },
        _0x180beb = () => _0x4be009();
      ((closeActiveEditor = _0x4be009),
        window['addEventListener']('aicanvas:active-canvas-changed', _0x180beb),
        window['addEventListener']('resize', _0x43bdb9),
        _0x1c73c9['addEventListener']('click', () => _0x4be009()),
        _0x3f71a9['addEventListener'](
          'click',
          () =>
            !unavailableMessage &&
            _0x4be009({
              ..._0x3104c7,
              generationParams: sanitizeModelUiSchemaParams(
                _0x3104c7['modelId'],
                _0x3104c7['generationParams'],
              ),
            }),
        ),
        (_0x107515 = _0x46edf2(_0x3193ee, {
          ..._0x1d3f07,
          floatingMenuHost: _0x244ed9,
          modelSubmenuPlacement: 'viewport-auto-up',
          schemaPopupPlacement: 'portal-auto-up',
          onChange(_0x30f72c) {
            if (!allowedModelIds['includes'](_0x30f72c['modelId'])) return;
            ((_0x3104c7 = _0x30f72c),
              _0x471849?.['sync'](),
              _0x42eca9()['nodes']?.[_0x3133c8] &&
                _0x1936c['updateNodeData'](_0x3133c8, {
                  [_0x5961e5]: {
                    modelId: _0x3104c7['modelId'],
                    generationParams: sanitizeModelUiSchemaParams(
                      _0x3104c7['modelId'],
                      _0x3104c7['generationParams'],
                    ),
                    generationParamsByModel: _0x3104c7['generationParamsByModel'] || {},
                    providerProfileId: _0x3104c7['providerProfileId'],
                    providerProfileIdByModel: _0x3104c7['providerProfileIdByModel'] || {},
                  },
                }));
          },
        })),
        (_0x471849 = createModelProviderProfileControl({
          panel: _0x3193ee['querySelector']('.img-model-wrap'),
          getNodeData: () => ({ ..._0x3104c7, model: _0x3104c7['modelId'] }),
          onChange: (_0x6d7642) => {
            if (_0x54e49e) return;
            (_0x107515['applyProviderProfilePatch'](_0x6d7642), _0x471849?.['sync'](), _0x43bdb9());
          },
        })),
        (_0x1e3068 = beginModalInteraction({ root: _0x244ed9, onClose: _0x4be009, returnFocus: _0x52b961 })),
        (_0x447dc5 = _0x1936c['subscribeSelector'](
          (_0x233b2e) => {
            const _0x4471fa = _0x233b2e['nodes']?.[_0x3133c8],
              _0x798e14 = _0x233b2e['viewport'];
            return [
              !!_0x4471fa,
              _0x4471fa?.['x'],
              _0x4471fa?.['y'],
              _0x4471fa?.['width'],
              _0x4471fa?.['height'],
              _0x798e14?.['x'],
              _0x798e14?.['y'],
              _0x798e14?.['zoom'],
            ];
          },
          () => _0x43bdb9(),
        )),
        (_0x1cd279 = bindImageOverlayViewportPreview({ getView: () => _0x3a8c56, updateView: _0x43bdb9 })),
        _0x43bdb9(),
        (_0x32cb84 = requestAnimationFrame(() => _0x244ed9['classList']['add']('visible'))));
    })
  );
}
