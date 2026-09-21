import { getModelManifest, getModelsByKind } from '../../manifests/index.js';
import {
  APIMART_DREAMINA_VIDEO_DEFAULT_MODEL,
  resolveDreaminaStyleVideoProvider,
  isApimartDreaminaVideoModel,
} from '../../modules/dreaminaVideoModelHelper.js';
import { renderNodeMenuItem } from '../shared/nodeModelMenu.js';
import { translateManifestText } from '../../i18n/manifestText.js';
export const RH_VIDEO_RESOLUTION_OPTIONS = Object.freeze([0x340, 0x400, 0x500, 0x5a0, 0x640, 0x6e0, 0x780]);
const RH_STANDARD_FPS_OPTIONS = Object.freeze([16, 24]),
  RH_V54_FPS_OPTIONS = Object.freeze([16, 24, 30]),
  RH_MIN_VIDEO_RESOLUTION = 0x340;
export function escapeHtml(_0x55e2f6) {
  return String(_0x55e2f6 || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
export function buildRunningHubVideoWorkflowMenuItems(_0xd660af) {
  const _0x578549 = getModelsByKind('video').filter(
    (_0x59d3c0) =>
      _0x59d3c0?.provider === 'runninghubwf' &&
      _0x59d3c0?.adapterType === 'workflow' &&
      !(_0x59d3c0?.uiPlacement?.includes('toolbar') && !_0x59d3c0?.uiPlacement?.includes('modelMenu')),
  );
  return _0x578549
    .map((_0x5bd101) => {
      return renderNodeMenuItem(
        {
          modelId: _0x5bd101.modelId,
          provider: _0x5bd101.provider || 'runninghubwf',
          label: _0x5bd101.displayName,
          description: _0x5bd101.description || '',
          icon: _0x5bd101.icon || 'images/RH.png',
          iconAlt: 'runninghub',
          vip: _0x5bd101.vip === true,
        },
        { activeModel: _0xd660af },
      );
    })
    .join('');
}
export function buildRunningHubVideoModelApiMenuItems(_0x224cf1) {
  const _0x3d030d = getModelsByKind('video')
    .filter((_0x37ead0) => {
      if (_0x37ead0?.provider !== 'runninghub') return false;
      if (_0x37ead0?.adapterType !== 'modelApi') return false;
      if (_0x37ead0?.uiPlacement?.includes('toolbar') && !_0x37ead0?.uiPlacement?.includes('modelMenu'))
        return false;
      return getManifestVideoMenu(_0x37ead0)?.role === 'runninghubModel';
    })
    .sort(
      (_0x3a553e, _0x5969f4) =>
        Number(getManifestVideoMenu(_0x3a553e)?.order || 0) -
        Number(getManifestVideoMenu(_0x5969f4)?.order || 0),
    );
  return _0x3d030d
    .map((_0x5da7c3) =>
      renderNodeMenuItem(
        {
          modelId: _0x5da7c3.modelId,
          provider: _0x5da7c3.provider || 'runninghub',
          label: getManifestVideoMenu(_0x5da7c3)?.label || _0x5da7c3.displayName,
          description: getManifestVideoMenu(_0x5da7c3)?.subtitle || _0x5da7c3.description || '',
          icon: _0x5da7c3.icon || 'images/RH.png',
          iconAlt: 'runninghub',
          vip: _0x5da7c3.vip === true,
        },
        { activeModel: _0x224cf1 },
      ),
    )
    .join('');
}
export function getDefaultRunningHubVideoWorkflowModelId() {
  return (
    getModelsByKind('video').find(
      (_0x6e1b06) =>
        _0x6e1b06?.provider === 'runninghubwf' &&
        _0x6e1b06?.adapterType === 'workflow' &&
        !(_0x6e1b06?.uiPlacement?.includes('toolbar') && !_0x6e1b06?.uiPlacement?.includes('modelMenu')),
    )?.modelId || ''
  );
}
export function buildApimartVideoLogoHTML(_0x1b725d = 20) {
  const _0x4a2dea = Number(_0x1b725d) || 20,
    _0x400c7b = _0x4a2dea <= 12 ? 'node-menu-icon-small' : 'node-menu-icon';
  return '<div class="' + _0x400c7b + ' node-menu-icon-badge node-menu-icon-apimart">AM</div>';
}
export function buildAgnesVideoLogoHTML(_0x1f5682 = 20) {
  const _0x4b3d86 = Number(_0x1f5682) || 20,
    _0x1294a0 = _0x4b3d86 <= 12 ? 'node-menu-icon-small' : 'node-menu-icon';
  return '<div class="' + _0x1294a0 + ' node-menu-icon-badge node-menu-icon-badge-dark">AG</div>';
}
export function buildDreaminaVideoLogoHTML(_0x1832a9 = 20) {
  const _0x480fea = Number(_0x1832a9) || 20;
  if (_0x480fea <= 12)
    return '<img src="images/jimeng.png" class="image-model-trigger-icon image-model-trigger-icon-dreamina" alt="dreamina">';
  return '<img src="images/jimeng.png" class="node-menu-icon" alt="dreamina">';
}
export function buildVolcengineVideoLogoHTML(_0x18e658 = 20) {
  const _0x48c9f9 = Number(_0x18e658) || 20,
    _0x174348 = _0x48c9f9 <= 12 ? 'node-menu-icon-small' : 'node-menu-icon';
  return '<img src="images/volcengine.svg" class="' + _0x174348 + '" alt="volcengine">';
}
function getManifestVideoMenu(_0x455ce2) {
  return _0x455ce2?.extensions?.videoMenu || null;
}
function getManifestDreaminaStyleVideo(_0xe1141) {
  return _0xe1141?.extensions?.dreaminaStyleVideo || null;
}
function getVideoManifestByMenuRole(_0x4da221) {
  return (
    getModelsByKind('video')
      .filter((_0x3af4d9) => getManifestVideoMenu(_0x3af4d9)?.role === _0x4da221)
      .sort(
        (_0x551ea5, _0x43ccde) =>
          Number(getManifestVideoMenu(_0x551ea5)?.order || 0) -
          Number(getManifestVideoMenu(_0x43ccde)?.order || 0),
      )[0] || null
  );
}
function getApimartVideoModelMenuManifests() {
  return getModelsByKind('video')
    .filter((_0x1c5c7d) => {
      if (_0x1c5c7d?.provider !== 'apimart') return false;
      if (_0x1c5c7d?.adapterType !== 'modelApi') return false;
      return getManifestVideoMenu(_0x1c5c7d)?.role === 'apimartModel';
    })
    .sort(
      (_0x5c07f9, _0x33a227) =>
        Number(getManifestVideoMenu(_0x5c07f9)?.order || 0) -
        Number(getManifestVideoMenu(_0x33a227)?.order || 0),
    );
}
function getAgnesVideoModelMenuManifests() {
  return getModelsByKind('video')
    .filter((_0x2387d1) => {
      if (_0x2387d1?.provider !== 'agnes') return false;
      if (_0x2387d1?.adapterType !== 'modelApi') return false;
      return getManifestVideoMenu(_0x2387d1)?.role === 'agnesModel';
    })
    .sort(
      (_0x2147ab, _0x2c3df0) =>
        Number(getManifestVideoMenu(_0x2147ab)?.order || 0) -
        Number(getManifestVideoMenu(_0x2c3df0)?.order || 0),
    );
}
export function getDreaminaTaskModelMenuItems(_0x1b0747, _0x1a0c49 = 'dreamina') {
  const _0x1974fe = String(_0x1a0c49 || 'dreamina')
      .trim()
      .toLowerCase(),
    _0x1d863b = String(_0x1b0747 || '').trim();
  return getModelsByKind('video')
    .filter((_0x2087f4) => {
      if (_0x2087f4?.provider !== _0x1974fe) return false;
      const _0xd2cbd1 = getManifestDreaminaStyleVideo(_0x2087f4);
      if (!_0xd2cbd1) return false;
      return Array.isArray(_0xd2cbd1.taskTypes) && _0xd2cbd1.taskTypes.includes(_0x1d863b);
    })
    .sort(
      (_0x9c9887, _0x38b0eb) =>
        Number(getManifestDreaminaStyleVideo(_0x9c9887)?.order || 0) -
        Number(getManifestDreaminaStyleVideo(_0x38b0eb)?.order || 0),
    )
    .map((_0x109f8c) => {
      const _0x42f85a = getManifestDreaminaStyleVideo(_0x109f8c);
      return {
        model: _0x109f8c.modelId,
        title: translateManifestText(_0x42f85a.title || _0x109f8c.displayName || _0x109f8c.modelId),
        subtitle: translateManifestText(
          _0x42f85a.subtitleByTaskType?.[_0x1d863b] || _0x42f85a.subtitle || _0x109f8c.description || '',
        ),
      };
    });
}
export function getDreaminaTaskModelMenuMeta(_0x5cba2b, _0x1454b0 = '') {
  const _0x5223cd = getModelManifest(_0x5cba2b),
    _0x1123bd = resolveDreaminaStyleVideoProvider(_0x5cba2b, _0x1454b0);
  if (!_0x5223cd || _0x5223cd.provider !== _0x1123bd) return null;
  const _0x1ae331 = getManifestDreaminaStyleVideo(_0x5223cd);
  if (!_0x1ae331) return null;
  return {
    title: translateManifestText(_0x1ae331.title || _0x5223cd.displayName || _0x5223cd.modelId),
    subtitle: translateManifestText(_0x1ae331.subtitle || _0x5223cd.description || ''),
  };
}
export function buildDreaminaOfficialVideoMenuItems() {
  const _0x1652ba = getVideoManifestByMenuRole('dreaminaOfficial'),
    _0x4c8f29 = getManifestVideoMenu(_0x1652ba);
  if (!_0x1652ba || !_0x4c8f29) return [];
  return [
    {
      modelId: _0x1652ba.modelId,
      provider: _0x1652ba.provider,
      label: _0x4c8f29.label || _0x1652ba.displayName,
      subtitle: _0x4c8f29.subtitle || _0x1652ba.description || '',
      iconHtml: buildDreaminaVideoLogoHTML(20),
      vip: _0x1652ba.vip === true,
    },
  ];
}
export function buildVolcengineOfficialVideoMenuItems(_0x59d572 = '', _0xeab850 = '') {
  const _0x5c0e3e = getVideoManifestByMenuRole('volcengineOfficial'),
    _0x148f74 = getManifestVideoMenu(_0x5c0e3e);
  if (!_0x5c0e3e || !_0x148f74) return [];
  const _0x329e29 = resolveDreaminaStyleVideoProvider(_0x59d572, _0xeab850),
    _0x4b51e1 = getModelManifest(_0x59d572);
  return [
    {
      modelId: _0x5c0e3e.modelId,
      provider: _0x5c0e3e.provider,
      label: _0x148f74.label || _0x5c0e3e.displayName,
      subtitle: _0x148f74.subtitle || _0x5c0e3e.description || '',
      iconHtml: buildVolcengineVideoLogoHTML(20),
      active: _0x329e29 === 'volcengine' && !!_0x4b51e1?.extensions?.dreaminaStyleVideo,
      vip: _0x5c0e3e.vip === true,
    },
  ];
}
export function buildApimartVideoMenuItemsHtml(_0x30cbbe, _0x55d15e) {
  const _0xa4e66 = getVideoManifestByMenuRole('apimartDreaminaEntry'),
    _0x4d738b = getManifestVideoMenu(_0xa4e66),
    _0x399385 = _0xa4e66?.modelId || APIMART_DREAMINA_VIDEO_DEFAULT_MODEL;
  return [
    renderNodeMenuItem({
      modelId: _0x399385,
      provider: 'apimart',
      label: _0x4d738b?.label || '即梦视频',
      description: _0x4d738b?.subtitle || '',
      iconHtml: buildDreaminaVideoLogoHTML(20),
      active: isApimartDreaminaVideoModel(_0x30cbbe, _0x55d15e),
      attrs: { 'data-apimart-jimeng': '1' },
    }),
    ...getApimartVideoModelMenuManifests().map((_0x3cb88f) => {
      const _0x662d6a = getManifestVideoMenu(_0x3cb88f);
      return renderNodeMenuItem(
        {
          modelId: _0x3cb88f.modelId,
          provider: 'apimart',
          label: _0x3cb88f.displayName,
          description: _0x662d6a?.disabledValue
            ? _0x3cb88f.description || ''
            : _0x662d6a?.subtitle || _0x3cb88f.description || '',
          iconHtml: buildApimartVideoLogoHTML(20),
          vip: _0x3cb88f.vip === true,
          attrs: { 'data-apimart-video-model': '1' },
        },
        { activeModel: _0x30cbbe },
      );
    }),
  ].join('');
}
export function buildAgnesVideoMenuItemsHtml(_0x189c05) {
  return getAgnesVideoModelMenuManifests()
    .map((_0x244482) => {
      const _0x48d6c2 = getManifestVideoMenu(_0x244482);
      return renderNodeMenuItem(
        {
          modelId: _0x244482.modelId,
          provider: 'agnes',
          label: _0x48d6c2?.label || _0x244482.displayName,
          description: _0x48d6c2?.subtitle || _0x244482.description || '',
          iconHtml: buildAgnesVideoLogoHTML(20),
          vip: _0x244482.vip === true,
        },
        { activeModel: _0x189c05 },
      );
    })
    .join('');
}
export function buildDreaminaTaskModelMenuHtml(_0x34428c, _0x1175be, _0x1b2ec0 = 'dreamina') {
  const _0x35e5e1 = resolveDreaminaStyleVideoProvider(_0x34428c, _0x1b2ec0),
    _0x44e669 = getDreaminaTaskModelMenuItems(_0x1175be, _0x35e5e1),
    _0x494384 =
      _0x35e5e1 === 'apimart'
        ? buildApimartVideoLogoHTML(20)
        : _0x35e5e1 === 'volcengine'
          ? buildVolcengineVideoLogoHTML(20)
          : '<img src="images/jimeng.png" class="node-menu-icon" alt="dreamina">';
  if (!_0x44e669.length)
    return renderNodeMenuItem({
      label: '智能多帧',
      description: '暂未开放模型切换',
      iconHtml: _0x494384,
      disabled: true,
    });
  return _0x44e669
    .map((_0x5ba6f2) =>
      renderNodeMenuItem({
        modelId: _0x5ba6f2.model,
        provider: _0x35e5e1,
        label: _0x5ba6f2.title,
        description: _0x5ba6f2.subtitle,
        iconHtml: _0x494384,
        active: _0x34428c === _0x5ba6f2.model,
        attrs: { 'data-dreamina-task-model': '1' },
      }),
    )
    .join('');
}
export function getRhV54FpsOptions() {
  return RH_V54_FPS_OPTIONS;
}
export function normalizeRhStandardFps(_0x5eca88) {
  const _0x57b092 = Number(_0x5eca88);
  return RH_STANDARD_FPS_OPTIONS.includes(_0x57b092) ? _0x57b092 : 24;
}
export function normalizeRhV54Fps(_0x185cd8) {
  const _0x2c79dc = Number(_0x185cd8);
  return getRhV54FpsOptions().includes(_0x2c79dc) ? _0x2c79dc : 24;
}
export function normalizeRhVideoResolution(_0x2e3924) {
  const _0x1f7ee8 = Number(_0x2e3924);
  return Number.isFinite(_0x1f7ee8)
    ? Math.max(RH_MIN_VIDEO_RESOLUTION, Math.trunc(_0x1f7ee8))
    : RH_MIN_VIDEO_RESOLUTION;
}
export function arePlainObjectsEqual(_0x24bd4c, _0x16ed63) {
  return JSON.stringify(_0x24bd4c || {}) === JSON.stringify(_0x16ed63 || {});
}
