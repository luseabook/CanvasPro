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
const escape = (_0x3e679c) =>
  String(_0x3e679c ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('<', '&lt;');
export class DirectorDeliveryPanel {
  constructor(_0x324712) {
    ((this['panel'] = _0x324712),
      (this['busy'] = ''),
      (this['selected'] = new Set()),
      (this['disposed'] = ![]));
  }
  ['render']() {
    const { project: _0x18f045, scene: _0x38f218 } = this['panel']['context'](),
      _0x1fb8f6 = _0x38f218['directorSettings']?.['screenshots'] || [];
    this['selected'] = new Set(
      [...this['selected']]['filter']((_0x5f07a4) =>
        _0x1fb8f6['some']((_0x31c5dd) => _0x31c5dd['assetId'] === _0x5f07a4),
      ),
    );
    if (
      this['preview'] &&
      !_0x1fb8f6['some']((_0x6a5a18) => _0x6a5a18['assetId'] === this['preview']['assetId'])
    )
      this['clearPreview']();
    return (
      '<fieldset data-director-delivery aria-busy="' +
      Boolean(this['busy']) +
      '"><legend>截图、项目迁移与恢复</legend><div class="storyboard-3d-director-fields">\n      <button data-storyboard-3d-action="timeline-delivery-capture" ' +
      (this['busy'] ? 'disabled' : '') +
      '>保存播放头截图</button><button data-storyboard-3d-action="timeline-delivery-send" ' +
      (this['busy'] || !this['selected']['size'] ? 'disabled' : '') +
      '>选中截图发送到画布</button>\n      <button data-storyboard-3d-action="timeline-delivery-clear-screenshots" ' +
      (this['busy'] || !_0x1fb8f6['length'] ? 'disabled' : '') +
      '>清空截图历史</button>\n      <button data-storyboard-3d-action="timeline-delivery-package" ' +
      (this['busy'] ? 'disabled' : '') +
      '>导出项目与素材</button><label>导入项目包<input\x20type=\x22file\x22\x20accept=\x22.aic3d\x22\x20data-director-package-file\x20' +
      (this['busy'] ? 'disabled' : '') +
      '></label>\n    </div>' +
      (this['busy']
        ? '<p role="status">' + escape(this['busy']) + '</p><progress aria-label="正在处理"></progress>'
        : '') +
      '\n    <div class="storyboard-3d-director-fields">' +
      (_0x1fb8f6['map'](
        (_0x29bfd4) =>
          '<label><input type="checkbox" data-director-screenshot="' +
          escape(_0x29bfd4['assetId']) +
          '\x22\x20' +
          (this['selected']['has'](_0x29bfd4['assetId']) ? 'checked' : '') +
          '>' +
          escape(_0x29bfd4['name']) +
          ' · ' +
          _0x29bfd4['time']['toFixed'](0x2) +
          's</label><button data-storyboard-3d-action="timeline-delivery-preview" data-asset-id="' +
          escape(_0x29bfd4['assetId']) +
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
      (_0x18f045['recycleBin'] || [])['length'] +
      ' 项（保留最近 20 次）</summary>' +
      (_0x18f045['recycleBin'] || [])
        ['slice']()
        ['reverse']()
        ['map'](
          (_0xed0986) =>
            '<div class="storyboard-3d-director-fields"><span>' +
            escape(_0xed0986['label']) +
            ' · ' +
            new Date(_0xed0986['deletedAt'])['toLocaleString']() +
            '</span><button data-storyboard-3d-action="timeline-delivery-restore" data-entry-id="' +
            escape(_0xed0986['id']) +
            '">恢复</button><button data-storyboard-3d-action="timeline-delivery-forget" data-entry-id="' +
            escape(_0xed0986['id']) +
            '">永久移除记录</button></div>',
        )
        ['join']('') +
      '</details></fieldset>'
    );
  }
  ['change'](_0x4a52da) {
    const _0xb62842 = _0x4a52da['target'];
    if (_0xb62842['matches']?.('[data-director-package-file]')) {
      const _0x1eb6bd = _0xb62842['files']?.[0x0];
      _0xb62842['value'] = '';
      if (_0x1eb6bd)
        void this['run']('正在导入项目与素材…', async () => {
          const _0x36c0c3 = await importDirectorProjectPackage(
            _0x1eb6bd,
            this['panel']['timeline']['getBinaryAssetRepository'](),
          );
          if (!this['disposed']) this['panel']['timeline']['importProject'](_0x36c0c3);
        });
      return !![];
    }
    if (_0xb62842['matches']?.('[data-director-screenshot]')) {
      if (_0xb62842['checked']) this['selected']['add'](_0xb62842['dataset']['directorScreenshot']);
      else this['selected']['delete'](_0xb62842['dataset']['directorScreenshot']);
      return (this['panel']['timeline']['requestRender']?.(), !![]);
    }
    return ![];
  }
  async ['run'](_0xabca6, _0x188449) {
    if (this['busy'] || this['disposed']) return;
    ((this['busy'] = _0xabca6), this['panel']['timeline']['requestRender']?.());
    try {
      await _0x188449();
    } catch (_0x5933b9) {
      if (!this['disposed']) this['panel']['timeline']['setMessage']?.(_0x5933b9['message']);
    } finally {
      this['busy'] = '';
      if (!this['disposed']) this['panel']['timeline']['requestRender']?.();
    }
  }
  ['click'](_0x5a7594, _0x13847b) {
    if (!_0x5a7594['startsWith']('timeline-delivery-')) return ![];
    const _0x5bec2d = this['panel']['timeline'],
      { project: _0x1cf324, scene: _0x2405c2, shot: _0x1258e3 } = this['panel']['context']();
    _0x5a7594 === 'timeline-delivery-close-preview' &&
      (this['clearPreview'](), _0x5bec2d['requestRender']?.());
    if (_0x5a7594 === 'timeline-delivery-clear-screenshots')
      _0x5bec2d['commitMutation']({
        type: 'director-screenshots',
        label: '清空截图历史',
        mutate: (_0x5a8e0a) => {
          return (
            (_0x5a8e0a['scenes']['find']((_0x16b818) => _0x16b818['id'] === _0x2405c2['id'])[
              'directorSettings'
            ]['screenshots'] = []),
            _0x5a8e0a
          );
        },
      });
    if (_0x5a7594 === 'timeline-delivery-preview')
      void this['run']('正在读取截图…', async () => {
        const _0x5928b4 = _0x2405c2['directorSettings']['screenshots']['find'](
          (_0x4a8646) => _0x4a8646['assetId'] === _0x13847b['dataset']['assetId'],
        );
        if (!_0x5928b4) return;
        const _0x2f89de = await _0x5bec2d['getBinaryAssetRepository']()['get'](_0x5928b4['assetId']);
        if (!_0x2f89de) throw new Error('截图素材已缺失，请重新截图。');
        if (
          this['disposed'] ||
          _0x5bec2d['_context']()['project']['id'] !== _0x1cf324['id'] ||
          _0x5bec2d['_context']()['scene']['id'] !== _0x2405c2['id']
        )
          return;
        (this['clearPreview'](),
          (this['preview'] = {
            ..._0x5928b4,
            url: createTrackedMediaObjectUrl(_0x2f89de['primaryFile']['blob'], {
              kind: 'image',
              ownerId: 'director-screenshot:' + _0x1cf324['id'] + ':' + _0x5928b4['assetId'],
            }),
          }));
      });
    (_0x5a7594 === 'timeline-delivery-restore' || _0x5a7594 === 'timeline-delivery-forget') &&
      _0x5bec2d['commitMutation']({
        type: 'director-recovery',
        label: '编辑回收站',
        mutate: (_0x2e8228) =>
          _0x5a7594['endsWith']('restore')
            ? restoreDirectorRecycleEntry(_0x2e8228, _0x13847b['dataset']['entryId'])
            : {
                ..._0x2e8228,
                recycleBin: _0x2e8228['recycleBin']['filter'](
                  (_0x5002f9) => _0x5002f9['id'] !== _0x13847b['dataset']['entryId'],
                ),
              },
      });
    if (_0x5a7594 === 'timeline-delivery-package')
      void this['run']('正在打包项目与素材…', async () => {
        const _0xad3c82 = await exportDirectorProjectPackage(
          _0x1cf324,
          _0x5bec2d['getBinaryAssetRepository'](),
        );
        if (!this['disposed'])
          downloadDirectorProjectPackage(_0xad3c82, _0x1cf324['name'], _0x5bec2d['window']);
      });
    if (_0x5a7594 === 'timeline-delivery-capture') {
      const _0x58bfc0 = _0x5bec2d['_timeForShot'](_0x1258e3);
      void this['run']('正在保存播放头截图…', async () => {
        const _0x13bab3 = await captureDirectorShotFrame({
          project: _0x1cf324,
          sceneId: _0x2405c2['id'],
          shotId: _0x1258e3['id'],
          time: _0x58bfc0,
          importedModelResolver: _0x5bec2d['getImportedModel'],
          windowObject: _0x5bec2d['window'],
        });
        if (this['disposed']) return;
        const _0x1a9151 = 'screenshot-' + globalThis['crypto']['randomUUID']();
        await _0x5bec2d['getBinaryAssetRepository']()['put']({
          assetId: _0x1a9151,
          kind: 'background',
          descriptor: {
            projectId: _0x1cf324['id'],
            sceneId: _0x2405c2['id'],
            shotId: _0x1258e3['id'],
            time: _0x58bfc0,
          },
          primaryFile: { name: _0x1258e3['name'] + '.png', blob: _0x13bab3['blob'] },
          relatedFiles: [],
        });
        if (this['disposed'] || _0x5bec2d['_context']()['project']['id'] !== _0x1cf324['id']) return;
        (_0x5bec2d['commitMutation']({
          type: 'director-screenshot',
          label: '保存镜头截图',
          mutate: (_0x4cacba) => {
            const _0x200f6b = _0x4cacba['scenes']['find']((_0x4e2af5) => _0x4e2af5['id'] === _0x2405c2['id']);
            if (!_0x200f6b) return _0x4cacba;
            return (
              (_0x200f6b['directorSettings']['screenshots'] ||= [])['push']({
                assetId: _0x1a9151,
                name: _0x1258e3['name'],
                shotId: _0x1258e3['id'],
                time: _0x58bfc0,
                width: _0x13bab3['width'],
                height: _0x13bab3['height'],
              }),
              _0x4cacba
            );
          },
        }),
          this['selected']['add'](_0x1a9151));
      });
    }
    if (_0x5a7594 === 'timeline-delivery-send')
      void this['run']('正在读取截图并发送到画布…', async () => {
        const _0x34eeea = (_0x2405c2['directorSettings']?.['screenshots'] || [])['filter']((_0x21b13b) =>
            this['selected']['has'](_0x21b13b['assetId']),
          ),
          _0x698416 = await _0x5bec2d['getBinaryAssetRepository']()['getMany'](
            _0x34eeea['map']((_0x3ab379) => _0x3ab379['assetId']),
          );
        if (_0x698416['some']((_0x2e9c31) => !_0x2e9c31)) throw new Error('部分截图素材已缺失，请重新截图。');
        if (!this['disposed'])
          _0x5bec2d['sendResults']({
            project: _0x1cf324,
            options: { mode: 'sequence-png', returnToCanvas: !![], destination: 'canvas' },
            results: _0x698416['map']((_0x18308d, _0x18fbb6) => ({
              blob: _0x18308d['primaryFile']['blob'],
              width: _0x34eeea[_0x18fbb6]['width'],
              height: _0x34eeea[_0x18fbb6]['height'],
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
