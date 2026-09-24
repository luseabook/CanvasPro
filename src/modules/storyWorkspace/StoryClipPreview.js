import { validateStoryClipRanges } from './storyClipModel.js';
import { validateStoryClipAudio, storyClipAudioSummary } from './storyClipMedia.js';

export function createStoryClipPreview({ element, items, readItems, audioSources = [], onApply, onClose, onLocate }) {
  const abort = new AbortController(), root = element('section', 'sw-card'); root.tabIndex = -1;
  const currentItems = items.map(item => ({ ...item })), controls = [], rows = [];
  const mediaKinds = Object.fromEntries(items.map(item => [item.shotId, item.kind || 'video']));
  const status = element('p', 'sw-help'); status.setAttribute('aria-live', 'polite');
  const number = input => input.value.trim() ? Number(input.value) : NaN;
  const listen = (node, event, callback) => node.addEventListener(event, callback, { signal: abort.signal });
  function button(label, action) {
    const node = element('button', 'sw-button', label); node.type = 'button';
    listen(node, 'click', () => { try { action(); } catch (error) { status.textContent = error.message; } });
    return node;
  }
  function numeric(label, value, max = 3600) {
    const wrap = element('label', 'sw-field', label), input = element('input');
    input.type = 'number'; input.min = '0'; input.max = String(max); input.step = '0.001'; input.value = String(value);
    input.setAttribute('aria-label', label); listen(input, 'input', update); wrap.append(input);
    return { wrap, input };
  }
  root.append(element('h2', '', '按镜头顺序建立初剪 · 图片 / 视频 / 可选单音轨'), element('p', 'sw-help',
    '逐镜显式选择本镜已采纳图片或视频；默认视频，不替换缺素材。视频默认完整记录时长；图片默认分镜计划时长，可改为0.1–3600秒，入点固定0、无音轨。这里只应用草稿并建原剪辑节点/连线，不探测、不渲染。'));
  function renderRow(index) {
    const item = currentItems[index], row = rows[index], image = mediaKinds[item.shotId] === 'image';
    row.replaceChildren(element('h3', '', `${index + 1}. ${item.shotId} · ${item.description}`));
    const label = element('label', 'sw-field', '本镜初剪媒体'), select = element('select');
    select.setAttribute('aria-label', `${item.shotId} 初剪媒体`);
    for (const [kind, title] of [['video', '已采纳视频'], ['image', '已采纳静态图片']]) {
      const option = element('option', '', title); option.value = kind; select.append(option);
    }
    select.value = mediaKinds[item.shotId]; select.disabled = typeof readItems !== 'function';
    listen(select, 'change', () => {
      mediaKinds[item.shotId] = select.value;
      try {
        const next = readItems({ ...mediaKinds });
        if (next.length !== currentItems.length || next[index]?.shotId !== item.shotId) throw new Error('镜头列表变化，请返回重新预览');
        currentItems[index] = next[index];
      } catch (error) { currentItems[index] = { ...item, error: error.message }; }
      renderRow(index); update();
    });
    label.append(select); row.append(label, element('p', '', item.error || (image ?
      `${item.localPath} · 默认计划 ${item.duration}s；这是保留时长，不是图片文件的时长` :
      `${item.localPath} · 素材记录 ${item.duration}s / 分镜计划 ${item.plannedDuration}s`)));
    if (item.nodeId) row.append(button('放弃预览并定位素材', () => onLocate(item.nodeId)));
    const start = numeric(`${item.shotId} 入点（秒，图片固定0）`, 0, image ? 0 : item.duration || 3600);
    const end = numeric(`${item.shotId} ${image ? '保留时长' : '出点'}（秒）`, item.duration || '', image ? 3600 : item.duration || 3600);
    start.input.disabled = !!item.error || image; end.input.disabled = !!item.error;
    controls[index] = { start: start.input, end: end.input }; row.append(start.wrap, end.wrap);
  }
  for (let index = 0; index < items.length; index++) { rows[index] = element('section', 'sw-card'); renderRow(index); root.append(rows[index]); }
  function ranges() {
    return currentItems.map((item, index) => ({ shotId: item.shotId,
      start: number(controls[index].start), end: number(controls[index].end) }));
  }

  const audioBox = element('section', 'sw-card'), audioLabel = element('label', 'sw-field', '显式采纳一条独立本地音轨');
  const audioSelect = element('select'); audioSelect.setAttribute('aria-label', '独立音轨素材');
  const none = element('option', '', '不添加独立音轨（默认）'); none.value = ''; audioSelect.append(none);
  for (const source of audioSources) {
    const option = element('option', '', `${source.label} · ${source.nodeId} · ${source.error || `${source.localPath} / ${source.duration}s`}`);
    option.value = source.nodeId; option.disabled = !!source.error; audioSelect.append(option);
  }
  audioSelect.value = ''; audioLabel.append(audioSelect); audioBox.append(audioLabel, element('p', 'sw-help',
    '仅当前画布的source-audio独立素材（导入、采纳或任务取回后）。不生成/下载音频，不改逐镜mediaRefs。选择时默认从0取到当前成片与音频较短者，可手改；后续改片段时不自动裁切。视频原声保留并叠加此单音轨，无自动闪避、循环或对齐。'));
  const soundFields = {};
  for (const [key, label, value, max] of [['start', '音频素材入点（秒）', 0, 3600], ['end', '音频素材出点（秒）', '', 3600],
    ['timelineStart', '音轨在成片的起点（秒）', 0, 3600], ['volume', '独立音轨音量（0–1）', 1, 1]]) {
    const field = numeric(label, value, max); field.input.disabled = true; soundFields[key] = field.input; audioBox.append(field.wrap);
  }
  const muteLabel = element('label', 'sw-field', '独立音轨静音（不静音视频原声）'), muted = element('input');
  muted.type = 'checkbox'; muted.checked = false; muted.disabled = true; muted.setAttribute('aria-label', '独立音轨静音');
  listen(muted, 'change', update); muteLabel.append(muted); audioBox.append(muteLabel); root.append(audioBox);
  listen(audioSelect, 'change', () => {
    const source = audioSources.find(item => item.nodeId === audioSelect.value && !item.error);
    for (const field of Object.values(soundFields)) field.disabled = !source;
    muted.disabled = !source; muted.checked = false;
    soundFields.start.value = '0'; soundFields.timelineStart.value = '0'; soundFields.volume.value = '1';
    let total = source?.duration || 0;
    try { total = validateStoryClipRanges(currentItems, ranges()).total; } catch { /* Row error remains visible and blocks apply. */ }
    soundFields.end.value = source ? String(Math.min(source.duration, total)) : '';
    update();
  });
  function readAudio(total) {
    if (!audioSelect.value) return null;
    const source = audioSources.find(item => item.nodeId === audioSelect.value && !item.error);
    return validateStoryClipAudio({ source, start: number(soundFields.start), end: number(soundFields.end),
      timelineStart: number(soundFields.timelineStart), volume: number(soundFields.volume), muted: muted.checked }, total);
  }
  const apply = button('确认应用全部草稿并建立初剪（不渲染）', () => {
    const value = ranges(), checked = validateStoryClipRanges(currentItems, value);
    onApply(value, { items: currentItems.map(item => ({ ...item })), audio: readAudio(checked.total) });
  });
  function update() {
    try {
      const checked = validateStoryClipRanges(currentItems, ranges()), audio = readAudio(checked.total);
      status.textContent = `${currentItems.length}段 · 合计${checked.total}秒。${storyClipAudioSummary(audio)} 渲染需更新后的桌面端；应用/history不等于工程保存。`;
      apply.disabled = false;
    } catch (error) { status.textContent = error.message; apply.disabled = true; }
  }
  root.append(status, apply, button('返回，不创建', onClose)); update();
  return { root, focus: () => root.focus(), destroy: () => { abort.abort(); root.remove(); } };
}

// Electron does not support window.prompt reliably. Keep the completed path selectable without writing into another canvas.
export function showStoryClipRecovery(localPath, reason) {
  const dialog = document.createElement('dialog'); dialog.setAttribute('aria-label', '初剪结果待人工恢复');
  dialog.style.cssText = 'width:min(640px,90vw);padding:24px;';
  const title = document.createElement('h3'); title.textContent = '视频已生成，但未自动完成关联或导出';
  const message = document.createElement('p'); message.textContent = `${reason || ''} 请复制下面的本地路径，回原画布核对后导入；不要盲目重新渲染。工程尚未保存。`;
  const path = document.createElement('textarea'); path.readOnly = true; path.rows = 3; path.value = localPath;
  path.style.width = '100%'; path.setAttribute('aria-label', '已生成视频的本地路径');
  const close = document.createElement('button'); close.type = 'button'; close.textContent = '已记录路径，关闭';
  close.addEventListener('click', () => { dialog.close(); dialog.remove(); }, { once: true });
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
  dialog.append(title, message, path, close); document.body.append(dialog); dialog.showModal(); path.focus(); path.select();
}