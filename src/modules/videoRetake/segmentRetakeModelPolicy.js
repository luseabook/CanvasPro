import { getModelManifest, getModelsByKind } from '../../manifests/index.js';
export const SEGMENT_RETAKE_PHASE_EDITING = 'editing';
export const SEGMENT_RETAKE_PHASE_SUBMITTED = 'submitted';
function getSegmentRetakeCapability(_0x2c7d2a) {
  const _0x400407 = _0x2c7d2a?.['extensions']?.['segmentRetake'];
  return _0x400407 && typeof _0x400407 === 'object' ? _0x400407 : null;
}
function getPlainObject(_0x56d130) {
  return _0x56d130 && typeof _0x56d130 === 'object' && !Array['isArray'](_0x56d130) ? _0x56d130 : {};
}
export function getSegmentRetakeParameterPolicy(_0x2dfc9c = {}) {
  if (!_0x2dfc9c?.['segmentRetake']) return null;
  const _0x504c0e = getModelManifest(String(_0x2dfc9c?.['model'] || '')['trim']()),
    _0x434bde = getSegmentRetakeCapability(_0x504c0e),
    _0xc95da4 = _0x434bde?.['parameterPolicy'];
  return _0x434bde?.['supported'] === !![] && _0xc95da4 && typeof _0xc95da4 === 'object' ? _0xc95da4 : null;
}
function buildForcedParameterPatch(_0xf4e64) {
  const _0x3569b5 = {};
  for (const _0x36a54e of Object['values'](getPlainObject(_0xf4e64))) {
    const _0x2e1050 = String(_0x36a54e?.['fieldId'] || '')['trim']();
    if (!_0x2e1050 || !Object['prototype']['hasOwnProperty']['call'](_0x36a54e || {}, 'value')) continue;
    _0x3569b5[_0x2e1050] = _0x36a54e['value'];
  }
  return _0x3569b5;
}
function releaseSegmentRetakeParameterLocks(_0x2b59ad, _0x3129a4) {
  const _0x1c2217 = getPlainObject(_0x2b59ad?.['uiSchemaFieldState']),
    _0x5c9e64 = { ..._0x1c2217 };
  let _0x2db1ce = ![];
  for (const [_0x157e41, _0x35cec3] of Object['entries'](_0x3129a4)) {
    const _0x55feb0 = getPlainObject(_0x1c2217[_0x157e41]),
      _0x3c9e3a =
        _0x55feb0['segmentRetakeLocked'] === !![] ||
        (_0x55feb0['disabled'] === !![] &&
          Object['prototype']['hasOwnProperty']['call'](_0x55feb0, 'lockedValue') &&
          String(_0x55feb0['lockedValue']) === String(_0x35cec3));
    if (!_0x3c9e3a) continue;
    const _0x26d3ef = { ..._0x55feb0 };
    (delete _0x26d3ef['disabled'], delete _0x26d3ef['lockedValue'], delete _0x26d3ef['segmentRetakeLocked']);
    if (Object['keys'](_0x26d3ef)['length'] > 0x0) _0x5c9e64[_0x157e41] = _0x26d3ef;
    else delete _0x5c9e64[_0x157e41];
    _0x2db1ce = !![];
  }
  return _0x2db1ce ? { ..._0x2b59ad, uiSchemaFieldState: _0x5c9e64 } : _0x2b59ad;
}
export function decorateSegmentRetakeParameterNodeData(_0x28bbfe = {}) {
  const _0x2a13e2 = getSegmentRetakeParameterPolicy(_0x28bbfe);
  if (!_0x2a13e2) return _0x28bbfe;
  const _0x4d07bd = buildForcedParameterPatch(_0x2a13e2);
  if (!isSegmentRetakeEditing(_0x28bbfe)) return releaseSegmentRetakeParameterLocks(_0x28bbfe, _0x4d07bd);
  const _0x3cdf92 = getPlainObject(_0x28bbfe?.['uiSchemaFieldState']),
    _0x5240b4 = { ..._0x3cdf92 };
  for (const _0x2c64c8 of Object['keys'](_0x4d07bd)) {
    _0x5240b4[_0x2c64c8] = {
      ...getPlainObject(_0x3cdf92[_0x2c64c8]),
      disabled: !![],
      lockedValue: _0x4d07bd[_0x2c64c8],
      segmentRetakeLocked: !![],
    };
  }
  return {
    ..._0x28bbfe,
    ..._0x4d07bd,
    generationParams: { ...getPlainObject(_0x28bbfe?.['generationParams']), ..._0x4d07bd },
    uiSchemaFieldState: _0x5240b4,
  };
}
export function decorateSegmentRetakeParameterSchemaFields(_0x4d63e7 = {}, _0x281c68 = {}) {
  const _0x209329 = getSegmentRetakeParameterPolicy(_0x4d63e7);
  if (!_0x209329 || !isSegmentRetakeEditing(_0x4d63e7)) return _0x281c68;
  const _0x148b92 = new Map(
    Object['values'](_0x209329)['map']((_0x464e45) => [_0x464e45['fieldId'], _0x464e45]),
  );
  return Object['fromEntries'](
    Object['entries'](_0x281c68)['map'](([_0xaa1a4a, _0x2c6c9a]) => {
      const _0x336b1f = _0x148b92['get'](_0x2c6c9a?.['id']);
      if (!_0x336b1f) return [_0xaa1a4a, _0x2c6c9a];
      const _0x41ac47 = _0x336b1f['value'] === -0x1 || _0x336b1f['value'] === 'auto';
      return [
        _0xaa1a4a,
        {
          ..._0x2c6c9a,
          disabled: !![],
          defaultValue: _0x336b1f['value'],
          ...(_0x41ac47
            ? {
                options: [
                  { value: _0x336b1f['value'], label: 'Auto', selectedLabel: 'Auto', displayLabel: 'Auto' },
                ],
              }
            : {}),
        },
      ];
    }),
  );
}
export function applySegmentRetakeSubmitParameterPolicy(_0x2f23e0 = {}, _0x3eee3d = {}) {
  const _0x2c8022 = getSegmentRetakeParameterPolicy(_0x2f23e0);
  if (!_0x2c8022) return _0x3eee3d;
  const _0xcf7716 = buildForcedParameterPatch(_0x2c8022);
  return (
    Object['assign'](_0x3eee3d, _0xcf7716, {
      generationParams: { ...getPlainObject(_0x3eee3d?.['generationParams']), ..._0xcf7716 },
    }),
    Object['prototype']['hasOwnProperty']['call'](_0xcf7716, 'resolution') &&
      ((_0x3eee3d['videoResolution'] = _0xcf7716['resolution']),
      (_0x3eee3d['videoSize'] = _0xcf7716['resolution'])),
    _0x3eee3d
  );
}
export function isSegmentRetakeModelSupported(_0x1a98f6) {
  const _0x46b80a = getModelManifest(String(_0x1a98f6 || '')['trim']());
  return getSegmentRetakeCapability(_0x46b80a)?.['supported'] === !![];
}
export function getSegmentRetakeAllowedModelIds() {
  return getModelsByKind('video')
    ['filter']((_0x37fe4f) => getSegmentRetakeCapability(_0x37fe4f)?.['supported'] === !![])
    ['map']((_0x5c6915) => _0x5c6915['modelId']);
}
export function getSegmentRetakeAllowedModelIdsForNode(_0x987fcd = {}) {
  return _0x987fcd?.['segmentRetake'] ? getSegmentRetakeAllowedModelIds() : [];
}
export function isSegmentRetakeEditing(_0x1323b2 = {}) {
  return _0x1323b2?.['segmentRetake']?.['phase'] === SEGMENT_RETAKE_PHASE_EDITING;
}
export function buildSegmentRetakePhasePatch(_0x48945f = {}, _0x35ba44) {
  const _0x78cc27 = _0x48945f?.['segmentRetake'];
  if (!_0x78cc27) return null;
  const _0x4d8ff5 = { ..._0x78cc27, phase: _0x35ba44 },
    _0x482f08 = decorateSegmentRetakeParameterNodeData({ ..._0x48945f, segmentRetake: _0x4d8ff5 }),
    _0x3e03dd = { uiSchemaFieldState: _0x482f08['uiSchemaFieldState'], segmentRetake: { ..._0x4d8ff5 } };
  if (_0x35ba44 === SEGMENT_RETAKE_PHASE_EDITING) {
    const _0x315a72 = getSegmentRetakeParameterPolicy(_0x482f08),
      _0x5cbb38 = buildForcedParameterPatch(_0x315a72);
    Object['assign'](_0x3e03dd, _0x5cbb38, { generationParams: _0x482f08['generationParams'] });
  }
  return _0x3e03dd;
}
export function buildSegmentRetakeSessionClearPatch(_0x427fe1 = {}) {
  if (!_0x427fe1?.['segmentRetake']) return { segmentRetake: null };
  const _0x4d3c03 = buildSegmentRetakePhasePatch(_0x427fe1, SEGMENT_RETAKE_PHASE_SUBMITTED);
  return { ...(_0x4d3c03 || {}), segmentRetake: null };
}
