import { getPersonReplacementCharacterBaseImageRef } from './personReplacementProject.js';
import { resolvePersonReplacementVoiceInput } from './personReplacementVoiceSeparationState.js';
import { PERSON_REPLACEMENT_EXPORT_MODES, exportPersonReplacementMedia } from './personReplacementExport.js';
import {
  exportPersonReplacementTimeline,
  isPersonReplacementTimelineMode,
  getPersonReplacementTimelineExportNotice,
} from './personReplacementTimelineExport.js';
import { PERSON_REPLACEMENT_CANVAS_SCOPES } from './personReplacementOutputCanvas.js';
import {
  PERSON_REPLACEMENT_OUTPUT_TRANSITIONS,
  transitionPersonReplacementOutput,
} from './personReplacementOutputLineage.js';
import { localPathToUrl, normalizeLocalPath, pickResultLocalPath } from '../../utils/localMediaPath.js';
import { saveWorkspaceImageDownload } from '../workspaceImageDownload.js';
import { saveWorkspaceVideoDownload } from '../workspaceVideoDownload.js';
import { createPersonReplacementTimelineExportPrompt } from './personReplacementTimelineExportPrompt.js';
const PERSON_REPLACEMENT_COMPOSE_TASK_PURPOSE = 'person-replacement-compose';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function cloneJson(item) {
  return item && typeof item === 'object' ? JSON['parse'](JSON['stringify'](item)) : item;
}
function createCoalescedAsyncAction(handler) {
  let key = null;
  return (...args) => {
    if (key) return key;
    return (
      (key = Promise['resolve']()
        ['then'](() => handler(...args))
        ['finally'](() => {
          key = null;
        })),
      key
    );
  };
}
function createKeyedCoalescedAsyncAction(handler2, index) {
  const map = new Map();
  return (...args2) => {
    const text = normalizeText(index?.(...args2)) || 'default',
      result = map['get'](text);
    if (result) return result;
    const data = Promise['resolve']()
      ['then'](() => handler2(...args2))
      ['finally'](() => {
        if (map['get'](text) === data) map['delete'](text);
      });
    return (map['set'](text, data), data);
  };
}
function resolveMediaRef(response) {
  if (typeof response === 'string') return normalizeText(response);
  return normalizeText(
    pickResultLocalPath(response) ||
      response?.['displayUrl'] ||
      response?.['videoUrl'] ||
      response?.['imageUrl'] ||
      response?.['url'] ||
      response?.['originalUrl'] ||
      response?.['path'],
  );
}
function resolveMediaUrl(options) {
  const mediaRef = resolveMediaRef(options);
  return mediaRef ? localPathToUrl(mediaRef) || mediaRef : '';
}
function resolveDirectOriginalTimelineRef(options2 = {}, target = []) {
  if ((Array['isArray'](target) ? target : [])['some']((source) => source?.['isReversed'] === !![]))
    return '';
  const list = Array['isArray'](options2['sources']) ? options2['sources'] : [],
    map2 = new Map(list['map']((next) => [normalizeText(next['id']), next])),
    current = list['length'] === 0x1 ? normalizeLocalPath(list[0x0]?.['videoRef']) : '',
    list2 = (Array['isArray'](target) ? target : [])['map']((entry) =>
      normalizeLocalPath(
        entry?.['sourceVideoRef'] || map2['get'](normalizeText(entry?.['sourceId']))?.['videoRef'] || current,
      ),
    );
  if (!list2['length'] || list2['some']((enabled) => !enabled)) return '';
  const list3 = [...new Set(list2)];
  return list3['length'] === 0x1 ? list3[0x0] : '';
}
function createWorkspacePresentationAdapter(record) {
  const run = (payload, args3) => {
    const handle = record?.();
    return handle?.[payload]?.(...args3);
  };
  return Object['freeze']({
    prewarmCompositeOriginalVideo(...args4) {
      return run('prewarmCompositeOriginalVideo', args4);
    },
    setComposeOutputState(...args5) {
      return run('setComposeOutputState', args5);
    },
    setExportOutputState(...args6) {
      return run('setExportOutputState', args6);
    },
    setOutputCanvasSyncState(...args7) {
      return run('setOutputCanvasSyncState', args7);
    },
  });
}
export function createPersonReplacementOutputCoordinator({
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
  projectSession: projectSession,
  getWorkspace: getWorkspace = () => null,
  prepareVideoReplacementShots: prepareVideoReplacementShots = async () => ({ ok: ![] }),
  createVoicePanel: createVoicePanel,
  enqueueMediaTask: enqueueMediaTask,
  playCompletion: playCompletion = () => {},
  showCompletionNotification: showCompletionNotification = () => {},
  saveMedia: saveMedia,
  saveMediaFiles: saveMediaFiles,
  createOutputCanvas: createOutputCanvas = null,
  onRequestClose: onRequestClose = () => {},
  showToast: showToast = () => {},
  exportMedia: exportMedia = exportPersonReplacementMedia,
  exportTimeline: exportTimeline = exportPersonReplacementTimeline,
  openJianying: openJianying,
  saveWorkspaceImage: saveWorkspaceImage = saveWorkspaceImageDownload,
  saveWorkspaceVideo: saveWorkspaceVideo = saveWorkspaceVideoDownload,
} = {}) {
  if (
    typeof projectSession?.['getProject'] !== 'function' ||
    typeof projectSession?.['replace'] !== 'function' ||
    typeof projectSession?.['subscribe'] !== 'function'
  )
    throw new TypeError('Replacement Studio Output Coordinator requires a project session');
  const personReplacementTimelineExportPrompt = createPersonReplacementTimelineExportPrompt({
    documentObject: documentObject,
    openJianying: openJianying,
  });
  let projectId = projectSession['getProject']();
  const state = projectSession['subscribe']((config) => {
      if (
        config['project']['id'] !== projectId['id'] ||
        config['project']['workspace']?.['view'] !== 'project'
      )
        personReplacementTimelineExportPrompt['close']();
      projectId = config['project'];
    }),
    workspacePresentationAdapter = createWorkspacePresentationAdapter(getWorkspace),
    pending = new Set(),
    handler3 = (
      scope,
      { persist: persist = !![], sync: sync = !![], renderWorkspace: renderWorkspace = !![] } = {},
    ) =>
      projectSession['replace'](scope, {
        persist: persist,
        presentation: !sync ? 'none' : renderWorkspace ? 'render' : 'state',
      });
  async function composeTimeline(src) {
    const data2 = await enqueueMediaTask(
        {
          kind: 'audioVoiceCompose',
          src: src['src'],
          args: {
            sourceKind: src['sourceKind'],
            outputKind: 'audio',
            durationSec: src['durationSec'],
            clips: src['clips'],
          },
        },
        { wait: !![], timeout: 0x927c0 },
      ),
      localPath = resolveMediaRef(data2);
    if (!data2?.['success'] || !localPath)
      throw new Error(data2?.['error'] || data2?.['message'] || '声音时间线合成失败');
    return { localPath: localPath, data: data2 };
  }
  function mountVoiceStudio(
    root,
    { sourceId: sourceId, onAudioPickStateChange: onAudioPickStateChange = null } = {},
  ) {
    const list4 = projectId['sources']['filter']((input) => input?.['videoRef']),
      enabled2 = list4['find']((output) => output['id'] === sourceId) || list4[0x0];
    if (!enabled2 || typeof createVoicePanel !== 'function')
      return (
        (root['innerHTML'] = '<div\x20class=\x22person-replacement-inline-empty\x22>请先导入可用视频</div>'),
        null
      );
    const map3 = new Map(),
      nodes = Object['fromEntries'](
        list4['map']((videoDuration) => {
          const id = 'person-replacement-voice-' + videoDuration['id'],
            value2 =
              projectId['shots']['find'](
                (value3) => value3?.['sourceId'] === videoDuration['id'] && value3?.['keyframeRef'],
              )?.['keyframeRef'] || '',
            value4 = videoDuration['thumbnailRef'] || value2,
            personReplacementVoiceInput = resolvePersonReplacementVoiceInput(projectId, videoDuration['id']),
            type = personReplacementVoiceInput['kind'] === 'clean-vocals',
            value5 = type ? personReplacementVoiceInput['mediaRef'] : videoDuration['videoRef'];
          return (
            map3['set'](id, videoDuration['id']),
            [
              id,
              {
                ...(projectId['audio']['voiceStudioState']?.[videoDuration['id']] || {}),
                id: id,
                type: type ? 'source-audio' : 'source-video',
                name: type ? videoDuration['fileName'] + ' · 清晰人声' : videoDuration['fileName'],
                fileName: type ? '清晰人声 · ' + videoDuration['fileName'] : videoDuration['fileName'],
                localPath: normalizeLocalPath(value5) || value5,
                originalLocalPath: normalizeLocalPath(value5) || value5,
                audioUrl: type ? personReplacementVoiceInput['audioUrl'] || resolveMediaUrl(value5) : '',
                videoUrl: resolveMediaUrl(videoDuration['videoRef']),
                imageUrl: resolveMediaUrl(value4),
                thumbUrl: resolveMediaUrl(value4),
                videoDuration: videoDuration['durationSec'] || 0x0,
              },
            ]
          );
        }),
      );
    let sourceNodeId = 'person-replacement-voice-' + enabled2['id'];
    const store = {
        getState: () => ({ nodes: nodes, selectedNodeIds: [sourceNodeId] }),
        updateNodeData: (value6, args8 = {}) => {
          const selectedSourceId = map3['get'](value6);
          if (!selectedSourceId || !nodes[value6]) return;
          ((nodes[value6] = { ...nodes[value6], ...args8 }),
            projectSession['replace'](
              {
                ...projectId,
                audio: {
                  ...projectId['audio'],
                  selectedSourceId: selectedSourceId,
                  voiceStudioState: {
                    ...projectId['audio']['voiceStudioState'],
                    [selectedSourceId]: nodes[value6],
                  },
                },
              },
              { presentation: 'none', reason: 'voice-studio-state' },
            ));
        },
        addNode() {},
        setSelectedNodes() {},
      },
      fabBtnEl = documentObject['createElement']('button');
    ((fabBtnEl['type'] = 'button'), (fabBtnEl['hidden'] = !![]), root['appendChild'](fabBtnEl));
    const projectId2 = projectId['id'],
      value7 = createVoicePanel({
        store: store,
        fabBtnEl: fabBtnEl,
        root: root,
        windowObject: windowObject,
        embedded: !![],
        showCompletionNotification: (args9) =>
          showCompletionNotification({
            ...args9,
            navigation: { source: 'replacement-studio', projectId: projectId2, step: 0x4 },
          }),
        composeTimeline: composeTimeline,
        onAudioPickStateChange: onAudioPickStateChange,
        resolveStartAnalyzeConfirmation: ({ sourceNodeId: sourceNodeId2 } = {}) => {
          const value8 = map3['get'](normalizeText(sourceNodeId2)) || enabled2['id'];
          if (resolvePersonReplacementVoiceInput(projectId, value8)['kind'] === 'clean-vocals') return null;
          return {
            title: '未提取清晰人声',
            message: '当前音频未提取清晰人声，是否开始分析？',
            cancelLabel: '否',
            confirmLabel: '跳过，开始分析',
          };
        },
        onComposeResult: (value9) => {
          const replacementAudioRef = resolveMediaRef(value9);
          if (!replacementAudioRef) return;
          (handler3(
            {
              ...projectId,
              audio: {
                ...projectId['audio'],
                replacementAudioRef: replacementAudioRef,
                composeStatus: 'succeeded',
              },
            },
            { renderWorkspace: ![] },
          ),
            showToast('声音时间线已合成并加入预览。', 'success'));
        },
      });
    return (
      value7?.['open']?.({ sourceNodeId: sourceNodeId }),
      {
        selectSource(value10) {
          const sourceId2 = normalizeText(value10),
            value11 = 'person-replacement-voice-' + sourceId2;
          if (!map3['has'](value11)) return { selected: ![], reason: 'invalid-source', sourceId: sourceId2 };
          return (
            (sourceNodeId = value11),
            value7?.['open']?.({ sourceNodeId: sourceNodeId, skipSubscriptionGate: !![] }),
            { selected: !![], reason: '', sourceId: sourceId2 }
          );
        },
        canSelectVoiceAsset({ segmentId: segmentId = '' } = {}) {
          return value7?.['canSelectAudioReference']?.({ segmentId: segmentId }) === !![];
        },
        selectVoiceAsset(value12, { segmentId: segmentId = '' } = {}) {
          const name = projectId['characters']['find']((value13) => value13['id'] === normalizeText(value12)),
            fileName = name?.['voiceReference'] || {},
            localPath2 = normalizeLocalPath(fileName['localPath'] || name?.['voiceRef']),
            audioUrl = resolveMediaUrl(localPath2 || fileName['audioUrl'] || name?.['voiceRef']);
          if (!name || !audioUrl) return { applied: ![], reason: 'invalid', appliedIds: [] };
          return (
            value7?.['selectAudioReference']?.(
              {
                id: 'person-replacement-character-voice-' + name['id'],
                type: 'source-audio',
                name: name['name'],
                fileName: fileName['fileName'] || name['name'] + '音频',
                localPath: localPath2,
                audioUrl: audioUrl,
                imageUrl: resolveMediaUrl(getPersonReplacementCharacterBaseImageRef(name)),
              },
              { segmentId: segmentId },
            ) || { applied: ![], reason: 'unsupported', appliedIds: [] }
          );
        },
        destroy() {
          value7?.['destroy']?.();
        },
      }
    );
  }
  async function run2() {
    let list5 = [...projectId['shots']];
    const enabled3 = list5['some']((value14) => normalizeLocalPath(value14['resultVideoRef']));
    if (!enabled3) return (showToast('请先生成至少一个替换视频片段。', 'warn'), null);
    try {
      let path = resolveDirectOriginalTimelineRef(projectId, list5);
      (workspacePresentationAdapter?.['prewarmCompositeOriginalVideo']?.(path),
        workspacePresentationAdapter?.['setComposeOutputState']?.({ pending: !![] }));
      const shotIds = list5['filter'](
        (value15) =>
          !normalizeLocalPath(value15['videoRef']) &&
          (!normalizeLocalPath(value15['resultVideoRef']) || !path),
      )
        ['map']((value16) => normalizeText(value16['id']))
        ['filter'](Boolean);
      if (shotIds['length']) {
        const response2 = await prepareVideoReplacementShots({ shotIds: shotIds, notify: ![] });
        if (!response2?.['ok']) throw new Error('部分原视频片段尚未准备完成');
        const map4 = new Map(projectId['shots']['map']((value17) => [normalizeText(value17['id']), value17]));
        ((list5 = list5['map']((value18) => map4['get'](normalizeText(value18['id'])) || value18)),
          (path = resolveDirectOriginalTimelineRef(projectId, list5)),
          workspacePresentationAdapter?.['prewarmCompositeOriginalVideo']?.(path));
      }
      const composedShotIds = list5['map']((value19) => normalizeText(value19['id'])),
        list6 = list5['map']((value20) => normalizeLocalPath(value20['videoRef']));
      if (!path && list6['some']((enabled4) => !enabled4)) throw new Error('合成所需的原视频片段不完整');
      const list7 = list5['map'](
        (value21, value22) => normalizeLocalPath(value21['resultVideoRef']) || list6[value22],
      );
      if (list7['some']((enabled5) => !enabled5)) throw new Error('合成所需的替换视频片段不完整');
      const run3 = (path2, { includeAudio: includeAudio = !![] } = {}) =>
          path2['length'] === 0x1 && includeAudio
            ? Promise['resolve']({ success: !![], path: path2[0x0] })
            : enqueueMediaTask(
                {
                  kind: 'videoCompose',
                  purpose: PERSON_REPLACEMENT_COMPOSE_TASK_PURPOSE,
                  srcs: path2,
                  args: { includeAudio: includeAudio },
                },
                { wait: !![], timeout: 0x927c0 },
              ),
        [value23, value24] = await Promise['all']([
          run3(list7, { includeAudio: ![] }),
          path ? Promise['resolve']({ success: !![], path: path }) : run3(list6),
        ]),
        visualMasterRef = resolveMediaRef(value23),
        originalMasterRef = resolveMediaRef(value24);
      if (!visualMasterRef) throw new Error('合成结果缺少可用视频');
      if (!originalMasterRef) throw new Error('原视频对照合成结果不可用');
      const project = handler3(
        transitionPersonReplacementOutput(projectId, {
          type: PERSON_REPLACEMENT_OUTPUT_TRANSITIONS['COMPOSITION_SUCCEEDED'],
          originalMasterRef: originalMasterRef,
          visualMasterRef: visualMasterRef,
          composedShotIds: composedShotIds,
        }),
      );
      return (
        void Promise['allSettled']([
          Promise['resolve']()['then'](() => playCompletion?.('person-replacement-video-compose')),
          Promise['resolve']()['then'](() =>
            showCompletionNotification?.({
              body: '人物替换视频合成完成。',
              navigation: { source: 'replacement-studio', projectId: projectId['id'], step: 0x5 },
            }),
          ),
        ])['then']((list8) => {
          list8['forEach']((response3) => {
            if (response3['status'] !== 'rejected') return;
            console['warn']('[replacementStudio] completion feedback failed', response3['reason']);
          });
        }),
        { project: project }
      );
    } catch (error) {
      return (showToast(error?.['message'] || '视频合成失败', 'error'), null);
    } finally {
      workspacePresentationAdapter?.['setComposeOutputState']?.({ pending: ![] });
    }
  }
  async function downloadImage(imageRef = {}) {
    try {
      const error2 = await saveWorkspaceImage({
        imageRef: imageRef['imageRef'],
        filenameBase: imageRef['filenameBase'],
        title: imageRef['title'],
        saveMedia: saveMedia,
      });
      if (error2?.['canceled']) return ![];
      if (error2?.['success'] === ![])
        throw new Error(error2?.['error'] || error2?.['message'] || '图片下载失败');
      return (showToast('图片已保存。', 'success'), error2);
    } catch (error3) {
      return (showToast(error3?.['message'] || '图片下载失败，请稍后重试。', 'error'), ![]);
    }
  }
  async function downloadVideo(videoRef = {}) {
    try {
      const error4 = await saveWorkspaceVideo({
        videoRef: videoRef['videoRef'],
        filenameBase: videoRef['filenameBase'],
        title: videoRef['title'],
        saveMedia: saveMedia,
      });
      if (error4?.['canceled']) return ![];
      if (error4?.['success'] === ![])
        throw new Error(error4?.['error'] || error4?.['message'] || '视频下载失败');
      return (showToast('视频已保存。', 'success'), error4);
    } catch (error5) {
      return (showToast(error5?.['message'] || '视频下载失败，请稍后重试。', 'error'), ![]);
    }
  }
  async function run4(options3 = {}) {
    const value25 = options3?.['project'] || projectId,
      mode = normalizeText(options3?.['mode']) || PERSON_REPLACEMENT_EXPORT_MODES['CURRENT_CLIP'];
    if (
      !isPersonReplacementTimelineMode(mode) &&
      (typeof saveMedia !== 'function' || typeof saveMediaFiles !== 'function')
    )
      return (showToast('当前环境无法导出素材。', 'error'), ![]);
    workspacePresentationAdapter?.['setExportOutputState']?.({ pending: !![] });
    try {
      if (isPersonReplacementTimelineMode(mode)) {
        let response4 = await exportTimeline({ project: cloneJson(value25), mode: mode });
        if (response4?.['canceled']) return ![];
        if (!response4?.['success']) throw new Error(response4?.['error'] || '剪辑工程导出失败');
        !enabled6 &&
          projectId['id'] === value25['id'] &&
          mode === 'jianying-draft' &&
          response4['autoDetected'] &&
          (response4 = await personReplacementTimelineExportPrompt['show'](response4, value25['title']));
        if (!enabled6) {
          const error6 = getPersonReplacementTimelineExportNotice(mode, response4);
          showToast(error6['message'], error6['type']);
        }
        return response4;
      }
      let project2 = value25;
      if (mode === PERSON_REPLACEMENT_EXPORT_MODES['FINAL_VIDEO']) {
        const src2 = normalizeLocalPath(value25['output']?.['visualMasterRef']);
        if (!src2) throw new Error('请先合成完整视频画面。');
        const finalAudioTrack = value25['audio']?.['exportTrack'] === 'original' ? 'original' : 'replacement',
          audioSrc = normalizeLocalPath(
            finalAudioTrack === 'original'
              ? value25['audio']?.['originalAudioRef'] || value25['output']?.['originalMasterRef']
              : value25['audio']?.['replacementAudioRef'],
          );
        if (!audioSrc)
          throw new Error(
            finalAudioTrack === 'original' ? '原视频音轨不可用。' : '请先在声音克隆页面合成替换音轨。',
          );
        const error7 = await enqueueMediaTask(
            {
              kind: 'videoAudioMux',
              purpose: PERSON_REPLACEMENT_COMPOSE_TASK_PURPOSE,
              src: src2,
              args: { audioSrc: audioSrc },
            },
            { wait: !![], timeout: 0x927c0 },
          ),
          finalVideoRef = resolveMediaRef(error7);
        if (!error7?.['success'] || !finalVideoRef)
          throw new Error(error7?.['error'] || error7?.['message'] || '完整视频封装失败。');
        project2 = handler3(
          transitionPersonReplacementOutput(projectId, {
            type: PERSON_REPLACEMENT_OUTPUT_TRANSITIONS['FINAL_MUX_SUCCEEDED'],
            finalVideoRef: finalVideoRef,
            finalAudioTrack: finalAudioTrack,
          }),
        );
      }
      const error8 = await exportMedia({
        project: project2,
        mode: mode,
        saveMedia: saveMedia,
        saveMediaFiles: saveMediaFiles,
      });
      if (error8?.['canceled']) return ![];
      if (error8?.['success'] === ![])
        throw new Error(error8?.['error'] || error8?.['message'] || '素材导出失败');
      const value26 = Math['max'](0x0, Number(error8?.['exportedCount']) || 0x0),
        value27 = Math['max'](0x0, Number(error8?.['skippedCount']) || 0x0);
      return (
        showToast(
          mode === PERSON_REPLACEMENT_EXPORT_MODES['FINAL_VIDEO']
            ? '完整视频已导出。'
            : mode === PERSON_REPLACEMENT_EXPORT_MODES['CURRENT_CLIP']
              ? '当前片段已导出。'
              : value27
                ? '已导出 ' + value26 + ' 个素材，跳过 ' + value27 + '\x20个缺失项。'
                : '已导出 ' + value26 + ' 个素材。',
          'success',
        ),
        error8
      );
    } catch (error9) {
      if (!enabled6) showToast(error9?.['message'] || '素材导出失败', 'error');
      return ![];
    } finally {
      if (!enabled6) workspacePresentationAdapter?.['setExportOutputState']?.({ pending: ![] });
    }
  }
  async function run5(options4 = {}) {
    const value28 = options4?.['project'] || projectId,
      scope2 =
        normalizeText(options4?.['scope']) === PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT']
          ? PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT']
          : PERSON_REPLACEMENT_CANVAS_SCOPES['CLIPS'],
      value29 = Math['max'](
        0x1,
        Math['min'](0x5, Math['trunc'](Number(value28['workspace']?.['step']) || 0x1)),
      ),
      value30 = ['', '素材设定', '图像替换', '视频替换', '声音克隆', '替换片段'][value29];
    if (typeof createOutputCanvas !== 'function') return (showToast('当前环境无法加入画布。', 'error'), ![]);
    (pending['add'](scope2),
      workspacePresentationAdapter?.['setOutputCanvasSyncState']?.({ pending: !![], scope: scope2 }));
    try {
      const args10 = await createOutputCanvas({ project: cloneJson(value28), scope: scope2 }),
        args11 = args10?.['binding']?.['nodes'];
      if (
        !normalizeText(args10?.['canvasId']) ||
        !args11 ||
        typeof args11 !== 'object' ||
        Array['isArray'](args11) ||
        !Object['keys'](args11)['length']
      )
        throw new Error('加入画布后未返回有效的项目节点');
      if (normalizeText(projectId['id']) !== normalizeText(value28['id'])) return args10;
      return (
        handler3({
          ...projectId,
          output: {
            ...projectId['output'],
            canvasBinding: {
              ...args10['binding'],
              canvasId: normalizeText(args10['binding']['canvasId'] || args10['canvasId']),
              nodes: { ...args11 },
            },
          },
        }),
        onRequestClose(),
        showToast(
          scope2 === PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT']
            ? args10['reused']
              ? '已更新画布中的整个人物替换项目。'
              : '已同步整个人物替换项目到画布。'
            : args10['reused']
              ? '已更新画布中的' + value30 + '内容。'
              : '已同步' + value30 + '到画布。',
          'success',
        ),
        args10
      );
    } catch (error10) {
      return (showToast(error10?.['message'] || '人物替换项目加入画布失败', 'error'), ![]);
    } finally {
      (pending['delete'](scope2),
        workspacePresentationAdapter?.['setOutputCanvasSyncState']?.({
          pending: pending['size'] > 0x0,
          scope: [...pending][0x0] || '',
        }));
    }
  }
  const composeOutput = createCoalescedAsyncAction(run2),
    exportOutput = createCoalescedAsyncAction(run4),
    addOutputToCanvas = createKeyedCoalescedAsyncAction(run5, (value31) => value31?.['scope']);
  let enabled6 = ![];
  return Object['freeze']({
    mountVoiceStudio: mountVoiceStudio,
    composeOutput: composeOutput,
    downloadImage: downloadImage,
    downloadVideo: downloadVideo,
    exportOutput: exportOutput,
    addOutputToCanvas: addOutputToCanvas,
    destroy() {
      if (enabled6) return;
      ((enabled6 = !![]), personReplacementTimelineExportPrompt['destroy'](), state?.());
    },
  });
}
