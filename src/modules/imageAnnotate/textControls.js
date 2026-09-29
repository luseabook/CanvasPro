export const TEXT_CONTROL_BUTTON_RADIUS = 9;
export const TEXT_CONTROL_SIDE_HANDLE_RADIUS = 7;
export const TEXT_CONTROL_HIT_RADIUS = 13;
export const TEXT_CONTROL_MIN_SCALE = 0.1;
export const TEXT_CONTROL_MAX_SCALE = 20;
export const TEXT_COPY_OFFSET_WORLD = 16;
export const clampTextScale = (_0xc5747b) => {
  const _0x1fd306 = Number(_0xc5747b);
  if (!Number.isFinite(_0x1fd306)) return 1;
  return Math.max(TEXT_CONTROL_MIN_SCALE, Math.min(TEXT_CONTROL_MAX_SCALE, _0x1fd306));
};
export const getTextScalePair = (_0xe2b01b = {}) => {
  const _0x341ea9 = clampTextScale(_0xe2b01b.scale);
  return {
    scaleX: clampTextScale(
      _0xe2b01b.scaleX === undefined || _0xe2b01b.scaleX === null ? _0x341ea9 : _0xe2b01b.scaleX,
    ),
    scaleY: clampTextScale(
      _0xe2b01b.scaleY === undefined || _0xe2b01b.scaleY === null ? _0x341ea9 : _0xe2b01b.scaleY,
    ),
  };
};
export const getTextLayout = ({ canvasEl: _0x42d906, cmd: _0x253749, viewport: _0x3870fc } = {}) => {
  if (!_0x42d906 || !_0x253749) return null;
  const _0x5b1d56 = _0x3870fc?.zoom || 1,
    _0x2254bc = Math.max(1, Number(_0x253749.sizeWorld || 0) * _0x5b1d56),
    _0x5d365c = Number(_0x253749.x || 0) * _0x5b1d56,
    _0x26fc5f = Number(_0x253749.y || 0) * _0x5b1d56,
    _0x12e242 = _0x42d906.getContext('2d');
  (_0x12e242.save(), (_0x12e242.font = _0x2254bc + 'px sans-serif'));
  const _0x109f90 = String(_0x253749.text || ''),
    _0x3e692b = _0x12e242.measureText(_0x109f90 || ' ');
  _0x12e242.restore();
  const _0x2d040f = Math.max(1, Number(_0x3e692b.width) || _0x2254bc),
    _0x5d9129 = Number(_0x3e692b.actualBoundingBoxAscent) || _0x2254bc * 0.8,
    _0x2e859e = Number(_0x3e692b.actualBoundingBoxDescent) || _0x2254bc * 0.2,
    _0x229c6a = Math.max(1, _0x5d9129 + _0x2e859e);
  return { x: _0x5d365c, y: _0x26fc5f, width: _0x2d040f, height: _0x229c6a, fontSize: _0x2254bc };
};
export const getTextGeometry = ({ canvasEl: _0x276619, cmd: _0x2b07d5, viewport: _0x3c41f0 } = {}) => {
  const _0x296b2c = getTextLayout({ canvasEl: _0x276619, cmd: _0x2b07d5, viewport: _0x3c41f0 });
  if (!_0x296b2c) return null;
  const { scaleX: _0x5f4cff, scaleY: _0x13779a } = getTextScalePair(_0x2b07d5),
    _0x5a2e43 = Number(_0x2b07d5?.rotation) || 0,
    _0x20814a = _0x296b2c.width * _0x5f4cff,
    _0x491602 = _0x296b2c.height * _0x13779a,
    _0x5578db = _0x296b2c.x,
    _0x11f4cf = _0x296b2c.y,
    _0x3de6d7 = (_0x443610, _0x446145) => {
      const _0x116544 = _0x443610 - _0x5578db,
        _0x4f4444 = _0x446145 - _0x11f4cf,
        _0x422b29 = Math.cos(_0x5a2e43),
        _0x691484 = Math.sin(_0x5a2e43);
      return {
        x: _0x5578db + _0x116544 * _0x422b29 - _0x4f4444 * _0x691484,
        y: _0x11f4cf + _0x116544 * _0x691484 + _0x4f4444 * _0x422b29,
      };
    },
    _0x5a0e89 = _0x3de6d7(_0x5578db, _0x11f4cf),
    _0x403d7d = _0x3de6d7(_0x5578db + _0x20814a, _0x11f4cf),
    _0x1c5dc3 = _0x3de6d7(_0x5578db + _0x20814a, _0x11f4cf + _0x491602),
    _0x4318ac = _0x3de6d7(_0x5578db, _0x11f4cf + _0x491602);
  return {
    ..._0x296b2c,
    scale: Math.max(_0x5f4cff, _0x13779a),
    scaleX: _0x5f4cff,
    scaleY: _0x13779a,
    rotation: _0x5a2e43,
    corners: [_0x5a0e89, _0x403d7d, _0x1c5dc3, _0x4318ac],
    center: { x: (_0x5a0e89.x + _0x1c5dc3.x) / 2, y: (_0x5a0e89.y + _0x1c5dc3.y) / 2 },
    anchor: { x: _0x5578db, y: _0x11f4cf },
    handles: {
      corners: [_0x5a0e89, _0x403d7d, _0x1c5dc3, _0x4318ac],
      top: { x: (_0x5a0e89.x + _0x403d7d.x) / 2, y: (_0x5a0e89.y + _0x403d7d.y) / 2 },
      right: { x: (_0x403d7d.x + _0x1c5dc3.x) / 2, y: (_0x403d7d.y + _0x1c5dc3.y) / 2 },
      bottom: { x: (_0x1c5dc3.x + _0x4318ac.x) / 2, y: (_0x1c5dc3.y + _0x4318ac.y) / 2 },
      left: { x: (_0x4318ac.x + _0x5a0e89.x) / 2, y: (_0x4318ac.y + _0x5a0e89.y) / 2 },
    },
  };
};
export const distanceToPoint = (_0x236152, _0x36e31d) =>
  Math.hypot(
    Number(_0x236152?.x || 0) - Number(_0x36e31d?.x || 0),
    Number(_0x236152?.y || 0) - Number(_0x36e31d?.y || 0),
  );
