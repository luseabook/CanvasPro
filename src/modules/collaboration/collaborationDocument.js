const PRIVATE_KEYS =
    /^(?:_.*|.*apiKey|authorization|cookie|cookies|password|secret|accessToken|refreshToken|cdkey|providerProfileId|rhProviderProfileId|providerAssetRefs|selected|isSelected|isGenerating|isLoading|loading|progress|generation(?:StartTime|EndTime|Duration|Progress|Error|Queue.*|Task.*|Request.*|History|Recover.*)|rhTask.*|rhStatus.*|taskId|taskStatus|asyncTask.*|job.*|error|statusMessage|hydratedAt|waveformLocalPath|waveformUrl)$/i,
  MEDIA_KEYS =
    /(?:^(?:src|url|thumbnail|thumb|image|video|audio|poster|dataUrl|references)$|(?:Urls?|Paths?|Srcs?|Images|Videos|Audios)$)/i,
  MEDIA_SOURCE =
    /^(?:https?:|blob:|data:(?:image|video|audio)\/|file:|[A-Za-z]:[\\/]|\/?(?:api\/|output\/|uploads\/|assets\/|data\/|user\/))/i,
  unsafeField = (_0x25ed91) => ['__proto__', 'constructor', 'prototype']['includes'](_0x25ed91),
  privateField = (_0x508908) =>
    PRIVATE_KEYS['test'](_0x508908) || PRIVATE_KEYS['test'](_0x508908['replace'](/[_-]/g, ''));
export function cloneGraph(_0x202c0b = {}) {
  return {
    nodes: structuredClone(_0x202c0b['nodes'] || {}),
    edges: structuredClone(_0x202c0b['edges'] || {}),
  };
}
export function sharedValue(_0x5af638, _0x316635 = '', _0x2999b1 = (_0x28e109) => _0x28e109) {
  if (Array['isArray'](_0x5af638))
    return _0x5af638['map']((_0x1e40c7) => sharedValue(_0x1e40c7, _0x316635, _0x2999b1));
  if (_0x5af638 && typeof _0x5af638 === 'object') {
    const _0x4dcecc = {};
    for (const [_0x450b48, _0x437b8c] of Object['entries'](_0x5af638)) {
      if (privateField(_0x450b48) || unsafeField(_0x450b48) || _0x437b8c === undefined) continue;
      _0x4dcecc[_0x450b48] = sharedValue(_0x437b8c, _0x450b48, _0x2999b1);
    }
    return _0x4dcecc;
  }
  if (typeof _0x5af638 === 'string' && MEDIA_KEYS['test'](_0x316635) && MEDIA_SOURCE['test'](_0x5af638))
    return _0x2999b1(_0x5af638);
  return _0x5af638;
}
export function projectGraph(_0x1e23ef, _0x331756) {
  return {
    nodes: sharedValue(_0x1e23ef['nodes'] || {}, '', _0x331756),
    edges: sharedValue(_0x1e23ef['edges'] || {}, '', _0x331756),
  };
}
export function mergeSharedNode(_0x1abab3, _0x58908d) {
  if (Array['isArray'](_0x58908d))
    return _0x58908d['map']((_0x57a30c) =>
      mergeSharedNode(
        _0x57a30c?.['id'] && Array['isArray'](_0x1abab3)
          ? _0x1abab3['find']((_0x14cd03) => _0x14cd03?.['id'] === _0x57a30c['id'])
          : undefined,
        _0x57a30c,
      ),
    );
  if (_0x58908d && typeof _0x58908d === 'object') {
    const _0x108f84 = {};
    for (const [_0x2c174d, _0x1dc404] of Object['entries'](_0x1abab3 || {})) {
      if (
        /^waveform(?:LocalPath|Url)$/i['test'](_0x2c174d) &&
        ['src', 'localPath', 'originalLocalPath']['some'](
          (_0x24afcd) => _0x1abab3?.[_0x24afcd] !== _0x58908d[_0x24afcd],
        )
      )
        continue;
      if (!unsafeField(_0x2c174d) && privateField(_0x2c174d))
        _0x108f84[_0x2c174d] = structuredClone(_0x1dc404);
    }
    for (const [_0x29a48c, _0x1b43aa] of Object['entries'](_0x58908d)) {
      if (!unsafeField(_0x29a48c) && !privateField(_0x29a48c))
        _0x108f84[_0x29a48c] = mergeSharedNode(_0x1abab3?.[_0x29a48c], _0x1b43aa);
    }
    return _0x108f84;
  }
  return _0x58908d;
}
export function graphChanges(_0x4f077d, _0x2d360b) {
  const _0x36d446 = [];
  for (const _0x34ca92 of ['nodes', 'edges']) {
    for (const _0x2c8647 of new Set([
      ...Object['keys'](_0x4f077d[_0x34ca92] || {}),
      ...Object['keys'](_0x2d360b[_0x34ca92] || {}),
    ])) {
      const _0x5a13bf = _0x4f077d[_0x34ca92]?.[_0x2c8647] ?? null,
        _0x24acd1 = _0x2d360b[_0x34ca92]?.[_0x2c8647] ?? null;
      if (JSON['stringify'](_0x5a13bf) !== JSON['stringify'](_0x24acd1))
        _0x36d446['push']({ kind: _0x34ca92, id: _0x2c8647, before: _0x5a13bf, after: _0x24acd1 });
    }
  }
  return _0x36d446;
}
export function applyGraphChanges(_0x185f56, _0x88a801) {
  const _0x1c1c68 = cloneGraph(_0x185f56);
  for (const _0x3a4c8f of _0x88a801) {
    if (_0x3a4c8f['after'] === null) delete _0x1c1c68[_0x3a4c8f['kind']][_0x3a4c8f['id']];
    else _0x1c1c68[_0x3a4c8f['kind']][_0x3a4c8f['id']] = structuredClone(_0x3a4c8f['after']);
  }
  return _0x1c1c68;
}
export function invertChanges(_0x52259d) {
  return _0x52259d['map'](({ kind: _0x1d37ce, id: _0x507b8a, before: _0x3e7ee4, after: _0x4a8241 }) => ({
    kind: _0x1d37ce,
    id: _0x507b8a,
    before: _0x4a8241,
    after: _0x3e7ee4,
  }));
}
export function graphChangesConflict(_0x5d4777, _0x3a677e, _0x164fe4) {
  const _0x358363 = new Set(_0x5d4777['map']((_0x4c16a5) => _0x4c16a5['kind'] + ':' + _0x4c16a5['id'])),
    _0x227fc7 = new Set(
      _0x5d4777['filter']((_0x519eed) => _0x519eed['kind'] === 'nodes' && !_0x519eed['after'])['map'](
        (_0x54e4da) => _0x54e4da['id'],
      ),
    );
  return _0x3a677e['some']((_0x1b0ed7) => {
    if (_0x358363['has'](_0x1b0ed7['kind'] + ':' + _0x1b0ed7['id'])) return !![];
    if (_0x1b0ed7['kind'] === 'edges')
      return [_0x1b0ed7['after']?.['sourceId'], _0x1b0ed7['after']?.['targetId']]['some']((_0x4cdc0b) =>
        _0x227fc7['has'](_0x4cdc0b),
      );
    let _0x275265 = _0x1b0ed7['after']?.['parentId'];
    const _0x19af62 = new Set();
    while (_0x275265 && !_0x19af62['has'](_0x275265)) {
      if (_0x227fc7['has'](_0x275265)) return !![];
      (_0x19af62['add'](_0x275265), (_0x275265 = _0x164fe4['nodes'][_0x275265]?.['parentId']));
    }
    return ![];
  });
}
