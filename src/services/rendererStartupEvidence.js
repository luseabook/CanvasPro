function codePath(_0x50ac35, _0xec15e2) {
  try {
    const _0x1814f8 = new URL(_0x50ac35, _0xec15e2);
    if (_0x1814f8['origin'] !== new URL(_0xec15e2)['origin']) return '';
    return /^\/(?:main\.js|(?:src|api|vendor)\/[A-Za-z0-9_./-]+\.m?js)$/['test'](_0x1814f8['pathname'])
      ? _0x1814f8['pathname']['slice'](0x0, 0xf0)
      : '';
  } catch {
    return '';
  }
}
export function collectRendererStartupEvidence(_0x35859d, _0x561bd1) {
  const _0x2ebd47 = _0x561bd1['location']?.['href'] || '',
    _0x488cf7 = _0x35859d?.['target']?.['tagName'] === 'SCRIPT',
    _0x2e2564 = String(_0x35859d?.['message'] || ''),
    _0x583f9d = String(_0x35859d?.['error']?.['name'] || ''),
    _0x338c78 = codePath(_0x488cf7 ? _0x35859d['target']['src'] : _0x35859d?.['filename'], _0x2ebd47),
    _0x2b2639 = (_0x14cc27) => (Number['isSafeInteger'](_0x14cc27) && _0x14cc27 > 0x0 ? _0x14cc27 : 0x0);
  let _0x38f62e = _0x488cf7 ? 'script-load' : 'runtime-error';
  if (!_0x488cf7) {
    if (/Failed to fetch dynamically imported module|Importing a module script failed/i['test'](_0x2e2564))
      _0x38f62e = 'module-fetch';
    else {
      if (/does not provide an export named|requested module.*export/i['test'](_0x2e2564))
        _0x38f62e = 'module-export';
      else {
        if (_0x2e2564 === 'Script error.') _0x38f62e = 'opaque-script-error';
        else {
          if (['SyntaxError', 'ReferenceError', 'TypeError', 'RangeError']['includes'](_0x583f9d))
            _0x38f62e = _0x583f9d;
        }
      }
    }
  }
  const _0x37b5bb = {
    category: _0x38f62e,
    source: _0x338c78,
    line: _0x2b2639(_0x35859d?.['lineno']),
    column: _0x2b2639(_0x35859d?.['colno']),
    documentState: ['loading', 'interactive', 'complete']['includes'](_0x561bd1['document']?.['readyState'])
      ? _0x561bd1['document']['readyState']
      : 'unknown',
    failedScriptRequests: [],
  };
  try {
    _0x37b5bb['failedScriptRequests'] = (_0x561bd1['performance']?.['getEntriesByType']?.('resource') || [])
      ['filter'](
        (_0x209183) => _0x209183['responseStatus'] >= 0x190 && codePath(_0x209183['name'], _0x2ebd47),
      )
      ['slice'](-0x8)
      ['map']((_0x10797c) => ({
        source: codePath(_0x10797c['name'], _0x2ebd47),
        status: _0x10797c['responseStatus'],
      }));
  } catch {}
  return _0x37b5bb;
}
