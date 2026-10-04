import { saveMediaDownload, saveMediaFilesDownload } from '../../services/downloadSaveService.js';
import { localPathToUrl, normalizeLocalPath } from '../../utils/localMediaPath.js';
export const PERSON_REPLACEMENT_EXPORT_MODES = Object['freeze']({
  FINAL_VIDEO: 'final-video',
  CURRENT_CLIP: 'current-clip',
  ALL_REPLACEMENT_CLIPS: 'all-replacement-clips',
  ALL_CLIPS_AND_IMAGES: 'all-clips-and-images',
});
function normalizeText(value) {
  return String(value || '')['trim']();
}
function normalizeMode(item) {
  const text = normalizeText(item);
  if (Object['values'](PERSON_REPLACEMENT_EXPORT_MODES)['includes'](text)) return text;
  return PERSON_REPLACEMENT_EXPORT_MODES['CURRENT_CLIP'];
}
function formatSequence(key) {
  return String(key + 0x1)['padStart'](0x2, '0');
}
function resolveMediaExtension(index, result) {
  const text2 = normalizeText(index)
    ['replace'](/[?#].*$/, '')
    ['match'](/\.([a-z0-9]{2,10})$/i);
  return normalizeText(text2?.[0x1])['toLowerCase']() || result;
}
function buildMediaFile({ ref: ref, kind: kind, filename: filename }) {
  const text3 = normalizeText(ref);
  if (!text3) return null;
  const localPath = normalizeLocalPath(text3);
  return {
    kind: kind,
    localPath: localPath,
    url: localPathToUrl(localPath) || text3,
    filename: filename,
  };
}
function buildReplacementVideoFile(data, options) {
  const ref2 = normalizeText(data?.['resultVideoRef']);
  if (!ref2) return null;
  return buildMediaFile({
    ref: ref2,
    kind: 'video',
    filename: '镜头片段' + formatSequence(options) + '-替换视频.' + resolveMediaExtension(ref2, 'mp4'),
  });
}
function buildReplacementImageFile(target, source) {
  const ref3 = normalizeText(target?.['replacementImageRef']);
  if (!ref3) return null;
  return buildMediaFile({
    ref: ref3,
    kind: 'image',
    filename: '镜头片段' + formatSequence(source) + '-替换图.' + resolveMediaExtension(ref3, 'png'),
  });
}
function buildReplacementAudioFile(next) {
  const ref4 = normalizeText(next?.['audio']?.['replacementAudioRef']);
  if (!ref4) return null;
  return buildMediaFile({
    ref: ref4,
    kind: 'audio',
    filename: '替换音频.' + resolveMediaExtension(ref4, 'wav'),
  });
}
function buildFinalVideoFile(current) {
  const ref5 = normalizeText(current?.['output']?.['finalVideoRef']);
  if (!ref5) return null;
  return buildMediaFile({
    ref: ref5,
    kind: 'video',
    filename: '完整视频.' + resolveMediaExtension(ref5, 'mp4'),
  });
}
function createSkippedEntry(entry, record, kind2) {
  return {
    shotId: normalizeText(entry?.['id']),
    shotName: '镜头片段' + formatSequence(record),
    kind: kind2,
  };
}
export function buildPersonReplacementExportPlan({
  project: project = {},
  mode: mode = PERSON_REPLACEMENT_EXPORT_MODES['CURRENT_CLIP'],
} = {}) {
  const mode2 = normalizeMode(mode),
    list = Array['isArray'](project['shots']) ? project['shots'] : [],
    files = [],
    skipped = [];
  if (mode2 === PERSON_REPLACEMENT_EXPORT_MODES['FINAL_VIDEO']) {
    const finalVideoFile = buildFinalVideoFile(project);
    if (!finalVideoFile) throw new Error('完整视频尚未封装，请先完成视频与音轨合成。');
    files['push'](finalVideoFile);
  } else {
    if (mode2 === PERSON_REPLACEMENT_EXPORT_MODES['CURRENT_CLIP']) {
      const text4 = normalizeText(project['workspace']?.['selectedShotId']),
        count = list['findIndex']((payload) => normalizeText(payload?.['id']) === text4);
      if (count < 0x0) throw new Error('请先选择要导出的镜头片段。');
      const replacementVideoFile = buildReplacementVideoFile(list[count], count);
      if (!replacementVideoFile) throw new Error('当前片段还没有可导出的替换视频。');
      files['push'](replacementVideoFile);
    } else {
      list['forEach']((handle, state) => {
        const replacementVideoFile2 = buildReplacementVideoFile(handle, state);
        if (replacementVideoFile2) files['push'](replacementVideoFile2);
        else skipped['push'](createSkippedEntry(handle, state, 'video'));
        if (mode2 === PERSON_REPLACEMENT_EXPORT_MODES['ALL_CLIPS_AND_IMAGES']) {
          const replacementImageFile = buildReplacementImageFile(handle, state);
          if (replacementImageFile) files['push'](replacementImageFile);
          else skipped['push'](createSkippedEntry(handle, state, 'image'));
        }
      });
      const replacementAudioFile = buildReplacementAudioFile(project);
      if (replacementAudioFile) files['push'](replacementAudioFile);
      if (!files['length'])
        throw new Error(
          mode2 === PERSON_REPLACEMENT_EXPORT_MODES['ALL_CLIPS_AND_IMAGES']
            ? '当前项目还没有可导出的替换片段、音频或替换图。'
            : '当前项目还没有可导出的替换片段或音频。',
        );
    }
  }
  const title =
    mode2 === PERSON_REPLACEMENT_EXPORT_MODES['FINAL_VIDEO']
      ? '导出完整视频'
      : mode2 === PERSON_REPLACEMENT_EXPORT_MODES['CURRENT_CLIP']
        ? '导出当前片段'
        : mode2 === PERSON_REPLACEMENT_EXPORT_MODES['ALL_REPLACEMENT_CLIPS']
          ? '导出所有替换片段/音频'
          : '导出所有替换结果';
  return { mode: mode2, title: title, files: files, skipped: skipped };
}
export async function exportPersonReplacementMedia({
  project: project = {},
  mode: mode = PERSON_REPLACEMENT_EXPORT_MODES['CURRENT_CLIP'],
  saveMedia: saveMedia = saveMediaDownload,
  saveMediaFiles: saveMediaFiles = saveMediaFilesDownload,
} = {}) {
  const title2 = buildPersonReplacementExportPlan({ project: project, mode: mode }),
    exportedCount =
      title2['mode'] === PERSON_REPLACEMENT_EXPORT_MODES['FINAL_VIDEO'] ||
      title2['mode'] === PERSON_REPLACEMENT_EXPORT_MODES['CURRENT_CLIP']
        ? await saveMedia({ ...title2['files'][0x0], title: title2['title'] })
        : await saveMediaFiles({ title: title2['title'], files: title2['files'] });
  return {
    ...exportedCount,
    mode: title2['mode'],
    requestedCount: title2['files']['length'] + title2['skipped']['length'],
    exportedCount: exportedCount?.['count'] ?? title2['files']['length'],
    skipped: title2['skipped'],
    skippedCount: title2['skipped']['length'],
  };
}
