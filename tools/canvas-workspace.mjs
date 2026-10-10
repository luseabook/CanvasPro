#!/usr/bin/env node
// canvas-workspace.mjs —— 只读的「单仓视图」总览工具。
//
// 背景：CanvasPro（客户端）与 canvas-admin（后台）是两个**独立 git 仓库**，物理上
// 不合并。本工具把「两边现在长什么样」用一条命令摊开，并做**契约版本漂移检测**，
// 让维护者能像看单仓一样一眼看清两个仓库的分支/改动/最近提交与契约一致性。
//
// 用法：
//   node tools/canvas-workspace.mjs status
//
// 环境变量覆盖（默认值见下方常量）：
//   CANVASPRO_ROOT     客户端仓库根目录（默认 F:\CanvasPro）
//   CANVAS_ADMIN_ROOT  后台仓库根目录（默认 F:\canvas-admin）
//
// 退出码：
//   0  两侧契约版本一致
//   1  契约版本漂移
//   2  无法运行（仓库缺失 / 不是 git 工作树 / 契约版本读不到）
//
// 本工具**只读**：不写入、不修改任何文件，只执行 `git` 只读命令。
// 采用**异步** spawn：同步 spawnSync 在部分受限宿主环境中会被拒绝（EBUSY），
// 异步 spawn 则可用，使工具在更多环境下可运行。
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const DEFAULT_CANVASPRO_ROOT = 'F:\\CanvasPro';
const DEFAULT_ADMIN_ROOT = 'F:\\canvas-admin';

// 契约版本所在文件（相对各仓库根目录）。
const ADMIN_CONTRACT_FILE = path.join('backend', 'app', 'services', 'client_config_service.py');
const CLIENT_CONTRACT_FILE = path.join('backend', 'services', 'subscription_client.py');

/** 解析两个仓库的根路径，允许环境变量覆盖。 */
export function resolveRoots() {
  const canvaspro = process.env.CANVASPRO_ROOT || DEFAULT_CANVASPRO_ROOT;
  const admin = process.env.CANVAS_ADMIN_ROOT || DEFAULT_ADMIN_ROOT;
  return { canvaspro, admin };
}

/** 执行一条只读 git 命令（异步）；失败时不抛异常，返回结构化结果。 */
export function runGit(root, args) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn('git', args, { cwd: root, windowsHide: true });
    } catch (err) {
      resolve({ ok: false, error: String((err && err.message) || err) });
      return;
    }
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += String(chunk); });
    child.stderr.on('data', (chunk) => { stderr += String(chunk); });
    child.on('error', (err) => {
      resolve({ ok: false, error: String((err && err.message) || err) });
    });
    child.on('close', (code) => {
      resolve({ ok: code === 0, status: code, stdout, stderr });
    });
  });
}

/** 读取一段文本文件；读不到返回 null（不抛栈）。 */
function readTextFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

/** 从 .git/HEAD 读取当前分支（git 不可用时的只读退化路径）。 */
function readBranchFromGitDir(root) {
  const head = readTextFile(path.join(root, '.git', 'HEAD'));
  if (!head) return '';
  const matched = head.trim().match(/^ref:\s+refs\/heads\/(.+)$/);
  return matched ? matched[1] : '(detached HEAD)';
}

/**
 * 去掉纯注释行（行首 `#` 或 `//`），其余行保持原样。
 *
 * 目的：契约版本抽取只认**代码行**。否则注释里出现的旧值（例如
 * 「# 旧值 CONTRACT_VERSION = "2025.12" 已废弃」）会把工具带偏、误报漂移。
 */
function stripCommentLines(source) {
  if (!source) return '';
  return source
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trimStart();
      return !trimmed.startsWith('#') && !trimmed.startsWith('//');
    })
    .join('\n');
}

/** 从后台 client_config_service.py 抽取 CONTRACT_VERSION 字面量（仅认非注释、行首锚定）。 */
export function extractAdminContractVersion(source) {
  if (!source) return null;
  const matched = stripCommentLines(source).match(/^\s*CONTRACT_VERSION\s*=\s*["']([^"']+)["']/m);
  return matched ? matched[1] : null;
}

/** 从客户端 subscription_client.py 抽取 SUPPORTED_CONTRACT_VERSIONS 字符串集合（仅认非注释、行首锚定）。 */
export function extractClientSupportedVersions(source) {
  if (!source) return [];
  const matched = stripCommentLines(source).match(/^\s*SUPPORTED_CONTRACT_VERSIONS\s*=\s*\(([\s\S]*?)\)/m);
  if (!matched) return [];
  const versions = [];
  const literal = /["']([^"']+)["']/g;
  let hit = literal.exec(matched[1]);
  while (hit) {
    versions.push(hit[1]);
    hit = literal.exec(matched[1]);
  }
  return versions;
}

