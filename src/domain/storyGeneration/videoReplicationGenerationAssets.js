export const REPLICATION_IMAGE_APPEARANCE_GUIDANCE =
  '人物形象、发型和服装以选定参考图为准；正文只写角色动作、表情、站位和视线，不复述原演员外貌或服装，不反推或猜测参考图特征。';
export function buildVideoReplicationGenerationAssets(_0x5eb078 = [], _0x403ec2 = {}) {
  if (_0x403ec2?.['sourceMode'] !== 'video-replication') return _0x5eb078;
  return _0x5eb078['map']((_0x5b96c0) => {
    if (_0x5b96c0['kind'] !== 'character') return _0x5b96c0;
    let _0x1e7d2c = ![];
    const _0x3680a4 = (_0x5b96c0['appearances'] || [])['map']((_0x31487d, _0x558b57) => {
      if (_0x31487d['sourceOrigin'] !== 'library' || !_0x31487d['imageUrl']) return _0x31487d;
      return (
        (_0x1e7d2c = !![]),
        {
          ..._0x31487d,
          name: '参考形象' + (_0x558b57 + 0x1),
          description: REPLICATION_IMAGE_APPEARANCE_GUIDANCE,
          prompt: '',
        }
      );
    });
    return _0x1e7d2c
      ? { ..._0x5b96c0, description: REPLICATION_IMAGE_APPEARANCE_GUIDANCE, appearances: _0x3680a4 }
      : _0x5b96c0;
  });
}
