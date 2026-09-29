export function normalizeRunningHubReferenceMediaUrls(_0x113c04) {
  const _0x2bf2cd = [];
  return (
    (Array['isArray'](_0x113c04) ? _0x113c04 : [])['forEach']((_0x46eb4b) => {
      const _0x4ab250 = String(_0x46eb4b || '')['trim']();
      if (_0x4ab250 && !_0x2bf2cd['includes'](_0x4ab250)) _0x2bf2cd['push'](_0x4ab250);
    }),
    _0x2bf2cd
  );
}
function normalizeCount(_0x108578, _0x17ff5f = 0x0) {
  const _0x5b4631 = Number(_0x108578);
  return Number['isFinite'](_0x5b4631)
    ? Math['max'](0x0, Math['trunc'](_0x5b4631))
    : Math['max'](0x0, Math['trunc'](Number(_0x17ff5f) || 0x0));
}
function normalizeReferenceMediaSpec(_0x14d079 = {}, _0x57eb24 = {}) {
  const _0x47af4b = Array['isArray'](_0x14d079['loaderNodes']) ? _0x14d079['loaderNodes'] : [],
    _0x5a9703 = normalizeCount(_0x14d079['slotCount'], _0x47af4b['length']),
    _0x19d0c3 = normalizeCount(_0x14d079['maxCount'], _0x5a9703),
    _0x862efc = normalizeCount(_0x14d079['minCount'], 0x0),
    _0x1832a8 = String(_0x14d079['payloadField'] || '')['trim'](),
    _0x2208ad = (
      Array['isArray'](_0x14d079['referenceFieldPrefixes'])
        ? _0x14d079['referenceFieldPrefixes']
        : [_0x14d079['referenceFieldPrefix']]
    )
      ['map']((_0x25e3ee) => String(_0x25e3ee || '')['trim']())
      ['filter'](Boolean);
  return {
    ..._0x14d079,
    kind: String(_0x14d079['kind'] || '')['trim'](),
    loaderNodes: _0x47af4b,
    maxCount: _0x19d0c3,
    minCount: _0x862efc,
    payloadField: _0x1832a8,
    referenceFieldPrefixes: _0x2208ad,
    referenceNodeId: String(_0x14d079['referenceNodeId'] || '')['trim'](),
    slotCount: _0x5a9703,
    urls: normalizeRunningHubReferenceMediaUrls(_0x57eb24[_0x1832a8]),
  };
}
function assertReferenceMediaSpec(_0x15f697) {
  if (_0x15f697['minCount'] > _0x15f697['maxCount'] || _0x15f697['slotCount'] < _0x15f697['maxCount'])
    throw new Error(
      _0x15f697['mappingMissingMessage'] ||
        'RunningHub ' + (_0x15f697['kind'] || 'media') + ' reference mapping is incomplete',
    );
  const _0x4699c3 = _0x15f697['loaderNodes']
    ['slice'](0x0, _0x15f697['maxCount'])
    ['every']((_0x1fcf4c) => _0x1fcf4c?.['nodeId'] && _0x1fcf4c?.['fieldName']);
  if (!_0x4699c3)
    throw new Error(
      _0x15f697['mappingMissingMessage'] ||
        'RunningHub ' + (_0x15f697['kind'] || 'media') + '\x20loader\x20mapping\x20is\x20incomplete',
    );
  if (
    _0x15f697['slotCount'] > 0x0 &&
    (!_0x15f697['referenceNodeId'] || _0x15f697['referenceFieldPrefixes']['length'] === 0x0)
  )
    throw new Error(
      _0x15f697['mappingMissingMessage'] ||
        'RunningHub ' + (_0x15f697['kind'] || 'media') + ' reference mapping is incomplete',
    );
  if (_0x15f697['urls']['length'] > _0x15f697['maxCount'])
    throw new Error(
      _0x15f697['maxCountMessage'] ||
        'RunningHub ' + (_0x15f697['kind'] || 'media') + ' references exceed ' + _0x15f697['maxCount'],
    );
  if (_0x15f697['urls']['length'] < _0x15f697['minCount'])
    throw new Error(
      _0x15f697['minCountMessage'] ||
        'RunningHub\x20' + (_0x15f697['kind'] || 'media') + ' references require ' + _0x15f697['minCount'],
    );
}
function assertUploadedReferenceMedia(_0x44237b, _0x2bb9a8) {
  const _0x3f8909 = Array['isArray'](_0x2bb9a8) ? _0x2bb9a8 : [];
  if (
    _0x3f8909['length'] !== _0x44237b['urls']['length'] ||
    _0x3f8909['some']((_0x5f46f6) => !String(_0x5f46f6 || '')['trim']())
  )
    throw new Error(
      (_0x44237b['uploadFailedMessage'] || 'RunningHUB 参考素材上传失败') +
        '：预期\x20' +
        _0x44237b['urls']['length'] +
        ' 项，返回 ' +
        _0x3f8909['filter']((_0x4d1192) => String(_0x4d1192 || '')['trim']())['length'] +
        ' 项有效地址，请重试',
    );
  return _0x3f8909;
}
export async function appendRunningHubReferenceMediaInputs({
  payload: payload = {},
  specs: specs = [],
  requiredTotal: requiredTotal = 0x0,
  requiredTotalMessage: requiredTotalMessage = '',
  apiKey: _0x14613a,
  ctx: _0xf7cd98,
  helpers: _0x2b1d7d,
  nodeInfoList: _0x3370ee,
}) {
  const _0x5683ff = (Array['isArray'](specs) ? specs : [])['map']((_0xab18d1) =>
    normalizeReferenceMediaSpec(_0xab18d1, payload),
  );
  _0x5683ff['forEach'](assertReferenceMediaSpec);
  const _0x9d61a6 = _0x5683ff['reduce'](
    (_0x345875, _0x518158) => _0x345875 + _0x518158['urls']['length'],
    0x0,
  );
  if (_0x9d61a6 < normalizeCount(requiredTotal, 0x0))
    throw new Error(requiredTotalMessage || 'RunningHub 工作流缺少参考素材');
  const _0x16da6b = await Promise['all'](
    _0x5683ff['map'](async (_0x3cb3ce) =>
      assertUploadedReferenceMedia(
        _0x3cb3ce,
        await _0x2b1d7d['uploadRunningHubMediaInputs'](
          _0x3cb3ce['kind'],
          _0x3cb3ce['urls'],
          payload,
          _0x14613a,
          _0xf7cd98,
          { uploadFailedMessage: _0x3cb3ce['uploadFailedMessage'] },
        ),
      ),
    ),
  );
  return (
    _0x5683ff['forEach']((_0x437cf9, _0x3a0150) => {
      const _0x271b00 = _0x16da6b[_0x3a0150];
      _0x271b00['forEach']((_0x22696b, _0x234577) => {
        _0x2b1d7d['pushManifestNode'](_0x3370ee, _0x437cf9['loaderNodes'][_0x234577], _0x22696b);
      });
    }),
    _0x5683ff['forEach']((_0x1a1702, _0x52aa43) => {
      const _0x40a1d1 = _0x16da6b[_0x52aa43]['length'];
      _0x1a1702['referenceFieldPrefixes']['forEach']((_0xe45fdc) => {
        for (let _0x3c6c7d = _0x40a1d1; _0x3c6c7d < _0x1a1702['slotCount']; _0x3c6c7d += 0x1) {
          _0x2b1d7d['pushManifestNode'](
            _0x3370ee,
            { nodeId: _0x1a1702['referenceNodeId'], fieldName: '' + _0xe45fdc + _0x3c6c7d },
            null,
          );
        }
      });
    }),
    Object['fromEntries'](
      _0x5683ff['map']((_0x47ca98, _0x22fa46) => [
        _0x47ca98['kind'],
        Object['freeze']({
          inputCount: _0x47ca98['urls']['length'],
          uploadedCount: _0x16da6b[_0x22fa46]['length'],
        }),
      ]),
    )
  );
}
