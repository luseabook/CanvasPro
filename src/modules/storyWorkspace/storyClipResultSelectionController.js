import { consumeWorkspaceWheelDirection } from '../workspaceAssetPresentation.js';
import { storyClipProduction } from './storyClipProduction.js';
import {
  findStoryClipCardShell,
  syncSelectedClipVideoMetadataInPlace,
  syncStoryClipCardVideoInPlace,
} from './storyClipVideoResultDom.js';
function normalizeText(_0x4f4ffc) {
  return String(_0x4f4ffc ?? '')['trim']();
}
export function createStoryClipResultSelectionController({
  state: _0x1bbb9b,
  viewport: _0x23b5a2,
  documentObject: documentObject = globalThis['document'],
  getSelectedEpisode: _0x36faa8,
  getSelectedClip: _0x1041e4,
  resetAdjustmentUi: _0x394419,
  applyVideoSettings: _0x5ecfbf,
  refreshSelectedClip: _0x2f6f12,
  refreshSelectedVideoResult: _0x195e00,
  refreshHistory: _0x166108,
  hideHistory: _0x13b0ee,
  render: _0x323272,
  schedulePersistence: _0x40e680,
} = {}) {
  if (
    !_0x1bbb9b ||
    !_0x23b5a2 ||
    !documentObject ||
    typeof _0x36faa8 !== 'function' ||
    typeof _0x1041e4 !== 'function' ||
    typeof _0x394419 !== 'function' ||
    typeof _0x5ecfbf !== 'function' ||
    typeof _0x2f6f12 !== 'function' ||
    typeof _0x195e00 !== 'function' ||
    typeof _0x166108 !== 'function' ||
    typeof _0x13b0ee !== 'function' ||
    typeof _0x323272 !== 'function' ||
    typeof _0x40e680 !== 'function'
  )
    throw new TypeError(
      'Story\x20clip\x20result\x20selection\x20requires\x20navigation,\x20persistence,\x20and\x20presentation\x20adapters.',
    );
  const _0x2f6044 = { accumulator: 0x0, lockedUntil: 0x0 };
  function _0x555ab1(_0x454953) {
    const _0xc3455 = _0x36faa8(_0x1bbb9b),
      _0x8e30b7 = Array['isArray'](_0xc3455?.['clips']) ? _0xc3455['clips'] : [];
    if (_0x8e30b7['length'] < 0x2) return ![];
    const _0x5b83db = storyClipProduction['getAdjacentClipId'](
        _0x8e30b7,
        _0x1bbb9b['selectedClipId'],
        _0x454953,
      ),
      _0x146919 = _0x8e30b7['find']((_0x3f4692) => _0x3f4692['id'] === _0x5b83db);
    if (!_0x146919 || _0x146919['id'] === _0x1bbb9b['selectedClipId']) return ![];
    const _0x2fa1fd = Number(_0x454953) < 0x0 ? 'previous' : 'next';
    (_0x394419({ close: !![] }), (_0x1bbb9b['selectedClipId'] = _0x146919['id']), _0x5ecfbf(_0x146919));
    if (!_0x2f6f12(_0x2fa1fd)) _0x323272();
    return (_0x40e680(), !![]);
  }
  function _0x2dbcb5(_0x3748a8, _0x5dc136, { delta: delta = 0x0 } = {}) {
    const _0x4dfe20 = _0x36faa8(_0x1bbb9b),
      _0x4a5d12 = Array['isArray'](_0x4dfe20?.['clips']) ? _0x4dfe20['clips'] : [],
      _0x4871df = _0x4a5d12['find'](
        (_0x5641d6) => normalizeText(_0x5641d6?.['id']) === normalizeText(_0x3748a8),
      );
    if (!_0x4871df) return ![];
    const _0x40e453 = storyClipProduction['renderEpisode'](_0x1bbb9b, _0x4dfe20, _0x4871df),
      _0x2b465a = _0x40e453['videoResults'];
    if (_0x2b465a['length'] < 0x2) return ![];
    const _0xbb01ac = _0x40e453['activeVideoResultIndex'],
      _0x2c39be = Math['trunc'](Number(_0x5dc136)),
      _0x3ab98f = Number['isFinite'](_0x2c39be)
        ? Math['max'](0x0, Math['min'](_0x2b465a['length'] - 0x1, _0x2c39be))
        : _0x40e453['getAdjacentVideoResultIndex'](delta),
      _0x453364 = _0x1bbb9b['selectedClipId'] !== _0x4871df['id'];
    if (!_0x453364 && _0x3ab98f === _0xbb01ac) return (_0x13b0ee(), ![]);
    const _0x586be6 = _0x4a5d12['findIndex']((_0xa9180f) => _0xa9180f['id'] === _0x1bbb9b['selectedClipId']),
      _0x9ff106 = _0x4a5d12['findIndex']((_0x15d87e) => _0x15d87e['id'] === _0x4871df['id']);
    ((_0x4871df['video'] = { ...(_0x4871df['video'] || {}), activeIndex: _0x3ab98f }),
      (_0x1bbb9b['pendingDeleteClipId'] = ''),
      (_0x1bbb9b['selectedClipId'] = _0x4871df['id']));
    if (_0x453364) {
      (_0x394419({ close: !![] }), _0x5ecfbf(_0x4871df));
      const _0x38ccd5 = _0x9ff106 >= 0x0 && _0x9ff106 < _0x586be6 ? 'previous' : 'next';
      if (!_0x2f6f12(_0x38ccd5)) _0x323272();
    } else {
      const _0x3e6d78 = Number(delta) < 0x0 || (!delta && _0x3ab98f < _0xbb01ac) ? 'previous' : 'next';
      if (!_0x195e00(_0x3e6d78)) _0x323272();
    }
    return (_0x13b0ee(), _0x40e680(), !![]);
  }
  function _0xda3111(_0x329dfb, _0x10f614) {
    const _0x402a1d = _0x36faa8(_0x1bbb9b),
      _0x141fdd = (Array['isArray'](_0x402a1d?.['clips']) ? _0x402a1d['clips'] : [])['find'](
        (_0x10d78e) => normalizeText(_0x10d78e?.['id']) === normalizeText(_0x329dfb),
      );
    if (!_0x141fdd) return ![];
    const _0x41ddbc = storyClipProduction['removeVideoResult'](_0x141fdd, _0x10f614);
    if (!_0x41ddbc['changed']) return ![];
    _0x141fdd['video'] = _0x41ddbc['clip']['video'];
    const _0x526209 = normalizeText(_0x1bbb9b['selectedClipId']) === normalizeText(_0x141fdd['id']);
    if (_0x526209 && _0x41ddbc['activeResultChanged']) {
      if (!_0x195e00(_0x41ddbc['direction'])) _0x323272();
    } else {
      const _0x2dc6bb = _0x23b5a2['querySelector']('.story-page.is-current');
      (_0x526209 &&
        syncSelectedClipVideoMetadataInPlace(
          _0x2dc6bb,
          _0x41ddbc['activeIndex'],
          _0x41ddbc['results']['length'],
        ),
        syncStoryClipCardVideoInPlace({
          root: _0x2dc6bb,
          documentObject: documentObject,
          clipId: _0x141fdd['id'],
          resultCount: _0x41ddbc['results']['length'],
          refreshThumbnail: _0x41ddbc['activeResultChanged'],
          thumbnailMarkup: _0x41ddbc['activeResultChanged']
            ? storyClipProduction['renderTimelineVideoThumbnail'](_0x141fdd)
            : '',
        }));
    }
    const _0x22dc71 = _0x23b5a2['querySelector']('.story-page.is-current'),
      _0x29c2f1 = findStoryClipCardShell(_0x22dc71, _0x141fdd['id']),
      _0x151279 = Math['min'](
        Math['max'](0x0, Math['trunc'](Number(_0x10f614) || 0x0)),
        _0x41ddbc['results']['length'] - 0x1,
      );
    return (
      _0x166108({
        anchor: _0x29c2f1,
        focusSelector:
          '[data-story-action="select-video-result"][data-story-video-result-index="' + _0x151279 + '\x22]',
        fallbackFocus: _0x29c2f1?.['querySelector']?.('.story-clip-card'),
      }),
      _0x40e680(),
      !![]
    );
  }
  function _0x24fc82(_0x5cd829) {
    const _0x1f5883 = _0x1041e4(_0x1bbb9b, _0x36faa8(_0x1bbb9b));
    if (!_0x1f5883) return ![];
    return _0x2dbcb5(
      _0x1f5883['id'],
      storyClipProduction['renderEpisode'](_0x1bbb9b, _0x36faa8(_0x1bbb9b), _0x1f5883)[
        'getAdjacentVideoResultIndex'
      ](_0x5cd829),
      { delta: _0x5cd829 },
    );
  }
  function _0x517f72(_0x29680b) {
    const _0x456c8a = _0x29680b['target']['closest']?.('[data-story-clip-navigation=\x22true\x22]');
    if (!_0x456c8a || _0x1bbb9b['view'] !== 'episode') return ![];
    _0x29680b['preventDefault']();
    const _0x30de1a = consumeWorkspaceWheelDirection(_0x29680b, _0x2f6044, {
      threshold: 0x18,
      lockDuration: 0xdc,
    });
    if (_0x30de1a) _0x555ab1(_0x30de1a);
    return !![];
  }
  return {
    deleteVideoResult: _0xda3111,
    handleNavigationWheel: _0x517f72,
    selectVideoResult: _0x2dbcb5,
    switchSelectedClip: _0x555ab1,
    switchSelectedVideoResult: _0x24fc82,
  };
}
