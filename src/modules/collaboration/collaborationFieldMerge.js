const equal = (_0x450ea3, _0xf1c354) => JSON['stringify'](_0x450ea3) === JSON['stringify'](_0xf1c354),
  record = (_0x536442) => _0x536442 && typeof _0x536442 === 'object' && !Array['isArray'](_0x536442);
export function mergeCollaborationFields(_0x13ae0f, _0x397281, _0x2bd818) {
  if (equal(_0x13ae0f, _0x397281) || equal(_0x2bd818, _0x397281)) return structuredClone(_0x2bd818);
  if (equal(_0x2bd818, _0x13ae0f)) return structuredClone(_0x397281);
  if (record(_0x13ae0f) && record(_0x397281) && record(_0x2bd818)) {
    const _0x2af4e0 = structuredClone(_0x2bd818);
    for (const _0x2057c3 of new Set([...Object['keys'](_0x13ae0f), ...Object['keys'](_0x397281)])) {
      const _0x43a5ee = mergeCollaborationFields(
        _0x13ae0f[_0x2057c3],
        _0x397281[_0x2057c3],
        _0x2bd818[_0x2057c3],
      );
      if (_0x43a5ee === undefined) delete _0x2af4e0[_0x2057c3];
      else _0x2af4e0[_0x2057c3] = _0x43a5ee;
    }
    return _0x2af4e0;
  }
  throw Object['assign'](new Error('同一字段存在不同修改'), { code: 'EDIT_CONFLICT' });
}
