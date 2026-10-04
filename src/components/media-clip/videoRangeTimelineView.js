export function createVideoRangeTimelineView({
  documentRef: documentRef = globalThis['document'],
  thumbnailCount: thumbnailCount = 0xa,
  labelText: labelText = '0.00s',
} = {}) {
  if (!documentRef?.['createElement']) throw new Error('Video range timeline requires a document');
  const trackEl = documentRef['createElement']('div');
  ((trackEl['className'] = 'v2-video-cliptrack'), (trackEl['dataset']['videoRangeTimeline'] = ''));
  const ticksEl = documentRef['createElement']('div');
  ticksEl['className'] = 'v2-video-clipticks';
  const thumbsEl = documentRef['createElement']('div');
  thumbsEl['className'] = 'v2-video-clipthumbs';
  const thumbEls = [],
    value = Math['max'](0x1, Math['trunc'](Number(thumbnailCount) || 0x0));
  for (let item = 0x0; item < value; item += 0x1) {
    const key = documentRef['createElement']('div');
    ((key['className'] = 'v2-video-clipthumb'), thumbsEl['appendChild'](key), thumbEls['push'](key));
  }
  const rangeEl = documentRef['createElement']('div');
  rangeEl['className'] = 'v2-video-cliprange';
  const selectionEl = documentRef['createElement']('div');
  selectionEl['className'] = 'v2-video-clipselection';
  const leftHandleEl = documentRef['createElement']('div');
  ((leftHandleEl['className'] = 'v2-video-cliphandle left'), (leftHandleEl['dataset']['handle'] = 'left'));
  const rightHandleEl = documentRef['createElement']('div');
  ((rightHandleEl['className'] = 'v2-video-cliphandle right'),
    (rightHandleEl['dataset']['handle'] = 'right'));
  const playheadEl = documentRef['createElement']('div');
  playheadEl['className'] = 'v2-video-clipplayhead';
  const labelEl = documentRef['createElement']('div');
  return (
    (labelEl['className'] = 'v2-video-cliplabel'),
    (labelEl['textContent'] = String(labelText || '0.00s')),
    rangeEl['appendChild'](selectionEl),
    rangeEl['appendChild'](leftHandleEl),
    rangeEl['appendChild'](rightHandleEl),
    trackEl['appendChild'](thumbsEl),
    trackEl['appendChild'](rangeEl),
    trackEl['appendChild'](playheadEl),
    trackEl['appendChild'](ticksEl),
    trackEl['appendChild'](labelEl),
    {
      trackEl: trackEl,
      ticksEl: ticksEl,
      thumbsEl: thumbsEl,
      thumbEls: thumbEls,
      rangeEl: rangeEl,
      selectionEl: selectionEl,
      leftHandleEl: leftHandleEl,
      rightHandleEl: rightHandleEl,
      playheadEl: playheadEl,
      labelEl: labelEl,
    }
  );
}
