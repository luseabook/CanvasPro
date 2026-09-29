import {
  activateStoryPromptDropSelection,
  getStoryPromptDropRange,
  resolveStoryAssetDragPreview,
  STORY_ASSET_DRAG_PREVIEW_POINTER_GAP,
} from './storyAssetDrag.js';
function normalizeText(_0x91bb) {
  return String(_0x91bb || '')['trim']();
}
export function createStoryAssetPromptDragController({
  root: _0x423661,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
  insertMention: insertMention = () => ![],
  hideHoverPreview: hideHoverPreview = () => {},
} = {}) {
  let _0x10f9c3 = null,
    _0x2afcaf = null,
    _0x20cef7 = null,
    _0x97a97f = null;
  function _0xbb54d8(_0x2a7ba2) {
    const _0x3d07f3 = resolveStoryAssetDragPreview(_0x2a7ba2),
      _0x354a95 = _0x3d07f3['element'];
    if (!_0x354a95 || !documentObject?.['createElement']) return null;
    const _0x466aef =
        _0x354a95['getBoundingClientRect']?.() || _0x2a7ba2?.['getBoundingClientRect']?.() || {},
      _0x320b81 = Math['max'](0x1, Number(_0x466aef['width']) || 0x80),
      _0x4543c6 = Math['max'](0x1, Number(_0x466aef['height']) || _0x320b81),
      _0x2cde06 = Math['min'](0xa0, Math['max'](0x60, _0x320b81)),
      _0x40fd40 = Math['max'](0x36, Math['round']((_0x2cde06 * _0x4543c6) / _0x320b81)),
      _0x12fac5 = documentObject['createElement']('div');
    ((_0x12fac5['className'] = 'story-asset-drag-preview'),
      (_0x12fac5['dataset']['storyAssetDragMediaType'] = _0x3d07f3['mediaType']),
      _0x12fac5['setAttribute']('aria-hidden', 'true'),
      (_0x12fac5['style']['width'] = Math['round'](_0x2cde06) + 'px'),
      (_0x12fac5['style']['height'] = Math['round'](_0x40fd40) + 'px'));
    let _0x487c5a = null;
    if (_0x3d07f3['url'])
      ((_0x487c5a = documentObject['createElement']('img')),
        (_0x487c5a['src'] = _0x3d07f3['url']),
        (_0x487c5a['alt'] = ''),
        (_0x487c5a['draggable'] = ![]));
    else {
      if (_0x3d07f3['mediaType'] === 'video') {
        const _0x3a2aaf = documentObject['createElement']('canvas'),
          _0x29a05a = Math['max'](0x1, Math['trunc'](Number(_0x354a95['videoWidth']) || _0x320b81)),
          _0x15bd18 = Math['max'](0x1, Math['trunc'](Number(_0x354a95['videoHeight']) || _0x4543c6));
        ((_0x3a2aaf['width'] = _0x29a05a), (_0x3a2aaf['height'] = _0x15bd18));
        try {
          const _0x553fd0 = _0x3a2aaf['getContext']?.('2d');
          _0x553fd0?.['drawImage']?.(_0x354a95, 0x0, 0x0, _0x29a05a, _0x15bd18);
          if (_0x553fd0) _0x487c5a = _0x3a2aaf;
        } catch {
          _0x487c5a = null;
        }
        if (!_0x487c5a && typeof _0x354a95['cloneNode'] === 'function') {
          ((_0x487c5a = _0x354a95['cloneNode'](!![])),
            (_0x487c5a['muted'] = !![]),
            _0x487c5a['removeAttribute']?.('controls'));
          try {
            _0x487c5a['currentTime'] = Number(_0x354a95['currentTime']) || 0x0;
          } catch {}
        }
      } else typeof _0x354a95['cloneNode'] === 'function' && (_0x487c5a = _0x354a95['cloneNode'](!![]));
    }
    if (!_0x487c5a) return null;
    return (
      _0x12fac5['appendChild'](_0x487c5a),
      documentObject['body']?.['appendChild']?.(_0x12fac5),
      (_0x2afcaf = _0x12fac5),
      _0x12fac5
    );
  }
  function _0x4e52a9(_0x7deb79) {
    if (!_0x2afcaf) return;
    const _0x49b320 = Number(_0x7deb79?.['clientX']) || 0x0,
      _0x5406a8 = Number(_0x7deb79?.['clientY']) || 0x0,
      _0x51ace7 = _0x2afcaf['getBoundingClientRect']?.() || {},
      _0x1cab22 = Math['max'](
        0x1,
        Number(_0x51ace7['width']) || Number['parseFloat'](_0x2afcaf['style']['width']) || 0x1,
      ),
      _0x599e9e = Math['max'](
        0x1,
        Number(_0x51ace7['height']) || Number['parseFloat'](_0x2afcaf['style']['height']) || 0x1,
      ),
      _0x50539a = Number(windowObject?.['innerWidth']) || Number['POSITIVE_INFINITY'],
      _0x2000b8 = Number(windowObject?.['innerHeight']) || Number['POSITIVE_INFINITY'],
      _0x72a89a = 0x8;
    let _0x504752 = _0x49b320 + STORY_ASSET_DRAG_PREVIEW_POINTER_GAP,
      _0x5428c6 = _0x5406a8 + STORY_ASSET_DRAG_PREVIEW_POINTER_GAP;
    (_0x504752 + _0x1cab22 > _0x50539a - _0x72a89a &&
      (_0x504752 = _0x49b320 - _0x1cab22 - STORY_ASSET_DRAG_PREVIEW_POINTER_GAP),
      _0x5428c6 + _0x599e9e > _0x2000b8 - _0x72a89a &&
        (_0x5428c6 = _0x5406a8 - _0x599e9e - STORY_ASSET_DRAG_PREVIEW_POINTER_GAP),
      (_0x504752 = Math['max'](_0x72a89a, _0x504752)),
      (_0x5428c6 = Math['max'](_0x72a89a, _0x5428c6)),
      (_0x2afcaf['style']['transform'] = 'translate3d(' + _0x504752 + 'px,\x20' + _0x5428c6 + 'px, 0)'));
  }
  function _0x55664f() {
    (_0x97a97f?.['classList']?.['remove']('is-story-asset-drop-caret-active'), (_0x97a97f = null));
    if (_0x20cef7) _0x20cef7['hidden'] = !![];
  }
  function _0x35e976() {
    ((_0x10f9c3 = null),
      _0x2afcaf?.['remove']?.(),
      (_0x2afcaf = null),
      _0x55664f(),
      _0x423661?.['querySelectorAll']?.('.is-story-asset-dragging')?.['forEach']?.((_0x20c1e5) => {
        _0x20c1e5['classList']['remove']('is-story-asset-dragging');
      }),
      _0x423661?.['querySelectorAll']?.('.is-story-asset-drop-target')?.['forEach']?.((_0x23fda6) => {
        _0x23fda6['classList']['remove']('is-story-asset-drop-target');
      }));
  }
  function _0x2854ba(_0x243a6e) {
    const _0x38e449 = _0x243a6e['target']?.['closest']?.('[data-story-clip-prompt-surface]');
    if (_0x38e449) return _0x38e449;
    return (
      documentObject['elementFromPoint']?.(
        Number(_0x243a6e['clientX']) || 0x0,
        Number(_0x243a6e['clientY']) || 0x0,
      )?.['closest']?.('[data-story-clip-prompt-surface]') || null
    );
  }
  function _0x4507cd(_0x2cd96a, _0x3af6f0) {
    const _0x19f906 = getStoryPromptDropRange(
      documentObject,
      _0x2cd96a,
      _0x3af6f0['clientX'],
      _0x3af6f0['clientY'],
    );
    if (!_0x19f906) return (_0x55664f(), null);
    (activateStoryPromptDropSelection(windowObject, _0x2cd96a, _0x19f906),
      _0x97a97f?.['classList']?.['remove']('is-story-asset-drop-caret-active'),
      (_0x97a97f = _0x2cd96a),
      _0x2cd96a['classList']?.['add']('is-story-asset-drop-caret-active'));
    const _0x16afd3 = _0x19f906['getBoundingClientRect']?.(),
      _0x3903ff = _0x2cd96a['getBoundingClientRect']?.(),
      _0x2efcc7 = windowObject?.['getComputedStyle']?.(_0x2cd96a),
      _0x274c4f =
        Number['parseFloat'](_0x2efcc7?.['lineHeight']) ||
        (Number['parseFloat'](_0x2efcc7?.['fontSize']) || 0xe) * 1.5,
      _0x5692b2 = Math['max'](0x10, Math['min'](0x24, Number(_0x16afd3?.['height']) || _0x274c4f)),
      _0x1f3afe = Number['isFinite'](Number(_0x16afd3?.['left']))
        ? Number(_0x16afd3['left'])
        : Number(_0x3af6f0['clientX']) || 0x0,
      _0x26d98b =
        Number(_0x16afd3?.['height']) > 0x0
          ? Number(_0x16afd3['top'])
          : (Number(_0x3af6f0['clientY']) || 0x0) - _0x5692b2 / 0x2,
      _0x2b1b35 = Number(_0x3903ff?.['top']) + 0x4,
      _0x201dc0 = Number(_0x3903ff?.['bottom']) - _0x5692b2 - 0x4,
      _0xd8105b =
        Number['isFinite'](_0x2b1b35) && Number['isFinite'](_0x201dc0) && _0x201dc0 >= _0x2b1b35
          ? Math['max'](_0x2b1b35, Math['min'](_0x201dc0, _0x26d98b))
          : _0x26d98b;
    return (
      !_0x20cef7 &&
        ((_0x20cef7 = documentObject['createElement']('span')),
        (_0x20cef7['className'] = 'story-asset-drop-caret'),
        _0x20cef7['setAttribute']('aria-hidden', 'true'),
        _0x423661?.['appendChild']?.(_0x20cef7)),
      (_0x20cef7['style']['left'] = Math['round'](_0x1f3afe) + 'px'),
      (_0x20cef7['style']['top'] = Math['round'](_0xd8105b) + 'px'),
      (_0x20cef7['style']['height'] = Math['round'](_0x5692b2) + 'px'),
      (_0x20cef7['hidden'] = ![]),
      _0x19f906
    );
  }
  function _0x8a8067(_0x130973) {
    const _0x3a7cfb = _0x130973['target']?.['closest']?.('[data-story-reference-asset]'),
      _0x29414d = normalizeText(_0x3a7cfb?.['dataset']?.['storyReferenceAsset']),
      _0x23b6b1 = Math['max'](
        0x0,
        Math['trunc'](Number(_0x3a7cfb?.['dataset']?.['storyReferenceAssetIndex']) || 0x0),
      );
    if (!_0x3a7cfb || !_0x29414d || _0x130973['button'] !== 0x0) return ((_0x10f9c3 = null), ![]);
    return (
      (_0x10f9c3 = {
        assetId: _0x29414d,
        assetIndex: _0x23b6b1,
        element: _0x3a7cfb,
        pointerId: _0x130973['pointerId'],
        startX: Number(_0x130973['clientX']) || 0x0,
        startY: Number(_0x130973['clientY']) || 0x0,
        active: ![],
      }),
      (_0x3a7cfb['draggable'] = ![]),
      _0x3a7cfb['setPointerCapture']?.(_0x130973['pointerId']),
      !![]
    );
  }
  function _0x1c9b59(_0x2f49aa) {
    const _0xc3e942 = _0x10f9c3;
    if (!_0xc3e942 || _0xc3e942['pointerId'] !== _0x2f49aa['pointerId']) return ![];
    if (!_0xc3e942['active']) {
      const _0x1822f1 = (Number(_0x2f49aa['clientX']) || 0x0) - _0xc3e942['startX'],
        _0x2c2650 = (Number(_0x2f49aa['clientY']) || 0x0) - _0xc3e942['startY'];
      if (Math['hypot'](_0x1822f1, _0x2c2650) < 0x8) return ![];
      ((_0xc3e942['active'] = !![]),
        _0xc3e942['element']?.['classList']['add']('is-story-asset-dragging'),
        hideHoverPreview(),
        _0xbb54d8(_0xc3e942['element']));
    }
    (_0x4e52a9(_0x2f49aa),
      _0x423661?.['querySelectorAll']?.('.is-story-asset-drop-target')?.['forEach']?.((_0x25b612) => {
        _0x25b612['classList']['remove']('is-story-asset-drop-target');
      }));
    const _0x324ec6 = _0x2854ba(_0x2f49aa);
    _0x324ec6?.['classList']['add']('is-story-asset-drop-target');
    const _0x184971 = _0x324ec6?.['querySelector']?.('[data-story-clip-prompt]');
    _0xc3e942['triggerRange'] = _0x184971 ? _0x4507cd(_0x184971, _0x2f49aa) : null;
    if (!_0x324ec6) _0x55664f();
    return (_0x2f49aa['preventDefault']?.(), !![]);
  }
  function _0x3d3de1(_0x3754a6, { cancelled: cancelled = ![] } = {}) {
    const _0x5be490 = _0x10f9c3;
    if (!_0x5be490 || _0x5be490['pointerId'] !== _0x3754a6['pointerId']) return ![];
    const _0x195f5d = cancelled ? null : _0x2854ba(_0x3754a6),
      _0x530b81 = _0x5be490['active'] && Boolean(_0x195f5d);
    ((_0x10f9c3 = null), (_0x5be490['element']['draggable'] = !![]));
    _0x5be490['element']['hasPointerCapture']?.(_0x3754a6['pointerId']) &&
      _0x5be490['element']['releasePointerCapture'](_0x3754a6['pointerId']);
    if (!_0x5be490['active']) return ![];
    (_0x3754a6['preventDefault']?.(), _0x3754a6['stopPropagation']?.());
    const _0x3630e1 = _0x530b81 ? _0x195f5d['querySelector']?.('[data-story-clip-prompt]') : null,
      _0x226c98 = _0x530b81 ? _0x4507cd(_0x3630e1, _0x3754a6) || _0x5be490['triggerRange'] : null;
    return (
      _0x35e976(),
      _0x530b81 &&
        insertMention(_0x5be490['assetId'], { assetIndex: _0x5be490['assetIndex'], triggerRange: _0x226c98 }),
      !![]
    );
  }
  function _0x1226dc(_0x174365) {
    if (!_0x1c9b59(_0x174365)) return;
    _0x174365['stopPropagation']?.();
  }
  function _0xc80937(_0x308350) {
    _0x3d3de1(_0x308350);
  }
  function _0x57a14f(_0x4f183d) {
    if (_0x3d3de1(_0x4f183d, { cancelled: !![] })) return;
    if (_0x10f9c3?.['pointerId'] === _0x4f183d['pointerId']) _0x10f9c3 = null;
  }
  return Object['freeze']({
    begin: _0x8a8067,
    cancelSession: () => {
      _0x10f9c3 = null;
    },
    clear: _0x35e976,
    finish: _0x3d3de1,
    handleWindowPointerCancel: _0x57a14f,
    handleWindowPointerMove: _0x1226dc,
    handleWindowPointerUp: _0xc80937,
    hasSession: () => Boolean(_0x10f9c3),
    hideCaret: _0x55664f,
    isActive: () => _0x10f9c3?.['active'] === !![],
    showCaret: _0x4507cd,
  });
}
