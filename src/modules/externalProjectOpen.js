// Guard the original synchronous project bridge across renderer waits; no automatic save/open.
export function captureExternalProjectTarget(readTarget) {
  const initial = readTarget();
  if (!initial?.manager || !initial.nodes || !Array.isArray(initial.canvases) || !initial.canvases.length ||
      typeof initial.key !== 'string') throw new Error('当前工程或画布尚未就绪；请稍后通过原入口打开文件');
  return () => {
    const current = readTarget();
    if (current?.manager !== initial.manager || current.nodes !== initial.nodes ||
        current.canvases !== initial.canvases || current.key !== initial.key) {
      throw new Error('等待期间目标工程或画布已改变，未打开外部文件；请在目标工程用原入口重新选择。若导入包已落盘，请先核对保留文件');
    }
  };
}

export async function runGuardedExternalProjectOpen({ response, readTarget, prepare, confirmReplace, apply }) {
  const assertCurrent = captureExternalProjectTarget(readTarget);
  await prepare();
  assertCurrent();
  // Prompt at the last synchronous point: edits made while preparing are included.
  if (!confirmReplace(response)) return false;
  assertCurrent();
  return apply(response) === true;
}

// One promise chain for startup drain and OS events; continue after one rejected request.
export function createSerialExternalProjectOpener(handle, reportError) {
  let tail = Promise.resolve();
  return requests => {
    const batch = Array.isArray(requests) ? requests : [];
    const pending = tail.then(async () => {
      for (const request of batch) {
        try { await handle(request); }
        catch (error) { reportError(error); }
      }
    });
    tail = pending.catch(() => {});
    return pending;
  };
}
