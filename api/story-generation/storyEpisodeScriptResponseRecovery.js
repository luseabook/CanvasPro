function getResponseText(value) {
  return typeof value === 'string' ? value : '';
}
export function repairStoryEpisodeScriptMissingBodyTerminators(item) {
  const text = getResponseText(item);
  if (!text) return { text: text, repairedCount: 0 };
  let repairedCount = 0;
  const key = (index, result, data) => {
    return ((repairedCount += 1), '' + result + data + '"}');
  };
  let text2 = text['replace'](
    /("body"\s*:\s*")((?:\\.|[^"\\])*?)\}(?=\s*,\s*\{\s*"(?:ref|sceneRef|scene_ref|id)"\s*:)/gu,
    key,
  );
  return (
    (text2 = text2['replace'](
      /("body"\s*:\s*")((?:\\.|[^"\\])*?)\}(?=\s*\]\s*,\s*"(?:continuityFacts|facts|continuity_facts|endingState|finalState|continuityState|ending_state)"\s*:)/gu,
      key,
    )),
    { text: text2, repairedCount: repairedCount }
  );
}
