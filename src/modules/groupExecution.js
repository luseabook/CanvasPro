import appStore from '../core/stores/appStore.js';
import { t } from '../i18n/index.js';
const EXECUTABLE_NODE_TYPES = new Set(['ai-text', 'ai-image', 'ai-video', 'ai-audio']);
function groupExecutionText(value, item = {}) {
  return t('groupExecution.' + value, item);
}
function toNodeList(enabled) {
  if (!enabled || typeof enabled !== 'object') return [];
  return Object.values(enabled).filter((item2) => item2 && typeof item2 === 'object');
}
function isExecutableNode(key) {
  return EXECUTABLE_NODE_TYPES.has(String(key?.type || ''));
}
function compareCanvasOrder(box, box2) {
  const index = Number(box?.y) || 0,
    result = Number(box2?.y) || 0;
  if (index !== result) return index - result;
  const data = Number(box?.x) || 0,
    options = Number(box2?.x) || 0;
  if (data !== options) return data - options;
  return String(box?.id || '').localeCompare(String(box2?.id || ''));
}
export function collectGroupExecutableNodeIds(target, source) {
  const enabled2 = String(source || '').trim();
  if (!enabled2) return [];
  const toNodeList2 = toNodeList(target),
    map = new Map();
  for (const next of toNodeList2) {
    const enabled3 = String(next.parentId || '').trim();
    if (!enabled3) continue;
    if (!map.has(enabled3)) map.set(enabled3, []);
    map.get(enabled3).push(next);
  }
  for (const list of map.values()) {
    list.sort(compareCanvasOrder);
  }
  const list2 = [],
    map2 = new Set(),
    handler = (current) => {
      const entry = map.get(current) || [];
      for (const record of entry) {
        const enabled4 = String(record?.id || '').trim();
        if (!enabled4 || map2.has(enabled4)) continue;
        map2.add(enabled4);
        if (isExecutableNode(record)) list2.push(enabled4);
        if (String(record?.type || '') === 'group') handler(enabled4);
      }
    };
  return (handler(enabled2), list2);
}
export function collectSelectedExecutableNodeIds(payload, handle = []) {
  const map3 = new Set(
    (Array.isArray(handle) ? handle : []).map((item3) => String(item3 || '').trim()).filter(Boolean),
  );
  if (map3.size === 0) return [];
  return toNodeList(payload)
    .filter((item4) => map3.has(String(item4?.id || '').trim()) && isExecutableNode(item4))
    .sort(compareCanvasOrder)
    .map((item5) => String(item5?.id || '').trim())
    .filter(Boolean);
}
export function findGenerateButtonForNode(config, scope) {
  const enabled5 = config || globalThis.document;
  if (!enabled5 || typeof enabled5.getElementById !== 'function') return null;
  const el = enabled5.getElementById(String(scope || ''));
  if (!el || typeof el.querySelector !== 'function') return null;
  return el.querySelector('.prompt-submit.img-gen-btn:not(.debug-wrench-btn)');
}
export function executeGroupGenerateButtons({
  groupId: groupId,
  state: state = appStore.getState(),
  root: root = globalThis.document,
  showToast: showToast = globalThis.window?.showToast,
} = {}) {
  const input = state?.nodes || {},
    enabled6 = input?.[groupId];
  if (!enabled6 || String(enabled6.type || '') !== 'group')
    return (
      showToast?.(groupExecutionText('groupNotFound'), 'warn'),
      { clicked: 0, total: 0, missing: 0, skippedDisabled: 0, skippedGenerating: 0 }
    );
  const total = collectGroupExecutableNodeIds(input, groupId);
  if (total.length === 0)
    return (
      showToast?.(groupExecutionText('groupNoExecutable'), 'warn'),
      { clicked: 0, total: 0, missing: 0, skippedDisabled: 0, skippedGenerating: 0 }
    );
  let count = 0,
    missing = 0,
    skippedDisabled = 0,
    skippedGenerating = 0;
  for (const output of total) {
    const value2 = input[output];
    if (value2?.isGenerating === true) {
      skippedGenerating += 1;
      continue;
    }
    const el2 = findGenerateButtonForNode(root, output);
    if (!el2) {
      missing += 1;
      continue;
    }
    if (el2.disabled) {
      skippedDisabled += 1;
      continue;
    }
    (el2.click(), (count += 1));
  }
  if (count > 0) showToast?.(groupExecutionText('groupTriggered', { count: count }), 'success');
  else
    skippedGenerating > 0
      ? showToast?.(groupExecutionText('groupRunning'), 'warn')
      : showToast?.(groupExecutionText('groupNoTriggerable'), 'warn');
  return {
    clicked: count,
    total: total.length,
    missing: missing,
    skippedDisabled: skippedDisabled,
    skippedGenerating: skippedGenerating,
  };
}
export function executeSelectedGenerateButtons({
  selectedIds: selectedIds2,
  state: state = appStore.getState(),
  root: root = globalThis.document,
  showToast: showToast = globalThis.window?.showToast,
} = {}) {
  const value3 = state?.nodes || {},
    total2 = collectSelectedExecutableNodeIds(value3, selectedIds2 || state?.selectedNodeIds || []);
  if (total2.length === 0)
    return (
      showToast?.(groupExecutionText('selectedNoExecutable'), 'warn'),
      { clicked: 0, total: 0, missing: 0, skippedDisabled: 0, skippedGenerating: 0 }
    );
  let count2 = 0,
    missing2 = 0,
    skippedDisabled2 = 0,
    skippedGenerating2 = 0;
  for (const value4 of total2) {
    const value5 = value3[value4];
    if (value5?.isGenerating === true) {
      skippedGenerating2 += 1;
      continue;
    }
    const el3 = findGenerateButtonForNode(root, value4);
    if (!el3) {
      missing2 += 1;
      continue;
    }
    if (el3.disabled) {
      skippedDisabled2 += 1;
      continue;
    }
    (el3.click(), (count2 += 1));
  }
  if (count2 > 0) showToast?.(groupExecutionText('selectedTriggered', { count: count2 }), 'success');
  else
    skippedGenerating2 > 0
      ? showToast?.(groupExecutionText('selectedRunning'), 'warn')
      : showToast?.(groupExecutionText('selectedNoTriggerable'), 'warn');
  return {
    clicked: count2,
    total: total2.length,
    missing: missing2,
    skippedDisabled: skippedDisabled2,
    skippedGenerating: skippedGenerating2,
  };
}

