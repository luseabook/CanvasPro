import { logDeveloperDiagnosticEvent } from '../../services/diagnosticsService.js';
const STORY_EPISODE_SPLIT_REQUEST_DIAGNOSTIC_PREFIX = '[storyWorkspace][episode-split-request]';
function normalizeText(_0x9e7af0) {
  return String(_0x9e7af0 || '')['trim']();
}
export function createStoryEpisodeSplitDeveloperDiagnostics(_0x167a5f) {
  const _0xff6a7d = _0x167a5f?.['console'];
  return {
    info(_0x32872e, _0x57510a = {}) {
      _0xff6a7d?.['info']?.(_0x32872e, _0x57510a);
      if (_0x32872e !== STORY_EPISODE_SPLIT_REQUEST_DIAGNOSTIC_PREFIX) return null;
      const _0x3a1291 = normalizeText(_0x57510a?.['status']) || 'started';
      return logDeveloperDiagnosticEvent(
        {
          type: 'story.episode_split_request.dev',
          level: _0x3a1291 === 'failed' ? 'error' : 'info',
          source: 'storyWorkspace',
          message: 'Experimental episode split API request ' + _0x3a1291,
          context: _0x57510a,
        },
        { windowObject: _0x167a5f },
      );
    },
  };
}
export function createStoryAssetExtractionDeveloperDiagnostics(_0x1ba263) {
  const _0xf98cc5 = _0x1ba263?.['console'];
  return {
    info(_0x2d631a, _0x2ccc91 = {}) {
      _0xf98cc5?.['info']?.(_0x2d631a, _0x2ccc91);
      const _0x1b996f = normalizeText(_0x2ccc91?.['status']) || 'started';
      return logDeveloperDiagnosticEvent(
        {
          type: 'story.asset_extraction.dev',
          level: _0x1b996f === 'failed' || _0x1b996f === 'fallback' ? 'error' : 'info',
          source: 'storyWorkspace',
          message: 'Experimental asset extraction ' + _0x1b996f,
          context: { label: normalizeText(_0x2d631a), ..._0x2ccc91 },
        },
        { windowObject: _0x1ba263 },
      );
    },
  };
}
