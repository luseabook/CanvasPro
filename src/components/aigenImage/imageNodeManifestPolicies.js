import { getModelManifest } from '../../manifests/index.js';
function getPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
export function getImageNodeUiPolicy(item) {
  return getPlainObject(getModelManifest(item)?.extensions?.imageNodeUi);
}
export function getImageNodeInputGate(key) {
  return getPlainObject(getImageNodeUiPolicy(key).inputGate);
}
export function shouldAlwaysShowImageRefBar(index) {
  return getImageNodeUiPolicy(index).alwaysShowRefBar === true;
}
export function getImageNodeRootClass(result) {
  return String(getImageNodeUiPolicy(result).rootClass || '').trim();
}
export function shouldUseImageWorkflowBusyButton(data) {
  return getImageNodeUiPolicy(data).workflowBusyButton === true;
}
export function getImageInputGateUploadedUrl(options = {}, target = {}) {
  const source = String(target.uploadedUrlField || '').trim();
  return source ? String(options?.[source] || '').trim() : '';
}
export function buildImageInputGateClearPatch(options2 = {}) {
  const list = Array.isArray(options2.clearFields) ? options2.clearFields : [];
  return Object.fromEntries(
    list
      .map((item2) => String(item2 || '').trim())
      .filter(Boolean)
      .map((item3) => [item3, '']),
  );
}
export function getImageInputGateMissingMessage(options3 = {}) {
  return String(options3.missingMessage || '').trim();
}
