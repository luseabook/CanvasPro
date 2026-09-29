import { localPathToUrl } from '../../utils/localMediaPath.js';
import {
  buildWorkspaceAssetHoverPreviewContent,
  isWorkspaceAssetHoverLandscape,
} from '../workspaceAssetPresentation.js';
import { getWorkspaceAssetHoverCard, getWorkspaceAssetHoverCardId } from '../workspaceAssetHover.js';
import {
  getWorkspaceAssetAppearances,
  getWorkspaceAssetBaseAppearance,
} from '../workspaceAssetAppearance.js';
import {
  PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE,
  getPersonReplacementActiveImageResultIndex,
  getPersonReplacementImageResults,
  resolvePersonReplacementImageResultRef,
  resolvePersonReplacementVideoImageInput,
} from './personReplacementProject.js';
import { getPersonReplacementVoiceLibraryBoundCharacters } from './personReplacementVoiceLibrary.js';
function normalizeText(_0x4a1379, _0x4f9aa3 = '') {
  const _0x6fd027 = String(_0x4a1379 ?? '')['trim']();
  return _0x6fd027 || _0x4f9aa3;
}
function normalizeMediaUrl(_0x41dd57) {
  const _0x4a6249 = normalizeText(_0x41dd57);
  if (!_0x4a6249) return '';
  return localPathToUrl(_0x4a6249) || _0x4a6249;
}
function getCharacterAppearance(_0x32739, _0x37e590 = '') {
  const _0x39ccab = getWorkspaceAssetAppearances(_0x32739);
  return (
    _0x39ccab['find']((_0x53accf) => _0x53accf['id'] === _0x37e590) ||
    getWorkspaceAssetBaseAppearance(_0x32739) ||
    _0x39ccab[0x0] ||
    null
  );
}
function getCharacterVoiceUrl(_0x3c20d0 = {}) {
  return normalizeMediaUrl(
    _0x3c20d0['voiceReference']?.['audioUrl'] ||
      _0x3c20d0['voiceReference']?.['localPath'] ||
      _0x3c20d0['voiceRef'],
  );
}
function resolveVideoShotReferencePreview(_0x1983b1, _0x5140fc) {
  const _0x14f487 = resolvePersonReplacementVideoImageInput(_0x1983b1, _0x5140fc),
    _0x5ed99e = Array['isArray'](_0x14f487?.['referenceOptions']) ? _0x14f487['referenceOptions'] : [],
    _0x3c1f25 = Math['max'](
      0x0,
      Math['min'](
        Math['max'](0x0, _0x5ed99e['length'] - 0x1),
        Math['trunc'](Number(_0x14f487?.['activeReferenceIndex']) || 0x0),
      ),
    ),
    _0x1a5c9b = _0x5ed99e[_0x3c1f25] || null;
  return _0x1a5c9b
    ? {
        isCharacterReference: _0x1a5c9b['kind'] === PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE,
        referenceImageRef: normalizeText(_0x1a5c9b['imageRef']),
      }
    : null;
}
export function createPersonReplacementAssetHoverPreviewController({
  getRoot: getRoot = () => null,
  getProject: getProject = () => ({}),
  getSelectedAppearance: getSelectedAppearance = () => null,
  isTargetAssetDragActive: isTargetAssetDragActive = () => ![],
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis,
} = {}) {
  let _0x4eb836 = 0x0,
    _0x19f881 = 0x0,
    _0x556d6c = 0x0,
    _0x22576f = null,
    _0x306fc5 = '',
    _0x1e7dd2 = null,
    _0x788e99 = ![];
  const _0x829e38 = () => getRoot()?.['querySelector']?.('[data-story-asset-hover-preview]'),
    _0x471618 = (_0x73d7a) => {
      const _0x117481 = _0x73d7a?.['closest']?.('.person-replacement-prompt-reference-inputs'),
        _0x13510d = _0x117481 ? _0x73d7a?.['querySelector']?.('.ref-thumb-media') : null,
        _0x37d463 = normalizeMediaUrl(
          _0x13510d?.['currentSrc'] || _0x13510d?.['getAttribute']?.('src') || _0x13510d?.['src'],
        );
      if (!_0x37d463) return null;
      const _0x51a33d = normalizeText(_0x73d7a?.['dataset']?.['slot']) || 'input',
        _0x1f30ef = normalizeText(_0x73d7a?.['getAttribute']?.('aria-label')) || '模型入参 ' + _0x51a33d;
      return {
        id: 'prompt-reference:' + _0x51a33d + ':' + _0x37d463,
        slotId: _0x51a33d,
        label: _0x1f30ef,
        imageUrl: _0x37d463,
      };
    },
    _0x3ba23f = (_0x3fab82) =>
      getWorkspaceAssetHoverCard(_0x3fab82, {
        selector: '[data-story-asset-id], [data-story-reference-asset], [data-story-asset-hover-id]',
      }) ||
      _0x3fab82?.['closest']?.('.person-replacement-prompt-reference-inputs .ref-thumb-wrap[data-slot]') ||
      null,
    _0x62a6c = (_0x5dab66) =>
      normalizeText(
        getWorkspaceAssetHoverCardId(_0x5dab66, {
          datasetKeys: ['storyAssetHoverId', 'storyAssetId', 'storyReferenceAsset'],
        }),
      ) ||
      _0x471618(_0x5dab66)?.['id'] ||
      '',
    _0x509302 = (_0x777215) => {
      if (!_0x777215 || !_0x1e7dd2) return ![];
      return (
        _0x62a6c(_0x777215) === _0x1e7dd2['assetId'] &&
        normalizeText(_0x777215['dataset']?.['shotId']) === _0x1e7dd2['shotId'] &&
        normalizeText(_0x777215['dataset']?.['personId']) === _0x1e7dd2['personId']
      );
    },
    _0x48a2fe = () => {
      ((_0x306fc5 = ''), (_0x22576f = null));
      const _0x4c3a7d = _0x829e38();
      (_0x4c3a7d?.['classList']?.['remove']?.('is-visible'),
        _0x4c3a7d?.['classList']?.['remove']?.('is-prompt-reference-preview'),
        _0x4c3a7d?.['setAttribute']?.('aria-hidden', 'true'));
    },
    _0x11eb01 = () => {
      _0x4eb836 = 0x0;
      const _0x52fa24 = _0x829e38();
      if (!_0x52fa24?.['classList']?.['contains']?.('is-visible')) return;
      const _0xf800f7 = _0x52fa24['getBoundingClientRect']?.();
      if (!_0xf800f7) return;
      const _0x4368a3 =
          windowObject?.['innerWidth'] || documentObject?.['documentElement']?.['clientWidth'] || 0x400,
        _0x157074 =
          windowObject?.['innerHeight'] || documentObject?.['documentElement']?.['clientHeight'] || 0x300,
        _0xb7fdf0 = 0xe,
        _0x1297b7 = 0xa,
        _0x2b726d = Math['max'](_0x1297b7, _0x4368a3 - _0xf800f7['width'] - _0x1297b7),
        _0x5f5525 = Math['max'](_0x1297b7, _0x157074 - _0xf800f7['height'] - _0x1297b7),
        _0x548a3b = _0x22576f?.['getBoundingClientRect']?.(),
        _0x2a516f =
          Number(_0x548a3b?.['width']) > 0x0 &&
          Number['isFinite'](Number(_0x548a3b?.['left'])) &&
          Number['isFinite'](Number(_0x548a3b?.['top'])),
        _0x36b95b = _0x2a516f
          ? Number(_0x548a3b['left']) + (Number(_0x548a3b['width']) - _0xf800f7['width']) / 0x2
          : _0x19f881 + _0xb7fdf0,
        _0x14b605 = _0x2a516f
          ? Number(_0x548a3b['top']) - _0xf800f7['height'] - _0xb7fdf0
          : _0x556d6c + _0xb7fdf0;
      ((_0x52fa24['style']['left'] =
        Math['round'](Math['min'](Math['max'](_0x1297b7, _0x36b95b), _0x2b726d)) + 'px'),
        (_0x52fa24['style']['top'] =
          Math['round'](Math['min'](Math['max'](_0x1297b7, _0x14b605), _0x5f5525)) + 'px'));
    },
    _0x36c967 = (_0x398f10, { anchor: anchor = null } = {}) => {
      ((_0x19f881 = Number(_0x398f10?.['clientX'] || 0x0)),
        (_0x556d6c = Number(_0x398f10?.['clientY'] || 0x0)),
        (_0x22576f = anchor));
      if (_0x4eb836) return;
      typeof windowObject?.['requestAnimationFrame'] === 'function'
        ? (_0x4eb836 = windowObject['requestAnimationFrame'](_0x11eb01))
        : _0x11eb01();
    },
    _0x4142e8 = (_0x2cd728) => {
      _0x2cd728?.['querySelectorAll']?.('[data-story-asset-hover-image]')?.['forEach']?.((_0x33c722) => {
        const _0x452166 = () => {
          const _0x36694f = isWorkspaceAssetHoverLandscape(
            _0x33c722['naturalWidth'],
            _0x33c722['naturalHeight'],
          );
          (_0x33c722['closest']?.('.story-asset-hover-preview-item')?.['classList']?.['toggle']?.(
            'is-landscape',
            _0x36694f,
          ),
            _0x33c722['closest']?.('.story-asset-hover-preview-cell')?.['classList']?.['toggle']?.(
              'is-landscape',
              _0x36694f,
            ),
            _0x11eb01());
        };
        if (_0x33c722['complete'] && Number(_0x33c722['naturalWidth']) > 0x0) _0x452166();
        else _0x33c722['addEventListener']?.('load', _0x452166, { once: !![] });
      });
    },
    _0x58d8e8 = (_0x1ec006, _0x3233dd) => {
      const _0x58c7cc = getRoot(),
        _0x5cd150 = getProject();
      if (
        _0x788e99 ||
        !_0x1ec006 ||
        _0x1ec006['closest']?.('.story-assets-page .story-asset-card-shell') ||
        _0x3233dd?.['pointerType'] === 'touch' ||
        _0x5cd150['workspace']['view'] !== 'project' ||
        _0x58c7cc?.['classList']?.['contains']?.('is-marquee-selecting') ||
        isTargetAssetDragActive()
      )
        return (_0x48a2fe(), ![]);
      const _0x115208 = _0x471618(_0x1ec006),
        _0x2a7f45 = _0x1ec006['dataset']?.['personReplacementAudioLibraryAsset'] === 'true',
        _0xa80a44 =
          normalizeText(
            getWorkspaceAssetHoverCardId(_0x1ec006, {
              datasetKeys: ['storyAssetHoverId', 'storyAssetId', 'storyReferenceAsset'],
            }),
          ) ||
          _0x115208?.['id'] ||
          '';
      if (_0x509302(_0x1ec006)) return (_0x48a2fe(), ![]);
      const _0x193009 = normalizeText(_0x1ec006['dataset']?.['storyAssetHoverAppearanceId']),
        _0x2d993d =
          _0x5cd150['workspace']['step'] === 0x2 &&
          Boolean(_0x1ec006['closest']?.('.person-replacement-target-assets')),
        _0x38d75f =
          _0x5cd150['workspace']['step'] === 0x2 &&
          Boolean(_0x2d993d || _0x1ec006['closest']?.('[data-person-replacement-person-drop]')),
        _0x19cc29 = _0x1ec006['dataset']?.['personReplacementReplacementAssetKind'] === 'scene',
        _0x189c40 =
          _0x5cd150['workspace']['step'] === 0x3 &&
          _0x1ec006['dataset']?.['personReplacementVideoShotHoverPreview'] === 'true',
        _0x21e2e0 =
          _0x5cd150['workspace']['step'] === 0x3 &&
          _0x1ec006['dataset']?.['personReplacementVideoReferenceHoverPreview'] === 'true',
        _0x17dc5b =
          _0x5cd150['workspace']['step'] === 0x5 &&
          _0x1ec006['dataset']?.['personReplacementCompositeShotHoverPreview'] === 'true',
        _0x34cba2 = Boolean(_0x115208),
        _0x5e0153 =
          _0x189c40 || _0x21e2e0 || _0x17dc5b
            ? _0x5cd150['shots']['findIndex']((_0x4f9e4c) => normalizeText(_0x4f9e4c?.['id']) === _0xa80a44)
            : -0x1,
        _0xfd88ec = _0x5e0153 >= 0x0 ? _0x5cd150['shots'][_0x5e0153] : null,
        _0x2a0c5b = getPersonReplacementImageResults(_0xfd88ec),
        _0x218055 = getPersonReplacementActiveImageResultIndex(_0xfd88ec, _0x2a0c5b),
        _0x1bfccf =
          resolvePersonReplacementImageResultRef(_0x2a0c5b[_0x218055]) ||
          normalizeText(_0xfd88ec?.['replacementImageRef']),
        _0x2d09b2 = _0x189c40 && _0xfd88ec ? resolveVideoShotReferencePreview(_0x5cd150, _0xfd88ec) : null,
        _0xc38429 = _0xfd88ec
          ? {
              id: _0xa80a44,
              kind: 'scene',
              name: '片段' + String(_0x5e0153 + 0x1)['padStart'](0x2, '0'),
              appearances: [
                {
                  id: 'source-frame',
                  name: '原片关键帧',
                  imageUrl: normalizeMediaUrl(_0xfd88ec['keyframeRef']),
                },
                {
                  id: _0x2d09b2?.['isCharacterReference'] ? 'character-reference' : 'replacement-frame',
                  name: _0x2d09b2?.['isCharacterReference'] ? '人物入参图' : '当前替换图',
                  imageUrl: normalizeMediaUrl(_0x2d09b2?.['referenceImageRef'] || _0x1bfccf),
                },
              ],
            }
          : null,
        _0x29971e = _0x21e2e0
          ? _0x5cd150['shots']['find'](
              (_0x51f9e9) =>
                normalizeText(_0x51f9e9?.['id']) === normalizeText(_0x1ec006['dataset']?.['shotId']),
            ) ||
            _0xfd88ec ||
            null
          : null,
        _0x5c9d6e = _0x29971e ? resolvePersonReplacementVideoImageInput(_0x5cd150, _0x29971e) : null,
        _0x32a460 = Array['isArray'](_0x5c9d6e?.['referenceOptions']) ? _0x5c9d6e['referenceOptions'] : [],
        _0x18099e = Math['max'](
          0x0,
          Math['min'](
            Math['max'](0x0, _0x32a460['length'] - 0x1),
            Math['trunc'](Number(_0x1ec006['dataset']?.['personReplacementVideoReferenceIndex']) || 0x0),
          ),
        ),
        _0x43b24a = Math['max'](
          0x0,
          Math['trunc'](Number(_0x1ec006['dataset']?.['personReplacementVideoReferenceResultIndex']) || 0x0),
        ),
        _0x3c41ef = normalizeText(_0x1ec006['dataset']?.['personReplacementVideoReferenceSourceShotId'])
          ? _0x2a0c5b[_0x43b24a]
          : null,
        _0x18546e = resolvePersonReplacementImageResultRef(_0x3c41ef),
        _0x1b49e4 = _0x18546e
          ? { imageRef: _0x18546e, sourceShotIndex: _0x5e0153, resultIndex: _0x43b24a }
          : _0x32a460[_0x18099e],
        _0x49ea39 = _0x1b49e4?.['imageRef']
          ? {
              id: _0xa80a44,
              kind: 'scene',
              name: Number['isInteger'](_0x1b49e4['sourceShotIndex'])
                ? '片段' +
                  (_0x1b49e4['sourceShotIndex'] + 0x1) +
                  '.图片' +
                  ((_0x1b49e4['resultIndex'] || 0x0) + 0x1)
                : '替换参考图 ' + (_0x18099e + 0x1),
              appearances: [
                {
                  id: 'video-reference-' + _0x18099e,
                  name: '替换参考图',
                  imageUrl: normalizeMediaUrl(_0x1b49e4['imageRef']),
                },
              ],
            }
          : null,
        _0x1b99bf =
          _0x17dc5b && _0xfd88ec
            ? {
                id: _0xa80a44,
                kind: 'scene',
                name:
                  normalizeText(_0xfd88ec['title']) || '片段' + String(_0x5e0153 + 0x1)['padStart'](0x2, '0'),
                appearances: [
                  {
                    id: 'composite-thumbnail',
                    name: '片段缩略图',
                    imageUrl: normalizeMediaUrl(_0x1bfccf || _0xfd88ec['keyframeRef']),
                  },
                ],
              }
            : null,
        _0x3240c4 = _0x34cba2
          ? {
              id: _0xa80a44,
              kind: 'scene',
              name: _0x115208['label'],
              appearances: [
                { id: _0x115208['slotId'], name: _0x115208['label'], imageUrl: _0x115208['imageUrl'] },
              ],
            }
          : null,
        _0x483028 =
          !_0x34cba2 &&
          !_0x189c40 &&
          !_0x21e2e0 &&
          !_0x17dc5b &&
          (_0x19cc29 ||
            (_0x5cd150['workspace']['step'] === 0x1 &&
              _0x5cd150['workspace']['characterAssetTab'] === 'scene')),
        _0x45b0d5 =
          !_0x483028 &&
          !_0x2a7f45 &&
          !_0x34cba2 &&
          !_0x38d75f &&
          !_0x189c40 &&
          !_0x21e2e0 &&
          !_0x17dc5b &&
          _0x5cd150['workspace']['characterAssetTab'] === 'library',
        _0x295403 =
          !_0x483028 &&
          !_0x34cba2 &&
          !_0x38d75f &&
          !_0x189c40 &&
          !_0x21e2e0 &&
          !_0x17dc5b &&
          (_0x2a7f45 || _0x5cd150['workspace']['characterAssetTab'] === 'audio'),
        _0x1997a7 =
          _0x5cd150['workspace']['characterAssetTab'] === 'audio'
            ? _0x5cd150['audioAssets']
            : _0x5cd150['libraryAssets'],
        _0x74e11a = _0x295403
          ? _0x1997a7['find']((_0x40fd0c) => normalizeText(_0x40fd0c?.['id']) === _0xa80a44)
          : null,
        _0x2dc770 = _0x74e11a
          ? getPersonReplacementVoiceLibraryBoundCharacters(_0x5cd150, _0x74e11a)
              ['map']((_0x254fe9) => {
                const _0xbbe1b5 =
                  getWorkspaceAssetBaseAppearance(_0x254fe9) ||
                  getWorkspaceAssetAppearances(_0x254fe9)['find']((_0x122605) =>
                    normalizeText(_0x122605?.['imageUrl']),
                  );
                return {
                  id: _0x254fe9['id'],
                  name: normalizeText(_0x254fe9['name']) || '未命名人设',
                  imageUrl: normalizeMediaUrl(_0xbbe1b5?.['imageUrl']),
                };
              })
              ['filter']((_0x552a13) => _0x552a13['imageUrl'])
          : [],
        _0x47ab06 = _0x2dc770['length']
          ? {
              id: _0xa80a44,
              kind: 'character',
              name: normalizeText(_0x74e11a?.['name']) || '音频绑定人设',
              appearances: _0x2dc770,
            }
          : null,
        _0x25ebf5 = _0x483028
          ? _0x5cd150['scenes']
          : _0x45b0d5
            ? _0x5cd150['libraryAssets']
            : _0x295403
              ? _0x1997a7
              : _0x5cd150['characters'],
        _0x560453 =
          _0x3240c4 ||
          _0x1b99bf ||
          _0x49ea39 ||
          _0xc38429 ||
          _0x47ab06 ||
          _0x25ebf5['find']((_0x15b422) => normalizeText(_0x15b422?.['id']) === _0xa80a44);
      if (_0x295403 && !_0x47ab06) return (_0x48a2fe(), ![]);
      const _0x306cc2 = _0x829e38(),
        _0x2ea665 = _0x34cba2
          ? _0x3240c4?.['appearances']?.[0x0]
          : _0x17dc5b
            ? _0x1b99bf?.['appearances']?.[0x0]
            : _0x21e2e0
              ? _0x49ea39?.['appearances']?.[0x0]
              : _0x189c40
                ? _0xc38429?.['appearances']?.[0x1]
                : _0x295403
                  ? _0x47ab06?.['appearances']?.[0x0]
                  : _0x560453?.['isLibraryAsset']
                    ? _0x560453
                    : _0x193009
                      ? getCharacterAppearance(_0x560453, _0x193009)
                      : getSelectedAppearance(_0x560453),
        _0x13fc18 = _0x295403
          ? _0x47ab06
          : _0x38d75f && _0x2ea665
            ? { ..._0x560453, appearances: [_0x2ea665] }
            : _0x560453,
        _0x25c550 = buildWorkspaceAssetHoverPreviewContent(_0x13fc18, {
          selectedAssetId:
            _0x34cba2 || _0x189c40 || _0x21e2e0 || _0x17dc5b
              ? _0xa80a44
              : _0x38d75f
                ? _0xa80a44
                : _0x295403 && _0x5cd150['workspace']['characterAssetTab'] === 'audio'
                  ? _0x5cd150['workspace']['selectedAudioAssetId']
                  : _0x45b0d5 || _0x295403
                    ? _0x5cd150['workspace']['selectedLibraryAssetId']
                    : _0x483028
                      ? _0x5cd150['workspace']['selectedSceneId']
                      : _0x5cd150['workspace']['selectedCharacterId'],
          selectedAppearanceId: _0x2ea665?.['id'],
          mediaOnly:
            _0x189c40 ||
            _0x21e2e0 ||
            _0x17dc5b ||
            _0x34cba2 ||
            _0x295403 ||
            [0x1, 0x2]['includes'](_0x5cd150['workspace']['step']),
          getAppearances: getWorkspaceAssetAppearances,
          hasVoiceReference: (_0xa1fe77) => Boolean(getCharacterVoiceUrl(_0xa1fe77)),
        });
      if (!_0x306cc2 || !_0x25c550) return (_0x48a2fe(), ![]);
      const _0x20a15b =
        _0xa80a44 +
        ':' +
        (_0x2ea665?.['id'] || '') +
        ':' +
        _0x25c550['mediaOnly'] +
        ':' +
        _0x25c550['appearances']
          ['map']((_0x1c31eb) => (_0x1c31eb?.['id'] || '') + ':' + (_0x1c31eb?.['imageUrl'] || ''))
          ['join']('|');
      return (
        (_0x306fc5 = _0xa80a44),
        _0x306cc2['dataset']['signature'] !== _0x20a15b &&
          ((_0x306cc2['dataset']['signature'] = _0x20a15b),
          _0x306cc2['style']['setProperty']('--story-asset-hover-columns', String(_0x25c550['columns'])),
          (_0x306cc2['innerHTML'] = _0x25c550['html']),
          _0x4142e8(_0x306cc2)),
        _0x306cc2['classList']['toggle']('is-prompt-reference-preview', _0x34cba2),
        _0x306cc2['classList']['add']('is-visible'),
        _0x306cc2['setAttribute']('aria-hidden', 'false'),
        _0x36c967(_0x3233dd, { anchor: _0x34cba2 ? _0x1ec006 : null }),
        !![]
      );
    },
    _0x2843ef = (_0x5417de) => {
      const _0x41ccfd = getRoot();
      if (_0x5417de['target']?.['closest']?.('.person-replacement-detection-label')) {
        _0x48a2fe();
        return;
      }
      const _0x30ddf9 = _0x3ba23f(_0x5417de['target']);
      if (!_0x30ddf9 || !_0x41ccfd?.['contains']?.(_0x30ddf9)) return;
      if (_0x5417de['relatedTarget'] && _0x30ddf9['contains']?.(_0x5417de['relatedTarget'])) return;
      _0x58d8e8(_0x30ddf9, _0x5417de);
    },
    _0x3213c3 = (_0x21f03e) => {
      const _0x26c8ae = getRoot();
      if (_0x21f03e['target']?.['closest']?.('.person-replacement-detection-label')) {
        if (_0x306fc5) _0x48a2fe();
        return;
      }
      const _0x526531 = _0x3ba23f(_0x21f03e['target']);
      if (!_0x526531 || !_0x26c8ae?.['contains']?.(_0x526531)) {
        if (!isTargetAssetDragActive()) _0x1e7dd2 = null;
        if (_0x306fc5) _0x48a2fe();
        return;
      }
      _0x58d8e8(_0x526531, _0x21f03e);
    },
    _0x498c95 = (_0x225e19) => {
      const _0x25d716 = _0x3ba23f(_0x225e19['target']);
      !isTargetAssetDragActive() && _0x509302(_0x25d716) && (_0x1e7dd2 = null);
      if (!_0x25d716 || _0x62a6c(_0x25d716) !== _0x306fc5) return;
      if (_0x225e19['relatedTarget'] && _0x25d716['contains']?.(_0x225e19['relatedTarget'])) return;
      _0x48a2fe();
    };
  return Object['freeze']({
    blockDropTarget(_0x360d22 = null) {
      _0x1e7dd2 = _0x360d22
        ? {
            assetId: normalizeText(_0x360d22['assetId']),
            shotId: normalizeText(_0x360d22['shotId']),
            personId: normalizeText(_0x360d22['personId']),
          }
        : null;
    },
    destroy() {
      if (_0x788e99) return;
      ((_0x788e99 = !![]),
        _0x4eb836 &&
          typeof windowObject?.['cancelAnimationFrame'] === 'function' &&
          windowObject['cancelAnimationFrame'](_0x4eb836),
        (_0x4eb836 = 0x0),
        (_0x1e7dd2 = null),
        _0x48a2fe());
    },
    handlePointerMove: _0x3213c3,
    handlePointerOut: _0x498c95,
    handlePointerOver: _0x2843ef,
    hide: _0x48a2fe,
    show: _0x58d8e8,
  });
}
