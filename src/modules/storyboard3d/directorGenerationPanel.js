import { getDirectorPanoramaModels } from './directorGenerationService.js';
import { restoreDirectorLayerVersion } from './directorGeneratedLayers.js';
import { bindWorkspacePrices } from '../../components/shared/workspacePriceBindings.js';
const escape = (_0x3fe0fd) =>
  String(_0x3fe0fd ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('<', '&lt;');
export class DirectorGenerationPanel {
  constructor(_0x3eb1ec) {
    ((this['panel'] = _0x3eb1ec),
      (this['prompt'] = ''),
      (this['kind'] = 'layer'),
      (this['layerId'] = ''),
      (this['model'] = ''),
      (this['files'] = []));
  }
  ['syncPrices']() {
    const _0x5be8f3 = this['panel']['timeline']['getRoot']?.();
    if (!_0x5be8f3) return;
    (this['priceRoot'] !== _0x5be8f3 &&
      (this['pricing']?.['destroy'](),
      (this['priceRoot'] = _0x5be8f3),
      (this['pricing'] = bindWorkspacePrices(_0x5be8f3, [
        {
          selector: '[data-storyboard-3d-action="timeline-generation-start"]',
          getData: () =>
            this['kind'] === 'panorama'
              ? {
                  model: this['model'],
                  prompt:
                    '360-degree equirectangular panorama, seamless horizontal wrap, 2:1 projection, continuous horizon, no text. ' +
                    this['prompt'],
                  generationParams: { aspectRatio: '2:1' },
                  hasReferences: this['files']['length'] > 0x0,
                }
              : {
                  ...this['panel']['timeline']['getGenerationContext']?.(),
                  prompt: this['prompt'],
                  hasReferences: this['files']['length'] > 0x0,
                },
        },
      ]))),
      this['pricing']['syncPrices']());
  }
  ['destroy']() {
    (this['pricing']?.['destroy'](), (this['pricing'] = null), (this['priceRoot'] = null));
  }
  ['render']() {
    const { project: _0x527456, scene: _0x447203 } = this['panel']['context'](),
      _0x448e86 = getDirectorPanoramaModels();
    if (!_0x448e86['some']((_0x4e37ae) => _0x4e37ae['modelId'] === this['model']))
      this['model'] = _0x448e86[0x0]?.['modelId'] || '';
    const _0x23f785 = (_0x527456['generationJobs'] || [])
        ['filter']((_0x57cecd) => _0x57cecd['sceneId'] === _0x447203['id'])
        ['slice'](-0x8)
        ['reverse'](),
      _0x11dc55 = _0x23f785['some']((_0x1608ae) => _0x1608ae['status'] === 'running');
    return (
      '<fieldset data-director-generation><legend>AI 生成层与全景</legend><div class="storyboard-3d-director-fields">\n      <label>任务<select data-director-generation="kind"><option value="layer" ' +
      (this['kind'] === 'layer' ? 'selected' : '') +
      '>可编辑场景层</option><option value="panorama" ' +
      (this['kind'] === 'panorama' ? 'selected' : '') +
      '>球面全景图片</option></select></label>\x0a\x20\x20\x20\x20\x20\x20' +
      (this['kind'] === 'panorama'
        ? '<label>图像模型<select data-director-generation="model">' +
          _0x448e86['map'](
            (_0x1bb592) =>
              '<option value="' +
              escape(_0x1bb592['modelId']) +
              '\x22\x20' +
              (this['model'] === _0x1bb592['modelId'] ? 'selected' : '') +
              '>' +
              escape(_0x1bb592['providerLabel']) +
              '\x20·\x20' +
              escape(_0x1bb592['label']) +
              '</option>',
          )['join']('') +
          '</select></label>'
        : '<label>结果位置<select\x20data-director-generation=\x22layerId\x22><option\x20value=\x22\x22>插入新生成层</option>' +
          (_0x447203['generatedLayers'] || [])
            ['map'](
              (_0x2fe043) =>
                '<option\x20value=\x22' +
                escape(_0x2fe043['id']) +
                '\x22\x20' +
                (_0x2fe043['id'] === this['layerId'] ? 'selected' : '') +
                '>替换 ' +
                escape(_0x2fe043['name']) +
                '</option>',
            )
            ['join']('') +
          '</select></label>') +
      '\n      <label>参考图片（最多 6 张）<input type="file" accept="image/*" multiple data-director-generation-files></label><span>' +
      this['files']['map']((_0x578dbc) => escape(_0x578dbc['name']))['join']('、') +
      '</span>\n      <label>场景描述<textarea rows="3" maxlength="5000" data-director-generation="prompt">' +
      escape(this['prompt']) +
      '</textarea></label>\n      <button data-storyboard-3d-action="timeline-generation-start" ' +
      (_0x11dc55 ? 'disabled' : '') +
      '>' +
      (_0x11dc55 ? '后台生成中…' : '开始生成') +
      '</button>\n    </div>' +
      (_0x11dc55 ? '<progress aria-label="正在生成"></progress>' : '') +
      '\n    ' +
      _0x23f785['map'](
        (_0x475e84) =>
          '<p role="status">' + escape(_0x475e84['message']) + ' · ' + escape(_0x475e84['model']) + '</p>',
      )['join']('') +
      '\x0a\x20\x20\x20\x20' +
      (_0x447203['generatedLayers'] || [])
        ['map'](
          (_0x158984) =>
            '<details><summary>' +
            escape(_0x158984['name']) +
            ' · ' +
            _0x158984['objectIds']['length'] +
            ' 个对象 · ' +
            _0x158984['versions']['length'] +
            ' 个历史版本</summary>' +
            _0x158984['versions']
              ['map'](
                (_0x4f8a5e) =>
                  '<button data-storyboard-3d-action="timeline-generation-restore" data-layer-id="' +
                  escape(_0x158984['id']) +
                  '\x22\x20data-version-id=\x22' +
                  escape(_0x4f8a5e['id']) +
                  '\x22>恢复\x20' +
                  escape(_0x4f8a5e['name']) +
                  '</button>',
              )
              ['join']('') +
            '</details>',
        )
        ['join']('') +
      '</fieldset>'
    );
  }
  ['change'](_0x4493af) {
    const _0x3cbc85 = _0x4493af['target'];
    if (_0x3cbc85['matches']?.('[data-director-generation-files]')) {
      const _0x4801f1 = Array['from'](_0x3cbc85['files'] || []);
      _0x3cbc85['value'] = '';
      if (
        _0x4801f1['length'] > 0x6 ||
        _0x4801f1['some'](
          (_0x11a787) =>
            !_0x11a787['type']['startsWith']('image/') || _0x11a787['size'] > 0x20 * 0x400 * 0x400,
        )
      )
        this['panel']['timeline']['setMessage']?.('最多选择 6 张图片，每张不超过 32 MB。');
      else ((this['files'] = _0x4801f1), this['panel']['timeline']['requestRender']?.());
      return !![];
    }
    if (!_0x3cbc85['matches']?.('[data-director-generation]')) return ![];
    this[_0x3cbc85['dataset']['directorGeneration']] = _0x3cbc85['value'];
    if (_0x3cbc85['dataset']['directorGeneration'] === 'kind') this['panel']['timeline']['requestRender']?.();
    return !![];
  }
  ['click'](_0x4862f8, _0x55149c) {
    if (!_0x4862f8['startsWith']('timeline-generation-')) return ![];
    const { project: _0x25014e, scene: _0x1c0384 } = this['panel']['context'](),
      _0x46f702 = this['panel']['timeline'];
    if (_0x4862f8 === 'timeline-generation-start') {
      if (!this['prompt']['trim']()) return (_0x46f702['setMessage']?.('请输入场景描述。'), !![]);
      const _0x5b5961 = _0x46f702['getGenerationContext']?.() || {};
      _0x46f702['requestGeneration']?.({
        projectId: _0x25014e['id'],
        sceneId: _0x1c0384['id'],
        prompt: this['prompt'],
        kind: this['kind'],
        layerId: this['layerId'],
        model: this['kind'] === 'panorama' ? this['model'] : _0x5b5961['model'],
        provider: _0x5b5961['provider'],
        assets: _0x5b5961['assets'],
        files: this['files'],
      });
    }
    if (_0x4862f8 === 'timeline-generation-restore')
      this['panel']['scenePanel']['mutate']('恢复生成层历史', (_0x55aaaf) =>
        restoreDirectorLayerVersion(
          _0x55aaaf,
          _0x55149c['dataset']['layerId'],
          _0x55149c['dataset']['versionId'],
        ),
      );
    return !![];
  }
}
