export const PERSON_REPLACEMENT_WORKSPACE_INTENTS = Object['freeze']({
  PREVIEW_GENERATION: 'preview-generation',
  GET_PROMPT_ENHANCEMENT_MODEL: 'get-prompt-enhancement-model',
  LIST_LIBRARY_ASSETS: 'list-library-assets',
  SELECT_SOURCE_VIDEOS: 'select-source-videos',
  SELECT_SOURCE_VIDEO: 'select-source-video',
  REMOVE_SOURCE: 'remove-source',
  PROCESS_SOURCES: 'process-sources',
  ADD_LIBRARY_ASSETS_TO_PROJECT: 'add-library-assets-to-project',
  ADD_LIBRARY_ASSETS_TO_CHARACTERS: 'add-library-assets-to-characters',
  ADD_ASSET_APPEARANCE_TO_LIBRARY: 'add-asset-appearance-to-library',
  SELECT_NEW_CHARACTER_IMAGES: 'select-new-character-images',
  SELECT_NEW_CHARACTER_IMAGE: 'select-new-character-image',
  SELECT_NEW_SCENE_IMAGES: 'select-new-scene-images',
  SELECT_NEW_AUDIO_FILES: 'select-new-audio-files',
  SELECT_CHARACTER_REFERENCE: 'select-character-reference',
  SELECT_REPLACEMENT_IMAGE: 'select-replacement-image',
  SELECT_REPLACEMENT_VIDEO_RESULT: 'select-replacement-video-result',
  SELECT_REPLACEMENT_VIDEO_INPUT: 'select-replacement-video-input',
  REMOVE_REPLACEMENT_VIDEO_INPUT: 'remove-replacement-video-input',
  SELECT_SHOT_KEYFRAME: 'select-shot-keyframe',
  SELECT_CHARACTER_VOICE: 'select-character-voice',
  SELECT_CHARACTER_VOICE_LIBRARY: 'select-character-voice-library',
  DELETE_CHARACTER: 'delete-character',
  DELETE_SCENE: 'delete-scene',
  DELETE_AUDIO_ASSET: 'delete-audio-asset',
  DOWNLOAD_IMAGE: 'download-image',
  DOWNLOAD_VIDEO: 'download-video',
  GENERATE_CHARACTER_IMAGE: 'generate-character-image',
  RESOLVE_CHARACTER_IMAGE_BATCH_CONCURRENCY: 'resolve-character-image-batch-concurrency',
  GENERATE_REPLACEMENT_IMAGE: 'generate-replacement-image',
  CANCEL_REPLACEMENT_IMAGE: 'cancel-replacement-image',
  GENERATE_REPLACEMENT_VIDEO: 'generate-replacement-video',
  CANCEL_REPLACEMENT_VIDEO: 'cancel-replacement-video',
  COMPLETE_GENERATION_BATCH: 'complete-generation-batch',
  DETECT_SHOT_CUT_RANGES: 'detect-shot-cut-ranges',
  UPDATE_SHOT_CUT_RANGES: 'update-shot-cut-ranges',
  UPDATE_SHOT_REVERSE: 'update-shot-reverse',
  SELECT_MANUAL_PERSON: 'select-manual-person',
  UPDATE_PEOPLE: 'update-people',
  DELETE_PEOPLE: 'delete-people',
  MERGE_SOURCE_IDENTITIES: 'merge-source-identities',
  SPLIT_SOURCE_IDENTITY: 'split-source-identity',
  CONFIRM_SOURCE_IDENTITY: 'confirm-source-identity',
  MOUNT_VOICE_STUDIO: 'mount-voice-studio',
  EXTRACT_VOICE: 'extract-voice',
  CANCEL_VOICE_EXTRACTION: 'cancel-voice-extraction',
  RESUME_VOICE_EXTRACTION: 'resume-voice-extraction',
  OPEN_PROJECT: 'open-project',
  RENAME_PROJECT: 'rename-project',
  DUPLICATE_PROJECT: 'duplicate-project',
  COLLECT_PROJECT: 'collect-project',
  IMPORT_PROJECT: 'import-project',
  ARCHIVE_PROJECT: 'archive-project',
  DELETE_PROJECT: 'delete-project',
  BACK_HOME: 'back-home',
  COMPOSE_OUTPUT: 'compose-output',
  EXPORT_OUTPUT: 'export-output',
  ADD_OUTPUT_TO_CANVAS: 'add-output-to-canvas',
  REPORT_STEP_NAVIGATION_BLOCKED: 'report-step-navigation-blocked',
  HAS_PROJECT_PACKAGE_DRAG: 'has-project-package-drag',
  DROP_PROJECT_PACKAGE: 'drop-project-package',
  CAN_CLOSE: 'can-close',
  CLOSE: 'close',
});
const KNOWN_INTENTS = new Set(Object['values'](PERSON_REPLACEMENT_WORKSPACE_INTENTS));
function normalizeIntent(value) {
  return String(value || '')['trim']();
}
export function createPersonReplacementWorkspaceIntentPort({ handlers: handlers = {} } = {}) {
  if (!handlers || typeof handlers !== 'object' || Array['isArray'](handlers))
    throw new TypeError(
      'Replacement\x20Studio\x20workspace\x20intent\x20handlers\x20must\x20be\x20an\x20object.',
    );
  const map = new Map();
  return (
    Object['entries'](handlers)['forEach'](([item, key]) => {
      const intent = normalizeIntent(item);
      if (!KNOWN_INTENTS['has'](intent))
        throw new TypeError('Unsupported\x20Replacement\x20Studio\x20workspace\x20intent:\x20' + item);
      if (typeof key !== 'function')
        throw new TypeError('Replacement Studio workspace intent handler must be a function: ' + item);
      map['set'](intent, key);
    }),
    Object['freeze']({
      supports(index) {
        const intent2 = normalizeIntent(index);
        return KNOWN_INTENTS['has'](intent2) && map['has'](intent2);
      },
      request(result, ...args) {
        const intent3 = normalizeIntent(result);
        if (!KNOWN_INTENTS['has'](intent3))
          throw new TypeError('Unsupported\x20Replacement\x20Studio\x20workspace\x20intent:\x20' + result);
        return map['get'](intent3)?.(...args);
      },
    })
  );
}