/** 采集单个仓库的只读状态。 */
export async function inspectRepo(root) {
  const info = {
    root,
    exists: fs.existsSync(root),
    isRepo: false,
    gitAvailable: false,
    branch: '',
    changedCount: null,
    lastCommit: '',
    error: '',
  };
  if (!info.exists) {
    info.error = '目录不存在';
    return info;
  }

  const inside = await runGit(root, ['rev-parse', '--is-inside-work-tree']);
  if (inside.ok && inside.stdout.trim() === 'true') {
    info.isRepo = true;
    info.gitAvailable = true;

    const branch = await runGit(root, ['rev-parse', '--abbrev-ref', 'HEAD']);
    if (branch.ok) info.branch = branch.stdout.trim();

    const status = await runGit(root, ['status', '--porcelain']);
    if (status.ok) {
      info.changedCount = status.stdout.split('\n').filter((line) => line.trim() !== '').length;
    }

    const log = await runGit(root, ['log', '-1', '--pretty=format:%h %s']);
    if (log.ok) info.lastCommit = log.stdout.trim();
    return info;
  }

  // git 不可用或该目录不是工作树：若确有 .git，则退化为只读文件系统判断（至少给出分支）。
  if (fs.existsSync(path.join(root, '.git'))) {
    info.isRepo = true;
    info.gitAvailable = false;
    info.error = inside.error || String(inside.stderr || '').trim();
    info.branch = readBranchFromGitDir(root);
    return info;
  }

  info.error = inside.error ? `无法执行 git：${inside.error}` : '不是 git 工作树（未找到 .git）';
  return info;
}

/** 读取并抽取两个仓库的契约版本。 */
export function collectContractVersions(roots) {
  const adminSource = readTextFile(path.join(roots.admin, ADMIN_CONTRACT_FILE));
  const clientSource = readTextFile(path.join(roots.canvaspro, CLIENT_CONTRACT_FILE));
  return {
    adminVersion: extractAdminContractVersion(adminSource),
    clientVersions: extractClientSupportedVersions(clientSource),
    adminFileFound: adminSource !== null,
    clientFileFound: clientSource !== null,
  };
}

function printRepo(title, repo) {
  console.log(`  ${title}`);
  console.log(`    根路径    : ${repo.root}`);
  if (!repo.exists || !repo.isRepo) {
    console.log(`    状态      : ✗ ${repo.error}`);
    return;
  }
  console.log(`    分支      : ${repo.branch || '(未知)'}`);
  if (repo.gitAvailable) {
    console.log(`    改动条数  : ${repo.changedCount}（git status --porcelain）`);
    console.log(`    最近提交  : ${repo.lastCommit || '(无)'}`);
  } else {
    console.log(`    改动条数  : (git 不可用，未能读取)`);
    console.log(`    最近提交  : (git 不可用，未能读取)`);
    if (repo.error) console.log(`    git 错误  : ${repo.error}`);
  }
}

/** CLI 主入口：打印总览并以退出码表达结论。 */
export async function main(argv = process.argv.slice(2)) {
  const subcommand = (argv[0] || 'status').toLowerCase();
  if (subcommand !== 'status') {
    console.log('canvas-workspace —— 只读跨仓总览');
    console.log('用法: node tools/canvas-workspace.mjs status');
    return 2;
  }

  const roots = resolveRoots();
  const canvaspro = await inspectRepo(roots.canvaspro);
  const admin = await inspectRepo(roots.admin);

  console.log('canvas-workspace —— 单仓视图（只读）');
  console.log('  两个独立 git 仓库的当前状态：\n');
  printRepo('CanvasPro（客户端）', canvaspro);
  console.log('');
  printRepo('canvas-admin（后台）', admin);
  console.log('');

  if (!canvaspro.isRepo || !admin.isRepo) {
    console.log('✗ 无法完成契约漂移检测：至少一个仓库根路径无效或不是 git 工作树。');
    console.log('  请确认路径，或用环境变量覆盖后重试：');
    console.log(`    CANVASPRO_ROOT      （当前: ${roots.canvaspro}）`);
    console.log(`    CANVAS_ADMIN_ROOT   （当前: ${roots.admin}）`);
    return 2;
  }

  const contract = collectContractVersions(roots);
  console.log('  契约版本：');
  console.log(`    后台 CONTRACT_VERSION            : ${contract.adminVersion || '(未找到)'}`);
  console.log(
    `    客户端 SUPPORTED_CONTRACT_VERSIONS: ` +
    `${contract.clientVersions.length ? contract.clientVersions.join(', ') : '(未找到)'}`
  );

  if (!contract.adminFileFound || !contract.clientFileFound) {
    console.log('');
    console.log('✗ 无法完成契约漂移检测：契约版本所在文件读不到。');
    console.log(`    后台文件: ${path.join(roots.admin, ADMIN_CONTRACT_FILE)}`);
    console.log(`    客户端文件: ${path.join(roots.canvaspro, CLIENT_CONTRACT_FILE)}`);
    return 2;
  }
  if (!contract.adminVersion || contract.clientVersions.length === 0) {
    console.log('');
    console.log('✗ 无法完成契约漂移检测：契约版本常量无法解析（可能已改名或格式变化）。');
    return 2;
  }

  console.log('');
  if (contract.clientVersions.includes(contract.adminVersion)) {
    console.log(`✅ 契约版本一致：${contract.adminVersion}`);
    return 0;
  }
  console.log(
    `❌ 契约版本漂移：后台 ${contract.adminVersion} 不在客户端支持集合 ` +
    `[${contract.clientVersions.join(', ')}] 内`
  );
  console.log('   请先同步升级两侧契约版本（见 docs/operations-runbook.md「契约变更流程」）。');
  return 1;
}

const invokedDirectly =
  process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (invokedDirectly) {
  main().then((code) => { process.exitCode = code; });
}
