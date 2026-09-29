import { getStoryReplicationPromptInputKey } from './storyReplicationPromptFreshness.js';
import { buildReplicationSegmentPlan } from '../../domain/storyGeneration/videoReplicationSegmentPlan.js';
import { resolveStoryPromptModeDefaultVideoModelId } from '../../domain/storyGeneration/promptModes.js';
import { resolveStoryVideoClipDurationConstraints } from './storyVideoGenerationSettings.js';
export function assertStoryReplicationGenerationCurrent(_0x1743d6, _0x2ce231) {
  const _0x4fc4af = _0x2ce231['replication']?.['generationInputKey'];
  if (!_0x4fc4af) return;
  const _0x148a52 = _0x1743d6['episodes']['find']((_0x4a9e0a) => _0x4a9e0a['id'] === _0x2ce231['id']);
  if (!_0x148a52 || getStoryReplicationPromptInputKey(_0x1743d6, _0x148a52) !== _0x4fc4af)
    throw new Error('替换设置或原片核对内容已变化，请按最新设置重新生成；本次结果未覆盖原片。');
}
export async function prepareStoryReplicationGenerationEpisode({
  episode: _0x462338,
  projectData: _0x3fd2cc,
  onProgress: _0x5bea8e,
  isActive: _0x18d8f5,
}) {
  if (!_0x462338['replication']?.['sourceAnalysis']) return _0x462338;
  if (!_0x18d8f5()) throw new Error('视频生成所属项目已失效。');
  _0x5bea8e?.({ message: '正在结合原片时间线和当前素材编排分段提示词' });
  const _0x6ced1 = structuredClone(_0x462338);
  (delete _0x6ced1['replication']['adaptedScript'],
    delete _0x6ced1['replication']['generationPrepared'],
    (_0x6ced1['replication']['generationInputKey'] = getStoryReplicationPromptInputKey(
      _0x3fd2cc,
      _0x462338,
    )));
  const _0x2788ff = _0x3fd2cc['project']['planning'] || {},
    _0xe33bcf = _0x2788ff['promptMode'] || 'seedance-2.0',
    _0x201f17 = resolveStoryVideoClipDurationConstraints(
      resolveStoryPromptModeDefaultVideoModelId(_0xe33bcf),
    ),
    _0x47c298 = _0x201f17?.['maxSeconds'] || 0xf;
  return (
    (_0x6ced1['replication']['segmentPlan'] = buildReplicationSegmentPlan(
      _0x6ced1['replication']['sourceAnalysis'],
      {
        durationSec: _0x462338['sourceVideo']['durationSec'],
        promptMode: _0xe33bcf,
        maxSeconds: Math['min'](
          _0x47c298,
          Number(_0x2788ff['sceneMaxSeconds']) > 0x0 ? Number(_0x2788ff['sceneMaxSeconds']) : _0x47c298,
        ),
      },
    )),
    _0x6ced1
  );
}
