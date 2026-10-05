import { getStoryAssetAppearances } from './storyAssetAppearances.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
export function createStoryAssetImageLocalization({
  asset: asset,
  appearance: appearance,
  projectToken: projectToken,
  isLive: isLive,
  applyResult: applyResult,
  onLocalized: onLocalized = () => {},
}) {
  const text = normalizeText(asset?.['id']),
    text2 = normalizeText(appearance?.['id']);
  let enabled = false,
    text3 = '',
    enabled2 = null;
  const run = async (item) => {
    if (!enabled) return ((enabled2 = item), false);
    if (typeof isLive === 'function' && !isLive(projectToken)) return false;
    const enabled3 = projectToken?.['data']?.['assets']?.['find'](
        (key) => normalizeText(key?.['id']) === text,
      ),
      storyAssetAppearances = getStoryAssetAppearances(enabled3)['find'](
        (index) => normalizeText(index?.['id']) === text2,
      );
    if (!enabled3 || !storyAssetAppearances || normalizeText(storyAssetAppearances['imageUrl']) !== text3)
      return false;
    return (
      applyResult(enabled3, storyAssetAppearances, item),
      await onLocalized(enabled3, storyAssetAppearances),
      true
    );
  };
  return {
    options: {
      onOutputLocalized: run,
      onOutputLocalizationFailed: () => {
        enabled2 = null;
      },
    },
    commitRemote() {
      ((text3 = normalizeText(appearance?.['imageUrl'])), (enabled = true));
      if (!enabled2) return;
      const result = enabled2;
      ((enabled2 = null), void run(result)['catch'](() => {}));
    },
  };
}
