function normalizeKey(value) {
  return String(value || '')['trim']();
}
function normalizeType(item) {
  return normalizeKey(item)['toLowerCase']();
}
const CAPABILITY_KEYS = ['render', 'sync', 'bind', 'normalize'];
function normalizeAdapterCapabilities(options = {}) {
  const key = {};
  return (
    CAPABILITY_KEYS['forEach']((index) => {
      typeof options[index] === 'function' && (key[index] = options[index]);
    }),
    key
  );
}
function createAdapterRegistry(list2 = [], renderer = '') {
  const list3 = list2['map']((matches) => ({
    id: normalizeKey(matches['id']),
    renderer: normalizeKey(matches['renderer']),
    matches: matches['matches'],
    ...normalizeAdapterCapabilities(matches),
  }));
  return {
    register(matches2 = {}) {
      const enabled = {
        id: normalizeKey(matches2['id']),
        renderer: normalizeKey(matches2['renderer']),
        matches: matches2['matches'],
        ...normalizeAdapterCapabilities(matches2),
      };
      if (!enabled['id']) throw new Error('UI schema adapter id is required');
      if (list3['some']((result) => result['id'] === enabled['id']))
        throw new Error('UI schema adapter id is already registered: ' + enabled['id']);
      if (typeof enabled['matches'] !== 'function')
        throw new Error('UI schema adapter matcher is required');
      return (
        list3['unshift'](enabled),
        () => {
          const count = list3['findIndex']((data) => data === enabled);
          if (count >= 0) list3['splice'](count, 1);
        }
      );
    },
    resolve(options2 = {}) {
      const target = list3['find']((source) => source['matches'](options2));
      return target ? target['renderer'] : renderer;
    },
    resolveDefinition(options3 = {}) {
      const next = list3['find']((current) => current['matches'](options3));
      if (next) return next;
      return { id: 'fallback', renderer: renderer, matches: () => true };
    },
    get(entry = '') {
      const key2 = normalizeKey(entry);
      if (!key2) return null;
      return list3['find']((record) => record['id'] === key2) || null;
    },
    configure(payload = '', handle = {}) {
      const enabled2 = this['get'](payload);
      if (!enabled2) throw new Error('UI schema adapter id is not registered: ' + payload);
      const state = {};
      return (
        CAPABILITY_KEYS['forEach']((config) => {
          state[config] = enabled2[config];
          if (typeof handle[config] === 'function') enabled2[config] = handle[config];
          else config in handle && delete enabled2[config];
        }),
        () => {
          CAPABILITY_KEYS['forEach']((scope) => {
            typeof state[scope] === 'function' ? (enabled2[scope] = state[scope]) : delete enabled2[scope];
          });
        }
      );
    },
    list() {
      return list3['map']((id) => ({
        id: id['id'],
        renderer: id['renderer'],
        capabilities: CAPABILITY_KEYS['filter']((input) => typeof id[input] === 'function'),
      }));
    },
  };
}
const fieldAdapterRegistry = createAdapterRegistry([
    {
      id: 'field.rhV54ControlMode',
      renderer: 'renderRhV54ControlModeField',
      matches: ({ variant: variant }) => variant === 'rhV54ControlMode',
    },
    {
      id: 'field.rhV54BooleanRow',
      renderer: 'renderRhV54BooleanRowField',
      matches: ({ variant: variant2 }) => variant2 === 'rhV54BooleanRow',
    },
    {
      id: 'field.rhV54MaskExpand',
      renderer: 'renderRhV54MaskExpandField',
      matches: ({ variant: variant3 }) => variant3 === 'rhV54MaskExpand',
    },
    {
      id: 'field.rhV54SpecialMode',
      renderer: 'renderRhV54SpecialModeField',
      matches: ({ variant: variant4 }) => variant4 === 'rhV54SpecialMode',
    },
    {
      id: 'field.rhV54BreastJiggle',
      renderer: 'renderRhV54BreastJiggleField',
      matches: ({ variant: variant5 }) => variant5 === 'rhV54BreastJiggle',
    },
    {
      id: 'field.advancedRow',
      renderer: 'renderAdvancedRowField',
      matches: ({ variant: variant6 }) => variant6 === 'advancedRow',
    },
    {
      id: 'field.randomSeedRow',
      renderer: 'renderRandomSeedRowField',
      matches: ({ variant: variant7 }) => variant7 === 'randomSeedRow',
    },
    {
      id: 'field.aspectRatio.segmented',
      renderer: 'renderAspectRatioPillField',
      matches: ({ field: field, type: type }) => {
        const key3 = normalizeKey(field?.['id'])['toLowerCase'](),
          key4 = normalizeKey(field?.['displayRole'])['toLowerCase']();
        return type === 'segmented' && (key3 === 'aspectratio' || key4 === 'aspectratio');
      },
    },
    {
      id: 'field.pillMenu.segmented',
      renderer: 'renderPillMenuField',
      matches: ({ variant: variant8, type: type2 }) => variant8 === 'pillMenu' && type2 === 'segmented',
    },
    {
      id: 'field.ratioPill.segmented',
      renderer: 'renderAspectRatioPillField',
      matches: ({ variant: variant9, type: type3 }) => variant9 === 'ratioPill' && type3 === 'segmented',
    },
    {
      id: 'field.voicePill.segmented',
      renderer: 'renderVoiceQualityRatioField',
      matches: ({ variant: variant10, type: type4 }) =>
        variant10 === 'voiceQualityRatio' && type4 === 'segmented',
    },
    {
      id: 'field.sectionMenu',
      renderer: 'renderSectionMenuField',
      matches: ({ variant: variant11, type: type5 }) => variant11 === 'sectionMenu' && type5 === 'segmented',
    },
    {
      id: 'field.resolutionPill.segmented',
      renderer: 'renderPillMenuField',
      matches: ({ variant: variant12, type: type6 }) =>
        variant12 === 'resolutionPill' && type6 === 'segmented',
    },
    {
      id: 'field.resolutionPill.slider',
      renderer: 'renderResolutionPillField',
      matches: ({ variant: variant13, type: type7 }) => variant13 === 'resolutionPill' && type7 === 'slider',
    },
    {
      id: 'field.durationPill.slider',
      renderer: 'renderDurationPillField',
      matches: ({ variant: variant14, type: type8 }) => variant14 === 'durationPill' && type8 === 'slider',
    },
    {
      id: 'field.instanceToggle.unsupported',
      renderer: '',
      matches: ({ variant: variant15, type: type9 }) =>
        variant15 === 'instanceToggle' && type9 !== 'segmented',
    },
    {
      id: 'field.instanceToggle.segmented',
      renderer: 'renderInstanceToggleField',
      matches: ({ variant: variant16, type: type10 }) =>
        variant16 === 'instanceToggle' && type10 === 'segmented',
    },
  ]),
  controlAdapterRegistry = createAdapterRegistry(
    [
      {
        id: 'control.segmented',
        renderer: 'renderSegmentedControl',
        matches: ({ type: type11 }) => type11 === 'segmented',
      },
      {
        id: 'control.select',
        renderer: 'renderSelectControl',
        matches: ({ type: type12 }) => type12 === 'select',
      },
      {
        id: 'control.slider',
        renderer: 'renderRangeControl',
        matches: ({ type: type13 }) => type13 === 'slider',
      },
      {
        id: 'control.stepper',
        renderer: 'renderRangeControl',
        matches: ({ type: type14 }) => type14 === 'stepper',
      },
      {
        id: 'control.toggle',
        renderer: 'renderToggleControl',
        matches: ({ type: type15 }) => type15 === 'toggle',
      },
      {
        id: 'control.text',
        renderer: 'renderTextControl',
        matches: ({ type: type16 }) => type16 === 'text',
      },
      {
        id: 'control.textarea',
        renderer: 'renderTextControl',
        matches: ({ type: type17 }) => type17 === 'textarea',
      },
    ],
    'renderAssetInputControl',
  );
