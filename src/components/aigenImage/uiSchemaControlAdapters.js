function normalizeKey(_0x3050cc) {
  return String(_0x3050cc || '')['trim']();
}
function normalizeType(_0x3abe95) {
  return normalizeKey(_0x3abe95)['toLowerCase']();
}
const CAPABILITY_KEYS = ['render', 'sync', 'bind', 'normalize'];
function normalizeAdapterCapabilities(_0x1f0186 = {}) {
  const _0x3776b4 = {};
  return (
    CAPABILITY_KEYS['forEach']((_0x5a731e) => {
      typeof _0x1f0186[_0x5a731e] === 'function' && (_0x3776b4[_0x5a731e] = _0x1f0186[_0x5a731e]);
    }),
    _0x3776b4
  );
}
function createAdapterRegistry(_0x290dfa = [], _0x266091 = '') {
  const _0x466a07 = _0x290dfa['map']((_0x13ea79) => ({
    id: normalizeKey(_0x13ea79['id']),
    renderer: normalizeKey(_0x13ea79['renderer']),
    matches: _0x13ea79['matches'],
    ...normalizeAdapterCapabilities(_0x13ea79),
  }));
  return {
    register(_0x59ddb5 = {}) {
      const _0x440e9f = {
        id: normalizeKey(_0x59ddb5['id']),
        renderer: normalizeKey(_0x59ddb5['renderer']),
        matches: _0x59ddb5['matches'],
        ...normalizeAdapterCapabilities(_0x59ddb5),
      };
      if (!_0x440e9f['id']) throw new Error('UI schema adapter id is required');
      if (_0x466a07['some']((_0x239eef) => _0x239eef['id'] === _0x440e9f['id']))
        throw new Error('UI schema adapter id is already registered: ' + _0x440e9f['id']);
      if (typeof _0x440e9f['matches'] !== 'function')
        throw new Error('UI\x20schema\x20adapter\x20matcher\x20is\x20required');
      return (
        _0x466a07['unshift'](_0x440e9f),
        () => {
          const _0x236aa7 = _0x466a07['findIndex']((_0x3fa1ab) => _0x3fa1ab === _0x440e9f);
          if (_0x236aa7 >= 0x0) _0x466a07['splice'](_0x236aa7, 0x1);
        }
      );
    },
    resolve(_0x13a30a = {}) {
      const _0x6c494f = _0x466a07['find']((_0x3cccc8) => _0x3cccc8['matches'](_0x13a30a));
      return _0x6c494f ? _0x6c494f['renderer'] : _0x266091;
    },
    resolveDefinition(_0x552edb = {}) {
      const _0x1588a4 = _0x466a07['find']((_0x53a659) => _0x53a659['matches'](_0x552edb));
      if (_0x1588a4) return _0x1588a4;
      return { id: 'fallback', renderer: _0x266091, matches: () => !![] };
    },
    get(_0x5df1b3 = '') {
      const _0x56b388 = normalizeKey(_0x5df1b3);
      if (!_0x56b388) return null;
      return _0x466a07['find']((_0xe19a84) => _0xe19a84['id'] === _0x56b388) || null;
    },
    configure(_0x26e270 = '', _0x5f4af1 = {}) {
      const _0x40c896 = this['get'](_0x26e270);
      if (!_0x40c896) throw new Error('UI schema adapter id is not registered: ' + _0x26e270);
      const _0x26f25c = {};
      return (
        CAPABILITY_KEYS['forEach']((_0x340c84) => {
          _0x26f25c[_0x340c84] = _0x40c896[_0x340c84];
          if (typeof _0x5f4af1[_0x340c84] === 'function') _0x40c896[_0x340c84] = _0x5f4af1[_0x340c84];
          else _0x340c84 in _0x5f4af1 && delete _0x40c896[_0x340c84];
        }),
        () => {
          CAPABILITY_KEYS['forEach']((_0x31ce55) => {
            typeof _0x26f25c[_0x31ce55] === 'function'
              ? (_0x40c896[_0x31ce55] = _0x26f25c[_0x31ce55])
              : delete _0x40c896[_0x31ce55];
          });
        }
      );
    },
    list() {
      return _0x466a07['map']((_0x88a38a) => ({
        id: _0x88a38a['id'],
        renderer: _0x88a38a['renderer'],
        capabilities: CAPABILITY_KEYS['filter']((_0x54ad64) => typeof _0x88a38a[_0x54ad64] === 'function'),
      }));
    },
  };
}
const fieldAdapterRegistry = createAdapterRegistry([
    {
      id: 'field.rhV54ControlMode',
      renderer: 'renderRhV54ControlModeField',
      matches: ({ variant: _0x505b63 }) => _0x505b63 === 'rhV54ControlMode',
    },
    {
      id: 'field.rhV54BooleanRow',
      renderer: 'renderRhV54BooleanRowField',
      matches: ({ variant: _0x147f1e }) => _0x147f1e === 'rhV54BooleanRow',
    },
    {
      id: 'field.rhV54MaskExpand',
      renderer: 'renderRhV54MaskExpandField',
      matches: ({ variant: _0x576dda }) => _0x576dda === 'rhV54MaskExpand',
    },
    {
      id: 'field.rhV54SpecialMode',
      renderer: 'renderRhV54SpecialModeField',
      matches: ({ variant: _0x4281ff }) => _0x4281ff === 'rhV54SpecialMode',
    },
    {
      id: 'field.rhV54BreastJiggle',
      renderer: 'renderRhV54BreastJiggleField',
      matches: ({ variant: _0x414b62 }) => _0x414b62 === 'rhV54BreastJiggle',
    },
    {
      id: 'field.advancedRow',
      renderer: 'renderAdvancedRowField',
      matches: ({ variant: _0x1e5179 }) => _0x1e5179 === 'advancedRow',
    },
    {
      id: 'field.randomSeedRow',
      renderer: 'renderRandomSeedRowField',
      matches: ({ variant: _0x3b1799 }) => _0x3b1799 === 'randomSeedRow',
    },
    {
      id: 'field.aspectRatio.segmented',
      renderer: 'renderAspectRatioPillField',
      matches: ({ field: _0x20337f, type: _0x23aee6 }) => {
        const _0x3cfde6 = normalizeKey(_0x20337f?.['id'])['toLowerCase'](),
          _0x3f172d = normalizeKey(_0x20337f?.['displayRole'])['toLowerCase']();
        return _0x23aee6 === 'segmented' && (_0x3cfde6 === 'aspectratio' || _0x3f172d === 'aspectratio');
      },
    },
    {
      id: 'field.pillMenu.segmented',
      renderer: 'renderPillMenuField',
      matches: ({ variant: _0x2bafed, type: _0x522c9b }) =>
        _0x2bafed === 'pillMenu' && _0x522c9b === 'segmented',
    },
    {
      id: 'field.ratioPill.segmented',
      renderer: 'renderAspectRatioPillField',
      matches: ({ variant: _0x501bb6, type: _0x133827 }) =>
        _0x501bb6 === 'ratioPill' && _0x133827 === 'segmented',
    },
    {
      id: 'field.voicePill.segmented',
      renderer: 'renderVoiceQualityRatioField',
      matches: ({ variant: _0x25160d, type: _0xb8435a }) =>
        _0x25160d === 'voiceQualityRatio' && _0xb8435a === 'segmented',
    },
    {
      id: 'field.sectionMenu',
      renderer: 'renderSectionMenuField',
      matches: ({ variant: _0x4076bc, type: _0x483e95 }) =>
        _0x4076bc === 'sectionMenu' && _0x483e95 === 'segmented',
    },
    {
      id: 'field.resolutionPill.segmented',
      renderer: 'renderPillMenuField',
      matches: ({ variant: _0x238281, type: _0x25a836 }) =>
        _0x238281 === 'resolutionPill' && _0x25a836 === 'segmented',
    },
    {
      id: 'field.resolutionPill.slider',
      renderer: 'renderResolutionPillField',
      matches: ({ variant: _0x4562bd, type: _0x206e5c }) =>
        _0x4562bd === 'resolutionPill' && _0x206e5c === 'slider',
    },
    {
      id: 'field.durationPill.slider',
      renderer: 'renderDurationPillField',
      matches: ({ variant: _0x3f12ed, type: _0x40fb26 }) =>
        _0x3f12ed === 'durationPill' && _0x40fb26 === 'slider',
    },
    {
      id: 'field.instanceToggle.unsupported',
      renderer: '',
      matches: ({ variant: _0x12936a, type: _0x3a5a2e }) =>
        _0x12936a === 'instanceToggle' && _0x3a5a2e !== 'segmented',
    },
    {
      id: 'field.instanceToggle.segmented',
      renderer: 'renderInstanceToggleField',
      matches: ({ variant: _0x3e521a, type: _0x197738 }) =>
        _0x3e521a === 'instanceToggle' && _0x197738 === 'segmented',
    },
  ]),
  controlAdapterRegistry = createAdapterRegistry(
    [
      {
        id: 'control.segmented',
        renderer: 'renderSegmentedControl',
        matches: ({ type: _0x1115aa }) => _0x1115aa === 'segmented',
      },
      {
        id: 'control.select',
        renderer: 'renderSelectControl',
        matches: ({ type: _0x3e9419 }) => _0x3e9419 === 'select',
      },
      {
        id: 'control.slider',
        renderer: 'renderRangeControl',
        matches: ({ type: _0x3e0252 }) => _0x3e0252 === 'slider',
      },
      {
        id: 'control.stepper',
        renderer: 'renderRangeControl',
        matches: ({ type: _0x20ec02 }) => _0x20ec02 === 'stepper',
      },
      {
        id: 'control.toggle',
        renderer: 'renderToggleControl',
        matches: ({ type: _0x2b4008 }) => _0x2b4008 === 'toggle',
      },
      {
        id: 'control.text',
        renderer: 'renderTextControl',
        matches: ({ type: _0x296778 }) => _0x296778 === 'text',
      },
      {
        id: 'control.textarea',
        renderer: 'renderTextControl',
        matches: ({ type: _0x41963b }) => _0x41963b === 'textarea',
      },
    ],
    'renderAssetInputControl',
  );
