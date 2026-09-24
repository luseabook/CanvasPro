import { existsSync, renameSync } from 'node:fs';
import path from 'node:path';
const CHROME_SHELL_RENDERER_READY_TIMEOUT = 'CHROME_SHELL_RENDERER_READY_TIMEOUT',
  DEFAULT_MAX_RECOVERY_ATTEMPTS = 0x1,
  PROFILE_DIR_PATTERN = /^(chrome|chromium|edge)-shell-profile$/i,
  RENAME_RETRY_DELAYS_MS = [0xc8, 0x190, 0x320, 0x4b0, 0x578],
  RETRYABLE_RENAME_CODES = new Set(['EPERM', 'EACCES', 'EBUSY']);
function createProfileRecoveryError(message, code, cause = null) {
  const error = new Error(message, cause ? { cause: cause } : undefined);
  return ((error['code'] = code), error);
}
function formatRecoveryTimestamp(value) {
  const timestamp = value instanceof Date ? value : new Date(value);
  if (!Number['isFinite'](timestamp['getTime']()))
    throw createProfileRecoveryError(
      'Chrome shell profile recovery timestamp is invalid',
      'CHROME_SHELL_PROFILE_RECOVERY_TIMESTAMP_INVALID',
    );
  return timestamp['toISOString']()['replace'](/[-:]/g, '')['replace']('T', '-')['slice'](0x0, 0xf);
}
function resolveRecoveryPaths({ sessionDataRoot: sessionDataRoot, profileDir: profileDir } = {}) {
  const resolvedSessionRoot = path['resolve'](String(sessionDataRoot || '')),
    resolvedProfileDir = path['resolve'](String(profileDir || ''));
  if (
    !String(sessionDataRoot || '')['trim']() ||
    !String(profileDir || '')['trim']() ||
    path['dirname'](resolvedProfileDir) !== resolvedSessionRoot ||
    !PROFILE_DIR_PATTERN['test'](path['basename'](resolvedProfileDir))
  )
    throw createProfileRecoveryError(
      'Chrome\x20shell\x20profile\x20recovery\x20path\x20is\x20outside\x20sessionData',
      'CHROME_SHELL_PROFILE_RECOVERY_PATH_INVALID',
    );
  return { profileDir: resolvedProfileDir, sessionDataRoot: resolvedSessionRoot };
}
function resolveAvailableBackupDir({ profileDir: profileDir, exists: exists, now: now } = {}) {
  const timestamp = formatRecoveryTimestamp(now()),
    baseName = profileDir + '.recovery-' + timestamp;
  if (!exists(baseName)) return baseName;
  for (let suffix = 0x1; suffix <= 0x3e7; suffix += 0x1) {
    const candidate = baseName + '-' + suffix;
    if (!exists(candidate)) return candidate;
  }
  throw createProfileRecoveryError(
    'Chrome shell profile recovery backup name is unavailable',
    'CHROME_SHELL_PROFILE_RECOVERY_BACKUP_UNAVAILABLE',
  );
}
export function createChromeShellProfileRecovery({
  sessionDataRoot: sessionDataRoot,
  profileDir: profileDir,
  exists: exists = existsSync,
  rename: rename = renameSync,
  now: now = () => new Date(),
  delay: delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
} = {}) {
  const paths = resolveRecoveryPaths({ sessionDataRoot: sessionDataRoot, profileDir: profileDir });
  function rotate() {
    if (!exists(paths['profileDir']))
      throw createProfileRecoveryError(
        'Chrome shell profile recovery source is missing',
        'CHROME_SHELL_PROFILE_RECOVERY_SOURCE_MISSING',
      );
    const backupDir = resolveAvailableBackupDir({
      profileDir: paths['profileDir'],
      exists: exists,
      now: now,
    });
    try {
      rename(paths['profileDir'], backupDir);
    } catch (renameError) {
      throw createProfileRecoveryError(
        'Chrome shell profile could not be backed up for recovery',
        'CHROME_SHELL_PROFILE_RECOVERY_RENAME_FAILED',
        renameError,
      );
    }
    return { rotated: true, profileDir: paths['profileDir'], backupDir: backupDir };
  }
  async function rotateWhenReleased() {
    for (let attemptIndex = 0x0; ; attemptIndex += 0x1) {
      try {
        return { ...rotate(), renameAttempts: attemptIndex + 0x1 };
      } catch (attemptError) {
        attemptError['renameAttempts'] = attemptIndex + 0x1;
        if (
          attemptError['code'] !== 'CHROME_SHELL_PROFILE_RECOVERY_RENAME_FAILED' ||
          !RETRYABLE_RENAME_CODES['has'](attemptError['cause']?.['code']) ||
          attemptIndex >= RENAME_RETRY_DELAYS_MS['length']
        )
          throw attemptError;
        await delay(RENAME_RETRY_DELAYS_MS[attemptIndex]);
      }
    }
  }
  return { rotate: rotate, rotateWhenReleased: rotateWhenReleased };
}
function isRendererReadyTimeout(error) {
  return error?.['code'] === CHROME_SHELL_RENDERER_READY_TIMEOUT;
}
export async function runChromeShellStartupWithProfileRecovery({
  startAttempt: startAttempt,
  rotateProfile: rotateProfile,
  maxRecoveryAttempts: maxRecoveryAttempts = DEFAULT_MAX_RECOVERY_ATTEMPTS,
  logEvent: logEvent = null,
} = {}) {
  if (typeof startAttempt !== 'function')
    throw new TypeError('Chrome\x20shell\x20startup\x20attempt\x20factory\x20is\x20required');
  if (typeof rotateProfile !== 'function')
    throw new TypeError('Chrome\x20shell\x20profile\x20recovery\x20operation\x20is\x20required');
  const recoveryLimit = Math['max'](0x0, Math['min'](0x1, Math['trunc'](Number(maxRecoveryAttempts) || 0x0)));
  let recoveryCount = 0x0,
    backupDir = '';
  while (true) {
    try {
      const runtime = await startAttempt({
        attemptNumber: recoveryCount + 0x1,
        recoveryCount: recoveryCount,
      });
      return (
        recoveryCount > 0x0 &&
          logEvent?.({
            type: 'chrome_shell.profile_recovery_succeeded',
            level: 'info',
            source: 'main',
            message: 'Chrome\x20shell\x20started\x20with\x20a\x20recovered\x20browser\x20profile',
            context: { recoveryCount: recoveryCount, backupName: path['basename'](backupDir) },
          }),
        {
          runtime: runtime,
          profileRecovery: {
            recovered: recoveryCount > 0x0,
            recoveryCount: recoveryCount,
            backupDir: backupDir,
          },
        }
      );
    } catch (startupError) {
      if (!isRendererReadyTimeout(startupError) || recoveryCount >= recoveryLimit) {
        recoveryCount > 0x0 &&
          logEvent?.({
            type: 'chrome_shell.profile_recovery_failed',
            level: 'error',
            source: 'main',
            message: 'Chrome shell still failed after browser profile recovery',
            error: startupError,
            context: { recoveryCount: recoveryCount },
          });
        throw startupError;
      }
      logEvent?.({
        type: 'chrome_shell.profile_recovery_started',
        level: 'warn',
        source: 'main',
        message: 'Chrome shell renderer timed out; browser profile recovery started',
        error: startupError,
        context: { recoveryCount: recoveryCount },
      });
      let rotationResult;
      try {
        rotationResult = await rotateProfile({ error: startupError, recoveryCount: recoveryCount });
      } catch (rotationError) {
        ((startupError['profileRecoveryError'] = rotationError),
          logEvent?.({
            type: 'chrome_shell.profile_recovery_failed',
            level: 'error',
            source: 'main',
            message: 'Chrome shell browser profile could not be backed up',
            error: rotationError,
            context: {
              recoveryCount: recoveryCount,
              renameAttempts: rotationError['renameAttempts'] || 0x1,
              filesystemCode: rotationError['cause']?.['code'] || '',
            },
          }));
        throw startupError;
      }
      if (rotationResult?.['rotated'] !== true) {
        const notRotatedError = createProfileRecoveryError(
          'Chrome shell browser profile recovery did not rotate the profile',
          'CHROME_SHELL_PROFILE_RECOVERY_NOT_ROTATED',
        );
        startupError['profileRecoveryError'] = notRotatedError;
        throw startupError;
      }
      ((recoveryCount += 0x1),
        (backupDir = String(rotationResult['backupDir'] || '')),
        logEvent?.({
          type: 'chrome_shell.profile_rotated',
          level: 'warn',
          source: 'main',
          message: 'Chrome\x20shell\x20browser\x20profile\x20was\x20backed\x20up\x20before\x20retry',
          context: {
            recoveryCount: recoveryCount,
            backupName: path['basename'](backupDir),
            renameAttempts: rotationResult['renameAttempts'] || 0x1,
          },
        }));
    }
  }
}
export const __chromeShellProfileRecoveryForTest = {
  CHROME_SHELL_RENDERER_READY_TIMEOUT: CHROME_SHELL_RENDERER_READY_TIMEOUT,
  DEFAULT_MAX_RECOVERY_ATTEMPTS: DEFAULT_MAX_RECOVERY_ATTEMPTS,
  formatRecoveryTimestamp: formatRecoveryTimestamp,
  resolveRecoveryPaths: resolveRecoveryPaths,
};
