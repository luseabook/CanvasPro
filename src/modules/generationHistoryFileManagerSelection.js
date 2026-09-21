export function isActionableFileManagerMediaKind(_0x38e216) {
  const _0x4f65f8 = String(_0x38e216 || '')
    .trim()
    .toLowerCase();
  return _0x4f65f8 === 'image' || _0x4f65f8 === 'video' || _0x4f65f8 === 'audio';
}
export function buildFileManagerHistoryRecordKey({
  projectId: projectId = '',
  canvasId: canvasId = '',
  resultFingerprint: resultFingerprint = '',
} = {}) {
  return [
    String(projectId || '').trim(),
    String(canvasId || '').trim(),
    String(resultFingerprint || '').trim(),
  ].join(':');
}
export function buildFileManagerHistoryMediaKey({
  projectId: projectId = '',
  canvasId: canvasId = '',
  mediaKind: mediaKind = '',
  localPath: localPath = '',
  resultFingerprint: resultFingerprint = '',
} = {}) {
  const _0x58f45e = String(localPath || '').trim();
  if (_0x58f45e)
    return [
      'media',
      String(projectId || '').trim(),
      String(canvasId || '').trim(),
      String(mediaKind || '')
        .trim()
        .toLowerCase(),
      _0x58f45e,
    ].join(':');
  if (!String(resultFingerprint || '').trim()) return '';
  return (
    'fingerprint:' +
    buildFileManagerHistoryRecordKey({
      projectId: projectId,
      canvasId: canvasId,
      resultFingerprint: resultFingerprint,
    })
  );
}
export function isFileManagerHistoryRecordVisible({
  record: _0xf8d22d,
  source: source = 'history',
  projectId: projectId = '',
  canvasId: canvasId = '',
  activeFilter: activeFilter = 'all',
  getMediaKind: getMediaKind = (_0x5991c1) => _0x5991c1?.mediaKind,
} = {}) {
  const _0x5cb90c = String(projectId || '').trim(),
    _0x16a0e7 = String(canvasId || '').trim();
  if (_0x5cb90c && String(_0xf8d22d?.projectId || '').trim() !== _0x5cb90c) return false;
  if (source === 'current-canvas' && _0x16a0e7 && String(_0xf8d22d?.canvasId || '').trim() !== _0x16a0e7)
    return false;
  const _0x5b92de = String(activeFilter || 'all').trim();
  return _0x5b92de === 'all' || String(getMediaKind(_0xf8d22d) || '').trim() === _0x5b92de;
}
export function getFileManagerSelectionAfterClick({
  current: current = [],
  recordId: recordId = '',
  shiftKey: shiftKey = false,
  actionable: actionable = true,
} = {}) {
  const _0x198335 = String(recordId || ''),
    _0x59ca7f = new Set((Array.isArray(current) ? current : []).map((_0x1cc017) => String(_0x1cc017 || '')));
  if (!_0x198335 || !actionable) return Array.from(_0x59ca7f);
  if (shiftKey) {
    if (_0x59ca7f.has(_0x198335)) _0x59ca7f.delete(_0x198335);
    else _0x59ca7f.add(_0x198335);
    return Array.from(_0x59ca7f);
  }
  return [_0x198335];
}
export function getFileManagerMenuActions({
  records: records = [],
  canRevealInFolder: canRevealInFolder = false,
  getMediaKind: getMediaKind = (_0x40a560) => _0x40a560?.mediaKind,
  isActionableRecord: isActionableRecord = (_0x5a52e1) =>
    isActionableFileManagerMediaKind(getMediaKind(_0x5a52e1)),
} = {}) {
  const _0xfbdc80 = (Array.isArray(records) ? records : []).filter(isActionableRecord);
  if (_0xfbdc80.length === 0) return [];
  const _0x4ff086 = ['add-to-canvas'];
  if (_0xfbdc80.length === 1) {
    const _0x3be240 = String(getMediaKind(_0xfbdc80[0]) || '')
      .trim()
      .toLowerCase();
    if (_0x3be240 === 'image' || _0x3be240 === 'video') _0x4ff086.push('fullscreen');
    if (canRevealInFolder) _0x4ff086.push('reveal');
  }
  return (_0x4ff086.push('delete'), _0x4ff086);
}
