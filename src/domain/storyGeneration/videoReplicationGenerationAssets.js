export const REPLICATION_IMAGE_APPEARANCE_GUIDANCE =
  '人物形象、发型和服装以选定参考图为准；正文只写角色动作、表情、站位和视线，不复述原演员外貌或服装，不反推或猜测参考图特征。';
export function buildVideoReplicationGenerationAssets(list = [], value = {}) {
  if (value?.['sourceMode'] !== 'video-replication') return list;
  return list['map']((args) => {
    if (args['kind'] !== 'character') return args;
    let item = ![];
    const appearances = (args['appearances'] || [])['map']((args2, key) => {
      if (args2['sourceOrigin'] !== 'library' || !args2['imageUrl']) return args2;
      return (
        (item = !![]),
        {
          ...args2,
          name: '参考形象' + (key + 0x1),
          description: REPLICATION_IMAGE_APPEARANCE_GUIDANCE,
          prompt: '',
        }
      );
    });
    return item
      ? { ...args, description: REPLICATION_IMAGE_APPEARANCE_GUIDANCE, appearances: appearances }
      : args;
  });
}
