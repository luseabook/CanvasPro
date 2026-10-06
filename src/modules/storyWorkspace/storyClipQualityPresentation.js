import { inspectReplicationSourceCompleteness } from '../../domain/storyGeneration/videoReplicationTimingContract.js';
import { STORY_SCRIPT_STALE_MESSAGE } from './storyScriptRevision.js';
export function getStoryClipQualityNotes(value, item) {
  const key = new Set([item.ref, item.planningRef, item.id].filter(Boolean)),
    index = value.splitQualityReview,
    result = (index?.unresolvedItems || []).filter((data) => key.has(data.clipRef)),
    enabled = result.flatMap((args) => [
      ...(args.issues || []).map((options) => options.reason || options.message),
      ...(args.error ? ['自动修补未采用，保留原候选：' + args.error] : []),
    ]).filter(Boolean);
  if (value.storyboardStale) enabled.unshift(STORY_SCRIPT_STALE_MESSAGE);
  return (
    value.replication?.sourceAnalysis &&
      index?.verificationScope !== 'format-and-timing' &&
      enabled.push(
        ...inspectReplicationSourceCompleteness({ clips: [item] }, value).map(
          (target) => target.message,
        ),
      ),
    !enabled.length &&
      index?.unresolvedClipRefs?.some((source) => key.has(source)) &&
      enabled.push('本段内容核对未完成，已保留提示词，请结合原片检查。'),
    [...new Set(enabled)]
  );
}
export function getStoryEpisodeSplitDeliveryMessage(next) {
  const current = next.clips || [],
    entry = current.filter((record) => getStoryClipQualityNotes(next, record).length).length;
  return entry
    ? '已保存 ' + current.length + ' 个片段，其中 ' + entry + ' 段需核对；请查看片段旁的核对记录。'
    : '已保存 ' +
        current.length +
        ' 个片段' +
        (next.splitQualityReview?.verificationScope === 'format-and-timing'
          ? '，格式与时间检查完成，请自行检查内容'
          : next.splitQualityReview?.status === 'passed'
            ? '，内容检查已通过'
            : '') +
        '。';
}
export function renderStoryClipQualityNotes(payload, handle, handler) {
  const list = getStoryClipQualityNotes(payload, handle);
  if (!list.length) return '';
  return (
    '<details class="story-clip-quality-notes" data-story-clip-quality-notes>\n    <summary>本段有 ' +
    list.length +
    ' 项需核对 · 已保留可编辑提示词</summary>\n    <div class="story-clip-quality-notes-body" tabindex="0" aria-label="本段生成核对记录">\n      <p>以下为生成时的核对记录，不属于视频提示词；编辑后请结合原片确认。</p>\n      <ul>' +
    list.map((state) => '<li>' + handler(state) + '</li>').join('') +
    '</ul>\n    </div>\n  </details>'
  );
}
