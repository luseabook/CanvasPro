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
function normalizeText(_0x5004f9) {
  return String(_0x5004f9 ?? '')['trim']();
}
function cloneJson(_0x2c23f9) {
  return _0x2c23f9 && typeof _0x2c23f9 === 'object' ? JSON['parse'](JSON['stringify'](_0x2c23f9)) : _0x2c23f9;
}
function createCoalescedAsyncAction(_0x542897) {
  let _0x4ad3f7 = null;
  return (..._0x59f4f0) => {
    if (_0x4ad3f7) return _0x4ad3f7;
    return (
      (_0x4ad3f7 = Promise['resolve']()
        ['then'](() => _0x542897(..._0x59f4f0))
        ['finally'](() => {
          _0x4ad3f7 = null;
        })),
      _0x4ad3f7
    );
  };
}
function createKeyedCoalescedAsyncAction(_0x2b2bed, _0x2b77f6) {
  const _0xfabdfc = new Map();
  return (..._0x357128) => {
    const _0x2b3075 = normalizeText(_0x2b77f6?.(..._0x357128)) || 'default',
      _0x19781d = _0xfabdfc['get'](_0x2b3075);
    if (_0x19781d) return _0x19781d;
    const _0xd7d98c = Promise['resolve']()
      ['then'](() => _0x2b2bed(..._0x357128))
      ['finally'](() => {
        if (_0xfabdfc['get'](_0x2b3075) === _0xd7d98c) _0xfabdfc['delete'](_0x2b3075);
      });
    return (_0xfabdfc['set'](_0x2b3075, _0xd7d98c), _0xd7d98c);
  };
}
function resolveMediaRef(_0x165afa) {
  if (typeof _0x165afa === 'string') return normalizeText(_0x165afa);
  return normalizeText(
    pickResultLocalPath(_0x165afa) ||
      _0x165afa?.['displayUrl'] ||
      _0x165afa?.['videoUrl'] ||
      _0x165afa?.['imageUrl'] ||
      _0x165afa?.['url'] ||
      _0x165afa?.['originalUrl'] ||
      _0x165afa?.['path'],
  );
}
function resolveMediaUrl(_0x2d65a9) {
  const _0x4354e8 = resolveMediaRef(_0x2d65a9);
  return _0x4354e8 ? localPathToUrl(_0x4354e8) || _0x4354e8 : '';
}
function resolveDirectOriginalTimelineRef(_0x416120 = {}, _0x495510 = []) {
  if (
    (Array['isArray'](_0x495510) ? _0x495510 : [])['some']((_0x4ed9b1) => _0x4ed9b1?.['isReversed'] === !![])
  )
    return '';
  const _0x366bf4 = Array['isArray'](_0x416120['sources']) ? _0x416120['sources'] : [],
    _0x3ac0ef = new Map(_0x366bf4['map']((_0x3bc50f) => [normalizeText(_0x3bc50f['id']), _0x3bc50f])),
    _0x1e88fb = _0x366bf4['length'] === 0x1 ? normalizeLocalPath(_0x366bf4[0x0]?.['videoRef']) : '',
    _0x1dd8a6 = (Array['isArray'](_0x495510) ? _0x495510 : [])['map']((_0x14d0fd) =>
      normalizeLocalPath(
        _0x14d0fd?.['sourceVideoRef'] ||
          _0x3ac0ef['get'](normalizeText(_0x14d0fd?.['sourceId']))?.['videoRef'] ||
          _0x1e88fb,
      ),
    );
  if (!_0x1dd8a6['length'] || _0x1dd8a6['some']((_0x42b3eb) => !_0x42b3eb)) return '';
  const _0x153dcb = [...new Set(_0x1dd8a6)];
  return _0x153dcb['length'] === 0x1 ? _0x153dcb[0x0] : '';
}
function createWorkspacePresentationAdapter(_0x4a396d) {
  const _0x36a7f2 = (_0x405ce8, _0xd0b96e) => {
    const _0x2f55c9 = _0x4a396d?.();
    return _0x2f55c9?.[_0x405ce8]?.(..._0xd0b96e);
  };
  return Object['freeze']({
    prewarmCompositeOriginalVideo(..._0x5f8e9e) {
      return _0x36a7f2('prewarmCompositeOriginalVideo', _0x5f8e9e);
    },
    setComposeOutputState(..._0x4a2bad) {
      return _0x36a7f2('setComposeOutputState', _0x4a2bad);
    },
    setExportOutputState(..._0x1332f5) {
      return _0x36a7f2('setExportOutputState', _0x1332f5);
    },
    setOutputCanvasSyncState(..._0x79f5f) {
      return _0x36a7f2('setOutputCanvasSyncState', _0x79f5f);
    },
  });
}
export function createPersonReplacementOutputCoordinator({
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
  projectSession: _0x3d1eec,
  getWorkspace: getWorkspace = () => null,
  prepareVideoReplacementShots: prepareVideoReplacementShots = async () => ({ ok: ![] }),
  createVoicePanel: _0x47e6dc,
  enqueueMediaTask: _0x5c04c7,
  playCompletion: playCompletion = () => {},
  showCompletionNotification: showCompletionNotification = () => {},
  saveMedia: _0x100468,
  saveMediaFiles: _0x215b3a,
  createOutputCanvas: createOutputCanvas = null,
  onRequestClose: onRequestClose = () => {},
  showToast: showToast = () => {},
  exportMedia: exportMedia = exportPersonReplacementMedia,
  exportTimeline: exportTimeline = exportPersonReplacementTimeline,
  openJianying: _0x1de563,
  saveWorkspaceImage: saveWorkspaceImage = saveWorkspaceImageDownload,
  saveWorkspaceVideo: saveWorkspaceVideo = saveWorkspaceVideoDownload,
} = {}) {
  if (
    typeof _0x3d1eec?.['getProject'] !== 'function' ||
    typeof _0x3d1eec?.['replace'] !== 'function' ||
    typeof _0x3d1eec?.['subscribe'] !== 'function'
  )
    throw new TypeError('Replacement Studio Output Coordinator requires a project session');
  const _0x96064 = createPersonReplacementTimelineExportPrompt({
    documentObject: documentObject,
    openJianying: _0x1de563,
  });
  let _0x256fb7 = _0x3d1eec['getProject']();
  const _0x2c81f1 = _0x3d1eec['subscribe']((_0x46fe73) => {
      if (
        _0x46fe73['project']['id'] !== _0x256fb7['id'] ||
        _0x46fe73['project']['workspace']?.['view'] !== 'project'
      )
        _0x96064['close']();
      _0x256fb7 = _0x46fe73['project'];
    }),
    _0x56a182 = createWorkspacePresentationAdapter(getWorkspace),
    _0x2d045a = new Set(),
    _0x2a1c6c = (
      _0x4981d2,
      { persist: persist = !![], sync: sync = !![], renderWorkspace: renderWorkspace = !![] } = {},
    ) =>
      _0x3d1eec['replace'](_0x4981d2, {
        persist: persist,
        presentation: !sync ? 'none' : renderWorkspace ? 'render' : 'state',
      });
  async function _0x4e77d8(_0x2f0753) {
    const _0x4e59ed = await _0x5c04c7(
        {
          kind: 'audioVoiceCompose',
          src: _0x2f0753['src'],
          args: {
            sourceKind: _0x2f0753['sourceKind'],
            outputKind: 'audio',
            durationSec: _0x2f0753['durationSec'],
            clips: _0x2f0753['clips'],
          },
        },
        { wait: !![], timeout: 0x927c0 },
      ),
      _0x5e1874 = resolveMediaRef(_0x4e59ed);
    if (!_0x4e59ed?.['success'] || !_0x5e1874)
      throw new Error(_0x4e59ed?.['error'] || _0x4e59ed?.['message'] || '声音时间线合成失败');
    return { localPath: _0x5e1874, data: _0x4e59ed };
  }
  function _0x42ee68(
    _0x2cc208,
    { sourceId: _0xafca6b, onAudioPickStateChange: onAudioPickStateChange = null } = {},
  ) {
    const _0x1bcee2 = _0x256fb7['sources']['filter']((_0x2353ea) => _0x2353ea?.['videoRef']),
      _0x3d4132 = _0x1bcee2['find']((_0x5ce860) => _0x5ce860['id'] === _0xafca6b) || _0x1bcee2[0x0];
    if (!_0x3d4132 || typeof _0x47e6dc !== 'function')
      return (
        (_0x2cc208['innerHTML'] =
          '<div\x20class=\x22person-replacement-inline-empty\x22>请先导入可用视频</div>'),
        null
      );
    const _0x5586d6 = new Map(),
      _0x3ed1e4 = Object['fromEntries'](
        _0x1bcee2['map']((_0x2cf1ff) => {
          const _0x3fbac8 = 'person-replacement-voice-' + _0x2cf1ff['id'],
            _0x459837 =
              _0x256fb7['shots']['find'](
                (_0x22fd2d) => _0x22fd2d?.['sourceId'] === _0x2cf1ff['id'] && _0x22fd2d?.['keyframeRef'],
              )?.['keyframeRef'] || '',
            _0x842156 = _0x2cf1ff['thumbnailRef'] || _0x459837,
            _0x468496 = resolvePersonReplacementVoiceInput(_0x256fb7, _0x2cf1ff['id']),
            _0x2d8632 = _0x468496['kind'] === 'clean-vocals',
            _0x258db3 = _0x2d8632 ? _0x468496['mediaRef'] : _0x2cf1ff['videoRef'];
          return (
            _0x5586d6['set'](_0x3fbac8, _0x2cf1ff['id']),
            [
              _0x3fbac8,
              {
                ...(_0x256fb7['audio']['voiceStudioState']?.[_0x2cf1ff['id']] || {}),
                id: _0x3fbac8,
                type: _0x2d8632 ? 'source-audio' : 'source-video',
                name: _0x2d8632 ? _0x2cf1ff['fileName'] + ' · 清晰人声' : _0x2cf1ff['fileName'],
                fileName: _0x2d8632 ? '清晰人声 · ' + _0x2cf1ff['fileName'] : _0x2cf1ff['fileName'],
                localPath: normalizeLocalPath(_0x258db3) || _0x258db3,
                originalLocalPath: normalizeLocalPath(_0x258db3) || _0x258db3,
                audioUrl: _0x2d8632 ? _0x468496['audioUrl'] || resolveMediaUrl(_0x258db3) : '',
                videoUrl: resolveMediaUrl(_0x2cf1ff['videoRef']),
                imageUrl: resolveMediaUrl(_0x842156),
                thumbUrl: resolveMediaUrl(_0x842156),
                videoDuration: _0x2cf1ff['durationSec'] || 0x0,
              },
            ]
          );
        }),
      );
    let _0x49edc3 = 'person-replacement-voice-' + _0x3d4132['id'];
    const _0x5e19e6 = {
        getState: () => ({ nodes: _0x3ed1e4, selectedNodeIds: [_0x49edc3] }),
        updateNodeData: (_0x5bfde2, _0x2ab2a3 = {}) => {
          const _0x36e0f1 = _0x5586d6['get'](_0x5bfde2);
          if (!_0x36e0f1 || !_0x3ed1e4[_0x5bfde2]) return;
          ((_0x3ed1e4[_0x5bfde2] = { ..._0x3ed1e4[_0x5bfde2], ..._0x2ab2a3 }),
            _0x3d1eec['replace'](
              {
                ..._0x256fb7,
                audio: {
                  ..._0x256fb7['audio'],
                  selectedSourceId: _0x36e0f1,
                  voiceStudioState: {
                    ..._0x256fb7['audio']['voiceStudioState'],
                    [_0x36e0f1]: _0x3ed1e4[_0x5bfde2],
                  },
                },
              },
              { presentation: 'none', reason: 'voice-studio-state' },
            ));
        },
        addNode() {},
        setSelectedNodes() {},
      },
      _0xa37312 = documentObject['createElement']('button');
    ((_0xa37312['type'] = 'button'), (_0xa37312['hidden'] = !![]), _0x2cc208['appendChild'](_0xa37312));
    const _0x274133 = _0x256fb7['id'],
      _0x31f3d3 = _0x47e6dc({
        store: _0x5e19e6,
        fabBtnEl: _0xa37312,
        root: _0x2cc208,
        windowObject: windowObject,
        embedded: !![],
        showCompletionNotification: (_0x4903e3) =>
          showCompletionNotification({
            ..._0x4903e3,
            navigation: { source: 'replacement-studio', projectId: _0x274133, step: 0x4 },
          }),
        composeTimeline: _0x4e77d8,
        onAudioPickStateChange: onAudioPickStateChange,
        resolveStartAnalyzeConfirmation: ({ sourceNodeId: _0x2859f5 } = {}) => {
          const _0x148618 = _0x5586d6['get'](normalizeText(_0x2859f5)) || _0x3d4132['id'];
          if (resolvePersonReplacementVoiceInput(_0x256fb7, _0x148618)['kind'] === 'clean-vocals')
            return null;
          return {
            title: '未提取清晰人声',
            message: '当前音频未提取清晰人声，是否开始分析？',
            cancelLabel: '否',
            confirmLabel: '跳过，开始分析',
          };
        },
        onComposeResult: (_0x301d42) => {
          const _0xd008c9 = resolveMediaRef(_0x301d42);
          if (!_0xd008c9) return;
          (_0x2a1c6c(
            {
              ..._0x256fb7,
              audio: { ..._0x256fb7['audio'], replacementAudioRef: _0xd008c9, composeStatus: 'succeeded' },
            },
            { renderWorkspace: ![] },
          ),
            showToast('声音时间线已合成并加入预览。', 'success'));
        },
      });
    return (
      _0x31f3d3?.['open']?.({ sourceNodeId: _0x49edc3 }),
      {
        selectSource(_0x364128) {
          const _0x218e6 = normalizeText(_0x364128),
            _0x414f20 = 'person-replacement-voice-' + _0x218e6;
          if (!_0x5586d6['has'](_0x414f20))
            return { selected: ![], reason: 'invalid-source', sourceId: _0x218e6 };
          return (
            (_0x49edc3 = _0x414f20),
            _0x31f3d3?.['open']?.({ sourceNodeId: _0x49edc3, skipSubscriptionGate: !![] }),
            { selected: !![], reason: '', sourceId: _0x218e6 }
          );
        },
        canSelectVoiceAsset({ segmentId: segmentId = '' } = {}) {
          return _0x31f3d3?.['canSelectAudioReference']?.({ segmentId: segmentId }) === !![];
        },
        selectVoiceAsset(_0x1d52b0, { segmentId: segmentId = '' } = {}) {
          const _0x11d463 = _0x256fb7['characters']['find'](
              (_0x26024a) => _0x26024a['id'] === normalizeText(_0x1d52b0),
            ),
            _0x5af688 = _0x11d463?.['voiceReference'] || {},
            _0x46d8f6 = normalizeLocalPath(_0x5af688['localPath'] || _0x11d463?.['voiceRef']),
            _0x390051 = resolveMediaUrl(_0x46d8f6 || _0x5af688['audioUrl'] || _0x11d463?.['voiceRef']);
          if (!_0x11d463 || !_0x390051) return { applied: ![], reason: 'invalid', appliedIds: [] };
          return (
            _0x31f3d3?.['selectAudioReference']?.(
              {
                id: 'person-replacement-character-voice-' + _0x11d463['id'],
                type: 'source-audio',
                name: _0x11d463['name'],
                fileName: _0x5af688['fileName'] || _0x11d463['name'] + '音频',
                localPath: _0x46d8f6,
                audioUrl: _0x390051,
                imageUrl: resolveMediaUrl(getPersonReplacementCharacterBaseImageRef(_0x11d463)),
              },
              { segmentId: segmentId },
            ) || { applied: ![], reason: 'unsupported', appliedIds: [] }
          );
        },
        destroy() {
          _0x31f3d3?.['destroy']?.();
        },
      }
    );
  }
  async function _0x3db929() {
    let _0x513625 = [..._0x256fb7['shots']];
    const _0x45dc79 = _0x513625['some']((_0x5ce45e) => normalizeLocalPath(_0x5ce45e['resultVideoRef']));
    if (!_0x45dc79) return (showToast('请先生成至少一个替换视频片段。', 'warn'), null);
    try {
      let _0x438b70 = resolveDirectOriginalTimelineRef(_0x256fb7, _0x513625);
      (_0x56a182?.['prewarmCompositeOriginalVideo']?.(_0x438b70),
        _0x56a182?.['setComposeOutputState']?.({ pending: !![] }));
      const _0x63a64d = _0x513625['filter'](
        (_0x494524) =>
          !normalizeLocalPath(_0x494524['videoRef']) &&
          (!normalizeLocalPath(_0x494524['resultVideoRef']) || !_0x438b70),
      )
        ['map']((_0x5e9e02) => normalizeText(_0x5e9e02['id']))
        ['filter'](Boolean);
      if (_0x63a64d['length']) {
        const _0x28372f = await prepareVideoReplacementShots({ shotIds: _0x63a64d, notify: ![] });
        if (!_0x28372f?.['ok']) throw new Error('部分原视频片段尚未准备完成');
        const _0x1bde4c = new Map(
          _0x256fb7['shots']['map']((_0x2fd848) => [normalizeText(_0x2fd848['id']), _0x2fd848]),
        );
        ((_0x513625 = _0x513625['map'](
          (_0x3a34d1) => _0x1bde4c['get'](normalizeText(_0x3a34d1['id'])) || _0x3a34d1,
        )),
          (_0x438b70 = resolveDirectOriginalTimelineRef(_0x256fb7, _0x513625)),
          _0x56a182?.['prewarmCompositeOriginalVideo']?.(_0x438b70));
      }
      const _0x107899 = _0x513625['map']((_0x26323f) => normalizeText(_0x26323f['id'])),
        _0x43b77 = _0x513625['map']((_0x40246d) => normalizeLocalPath(_0x40246d['videoRef']));
      if (!_0x438b70 && _0x43b77['some']((_0x38ea33) => !_0x38ea33))
        throw new Error('合成所需的原视频片段不完整');
      const _0x535bd5 = _0x513625['map'](
        (_0x462fa1, _0x27b309) => normalizeLocalPath(_0x462fa1['resultVideoRef']) || _0x43b77[_0x27b309],
      );
      if (_0x535bd5['some']((_0x3c1c8b) => !_0x3c1c8b)) throw new Error('合成所需的替换视频片段不完整');
      const _0x488e27 = (_0x38ec74, { includeAudio: includeAudio = !![] } = {}) =>
          _0x38ec74['length'] === 0x1 && includeAudio
            ? Promise['resolve']({ success: !![], path: _0x38ec74[0x0] })
            : _0x5c04c7(
                {
                  kind: 'videoCompose',
                  purpose: PERSON_REPLACEMENT_COMPOSE_TASK_PURPOSE,
                  srcs: _0x38ec74,
                  args: { includeAudio: includeAudio },
                },
                { wait: !![], timeout: 0x927c0 },
              ),
        [_0x5d2fe6, _0x5998dc] = await Promise['all']([
          _0x488e27(_0x535bd5, { includeAudio: ![] }),
          _0x438b70 ? Promise['resolve']({ success: !![], path: _0x438b70 }) : _0x488e27(_0x43b77),
        ]),
        _0x4ffccb = resolveMediaRef(_0x5d2fe6),
        _0x43afcd = resolveMediaRef(_0x5998dc);
      if (!_0x4ffccb) throw new Error('合成结果缺少可用视频');
      if (!_0x43afcd) throw new Error('原视频对照合成结果不可用');
      const _0x35e1e8 = _0x2a1c6c(
        transitionPersonReplacementOutput(_0x256fb7, {
          type: PERSON_REPLACEMENT_OUTPUT_TRANSITIONS['COMPOSITION_SUCCEEDED'],
          originalMasterRef: _0x43afcd,
          visualMasterRef: _0x4ffccb,
          composedShotIds: _0x107899,
        }),
      );
      return (
        void Promise['allSettled']([
          Promise['resolve']()['then'](() => playCompletion?.('person-replacement-video-compose')),
          Promise['resolve']()['then'](() =>
            showCompletionNotification?.({
              body: '人物替换视频合成完成。',
              navigation: { source: 'replacement-studio', projectId: _0x256fb7['id'], step: 0x5 },
            }),
          ),
        ])['then']((_0x220edf) => {
          _0x220edf['forEach']((_0x489f47) => {
            if (_0x489f47['status'] !== 'rejected') return;
            console['warn']('[replacementStudio] completion feedback failed', _0x489f47['reason']);
          });
        }),
        { project: _0x35e1e8 }
      );
    } catch (_0x59b7af) {
      return (showToast(_0x59b7af?.['message'] || '视频合成失败', 'error'), null);
    } finally {
      _0x56a182?.['setComposeOutputState']?.({ pending: ![] });
    }
  }
  async function _0x24828c(_0x5957ab = {}) {
    try {
      const _0x282b3d = await saveWorkspaceImage({
        imageRef: _0x5957ab['imageRef'],
        filenameBase: _0x5957ab['filenameBase'],
        title: _0x5957ab['title'],
        saveMedia: _0x100468,
      });
      if (_0x282b3d?.['canceled']) return ![];
      if (_0x282b3d?.['success'] === ![])
        throw new Error(_0x282b3d?.['error'] || _0x282b3d?.['message'] || '图片下载失败');
      return (showToast('图片已保存。', 'success'), _0x282b3d);
    } catch (_0x9aa150) {
      return (showToast(_0x9aa150?.['message'] || '图片下载失败，请稍后重试。', 'error'), ![]);
    }
  }
  async function _0x5bbc17(_0x1117ba = {}) {
    try {
      const _0x596327 = await saveWorkspaceVideo({
        videoRef: _0x1117ba['videoRef'],
        filenameBase: _0x1117ba['filenameBase'],
        title: _0x1117ba['title'],
        saveMedia: _0x100468,
      });
      if (_0x596327?.['canceled']) return ![];
      if (_0x596327?.['success'] === ![])
        throw new Error(_0x596327?.['error'] || _0x596327?.['message'] || '视频下载失败');
      return (showToast('视频已保存。', 'success'), _0x596327);
    } catch (_0x212bcf) {
      return (showToast(_0x212bcf?.['message'] || '视频下载失败，请稍后重试。', 'error'), ![]);
    }
  }
  async function _0x409932(_0x2633cb = {}) {
    const _0x2786bf = _0x2633cb?.['project'] || _0x256fb7,
      _0x4e9281 = normalizeText(_0x2633cb?.['mode']) || PERSON_REPLACEMENT_EXPORT_MODES['CURRENT_CLIP'];
    if (
      !isPersonReplacementTimelineMode(_0x4e9281) &&
      (typeof _0x100468 !== 'function' || typeof _0x215b3a !== 'function')
    )
      return (showToast('当前环境无法导出素材。', 'error'), ![]);
    _0x56a182?.['setExportOutputState']?.({ pending: !![] });
    try {
      if (isPersonReplacementTimelineMode(_0x4e9281)) {
        let _0x592c90 = await exportTimeline({ project: cloneJson(_0x2786bf), mode: _0x4e9281 });
        if (_0x592c90?.['canceled']) return ![];
        if (!_0x592c90?.['success']) throw new Error(_0x592c90?.['error'] || '剪辑工程导出失败');
        !_0x1c2bbe &&
          _0x256fb7['id'] === _0x2786bf['id'] &&
          _0x4e9281 === 'jianying-draft' &&
          _0x592c90['autoDetected'] &&
          (_0x592c90 = await _0x96064['show'](_0x592c90, _0x2786bf['title']));
        if (!_0x1c2bbe) {
          const _0x2b8294 = getPersonReplacementTimelineExportNotice(_0x4e9281, _0x592c90);
          showToast(_0x2b8294['message'], _0x2b8294['type']);
        }
        return _0x592c90;
      }
      let _0x5cb77c = _0x2786bf;
      if (_0x4e9281 === PERSON_REPLACEMENT_EXPORT_MODES['FINAL_VIDEO']) {
        const _0x38a786 = normalizeLocalPath(_0x2786bf['output']?.['visualMasterRef']);
        if (!_0x38a786) throw new Error('请先合成完整视频画面。');
        const _0x40874c = _0x2786bf['audio']?.['exportTrack'] === 'original' ? 'original' : 'replacement',
          _0x244559 = normalizeLocalPath(
            _0x40874c === 'original'
              ? _0x2786bf['audio']?.['originalAudioRef'] || _0x2786bf['output']?.['originalMasterRef']
              : _0x2786bf['audio']?.['replacementAudioRef'],
          );
        if (!_0x244559)
          throw new Error(
            _0x40874c === 'original' ? '原视频音轨不可用。' : '请先在声音克隆页面合成替换音轨。',
          );
        const _0x4bebb9 = await _0x5c04c7(
            {
              kind: 'videoAudioMux',
              purpose: PERSON_REPLACEMENT_COMPOSE_TASK_PURPOSE,
              src: _0x38a786,
              args: { audioSrc: _0x244559 },
            },
            { wait: !![], timeout: 0x927c0 },
          ),
          _0xf9ba8a = resolveMediaRef(_0x4bebb9);
        if (!_0x4bebb9?.['success'] || !_0xf9ba8a)
          throw new Error(_0x4bebb9?.['error'] || _0x4bebb9?.['message'] || '完整视频封装失败。');
        _0x5cb77c = _0x2a1c6c(
          transitionPersonReplacementOutput(_0x256fb7, {
            type: PERSON_REPLACEMENT_OUTPUT_TRANSITIONS['FINAL_MUX_SUCCEEDED'],
            finalVideoRef: _0xf9ba8a,
            finalAudioTrack: _0x40874c,
          }),
        );
      }
      const _0x580278 = await exportMedia({
        project: _0x5cb77c,
        mode: _0x4e9281,
        saveMedia: _0x100468,
        saveMediaFiles: _0x215b3a,
      });
      if (_0x580278?.['canceled']) return ![];
      if (_0x580278?.['success'] === ![])
        throw new Error(_0x580278?.['error'] || _0x580278?.['message'] || '素材导出失败');
      const _0x14044d = Math['max'](0x0, Number(_0x580278?.['exportedCount']) || 0x0),
        _0x3dce38 = Math['max'](0x0, Number(_0x580278?.['skippedCount']) || 0x0);
      return (
        showToast(
          _0x4e9281 === PERSON_REPLACEMENT_EXPORT_MODES['FINAL_VIDEO']
            ? '完整视频已导出。'
            : _0x4e9281 === PERSON_REPLACEMENT_EXPORT_MODES['CURRENT_CLIP']
              ? '当前片段已导出。'
              : _0x3dce38
                ? '已导出 ' + _0x14044d + ' 个素材，跳过 ' + _0x3dce38 + '\x20个缺失项。'
                : '已导出 ' + _0x14044d + ' 个素材。',
          'success',
        ),
        _0x580278
      );
    } catch (_0x503774) {
      if (!_0x1c2bbe) showToast(_0x503774?.['message'] || '素材导出失败', 'error');
      return ![];
    } finally {
      if (!_0x1c2bbe) _0x56a182?.['setExportOutputState']?.({ pending: ![] });
    }
  }
  async function _0x562bbd(_0x3dbe24 = {}) {
    const _0x4b404a = _0x3dbe24?.['project'] || _0x256fb7,
      _0x2ed5e0 =
        normalizeText(_0x3dbe24?.['scope']) === PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT']
          ? PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT']
          : PERSON_REPLACEMENT_CANVAS_SCOPES['CLIPS'],
      _0x2219db = Math['max'](
        0x1,
        Math['min'](0x5, Math['trunc'](Number(_0x4b404a['workspace']?.['step']) || 0x1)),
      ),
      _0x344edd = ['', '素材设定', '图像替换', '视频替换', '声音克隆', '替换片段'][_0x2219db];
    if (typeof createOutputCanvas !== 'function') return (showToast('当前环境无法加入画布。', 'error'), ![]);
    (_0x2d045a['add'](_0x2ed5e0),
      _0x56a182?.['setOutputCanvasSyncState']?.({ pending: !![], scope: _0x2ed5e0 }));
    try {
      const _0x40c08f = await createOutputCanvas({ project: cloneJson(_0x4b404a), scope: _0x2ed5e0 }),
        _0x396577 = _0x40c08f?.['binding']?.['nodes'];
      if (
        !normalizeText(_0x40c08f?.['canvasId']) ||
        !_0x396577 ||
        typeof _0x396577 !== 'object' ||
        Array['isArray'](_0x396577) ||
        !Object['keys'](_0x396577)['length']
      )
        throw new Error('加入画布后未返回有效的项目节点');
      if (normalizeText(_0x256fb7['id']) !== normalizeText(_0x4b404a['id'])) return _0x40c08f;
      return (
        _0x2a1c6c({
          ..._0x256fb7,
          output: {
            ..._0x256fb7['output'],
            canvasBinding: {
              ..._0x40c08f['binding'],
              canvasId: normalizeText(_0x40c08f['binding']['canvasId'] || _0x40c08f['canvasId']),
              nodes: { ..._0x396577 },
            },
          },
        }),
        onRequestClose(),
        showToast(
          _0x2ed5e0 === PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT']
            ? _0x40c08f['reused']
              ? '已更新画布中的整个人物替换项目。'
              : '已同步整个人物替换项目到画布。'
            : _0x40c08f['reused']
              ? '已更新画布中的' + _0x344edd + '内容。'
              : '已同步' + _0x344edd + '到画布。',
          'success',
        ),
        _0x40c08f
      );
    } catch (_0x296de6) {
      return (showToast(_0x296de6?.['message'] || '人物替换项目加入画布失败', 'error'), ![]);
    } finally {
      (_0x2d045a['delete'](_0x2ed5e0),
        _0x56a182?.['setOutputCanvasSyncState']?.({
          pending: _0x2d045a['size'] > 0x0,
          scope: [..._0x2d045a][0x0] || '',
        }));
    }
  }
  const _0x3e07bc = createCoalescedAsyncAction(_0x3db929),
    _0x348f29 = createCoalescedAsyncAction(_0x409932),
    _0xd5146b = createKeyedCoalescedAsyncAction(_0x562bbd, (_0x1ba44f) => _0x1ba44f?.['scope']);
  let _0x1c2bbe = ![];
  return Object['freeze']({
    mountVoiceStudio: _0x42ee68,
    composeOutput: _0x3e07bc,
    downloadImage: _0x24828c,
    downloadVideo: _0x5bbc17,
    exportOutput: _0x348f29,
    addOutputToCanvas: _0xd5146b,
    destroy() {
      if (_0x1c2bbe) return;
      ((_0x1c2bbe = !![]), _0x96064['destroy'](), _0x2c81f1?.());
    },
  });
}
