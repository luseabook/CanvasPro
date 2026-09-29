import { clampRectGroupTranslation } from '../../core/math.js';
import {
  applyManualBoxPreview,
  createPersonReplacementBoxDragPreview,
  getPersonReplacementBoxDragDistance,
} from './personReplacementBoxDragPreview.js';
import {
  normalizePersonReplacementManualBoxEdit,
  normalizePersonReplacementManualSelection,
} from './personReplacementManualBox.js';
const MANUAL_SELECTION_DRAG_THRESHOLD_PX = 0x4,
  DETECTION_BOX_SELECTOR = '[data-person-replacement-person-drop]',
  EDITABLE_DETECTION_BOX_SELECTOR = '.person-replacement-detection-box[data-person-id]',
  KEYBOARD_SELECTED_CLASS = 'is-keyboard-selected',
  BATCH_SELECTED_CLASS = 'is-batch-selected',
  FRONTMOST_CLASS = 'is-frontmost';
function normalizeText(_0x5ff2e9, _0x4875e3 = '') {
  const _0x19f374 = String(_0x5ff2e9 ?? '')['trim']();
  return _0x19f374 || _0x4875e3;
}
function clamp(_0x8c413f, _0x2e0a1e, _0x5351fb, _0x34506f = _0x2e0a1e) {
  const _0xf7791 = Number(_0x8c413f);
  return Number['isFinite'](_0xf7791) ? Math['min'](_0x5351fb, Math['max'](_0x2e0a1e, _0xf7791)) : _0x34506f;
}
function requireFunction(_0x66e3c2, _0x36b2de, _0x532f91) {
  if (typeof _0x532f91 !== 'function') throw new TypeError(_0x66e3c2 + ' requires ' + _0x36b2de + '.');
}
export function createPersonReplacementPersonBoxInteractionController({
  getRoot: _0xfc6ce6,
  getProject: _0x36a270,
  requestRender: _0xf9464f,
  runRequest: _0x45ae6d,
  updateStageA11y: _0x58d345,
  onDeletePeopleRequested: _0x1b7544,
  onManualPersonSelected: _0x4f9e78,
  onUpdatePeopleRequested: _0x6fed09,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'] || globalThis,
} = {}) {
  const _0x5ac5e8 = 'Person replacement person-box interaction';
  (requireFunction(_0x5ac5e8, 'getRoot', _0xfc6ce6),
    requireFunction(_0x5ac5e8, 'getProject', _0x36a270),
    requireFunction(_0x5ac5e8, 'requestRender', _0xf9464f),
    requireFunction(_0x5ac5e8, 'runRequest', _0x45ae6d),
    requireFunction(_0x5ac5e8, 'updateStageA11y', _0x58d345));
  let _0x5e68fa = ![],
    _0x4225b5 = null,
    _0x1c9cb0 = null,
    _0x488444 = '',
    _0x25a8a4 = '',
    _0x3b4938 = new Set(),
    _0x175cdb = '';
  const _0x1a6216 = () => _0xfc6ce6() || null,
    _0x4efd94 = () => _0x36a270() || {};
  function _0x13257a(_0x1c2bf3) {
    const _0x331387 = normalizeText(_0x1c2bf3?.['dataset']?.['shotId']),
      _0x7a22c5 = normalizeText(_0x1c2bf3?.['dataset']?.['personId']);
    return _0x331387 && _0x7a22c5 ? _0x331387 + '\x1f' + _0x7a22c5 : '';
  }
  function _0x355880(_0x1cbd8e, _0x234735) {
    const _0x1f95e6 = _0x234735?.['getBoundingClientRect']?.(),
      _0x385812 = Math['max'](0x1, Number(_0x1f95e6?.['width']) || Number(_0x234735?.['clientWidth']) || 0x1),
      _0x334426 = Math['max'](
        0x1,
        Number(_0x1f95e6?.['height']) || Number(_0x234735?.['clientHeight']) || 0x1,
      );
    return {
      x: clamp(
        (Number(_0x1cbd8e?.['clientX']) - Number(_0x1f95e6?.['left'] || 0x0)) / _0x385812,
        0x0,
        0x1,
        0x0,
      ),
      y: clamp(
        (Number(_0x1cbd8e?.['clientY']) - Number(_0x1f95e6?.['top'] || 0x0)) / _0x334426,
        0x0,
        0x1,
        0x0,
      ),
    };
  }
  function _0x268129() {
    const _0xcbdc5a = Boolean(_0x488444 && _0x25a8a4);
    return (
      (_0x488444 = ''),
      (_0x25a8a4 = ''),
      _0x1a6216()
        ?.['querySelectorAll']?.('.person-replacement-detection-box.' + KEYBOARD_SELECTED_CLASS)
        ?.['forEach']?.((_0x472e4d) => {
          _0x472e4d['classList']?.['remove']?.(KEYBOARD_SELECTED_CLASS);
        }),
      _0xcbdc5a
    );
  }
  function _0x1093ae(_0x245f47, { focus: focus = !![] } = {}) {
    const _0xcc1f55 = _0x4efd94(),
      _0x1c1ae9 = normalizeText(
        _0x245f47?.['dataset']?.['shotId'] || _0xcc1f55['workspace']?.['selectedShotId'],
      ),
      _0x2333e1 = normalizeText(_0x245f47?.['dataset']?.['personId']);
    if (!_0x1c1ae9 || !_0x2333e1) return ![];
    ((_0x488444 = _0x1c1ae9),
      (_0x25a8a4 = _0x2333e1),
      _0x1a6216()
        ?.['querySelectorAll']?.('.person-replacement-detection-box.' + KEYBOARD_SELECTED_CLASS)
        ?.['forEach']?.((_0xd5344f) => {
          if (_0xd5344f === _0x245f47) return;
          _0xd5344f['classList']?.['remove']?.(KEYBOARD_SELECTED_CLASS);
        }),
      _0x245f47['classList']?.['add']?.(KEYBOARD_SELECTED_CLASS));
    if (focus)
      try {
        _0x245f47['focus']?.({ preventScroll: !![] });
      } catch {
        _0x245f47['focus']?.();
      }
    return !![];
  }
  function _0x530185() {
    const _0x293fe2 = Array['from'](_0x1a6216()?.['querySelectorAll']?.(DETECTION_BOX_SELECTOR) || []);
    _0x293fe2['forEach']((_0x5deb97) => {
      _0x5deb97['classList']?.['remove']?.(FRONTMOST_CLASS);
    });
    if (!_0x175cdb) return;
    const _0x249a46 = _0x293fe2['find']((_0x2d8797) => _0x13257a(_0x2d8797) === _0x175cdb);
    if (!_0x249a46) {
      _0x175cdb = '';
      return;
    }
    _0x249a46['classList']?.['add']?.(FRONTMOST_CLASS);
  }
  function _0x58966f(_0x5e42b2) {
    const _0x14e423 = _0x13257a(_0x5e42b2);
    if (!_0x14e423) return ![];
    return ((_0x175cdb = _0x14e423), _0x530185(), !![]);
  }
  function _0x1be93a() {
    const _0xaf1f68 = Array['from'](_0x1a6216()?.['querySelectorAll']?.(DETECTION_BOX_SELECTOR) || []),
      _0x30739b = new Set(_0xaf1f68['map'](_0x13257a)['filter'](Boolean));
    ((_0x3b4938 = new Set([..._0x3b4938]['filter']((_0x493642) => _0x30739b['has'](_0x493642)))),
      _0xaf1f68['forEach']((_0x5e3f16) => {
        _0x5e3f16['classList']?.['toggle']?.(BATCH_SELECTED_CLASS, _0x3b4938['has'](_0x13257a(_0x5e3f16)));
      }));
  }
  function _0x113114() {
    if (!_0x3b4938['size']) return ![];
    return ((_0x3b4938 = new Set()), _0x1be93a(), !![]);
  }
  function _0x15bf17(_0x5251b8, _0x570459 = []) {
    const _0x1deb86 = normalizeText(_0x5251b8);
    return (
      (_0x3b4938 = new Set(
        (Array['isArray'](_0x570459) ? _0x570459 : [])
          ['map'](normalizeText)
          ['filter'](Boolean)
          ['map']((_0x3750d1) => _0x1deb86 + '\x1f' + _0x3750d1),
      )),
      _0x268129(),
      _0x1be93a(),
      _0x3b4938['size'] > 0x0
    );
  }
  function _0x1ed7ef() {
    const _0x279e9f = [],
      _0xc90331 = _0x4efd94();
    return (
      (Array['isArray'](_0xc90331['shots']) ? _0xc90331['shots'] : [])['forEach']((_0x5d1987) => {
        (Array['isArray'](_0x5d1987['people']) ? _0x5d1987['people'] : [])['forEach']((_0x579ac6) => {
          const _0x5c49ba = _0x5d1987['id'] + '\x1f' + _0x579ac6['id'];
          _0x3b4938['has'](_0x5c49ba) && _0x279e9f['push']({ shotId: _0x5d1987['id'], person: _0x579ac6 });
        });
      }),
      _0x279e9f
    );
  }
  function _0x4c327f() {
    const _0x288dcb = _0x1a6216()?.['querySelector']?.('[data-story-marquee-surface=\x22people\x22]');
    try {
      _0x288dcb?.['focus']?.({ preventScroll: !![] });
    } catch {
      _0x288dcb?.['focus']?.();
    }
  }
  function _0x24cb54(_0x557f38) {
    const _0xd2b0cc = _0x1c9cb0;
    if (!_0xd2b0cc) return null;
    const _0x3ad428 = getPersonReplacementBoxDragDistance(_0x557f38, _0xd2b0cc);
    if (!_0xd2b0cc['hasDragged'] && _0x3ad428 < MANUAL_SELECTION_DRAG_THRESHOLD_PX)
      return _0xd2b0cc['items']['map']((_0x4bce8d) => _0x4bce8d['originalBox']);
    _0xd2b0cc['hasDragged'] = !![];
    const _0xec4f17 = _0x355880(_0x557f38, _0xd2b0cc['stage']),
      _0x270cba = {
        x: _0xec4f17['x'] - _0xd2b0cc['start']['x'],
        y: _0xec4f17['y'] - _0xd2b0cc['start']['y'],
      },
      _0x5e3ad7 = _0xd2b0cc['isBatchMove']
        ? clampRectGroupTranslation(
            _0xd2b0cc['items']['map']((_0x283e86) => _0x283e86['originalBox']),
            _0x270cba['x'],
            _0x270cba['y'],
          )
        : _0x270cba;
    return (
      _0xd2b0cc['items']['forEach']((_0x4338dd) => {
        ((_0x4338dd['currentBox'] = normalizePersonReplacementManualBoxEdit(
          _0x4338dd['originalBox'],
          _0x5e3ad7,
          _0xd2b0cc['mode'],
        )),
          applyManualBoxPreview(_0x4338dd['element'], _0x4338dd['currentBox']));
      }),
      _0xd2b0cc['items']['map']((_0x47cc96) => _0x47cc96['currentBox'])
    );
  }
  function _0x4741a4(_0x136fd3, { cancelled: cancelled = ![] } = {}) {
    const _0x1fa6b5 = _0x1c9cb0;
    if (!_0x1fa6b5) return ![];
    if (!cancelled && _0x136fd3) _0x24cb54(_0x136fd3);
    ((_0x1c9cb0 = null), _0x1fa6b5['cleanup']?.());
    if (cancelled)
      return (
        _0x1fa6b5['items']['forEach']((_0x51f363) => {
          applyManualBoxPreview(_0x51f363['element'], _0x51f363['originalBox']);
        }),
        !![]
      );
    if (!_0x1fa6b5['hasDragged']) return !![];
    _0x6fed09({
      shotId: _0x1fa6b5['shotId'],
      updates: _0x1fa6b5['items']['map']((_0x2ac56f) => ({
        personId: _0x2ac56f['personId'],
        bbox: _0x2ac56f['currentBox'],
      })),
    });
    if (_0x1fa6b5['isBatchMove']) _0x4c327f();
    return !![];
  }
  function _0x54957e(_0x23aff8, _0xbd5695, { batch: batch = ![] } = {}) {
    if (_0x1c9cb0 || Number(_0x23aff8?.['button']) > 0x0 || !_0xbd5695) return ![];
    const _0xcadf82 = _0x4efd94(),
      _0x85cc04 = normalizeText(
        _0xbd5695['dataset']?.['shotId'] || _0xcadf82['workspace']?.['selectedShotId'],
      ),
      _0x29b840 = normalizeText(_0xbd5695['dataset']?.['personId']),
      _0x59378a = (Array['isArray'](_0xcadf82['shots']) ? _0xcadf82['shots'] : [])['find'](
        (_0x313afc) => _0x313afc['id'] === _0x85cc04,
      ),
      _0x3660dc = _0x59378a?.['people']?.['find']((_0x3814bd) => _0x3814bd['id'] === _0x29b840),
      _0x3da5c3 = _0x3660dc?.['locator']?.['bbox'] || _0x3660dc?.['bbox'],
      _0x52c77f = _0xbd5695['closest']?.('[data-person-replacement-keyframe-stage]'),
      _0x4bd27b = batch && _0x3b4938['has'](_0x13257a(_0xbd5695));
    if (!_0x52c77f || !_0x3da5c3) return ![];
    if (!_0x4bd27b) _0x1093ae(_0xbd5695);
    const _0x435f16 = _0x355880(_0x23aff8, _0x52c77f),
      _0x293958 = _0x4bd27b
        ? 'move'
        : normalizeText(
            _0x23aff8['target']?.['closest']?.('[data-person-replacement-manual-resize]')?.['dataset']?.[
              'personReplacementManualResize'
            ],
            'move',
          ),
      _0x58908f = _0x4bd27b
        ? Array['from'](
            _0x52c77f['querySelectorAll']?.(
              '.person-replacement-detection-box.is-batch-selected[data-person-id]',
            ) || [],
          )
            ['map']((_0x111775) => {
              const _0x52cdaf = normalizeText(_0x111775['dataset']?.['personId']),
                _0x1f9505 = _0x59378a?.['people']?.['find']((_0x58f831) => _0x58f831['id'] === _0x52cdaf),
                _0x5d4066 = _0x1f9505?.['locator']?.['bbox'] || _0x1f9505?.['bbox'];
              return _0x5d4066
                ? {
                    personId: _0x52cdaf,
                    element: _0x111775,
                    originalBox: { ..._0x5d4066 },
                    currentBox: { ..._0x5d4066 },
                  }
                : null;
            })
            ['filter'](Boolean)
        : [
            {
              personId: _0x29b840,
              element: _0xbd5695,
              originalBox: { ..._0x3da5c3 },
              currentBox: { ..._0x3da5c3 },
            },
          ];
    if (!_0x58908f['length']) return ![];
    const _0x31b763 = createPersonReplacementBoxDragPreview({
        getSession: () => _0x1c9cb0,
        applyPreview: _0x24cb54,
        threshold: MANUAL_SELECTION_DRAG_THRESHOLD_PX,
        windowObject: windowObject,
      }),
      _0x1809f6 = _0x31b763['schedule'],
      _0x471471 = (_0x50805c) => _0x4741a4(_0x50805c),
      _0x4c4ec4 = () => _0x4741a4(null, { cancelled: !![] });
    return (
      windowObject?.['addEventListener']?.('pointermove', _0x1809f6),
      windowObject?.['addEventListener']?.('pointerup', _0x471471, { once: !![] }),
      windowObject?.['addEventListener']?.('pointercancel', _0x4c4ec4, { once: !![] }),
      (_0x1c9cb0 = {
        shotId: _0x85cc04,
        stage: _0x52c77f,
        mode: _0x293958,
        isBatchMove: _0x4bd27b,
        start: _0x435f16,
        startClientX: Number['isFinite'](Number(_0x23aff8?.['clientX'])) ? Number(_0x23aff8['clientX']) : 0x0,
        startClientY: Number['isFinite'](Number(_0x23aff8?.['clientY'])) ? Number(_0x23aff8['clientY']) : 0x0,
        hasDragged: ![],
        items: _0x58908f,
        cleanup: () => {
          (_0x31b763['cancel'](),
            windowObject?.['removeEventListener']?.('pointermove', _0x1809f6),
            windowObject?.['removeEventListener']?.('pointerup', _0x471471),
            windowObject?.['removeEventListener']?.('pointercancel', _0x4c4ec4));
        },
      }),
      _0x23aff8['preventDefault']?.(),
      _0x23aff8['stopPropagation']?.(),
      !![]
    );
  }
  function _0xb91c07(_0x5e4428) {
    const _0x347781 = _0x4225b5;
    if (!_0x347781?.['preview']) return;
    const _0x2b078d = normalizePersonReplacementManualSelection(_0x347781['start'], _0x5e4428);
    if (!_0x2b078d) return;
    (_0x347781['preview']['style']?.['setProperty']?.('--selection-x', _0x2b078d['x'] * 0x64 + '%'),
      _0x347781['preview']['style']?.['setProperty']?.('--selection-y', _0x2b078d['y'] * 0x64 + '%'),
      _0x347781['preview']['style']?.['setProperty']?.('--selection-width', _0x2b078d['width'] * 0x64 + '%'),
      _0x347781['preview']['style']?.['setProperty']?.(
        '--selection-height',
        _0x2b078d['height'] * 0x64 + '%',
      ));
  }
  function _0x1e2219(_0x146b31, { cancelled: cancelled = ![] } = {}) {
    const _0x40c3e1 = _0x4225b5;
    if (!_0x40c3e1) return ![];
    ((_0x4225b5 = null), _0x40c3e1['cleanup']?.(), (_0x5e68fa = ![]));
    const _0x2cbd2e = _0x146b31
        ? Math['hypot'](
            Number(_0x146b31['clientX']) - _0x40c3e1['startClientX'],
            Number(_0x146b31['clientY']) - _0x40c3e1['startClientY'],
          )
        : 0x0,
      _0x1a15cf = _0x40c3e1['hasDragged'] || _0x2cbd2e >= MANUAL_SELECTION_DRAG_THRESHOLD_PX;
    if (!cancelled && !_0x1a15cf) return (_0xf9464f(), !![]);
    const _0x375680 = _0x355880(_0x146b31, _0x40c3e1['stage']),
      _0x113815 = cancelled ? null : normalizePersonReplacementManualSelection(_0x40c3e1['start'], _0x375680);
    if (_0x113815) _0x45ae6d(_0x4f9e78, { shotId: _0x40c3e1['shotId'], bbox: _0x113815 });
    else !cancelled && windowObject?.['showToast']?.('框选范围太小，请完整框住需要替换的主体。', 'info');
    return (_0xf9464f(), !![]);
  }
  function _0x280fbd(_0x4f6269, _0x2b19e6) {
    if (!_0x5e68fa || _0x4225b5 || !_0x2b19e6) return ![];
    const _0x5cdc1d = _0x4efd94(),
      _0x4ca60e = _0x355880(_0x4f6269, _0x2b19e6),
      _0x297406 = documentObject?.['createElement']?.('div') || null;
    _0x297406 &&
      ((_0x297406['className'] = 'person-replacement-manual-selection-preview'),
      _0x2b19e6['appendChild']?.(_0x297406));
    const _0x2b7efa = (_0x4db9fa) => {
        if (
          Math['hypot'](
            Number(_0x4db9fa['clientX']) - Number(_0x4f6269['clientX']),
            Number(_0x4db9fa['clientY']) - Number(_0x4f6269['clientY']),
          ) >= MANUAL_SELECTION_DRAG_THRESHOLD_PX
        ) {
          if (_0x4225b5) _0x4225b5['hasDragged'] = !![];
        }
        _0xb91c07(_0x355880(_0x4db9fa, _0x2b19e6));
      },
      _0x2ce144 = (_0x4b07a1) => _0x1e2219(_0x4b07a1),
      _0x4bead3 = () => _0x1e2219(_0x4f6269, { cancelled: !![] });
    return (
      windowObject?.['addEventListener']?.('pointermove', _0x2b7efa),
      windowObject?.['addEventListener']?.('pointerup', _0x2ce144, { once: !![] }),
      windowObject?.['addEventListener']?.('pointercancel', _0x4bead3, { once: !![] }),
      (_0x4225b5 = {
        shotId: normalizeText(_0x2b19e6['dataset']?.['shotId'] || _0x5cdc1d['workspace']?.['selectedShotId']),
        stage: _0x2b19e6,
        start: _0x4ca60e,
        startClientX: Number(_0x4f6269['clientX']),
        startClientY: Number(_0x4f6269['clientY']),
        hasDragged: ![],
        preview: _0x297406,
        cleanup: () => {
          (windowObject?.['removeEventListener']?.('pointermove', _0x2b7efa),
            windowObject?.['removeEventListener']?.('pointerup', _0x2ce144),
            windowObject?.['removeEventListener']?.('pointercancel', _0x4bead3),
            _0x297406?.['remove']?.());
        },
      }),
      _0xb91c07(_0x4ca60e),
      _0x4f6269['preventDefault']?.(),
      _0x4f6269['stopPropagation']?.(),
      !![]
    );
  }
  function _0x3fa2fe() {
    if (_0x4225b5) return _0x1e2219(null, { cancelled: !![] });
    if (!_0x5e68fa) return ![];
    return ((_0x5e68fa = ![]), _0xf9464f(), !![]);
  }
  function _0x4d348c(_0x3d4ae5) {
    return ((_0x5e68fa = _0x3d4ae5 === !![]), _0x5e68fa);
  }
  function _0x1ffdfa() {
    if (!_0x488444 || !_0x25a8a4) return ![];
    const _0x41d976 = _0x4efd94(),
      _0x4a49b6 = (Array['isArray'](_0x41d976['shots']) ? _0x41d976['shots'] : [])['some'](
        (_0x24ba66) =>
          _0x24ba66['id'] === _0x488444 &&
          _0x24ba66['people']?.['some']((_0x1efcc5) => _0x1efcc5['id'] === _0x25a8a4),
      ),
      _0x286fd4 = _0x4a49b6
        ? Array['from'](_0x1a6216()?.['querySelectorAll']?.(EDITABLE_DETECTION_BOX_SELECTOR) || [])['find'](
            (_0x3a31df) =>
              _0x3a31df['dataset']?.['shotId'] === _0x488444 &&
              _0x3a31df['dataset']?.['personId'] === _0x25a8a4,
          )
        : null;
    if (_0x286fd4) return _0x1093ae(_0x286fd4);
    return (_0x268129(), ![]);
  }
  function _0x1c9f03() {
    (_0x530185(), _0x1be93a());
  }
  function _0x555c8f({ manualSelectionSurfaceActive: _0x373a2f } = {}) {
    typeof _0x373a2f === 'boolean' && _0x4d348c(_0x373a2f);
    _0x1c9f03();
    if (_0x5e68fa) {
      const _0x33a049 = _0x1a6216()?.['querySelector']?.('[data-person-replacement-keyframe-stage]');
      (_0x33a049?.['classList']?.['add']?.('is-manual-selecting'), _0x58d345(_0x33a049));
    }
    _0x1ffdfa();
  }
  function _0x410c48(_0x5c8440) {
    return (
      _0x5c8440?.['key'] === 'Delete' ||
      _0x5c8440?.['key'] === 'Del' ||
      _0x5c8440?.['code'] === 'Delete' ||
      normalizeText(_0x5c8440?.['key'])['toLowerCase']() === 'd' ||
      _0x5c8440?.['code'] === 'KeyD'
    );
  }
  function _0x2e307c() {
    const _0x1c82f9 = _0x4efd94(),
      _0x509eca = (Array['isArray'](_0x1c82f9['shots']) ? _0x1c82f9['shots'] : [])['find'](
        (_0x565dc7) => _0x565dc7['id'] === _0x488444,
      ),
      _0x34e2ef = _0x509eca?.['people']?.['find']((_0x100bff) => _0x100bff['id'] === _0x25a8a4);
    return _0x34e2ef ? { shot: _0x509eca, person: _0x34e2ef } : null;
  }
  function _0xf2a253(
    _0x4f3e93,
    { deletionEnabled: deletionEnabled = ![], isEditableTarget: isEditableTarget = ![] } = {},
  ) {
    const _0x57d266 = _0x1ed7ef(),
      _0x1b5297 = new Set(_0x57d266['map']((_0x4910f5) => _0x4910f5['shotId']));
    if (
      _0x57d266['length'] &&
      _0x1b5297['size'] === 0x1 &&
      deletionEnabled &&
      !isEditableTarget &&
      !_0x4f3e93?.['repeat'] &&
      !_0x4f3e93?.['ctrlKey'] &&
      !_0x4f3e93?.['metaKey'] &&
      !_0x4f3e93?.['altKey'] &&
      _0x410c48(_0x4f3e93)
    ) {
      const [_0x41c395] = _0x1b5297,
        _0x5633ae = _0x57d266['map']((_0x2d47ff) => _0x2d47ff['person']['id']);
      return (
        _0x4f3e93['preventDefault']?.(),
        _0x4f3e93['stopPropagation']?.(),
        _0x113114(),
        _0x45ae6d(_0x1b7544, { shotId: _0x41c395, personIds: _0x5633ae }),
        !![]
      );
    }
    if (_0x57d266['length'] && !isEditableTarget && _0x4f3e93?.['key'] === 'Escape')
      return (_0x4f3e93['preventDefault']?.(), _0x4f3e93['stopPropagation']?.(), _0x113114(), !![]);
    const _0x2b2a27 = _0x2e307c();
    if (
      _0x2b2a27 &&
      deletionEnabled &&
      !isEditableTarget &&
      !_0x4f3e93?.['repeat'] &&
      !_0x4f3e93?.['ctrlKey'] &&
      !_0x4f3e93?.['metaKey'] &&
      !_0x4f3e93?.['altKey'] &&
      _0x410c48(_0x4f3e93)
    )
      return (
        _0x4f3e93['preventDefault']?.(),
        _0x4f3e93['stopPropagation']?.(),
        _0x268129(),
        _0x45ae6d(_0x1b7544, { shotId: _0x2b2a27['shot']['id'], personIds: [_0x2b2a27['person']['id']] }),
        !![]
      );
    return ![];
  }
  function _0x594cde(_0x1354b4) {
    if (_0x1c9cb0)
      return (
        _0x1354b4?.['preventDefault']?.(),
        _0x1354b4?.['stopPropagation']?.(),
        _0x4741a4(null, { cancelled: !![] }),
        !![]
      );
    if (_0x5e68fa || _0x4225b5)
      return (_0x1354b4?.['preventDefault']?.(), _0x1354b4?.['stopPropagation']?.(), _0x3fa2fe(), !![]);
    return ![];
  }
  function _0x2c27a0() {
    if (_0x1c9cb0) _0x4741a4(null, { cancelled: !![] });
    if (_0x4225b5) {
      const _0xc5c1ff = _0x4225b5;
      ((_0x4225b5 = null), _0xc5c1ff['cleanup']?.());
    }
    ((_0x5e68fa = ![]), (_0x3b4938 = new Set()), (_0x488444 = ''), (_0x25a8a4 = ''), (_0x175cdb = ''));
  }
  return Object['freeze']({
    beginBoxEdit: _0x54957e,
    beginManualSelection: _0x280fbd,
    bringBoxToFront: _0x58966f,
    cancelManualSelection: _0x3fa2fe,
    clearBatchSelection: _0x113114,
    clearKeyboardSelection: _0x268129,
    destroy: _0x2c27a0,
    focusBatchSelectionStage: _0x4c327f,
    handleEscape: _0x594cde,
    handleSelectionKeyDown: _0xf2a253,
    isManualSelectionActive: () => _0x5e68fa,
    restoreLayerState: _0x1c9f03,
    selectBatch: _0x15bf17,
    selectBox: _0x1093ae,
    setManualSelectionActive: _0x4d348c,
    syncAfterRender: _0x555c8f,
  });
}
