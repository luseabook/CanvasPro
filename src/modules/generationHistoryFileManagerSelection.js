export function isActionableFileManagerMediaKind(value) {
  const item = String(value || '')
    .trim()
    .toLowerCase();
  return item === 'image' || item === 'video' || item === 'audio';
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
  const key = String(localPath || '').trim();
  if (key)
    return [
      'media',
      String(projectId || '').trim(),
      String(canvasId || '').trim(),
      String(mediaKind || '')
        .trim()
        .toLowerCase(),
      key,
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
  record: record,
  source: source = 'history',
  projectId: projectId = '',
  canvasId: canvasId = '',
  activeFilter: activeFilter = 'all',
  getMediaKind: getMediaKind = (index) => index?.mediaKind,
} = {}) {
  const result = String(projectId || '').trim(),
    data = String(canvasId || '').trim();
  if (result && String(record?.projectId || '').trim() !== result) return false;
  if (source === 'current-canvas' && data && String(record?.canvasId || '').trim() !== data) return false;
  const options = String(activeFilter || 'all').trim();
  return options === 'all' || String(getMediaKind(record) || '').trim() === options;
}
export function getFileManagerSelectionAfterClick({
  current: current = [],
  recordId: recordId = '',
  shiftKey: shiftKey = false,
  actionable: actionable = true,
} = {}) {
  const enabled = String(recordId || ''),
    map = new Set((Array.isArray(current) ? current : []).map((item2) => String(item2 || '')));
  if (!enabled || !actionable) return Array.from(map);
  if (shiftKey) {
    if (map.has(enabled)) map.delete(enabled);
    else map.add(enabled);
    return Array.from(map);
  }
  return [enabled];
}
export function getFileManagerMenuActions({
  records: records = [],
  canRevealInFolder: canRevealInFolder = false,
  getMediaKind: getMediaKind = (target) => target?.mediaKind,
  isActionableRecord: isActionableRecord = (next) => isActionableFileManagerMediaKind(getMediaKind(next)),
} = {}) {
  const list = (Array.isArray(records) ? records : []).filter(isActionableRecord);
  if (list.length === 0) return [];
  const list2 = ['add-to-canvas'];
  if (list.length === 1) {
    const entry = String(getMediaKind(list[0]) || '')
      .trim()
      .toLowerCase();
    if (entry === 'image' || entry === 'video') list2.push('fullscreen');
    if (canRevealInFolder) list2.push('reveal');
  }
  return (list2.push('delete'), list2);
}

export function buildFileManagerHistoryEntryKey({
  projectId: projectId = '',
  canvasId: canvasId = '',
  generationRunId: generationRunId = '',
  mediaKind: mediaKind = '',
  sourceIndex: sourceIndex = 0x0,
  localPath: localPath = '',
  resultFingerprint: resultFingerprint = '',
} = {}) {
  const payload = String(generationRunId || '')['trim']();
  if (payload)
    return [
      'generation',
      String(projectId || '')['trim'](),
      String(canvasId || '')['trim'](),
      payload,
      String(mediaKind || '')
        ['trim']()
        ['toLowerCase'](),
      Math['max'](0x0, Math['trunc'](Number(sourceIndex) || 0x0)),
    ]['join'](':');
  return buildFileManagerHistoryMediaKey({
    projectId: projectId,
    canvasId: canvasId,
    mediaKind: mediaKind,
    localPath: localPath,
    resultFingerprint: resultFingerprint,
  });
}

function defaultHistoryLocalPath(state) {
  const handle = Array['isArray'](state?.['nodes']) ? state['nodes'][0x0] : null;
  return String(
    state?.['localPath'] ||
      handle?.['originalLocalPath'] ||
      handle?.['localPath'] ||
      handle?.['displayLocalPath'] ||
      handle?.['imageUrl'] ||
      handle?.['videoUrl'] ||
      handle?.['audioUrl'] ||
      handle?.['src'] ||
      '',
  )['trim']();
}

export function isFileManagerHistoryBackfillRecord(config) {
  const scope = String(config?.['historyCaptureSource'] || '')['trim']();
  if (scope) return scope === 'backfill';
  if (!String(config?.['generationRunId'] || '')['trim']()) return ![];
  const count = Number(config?.['generationStartedAt'] || 0x0),
    input = Number(config?.['createdAt'] || 0x0),
    output = Math['max'](0x0, Math['trunc'](Number(config?.['sourceIndex']) || 0x0));
  return Number['isFinite'](count) && count > 0x0 && Number['isFinite'](input) && input === count + output;
}

