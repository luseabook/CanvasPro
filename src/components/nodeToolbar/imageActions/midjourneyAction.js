import { t } from '../../../i18n/index.js';
import {
  createToolbarActionPopupAnchorPositionGetter,
  positionToolbarActionSubmenuAbove,
} from '../actionMenu.js';
import { showProviderApiKeyMissingToastForError } from '../../../modules/providerApiKeyMissingToast.js';
const APIMART_MIDJOURNEY_MODEL_ID = 'apimart/midjourney',
  MJ_SECONDARY_ACTION_POLL_OPTIONS = Object['freeze']({ maxPolls: 0x384, pollIntervalMs: 0x7d0 }),
  MJ_VARIATION_OPTIONS = Object['freeze']([
    Object['freeze']({ mode: 'weak', labelKey: 'variationWeakAction' }),
    Object['freeze']({ mode: 'medium', labelKey: 'variationMediumAction' }),
    Object['freeze']({ mode: 'strong', labelKey: 'variationStrongAction' }),
  ]),
  MJ_REMIX_VARIATION_OPTIONS = Object['freeze']([
    Object['freeze']({ mode: 'weak', labelKey: 'variationWeakAction' }),
    Object['freeze']({ mode: 'strong', labelKey: 'variationStrongAction' }),
  ]);
