function normalizeText(_0x470365) {
  return typeof _0x470365 === 'string' ? _0x470365['trim']() : '';
}
const STORY_SCENE_LEADING_LABEL_PATTERN =
    /^(?:(?:第?\s*\d+\s*场(?:景)?|场\s*\d+|\d+\s*[.、])|(?:次日|翌日|当日|同日|当天|第二天|数日后|几天后|[一二三四五六七八九十百\d]+天(?:后|前)?)|(?:(?:白天|黑夜|清晨|早晨|上午|中午|午后|下午|黄昏|傍晚|晚间|深夜|午夜|凌晨|黎明|日|夜|晨|早|午|晚)(?:\s|[·・•|｜:：,，;；/\\.、-])+(?:内景|外景|内|外))|(?:日内|日外|夜内|夜外|晨内|晨外|晚内|晚外|内景|外景))(?=\s|[·・•|｜:：,，;；/\\.、-]|$)\s*[·・•|｜:：,，;；/\\.、-]*\s*/u,
  STORY_SCENE_STANDALONE_INTERIOR_EXTERIOR_PATTERN = /^(?:内(?!\s+蒙古)|外(?!\s+滩))\s+(?=\S)/u,
  STORY_SCENE_TRAILING_TRANSITION_PATTERN =
    /(?:续上集结尾|承接上集|紧接上场|紧随上场|紧接前场|与此同时|同时|稍后|片刻后|紧接着|转场)\s*$/u;
export function normalizeStorySceneHeadingIdentity(_0x588786) {
  let _0x49a074 = normalizeText(_0x588786),
    _0x1651b8 = '';
  while (_0x49a074 && _0x49a074 !== _0x1651b8) {
    ((_0x1651b8 = _0x49a074),
      (_0x49a074 = _0x49a074['replace'](STORY_SCENE_STANDALONE_INTERIOR_EXTERIOR_PATTERN, '')
        ['replace'](STORY_SCENE_LEADING_LABEL_PATTERN, '')
        ['trim']()));
  }
  _0x1651b8 = '';
  while (_0x49a074 && _0x49a074 !== _0x1651b8) {
    ((_0x1651b8 = _0x49a074),
      (_0x49a074 = _0x49a074['replace'](STORY_SCENE_TRAILING_TRANSITION_PATTERN, '')['trim']()));
  }
  return _0x49a074['replace'](/^[·・•|｜:：,，;；/\\-]+|[·・•|｜:：,，;；/\\-]+$/gu, '')['trim']();
}
export function getStorySceneIdentityKey(_0x2d6cbc) {
  return normalizeStorySceneHeadingIdentity(_0x2d6cbc)
    ['toLowerCase']()
    ['replace'](/的(?=公寓|客厅|厨房|走廊|卧室|书房|餐厅|浴室|卫生间|阳台|玄关)/gu, '')
    ['replace'](/[^\p{L}\p{N}]+/gu, '');
}
function getIdentityBigrams(_0x1ef5f4) {
  const _0x10bbb5 = getStorySceneIdentityKey(_0x1ef5f4);
  if (_0x10bbb5['length'] < 0x2) return _0x10bbb5 ? new Set([_0x10bbb5]) : new Set();
  return new Set(
    Array['from']({ length: _0x10bbb5['length'] - 0x1 }, (_0x371a3f, _0x4991d3) =>
      _0x10bbb5['slice'](_0x4991d3, _0x4991d3 + 0x2),
    ),
  );
}
export function storySceneIdentitiesOverlap(_0x5507ff, _0x42f228) {
  const _0x1aedf0 = getStorySceneIdentityKey(_0x5507ff),
    _0x748ddd = getStorySceneIdentityKey(_0x42f228);
  if (!_0x1aedf0 || !_0x748ddd) return ![];
  if (_0x1aedf0['includes'](_0x748ddd) || _0x748ddd['includes'](_0x1aedf0)) return !![];
  const _0x36af9f = getIdentityBigrams(_0x1aedf0);
  return [...getIdentityBigrams(_0x748ddd)]['some']((_0x1b8620) => _0x36af9f['has'](_0x1b8620));
}
