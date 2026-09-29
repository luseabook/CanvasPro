import {
  getPersonReplacementActiveImageResultIndex,
  getPersonReplacementActiveVideoResultIndex,
  getPersonReplacementImageResults,
  getPersonReplacementVideoResults,
  resolvePersonReplacementImageResultRef,
  resolvePersonReplacementImageSourceRef,
  resolvePersonReplacementVideoImageInput,
  resolvePersonReplacementVideoResultRef,
} from './personReplacementProject.js';
import { reconcilePersonReplacementShotGenerationState } from './personReplacementShotMapping.js';
import { setPersonReplacementImageResultAsReference } from './personReplacementImageIteration.js';
import { setPersonReplacementVideoResultAsReference } from './personReplacementVideoIteration.js';
import {
  selectPersonReplacementVideoReference,
  switchPersonReplacementVideoReferenceResult,
} from './personReplacementVideoReference.js';
import {
  PERSON_REPLACEMENT_OUTPUT_TRANSITIONS,
  transitionPersonReplacementOutput,
} from './personReplacementOutputLineage.js';
function normalizeText(_0x451105) {
  return String(_0x451105 ?? '')['trim']();
}
export function createPersonReplacementResultSelectionController({
  getProject: _0x45b5d4,
  updateProject: _0x22b1e1,
  getShotSwitchDirection: _0x52ce94,
  captureImagePreviewSlide: _0x74731d,
  captureMiddlePreviewSlide: _0x15b0bc,
  captureVideoResultSlide: _0x4c1c28,
  playImagePreviewTransition: _0x3e5a27,
  playMiddlePreviewTransition: _0x555b4e,
  playVideoResultTransition: _0x4d5058,
  scrollShotCardIntoView: _0x2ba24e,
  captureResultHistoryMenu: captureResultHistoryMenu = () => null,
  restoreResultHistoryMenu: restoreResultHistoryMenu = () => {},
  windowObject: windowObject = globalThis['window'] || globalThis,
} = {}) {
  if (
    typeof _0x45b5d4 !== 'function' ||
    typeof _0x22b1e1 !== 'function' ||
    typeof _0x52ce94 !== 'function' ||
    typeof _0x74731d !== 'function' ||
    typeof _0x15b0bc !== 'function' ||
    typeof _0x4c1c28 !== 'function' ||
    typeof _0x3e5a27 !== 'function' ||
    typeof _0x555b4e !== 'function' ||
    typeof _0x4d5058 !== 'function' ||
    typeof _0x2ba24e !== 'function'
  )
    throw new TypeError('Person replacement result selection requires project and presentation adapters.');
  const _0x142100 = (_0x2a03a3, _0x28a27b = !![]) =>
      _0x28a27b
        ? transitionPersonReplacementOutput(_0x2a03a3, {
            type: PERSON_REPLACEMENT_OUTPUT_TRANSITIONS['INVALIDATE'],
          })
        : _0x2a03a3,
    _0x4a0ad2 = (_0x2f433d, _0x928b11, { selectShot: _0x3796cc = !![], direction: direction = '' } = {}) => {
      const _0x1a984f = _0x45b5d4(),
        _0x379eed = normalizeText(_0x2f433d),
        _0x66d01a = _0x1a984f['shots']['find']((_0x210fa1) => _0x210fa1['id'] === _0x379eed),
        _0x390927 = getPersonReplacementImageResults(_0x66d01a);
      if (!_0x66d01a || !_0x390927['length']) return ![];
      const _0x418af0 = getPersonReplacementActiveImageResultIndex(_0x66d01a, _0x390927),
        _0x39b974 = Math['max'](
          0x0,
          Math['min'](_0x390927['length'] - 0x1, Math['trunc'](Number(_0x928b11) || 0x0)),
        ),
        _0x310d5f = Object['prototype']['hasOwnProperty']['call'](_0x390927[_0x39b974], 'userPrompt'),
        _0x54b6d5 = normalizeText(_0x390927[_0x39b974]?.['userPrompt']),
        _0x5f31f1 = Boolean(_0x310d5f && _0x54b6d5 !== normalizeText(_0x66d01a['imagePrompt']));
      if (
        _0x39b974 === _0x418af0 &&
        (!_0x3796cc || _0x379eed === normalizeText(_0x1a984f['workspace']['selectedShotId'])) &&
        !_0x5f31f1
      )
        return ![];
      const _0x33fcaf = _0x3796cc && _0x379eed !== normalizeText(_0x1a984f['workspace']['selectedShotId']),
        _0x1b423d =
          direction || (_0x33fcaf ? _0x52ce94(_0x379eed) : _0x39b974 > _0x418af0 ? 'next' : 'previous'),
        _0x2dcbc1 = _0x74731d(),
        _0x1e1db2 = resolvePersonReplacementImageResultRef(_0x390927[_0x39b974]);
      (_0x22b1e1(
        {
          ..._0x1a984f,
          shots: _0x1a984f['shots']['map']((_0x398fc1) =>
            _0x398fc1['id'] === _0x379eed
              ? {
                  ..._0x398fc1,
                  replacementImage: {
                    ...(_0x398fc1['replacementImage'] || {}),
                    results: _0x390927,
                    activeIndex: _0x39b974,
                  },
                  replacementImageRef: _0x1e1db2,
                  ...(_0x310d5f ? { imagePrompt: _0x54b6d5 } : {}),
                }
              : _0x398fc1,
          ),
          workspace: {
            ..._0x1a984f['workspace'],
            selectedShotId: _0x3796cc ? _0x379eed : _0x1a984f['workspace']['selectedShotId'],
          },
        },
        'replacement-image-result',
      ),
        _0x3e5a27(_0x1b423d || 'next', _0x2dcbc1));
      if (_0x3796cc) _0x2ba24e(_0x379eed);
      return !![];
    },
    _0x726550 = (_0x423dd6, _0x492a25, _0x383670 = {}) => {
      const _0x1d741f = _0x45b5d4(),
        _0x4e578b = normalizeText(_0x492a25 ?? _0x1d741f['workspace']['selectedShotId']),
        _0x5b304c = _0x1d741f['shots']['find']((_0x4bb144) => _0x4bb144['id'] === _0x4e578b),
        _0x5223e6 = getPersonReplacementImageResults(_0x5b304c);
      if (!_0x5b304c || _0x5223e6['length'] < 0x2) return ![];
      const _0x4c39d4 = getPersonReplacementActiveImageResultIndex(_0x5b304c, _0x5223e6),
        _0x2d76c7 =
          (_0x4c39d4 + Math['sign'](Number(_0x423dd6) || 0x0) + _0x5223e6['length']) % _0x5223e6['length'];
      return _0x4a0ad2(_0x4e578b, _0x2d76c7, {
        ..._0x383670,
        direction: Math['sign'](Number(_0x423dd6) || 0x0) < 0x0 ? 'previous' : 'next',
      });
    },
    _0x53bd01 = (_0x3db603, _0x5632dd) => {
      const _0x31957c = _0x45b5d4(),
        _0x81bd9c = normalizeText(_0x3db603),
        _0x242776 = _0x31957c['shots']['find']((_0x2c58d7) => _0x2c58d7['id'] === _0x81bd9c),
        _0x1b9bbd = getPersonReplacementImageResults(_0x242776),
        _0x4c56d8 = Math['trunc'](Number(_0x5632dd));
      if (
        !_0x242776 ||
        !Number['isInteger'](_0x4c56d8) ||
        _0x4c56d8 < 0x0 ||
        _0x4c56d8 >= _0x1b9bbd['length']
      )
        return ![];
      const _0x2be494 = getPersonReplacementActiveImageResultIndex(_0x242776, _0x1b9bbd),
        _0x47abea = _0x31957c['shots']['find'](
          (_0x1d68fd) => _0x1d68fd['id'] === normalizeText(_0x31957c['workspace']['selectedShotId']),
        ),
        _0x4f7f3c = resolvePersonReplacementImageSourceRef(_0x47abea),
        _0x59bb8e = resolvePersonReplacementImageResultRef(_0x1b9bbd[_0x4c56d8]),
        _0x9667a5 =
          _0x59bb8e === normalizeText(_0x242776['imageIterationReferenceRef'])
            ? normalizeText(_0x242776['keyframeRef'])
            : _0x59bb8e,
        _0x5e5e96 = _0x81bd9c !== normalizeText(_0x31957c['workspace']['selectedShotId']),
        _0x225b79 = _0x5e5e96 || _0x4c56d8 !== _0x2be494,
        _0x49241c = _0x5e5e96 || _0x9667a5 !== _0x4f7f3c,
        _0x1f6b01 = _0x5e5e96 ? _0x52ce94(_0x81bd9c) : _0x4c56d8 > _0x2be494 ? 'next' : 'previous',
        _0x4e5975 = _0x225b79 ? _0x74731d() : null,
        _0xd55f68 = _0x49241c ? _0x15b0bc() : null,
        _0x1ca349 = captureResultHistoryMenu(),
        _0x2bbb15 = setPersonReplacementImageResultAsReference(_0x31957c, {
          shotId: _0x81bd9c,
          resultIndex: _0x5632dd,
        });
      if (!_0x2bbb15['changed']) return ![];
      _0x22b1e1(
        reconcilePersonReplacementShotGenerationState(
          _0x2bbb15['project'],
          new Set(_0x2bbb15['changedShotIds']),
        ),
        'replacement-image-reference',
      );
      _0x225b79 && _0x3e5a27(_0x1f6b01 || 'next', _0x4e5975);
      _0x49241c && _0x555b4e(_0x1f6b01 || 'next', _0xd55f68);
      if (_0x5e5e96) _0x2ba24e(_0x81bd9c);
      return (
        restoreResultHistoryMenu(_0x1ca349),
        windowObject?.['showToast']?.(
          _0x2bbb15['clearedReference'] ? '已取消下一轮参考图。' : '已设为下一轮参考图；人物绑定保持不变。',
          'success',
        ),
        !![]
      );
    },
    _0x166799 = (_0x1a20bd, _0x4dc79a) => {
      const _0x27d720 = _0x45b5d4(),
        _0x105aab = normalizeText(_0x1a20bd),
        _0x4d7226 = _0x27d720['shots']['find']((_0x1d2cbd) => _0x1d2cbd['id'] === _0x105aab),
        _0x5ee914 = getPersonReplacementImageResults(_0x4d7226),
        _0xbe8b95 = Number(_0x4dc79a);
      if (
        !_0x4d7226 ||
        _0x5ee914['length'] < 0x2 ||
        !Number['isInteger'](_0xbe8b95) ||
        _0xbe8b95 < 0x0 ||
        _0xbe8b95 >= _0x5ee914['length']
      )
        return ![];
      const _0x1f20d3 = captureResultHistoryMenu(),
        _0xdc4aa6 = getPersonReplacementActiveImageResultIndex(_0x4d7226, _0x5ee914),
        _0x482f36 = resolvePersonReplacementImageResultRef(_0x5ee914[_0xdc4aa6]),
        _0x4d0d10 = _0x5ee914['filter']((_0x15ab65, _0x392616) => _0x392616 !== _0xbe8b95),
        _0x1c4ca8 =
          _0xbe8b95 < _0xdc4aa6
            ? _0xdc4aa6 - 0x1
            : _0xbe8b95 === _0xdc4aa6
              ? Math['min'](_0xbe8b95, _0x4d0d10['length'] - 0x1)
              : _0xdc4aa6,
        _0x484ebd = resolvePersonReplacementImageResultRef(_0x4d0d10[_0x1c4ca8]),
        _0x38e306 = Object['prototype']['hasOwnProperty']['call'](_0x4d0d10[_0x1c4ca8], 'userPrompt'),
        _0x2efbc2 = normalizeText(_0x4d0d10[_0x1c4ca8]?.['userPrompt']),
        _0x5926d7 = _0x484ebd !== _0x482f36;
      return (
        _0x22b1e1(
          {
            ..._0x27d720,
            shots: _0x27d720['shots']['map']((_0x326358) =>
              _0x326358['id'] === _0x105aab
                ? {
                    ..._0x326358,
                    replacementImage: {
                      ...(_0x326358['replacementImage'] || {}),
                      results: _0x4d0d10,
                      activeIndex: _0x1c4ca8,
                    },
                    replacementImageRef: _0x484ebd,
                    ...(_0x5926d7 && _0x38e306 ? { imagePrompt: _0x2efbc2 } : {}),
                  }
                : _0x326358,
            ),
          },
          'delete-replacement-image-result',
          { timelineShotId: _0x105aab },
        ),
        restoreResultHistoryMenu(_0x1f20d3),
        !![]
      );
    },
    _0x317b41 = (_0x300777, _0x1d268f, { direction: direction = '' } = {}) => {
      const _0x121b3b = _0x45b5d4(),
        _0xfb895a = normalizeText(_0x300777),
        _0x2d2b22 = _0x121b3b['shots']['find']((_0x2c25d1) => _0x2c25d1['id'] === _0xfb895a),
        _0x351b1c = getPersonReplacementVideoResults(_0x2d2b22);
      if (!_0x2d2b22 || !_0x351b1c['length']) return ![];
      const _0xb4727e = getPersonReplacementActiveVideoResultIndex(_0x2d2b22, _0x351b1c),
        _0x39d9e7 = Math['max'](
          0x0,
          Math['min'](_0x351b1c['length'] - 0x1, Math['trunc'](Number(_0x1d268f) || 0x0)),
        );
      if (_0x39d9e7 === _0xb4727e) return ![];
      const _0x260f52 = direction || (_0x39d9e7 > _0xb4727e ? 'next' : 'previous'),
        _0x49036c = _0x4c1c28(),
        _0x13fe4a = resolvePersonReplacementVideoResultRef(_0x351b1c[_0x39d9e7]);
      return (
        _0x22b1e1(
          _0x142100({
            ..._0x121b3b,
            shots: _0x121b3b['shots']['map']((_0x200174) =>
              _0x200174['id'] === _0xfb895a
                ? {
                    ..._0x200174,
                    replacementVideo: {
                      ...(_0x200174['replacementVideo'] || {}),
                      results: _0x351b1c,
                      activeIndex: _0x39d9e7,
                    },
                    resultVideoRef: _0x13fe4a,
                    generationStatus: 'succeeded',
                    error: '',
                  }
                : _0x200174,
            ),
          }),
          'replacement-video-result',
        ),
        _0x4d5058(_0x260f52, _0x49036c),
        !![]
      );
    },
    _0x3401a7 = (_0x15f662, _0x1f5253) => {
      const _0x3a2b9a = _0x45b5d4(),
        _0x184c4f = normalizeText(_0x15f662),
        _0x16b1a3 = _0x3a2b9a['shots']['find']((_0x2c0be0) => _0x2c0be0['id'] === _0x184c4f),
        _0x50f05a = getPersonReplacementVideoResults(_0x16b1a3),
        _0x409f3e = Number(_0x1f5253);
      if (
        !_0x16b1a3 ||
        _0x50f05a['length'] < 0x2 ||
        !Number['isInteger'](_0x409f3e) ||
        _0x409f3e < 0x0 ||
        _0x409f3e >= _0x50f05a['length']
      )
        return ![];
      const _0x65feb4 = captureResultHistoryMenu(),
        _0x3a92c0 = getPersonReplacementActiveVideoResultIndex(_0x16b1a3, _0x50f05a),
        _0x3ca2af = resolvePersonReplacementVideoResultRef(_0x50f05a[_0x3a92c0]),
        _0x3d98a7 = _0x50f05a['filter']((_0x455d21, _0x3e466f) => _0x3e466f !== _0x409f3e),
        _0xa9d6a3 =
          _0x409f3e < _0x3a92c0
            ? _0x3a92c0 - 0x1
            : _0x409f3e === _0x3a92c0
              ? Math['min'](_0x409f3e, _0x3d98a7['length'] - 0x1)
              : _0x3a92c0,
        _0x3e08c5 = resolvePersonReplacementVideoResultRef(_0x3d98a7[_0xa9d6a3]),
        _0x37d61f = _0x3e08c5 !== _0x3ca2af;
      return (
        _0x22b1e1(
          _0x142100(
            {
              ..._0x3a2b9a,
              shots: _0x3a2b9a['shots']['map']((_0x333361) =>
                _0x333361['id'] === _0x184c4f
                  ? {
                      ..._0x333361,
                      replacementVideo: {
                        ...(_0x333361['replacementVideo'] || {}),
                        results: _0x3d98a7,
                        activeIndex: _0xa9d6a3,
                      },
                      resultVideoRef: _0x3e08c5,
                      ...(_0x37d61f ? { generationStatus: 'succeeded', error: '' } : {}),
                    }
                  : _0x333361,
              ),
            },
            _0x37d61f,
          ),
          'delete-replacement-video-result',
        ),
        restoreResultHistoryMenu(_0x65feb4),
        !![]
      );
    },
    _0x25a3b4 = (_0x9e0938, _0xb8bd1d) => {
      const _0x3c6ea9 = _0x45b5d4(),
        _0x43dee3 = setPersonReplacementVideoResultAsReference(_0x3c6ea9, {
          shotId: _0x9e0938,
          resultIndex: _0xb8bd1d,
        });
      if (!_0x43dee3['changed']) return ![];
      const _0x320e79 = _0x43dee3['project']['workspace']['selectedShotId'],
        _0x23a8d7 = _0x3c6ea9['shots']['find']((_0x58b796) => _0x58b796['id'] === _0x320e79),
        _0x31c044 = _0x320e79 !== _0x3c6ea9['workspace']['selectedShotId'],
        _0x48cd91 =
          getPersonReplacementActiveVideoResultIndex(_0x23a8d7) !== Math['trunc'](Number(_0xb8bd1d)),
        _0x2aacf6 = _0x31c044
          ? _0x52ce94(_0x320e79)
          : Number(_0xb8bd1d) > getPersonReplacementActiveVideoResultIndex(_0x23a8d7)
            ? 'next'
            : 'previous',
        _0x5387f9 = _0x15b0bc(),
        _0x8173cf = _0x31c044 || _0x48cd91 ? _0x4c1c28() : null,
        _0x222280 = captureResultHistoryMenu();
      (_0x22b1e1(_0x142100(_0x43dee3['project'], _0x48cd91), 'replacement-video-reference'),
        _0x555b4e(_0x2aacf6 || 'next', _0x5387f9));
      (_0x31c044 || _0x48cd91) && _0x4d5058(_0x2aacf6 || 'next', _0x8173cf);
      if (_0x31c044) _0x2ba24e(_0x320e79);
      return (
        restoreResultHistoryMenu(_0x222280),
        windowObject?.['showToast']?.(
          _0x43dee3['clearedReference'] ? '已取消下一轮参考视频。' : '已设为下一轮原视频；人物绑定保持不变。',
          'success',
        ),
        !![]
      );
    },
    _0x36b40b = (_0x7c2da3, _0x18f9be) => {
      const _0xbb0dcb = _0x45b5d4(),
        _0x74b4df = normalizeText(_0x18f9be ?? _0xbb0dcb['workspace']['selectedShotId']),
        _0x34fa22 = _0xbb0dcb['shots']['find']((_0x25cf99) => _0x25cf99['id'] === _0x74b4df),
        _0x408387 = getPersonReplacementVideoResults(_0x34fa22);
      if (!_0x34fa22 || _0x408387['length'] < 0x2) return ![];
      const _0x36d0fb = getPersonReplacementActiveVideoResultIndex(_0x34fa22, _0x408387),
        _0x16e8c2 =
          (_0x36d0fb + Math['sign'](Number(_0x7c2da3) || 0x0) + _0x408387['length']) % _0x408387['length'];
      return _0x317b41(_0x74b4df, _0x16e8c2, {
        direction: Math['sign'](Number(_0x7c2da3) || 0x0) < 0x0 ? 'previous' : 'next',
      });
    },
    _0x360b07 = (
      _0x1158f0,
      _0x412e52,
      {
        sourceShotId: sourceShotId = '',
        resultIndex: _0x325341,
        referencePersonId: referencePersonId = '',
        referenceKind: referenceKind = '',
      } = {},
    ) => {
      const _0x43f20e = _0x45b5d4(),
        _0x442ca9 = normalizeText(_0x1158f0),
        _0x1d8aa3 = _0x43f20e['shots']['find']((_0x500036) => _0x500036['id'] === _0x442ca9),
        _0x3d4307 = resolvePersonReplacementVideoImageInput(_0x43f20e, _0x1d8aa3),
        _0x5ab10b = Array['isArray'](_0x3d4307['referenceOptions']) ? _0x3d4307['referenceOptions'] : [];
      if (!_0x1d8aa3 || !_0x5ab10b['length']) return ![];
      const _0x52e9d0 = Math['max'](
          0x0,
          Math['min'](_0x5ab10b['length'] - 0x1, Math['trunc'](Number(_0x412e52) || 0x0)),
        ),
        _0x1a085d = _0x5ab10b[_0x52e9d0],
        _0x3d3663 = selectPersonReplacementVideoReference(_0x43f20e, {
          targetShotId: _0x442ca9,
          sourceShotId: normalizeText(sourceShotId) || normalizeText(_0x1a085d?.['sourceShotId']),
          resultIndex: Number['isInteger'](Math['trunc'](Number(_0x325341)))
            ? Math['trunc'](Number(_0x325341))
            : _0x1a085d?.['resultIndex'],
          referencePersonId:
            normalizeText(referencePersonId) || normalizeText(_0x1a085d?.['reference']?.['personId']),
          referenceKind: normalizeText(referenceKind) || normalizeText(_0x1a085d?.['kind']),
        });
      if (!_0x3d3663['changed']) return ![];
      return (_0x22b1e1(_0x3d3663['project'], 'video-reference-change'), !![]);
    },
    _0x326020 = ({
      targetShotId: _0x505eaa,
      sourceShotId: _0x42d072,
      currentResultIndex: _0x400251,
      delta: _0x47089d,
    } = {}) => {
      const _0x22fcc9 = _0x45b5d4(),
        _0x52ab53 = switchPersonReplacementVideoReferenceResult(_0x22fcc9, {
          targetShotId: _0x505eaa ?? _0x22fcc9['workspace']['selectedShotId'],
          sourceShotId: _0x42d072,
          currentResultIndex: _0x400251,
          delta: _0x47089d,
        });
      if (!_0x52ab53['changed']) return ![];
      return (_0x22b1e1(_0x52ab53['project'], 'video-reference-change'), !![]);
    };
  return Object['freeze']({
    deleteImageResult: _0x166799,
    deleteVideoResult: _0x3401a7,
    selectImageResult: _0x4a0ad2,
    selectVideoReference: _0x360b07,
    selectVideoResult: _0x317b41,
    setImageReference: _0x53bd01,
    setVideoReference: _0x25a3b4,
    switchImageResult: _0x726550,
    switchVideoReferenceResult: _0x326020,
    switchVideoResult: _0x36b40b,
  });
}
