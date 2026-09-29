import { clearCanvasNearbyVideoWarmup, syncCanvasNearbyVideoWarmup } from './canvasMediaWarmup.js';
import { isNodeInsideViewportPadding } from './rendererVirtualization.js';
import { buildCanvasVideoProxyPromotionPatch } from '../services/canvasMediaLocalService.js';
import {
  cancelVideoProxyMigrationTask,
  getLegacyProjectImportVideoProxyMigration,
  requestVisibleVideoProxyMigration,
  subscribeVideoProxyMigrationUpdates,
} from '../services/mediaTaskService.js';
import { screenToWorld } from './math.js';
import { isViewportPanPreviewActive } from './viewportPanPreview.js';
const DEFAULT_DEBOUNCE_MS = 0xa0,
  LOW_ZOOM_VIDEO_WARMUP_THRESHOLD = 0.45,
  DEFAULT_PROXY_MIGRATION_BATCH_SIZE = 0x4,
  MAX_PROXY_MIGRATION_BATCH_SIZE = 0x8,
  MAX_PENDING_PROXY_MIGRATION_UPDATE_COUNT = 0x78 + MAX_PROXY_MIGRATION_BATCH_SIZE,
  PROXY_MIGRATION_TERMINAL_STATUSES = new Set(['complete', 'failed', 'cancelled']);
