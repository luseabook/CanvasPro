import {
  exportDirectorProjectPackage,
  importDirectorProjectPackage,
  downloadDirectorProjectPackage,
} from './directorProjectPackage.js';
import { restoreDirectorRecycleEntry } from './directorRecovery.js';
import { captureDirectorShotFrame } from './shotFrameCapture.js';
import {
  createTrackedMediaObjectUrl,
  revokeTrackedMediaObjectUrl,
} from '../../services/mediaObjectUrlRegistry.js';
const escape = (value) =>
  String(value ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('<', '&lt;');
export class DirectorDeliveryPanel {
  constructor(item) {
    ((this['panel'] = item), (this['busy'] = ''), (this['selected'] = new Set()), (this['disposed'] = ![]));
  }
  ['render']() {
    const { project: project, scene: scene } = this['panel']['context'](),
      list = scene['directorSettings']?.['screenshots'] || [];
    this['selected'] = new Set(
      [...this['selected']]['filter']((key) => list['some']((index) => index['assetId'] === key)),
    );
    if (this['preview'] && !list['some']((result) => result['assetId'] === this['preview']['assetId']))
      this['clearPreview']();
    return (
      '<fieldset data-director-delivery aria-busy="' +
      Boolean(this['busy']) +
      '"><legend>截图、项目迁移与恢复</legend><div class="storyboard-3d-director-fields">\n      <button data-storyboard-3d-action="timeline-delivery-capture" ' +
      (this['busy'] ? 'disabled' : '') +
      '>保存播放头截图</button><button data-storyboard-3d-action="timeline-delivery-send" ' +
      (this['busy'] || !this['selected']['size'] ? 'disabled' : '') +
      '>选中截图发送到画布</button>\n      <button data-storyboard-3d-action="timeline-delivery-clear-screenshots" ' +
      (this['busy'] || !list['length'] ? 'disabled' : '') +
      '>清空截图历史</button>\n      <button data-storyboard-3d-action="timeline-delivery-package" ' +
      (this['busy'] ? 'disabled' : '') +
      '>导出项目与素材</button><label>导入项目包<input\x20type=\x22file\x22\x20accept=\x22.aic3d\x22\x20data-director-package-file\x20' +
      (this['busy'] ? 'disabled' : '') +
      '></label>\n    </div>' +
      (this['busy']
        ? '<p role="status">' + escape(this['busy']) + '</p><progress aria-label="正在处理"></progress>'
        : '') +
      '\n    <div class="storyboard-3d-director-fields">' +
      (list['map'](
        (error) =>
          '<label><input type="checkbox" data-director-screenshot="' +
          escape(error['assetId']) +
          '\x22\x20' +
          (this['selected']['has'](error['assetId']) ? 'checked' : '') +
          '>' +
          escape(error['name']) +
          ' · ' +
          error['time']['toFixed'](0x2) +
          's</label><button data-storyboard-3d-action="timeline-delivery-preview" data-asset-id="' +
          escape(error['assetId']) +
          '\x22\x20' +
          (this['busy'] ? 'disabled' : '') +
          '>查看截图</button>',
      )['join']('') || '尚未保存截图') +
      '</div>\n    ' +
      (this['preview']
        ? '<figure class="storyboard-3d-director-screenshot"><img src="' +
          escape(this['preview']['url']) +
          '\x22\x20alt=\x22' +
          escape(this['preview']['name']) +
          '"><button data-storyboard-3d-action="timeline-delivery-close-preview">收起截图</button></figure>'
        : '') +
      '\x0a\x20\x20\x20\x20<details><summary>回收站\x20·\x20' +
      (project['recycleBin'] || [])['length'] +
      ' 项（保留最近 20 次）</summary>' +
      (project['recycleBin'] || [])
        ['slice']()
        ['reverse']()
        ['map'](
          (data) =>
            '<div class="storyboard-3d-director-fields"><span>' +
            escape(data['label']) +
            ' · ' +
            new Date(data['deletedAt'])['toLocaleString']() +
            '</span><button data-storyboard-3d-action="timeline-delivery-restore" data-entry-id="' +
            escape(data['id']) +
            '">恢复</button><button data-storyboard-3d-action="timeline-delivery-forget" data-entry-id="' +
            escape(data['id']) +
            '">永久移除记录</button></div>',
        )
        ['join']('') +
      '</details></fieldset>'
    );
  }
  ['change'](event) {
    const el = event['target'];
    if (el['matches']?.('[data-director-package-file]')) {
      const options = el['files']?.[0x0];
      el['value'] = '';
      if (options)
        void this['run']('正在导入项目与素材…', async () => {
          const importDirectorProjectPackage2 = await importDirectorProjectPackage(
            options,
            this['panel']['timeline']['getBinaryAssetRepository'](),
          );
          if (!this['disposed']) this['panel']['timeline']['importProject'](importDirectorProjectPackage2);
        });
      return !![];
    }
    if (el['matches']?.('[data-director-screenshot]')) {
      if (el['checked']) this['selected']['add'](el['dataset']['directorScreenshot']);
      else this['selected']['delete'](el['dataset']['directorScreenshot']);
      return (this['panel']['timeline']['requestRender']?.(), !![]);
    }
    return ![];
  }
  async ['run'](target, handler) {
    if (this['busy'] || this['disposed']) return;
    ((this['busy'] = target), this['panel']['timeline']['requestRender']?.());
    try {
      await handler();
    } catch (error2) {
      if (!this['disposed']) this['panel']['timeline']['setMessage']?.(error2['message']);
    } finally {
      this['busy'] = '';
      if (!this['disposed']) this['panel']['timeline']['requestRender']?.();
    }
  }
  ['click'](enabled, el2) {
    if (!enabled['startsWith']('timeline-delivery-')) return ![];
    const importedModelResolver = this['panel']['timeline'],
      { project: project2, scene: scene2, shot: shot } = this['panel']['context']();
    enabled === 'timeline-delivery-close-preview' &&
      (this['clearPreview'](), importedModelResolver['requestRender']?.());
    if (enabled === 'timeline-delivery-clear-screenshots')
      importedModelResolver['commitMutation']({
        type: 'director-screenshots',
        label: '清空截图历史',
        mutate: (source) => {
          return (
            (source['scenes']['find']((next) => next['id'] === scene2['id'])['directorSettings'][
              'screenshots'
            ] = []),
            source
          );
        },
      });
    if (enabled === 'timeline-delivery-preview')
      void this['run']('正在读取截图…', async () => {
        const args = scene2['directorSettings']['screenshots']['find'](
          (current) => current['assetId'] === el2['dataset']['assetId'],
        );
        if (!args) return;
        const enabled2 = await importedModelResolver['getBinaryAssetRepository']()['get'](args['assetId']);
        if (!enabled2) throw new Error('截图素材已缺失，请重新截图。');
        if (
          this['disposed'] ||
          importedModelResolver['_context']()['project']['id'] !== project2['id'] ||
          importedModelResolver['_context']()['scene']['id'] !== scene2['id']
        )
          return;
        (this['clearPreview'](),
          (this['preview'] = {
            ...args,
            url: createTrackedMediaObjectUrl(enabled2['primaryFile']['blob'], {
              kind: 'image',
              ownerId: 'director-screenshot:' + project2['id'] + ':' + args['assetId'],
            }),
          }));
      });
    (enabled === 'timeline-delivery-restore' || enabled === 'timeline-delivery-forget') &&
      importedModelResolver['commitMutation']({
        type: 'director-recovery',
        label: '编辑回收站',
        mutate: (recycleBin) =>
          enabled['endsWith']('restore')
            ? restoreDirectorRecycleEntry(recycleBin, el2['dataset']['entryId'])
            : {
                ...recycleBin,
                recycleBin: recycleBin['recycleBin']['filter'](
                  (entry) => entry['id'] !== el2['dataset']['entryId'],
                ),
              },
      });
    if (enabled === 'timeline-delivery-package')
      void this['run']('正在打包项目与素材…', async () => {
        const exportDirectorProjectPackage2 = await exportDirectorProjectPackage(
          project2,
          importedModelResolver['getBinaryAssetRepository'](),
        );
        if (!this['disposed'])
          downloadDirectorProjectPackage(
            exportDirectorProjectPackage2,
            project2['name'],
            importedModelResolver['window'],
          );
      });
    if (enabled === 'timeline-delivery-capture') {
      const time = importedModelResolver['_timeForShot'](shot);
      void this['run']('正在保存播放头截图…', async () => {
        const blob = await captureDirectorShotFrame({
          project: project2,
          sceneId: scene2['id'],
          shotId: shot['id'],
          time: time,
          importedModelResolver: importedModelResolver['getImportedModel'],
          windowObject: importedModelResolver['window'],
        });
        if (this['disposed']) return;
        const assetId = 'screenshot-' + globalThis['crypto']['randomUUID']();
        await importedModelResolver['getBinaryAssetRepository']()['put']({
          assetId: assetId,
          kind: 'background',
          descriptor: {
            projectId: project2['id'],
            sceneId: scene2['id'],
            shotId: shot['id'],
            time: time,
          },
          primaryFile: { name: shot['name'] + '.png', blob: blob['blob'] },
          relatedFiles: [],
        });
        if (this['disposed'] || importedModelResolver['_context']()['project']['id'] !== project2['id'])
          return;
        (importedModelResolver['commitMutation']({
          type: 'director-screenshot',
          label: '保存镜头截图',
          mutate: (record) => {
            const enabled3 = record['scenes']['find']((payload) => payload['id'] === scene2['id']);
            if (!enabled3) return record;
            return (
              (enabled3['directorSettings']['screenshots'] ||= [])['push']({
                assetId: assetId,
                name: shot['name'],
                shotId: shot['id'],
                time: time,
                width: blob['width'],
                height: blob['height'],
              }),
              record
            );
          },
        }),
          this['selected']['add'](assetId));
      });
    }
    if (enabled === 'timeline-delivery-send')
      void this['run']('正在读取截图并发送到画布…', async () => {
        const width = (scene2['directorSettings']?.['screenshots'] || [])['filter']((handle) =>
            this['selected']['has'](handle['assetId']),
          ),
          results = await importedModelResolver['getBinaryAssetRepository']()['getMany'](
            width['map']((state) => state['assetId']),
          );
        if (results['some']((enabled4) => !enabled4)) throw new Error('部分截图素材已缺失，请重新截图。');
        if (!this['disposed'])
          importedModelResolver['sendResults']({
            project: project2,
            options: { mode: 'sequence-png', returnToCanvas: !![], destination: 'canvas' },
            results: results['map']((blob2, config) => ({
              blob: blob2['primaryFile']['blob'],
              width: width[config]['width'],
              height: width[config]['height'],
            })),
          });
      });
    return !![];
  }
  ['clearPreview']() {
    if (this['preview']) revokeTrackedMediaObjectUrl(this['preview']['url']);
    this['preview'] = null;
  }
  ['destroy']() {
    ((this['disposed'] = !![]), this['clearPreview']());
  }
}
