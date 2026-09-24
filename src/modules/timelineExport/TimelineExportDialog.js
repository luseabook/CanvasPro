import { collectNodeMedia } from '../nodeExport/collectNodeMedia.js';
import { normalizeTimelineRequest } from './timelineExportModel.js';

let activeDialog = null;
function element(tag, text) {
  const el = document.createElement(tag); if (text !== undefined) el.textContent = text; return el;
}
export function openTimelineExportDialog(nodes, selectedIds) {
  if (activeDialog) { activeDialog.focus(); return; }
  let collected;
  try { collected = collectNodeMedia(nodes, selectedIds); }
  catch (error) { window.alert(error.message); return; }
  // Whole selection must be representable. Never silently discard a selected shot.
  if (collected.skipped.length || collected.items.some(item => item.kind !== 'video') || !collected.items.length || collected.items.length > 32) {
    window.alert('本批请选择1–32个已有本地原视频的节点；选择含缺失、生成中、远程或非视频节点时整批阻止。不会静默漏掉片段。'); return;
  }
  const clips = collected.items.map(item => ({ ...item, startSec: 0, endSec: null }));
  const dialog = element('dialog'); activeDialog = dialog; dialog.className = 'timeline-export-dialog';
  dialog.style.cssText = 'width:min(850px,92vw);max-height:85vh;overflow:auto;padding:24px;border:1px solid #777;border-radius:12px;background:#202124;color:#eee;';
  dialog.setAttribute('aria-label', '导出Premiere/FCP7时间线工程');
  dialog.append(element('h2', '导出 Premiere/FCP7 时间线工程'));
  dialog.append(element('p', '先调整顺序及入出点（秒，出点留空使用全长）。按最近帧量化；只支持相同分辨率、相同受支持帧率的本地视频。不是MP4、不是剪映草稿，也不读取现有剪辑节点的复杂轨道。'));
  dialog.append(element('p', '将用本地 ffprobe 预检；不会联网/安装运行时。预检失败整批停止；通过后选择目录并原生确认。复制完整原视频，未使用部分及音频仍在副本中。'));
  const title = element('input'); title.value = 'CanvasPro 时间线'; title.maxLength = 60;
  const titleLabel = element('label', '工程标题：'); titleLabel.append(title); dialog.append(titleLabel);
  const includeAudio = element('input'); includeAudio.type = 'checkbox'; includeAudio.checked = true;
  const audioLabel = element('label', ' 保留原音轨（单路单/双声道，44.1/48kHz，起点同步；不支持时拒绝）');
  audioLabel.prepend(includeAudio); dialog.append(element('br'), audioLabel);
  const table = element('div'); dialog.append(table);
  function button(text, action) {
    const el = element('button', text); el.type = 'button'; el.style.cssText = 'padding:6px 10px;margin:5px;';
    el.addEventListener('click', action); return el;
  }
  function renderClips() {
    table.replaceChildren();
    clips.forEach((clip, index) => {
      const row = element('div'); row.style.cssText = 'border-bottom:1px solid #555;padding:8px 0';
      row.append(element('span', `${index + 1}. ${clip.name} `));
      for (const [key, label] of [['startSec', '入点'], ['endSec', '出点']]) {
        const input = element('input'); input.type = 'number'; input.min = '0'; input.max = '1800'; input.step = '0.001';
        input.value = clip[key] === null ? '' : String(clip[key]); input.style.width = '90px'; input.setAttribute('aria-label', `${index + 1} ${label}秒`);
        input.addEventListener('input', () => { clip[key] = input.value === '' ? (key === 'endSec' ? null : NaN) : Number(input.value); });
        row.append(element('span', label), input);
      }
      for (const [label, offset] of [['上移', -1], ['下移', 1]]) {
        const move = button(label, () => { const other = index + offset; [clips[index], clips[other]] = [clips[other], clips[index]]; renderClips(); });
        move.disabled = index + offset < 0 || index + offset >= clips.length; row.append(move);
      }
      table.append(row);
    });
  }
  renderClips();
  const status = element('p', '准备好后点击预检，随后在原生窗口确认。'); status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  let busy = false;
  const unload = event => { if (busy) { event.preventDefault(); event.returnValue = ''; } };
  const close = button('关闭', () => { if (!busy) { dialog.close(); dialog.remove(); activeDialog = null; window.removeEventListener('beforeunload', unload); } });
  const execute = button('预检并导出时间线工程', async () => {
    if (busy) return;
    let payload;
    try { payload = normalizeTimelineRequest({ title: title.value, includeAudio: includeAudio.checked, clips }); }
    catch (error) { status.textContent = error.message; return; }
    const bridge = window.electronAPI?.timelineExport;
    if (typeof bridge?.export !== 'function' || typeof bridge?.capabilities !== 'function') {
      status.textContent = '需要更新后的Electron桌面端和已有ffprobe运行时；浏览器不支持。'; return;
    }
    busy = true;
    const controls = [...dialog.querySelectorAll('button,input')].map(control => [control, control.disabled]);
    controls.forEach(([control]) => { control.disabled = true; });
    status.textContent = '正在进行本地元数据预检／等待原生确认／复制。单个探测上限15秒，不自动重试；请勿关闭应用。';
    let completed = false;
    try {
      const capabilities = await bridge.capabilities();
      if (capabilities?.available !== true || capabilities.format !== 'xmeml-v5') throw new Error('bridge');
      const result = await bridge.export(payload);
      if (result?.status === 'cancelled') status.textContent = '已取消，未开始复制工程。';
      else if (result?.status === 'complete') {
        completed = true;
        status.textContent = `工程已写入：${result.directory}\\timeline.xml。媒体副本及清单已保存；请在Premiere等软件导入XML验收，不是已渲染影片。移动目录后需重链接媒体。`;
      } else {
        status.textContent = `${result?.error || '导出失败'}${result?.directory ? `；已创建目录：${result.directory}。部分副本可能保留，请先核对；不自动续写。` : ''}`;
        if (result?.results?.length) {
          const list = element('ul'); result.results.forEach(item => list.append(element('li', `${item.name}：${item.status === 'saved' ? '副本已保存' : item.error || '失败'}`))); status.append(list);
        }
      }
    } catch { status.textContent = '桌面连接或返回状态异常。可能已有部分文件，请先核对所选目录，不能视为未执行。'; }
    finally {
      busy = false; controls.forEach(([control, disabled]) => { control.disabled = disabled; });
      if (completed) execute.disabled = true;
    }
  });
  dialog.addEventListener('cancel', event => { event.preventDefault(); if (!busy) close.click(); });
  for (const type of ['keydown', 'keyup', 'pointerdown', 'pointerup', 'contextmenu', 'wheel']) dialog.addEventListener(type, event => event.stopPropagation());
  dialog.append(status, execute, close); document.body.append(dialog); window.addEventListener('beforeunload', unload);
  dialog.showModal(); close.focus();
}
