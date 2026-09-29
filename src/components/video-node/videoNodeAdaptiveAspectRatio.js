import {
  getGenerationDisplayRatioSourceConfig,
  getGenerationRatioSizeWithDom,
} from '../../modules/generationRatioSource.js';
import { applyVideoAdaptiveAspectRatio } from '../../modules/videoAspectRatioExecution.js';
function getAdaptiveSourceKind(_0x47da3b = '') {
  const _0xb305f7 = String(_0x47da3b || '')['toLowerCase']();
  if (_0xb305f7['includes']('image')) return 'image';
  if (_0xb305f7['includes']('video')) return 'video';
  return '';
}
function pickAdaptiveSourceSize({
  inEdges: inEdges = [],
  nodes: nodes = {},
  nodeData: nodeData = {},
  preferConfiguredSource: preferConfiguredSource = ![],
} = {}) {
  const _0x1a0c1e = [];
  for (const _0x3151e8 of inEdges) {
    const _0x38a78d = nodes?.[_0x3151e8?.['sourceId']];
    if (!_0x38a78d) continue;
    const _0x246e17 = getAdaptiveSourceKind(_0x38a78d?.['type']);
    if (!_0x246e17) continue;
    const _0x135959 = getGenerationRatioSizeWithDom({
      nodeId: _0x3151e8?.['sourceId'],
      nodeData: _0x38a78d,
      edge: _0x3151e8,
      includeNodeFrame: !![],
    });
    if (!(_0x135959?.['width'] > 0x0 && _0x135959?.['height'] > 0x0)) continue;
    _0x1a0c1e['push']({ edge: _0x3151e8, kind: _0x246e17, size: _0x135959 });
  }
  if (preferConfiguredSource) {
    const _0x156ec2 = getGenerationDisplayRatioSourceConfig(nodeData),
      _0x540cc1 = _0x156ec2?.['kind']
        ? _0x1a0c1e['filter']((_0x4e86c8) => _0x4e86c8['kind'] === _0x156ec2['kind'])
        : _0x1a0c1e,
      _0x2fa5cd = Array['isArray'](_0x156ec2?.['slots'])
        ? _0x156ec2['slots']
        : _0x156ec2?.['slot']
          ? [_0x156ec2['slot']]
          : [];
    for (const _0x22647f of _0x2fa5cd) {
      const _0x2b5b77 = _0x540cc1['find'](
        (_0x115f7c) => String(_0x115f7c['edge']?.['refSlot'] || '')['trim']() === _0x22647f,
      );
      if (_0x2b5b77?.['size']) return _0x2b5b77['size'];
    }
    const _0x1a5589 =
      _0x156ec2?.['inputIndex'] !== undefined ? _0x156ec2['inputIndex'] : _0x156ec2?.['fallbackIndex'];
    if (Number['isInteger'](_0x1a5589) && _0x1a5589 >= 0x0 && _0x1a5589 < _0x540cc1['length'])
      return _0x540cc1[_0x1a5589]?.['size'] || null;
    if (_0x540cc1[0x0]?.['size']) return _0x540cc1[0x0]['size'];
  }
  return (
    _0x1a0c1e['find']((_0x1c42a2) => _0x1c42a2['kind'] === 'image')?.['size'] ||
    _0x1a0c1e['find']((_0x5427f7) => _0x5427f7['kind'] === 'video')?.['size'] ||
    null
  );
}
export function applyVideoNodeAdaptiveAspectRatio(
  _0x9498d3,
  {
    inEdges: inEdges = [],
    nodes: nodes = {},
    nodeData: nodeData = {},
    provider: provider = '',
    model: model = '',
    modelManifest: modelManifest = null,
  } = {},
) {
  const _0x2de2e4 = pickAdaptiveSourceSize({
    inEdges: inEdges,
    nodes: nodes,
    nodeData: nodeData,
    preferConfiguredSource: Boolean(modelManifest?.['inputSlots']?.['displayAspectRatioSource']),
  });
  return applyVideoAdaptiveAspectRatio(_0x9498d3, {
    nodeData: nodeData,
    modelManifest: modelManifest,
    provider: provider,
    model: model,
    displayWidth: 0x0,
    displayHeight: 0x0,
    sourceWidth: _0x2de2e4?.['width'] || 0x0,
    sourceHeight: _0x2de2e4?.['height'] || 0x0,
  });
}
