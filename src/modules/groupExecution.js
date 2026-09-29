import appStore from '../core/stores/appStore.js';
import { t } from '../i18n/index.js';
const EXECUTABLE_NODE_TYPES = new Set(['ai-text', 'ai-image', 'ai-video', 'ai-audio']);
function groupExecutionText(_0x5a2124, _0x1c034a = {}) {
  return t('groupExecution.' + _0x5a2124, _0x1c034a);
}
function toNodeList(_0x2db5bf) {
  if (!_0x2db5bf || typeof _0x2db5bf !== 'object') return [];
  return Object.values(_0x2db5bf).filter((_0x109adf) => _0x109adf && typeof _0x109adf === 'object');
}
function isExecutableNode(_0x56b3ce) {
  return EXECUTABLE_NODE_TYPES.has(String(_0x56b3ce?.type || ''));
}
function compareCanvasOrder(_0x2ec58c, _0x634fce) {
  const _0x1b00a4 = Number(_0x2ec58c?.y) || 0,
    _0x4d85d5 = Number(_0x634fce?.y) || 0;
  if (_0x1b00a4 !== _0x4d85d5) return _0x1b00a4 - _0x4d85d5;
  const _0x26f7d6 = Number(_0x2ec58c?.x) || 0,
    _0x5b5e5a = Number(_0x634fce?.x) || 0;
  if (_0x26f7d6 !== _0x5b5e5a) return _0x26f7d6 - _0x5b5e5a;
  return String(_0x2ec58c?.id || '').localeCompare(String(_0x634fce?.id || ''));
}
export function collectGroupExecutableNodeIds(_0x23adc4, _0x5a4c19) {
  const _0x44e1ea = String(_0x5a4c19 || '').trim();
  if (!_0x44e1ea) return [];
  const _0x147a0a = toNodeList(_0x23adc4),
    _0x7f1cf5 = new Map();
  for (const _0xe4c081 of _0x147a0a) {
    const _0xd51c3f = String(_0xe4c081.parentId || '').trim();
    if (!_0xd51c3f) continue;
    if (!_0x7f1cf5.has(_0xd51c3f)) _0x7f1cf5.set(_0xd51c3f, []);
    _0x7f1cf5.get(_0xd51c3f).push(_0xe4c081);
  }
  for (const _0x238622 of _0x7f1cf5.values()) {
    _0x238622.sort(compareCanvasOrder);
  }
  const _0x1f5b4d = [],
    _0x270b48 = new Set(),
    _0x48003a = (_0x1453a3) => {
      const _0x2afb6f = _0x7f1cf5.get(_0x1453a3) || [];
      for (const _0x59aef3 of _0x2afb6f) {
        const _0x3b65a7 = String(_0x59aef3?.id || '').trim();
        if (!_0x3b65a7 || _0x270b48.has(_0x3b65a7)) continue;
        _0x270b48.add(_0x3b65a7);
        if (isExecutableNode(_0x59aef3)) _0x1f5b4d.push(_0x3b65a7);
        if (String(_0x59aef3?.type || '') === 'group') _0x48003a(_0x3b65a7);
      }
    };
  return (_0x48003a(_0x44e1ea), _0x1f5b4d);
}
export function collectSelectedExecutableNodeIds(_0x5a3091, _0x349cd3 = []) {
  const _0x303886 = new Set(
    (Array.isArray(_0x349cd3) ? _0x349cd3 : [])
      .map((_0x4112fc) => String(_0x4112fc || '').trim())
      .filter(Boolean),
  );
  if (_0x303886.size === 0) return [];
  return toNodeList(_0x5a3091)
    .filter((_0x25d978) => _0x303886.has(String(_0x25d978?.id || '').trim()) && isExecutableNode(_0x25d978))
    .sort(compareCanvasOrder)
    .map((_0x1ce8ba) => String(_0x1ce8ba?.id || '').trim())
    .filter(Boolean);
}
export function findGenerateButtonForNode(_0x2fef2d, _0x4ebb42) {
  const _0xc065a0 = _0x2fef2d || globalThis.document;
  if (!_0xc065a0 || typeof _0xc065a0.getElementById !== 'function') return null;
  const _0x212311 = _0xc065a0.getElementById(String(_0x4ebb42 || ''));
  if (!_0x212311 || typeof _0x212311.querySelector !== 'function') return null;
  return _0x212311.querySelector('.prompt-submit.img-gen-btn:not(.debug-wrench-btn)');
}
export function executeGroupGenerateButtons({
  groupId: _0x23fcf9,
  state: state = appStore.getState(),
  root: root = globalThis.document,
  showToast: showToast = globalThis.window?.showToast,
} = {}) {
  const _0x1cc927 = state?.nodes || {},
    _0x535220 = _0x1cc927?.[_0x23fcf9];
  if (!_0x535220 || String(_0x535220.type || '') !== 'group')
    return (
      showToast?.(groupExecutionText('groupNotFound'), 'warn'),
      { clicked: 0, total: 0, missing: 0, skippedDisabled: 0, skippedGenerating: 0 }
    );
  const _0x2cefb8 = collectGroupExecutableNodeIds(_0x1cc927, _0x23fcf9);
  if (_0x2cefb8.length === 0)
    return (
      showToast?.(groupExecutionText('groupNoExecutable'), 'warn'),
      { clicked: 0, total: 0, missing: 0, skippedDisabled: 0, skippedGenerating: 0 }
    );
  let _0xabfc42 = 0,
    _0x47ee69 = 0,
    _0xb06e3d = 0,
    _0x99c40c = 0;
  for (const _0x2d10ae of _0x2cefb8) {
    const _0x4f6abf = _0x1cc927[_0x2d10ae];
    if (_0x4f6abf?.isGenerating === true) {
      _0x99c40c += 1;
      continue;
    }
    const _0x281fe8 = findGenerateButtonForNode(root, _0x2d10ae);
    if (!_0x281fe8) {
      _0x47ee69 += 1;
      continue;
    }
    if (_0x281fe8.disabled) {
      _0xb06e3d += 1;
      continue;
    }
    (_0x281fe8.click(), (_0xabfc42 += 1));
  }
  if (_0xabfc42 > 0) showToast?.(groupExecutionText('groupTriggered', { count: _0xabfc42 }), 'success');
  else
    _0x99c40c > 0
      ? showToast?.(groupExecutionText('groupRunning'), 'warn')
      : showToast?.(groupExecutionText('groupNoTriggerable'), 'warn');
  return {
    clicked: _0xabfc42,
    total: _0x2cefb8.length,
    missing: _0x47ee69,
    skippedDisabled: _0xb06e3d,
    skippedGenerating: _0x99c40c,
  };
}
export function executeSelectedGenerateButtons({
  selectedIds: _0x23f830,
  state: state = appStore.getState(),
  root: root = globalThis.document,
  showToast: showToast = globalThis.window?.showToast,
} = {}) {
  const _0x5b3256 = state?.nodes || {},
    _0x377d2b = collectSelectedExecutableNodeIds(_0x5b3256, _0x23f830 || state?.selectedNodeIds || []);
  if (_0x377d2b.length === 0)
    return (
      showToast?.(groupExecutionText('selectedNoExecutable'), 'warn'),
      { clicked: 0, total: 0, missing: 0, skippedDisabled: 0, skippedGenerating: 0 }
    );
  let _0x1987ba = 0,
    _0x52c1cd = 0,
    _0xa55b67 = 0,
    _0xe2f2b1 = 0;
  for (const _0x4b3575 of _0x377d2b) {
    const _0x1a299b = _0x5b3256[_0x4b3575];
    if (_0x1a299b?.isGenerating === true) {
      _0xe2f2b1 += 1;
      continue;
    }
    const _0x49254c = findGenerateButtonForNode(root, _0x4b3575);
    if (!_0x49254c) {
      _0x52c1cd += 1;
      continue;
    }
    if (_0x49254c.disabled) {
      _0xa55b67 += 1;
      continue;
    }
    (_0x49254c.click(), (_0x1987ba += 1));
  }
  if (_0x1987ba > 0) showToast?.(groupExecutionText('selectedTriggered', { count: _0x1987ba }), 'success');
  else
    _0xe2f2b1 > 0
      ? showToast?.(groupExecutionText('selectedRunning'), 'warn')
      : showToast?.(groupExecutionText('selectedNoTriggerable'), 'warn');
  return {
    clicked: _0x1987ba,
    total: _0x377d2b.length,
    missing: _0x52c1cd,
    skippedDisabled: _0xa55b67,
    skippedGenerating: _0xe2f2b1,
  };
}

