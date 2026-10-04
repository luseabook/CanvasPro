function codePath(value, item) {
  try {
    const uRL = new URL(value, item);
    if (uRL['origin'] !== new URL(item)['origin']) return '';
    return /^\/(?:main\.js|(?:src|api|vendor)\/[A-Za-z0-9_./-]+\.m?js)$/['test'](uRL['pathname'])
      ? uRL['pathname']['slice'](0x0, 0xf0)
      : '';
  } catch {
    return '';
  }
}
export function collectRendererStartupEvidence(error, dom) {
  const key = dom['location']?.['href'] || '',
    enabled = error?.['target']?.['tagName'] === 'SCRIPT',
    index = String(error?.['message'] || ''),
    result = String(error?.['error']?.['name'] || ''),
    source = codePath(enabled ? error['target']['src'] : error?.['filename'], key),
    line = (count) => (Number['isSafeInteger'](count) && count > 0x0 ? count : 0x0);
  let category = enabled ? 'script-load' : 'runtime-error';
  if (!enabled) {
    if (/Failed to fetch dynamically imported module|Importing a module script failed/i['test'](index))
      category = 'module-fetch';
    else {
      if (/does not provide an export named|requested module.*export/i['test'](index))
        category = 'module-export';
      else {
        if (index === 'Script error.') category = 'opaque-script-error';
        else {
          if (['SyntaxError', 'ReferenceError', 'TypeError', 'RangeError']['includes'](result))
            category = result;
        }
      }
    }
  }
  const data = {
    category: category,
    source: source,
    line: line(error?.['lineno']),
    column: line(error?.['colno']),
    documentState: ['loading', 'interactive', 'complete']['includes'](dom['document']?.['readyState'])
      ? dom['document']['readyState']
      : 'unknown',
    failedScriptRequests: [],
  };
  try {
    data['failedScriptRequests'] = (dom['performance']?.['getEntriesByType']?.('resource') || [])
      ['filter']((error2) => error2['responseStatus'] >= 0x190 && codePath(error2['name'], key))
      ['slice'](-0x8)
      ['map']((status) => ({
        source: codePath(status['name'], key),
        status: status['responseStatus'],
      }));
  } catch {}
  return data;
}
