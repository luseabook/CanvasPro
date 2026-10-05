import { bindUiSchemaBindingEvents, notifyUiSchemaMenuAfterOpen } from './uiSchemaBindingEvents.js';
export function createUiSchemaBindingSession(
  root,
  { getNodeData: getNodeData, commitFieldValue: commitFieldValue } = {},
  value = {},
) {
  const {
    RANDOM_SEED_DEFAULT_MAX: RANDOM_SEED_DEFAULT_MAX,
    RANDOM_SEED_DEFAULT_MIN: RANDOM_SEED_DEFAULT_MIN,
    UI_SCHEMA_POPUP_EXIT_MS: UI_SCHEMA_POPUP_EXIT_MS,
    evaluateUiSchemaNumberExpression: evaluateUiSchemaNumberExpression,
    formatRhV54BreastJiggle: formatRhV54BreastJiggle,
    getNodeFieldValue: getNodeFieldValue,
    getOptionDisableRepairPatch: getOptionDisableRepairPatch,
    getRangeValueDisplayLabel: getRangeValueDisplayLabel,
    getRenderedOptionDisableWhen: getRenderedOptionDisableWhen,
    getRhV54BreastJiggleRangeFromFieldEl: getRhV54BreastJiggleRangeFromFieldEl,
    getUiSchemaFieldAdapterDefinition: getUiSchemaFieldAdapterDefinition,
    normalizeRhV54MaskExpand: normalizeRhV54MaskExpand,
    openExternalLink: openExternalLink,
    parseRangeValuesFromFieldEl: parseRangeValuesFromFieldEl,
    syncInstanceToggleField: syncInstanceToggleField,
    syncModelUiSchemaControls: syncModelUiSchemaControls,
    syncRhAiAppFooterParamField: syncRhAiAppFooterParamField,
    t: t,
  } = value;
  if (!root || typeof commitFieldValue !== 'function') return () => {};
  const commitValue = (item, key, { skipSync: skipSync = false } = {}) => {
    const args = typeof getNodeData === 'function' ? getNodeData() || {} : {},
      index = commitFieldValue(item, key, args),
      args2 =
        index && typeof index === 'object'
          ? index
          : typeof getNodeData === 'function'
            ? getNodeData() || args
            : args;
    return (!skipSync && syncModelUiSchemaControls(root, { ...args, ...args2 }), args2);
  };
  let box = null,
    result = false,
    box2 = null,
    data = false,
    box3 = null,
    options = 0;
  const map = new Map(),
    invalidatePendingMenuRestore = () => {
      options += 1;
    },
    handler = (el) => (el?.['classList']?.['contains']('ui-schema-duration-pop') ? 'flex' : 'block'),
    handler2 = (el2) => {
      if (!el2) return;
      (el2['classList']?.['remove']?.('is-closing'),
        el2['setAttribute']?.('aria-hidden', 'false'),
        el2['closest']?.('.ui-schema-pill-menu')
          ?.['querySelector']?.('[data-ui-schema-menu-trigger]')
          ?.['setAttribute']?.('aria-expanded', 'true'));
      if (el2['classList']?.['contains']('floating-menu')) {
        ((el2['style']['display'] = ''), el2['classList']?.['add']?.('show'));
        return;
      }
      ((el2['style']['display'] = handler(el2)), el2['classList']?.['add']?.('show'));
    },
    handler3 = (el3, target = {}) => {
      if (!el3) return;
      const source = el3['classList']?.['contains']('floating-menu'),
        enabled = source
          ? el3['classList']?.['contains']('show')
          : el3['style']['display'] !== 'none' || el3['classList']?.['contains']('show');
      (el3['classList']?.['remove']('show'),
        el3['setAttribute']?.('aria-hidden', 'true'),
        el3['closest']?.('.ui-schema-pill-menu')
          ?.['querySelector']?.('[data-ui-schema-menu-trigger]')
          ?.['setAttribute']?.('aria-expanded', 'false'));
      if (target?.['immediate']) {
        el3['classList']?.['remove']('is-closing');
        source ? (el3['style']['display'] = '') : (el3['style']['display'] = 'none');
        return;
      }
      if (el3['classList']?.['contains']('is-closing')) return;
      if (!enabled) {
        if (source) el3['style']['display'] = '';
        else el3['style']['display'] = 'none';
        return;
      }
      (el3['classList']?.['add']('is-closing'),
        setTimeout(() => {
          if (!el3['classList']?.['contains']('is-closing')) return;
          (el3['classList']['remove']('is-closing'),
            source ? (el3['style']['display'] = '') : (el3['style']['display'] = 'none'));
        }, UI_SCHEMA_POPUP_EXIT_MS));
    },
    handler4 = (options2 = {}) => {
      const next = options2?.['except'] || null;
      root['querySelectorAll']('.ui-schema-floating-menu, .ui-schema-popup')['forEach']((current) => {
        if (current === next) return;
        handler3(current, options2);
      });
    },
    handler5 = (el4, menu) => {
      const el5 = el4?.['closest']?.('[data-ui-schema-composite-field]') || null,
        compositeField = String(el5?.['dataset']?.['uiSchemaCompositeField'] || '')['trim'](),
        fieldId = String(el4?.['dataset']?.['uiSchemaField'] || '')['trim']();
      return { compositeField: compositeField, fieldId: fieldId, menu: menu };
    },
    handler6 = (enabled2) => {
      if (!enabled2) return null;
      if (enabled2['menu'] && enabled2['menu']['isConnected'] !== false) return enabled2['menu'];
      if (enabled2['compositeField']) {
        const el6 = Array['from'](root['querySelectorAll']?.('[data-ui-schema-composite-field]') || [])[
            'find'
          ](
            (el7) =>
              String(el7?.['dataset']?.['uiSchemaCompositeField'] || '')['trim']() ===
              enabled2['compositeField'],
          ),
          entry = el6?.['querySelector']?.('.ui-schema-popup');
        if (entry) return entry;
      }
      if (enabled2['fieldId']) {
        const el8 = Array['from'](root['querySelectorAll']?.('[data-ui-schema-field]') || [])['find'](
            (el9) => String(el9?.['dataset']?.['uiSchemaField'] || '')['trim']() === enabled2['fieldId'],
          ),
          record =
            el8?.['querySelector']?.('.ui-schema-popup') ||
            el8?.['closest']?.('[data-ui-schema-composite-field]')?.['querySelector']?.('.ui-schema-popup');
        if (record) return record;
      }
      return null;
    },
    handler7 = (el10) => {
      if (!el10 || el10['classList']?.['contains']('is-closing')) return false;
      if (el10['classList']?.['contains']('floating-menu')) return el10['classList']['contains']('show');
      return el10['style']['display'] !== 'none';
    },
    handler8 = (payload) => {
      const handle = map['get'](payload);
      if (handle?.['timer']) clearTimeout(handle['timer']);
      map['delete'](payload);
    },
    handler9 = () => {
      Array['from'](map['entries']())['forEach'](([state, el11]) => {
        if (el11?.['timer']) clearTimeout(el11['timer']);
        (map['delete'](state), commitValue(state, el11?.['value'] ?? ''));
      });
    },
    handler10 = (config, value2) => {
      handler8(config);
      const timer = setTimeout(() => {
        (map['delete'](config), commitValue(config, value2));
      }, 180);
      map['set'](config, { timer: timer, value: value2 });
    },
    handler11 = (el12) => {
      const scope = String(el12?.['closest']?.('[data-ui-schema-field]')?.['dataset']?.['uiSchemaType'] || '')
          ['trim']()
          ['toLowerCase'](),
        input = String(el12?.['tagName'] || '')
          ['trim']()
          ['toLowerCase'](),
        output = String(el12?.['type'] || '')
          ['trim']()
          ['toLowerCase']();
      return scope === 'text' || scope === 'textarea' || input === 'textarea' || output === 'text';
    },
    handler12 = (el13) => {
      if (!el13?.['addEventListener']) return false;
      let setTimeout2 = null;
      const run = () => {
          (el13['removeEventListener']('click', value3, true),
            setTimeout2 && (clearTimeout(setTimeout2), (setTimeout2 = null)));
        },
        value3 = (event) => {
          (event['preventDefault']?.(),
            event['stopPropagation']?.(),
            event['stopImmediatePropagation']?.(),
            run());
        };
      return (el13['addEventListener']('click', value3, true), (setTimeout2 = setTimeout(run, 350)), true);
    },
    handler13 = (value4, value5) => {
      const value6 = Number(value4);
      return Number['isFinite'](value6) ? value6 : value5;
    },
    handler14 = () => {
      const value7 = globalThis['crypto'] || globalThis['window']?.['crypto'];
      if (value7?.['getRandomValues']) {
        const uint32Array = new Uint32Array(1);
        return (value7['getRandomValues'](uint32Array), uint32Array[0] / 0x100000000);
      }
      return Math['random']();
    },
    generateRandomSeedForField = (el14) => {
      const value8 = Math['trunc'](
          handler13(el14?.['dataset']?.['uiSchemaRandomSeedMin'], RANDOM_SEED_DEFAULT_MIN),
        ),
        value9 = Math['trunc'](
          handler13(el14?.['dataset']?.['uiSchemaRandomSeedMax'], RANDOM_SEED_DEFAULT_MAX),
        ),
        value10 = Math['min'](value8, value9),
        value11 = Math['max'](value8, value9);
      return String(value10 + Math['floor'](handler14() * (value11 - value10 + 1)));
    },
    handler15 = (el15, value12) => {
      const value13 = handler13(el15?.['dataset']?.['uiSchemaDefault'], 0),
        value14 = handler13(el15?.['dataset']?.['uiSchemaMin'], -Infinity),
        value15 = handler13(el15?.['dataset']?.['uiSchemaMax'], Infinity),
        value16 = evaluateUiSchemaNumberExpression(value12),
        value17 = el15?.['dataset']?.['uiSchemaNumberMode'] === 'float',
        value18 = Number['isFinite'](value16) ? (value17 ? value16 : Math['trunc'](value16)) : value13;
      return Math['max'](value14, Math['min'](value15, value18));
    },
    handler16 = (el16, value19) => {
      const value20 = String(el16?.['dataset']?.['uiSchemaField'] || '')['trim']();
      return value20 === 'rhVideoFrames' && Number(value19) === 0
        ? t('aigenImage.uiSchema.fullLength')
        : String(value19);
    },
    setRhVideoStepperValueEl = (el17, value21) => {
      const value22 = handler15(el17, value21),
        el18 = el17?.['querySelector']?.('.rh-stepper-value');
      return (
        el18 &&
          ((el18['textContent'] = handler16(el17, value22)),
          el18['setAttribute']('aria-valuenow', String(value22))),
        value22
      );
    },
    handler17 = (el19, value23) => {
      const value24 = Number(value23);
      if (!Number['isFinite'](value24)) return String(value23 ?? '');
      if (el19?.['dataset']?.['uiSchemaNumberMode'] === 'float')
        return String(Number(value24['toFixed'](10)));
      return String(Math['trunc'](value24));
    },
    handler18 = (el20, value25) => {
      const value26 = handler15(el20, value25),
        el21 = el20?.['querySelector']?.('.ui-schema-rh-aiapp-footer-input');
      if (el21) el21['value'] = handler17(el20, value26);
      return (syncRhAiAppFooterParamField(el20, value26), value26);
    },
    handler19 = (el22) => {
      const value27 = String(el22?.['dataset']?.['uiSchemaField'] || '')['trim'](),
        value28 = typeof getNodeData === 'function' ? getNodeData() || {} : {};
      return handler15(
        el22,
        getNodeFieldValue(value28, value27, el22?.['dataset']?.['uiSchemaDefault'] ?? 0),
      );
    },
    handler20 = (event2, eventName) => {
      const fieldEl = event2?.['target']?.['closest']?.('[data-ui-schema-field][data-ui-schema-adapter]'),
        value29 = String(fieldEl?.['dataset']?.['uiSchemaAdapter'] || '')['trim'](),
        enabled3 = value29 ? getUiSchemaFieldAdapterDefinition(value29) : null;
      if (!fieldEl || !enabled3 || typeof enabled3['bind'] !== 'function') return false;
      return (
        enabled3['bind']({
          event: event2,
          eventName: eventName,
          root: root,
          fieldEl: fieldEl,
          helpers: {
            commitValue: commitValue,
            generateRandomSeedForField: generateRandomSeedForField,
            setRhVideoStepperValueEl: setRhVideoStepperValueEl,
          },
        }) === true
      );
    },
    handler21 = (el23) => {
      const value30 = String(el23?.['dataset']?.['uiSchemaField'] || '')['trim'](),
        value31 = typeof getNodeData === 'function' ? getNodeData() || {} : {};
      return handler15(
        el23,
        getNodeFieldValue(value31, value30, el23?.['dataset']?.['uiSchemaDefault'] ?? 0),
      );
    },
    handler22 = (el24) => {
      const el25 = el24?.['closest']?.('.ui-schema-rh-video-stepper'),
        enabled4 = String(el25?.['dataset']?.['uiSchemaField'] || '')['trim']();
      if (!el25 || !enabled4) return;
      const value32 = handler21(el25),
        el26 = root['ownerDocument']?.['createElement']?.('input');
      if (!el26) return;
      ((el26['className'] = 'rh-stepper-input'),
        (el26['type'] = 'text'),
        (el26['autocomplete'] = 'off'),
        (el26['step'] = String(el25['dataset']['uiSchemaStep'] || '1')),
        (el26['min'] = String(el25['dataset']['uiSchemaMin'] || '0')),
        (el26['max'] = String(el25['dataset']['uiSchemaMax'] || '')),
        (el26['value'] = String(value32)));
      let value33 = false;
      const run2 = (value34) => {
        if (value33) return;
        value33 = true;
        const value35 = value34 ? handler15(el25, el26['value']) : value32,
          el27 = root['ownerDocument']['createElement']('div');
        ((el27['className'] = 'rh-stepper-value'),
          el27['setAttribute']('role', 'spinbutton'),
          el27['setAttribute']('tabindex', '0'),
          el27['setAttribute'](
            'aria-label',
            el24['getAttribute']('aria-label') ||
              el25['querySelector']('.rh-vram-adv-label span')?.['textContent'] ||
              enabled4,
          ),
          (el27['textContent'] = handler16(el25, value35)),
          el27['setAttribute']('aria-valuenow', String(value35)),
          el26['replaceWith'](el27));
        if (value34) commitValue(enabled4, value35);
      };
      (el26['addEventListener']('click', (event3) => event3['stopPropagation']()),
        el26['addEventListener']('mousedown', (event4) => event4['stopPropagation']()),
        el26['addEventListener']('keydown', (event5) => {
          if (event5['key'] === 'Enter') run2(true);
          if (event5['key'] === 'Escape') run2(false);
        }),
        el26['addEventListener']('blur', () => run2(true)),
        el24['replaceWith'](el26),
        el26['focus'](),
        el26['select']());
    },
    handler23 = () => {
      if (!box2) return;
      (box2['el']?.['classList']?.['remove']('is-dragging'),
        box2['doc']?.['removeEventListener']?.('mousemove', value36),
        box2['doc']?.['removeEventListener']?.('mouseup', value37),
        (box2 = null));
    },
    value36 = (event6) => {
      if (!box2) return;
      const value38 = event6['clientX'] - box2['x'];
      if (Math['abs'](value38) >= 2) box2['dragged'] = true;
      const value39 = Math['trunc'](value38 / 6),
        value40 = handler13(box2['fieldEl']?.['dataset']?.['uiSchemaStep'], 1),
        value41 = handler15(box2['fieldEl'], box2['base'] + value39 * value40);
      value41 !== box2['last'] &&
        ((box2['moved'] = true),
        (box2['last'] = value41),
        setRhVideoStepperValueEl(box2['fieldEl'], value41));
    },
    value37 = () => {
      if (!box2) return;
      const value42 = box2;
      (handler23(),
        (value42['dragged'] || value42['moved']) && (data = !handler12(value42['doc'])),
        value42['moved'] && commitValue(value42['fieldId'], value42['last']));
    },
    handler24 = () => {
      if (!box3) return;
      (box3['input']?.['classList']?.['remove']('is-dragging'),
        box3['doc']?.['removeEventListener']?.('mousemove', value43),
        box3['doc']?.['removeEventListener']?.('mouseup', value44),
        (box3 = null));
    },
    value43 = (event7) => {
      if (!box3) return;
      event7['preventDefault']?.();
      const value45 = event7['clientX'] - box3['x'];
      if (Math['abs'](value45) >= 2) box3['dragged'] = true;
      const value46 = Math['trunc'](value45 / 6),
        value47 = handler13(box3['fieldEl']?.['dataset']?.['uiSchemaStep'], 1),
        value48 = handler15(box3['fieldEl'], box3['base'] + value46 * value47);
      value48 !== box3['last'] &&
        ((box3['moved'] = true), (box3['last'] = value48), handler18(box3['fieldEl'], value48));
    },
    value44 = () => {
      if (!box3) return;
      const enabled5 = box3;
      handler24();
      if (enabled5['moved']) {
        (commitValue(enabled5['fieldId'], enabled5['last']), handler12(enabled5['doc']));
        return;
      }
      !enabled5['dragged'] && (enabled5['input']?.['focus']?.(), enabled5['input']?.['select']?.());
    },
    handler25 = (el28, value49) => {
      const value50 = handler13(el28?.['dataset']?.['uiSchemaDefault'], 25),
        value51 = handler13(el28?.['dataset']?.['uiSchemaMin'], -9999),
        value52 = handler13(el28?.['dataset']?.['uiSchemaMax'], 9999),
        value53 = normalizeRhV54MaskExpand(value49, value50);
      return Math['max'](value51, Math['min'](value52, value53));
    },
    handler26 = (el29, value54) => {
      const value55 = handler25(el29, value54),
        el30 = el29?.['querySelector']?.('.rh-stepper-value');
      return (
        el30 &&
          ((el30['textContent'] = String(value55)), el30['setAttribute']('aria-valuenow', String(value55))),
        value55
      );
    },
    handler27 = (el31) => {
      const value56 = String(el31?.['dataset']?.['uiSchemaField'] || '')['trim'](),
        value57 = typeof getNodeData === 'function' ? getNodeData() || {} : {};
      return handler25(
        el31,
        getNodeFieldValue(value57, value56, el31?.['dataset']?.['uiSchemaDefault'] ?? 25),
      );
    },
    handler28 = (el32) => {
      const el33 = el32?.['closest']?.('.ui-schema-rh-v54-mask-expand'),
        enabled6 = String(el33?.['dataset']?.['uiSchemaField'] || '')['trim']();
      if (!el33 || !enabled6 || el33['classList']?.['contains']('is-rh-disabled')) return;
      const value58 = handler27(el33),
        el34 = root['ownerDocument']?.['createElement']?.('input');
      if (!el34) return;
      ((el34['className'] = 'rh-stepper-input'),
        (el34['type'] = 'number'),
        (el34['step'] = String(el33['dataset']['uiSchemaStep'] || '1')),
        (el34['min'] = String(el33['dataset']['uiSchemaMin'] || '-9999')),
        (el34['max'] = String(el33['dataset']['uiSchemaMax'] || '9999')),
        (el34['value'] = String(value58)));
      let value59 = false;
      const run3 = (value60) => {
        if (value59) return;
        value59 = true;
        const value61 = value60 ? handler25(el33, el34['value']) : value58,
          el35 = root['ownerDocument']['createElement']('div');
        ((el35['className'] = 'rh-stepper-value'),
          el35['setAttribute']('role', 'spinbutton'),
          el35['setAttribute']('tabindex', '0'),
          el35['setAttribute'](
            'aria-label',
            el32['getAttribute']('aria-label') || t('aigenImage.uiSchema.maskExpandValue'),
          ),
          (el35['textContent'] = String(value61)),
          el35['setAttribute']('aria-valuenow', String(value61)),
          el34['replaceWith'](el35));
        if (value60) commitValue(enabled6, value61);
      };
      (el34['addEventListener']('click', (event8) => event8['stopPropagation']()),
        el34['addEventListener']('mousedown', (event9) => event9['stopPropagation']()),
        el34['addEventListener']('keydown', (event10) => {
          if (event10['key'] === 'Enter') run3(true);
          if (event10['key'] === 'Escape') run3(false);
        }),
        el34['addEventListener']('blur', () => run3(true)),
        el32['replaceWith'](el34),
        el34['focus'](),
        el34['select']());
    },
    handler29 = () => {
      if (!box) return;
      (box['el']?.['classList']?.['remove']('is-dragging'),
        box['doc']?.['removeEventListener']?.('mousemove', value62),
        box['doc']?.['removeEventListener']?.('mouseup', value63),
        (box = null));
    },
    value62 = (event11) => {
      if (!box) return;
      const value64 = event11['clientX'] - box['x'];
      if (Math['abs'](value64) >= 2) box['dragged'] = true;
      const value65 = Math['trunc'](value64 / 6),
        value66 = handler25(box['fieldEl'], box['base'] + value65);
      value66 !== box['last'] &&
        ((box['moved'] = true), (box['last'] = value66), handler26(box['fieldEl'], value66));
    },
    value63 = () => {
      if (!box) return;
      const value67 = box;
      (handler29(),
        (value67['dragged'] || value67['moved']) && (result = !handler12(value67['doc'])),
        value67['moved'] && commitValue(value67['fieldId'], value67['last']));
    },
    handleMouseDown = (x, value68 = null) => {
      const input2 = x['target']?.['closest']?.(
        '.ui-schema-rh-aiapp-footer-param--input .ui-schema-rh-aiapp-footer-input',
      );
      if (input2 && x['button'] === 0) {
        const fieldEl2 = input2['closest']('.ui-schema-rh-aiapp-footer-param--input') || value68,
          fieldId2 = String(fieldEl2?.['dataset']?.['uiSchemaField'] || '')['trim']();
        if (
          !fieldEl2 ||
          !fieldId2 ||
          input2['disabled'] ||
          input2['getAttribute']?.('aria-disabled') === 'true'
        )
          return;
        const doc = root['ownerDocument'] || globalThis['document'];
        if (!doc?.['addEventListener']) return;
        (x['preventDefault'](), x['stopPropagation']());
        const base = handler19(fieldEl2);
        (handler24(),
          (box3 = {
            x: x['clientX'],
            base: base,
            last: base,
            moved: false,
            dragged: false,
            fieldEl: fieldEl2,
            fieldId: fieldId2,
            input: input2,
            doc: doc,
          }),
          input2['classList']['add']('is-dragging'),
          doc['addEventListener']('mousemove', value43),
          doc['addEventListener']('mouseup', value44));
        return;
      }
      const el36 = x['target']?.['closest']?.('.ui-schema-rh-video-stepper .rh-stepper-value');
      if (el36 && x['button'] === 0) {
        const fieldEl3 = el36['closest']('.ui-schema-rh-video-stepper') || value68,
          fieldId3 = String(fieldEl3?.['dataset']?.['uiSchemaField'] || '')['trim']();
        if (!fieldEl3 || !fieldId3) return;
        const doc2 = root['ownerDocument'] || globalThis['document'];
        if (!doc2) return;
        (x['preventDefault'](), x['stopPropagation']());
        const base2 = handler21(fieldEl3);
        (handler23(),
          (box2 = {
            x: x['clientX'],
            base: base2,
            last: base2,
            moved: false,
            dragged: false,
            fieldEl: fieldEl3,
            fieldId: fieldId3,
            el: el36,
            doc: doc2,
          }),
          el36['classList']['add']('is-dragging'),
          doc2['addEventListener']('mousemove', value36),
          doc2['addEventListener']('mouseup', value37));
        return;
      }
      const el37 = x['target']?.['closest']?.('.ui-schema-rh-v54-mask-expand .rh-stepper-value');
      if (!el37 || x['button'] !== 0) return;
      const fieldEl4 = el37['closest']('.ui-schema-rh-v54-mask-expand') || value68,
        fieldId4 = String(fieldEl4?.['dataset']?.['uiSchemaField'] || '')['trim']();
      if (!fieldEl4 || !fieldId4 || fieldEl4['classList']?.['contains']('is-rh-disabled')) return;
      const doc3 = root['ownerDocument'] || globalThis['document'];
      if (!doc3) return;
      (x['preventDefault'](), x['stopPropagation']());
      const base3 = handler27(fieldEl4);
      (handler29(),
        (box = {
          x: x['clientX'],
          base: base3,
          last: base3,
          moved: false,
          dragged: false,
          fieldEl: fieldEl4,
          fieldId: fieldId4,
          el: el37,
          doc: doc3,
        }),
        el37['classList']['add']('is-dragging'),
        doc3['addEventListener']('mousemove', value62),
        doc3['addEventListener']('mouseup', value63));
    },
    handleClick = (event12, value69 = null) => {
      handler9();
      const el38 = event12['target']?.['closest']?.('[data-ui-schema-field-help-url]');
      if (el38) {
        (event12['preventDefault'](), event12['stopPropagation']());
        const value70 = String(el38['dataset']['uiSchemaFieldHelpUrl'] || '')['trim']();
        if (value70) void openExternalLink(value70)['catch'](() => {});
        return;
      }
      if (handler20(event12, 'click')) return;
      const value71 = event12['target']?.['closest']?.('.ui-schema-rh-video-stepper .rh-stepper-value');
      if (value71) {
        event12['stopPropagation']();
        if (data) {
          data = false;
          return;
        }
        handler22(value71);
        return;
      }
      const value72 = event12['target']?.['closest']?.('.ui-schema-rh-v54-mask-expand .rh-stepper-value');
      if (value72) {
        event12['stopPropagation']();
        if (result) {
          result = false;
          return;
        }
        handler28(value72);
        return;
      }
      const el39 = event12['target']?.['closest']?.('[data-ui-schema-menu-trigger]');
      if (el39) {
        event12['stopPropagation']();
        const fieldEl5 =
            el39['closest']('[data-ui-schema-field], [data-ui-schema-composite-field]') || value69,
          popup =
            fieldEl5?.['querySelector']('.ui-schema-floating-menu') ||
            fieldEl5?.['querySelector']('.ui-schema-popup') ||
            fieldEl5?.['__uiSchemaPortaledPopup'],
          shouldOpen = popup ? !handler7(popup) : false;
        (root['dispatchEvent'](
          new CustomEvent('ui-schema-menu-before-open', {
            detail: { fieldEl: fieldEl5, popup: popup, shouldOpen: shouldOpen },
          }),
        ),
          root['querySelectorAll']('.ui-schema-floating-menu')['forEach']((value73) => {
            if (value73 !== popup) handler3(value73);
          }),
          root['querySelectorAll']('.ui-schema-popup')['forEach']((value74) => {
            if (value74 === popup) return;
            handler3(value74);
          }));
        if (shouldOpen) handler2(popup);
        else handler3(popup);
        notifyUiSchemaMenuAfterOpen(root, {
          fieldEl: fieldEl5,
          popup: popup,
          shouldOpen: shouldOpen,
        });
        return;
      }
      event12['target']?.['closest']?.('.ui-schema-popup, .ui-schema-floating-menu') &&
        event12['stopPropagation']();
      const el40 = event12['target']?.['closest']?.('[data-ui-schema-field]') || value69;
      if (!el40) return;
      const enabled7 = String(el40['dataset']['uiSchemaField'] || '')['trim']();
      if (!enabled7) return;
      const el41 = event12['target']['closest']('[data-ui-schema-value]');
      if (!el41) return;
      const value75 = typeof getNodeData === 'function' ? getNodeData() || {} : {},
        enabled8 = getOptionDisableRepairPatch(getRenderedOptionDisableWhen(el41), value75),
        value76 =
          el41['dataset']['uiSchemaStaticDisabled'] === 'true' ||
          el41['hasAttribute']?.('data-ui-schema-static-disabled');
      if (
        value76 ||
        ((el41['dataset']['uiSchemaDisabled'] === 'true' || el41['disabled'] === true) && !enabled8)
      )
        return;
      event12['stopPropagation']();
      const value77 = el41['dataset']['uiSchemaValue'],
        value78 =
          el40['dataset']['uiSchemaValueType'] === 'boolean'
            ? value77 === 'true'
            : el40['dataset']['uiSchemaValueType'] === 'number'
              ? Number(value77)
              : value77,
        except =
          event12['target']?.['closest']?.(
            '.ui-schema-popup, .ui-schema-floating-menu, .img-ratio-popup, .rh-res-popup',
          ) || null,
        enabled9 = except?.['classList']?.['contains']?.('ui-schema-popup') === true,
        value79 = enabled9 ? handler5(el40, except) : null,
        handler30 = () => {
          if (!enabled9) return;
          handler2(handler6(value79));
        },
        handler31 = () => {
          const value80 = options + 1;
          ((options = value80), handler30());
          const run4 =
            typeof requestAnimationFrame === 'function'
              ? requestAnimationFrame
              : (value81) => setTimeout(value81, 0);
          run4(() => {
            if (value80 === options) handler30();
          });
        };
      enabled9 && except
        ? handler4({ immediate: true, except: except })
        : (handler4({ immediate: true }),
          except?.['__uiSchemaPortalRoot'] === root &&
            root['dispatchEvent'](
              new CustomEvent('ui-schema-portaled-close-request', { detail: { popup: except } }),
            ));
      (el40['querySelectorAll']('[data-ui-schema-value]')['forEach']((el42) => {
        (el42['classList']['remove']('active'),
          el42['hasAttribute']?.('aria-selected') && el42['setAttribute']('aria-selected', 'false'));
      }),
        el41['classList']['add']('active'));
      el41['hasAttribute']?.('aria-selected') && el41['setAttribute']('aria-selected', 'true');
      const el43 = el40['querySelector']('.ui-schema-menu-trigger .ui-schema-pill-label');
      if (el43) {
        const value82 =
          el41['dataset']['uiSchemaOptionLabel'] || el41['textContent']?.['trim']?.() || String(value78);
        el43['textContent'] = value82;
      }
      (syncRhAiAppFooterParamField(el40, value78), syncInstanceToggleField(el40, value78));
      for (const [value83, value84] of Object['entries'](enabled8 || {})) {
        value83 !== enabled7 && commitValue(value83, value84, { skipSync: true });
      }
      const el44 = el40['closest']('[data-ui-schema-composite-field="voiceQualityRatio"]'),
        value85 = String(el44?.['dataset']?.['uiSchemaPrimaryField'] || '')['trim'](),
        value86 = String(el44?.['dataset']?.['uiSchemaSecondaryField'] || '')['trim']();
      if (el44 && enabled7 === value85) {
        if (value86) handler8(value86);
        const value87 = commitValue(enabled7, value78, { skipSync: true });
        syncModelUiSchemaControls(root, value87);
      } else commitValue(enabled7, value78);
      handler31();
    },
    handleInput = (event13, value88 = null) => {
      const el45 = event13['target']?.['closest']?.('[data-ui-schema-input]');
      if (!el45) return;
      const enabled10 = String(el45['dataset']['uiSchemaInput'] || '')['trim']();
      if (!enabled10) return;
      const el46 = el45['closest']('[data-ui-schema-field]') || value88,
        value89 = el45['closest']('[data-ui-schema-range-values]') || el46,
        list = parseRangeValuesFromFieldEl(value89),
        value90 =
          el45['type'] === 'range' && list?.['length']
            ? list[Math['max'](0, Math['min'](list['length'] - 1, Number(el45['value'])))]
            : el45['type'] === 'range' || el45['type'] === 'number'
              ? el46?.['classList']?.['contains']('ui-schema-rh-aiapp-footer-param--input')
                ? handler15(el46, el45['value'])
                : Number(el45['value'])
              : el45['value'];
      event13['type'] === 'change' &&
        el45['type'] === 'number' &&
        el46?.['classList']?.['contains']('ui-schema-rh-aiapp-footer-param--input') &&
        (el45['value'] = String(value90));
      const el47 = el46?.['querySelector']('.ui-schema-value');
      if (el47) el47['textContent'] = String(value90);
      syncRhAiAppFooterParamField(el46, value90);
      const el48 = el45['closest']('.ui-schema-rh-v54-breast-jiggle'),
        el49 = el48?.['querySelector']('.rh-breast-jiggle-value');
      el49 &&
        (el49['textContent'] = formatRhV54BreastJiggle(value90, getRhV54BreastJiggleRangeFromFieldEl(el48)));
      const el50 =
          el45['closest']('.ui-schema-duration-pill') || el46?.['closest']?.('.ui-schema-duration-pill'),
        el51 = el50?.['querySelector']('.ui-schema-duration-label');
      el51 && (el51['textContent'] = getRangeValueDisplayLabel(value89, value90, value90 + 'S'));
      const el52 = el45['closest']('.ui-schema-field') || el46,
        el53 = el52?.['querySelector']('.ui-schema-pill-label'),
        el54 = el52?.['querySelector']('.rh-res-title');
      if (el53 && el54) {
        const el55 = el53['querySelector']('.ui-schema-resolution-value');
        el55
          ? (el55['textContent'] = String(value90))
          : (el53['textContent'] = (el54['textContent'] || 'Resolution') + ' ' + value90);
      }
      if (handler11(el45)) {
        event13['type'] === 'input'
          ? handler10(enabled10, value90)
          : (handler8(enabled10), commitValue(enabled10, value90));
        return;
      }
      commitValue(enabled10, value90);
    },
    handler32 = bindUiSchemaBindingEvents(root, {
      handleClick: handleClick,
      handleMouseDown: handleMouseDown,
      handleInput: handleInput,
      invalidatePendingMenuRestore: invalidatePendingMenuRestore,
      commitValue: commitValue,
      getNodeData: getNodeData,
      getNodeFieldValue: getNodeFieldValue,
    }),
    value91 = () => {
      (handler9(), handler29(), handler23(), handler24(), handler32());
    };
  return ((value91['flushPendingTextCommits'] = handler9), value91);
}
