export const GPT_IMAGE_2_5_MODE_FIELD = Object['freeze']({
  id: 'mode',
  type: 'segmented',
  placement: 'mode',
  variant: 'pillMenu',
  label: 'Mode',
  menuTitle: '模式选择',
  defaultValue: 'flare',
  menuTooltip: 'Flare 侧重生成速度，Sunburst 侧重编辑精度。',
  options: Object['freeze']([
    Object['freeze']({
      value: 'flare',
      label: 'Flare',
      selectedLabel: 'Flare',
      description: '生成速度更快，适合日常高质量出图、批量生成和快速原型。',
    }),
    Object['freeze']({
      value: 'sunburst',
      label: 'Sunburst',
      selectedLabel: 'Sunburst',
      description: '编辑精度优先，适合成品级商品图、投放创意和多轮精细编辑。',
    }),
  ]),
});
