import { getStoryReferenceVideoChoice } from './storyMediaCanvas.js';
import { readStoryAcceptedImage, assertStoryReferenceSource } from './storyReferenceVideo.js';
import { readStoryMediaTask, storyMediaBindingStatus, storyMediaPrompt } from './storyMediaModel.js';

// Uses the editor's scoped listeners and textContent-based elements; no remote previews or polling.
export function renderStoryMediaPanel(editor, element, getModels) {
  const episode = editor.episode(), nodes = editor.nodesContext;
  editor.page = Math.min(editor.page, Math.max(0, Math.ceil(episode.shots.length / 10) - 1));
  editor.mediaChoices ||= {};
  if (editor.mediaSelectionEpisodeId !== episode.id) {
    editor.mediaSelectionEpisodeId = episode.id; editor.mediaShotSelection = new Set();
  }
  editor.mediaShotSelection ||= new Set();
  const selection = editor.mediaShotSelection;
  for (const id of selection) if (!episode.shots.some(shot => shot.id === id)) selection.delete(id);
  const models = {}, selectors = {}, referenceModel = getStoryReferenceVideoChoice();
  const tools = element('div', 'sw-tools');
  tools.append(editor.button('刷新节点状态 / 模型', () => editor.render()),
    editor.button('上一页', () => { editor.page = Math.max(0, editor.page - 1); editor.render(); }),
    element('span', '', `${episode.title} · 第 ${editor.page + 1} 页 · ${episode.shots.length} 镜`),
    editor.button('下一页', () => { editor.page++; editor.render(); }));
  editor.main.append(element('h2', '', '镜头媒体'), element('p', 'sw-help',
    '建立节点不发送请求。关闭工作室后，在原 AI 节点核对模型、参数、价格并生成；再回来刷新、选择结果、采纳并应用，最后保存工程。这里不自动重试、取消或恢复厂商任务。'),
  element('p', 'sw-help', '普通建节点及串行批次只传本镜图片/视频提示词（空时用画面描述），不自动带人物/场景图或其他媒体。尺寸、时长等以原节点参数为准，不自动套用镜头时长。采纳仅接受本地原媒体，创建独立源媒体节点，不复制文件字节。'), tools);
  for (const kind of ['image', 'video']) {
    models[kind] = getModels(kind);
    const label = element('label', 'sw-field', `${kind === 'image' ? '图片' : '视频'}模型（创建前可选；原节点仍需核对配置）`);
    const select = element('select'); select.setAttribute('aria-label', `${kind}生成模型`); selectors[kind] = select;
    for (const model of models[kind]) {
      const option = element('option', '', model.label); option.value = JSON.stringify([model.provider, model.model]); select.append(option);
    }
    if (editor.mediaChoices[kind] && models[kind].some(model => JSON.stringify([model.provider, model.model]) === editor.mediaChoices[kind])) select.value = editor.mediaChoices[kind];
    else if (editor.mediaChoices[kind]) select.selectedIndex = -1;
    editor.listen(select, 'change', () => { editor.mediaChoices[kind] = select.value; }, true);
    if (!models[kind].length) label.append(element('span', '', '无合格本机模型；已有结果仍可采纳'));
    label.append(select); editor.main.append(label);
  }
  const batchTools = element('div', 'sw-tools');
  const selectedCount = element('span', '', `本集已选 ${selection.size}/6 镜`);
  batchTools.append(selectedCount,
    editor.button('清空选镜', () => { selection.clear(); editor.render(); }));
  for (const kind of ['image', 'video']) {
    batchTools.append(editor.button(`已选镜头 → ${kind === 'image' ? '图片' : '视频'}批次（先建节点）`, () => {
      const choice = models[kind].find(model => JSON.stringify([model.provider, model.model]) === selectors[kind].value);
      editor.createMediaBatch(episode.id, [...selection], kind, choice);
    }));
  }
  editor.main.append(batchTools, element('p', 'sw-help', '批次最多6镜；先应用并建节点，再准备原运行时、确认费用后串行生成。不是一点击就发送。'));
  const clipTools = element('div', 'sw-tools');
  clipTools.append(editor.button('已选镜头 → 图片/视频初剪预览', () => editor.openStoryClip(episode.id, [...selection])),
    editor.button('本集全部镜头 → 图片/视频初剪预览', () => editor.openStoryClip(episode.id, episode.shots.map(shot => shot.id))));
  editor.main.append(clipTools, element('p', 'sw-help', '初剪一次1–60镜，按本集顺序逐镜显式选已采纳图片或视频；默认视频，不自动替换缺素材。可显式采纳当前画布一条本地音频，设置范围、起点、音量/静音。只建原剪辑节点，导出时再次确认本地渲染。'));
  for (const node of Object.values(nodes)) {
    const sequence = node?.storySequence, output = node?.storySequenceOutput;
    const origin = sequence || output;
    if (origin?.workspaceNodeId !== editor.nodeId || origin.episodeId !== episode.id) continue;
    const row = element('div', 'sw-tools');
    row.append(element('span', '', `${sequence ? '初剪' : '已渲染视频（生成时记录，不自动更新）'} · ${node.name || node.id}${output ? ' · ' + (node.localPath || '本地路径缺失') : ''}`),
      editor.button(sequence ? '关闭并定位初剪' : '关闭并定位成片', () => editor.locateMediaNode(node.id)));
    editor.main.append(row);
  }
  // Index once per render, not once per shot. Only this workspace/episode is shown.
  const byShot = new Map();
  for (const node of Object.values(nodes)) {
    const source = node?.storyMediaSource;
    if (source?.workspaceNodeId !== editor.nodeId || source.episodeId !== episode.id) continue;
    if (!byShot.has(source.shotId)) byShot.set(source.shotId, []);
    byShot.get(source.shotId).push(node);
  }
  episode.shots.slice(editor.page * 10, editor.page * 10 + 10).forEach((shot, offset) => {
    const card = element('section', 'sw-card'), context = { workspaceNodeId: editor.nodeId, episodeId: episode.id, shotId: shot.id };
    const chooseLabel = element('label', 'sw-field', '加入批次'), choose = element('input');
    choose.type = 'checkbox'; choose.checked = selection.has(shot.id); choose.setAttribute('aria-label', `选择镜头 ${shot.id}`);
    editor.listen(choose, 'change', () => {
      if (choose.checked && selection.size >= 6) { choose.checked = false; editor.message('每批最多选择6镜'); return; }
      if (choose.checked) selection.add(shot.id); else selection.delete(shot.id);
      selectedCount.textContent = `本集已选 ${selection.size}/6 镜`;
    }, true);
    chooseLabel.append(choose);
    card.append(element('h3', '', `镜头 ${editor.page * 10 + offset + 1} · ${shot.id}`), chooseLabel);
    for (const kind of ['image', 'video']) {
      const label = kind === 'image' ? '图片' : '视频', details = element('details');
      details.append(element('summary', '', `${label}待复制提示词`));
      let prompt = '';
      try { prompt = storyMediaPrompt(shot, kind); } catch (error) { prompt = error.message; }
      const preview = element('textarea'); preview.readOnly = true; preview.value = prompt; preview.rows = 3; preview.setAttribute('aria-label', `${label}提示词预览`); details.append(preview);
      const create = editor.button(`建立${label}节点（不发送）`, () => {
        const choice = models[kind].find(model => JSON.stringify([model.provider, model.model]) === selectors[kind].value);
        editor.createMediaNode(episode.id, shot.id, kind, choice);
      });
      create.disabled = !models[kind].length;
      card.append(details, create);
    }
    const frameBox = element('section', 'sw-card');
    frameBox.append(element('h4', '', '已采纳图片 → 首帧视频（单镜，独立于纯文字批次）'));
    let accepted = null, problem = '';
    try { accepted = readStoryAcceptedImage({ nodes, context, shot }); } catch (error) { problem = error.message; }
    const frameSelect = element('select'); frameSelect.setAttribute('aria-label', `镜头 ${shot.id} 首帧来源`);
    const empty = element('option', '', '请选择首帧（不会自动选用）'); empty.value = ''; frameSelect.append(empty);
    if (accepted) {
      const option = element('option', '', `本镜已采纳图片 · ${accepted.imageNodeId} · ${accepted.localPath}`);
      option.value = accepted.imageNodeId; frameSelect.append(option);
    }
    const createFrame = editor.button('应用并建立首帧视频（不发送）', () => editor.createReferenceVideo(episode.id, shot.id, frameSelect.value));
    createFrame.disabled = true;
    editor.listen(frameSelect, 'change', () => { createFrame.disabled = !referenceModel || !frameSelect.value; }, true);
    frameBox.append(element('p', 'sw-help', referenceModel ? referenceModel.label : '本机已核实首帧模型不可用；不会自动换模型'),
      frameSelect, createFrame, element('p', 'sw-help', problem || '先在下方定位并核对已采纳原图。创建后在原视频入口确认上传/费用；本步不复制文件。'));
    card.append(frameBox);
    for (const ref of shot.mediaRefs || []) {
      const row = element('div', 'sw-tools');
      const bound = nodes[ref.nodeId], frame = bound?.storyMediaResult?.referenceImage;
      if (frame) {
        let status = '生成时首帧仍与本镜关联一致（文件字节未核对）';
        try { assertStoryReferenceSource({ node: bound, nodes, shot }); } catch (error) { status = error.message; }
        row.append(element('span', 'sw-help', `生成时首帧：${frame.imageNodeId} · ${frame.localPath} · ${status}`));
      }
      row.append(element('span', '', `${ref.kind === 'image' ? '图片' : '视频'}：${storyMediaBindingStatus(ref, nodes, context, shot)}`),
        editor.button('关闭并定位结果', () => editor.locateMediaNode(ref.nodeId)),
        editor.button('解除关联（草稿）', () => {
          editor.change(draft => { draft.episodes.find(e => e.id === episode.id).shots.find(s => s.id === shot.id).mediaRefs = (shot.mediaRefs || []).filter(item => item.kind !== ref.kind); }, true);
        }));
      card.append(row);
    }
    for (const node of byShot.get(shot.id) || []) {
      const task = readStoryMediaTask(node, context, shot); if (!task) continue;
      const row = element('section', 'sw-card');
      let referenceError = '';
      if (node.storyMediaReference) {
        try { assertStoryReferenceSource({ node, nodes, shot }); } catch (error) { referenceError = error.message; }
        row.append(element('p', 'sw-help', referenceError || `首帧来源：${node.storyMediaReference.imageNodeId} · ${node.storyMediaReference.localPath}`));
      }
      row.append(element('p', '', `${node.name || node.id} · ${node.provider || ''} / ${node.model || ''} · ${task.status}${task.current ? '' : ' · 来源提示词已改变，不能采纳'}`),
        editor.button('关闭并定位原生成节点', () => editor.locateMediaNode(node.id)));
      for (const result of task.results) {
        const pick = editor.button(`采纳结果 ${result.index + 1} 并应用`, () => editor.adoptMediaResult(episode.id, shot.id, node.id, result.index, result.key));
        pick.disabled = !task.current || !!referenceError;
        row.append(element('p', '', result.localPath), pick);
      }
      card.append(row);
    }
    editor.main.append(card);
  });
  if (!episode.shots.length) editor.main.append(element('p', 'sw-help', '先在分镜表中建立镜头。'));
}
