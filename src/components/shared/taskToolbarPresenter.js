import appStore from '../../core/stores/appStore.js';
import { isTaskCancelled, isTaskRunning } from '../../core/generationTaskUiState.js';
import { GENERATE_CANCEL_ICON_HTML } from '../../modules/previewGenerateButtonUi.js';
export const TASK_TOOLBAR_EVENT = 'aicanvas:generation-toolbar-task-change';
function getStateSnapshot() {
  return typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
}
function normalizeList(_0x19bb87) {
  return Array.isArray(_0x19bb87)
    ? _0x19bb87.map((_0x4e4324) => String(_0x4e4324 || '').trim()).filter(Boolean)
    : [];
}
function includesAny(_0x14e4ef, _0x12dcd4) {
  const _0x3f027c = String(_0x14e4ef || '');
  return _0x12dcd4.some((_0x5b44d2) => _0x3f027c.includes(_0x5b44d2));
}
function getTaskTime(_0x14415e) {
  return (
    Number(
      _0x14415e?.rhTaskStartedAt || _0x14415e?.asyncTaskStartedAt || _0x14415e?.generationStartTime || 0,
    ) || 0
  );
}
function defaultIsTaskNode(_0x3c23d0) {
  return !!_0x3c23d0 && typeof _0x3c23d0 === 'object' && isTaskRunning(_0x3c23d0);
}
export function notifyToolbarTasksChanged(
  _0x76557c = {},
  { eventName: eventName = TASK_TOOLBAR_EVENT } = {},
) {
  try {
    window.dispatchEvent?.(new CustomEvent(eventName, { detail: _0x76557c }));
  } catch {}
}
export function isToolbarTaskCancelled(_0x27f8de, { isTaskNode: isTaskNode = defaultIsTaskNode } = {}) {
  const _0x1a30d0 = String(_0x27f8de || '').trim();
  if (!_0x1a30d0) return false;
  const _0x5c3793 = getStateSnapshot().nodes?.[_0x1a30d0];
  return !!_0x5c3793 && isTaskNode(_0x5c3793) === false ? false : isTaskCancelled(_0x5c3793);
}
export function findToolbarTaskForNode(
  _0x573036,
  {
    models: models = [],
    taskTypes: taskTypes = [],
    outputTextIncludes: outputTextIncludes = [],
    nameIncludes: nameIncludes = [],
    sourceField: sourceField = 'rhSourceNodeId',
    taskTypeField: taskTypeField = 'rhToolbarTaskType',
    isTaskNode: isTaskNode = defaultIsTaskNode,
  } = {},
) {
  const _0x6d07e = String(_0x573036 || '').trim();
  if (!_0x6d07e) return null;
  const _0x596205 = new Set(normalizeList(models).map((_0x5a9021) => _0x5a9021.toLowerCase())),
    _0x5a2d26 = new Set(normalizeList(taskTypes)),
    _0x53a2c2 = normalizeList(outputTextIncludes),
    _0x18ae04 = normalizeList(nameIncludes),
    _0x233f85 = Object.values(getStateSnapshot().nodes || {})
      .filter((_0x516c23) => {
        if (!_0x516c23 || typeof _0x516c23 !== 'object') return false;
        if (!isTaskNode(_0x516c23)) return false;
        const _0x2592e3 =
          String(_0x516c23.id || '') === _0x6d07e || String(_0x516c23[sourceField] || '') === _0x6d07e;
        if (!_0x2592e3) return false;
        if (_0x596205.size) {
          const _0x2ebea5 = String(_0x516c23.model || '')
            .trim()
            .toLowerCase();
          if (!_0x596205.has(_0x2ebea5)) return false;
        }
        const _0x40b9c5 = _0x5a2d26.size > 0 && _0x5a2d26.has(String(_0x516c23[taskTypeField] || '').trim()),
          _0x2e1743 = _0x53a2c2.length > 0 && includesAny(_0x516c23.outputText, _0x53a2c2),
          _0x534cfc = _0x18ae04.length > 0 && includesAny(_0x516c23.name, _0x18ae04),
          _0x53ad76 = _0x5a2d26.size > 0 || _0x53a2c2.length > 0 || _0x18ae04.length > 0;
        return !_0x53ad76 || _0x40b9c5 || _0x2e1743 || _0x534cfc;
      })
      .sort((_0x39bb0e, _0x475926) => getTaskTime(_0x475926) - getTaskTime(_0x39bb0e)),
    _0x2f0ccf = _0x233f85[0] || null;
  if (!_0x2f0ccf) return null;
  return {
    sourceNodeId: String(_0x2f0ccf[sourceField] || ''),
    outId: String(_0x2f0ccf.id || ''),
    targetNodeId: String(_0x2f0ccf.id || ''),
    taskId: String(_0x2f0ccf.rhTaskId || _0x2f0ccf.asyncTaskId || ''),
    apiKey: '',
    node: _0x2f0ccf,
    fromStore: true,
  };
}
export function bindToolbarTaskButton({
  button: _0x3fae62,
  getTask: _0xce5d5,
  cancelTask: _0x38ed31,
  cancelTooltip: cancelTooltip = '取消任务',
  eventTypes: eventTypes = ['click'],
  eventName: eventName = TASK_TOOLBAR_EVENT,
  cancelIconHtml: cancelIconHtml = GENERATE_CANCEL_ICON_HTML,
} = {}) {
  if (!_0x3fae62 || typeof _0xce5d5 !== 'function') return () => {};
  const _0x1ced34 = {
    html: _0x3fae62.innerHTML,
    color: _0x3fae62.style?.color || '',
    tooltip: _0x3fae62.dataset?.tooltip,
    aria: _0x3fae62.getAttribute?.('aria-label') || '',
    title: _0x3fae62.title || '',
  };
  let _0x45de08 = '';
  const _0x113b17 = () => {
      const _0x1ec23a = _0xce5d5() || null;
      _0x45de08 = String(_0x1ec23a?.outId || _0x1ec23a?.targetNodeId || '');
      const _0x3b87f5 = !!_0x45de08;
      _0x3fae62.classList?.toggle?.('is-task-cancel', _0x3b87f5);
      if (_0x3b87f5) {
        _0x3fae62.innerHTML = cancelIconHtml;
        if (_0x3fae62.dataset) _0x3fae62.dataset.tooltip = cancelTooltip;
        (_0x3fae62.setAttribute?.('aria-label', cancelTooltip), (_0x3fae62.title = cancelTooltip));
        return;
      }
      _0x3fae62.innerHTML = _0x1ced34.html;
      if (_0x3fae62.style) _0x3fae62.style.color = _0x1ced34.color || '';
      if (_0x3fae62.dataset) {
        if (_0x1ced34.tooltip == null) delete _0x3fae62.dataset.tooltip;
        else _0x3fae62.dataset.tooltip = _0x1ced34.tooltip;
      }
      if (_0x1ced34.aria) _0x3fae62.setAttribute?.('aria-label', _0x1ced34.aria);
      else _0x3fae62.removeAttribute?.('aria-label');
      _0x3fae62.title = _0x1ced34.title || '';
    },
    _0x18531d = (_0x5d5ee2) => {
      const _0x5bb238 = _0xce5d5() || null;
      if (!_0x5bb238) return;
      (_0x5d5ee2.preventDefault?.(),
        _0x5d5ee2.stopPropagation?.(),
        _0x5d5ee2.stopImmediatePropagation?.(),
        void Promise.resolve(_0x38ed31?.(_0x5bb238)).finally(_0x113b17));
    },
    _0x507286 = normalizeList(eventTypes);
  _0x507286.forEach((_0x5b2608) => {
    _0x3fae62.addEventListener?.(_0x5b2608, _0x18531d, true);
  });
  const _0x4e404c =
    typeof appStore.subscribeSelector === 'function'
      ? appStore.subscribeSelector((_0x5da211) => _0x5da211.nodes, _0x113b17)
      : null;
  return (
    window.addEventListener?.(eventName, _0x113b17),
    _0x113b17(),
    () => {
      (_0x507286.forEach((_0x4dc7be) => {
        _0x3fae62.removeEventListener?.(_0x4dc7be, _0x18531d, true);
      }),
        _0x4e404c?.(),
        window.removeEventListener?.(eventName, _0x113b17),
        _0x45de08 && ((_0x45de08 = ''), _0x113b17()));
    }
  );
}
