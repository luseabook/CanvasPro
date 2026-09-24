import { storyAssetLabel, storyAssetPrompt, readStoryAssetTask, readStoryAssetAcceptedImage, assertStoryAssetReference } from './storyAssetMediaModel.js';

// Extends the existing characters/scenes editor cards. All text is inert; no image fetch,
// polling, upload, model request, or automatic reference binding occurs while rendering.
export function createStoryAssetMediaPanel({ editor, element, assetKind, getModels }) {
  const assets = editor.draft[assetKind], nodes = editor.nodesContext, label = storyAssetLabel(assetKind);
  if (editor.assetSelectionKind !== assetKind) { editor.assetSelectionKind = assetKind; editor.assetMediaSelection = new Set(); }
  const selection = editor.assetMediaSelection;
  for (const id of selection) if (!assets.some(asset => asset.id === id)) selection.delete(id);
  const models = getModels('image'), tools = element('section', 'sw-card'), count = element('span', '', `已选${selection.size}/6项`);
  const selectLabel = element('label', 'sw-field', `${label}图片模型`), select = element('select'); select.setAttribute('aria-label', `${label}图片模型`);
  for (const model of models) {
    const option = element('option', '', model.label); option.value = JSON.stringify([model.provider, model.model]); select.append(option);
  }
  editor.assetModelChoices ||= {};
  const oldChoice = editor.assetModelChoices[assetKind];
  if (oldChoice) {
    if (models.some(model => JSON.stringify([model.provider, model.model]) === oldChoice)) select.value = oldChoice;
    else select.selectedIndex = -1;
  }
  editor.listen(select, 'change', () => { editor.assetModelChoices[assetKind] = select.value; }, true);
  selectLabel.append(select); tools.append(element('h3', '', `${label}参考图批次 · 原图片生成链路`), selectLabel, count,
    editor.button('刷新资料媒体状态 / 模型', () => editor.render()), editor.button('清空资料选择', () => { selection.clear(); editor.render(); }),
    editor.button('已选资料 → 图片批次（先建节点）', () => {
      const model = models.find(item => JSON.stringify([item.provider, item.model]) === select.value);
      editor.createAssetBatch(assetKind, [...selection], model);
    }));
  tools.append(element('p', 'sw-help', '每批1–6项，按资料顺序；只发送明确预览的名称/设定，不自动带已有参考图。先应用并建原图片节点，再准备原runtime并另行确认费用。结果需人工采纳，参考图需再显式绑定；应用/history不等于工程保存。'));
  if (!models.length) tools.append(element('p', 'sw-help', '当前无合格模型；已有本地结果仍可查看、采纳与绑定，不自动切换模型。'));
  editor.main.append(tools);
  const tasks = new Map(), accepted = new Map();
  for (const node of Object.values(nodes)) {
    const source = node.storyAssetSource || node.storyAssetResult;
    if (source?.workspaceNodeId !== editor.nodeId || source.assetKind !== assetKind) continue;
    const map = node.storyAssetSource ? tasks : accepted;
    if (!map.has(source.assetId)) map.set(source.assetId, []);
    map.get(source.assetId).push(node);
  }
  return {
    appendCard(card, asset) {
      const context = { workspaceNodeId: editor.nodeId, assetKind, assetId: asset.id };
      const chooseLabel = element('label', 'sw-field', '加入资料图片批次'), choose = element('input');
      choose.type = 'checkbox'; choose.checked = selection.has(asset.id); choose.setAttribute('aria-label', `选择资料 ${asset.id}`);
      editor.listen(choose, 'change', () => {
        if (choose.checked && selection.size >= 6) { choose.checked = false; editor.message('资料批次最多6项'); return; }
        if (choose.checked) selection.add(asset.id); else selection.delete(asset.id);
        count.textContent = `已选${selection.size}/6项`;
      }, true);
      chooseLabel.append(choose); card.append(chooseLabel);
      const preview = element('textarea'); preview.readOnly = true; preview.rows = 4; preview.setAttribute('aria-label', `${asset.id} 待发送资料文字`);
      try { preview.value = storyAssetPrompt(asset, assetKind); } catch (error) { preview.value = error.message; }
      card.append(element('p', 'sw-help', '本项待复制文字（改完名称/设定后请刷新；真正发送前还会复核并显示准备后的文字）：'), preview);
      if (asset.referenceNodeId) {
        let status = '手动参考图沿原契约；请核对来源，JSON不打包文件。';
        try { assertStoryAssetReference({ nodes, workspaceNodeId: editor.nodeId, assetKind, asset });
          if (asset.referenceImage) status = `已显式绑定本资料采纳图：${asset.referenceImage.localPath}（文件未探测）`; }
        catch (error) { status = `${error.message}；可保留记录或显式解除，旧结果不会被删除。`; }
        card.append(element('p', 'sw-help', status), editor.button('解除本资料参考图（仅草稿）', () => { editor.setAssetReference(assetKind, asset.id, ''); editor.render(); }));
      }
      for (const node of tasks.get(asset.id) || []) {
        const task = readStoryAssetTask(node, context, asset);
        if (!task) continue;
        const row = element('section', 'sw-card');
        row.append(element('p', '', `${node.name || node.id} · ${task.status}${task.current ? '' : ' · 资料名称/设定已变化，不能采纳旧任务'}`),
          editor.button('关闭并定位资料生成节点', () => editor.locateMediaNode(node.id)));
        for (const result of task.results || []) {
          row.append(element('p', '', `${result.index + 1}. ${result.localPath}`));
          const button = editor.button(`采纳资料结果 ${result.index + 1}（不绑定参考）`, () => editor.adoptAssetResult(assetKind, asset.id, node.id, result.index, result.key));
          button.disabled = !task.current; row.append(button);
        }
        card.append(row);
      }
      for (const node of accepted.get(asset.id) || []) {
        const row = element('section', 'sw-card'); let reference, error;
        try { reference = readStoryAssetAcceptedImage({ nodes, context, asset, nodeId: node.id }); } catch (cause) { error = cause.message; }
        row.append(element('p', '', `已采纳图片 ${node.id} · ${reference?.localPath || error}`),
          editor.button('关闭并定位已采纳资料图', () => editor.locateMediaNode(node.id)));
        const bind = editor.button('显式设为本资料参考图并应用…', () => editor.bindAssetReference(assetKind, asset.id, reference));
        bind.disabled = !reference; row.append(bind); card.append(row);
      }
    },
  };
}
