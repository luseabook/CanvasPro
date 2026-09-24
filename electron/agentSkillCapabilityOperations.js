import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import {
  MANAGED_AGENT_SKILL_OWNER,
  parseAgentSkillMarkdown,
  serializeManagedAgentSkillDefinition,
} from '../src/modules/agent/agentSkillPackage.js';

const MAX_SKILL_PACKAGES = 100;
const MAX_SKILL_MD_BYTES = 128 * 1024;
const MAX_RESOURCE_NAMES = 24;
const MAX_RESOURCE_BYTES = 16 * 1024;
const MAX_RESOURCE_TOTAL_BYTES = 48 * 1024;
const MAX_ERROR_MESSAGE_CHARS = 300;
const SKILL_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;
const RESOURCE_NAME_PATTERN = /\.(?:md|txt|json)$/i;

function isInsideRoot(root, target) {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function isPlainDirectory(target) {
  try {
    const stats = await lstat(target);
    return stats.isDirectory() && !stats.isSymbolicLink();
  } catch {
    return false;
  }
}

async function pathExists(target) {
  try {
    await lstat(target);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

function operationFailure(errorCode, message) {
  return {
    success: false,
    canceled: false,
    errorCode,
    message: String(message || errorCode).slice(0, MAX_ERROR_MESSAGE_CHARS),
  };
}

async function readResourceSnapshot(packageDir) {
  const referencesDir = path.join(packageDir, 'references');
  if (!(await isPlainDirectory(referencesDir))) return { resourceNames: [], resources: [] };
  const entries = await readdir(referencesDir, { withFileTypes: true });
  const resourceNames = entries
    .filter((entry) => entry.isFile() && !entry.isSymbolicLink())
    .map((entry) => entry.name)
    .filter((name) => RESOURCE_NAME_PATTERN.test(name))
    .sort((left, right) => left.localeCompare(right))
    .slice(0, MAX_RESOURCE_NAMES);
  const resources = [];
  let totalBytes = 0;
  for (const name of resourceNames) {
    const filePath = path.join(referencesDir, name);
    try {
      const stats = await lstat(filePath);
      if (!stats.isFile() || stats.isSymbolicLink()) continue;
      if (stats.size > MAX_RESOURCE_BYTES || totalBytes + stats.size > MAX_RESOURCE_TOTAL_BYTES) continue;
      const content = await readFile(filePath, 'utf8');
      totalBytes += stats.size;
      resources.push({ name: 'references/' + name, content });
    } catch {}
  }
  return { resourceNames: resourceNames.map((name) => 'references/' + name), resources };
}

export function createAgentSkillCapabilityOperations({
  getUserDataRoot,
  showOpenDialog,
  openFolder,
} = {}) {
  function resolveRoots() {
    const configuredRoot = String(getUserDataRoot?.() || '').trim();
    if (!configuredRoot) throw new Error('User data directory is unavailable.');
    const userDataRoot = path.resolve(configuredRoot);
    return { userDataRoot, skillsRoot: path.join(userDataRoot, 'skills') };
  }

  return {
    async list() {
      const { skillsRoot } = resolveRoots();
      await mkdir(skillsRoot, { recursive: true });
      const packageDirs = (await readdir(skillsRoot, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
        .sort((left, right) => left.name.localeCompare(right.name))
        .slice(0, MAX_SKILL_PACKAGES);
      const packages = [];
      const diagnostics = [];
      for (const entry of packageDirs) {
        const packageDir = path.resolve(skillsRoot, entry.name);
        if (!isInsideRoot(skillsRoot, packageDir) || !(await isPlainDirectory(packageDir))) continue;
        const skillMdPath = path.join(packageDir, 'SKILL.md');
        try {
          const stats = await lstat(skillMdPath);
          if (!stats.isFile() || stats.isSymbolicLink()) throw new Error('SKILL.md is not a plain file');
          if (stats.size > MAX_SKILL_MD_BYTES) {
            diagnostics.push({
              packageId: entry.name,
              errorCode: 'SKILL_MD_TOO_LARGE',
              message: 'SKILL.md exceeds the supported size limit.',
            });
            continue;
          }
          const markdown = await readFile(skillMdPath, 'utf8');
          const snapshot = await readResourceSnapshot(packageDir);
          packages.push({
            packageId: entry.name,
            markdown,
            ...snapshot,
            hasScripts: await isPlainDirectory(path.join(packageDir, 'scripts')),
          });
        } catch (error) {
          diagnostics.push({
            packageId: entry.name,
            errorCode: error?.code === 'ENOENT' ? 'SKILL_MD_NOT_FOUND' : 'SKILL_MD_READ_FAILED',
            message: String(error?.message || error || 'Unable to read SKILL.md').slice(
              0,
              MAX_ERROR_MESSAGE_CHARS,
            ),
          });
        }
      }
      return { rootPath: skillsRoot, packages, diagnostics };
    },

    async openRoot() {
      if (typeof openFolder !== 'function') {
        return operationFailure('SKILL_FOLDER_OPEN_UNAVAILABLE', 'Skill folder opening is unavailable.');
      }
      const { skillsRoot } = resolveRoots();
      await mkdir(skillsRoot, { recursive: true });
      await openFolder(skillsRoot);
      return { success: true, canceled: false, rootPath: skillsRoot };
    },

    async installFromFolder() {
      if (typeof showOpenDialog !== 'function') {
        return operationFailure('SKILL_IMPORT_UNAVAILABLE', 'Skill folder import is unavailable.');
      }
      const { userDataRoot, skillsRoot } = resolveRoots();
      await mkdir(skillsRoot, { recursive: true });
      const picked = await showOpenDialog({
        title: '导入 Agent Skill 文件夹',
        defaultPath: userDataRoot,
        properties: ['openDirectory'],
      });
      if (picked?.canceled || !picked?.filePaths?.[0]) return { success: false, canceled: true };
      const sourceDir = path.resolve(String(picked.filePaths[0] || ''));
      if (!(await isPlainDirectory(sourceDir))) {
        return operationFailure(
          'SKILL_SOURCE_INVALID',
          'Selected Skill source is not a plain folder.',
        );
      }
      const sourceSkillMdPath = path.join(sourceDir, 'SKILL.md');
      let markdown = '';
      try {
        const stats = await lstat(sourceSkillMdPath);
        if (!stats.isFile() || stats.isSymbolicLink()) {
          return operationFailure('SKILL_MD_READ_FAILED', 'SKILL.md is not a plain file.');
        }
        if (stats.size > MAX_SKILL_MD_BYTES) {
          return operationFailure(
            'SKILL_MD_TOO_LARGE',
            'SKILL.md exceeds the supported size limit.',
          );
        }
        markdown = await readFile(sourceSkillMdPath, 'utf8');
      } catch (error) {
        return operationFailure(
          error?.code === 'ENOENT' ? 'SKILL_MD_NOT_FOUND' : 'SKILL_MD_READ_FAILED',
          error?.message || 'Unable to read SKILL.md.',
        );
      }
      const parsed = parseAgentSkillMarkdown(markdown, {
        packageId: path.basename(sourceDir),
        source: 'installed',
      });
      if (!parsed.ok) return operationFailure(parsed.errorCode, parsed.message);
      const skillId = parsed.skill.id;
      const destination = path.resolve(skillsRoot, skillId);
      if (!isInsideRoot(skillsRoot, destination) || path.dirname(destination) !== skillsRoot) {
        return operationFailure('SKILL_DESTINATION_INVALID', 'Skill destination is invalid.');
      }
      if (await pathExists(destination)) {
        return operationFailure('SKILL_ALREADY_INSTALLED', 'Skill ' + skillId + ' is already installed.');
      }
      const stagingRoot = path.join(userDataRoot, 'skill-install-staging');
      const stagingDir = path.join(stagingRoot, skillId + '-' + randomUUID());
      const snapshot = await readResourceSnapshot(sourceDir);
      const scriptsSkipped = await isPlainDirectory(path.join(sourceDir, 'scripts'));
      try {
        await mkdir(stagingDir, { recursive: true });
        await writeFile(path.join(stagingDir, 'SKILL.md'), markdown, 'utf8');
        if (snapshot.resources.length > 0) {
          const stagingReferences = path.join(stagingDir, 'references');
          await mkdir(stagingReferences, { recursive: true });
          for (const resource of snapshot.resources) {
            await writeFile(
              path.join(stagingReferences, path.basename(resource.name)),
              resource.content,
              'utf8',
            );
          }
        }
        await rename(stagingDir, destination);
      } catch (error) {
        if (error?.code === 'EEXIST') {
          return operationFailure(
            'SKILL_ALREADY_INSTALLED',
            'Skill ' + skillId + ' is already installed.',
          );
        }
        return operationFailure(
          'SKILL_INSTALL_FAILED',
          error?.message || 'Skill installation failed.',
        );
      } finally {
        if (isInsideRoot(stagingRoot, stagingDir)) {
          await rm(stagingDir, { recursive: true, force: true }).catch(() => {});
        }
      }
      return {
        success: true,
        canceled: false,
        skillId,
        rootPath: destination,
        importedResources: snapshot.resources.length,
        skippedResources: Math.max(0, snapshot.resourceNames.length - snapshot.resources.length),
        scriptsSkipped,
      };
    },

    async saveManagedDefinition(payload = {}) {
      const mode = payload?.mode === 'update' ? 'update' : 'create';
      const serialized = serializeManagedAgentSkillDefinition(payload);
      if (!serialized.ok) return operationFailure(serialized.errorCode, serialized.message);
      const { userDataRoot, skillsRoot } = resolveRoots();
      await mkdir(skillsRoot, { recursive: true });
      const skillId = serialized.definition.id;
      const destination = path.resolve(skillsRoot, skillId);
      if (!isInsideRoot(skillsRoot, destination) || path.dirname(destination) !== skillsRoot) {
        return operationFailure('SKILL_DESTINATION_INVALID', 'Skill destination is invalid.');
      }
      if (mode === 'create') {
        if (await pathExists(destination)) {
          return operationFailure(
            'SKILL_ALREADY_INSTALLED',
            'Skill ' + skillId + ' is already installed.',
          );
        }
        const stagingRoot = path.join(userDataRoot, 'skill-install-staging');
        const stagingDir = path.join(stagingRoot, skillId + '-' + randomUUID());
        try {
          await mkdir(stagingDir, { recursive: true });
          await writeFile(path.join(stagingDir, 'SKILL.md'), serialized.markdown, 'utf8');
          await rename(stagingDir, destination);
        } catch (error) {
          if (error?.code === 'EEXIST') {
            return operationFailure(
              'SKILL_ALREADY_INSTALLED',
              'Skill ' + skillId + ' is already installed.',
            );
          }
          return operationFailure('SKILL_SAVE_FAILED', error?.message || 'Skill save failed.');
        } finally {
          if (isInsideRoot(stagingRoot, stagingDir)) {
            await rm(stagingDir, { recursive: true, force: true }).catch(() => {});
          }
        }
        return { success: true, canceled: false, skillId, mode };
      }
      if (!(await isPlainDirectory(destination))) {
        return operationFailure('SKILL_NOT_FOUND', 'Skill ' + skillId + ' was not found.');
      }
      const skillMdPath = path.join(destination, 'SKILL.md');
      try {
        const stats = await lstat(skillMdPath);
        if (
          !stats.isFile() ||
          stats.isSymbolicLink() ||
          stats.size > MAX_SKILL_MD_BYTES
        ) {
          return operationFailure('SKILL_NOT_EDITABLE', 'Skill is not editable in the app.');
        }
        const existing = await readFile(skillMdPath, 'utf8');
        const parsed = parseAgentSkillMarkdown(existing, { packageId: skillId, source: 'installed' });
        if (
          !parsed.ok ||
          parsed.skill.id !== skillId ||
          parsed.skill.managedBy !== MANAGED_AGENT_SKILL_OWNER
        ) {
          return operationFailure('SKILL_NOT_EDITABLE', 'Skill is not editable in the app.');
        }
      } catch (error) {
        return operationFailure(
          error?.code === 'ENOENT' ? 'SKILL_NOT_FOUND' : 'SKILL_SAVE_FAILED',
          error?.message || 'Skill save failed.',
        );
      }
      const tempPath = path.join(destination, '.SKILL.md.' + randomUUID() + '.tmp');
      try {
        await writeFile(tempPath, serialized.markdown, 'utf8');
        await rename(tempPath, skillMdPath);
      } catch (error) {
        return operationFailure('SKILL_SAVE_FAILED', error?.message || 'Skill save failed.');
      } finally {
        await rm(tempPath, { force: true }).catch(() => {});
      }
      return { success: true, canceled: false, skillId, mode };
    },

    async deleteInstalled(payload = {}) {
      const skillId = String(payload?.id || '')
        .trim()
        .toLowerCase();
      if (!SKILL_ID_PATTERN.test(skillId)) {
        return operationFailure('INVALID_SKILL_ID', 'Skill id is invalid.');
      }
      if (payload?.confirmed !== true) {
        return operationFailure(
          'SKILL_DELETE_CONFIRMATION_REQUIRED',
          'Deleting a Skill requires explicit confirmation.',
        );
      }
      const { skillsRoot } = resolveRoots();
      await mkdir(skillsRoot, { recursive: true });
      const destination = path.resolve(skillsRoot, skillId);
      if (!isInsideRoot(skillsRoot, destination) || path.dirname(destination) !== skillsRoot) {
        return operationFailure('SKILL_DESTINATION_INVALID', 'Skill destination is invalid.');
      }
      if (!(await isPlainDirectory(destination))) {
        return operationFailure('SKILL_NOT_FOUND', 'Skill ' + skillId + ' was not found.');
      }
      const skillMdPath = path.join(destination, 'SKILL.md');
      try {
        const stats = await lstat(skillMdPath);
        if (!stats.isFile() || stats.isSymbolicLink()) {
          return operationFailure('SKILL_DELETE_FAILED', 'Skill package is not a plain package.');
        }
        const parsed = parseAgentSkillMarkdown(await readFile(skillMdPath, 'utf8'), {
          packageId: skillId,
          source: 'installed',
        });
        if (!parsed.ok || parsed.skill.id !== skillId) {
          return operationFailure('SKILL_DELETE_FAILED', 'Skill package identity is invalid.');
        }
        await rm(destination, { recursive: true, force: false });
      } catch (error) {
        return operationFailure(
          error?.code === 'ENOENT' ? 'SKILL_NOT_FOUND' : 'SKILL_DELETE_FAILED',
          error?.message || 'Skill deletion failed.',
        );
      }
      return { success: true, canceled: false, skillId };
    },
  };
}

export const agentSkillCapabilityInternals = Object.freeze({ isInsideRoot, pathExists });
