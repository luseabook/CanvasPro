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

export function buildFileManagerHistoryEntryKey({projectId:projectId='',canvasId:canvasId='',generationRunId:generationRunId='',mediaKind:mediaKind='',sourceIndex:sourceIndex=0x0,localPath:localPath='',resultFingerprint:resultFingerprint=''}={}){const _0x3255e5=String(generationRunId||'')["trim"]();if(_0x3255e5)return["generation",String(projectId||'')["trim"](),String(canvasId||'')["trim"](),_0x3255e5,String(mediaKind||'')["trim"]()["toLowerCase"](),Math["max"](0x0,Math["trunc"](Number(sourceIndex)||0x0))]["join"](':');return buildFileManagerHistoryMediaKey({'projectId':projectId,'canvasId':canvasId,'mediaKind':mediaKind,'localPath':localPath,'resultFingerprint':resultFingerprint});}

function defaultHistoryLocalPath(_0x478a6c){const _0xee02c8=Array['isArray'](_0x478a6c?.["nodes"])?_0x478a6c['nodes'][0x0]:null;return String(_0x478a6c?.["localPath"]||_0xee02c8?.["originalLocalPath"]||_0xee02c8?.["localPath"]||_0xee02c8?.["displayLocalPath"]||_0xee02c8?.["imageUrl"]||_0xee02c8?.["videoUrl"]||_0xee02c8?.["audioUrl"]||_0xee02c8?.["src"]||'')['trim']();}

export function isFileManagerHistoryBackfillRecord(_0x4a6135){const _0x1eefbc=String(_0x4a6135?.["historyCaptureSource"]||'')["trim"]();if(_0x1eefbc)return _0x1eefbc==="backfill";if(!String(_0x4a6135?.["generationRunId"]||'')['trim']())return![];const _0x451137=Number(_0x4a6135?.["generationStartedAt"]||0x0),_0x13326f=Number(_0x4a6135?.["createdAt"]||0x0),_0x1d438e=Math["max"](0x0,Math["trunc"](Number(_0x4a6135?.['sourceIndex'])||0x0));return Number["isFinite"](_0x451137)&&_0x451137>0x0&&Number["isFinite"](_0x13326f)&&_0x13326f===_0x451137+_0x1d438e;}

function buildFileManagerBackfillMatchKey(_0x20adc9,{getMediaKind:getMediaKind=_0x34247e=>_0x34247e?.["mediaKind"],getLocalPath:getLocalPath=defaultHistoryLocalPath}={}){const _0x28dd97=String(_0x20adc9?.["sourceNodeId"]||'')["trim"]();if(!_0x28dd97)return'';const _0x10737a=buildFileManagerHistoryMediaKey({'projectId':_0x20adc9?.["projectId"],'canvasId':_0x20adc9?.["canvasId"],'mediaKind':getMediaKind(_0x20adc9),'localPath':getLocalPath(_0x20adc9),'resultFingerprint':_0x20adc9?.["resultFingerprint"]});if(!_0x10737a)return'';return[_0x28dd97,Math["max"](0x0,Math["trunc"](Number(_0x20adc9?.["sourceIndex"])||0x0)),_0x10737a]["join"](':');}

export function isFileManagerBackfillDuplicate(_0x4c6e8d,_0x5bd2c6,{getMediaKind:getMediaKind=_0xc0b6bd=>_0xc0b6bd?.['mediaKind'],getLocalPath:getLocalPath=defaultHistoryLocalPath}={}){if(!isFileManagerHistoryBackfillRecord(_0x5bd2c6))return![];const _0x40e989=buildFileManagerBackfillMatchKey(_0x5bd2c6,{'getMediaKind':getMediaKind,'getLocalPath':getLocalPath});return Boolean(_0x40e989&&_0x40e989===buildFileManagerBackfillMatchKey(_0x4c6e8d,{'getMediaKind':getMediaKind,'getLocalPath':getLocalPath}));}

export function resolveFileManagerBackfillStartedAt(_0x2d4e06){for(const _0x46693 of[_0x2d4e06?.["generationStartTime"],_0x2d4e06?.["rhTaskStartedAt"],_0x2d4e06?.["dreaminaTaskStartedAt"],_0x2d4e06?.["asyncTaskStartedAt"],_0x2d4e06?.["createdAt"]]){const _0x5cfc02=Number(_0x46693);if(Number['isFinite'](_0x5cfc02)&&_0x5cfc02>0x0)return Math["trunc"](_0x5cfc02);}const _0x4571d9=String(_0x2d4e06?.['id']||'')["match"](/\d{13}/g)||[],_0x5d5247=Number(_0x4571d9[_0x4571d9["length"]-0x1]||0x0);return Number["isFinite"](_0x5d5247)&&_0x5d5247>0x0?Math['trunc'](_0x5d5247):0x1;}

export function dedupeFileManagerHistoryRecords(_0x3479dc,{getMediaKind:getMediaKind=_0x2eb535=>_0x2eb535?.["mediaKind"],getLocalPath:getLocalPath=defaultHistoryLocalPath}={}){const _0x596efd=[...Array["isArray"](_0x3479dc)?_0x3479dc:[]]["sort"]((_0x1d4620,_0x4e9693)=>{const _0x8234bf=Number(_0x1d4620?.["updatedAt"]||_0x1d4620?.["createdAt"]||0x0),_0x150cc8=Number(_0x4e9693?.["updatedAt"]||_0x4e9693?.['createdAt']||0x0);return _0x150cc8-_0x8234bf;}),_0x330dd2=_0x596efd["filter"](_0x45e036=>!isFileManagerHistoryBackfillRecord(_0x45e036)),_0x53729f=new Set(),_0x1da2f9=new Set(),_0x2950cf=[];for(const _0x4749fb of _0x596efd){if(isFileManagerHistoryBackfillRecord(_0x4749fb)){if(_0x330dd2["some"](_0x20674e=>isFileManagerBackfillDuplicate(_0x20674e,_0x4749fb,{'getMediaKind':getMediaKind,'getLocalPath':getLocalPath})))continue;const _0x38f8e4=buildFileManagerBackfillMatchKey(_0x4749fb,{'getMediaKind':getMediaKind,'getLocalPath':getLocalPath});if(_0x38f8e4&&_0x53729f["has"](_0x38f8e4))continue;if(_0x38f8e4)_0x53729f["add"](_0x38f8e4);}const _0x51a25a=buildFileManagerHistoryEntryKey({'projectId':_0x4749fb?.['projectId'],'canvasId':_0x4749fb?.['canvasId'],'generationRunId':_0x4749fb?.["generationRunId"],'mediaKind':getMediaKind(_0x4749fb),'sourceIndex':_0x4749fb?.["sourceIndex"],'localPath':getLocalPath(_0x4749fb),'resultFingerprint':_0x4749fb?.["resultFingerprint"]});if(_0x51a25a&&_0x1da2f9['has'](_0x51a25a))continue;if(_0x51a25a)_0x1da2f9["add"](_0x51a25a);_0x2950cf["push"](_0x4749fb);}return _0x2950cf;}
