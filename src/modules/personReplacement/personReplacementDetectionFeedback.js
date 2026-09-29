import { logDiagnosticEvent } from '../../services/diagnosticsService.js';
export function recordPersonReplacementDetectionFailure(
  _0x578325,
  _0x109761,
  _0x3b4e8d = logDiagnosticEvent,
) {
  void _0x3b4e8d({
    type: 'person_replacement.detection_failed',
    level: 'error',
    message: _0x109761?.['message'] || '人物检测失败',
    error: _0x109761,
    context: {
      shotId: _0x578325['id'],
      sourceId: _0x578325['sourceId'],
      hasKeyframe: Boolean(_0x578325['keyframeRef']),
    },
  });
}
export function getPersonReplacementDetectionFeedback(_0x2e7c75, _0x5426a2) {
  const _0x2e347e = _0x2e7c75['filter']((_0x1adc2e) => _0x1adc2e['analysisStatus'] === 'failed');
  if (_0x2e347e['length'])
    return {
      level: 'error',
      message:
        _0x2e7c75['length'] +
        '\x20个镜头已处理，但\x20' +
        _0x2e347e['length'] +
        ' 个镜头人物检测失败。' +
        (_0x2e347e[0x0]['error'] || '错误详情未保留，请用原视频新建项目重试。') +
        ' 请在设置中生成诊断包。',
    };
  if (!_0x2e7c75['some']((_0x175433) => _0x175433['people']?.['length']))
    return {
      level: 'warn',
      message: '视频处理完成，共 ' + _0x2e7c75['length'] + ' 个镜头，未检测到人物，可手动框选主体。',
    };
  return {
    level: 'success',
    message: '视频处理完成，共 ' + _0x2e7c75['length'] + ' 个镜头、' + _0x5426a2 + ' 个主要人物。',
  };
}
