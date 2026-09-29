import { ensureVideoResultThumbnail } from '../../../api/videoResultThumbnailApi.js';
import { transcribeReplicationSource } from '../../../api/storyReplicationSpeechApi.js';
import { readVideoFileNaturalSize } from '../../components/source-video/sourceVideoUploadMedia.js';
import { uploadFile } from '../../services/projectService.js';
import { logDiagnosticEvent } from '../../services/diagnosticsService.js';
import { collectStoryReplicationRepresentativeFrames } from './storyReplicationRepresentativeFrames.js';
import { buildStoryBackgroundTaskId } from './storyBackgroundTasks.js';
import { resolveStoryTextProviderProfileId } from './storyProjectPlanning.js';
import { validateStoryReplicationVideoSize } from './storyReplicationVideoLimits.js';
import {
  getStoryWorkspaceModelChoice,
  resolveStoryVideoInputTextModelId,
} from './storyWorkspaceModelCatalog.js';
import {
  applyStoryVideoReplicationAnalysis,
  applyStoryVideoReplicationUpload,
  createStoryVideoReplicationProjectData,
  failStoryVideoReplicationEpisode,
  findStoryReplicationEpisode,
  getStoryVideoReplicationSummary,
  invalidateStoryVideoReplicationAssetLocalization,
  resolveStoryVideoReplicationHomeTab,
  resolveStoryReplicationUploadedVideo,
  syncStoryVideoReplicationProject,
} from './storyVideoReplication.js';
import {
  syncStoryVideoReplicationCardElement,
  syncStoryReplicationSelection,
} from './storyVideoReplicationPresentation.js';
function normalizeText(_0x4846f6) {
  return String(_0x4846f6 ?? '')['trim']();
}
function finishAnalysisAttempt(_0x26efa7, _0x1631fc, _0x55c799 = null) {
  if (!_0x1631fc) return;
  const _0x2935fb = {
    ..._0x1631fc,
    finishedAt: Date['now'](),
    status: _0x55c799 ? 'failed' : 'succeeded',
    ...(_0x55c799
      ? {
          error: String(_0x55c799['message'] || '视频分析失败')['slice'](0x0, 0x4b0),
          code: _0x55c799['code'],
          httpStatus: _0x55c799['status'],
          errorType: _0x55c799['type'],
        }
      : {}),
  };
  ((_0x26efa7['replication']['analysisAttempts'] = [
    ...(_0x26efa7['replication']['analysisAttempts'] || []),
    _0x2935fb,
  ]['slice'](-0xa)),
    void logDiagnosticEvent({
      type: 'story.replication_analysis_finished',
      level: _0x55c799 ? 'error' : 'info',
      message: _0x55c799 ? _0x2935fb['error'] : '原视频分析完成',
      context: _0x2935fb,
    }));
}
export function createStoryVideoReplicationWorkspaceController({
  state: _0x3cface,
  viewport: _0x351474,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'] || globalThis,
  analyzeSourceVideo: _0x1bcbdc,
  transcribeSource: transcribeSource = transcribeReplicationSource,
  analysisPromises: _0x1535a2,
  sourceFileByEpisodeKey: _0x2d2bff,
  createProjectToken: _0x4bba83,
  beginProjectSession: _0x44fa42,
  isProjectTaskLive: _0x25aa94,
  isProjectTaskCurrent: _0x3bd786,
  startBackgroundTask: _0x258670,
  updateBackgroundTask: _0x36982a,
  finishBackgroundTask: _0x3c192c,
  syncProjectEntry: _0x2ba442,
  syncCurrentProjectEntry: _0xefa5e1,
  schedulePersistence: _0xa436c9,
  openProject: _0xe2504e,
  renderFooter: _0x49e0b8,
  showToast: _0xda3d8c,
  showNavigableTaskResultToast: _0x515b50,
  notifyTextTaskComplete: _0xb45264,
} = {}) {
  if (
    !_0x3cface ||
    !_0x351474 ||
    !documentObject ||
    !(_0x1535a2 instanceof Map) ||
    !(_0x2d2bff instanceof Map) ||
    typeof _0x4bba83 !== 'function' ||
    typeof _0x44fa42 !== 'function' ||
    typeof _0x25aa94 !== 'function' ||
    typeof _0x3bd786 !== 'function' ||
    typeof _0x258670 !== 'function' ||
    typeof _0x36982a !== 'function' ||
    typeof _0x3c192c !== 'function' ||
    typeof _0x2ba442 !== 'function' ||
    typeof _0xefa5e1 !== 'function' ||
    typeof _0xa436c9 !== 'function' ||
    typeof _0xe2504e !== 'function' ||
    typeof _0x49e0b8 !== 'function' ||
    typeof _0xda3d8c !== 'function' ||
    typeof _0x515b50 !== 'function' ||
    typeof _0xb45264 !== 'function'
  )
    throw new TypeError(
      'Story\x20video\x20replication\x20requires\x20task,\x20persistence,\x20and\x20presentation\x20adapters.',
    );
  function _0x38a7ff(_0x267159) {
    const _0x5594b8 = windowObject?.['URL'];
    if (!_0x267159 || typeof _0x5594b8?.['createObjectURL'] !== 'function') return '';
    try {
      return _0x5594b8['createObjectURL'](_0x267159);
    } catch (_0x35cb91) {
      return (console['warn']('[storyWorkspace] 创建复刻视频本地预览失败', _0x35cb91), '');
    }
  }
  function _0x313d26(_0x3f7e21) {
    const _0x18f4a1 = normalizeText(_0x3f7e21),
      _0x4a5b5e = windowObject?.['URL'];
    if (!_0x18f4a1['startsWith']('blob:') || typeof _0x4a5b5e?.['revokeObjectURL'] !== 'function') return;
    _0x4a5b5e['revokeObjectURL'](_0x18f4a1);
  }
  function _0x1c21c8() {
    (_0x3cface['replicationSourcePreviewUrls']['forEach'](_0x313d26),
      (_0x3cface['replicationSourcePreviewUrls'] = []));
  }
  function _0x5843c8(_0x2c02cf) {
    if (
      _0x3cface['view'] !== 'project' ||
      _0x3cface['step'] !== 0x1 ||
      _0x3cface['data']?.['project']?.['sourceMode'] !== 'video-replication'
    )
      return ![];
    const _0x296014 = _0x351474['querySelector']('.story-page.is-current'),
      _0x3f79cd = findStoryReplicationEpisode(_0x3cface['data'], _0x2c02cf),
      _0x190a93 = [...(_0x296014?.['querySelectorAll']('[data-story-replication-episode-id]') || [])]['find'](
        (_0x2a4383) =>
          _0x2a4383['matches']?.('article') &&
          normalizeText(_0x2a4383['dataset']['storyReplicationEpisodeId']) === normalizeText(_0x2c02cf),
      );
    if (!_0x296014 || !_0x3f79cd || !_0x190a93) return ![];
    const _0xa55e57 = _0x3cface['data']['episodes']['indexOf'](_0x3f79cd);
    return (
      _0x296014['dispatchEvent']?.(
        new CustomEvent('story-replication-updated', { detail: { episodeId: _0x2c02cf } }),
      ),
      syncStoryVideoReplicationCardElement(_0x190a93, _0x3f79cd, _0xa55e57)
    );
  }
  function _0x4c582e() {
    if (
      _0x3cface['view'] !== 'project' ||
      _0x3cface['step'] !== 0x1 ||
      _0x3cface['data']?.['project']?.['sourceMode'] !== 'video-replication'
    )
      return ![];
    const _0x5ee202 = _0x351474['querySelector']('.story-page.is-current'),
      _0x29d68a = _0x5ee202?.['querySelector']('.story-page-footer');
    if (_0x5ee202) syncStoryReplicationSelection(_0x5ee202, _0x3cface);
    if (!_0x29d68a) return ![];
    const _0x39c714 = documentObject['createElement']('template');
    _0x39c714['innerHTML'] = _0x49e0b8(_0x3cface)['trim']();
    const _0x127034 = _0x39c714['content']['firstElementChild'];
    if (!_0x127034) return ![];
    return (_0x29d68a['replaceWith'](_0x127034), !![]);
  }
  function _0x39848d(_0x1ffb09, _0x13ddca) {
    if (
      !_0x3bd786(_0x1ffb09) ||
      _0x3cface['view'] !== 'project' ||
      _0x3cface['step'] !== 0x1 ||
      _0x3cface['data']?.['project']?.['sourceMode'] !== 'video-replication'
    )
      return ![];
    const _0x2b4d2a = _0x5843c8(_0x13ddca),
      _0x1b89cd = _0x4c582e();
    return _0x2b4d2a && _0x1b89cd;
  }
  async function _0x5bd7c5(
    _0x2fce5e,
    _0x6f99b8,
    _0x59d73d,
    { uploadOnly: uploadOnly = ![], force: force = ![] } = {},
  ) {
    const _0x1b1a7d = findStoryReplicationEpisode(_0x2fce5e['data'], _0x59d73d);
    if (!_0x1b1a7d || !_0x25aa94(_0x2fce5e)) return ![];
    const _0x1d5c18 = force
      ? { replication: { ..._0x1b1a7d['replication'] }, status: _0x1b1a7d['status'] }
      : null;
    let _0x30ab46 = null;
    const _0x36c803 = buildStoryBackgroundTaskId('video-replication-analysis', { episodeId: _0x59d73d });
    _0x258670(
      _0x2fce5e,
      {
        id: _0x36c803,
        type: 'video-replication-analysis',
        scope: { episodeId: _0x59d73d },
        label: '解析第 ' + _0x1b1a7d['number'] + ' 集视频',
        message: '正在上传原视频',
      },
      { refreshHome: ![] },
    );
    if (!force) invalidateStoryVideoReplicationAssetLocalization(_0x2fce5e['data']);
    ((_0x1b1a7d['replication'] = {
      ...(_0x1b1a7d['replication'] || {}),
      status: 'uploading',
      progress: 0xa,
      error: '',
    }),
      _0x39848d(_0x2fce5e, _0x59d73d));
    try {
      const _0x441477 = validateStoryReplicationVideoSize(
        _0x6f99b8 || _0x1b1a7d['sourceVideo'],
        _0x2fce5e['modelSettings']['models']?.['text'],
      );
      if (!_0x441477['ok']) throw new Error(_0x441477['error']);
      let _0x5d0e23 = normalizeText(_0x1b1a7d['sourceVideo']?.['videoRef']);
      if (!_0x5d0e23) {
        if (!_0x6f99b8) throw new Error('原视频尚未上传，请使用卡片上的“重新上传该视频”。');
        const _0x9855e0 = readVideoFileNaturalSize(_0x6f99b8)['catch'](() => null),
          _0x306060 = await uploadFile(_0x6f99b8, _0x2fce5e['projectId']);
        if (!_0x25aa94(_0x2fce5e)) return ![];
        const _0x41859a = await _0x9855e0;
        if (!_0x25aa94(_0x2fce5e)) return ![];
        const _0x57b86d = resolveStoryReplicationUploadedVideo(_0x306060);
        _0x5d0e23 = _0x57b86d['videoRef'];
        let _0x8675c3 = {
          ..._0x306060,
          localPath: _0x57b86d['localPath'] || _0x306060?.['localPath'],
          videoUrl: _0x5d0e23,
        };
        try {
          _0x8675c3 = await ensureVideoResultThumbnail(_0x8675c3);
        } catch (_0xe853ea) {
          globalThis['console']?.['warn']?.(
            '[storyWorkspace] 复刻视频首帧提取失败，继续执行视频解析',
            _0xe853ea,
          );
        }
        if (!_0x25aa94(_0x2fce5e)) return ![];
        applyStoryVideoReplicationUpload(_0x1b1a7d, {
          file: _0x6f99b8,
          videoRef: _0x5d0e23,
          durationSec: _0x41859a?.['duration'] || _0x306060?.['durationSec'] || _0x306060?.['duration'],
          posterUrl: _0x8675c3?.['posterUrl'] || _0x8675c3?.['thumbUrl'],
          posterLocalPath: _0x8675c3?.['posterLocalPath'] || _0x8675c3?.['thumbLocalPath'],
        });
      } else
        ((_0x1b1a7d['replication'] = {
          ...(_0x1b1a7d['replication'] || {}),
          status: 'analyzing',
          progress: 0x2d,
          error: '',
        }),
          (_0x1b1a7d['status'] = '解析中'));
      if (uploadOnly)
        return (
          (_0x1b1a7d['replication']['status'] = 'pending'),
          (_0x1b1a7d['replication']['progress'] = 0x0),
          (_0x1b1a7d['status'] = '待分析'),
          _0x3c192c(
            _0x2fce5e,
            _0x36c803,
            { status: 'succeeded', message: '视频已导入，等待选择分析' },
            { refreshHome: ![] },
          ),
          syncStoryVideoReplicationProject(_0x2fce5e['data']),
          _0x2ba442(_0x2fce5e),
          _0xa436c9({ immediate: !![] }),
          _0x39848d(_0x2fce5e, _0x59d73d),
          !![]
        );
      (_0x36982a(
        _0x2fce5e,
        _0x36c803,
        { status: 'running', message: '正在理解剧情、台词与镜头' },
        { refreshHome: ![] },
      ),
        _0x39848d(_0x2fce5e, _0x59d73d));
      const _0x365cc0 = normalizeText(_0x2fce5e['modelSettings']['models']?.['text']);
      if (!_0x365cc0 || resolveStoryVideoInputTextModelId(_0x365cc0) !== _0x365cc0)
        throw new Error('当前选中的模型不支持视频分析，请从模型菜单重新选择后重试。');
      const _0x4e7a0e =
          getStoryWorkspaceModelChoice('text', _0x365cc0)?.['provider'] ||
          _0x2fce5e['modelSettings']['textProvider'],
        _0x386f86 = resolveStoryTextProviderProfileId(
          _0x4e7a0e,
          _0x2fce5e['modelSettings']['textProviderProfileId'],
        );
      _0x36982a(
        _0x2fce5e,
        _0x36c803,
        { modelId: _0x365cc0, provider: _0x4e7a0e, providerProfileId: _0x386f86 },
        { refreshHome: ![] },
      );
      (force || !_0x1b1a7d['replication']['sourceAnalysis']) &&
        (_0x30ab46 = {
          startedAt: Date['now'](),
          projectId: _0x2fce5e['projectId'],
          episodeId: _0x59d73d,
          modelId: _0x365cc0,
          provider: _0x4e7a0e,
          providerProfileId: _0x386f86,
        });
      let _0xaca5ae =
        _0x1b1a7d['replication']['speechEvidence'] ||
        _0x1b1a7d['replication']['sourceAnalysis']?.['speechEvidence'];
      if ((force || !_0x1b1a7d['replication']['sourceAnalysis']) && !_0xaca5ae) {
        (_0x36982a(
          _0x2fce5e,
          _0x36c803,
          { message: '正在识别原片音轨，保留台词与时间' },
          { refreshHome: ![] },
        ),
          (_0xaca5ae = await transcribeSource({
            videoRef: _0x5d0e23,
            provider: _0x2fce5e['data']['project']['replication']?.['asrProvider'] || 'volcengine-speech',
            isActive: () => _0x25aa94(_0x2fce5e),
          })));
        if (!_0x25aa94(_0x2fce5e)) return ![];
        if (_0x1d5c18) _0x1d5c18['replication']['speechEvidence'] = _0xaca5ae;
        !force &&
          ((_0x1b1a7d['replication']['speechEvidence'] = _0xaca5ae),
          _0x2ba442(_0x2fce5e),
          _0xa436c9({ immediate: !![] }));
      }
      const _0x5a7452 = await _0x1bcbdc({
        videoRef: _0x5d0e23,
        speechEvidence: _0xaca5ae,
        durationSec: _0x1b1a7d['sourceVideo']['durationSec'],
        modelId: _0x365cc0,
        model: _0x365cc0,
        provider: _0x4e7a0e,
        providerProfileId: _0x386f86,
        sourceAnalysis: force ? null : _0x1b1a7d['replication']['sourceAnalysis'] || null,
        isActive: () => _0x25aa94(_0x2fce5e),
        onProgress: (_0x147a8b) => {
          if (!_0x25aa94(_0x2fce5e)) return;
          ((_0x1b1a7d['replication']['message'] = _0x147a8b),
            _0x36982a(_0x2fce5e, _0x36c803, { message: _0x147a8b }, { refreshHome: ![] }),
            _0x39848d(_0x2fce5e, _0x59d73d));
        },
        onSourceAnalysis: async (_0x8deed5) => {
          if (!_0x25aa94(_0x2fce5e) || force) return;
          ((_0x1b1a7d['replication']['sourceAnalysis'] = _0x8deed5),
            _0x2ba442(_0x2fce5e),
            _0xa436c9({ immediate: !![] }));
        },
      });
      if (!_0x25aa94(_0x2fce5e)) return ![];
      if (_0x5a7452['sourceAnalysis']) {
        const _0x2146f3 = {
          ..._0x1b1a7d,
          replication: { ..._0x1b1a7d['replication'], sourceAnalysis: _0x5a7452['sourceAnalysis'] },
        };
        await collectStoryReplicationRepresentativeFrames({
          episode: _0x2146f3,
          projectId: _0x2fce5e['projectId'],
          isActive: () => _0x25aa94(_0x2fce5e),
          onProgress: (_0x58025b) => {
            ((_0x1b1a7d['replication']['message'] = _0x58025b), _0x39848d(_0x2fce5e, _0x59d73d));
          },
        });
      }
      if (!_0x25aa94(_0x2fce5e)) return ![];
      if (force && !_0x5a7452['sourceAnalysis']) throw new Error('未返回原片分析，已保留现有内容。');
      applyStoryVideoReplicationAnalysis(_0x1b1a7d, _0x5a7452);
      if (_0xaca5ae) _0x1b1a7d['replication']['speechEvidence'] = _0xaca5ae;
      finishAnalysisAttempt(_0x1b1a7d, _0x30ab46);
      if (force) {
        invalidateStoryVideoReplicationAssetLocalization(_0x2fce5e['data']);
        if (_0x1b1a7d['clips']?.['length']) _0x1b1a7d['replication']['promptsStale'] = !![];
        else {
          const _0x3c8514 = _0x2fce5e['data']['project']['replication']['characterBindings'] || {};
          for (const _0x2a36ce of Object['keys'](_0x3c8514))
            if (_0x2a36ce['startsWith'](_0x1b1a7d['id'] + ':')) delete _0x3c8514[_0x2a36ce];
        }
      }
      return (
        (_0x1b1a7d['replication']['message'] = ''),
        syncStoryVideoReplicationProject(_0x2fce5e['data']),
        _0x3c192c(
          _0x2fce5e,
          _0x36c803,
          { status: 'succeeded', message: '第\x20' + _0x1b1a7d['number'] + ' 集视频解析完成' },
          { refreshHome: ![] },
        ),
        _0x2ba442(_0x2fce5e),
        _0xa436c9({ immediate: !![] }),
        _0x39848d(_0x2fce5e, _0x59d73d),
        !![]
      );
    } catch (_0x42e1a5) {
      if (!_0x25aa94(_0x2fce5e)) return ![];
      if (_0x1d5c18)
        ((_0x1b1a7d['replication'] = {
          ..._0x1d5c18['replication'],
          error: '重新分析失败，已保留原人物记录：' + (_0x42e1a5?.['message'] || '请重试'),
        }),
          (_0x1b1a7d['status'] = _0x1d5c18['status']));
      else failStoryVideoReplicationEpisode(_0x1b1a7d, _0x42e1a5?.['message']);
      return (
        finishAnalysisAttempt(_0x1b1a7d, _0x30ab46, _0x42e1a5),
        syncStoryVideoReplicationProject(_0x2fce5e['data']),
        _0x3c192c(
          _0x2fce5e,
          _0x36c803,
          {
            status: 'failed',
            message: '第\x20' + _0x1b1a7d['number'] + '\x20集视频解析失败',
            error: _0x42e1a5?.['message'] || '视频解析失败。',
          },
          { refreshHome: ![] },
        ),
        _0x2ba442(_0x2fce5e),
        _0xa436c9({ immediate: !![] }),
        _0x39848d(_0x2fce5e, _0x59d73d),
        ![]
      );
    }
  }
  async function _0x4dea22(_0x38bf4a, _0x561a09 = []) {
    const _0x5b53ea = normalizeText(_0x38bf4a?.['projectId']),
      _0x11c782 = _0x1535a2['get'](_0x5b53ea);
    if (_0x11c782) return _0x11c782;
    const _0x37ccd5 = Array['isArray'](_0x561a09) ? [..._0x561a09] : [],
      _0x4ecb15 = (async () => {
        let _0x4103a9 = 0x0;
        for (const _0x1938b9 of _0x37ccd5) {
          if (!_0x25aa94(_0x38bf4a)) break;
          if (!(await _0x5bd7c5(_0x38bf4a, _0x1938b9['file'], _0x1938b9['episodeId'], _0x1938b9)))
            _0x4103a9 += 0x1;
        }
        if (!_0x25aa94(_0x38bf4a)) return ![];
        const _0x571737 = getStoryVideoReplicationSummary(_0x38bf4a['data']);
        if (
          !_0x4103a9 &&
          !_0x571737['active'] &&
          !_0x571737['failed'] &&
          _0x571737['completed'] === _0x571737['total']
        )
          _0xb45264(
            '视频解析完成，共\x20' + _0x571737['completed'] + ' 条。',
            _0x38bf4a,
            { step: 0x1 },
            { notificationMessage: '复刻视频解析完成。' },
          );
        else
          (_0x571737['failed'] || _0x4103a9) &&
            _0x515b50(
              '视频解析已完成 ' +
                _0x571737['completed'] +
                '/' +
                _0x571737['total'] +
                ' 条，' +
                Math['max'](_0x571737['failed'], _0x4103a9) +
                ' 条请求失败。',
              'warn',
              _0x38bf4a,
              { step: 0x1 },
            );
        return (
          _0x571737['completed'] > 0x0 ||
          _0x37ccd5['some'](
            (_0x3a2231) =>
              _0x3a2231['uploadOnly'] &&
              findStoryReplicationEpisode(_0x38bf4a['data'], _0x3a2231['episodeId'])?.['replication']?.[
                'status'
              ] === 'pending',
          )
        );
      })()['finally'](() => {
        _0x1535a2['get'](_0x5b53ea) === _0x4ecb15 && _0x1535a2['delete'](_0x5b53ea);
        if (_0x3bd786(_0x38bf4a)) _0x4c582e();
      });
    return (_0x1535a2['set'](_0x5b53ea, _0x4ecb15), _0x4ecb15);
  }
  async function _0x22c46a() {
    if (_0x3cface['isGeneratingStory']) return ![];
    if (resolveStoryVideoReplicationHomeTab(_0x3cface, 'replication') !== 'replication') return ![];
    if (typeof _0x1bcbdc !== 'function') return (_0xda3d8c('视频理解 Agent 尚未初始化。', 'error'), ![]);
    const _0x5e80b8 = [..._0x3cface['replicationSourceFiles']];
    if (!_0x5e80b8['length']) return (_0xda3d8c('请先上传至少一条视频。', 'warn'), ![]);
    const _0x499a01 = resolveStoryVideoInputTextModelId(_0x3cface['models']['text']);
    if (!_0x499a01) return (_0xda3d8c('当前没有支持视频输入的文本模型。', 'error'), ![]);
    const _0x482606 = _0x5e80b8['map']((_0x268c83) =>
      validateStoryReplicationVideoSize(_0x268c83, _0x499a01),
    )['find']((_0x55acb0) => !_0x55acb0['ok']);
    if (_0x482606) return (_0xda3d8c(_0x482606['error'], 'warn'), ![]);
    (_0xefa5e1(), _0x44fa42(), (_0x3cface['models']['text'] = _0x499a01));
    const _0x3c66fd = getStoryWorkspaceModelChoice('text', _0x499a01);
    ((_0x3cface['textProvider'] = _0x3c66fd?.['provider'] || _0x3cface['textProvider']),
      (_0x3cface['textProviderProfileId'] = resolveStoryTextProviderProfileId(
        _0x3cface['textProvider'],
        _0x3cface['textProviderProfileId'],
      )));
    const _0x29f3bc = 'story-' + Date['now']();
    ((_0x3cface['data'] = createStoryVideoReplicationProjectData({
      projectId: _0x29f3bc,
      files: _0x5e80b8,
      modelId: _0x499a01,
      provider: _0x3cface['textProvider'],
      providerProfileId: _0x3cface['textProviderProfileId'],
      targetLocale: _0x3cface['replicationTargetLocale'],
      asrProvider: _0x3cface['replicationAsrProvider'] || 'volcengine-speech',
      promptMode: _0x3cface['data']['project']?.['planning']?.['promptMode'],
      aspectRatio: _0x3cface['data']['project']?.['aspectRatio'] || '9:16',
    })),
      (_0x3cface['projectTitleEdited'] = ![]),
      (_0x3cface['hasCreatedProject'] = !![]),
      (_0x3cface['assetSelectionMode'] = ![]),
      (_0x3cface['selectedAssetIds'] = []),
      (_0x3cface['selectedEpisodeId'] = _0x3cface['data']['episodes'][0x0]?.['id'] || ''),
      (_0x3cface['selectedClipId'] = ''),
      _0x1c21c8(),
      (_0x3cface['replicationSourceFiles'] = []),
      _0xe2504e({ resetStep: !![] }),
      _0xefa5e1(),
      _0xa436c9({ immediate: !![] }));
    const _0x2c560f = _0x4bba83(),
      _0x1f321b = _0x5e80b8['map']((_0x4c8295, _0x11c8bb) => ({
        file: _0x4c8295,
        episodeId: _0x3cface['data']['episodes'][_0x11c8bb]?.['id'],
        uploadOnly: !![],
      }))['filter']((_0x3bc3b6) => _0x3bc3b6['file'] && _0x3bc3b6['episodeId']);
    return (
      _0x1f321b['forEach']((_0x412dab) => {
        _0x2d2bff['set'](_0x29f3bc + ':' + _0x412dab['episodeId'], _0x412dab['file']);
      }),
      _0x4dea22(_0x2c560f, _0x1f321b)
    );
  }
  async function _0x411f99() {
    if (_0x3cface['data']?.['project']?.['sourceMode'] !== 'video-replication') return ![];
    const _0x4da1fa = _0x4bba83(),
      _0x1089b0 = normalizeText(_0x4da1fa['projectId']);
    if (_0x1535a2['has'](_0x1089b0)) return ![];
    const _0x3c3734 = _0x3cface['data']['episodes']
      ['filter']((_0x2312a9) => _0x2312a9?.['replication']?.['status'] === 'failed')
      ['map']((_0x2b6742) => ({
        episodeId: _0x2b6742['id'],
        file: _0x2d2bff['get'](_0x1089b0 + ':' + _0x2b6742['id']) || null,
      }));
    if (!_0x3c3734['length']) return ![];
    return _0x4dea22(_0x4da1fa, _0x3c3734);
  }
  async function _0x4bd8bd({ all: all = ![], episodeId: episodeId = '' } = {}) {
    if (_0x3cface['data']?.['project']?.['sourceMode'] !== 'video-replication') return ![];
    const _0x22ddd0 = _0x4bba83();
    if (_0x1535a2['has'](_0x22ddd0['projectId'])) return ![];
    const _0xb492a4 = _0x22ddd0['data']['episodes']
      ['filter'](
        (_0x12a22d) =>
          ['pending', 'failed']['includes'](_0x12a22d['replication']?.['status']) &&
          (episodeId
            ? _0x12a22d['id'] === episodeId
            : all || _0x12a22d['replication']['selectedForAnalysis']),
      )
      ['map']((_0x83e2af) => ({
        episodeId: _0x83e2af['id'],
        file: _0x2d2bff['get'](_0x22ddd0['projectId'] + ':' + _0x83e2af['id']) || null,
      }));
    if (!_0xb492a4['length']) return (_0xda3d8c('请先选择待分析的视频。', 'warn'), ![]);
    for (const _0x310d06 of _0xb492a4) {
      const _0x4360f7 = findStoryReplicationEpisode(_0x22ddd0['data'], _0x310d06['episodeId']);
      ((_0x4360f7['replication']['status'] = 'queued'), _0x5843c8(_0x4360f7['id']));
    }
    return (_0x4c582e(), _0x4dea22(_0x22ddd0, _0xb492a4));
  }
  return {
    reanalyzeEpisode: (_0x345ba5) => {
      const _0x1e3474 = _0x4bba83(),
        _0x5e93a2 = findStoryReplicationEpisode(_0x1e3474['data'], _0x345ba5);
      if (!_0x5e93a2?.['replication']['sourceAnalysis']) return ![];
      if (_0x1535a2['has'](_0x1e3474['projectId']))
        return (_0xda3d8c('已有视频正在分析，请等待完成后再重新识别。', 'warn'), ![]);
      return _0x4dea22(_0x1e3474, [{ episodeId: _0x345ba5, force: !![] }]);
    },
    analyzeEpisode: _0x5bd7c5,
    analyzeSelected: _0x4bd8bd,
    createSourcePreviewUrl: _0x38a7ff,
    refreshEpisode: _0x5843c8,
    refreshFooter: _0x4c582e,
    releaseSourcePreviewUrls: _0x1c21c8,
    retryFailedAnalysis: _0x411f99,
    revokeSourcePreviewUrl: _0x313d26,
    runAnalysis: _0x4dea22,
    startFromHome: _0x22c46a,
  };
}
