import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream, existsSync, readFileSync } from 'node:fs';
import { mkdir, readdir, rm, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import extract_zip from 'extract-zip';
import {
  resolveAsrRuntimeBaseDir,
  resolveAsrRuntimeInstallDir,
  resolveAsrRuntimePythonCommand,
  resolveAsrRuntimeStatePath,
} from '../asrRuntimeResolver.js';
import { resolvePreferredRuntimePythonCommand } from '../pythonRuntimeResolver.js';
const ASR_RUNTIME_STAGE = Object.freeze({
  CHECK: 'asr-runtime-check',
  MANIFEST: 'asr-runtime-manifest',
  DOWNLOAD: 'asr-runtime-download',
  EXTRACT: 'asr-runtime-extract',
  VERIFY: 'asr-runtime-verify',
});
function normalizeText(value) {
  return String(value || '').trim();
}
function normalizeUrl(value) {
  const text = normalizeText(value);
  if (!text) return '';
  try {
    const parsed = new URL(text);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : '';
  } catch {
    return '';
  }
}
function normalizePlatform(value = process.platform) {
  const text = normalizeText(value).toLowerCase();
  return text || process.platform;
}
function normalizeArch(value = process.arch) {
  const text = normalizeText(value).toLowerCase();
  return text || process.arch;
}
function normalizeManifestPackage(entry = {}) {
  if (!entry || typeof entry !== 'object') return null;
  const url = normalizeUrl(entry.url),
    mirrors = Array.isArray(entry.mirrors)
      ? entry.mirrors
          .map((item) => normalizeUrl(typeof item === 'string' ? item : item?.url))
          .filter(Boolean)
      : [];
  return {
    version: normalizeText(entry.version),
    platform: normalizePlatform(entry.platform),
    arch: normalizeArch(entry.arch),
    url: url,
    mirrors: mirrors,
    sha256: normalizeText(entry.sha256).toLowerCase(),
    size: Number(entry.size || 0) || 0,
  };
}
export function selectAsrRuntimePackage(
  manifest = {},
  { platform: platform = process.platform, arch: arch = process.arch } = {},
) {
  const normalizedPlatform = normalizePlatform(platform),
    normalizedArch = normalizeArch(arch),
    packages = Array.isArray(manifest?.packages)
      ? manifest.packages.map(normalizeManifestPackage).filter(Boolean)
      : [normalizeManifestPackage(manifest)].filter(Boolean);
  return (
    packages.find(
      (pkg) =>
        pkg.platform === normalizedPlatform &&
        pkg.arch === normalizedArch &&
        (pkg.url || pkg.mirrors.length),
    ) || null
  );
}
function getPackageDownloadUrl(pkg = {}) {
  return normalizeUrl(pkg.url) || pkg.mirrors?.find(Boolean) || '';
}
async function hashFileSha256(filePath) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filePath)) {
    hash.update(chunk);
  }
  return hash.digest('hex');
}
async function downloadToFile({
  fetchImpl: fetchImpl = fetch,
  queue: queue,
  task: task,
  targetPath: targetPath,
  url: url,
} = {}) {
  const response = await fetchImpl(url);
  if (!response?.ok)
    throw new Error('ASR runtime download failed: HTTP ' + (response?.status || 'unknown'));
  const totalBytes = Number(response.headers?.get?.('content-length') || 0) || 0;
  let receivedBytes = 0;
  const body = response.body?.getReader ? Readable.fromWeb(response.body) : response.body;
  if (!body) throw new Error('ASR runtime download response is empty');
  (await mkdir(path.dirname(targetPath), { recursive: true }),
    await pipeline(
      body,
      async function* (source) {
        for await (const chunk of source) {
          receivedBytes += Buffer.byteLength(chunk);
          if (totalBytes > 0) {
            const ratio = Math.max(0, Math.min(1, receivedBytes / totalBytes));
            queue?.emitProgress?.(
              task,
              0.18 + ratio * 0.42,
              'Downloading subtitle component ' + Math.round(ratio * 100) + '%',
              { stage: ASR_RUNTIME_STAGE.DOWNLOAD },
            );
          }
          yield chunk;
        }
      },
      createWriteStream(targetPath),
    ));
}
async function readManifest({ fetchImpl: fetchImpl = fetch, manifestUrl: manifestUrl = '' } = {}) {
  const normalizedUrl = normalizeUrl(manifestUrl);
  if (!normalizedUrl) throw new Error('ASR runtime manifest URL is not configured');
  const response = await fetchImpl(normalizedUrl);
  if (!response?.ok)
    throw new Error(
      'ASR runtime manifest request failed: HTTP ' + (response?.status || 'unknown'),
    );
  return await response.json();
}
function resolvePythonInExtractedRuntime(root, platform = process.platform) {
  return resolvePreferredRuntimePythonCommand({
    existsSync: existsSync,
    fallbackCommand: '',
    platform: platform,
    runtimeRoot: root,
  });
}
async function resolveExtractedRuntimeRoot(extractDir, platform = process.platform) {
  if (resolvePythonInExtractedRuntime(extractDir, platform)) return extractDir;
  const entries = await readdir(extractDir, { withFileTypes: true }),
    subdirs = entries.filter((entry) => entry.isDirectory()).map((dir) =>
      path.join(extractDir, dir.name),
    );
  if (subdirs.length === 1 && resolvePythonInExtractedRuntime(subdirs[0], platform))
    return subdirs[0];
  throw new Error('ASR runtime archive must contain a python runtime directory');
}
async function writeCurrentRuntimeState({
  arch: arch,
  manifestUrl: manifestUrl,
  platform: platform,
  runtimeRoot: runtimeRoot,
  sha256: sha256,
  statePath: statePath,
  version: version,
}) {
  (await mkdir(path.dirname(statePath), { recursive: true }),
    await writeFile(
      statePath,
      JSON.stringify(
        {
          version: version,
          runtimeRoot: runtimeRoot,
          platform: platform,
          arch: arch,
          sha256: sha256,
          manifestUrl: manifestUrl,
          installedAt: Date.now(),
        },
        null,
        2,
      ) + '\n',
      'utf8',
    ));
}
async function runAsrRuntimeSmoke({
  appRoot: appRoot,
  pythonCommand: pythonCommand,
  queue: queue,
  task: task,
} = {}) {
  if (!pythonCommand) throw new Error('ASR Python runtime is unavailable');
  await queue.runProcess(
    task,
    pythonCommand,
    [
      '-c',
      [
        'import torch',
        'import torchaudio',
        'import funasr',
        'import modelscope',
        'from nemo.collections.asr.models import SortformerEncLabelModel',
        "print('asr runtime smoke ok')",
      ].join('; '),
    ],
    { cwd: appRoot, progressMessage: 'Verifying subtitle component' },
  );
}
export function createAsrRuntimeInstallMediaTaskHandler({
  appRoot: appRoot = process.cwd(),
  fetchImpl: fetchImpl = fetch,
  getAsrRuntimeManifestUrl: getAsrRuntimeManifestUrl = () => '',
  getUserDataRoot: getUserDataRoot = () => '',
  resolveFallbackPythonCommand: resolveFallbackPythonCommand = () => '',
  platform: platform = process.platform,
  arch: arch = process.arch,
} = {}) {
  return async (task, queue) => {
    const userDataRoot = normalizeText(getUserDataRoot?.());
    if (!userDataRoot) throw new Error('User data directory is unavailable');
    const forceRepair = task?.payload?.args?.forceRepair === true;
    queue.emitProgress(task, 0.03, 'Checking subtitle component', {
      stage: ASR_RUNTIME_STAGE.CHECK,
    });
    const installedPython = resolveAsrRuntimePythonCommand({
      userDataRoot: userDataRoot,
      existsSync: existsSync,
      readFileSync: readFileSync,
      fallbackCommand: '',
      platform: platform,
    });
    if (installedPython && !forceRepair)
      return { success: true, available: true, source: 'installed', pythonCommand: installedPython };
    const fallbackPython = normalizeText(resolveFallbackPythonCommand?.());
    if (!forceRepair && fallbackPython && existsSync(fallbackPython))
      try {
        return (
          await runAsrRuntimeSmoke({
            appRoot: appRoot,
            pythonCommand: fallbackPython,
            queue: queue,
            task: task,
          }),
          { success: true, available: true, source: 'bundled', pythonCommand: fallbackPython }
        );
      } catch {}
    queue.emitProgress(task, 0.1, 'Loading subtitle component manifest', {
      stage: ASR_RUNTIME_STAGE.MANIFEST,
    });
    const manifestUrl =
        normalizeUrl(task?.payload?.args?.manifestUrl) ||
        normalizeUrl(getAsrRuntimeManifestUrl?.()),
      manifest = await readManifest({ fetchImpl: fetchImpl, manifestUrl: manifestUrl }),
      pkg = selectAsrRuntimePackage(manifest, { platform: platform, arch: arch });
    if (!pkg) throw new Error('No ASR runtime package for ' + platform + '-' + arch);
    const downloadUrl = getPackageDownloadUrl(pkg),
      version = pkg.version || normalizeText(manifest?.version) || 'unknown',
      baseDir = resolveAsrRuntimeBaseDir(userDataRoot),
      installDir = resolveAsrRuntimeInstallDir({ userDataRoot: userDataRoot, version: version }),
      statePath = resolveAsrRuntimeStatePath(userDataRoot),
      tempDir = path.join(baseDir, '_tmp', task.id),
      archivePath = path.join(tempDir, 'asr-runtime.zip'),
      extractDir = path.join(tempDir, 'extract');
    (await rm(tempDir, { recursive: true, force: true }),
      await mkdir(extractDir, { recursive: true }),
      await downloadToFile({
        fetchImpl: fetchImpl,
        queue: queue,
        task: task,
        targetPath: archivePath,
        url: downloadUrl,
      }));
    if (pkg.sha256) {
      const actualSha256 = await hashFileSha256(archivePath);
      if (actualSha256.toLowerCase() !== pkg.sha256)
        throw new Error('ASR runtime checksum verification failed');
    }
    (queue.emitProgress(task, 0.68, 'Extracting subtitle component', {
      stage: ASR_RUNTIME_STAGE.EXTRACT,
    }),
      await extract_zip(archivePath, { dir: extractDir }));
    const extractedRoot = await resolveExtractedRuntimeRoot(extractDir, platform);
    (await rm(statePath, { force: true }),
      await rm(installDir, { recursive: true, force: true }),
      await mkdir(path.dirname(installDir), { recursive: true }),
      await rename(extractedRoot, installDir));
    const runtimePython = resolvePreferredRuntimePythonCommand({
      existsSync: existsSync,
      fallbackCommand: '',
      platform: platform,
      runtimeRoot: installDir,
    });
    return (
      queue.emitProgress(task, 0.84, 'Verifying subtitle component', {
        stage: ASR_RUNTIME_STAGE.VERIFY,
      }),
      await runAsrRuntimeSmoke({
        appRoot: appRoot,
        pythonCommand: runtimePython,
        queue: queue,
        task: task,
      }),
      await writeCurrentRuntimeState({
        arch: arch,
        manifestUrl: manifestUrl,
        platform: platform,
        runtimeRoot: installDir,
        sha256: pkg.sha256,
        statePath: statePath,
        version: version,
      }),
      await rm(tempDir, { recursive: true, force: true }),
      { success: true, available: true, source: 'downloaded', version: version, runtimeRoot: installDir }
    );
  };
}
