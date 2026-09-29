import {
  PANORAMA_CHARACTER_BONES,
  listMannequinPosePresets,
  normalizeBonePose,
} from '../../modules/panoramaSceneNode/poseCatalog.js';
import { t } from '../../i18n/index.js';
function sceneText(_0x4749c6, _0x521697 = {}) {
  return t('panoramaSceneNode.poseEditor.' + _0x4749c6, _0x521697);
}
function syncStaticText(_0x1a5de1) {
  const _0x3f3f0d = _0x1a5de1['querySelector']('.panorama-pose-panel__title');
  if (_0x3f3f0d) _0x3f3f0d['textContent'] = sceneText('title');
  const _0x5d9703 = _0x1a5de1['querySelector']('.panorama-pose-panel__preset');
  if (_0x5d9703) _0x5d9703['setAttribute']('aria-label', sceneText('presetAria'));
  const _0x4ed7e7 = _0x5d9703?.['querySelector']?.('[value=\x22custom\x22]');
  if (_0x4ed7e7) _0x4ed7e7['textContent'] = sceneText('custom');
  const _0x41e06b = _0x1a5de1['querySelector']('.panorama-pose-panel__bone');
  _0x41e06b &&
    (_0x41e06b['setAttribute']('aria-label', sceneText('boneAria')),
    Array['from'](_0x41e06b['options'])['forEach']((_0x7f585b) => {
      _0x7f585b['textContent'] = sceneText('bones.' + _0x7f585b['value']);
    }));
  const _0x2126cf = _0x1a5de1['querySelector']('.panorama-pose-panel__save');
  if (_0x2126cf) _0x2126cf['textContent'] = sceneText('saveCustom');
}
function syncCustomPoseOptions(_0x43453b, _0x1077ff) {
  const _0x443ef0 = _0x43453b['querySelector']('.panorama-pose-panel__preset');
  if (!_0x443ef0) return;
  (_0x443ef0['querySelectorAll']('[data-custom-pose-option]')['forEach']((_0x4b3eb5) =>
    _0x4b3eb5['remove'](),
  ),
    (Array['isArray'](_0x1077ff?.['customPoses']) ? _0x1077ff['customPoses'] : [])['forEach']((_0x4ea804) => {
      if (!_0x4ea804?.['id'] || _0x4ea804['id'] === 'custom') return;
      const _0x4f9229 = document['createElement']('option');
      ((_0x4f9229['value'] = _0x4ea804['id']),
        (_0x4f9229['dataset']['customPoseOption'] = '1'),
        (_0x4f9229['textContent'] = _0x4ea804['name'] || sceneText('custom')),
        _0x443ef0['appendChild'](_0x4f9229));
    }));
}
function selectedMannequin(_0x427ed8) {
  if (_0x427ed8?.['selection']?.['selectedObjectType'] !== 'mannequin') return null;
  const _0x4d4e34 = _0x427ed8['selection']['selectedObjectId'];
  return _0x427ed8['mannequins']?.['find']((_0x1f87d8) => _0x1f87d8['id'] === _0x4d4e34) || null;
}
function radiansToDegrees(_0x55b8a1) {
  return Math['round'](((Number(_0x55b8a1) || 0x0) * 0xb4) / Math['PI']);
}
function degreesToRadians(_0x3aefde) {
  return ((Number(_0x3aefde) || 0x0) * Math['PI']) / 0xb4;
}
function syncAxisControls(_0x29bc5f) {
  const _0x180afd = _0x29bc5f['querySelector']('.panorama-pose-panel__bone')?.['value'] || 'pelvis',
    _0x1e567e = _0x29bc5f['_draftBonePose']?.[_0x180afd] || { x: 0x0, y: 0x0, z: 0x0 };
  _0x29bc5f['querySelectorAll']('[data-pose-axis]')['forEach']((_0x4812e0) => {
    const _0x4300d4 = _0x4812e0['dataset']['poseAxis'];
    _0x4812e0['value'] = String(radiansToDegrees(_0x1e567e[_0x4300d4]));
    const _0x5e60ad = _0x29bc5f['querySelector']('[data-pose-value=\x22' + _0x4300d4 + '\x22]');
    if (_0x5e60ad) _0x5e60ad['textContent'] = _0x4812e0['value'] + '°';
  });
}
function updateDraftFromControl(_0x69b98, _0x2aa4a5) {
  const _0x3bdbb2 = _0x69b98['querySelector']('.panorama-pose-panel__bone')?.['value'] || 'pelvis',
    _0x2f2da3 = _0x2aa4a5['dataset']['poseAxis'],
    _0x200173 = _0x69b98['_draftBonePose']?.[_0x3bdbb2] || { x: 0x0, y: 0x0, z: 0x0 };
  _0x69b98['_draftBonePose'] = normalizeBonePose({
    ...(_0x69b98['_draftBonePose'] || {}),
    [_0x3bdbb2]: { ..._0x200173, [_0x2f2da3]: degreesToRadians(_0x2aa4a5['value']) },
  });
  const _0x3c6d4a = _0x69b98['querySelector']('[data-pose-value=\x22' + _0x2f2da3 + '\x22]');
  if (_0x3c6d4a) _0x3c6d4a['textContent'] = _0x2aa4a5['value'] + '°';
}
export function createMannequinPosePanel({
  onApplyPreset: _0x2aa830,
  onPreview: _0x416f01,
  onCommit: _0x350535,
  onSaveCustom: _0x3f0a1c,
} = {}) {
  const _0x3c9d17 = document['createElement']('div');
  ((_0x3c9d17['className'] = 'panorama-pose-panel'),
    (_0x3c9d17['dataset']['uiStop'] = '1'),
    (_0x3c9d17['_draftBonePose'] = {}));
  const _0x4e9c19 = document['createElement']('div');
  _0x4e9c19['className'] = 'panorama-pose-panel__header';
  const _0x53352c = document['createElement']('strong');
  _0x53352c['className'] = 'panorama-pose-panel__title';
  const _0x4de5cc = document['createElement']('select');
  ((_0x4de5cc['className'] = 'panorama-pose-panel__preset'),
    _0x4de5cc['append'](
      ...listMannequinPosePresets()['map']((_0x5e76dc) => {
        const _0x3df5e1 = document['createElement']('option');
        return (
          (_0x3df5e1['value'] = _0x5e76dc['id']),
          (_0x3df5e1['textContent'] = _0x5e76dc['name']),
          _0x3df5e1
        );
      }),
    ));
  const _0x3787bf = document['createElement']('option');
  ((_0x3787bf['value'] = 'custom'),
    _0x4de5cc['appendChild'](_0x3787bf),
    _0x4e9c19['append'](_0x53352c, _0x4de5cc));
  const _0x1ad182 = document['createElement']('div');
  _0x1ad182['className'] = 'panorama-pose-panel__bone-row';
  const _0x409238 = document['createElement']('select');
  ((_0x409238['className'] = 'panorama-pose-panel__bone'),
    _0x409238['append'](
      ...PANORAMA_CHARACTER_BONES['map']((_0x4ff734) => {
        const _0x4b8691 = document['createElement']('option');
        return ((_0x4b8691['value'] = _0x4ff734), _0x4b8691);
      }),
    ),
    (_0x409238['value'] = 'pelvis'),
    _0x1ad182['appendChild'](_0x409238));
  const _0x1545ba = document['createElement']('div');
  ((_0x1545ba['className'] = 'panorama-pose-panel__sliders'),
    ['x', 'y', 'z']['forEach']((_0x292fd5) => {
      const _0x262305 = document['createElement']('label');
      _0x262305['className'] = 'panorama-pose-panel__axis';
      const _0x24440f = document['createElement']('span');
      _0x24440f['textContent'] = _0x292fd5['toUpperCase']();
      const _0x1b7a15 = document['createElement']('input');
      ((_0x1b7a15['type'] = 'range'),
        (_0x1b7a15['min'] = '-180'),
        (_0x1b7a15['max'] = '180'),
        (_0x1b7a15['step'] = '1'),
        (_0x1b7a15['value'] = '0'),
        (_0x1b7a15['dataset']['poseAxis'] = _0x292fd5));
      const _0x3064dd = document['createElement']('output');
      ((_0x3064dd['dataset']['poseValue'] = _0x292fd5),
        (_0x3064dd['textContent'] = '0°'),
        _0x262305['append'](_0x24440f, _0x1b7a15, _0x3064dd),
        _0x1545ba['appendChild'](_0x262305));
    }));
  const _0x43f0a7 = document['createElement']('button');
  return (
    (_0x43f0a7['type'] = 'button'),
    (_0x43f0a7['className'] = 'panorama-pose-panel__save'),
    _0x3c9d17['append'](_0x4e9c19, _0x1ad182, _0x1545ba, _0x43f0a7),
    _0x4de5cc['addEventListener']('change', () => {
      if (_0x4de5cc['value'] === 'custom') return;
      _0x2aa830?.(_0x4de5cc['value']);
    }),
    _0x409238['addEventListener']('change', () => syncAxisControls(_0x3c9d17)),
    _0x1545ba['addEventListener']('input', (_0x176a35) => {
      const _0x4f6c7a = _0x176a35['target']?.['closest']?.('[data-pose-axis]');
      if (!_0x4f6c7a) return;
      (updateDraftFromControl(_0x3c9d17, _0x4f6c7a), _0x416f01?.(_0x3c9d17['_draftBonePose']));
    }),
    _0x1545ba['addEventListener']('change', (_0x467447) => {
      const _0x30133e = _0x467447['target']?.['closest']?.('[data-pose-axis]');
      if (!_0x30133e) return;
      (updateDraftFromControl(_0x3c9d17, _0x30133e), _0x350535?.(_0x3c9d17['_draftBonePose']));
    }),
    _0x43f0a7['addEventListener']('click', () => {
      _0x3f0a1c?.({
        name: sceneText('customName', { suffix: Date['now']()['toString']()['slice'](-0x4) }),
        bones: _0x3c9d17['_draftBonePose'],
      });
    }),
    syncStaticText(_0x3c9d17),
    _0x3c9d17
  );
}
export function renderMannequinPosePanel(_0x37cf1e, _0x218a07) {
  if (!_0x37cf1e) return;
  (syncStaticText(_0x37cf1e), syncCustomPoseOptions(_0x37cf1e, _0x218a07));
  const _0x2df7c1 = selectedMannequin(_0x218a07);
  ((_0x37cf1e['dataset']['mannequinId'] = _0x2df7c1?.['id'] || ''),
    _0x37cf1e['classList']['toggle']('is-disabled', !_0x2df7c1),
    _0x37cf1e['querySelectorAll']('select, input, button')['forEach']((_0xf3ac6f) => {
      _0xf3ac6f['disabled'] = !_0x2df7c1;
    }));
  if (!_0x2df7c1) return;
  _0x37cf1e['_draftBonePose'] = normalizeBonePose(_0x2df7c1['bonePose']);
  const _0x192ac6 = _0x37cf1e['querySelector']('.panorama-pose-panel__preset');
  if (_0x192ac6) {
    const _0x51ab51 =
      _0x2df7c1['poseId'] === 'custom' && _0x2df7c1['customPoseId']
        ? _0x2df7c1['customPoseId']
        : _0x2df7c1['poseId'] || 'neutral';
    _0x192ac6['value'] = Array['from'](_0x192ac6['options'])['some'](
      (_0x33030e) => _0x33030e['value'] === _0x51ab51,
    )
      ? _0x51ab51
      : 'custom';
  }
  syncAxisControls(_0x37cf1e);
}
