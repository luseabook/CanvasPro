import {
  getPersonReplacementCharacterBaseImageRef,
  normalizePersonReplacementScope,
  normalizePersonReplacementProject,
  normalizePersonReplacementShot,
  resolvePersonReplacementImageSourceRef,
} from './personReplacementProject.js';
import { PERSON_REPLACEMENT_ORIENTATION_ENABLED } from './personReplacementCapabilities.js';
import { buildPersonReplacementLocationGuideSvg } from './personReplacementLocationGuideSvg.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import { resolvePersonReplacementPromptLabel } from './personReplacementPromptIdentity.js';
import {
  buildPersonReplacementPositioningPrompt,
  describePersonReplacementBoxPosition,
  getPersonReplacementPromptMarker,
  PERSON_REPLACEMENT_PROMPT_MODE_POSITIONING,
  PERSON_REPLACEMENT_PROMPT_MODE_MANUAL,
  PERSON_REPLACEMENT_PROMPT_MODE_TEST,
} from './personReplacementPromptMode.js';
function normalizeText(_0x51747a) {
  return String(_0x51747a ?? '')['trim']();
}
function comparePeopleByPosition(_0xfcbbc, _0x3c3b87) {
  const _0x2860ef = { left: 0x0, center: 0x1, right: 0x2, unknown: 0x3 },
    _0x2afaf0 = _0xfcbbc['locator']?.['bbox'],
    _0x1acd87 = _0x3c3b87['locator']?.['bbox'],
    _0x73900f = _0x2afaf0 ? _0x2afaf0['x'] + _0x2afaf0['width'] / 0x2 : Number['POSITIVE_INFINITY'],
    _0xd16808 = _0x1acd87 ? _0x1acd87['x'] + _0x1acd87['width'] / 0x2 : Number['POSITIVE_INFINITY'];
  if (_0x73900f !== _0xd16808) return _0x73900f - _0xd16808;
  const _0x226005 =
    (_0x2860ef[_0xfcbbc['locator']?.['horizontal']] ?? 0x3) -
    (_0x2860ef[_0x3c3b87['locator']?.['horizontal']] ?? 0x3);
  if (_0x226005) return _0x226005;
  return _0xfcbbc['id']['localeCompare'](_0x3c3b87['id'], 'zh-CN');
}
function normalizeCompilerInput(_0x3f5c74 = {}) {
  const _0x57f188 = normalizePersonReplacementProject(
      _0x3f5c74['project'] || {
        characters: _0x3f5c74['characters'] || _0x3f5c74['targetCharacters'],
        mappings: _0x3f5c74['mappings'],
      },
    ),
    _0x500ef3 = normalizePersonReplacementShot(_0x3f5c74['shot'] || {}, 0x0);
  return { project: _0x57f188, shot: _0x500ef3 };
}
function getTargetCharacterId(_0x338738, _0x910388) {
  const _0x2f79d9 = normalizeText(_0x338738['targetCharacterId']);
  if (_0x2f79d9) return _0x2f79d9;
  if (_0x338738['projectMappingDisabled'] === !![]) return '';
  return _0x910388['get'](normalizeText(_0x338738['sourceCharacterId'])) || '';
}
function getTargetAppearanceImageRef(_0x33bcbf, _0x534206 = '') {
  const _0x139ed5 = Array['isArray'](_0x33bcbf?.['appearances']) ? _0x33bcbf['appearances'] : [],
    _0x189c66 = _0x139ed5['find'](
      (_0x4dcf0e) => normalizeText(_0x4dcf0e?.['id']) === normalizeText(_0x534206),
    );
  return normalizeText(_0x189c66?.['imageUrl']) || getPersonReplacementCharacterBaseImageRef(_0x33bcbf);
}
function resolveSceneReference(_0x4169ce, _0x325ec4) {
  const _0x24ee3b = normalizeText(_0x325ec4['sceneReference']?.['sceneId']);
  if (!_0x24ee3b) return null;
  const _0x437657 = _0x4169ce['scenes']['find']((_0x474062) => _0x474062['id'] === _0x24ee3b);
  if (!_0x437657) return { sceneId: _0x24ee3b, scene: null, imageRef: '' };
  return {
    sceneId: _0x24ee3b,
    scene: _0x437657,
    appearanceId: normalizeText(_0x325ec4['sceneReference']?.['appearanceId']),
    imageRef: getTargetAppearanceImageRef(_0x437657, _0x325ec4['sceneReference']?.['appearanceId']),
  };
}
function getPersonBoundingBox(_0x136ec4 = {}) {
  return _0x136ec4['locator']?.['bbox'] || _0x136ec4['bbox'] || null;
}
export function isPersonReplacementSceneOnlyPromptPackage(_0x5a70e9 = {}) {
  return Number(_0x5a70e9['sceneReferenceSlot']) > 0x0 && !_0x5a70e9['mappedPersonIds']?.['length'];
}
export function buildPersonReplacementPromptPackage(_0x3e7947 = {}) {
  const { project: _0x58ede5, shot: _0x43552a } = normalizeCompilerInput(_0x3e7947),
    _0x31df1e = _0x43552a['replacementPromptMode'] === PERSON_REPLACEMENT_PROMPT_MODE_MANUAL,
    _0x39e553 = _0x43552a['replacementPromptMode'] === PERSON_REPLACEMENT_PROMPT_MODE_TEST,
    _0x2157ee =
      _0x39e553 || _0x43552a['replacementPromptMode'] === PERSON_REPLACEMENT_PROMPT_MODE_POSITIONING,
    _0x5df32a = new Map(
      _0x58ede5['mappings']['map']((_0x585c13) => [
        _0x585c13['sourceCharacterId'],
        _0x585c13['targetCharacterId'],
      ]),
    ),
    _0x4b2c1c = new Map(_0x58ede5['characters']['map']((_0x1263c2) => [_0x1263c2['id'], _0x1263c2])),
    _0x1253b8 = [..._0x43552a['people']]['sort'](
      (_0x533244, _0x4d62c4) => _0x533244['promptMarkerIndex'] - _0x4d62c4['promptMarkerIndex'],
    ),
    _0x21e632 = _0x2157ee
      ? _0x1253b8['filter']((_0x52087d) => getTargetCharacterId(_0x52087d, _0x5df32a))
      : _0x1253b8,
    _0x4246d2 = _0x31df1e
      ? []
      : _0x21e632['filter']((_0x470c82) => !getPersonBoundingBox(_0x470c82))['map'](
          (_0xec0f6e) => _0xec0f6e['id'],
        ),
    _0x33ec64 =
      !_0x31df1e && PERSON_REPLACEMENT_ORIENTATION_ENABLED
        ? _0x21e632['filter']((_0x179c0b) => normalizeText(_0x179c0b['orientation']) === 'unknown')['map'](
            (_0x431a4e) => _0x431a4e['id'],
          )
        : [],
    _0x32b498 = [],
    _0x53f368 = new Map(),
    _0x38381a = (_0x24c529) => {
      const _0x27e2d6 =
          (_0x39e553 && _0x24c529['role'] === 'source-keyframe' ? 'annotated:' : '') +
          (localPathToUrl(_0x24c529['ref']) || _0x24c529['ref']),
        _0x27ed27 = _0x53f368['get'](_0x27e2d6);
      if (_0x27ed27)
        return {
          ..._0x24c529,
          ref: _0x27ed27['ref'],
          slot: _0x27ed27['slot'],
          label: '图' + _0x27ed27['slot'],
        };
      const _0x4681dc = _0x32b498['length'] + 0x1,
        _0x3844ee = { ..._0x24c529, slot: _0x4681dc, label: _0x24c529['label'] || '图' + _0x4681dc };
      return (_0x53f368['set'](_0x27e2d6, _0x3844ee), _0x32b498['push'](_0x3844ee), _0x3844ee);
    },
    _0x1e900b = resolvePersonReplacementImageSourceRef(_0x43552a);
  if (_0x1e900b) _0x38381a({ slot: 0x1, label: '图像1', ref: _0x1e900b, role: 'source-keyframe' });
  const _0x25549e = new Map(),
    _0x103f39 = [],
    _0x33df06 = [],
    _0x397b60 = [],
    _0x2b19d6 = [];
  _0x1253b8['forEach']((_0x4ebbc1) => {
    if (!_0x31df1e && !getPersonBoundingBox(_0x4ebbc1)) return;
    const _0x213fcb = getTargetCharacterId(_0x4ebbc1, _0x5df32a);
    if (!_0x213fcb) {
      if (!_0x31df1e && !_0x2157ee) _0x33df06['push'](_0x4ebbc1['id']);
      return;
    }
    const _0x4c33ea = _0x4b2c1c['get'](_0x213fcb),
      _0x4e1369 = getTargetAppearanceImageRef(_0x4c33ea, _0x4ebbc1['targetAppearanceId']);
    if (!_0x4c33ea || !_0x4e1369) {
      !_0x31df1e &&
        (_0x33df06['push'](_0x4ebbc1['id']),
        _0x2b19d6['push'](
          !_0x4c33ea
            ? '未找到目标角色：' + _0x213fcb
            : '目标角色缺少参考图：' + (_0x4c33ea['name'] || _0x213fcb),
        ));
      return;
    }
    const _0x124861 = _0x213fcb + ':' + normalizeText(_0x4ebbc1['targetAppearanceId']);
    if (!_0x25549e['has'](_0x124861)) {
      if (!_0x31df1e && _0x25549e['size'] >= 0x8) {
        _0x397b60['push'](_0x4ebbc1['id']);
        return;
      }
      const _0x17c236 = _0x38381a({
        ref: _0x4e1369,
        role: 'target-character',
        targetCharacterId: _0x213fcb,
        targetAppearanceId: normalizeText(_0x4ebbc1['targetAppearanceId']),
      });
      _0x25549e['set'](_0x124861, _0x17c236);
    }
    _0x103f39['push']({
      person: _0x4ebbc1,
      sourceLabel: resolvePersonReplacementPromptLabel(_0x4ebbc1),
      reference: _0x25549e['get'](_0x124861),
      scopeRequirement: { scope: normalizePersonReplacementScope(_0x4ebbc1['replacementScope']) },
    });
  });
  if (_0x397b60['length']) _0x2b19d6['push']('单次最多替换 8 个目标人物');
  const _0x4adc63 =
      _0x39e553 && _0x103f39['length'] && _0x1e900b
        ? {
            sourceRef: _0x1e900b,
            people: _0x103f39['map'](
              ({ person: _0x587e0a, sourceLabel: _0x3839f7, reference: _0x3592fe }) => ({
                label: _0x3839f7['replace']('人物', ''),
                referenceSlot: _0x3592fe['slot'],
                markerIndex: _0x587e0a['promptMarkerIndex'],
                bbox: getPersonBoundingBox(_0x587e0a),
              }),
            ),
          }
        : null,
    _0x33527e =
      _0x2157ee && !_0x39e553 && _0x103f39['length'] && _0x1e900b
        ? {
            frame: _0x43552a['frame'],
            people: _0x103f39['map'](({ person: _0x229271, sourceLabel: _0x442c57 }) => ({
              label: _0x442c57['replace']('人物', ''),
              markerIndex: _0x229271['promptMarkerIndex'],
              bbox: getPersonBoundingBox(_0x229271),
            })),
          }
        : null,
    _0x4bd896 = _0x33527e ? _0x32b498['length'] + 0x1 : 0x0;
  if (_0x33527e)
    _0x38381a({
      slot: _0x4bd896,
      label: '图' + _0x4bd896,
      role: 'person-location-guide',
      ref: buildPersonReplacementLocationGuideSvg(_0x33527e)['dataUrl'],
    });
  const _0xdce592 = resolveSceneReference(_0x58ede5, _0x43552a);
  let _0x1f02af = 0x0;
  if (_0xdce592?.['scene'] && _0xdce592['imageRef'])
    _0x1f02af = _0x38381a({
      ref: _0xdce592['imageRef'],
      role: 'target-scene',
      targetSceneId: _0xdce592['sceneId'],
      targetSceneAppearanceId: _0xdce592['appearanceId'],
    })['slot'];
  else
    _0xdce592?.['sceneId'] &&
      !_0x31df1e &&
      _0x2b19d6['push'](
        _0xdce592['scene']
          ? '场景缺少参考图：' + _0xdce592['scene']['name']
          : '未找到场景：' + _0xdce592['sceneId'],
      );
  const _0x5e1232 = _0x1253b8['filter'](getPersonBoundingBox)['sort'](comparePeopleByPosition),
    _0x214739 = new Map(_0x103f39['map']((_0x41de41) => [_0x41de41['person']['id'], _0x41de41])),
    _0x327d39 = _0x31df1e
      ? []
      : _0x5e1232['map']((_0x1094ba, _0x5e85d3) => {
          const _0x5a4f80 = _0x214739['get'](_0x1094ba['id']),
            _0x212f49 = getPersonReplacementPromptMarker(
              _0x43552a['replacementPromptMode'],
              _0x2157ee ? _0x1094ba['promptMarkerIndex'] : _0x5e85d3,
              _0x5e1232['length'],
              _0x5a4f80?.['reference']['slot'],
            );
          _0x2157ee &&
            ((_0x212f49['label'] = resolvePersonReplacementPromptLabel(_0x1094ba)['replace']('人物', '')),
            (_0x212f49['position'] = describePersonReplacementBoxPosition(_0x1094ba, _0x5e1232)));
          if (_0x5a4f80) _0x5a4f80['marker'] = _0x212f49;
          return { ..._0x212f49, personId: _0x1094ba['id'], bbox: getPersonBoundingBox(_0x1094ba) };
        }),
    _0x72a669 = _0x31df1e
      ? ''
      : _0x103f39['length']
        ? buildPersonReplacementPositioningPrompt(
            _0x103f39,
            _0x1f02af,
            _0x43552a['replacementPromptMode'],
            _0x4bd896,
          )
        : [
            '图1是待修改的原图，保持人物和构图。',
            _0x1f02af ? '仅将背景替换为图' + _0x1f02af + '中的场景，不引用其中人物。' : '',
          ]
            ['filter'](Boolean)
            ['join']('\x0a');
  return {
    promptMode: _0x43552a['replacementPromptMode'],
    locationGuide: _0x33527e,
    annotatedSource: _0x4adc63,
    personMarkers: _0x327d39,
    prompt: _0x72a669,
    bindingPrompt: _0x72a669,
    guidedBindingPrompt: _0x72a669,
    bindings: _0x103f39['map'](
      ({
        person: _0x27b988,
        sourceLabel: _0xb89742,
        reference: _0x26abe3,
        scopeRequirement: _0x2d416d,
        marker: _0x5ef911,
      }) => ({
        bbox: getPersonBoundingBox(_0x27b988),
        label: _0xb89742,
        personId: _0x27b988['id'],
        markerLabel: _0x5ef911?.['label'] || '',
        referenceLabel: _0x26abe3['label'],
        referenceSlot: _0x26abe3['slot'],
        replacementScope: _0x2d416d['scope'],
        sourceCharacterId: _0x27b988['sourceCharacterId'],
        targetAppearanceId: _0x26abe3['targetAppearanceId'],
        targetCharacterId: _0x26abe3['targetCharacterId'],
      }),
    ),
    referenceImages: _0x32b498,
    mappedPersonIds: _0x103f39['map'](({ person: _0x13302e }) => _0x13302e['id']),
    activePersonIds: _0x31df1e ? [] : _0x21e632['map']((_0x1312c8) => _0x1312c8['id']),
    preservedPersonIds: _0x2157ee
      ? _0x1253b8['filter']((_0x4860ef) => !getTargetCharacterId(_0x4860ef, _0x5df32a))['map'](
          (_0x122d9d) => _0x122d9d['id'],
        )
      : [],
    unmappedPersonIds: _0x33df06,
    missingLocatorPersonIds: _0x4246d2,
    unresolvedOrientationPersonIds: _0x33ec64,
    overflowPersonIds: _0x397b60,
    locationGuideSlot: _0x4bd896,
    sceneReferenceSlot: _0x1f02af,
    warnings: _0x2b19d6,
  };
}
export function compilePersonReplacementPrompt(_0x40f67f = {}) {
  return buildPersonReplacementPromptPackage(_0x40f67f)['prompt'];
}
