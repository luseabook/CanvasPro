function normalizeText(value) {
  return typeof value === 'string' ? value['trim']() : '';
}
const STORY_SCENE_LEADING_LABEL_PATTERN =
    /^(?:(?:第?\s*\d+\s*场(?:景)?|场\s*\d+|\d+\s*[.、])|(?:次日|翌日|当日|同日|当天|第二天|数日后|几天后|[一二三四五六七八九十百\d]+天(?:后|前)?)|(?:(?:白天|黑夜|清晨|早晨|上午|中午|午后|下午|黄昏|傍晚|晚间|深夜|午夜|凌晨|黎明|日|夜|晨|早|午|晚)(?:\s|[·・•|｜:：,，;；/\\.、-])+(?:内景|外景|内|外))|(?:日内|日外|夜内|夜外|晨内|晨外|晚内|晚外|内景|外景))(?=\s|[·・•|｜:：,，;；/\\.、-]|$)\s*[·・•|｜:：,，;；/\\.、-]*\s*/u,
  STORY_SCENE_STANDALONE_INTERIOR_EXTERIOR_PATTERN = /^(?:内(?!\s+蒙古)|外(?!\s+滩))\s+(?=\S)/u,
  STORY_SCENE_TRAILING_TRANSITION_PATTERN =
    /(?:续上集结尾|承接上集|紧接上场|紧随上场|紧接前场|与此同时|同时|稍后|片刻后|紧接着|转场)\s*$/u;
export function normalizeStorySceneHeadingIdentity(item) {
  let text = normalizeText(item),
    key = '';
  while (text && text !== key) {
    ((key = text),
      (text = text['replace'](STORY_SCENE_STANDALONE_INTERIOR_EXTERIOR_PATTERN, '')
        ['replace'](STORY_SCENE_LEADING_LABEL_PATTERN, '')
        ['trim']()));
  }
  key = '';
  while (text && text !== key) {
    ((key = text), (text = text['replace'](STORY_SCENE_TRAILING_TRANSITION_PATTERN, '')['trim']()));
  }
  return text['replace'](/^[·・•|｜:：,，;；/\\-]+|[·・•|｜:：,，;；/\\-]+$/gu, '')['trim']();
}
export function getStorySceneIdentityKey(index) {
  return normalizeStorySceneHeadingIdentity(index)
    ['toLowerCase']()
    ['replace'](/的(?=公寓|客厅|厨房|走廊|卧室|书房|餐厅|浴室|卫生间|阳台|玄关)/gu, '')
    ['replace'](/[^\p{L}\p{N}]+/gu, '');
}
function getIdentityBigrams(result) {
  const length = getStorySceneIdentityKey(result);
  if (length['length'] < 2) return length ? new Set([length]) : new Set();
  return new Set(
    Array['from']({ length: length['length'] - 1 }, (data, options) =>
      length['slice'](options, options + 2),
    ),
  );
}
export function storySceneIdentitiesOverlap(target, source) {
  const list = getStorySceneIdentityKey(target),
    list2 = getStorySceneIdentityKey(source);
  if (!list || !list2) return false;
  if (list['includes'](list2) || list2['includes'](list)) return true;
  const map = getIdentityBigrams(list);
  return [...getIdentityBigrams(list2)]['some']((next) => map['has'](next));
}
