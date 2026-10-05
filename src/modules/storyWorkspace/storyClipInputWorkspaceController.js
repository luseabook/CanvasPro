import { buildStoryClipInputSlotViewModel, updateStoryClipInput } from './storyClipInputSlots.js';
import {
  applyStoryEpisodeVideoModelDefault,
  formatStoryClipVideoGenerationDuration,
  normalizeStoryVideoGenerationParams,
  recoverUnavailableStoryVideoModelState,
  seedStoryAspectRatioInVideoGenerationParams,
} from './storyVideoGenerationSettings.js';
import { uploadFile } from '../../services/projectService.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
export function createStoryClipInputWorkspaceController({
  state: state,
  root: root,
  getSelectedEpisode: getSelectedEpisode,
  getSelectedClip: getSelectedClip,
  replaceClip: replaceClip,
  takePendingInputContext: takePendingInputContext,
  createProjectToken: createProjectToken,
  isProjectTaskCurrent: isProjectTaskCurrent,
  isProjectTaskLive: isProjectTaskLive,
  syncProjectEntry: syncProjectEntry,
  schedulePersistence: schedulePersistence,
  render: render,
  showToast: showToast,
} = {}) {
  if (
    !state ||
    !root ||
    typeof getSelectedEpisode !== 'function' ||
    typeof getSelectedClip !== 'function' ||
    typeof replaceClip !== 'function' ||
    typeof takePendingInputContext !== 'function' ||
    typeof createProjectToken !== 'function' ||
    typeof isProjectTaskCurrent !== 'function' ||
    typeof isProjectTaskLive !== 'function' ||
    typeof syncProjectEntry !== 'function' ||
    typeof schedulePersistence !== 'function' ||
    typeof render !== 'function'
  )
    throw new TypeError(
      'Story clip inputs require selection, project, and presentation adapters.',
    );
  const syncVideoDurationInPlace = (item) => {
      const text = normalizeText(item?.['id']);
      if (!text) return false;
      const formatStoryClipVideoGenerationDuration2 = formatStoryClipVideoGenerationDuration(
        item,
        state['models']['video'],
        state['videoGenerationParams'],
      );
      let key = false;
      return (
        root['querySelectorAll']('[data-story-clip-duration]')['forEach']((el) => {
          if (normalizeText(el['dataset']?.['storyClipDuration']) !== text) return;
          if (el['textContent'] !== formatStoryClipVideoGenerationDuration2)
            el['textContent'] = formatStoryClipVideoGenerationDuration2;
          key = true;
        }),
        key
      );
    },
    applyVideoSettings = (index) => {
      return (
        (state['videoGenerationParams'] = normalizeStoryVideoGenerationParams(
          state['models']['video'],
          seedStoryAspectRatioInVideoGenerationParams(
            state['models']['video'],
            state['videoGenerationParams'],
            state['data']['project']?.['aspectRatio'],
          ),
        )),
        (state['videoGenerationParamsByModel'] = {
          ...state['videoGenerationParamsByModel'],
          [state['models']['video']]: { ...state['videoGenerationParams'] },
        }),
        Boolean(index)
      );
    },
    reconcileSelectedInputsForModel = () => {
      const enabled = getSelectedEpisode(state),
        inputs = getSelectedClip(state, enabled);
      if (!enabled || !inputs) return false;
      try {
        const storyClipInputSlotViewModel = buildStoryClipInputSlotViewModel({
            modelId: state['models']['video'],
            provider: state['videoProvider'],
            inputs: inputs['inputs'],
          }),
          inputs2 = { image: [], video: [], audio: [] };
        return (
          storyClipInputSlotViewModel['groups']['forEach']((result) => {
            inputs2[result['kind']] = result['slots']
              ['filter']((data) => data['input']?.['url'])
              ['map']((slotId) => ({ ...slotId['input'], slotId: slotId['id'] }));
          }),
          replaceClip(enabled['id'], inputs['id'], { ...inputs, inputs: inputs2 })
        );
      } catch {
        return false;
      }
    },
    prepareVideoSettings = (
      clip,
      {
        episode: episode = null,
        enteringEpisode: enteringEpisode = false,
        switchingEpisode: switchingEpisode = false,
      } = {},
    ) => {
      const options =
          (enteringEpisode || switchingEpisode) && applyStoryEpisodeVideoModelDefault(state, episode),
        recoverUnavailableStoryVideoModelState2 = recoverUnavailableStoryVideoModelState(state, {
          clip: clip,
        });
      applyVideoSettings(clip);
      if (options || recoverUnavailableStoryVideoModelState2) reconcileSelectedInputsForModel();
      return options || recoverUnavailableStoryVideoModelState2;
    },
    updateSelectedInput = ({ kind: kind, slotId: slotId2, value: value2 }) => {
      const enabled2 = getSelectedEpisode(state),
        enabled3 = getSelectedClip(state, enabled2);
      if (!enabled2 || !enabled3) return false;
      const updateStoryClipInput2 = updateStoryClipInput(enabled3, {
        kind: kind,
        slotId: slotId2,
        value: value2,
      });
      return (
        replaceClip(enabled2['id'], enabled3['id'], updateStoryClipInput2),
        schedulePersistence({ immediate: true }),
        render(),
        true
      );
    },
    uploadSelectedInput = async (name) => {
      const enabled4 = takePendingInputContext();
      if (!name || !enabled4) return false;
      const modelId = enabled4['projectToken'] || createProjectToken(state),
        enabled5 =
          modelId['data']?.['episodes']?.['find'](
            (target) => normalizeText(target?.['id']) === normalizeText(enabled4['episodeId']),
          ) || (isProjectTaskCurrent(modelId) ? getSelectedEpisode(state) : null),
        inputs3 =
          enabled5?.['clips']?.['find'](
            (source) => normalizeText(source?.['id']) === normalizeText(enabled4['clipId']),
          ) || (isProjectTaskCurrent(modelId) ? getSelectedClip(state, enabled5) : null);
      try {
        const next = String(name['type'] || '')['startsWith']('image/')
            ? 'image'
            : String(name['type'] || '')['startsWith']('video/')
              ? 'video'
              : String(name['type'] || '')['startsWith']('audio/')
                ? 'audio'
                : '',
          kind2 = enabled4['kind'] || next;
        if (!kind2 || (enabled4['kind'] && next && enabled4['kind'] !== next))
          throw new Error('所选文件类型与当前视频模型入参槽不匹配');
        if (!enabled5 || !inputs3) throw new Error('当前片段不可用');
        const storyClipInputSlotViewModel2 = buildStoryClipInputSlotViewModel({
            modelId: modelId['modelSettings']['models']['video'],
            provider: modelId['modelSettings']['videoProvider'],
            inputs: inputs3?.['inputs'],
          }),
          slotId3 = enabled4['slotId']
            ? storyClipInputSlotViewModel2['slots']['find'](
                (current) => current['id'] === enabled4['slotId'] && current['kind'] === kind2,
              )
            : storyClipInputSlotViewModel2['slots']['find'](
                (enabled6) => enabled6['kind'] === kind2 && !enabled6['input']?.['url'],
              );
        if (!slotId3) throw new Error('当前视频模型没有可用的对应入参槽');
        const response = await uploadFile(name, modelId['projectId']);
        if (!isProjectTaskLive(modelId)) return false;
        const url = normalizeText(
          response?.['displayUrl'] ||
            response?.['url'] ||
            response?.['originalUrl'] ||
            response?.['localUrl'],
        );
        if (!url) throw new Error('素材保存结果缺少可用地址');
        const updateStoryClipInput3 = updateStoryClipInput(inputs3, {
          kind: kind2,
          slotId: slotId3['id'],
          value: { url: url, name: name['name'], mimeType: name['type'] },
        });
        return (
          replaceClip(enabled5['id'], inputs3['id'], updateStoryClipInput3, modelId['data']),
          syncProjectEntry(modelId),
          schedulePersistence({ immediate: true }),
          isProjectTaskCurrent(modelId) &&
            (render(),
            showToast?.(
              (kind2 === 'image' ? '图片' : kind2 === 'audio' ? '音频' : '视频') + '入参已接入。',
              'success',
            )),
          true
        );
      } catch (error) {
        return (
          isProjectTaskCurrent(modelId) && showToast?.(error?.['message'] || '片段入参上传失败。', 'error'),
          false
        );
      }
    };
  return Object['freeze']({
    applyVideoSettings: applyVideoSettings,
    prepareVideoSettings: prepareVideoSettings,
    reconcileSelectedInputsForModel: reconcileSelectedInputsForModel,
    syncVideoDurationInPlace: syncVideoDurationInPlace,
    updateSelectedInput: updateSelectedInput,
    uploadSelectedInput: uploadSelectedInput,
  });
}
