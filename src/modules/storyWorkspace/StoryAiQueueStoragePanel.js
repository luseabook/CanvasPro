export function downloadStoryQueueSnapshot(raw, name = 'story-ai-queue.json') {
  const url = URL.createObjectURL(new Blob([raw], { type: 'application/json;charset=utf-8' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name;
  document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export function createStoryAiQueueStoragePanel({ persistence, isBusy, onMessage }) {
  const abort = new AbortController(), root = document.createElement('section'); root.className = 'sw-queue-storage';
  const heading = document.createElement('h3'); heading.textContent = '本地自动保存（IndexedDB）';
  const status = document.createElement('p'); status.setAttribute('role', 'status');
  const note = document.createElement('p'); note.className = 'sw-help';
  note.textContent = '首次需明确启用。快照含正文、所选文字资料和结果，仅存当前浏览器/应用配置文件，不加密、不上传、不随工程文件迁移。保存完成也不是永久备份；请定期导出 JSON。';
  const controls = document.createElement('div'); controls.className = 'sw-tools';
  const buttons = [];
  function action(label, confirmation, operation) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'sw-button'; button.textContent = label;
    button.addEventListener('click', () => {
      if (confirmation && !window.confirm(confirmation)) return;
      void operation().catch(error => onMessage(error.message));
    }, { signal: abort.signal }); controls.append(button); buttons.push(button); return button;
  }
  const enable = action('启用本地自动保存', '将队列正文、所选设定及返回文本保存在当前浏览器本地。不会加密，也不替代工程保存和手动备份。是否启用？', () => persistence.enable());
  const recover = action('恢复本地记录并启用保存', '恢复会替换内存队列，请先导出未保存结果。待发送项将标为待核对，进行中项视为状态未知；不会自动调用模型或追加镜头。确认恢复并启用本地保存？', () => persistence.recover());
  const retry = action('重试本地保存（不请求模型）', '', () => persistence.retry());
  const disable = action('关闭自动保存', '停止自动保存并保留已提交的本地记录。未保存的内容只在内存中；之后的生成没有自动保存保护。继续？', () => persistence.disable());
  const remove = action('删除此工作室本地记录', '只删除此工程/画布/工作室的本地队列副本，并关闭自动保存；内存队列和工程镜头保留。未导出的本地记录不可恢复。确认删除？', () => persistence.remove());
  action('导出已提交的本地副本', '', async () => {
    downloadStoryQueueSnapshot(await persistence.exportSaved(), 'story-ai-queue-local.json');
    onMessage('已触发本地副本下载，请确认文件已保存。副本可能早于当前内存状态，不证明请求未执行或工程已保存。');
  });
  function refresh() {
    const info = persistence.getInfo();
    let message = info.hasRecord ? '自动保存未启用；本地已有记录，可恢复或导出。' : '未启用；可继续使用手动队列快照。';
    if (!info.available) message = '缺少稳定工程/画布标识，请先保存工程后重开工作室；仍可手动导出队列。';
    else if (info.enabled) {
      message = info.dirty ? '有尚未提交到本地的队列变更。' : '当前队列已提交到本地数据库。';
      if (info.saving) message = '正在保存到本地，尚不能视为完成。';
    }
    if (info.savedAt) message += ` 最近记录时间：${new Date(info.savedAt).toLocaleString()}。`;
    if (info.error) message += ` 提示：${info.error}`;
    status.textContent = message;
    for (const button of buttons) button.disabled = isBusy() || info.working || !info.available;
    enable.disabled ||= info.enabled; recover.disabled ||= info.enabled || !info.hasRecord;
    retry.disabled ||= !info.enabled; disable.disabled ||= !info.enabled;
    remove.disabled ||= !info.hasRecord && !info.enabled;
  }
  root.append(heading, note, status, controls);
  const unsubscribe = persistence.subscribe(refresh); refresh();
  return { root, refresh, destroy() { unsubscribe(); abort.abort(); root.remove(); } };
}
