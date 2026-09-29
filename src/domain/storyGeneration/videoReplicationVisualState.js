import {
  normalizeReplicationVisualContract,
  formatReplicationSpatial,
} from './videoReplicationVisualContract.js';
const fields = ['sceneKey', 'entryState', 'exitState', 'screenText', 'speechSubtitles'];
export function replicationVisualFields(_0x5ec59d = {}) {
  return {
    ...normalizeReplicationVisualContract(_0x5ec59d),
    ...Object['fromEntries'](
      fields['filter']((_0x14406a) => typeof _0x5ec59d[_0x14406a] === 'string')['map']((_0x118fac) => [
        _0x118fac,
        _0x5ec59d[_0x118fac]['trim'](),
      ]),
    ),
    ...(typeof _0x5ec59d['hasStaging'] === 'boolean' ? { hasStaging: _0x5ec59d['hasStaging'] } : {}),
  };
}
export const REPLICATION_VISUAL_ELEMENTS_RULE =
  'textElements 按文字用途逐项记录：physical 是附着于场景物体的文字，carrier 写实际承载物；graphic 是独立叙事标题或广告设计图文；speech_subtitle 是屏幕叠加的人声转录字幕；uncertain 是用途不明。text 只存实际原文，placement 记录位置及出现变化；不能把整段字幕混入 physical/graphic。人声文字由 ASR 独立保留，字幕不是听到原声的证据。visual/camera 不重复文字原文，由程序按类型组织。主体替换不改文字中的原品牌、产品名和文案。';
export const REPLICATION_VISUAL_STATE_RULE =
  'sceneKey\x20表示连续时空的场戏，同场景切机位和插入特写沿用同一值，换场或时间跳跃另建。spatialStart/spatialEnd\x20是镜头边界的空间关系数组，每个人一项：subject\x20人物，landmark\x20固定场景地标或另一主体，relation\x20相对位置，facing\x20朝向/视线，pose\x20姿态，heldObject\x20持物。依据画面记录，已建立且没有移动证据的关系可保持；无法确认的字段留空，无人空镜返回空数组。不用动作摘要代替空间关系。各片段独立生成，没有上一段视频或尾帧；程序只在场戏/片段开头及同场跨段边界输出站位，不增加镜头或时长。';
export function connectReplicationClipStates(_0x160110) {
  return _0x160110['map']((_0x5e2798, _0x4a251c) => {
    const _0x4f9d72 = _0x160110[_0x4a251c - 0x1]?.['shots']?.['at'](-0x1),
      _0x50f5ae = _0x5e2798['shots']?.[0x0],
      _0x389958 = _0x5e2798['shots']?.['at'](-0x1),
      _0x1b1874 = _0x160110[_0x4a251c + 0x1]?.['shots']?.[0x0],
      _0x4a5304 = (_0x3e07e0, _0x2aff5a) =>
        Boolean(
          _0x3e07e0?.['sceneKey'] &&
          _0x3e07e0['sceneKey'] === _0x2aff5a?.['sceneKey'] &&
          formatReplicationSpatial(_0x3e07e0['spatialEnd']),
        );
    return {
      ..._0x5e2798,
      replicationStagingHandoff: _0x4a5304(_0x389958, _0x1b1874),
      ...(_0x4a5304(_0x4f9d72, _0x50f5ae)
        ? {
            shots: [
              { ..._0x50f5ae, spatialStart: structuredClone(_0x4f9d72['spatialEnd']) },
              ..._0x5e2798['shots']['slice'](0x1),
            ],
          }
        : {}),
    };
  });
}
