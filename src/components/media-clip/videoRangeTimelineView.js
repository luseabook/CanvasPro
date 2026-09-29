export function createVideoRangeTimelineView({
  documentRef: documentRef = globalThis['document'],
  thumbnailCount: thumbnailCount = 0xa,
  labelText: labelText = '0.00s',
} = {}) {
  if (!documentRef?.['createElement']) throw new Error('Video range timeline requires a document');
  const _0x20c910 = documentRef['createElement']('div');
  ((_0x20c910['className'] = 'v2-video-cliptrack'), (_0x20c910['dataset']['videoRangeTimeline'] = ''));
  const _0xce5755 = documentRef['createElement']('div');
  _0xce5755['className'] = 'v2-video-clipticks';
  const _0x1b4185 = documentRef['createElement']('div');
  _0x1b4185['className'] = 'v2-video-clipthumbs';
  const _0x5f0711 = [],
    _0x30e4e1 = Math['max'](0x1, Math['trunc'](Number(thumbnailCount) || 0x0));
  for (let _0x49821d = 0x0; _0x49821d < _0x30e4e1; _0x49821d += 0x1) {
    const _0x32f9bc = documentRef['createElement']('div');
    ((_0x32f9bc['className'] = 'v2-video-clipthumb'),
      _0x1b4185['appendChild'](_0x32f9bc),
      _0x5f0711['push'](_0x32f9bc));
  }
  const _0x29b857 = documentRef['createElement']('div');
  _0x29b857['className'] = 'v2-video-cliprange';
  const _0x49e7aa = documentRef['createElement']('div');
  _0x49e7aa['className'] = 'v2-video-clipselection';
  const _0x316ecf = documentRef['createElement']('div');
  ((_0x316ecf['className'] = 'v2-video-cliphandle left'), (_0x316ecf['dataset']['handle'] = 'left'));
  const _0x56eefa = documentRef['createElement']('div');
  ((_0x56eefa['className'] = 'v2-video-cliphandle right'), (_0x56eefa['dataset']['handle'] = 'right'));
  const _0x1ea900 = documentRef['createElement']('div');
  _0x1ea900['className'] = 'v2-video-clipplayhead';
  const _0x4c4ed7 = documentRef['createElement']('div');
  return (
    (_0x4c4ed7['className'] = 'v2-video-cliplabel'),
    (_0x4c4ed7['textContent'] = String(labelText || '0.00s')),
    _0x29b857['appendChild'](_0x49e7aa),
    _0x29b857['appendChild'](_0x316ecf),
    _0x29b857['appendChild'](_0x56eefa),
    _0x20c910['appendChild'](_0x1b4185),
    _0x20c910['appendChild'](_0x29b857),
    _0x20c910['appendChild'](_0x1ea900),
    _0x20c910['appendChild'](_0xce5755),
    _0x20c910['appendChild'](_0x4c4ed7),
    {
      trackEl: _0x20c910,
      ticksEl: _0xce5755,
      thumbsEl: _0x1b4185,
      thumbEls: _0x5f0711,
      rangeEl: _0x29b857,
      selectionEl: _0x49e7aa,
      leftHandleEl: _0x316ecf,
      rightHandleEl: _0x56eefa,
      playheadEl: _0x1ea900,
      labelEl: _0x4c4ed7,
    }
  );
}