export function registerUiSchemaFieldAdapter(output) {
  return fieldAdapterRegistry['register'](output);
}
export function registerUiSchemaControlAdapter(value2) {
  return controlAdapterRegistry['register'](value2);
}
export function configureUiSchemaFieldAdapter(value3, value4) {
  return fieldAdapterRegistry['configure'](value3, value4);
}
export function configureUiSchemaControlAdapter(value5, value6) {
  return controlAdapterRegistry['configure'](value5, value6);
}
export function listUiSchemaFieldAdapters() {
  return fieldAdapterRegistry['list']();
}
export function listUiSchemaControlAdapters() {
  return controlAdapterRegistry['list']();
}
export function resolveUiSchemaFieldAdapter(field2 = {}, options4 = {}) {
  const variant17 = normalizeKey(field2?.['variant'] || options4?.['variant']),
    type18 = normalizeType(options4?.['type'] || field2?.['type']);
  return fieldAdapterRegistry['resolve']({
    field: field2,
    options: options4,
    variant: variant17,
    type: type18,
  });
}
export function resolveUiSchemaFieldAdapterDefinition(field3 = {}, options5 = {}) {
  const variant18 = normalizeKey(field3?.['variant'] || options5?.['variant']),
    type19 = normalizeType(options5?.['type'] || field3?.['type']);
  return fieldAdapterRegistry['resolveDefinition']({
    field: field3,
    options: options5,
    variant: variant18,
    type: type19,
  });
}
export function getUiSchemaFieldAdapterDefinition(value7 = '') {
  return fieldAdapterRegistry['get'](value7);
}
export function resolveUiSchemaControlAdapter(value8 = '') {
  return controlAdapterRegistry['resolve']({ type: normalizeType(value8) });
}
export function resolveUiSchemaControlAdapterDefinition(value9 = '') {
  return controlAdapterRegistry['resolveDefinition']({ type: normalizeType(value9) });
}
