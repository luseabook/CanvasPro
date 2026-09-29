import { buildDebugJsonPreview } from './debugImagePreview.js';
import { maskDebugBearer, maskDebugHeaders, maskDebugPayloadSecrets } from './debugRequestMasking.js';
export const DEBUG_WRENCH_ICON_HTML =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>';
export function applyDebugWrenchIcon(_0x13aebd) {
  if (!_0x13aebd) return;
  _0x13aebd.innerHTML = DEBUG_WRENCH_ICON_HTML;
}
export function buildFinalApiDebugRequest(_0x4093b9, _0xfff7eb = {}) {
  const _0x2c9b91 = _0xfff7eb.method || 'POST',
    _0x282ce6 = String(_0x4093b9?.url || ''),
    _0x5a7804 = { ...(_0x4093b9?.body || {}) },
    _0x2a591b = String(_0x4093b9?.apiUrl || _0x5a7804.apiUrl || '');
  let _0x5a3074 = _0x4093b9?.headers || { 'Content-Type': 'application/json' },
    _0x2f28fe = _0x5a7804;
  if (_0x5a7804.apiUrl && _0x282ce6.startsWith('/api/v2/proxy/')) {
    const _0x3c8ca1 = _0x5a7804.apiKey || '';
    ((_0x2f28fe = { ..._0x5a7804 }),
      delete _0x2f28fe.apiUrl,
      delete _0x2f28fe.apiKey,
      (_0x5a3074 = _0x3c8ca1
        ? { 'Content-Type': 'application/json', Authorization: maskDebugBearer(_0x3c8ca1) }
        : _0x5a3074));
  } else _0x282ce6 === '/api/v2/runninghubwf/run' && (_0x5a3074 = { 'Content-Type': 'application/json' });
  return {
    method: _0x2c9b91,
    url: _0x282ce6,
    apiUrl: _0x2a591b,
    headers: maskDebugHeaders(_0x5a3074),
    payload: maskDebugPayloadSecrets(_0x2f28fe),
  };
}
export function formatFinalApiDebugRequest(_0x5c565a, _0x535428 = {}) {
  const _0x4dc6e6 = buildFinalApiDebugRequest(_0x5c565a, _0x535428);
  return (
    '🎯 [最终发给 API 的参数]\n\nmethod = "' +
    _0x4dc6e6.method +
    '"\n\nurl = "' +
    _0x4dc6e6.url +
    '"\n\napiUrl = "' +
    _0x4dc6e6.apiUrl +
    '"\n\nheaders = ' +
    JSON.stringify(_0x4dc6e6.headers, null, 2) +
    '\n\npayload = ' +
    JSON.stringify(_0x4dc6e6.payload, null, 2)
  );
}

const LOCAL_PROXY_ONLY_PAYLOAD_KEYS=Object["freeze"](['__aicAllowTaskProbe',"__aicModelCatalogId","installId","install_id","deviceId","device_id"]);

export function buildFinalApiDebugPreview(_0x259e74,_0x3aae14={}){const _0x345a7b=formatFinalApiDebugRequest(_0x259e74,_0x3aae14),_0x519c58=buildDebugJsonPreview(buildFinalApiDebugRequest(_0x259e74,_0x3aae14)["payload"]),_0x4f9c6e=_0x345a7b["length"]-_0x519c58["content"]["length"];return{'outputText':_0x345a7b,'images':_0x519c58['images']['map'](_0x555af8=>({..._0x555af8,'start':_0x555af8["start"]+_0x4f9c6e,'end':_0x555af8["end"]+_0x4f9c6e}))};}