const DEFAULT_SELECTED_GENERATE_STAGGER_MS = 0x12c;

let activeSelectedGenerateBatch=null;

export function hasRunningGroupGenerateNodes(_0x40b22d,_0x40bb92){return collectGroupExecutableNodeIds(_0x40b22d,_0x40bb92)['some'](_0x405e9d=>_0x40b22d?.[_0x405e9d]?.["isGenerating"]===!![]);}

export function hasRunningSelectedGenerateNodes(_0x46eb8c,_0x25b9db=[]){return collectSelectedExecutableNodeIds(_0x46eb8c,_0x25b9db)['some'](_0x17b036=>_0x46eb8c?.[_0x17b036]?.["isGenerating"]===!![]);}

export function cancelGroupGenerateButtons({groupId:_0x2accde,state:state=appStore["getState"](),root:root=globalThis['document'],showToast:showToast=globalThis["window"]?.['showToast']}={}){const _0x11a03d=state?.["nodes"]||{},_0x41dec7=collectGroupExecutableNodeIds(_0x11a03d,_0x2accde)["filter"](_0x5affc5=>_0x11a03d?.[_0x5affc5]?.["isGenerating"]===!![]);let _0x2a6c7b=0x0;for(const _0x13263e of _0x41dec7){const _0x100f37=findGenerateButtonForNode(root,_0x13263e);if(!_0x100f37||_0x100f37["disabled"])continue;_0x100f37['click'](),_0x2a6c7b+=0x1;}return _0x2a6c7b>0x0&&showToast?.(groupExecutionText("groupCancelTriggered",{'count':_0x2a6c7b}),"info"),{'clicked':_0x2a6c7b,'total':_0x41dec7["length"]};}

