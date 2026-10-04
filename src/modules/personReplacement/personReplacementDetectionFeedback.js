import { logDiagnosticEvent } from '../../services/diagnosticsService.js';
export function recordPersonReplacementDetectionFailure(shotId, message, handler = logDiagnosticEvent) {
  void handler({
    type: 'person_replacement.detection_failed',
    level: 'error',
    message: message?.['message'] || '人物检测失败',
    error: message,
    context: {
      shotId: shotId['id'],
      sourceId: shotId['sourceId'],
      hasKeyframe: Boolean(shotId['keyframeRef']),
    },
  });
}
export function getPersonReplacementDetectionFeedback(message2, value) {
  const list = message2['filter']((item) => item['analysisStatus'] === 'failed');
  if (list['length'])
    return {
      level: 'error',
      message:
        message2['length'] +
        '\x20个镜头已处理，但\x20' +
        list['length'] +
        ' 个镜头人物检测失败。' +
        (list[0x0]['error'] || '错误详情未保留，请用原视频新建项目重试。') +
        ' 请在设置中生成诊断包。',
    };
  if (!message2['some']((key) => key['people']?.['length']))
    return {
      level: 'warn',
      message: '视频处理完成，共 ' + message2['length'] + ' 个镜头，未检测到人物，可手动框选主体。',
    };
  return {
    level: 'success',
    message: '视频处理完成，共 ' + message2['length'] + ' 个镜头、' + value + ' 个主要人物。',
  };
}
