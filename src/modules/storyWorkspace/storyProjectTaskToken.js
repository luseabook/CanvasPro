import { resolveStoryTextProviderProfileId } from './storyProjectPlanning.js';
function normalizeText(value) {
  return String(value || '').trim();
}
export function sanitizeStoryTaskResumePayload(args = {}) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) return {};
  const response = { ...args };
  return (
    delete response.apiKey,
    delete response.installId,
    delete response.authorization,
    delete response.headers,
    response
  );
}
export function createStoryProjectTaskToken(args2 = {}) {
  const text = normalizeText(args2?.data?.project?.id),
    item = args2?.storyProjectSessionById,
    key =
      item && typeof item === 'object'
        ? Math.max(0, Math.trunc(Number(item[text]) || 0))
        : Math.max(0, Math.trunc(Number(args2?.storyProjectSessionId) || 0));
  return {
    projectId: text,
    sessionId: key,
    data: args2?.data || null,
    projectTitleEdited: args2?.projectTitleEdited === true,
    modelSettings: {
      models: { ...(args2?.models || {}) },
      textProvider: normalizeText(args2?.textProvider),
      textProviderProfileId: resolveStoryTextProviderProfileId(
        args2?.textProvider,
        args2?.textProviderProfileId,
      ),
      imageProvider: normalizeText(args2?.imageProvider),
      videoProvider: normalizeText(args2?.videoProvider),
      videoProviderProfileId: normalizeText(args2?.videoProviderProfileId),
      videoProviderProfileIdByModel: { ...(args2?.videoProviderProfileIdByModel || {}) },
      imageGenerationParams: { ...(args2?.imageGenerationParams || {}) },
      videoGenerationParams: { ...(args2?.videoGenerationParams || {}) },
      imageGenerationParamsByModel: { ...(args2?.imageGenerationParamsByModel || {}) },
      videoGenerationParamsByModel: { ...(args2?.videoGenerationParamsByModel || {}) },
    },
  };
}
export function isStoryProjectTaskTokenLive(options = {}, enabled = null) {
  if (!enabled || typeof enabled !== 'object') return false;
  const text2 = normalizeText(enabled.projectId);
  if (!text2 || text2 !== normalizeText(enabled.data?.project?.id)) return false;
  const index = options?.storyProjectSessionById,
    result =
      index && typeof index === 'object'
        ? Math.max(0, Math.trunc(Number(index[text2]) || 0))
        : Math.max(0, Math.trunc(Number(options?.storyProjectSessionId) || 0));
  if (enabled.sessionId !== result) return false;
  if (text2 === normalizeText(options?.data?.project?.id)) return true;
  return (Array.isArray(options?.projects) ? options.projects : []).some(
    (data) => normalizeText(data?.id || data?.data?.project?.id) === text2,
  );
}
export function isStoryProjectTaskTokenCurrent(options2 = {}, target = null) {
  return (
    isStoryProjectTaskTokenLive(options2, target) &&
    target.projectId === normalizeText(options2?.data?.project?.id)
  );
}
export function advanceStoryProjectSession(
  enabled2 = {},
  text3 = normalizeText(enabled2?.data?.project?.id),
) {
  if (!enabled2 || typeof enabled2 !== 'object') return 0;
  const text4 = normalizeText(text3);
  if (!text4) return 0;
  (!enabled2.storyProjectSessionById || typeof enabled2.storyProjectSessionById !== 'object') &&
    (enabled2.storyProjectSessionById = {});
  const text5 = normalizeText(enabled2?.data?.project?.id),
    source = Object.prototype.hasOwnProperty.call(enabled2.storyProjectSessionById, text4)
      ? enabled2.storyProjectSessionById[text4]
      : text4 === text5
        ? enabled2.storyProjectSessionId
        : 0,
    next = Math.max(0, Math.trunc(Number(source) || 0)) + 1;
  return (
    (enabled2.storyProjectSessionById[text4] = next),
    text4 === text5 && (enabled2.storyProjectSessionId = next),
    next
  );
}
