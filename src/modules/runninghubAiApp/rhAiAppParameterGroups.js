import {
  CUSTOM_APP_FOOTER_LIMIT,
  clearParameterGroup,
  getParameterEntries,
  groupParameters,
  normalizeParameterGroups,
  orderParameterEntries,
} from '../../domain/customAiApp/parameterLayout.js';
import { escapeHtmlAttr } from '../../components/aigenImage/uiModuleModelHelpers.js';
import { renderUiSchemaFields } from '../../components/aigenImage/uiSchemaRenderer.js';
import { positionAnchoredSubmenu } from '../../utils/submenuPosition.js';
import { animatePreviewOrder, showGroupPanel } from './rhAiAppMotion.js';
export function renderGroupedPreviewParams(value, item, handler) {
  const key = item?.['models']?.[0x0]?.['uiSchema']?.['fields'] || [],
    index = {
      generationParams: Object['fromEntries'](key['map']((result) => [result['id'], result['defaultValue']])),
    };
  return getParameterEntries(value)
    ['map']((enabled, data) => {
      if (!enabled['id'] || enabled['members']['length'] < 0x2) return handler(enabled['members'][0x0], data);
      const options = enabled['members'][0x0]['index'],
        escapeHtmlAttr2 = escapeHtmlAttr(enabled['id']),
        target = enabled['members']
          ['map']((source) => {
            const args = key['find']((next) => next['customAiAppComponentIndex'] === source['index']);
            if (!args) return '';
            return (
              '<div class="rh-ai-app-group-member" data-group-member="' +
              source['index'] +
              '\x22>' +
              renderUiSchemaFields([{ ...args, variant: 'groupRow' }], index, { unwrap: !![] }) +
              '</div>'
            );
          })
          ['join']('');
      return (
        '<div\x20class=\x22rh-ai-app-preview-component\x20rh-ai-app-preview-draggable\x20rh-ai-app-preview-param-chip\x20rh-ai-app-preview-group\x22\x20data-preview-drag-kind=\x22param\x22\x20data-preview-component-index=\x22' +
        options +
        '" data-param-group="' +
        escapeHtmlAttr2 +
        '" data-preview-order="' +
        data +
        '">\n      <button type="button" class="img-pill-btn" data-param-group-action="open" aria-expanded="false">' +
        escapeHtmlAttr(enabled['label']) +
        '</button><span class="rh-ai-app-preview-drag-pad" aria-hidden="true"></span>\n      <div class="rh-ai-app-group-panel" hidden role="dialog" aria-label="编辑参数组">\n        <div class="rh-ai-app-group-heading"><input aria-label="参数组名称" data-param-group-name="' +
        escapeHtmlAttr2 +
        '\x22\x20value=\x22' +
        escapeHtmlAttr(enabled['label']) +
        '\x22\x20maxlength=\x2224\x22><span\x20role=\x22button\x22\x20tabindex=\x220\x22\x20class=\x22rh-tip\x20ui-schema-info-tip\x22\x20data-param-group-action=\x22description\x22\x20data-tooltip=\x22' +
        escapeHtmlAttr(enabled['description'] || '编辑参数组说明') +
        '" aria-label="编辑参数组说明">!</span></div>\n        <textarea class="rh-ai-app-group-description" data-param-group-description="' +
        escapeHtmlAttr2 +
        '" aria-label="参数组说明" maxlength="1000" hidden>' +
        escapeHtmlAttr(enabled['description']) +
        '</textarea>' +
        target +
        '\n      </div></div>'
      );
    })
    ['join']('');
}
export function createParameterGroupInteraction(current) {
  let enabled2 = null,
    setTimeout2 = null,
    entry = null,
    record = null;
  const run = () => current['componentDrafts'],
    handler2 = () => getParameterEntries(run()),
    handler3 = (payload) => run()['find']((handle) => handle['index'] === payload['index']),
    handler4 = () => {
      (clearTimeout(setTimeout2),
        enabled2?.['element']?.['classList']['remove']('is-group-drop-pending', 'is-group-drop-ready'),
        enabled2?.['element']?.['removeAttribute']('data-group-drop-label'),
        (enabled2 = null),
        entry?.['element']?.['removeAttribute']('data-group-insert'),
        (entry = null));
    },
    handler5 = (el) => {
      const state = el['querySelector']('.rh-ai-app-group-panel');
      state['style']['bottom'] = 'auto';
      const config = el['getBoundingClientRect'](),
        el2 = current['panel'],
        scope = el2['querySelector']('.rh-ai-app-kind-field')?.['getBoundingClientRect']()['bottom'] || 0x0,
        input =
          el2['querySelector']('.rh-ai-app-footer')?.['getBoundingClientRect']()['top'] ||
          window['innerHeight'];
      positionAnchoredSubmenu({
        submenu: state,
        anchorRect: config,
        containerRect: config,
        horizontalPlacement: 'center',
        verticalPlacement: 'above',
        verticalGap: 0xa,
        viewportTop: scope,
        viewportHeight: input,
        viewportWidth: el2['getBoundingClientRect']()['right'] - 0x8,
      });
    },
    handler6 = (list, output, value2) => {
      (list['forEach']((value3) => {
        (clearParameterGroup(value3), (value3['previewPlacement'] = output));
        if (output === 'advanced') delete value3['homeParamOrder'];
      }),
        normalizeParameterGroups(run()));
      if (output === 'home') {
        const value4 = handler2()['filter'](
          (enabled3) => !enabled3['members']['some']((value5) => list['includes'](value5)),
        );
        (value4['splice'](value2, 0x0, ...list['map']((value6) => ({ members: [value6] }))),
          orderParameterEntries(value4));
      } else {
        const value7 = run()
          ['filter'](
            (value8) =>
              value8['componentKind'] === 'param' &&
              value8['previewPlacement'] !== 'home' &&
              !list['includes'](value8),
          )
          ['sort'](
            (value9, value10) =>
              (value9['advancedParamOrder'] ?? value9['index']) -
              (value10['advancedParamOrder'] ?? value10['index']),
          );
        (value7['splice'](value2, 0x0, ...list),
          value7['forEach']((value11, value12) => {
            value11['advancedParamOrder'] = value12;
          }));
      }
    };
  return {
    reset: handler4,
    restorePanel() {
      const enabled4 = record;
      record = null;
      if (!enabled4) return;
      const enabled5 = Array['from'](current['panel']['querySelectorAll']('[data-param-group]'))['find'](
        (value13) => value13['dataset']['paramGroup'] === enabled4['id'],
      );
      if (!enabled5) return;
      const value14 = enabled5['querySelector']('.rh-ai-app-group-panel');
      ((value14['hidden'] = ![]),
        enabled5['querySelector']('[data-param-group-action=\x22open\x22]')['setAttribute'](
          'aria-expanded',
          'true',
        ),
        handler5(enabled5),
        (value14['scrollTop'] = enabled4['scrollTop']));
    },
    move(value15, value16) {
      if (!['param', 'advanced-param', 'group-param']['includes'](value15['dragKind'])) return ![];
      const enabled6 = handler3(value15);
      if (!enabled6) return ![];
      const el3 = Array['from'](current['panel']['querySelectorAll']('.rh-ai-app-group-panel:not([hidden])'))[
        'find'
      ]((el4) => {
        const value17 = el4['getBoundingClientRect']();
        return (
          value15['currentClientX'] >= value17['left'] &&
          value15['currentClientX'] <= value17['right'] &&
          value15['currentClientY'] >= value17['top'] &&
          value15['currentClientY'] <= value17['bottom']
        );
      });
      if (
        el3 &&
        value15['dragKind'] === 'group-param' &&
        el3['closest']('[data-param-group]')['dataset']['paramGroup'] === enabled6['footerGroupId']
      ) {
        (handler4(),
          current['_clearPreviewAdvancedParamDropPlaceholder'](value15, { animate: !![] }),
          current['_clearPreviewHomeParamDropPlaceholder'](value15, { animate: !![] }));
        const value18 = Array['from'](el3['querySelectorAll']('[data-group-member]'))['filter'](
            (value19) => Number(value19['dataset']['groupMember']) !== enabled6['index'],
          ),
          value20 = el3['getBoundingClientRect']()['top'] + el3['clientTop'] - el3['scrollTop'],
          value21 = value18['filter'](
            (value22) =>
              value15['currentClientY'] > value20 + value22['offsetTop'] + value22['offsetHeight'] / 0x2,
          )['length'],
          value23 = value18[value21] || value18['at'](-0x1);
        (value23?.['setAttribute']('data-group-insert', value21 < value18['length'] ? 'before' : 'after'),
          (entry = {
            element: value23,
            order: value21,
            id: enabled6['footerGroupId'],
            scrollTop: el3['scrollTop'],
          }));
        const value24 = el3['querySelector']('[data-group-member="' + enabled6['index'] + '\x22]'),
          value25 = Array['from'](el3['querySelectorAll']('[data-group-member]'));
        if (value25['indexOf'](value24) !== value21) {
          const value26 = el3['scrollTop'];
          (animatePreviewOrder(value25, () => el3['insertBefore'](value24, value18[value21] || null)),
            (el3['scrollTop'] = value26));
        }
        return ((value15['groupLayoutHandled'] = !![]), !![]);
      }
      (entry?.['element']?.['removeAttribute']('data-group-insert'), (entry = null));
      const value27 = Array['from'](current['_getPreviewZoneElement']('params')?.['children'] || []),
        el5 =
          value16 === 'params' &&
          value27['find']((el6) => {
            const enabled7 = run()['find'](
              (value28) => value28['index'] === Number(el6['dataset']['previewComponentIndex']),
            );
            if (
              !enabled7 ||
              enabled7 === enabled6 ||
              (enabled6['footerGroupId'] && enabled7['footerGroupId'] === enabled6['footerGroupId'])
            )
              return ![];
            const box = el6['getBoundingClientRect']();
            return (
              value15['currentClientX'] > box['left'] + box['width'] * 0.25 &&
              value15['currentClientX'] < box['right'] - box['width'] * 0.25 &&
              value15['currentClientY'] >= box['top'] &&
              value15['currentClientY'] <= box['bottom']
            );
          });
      el5 !== enabled2?.['element'] &&
        (handler4(),
        el5 &&
          ((enabled2 = { element: el5, index: Number(el5['dataset']['previewComponentIndex']), ready: ![] }),
          el5['classList']['add']('is-group-drop-pending'),
          (setTimeout2 = setTimeout(() => {
            if (!enabled2 || enabled2['element'] !== el5) return;
            ((enabled2['ready'] = !![]),
              el5['classList']['add']('is-group-drop-ready'),
              (el5['dataset']['groupDropLabel'] = el5['dataset']['paramGroup']
                ? '松开加入分组'
                : '松开创建分组'));
          }, 0x1c2))));
      const enabled8 = handler2()['some']((value29) => value29['id']);
      if (!enabled2 && value16 === 'advanced') current['_reorderPreviewAdvancedParamsDuringDrag'](value15);
      else current['_clearPreviewAdvancedParamDropPlaceholder'](value15, { animate: !![] });
      if (!enabled2 && !enabled8 && value15['dragKind'] !== 'group-param' && value16 !== 'params')
        return ((value15['groupLayoutHandled'] = ![]), ![]);
      !enabled2 &&
        !enabled8 &&
        value16 === 'params' &&
        current['_reorderPreviewHomeParamsDuringDrag'](value15);
      if (!enabled2 && enabled8 && value16 === 'params') {
        const value30 = handler2()['find']((value31) => value31['members']['includes'](enabled6)),
          value32 = value15['dragKind'] === 'param' && value30,
          value33 = value32 || handler2()['length'] < CUSTOM_APP_FOOTER_LIMIT;
        if (value33) {
          const value34 = value32
              ? value27['find'](
                  (value35) => Number(value35['dataset']['previewComponentIndex']) === enabled6['index'],
                )
              : current['_createPreviewHomeParamDropPlaceholder'](value15),
            args2 = value27['filter']((value36) => value36 !== value34),
            value37 = args2['filter']((value38) => {
              const value39 = value38['getBoundingClientRect']();
              return value15['currentClientX'] > value39['left'] + value39['width'] / 0x2;
            })['length'];
          value34 &&
            Array['from'](value34['parentElement']['children'])['indexOf'](value34) !== value37 &&
            animatePreviewOrder([...args2, value34], () =>
              value34['parentElement']['insertBefore'](value34, args2[value37] || null),
            );
        }
      } else {
        if (enabled2 || value16 !== 'params')
          current['_clearPreviewHomeParamDropPlaceholder'](value15, { animate: !![] });
      }
      return (
        current['_getPreviewZoneElement']('params')?.['classList']['toggle'](
          'is-param-drop-target',
          value16 === 'params',
        ),
        (value15['groupLayoutHandled'] = !![]),
        !![]
      );
    },
    end(enabled9, value40, value41) {
      if (!enabled9['groupLayoutHandled']) return (handler4(), ![]);
      const value42 = current['panel']['querySelector']('.rh-ai-app-group-panel:not([hidden])');
      record = value42
        ? {
            id: value42['closest']('[data-param-group]')['dataset']['paramGroup'],
            scrollTop: value42['scrollTop'],
          }
        : null;
      if (value40['type'] !== 'pointerup') {
        if (enabled9['layoutSnapshot']) current['_restorePreviewLayoutSnapshot'](enabled9['layoutSnapshot']);
        return (handler4(), !![]);
      }
      const enabled10 = handler3(enabled9);
      if (!enabled10) return (handler4(), !![]);
      const enabled11 = handler2()['find']((value43) => value43['members']['includes'](enabled10)),
        enabled12 = enabled9['dragKind'] === 'param' && !!enabled11?.['id'],
        value44 = enabled12 ? enabled11['members'] : [enabled10];
      if (entry && enabled11?.['id'] === entry['id']) {
        const value45 = handler2(),
          value46 = value45['find']((value47) => value47['id'] === enabled11['id']);
        ((value46['members'] = value46['members']['filter']((value48) => value48 !== enabled10)),
          value46['members']['splice'](entry['order'], 0x0, enabled10),
          orderParameterEntries(value45));
      } else {
        if (enabled2?.['ready'] && value41 === 'params')
          groupParameters(run(), enabled10['index'], enabled2['index'], { wholeGroup: enabled12 });
        else {
          if (value41 === 'params') {
            const value49 = handler2()['filter'](
                (enabled13) => !enabled12 || !enabled13['members']['includes'](enabled10),
              ),
              value50 = enabled11 && (enabled12 || enabled11['members']['length'] === 0x1);
            if (value50 || value49['length'] < CUSTOM_APP_FOOTER_LIMIT) {
              const value51 = Array['from'](current['_getPreviewZoneElement']('params')?.['children'] || [])[
                  'filter'
                ](
                  (value52) =>
                    Number(value52['dataset']['previewComponentIndex']) !==
                    (enabled11?.['members'][0x0]?.['index'] ?? enabled10['index']),
                ),
                value53 = value51['filter']((value54) => {
                  const value55 = value54['getBoundingClientRect']();
                  return enabled9['currentClientX'] > value55['left'] + value55['width'] / 0x2;
                })['length'];
              if (enabled12) (value49['splice'](value53, 0x0, enabled11), orderParameterEntries(value49));
              else handler6(value44, 'home', value53);
            }
          } else {
            if (value41 === 'advanced') {
              const value56 = current['_getPreviewDropOrder'](
                'advanced',
                enabled9['currentClientX'],
                '.rh-ai-app-preview-advanced-param',
                enabled9['currentClientY'],
              );
              handler6(value44, 'advanced', value56);
            } else value41 === 'prompt' && !enabled12 && current['_movePreviewTextParamToPrompt'](enabled9);
          }
        }
      }
      return (handler4(), !![]);
    },
    bind(el7) {
      const value57 = (value58) => {
          const enabled14 = value58['target']['closest']?.('[data-param-group-action]');
          if (!enabled14) return;
          value58['stopPropagation']();
          const value59 = enabled14['closest']('[data-param-group]'),
            enabled15 = handler2()['find']((value60) => value60['id'] === value59?.['dataset']['paramGroup']);
          if (!enabled15) return;
          const value61 = enabled14['dataset']['paramGroupAction'];
          if (value61 === 'description') {
            const el8 = value59['querySelector']('[data-param-group-description]');
            el8['hidden'] = !el8['hidden'];
            if (!el8['hidden']) el8['focus']({ preventScroll: !![] });
            handler5(value59);
            return;
          }
          if (value61 === 'open') {
            const value62 = value59['querySelector']('.rh-ai-app-group-panel'),
              value63 = enabled14['getAttribute']('aria-expanded') !== 'true';
            (el7['querySelectorAll']('.rh-ai-app-group-panel')['forEach']((enabled16) => {
              if (enabled16 !== value62 && !enabled16['hidden']) showGroupPanel(enabled16, ![]);
            }),
              el7['querySelectorAll']('[data-param-group-action=\x22open\x22]')['forEach']((value64) =>
                value64['setAttribute']('aria-expanded', 'false'),
              ),
              showGroupPanel(value62, value63),
              enabled14['setAttribute']('aria-expanded', String(value63)));
            if (value63) handler5(value59);
            return;
          }
        },
        value65 = (event) => {
          const value66 = event['target']['dataset']?.['paramGroupDescription'];
          if (value66) {
            const value67 = event['target']['value']['trim']();
            (run()
              ['filter']((value68) => value68['footerGroupId'] === value66)
              ['forEach']((value69) => {
                value69['footerGroupDescription'] = value67;
              }),
              (event['target']
                ['closest']('[data-param-group]')
                ['querySelector']('[data-param-group-action="description"]')['dataset']['tooltip'] =
                value67 || '编辑参数组说明'),
              current['_refreshBundleFromComponents']({ renderPreview: ![] }));
            return;
          }
          const enabled17 = event['target']['dataset']?.['paramGroupName'];
          if (!enabled17) return;
          const value70 = event['target']['value']['trim']() || '参数组';
          (run()
            ['filter']((value71) => value71['footerGroupId'] === enabled17)
            ['forEach']((value72) => {
              value72['footerGroupLabel'] = value70;
            }),
            (event['target']['value'] = value70),
            (event['target']
              ['closest']('[data-param-group]')
              ['querySelector']('[data-param-group-action="open"]')['textContent'] = value70),
            current['_refreshBundleFromComponents']({ renderPreview: ![] }));
        },
        value73 = (event2) => {
          if (event2['type'] === 'keydown' && event2['key'] !== 'Escape') return;
          (event2['type'] === 'keydown' &&
            el7['querySelector']('.rh-ai-app-group-panel:not([hidden])') &&
            (event2['preventDefault'](), event2['stopImmediatePropagation']()),
            el7['querySelectorAll']('.rh-ai-app-group-panel:not([hidden])')['forEach']((value74) => {
              const value75 = value74['closest']('[data-param-group]');
              if (event2['type'] !== 'keydown' && value75['contains'](event2['target'])) return;
              (showGroupPanel(value74, ![]),
                value75['querySelector']('[data-param-group-action="open"]')['setAttribute'](
                  'aria-expanded',
                  'false',
                ));
              if (event2['type'] === 'keydown')
                value75['querySelector']('[data-param-group-action="open"]')['focus']();
            }));
        },
        value76 = (event3) => {
          if (event3?.['target']?.['closest']?.('.rh-ai-app-group-panel')) return;
          el7['querySelectorAll']('.rh-ai-app-group-panel:not([hidden])')['forEach']((value77) =>
            handler5(value77['closest']('[data-param-group]')),
          );
        },
        value78 = (event4) => {
          (event4['key'] === 'Enter' || event4['key'] === '\x20') &&
            event4['target']['matches']('[data-param-group-action=\x22description\x22]') &&
            (event4['preventDefault'](), event4['target']['click']());
        };
      return (
        el7['addEventListener']('keydown', value78),
        el7['addEventListener']('click', value57),
        el7['addEventListener']('change', value65),
        el7['ownerDocument']['addEventListener']('pointerdown', value73),
        el7['ownerDocument']['addEventListener']('keydown', value73, !![]),
        el7['ownerDocument']['defaultView']['addEventListener']('resize', value76),
        el7['addEventListener']('scroll', value76, !![]),
        () => {
          (el7['removeEventListener']('keydown', value78),
            el7['removeEventListener']('click', value57),
            el7['removeEventListener']('change', value65),
            el7['ownerDocument']['removeEventListener']('pointerdown', value73),
            el7['ownerDocument']['removeEventListener']('keydown', value73, !![]),
            el7['ownerDocument']['defaultView']['removeEventListener']('resize', value76),
            el7['removeEventListener']('scroll', value76, !![]),
            handler4());
        }
      );
    },
  };
}
