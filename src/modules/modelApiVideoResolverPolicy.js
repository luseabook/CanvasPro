import { resolveModelExecution } from '../manifests/index.js';
function normalizeText(_0x26072b) {
  return String(_0x26072b || '')['trim']();
}
function hasOwn(_0x4bc78b, _0x15ccbd) {
  return !!_0x4bc78b && Object['prototype']['hasOwnProperty']['call'](_0x4bc78b, _0x15ccbd);
}
function resolveModelApiVideoExecution(_0x3f868a, _0x671a65 = '') {
  const _0xd378b1 =
    resolveModelExecution(_0x3f868a, { providerHint: _0x671a65 }) || resolveModelExecution(_0x3f868a);
  if (
    _0xd378b1?.['modelManifest']?.['kind'] !== 'video' ||
    _0xd378b1?.['modelManifest']?.['adapterType'] !== 'modelApi' ||
    _0xd378b1?.['executionManifest']?.['adapterType'] !== 'modelApi'
  )
    return null;
  return _0xd378b1;
}
export function getModelApiVideoBodyResolverName(_0x39eb83, _0x5b5845 = '') {
  const _0x303d7b = resolveModelApiVideoExecution(_0x39eb83, _0x5b5845);
  return normalizeText(_0x303d7b?.['executionManifest']?.['extensions']?.['bodyResolver']);
}
export function getModelApiVideoExtension(_0x57fbc1, _0x396614 = '', _0x4dd63f = '') {
  const _0x13f694 = normalizeText(_0x4dd63f);
  if (!_0x13f694) return undefined;
  const _0x397ad7 = resolveModelApiVideoExecution(_0x57fbc1, _0x396614),
    _0x340a4e = _0x397ad7?.['modelManifest']?.['extensions'];
  if (hasOwn(_0x340a4e, _0x13f694)) return _0x340a4e[_0x13f694];
  const _0x541a46 = _0x397ad7?.['executionManifest']?.['extensions'];
  if (hasOwn(_0x541a46, _0x13f694)) return _0x541a46[_0x13f694];
  return undefined;
}
export function getModelApiVideoFamily(_0x3a1b5a, _0x5bc51f = '') {
  return normalizeText(getModelApiVideoExtension(_0x3a1b5a, _0x5bc51f, 'videoFamily'));
}
export function getModelApiVideoFamilyOptions(_0x423ad7, _0x57e2ae = '', _0x394415 = '') {
  const _0x59ea81 = normalizeText(_0x394415);
  if (!_0x59ea81 || getModelApiVideoFamily(_0x423ad7, _0x57e2ae) !== _0x59ea81) return Object['freeze']({});
  const _0x25c967 = getModelApiVideoExtension(_0x423ad7, _0x57e2ae, _0x59ea81);
  return _0x25c967 && typeof _0x25c967 === 'object' && !Array['isArray'](_0x25c967)
    ? _0x25c967
    : Object['freeze']({});
}
export function isModelApiVideoFamily(_0x276784, _0x354804 = '', _0x506fd1 = '') {
  const _0xd71923 = normalizeText(_0x506fd1);
  return !!_0xd71923 && getModelApiVideoFamily(_0x276784, _0x354804) === _0xd71923;
}
export function getModelApiVideoMaxInputVideoSeconds(_0x1f3289, _0x1d4a49 = '', _0x5bf05d = null) {
  const _0x4fd086 = Number(getModelApiVideoExtension(_0x1f3289, _0x1d4a49, 'maxInputVideoSeconds'));
  return Number['isFinite'](_0x4fd086) && _0x4fd086 > 0x0 ? Math['trunc'](_0x4fd086) : _0x5bf05d;
}
export function isHappyHorseModelApiVideo(_0x1f2c42, _0x5cb32c = '') {
  return isModelApiVideoFamily(_0x1f2c42, _0x5cb32c, 'happyHorse');
}
export function getHappyHorseModelApiVideoOptions(_0x2cd883, _0x29cdcf = '') {
  return getModelApiVideoFamilyOptions(_0x2cd883, _0x29cdcf, 'happyHorse');
}
export function supportsHappyHorseModelApiVideoEdit(_0x202174, _0x1a961f = '') {
  return getHappyHorseModelApiVideoOptions(_0x202174, _0x1a961f)?.['supportsEdit'] !== ![];
}
export function isSeedance2ModelApiVideo(_0x499f2c, _0x1be868 = '') {
  return isModelApiVideoFamily(_0x499f2c, _0x1be868, 'seedance2');
}
export function isWan27ModelApiVideo(_0x387d2e, _0x4653d0 = '') {
  return isModelApiVideoFamily(_0x387d2e, _0x4653d0, 'wan27');
}
