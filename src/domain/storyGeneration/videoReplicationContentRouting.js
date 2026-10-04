export const REPLICATION_CONTENT_TYPES = ['story', 'narrated_story', 'advertisement', 'unknown'];
export const normalizeReplicationContentType = (value) =>
  REPLICATION_CONTENT_TYPES['includes'](value) ? value : 'unknown';
export const REPLICATION_CONTENT_ROUTING_RULE =
  '在本次完整视频观察中同时识别 contentType：story=以人物事件为主的剧情，narrated_story=剧情伴随解说/旁白，advertisement=以产品/品牌展示或销售传播为主的广告（也可包含故事），unknown=证据不足。contentTypeReason 简述画面依据；有人讲话、画面有商品或字幕，不足以单独认定广告。类型用于选择提示词模板，不改变原片内容，不改 ASR 文字，不重新判定每句人声类型，也不增加单独分类或审核请求。';
const narrative =
    '剧情模板：重点还原人物动作、表情、镜头与人物关系。textElements\x20的\x20physical/graphic\x20只记录当前画面实际物体文字或独立叙事图文；对白/旁白的转录字幕归\x20speech_subtitle\x20证据条目，不进入画面生成指令，也不塞入\x20visual/camera。人声仍完整输出一次。人物站位只用于建立场戏和同场跨段衔接，空镜/静物不套站位。',
  rules = {
    story: narrative + '人物对白放在对应镜头，不根据剧情类型删掉实际存在的画外音。',
    narrated_story:
      narrative + '画外音保留独立起止，跨镜只在起始镜头写一次；不能把解说说到的事情编成当前画面。',
    advertisement:
      '广告模板：还原产品展示、构图、运镜、光影与演示动作；画面文案及字幕原文保存在 textElements 观察证据，不改写品牌或宣传文案。产品位置、朝向和变化写入画面，不套人物起始/结束状态表。有人物的连续表演需要站位时才填写空间关系数组。原人声照常独立输出。',
    unknown:
      '类型未确定：保留已观察画面、镜头和人声，画面文字与转录字幕分别记录，不猜成广告或故事；不输出转录字幕生成指令，不追加识别请求、不阻断交付，供用户核对。',
  };
export function replicationRoutePolicy(item) {
  const contentType = normalizeReplicationContentType(item);
  return {
    contentType: contentType,
    includeSpeechSubtitles: ![],
    instruction:
      rules[contentType] +
      '生成提示词不呈现画面文字：字幕、人物介绍、物体文字与广告文案均只保存在 textElements 证据，不进入 visual/camera 或其他生成正文；人声原文照常保留。',
  };
}
export function resolveReplicationContentType(...list) {
  return list['map'](normalizeReplicationContentType)['find']((key) => key !== 'unknown') || 'unknown';
}
