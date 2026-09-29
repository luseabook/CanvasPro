export const CUSTOM_APP_FOOTER_LIMIT = 0x4;
export function getParameterEntries(_0x18e7f0 = [], _0x5f1bed = CUSTOM_APP_FOOTER_LIMIT) {
  const _0x24628b = [],
    _0x2f2e33 = new Map();
  return (
    _0x18e7f0['filter'](
      (_0x385c36) => _0x385c36['componentKind'] === 'param' && _0x385c36['previewPlacement'] === 'home',
    )
      ['sort'](
        (_0x3f6876, _0x3fbb4a) =>
          (Number(_0x3f6876['homeParamOrder']) || 0x0) - (Number(_0x3fbb4a['homeParamOrder']) || 0x0),
      )
      ['forEach']((_0x7c7b59) => {
        const _0x5dcaab = String(_0x7c7b59['footerGroupId'] || '')['trim']();
        let _0x2749ab = _0x5dcaab ? _0x2f2e33['get'](_0x5dcaab) : null;
        if (!_0x2749ab) {
          ((_0x2749ab = {
            id: _0x5dcaab,
            label: String(_0x7c7b59['footerGroupLabel'] || '参数组')['trim'](),
            description: String(_0x7c7b59['footerGroupDescription'] || '')['trim'](),
            members: [],
          }),
            _0x24628b['push'](_0x2749ab));
          if (_0x5dcaab) _0x2f2e33['set'](_0x5dcaab, _0x2749ab);
        }
        _0x2749ab['members']['push'](_0x7c7b59);
      }),
    _0x24628b['slice'](0x0, _0x5f1bed)
  );
}
export function clearParameterGroup(_0x50c140) {
  (delete _0x50c140['footerGroupId'],
    delete _0x50c140['footerGroupLabel'],
    delete _0x50c140['footerGroupDescription']);
}
export function normalizeParameterGroups(_0x2c8be9) {
  (_0x2c8be9['filter'](
    (_0x480d1c) => _0x480d1c['componentKind'] !== 'param' || _0x480d1c['previewPlacement'] !== 'home',
  )['forEach'](clearParameterGroup),
    getParameterEntries(_0x2c8be9, Infinity)['forEach']((_0x389845) => {
      if (_0x389845['members']['length'] < 0x2) _0x389845['members']['forEach'](clearParameterGroup);
    }));
}
export function orderParameterEntries(_0x467d88) {
  _0x467d88['flatMap']((_0x2a2c5c) => _0x2a2c5c['members'])['forEach']((_0x4799ad, _0x4c0b85) => {
    _0x4799ad['homeParamOrder'] = _0x4c0b85;
  });
}
export function groupParameters(_0x16df58, _0x6a0317, _0x3107d4, { wholeGroup: wholeGroup = ![] } = {}) {
  const _0x1adf82 = _0x16df58['find']((_0x2f01a3) => _0x2f01a3['index'] === _0x6a0317),
    _0x1f93de = _0x16df58['find']((_0x240c15) => _0x240c15['index'] === _0x3107d4);
  if (
    !_0x1adf82 ||
    !_0x1f93de ||
    _0x1adf82 === _0x1f93de ||
    _0x1adf82['componentKind'] !== 'param' ||
    _0x1f93de['componentKind'] !== 'param'
  )
    return ![];
  if (_0x1f93de['previewPlacement'] !== 'home') return ![];
  if (_0x1adf82['footerGroupId'] && _0x1adf82['footerGroupId'] === _0x1f93de['footerGroupId']) return ![];
  const _0x408876 =
    wholeGroup && _0x1adf82['footerGroupId']
      ? _0x16df58['filter']((_0x1d6e73) => _0x1d6e73['footerGroupId'] === _0x1adf82['footerGroupId'])
      : [_0x1adf82];
  let _0xa9ce32 = _0x1f93de['footerGroupId'] || 'group-' + _0x1f93de['index'];
  if (!_0x1f93de['footerGroupId']) {
    const _0x4a16a6 = new Set(_0x16df58['map']((_0x54a849) => _0x54a849['footerGroupId']));
    while (_0x4a16a6['has'](_0xa9ce32)) _0xa9ce32 += '-new';
  }
  const _0x31498c = _0x1f93de['footerGroupLabel'] || '参数组',
    _0xb6b776 = _0x1f93de['footerGroupDescription'] || '',
    _0x4b37b3 = getParameterEntries(_0x16df58, Infinity),
    _0x1ce257 = _0x4b37b3['find']((_0xf1e058) => _0xf1e058['members']['includes'](_0x1f93de));
  return (
    _0x4b37b3['forEach']((_0x37a3b0) => {
      _0x37a3b0['members'] = _0x37a3b0['members']['filter']((_0x343665) => !_0x408876['includes'](_0x343665));
    }),
    _0x1ce257['members']['push'](..._0x408876),
    _0x1ce257['members']['forEach']((_0x2a79e4) => {
      ((_0x2a79e4['previewPlacement'] = 'home'),
        (_0x2a79e4['footerGroupId'] = _0xa9ce32),
        (_0x2a79e4['footerGroupLabel'] = _0x31498c),
        (_0x2a79e4['footerGroupDescription'] = _0xb6b776),
        delete _0x2a79e4['advancedParamOrder']);
    }),
    normalizeParameterGroups(_0x16df58),
    orderParameterEntries(_0x4b37b3),
    !![]
  );
}
export function getParameterFooterFields(_0x231e4b) {
  const _0x3e9309 = new Map();
  return (
    getParameterEntries(_0x231e4b)['forEach']((_0x5ecc48) =>
      _0x5ecc48['members']['forEach']((_0x38d66c) => {
        _0x3e9309['set'](_0x38d66c['index'], {
          variant: 'rhAiAppFooterParam',
          displayOrder: Number['isFinite'](Number(_0x38d66c['homeParamOrder']))
            ? Number(_0x38d66c['homeParamOrder'])
            : _0x38d66c['index'],
          ...(_0x5ecc48['id'] && _0x5ecc48['members']['length'] > 0x1
            ? {
                footerGroup: {
                  id: _0x5ecc48['id'],
                  label: _0x5ecc48['label'],
                  description: _0x5ecc48['description'],
                },
              }
            : {}),
        });
      }),
    ),
    _0x3e9309
  );
}