const DEFAULT_SELECTED_GENERATE_STAGGER_MS = 300;

let activeSelectedGenerateBatch = null;

export function hasRunningGroupGenerateNodes(value6, value7) {
  return collectGroupExecutableNodeIds(value6, value7).some(
    (value8) => value6?.[value8]?.isGenerating === true,
  );
}

export function hasRunningSelectedGenerateNodes(value9, value10 = []) {
  return collectSelectedExecutableNodeIds(value9, value10).some(
    (value11) => value9?.[value11]?.isGenerating === true,
  );
}

export function cancelGroupGenerateButtons({
  groupId: groupId2,
  state: state = appStore.getState(),
  root: root = globalThis.document,
  showToast: showToast = globalThis.window?.showToast,
} = {}) {
  const value12 = state?.nodes || {},
    groupExecutableNodeIds = collectGroupExecutableNodeIds(value12, groupId2).filter(
      (value13) => value12?.[value13]?.isGenerating === true,
    );
  let count3 = 0;
  for (const value14 of groupExecutableNodeIds) {
    const el4 = findGenerateButtonForNode(root, value14);
    if (!el4 || el4.disabled) continue;
    (el4.click(), (count3 += 1));
  }
  return (
    count3 > 0 && showToast?.(groupExecutionText('groupCancelTriggered', { count: count3 }), 'info'),
    { clicked: count3, total: groupExecutableNodeIds.length }
  );
}

function normalizeStaggerMs(value15, value16 = DEFAULT_SELECTED_GENERATE_STAGGER_MS) {
  const count4 = Number(value15);
  if (!Number.isFinite(count4) || count4 < 0) return value16;
  return Math.floor(count4);
}

function scheduleGenerateButtonClick(enabled7, count5, handler2, handler3 = () => {}) {
  const run = () => {
    if (!enabled7.disabled) enabled7.click();
    handler3();
  };
  if (count5 > 0 && typeof handler2 === 'function') return handler2(run, count5);
  return (run(), null);
}

export function hasActiveSelectedGenerateBatch() {
  return Boolean(activeSelectedGenerateBatch);
}

function cancelActiveSelectedGenerateQueue() {
  const enabled8 = activeSelectedGenerateBatch;
  if (!enabled8) return false;
  return (
    (activeSelectedGenerateBatch = null),
    (enabled8.cancelled = true),
    enabled8.timeoutIds.forEach((value17) => enabled8.clearScheduledTimeout?.(value17)),
    enabled8.timeoutIds.clear(),
    enabled8.onStateChange?.(false),
    true
  );
}

export function cancelSelectedGenerateButtons({
  selectedIds: selectedIds = [],
  state: state = appStore.getState(),
  root: root = globalThis.document,
  showToast: showToast = globalThis.window?.showToast,
} = {}) {
  const cancelActiveSelectedGenerateQueue2 = cancelActiveSelectedGenerateQueue(),
    value18 = state?.nodes || {},
    selectedExecutableNodeIds = collectSelectedExecutableNodeIds(value18, selectedIds).filter(
      (value19) => value18?.[value19]?.isGenerating === true,
    );
  let count6 = 0;
  for (const value20 of selectedExecutableNodeIds) {
    const generateButtonForNode = findGenerateButtonForNode(root, value20);
    if (!generateButtonForNode || generateButtonForNode.disabled) continue;
    (generateButtonForNode.click(), (count6 += 1));
  }
  return (
    count6 > 0 && showToast?.(groupExecutionText('selectedCancelTriggered', { count: count6 }), 'info'),
    cancelActiveSelectedGenerateQueue2 || count6 > 0
  );
}
