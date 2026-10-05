import { replaceStoryCharacterVoiceReference } from './storyCharacterVoice.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
const text = (value) => String(value ?? '')['trim']();
export const storyAudioUploads = new WeakSet();
export const getStoryAudioUrl = (item) => {
  const text2 = text(item?.['audioUrl'] || item?.['sourceUrl'] || item?.['url'] || item?.['localPath']);
  return localPathToUrl(text2) || text2;
};
export const isStoryAudioAsset = (key) => key?.['mediaKind'] === 'audio';
export const getStoryProjectAudioAssets = (index) =>
  (index?.['audioAssets'] || [])['filter'](isStoryAudioAsset);
export const getStoryAudioBoundCharacters = (result, data) =>
  (result?.['assets'] || [])['filter'](
    (options) =>
      options['kind'] === 'character' &&
      getStoryAudioUrl(options['voiceReference']) === getStoryAudioUrl(data),
  );
export function addStoryAudioAssets(target, source) {
  const next = [...getStoryProjectAudioAssets(target)],
    current = [];
  for (const entry of source) {
    const storyAudioUrl = getStoryAudioUrl(entry);
    if (!isStoryAudioAsset(entry) || !storyAudioUrl) continue;
    let enabled = next['find']((record) => getStoryAudioUrl(record) === storyAudioUrl);
    (!enabled &&
      ((enabled = {
        id: 'story-audio-' + globalThis['crypto']['randomUUID'](),
        mediaKind: 'audio',
        kind: 'audio',
        name: text(entry['name'] || entry['assetName']) || '未命名音频',
        audioUrl: storyAudioUrl,
        localPath: text(entry['localPath']),
        sourceAssetId: text(entry['sourceAssetId']),
        sourceItemIndex: entry['sourceItemIndex'] || 0,
        waveformUrl: text(entry['waveformUrl']),
        description: text(entry['description']),
      }),
      next['push'](enabled)),
      current['push'](enabled));
  }
  return ((target['audioAssets'] = next), current);
}
export function bindStoryAudioToCharacter(payload, handle, state) {
  const enabled2 = payload['assets']['find'](
    (config) => config['kind'] === 'character' && config['id'] === state,
  );
  if (!enabled2 || !getStoryAudioUrl(handle)) return false;
  const [scope] = addStoryAudioAssets(payload, [handle]);
  return Boolean(
    scope &&
    replaceStoryCharacterVoiceReference(enabled2, {
      audioUrl: scope['audioUrl'],
      localPath: scope['localPath'],
      fileName: scope['name'],
    }),
  );
}
export function removeStoryAudioAsset(input, output) {
  input['audioAssets'] = getStoryProjectAudioAssets(input)['filter']((value2) => value2['id'] !== output);
}
