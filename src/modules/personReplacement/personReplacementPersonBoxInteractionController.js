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
const MANUAL_SELECTION_DRAG_THRESHOLD_PX = 4,
  DETECTION_BOX_SELECTOR = '[data-person-replacement-person-drop]',
  EDITABLE_DETECTION_BOX_SELECTOR = '.person-replacement-detection-box[data-person-id]',
  KEYBOARD_SELECTED_CLASS = 'is-keyboard-selected',
  BATCH_SELECTED_CLASS = 'is-batch-selected',
  FRONTMOST_CLASS = 'is-frontmost';
function normalizeText(value, item = '') {
  const key = String(value ?? '')['trim']();
  return key || item;
}
function clamp(index, result, data, options = result) {
  const target = Number(index);
  return Number['isFinite'](target) ? Math['min'](data, Math['max'](result, target)) : options;
}
function requireFunction(source, next, current) {
  if (typeof current !== 'function') throw new TypeError(source + ' requires ' + next + '.');
}
export function createPersonReplacementPersonBoxInteractionController({
  getRoot: getRoot,
  getProject: getProject,
  requestRender: requestRender,
  runRequest: runRequest,
  updateStageA11y: updateStageA11y,
  onDeletePeopleRequested: onDeletePeopleRequested,
  onManualPersonSelected: onManualPersonSelected,
  onUpdatePeopleRequested: onUpdatePeopleRequested,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'] || globalThis,
} = {}) {
  const entry = 'Person replacement person-box interaction';
  (requireFunction(entry, 'getRoot', getRoot),
    requireFunction(entry, 'getProject', getProject),
    requireFunction(entry, 'requestRender', requestRender),
    requireFunction(entry, 'runRequest', runRequest),
    requireFunction(entry, 'updateStageA11y', updateStageA11y));
  let enabled = ![],
    value2 = null,
    value3 = null,
    enabled2 = '',
    enabled3 = '',
    map = new Set(),
    enabled4 = '';
  const run = () => getRoot() || null,
    handler = () => getProject() || {};
  function run2(el) {
    const text = normalizeText(el?.['dataset']?.['shotId']),
      text2 = normalizeText(el?.['dataset']?.['personId']);
    return text && text2 ? text + '\x1f' + text2 : '';
  }
  function run3(event, el2) {
    const box = el2?.['getBoundingClientRect']?.(),
      record = Math['max'](1, Number(box?.['width']) || Number(el2?.['clientWidth']) || 1),
      payload = Math['max'](1, Number(box?.['height']) || Number(el2?.['clientHeight']) || 1);
    return {
      x: clamp((Number(event?.['clientX']) - Number(box?.['left'] || 0)) / record, 0, 1, 0),
      y: clamp((Number(event?.['clientY']) - Number(box?.['top'] || 0)) / payload, 0, 1, 0),
    };
  }
  function clearKeyboardSelection() {
    const handle = Boolean(enabled2 && enabled3);
    return (
      (enabled2 = ''),
      (enabled3 = ''),
      run()
        ?.['querySelectorAll']?.('.person-replacement-detection-box.' + KEYBOARD_SELECTED_CLASS)
        ?.['forEach']?.((el3) => {
          el3['classList']?.['remove']?.(KEYBOARD_SELECTED_CLASS);
        }),
      handle
    );
  }
  function selectBox(el4, { focus: focus = !![] } = {}) {
    const state = handler(),
      text3 = normalizeText(el4?.['dataset']?.['shotId'] || state['workspace']?.['selectedShotId']),
      text4 = normalizeText(el4?.['dataset']?.['personId']);
    if (!text3 || !text4) return ![];
    ((enabled2 = text3),
      (enabled3 = text4),
      run()
        ?.['querySelectorAll']?.('.person-replacement-detection-box.' + KEYBOARD_SELECTED_CLASS)
        ?.['forEach']?.((el5) => {
          if (el5 === el4) return;
          el5['classList']?.['remove']?.(KEYBOARD_SELECTED_CLASS);
        }),
      el4['classList']?.['add']?.(KEYBOARD_SELECTED_CLASS));
    if (focus)
      try {
        el4['focus']?.({ preventScroll: !![] });
      } catch {
        el4['focus']?.();
      }
    return !![];
  }
  function run4() {
    const list = Array['from'](run()?.['querySelectorAll']?.(DETECTION_BOX_SELECTOR) || []);
    list['forEach']((el6) => {
      el6['classList']?.['remove']?.(FRONTMOST_CLASS);
    });
    if (!enabled4) return;
    const el7 = list['find']((config) => run2(config) === enabled4);
    if (!el7) {
      enabled4 = '';
      return;
    }
    el7['classList']?.['add']?.(FRONTMOST_CLASS);
  }
  function bringBoxToFront(scope) {
    const enabled5 = run2(scope);
    if (!enabled5) return ![];
    return ((enabled4 = enabled5), run4(), !![]);
  }
  function run5() {
    const list2 = Array['from'](run()?.['querySelectorAll']?.(DETECTION_BOX_SELECTOR) || []),
      map2 = new Set(list2['map'](run2)['filter'](Boolean));
    ((map = new Set([...map]['filter']((input) => map2['has'](input)))),
      list2['forEach']((el8) => {
        el8['classList']?.['toggle']?.(BATCH_SELECTED_CLASS, map['has'](run2(el8)));
      }));
  }
  function clearBatchSelection() {
    if (!map['size']) return ![];
    return ((map = new Set()), run5(), !![]);
  }
  function selectBatch(output, value4 = []) {
    const text5 = normalizeText(output);
    return (
      (map = new Set(
        (Array['isArray'](value4) ? value4 : [])
          ['map'](normalizeText)
          ['filter'](Boolean)
          ['map']((value5) => text5 + '\x1f' + value5),
      )),
      clearKeyboardSelection(),
      run5(),
      map['size'] > 0
    );
  }
  function run6() {
    const list3 = [],
      value6 = handler();
    return (
      (Array['isArray'](value6['shots']) ? value6['shots'] : [])['forEach']((shotId) => {
        (Array['isArray'](shotId['people']) ? shotId['people'] : [])['forEach']((person) => {
          const value7 = shotId['id'] + '\x1f' + person['id'];
          map['has'](value7) && list3['push']({ shotId: shotId['id'], person: person });
        });
      }),
      list3
    );
  }
  function focusBatchSelectionStage() {
    const el9 = run()?.['querySelector']?.('[data-story-marquee-surface="people"]');
    try {
      el9?.['focus']?.({ preventScroll: !![] });
    } catch {
      el9?.['focus']?.();
    }
  }
  function applyPreview(value8) {
    const enabled6 = value3;
    if (!enabled6) return null;
    const personReplacementBoxDragDistance = getPersonReplacementBoxDragDistance(value8, enabled6);
    if (!enabled6['hasDragged'] && personReplacementBoxDragDistance < MANUAL_SELECTION_DRAG_THRESHOLD_PX)
      return enabled6['items']['map']((value9) => value9['originalBox']);
    enabled6['hasDragged'] = !![];
    const x = run3(value8, enabled6['stage']),
      box2 = {
        x: x['x'] - enabled6['start']['x'],
        y: x['y'] - enabled6['start']['y'],
      },
      value10 = enabled6['isBatchMove']
        ? clampRectGroupTranslation(
            enabled6['items']['map']((value11) => value11['originalBox']),
            box2['x'],
            box2['y'],
          )
        : box2;
    return (
      enabled6['items']['forEach']((value12) => {
        ((value12['currentBox'] = normalizePersonReplacementManualBoxEdit(
          value12['originalBox'],
          value10,
          enabled6['mode'],
        )),
          applyManualBoxPreview(value12['element'], value12['currentBox']));
      }),
      enabled6['items']['map']((value13) => value13['currentBox'])
    );
  }
  function run7(value14, { cancelled: cancelled = ![] } = {}) {
    const shotId2 = value3;
    if (!shotId2) return ![];
    if (!cancelled && value14) applyPreview(value14);
    ((value3 = null), shotId2['cleanup']?.());
    if (cancelled)
      return (
        shotId2['items']['forEach']((value15) => {
          applyManualBoxPreview(value15['element'], value15['originalBox']);
        }),
        !![]
      );
    if (!shotId2['hasDragged']) return !![];
    onUpdatePeopleRequested({
      shotId: shotId2['shotId'],
      updates: shotId2['items']['map']((personId) => ({
        personId: personId['personId'],
        bbox: personId['currentBox'],
      })),
    });
    if (shotId2['isBatchMove']) focusBatchSelectionStage();
    return !![];
  }
  function beginBoxEdit(event2, element, { batch: batch = ![] } = {}) {
    if (value3 || Number(event2?.['button']) > 0 || !element) return ![];
    const value16 = handler(),
      shotId3 = normalizeText(element['dataset']?.['shotId'] || value16['workspace']?.['selectedShotId']),
      personId2 = normalizeText(element['dataset']?.['personId']),
      value17 = (Array['isArray'](value16['shots']) ? value16['shots'] : [])['find'](
        (value18) => value18['id'] === shotId3,
      ),
      value19 = value17?.['people']?.['find']((value20) => value20['id'] === personId2),
      args = value19?.['locator']?.['bbox'] || value19?.['bbox'],
      stage = element['closest']?.('[data-person-replacement-keyframe-stage]'),
      isBatchMove = batch && map['has'](run2(element));
    if (!stage || !args) return ![];
    if (!isBatchMove) selectBox(element);
    const start = run3(event2, stage),
      mode = isBatchMove
        ? 'move'
        : normalizeText(
            event2['target']?.['closest']?.('[data-person-replacement-manual-resize]')?.['dataset']?.[
              'personReplacementManualResize'
            ],
            'move',
          ),
      items = isBatchMove
        ? Array['from'](
            stage['querySelectorAll']?.(
              '.person-replacement-detection-box.is-batch-selected[data-person-id]',
            ) || [],
          )
            ['map']((element2) => {
              const personId3 = normalizeText(element2['dataset']?.['personId']),
                value21 = value17?.['people']?.['find']((value22) => value22['id'] === personId3),
                args2 = value21?.['locator']?.['bbox'] || value21?.['bbox'];
              return args2
                ? {
                    personId: personId3,
                    element: element2,
                    originalBox: { ...args2 },
                    currentBox: { ...args2 },
                  }
                : null;
            })
            ['filter'](Boolean)
        : [
            {
              personId: personId2,
              element: element,
              originalBox: { ...args },
              currentBox: { ...args },
            },
          ];
    if (!items['length']) return ![];
    const personReplacementBoxDragPreview = createPersonReplacementBoxDragPreview({
        getSession: () => value3,
        applyPreview: applyPreview,
        threshold: MANUAL_SELECTION_DRAG_THRESHOLD_PX,
        windowObject: windowObject,
      }),
      value23 = personReplacementBoxDragPreview['schedule'],
      value24 = (value25) => run7(value25),
      value26 = () => run7(null, { cancelled: !![] });
    return (
      windowObject?.['addEventListener']?.('pointermove', value23),
      windowObject?.['addEventListener']?.('pointerup', value24, { once: !![] }),
      windowObject?.['addEventListener']?.('pointercancel', value26, { once: !![] }),
      (value3 = {
        shotId: shotId3,
        stage: stage,
        mode: mode,
        isBatchMove: isBatchMove,
        start: start,
        startClientX: Number['isFinite'](Number(event2?.['clientX'])) ? Number(event2['clientX']) : 0,
        startClientY: Number['isFinite'](Number(event2?.['clientY'])) ? Number(event2['clientY']) : 0,
        hasDragged: ![],
        items: items,
        cleanup: () => {
          (personReplacementBoxDragPreview['cancel'](),
            windowObject?.['removeEventListener']?.('pointermove', value23),
            windowObject?.['removeEventListener']?.('pointerup', value24),
            windowObject?.['removeEventListener']?.('pointercancel', value26));
        },
      }),
      event2['preventDefault']?.(),
      event2['stopPropagation']?.(),
      !![]
    );
  }
  function run8(value27) {
    const enabled7 = value2;
    if (!enabled7?.['preview']) return;
    const box3 = normalizePersonReplacementManualSelection(enabled7['start'], value27);
    if (!box3) return;
    (enabled7['preview']['style']?.['setProperty']?.('--selection-x', box3['x'] * 100 + '%'),
      enabled7['preview']['style']?.['setProperty']?.('--selection-y', box3['y'] * 100 + '%'),
      enabled7['preview']['style']?.['setProperty']?.('--selection-width', box3['width'] * 100 + '%'),
      enabled7['preview']['style']?.['setProperty']?.('--selection-height', box3['height'] * 100 + '%'));
  }
  function run9(event3, { cancelled: cancelled = ![] } = {}) {
    const shotId4 = value2;
    if (!shotId4) return ![];
    ((value2 = null), shotId4['cleanup']?.(), (enabled = ![]));
    const value28 = event3
        ? Math['hypot'](
            Number(event3['clientX']) - shotId4['startClientX'],
            Number(event3['clientY']) - shotId4['startClientY'],
          )
        : 0,
      enabled8 = shotId4['hasDragged'] || value28 >= MANUAL_SELECTION_DRAG_THRESHOLD_PX;
    if (!cancelled && !enabled8) return (requestRender(), !![]);
    const value29 = run3(event3, shotId4['stage']),
      bbox = cancelled ? null : normalizePersonReplacementManualSelection(shotId4['start'], value29);
    if (bbox) runRequest(onManualPersonSelected, { shotId: shotId4['shotId'], bbox: bbox });
    else !cancelled && windowObject?.['showToast']?.('框选范围太小，请完整框住需要替换的主体。', 'info');
    return (requestRender(), !![]);
  }
  function beginManualSelection(event4, stage2) {
    if (!enabled || value2 || !stage2) return ![];
    const value30 = handler(),
      start2 = run3(event4, stage2),
      preview = documentObject?.['createElement']?.('div') || null;
    preview &&
      ((preview['className'] = 'person-replacement-manual-selection-preview'),
      stage2['appendChild']?.(preview));
    const value31 = (event5) => {
        if (
          Math['hypot'](
            Number(event5['clientX']) - Number(event4['clientX']),
            Number(event5['clientY']) - Number(event4['clientY']),
          ) >= MANUAL_SELECTION_DRAG_THRESHOLD_PX
        ) {
          if (value2) value2['hasDragged'] = !![];
        }
        run8(run3(event5, stage2));
      },
      value32 = (value33) => run9(value33),
      value34 = () => run9(event4, { cancelled: !![] });
    return (
      windowObject?.['addEventListener']?.('pointermove', value31),
      windowObject?.['addEventListener']?.('pointerup', value32, { once: !![] }),
      windowObject?.['addEventListener']?.('pointercancel', value34, { once: !![] }),
      (value2 = {
        shotId: normalizeText(stage2['dataset']?.['shotId'] || value30['workspace']?.['selectedShotId']),
        stage: stage2,
        start: start2,
        startClientX: Number(event4['clientX']),
        startClientY: Number(event4['clientY']),
        hasDragged: ![],
        preview: preview,
        cleanup: () => {
          (windowObject?.['removeEventListener']?.('pointermove', value31),
            windowObject?.['removeEventListener']?.('pointerup', value32),
            windowObject?.['removeEventListener']?.('pointercancel', value34),
            preview?.['remove']?.());
        },
      }),
      run8(start2),
      event4['preventDefault']?.(),
      event4['stopPropagation']?.(),
      !![]
    );
  }
  function cancelManualSelection() {
    if (value2) return run9(null, { cancelled: !![] });
    if (!enabled) return ![];
    return ((enabled = ![]), requestRender(), !![]);
  }
  function setManualSelectionActive(value35) {
    return ((enabled = value35 === !![]), enabled);
  }
  function run10() {
    if (!enabled2 || !enabled3) return ![];
    const value36 = handler(),
      value37 = (Array['isArray'](value36['shots']) ? value36['shots'] : [])['some'](
        (value38) =>
          value38['id'] === enabled2 && value38['people']?.['some']((value39) => value39['id'] === enabled3),
      ),
      value40 = value37
        ? Array['from'](run()?.['querySelectorAll']?.(EDITABLE_DETECTION_BOX_SELECTOR) || [])['find'](
            (el10) => el10['dataset']?.['shotId'] === enabled2 && el10['dataset']?.['personId'] === enabled3,
          )
        : null;
    if (value40) return selectBox(value40);
    return (clearKeyboardSelection(), ![]);
  }
  function restoreLayerState() {
    (run4(), run5());
  }
  function syncAfterRender({ manualSelectionSurfaceActive: manualSelectionSurfaceActive } = {}) {
    typeof manualSelectionSurfaceActive === 'boolean' &&
      setManualSelectionActive(manualSelectionSurfaceActive);
    restoreLayerState();
    if (enabled) {
      const el11 = run()?.['querySelector']?.('[data-person-replacement-keyframe-stage]');
      (el11?.['classList']?.['add']?.('is-manual-selecting'), updateStageA11y(el11));
    }
    run10();
  }
  function run11(event6) {
    return (
      event6?.['key'] === 'Delete' ||
      event6?.['key'] === 'Del' ||
      event6?.['code'] === 'Delete' ||
      normalizeText(event6?.['key'])['toLowerCase']() === 'd' ||
      event6?.['code'] === 'KeyD'
    );
  }
  function run12() {
    const value41 = handler(),
      shot = (Array['isArray'](value41['shots']) ? value41['shots'] : [])['find'](
        (value42) => value42['id'] === enabled2,
      ),
      person2 = shot?.['people']?.['find']((value43) => value43['id'] === enabled3);
    return person2 ? { shot: shot, person: person2 } : null;
  }
  function handleSelectionKeyDown(
    event7,
    { deletionEnabled: deletionEnabled = ![], isEditableTarget: isEditableTarget = ![] } = {},
  ) {
    const list4 = run6(),
      value44 = new Set(list4['map']((value45) => value45['shotId']));
    if (
      list4['length'] &&
      value44['size'] === 1 &&
      deletionEnabled &&
      !isEditableTarget &&
      !event7?.['repeat'] &&
      !event7?.['ctrlKey'] &&
      !event7?.['metaKey'] &&
      !event7?.['altKey'] &&
      run11(event7)
    ) {
      const [shotId5] = value44,
        personIds = list4['map']((value46) => value46['person']['id']);
      return (
        event7['preventDefault']?.(),
        event7['stopPropagation']?.(),
        clearBatchSelection(),
        runRequest(onDeletePeopleRequested, { shotId: shotId5, personIds: personIds }),
        !![]
      );
    }
    if (list4['length'] && !isEditableTarget && event7?.['key'] === 'Escape')
      return (event7['preventDefault']?.(), event7['stopPropagation']?.(), clearBatchSelection(), !![]);
    const shotId6 = run12();
    if (
      shotId6 &&
      deletionEnabled &&
      !isEditableTarget &&
      !event7?.['repeat'] &&
      !event7?.['ctrlKey'] &&
      !event7?.['metaKey'] &&
      !event7?.['altKey'] &&
      run11(event7)
    )
      return (
        event7['preventDefault']?.(),
        event7['stopPropagation']?.(),
        clearKeyboardSelection(),
        runRequest(onDeletePeopleRequested, {
          shotId: shotId6['shot']['id'],
          personIds: [shotId6['person']['id']],
        }),
        !![]
      );
    return ![];
  }
  function handleEscape(event8) {
    if (value3)
      return (
        event8?.['preventDefault']?.(),
        event8?.['stopPropagation']?.(),
        run7(null, { cancelled: !![] }),
        !![]
      );
    if (enabled || value2)
      return (event8?.['preventDefault']?.(), event8?.['stopPropagation']?.(), cancelManualSelection(), !![]);
    return ![];
  }
  function destroy() {
    if (value3) run7(null, { cancelled: !![] });
    if (value2) {
      const value47 = value2;
      ((value2 = null), value47['cleanup']?.());
    }
    ((enabled = ![]), (map = new Set()), (enabled2 = ''), (enabled3 = ''), (enabled4 = ''));
  }
  return Object['freeze']({
    beginBoxEdit: beginBoxEdit,
    beginManualSelection: beginManualSelection,
    bringBoxToFront: bringBoxToFront,
    cancelManualSelection: cancelManualSelection,
    clearBatchSelection: clearBatchSelection,
    clearKeyboardSelection: clearKeyboardSelection,
    destroy: destroy,
    focusBatchSelectionStage: focusBatchSelectionStage,
    handleEscape: handleEscape,
    handleSelectionKeyDown: handleSelectionKeyDown,
    isManualSelectionActive: () => enabled,
    restoreLayerState: restoreLayerState,
    selectBatch: selectBatch,
    selectBox: selectBox,
    setManualSelectionActive: setManualSelectionActive,
    syncAfterRender: syncAfterRender,
  });
}