function midjourneyText(_0x261954, _0x251435 = {}) {
  return t('nodeToolbar.midjourney.' + _0x261954, _0x251435);
}
function clampMainImageIndex(_0x445c41 = {}) {
  const _0x210e8c = Array['isArray'](_0x445c41?.['images']) ? _0x445c41['images'] : [];
  if (_0x210e8c['length'] === 0x0) return 0x0;
  const _0x2b7873 = Number['parseInt'](_0x445c41?.['mainImageIndex'], 0xa);
  if (!Number['isFinite'](_0x2b7873)) return 0x0;
  return Math['max'](0x0, Math['min'](_0x210e8c['length'] - 0x1, _0x2b7873));
}
function normalizeMjIndex(_0x1b533f, _0x4aef87 = 0x0) {
  const _0x4707e0 = Number['parseInt'](_0x1b533f, 0xa);
  if (Number['isFinite'](_0x4707e0) && _0x4707e0 >= 0x1 && _0x4707e0 <= 0x4) return _0x4707e0;
  return _0x4aef87 >= 0x1 && _0x4aef87 <= 0x4 ? _0x4aef87 : 0x0;
}
function normalizeMjModelVersion(_0x298314) {
  return String(_0x298314 || '')
    ['trim']()
    ['toLowerCase']()
    ['replace'](/^v/, '');
}
function normalizeMjSpeed(_0x474d0, _0xbca6f1 = 'relax') {
  const _0xd15b1f = String(_0x474d0 || '')
    ['trim']()
    ['toLowerCase']();
  if (_0xd15b1f === 'relax' || _0xd15b1f === 'fast' || _0xd15b1f === 'turbo') return _0xd15b1f;
  return _0xbca6f1;
}
function normalizeBooleanFlag(_0x8ff3c3) {
  if (_0x8ff3c3 === !![] || _0x8ff3c3 === ![]) return _0x8ff3c3;
  const _0x3751db = String(_0x8ff3c3 ?? '')
    ['trim']()
    ['toLowerCase']();
  if (!_0x3751db) return ![];
  return _0x3751db === 'true' || _0x3751db === '1' || _0x3751db === 'yes';
}
export function isApimartMidjourneyHdSupported(_0x3d87d6 = '') {
  const _0x29d5ab = normalizeMjModelVersion(_0x3d87d6);
  return _0x29d5ab !== '8.2' && _0x29d5ab !== '8.1';
}
function isApimartMidjourneyRemixModel(_0x3dbf30 = '') {
  const _0x4d129e = normalizeMjModelVersion(_0x3dbf30);
  return _0x4d129e === '8.2' || _0x4d129e === '8.1';
}
export function getApimartMidjourneyVariationOptions(_0x3c980b = '') {
  return isApimartMidjourneyRemixModel(_0x3c980b) ? MJ_REMIX_VARIATION_OPTIONS : MJ_VARIATION_OPTIONS;
}
function normalizeButtons(_0x16a9ca) {
  if (!Array['isArray'](_0x16a9ca)) return [];
  return _0x16a9ca['map']((_0x13bf06) => {
    if (!_0x13bf06 || typeof _0x13bf06 !== 'object') return null;
    const _0x145031 = String(_0x13bf06['customId'] || _0x13bf06['custom_id'] || '')['trim'](),
      _0x3b7514 = String(_0x13bf06['label'] || _0x13bf06['name'] || _0x13bf06['text'] || '')['trim']();
    if (!_0x145031 && !_0x3b7514) return null;
    return { ...(_0x145031 ? { customId: _0x145031 } : {}), ...(_0x3b7514 ? { label: _0x3b7514 } : {}) };
  })['filter'](Boolean);
}
function getCurrentImage(_0x496c67 = {}) {
  const _0x585ec4 = Array['isArray'](_0x496c67?.['images']) ? _0x496c67['images'] : [];
  if (_0x585ec4['length'] === 0x0) return _0x496c67 || {};
  return _0x585ec4[clampMainImageIndex(_0x496c67)] || {};
}
function getCurrentImageUrl(_0x49a8fd = {}, _0x23cf02 = null) {
  const _0x997a73 = getCurrentImage(_0x49a8fd),
    _0xe07ca1 = String(_0x997a73?.['localPath'] || _0x49a8fd?.['localPath'] || '')['trim'](),
    _0x36d7e2 = typeof _0x23cf02 === 'function' ? _0x23cf02(_0xe07ca1) : '';
  return String(
    _0x36d7e2 ||
      _0x997a73?.['thumbUrl'] ||
      _0x997a73?.['imageUrl'] ||
      _0x997a73?.['sourceUrl'] ||
      _0x997a73?.['src'] ||
      _0x49a8fd?.['thumbUrl'] ||
      _0x49a8fd?.['imageUrl'] ||
      _0x49a8fd?.['sourceUrl'] ||
      _0x49a8fd?.['src'] ||
      '',
  )['trim']();
}
function isApimartMidjourneyNode(_0x5f06f9 = {}, _0x1da695 = {}) {
  const _0x5cf3f4 = String(
      _0x1da695?.['metadata']?.['provider'] ||
        _0x1da695?.['provider'] ||
        _0x5f06f9?.['provider'] ||
        _0x5f06f9?.['taskProvider'] ||
        '',
    )
      ['trim']()
      ['toLowerCase'](),
    _0xe073be = [
      _0x1da695?.['metadata']?.['model'],
      _0x1da695?.['model'],
      _0x5f06f9?.['model'],
      _0x5f06f9?.['modelId'],
      _0x5f06f9?.['taskModelId'],
      _0x5f06f9?.['executionId'],
      _0x5f06f9?.['taskExecutionId'],
    ],
    _0x2eff55 = _0xe073be['some']((_0x2f68a1) => {
      const _0x129526 = String(_0x2f68a1 || '')
        ['trim']()
        ['toLowerCase']();
      return _0x129526 === APIMART_MIDJOURNEY_MODEL_ID || _0x129526['includes']('midjourney');
    });
  return _0x2eff55 && (!_0x5cf3f4 || _0x5cf3f4 === 'apimart');
}
export function resolveApimartMidjourneyToolbarContext(_0x66fe8e = {}) {
  const _0xe57326 = getCurrentImage(_0x66fe8e),
    _0x5c7f95 =
      _0xe57326?.['metadata']?.['apimartMidjourney'] ||
      _0xe57326?.['apimartMidjourney'] ||
      _0x66fe8e?.['metadata']?.['apimartMidjourney'] ||
      null;
  if (!isApimartMidjourneyNode(_0x66fe8e, _0xe57326)) return { enabled: ![] };
  const _0x32e08a = _0x5c7f95 && typeof _0x5c7f95 === 'object' ? _0x5c7f95 : {},
    _0x5e0025 = Array['isArray'](_0x66fe8e?.['images']) ? _0x66fe8e['images'] : [],
    _0x4fff70 = clampMainImageIndex(_0x66fe8e),
    _0x46d407 = normalizeMjIndex(_0x32e08a['index'], _0x4fff70 + 0x1),
    _0x177390 = String(_0x32e08a['taskId'] || _0x66fe8e?.['asyncTaskId'] || _0x66fe8e?.['taskId'] || '')[
      'trim'
    ](),
    _0x317aca = normalizeButtons(_0x32e08a['buttons']),
    _0x8aaa1b = String(_0x32e08a['action'] || '')
      ['trim']()
      ['toUpperCase']();
  if (_0x8aaa1b['includes']('UPSCALE')) return { enabled: ![] };
  const _0x36442e =
    _0x317aca['length'] > 0x0 ||
    String(_0x32e08a['gridImageUrl'] || '')['trim']() ||
    _0x8aaa1b['includes']('IMAGINE') ||
    _0x5e0025['length'] >= 0x4;
  if (!_0x177390 || !_0x46d407 || !_0x36442e) return { enabled: ![] };
  const _0xc6c55c = String(
      _0x32e08a['mjModel'] ||
        _0xe57326?.['metadata']?.['mjModel'] ||
        _0x66fe8e?.['generationParams']?.['mjModel'] ||
        _0x66fe8e?.['mjModel'] ||
        '',
    )['trim'](),
    _0x45a609 = normalizeMjSpeed(
      _0x32e08a['speed'] ||
        _0xe57326?.['metadata']?.['speed'] ||
        _0x66fe8e?.['generationParams']?.['speed'] ||
        _0x66fe8e?.['speed'] ||
        '',
    ),
    _0x5a452f = String(
      _0x32e08a['prompt'] ||
        _0xe57326?.['metadata']?.['prompt'] ||
        _0x66fe8e?.['prompt'] ||
        _0x66fe8e?.['generationParams']?.['prompt'] ||
        '',
    )['trim'](),
    _0x21a9ee = normalizeBooleanFlag(
      _0x32e08a['hd'] ??
        _0xe57326?.['metadata']?.['hd'] ??
        _0x66fe8e?.['generationParams']?.['hd'] ??
        _0x66fe8e?.['hd'],
    ),
    _0x217a74 = isApimartMidjourneyHdSupported(_0xc6c55c) && _0x21a9ee !== !![];
  return {
    enabled: !![],
    taskId: _0x177390,
    index: _0x46d407,
    buttons: _0x317aca,
    image: _0xe57326,
    supportsHd: _0x217a74,
    mjModel: _0xc6c55c,
    speed: _0x45a609,
    prompt: _0x5a452f,
    hd: _0x21a9ee,
  };
}
function resolveHdCommand(_0x2b7eca = '') {
  const _0x42f6fe = String(_0x2b7eca || '')
    ['trim']()
    ['toLowerCase']();
  if (_0x42f6fe['includes']('5.')) return 'upsample_v5_2x';
  if (_0x42f6fe['includes']('6')) return 'upsample_v6_2x_subtle';
  return 'upsample_v7_2x_subtle';
}
export function buildApimartMidjourneyHdCustomId(_0x1ff09d = [], _0x20682a = 0x0, _0x819028 = '') {
  const _0x3259fa = normalizeMjIndex(_0x20682a);
  if (!_0x3259fa) return '';
  if (!isApimartMidjourneyHdSupported(_0x819028)) return '';
  const _0x6bb53d = resolveHdCommand(_0x819028);
  for (const _0x2ce7e3 of normalizeButtons(_0x1ff09d)) {
    const _0x443fae = String(_0x2ce7e3?.['customId'] || '')['trim']();
    if (!_0x443fae) continue;
    const _0x5b6956 = _0x443fae['split']('::');
    if (_0x5b6956['length'] < 0x5) continue;
    if (String(_0x5b6956[0x0])['toUpperCase']() !== 'MJ') continue;
    if (String(_0x5b6956[0x1])['toUpperCase']() !== 'JOB') continue;
    if (!String(_0x5b6956[0x2] || '')['startsWith']('upsample')) continue;
    if (Number['parseInt'](_0x5b6956[0x3], 0xa) !== _0x3259fa) continue;
    return ((_0x5b6956[0x2] = _0x6bb53d), _0x5b6956['join']('::'));
  }
  return '';
}
function midjourneyOutputText({ actionLabel: actionLabel = '', index: index = 0x0 } = {}) {
  return midjourneyText('outputText', {
    model: midjourneyText('modelLabel'),
    action: actionLabel,
    index: index,
  });
}
function getPlainObject(_0x34ee5f) {
  return _0x34ee5f && typeof _0x34ee5f === 'object' && !Array['isArray'](_0x34ee5f) ? _0x34ee5f : {};
}
export function buildApimartMidjourneyTargetNodePayload({
  id: id = '',
  x: x = 0x0,
  y: y = 0x0,
  width: width = 0x120,
  height: height = 0x120,
  name: name = '',
  outputText: outputText = '',
  fileName: fileName = '',
  generationParams: generationParams = {},
  startedAt: startedAt = 0x0,
  startPatch: startPatch = {},
  protocolPatch: protocolPatch = {},
} = {}) {
  return {
    id: id,
    type: 'ai-image',
    x: Number(x) || 0x0,
    y: Number(y) || 0x0,
    width: Math['max'](0x1, Math['round'](Number(width) || 0x120)),
    height: Math['max'](0x1, Math['round'](Number(height) || 0x120)),
    needsAutoResize: ![],
    name: name,
    prompt: '',
    src: '',
    imageUrl: '',
    sourceUrl: '',
    thumbUrl: '',
    localPath: '',
    fileName: fileName,
    outputText: outputText,
    provider: 'apimart',
    model: APIMART_MIDJOURNEY_MODEL_ID,
    adapterType: 'modelApi',
    generationParams: { ...getPlainObject(generationParams) },
    ...getPlainObject(startPatch),
    ...getPlainObject(protocolPatch),
    generationStartTime: startedAt,
  };
}
function normalizeVariationMode(_0x585b67) {
  const _0x1d7cb5 = String(_0x585b67 || '')
    ['trim']()
    ['toLowerCase']();
  if (_0x1d7cb5 === 'weak' || _0x1d7cb5 === 'strong') return _0x1d7cb5;
  return 'medium';
}
export function buildApimartMidjourneyActionPayload({
  kind: kind = '',
  actionContext: actionContext = {},
  customId: customId = '',
  variationMode: variationMode = '',
  outputText: outputText = '',
} = {}) {
  const _0x5bde53 = String(kind || '') === 'variation';
  return {
    parentTaskId: String(actionContext?.['taskId'] || '')['trim'](),
    index: actionContext?.['index'],
    customId: String(customId || ''),
    speed: normalizeMjSpeed(actionContext?.['speed']),
    prompt: String(actionContext?.['prompt'] || '')['trim'](),
    actionKind: kind,
    mjModel: String(actionContext?.['mjModel'] || '')['trim'](),
    ...(_0x5bde53 ? { variationMode: normalizeVariationMode(variationMode) } : {}),
    outputText: outputText,
  };
}
function getVariationActionLabel(_0x4e584e) {
  switch (normalizeVariationMode(_0x4e584e)) {
    case 'weak':
      return midjourneyText('variationWeakAction');
    case 'strong':
      return midjourneyText('variationStrongAction');
    default:
      return midjourneyText('variationMediumAction');
  }
}
function normalizeResumedImages(_0x532c3b) {
  if (_0x532c3b?.['isBatch'] && Array['isArray'](_0x532c3b['images'])) return _0x532c3b['images'];
  return _0x532c3b ? [_0x532c3b] : [];
}
function getResultUrlFromImage(_0x2ee785 = {}) {
  return String(
    _0x2ee785?.['sourceUrl'] ||
      _0x2ee785?.['imageUrl'] ||
      _0x2ee785?.['thumbUrl'] ||
      _0x2ee785?.['src'] ||
      _0x2ee785?.['url'] ||
      '',
  )['trim']();
}
function setButtonVisible(_0x18b59a, _0x36eddf) {
  if (!_0x18b59a) return;
  ((_0x18b59a['hidden'] = !_0x36eddf),
    _0x18b59a['classList']['toggle']('is-hidden', !_0x36eddf),
    _0x18b59a['setAttribute']('aria-hidden', _0x36eddf ? 'false' : 'true'));
}
function setBusy(_0x3c590d, _0x3c311e) {
  if (!_0x3c590d) return;
  _0x3c590d['classList']['toggle']('is-task-running', _0x3c311e);
  const _0x484144 = _0x3c590d['querySelector']('svg');
  if (!_0x484144) return;
  if (_0x3c311e) _0x484144['classList']['add']('v2-spinning');
  else _0x484144['classList']['remove']('v2-spinning');
}
function openVariationSubmenu(_0x33524b, _0x1d28e9, _0x80b824 = MJ_VARIATION_OPTIONS) {
  const _0x20581f = document['querySelector']('.v2-mj-variation-submenu');
  if (_0x20581f) {
    const _0x81e323 =
        _0x20581f['__v2MjVariationAnchorBtn'] && _0x20581f['__v2MjVariationAnchorBtn'] === _0x33524b,
      _0x420ad8 =
        typeof _0x20581f['__v2MjVariationClose'] === 'function'
          ? _0x20581f['__v2MjVariationClose']
          : () => _0x20581f['remove']();
    _0x420ad8();
    if (_0x81e323) return () => {};
  }
  const _0x4bbdf9 = document['createElement']('div');
  ((_0x4bbdf9['className'] = 'v2-mj-variation-submenu node-toolbar-action-submenu'),
    (_0x4bbdf9['__v2MjVariationAnchorBtn'] = _0x33524b),
    _0x4bbdf9['setAttribute']('role', 'menu'));
  const _0x27cc08 = document['createElement']('div');
  ((_0x27cc08['className'] = 'node-toolbar-action-menu-title'),
    (_0x27cc08['textContent'] = midjourneyText('chooseVariation')),
    _0x4bbdf9['appendChild'](_0x27cc08));
  const _0x581441 =
    Array['isArray'](_0x80b824) && _0x80b824['length'] > 0x0 ? _0x80b824 : MJ_VARIATION_OPTIONS;
  for (const _0x55190b of _0x581441) {
    const _0x4b5ac4 = document['createElement']('div');
    ((_0x4b5ac4['className'] = 'node-toolbar-action-menu-item\x20node-toolbar-action-submenu-item'),
      _0x4b5ac4['setAttribute']('role', 'menuitem'),
      (_0x4b5ac4['tabIndex'] = 0x0),
      (_0x4b5ac4['textContent'] = midjourneyText(_0x55190b['labelKey'])));
    const _0x561be9 = (_0x1ecc2e) => {
      (_0x1ecc2e['stopPropagation'](),
        _0x1ecc2e['preventDefault'](),
        _0x28bed5(),
        _0x1d28e9?.(_0x55190b['mode']));
    };
    (_0x4b5ac4['addEventListener']('click', _0x561be9),
      _0x4b5ac4['addEventListener']('keydown', (_0x888580) => {
        if (_0x888580['key'] !== 'Enter' && _0x888580['key'] !== '\x20') return;
        _0x561be9(_0x888580);
      }),
      _0x4bbdf9['appendChild'](_0x4b5ac4));
  }
  const _0x465886 = createToolbarActionPopupAnchorPositionGetter(_0x33524b, { gap: 0xa }),
    _0x208a72 = () => {
      const _0x128154 = _0x465886();
      positionToolbarActionSubmenuAbove(_0x128154, _0x4bbdf9);
    };
  (_0x208a72(), Object['assign'](_0x4bbdf9['style'], { opacity: '0', pointerEvents: 'none' }));
  const _0x3389a5 = (_0x74fd00) => {
      const _0x321f1a = _0x74fd00['target'];
      if (_0x4bbdf9['contains'](_0x321f1a) || _0x33524b['contains'](_0x321f1a)) return;
      _0x28bed5();
    },
    _0x3f6466 = (_0x53978a) => {
      if (_0x53978a['key'] === 'Escape') _0x28bed5();
    },
    _0x3ac4d8 = () => _0x208a72(),
    _0x28bed5 = () => {
      (document['removeEventListener']('pointerdown', _0x3389a5, !![]),
        document['removeEventListener']('keydown', _0x3f6466, !![]),
        window['removeEventListener']('resize', _0x3ac4d8, !![]),
        window['removeEventListener']('scroll', _0x3ac4d8, !![]),
        _0x33524b['classList']['remove']('is-active'));
      if (document['body']['contains'](_0x4bbdf9)) _0x4bbdf9['remove']();
    };
  ((_0x4bbdf9['__v2MjVariationClose'] = _0x28bed5),
    document['body']['appendChild'](_0x4bbdf9),
    _0x33524b['classList']['add']('is-active'));
  const _0x4b9222 =
    typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame
      : (_0x21bb90) => setTimeout(_0x21bb90, 0x0);
  return (
    _0x4b9222(() => {
      (_0x208a72(), (_0x4bbdf9['style']['opacity'] = '1'), (_0x4bbdf9['style']['pointerEvents'] = 'auto'));
    }),
    document['addEventListener']('pointerdown', _0x3389a5, !![]),
    document['addEventListener']('keydown', _0x3f6466, !![]),
    window['addEventListener']('resize', _0x3ac4d8, !![]),
    window['addEventListener']('scroll', _0x3ac4d8, !![]),
    _0x28bed5
  );
}
export function bindApimartMidjourneyActions(_0x10b385) {
  const {
      toolbarEl: _0x3730ba,
      nodeId: _0x1721ca,
      getNodeData: _0x551d39,
      store: _0x3ca49c,
      submitTask: _0x4bfdfb,
      buildImageGenerationFailurePatch: _0x4b9ff6,
      buildImageGenerationResultPatch: _0x41cb36,
      calcDisplaySizeByMedia: _0x55fada,
      calcSafeSpawnPosNearNode: _0x51f8de,
      localPathToUrl: _0x20f643,
      resolveApiInputRatioBasis: _0x3cb14a,
      resolveFinalResultDisplaySize: _0x4253b2,
      saveOutputImageResult: _0xd8274f,
      buildToolbarImageFields: _0x576f0d,
      submitApimartMidjourneyUpscaleRequest: _0xfc83c4,
      submitApimartMidjourneyVariationRequest: _0x5400c9,
      resumeApimartMidjourneyUpscaleTask: _0x3a2113,
      createLocalSaveFailureError: _0x570898,
      isLocalSaveFailure: _0x5d4b5b,
      buildClearedImageMediaFields: _0x26ffd0,
      IMAGE_LOCAL_SAVE_FAILURE_MESSAGE: _0x22dd94,
      selectToolbarTaskNode: _0x3889c8,
      notifyImageToolbarTaskChange: _0x23c85a,
    } = _0x10b385,
    _0x2771d7 = _0x3730ba['querySelector']('.act-mj-variation'),
    _0x1fc75c = _0x3730ba['querySelector']('.act-mj-hd');
  if (!_0x2771d7 && !_0x1fc75c) return;
  let _0x4c2e4f = () => {};
  const _0xa7bc83 = () => {
    const _0x254137 = resolveApimartMidjourneyToolbarContext(_0x551d39());
    (setButtonVisible(_0x2771d7, _0x254137['enabled']),
      setButtonVisible(_0x1fc75c, _0x254137['enabled'] && _0x254137['supportsHd'] !== ![]),
      !_0x254137['enabled'] && (_0x4c2e4f(), (_0x4c2e4f = () => {})));
  };
  _0xa7bc83();
  let _0x2f0b2e = '';
  const _0x2898d9 = (_0x16f041, _0x4b741c, _0x447755 = {}) => {
    if (_0x2f0b2e) {
      window['showToast']?.(midjourneyText('busy'), 'info');
      return;
    }
    void (async () => {
      let _0x1fc610 = null,
        _0x2a440e = null,
        _0x2d50f7 = '',
        _0x5cf60f = '',
        _0x48a5a7 = '',
        _0x474f47 = null;
      const _0x42ed95 = _0x16f041 === 'hd',
        _0x268c96 = _0x16f041 === 'variation',
        _0x336a81 = normalizeVariationMode(_0x447755?.['variationMode']),
        _0x2918a1 = _0x42ed95 ? midjourneyText('hdAction') : getVariationActionLabel(_0x336a81);
      try {
        ((_0x2f0b2e = _0x16f041), setBusy(_0x4b741c, !![]));
        const _0x3d00d8 = _0x551d39() || {},
          _0x243556 = resolveApimartMidjourneyToolbarContext(_0x3d00d8);
        if (!_0x243556['enabled']) {
          window['showToast']?.(midjourneyText('missingContext'), 'error');
          return;
        }
        if (_0x42ed95 && _0x243556['supportsHd'] === ![]) {
          window['showToast']?.(midjourneyText('hdUnsupported'), 'info');
          return;
        }
        const _0x12d4d4 = _0x42ed95
          ? buildApimartMidjourneyHdCustomId(_0x243556['buttons'], _0x243556['index'], _0x243556['mjModel'])
          : '';
        if (_0x42ed95 && !_0x12d4d4) {
          window['showToast']?.(midjourneyText('hdCustomIdMissing'), 'error');
          return;
        }
        const _0x154588 = _0x3ca49c['getState']()['nodes'][_0x1721ca] || _0x3d00d8;
        if (!_0x154588) {
          window['showToast']?.(midjourneyText('sourceNodeMissing'), 'error');
          return;
        }
        const _0x4682be = getCurrentImageUrl(_0x3d00d8, _0x20f643);
        _0x1fc610 = await _0x3cb14a(_0x154588, _0x4682be);
        const { width: _0x2355ab, height: _0x54370d } = _0x55fada(_0x1fc610['width'], _0x1fc610['height']),
          { x: _0x112c70, y: _0x2033a0 } = _0x51f8de(
            _0x3ca49c['getState']()['nodes'],
            _0x154588,
            _0x2355ab,
            _0x54370d,
          ),
          _0x4a62b =
            'ai-image-apimart-mj-' +
            _0x16f041 +
            '-' +
            Date['now']() +
            '-' +
            Math['random']()['toString'](0x24)['slice'](0x2, 0x6),
          _0x3cc804 = midjourneyOutputText({ actionLabel: _0x2918a1, index: _0x243556['index'] }),
          _0x5ecb6f = {
            ...getPlainObject(_0x3d00d8?.['generationParams']),
            ...(_0x243556['mjModel'] ? { mjModel: _0x243556['mjModel'] } : {}),
            ...(_0x243556['speed'] ? { speed: _0x243556['speed'] } : {}),
          },
          _0x146fb4 = buildApimartMidjourneyActionPayload({
            kind: _0x16f041,
            actionContext: _0x243556,
            customId: _0x12d4d4,
            variationMode: _0x336a81,
            outputText: _0x3cc804,
          }),
          _0x227321 = await _0x4bfdfb({
            sourceNodeId: _0x154588['id'],
            trigger: 'toolbar',
            taskType: 'apimart-midjourney-' + _0x16f041,
            provider: 'apimart',
            adapterType: 'modelApi',
            async: !![],
            modelId: APIMART_MIDJOURNEY_MODEL_ID,
            executionId: _0x268c96
              ? 'apimart.model-api.midjourney.variation'
              : 'apimart.model-api.midjourney.upscale',
            payload: _0x146fb4,
            cancellable: !![],
            resumable: !![],
            onTaskChange: _0x23c85a,
            createTargetNode: ({ startedAt: _0x29cd25, startPatch: _0x2fbc40, protocolPatch: _0x316873 }) =>
              buildApimartMidjourneyTargetNodePayload({
                id: _0x4a62b,
                x: _0x112c70,
                y: _0x2033a0,
                width: _0x2355ab,
                height: _0x54370d,
                needsAutoResize: ![],
                name: _0x42ed95
                  ? midjourneyText('hdProcessingName')
                  : midjourneyText('variationProcessingName'),
                outputText: _0x3cc804,
                fileName: 'apimart_midjourney_' + _0x16f041 + '_' + Date['now']() + '.png',
                generationParams: _0x5ecb6f,
                startedAt: _0x29cd25,
                startPatch: _0x2fbc40,
                protocolPatch: _0x316873,
              }),
            submit: async (_0x2475bd, _0x4d0afb) => {
              _0x3889c8(_0x4d0afb['targetNodeId']);
              const _0x5a3825 = _0x268c96 ? _0x5400c9 : _0xfc83c4,
                _0x33cbb0 = await _0x5a3825({
                  taskId: _0x2475bd['parentTaskId'],
                  index: _0x2475bd['index'],
                  customId: _0x2475bd['customId'],
                  speed: _0x2475bd['speed'],
                  prompt: _0x2475bd['prompt'],
                  mjModel: _0x2475bd['mjModel'],
                  variationMode: _0x2475bd['variationMode'],
                  signal: _0x4d0afb['signal'],
                });
              if (_0x33cbb0?.['taskId']) _0x4d0afb['onTaskId'](_0x33cbb0['taskId']);
              return { taskId: _0x33cbb0?.['taskId'] || '' };
            },
            poll: async ({ taskId: _0x4da84e, signal: _0x3cc16e }) => {
              const _0x57a7e3 = await _0x3a2113(
                _0x4da84e,
                { provider: 'apimart', model: APIMART_MIDJOURNEY_MODEL_ID },
                {
                  ...MJ_SECONDARY_ACTION_POLL_OPTIONS,
                  apimartMidjourneySource: {
                    action: _0x268c96 ? 'VARIATION' : 'UPSCALE',
                    ...(_0x146fb4['mjModel'] ? { mjModel: _0x146fb4['mjModel'] } : {}),
                    ...(_0x146fb4['speed'] ? { speed: _0x146fb4['speed'] } : {}),
                    ...(_0x146fb4['prompt'] ? { prompt: _0x146fb4['prompt'] } : {}),
                    ...(_0x42ed95 ? { hd: !![] } : {}),
                  },
                  signal: _0x3cc16e,
                },
              );
              if (_0x57a7e3?.['pending']) return _0x57a7e3;
              const _0x990fd3 = normalizeResumedImages(_0x57a7e3)['filter'](
                  (_0x16e49e) => _0x16e49e && !_0x16e49e['error'] && getResultUrlFromImage(_0x16e49e),
                ),
                _0x269adc = _0x990fd3[0x0] || null;
              if (!_0x269adc || _0x269adc['error'])
                throw new Error(String(_0x269adc?.['error'] || midjourneyText('missingResultImage')));
              const _0x3315ae = getResultUrlFromImage(_0x269adc);
              if (!_0x3315ae) throw new Error(midjourneyText('missingResultImage'));
              return { resultUrl: _0x3315ae, resumedImage: _0x269adc, resultImages: _0x990fd3 };
            },
            resultBuilder: async (_0xaacd6b, _0x41fe49) => {
              const _0x1b15b2 = String(_0xaacd6b?.['resultUrl'] || '')['trim']();
              if (!_0x1b15b2) throw new Error(midjourneyText('missingResultImage'));
              ((_0x2d50f7 = _0x1b15b2), (_0x474f47 = _0xaacd6b?.['resumedImage'] || null));
              const _0x1b1e2a = Array['isArray'](_0xaacd6b?.['resultImages'])
                ? _0xaacd6b['resultImages']
                : [];
              if (_0x268c96 && _0x1b1e2a['length'] > 0x1) {
                ((_0x5cf60f = _0x474f47?.['thumbUrl'] || _0x474f47?.['imageUrl'] || _0x1b15b2),
                  (_0x48a5a7 = _0x474f47?.['localPath'] || ''),
                  (_0x2a440e = await _0x4253b2(_0x1fc610, {
                    localPath: _0x48a5a7,
                    imageUrl: _0x5cf60f,
                    sourceUrl: _0x1b15b2,
                    thumbUrl: _0x5cf60f,
                    src: _0x5cf60f,
                  })));
                if (!_0x48a5a7) throw _0x570898();
                return {
                  name: midjourneyText('variationResultName'),
                  ..._0x41cb36({ isBatch: !![], images: _0x1b1e2a }, { startedAt: _0x41fe49['startedAt'] }),
                  fileName:
                    _0x474f47?.['fileName'] ||
                    'apimart_midjourney_' + _0x16f041 + '_' + Date['now']() + '.png',
                  width: _0x2a440e['width'],
                  height: _0x2a440e['height'],
                  outputText: _0x3cc804,
                };
              }
              let _0xcdac18;
              try {
                _0xcdac18 = await _0xd8274f(_0x1b15b2, {
                  resumedImage: _0x474f47,
                  ext: 'png',
                  includeSrc: !![],
                  taskKey: _0x41fe49['taskId'] ? 'apimart:image:' + _0x41fe49['taskId'] : '',
                });
              } catch (_0x5d96dc) {
                (console['warn']('[ApimartMJ] saveOutputFromUrlToServer failed:', _0x5d96dc),
                  (_0xcdac18 = {
                    localPath: '',
                    thumbUrl: _0x1b15b2,
                    fields: _0x576f0d({
                      localPath: '',
                      resultUrl: _0x1b15b2,
                      thumbUrl: _0x1b15b2,
                      includeSrc: !![],
                    }),
                  }));
              }
              ((_0x5cf60f = _0xcdac18['thumbUrl'] || _0x1b15b2), (_0x48a5a7 = _0xcdac18['localPath'] || ''));
              const _0x2c1a56 = _0xcdac18['fields'];
              _0x2a440e = await _0x4253b2(_0x1fc610, {
                localPath: _0x48a5a7,
                imageUrl: _0x5cf60f || _0x1b15b2,
                sourceUrl: _0x1b15b2,
                thumbUrl: _0x5cf60f,
                src: _0x5cf60f || _0x1b15b2,
              });
              if (!_0x48a5a7) throw _0x570898();
              return {
                name: _0x42ed95 ? midjourneyText('hdResultName') : midjourneyText('variationResultName'),
                ..._0x41cb36(_0x2c1a56, { startedAt: _0x41fe49['startedAt'] }),
                ..._0x2c1a56,
                sourceUrl: _0x1b15b2 || _0x2c1a56['sourceUrl'] || '',
                fileName:
                  _0x474f47?.['fileName'] ||
                  _0x2c1a56['fileName'] ||
                  'apimart_midjourney_' + _0x16f041 + '_' + Date['now']() + '.png',
                width: _0x2a440e['width'],
                height: _0x2a440e['height'],
                outputText: _0x3cc804,
              };
            },
            failureBuilder: async (_0x252b14, _0x12d129) => {
              const _0x1cd79b =
                _0x252b14 instanceof Error
                  ? _0x252b14['message']
                  : String(_0x252b14 || midjourneyText('unknownError'));
              if (_0x5d4b5b(_0x252b14))
                return (
                  (_0x2a440e ||= await _0x4253b2(_0x1fc610, {
                    localPath: _0x48a5a7,
                    imageUrl: _0x5cf60f || _0x2d50f7,
                    sourceUrl: _0x2d50f7,
                    thumbUrl: _0x5cf60f,
                    src: _0x5cf60f || _0x2d50f7,
                  })),
                  {
                    name: _0x42ed95 ? midjourneyText('hdResultName') : midjourneyText('variationResultName'),
                    ..._0x26ffd0(),
                    fileName: 'apimart_midjourney_' + _0x16f041 + '_' + Date['now']() + '.png',
                    width: _0x2a440e['width'],
                    height: _0x2a440e['height'],
                    outputText: _0x3cc804,
                    ..._0x4b9ff6({ error: _0x22dd94, startedAt: _0x12d129['startedAt'] }),
                    rhStatusMessage: _0x22dd94,
                  }
                );
              return {
                name: midjourneyText('failedName'),
                ..._0x4b9ff6({ error: _0x1cd79b, startedAt: _0x12d129['startedAt'] }),
                outputText: midjourneyText('outputTextWithError', {
                  outputText: _0x3cc804,
                  error: _0x1cd79b,
                }),
              };
            },
            cancelledBuilder: () => ({
              name: midjourneyText('cancelledName'),
              outputText: midjourneyText('outputTextWithStatus', {
                outputText: _0x3cc804,
                status: midjourneyText('status.cancelled'),
              }),
            }),
          });
        if (_0x227321['status'] === 'success')
          window['showToast']?.(midjourneyText('successToast'), 'success');
        else {
          if (_0x227321['status'] === 'failed') {
            if (_0x5d4b5b(_0x227321['error'])) window['showToast']?.('⚠️ ' + _0x22dd94, 'warn');
            else {
              const _0x32579c =
                  _0x227321['error'] instanceof Error
                    ? _0x227321['error']['message']
                    : String(_0x227321['error'] || midjourneyText('unknownError')),
                _0x3d6625 = showProviderApiKeyMissingToastForError(_0x227321['error'], {
                  providerId: 'apimart',
                  model: APIMART_MIDJOURNEY_MODEL_ID,
                  type: 'error',
                  message: midjourneyText('failedWithError', { error: _0x32579c }),
                });
              !_0x3d6625 &&
                window['showToast']?.(midjourneyText('failedWithError', { error: _0x32579c }), 'error');
            }
          } else {
            if (_0x227321['status'] === 'cancelled')
              window['showToast']?.(midjourneyText('cancelledToast'), 'info');
            else
              _0x227321['status'] === 'pending' &&
                window['showToast']?.(midjourneyText('pendingToast'), 'info');
          }
        }
      } catch (_0x1ec41d) {
        const _0x4dec81 =
            _0x1ec41d instanceof Error
              ? _0x1ec41d['message']
              : String(_0x1ec41d || midjourneyText('unknownError')),
          _0x3c0f54 = showProviderApiKeyMissingToastForError(_0x1ec41d, {
            providerId: 'apimart',
            model: APIMART_MIDJOURNEY_MODEL_ID,
            type: 'error',
            message: midjourneyText('failedWithError', { error: _0x4dec81 }),
          });
        !_0x3c0f54 && window['showToast']?.(midjourneyText('failedWithError', { error: _0x4dec81 }), 'error');
      } finally {
        ((_0x2f0b2e = ''), setBusy(_0x4b741c, ![]), _0xa7bc83());
      }
    })();
  };
  (_0x2771d7?.['addEventListener']('click', (_0x5ef3c1) => {
    (_0x5ef3c1['stopPropagation'](), _0x5ef3c1['preventDefault']());
    if (_0x2f0b2e) {
      window['showToast']?.(midjourneyText('busy'), 'info');
      return;
    }
    const _0x4a43fa = resolveApimartMidjourneyToolbarContext(_0x551d39());
    _0x4c2e4f = openVariationSubmenu(
      _0x2771d7,
      (_0x2f67e6) => {
        _0x2898d9('variation', _0x2771d7, { variationMode: _0x2f67e6 });
      },
      getApimartMidjourneyVariationOptions(_0x4a43fa['mjModel']),
    );
  }),
    _0x1fc75c?.['addEventListener']('click', (_0x2b2ef0) => {
      (_0x2b2ef0['stopPropagation'](),
        _0x2b2ef0['preventDefault'](),
        _0x4c2e4f(),
        (_0x4c2e4f = () => {}),
        _0x2898d9('hd', _0x1fc75c));
    }));
}
