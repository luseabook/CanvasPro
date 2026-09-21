import { getModelManifest } from '../../manifests/index.js';
function getPlainObject(_0x4b6a68) {
  return _0x4b6a68 && typeof _0x4b6a68 === 'object' && !Array.isArray(_0x4b6a68) ? _0x4b6a68 : {};
}
export function getImageNodeUiPolicy(_0x9dc208) {
  return getPlainObject(getModelManifest(_0x9dc208)?.extensions?.imageNodeUi);
}
export function getImageNodeInputGate(_0x1117a9) {
  return getPlainObject(getImageNodeUiPolicy(_0x1117a9).inputGate);
}
export function shouldAlwaysShowImageRefBar(_0x48d0bc) {
  return getImageNodeUiPolicy(_0x48d0bc).alwaysShowRefBar === true;
}
export function getImageNodeRootClass(_0x45df9d) {
  return String(getImageNodeUiPolicy(_0x45df9d).rootClass || '').trim();
}
export function shouldUseImageWorkflowBusyButton(_0x2ebf55) {
  return getImageNodeUiPolicy(_0x2ebf55).workflowBusyButton === true;
}
export function getImageInputGateUploadedUrl(_0x5da2c2 = {}, _0x235dd0 = {}) {
  const _0x33b7fa = String(_0x235dd0.uploadedUrlField || '').trim();
  return _0x33b7fa ? String(_0x5da2c2?.[_0x33b7fa] || '').trim() : '';
}
export function buildImageInputGateClearPatch(_0x5abd8e = {}) {
  const _0x5a434e = Array.isArray(_0x5abd8e.clearFields) ? _0x5abd8e.clearFields : [];
  return Object.fromEntries(
    _0x5a434e
      .map((_0x10c06a) => String(_0x10c06a || '').trim())
      .filter(Boolean)
      .map((_0x3a6f10) => [_0x3a6f10, '']),
  );
}
export function getImageInputGateMissingMessage(_0x549e44 = {}) {
  return String(_0x549e44.missingMessage || '').trim();
}
