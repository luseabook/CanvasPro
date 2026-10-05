import { getDirectorPanoramaModels } from './directorGenerationService.js';
import { restoreDirectorLayerVersion } from './directorGeneratedLayers.js';
import { bindWorkspacePrices } from '../../components/shared/workspacePriceBindings.js';
const escape = (value) =>
  String(value ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('"', '&quot;')
    ['replaceAll']('<', '&lt;');
export class DirectorGenerationPanel {
  constructor(item) {
    ((this['panel'] = item),
      (this['prompt'] = ''),
      (this['kind'] = 'layer'),
      (this['layerId'] = ''),
      (this['model'] = ''),
      (this['files'] = []));
  }
  ['syncPrices']() {
    const enabled = this['panel']['timeline']['getRoot']?.();
    if (!enabled) return;
    (this['priceRoot'] !== enabled &&
      (this['pricing']?.['destroy'](),
      (this['priceRoot'] = enabled),
      (this['pricing'] = bindWorkspacePrices(enabled, [
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
                  hasReferences: this['files']['length'] > 0,
                }
              : {
                  ...this['panel']['timeline']['getGenerationContext']?.(),
                  prompt: this['prompt'],
                  hasReferences: this['files']['length'] > 0,
                },
        },
      ]))),
      this['pricing']['syncPrices']());
  }
  ['destroy']() {
    (this['pricing']?.['destroy'](), (this['pricing'] = null), (this['priceRoot'] = null));
  }
  ['render']() {
    const { project: project, scene: scene } = this['panel']['context'](),
      list = getDirectorPanoramaModels();
    if (!list['some']((key) => key['modelId'] === this['model']))
      this['model'] = list[0]?.['modelId'] || '';
    const list2 = (project['generationJobs'] || [])
        ['filter']((index) => index['sceneId'] === scene['id'])
        ['slice'](-8)
        ['reverse'](),
      result = list2['some']((response) => response['status'] === 'running');
    return (
      '<fieldset data-director-generation><legend>AI 生成层与全景</legend><div class="storyboard-3d-director-fields">\n      <label>任务<select data-director-generation="kind"><option value="layer" ' +
      (this['kind'] === 'layer' ? 'selected' : '') +
      '>可编辑场景层</option><option value="panorama" ' +
      (this['kind'] === 'panorama' ? 'selected' : '') +
      '>球面全景图片</option></select></label>\n      ' +
      (this['kind'] === 'panorama'
        ? '<label>图像模型<select data-director-generation="model">' +
          list['map'](
            (data) =>
              '<option value="' +
              escape(data['modelId']) +
              '" ' +
              (this['model'] === data['modelId'] ? 'selected' : '') +
              '>' +
              escape(data['providerLabel']) +
              ' · ' +
              escape(data['label']) +
              '</option>',
          )['join']('') +
          '</select></label>'
        : '<label>结果位置<select data-director-generation="layerId"><option value="">插入新生成层</option>' +
          (scene['generatedLayers'] || [])
            ['map'](
              (error) =>
                '<option value="' +
                escape(error['id']) +
                '" ' +
                (error['id'] === this['layerId'] ? 'selected' : '') +
                '>替换 ' +
                escape(error['name']) +
                '</option>',
            )
            ['join']('') +
          '</select></label>') +
      '\n      <label>参考图片（最多 6 张）<input type="file" accept="image/*" multiple data-director-generation-files></label><span>' +
      this['files']['map']((error2) => escape(error2['name']))['join']('、') +
      '</span>\n      <label>场景描述<textarea rows="3" maxlength="5000" data-director-generation="prompt">' +
      escape(this['prompt']) +
      '</textarea></label>\n      <button data-storyboard-3d-action="timeline-generation-start" ' +
      (result ? 'disabled' : '') +
      '>' +
      (result ? '后台生成中…' : '开始生成') +
      '</button>\n    </div>' +
      (result ? '<progress aria-label="正在生成"></progress>' : '') +
      '\n    ' +
      list2['map'](
        (error3) =>
          '<p role="status">' + escape(error3['message']) + ' · ' + escape(error3['model']) + '</p>',
      )['join']('') +
      '\n    ' +
      (scene['generatedLayers'] || [])
        ['map'](
          (error4) =>
            '<details><summary>' +
            escape(error4['name']) +
            ' · ' +
            error4['objectIds']['length'] +
            ' 个对象 · ' +
            error4['versions']['length'] +
            ' 个历史版本</summary>' +
            error4['versions']
              ['map'](
                (error5) =>
                  '<button data-storyboard-3d-action="timeline-generation-restore" data-layer-id="' +
                  escape(error4['id']) +
                  '" data-version-id="' +
                  escape(error5['id']) +
                  '">恢复 ' +
                  escape(error5['name']) +
                  '</button>',
              )
              ['join']('') +
            '</details>',
        )
        ['join']('') +
      '</fieldset>'
    );
  }
  ['change'](event) {
    const el = event['target'];
    if (el['matches']?.('[data-director-generation-files]')) {
      const list3 = Array['from'](el['files'] || []);
      el['value'] = '';
      if (
        list3['length'] > 6 ||
        list3['some'](
          (enabled2) => !enabled2['type']['startsWith']('image/') || enabled2['size'] > 32 * 1024 * 1024,
        )
      )
        this['panel']['timeline']['setMessage']?.('最多选择 6 张图片，每张不超过 32 MB。');
      else ((this['files'] = list3), this['panel']['timeline']['requestRender']?.());
      return !![];
    }
    if (!el['matches']?.('[data-director-generation]')) return ![];
    this[el['dataset']['directorGeneration']] = el['value'];
    if (el['dataset']['directorGeneration'] === 'kind') this['panel']['timeline']['requestRender']?.();
    return !![];
  }
  ['click'](enabled3, el2) {
    if (!enabled3['startsWith']('timeline-generation-')) return ![];
    const { project: project2, scene: scene2 } = this['panel']['context'](),
      options = this['panel']['timeline'];
    if (enabled3 === 'timeline-generation-start') {
      if (!this['prompt']['trim']()) return (options['setMessage']?.('请输入场景描述。'), !![]);
      const provider = options['getGenerationContext']?.() || {};
      options['requestGeneration']?.({
        projectId: project2['id'],
        sceneId: scene2['id'],
        prompt: this['prompt'],
        kind: this['kind'],
        layerId: this['layerId'],
        model: this['kind'] === 'panorama' ? this['model'] : provider['model'],
        provider: provider['provider'],
        assets: provider['assets'],
        files: this['files'],
      });
    }
    if (enabled3 === 'timeline-generation-restore')
      this['panel']['scenePanel']['mutate']('恢复生成层历史', (target) =>
        restoreDirectorLayerVersion(target, el2['dataset']['layerId'], el2['dataset']['versionId']),
      );
    return !![];
  }
}