function normalizeViewport(_0x278fa3) {
  return {
    x: Number['isFinite'](Number(_0x278fa3?.['x'])) ? Number(_0x278fa3['x']) : 0x0,
    y: Number['isFinite'](Number(_0x278fa3?.['y'])) ? Number(_0x278fa3['y']) : 0x0,
    zoom:
      Number['isFinite'](Number(_0x278fa3?.['zoom'])) && Number(_0x278fa3['zoom']) > 0x0
        ? Number(_0x278fa3['zoom'])
        : 0x1,
  };
}
function readStoreSnapshot(_0x426cb3) {
  return _0x426cb3?.['getStateRaw']?.() || _0x426cb3?.['getState']?.() || {};
}
function getContainerSize(_0x4ab58d) {
  return {
    width: Math['max'](0x1, Number(_0x4ab58d?.['clientWidth']) || 0x640),
    height: Math['max'](0x1, Number(_0x4ab58d?.['clientHeight']) || 0x384),
  };
}
function normalizeProxyMigrationBatchSize(_0x5f3a34) {
  const _0x47402d = Math['trunc'](Number(_0x5f3a34));
  if (!Number['isFinite'](_0x47402d) || _0x47402d < 0x1) return DEFAULT_PROXY_MIGRATION_BATCH_SIZE;
  return Math['min'](MAX_PROXY_MIGRATION_BATCH_SIZE, _0x47402d);
}
function sortProxyMigrationNodeIdsByPriority({
  nodeIds: _0xc0e810,
  nodes: _0x2f489c,
  selectedNodeIds: _0x4b1062,
  viewport: _0x453a04,
  containerEl: _0x4dcc79,
}) {
  const _0x25108c = new Set(_0x4b1062 || []),
    { width: _0x999459, height: _0x4e69fb } = getContainerSize(_0x4dcc79),
    _0x32fe53 = screenToWorld(_0x999459 / 0x2, _0x4e69fb / 0x2, normalizeViewport(_0x453a04));
  return (_0xc0e810 || [])
    ['map']((_0x2c6b23, _0x2088fa) => {
      const _0x592a18 = _0x2f489c?.[_0x2c6b23] || {},
        _0x5e241a = Number(_0x592a18['x'] || 0x0) + Number(_0x592a18['width'] || 0x0) / 0x2,
        _0x3bb396 = Number(_0x592a18['y'] || 0x0) + Number(_0x592a18['height'] || 0x0) / 0x2,
        _0x1cfa26 = _0x5e241a - _0x32fe53['x'],
        _0x4da89c = _0x3bb396 - _0x32fe53['y'];
      return {
        nodeId: _0x2c6b23,
        index: _0x2088fa,
        selected: _0x25108c['has'](_0x2c6b23),
        distanceSq: _0x1cfa26 * _0x1cfa26 + _0x4da89c * _0x4da89c,
      };
    })
    ['sort']((_0x5dc00c, _0x30b878) => {
      if (_0x5dc00c['selected'] !== _0x30b878['selected']) return _0x5dc00c['selected'] ? -0x1 : 0x1;
      return _0x5dc00c['distanceSq'] - _0x30b878['distanceSq'] || _0x5dc00c['index'] - _0x30b878['index'];
    })
    ['map']((_0xad95be) => _0xad95be['nodeId']);
}
export function collectVisibleLegacySourceVideoNodeIds({
  nodes: _0x1a9461,
  viewport: _0x5dad07,
  containerEl: _0x2af1ab,
  isLegacySourceVideo: isLegacySourceVideo = getLegacyProjectImportVideoProxyMigration,
  buildProxyPromotionPatch: buildProxyPromotionPatch = buildCanvasVideoProxyPromotionPatch,
} = {}) {
  const _0xc4e61b = normalizeViewport(_0x5dad07);
  if (_0xc4e61b['zoom'] > LOW_ZOOM_VIDEO_WARMUP_THRESHOLD) return [];
  const { width: _0x36f56c, height: _0x8735b8 } = getContainerSize(_0x2af1ab),
    _0x2736c3 = Array['isArray'](_0x1a9461) ? _0x1a9461 : Object['values'](_0x1a9461 || {}),
    _0x5190fc = [];
  for (const _0xfa4cbb of _0x2736c3) {
    const _0x3a7c9b =
      String(_0xfa4cbb?.['type'] || '')
        ['trim']()
        ['toLowerCase']() === 'source-video' && !!buildProxyPromotionPatch(_0xfa4cbb);
    if (!_0xfa4cbb?.['id'] || (!isLegacySourceVideo(_0xfa4cbb) && !_0x3a7c9b)) continue;
    if (!isNodeInsideViewportPadding(_0xfa4cbb, _0xc4e61b, _0x36f56c, _0x8735b8, 0x0)) continue;
    _0x5190fc['push'](String(_0xfa4cbb['id']));
  }
  return _0x5190fc;
}
function buildCanvasViewportVideoWarmupScopeSignature(_0x29bb32 = {}) {
  const _0x16ea55 = normalizeViewport(_0x29bb32['viewport']),
    _0x5dd70f = Number['isFinite'](Number(_0x29bb32['_nodeGeometryRev']))
      ? Number(_0x29bb32['_nodeGeometryRev'])
      : 0x0,
    _0x1079ab = Array['isArray'](_0x29bb32['selectedNodeIds'])
      ? _0x29bb32['selectedNodeIds']['map']((_0x80bd0e) => String(_0x80bd0e || ''))
      : [];
  return [_0x16ea55['x'], _0x16ea55['y'], _0x16ea55['zoom'], _0x5dd70f, JSON['stringify'](_0x1079ab)]['join'](
    ':',
  );
}
export function buildCanvasViewportVideoWarmupSignature(_0x11d2e2 = {}) {
  const _0x52a0b9 = Number['isFinite'](Number(_0x11d2e2['_sourceVideoRev']))
    ? Number(_0x11d2e2['_sourceVideoRev'])
    : 0x0;
  return buildCanvasViewportVideoWarmupScopeSignature(_0x11d2e2) + ':' + _0x52a0b9;
}
export function createCanvasViewportVideoWarmupController({
  store: _0x4e0969,
  containerEl: _0x1613b5,
  debounceMs: debounceMs = DEFAULT_DEBOUNCE_MS,
  syncWarmup: syncWarmup = syncCanvasNearbyVideoWarmup,
  clearWarmup: clearWarmup = clearCanvasNearbyVideoWarmup,
  requestProxyMigration: requestProxyMigration = requestVisibleVideoProxyMigration,
  isLegacySourceVideo: isLegacySourceVideo = getLegacyProjectImportVideoProxyMigration,
  buildProxyPromotionPatch: buildProxyPromotionPatch = buildCanvasVideoProxyPromotionPatch,
  resolveProxyMigrationBatchSize: resolveProxyMigrationBatchSize = () => DEFAULT_PROXY_MIGRATION_BATCH_SIZE,
  proxyMigrationBatchIntervalMs: proxyMigrationBatchIntervalMs = debounceMs,
  isViewportInteractionActive: isViewportInteractionActive = isViewportPanPreviewActive,
  subscribeProxyMigrationUpdates: subscribeProxyMigrationUpdates = subscribeVideoProxyMigrationUpdates,
  cancelProxyMigrationTask: cancelProxyMigrationTask = cancelVideoProxyMigrationTask,
  setTimer: setTimer = setTimeout,
  clearTimer: clearTimer = clearTimeout,
} = {}) {
  if (!_0x4e0969 || typeof syncWarmup !== 'function' || typeof clearWarmup !== 'function') return () => {};
  const _0x155661 = Math['max'](0x78, Math['min'](0xc8, Number(debounceMs) || DEFAULT_DEBOUNCE_MS)),
    _0x5be4e5 = Math['max'](0x78, Math['min'](0xc8, Number(proxyMigrationBatchIntervalMs) || _0x155661));
  let _0x49d06f = null,
    _0x161fde = null,
    _0x36416d = [],
    _0x441b36 = '',
    _0x1b5335 = null;
  const _0x5ebc7a = new Map(),
    _0x277b8a = new Map();
  let _0x1658d4 = ![],
    _0x30171d = !![],
    _0x3f08f7 = '',
    _0x2214f2 = '',
    _0x64da6e = null,
    _0x4ac088 = new Set();
  const _0xba4368 = () => {
      if (_0x49d06f === null) return ![];
      return (clearTimer(_0x49d06f), (_0x49d06f = null), !![]);
    },
    _0x3f5a70 = () => {
      ((_0x36416d = []), (_0x441b36 = ''), (_0x1b5335 = null));
      if (_0x161fde === null) return ![];
      return (clearTimer(_0x161fde), (_0x161fde = null), !![]);
    },
    _0x197509 = (_0x4e775d) => {
      for (const [_0x31991e, _0x1d38e4] of _0x277b8a) {
        if (_0x1d38e4['entry'] === _0x4e775d) _0x277b8a['delete'](_0x31991e);
      }
    },
    _0x8e03d0 = (_0x5f0fa8) => {
      if (!_0x5f0fa8 || _0x5ebc7a['get'](_0x5f0fa8['nodeId']) !== _0x5f0fa8) return ![];
      return (_0x5ebc7a['delete'](_0x5f0fa8['nodeId']), _0x197509(_0x5f0fa8), !![]);
    },
    _0x3c8a82 = (_0x136ae3 = {}) => {
      const _0x132119 = String(_0x136ae3?.['taskId'] || _0x136ae3?.['id'] || '')['trim']();
      if (_0x132119) {
        for (const _0x468da9 of _0x5ebc7a['values']()) {
          if (_0x468da9['taskId'] === _0x132119) return _0x468da9;
        }
        return null;
      }
      const _0x5e3aee = String(_0x136ae3?.['nodeId'] || '')['trim'](),
        _0x32a966 = _0x5e3aee ? _0x5ebc7a['get'](_0x5e3aee) || null : null;
      return _0x32a966?.['taskId'] ? _0x32a966 : null;
    },
    _0x1ebb3e = (_0x168143 = {}) => {
      const _0x25c938 = String(_0x168143?.['taskId'] || _0x168143?.['id'] || '')['trim'](),
        _0x353cff = String(_0x168143?.['nodeId'] || '')['trim'](),
        _0x23d83a = _0x353cff ? _0x5ebc7a['get'](_0x353cff) || null : null,
        _0x22062b = _0x23d83a?.['status'] === 'submitting' && !_0x23d83a['taskId'] ? _0x23d83a : null,
        _0x584e9c = String(_0x168143?.['status'] || '')
          ['trim']()
          ['toLowerCase']();
      if (!_0x25c938 || !_0x22062b) {
        const _0x745f30 =
          !!_0x25c938 &&
          PROXY_MIGRATION_TERMINAL_STATUSES['has'](_0x584e9c) &&
          Array['from'](_0x5ebc7a['values']())['some'](
            (_0x2c469e) => _0x2c469e?.['status'] === 'submitting' && !_0x2c469e?.['taskId'],
          );
        if (!_0x745f30) return ![];
      }
      if (!_0x277b8a['has'](_0x25c938))
        while (_0x277b8a['size'] >= MAX_PENDING_PROXY_MIGRATION_UPDATE_COUNT) {
          const _0x550332 = _0x277b8a['keys']()['next']()['value'];
          _0x277b8a['delete'](_0x550332);
        }
      else _0x277b8a['delete'](_0x25c938);
      return (_0x277b8a['set'](_0x25c938, { entry: _0x22062b, event: _0x168143 }), !![]);
    },
    _0x3b4f48 = (_0x3bb726, _0x1f91a1) => {
      let _0x32ea21 = null;
      for (const [_0x287260, _0x1be9c3] of _0x277b8a) {
        const _0x1ed8ea = _0x1be9c3['entry'] === _0x3bb726,
          _0x44c863 = !_0x1be9c3['entry'] && _0x287260 === _0x1f91a1;
        (_0x287260 === _0x1f91a1 && (_0x1ed8ea || _0x44c863) && (_0x32ea21 = _0x1be9c3['event']),
          (_0x1ed8ea || _0x44c863) && _0x277b8a['delete'](_0x287260));
      }
      return _0x32ea21;
    },
    _0x70d193 = (_0x25755a) => {
      if (
        !_0x25755a ||
        _0x25755a['cancelRequested'] ||
        _0x25755a['status'] !== 'waiting' ||
        !_0x25755a['taskId']
      )
        return ![];
      _0x25755a['cancelRequested'] = !![];
      try {
        void Promise['resolve'](cancelProxyMigrationTask(_0x25755a['taskId']))
          ['then']((_0x4d1cd5) => {
            if (_0x5ebc7a['get'](_0x25755a['nodeId']) !== _0x25755a) return;
            const _0x4eff6d = String(_0x4d1cd5?.['task']?.['status'] || _0x4d1cd5?.['status'] || '')
              ['trim']()
              ['toLowerCase']();
            if (_0x4eff6d) _0x25755a['status'] = _0x4eff6d;
            if (PROXY_MIGRATION_TERMINAL_STATUSES['has'](_0x4eff6d)) {
              _0x8e03d0(_0x25755a) && _0x457851();
              return;
            }
            (_0x4d1cd5?.['skipped'] === !![] || _0x4d1cd5?.['ok'] === ![]) &&
              (_0x25755a['cancelRequested'] = ![]);
          })
          ['catch']((_0x675c02) => {
            ((_0x25755a['cancelRequested'] = ![]),
              console['warn']('[canvasViewportVideoWarmup] proxy migration cancel failed:', _0x675c02));
          });
      } catch (_0x2c14ca) {
        ((_0x25755a['cancelRequested'] = ![]),
          console['warn']('[canvasViewportVideoWarmup] proxy migration cancel failed:', _0x2c14ca));
      }
      return !![];
    },
    _0x4253f5 = (_0x1105ba) => _0x64da6e === _0x2214f2 && !_0x4ac088['has'](_0x1105ba['nodeId']),
    _0x10210c = () => {
      for (const _0x2e6fad of _0x5ebc7a['values']()) {
        if (!_0x4253f5(_0x2e6fad)) continue;
        _0x70d193(_0x2e6fad);
      }
    },
    _0x50a219 = (_0x459c3a, _0x5e7e19, _0x1b49eb) => {
      const _0x2aa1ab = {
        nodeId: _0x459c3a,
        taskId: '',
        status: 'submitting',
        signature: _0x5e7e19,
        viewport: _0x1b49eb,
        cancelRequested: ![],
      };
      _0x5ebc7a['set'](_0x459c3a, _0x2aa1ab);
      try {
        void Promise['resolve'](requestProxyMigration(_0x459c3a))
          ['then']((_0xcc8a21) => {
            if (_0x5ebc7a['get'](_0x459c3a) !== _0x2aa1ab) return;
            if (!_0xcc8a21 || typeof _0xcc8a21 !== 'object') {
              (_0x8e03d0(_0x2aa1ab), _0x457851());
              return;
            }
            ((_0x2aa1ab['taskId'] = String(_0xcc8a21['taskId'] || _0xcc8a21['id'] || '')['trim']()),
              (_0x2aa1ab['status'] = String(_0xcc8a21['status'] || 'waiting')
                ['trim']()
                ['toLowerCase']()));
            const _0x2793fd = _0x3b4f48(_0x2aa1ab, _0x2aa1ab['taskId']);
            if (_0x2793fd) {
              _0x5573e0(_0x2aa1ab, _0x2793fd);
              if (_0x5ebc7a['get'](_0x459c3a) !== _0x2aa1ab) return;
            }
            (_0x4253f5(_0x2aa1ab) && _0x70d193(_0x2aa1ab),
              PROXY_MIGRATION_TERMINAL_STATUSES['has'](_0x2aa1ab['status']) &&
                (_0x8e03d0(_0x2aa1ab), _0x457851()));
          })
          ['catch']((_0x4ddf56) => {
            (_0x8e03d0(_0x2aa1ab) && _0x457851(),
              console['warn']('[canvasViewportVideoWarmup] proxy migration request failed:', _0x4ddf56));
          });
      } catch (_0x32fd9f) {
        (_0x8e03d0(_0x2aa1ab) && _0x457851(),
          console['warn']('[canvasViewportVideoWarmup] proxy migration request failed:', _0x32fd9f));
      }
    },
    _0x383909 = (_0x1d71f2) => {
      try {
        return isViewportInteractionActive({ viewport: _0x1d71f2, containerEl: _0x1613b5 }) === !![];
      } catch {
        return ![];
      }
    },
    _0x120095 = (_0x5325f1, _0x41945e) => {
      if (_0x1658d4 || !_0x30171d || _0x441b36 !== _0x5325f1 || _0x2214f2 !== _0x5325f1) return;
      if (_0x383909(_0x41945e)) {
        _0x161fde === null &&
          ((_0x161fde = setTimer(() => {
            ((_0x161fde = null), _0x120095(_0x5325f1, _0x41945e));
          }, _0x5be4e5)),
          _0x161fde?.['unref']?.());
        return;
      }
      let _0x40b9cf = DEFAULT_PROXY_MIGRATION_BATCH_SIZE;
      try {
        _0x40b9cf = resolveProxyMigrationBatchSize({
          queuedCount: _0x36416d['length'],
          viewport: _0x41945e,
          containerEl: _0x1613b5,
        });
      } catch {}
      const _0x55ab44 = normalizeProxyMigrationBatchSize(_0x40b9cf),
        _0x434812 = Math['max'](0x0, _0x55ab44 - _0x5ebc7a['size']);
      if (_0x434812 === 0x0) return;
      const _0x4a8b37 = _0x36416d['splice'](0x0, _0x434812);
      for (const _0x7e0746 of _0x4a8b37) {
        _0x50a219(_0x7e0746, _0x5325f1, _0x41945e);
      }
      if (_0x36416d['length'] === 0x0) {
        ((_0x441b36 = ''), (_0x1b5335 = null));
        return;
      }
    },
    _0x457851 = () => {
      if (!_0x441b36 || !_0x1b5335) return;
      _0x120095(_0x441b36, _0x1b5335);
    },
    _0x5573e0 = (_0x4704e3, _0x220f50 = {}) => {
      const _0x18d4b6 = String(_0x220f50['status'] || '')
        ['trim']()
        ['toLowerCase']();
      if (_0x18d4b6) _0x4704e3['status'] = _0x18d4b6;
      const _0x1e1c56 = String(_0x220f50['taskId'] || _0x220f50['id'] || '')['trim']();
      if (_0x1e1c56) _0x4704e3['taskId'] = _0x1e1c56;
      _0x4253f5(_0x4704e3) && _0x70d193(_0x4704e3);
      if (!PROXY_MIGRATION_TERMINAL_STATUSES['has'](_0x18d4b6)) return;
      if (!_0x8e03d0(_0x4704e3)) return;
      _0x457851();
    },
    _0x5359ad = subscribeProxyMigrationUpdates((_0x2b872c = {}) => {
      const _0x4f04eb = _0x3c8a82(_0x2b872c);
      if (!_0x4f04eb) {
        _0x1ebb3e(_0x2b872c);
        return;
      }
      _0x5573e0(_0x4f04eb, _0x2b872c);
    }),
    _0x2d7f86 = (_0x1a4d03) => {
      if (_0x1658d4 || !_0x30171d) return;
      const _0x24e412 = normalizeViewport(_0x1a4d03?.['viewport']),
        _0x1245f5 = _0x24e412['zoom'] <= LOW_ZOOM_VIDEO_WARMUP_THRESHOLD;
      if (!_0x1245f5) {
        (_0xba4368(),
          _0x3f5a70(),
          (_0x3f08f7 = ''),
          (_0x2214f2 = ''),
          (_0x64da6e = ''),
          (_0x4ac088 = new Set()),
          _0x10210c());
        return;
      }
      const _0x322095 = buildCanvasViewportVideoWarmupSignature(_0x1a4d03);
      if (_0x322095 === _0x3f08f7) return;
      const _0x32b477 = buildCanvasViewportVideoWarmupScopeSignature(_0x1a4d03),
        _0x1625ad = _0x32b477 !== _0x2214f2;
      ((_0x3f08f7 = _0x322095), (_0x2214f2 = _0x32b477), _0xba4368());
      _0x1625ad && _0x3f5a70();
      const _0x298651 = () => {
        _0x49d06f = null;
        if (_0x1658d4 || !_0x30171d) return;
        const _0x3c1062 = readStoreSnapshot(_0x4e0969),
          _0x191998 = normalizeViewport(_0x3c1062['viewport']);
        if (_0x191998['zoom'] > LOW_ZOOM_VIDEO_WARMUP_THRESHOLD) {
          _0x3f08f7 = '';
          return;
        }
        if (buildCanvasViewportVideoWarmupSignature(_0x3c1062) !== _0x322095) return;
        if (_0x383909(_0x191998)) {
          ((_0x49d06f = setTimer(_0x298651, _0x155661)), _0x49d06f?.['unref']?.());
          return;
        }
        const _0x27f0f4 = collectVisibleLegacySourceVideoNodeIds({
          nodes: _0x3c1062['nodes'],
          viewport: _0x3c1062['viewport'],
          containerEl: _0x1613b5,
          isLegacySourceVideo: isLegacySourceVideo,
          buildProxyPromotionPatch: buildProxyPromotionPatch,
        });
        ((_0x64da6e = _0x32b477), (_0x4ac088 = new Set(_0x27f0f4)), _0x10210c());
        const _0x534551 = new Set(_0x3c1062['selectedNodeIds'] || []),
          _0x4028b7 = {},
          _0xc768b0 = [];
        for (const _0xd746a5 of _0x27f0f4) {
          const _0x250415 = buildProxyPromotionPatch(_0x3c1062['nodes']?.[_0xd746a5]);
          if (_0x250415) {
            if (!_0x534551['has'](_0xd746a5)) _0x4028b7[_0xd746a5] = _0x250415;
            continue;
          }
          _0xc768b0['push'](_0xd746a5);
        }
        const _0x4bc02f = Object['keys'](_0x4028b7);
        if (_0x4bc02f['length'] > 0x0) {
          if (typeof _0x4e0969['updateNodesData'] === 'function') _0x4e0969['updateNodesData'](_0x4028b7);
          else
            for (const _0x3ed3d0 of _0x4bc02f) {
              _0x4e0969['updateNodeData']?.(_0x3ed3d0, _0x4028b7[_0x3ed3d0]);
            }
        }
        const _0x33a803 = readStoreSnapshot(_0x4e0969);
        (syncWarmup({
          canvas: {
            nodes: _0x33a803['nodes'] || {},
            viewport: _0x33a803['viewport'],
            selectedNodeIds: _0x33a803['selectedNodeIds'],
          },
          containerEl: _0x1613b5,
        }),
          (_0x36416d = sortProxyMigrationNodeIdsByPriority({
            nodeIds: _0xc768b0,
            nodes: _0x33a803['nodes'],
            selectedNodeIds: _0x33a803['selectedNodeIds'],
            viewport: _0x33a803['viewport'],
            containerEl: _0x1613b5,
          })['filter']((_0x3c58ef) => !_0x5ebc7a['has'](_0x3c58ef))),
          (_0x441b36 = _0x32b477),
          (_0x1b5335 = _0x191998),
          _0x120095(_0x32b477, _0x191998));
      };
      ((_0x49d06f = setTimer(_0x298651, _0x155661)), _0x49d06f?.['unref']?.());
    };
  let _0x37e4d8 = () => {};
  if (typeof _0x4e0969['subscribeSelector'] === 'function')
    _0x37e4d8 = _0x4e0969['subscribeSelector'](
      (_0x19ddfc) => ({
        viewport: _0x19ddfc['viewport'],
        selectedNodeIds: _0x19ddfc['selectedNodeIds'],
        _sourceVideoRev: _0x19ddfc['_sourceVideoRev'],
        _nodeGeometryRev: _0x19ddfc['_nodeGeometryRev'],
      }),
      () => _0x2d7f86(readStoreSnapshot(_0x4e0969)),
      {
        isEqual: (_0x326a3a, _0x2600a0) =>
          _0x326a3a?.['viewport'] === _0x2600a0?.['viewport'] &&
          _0x326a3a?.['selectedNodeIds'] === _0x2600a0?.['selectedNodeIds'] &&
          _0x326a3a?.['_sourceVideoRev'] === _0x2600a0?.['_sourceVideoRev'] &&
          _0x326a3a?.['_nodeGeometryRev'] === _0x2600a0?.['_nodeGeometryRev'],
      },
    );
  else
    typeof _0x4e0969['subscribeRaw'] === 'function'
      ? (_0x37e4d8 = _0x4e0969['subscribeRaw'](_0x2d7f86))
      : _0x2d7f86(readStoreSnapshot(_0x4e0969));
  const _0x486b40 = () => {
    if (_0x1658d4) return;
    ((_0x1658d4 = !![]),
      _0xba4368(),
      _0x3f5a70(),
      _0x5ebc7a['clear'](),
      _0x277b8a['clear'](),
      _0x5359ad?.(),
      _0x37e4d8?.(),
      clearWarmup());
  };
  return (
    (_0x486b40['setPresentationActive'] = (_0x498f0d) => {
      if (_0x1658d4 || _0x30171d === (_0x498f0d === !![])) return;
      ((_0x30171d = _0x498f0d === !![]), _0xba4368(), _0x3f5a70(), (_0x3f08f7 = ''));
      if (_0x30171d) _0x2d7f86(readStoreSnapshot(_0x4e0969));
      else clearWarmup();
    }),
    _0x486b40
  );
}
