import path from 'node:path';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { rename, rm, writeFile } from 'node:fs/promises';
import { createOpenJianyingOperation } from './timelineExport/jianyingExportAction.js';
import { createTimelineExportOperation } from './timelineExport/timelineExportOperation.js';
import {
  defaultNodeExportZipName,
  exportNodeItemsToZip,
  NODE_EXPORT_FILE_EXTENSION,
  saveNodeMediaToFile,
  withNodeExportZipExtension,
} from './nodeExportService.js';

const MEDIA_DEFAULT_EXTENSIONS = Object.freeze({ image: 'png', video: 'mp4', audio: 'mp3' });
const MEDIA_DIALOG_TITLES = Object.freeze({ image: '保存图片', video: '保存视频', audio: '保存音频' });
const MAX_TEXT_FILE_BYTES = 16 * 1024 * 1024;
const MAX_MEDIA_FILES = 500;
const NODE_EXPORT_STATE_FILENAME = 'node-export-state.json';

function getDialogFilters() {
  return [{ name: 'ZIP Archive', extensions: [NODE_EXPORT_FILE_EXTENSION.replace(/^\./, '')] }];
}
function trimText(value) {
  return String(value || '').trim();
}
function firstNonEmpty(...values) {
  for (const value of values) {
    const trimmed = trimText(value);
    if (trimmed) return trimmed;
  }
  return '';
}
function assertAbsolutePath(value, label) {
  const trimmed = trimText(value);
  if (!trimmed) return '';
  if (!path.isAbsolute(trimmed)) throw new Error(`${label} must be an absolute path`);
  return path.resolve(trimmed);
}
function assertFilename(value) {
  const trimmed = trimText(value);
  if (!trimmed) return '';
  if (trimmed.includes('/') || trimmed.includes('\\') || path.basename(trimmed) !== trimmed)
    throw new Error('Export filename must not include path separators');
  return withNodeExportZipExtension(trimmed);
}
function sanitizeMediaFilename(value, kind) {
  const fallback = `${kind || 'media'}.${MEDIA_DEFAULT_EXTENSIONS[kind] || 'bin'}`;
  const safe = trimText(value)
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
    .replace(/[. ]+$/g, '')
    .slice(0, 160)
    .trim();
  const name = safe || fallback;
  return path.extname(name) ? name : `${name}.${MEDIA_DEFAULT_EXTENSIONS[kind] || 'bin'}`;
}
function sanitizeTextFilename(value) {
  const safe = trimText(value)
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
    .replace(/[. ]+$/g, '')
    .slice(0, 160)
    .trim();
  return safe || 'export.txt';
}
function getFilenameExtension(name, fallback = 'txt') {
  return path.extname(name).replace(/^\./, '').toLowerCase() || fallback;
}
function getMediaDialogFilters(kind, fileName) {
  const extension =
    path.extname(fileName).replace(/^\./, '').toLowerCase() ||
    MEDIA_DEFAULT_EXTENSIONS[kind] ||
    'bin';
  return [{ name: MEDIA_DIALOG_TITLES[kind] || '媒体文件', extensions: [extension] }];
}
function ensureDirectory(directory) {
  mkdirSync(directory, { recursive: true });
  if (!statSync(directory).isDirectory()) throw new Error('Export directory is not a directory');
}
function showNativeSaveDialog(dialog, parentWindow, options) {
  return parentWindow ? dialog.showSaveDialog(parentWindow, options) : dialog.showSaveDialog(options);
}
function showNativeOpenDialog(dialog, parentWindow, options) {
  return parentWindow ? dialog.showOpenDialog(parentWindow, options) : dialog.showOpenDialog(options);
}
async function writeUtf8FileAtomic(targetPath, content) {
  const resolved = path.resolve(targetPath);
  mkdirSync(path.dirname(resolved), { recursive: true });
  const staged = path.join(
    path.dirname(resolved),
    `.${path.basename(resolved)}.${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.part`,
  );
  try {
    await writeFile(staged, content, { encoding: 'utf8', flag: 'wx' });
    await rm(resolved, { force: true });
    await rename(staged, resolved);
  } finally {
    await rm(staged, { force: true }).catch(() => {});
  }
  return resolved;
}
function uniqueMediaOutputPath(directory, fileName, taken) {
  const extension = path.extname(fileName);
  const stem = extension ? fileName.slice(0, -extension.length) : fileName;
  let index = 1;
  let candidate = path.join(directory, fileName);
  while (existsSync(candidate) || taken.has(candidate.toLowerCase())) {
    index += 1;
    candidate = path.join(directory, `${stem} (${index})${extension}`);
  }
  taken.add(candidate.toLowerCase());
  return candidate;
}