export const toTextLocalTransformSpace = (_0x420a2d, _0x5ae1f4, _0x1cf871) => {
  const _0x112294 = Number(_0x420a2d?.x || 0) - Number(_0x5ae1f4?.x || 0),
    _0x13faf0 = Number(_0x420a2d?.y || 0) - Number(_0x5ae1f4?.y || 0),
    _0xfd731c = Math.cos(-(Number(_0x1cf871) || 0)),
    _0xa4679 = Math.sin(-(Number(_0x1cf871) || 0));
  return { x: _0x112294 * _0xfd731c - _0x13faf0 * _0xa4679, y: _0x112294 * _0xa4679 + _0x13faf0 * _0xfd731c };
};
export const rotateTextLocalPoint = (_0x3814a6, _0x4b9b9c) => {
  const _0x1b1c34 = Math.cos(Number(_0x4b9b9c) || 0),
    _0x5844bf = Math.sin(Number(_0x4b9b9c) || 0),
    _0x2111da = Number(_0x3814a6?.x || 0),
    _0x206359 = Number(_0x3814a6?.y || 0);
  return {
    x: _0x2111da * _0x1b1c34 - _0x206359 * _0x5844bf,
    y: _0x2111da * _0x5844bf + _0x206359 * _0x1b1c34,
  };
};
export const resolveAxisTextScale = (_0x476312, _0x11bb02) => {
  const _0x3dfb12 = toTextLocalTransformSpace(_0x11bb02, _0x476312.anchorPx, _0x476312.rotation);
  let _0x1014f1 = _0x476312.baseScaleX,
    _0x5770a3 = _0x476312.baseScaleY,
    _0xc1ef1f = { x: 0, y: 0 };
  if (_0x476312.handle === 'right') _0x1014f1 = clampTextScale(_0x3dfb12.x / _0x476312.layoutWidth);
  else {
    if (_0x476312.handle === 'left')
      ((_0x1014f1 = clampTextScale(-_0x3dfb12.x / _0x476312.layoutWidth)),
        (_0xc1ef1f = { x: -_0x476312.layoutWidth * _0x1014f1, y: 0 }));
    else {
      if (_0x476312.handle === 'bottom') _0x5770a3 = clampTextScale(_0x3dfb12.y / _0x476312.layoutHeight);
      else
        _0x476312.handle === 'top' &&
          ((_0x5770a3 = clampTextScale(-_0x3dfb12.y / _0x476312.layoutHeight)),
          (_0xc1ef1f = { x: 0, y: -_0x476312.layoutHeight * _0x5770a3 }));
    }
  }
  const _0x314817 = rotateTextLocalPoint(_0xc1ef1f, _0x476312.rotation);
  return {
    scaleX: _0x1014f1,
    scaleY: _0x5770a3,
    originPx: { x: _0x476312.anchorPx.x + _0x314817.x, y: _0x476312.anchorPx.y + _0x314817.y },
  };
};
export const isPointInPolygon = (_0x24f1dc, _0x169b54) => {
  let _0x5b4dee = false;
  for (
    let _0xe4b251 = 0, _0x321617 = _0x169b54.length - 1;
    _0xe4b251 < _0x169b54.length;
    _0x321617 = _0xe4b251++
  ) {
    const _0x5b654 = _0x169b54[_0xe4b251].x,
      _0x18b1db = _0x169b54[_0xe4b251].y,
      _0x17e8b5 = _0x169b54[_0x321617].x,
      _0x4311bf = _0x169b54[_0x321617].y,
      _0x3fd645 =
        _0x18b1db > _0x24f1dc.y !== _0x4311bf > _0x24f1dc.y &&
        _0x24f1dc.x <
          ((_0x17e8b5 - _0x5b654) * (_0x24f1dc.y - _0x18b1db)) / (_0x4311bf - _0x18b1db || 0.000001) +
            _0x5b654;
    if (_0x3fd645) _0x5b4dee = !_0x5b4dee;
  }
  return _0x5b4dee;
};
export const findTextHit = ({
  commands: _0x26ab62,
  selectedTextCommandIndex: _0x3f8f44,
  local: _0x323f09,
  viewport: _0x3b63bf,
  canvasEl: _0x87adb,
} = {}) => {
  const _0x363696 = _0x3b63bf?.zoom || 1,
    _0x8796a0 = { x: Number(_0x323f09?.x || 0) * _0x363696, y: Number(_0x323f09?.y || 0) * _0x363696 },
    _0x4d27c8 = Number(_0x3f8f44);
  if (
    Number.isInteger(_0x4d27c8) &&
    _0x4d27c8 >= 0 &&
    _0x4d27c8 < _0x26ab62.length &&
    _0x26ab62[_0x4d27c8]?.type === 'text'
  ) {
    const _0x19059c = getTextGeometry({ canvasEl: _0x87adb, cmd: _0x26ab62[_0x4d27c8], viewport: _0x3b63bf });
    if (_0x19059c) {
      const [_0x16a725, _0x24b024, _0x18232d, _0x324d4e] = _0x19059c.corners,
        _0x58c516 = [
          { point: _0x16a725, mode: 'delete' },
          { point: _0x324d4e, mode: 'copy' },
          { point: _0x24b024, mode: 'rotate' },
          { point: _0x18232d, mode: 'scale-uniform' },
        ],
        _0x2a2b1c = [
          { point: _0x19059c.handles.top, mode: 'scale-y', handle: 'top' },
          { point: _0x19059c.handles.right, mode: 'scale-x', handle: 'right' },
          { point: _0x19059c.handles.bottom, mode: 'scale-y', handle: 'bottom' },
          { point: _0x19059c.handles.left, mode: 'scale-x', handle: 'left' },
        ],
        _0x2e7a76 = [
          ..._0x58c516.map((_0xdbcf72) => ({
            ..._0xdbcf72,
            distance: distanceToPoint(_0x8796a0, _0xdbcf72.point),
            radius: TEXT_CONTROL_HIT_RADIUS,
          })),
          ..._0x2a2b1c.map((_0x6e21e5) => ({
            ..._0x6e21e5,
            distance: distanceToPoint(_0x8796a0, _0x6e21e5.point),
            radius: TEXT_CONTROL_SIDE_HANDLE_RADIUS + 4,
          })),
        ]
          .filter((_0x120092) => _0x120092.distance <= _0x120092.radius)
          .sort((_0xdb22e, _0x36f112) => _0xdb22e.distance - _0x36f112.distance);
      if (_0x2e7a76.length > 0) {
        const _0x3902ff = _0x2e7a76[0];
        return { index: _0x4d27c8, mode: _0x3902ff.mode, handle: _0x3902ff.handle, geom: _0x19059c };
      }
      if (isPointInPolygon(_0x8796a0, _0x19059c.corners))
        return { index: _0x4d27c8, mode: 'move', geom: _0x19059c };
    }
  }
  for (let _0x17860a = _0x26ab62.length - 1; _0x17860a >= 0; _0x17860a -= 1) {
    const _0xbc667d = _0x26ab62[_0x17860a];
    if (_0xbc667d?.type !== 'text') continue;
    const _0x24fc25 = getTextGeometry({ canvasEl: _0x87adb, cmd: _0xbc667d, viewport: _0x3b63bf });
    if (!_0x24fc25) continue;
    if (isPointInPolygon(_0x8796a0, _0x24fc25.corners))
      return { index: _0x17860a, mode: 'move', geom: _0x24fc25 };
  }
  return null;
};
export const createTextTransformState = ({
  commands: _0x2187f9,
  hit: _0x1c83ed,
  local: _0x87aaf2,
  viewport: _0x24071c,
  canvasEl: _0x4184e0,
} = {}) => {
  const _0x1beba5 = _0x24071c?.zoom || 1,
    _0x438635 = { x: Number(_0x87aaf2?.x || 0) * _0x1beba5, y: Number(_0x87aaf2?.y || 0) * _0x1beba5 },
    _0x124034 = _0x2187f9[_0x1c83ed.index],
    _0x1d89e7 =
      _0x1c83ed.geom || getTextGeometry({ canvasEl: _0x4184e0, cmd: _0x124034, viewport: _0x24071c });
  if (!_0x1d89e7) return null;
  if (_0x1c83ed.mode === 'move')
    return {
      index: _0x1c83ed.index,
      mode: 'move',
      offsetWorldX: Number(_0x87aaf2?.x || 0) - Number(_0x124034?.x || 0),
      offsetWorldY: Number(_0x87aaf2?.y || 0) - Number(_0x124034?.y || 0),
    };
  if (_0x1c83ed.mode === 'scale') return null;
  if (_0x1c83ed.mode === 'scale-x' || _0x1c83ed.mode === 'scale-y') {
    const _0x1d2f61 = String(_0x1c83ed.handle || ''),
      _0x2f85aa = {
        right: _0x1d89e7.corners[0],
        bottom: _0x1d89e7.corners[0],
        left: _0x1d89e7.corners[1],
        top: _0x1d89e7.corners[3],
      },
      _0x44e4db = _0x2f85aa[_0x1d2f61] || _0x1d89e7.corners[0];
    return {
      index: _0x1c83ed.index,
      mode: _0x1c83ed.mode,
      handle: _0x1d2f61,
      anchorPx: { x: _0x44e4db.x, y: _0x44e4db.y },
      baseScaleX: _0x1d89e7.scaleX,
      baseScaleY: _0x1d89e7.scaleY,
      layoutWidth: Math.max(1, Number(_0x1d89e7.width) || 1),
      layoutHeight: Math.max(1, Number(_0x1d89e7.height) || 1),
      rotation: Number(_0x124034?.rotation) || 0,
    };
  }
  if (_0x1c83ed.mode === 'scale-uniform')
    return {
      index: _0x1c83ed.index,
      mode: 'scale-uniform',
      originPx: { x: _0x1d89e7.anchor.x, y: _0x1d89e7.anchor.y },
      baseWidthPx: Math.max(1, Number(_0x1d89e7.width) || 1) * _0x1d89e7.scaleX,
      baseHeightPx: Math.max(1, Number(_0x1d89e7.height) || 1) * _0x1d89e7.scaleY,
      baseScaleX: _0x1d89e7.scaleX,
      baseScaleY: _0x1d89e7.scaleY,
      rotation: Number(_0x124034?.rotation) || 0,
    };
  if (_0x1c83ed.mode === 'rotate')
    return {
      index: _0x1c83ed.index,
      mode: 'rotate',
      centerPx: { x: _0x1d89e7.center.x, y: _0x1d89e7.center.y },
      baseAngle: Math.atan2(_0x438635.y - _0x1d89e7.center.y, _0x438635.x - _0x1d89e7.center.x),
      baseRotation: Number(_0x124034?.rotation) || 0,
      layoutWidth: Math.max(1, Number(_0x1d89e7.width) || 1),
      layoutHeight: Math.max(1, Number(_0x1d89e7.height) || 1),
    };
  return null;
};
export const buildCopiedTextCommand = (_0x2a3886, _0x4d979c) => {
  const _0x5b28cd = _0x4d979c?.zoom || 1,
    _0x5f0ba3 = TEXT_COPY_OFFSET_WORLD / _0x5b28cd;
  return { ..._0x2a3886, x: Number(_0x2a3886.x || 0) + _0x5f0ba3, y: Number(_0x2a3886.y || 0) + _0x5f0ba3 };
};

