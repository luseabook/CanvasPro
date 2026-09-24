import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  createAgentSkillCapabilityOperations,
  agentSkillCapabilityInternals,
} from './agentSkillCapabilityOperations.js';

const { isInsideRoot, pathExists } = agentSkillCapabilityInternals;

const SKILL_MD = ['---', 'name: demo-skill', 'description: A demo skill', '---', 'Do it.'].join('\n');

async function withRoot(run) {
  const root = mkdtempSync(path.join(tmpdir(), 'aic-skill-'));
  try {
    await run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function createOperations(root, overrides = {}) {
  return createAgentSkillCapabilityOperations({
    getUserDataRoot: () => root,
    showOpenDialog: async () => ({ canceled: true }),
    openFolder: async () => {},
    ...overrides,
  });
}

function writePackage(root, id, markdown = SKILL_MD, references = {}) {
  const packageDir = path.join(root, 'skills', id);
  mkdirSync(packageDir, { recursive: true });
  writeFileSync(path.join(packageDir, 'SKILL.md'), markdown, 'utf8');
  for (const [name, content] of Object.entries(references)) {
    const referencesDir = path.join(packageDir, 'references');
    mkdirSync(referencesDir, { recursive: true });
    writeFileSync(path.join(referencesDir, name), content, 'utf8');
  }
  return packageDir;
}

test('list creates the skills root and returns an empty inventory', async () => {
  await withRoot(async (root) => {
    const result = await createOperations(root).list();
    assert.equal(result.rootPath, path.join(root, 'skills'));
    assert.equal(existsSync(result.rootPath), true);
    assert.deepEqual(result.packages, []);
    assert.deepEqual(result.diagnostics, []);
  });
});

test('list fails loudly when the user data directory is unavailable', async () => {
  const operations = createAgentSkillCapabilityOperations({ getUserDataRoot: () => '  ' });
  await assert.rejects(() => operations.list(), /User data directory is unavailable/);
});

test('list reads packages with references and reports scripts presence', async () => {
  await withRoot(async (root) => {
    const packageDir = writePackage(root, 'demo-skill', SKILL_MD, {
      'guide.md': 'Guide',
      'notes.txt': 'Notes',
      'ignored.pdf': 'Nope',
    });
    mkdirSync(path.join(packageDir, 'scripts'), { recursive: true });
    const result = await createOperations(root).list();
    assert.equal(result.packages.length, 1);
    const [entry] = result.packages;
    assert.equal(entry.packageId, 'demo-skill');
    assert.equal(entry.markdown, SKILL_MD);
    assert.equal(entry.hasScripts, true);
    assert.deepEqual(entry.resourceNames, ['references/guide.md', 'references/notes.txt']);
    assert.deepEqual(entry.resources, [
      { name: 'references/guide.md', content: 'Guide' },
      { name: 'references/notes.txt', content: 'Notes' },
    ]);
    assert.deepEqual(result.diagnostics, []);
  });
});

test('list reports unreadable or oversized SKILL.md as diagnostics', async () => {
  await withRoot(async (root) => {
    mkdirSync(path.join(root, 'skills', 'missing'), { recursive: true });
    writePackage(root, 'too-big', 'x'.repeat(128 * 1024 + 1));
    const result = await createOperations(root).list();
    assert.deepEqual(result.packages, []);
    const byPackage = Object.fromEntries(result.diagnostics.map((entry) => [entry.packageId, entry]));
    assert.equal(byPackage.missing.errorCode, 'SKILL_MD_NOT_FOUND');
    assert.equal(byPackage['too-big'].errorCode, 'SKILL_MD_TOO_LARGE');
  });
});

test('list drops oversized references and counts them as skipped', async () => {
  await withRoot(async (root) => {
    writePackage(root, 'demo-skill', SKILL_MD, {
      'small.md': 'ok',
      'huge.md': 'z'.repeat(16 * 1024 + 1),
    });
    const result = await createOperations(root).list();
    const [entry] = result.packages;
    assert.deepEqual(entry.resourceNames, ['references/huge.md', 'references/small.md']);
    assert.deepEqual(entry.resources, [{ name: 'references/small.md', content: 'ok' }]);
  });
});

test('openRoot requires an openFolder implementation', async () => {
  await withRoot(async (root) => {
    const unavailable = createOperations(root, { openFolder: undefined });
    assert.equal((await unavailable.openRoot()).errorCode, 'SKILL_FOLDER_OPEN_UNAVAILABLE');

    const opened = [];
    const operations = createOperations(root, { openFolder: async (folder) => opened.push(folder) });
    const result = await operations.openRoot();
    assert.deepEqual(result, { success: true, canceled: false, rootPath: path.join(root, 'skills') });
    assert.deepEqual(opened, [path.join(root, 'skills')]);
  });
});

test('installFromFolder mirrors a source folder into the skills root', async () => {
  await withRoot(async (root) => {
    const source = path.join(root, 'incoming');
    mkdirSync(path.join(source, 'references'), { recursive: true });
    mkdirSync(path.join(source, 'scripts'), { recursive: true });
    writeFileSync(path.join(source, 'SKILL.md'), SKILL_MD, 'utf8');
    writeFileSync(path.join(source, 'references', 'guide.md'), 'Guide', 'utf8');

    const operations = createOperations(root, {
      showOpenDialog: async () => ({ canceled: false, filePaths: [source] }),
    });
    const result = await operations.installFromFolder();
    assert.deepEqual(result, {
      success: true,
      canceled: false,
      skillId: 'demo-skill',
      rootPath: path.join(root, 'skills', 'demo-skill'),
      importedResources: 1,
      skippedResources: 0,
      scriptsSkipped: true,
    });
    assert.equal(
      readFileSync(path.join(root, 'skills', 'demo-skill', 'references', 'guide.md'), 'utf8'),
      'Guide',
    );
    assert.equal(existsSync(path.join(root, 'skill-install-staging')), true);
    assert.deepEqual(
      await import('node:fs/promises').then((fs) =>
        fs.readdir(path.join(root, 'skill-install-staging')),
      ),
      [],
    );
  });
});

test('installFromFolder reports cancellation and rejects the wrong source', async () => {
  await withRoot(async (root) => {
    const canceled = createOperations(root, {
      showOpenDialog: async () => ({ canceled: true }),
    });
    assert.deepEqual(await canceled.installFromFolder(), { success: false, canceled: true });

    const noDialog = createOperations(root, { showOpenDialog: undefined });
    assert.equal((await noDialog.installFromFolder()).errorCode, 'SKILL_IMPORT_UNAVAILABLE');

    const emptySource = path.join(root, 'empty');
    mkdirSync(emptySource, { recursive: true });
    const missingSkillMd = createOperations(root, {
      showOpenDialog: async () => ({ canceled: false, filePaths: [emptySource] }),
    });
    assert.equal((await missingSkillMd.installFromFolder()).errorCode, 'SKILL_MD_NOT_FOUND');

    writePackage(root, 'demo-skill');
    const duplicate = createOperations(root, {
      showOpenDialog: async () => ({ canceled: false, filePaths: [sourceWithSkill(root)] }),
    });
    assert.equal((await duplicate.installFromFolder()).errorCode, 'SKILL_ALREADY_INSTALLED');
  });
});

function sourceWithSkill(root) {
  const source = path.join(root, 'incoming');
  mkdirSync(source, { recursive: true });
  writeFileSync(path.join(source, 'SKILL.md'), SKILL_MD, 'utf8');
  return source;
}

test('saveManagedDefinition creates, refuses duplicates, and validates input', async () => {
  await withRoot(async (root) => {
    const operations = createOperations(root);
    const created = await operations.saveManagedDefinition({
      mode: 'create',
      id: 'demo-skill',
      title: 'Demo',
      description: 'A demo skill',
      instructions: 'Do it.',
    });
    assert.deepEqual(created, { success: true, canceled: false, skillId: 'demo-skill', mode: 'create' });
    assert.equal(
      readFileSync(path.join(root, 'skills', 'demo-skill', 'SKILL.md'), 'utf8').startsWith('---\nname: demo-skill'),
      true,
    );

    const duplicate = await operations.saveManagedDefinition({
      mode: 'create',
      id: 'demo-skill',
      description: 'A demo skill',
      instructions: 'Do it.',
    });
    assert.equal(duplicate.errorCode, 'SKILL_ALREADY_INSTALLED');

    const invalid = await operations.saveManagedDefinition({ id: 'Bad Id', description: 'd', instructions: 'i' });
    assert.equal(invalid.errorCode, 'INVALID_SKILL_ID');
  });
});

test('saveManagedDefinition only updates skills this app manages', async () => {
  await withRoot(async (root) => {
    const operations = createOperations(root);
    writePackage(root, 'foreign-skill', SKILL_MD);
    const refused = await operations.saveManagedDefinition({
      mode: 'update',
      id: 'foreign-skill',
      description: 'A demo skill',
      instructions: 'Do it.',
    });
    assert.equal(refused.errorCode, 'SKILL_NOT_EDITABLE');

    const missing = await operations.saveManagedDefinition({
      mode: 'update',
      id: 'absent-skill',
      description: 'A demo skill',
      instructions: 'Do it.',
    });
    assert.equal(missing.errorCode, 'SKILL_NOT_FOUND');

    await operations.saveManagedDefinition({
      mode: 'create',
      id: 'demo-skill',
      description: 'A demo skill',
      instructions: 'First',
    });
    const updated = await operations.saveManagedDefinition({
      mode: 'update',
      id: 'demo-skill',
      description: 'A demo skill',
      instructions: 'Second',
    });
    assert.deepEqual(updated, { success: true, canceled: false, skillId: 'demo-skill', mode: 'update' });
    const written = readFileSync(path.join(root, 'skills', 'demo-skill', 'SKILL.md'), 'utf8');
    assert.match(written, /Second/);
    assert.doesNotMatch(written, /First/);
  });
});

test('deleteInstalled requires an explicit confirmation and a valid id', async () => {
  await withRoot(async (root) => {
    const operations = createOperations(root);
    assert.equal((await operations.deleteInstalled({ id: 'Bad Id' })).errorCode, 'INVALID_SKILL_ID');
    assert.equal(
      (await operations.deleteInstalled({ id: 'demo-skill' })).errorCode,
      'SKILL_DELETE_CONFIRMATION_REQUIRED',
    );
    assert.equal(
      (await operations.deleteInstalled({ id: 'absent-skill', confirmed: true })).errorCode,
      'SKILL_NOT_FOUND',
    );

    writePackage(root, 'demo-skill');
    const deleted = await operations.deleteInstalled({ id: 'demo-skill', confirmed: true });
    assert.deepEqual(deleted, { success: true, canceled: false, skillId: 'demo-skill' });
    assert.equal(existsSync(path.join(root, 'skills', 'demo-skill')), false);
  });
});

test('path guards keep operations inside their roots', async () => {
  const root = path.resolve('/tmp/root');
  assert.equal(isInsideRoot(root, path.join(root, 'a')), true);
  assert.equal(isInsideRoot(root, path.resolve('/tmp/other')), false);
  assert.equal(await pathExists(path.join(root, 'nope')), false);
  await withRoot(async (dir) => {
    assert.equal(await pathExists(dir), true);
  });
});
