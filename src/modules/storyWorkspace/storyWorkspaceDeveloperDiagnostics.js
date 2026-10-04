import { logDeveloperDiagnosticEvent } from '../../services/diagnosticsService.js';
const STORY_EPISODE_SPLIT_REQUEST_DIAGNOSTIC_PREFIX = '[storyWorkspace][episode-split-request]';
function normalizeText(value) {
  return String(value || '')['trim']();
}
export function createStoryEpisodeSplitDeveloperDiagnostics(windowObject) {
  const item = windowObject?.['console'];
  return {
    info(key, context = {}) {
      item?.['info']?.(key, context);
      if (key !== STORY_EPISODE_SPLIT_REQUEST_DIAGNOSTIC_PREFIX) return null;
      const level = normalizeText(context?.['status']) || 'started';
      return logDeveloperDiagnosticEvent(
        {
          type: 'story.episode_split_request.dev',
          level: level === 'failed' ? 'error' : 'info',
          source: 'storyWorkspace',
          message: 'Experimental episode split API request ' + level,
          context: context,
        },
        { windowObject: windowObject },
      );
    },
  };
}
export function createStoryAssetExtractionDeveloperDiagnostics(windowObject2) {
  const index = windowObject2?.['console'];
  return {
    info(result, response = {}) {
      index?.['info']?.(result, response);
      const level2 = normalizeText(response?.['status']) || 'started';
      return logDeveloperDiagnosticEvent(
        {
          type: 'story.asset_extraction.dev',
          level: level2 === 'failed' || level2 === 'fallback' ? 'error' : 'info',
          source: 'storyWorkspace',
          message: 'Experimental asset extraction ' + level2,
          context: { label: normalizeText(result), ...response },
        },
        { windowObject: windowObject2 },
      );
    },
  };
}