export function createNodeExportController({
  app,
  dialog,
  getMainWindow = () => null,
  resolveLocalVirtualPath,
  getNodeExportRoots,
  getRuntimeToolOrFallback,
  showSaveDialog: injectedShowSaveDialog,
  showOpenDialog: injectedShowOpenDialog,
  openPath,
  fetchImpl = globalThis.fetch,
} = {}) {
  const saveDialog = (options) =>
      typeof injectedShowSaveDialog === 'function'
        ? injectedShowSaveDialog(options)
        : showNativeSaveDialog(dialog, getMainWindow(), options),
    openDialog = (options) =>
      typeof injectedShowOpenDialog === 'function'
        ? injectedShowOpenDialog(options)
        : showNativeOpenDialog(dialog, getMainWindow(), options),
    getFallbackDirectory = () => {
      let downloads = '';
      try {
        downloads = app.getPath('downloads');
      } catch {}
      let temp = '';
      try {
        temp = app.getPath('temp');
      } catch {}
      return downloads || temp || process.cwd();
    },
    getDefaultZipPath = () => path.join(getFallbackDirectory(), defaultNodeExportZipName());
  let rememberedDirectory = '',
    stateLoaded = false;
  const getStateFilePath = () => {
      try {
        return path.join(app.getPath('userData'), NODE_EXPORT_STATE_FILENAME);
      } catch {
        return '';
      }
    },
    getDefaultDirectory = () => {
      if (!stateLoaded) {
        stateLoaded = true;
        const statePath = getStateFilePath();
        if (statePath && existsSync(statePath)) {
          try {
            const parsed = JSON.parse(readFileSync(statePath, 'utf8'));
            const remembered = assertAbsolutePath(
              parsed?.lastMediaExportDirectory,
              'Remembered media export directory',
            );
            if (remembered && statSync(remembered).isDirectory()) rememberedDirectory = remembered;
          } catch {}
        }
      }
      return rememberedDirectory || getFallbackDirectory();
    },
    rememberDirectory = async (directory) => {
      const resolved = assertAbsolutePath(directory, 'Media export directory');
      if (!resolved) return;
      rememberedDirectory = resolved;
      stateLoaded = true;
      const statePath = getStateFilePath();
      if (!statePath) return;
      try {
        await writeUtf8FileAtomic(
          statePath,
          `${JSON.stringify({ lastMediaExportDirectory: resolved }, null, 2)}\n`,
        );
      } catch {}
    },
    resolveZipOutputPath = (payload = {}) => {
      const explicitPath = firstNonEmpty(payload?.outputPath, payload?.filePath, payload?.path);
      if (explicitPath)
        return withNodeExportZipExtension(assertAbsolutePath(explicitPath, 'Export outputPath'));
      const directory = firstNonEmpty(
        payload?.directory,
        payload?.downloadDir,
        payload?.targetDir,
        payload?.destinationDirectory,
      );
      if (!directory) return '';
      const resolvedDirectory = assertAbsolutePath(directory, 'Export directory');
      ensureDirectory(resolvedDirectory);
      const filename =
        assertFilename(payload?.filename || payload?.fileName) || defaultNodeExportZipName();
      return path.join(resolvedDirectory, filename);
    },
    exportSelectedNodesPackage = async (payload = {}) => {
      let outputPath = resolveZipOutputPath(payload);
      if (!outputPath) {
        const selection = await saveDialog({
          title: '批量下载节点',
          defaultPath: getDefaultZipPath(),
          filters: getDialogFilters(),
        });
        if (selection.canceled || !selection.filePath) return { success: false, canceled: true };
        outputPath = withNodeExportZipExtension(selection.filePath);
      }
      let tempRoot = '';
      try {
        tempRoot = app.getPath('temp');
      } catch {}
      return await exportNodeItemsToZip({
        outputPath,
        items: payload?.items || [],
        resolveLocalVirtualPath,
        tempRoot,
      });
    },
    saveMediaFile = async (payload = {}) => {
      const kind = trimText(payload?.kind).toLowerCase();
      if (!Object.prototype.hasOwnProperty.call(MEDIA_DEFAULT_EXTENSIONS, kind))
        throw new Error('Unsupported media kind');
      const fileName = sanitizeMediaFilename(payload?.filename || payload?.fileName, kind);
      const selection = await saveDialog({
        title: MEDIA_DIALOG_TITLES[kind],
        defaultPath: path.join(getDefaultDirectory(), fileName),
        filters: getMediaDialogFilters(kind, fileName),
      });
      if (selection.canceled || !selection.filePath) return { success: false, canceled: true };
      const targetPath = path.extname(selection.filePath)
          ? selection.filePath
          : `${selection.filePath}.${MEDIA_DEFAULT_EXTENSIONS[kind]}`,
        saved = await saveNodeMediaToFile({
          outputPath: targetPath,
          item: { kind, localPath: payload?.localPath, url: payload?.url },
          resolveLocalVirtualPath,
          fetchImpl,
        });
      await rememberDirectory(path.dirname(saved.path));
      return saved;
    },
    saveTextFile = async (payload = {}) => {
      const content = String(payload?.content ?? '');
      if (Buffer.byteLength(content, 'utf8') > MAX_TEXT_FILE_BYTES)
        throw new Error('Text export exceeds the 16 MB limit');
      const fileName = sanitizeTextFilename(payload?.filename || payload?.fileName),
        extension = getFilenameExtension(fileName),
        selection = await saveDialog({
          title: trimText(payload?.title) || '保存文件',
          defaultPath: path.join(getFallbackDirectory(), fileName),
          filters: [{ name: trimText(payload?.filterName) || 'Text File', extensions: [extension] }],
        });
      if (selection.canceled || !selection.filePath) return { success: false, canceled: true };
      const targetPath = path.extname(selection.filePath)
          ? selection.filePath
          : `${selection.filePath}.${extension}`,
        writtenPath = await writeUtf8FileAtomic(targetPath, content);
      return { success: true, canceled: false, path: writtenPath, filename: path.basename(writtenPath) };
    },
    saveMediaFiles = async (payload = {}) => {
      const files = Array.isArray(payload?.files) ? payload.files : [];
      if (files.length === 0) throw new Error('Media files are required');
      if (files.length > MAX_MEDIA_FILES)
        throw new Error(`Cannot save more than ${MAX_MEDIA_FILES} media files at once`);
      let directory = trimText(payload?.directory);
      if (directory) {
        directory = assertAbsolutePath(directory, 'Media export directory');
        ensureDirectory(directory);
      } else {
        const selection = await openDialog({
          title: trimText(payload?.title) || '选择保存目录',
          defaultPath: getDefaultDirectory(),
          properties: ['openDirectory', 'createDirectory'],
        });
        if (selection.canceled || !selection.filePaths?.[0])
          return { success: false, canceled: true, count: 0, files: [] };
        directory = path.resolve(selection.filePaths[0]);
        ensureDirectory(directory);
      }
      const taken = new Set(),
        saved = [];
      for (const file of files) {
        const kind = trimText(file?.kind).toLowerCase();
        if (!Object.prototype.hasOwnProperty.call(MEDIA_DEFAULT_EXTENSIONS, kind))
          throw new Error('Unsupported media kind');
        const fileName = sanitizeMediaFilename(file?.filename || file?.fileName, kind),
          outputPath = uniqueMediaOutputPath(directory, fileName, taken);
        saved.push(
          await saveNodeMediaToFile({
            outputPath,
            item: { kind, localPath: file?.localPath, url: file?.url },
            resolveLocalVirtualPath,
            fetchImpl,
          }),
        );
      }
      await rememberDirectory(directory);
      return { success: true, canceled: false, directory, count: saved.length, files: saved };
    };
  return {
    exportSelectedNodesPackage,
    saveMediaFile,
    saveTextFile,
    saveMediaFiles,
    saveTimeline: createTimelineExportOperation({
      dialog,
      getWindow: getMainWindow,
      showOpenDialog: injectedShowOpenDialog,
      getDefaultDirectory,
      rememberDirectory,
      getRoots: getNodeExportRoots,
      resolveLocalVirtualPath,
      getRuntimeToolOrFallback,
    }),
    openJianying: createOpenJianyingOperation({ openPath }),
  };
}
