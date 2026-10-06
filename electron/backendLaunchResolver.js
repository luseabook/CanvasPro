import path from 'node:path';
export function resolveNativeBackendExecutable({
  runtimeRoot: runtimeRoot,
  platform: platform = process.platform,
}) {
  const executable = platform === 'win32' ? 'aicanvas-backend.exe' : 'aicanvas-backend';
  return path.join(runtimeRoot, 'backend', executable);
}
export function resolveBackendLaunchSpec({
  appIsPackaged: appIsPackaged,
  appRoot: appRoot,
  runtimeRoot: runtimeRoot,
  platform: platform = process.platform,
  existsSync: existsSync,
  pythonCommand: pythonCommand,
}) {
  if (!appIsPackaged)
    return { kind: 'python-source', command: pythonCommand, args: ['server.py'], cwd: appRoot };
  const executable = resolveNativeBackendExecutable({ runtimeRoot: runtimeRoot, platform: platform });
  if (!existsSync(executable))
    throw new Error(
      'Packaged backend executable is missing: ' +
        executable +
        '. ' +
        'Rebuild the native backend before packaging.',
    );
  return { kind: 'native-backend', command: executable, args: [], cwd: appRoot };
}
