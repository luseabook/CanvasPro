import { bindUiSchemaBindingEvents, notifyUiSchemaMenuAfterOpen } from './uiSchemaBindingEvents.js';
export function createUiSchemaBindingSession(
  _0x1d9d33,
  { getNodeData: _0x17a8f5, commitFieldValue: _0x3acfb5 } = {},
  _0x3c7264 = {},
) {
  const {
    RANDOM_SEED_DEFAULT_MAX: _0x15b754,
    RANDOM_SEED_DEFAULT_MIN: _0x8f9d6b,
    UI_SCHEMA_POPUP_EXIT_MS: _0x2dfb47,
    evaluateUiSchemaNumberExpression: _0x274ac2,
    formatRhV54BreastJiggle: _0xd8ce1,
    getNodeFieldValue: _0x42b8cf,
    getOptionDisableRepairPatch: _0xb9670f,
    getRangeValueDisplayLabel: _0x10f103,
    getRenderedOptionDisableWhen: _0x32fd5a,
    getRhV54BreastJiggleRangeFromFieldEl: _0x1b5461,
    getUiSchemaFieldAdapterDefinition: _0x3dcdf1,
    normalizeRhV54MaskExpand: _0x5bf43c,
    openExternalLink: _0x2a7516,
    parseRangeValuesFromFieldEl: _0x13bb11,
    syncInstanceToggleField: _0x403225,
    syncModelUiSchemaControls: _0x535fa6,
    syncRhAiAppFooterParamField: _0x13c453,
    t: _0x33d09d,
  } = _0x3c7264;
  if (!_0x1d9d33 || typeof _0x3acfb5 !== 'function') return () => {};
  const _0x14c2af = (_0x2d2938, _0x5a89e7, { skipSync: skipSync = ![] } = {}) => {
    const _0x34c087 = typeof _0x17a8f5 === 'function' ? _0x17a8f5() || {} : {},
      _0x350530 = _0x3acfb5(_0x2d2938, _0x5a89e7, _0x34c087),
      _0x2bba03 =
        _0x350530 && typeof _0x350530 === 'object'
          ? _0x350530
          : typeof _0x17a8f5 === 'function'
            ? _0x17a8f5() || _0x34c087
            : _0x34c087;
    return (!skipSync && _0x535fa6(_0x1d9d33, { ..._0x34c087, ..._0x2bba03 }), _0x2bba03);
  };
  let _0x313241 = null,
    _0x1a0e97 = ![],
    _0x113407 = null,
    _0x1002ba = ![],
    _0x167a77 = null,
    _0x1775e2 = 0x0;
  const _0x231c8b = new Map(),
    _0x2630bf = () => {
      _0x1775e2 += 0x1;
    },
    _0x456bf7 = (_0x26d74f) =>
      _0x26d74f?.['classList']?.['contains']('ui-schema-duration-pop') ? 'flex' : 'block',
    _0x4fa3e7 = (_0x3bd65e) => {
      if (!_0x3bd65e) return;
      (_0x3bd65e['classList']?.['remove']?.('is-closing'),
        _0x3bd65e['setAttribute']?.('aria-hidden', 'false'),
        _0x3bd65e['closest']?.('.ui-schema-pill-menu')
          ?.['querySelector']?.('[data-ui-schema-menu-trigger]')
          ?.['setAttribute']?.('aria-expanded', 'true'));
      if (_0x3bd65e['classList']?.['contains']('floating-menu')) {
        ((_0x3bd65e['style']['display'] = ''), _0x3bd65e['classList']?.['add']?.('show'));
        return;
      }
      ((_0x3bd65e['style']['display'] = _0x456bf7(_0x3bd65e)), _0x3bd65e['classList']?.['add']?.('show'));
    },
    _0x2b516e = (_0xc3822, _0x19269e = {}) => {
      if (!_0xc3822) return;
      const _0xc9fcd0 = _0xc3822['classList']?.['contains']('floating-menu'),
        _0x7623d0 = _0xc9fcd0
          ? _0xc3822['classList']?.['contains']('show')
          : _0xc3822['style']['display'] !== 'none' || _0xc3822['classList']?.['contains']('show');
      (_0xc3822['classList']?.['remove']('show'),
        _0xc3822['setAttribute']?.('aria-hidden', 'true'),
        _0xc3822['closest']?.('.ui-schema-pill-menu')
          ?.['querySelector']?.('[data-ui-schema-menu-trigger]')
          ?.['setAttribute']?.('aria-expanded', 'false'));
      if (_0x19269e?.['immediate']) {
        _0xc3822['classList']?.['remove']('is-closing');
        _0xc9fcd0 ? (_0xc3822['style']['display'] = '') : (_0xc3822['style']['display'] = 'none');
        return;
      }
      if (_0xc3822['classList']?.['contains']('is-closing')) return;
      if (!_0x7623d0) {
        if (_0xc9fcd0) _0xc3822['style']['display'] = '';
        else _0xc3822['style']['display'] = 'none';
        return;
      }
      (_0xc3822['classList']?.['add']('is-closing'),
        setTimeout(() => {
          if (!_0xc3822['classList']?.['contains']('is-closing')) return;
          (_0xc3822['classList']['remove']('is-closing'),
            _0xc9fcd0 ? (_0xc3822['style']['display'] = '') : (_0xc3822['style']['display'] = 'none'));
        }, _0x2dfb47));
    },
    _0x52aabe = (_0x15d5d1 = {}) => {
      const _0x4827c9 = _0x15d5d1?.['except'] || null;
      _0x1d9d33['querySelectorAll']('.ui-schema-floating-menu, .ui-schema-popup')['forEach']((_0x106c9c) => {
        if (_0x106c9c === _0x4827c9) return;
        _0x2b516e(_0x106c9c, _0x15d5d1);
      });
    },
    _0xcc68a = (_0x463863, _0x4eced8) => {
      const _0x3328ad = _0x463863?.['closest']?.('[data-ui-schema-composite-field]') || null,
        _0x5f43c1 = String(_0x3328ad?.['dataset']?.['uiSchemaCompositeField'] || '')['trim'](),
        _0x489bbb = String(_0x463863?.['dataset']?.['uiSchemaField'] || '')['trim']();
      return { compositeField: _0x5f43c1, fieldId: _0x489bbb, menu: _0x4eced8 };
    },
    _0xf11e84 = (_0x1e610f) => {
      if (!_0x1e610f) return null;
      if (_0x1e610f['menu'] && _0x1e610f['menu']['isConnected'] !== ![]) return _0x1e610f['menu'];
      if (_0x1e610f['compositeField']) {
        const _0x1a3bb3 = Array['from'](
            _0x1d9d33['querySelectorAll']?.('[data-ui-schema-composite-field]') || [],
          )['find'](
            (_0xffa22) =>
              String(_0xffa22?.['dataset']?.['uiSchemaCompositeField'] || '')['trim']() ===
              _0x1e610f['compositeField'],
          ),
          _0x511e15 = _0x1a3bb3?.['querySelector']?.('.ui-schema-popup');
        if (_0x511e15) return _0x511e15;
      }
      if (_0x1e610f['fieldId']) {
        const _0x522ea7 = Array['from'](_0x1d9d33['querySelectorAll']?.('[data-ui-schema-field]') || [])[
            'find'
          ](
            (_0x38447f) =>
              String(_0x38447f?.['dataset']?.['uiSchemaField'] || '')['trim']() === _0x1e610f['fieldId'],
          ),
          _0x2a1522 =
            _0x522ea7?.['querySelector']?.('.ui-schema-popup') ||
            _0x522ea7?.['closest']?.('[data-ui-schema-composite-field]')?.['querySelector']?.(
              '.ui-schema-popup',
            );
        if (_0x2a1522) return _0x2a1522;
      }
      return null;
    },
    _0x27adbc = (_0x1e3744) => {
      if (!_0x1e3744 || _0x1e3744['classList']?.['contains']('is-closing')) return ![];
      if (_0x1e3744['classList']?.['contains']('floating-menu'))
        return _0x1e3744['classList']['contains']('show');
      return _0x1e3744['style']['display'] !== 'none';
    },
    _0x8a5b2e = (_0x341df6) => {
      const _0xde1345 = _0x231c8b['get'](_0x341df6);
      if (_0xde1345?.['timer']) clearTimeout(_0xde1345['timer']);
      _0x231c8b['delete'](_0x341df6);
    },
    _0xdfc1c1 = () => {
      Array['from'](_0x231c8b['entries']())['forEach'](([_0x5d39ce, _0x4e169f]) => {
        if (_0x4e169f?.['timer']) clearTimeout(_0x4e169f['timer']);
        (_0x231c8b['delete'](_0x5d39ce), _0x14c2af(_0x5d39ce, _0x4e169f?.['value'] ?? ''));
      });
    },
    _0x5eaa1c = (_0x7aea1c, _0x22105c) => {
      _0x8a5b2e(_0x7aea1c);
      const _0x4154d5 = setTimeout(() => {
        (_0x231c8b['delete'](_0x7aea1c), _0x14c2af(_0x7aea1c, _0x22105c));
      }, 0xb4);
      _0x231c8b['set'](_0x7aea1c, { timer: _0x4154d5, value: _0x22105c });
    },
    _0x318270 = (_0x45d9c6) => {
      const _0x9d4dbd = String(
          _0x45d9c6?.['closest']?.('[data-ui-schema-field]')?.['dataset']?.['uiSchemaType'] || '',
        )
          ['trim']()
          ['toLowerCase'](),
        _0x46c683 = String(_0x45d9c6?.['tagName'] || '')
          ['trim']()
          ['toLowerCase'](),
        _0x44ea4a = String(_0x45d9c6?.['type'] || '')
          ['trim']()
          ['toLowerCase']();
      return (
        _0x9d4dbd === 'text' || _0x9d4dbd === 'textarea' || _0x46c683 === 'textarea' || _0x44ea4a === 'text'
      );
    },
    _0x4a44ef = (_0x384ce3) => {
      if (!_0x384ce3?.['addEventListener']) return ![];
      let _0x32c22d = null;
      const _0x77b525 = () => {
          (_0x384ce3['removeEventListener']('click', _0x2e364f, !![]),
            _0x32c22d && (clearTimeout(_0x32c22d), (_0x32c22d = null)));
        },
        _0x2e364f = (_0x4c9d1a) => {
          (_0x4c9d1a['preventDefault']?.(),
            _0x4c9d1a['stopPropagation']?.(),
            _0x4c9d1a['stopImmediatePropagation']?.(),
            _0x77b525());
        };
      return (
        _0x384ce3['addEventListener']('click', _0x2e364f, !![]),
        (_0x32c22d = setTimeout(_0x77b525, 0x15e)),
        !![]
      );
    },
    _0x67fd0a = (_0x1fa130, _0x4083b3) => {
      const _0x4acfe5 = Number(_0x1fa130);
      return Number['isFinite'](_0x4acfe5) ? _0x4acfe5 : _0x4083b3;
    },
    _0xdce99c = () => {
      const _0x87b802 = globalThis['crypto'] || globalThis['window']?.['crypto'];
      if (_0x87b802?.['getRandomValues']) {
        const _0x47764c = new Uint32Array(0x1);
        return (_0x87b802['getRandomValues'](_0x47764c), _0x47764c[0x0] / 0x100000000);
      }
      return Math['random']();
    },
    _0xf594a7 = (_0x55f804) => {
      const _0x373d85 = Math['trunc'](
          _0x67fd0a(_0x55f804?.['dataset']?.['uiSchemaRandomSeedMin'], _0x8f9d6b),
        ),
        _0x184501 = Math['trunc'](_0x67fd0a(_0x55f804?.['dataset']?.['uiSchemaRandomSeedMax'], _0x15b754)),
        _0x1b5a58 = Math['min'](_0x373d85, _0x184501),
        _0x565392 = Math['max'](_0x373d85, _0x184501);
      return String(_0x1b5a58 + Math['floor'](_0xdce99c() * (_0x565392 - _0x1b5a58 + 0x1)));
    },
    _0x23c05c = (_0x555bf5, _0x5484f6) => {
      const _0x2d9c4e = _0x67fd0a(_0x555bf5?.['dataset']?.['uiSchemaDefault'], 0x0),
        _0x4439b7 = _0x67fd0a(_0x555bf5?.['dataset']?.['uiSchemaMin'], -Infinity),
        _0x1ee073 = _0x67fd0a(_0x555bf5?.['dataset']?.['uiSchemaMax'], Infinity),
        _0x4c2ead = _0x274ac2(_0x5484f6),
        _0x261f06 = _0x555bf5?.['dataset']?.['uiSchemaNumberMode'] === 'float',
        _0x375c71 = Number['isFinite'](_0x4c2ead)
          ? _0x261f06
            ? _0x4c2ead
            : Math['trunc'](_0x4c2ead)
          : _0x2d9c4e;
      return Math['max'](_0x4439b7, Math['min'](_0x1ee073, _0x375c71));
    },
    _0x4f0699 = (_0x4cfae5, _0x2f5146) => {
      const _0x36bc4a = String(_0x4cfae5?.['dataset']?.['uiSchemaField'] || '')['trim']();
      return _0x36bc4a === 'rhVideoFrames' && Number(_0x2f5146) === 0x0
        ? _0x33d09d('aigenImage.uiSchema.fullLength')
        : String(_0x2f5146);
    },
    _0x35437d = (_0x456861, _0x484814) => {
      const _0x8b4287 = _0x23c05c(_0x456861, _0x484814),
        _0x552d17 = _0x456861?.['querySelector']?.('.rh-stepper-value');
      return (
        _0x552d17 &&
          ((_0x552d17['textContent'] = _0x4f0699(_0x456861, _0x8b4287)),
          _0x552d17['setAttribute']('aria-valuenow', String(_0x8b4287))),
        _0x8b4287
      );
    },
    _0x3fef09 = (_0x299b04, _0x5e6294) => {
      const _0x2aea79 = Number(_0x5e6294);
      if (!Number['isFinite'](_0x2aea79)) return String(_0x5e6294 ?? '');
      if (_0x299b04?.['dataset']?.['uiSchemaNumberMode'] === 'float')
        return String(Number(_0x2aea79['toFixed'](0xa)));
      return String(Math['trunc'](_0x2aea79));
    },
    _0x188e28 = (_0x452cd8, _0x55f367) => {
      const _0x42884f = _0x23c05c(_0x452cd8, _0x55f367),
        _0x45ce45 = _0x452cd8?.['querySelector']?.('.ui-schema-rh-aiapp-footer-input');
      if (_0x45ce45) _0x45ce45['value'] = _0x3fef09(_0x452cd8, _0x42884f);
      return (_0x13c453(_0x452cd8, _0x42884f), _0x42884f);
    },
    _0x4680ee = (_0x48435e) => {
      const _0x1e05c6 = String(_0x48435e?.['dataset']?.['uiSchemaField'] || '')['trim'](),
        _0x5948e4 = typeof _0x17a8f5 === 'function' ? _0x17a8f5() || {} : {};
      return _0x23c05c(
        _0x48435e,
        _0x42b8cf(_0x5948e4, _0x1e05c6, _0x48435e?.['dataset']?.['uiSchemaDefault'] ?? 0x0),
      );
    },
    _0x64de26 = (_0x561f23, _0x1503f0) => {
      const _0x51a347 = _0x561f23?.['target']?.['closest']?.(
          '[data-ui-schema-field][data-ui-schema-adapter]',
        ),
        _0xbe2bd1 = String(_0x51a347?.['dataset']?.['uiSchemaAdapter'] || '')['trim'](),
        _0x465f53 = _0xbe2bd1 ? _0x3dcdf1(_0xbe2bd1) : null;
      if (!_0x51a347 || !_0x465f53 || typeof _0x465f53['bind'] !== 'function') return ![];
      return (
        _0x465f53['bind']({
          event: _0x561f23,
          eventName: _0x1503f0,
          root: _0x1d9d33,
          fieldEl: _0x51a347,
          helpers: {
            commitValue: _0x14c2af,
            generateRandomSeedForField: _0xf594a7,
            setRhVideoStepperValueEl: _0x35437d,
          },
        }) === !![]
      );
    },
    _0x54577b = (_0x51729b) => {
      const _0x81831d = String(_0x51729b?.['dataset']?.['uiSchemaField'] || '')['trim'](),
        _0x264cd3 = typeof _0x17a8f5 === 'function' ? _0x17a8f5() || {} : {};
      return _0x23c05c(
        _0x51729b,
        _0x42b8cf(_0x264cd3, _0x81831d, _0x51729b?.['dataset']?.['uiSchemaDefault'] ?? 0x0),
      );
    },
    _0xa61f30 = (_0x5d490b) => {
      const _0x338812 = _0x5d490b?.['closest']?.('.ui-schema-rh-video-stepper'),
        _0x4ef20d = String(_0x338812?.['dataset']?.['uiSchemaField'] || '')['trim']();
      if (!_0x338812 || !_0x4ef20d) return;
      const _0x6c516e = _0x54577b(_0x338812),
        _0x40327c = _0x1d9d33['ownerDocument']?.['createElement']?.('input');
      if (!_0x40327c) return;
      ((_0x40327c['className'] = 'rh-stepper-input'),
        (_0x40327c['type'] = 'text'),
        (_0x40327c['autocomplete'] = 'off'),
        (_0x40327c['step'] = String(_0x338812['dataset']['uiSchemaStep'] || '1')),
        (_0x40327c['min'] = String(_0x338812['dataset']['uiSchemaMin'] || '0')),
        (_0x40327c['max'] = String(_0x338812['dataset']['uiSchemaMax'] || '')),
        (_0x40327c['value'] = String(_0x6c516e)));
      let _0x4308ed = ![];
      const _0x2d3e11 = (_0x16a81e) => {
        if (_0x4308ed) return;
        _0x4308ed = !![];
        const _0x556f2e = _0x16a81e ? _0x23c05c(_0x338812, _0x40327c['value']) : _0x6c516e,
          _0x59a909 = _0x1d9d33['ownerDocument']['createElement']('div');
        ((_0x59a909['className'] = 'rh-stepper-value'),
          _0x59a909['setAttribute']('role', 'spinbutton'),
          _0x59a909['setAttribute']('tabindex', '0'),
          _0x59a909['setAttribute'](
            'aria-label',
            _0x5d490b['getAttribute']('aria-label') ||
              _0x338812['querySelector']('.rh-vram-adv-label span')?.['textContent'] ||
              _0x4ef20d,
          ),
          (_0x59a909['textContent'] = _0x4f0699(_0x338812, _0x556f2e)),
          _0x59a909['setAttribute']('aria-valuenow', String(_0x556f2e)),
          _0x40327c['replaceWith'](_0x59a909));
        if (_0x16a81e) _0x14c2af(_0x4ef20d, _0x556f2e);
      };
      (_0x40327c['addEventListener']('click', (_0x1d3a1e) => _0x1d3a1e['stopPropagation']()),
        _0x40327c['addEventListener']('mousedown', (_0x458ec6) => _0x458ec6['stopPropagation']()),
        _0x40327c['addEventListener']('keydown', (_0x1adc63) => {
          if (_0x1adc63['key'] === 'Enter') _0x2d3e11(!![]);
          if (_0x1adc63['key'] === 'Escape') _0x2d3e11(![]);
        }),
        _0x40327c['addEventListener']('blur', () => _0x2d3e11(!![])),
        _0x5d490b['replaceWith'](_0x40327c),
        _0x40327c['focus'](),
        _0x40327c['select']());
    },
    _0x1fa538 = () => {
      if (!_0x113407) return;
      (_0x113407['el']?.['classList']?.['remove']('is-dragging'),
        _0x113407['doc']?.['removeEventListener']?.('mousemove', _0x221194),
        _0x113407['doc']?.['removeEventListener']?.('mouseup', _0x4595fd),
        (_0x113407 = null));
    },
    _0x221194 = (_0x4364bd) => {
      if (!_0x113407) return;
      const _0x18b210 = _0x4364bd['clientX'] - _0x113407['x'];
      if (Math['abs'](_0x18b210) >= 0x2) _0x113407['dragged'] = !![];
      const _0x1c4cf0 = Math['trunc'](_0x18b210 / 0x6),
        _0x4b74be = _0x67fd0a(_0x113407['fieldEl']?.['dataset']?.['uiSchemaStep'], 0x1),
        _0x598228 = _0x23c05c(_0x113407['fieldEl'], _0x113407['base'] + _0x1c4cf0 * _0x4b74be);
      _0x598228 !== _0x113407['last'] &&
        ((_0x113407['moved'] = !![]),
        (_0x113407['last'] = _0x598228),
        _0x35437d(_0x113407['fieldEl'], _0x598228));
    },
    _0x4595fd = () => {
      if (!_0x113407) return;
      const _0x129ab1 = _0x113407;
      (_0x1fa538(),
        (_0x129ab1['dragged'] || _0x129ab1['moved']) && (_0x1002ba = !_0x4a44ef(_0x129ab1['doc'])),
        _0x129ab1['moved'] && _0x14c2af(_0x129ab1['fieldId'], _0x129ab1['last']));
    },
    _0x5676c5 = () => {
      if (!_0x167a77) return;
      (_0x167a77['input']?.['classList']?.['remove']('is-dragging'),
        _0x167a77['doc']?.['removeEventListener']?.('mousemove', _0x12acbb),
        _0x167a77['doc']?.['removeEventListener']?.('mouseup', _0x3be310),
        (_0x167a77 = null));
    },
    _0x12acbb = (_0x2dcc91) => {
      if (!_0x167a77) return;
      _0x2dcc91['preventDefault']?.();
      const _0x144524 = _0x2dcc91['clientX'] - _0x167a77['x'];
      if (Math['abs'](_0x144524) >= 0x2) _0x167a77['dragged'] = !![];
      const _0x4e9940 = Math['trunc'](_0x144524 / 0x6),
        _0x39f744 = _0x67fd0a(_0x167a77['fieldEl']?.['dataset']?.['uiSchemaStep'], 0x1),
        _0x35cfa6 = _0x23c05c(_0x167a77['fieldEl'], _0x167a77['base'] + _0x4e9940 * _0x39f744);
      _0x35cfa6 !== _0x167a77['last'] &&
        ((_0x167a77['moved'] = !![]),
        (_0x167a77['last'] = _0x35cfa6),
        _0x188e28(_0x167a77['fieldEl'], _0x35cfa6));
    },
    _0x3be310 = () => {
      if (!_0x167a77) return;
      const _0xfb1ab7 = _0x167a77;
      _0x5676c5();
      if (_0xfb1ab7['moved']) {
        (_0x14c2af(_0xfb1ab7['fieldId'], _0xfb1ab7['last']), _0x4a44ef(_0xfb1ab7['doc']));
        return;
      }
      !_0xfb1ab7['dragged'] && (_0xfb1ab7['input']?.['focus']?.(), _0xfb1ab7['input']?.['select']?.());
    },
    _0x53a657 = (_0x3f661e, _0x2261f5) => {
      const _0x284932 = _0x67fd0a(_0x3f661e?.['dataset']?.['uiSchemaDefault'], 0x19),
        _0x43b0e0 = _0x67fd0a(_0x3f661e?.['dataset']?.['uiSchemaMin'], -0x270f),
        _0x1420a4 = _0x67fd0a(_0x3f661e?.['dataset']?.['uiSchemaMax'], 0x270f),
        _0x29e363 = _0x5bf43c(_0x2261f5, _0x284932);
      return Math['max'](_0x43b0e0, Math['min'](_0x1420a4, _0x29e363));
    },
    _0x52825d = (_0x2f5e9b, _0x57a8a2) => {
      const _0x58afc0 = _0x53a657(_0x2f5e9b, _0x57a8a2),
        _0x23b1fe = _0x2f5e9b?.['querySelector']?.('.rh-stepper-value');
      return (
        _0x23b1fe &&
          ((_0x23b1fe['textContent'] = String(_0x58afc0)),
          _0x23b1fe['setAttribute']('aria-valuenow', String(_0x58afc0))),
        _0x58afc0
      );
    },
    _0x196bc4 = (_0xa1676) => {
      const _0x311efb = String(_0xa1676?.['dataset']?.['uiSchemaField'] || '')['trim'](),
        _0x17858c = typeof _0x17a8f5 === 'function' ? _0x17a8f5() || {} : {};
      return _0x53a657(
        _0xa1676,
        _0x42b8cf(_0x17858c, _0x311efb, _0xa1676?.['dataset']?.['uiSchemaDefault'] ?? 0x19),
      );
    },
    _0x49ccec = (_0x5130cd) => {
      const _0x485eba = _0x5130cd?.['closest']?.('.ui-schema-rh-v54-mask-expand'),
        _0x3772c1 = String(_0x485eba?.['dataset']?.['uiSchemaField'] || '')['trim']();
      if (!_0x485eba || !_0x3772c1 || _0x485eba['classList']?.['contains']('is-rh-disabled')) return;
      const _0x436109 = _0x196bc4(_0x485eba),
        _0x2a0443 = _0x1d9d33['ownerDocument']?.['createElement']?.('input');
      if (!_0x2a0443) return;
      ((_0x2a0443['className'] = 'rh-stepper-input'),
        (_0x2a0443['type'] = 'number'),
        (_0x2a0443['step'] = String(_0x485eba['dataset']['uiSchemaStep'] || '1')),
        (_0x2a0443['min'] = String(_0x485eba['dataset']['uiSchemaMin'] || '-9999')),
        (_0x2a0443['max'] = String(_0x485eba['dataset']['uiSchemaMax'] || '9999')),
        (_0x2a0443['value'] = String(_0x436109)));
      let _0x2e52e2 = ![];
      const _0x1506f4 = (_0x39d1a3) => {
        if (_0x2e52e2) return;
        _0x2e52e2 = !![];
        const _0xfb1e72 = _0x39d1a3 ? _0x53a657(_0x485eba, _0x2a0443['value']) : _0x436109,
          _0x26f429 = _0x1d9d33['ownerDocument']['createElement']('div');
        ((_0x26f429['className'] = 'rh-stepper-value'),
          _0x26f429['setAttribute']('role', 'spinbutton'),
          _0x26f429['setAttribute']('tabindex', '0'),
          _0x26f429['setAttribute'](
            'aria-label',
            _0x5130cd['getAttribute']('aria-label') || _0x33d09d('aigenImage.uiSchema.maskExpandValue'),
          ),
          (_0x26f429['textContent'] = String(_0xfb1e72)),
          _0x26f429['setAttribute']('aria-valuenow', String(_0xfb1e72)),
          _0x2a0443['replaceWith'](_0x26f429));
        if (_0x39d1a3) _0x14c2af(_0x3772c1, _0xfb1e72);
      };
      (_0x2a0443['addEventListener']('click', (_0x3a113f) => _0x3a113f['stopPropagation']()),
        _0x2a0443['addEventListener']('mousedown', (_0x29ce90) => _0x29ce90['stopPropagation']()),
        _0x2a0443['addEventListener']('keydown', (_0x57b0c5) => {
          if (_0x57b0c5['key'] === 'Enter') _0x1506f4(!![]);
          if (_0x57b0c5['key'] === 'Escape') _0x1506f4(![]);
        }),
        _0x2a0443['addEventListener']('blur', () => _0x1506f4(!![])),
        _0x5130cd['replaceWith'](_0x2a0443),
        _0x2a0443['focus'](),
        _0x2a0443['select']());
    },
    _0x164767 = () => {
      if (!_0x313241) return;
      (_0x313241['el']?.['classList']?.['remove']('is-dragging'),
        _0x313241['doc']?.['removeEventListener']?.('mousemove', _0x2f965e),
        _0x313241['doc']?.['removeEventListener']?.('mouseup', _0x28f476),
        (_0x313241 = null));
    },
    _0x2f965e = (_0xebaba4) => {
      if (!_0x313241) return;
      const _0x1c40aa = _0xebaba4['clientX'] - _0x313241['x'];
      if (Math['abs'](_0x1c40aa) >= 0x2) _0x313241['dragged'] = !![];
      const _0x1b5e7a = Math['trunc'](_0x1c40aa / 0x6),
        _0x5af56c = _0x53a657(_0x313241['fieldEl'], _0x313241['base'] + _0x1b5e7a);
      _0x5af56c !== _0x313241['last'] &&
        ((_0x313241['moved'] = !![]),
        (_0x313241['last'] = _0x5af56c),
        _0x52825d(_0x313241['fieldEl'], _0x5af56c));
    },
    _0x28f476 = () => {
      if (!_0x313241) return;
      const _0x27e06f = _0x313241;
      (_0x164767(),
        (_0x27e06f['dragged'] || _0x27e06f['moved']) && (_0x1a0e97 = !_0x4a44ef(_0x27e06f['doc'])),
        _0x27e06f['moved'] && _0x14c2af(_0x27e06f['fieldId'], _0x27e06f['last']));
    },
    _0x231619 = (_0x5ae6e1, _0x5d59df = null) => {
      const _0x2f795c = _0x5ae6e1['target']?.['closest']?.(
        '.ui-schema-rh-aiapp-footer-param--input .ui-schema-rh-aiapp-footer-input',
      );
      if (_0x2f795c && _0x5ae6e1['button'] === 0x0) {
        const _0x4332cc = _0x2f795c['closest']('.ui-schema-rh-aiapp-footer-param--input') || _0x5d59df,
          _0x40ff03 = String(_0x4332cc?.['dataset']?.['uiSchemaField'] || '')['trim']();
        if (
          !_0x4332cc ||
          !_0x40ff03 ||
          _0x2f795c['disabled'] ||
          _0x2f795c['getAttribute']?.('aria-disabled') === 'true'
        )
          return;
        const _0x483f16 = _0x1d9d33['ownerDocument'] || globalThis['document'];
        if (!_0x483f16?.['addEventListener']) return;
        (_0x5ae6e1['preventDefault'](), _0x5ae6e1['stopPropagation']());
        const _0x4ec905 = _0x4680ee(_0x4332cc);
        (_0x5676c5(),
          (_0x167a77 = {
            x: _0x5ae6e1['clientX'],
            base: _0x4ec905,
            last: _0x4ec905,
            moved: ![],
            dragged: ![],
            fieldEl: _0x4332cc,
            fieldId: _0x40ff03,
            input: _0x2f795c,
            doc: _0x483f16,
          }),
          _0x2f795c['classList']['add']('is-dragging'),
          _0x483f16['addEventListener']('mousemove', _0x12acbb),
          _0x483f16['addEventListener']('mouseup', _0x3be310));
        return;
      }
      const _0x18a088 = _0x5ae6e1['target']?.['closest']?.('.ui-schema-rh-video-stepper .rh-stepper-value');
      if (_0x18a088 && _0x5ae6e1['button'] === 0x0) {
        const _0x4aa3fe = _0x18a088['closest']('.ui-schema-rh-video-stepper') || _0x5d59df,
          _0x21fc3e = String(_0x4aa3fe?.['dataset']?.['uiSchemaField'] || '')['trim']();
        if (!_0x4aa3fe || !_0x21fc3e) return;
        const _0x4ba762 = _0x1d9d33['ownerDocument'] || globalThis['document'];
        if (!_0x4ba762) return;
        (_0x5ae6e1['preventDefault'](), _0x5ae6e1['stopPropagation']());
        const _0x4208de = _0x54577b(_0x4aa3fe);
        (_0x1fa538(),
          (_0x113407 = {
            x: _0x5ae6e1['clientX'],
            base: _0x4208de,
            last: _0x4208de,
            moved: ![],
            dragged: ![],
            fieldEl: _0x4aa3fe,
            fieldId: _0x21fc3e,
            el: _0x18a088,
            doc: _0x4ba762,
          }),
          _0x18a088['classList']['add']('is-dragging'),
          _0x4ba762['addEventListener']('mousemove', _0x221194),
          _0x4ba762['addEventListener']('mouseup', _0x4595fd));
        return;
      }
      const _0x30e2ef = _0x5ae6e1['target']?.['closest']?.('.ui-schema-rh-v54-mask-expand .rh-stepper-value');
      if (!_0x30e2ef || _0x5ae6e1['button'] !== 0x0) return;
      const _0x218e77 = _0x30e2ef['closest']('.ui-schema-rh-v54-mask-expand') || _0x5d59df,
        _0x115f36 = String(_0x218e77?.['dataset']?.['uiSchemaField'] || '')['trim']();
      if (!_0x218e77 || !_0x115f36 || _0x218e77['classList']?.['contains']('is-rh-disabled')) return;
      const _0x142af2 = _0x1d9d33['ownerDocument'] || globalThis['document'];
      if (!_0x142af2) return;
      (_0x5ae6e1['preventDefault'](), _0x5ae6e1['stopPropagation']());
      const _0x203901 = _0x196bc4(_0x218e77);
      (_0x164767(),
        (_0x313241 = {
          x: _0x5ae6e1['clientX'],
          base: _0x203901,
          last: _0x203901,
          moved: ![],
          dragged: ![],
          fieldEl: _0x218e77,
          fieldId: _0x115f36,
          el: _0x30e2ef,
          doc: _0x142af2,
        }),
        _0x30e2ef['classList']['add']('is-dragging'),
        _0x142af2['addEventListener']('mousemove', _0x2f965e),
        _0x142af2['addEventListener']('mouseup', _0x28f476));
    },
    _0x53d78a = (_0x145db8, _0x23c9be = null) => {
      _0xdfc1c1();
      const _0x4fe15f = _0x145db8['target']?.['closest']?.('[data-ui-schema-field-help-url]');
      if (_0x4fe15f) {
        (_0x145db8['preventDefault'](), _0x145db8['stopPropagation']());
        const _0x5925e4 = String(_0x4fe15f['dataset']['uiSchemaFieldHelpUrl'] || '')['trim']();
        if (_0x5925e4) void _0x2a7516(_0x5925e4)['catch'](() => {});
        return;
      }
      if (_0x64de26(_0x145db8, 'click')) return;
      const _0x260dd7 = _0x145db8['target']?.['closest']?.('.ui-schema-rh-video-stepper .rh-stepper-value');
      if (_0x260dd7) {
        _0x145db8['stopPropagation']();
        if (_0x1002ba) {
          _0x1002ba = ![];
          return;
        }
        _0xa61f30(_0x260dd7);
        return;
      }
      const _0x421c44 = _0x145db8['target']?.['closest']?.(
        '.ui-schema-rh-v54-mask-expand\x20.rh-stepper-value',
      );
      if (_0x421c44) {
        _0x145db8['stopPropagation']();
        if (_0x1a0e97) {
          _0x1a0e97 = ![];
          return;
        }
        _0x49ccec(_0x421c44);
        return;
      }
      const _0x461961 = _0x145db8['target']?.['closest']?.('[data-ui-schema-menu-trigger]');
      if (_0x461961) {
        _0x145db8['stopPropagation']();
        const _0x26e853 =
            _0x461961['closest']('[data-ui-schema-field], [data-ui-schema-composite-field]') || _0x23c9be,
          _0x76d811 =
            _0x26e853?.['querySelector']('.ui-schema-floating-menu') ||
            _0x26e853?.['querySelector']('.ui-schema-popup') ||
            _0x26e853?.['__uiSchemaPortaledPopup'],
          _0xad3d3f = _0x76d811 ? !_0x27adbc(_0x76d811) : ![];
        (_0x1d9d33['dispatchEvent'](
          new CustomEvent('ui-schema-menu-before-open', {
            detail: { fieldEl: _0x26e853, popup: _0x76d811, shouldOpen: _0xad3d3f },
          }),
        ),
          _0x1d9d33['querySelectorAll']('.ui-schema-floating-menu')['forEach']((_0x5251e9) => {
            if (_0x5251e9 !== _0x76d811) _0x2b516e(_0x5251e9);
          }),
          _0x1d9d33['querySelectorAll']('.ui-schema-popup')['forEach']((_0x1407f6) => {
            if (_0x1407f6 === _0x76d811) return;
            _0x2b516e(_0x1407f6);
          }));
        if (_0xad3d3f) _0x4fa3e7(_0x76d811);
        else _0x2b516e(_0x76d811);
        notifyUiSchemaMenuAfterOpen(_0x1d9d33, {
          fieldEl: _0x26e853,
          popup: _0x76d811,
          shouldOpen: _0xad3d3f,
        });
        return;
      }
      _0x145db8['target']?.['closest']?.('.ui-schema-popup, .ui-schema-floating-menu') &&
        _0x145db8['stopPropagation']();
      const _0x3f0a71 = _0x145db8['target']?.['closest']?.('[data-ui-schema-field]') || _0x23c9be;
      if (!_0x3f0a71) return;
      const _0x593735 = String(_0x3f0a71['dataset']['uiSchemaField'] || '')['trim']();
      if (!_0x593735) return;
      const _0x1cafe5 = _0x145db8['target']['closest']('[data-ui-schema-value]');
      if (!_0x1cafe5) return;
      const _0x277296 = typeof _0x17a8f5 === 'function' ? _0x17a8f5() || {} : {},
        _0x4953d8 = _0xb9670f(_0x32fd5a(_0x1cafe5), _0x277296),
        _0x4e0b69 =
          _0x1cafe5['dataset']['uiSchemaStaticDisabled'] === 'true' ||
          _0x1cafe5['hasAttribute']?.('data-ui-schema-static-disabled');
      if (
        _0x4e0b69 ||
        ((_0x1cafe5['dataset']['uiSchemaDisabled'] === 'true' || _0x1cafe5['disabled'] === !![]) &&
          !_0x4953d8)
      )
        return;
      _0x145db8['stopPropagation']();
      const _0x440cbb = _0x1cafe5['dataset']['uiSchemaValue'],
        _0x53ced9 =
          _0x3f0a71['dataset']['uiSchemaValueType'] === 'boolean'
            ? _0x440cbb === 'true'
            : _0x3f0a71['dataset']['uiSchemaValueType'] === 'number'
              ? Number(_0x440cbb)
              : _0x440cbb,
        _0x5f53b1 =
          _0x145db8['target']?.['closest']?.(
            '.ui-schema-popup, .ui-schema-floating-menu, .img-ratio-popup, .rh-res-popup',
          ) || null,
        _0x18edc2 = _0x5f53b1?.['classList']?.['contains']?.('ui-schema-popup') === !![],
        _0x58e98f = _0x18edc2 ? _0xcc68a(_0x3f0a71, _0x5f53b1) : null,
        _0x4eb62d = () => {
          if (!_0x18edc2) return;
          _0x4fa3e7(_0xf11e84(_0x58e98f));
        },
        _0x887d0b = () => {
          const _0x50cd31 = _0x1775e2 + 0x1;
          ((_0x1775e2 = _0x50cd31), _0x4eb62d());
          const _0x3f0399 =
            typeof requestAnimationFrame === 'function'
              ? requestAnimationFrame
              : (_0x39e2ca) => setTimeout(_0x39e2ca, 0x0);
          _0x3f0399(() => {
            if (_0x50cd31 === _0x1775e2) _0x4eb62d();
          });
        };
      _0x18edc2 && _0x5f53b1
        ? _0x52aabe({ immediate: !![], except: _0x5f53b1 })
        : (_0x52aabe({ immediate: !![] }),
          _0x5f53b1?.['__uiSchemaPortalRoot'] === _0x1d9d33 &&
            _0x1d9d33['dispatchEvent'](
              new CustomEvent('ui-schema-portaled-close-request', { detail: { popup: _0x5f53b1 } }),
            ));
      (_0x3f0a71['querySelectorAll']('[data-ui-schema-value]')['forEach']((_0x690ab9) => {
        (_0x690ab9['classList']['remove']('active'),
          _0x690ab9['hasAttribute']?.('aria-selected') &&
            _0x690ab9['setAttribute']('aria-selected', 'false'));
      }),
        _0x1cafe5['classList']['add']('active'));
      _0x1cafe5['hasAttribute']?.('aria-selected') && _0x1cafe5['setAttribute']('aria-selected', 'true');
      const _0x36dad8 = _0x3f0a71['querySelector']('.ui-schema-menu-trigger .ui-schema-pill-label');
      if (_0x36dad8) {
        const _0x27b19c =
          _0x1cafe5['dataset']['uiSchemaOptionLabel'] ||
          _0x1cafe5['textContent']?.['trim']?.() ||
          String(_0x53ced9);
        _0x36dad8['textContent'] = _0x27b19c;
      }
      (_0x13c453(_0x3f0a71, _0x53ced9), _0x403225(_0x3f0a71, _0x53ced9));
      for (const [_0x188362, _0x3d5835] of Object['entries'](_0x4953d8 || {})) {
        _0x188362 !== _0x593735 && _0x14c2af(_0x188362, _0x3d5835, { skipSync: !![] });
      }
      const _0xc3a92c = _0x3f0a71['closest']('[data-ui-schema-composite-field="voiceQualityRatio"]'),
        _0x2f21a8 = String(_0xc3a92c?.['dataset']?.['uiSchemaPrimaryField'] || '')['trim'](),
        _0x366a2e = String(_0xc3a92c?.['dataset']?.['uiSchemaSecondaryField'] || '')['trim']();
      if (_0xc3a92c && _0x593735 === _0x2f21a8) {
        if (_0x366a2e) _0x8a5b2e(_0x366a2e);
        const _0xc0dd7e = _0x14c2af(_0x593735, _0x53ced9, { skipSync: !![] });
        _0x535fa6(_0x1d9d33, _0xc0dd7e);
      } else _0x14c2af(_0x593735, _0x53ced9);
      _0x887d0b();
    },
    _0x233df9 = (_0x2ea076, _0x2a471d = null) => {
      const _0x24cbde = _0x2ea076['target']?.['closest']?.('[data-ui-schema-input]');
      if (!_0x24cbde) return;
      const _0x370b09 = String(_0x24cbde['dataset']['uiSchemaInput'] || '')['trim']();
      if (!_0x370b09) return;
      const _0x36a683 = _0x24cbde['closest']('[data-ui-schema-field]') || _0x2a471d,
        _0x466539 = _0x24cbde['closest']('[data-ui-schema-range-values]') || _0x36a683,
        _0xd68b98 = _0x13bb11(_0x466539),
        _0x5f4038 =
          _0x24cbde['type'] === 'range' && _0xd68b98?.['length']
            ? _0xd68b98[Math['max'](0x0, Math['min'](_0xd68b98['length'] - 0x1, Number(_0x24cbde['value'])))]
            : _0x24cbde['type'] === 'range' || _0x24cbde['type'] === 'number'
              ? _0x36a683?.['classList']?.['contains']('ui-schema-rh-aiapp-footer-param--input')
                ? _0x23c05c(_0x36a683, _0x24cbde['value'])
                : Number(_0x24cbde['value'])
              : _0x24cbde['value'];
      _0x2ea076['type'] === 'change' &&
        _0x24cbde['type'] === 'number' &&
        _0x36a683?.['classList']?.['contains']('ui-schema-rh-aiapp-footer-param--input') &&
        (_0x24cbde['value'] = String(_0x5f4038));
      const _0x5a9627 = _0x36a683?.['querySelector']('.ui-schema-value');
      if (_0x5a9627) _0x5a9627['textContent'] = String(_0x5f4038);
      _0x13c453(_0x36a683, _0x5f4038);
      const _0x54e566 = _0x24cbde['closest']('.ui-schema-rh-v54-breast-jiggle'),
        _0x4c8a19 = _0x54e566?.['querySelector']('.rh-breast-jiggle-value');
      _0x4c8a19 && (_0x4c8a19['textContent'] = _0xd8ce1(_0x5f4038, _0x1b5461(_0x54e566)));
      const _0x5817ee =
          _0x24cbde['closest']('.ui-schema-duration-pill') ||
          _0x36a683?.['closest']?.('.ui-schema-duration-pill'),
        _0x3db1d = _0x5817ee?.['querySelector']('.ui-schema-duration-label');
      _0x3db1d && (_0x3db1d['textContent'] = _0x10f103(_0x466539, _0x5f4038, _0x5f4038 + 'S'));
      const _0x1a0517 = _0x24cbde['closest']('.ui-schema-field') || _0x36a683,
        _0x5c668d = _0x1a0517?.['querySelector']('.ui-schema-pill-label'),
        _0x18131e = _0x1a0517?.['querySelector']('.rh-res-title');
      if (_0x5c668d && _0x18131e) {
        const _0x4c70fb = _0x5c668d['querySelector']('.ui-schema-resolution-value');
        _0x4c70fb
          ? (_0x4c70fb['textContent'] = String(_0x5f4038))
          : (_0x5c668d['textContent'] = (_0x18131e['textContent'] || 'Resolution') + '\x20' + _0x5f4038);
      }
      if (_0x318270(_0x24cbde)) {
        _0x2ea076['type'] === 'input'
          ? _0x5eaa1c(_0x370b09, _0x5f4038)
          : (_0x8a5b2e(_0x370b09), _0x14c2af(_0x370b09, _0x5f4038));
        return;
      }
      _0x14c2af(_0x370b09, _0x5f4038);
    },
    _0x4f4ab = bindUiSchemaBindingEvents(_0x1d9d33, {
      handleClick: _0x53d78a,
      handleMouseDown: _0x231619,
      handleInput: _0x233df9,
      invalidatePendingMenuRestore: _0x2630bf,
      commitValue: _0x14c2af,
      getNodeData: _0x17a8f5,
      getNodeFieldValue: _0x42b8cf,
    }),
    _0x520dce = () => {
      (_0xdfc1c1(), _0x164767(), _0x1fa538(), _0x5676c5(), _0x4f4ab());
    };
  return ((_0x520dce['flushPendingTextCommits'] = _0xdfc1c1), _0x520dce);
}