export function registerUiSchemaFieldAdapter(_0x47e758) {
  return fieldAdapterRegistry['register'](_0x47e758);
}
export function registerUiSchemaControlAdapter(_0x30377c) {
  return controlAdapterRegistry['register'](_0x30377c);
}
export function configureUiSchemaFieldAdapter(_0x12de02, _0x27beab) {
  return fieldAdapterRegistry['configure'](_0x12de02, _0x27beab);
}
export function configureUiSchemaControlAdapter(_0xe8771c, _0x4a6c57) {
  return controlAdapterRegistry['configure'](_0xe8771c, _0x4a6c57);
}
export function listUiSchemaFieldAdapters() {
  return fieldAdapterRegistry['list']();
}
export function listUiSchemaControlAdapters() {
  return controlAdapterRegistry['list']();
}
export function resolveUiSchemaFieldAdapter(_0x249bb0 = {}, _0x4bb088 = {}) {
  const _0x487e15 = normalizeKey(_0x249bb0?.['variant'] || _0x4bb088?.['variant']),
    _0xe9debb = normalizeType(_0x4bb088?.['type'] || _0x249bb0?.['type']);
  return fieldAdapterRegistry['resolve']({
    field: _0x249bb0,
    options: _0x4bb088,
    variant: _0x487e15,
    type: _0xe9debb,
  });
}
export function resolveUiSchemaFieldAdapterDefinition(_0x5bd867 = {}, _0x82a097 = {}) {
  const _0xa9bb3d = normalizeKey(_0x5bd867?.['variant'] || _0x82a097?.['variant']),
    _0x51323d = normalizeType(_0x82a097?.['type'] || _0x5bd867?.['type']);
  return fieldAdapterRegistry['resolveDefinition']({
    field: _0x5bd867,
    options: _0x82a097,
    variant: _0xa9bb3d,
    type: _0x51323d,
  });
}
export function getUiSchemaFieldAdapterDefinition(_0x220718 = '') {
  return fieldAdapterRegistry['get'](_0x220718);
}
export function resolveUiSchemaControlAdapter(_0x551ec8 = '') {
  return controlAdapterRegistry['resolve']({ type: normalizeType(_0x551ec8) });
}
export function resolveUiSchemaControlAdapterDefinition(_0x56e6b9 = '') {
  return controlAdapterRegistry['resolveDefinition']({ type: normalizeType(_0x56e6b9) });
}