function normalizeStaggerMs(_0x33622f,_0x15a972=DEFAULT_SELECTED_GENERATE_STAGGER_MS){const _0x415119=Number(_0x33622f);if(!Number["isFinite"](_0x415119)||_0x415119<0x0)return _0x15a972;return Math["floor"](_0x415119);}

function scheduleGenerateButtonClick(_0x5f512d,_0x56f8e6,_0x316d14,_0xc326a8=()=>{}){const _0x73d244=()=>{if(!_0x5f512d["disabled"])_0x5f512d["click"]();_0xc326a8();};if(_0x56f8e6>0x0&&typeof _0x316d14==="function")return _0x316d14(_0x73d244,_0x56f8e6);return _0x73d244(),null;}

export function hasActiveSelectedGenerateBatch(){return Boolean(activeSelectedGenerateBatch);}

function cancelActiveSelectedGenerateQueue(){const _0x1d52b2=activeSelectedGenerateBatch;if(!_0x1d52b2)return![];return activeSelectedGenerateBatch=null,_0x1d52b2["cancelled"]=!![],_0x1d52b2["timeoutIds"]["forEach"](_0xf78e1e=>_0x1d52b2["clearScheduledTimeout"]?.(_0xf78e1e)),_0x1d52b2['timeoutIds']["clear"](),_0x1d52b2["onStateChange"]?.(![]),!![];}

export function cancelSelectedGenerateButtons({selectedIds:selectedIds=[],state:state=appStore["getState"](),root:root=globalThis['document'],showToast:showToast=globalThis["window"]?.["showToast"]}={}){const _0xe1d3bb=cancelActiveSelectedGenerateQueue(),_0x1263a5=state?.['nodes']||{},_0x359bb4=collectSelectedExecutableNodeIds(_0x1263a5,selectedIds)['filter'](_0x461514=>_0x1263a5?.[_0x461514]?.['isGenerating']===!![]);let _0x23383d=0x0;for(const _0x2e70f6 of _0x359bb4){const _0x479965=findGenerateButtonForNode(root,_0x2e70f6);if(!_0x479965||_0x479965["disabled"])continue;_0x479965["click"](),_0x23383d+=0x1;}return _0x23383d>0x0&&showToast?.(groupExecutionText("selectedCancelTriggered",{'count':_0x23383d}),'info'),_0xe1d3bb||_0x23383d>0x0;}
