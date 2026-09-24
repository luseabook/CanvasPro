import path from 'node:path';
import * as fs from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash } from 'node:crypto';
import { copyVerified, resolveExportSource } from '../nodeMediaExportService.js';
import { NODE_MEDIA_EXPORT_LIMITS } from '../../src/modules/nodeExport/nodeMediaExportModel.js';
import { normalizeTimelineRequest, parseTimelineProbe, buildTimelinePlan, TimelineExportError, timelineFail } from '../../src/modules/timelineExport/timelineExportModel.js';
import { buildPremiereXml } from './premiereXml.js';

function safeError(error) {
  if (error instanceof TimelineExportError || error?.exportMessage) return error.exportMessage || error.message;
  if (error?.code === 'ENOSPC') return '磁盘空间不足；可能已留下部分副本，请核对导出目录';
  if (['EACCES', 'EPERM'].includes(error?.code)) return '没有文件读写权限；请核对所选目录';
  if (error?.code === 'ENOENT') return '源文件或目标目录已不存在';
  return '时间线导出未能完成，请核对文件、运行时和所选目录；不自动重试';
}
async function writeExclusive(directory, name, text) {
  const staging = path.join(directory, `${name}.part`);
  try {
    await fs.writeFile(staging, text, { flag: 'wx', encoding: 'utf8' });
    await fs.copyFile(staging, path.join(directory, name), constants.COPYFILE_EXCL);
  } finally { await fs.unlink(staging).catch(() => {}); }
}

export function createTimelineExporter({ getRoots, resolveLocalVirtualPath, probe, chooseDirectory, confirmExport }) {
  let busy = false;
  return async function exportTimeline(payload, { assertActive = () => {} } = {}) {
    if (busy) return { status: 'failed', error: '已有时间线导出正在进行，请等待完成', directory: '', results: [] };
    busy = true;
    let directory = '', manifestSaved = false;
    const results = [];
    try {
      const request = normalizeTimelineRequest(payload), deps = { roots: getRoots(), resolveLocalVirtualPath };
      const sources = [], metadata = [], started = Date.now();
      let totalBytes = 0;
      for (const [index, clip] of request.clips.entries()) {
        assertActive();
        if (Date.now() - started > 120000) timelineFail('整批元数据预检超时，请减少片段数量');
        const source = await resolveExportSource(clip, deps);
        totalBytes += source.stat.size;
        if (totalBytes > NODE_MEDIA_EXPORT_LIMITS.totalBytes) timelineFail('媒体副本总大小超过2 GiB，请减少选择');
        try { metadata.push(parseTimelineProbe(await probe(source.absolutePath), request.includeAudio)); }
        catch (error) { timelineFail(`第 ${index + 1} 段：${safeError(error)}`); }
        sources.push(source);
      }
      const plan = buildTimelinePlan(request, metadata);
      assertActive();
      const selected = await chooseDirectory();
      if (!selected) return { status: 'cancelled', directory: '', results: [] };
      const parent = await fs.realpath(selected);
      if (!(await fs.stat(parent)).isDirectory()) timelineFail('目标不是目录');
      assertActive();
      if (!await confirmExport({ directory: parent, plan, totalBytes })) return { status: 'cancelled', directory: '', results: [] };
      assertActive();
      directory = await fs.mkdtemp(path.join(parent, 'CanvasPro-timeline-'));
      const mediaDirectory = path.join(directory, 'media'); await fs.mkdir(mediaDirectory);
      for (const [index, clip] of plan.clips.entries()) {
        assertActive();
        try {
          const saved = await copyVerified(clip, sources[index], mediaDirectory, deps);
          results.push({ nodeId: clip.nodeId, name: clip.name, fileName: `media/${clip.fileName}`,
            status: 'saved', ...saved, inFrame: clip.inFrame, outFrame: clip.outFrame, start: clip.start, end: clip.end });
        } catch (error) {
          results.push({ nodeId: clip.nodeId, name: clip.name, status: 'failed', error: safeError(error) });
          throw error; // A timeline must not silently remove failed shots or close their gaps.
        }
      }
      assertActive();
      const xml = buildPremiereXml(plan, directory);
      const xmlSha256 = createHash('sha256').update(xml).digest('hex');
      const report = { schema: 'canvas-timeline-export.v1', title: plan.title, createdAt: new Date().toISOString(),
        format: 'FCP7 xmeml v5', includeAudio: plan.includeAudio, frames: plan.frames,
        rate: { numerator: plan.rate.numerator, denominator: plan.rate.denominator },
        width: plan.rate.width, height: plan.rate.height, xmlSha256, results };
      await writeExclusive(directory, 'export-manifest.json', JSON.stringify(report, null, 2));
      manifestSaved = true;
      // Publish XML last, only after every media copy and the manifest succeed.
      await writeExclusive(directory, 'timeline.xml', xml);
      return { status: 'complete', directory, xmlFile: 'timeline.xml', xmlSha256, manifestSaved, results,
        frames: plan.frames, fps: plan.rate.numerator / plan.rate.denominator };
    } catch (error) {
      return { status: 'failed', error: safeError(error), directory, manifestSaved, results };
    } finally { busy = false; }
  };
}
