import { getModelsByKind } from '../../manifests/index.js';
import { renderNodeModelMenu, renderNodeModelTrigger } from '../shared/nodeModelMenu.js';
import { t } from '../../i18n/index.js';
function audioModelMenuText(_0x56a8ee, _0x7b39f5 = {}) {
  return t('audioModelMenu.' + _0x56a8ee, _0x7b39f5);
}
function getAudioMenuMeta(_0x178afb) {
  const _0x3453b8 = _0x178afb?.extensions?.audioMenu;
  return _0x3453b8 && typeof _0x3453b8 === 'object' ? _0x3453b8 : null;
}
function isAudioModelMenuManifest(_0x1e2765) {
  const _0x39b243 = getAudioMenuMeta(_0x1e2765);
  if (_0x39b243?.group !== 'runninghubWorkflow') return false;
  if (_0x1e2765?.provider !== 'runninghubwf') return false;
  const _0x17b9b9 = Array.isArray(_0x1e2765?.uiPlacement) ? _0x1e2765.uiPlacement : ['modelMenu'];
  return !(_0x17b9b9.includes('toolbar') && !_0x17b9b9.includes('modelMenu'));
}
export function getAudioWorkflowMenuManifests() {
  return getModelsByKind('audio')
    .filter(isAudioModelMenuManifest)
    .sort((_0x4857e1, _0x59a8c6) => {
      const _0x99dfd1 = Number(getAudioMenuMeta(_0x4857e1)?.order),
        _0x298607 = Number(getAudioMenuMeta(_0x59a8c6)?.order),
        _0x39886e = Number.isFinite(_0x99dfd1) ? _0x99dfd1 : 0,
        _0x5b2069 = Number.isFinite(_0x298607) ? _0x298607 : 0;
      if (_0x39886e !== _0x5b2069) return _0x39886e - _0x5b2069;
      return String(_0x4857e1.modelId || '').localeCompare(String(_0x59a8c6.modelId || ''));
    });
}
export function buildAudioWorkflowItems(_0x39540e = {}) {
  return getAudioWorkflowMenuManifests().map((_0x20ba30) =>
    Object.freeze({
      key: _0x20ba30.modelId,
      label: _0x20ba30.displayName,
      subtitle: _0x20ba30.description || '',
      vip: _0x20ba30.vip === true,
      validate: _0x39540e[_0x20ba30.modelId] || (() => ''),
    }),
  );
}
export function buildAudioModelMenuHtml({
  activeModel: activeModel = '',
  workflowItems: workflowItems = [],
} = {}) {
  return renderNodeModelMenu({
    kind: 'audio',
    activeModel: activeModel,
    groups: [
      {
        id: 'runninghub',
        label: audioModelMenuText('runninghub.label'),
        subtitle: audioModelMenuText('runninghub.subtitle'),
        icon: 'images/RH.png',
        iconAlt: 'runninghub',
        items: workflowItems.map((_0x468f3b) => ({
          modelId: _0x468f3b.key,
          label: _0x468f3b.label,
          subtitle: _0x468f3b.subtitle,
          icon: 'images/RH.png',
          iconAlt: 'runninghub',
          vip: _0x468f3b.vip === true,
        })),
      },
    ],
  });
}
export function buildAudioModelTriggerHtml({ label: label = '' } = {}) {
  return renderNodeModelTrigger({
    iconHtml:
      '<img src="images/RH.png" style="width:14px;height:14px;object-fit:contain;border-radius:3px;flex-shrink:0;" alt="runninghub">',
    label: label,
  });
}