function buildFileManagerBackfillMatchKey(
  value2,
  {
    getMediaKind: getMediaKind = (value3) => value3?.['mediaKind'],
    getLocalPath: getLocalPath = defaultHistoryLocalPath,
  } = {},
) {
  const enabled2 = String(value2?.['sourceNodeId'] || '')['trim']();
  if (!enabled2) return '';
  const fileManagerHistoryMediaKey = buildFileManagerHistoryMediaKey({
    projectId: value2?.['projectId'],
    canvasId: value2?.['canvasId'],
    mediaKind: getMediaKind(value2),
    localPath: getLocalPath(value2),
    resultFingerprint: value2?.['resultFingerprint'],
  });
  if (!fileManagerHistoryMediaKey) return '';
  return [
    enabled2,
    Math['max'](0x0, Math['trunc'](Number(value2?.['sourceIndex']) || 0x0)),
    fileManagerHistoryMediaKey,
  ]['join'](':');
}

export function isFileManagerBackfillDuplicate(
  value4,
  value5,
  {
    getMediaKind: getMediaKind = (value6) => value6?.['mediaKind'],
    getLocalPath: getLocalPath = defaultHistoryLocalPath,
  } = {},
) {
  if (!isFileManagerHistoryBackfillRecord(value5)) return ![];
  const fileManagerBackfillMatchKey = buildFileManagerBackfillMatchKey(value5, {
    getMediaKind: getMediaKind,
    getLocalPath: getLocalPath,
  });
  return Boolean(
    fileManagerBackfillMatchKey &&
    fileManagerBackfillMatchKey ===
      buildFileManagerBackfillMatchKey(value4, { getMediaKind: getMediaKind, getLocalPath: getLocalPath }),
  );
}

export function resolveFileManagerBackfillStartedAt(value7) {
  for (const value8 of [
    value7?.['generationStartTime'],
    value7?.['rhTaskStartedAt'],
    value7?.['dreaminaTaskStartedAt'],
    value7?.['asyncTaskStartedAt'],
    value7?.['createdAt'],
  ]) {
    const count2 = Number(value8);
    if (Number['isFinite'](count2) && count2 > 0x0) return Math['trunc'](count2);
  }
  const value9 = String(value7?.['id'] || '')['match'](/\d{13}/g) || [],
    count3 = Number(value9[value9['length'] - 0x1] || 0x0);
  return Number['isFinite'](count3) && count3 > 0x0 ? Math['trunc'](count3) : 0x1;
}

export function dedupeFileManagerHistoryRecords(
  value10,
  {
    getMediaKind: getMediaKind = (value11) => value11?.['mediaKind'],
    getLocalPath: getLocalPath = defaultHistoryLocalPath,
  } = {},
) {
  const value12 = [...(Array['isArray'](value10) ? value10 : [])]['sort']((value13, value14) => {
      const value15 = Number(value13?.['updatedAt'] || value13?.['createdAt'] || 0x0),
        value16 = Number(value14?.['updatedAt'] || value14?.['createdAt'] || 0x0);
      return value16 - value15;
    }),
    value17 = value12['filter']((value18) => !isFileManagerHistoryBackfillRecord(value18)),
    value19 = new Set(),
    map2 = new Set(),
    value20 = [];
  for (const value21 of value12) {
    if (isFileManagerHistoryBackfillRecord(value21)) {
      if (
        value17['some']((value22) =>
          isFileManagerBackfillDuplicate(value22, value21, {
            getMediaKind: getMediaKind,
            getLocalPath: getLocalPath,
          }),
        )
      )
        continue;
      const fileManagerBackfillMatchKey2 = buildFileManagerBackfillMatchKey(value21, {
        getMediaKind: getMediaKind,
        getLocalPath: getLocalPath,
      });
      if (fileManagerBackfillMatchKey2 && value19['has'](fileManagerBackfillMatchKey2)) continue;
      if (fileManagerBackfillMatchKey2) value19['add'](fileManagerBackfillMatchKey2);
    }
    const fileManagerHistoryEntryKey = buildFileManagerHistoryEntryKey({
      projectId: value21?.['projectId'],
      canvasId: value21?.['canvasId'],
      generationRunId: value21?.['generationRunId'],
      mediaKind: getMediaKind(value21),
      sourceIndex: value21?.['sourceIndex'],
      localPath: getLocalPath(value21),
      resultFingerprint: value21?.['resultFingerprint'],
    });
    if (fileManagerHistoryEntryKey && map2['has'](fileManagerHistoryEntryKey)) continue;
    if (fileManagerHistoryEntryKey) map2['add'](fileManagerHistoryEntryKey);
    value20['push'](value21);
  }
  return value20;
}