export const TEXT_LINE_HEIGHT_RATIO=1.2;

export const TEXT_ROTATE_HANDLE_OFFSET=0x18;

export const TEXT_ROTATE_HIT_RADIUS=0xd;

const getViewportZoom=_0x15166e=>{const _0x56d280=Number(_0x15166e?.['zoom']);return Number["isFinite"](_0x56d280)&&_0x56d280>0x0?_0x56d280:0x1;},getScreenX=(_0x5529b2,_0x33c5db)=>((Number(_0x5529b2)||0x0)-(Number(_0x33c5db?.['x'])||0x0))*getViewportZoom(_0x33c5db),getScreenY=(_0x5c68fb,_0x22dfb4)=>((Number(_0x5c68fb)||0x0)-(Number(_0x22dfb4?.['y'])||0x0))*getViewportZoom(_0x22dfb4);

export const getTextRotationHandles=_0x41358a=>{const _0x166738=Array["isArray"](_0x41358a?.['corners'])?_0x41358a["corners"]:[];if(_0x166738['length']<0x2)return[];const [_0x2c1a7f,_0x1c3286]=_0x166738,_0x30da6b=_0x1c3286['x']-_0x2c1a7f['x'],_0x1ff2d1=_0x1c3286['y']-_0x2c1a7f['y'],_0x367cbd=Math["hypot"](_0x30da6b,_0x1ff2d1)||0x1,_0x5cf120={'x':(_0x2c1a7f['x']+_0x1c3286['x'])/0x2,'y':(_0x2c1a7f['y']+_0x1c3286['y'])/0x2};return[{'point':{'x':_0x5cf120['x']+_0x1ff2d1/_0x367cbd*TEXT_ROTATE_HANDLE_OFFSET,'y':_0x5cf120['y']-_0x30da6b/_0x367cbd*TEXT_ROTATE_HANDLE_OFFSET},'handle':"rotate"}];};

export const getTextRotationHandle=_0x2433dc=>getTextRotationHandles(_0x2433dc)[0x0]?.["point"]||null;

export const getTextAnchorForCenter=({centerPx:_0x447458,layoutWidth:_0x569e99,layoutHeight:_0x27b788,scaleX:_0x280340,scaleY:_0x2df2d9,rotation:_0x47c2a8}={})=>{const _0x2539dd=rotateTextLocalPoint({'x':(Number(_0x569e99)||0x0)*(Number(_0x280340)||0x0)/0x2,'y':(Number(_0x27b788)||0x0)*(Number(_0x2df2d9)||0x0)/0x2},_0x47c2a8);return{'x':Number(_0x447458?.['x']||0x0)-_0x2539dd['x'],'y':Number(_0x447458?.['y']||0x0)-_0x2539dd['y']};};
