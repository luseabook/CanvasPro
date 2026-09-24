import { execFile } from 'node:child_process';
import { TimelineExportError } from '../../src/modules/timelineExport/timelineExportModel.js';

export function createTimelineProbe(getTool, run = execFile) {
  return function probe(absolutePath) {
    return new Promise((resolve, reject) => {
      // No shell, URL input, arbitrary flags or remote protocols. Executable is main-process owned.
      run(getTool('ffprobe'), ['-v', 'error', '-protocol_whitelist', 'file,pipe', '-format_whitelist', 'mov,matroska,webm,avi', '-max_alloc', '67108864',
        '-show_entries', 'stream=codec_type,width,height,avg_frame_rate,r_frame_rate,nb_frames,duration,sample_aspect_ratio,field_order,start_time,channels,sample_rate:stream_tags=rotate:stream_side_data=rotation',
        '-of', 'json', absolutePath],
      { timeout: 15000, maxBuffer: 1024 * 1024, windowsHide: true, encoding: 'utf8', shell: false },
      (error, stdout) => {
        if (error) {
          reject(new TimelineExportError(error.code === 'ENOENT'
            ? '未找到 ffprobe；请配置项目已有媒体运行时，本功能不自动安装'
            : '视频探测失败、超时或输出超限；未自动重试'));
          return;
        }
        try { resolve(JSON.parse(stdout)); }
        catch { reject(new TimelineExportError('ffprobe 返回了无效的元数据')); }
      });
    });
  };
}
