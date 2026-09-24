function getResponseText(_0x43f515) {
  return typeof _0x43f515 === 'string' ? _0x43f515 : '';
}
export function repairStoryEpisodeScriptMissingBodyTerminators(_0x49ce4a) {
  const _0x33fd52 = getResponseText(_0x49ce4a);
  if (!_0x33fd52) return { text: _0x33fd52, repairedCount: 0x0 };
  let _0xa5390d = 0x0;
  const _0x475773 = (_0x49558f, _0x5b7d8b, _0x5d9e57) => {
    return ((_0xa5390d += 0x1), '' + _0x5b7d8b + _0x5d9e57 + '\x22}');
  };
  let _0x3df02f = _0x33fd52['replace'](
    /("body"\s*:\s*")((?:\\.|[^"\\])*?)\}(?=\s*,\s*\{\s*"(?:ref|sceneRef|scene_ref|id)"\s*:)/gu,
    _0x475773,
  );
  return (
    (_0x3df02f = _0x3df02f['replace'](
      /("body"\s*:\s*")((?:\\.|[^"\\])*?)\}(?=\s*\]\s*,\s*"(?:continuityFacts|facts|continuity_facts|endingState|finalState|continuityState|ending_state)"\s*:)/gu,
      _0x475773,
    )),
    { text: _0x3df02f, repairedCount: _0xa5390d }
  );
}
