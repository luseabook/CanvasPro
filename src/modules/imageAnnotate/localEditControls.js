import appStore from '../../core/stores/appStore.js';
import { t } from '../../i18n/index.js';
import { bindImageFunctionControls } from '../imageFunctionControls.js';
import { resetGenerateButtonIdleUi, setGenerateButtonLoadingUi } from '../previewGenerateButtonUi.js';
import { buildLocalEditState, LOCAL_EDIT_STATE_KEY } from './stateAdapters.js';
import { runGenerationResultFlow } from './generationResultFlow.js';
const text = (_0x4a4c97) => t('imageAnnotate.localEdit.' + _0x4a4c97),
  getSubmitLabel = (_0xef14a3) => text(_0xef14a3 === 'erase' ? 'generateErase' : 'generateRepaint');
export function persistLocalEditState(_0x3e9622) {
  if (!_0x3e9622['_isGenerationScene']() || !_0x3e9622['nodeId']) return;
  const _0x1be6c3 = appStore['getStateRaw']();
  if (!_0x1be6c3['nodes']?.[_0x3e9622['nodeId']]) return;
  appStore['updateNodeData'](_0x3e9622['nodeId'], {
    [LOCAL_EDIT_STATE_KEY]: buildLocalEditState({
      scene: _0x3e9622['_mode']['scene'],
      promptText: _0x3e9622['promptText'],
      commands: _0x3e9622['_commands'],
      tool: _0x1be6c3['annotate']?.['tool'],
      brushSizePx: _0x1be6c3['annotate']?.['brushSizePx'],
    }),
  });
}
export function syncLocalEditMode(_0x572fed) {
  const _0x311097 = _0x572fed['generationToolbarEl'];
  if (!_0x311097) return;
  const _0x4ba26d = _0x572fed['_mode']['scene'];
  for (const _0x56ef11 of _0x311097['querySelectorAll']('[data-local-edit-scene]')) {
    const _0x2f6aef = _0x56ef11['dataset']['localEditScene'] === _0x4ba26d;
    (_0x56ef11['classList']['toggle']('active', _0x2f6aef),
      _0x56ef11['setAttribute']('aria-pressed', String(_0x2f6aef)));
  }
  _0x311097['querySelector']('.v2-annotate-gen-prompt-wrap')['hidden'] = _0x4ba26d === 'erase';
  const _0x5a3ea4 = _0x311097['querySelector']('.go');
  ((_0x5a3ea4['title'] = getSubmitLabel(_0x4ba26d)),
    _0x5a3ea4['setAttribute']('aria-label', _0x5a3ea4['title']));
}
export function switchLocalEditMode(_0x2f6ba8, _0x2ac357) {
  if (
    !_0x2f6ba8['active'] ||
    !_0x2f6ba8['_isGenerationScene']() ||
    _0x2f6ba8['_localEditSubmission'] ||
    _0x2f6ba8['_draft']
  )
    return ![];
  if (_0x2ac357 !== 'repaint' && _0x2ac357 !== 'erase') return ![];
  if (_0x2ac357 === _0x2f6ba8['_mode']['scene']) return ![];
  return (
    _0x2f6ba8['_closeGenerationMenus'](),
    (_0x2f6ba8['_mode']['scene'] = _0x2ac357),
    syncLocalEditMode(_0x2f6ba8),
    persistLocalEditState(_0x2f6ba8),
    _0x2f6ba8['_updateView'](_0x2f6ba8['_view']),
    !![]
  );
}
export function bindLocalEditControls(_0x39eec3) {
  const _0x7b2b8d = _0x39eec3['generationToolbarEl'];
  if (!_0x7b2b8d) return;
  (_0x7b2b8d['addEventListener']('pointerdown', (_0x2bd763) => _0x2bd763['stopPropagation']()),
    _0x7b2b8d['querySelector']('.v2-annotate-gen-prompt-input')['addEventListener']('input', (_0x5bf5d2) => {
      ((_0x39eec3['promptText'] = _0x5bf5d2['target']['value']), persistLocalEditState(_0x39eec3));
    }));
  for (const _0x83349e of _0x7b2b8d['querySelectorAll']('[data-local-edit-scene]')) {
    _0x83349e['addEventListener']('click', (_0x24c029) => {
      (_0x24c029['stopPropagation'](),
        switchLocalEditMode(_0x39eec3, _0x83349e['dataset']['localEditScene']));
    });
  }
  ((_0x39eec3['_functionControls'] = bindImageFunctionControls(_0x7b2b8d, {
    selection: _0x39eec3['_functionSelection'],
    onChange: (_0x246fa0) => {
      ((_0x39eec3['_functionSelection'] = _0x246fa0),
        (_0x39eec3['model'] = _0x246fa0['modelId']),
        (_0x39eec3['provider'] = _0x246fa0['provider']),
        (_0x39eec3['imageSize'] = _0x246fa0['generationParams']['imageSize'] || _0x39eec3['imageSize']),
        appStore['updateNodeData'](_0x39eec3['nodeId'], {
          model: _0x246fa0['modelId'],
          provider: _0x246fa0['provider'],
          generationParams: _0x246fa0['generationParams'],
          generationParamsByModel: _0x246fa0['generationParamsByModel'],
          providerProfileId: _0x246fa0['providerProfileId'],
          providerProfileIdByModel: _0x246fa0['providerProfileIdByModel'],
        }));
    },
    onResize: () => _0x39eec3['active'] && _0x39eec3['_updateView'](_0x39eec3['_view']),
  })),
    _0x7b2b8d['querySelector']('.go')['addEventListener']('click', (_0x106be5) => {
      (_0x106be5['stopPropagation'](), void _0x39eec3['_save']());
    }),
    _0x7b2b8d['querySelector']('.debug-wrench-btn')['addEventListener']('click', (_0x249d51) => {
      (_0x249d51['stopPropagation'](), void _0x39eec3['_handleDebugRequest']());
    }),
    syncLocalEditMode(_0x39eec3));
}
export async function submitLocalEdit(_0x5e773b, _0x25ae24, _0x5a8d86, _0x4c0636 = runGenerationResultFlow) {
  if (_0x5e773b['_localEditSubmission'] || !_0x5e773b['active']) return;
  const _0x31e00e = _0x5e773b['_localEditSession'],
    _0x30abf0 = globalThis['window']?.['CanvasTabManager']?.['getActiveCanvasId']?.(),
    _0x3c3915 = globalThis['window']?.['currentProjectId'],
    _0x28b235 = _0x5e773b['_mode']['scene'],
    _0x40d9d5 = { ..._0x25ae24 },
    _0x5024df = _0x5e773b['generationToolbarEl'],
    _0x570fb6 = _0x5024df['querySelector']('.go'),
    _0xfa7b65 = {};
  ((_0x5e773b['_localEditSubmission'] = _0xfa7b65), _0x5e773b['_closeGenerationMenus']());
  const _0x1eef14 = [..._0x5024df['querySelectorAll']('button, input')],
    _0x1eedaa = _0x1eef14['map']((_0x3cfa7e) => _0x3cfa7e['disabled']);
  (_0x1eef14['forEach']((_0x19ef68) => {
    _0x19ef68['disabled'] = !![];
  }),
    _0x5024df['setAttribute']('aria-busy', 'true'),
    setGenerateButtonLoadingUi(_0x570fb6, { title: t('imageAnnotate.actions.generating') }));
  globalThis['window']?.['matchMedia']?.('(prefers-reduced-motion: reduce)')['matches'] &&
    (_0x570fb6['querySelector']('svg')['style']['animation'] = 'none');
  const _0x351a4b = () =>
    _0x5e773b['active'] &&
    _0x5e773b['_localEditSession'] === _0x31e00e &&
    _0x5e773b['nodeId'] === _0x40d9d5['id'] &&
    !!appStore['getStateRaw']()['nodes']?.[_0x40d9d5['id']] &&
    globalThis['window']?.['CanvasTabManager']?.['getActiveCanvasId']?.() === _0x30abf0 &&
    globalThis['window']?.['currentProjectId'] === _0x3c3915;
  let _0x4e7f1f = null;
  try {
    _0x4e7f1f = await _0x5e773b['_buildGenerationPayload'](_0x40d9d5, _0x5a8d86);
    if (!_0x4e7f1f?.['payload'] || !_0x351a4b()) return;
    const _0xf35103 = _0x4e7f1f;
    ((_0x4e7f1f = null),
      await _0x4c0636({
        scene: _0x28b235,
        built: _0xf35103,
        sourceNode: _0x40d9d5,
        fallbackModel: _0xf35103['payload']['model'],
        fallbackProvider: _0xf35103['payload']['provider'],
        exitController: (_0x2096d5) => {
          if (_0x351a4b()) _0x5e773b['exit'](_0x2096d5);
        },
        notify: (_0x4b113b, _0x1537cf) => window['showToast']?.(_0x4b113b, _0x1537cf),
      }));
  } catch (_0x27874d) {
    if (_0x351a4b())
      window['showToast']?.(_0x27874d?.['message'] || t('imageAnnotate.toasts.saveFailed'), 'error');
  } finally {
    if (_0x4e7f1f?.['inputUrl']) URL['revokeObjectURL'](_0x4e7f1f['inputUrl']);
    if (_0x5e773b['_localEditSubmission'] === _0xfa7b65) _0x5e773b['_localEditSubmission'] = null;
    _0x5e773b['generationToolbarEl'] === _0x5024df &&
      (_0x1eef14['forEach']((_0x931abb, _0x4e0108) => {
        _0x931abb['disabled'] = _0x1eedaa[_0x4e0108];
      }),
      _0x5024df['removeAttribute']('aria-busy'),
      resetGenerateButtonIdleUi(_0x570fb6, getSubmitLabel(_0x28b235)));
  }
}
