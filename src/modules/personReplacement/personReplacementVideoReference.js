import {
  PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE,
  PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_REPLACEMENT_IMAGE,
  getPersonReplacementActiveImageResultIndex,
  getPersonReplacementImageResults,
  resolvePersonReplacementImageResultRef,
  resolvePersonReplacementVideoImageInput,
} from './personReplacementProject.js';
function normalizeText(_0x278a53) {
  return String(_0x278a53 ?? '')['trim']();
}
function getShot(_0x7ccf3c, _0x5f5123) {
  const _0x24f186 = normalizeText(_0x5f5123);
  return (
    (Array['isArray'](_0x7ccf3c?.['shots']) ? _0x7ccf3c['shots'] : [])['find'](
      (_0x2706f3) => normalizeText(_0x2706f3?.['id']) === _0x24f186,
    ) || null
  );
}
function updateSourceImageResult(_0x42124b, _0x5c4dee, _0x4be8a4) {
  const _0x5c9694 = _0x5c4dee[_0x4be8a4],
    _0x3d01b2 = resolvePersonReplacementImageResultRef(_0x5c9694);
  if (!_0x42124b || !_0x3d01b2) return null;
  const _0xf30d8a = Object['prototype']['hasOwnProperty']['call'](_0x5c9694, 'userPrompt');
  return {
    ..._0x42124b,
    replacementImage: {
      ...(_0x42124b['replacementImage'] || {}),
      results: _0x5c4dee,
      activeIndex: _0x4be8a4,
    },
    replacementImageRef: _0x3d01b2,
    ...(_0xf30d8a ? { imagePrompt: normalizeText(_0x5c9694?.['userPrompt']) } : {}),
  };
}
export function selectPersonReplacementVideoReference(
  _0x3b8b08 = {},
  {
    targetShotId: _0x77ad80,
    sourceShotId: _0x10babf,
    resultIndex: _0x1d02ec,
    referencePersonId: _0x2aa6b5,
    referenceKind: referenceKind = PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_REPLACEMENT_IMAGE,
  } = {},
) {
  const _0x46591e = normalizeText(_0x77ad80),
    _0x5e5c67 = normalizeText(_0x10babf),
    _0xde36a9 = getShot(_0x3b8b08, _0x46591e);
  if (!_0xde36a9) return { changed: ![], project: _0x3b8b08 };
  if (referenceKind === PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE) {
    const _0x343395 =
        resolvePersonReplacementVideoImageInput(_0x3b8b08, _0xde36a9, 'character-reference')[
          'referenceOptions'
        ]?.['filter'](
          (_0x1b0a8c) => _0x1b0a8c?.['kind'] === PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE,
        ) || [],
      _0x43d55b = normalizeText(_0x2aa6b5),
      _0xc3dcd6 =
        _0x343395['find'](
          (_0x3a2a12) => normalizeText(_0x3a2a12?.['reference']?.['personId']) === _0x43d55b,
        ) || (!_0x43d55b ? _0x343395[0x0] : null),
      _0x19bc88 = normalizeText(_0xc3dcd6?.['reference']?.['personId']);
    if (!_0xc3dcd6 || !_0x19bc88) return { changed: ![], project: _0x3b8b08 };
    if (
      _0xde36a9['replacementVideoReferenceKind'] ===
        PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE &&
      normalizeText(_0xde36a9['replacementVideoReferencePersonId']) === _0x19bc88
    )
      return { changed: ![], project: _0x3b8b08 };
    return {
      changed: !![],
      project: {
        ..._0x3b8b08,
        shots: _0x3b8b08['shots']['map']((_0x465d69) =>
          normalizeText(_0x465d69?.['id']) === _0x46591e
            ? {
                ..._0x465d69,
                replacementVideoReferenceKind: PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE,
                replacementVideoReferencePersonId: _0x19bc88,
              }
            : _0x465d69,
        ),
      },
    };
  }
  const _0xdede4c = getShot(_0x3b8b08, _0x5e5c67),
    _0x11df38 = getPersonReplacementImageResults(_0xdede4c),
    _0x31f59c = Math['trunc'](Number(_0x1d02ec));
  if (!_0xdede4c || !Number['isInteger'](_0x31f59c) || _0x31f59c < 0x0 || _0x31f59c >= _0x11df38['length'])
    return { changed: ![], project: _0x3b8b08 };
  const _0x12885a = updateSourceImageResult(_0xdede4c, _0x11df38, _0x31f59c),
    _0x475008 = normalizeText(_0x12885a?.['replacementImageRef']);
  if (!_0x12885a || !_0x475008) return { changed: ![], project: _0x3b8b08 };
  const _0x16ffd0 =
    _0xde36a9['replacementVideoReferenceKind'] ===
      PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_REPLACEMENT_IMAGE &&
    normalizeText(_0xde36a9['replacementVideoReferenceSourceShotId']) === _0x5e5c67 &&
    normalizeText(_0xde36a9['replacementVideoReferenceImageRef']) === _0x475008 &&
    getPersonReplacementActiveImageResultIndex(_0xdede4c, _0x11df38) === _0x31f59c;
  if (_0x16ffd0) return { changed: ![], project: _0x3b8b08 };
  return {
    changed: !![],
    sourceShotId: _0x5e5c67,
    resultIndex: _0x31f59c,
    imageRef: _0x475008,
    project: {
      ..._0x3b8b08,
      shots: _0x3b8b08['shots']['map']((_0x32bce4) => {
        const _0x3b1ef1 = normalizeText(_0x32bce4?.['id']);
        let _0x5d4cf5 = _0x3b1ef1 === _0x5e5c67 ? _0x12885a : _0x32bce4;
        if (_0x3b1ef1 === _0x46591e) {
          const { replacementVideoReferencePersonId: _0x164ab0, ..._0x56e543 } = _0x5d4cf5;
          _0x5d4cf5 = {
            ..._0x56e543,
            replacementVideoReferenceKind: PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_REPLACEMENT_IMAGE,
            replacementVideoReferenceSourceShotId: _0x5e5c67,
            replacementVideoReferenceImageRef: _0x475008,
          };
        }
        return _0x5d4cf5;
      }),
    },
  };
}
export function switchPersonReplacementVideoReferenceResult(
  _0x2697f0 = {},
  { targetShotId: _0x582ad2, sourceShotId: _0x18c3aa, currentResultIndex: _0x33f891, delta: _0x1322bb } = {},
) {
  const _0x2f53bf = normalizeText(_0x582ad2),
    _0x3bb60f = normalizeText(_0x18c3aa),
    _0x378bd1 = getShot(_0x2697f0, _0x2f53bf),
    _0x4ce06d = getShot(_0x2697f0, _0x3bb60f),
    _0x33d6d8 = getPersonReplacementImageResults(_0x4ce06d);
  if (!_0x378bd1 || !_0x4ce06d || _0x33d6d8['length'] < 0x2) return { changed: ![], project: _0x2697f0 };
  const _0x4b0b20 = Math['trunc'](Number(_0x33f891)),
    _0x49b8ca =
      Number['isInteger'](_0x4b0b20) && _0x4b0b20 >= 0x0 && _0x4b0b20 < _0x33d6d8['length']
        ? _0x4b0b20
        : getPersonReplacementActiveImageResultIndex(_0x4ce06d, _0x33d6d8),
    _0x4d6609 = Math['sign'](Number(_0x1322bb) || 0x0);
  if (!_0x4d6609) return { changed: ![], project: _0x2697f0 };
  const _0xec5dff = (_0x49b8ca + _0x4d6609 + _0x33d6d8['length']) % _0x33d6d8['length'],
    _0x434a65 = resolvePersonReplacementVideoImageInput(_0x2697f0, _0x378bd1, 'first-frame'),
    _0x198f83 = _0x434a65['referenceOptions']?.[_0x434a65['activeReferenceIndex']],
    _0x2dc4b0 =
      _0x378bd1['replacementVideoReferenceKind'] !==
        PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE &&
      normalizeText(_0x198f83?.['sourceShotId']) === _0x3bb60f;
  if (_0x2dc4b0)
    return selectPersonReplacementVideoReference(_0x2697f0, {
      targetShotId: _0x2f53bf,
      sourceShotId: _0x3bb60f,
      resultIndex: _0xec5dff,
    });
  const _0x1b1342 = updateSourceImageResult(_0x4ce06d, _0x33d6d8, _0xec5dff);
  if (!_0x1b1342) return { changed: ![], project: _0x2697f0 };
  return {
    changed: !![],
    sourceShotId: _0x3bb60f,
    resultIndex: _0xec5dff,
    imageRef: _0x1b1342['replacementImageRef'],
    project: {
      ..._0x2697f0,
      shots: _0x2697f0['shots']['map']((_0x3139b5) =>
        normalizeText(_0x3139b5?.['id']) === _0x3bb60f ? _0x1b1342 : _0x3139b5,
      ),
    },
  };
}
