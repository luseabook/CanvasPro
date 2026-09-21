/**
 * @license
 * Copyright 2010-2025 Three.js Authors
 * SPDX-License-Identifier: MIT
 */
const REVISION = '180',
  MOUSE = { LEFT: 0, MIDDLE: 1, RIGHT: 2, ROTATE: 0, DOLLY: 1, PAN: 2 },
  TOUCH = { ROTATE: 0, PAN: 1, DOLLY_PAN: 2, DOLLY_ROTATE: 3 },
  CullFaceNone = 0,
  CullFaceBack = 1,
  CullFaceFront = 2,
  CullFaceFrontBack = 3,
  BasicShadowMap = 0,
  PCFShadowMap = 1,
  PCFSoftShadowMap = 2,
  VSMShadowMap = 3,
  FrontSide = 0,
  BackSide = 1,
  DoubleSide = 2,
  NoBlending = 0,
  NormalBlending = 1,
  AdditiveBlending = 2,
  SubtractiveBlending = 3,
  MultiplyBlending = 4,
  CustomBlending = 5,
  AddEquation = 100,
  SubtractEquation = 101,
  ReverseSubtractEquation = 102,
  MinEquation = 103,
  MaxEquation = 104,
  ZeroFactor = 200,
  OneFactor = 201,
  SrcColorFactor = 202,
  OneMinusSrcColorFactor = 203,
  SrcAlphaFactor = 204,
  OneMinusSrcAlphaFactor = 205,
  DstAlphaFactor = 206,
  OneMinusDstAlphaFactor = 207,
  DstColorFactor = 208,
  OneMinusDstColorFactor = 209,
  SrcAlphaSaturateFactor = 210,
  ConstantColorFactor = 211,
  OneMinusConstantColorFactor = 212,
  ConstantAlphaFactor = 213,
  OneMinusConstantAlphaFactor = 214,
  NeverDepth = 0,
  AlwaysDepth = 1,
  LessDepth = 2,
  LessEqualDepth = 3,
  EqualDepth = 4,
  GreaterEqualDepth = 5,
  GreaterDepth = 6,
  NotEqualDepth = 7,
  MultiplyOperation = 0,
  MixOperation = 1,
  AddOperation = 2,
  NoToneMapping = 0,
  LinearToneMapping = 1,
  ReinhardToneMapping = 2,
  CineonToneMapping = 3,
  ACESFilmicToneMapping = 4,
  CustomToneMapping = 5,
  AgXToneMapping = 6,
  NeutralToneMapping = 7,
  AttachedBindMode = 'attached',
  DetachedBindMode = 'detached',
  UVMapping = 0x12c,
  CubeReflectionMapping = 0x12d,
  CubeRefractionMapping = 0x12e,
  EquirectangularReflectionMapping = 0x12f,
  EquirectangularRefractionMapping = 0x130,
  CubeUVReflectionMapping = 0x132,
  RepeatWrapping = 0x3e8,
  ClampToEdgeWrapping = 0x3e9,
  MirroredRepeatWrapping = 0x3ea,
  NearestFilter = 0x3eb,
  NearestMipmapNearestFilter = 0x3ec,
  NearestMipMapNearestFilter = 0x3ec,
  NearestMipmapLinearFilter = 0x3ed,
  NearestMipMapLinearFilter = 0x3ed,
  LinearFilter = 0x3ee,
  LinearMipmapNearestFilter = 0x3ef,
  LinearMipMapNearestFilter = 0x3ef,
  LinearMipmapLinearFilter = 0x3f0,
  LinearMipMapLinearFilter = 0x3f0,
  UnsignedByteType = 0x3f1,
  ByteType = 0x3f2,
  ShortType = 0x3f3,
  UnsignedShortType = 0x3f4,
  IntType = 0x3f5,
  UnsignedIntType = 0x3f6,
  FloatType = 0x3f7,
  HalfFloatType = 0x3f8,
  UnsignedShort4444Type = 0x3f9,
  UnsignedShort5551Type = 0x3fa,
  UnsignedInt248Type = 0x3fc,
  UnsignedInt5999Type = 0x8c3e,
  UnsignedInt101111Type = 0x8c3b,
  AlphaFormat = 0x3fd,
  RGBFormat = 0x3fe,
  RGBAFormat = 0x3ff,
  DepthFormat = 0x402,
  DepthStencilFormat = 0x403,
  RedFormat = 0x404,
  RedIntegerFormat = 0x405,
  RGFormat = 0x406,
  RGIntegerFormat = 0x407,
  RGBIntegerFormat = 0x408,
  RGBAIntegerFormat = 0x409,
  RGB_S3TC_DXT1_Format = 0x83f0,
  RGBA_S3TC_DXT1_Format = 0x83f1,
  RGBA_S3TC_DXT3_Format = 0x83f2,
  RGBA_S3TC_DXT5_Format = 0x83f3,
  RGB_PVRTC_4BPPV1_Format = 0x8c00,
  RGB_PVRTC_2BPPV1_Format = 0x8c01,
  RGBA_PVRTC_4BPPV1_Format = 0x8c02,
  RGBA_PVRTC_2BPPV1_Format = 0x8c03,
  RGB_ETC1_Format = 0x8d64,
  RGB_ETC2_Format = 0x9274,
  RGBA_ETC2_EAC_Format = 0x9278,
  RGBA_ASTC_4x4_Format = 0x93b0,
  RGBA_ASTC_5x4_Format = 0x93b1,
  RGBA_ASTC_5x5_Format = 0x93b2,
  RGBA_ASTC_6x5_Format = 0x93b3,
  RGBA_ASTC_6x6_Format = 0x93b4,
  RGBA_ASTC_8x5_Format = 0x93b5,
  RGBA_ASTC_8x6_Format = 0x93b6,
  RGBA_ASTC_8x8_Format = 0x93b7,
  RGBA_ASTC_10x5_Format = 0x93b8,
  RGBA_ASTC_10x6_Format = 0x93b9,
  RGBA_ASTC_10x8_Format = 0x93ba,
  RGBA_ASTC_10x10_Format = 0x93bb,
  RGBA_ASTC_12x10_Format = 0x93bc,
  RGBA_ASTC_12x12_Format = 0x93bd,
  RGBA_BPTC_Format = 0x8e8c,
  RGB_BPTC_SIGNED_Format = 0x8e8e,
  RGB_BPTC_UNSIGNED_Format = 0x8e8f,
  RED_RGTC1_Format = 0x8dbb,
  SIGNED_RED_RGTC1_Format = 0x8dbc,
  RED_GREEN_RGTC2_Format = 0x8dbd,
  SIGNED_RED_GREEN_RGTC2_Format = 0x8dbe,
  LoopOnce = 0x898,
  LoopRepeat = 0x899,
  LoopPingPong = 0x89a,
  InterpolateDiscrete = 0x8fc,
  InterpolateLinear = 0x8fd,
  InterpolateSmooth = 0x8fe,
  ZeroCurvatureEnding = 0x960,
  ZeroSlopeEnding = 0x961,
  WrapAroundEnding = 0x962,
  NormalAnimationBlendMode = 0x9c4,
  AdditiveAnimationBlendMode = 0x9c5,
  TrianglesDrawMode = 0,
  TriangleStripDrawMode = 1,
  TriangleFanDrawMode = 2,
  BasicDepthPacking = 0xc80,
  RGBADepthPacking = 0xc81,
  RGBDepthPacking = 0xc82,
  RGDepthPacking = 0xc83,
  TangentSpaceNormalMap = 0,
  ObjectSpaceNormalMap = 1,
  NoColorSpace = '',
  SRGBColorSpace = 'srgb',
  LinearSRGBColorSpace = 'srgb-linear',
  LinearTransfer = 'linear',
  SRGBTransfer = 'srgb',
  ZeroStencilOp = 0,
  KeepStencilOp = 0x1e00,
  ReplaceStencilOp = 0x1e01,
  IncrementStencilOp = 0x1e02,
  DecrementStencilOp = 0x1e03,
  IncrementWrapStencilOp = 0x8507,
  DecrementWrapStencilOp = 0x8508,
  InvertStencilOp = 0x150a,
  NeverStencilFunc = 0x200,
  LessStencilFunc = 0x201,
  EqualStencilFunc = 0x202,
  LessEqualStencilFunc = 0x203,
  GreaterStencilFunc = 0x204,
  NotEqualStencilFunc = 0x205,
  GreaterEqualStencilFunc = 0x206,
  AlwaysStencilFunc = 0x207,
  NeverCompare = 0x200,
  LessCompare = 0x201,
  EqualCompare = 0x202,
  LessEqualCompare = 0x203,
  GreaterCompare = 0x204,
  NotEqualCompare = 0x205,
  GreaterEqualCompare = 0x206,
  AlwaysCompare = 0x207,
  StaticDrawUsage = 0x88e4,
  DynamicDrawUsage = 0x88e8,
  StreamDrawUsage = 0x88e0,
  StaticReadUsage = 0x88e5,
  DynamicReadUsage = 0x88e9,
  StreamReadUsage = 0x88e1,
  StaticCopyUsage = 0x88e6,
  DynamicCopyUsage = 0x88ea,
  StreamCopyUsage = 0x88e2,
  GLSL1 = '100',
  GLSL3 = '300 es',
  WebGLCoordinateSystem = 0x7d0,
  WebGPUCoordinateSystem = 0x7d1,
  TimestampQuery = { COMPUTE: 'compute', RENDER: 'render' },
  InterpolationSamplingType = { PERSPECTIVE: 'perspective', LINEAR: 'linear', FLAT: 'flat' },
  InterpolationSamplingMode = {
    NORMAL: 'normal',
    CENTROID: 'centroid',
    SAMPLE: 'sample',
    FIRST: 'first',
    EITHER: 'either',
  };
class EventDispatcher {
  ['addEventListener'](_0x59832e, _0x4e80bc) {
    if (this._listeners === undefined) this._listeners = {};
    const _0x1cbb24 = this._listeners;
    (_0x1cbb24[_0x59832e] === undefined && (_0x1cbb24[_0x59832e] = []),
      _0x1cbb24[_0x59832e].indexOf(_0x4e80bc) === -1 && _0x1cbb24[_0x59832e].push(_0x4e80bc));
  }
  ['hasEventListener'](_0xf88749, _0x2be6f8) {
    const _0x52d4cc = this._listeners;
    if (_0x52d4cc === undefined) return false;
    return _0x52d4cc[_0xf88749] !== undefined && _0x52d4cc[_0xf88749].indexOf(_0x2be6f8) !== -1;
  }
  ['removeEventListener'](_0x184437, _0x239140) {
    const _0x216c43 = this._listeners;
    if (_0x216c43 === undefined) return;
    const _0x2de42c = _0x216c43[_0x184437];
    if (_0x2de42c !== undefined) {
      const _0x504656 = _0x2de42c.indexOf(_0x239140);
      _0x504656 !== -1 && _0x2de42c.splice(_0x504656, 1);
    }
  }
  ['dispatchEvent'](_0x43fa38) {
    const _0x2846f6 = this._listeners;
    if (_0x2846f6 === undefined) return;
    const _0x179a0d = _0x2846f6[_0x43fa38.type];
    if (_0x179a0d !== undefined) {
      _0x43fa38.target = this;
      const _0x3ee552 = _0x179a0d.slice(0);
      for (let _0x2ffdf9 = 0, _0x18261c = _0x3ee552.length; _0x2ffdf9 < _0x18261c; _0x2ffdf9++) {
        _0x3ee552[_0x2ffdf9].call(this, _0x43fa38);
      }
      _0x43fa38.target = null;
    }
  }
}
const _lut = [
  '00',
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '0a',
  '0b',
  '0c',
  '0d',
  '0e',
  '0f',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
  '1a',
  '1b',
  '1c',
  '1d',
  '1e',
  '1f',
  '20',
  '21',
  '22',
  '23',
  '24',
  '25',
  '26',
  '27',
  '28',
  '29',
  '2a',
  '2b',
  '2c',
  '2d',
  '2e',
  '2f',
  '30',
  '31',
  '32',
  '33',
  '34',
  '35',
  '36',
  '37',
  '38',
  '39',
  '3a',
  '3b',
  '3c',
  '3d',
  '3e',
  '3f',
  '40',
  '41',
  '42',
  '43',
  '44',
  '45',
  '46',
  '47',
  '48',
  '49',
  '4a',
  '4b',
  '4c',
  '4d',
  '4e',
  '4f',
  '50',
  '51',
  '52',
  '53',
  '54',
  '55',
  '56',
  '57',
  '58',
  '59',
  '5a',
  '5b',
  '5c',
  '5d',
  '5e',
  '5f',
  '60',
  '61',
  '62',
  '63',
  '64',
  '65',
  '66',
  '67',
  '68',
  '69',
  '6a',
  '6b',
  '6c',
  '6d',
  '6e',
  '6f',
  '70',
  '71',
  '72',
  '73',
  '74',
  '75',
  '76',
  '77',
  '78',
  '79',
  '7a',
  '7b',
  '7c',
  '7d',
  '7e',
  '7f',
  '80',
  '81',
  '82',
  '83',
  '84',
  '85',
  '86',
  '87',
  '88',
  '89',
  '8a',
  '8b',
  '8c',
  '8d',
  '8e',
  '8f',
  '90',
  '91',
  '92',
  '93',
  '94',
  '95',
  '96',
  '97',
  '98',
  '99',
  '9a',
  '9b',
  '9c',
  '9d',
  '9e',
  '9f',
  'a0',
  'a1',
  'a2',
  'a3',
  'a4',
  'a5',
  'a6',
  'a7',
  'a8',
  'a9',
  'aa',
  'ab',
  'ac',
  'ad',
  'ae',
  'af',
  'b0',
  'b1',
  'b2',
  'b3',
  'b4',
  'b5',
  'b6',
  'b7',
  'b8',
  'b9',
  'ba',
  'bb',
  'bc',
  'bd',
  'be',
  'bf',
  'c0',
  'c1',
  'c2',
  'c3',
  'c4',
  'c5',
  'c6',
  'c7',
  'c8',
  'c9',
  'ca',
  'cb',
  'cc',
  'cd',
  'ce',
  'cf',
  'd0',
  'd1',
  'd2',
  'd3',
  'd4',
  'd5',
  'd6',
  'd7',
  'd8',
  'd9',
  'da',
  'db',
  'dc',
  'dd',
  'de',
  'df',
  'e0',
  'e1',
  'e2',
  'e3',
  'e4',
  'e5',
  'e6',
  'e7',
  'e8',
  'e9',
  'ea',
  'eb',
  'ec',
  'ed',
  'ee',
  'ef',
  'f0',
  'f1',
  'f2',
  'f3',
  'f4',
  'f5',
  'f6',
  'f7',
  'f8',
  'f9',
  'fa',
  'fb',
  'fc',
  'fd',
  'fe',
  'ff',
];
let _seed = 0x12d687;
const DEG2RAD = Math.PI / 180,
  RAD2DEG = 180 / Math.PI;
function generateUUID() {
  const _0x5c607b = (Math.random() * 0xffffffff) | 0,
    _0xe69f15 = (Math.random() * 0xffffffff) | 0,
    _0x1fc317 = (Math.random() * 0xffffffff) | 0,
    _0x2b09a2 = (Math.random() * 0xffffffff) | 0,
    _0x43a2bf =
      _lut[_0x5c607b & 255] +
      _lut[(_0x5c607b >> 8) & 255] +
      _lut[(_0x5c607b >> 16) & 255] +
      _lut[(_0x5c607b >> 24) & 255] +
      '-' +
      _lut[_0xe69f15 & 255] +
      _lut[(_0xe69f15 >> 8) & 255] +
      '-' +
      _lut[((_0xe69f15 >> 16) & 15) | 64] +
      _lut[(_0xe69f15 >> 24) & 255] +
      '-' +
      _lut[(_0x1fc317 & 63) | 128] +
      _lut[(_0x1fc317 >> 8) & 255] +
      '-' +
      _lut[(_0x1fc317 >> 16) & 255] +
      _lut[(_0x1fc317 >> 24) & 255] +
      _lut[_0x2b09a2 & 255] +
      _lut[(_0x2b09a2 >> 8) & 255] +
      _lut[(_0x2b09a2 >> 16) & 255] +
      _lut[(_0x2b09a2 >> 24) & 255];
  return _0x43a2bf.toLowerCase();
}
function clamp(_0xd968cd, _0x398367, _0x51bcf0) {
  return Math.max(_0x398367, Math.min(_0x51bcf0, _0xd968cd));
}
function euclideanModulo(_0x24da0d, _0x33307e) {
  return ((_0x24da0d % _0x33307e) + _0x33307e) % _0x33307e;
}
function mapLinear(_0x9a065c, _0x5512fa, _0x32703e, _0x542c36, _0x4dde84) {
  return _0x542c36 + ((_0x9a065c - _0x5512fa) * (_0x4dde84 - _0x542c36)) / (_0x32703e - _0x5512fa);
}
function inverseLerp(_0x3822b3, _0x42fe39, _0x25b816) {
  return _0x3822b3 !== _0x42fe39 ? (_0x25b816 - _0x3822b3) / (_0x42fe39 - _0x3822b3) : 0;
}
function lerp(_0x475e1f, _0x3a2934, _0x4df78e) {
  return (1 - _0x4df78e) * _0x475e1f + _0x4df78e * _0x3a2934;
}
function damp(_0x11e3a2, _0x2d9672, _0x3363ea, _0x13dfe0) {
  return lerp(_0x11e3a2, _0x2d9672, 1 - Math.exp(-_0x3363ea * _0x13dfe0));
}
function pingpong(_0x239efe, _0x440f16 = 1) {
  return _0x440f16 - Math.abs(euclideanModulo(_0x239efe, _0x440f16 * 2) - _0x440f16);
}
function smoothstep(_0x47defe, _0x265021, _0x2871c7) {
  if (_0x47defe <= _0x265021) return 0;
  if (_0x47defe >= _0x2871c7) return 1;
  return (
    (_0x47defe = (_0x47defe - _0x265021) / (_0x2871c7 - _0x265021)),
    _0x47defe * _0x47defe * (3 - 2 * _0x47defe)
  );
}
function smootherstep(_0x1067b1, _0x1989ec, _0x859e02) {
  if (_0x1067b1 <= _0x1989ec) return 0;
  if (_0x1067b1 >= _0x859e02) return 1;
  return (
    (_0x1067b1 = (_0x1067b1 - _0x1989ec) / (_0x859e02 - _0x1989ec)),
    _0x1067b1 * _0x1067b1 * _0x1067b1 * (_0x1067b1 * (_0x1067b1 * 6 - 15) + 10)
  );
}
function randInt(_0x4c227f, _0x507587) {
  return _0x4c227f + Math.floor(Math.random() * (_0x507587 - _0x4c227f + 1));
}
function randFloat(_0x7d6095, _0x201a87) {
  return _0x7d6095 + Math.random() * (_0x201a87 - _0x7d6095);
}
function randFloatSpread(_0x19d01b) {
  return _0x19d01b * (0.5 - Math.random());
}
function seededRandom(_0x3d606f) {
  if (_0x3d606f !== undefined) _seed = _0x3d606f;
  let _0x339698 = (_seed += 0x6d2b79f5);
  return (
    (_0x339698 = Math.imul(_0x339698 ^ (_0x339698 >>> 15), _0x339698 | 1)),
    (_0x339698 ^= _0x339698 + Math.imul(_0x339698 ^ (_0x339698 >>> 7), _0x339698 | 61)),
    ((_0x339698 ^ (_0x339698 >>> 14)) >>> 0) / 0x100000000
  );
}
function degToRad(_0x127cba) {
  return _0x127cba * DEG2RAD;
}
function radToDeg(_0x3f1ee4) {
  return _0x3f1ee4 * RAD2DEG;
}
function isPowerOfTwo(_0x38057c) {
  return (_0x38057c & (_0x38057c - 1)) === 0 && _0x38057c !== 0;
}
function ceilPowerOfTwo(_0x4f5ab1) {
  return Math.pow(2, Math.ceil(Math.log(_0x4f5ab1) / Math.LN2));
}
function floorPowerOfTwo(_0x9b05df) {
  return Math.pow(2, Math.floor(Math.log(_0x9b05df) / Math.LN2));
}
function setQuaternionFromProperEuler(_0x4a91c3, _0x3efdd2, _0x21cf16, _0x3beba7, _0x67097a) {
  const _0x2b92b9 = Math.cos,
    _0x1058a1 = Math.sin,
    _0x2c2cc4 = _0x2b92b9(_0x21cf16 / 2),
    _0x2fddfd = _0x1058a1(_0x21cf16 / 2),
    _0x44dec1 = _0x2b92b9((_0x3efdd2 + _0x3beba7) / 2),
    _0x5bb48d = _0x1058a1((_0x3efdd2 + _0x3beba7) / 2),
    _0x279695 = _0x2b92b9((_0x3efdd2 - _0x3beba7) / 2),
    _0x4c90de = _0x1058a1((_0x3efdd2 - _0x3beba7) / 2),
    _0x2f5e0c = _0x2b92b9((_0x3beba7 - _0x3efdd2) / 2),
    _0x3d063f = _0x1058a1((_0x3beba7 - _0x3efdd2) / 2);
  switch (_0x67097a) {
    case 'XYX':
      _0x4a91c3.set(
        _0x2c2cc4 * _0x5bb48d,
        _0x2fddfd * _0x279695,
        _0x2fddfd * _0x4c90de,
        _0x2c2cc4 * _0x44dec1,
      );
      break;
    case 'YZY':
      _0x4a91c3.set(
        _0x2fddfd * _0x4c90de,
        _0x2c2cc4 * _0x5bb48d,
        _0x2fddfd * _0x279695,
        _0x2c2cc4 * _0x44dec1,
      );
      break;
    case 'ZXZ':
      _0x4a91c3.set(
        _0x2fddfd * _0x279695,
        _0x2fddfd * _0x4c90de,
        _0x2c2cc4 * _0x5bb48d,
        _0x2c2cc4 * _0x44dec1,
      );
      break;
    case 'XZX':
      _0x4a91c3.set(
        _0x2c2cc4 * _0x5bb48d,
        _0x2fddfd * _0x3d063f,
        _0x2fddfd * _0x2f5e0c,
        _0x2c2cc4 * _0x44dec1,
      );
      break;
    case 'YXY':
      _0x4a91c3.set(
        _0x2fddfd * _0x2f5e0c,
        _0x2c2cc4 * _0x5bb48d,
        _0x2fddfd * _0x3d063f,
        _0x2c2cc4 * _0x44dec1,
      );
      break;
    case 'ZYZ':
      _0x4a91c3.set(
        _0x2fddfd * _0x3d063f,
        _0x2fddfd * _0x2f5e0c,
        _0x2c2cc4 * _0x5bb48d,
        _0x2c2cc4 * _0x44dec1,
      );
      break;
    default:
      console.warn(
        'THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: ' + _0x67097a,
      );
  }
}
function denormalize(_0x5e0f5b, _0x4d212f) {
  switch (_0x4d212f.constructor) {
    case Float32Array:
      return _0x5e0f5b;
    case Uint32Array:
      return _0x5e0f5b / 0xffffffff;
    case Uint16Array:
      return _0x5e0f5b / 0xffff;
    case Uint8Array:
      return _0x5e0f5b / 255;
    case Int32Array:
      return Math.max(_0x5e0f5b / 0x7fffffff, -1);
    case Int16Array:
      return Math.max(_0x5e0f5b / 0x7fff, -1);
    case Int8Array:
      return Math.max(_0x5e0f5b / 127, -1);
    default:
      throw new Error('Invalid component type.');
  }
}
function normalize(_0x22ce77, _0x27a719) {
  switch (_0x27a719.constructor) {
    case Float32Array:
      return _0x22ce77;
    case Uint32Array:
      return Math.round(_0x22ce77 * 0xffffffff);
    case Uint16Array:
      return Math.round(_0x22ce77 * 0xffff);
    case Uint8Array:
      return Math.round(_0x22ce77 * 255);
    case Int32Array:
      return Math.round(_0x22ce77 * 0x7fffffff);
    case Int16Array:
      return Math.round(_0x22ce77 * 0x7fff);
    case Int8Array:
      return Math.round(_0x22ce77 * 127);
    default:
      throw new Error('Invalid component type.');
  }
}
const MathUtils = {
  DEG2RAD: DEG2RAD,
  RAD2DEG: RAD2DEG,
  generateUUID: generateUUID,
  clamp: clamp,
  euclideanModulo: euclideanModulo,
  mapLinear: mapLinear,
  inverseLerp: inverseLerp,
  lerp: lerp,
  damp: damp,
  pingpong: pingpong,
  smoothstep: smoothstep,
  smootherstep: smootherstep,
  randInt: randInt,
  randFloat: randFloat,
  randFloatSpread: randFloatSpread,
  seededRandom: seededRandom,
  degToRad: degToRad,
  radToDeg: radToDeg,
  isPowerOfTwo: isPowerOfTwo,
  ceilPowerOfTwo: ceilPowerOfTwo,
  floorPowerOfTwo: floorPowerOfTwo,
  setQuaternionFromProperEuler: setQuaternionFromProperEuler,
  normalize: normalize,
  denormalize: denormalize,
};
class Vector2 {
  constructor(_0x2a9317 = 0, _0x17ab0f = 0) {
    ((Vector2.prototype.isVector2 = true), (this.x = _0x2a9317), (this.y = _0x17ab0f));
  }
  get ['width']() {
    return this.x;
  }
  set ['width'](_0x41e322) {
    this.x = _0x41e322;
  }
  get ['height']() {
    return this.y;
  }
  set ['height'](_0x134376) {
    this.y = _0x134376;
  }
  ['set'](_0x3de22a, _0x280936) {
    return ((this.x = _0x3de22a), (this.y = _0x280936), this);
  }
  ['setScalar'](_0x420cd9) {
    return ((this.x = _0x420cd9), (this.y = _0x420cd9), this);
  }
  ['setX'](_0x170a47) {
    return ((this.x = _0x170a47), this);
  }
  ['setY'](_0x1845a5) {
    return ((this.y = _0x1845a5), this);
  }
  ['setComponent'](_0x4023ad, _0x101ee8) {
    switch (_0x4023ad) {
      case 0:
        this.x = _0x101ee8;
        break;
      case 1:
        this.y = _0x101ee8;
        break;
      default:
        throw new Error('index is out of range: ' + _0x4023ad);
    }
    return this;
  }
  ['getComponent'](_0x44f7a5) {
    switch (_0x44f7a5) {
      case 0:
        return this.x;
      case 1:
        return this.y;
      default:
        throw new Error('index is out of range: ' + _0x44f7a5);
    }
  }
  ['clone']() {
    return new this.constructor(this.x, this.y);
  }
  ['copy'](_0x3390c2) {
    return ((this.x = _0x3390c2.x), (this.y = _0x3390c2.y), this);
  }
  ['add'](_0x3fd281) {
    return ((this.x += _0x3fd281.x), (this.y += _0x3fd281.y), this);
  }
  ['addScalar'](_0x1a9c14) {
    return ((this.x += _0x1a9c14), (this.y += _0x1a9c14), this);
  }
  ['addVectors'](_0x3394f9, _0xe768bb) {
    return ((this.x = _0x3394f9.x + _0xe768bb.x), (this.y = _0x3394f9.y + _0xe768bb.y), this);
  }
  ['addScaledVector'](_0x414eda, _0x5d61b3) {
    return ((this.x += _0x414eda.x * _0x5d61b3), (this.y += _0x414eda.y * _0x5d61b3), this);
  }
  ['sub'](_0xc53f83) {
    return ((this.x -= _0xc53f83.x), (this.y -= _0xc53f83.y), this);
  }
  ['subScalar'](_0x5599e0) {
    return ((this.x -= _0x5599e0), (this.y -= _0x5599e0), this);
  }
  ['subVectors'](_0xb28ffd, _0x5e515f) {
    return ((this.x = _0xb28ffd.x - _0x5e515f.x), (this.y = _0xb28ffd.y - _0x5e515f.y), this);
  }
  ['multiply'](_0x27a953) {
    return ((this.x *= _0x27a953.x), (this.y *= _0x27a953.y), this);
  }
  ['multiplyScalar'](_0x35ef45) {
    return ((this.x *= _0x35ef45), (this.y *= _0x35ef45), this);
  }
  ['divide'](_0x87ae29) {
    return ((this.x /= _0x87ae29.x), (this.y /= _0x87ae29.y), this);
  }
  ['divideScalar'](_0x5301fe) {
    return this.multiplyScalar(1 / _0x5301fe);
  }
  ['applyMatrix3'](_0x2cfa37) {
    const _0x222777 = this.x,
      _0x1e90b4 = this.y,
      _0x17ec51 = _0x2cfa37.elements;
    return (
      (this.x = _0x17ec51[0] * _0x222777 + _0x17ec51[3] * _0x1e90b4 + _0x17ec51[6]),
      (this.y = _0x17ec51[1] * _0x222777 + _0x17ec51[4] * _0x1e90b4 + _0x17ec51[7]),
      this
    );
  }
  ['min'](_0x334daa) {
    return ((this.x = Math.min(this.x, _0x334daa.x)), (this.y = Math.min(this.y, _0x334daa.y)), this);
  }
  ['max'](_0x2c39ae) {
    return ((this.x = Math.max(this.x, _0x2c39ae.x)), (this.y = Math.max(this.y, _0x2c39ae.y)), this);
  }
  ['clamp'](_0x14e8ea, _0x334b80) {
    return (
      (this.x = clamp(this.x, _0x14e8ea.x, _0x334b80.x)),
      (this.y = clamp(this.y, _0x14e8ea.y, _0x334b80.y)),
      this
    );
  }
  ['clampScalar'](_0x195479, _0x9ab3b8) {
    return (
      (this.x = clamp(this.x, _0x195479, _0x9ab3b8)),
      (this.y = clamp(this.y, _0x195479, _0x9ab3b8)),
      this
    );
  }
  ['clampLength'](_0x1fb3af, _0x467f46) {
    const _0x49693e = this.length();
    return this.divideScalar(_0x49693e || 1).multiplyScalar(clamp(_0x49693e, _0x1fb3af, _0x467f46));
  }
  ['floor']() {
    return ((this.x = Math.floor(this.x)), (this.y = Math.floor(this.y)), this);
  }
  ['ceil']() {
    return ((this.x = Math.ceil(this.x)), (this.y = Math.ceil(this.y)), this);
  }
  ['round']() {
    return ((this.x = Math.round(this.x)), (this.y = Math.round(this.y)), this);
  }
  ['roundToZero']() {
    return ((this.x = Math.trunc(this.x)), (this.y = Math.trunc(this.y)), this);
  }
  ['negate']() {
    return ((this.x = -this.x), (this.y = -this.y), this);
  }
  ['dot'](_0x3ed45a) {
    return this.x * _0x3ed45a.x + this.y * _0x3ed45a.y;
  }
  ['cross'](_0x1327ce) {
    return this.x * _0x1327ce.y - this.y * _0x1327ce.x;
  }
  ['lengthSq']() {
    return this.x * this.x + this.y * this.y;
  }
  ['length']() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  ['manhattanLength']() {
    return Math.abs(this.x) + Math.abs(this.y);
  }
  ['normalize']() {
    return this.divideScalar(this.length() || 1);
  }
  ['angle']() {
    const _0x38357a = Math.atan2(-this.y, -this.x) + Math.PI;
    return _0x38357a;
  }
  ['angleTo'](_0x2cb0ff) {
    const _0x3316fb = Math.sqrt(this.lengthSq() * _0x2cb0ff.lengthSq());
    if (_0x3316fb === 0) return Math.PI / 2;
    const _0x36f75f = this.dot(_0x2cb0ff) / _0x3316fb;
    return Math.acos(clamp(_0x36f75f, -1, 1));
  }
  ['distanceTo'](_0x4b676a) {
    return Math.sqrt(this.distanceToSquared(_0x4b676a));
  }
  ['distanceToSquared'](_0x432ee2) {
    const _0x2e337d = this.x - _0x432ee2.x,
      _0x46ea83 = this.y - _0x432ee2.y;
    return _0x2e337d * _0x2e337d + _0x46ea83 * _0x46ea83;
  }
  ['manhattanDistanceTo'](_0x38d7b8) {
    return Math.abs(this.x - _0x38d7b8.x) + Math.abs(this.y - _0x38d7b8.y);
  }
  ['setLength'](_0x295da0) {
    return this.normalize().multiplyScalar(_0x295da0);
  }
  ['lerp'](_0x8f17d0, _0x1a9780) {
    return (
      (this.x += (_0x8f17d0.x - this.x) * _0x1a9780),
      (this.y += (_0x8f17d0.y - this.y) * _0x1a9780),
      this
    );
  }
  ['lerpVectors'](_0x248750, _0x16ac64, _0x159816) {
    return (
      (this.x = _0x248750.x + (_0x16ac64.x - _0x248750.x) * _0x159816),
      (this.y = _0x248750.y + (_0x16ac64.y - _0x248750.y) * _0x159816),
      this
    );
  }
  ['equals'](_0x2fab9e) {
    return _0x2fab9e.x === this.x && _0x2fab9e.y === this.y;
  }
  ['fromArray'](_0x42a2c6, _0x3c161d = 0) {
    return ((this.x = _0x42a2c6[_0x3c161d]), (this.y = _0x42a2c6[_0x3c161d + 1]), this);
  }
  ['toArray'](_0x49dd2b = [], _0x2a16a7 = 0) {
    return ((_0x49dd2b[_0x2a16a7] = this.x), (_0x49dd2b[_0x2a16a7 + 1] = this.y), _0x49dd2b);
  }
  ['fromBufferAttribute'](_0x1c464e, _0x41dc7b) {
    return ((this.x = _0x1c464e.getX(_0x41dc7b)), (this.y = _0x1c464e.getY(_0x41dc7b)), this);
  }
  ['rotateAround'](_0x366174, _0x280b68) {
    const _0x3a024d = Math.cos(_0x280b68),
      _0xb59f2e = Math.sin(_0x280b68),
      _0x427563 = this.x - _0x366174.x,
      _0x3fbe3d = this.y - _0x366174.y;
    return (
      (this.x = _0x427563 * _0x3a024d - _0x3fbe3d * _0xb59f2e + _0x366174.x),
      (this.y = _0x427563 * _0xb59f2e + _0x3fbe3d * _0x3a024d + _0x366174.y),
      this
    );
  }
  ['random']() {
    return ((this.x = Math.random()), (this.y = Math.random()), this);
  }
  *[Symbol.iterator]() {
    (yield this.x, yield this.y);
  }
}
class Quaternion {
  constructor(_0x563e42 = 0, _0x3bb640 = 0, _0x4fafda = 0, _0x30bc4d = 1) {
    ((this.isQuaternion = true),
      (this._x = _0x563e42),
      (this._y = _0x3bb640),
      (this._z = _0x4fafda),
      (this._w = _0x30bc4d));
  }
  static ['slerpFlat'](_0x1b1edd, _0x470a7d, _0xa1b5f1, _0x200306, _0x5e1980, _0x59bfab, _0x147fd5) {
    let _0x4bbaa7 = _0xa1b5f1[_0x200306 + 0],
      _0x55f7e1 = _0xa1b5f1[_0x200306 + 1],
      _0x2270d3 = _0xa1b5f1[_0x200306 + 2],
      _0x4ce59c = _0xa1b5f1[_0x200306 + 3];
    const _0x58ce2c = _0x5e1980[_0x59bfab + 0],
      _0x1fc15f = _0x5e1980[_0x59bfab + 1],
      _0x3b1919 = _0x5e1980[_0x59bfab + 2],
      _0x317c28 = _0x5e1980[_0x59bfab + 3];
    if (_0x147fd5 === 0) {
      ((_0x1b1edd[_0x470a7d + 0] = _0x4bbaa7),
        (_0x1b1edd[_0x470a7d + 1] = _0x55f7e1),
        (_0x1b1edd[_0x470a7d + 2] = _0x2270d3),
        (_0x1b1edd[_0x470a7d + 3] = _0x4ce59c));
      return;
    }
    if (_0x147fd5 === 1) {
      ((_0x1b1edd[_0x470a7d + 0] = _0x58ce2c),
        (_0x1b1edd[_0x470a7d + 1] = _0x1fc15f),
        (_0x1b1edd[_0x470a7d + 2] = _0x3b1919),
        (_0x1b1edd[_0x470a7d + 3] = _0x317c28));
      return;
    }
    if (
      _0x4ce59c !== _0x317c28 ||
      _0x4bbaa7 !== _0x58ce2c ||
      _0x55f7e1 !== _0x1fc15f ||
      _0x2270d3 !== _0x3b1919
    ) {
      let _0x3b527a = 1 - _0x147fd5;
      const _0x1f7a13 =
          _0x4bbaa7 * _0x58ce2c + _0x55f7e1 * _0x1fc15f + _0x2270d3 * _0x3b1919 + _0x4ce59c * _0x317c28,
        _0x14ad4d = _0x1f7a13 >= 0 ? 1 : -1,
        _0x777c9 = 1 - _0x1f7a13 * _0x1f7a13;
      if (_0x777c9 > Number.EPSILON) {
        const _0x4d6aa3 = Math.sqrt(_0x777c9),
          _0x5690e1 = Math.atan2(_0x4d6aa3, _0x1f7a13 * _0x14ad4d);
        ((_0x3b527a = Math.sin(_0x3b527a * _0x5690e1) / _0x4d6aa3),
          (_0x147fd5 = Math.sin(_0x147fd5 * _0x5690e1) / _0x4d6aa3));
      }
      const _0x597200 = _0x147fd5 * _0x14ad4d;
      ((_0x4bbaa7 = _0x4bbaa7 * _0x3b527a + _0x58ce2c * _0x597200),
        (_0x55f7e1 = _0x55f7e1 * _0x3b527a + _0x1fc15f * _0x597200),
        (_0x2270d3 = _0x2270d3 * _0x3b527a + _0x3b1919 * _0x597200),
        (_0x4ce59c = _0x4ce59c * _0x3b527a + _0x317c28 * _0x597200));
      if (_0x3b527a === 1 - _0x147fd5) {
        const _0x4448f4 =
          1 /
          Math.sqrt(
            _0x4bbaa7 * _0x4bbaa7 + _0x55f7e1 * _0x55f7e1 + _0x2270d3 * _0x2270d3 + _0x4ce59c * _0x4ce59c,
          );
        ((_0x4bbaa7 *= _0x4448f4),
          (_0x55f7e1 *= _0x4448f4),
          (_0x2270d3 *= _0x4448f4),
          (_0x4ce59c *= _0x4448f4));
      }
    }
    ((_0x1b1edd[_0x470a7d] = _0x4bbaa7),
      (_0x1b1edd[_0x470a7d + 1] = _0x55f7e1),
      (_0x1b1edd[_0x470a7d + 2] = _0x2270d3),
      (_0x1b1edd[_0x470a7d + 3] = _0x4ce59c));
  }
  static ['multiplyQuaternionsFlat'](_0x2408aa, _0x4e9fe2, _0x256be8, _0x2d35fb, _0x35410a, _0x2e42f3) {
    const _0x3ac6ec = _0x256be8[_0x2d35fb],
      _0x4f431f = _0x256be8[_0x2d35fb + 1],
      _0x5eb70d = _0x256be8[_0x2d35fb + 2],
      _0x430def = _0x256be8[_0x2d35fb + 3],
      _0x519bfd = _0x35410a[_0x2e42f3],
      _0x28945f = _0x35410a[_0x2e42f3 + 1],
      _0x327991 = _0x35410a[_0x2e42f3 + 2],
      _0xa35aa0 = _0x35410a[_0x2e42f3 + 3];
    return (
      (_0x2408aa[_0x4e9fe2] =
        _0x3ac6ec * _0xa35aa0 + _0x430def * _0x519bfd + _0x4f431f * _0x327991 - _0x5eb70d * _0x28945f),
      (_0x2408aa[_0x4e9fe2 + 1] =
        _0x4f431f * _0xa35aa0 + _0x430def * _0x28945f + _0x5eb70d * _0x519bfd - _0x3ac6ec * _0x327991),
      (_0x2408aa[_0x4e9fe2 + 2] =
        _0x5eb70d * _0xa35aa0 + _0x430def * _0x327991 + _0x3ac6ec * _0x28945f - _0x4f431f * _0x519bfd),
      (_0x2408aa[_0x4e9fe2 + 3] =
        _0x430def * _0xa35aa0 - _0x3ac6ec * _0x519bfd - _0x4f431f * _0x28945f - _0x5eb70d * _0x327991),
      _0x2408aa
    );
  }
  get ['x']() {
    return this._x;
  }
  set ['x'](_0x45e001) {
    ((this._x = _0x45e001), this._onChangeCallback());
  }
  get ['y']() {
    return this._y;
  }
  set ['y'](_0x4ae93e) {
    ((this._y = _0x4ae93e), this._onChangeCallback());
  }
  get ['z']() {
    return this._z;
  }
  set ['z'](_0x5c446c) {
    ((this._z = _0x5c446c), this._onChangeCallback());
  }
  get ['w']() {
    return this._w;
  }
  set ['w'](_0x4090c6) {
    ((this._w = _0x4090c6), this._onChangeCallback());
  }
  ['set'](_0x235816, _0xb8e8f, _0x359bb1, _0x2561f6) {
    return (
      (this._x = _0x235816),
      (this._y = _0xb8e8f),
      (this._z = _0x359bb1),
      (this._w = _0x2561f6),
      this._onChangeCallback(),
      this
    );
  }
  ['clone']() {
    return new this['constructor'](this._x, this._y, this._z, this._w);
  }
  ['copy'](_0x1b89a3) {
    return (
      (this._x = _0x1b89a3.x),
      (this._y = _0x1b89a3.y),
      (this._z = _0x1b89a3.z),
      (this._w = _0x1b89a3.w),
      this._onChangeCallback(),
      this
    );
  }
  ['setFromEuler'](_0x4cb345, _0x101773 = true) {
    const _0x31f15d = _0x4cb345._x,
      _0x402d02 = _0x4cb345._y,
      _0x34a67e = _0x4cb345._z,
      _0x3f23a8 = _0x4cb345._order,
      _0x4d7a76 = Math.cos,
      _0x417a1e = Math.sin,
      _0x3de49b = _0x4d7a76(_0x31f15d / 2),
      _0x49c016 = _0x4d7a76(_0x402d02 / 2),
      _0x52de18 = _0x4d7a76(_0x34a67e / 2),
      _0x1fe37e = _0x417a1e(_0x31f15d / 2),
      _0x43a66a = _0x417a1e(_0x402d02 / 2),
      _0x2ae5e2 = _0x417a1e(_0x34a67e / 2);
    switch (_0x3f23a8) {
      case 'XYZ':
        ((this._x = _0x1fe37e * _0x49c016 * _0x52de18 + _0x3de49b * _0x43a66a * _0x2ae5e2),
          (this._y = _0x3de49b * _0x43a66a * _0x52de18 - _0x1fe37e * _0x49c016 * _0x2ae5e2),
          (this._z = _0x3de49b * _0x49c016 * _0x2ae5e2 + _0x1fe37e * _0x43a66a * _0x52de18),
          (this._w = _0x3de49b * _0x49c016 * _0x52de18 - _0x1fe37e * _0x43a66a * _0x2ae5e2));
        break;
      case 'YXZ':
        ((this._x = _0x1fe37e * _0x49c016 * _0x52de18 + _0x3de49b * _0x43a66a * _0x2ae5e2),
          (this._y = _0x3de49b * _0x43a66a * _0x52de18 - _0x1fe37e * _0x49c016 * _0x2ae5e2),
          (this._z = _0x3de49b * _0x49c016 * _0x2ae5e2 - _0x1fe37e * _0x43a66a * _0x52de18),
          (this._w = _0x3de49b * _0x49c016 * _0x52de18 + _0x1fe37e * _0x43a66a * _0x2ae5e2));
        break;
      case 'ZXY':
        ((this._x = _0x1fe37e * _0x49c016 * _0x52de18 - _0x3de49b * _0x43a66a * _0x2ae5e2),
          (this._y = _0x3de49b * _0x43a66a * _0x52de18 + _0x1fe37e * _0x49c016 * _0x2ae5e2),
          (this._z = _0x3de49b * _0x49c016 * _0x2ae5e2 + _0x1fe37e * _0x43a66a * _0x52de18),
          (this._w = _0x3de49b * _0x49c016 * _0x52de18 - _0x1fe37e * _0x43a66a * _0x2ae5e2));
        break;
      case 'ZYX':
        ((this._x = _0x1fe37e * _0x49c016 * _0x52de18 - _0x3de49b * _0x43a66a * _0x2ae5e2),
          (this._y = _0x3de49b * _0x43a66a * _0x52de18 + _0x1fe37e * _0x49c016 * _0x2ae5e2),
          (this._z = _0x3de49b * _0x49c016 * _0x2ae5e2 - _0x1fe37e * _0x43a66a * _0x52de18),
          (this._w = _0x3de49b * _0x49c016 * _0x52de18 + _0x1fe37e * _0x43a66a * _0x2ae5e2));
        break;
      case 'YZX':
        ((this._x = _0x1fe37e * _0x49c016 * _0x52de18 + _0x3de49b * _0x43a66a * _0x2ae5e2),
          (this._y = _0x3de49b * _0x43a66a * _0x52de18 + _0x1fe37e * _0x49c016 * _0x2ae5e2),
          (this._z = _0x3de49b * _0x49c016 * _0x2ae5e2 - _0x1fe37e * _0x43a66a * _0x52de18),
          (this._w = _0x3de49b * _0x49c016 * _0x52de18 - _0x1fe37e * _0x43a66a * _0x2ae5e2));
        break;
      case 'XZY':
        ((this._x = _0x1fe37e * _0x49c016 * _0x52de18 - _0x3de49b * _0x43a66a * _0x2ae5e2),
          (this._y = _0x3de49b * _0x43a66a * _0x52de18 - _0x1fe37e * _0x49c016 * _0x2ae5e2),
          (this._z = _0x3de49b * _0x49c016 * _0x2ae5e2 + _0x1fe37e * _0x43a66a * _0x52de18),
          (this._w = _0x3de49b * _0x49c016 * _0x52de18 + _0x1fe37e * _0x43a66a * _0x2ae5e2));
        break;
      default:
        console.warn('THREE.Quaternion: .setFromEuler() encountered an unknown order: ' + _0x3f23a8);
    }
    if (_0x101773 === true) this._onChangeCallback();
    return this;
  }
  ['setFromAxisAngle'](_0x5c8662, _0x3f5ca6) {
    const _0x159860 = _0x3f5ca6 / 2,
      _0x2e45d2 = Math.sin(_0x159860);
    return (
      (this._x = _0x5c8662.x * _0x2e45d2),
      (this._y = _0x5c8662.y * _0x2e45d2),
      (this._z = _0x5c8662.z * _0x2e45d2),
      (this._w = Math.cos(_0x159860)),
      this._onChangeCallback(),
      this
    );
  }
  ['setFromRotationMatrix'](_0x25b571) {
    const _0x3b2958 = _0x25b571.elements,
      _0x1a8db0 = _0x3b2958[0],
      _0x467dcd = _0x3b2958[4],
      _0x40c2ce = _0x3b2958[8],
      _0xfa3049 = _0x3b2958[1],
      _0x145443 = _0x3b2958[5],
      _0x532f9a = _0x3b2958[9],
      _0x15b397 = _0x3b2958[2],
      _0x557eb6 = _0x3b2958[6],
      _0x200575 = _0x3b2958[10],
      _0x19fc15 = _0x1a8db0 + _0x145443 + _0x200575;
    if (_0x19fc15 > 0) {
      const _0x8fabd5 = 0.5 / Math.sqrt(_0x19fc15 + 1);
      ((this._w = 0.25 / _0x8fabd5),
        (this._x = (_0x557eb6 - _0x532f9a) * _0x8fabd5),
        (this._y = (_0x40c2ce - _0x15b397) * _0x8fabd5),
        (this._z = (_0xfa3049 - _0x467dcd) * _0x8fabd5));
    } else {
      if (_0x1a8db0 > _0x145443 && _0x1a8db0 > _0x200575) {
        const _0x13afde = 2 * Math.sqrt(1 + _0x1a8db0 - _0x145443 - _0x200575);
        ((this._w = (_0x557eb6 - _0x532f9a) / _0x13afde),
          (this._x = 0.25 * _0x13afde),
          (this._y = (_0x467dcd + _0xfa3049) / _0x13afde),
          (this._z = (_0x40c2ce + _0x15b397) / _0x13afde));
      } else {
        if (_0x145443 > _0x200575) {
          const _0x3c5436 = 2 * Math.sqrt(1 + _0x145443 - _0x1a8db0 - _0x200575);
          ((this._w = (_0x40c2ce - _0x15b397) / _0x3c5436),
            (this._x = (_0x467dcd + _0xfa3049) / _0x3c5436),
            (this._y = 0.25 * _0x3c5436),
            (this._z = (_0x532f9a + _0x557eb6) / _0x3c5436));
        } else {
          const _0x39af8f = 2 * Math.sqrt(1 + _0x200575 - _0x1a8db0 - _0x145443);
          ((this._w = (_0xfa3049 - _0x467dcd) / _0x39af8f),
            (this._x = (_0x40c2ce + _0x15b397) / _0x39af8f),
            (this._y = (_0x532f9a + _0x557eb6) / _0x39af8f),
            (this._z = 0.25 * _0x39af8f));
        }
      }
    }
    return (this._onChangeCallback(), this);
  }
  ['setFromUnitVectors'](_0x37f846, _0x64219b) {
    let _0x1d6f54 = _0x37f846.dot(_0x64219b) + 1;
    return (
      _0x1d6f54 < 1e-8
        ? ((_0x1d6f54 = 0),
          Math.abs(_0x37f846.x) > Math.abs(_0x37f846.z)
            ? ((this._x = -_0x37f846.y), (this._y = _0x37f846.x), (this._z = 0), (this._w = _0x1d6f54))
            : ((this._x = 0), (this._y = -_0x37f846.z), (this._z = _0x37f846.y), (this._w = _0x1d6f54)))
        : ((this._x = _0x37f846.y * _0x64219b.z - _0x37f846.z * _0x64219b.y),
          (this._y = _0x37f846.z * _0x64219b.x - _0x37f846.x * _0x64219b.z),
          (this._z = _0x37f846.x * _0x64219b.y - _0x37f846.y * _0x64219b.x),
          (this._w = _0x1d6f54)),
      this.normalize()
    );
  }
  ['angleTo'](_0x584f55) {
    return 2 * Math.acos(Math.abs(clamp(this.dot(_0x584f55), -1, 1)));
  }
  ['rotateTowards'](_0x5c5f69, _0x55c78a) {
    const _0x4e8765 = this.angleTo(_0x5c5f69);
    if (_0x4e8765 === 0) return this;
    const _0x1b16e6 = Math.min(1, _0x55c78a / _0x4e8765);
    return (this.slerp(_0x5c5f69, _0x1b16e6), this);
  }
  ['identity']() {
    return this.set(0, 0, 0, 1);
  }
  ['invert']() {
    return this.conjugate();
  }
  ['conjugate']() {
    return ((this._x *= -1), (this._y *= -1), (this._z *= -1), this._onChangeCallback(), this);
  }
  ['dot'](_0x45ad05) {
    return this._x * _0x45ad05._x + this._y * _0x45ad05._y + this._z * _0x45ad05._z + this._w * _0x45ad05._w;
  }
  ['lengthSq']() {
    return this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w;
  }
  ['length']() {
    return Math.sqrt(this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w);
  }
  ['normalize']() {
    let _0x56142f = this.length();
    return (
      _0x56142f === 0
        ? ((this._x = 0), (this._y = 0), (this._z = 0), (this._w = 1))
        : ((_0x56142f = 1 / _0x56142f),
          (this._x = this._x * _0x56142f),
          (this._y = this._y * _0x56142f),
          (this._z = this._z * _0x56142f),
          (this._w = this._w * _0x56142f)),
      this._onChangeCallback(),
      this
    );
  }
  ['multiply'](_0x368f19) {
    return this.multiplyQuaternions(this, _0x368f19);
  }
  ['premultiply'](_0x36c3a3) {
    return this.multiplyQuaternions(_0x36c3a3, this);
  }
  ['multiplyQuaternions'](_0x56f31e, _0x5425a8) {
    const _0x5895d6 = _0x56f31e._x,
      _0x488c3d = _0x56f31e._y,
      _0x280a43 = _0x56f31e._z,
      _0x437e5b = _0x56f31e._w,
      _0x2b3529 = _0x5425a8._x,
      _0x42604f = _0x5425a8._y,
      _0x129544 = _0x5425a8._z,
      _0x5bad68 = _0x5425a8._w;
    return (
      (this._x =
        _0x5895d6 * _0x5bad68 + _0x437e5b * _0x2b3529 + _0x488c3d * _0x129544 - _0x280a43 * _0x42604f),
      (this._y =
        _0x488c3d * _0x5bad68 + _0x437e5b * _0x42604f + _0x280a43 * _0x2b3529 - _0x5895d6 * _0x129544),
      (this._z =
        _0x280a43 * _0x5bad68 + _0x437e5b * _0x129544 + _0x5895d6 * _0x42604f - _0x488c3d * _0x2b3529),
      (this._w =
        _0x437e5b * _0x5bad68 - _0x5895d6 * _0x2b3529 - _0x488c3d * _0x42604f - _0x280a43 * _0x129544),
      this._onChangeCallback(),
      this
    );
  }
  ['slerp'](_0xf37b98, _0x3601d2) {
    if (_0x3601d2 === 0) return this;
    if (_0x3601d2 === 1) return this.copy(_0xf37b98);
    const _0x8b9584 = this._x,
      _0x3f07eb = this._y,
      _0x3c9964 = this._z,
      _0x4a62b7 = this._w;
    let _0xd018f7 =
      _0x4a62b7 * _0xf37b98._w +
      _0x8b9584 * _0xf37b98._x +
      _0x3f07eb * _0xf37b98._y +
      _0x3c9964 * _0xf37b98._z;
    _0xd018f7 < 0
      ? ((this._w = -_0xf37b98._w),
        (this._x = -_0xf37b98._x),
        (this._y = -_0xf37b98._y),
        (this._z = -_0xf37b98._z),
        (_0xd018f7 = -_0xd018f7))
      : this.copy(_0xf37b98);
    if (_0xd018f7 >= 1)
      return (
        (this._w = _0x4a62b7),
        (this._x = _0x8b9584),
        (this._y = _0x3f07eb),
        (this._z = _0x3c9964),
        this
      );
    const _0x2d325a = 1 - _0xd018f7 * _0xd018f7;
    if (_0x2d325a <= Number.EPSILON) {
      const _0x75af2c = 1 - _0x3601d2;
      return (
        (this._w = _0x75af2c * _0x4a62b7 + _0x3601d2 * this._w),
        (this._x = _0x75af2c * _0x8b9584 + _0x3601d2 * this._x),
        (this._y = _0x75af2c * _0x3f07eb + _0x3601d2 * this._y),
        (this._z = _0x75af2c * _0x3c9964 + _0x3601d2 * this._z),
        this.normalize(),
        this
      );
    }
    const _0x493b71 = Math.sqrt(_0x2d325a),
      _0x2f6074 = Math.atan2(_0x493b71, _0xd018f7),
      _0x16a929 = Math.sin((1 - _0x3601d2) * _0x2f6074) / _0x493b71,
      _0x3075c3 = Math.sin(_0x3601d2 * _0x2f6074) / _0x493b71;
    return (
      (this._w = _0x4a62b7 * _0x16a929 + this._w * _0x3075c3),
      (this._x = _0x8b9584 * _0x16a929 + this._x * _0x3075c3),
      (this._y = _0x3f07eb * _0x16a929 + this._y * _0x3075c3),
      (this._z = _0x3c9964 * _0x16a929 + this._z * _0x3075c3),
      this._onChangeCallback(),
      this
    );
  }
  ['slerpQuaternions'](_0x4f9e8b, _0x318b66, _0xab177b) {
    return this.copy(_0x4f9e8b).slerp(_0x318b66, _0xab177b);
  }
  ['random']() {
    const _0x18ad19 = 2 * Math.PI * Math.random(),
      _0x4309e5 = 2 * Math.PI * Math.random(),
      _0x277dd0 = Math.random(),
      _0x3f7339 = Math.sqrt(1 - _0x277dd0),
      _0x401dde = Math.sqrt(_0x277dd0);
    return this.set(
      _0x3f7339 * Math.sin(_0x18ad19),
      _0x3f7339 * Math.cos(_0x18ad19),
      _0x401dde * Math.sin(_0x4309e5),
      _0x401dde * Math.cos(_0x4309e5),
    );
  }
  ['equals'](_0x145dc8) {
    return (
      _0x145dc8._x === this._x &&
      _0x145dc8._y === this._y &&
      _0x145dc8._z === this._z &&
      _0x145dc8._w === this._w
    );
  }
  ['fromArray'](_0x39c3c8, _0x1ea397 = 0) {
    return (
      (this._x = _0x39c3c8[_0x1ea397]),
      (this._y = _0x39c3c8[_0x1ea397 + 1]),
      (this._z = _0x39c3c8[_0x1ea397 + 2]),
      (this._w = _0x39c3c8[_0x1ea397 + 3]),
      this._onChangeCallback(),
      this
    );
  }
  ['toArray'](_0x22d5a1 = [], _0x39e7c5 = 0) {
    return (
      (_0x22d5a1[_0x39e7c5] = this._x),
      (_0x22d5a1[_0x39e7c5 + 1] = this._y),
      (_0x22d5a1[_0x39e7c5 + 2] = this._z),
      (_0x22d5a1[_0x39e7c5 + 3] = this._w),
      _0x22d5a1
    );
  }
  ['fromBufferAttribute'](_0x36c796, _0x38516f) {
    return (
      (this._x = _0x36c796.getX(_0x38516f)),
      (this._y = _0x36c796.getY(_0x38516f)),
      (this._z = _0x36c796.getZ(_0x38516f)),
      (this._w = _0x36c796.getW(_0x38516f)),
      this._onChangeCallback(),
      this
    );
  }
  ['toJSON']() {
    return this.toArray();
  }
  ['_onChange'](_0xa52d3a) {
    return ((this._onChangeCallback = _0xa52d3a), this);
  }
  ['_onChangeCallback']() {}
  *[Symbol.iterator]() {
    (yield this._x, yield this._y, yield this._z, yield this._w);
  }
}
class Vector3 {
  constructor(_0xf5a05b = 0, _0xf7de2a = 0, _0x3cbd8c = 0) {
    ((Vector3.prototype.isVector3 = true), (this.x = _0xf5a05b), (this.y = _0xf7de2a), (this.z = _0x3cbd8c));
  }
  ['set'](_0x426839, _0xac394c, _0x372b4a) {
    if (_0x372b4a === undefined) _0x372b4a = this.z;
    return ((this.x = _0x426839), (this.y = _0xac394c), (this.z = _0x372b4a), this);
  }
  ['setScalar'](_0x37c2ca) {
    return ((this.x = _0x37c2ca), (this.y = _0x37c2ca), (this.z = _0x37c2ca), this);
  }
  ['setX'](_0x4dbb70) {
    return ((this.x = _0x4dbb70), this);
  }
  ['setY'](_0x20e254) {
    return ((this.y = _0x20e254), this);
  }
  ['setZ'](_0x393e58) {
    return ((this.z = _0x393e58), this);
  }
  ['setComponent'](_0x5e4de1, _0x12626d) {
    switch (_0x5e4de1) {
      case 0:
        this.x = _0x12626d;
        break;
      case 1:
        this.y = _0x12626d;
        break;
      case 2:
        this.z = _0x12626d;
        break;
      default:
        throw new Error('index is out of range: ' + _0x5e4de1);
    }
    return this;
  }
  ['getComponent'](_0x3540d0) {
    switch (_0x3540d0) {
      case 0:
        return this.x;
      case 1:
        return this.y;
      case 2:
        return this.z;
      default:
        throw new Error('index is out of range: ' + _0x3540d0);
    }
  }
  ['clone']() {
    return new this['constructor'](this.x, this.y, this.z);
  }
  ['copy'](_0x3fd670) {
    return ((this.x = _0x3fd670.x), (this.y = _0x3fd670.y), (this.z = _0x3fd670.z), this);
  }
  ['add'](_0x464973) {
    return ((this.x += _0x464973.x), (this.y += _0x464973.y), (this.z += _0x464973.z), this);
  }
  ['addScalar'](_0x249c87) {
    return ((this.x += _0x249c87), (this.y += _0x249c87), (this.z += _0x249c87), this);
  }
  ['addVectors'](_0xba0c6, _0xf40093) {
    return (
      (this.x = _0xba0c6.x + _0xf40093.x),
      (this.y = _0xba0c6.y + _0xf40093.y),
      (this.z = _0xba0c6.z + _0xf40093.z),
      this
    );
  }
  ['addScaledVector'](_0x49ed48, _0x46e4f1) {
    return (
      (this.x += _0x49ed48.x * _0x46e4f1),
      (this.y += _0x49ed48.y * _0x46e4f1),
      (this.z += _0x49ed48.z * _0x46e4f1),
      this
    );
  }
  ['sub'](_0x4770f1) {
    return ((this.x -= _0x4770f1.x), (this.y -= _0x4770f1.y), (this.z -= _0x4770f1.z), this);
  }
  ['subScalar'](_0x2affc3) {
    return ((this.x -= _0x2affc3), (this.y -= _0x2affc3), (this.z -= _0x2affc3), this);
  }
  ['subVectors'](_0x454580, _0x2b93ca) {
    return (
      (this.x = _0x454580.x - _0x2b93ca.x),
      (this.y = _0x454580.y - _0x2b93ca.y),
      (this.z = _0x454580.z - _0x2b93ca.z),
      this
    );
  }
  ['multiply'](_0x5b1cdf) {
    return ((this.x *= _0x5b1cdf.x), (this.y *= _0x5b1cdf.y), (this.z *= _0x5b1cdf.z), this);
  }
  ['multiplyScalar'](_0x4bc7a0) {
    return ((this.x *= _0x4bc7a0), (this.y *= _0x4bc7a0), (this.z *= _0x4bc7a0), this);
  }
  ['multiplyVectors'](_0xcddba6, _0x3e3e74) {
    return (
      (this.x = _0xcddba6.x * _0x3e3e74.x),
      (this.y = _0xcddba6.y * _0x3e3e74.y),
      (this.z = _0xcddba6.z * _0x3e3e74.z),
      this
    );
  }
  ['applyEuler'](_0x426e60) {
    return this.applyQuaternion(_quaternion$4.setFromEuler(_0x426e60));
  }
  ['applyAxisAngle'](_0x33a6c5, _0x3dff53) {
    return this.applyQuaternion(_quaternion$4.setFromAxisAngle(_0x33a6c5, _0x3dff53));
  }
  ['applyMatrix3'](_0x4952a3) {
    const _0xf47c29 = this.x,
      _0x18b156 = this.y,
      _0x1c3ee6 = this.z,
      _0x2a094b = _0x4952a3.elements;
    return (
      (this.x = _0x2a094b[0] * _0xf47c29 + _0x2a094b[3] * _0x18b156 + _0x2a094b[6] * _0x1c3ee6),
      (this.y = _0x2a094b[1] * _0xf47c29 + _0x2a094b[4] * _0x18b156 + _0x2a094b[7] * _0x1c3ee6),
      (this.z = _0x2a094b[2] * _0xf47c29 + _0x2a094b[5] * _0x18b156 + _0x2a094b[8] * _0x1c3ee6),
      this
    );
  }
  ['applyNormalMatrix'](_0x3111cb) {
    return this.applyMatrix3(_0x3111cb).normalize();
  }
  ['applyMatrix4'](_0x336426) {
    const _0xcfd7b = this.x,
      _0xbdd226 = this.y,
      _0xacaa68 = this.z,
      _0x2e2781 = _0x336426.elements,
      _0x2500b7 =
        1 / (_0x2e2781[3] * _0xcfd7b + _0x2e2781[7] * _0xbdd226 + _0x2e2781[11] * _0xacaa68 + _0x2e2781[15]);
    return (
      (this.x =
        (_0x2e2781[0] * _0xcfd7b + _0x2e2781[4] * _0xbdd226 + _0x2e2781[8] * _0xacaa68 + _0x2e2781[12]) *
        _0x2500b7),
      (this.y =
        (_0x2e2781[1] * _0xcfd7b + _0x2e2781[5] * _0xbdd226 + _0x2e2781[9] * _0xacaa68 + _0x2e2781[13]) *
        _0x2500b7),
      (this.z =
        (_0x2e2781[2] * _0xcfd7b + _0x2e2781[6] * _0xbdd226 + _0x2e2781[10] * _0xacaa68 + _0x2e2781[14]) *
        _0x2500b7),
      this
    );
  }
  ['applyQuaternion'](_0x4bf1f8) {
    const _0x1e2b00 = this.x,
      _0x325c85 = this.y,
      _0x25bb48 = this.z,
      _0x5125c6 = _0x4bf1f8.x,
      _0x232663 = _0x4bf1f8.y,
      _0x158cfd = _0x4bf1f8.z,
      _0x45f8fa = _0x4bf1f8.w,
      _0x33fcc8 = 2 * (_0x232663 * _0x25bb48 - _0x158cfd * _0x325c85),
      _0x3545ec = 2 * (_0x158cfd * _0x1e2b00 - _0x5125c6 * _0x25bb48),
      _0x270720 = 2 * (_0x5125c6 * _0x325c85 - _0x232663 * _0x1e2b00);
    return (
      (this.x = _0x1e2b00 + _0x45f8fa * _0x33fcc8 + _0x232663 * _0x270720 - _0x158cfd * _0x3545ec),
      (this.y = _0x325c85 + _0x45f8fa * _0x3545ec + _0x158cfd * _0x33fcc8 - _0x5125c6 * _0x270720),
      (this.z = _0x25bb48 + _0x45f8fa * _0x270720 + _0x5125c6 * _0x3545ec - _0x232663 * _0x33fcc8),
      this
    );
  }
  ['project'](_0x5bddfa) {
    return this.applyMatrix4(_0x5bddfa.matrixWorldInverse).applyMatrix4(_0x5bddfa.projectionMatrix);
  }
  ['unproject'](_0x54b7d7) {
    return this.applyMatrix4(_0x54b7d7.projectionMatrixInverse).applyMatrix4(_0x54b7d7.matrixWorld);
  }
  ['transformDirection'](_0x13bc9a) {
    const _0x2d3f67 = this.x,
      _0x13cf7e = this.y,
      _0x3a04ae = this.z,
      _0x53fd91 = _0x13bc9a.elements;
    return (
      (this.x = _0x53fd91[0] * _0x2d3f67 + _0x53fd91[4] * _0x13cf7e + _0x53fd91[8] * _0x3a04ae),
      (this.y = _0x53fd91[1] * _0x2d3f67 + _0x53fd91[5] * _0x13cf7e + _0x53fd91[9] * _0x3a04ae),
      (this.z = _0x53fd91[2] * _0x2d3f67 + _0x53fd91[6] * _0x13cf7e + _0x53fd91[10] * _0x3a04ae),
      this.normalize()
    );
  }
  ['divide'](_0x419d97) {
    return ((this.x /= _0x419d97.x), (this.y /= _0x419d97.y), (this.z /= _0x419d97.z), this);
  }
  ['divideScalar'](_0x532f27) {
    return this.multiplyScalar(1 / _0x532f27);
  }
  ['min'](_0xf7f904) {
    return (
      (this.x = Math.min(this.x, _0xf7f904.x)),
      (this.y = Math.min(this.y, _0xf7f904.y)),
      (this.z = Math.min(this.z, _0xf7f904.z)),
      this
    );
  }
  ['max'](_0x20d9fb) {
    return (
      (this.x = Math.max(this.x, _0x20d9fb.x)),
      (this.y = Math.max(this.y, _0x20d9fb.y)),
      (this.z = Math.max(this.z, _0x20d9fb.z)),
      this
    );
  }
  ['clamp'](_0x1e57a8, _0x30add5) {
    return (
      (this.x = clamp(this.x, _0x1e57a8.x, _0x30add5.x)),
      (this.y = clamp(this.y, _0x1e57a8.y, _0x30add5.y)),
      (this.z = clamp(this.z, _0x1e57a8.z, _0x30add5.z)),
      this
    );
  }
  ['clampScalar'](_0x4c2248, _0x512fec) {
    return (
      (this.x = clamp(this.x, _0x4c2248, _0x512fec)),
      (this.y = clamp(this.y, _0x4c2248, _0x512fec)),
      (this.z = clamp(this.z, _0x4c2248, _0x512fec)),
      this
    );
  }
  ['clampLength'](_0x368250, _0x40c0c3) {
    const _0x592320 = this.length();
    return this.divideScalar(_0x592320 || 1).multiplyScalar(clamp(_0x592320, _0x368250, _0x40c0c3));
  }
  ['floor']() {
    return (
      (this.x = Math.floor(this.x)),
      (this.y = Math.floor(this.y)),
      (this.z = Math.floor(this.z)),
      this
    );
  }
  ['ceil']() {
    return ((this.x = Math.ceil(this.x)), (this.y = Math.ceil(this.y)), (this.z = Math.ceil(this.z)), this);
  }
  ['round']() {
    return (
      (this.x = Math.round(this.x)),
      (this.y = Math.round(this.y)),
      (this.z = Math.round(this.z)),
      this
    );
  }
  ['roundToZero']() {
    return (
      (this.x = Math.trunc(this.x)),
      (this.y = Math.trunc(this.y)),
      (this.z = Math.trunc(this.z)),
      this
    );
  }
  ['negate']() {
    return ((this.x = -this.x), (this.y = -this.y), (this.z = -this.z), this);
  }
  ['dot'](_0x374d08) {
    return this.x * _0x374d08.x + this.y * _0x374d08.y + this.z * _0x374d08.z;
  }
  ['lengthSq']() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }
  ['length']() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }
  ['manhattanLength']() {
    return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z);
  }
  ['normalize']() {
    return this.divideScalar(this.length() || 1);
  }
  ['setLength'](_0x2dd7ee) {
    return this.normalize().multiplyScalar(_0x2dd7ee);
  }
  ['lerp'](_0x686512, _0x3860e5) {
    return (
      (this.x += (_0x686512.x - this.x) * _0x3860e5),
      (this.y += (_0x686512.y - this.y) * _0x3860e5),
      (this.z += (_0x686512.z - this.z) * _0x3860e5),
      this
    );
  }
  ['lerpVectors'](_0x61b02f, _0x39f8ff, _0x5d6a7e) {
    return (
      (this.x = _0x61b02f.x + (_0x39f8ff.x - _0x61b02f.x) * _0x5d6a7e),
      (this.y = _0x61b02f.y + (_0x39f8ff.y - _0x61b02f.y) * _0x5d6a7e),
      (this.z = _0x61b02f.z + (_0x39f8ff.z - _0x61b02f.z) * _0x5d6a7e),
      this
    );
  }
  ['cross'](_0x1c7c71) {
    return this.crossVectors(this, _0x1c7c71);
  }
  ['crossVectors'](_0x4972ca, _0x4f5790) {
    const _0x126a9a = _0x4972ca.x,
      _0x3abcc0 = _0x4972ca.y,
      _0x5c6e54 = _0x4972ca.z,
      _0x5f12c6 = _0x4f5790.x,
      _0x404eae = _0x4f5790.y,
      _0x324610 = _0x4f5790.z;
    return (
      (this.x = _0x3abcc0 * _0x324610 - _0x5c6e54 * _0x404eae),
      (this.y = _0x5c6e54 * _0x5f12c6 - _0x126a9a * _0x324610),
      (this.z = _0x126a9a * _0x404eae - _0x3abcc0 * _0x5f12c6),
      this
    );
  }
  ['projectOnVector'](_0x917ec) {
    const _0x18ce85 = _0x917ec.lengthSq();
    if (_0x18ce85 === 0) return this.set(0, 0, 0);
    const _0x266975 = _0x917ec.dot(this) / _0x18ce85;
    return this.copy(_0x917ec).multiplyScalar(_0x266975);
  }
  ['projectOnPlane'](_0x288c01) {
    return (_vector$c.copy(this).projectOnVector(_0x288c01), this.sub(_vector$c));
  }
  ['reflect'](_0x556b48) {
    return this.sub(_vector$c.copy(_0x556b48).multiplyScalar(2 * this.dot(_0x556b48)));
  }
  ['angleTo'](_0x594b77) {
    const _0x2a9ded = Math.sqrt(this.lengthSq() * _0x594b77.lengthSq());
    if (_0x2a9ded === 0) return Math.PI / 2;
    const _0x13ae81 = this.dot(_0x594b77) / _0x2a9ded;
    return Math.acos(clamp(_0x13ae81, -1, 1));
  }
  ['distanceTo'](_0x119d7e) {
    return Math.sqrt(this.distanceToSquared(_0x119d7e));
  }
  ['distanceToSquared'](_0x24d471) {
    const _0x59458f = this.x - _0x24d471.x,
      _0x4d10b7 = this.y - _0x24d471.y,
      _0x4a7a0a = this.z - _0x24d471.z;
    return _0x59458f * _0x59458f + _0x4d10b7 * _0x4d10b7 + _0x4a7a0a * _0x4a7a0a;
  }
  ['manhattanDistanceTo'](_0x1e26c8) {
    return Math.abs(this.x - _0x1e26c8.x) + Math.abs(this.y - _0x1e26c8.y) + Math.abs(this.z - _0x1e26c8.z);
  }
  ['setFromSpherical'](_0x3ae36f) {
    return this.setFromSphericalCoords(_0x3ae36f.radius, _0x3ae36f.phi, _0x3ae36f.theta);
  }
  ['setFromSphericalCoords'](_0x45287f, _0x3d14a9, _0x32a9a3) {
    const _0x2f3e1f = Math.sin(_0x3d14a9) * _0x45287f;
    return (
      (this.x = _0x2f3e1f * Math.sin(_0x32a9a3)),
      (this.y = Math.cos(_0x3d14a9) * _0x45287f),
      (this.z = _0x2f3e1f * Math.cos(_0x32a9a3)),
      this
    );
  }
  ['setFromCylindrical'](_0x5345d3) {
    return this.setFromCylindricalCoords(_0x5345d3.radius, _0x5345d3.theta, _0x5345d3.y);
  }
  ['setFromCylindricalCoords'](_0x38ed62, _0x31453c, _0x4f2cc7) {
    return (
      (this.x = _0x38ed62 * Math.sin(_0x31453c)),
      (this.y = _0x4f2cc7),
      (this.z = _0x38ed62 * Math.cos(_0x31453c)),
      this
    );
  }
  ['setFromMatrixPosition'](_0x316c10) {
    const _0x438cbe = _0x316c10.elements;
    return ((this.x = _0x438cbe[12]), (this.y = _0x438cbe[13]), (this.z = _0x438cbe[14]), this);
  }
  ['setFromMatrixScale'](_0x450743) {
    const _0x1add92 = this.setFromMatrixColumn(_0x450743, 0).length(),
      _0x211993 = this.setFromMatrixColumn(_0x450743, 1).length(),
      _0x3bddfb = this.setFromMatrixColumn(_0x450743, 2).length();
    return ((this.x = _0x1add92), (this.y = _0x211993), (this.z = _0x3bddfb), this);
  }
  ['setFromMatrixColumn'](_0x19974b, _0x286822) {
    return this.fromArray(_0x19974b.elements, _0x286822 * 4);
  }
  ['setFromMatrix3Column'](_0x26a9ce, _0x2fc45a) {
    return this.fromArray(_0x26a9ce.elements, _0x2fc45a * 3);
  }
  ['setFromEuler'](_0x19de5a) {
    return ((this.x = _0x19de5a._x), (this.y = _0x19de5a._y), (this.z = _0x19de5a._z), this);
  }
  ['setFromColor'](_0x57fd17) {
    return ((this.x = _0x57fd17.r), (this.y = _0x57fd17.g), (this.z = _0x57fd17.b), this);
  }
  ['equals'](_0x48a0f8) {
    return _0x48a0f8.x === this.x && _0x48a0f8.y === this.y && _0x48a0f8.z === this.z;
  }
  ['fromArray'](_0x4341df, _0x586270 = 0) {
    return (
      (this.x = _0x4341df[_0x586270]),
      (this.y = _0x4341df[_0x586270 + 1]),
      (this.z = _0x4341df[_0x586270 + 2]),
      this
    );
  }
  ['toArray'](_0x148dc7 = [], _0x2acbda = 0) {
    return (
      (_0x148dc7[_0x2acbda] = this.x),
      (_0x148dc7[_0x2acbda + 1] = this.y),
      (_0x148dc7[_0x2acbda + 2] = this.z),
      _0x148dc7
    );
  }
  ['fromBufferAttribute'](_0x2ad09, _0x3b27d0) {
    return (
      (this.x = _0x2ad09.getX(_0x3b27d0)),
      (this.y = _0x2ad09.getY(_0x3b27d0)),
      (this.z = _0x2ad09.getZ(_0x3b27d0)),
      this
    );
  }
  ['random']() {
    return ((this.x = Math.random()), (this.y = Math.random()), (this.z = Math.random()), this);
  }
  ['randomDirection']() {
    const _0x5f0c85 = Math.random() * Math.PI * 2,
      _0x3f9a7c = Math.random() * 2 - 1,
      _0x4e0c77 = Math.sqrt(1 - _0x3f9a7c * _0x3f9a7c);
    return (
      (this.x = _0x4e0c77 * Math.cos(_0x5f0c85)),
      (this.y = _0x3f9a7c),
      (this.z = _0x4e0c77 * Math.sin(_0x5f0c85)),
      this
    );
  }
  *[Symbol.iterator]() {
    (yield this.x, yield this.y, yield this.z);
  }
}
const _vector$c = new Vector3(),
  _quaternion$4 = new Quaternion();
class Matrix3 {
  constructor(
    _0x39666b,
    _0x46534d,
    _0x16b268,
    _0x399551,
    _0x4d295a,
    _0x4a2204,
    _0x36ef47,
    _0x11c3a5,
    _0x511b94,
  ) {
    ((Matrix3.prototype.isMatrix3 = true),
      (this.elements = [1, 0, 0, 0, 1, 0, 0, 0, 1]),
      _0x39666b !== undefined &&
        this.set(
          _0x39666b,
          _0x46534d,
          _0x16b268,
          _0x399551,
          _0x4d295a,
          _0x4a2204,
          _0x36ef47,
          _0x11c3a5,
          _0x511b94,
        ));
  }
  ['set'](_0x26cd40, _0x4e4f9b, _0x1d267b, _0x11ccb2, _0x2244a9, _0x4ab437, _0x1a3e5f, _0x26fe8a, _0x36ad29) {
    const _0x588fe0 = this.elements;
    return (
      (_0x588fe0[0] = _0x26cd40),
      (_0x588fe0[1] = _0x11ccb2),
      (_0x588fe0[2] = _0x1a3e5f),
      (_0x588fe0[3] = _0x4e4f9b),
      (_0x588fe0[4] = _0x2244a9),
      (_0x588fe0[5] = _0x26fe8a),
      (_0x588fe0[6] = _0x1d267b),
      (_0x588fe0[7] = _0x4ab437),
      (_0x588fe0[8] = _0x36ad29),
      this
    );
  }
  ['identity']() {
    return (this.set(1, 0, 0, 0, 1, 0, 0, 0, 1), this);
  }
  ['copy'](_0x53485a) {
    const _0x2ee56b = this.elements,
      _0x2fd17a = _0x53485a.elements;
    return (
      (_0x2ee56b[0] = _0x2fd17a[0]),
      (_0x2ee56b[1] = _0x2fd17a[1]),
      (_0x2ee56b[2] = _0x2fd17a[2]),
      (_0x2ee56b[3] = _0x2fd17a[3]),
      (_0x2ee56b[4] = _0x2fd17a[4]),
      (_0x2ee56b[5] = _0x2fd17a[5]),
      (_0x2ee56b[6] = _0x2fd17a[6]),
      (_0x2ee56b[7] = _0x2fd17a[7]),
      (_0x2ee56b[8] = _0x2fd17a[8]),
      this
    );
  }
  ['extractBasis'](_0x151415, _0x280f57, _0x3d87ed) {
    return (
      _0x151415.setFromMatrix3Column(this, 0),
      _0x280f57.setFromMatrix3Column(this, 1),
      _0x3d87ed.setFromMatrix3Column(this, 2),
      this
    );
  }
  ['setFromMatrix4'](_0x399b12) {
    const _0x3c265e = _0x399b12.elements;
    return (
      this.set(
        _0x3c265e[0],
        _0x3c265e[4],
        _0x3c265e[8],
        _0x3c265e[1],
        _0x3c265e[5],
        _0x3c265e[9],
        _0x3c265e[2],
        _0x3c265e[6],
        _0x3c265e[10],
      ),
      this
    );
  }
  ['multiply'](_0x3c1ece) {
    return this.multiplyMatrices(this, _0x3c1ece);
  }
  ['premultiply'](_0x402210) {
    return this.multiplyMatrices(_0x402210, this);
  }
  ['multiplyMatrices'](_0x292d7f, _0x44d348) {
    const _0x1e9bab = _0x292d7f.elements,
      _0x25ce40 = _0x44d348.elements,
      _0x28a8c4 = this.elements,
      _0x57c070 = _0x1e9bab[0],
      _0x8fa900 = _0x1e9bab[3],
      _0x37f760 = _0x1e9bab[6],
      _0x5886f5 = _0x1e9bab[1],
      _0x120ed7 = _0x1e9bab[4],
      _0x312676 = _0x1e9bab[7],
      _0x54199f = _0x1e9bab[2],
      _0x164075 = _0x1e9bab[5],
      _0x2376fa = _0x1e9bab[8],
      _0x10c6e7 = _0x25ce40[0],
      _0x5bf1e8 = _0x25ce40[3],
      _0x47472b = _0x25ce40[6],
      _0x1d708e = _0x25ce40[1],
      _0x16381a = _0x25ce40[4],
      _0x499ba6 = _0x25ce40[7],
      _0x5afce5 = _0x25ce40[2],
      _0x141505 = _0x25ce40[5],
      _0x1d4b1f = _0x25ce40[8];
    return (
      (_0x28a8c4[0] = _0x57c070 * _0x10c6e7 + _0x8fa900 * _0x1d708e + _0x37f760 * _0x5afce5),
      (_0x28a8c4[3] = _0x57c070 * _0x5bf1e8 + _0x8fa900 * _0x16381a + _0x37f760 * _0x141505),
      (_0x28a8c4[6] = _0x57c070 * _0x47472b + _0x8fa900 * _0x499ba6 + _0x37f760 * _0x1d4b1f),
      (_0x28a8c4[1] = _0x5886f5 * _0x10c6e7 + _0x120ed7 * _0x1d708e + _0x312676 * _0x5afce5),
      (_0x28a8c4[4] = _0x5886f5 * _0x5bf1e8 + _0x120ed7 * _0x16381a + _0x312676 * _0x141505),
      (_0x28a8c4[7] = _0x5886f5 * _0x47472b + _0x120ed7 * _0x499ba6 + _0x312676 * _0x1d4b1f),
      (_0x28a8c4[2] = _0x54199f * _0x10c6e7 + _0x164075 * _0x1d708e + _0x2376fa * _0x5afce5),
      (_0x28a8c4[5] = _0x54199f * _0x5bf1e8 + _0x164075 * _0x16381a + _0x2376fa * _0x141505),
      (_0x28a8c4[8] = _0x54199f * _0x47472b + _0x164075 * _0x499ba6 + _0x2376fa * _0x1d4b1f),
      this
    );
  }
  ['multiplyScalar'](_0xb68b5d) {
    const _0x56a1c8 = this.elements;
    return (
      (_0x56a1c8[0] *= _0xb68b5d),
      (_0x56a1c8[3] *= _0xb68b5d),
      (_0x56a1c8[6] *= _0xb68b5d),
      (_0x56a1c8[1] *= _0xb68b5d),
      (_0x56a1c8[4] *= _0xb68b5d),
      (_0x56a1c8[7] *= _0xb68b5d),
      (_0x56a1c8[2] *= _0xb68b5d),
      (_0x56a1c8[5] *= _0xb68b5d),
      (_0x56a1c8[8] *= _0xb68b5d),
      this
    );
  }
  ['determinant']() {
    const _0xb65603 = this.elements,
      _0x113a84 = _0xb65603[0],
      _0x11552d = _0xb65603[1],
      _0x10556e = _0xb65603[2],
      _0x50c225 = _0xb65603[3],
      _0x5fb8b = _0xb65603[4],
      _0x3f5f8b = _0xb65603[5],
      _0x49e636 = _0xb65603[6],
      _0xd2f12d = _0xb65603[7],
      _0x218efe = _0xb65603[8];
    return (
      _0x113a84 * _0x5fb8b * _0x218efe -
      _0x113a84 * _0x3f5f8b * _0xd2f12d -
      _0x11552d * _0x50c225 * _0x218efe +
      _0x11552d * _0x3f5f8b * _0x49e636 +
      _0x10556e * _0x50c225 * _0xd2f12d -
      _0x10556e * _0x5fb8b * _0x49e636
    );
  }
  ['invert']() {
    const _0x14a84e = this.elements,
      _0x2cd91b = _0x14a84e[0],
      _0x1e840a = _0x14a84e[1],
      _0x3161fe = _0x14a84e[2],
      _0x528b4c = _0x14a84e[3],
      _0x243933 = _0x14a84e[4],
      _0x2edf2c = _0x14a84e[5],
      _0x3cbeb7 = _0x14a84e[6],
      _0xc1c943 = _0x14a84e[7],
      _0x3cdc1a = _0x14a84e[8],
      _0x13bce7 = _0x3cdc1a * _0x243933 - _0x2edf2c * _0xc1c943,
      _0x815f0 = _0x2edf2c * _0x3cbeb7 - _0x3cdc1a * _0x528b4c,
      _0x31d6b9 = _0xc1c943 * _0x528b4c - _0x243933 * _0x3cbeb7,
      _0x25f6fa = _0x2cd91b * _0x13bce7 + _0x1e840a * _0x815f0 + _0x3161fe * _0x31d6b9;
    if (_0x25f6fa === 0) return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0);
    const _0x5d4574 = 1 / _0x25f6fa;
    return (
      (_0x14a84e[0] = _0x13bce7 * _0x5d4574),
      (_0x14a84e[1] = (_0x3161fe * _0xc1c943 - _0x3cdc1a * _0x1e840a) * _0x5d4574),
      (_0x14a84e[2] = (_0x2edf2c * _0x1e840a - _0x3161fe * _0x243933) * _0x5d4574),
      (_0x14a84e[3] = _0x815f0 * _0x5d4574),
      (_0x14a84e[4] = (_0x3cdc1a * _0x2cd91b - _0x3161fe * _0x3cbeb7) * _0x5d4574),
      (_0x14a84e[5] = (_0x3161fe * _0x528b4c - _0x2edf2c * _0x2cd91b) * _0x5d4574),
      (_0x14a84e[6] = _0x31d6b9 * _0x5d4574),
      (_0x14a84e[7] = (_0x1e840a * _0x3cbeb7 - _0xc1c943 * _0x2cd91b) * _0x5d4574),
      (_0x14a84e[8] = (_0x243933 * _0x2cd91b - _0x1e840a * _0x528b4c) * _0x5d4574),
      this
    );
  }
  ['transpose']() {
    let _0x1a1254;
    const _0x5b1240 = this.elements;
    return (
      (_0x1a1254 = _0x5b1240[1]),
      (_0x5b1240[1] = _0x5b1240[3]),
      (_0x5b1240[3] = _0x1a1254),
      (_0x1a1254 = _0x5b1240[2]),
      (_0x5b1240[2] = _0x5b1240[6]),
      (_0x5b1240[6] = _0x1a1254),
      (_0x1a1254 = _0x5b1240[5]),
      (_0x5b1240[5] = _0x5b1240[7]),
      (_0x5b1240[7] = _0x1a1254),
      this
    );
  }
  ['getNormalMatrix'](_0x13f448) {
    return this.setFromMatrix4(_0x13f448).invert().transpose();
  }
  ['transposeIntoArray'](_0x1550ea) {
    const _0x374a4d = this.elements;
    return (
      (_0x1550ea[0] = _0x374a4d[0]),
      (_0x1550ea[1] = _0x374a4d[3]),
      (_0x1550ea[2] = _0x374a4d[6]),
      (_0x1550ea[3] = _0x374a4d[1]),
      (_0x1550ea[4] = _0x374a4d[4]),
      (_0x1550ea[5] = _0x374a4d[7]),
      (_0x1550ea[6] = _0x374a4d[2]),
      (_0x1550ea[7] = _0x374a4d[5]),
      (_0x1550ea[8] = _0x374a4d[8]),
      this
    );
  }
  ['setUvTransform'](_0x1342bf, _0x506843, _0x3d1dd3, _0x4f5f7a, _0x147206, _0x3ae223, _0x1d03cc) {
    const _0x50276c = Math.cos(_0x147206),
      _0xc8827c = Math.sin(_0x147206);
    return (
      this.set(
        _0x3d1dd3 * _0x50276c,
        _0x3d1dd3 * _0xc8827c,
        -_0x3d1dd3 * (_0x50276c * _0x3ae223 + _0xc8827c * _0x1d03cc) + _0x3ae223 + _0x1342bf,
        -_0x4f5f7a * _0xc8827c,
        _0x4f5f7a * _0x50276c,
        -_0x4f5f7a * (-_0xc8827c * _0x3ae223 + _0x50276c * _0x1d03cc) + _0x1d03cc + _0x506843,
        0,
        0,
        1,
      ),
      this
    );
  }
  ['scale'](_0x21d685, _0x3b076c) {
    return (this.premultiply(_m3.makeScale(_0x21d685, _0x3b076c)), this);
  }
  ['rotate'](_0x5890d6) {
    return (this.premultiply(_m3.makeRotation(-_0x5890d6)), this);
  }
  ['translate'](_0x113ccf, _0x255029) {
    return (this.premultiply(_m3.makeTranslation(_0x113ccf, _0x255029)), this);
  }
  ['makeTranslation'](_0x518f98, _0x4b6e19) {
    return (
      _0x518f98.isVector2
        ? this.set(1, 0, _0x518f98.x, 0, 1, _0x518f98.y, 0, 0, 1)
        : this.set(1, 0, _0x518f98, 0, 1, _0x4b6e19, 0, 0, 1),
      this
    );
  }
  ['makeRotation'](_0x34e50a) {
    const _0x3bf2ae = Math.cos(_0x34e50a),
      _0x25b0a3 = Math.sin(_0x34e50a);
    return (this.set(_0x3bf2ae, -_0x25b0a3, 0, _0x25b0a3, _0x3bf2ae, 0, 0, 0, 1), this);
  }
  ['makeScale'](_0x54353e, _0x7c6cec) {
    return (this.set(_0x54353e, 0, 0, 0, _0x7c6cec, 0, 0, 0, 1), this);
  }
  ['equals'](_0x4a41c7) {
    const _0x3a9c11 = this.elements,
      _0xca9285 = _0x4a41c7.elements;
    for (let _0x455ad9 = 0; _0x455ad9 < 9; _0x455ad9++) {
      if (_0x3a9c11[_0x455ad9] !== _0xca9285[_0x455ad9]) return false;
    }
    return true;
  }
  ['fromArray'](_0x3dd19f, _0x10c66f = 0) {
    for (let _0x40e5ad = 0; _0x40e5ad < 9; _0x40e5ad++) {
      this.elements[_0x40e5ad] = _0x3dd19f[_0x40e5ad + _0x10c66f];
    }
    return this;
  }
  ['toArray'](_0x46c4be = [], _0x349d9d = 0) {
    const _0x31a291 = this.elements;
    return (
      (_0x46c4be[_0x349d9d] = _0x31a291[0]),
      (_0x46c4be[_0x349d9d + 1] = _0x31a291[1]),
      (_0x46c4be[_0x349d9d + 2] = _0x31a291[2]),
      (_0x46c4be[_0x349d9d + 3] = _0x31a291[3]),
      (_0x46c4be[_0x349d9d + 4] = _0x31a291[4]),
      (_0x46c4be[_0x349d9d + 5] = _0x31a291[5]),
      (_0x46c4be[_0x349d9d + 6] = _0x31a291[6]),
      (_0x46c4be[_0x349d9d + 7] = _0x31a291[7]),
      (_0x46c4be[_0x349d9d + 8] = _0x31a291[8]),
      _0x46c4be
    );
  }
  ['clone']() {
    return new this['constructor']().fromArray(this.elements);
  }
}
const _m3 = new Matrix3();
function arrayNeedsUint32(_0x393a62) {
  for (let _0x828b77 = _0x393a62.length - 1; _0x828b77 >= 0; --_0x828b77) {
    if (_0x393a62[_0x828b77] >= 0xffff) return true;
  }
  return false;
}
const TYPED_ARRAYS = {
  Int8Array: Int8Array,
  Uint8Array: Uint8Array,
  Uint8ClampedArray: Uint8ClampedArray,
  Int16Array: Int16Array,
  Uint16Array: Uint16Array,
  Int32Array: Int32Array,
  Uint32Array: Uint32Array,
  Float32Array: Float32Array,
  Float64Array: Float64Array,
};
function getTypedArray(_0x37fa66, _0x45f8b2) {
  return new TYPED_ARRAYS[_0x37fa66](_0x45f8b2);
}
function createElementNS(_0x1d6934) {
  return document.createElementNS('http://www.w3.org/1999/xhtml', _0x1d6934);
}
function createCanvasElement() {
  const _0x1a1d80 = createElementNS('canvas');
  return ((_0x1a1d80.style.display = 'block'), _0x1a1d80);
}
const _cache = {};
function warnOnce(_0x50c4ac) {
  if (_0x50c4ac in _cache) return;
  ((_cache[_0x50c4ac] = true), console.warn(_0x50c4ac));
}
function probeAsync(_0x407b50, _0x2ad7f1, _0x1d263f) {
  return new Promise(function (_0x457508, _0x3eb7e1) {
    function _0x13bb7e() {
      switch (_0x407b50.clientWaitSync(_0x2ad7f1, _0x407b50.SYNC_FLUSH_COMMANDS_BIT, 0)) {
        case _0x407b50.WAIT_FAILED:
          _0x3eb7e1();
          break;
        case _0x407b50.TIMEOUT_EXPIRED:
          setTimeout(_0x13bb7e, _0x1d263f);
          break;
        default:
          _0x457508();
      }
    }
    setTimeout(_0x13bb7e, _0x1d263f);
  });
}
const LINEAR_REC709_TO_XYZ = new Matrix3().set(
    0.4123908,
    0.3575843,
    0.1804808,
    0.212639,
    0.7151687,
    0.0721923,
    0.0193308,
    0.1191948,
    0.9505322,
  ),
  XYZ_TO_LINEAR_REC709 = new Matrix3().set(
    3.2409699,
    -1.5373832,
    -0.4986108,
    -0.9692436,
    1.8759675,
    0.0415551,
    0.0556301,
    -0.203977,
    1.0569715,
  );
function createColorManagement() {
  const _0x12df3f = {
      enabled: true,
      workingColorSpace: LinearSRGBColorSpace,
      spaces: {},
      convert: function (_0x54bd3d, _0x367655, _0x5c43cf) {
        if (this.enabled === false || _0x367655 === _0x5c43cf || !_0x367655 || !_0x5c43cf) return _0x54bd3d;
        return (
          this.spaces[_0x367655].transfer === SRGBTransfer &&
            ((_0x54bd3d.r = SRGBToLinear(_0x54bd3d.r)),
            (_0x54bd3d.g = SRGBToLinear(_0x54bd3d.g)),
            (_0x54bd3d.b = SRGBToLinear(_0x54bd3d.b))),
          this.spaces[_0x367655].primaries !== this.spaces[_0x5c43cf].primaries &&
            (_0x54bd3d.applyMatrix3(this.spaces[_0x367655].toXYZ),
            _0x54bd3d.applyMatrix3(this.spaces[_0x5c43cf].fromXYZ)),
          this.spaces[_0x5c43cf].transfer === SRGBTransfer &&
            ((_0x54bd3d.r = LinearToSRGB(_0x54bd3d.r)),
            (_0x54bd3d.g = LinearToSRGB(_0x54bd3d.g)),
            (_0x54bd3d.b = LinearToSRGB(_0x54bd3d.b))),
          _0x54bd3d
        );
      },
      workingToColorSpace: function (_0xf542c8, _0x5df34c) {
        return this.convert(_0xf542c8, this.workingColorSpace, _0x5df34c);
      },
      colorSpaceToWorking: function (_0x53730d, _0x1c5696) {
        return this.convert(_0x53730d, _0x1c5696, this.workingColorSpace);
      },
      getPrimaries: function (_0x2100ea) {
        return this.spaces[_0x2100ea].primaries;
      },
      getTransfer: function (_0x58b3aa) {
        if (_0x58b3aa === NoColorSpace) return LinearTransfer;
        return this.spaces[_0x58b3aa].transfer;
      },
      getToneMappingMode: function (_0x265d49) {
        return this.spaces[_0x265d49].outputColorSpaceConfig.toneMappingMode || 'standard';
      },
      getLuminanceCoefficients: function (_0x13ebe0, _0x55cb55 = this.workingColorSpace) {
        return _0x13ebe0.fromArray(this.spaces[_0x55cb55].luminanceCoefficients);
      },
      define: function (_0x2f05ab) {
        Object.assign(this.spaces, _0x2f05ab);
      },
      _getMatrix: function (_0x109f56, _0x5ce90b, _0x4d40b6) {
        return _0x109f56.copy(this.spaces[_0x5ce90b].toXYZ).multiply(this.spaces[_0x4d40b6].fromXYZ);
      },
      _getDrawingBufferColorSpace: function (_0x43a876) {
        return this.spaces[_0x43a876].outputColorSpaceConfig.drawingBufferColorSpace;
      },
      _getUnpackColorSpace: function (_0x1dfec3 = this.workingColorSpace) {
        return this.spaces[_0x1dfec3].workingColorSpaceConfig.unpackColorSpace;
      },
      fromWorkingColorSpace: function (_0x3f30b4, _0x6ed654) {
        return (
          warnOnce(
            'THREE.ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace().',
          ),
          _0x12df3f.workingToColorSpace(_0x3f30b4, _0x6ed654)
        );
      },
      toWorkingColorSpace: function (_0x4f2327, _0x1980da) {
        return (
          warnOnce(
            'THREE.ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking().',
          ),
          _0x12df3f.colorSpaceToWorking(_0x4f2327, _0x1980da)
        );
      },
    },
    _0x4681b1 = [0.64, 0.33, 0.3, 0.6, 0.15, 0.06],
    _0x12a14d = [0.2126, 0.7152, 0.0722],
    _0x3a6df3 = [0.3127, 0.329];
  return (
    _0x12df3f.define({
      [LinearSRGBColorSpace]: {
        primaries: _0x4681b1,
        whitePoint: _0x3a6df3,
        transfer: LinearTransfer,
        toXYZ: LINEAR_REC709_TO_XYZ,
        fromXYZ: XYZ_TO_LINEAR_REC709,
        luminanceCoefficients: _0x12a14d,
        workingColorSpaceConfig: { unpackColorSpace: SRGBColorSpace },
        outputColorSpaceConfig: { drawingBufferColorSpace: SRGBColorSpace },
      },
      [SRGBColorSpace]: {
        primaries: _0x4681b1,
        whitePoint: _0x3a6df3,
        transfer: SRGBTransfer,
        toXYZ: LINEAR_REC709_TO_XYZ,
        fromXYZ: XYZ_TO_LINEAR_REC709,
        luminanceCoefficients: _0x12a14d,
        outputColorSpaceConfig: { drawingBufferColorSpace: SRGBColorSpace },
      },
    }),
    _0x12df3f
  );
}
const ColorManagement = createColorManagement();
function SRGBToLinear(_0x41e339) {
  return _0x41e339 < 0.04045
    ? _0x41e339 * 0.0773993808
    : Math.pow(_0x41e339 * 0.9478672986 + 0.0521327014, 2.4);
}
function LinearToSRGB(_0x5b96d8) {
  return _0x5b96d8 < 0.0031308 ? _0x5b96d8 * 12.92 : 1.055 * Math.pow(_0x5b96d8, 0.41666) - 0.055;
}
let _canvas;
class ImageUtils {
  static ['getDataURL'](_0x1699cc, _0x5efb37 = 'image/png') {
    if (/^data:/i.test(_0x1699cc.src)) return _0x1699cc.src;
    if (typeof HTMLCanvasElement === 'undefined') return _0x1699cc.src;
    let _0x545b48;
    if (_0x1699cc instanceof HTMLCanvasElement) _0x545b48 = _0x1699cc;
    else {
      if (_canvas === undefined) _canvas = createElementNS('canvas');
      ((_canvas.width = _0x1699cc.width), (_canvas.height = _0x1699cc.height));
      const _0x5d9ba5 = _canvas.getContext('2d');
      (_0x1699cc instanceof ImageData
        ? _0x5d9ba5.putImageData(_0x1699cc, 0, 0)
        : _0x5d9ba5.drawImage(_0x1699cc, 0, 0, _0x1699cc.width, _0x1699cc.height),
        (_0x545b48 = _canvas));
    }
    return _0x545b48.toDataURL(_0x5efb37);
  }
  static ['sRGBToLinear'](_0x158371) {
    if (
      (typeof HTMLImageElement !== 'undefined' && _0x158371 instanceof HTMLImageElement) ||
      (typeof HTMLCanvasElement !== 'undefined' && _0x158371 instanceof HTMLCanvasElement) ||
      (typeof ImageBitmap !== 'undefined' && _0x158371 instanceof ImageBitmap)
    ) {
      const _0x20d64a = createElementNS('canvas');
      ((_0x20d64a.width = _0x158371.width), (_0x20d64a.height = _0x158371.height));
      const _0x57c689 = _0x20d64a.getContext('2d');
      _0x57c689.drawImage(_0x158371, 0, 0, _0x158371.width, _0x158371.height);
      const _0x51314d = _0x57c689.getImageData(0, 0, _0x158371.width, _0x158371.height),
        _0x113dfd = _0x51314d.data;
      for (let _0x45ae6a = 0; _0x45ae6a < _0x113dfd.length; _0x45ae6a++) {
        _0x113dfd[_0x45ae6a] = SRGBToLinear(_0x113dfd[_0x45ae6a] / 255) * 255;
      }
      return (_0x57c689.putImageData(_0x51314d, 0, 0), _0x20d64a);
    } else {
      if (_0x158371.data) {
        const _0x2bd4a3 = _0x158371.data.slice(0);
        for (let _0x23ae02 = 0; _0x23ae02 < _0x2bd4a3.length; _0x23ae02++) {
          _0x2bd4a3 instanceof Uint8Array || _0x2bd4a3 instanceof Uint8ClampedArray
            ? (_0x2bd4a3[_0x23ae02] = Math.floor(SRGBToLinear(_0x2bd4a3[_0x23ae02] / 255) * 255))
            : (_0x2bd4a3[_0x23ae02] = SRGBToLinear(_0x2bd4a3[_0x23ae02]));
        }
        return { data: _0x2bd4a3, width: _0x158371.width, height: _0x158371.height };
      } else
        return (
          console.warn(
            'THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.',
          ),
          _0x158371
        );
    }
  }
}
let _sourceId = 0;
class Source {
  constructor(_0x13752c = null) {
    ((this.isSource = true),
      Object.defineProperty(this, 'id', { value: _sourceId++ }),
      (this.uuid = generateUUID()),
      (this.data = _0x13752c),
      (this.dataReady = true),
      (this.version = 0));
  }
  ['getSize'](_0x3edd6a) {
    const _0x262de1 = this.data;
    if (typeof HTMLVideoElement !== 'undefined' && _0x262de1 instanceof HTMLVideoElement)
      _0x3edd6a.set(_0x262de1.videoWidth, _0x262de1.videoHeight, 0);
    else {
      if (_0x262de1 instanceof VideoFrame) _0x3edd6a.set(_0x262de1.displayHeight, _0x262de1.displayWidth, 0);
      else
        _0x262de1 !== null
          ? _0x3edd6a.set(_0x262de1.width, _0x262de1.height, _0x262de1.depth || 0)
          : _0x3edd6a.set(0, 0, 0);
    }
    return _0x3edd6a;
  }
  set ['needsUpdate'](_0x2b4ba5) {
    if (_0x2b4ba5 === true) this.version++;
  }
  ['toJSON'](_0x31bb9f) {
    const _0x2f2991 = _0x31bb9f === undefined || typeof _0x31bb9f === 'string';
    if (!_0x2f2991 && _0x31bb9f.images[this.uuid] !== undefined) return _0x31bb9f.images[this.uuid];
    const _0x983e41 = { uuid: this.uuid, url: '' },
      _0x594c33 = this.data;
    if (_0x594c33 !== null) {
      let _0x57ccb2;
      if (Array.isArray(_0x594c33)) {
        _0x57ccb2 = [];
        for (let _0x4f07bb = 0, _0x23c638 = _0x594c33.length; _0x4f07bb < _0x23c638; _0x4f07bb++) {
          _0x594c33[_0x4f07bb].isDataTexture
            ? _0x57ccb2.push(serializeImage(_0x594c33[_0x4f07bb].image))
            : _0x57ccb2.push(serializeImage(_0x594c33[_0x4f07bb]));
        }
      } else _0x57ccb2 = serializeImage(_0x594c33);
      _0x983e41.url = _0x57ccb2;
    }
    return (!_0x2f2991 && (_0x31bb9f.images[this.uuid] = _0x983e41), _0x983e41);
  }
}
function serializeImage(_0x1e3c1c) {
  return (typeof HTMLImageElement !== 'undefined' && _0x1e3c1c instanceof HTMLImageElement) ||
    (typeof HTMLCanvasElement !== 'undefined' && _0x1e3c1c instanceof HTMLCanvasElement) ||
    (typeof ImageBitmap !== 'undefined' && _0x1e3c1c instanceof ImageBitmap)
    ? ImageUtils.getDataURL(_0x1e3c1c)
    : _0x1e3c1c.data
      ? {
          data: Array.from(_0x1e3c1c.data),
          width: _0x1e3c1c.width,
          height: _0x1e3c1c.height,
          type: _0x1e3c1c.data.constructor.name,
        }
      : (console.warn('THREE.Texture: Unable to serialize Texture.'), {});
}
let _textureId = 0;
const _tempVec3 = new Vector3();
class Texture extends EventDispatcher {
  constructor(
    _0x25a197 = Texture.DEFAULT_IMAGE,
    _0x2cb876 = Texture.DEFAULT_MAPPING,
    _0x5859e0 = ClampToEdgeWrapping,
    _0x5874a7 = ClampToEdgeWrapping,
    _0x7a2df0 = LinearFilter,
    _0x38f2aa = LinearMipmapLinearFilter,
    _0x5cd3f9 = RGBAFormat,
    _0x1cead6 = UnsignedByteType,
    _0x397e83 = Texture.DEFAULT_ANISOTROPY,
    _0x137204 = NoColorSpace,
  ) {
    (super(),
      (this.isTexture = true),
      Object.defineProperty(this, 'id', { value: _textureId++ }),
      (this.uuid = generateUUID()),
      (this.name = ''),
      (this.source = new Source(_0x25a197)),
      (this.mipmaps = []),
      (this.mapping = _0x2cb876),
      (this.channel = 0),
      (this.wrapS = _0x5859e0),
      (this.wrapT = _0x5874a7),
      (this.magFilter = _0x7a2df0),
      (this.minFilter = _0x38f2aa),
      (this.anisotropy = _0x397e83),
      (this.format = _0x5cd3f9),
      (this.internalFormat = null),
      (this.type = _0x1cead6),
      (this.offset = new Vector2(0, 0)),
      (this.repeat = new Vector2(1, 1)),
      (this.center = new Vector2(0, 0)),
      (this.rotation = 0),
      (this.matrixAutoUpdate = true),
      (this.matrix = new Matrix3()),
      (this.generateMipmaps = true),
      (this.premultiplyAlpha = false),
      (this.flipY = true),
      (this.unpackAlignment = 4),
      (this.colorSpace = _0x137204),
      (this.userData = {}),
      (this.updateRanges = []),
      (this.version = 0),
      (this.onUpdate = null),
      (this.renderTarget = null),
      (this.isRenderTargetTexture = false),
      (this.isArrayTexture = _0x25a197 && _0x25a197.depth && _0x25a197.depth > 1 ? true : false),
      (this.pmremVersion = 0));
  }
  get ['width']() {
    return this.source.getSize(_tempVec3).x;
  }
  get ['height']() {
    return this.source.getSize(_tempVec3).y;
  }
  get ['depth']() {
    return this.source.getSize(_tempVec3).z;
  }
  get ['image']() {
    return this.source.data;
  }
  set ['image'](_0x4cf793 = null) {
    this.source.data = _0x4cf793;
  }
  ['updateMatrix']() {
    this.matrix.setUvTransform(
      this.offset.x,
      this.offset.y,
      this.repeat.x,
      this.repeat.y,
      this.rotation,
      this.center.x,
      this.center.y,
    );
  }
  ['addUpdateRange'](_0x162f1a, _0xc7a267) {
    this.updateRanges.push({ start: _0x162f1a, count: _0xc7a267 });
  }
  ['clearUpdateRanges']() {
    this.updateRanges.length = 0;
  }
  ['clone']() {
    return new this['constructor']().copy(this);
  }
  ['copy'](_0xcea0c8) {
    return (
      (this.name = _0xcea0c8.name),
      (this.source = _0xcea0c8.source),
      (this.mipmaps = _0xcea0c8.mipmaps.slice(0)),
      (this.mapping = _0xcea0c8.mapping),
      (this.channel = _0xcea0c8.channel),
      (this.wrapS = _0xcea0c8.wrapS),
      (this.wrapT = _0xcea0c8.wrapT),
      (this.magFilter = _0xcea0c8.magFilter),
      (this.minFilter = _0xcea0c8.minFilter),
      (this.anisotropy = _0xcea0c8.anisotropy),
      (this.format = _0xcea0c8.format),
      (this.internalFormat = _0xcea0c8.internalFormat),
      (this.type = _0xcea0c8.type),
      this.offset.copy(_0xcea0c8.offset),
      this.repeat.copy(_0xcea0c8.repeat),
      this.center.copy(_0xcea0c8.center),
      (this.rotation = _0xcea0c8.rotation),
      (this.matrixAutoUpdate = _0xcea0c8.matrixAutoUpdate),
      this.matrix.copy(_0xcea0c8.matrix),
      (this.generateMipmaps = _0xcea0c8.generateMipmaps),
      (this.premultiplyAlpha = _0xcea0c8.premultiplyAlpha),
      (this.flipY = _0xcea0c8.flipY),
      (this.unpackAlignment = _0xcea0c8.unpackAlignment),
      (this.colorSpace = _0xcea0c8.colorSpace),
      (this.renderTarget = _0xcea0c8.renderTarget),
      (this.isRenderTargetTexture = _0xcea0c8.isRenderTargetTexture),
      (this.isArrayTexture = _0xcea0c8.isArrayTexture),
      (this.userData = JSON.parse(JSON.stringify(_0xcea0c8.userData))),
      (this.needsUpdate = true),
      this
    );
  }
  ['setValues'](_0x3a632c) {
    for (const _0x37a39e in _0x3a632c) {
      const _0x4ec8b9 = _0x3a632c[_0x37a39e];
      if (_0x4ec8b9 === undefined) {
        console.warn("THREE.Texture.setValues(): parameter '" + _0x37a39e + "' has value of undefined.");
        continue;
      }
      const _0x664b3b = this[_0x37a39e];
      if (_0x664b3b === undefined) {
        console.warn("THREE.Texture.setValues(): property '" + _0x37a39e + "' does not exist.");
        continue;
      }
      if (_0x664b3b && _0x4ec8b9 && _0x664b3b.isVector2 && _0x4ec8b9.isVector2) _0x664b3b.copy(_0x4ec8b9);
      else {
        if (_0x664b3b && _0x4ec8b9 && _0x664b3b.isVector3 && _0x4ec8b9.isVector3) _0x664b3b.copy(_0x4ec8b9);
        else
          _0x664b3b && _0x4ec8b9 && _0x664b3b.isMatrix3 && _0x4ec8b9.isMatrix3
            ? _0x664b3b.copy(_0x4ec8b9)
            : (this[_0x37a39e] = _0x4ec8b9);
      }
    }
  }
  ['toJSON'](_0x2c14f9) {
    const _0x96ae51 = _0x2c14f9 === undefined || typeof _0x2c14f9 === 'string';
    if (!_0x96ae51 && _0x2c14f9.textures[this.uuid] !== undefined) return _0x2c14f9.textures[this.uuid];
    const _0x4214d9 = {
      metadata: { version: 4.7, type: 'Texture', generator: 'Texture.toJSON' },
      uuid: this.uuid,
      name: this.name,
      image: this.source.toJSON(_0x2c14f9).uuid,
      mapping: this.mapping,
      channel: this.channel,
      repeat: [this.repeat.x, this.repeat.y],
      offset: [this.offset.x, this.offset.y],
      center: [this.center.x, this.center.y],
      rotation: this.rotation,
      wrap: [this.wrapS, this.wrapT],
      format: this.format,
      internalFormat: this.internalFormat,
      type: this.type,
      colorSpace: this.colorSpace,
      minFilter: this.minFilter,
      magFilter: this.magFilter,
      anisotropy: this.anisotropy,
      flipY: this.flipY,
      generateMipmaps: this.generateMipmaps,
      premultiplyAlpha: this.premultiplyAlpha,
      unpackAlignment: this.unpackAlignment,
    };
    if (Object.keys(this.userData).length > 0) _0x4214d9.userData = this.userData;
    return (!_0x96ae51 && (_0x2c14f9.textures[this.uuid] = _0x4214d9), _0x4214d9);
  }
  ['dispose']() {
    this.dispatchEvent({ type: 'dispose' });
  }
  ['transformUv'](_0x41ae60) {
    if (this.mapping !== UVMapping) return _0x41ae60;
    _0x41ae60.applyMatrix3(this.matrix);
    if (_0x41ae60.x < 0 || _0x41ae60.x > 1)
      switch (this.wrapS) {
        case RepeatWrapping:
          _0x41ae60.x = _0x41ae60.x - Math.floor(_0x41ae60.x);
          break;
        case ClampToEdgeWrapping:
          _0x41ae60.x = _0x41ae60.x < 0 ? 0 : 1;
          break;
        case MirroredRepeatWrapping:
          Math.abs(Math.floor(_0x41ae60.x) % 2) === 1
            ? (_0x41ae60.x = Math.ceil(_0x41ae60.x) - _0x41ae60.x)
            : (_0x41ae60.x = _0x41ae60.x - Math.floor(_0x41ae60.x));
          break;
      }
    if (_0x41ae60.y < 0 || _0x41ae60.y > 1)
      switch (this.wrapT) {
        case RepeatWrapping:
          _0x41ae60.y = _0x41ae60.y - Math.floor(_0x41ae60.y);
          break;
        case ClampToEdgeWrapping:
          _0x41ae60.y = _0x41ae60.y < 0 ? 0 : 1;
          break;
        case MirroredRepeatWrapping:
          Math.abs(Math.floor(_0x41ae60.y) % 2) === 1
            ? (_0x41ae60.y = Math.ceil(_0x41ae60.y) - _0x41ae60.y)
            : (_0x41ae60.y = _0x41ae60.y - Math.floor(_0x41ae60.y));
          break;
      }
    return (this.flipY && (_0x41ae60.y = 1 - _0x41ae60.y), _0x41ae60);
  }
  set ['needsUpdate'](_0x298a55) {
    _0x298a55 === true && (this.version++, (this.source.needsUpdate = true));
  }
  set ['needsPMREMUpdate'](_0x304759) {
    _0x304759 === true && this.pmremVersion++;
  }
}
((Texture.DEFAULT_IMAGE = null), (Texture.DEFAULT_MAPPING = UVMapping), (Texture.DEFAULT_ANISOTROPY = 1));
class Vector4 {
  constructor(_0x4ff7ad = 0, _0x56722a = 0, _0x2f54b1 = 0, _0x32b511 = 1) {
    ((Vector4.prototype.isVector4 = true),
      (this.x = _0x4ff7ad),
      (this.y = _0x56722a),
      (this.z = _0x2f54b1),
      (this.w = _0x32b511));
  }
  get ['width']() {
    return this.z;
  }
  set ['width'](_0x46b0ee) {
    this.z = _0x46b0ee;
  }
  get ['height']() {
    return this.w;
  }
  set ['height'](_0x368523) {
    this.w = _0x368523;
  }
  ['set'](_0x13aa08, _0x407cf6, _0x69733e, _0xa13668) {
    return ((this.x = _0x13aa08), (this.y = _0x407cf6), (this.z = _0x69733e), (this.w = _0xa13668), this);
  }
  ['setScalar'](_0x51848b) {
    return ((this.x = _0x51848b), (this.y = _0x51848b), (this.z = _0x51848b), (this.w = _0x51848b), this);
  }
  ['setX'](_0x288e19) {
    return ((this.x = _0x288e19), this);
  }
  ['setY'](_0x19fdcc) {
    return ((this.y = _0x19fdcc), this);
  }
  ['setZ'](_0x5ee18f) {
    return ((this.z = _0x5ee18f), this);
  }
  ['setW'](_0x397b8a) {
    return ((this.w = _0x397b8a), this);
  }
  ['setComponent'](_0x1943f6, _0x4893d1) {
    switch (_0x1943f6) {
      case 0:
        this.x = _0x4893d1;
        break;
      case 1:
        this.y = _0x4893d1;
        break;
      case 2:
        this.z = _0x4893d1;
        break;
      case 3:
        this.w = _0x4893d1;
        break;
      default:
        throw new Error('index is out of range: ' + _0x1943f6);
    }
    return this;
  }
  ['getComponent'](_0x4cc139) {
    switch (_0x4cc139) {
      case 0:
        return this.x;
      case 1:
        return this.y;
      case 2:
        return this.z;
      case 3:
        return this.w;
      default:
        throw new Error('index is out of range: ' + _0x4cc139);
    }
  }
  ['clone']() {
    return new this['constructor'](this.x, this.y, this.z, this.w);
  }
  ['copy'](_0x2f7b76) {
    return (
      (this.x = _0x2f7b76.x),
      (this.y = _0x2f7b76.y),
      (this.z = _0x2f7b76.z),
      (this.w = _0x2f7b76.w !== undefined ? _0x2f7b76.w : 1),
      this
    );
  }
  ['add'](_0x1cdfe7) {
    return (
      (this.x += _0x1cdfe7.x),
      (this.y += _0x1cdfe7.y),
      (this.z += _0x1cdfe7.z),
      (this.w += _0x1cdfe7.w),
      this
    );
  }
  ['addScalar'](_0x4844e2) {
    return ((this.x += _0x4844e2), (this.y += _0x4844e2), (this.z += _0x4844e2), (this.w += _0x4844e2), this);
  }
  ['addVectors'](_0x1bb289, _0x3e24f7) {
    return (
      (this.x = _0x1bb289.x + _0x3e24f7.x),
      (this.y = _0x1bb289.y + _0x3e24f7.y),
      (this.z = _0x1bb289.z + _0x3e24f7.z),
      (this.w = _0x1bb289.w + _0x3e24f7.w),
      this
    );
  }
  ['addScaledVector'](_0x55d477, _0x11a9a5) {
    return (
      (this.x += _0x55d477.x * _0x11a9a5),
      (this.y += _0x55d477.y * _0x11a9a5),
      (this.z += _0x55d477.z * _0x11a9a5),
      (this.w += _0x55d477.w * _0x11a9a5),
      this
    );
  }
  ['sub'](_0x2ffd0b) {
    return (
      (this.x -= _0x2ffd0b.x),
      (this.y -= _0x2ffd0b.y),
      (this.z -= _0x2ffd0b.z),
      (this.w -= _0x2ffd0b.w),
      this
    );
  }
  ['subScalar'](_0x1755e4) {
    return ((this.x -= _0x1755e4), (this.y -= _0x1755e4), (this.z -= _0x1755e4), (this.w -= _0x1755e4), this);
  }
  ['subVectors'](_0x7a9e14, _0x99d7ac) {
    return (
      (this.x = _0x7a9e14.x - _0x99d7ac.x),
      (this.y = _0x7a9e14.y - _0x99d7ac.y),
      (this.z = _0x7a9e14.z - _0x99d7ac.z),
      (this.w = _0x7a9e14.w - _0x99d7ac.w),
      this
    );
  }
  ['multiply'](_0x13dd78) {
    return (
      (this.x *= _0x13dd78.x),
      (this.y *= _0x13dd78.y),
      (this.z *= _0x13dd78.z),
      (this.w *= _0x13dd78.w),
      this
    );
  }
  ['multiplyScalar'](_0x73b601) {
    return ((this.x *= _0x73b601), (this.y *= _0x73b601), (this.z *= _0x73b601), (this.w *= _0x73b601), this);
  }
  ['applyMatrix4'](_0x2631b0) {
    const _0x3fe5d8 = this.x,
      _0x54ce1f = this.y,
      _0x6ddd26 = this.z,
      _0x21a138 = this.w,
      _0x5619a5 = _0x2631b0.elements;
    return (
      (this.x =
        _0x5619a5[0] * _0x3fe5d8 +
        _0x5619a5[4] * _0x54ce1f +
        _0x5619a5[8] * _0x6ddd26 +
        _0x5619a5[12] * _0x21a138),
      (this.y =
        _0x5619a5[1] * _0x3fe5d8 +
        _0x5619a5[5] * _0x54ce1f +
        _0x5619a5[9] * _0x6ddd26 +
        _0x5619a5[13] * _0x21a138),
      (this.z =
        _0x5619a5[2] * _0x3fe5d8 +
        _0x5619a5[6] * _0x54ce1f +
        _0x5619a5[10] * _0x6ddd26 +
        _0x5619a5[14] * _0x21a138),
      (this.w =
        _0x5619a5[3] * _0x3fe5d8 +
        _0x5619a5[7] * _0x54ce1f +
        _0x5619a5[11] * _0x6ddd26 +
        _0x5619a5[15] * _0x21a138),
      this
    );
  }
  ['divide'](_0x593c5f) {
    return (
      (this.x /= _0x593c5f.x),
      (this.y /= _0x593c5f.y),
      (this.z /= _0x593c5f.z),
      (this.w /= _0x593c5f.w),
      this
    );
  }
  ['divideScalar'](_0x3b8688) {
    return this.multiplyScalar(1 / _0x3b8688);
  }
  ['setAxisAngleFromQuaternion'](_0x176e41) {
    this.w = 2 * Math.acos(_0x176e41.w);
    const _0x2427eb = Math.sqrt(1 - _0x176e41.w * _0x176e41.w);
    return (
      _0x2427eb < 0.0001
        ? ((this.x = 1), (this.y = 0), (this.z = 0))
        : ((this.x = _0x176e41.x / _0x2427eb),
          (this.y = _0x176e41.y / _0x2427eb),
          (this.z = _0x176e41.z / _0x2427eb)),
      this
    );
  }
  ['setAxisAngleFromRotationMatrix'](_0x366162) {
    let _0x13b773, _0x372b3c, _0x1e137e, _0x3718f6;
    const _0x535206 = 0.01,
      _0x18b22d = 0.1,
      _0x15a60d = _0x366162.elements,
      _0x3dc226 = _0x15a60d[0],
      _0x5b8bd5 = _0x15a60d[4],
      _0x3a1cf8 = _0x15a60d[8],
      _0x53c320 = _0x15a60d[1],
      _0x518ff0 = _0x15a60d[5],
      _0x31f467 = _0x15a60d[9],
      _0x39f966 = _0x15a60d[2],
      _0xa8f7e3 = _0x15a60d[6],
      _0x2e5d23 = _0x15a60d[10];
    if (
      Math.abs(_0x5b8bd5 - _0x53c320) < _0x535206 &&
      Math.abs(_0x3a1cf8 - _0x39f966) < _0x535206 &&
      Math.abs(_0x31f467 - _0xa8f7e3) < _0x535206
    ) {
      if (
        Math.abs(_0x5b8bd5 + _0x53c320) < _0x18b22d &&
        Math.abs(_0x3a1cf8 + _0x39f966) < _0x18b22d &&
        Math.abs(_0x31f467 + _0xa8f7e3) < _0x18b22d &&
        Math.abs(_0x3dc226 + _0x518ff0 + _0x2e5d23 - 3) < _0x18b22d
      )
        return (this.set(1, 0, 0, 0), this);
      _0x13b773 = Math.PI;
      const _0x12211e = (_0x3dc226 + 1) / 2,
        _0x5dc618 = (_0x518ff0 + 1) / 2,
        _0x143772 = (_0x2e5d23 + 1) / 2,
        _0x4ae1bf = (_0x5b8bd5 + _0x53c320) / 4,
        _0x51ffda = (_0x3a1cf8 + _0x39f966) / 4,
        _0x395f80 = (_0x31f467 + _0xa8f7e3) / 4;
      if (_0x12211e > _0x5dc618 && _0x12211e > _0x143772)
        _0x12211e < _0x535206
          ? ((_0x372b3c = 0), (_0x1e137e = 0.707106781), (_0x3718f6 = 0.707106781))
          : ((_0x372b3c = Math.sqrt(_0x12211e)),
            (_0x1e137e = _0x4ae1bf / _0x372b3c),
            (_0x3718f6 = _0x51ffda / _0x372b3c));
      else
        _0x5dc618 > _0x143772
          ? _0x5dc618 < _0x535206
            ? ((_0x372b3c = 0.707106781), (_0x1e137e = 0), (_0x3718f6 = 0.707106781))
            : ((_0x1e137e = Math.sqrt(_0x5dc618)),
              (_0x372b3c = _0x4ae1bf / _0x1e137e),
              (_0x3718f6 = _0x395f80 / _0x1e137e))
          : _0x143772 < _0x535206
            ? ((_0x372b3c = 0.707106781), (_0x1e137e = 0.707106781), (_0x3718f6 = 0))
            : ((_0x3718f6 = Math.sqrt(_0x143772)),
              (_0x372b3c = _0x51ffda / _0x3718f6),
              (_0x1e137e = _0x395f80 / _0x3718f6));
      return (this.set(_0x372b3c, _0x1e137e, _0x3718f6, _0x13b773), this);
    }
    let _0x4f96b1 = Math.sqrt(
      (_0xa8f7e3 - _0x31f467) * (_0xa8f7e3 - _0x31f467) +
        (_0x3a1cf8 - _0x39f966) * (_0x3a1cf8 - _0x39f966) +
        (_0x53c320 - _0x5b8bd5) * (_0x53c320 - _0x5b8bd5),
    );
    if (Math.abs(_0x4f96b1) < 0.001) _0x4f96b1 = 1;
    return (
      (this.x = (_0xa8f7e3 - _0x31f467) / _0x4f96b1),
      (this.y = (_0x3a1cf8 - _0x39f966) / _0x4f96b1),
      (this.z = (_0x53c320 - _0x5b8bd5) / _0x4f96b1),
      (this.w = Math.acos((_0x3dc226 + _0x518ff0 + _0x2e5d23 - 1) / 2)),
      this
    );
  }
  ['setFromMatrixPosition'](_0x2f5187) {
    const _0x55a12f = _0x2f5187.elements;
    return (
      (this.x = _0x55a12f[12]),
      (this.y = _0x55a12f[13]),
      (this.z = _0x55a12f[14]),
      (this.w = _0x55a12f[15]),
      this
    );
  }
  ['min'](_0x2c6f50) {
    return (
      (this.x = Math.min(this.x, _0x2c6f50.x)),
      (this.y = Math.min(this.y, _0x2c6f50.y)),
      (this.z = Math.min(this.z, _0x2c6f50.z)),
      (this.w = Math.min(this.w, _0x2c6f50.w)),
      this
    );
  }
  ['max'](_0x4587e3) {
    return (
      (this.x = Math.max(this.x, _0x4587e3.x)),
      (this.y = Math.max(this.y, _0x4587e3.y)),
      (this.z = Math.max(this.z, _0x4587e3.z)),
      (this.w = Math.max(this.w, _0x4587e3.w)),
      this
    );
  }
  ['clamp'](_0x434c72, _0x23d8cd) {
    return (
      (this.x = clamp(this.x, _0x434c72.x, _0x23d8cd.x)),
      (this.y = clamp(this.y, _0x434c72.y, _0x23d8cd.y)),
      (this.z = clamp(this.z, _0x434c72.z, _0x23d8cd.z)),
      (this.w = clamp(this.w, _0x434c72.w, _0x23d8cd.w)),
      this
    );
  }
  ['clampScalar'](_0x4ce459, _0x571218) {
    return (
      (this.x = clamp(this.x, _0x4ce459, _0x571218)),
      (this.y = clamp(this.y, _0x4ce459, _0x571218)),
      (this.z = clamp(this.z, _0x4ce459, _0x571218)),
      (this.w = clamp(this.w, _0x4ce459, _0x571218)),
      this
    );
  }
  ['clampLength'](_0x4f8a3c, _0x3aed78) {
    const _0xc5297c = this.length();
    return this.divideScalar(_0xc5297c || 1).multiplyScalar(clamp(_0xc5297c, _0x4f8a3c, _0x3aed78));
  }
  ['floor']() {
    return (
      (this.x = Math.floor(this.x)),
      (this.y = Math.floor(this.y)),
      (this.z = Math.floor(this.z)),
      (this.w = Math.floor(this.w)),
      this
    );
  }
  ['ceil']() {
    return (
      (this.x = Math.ceil(this.x)),
      (this.y = Math.ceil(this.y)),
      (this.z = Math.ceil(this.z)),
      (this.w = Math.ceil(this.w)),
      this
    );
  }
  ['round']() {
    return (
      (this.x = Math.round(this.x)),
      (this.y = Math.round(this.y)),
      (this.z = Math.round(this.z)),
      (this.w = Math.round(this.w)),
      this
    );
  }
  ['roundToZero']() {
    return (
      (this.x = Math.trunc(this.x)),
      (this.y = Math.trunc(this.y)),
      (this.z = Math.trunc(this.z)),
      (this.w = Math.trunc(this.w)),
      this
    );
  }
  ['negate']() {
    return ((this.x = -this.x), (this.y = -this.y), (this.z = -this.z), (this.w = -this.w), this);
  }
  ['dot'](_0x25f6b1) {
    return this.x * _0x25f6b1.x + this.y * _0x25f6b1.y + this.z * _0x25f6b1.z + this.w * _0x25f6b1.w;
  }
  ['lengthSq']() {
    return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
  }
  ['length']() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
  }
  ['manhattanLength']() {
    return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z) + Math.abs(this.w);
  }
  ['normalize']() {
    return this.divideScalar(this.length() || 1);
  }
  ['setLength'](_0x199d01) {
    return this.normalize().multiplyScalar(_0x199d01);
  }
  ['lerp'](_0x582acf, _0x166e3b) {
    return (
      (this.x += (_0x582acf.x - this.x) * _0x166e3b),
      (this.y += (_0x582acf.y - this.y) * _0x166e3b),
      (this.z += (_0x582acf.z - this.z) * _0x166e3b),
      (this.w += (_0x582acf.w - this.w) * _0x166e3b),
      this
    );
  }
  ['lerpVectors'](_0x33e907, _0x13b42a, _0x1e1f69) {
    return (
      (this.x = _0x33e907.x + (_0x13b42a.x - _0x33e907.x) * _0x1e1f69),
      (this.y = _0x33e907.y + (_0x13b42a.y - _0x33e907.y) * _0x1e1f69),
      (this.z = _0x33e907.z + (_0x13b42a.z - _0x33e907.z) * _0x1e1f69),
      (this.w = _0x33e907.w + (_0x13b42a.w - _0x33e907.w) * _0x1e1f69),
      this
    );
  }
  ['equals'](_0x39e00d) {
    return (
      _0x39e00d.x === this.x && _0x39e00d.y === this.y && _0x39e00d.z === this.z && _0x39e00d.w === this.w
    );
  }
  ['fromArray'](_0x3741c3, _0x32628f = 0) {
    return (
      (this.x = _0x3741c3[_0x32628f]),
      (this.y = _0x3741c3[_0x32628f + 1]),
      (this.z = _0x3741c3[_0x32628f + 2]),
      (this.w = _0x3741c3[_0x32628f + 3]),
      this
    );
  }
  ['toArray'](_0x35da2f = [], _0x1477e3 = 0) {
    return (
      (_0x35da2f[_0x1477e3] = this.x),
      (_0x35da2f[_0x1477e3 + 1] = this.y),
      (_0x35da2f[_0x1477e3 + 2] = this.z),
      (_0x35da2f[_0x1477e3 + 3] = this.w),
      _0x35da2f
    );
  }
  ['fromBufferAttribute'](_0x41f387, _0x7e571d) {
    return (
      (this.x = _0x41f387.getX(_0x7e571d)),
      (this.y = _0x41f387.getY(_0x7e571d)),
      (this.z = _0x41f387.getZ(_0x7e571d)),
      (this.w = _0x41f387.getW(_0x7e571d)),
      this
    );
  }
  ['random']() {
    return (
      (this.x = Math.random()),
      (this.y = Math.random()),
      (this.z = Math.random()),
      (this.w = Math.random()),
      this
    );
  }
  *[Symbol.iterator]() {
    (yield this.x, yield this.y, yield this.z, yield this.w);
  }
}
class RenderTarget extends EventDispatcher {
  constructor(_0x5d033f = 1, _0x2b7bf7 = 1, _0x1ca043 = {}) {
    (super(),
      (_0x1ca043 = Object.assign(
        {
          generateMipmaps: false,
          internalFormat: null,
          minFilter: LinearFilter,
          depthBuffer: true,
          stencilBuffer: false,
          resolveDepthBuffer: true,
          resolveStencilBuffer: true,
          depthTexture: null,
          samples: 0,
          count: 1,
          depth: 1,
          multiview: false,
        },
        _0x1ca043,
      )),
      (this.isRenderTarget = true),
      (this.width = _0x5d033f),
      (this.height = _0x2b7bf7),
      (this.depth = _0x1ca043.depth),
      (this.scissor = new Vector4(0, 0, _0x5d033f, _0x2b7bf7)),
      (this.scissorTest = false),
      (this.viewport = new Vector4(0, 0, _0x5d033f, _0x2b7bf7)));
    const _0x38f266 = { width: _0x5d033f, height: _0x2b7bf7, depth: _0x1ca043.depth },
      _0x33741b = new Texture(_0x38f266);
    this.textures = [];
    const _0x421029 = _0x1ca043.count;
    for (let _0x2eac68 = 0; _0x2eac68 < _0x421029; _0x2eac68++) {
      ((this.textures[_0x2eac68] = _0x33741b.clone()),
        (this.textures[_0x2eac68].isRenderTargetTexture = true),
        (this.textures[_0x2eac68].renderTarget = this));
    }
    (this._setTextureOptions(_0x1ca043),
      (this.depthBuffer = _0x1ca043.depthBuffer),
      (this.stencilBuffer = _0x1ca043.stencilBuffer),
      (this.resolveDepthBuffer = _0x1ca043.resolveDepthBuffer),
      (this.resolveStencilBuffer = _0x1ca043.resolveStencilBuffer),
      (this._depthTexture = null),
      (this.depthTexture = _0x1ca043.depthTexture),
      (this.samples = _0x1ca043.samples),
      (this.multiview = _0x1ca043.multiview));
  }
  ['_setTextureOptions'](_0x438651 = {}) {
    const _0x4248b4 = { minFilter: LinearFilter, generateMipmaps: false, flipY: false, internalFormat: null };
    if (_0x438651.mapping !== undefined) _0x4248b4.mapping = _0x438651.mapping;
    if (_0x438651.wrapS !== undefined) _0x4248b4.wrapS = _0x438651.wrapS;
    if (_0x438651.wrapT !== undefined) _0x4248b4.wrapT = _0x438651.wrapT;
    if (_0x438651.wrapR !== undefined) _0x4248b4.wrapR = _0x438651.wrapR;
    if (_0x438651.magFilter !== undefined) _0x4248b4.magFilter = _0x438651.magFilter;
    if (_0x438651.minFilter !== undefined) _0x4248b4.minFilter = _0x438651.minFilter;
    if (_0x438651.format !== undefined) _0x4248b4.format = _0x438651.format;
    if (_0x438651.type !== undefined) _0x4248b4.type = _0x438651.type;
    if (_0x438651.anisotropy !== undefined) _0x4248b4.anisotropy = _0x438651.anisotropy;
    if (_0x438651.colorSpace !== undefined) _0x4248b4.colorSpace = _0x438651.colorSpace;
    if (_0x438651.flipY !== undefined) _0x4248b4.flipY = _0x438651.flipY;
    if (_0x438651.generateMipmaps !== undefined) _0x4248b4.generateMipmaps = _0x438651.generateMipmaps;
    if (_0x438651.internalFormat !== undefined) _0x4248b4.internalFormat = _0x438651.internalFormat;
    for (let _0x5a2231 = 0; _0x5a2231 < this.textures.length; _0x5a2231++) {
      const _0x5199e1 = this.textures[_0x5a2231];
      _0x5199e1.setValues(_0x4248b4);
    }
  }
  get ['texture']() {
    return this.textures[0];
  }
  set ['texture'](_0x394b27) {
    this.textures[0] = _0x394b27;
  }
  set ['depthTexture'](_0x483820) {
    if (this._depthTexture !== null) this._depthTexture.renderTarget = null;
    if (_0x483820 !== null) _0x483820.renderTarget = this;
    this._depthTexture = _0x483820;
  }
  get ['depthTexture']() {
    return this._depthTexture;
  }
  ['setSize'](_0x408b61, _0x3d8bbb, _0xf8ab3f = 1) {
    if (this.width !== _0x408b61 || this.height !== _0x3d8bbb || this.depth !== _0xf8ab3f) {
      ((this.width = _0x408b61), (this.height = _0x3d8bbb), (this.depth = _0xf8ab3f));
      for (let _0x2a7bb9 = 0, _0x4534a9 = this.textures.length; _0x2a7bb9 < _0x4534a9; _0x2a7bb9++) {
        ((this.textures[_0x2a7bb9].image.width = _0x408b61),
          (this.textures[_0x2a7bb9].image.height = _0x3d8bbb),
          (this.textures[_0x2a7bb9].image.depth = _0xf8ab3f),
          (this.textures[_0x2a7bb9].isArrayTexture = this.textures[_0x2a7bb9].image.depth > 1));
      }
      this.dispose();
    }
    (this.viewport.set(0, 0, _0x408b61, _0x3d8bbb), this.scissor.set(0, 0, _0x408b61, _0x3d8bbb));
  }
  ['clone']() {
    return new this['constructor']().copy(this);
  }
  ['copy'](_0x5df967) {
    ((this.width = _0x5df967.width),
      (this.height = _0x5df967.height),
      (this.depth = _0x5df967.depth),
      this.scissor.copy(_0x5df967.scissor),
      (this.scissorTest = _0x5df967.scissorTest),
      this.viewport.copy(_0x5df967.viewport),
      (this.textures.length = 0));
    for (let _0x5e9e5f = 0, _0x4e4fea = _0x5df967.textures.length; _0x5e9e5f < _0x4e4fea; _0x5e9e5f++) {
      ((this.textures[_0x5e9e5f] = _0x5df967.textures[_0x5e9e5f].clone()),
        (this.textures[_0x5e9e5f].isRenderTargetTexture = true),
        (this.textures[_0x5e9e5f].renderTarget = this));
      const _0x315ee2 = Object.assign({}, _0x5df967.textures[_0x5e9e5f].image);
      this.textures[_0x5e9e5f].source = new Source(_0x315ee2);
    }
    ((this.depthBuffer = _0x5df967.depthBuffer),
      (this.stencilBuffer = _0x5df967.stencilBuffer),
      (this.resolveDepthBuffer = _0x5df967.resolveDepthBuffer),
      (this.resolveStencilBuffer = _0x5df967.resolveStencilBuffer));
    if (_0x5df967.depthTexture !== null) this.depthTexture = _0x5df967.depthTexture.clone();
    return ((this.samples = _0x5df967.samples), this);
  }
  ['dispose']() {
    this.dispatchEvent({ type: 'dispose' });
  }
}
class WebGLRenderTarget extends RenderTarget {
  constructor(_0x159241 = 1, _0x51ed1b = 1, _0x55798c = {}) {
    (super(_0x159241, _0x51ed1b, _0x55798c), (this.isWebGLRenderTarget = true));
  }
}
class DataArrayTexture extends Texture {
  constructor(_0x2de3c5 = null, _0xfd8102 = 1, _0x7e0c1d = 1, _0x5274eb = 1) {
    (super(null),
      (this.isDataArrayTexture = true),
      (this.image = { data: _0x2de3c5, width: _0xfd8102, height: _0x7e0c1d, depth: _0x5274eb }),
      (this.magFilter = NearestFilter),
      (this.minFilter = NearestFilter),
      (this.wrapR = ClampToEdgeWrapping),
      (this.generateMipmaps = false),
      (this.flipY = false),
      (this.unpackAlignment = 1),
      (this.layerUpdates = new Set()));
  }
  ['addLayerUpdate'](_0xfc5380) {
    this.layerUpdates.add(_0xfc5380);
  }
  ['clearLayerUpdates']() {
    this.layerUpdates.clear();
  }
}
class WebGLArrayRenderTarget extends WebGLRenderTarget {
  constructor(_0x21a167 = 1, _0x22116a = 1, _0x26ae94 = 1, _0x2b3e2f = {}) {
    (super(_0x21a167, _0x22116a, _0x2b3e2f),
      (this.isWebGLArrayRenderTarget = true),
      (this.depth = _0x26ae94),
      (this.texture = new DataArrayTexture(null, _0x21a167, _0x22116a, _0x26ae94)),
      this._setTextureOptions(_0x2b3e2f),
      (this.texture.isRenderTargetTexture = true));
  }
}
class Data3DTexture extends Texture {
  constructor(_0x4361ba = null, _0x4f02f5 = 1, _0x2df491 = 1, _0x37fa95 = 1) {
    (super(null),
      (this.isData3DTexture = true),
      (this.image = { data: _0x4361ba, width: _0x4f02f5, height: _0x2df491, depth: _0x37fa95 }),
      (this.magFilter = NearestFilter),
      (this.minFilter = NearestFilter),
      (this.wrapR = ClampToEdgeWrapping),
      (this.generateMipmaps = false),
      (this.flipY = false),
      (this.unpackAlignment = 1));
  }
}
class WebGL3DRenderTarget extends WebGLRenderTarget {
  constructor(_0x1e8ea7 = 1, _0x312741 = 1, _0x125e2f = 1, _0x364058 = {}) {
    (super(_0x1e8ea7, _0x312741, _0x364058),
      (this.isWebGL3DRenderTarget = true),
      (this.depth = _0x125e2f),
      (this.texture = new Data3DTexture(null, _0x1e8ea7, _0x312741, _0x125e2f)),
      this._setTextureOptions(_0x364058),
      (this.texture.isRenderTargetTexture = true));
  }
}
class Box3 {
  constructor(
    _0xdcf10c = new Vector3(+Infinity, +Infinity, +Infinity),
    _0x403e0f = new Vector3(-Infinity, -Infinity, -Infinity),
  ) {
    ((this.isBox3 = true), (this.min = _0xdcf10c), (this.max = _0x403e0f));
  }
  ['set'](_0x3f955e, _0x5254f6) {
    return (this.min.copy(_0x3f955e), this.max.copy(_0x5254f6), this);
  }
  ['setFromArray'](_0x3bf6ad) {
    this.makeEmpty();
    for (let _0x5ca6a9 = 0, _0x58a755 = _0x3bf6ad.length; _0x5ca6a9 < _0x58a755; _0x5ca6a9 += 3) {
      this.expandByPoint(_vector$b.fromArray(_0x3bf6ad, _0x5ca6a9));
    }
    return this;
  }
  ['setFromBufferAttribute'](_0x48650c) {
    this.makeEmpty();
    for (let _0xc03425 = 0, _0x22c564 = _0x48650c.count; _0xc03425 < _0x22c564; _0xc03425++) {
      this.expandByPoint(_vector$b.fromBufferAttribute(_0x48650c, _0xc03425));
    }
    return this;
  }
  ['setFromPoints'](_0x56955f) {
    this.makeEmpty();
    for (let _0x317170 = 0, _0x13324d = _0x56955f.length; _0x317170 < _0x13324d; _0x317170++) {
      this.expandByPoint(_0x56955f[_0x317170]);
    }
    return this;
  }
  ['setFromCenterAndSize'](_0x1b6d05, _0x4254fa) {
    const _0x28403d = _vector$b.copy(_0x4254fa).multiplyScalar(0.5);
    return (this.min.copy(_0x1b6d05).sub(_0x28403d), this.max.copy(_0x1b6d05).add(_0x28403d), this);
  }
  ['setFromObject'](_0x38805d, _0x2e1e26 = false) {
    return (this.makeEmpty(), this.expandByObject(_0x38805d, _0x2e1e26));
  }
  ['clone']() {
    return new this.constructor().copy(this);
  }
  ['copy'](_0xa0c41c) {
    return (this.min.copy(_0xa0c41c.min), this.max.copy(_0xa0c41c.max), this);
  }
  ['makeEmpty']() {
    return (
      (this.min.x = this.min.y = this.min.z = +Infinity),
      (this.max.x = this.max.y = this.max.z = -Infinity),
      this
    );
  }
  ['isEmpty']() {
    return this.max.x < this.min.x || this.max.y < this.min.y || this.max.z < this.min.z;
  }
  ['getCenter'](_0xbd8903) {
    return this.isEmpty()
      ? _0xbd8903.set(0, 0, 0)
      : _0xbd8903.addVectors(this.min, this.max).multiplyScalar(0.5);
  }
  ['getSize'](_0x237a73) {
    return this.isEmpty() ? _0x237a73.set(0, 0, 0) : _0x237a73.subVectors(this.max, this.min);
  }
  ['expandByPoint'](_0x3b2f33) {
    return (this.min.min(_0x3b2f33), this.max.max(_0x3b2f33), this);
  }
  ['expandByVector'](_0x5de575) {
    return (this.min.sub(_0x5de575), this.max.add(_0x5de575), this);
  }
  ['expandByScalar'](_0x5f0e4f) {
    return (this.min.addScalar(-_0x5f0e4f), this.max.addScalar(_0x5f0e4f), this);
  }
  ['expandByObject'](_0x5d35dd, _0xa94799 = false) {
    _0x5d35dd.updateWorldMatrix(false, false);
    const _0x29782f = _0x5d35dd.geometry;
    if (_0x29782f !== undefined) {
      const _0x436ef3 = _0x29782f.getAttribute('position');
      if (_0xa94799 === true && _0x436ef3 !== undefined && _0x5d35dd.isInstancedMesh !== true)
        for (let _0x2977a8 = 0, _0x4b701f = _0x436ef3.count; _0x2977a8 < _0x4b701f; _0x2977a8++) {
          (_0x5d35dd.isMesh === true
            ? _0x5d35dd.getVertexPosition(_0x2977a8, _vector$b)
            : _vector$b.fromBufferAttribute(_0x436ef3, _0x2977a8),
            _vector$b.applyMatrix4(_0x5d35dd.matrixWorld),
            this.expandByPoint(_vector$b));
        }
      else
        (_0x5d35dd.boundingBox !== undefined
          ? (_0x5d35dd.boundingBox === null && _0x5d35dd.computeBoundingBox(),
            _box$4.copy(_0x5d35dd.boundingBox))
          : (_0x29782f.boundingBox === null && _0x29782f.computeBoundingBox(),
            _box$4.copy(_0x29782f.boundingBox)),
          _box$4.applyMatrix4(_0x5d35dd.matrixWorld),
          this.union(_box$4));
    }
    const _0x407a17 = _0x5d35dd.children;
    for (let _0x578ce3 = 0, _0x4dcc2a = _0x407a17.length; _0x578ce3 < _0x4dcc2a; _0x578ce3++) {
      this.expandByObject(_0x407a17[_0x578ce3], _0xa94799);
    }
    return this;
  }
  ['containsPoint'](_0x4b5913) {
    return (
      _0x4b5913.x >= this.min.x &&
      _0x4b5913.x <= this.max.x &&
      _0x4b5913.y >= this.min.y &&
      _0x4b5913.y <= this.max.y &&
      _0x4b5913.z >= this.min.z &&
      _0x4b5913.z <= this.max.z
    );
  }
  ['containsBox'](_0x3810b2) {
    return (
      this.min.x <= _0x3810b2.min.x &&
      _0x3810b2.max.x <= this.max.x &&
      this.min.y <= _0x3810b2.min.y &&
      _0x3810b2.max.y <= this.max.y &&
      this.min.z <= _0x3810b2.min.z &&
      _0x3810b2.max.z <= this.max.z
    );
  }
  ['getParameter'](_0x1f7714, _0x5b8f91) {
    return _0x5b8f91.set(
      (_0x1f7714.x - this.min.x) / (this.max.x - this.min.x),
      (_0x1f7714.y - this.min.y) / (this.max.y - this.min.y),
      (_0x1f7714.z - this.min.z) / (this.max.z - this.min.z),
    );
  }
  ['intersectsBox'](_0x4c3fa5) {
    return (
      _0x4c3fa5.max.x >= this.min.x &&
      _0x4c3fa5.min.x <= this.max.x &&
      _0x4c3fa5.max.y >= this.min.y &&
      _0x4c3fa5.min.y <= this.max.y &&
      _0x4c3fa5.max.z >= this.min.z &&
      _0x4c3fa5.min.z <= this.max.z
    );
  }
  ['intersectsSphere'](_0x595682) {
    return (
      this.clampPoint(_0x595682.center, _vector$b),
      _vector$b.distanceToSquared(_0x595682.center) <= _0x595682.radius * _0x595682.radius
    );
  }
  ['intersectsPlane'](_0x42c708) {
    let _0xe560b0, _0x1cff74;
    return (
      _0x42c708.normal.x > 0
        ? ((_0xe560b0 = _0x42c708.normal.x * this.min.x), (_0x1cff74 = _0x42c708.normal.x * this.max.x))
        : ((_0xe560b0 = _0x42c708.normal.x * this.max.x), (_0x1cff74 = _0x42c708.normal.x * this.min.x)),
      _0x42c708.normal.y > 0
        ? ((_0xe560b0 += _0x42c708.normal.y * this.min.y), (_0x1cff74 += _0x42c708.normal.y * this.max.y))
        : ((_0xe560b0 += _0x42c708.normal.y * this.max.y), (_0x1cff74 += _0x42c708.normal.y * this.min.y)),
      _0x42c708.normal.z > 0
        ? ((_0xe560b0 += _0x42c708.normal.z * this.min.z), (_0x1cff74 += _0x42c708.normal.z * this.max.z))
        : ((_0xe560b0 += _0x42c708.normal.z * this.max.z), (_0x1cff74 += _0x42c708.normal.z * this.min.z)),
      _0xe560b0 <= -_0x42c708.constant && _0x1cff74 >= -_0x42c708.constant
    );
  }
  ['intersectsTriangle'](_0x972f9e) {
    if (this.isEmpty()) return false;
    (this.getCenter(_center),
      _extents.subVectors(this.max, _center),
      _v0$2.subVectors(_0x972f9e.a, _center),
      _v1$7.subVectors(_0x972f9e.b, _center),
      _v2$4.subVectors(_0x972f9e.c, _center),
      _f0.subVectors(_v1$7, _v0$2),
      _f1.subVectors(_v2$4, _v1$7),
      _f2.subVectors(_v0$2, _v2$4));
    let _0x446334 = [
      0,
      -_f0.z,
      _f0.y,
      0,
      -_f1.z,
      _f1.y,
      0,
      -_f2.z,
      _f2.y,
      _f0.z,
      0,
      -_f0.x,
      _f1.z,
      0,
      -_f1.x,
      _f2.z,
      0,
      -_f2.x,
      -_f0.y,
      _f0.x,
      0,
      -_f1.y,
      _f1.x,
      0,
      -_f2.y,
      _f2.x,
      0,
    ];
    if (!satForAxes(_0x446334, _v0$2, _v1$7, _v2$4, _extents)) return false;
    _0x446334 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    if (!satForAxes(_0x446334, _v0$2, _v1$7, _v2$4, _extents)) return false;
    return (
      _triangleNormal.crossVectors(_f0, _f1),
      (_0x446334 = [_triangleNormal.x, _triangleNormal.y, _triangleNormal.z]),
      satForAxes(_0x446334, _v0$2, _v1$7, _v2$4, _extents)
    );
  }
  ['clampPoint'](_0x14ad47, _0x54572b) {
    return _0x54572b.copy(_0x14ad47).clamp(this.min, this.max);
  }
  ['distanceToPoint'](_0x24a51a) {
    return this.clampPoint(_0x24a51a, _vector$b).distanceTo(_0x24a51a);
  }
  ['getBoundingSphere'](_0x508f76) {
    return (
      this.isEmpty()
        ? _0x508f76.makeEmpty()
        : (this.getCenter(_0x508f76.center), (_0x508f76.radius = this.getSize(_vector$b).length() * 0.5)),
      _0x508f76
    );
  }
  ['intersect'](_0x28c9f4) {
    (this.min.max(_0x28c9f4.min), this.max.min(_0x28c9f4.max));
    if (this.isEmpty()) this.makeEmpty();
    return this;
  }
  ['union'](_0x25eac5) {
    return (this.min.min(_0x25eac5.min), this.max.max(_0x25eac5.max), this);
  }
  ['applyMatrix4'](_0x543fa5) {
    if (this.isEmpty()) return this;
    return (
      _points[0].set(this.min.x, this.min.y, this.min.z).applyMatrix4(_0x543fa5),
      _points[1].set(this.min.x, this.min.y, this.max.z).applyMatrix4(_0x543fa5),
      _points[2].set(this.min.x, this.max.y, this.min.z).applyMatrix4(_0x543fa5),
      _points[3].set(this.min.x, this.max.y, this.max.z).applyMatrix4(_0x543fa5),
      _points[4].set(this.max.x, this.min.y, this.min.z).applyMatrix4(_0x543fa5),
      _points[5].set(this.max.x, this.min.y, this.max.z).applyMatrix4(_0x543fa5),
      _points[6].set(this.max.x, this.max.y, this.min.z).applyMatrix4(_0x543fa5),
      _points[7].set(this.max.x, this.max.y, this.max.z).applyMatrix4(_0x543fa5),
      this.setFromPoints(_points),
      this
    );
  }
  ['translate'](_0x5bdc37) {
    return (this.min.add(_0x5bdc37), this.max.add(_0x5bdc37), this);
  }
  ['equals'](_0x2e27b7) {
    return _0x2e27b7.min.equals(this.min) && _0x2e27b7.max.equals(this.max);
  }
  ['toJSON']() {
    return { min: this.min.toArray(), max: this.max.toArray() };
  }
  ['fromJSON'](_0x2af944) {
    return (this.min.fromArray(_0x2af944.min), this.max.fromArray(_0x2af944.max), this);
  }
}
const _points = [
    new Vector3(),
    new Vector3(),
    new Vector3(),
    new Vector3(),
    new Vector3(),
    new Vector3(),
    new Vector3(),
    new Vector3(),
  ],
  _vector$b = new Vector3(),
  _box$4 = new Box3(),
  _v0$2 = new Vector3(),
  _v1$7 = new Vector3(),
  _v2$4 = new Vector3(),
  _f0 = new Vector3(),
  _f1 = new Vector3(),
  _f2 = new Vector3(),
  _center = new Vector3(),
  _extents = new Vector3(),
  _triangleNormal = new Vector3(),
  _testAxis = new Vector3();
function satForAxes(_0x451b41, _0x29fd06, _0x37009d, _0x2f44b9, _0x374b57) {
  for (let _0x4a678b = 0, _0x1fe932 = _0x451b41.length - 3; _0x4a678b <= _0x1fe932; _0x4a678b += 3) {
    _testAxis.fromArray(_0x451b41, _0x4a678b);
    const _0x50646f =
        _0x374b57.x * Math.abs(_testAxis.x) +
        _0x374b57.y * Math.abs(_testAxis.y) +
        _0x374b57.z * Math.abs(_testAxis.z),
      _0x55fb2e = _0x29fd06.dot(_testAxis),
      _0xd2d8f6 = _0x37009d.dot(_testAxis),
      _0x25812f = _0x2f44b9.dot(_testAxis);
    if (
      Math.max(-Math.max(_0x55fb2e, _0xd2d8f6, _0x25812f), Math.min(_0x55fb2e, _0xd2d8f6, _0x25812f)) >
      _0x50646f
    )
      return false;
  }
  return true;
}
const _box$3 = new Box3(),
  _v1$6 = new Vector3(),
  _v2$3 = new Vector3();
class Sphere {
  constructor(_0xf6cb85 = new Vector3(), _0x4b220d = -1) {
    ((this.isSphere = true), (this.center = _0xf6cb85), (this.radius = _0x4b220d));
  }
  ['set'](_0x3abfb2, _0x3e980) {
    return (this.center.copy(_0x3abfb2), (this.radius = _0x3e980), this);
  }
  ['setFromPoints'](_0x8bbdf, _0x4bcd53) {
    const _0x552a91 = this.center;
    _0x4bcd53 !== undefined ? _0x552a91.copy(_0x4bcd53) : _box$3.setFromPoints(_0x8bbdf).getCenter(_0x552a91);
    let _0x4e3eff = 0;
    for (let _0x3e0ec3 = 0, _0x37f5f8 = _0x8bbdf.length; _0x3e0ec3 < _0x37f5f8; _0x3e0ec3++) {
      _0x4e3eff = Math.max(_0x4e3eff, _0x552a91.distanceToSquared(_0x8bbdf[_0x3e0ec3]));
    }
    return ((this.radius = Math.sqrt(_0x4e3eff)), this);
  }
  ['copy'](_0x17e6f8) {
    return (this.center.copy(_0x17e6f8.center), (this.radius = _0x17e6f8.radius), this);
  }
  ['isEmpty']() {
    return this.radius < 0;
  }
  ['makeEmpty']() {
    return (this.center.set(0, 0, 0), (this.radius = -1), this);
  }
  ['containsPoint'](_0x26374a) {
    return _0x26374a.distanceToSquared(this.center) <= this.radius * this.radius;
  }
  ['distanceToPoint'](_0x2ecac4) {
    return _0x2ecac4.distanceTo(this.center) - this.radius;
  }
  ['intersectsSphere'](_0x106f40) {
    const _0x2421f9 = this.radius + _0x106f40.radius;
    return _0x106f40.center.distanceToSquared(this.center) <= _0x2421f9 * _0x2421f9;
  }
  ['intersectsBox'](_0x5ab69c) {
    return _0x5ab69c.intersectsSphere(this);
  }
  ['intersectsPlane'](_0x2a03f2) {
    return Math.abs(_0x2a03f2.distanceToPoint(this.center)) <= this.radius;
  }
  ['clampPoint'](_0xe283fd, _0x18760b) {
    const _0x301257 = this.center.distanceToSquared(_0xe283fd);
    return (
      _0x18760b.copy(_0xe283fd),
      _0x301257 > this.radius * this.radius &&
        (_0x18760b.sub(this.center).normalize(), _0x18760b.multiplyScalar(this.radius).add(this.center)),
      _0x18760b
    );
  }
  ['getBoundingBox'](_0x11c989) {
    if (this.isEmpty()) return (_0x11c989.makeEmpty(), _0x11c989);
    return (_0x11c989.set(this.center, this.center), _0x11c989.expandByScalar(this.radius), _0x11c989);
  }
  ['applyMatrix4'](_0x513cf1) {
    return (
      this.center.applyMatrix4(_0x513cf1),
      (this.radius = this.radius * _0x513cf1.getMaxScaleOnAxis()),
      this
    );
  }
  ['translate'](_0x21e689) {
    return (this.center.add(_0x21e689), this);
  }
  ['expandByPoint'](_0x4a0581) {
    if (this.isEmpty()) return (this.center.copy(_0x4a0581), (this.radius = 0), this);
    _v1$6.subVectors(_0x4a0581, this.center);
    const _0x260b1e = _v1$6.lengthSq();
    if (_0x260b1e > this.radius * this.radius) {
      const _0x651061 = Math.sqrt(_0x260b1e),
        _0x427e0d = (_0x651061 - this.radius) * 0.5;
      (this.center.addScaledVector(_v1$6, _0x427e0d / _0x651061), (this.radius += _0x427e0d));
    }
    return this;
  }
  ['union'](_0x43669e) {
    if (_0x43669e.isEmpty()) return this;
    if (this.isEmpty()) return (this.copy(_0x43669e), this);
    return (
      this.center.equals(_0x43669e.center) === true
        ? (this.radius = Math.max(this.radius, _0x43669e.radius))
        : (_v2$3.subVectors(_0x43669e.center, this.center).setLength(_0x43669e.radius),
          this.expandByPoint(_v1$6.copy(_0x43669e.center).add(_v2$3)),
          this.expandByPoint(_v1$6.copy(_0x43669e.center).sub(_v2$3))),
      this
    );
  }
  ['equals'](_0x50044b) {
    return _0x50044b.center.equals(this.center) && _0x50044b.radius === this.radius;
  }
  ['clone']() {
    return new this.constructor().copy(this);
  }
  ['toJSON']() {
    return { radius: this.radius, center: this.center.toArray() };
  }
  ['fromJSON'](_0x4da302) {
    return ((this.radius = _0x4da302.radius), this.center.fromArray(_0x4da302.center), this);
  }
}
const _vector$a = new Vector3(),
  _segCenter = new Vector3(),
  _segDir = new Vector3(),
  _diff = new Vector3(),
  _edge1 = new Vector3(),
  _edge2 = new Vector3(),
  _normal$1 = new Vector3();
class Ray {
  constructor(_0x40dc56 = new Vector3(), _0x503634 = new Vector3(0, 0, -1)) {
    ((this.origin = _0x40dc56), (this.direction = _0x503634));
  }
  ['set'](_0x5d7e50, _0x10cdec) {
    return (this.origin.copy(_0x5d7e50), this.direction.copy(_0x10cdec), this);
  }
  ['copy'](_0x5d76b7) {
    return (this.origin.copy(_0x5d76b7.origin), this.direction.copy(_0x5d76b7.direction), this);
  }
  ['at'](_0x1ccadc, _0x41ba4f) {
    return _0x41ba4f.copy(this.origin).addScaledVector(this.direction, _0x1ccadc);
  }
  ['lookAt'](_0xe7a616) {
    return (this.direction.copy(_0xe7a616).sub(this.origin).normalize(), this);
  }
  ['recast'](_0xcbca45) {
    return (this.origin.copy(this.at(_0xcbca45, _vector$a)), this);
  }
  ['closestPointToPoint'](_0x1d9b8b, _0x275351) {
    _0x275351.subVectors(_0x1d9b8b, this.origin);
    const _0x3dad9b = _0x275351.dot(this.direction);
    if (_0x3dad9b < 0) return _0x275351.copy(this.origin);
    return _0x275351.copy(this.origin).addScaledVector(this.direction, _0x3dad9b);
  }
  ['distanceToPoint'](_0x2af3a6) {
    return Math.sqrt(this.distanceSqToPoint(_0x2af3a6));
  }
  ['distanceSqToPoint'](_0x3a51b6) {
    const _0x3d4822 = _vector$a.subVectors(_0x3a51b6, this.origin).dot(this.direction);
    if (_0x3d4822 < 0) return this.origin.distanceToSquared(_0x3a51b6);
    return (
      _vector$a.copy(this.origin).addScaledVector(this.direction, _0x3d4822),
      _vector$a.distanceToSquared(_0x3a51b6)
    );
  }
  ['distanceSqToSegment'](_0x1ed5c0, _0x2e3f88, _0x493ecd, _0x49ff02) {
    (_segCenter.copy(_0x1ed5c0).add(_0x2e3f88).multiplyScalar(0.5),
      _segDir.copy(_0x2e3f88).sub(_0x1ed5c0).normalize(),
      _diff.copy(this.origin).sub(_segCenter));
    const _0x332361 = _0x1ed5c0.distanceTo(_0x2e3f88) * 0.5,
      _0x2bf6e2 = -this.direction.dot(_segDir),
      _0x3dff50 = _diff.dot(this.direction),
      _0x300d25 = -_diff.dot(_segDir),
      _0x116066 = _diff.lengthSq(),
      _0x3a78ed = Math.abs(1 - _0x2bf6e2 * _0x2bf6e2);
    let _0x3d4596, _0x2caccb, _0xdceeb0, _0x6e839c;
    if (_0x3a78ed > 0) {
      ((_0x3d4596 = _0x2bf6e2 * _0x300d25 - _0x3dff50),
        (_0x2caccb = _0x2bf6e2 * _0x3dff50 - _0x300d25),
        (_0x6e839c = _0x332361 * _0x3a78ed));
      if (_0x3d4596 >= 0) {
        if (_0x2caccb >= -_0x6e839c) {
          if (_0x2caccb <= _0x6e839c) {
            const _0xf54758 = 1 / _0x3a78ed;
            ((_0x3d4596 *= _0xf54758),
              (_0x2caccb *= _0xf54758),
              (_0xdceeb0 =
                _0x3d4596 * (_0x3d4596 + _0x2bf6e2 * _0x2caccb + 2 * _0x3dff50) +
                _0x2caccb * (_0x2bf6e2 * _0x3d4596 + _0x2caccb + 2 * _0x300d25) +
                _0x116066));
          } else
            ((_0x2caccb = _0x332361),
              (_0x3d4596 = Math.max(0, -(_0x2bf6e2 * _0x2caccb + _0x3dff50))),
              (_0xdceeb0 = -_0x3d4596 * _0x3d4596 + _0x2caccb * (_0x2caccb + 2 * _0x300d25) + _0x116066));
        } else
          ((_0x2caccb = -_0x332361),
            (_0x3d4596 = Math.max(0, -(_0x2bf6e2 * _0x2caccb + _0x3dff50))),
            (_0xdceeb0 = -_0x3d4596 * _0x3d4596 + _0x2caccb * (_0x2caccb + 2 * _0x300d25) + _0x116066));
      } else {
        if (_0x2caccb <= -_0x6e839c)
          ((_0x3d4596 = Math.max(0, -(-_0x2bf6e2 * _0x332361 + _0x3dff50))),
            (_0x2caccb = _0x3d4596 > 0 ? -_0x332361 : Math.min(Math.max(-_0x332361, -_0x300d25), _0x332361)),
            (_0xdceeb0 = -_0x3d4596 * _0x3d4596 + _0x2caccb * (_0x2caccb + 2 * _0x300d25) + _0x116066));
        else
          _0x2caccb <= _0x6e839c
            ? ((_0x3d4596 = 0),
              (_0x2caccb = Math.min(Math.max(-_0x332361, -_0x300d25), _0x332361)),
              (_0xdceeb0 = _0x2caccb * (_0x2caccb + 2 * _0x300d25) + _0x116066))
            : ((_0x3d4596 = Math.max(0, -(_0x2bf6e2 * _0x332361 + _0x3dff50))),
              (_0x2caccb = _0x3d4596 > 0 ? _0x332361 : Math.min(Math.max(-_0x332361, -_0x300d25), _0x332361)),
              (_0xdceeb0 = -_0x3d4596 * _0x3d4596 + _0x2caccb * (_0x2caccb + 2 * _0x300d25) + _0x116066));
      }
    } else
      ((_0x2caccb = _0x2bf6e2 > 0 ? -_0x332361 : _0x332361),
        (_0x3d4596 = Math.max(0, -(_0x2bf6e2 * _0x2caccb + _0x3dff50))),
        (_0xdceeb0 = -_0x3d4596 * _0x3d4596 + _0x2caccb * (_0x2caccb + 2 * _0x300d25) + _0x116066));
    return (
      _0x493ecd && _0x493ecd.copy(this.origin).addScaledVector(this.direction, _0x3d4596),
      _0x49ff02 && _0x49ff02.copy(_segCenter).addScaledVector(_segDir, _0x2caccb),
      _0xdceeb0
    );
  }
  ['intersectSphere'](_0x38c550, _0x2ad939) {
    _vector$a.subVectors(_0x38c550.center, this.origin);
    const _0x32f9c7 = _vector$a.dot(this.direction),
      _0x26494d = _vector$a.dot(_vector$a) - _0x32f9c7 * _0x32f9c7,
      _0x1ee9ae = _0x38c550.radius * _0x38c550.radius;
    if (_0x26494d > _0x1ee9ae) return null;
    const _0x2f514a = Math.sqrt(_0x1ee9ae - _0x26494d),
      _0x268eaa = _0x32f9c7 - _0x2f514a,
      _0x26e823 = _0x32f9c7 + _0x2f514a;
    if (_0x26e823 < 0) return null;
    if (_0x268eaa < 0) return this.at(_0x26e823, _0x2ad939);
    return this.at(_0x268eaa, _0x2ad939);
  }
  ['intersectsSphere'](_0x348f43) {
    if (_0x348f43.radius < 0) return false;
    return this.distanceSqToPoint(_0x348f43.center) <= _0x348f43.radius * _0x348f43.radius;
  }
  ['distanceToPlane'](_0x5ad6d1) {
    const _0xad0b83 = _0x5ad6d1.normal.dot(this.direction);
    if (_0xad0b83 === 0) {
      if (_0x5ad6d1.distanceToPoint(this.origin) === 0) return 0;
      return null;
    }
    const _0xd23ed9 = -(this.origin.dot(_0x5ad6d1.normal) + _0x5ad6d1.constant) / _0xad0b83;
    return _0xd23ed9 >= 0 ? _0xd23ed9 : null;
  }
  ['intersectPlane'](_0x48b22b, _0xe311b0) {
    const _0x2a5b47 = this.distanceToPlane(_0x48b22b);
    if (_0x2a5b47 === null) return null;
    return this.at(_0x2a5b47, _0xe311b0);
  }
  ['intersectsPlane'](_0x19cd15) {
    const _0x512778 = _0x19cd15.distanceToPoint(this.origin);
    if (_0x512778 === 0) return true;
    const _0x1f95cc = _0x19cd15.normal.dot(this.direction);
    if (_0x1f95cc * _0x512778 < 0) return true;
    return false;
  }
  ['intersectBox'](_0xbfd00d, _0x49b572) {
    let _0x392736, _0x5d5830, _0x4ac52d, _0x4103d5, _0x4e474f, _0x418bdf;
    const _0x2cd57c = 1 / this.direction.x,
      _0x10e70c = 1 / this.direction.y,
      _0x37a090 = 1 / this.direction.z,
      _0x2a70dc = this.origin;
    _0x2cd57c >= 0
      ? ((_0x392736 = (_0xbfd00d.min.x - _0x2a70dc.x) * _0x2cd57c),
        (_0x5d5830 = (_0xbfd00d.max.x - _0x2a70dc.x) * _0x2cd57c))
      : ((_0x392736 = (_0xbfd00d.max.x - _0x2a70dc.x) * _0x2cd57c),
        (_0x5d5830 = (_0xbfd00d.min.x - _0x2a70dc.x) * _0x2cd57c));
    _0x10e70c >= 0
      ? ((_0x4ac52d = (_0xbfd00d.min.y - _0x2a70dc.y) * _0x10e70c),
        (_0x4103d5 = (_0xbfd00d.max.y - _0x2a70dc.y) * _0x10e70c))
      : ((_0x4ac52d = (_0xbfd00d.max.y - _0x2a70dc.y) * _0x10e70c),
        (_0x4103d5 = (_0xbfd00d.min.y - _0x2a70dc.y) * _0x10e70c));
    if (_0x392736 > _0x4103d5 || _0x4ac52d > _0x5d5830) return null;
    if (_0x4ac52d > _0x392736 || isNaN(_0x392736)) _0x392736 = _0x4ac52d;
    if (_0x4103d5 < _0x5d5830 || isNaN(_0x5d5830)) _0x5d5830 = _0x4103d5;
    _0x37a090 >= 0
      ? ((_0x4e474f = (_0xbfd00d.min.z - _0x2a70dc.z) * _0x37a090),
        (_0x418bdf = (_0xbfd00d.max.z - _0x2a70dc.z) * _0x37a090))
      : ((_0x4e474f = (_0xbfd00d.max.z - _0x2a70dc.z) * _0x37a090),
        (_0x418bdf = (_0xbfd00d.min.z - _0x2a70dc.z) * _0x37a090));
    if (_0x392736 > _0x418bdf || _0x4e474f > _0x5d5830) return null;
    if (_0x4e474f > _0x392736 || _0x392736 !== _0x392736) _0x392736 = _0x4e474f;
    if (_0x418bdf < _0x5d5830 || _0x5d5830 !== _0x5d5830) _0x5d5830 = _0x418bdf;
    if (_0x5d5830 < 0) return null;
    return this.at(_0x392736 >= 0 ? _0x392736 : _0x5d5830, _0x49b572);
  }
  ['intersectsBox'](_0x27fd2a) {
    return this.intersectBox(_0x27fd2a, _vector$a) !== null;
  }
  ['intersectTriangle'](_0x13482c, _0x46f436, _0xedf9c9, _0x16c40e, _0x216a59) {
    (_edge1.subVectors(_0x46f436, _0x13482c),
      _edge2.subVectors(_0xedf9c9, _0x13482c),
      _normal$1.crossVectors(_edge1, _edge2));
    let _0x17f7a0 = this.direction.dot(_normal$1),
      _0x5269b1;
    if (_0x17f7a0 > 0) {
      if (_0x16c40e) return null;
      _0x5269b1 = 1;
    } else {
      if (_0x17f7a0 < 0) ((_0x5269b1 = -1), (_0x17f7a0 = -_0x17f7a0));
      else return null;
    }
    _diff.subVectors(this.origin, _0x13482c);
    const _0x3d2673 = _0x5269b1 * this.direction.dot(_edge2.crossVectors(_diff, _edge2));
    if (_0x3d2673 < 0) return null;
    const _0x3005a8 = _0x5269b1 * this.direction.dot(_edge1.cross(_diff));
    if (_0x3005a8 < 0) return null;
    if (_0x3d2673 + _0x3005a8 > _0x17f7a0) return null;
    const _0x4296cc = -_0x5269b1 * _diff.dot(_normal$1);
    if (_0x4296cc < 0) return null;
    return this.at(_0x4296cc / _0x17f7a0, _0x216a59);
  }
  ['applyMatrix4'](_0x58ffc4) {
    return (this.origin.applyMatrix4(_0x58ffc4), this.direction.transformDirection(_0x58ffc4), this);
  }
  ['equals'](_0xf04b22) {
    return _0xf04b22.origin.equals(this.origin) && _0xf04b22.direction.equals(this.direction);
  }
  ['clone']() {
    return new this['constructor']().copy(this);
  }
}
class Matrix4 {
  constructor(
    _0x484b0c,
    _0x1c5ce9,
    _0x206f54,
    _0x30247c,
    _0x414953,
    _0x47a38f,
    _0x285224,
    _0x431fc2,
    _0x578d42,
    _0x12e4cb,
    _0x4a3421,
    _0x29fd7c,
    _0x5a1d33,
    _0x53be64,
    _0x1bfac7,
    _0x520de6,
  ) {
    ((Matrix4.prototype.isMatrix4 = true),
      (this.elements = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
      _0x484b0c !== undefined &&
        this.set(
          _0x484b0c,
          _0x1c5ce9,
          _0x206f54,
          _0x30247c,
          _0x414953,
          _0x47a38f,
          _0x285224,
          _0x431fc2,
          _0x578d42,
          _0x12e4cb,
          _0x4a3421,
          _0x29fd7c,
          _0x5a1d33,
          _0x53be64,
          _0x1bfac7,
          _0x520de6,
        ));
  }
  ['set'](
    _0xb2d62d,
    _0x174b14,
    _0x4c9a2f,
    _0x4f6a70,
    _0x500799,
    _0x33f33d,
    _0x490512,
    _0x5d67f3,
    _0xb9771f,
    _0xc3ef10,
    _0x4110a8,
    _0x2ca6e0,
    _0x484460,
    _0x21c474,
    _0x561b7b,
    _0xec85aa,
  ) {
    const _0x226782 = this.elements;
    return (
      (_0x226782[0] = _0xb2d62d),
      (_0x226782[4] = _0x174b14),
      (_0x226782[8] = _0x4c9a2f),
      (_0x226782[12] = _0x4f6a70),
      (_0x226782[1] = _0x500799),
      (_0x226782[5] = _0x33f33d),
      (_0x226782[9] = _0x490512),
      (_0x226782[13] = _0x5d67f3),
      (_0x226782[2] = _0xb9771f),
      (_0x226782[6] = _0xc3ef10),
      (_0x226782[10] = _0x4110a8),
      (_0x226782[14] = _0x2ca6e0),
      (_0x226782[3] = _0x484460),
      (_0x226782[7] = _0x21c474),
      (_0x226782[11] = _0x561b7b),
      (_0x226782[15] = _0xec85aa),
      this
    );
  }
  ['identity']() {
    return (this.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1), this);
  }
  ['clone']() {
    return new Matrix4().fromArray(this.elements);
  }
  ['copy'](_0xe1cf6b) {
    const _0x418689 = this.elements,
      _0x3468e5 = _0xe1cf6b.elements;
    return (
      (_0x418689[0] = _0x3468e5[0]),
      (_0x418689[1] = _0x3468e5[1]),
      (_0x418689[2] = _0x3468e5[2]),
      (_0x418689[3] = _0x3468e5[3]),
      (_0x418689[4] = _0x3468e5[4]),
      (_0x418689[5] = _0x3468e5[5]),
      (_0x418689[6] = _0x3468e5[6]),
      (_0x418689[7] = _0x3468e5[7]),
      (_0x418689[8] = _0x3468e5[8]),
      (_0x418689[9] = _0x3468e5[9]),
      (_0x418689[10] = _0x3468e5[10]),
      (_0x418689[11] = _0x3468e5[11]),
      (_0x418689[12] = _0x3468e5[12]),
      (_0x418689[13] = _0x3468e5[13]),
      (_0x418689[14] = _0x3468e5[14]),
      (_0x418689[15] = _0x3468e5[15]),
      this
    );
  }
  ['copyPosition'](_0x359aa1) {
    const _0x85336e = this.elements,
      _0x1ac88b = _0x359aa1.elements;
    return (
      (_0x85336e[12] = _0x1ac88b[12]),
      (_0x85336e[13] = _0x1ac88b[13]),
      (_0x85336e[14] = _0x1ac88b[14]),
      this
    );
  }
  ['setFromMatrix3'](_0x2224a5) {
    const _0x286093 = _0x2224a5.elements;
    return (
      this.set(
        _0x286093[0],
        _0x286093[3],
        _0x286093[6],
        0,
        _0x286093[1],
        _0x286093[4],
        _0x286093[7],
        0,
        _0x286093[2],
        _0x286093[5],
        _0x286093[8],
        0,
        0,
        0,
        0,
        1,
      ),
      this
    );
  }
  ['extractBasis'](_0x28a8ec, _0xd7ebdc, _0xaf5ad) {
    return (
      _0x28a8ec.setFromMatrixColumn(this, 0),
      _0xd7ebdc.setFromMatrixColumn(this, 1),
      _0xaf5ad.setFromMatrixColumn(this, 2),
      this
    );
  }
  ['makeBasis'](_0x570f7c, _0x5c2986, _0x334691) {
    return (
      this.set(
        _0x570f7c.x,
        _0x5c2986.x,
        _0x334691.x,
        0,
        _0x570f7c.y,
        _0x5c2986.y,
        _0x334691.y,
        0,
        _0x570f7c.z,
        _0x5c2986.z,
        _0x334691.z,
        0,
        0,
        0,
        0,
        1,
      ),
      this
    );
  }
  ['extractRotation'](_0x5e4082) {
    const _0x37b95e = this.elements,
      _0x90ddad = _0x5e4082.elements,
      _0x4ecc7f = 1 / _v1$5.setFromMatrixColumn(_0x5e4082, 0).length(),
      _0x38a58b = 1 / _v1$5.setFromMatrixColumn(_0x5e4082, 1).length(),
      _0x4bf0ce = 1 / _v1$5.setFromMatrixColumn(_0x5e4082, 2).length();
    return (
      (_0x37b95e[0] = _0x90ddad[0] * _0x4ecc7f),
      (_0x37b95e[1] = _0x90ddad[1] * _0x4ecc7f),
      (_0x37b95e[2] = _0x90ddad[2] * _0x4ecc7f),
      (_0x37b95e[3] = 0),
      (_0x37b95e[4] = _0x90ddad[4] * _0x38a58b),
      (_0x37b95e[5] = _0x90ddad[5] * _0x38a58b),
      (_0x37b95e[6] = _0x90ddad[6] * _0x38a58b),
      (_0x37b95e[7] = 0),
      (_0x37b95e[8] = _0x90ddad[8] * _0x4bf0ce),
      (_0x37b95e[9] = _0x90ddad[9] * _0x4bf0ce),
      (_0x37b95e[10] = _0x90ddad[10] * _0x4bf0ce),
      (_0x37b95e[11] = 0),
      (_0x37b95e[12] = 0),
      (_0x37b95e[13] = 0),
      (_0x37b95e[14] = 0),
      (_0x37b95e[15] = 1),
      this
    );
  }
  ['makeRotationFromEuler'](_0x5af774) {
    const _0x21fb53 = this.elements,
      _0x5a0989 = _0x5af774.x,
      _0x11fdf4 = _0x5af774.y,
      _0x461aaa = _0x5af774.z,
      _0x1ccd28 = Math.cos(_0x5a0989),
      _0x2df529 = Math.sin(_0x5a0989),
      _0x3d8f51 = Math.cos(_0x11fdf4),
      _0x4281ed = Math.sin(_0x11fdf4),
      _0x3aa338 = Math.cos(_0x461aaa),
      _0x7054b7 = Math.sin(_0x461aaa);
    if (_0x5af774.order === 'XYZ') {
      const _0x249097 = _0x1ccd28 * _0x3aa338,
        _0x299f21 = _0x1ccd28 * _0x7054b7,
        _0x522865 = _0x2df529 * _0x3aa338,
        _0x339b2c = _0x2df529 * _0x7054b7;
      ((_0x21fb53[0] = _0x3d8f51 * _0x3aa338),
        (_0x21fb53[4] = -_0x3d8f51 * _0x7054b7),
        (_0x21fb53[8] = _0x4281ed),
        (_0x21fb53[1] = _0x299f21 + _0x522865 * _0x4281ed),
        (_0x21fb53[5] = _0x249097 - _0x339b2c * _0x4281ed),
        (_0x21fb53[9] = -_0x2df529 * _0x3d8f51),
        (_0x21fb53[2] = _0x339b2c - _0x249097 * _0x4281ed),
        (_0x21fb53[6] = _0x522865 + _0x299f21 * _0x4281ed),
        (_0x21fb53[10] = _0x1ccd28 * _0x3d8f51));
    } else {
      if (_0x5af774.order === 'YXZ') {
        const _0x77d957 = _0x3d8f51 * _0x3aa338,
          _0x240f5d = _0x3d8f51 * _0x7054b7,
          _0x281840 = _0x4281ed * _0x3aa338,
          _0x36533c = _0x4281ed * _0x7054b7;
        ((_0x21fb53[0] = _0x77d957 + _0x36533c * _0x2df529),
          (_0x21fb53[4] = _0x281840 * _0x2df529 - _0x240f5d),
          (_0x21fb53[8] = _0x1ccd28 * _0x4281ed),
          (_0x21fb53[1] = _0x1ccd28 * _0x7054b7),
          (_0x21fb53[5] = _0x1ccd28 * _0x3aa338),
          (_0x21fb53[9] = -_0x2df529),
          (_0x21fb53[2] = _0x240f5d * _0x2df529 - _0x281840),
          (_0x21fb53[6] = _0x36533c + _0x77d957 * _0x2df529),
          (_0x21fb53[10] = _0x1ccd28 * _0x3d8f51));
      } else {
        if (_0x5af774.order === 'ZXY') {
          const _0x1f46e3 = _0x3d8f51 * _0x3aa338,
            _0x241fbf = _0x3d8f51 * _0x7054b7,
            _0x4f565f = _0x4281ed * _0x3aa338,
            _0x2dab1e = _0x4281ed * _0x7054b7;
          ((_0x21fb53[0] = _0x1f46e3 - _0x2dab1e * _0x2df529),
            (_0x21fb53[4] = -_0x1ccd28 * _0x7054b7),
            (_0x21fb53[8] = _0x4f565f + _0x241fbf * _0x2df529),
            (_0x21fb53[1] = _0x241fbf + _0x4f565f * _0x2df529),
            (_0x21fb53[5] = _0x1ccd28 * _0x3aa338),
            (_0x21fb53[9] = _0x2dab1e - _0x1f46e3 * _0x2df529),
            (_0x21fb53[2] = -_0x1ccd28 * _0x4281ed),
            (_0x21fb53[6] = _0x2df529),
            (_0x21fb53[10] = _0x1ccd28 * _0x3d8f51));
        } else {
          if (_0x5af774.order === 'ZYX') {
            const _0x1cdd62 = _0x1ccd28 * _0x3aa338,
              _0x442a95 = _0x1ccd28 * _0x7054b7,
              _0x9907e3 = _0x2df529 * _0x3aa338,
              _0x92141d = _0x2df529 * _0x7054b7;
            ((_0x21fb53[0] = _0x3d8f51 * _0x3aa338),
              (_0x21fb53[4] = _0x9907e3 * _0x4281ed - _0x442a95),
              (_0x21fb53[8] = _0x1cdd62 * _0x4281ed + _0x92141d),
              (_0x21fb53[1] = _0x3d8f51 * _0x7054b7),
              (_0x21fb53[5] = _0x92141d * _0x4281ed + _0x1cdd62),
              (_0x21fb53[9] = _0x442a95 * _0x4281ed - _0x9907e3),
              (_0x21fb53[2] = -_0x4281ed),
              (_0x21fb53[6] = _0x2df529 * _0x3d8f51),
              (_0x21fb53[10] = _0x1ccd28 * _0x3d8f51));
          } else {
            if (_0x5af774.order === 'YZX') {
              const _0x3ce2a6 = _0x1ccd28 * _0x3d8f51,
                _0x182f01 = _0x1ccd28 * _0x4281ed,
                _0x40023a = _0x2df529 * _0x3d8f51,
                _0x59b5da = _0x2df529 * _0x4281ed;
              ((_0x21fb53[0] = _0x3d8f51 * _0x3aa338),
                (_0x21fb53[4] = _0x59b5da - _0x3ce2a6 * _0x7054b7),
                (_0x21fb53[8] = _0x40023a * _0x7054b7 + _0x182f01),
                (_0x21fb53[1] = _0x7054b7),
                (_0x21fb53[5] = _0x1ccd28 * _0x3aa338),
                (_0x21fb53[9] = -_0x2df529 * _0x3aa338),
                (_0x21fb53[2] = -_0x4281ed * _0x3aa338),
                (_0x21fb53[6] = _0x182f01 * _0x7054b7 + _0x40023a),
                (_0x21fb53[10] = _0x3ce2a6 - _0x59b5da * _0x7054b7));
            } else {
              if (_0x5af774.order === 'XZY') {
                const _0x51827b = _0x1ccd28 * _0x3d8f51,
                  _0x1224fa = _0x1ccd28 * _0x4281ed,
                  _0x37df6f = _0x2df529 * _0x3d8f51,
                  _0x33a183 = _0x2df529 * _0x4281ed;
                ((_0x21fb53[0] = _0x3d8f51 * _0x3aa338),
                  (_0x21fb53[4] = -_0x7054b7),
                  (_0x21fb53[8] = _0x4281ed * _0x3aa338),
                  (_0x21fb53[1] = _0x51827b * _0x7054b7 + _0x33a183),
                  (_0x21fb53[5] = _0x1ccd28 * _0x3aa338),
                  (_0x21fb53[9] = _0x1224fa * _0x7054b7 - _0x37df6f),
                  (_0x21fb53[2] = _0x37df6f * _0x7054b7 - _0x1224fa),
                  (_0x21fb53[6] = _0x2df529 * _0x3aa338),
                  (_0x21fb53[10] = _0x33a183 * _0x7054b7 + _0x51827b));
              }
            }
          }
        }
      }
    }
    return (
      (_0x21fb53[3] = 0),
      (_0x21fb53[7] = 0),
      (_0x21fb53[11] = 0),
      (_0x21fb53[12] = 0),
      (_0x21fb53[13] = 0),
      (_0x21fb53[14] = 0),
      (_0x21fb53[15] = 1),
      this
    );
  }
  ['makeRotationFromQuaternion'](_0x546bfb) {
    return this.compose(_zero, _0x546bfb, _one);
  }
  ['lookAt'](_0x47b1d9, _0x2a801b, _0xb6ea12) {
    const _0x2804db = this.elements;
    return (
      _z.subVectors(_0x47b1d9, _0x2a801b),
      _z.lengthSq() === 0 && (_z.z = 1),
      _z.normalize(),
      _x.crossVectors(_0xb6ea12, _z),
      _x.lengthSq() === 0 &&
        (Math.abs(_0xb6ea12.z) === 1 ? (_z.x += 0.0001) : (_z.z += 0.0001),
        _z.normalize(),
        _x.crossVectors(_0xb6ea12, _z)),
      _x.normalize(),
      _y.crossVectors(_z, _x),
      (_0x2804db[0] = _x.x),
      (_0x2804db[4] = _y.x),
      (_0x2804db[8] = _z.x),
      (_0x2804db[1] = _x.y),
      (_0x2804db[5] = _y.y),
      (_0x2804db[9] = _z.y),
      (_0x2804db[2] = _x.z),
      (_0x2804db[6] = _y.z),
      (_0x2804db[10] = _z.z),
      this
    );
  }
  ['multiply'](_0x5ee87a) {
    return this.multiplyMatrices(this, _0x5ee87a);
  }
  ['premultiply'](_0x4f0037) {
    return this.multiplyMatrices(_0x4f0037, this);
  }
  ['multiplyMatrices'](_0x1addd1, _0x221872) {
    const _0x468aab = _0x1addd1.elements,
      _0x233ae0 = _0x221872.elements,
      _0x4920ad = this.elements,
      _0x4027f3 = _0x468aab[0],
      _0x4a6bc6 = _0x468aab[4],
      _0x52961e = _0x468aab[8],
      _0x2291ca = _0x468aab[12],
      _0x100c4e = _0x468aab[1],
      _0x26aab9 = _0x468aab[5],
      _0x5b91b4 = _0x468aab[9],
      _0x52ccc3 = _0x468aab[13],
      _0x1bfce9 = _0x468aab[2],
      _0x17c073 = _0x468aab[6],
      _0x409eb0 = _0x468aab[10],
      _0x216593 = _0x468aab[14],
      _0x1da2b1 = _0x468aab[3],
      _0x49b745 = _0x468aab[7],
      _0xde6540 = _0x468aab[11],
      _0x94e3c0 = _0x468aab[15],
      _0x2dad25 = _0x233ae0[0],
      _0x507177 = _0x233ae0[4],
      _0x5b1809 = _0x233ae0[8],
      _0x29f81c = _0x233ae0[12],
      _0x219755 = _0x233ae0[1],
      _0x4204ba = _0x233ae0[5],
      _0x2c4d56 = _0x233ae0[9],
      _0x49e1a2 = _0x233ae0[13],
      _0x138cd9 = _0x233ae0[2],
      _0x4066dc = _0x233ae0[6],
      _0x8e02cd = _0x233ae0[10],
      _0x408cb9 = _0x233ae0[14],
      _0x57ddf2 = _0x233ae0[3],
      _0x4ac238 = _0x233ae0[7],
      _0x442b42 = _0x233ae0[11],
      _0x13ca30 = _0x233ae0[15];
    return (
      (_0x4920ad[0] =
        _0x4027f3 * _0x2dad25 + _0x4a6bc6 * _0x219755 + _0x52961e * _0x138cd9 + _0x2291ca * _0x57ddf2),
      (_0x4920ad[4] =
        _0x4027f3 * _0x507177 + _0x4a6bc6 * _0x4204ba + _0x52961e * _0x4066dc + _0x2291ca * _0x4ac238),
      (_0x4920ad[8] =
        _0x4027f3 * _0x5b1809 + _0x4a6bc6 * _0x2c4d56 + _0x52961e * _0x8e02cd + _0x2291ca * _0x442b42),
      (_0x4920ad[12] =
        _0x4027f3 * _0x29f81c + _0x4a6bc6 * _0x49e1a2 + _0x52961e * _0x408cb9 + _0x2291ca * _0x13ca30),
      (_0x4920ad[1] =
        _0x100c4e * _0x2dad25 + _0x26aab9 * _0x219755 + _0x5b91b4 * _0x138cd9 + _0x52ccc3 * _0x57ddf2),
      (_0x4920ad[5] =
        _0x100c4e * _0x507177 + _0x26aab9 * _0x4204ba + _0x5b91b4 * _0x4066dc + _0x52ccc3 * _0x4ac238),
      (_0x4920ad[9] =
        _0x100c4e * _0x5b1809 + _0x26aab9 * _0x2c4d56 + _0x5b91b4 * _0x8e02cd + _0x52ccc3 * _0x442b42),
      (_0x4920ad[13] =
        _0x100c4e * _0x29f81c + _0x26aab9 * _0x49e1a2 + _0x5b91b4 * _0x408cb9 + _0x52ccc3 * _0x13ca30),
      (_0x4920ad[2] =
        _0x1bfce9 * _0x2dad25 + _0x17c073 * _0x219755 + _0x409eb0 * _0x138cd9 + _0x216593 * _0x57ddf2),
      (_0x4920ad[6] =
        _0x1bfce9 * _0x507177 + _0x17c073 * _0x4204ba + _0x409eb0 * _0x4066dc + _0x216593 * _0x4ac238),
      (_0x4920ad[10] =
        _0x1bfce9 * _0x5b1809 + _0x17c073 * _0x2c4d56 + _0x409eb0 * _0x8e02cd + _0x216593 * _0x442b42),
      (_0x4920ad[14] =
        _0x1bfce9 * _0x29f81c + _0x17c073 * _0x49e1a2 + _0x409eb0 * _0x408cb9 + _0x216593 * _0x13ca30),
      (_0x4920ad[3] =
        _0x1da2b1 * _0x2dad25 + _0x49b745 * _0x219755 + _0xde6540 * _0x138cd9 + _0x94e3c0 * _0x57ddf2),
      (_0x4920ad[7] =
        _0x1da2b1 * _0x507177 + _0x49b745 * _0x4204ba + _0xde6540 * _0x4066dc + _0x94e3c0 * _0x4ac238),
      (_0x4920ad[11] =
        _0x1da2b1 * _0x5b1809 + _0x49b745 * _0x2c4d56 + _0xde6540 * _0x8e02cd + _0x94e3c0 * _0x442b42),
      (_0x4920ad[15] =
        _0x1da2b1 * _0x29f81c + _0x49b745 * _0x49e1a2 + _0xde6540 * _0x408cb9 + _0x94e3c0 * _0x13ca30),
      this
    );
  }
  ['multiplyScalar'](_0x4e666d) {
    const _0x76c048 = this.elements;
    return (
      (_0x76c048[0] *= _0x4e666d),
      (_0x76c048[4] *= _0x4e666d),
      (_0x76c048[8] *= _0x4e666d),
      (_0x76c048[12] *= _0x4e666d),
      (_0x76c048[1] *= _0x4e666d),
      (_0x76c048[5] *= _0x4e666d),
      (_0x76c048[9] *= _0x4e666d),
      (_0x76c048[13] *= _0x4e666d),
      (_0x76c048[2] *= _0x4e666d),
      (_0x76c048[6] *= _0x4e666d),
      (_0x76c048[10] *= _0x4e666d),
      (_0x76c048[14] *= _0x4e666d),
      (_0x76c048[3] *= _0x4e666d),
      (_0x76c048[7] *= _0x4e666d),
      (_0x76c048[11] *= _0x4e666d),
      (_0x76c048[15] *= _0x4e666d),
      this
    );
  }
  ['determinant']() {
    const _0x1697de = this.elements,
      _0x23e67b = _0x1697de[0],
      _0x38355f = _0x1697de[4],
      _0x425405 = _0x1697de[8],
      _0x3b93b0 = _0x1697de[12],
      _0x55b042 = _0x1697de[1],
      _0x43b8c6 = _0x1697de[5],
      _0x2ebe74 = _0x1697de[9],
      _0x5d307a = _0x1697de[13],
      _0x265e19 = _0x1697de[2],
      _0x5950f9 = _0x1697de[6],
      _0x30b0a0 = _0x1697de[10],
      _0x1ea059 = _0x1697de[14],
      _0x4d2ad9 = _0x1697de[3],
      _0x2d9f24 = _0x1697de[7],
      _0x64329e = _0x1697de[11],
      _0x3a4467 = _0x1697de[15];
    return (
      _0x4d2ad9 *
        (+_0x3b93b0 * _0x2ebe74 * _0x5950f9 -
          _0x425405 * _0x5d307a * _0x5950f9 -
          _0x3b93b0 * _0x43b8c6 * _0x30b0a0 +
          _0x38355f * _0x5d307a * _0x30b0a0 +
          _0x425405 * _0x43b8c6 * _0x1ea059 -
          _0x38355f * _0x2ebe74 * _0x1ea059) +
      _0x2d9f24 *
        (+_0x23e67b * _0x2ebe74 * _0x1ea059 -
          _0x23e67b * _0x5d307a * _0x30b0a0 +
          _0x3b93b0 * _0x55b042 * _0x30b0a0 -
          _0x425405 * _0x55b042 * _0x1ea059 +
          _0x425405 * _0x5d307a * _0x265e19 -
          _0x3b93b0 * _0x2ebe74 * _0x265e19) +
      _0x64329e *
        (+_0x23e67b * _0x5d307a * _0x5950f9 -
          _0x23e67b * _0x43b8c6 * _0x1ea059 -
          _0x3b93b0 * _0x55b042 * _0x5950f9 +
          _0x38355f * _0x55b042 * _0x1ea059 +
          _0x3b93b0 * _0x43b8c6 * _0x265e19 -
          _0x38355f * _0x5d307a * _0x265e19) +
      _0x3a4467 *
        (-_0x425405 * _0x43b8c6 * _0x265e19 -
          _0x23e67b * _0x2ebe74 * _0x5950f9 +
          _0x23e67b * _0x43b8c6 * _0x30b0a0 +
          _0x425405 * _0x55b042 * _0x5950f9 -
          _0x38355f * _0x55b042 * _0x30b0a0 +
          _0x38355f * _0x2ebe74 * _0x265e19)
    );
  }
  ['transpose']() {
    const _0x42a22a = this.elements;
    let _0x221a7a;
    return (
      (_0x221a7a = _0x42a22a[1]),
      (_0x42a22a[1] = _0x42a22a[4]),
      (_0x42a22a[4] = _0x221a7a),
      (_0x221a7a = _0x42a22a[2]),
      (_0x42a22a[2] = _0x42a22a[8]),
      (_0x42a22a[8] = _0x221a7a),
      (_0x221a7a = _0x42a22a[6]),
      (_0x42a22a[6] = _0x42a22a[9]),
      (_0x42a22a[9] = _0x221a7a),
      (_0x221a7a = _0x42a22a[3]),
      (_0x42a22a[3] = _0x42a22a[12]),
      (_0x42a22a[12] = _0x221a7a),
      (_0x221a7a = _0x42a22a[7]),
      (_0x42a22a[7] = _0x42a22a[13]),
      (_0x42a22a[13] = _0x221a7a),
      (_0x221a7a = _0x42a22a[11]),
      (_0x42a22a[11] = _0x42a22a[14]),
      (_0x42a22a[14] = _0x221a7a),
      this
    );
  }
  ['setPosition'](_0x4a1d11, _0x28a19b, _0x5f1f71) {
    const _0x50fe2b = this.elements;
    return (
      _0x4a1d11.isVector3
        ? ((_0x50fe2b[12] = _0x4a1d11.x), (_0x50fe2b[13] = _0x4a1d11.y), (_0x50fe2b[14] = _0x4a1d11.z))
        : ((_0x50fe2b[12] = _0x4a1d11), (_0x50fe2b[13] = _0x28a19b), (_0x50fe2b[14] = _0x5f1f71)),
      this
    );
  }
  ['invert']() {
    const _0x335d5c = this.elements,
      _0x167ac4 = _0x335d5c[0],
      _0x37871b = _0x335d5c[1],
      _0x3e5501 = _0x335d5c[2],
      _0x280408 = _0x335d5c[3],
      _0x558951 = _0x335d5c[4],
      _0x5cc942 = _0x335d5c[5],
      _0x57c1df = _0x335d5c[6],
      _0x58eca8 = _0x335d5c[7],
      _0x41a727 = _0x335d5c[8],
      _0x5302dc = _0x335d5c[9],
      _0x2c181b = _0x335d5c[10],
      _0x563c76 = _0x335d5c[11],
      _0x43e541 = _0x335d5c[12],
      _0x20238f = _0x335d5c[13],
      _0xb07b63 = _0x335d5c[14],
      _0x36817e = _0x335d5c[15],
      _0x536998 =
        _0x5302dc * _0xb07b63 * _0x58eca8 -
        _0x20238f * _0x2c181b * _0x58eca8 +
        _0x20238f * _0x57c1df * _0x563c76 -
        _0x5cc942 * _0xb07b63 * _0x563c76 -
        _0x5302dc * _0x57c1df * _0x36817e +
        _0x5cc942 * _0x2c181b * _0x36817e,
      _0x5249af =
        _0x43e541 * _0x2c181b * _0x58eca8 -
        _0x41a727 * _0xb07b63 * _0x58eca8 -
        _0x43e541 * _0x57c1df * _0x563c76 +
        _0x558951 * _0xb07b63 * _0x563c76 +
        _0x41a727 * _0x57c1df * _0x36817e -
        _0x558951 * _0x2c181b * _0x36817e,
      _0x34be75 =
        _0x41a727 * _0x20238f * _0x58eca8 -
        _0x43e541 * _0x5302dc * _0x58eca8 +
        _0x43e541 * _0x5cc942 * _0x563c76 -
        _0x558951 * _0x20238f * _0x563c76 -
        _0x41a727 * _0x5cc942 * _0x36817e +
        _0x558951 * _0x5302dc * _0x36817e,
      _0xe7c983 =
        _0x43e541 * _0x5302dc * _0x57c1df -
        _0x41a727 * _0x20238f * _0x57c1df -
        _0x43e541 * _0x5cc942 * _0x2c181b +
        _0x558951 * _0x20238f * _0x2c181b +
        _0x41a727 * _0x5cc942 * _0xb07b63 -
        _0x558951 * _0x5302dc * _0xb07b63,
      _0x5f3b02 =
        _0x167ac4 * _0x536998 + _0x37871b * _0x5249af + _0x3e5501 * _0x34be75 + _0x280408 * _0xe7c983;
    if (_0x5f3b02 === 0) return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    const _0x22ba3a = 1 / _0x5f3b02;
    return (
      (_0x335d5c[0] = _0x536998 * _0x22ba3a),
      (_0x335d5c[1] =
        (_0x20238f * _0x2c181b * _0x280408 -
          _0x5302dc * _0xb07b63 * _0x280408 -
          _0x20238f * _0x3e5501 * _0x563c76 +
          _0x37871b * _0xb07b63 * _0x563c76 +
          _0x5302dc * _0x3e5501 * _0x36817e -
          _0x37871b * _0x2c181b * _0x36817e) *
        _0x22ba3a),
      (_0x335d5c[2] =
        (_0x5cc942 * _0xb07b63 * _0x280408 -
          _0x20238f * _0x57c1df * _0x280408 +
          _0x20238f * _0x3e5501 * _0x58eca8 -
          _0x37871b * _0xb07b63 * _0x58eca8 -
          _0x5cc942 * _0x3e5501 * _0x36817e +
          _0x37871b * _0x57c1df * _0x36817e) *
        _0x22ba3a),
      (_0x335d5c[3] =
        (_0x5302dc * _0x57c1df * _0x280408 -
          _0x5cc942 * _0x2c181b * _0x280408 -
          _0x5302dc * _0x3e5501 * _0x58eca8 +
          _0x37871b * _0x2c181b * _0x58eca8 +
          _0x5cc942 * _0x3e5501 * _0x563c76 -
          _0x37871b * _0x57c1df * _0x563c76) *
        _0x22ba3a),
      (_0x335d5c[4] = _0x5249af * _0x22ba3a),
      (_0x335d5c[5] =
        (_0x41a727 * _0xb07b63 * _0x280408 -
          _0x43e541 * _0x2c181b * _0x280408 +
          _0x43e541 * _0x3e5501 * _0x563c76 -
          _0x167ac4 * _0xb07b63 * _0x563c76 -
          _0x41a727 * _0x3e5501 * _0x36817e +
          _0x167ac4 * _0x2c181b * _0x36817e) *
        _0x22ba3a),
      (_0x335d5c[6] =
        (_0x43e541 * _0x57c1df * _0x280408 -
          _0x558951 * _0xb07b63 * _0x280408 -
          _0x43e541 * _0x3e5501 * _0x58eca8 +
          _0x167ac4 * _0xb07b63 * _0x58eca8 +
          _0x558951 * _0x3e5501 * _0x36817e -
          _0x167ac4 * _0x57c1df * _0x36817e) *
        _0x22ba3a),
      (_0x335d5c[7] =
        (_0x558951 * _0x2c181b * _0x280408 -
          _0x41a727 * _0x57c1df * _0x280408 +
          _0x41a727 * _0x3e5501 * _0x58eca8 -
          _0x167ac4 * _0x2c181b * _0x58eca8 -
          _0x558951 * _0x3e5501 * _0x563c76 +
          _0x167ac4 * _0x57c1df * _0x563c76) *
        _0x22ba3a),
      (_0x335d5c[8] = _0x34be75 * _0x22ba3a),
      (_0x335d5c[9] =
        (_0x43e541 * _0x5302dc * _0x280408 -
          _0x41a727 * _0x20238f * _0x280408 -
          _0x43e541 * _0x37871b * _0x563c76 +
          _0x167ac4 * _0x20238f * _0x563c76 +
          _0x41a727 * _0x37871b * _0x36817e -
          _0x167ac4 * _0x5302dc * _0x36817e) *
        _0x22ba3a),
      (_0x335d5c[10] =
        (_0x558951 * _0x20238f * _0x280408 -
          _0x43e541 * _0x5cc942 * _0x280408 +
          _0x43e541 * _0x37871b * _0x58eca8 -
          _0x167ac4 * _0x20238f * _0x58eca8 -
          _0x558951 * _0x37871b * _0x36817e +
          _0x167ac4 * _0x5cc942 * _0x36817e) *
        _0x22ba3a),
      (_0x335d5c[11] =
        (_0x41a727 * _0x5cc942 * _0x280408 -
          _0x558951 * _0x5302dc * _0x280408 -
          _0x41a727 * _0x37871b * _0x58eca8 +
          _0x167ac4 * _0x5302dc * _0x58eca8 +
          _0x558951 * _0x37871b * _0x563c76 -
          _0x167ac4 * _0x5cc942 * _0x563c76) *
        _0x22ba3a),
      (_0x335d5c[12] = _0xe7c983 * _0x22ba3a),
      (_0x335d5c[13] =
        (_0x41a727 * _0x20238f * _0x3e5501 -
          _0x43e541 * _0x5302dc * _0x3e5501 +
          _0x43e541 * _0x37871b * _0x2c181b -
          _0x167ac4 * _0x20238f * _0x2c181b -
          _0x41a727 * _0x37871b * _0xb07b63 +
          _0x167ac4 * _0x5302dc * _0xb07b63) *
        _0x22ba3a),
      (_0x335d5c[14] =
        (_0x43e541 * _0x5cc942 * _0x3e5501 -
          _0x558951 * _0x20238f * _0x3e5501 -
          _0x43e541 * _0x37871b * _0x57c1df +
          _0x167ac4 * _0x20238f * _0x57c1df +
          _0x558951 * _0x37871b * _0xb07b63 -
          _0x167ac4 * _0x5cc942 * _0xb07b63) *
        _0x22ba3a),
      (_0x335d5c[15] =
        (_0x558951 * _0x5302dc * _0x3e5501 -
          _0x41a727 * _0x5cc942 * _0x3e5501 +
          _0x41a727 * _0x37871b * _0x57c1df -
          _0x167ac4 * _0x5302dc * _0x57c1df -
          _0x558951 * _0x37871b * _0x2c181b +
          _0x167ac4 * _0x5cc942 * _0x2c181b) *
        _0x22ba3a),
      this
    );
  }
  ['scale'](_0x53b14b) {
    const _0xfd6324 = this.elements,
      _0x6c56b7 = _0x53b14b.x,
      _0x445c98 = _0x53b14b.y,
      _0x1278aa = _0x53b14b.z;
    return (
      (_0xfd6324[0] *= _0x6c56b7),
      (_0xfd6324[4] *= _0x445c98),
      (_0xfd6324[8] *= _0x1278aa),
      (_0xfd6324[1] *= _0x6c56b7),
      (_0xfd6324[5] *= _0x445c98),
      (_0xfd6324[9] *= _0x1278aa),
      (_0xfd6324[2] *= _0x6c56b7),
      (_0xfd6324[6] *= _0x445c98),
      (_0xfd6324[10] *= _0x1278aa),
      (_0xfd6324[3] *= _0x6c56b7),
      (_0xfd6324[7] *= _0x445c98),
      (_0xfd6324[11] *= _0x1278aa),
      this
    );
  }
  ['getMaxScaleOnAxis']() {
    const _0x2824f0 = this.elements,
      _0x5eb188 = _0x2824f0[0] * _0x2824f0[0] + _0x2824f0[1] * _0x2824f0[1] + _0x2824f0[2] * _0x2824f0[2],
      _0x50d797 = _0x2824f0[4] * _0x2824f0[4] + _0x2824f0[5] * _0x2824f0[5] + _0x2824f0[6] * _0x2824f0[6],
      _0x56eba1 = _0x2824f0[8] * _0x2824f0[8] + _0x2824f0[9] * _0x2824f0[9] + _0x2824f0[10] * _0x2824f0[10];
    return Math.sqrt(Math.max(_0x5eb188, _0x50d797, _0x56eba1));
  }
  ['makeTranslation'](_0x40a75a, _0x4e2d1e, _0x22298a) {
    return (
      _0x40a75a.isVector3
        ? this.set(1, 0, 0, _0x40a75a.x, 0, 1, 0, _0x40a75a.y, 0, 0, 1, _0x40a75a.z, 0, 0, 0, 1)
        : this.set(1, 0, 0, _0x40a75a, 0, 1, 0, _0x4e2d1e, 0, 0, 1, _0x22298a, 0, 0, 0, 1),
      this
    );
  }
  ['makeRotationX'](_0x2fd191) {
    const _0x52e468 = Math.cos(_0x2fd191),
      _0x272192 = Math.sin(_0x2fd191);
    return (this.set(1, 0, 0, 0, 0, _0x52e468, -_0x272192, 0, 0, _0x272192, _0x52e468, 0, 0, 0, 0, 1), this);
  }
  ['makeRotationY'](_0x5d3e9e) {
    const _0x3c0857 = Math.cos(_0x5d3e9e),
      _0x2a74d7 = Math.sin(_0x5d3e9e);
    return (this.set(_0x3c0857, 0, _0x2a74d7, 0, 0, 1, 0, 0, -_0x2a74d7, 0, _0x3c0857, 0, 0, 0, 0, 1), this);
  }
  ['makeRotationZ'](_0x54cc4a) {
    const _0x9189b7 = Math.cos(_0x54cc4a),
      _0x461c9b = Math.sin(_0x54cc4a);
    return (this.set(_0x9189b7, -_0x461c9b, 0, 0, _0x461c9b, _0x9189b7, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1), this);
  }
  ['makeRotationAxis'](_0x57d72d, _0xa39549) {
    const _0x4957e9 = Math.cos(_0xa39549),
      _0x3daf55 = Math.sin(_0xa39549),
      _0x370ec3 = 1 - _0x4957e9,
      _0x5f5c0e = _0x57d72d.x,
      _0x4eedfc = _0x57d72d.y,
      _0x364223 = _0x57d72d.z,
      _0x391add = _0x370ec3 * _0x5f5c0e,
      _0x32bc81 = _0x370ec3 * _0x4eedfc;
    return (
      this.set(
        _0x391add * _0x5f5c0e + _0x4957e9,
        _0x391add * _0x4eedfc - _0x3daf55 * _0x364223,
        _0x391add * _0x364223 + _0x3daf55 * _0x4eedfc,
        0,
        _0x391add * _0x4eedfc + _0x3daf55 * _0x364223,
        _0x32bc81 * _0x4eedfc + _0x4957e9,
        _0x32bc81 * _0x364223 - _0x3daf55 * _0x5f5c0e,
        0,
        _0x391add * _0x364223 - _0x3daf55 * _0x4eedfc,
        _0x32bc81 * _0x364223 + _0x3daf55 * _0x5f5c0e,
        _0x370ec3 * _0x364223 * _0x364223 + _0x4957e9,
        0,
        0,
        0,
        0,
        1,
      ),
      this
    );
  }
  ['makeScale'](_0x44ec02, _0x5c111a, _0x38d297) {
    return (this.set(_0x44ec02, 0, 0, 0, 0, _0x5c111a, 0, 0, 0, 0, _0x38d297, 0, 0, 0, 0, 1), this);
  }
  ['makeShear'](_0x18a4a8, _0x1bef37, _0x26c7dc, _0x5d4827, _0x4eb40e, _0x54e056) {
    return (
      this.set(
        1,
        _0x26c7dc,
        _0x4eb40e,
        0,
        _0x18a4a8,
        1,
        _0x54e056,
        0,
        _0x1bef37,
        _0x5d4827,
        1,
        0,
        0,
        0,
        0,
        1,
      ),
      this
    );
  }
  ['compose'](_0x58c58b, _0x23e8af, _0x356552) {
    const _0x3e63a5 = this.elements,
      _0x465805 = _0x23e8af._x,
      _0x4f3368 = _0x23e8af._y,
      _0x2fc821 = _0x23e8af._z,
      _0x46bd97 = _0x23e8af._w,
      _0x239219 = _0x465805 + _0x465805,
      _0x41c74b = _0x4f3368 + _0x4f3368,
      _0x55db50 = _0x2fc821 + _0x2fc821,
      _0x1d062a = _0x465805 * _0x239219,
      _0x5ec0c9 = _0x465805 * _0x41c74b,
      _0x4593d0 = _0x465805 * _0x55db50,
      _0x472b85 = _0x4f3368 * _0x41c74b,
      _0x3f1b4f = _0x4f3368 * _0x55db50,
      _0x15d1cc = _0x2fc821 * _0x55db50,
      _0x5be497 = _0x46bd97 * _0x239219,
      _0x4ec952 = _0x46bd97 * _0x41c74b,
      _0x41a04f = _0x46bd97 * _0x55db50,
      _0x2c5417 = _0x356552.x,
      _0x4d95d3 = _0x356552.y,
      _0x4b69bd = _0x356552.z;
    return (
      (_0x3e63a5[0] = (1 - (_0x472b85 + _0x15d1cc)) * _0x2c5417),
      (_0x3e63a5[1] = (_0x5ec0c9 + _0x41a04f) * _0x2c5417),
      (_0x3e63a5[2] = (_0x4593d0 - _0x4ec952) * _0x2c5417),
      (_0x3e63a5[3] = 0),
      (_0x3e63a5[4] = (_0x5ec0c9 - _0x41a04f) * _0x4d95d3),
      (_0x3e63a5[5] = (1 - (_0x1d062a + _0x15d1cc)) * _0x4d95d3),
      (_0x3e63a5[6] = (_0x3f1b4f + _0x5be497) * _0x4d95d3),
      (_0x3e63a5[7] = 0),
      (_0x3e63a5[8] = (_0x4593d0 + _0x4ec952) * _0x4b69bd),
      (_0x3e63a5[9] = (_0x3f1b4f - _0x5be497) * _0x4b69bd),
      (_0x3e63a5[10] = (1 - (_0x1d062a + _0x472b85)) * _0x4b69bd),
      (_0x3e63a5[11] = 0),
      (_0x3e63a5[12] = _0x58c58b.x),
      (_0x3e63a5[13] = _0x58c58b.y),
      (_0x3e63a5[14] = _0x58c58b.z),
      (_0x3e63a5[15] = 1),
      this
    );
  }
  ['decompose'](_0x2101ac, _0x1ef28d, _0xce3000) {
    const _0x318c34 = this.elements;
    let _0x8c3b2d = _v1$5.set(_0x318c34[0], _0x318c34[1], _0x318c34[2]).length();
    const _0x17b8d0 = _v1$5.set(_0x318c34[4], _0x318c34[5], _0x318c34[6]).length(),
      _0x2720f2 = _v1$5.set(_0x318c34[8], _0x318c34[9], _0x318c34[10]).length(),
      _0x7b4652 = this.determinant();
    if (_0x7b4652 < 0) _0x8c3b2d = -_0x8c3b2d;
    ((_0x2101ac.x = _0x318c34[12]),
      (_0x2101ac.y = _0x318c34[13]),
      (_0x2101ac.z = _0x318c34[14]),
      _m1$2.copy(this));
    const _0xefdfdc = 1 / _0x8c3b2d,
      _0x3d053a = 1 / _0x17b8d0,
      _0x2e021e = 1 / _0x2720f2;
    return (
      (_m1$2.elements[0] *= _0xefdfdc),
      (_m1$2.elements[1] *= _0xefdfdc),
      (_m1$2.elements[2] *= _0xefdfdc),
      (_m1$2.elements[4] *= _0x3d053a),
      (_m1$2.elements[5] *= _0x3d053a),
      (_m1$2.elements[6] *= _0x3d053a),
      (_m1$2.elements[8] *= _0x2e021e),
      (_m1$2.elements[9] *= _0x2e021e),
      (_m1$2.elements[10] *= _0x2e021e),
      _0x1ef28d.setFromRotationMatrix(_m1$2),
      (_0xce3000.x = _0x8c3b2d),
      (_0xce3000.y = _0x17b8d0),
      (_0xce3000.z = _0x2720f2),
      this
    );
  }
  ['makePerspective'](
    _0x41d8da,
    _0x2f5f5f,
    _0x277c34,
    _0x5418fc,
    _0x53d798,
    _0x1cb8e6,
    _0x4b9281 = WebGLCoordinateSystem,
    _0xff517b = false,
  ) {
    const _0x3a2f92 = this.elements,
      _0x4f2692 = (2 * _0x53d798) / (_0x2f5f5f - _0x41d8da),
      _0x5dfac8 = (2 * _0x53d798) / (_0x277c34 - _0x5418fc),
      _0x1d12ec = (_0x2f5f5f + _0x41d8da) / (_0x2f5f5f - _0x41d8da),
      _0x5dfdc6 = (_0x277c34 + _0x5418fc) / (_0x277c34 - _0x5418fc);
    let _0xc720f3, _0x3904cd;
    if (_0xff517b)
      ((_0xc720f3 = _0x53d798 / (_0x1cb8e6 - _0x53d798)),
        (_0x3904cd = (_0x1cb8e6 * _0x53d798) / (_0x1cb8e6 - _0x53d798)));
    else {
      if (_0x4b9281 === WebGLCoordinateSystem)
        ((_0xc720f3 = -(_0x1cb8e6 + _0x53d798) / (_0x1cb8e6 - _0x53d798)),
          (_0x3904cd = (-2 * _0x1cb8e6 * _0x53d798) / (_0x1cb8e6 - _0x53d798)));
      else {
        if (_0x4b9281 === WebGPUCoordinateSystem)
          ((_0xc720f3 = -_0x1cb8e6 / (_0x1cb8e6 - _0x53d798)),
            (_0x3904cd = (-_0x1cb8e6 * _0x53d798) / (_0x1cb8e6 - _0x53d798)));
        else throw new Error('THREE.Matrix4.makePerspective(): Invalid coordinate system: ' + _0x4b9281);
      }
    }
    return (
      (_0x3a2f92[0] = _0x4f2692),
      (_0x3a2f92[4] = 0),
      (_0x3a2f92[8] = _0x1d12ec),
      (_0x3a2f92[12] = 0),
      (_0x3a2f92[1] = 0),
      (_0x3a2f92[5] = _0x5dfac8),
      (_0x3a2f92[9] = _0x5dfdc6),
      (_0x3a2f92[13] = 0),
      (_0x3a2f92[2] = 0),
      (_0x3a2f92[6] = 0),
      (_0x3a2f92[10] = _0xc720f3),
      (_0x3a2f92[14] = _0x3904cd),
      (_0x3a2f92[3] = 0),
      (_0x3a2f92[7] = 0),
      (_0x3a2f92[11] = -1),
      (_0x3a2f92[15] = 0),
      this
    );
  }
  ['makeOrthographic'](
    _0x1fa566,
    _0x14dbcb,
    _0x5f5d0e,
    _0x3ba80d,
    _0x58de51,
    _0x2e156c,
    _0x5dd6ce = WebGLCoordinateSystem,
    _0x1db2c8 = false,
  ) {
    const _0x1c14c3 = this.elements,
      _0x292120 = 2 / (_0x14dbcb - _0x1fa566),
      _0x56d3f6 = 2 / (_0x5f5d0e - _0x3ba80d),
      _0x283f3a = -(_0x14dbcb + _0x1fa566) / (_0x14dbcb - _0x1fa566),
      _0x976c1c = -(_0x5f5d0e + _0x3ba80d) / (_0x5f5d0e - _0x3ba80d);
    let _0x2a38e0, _0xa35856;
    if (_0x1db2c8)
      ((_0x2a38e0 = 1 / (_0x2e156c - _0x58de51)), (_0xa35856 = _0x2e156c / (_0x2e156c - _0x58de51)));
    else {
      if (_0x5dd6ce === WebGLCoordinateSystem)
        ((_0x2a38e0 = -2 / (_0x2e156c - _0x58de51)),
          (_0xa35856 = -(_0x2e156c + _0x58de51) / (_0x2e156c - _0x58de51)));
      else {
        if (_0x5dd6ce === WebGPUCoordinateSystem)
          ((_0x2a38e0 = -1 / (_0x2e156c - _0x58de51)), (_0xa35856 = -_0x58de51 / (_0x2e156c - _0x58de51)));
        else throw new Error('THREE.Matrix4.makeOrthographic(): Invalid coordinate system: ' + _0x5dd6ce);
      }
    }
    return (
      (_0x1c14c3[0] = _0x292120),
      (_0x1c14c3[4] = 0),
      (_0x1c14c3[8] = 0),
      (_0x1c14c3[12] = _0x283f3a),
      (_0x1c14c3[1] = 0),
      (_0x1c14c3[5] = _0x56d3f6),
      (_0x1c14c3[9] = 0),
      (_0x1c14c3[13] = _0x976c1c),
      (_0x1c14c3[2] = 0),
      (_0x1c14c3[6] = 0),
      (_0x1c14c3[10] = _0x2a38e0),
      (_0x1c14c3[14] = _0xa35856),
      (_0x1c14c3[3] = 0),
      (_0x1c14c3[7] = 0),
      (_0x1c14c3[11] = 0),
      (_0x1c14c3[15] = 1),
      this
    );
  }
  ['equals'](_0x8c137) {
    const _0x41f150 = this.elements,
      _0x33423e = _0x8c137.elements;
    for (let _0x22416e = 0; _0x22416e < 16; _0x22416e++) {
      if (_0x41f150[_0x22416e] !== _0x33423e[_0x22416e]) return false;
    }
    return true;
  }
  ['fromArray'](_0x531658, _0x9ff5f3 = 0) {
    for (let _0x3216f4 = 0; _0x3216f4 < 16; _0x3216f4++) {
      this.elements[_0x3216f4] = _0x531658[_0x3216f4 + _0x9ff5f3];
    }
    return this;
  }
  ['toArray'](_0x5e56b6 = [], _0x15b6ef = 0) {
    const _0x23fd7c = this.elements;
    return (
      (_0x5e56b6[_0x15b6ef] = _0x23fd7c[0]),
      (_0x5e56b6[_0x15b6ef + 1] = _0x23fd7c[1]),
      (_0x5e56b6[_0x15b6ef + 2] = _0x23fd7c[2]),
      (_0x5e56b6[_0x15b6ef + 3] = _0x23fd7c[3]),
      (_0x5e56b6[_0x15b6ef + 4] = _0x23fd7c[4]),
      (_0x5e56b6[_0x15b6ef + 5] = _0x23fd7c[5]),
      (_0x5e56b6[_0x15b6ef + 6] = _0x23fd7c[6]),
      (_0x5e56b6[_0x15b6ef + 7] = _0x23fd7c[7]),
      (_0x5e56b6[_0x15b6ef + 8] = _0x23fd7c[8]),
      (_0x5e56b6[_0x15b6ef + 9] = _0x23fd7c[9]),
      (_0x5e56b6[_0x15b6ef + 10] = _0x23fd7c[10]),
      (_0x5e56b6[_0x15b6ef + 11] = _0x23fd7c[11]),
      (_0x5e56b6[_0x15b6ef + 12] = _0x23fd7c[12]),
      (_0x5e56b6[_0x15b6ef + 13] = _0x23fd7c[13]),
      (_0x5e56b6[_0x15b6ef + 14] = _0x23fd7c[14]),
      (_0x5e56b6[_0x15b6ef + 15] = _0x23fd7c[15]),
      _0x5e56b6
    );
  }
}
const _v1$5 = new Vector3(),
  _m1$2 = new Matrix4(),
  _zero = new Vector3(0, 0, 0),
  _one = new Vector3(1, 1, 1),
  _x = new Vector3(),
  _y = new Vector3(),
  _z = new Vector3(),
  _matrix$2 = new Matrix4(),
  _quaternion$3 = new Quaternion();
class Euler {
  constructor(_0x1e69ed = 0, _0x23b63e = 0, _0x4eb963 = 0, _0x339f41 = Euler.DEFAULT_ORDER) {
    ((this.isEuler = true),
      (this._x = _0x1e69ed),
      (this._y = _0x23b63e),
      (this._z = _0x4eb963),
      (this._order = _0x339f41));
  }
  get ['x']() {
    return this._x;
  }
  set ['x'](_0xbc9f3b) {
    ((this._x = _0xbc9f3b), this._onChangeCallback());
  }
  get ['y']() {
    return this._y;
  }
  set ['y'](_0x52f461) {
    ((this._y = _0x52f461), this._onChangeCallback());
  }
  get ['z']() {
    return this._z;
  }
  set ['z'](_0x5f382c) {
    ((this._z = _0x5f382c), this._onChangeCallback());
  }
  get ['order']() {
    return this._order;
  }
  set ['order'](_0x24fa4f) {
    ((this._order = _0x24fa4f), this._onChangeCallback());
  }
  ['set'](_0x2212b2, _0x4d1478, _0x3f686e, _0x114627 = this._order) {
    return (
      (this._x = _0x2212b2),
      (this._y = _0x4d1478),
      (this._z = _0x3f686e),
      (this._order = _0x114627),
      this._onChangeCallback(),
      this
    );
  }
  ['clone']() {
    return new this['constructor'](this._x, this._y, this._z, this._order);
  }
  ['copy'](_0x171fbd) {
    return (
      (this._x = _0x171fbd._x),
      (this._y = _0x171fbd._y),
      (this._z = _0x171fbd._z),
      (this._order = _0x171fbd._order),
      this._onChangeCallback(),
      this
    );
  }
  ['setFromRotationMatrix'](_0x53b205, _0x18b671 = this._order, _0x10eca5 = true) {
    const _0x19988a = _0x53b205.elements,
      _0x41cf79 = _0x19988a[0],
      _0x43a67d = _0x19988a[4],
      _0x5d81d3 = _0x19988a[8],
      _0x1fc18e = _0x19988a[1],
      _0x13037c = _0x19988a[5],
      _0xc4f4b8 = _0x19988a[9],
      _0x4c506d = _0x19988a[2],
      _0x3c56df = _0x19988a[6],
      _0x5325f6 = _0x19988a[10];
    switch (_0x18b671) {
      case 'XYZ':
        this._y = Math.asin(clamp(_0x5d81d3, -1, 1));
        Math.abs(_0x5d81d3) < 0.9999999
          ? ((this._x = Math.atan2(-_0xc4f4b8, _0x5325f6)), (this._z = Math.atan2(-_0x43a67d, _0x41cf79)))
          : ((this._x = Math.atan2(_0x3c56df, _0x13037c)), (this._z = 0));
        break;
      case 'YXZ':
        this._x = Math.asin(-clamp(_0xc4f4b8, -1, 1));
        Math.abs(_0xc4f4b8) < 0.9999999
          ? ((this._y = Math.atan2(_0x5d81d3, _0x5325f6)), (this._z = Math.atan2(_0x1fc18e, _0x13037c)))
          : ((this._y = Math.atan2(-_0x4c506d, _0x41cf79)), (this._z = 0));
        break;
      case 'ZXY':
        this._x = Math.asin(clamp(_0x3c56df, -1, 1));
        Math.abs(_0x3c56df) < 0.9999999
          ? ((this._y = Math.atan2(-_0x4c506d, _0x5325f6)), (this._z = Math.atan2(-_0x43a67d, _0x13037c)))
          : ((this._y = 0), (this._z = Math.atan2(_0x1fc18e, _0x41cf79)));
        break;
      case 'ZYX':
        this._y = Math.asin(-clamp(_0x4c506d, -1, 1));
        Math.abs(_0x4c506d) < 0.9999999
          ? ((this._x = Math.atan2(_0x3c56df, _0x5325f6)), (this._z = Math.atan2(_0x1fc18e, _0x41cf79)))
          : ((this._x = 0), (this._z = Math.atan2(-_0x43a67d, _0x13037c)));
        break;
      case 'YZX':
        this._z = Math.asin(clamp(_0x1fc18e, -1, 1));
        Math.abs(_0x1fc18e) < 0.9999999
          ? ((this._x = Math.atan2(-_0xc4f4b8, _0x13037c)), (this._y = Math.atan2(-_0x4c506d, _0x41cf79)))
          : ((this._x = 0), (this._y = Math.atan2(_0x5d81d3, _0x5325f6)));
        break;
      case 'XZY':
        this._z = Math.asin(-clamp(_0x43a67d, -1, 1));
        Math.abs(_0x43a67d) < 0.9999999
          ? ((this._x = Math.atan2(_0x3c56df, _0x13037c)), (this._y = Math.atan2(_0x5d81d3, _0x41cf79)))
          : ((this._x = Math.atan2(-_0xc4f4b8, _0x5325f6)), (this._y = 0));
        break;
      default:
        console.warn('THREE.Euler: .setFromRotationMatrix() encountered an unknown order: ' + _0x18b671);
    }
    this._order = _0x18b671;
    if (_0x10eca5 === true) this._onChangeCallback();
    return this;
  }
  ['setFromQuaternion'](_0x11659a, _0x7f5b63, _0x5b6f87) {
    return (
      _matrix$2.makeRotationFromQuaternion(_0x11659a),
      this.setFromRotationMatrix(_matrix$2, _0x7f5b63, _0x5b6f87)
    );
  }
  ['setFromVector3'](_0x1eda4f, _0x35c35e = this._order) {
    return this.set(_0x1eda4f.x, _0x1eda4f.y, _0x1eda4f.z, _0x35c35e);
  }
  ['reorder'](_0x20b08d) {
    return (_quaternion$3.setFromEuler(this), this.setFromQuaternion(_quaternion$3, _0x20b08d));
  }
  ['equals'](_0x3c3a8f) {
    return (
      _0x3c3a8f._x === this._x &&
      _0x3c3a8f._y === this._y &&
      _0x3c3a8f._z === this._z &&
      _0x3c3a8f._order === this._order
    );
  }
  ['fromArray'](_0x2f0cde) {
    ((this._x = _0x2f0cde[0]), (this._y = _0x2f0cde[1]), (this._z = _0x2f0cde[2]));
    if (_0x2f0cde[3] !== undefined) this._order = _0x2f0cde[3];
    return (this._onChangeCallback(), this);
  }
  ['toArray'](_0x503c76 = [], _0x257110 = 0) {
    return (
      (_0x503c76[_0x257110] = this._x),
      (_0x503c76[_0x257110 + 1] = this._y),
      (_0x503c76[_0x257110 + 2] = this._z),
      (_0x503c76[_0x257110 + 3] = this._order),
      _0x503c76
    );
  }
  ['_onChange'](_0x1337ff) {
    return ((this._onChangeCallback = _0x1337ff), this);
  }
  ['_onChangeCallback']() {}
  *[Symbol.iterator]() {
    (yield this._x, yield this._y, yield this._z, yield this._order);
  }
}
Euler.DEFAULT_ORDER = 'XYZ';
class Layers {
  constructor() {
    this.mask = 1 | 0;
  }
  ['set'](_0x4da49f) {
    this.mask = ((1 << _0x4da49f) | 0) >>> 0;
  }
  ['enable'](_0x474a3f) {
    this.mask |= (1 << _0x474a3f) | 0;
  }
  ['enableAll']() {
    this.mask = 0xffffffff | 0;
  }
  ['toggle'](_0xb2ad29) {
    this.mask ^= (1 << _0xb2ad29) | 0;
  }
  ['disable'](_0xcd9692) {
    this.mask &= ~((1 << _0xcd9692) | 0);
  }
  ['disableAll']() {
    this.mask = 0;
  }
  ['test'](_0x3bb386) {
    return (this.mask & _0x3bb386.mask) !== 0;
  }
  ['isEnabled'](_0xb2fc04) {
    return (this.mask & ((1 << _0xb2fc04) | 0)) !== 0;
  }
}
let _object3DId = 0;
const _v1$4 = new Vector3(),
  _q1 = new Quaternion(),
  _m1$1 = new Matrix4(),
  _target = new Vector3(),
  _position$3 = new Vector3(),
  _scale$2 = new Vector3(),
  _quaternion$2 = new Quaternion(),
  _xAxis = new Vector3(1, 0, 0),
  _yAxis = new Vector3(0, 1, 0),
  _zAxis = new Vector3(0, 0, 1),
  _addedEvent = { type: 'added' },
  _removedEvent = { type: 'removed' },
  _childaddedEvent = { type: 'childadded', child: null },
  _childremovedEvent = { type: 'childremoved', child: null };
class Object3D extends EventDispatcher {
  constructor() {
    (super(),
      (this.isObject3D = true),
      Object.defineProperty(this, 'id', { value: _object3DId++ }),
      (this.uuid = generateUUID()),
      (this.name = ''),
      (this.type = 'Object3D'),
      (this.parent = null),
      (this.children = []),
      (this.up = Object3D.DEFAULT_UP.clone()));
    const _0x27d280 = new Vector3(),
      _0x58b676 = new Euler(),
      _0x3b6407 = new Quaternion(),
      _0x1c7d02 = new Vector3(1, 1, 1);
    function _0x2a4e07() {
      _0x3b6407.setFromEuler(_0x58b676, false);
    }
    function _0x590f9b() {
      _0x58b676.setFromQuaternion(_0x3b6407, undefined, false);
    }
    (_0x58b676._onChange(_0x2a4e07),
      _0x3b6407._onChange(_0x590f9b),
      Object.defineProperties(this, {
        position: { configurable: true, enumerable: true, value: _0x27d280 },
        rotation: { configurable: true, enumerable: true, value: _0x58b676 },
        quaternion: { configurable: true, enumerable: true, value: _0x3b6407 },
        scale: { configurable: true, enumerable: true, value: _0x1c7d02 },
        modelViewMatrix: { value: new Matrix4() },
        normalMatrix: { value: new Matrix3() },
      }),
      (this.matrix = new Matrix4()),
      (this.matrixWorld = new Matrix4()),
      (this.matrixAutoUpdate = Object3D.DEFAULT_MATRIX_AUTO_UPDATE),
      (this.matrixWorldAutoUpdate = Object3D.DEFAULT_MATRIX_WORLD_AUTO_UPDATE),
      (this.matrixWorldNeedsUpdate = false),
      (this.layers = new Layers()),
      (this.visible = true),
      (this.castShadow = false),
      (this.receiveShadow = false),
      (this.frustumCulled = true),
      (this.renderOrder = 0),
      (this.animations = []),
      (this.customDepthMaterial = undefined),
      (this.customDistanceMaterial = undefined),
      (this.userData = {}));
  }
  ['onBeforeShadow']() {}
  ['onAfterShadow']() {}
  ['onBeforeRender']() {}
  ['onAfterRender']() {}
  ['applyMatrix4'](_0x2f24b6) {
    if (this.matrixAutoUpdate) this.updateMatrix();
    (this.matrix.premultiply(_0x2f24b6), this.matrix.decompose(this.position, this.quaternion, this.scale));
  }
  ['applyQuaternion'](_0x3bc7a4) {
    return (this.quaternion.premultiply(_0x3bc7a4), this);
  }
  ['setRotationFromAxisAngle'](_0x3cbc28, _0x1f981c) {
    this.quaternion.setFromAxisAngle(_0x3cbc28, _0x1f981c);
  }
  ['setRotationFromEuler'](_0x462a05) {
    this.quaternion.setFromEuler(_0x462a05, true);
  }
  ['setRotationFromMatrix'](_0x94962c) {
    this.quaternion.setFromRotationMatrix(_0x94962c);
  }
  ['setRotationFromQuaternion'](_0x4f5645) {
    this.quaternion.copy(_0x4f5645);
  }
  ['rotateOnAxis'](_0x2793a1, _0x329f35) {
    return (_q1.setFromAxisAngle(_0x2793a1, _0x329f35), this.quaternion.multiply(_q1), this);
  }
  ['rotateOnWorldAxis'](_0x48a30c, _0x2d1784) {
    return (_q1.setFromAxisAngle(_0x48a30c, _0x2d1784), this.quaternion.premultiply(_q1), this);
  }
  ['rotateX'](_0xae5c74) {
    return this.rotateOnAxis(_xAxis, _0xae5c74);
  }
  ['rotateY'](_0x648f21) {
    return this.rotateOnAxis(_yAxis, _0x648f21);
  }
  ['rotateZ'](_0x434723) {
    return this.rotateOnAxis(_zAxis, _0x434723);
  }
  ['translateOnAxis'](_0x3bdab4, _0x1a880a) {
    return (
      _v1$4.copy(_0x3bdab4).applyQuaternion(this.quaternion),
      this.position.add(_v1$4.multiplyScalar(_0x1a880a)),
      this
    );
  }
  ['translateX'](_0x354829) {
    return this.translateOnAxis(_xAxis, _0x354829);
  }
  ['translateY'](_0x6c146e) {
    return this.translateOnAxis(_yAxis, _0x6c146e);
  }
  ['translateZ'](_0x2b2c2d) {
    return this.translateOnAxis(_zAxis, _0x2b2c2d);
  }
  ['localToWorld'](_0x5b55ec) {
    return (this.updateWorldMatrix(true, false), _0x5b55ec.applyMatrix4(this.matrixWorld));
  }
  ['worldToLocal'](_0x3f3ea7) {
    return (
      this.updateWorldMatrix(true, false),
      _0x3f3ea7.applyMatrix4(_m1$1.copy(this.matrixWorld).invert())
    );
  }
  ['lookAt'](_0xcbfeb5, _0x3530b5, _0x10c98a) {
    _0xcbfeb5.isVector3 ? _target.copy(_0xcbfeb5) : _target.set(_0xcbfeb5, _0x3530b5, _0x10c98a);
    const _0x41af90 = this.parent;
    (this.updateWorldMatrix(true, false),
      _position$3.setFromMatrixPosition(this.matrixWorld),
      this.isCamera || this.isLight
        ? _m1$1.lookAt(_position$3, _target, this.up)
        : _m1$1.lookAt(_target, _position$3, this.up),
      this.quaternion.setFromRotationMatrix(_m1$1),
      _0x41af90 &&
        (_m1$1.extractRotation(_0x41af90.matrixWorld),
        _q1.setFromRotationMatrix(_m1$1),
        this.quaternion.premultiply(_q1.invert())));
  }
  ['add'](_0x41a17f) {
    if (arguments.length > 1) {
      for (let _0x3246a4 = 0; _0x3246a4 < arguments.length; _0x3246a4++) {
        this.add(arguments[_0x3246a4]);
      }
      return this;
    }
    if (_0x41a17f === this)
      return (
        console.error("THREE.Object3D.add: object can't be added as a child of itself.", _0x41a17f),
        this
      );
    return (
      _0x41a17f && _0x41a17f.isObject3D
        ? (_0x41a17f.removeFromParent(),
          (_0x41a17f.parent = this),
          this.children.push(_0x41a17f),
          _0x41a17f.dispatchEvent(_addedEvent),
          (_childaddedEvent.child = _0x41a17f),
          this.dispatchEvent(_childaddedEvent),
          (_childaddedEvent.child = null))
        : console.error('THREE.Object3D.add: object not an instance of THREE.Object3D.', _0x41a17f),
      this
    );
  }
  ['remove'](_0x34dbb8) {
    if (arguments.length > 1) {
      for (let _0xe13d5b = 0; _0xe13d5b < arguments.length; _0xe13d5b++) {
        this.remove(arguments[_0xe13d5b]);
      }
      return this;
    }
    const _0x1c779c = this.children.indexOf(_0x34dbb8);
    return (
      _0x1c779c !== -1 &&
        ((_0x34dbb8.parent = null),
        this.children.splice(_0x1c779c, 1),
        _0x34dbb8.dispatchEvent(_removedEvent),
        (_childremovedEvent.child = _0x34dbb8),
        this.dispatchEvent(_childremovedEvent),
        (_childremovedEvent.child = null)),
      this
    );
  }
  ['removeFromParent']() {
    const _0x30c471 = this.parent;
    return (_0x30c471 !== null && _0x30c471.remove(this), this);
  }
  ['clear']() {
    return this.remove(...this.children);
  }
  ['attach'](_0x27b3db) {
    return (
      this.updateWorldMatrix(true, false),
      _m1$1.copy(this.matrixWorld).invert(),
      _0x27b3db.parent !== null &&
        (_0x27b3db.parent.updateWorldMatrix(true, false), _m1$1.multiply(_0x27b3db.parent.matrixWorld)),
      _0x27b3db.applyMatrix4(_m1$1),
      _0x27b3db.removeFromParent(),
      (_0x27b3db.parent = this),
      this.children.push(_0x27b3db),
      _0x27b3db.updateWorldMatrix(false, true),
      _0x27b3db.dispatchEvent(_addedEvent),
      (_childaddedEvent.child = _0x27b3db),
      this.dispatchEvent(_childaddedEvent),
      (_childaddedEvent.child = null),
      this
    );
  }
  ['getObjectById'](_0x2d7591) {
    return this.getObjectByProperty('id', _0x2d7591);
  }
  ['getObjectByName'](_0x3d9346) {
    return this.getObjectByProperty('name', _0x3d9346);
  }
  ['getObjectByProperty'](_0x350d95, _0x51b633) {
    if (this[_0x350d95] === _0x51b633) return this;
    for (let _0x342670 = 0, _0x10cdf0 = this.children.length; _0x342670 < _0x10cdf0; _0x342670++) {
      const _0x4cff9b = this.children[_0x342670],
        _0x20ee1b = _0x4cff9b.getObjectByProperty(_0x350d95, _0x51b633);
      if (_0x20ee1b !== undefined) return _0x20ee1b;
    }
    return undefined;
  }
  ['getObjectsByProperty'](_0x98c68e, _0x1b1af4, _0x1231c2 = []) {
    if (this[_0x98c68e] === _0x1b1af4) _0x1231c2.push(this);
    const _0xfb060a = this.children;
    for (let _0x5b534e = 0, _0x4093bf = _0xfb060a.length; _0x5b534e < _0x4093bf; _0x5b534e++) {
      _0xfb060a[_0x5b534e].getObjectsByProperty(_0x98c68e, _0x1b1af4, _0x1231c2);
    }
    return _0x1231c2;
  }
  ['getWorldPosition'](_0x406235) {
    return (this.updateWorldMatrix(true, false), _0x406235.setFromMatrixPosition(this.matrixWorld));
  }
  ['getWorldQuaternion'](_0x545ef6) {
    return (
      this.updateWorldMatrix(true, false),
      this.matrixWorld.decompose(_position$3, _0x545ef6, _scale$2),
      _0x545ef6
    );
  }
  ['getWorldScale'](_0x363a18) {
    return (
      this.updateWorldMatrix(true, false),
      this.matrixWorld.decompose(_position$3, _quaternion$2, _0x363a18),
      _0x363a18
    );
  }
  ['getWorldDirection'](_0x4c7857) {
    this.updateWorldMatrix(true, false);
    const _0x5ef169 = this.matrixWorld.elements;
    return _0x4c7857.set(_0x5ef169[8], _0x5ef169[9], _0x5ef169[10]).normalize();
  }
  ['raycast']() {}
  ['traverse'](_0x217b7a) {
    _0x217b7a(this);
    const _0x4edc32 = this.children;
    for (let _0x18a0c2 = 0, _0x38540c = _0x4edc32.length; _0x18a0c2 < _0x38540c; _0x18a0c2++) {
      _0x4edc32[_0x18a0c2].traverse(_0x217b7a);
    }
  }
  ['traverseVisible'](_0x2a1372) {
    if (this.visible === false) return;
    _0x2a1372(this);
    const _0x2d6c2b = this.children;
    for (let _0x3e9d48 = 0, _0x2c28dd = _0x2d6c2b.length; _0x3e9d48 < _0x2c28dd; _0x3e9d48++) {
      _0x2d6c2b[_0x3e9d48].traverseVisible(_0x2a1372);
    }
  }
  ['traverseAncestors'](_0x2daaea) {
    const _0x20c122 = this.parent;
    _0x20c122 !== null && (_0x2daaea(_0x20c122), _0x20c122.traverseAncestors(_0x2daaea));
  }
  ['updateMatrix']() {
    (this.matrix.compose(this.position, this.quaternion, this.scale), (this.matrixWorldNeedsUpdate = true));
  }
  ['updateMatrixWorld'](_0x2abd4b) {
    if (this.matrixAutoUpdate) this.updateMatrix();
    (this.matrixWorldNeedsUpdate || _0x2abd4b) &&
      (this.matrixWorldAutoUpdate === true &&
        (this.parent === null
          ? this.matrixWorld.copy(this.matrix)
          : this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix)),
      (this.matrixWorldNeedsUpdate = false),
      (_0x2abd4b = true));
    const _0x1942ea = this.children;
    for (let _0x2f584e = 0, _0x31674c = _0x1942ea.length; _0x2f584e < _0x31674c; _0x2f584e++) {
      const _0x25c046 = _0x1942ea[_0x2f584e];
      _0x25c046.updateMatrixWorld(_0x2abd4b);
    }
  }
  ['updateWorldMatrix'](_0x5e4d90, _0x306506) {
    const _0x59fd36 = this.parent;
    _0x5e4d90 === true && _0x59fd36 !== null && _0x59fd36.updateWorldMatrix(true, false);
    if (this.matrixAutoUpdate) this.updateMatrix();
    this.matrixWorldAutoUpdate === true &&
      (this.parent === null
        ? this.matrixWorld.copy(this.matrix)
        : this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix));
    if (_0x306506 === true) {
      const _0x2de6df = this.children;
      for (let _0x3f61ed = 0, _0x5e698d = _0x2de6df.length; _0x3f61ed < _0x5e698d; _0x3f61ed++) {
        const _0x240f1a = _0x2de6df[_0x3f61ed];
        _0x240f1a.updateWorldMatrix(false, true);
      }
    }
  }
  ['toJSON'](_0x626970) {
    const _0x118bf9 = _0x626970 === undefined || typeof _0x626970 === 'string',
      _0x5b4343 = {};
    _0x118bf9 &&
      ((_0x626970 = {
        geometries: {},
        materials: {},
        textures: {},
        images: {},
        shapes: {},
        skeletons: {},
        animations: {},
        nodes: {},
      }),
      (_0x5b4343.metadata = { version: 4.7, type: 'Object', generator: 'Object3D.toJSON' }));
    const _0x39d19d = {};
    ((_0x39d19d.uuid = this.uuid), (_0x39d19d.type = this.type));
    if (this.name !== '') _0x39d19d.name = this.name;
    if (this.castShadow === true) _0x39d19d.castShadow = true;
    if (this.receiveShadow === true) _0x39d19d.receiveShadow = true;
    if (this.visible === false) _0x39d19d.visible = false;
    if (this.frustumCulled === false) _0x39d19d.frustumCulled = false;
    if (this.renderOrder !== 0) _0x39d19d.renderOrder = this.renderOrder;
    if (Object.keys(this.userData).length > 0) _0x39d19d.userData = this.userData;
    ((_0x39d19d.layers = this.layers.mask),
      (_0x39d19d.matrix = this.matrix.toArray()),
      (_0x39d19d.up = this.up.toArray()));
    if (this.matrixAutoUpdate === false) _0x39d19d.matrixAutoUpdate = false;
    if (this.isInstancedMesh) {
      ((_0x39d19d.type = 'InstancedMesh'),
        (_0x39d19d.count = this.count),
        (_0x39d19d.instanceMatrix = this.instanceMatrix.toJSON()));
      if (this.instanceColor !== null) _0x39d19d.instanceColor = this.instanceColor.toJSON();
    }
    this.isBatchedMesh &&
      ((_0x39d19d.type = 'BatchedMesh'),
      (_0x39d19d.perObjectFrustumCulled = this.perObjectFrustumCulled),
      (_0x39d19d.sortObjects = this.sortObjects),
      (_0x39d19d.drawRanges = this._drawRanges),
      (_0x39d19d.reservedRanges = this._reservedRanges),
      (_0x39d19d.geometryInfo = this._geometryInfo.map((_0x33cd75) => ({
        ..._0x33cd75,
        boundingBox: _0x33cd75.boundingBox ? _0x33cd75.boundingBox.toJSON() : undefined,
        boundingSphere: _0x33cd75.boundingSphere ? _0x33cd75.boundingSphere.toJSON() : undefined,
      }))),
      (_0x39d19d.instanceInfo = this._instanceInfo.map((_0x19915c) => ({ ..._0x19915c }))),
      (_0x39d19d.availableInstanceIds = this._availableInstanceIds.slice()),
      (_0x39d19d.availableGeometryIds = this._availableGeometryIds.slice()),
      (_0x39d19d.nextIndexStart = this._nextIndexStart),
      (_0x39d19d.nextVertexStart = this._nextVertexStart),
      (_0x39d19d.geometryCount = this._geometryCount),
      (_0x39d19d.maxInstanceCount = this._maxInstanceCount),
      (_0x39d19d.maxVertexCount = this._maxVertexCount),
      (_0x39d19d.maxIndexCount = this._maxIndexCount),
      (_0x39d19d.geometryInitialized = this._geometryInitialized),
      (_0x39d19d.matricesTexture = this._matricesTexture.toJSON(_0x626970)),
      (_0x39d19d.indirectTexture = this._indirectTexture.toJSON(_0x626970)),
      this._colorsTexture !== null && (_0x39d19d.colorsTexture = this._colorsTexture.toJSON(_0x626970)),
      this.boundingSphere !== null && (_0x39d19d.boundingSphere = this.boundingSphere.toJSON()),
      this.boundingBox !== null && (_0x39d19d.boundingBox = this.boundingBox.toJSON()));
    function _0x290c34(_0x16acc3, _0x412fcb) {
      return (
        _0x16acc3[_0x412fcb.uuid] === undefined && (_0x16acc3[_0x412fcb.uuid] = _0x412fcb.toJSON(_0x626970)),
        _0x412fcb.uuid
      );
    }
    if (this.isScene) {
      if (this.background) {
        if (this.background.isColor) _0x39d19d.background = this.background.toJSON();
        else this.background.isTexture && (_0x39d19d.background = this.background.toJSON(_0x626970).uuid);
      }
      this.environment &&
        this.environment.isTexture &&
        this.environment.isRenderTargetTexture !== true &&
        (_0x39d19d.environment = this.environment.toJSON(_0x626970).uuid);
    } else {
      if (this.isMesh || this.isLine || this.isPoints) {
        _0x39d19d.geometry = _0x290c34(_0x626970.geometries, this.geometry);
        const _0x1988a9 = this.geometry.parameters;
        if (_0x1988a9 !== undefined && _0x1988a9.shapes !== undefined) {
          const _0x326cf1 = _0x1988a9.shapes;
          if (Array.isArray(_0x326cf1))
            for (let _0x346bfe = 0, _0x41f49a = _0x326cf1.length; _0x346bfe < _0x41f49a; _0x346bfe++) {
              const _0x23f2e6 = _0x326cf1[_0x346bfe];
              _0x290c34(_0x626970.shapes, _0x23f2e6);
            }
          else _0x290c34(_0x626970.shapes, _0x326cf1);
        }
      }
    }
    this.isSkinnedMesh &&
      ((_0x39d19d.bindMode = this.bindMode),
      (_0x39d19d.bindMatrix = this.bindMatrix.toArray()),
      this.skeleton !== undefined &&
        (_0x290c34(_0x626970.skeletons, this.skeleton), (_0x39d19d.skeleton = this.skeleton.uuid)));
    if (this.material !== undefined) {
      if (Array.isArray(this.material)) {
        const _0x46b906 = [];
        for (let _0x2a19eb = 0, _0x4ab1a7 = this.material.length; _0x2a19eb < _0x4ab1a7; _0x2a19eb++) {
          _0x46b906.push(_0x290c34(_0x626970.materials, this.material[_0x2a19eb]));
        }
        _0x39d19d.material = _0x46b906;
      } else _0x39d19d.material = _0x290c34(_0x626970.materials, this.material);
    }
    if (this.children.length > 0) {
      _0x39d19d.children = [];
      for (let _0x2b6f4a = 0; _0x2b6f4a < this.children.length; _0x2b6f4a++) {
        _0x39d19d.children.push(this.children[_0x2b6f4a].toJSON(_0x626970).object);
      }
    }
    if (this.animations.length > 0) {
      _0x39d19d.animations = [];
      for (let _0x2368b3 = 0; _0x2368b3 < this.animations.length; _0x2368b3++) {
        const _0x825ed2 = this.animations[_0x2368b3];
        _0x39d19d.animations.push(_0x290c34(_0x626970.animations, _0x825ed2));
      }
    }
    if (_0x118bf9) {
      const _0xbce61d = _0x4d3eae(_0x626970.geometries),
        _0x2dff88 = _0x4d3eae(_0x626970.materials),
        _0x550b2f = _0x4d3eae(_0x626970.textures),
        _0x58539a = _0x4d3eae(_0x626970.images),
        _0x2d1e54 = _0x4d3eae(_0x626970.shapes),
        _0x543447 = _0x4d3eae(_0x626970.skeletons),
        _0x5a52ee = _0x4d3eae(_0x626970.animations),
        _0x1270ea = _0x4d3eae(_0x626970.nodes);
      if (_0xbce61d.length > 0) _0x5b4343.geometries = _0xbce61d;
      if (_0x2dff88.length > 0) _0x5b4343.materials = _0x2dff88;
      if (_0x550b2f.length > 0) _0x5b4343.textures = _0x550b2f;
      if (_0x58539a.length > 0) _0x5b4343.images = _0x58539a;
      if (_0x2d1e54.length > 0) _0x5b4343.shapes = _0x2d1e54;
      if (_0x543447.length > 0) _0x5b4343.skeletons = _0x543447;
      if (_0x5a52ee.length > 0) _0x5b4343.animations = _0x5a52ee;
      if (_0x1270ea.length > 0) _0x5b4343.nodes = _0x1270ea;
    }
    _0x5b4343.object = _0x39d19d;
    return _0x5b4343;
    function _0x4d3eae(_0x527d38) {
      const _0x1e3585 = [];
      for (const _0x521781 in _0x527d38) {
        const _0x391614 = _0x527d38[_0x521781];
        (delete _0x391614.metadata, _0x1e3585.push(_0x391614));
      }
      return _0x1e3585;
    }
  }
  ['clone'](_0xee1bd3) {
    return new this['constructor']().copy(this, _0xee1bd3);
  }
  ['copy'](_0x3973f0, _0x556c8f = true) {
    ((this.name = _0x3973f0.name),
      this.up.copy(_0x3973f0.up),
      this.position.copy(_0x3973f0.position),
      (this.rotation.order = _0x3973f0.rotation.order),
      this.quaternion.copy(_0x3973f0.quaternion),
      this.scale.copy(_0x3973f0.scale),
      this.matrix.copy(_0x3973f0.matrix),
      this.matrixWorld.copy(_0x3973f0.matrixWorld),
      (this.matrixAutoUpdate = _0x3973f0.matrixAutoUpdate),
      (this.matrixWorldAutoUpdate = _0x3973f0.matrixWorldAutoUpdate),
      (this.matrixWorldNeedsUpdate = _0x3973f0.matrixWorldNeedsUpdate),
      (this.layers.mask = _0x3973f0.layers.mask),
      (this.visible = _0x3973f0.visible),
      (this.castShadow = _0x3973f0.castShadow),
      (this.receiveShadow = _0x3973f0.receiveShadow),
      (this.frustumCulled = _0x3973f0.frustumCulled),
      (this.renderOrder = _0x3973f0.renderOrder),
      (this.animations = _0x3973f0.animations.slice()),
      (this.userData = JSON.parse(JSON.stringify(_0x3973f0.userData))));
    if (_0x556c8f === true)
      for (let _0xf514 = 0; _0xf514 < _0x3973f0.children.length; _0xf514++) {
        const _0xf89fc9 = _0x3973f0.children[_0xf514];
        this.add(_0xf89fc9.clone());
      }
    return this;
  }
}
((Object3D.DEFAULT_UP = new Vector3(0, 1, 0)),
  (Object3D.DEFAULT_MATRIX_AUTO_UPDATE = true),
  (Object3D.DEFAULT_MATRIX_WORLD_AUTO_UPDATE = true));
const _v0$1 = new Vector3(),
  _v1$3 = new Vector3(),
  _v2$2 = new Vector3(),
  _v3$2 = new Vector3(),
  _vab = new Vector3(),
  _vac = new Vector3(),
  _vbc = new Vector3(),
  _vap = new Vector3(),
  _vbp = new Vector3(),
  _vcp = new Vector3(),
  _v40 = new Vector4(),
  _v41 = new Vector4(),
  _v42 = new Vector4();
class Triangle {
  constructor(_0x437f26 = new Vector3(), _0x49f188 = new Vector3(), _0x24ff58 = new Vector3()) {
    ((this.a = _0x437f26), (this.b = _0x49f188), (this.c = _0x24ff58));
  }
  static ['getNormal'](_0x521db4, _0x5dd911, _0x18b406, _0x2a737d) {
    (_0x2a737d.subVectors(_0x18b406, _0x5dd911),
      _v0$1.subVectors(_0x521db4, _0x5dd911),
      _0x2a737d.cross(_v0$1));
    const _0x2abfc7 = _0x2a737d.lengthSq();
    if (_0x2abfc7 > 0) return _0x2a737d.multiplyScalar(1 / Math.sqrt(_0x2abfc7));
    return _0x2a737d.set(0, 0, 0);
  }
  static ['getBarycoord'](_0x294994, _0x643568, _0xcaf277, _0x5ddb1d, _0x4eceb2) {
    (_v0$1.subVectors(_0x5ddb1d, _0x643568),
      _v1$3.subVectors(_0xcaf277, _0x643568),
      _v2$2.subVectors(_0x294994, _0x643568));
    const _0x5811ca = _v0$1.dot(_v0$1),
      _0x38e812 = _v0$1.dot(_v1$3),
      _0x557c31 = _v0$1.dot(_v2$2),
      _0x15519c = _v1$3.dot(_v1$3),
      _0x3f32dc = _v1$3.dot(_v2$2),
      _0xe71164 = _0x5811ca * _0x15519c - _0x38e812 * _0x38e812;
    if (_0xe71164 === 0) return (_0x4eceb2.set(0, 0, 0), null);
    const _0x38aac8 = 1 / _0xe71164,
      _0x1920c8 = (_0x15519c * _0x557c31 - _0x38e812 * _0x3f32dc) * _0x38aac8,
      _0x439c97 = (_0x5811ca * _0x3f32dc - _0x38e812 * _0x557c31) * _0x38aac8;
    return _0x4eceb2.set(1 - _0x1920c8 - _0x439c97, _0x439c97, _0x1920c8);
  }
  static ['containsPoint'](_0x1b6977, _0x4da3c8, _0x13063a, _0xf74449) {
    if (this.getBarycoord(_0x1b6977, _0x4da3c8, _0x13063a, _0xf74449, _v3$2) === null) return false;
    return _v3$2.x >= 0 && _v3$2.y >= 0 && _v3$2.x + _v3$2.y <= 1;
  }
  static ['getInterpolation'](
    _0x349636,
    _0x339c83,
    _0x4c8bbb,
    _0x3f3d3a,
    _0x2abeab,
    _0x5c6c4a,
    _0x5c9214,
    _0x1bfea6,
  ) {
    if (this.getBarycoord(_0x349636, _0x339c83, _0x4c8bbb, _0x3f3d3a, _v3$2) === null) {
      ((_0x1bfea6.x = 0), (_0x1bfea6.y = 0));
      if ('z' in _0x1bfea6) _0x1bfea6.z = 0;
      if ('w' in _0x1bfea6) _0x1bfea6.w = 0;
      return null;
    }
    return (
      _0x1bfea6.setScalar(0),
      _0x1bfea6.addScaledVector(_0x2abeab, _v3$2.x),
      _0x1bfea6.addScaledVector(_0x5c6c4a, _v3$2.y),
      _0x1bfea6.addScaledVector(_0x5c9214, _v3$2.z),
      _0x1bfea6
    );
  }
  static ['getInterpolatedAttribute'](_0x5bdc2f, _0x42151d, _0x29f1f1, _0x3b2740, _0x543f16, _0xe6f560) {
    return (
      _v40.setScalar(0),
      _v41.setScalar(0),
      _v42.setScalar(0),
      _v40.fromBufferAttribute(_0x5bdc2f, _0x42151d),
      _v41.fromBufferAttribute(_0x5bdc2f, _0x29f1f1),
      _v42.fromBufferAttribute(_0x5bdc2f, _0x3b2740),
      _0xe6f560.setScalar(0),
      _0xe6f560.addScaledVector(_v40, _0x543f16.x),
      _0xe6f560.addScaledVector(_v41, _0x543f16.y),
      _0xe6f560.addScaledVector(_v42, _0x543f16.z),
      _0xe6f560
    );
  }
  static ['isFrontFacing'](_0x225942, _0x32c8b8, _0x26c265, _0x1a75ce) {
    return (
      _v0$1.subVectors(_0x26c265, _0x32c8b8),
      _v1$3.subVectors(_0x225942, _0x32c8b8),
      _v0$1.cross(_v1$3).dot(_0x1a75ce) < 0 ? true : false
    );
  }
  ['set'](_0x368e67, _0x13fec1, _0x3e2368) {
    return (this.a.copy(_0x368e67), this.b.copy(_0x13fec1), this.c.copy(_0x3e2368), this);
  }
  ['setFromPointsAndIndices'](_0x1abecb, _0x24091e, _0x40c2b8, _0x522535) {
    return (
      this.a.copy(_0x1abecb[_0x24091e]),
      this.b.copy(_0x1abecb[_0x40c2b8]),
      this.c.copy(_0x1abecb[_0x522535]),
      this
    );
  }
  ['setFromAttributeAndIndices'](_0x3daf19, _0xaa1bca, _0x4bb469, _0x4dc6e8) {
    return (
      this.a.fromBufferAttribute(_0x3daf19, _0xaa1bca),
      this.b.fromBufferAttribute(_0x3daf19, _0x4bb469),
      this.c.fromBufferAttribute(_0x3daf19, _0x4dc6e8),
      this
    );
  }
  ['clone']() {
    return new this['constructor']().copy(this);
  }
  ['copy'](_0x435aa5) {
    return (this.a.copy(_0x435aa5.a), this.b.copy(_0x435aa5.b), this.c.copy(_0x435aa5.c), this);
  }
  ['getArea']() {
    return (
      _v0$1.subVectors(this.c, this.b),
      _v1$3.subVectors(this.a, this.b),
      _v0$1.cross(_v1$3).length() * 0.5
    );
  }
  ['getMidpoint'](_0x2deead) {
    return _0x2deead
      .addVectors(this.a, this.b)
      .add(this.c)
      .multiplyScalar(1 / 3);
  }
  ['getNormal'](_0xa97491) {
    return Triangle.getNormal(this.a, this.b, this.c, _0xa97491);
  }
  ['getPlane'](_0x59ffdd) {
    return _0x59ffdd.setFromCoplanarPoints(this.a, this.b, this.c);
  }
  ['getBarycoord'](_0x22f887, _0x3a6ad7) {
    return Triangle.getBarycoord(_0x22f887, this.a, this.b, this.c, _0x3a6ad7);
  }
  ['getInterpolation'](_0x3b63f1, _0x5ea1bd, _0x26587e, _0x333b94, _0x8596f7) {
    return Triangle.getInterpolation(
      _0x3b63f1,
      this.a,
      this.b,
      this.c,
      _0x5ea1bd,
      _0x26587e,
      _0x333b94,
      _0x8596f7,
    );
  }
  ['containsPoint'](_0x36c07d) {
    return Triangle.containsPoint(_0x36c07d, this.a, this.b, this.c);
  }
  ['isFrontFacing'](_0x32575c) {
    return Triangle.isFrontFacing(this.a, this.b, this.c, _0x32575c);
  }
  ['intersectsBox'](_0x4da5f5) {
    return _0x4da5f5.intersectsTriangle(this);
  }
  ['closestPointToPoint'](_0xd6199d, _0x228ceb) {
    const _0x4095a2 = this.a,
      _0x543b63 = this.b,
      _0x667591 = this.c;
    let _0xf87e84, _0x2d7d92;
    (_vab.subVectors(_0x543b63, _0x4095a2),
      _vac.subVectors(_0x667591, _0x4095a2),
      _vap.subVectors(_0xd6199d, _0x4095a2));
    const _0x4b08b4 = _vab.dot(_vap),
      _0x4e5188 = _vac.dot(_vap);
    if (_0x4b08b4 <= 0 && _0x4e5188 <= 0) return _0x228ceb.copy(_0x4095a2);
    _vbp.subVectors(_0xd6199d, _0x543b63);
    const _0x18be55 = _vab.dot(_vbp),
      _0x6acefd = _vac.dot(_vbp);
    if (_0x18be55 >= 0 && _0x6acefd <= _0x18be55) return _0x228ceb.copy(_0x543b63);
    const _0x40ddb3 = _0x4b08b4 * _0x6acefd - _0x18be55 * _0x4e5188;
    if (_0x40ddb3 <= 0 && _0x4b08b4 >= 0 && _0x18be55 <= 0)
      return (
        (_0xf87e84 = _0x4b08b4 / (_0x4b08b4 - _0x18be55)),
        _0x228ceb.copy(_0x4095a2).addScaledVector(_vab, _0xf87e84)
      );
    _vcp.subVectors(_0xd6199d, _0x667591);
    const _0x15a7e6 = _vab.dot(_vcp),
      _0x3e1b80 = _vac.dot(_vcp);
    if (_0x3e1b80 >= 0 && _0x15a7e6 <= _0x3e1b80) return _0x228ceb.copy(_0x667591);
    const _0x37ff05 = _0x15a7e6 * _0x4e5188 - _0x4b08b4 * _0x3e1b80;
    if (_0x37ff05 <= 0 && _0x4e5188 >= 0 && _0x3e1b80 <= 0)
      return (
        (_0x2d7d92 = _0x4e5188 / (_0x4e5188 - _0x3e1b80)),
        _0x228ceb.copy(_0x4095a2).addScaledVector(_vac, _0x2d7d92)
      );
    const _0x1a61a0 = _0x18be55 * _0x3e1b80 - _0x15a7e6 * _0x6acefd;
    if (_0x1a61a0 <= 0 && _0x6acefd - _0x18be55 >= 0 && _0x15a7e6 - _0x3e1b80 >= 0)
      return (
        _vbc.subVectors(_0x667591, _0x543b63),
        (_0x2d7d92 = (_0x6acefd - _0x18be55) / (_0x6acefd - _0x18be55 + (_0x15a7e6 - _0x3e1b80))),
        _0x228ceb.copy(_0x543b63).addScaledVector(_vbc, _0x2d7d92)
      );
    const _0x2e89d6 = 1 / (_0x1a61a0 + _0x37ff05 + _0x40ddb3);
    return (
      (_0xf87e84 = _0x37ff05 * _0x2e89d6),
      (_0x2d7d92 = _0x40ddb3 * _0x2e89d6),
      _0x228ceb.copy(_0x4095a2).addScaledVector(_vab, _0xf87e84).addScaledVector(_vac, _0x2d7d92)
    );
  }
  ['equals'](_0x144443) {
    return _0x144443.a.equals(this.a) && _0x144443.b.equals(this.b) && _0x144443.c.equals(this.c);
  }
}
const _colorKeywords = {
    aliceblue: 0xf0f8ff,
    antiquewhite: 0xfaebd7,
    aqua: 0xffff,
    aquamarine: 0x7fffd4,
    azure: 0xf0ffff,
    beige: 0xf5f5dc,
    bisque: 0xffe4c4,
    black: 0,
    blanchedalmond: 0xffebcd,
    blue: 255,
    blueviolet: 0x8a2be2,
    brown: 0xa52a2a,
    burlywood: 0xdeb887,
    cadetblue: 0x5f9ea0,
    chartreuse: 0x7fff00,
    chocolate: 0xd2691e,
    coral: 0xff7f50,
    cornflowerblue: 0x6495ed,
    cornsilk: 0xfff8dc,
    crimson: 0xdc143c,
    cyan: 0xffff,
    darkblue: 139,
    darkcyan: 0x8b8b,
    darkgoldenrod: 0xb8860b,
    darkgray: 0xa9a9a9,
    darkgreen: 0x6400,
    darkgrey: 0xa9a9a9,
    darkkhaki: 0xbdb76b,
    darkmagenta: 0x8b008b,
    darkolivegreen: 0x556b2f,
    darkorange: 0xff8c00,
    darkorchid: 0x9932cc,
    darkred: 0x8b0000,
    darksalmon: 0xe9967a,
    darkseagreen: 0x8fbc8f,
    darkslateblue: 0x483d8b,
    darkslategray: 0x2f4f4f,
    darkslategrey: 0x2f4f4f,
    darkturquoise: 0xced1,
    darkviolet: 0x9400d3,
    deeppink: 0xff1493,
    deepskyblue: 0xbfff,
    dimgray: 0x696969,
    dimgrey: 0x696969,
    dodgerblue: 0x1e90ff,
    firebrick: 0xb22222,
    floralwhite: 0xfffaf0,
    forestgreen: 0x228b22,
    fuchsia: 0xff00ff,
    gainsboro: 0xdcdcdc,
    ghostwhite: 0xf8f8ff,
    gold: 0xffd700,
    goldenrod: 0xdaa520,
    gray: 0x808080,
    green: 0x8000,
    greenyellow: 0xadff2f,
    grey: 0x808080,
    honeydew: 0xf0fff0,
    hotpink: 0xff69b4,
    indianred: 0xcd5c5c,
    indigo: 0x4b0082,
    ivory: 0xfffff0,
    khaki: 0xf0e68c,
    lavender: 0xe6e6fa,
    lavenderblush: 0xfff0f5,
    lawngreen: 0x7cfc00,
    lemonchiffon: 0xfffacd,
    lightblue: 0xadd8e6,
    lightcoral: 0xf08080,
    lightcyan: 0xe0ffff,
    lightgoldenrodyellow: 0xfafad2,
    lightgray: 0xd3d3d3,
    lightgreen: 0x90ee90,
    lightgrey: 0xd3d3d3,
    lightpink: 0xffb6c1,
    lightsalmon: 0xffa07a,
    lightseagreen: 0x20b2aa,
    lightskyblue: 0x87cefa,
    lightslategray: 0x778899,
    lightslategrey: 0x778899,
    lightsteelblue: 0xb0c4de,
    lightyellow: 0xffffe0,
    lime: 0xff00,
    limegreen: 0x32cd32,
    linen: 0xfaf0e6,
    magenta: 0xff00ff,
    maroon: 0x800000,
    mediumaquamarine: 0x66cdaa,
    mediumblue: 205,
    mediumorchid: 0xba55d3,
    mediumpurple: 0x9370db,
    mediumseagreen: 0x3cb371,
    mediumslateblue: 0x7b68ee,
    mediumspringgreen: 0xfa9a,
    mediumturquoise: 0x48d1cc,
    mediumvioletred: 0xc71585,
    midnightblue: 0x191970,
    mintcream: 0xf5fffa,
    mistyrose: 0xffe4e1,
    moccasin: 0xffe4b5,
    navajowhite: 0xffdead,
    navy: 128,
    oldlace: 0xfdf5e6,
    olive: 0x808000,
    olivedrab: 0x6b8e23,
    orange: 0xffa500,
    orangered: 0xff4500,
    orchid: 0xda70d6,
    palegoldenrod: 0xeee8aa,
    palegreen: 0x98fb98,
    paleturquoise: 0xafeeee,
    palevioletred: 0xdb7093,
    papayawhip: 0xffefd5,
    peachpuff: 0xffdab9,
    peru: 0xcd853f,
    pink: 0xffc0cb,
    plum: 0xdda0dd,
    powderblue: 0xb0e0e6,
    purple: 0x800080,
    rebeccapurple: 0x663399,
    red: 0xff0000,
    rosybrown: 0xbc8f8f,
    royalblue: 0x4169e1,
    saddlebrown: 0x8b4513,
    salmon: 0xfa8072,
    sandybrown: 0xf4a460,
    seagreen: 0x2e8b57,
    seashell: 0xfff5ee,
    sienna: 0xa0522d,
    silver: 0xc0c0c0,
    skyblue: 0x87ceeb,
    slateblue: 0x6a5acd,
    slategray: 0x708090,
    slategrey: 0x708090,
    snow: 0xfffafa,
    springgreen: 0xff7f,
    steelblue: 0x4682b4,
    tan: 0xd2b48c,
    teal: 0x8080,
    thistle: 0xd8bfd8,
    tomato: 0xff6347,
    turquoise: 0x40e0d0,
    violet: 0xee82ee,
    wheat: 0xf5deb3,
    white: 0xffffff,
    whitesmoke: 0xf5f5f5,
    yellow: 0xffff00,
    yellowgreen: 0x9acd32,
  },
  _hslA = { h: 0, s: 0, l: 0 },
  _hslB = { h: 0, s: 0, l: 0 };
function hue2rgb(_0x5c26d9, _0x4722ff, _0x5eba29) {
  if (_0x5eba29 < 0) _0x5eba29 += 1;
  if (_0x5eba29 > 1) _0x5eba29 -= 1;
  if (_0x5eba29 < 1 / 6) return _0x5c26d9 + (_0x4722ff - _0x5c26d9) * 6 * _0x5eba29;
  if (_0x5eba29 < 1 / 2) return _0x4722ff;
  if (_0x5eba29 < 2 / 3) return _0x5c26d9 + (_0x4722ff - _0x5c26d9) * 6 * (2 / 3 - _0x5eba29);
  return _0x5c26d9;
}
class Color {
  constructor(_0x4f8764, _0x2aaaac, _0xbc7df0) {
    return (
      (this.isColor = true),
      (this.r = 1),
      (this.g = 1),
      (this.b = 1),
      this.set(_0x4f8764, _0x2aaaac, _0xbc7df0)
    );
  }
  ['set'](_0x4f9814, _0x30d876, _0x231c39) {
    if (_0x30d876 === undefined && _0x231c39 === undefined) {
      const _0x1a4092 = _0x4f9814;
      if (_0x1a4092 && _0x1a4092.isColor) this.copy(_0x1a4092);
      else {
        if (typeof _0x1a4092 === 'number') this.setHex(_0x1a4092);
        else typeof _0x1a4092 === 'string' && this.setStyle(_0x1a4092);
      }
    } else this.setRGB(_0x4f9814, _0x30d876, _0x231c39);
    return this;
  }
  ['setScalar'](_0x4d8c89) {
    return ((this.r = _0x4d8c89), (this.g = _0x4d8c89), (this.b = _0x4d8c89), this);
  }
  ['setHex'](_0x3e558b, _0x239b2a = SRGBColorSpace) {
    return (
      (_0x3e558b = Math.floor(_0x3e558b)),
      (this.r = ((_0x3e558b >> 16) & 255) / 255),
      (this.g = ((_0x3e558b >> 8) & 255) / 255),
      (this.b = (_0x3e558b & 255) / 255),
      ColorManagement.colorSpaceToWorking(this, _0x239b2a),
      this
    );
  }
  ['setRGB'](_0x11531f, _0x1e1c98, _0x1951cd, _0x4d4698 = ColorManagement.workingColorSpace) {
    return (
      (this.r = _0x11531f),
      (this.g = _0x1e1c98),
      (this.b = _0x1951cd),
      ColorManagement.colorSpaceToWorking(this, _0x4d4698),
      this
    );
  }
  ['setHSL'](_0x3cd9bf, _0x4e19f7, _0x5df726, _0x45e9f6 = ColorManagement.workingColorSpace) {
    ((_0x3cd9bf = euclideanModulo(_0x3cd9bf, 1)),
      (_0x4e19f7 = clamp(_0x4e19f7, 0, 1)),
      (_0x5df726 = clamp(_0x5df726, 0, 1)));
    if (_0x4e19f7 === 0) this.r = this.g = this.b = _0x5df726;
    else {
      const _0x46251f =
          _0x5df726 <= 0.5 ? _0x5df726 * (1 + _0x4e19f7) : _0x5df726 + _0x4e19f7 - _0x5df726 * _0x4e19f7,
        _0x52c7b4 = 2 * _0x5df726 - _0x46251f;
      ((this.r = hue2rgb(_0x52c7b4, _0x46251f, _0x3cd9bf + 1 / 3)),
        (this.g = hue2rgb(_0x52c7b4, _0x46251f, _0x3cd9bf)),
        (this.b = hue2rgb(_0x52c7b4, _0x46251f, _0x3cd9bf - 1 / 3)));
    }
    return (ColorManagement.colorSpaceToWorking(this, _0x45e9f6), this);
  }
  ['setStyle'](_0x437fab, _0x23d98f = SRGBColorSpace) {
    function _0x36f46f(_0x3b5cef) {
      if (_0x3b5cef === undefined) return;
      parseFloat(_0x3b5cef) < 1 &&
        console.warn('THREE.Color: Alpha component of ' + _0x437fab + ' will be ignored.');
    }
    let _0x5dcd58;
    if ((_0x5dcd58 = /^(\w+)\(([^\)]*)\)/.exec(_0x437fab))) {
      let _0x42e0ac;
      const _0x323343 = _0x5dcd58[1],
        _0x44ffc7 = _0x5dcd58[2];
      switch (_0x323343) {
        case 'rgb':
        case 'rgba':
          if ((_0x42e0ac = /^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(_0x44ffc7)))
            return (
              _0x36f46f(_0x42e0ac[4]),
              this.setRGB(
                Math.min(255, parseInt(_0x42e0ac[1], 10)) / 255,
                Math.min(255, parseInt(_0x42e0ac[2], 10)) / 255,
                Math.min(255, parseInt(_0x42e0ac[3], 10)) / 255,
                _0x23d98f,
              )
            );
          if (
            (_0x42e0ac = /^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(_0x44ffc7))
          )
            return (
              _0x36f46f(_0x42e0ac[4]),
              this.setRGB(
                Math.min(100, parseInt(_0x42e0ac[1], 10)) / 100,
                Math.min(100, parseInt(_0x42e0ac[2], 10)) / 100,
                Math.min(100, parseInt(_0x42e0ac[3], 10)) / 100,
                _0x23d98f,
              )
            );
          break;
        case 'hsl':
        case 'hsla':
          if (
            (_0x42e0ac =
              /^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(
                _0x44ffc7,
              ))
          )
            return (
              _0x36f46f(_0x42e0ac[4]),
              this.setHSL(
                parseFloat(_0x42e0ac[1]) / 0x168,
                parseFloat(_0x42e0ac[2]) / 100,
                parseFloat(_0x42e0ac[3]) / 100,
                _0x23d98f,
              )
            );
          break;
        default:
          console.warn('THREE.Color: Unknown color model ' + _0x437fab);
      }
    } else {
      if ((_0x5dcd58 = /^\#([A-Fa-f\d]+)$/.exec(_0x437fab))) {
        const _0x2bf43c = _0x5dcd58[1],
          _0x190842 = _0x2bf43c.length;
        if (_0x190842 === 3)
          return this.setRGB(
            parseInt(_0x2bf43c.charAt(0), 16) / 15,
            parseInt(_0x2bf43c.charAt(1), 16) / 15,
            parseInt(_0x2bf43c.charAt(2), 16) / 15,
            _0x23d98f,
          );
        else {
          if (_0x190842 === 6) return this.setHex(parseInt(_0x2bf43c, 16), _0x23d98f);
          else console.warn('THREE.Color: Invalid hex color ' + _0x437fab);
        }
      } else {
        if (_0x437fab && _0x437fab.length > 0) return this.setColorName(_0x437fab, _0x23d98f);
      }
    }
    return this;
  }
  ['setColorName'](_0x1a7704, _0x7e1c4e = SRGBColorSpace) {
    const _0x114ca3 = _colorKeywords[_0x1a7704.toLowerCase()];
    return (
      _0x114ca3 !== undefined
        ? this.setHex(_0x114ca3, _0x7e1c4e)
        : console.warn('THREE.Color: Unknown color ' + _0x1a7704),
      this
    );
  }
  ['clone']() {
    return new this['constructor'](this.r, this.g, this.b);
  }
  ['copy'](_0x4b6824) {
    return ((this.r = _0x4b6824.r), (this.g = _0x4b6824.g), (this.b = _0x4b6824.b), this);
  }
  ['copySRGBToLinear'](_0x912917) {
    return (
      (this.r = SRGBToLinear(_0x912917.r)),
      (this.g = SRGBToLinear(_0x912917.g)),
      (this.b = SRGBToLinear(_0x912917.b)),
      this
    );
  }
  ['copyLinearToSRGB'](_0x3dde20) {
    return (
      (this.r = LinearToSRGB(_0x3dde20.r)),
      (this.g = LinearToSRGB(_0x3dde20.g)),
      (this.b = LinearToSRGB(_0x3dde20.b)),
      this
    );
  }
  ['convertSRGBToLinear']() {
    return (this.copySRGBToLinear(this), this);
  }
  ['convertLinearToSRGB']() {
    return (this.copyLinearToSRGB(this), this);
  }
  ['getHex'](_0x96a893 = SRGBColorSpace) {
    return (
      ColorManagement.workingToColorSpace(_color.copy(this), _0x96a893),
      Math.round(clamp(_color.r * 255, 0, 255)) * 0x10000 +
        Math.round(clamp(_color.g * 255, 0, 255)) * 0x100 +
        Math.round(clamp(_color.b * 255, 0, 255))
    );
  }
  ['getHexString'](_0xd1e6fc = SRGBColorSpace) {
    return ('000000' + this.getHex(_0xd1e6fc).toString(16)).slice(-6);
  }
  ['getHSL'](_0x4c2a18, _0x9aed50 = ColorManagement.workingColorSpace) {
    ColorManagement.workingToColorSpace(_color.copy(this), _0x9aed50);
    const _0xc46087 = _color.r,
      _0x4b2d7a = _color.g,
      _0x70fab3 = _color.b,
      _0x53fd72 = Math.max(_0xc46087, _0x4b2d7a, _0x70fab3),
      _0x35b1a6 = Math.min(_0xc46087, _0x4b2d7a, _0x70fab3);
    let _0x2d6f46, _0x330791;
    const _0x2afd34 = (_0x35b1a6 + _0x53fd72) / 2;
    if (_0x35b1a6 === _0x53fd72) ((_0x2d6f46 = 0), (_0x330791 = 0));
    else {
      const _0x2eb7c0 = _0x53fd72 - _0x35b1a6;
      _0x330791 =
        _0x2afd34 <= 0.5 ? _0x2eb7c0 / (_0x53fd72 + _0x35b1a6) : _0x2eb7c0 / (2 - _0x53fd72 - _0x35b1a6);
      switch (_0x53fd72) {
        case _0xc46087:
          _0x2d6f46 = (_0x4b2d7a - _0x70fab3) / _0x2eb7c0 + (_0x4b2d7a < _0x70fab3 ? 6 : 0);
          break;
        case _0x4b2d7a:
          _0x2d6f46 = (_0x70fab3 - _0xc46087) / _0x2eb7c0 + 2;
          break;
        case _0x70fab3:
          _0x2d6f46 = (_0xc46087 - _0x4b2d7a) / _0x2eb7c0 + 4;
          break;
      }
      _0x2d6f46 /= 6;
    }
    return ((_0x4c2a18.h = _0x2d6f46), (_0x4c2a18.s = _0x330791), (_0x4c2a18.l = _0x2afd34), _0x4c2a18);
  }
  ['getRGB'](_0x2c65ce, _0x2477ab = ColorManagement.workingColorSpace) {
    return (
      ColorManagement.workingToColorSpace(_color.copy(this), _0x2477ab),
      (_0x2c65ce.r = _color.r),
      (_0x2c65ce.g = _color.g),
      (_0x2c65ce.b = _color.b),
      _0x2c65ce
    );
  }
  ['getStyle'](_0x441789 = SRGBColorSpace) {
    ColorManagement.workingToColorSpace(_color.copy(this), _0x441789);
    const _0x7c66b6 = _color.r,
      _0x28fc1b = _color.g,
      _0x3c42b4 = _color.b;
    if (_0x441789 !== SRGBColorSpace)
      return (
        'color(' +
        _0x441789 +
        ' ' +
        _0x7c66b6.toFixed(3) +
        ' ' +
        _0x28fc1b.toFixed(3) +
        ' ' +
        _0x3c42b4.toFixed(3) +
        ')'
      );
    return (
      'rgb(' +
      Math.round(_0x7c66b6 * 255) +
      ',' +
      Math.round(_0x28fc1b * 255) +
      ',' +
      Math.round(_0x3c42b4 * 255) +
      ')'
    );
  }
  ['offsetHSL'](_0x2df1fa, _0x102760, _0x478438) {
    return (this.getHSL(_hslA), this.setHSL(_hslA.h + _0x2df1fa, _hslA.s + _0x102760, _hslA.l + _0x478438));
  }
  ['add'](_0x4b856b) {
    return ((this.r += _0x4b856b.r), (this.g += _0x4b856b.g), (this.b += _0x4b856b.b), this);
  }
  ['addColors'](_0x2ecb98, _0x1e1104) {
    return (
      (this.r = _0x2ecb98.r + _0x1e1104.r),
      (this.g = _0x2ecb98.g + _0x1e1104.g),
      (this.b = _0x2ecb98.b + _0x1e1104.b),
      this
    );
  }
  ['addScalar'](_0x17207d) {
    return ((this.r += _0x17207d), (this.g += _0x17207d), (this.b += _0x17207d), this);
  }
  ['sub'](_0x51cb4c) {
    return (
      (this.r = Math.max(0, this.r - _0x51cb4c.r)),
      (this.g = Math.max(0, this.g - _0x51cb4c.g)),
      (this.b = Math.max(0, this.b - _0x51cb4c.b)),
      this
    );
  }
  ['multiply'](_0x4c3b73) {
    return ((this.r *= _0x4c3b73.r), (this.g *= _0x4c3b73.g), (this.b *= _0x4c3b73.b), this);
  }
  ['multiplyScalar'](_0x2b61e2) {
    return ((this.r *= _0x2b61e2), (this.g *= _0x2b61e2), (this.b *= _0x2b61e2), this);
  }
  ['lerp'](_0x49fd4e, _0x197aa4) {
    return (
      (this.r += (_0x49fd4e.r - this.r) * _0x197aa4),
      (this.g += (_0x49fd4e.g - this.g) * _0x197aa4),
      (this.b += (_0x49fd4e.b - this.b) * _0x197aa4),
      this
    );
  }
  ['lerpColors'](_0x4db3ed, _0x780142, _0x97e5d3) {
    return (
      (this.r = _0x4db3ed.r + (_0x780142.r - _0x4db3ed.r) * _0x97e5d3),
      (this.g = _0x4db3ed.g + (_0x780142.g - _0x4db3ed.g) * _0x97e5d3),
      (this.b = _0x4db3ed.b + (_0x780142.b - _0x4db3ed.b) * _0x97e5d3),
      this
    );
  }
  ['lerpHSL'](_0x507078, _0x117229) {
    (this.getHSL(_hslA), _0x507078.getHSL(_hslB));
    const _0xb04e17 = lerp(_hslA.h, _hslB.h, _0x117229),
      _0x21bf9e = lerp(_hslA.s, _hslB.s, _0x117229),
      _0x5c77d4 = lerp(_hslA.l, _hslB.l, _0x117229);
    return (this.setHSL(_0xb04e17, _0x21bf9e, _0x5c77d4), this);
  }
  ['setFromVector3'](_0xaf78f) {
    return ((this.r = _0xaf78f.x), (this.g = _0xaf78f.y), (this.b = _0xaf78f.z), this);
  }
  ['applyMatrix3'](_0xbd9087) {
    const _0x1c2903 = this.r,
      _0x4994c0 = this.g,
      _0x322d5f = this.b,
      _0x3b89b1 = _0xbd9087.elements;
    return (
      (this.r = _0x3b89b1[0] * _0x1c2903 + _0x3b89b1[3] * _0x4994c0 + _0x3b89b1[6] * _0x322d5f),
      (this.g = _0x3b89b1[1] * _0x1c2903 + _0x3b89b1[4] * _0x4994c0 + _0x3b89b1[7] * _0x322d5f),
      (this.b = _0x3b89b1[2] * _0x1c2903 + _0x3b89b1[5] * _0x4994c0 + _0x3b89b1[8] * _0x322d5f),
      this
    );
  }
  ['equals'](_0xbc68eb) {
    return _0xbc68eb.r === this.r && _0xbc68eb.g === this.g && _0xbc68eb.b === this.b;
  }
  ['fromArray'](_0x4073f7, _0x3329eb = 0) {
    return (
      (this.r = _0x4073f7[_0x3329eb]),
      (this.g = _0x4073f7[_0x3329eb + 1]),
      (this.b = _0x4073f7[_0x3329eb + 2]),
      this
    );
  }
  ['toArray'](_0x17de39 = [], _0x10e7b3 = 0) {
    return (
      (_0x17de39[_0x10e7b3] = this.r),
      (_0x17de39[_0x10e7b3 + 1] = this.g),
      (_0x17de39[_0x10e7b3 + 2] = this.b),
      _0x17de39
    );
  }
  ['fromBufferAttribute'](_0x56932d, _0x4719bc) {
    return (
      (this.r = _0x56932d.getX(_0x4719bc)),
      (this.g = _0x56932d.getY(_0x4719bc)),
      (this.b = _0x56932d.getZ(_0x4719bc)),
      this
    );
  }
  ['toJSON']() {
    return this.getHex();
  }
  *[Symbol.iterator]() {
    (yield this.r, yield this.g, yield this.b);
  }
}
const _color = new Color();
Color.NAMES = _colorKeywords;
let _materialId = 0;
class Material extends EventDispatcher {
  constructor() {
    (super(),
      (this.isMaterial = true),
      Object.defineProperty(this, 'id', { value: _materialId++ }),
      (this.uuid = generateUUID()),
      (this.name = ''),
      (this.type = 'Material'),
      (this.blending = NormalBlending),
      (this.side = FrontSide),
      (this.vertexColors = false),
      (this.opacity = 1),
      (this.transparent = false),
      (this.alphaHash = false),
      (this.blendSrc = SrcAlphaFactor),
      (this.blendDst = OneMinusSrcAlphaFactor),
      (this.blendEquation = AddEquation),
      (this.blendSrcAlpha = null),
      (this.blendDstAlpha = null),
      (this.blendEquationAlpha = null),
      (this.blendColor = new Color(0, 0, 0)),
      (this.blendAlpha = 0),
      (this.depthFunc = LessEqualDepth),
      (this.depthTest = true),
      (this.depthWrite = true),
      (this.stencilWriteMask = 255),
      (this.stencilFunc = AlwaysStencilFunc),
      (this.stencilRef = 0),
      (this.stencilFuncMask = 255),
      (this.stencilFail = KeepStencilOp),
      (this.stencilZFail = KeepStencilOp),
      (this.stencilZPass = KeepStencilOp),
      (this.stencilWrite = false),
      (this.clippingPlanes = null),
      (this.clipIntersection = false),
      (this.clipShadows = false),
      (this.shadowSide = null),
      (this.colorWrite = true),
      (this.precision = null),
      (this.polygonOffset = false),
      (this.polygonOffsetFactor = 0),
      (this.polygonOffsetUnits = 0),
      (this.dithering = false),
      (this.alphaToCoverage = false),
      (this.premultipliedAlpha = false),
      (this.forceSinglePass = false),
      (this.allowOverride = true),
      (this.visible = true),
      (this.toneMapped = true),
      (this.userData = {}),
      (this.version = 0),
      (this._alphaTest = 0));
  }
  get ['alphaTest']() {
    return this._alphaTest;
  }
  set ['alphaTest'](_0x128da2) {
    (this._alphaTest > 0 !== _0x128da2 > 0 && this.version++, (this._alphaTest = _0x128da2));
  }
  ['onBeforeRender']() {}
  ['onBeforeCompile']() {}
  ['customProgramCacheKey']() {
    return this.onBeforeCompile.toString();
  }
  ['setValues'](_0xec34b2) {
    if (_0xec34b2 === undefined) return;
    for (const _0x5a1f84 in _0xec34b2) {
      const _0x2fffd5 = _0xec34b2[_0x5a1f84];
      if (_0x2fffd5 === undefined) {
        console.warn("THREE.Material: parameter '" + _0x5a1f84 + "' has value of undefined.");
        continue;
      }
      const _0x35141d = this[_0x5a1f84];
      if (_0x35141d === undefined) {
        console.warn("THREE.Material: '" + _0x5a1f84 + "' is not a property of THREE." + this.type + '.');
        continue;
      }
      if (_0x35141d && _0x35141d.isColor) _0x35141d.set(_0x2fffd5);
      else
        _0x35141d && _0x35141d.isVector3 && _0x2fffd5 && _0x2fffd5.isVector3
          ? _0x35141d.copy(_0x2fffd5)
          : (this[_0x5a1f84] = _0x2fffd5);
    }
  }
  ['toJSON'](_0x1fd0ab) {
    const _0x259dfd = _0x1fd0ab === undefined || typeof _0x1fd0ab === 'string';
    _0x259dfd && (_0x1fd0ab = { textures: {}, images: {} });
    const _0x41e42f = { metadata: { version: 4.7, type: 'Material', generator: 'Material.toJSON' } };
    ((_0x41e42f.uuid = this.uuid), (_0x41e42f.type = this.type));
    if (this.name !== '') _0x41e42f.name = this.name;
    if (this.color && this.color.isColor) _0x41e42f.color = this.color.getHex();
    if (this.roughness !== undefined) _0x41e42f.roughness = this.roughness;
    if (this.metalness !== undefined) _0x41e42f.metalness = this.metalness;
    if (this.sheen !== undefined) _0x41e42f.sheen = this.sheen;
    if (this.sheenColor && this.sheenColor.isColor) _0x41e42f.sheenColor = this.sheenColor.getHex();
    if (this.sheenRoughness !== undefined) _0x41e42f.sheenRoughness = this.sheenRoughness;
    if (this.emissive && this.emissive.isColor) _0x41e42f.emissive = this.emissive.getHex();
    if (this.emissiveIntensity !== undefined && this.emissiveIntensity !== 1)
      _0x41e42f.emissiveIntensity = this.emissiveIntensity;
    if (this.specular && this.specular.isColor) _0x41e42f.specular = this.specular.getHex();
    if (this.specularIntensity !== undefined) _0x41e42f.specularIntensity = this.specularIntensity;
    if (this.specularColor && this.specularColor.isColor)
      _0x41e42f.specularColor = this.specularColor.getHex();
    if (this.shininess !== undefined) _0x41e42f.shininess = this.shininess;
    if (this.clearcoat !== undefined) _0x41e42f.clearcoat = this.clearcoat;
    if (this.clearcoatRoughness !== undefined) _0x41e42f.clearcoatRoughness = this.clearcoatRoughness;
    this.clearcoatMap &&
      this.clearcoatMap.isTexture &&
      (_0x41e42f.clearcoatMap = this.clearcoatMap.toJSON(_0x1fd0ab).uuid);
    this.clearcoatRoughnessMap &&
      this.clearcoatRoughnessMap.isTexture &&
      (_0x41e42f.clearcoatRoughnessMap = this.clearcoatRoughnessMap.toJSON(_0x1fd0ab).uuid);
    this.clearcoatNormalMap &&
      this.clearcoatNormalMap.isTexture &&
      ((_0x41e42f.clearcoatNormalMap = this.clearcoatNormalMap.toJSON(_0x1fd0ab).uuid),
      (_0x41e42f.clearcoatNormalScale = this.clearcoatNormalScale.toArray()));
    this.sheenColorMap &&
      this.sheenColorMap.isTexture &&
      (_0x41e42f.sheenColorMap = this.sheenColorMap.toJSON(_0x1fd0ab).uuid);
    this.sheenRoughnessMap &&
      this.sheenRoughnessMap.isTexture &&
      (_0x41e42f.sheenRoughnessMap = this.sheenRoughnessMap.toJSON(_0x1fd0ab).uuid);
    if (this.dispersion !== undefined) _0x41e42f.dispersion = this.dispersion;
    if (this.iridescence !== undefined) _0x41e42f.iridescence = this.iridescence;
    if (this.iridescenceIOR !== undefined) _0x41e42f.iridescenceIOR = this.iridescenceIOR;
    if (this.iridescenceThicknessRange !== undefined)
      _0x41e42f.iridescenceThicknessRange = this.iridescenceThicknessRange;
    this.iridescenceMap &&
      this.iridescenceMap.isTexture &&
      (_0x41e42f.iridescenceMap = this.iridescenceMap.toJSON(_0x1fd0ab).uuid);
    this.iridescenceThicknessMap &&
      this.iridescenceThicknessMap.isTexture &&
      (_0x41e42f.iridescenceThicknessMap = this.iridescenceThicknessMap.toJSON(_0x1fd0ab).uuid);
    if (this.anisotropy !== undefined) _0x41e42f.anisotropy = this.anisotropy;
    if (this.anisotropyRotation !== undefined) _0x41e42f.anisotropyRotation = this.anisotropyRotation;
    this.anisotropyMap &&
      this.anisotropyMap.isTexture &&
      (_0x41e42f.anisotropyMap = this.anisotropyMap.toJSON(_0x1fd0ab).uuid);
    if (this.map && this.map.isTexture) _0x41e42f.map = this.map.toJSON(_0x1fd0ab).uuid;
    if (this.matcap && this.matcap.isTexture) _0x41e42f.matcap = this.matcap.toJSON(_0x1fd0ab).uuid;
    if (this.alphaMap && this.alphaMap.isTexture) _0x41e42f.alphaMap = this.alphaMap.toJSON(_0x1fd0ab).uuid;
    this.lightMap &&
      this.lightMap.isTexture &&
      ((_0x41e42f.lightMap = this.lightMap.toJSON(_0x1fd0ab).uuid),
      (_0x41e42f.lightMapIntensity = this.lightMapIntensity));
    this.aoMap &&
      this.aoMap.isTexture &&
      ((_0x41e42f.aoMap = this.aoMap.toJSON(_0x1fd0ab).uuid),
      (_0x41e42f.aoMapIntensity = this.aoMapIntensity));
    this.bumpMap &&
      this.bumpMap.isTexture &&
      ((_0x41e42f.bumpMap = this.bumpMap.toJSON(_0x1fd0ab).uuid), (_0x41e42f.bumpScale = this.bumpScale));
    this.normalMap &&
      this.normalMap.isTexture &&
      ((_0x41e42f.normalMap = this.normalMap.toJSON(_0x1fd0ab).uuid),
      (_0x41e42f.normalMapType = this.normalMapType),
      (_0x41e42f.normalScale = this.normalScale.toArray()));
    this.displacementMap &&
      this.displacementMap.isTexture &&
      ((_0x41e42f.displacementMap = this.displacementMap.toJSON(_0x1fd0ab).uuid),
      (_0x41e42f.displacementScale = this.displacementScale),
      (_0x41e42f.displacementBias = this.displacementBias));
    if (this.roughnessMap && this.roughnessMap.isTexture)
      _0x41e42f.roughnessMap = this.roughnessMap.toJSON(_0x1fd0ab).uuid;
    if (this.metalnessMap && this.metalnessMap.isTexture)
      _0x41e42f.metalnessMap = this.metalnessMap.toJSON(_0x1fd0ab).uuid;
    if (this.emissiveMap && this.emissiveMap.isTexture)
      _0x41e42f.emissiveMap = this.emissiveMap.toJSON(_0x1fd0ab).uuid;
    if (this.specularMap && this.specularMap.isTexture)
      _0x41e42f.specularMap = this.specularMap.toJSON(_0x1fd0ab).uuid;
    if (this.specularIntensityMap && this.specularIntensityMap.isTexture)
      _0x41e42f.specularIntensityMap = this.specularIntensityMap.toJSON(_0x1fd0ab).uuid;
    if (this.specularColorMap && this.specularColorMap.isTexture)
      _0x41e42f.specularColorMap = this.specularColorMap.toJSON(_0x1fd0ab).uuid;
    if (this.envMap && this.envMap.isTexture) {
      _0x41e42f.envMap = this.envMap.toJSON(_0x1fd0ab).uuid;
      if (this.combine !== undefined) _0x41e42f.combine = this.combine;
    }
    if (this.envMapRotation !== undefined) _0x41e42f.envMapRotation = this.envMapRotation.toArray();
    if (this.envMapIntensity !== undefined) _0x41e42f.envMapIntensity = this.envMapIntensity;
    if (this.reflectivity !== undefined) _0x41e42f.reflectivity = this.reflectivity;
    if (this.refractionRatio !== undefined) _0x41e42f.refractionRatio = this.refractionRatio;
    this.gradientMap &&
      this.gradientMap.isTexture &&
      (_0x41e42f.gradientMap = this.gradientMap.toJSON(_0x1fd0ab).uuid);
    if (this.transmission !== undefined) _0x41e42f.transmission = this.transmission;
    if (this.transmissionMap && this.transmissionMap.isTexture)
      _0x41e42f.transmissionMap = this.transmissionMap.toJSON(_0x1fd0ab).uuid;
    if (this.thickness !== undefined) _0x41e42f.thickness = this.thickness;
    if (this.thicknessMap && this.thicknessMap.isTexture)
      _0x41e42f.thicknessMap = this.thicknessMap.toJSON(_0x1fd0ab).uuid;
    if (this.attenuationDistance !== undefined && this.attenuationDistance !== Infinity)
      _0x41e42f.attenuationDistance = this.attenuationDistance;
    if (this.attenuationColor !== undefined) _0x41e42f.attenuationColor = this.attenuationColor.getHex();
    if (this.size !== undefined) _0x41e42f.size = this.size;
    if (this.shadowSide !== null) _0x41e42f.shadowSide = this.shadowSide;
    if (this.sizeAttenuation !== undefined) _0x41e42f.sizeAttenuation = this.sizeAttenuation;
    if (this.blending !== NormalBlending) _0x41e42f.blending = this.blending;
    if (this.side !== FrontSide) _0x41e42f.side = this.side;
    if (this.vertexColors === true) _0x41e42f.vertexColors = true;
    if (this.opacity < 1) _0x41e42f.opacity = this.opacity;
    if (this.transparent === true) _0x41e42f.transparent = true;
    if (this.blendSrc !== SrcAlphaFactor) _0x41e42f.blendSrc = this.blendSrc;
    if (this.blendDst !== OneMinusSrcAlphaFactor) _0x41e42f.blendDst = this.blendDst;
    if (this.blendEquation !== AddEquation) _0x41e42f.blendEquation = this.blendEquation;
    if (this.blendSrcAlpha !== null) _0x41e42f.blendSrcAlpha = this.blendSrcAlpha;
    if (this.blendDstAlpha !== null) _0x41e42f.blendDstAlpha = this.blendDstAlpha;
    if (this.blendEquationAlpha !== null) _0x41e42f.blendEquationAlpha = this.blendEquationAlpha;
    if (this.blendColor && this.blendColor.isColor) _0x41e42f.blendColor = this.blendColor.getHex();
    if (this.blendAlpha !== 0) _0x41e42f.blendAlpha = this.blendAlpha;
    if (this.depthFunc !== LessEqualDepth) _0x41e42f.depthFunc = this.depthFunc;
    if (this.depthTest === false) _0x41e42f.depthTest = this.depthTest;
    if (this.depthWrite === false) _0x41e42f.depthWrite = this.depthWrite;
    if (this.colorWrite === false) _0x41e42f.colorWrite = this.colorWrite;
    if (this.stencilWriteMask !== 255) _0x41e42f.stencilWriteMask = this.stencilWriteMask;
    if (this.stencilFunc !== AlwaysStencilFunc) _0x41e42f.stencilFunc = this.stencilFunc;
    if (this.stencilRef !== 0) _0x41e42f.stencilRef = this.stencilRef;
    if (this.stencilFuncMask !== 255) _0x41e42f.stencilFuncMask = this.stencilFuncMask;
    if (this.stencilFail !== KeepStencilOp) _0x41e42f.stencilFail = this.stencilFail;
    if (this.stencilZFail !== KeepStencilOp) _0x41e42f.stencilZFail = this.stencilZFail;
    if (this.stencilZPass !== KeepStencilOp) _0x41e42f.stencilZPass = this.stencilZPass;
    if (this.stencilWrite === true) _0x41e42f.stencilWrite = this.stencilWrite;
    if (this.rotation !== undefined && this.rotation !== 0) _0x41e42f.rotation = this.rotation;
    if (this.polygonOffset === true) _0x41e42f.polygonOffset = true;
    if (this.polygonOffsetFactor !== 0) _0x41e42f.polygonOffsetFactor = this.polygonOffsetFactor;
    if (this.polygonOffsetUnits !== 0) _0x41e42f.polygonOffsetUnits = this.polygonOffsetUnits;
    if (this.linewidth !== undefined && this.linewidth !== 1) _0x41e42f.linewidth = this.linewidth;
    if (this.dashSize !== undefined) _0x41e42f.dashSize = this.dashSize;
    if (this.gapSize !== undefined) _0x41e42f.gapSize = this.gapSize;
    if (this.scale !== undefined) _0x41e42f.scale = this.scale;
    if (this.dithering === true) _0x41e42f.dithering = true;
    if (this.alphaTest > 0) _0x41e42f.alphaTest = this.alphaTest;
    if (this.alphaHash === true) _0x41e42f.alphaHash = true;
    if (this.alphaToCoverage === true) _0x41e42f.alphaToCoverage = true;
    if (this.premultipliedAlpha === true) _0x41e42f.premultipliedAlpha = true;
    if (this.forceSinglePass === true) _0x41e42f.forceSinglePass = true;
    if (this.wireframe === true) _0x41e42f.wireframe = true;
    if (this.wireframeLinewidth > 1) _0x41e42f.wireframeLinewidth = this.wireframeLinewidth;
    if (this.wireframeLinecap !== 'round') _0x41e42f.wireframeLinecap = this.wireframeLinecap;
    if (this.wireframeLinejoin !== 'round') _0x41e42f.wireframeLinejoin = this.wireframeLinejoin;
    if (this.flatShading === true) _0x41e42f.flatShading = true;
    if (this.visible === false) _0x41e42f.visible = false;
    if (this.toneMapped === false) _0x41e42f.toneMapped = false;
    if (this.fog === false) _0x41e42f.fog = false;
    if (Object.keys(this.userData).length > 0) _0x41e42f.userData = this.userData;
    function _0x5e0374(_0x5c5b7b) {
      const _0x5ae987 = [];
      for (const _0x100071 in _0x5c5b7b) {
        const _0x3704b3 = _0x5c5b7b[_0x100071];
        (delete _0x3704b3.metadata, _0x5ae987.push(_0x3704b3));
      }
      return _0x5ae987;
    }
    if (_0x259dfd) {
      const _0x369f63 = _0x5e0374(_0x1fd0ab.textures),
        _0x196e05 = _0x5e0374(_0x1fd0ab.images);
      if (_0x369f63.length > 0) _0x41e42f.textures = _0x369f63;
      if (_0x196e05.length > 0) _0x41e42f.images = _0x196e05;
    }
    return _0x41e42f;
  }
  ['clone']() {
    return new this['constructor']().copy(this);
  }
  ['copy'](_0xa2c20f) {
    ((this.name = _0xa2c20f.name),
      (this.blending = _0xa2c20f.blending),
      (this.side = _0xa2c20f.side),
      (this.vertexColors = _0xa2c20f.vertexColors),
      (this.opacity = _0xa2c20f.opacity),
      (this.transparent = _0xa2c20f.transparent),
      (this.blendSrc = _0xa2c20f.blendSrc),
      (this.blendDst = _0xa2c20f.blendDst),
      (this.blendEquation = _0xa2c20f.blendEquation),
      (this.blendSrcAlpha = _0xa2c20f.blendSrcAlpha),
      (this.blendDstAlpha = _0xa2c20f.blendDstAlpha),
      (this.blendEquationAlpha = _0xa2c20f.blendEquationAlpha),
      this.blendColor.copy(_0xa2c20f.blendColor),
      (this.blendAlpha = _0xa2c20f.blendAlpha),
      (this.depthFunc = _0xa2c20f.depthFunc),
      (this.depthTest = _0xa2c20f.depthTest),
      (this.depthWrite = _0xa2c20f.depthWrite),
      (this.stencilWriteMask = _0xa2c20f.stencilWriteMask),
      (this.stencilFunc = _0xa2c20f.stencilFunc),
      (this.stencilRef = _0xa2c20f.stencilRef),
      (this.stencilFuncMask = _0xa2c20f.stencilFuncMask),
      (this.stencilFail = _0xa2c20f.stencilFail),
      (this.stencilZFail = _0xa2c20f.stencilZFail),
      (this.stencilZPass = _0xa2c20f.stencilZPass),
      (this.stencilWrite = _0xa2c20f.stencilWrite));
    const _0x4e1684 = _0xa2c20f.clippingPlanes;
    let _0x2f46e7 = null;
    if (_0x4e1684 !== null) {
      const _0x1b401a = _0x4e1684.length;
      _0x2f46e7 = new Array(_0x1b401a);
      for (let _0x3ab4ad = 0; _0x3ab4ad !== _0x1b401a; ++_0x3ab4ad) {
        _0x2f46e7[_0x3ab4ad] = _0x4e1684[_0x3ab4ad].clone();
      }
    }
    return (
      (this.clippingPlanes = _0x2f46e7),
      (this.clipIntersection = _0xa2c20f.clipIntersection),
      (this.clipShadows = _0xa2c20f.clipShadows),
      (this.shadowSide = _0xa2c20f.shadowSide),
      (this.colorWrite = _0xa2c20f.colorWrite),
      (this.precision = _0xa2c20f.precision),
      (this.polygonOffset = _0xa2c20f.polygonOffset),
      (this.polygonOffsetFactor = _0xa2c20f.polygonOffsetFactor),
      (this.polygonOffsetUnits = _0xa2c20f.polygonOffsetUnits),
      (this.dithering = _0xa2c20f.dithering),
      (this.alphaTest = _0xa2c20f.alphaTest),
      (this.alphaHash = _0xa2c20f.alphaHash),
      (this.alphaToCoverage = _0xa2c20f.alphaToCoverage),
      (this.premultipliedAlpha = _0xa2c20f.premultipliedAlpha),
      (this.forceSinglePass = _0xa2c20f.forceSinglePass),
      (this.visible = _0xa2c20f.visible),
      (this.toneMapped = _0xa2c20f.toneMapped),
      (this.userData = JSON.parse(JSON.stringify(_0xa2c20f.userData))),
      this
    );
  }
  ['dispose']() {
    this.dispatchEvent({ type: 'dispose' });
  }
  set ['needsUpdate'](_0x3a27a8) {
    if (_0x3a27a8 === true) this.version++;
  }
}
class MeshBasicMaterial extends Material {
  constructor(_0x11f8b0) {
    (super(),
      (this.isMeshBasicMaterial = true),
      (this.type = 'MeshBasicMaterial'),
      (this.color = new Color(0xffffff)),
      (this.map = null),
      (this.lightMap = null),
      (this.lightMapIntensity = 1),
      (this.aoMap = null),
      (this.aoMapIntensity = 1),
      (this.specularMap = null),
      (this.alphaMap = null),
      (this.envMap = null),
      (this.envMapRotation = new Euler()),
      (this.combine = MultiplyOperation),
      (this.reflectivity = 1),
      (this.refractionRatio = 0.98),
      (this.wireframe = false),
      (this.wireframeLinewidth = 1),
      (this.wireframeLinecap = 'round'),
      (this.wireframeLinejoin = 'round'),
      (this.fog = true),
      this.setValues(_0x11f8b0));
  }
  ['copy'](_0x2e8337) {
    return (
      super.copy(_0x2e8337),
      this.color.copy(_0x2e8337.color),
      (this.map = _0x2e8337.map),
      (this.lightMap = _0x2e8337.lightMap),
      (this.lightMapIntensity = _0x2e8337.lightMapIntensity),
      (this.aoMap = _0x2e8337.aoMap),
      (this.aoMapIntensity = _0x2e8337.aoMapIntensity),
      (this.specularMap = _0x2e8337.specularMap),
      (this.alphaMap = _0x2e8337.alphaMap),
      (this.envMap = _0x2e8337.envMap),
      this.envMapRotation.copy(_0x2e8337.envMapRotation),
      (this.combine = _0x2e8337.combine),
      (this.reflectivity = _0x2e8337.reflectivity),
      (this.refractionRatio = _0x2e8337.refractionRatio),
      (this.wireframe = _0x2e8337.wireframe),
      (this.wireframeLinewidth = _0x2e8337.wireframeLinewidth),
      (this.wireframeLinecap = _0x2e8337.wireframeLinecap),
      (this.wireframeLinejoin = _0x2e8337.wireframeLinejoin),
      (this.fog = _0x2e8337.fog),
      this
    );
  }
}
const _tables = _generateTables();
function _generateTables() {
  const _0x3b8e8e = new ArrayBuffer(4),
    _0x2172f0 = new Float32Array(_0x3b8e8e),
    _0xc19000 = new Uint32Array(_0x3b8e8e),
    _0x3b2db8 = new Uint32Array(0x200),
    _0x550504 = new Uint32Array(0x200);
  for (let _0x53834a = 0; _0x53834a < 0x100; ++_0x53834a) {
    const _0x362a1a = _0x53834a - 127;
    if (_0x362a1a < -27)
      ((_0x3b2db8[_0x53834a] = 0),
        (_0x3b2db8[_0x53834a | 0x100] = 0x8000),
        (_0x550504[_0x53834a] = 24),
        (_0x550504[_0x53834a | 0x100] = 24));
    else {
      if (_0x362a1a < -14)
        ((_0x3b2db8[_0x53834a] = 0x400 >> (-_0x362a1a - 14)),
          (_0x3b2db8[_0x53834a | 0x100] = (0x400 >> (-_0x362a1a - 14)) | 0x8000),
          (_0x550504[_0x53834a] = -_0x362a1a - 1),
          (_0x550504[_0x53834a | 0x100] = -_0x362a1a - 1));
      else {
        if (_0x362a1a <= 15)
          ((_0x3b2db8[_0x53834a] = (_0x362a1a + 15) << 10),
            (_0x3b2db8[_0x53834a | 0x100] = ((_0x362a1a + 15) << 10) | 0x8000),
            (_0x550504[_0x53834a] = 13),
            (_0x550504[_0x53834a | 0x100] = 13));
        else
          _0x362a1a < 128
            ? ((_0x3b2db8[_0x53834a] = 0x7c00),
              (_0x3b2db8[_0x53834a | 0x100] = 0xfc00),
              (_0x550504[_0x53834a] = 24),
              (_0x550504[_0x53834a | 0x100] = 24))
            : ((_0x3b2db8[_0x53834a] = 0x7c00),
              (_0x3b2db8[_0x53834a | 0x100] = 0xfc00),
              (_0x550504[_0x53834a] = 13),
              (_0x550504[_0x53834a | 0x100] = 13));
      }
    }
  }
  const _0x2d5048 = new Uint32Array(0x800),
    _0x5d470d = new Uint32Array(64),
    _0x1f8fb1 = new Uint32Array(64);
  for (let _0x49ade7 = 1; _0x49ade7 < 0x400; ++_0x49ade7) {
    let _0x3fc943 = _0x49ade7 << 13,
      _0x31fe09 = 0;
    while ((_0x3fc943 & 0x800000) === 0) {
      ((_0x3fc943 <<= 1), (_0x31fe09 -= 0x800000));
    }
    ((_0x3fc943 &= -0x800001), (_0x31fe09 += 0x38800000), (_0x2d5048[_0x49ade7] = _0x3fc943 | _0x31fe09));
  }
  for (let _0x1041ce = 0x400; _0x1041ce < 0x800; ++_0x1041ce) {
    _0x2d5048[_0x1041ce] = 0x38000000 + ((_0x1041ce - 0x400) << 13);
  }
  for (let _0x1ccaef = 1; _0x1ccaef < 31; ++_0x1ccaef) {
    _0x5d470d[_0x1ccaef] = _0x1ccaef << 23;
  }
  ((_0x5d470d[31] = 0x47800000), (_0x5d470d[32] = 0x80000000));
  for (let _0x2ad7ec = 33; _0x2ad7ec < 63; ++_0x2ad7ec) {
    _0x5d470d[_0x2ad7ec] = 0x80000000 + ((_0x2ad7ec - 32) << 23);
  }
  _0x5d470d[63] = 0xc7800000;
  for (let _0x19471d = 1; _0x19471d < 64; ++_0x19471d) {
    _0x19471d !== 32 && (_0x1f8fb1[_0x19471d] = 0x400);
  }
  return {
    floatView: _0x2172f0,
    uint32View: _0xc19000,
    baseTable: _0x3b2db8,
    shiftTable: _0x550504,
    mantissaTable: _0x2d5048,
    exponentTable: _0x5d470d,
    offsetTable: _0x1f8fb1,
  };
}
function toHalfFloat(_0x3e41be) {
  if (Math.abs(_0x3e41be) > 0xffe0) console.warn('THREE.DataUtils.toHalfFloat(): Value out of range.');
  ((_0x3e41be = clamp(_0x3e41be, -0xffe0, 0xffe0)), (_tables.floatView[0] = _0x3e41be));
  const _0x3799f6 = _tables.uint32View[0],
    _0x3ef5ef = (_0x3799f6 >> 23) & 0x1ff;
  return _tables.baseTable[_0x3ef5ef] + ((_0x3799f6 & 0x7fffff) >> _tables.shiftTable[_0x3ef5ef]);
}
function fromHalfFloat(_0x2a4c2a) {
  const _0x180d8d = _0x2a4c2a >> 10;
  return (
    (_tables.uint32View[0] =
      _tables.mantissaTable[_tables.offsetTable[_0x180d8d] + (_0x2a4c2a & 0x3ff)] +
      _tables.exponentTable[_0x180d8d]),
    _tables.floatView[0]
  );
}
class DataUtils {
  static ['toHalfFloat'](_0x13cf6e) {
    return toHalfFloat(_0x13cf6e);
  }
  static ['fromHalfFloat'](_0x3acca0) {
    return fromHalfFloat(_0x3acca0);
  }
}
const _vector$9 = new Vector3(),
  _vector2$1 = new Vector2();
let _id$2 = 0;
class BufferAttribute {
  constructor(_0x1d752f, _0x55f423, _0x3ae153 = false) {
    if (Array.isArray(_0x1d752f))
      throw new TypeError('THREE.BufferAttribute: array should be a Typed Array.');
    ((this.isBufferAttribute = true),
      Object.defineProperty(this, 'id', { value: _id$2++ }),
      (this.name = ''),
      (this.array = _0x1d752f),
      (this.itemSize = _0x55f423),
      (this.count = _0x1d752f !== undefined ? _0x1d752f.length / _0x55f423 : 0),
      (this.normalized = _0x3ae153),
      (this.usage = StaticDrawUsage),
      (this.updateRanges = []),
      (this.gpuType = FloatType),
      (this.version = 0));
  }
  ['onUploadCallback']() {}
  set ['needsUpdate'](_0x1eea15) {
    if (_0x1eea15 === true) this.version++;
  }
  ['setUsage'](_0x201548) {
    return ((this.usage = _0x201548), this);
  }
  ['addUpdateRange'](_0x253eda, _0x5f3185) {
    this.updateRanges.push({ start: _0x253eda, count: _0x5f3185 });
  }
  ['clearUpdateRanges']() {
    this.updateRanges.length = 0;
  }
  ['copy'](_0x373459) {
    return (
      (this.name = _0x373459.name),
      (this.array = new _0x373459['array'].constructor(_0x373459.array)),
      (this.itemSize = _0x373459.itemSize),
      (this.count = _0x373459.count),
      (this.normalized = _0x373459.normalized),
      (this.usage = _0x373459.usage),
      (this.gpuType = _0x373459.gpuType),
      this
    );
  }
  ['copyAt'](_0x26aac7, _0x1dbaaf, _0x1c4d09) {
    ((_0x26aac7 *= this.itemSize), (_0x1c4d09 *= _0x1dbaaf.itemSize));
    for (let _0x28054a = 0, _0x3b192f = this.itemSize; _0x28054a < _0x3b192f; _0x28054a++) {
      this.array[_0x26aac7 + _0x28054a] = _0x1dbaaf.array[_0x1c4d09 + _0x28054a];
    }
    return this;
  }
  ['copyArray'](_0x2a4b90) {
    return (this.array.set(_0x2a4b90), this);
  }
  ['applyMatrix3'](_0x24eb96) {
    if (this.itemSize === 2)
      for (let _0x5e8e25 = 0, _0x26223e = this.count; _0x5e8e25 < _0x26223e; _0x5e8e25++) {
        (_vector2$1.fromBufferAttribute(this, _0x5e8e25),
          _vector2$1.applyMatrix3(_0x24eb96),
          this.setXY(_0x5e8e25, _vector2$1.x, _vector2$1.y));
      }
    else {
      if (this.itemSize === 3)
        for (let _0x2ec00e = 0, _0x3fee4d = this.count; _0x2ec00e < _0x3fee4d; _0x2ec00e++) {
          (_vector$9.fromBufferAttribute(this, _0x2ec00e),
            _vector$9.applyMatrix3(_0x24eb96),
            this.setXYZ(_0x2ec00e, _vector$9.x, _vector$9.y, _vector$9.z));
        }
    }
    return this;
  }
  ['applyMatrix4'](_0x57ae6f) {
    for (let _0x77b893 = 0, _0x535586 = this.count; _0x77b893 < _0x535586; _0x77b893++) {
      (_vector$9.fromBufferAttribute(this, _0x77b893),
        _vector$9.applyMatrix4(_0x57ae6f),
        this.setXYZ(_0x77b893, _vector$9.x, _vector$9.y, _vector$9.z));
    }
    return this;
  }
  ['applyNormalMatrix'](_0x1dc66a) {
    for (let _0x5590e7 = 0, _0x159067 = this.count; _0x5590e7 < _0x159067; _0x5590e7++) {
      (_vector$9.fromBufferAttribute(this, _0x5590e7),
        _vector$9.applyNormalMatrix(_0x1dc66a),
        this.setXYZ(_0x5590e7, _vector$9.x, _vector$9.y, _vector$9.z));
    }
    return this;
  }
  ['transformDirection'](_0x25ff86) {
    for (let _0x49480b = 0, _0x3f8fe1 = this.count; _0x49480b < _0x3f8fe1; _0x49480b++) {
      (_vector$9.fromBufferAttribute(this, _0x49480b),
        _vector$9.transformDirection(_0x25ff86),
        this.setXYZ(_0x49480b, _vector$9.x, _vector$9.y, _vector$9.z));
    }
    return this;
  }
  ['set'](_0x3d8dd5, _0x2c211d = 0) {
    return (this.array.set(_0x3d8dd5, _0x2c211d), this);
  }
  ['getComponent'](_0x51e218, _0x10f2c3) {
    let _0x454220 = this.array[_0x51e218 * this.itemSize + _0x10f2c3];
    if (this.normalized) _0x454220 = denormalize(_0x454220, this.array);
    return _0x454220;
  }
  ['setComponent'](_0x3961a6, _0x5cc264, _0x555cc2) {
    if (this.normalized) _0x555cc2 = normalize(_0x555cc2, this.array);
    return ((this.array[_0x3961a6 * this.itemSize + _0x5cc264] = _0x555cc2), this);
  }
  ['getX'](_0x1d1fc1) {
    let _0x19fa5c = this.array[_0x1d1fc1 * this.itemSize];
    if (this.normalized) _0x19fa5c = denormalize(_0x19fa5c, this.array);
    return _0x19fa5c;
  }
  ['setX'](_0x1d200c, _0x39aabc) {
    if (this.normalized) _0x39aabc = normalize(_0x39aabc, this.array);
    return ((this.array[_0x1d200c * this.itemSize] = _0x39aabc), this);
  }
  ['getY'](_0x3def2a) {
    let _0x1a01bc = this.array[_0x3def2a * this.itemSize + 1];
    if (this.normalized) _0x1a01bc = denormalize(_0x1a01bc, this.array);
    return _0x1a01bc;
  }
  ['setY'](_0x1ba279, _0x37c1b8) {
    if (this.normalized) _0x37c1b8 = normalize(_0x37c1b8, this.array);
    return ((this.array[_0x1ba279 * this.itemSize + 1] = _0x37c1b8), this);
  }
  ['getZ'](_0x92e06d) {
    let _0x3547d7 = this.array[_0x92e06d * this.itemSize + 2];
    if (this.normalized) _0x3547d7 = denormalize(_0x3547d7, this.array);
    return _0x3547d7;
  }
  ['setZ'](_0x245e36, _0x27d96e) {
    if (this.normalized) _0x27d96e = normalize(_0x27d96e, this.array);
    return ((this.array[_0x245e36 * this.itemSize + 2] = _0x27d96e), this);
  }
  ['getW'](_0x16dd98) {
    let _0x3932ea = this.array[_0x16dd98 * this.itemSize + 3];
    if (this.normalized) _0x3932ea = denormalize(_0x3932ea, this.array);
    return _0x3932ea;
  }
  ['setW'](_0x3ac0c5, _0x3564e5) {
    if (this.normalized) _0x3564e5 = normalize(_0x3564e5, this.array);
    return ((this.array[_0x3ac0c5 * this.itemSize + 3] = _0x3564e5), this);
  }
  ['setXY'](_0xc3db26, _0x4e3c5c, _0x4158d5) {
    return (
      (_0xc3db26 *= this.itemSize),
      this.normalized &&
        ((_0x4e3c5c = normalize(_0x4e3c5c, this.array)), (_0x4158d5 = normalize(_0x4158d5, this.array))),
      (this.array[_0xc3db26 + 0] = _0x4e3c5c),
      (this.array[_0xc3db26 + 1] = _0x4158d5),
      this
    );
  }
  ['setXYZ'](_0x515a31, _0x1297ae, _0x3982fe, _0x168076) {
    return (
      (_0x515a31 *= this.itemSize),
      this.normalized &&
        ((_0x1297ae = normalize(_0x1297ae, this.array)),
        (_0x3982fe = normalize(_0x3982fe, this.array)),
        (_0x168076 = normalize(_0x168076, this.array))),
      (this.array[_0x515a31 + 0] = _0x1297ae),
      (this.array[_0x515a31 + 1] = _0x3982fe),
      (this.array[_0x515a31 + 2] = _0x168076),
      this
    );
  }
  ['setXYZW'](_0x1d2bab, _0x1cd869, _0x278546, _0xced867, _0x4ed22a) {
    return (
      (_0x1d2bab *= this.itemSize),
      this.normalized &&
        ((_0x1cd869 = normalize(_0x1cd869, this.array)),
        (_0x278546 = normalize(_0x278546, this.array)),
        (_0xced867 = normalize(_0xced867, this.array)),
        (_0x4ed22a = normalize(_0x4ed22a, this.array))),
      (this.array[_0x1d2bab + 0] = _0x1cd869),
      (this.array[_0x1d2bab + 1] = _0x278546),
      (this.array[_0x1d2bab + 2] = _0xced867),
      (this.array[_0x1d2bab + 3] = _0x4ed22a),
      this
    );
  }
  ['onUpload'](_0x3db220) {
    return ((this.onUploadCallback = _0x3db220), this);
  }
  ['clone']() {
    return new this['constructor'](this.array, this.itemSize).copy(this);
  }
  ['toJSON']() {
    const _0x46e873 = {
      itemSize: this.itemSize,
      type: this.array.constructor.name,
      array: Array.from(this.array),
      normalized: this.normalized,
    };
    if (this.name !== '') _0x46e873.name = this.name;
    if (this.usage !== StaticDrawUsage) _0x46e873.usage = this.usage;
    return _0x46e873;
  }
}
class Int8BufferAttribute extends BufferAttribute {
  constructor(_0x657b4f, _0x3768f9, _0x22413e) {
    super(new Int8Array(_0x657b4f), _0x3768f9, _0x22413e);
  }
}
class Uint8BufferAttribute extends BufferAttribute {
  constructor(_0xa4f059, _0x4ba09c, _0x12f4ce) {
    super(new Uint8Array(_0xa4f059), _0x4ba09c, _0x12f4ce);
  }
}
class Uint8ClampedBufferAttribute extends BufferAttribute {
  constructor(_0x3ad6c2, _0x373fc2, _0x5116ba) {
    super(new Uint8ClampedArray(_0x3ad6c2), _0x373fc2, _0x5116ba);
  }
}
class Int16BufferAttribute extends BufferAttribute {
  constructor(_0xfa7eca, _0x10b069, _0x437ce2) {
    super(new Int16Array(_0xfa7eca), _0x10b069, _0x437ce2);
  }
}
class Uint16BufferAttribute extends BufferAttribute {
  constructor(_0x48c8ef, _0x3e650d, _0xa905ee) {
    super(new Uint16Array(_0x48c8ef), _0x3e650d, _0xa905ee);
  }
}
class Int32BufferAttribute extends BufferAttribute {
  constructor(_0x19d0e3, _0x2d9748, _0x15286b) {
    super(new Int32Array(_0x19d0e3), _0x2d9748, _0x15286b);
  }
}
class Uint32BufferAttribute extends BufferAttribute {
  constructor(_0xfb4317, _0x325602, _0x491ac8) {
    super(new Uint32Array(_0xfb4317), _0x325602, _0x491ac8);
  }
}
class Float16BufferAttribute extends BufferAttribute {
  constructor(_0x1d9114, _0x17ba1f, _0x326e97) {
    (super(new Uint16Array(_0x1d9114), _0x17ba1f, _0x326e97), (this.isFloat16BufferAttribute = true));
  }
  ['getX'](_0x27492f) {
    let _0x210a38 = fromHalfFloat(this.array[_0x27492f * this.itemSize]);
    if (this.normalized) _0x210a38 = denormalize(_0x210a38, this.array);
    return _0x210a38;
  }
  ['setX'](_0x244e88, _0x2d0c56) {
    if (this.normalized) _0x2d0c56 = normalize(_0x2d0c56, this.array);
    return ((this.array[_0x244e88 * this.itemSize] = toHalfFloat(_0x2d0c56)), this);
  }
  ['getY'](_0x52df72) {
    let _0x4596ef = fromHalfFloat(this.array[_0x52df72 * this.itemSize + 1]);
    if (this.normalized) _0x4596ef = denormalize(_0x4596ef, this.array);
    return _0x4596ef;
  }
  ['setY'](_0x1dc0b0, _0x1cbbef) {
    if (this.normalized) _0x1cbbef = normalize(_0x1cbbef, this.array);
    return ((this.array[_0x1dc0b0 * this.itemSize + 1] = toHalfFloat(_0x1cbbef)), this);
  }
  ['getZ'](_0x1f08c3) {
    let _0xad6c03 = fromHalfFloat(this.array[_0x1f08c3 * this.itemSize + 2]);
    if (this.normalized) _0xad6c03 = denormalize(_0xad6c03, this.array);
    return _0xad6c03;
  }
  ['setZ'](_0x2b5147, _0x28130b) {
    if (this.normalized) _0x28130b = normalize(_0x28130b, this.array);
    return ((this.array[_0x2b5147 * this.itemSize + 2] = toHalfFloat(_0x28130b)), this);
  }
  ['getW'](_0x3c595f) {
    let _0xd7f840 = fromHalfFloat(this.array[_0x3c595f * this.itemSize + 3]);
    if (this.normalized) _0xd7f840 = denormalize(_0xd7f840, this.array);
    return _0xd7f840;
  }
  ['setW'](_0x27b893, _0x28a1ac) {
    if (this.normalized) _0x28a1ac = normalize(_0x28a1ac, this.array);
    return ((this.array[_0x27b893 * this.itemSize + 3] = toHalfFloat(_0x28a1ac)), this);
  }
  ['setXY'](_0x45dafc, _0x1eaba2, _0x5daacd) {
    return (
      (_0x45dafc *= this.itemSize),
      this.normalized &&
        ((_0x1eaba2 = normalize(_0x1eaba2, this.array)), (_0x5daacd = normalize(_0x5daacd, this.array))),
      (this.array[_0x45dafc + 0] = toHalfFloat(_0x1eaba2)),
      (this.array[_0x45dafc + 1] = toHalfFloat(_0x5daacd)),
      this
    );
  }
  ['setXYZ'](_0x4c4108, _0xdb2b6d, _0x52d8e6, _0x5e4794) {
    return (
      (_0x4c4108 *= this.itemSize),
      this.normalized &&
        ((_0xdb2b6d = normalize(_0xdb2b6d, this.array)),
        (_0x52d8e6 = normalize(_0x52d8e6, this.array)),
        (_0x5e4794 = normalize(_0x5e4794, this.array))),
      (this.array[_0x4c4108 + 0] = toHalfFloat(_0xdb2b6d)),
      (this.array[_0x4c4108 + 1] = toHalfFloat(_0x52d8e6)),
      (this.array[_0x4c4108 + 2] = toHalfFloat(_0x5e4794)),
      this
    );
  }
  ['setXYZW'](_0x180ffe, _0x3ca35f, _0xad67ce, _0x466d33, _0x541a6d) {
    return (
      (_0x180ffe *= this.itemSize),
      this.normalized &&
        ((_0x3ca35f = normalize(_0x3ca35f, this.array)),
        (_0xad67ce = normalize(_0xad67ce, this.array)),
        (_0x466d33 = normalize(_0x466d33, this.array)),
        (_0x541a6d = normalize(_0x541a6d, this.array))),
      (this.array[_0x180ffe + 0] = toHalfFloat(_0x3ca35f)),
      (this.array[_0x180ffe + 1] = toHalfFloat(_0xad67ce)),
      (this.array[_0x180ffe + 2] = toHalfFloat(_0x466d33)),
      (this.array[_0x180ffe + 3] = toHalfFloat(_0x541a6d)),
      this
    );
  }
}
class Float32BufferAttribute extends BufferAttribute {
  constructor(_0x418ce6, _0x467002, _0x2b21bc) {
    super(new Float32Array(_0x418ce6), _0x467002, _0x2b21bc);
  }
}
let _id$1 = 0;
const _m1 = new Matrix4(),
  _obj = new Object3D(),
  _offset = new Vector3(),
  _box$2 = new Box3(),
  _boxMorphTargets = new Box3(),
  _vector$8 = new Vector3();
class BufferGeometry extends EventDispatcher {
  constructor() {
    (super(),
      (this.isBufferGeometry = true),
      Object.defineProperty(this, 'id', { value: _id$1++ }),
      (this.uuid = generateUUID()),
      (this.name = ''),
      (this.type = 'BufferGeometry'),
      (this.index = null),
      (this.indirect = null),
      (this.attributes = {}),
      (this.morphAttributes = {}),
      (this.morphTargetsRelative = false),
      (this.groups = []),
      (this.boundingBox = null),
      (this.boundingSphere = null),
      (this.drawRange = { start: 0, count: Infinity }),
      (this.userData = {}));
  }
  ['getIndex']() {
    return this.index;
  }
  ['setIndex'](_0x564998) {
    return (
      Array.isArray(_0x564998)
        ? (this.index = new (arrayNeedsUint32(_0x564998) ? Uint32BufferAttribute : Uint16BufferAttribute)(
            _0x564998,
            1,
          ))
        : (this.index = _0x564998),
      this
    );
  }
  ['setIndirect'](_0x9a0b9e) {
    return ((this.indirect = _0x9a0b9e), this);
  }
  ['getIndirect']() {
    return this.indirect;
  }
  ['getAttribute'](_0x3a37cd) {
    return this.attributes[_0x3a37cd];
  }
  ['setAttribute'](_0x3e5326, _0x7138e5) {
    return ((this.attributes[_0x3e5326] = _0x7138e5), this);
  }
  ['deleteAttribute'](_0x21bfe9) {
    return (delete this.attributes[_0x21bfe9], this);
  }
  ['hasAttribute'](_0x1f332c) {
    return this.attributes[_0x1f332c] !== undefined;
  }
  ['addGroup'](_0xfd60dc, _0x38ef4c, _0x26c308 = 0) {
    this.groups.push({ start: _0xfd60dc, count: _0x38ef4c, materialIndex: _0x26c308 });
  }
  ['clearGroups']() {
    this.groups = [];
  }
  ['setDrawRange'](_0x1829f1, _0x4e6930) {
    ((this.drawRange.start = _0x1829f1), (this.drawRange.count = _0x4e6930));
  }
  ['applyMatrix4'](_0x3fdedd) {
    const _0x41b8e0 = this.attributes.position;
    _0x41b8e0 !== undefined && (_0x41b8e0.applyMatrix4(_0x3fdedd), (_0x41b8e0.needsUpdate = true));
    const _0x2e8110 = this.attributes.normal;
    if (_0x2e8110 !== undefined) {
      const _0x2f9c75 = new Matrix3().getNormalMatrix(_0x3fdedd);
      (_0x2e8110.applyNormalMatrix(_0x2f9c75), (_0x2e8110.needsUpdate = true));
    }
    const _0x1ea3b9 = this.attributes.tangent;
    return (
      _0x1ea3b9 !== undefined && (_0x1ea3b9.transformDirection(_0x3fdedd), (_0x1ea3b9.needsUpdate = true)),
      this.boundingBox !== null && this.computeBoundingBox(),
      this.boundingSphere !== null && this.computeBoundingSphere(),
      this
    );
  }
  ['applyQuaternion'](_0x6ac21e) {
    return (_m1.makeRotationFromQuaternion(_0x6ac21e), this.applyMatrix4(_m1), this);
  }
  ['rotateX'](_0x4589fe) {
    return (_m1.makeRotationX(_0x4589fe), this.applyMatrix4(_m1), this);
  }
  ['rotateY'](_0x388adb) {
    return (_m1.makeRotationY(_0x388adb), this.applyMatrix4(_m1), this);
  }
  ['rotateZ'](_0x4c6692) {
    return (_m1.makeRotationZ(_0x4c6692), this.applyMatrix4(_m1), this);
  }
  ['translate'](_0x17f1f9, _0x682043, _0x8aebd0) {
    return (_m1.makeTranslation(_0x17f1f9, _0x682043, _0x8aebd0), this.applyMatrix4(_m1), this);
  }
  ['scale'](_0x1d3c18, _0x14e30a, _0x1655b6) {
    return (_m1.makeScale(_0x1d3c18, _0x14e30a, _0x1655b6), this.applyMatrix4(_m1), this);
  }
  ['lookAt'](_0x2eb162) {
    return (_obj.lookAt(_0x2eb162), _obj.updateMatrix(), this.applyMatrix4(_obj.matrix), this);
  }
  ['center']() {
    return (
      this.computeBoundingBox(),
      this.boundingBox.getCenter(_offset).negate(),
      this.translate(_offset.x, _offset.y, _offset.z),
      this
    );
  }
  ['setFromPoints'](_0x13b778) {
    const _0x1f17e9 = this.getAttribute('position');
    if (_0x1f17e9 === undefined) {
      const _0x2ab0cc = [];
      for (let _0x1f0c79 = 0, _0x508caf = _0x13b778.length; _0x1f0c79 < _0x508caf; _0x1f0c79++) {
        const _0x4a6159 = _0x13b778[_0x1f0c79];
        _0x2ab0cc.push(_0x4a6159.x, _0x4a6159.y, _0x4a6159.z || 0);
      }
      this.setAttribute('position', new Float32BufferAttribute(_0x2ab0cc, 3));
    } else {
      const _0x56ae27 = Math.min(_0x13b778.length, _0x1f17e9.count);
      for (let _0x12c4a3 = 0; _0x12c4a3 < _0x56ae27; _0x12c4a3++) {
        const _0x48bbfd = _0x13b778[_0x12c4a3];
        _0x1f17e9.setXYZ(_0x12c4a3, _0x48bbfd.x, _0x48bbfd.y, _0x48bbfd.z || 0);
      }
      (_0x13b778.length > _0x1f17e9.count &&
        console.warn(
          'THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.',
        ),
        (_0x1f17e9.needsUpdate = true));
    }
    return this;
  }
  ['computeBoundingBox']() {
    this.boundingBox === null && (this.boundingBox = new Box3());
    const _0x5ef39f = this.attributes.position,
      _0x2c003a = this.morphAttributes.position;
    if (_0x5ef39f && _0x5ef39f.isGLBufferAttribute) {
      (console.error(
        'THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.',
        this,
      ),
        this.boundingBox.set(
          new Vector3(-Infinity, -Infinity, -Infinity),
          new Vector3(+Infinity, +Infinity, +Infinity),
        ));
      return;
    }
    if (_0x5ef39f !== undefined) {
      this.boundingBox.setFromBufferAttribute(_0x5ef39f);
      if (_0x2c003a)
        for (let _0x4f3972 = 0, _0x54b641 = _0x2c003a.length; _0x4f3972 < _0x54b641; _0x4f3972++) {
          const _0x27dc46 = _0x2c003a[_0x4f3972];
          (_box$2.setFromBufferAttribute(_0x27dc46),
            this.morphTargetsRelative
              ? (_vector$8.addVectors(this.boundingBox.min, _box$2.min),
                this.boundingBox.expandByPoint(_vector$8),
                _vector$8.addVectors(this.boundingBox.max, _box$2.max),
                this.boundingBox.expandByPoint(_vector$8))
              : (this.boundingBox.expandByPoint(_box$2.min), this.boundingBox.expandByPoint(_box$2.max)));
        }
    } else this.boundingBox.makeEmpty();
    (isNaN(this.boundingBox.min.x) || isNaN(this.boundingBox.min.y) || isNaN(this.boundingBox.min.z)) &&
      console.error(
        'THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',
        this,
      );
  }
  ['computeBoundingSphere']() {
    this.boundingSphere === null && (this.boundingSphere = new Sphere());
    const _0xe13162 = this.attributes.position,
      _0x213974 = this.morphAttributes.position;
    if (_0xe13162 && _0xe13162.isGLBufferAttribute) {
      (console.error(
        'THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.',
        this,
      ),
        this.boundingSphere.set(new Vector3(), Infinity));
      return;
    }
    if (_0xe13162) {
      const _0xd05d74 = this.boundingSphere.center;
      _box$2.setFromBufferAttribute(_0xe13162);
      if (_0x213974)
        for (let _0x53d1b8 = 0, _0x20580d = _0x213974.length; _0x53d1b8 < _0x20580d; _0x53d1b8++) {
          const _0x1336b4 = _0x213974[_0x53d1b8];
          (_boxMorphTargets.setFromBufferAttribute(_0x1336b4),
            this.morphTargetsRelative
              ? (_vector$8.addVectors(_box$2.min, _boxMorphTargets.min),
                _box$2.expandByPoint(_vector$8),
                _vector$8.addVectors(_box$2.max, _boxMorphTargets.max),
                _box$2.expandByPoint(_vector$8))
              : (_box$2.expandByPoint(_boxMorphTargets.min), _box$2.expandByPoint(_boxMorphTargets.max)));
        }
      _box$2.getCenter(_0xd05d74);
      let _0x3eb0b0 = 0;
      for (let _0xbcd2f1 = 0, _0x32a9c8 = _0xe13162.count; _0xbcd2f1 < _0x32a9c8; _0xbcd2f1++) {
        (_vector$8.fromBufferAttribute(_0xe13162, _0xbcd2f1),
          (_0x3eb0b0 = Math.max(_0x3eb0b0, _0xd05d74.distanceToSquared(_vector$8))));
      }
      if (_0x213974)
        for (let _0xae610d = 0, _0x598834 = _0x213974.length; _0xae610d < _0x598834; _0xae610d++) {
          const _0x206c5b = _0x213974[_0xae610d],
            _0x2be5f7 = this.morphTargetsRelative;
          for (let _0x3f84df = 0, _0x2ab7d5 = _0x206c5b.count; _0x3f84df < _0x2ab7d5; _0x3f84df++) {
            (_vector$8.fromBufferAttribute(_0x206c5b, _0x3f84df),
              _0x2be5f7 && (_offset.fromBufferAttribute(_0xe13162, _0x3f84df), _vector$8.add(_offset)),
              (_0x3eb0b0 = Math.max(_0x3eb0b0, _0xd05d74.distanceToSquared(_vector$8))));
          }
        }
      ((this.boundingSphere.radius = Math.sqrt(_0x3eb0b0)),
        isNaN(this.boundingSphere.radius) &&
          console.error(
            'THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',
            this,
          ));
    }
  }
  ['computeTangents']() {
    const _0x5d8c99 = this.index,
      _0x2eab85 = this.attributes;
    if (
      _0x5d8c99 === null ||
      _0x2eab85.position === undefined ||
      _0x2eab85.normal === undefined ||
      _0x2eab85.uv === undefined
    ) {
      console.error(
        'THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)',
      );
      return;
    }
    const _0x46c44d = _0x2eab85.position,
      _0x2ede9c = _0x2eab85.normal,
      _0x314549 = _0x2eab85.uv;
    this.hasAttribute('tangent') === false &&
      this.setAttribute('tangent', new BufferAttribute(new Float32Array(4 * _0x46c44d.count), 4));
    const _0x34711b = this.getAttribute('tangent'),
      _0x1bbc9d = [],
      _0x50dc15 = [];
    for (let _0x14c6bb = 0; _0x14c6bb < _0x46c44d.count; _0x14c6bb++) {
      ((_0x1bbc9d[_0x14c6bb] = new Vector3()), (_0x50dc15[_0x14c6bb] = new Vector3()));
    }
    const _0x292a0f = new Vector3(),
      _0x3ae5a9 = new Vector3(),
      _0x2f885a = new Vector3(),
      _0xb73377 = new Vector2(),
      _0x1e759a = new Vector2(),
      _0x30da98 = new Vector2(),
      _0x438d6b = new Vector3(),
      _0x3373ff = new Vector3();
    function _0x18fcb5(_0x4376ff, _0x1dda5f, _0xf9147b) {
      (_0x292a0f.fromBufferAttribute(_0x46c44d, _0x4376ff),
        _0x3ae5a9.fromBufferAttribute(_0x46c44d, _0x1dda5f),
        _0x2f885a.fromBufferAttribute(_0x46c44d, _0xf9147b),
        _0xb73377.fromBufferAttribute(_0x314549, _0x4376ff),
        _0x1e759a.fromBufferAttribute(_0x314549, _0x1dda5f),
        _0x30da98.fromBufferAttribute(_0x314549, _0xf9147b),
        _0x3ae5a9.sub(_0x292a0f),
        _0x2f885a.sub(_0x292a0f),
        _0x1e759a.sub(_0xb73377),
        _0x30da98.sub(_0xb73377));
      const _0x2a5ac0 = 1 / (_0x1e759a.x * _0x30da98.y - _0x30da98.x * _0x1e759a.y);
      if (!isFinite(_0x2a5ac0)) return;
      (_0x438d6b
        .copy(_0x3ae5a9)
        .multiplyScalar(_0x30da98.y)
        .addScaledVector(_0x2f885a, -_0x1e759a.y)
        .multiplyScalar(_0x2a5ac0),
        _0x3373ff
          .copy(_0x2f885a)
          .multiplyScalar(_0x1e759a.x)
          .addScaledVector(_0x3ae5a9, -_0x30da98.x)
          .multiplyScalar(_0x2a5ac0),
        _0x1bbc9d[_0x4376ff].add(_0x438d6b),
        _0x1bbc9d[_0x1dda5f].add(_0x438d6b),
        _0x1bbc9d[_0xf9147b].add(_0x438d6b),
        _0x50dc15[_0x4376ff].add(_0x3373ff),
        _0x50dc15[_0x1dda5f].add(_0x3373ff),
        _0x50dc15[_0xf9147b].add(_0x3373ff));
    }
    let _0x243ce6 = this.groups;
    _0x243ce6.length === 0 && (_0x243ce6 = [{ start: 0, count: _0x5d8c99.count }]);
    for (let _0x50fe1e = 0, _0x2d38d4 = _0x243ce6.length; _0x50fe1e < _0x2d38d4; ++_0x50fe1e) {
      const _0x19d859 = _0x243ce6[_0x50fe1e],
        _0x3923ba = _0x19d859.start,
        _0x2fbc07 = _0x19d859.count;
      for (
        let _0x12c76d = _0x3923ba, _0x1aec18 = _0x3923ba + _0x2fbc07;
        _0x12c76d < _0x1aec18;
        _0x12c76d += 3
      ) {
        _0x18fcb5(
          _0x5d8c99.getX(_0x12c76d + 0),
          _0x5d8c99.getX(_0x12c76d + 1),
          _0x5d8c99.getX(_0x12c76d + 2),
        );
      }
    }
    const _0x1816e3 = new Vector3(),
      _0x25e2ea = new Vector3(),
      _0x4c8173 = new Vector3(),
      _0x3bb9d = new Vector3();
    function _0x14712a(_0x4cee9a) {
      (_0x4c8173.fromBufferAttribute(_0x2ede9c, _0x4cee9a), _0x3bb9d.copy(_0x4c8173));
      const _0x5159cd = _0x1bbc9d[_0x4cee9a];
      (_0x1816e3.copy(_0x5159cd),
        _0x1816e3.sub(_0x4c8173.multiplyScalar(_0x4c8173.dot(_0x5159cd))).normalize(),
        _0x25e2ea.crossVectors(_0x3bb9d, _0x5159cd));
      const _0x338b70 = _0x25e2ea.dot(_0x50dc15[_0x4cee9a]),
        _0x154673 = _0x338b70 < 0 ? -1 : 1;
      _0x34711b.setXYZW(_0x4cee9a, _0x1816e3.x, _0x1816e3.y, _0x1816e3.z, _0x154673);
    }
    for (let _0x2a8ee7 = 0, _0x1d4bab = _0x243ce6.length; _0x2a8ee7 < _0x1d4bab; ++_0x2a8ee7) {
      const _0x5005f0 = _0x243ce6[_0x2a8ee7],
        _0x57baac = _0x5005f0.start,
        _0x42d791 = _0x5005f0.count;
      for (
        let _0x42c3a6 = _0x57baac, _0x55c495 = _0x57baac + _0x42d791;
        _0x42c3a6 < _0x55c495;
        _0x42c3a6 += 3
      ) {
        (_0x14712a(_0x5d8c99.getX(_0x42c3a6 + 0)),
          _0x14712a(_0x5d8c99.getX(_0x42c3a6 + 1)),
          _0x14712a(_0x5d8c99.getX(_0x42c3a6 + 2)));
      }
    }
  }
  ['computeVertexNormals']() {
    const _0x8eb1d8 = this.index,
      _0x50fd3f = this.getAttribute('position');
    if (_0x50fd3f !== undefined) {
      let _0xf96f41 = this.getAttribute('normal');
      if (_0xf96f41 === undefined)
        ((_0xf96f41 = new BufferAttribute(new Float32Array(_0x50fd3f.count * 3), 3)),
          this.setAttribute('normal', _0xf96f41));
      else
        for (let _0x5de34c = 0, _0x45156c = _0xf96f41.count; _0x5de34c < _0x45156c; _0x5de34c++) {
          _0xf96f41.setXYZ(_0x5de34c, 0, 0, 0);
        }
      const _0x3e05d7 = new Vector3(),
        _0x42427e = new Vector3(),
        _0x3771a6 = new Vector3(),
        _0x583446 = new Vector3(),
        _0xecf1e5 = new Vector3(),
        _0x343cab = new Vector3(),
        _0x11ff8b = new Vector3(),
        _0x591e70 = new Vector3();
      if (_0x8eb1d8)
        for (let _0x21a909 = 0, _0x2504fa = _0x8eb1d8.count; _0x21a909 < _0x2504fa; _0x21a909 += 3) {
          const _0x1398bb = _0x8eb1d8.getX(_0x21a909 + 0),
            _0x23188a = _0x8eb1d8.getX(_0x21a909 + 1),
            _0x3e7b50 = _0x8eb1d8.getX(_0x21a909 + 2);
          (_0x3e05d7.fromBufferAttribute(_0x50fd3f, _0x1398bb),
            _0x42427e.fromBufferAttribute(_0x50fd3f, _0x23188a),
            _0x3771a6.fromBufferAttribute(_0x50fd3f, _0x3e7b50),
            _0x11ff8b.subVectors(_0x3771a6, _0x42427e),
            _0x591e70.subVectors(_0x3e05d7, _0x42427e),
            _0x11ff8b.cross(_0x591e70),
            _0x583446.fromBufferAttribute(_0xf96f41, _0x1398bb),
            _0xecf1e5.fromBufferAttribute(_0xf96f41, _0x23188a),
            _0x343cab.fromBufferAttribute(_0xf96f41, _0x3e7b50),
            _0x583446.add(_0x11ff8b),
            _0xecf1e5.add(_0x11ff8b),
            _0x343cab.add(_0x11ff8b),
            _0xf96f41.setXYZ(_0x1398bb, _0x583446.x, _0x583446.y, _0x583446.z),
            _0xf96f41.setXYZ(_0x23188a, _0xecf1e5.x, _0xecf1e5.y, _0xecf1e5.z),
            _0xf96f41.setXYZ(_0x3e7b50, _0x343cab.x, _0x343cab.y, _0x343cab.z));
        }
      else
        for (let _0x304af3 = 0, _0x3135d5 = _0x50fd3f.count; _0x304af3 < _0x3135d5; _0x304af3 += 3) {
          (_0x3e05d7.fromBufferAttribute(_0x50fd3f, _0x304af3 + 0),
            _0x42427e.fromBufferAttribute(_0x50fd3f, _0x304af3 + 1),
            _0x3771a6.fromBufferAttribute(_0x50fd3f, _0x304af3 + 2),
            _0x11ff8b.subVectors(_0x3771a6, _0x42427e),
            _0x591e70.subVectors(_0x3e05d7, _0x42427e),
            _0x11ff8b.cross(_0x591e70),
            _0xf96f41.setXYZ(_0x304af3 + 0, _0x11ff8b.x, _0x11ff8b.y, _0x11ff8b.z),
            _0xf96f41.setXYZ(_0x304af3 + 1, _0x11ff8b.x, _0x11ff8b.y, _0x11ff8b.z),
            _0xf96f41.setXYZ(_0x304af3 + 2, _0x11ff8b.x, _0x11ff8b.y, _0x11ff8b.z));
        }
      (this.normalizeNormals(), (_0xf96f41.needsUpdate = true));
    }
  }
  ['normalizeNormals']() {
    const _0x581275 = this.attributes.normal;
    for (let _0xdd4e9b = 0, _0xd29a0 = _0x581275.count; _0xdd4e9b < _0xd29a0; _0xdd4e9b++) {
      (_vector$8.fromBufferAttribute(_0x581275, _0xdd4e9b),
        _vector$8.normalize(),
        _0x581275.setXYZ(_0xdd4e9b, _vector$8.x, _vector$8.y, _vector$8.z));
    }
  }
  ['toNonIndexed']() {
    function _0x593a9c(_0x1e9b60, _0x6c9658) {
      const _0x344761 = _0x1e9b60.array,
        _0x18a6f7 = _0x1e9b60.itemSize,
        _0x3f0856 = _0x1e9b60.normalized,
        _0x37d6d8 = new _0x344761.constructor(_0x6c9658.length * _0x18a6f7);
      let _0x290836 = 0,
        _0x51cdc2 = 0;
      for (let _0x4ae6cb = 0, _0x360507 = _0x6c9658.length; _0x4ae6cb < _0x360507; _0x4ae6cb++) {
        _0x1e9b60.isInterleavedBufferAttribute
          ? (_0x290836 = _0x6c9658[_0x4ae6cb] * _0x1e9b60.data.stride + _0x1e9b60.offset)
          : (_0x290836 = _0x6c9658[_0x4ae6cb] * _0x18a6f7);
        for (let _0x30b6bc = 0; _0x30b6bc < _0x18a6f7; _0x30b6bc++) {
          _0x37d6d8[_0x51cdc2++] = _0x344761[_0x290836++];
        }
      }
      return new BufferAttribute(_0x37d6d8, _0x18a6f7, _0x3f0856);
    }
    if (this.index === null)
      return (
        console.warn('THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.'),
        this
      );
    const _0x27e71b = new BufferGeometry(),
      _0x4a7cef = this.index.array,
      _0x26bc53 = this.attributes;
    for (const _0x6ef144 in _0x26bc53) {
      const _0x45a945 = _0x26bc53[_0x6ef144],
        _0x3a2b75 = _0x593a9c(_0x45a945, _0x4a7cef);
      _0x27e71b.setAttribute(_0x6ef144, _0x3a2b75);
    }
    const _0x2c1b23 = this.morphAttributes;
    for (const _0x2afeb6 in _0x2c1b23) {
      const _0x2440cc = [],
        _0x1a08ab = _0x2c1b23[_0x2afeb6];
      for (let _0x2758ea = 0, _0x203149 = _0x1a08ab.length; _0x2758ea < _0x203149; _0x2758ea++) {
        const _0x2c36c7 = _0x1a08ab[_0x2758ea],
          _0x546a15 = _0x593a9c(_0x2c36c7, _0x4a7cef);
        _0x2440cc.push(_0x546a15);
      }
      _0x27e71b.morphAttributes[_0x2afeb6] = _0x2440cc;
    }
    _0x27e71b.morphTargetsRelative = this.morphTargetsRelative;
    const _0xd5a778 = this.groups;
    for (let _0x232ba2 = 0, _0x4e40cd = _0xd5a778.length; _0x232ba2 < _0x4e40cd; _0x232ba2++) {
      const _0x379b68 = _0xd5a778[_0x232ba2];
      _0x27e71b.addGroup(_0x379b68.start, _0x379b68.count, _0x379b68.materialIndex);
    }
    return _0x27e71b;
  }
  ['toJSON']() {
    const _0x4ddbba = {
      metadata: { version: 4.7, type: 'BufferGeometry', generator: 'BufferGeometry.toJSON' },
    };
    ((_0x4ddbba.uuid = this.uuid), (_0x4ddbba.type = this.type));
    if (this.name !== '') _0x4ddbba.name = this.name;
    if (Object.keys(this.userData).length > 0) _0x4ddbba.userData = this.userData;
    if (this.parameters !== undefined) {
      const _0x3f9718 = this.parameters;
      for (const _0x16b9ca in _0x3f9718) {
        if (_0x3f9718[_0x16b9ca] !== undefined) _0x4ddbba[_0x16b9ca] = _0x3f9718[_0x16b9ca];
      }
      return _0x4ddbba;
    }
    _0x4ddbba.data = { attributes: {} };
    const _0x2ca3c2 = this.index;
    _0x2ca3c2 !== null &&
      (_0x4ddbba.data.index = {
        type: _0x2ca3c2.array.constructor.name,
        array: Array.prototype.slice.call(_0x2ca3c2.array),
      });
    const _0x4dcc39 = this.attributes;
    for (const _0x23cd60 in _0x4dcc39) {
      const _0x2b5288 = _0x4dcc39[_0x23cd60];
      _0x4ddbba.data.attributes[_0x23cd60] = _0x2b5288.toJSON(_0x4ddbba.data);
    }
    const _0xae6d97 = {};
    let _0x3b064d = false;
    for (const _0x2f7175 in this.morphAttributes) {
      const _0x255c4b = this.morphAttributes[_0x2f7175],
        _0x1243e3 = [];
      for (let _0xae5a5b = 0, _0xd6030a = _0x255c4b.length; _0xae5a5b < _0xd6030a; _0xae5a5b++) {
        const _0x431d95 = _0x255c4b[_0xae5a5b];
        _0x1243e3.push(_0x431d95.toJSON(_0x4ddbba.data));
      }
      _0x1243e3.length > 0 && ((_0xae6d97[_0x2f7175] = _0x1243e3), (_0x3b064d = true));
    }
    _0x3b064d &&
      ((_0x4ddbba.data.morphAttributes = _0xae6d97),
      (_0x4ddbba.data.morphTargetsRelative = this.morphTargetsRelative));
    const _0x5c77fb = this.groups;
    _0x5c77fb.length > 0 && (_0x4ddbba.data.groups = JSON.parse(JSON.stringify(_0x5c77fb)));
    const _0x5eca13 = this.boundingSphere;
    return (_0x5eca13 !== null && (_0x4ddbba.data.boundingSphere = _0x5eca13.toJSON()), _0x4ddbba);
  }
  ['clone']() {
    return new this['constructor']().copy(this);
  }
  ['copy'](_0x30076b) {
    ((this.index = null),
      (this.attributes = {}),
      (this.morphAttributes = {}),
      (this.groups = []),
      (this.boundingBox = null),
      (this.boundingSphere = null));
    const _0x706a4d = {};
    this.name = _0x30076b.name;
    const _0x368cb1 = _0x30076b.index;
    _0x368cb1 !== null && this.setIndex(_0x368cb1.clone());
    const _0x43dc79 = _0x30076b.attributes;
    for (const _0x40c622 in _0x43dc79) {
      const _0x5a5c3c = _0x43dc79[_0x40c622];
      this.setAttribute(_0x40c622, _0x5a5c3c.clone(_0x706a4d));
    }
    const _0x6a9998 = _0x30076b.morphAttributes;
    for (const _0x69ef3b in _0x6a9998) {
      const _0x199d7 = [],
        _0x46bcd3 = _0x6a9998[_0x69ef3b];
      for (let _0x3fcd54 = 0, _0x4bfe98 = _0x46bcd3.length; _0x3fcd54 < _0x4bfe98; _0x3fcd54++) {
        _0x199d7.push(_0x46bcd3[_0x3fcd54].clone(_0x706a4d));
      }
      this.morphAttributes[_0x69ef3b] = _0x199d7;
    }
    this.morphTargetsRelative = _0x30076b.morphTargetsRelative;
    const _0x448465 = _0x30076b.groups;
    for (let _0x4fd9a1 = 0, _0xfda76 = _0x448465.length; _0x4fd9a1 < _0xfda76; _0x4fd9a1++) {
      const _0x21bc77 = _0x448465[_0x4fd9a1];
      this.addGroup(_0x21bc77.start, _0x21bc77.count, _0x21bc77.materialIndex);
    }
    const _0x2fd388 = _0x30076b.boundingBox;
    _0x2fd388 !== null && (this.boundingBox = _0x2fd388.clone());
    const _0x5f2fec = _0x30076b.boundingSphere;
    return (
      _0x5f2fec !== null && (this.boundingSphere = _0x5f2fec.clone()),
      (this.drawRange.start = _0x30076b.drawRange.start),
      (this.drawRange.count = _0x30076b.drawRange.count),
      (this.userData = _0x30076b.userData),
      this
    );
  }
  ['dispose']() {
    this.dispatchEvent({ type: 'dispose' });
  }
}
const _inverseMatrix$3 = new Matrix4(),
  _ray$3 = new Ray(),
  _sphere$6 = new Sphere(),
  _sphereHitAt = new Vector3(),
  _vA$1 = new Vector3(),
  _vB$1 = new Vector3(),
  _vC$1 = new Vector3(),
  _tempA = new Vector3(),
  _morphA = new Vector3(),
  _intersectionPoint = new Vector3(),
  _intersectionPointWorld = new Vector3();
class Mesh extends Object3D {
  constructor(_0x2235e2 = new BufferGeometry(), _0x191cb5 = new MeshBasicMaterial()) {
    (super(),
      (this.isMesh = true),
      (this.type = 'Mesh'),
      (this.geometry = _0x2235e2),
      (this.material = _0x191cb5),
      (this.morphTargetDictionary = undefined),
      (this.morphTargetInfluences = undefined),
      (this.count = 1),
      this.updateMorphTargets());
  }
  ['copy'](_0x2e4efc, _0x19e171) {
    return (
      super.copy(_0x2e4efc, _0x19e171),
      _0x2e4efc.morphTargetInfluences !== undefined &&
        (this.morphTargetInfluences = _0x2e4efc.morphTargetInfluences.slice()),
      _0x2e4efc.morphTargetDictionary !== undefined &&
        (this.morphTargetDictionary = Object.assign({}, _0x2e4efc.morphTargetDictionary)),
      (this.material = Array.isArray(_0x2e4efc.material) ? _0x2e4efc.material.slice() : _0x2e4efc.material),
      (this.geometry = _0x2e4efc.geometry),
      this
    );
  }
  ['updateMorphTargets']() {
    const _0x71822 = this.geometry,
      _0x2d44d4 = _0x71822.morphAttributes,
      _0x2ab346 = Object.keys(_0x2d44d4);
    if (_0x2ab346.length > 0) {
      const _0x1a3eb3 = _0x2d44d4[_0x2ab346[0]];
      if (_0x1a3eb3 !== undefined) {
        ((this.morphTargetInfluences = []), (this.morphTargetDictionary = {}));
        for (let _0x45015d = 0, _0x50baff = _0x1a3eb3.length; _0x45015d < _0x50baff; _0x45015d++) {
          const _0x33891e = _0x1a3eb3[_0x45015d].name || String(_0x45015d);
          (this.morphTargetInfluences.push(0), (this.morphTargetDictionary[_0x33891e] = _0x45015d));
        }
      }
    }
  }
  ['getVertexPosition'](_0x306d42, _0xe35b6f) {
    const _0x47f2d0 = this.geometry,
      _0x593c9a = _0x47f2d0.attributes.position,
      _0x294e09 = _0x47f2d0.morphAttributes.position,
      _0x36632f = _0x47f2d0.morphTargetsRelative;
    _0xe35b6f.fromBufferAttribute(_0x593c9a, _0x306d42);
    const _0x24d094 = this.morphTargetInfluences;
    if (_0x294e09 && _0x24d094) {
      _morphA.set(0, 0, 0);
      for (let _0x16f021 = 0, _0x30cce5 = _0x294e09.length; _0x16f021 < _0x30cce5; _0x16f021++) {
        const _0x15e26e = _0x24d094[_0x16f021],
          _0x3b814e = _0x294e09[_0x16f021];
        if (_0x15e26e === 0) continue;
        (_tempA.fromBufferAttribute(_0x3b814e, _0x306d42),
          _0x36632f
            ? _morphA.addScaledVector(_tempA, _0x15e26e)
            : _morphA.addScaledVector(_tempA.sub(_0xe35b6f), _0x15e26e));
      }
      _0xe35b6f.add(_morphA);
    }
    return _0xe35b6f;
  }
  ['raycast'](_0x4479c2, _0x469968) {
    const _0x4df946 = this.geometry,
      _0x5c4f6d = this.material,
      _0x27e50c = this.matrixWorld;
    if (_0x5c4f6d === undefined) return;
    if (_0x4df946.boundingSphere === null) _0x4df946.computeBoundingSphere();
    (_sphere$6.copy(_0x4df946.boundingSphere),
      _sphere$6.applyMatrix4(_0x27e50c),
      _ray$3.copy(_0x4479c2.ray).recast(_0x4479c2.near));
    if (_sphere$6.containsPoint(_ray$3.origin) === false) {
      if (_ray$3.intersectSphere(_sphere$6, _sphereHitAt) === null) return;
      if (_ray$3.origin.distanceToSquared(_sphereHitAt) > (_0x4479c2.far - _0x4479c2.near) ** 2) return;
    }
    (_inverseMatrix$3.copy(_0x27e50c).invert(), _ray$3.copy(_0x4479c2.ray).applyMatrix4(_inverseMatrix$3));
    if (_0x4df946.boundingBox !== null) {
      if (_ray$3.intersectsBox(_0x4df946.boundingBox) === false) return;
    }
    this._computeIntersections(_0x4479c2, _0x469968, _ray$3);
  }
  ['_computeIntersections'](_0x4b0997, _0x35e55a, _0x24885f) {
    let _0x68e318;
    const _0x69bfbc = this.geometry,
      _0x109019 = this.material,
      _0x569780 = _0x69bfbc.index,
      _0x108c83 = _0x69bfbc.attributes.position,
      _0x28a221 = _0x69bfbc.attributes.uv,
      _0x49bfdd = _0x69bfbc.attributes.uv1,
      _0x4749e7 = _0x69bfbc.attributes.normal,
      _0x21f216 = _0x69bfbc.groups,
      _0x5b9eba = _0x69bfbc.drawRange;
    if (_0x569780 !== null) {
      if (Array.isArray(_0x109019))
        for (let _0x5951e8 = 0, _0x44f5b5 = _0x21f216.length; _0x5951e8 < _0x44f5b5; _0x5951e8++) {
          const _0x5dec3c = _0x21f216[_0x5951e8],
            _0x1bc10a = _0x109019[_0x5dec3c.materialIndex],
            _0x96319d = Math.max(_0x5dec3c.start, _0x5b9eba.start),
            _0x25f239 = Math.min(
              _0x569780.count,
              Math.min(_0x5dec3c.start + _0x5dec3c.count, _0x5b9eba.start + _0x5b9eba.count),
            );
          for (let _0x524e0a = _0x96319d, _0x4b76a2 = _0x25f239; _0x524e0a < _0x4b76a2; _0x524e0a += 3) {
            const _0x2b6749 = _0x569780.getX(_0x524e0a),
              _0x15e0e5 = _0x569780.getX(_0x524e0a + 1),
              _0x4cf4ce = _0x569780.getX(_0x524e0a + 2);
            ((_0x68e318 = checkGeometryIntersection(
              this,
              _0x1bc10a,
              _0x4b0997,
              _0x24885f,
              _0x28a221,
              _0x49bfdd,
              _0x4749e7,
              _0x2b6749,
              _0x15e0e5,
              _0x4cf4ce,
            )),
              _0x68e318 &&
                ((_0x68e318.faceIndex = Math.floor(_0x524e0a / 3)),
                (_0x68e318.face.materialIndex = _0x5dec3c.materialIndex),
                _0x35e55a.push(_0x68e318)));
          }
        }
      else {
        const _0x384fee = Math.max(0, _0x5b9eba.start),
          _0x3fe6c2 = Math.min(_0x569780.count, _0x5b9eba.start + _0x5b9eba.count);
        for (let _0x1dfbb4 = _0x384fee, _0x3ba446 = _0x3fe6c2; _0x1dfbb4 < _0x3ba446; _0x1dfbb4 += 3) {
          const _0x818d72 = _0x569780.getX(_0x1dfbb4),
            _0xd18448 = _0x569780.getX(_0x1dfbb4 + 1),
            _0x2a9632 = _0x569780.getX(_0x1dfbb4 + 2);
          ((_0x68e318 = checkGeometryIntersection(
            this,
            _0x109019,
            _0x4b0997,
            _0x24885f,
            _0x28a221,
            _0x49bfdd,
            _0x4749e7,
            _0x818d72,
            _0xd18448,
            _0x2a9632,
          )),
            _0x68e318 && ((_0x68e318.faceIndex = Math.floor(_0x1dfbb4 / 3)), _0x35e55a.push(_0x68e318)));
        }
      }
    } else {
      if (_0x108c83 !== undefined) {
        if (Array.isArray(_0x109019))
          for (let _0x5b9433 = 0, _0x5f4e30 = _0x21f216.length; _0x5b9433 < _0x5f4e30; _0x5b9433++) {
            const _0x2c73bb = _0x21f216[_0x5b9433],
              _0x2d4563 = _0x109019[_0x2c73bb.materialIndex],
              _0xa7593c = Math.max(_0x2c73bb.start, _0x5b9eba.start),
              _0x4aed9b = Math.min(
                _0x108c83.count,
                Math.min(_0x2c73bb.start + _0x2c73bb.count, _0x5b9eba.start + _0x5b9eba.count),
              );
            for (let _0x331c49 = _0xa7593c, _0x8828e = _0x4aed9b; _0x331c49 < _0x8828e; _0x331c49 += 3) {
              const _0x2103d0 = _0x331c49,
                _0x4dafeb = _0x331c49 + 1,
                _0x211747 = _0x331c49 + 2;
              ((_0x68e318 = checkGeometryIntersection(
                this,
                _0x2d4563,
                _0x4b0997,
                _0x24885f,
                _0x28a221,
                _0x49bfdd,
                _0x4749e7,
                _0x2103d0,
                _0x4dafeb,
                _0x211747,
              )),
                _0x68e318 &&
                  ((_0x68e318.faceIndex = Math.floor(_0x331c49 / 3)),
                  (_0x68e318.face.materialIndex = _0x2c73bb.materialIndex),
                  _0x35e55a.push(_0x68e318)));
            }
          }
        else {
          const _0x2b9c9f = Math.max(0, _0x5b9eba.start),
            _0x1eb6c5 = Math.min(_0x108c83.count, _0x5b9eba.start + _0x5b9eba.count);
          for (let _0x3aa77f = _0x2b9c9f, _0x2cb573 = _0x1eb6c5; _0x3aa77f < _0x2cb573; _0x3aa77f += 3) {
            const _0x3db774 = _0x3aa77f,
              _0xd9da68 = _0x3aa77f + 1,
              _0x121245 = _0x3aa77f + 2;
            ((_0x68e318 = checkGeometryIntersection(
              this,
              _0x109019,
              _0x4b0997,
              _0x24885f,
              _0x28a221,
              _0x49bfdd,
              _0x4749e7,
              _0x3db774,
              _0xd9da68,
              _0x121245,
            )),
              _0x68e318 && ((_0x68e318.faceIndex = Math.floor(_0x3aa77f / 3)), _0x35e55a.push(_0x68e318)));
          }
        }
      }
    }
  }
}
function checkIntersection$1(
  _0x53f6ff,
  _0x53e747,
  _0x462b57,
  _0x55b176,
  _0x29d511,
  _0x451507,
  _0x163eab,
  _0x398620,
) {
  let _0x9c7748;
  _0x53e747.side === BackSide
    ? (_0x9c7748 = _0x55b176.intersectTriangle(_0x163eab, _0x451507, _0x29d511, true, _0x398620))
    : (_0x9c7748 = _0x55b176.intersectTriangle(
        _0x29d511,
        _0x451507,
        _0x163eab,
        _0x53e747.side === FrontSide,
        _0x398620,
      ));
  if (_0x9c7748 === null) return null;
  (_intersectionPointWorld.copy(_0x398620), _intersectionPointWorld.applyMatrix4(_0x53f6ff.matrixWorld));
  const _0x43306d = _0x462b57.ray.origin.distanceTo(_intersectionPointWorld);
  if (_0x43306d < _0x462b57.near || _0x43306d > _0x462b57.far) return null;
  return { distance: _0x43306d, point: _intersectionPointWorld.clone(), object: _0x53f6ff };
}
function checkGeometryIntersection(
  _0x537890,
  _0x4f7edb,
  _0x5ee363,
  _0x286f3b,
  _0x362b78,
  _0x1dbba7,
  _0x22b448,
  _0x39c885,
  _0x2b25fa,
  _0x34130f,
) {
  (_0x537890.getVertexPosition(_0x39c885, _vA$1),
    _0x537890.getVertexPosition(_0x2b25fa, _vB$1),
    _0x537890.getVertexPosition(_0x34130f, _vC$1));
  const _0x4571d8 = checkIntersection$1(
    _0x537890,
    _0x4f7edb,
    _0x5ee363,
    _0x286f3b,
    _vA$1,
    _vB$1,
    _vC$1,
    _intersectionPoint,
  );
  if (_0x4571d8) {
    const _0x33b667 = new Vector3();
    Triangle.getBarycoord(_intersectionPoint, _vA$1, _vB$1, _vC$1, _0x33b667);
    _0x362b78 &&
      (_0x4571d8.uv = Triangle.getInterpolatedAttribute(
        _0x362b78,
        _0x39c885,
        _0x2b25fa,
        _0x34130f,
        _0x33b667,
        new Vector2(),
      ));
    _0x1dbba7 &&
      (_0x4571d8.uv1 = Triangle.getInterpolatedAttribute(
        _0x1dbba7,
        _0x39c885,
        _0x2b25fa,
        _0x34130f,
        _0x33b667,
        new Vector2(),
      ));
    _0x22b448 &&
      ((_0x4571d8.normal = Triangle.getInterpolatedAttribute(
        _0x22b448,
        _0x39c885,
        _0x2b25fa,
        _0x34130f,
        _0x33b667,
        new Vector3(),
      )),
      _0x4571d8.normal.dot(_0x286f3b.direction) > 0 && _0x4571d8.normal.multiplyScalar(-1));
    const _0x544814 = { a: _0x39c885, b: _0x2b25fa, c: _0x34130f, normal: new Vector3(), materialIndex: 0 };
    (Triangle.getNormal(_vA$1, _vB$1, _vC$1, _0x544814.normal),
      (_0x4571d8.face = _0x544814),
      (_0x4571d8.barycoord = _0x33b667));
  }
  return _0x4571d8;
}
class BoxGeometry extends BufferGeometry {
  constructor(_0x3a2069 = 1, _0x312690 = 1, _0x10162f = 1, _0x2712ee = 1, _0x56edcd = 1, _0x27603a = 1) {
    (super(),
      (this.type = 'BoxGeometry'),
      (this.parameters = {
        width: _0x3a2069,
        height: _0x312690,
        depth: _0x10162f,
        widthSegments: _0x2712ee,
        heightSegments: _0x56edcd,
        depthSegments: _0x27603a,
      }));
    const _0x1e8643 = this;
    ((_0x2712ee = Math.floor(_0x2712ee)),
      (_0x56edcd = Math.floor(_0x56edcd)),
      (_0x27603a = Math.floor(_0x27603a)));
    const _0x323e2f = [],
      _0x1accff = [],
      _0xc6fbc9 = [],
      _0xa8b603 = [];
    let _0x35f0d9 = 0,
      _0x248723 = 0;
    (_0x2a2080('z', 'y', 'x', -1, -1, _0x10162f, _0x312690, _0x3a2069, _0x27603a, _0x56edcd, 0),
      _0x2a2080('z', 'y', 'x', 1, -1, _0x10162f, _0x312690, -_0x3a2069, _0x27603a, _0x56edcd, 1),
      _0x2a2080('x', 'z', 'y', 1, 1, _0x3a2069, _0x10162f, _0x312690, _0x2712ee, _0x27603a, 2),
      _0x2a2080('x', 'z', 'y', 1, -1, _0x3a2069, _0x10162f, -_0x312690, _0x2712ee, _0x27603a, 3),
      _0x2a2080('x', 'y', 'z', 1, -1, _0x3a2069, _0x312690, _0x10162f, _0x2712ee, _0x56edcd, 4),
      _0x2a2080('x', 'y', 'z', -1, -1, _0x3a2069, _0x312690, -_0x10162f, _0x2712ee, _0x56edcd, 5),
      this.setIndex(_0x323e2f),
      this.setAttribute('position', new Float32BufferAttribute(_0x1accff, 3)),
      this.setAttribute('normal', new Float32BufferAttribute(_0xc6fbc9, 3)),
      this.setAttribute('uv', new Float32BufferAttribute(_0xa8b603, 2)));
    function _0x2a2080(
      _0x4d19ea,
      _0x4600d1,
      _0x3e1cc5,
      _0x282d5e,
      _0x1b0a98,
      _0x459be5,
      _0x387807,
      _0x5293c7,
      _0x4c96d2,
      _0x2e0ff2,
      _0x15136e,
    ) {
      const _0x4cd6ec = _0x459be5 / _0x4c96d2,
        _0x5809f1 = _0x387807 / _0x2e0ff2,
        _0x162523 = _0x459be5 / 2,
        _0x3e06a9 = _0x387807 / 2,
        _0x47df9c = _0x5293c7 / 2,
        _0x4a7b6b = _0x4c96d2 + 1,
        _0x2bb6fb = _0x2e0ff2 + 1;
      let _0x32f31a = 0,
        _0x55b4a3 = 0;
      const _0x787022 = new Vector3();
      for (let _0x22263b = 0; _0x22263b < _0x2bb6fb; _0x22263b++) {
        const _0x1b6ef2 = _0x22263b * _0x5809f1 - _0x3e06a9;
        for (let _0x273671 = 0; _0x273671 < _0x4a7b6b; _0x273671++) {
          const _0xf53ce2 = _0x273671 * _0x4cd6ec - _0x162523;
          ((_0x787022[_0x4d19ea] = _0xf53ce2 * _0x282d5e),
            (_0x787022[_0x4600d1] = _0x1b6ef2 * _0x1b0a98),
            (_0x787022[_0x3e1cc5] = _0x47df9c),
            _0x1accff.push(_0x787022.x, _0x787022.y, _0x787022.z),
            (_0x787022[_0x4d19ea] = 0),
            (_0x787022[_0x4600d1] = 0),
            (_0x787022[_0x3e1cc5] = _0x5293c7 > 0 ? 1 : -1),
            _0xc6fbc9.push(_0x787022.x, _0x787022.y, _0x787022.z),
            _0xa8b603.push(_0x273671 / _0x4c96d2),
            _0xa8b603.push(1 - _0x22263b / _0x2e0ff2),
            (_0x32f31a += 1));
        }
      }
      for (let _0x5ad74a = 0; _0x5ad74a < _0x2e0ff2; _0x5ad74a++) {
        for (let _0x38b1a0 = 0; _0x38b1a0 < _0x4c96d2; _0x38b1a0++) {
          const _0x5eb051 = _0x35f0d9 + _0x38b1a0 + _0x4a7b6b * _0x5ad74a,
            _0x20d5f3 = _0x35f0d9 + _0x38b1a0 + _0x4a7b6b * (_0x5ad74a + 1),
            _0x2947a8 = _0x35f0d9 + (_0x38b1a0 + 1) + _0x4a7b6b * (_0x5ad74a + 1),
            _0x4b44b3 = _0x35f0d9 + (_0x38b1a0 + 1) + _0x4a7b6b * _0x5ad74a;
          (_0x323e2f.push(_0x5eb051, _0x20d5f3, _0x4b44b3),
            _0x323e2f.push(_0x20d5f3, _0x2947a8, _0x4b44b3),
            (_0x55b4a3 += 6));
        }
      }
      (_0x1e8643.addGroup(_0x248723, _0x55b4a3, _0x15136e),
        (_0x248723 += _0x55b4a3),
        (_0x35f0d9 += _0x32f31a));
    }
  }
  ['copy'](_0xf522e) {
    return (super.copy(_0xf522e), (this.parameters = Object.assign({}, _0xf522e.parameters)), this);
  }
  static ['fromJSON'](_0x22ef5d) {
    return new BoxGeometry(
      _0x22ef5d.width,
      _0x22ef5d.height,
      _0x22ef5d.depth,
      _0x22ef5d.widthSegments,
      _0x22ef5d.heightSegments,
      _0x22ef5d.depthSegments,
    );
  }
}
function cloneUniforms(_0x482194) {
  const _0x4d90b5 = {};
  for (const _0x318a64 in _0x482194) {
    _0x4d90b5[_0x318a64] = {};
    for (const _0x42ae30 in _0x482194[_0x318a64]) {
      const _0x1f6f08 = _0x482194[_0x318a64][_0x42ae30];
      if (
        _0x1f6f08 &&
        (_0x1f6f08.isColor ||
          _0x1f6f08.isMatrix3 ||
          _0x1f6f08.isMatrix4 ||
          _0x1f6f08.isVector2 ||
          _0x1f6f08.isVector3 ||
          _0x1f6f08.isVector4 ||
          _0x1f6f08.isTexture ||
          _0x1f6f08.isQuaternion)
      )
        _0x1f6f08.isRenderTargetTexture
          ? (console.warn(
              'UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms().',
            ),
            (_0x4d90b5[_0x318a64][_0x42ae30] = null))
          : (_0x4d90b5[_0x318a64][_0x42ae30] = _0x1f6f08.clone());
      else
        Array.isArray(_0x1f6f08)
          ? (_0x4d90b5[_0x318a64][_0x42ae30] = _0x1f6f08.slice())
          : (_0x4d90b5[_0x318a64][_0x42ae30] = _0x1f6f08);
    }
  }
  return _0x4d90b5;
}
function mergeUniforms(_0x338d4b) {
  const _0x444771 = {};
  for (let _0x490c32 = 0; _0x490c32 < _0x338d4b.length; _0x490c32++) {
    const _0x2cdecb = cloneUniforms(_0x338d4b[_0x490c32]);
    for (const _0x4c4597 in _0x2cdecb) {
      _0x444771[_0x4c4597] = _0x2cdecb[_0x4c4597];
    }
  }
  return _0x444771;
}
function cloneUniformsGroups(_0x254881) {
  const _0x4aac97 = [];
  for (let _0x2be43b = 0; _0x2be43b < _0x254881.length; _0x2be43b++) {
    _0x4aac97.push(_0x254881[_0x2be43b].clone());
  }
  return _0x4aac97;
}
function getUnlitUniformColorSpace(_0x138dc1) {
  const _0x57a3b5 = _0x138dc1.getRenderTarget();
  if (_0x57a3b5 === null) return _0x138dc1.outputColorSpace;
  if (_0x57a3b5.isXRRenderTarget === true) return _0x57a3b5.texture.colorSpace;
  return ColorManagement.workingColorSpace;
}
const UniformsUtils = { clone: cloneUniforms, merge: mergeUniforms };
var default_vertex =
    'void main() {\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}',
  default_fragment = 'void main() {\n\tgl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );\n}';
class ShaderMaterial extends Material {
  constructor(_0x1d4633) {
    (super(),
      (this.isShaderMaterial = true),
      (this.type = 'ShaderMaterial'),
      (this.defines = {}),
      (this.uniforms = {}),
      (this.uniformsGroups = []),
      (this.vertexShader = default_vertex),
      (this.fragmentShader = default_fragment),
      (this.linewidth = 1),
      (this.wireframe = false),
      (this.wireframeLinewidth = 1),
      (this.fog = false),
      (this.lights = false),
      (this.clipping = false),
      (this.forceSinglePass = true),
      (this.extensions = { clipCullDistance: false, multiDraw: false }),
      (this.defaultAttributeValues = { color: [1, 1, 1], uv: [0, 0], uv1: [0, 0] }),
      (this.index0AttributeName = undefined),
      (this.uniformsNeedUpdate = false),
      (this.glslVersion = null),
      _0x1d4633 !== undefined && this.setValues(_0x1d4633));
  }
  ['copy'](_0x30936c) {
    return (
      super.copy(_0x30936c),
      (this.fragmentShader = _0x30936c.fragmentShader),
      (this.vertexShader = _0x30936c.vertexShader),
      (this.uniforms = cloneUniforms(_0x30936c.uniforms)),
      (this.uniformsGroups = cloneUniformsGroups(_0x30936c.uniformsGroups)),
      (this.defines = Object.assign({}, _0x30936c.defines)),
      (this.wireframe = _0x30936c.wireframe),
      (this.wireframeLinewidth = _0x30936c.wireframeLinewidth),
      (this.fog = _0x30936c.fog),
      (this.lights = _0x30936c.lights),
      (this.clipping = _0x30936c.clipping),
      (this.extensions = Object.assign({}, _0x30936c.extensions)),
      (this.glslVersion = _0x30936c.glslVersion),
      this
    );
  }
  ['toJSON'](_0x3b4909) {
    const _0x44546c = super.toJSON(_0x3b4909);
    ((_0x44546c.glslVersion = this.glslVersion), (_0x44546c.uniforms = {}));
    for (const _0x5b7f89 in this.uniforms) {
      const _0x94faf0 = this.uniforms[_0x5b7f89],
        _0x586c73 = _0x94faf0.value;
      if (_0x586c73 && _0x586c73.isTexture)
        _0x44546c.uniforms[_0x5b7f89] = { type: 't', value: _0x586c73.toJSON(_0x3b4909).uuid };
      else {
        if (_0x586c73 && _0x586c73.isColor)
          _0x44546c.uniforms[_0x5b7f89] = { type: 'c', value: _0x586c73.getHex() };
        else {
          if (_0x586c73 && _0x586c73.isVector2)
            _0x44546c.uniforms[_0x5b7f89] = { type: 'v2', value: _0x586c73.toArray() };
          else {
            if (_0x586c73 && _0x586c73.isVector3)
              _0x44546c.uniforms[_0x5b7f89] = { type: 'v3', value: _0x586c73.toArray() };
            else {
              if (_0x586c73 && _0x586c73.isVector4)
                _0x44546c.uniforms[_0x5b7f89] = { type: 'v4', value: _0x586c73.toArray() };
              else {
                if (_0x586c73 && _0x586c73.isMatrix3)
                  _0x44546c.uniforms[_0x5b7f89] = { type: 'm3', value: _0x586c73.toArray() };
                else
                  _0x586c73 && _0x586c73.isMatrix4
                    ? (_0x44546c.uniforms[_0x5b7f89] = { type: 'm4', value: _0x586c73.toArray() })
                    : (_0x44546c.uniforms[_0x5b7f89] = { value: _0x586c73 });
              }
            }
          }
        }
      }
    }
    if (Object.keys(this.defines).length > 0) _0x44546c.defines = this.defines;
    ((_0x44546c.vertexShader = this.vertexShader),
      (_0x44546c.fragmentShader = this.fragmentShader),
      (_0x44546c.lights = this.lights),
      (_0x44546c.clipping = this.clipping));
    const _0x25ad66 = {};
    for (const _0x38fabc in this.extensions) {
      if (this.extensions[_0x38fabc] === true) _0x25ad66[_0x38fabc] = true;
    }
    if (Object.keys(_0x25ad66).length > 0) _0x44546c.extensions = _0x25ad66;
    return _0x44546c;
  }
}
class Camera extends Object3D {
  constructor() {
    (super(),
      (this.isCamera = true),
      (this.type = 'Camera'),
      (this.matrixWorldInverse = new Matrix4()),
      (this.projectionMatrix = new Matrix4()),
      (this.projectionMatrixInverse = new Matrix4()),
      (this.coordinateSystem = WebGLCoordinateSystem),
      (this._reversedDepth = false));
  }
  get ['reversedDepth']() {
    return this._reversedDepth;
  }
  ['copy'](_0x1a08d6, _0xb9344f) {
    return (
      super.copy(_0x1a08d6, _0xb9344f),
      this.matrixWorldInverse.copy(_0x1a08d6.matrixWorldInverse),
      this.projectionMatrix.copy(_0x1a08d6.projectionMatrix),
      this.projectionMatrixInverse.copy(_0x1a08d6.projectionMatrixInverse),
      (this.coordinateSystem = _0x1a08d6.coordinateSystem),
      this
    );
  }
  ['getWorldDirection'](_0x45f486) {
    return super.getWorldDirection(_0x45f486).negate();
  }
  ['updateMatrixWorld'](_0x4a6f3f) {
    (super.updateMatrixWorld(_0x4a6f3f), this.matrixWorldInverse.copy(this.matrixWorld).invert());
  }
  ['updateWorldMatrix'](_0x101517, _0x4f6daa) {
    (super.updateWorldMatrix(_0x101517, _0x4f6daa), this.matrixWorldInverse.copy(this.matrixWorld).invert());
  }
  ['clone']() {
    return new this['constructor']().copy(this);
  }
}
const _v3$1 = new Vector3(),
  _minTarget = new Vector2(),
  _maxTarget = new Vector2();
class PerspectiveCamera extends Camera {
  constructor(_0x1d0417 = 50, _0x1dd41d = 1, _0x20fe6f = 0.1, _0x45b391 = 0x7d0) {
    (super(),
      (this.isPerspectiveCamera = true),
      (this.type = 'PerspectiveCamera'),
      (this.fov = _0x1d0417),
      (this.zoom = 1),
      (this.near = _0x20fe6f),
      (this.far = _0x45b391),
      (this.focus = 10),
      (this.aspect = _0x1dd41d),
      (this.view = null),
      (this.filmGauge = 35),
      (this.filmOffset = 0),
      this.updateProjectionMatrix());
  }
  ['copy'](_0x5b8742, _0x52ffb2) {
    return (
      super.copy(_0x5b8742, _0x52ffb2),
      (this.fov = _0x5b8742.fov),
      (this.zoom = _0x5b8742.zoom),
      (this.near = _0x5b8742.near),
      (this.far = _0x5b8742.far),
      (this.focus = _0x5b8742.focus),
      (this.aspect = _0x5b8742.aspect),
      (this.view = _0x5b8742.view === null ? null : Object.assign({}, _0x5b8742.view)),
      (this.filmGauge = _0x5b8742.filmGauge),
      (this.filmOffset = _0x5b8742.filmOffset),
      this
    );
  }
  ['setFocalLength'](_0x68914d) {
    const _0xa54833 = (0.5 * this.getFilmHeight()) / _0x68914d;
    ((this.fov = RAD2DEG * 2 * Math.atan(_0xa54833)), this.updateProjectionMatrix());
  }
  ['getFocalLength']() {
    const _0x24298a = Math.tan(DEG2RAD * 0.5 * this.fov);
    return (0.5 * this.getFilmHeight()) / _0x24298a;
  }
  ['getEffectiveFOV']() {
    return RAD2DEG * 2 * Math.atan(Math.tan(DEG2RAD * 0.5 * this.fov) / this.zoom);
  }
  ['getFilmWidth']() {
    return this.filmGauge * Math.min(this.aspect, 1);
  }
  ['getFilmHeight']() {
    return this.filmGauge / Math.max(this.aspect, 1);
  }
  ['getViewBounds'](_0x39a99b, _0x3e1029, _0x5eb7dc) {
    (_v3$1.set(-1, -1, 0.5).applyMatrix4(this.projectionMatrixInverse),
      _0x3e1029.set(_v3$1.x, _v3$1.y).multiplyScalar(-_0x39a99b / _v3$1.z),
      _v3$1.set(1, 1, 0.5).applyMatrix4(this.projectionMatrixInverse),
      _0x5eb7dc.set(_v3$1.x, _v3$1.y).multiplyScalar(-_0x39a99b / _v3$1.z));
  }
  ['getViewSize'](_0x5927d2, _0x29c4e7) {
    return (
      this.getViewBounds(_0x5927d2, _minTarget, _maxTarget),
      _0x29c4e7.subVectors(_maxTarget, _minTarget)
    );
  }
  ['setViewOffset'](_0x310577, _0x55c5f6, _0x4c480b, _0x39cc08, _0x44025a, _0x5cd66c) {
    ((this.aspect = _0x310577 / _0x55c5f6),
      this.view === null &&
        (this.view = {
          enabled: true,
          fullWidth: 1,
          fullHeight: 1,
          offsetX: 0,
          offsetY: 0,
          width: 1,
          height: 1,
        }),
      (this.view.enabled = true),
      (this.view.fullWidth = _0x310577),
      (this.view.fullHeight = _0x55c5f6),
      (this.view.offsetX = _0x4c480b),
      (this.view.offsetY = _0x39cc08),
      (this.view.width = _0x44025a),
      (this.view.height = _0x5cd66c),
      this.updateProjectionMatrix());
  }
  ['clearViewOffset']() {
    (this.view !== null && (this.view.enabled = false), this.updateProjectionMatrix());
  }
  ['updateProjectionMatrix']() {
    const _0x3bab46 = this.near;
    let _0xe9351 = (_0x3bab46 * Math.tan(DEG2RAD * 0.5 * this.fov)) / this.zoom,
      _0x1099c5 = 2 * _0xe9351,
      _0x167dec = this.aspect * _0x1099c5,
      _0x4c19ac = -0.5 * _0x167dec;
    const _0x1646c6 = this.view;
    if (this.view !== null && this.view.enabled) {
      const _0x9d88d2 = _0x1646c6.fullWidth,
        _0x442357 = _0x1646c6.fullHeight;
      ((_0x4c19ac += (_0x1646c6.offsetX * _0x167dec) / _0x9d88d2),
        (_0xe9351 -= (_0x1646c6.offsetY * _0x1099c5) / _0x442357),
        (_0x167dec *= _0x1646c6.width / _0x9d88d2),
        (_0x1099c5 *= _0x1646c6.height / _0x442357));
    }
    const _0x49a051 = this.filmOffset;
    if (_0x49a051 !== 0) _0x4c19ac += (_0x3bab46 * _0x49a051) / this.getFilmWidth();
    (this.projectionMatrix.makePerspective(
      _0x4c19ac,
      _0x4c19ac + _0x167dec,
      _0xe9351,
      _0xe9351 - _0x1099c5,
      _0x3bab46,
      this.far,
      this.coordinateSystem,
      this.reversedDepth,
    ),
      this.projectionMatrixInverse.copy(this.projectionMatrix).invert());
  }
  ['toJSON'](_0x2dc64f) {
    const _0xefa912 = super.toJSON(_0x2dc64f);
    ((_0xefa912.object.fov = this.fov),
      (_0xefa912.object.zoom = this.zoom),
      (_0xefa912.object.near = this.near),
      (_0xefa912.object.far = this.far),
      (_0xefa912.object.focus = this.focus),
      (_0xefa912.object.aspect = this.aspect));
    if (this.view !== null) _0xefa912.object.view = Object.assign({}, this.view);
    return (
      (_0xefa912.object.filmGauge = this.filmGauge),
      (_0xefa912.object.filmOffset = this.filmOffset),
      _0xefa912
    );
  }
}
const fov = -90,
  aspect = 1;
class CubeCamera extends Object3D {
  constructor(_0x4b4ed9, _0x530b4c, _0x5a5088) {
    (super(),
      (this.type = 'CubeCamera'),
      (this.renderTarget = _0x5a5088),
      (this.coordinateSystem = null),
      (this.activeMipmapLevel = 0));
    const _0x5a4811 = new PerspectiveCamera(fov, aspect, _0x4b4ed9, _0x530b4c);
    ((_0x5a4811.layers = this.layers), this.add(_0x5a4811));
    const _0x56f768 = new PerspectiveCamera(fov, aspect, _0x4b4ed9, _0x530b4c);
    ((_0x56f768.layers = this.layers), this.add(_0x56f768));
    const _0x3ad22a = new PerspectiveCamera(fov, aspect, _0x4b4ed9, _0x530b4c);
    ((_0x3ad22a.layers = this.layers), this.add(_0x3ad22a));
    const _0x16b9e4 = new PerspectiveCamera(fov, aspect, _0x4b4ed9, _0x530b4c);
    ((_0x16b9e4.layers = this.layers), this.add(_0x16b9e4));
    const _0x4f735d = new PerspectiveCamera(fov, aspect, _0x4b4ed9, _0x530b4c);
    ((_0x4f735d.layers = this.layers), this.add(_0x4f735d));
    const _0x45ae36 = new PerspectiveCamera(fov, aspect, _0x4b4ed9, _0x530b4c);
    ((_0x45ae36.layers = this.layers), this.add(_0x45ae36));
  }
  ['updateCoordinateSystem']() {
    const _0x52198d = this.coordinateSystem,
      _0x4fbea9 = this.children.concat(),
      [_0x342122, _0x189359, _0x2769ce, _0x4dfa35, _0x4e704f, _0x309161] = _0x4fbea9;
    for (const _0x1200c9 of _0x4fbea9) this.remove(_0x1200c9);
    if (_0x52198d === WebGLCoordinateSystem)
      (_0x342122.up.set(0, 1, 0),
        _0x342122.lookAt(1, 0, 0),
        _0x189359.up.set(0, 1, 0),
        _0x189359.lookAt(-1, 0, 0),
        _0x2769ce.up.set(0, 0, -1),
        _0x2769ce.lookAt(0, 1, 0),
        _0x4dfa35.up.set(0, 0, 1),
        _0x4dfa35.lookAt(0, -1, 0),
        _0x4e704f.up.set(0, 1, 0),
        _0x4e704f.lookAt(0, 0, 1),
        _0x309161.up.set(0, 1, 0),
        _0x309161.lookAt(0, 0, -1));
    else {
      if (_0x52198d === WebGPUCoordinateSystem)
        (_0x342122.up.set(0, -1, 0),
          _0x342122.lookAt(-1, 0, 0),
          _0x189359.up.set(0, -1, 0),
          _0x189359.lookAt(1, 0, 0),
          _0x2769ce.up.set(0, 0, 1),
          _0x2769ce.lookAt(0, 1, 0),
          _0x4dfa35.up.set(0, 0, -1),
          _0x4dfa35.lookAt(0, -1, 0),
          _0x4e704f.up.set(0, -1, 0),
          _0x4e704f.lookAt(0, 0, 1),
          _0x309161.up.set(0, -1, 0),
          _0x309161.lookAt(0, 0, -1));
      else
        throw new Error('THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: ' + _0x52198d);
    }
    for (const _0x1f3865 of _0x4fbea9) {
      (this.add(_0x1f3865), _0x1f3865.updateMatrixWorld());
    }
  }
  ['update'](_0x21b2e1, _0x3ed7e0) {
    if (this.parent === null) this.updateMatrixWorld();
    const { renderTarget: _0x19a963, activeMipmapLevel: _0x17b41a } = this;
    this.coordinateSystem !== _0x21b2e1.coordinateSystem &&
      ((this.coordinateSystem = _0x21b2e1.coordinateSystem), this.updateCoordinateSystem());
    const [_0x3cd659, _0x16755b, _0x1f7d9a, _0x57af3b, _0x16edf5, _0x5d9aa8] = this.children,
      _0x44d083 = _0x21b2e1.getRenderTarget(),
      _0x15989f = _0x21b2e1.getActiveCubeFace(),
      _0x314249 = _0x21b2e1.getActiveMipmapLevel(),
      _0x399132 = _0x21b2e1.xr.enabled;
    _0x21b2e1.xr.enabled = false;
    const _0x29d576 = _0x19a963.texture.generateMipmaps;
    ((_0x19a963.texture.generateMipmaps = false),
      _0x21b2e1.setRenderTarget(_0x19a963, 0, _0x17b41a),
      _0x21b2e1.render(_0x3ed7e0, _0x3cd659),
      _0x21b2e1.setRenderTarget(_0x19a963, 1, _0x17b41a),
      _0x21b2e1.render(_0x3ed7e0, _0x16755b),
      _0x21b2e1.setRenderTarget(_0x19a963, 2, _0x17b41a),
      _0x21b2e1.render(_0x3ed7e0, _0x1f7d9a),
      _0x21b2e1.setRenderTarget(_0x19a963, 3, _0x17b41a),
      _0x21b2e1.render(_0x3ed7e0, _0x57af3b),
      _0x21b2e1.setRenderTarget(_0x19a963, 4, _0x17b41a),
      _0x21b2e1.render(_0x3ed7e0, _0x16edf5),
      (_0x19a963.texture.generateMipmaps = _0x29d576),
      _0x21b2e1.setRenderTarget(_0x19a963, 5, _0x17b41a),
      _0x21b2e1.render(_0x3ed7e0, _0x5d9aa8),
      _0x21b2e1.setRenderTarget(_0x44d083, _0x15989f, _0x314249),
      (_0x21b2e1.xr.enabled = _0x399132),
      (_0x19a963.texture.needsPMREMUpdate = true));
  }
}
class CubeTexture extends Texture {
  constructor(
    _0xfcc685 = [],
    _0x32b473 = CubeReflectionMapping,
    _0x8dcf5f,
    _0x2e5058,
    _0x186c5e,
    _0x3dd0fd,
    _0x2ab237,
    _0x10bf63,
    _0x18dd79,
    _0x3a6d8c,
  ) {
    (super(
      _0xfcc685,
      _0x32b473,
      _0x8dcf5f,
      _0x2e5058,
      _0x186c5e,
      _0x3dd0fd,
      _0x2ab237,
      _0x10bf63,
      _0x18dd79,
      _0x3a6d8c,
    ),
      (this.isCubeTexture = true),
      (this.flipY = false));
  }
  get ['images']() {
    return this.image;
  }
  set ['images'](_0x5c2705) {
    this.image = _0x5c2705;
  }
}
class WebGLCubeRenderTarget extends WebGLRenderTarget {
  constructor(_0x27417a = 1, _0x40f3b6 = {}) {
    (super(_0x27417a, _0x27417a, _0x40f3b6), (this.isWebGLCubeRenderTarget = true));
    const _0x1016f6 = { width: _0x27417a, height: _0x27417a, depth: 1 },
      _0x2fa2e4 = [_0x1016f6, _0x1016f6, _0x1016f6, _0x1016f6, _0x1016f6, _0x1016f6];
    ((this.texture = new CubeTexture(_0x2fa2e4)),
      this._setTextureOptions(_0x40f3b6),
      (this.texture.isRenderTargetTexture = true));
  }
  ['fromEquirectangularTexture'](_0x269a8a, _0x2c707d) {
    ((this.texture.type = _0x2c707d.type),
      (this.texture.colorSpace = _0x2c707d.colorSpace),
      (this.texture.generateMipmaps = _0x2c707d.generateMipmaps),
      (this.texture.minFilter = _0x2c707d.minFilter),
      (this.texture.magFilter = _0x2c707d.magFilter));
    const _0x26c2c9 = {
        uniforms: { tEquirect: { value: null } },
        vertexShader:
          '\n\n\t\t\t\tvarying vec3 vWorldDirection;\n\n\t\t\t\tvec3 transformDirection( in vec3 dir, in mat4 matrix ) {\n\n\t\t\t\t\treturn normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );\n\n\t\t\t\t}\n\n\t\t\t\tvoid main() {\n\n\t\t\t\t\tvWorldDirection = transformDirection( position, modelMatrix );\n\n\t\t\t\t\t#include <begin_vertex>\n\t\t\t\t\t#include <project_vertex>\n\n\t\t\t\t}\n\t\t\t',
        fragmentShader:
          '\n\n\t\t\t\tuniform sampler2D tEquirect;\n\n\t\t\t\tvarying vec3 vWorldDirection;\n\n\t\t\t\t#include <common>\n\n\t\t\t\tvoid main() {\n\n\t\t\t\t\tvec3 direction = normalize( vWorldDirection );\n\n\t\t\t\t\tvec2 sampleUV = equirectUv( direction );\n\n\t\t\t\t\tgl_FragColor = texture2D( tEquirect, sampleUV );\n\n\t\t\t\t}\n\t\t\t',
      },
      _0x5ca1fd = new BoxGeometry(5, 5, 5),
      _0x636bba = new ShaderMaterial({
        name: 'CubemapFromEquirect',
        uniforms: cloneUniforms(_0x26c2c9.uniforms),
        vertexShader: _0x26c2c9.vertexShader,
        fragmentShader: _0x26c2c9.fragmentShader,
        side: BackSide,
        blending: NoBlending,
      });
    _0x636bba.uniforms.tEquirect.value = _0x2c707d;
    const _0x2d514e = new Mesh(_0x5ca1fd, _0x636bba),
      _0x52b429 = _0x2c707d.minFilter;
    if (_0x2c707d.minFilter === LinearMipmapLinearFilter) _0x2c707d.minFilter = LinearFilter;
    const _0x1630cc = new CubeCamera(1, 10, this);
    return (
      _0x1630cc.update(_0x269a8a, _0x2d514e),
      (_0x2c707d.minFilter = _0x52b429),
      _0x2d514e.geometry.dispose(),
      _0x2d514e.material.dispose(),
      this
    );
  }
  ['clear'](_0x562d79, _0x49ae89 = true, _0x2f0882 = true, _0x510652 = true) {
    const _0x48e7d5 = _0x562d79.getRenderTarget();
    for (let _0x2ef2b0 = 0; _0x2ef2b0 < 6; _0x2ef2b0++) {
      (_0x562d79.setRenderTarget(this, _0x2ef2b0), _0x562d79.clear(_0x49ae89, _0x2f0882, _0x510652));
    }
    _0x562d79.setRenderTarget(_0x48e7d5);
  }
}
class Group extends Object3D {
  constructor() {
    (super(), (this.isGroup = true), (this.type = 'Group'));
  }
}
const _moveEvent = { type: 'move' };
class WebXRController {
  constructor() {
    ((this._targetRay = null), (this._grip = null), (this._hand = null));
  }
  ['getHandSpace']() {
    return (
      this._hand === null &&
        ((this._hand = new Group()),
        (this._hand.matrixAutoUpdate = false),
        (this._hand.visible = false),
        (this._hand.joints = {}),
        (this._hand.inputState = { pinching: false })),
      this._hand
    );
  }
  ['getTargetRaySpace']() {
    return (
      this._targetRay === null &&
        ((this._targetRay = new Group()),
        (this._targetRay.matrixAutoUpdate = false),
        (this._targetRay.visible = false),
        (this._targetRay.hasLinearVelocity = false),
        (this._targetRay.linearVelocity = new Vector3()),
        (this._targetRay.hasAngularVelocity = false),
        (this._targetRay.angularVelocity = new Vector3())),
      this._targetRay
    );
  }
  ['getGripSpace']() {
    return (
      this._grip === null &&
        ((this._grip = new Group()),
        (this._grip.matrixAutoUpdate = false),
        (this._grip.visible = false),
        (this._grip.hasLinearVelocity = false),
        (this._grip.linearVelocity = new Vector3()),
        (this._grip.hasAngularVelocity = false),
        (this._grip.angularVelocity = new Vector3())),
      this._grip
    );
  }
  ['dispatchEvent'](_0x1bf83f) {
    return (
      this._targetRay !== null && this._targetRay.dispatchEvent(_0x1bf83f),
      this._grip !== null && this._grip.dispatchEvent(_0x1bf83f),
      this._hand !== null && this._hand.dispatchEvent(_0x1bf83f),
      this
    );
  }
  ['connect'](_0x3c3f24) {
    if (_0x3c3f24 && _0x3c3f24.hand) {
      const _0x3f6913 = this._hand;
      if (_0x3f6913)
        for (const _0x5a47c3 of _0x3c3f24.hand.values()) {
          this._getHandJoint(_0x3f6913, _0x5a47c3);
        }
    }
    return (this.dispatchEvent({ type: 'connected', data: _0x3c3f24 }), this);
  }
  ['disconnect'](_0x4ef895) {
    return (
      this.dispatchEvent({ type: 'disconnected', data: _0x4ef895 }),
      this._targetRay !== null && (this._targetRay.visible = false),
      this._grip !== null && (this._grip.visible = false),
      this._hand !== null && (this._hand.visible = false),
      this
    );
  }
  ['update'](_0x4fcabd, _0x4b928a, _0x39eb26) {
    let _0x431d7d = null,
      _0x2f5434 = null,
      _0xadcdfe = null;
    const _0x2cfcb7 = this._targetRay,
      _0x234217 = this._grip,
      _0x32fddc = this._hand;
    if (_0x4fcabd && _0x4b928a.session.visibilityState !== 'visible-blurred') {
      if (_0x32fddc && _0x4fcabd.hand) {
        _0xadcdfe = true;
        for (const _0x1a1874 of _0x4fcabd.hand.values()) {
          const _0x18b3e2 = _0x4b928a.getJointPose(_0x1a1874, _0x39eb26),
            _0x529a3e = this._getHandJoint(_0x32fddc, _0x1a1874);
          (_0x18b3e2 !== null &&
            (_0x529a3e.matrix.fromArray(_0x18b3e2.transform.matrix),
            _0x529a3e.matrix.decompose(_0x529a3e.position, _0x529a3e.rotation, _0x529a3e.scale),
            (_0x529a3e.matrixWorldNeedsUpdate = true),
            (_0x529a3e.jointRadius = _0x18b3e2.radius)),
            (_0x529a3e.visible = _0x18b3e2 !== null));
        }
        const _0x1a3c60 = _0x32fddc.joints['index-finger-tip'],
          _0x4f8419 = _0x32fddc.joints['thumb-tip'],
          _0x2197d2 = _0x1a3c60.position.distanceTo(_0x4f8419.position),
          _0x4cec02 = 0.02,
          _0x1e7b15 = 0.005;
        if (_0x32fddc.inputState.pinching && _0x2197d2 > _0x4cec02 + _0x1e7b15)
          ((_0x32fddc.inputState.pinching = false),
            this.dispatchEvent({ type: 'pinchend', handedness: _0x4fcabd.handedness, target: this }));
        else
          !_0x32fddc.inputState.pinching &&
            _0x2197d2 <= _0x4cec02 - _0x1e7b15 &&
            ((_0x32fddc.inputState.pinching = true),
            this.dispatchEvent({ type: 'pinchstart', handedness: _0x4fcabd.handedness, target: this }));
      } else
        _0x234217 !== null &&
          _0x4fcabd.gripSpace &&
          ((_0x2f5434 = _0x4b928a.getPose(_0x4fcabd.gripSpace, _0x39eb26)),
          _0x2f5434 !== null &&
            (_0x234217.matrix.fromArray(_0x2f5434.transform.matrix),
            _0x234217.matrix.decompose(_0x234217.position, _0x234217.rotation, _0x234217.scale),
            (_0x234217.matrixWorldNeedsUpdate = true),
            _0x2f5434.linearVelocity
              ? ((_0x234217.hasLinearVelocity = true),
                _0x234217.linearVelocity.copy(_0x2f5434.linearVelocity))
              : (_0x234217.hasLinearVelocity = false),
            _0x2f5434.angularVelocity
              ? ((_0x234217.hasAngularVelocity = true),
                _0x234217.angularVelocity.copy(_0x2f5434.angularVelocity))
              : (_0x234217.hasAngularVelocity = false)));
      _0x2cfcb7 !== null &&
        ((_0x431d7d = _0x4b928a.getPose(_0x4fcabd.targetRaySpace, _0x39eb26)),
        _0x431d7d === null && _0x2f5434 !== null && (_0x431d7d = _0x2f5434),
        _0x431d7d !== null &&
          (_0x2cfcb7.matrix.fromArray(_0x431d7d.transform.matrix),
          _0x2cfcb7.matrix.decompose(_0x2cfcb7.position, _0x2cfcb7.rotation, _0x2cfcb7.scale),
          (_0x2cfcb7.matrixWorldNeedsUpdate = true),
          _0x431d7d.linearVelocity
            ? ((_0x2cfcb7.hasLinearVelocity = true), _0x2cfcb7.linearVelocity.copy(_0x431d7d.linearVelocity))
            : (_0x2cfcb7.hasLinearVelocity = false),
          _0x431d7d.angularVelocity
            ? ((_0x2cfcb7.hasAngularVelocity = true),
              _0x2cfcb7.angularVelocity.copy(_0x431d7d.angularVelocity))
            : (_0x2cfcb7.hasAngularVelocity = false),
          this.dispatchEvent(_moveEvent)));
    }
    return (
      _0x2cfcb7 !== null && (_0x2cfcb7.visible = _0x431d7d !== null),
      _0x234217 !== null && (_0x234217.visible = _0x2f5434 !== null),
      _0x32fddc !== null && (_0x32fddc.visible = _0xadcdfe !== null),
      this
    );
  }
  ['_getHandJoint'](_0x4b5e41, _0x4ab5f5) {
    if (_0x4b5e41.joints[_0x4ab5f5.jointName] === undefined) {
      const _0x3962d7 = new Group();
      ((_0x3962d7.matrixAutoUpdate = false),
        (_0x3962d7.visible = false),
        (_0x4b5e41.joints[_0x4ab5f5.jointName] = _0x3962d7),
        _0x4b5e41.add(_0x3962d7));
    }
    return _0x4b5e41.joints[_0x4ab5f5.jointName];
  }
}
class FogExp2 {
  constructor(_0x131f9b, _0xf262f0 = 0.00025) {
    ((this.isFogExp2 = true),
      (this.name = ''),
      (this.color = new Color(_0x131f9b)),
      (this.density = _0xf262f0));
  }
  ['clone']() {
    return new FogExp2(this.color, this.density);
  }
  ['toJSON']() {
    return { type: 'FogExp2', name: this.name, color: this.color.getHex(), density: this.density };
  }
}
class Fog {
  constructor(_0x13c326, _0x4a7c96 = 1, _0x3b002f = 0x3e8) {
    ((this.isFog = true),
      (this.name = ''),
      (this.color = new Color(_0x13c326)),
      (this.near = _0x4a7c96),
      (this.far = _0x3b002f));
  }
  ['clone']() {
    return new Fog(this.color, this.near, this.far);
  }
  ['toJSON']() {
    return { type: 'Fog', name: this.name, color: this.color.getHex(), near: this.near, far: this.far };
  }
}
class Scene extends Object3D {
  constructor() {
    (super(),
      (this.isScene = true),
      (this.type = 'Scene'),
      (this.background = null),
      (this.environment = null),
      (this.fog = null),
      (this.backgroundBlurriness = 0),
      (this.backgroundIntensity = 1),
      (this.backgroundRotation = new Euler()),
      (this.environmentIntensity = 1),
      (this.environmentRotation = new Euler()),
      (this.overrideMaterial = null),
      typeof __THREE_DEVTOOLS__ !== 'undefined' &&
        __THREE_DEVTOOLS__.dispatchEvent(new CustomEvent('observe', { detail: this })));
  }
  ['copy'](_0x12ca65, _0x176f9f) {
    super.copy(_0x12ca65, _0x176f9f);
    if (_0x12ca65.background !== null) this.background = _0x12ca65.background.clone();
    if (_0x12ca65.environment !== null) this.environment = _0x12ca65.environment.clone();
    if (_0x12ca65.fog !== null) this.fog = _0x12ca65.fog.clone();
    ((this.backgroundBlurriness = _0x12ca65.backgroundBlurriness),
      (this.backgroundIntensity = _0x12ca65.backgroundIntensity),
      this.backgroundRotation.copy(_0x12ca65.backgroundRotation),
      (this.environmentIntensity = _0x12ca65.environmentIntensity),
      this.environmentRotation.copy(_0x12ca65.environmentRotation));
    if (_0x12ca65.overrideMaterial !== null) this.overrideMaterial = _0x12ca65.overrideMaterial.clone();
    return ((this.matrixAutoUpdate = _0x12ca65.matrixAutoUpdate), this);
  }
  ['toJSON'](_0x2f5fb5) {
    const _0x24606c = super.toJSON(_0x2f5fb5);
    if (this.fog !== null) _0x24606c.object.fog = this.fog.toJSON();
    if (this.backgroundBlurriness > 0) _0x24606c.object.backgroundBlurriness = this.backgroundBlurriness;
    if (this.backgroundIntensity !== 1) _0x24606c.object.backgroundIntensity = this.backgroundIntensity;
    _0x24606c.object.backgroundRotation = this.backgroundRotation.toArray();
    if (this.environmentIntensity !== 1) _0x24606c.object.environmentIntensity = this.environmentIntensity;
    return ((_0x24606c.object.environmentRotation = this.environmentRotation.toArray()), _0x24606c);
  }
}
class InterleavedBuffer {
  constructor(_0x54a8c8, _0x5846cf) {
    ((this.isInterleavedBuffer = true),
      (this.array = _0x54a8c8),
      (this.stride = _0x5846cf),
      (this.count = _0x54a8c8 !== undefined ? _0x54a8c8.length / _0x5846cf : 0),
      (this.usage = StaticDrawUsage),
      (this.updateRanges = []),
      (this.version = 0),
      (this.uuid = generateUUID()));
  }
  ['onUploadCallback']() {}
  set ['needsUpdate'](_0x4ae206) {
    if (_0x4ae206 === true) this.version++;
  }
  ['setUsage'](_0x1c5b00) {
    return ((this.usage = _0x1c5b00), this);
  }
  ['addUpdateRange'](_0x6c639a, _0xf7b2dc) {
    this.updateRanges.push({ start: _0x6c639a, count: _0xf7b2dc });
  }
  ['clearUpdateRanges']() {
    this.updateRanges.length = 0;
  }
  ['copy'](_0x550445) {
    return (
      (this.array = new _0x550445['array']['constructor'](_0x550445.array)),
      (this.count = _0x550445.count),
      (this.stride = _0x550445.stride),
      (this.usage = _0x550445.usage),
      this
    );
  }
  ['copyAt'](_0x2e95e4, _0x36356d, _0x2bcb1a) {
    ((_0x2e95e4 *= this.stride), (_0x2bcb1a *= _0x36356d.stride));
    for (let _0x9b512d = 0, _0x31eb7f = this.stride; _0x9b512d < _0x31eb7f; _0x9b512d++) {
      this.array[_0x2e95e4 + _0x9b512d] = _0x36356d.array[_0x2bcb1a + _0x9b512d];
    }
    return this;
  }
  ['set'](_0x385940, _0x2c1642 = 0) {
    return (this.array.set(_0x385940, _0x2c1642), this);
  }
  ['clone'](_0x44c4a1) {
    _0x44c4a1.arrayBuffers === undefined && (_0x44c4a1.arrayBuffers = {});
    this.array.buffer._uuid === undefined && (this.array.buffer._uuid = generateUUID());
    _0x44c4a1.arrayBuffers[this.array.buffer._uuid] === undefined &&
      (_0x44c4a1.arrayBuffers[this.array.buffer._uuid] = this.array.slice(0).buffer);
    const _0x454402 = new this['array']['constructor'](_0x44c4a1.arrayBuffers[this.array.buffer._uuid]),
      _0x19e427 = new this.constructor(_0x454402, this.stride);
    return (_0x19e427.setUsage(this.usage), _0x19e427);
  }
  ['onUpload'](_0x59fe79) {
    return ((this.onUploadCallback = _0x59fe79), this);
  }
  ['toJSON'](_0x1ab316) {
    return (
      _0x1ab316.arrayBuffers === undefined && (_0x1ab316.arrayBuffers = {}),
      this.array.buffer._uuid === undefined && (this.array.buffer._uuid = generateUUID()),
      _0x1ab316.arrayBuffers[this.array.buffer._uuid] === undefined &&
        (_0x1ab316.arrayBuffers[this.array.buffer._uuid] = Array.from(new Uint32Array(this.array.buffer))),
      {
        uuid: this.uuid,
        buffer: this.array.buffer._uuid,
        type: this.array.constructor.name,
        stride: this.stride,
      }
    );
  }
}
const _vector$7 = new Vector3();
class InterleavedBufferAttribute {
  constructor(_0x50a523, _0x2b4451, _0x9d150a, _0x378092 = false) {
    ((this.isInterleavedBufferAttribute = true),
      (this.name = ''),
      (this.data = _0x50a523),
      (this.itemSize = _0x2b4451),
      (this.offset = _0x9d150a),
      (this.normalized = _0x378092));
  }
  get ['count']() {
    return this.data.count;
  }
  get ['array']() {
    return this.data.array;
  }
  set ['needsUpdate'](_0x7a15fc) {
    this.data.needsUpdate = _0x7a15fc;
  }
  ['applyMatrix4'](_0x3b0393) {
    for (let _0x318270 = 0, _0x2085c1 = this.data.count; _0x318270 < _0x2085c1; _0x318270++) {
      (_vector$7.fromBufferAttribute(this, _0x318270),
        _vector$7.applyMatrix4(_0x3b0393),
        this.setXYZ(_0x318270, _vector$7.x, _vector$7.y, _vector$7.z));
    }
    return this;
  }
  ['applyNormalMatrix'](_0x238676) {
    for (let _0x57e8dd = 0, _0x48484b = this.count; _0x57e8dd < _0x48484b; _0x57e8dd++) {
      (_vector$7.fromBufferAttribute(this, _0x57e8dd),
        _vector$7.applyNormalMatrix(_0x238676),
        this.setXYZ(_0x57e8dd, _vector$7.x, _vector$7.y, _vector$7.z));
    }
    return this;
  }
  ['transformDirection'](_0x5d229a) {
    for (let _0x1811fd = 0, _0x1f5188 = this.count; _0x1811fd < _0x1f5188; _0x1811fd++) {
      (_vector$7.fromBufferAttribute(this, _0x1811fd),
        _vector$7.transformDirection(_0x5d229a),
        this.setXYZ(_0x1811fd, _vector$7.x, _vector$7.y, _vector$7.z));
    }
    return this;
  }
  ['getComponent'](_0x1fdd56, _0x22b9d4) {
    let _0x170947 = this.array[_0x1fdd56 * this.data.stride + this.offset + _0x22b9d4];
    if (this.normalized) _0x170947 = denormalize(_0x170947, this.array);
    return _0x170947;
  }
  ['setComponent'](_0x40217e, _0x2eb6c4, _0x14a0da) {
    if (this.normalized) _0x14a0da = normalize(_0x14a0da, this.array);
    return ((this.data.array[_0x40217e * this.data.stride + this.offset + _0x2eb6c4] = _0x14a0da), this);
  }
  ['setX'](_0x3093ba, _0x34ff43) {
    if (this.normalized) _0x34ff43 = normalize(_0x34ff43, this.array);
    return ((this.data.array[_0x3093ba * this.data.stride + this.offset] = _0x34ff43), this);
  }
  ['setY'](_0x50dff2, _0x542539) {
    if (this.normalized) _0x542539 = normalize(_0x542539, this.array);
    return ((this.data.array[_0x50dff2 * this.data.stride + this.offset + 1] = _0x542539), this);
  }
  ['setZ'](_0x5b56f0, _0x2d3481) {
    if (this.normalized) _0x2d3481 = normalize(_0x2d3481, this.array);
    return ((this.data.array[_0x5b56f0 * this.data.stride + this.offset + 2] = _0x2d3481), this);
  }
  ['setW'](_0x18bba2, _0x52a1d8) {
    if (this.normalized) _0x52a1d8 = normalize(_0x52a1d8, this.array);
    return ((this.data.array[_0x18bba2 * this.data.stride + this.offset + 3] = _0x52a1d8), this);
  }
  ['getX'](_0x1e31f9) {
    let _0x4e09b0 = this.data.array[_0x1e31f9 * this.data.stride + this.offset];
    if (this.normalized) _0x4e09b0 = denormalize(_0x4e09b0, this.array);
    return _0x4e09b0;
  }
  ['getY'](_0x321ca3) {
    let _0x35f9b3 = this.data.array[_0x321ca3 * this.data.stride + this.offset + 1];
    if (this.normalized) _0x35f9b3 = denormalize(_0x35f9b3, this.array);
    return _0x35f9b3;
  }
  ['getZ'](_0xa6237e) {
    let _0x5da097 = this.data.array[_0xa6237e * this.data.stride + this.offset + 2];
    if (this.normalized) _0x5da097 = denormalize(_0x5da097, this.array);
    return _0x5da097;
  }
  ['getW'](_0x1a56c7) {
    let _0x1a3a9f = this.data.array[_0x1a56c7 * this.data.stride + this.offset + 3];
    if (this.normalized) _0x1a3a9f = denormalize(_0x1a3a9f, this.array);
    return _0x1a3a9f;
  }
  ['setXY'](_0x35cba7, _0x1fa7fe, _0x1af1b9) {
    return (
      (_0x35cba7 = _0x35cba7 * this.data.stride + this.offset),
      this.normalized &&
        ((_0x1fa7fe = normalize(_0x1fa7fe, this.array)), (_0x1af1b9 = normalize(_0x1af1b9, this.array))),
      (this.data.array[_0x35cba7 + 0] = _0x1fa7fe),
      (this.data.array[_0x35cba7 + 1] = _0x1af1b9),
      this
    );
  }
  ['setXYZ'](_0x5ddabb, _0x82d726, _0x4b2909, _0x10840a) {
    return (
      (_0x5ddabb = _0x5ddabb * this.data.stride + this.offset),
      this.normalized &&
        ((_0x82d726 = normalize(_0x82d726, this.array)),
        (_0x4b2909 = normalize(_0x4b2909, this.array)),
        (_0x10840a = normalize(_0x10840a, this.array))),
      (this.data.array[_0x5ddabb + 0] = _0x82d726),
      (this.data.array[_0x5ddabb + 1] = _0x4b2909),
      (this.data.array[_0x5ddabb + 2] = _0x10840a),
      this
    );
  }
  ['setXYZW'](_0x53ca33, _0x5eebe6, _0x38aa4d, _0x3dfca0, _0x101506) {
    return (
      (_0x53ca33 = _0x53ca33 * this.data.stride + this.offset),
      this.normalized &&
        ((_0x5eebe6 = normalize(_0x5eebe6, this.array)),
        (_0x38aa4d = normalize(_0x38aa4d, this.array)),
        (_0x3dfca0 = normalize(_0x3dfca0, this.array)),
        (_0x101506 = normalize(_0x101506, this.array))),
      (this.data.array[_0x53ca33 + 0] = _0x5eebe6),
      (this.data.array[_0x53ca33 + 1] = _0x38aa4d),
      (this.data.array[_0x53ca33 + 2] = _0x3dfca0),
      (this.data.array[_0x53ca33 + 3] = _0x101506),
      this
    );
  }
  ['clone'](_0x5c3cc7) {
    if (_0x5c3cc7 === undefined) {
      console.log(
        'THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.',
      );
      const _0x4a14c7 = [];
      for (let _0x1e1877 = 0; _0x1e1877 < this.count; _0x1e1877++) {
        const _0x36ca55 = _0x1e1877 * this.data.stride + this.offset;
        for (let _0xf6bad6 = 0; _0xf6bad6 < this.itemSize; _0xf6bad6++) {
          _0x4a14c7.push(this.data.array[_0x36ca55 + _0xf6bad6]);
        }
      }
      return new BufferAttribute(new this['array'].constructor(_0x4a14c7), this.itemSize, this.normalized);
    } else
      return (
        _0x5c3cc7.interleavedBuffers === undefined && (_0x5c3cc7.interleavedBuffers = {}),
        _0x5c3cc7.interleavedBuffers[this.data.uuid] === undefined &&
          (_0x5c3cc7.interleavedBuffers[this.data.uuid] = this.data.clone(_0x5c3cc7)),
        new InterleavedBufferAttribute(
          _0x5c3cc7.interleavedBuffers[this.data.uuid],
          this.itemSize,
          this.offset,
          this.normalized,
        )
      );
  }
  ['toJSON'](_0x3f6f6d) {
    if (_0x3f6f6d === undefined) {
      console.log(
        'THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.',
      );
      const _0x4cd4a6 = [];
      for (let _0x34fc74 = 0; _0x34fc74 < this.count; _0x34fc74++) {
        const _0x444152 = _0x34fc74 * this.data.stride + this.offset;
        for (let _0x4ca46d = 0; _0x4ca46d < this.itemSize; _0x4ca46d++) {
          _0x4cd4a6.push(this.data.array[_0x444152 + _0x4ca46d]);
        }
      }
      return {
        itemSize: this.itemSize,
        type: this.array.constructor.name,
        array: _0x4cd4a6,
        normalized: this.normalized,
      };
    } else
      return (
        _0x3f6f6d.interleavedBuffers === undefined && (_0x3f6f6d.interleavedBuffers = {}),
        _0x3f6f6d.interleavedBuffers[this.data.uuid] === undefined &&
          (_0x3f6f6d.interleavedBuffers[this.data.uuid] = this.data.toJSON(_0x3f6f6d)),
        {
          isInterleavedBufferAttribute: true,
          itemSize: this.itemSize,
          data: this.data.uuid,
          offset: this.offset,
          normalized: this.normalized,
        }
      );
  }
}
class SpriteMaterial extends Material {
  constructor(_0xa413e3) {
    (super(),
      (this.isSpriteMaterial = true),
      (this.type = 'SpriteMaterial'),
      (this.color = new Color(0xffffff)),
      (this.map = null),
      (this.alphaMap = null),
      (this.rotation = 0),
      (this.sizeAttenuation = true),
      (this.transparent = true),
      (this.fog = true),
      this.setValues(_0xa413e3));
  }
  ['copy'](_0x4456bc) {
    return (
      super.copy(_0x4456bc),
      this.color.copy(_0x4456bc.color),
      (this.map = _0x4456bc.map),
      (this.alphaMap = _0x4456bc.alphaMap),
      (this.rotation = _0x4456bc.rotation),
      (this.sizeAttenuation = _0x4456bc.sizeAttenuation),
      (this.fog = _0x4456bc.fog),
      this
    );
  }
}
let _geometry;
const _intersectPoint = new Vector3(),
  _worldScale = new Vector3(),
  _mvPosition = new Vector3(),
  _alignedPosition = new Vector2(),
  _rotatedPosition = new Vector2(),
  _viewWorldMatrix = new Matrix4(),
  _vA = new Vector3(),
  _vB = new Vector3(),
  _vC = new Vector3(),
  _uvA = new Vector2(),
  _uvB = new Vector2(),
  _uvC = new Vector2();
class Sprite extends Object3D {
  constructor(_0x18e586 = new SpriteMaterial()) {
    (super(), (this.isSprite = true), (this.type = 'Sprite'));
    if (_geometry === undefined) {
      _geometry = new BufferGeometry();
      const _0x18af4e = new Float32Array([
          -0.5, -0.5, 0, 0, 0, 0.5, -0.5, 0, 1, 0, 0.5, 0.5, 0, 1, 1, -0.5, 0.5, 0, 0, 1,
        ]),
        _0xa9f96c = new InterleavedBuffer(_0x18af4e, 5);
      (_geometry.setIndex([0, 1, 2, 0, 2, 3]),
        _geometry.setAttribute('position', new InterleavedBufferAttribute(_0xa9f96c, 3, 0, false)),
        _geometry.setAttribute('uv', new InterleavedBufferAttribute(_0xa9f96c, 2, 3, false)));
    }
    ((this.geometry = _geometry),
      (this.material = _0x18e586),
      (this.center = new Vector2(0.5, 0.5)),
      (this.count = 1));
  }
  ['raycast'](_0x19a169, _0x48112b) {
    _0x19a169.camera === null &&
      console.error('THREE.Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.');
    (_worldScale.setFromMatrixScale(this.matrixWorld),
      _viewWorldMatrix.copy(_0x19a169.camera.matrixWorld),
      this.modelViewMatrix.multiplyMatrices(_0x19a169.camera.matrixWorldInverse, this.matrixWorld),
      _mvPosition.setFromMatrixPosition(this.modelViewMatrix));
    _0x19a169.camera.isPerspectiveCamera &&
      this.material.sizeAttenuation === false &&
      _worldScale.multiplyScalar(-_mvPosition.z);
    const _0x2df48e = this.material.rotation;
    let _0x45efd7, _0x42b919;
    _0x2df48e !== 0 && ((_0x42b919 = Math.cos(_0x2df48e)), (_0x45efd7 = Math.sin(_0x2df48e)));
    const _0x28adf5 = this.center;
    (transformVertex(_vA.set(-0.5, -0.5, 0), _mvPosition, _0x28adf5, _worldScale, _0x45efd7, _0x42b919),
      transformVertex(_vB.set(0.5, -0.5, 0), _mvPosition, _0x28adf5, _worldScale, _0x45efd7, _0x42b919),
      transformVertex(_vC.set(0.5, 0.5, 0), _mvPosition, _0x28adf5, _worldScale, _0x45efd7, _0x42b919),
      _uvA.set(0, 0),
      _uvB.set(1, 0),
      _uvC.set(1, 1));
    let _0x1a557f = _0x19a169.ray.intersectTriangle(_vA, _vB, _vC, false, _intersectPoint);
    if (_0x1a557f === null) {
      (transformVertex(_vB.set(-0.5, 0.5, 0), _mvPosition, _0x28adf5, _worldScale, _0x45efd7, _0x42b919),
        _uvB.set(0, 1),
        (_0x1a557f = _0x19a169.ray.intersectTriangle(_vA, _vC, _vB, false, _intersectPoint)));
      if (_0x1a557f === null) return;
    }
    const _0x2ffb9b = _0x19a169.ray.origin.distanceTo(_intersectPoint);
    if (_0x2ffb9b < _0x19a169.near || _0x2ffb9b > _0x19a169.far) return;
    _0x48112b.push({
      distance: _0x2ffb9b,
      point: _intersectPoint.clone(),
      uv: Triangle.getInterpolation(_intersectPoint, _vA, _vB, _vC, _uvA, _uvB, _uvC, new Vector2()),
      face: null,
      object: this,
    });
  }
  ['copy'](_0xb59e1b, _0x391633) {
    super.copy(_0xb59e1b, _0x391633);
    if (_0xb59e1b.center !== undefined) this.center.copy(_0xb59e1b.center);
    return ((this.material = _0xb59e1b.material), this);
  }
}
function transformVertex(_0x249c6b, _0x298e5e, _0x331ca0, _0x2c8cfa, _0x4c8e46, _0x17f099) {
  (_alignedPosition.subVectors(_0x249c6b, _0x331ca0).addScalar(0.5).multiply(_0x2c8cfa),
    _0x4c8e46 !== undefined
      ? ((_rotatedPosition.x = _0x17f099 * _alignedPosition.x - _0x4c8e46 * _alignedPosition.y),
        (_rotatedPosition.y = _0x4c8e46 * _alignedPosition.x + _0x17f099 * _alignedPosition.y))
      : _rotatedPosition.copy(_alignedPosition),
    _0x249c6b.copy(_0x298e5e),
    (_0x249c6b.x += _rotatedPosition.x),
    (_0x249c6b.y += _rotatedPosition.y),
    _0x249c6b.applyMatrix4(_viewWorldMatrix));
}
const _v1$2 = new Vector3(),
  _v2$1 = new Vector3();
class LOD extends Object3D {
  constructor() {
    (super(),
      (this.isLOD = true),
      (this._currentLevel = 0),
      (this.type = 'LOD'),
      Object.defineProperties(this, { levels: { enumerable: true, value: [] } }),
      (this.autoUpdate = true));
  }
  ['copy'](_0x381e1d) {
    super.copy(_0x381e1d, false);
    const _0x5d2159 = _0x381e1d.levels;
    for (let _0x29d92a = 0, _0x4401fb = _0x5d2159.length; _0x29d92a < _0x4401fb; _0x29d92a++) {
      const _0x1362d9 = _0x5d2159[_0x29d92a];
      this.addLevel(_0x1362d9.object.clone(), _0x1362d9.distance, _0x1362d9.hysteresis);
    }
    return ((this.autoUpdate = _0x381e1d.autoUpdate), this);
  }
  ['addLevel'](_0x8fde39, _0x219754 = 0, _0x1ad041 = 0) {
    _0x219754 = Math.abs(_0x219754);
    const _0x38d184 = this.levels;
    let _0x1bd168;
    for (_0x1bd168 = 0; _0x1bd168 < _0x38d184.length; _0x1bd168++) {
      if (_0x219754 < _0x38d184[_0x1bd168].distance) break;
    }
    return (
      _0x38d184.splice(_0x1bd168, 0, { distance: _0x219754, hysteresis: _0x1ad041, object: _0x8fde39 }),
      this.add(_0x8fde39),
      this
    );
  }
  ['removeLevel'](_0x2a1b48) {
    const _0x547f9e = this.levels;
    for (let _0x32722b = 0; _0x32722b < _0x547f9e.length; _0x32722b++) {
      if (_0x547f9e[_0x32722b].distance === _0x2a1b48) {
        const _0x418060 = _0x547f9e.splice(_0x32722b, 1);
        return (this.remove(_0x418060[0].object), true);
      }
    }
    return false;
  }
  ['getCurrentLevel']() {
    return this._currentLevel;
  }
  ['getObjectForDistance'](_0x4f0aa8) {
    const _0x993506 = this.levels;
    if (_0x993506.length > 0) {
      let _0x10b154, _0x2d977d;
      for (_0x10b154 = 1, _0x2d977d = _0x993506.length; _0x10b154 < _0x2d977d; _0x10b154++) {
        let _0x45f87a = _0x993506[_0x10b154].distance;
        _0x993506[_0x10b154].object.visible && (_0x45f87a -= _0x45f87a * _0x993506[_0x10b154].hysteresis);
        if (_0x4f0aa8 < _0x45f87a) break;
      }
      return _0x993506[_0x10b154 - 1].object;
    }
    return null;
  }
  ['raycast'](_0x84e15f, _0x110b0a) {
    const _0x59993 = this.levels;
    if (_0x59993.length > 0) {
      _v1$2.setFromMatrixPosition(this.matrixWorld);
      const _0x51bd21 = _0x84e15f.ray.origin.distanceTo(_v1$2);
      this.getObjectForDistance(_0x51bd21).raycast(_0x84e15f, _0x110b0a);
    }
  }
  ['update'](_0x7c236a) {
    const _0x5bc9ce = this.levels;
    if (_0x5bc9ce.length > 1) {
      (_v1$2.setFromMatrixPosition(_0x7c236a.matrixWorld), _v2$1.setFromMatrixPosition(this.matrixWorld));
      const _0xce850 = _v1$2.distanceTo(_v2$1) / _0x7c236a.zoom;
      _0x5bc9ce[0].object.visible = true;
      let _0x3aebdd, _0x5983ec;
      for (_0x3aebdd = 1, _0x5983ec = _0x5bc9ce.length; _0x3aebdd < _0x5983ec; _0x3aebdd++) {
        let _0x134d83 = _0x5bc9ce[_0x3aebdd].distance;
        _0x5bc9ce[_0x3aebdd].object.visible && (_0x134d83 -= _0x134d83 * _0x5bc9ce[_0x3aebdd].hysteresis);
        if (_0xce850 >= _0x134d83)
          ((_0x5bc9ce[_0x3aebdd - 1].object.visible = false), (_0x5bc9ce[_0x3aebdd].object.visible = true));
        else break;
      }
      this._currentLevel = _0x3aebdd - 1;
      for (; _0x3aebdd < _0x5983ec; _0x3aebdd++) {
        _0x5bc9ce[_0x3aebdd].object.visible = false;
      }
    }
  }
  ['toJSON'](_0x3e30cc) {
    const _0x4c3204 = super.toJSON(_0x3e30cc);
    if (this.autoUpdate === false) _0x4c3204.object.autoUpdate = false;
    _0x4c3204.object.levels = [];
    const _0x3d8042 = this.levels;
    for (let _0x5cccdc = 0, _0x1a4e46 = _0x3d8042.length; _0x5cccdc < _0x1a4e46; _0x5cccdc++) {
      const _0x22d782 = _0x3d8042[_0x5cccdc];
      _0x4c3204.object.levels.push({
        object: _0x22d782.object.uuid,
        distance: _0x22d782.distance,
        hysteresis: _0x22d782.hysteresis,
      });
    }
    return _0x4c3204;
  }
}
const _basePosition = new Vector3(),
  _skinIndex = new Vector4(),
  _skinWeight = new Vector4(),
  _vector3 = new Vector3(),
  _matrix4 = new Matrix4(),
  _vertex = new Vector3(),
  _sphere$5 = new Sphere(),
  _inverseMatrix$2 = new Matrix4(),
  _ray$2 = new Ray();
class SkinnedMesh extends Mesh {
  constructor(_0x45e6e9, _0x2862b2) {
    (super(_0x45e6e9, _0x2862b2),
      (this.isSkinnedMesh = true),
      (this.type = 'SkinnedMesh'),
      (this.bindMode = AttachedBindMode),
      (this.bindMatrix = new Matrix4()),
      (this.bindMatrixInverse = new Matrix4()),
      (this.boundingBox = null),
      (this.boundingSphere = null));
  }
  ['computeBoundingBox']() {
    const _0x5324b7 = this.geometry;
    this.boundingBox === null && (this.boundingBox = new Box3());
    this.boundingBox.makeEmpty();
    const _0x4fd66 = _0x5324b7.getAttribute('position');
    for (let _0x455a73 = 0; _0x455a73 < _0x4fd66.count; _0x455a73++) {
      (this.getVertexPosition(_0x455a73, _vertex), this.boundingBox.expandByPoint(_vertex));
    }
  }
  ['computeBoundingSphere']() {
    const _0x490f91 = this.geometry;
    this.boundingSphere === null && (this.boundingSphere = new Sphere());
    this.boundingSphere.makeEmpty();
    const _0xfc96da = _0x490f91.getAttribute('position');
    for (let _0x299583 = 0; _0x299583 < _0xfc96da.count; _0x299583++) {
      (this.getVertexPosition(_0x299583, _vertex), this.boundingSphere.expandByPoint(_vertex));
    }
  }
  ['copy'](_0x5ae746, _0x1ca5e1) {
    (super.copy(_0x5ae746, _0x1ca5e1),
      (this.bindMode = _0x5ae746.bindMode),
      this.bindMatrix.copy(_0x5ae746.bindMatrix),
      this.bindMatrixInverse.copy(_0x5ae746.bindMatrixInverse),
      (this.skeleton = _0x5ae746.skeleton));
    if (_0x5ae746.boundingBox !== null) this.boundingBox = _0x5ae746.boundingBox.clone();
    if (_0x5ae746.boundingSphere !== null) this.boundingSphere = _0x5ae746.boundingSphere.clone();
    return this;
  }
  ['raycast'](_0x34ff4a, _0x10737f) {
    const _0x54e744 = this.material,
      _0x122832 = this.matrixWorld;
    if (_0x54e744 === undefined) return;
    if (this.boundingSphere === null) this.computeBoundingSphere();
    (_sphere$5.copy(this.boundingSphere), _sphere$5.applyMatrix4(_0x122832));
    if (_0x34ff4a.ray.intersectsSphere(_sphere$5) === false) return;
    (_inverseMatrix$2.copy(_0x122832).invert(), _ray$2.copy(_0x34ff4a.ray).applyMatrix4(_inverseMatrix$2));
    if (this.boundingBox !== null) {
      if (_ray$2.intersectsBox(this.boundingBox) === false) return;
    }
    this._computeIntersections(_0x34ff4a, _0x10737f, _ray$2);
  }
  ['getVertexPosition'](_0xfad9ee, _0x1fcb97) {
    return (
      super.getVertexPosition(_0xfad9ee, _0x1fcb97),
      this.applyBoneTransform(_0xfad9ee, _0x1fcb97),
      _0x1fcb97
    );
  }
  ['bind'](_0x45aa27, _0x383a58) {
    ((this.skeleton = _0x45aa27),
      _0x383a58 === undefined &&
        (this.updateMatrixWorld(true), this.skeleton.calculateInverses(), (_0x383a58 = this.matrixWorld)),
      this.bindMatrix.copy(_0x383a58),
      this.bindMatrixInverse.copy(_0x383a58).invert());
  }
  ['pose']() {
    this.skeleton.pose();
  }
  ['normalizeSkinWeights']() {
    const _0x12fdbf = new Vector4(),
      _0x456cad = this.geometry.attributes.skinWeight;
    for (let _0x1da2e5 = 0, _0x4493ba = _0x456cad.count; _0x1da2e5 < _0x4493ba; _0x1da2e5++) {
      _0x12fdbf.fromBufferAttribute(_0x456cad, _0x1da2e5);
      const _0x3a9e08 = 1 / _0x12fdbf.manhattanLength();
      (_0x3a9e08 !== Infinity ? _0x12fdbf.multiplyScalar(_0x3a9e08) : _0x12fdbf.set(1, 0, 0, 0),
        _0x456cad.setXYZW(_0x1da2e5, _0x12fdbf.x, _0x12fdbf.y, _0x12fdbf.z, _0x12fdbf.w));
    }
  }
  ['updateMatrixWorld'](_0xfe61c3) {
    super.updateMatrixWorld(_0xfe61c3);
    if (this.bindMode === AttachedBindMode) this.bindMatrixInverse.copy(this.matrixWorld).invert();
    else
      this.bindMode === DetachedBindMode
        ? this.bindMatrixInverse.copy(this.bindMatrix).invert()
        : console.warn('THREE.SkinnedMesh: Unrecognized bindMode: ' + this.bindMode);
  }
  ['applyBoneTransform'](_0x582a41, _0x588e9c) {
    const _0x4be6b1 = this.skeleton,
      _0x2af561 = this.geometry;
    (_skinIndex.fromBufferAttribute(_0x2af561.attributes.skinIndex, _0x582a41),
      _skinWeight.fromBufferAttribute(_0x2af561.attributes.skinWeight, _0x582a41),
      _basePosition.copy(_0x588e9c).applyMatrix4(this.bindMatrix),
      _0x588e9c.set(0, 0, 0));
    for (let _0x16f766 = 0; _0x16f766 < 4; _0x16f766++) {
      const _0x4f7e47 = _skinWeight.getComponent(_0x16f766);
      if (_0x4f7e47 !== 0) {
        const _0x53c714 = _skinIndex.getComponent(_0x16f766);
        (_matrix4.multiplyMatrices(_0x4be6b1.bones[_0x53c714].matrixWorld, _0x4be6b1.boneInverses[_0x53c714]),
          _0x588e9c.addScaledVector(_vector3.copy(_basePosition).applyMatrix4(_matrix4), _0x4f7e47));
      }
    }
    return _0x588e9c.applyMatrix4(this.bindMatrixInverse);
  }
}
class Bone extends Object3D {
  constructor() {
    (super(), (this.isBone = true), (this.type = 'Bone'));
  }
}
class DataTexture extends Texture {
  constructor(
    _0x5d47ac = null,
    _0x1caffd = 1,
    _0x3a0b6f = 1,
    _0x26a427,
    _0x57dec4,
    _0x52a92e,
    _0x133b08,
    _0x5eb917,
    _0x28e4ea = NearestFilter,
    _0x15aa16 = NearestFilter,
    _0x32b31c,
    _0x494a7e,
  ) {
    (super(
      null,
      _0x52a92e,
      _0x133b08,
      _0x5eb917,
      _0x28e4ea,
      _0x15aa16,
      _0x26a427,
      _0x57dec4,
      _0x32b31c,
      _0x494a7e,
    ),
      (this.isDataTexture = true),
      (this.image = { data: _0x5d47ac, width: _0x1caffd, height: _0x3a0b6f }),
      (this.generateMipmaps = false),
      (this.flipY = false),
      (this.unpackAlignment = 1));
  }
}
const _offsetMatrix = new Matrix4(),
  _identityMatrix = new Matrix4();
class Skeleton {
  constructor(_0x106fc1 = [], _0x21f7db = []) {
    ((this.uuid = generateUUID()),
      (this.bones = _0x106fc1.slice(0)),
      (this.boneInverses = _0x21f7db),
      (this.boneMatrices = null),
      (this.boneTexture = null),
      this.init());
  }
  ['init']() {
    const _0x51dc79 = this.bones,
      _0x50c943 = this.boneInverses;
    this.boneMatrices = new Float32Array(_0x51dc79.length * 16);
    if (_0x50c943.length === 0) this.calculateInverses();
    else {
      if (_0x51dc79.length !== _0x50c943.length) {
        (console.warn('THREE.Skeleton: Number of inverse bone matrices does not match amount of bones.'),
          (this.boneInverses = []));
        for (let _0x247c4e = 0, _0x450e35 = this.bones.length; _0x247c4e < _0x450e35; _0x247c4e++) {
          this.boneInverses.push(new Matrix4());
        }
      }
    }
  }
  ['calculateInverses']() {
    this.boneInverses.length = 0;
    for (let _0x441770 = 0, _0x173352 = this.bones.length; _0x441770 < _0x173352; _0x441770++) {
      const _0x2d879f = new Matrix4();
      (this.bones[_0x441770] && _0x2d879f.copy(this.bones[_0x441770].matrixWorld).invert(),
        this.boneInverses.push(_0x2d879f));
    }
  }
  ['pose']() {
    for (let _0x2ed717 = 0, _0x57d1e0 = this.bones.length; _0x2ed717 < _0x57d1e0; _0x2ed717++) {
      const _0x1f3e0a = this.bones[_0x2ed717];
      _0x1f3e0a && _0x1f3e0a.matrixWorld.copy(this.boneInverses[_0x2ed717]).invert();
    }
    for (let _0x460a58 = 0, _0x50e777 = this.bones.length; _0x460a58 < _0x50e777; _0x460a58++) {
      const _0x4f3b08 = this.bones[_0x460a58];
      _0x4f3b08 &&
        (_0x4f3b08.parent && _0x4f3b08.parent.isBone
          ? (_0x4f3b08.matrix.copy(_0x4f3b08.parent.matrixWorld).invert(),
            _0x4f3b08.matrix.multiply(_0x4f3b08.matrixWorld))
          : _0x4f3b08.matrix.copy(_0x4f3b08.matrixWorld),
        _0x4f3b08.matrix.decompose(_0x4f3b08.position, _0x4f3b08.quaternion, _0x4f3b08.scale));
    }
  }
  ['update']() {
    const _0x1f6e20 = this.bones,
      _0xd3042e = this.boneInverses,
      _0x335b4a = this.boneMatrices,
      _0x2a47c6 = this.boneTexture;
    for (let _0x12fbbd = 0, _0x1c89d5 = _0x1f6e20.length; _0x12fbbd < _0x1c89d5; _0x12fbbd++) {
      const _0x8e93b0 = _0x1f6e20[_0x12fbbd] ? _0x1f6e20[_0x12fbbd].matrixWorld : _identityMatrix;
      (_offsetMatrix.multiplyMatrices(_0x8e93b0, _0xd3042e[_0x12fbbd]),
        _offsetMatrix.toArray(_0x335b4a, _0x12fbbd * 16));
    }
    _0x2a47c6 !== null && (_0x2a47c6.needsUpdate = true);
  }
  ['clone']() {
    return new Skeleton(this.bones, this.boneInverses);
  }
  ['computeBoneTexture']() {
    let _0x309c02 = Math.sqrt(this.bones.length * 4);
    ((_0x309c02 = Math.ceil(_0x309c02 / 4) * 4), (_0x309c02 = Math.max(_0x309c02, 4)));
    const _0x4395e5 = new Float32Array(_0x309c02 * _0x309c02 * 4);
    _0x4395e5.set(this.boneMatrices);
    const _0x185787 = new DataTexture(_0x4395e5, _0x309c02, _0x309c02, RGBAFormat, FloatType);
    return (
      (_0x185787.needsUpdate = true),
      (this.boneMatrices = _0x4395e5),
      (this.boneTexture = _0x185787),
      this
    );
  }
  ['getBoneByName'](_0x74a51c) {
    for (let _0x12a70e = 0, _0x46b7ad = this.bones.length; _0x12a70e < _0x46b7ad; _0x12a70e++) {
      const _0x25303a = this.bones[_0x12a70e];
      if (_0x25303a.name === _0x74a51c) return _0x25303a;
    }
    return undefined;
  }
  ['dispose']() {
    this.boneTexture !== null && (this.boneTexture.dispose(), (this.boneTexture = null));
  }
  ['fromJSON'](_0x35a160, _0x1dee24) {
    this.uuid = _0x35a160.uuid;
    for (let _0x4187e1 = 0, _0x2b69b0 = _0x35a160.bones.length; _0x4187e1 < _0x2b69b0; _0x4187e1++) {
      const _0xe34d99 = _0x35a160.bones[_0x4187e1];
      let _0x836e4d = _0x1dee24[_0xe34d99];
      (_0x836e4d === undefined &&
        (console.warn('THREE.Skeleton: No bone found with UUID:', _0xe34d99), (_0x836e4d = new Bone())),
        this.bones.push(_0x836e4d),
        this.boneInverses.push(new Matrix4().fromArray(_0x35a160.boneInverses[_0x4187e1])));
    }
    return (this.init(), this);
  }
  ['toJSON']() {
    const _0x3ec39f = {
      metadata: { version: 4.7, type: 'Skeleton', generator: 'Skeleton.toJSON' },
      bones: [],
      boneInverses: [],
    };
    _0x3ec39f.uuid = this.uuid;
    const _0x43c343 = this.bones,
      _0x311077 = this.boneInverses;
    for (let _0x224824 = 0, _0x3dd5ff = _0x43c343.length; _0x224824 < _0x3dd5ff; _0x224824++) {
      const _0x62b7af = _0x43c343[_0x224824];
      _0x3ec39f.bones.push(_0x62b7af.uuid);
      const _0xb73be2 = _0x311077[_0x224824];
      _0x3ec39f.boneInverses.push(_0xb73be2.toArray());
    }
    return _0x3ec39f;
  }
}
class InstancedBufferAttribute extends BufferAttribute {
  constructor(_0x761c9b, _0x1d320d, _0x2a413f, _0x4b06bc = 1) {
    (super(_0x761c9b, _0x1d320d, _0x2a413f),
      (this.isInstancedBufferAttribute = true),
      (this.meshPerAttribute = _0x4b06bc));
  }
  ['copy'](_0x2ea68b) {
    return (super.copy(_0x2ea68b), (this.meshPerAttribute = _0x2ea68b.meshPerAttribute), this);
  }
  ['toJSON']() {
    const _0x249448 = super.toJSON();
    return (
      (_0x249448.meshPerAttribute = this.meshPerAttribute),
      (_0x249448.isInstancedBufferAttribute = true),
      _0x249448
    );
  }
}
const _instanceLocalMatrix = new Matrix4(),
  _instanceWorldMatrix = new Matrix4(),
  _instanceIntersects = [],
  _box3 = new Box3(),
  _identity = new Matrix4(),
  _mesh$1 = new Mesh(),
  _sphere$4 = new Sphere();
class InstancedMesh extends Mesh {
  constructor(_0x3d0d2f, _0xa0c11b, _0xbdd427) {
    (super(_0x3d0d2f, _0xa0c11b),
      (this.isInstancedMesh = true),
      (this.instanceMatrix = new InstancedBufferAttribute(new Float32Array(_0xbdd427 * 16), 16)),
      (this.instanceColor = null),
      (this.morphTexture = null),
      (this.count = _0xbdd427),
      (this.boundingBox = null),
      (this.boundingSphere = null));
    for (let _0x4e6a23 = 0; _0x4e6a23 < _0xbdd427; _0x4e6a23++) {
      this.setMatrixAt(_0x4e6a23, _identity);
    }
  }
  ['computeBoundingBox']() {
    const _0x5303fe = this.geometry,
      _0x196357 = this.count;
    this.boundingBox === null && (this.boundingBox = new Box3());
    _0x5303fe.boundingBox === null && _0x5303fe.computeBoundingBox();
    this.boundingBox.makeEmpty();
    for (let _0x177b0d = 0; _0x177b0d < _0x196357; _0x177b0d++) {
      (this.getMatrixAt(_0x177b0d, _instanceLocalMatrix),
        _box3.copy(_0x5303fe.boundingBox).applyMatrix4(_instanceLocalMatrix),
        this.boundingBox.union(_box3));
    }
  }
  ['computeBoundingSphere']() {
    const _0x46c496 = this.geometry,
      _0x4a207b = this.count;
    this.boundingSphere === null && (this.boundingSphere = new Sphere());
    _0x46c496.boundingSphere === null && _0x46c496.computeBoundingSphere();
    this.boundingSphere.makeEmpty();
    for (let _0x2df5fa = 0; _0x2df5fa < _0x4a207b; _0x2df5fa++) {
      (this.getMatrixAt(_0x2df5fa, _instanceLocalMatrix),
        _sphere$4.copy(_0x46c496.boundingSphere).applyMatrix4(_instanceLocalMatrix),
        this.boundingSphere.union(_sphere$4));
    }
  }
  ['copy'](_0x2b4615, _0x4b945d) {
    (super.copy(_0x2b4615, _0x4b945d), this.instanceMatrix.copy(_0x2b4615.instanceMatrix));
    if (_0x2b4615.morphTexture !== null) this.morphTexture = _0x2b4615.morphTexture.clone();
    if (_0x2b4615.instanceColor !== null) this.instanceColor = _0x2b4615.instanceColor.clone();
    this.count = _0x2b4615.count;
    if (_0x2b4615.boundingBox !== null) this.boundingBox = _0x2b4615.boundingBox.clone();
    if (_0x2b4615.boundingSphere !== null) this.boundingSphere = _0x2b4615.boundingSphere.clone();
    return this;
  }
  ['getColorAt'](_0x1ae218, _0x1407f5) {
    _0x1407f5.fromArray(this.instanceColor.array, _0x1ae218 * 3);
  }
  ['getMatrixAt'](_0x43e804, _0x3728c8) {
    _0x3728c8.fromArray(this.instanceMatrix.array, _0x43e804 * 16);
  }
  ['getMorphAt'](_0x4f7507, _0xf6fd22) {
    const _0x6ab6ba = _0xf6fd22.morphTargetInfluences,
      _0x2eafc3 = this.morphTexture.source.data.data,
      _0x1e3607 = _0x6ab6ba.length + 1,
      _0x2aa66f = _0x4f7507 * _0x1e3607 + 1;
    for (let _0x25dd02 = 0; _0x25dd02 < _0x6ab6ba.length; _0x25dd02++) {
      _0x6ab6ba[_0x25dd02] = _0x2eafc3[_0x2aa66f + _0x25dd02];
    }
  }
  ['raycast'](_0x56db9a, _0x156654) {
    const _0xbc373 = this.matrixWorld,
      _0xc43623 = this.count;
    ((_mesh$1.geometry = this.geometry), (_mesh$1.material = this.material));
    if (_mesh$1.material === undefined) return;
    if (this.boundingSphere === null) this.computeBoundingSphere();
    (_sphere$4.copy(this.boundingSphere), _sphere$4.applyMatrix4(_0xbc373));
    if (_0x56db9a.ray.intersectsSphere(_sphere$4) === false) return;
    for (let _0x4e7667 = 0; _0x4e7667 < _0xc43623; _0x4e7667++) {
      (this.getMatrixAt(_0x4e7667, _instanceLocalMatrix),
        _instanceWorldMatrix.multiplyMatrices(_0xbc373, _instanceLocalMatrix),
        (_mesh$1.matrixWorld = _instanceWorldMatrix),
        _mesh$1.raycast(_0x56db9a, _instanceIntersects));
      for (let _0x28362d = 0, _0x447a5f = _instanceIntersects.length; _0x28362d < _0x447a5f; _0x28362d++) {
        const _0x4e7e69 = _instanceIntersects[_0x28362d];
        ((_0x4e7e69.instanceId = _0x4e7667), (_0x4e7e69.object = this), _0x156654.push(_0x4e7e69));
      }
      _instanceIntersects.length = 0;
    }
  }
  ['setColorAt'](_0x179e3d, _0x59c160) {
    (this.instanceColor === null &&
      (this.instanceColor = new InstancedBufferAttribute(
        new Float32Array(this.instanceMatrix.count * 3).fill(1),
        3,
      )),
      _0x59c160.toArray(this.instanceColor.array, _0x179e3d * 3));
  }
  ['setMatrixAt'](_0x3fd043, _0x59286f) {
    _0x59286f.toArray(this.instanceMatrix.array, _0x3fd043 * 16);
  }
  ['setMorphAt'](_0x59ea2a, _0x4a12e4) {
    const _0x537f9c = _0x4a12e4.morphTargetInfluences,
      _0x5e5e2f = _0x537f9c.length + 1;
    this.morphTexture === null &&
      (this.morphTexture = new DataTexture(
        new Float32Array(_0x5e5e2f * this.count),
        _0x5e5e2f,
        this.count,
        RedFormat,
        FloatType,
      ));
    const _0x2eb014 = this.morphTexture.source.data.data;
    let _0x426afe = 0;
    for (let _0x317219 = 0; _0x317219 < _0x537f9c.length; _0x317219++) {
      _0x426afe += _0x537f9c[_0x317219];
    }
    const _0x36c3b6 = this.geometry.morphTargetsRelative ? 1 : 1 - _0x426afe,
      _0x179300 = _0x5e5e2f * _0x59ea2a;
    ((_0x2eb014[_0x179300] = _0x36c3b6), _0x2eb014.set(_0x537f9c, _0x179300 + 1));
  }
  ['updateMorphTargets']() {}
  ['dispose']() {
    (this.dispatchEvent({ type: 'dispose' }),
      this.morphTexture !== null && (this.morphTexture.dispose(), (this.morphTexture = null)));
  }
}
const _vector1 = new Vector3(),
  _vector2 = new Vector3(),
  _normalMatrix = new Matrix3();
class Plane {
  constructor(_0x1bad42 = new Vector3(1, 0, 0), _0x382a5b = 0) {
    ((this.isPlane = true), (this.normal = _0x1bad42), (this.constant = _0x382a5b));
  }
  ['set'](_0x396456, _0x267f17) {
    return (this.normal.copy(_0x396456), (this.constant = _0x267f17), this);
  }
  ['setComponents'](_0x3c0d94, _0x1a906a, _0x536798, _0x53c8cc) {
    return (this.normal.set(_0x3c0d94, _0x1a906a, _0x536798), (this.constant = _0x53c8cc), this);
  }
  ['setFromNormalAndCoplanarPoint'](_0x2a8192, _0x16d27a) {
    return (this.normal.copy(_0x2a8192), (this.constant = -_0x16d27a.dot(this.normal)), this);
  }
  ['setFromCoplanarPoints'](_0x1eec10, _0x48fbed, _0x22e08a) {
    const _0x538180 = _vector1
      .subVectors(_0x22e08a, _0x48fbed)
      .cross(_vector2.subVectors(_0x1eec10, _0x48fbed))
      .normalize();
    return (this.setFromNormalAndCoplanarPoint(_0x538180, _0x1eec10), this);
  }
  ['copy'](_0x164bfe) {
    return (this.normal.copy(_0x164bfe.normal), (this.constant = _0x164bfe.constant), this);
  }
  ['normalize']() {
    const _0x229b72 = 1 / this.normal.length();
    return (this.normal.multiplyScalar(_0x229b72), (this.constant *= _0x229b72), this);
  }
  ['negate']() {
    return ((this.constant *= -1), this.normal.negate(), this);
  }
  ['distanceToPoint'](_0x5eebdc) {
    return this.normal.dot(_0x5eebdc) + this.constant;
  }
  ['distanceToSphere'](_0x38c7ac) {
    return this.distanceToPoint(_0x38c7ac.center) - _0x38c7ac.radius;
  }
  ['projectPoint'](_0x9bc775, _0x25f520) {
    return _0x25f520.copy(_0x9bc775).addScaledVector(this.normal, -this.distanceToPoint(_0x9bc775));
  }
  ['intersectLine'](_0xb4dff9, _0x1fb825) {
    const _0x4351fc = _0xb4dff9.delta(_vector1),
      _0x55eb51 = this.normal.dot(_0x4351fc);
    if (_0x55eb51 === 0) {
      if (this.distanceToPoint(_0xb4dff9.start) === 0) return _0x1fb825.copy(_0xb4dff9.start);
      return null;
    }
    const _0x455de5 = -(_0xb4dff9.start.dot(this.normal) + this.constant) / _0x55eb51;
    if (_0x455de5 < 0 || _0x455de5 > 1) return null;
    return _0x1fb825.copy(_0xb4dff9.start).addScaledVector(_0x4351fc, _0x455de5);
  }
  ['intersectsLine'](_0x45a6f7) {
    const _0x499a4a = this.distanceToPoint(_0x45a6f7.start),
      _0x34fd26 = this.distanceToPoint(_0x45a6f7.end);
    return (_0x499a4a < 0 && _0x34fd26 > 0) || (_0x34fd26 < 0 && _0x499a4a > 0);
  }
  ['intersectsBox'](_0x3609d4) {
    return _0x3609d4.intersectsPlane(this);
  }
  ['intersectsSphere'](_0x2ae40d) {
    return _0x2ae40d.intersectsPlane(this);
  }
  ['coplanarPoint'](_0xf9992c) {
    return _0xf9992c.copy(this.normal).multiplyScalar(-this.constant);
  }
  ['applyMatrix4'](_0x101395, _0x1a94a4) {
    const _0x562fb2 = _0x1a94a4 || _normalMatrix.getNormalMatrix(_0x101395),
      _0x1a7d3c = this.coplanarPoint(_vector1).applyMatrix4(_0x101395),
      _0x1080a5 = this.normal.applyMatrix3(_0x562fb2).normalize();
    return ((this.constant = -_0x1a7d3c.dot(_0x1080a5)), this);
  }
  ['translate'](_0x2b0b51) {
    return ((this.constant -= _0x2b0b51.dot(this.normal)), this);
  }
  ['equals'](_0x470362) {
    return _0x470362.normal.equals(this.normal) && _0x470362.constant === this.constant;
  }
  ['clone']() {
    return new this['constructor']().copy(this);
  }
}
const _sphere$3 = new Sphere(),
  _defaultSpriteCenter = new Vector2(0.5, 0.5),
  _vector$6 = new Vector3();
class Frustum {
  constructor(
    _0x4ed187 = new Plane(),
    _0x4b7787 = new Plane(),
    _0x341f8c = new Plane(),
    _0x5cbab = new Plane(),
    _0x3cac47 = new Plane(),
    _0x5f0869 = new Plane(),
  ) {
    this.planes = [_0x4ed187, _0x4b7787, _0x341f8c, _0x5cbab, _0x3cac47, _0x5f0869];
  }
  ['set'](_0x463284, _0x28aec6, _0x939dbe, _0x31e48c, _0x442c9b, _0x1b392e) {
    const _0x49f3b4 = this.planes;
    return (
      _0x49f3b4[0].copy(_0x463284),
      _0x49f3b4[1].copy(_0x28aec6),
      _0x49f3b4[2].copy(_0x939dbe),
      _0x49f3b4[3].copy(_0x31e48c),
      _0x49f3b4[4].copy(_0x442c9b),
      _0x49f3b4[5].copy(_0x1b392e),
      this
    );
  }
  ['copy'](_0x517941) {
    const _0x3cfe38 = this.planes;
    for (let _0x4723cc = 0; _0x4723cc < 6; _0x4723cc++) {
      _0x3cfe38[_0x4723cc].copy(_0x517941.planes[_0x4723cc]);
    }
    return this;
  }
  ['setFromProjectionMatrix'](_0x21b17a, _0x4a4c83 = WebGLCoordinateSystem, _0x452978 = false) {
    const _0x5de065 = this.planes,
      _0x5d5f52 = _0x21b17a.elements,
      _0x1f0c24 = _0x5d5f52[0],
      _0x22ac12 = _0x5d5f52[1],
      _0x14e8e2 = _0x5d5f52[2],
      _0x2ac8ba = _0x5d5f52[3],
      _0x72a8a = _0x5d5f52[4],
      _0x54b993 = _0x5d5f52[5],
      _0x29e0a2 = _0x5d5f52[6],
      _0x2d4b13 = _0x5d5f52[7],
      _0x138179 = _0x5d5f52[8],
      _0x43e809 = _0x5d5f52[9],
      _0x1f3610 = _0x5d5f52[10],
      _0x2ef63d = _0x5d5f52[11],
      _0x1a49e3 = _0x5d5f52[12],
      _0x17484e = _0x5d5f52[13],
      _0xcf09e1 = _0x5d5f52[14],
      _0x4e7574 = _0x5d5f52[15];
    (_0x5de065[0]
      .setComponents(
        _0x2ac8ba - _0x1f0c24,
        _0x2d4b13 - _0x72a8a,
        _0x2ef63d - _0x138179,
        _0x4e7574 - _0x1a49e3,
      )
      .normalize(),
      _0x5de065[1]
        .setComponents(
          _0x2ac8ba + _0x1f0c24,
          _0x2d4b13 + _0x72a8a,
          _0x2ef63d + _0x138179,
          _0x4e7574 + _0x1a49e3,
        )
        .normalize(),
      _0x5de065[2]
        .setComponents(
          _0x2ac8ba + _0x22ac12,
          _0x2d4b13 + _0x54b993,
          _0x2ef63d + _0x43e809,
          _0x4e7574 + _0x17484e,
        )
        .normalize(),
      _0x5de065[3]
        .setComponents(
          _0x2ac8ba - _0x22ac12,
          _0x2d4b13 - _0x54b993,
          _0x2ef63d - _0x43e809,
          _0x4e7574 - _0x17484e,
        )
        .normalize());
    if (_0x452978)
      (_0x5de065[4].setComponents(_0x14e8e2, _0x29e0a2, _0x1f3610, _0xcf09e1).normalize(),
        _0x5de065[5]
          .setComponents(
            _0x2ac8ba - _0x14e8e2,
            _0x2d4b13 - _0x29e0a2,
            _0x2ef63d - _0x1f3610,
            _0x4e7574 - _0xcf09e1,
          )
          .normalize());
    else {
      _0x5de065[4]
        .setComponents(
          _0x2ac8ba - _0x14e8e2,
          _0x2d4b13 - _0x29e0a2,
          _0x2ef63d - _0x1f3610,
          _0x4e7574 - _0xcf09e1,
        )
        .normalize();
      if (_0x4a4c83 === WebGLCoordinateSystem)
        _0x5de065[5]
          .setComponents(
            _0x2ac8ba + _0x14e8e2,
            _0x2d4b13 + _0x29e0a2,
            _0x2ef63d + _0x1f3610,
            _0x4e7574 + _0xcf09e1,
          )
          .normalize();
      else {
        if (_0x4a4c83 === WebGPUCoordinateSystem)
          _0x5de065[5].setComponents(_0x14e8e2, _0x29e0a2, _0x1f3610, _0xcf09e1).normalize();
        else
          throw new Error('THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: ' + _0x4a4c83);
      }
    }
    return this;
  }
  ['intersectsObject'](_0x493c04) {
    if (_0x493c04.boundingSphere !== undefined) {
      if (_0x493c04.boundingSphere === null) _0x493c04.computeBoundingSphere();
      _sphere$3.copy(_0x493c04.boundingSphere).applyMatrix4(_0x493c04.matrixWorld);
    } else {
      const _0x158ada = _0x493c04.geometry;
      if (_0x158ada.boundingSphere === null) _0x158ada.computeBoundingSphere();
      _sphere$3.copy(_0x158ada.boundingSphere).applyMatrix4(_0x493c04.matrixWorld);
    }
    return this.intersectsSphere(_sphere$3);
  }
  ['intersectsSprite'](_0x3df22a) {
    _sphere$3.center.set(0, 0, 0);
    const _0xf2ed8c = _defaultSpriteCenter.distanceTo(_0x3df22a.center);
    return (
      (_sphere$3.radius = 0.7071067811865476 + _0xf2ed8c),
      _sphere$3.applyMatrix4(_0x3df22a.matrixWorld),
      this.intersectsSphere(_sphere$3)
    );
  }
  ['intersectsSphere'](_0x4ded75) {
    const _0xa15e10 = this.planes,
      _0x1a7f58 = _0x4ded75.center,
      _0x152364 = -_0x4ded75.radius;
    for (let _0x2e264d = 0; _0x2e264d < 6; _0x2e264d++) {
      const _0x5d4795 = _0xa15e10[_0x2e264d].distanceToPoint(_0x1a7f58);
      if (_0x5d4795 < _0x152364) return false;
    }
    return true;
  }
  ['intersectsBox'](_0x19d376) {
    const _0x3dfcf9 = this.planes;
    for (let _0x26969c = 0; _0x26969c < 6; _0x26969c++) {
      const _0xa465d8 = _0x3dfcf9[_0x26969c];
      ((_vector$6.x = _0xa465d8.normal.x > 0 ? _0x19d376.max.x : _0x19d376.min.x),
        (_vector$6.y = _0xa465d8.normal.y > 0 ? _0x19d376.max.y : _0x19d376.min.y),
        (_vector$6.z = _0xa465d8.normal.z > 0 ? _0x19d376.max.z : _0x19d376.min.z));
      if (_0xa465d8.distanceToPoint(_vector$6) < 0) return false;
    }
    return true;
  }
  ['containsPoint'](_0x1a264e) {
    const _0xbcab5 = this.planes;
    for (let _0x2e2c8f = 0; _0x2e2c8f < 6; _0x2e2c8f++) {
      if (_0xbcab5[_0x2e2c8f].distanceToPoint(_0x1a264e) < 0) return false;
    }
    return true;
  }
  ['clone']() {
    return new this['constructor']().copy(this);
  }
}
const _projScreenMatrix$2 = new Matrix4(),
  _frustum$1 = new Frustum();
class FrustumArray {
  constructor() {
    this.coordinateSystem = WebGLCoordinateSystem;
  }
  ['intersectsObject'](_0x45e1f2, _0x15a8a4) {
    if (!_0x15a8a4.isArrayCamera || _0x15a8a4.cameras.length === 0) return false;
    for (let _0x20a834 = 0; _0x20a834 < _0x15a8a4.cameras.length; _0x20a834++) {
      const _0x2667ad = _0x15a8a4.cameras[_0x20a834];
      (_projScreenMatrix$2.multiplyMatrices(_0x2667ad.projectionMatrix, _0x2667ad.matrixWorldInverse),
        _frustum$1.setFromProjectionMatrix(
          _projScreenMatrix$2,
          _0x2667ad.coordinateSystem,
          _0x2667ad.reversedDepth,
        ));
      if (_frustum$1.intersectsObject(_0x45e1f2)) return true;
    }
    return false;
  }
  ['intersectsSprite'](_0x1b450a, _0x28eee3) {
    if (!_0x28eee3 || !_0x28eee3.cameras || _0x28eee3.cameras.length === 0) return false;
    for (let _0x56bd16 = 0; _0x56bd16 < _0x28eee3.cameras.length; _0x56bd16++) {
      const _0x57f0f2 = _0x28eee3.cameras[_0x56bd16];
      (_projScreenMatrix$2.multiplyMatrices(_0x57f0f2.projectionMatrix, _0x57f0f2.matrixWorldInverse),
        _frustum$1.setFromProjectionMatrix(
          _projScreenMatrix$2,
          _0x57f0f2.coordinateSystem,
          _0x57f0f2.reversedDepth,
        ));
      if (_frustum$1.intersectsSprite(_0x1b450a)) return true;
    }
    return false;
  }
  ['intersectsSphere'](_0x3b8154, _0x4b6371) {
    if (!_0x4b6371 || !_0x4b6371.cameras || _0x4b6371.cameras.length === 0) return false;
    for (let _0x2c306f = 0; _0x2c306f < _0x4b6371.cameras.length; _0x2c306f++) {
      const _0xe382c1 = _0x4b6371.cameras[_0x2c306f];
      (_projScreenMatrix$2.multiplyMatrices(_0xe382c1.projectionMatrix, _0xe382c1.matrixWorldInverse),
        _frustum$1.setFromProjectionMatrix(
          _projScreenMatrix$2,
          _0xe382c1.coordinateSystem,
          _0xe382c1.reversedDepth,
        ));
      if (_frustum$1.intersectsSphere(_0x3b8154)) return true;
    }
    return false;
  }
  ['intersectsBox'](_0xf9a357, _0x933f38) {
    if (!_0x933f38 || !_0x933f38.cameras || _0x933f38.cameras.length === 0) return false;
    for (let _0x1d6a99 = 0; _0x1d6a99 < _0x933f38.cameras.length; _0x1d6a99++) {
      const _0x4414b7 = _0x933f38.cameras[_0x1d6a99];
      (_projScreenMatrix$2.multiplyMatrices(_0x4414b7.projectionMatrix, _0x4414b7.matrixWorldInverse),
        _frustum$1.setFromProjectionMatrix(
          _projScreenMatrix$2,
          _0x4414b7.coordinateSystem,
          _0x4414b7.reversedDepth,
        ));
      if (_frustum$1.intersectsBox(_0xf9a357)) return true;
    }
    return false;
  }
  ['containsPoint'](_0x3fe79a, _0x40d427) {
    if (!_0x40d427 || !_0x40d427.cameras || _0x40d427.cameras.length === 0) return false;
    for (let _0x375287 = 0; _0x375287 < _0x40d427.cameras.length; _0x375287++) {
      const _0x428d05 = _0x40d427.cameras[_0x375287];
      (_projScreenMatrix$2.multiplyMatrices(_0x428d05.projectionMatrix, _0x428d05.matrixWorldInverse),
        _frustum$1.setFromProjectionMatrix(
          _projScreenMatrix$2,
          _0x428d05.coordinateSystem,
          _0x428d05.reversedDepth,
        ));
      if (_frustum$1.containsPoint(_0x3fe79a)) return true;
    }
    return false;
  }
  ['clone']() {
    return new FrustumArray();
  }
}
function ascIdSort(_0x187408, _0x2aff06) {
  return _0x187408 - _0x2aff06;
}
function sortOpaque(_0x4ed325, _0x330f50) {
  return _0x4ed325.z - _0x330f50.z;
}
function sortTransparent(_0x578bdf, _0x20944a) {
  return _0x20944a.z - _0x578bdf.z;
}
class MultiDrawRenderList {
  constructor() {
    ((this.index = 0), (this.pool = []), (this.list = []));
  }
  ['push'](_0x393770, _0x94d72d, _0x17c5b2, _0x42518c) {
    const _0x562e76 = this.pool,
      _0x420a20 = this.list;
    this.index >= _0x562e76.length && _0x562e76.push({ start: -1, count: -1, z: -1, index: -1 });
    const _0x2b0fc2 = _0x562e76[this.index];
    (_0x420a20.push(_0x2b0fc2),
      this.index++,
      (_0x2b0fc2.start = _0x393770),
      (_0x2b0fc2.count = _0x94d72d),
      (_0x2b0fc2.z = _0x17c5b2),
      (_0x2b0fc2.index = _0x42518c));
  }
  ['reset']() {
    ((this.list.length = 0), (this.index = 0));
  }
}
const _matrix$1 = new Matrix4(),
  _whiteColor = new Color(1, 1, 1),
  _frustum = new Frustum(),
  _frustumArray = new FrustumArray(),
  _box$1 = new Box3(),
  _sphere$2 = new Sphere(),
  _vector$5 = new Vector3(),
  _forward$1 = new Vector3(),
  _temp = new Vector3(),
  _renderList = new MultiDrawRenderList(),
  _mesh = new Mesh(),
  _batchIntersects = [];
function copyAttributeData(_0xabb19d, _0x4d49f5, _0x27ee2f = 0) {
  const _0x42b134 = _0x4d49f5.itemSize;
  if (_0xabb19d.isInterleavedBufferAttribute || _0xabb19d.array.constructor !== _0x4d49f5.array.constructor) {
    const _0x9fee7e = _0xabb19d.count;
    for (let _0x105c77 = 0; _0x105c77 < _0x9fee7e; _0x105c77++) {
      for (let _0x3924fe = 0; _0x3924fe < _0x42b134; _0x3924fe++) {
        _0x4d49f5.setComponent(
          _0x105c77 + _0x27ee2f,
          _0x3924fe,
          _0xabb19d.getComponent(_0x105c77, _0x3924fe),
        );
      }
    }
  } else _0x4d49f5.array.set(_0xabb19d.array, _0x27ee2f * _0x42b134);
  _0x4d49f5.needsUpdate = true;
}
function copyArrayContents(_0x18e5df, _0x364c1c) {
  if (_0x18e5df.constructor !== _0x364c1c.constructor) {
    const _0x214e47 = Math.min(_0x18e5df.length, _0x364c1c.length);
    for (let _0x4bfd2f = 0; _0x4bfd2f < _0x214e47; _0x4bfd2f++) {
      _0x364c1c[_0x4bfd2f] = _0x18e5df[_0x4bfd2f];
    }
  } else {
    const _0x1d0d44 = Math.min(_0x18e5df.length, _0x364c1c.length);
    _0x364c1c.set(new _0x18e5df['constructor'](_0x18e5df.buffer, 0, _0x1d0d44));
  }
}
class BatchedMesh extends Mesh {
  constructor(_0x2d7561, _0x21f732, _0x258fbb = _0x21f732 * 2, _0x3e4e77) {
    (super(new BufferGeometry(), _0x3e4e77),
      (this.isBatchedMesh = true),
      (this.perObjectFrustumCulled = true),
      (this.sortObjects = true),
      (this.boundingBox = null),
      (this.boundingSphere = null),
      (this.customSort = null),
      (this._instanceInfo = []),
      (this._geometryInfo = []),
      (this._availableInstanceIds = []),
      (this._availableGeometryIds = []),
      (this._nextIndexStart = 0),
      (this._nextVertexStart = 0),
      (this._geometryCount = 0),
      (this._visibilityChanged = true),
      (this._geometryInitialized = false),
      (this._maxInstanceCount = _0x2d7561),
      (this._maxVertexCount = _0x21f732),
      (this._maxIndexCount = _0x258fbb),
      (this._multiDrawCounts = new Int32Array(_0x2d7561)),
      (this._multiDrawStarts = new Int32Array(_0x2d7561)),
      (this._multiDrawCount = 0),
      (this._multiDrawInstances = null),
      (this._matricesTexture = null),
      (this._indirectTexture = null),
      (this._colorsTexture = null),
      this._initMatricesTexture(),
      this._initIndirectTexture());
  }
  get ['maxInstanceCount']() {
    return this._maxInstanceCount;
  }
  get ['instanceCount']() {
    return this._instanceInfo.length - this._availableInstanceIds.length;
  }
  get ['unusedVertexCount']() {
    return this._maxVertexCount - this._nextVertexStart;
  }
  get ['unusedIndexCount']() {
    return this._maxIndexCount - this._nextIndexStart;
  }
  ['_initMatricesTexture']() {
    let _0x402a51 = Math.sqrt(this._maxInstanceCount * 4);
    ((_0x402a51 = Math.ceil(_0x402a51 / 4) * 4), (_0x402a51 = Math.max(_0x402a51, 4)));
    const _0x3f2fd2 = new Float32Array(_0x402a51 * _0x402a51 * 4),
      _0x4cdfa4 = new DataTexture(_0x3f2fd2, _0x402a51, _0x402a51, RGBAFormat, FloatType);
    this._matricesTexture = _0x4cdfa4;
  }
  ['_initIndirectTexture']() {
    let _0x4cdff4 = Math.sqrt(this._maxInstanceCount);
    _0x4cdff4 = Math.ceil(_0x4cdff4);
    const _0x7c13bb = new Uint32Array(_0x4cdff4 * _0x4cdff4),
      _0x147d0f = new DataTexture(_0x7c13bb, _0x4cdff4, _0x4cdff4, RedIntegerFormat, UnsignedIntType);
    this._indirectTexture = _0x147d0f;
  }
  ['_initColorsTexture']() {
    let _0x166164 = Math.sqrt(this._maxInstanceCount);
    _0x166164 = Math.ceil(_0x166164);
    const _0x1380dd = new Float32Array(_0x166164 * _0x166164 * 4).fill(1),
      _0x54ace2 = new DataTexture(_0x1380dd, _0x166164, _0x166164, RGBAFormat, FloatType);
    ((_0x54ace2.colorSpace = ColorManagement.workingColorSpace), (this._colorsTexture = _0x54ace2));
  }
  ['_initializeGeometry'](_0x1e0399) {
    const _0x30efce = this.geometry,
      _0x7a7717 = this._maxVertexCount,
      _0x3471e9 = this._maxIndexCount;
    if (this._geometryInitialized === false) {
      for (const _0x253fe2 in _0x1e0399.attributes) {
        const _0x34edd8 = _0x1e0399.getAttribute(_0x253fe2),
          { array: _0x460038, itemSize: _0x27f501, normalized: _0x2152cc } = _0x34edd8,
          _0x34c176 = new _0x460038['constructor'](_0x7a7717 * _0x27f501),
          _0x1f4ca8 = new BufferAttribute(_0x34c176, _0x27f501, _0x2152cc);
        _0x30efce.setAttribute(_0x253fe2, _0x1f4ca8);
      }
      if (_0x1e0399.getIndex() !== null) {
        const _0x2cfb50 = _0x7a7717 > 0xffff ? new Uint32Array(_0x3471e9) : new Uint16Array(_0x3471e9);
        _0x30efce.setIndex(new BufferAttribute(_0x2cfb50, 1));
      }
      this._geometryInitialized = true;
    }
  }
  ['_validateGeometry'](_0x2dc5f4) {
    const _0x3dfe98 = this.geometry;
    if (Boolean(_0x2dc5f4.getIndex()) !== Boolean(_0x3dfe98.getIndex()))
      throw new Error('THREE.BatchedMesh: All geometries must consistently have "index".');
    for (const _0x3fa10b in _0x3dfe98.attributes) {
      if (!_0x2dc5f4.hasAttribute(_0x3fa10b))
        throw new Error(
          'THREE.BatchedMesh: Added geometry missing "' +
            _0x3fa10b +
            '". All geometries must have consistent attributes.',
        );
      const _0x55f9ab = _0x2dc5f4.getAttribute(_0x3fa10b),
        _0x10ef13 = _0x3dfe98.getAttribute(_0x3fa10b);
      if (_0x55f9ab.itemSize !== _0x10ef13.itemSize || _0x55f9ab.normalized !== _0x10ef13.normalized)
        throw new Error(
          'THREE.BatchedMesh: All attributes must have a consistent itemSize and normalized value.',
        );
    }
  }
  ['validateInstanceId'](_0x561710) {
    const _0x1092e3 = this._instanceInfo;
    if (_0x561710 < 0 || _0x561710 >= _0x1092e3.length || _0x1092e3[_0x561710].active === false)
      throw new Error(
        'THREE.BatchedMesh: Invalid instanceId ' +
          _0x561710 +
          '. Instance is either out of range or has been deleted.',
      );
  }
  ['validateGeometryId'](_0x48ea7e) {
    const _0x582f7e = this._geometryInfo;
    if (_0x48ea7e < 0 || _0x48ea7e >= _0x582f7e.length || _0x582f7e[_0x48ea7e].active === false)
      throw new Error(
        'THREE.BatchedMesh: Invalid geometryId ' +
          _0x48ea7e +
          '. Geometry is either out of range or has been deleted.',
      );
  }
  ['setCustomSort'](_0x2a0b1c) {
    return ((this.customSort = _0x2a0b1c), this);
  }
  ['computeBoundingBox']() {
    this.boundingBox === null && (this.boundingBox = new Box3());
    const _0x2224ad = this.boundingBox,
      _0x37ca35 = this._instanceInfo;
    _0x2224ad.makeEmpty();
    for (let _0x582717 = 0, _0x56626f = _0x37ca35.length; _0x582717 < _0x56626f; _0x582717++) {
      if (_0x37ca35[_0x582717].active === false) continue;
      const _0xc4fbae = _0x37ca35[_0x582717].geometryIndex;
      (this.getMatrixAt(_0x582717, _matrix$1),
        this.getBoundingBoxAt(_0xc4fbae, _box$1).applyMatrix4(_matrix$1),
        _0x2224ad.union(_box$1));
    }
  }
  ['computeBoundingSphere']() {
    this.boundingSphere === null && (this.boundingSphere = new Sphere());
    const _0x1cee17 = this.boundingSphere,
      _0x3df8fc = this._instanceInfo;
    _0x1cee17.makeEmpty();
    for (let _0xcfd614 = 0, _0x3078a8 = _0x3df8fc.length; _0xcfd614 < _0x3078a8; _0xcfd614++) {
      if (_0x3df8fc[_0xcfd614].active === false) continue;
      const _0x50b124 = _0x3df8fc[_0xcfd614].geometryIndex;
      (this.getMatrixAt(_0xcfd614, _matrix$1),
        this.getBoundingSphereAt(_0x50b124, _sphere$2).applyMatrix4(_matrix$1),
        _0x1cee17.union(_sphere$2));
    }
  }
  ['addInstance'](_0x1d1404) {
    const _0x327f65 = this._instanceInfo.length >= this.maxInstanceCount;
    if (_0x327f65 && this._availableInstanceIds.length === 0)
      throw new Error('THREE.BatchedMesh: Maximum item count reached.');
    const _0x7bbe46 = { visible: true, active: true, geometryIndex: _0x1d1404 };
    let _0x250129 = null;
    this._availableInstanceIds.length > 0
      ? (this._availableInstanceIds.sort(ascIdSort),
        (_0x250129 = this._availableInstanceIds.shift()),
        (this._instanceInfo[_0x250129] = _0x7bbe46))
      : ((_0x250129 = this._instanceInfo.length), this._instanceInfo.push(_0x7bbe46));
    const _0x545fb2 = this._matricesTexture;
    (_matrix$1.identity().toArray(_0x545fb2.image.data, _0x250129 * 16), (_0x545fb2.needsUpdate = true));
    const _0x42a4d0 = this._colorsTexture;
    return (
      _0x42a4d0 && (_whiteColor.toArray(_0x42a4d0.image.data, _0x250129 * 4), (_0x42a4d0.needsUpdate = true)),
      (this._visibilityChanged = true),
      _0x250129
    );
  }
  ['addGeometry'](_0x18a768, _0x30f7fe = -1, _0x1607f1 = -1) {
    (this._initializeGeometry(_0x18a768), this._validateGeometry(_0x18a768));
    const _0xbc8e8 = {
        vertexStart: -1,
        vertexCount: -1,
        reservedVertexCount: -1,
        indexStart: -1,
        indexCount: -1,
        reservedIndexCount: -1,
        start: -1,
        count: -1,
        boundingBox: null,
        boundingSphere: null,
        active: true,
      },
      _0x39b0c8 = this._geometryInfo;
    ((_0xbc8e8.vertexStart = this._nextVertexStart),
      (_0xbc8e8.reservedVertexCount =
        _0x30f7fe === -1 ? _0x18a768.getAttribute('position').count : _0x30f7fe));
    const _0x3d64e2 = _0x18a768.getIndex(),
      _0x2b018f = _0x3d64e2 !== null;
    _0x2b018f &&
      ((_0xbc8e8.indexStart = this._nextIndexStart),
      (_0xbc8e8.reservedIndexCount = _0x1607f1 === -1 ? _0x3d64e2.count : _0x1607f1));
    if (
      (_0xbc8e8.indexStart !== -1 &&
        _0xbc8e8.indexStart + _0xbc8e8.reservedIndexCount > this._maxIndexCount) ||
      _0xbc8e8.vertexStart + _0xbc8e8.reservedVertexCount > this._maxVertexCount
    )
      throw new Error('THREE.BatchedMesh: Reserved space request exceeds the maximum buffer size.');
    let _0x34f996;
    return (
      this._availableGeometryIds.length > 0
        ? (this._availableGeometryIds.sort(ascIdSort),
          (_0x34f996 = this._availableGeometryIds.shift()),
          (_0x39b0c8[_0x34f996] = _0xbc8e8))
        : ((_0x34f996 = this._geometryCount), this._geometryCount++, _0x39b0c8.push(_0xbc8e8)),
      this.setGeometryAt(_0x34f996, _0x18a768),
      (this._nextIndexStart = _0xbc8e8.indexStart + _0xbc8e8.reservedIndexCount),
      (this._nextVertexStart = _0xbc8e8.vertexStart + _0xbc8e8.reservedVertexCount),
      _0x34f996
    );
  }
  ['setGeometryAt'](_0x266a7b, _0x4ff216) {
    if (_0x266a7b >= this._geometryCount)
      throw new Error('THREE.BatchedMesh: Maximum geometry count reached.');
    this._validateGeometry(_0x4ff216);
    const _0x3fc377 = this.geometry,
      _0xbac5e3 = _0x3fc377.getIndex() !== null,
      _0x4813eb = _0x3fc377.getIndex(),
      _0x5a01a3 = _0x4ff216.getIndex(),
      _0x4380f1 = this._geometryInfo[_0x266a7b];
    if (
      (_0xbac5e3 && _0x5a01a3.count > _0x4380f1.reservedIndexCount) ||
      _0x4ff216.attributes.position.count > _0x4380f1.reservedVertexCount
    )
      throw new Error('THREE.BatchedMesh: Reserved space not large enough for provided geometry.');
    const _0x46b103 = _0x4380f1.vertexStart,
      _0x54e6eb = _0x4380f1.reservedVertexCount;
    _0x4380f1.vertexCount = _0x4ff216.getAttribute('position').count;
    for (const _0x3142ec in _0x3fc377.attributes) {
      const _0x66ed44 = _0x4ff216.getAttribute(_0x3142ec),
        _0x45cbcb = _0x3fc377.getAttribute(_0x3142ec);
      copyAttributeData(_0x66ed44, _0x45cbcb, _0x46b103);
      const _0x5f6148 = _0x66ed44.itemSize;
      for (let _0x37b377 = _0x66ed44.count, _0x4767af = _0x54e6eb; _0x37b377 < _0x4767af; _0x37b377++) {
        const _0x2f7827 = _0x46b103 + _0x37b377;
        for (let _0x26b29f = 0; _0x26b29f < _0x5f6148; _0x26b29f++) {
          _0x45cbcb.setComponent(_0x2f7827, _0x26b29f, 0);
        }
      }
      ((_0x45cbcb.needsUpdate = true),
        _0x45cbcb.addUpdateRange(_0x46b103 * _0x5f6148, _0x54e6eb * _0x5f6148));
    }
    if (_0xbac5e3) {
      const _0x46afd7 = _0x4380f1.indexStart,
        _0xa3e2dc = _0x4380f1.reservedIndexCount;
      _0x4380f1.indexCount = _0x4ff216.getIndex().count;
      for (let _0x3f5c9e = 0; _0x3f5c9e < _0x5a01a3.count; _0x3f5c9e++) {
        _0x4813eb.setX(_0x46afd7 + _0x3f5c9e, _0x46b103 + _0x5a01a3.getX(_0x3f5c9e));
      }
      for (let _0x55d0dc = _0x5a01a3.count, _0x126bdc = _0xa3e2dc; _0x55d0dc < _0x126bdc; _0x55d0dc++) {
        _0x4813eb.setX(_0x46afd7 + _0x55d0dc, _0x46b103);
      }
      ((_0x4813eb.needsUpdate = true), _0x4813eb.addUpdateRange(_0x46afd7, _0x4380f1.reservedIndexCount));
    }
    return (
      (_0x4380f1.start = _0xbac5e3 ? _0x4380f1.indexStart : _0x4380f1.vertexStart),
      (_0x4380f1.count = _0xbac5e3 ? _0x4380f1.indexCount : _0x4380f1.vertexCount),
      (_0x4380f1.boundingBox = null),
      _0x4ff216.boundingBox !== null && (_0x4380f1.boundingBox = _0x4ff216.boundingBox.clone()),
      (_0x4380f1.boundingSphere = null),
      _0x4ff216.boundingSphere !== null && (_0x4380f1.boundingSphere = _0x4ff216.boundingSphere.clone()),
      (this._visibilityChanged = true),
      _0x266a7b
    );
  }
  ['deleteGeometry'](_0x154b3c) {
    const _0x5b74b6 = this._geometryInfo;
    if (_0x154b3c >= _0x5b74b6.length || _0x5b74b6[_0x154b3c].active === false) return this;
    const _0x46b780 = this._instanceInfo;
    for (let _0x10dc7c = 0, _0x390671 = _0x46b780.length; _0x10dc7c < _0x390671; _0x10dc7c++) {
      _0x46b780[_0x10dc7c].active &&
        _0x46b780[_0x10dc7c].geometryIndex === _0x154b3c &&
        this.deleteInstance(_0x10dc7c);
    }
    return (
      (_0x5b74b6[_0x154b3c].active = false),
      this._availableGeometryIds.push(_0x154b3c),
      (this._visibilityChanged = true),
      this
    );
  }
  ['deleteInstance'](_0x1ff73b) {
    return (
      this.validateInstanceId(_0x1ff73b),
      (this._instanceInfo[_0x1ff73b].active = false),
      this._availableInstanceIds.push(_0x1ff73b),
      (this._visibilityChanged = true),
      this
    );
  }
  ['optimize']() {
    let _0x5de7a3 = 0,
      _0x34f531 = 0;
    const _0x27e913 = this._geometryInfo,
      _0x571434 = _0x27e913
        .map((_0x3ec322, _0x7d7a1d) => _0x7d7a1d)
        .sort((_0x2195a7, _0x1ffa58) => {
          return _0x27e913[_0x2195a7].vertexStart - _0x27e913[_0x1ffa58].vertexStart;
        }),
      _0xaf0879 = this.geometry;
    for (let _0x9421cc = 0, _0x3450e8 = _0x27e913.length; _0x9421cc < _0x3450e8; _0x9421cc++) {
      const _0x15857a = _0x571434[_0x9421cc],
        _0x216745 = _0x27e913[_0x15857a];
      if (_0x216745.active === false) continue;
      if (_0xaf0879.index !== null) {
        if (_0x216745.indexStart !== _0x34f531) {
          const { indexStart: _0x3b82c9, vertexStart: _0x3520a1, reservedIndexCount: _0x466871 } = _0x216745,
            _0x2eedff = _0xaf0879.index,
            _0x26509e = _0x2eedff.array,
            _0x3586cb = _0x5de7a3 - _0x3520a1;
          for (let _0x20c381 = _0x3b82c9; _0x20c381 < _0x3b82c9 + _0x466871; _0x20c381++) {
            _0x26509e[_0x20c381] = _0x26509e[_0x20c381] + _0x3586cb;
          }
          (_0x2eedff.array.copyWithin(_0x34f531, _0x3b82c9, _0x3b82c9 + _0x466871),
            _0x2eedff.addUpdateRange(_0x34f531, _0x466871),
            (_0x216745.indexStart = _0x34f531));
        }
        _0x34f531 += _0x216745.reservedIndexCount;
      }
      if (_0x216745.vertexStart !== _0x5de7a3) {
        const { vertexStart: _0x7a4229, reservedVertexCount: _0x2b32bc } = _0x216745,
          _0xee233 = _0xaf0879.attributes;
        for (const _0x745a64 in _0xee233) {
          const _0x3323a6 = _0xee233[_0x745a64],
            { array: _0x3b0f3f, itemSize: _0x148d6e } = _0x3323a6;
          (_0x3b0f3f.copyWithin(
            _0x5de7a3 * _0x148d6e,
            _0x7a4229 * _0x148d6e,
            (_0x7a4229 + _0x2b32bc) * _0x148d6e,
          ),
            _0x3323a6.addUpdateRange(_0x5de7a3 * _0x148d6e, _0x2b32bc * _0x148d6e));
        }
        _0x216745.vertexStart = _0x5de7a3;
      }
      ((_0x5de7a3 += _0x216745.reservedVertexCount),
        (_0x216745.start = _0xaf0879.index ? _0x216745.indexStart : _0x216745.vertexStart),
        (this._nextIndexStart = _0xaf0879.index ? _0x216745.indexStart + _0x216745.reservedIndexCount : 0),
        (this._nextVertexStart = _0x216745.vertexStart + _0x216745.reservedVertexCount));
    }
    return this;
  }
  ['getBoundingBoxAt'](_0x1db5f3, _0x20b516) {
    if (_0x1db5f3 >= this._geometryCount) return null;
    const _0xa8a984 = this.geometry,
      _0x38962f = this._geometryInfo[_0x1db5f3];
    if (_0x38962f.boundingBox === null) {
      const _0x229e8a = new Box3(),
        _0x14a26a = _0xa8a984.index,
        _0x1e868b = _0xa8a984.attributes.position;
      for (
        let _0x55f04c = _0x38962f.start, _0x4df28f = _0x38962f.start + _0x38962f.count;
        _0x55f04c < _0x4df28f;
        _0x55f04c++
      ) {
        let _0x4d96fd = _0x55f04c;
        (_0x14a26a && (_0x4d96fd = _0x14a26a.getX(_0x4d96fd)),
          _0x229e8a.expandByPoint(_vector$5.fromBufferAttribute(_0x1e868b, _0x4d96fd)));
      }
      _0x38962f.boundingBox = _0x229e8a;
    }
    return (_0x20b516.copy(_0x38962f.boundingBox), _0x20b516);
  }
  ['getBoundingSphereAt'](_0x1bc88d, _0x41e114) {
    if (_0x1bc88d >= this._geometryCount) return null;
    const _0x5afa3d = this.geometry,
      _0x1efd1f = this._geometryInfo[_0x1bc88d];
    if (_0x1efd1f.boundingSphere === null) {
      const _0x240f79 = new Sphere();
      (this.getBoundingBoxAt(_0x1bc88d, _box$1), _box$1.getCenter(_0x240f79.center));
      const _0x2ad44e = _0x5afa3d.index,
        _0x35eaa5 = _0x5afa3d.attributes.position;
      let _0x268579 = 0;
      for (
        let _0x2e5c7e = _0x1efd1f.start, _0x488cae = _0x1efd1f.start + _0x1efd1f.count;
        _0x2e5c7e < _0x488cae;
        _0x2e5c7e++
      ) {
        let _0x39d261 = _0x2e5c7e;
        (_0x2ad44e && (_0x39d261 = _0x2ad44e.getX(_0x39d261)),
          _vector$5.fromBufferAttribute(_0x35eaa5, _0x39d261),
          (_0x268579 = Math.max(_0x268579, _0x240f79.center.distanceToSquared(_vector$5))));
      }
      ((_0x240f79.radius = Math.sqrt(_0x268579)), (_0x1efd1f.boundingSphere = _0x240f79));
    }
    return (_0x41e114.copy(_0x1efd1f.boundingSphere), _0x41e114);
  }
  ['setMatrixAt'](_0x3e212d, _0x3e95bc) {
    this.validateInstanceId(_0x3e212d);
    const _0x3ec9db = this._matricesTexture,
      _0x371772 = this._matricesTexture.image.data;
    return (_0x3e95bc.toArray(_0x371772, _0x3e212d * 16), (_0x3ec9db.needsUpdate = true), this);
  }
  ['getMatrixAt'](_0xb281, _0x111bc3) {
    return (
      this.validateInstanceId(_0xb281),
      _0x111bc3.fromArray(this._matricesTexture.image.data, _0xb281 * 16)
    );
  }
  ['setColorAt'](_0x57f95f, _0x50fb9a) {
    return (
      this.validateInstanceId(_0x57f95f),
      this._colorsTexture === null && this._initColorsTexture(),
      _0x50fb9a.toArray(this._colorsTexture.image.data, _0x57f95f * 4),
      (this._colorsTexture.needsUpdate = true),
      this
    );
  }
  ['getColorAt'](_0x5a1ab5, _0x3e8376) {
    return (
      this.validateInstanceId(_0x5a1ab5),
      _0x3e8376.fromArray(this._colorsTexture.image.data, _0x5a1ab5 * 4)
    );
  }
  ['setVisibleAt'](_0x35acd1, _0x489b61) {
    this.validateInstanceId(_0x35acd1);
    if (this._instanceInfo[_0x35acd1].visible === _0x489b61) return this;
    return ((this._instanceInfo[_0x35acd1].visible = _0x489b61), (this._visibilityChanged = true), this);
  }
  ['getVisibleAt'](_0x2a6aaf) {
    return (this.validateInstanceId(_0x2a6aaf), this._instanceInfo[_0x2a6aaf].visible);
  }
  ['setGeometryIdAt'](_0xbaecb8, _0x5d8ada) {
    return (
      this.validateInstanceId(_0xbaecb8),
      this.validateGeometryId(_0x5d8ada),
      (this._instanceInfo[_0xbaecb8].geometryIndex = _0x5d8ada),
      this
    );
  }
  ['getGeometryIdAt'](_0x1de707) {
    return (this.validateInstanceId(_0x1de707), this._instanceInfo[_0x1de707].geometryIndex);
  }
  ['getGeometryRangeAt'](_0x5f180d, _0x227565 = {}) {
    this.validateGeometryId(_0x5f180d);
    const _0x207de7 = this._geometryInfo[_0x5f180d];
    return (
      (_0x227565.vertexStart = _0x207de7.vertexStart),
      (_0x227565.vertexCount = _0x207de7.vertexCount),
      (_0x227565.reservedVertexCount = _0x207de7.reservedVertexCount),
      (_0x227565.indexStart = _0x207de7.indexStart),
      (_0x227565.indexCount = _0x207de7.indexCount),
      (_0x227565.reservedIndexCount = _0x207de7.reservedIndexCount),
      (_0x227565.start = _0x207de7.start),
      (_0x227565.count = _0x207de7.count),
      _0x227565
    );
  }
  ['setInstanceCount'](_0x4c1269) {
    const _0x3d7573 = this._availableInstanceIds,
      _0x414b8c = this._instanceInfo;
    _0x3d7573.sort(ascIdSort);
    while (_0x3d7573[_0x3d7573.length - 1] === _0x414b8c.length - 1) {
      (_0x414b8c.pop(), _0x3d7573.pop());
    }
    if (_0x4c1269 < _0x414b8c.length)
      throw new Error(
        'BatchedMesh: Instance ids outside the range ' +
          _0x4c1269 +
          ' are being used. Cannot shrink instance count.',
      );
    const _0x150e1e = new Int32Array(_0x4c1269),
      _0x2b71fb = new Int32Array(_0x4c1269);
    (copyArrayContents(this._multiDrawCounts, _0x150e1e),
      copyArrayContents(this._multiDrawStarts, _0x2b71fb),
      (this._multiDrawCounts = _0x150e1e),
      (this._multiDrawStarts = _0x2b71fb),
      (this._maxInstanceCount = _0x4c1269));
    const _0x4a308e = this._indirectTexture,
      _0x2e0191 = this._matricesTexture,
      _0x3eeb10 = this._colorsTexture;
    (_0x4a308e.dispose(),
      this._initIndirectTexture(),
      copyArrayContents(_0x4a308e.image.data, this._indirectTexture.image.data),
      _0x2e0191.dispose(),
      this._initMatricesTexture(),
      copyArrayContents(_0x2e0191.image.data, this._matricesTexture.image.data),
      _0x3eeb10 &&
        (_0x3eeb10.dispose(),
        this._initColorsTexture(),
        copyArrayContents(_0x3eeb10.image.data, this._colorsTexture.image.data)));
  }
  ['setGeometrySize'](_0x2fda4d, _0x3f1113) {
    const _0x5f4fa8 = [...this._geometryInfo].filter((_0x2de927) => _0x2de927.active),
      _0x438b61 = Math.max(
        ..._0x5f4fa8.map((_0x5da6bb) => _0x5da6bb.vertexStart + _0x5da6bb.reservedVertexCount),
      );
    if (_0x438b61 > _0x2fda4d)
      throw new Error(
        'BatchedMesh: Geometry vertex values are being used outside the range ' +
          _0x3f1113 +
          '. Cannot shrink further.',
      );
    if (this.geometry.index) {
      const _0x377001 = Math.max(
        ..._0x5f4fa8.map((_0xacf962) => _0xacf962.indexStart + _0xacf962.reservedIndexCount),
      );
      if (_0x377001 > _0x3f1113)
        throw new Error(
          'BatchedMesh: Geometry index values are being used outside the range ' +
            _0x3f1113 +
            '. Cannot shrink further.',
        );
    }
    const _0x83845d = this.geometry;
    (_0x83845d.dispose(), (this._maxVertexCount = _0x2fda4d), (this._maxIndexCount = _0x3f1113));
    this._geometryInitialized &&
      ((this._geometryInitialized = false),
      (this.geometry = new BufferGeometry()),
      this._initializeGeometry(_0x83845d));
    const _0x31c964 = this.geometry;
    _0x83845d.index && copyArrayContents(_0x83845d.index.array, _0x31c964.index.array);
    for (const _0x1ed3d0 in _0x83845d.attributes) {
      copyArrayContents(_0x83845d.attributes[_0x1ed3d0].array, _0x31c964.attributes[_0x1ed3d0].array);
    }
  }
  ['raycast'](_0x53cda6, _0x41d2ef) {
    const _0x4b7207 = this._instanceInfo,
      _0x1570f0 = this._geometryInfo,
      _0x50808d = this.matrixWorld,
      _0x5c13cc = this.geometry;
    ((_mesh.material = this.material),
      (_mesh.geometry.index = _0x5c13cc.index),
      (_mesh.geometry.attributes = _0x5c13cc.attributes));
    _mesh.geometry.boundingBox === null && (_mesh.geometry.boundingBox = new Box3());
    _mesh.geometry.boundingSphere === null && (_mesh.geometry.boundingSphere = new Sphere());
    for (let _0x4dbde3 = 0, _0x2a891c = _0x4b7207.length; _0x4dbde3 < _0x2a891c; _0x4dbde3++) {
      if (!_0x4b7207[_0x4dbde3].visible || !_0x4b7207[_0x4dbde3].active) continue;
      const _0x1ad9e6 = _0x4b7207[_0x4dbde3].geometryIndex,
        _0x56e53a = _0x1570f0[_0x1ad9e6];
      (_mesh.geometry.setDrawRange(_0x56e53a.start, _0x56e53a.count),
        this.getMatrixAt(_0x4dbde3, _mesh.matrixWorld).premultiply(_0x50808d),
        this.getBoundingBoxAt(_0x1ad9e6, _mesh.geometry.boundingBox),
        this.getBoundingSphereAt(_0x1ad9e6, _mesh.geometry.boundingSphere),
        _mesh.raycast(_0x53cda6, _batchIntersects));
      for (let _0x77d47c = 0, _0x489ab3 = _batchIntersects.length; _0x77d47c < _0x489ab3; _0x77d47c++) {
        const _0x5e7cb0 = _batchIntersects[_0x77d47c];
        ((_0x5e7cb0.object = this), (_0x5e7cb0.batchId = _0x4dbde3), _0x41d2ef.push(_0x5e7cb0));
      }
      _batchIntersects.length = 0;
    }
    ((_mesh.material = null),
      (_mesh.geometry.index = null),
      (_mesh.geometry.attributes = {}),
      _mesh.geometry.setDrawRange(0, Infinity));
  }
  ['copy'](_0x5b6b35) {
    return (
      super.copy(_0x5b6b35),
      (this.geometry = _0x5b6b35.geometry.clone()),
      (this.perObjectFrustumCulled = _0x5b6b35.perObjectFrustumCulled),
      (this.sortObjects = _0x5b6b35.sortObjects),
      (this.boundingBox = _0x5b6b35.boundingBox !== null ? _0x5b6b35.boundingBox.clone() : null),
      (this.boundingSphere = _0x5b6b35.boundingSphere !== null ? _0x5b6b35.boundingSphere.clone() : null),
      (this._geometryInfo = _0x5b6b35._geometryInfo.map((_0x2d3405) => ({
        ..._0x2d3405,
        boundingBox: _0x2d3405.boundingBox !== null ? _0x2d3405.boundingBox.clone() : null,
        boundingSphere: _0x2d3405.boundingSphere !== null ? _0x2d3405.boundingSphere.clone() : null,
      }))),
      (this._instanceInfo = _0x5b6b35._instanceInfo.map((_0x181d37) => ({ ..._0x181d37 }))),
      (this._availableInstanceIds = _0x5b6b35._availableInstanceIds.slice()),
      (this._availableGeometryIds = _0x5b6b35._availableGeometryIds.slice()),
      (this._nextIndexStart = _0x5b6b35._nextIndexStart),
      (this._nextVertexStart = _0x5b6b35._nextVertexStart),
      (this._geometryCount = _0x5b6b35._geometryCount),
      (this._maxInstanceCount = _0x5b6b35._maxInstanceCount),
      (this._maxVertexCount = _0x5b6b35._maxVertexCount),
      (this._maxIndexCount = _0x5b6b35._maxIndexCount),
      (this._geometryInitialized = _0x5b6b35._geometryInitialized),
      (this._multiDrawCounts = _0x5b6b35._multiDrawCounts.slice()),
      (this._multiDrawStarts = _0x5b6b35._multiDrawStarts.slice()),
      (this._indirectTexture = _0x5b6b35._indirectTexture.clone()),
      (this._indirectTexture.image.data = this._indirectTexture.image.data.slice()),
      (this._matricesTexture = _0x5b6b35._matricesTexture.clone()),
      (this._matricesTexture.image.data = this._matricesTexture.image.data.slice()),
      this._colorsTexture !== null &&
        ((this._colorsTexture = _0x5b6b35._colorsTexture.clone()),
        (this._colorsTexture.image.data = this._colorsTexture.image.data.slice())),
      this
    );
  }
  ['dispose']() {
    (this.geometry.dispose(),
      this._matricesTexture.dispose(),
      (this._matricesTexture = null),
      this._indirectTexture.dispose(),
      (this._indirectTexture = null),
      this._colorsTexture !== null && (this._colorsTexture.dispose(), (this._colorsTexture = null)));
  }
  ['onBeforeRender'](_0x3b6879, _0x4ce93e, _0x4572ef, _0x404530, _0x32d3c5) {
    if (!this._visibilityChanged && !this.perObjectFrustumCulled && !this.sortObjects) return;
    const _0x164287 = _0x404530.getIndex(),
      _0x2c8b0f = _0x164287 === null ? 1 : _0x164287.array.BYTES_PER_ELEMENT,
      _0x53497e = this._instanceInfo,
      _0x418962 = this._multiDrawStarts,
      _0x22baf0 = this._multiDrawCounts,
      _0x3beb49 = this._geometryInfo,
      _0x2b786c = this.perObjectFrustumCulled,
      _0x53d5eb = this._indirectTexture,
      _0x584b91 = _0x53d5eb.image.data,
      _0x17ef7a = _0x4572ef.isArrayCamera ? _frustumArray : _frustum;
    _0x2b786c &&
      !_0x4572ef.isArrayCamera &&
      (_matrix$1
        .multiplyMatrices(_0x4572ef.projectionMatrix, _0x4572ef.matrixWorldInverse)
        .multiply(this.matrixWorld),
      _frustum.setFromProjectionMatrix(_matrix$1, _0x4572ef.coordinateSystem, _0x4572ef.reversedDepth));
    let _0x312539 = 0;
    if (this.sortObjects) {
      (_matrix$1.copy(this.matrixWorld).invert(),
        _vector$5.setFromMatrixPosition(_0x4572ef.matrixWorld).applyMatrix4(_matrix$1),
        _forward$1.set(0, 0, -1).transformDirection(_0x4572ef.matrixWorld).transformDirection(_matrix$1));
      for (let _0x3797d5 = 0, _0x12cc05 = _0x53497e.length; _0x3797d5 < _0x12cc05; _0x3797d5++) {
        if (_0x53497e[_0x3797d5].visible && _0x53497e[_0x3797d5].active) {
          const _0x190338 = _0x53497e[_0x3797d5].geometryIndex;
          (this.getMatrixAt(_0x3797d5, _matrix$1),
            this.getBoundingSphereAt(_0x190338, _sphere$2).applyMatrix4(_matrix$1));
          let _0x2ee617 = false;
          _0x2b786c && (_0x2ee617 = !_0x17ef7a.intersectsSphere(_sphere$2, _0x4572ef));
          if (!_0x2ee617) {
            const _0x3981e5 = _0x3beb49[_0x190338],
              _0x5454ed = _temp.subVectors(_sphere$2.center, _vector$5).dot(_forward$1);
            _renderList.push(_0x3981e5.start, _0x3981e5.count, _0x5454ed, _0x3797d5);
          }
        }
      }
      const _0x579334 = _renderList.list,
        _0x555001 = this.customSort;
      _0x555001 === null
        ? _0x579334.sort(_0x32d3c5.transparent ? sortTransparent : sortOpaque)
        : _0x555001.call(this, _0x579334, _0x4572ef);
      for (let _0x19e26c = 0, _0xc8542c = _0x579334.length; _0x19e26c < _0xc8542c; _0x19e26c++) {
        const _0x167585 = _0x579334[_0x19e26c];
        ((_0x418962[_0x312539] = _0x167585.start * _0x2c8b0f),
          (_0x22baf0[_0x312539] = _0x167585.count),
          (_0x584b91[_0x312539] = _0x167585.index),
          _0x312539++);
      }
      _renderList.reset();
    } else
      for (let _0x4fc5ff = 0, _0x701c6 = _0x53497e.length; _0x4fc5ff < _0x701c6; _0x4fc5ff++) {
        if (_0x53497e[_0x4fc5ff].visible && _0x53497e[_0x4fc5ff].active) {
          const _0x1fcfba = _0x53497e[_0x4fc5ff].geometryIndex;
          let _0x5837f4 = false;
          _0x2b786c &&
            (this.getMatrixAt(_0x4fc5ff, _matrix$1),
            this.getBoundingSphereAt(_0x1fcfba, _sphere$2).applyMatrix4(_matrix$1),
            (_0x5837f4 = !_0x17ef7a.intersectsSphere(_sphere$2, _0x4572ef)));
          if (!_0x5837f4) {
            const _0x2822a5 = _0x3beb49[_0x1fcfba];
            ((_0x418962[_0x312539] = _0x2822a5.start * _0x2c8b0f),
              (_0x22baf0[_0x312539] = _0x2822a5.count),
              (_0x584b91[_0x312539] = _0x4fc5ff),
              _0x312539++);
          }
        }
      }
    ((_0x53d5eb.needsUpdate = true), (this._multiDrawCount = _0x312539), (this._visibilityChanged = false));
  }
  ['onBeforeShadow'](_0x4eac1c, _0x53a912, _0x1cc018, _0x4e201f, _0x5bf175, _0x2a3654) {
    this.onBeforeRender(_0x4eac1c, null, _0x4e201f, _0x5bf175, _0x2a3654);
  }
}
class LineBasicMaterial extends Material {
  constructor(_0x490a77) {
    (super(),
      (this.isLineBasicMaterial = true),
      (this.type = 'LineBasicMaterial'),
      (this.color = new Color(0xffffff)),
      (this.map = null),
      (this.linewidth = 1),
      (this.linecap = 'round'),
      (this.linejoin = 'round'),
      (this.fog = true),
      this.setValues(_0x490a77));
  }
  ['copy'](_0x4d89cd) {
    return (
      super.copy(_0x4d89cd),
      this.color.copy(_0x4d89cd.color),
      (this.map = _0x4d89cd.map),
      (this.linewidth = _0x4d89cd.linewidth),
      (this.linecap = _0x4d89cd.linecap),
      (this.linejoin = _0x4d89cd.linejoin),
      (this.fog = _0x4d89cd.fog),
      this
    );
  }
}
const _vStart = new Vector3(),
  _vEnd = new Vector3(),
  _inverseMatrix$1 = new Matrix4(),
  _ray$1 = new Ray(),
  _sphere$1 = new Sphere(),
  _intersectPointOnRay = new Vector3(),
  _intersectPointOnSegment = new Vector3();
class Line extends Object3D {
  constructor(_0x16c257 = new BufferGeometry(), _0x2e5012 = new LineBasicMaterial()) {
    (super(),
      (this.isLine = true),
      (this.type = 'Line'),
      (this.geometry = _0x16c257),
      (this.material = _0x2e5012),
      (this.morphTargetDictionary = undefined),
      (this.morphTargetInfluences = undefined),
      this.updateMorphTargets());
  }
  ['copy'](_0x25880d, _0x675834) {
    return (
      super.copy(_0x25880d, _0x675834),
      (this.material = Array.isArray(_0x25880d.material) ? _0x25880d.material.slice() : _0x25880d.material),
      (this.geometry = _0x25880d.geometry),
      this
    );
  }
  ['computeLineDistances']() {
    const _0x1786dd = this.geometry;
    if (_0x1786dd.index === null) {
      const _0x72ff94 = _0x1786dd.attributes.position,
        _0x511959 = [0];
      for (let _0x13b640 = 1, _0x23bc01 = _0x72ff94.count; _0x13b640 < _0x23bc01; _0x13b640++) {
        (_vStart.fromBufferAttribute(_0x72ff94, _0x13b640 - 1),
          _vEnd.fromBufferAttribute(_0x72ff94, _0x13b640),
          (_0x511959[_0x13b640] = _0x511959[_0x13b640 - 1]),
          (_0x511959[_0x13b640] += _vStart.distanceTo(_vEnd)));
      }
      _0x1786dd.setAttribute('lineDistance', new Float32BufferAttribute(_0x511959, 1));
    } else
      console.warn(
        'THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.',
      );
    return this;
  }
  ['raycast'](_0x489bb1, _0x224baf) {
    const _0x16ba1c = this.geometry,
      _0x3cce67 = this.matrixWorld,
      _0x3df0f2 = _0x489bb1.params.Line.threshold,
      _0x586006 = _0x16ba1c.drawRange;
    if (_0x16ba1c.boundingSphere === null) _0x16ba1c.computeBoundingSphere();
    (_sphere$1.copy(_0x16ba1c.boundingSphere),
      _sphere$1.applyMatrix4(_0x3cce67),
      (_sphere$1.radius += _0x3df0f2));
    if (_0x489bb1.ray.intersectsSphere(_sphere$1) === false) return;
    (_inverseMatrix$1.copy(_0x3cce67).invert(), _ray$1.copy(_0x489bb1.ray).applyMatrix4(_inverseMatrix$1));
    const _0x5e4809 = _0x3df0f2 / ((this.scale.x + this.scale.y + this.scale.z) / 3),
      _0x14ca57 = _0x5e4809 * _0x5e4809,
      _0x2dd0f4 = this.isLineSegments ? 2 : 1,
      _0x325ea9 = _0x16ba1c.index,
      _0xe55187 = _0x16ba1c.attributes,
      _0x4bb517 = _0xe55187.position;
    if (_0x325ea9 !== null) {
      const _0x5e11d9 = Math.max(0, _0x586006.start),
        _0x3bf33f = Math.min(_0x325ea9.count, _0x586006.start + _0x586006.count);
      for (
        let _0x44e03c = _0x5e11d9, _0x588672 = _0x3bf33f - 1;
        _0x44e03c < _0x588672;
        _0x44e03c += _0x2dd0f4
      ) {
        const _0x12a753 = _0x325ea9.getX(_0x44e03c),
          _0x3b708c = _0x325ea9.getX(_0x44e03c + 1),
          _0x1c437b = checkIntersection(this, _0x489bb1, _ray$1, _0x14ca57, _0x12a753, _0x3b708c, _0x44e03c);
        _0x1c437b && _0x224baf.push(_0x1c437b);
      }
      if (this.isLineLoop) {
        const _0x12db12 = _0x325ea9.getX(_0x3bf33f - 1),
          _0x10a78a = _0x325ea9.getX(_0x5e11d9),
          _0x598482 = checkIntersection(
            this,
            _0x489bb1,
            _ray$1,
            _0x14ca57,
            _0x12db12,
            _0x10a78a,
            _0x3bf33f - 1,
          );
        _0x598482 && _0x224baf.push(_0x598482);
      }
    } else {
      const _0x2940eb = Math.max(0, _0x586006.start),
        _0x43eac2 = Math.min(_0x4bb517.count, _0x586006.start + _0x586006.count);
      for (
        let _0x35b89b = _0x2940eb, _0x391abb = _0x43eac2 - 1;
        _0x35b89b < _0x391abb;
        _0x35b89b += _0x2dd0f4
      ) {
        const _0x2ef754 = checkIntersection(
          this,
          _0x489bb1,
          _ray$1,
          _0x14ca57,
          _0x35b89b,
          _0x35b89b + 1,
          _0x35b89b,
        );
        _0x2ef754 && _0x224baf.push(_0x2ef754);
      }
      if (this.isLineLoop) {
        const _0x32c5c2 = checkIntersection(
          this,
          _0x489bb1,
          _ray$1,
          _0x14ca57,
          _0x43eac2 - 1,
          _0x2940eb,
          _0x43eac2 - 1,
        );
        _0x32c5c2 && _0x224baf.push(_0x32c5c2);
      }
    }
  }
  ['updateMorphTargets']() {
    const _0x59999b = this.geometry,
      _0x19c359 = _0x59999b.morphAttributes,
      _0x6c82ee = Object.keys(_0x19c359);
    if (_0x6c82ee.length > 0) {
      const _0x3acc89 = _0x19c359[_0x6c82ee[0]];
      if (_0x3acc89 !== undefined) {
        ((this.morphTargetInfluences = []), (this.morphTargetDictionary = {}));
        for (let _0x3ca139 = 0, _0x12d0bd = _0x3acc89.length; _0x3ca139 < _0x12d0bd; _0x3ca139++) {
          const _0xcf24a2 = _0x3acc89[_0x3ca139].name || String(_0x3ca139);
          (this.morphTargetInfluences.push(0), (this.morphTargetDictionary[_0xcf24a2] = _0x3ca139));
        }
      }
    }
  }
}
function checkIntersection(_0x561b1f, _0x50634d, _0x2e7973, _0x180772, _0x5af007, _0x37d7cb, _0x2a4ec8) {
  const _0x37245b = _0x561b1f.geometry.attributes.position;
  (_vStart.fromBufferAttribute(_0x37245b, _0x5af007), _vEnd.fromBufferAttribute(_0x37245b, _0x37d7cb));
  const _0x225def = _0x2e7973.distanceSqToSegment(
    _vStart,
    _vEnd,
    _intersectPointOnRay,
    _intersectPointOnSegment,
  );
  if (_0x225def > _0x180772) return;
  _intersectPointOnRay.applyMatrix4(_0x561b1f.matrixWorld);
  const _0x543d5e = _0x50634d.ray.origin.distanceTo(_intersectPointOnRay);
  if (_0x543d5e < _0x50634d.near || _0x543d5e > _0x50634d.far) return;
  return {
    distance: _0x543d5e,
    point: _intersectPointOnSegment.clone().applyMatrix4(_0x561b1f.matrixWorld),
    index: _0x2a4ec8,
    face: null,
    faceIndex: null,
    barycoord: null,
    object: _0x561b1f,
  };
}
const _start = new Vector3(),
  _end = new Vector3();
class LineSegments extends Line {
  constructor(_0x335fae, _0x59e80d) {
    (super(_0x335fae, _0x59e80d), (this.isLineSegments = true), (this.type = 'LineSegments'));
  }
  ['computeLineDistances']() {
    const _0x1c85df = this.geometry;
    if (_0x1c85df.index === null) {
      const _0x361cfe = _0x1c85df.attributes.position,
        _0x49a75b = [];
      for (let _0x47e76e = 0, _0xdb8f35 = _0x361cfe.count; _0x47e76e < _0xdb8f35; _0x47e76e += 2) {
        (_start.fromBufferAttribute(_0x361cfe, _0x47e76e),
          _end.fromBufferAttribute(_0x361cfe, _0x47e76e + 1),
          (_0x49a75b[_0x47e76e] = _0x47e76e === 0 ? 0 : _0x49a75b[_0x47e76e - 1]),
          (_0x49a75b[_0x47e76e + 1] = _0x49a75b[_0x47e76e] + _start.distanceTo(_end)));
      }
      _0x1c85df.setAttribute('lineDistance', new Float32BufferAttribute(_0x49a75b, 1));
    } else
      console.warn(
        'THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.',
      );
    return this;
  }
}
class LineLoop extends Line {
  constructor(_0x17399a, _0x3cca1e) {
    (super(_0x17399a, _0x3cca1e), (this.isLineLoop = true), (this.type = 'LineLoop'));
  }
}
class PointsMaterial extends Material {
  constructor(_0x1de230) {
    (super(),
      (this.isPointsMaterial = true),
      (this.type = 'PointsMaterial'),
      (this.color = new Color(0xffffff)),
      (this.map = null),
      (this.alphaMap = null),
      (this.size = 1),
      (this.sizeAttenuation = true),
      (this.fog = true),
      this.setValues(_0x1de230));
  }
  ['copy'](_0x4e4e16) {
    return (
      super.copy(_0x4e4e16),
      this.color.copy(_0x4e4e16.color),
      (this.map = _0x4e4e16.map),
      (this.alphaMap = _0x4e4e16.alphaMap),
      (this.size = _0x4e4e16.size),
      (this.sizeAttenuation = _0x4e4e16.sizeAttenuation),
      (this.fog = _0x4e4e16.fog),
      this
    );
  }
}
const _inverseMatrix = new Matrix4(),
  _ray = new Ray(),
  _sphere = new Sphere(),
  _position$2 = new Vector3();
class Points extends Object3D {
  constructor(_0x2d5010 = new BufferGeometry(), _0x20da68 = new PointsMaterial()) {
    (super(),
      (this.isPoints = true),
      (this.type = 'Points'),
      (this.geometry = _0x2d5010),
      (this.material = _0x20da68),
      (this.morphTargetDictionary = undefined),
      (this.morphTargetInfluences = undefined),
      this.updateMorphTargets());
  }
  ['copy'](_0x387468, _0x2397c0) {
    return (
      super.copy(_0x387468, _0x2397c0),
      (this.material = Array.isArray(_0x387468.material) ? _0x387468.material.slice() : _0x387468.material),
      (this.geometry = _0x387468.geometry),
      this
    );
  }
  ['raycast'](_0xc49e4d, _0xd0f8f9) {
    const _0x4cc665 = this.geometry,
      _0x24cc80 = this.matrixWorld,
      _0xda64c6 = _0xc49e4d.params.Points.threshold,
      _0x443652 = _0x4cc665.drawRange;
    if (_0x4cc665.boundingSphere === null) _0x4cc665.computeBoundingSphere();
    (_sphere.copy(_0x4cc665.boundingSphere), _sphere.applyMatrix4(_0x24cc80), (_sphere.radius += _0xda64c6));
    if (_0xc49e4d.ray.intersectsSphere(_sphere) === false) return;
    (_inverseMatrix.copy(_0x24cc80).invert(), _ray.copy(_0xc49e4d.ray).applyMatrix4(_inverseMatrix));
    const _0x40cf43 = _0xda64c6 / ((this.scale.x + this.scale.y + this.scale.z) / 3),
      _0x27113f = _0x40cf43 * _0x40cf43,
      _0x714845 = _0x4cc665.index,
      _0x4a40eb = _0x4cc665.attributes,
      _0x59ed52 = _0x4a40eb.position;
    if (_0x714845 !== null) {
      const _0x1831d9 = Math.max(0, _0x443652.start),
        _0x15ccbd = Math.min(_0x714845.count, _0x443652.start + _0x443652.count);
      for (let _0x55ec16 = _0x1831d9, _0x577ac3 = _0x15ccbd; _0x55ec16 < _0x577ac3; _0x55ec16++) {
        const _0x16747f = _0x714845.getX(_0x55ec16);
        (_position$2.fromBufferAttribute(_0x59ed52, _0x16747f),
          testPoint(_position$2, _0x16747f, _0x27113f, _0x24cc80, _0xc49e4d, _0xd0f8f9, this));
      }
    } else {
      const _0x17e1a6 = Math.max(0, _0x443652.start),
        _0x4c7622 = Math.min(_0x59ed52.count, _0x443652.start + _0x443652.count);
      for (let _0x3bde1d = _0x17e1a6, _0x1f716b = _0x4c7622; _0x3bde1d < _0x1f716b; _0x3bde1d++) {
        (_position$2.fromBufferAttribute(_0x59ed52, _0x3bde1d),
          testPoint(_position$2, _0x3bde1d, _0x27113f, _0x24cc80, _0xc49e4d, _0xd0f8f9, this));
      }
    }
  }
  ['updateMorphTargets']() {
    const _0x3e534a = this.geometry,
      _0x1ef6ac = _0x3e534a.morphAttributes,
      _0x5b8d41 = Object.keys(_0x1ef6ac);
    if (_0x5b8d41.length > 0) {
      const _0x56c546 = _0x1ef6ac[_0x5b8d41[0]];
      if (_0x56c546 !== undefined) {
        ((this.morphTargetInfluences = []), (this.morphTargetDictionary = {}));
        for (let _0x58b421 = 0, _0x32ad95 = _0x56c546.length; _0x58b421 < _0x32ad95; _0x58b421++) {
          const _0xfba0e4 = _0x56c546[_0x58b421].name || String(_0x58b421);
          (this.morphTargetInfluences.push(0), (this.morphTargetDictionary[_0xfba0e4] = _0x58b421));
        }
      }
    }
  }
}
function testPoint(_0xa6bfcb, _0x390fff, _0x5e3d3f, _0x2380ab, _0x27803c, _0x1b2b62, _0x29977b) {
  const _0x2a6990 = _ray.distanceSqToPoint(_0xa6bfcb);
  if (_0x2a6990 < _0x5e3d3f) {
    const _0x13a0de = new Vector3();
    (_ray.closestPointToPoint(_0xa6bfcb, _0x13a0de), _0x13a0de.applyMatrix4(_0x2380ab));
    const _0xc78c5a = _0x27803c.ray.origin.distanceTo(_0x13a0de);
    if (_0xc78c5a < _0x27803c.near || _0xc78c5a > _0x27803c.far) return;
    _0x1b2b62.push({
      distance: _0xc78c5a,
      distanceToRay: Math.sqrt(_0x2a6990),
      point: _0x13a0de,
      index: _0x390fff,
      face: null,
      faceIndex: null,
      barycoord: null,
      object: _0x29977b,
    });
  }
}
class VideoTexture extends Texture {
  constructor(
    _0x44129b,
    _0x216dd7,
    _0x3cc006,
    _0x399594,
    _0x28e533 = LinearFilter,
    _0x2b598c = LinearFilter,
    _0x16c087,
    _0x4ab3b3,
    _0x2acd23,
  ) {
    (super(_0x44129b, _0x216dd7, _0x3cc006, _0x399594, _0x28e533, _0x2b598c, _0x16c087, _0x4ab3b3, _0x2acd23),
      (this.isVideoTexture = true),
      (this.generateMipmaps = false),
      (this._requestVideoFrameCallbackId = 0));
    const _0x42b5a3 = this;
    function _0xed9b87() {
      ((_0x42b5a3.needsUpdate = true),
        (_0x42b5a3._requestVideoFrameCallbackId = _0x44129b.requestVideoFrameCallback(_0xed9b87)));
    }
    'requestVideoFrameCallback' in _0x44129b &&
      (this._requestVideoFrameCallbackId = _0x44129b.requestVideoFrameCallback(_0xed9b87));
  }
  ['clone']() {
    return new this['constructor'](this.image).copy(this);
  }
  ['update']() {
    const _0x4d0b14 = this.image,
      _0x12991c = 'requestVideoFrameCallback' in _0x4d0b14;
    _0x12991c === false && _0x4d0b14.readyState >= _0x4d0b14.HAVE_CURRENT_DATA && (this.needsUpdate = true);
  }
  ['dispose']() {
    (this._requestVideoFrameCallbackId !== 0 &&
      this.source.data.cancelVideoFrameCallback(this._requestVideoFrameCallbackId),
      super.dispose());
  }
}
class VideoFrameTexture extends VideoTexture {
  constructor(_0x5d19ef, _0x397b53, _0x25dc66, _0x1cc63b, _0x544470, _0x7e77ba, _0x53ba3b, _0xa6ff45) {
    (super({}, _0x5d19ef, _0x397b53, _0x25dc66, _0x1cc63b, _0x544470, _0x7e77ba, _0x53ba3b, _0xa6ff45),
      (this.isVideoFrameTexture = true));
  }
  ['update']() {}
  ['clone']() {
    return new this['constructor']().copy(this);
  }
  ['setFrame'](_0xf426a6) {
    ((this.image = _0xf426a6), (this.needsUpdate = true));
  }
}
class FramebufferTexture extends Texture {
  constructor(_0x2dccd4, _0x24567f) {
    (super({ width: _0x2dccd4, height: _0x24567f }),
      (this.isFramebufferTexture = true),
      (this.magFilter = NearestFilter),
      (this.minFilter = NearestFilter),
      (this.generateMipmaps = false),
      (this.needsUpdate = true));
  }
}
class CompressedTexture extends Texture {
  constructor(
    _0x48306a,
    _0x3eab20,
    _0x1b58d9,
    _0x6ef741,
    _0x357de3,
    _0x3890d2,
    _0x1d117f,
    _0x2a5e62,
    _0xf80150,
    _0xfd5f01,
    _0x58639b,
    _0x51ee85,
  ) {
    (super(
      null,
      _0x3890d2,
      _0x1d117f,
      _0x2a5e62,
      _0xf80150,
      _0xfd5f01,
      _0x6ef741,
      _0x357de3,
      _0x58639b,
      _0x51ee85,
    ),
      (this.isCompressedTexture = true),
      (this.image = { width: _0x3eab20, height: _0x1b58d9 }),
      (this.mipmaps = _0x48306a),
      (this.flipY = false),
      (this.generateMipmaps = false));
  }
}
class CompressedArrayTexture extends CompressedTexture {
  constructor(_0x3f2fbb, _0x2300be, _0x5267a0, _0x36e2f5, _0x427397, _0x591d39) {
    (super(_0x3f2fbb, _0x2300be, _0x5267a0, _0x427397, _0x591d39),
      (this.isCompressedArrayTexture = true),
      (this.image.depth = _0x36e2f5),
      (this.wrapR = ClampToEdgeWrapping),
      (this.layerUpdates = new Set()));
  }
  ['addLayerUpdate'](_0x18873c) {
    this.layerUpdates.add(_0x18873c);
  }
  ['clearLayerUpdates']() {
    this.layerUpdates.clear();
  }
}
class CompressedCubeTexture extends CompressedTexture {
  constructor(_0x46de83, _0x3706bb, _0x2decbf) {
    (super(undefined, _0x46de83[0].width, _0x46de83[0].height, _0x3706bb, _0x2decbf, CubeReflectionMapping),
      (this.isCompressedCubeTexture = true),
      (this.isCubeTexture = true),
      (this.image = _0x46de83));
  }
}
class CanvasTexture extends Texture {
  constructor(
    _0x41ece0,
    _0x4fa2cf,
    _0x103775,
    _0x1a15c3,
    _0x2dba05,
    _0x3a388b,
    _0x5e4ef6,
    _0x2468ee,
    _0x3db653,
  ) {
    (super(_0x41ece0, _0x4fa2cf, _0x103775, _0x1a15c3, _0x2dba05, _0x3a388b, _0x5e4ef6, _0x2468ee, _0x3db653),
      (this.isCanvasTexture = true),
      (this.needsUpdate = true));
  }
}
class DepthTexture extends Texture {
  constructor(
    _0x2f35b2,
    _0x3c08d9,
    _0x164f6a = UnsignedIntType,
    _0x58b880,
    _0x5da6f1,
    _0x2db6a9,
    _0x1df866 = NearestFilter,
    _0x288587 = NearestFilter,
    _0x3a089b,
    _0x793407 = DepthFormat,
    _0x2b1c63 = 1,
  ) {
    if (_0x793407 !== DepthFormat && _0x793407 !== DepthStencilFormat)
      throw new Error('DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat');
    const _0x14313d = { width: _0x2f35b2, height: _0x3c08d9, depth: _0x2b1c63 };
    (super(_0x14313d, _0x58b880, _0x5da6f1, _0x2db6a9, _0x1df866, _0x288587, _0x793407, _0x164f6a, _0x3a089b),
      (this.isDepthTexture = true),
      (this.flipY = false),
      (this.generateMipmaps = false),
      (this.compareFunction = null));
  }
  ['copy'](_0x447cab) {
    return (
      super.copy(_0x447cab),
      (this.source = new Source(Object.assign({}, _0x447cab.image))),
      (this.compareFunction = _0x447cab.compareFunction),
      this
    );
  }
  ['toJSON'](_0x5ceabf) {
    const _0x39988b = super.toJSON(_0x5ceabf);
    if (this.compareFunction !== null) _0x39988b.compareFunction = this.compareFunction;
    return _0x39988b;
  }
}
class ExternalTexture extends Texture {
  constructor(_0x5b4af2 = null) {
    (super(), (this.sourceTexture = _0x5b4af2), (this.isExternalTexture = true));
  }
  ['copy'](_0x40551e) {
    return (super.copy(_0x40551e), (this.sourceTexture = _0x40551e.sourceTexture), this);
  }
}
class CapsuleGeometry extends BufferGeometry {
  constructor(_0x29c708 = 1, _0x1e04fe = 1, _0x5a5b80 = 4, _0x7f1f5 = 8, _0x11b5e3 = 1) {
    (super(),
      (this.type = 'CapsuleGeometry'),
      (this.parameters = {
        radius: _0x29c708,
        height: _0x1e04fe,
        capSegments: _0x5a5b80,
        radialSegments: _0x7f1f5,
        heightSegments: _0x11b5e3,
      }),
      (_0x1e04fe = Math.max(0, _0x1e04fe)),
      (_0x5a5b80 = Math.max(1, Math.floor(_0x5a5b80))),
      (_0x7f1f5 = Math.max(3, Math.floor(_0x7f1f5))),
      (_0x11b5e3 = Math.max(1, Math.floor(_0x11b5e3))));
    const _0x5b7fb1 = [],
      _0x585c96 = [],
      _0x3754ce = [],
      _0x5eb656 = [],
      _0x49af54 = _0x1e04fe / 2,
      _0x234416 = (Math.PI / 2) * _0x29c708,
      _0x368b3c = _0x1e04fe,
      _0x173414 = 2 * _0x234416 + _0x368b3c,
      _0x1dbc0b = _0x5a5b80 * 2 + _0x11b5e3,
      _0x27fca1 = _0x7f1f5 + 1,
      _0x26e1aa = new Vector3(),
      _0x38a837 = new Vector3();
    for (let _0x20354e = 0; _0x20354e <= _0x1dbc0b; _0x20354e++) {
      let _0x3dd847 = 0,
        _0x263289 = 0,
        _0x3acb6f = 0,
        _0x426a03 = 0;
      if (_0x20354e <= _0x5a5b80) {
        const _0x24079b = _0x20354e / _0x5a5b80,
          _0x3f0a91 = (_0x24079b * Math.PI) / 2;
        ((_0x263289 = -_0x49af54 - _0x29c708 * Math.cos(_0x3f0a91)),
          (_0x3acb6f = _0x29c708 * Math.sin(_0x3f0a91)),
          (_0x426a03 = -_0x29c708 * Math.cos(_0x3f0a91)),
          (_0x3dd847 = _0x24079b * _0x234416));
      } else {
        if (_0x20354e <= _0x5a5b80 + _0x11b5e3) {
          const _0xe54e7e = (_0x20354e - _0x5a5b80) / _0x11b5e3;
          ((_0x263289 = -_0x49af54 + _0xe54e7e * _0x1e04fe),
            (_0x3acb6f = _0x29c708),
            (_0x426a03 = 0),
            (_0x3dd847 = _0x234416 + _0xe54e7e * _0x368b3c));
        } else {
          const _0x3814bc = (_0x20354e - _0x5a5b80 - _0x11b5e3) / _0x5a5b80,
            _0x3528e0 = (_0x3814bc * Math.PI) / 2;
          ((_0x263289 = _0x49af54 + _0x29c708 * Math.sin(_0x3528e0)),
            (_0x3acb6f = _0x29c708 * Math.cos(_0x3528e0)),
            (_0x426a03 = _0x29c708 * Math.sin(_0x3528e0)),
            (_0x3dd847 = _0x234416 + _0x368b3c + _0x3814bc * _0x234416));
        }
      }
      const _0x4f5059 = Math.max(0, Math.min(1, _0x3dd847 / _0x173414));
      let _0x49e345 = 0;
      if (_0x20354e === 0) _0x49e345 = 0.5 / _0x7f1f5;
      else _0x20354e === _0x1dbc0b && (_0x49e345 = -0.5 / _0x7f1f5);
      for (let _0x548f43 = 0; _0x548f43 <= _0x7f1f5; _0x548f43++) {
        const _0x1d5dca = _0x548f43 / _0x7f1f5,
          _0x2ceeb7 = _0x1d5dca * Math.PI * 2,
          _0x31d294 = Math.sin(_0x2ceeb7),
          _0x1a3b19 = Math.cos(_0x2ceeb7);
        ((_0x38a837.x = -_0x3acb6f * _0x1a3b19),
          (_0x38a837.y = _0x263289),
          (_0x38a837.z = _0x3acb6f * _0x31d294),
          _0x585c96.push(_0x38a837.x, _0x38a837.y, _0x38a837.z),
          _0x26e1aa.set(-_0x3acb6f * _0x1a3b19, _0x426a03, _0x3acb6f * _0x31d294),
          _0x26e1aa.normalize(),
          _0x3754ce.push(_0x26e1aa.x, _0x26e1aa.y, _0x26e1aa.z),
          _0x5eb656.push(_0x1d5dca + _0x49e345, _0x4f5059));
      }
      if (_0x20354e > 0) {
        const _0x398de6 = (_0x20354e - 1) * _0x27fca1;
        for (let _0x41ff0d = 0; _0x41ff0d < _0x7f1f5; _0x41ff0d++) {
          const _0x35b5b7 = _0x398de6 + _0x41ff0d,
            _0x3611ae = _0x398de6 + _0x41ff0d + 1,
            _0x31ad98 = _0x20354e * _0x27fca1 + _0x41ff0d,
            _0x4ee2d8 = _0x20354e * _0x27fca1 + _0x41ff0d + 1;
          (_0x5b7fb1.push(_0x35b5b7, _0x3611ae, _0x31ad98), _0x5b7fb1.push(_0x3611ae, _0x4ee2d8, _0x31ad98));
        }
      }
    }
    (this.setIndex(_0x5b7fb1),
      this.setAttribute('position', new Float32BufferAttribute(_0x585c96, 3)),
      this.setAttribute('normal', new Float32BufferAttribute(_0x3754ce, 3)),
      this.setAttribute('uv', new Float32BufferAttribute(_0x5eb656, 2)));
  }
  ['copy'](_0x331fe5) {
    return (super.copy(_0x331fe5), (this.parameters = Object.assign({}, _0x331fe5.parameters)), this);
  }
  static ['fromJSON'](_0x2972a5) {
    return new CapsuleGeometry(
      _0x2972a5.radius,
      _0x2972a5.height,
      _0x2972a5.capSegments,
      _0x2972a5.radialSegments,
      _0x2972a5.heightSegments,
    );
  }
}
class CircleGeometry extends BufferGeometry {
  constructor(_0x2a5060 = 1, _0x3ff54e = 32, _0x5b5127 = 0, _0x5090a8 = Math.PI * 2) {
    (super(),
      (this.type = 'CircleGeometry'),
      (this.parameters = {
        radius: _0x2a5060,
        segments: _0x3ff54e,
        thetaStart: _0x5b5127,
        thetaLength: _0x5090a8,
      }),
      (_0x3ff54e = Math.max(3, _0x3ff54e)));
    const _0x5d4a3f = [],
      _0x115608 = [],
      _0xe2e4a2 = [],
      _0xf133a8 = [],
      _0x17737b = new Vector3(),
      _0x26213a = new Vector2();
    (_0x115608.push(0, 0, 0), _0xe2e4a2.push(0, 0, 1), _0xf133a8.push(0.5, 0.5));
    for (let _0x35b112 = 0, _0x53a041 = 3; _0x35b112 <= _0x3ff54e; _0x35b112++, _0x53a041 += 3) {
      const _0x1195fd = _0x5b5127 + (_0x35b112 / _0x3ff54e) * _0x5090a8;
      ((_0x17737b.x = _0x2a5060 * Math.cos(_0x1195fd)),
        (_0x17737b.y = _0x2a5060 * Math.sin(_0x1195fd)),
        _0x115608.push(_0x17737b.x, _0x17737b.y, _0x17737b.z),
        _0xe2e4a2.push(0, 0, 1),
        (_0x26213a.x = (_0x115608[_0x53a041] / _0x2a5060 + 1) / 2),
        (_0x26213a.y = (_0x115608[_0x53a041 + 1] / _0x2a5060 + 1) / 2),
        _0xf133a8.push(_0x26213a.x, _0x26213a.y));
    }
    for (let _0x4a52bf = 1; _0x4a52bf <= _0x3ff54e; _0x4a52bf++) {
      _0x5d4a3f.push(_0x4a52bf, _0x4a52bf + 1, 0);
    }
    (this.setIndex(_0x5d4a3f),
      this.setAttribute('position', new Float32BufferAttribute(_0x115608, 3)),
      this.setAttribute('normal', new Float32BufferAttribute(_0xe2e4a2, 3)),
      this.setAttribute('uv', new Float32BufferAttribute(_0xf133a8, 2)));
  }
  ['copy'](_0x3d4e8f) {
    return (super.copy(_0x3d4e8f), (this.parameters = Object.assign({}, _0x3d4e8f.parameters)), this);
  }
  static ['fromJSON'](_0x107945) {
    return new CircleGeometry(
      _0x107945.radius,
      _0x107945.segments,
      _0x107945.thetaStart,
      _0x107945.thetaLength,
    );
  }
}
class CylinderGeometry extends BufferGeometry {
  constructor(
    _0x5bf6ad = 1,
    _0xc8c1e = 1,
    _0x36af21 = 1,
    _0x9106e5 = 32,
    _0x34643c = 1,
    _0x1331f0 = false,
    _0x33c947 = 0,
    _0x163e1c = Math.PI * 2,
  ) {
    (super(),
      (this.type = 'CylinderGeometry'),
      (this.parameters = {
        radiusTop: _0x5bf6ad,
        radiusBottom: _0xc8c1e,
        height: _0x36af21,
        radialSegments: _0x9106e5,
        heightSegments: _0x34643c,
        openEnded: _0x1331f0,
        thetaStart: _0x33c947,
        thetaLength: _0x163e1c,
      }));
    const _0x330495 = this;
    ((_0x9106e5 = Math.floor(_0x9106e5)), (_0x34643c = Math.floor(_0x34643c)));
    const _0x4b7857 = [],
      _0x44defe = [],
      _0x91c3df = [],
      _0x1a4fe2 = [];
    let _0x55f73c = 0;
    const _0x4cf40d = [],
      _0x1a0d25 = _0x36af21 / 2;
    let _0x229c98 = 0;
    _0x32b8c0();
    if (_0x1331f0 === false) {
      if (_0x5bf6ad > 0) _0x48c8ca(true);
      if (_0xc8c1e > 0) _0x48c8ca(false);
    }
    (this.setIndex(_0x4b7857),
      this.setAttribute('position', new Float32BufferAttribute(_0x44defe, 3)),
      this.setAttribute('normal', new Float32BufferAttribute(_0x91c3df, 3)),
      this.setAttribute('uv', new Float32BufferAttribute(_0x1a4fe2, 2)));
    function _0x32b8c0() {
      const _0x1bbe93 = new Vector3(),
        _0x5425cd = new Vector3();
      let _0xe61cda = 0;
      const _0x180767 = (_0xc8c1e - _0x5bf6ad) / _0x36af21;
      for (let _0x198f03 = 0; _0x198f03 <= _0x34643c; _0x198f03++) {
        const _0x314cfa = [],
          _0x1e61d0 = _0x198f03 / _0x34643c,
          _0x1f6e4d = _0x1e61d0 * (_0xc8c1e - _0x5bf6ad) + _0x5bf6ad;
        for (let _0x28e99b = 0; _0x28e99b <= _0x9106e5; _0x28e99b++) {
          const _0x5f0372 = _0x28e99b / _0x9106e5,
            _0x848b1d = _0x5f0372 * _0x163e1c + _0x33c947,
            _0x19125d = Math.sin(_0x848b1d),
            _0x495f89 = Math.cos(_0x848b1d);
          ((_0x5425cd.x = _0x1f6e4d * _0x19125d),
            (_0x5425cd.y = -_0x1e61d0 * _0x36af21 + _0x1a0d25),
            (_0x5425cd.z = _0x1f6e4d * _0x495f89),
            _0x44defe.push(_0x5425cd.x, _0x5425cd.y, _0x5425cd.z),
            _0x1bbe93.set(_0x19125d, _0x180767, _0x495f89).normalize(),
            _0x91c3df.push(_0x1bbe93.x, _0x1bbe93.y, _0x1bbe93.z),
            _0x1a4fe2.push(_0x5f0372, 1 - _0x1e61d0),
            _0x314cfa.push(_0x55f73c++));
        }
        _0x4cf40d.push(_0x314cfa);
      }
      for (let _0x5a96cd = 0; _0x5a96cd < _0x9106e5; _0x5a96cd++) {
        for (let _0x4f32c8 = 0; _0x4f32c8 < _0x34643c; _0x4f32c8++) {
          const _0x17dfa2 = _0x4cf40d[_0x4f32c8][_0x5a96cd],
            _0x4c44c1 = _0x4cf40d[_0x4f32c8 + 1][_0x5a96cd],
            _0x5b41b3 = _0x4cf40d[_0x4f32c8 + 1][_0x5a96cd + 1],
            _0x3c88e8 = _0x4cf40d[_0x4f32c8][_0x5a96cd + 1];
          ((_0x5bf6ad > 0 || _0x4f32c8 !== 0) &&
            (_0x4b7857.push(_0x17dfa2, _0x4c44c1, _0x3c88e8), (_0xe61cda += 3)),
            (_0xc8c1e > 0 || _0x4f32c8 !== _0x34643c - 1) &&
              (_0x4b7857.push(_0x4c44c1, _0x5b41b3, _0x3c88e8), (_0xe61cda += 3)));
        }
      }
      (_0x330495.addGroup(_0x229c98, _0xe61cda, 0), (_0x229c98 += _0xe61cda));
    }
    function _0x48c8ca(_0x2a4e1b) {
      const _0x3e09df = _0x55f73c,
        _0x6de615 = new Vector2(),
        _0x3e5231 = new Vector3();
      let _0x2480e2 = 0;
      const _0x1c8ce3 = _0x2a4e1b === true ? _0x5bf6ad : _0xc8c1e,
        _0x4af116 = _0x2a4e1b === true ? 1 : -1;
      for (let _0x2d6b6c = 1; _0x2d6b6c <= _0x9106e5; _0x2d6b6c++) {
        (_0x44defe.push(0, _0x1a0d25 * _0x4af116, 0),
          _0x91c3df.push(0, _0x4af116, 0),
          _0x1a4fe2.push(0.5, 0.5),
          _0x55f73c++);
      }
      const _0x38f62b = _0x55f73c;
      for (let _0x48c4c4 = 0; _0x48c4c4 <= _0x9106e5; _0x48c4c4++) {
        const _0x4c4f81 = _0x48c4c4 / _0x9106e5,
          _0xf97241 = _0x4c4f81 * _0x163e1c + _0x33c947,
          _0x5bf04b = Math.cos(_0xf97241),
          _0x2a96ed = Math.sin(_0xf97241);
        ((_0x3e5231.x = _0x1c8ce3 * _0x2a96ed),
          (_0x3e5231.y = _0x1a0d25 * _0x4af116),
          (_0x3e5231.z = _0x1c8ce3 * _0x5bf04b),
          _0x44defe.push(_0x3e5231.x, _0x3e5231.y, _0x3e5231.z),
          _0x91c3df.push(0, _0x4af116, 0),
          (_0x6de615.x = _0x5bf04b * 0.5 + 0.5),
          (_0x6de615.y = _0x2a96ed * 0.5 * _0x4af116 + 0.5),
          _0x1a4fe2.push(_0x6de615.x, _0x6de615.y),
          _0x55f73c++);
      }
      for (let _0x7a8f17 = 0; _0x7a8f17 < _0x9106e5; _0x7a8f17++) {
        const _0x23d324 = _0x3e09df + _0x7a8f17,
          _0x30d080 = _0x38f62b + _0x7a8f17;
        (_0x2a4e1b === true
          ? _0x4b7857.push(_0x30d080, _0x30d080 + 1, _0x23d324)
          : _0x4b7857.push(_0x30d080 + 1, _0x30d080, _0x23d324),
          (_0x2480e2 += 3));
      }
      (_0x330495.addGroup(_0x229c98, _0x2480e2, _0x2a4e1b === true ? 1 : 2), (_0x229c98 += _0x2480e2));
    }
  }
  ['copy'](_0xfad080) {
    return (super.copy(_0xfad080), (this.parameters = Object.assign({}, _0xfad080.parameters)), this);
  }
  static ['fromJSON'](_0x4ab179) {
    return new CylinderGeometry(
      _0x4ab179.radiusTop,
      _0x4ab179.radiusBottom,
      _0x4ab179.height,
      _0x4ab179.radialSegments,
      _0x4ab179.heightSegments,
      _0x4ab179.openEnded,
      _0x4ab179.thetaStart,
      _0x4ab179.thetaLength,
    );
  }
}
class ConeGeometry extends CylinderGeometry {
  constructor(
    _0x59ee52 = 1,
    _0x57a4d6 = 1,
    _0xd954fb = 32,
    _0xd1b484 = 1,
    _0x7ad4f4 = false,
    _0x5a1309 = 0,
    _0x20d2fa = Math.PI * 2,
  ) {
    (super(0, _0x59ee52, _0x57a4d6, _0xd954fb, _0xd1b484, _0x7ad4f4, _0x5a1309, _0x20d2fa),
      (this.type = 'ConeGeometry'),
      (this.parameters = {
        radius: _0x59ee52,
        height: _0x57a4d6,
        radialSegments: _0xd954fb,
        heightSegments: _0xd1b484,
        openEnded: _0x7ad4f4,
        thetaStart: _0x5a1309,
        thetaLength: _0x20d2fa,
      }));
  }
  static ['fromJSON'](_0x14568b) {
    return new ConeGeometry(
      _0x14568b.radius,
      _0x14568b.height,
      _0x14568b.radialSegments,
      _0x14568b.heightSegments,
      _0x14568b.openEnded,
      _0x14568b.thetaStart,
      _0x14568b.thetaLength,
    );
  }
}
class PolyhedronGeometry extends BufferGeometry {
  constructor(_0xdf098f = [], _0x2fb636 = [], _0xb57e3a = 1, _0x3da6a9 = 0) {
    (super(),
      (this.type = 'PolyhedronGeometry'),
      (this.parameters = { vertices: _0xdf098f, indices: _0x2fb636, radius: _0xb57e3a, detail: _0x3da6a9 }));
    const _0x510db6 = [],
      _0x58c2e2 = [];
    (_0x113ef6(_0x3da6a9),
      _0xa25189(_0xb57e3a),
      _0x33e58c(),
      this.setAttribute('position', new Float32BufferAttribute(_0x510db6, 3)),
      this.setAttribute('normal', new Float32BufferAttribute(_0x510db6.slice(), 3)),
      this.setAttribute('uv', new Float32BufferAttribute(_0x58c2e2, 2)));
    _0x3da6a9 === 0 ? this.computeVertexNormals() : this.normalizeNormals();
    function _0x113ef6(_0x574d74) {
      const _0x38942f = new Vector3(),
        _0x10648f = new Vector3(),
        _0x1b1749 = new Vector3();
      for (let _0x552fb3 = 0; _0x552fb3 < _0x2fb636.length; _0x552fb3 += 3) {
        (_0x47936e(_0x2fb636[_0x552fb3 + 0], _0x38942f),
          _0x47936e(_0x2fb636[_0x552fb3 + 1], _0x10648f),
          _0x47936e(_0x2fb636[_0x552fb3 + 2], _0x1b1749),
          _0x356623(_0x38942f, _0x10648f, _0x1b1749, _0x574d74));
      }
    }
    function _0x356623(_0xd7c7d8, _0x5047dd, _0x51ee14, _0x268938) {
      const _0x51898b = _0x268938 + 1,
        _0x49761a = [];
      for (let _0x2d52a8 = 0; _0x2d52a8 <= _0x51898b; _0x2d52a8++) {
        _0x49761a[_0x2d52a8] = [];
        const _0x514016 = _0xd7c7d8.clone().lerp(_0x51ee14, _0x2d52a8 / _0x51898b),
          _0x306038 = _0x5047dd.clone().lerp(_0x51ee14, _0x2d52a8 / _0x51898b),
          _0x14413c = _0x51898b - _0x2d52a8;
        for (let _0x5ad0fb = 0; _0x5ad0fb <= _0x14413c; _0x5ad0fb++) {
          _0x5ad0fb === 0 && _0x2d52a8 === _0x51898b
            ? (_0x49761a[_0x2d52a8][_0x5ad0fb] = _0x514016)
            : (_0x49761a[_0x2d52a8][_0x5ad0fb] = _0x514016.clone().lerp(_0x306038, _0x5ad0fb / _0x14413c));
        }
      }
      for (let _0x2820aa = 0; _0x2820aa < _0x51898b; _0x2820aa++) {
        for (let _0x16d795 = 0; _0x16d795 < 2 * (_0x51898b - _0x2820aa) - 1; _0x16d795++) {
          const _0xc0d0bf = Math.floor(_0x16d795 / 2);
          _0x16d795 % 2 === 0
            ? (_0x44c683(_0x49761a[_0x2820aa][_0xc0d0bf + 1]),
              _0x44c683(_0x49761a[_0x2820aa + 1][_0xc0d0bf]),
              _0x44c683(_0x49761a[_0x2820aa][_0xc0d0bf]))
            : (_0x44c683(_0x49761a[_0x2820aa][_0xc0d0bf + 1]),
              _0x44c683(_0x49761a[_0x2820aa + 1][_0xc0d0bf + 1]),
              _0x44c683(_0x49761a[_0x2820aa + 1][_0xc0d0bf]));
        }
      }
    }
    function _0xa25189(_0x5e9178) {
      const _0x55a714 = new Vector3();
      for (let _0x30123f = 0; _0x30123f < _0x510db6.length; _0x30123f += 3) {
        ((_0x55a714.x = _0x510db6[_0x30123f + 0]),
          (_0x55a714.y = _0x510db6[_0x30123f + 1]),
          (_0x55a714.z = _0x510db6[_0x30123f + 2]),
          _0x55a714.normalize().multiplyScalar(_0x5e9178),
          (_0x510db6[_0x30123f + 0] = _0x55a714.x),
          (_0x510db6[_0x30123f + 1] = _0x55a714.y),
          (_0x510db6[_0x30123f + 2] = _0x55a714.z));
      }
    }
    function _0x33e58c() {
      const _0x13a7a3 = new Vector3();
      for (let _0x2de812 = 0; _0x2de812 < _0x510db6.length; _0x2de812 += 3) {
        ((_0x13a7a3.x = _0x510db6[_0x2de812 + 0]),
          (_0x13a7a3.y = _0x510db6[_0x2de812 + 1]),
          (_0x13a7a3.z = _0x510db6[_0x2de812 + 2]));
        const _0x1e69e8 = _0x3bf52f(_0x13a7a3) / 2 / Math.PI + 0.5,
          _0x2ebfbb = _0x2f42d0(_0x13a7a3) / Math.PI + 0.5;
        _0x58c2e2.push(_0x1e69e8, 1 - _0x2ebfbb);
      }
      (_0x4c6314(), _0x3607e7());
    }
    function _0x3607e7() {
      for (let _0x134644 = 0; _0x134644 < _0x58c2e2.length; _0x134644 += 6) {
        const _0x47691a = _0x58c2e2[_0x134644 + 0],
          _0x2c00a4 = _0x58c2e2[_0x134644 + 2],
          _0xfba84c = _0x58c2e2[_0x134644 + 4],
          _0x279a82 = Math.max(_0x47691a, _0x2c00a4, _0xfba84c),
          _0x1f8cd4 = Math.min(_0x47691a, _0x2c00a4, _0xfba84c);
        if (_0x279a82 > 0.9 && _0x1f8cd4 < 0.1) {
          if (_0x47691a < 0.2) _0x58c2e2[_0x134644 + 0] += 1;
          if (_0x2c00a4 < 0.2) _0x58c2e2[_0x134644 + 2] += 1;
          if (_0xfba84c < 0.2) _0x58c2e2[_0x134644 + 4] += 1;
        }
      }
    }
    function _0x44c683(_0x3d32aa) {
      _0x510db6.push(_0x3d32aa.x, _0x3d32aa.y, _0x3d32aa.z);
    }
    function _0x47936e(_0x4456d9, _0x52a2a5) {
      const _0x245222 = _0x4456d9 * 3;
      ((_0x52a2a5.x = _0xdf098f[_0x245222 + 0]),
        (_0x52a2a5.y = _0xdf098f[_0x245222 + 1]),
        (_0x52a2a5.z = _0xdf098f[_0x245222 + 2]));
    }
    function _0x4c6314() {
      const _0x5a6d73 = new Vector3(),
        _0x20afc6 = new Vector3(),
        _0x33c96d = new Vector3(),
        _0x27e502 = new Vector3(),
        _0x49ee6a = new Vector2(),
        _0x3a27c1 = new Vector2(),
        _0x25b955 = new Vector2();
      for (let _0x52d82c = 0, _0x24e492 = 0; _0x52d82c < _0x510db6.length; _0x52d82c += 9, _0x24e492 += 6) {
        (_0x5a6d73.set(_0x510db6[_0x52d82c + 0], _0x510db6[_0x52d82c + 1], _0x510db6[_0x52d82c + 2]),
          _0x20afc6.set(_0x510db6[_0x52d82c + 3], _0x510db6[_0x52d82c + 4], _0x510db6[_0x52d82c + 5]),
          _0x33c96d.set(_0x510db6[_0x52d82c + 6], _0x510db6[_0x52d82c + 7], _0x510db6[_0x52d82c + 8]),
          _0x49ee6a.set(_0x58c2e2[_0x24e492 + 0], _0x58c2e2[_0x24e492 + 1]),
          _0x3a27c1.set(_0x58c2e2[_0x24e492 + 2], _0x58c2e2[_0x24e492 + 3]),
          _0x25b955.set(_0x58c2e2[_0x24e492 + 4], _0x58c2e2[_0x24e492 + 5]),
          _0x27e502.copy(_0x5a6d73).add(_0x20afc6).add(_0x33c96d).divideScalar(3));
        const _0x12dc16 = _0x3bf52f(_0x27e502);
        (_0x3dac42(_0x49ee6a, _0x24e492 + 0, _0x5a6d73, _0x12dc16),
          _0x3dac42(_0x3a27c1, _0x24e492 + 2, _0x20afc6, _0x12dc16),
          _0x3dac42(_0x25b955, _0x24e492 + 4, _0x33c96d, _0x12dc16));
      }
    }
    function _0x3dac42(_0x576295, _0x3fc812, _0x5969c3, _0x30dc8a) {
      (_0x30dc8a < 0 && _0x576295.x === 1 && (_0x58c2e2[_0x3fc812] = _0x576295.x - 1),
        _0x5969c3.x === 0 && _0x5969c3.z === 0 && (_0x58c2e2[_0x3fc812] = _0x30dc8a / 2 / Math.PI + 0.5));
    }
    function _0x3bf52f(_0x4a3edc) {
      return Math.atan2(_0x4a3edc.z, -_0x4a3edc.x);
    }
    function _0x2f42d0(_0x398fb8) {
      return Math.atan2(-_0x398fb8.y, Math.sqrt(_0x398fb8.x * _0x398fb8.x + _0x398fb8.z * _0x398fb8.z));
    }
  }
  ['copy'](_0xd4eb09) {
    return (super.copy(_0xd4eb09), (this.parameters = Object.assign({}, _0xd4eb09.parameters)), this);
  }
  static ['fromJSON'](_0x30739a) {
    return new PolyhedronGeometry(_0x30739a.vertices, _0x30739a.indices, _0x30739a.radius, _0x30739a.details);
  }
}
class DodecahedronGeometry extends PolyhedronGeometry {
  constructor(_0x217167 = 1, _0x3c2d5c = 0) {
    const _0x46d15e = (1 + Math.sqrt(5)) / 2,
      _0xf5c6a8 = 1 / _0x46d15e,
      _0x348ae1 = [
        -1,
        -1,
        -1,
        -1,
        -1,
        1,
        -1,
        1,
        -1,
        -1,
        1,
        1,
        1,
        -1,
        -1,
        1,
        -1,
        1,
        1,
        1,
        -1,
        1,
        1,
        1,
        0,
        -_0xf5c6a8,
        -_0x46d15e,
        0,
        -_0xf5c6a8,
        _0x46d15e,
        0,
        _0xf5c6a8,
        -_0x46d15e,
        0,
        _0xf5c6a8,
        _0x46d15e,
        -_0xf5c6a8,
        -_0x46d15e,
        0,
        -_0xf5c6a8,
        _0x46d15e,
        0,
        _0xf5c6a8,
        -_0x46d15e,
        0,
        _0xf5c6a8,
        _0x46d15e,
        0,
        -_0x46d15e,
        0,
        -_0xf5c6a8,
        _0x46d15e,
        0,
        -_0xf5c6a8,
        -_0x46d15e,
        0,
        _0xf5c6a8,
        _0x46d15e,
        0,
        _0xf5c6a8,
      ],
      _0x227cdb = [
        3, 11, 7, 3, 7, 15, 3, 15, 13, 7, 19, 17, 7, 17, 6, 7, 6, 15, 17, 4, 8, 17, 8, 10, 17, 10, 6, 8, 0,
        16, 8, 16, 2, 8, 2, 10, 0, 12, 1, 0, 1, 18, 0, 18, 16, 6, 10, 2, 6, 2, 13, 6, 13, 15, 2, 16, 18, 2,
        18, 3, 2, 3, 13, 18, 1, 9, 18, 9, 11, 18, 11, 3, 4, 14, 12, 4, 12, 0, 4, 0, 8, 11, 9, 5, 11, 5, 19,
        11, 19, 7, 19, 5, 14, 19, 14, 4, 19, 4, 17, 1, 12, 14, 1, 14, 5, 1, 5, 9,
      ];
    (super(_0x348ae1, _0x227cdb, _0x217167, _0x3c2d5c),
      (this.type = 'DodecahedronGeometry'),
      (this.parameters = { radius: _0x217167, detail: _0x3c2d5c }));
  }
  static ['fromJSON'](_0x45a16f) {
    return new DodecahedronGeometry(_0x45a16f.radius, _0x45a16f.detail);
  }
}
const _v0 = new Vector3(),
  _v1$1 = new Vector3(),
  _normal = new Vector3(),
  _triangle = new Triangle();
class EdgesGeometry extends BufferGeometry {
  constructor(_0x516054 = null, _0x49c4e3 = 1) {
    (super(),
      (this.type = 'EdgesGeometry'),
      (this.parameters = { geometry: _0x516054, thresholdAngle: _0x49c4e3 }));
    if (_0x516054 !== null) {
      const _0x52d2a1 = 4,
        _0x57386d = Math.pow(10, _0x52d2a1),
        _0x2e2646 = Math.cos(DEG2RAD * _0x49c4e3),
        _0x2b1a68 = _0x516054.getIndex(),
        _0x42d2d9 = _0x516054.getAttribute('position'),
        _0x31d654 = _0x2b1a68 ? _0x2b1a68.count : _0x42d2d9.count,
        _0x247b83 = [0, 0, 0],
        _0x2a9417 = ['a', 'b', 'c'],
        _0x2e345e = new Array(3),
        _0x445644 = {},
        _0x2a859d = [];
      for (let _0x2634fe = 0; _0x2634fe < _0x31d654; _0x2634fe += 3) {
        _0x2b1a68
          ? ((_0x247b83[0] = _0x2b1a68.getX(_0x2634fe)),
            (_0x247b83[1] = _0x2b1a68.getX(_0x2634fe + 1)),
            (_0x247b83[2] = _0x2b1a68.getX(_0x2634fe + 2)))
          : ((_0x247b83[0] = _0x2634fe), (_0x247b83[1] = _0x2634fe + 1), (_0x247b83[2] = _0x2634fe + 2));
        const { a: _0x35d534, b: _0x40c1b8, c: _0x806bb5 } = _triangle;
        (_0x35d534.fromBufferAttribute(_0x42d2d9, _0x247b83[0]),
          _0x40c1b8.fromBufferAttribute(_0x42d2d9, _0x247b83[1]),
          _0x806bb5.fromBufferAttribute(_0x42d2d9, _0x247b83[2]),
          _triangle.getNormal(_normal),
          (_0x2e345e[0] =
            Math.round(_0x35d534.x * _0x57386d) +
            ',' +
            Math.round(_0x35d534.y * _0x57386d) +
            ',' +
            Math.round(_0x35d534.z * _0x57386d)),
          (_0x2e345e[1] =
            Math.round(_0x40c1b8.x * _0x57386d) +
            ',' +
            Math.round(_0x40c1b8.y * _0x57386d) +
            ',' +
            Math.round(_0x40c1b8.z * _0x57386d)),
          (_0x2e345e[2] =
            Math.round(_0x806bb5.x * _0x57386d) +
            ',' +
            Math.round(_0x806bb5.y * _0x57386d) +
            ',' +
            Math.round(_0x806bb5.z * _0x57386d)));
        if (_0x2e345e[0] === _0x2e345e[1] || _0x2e345e[1] === _0x2e345e[2] || _0x2e345e[2] === _0x2e345e[0])
          continue;
        for (let _0x45a2de = 0; _0x45a2de < 3; _0x45a2de++) {
          const _0x186fe3 = (_0x45a2de + 1) % 3,
            _0x327720 = _0x2e345e[_0x45a2de],
            _0x34ee0e = _0x2e345e[_0x186fe3],
            _0x52036f = _triangle[_0x2a9417[_0x45a2de]],
            _0x189e10 = _triangle[_0x2a9417[_0x186fe3]],
            _0x4dd695 = _0x327720 + '_' + _0x34ee0e,
            _0x1ab428 = _0x34ee0e + '_' + _0x327720;
          if (_0x1ab428 in _0x445644 && _0x445644[_0x1ab428])
            (_normal.dot(_0x445644[_0x1ab428].normal) <= _0x2e2646 &&
              (_0x2a859d.push(_0x52036f.x, _0x52036f.y, _0x52036f.z),
              _0x2a859d.push(_0x189e10.x, _0x189e10.y, _0x189e10.z)),
              (_0x445644[_0x1ab428] = null));
          else
            !(_0x4dd695 in _0x445644) &&
              (_0x445644[_0x4dd695] = {
                index0: _0x247b83[_0x45a2de],
                index1: _0x247b83[_0x186fe3],
                normal: _normal.clone(),
              });
        }
      }
      for (const _0x39220f in _0x445644) {
        if (_0x445644[_0x39220f]) {
          const { index0: _0x458406, index1: _0x229738 } = _0x445644[_0x39220f];
          (_v0.fromBufferAttribute(_0x42d2d9, _0x458406),
            _v1$1.fromBufferAttribute(_0x42d2d9, _0x229738),
            _0x2a859d.push(_v0.x, _v0.y, _v0.z),
            _0x2a859d.push(_v1$1.x, _v1$1.y, _v1$1.z));
        }
      }
      this.setAttribute('position', new Float32BufferAttribute(_0x2a859d, 3));
    }
  }
  ['copy'](_0x42af04) {
    return (super.copy(_0x42af04), (this.parameters = Object.assign({}, _0x42af04.parameters)), this);
  }
}
class Curve {
  constructor() {
    ((this.type = 'Curve'),
      (this.arcLengthDivisions = 200),
      (this.needsUpdate = false),
      (this.cacheArcLengths = null));
  }
  ['getPoint']() {
    console.warn('THREE.Curve: .getPoint() not implemented.');
  }
  ['getPointAt'](_0x1c3f8f, _0x1e8ee9) {
    const _0x5dab48 = this.getUtoTmapping(_0x1c3f8f);
    return this.getPoint(_0x5dab48, _0x1e8ee9);
  }
  ['getPoints'](_0x29141b = 5) {
    const _0x2c9bb3 = [];
    for (let _0x21363f = 0; _0x21363f <= _0x29141b; _0x21363f++) {
      _0x2c9bb3.push(this.getPoint(_0x21363f / _0x29141b));
    }
    return _0x2c9bb3;
  }
  ['getSpacedPoints'](_0x5969c4 = 5) {
    const _0x4a3c64 = [];
    for (let _0x112187 = 0; _0x112187 <= _0x5969c4; _0x112187++) {
      _0x4a3c64.push(this.getPointAt(_0x112187 / _0x5969c4));
    }
    return _0x4a3c64;
  }
  ['getLength']() {
    const _0x517e4c = this.getLengths();
    return _0x517e4c[_0x517e4c.length - 1];
  }
  ['getLengths'](_0x3171d6 = this.arcLengthDivisions) {
    if (this.cacheArcLengths && this.cacheArcLengths.length === _0x3171d6 + 1 && !this.needsUpdate)
      return this.cacheArcLengths;
    this.needsUpdate = false;
    const _0x278b00 = [];
    let _0x3ecc27,
      _0x5b54f7 = this.getPoint(0),
      _0x3d2713 = 0;
    _0x278b00.push(0);
    for (let _0x36f1d4 = 1; _0x36f1d4 <= _0x3171d6; _0x36f1d4++) {
      ((_0x3ecc27 = this.getPoint(_0x36f1d4 / _0x3171d6)),
        (_0x3d2713 += _0x3ecc27.distanceTo(_0x5b54f7)),
        _0x278b00.push(_0x3d2713),
        (_0x5b54f7 = _0x3ecc27));
    }
    return ((this.cacheArcLengths = _0x278b00), _0x278b00);
  }
  ['updateArcLengths']() {
    ((this.needsUpdate = true), this.getLengths());
  }
  ['getUtoTmapping'](_0x5dddf4, _0x3c9b35 = null) {
    const _0x3757c6 = this.getLengths();
    let _0x15135c = 0;
    const _0x10dfe6 = _0x3757c6.length;
    let _0x38073a;
    _0x3c9b35 ? (_0x38073a = _0x3c9b35) : (_0x38073a = _0x5dddf4 * _0x3757c6[_0x10dfe6 - 1]);
    let _0xf1bdf8 = 0,
      _0x2b7d3e = _0x10dfe6 - 1,
      _0x19b129;
    while (_0xf1bdf8 <= _0x2b7d3e) {
      ((_0x15135c = Math.floor(_0xf1bdf8 + (_0x2b7d3e - _0xf1bdf8) / 2)),
        (_0x19b129 = _0x3757c6[_0x15135c] - _0x38073a));
      if (_0x19b129 < 0) _0xf1bdf8 = _0x15135c + 1;
      else {
        if (_0x19b129 > 0) _0x2b7d3e = _0x15135c - 1;
        else {
          _0x2b7d3e = _0x15135c;
          break;
        }
      }
    }
    _0x15135c = _0x2b7d3e;
    if (_0x3757c6[_0x15135c] === _0x38073a) return _0x15135c / (_0x10dfe6 - 1);
    const _0x4651a0 = _0x3757c6[_0x15135c],
      _0x385a20 = _0x3757c6[_0x15135c + 1],
      _0x1628ae = _0x385a20 - _0x4651a0,
      _0x5ac307 = (_0x38073a - _0x4651a0) / _0x1628ae,
      _0x5589a4 = (_0x15135c + _0x5ac307) / (_0x10dfe6 - 1);
    return _0x5589a4;
  }
  ['getTangent'](_0x5ab83f, _0x410f1c) {
    const _0x446aa6 = 0.0001;
    let _0x164101 = _0x5ab83f - _0x446aa6,
      _0x4eef24 = _0x5ab83f + _0x446aa6;
    if (_0x164101 < 0) _0x164101 = 0;
    if (_0x4eef24 > 1) _0x4eef24 = 1;
    const _0x785ff4 = this.getPoint(_0x164101),
      _0x3ae37b = this.getPoint(_0x4eef24),
      _0x14fb38 = _0x410f1c || (_0x785ff4.isVector2 ? new Vector2() : new Vector3());
    return (_0x14fb38.copy(_0x3ae37b).sub(_0x785ff4).normalize(), _0x14fb38);
  }
  ['getTangentAt'](_0x1f5146, _0x5337b9) {
    const _0x207547 = this.getUtoTmapping(_0x1f5146);
    return this.getTangent(_0x207547, _0x5337b9);
  }
  ['computeFrenetFrames'](_0x3ea635, _0x3aa38f = false) {
    const _0x555517 = new Vector3(),
      _0x5debcc = [],
      _0x5aba45 = [],
      _0x14c06d = [],
      _0x14ee68 = new Vector3(),
      _0x583e4a = new Matrix4();
    for (let _0x3cfab2 = 0; _0x3cfab2 <= _0x3ea635; _0x3cfab2++) {
      const _0x131c02 = _0x3cfab2 / _0x3ea635;
      _0x5debcc[_0x3cfab2] = this.getTangentAt(_0x131c02, new Vector3());
    }
    ((_0x5aba45[0] = new Vector3()), (_0x14c06d[0] = new Vector3()));
    let _0x3b9faf = Number.MAX_VALUE;
    const _0x268fb2 = Math.abs(_0x5debcc[0].x),
      _0x1c04dc = Math.abs(_0x5debcc[0].y),
      _0x2a5fb1 = Math.abs(_0x5debcc[0].z);
    _0x268fb2 <= _0x3b9faf && ((_0x3b9faf = _0x268fb2), _0x555517.set(1, 0, 0));
    _0x1c04dc <= _0x3b9faf && ((_0x3b9faf = _0x1c04dc), _0x555517.set(0, 1, 0));
    _0x2a5fb1 <= _0x3b9faf && _0x555517.set(0, 0, 1);
    (_0x14ee68.crossVectors(_0x5debcc[0], _0x555517).normalize(),
      _0x5aba45[0].crossVectors(_0x5debcc[0], _0x14ee68),
      _0x14c06d[0].crossVectors(_0x5debcc[0], _0x5aba45[0]));
    for (let _0x2cc108 = 1; _0x2cc108 <= _0x3ea635; _0x2cc108++) {
      ((_0x5aba45[_0x2cc108] = _0x5aba45[_0x2cc108 - 1].clone()),
        (_0x14c06d[_0x2cc108] = _0x14c06d[_0x2cc108 - 1].clone()),
        _0x14ee68.crossVectors(_0x5debcc[_0x2cc108 - 1], _0x5debcc[_0x2cc108]));
      if (_0x14ee68.length() > Number.EPSILON) {
        _0x14ee68.normalize();
        const _0xe5390f = Math.acos(clamp(_0x5debcc[_0x2cc108 - 1].dot(_0x5debcc[_0x2cc108]), -1, 1));
        _0x5aba45[_0x2cc108].applyMatrix4(_0x583e4a.makeRotationAxis(_0x14ee68, _0xe5390f));
      }
      _0x14c06d[_0x2cc108].crossVectors(_0x5debcc[_0x2cc108], _0x5aba45[_0x2cc108]);
    }
    if (_0x3aa38f === true) {
      let _0x32fa01 = Math.acos(clamp(_0x5aba45[0].dot(_0x5aba45[_0x3ea635]), -1, 1));
      _0x32fa01 /= _0x3ea635;
      _0x5debcc[0].dot(_0x14ee68.crossVectors(_0x5aba45[0], _0x5aba45[_0x3ea635])) > 0 &&
        (_0x32fa01 = -_0x32fa01);
      for (let _0x5c9d09 = 1; _0x5c9d09 <= _0x3ea635; _0x5c9d09++) {
        (_0x5aba45[_0x5c9d09].applyMatrix4(
          _0x583e4a.makeRotationAxis(_0x5debcc[_0x5c9d09], _0x32fa01 * _0x5c9d09),
        ),
          _0x14c06d[_0x5c9d09].crossVectors(_0x5debcc[_0x5c9d09], _0x5aba45[_0x5c9d09]));
      }
    }
    return { tangents: _0x5debcc, normals: _0x5aba45, binormals: _0x14c06d };
  }
  ['clone']() {
    return new this['constructor']().copy(this);
  }
  ['copy'](_0x29b477) {
    return ((this.arcLengthDivisions = _0x29b477.arcLengthDivisions), this);
  }
  ['toJSON']() {
    const _0x5153ed = { metadata: { version: 4.7, type: 'Curve', generator: 'Curve.toJSON' } };
    return (
      (_0x5153ed.arcLengthDivisions = this.arcLengthDivisions),
      (_0x5153ed.type = this.type),
      _0x5153ed
    );
  }
  ['fromJSON'](_0x376d36) {
    return ((this.arcLengthDivisions = _0x376d36.arcLengthDivisions), this);
  }
}
class EllipseCurve extends Curve {
  constructor(
    _0x255bae = 0,
    _0x4b194e = 0,
    _0x43f563 = 1,
    _0x4366ce = 1,
    _0x4d5e7f = 0,
    _0x20edef = Math.PI * 2,
    _0x463d8e = false,
    _0x2194a7 = 0,
  ) {
    (super(),
      (this.isEllipseCurve = true),
      (this.type = 'EllipseCurve'),
      (this.aX = _0x255bae),
      (this.aY = _0x4b194e),
      (this.xRadius = _0x43f563),
      (this.yRadius = _0x4366ce),
      (this.aStartAngle = _0x4d5e7f),
      (this.aEndAngle = _0x20edef),
      (this.aClockwise = _0x463d8e),
      (this.aRotation = _0x2194a7));
  }
  ['getPoint'](_0x2ffe91, _0xd681ad = new Vector2()) {
    const _0x188ed9 = _0xd681ad,
      _0x51841b = Math.PI * 2;
    let _0x23907b = this.aEndAngle - this.aStartAngle;
    const _0x578e1e = Math.abs(_0x23907b) < Number.EPSILON;
    while (_0x23907b < 0) _0x23907b += _0x51841b;
    while (_0x23907b > _0x51841b) _0x23907b -= _0x51841b;
    _0x23907b < Number.EPSILON && (_0x578e1e ? (_0x23907b = 0) : (_0x23907b = _0x51841b));
    this.aClockwise === true &&
      !_0x578e1e &&
      (_0x23907b === _0x51841b ? (_0x23907b = -_0x51841b) : (_0x23907b = _0x23907b - _0x51841b));
    const _0x202653 = this.aStartAngle + _0x2ffe91 * _0x23907b;
    let _0x5089bd = this.aX + this.xRadius * Math.cos(_0x202653),
      _0x3c387c = this.aY + this.yRadius * Math.sin(_0x202653);
    if (this.aRotation !== 0) {
      const _0x54f1db = Math.cos(this.aRotation),
        _0xb4e717 = Math.sin(this.aRotation),
        _0x1d4c69 = _0x5089bd - this.aX,
        _0xdd2c4b = _0x3c387c - this.aY;
      ((_0x5089bd = _0x1d4c69 * _0x54f1db - _0xdd2c4b * _0xb4e717 + this.aX),
        (_0x3c387c = _0x1d4c69 * _0xb4e717 + _0xdd2c4b * _0x54f1db + this.aY));
    }
    return _0x188ed9.set(_0x5089bd, _0x3c387c);
  }
  ['copy'](_0x369549) {
    return (
      super.copy(_0x369549),
      (this.aX = _0x369549.aX),
      (this.aY = _0x369549.aY),
      (this.xRadius = _0x369549.xRadius),
      (this.yRadius = _0x369549.yRadius),
      (this.aStartAngle = _0x369549.aStartAngle),
      (this.aEndAngle = _0x369549.aEndAngle),
      (this.aClockwise = _0x369549.aClockwise),
      (this.aRotation = _0x369549.aRotation),
      this
    );
  }
  ['toJSON']() {
    const _0xef60b8 = super.toJSON();
    return (
      (_0xef60b8.aX = this.aX),
      (_0xef60b8.aY = this.aY),
      (_0xef60b8.xRadius = this.xRadius),
      (_0xef60b8.yRadius = this.yRadius),
      (_0xef60b8.aStartAngle = this.aStartAngle),
      (_0xef60b8.aEndAngle = this.aEndAngle),
      (_0xef60b8.aClockwise = this.aClockwise),
      (_0xef60b8.aRotation = this.aRotation),
      _0xef60b8
    );
  }
  ['fromJSON'](_0x428d98) {
    return (
      super.fromJSON(_0x428d98),
      (this.aX = _0x428d98.aX),
      (this.aY = _0x428d98.aY),
      (this.xRadius = _0x428d98.xRadius),
      (this.yRadius = _0x428d98.yRadius),
      (this.aStartAngle = _0x428d98.aStartAngle),
      (this.aEndAngle = _0x428d98.aEndAngle),
      (this.aClockwise = _0x428d98.aClockwise),
      (this.aRotation = _0x428d98.aRotation),
      this
    );
  }
}
class ArcCurve extends EllipseCurve {
  constructor(_0x143f64, _0x30dd34, _0xc16dc5, _0x2bbf28, _0x246d1c, _0x6fca0d) {
    (super(_0x143f64, _0x30dd34, _0xc16dc5, _0xc16dc5, _0x2bbf28, _0x246d1c, _0x6fca0d),
      (this.isArcCurve = true),
      (this.type = 'ArcCurve'));
  }
}
function CubicPoly() {
  let _0x31a51b = 0,
    _0x528923 = 0,
    _0x159bcf = 0,
    _0x38776b = 0;
  function _0x2b3228(_0x33f815, _0x29cea8, _0x4f3f6b, _0x5f5805) {
    ((_0x31a51b = _0x33f815),
      (_0x528923 = _0x4f3f6b),
      (_0x159bcf = -3 * _0x33f815 + 3 * _0x29cea8 - 2 * _0x4f3f6b - _0x5f5805),
      (_0x38776b = 2 * _0x33f815 - 2 * _0x29cea8 + _0x4f3f6b + _0x5f5805));
  }
  return {
    initCatmullRom: function (_0x2a8642, _0x32dd40, _0x5c8c07, _0x579383, _0x17e083) {
      _0x2b3228(
        _0x32dd40,
        _0x5c8c07,
        _0x17e083 * (_0x5c8c07 - _0x2a8642),
        _0x17e083 * (_0x579383 - _0x32dd40),
      );
    },
    initNonuniformCatmullRom: function (
      _0xb506dd,
      _0x4e012e,
      _0x573e1f,
      _0xaa7afc,
      _0x38ac98,
      _0xb5a80,
      _0x5b3914,
    ) {
      let _0x927907 =
          (_0x4e012e - _0xb506dd) / _0x38ac98 -
          (_0x573e1f - _0xb506dd) / (_0x38ac98 + _0xb5a80) +
          (_0x573e1f - _0x4e012e) / _0xb5a80,
        _0x308469 =
          (_0x573e1f - _0x4e012e) / _0xb5a80 -
          (_0xaa7afc - _0x4e012e) / (_0xb5a80 + _0x5b3914) +
          (_0xaa7afc - _0x573e1f) / _0x5b3914;
      ((_0x927907 *= _0xb5a80),
        (_0x308469 *= _0xb5a80),
        _0x2b3228(_0x4e012e, _0x573e1f, _0x927907, _0x308469));
    },
    calc: function (_0x4ad2ae) {
      const _0x31173c = _0x4ad2ae * _0x4ad2ae,
        _0x17769b = _0x31173c * _0x4ad2ae;
      return _0x31a51b + _0x528923 * _0x4ad2ae + _0x159bcf * _0x31173c + _0x38776b * _0x17769b;
    },
  };
}
const tmp = new Vector3(),
  px = new CubicPoly(),
  py = new CubicPoly(),
  pz = new CubicPoly();
class CatmullRomCurve3 extends Curve {
  constructor(_0x523b82 = [], _0x5421ad = false, _0x122232 = 'centripetal', _0x567108 = 0.5) {
    (super(),
      (this.isCatmullRomCurve3 = true),
      (this.type = 'CatmullRomCurve3'),
      (this.points = _0x523b82),
      (this.closed = _0x5421ad),
      (this.curveType = _0x122232),
      (this.tension = _0x567108));
  }
  ['getPoint'](_0x2bc7b6, _0x4b1585 = new Vector3()) {
    const _0x3a4a94 = _0x4b1585,
      _0x5eb541 = this.points,
      _0x1385f8 = _0x5eb541.length,
      _0x358da8 = (_0x1385f8 - (this.closed ? 0 : 1)) * _0x2bc7b6;
    let _0x373a51 = Math.floor(_0x358da8),
      _0x5d9e7c = _0x358da8 - _0x373a51;
    if (this.closed)
      _0x373a51 += _0x373a51 > 0 ? 0 : (Math.floor(Math.abs(_0x373a51) / _0x1385f8) + 1) * _0x1385f8;
    else _0x5d9e7c === 0 && _0x373a51 === _0x1385f8 - 1 && ((_0x373a51 = _0x1385f8 - 2), (_0x5d9e7c = 1));
    let _0x599a9b, _0x4521a4;
    this.closed || _0x373a51 > 0
      ? (_0x599a9b = _0x5eb541[(_0x373a51 - 1) % _0x1385f8])
      : (tmp.subVectors(_0x5eb541[0], _0x5eb541[1]).add(_0x5eb541[0]), (_0x599a9b = tmp));
    const _0xb4604e = _0x5eb541[_0x373a51 % _0x1385f8],
      _0x26404b = _0x5eb541[(_0x373a51 + 1) % _0x1385f8];
    this.closed || _0x373a51 + 2 < _0x1385f8
      ? (_0x4521a4 = _0x5eb541[(_0x373a51 + 2) % _0x1385f8])
      : (tmp.subVectors(_0x5eb541[_0x1385f8 - 1], _0x5eb541[_0x1385f8 - 2]).add(_0x5eb541[_0x1385f8 - 1]),
        (_0x4521a4 = tmp));
    if (this.curveType === 'centripetal' || this.curveType === 'chordal') {
      const _0x4b9446 = this.curveType === 'chordal' ? 0.5 : 0.25;
      let _0x5c0e8b = Math.pow(_0x599a9b.distanceToSquared(_0xb4604e), _0x4b9446),
        _0x9bb481 = Math.pow(_0xb4604e.distanceToSquared(_0x26404b), _0x4b9446),
        _0x113eda = Math.pow(_0x26404b.distanceToSquared(_0x4521a4), _0x4b9446);
      if (_0x9bb481 < 0.0001) _0x9bb481 = 1;
      if (_0x5c0e8b < 0.0001) _0x5c0e8b = _0x9bb481;
      if (_0x113eda < 0.0001) _0x113eda = _0x9bb481;
      (px.initNonuniformCatmullRom(
        _0x599a9b.x,
        _0xb4604e.x,
        _0x26404b.x,
        _0x4521a4.x,
        _0x5c0e8b,
        _0x9bb481,
        _0x113eda,
      ),
        py.initNonuniformCatmullRom(
          _0x599a9b.y,
          _0xb4604e.y,
          _0x26404b.y,
          _0x4521a4.y,
          _0x5c0e8b,
          _0x9bb481,
          _0x113eda,
        ),
        pz.initNonuniformCatmullRom(
          _0x599a9b.z,
          _0xb4604e.z,
          _0x26404b.z,
          _0x4521a4.z,
          _0x5c0e8b,
          _0x9bb481,
          _0x113eda,
        ));
    } else
      this.curveType === 'catmullrom' &&
        (px.initCatmullRom(_0x599a9b.x, _0xb4604e.x, _0x26404b.x, _0x4521a4.x, this.tension),
        py.initCatmullRom(_0x599a9b.y, _0xb4604e.y, _0x26404b.y, _0x4521a4.y, this.tension),
        pz.initCatmullRom(_0x599a9b.z, _0xb4604e.z, _0x26404b.z, _0x4521a4.z, this.tension));
    return (_0x3a4a94.set(px.calc(_0x5d9e7c), py.calc(_0x5d9e7c), pz.calc(_0x5d9e7c)), _0x3a4a94);
  }
  ['copy'](_0x4fe59a) {
    (super.copy(_0x4fe59a), (this.points = []));
    for (let _0x22e093 = 0, _0x33b9c9 = _0x4fe59a.points.length; _0x22e093 < _0x33b9c9; _0x22e093++) {
      const _0x5e67e3 = _0x4fe59a.points[_0x22e093];
      this.points.push(_0x5e67e3.clone());
    }
    return (
      (this.closed = _0x4fe59a.closed),
      (this.curveType = _0x4fe59a.curveType),
      (this.tension = _0x4fe59a.tension),
      this
    );
  }
  ['toJSON']() {
    const _0x4a5fd8 = super.toJSON();
    _0x4a5fd8.points = [];
    for (let _0x2acca7 = 0, _0x1b588d = this.points.length; _0x2acca7 < _0x1b588d; _0x2acca7++) {
      const _0x7df5cb = this.points[_0x2acca7];
      _0x4a5fd8.points.push(_0x7df5cb.toArray());
    }
    return (
      (_0x4a5fd8.closed = this.closed),
      (_0x4a5fd8.curveType = this.curveType),
      (_0x4a5fd8.tension = this.tension),
      _0x4a5fd8
    );
  }
  ['fromJSON'](_0x10fd59) {
    (super.fromJSON(_0x10fd59), (this.points = []));
    for (let _0x1b22c5 = 0, _0x416d68 = _0x10fd59.points.length; _0x1b22c5 < _0x416d68; _0x1b22c5++) {
      const _0x2d154a = _0x10fd59.points[_0x1b22c5];
      this.points.push(new Vector3().fromArray(_0x2d154a));
    }
    return (
      (this.closed = _0x10fd59.closed),
      (this.curveType = _0x10fd59.curveType),
      (this.tension = _0x10fd59.tension),
      this
    );
  }
}
function CatmullRom(_0x2aea73, _0x355b5f, _0x348291, _0x9e6ff1, _0x5e6b0d) {
  const _0x44e527 = (_0x9e6ff1 - _0x355b5f) * 0.5,
    _0x5aa2b6 = (_0x5e6b0d - _0x348291) * 0.5,
    _0x3c18c7 = _0x2aea73 * _0x2aea73,
    _0x2cd467 = _0x2aea73 * _0x3c18c7;
  return (
    (2 * _0x348291 - 2 * _0x9e6ff1 + _0x44e527 + _0x5aa2b6) * _0x2cd467 +
    (-3 * _0x348291 + 3 * _0x9e6ff1 - 2 * _0x44e527 - _0x5aa2b6) * _0x3c18c7 +
    _0x44e527 * _0x2aea73 +
    _0x348291
  );
}
function QuadraticBezierP0(_0x54c595, _0x5165ed) {
  const _0x2a9700 = 1 - _0x54c595;
  return _0x2a9700 * _0x2a9700 * _0x5165ed;
}
function QuadraticBezierP1(_0x259fa5, _0x5ea828) {
  return 2 * (1 - _0x259fa5) * _0x259fa5 * _0x5ea828;
}
function QuadraticBezierP2(_0x311168, _0x595fff) {
  return _0x311168 * _0x311168 * _0x595fff;
}
function QuadraticBezier(_0x4d8da3, _0x50db42, _0x43f70e, _0xf837d5) {
  return (
    QuadraticBezierP0(_0x4d8da3, _0x50db42) +
    QuadraticBezierP1(_0x4d8da3, _0x43f70e) +
    QuadraticBezierP2(_0x4d8da3, _0xf837d5)
  );
}
function CubicBezierP0(_0x471597, _0x3c69cd) {
  const _0x26be13 = 1 - _0x471597;
  return _0x26be13 * _0x26be13 * _0x26be13 * _0x3c69cd;
}
function CubicBezierP1(_0x15b795, _0x105d66) {
  const _0x4dbdca = 1 - _0x15b795;
  return 3 * _0x4dbdca * _0x4dbdca * _0x15b795 * _0x105d66;
}
function CubicBezierP2(_0x3ef3b8, _0x335bae) {
  return 3 * (1 - _0x3ef3b8) * _0x3ef3b8 * _0x3ef3b8 * _0x335bae;
}
function CubicBezierP3(_0x5912b9, _0x9d297b) {
  return _0x5912b9 * _0x5912b9 * _0x5912b9 * _0x9d297b;
}
function CubicBezier(_0x1eb6d1, _0x211c4c, _0x105b04, _0x1e35dd, _0xb66e8b) {
  return (
    CubicBezierP0(_0x1eb6d1, _0x211c4c) +
    CubicBezierP1(_0x1eb6d1, _0x105b04) +
    CubicBezierP2(_0x1eb6d1, _0x1e35dd) +
    CubicBezierP3(_0x1eb6d1, _0xb66e8b)
  );
}
class CubicBezierCurve extends Curve {
  constructor(
    _0x4e790e = new Vector2(),
    _0x5f4b28 = new Vector2(),
    _0x51a9ce = new Vector2(),
    _0x26dd89 = new Vector2(),
  ) {
    (super(),
      (this.isCubicBezierCurve = true),
      (this.type = 'CubicBezierCurve'),
      (this.v0 = _0x4e790e),
      (this.v1 = _0x5f4b28),
      (this.v2 = _0x51a9ce),
      (this.v3 = _0x26dd89));
  }
  ['getPoint'](_0x53ea24, _0x13cf21 = new Vector2()) {
    const _0xf59e8f = _0x13cf21,
      _0x496f1a = this.v0,
      _0x571f5d = this.v1,
      _0x30d35b = this.v2,
      _0x24f591 = this.v3;
    return (
      _0xf59e8f.set(
        CubicBezier(_0x53ea24, _0x496f1a.x, _0x571f5d.x, _0x30d35b.x, _0x24f591.x),
        CubicBezier(_0x53ea24, _0x496f1a.y, _0x571f5d.y, _0x30d35b.y, _0x24f591.y),
      ),
      _0xf59e8f
    );
  }
  ['copy'](_0x54c5d6) {
    return (
      super.copy(_0x54c5d6),
      this.v0.copy(_0x54c5d6.v0),
      this.v1.copy(_0x54c5d6.v1),
      this.v2.copy(_0x54c5d6.v2),
      this.v3.copy(_0x54c5d6.v3),
      this
    );
  }
  ['toJSON']() {
    const _0x3293c2 = super.toJSON();
    return (
      (_0x3293c2.v0 = this.v0.toArray()),
      (_0x3293c2.v1 = this.v1.toArray()),
      (_0x3293c2.v2 = this.v2.toArray()),
      (_0x3293c2.v3 = this.v3.toArray()),
      _0x3293c2
    );
  }
  ['fromJSON'](_0x5aa7fb) {
    return (
      super.fromJSON(_0x5aa7fb),
      this.v0.fromArray(_0x5aa7fb.v0),
      this.v1.fromArray(_0x5aa7fb.v1),
      this.v2.fromArray(_0x5aa7fb.v2),
      this.v3.fromArray(_0x5aa7fb.v3),
      this
    );
  }
}
class CubicBezierCurve3 extends Curve {
  constructor(
    _0x46980a = new Vector3(),
    _0x434bae = new Vector3(),
    _0x263709 = new Vector3(),
    _0x26d086 = new Vector3(),
  ) {
    (super(),
      (this.isCubicBezierCurve3 = true),
      (this.type = 'CubicBezierCurve3'),
      (this.v0 = _0x46980a),
      (this.v1 = _0x434bae),
      (this.v2 = _0x263709),
      (this.v3 = _0x26d086));
  }
  ['getPoint'](_0x2488bb, _0x530f77 = new Vector3()) {
    const _0x19a1c4 = _0x530f77,
      _0x5af5fb = this.v0,
      _0x243510 = this.v1,
      _0x2912e0 = this.v2,
      _0x2f8447 = this.v3;
    return (
      _0x19a1c4.set(
        CubicBezier(_0x2488bb, _0x5af5fb.x, _0x243510.x, _0x2912e0.x, _0x2f8447.x),
        CubicBezier(_0x2488bb, _0x5af5fb.y, _0x243510.y, _0x2912e0.y, _0x2f8447.y),
        CubicBezier(_0x2488bb, _0x5af5fb.z, _0x243510.z, _0x2912e0.z, _0x2f8447.z),
      ),
      _0x19a1c4
    );
  }
  ['copy'](_0x3bb892) {
    return (
      super.copy(_0x3bb892),
      this.v0.copy(_0x3bb892.v0),
      this.v1.copy(_0x3bb892.v1),
      this.v2.copy(_0x3bb892.v2),
      this.v3.copy(_0x3bb892.v3),
      this
    );
  }
  ['toJSON']() {
    const _0x3bb65e = super.toJSON();
    return (
      (_0x3bb65e.v0 = this.v0.toArray()),
      (_0x3bb65e.v1 = this.v1.toArray()),
      (_0x3bb65e.v2 = this.v2.toArray()),
      (_0x3bb65e.v3 = this.v3.toArray()),
      _0x3bb65e
    );
  }
  ['fromJSON'](_0x338083) {
    return (
      super.fromJSON(_0x338083),
      this.v0.fromArray(_0x338083.v0),
      this.v1.fromArray(_0x338083.v1),
      this.v2.fromArray(_0x338083.v2),
      this.v3.fromArray(_0x338083.v3),
      this
    );
  }
}
class LineCurve extends Curve {
  constructor(_0x166ff0 = new Vector2(), _0x3774ce = new Vector2()) {
    (super(),
      (this.isLineCurve = true),
      (this.type = 'LineCurve'),
      (this.v1 = _0x166ff0),
      (this.v2 = _0x3774ce));
  }
  ['getPoint'](_0x37bdfb, _0x20dbde = new Vector2()) {
    const _0x1f7f04 = _0x20dbde;
    return (
      _0x37bdfb === 1
        ? _0x1f7f04.copy(this.v2)
        : (_0x1f7f04.copy(this.v2).sub(this.v1), _0x1f7f04.multiplyScalar(_0x37bdfb).add(this.v1)),
      _0x1f7f04
    );
  }
  ['getPointAt'](_0x176474, _0x47e004) {
    return this.getPoint(_0x176474, _0x47e004);
  }
  ['getTangent'](_0x94c4f4, _0x3303bf = new Vector2()) {
    return _0x3303bf.subVectors(this.v2, this.v1).normalize();
  }
  ['getTangentAt'](_0x1a0c03, _0x22623d) {
    return this.getTangent(_0x1a0c03, _0x22623d);
  }
  ['copy'](_0x2662b6) {
    return (super.copy(_0x2662b6), this.v1.copy(_0x2662b6.v1), this.v2.copy(_0x2662b6.v2), this);
  }
  ['toJSON']() {
    const _0x5477c1 = super.toJSON();
    return ((_0x5477c1.v1 = this.v1.toArray()), (_0x5477c1.v2 = this.v2.toArray()), _0x5477c1);
  }
  ['fromJSON'](_0x510f8c) {
    return (
      super.fromJSON(_0x510f8c),
      this.v1.fromArray(_0x510f8c.v1),
      this.v2.fromArray(_0x510f8c.v2),
      this
    );
  }
}
class LineCurve3 extends Curve {
  constructor(_0x3293a3 = new Vector3(), _0x2e078c = new Vector3()) {
    (super(),
      (this.isLineCurve3 = true),
      (this.type = 'LineCurve3'),
      (this.v1 = _0x3293a3),
      (this.v2 = _0x2e078c));
  }
  ['getPoint'](_0x24668a, _0xcf6fcf = new Vector3()) {
    const _0xa8f3a1 = _0xcf6fcf;
    return (
      _0x24668a === 1
        ? _0xa8f3a1.copy(this.v2)
        : (_0xa8f3a1.copy(this.v2).sub(this.v1), _0xa8f3a1.multiplyScalar(_0x24668a).add(this.v1)),
      _0xa8f3a1
    );
  }
  ['getPointAt'](_0x15a9a3, _0x3df348) {
    return this.getPoint(_0x15a9a3, _0x3df348);
  }
  ['getTangent'](_0x1546d0, _0xec5c84 = new Vector3()) {
    return _0xec5c84.subVectors(this.v2, this.v1).normalize();
  }
  ['getTangentAt'](_0x563c0f, _0x1ad5d3) {
    return this.getTangent(_0x563c0f, _0x1ad5d3);
  }
  ['copy'](_0x51fd0b) {
    return (super.copy(_0x51fd0b), this.v1.copy(_0x51fd0b.v1), this.v2.copy(_0x51fd0b.v2), this);
  }
  ['toJSON']() {
    const _0x4d38c8 = super.toJSON();
    return ((_0x4d38c8.v1 = this.v1.toArray()), (_0x4d38c8.v2 = this.v2.toArray()), _0x4d38c8);
  }
  ['fromJSON'](_0x5034d9) {
    return (
      super.fromJSON(_0x5034d9),
      this.v1.fromArray(_0x5034d9.v1),
      this.v2.fromArray(_0x5034d9.v2),
      this
    );
  }
}
class QuadraticBezierCurve extends Curve {
  constructor(_0x380796 = new Vector2(), _0x9a7db3 = new Vector2(), _0x15a3a7 = new Vector2()) {
    (super(),
      (this.isQuadraticBezierCurve = true),
      (this.type = 'QuadraticBezierCurve'),
      (this.v0 = _0x380796),
      (this.v1 = _0x9a7db3),
      (this.v2 = _0x15a3a7));
  }
  ['getPoint'](_0x587eea, _0x54417b = new Vector2()) {
    const _0x2ca825 = _0x54417b,
      _0x1aa7b8 = this.v0,
      _0x3ec373 = this.v1,
      _0xe36bd6 = this.v2;
    return (
      _0x2ca825.set(
        QuadraticBezier(_0x587eea, _0x1aa7b8.x, _0x3ec373.x, _0xe36bd6.x),
        QuadraticBezier(_0x587eea, _0x1aa7b8.y, _0x3ec373.y, _0xe36bd6.y),
      ),
      _0x2ca825
    );
  }
  ['copy'](_0x37babf) {
    return (
      super.copy(_0x37babf),
      this.v0.copy(_0x37babf.v0),
      this.v1.copy(_0x37babf.v1),
      this.v2.copy(_0x37babf.v2),
      this
    );
  }
  ['toJSON']() {
    const _0x43dc8d = super.toJSON();
    return (
      (_0x43dc8d.v0 = this.v0.toArray()),
      (_0x43dc8d.v1 = this.v1.toArray()),
      (_0x43dc8d.v2 = this.v2.toArray()),
      _0x43dc8d
    );
  }
  ['fromJSON'](_0x48c16e) {
    return (
      super.fromJSON(_0x48c16e),
      this.v0.fromArray(_0x48c16e.v0),
      this.v1.fromArray(_0x48c16e.v1),
      this.v2.fromArray(_0x48c16e.v2),
      this
    );
  }
}
class QuadraticBezierCurve3 extends Curve {
  constructor(_0x2d8280 = new Vector3(), _0x1f2449 = new Vector3(), _0x37c22b = new Vector3()) {
    (super(),
      (this.isQuadraticBezierCurve3 = true),
      (this.type = 'QuadraticBezierCurve3'),
      (this.v0 = _0x2d8280),
      (this.v1 = _0x1f2449),
      (this.v2 = _0x37c22b));
  }
  ['getPoint'](_0x40fc9c, _0x29b9a9 = new Vector3()) {
    const _0x243c40 = _0x29b9a9,
      _0x48e59d = this.v0,
      _0x1c7284 = this.v1,
      _0x3e719e = this.v2;
    return (
      _0x243c40.set(
        QuadraticBezier(_0x40fc9c, _0x48e59d.x, _0x1c7284.x, _0x3e719e.x),
        QuadraticBezier(_0x40fc9c, _0x48e59d.y, _0x1c7284.y, _0x3e719e.y),
        QuadraticBezier(_0x40fc9c, _0x48e59d.z, _0x1c7284.z, _0x3e719e.z),
      ),
      _0x243c40
    );
  }
  ['copy'](_0x5cc049) {
    return (
      super.copy(_0x5cc049),
      this.v0.copy(_0x5cc049.v0),
      this.v1.copy(_0x5cc049.v1),
      this.v2.copy(_0x5cc049.v2),
      this
    );
  }
  ['toJSON']() {
    const _0x585159 = super.toJSON();
    return (
      (_0x585159.v0 = this.v0.toArray()),
      (_0x585159.v1 = this.v1.toArray()),
      (_0x585159.v2 = this.v2.toArray()),
      _0x585159
    );
  }
  ['fromJSON'](_0x2db972) {
    return (
      super.fromJSON(_0x2db972),
      this.v0.fromArray(_0x2db972.v0),
      this.v1.fromArray(_0x2db972.v1),
      this.v2.fromArray(_0x2db972.v2),
      this
    );
  }
}
class SplineCurve extends Curve {
  constructor(_0x3f7295 = []) {
    (super(), (this.isSplineCurve = true), (this.type = 'SplineCurve'), (this.points = _0x3f7295));
  }
  ['getPoint'](_0x4e0120, _0x3a6e08 = new Vector2()) {
    const _0x3a64cd = _0x3a6e08,
      _0x9f5cfa = this.points,
      _0xcd4fae = (_0x9f5cfa.length - 1) * _0x4e0120,
      _0x19e6a9 = Math.floor(_0xcd4fae),
      _0x5dc62e = _0xcd4fae - _0x19e6a9,
      _0x59144d = _0x9f5cfa[_0x19e6a9 === 0 ? _0x19e6a9 : _0x19e6a9 - 1],
      _0x739ff4 = _0x9f5cfa[_0x19e6a9],
      _0x11bea6 = _0x9f5cfa[_0x19e6a9 > _0x9f5cfa.length - 2 ? _0x9f5cfa.length - 1 : _0x19e6a9 + 1],
      _0x2c0397 = _0x9f5cfa[_0x19e6a9 > _0x9f5cfa.length - 3 ? _0x9f5cfa.length - 1 : _0x19e6a9 + 2];
    return (
      _0x3a64cd.set(
        CatmullRom(_0x5dc62e, _0x59144d.x, _0x739ff4.x, _0x11bea6.x, _0x2c0397.x),
        CatmullRom(_0x5dc62e, _0x59144d.y, _0x739ff4.y, _0x11bea6.y, _0x2c0397.y),
      ),
      _0x3a64cd
    );
  }
  ['copy'](_0x120ec1) {
    (super.copy(_0x120ec1), (this.points = []));
    for (let _0x3d0ab6 = 0, _0x50a00a = _0x120ec1.points.length; _0x3d0ab6 < _0x50a00a; _0x3d0ab6++) {
      const _0x62b8bb = _0x120ec1.points[_0x3d0ab6];
      this.points.push(_0x62b8bb.clone());
    }
    return this;
  }
  ['toJSON']() {
    const _0x4f99bf = super.toJSON();
    _0x4f99bf.points = [];
    for (let _0x27b7c9 = 0, _0x37484b = this.points.length; _0x27b7c9 < _0x37484b; _0x27b7c9++) {
      const _0x373fef = this.points[_0x27b7c9];
      _0x4f99bf.points.push(_0x373fef.toArray());
    }
    return _0x4f99bf;
  }
  ['fromJSON'](_0x4ccf46) {
    (super.fromJSON(_0x4ccf46), (this.points = []));
    for (let _0x2bb7a3 = 0, _0x357297 = _0x4ccf46.points.length; _0x2bb7a3 < _0x357297; _0x2bb7a3++) {
      const _0x436594 = _0x4ccf46.points[_0x2bb7a3];
      this.points.push(new Vector2().fromArray(_0x436594));
    }
    return this;
  }
}
var Curves = Object.freeze({
  __proto__: null,
  ArcCurve: ArcCurve,
  CatmullRomCurve3: CatmullRomCurve3,
  CubicBezierCurve: CubicBezierCurve,
  CubicBezierCurve3: CubicBezierCurve3,
  EllipseCurve: EllipseCurve,
  LineCurve: LineCurve,
  LineCurve3: LineCurve3,
  QuadraticBezierCurve: QuadraticBezierCurve,
  QuadraticBezierCurve3: QuadraticBezierCurve3,
  SplineCurve: SplineCurve,
});
class CurvePath extends Curve {
  constructor() {
    (super(), (this.type = 'CurvePath'), (this.curves = []), (this.autoClose = false));
  }
  ['add'](_0x2fa0f7) {
    this.curves.push(_0x2fa0f7);
  }
  ['closePath']() {
    const _0x4dd963 = this.curves[0].getPoint(0),
      _0x1ca829 = this.curves[this.curves.length - 1].getPoint(1);
    if (!_0x4dd963.equals(_0x1ca829)) {
      const _0x12bf93 = _0x4dd963.isVector2 === true ? 'LineCurve' : 'LineCurve3';
      this.curves.push(new Curves[_0x12bf93](_0x1ca829, _0x4dd963));
    }
    return this;
  }
  ['getPoint'](_0x2dccea, _0x1f85a3) {
    const _0x5e465a = _0x2dccea * this.getLength(),
      _0x111cb2 = this.getCurveLengths();
    let _0x135f34 = 0;
    while (_0x135f34 < _0x111cb2.length) {
      if (_0x111cb2[_0x135f34] >= _0x5e465a) {
        const _0x1d1070 = _0x111cb2[_0x135f34] - _0x5e465a,
          _0x8f9f17 = this.curves[_0x135f34],
          _0x1ea00c = _0x8f9f17.getLength(),
          _0x3a87eb = _0x1ea00c === 0 ? 0 : 1 - _0x1d1070 / _0x1ea00c;
        return _0x8f9f17.getPointAt(_0x3a87eb, _0x1f85a3);
      }
      _0x135f34++;
    }
    return null;
  }
  ['getLength']() {
    const _0x2b2efe = this.getCurveLengths();
    return _0x2b2efe[_0x2b2efe.length - 1];
  }
  ['updateArcLengths']() {
    ((this.needsUpdate = true), (this.cacheLengths = null), this.getCurveLengths());
  }
  ['getCurveLengths']() {
    if (this.cacheLengths && this.cacheLengths.length === this.curves.length) return this.cacheLengths;
    const _0x2331e7 = [];
    let _0x295f15 = 0;
    for (let _0x24e653 = 0, _0x64cbe2 = this.curves.length; _0x24e653 < _0x64cbe2; _0x24e653++) {
      ((_0x295f15 += this.curves[_0x24e653].getLength()), _0x2331e7.push(_0x295f15));
    }
    return ((this.cacheLengths = _0x2331e7), _0x2331e7);
  }
  ['getSpacedPoints'](_0x3dc031 = 40) {
    const _0x52adaf = [];
    for (let _0xdae5d2 = 0; _0xdae5d2 <= _0x3dc031; _0xdae5d2++) {
      _0x52adaf.push(this.getPoint(_0xdae5d2 / _0x3dc031));
    }
    return (this.autoClose && _0x52adaf.push(_0x52adaf[0]), _0x52adaf);
  }
  ['getPoints'](_0x35c7e9 = 12) {
    const _0x45ac67 = [];
    let _0x3c6256;
    for (let _0x211eb8 = 0, _0x543738 = this.curves; _0x211eb8 < _0x543738.length; _0x211eb8++) {
      const _0x4d79f0 = _0x543738[_0x211eb8],
        _0x3abbd3 = _0x4d79f0.isEllipseCurve
          ? _0x35c7e9 * 2
          : _0x4d79f0.isLineCurve || _0x4d79f0.isLineCurve3
            ? 1
            : _0x4d79f0.isSplineCurve
              ? _0x35c7e9 * _0x4d79f0.points.length
              : _0x35c7e9,
        _0x37ff91 = _0x4d79f0.getPoints(_0x3abbd3);
      for (let _0x1f8a88 = 0; _0x1f8a88 < _0x37ff91.length; _0x1f8a88++) {
        const _0x26d1d6 = _0x37ff91[_0x1f8a88];
        if (_0x3c6256 && _0x3c6256.equals(_0x26d1d6)) continue;
        (_0x45ac67.push(_0x26d1d6), (_0x3c6256 = _0x26d1d6));
      }
    }
    return (
      this.autoClose &&
        _0x45ac67.length > 1 &&
        !_0x45ac67[_0x45ac67.length - 1].equals(_0x45ac67[0]) &&
        _0x45ac67.push(_0x45ac67[0]),
      _0x45ac67
    );
  }
  ['copy'](_0x4d720f) {
    (super.copy(_0x4d720f), (this.curves = []));
    for (let _0x24f36d = 0, _0x2247ff = _0x4d720f.curves.length; _0x24f36d < _0x2247ff; _0x24f36d++) {
      const _0x4af77e = _0x4d720f.curves[_0x24f36d];
      this.curves.push(_0x4af77e.clone());
    }
    return ((this.autoClose = _0x4d720f.autoClose), this);
  }
  ['toJSON']() {
    const _0xd7f13f = super.toJSON();
    ((_0xd7f13f.autoClose = this.autoClose), (_0xd7f13f.curves = []));
    for (let _0x1c5098 = 0, _0x42b19c = this.curves.length; _0x1c5098 < _0x42b19c; _0x1c5098++) {
      const _0x150791 = this.curves[_0x1c5098];
      _0xd7f13f.curves.push(_0x150791.toJSON());
    }
    return _0xd7f13f;
  }
  ['fromJSON'](_0x384974) {
    (super.fromJSON(_0x384974), (this.autoClose = _0x384974.autoClose), (this.curves = []));
    for (let _0x5c38cd = 0, _0x8de52 = _0x384974.curves.length; _0x5c38cd < _0x8de52; _0x5c38cd++) {
      const _0xbf5e8c = _0x384974.curves[_0x5c38cd];
      this.curves.push(new Curves[_0xbf5e8c['type']]().fromJSON(_0xbf5e8c));
    }
    return this;
  }
}
class Path extends CurvePath {
  constructor(_0x20b358) {
    (super(),
      (this.type = 'Path'),
      (this.currentPoint = new Vector2()),
      _0x20b358 && this.setFromPoints(_0x20b358));
  }
  ['setFromPoints'](_0x23bb75) {
    this.moveTo(_0x23bb75[0].x, _0x23bb75[0].y);
    for (let _0x554ade = 1, _0x2dd2da = _0x23bb75.length; _0x554ade < _0x2dd2da; _0x554ade++) {
      this.lineTo(_0x23bb75[_0x554ade].x, _0x23bb75[_0x554ade].y);
    }
    return this;
  }
  ['moveTo'](_0x1900a7, _0x5b6df9) {
    return (this.currentPoint.set(_0x1900a7, _0x5b6df9), this);
  }
  ['lineTo'](_0x226468, _0x516091) {
    const _0x3189d1 = new LineCurve(this.currentPoint.clone(), new Vector2(_0x226468, _0x516091));
    return (this.curves.push(_0x3189d1), this.currentPoint.set(_0x226468, _0x516091), this);
  }
  ['quadraticCurveTo'](_0x5847aa, _0xbfead9, _0x449520, _0x763774) {
    const _0x4a43dc = new QuadraticBezierCurve(
      this.currentPoint.clone(),
      new Vector2(_0x5847aa, _0xbfead9),
      new Vector2(_0x449520, _0x763774),
    );
    return (this.curves.push(_0x4a43dc), this.currentPoint.set(_0x449520, _0x763774), this);
  }
  ['bezierCurveTo'](_0x37dd87, _0x495941, _0x3f1859, _0x4fa675, _0x4176c8, _0x20cb3d) {
    const _0x296cd5 = new CubicBezierCurve(
      this.currentPoint.clone(),
      new Vector2(_0x37dd87, _0x495941),
      new Vector2(_0x3f1859, _0x4fa675),
      new Vector2(_0x4176c8, _0x20cb3d),
    );
    return (this.curves.push(_0x296cd5), this.currentPoint.set(_0x4176c8, _0x20cb3d), this);
  }
  ['splineThru'](_0x13f428) {
    const _0x3aa843 = [this.currentPoint.clone()].concat(_0x13f428),
      _0x5092a9 = new SplineCurve(_0x3aa843);
    return (this.curves.push(_0x5092a9), this.currentPoint.copy(_0x13f428[_0x13f428.length - 1]), this);
  }
  ['arc'](_0x11525a, _0x522ee0, _0x2f17a8, _0x1c7ba1, _0x7cb6c, _0x1897fc) {
    const _0x577a33 = this.currentPoint.x,
      _0x4ec904 = this.currentPoint.y;
    return (
      this.absarc(_0x11525a + _0x577a33, _0x522ee0 + _0x4ec904, _0x2f17a8, _0x1c7ba1, _0x7cb6c, _0x1897fc),
      this
    );
  }
  ['absarc'](_0x182b1b, _0x868b68, _0x12de94, _0x16d7d8, _0x441bf5, _0x4ea7de) {
    return (
      this.absellipse(_0x182b1b, _0x868b68, _0x12de94, _0x12de94, _0x16d7d8, _0x441bf5, _0x4ea7de),
      this
    );
  }
  ['ellipse'](_0x3f4120, _0x5bb5ab, _0x4accc6, _0x409fe6, _0xf42f90, _0x335bc9, _0x3d25b9, _0x538c39) {
    const _0x50d01c = this.currentPoint.x,
      _0x5b19d7 = this.currentPoint.y;
    return (
      this.absellipse(
        _0x3f4120 + _0x50d01c,
        _0x5bb5ab + _0x5b19d7,
        _0x4accc6,
        _0x409fe6,
        _0xf42f90,
        _0x335bc9,
        _0x3d25b9,
        _0x538c39,
      ),
      this
    );
  }
  ['absellipse'](_0x318ab1, _0xef98c0, _0x387863, _0x41755a, _0xab10e3, _0xd5d61d, _0x3d056a, _0x1dfe35) {
    const _0x1752b0 = new EllipseCurve(
      _0x318ab1,
      _0xef98c0,
      _0x387863,
      _0x41755a,
      _0xab10e3,
      _0xd5d61d,
      _0x3d056a,
      _0x1dfe35,
    );
    if (this.curves.length > 0) {
      const _0x129f26 = _0x1752b0.getPoint(0);
      !_0x129f26.equals(this.currentPoint) && this.lineTo(_0x129f26.x, _0x129f26.y);
    }
    this.curves.push(_0x1752b0);
    const _0x384a48 = _0x1752b0.getPoint(1);
    return (this.currentPoint.copy(_0x384a48), this);
  }
  ['copy'](_0x295d8d) {
    return (super.copy(_0x295d8d), this.currentPoint.copy(_0x295d8d.currentPoint), this);
  }
  ['toJSON']() {
    const _0x10cbda = super.toJSON();
    return ((_0x10cbda.currentPoint = this.currentPoint.toArray()), _0x10cbda);
  }
  ['fromJSON'](_0x299149) {
    return (super.fromJSON(_0x299149), this.currentPoint.fromArray(_0x299149.currentPoint), this);
  }
}
class Shape extends Path {
  constructor(_0x198621) {
    (super(_0x198621), (this.uuid = generateUUID()), (this.type = 'Shape'), (this.holes = []));
  }
  ['getPointsHoles'](_0x335a68) {
    const _0x55f58d = [];
    for (let _0x1106c4 = 0, _0x2debb3 = this.holes.length; _0x1106c4 < _0x2debb3; _0x1106c4++) {
      _0x55f58d[_0x1106c4] = this.holes[_0x1106c4].getPoints(_0x335a68);
    }
    return _0x55f58d;
  }
  ['extractPoints'](_0x3b1512) {
    return { shape: this.getPoints(_0x3b1512), holes: this.getPointsHoles(_0x3b1512) };
  }
  ['copy'](_0x2bc6db) {
    (super.copy(_0x2bc6db), (this.holes = []));
    for (let _0x375ed7 = 0, _0x373b35 = _0x2bc6db.holes.length; _0x375ed7 < _0x373b35; _0x375ed7++) {
      const _0x35de74 = _0x2bc6db.holes[_0x375ed7];
      this.holes.push(_0x35de74.clone());
    }
    return this;
  }
  ['toJSON']() {
    const _0x5c4880 = super.toJSON();
    ((_0x5c4880.uuid = this.uuid), (_0x5c4880.holes = []));
    for (let _0x7f680 = 0, _0x14467d = this.holes.length; _0x7f680 < _0x14467d; _0x7f680++) {
      const _0x51c387 = this.holes[_0x7f680];
      _0x5c4880.holes.push(_0x51c387.toJSON());
    }
    return _0x5c4880;
  }
  ['fromJSON'](_0x1f32f4) {
    (super.fromJSON(_0x1f32f4), (this.uuid = _0x1f32f4.uuid), (this.holes = []));
    for (let _0x29a68e = 0, _0x464f62 = _0x1f32f4.holes.length; _0x29a68e < _0x464f62; _0x29a68e++) {
      const _0x585afc = _0x1f32f4.holes[_0x29a68e];
      this.holes.push(new Path().fromJSON(_0x585afc));
    }
    return this;
  }
}
function earcut(_0x5b59f7, _0x1e28b3, _0x413bdf = 2) {
  const _0x536ae4 = _0x1e28b3 && _0x1e28b3.length,
    _0x267a7d = _0x536ae4 ? _0x1e28b3[0] * _0x413bdf : _0x5b59f7.length;
  let _0x88c7cf = linkedList(_0x5b59f7, 0, _0x267a7d, _0x413bdf, true);
  const _0x3a5fb5 = [];
  if (!_0x88c7cf || _0x88c7cf.next === _0x88c7cf.prev) return _0x3a5fb5;
  let _0x10de06, _0x1bb125, _0x15397f;
  if (_0x536ae4) _0x88c7cf = eliminateHoles(_0x5b59f7, _0x1e28b3, _0x88c7cf, _0x413bdf);
  if (_0x5b59f7.length > 80 * _0x413bdf) {
    ((_0x10de06 = Infinity), (_0x1bb125 = Infinity));
    let _0x342c4c = -Infinity,
      _0x578bf7 = -Infinity;
    for (let _0x47a27e = _0x413bdf; _0x47a27e < _0x267a7d; _0x47a27e += _0x413bdf) {
      const _0x2214bb = _0x5b59f7[_0x47a27e],
        _0xfa0f57 = _0x5b59f7[_0x47a27e + 1];
      if (_0x2214bb < _0x10de06) _0x10de06 = _0x2214bb;
      if (_0xfa0f57 < _0x1bb125) _0x1bb125 = _0xfa0f57;
      if (_0x2214bb > _0x342c4c) _0x342c4c = _0x2214bb;
      if (_0xfa0f57 > _0x578bf7) _0x578bf7 = _0xfa0f57;
    }
    ((_0x15397f = Math.max(_0x342c4c - _0x10de06, _0x578bf7 - _0x1bb125)),
      (_0x15397f = _0x15397f !== 0 ? 0x7fff / _0x15397f : 0));
  }
  return (earcutLinked(_0x88c7cf, _0x3a5fb5, _0x413bdf, _0x10de06, _0x1bb125, _0x15397f, 0), _0x3a5fb5);
}
function linkedList(_0x5f279c, _0x51f4fa, _0x31b3af, _0x281d9c, _0x25e452) {
  let _0x1c127c;
  if (_0x25e452 === signedArea(_0x5f279c, _0x51f4fa, _0x31b3af, _0x281d9c) > 0) {
    for (let _0x50b185 = _0x51f4fa; _0x50b185 < _0x31b3af; _0x50b185 += _0x281d9c)
      _0x1c127c = insertNode(
        (_0x50b185 / _0x281d9c) | 0,
        _0x5f279c[_0x50b185],
        _0x5f279c[_0x50b185 + 1],
        _0x1c127c,
      );
  } else {
    for (let _0x59f2ba = _0x31b3af - _0x281d9c; _0x59f2ba >= _0x51f4fa; _0x59f2ba -= _0x281d9c)
      _0x1c127c = insertNode(
        (_0x59f2ba / _0x281d9c) | 0,
        _0x5f279c[_0x59f2ba],
        _0x5f279c[_0x59f2ba + 1],
        _0x1c127c,
      );
  }
  return (
    _0x1c127c && equals(_0x1c127c, _0x1c127c.next) && (removeNode(_0x1c127c), (_0x1c127c = _0x1c127c.next)),
    _0x1c127c
  );
}
function filterPoints(_0x4449e3, _0x2934a4) {
  if (!_0x4449e3) return _0x4449e3;
  if (!_0x2934a4) _0x2934a4 = _0x4449e3;
  let _0x108cc6 = _0x4449e3,
    _0x309b75;
  do {
    _0x309b75 = false;
    if (
      !_0x108cc6.steiner &&
      (equals(_0x108cc6, _0x108cc6.next) || area(_0x108cc6.prev, _0x108cc6, _0x108cc6.next) === 0)
    ) {
      (removeNode(_0x108cc6), (_0x108cc6 = _0x2934a4 = _0x108cc6.prev));
      if (_0x108cc6 === _0x108cc6.next) break;
      _0x309b75 = true;
    } else _0x108cc6 = _0x108cc6.next;
  } while (_0x309b75 || _0x108cc6 !== _0x2934a4);
  return _0x2934a4;
}
function earcutLinked(_0x1eebf8, _0x5964e1, _0x2d788d, _0x2afc8c, _0x333eb8, _0x377dfe, _0x2e686b) {
  if (!_0x1eebf8) return;
  if (!_0x2e686b && _0x377dfe) indexCurve(_0x1eebf8, _0x2afc8c, _0x333eb8, _0x377dfe);
  let _0x5e372d = _0x1eebf8;
  while (_0x1eebf8.prev !== _0x1eebf8.next) {
    const _0x377c3c = _0x1eebf8.prev,
      _0x575d45 = _0x1eebf8.next;
    if (_0x377dfe ? isEarHashed(_0x1eebf8, _0x2afc8c, _0x333eb8, _0x377dfe) : isEar(_0x1eebf8)) {
      (_0x5964e1.push(_0x377c3c.i, _0x1eebf8.i, _0x575d45.i),
        removeNode(_0x1eebf8),
        (_0x1eebf8 = _0x575d45.next),
        (_0x5e372d = _0x575d45.next));
      continue;
    }
    _0x1eebf8 = _0x575d45;
    if (_0x1eebf8 === _0x5e372d) {
      if (!_0x2e686b)
        earcutLinked(filterPoints(_0x1eebf8), _0x5964e1, _0x2d788d, _0x2afc8c, _0x333eb8, _0x377dfe, 1);
      else {
        if (_0x2e686b === 1)
          ((_0x1eebf8 = cureLocalIntersections(filterPoints(_0x1eebf8), _0x5964e1)),
            earcutLinked(_0x1eebf8, _0x5964e1, _0x2d788d, _0x2afc8c, _0x333eb8, _0x377dfe, 2));
        else _0x2e686b === 2 && splitEarcut(_0x1eebf8, _0x5964e1, _0x2d788d, _0x2afc8c, _0x333eb8, _0x377dfe);
      }
      break;
    }
  }
}
function isEar(_0x4932c8) {
  const _0x3dcb1d = _0x4932c8.prev,
    _0x5b12fd = _0x4932c8,
    _0x46e555 = _0x4932c8.next;
  if (area(_0x3dcb1d, _0x5b12fd, _0x46e555) >= 0) return false;
  const _0x2fdd12 = _0x3dcb1d.x,
    _0x1cf3ad = _0x5b12fd.x,
    _0x423a7d = _0x46e555.x,
    _0x1b1e6a = _0x3dcb1d.y,
    _0x39ea7b = _0x5b12fd.y,
    _0x4cf9b0 = _0x46e555.y,
    _0x4057bf = Math.min(_0x2fdd12, _0x1cf3ad, _0x423a7d),
    _0x198152 = Math.min(_0x1b1e6a, _0x39ea7b, _0x4cf9b0),
    _0x37a201 = Math.max(_0x2fdd12, _0x1cf3ad, _0x423a7d),
    _0x4136a9 = Math.max(_0x1b1e6a, _0x39ea7b, _0x4cf9b0);
  let _0x4e9e05 = _0x46e555.next;
  while (_0x4e9e05 !== _0x3dcb1d) {
    if (
      _0x4e9e05.x >= _0x4057bf &&
      _0x4e9e05.x <= _0x37a201 &&
      _0x4e9e05.y >= _0x198152 &&
      _0x4e9e05.y <= _0x4136a9 &&
      pointInTriangleExceptFirst(
        _0x2fdd12,
        _0x1b1e6a,
        _0x1cf3ad,
        _0x39ea7b,
        _0x423a7d,
        _0x4cf9b0,
        _0x4e9e05.x,
        _0x4e9e05.y,
      ) &&
      area(_0x4e9e05.prev, _0x4e9e05, _0x4e9e05.next) >= 0
    )
      return false;
    _0x4e9e05 = _0x4e9e05.next;
  }
  return true;
}
function isEarHashed(_0x526fa9, _0x4277d0, _0x49b917, _0x282564) {
  const _0x27ebbd = _0x526fa9.prev,
    _0x45d2c4 = _0x526fa9,
    _0x454454 = _0x526fa9.next;
  if (area(_0x27ebbd, _0x45d2c4, _0x454454) >= 0) return false;
  const _0xd1b3d = _0x27ebbd.x,
    _0x296e5a = _0x45d2c4.x,
    _0x48bc7e = _0x454454.x,
    _0x406d25 = _0x27ebbd.y,
    _0x1c85fa = _0x45d2c4.y,
    _0x16282d = _0x454454.y,
    _0xe108cd = Math.min(_0xd1b3d, _0x296e5a, _0x48bc7e),
    _0x40a6dc = Math.min(_0x406d25, _0x1c85fa, _0x16282d),
    _0x17ff68 = Math.max(_0xd1b3d, _0x296e5a, _0x48bc7e),
    _0x43e1e0 = Math.max(_0x406d25, _0x1c85fa, _0x16282d),
    _0xdade59 = zOrder(_0xe108cd, _0x40a6dc, _0x4277d0, _0x49b917, _0x282564),
    _0x34dabd = zOrder(_0x17ff68, _0x43e1e0, _0x4277d0, _0x49b917, _0x282564);
  let _0x6d61c6 = _0x526fa9.prevZ,
    _0x5b779d = _0x526fa9.nextZ;
  while (_0x6d61c6 && _0x6d61c6.z >= _0xdade59 && _0x5b779d && _0x5b779d.z <= _0x34dabd) {
    if (
      _0x6d61c6.x >= _0xe108cd &&
      _0x6d61c6.x <= _0x17ff68 &&
      _0x6d61c6.y >= _0x40a6dc &&
      _0x6d61c6.y <= _0x43e1e0 &&
      _0x6d61c6 !== _0x27ebbd &&
      _0x6d61c6 !== _0x454454 &&
      pointInTriangleExceptFirst(
        _0xd1b3d,
        _0x406d25,
        _0x296e5a,
        _0x1c85fa,
        _0x48bc7e,
        _0x16282d,
        _0x6d61c6.x,
        _0x6d61c6.y,
      ) &&
      area(_0x6d61c6.prev, _0x6d61c6, _0x6d61c6.next) >= 0
    )
      return false;
    _0x6d61c6 = _0x6d61c6.prevZ;
    if (
      _0x5b779d.x >= _0xe108cd &&
      _0x5b779d.x <= _0x17ff68 &&
      _0x5b779d.y >= _0x40a6dc &&
      _0x5b779d.y <= _0x43e1e0 &&
      _0x5b779d !== _0x27ebbd &&
      _0x5b779d !== _0x454454 &&
      pointInTriangleExceptFirst(
        _0xd1b3d,
        _0x406d25,
        _0x296e5a,
        _0x1c85fa,
        _0x48bc7e,
        _0x16282d,
        _0x5b779d.x,
        _0x5b779d.y,
      ) &&
      area(_0x5b779d.prev, _0x5b779d, _0x5b779d.next) >= 0
    )
      return false;
    _0x5b779d = _0x5b779d.nextZ;
  }
  while (_0x6d61c6 && _0x6d61c6.z >= _0xdade59) {
    if (
      _0x6d61c6.x >= _0xe108cd &&
      _0x6d61c6.x <= _0x17ff68 &&
      _0x6d61c6.y >= _0x40a6dc &&
      _0x6d61c6.y <= _0x43e1e0 &&
      _0x6d61c6 !== _0x27ebbd &&
      _0x6d61c6 !== _0x454454 &&
      pointInTriangleExceptFirst(
        _0xd1b3d,
        _0x406d25,
        _0x296e5a,
        _0x1c85fa,
        _0x48bc7e,
        _0x16282d,
        _0x6d61c6.x,
        _0x6d61c6.y,
      ) &&
      area(_0x6d61c6.prev, _0x6d61c6, _0x6d61c6.next) >= 0
    )
      return false;
    _0x6d61c6 = _0x6d61c6.prevZ;
  }
  while (_0x5b779d && _0x5b779d.z <= _0x34dabd) {
    if (
      _0x5b779d.x >= _0xe108cd &&
      _0x5b779d.x <= _0x17ff68 &&
      _0x5b779d.y >= _0x40a6dc &&
      _0x5b779d.y <= _0x43e1e0 &&
      _0x5b779d !== _0x27ebbd &&
      _0x5b779d !== _0x454454 &&
      pointInTriangleExceptFirst(
        _0xd1b3d,
        _0x406d25,
        _0x296e5a,
        _0x1c85fa,
        _0x48bc7e,
        _0x16282d,
        _0x5b779d.x,
        _0x5b779d.y,
      ) &&
      area(_0x5b779d.prev, _0x5b779d, _0x5b779d.next) >= 0
    )
      return false;
    _0x5b779d = _0x5b779d.nextZ;
  }
  return true;
}
function cureLocalIntersections(_0x5e30bf, _0x39d9a0) {
  let _0x3868e7 = _0x5e30bf;
  do {
    const _0x469b36 = _0x3868e7.prev,
      _0x553d36 = _0x3868e7.next.next;
    (!equals(_0x469b36, _0x553d36) &&
      intersects(_0x469b36, _0x3868e7, _0x3868e7.next, _0x553d36) &&
      locallyInside(_0x469b36, _0x553d36) &&
      locallyInside(_0x553d36, _0x469b36) &&
      (_0x39d9a0.push(_0x469b36.i, _0x3868e7.i, _0x553d36.i),
      removeNode(_0x3868e7),
      removeNode(_0x3868e7.next),
      (_0x3868e7 = _0x5e30bf = _0x553d36)),
      (_0x3868e7 = _0x3868e7.next));
  } while (_0x3868e7 !== _0x5e30bf);
  return filterPoints(_0x3868e7);
}
function splitEarcut(_0x852130, _0x254543, _0x16fb29, _0x5eaf4e, _0x460c85, _0x3c3494) {
  let _0x5d0744 = _0x852130;
  do {
    let _0x2c0daf = _0x5d0744.next.next;
    while (_0x2c0daf !== _0x5d0744.prev) {
      if (_0x5d0744.i !== _0x2c0daf.i && isValidDiagonal(_0x5d0744, _0x2c0daf)) {
        let _0x5c5bf3 = splitPolygon(_0x5d0744, _0x2c0daf);
        ((_0x5d0744 = filterPoints(_0x5d0744, _0x5d0744.next)),
          (_0x5c5bf3 = filterPoints(_0x5c5bf3, _0x5c5bf3.next)),
          earcutLinked(_0x5d0744, _0x254543, _0x16fb29, _0x5eaf4e, _0x460c85, _0x3c3494, 0),
          earcutLinked(_0x5c5bf3, _0x254543, _0x16fb29, _0x5eaf4e, _0x460c85, _0x3c3494, 0));
        return;
      }
      _0x2c0daf = _0x2c0daf.next;
    }
    _0x5d0744 = _0x5d0744.next;
  } while (_0x5d0744 !== _0x852130);
}
function eliminateHoles(_0x2b66f3, _0xb8068b, _0x3588b0, _0x174762) {
  const _0x375147 = [];
  for (let _0x4e381a = 0, _0x25ace2 = _0xb8068b.length; _0x4e381a < _0x25ace2; _0x4e381a++) {
    const _0x1a702f = _0xb8068b[_0x4e381a] * _0x174762,
      _0x555818 = _0x4e381a < _0x25ace2 - 1 ? _0xb8068b[_0x4e381a + 1] * _0x174762 : _0x2b66f3.length,
      _0x43688c = linkedList(_0x2b66f3, _0x1a702f, _0x555818, _0x174762, false);
    if (_0x43688c === _0x43688c.next) _0x43688c.steiner = true;
    _0x375147.push(getLeftmost(_0x43688c));
  }
  _0x375147.sort(compareXYSlope);
  for (let _0x3501de = 0; _0x3501de < _0x375147.length; _0x3501de++) {
    _0x3588b0 = eliminateHole(_0x375147[_0x3501de], _0x3588b0);
  }
  return _0x3588b0;
}
function compareXYSlope(_0x343261, _0x158467) {
  let _0x3f5242 = _0x343261.x - _0x158467.x;
  if (_0x3f5242 === 0) {
    _0x3f5242 = _0x343261.y - _0x158467.y;
    if (_0x3f5242 === 0) {
      const _0x403af2 = (_0x343261.next.y - _0x343261.y) / (_0x343261.next.x - _0x343261.x),
        _0x1efd49 = (_0x158467.next.y - _0x158467.y) / (_0x158467.next.x - _0x158467.x);
      _0x3f5242 = _0x403af2 - _0x1efd49;
    }
  }
  return _0x3f5242;
}
function eliminateHole(_0x52a95e, _0x238dd7) {
  const _0x30fc1c = findHoleBridge(_0x52a95e, _0x238dd7);
  if (!_0x30fc1c) return _0x238dd7;
  const _0x539909 = splitPolygon(_0x30fc1c, _0x52a95e);
  return (filterPoints(_0x539909, _0x539909.next), filterPoints(_0x30fc1c, _0x30fc1c.next));
}
function findHoleBridge(_0x546e64, _0x41901a) {
  let _0x40511c = _0x41901a;
  const _0x469cf7 = _0x546e64.x,
    _0x453874 = _0x546e64.y;
  let _0x5cbcc5 = -Infinity,
    _0x481ed2;
  if (equals(_0x546e64, _0x40511c)) return _0x40511c;
  do {
    if (equals(_0x546e64, _0x40511c.next)) return _0x40511c.next;
    else {
      if (_0x453874 <= _0x40511c.y && _0x453874 >= _0x40511c.next.y && _0x40511c.next.y !== _0x40511c.y) {
        const _0x254871 =
          _0x40511c.x +
          ((_0x453874 - _0x40511c.y) * (_0x40511c.next.x - _0x40511c.x)) / (_0x40511c.next.y - _0x40511c.y);
        if (_0x254871 <= _0x469cf7 && _0x254871 > _0x5cbcc5) {
          ((_0x5cbcc5 = _0x254871),
            (_0x481ed2 = _0x40511c.x < _0x40511c.next.x ? _0x40511c : _0x40511c.next));
          if (_0x254871 === _0x469cf7) return _0x481ed2;
        }
      }
    }
    _0x40511c = _0x40511c.next;
  } while (_0x40511c !== _0x41901a);
  if (!_0x481ed2) return null;
  const _0x3de8ce = _0x481ed2,
    _0x209bfa = _0x481ed2.x,
    _0x3826ac = _0x481ed2.y;
  let _0x5ed626 = Infinity;
  _0x40511c = _0x481ed2;
  do {
    if (
      _0x469cf7 >= _0x40511c.x &&
      _0x40511c.x >= _0x209bfa &&
      _0x469cf7 !== _0x40511c.x &&
      pointInTriangle(
        _0x453874 < _0x3826ac ? _0x469cf7 : _0x5cbcc5,
        _0x453874,
        _0x209bfa,
        _0x3826ac,
        _0x453874 < _0x3826ac ? _0x5cbcc5 : _0x469cf7,
        _0x453874,
        _0x40511c.x,
        _0x40511c.y,
      )
    ) {
      const _0x55befc = Math.abs(_0x453874 - _0x40511c.y) / (_0x469cf7 - _0x40511c.x);
      locallyInside(_0x40511c, _0x546e64) &&
        (_0x55befc < _0x5ed626 ||
          (_0x55befc === _0x5ed626 &&
            (_0x40511c.x > _0x481ed2.x ||
              (_0x40511c.x === _0x481ed2.x && sectorContainsSector(_0x481ed2, _0x40511c))))) &&
        ((_0x481ed2 = _0x40511c), (_0x5ed626 = _0x55befc));
    }
    _0x40511c = _0x40511c.next;
  } while (_0x40511c !== _0x3de8ce);
  return _0x481ed2;
}
function sectorContainsSector(_0x3cf92b, _0x4d2c86) {
  return (
    area(_0x3cf92b.prev, _0x3cf92b, _0x4d2c86.prev) < 0 && area(_0x4d2c86.next, _0x3cf92b, _0x3cf92b.next) < 0
  );
}
function indexCurve(_0x52862d, _0x3e1244, _0x55cc40, _0x2c576e) {
  let _0xd194c6 = _0x52862d;
  do {
    if (_0xd194c6.z === 0) _0xd194c6.z = zOrder(_0xd194c6.x, _0xd194c6.y, _0x3e1244, _0x55cc40, _0x2c576e);
    ((_0xd194c6.prevZ = _0xd194c6.prev), (_0xd194c6.nextZ = _0xd194c6.next), (_0xd194c6 = _0xd194c6.next));
  } while (_0xd194c6 !== _0x52862d);
  ((_0xd194c6.prevZ.nextZ = null), (_0xd194c6.prevZ = null), sortLinked(_0xd194c6));
}
function sortLinked(_0x288506) {
  let _0x51877f,
    _0x10c31d = 1;
  do {
    let _0x2abeef = _0x288506,
      _0x1f4177;
    _0x288506 = null;
    let _0xb60b17 = null;
    _0x51877f = 0;
    while (_0x2abeef) {
      _0x51877f++;
      let _0xa1aa29 = _0x2abeef,
        _0x25777b = 0;
      for (let _0x348b5e = 0; _0x348b5e < _0x10c31d; _0x348b5e++) {
        (_0x25777b++, (_0xa1aa29 = _0xa1aa29.nextZ));
        if (!_0xa1aa29) break;
      }
      let _0x532b4b = _0x10c31d;
      while (_0x25777b > 0 || (_0x532b4b > 0 && _0xa1aa29)) {
        _0x25777b !== 0 && (_0x532b4b === 0 || !_0xa1aa29 || _0x2abeef.z <= _0xa1aa29.z)
          ? ((_0x1f4177 = _0x2abeef), (_0x2abeef = _0x2abeef.nextZ), _0x25777b--)
          : ((_0x1f4177 = _0xa1aa29), (_0xa1aa29 = _0xa1aa29.nextZ), _0x532b4b--);
        if (_0xb60b17) _0xb60b17.nextZ = _0x1f4177;
        else _0x288506 = _0x1f4177;
        ((_0x1f4177.prevZ = _0xb60b17), (_0xb60b17 = _0x1f4177));
      }
      _0x2abeef = _0xa1aa29;
    }
    ((_0xb60b17.nextZ = null), (_0x10c31d *= 2));
  } while (_0x51877f > 1);
  return _0x288506;
}
function zOrder(_0x94dbbb, _0x1b99e0, _0x41155f, _0x5d92b0, _0x5ea08f) {
  return (
    (_0x94dbbb = ((_0x94dbbb - _0x41155f) * _0x5ea08f) | 0),
    (_0x1b99e0 = ((_0x1b99e0 - _0x5d92b0) * _0x5ea08f) | 0),
    (_0x94dbbb = (_0x94dbbb | (_0x94dbbb << 8)) & 0xff00ff),
    (_0x94dbbb = (_0x94dbbb | (_0x94dbbb << 4)) & 0xf0f0f0f),
    (_0x94dbbb = (_0x94dbbb | (_0x94dbbb << 2)) & 0x33333333),
    (_0x94dbbb = (_0x94dbbb | (_0x94dbbb << 1)) & 0x55555555),
    (_0x1b99e0 = (_0x1b99e0 | (_0x1b99e0 << 8)) & 0xff00ff),
    (_0x1b99e0 = (_0x1b99e0 | (_0x1b99e0 << 4)) & 0xf0f0f0f),
    (_0x1b99e0 = (_0x1b99e0 | (_0x1b99e0 << 2)) & 0x33333333),
    (_0x1b99e0 = (_0x1b99e0 | (_0x1b99e0 << 1)) & 0x55555555),
    _0x94dbbb | (_0x1b99e0 << 1)
  );
}
function getLeftmost(_0x597495) {
  let _0x4eba2a = _0x597495,
    _0x4aea52 = _0x597495;
  do {
    if (_0x4eba2a.x < _0x4aea52.x || (_0x4eba2a.x === _0x4aea52.x && _0x4eba2a.y < _0x4aea52.y))
      _0x4aea52 = _0x4eba2a;
    _0x4eba2a = _0x4eba2a.next;
  } while (_0x4eba2a !== _0x597495);
  return _0x4aea52;
}
function pointInTriangle(
  _0x3b618d,
  _0x3f4a94,
  _0x4357c4,
  _0x1e3cbd,
  _0x28fb2f,
  _0x507dec,
  _0x442ca5,
  _0x2365c9,
) {
  return (
    (_0x28fb2f - _0x442ca5) * (_0x3f4a94 - _0x2365c9) >= (_0x3b618d - _0x442ca5) * (_0x507dec - _0x2365c9) &&
    (_0x3b618d - _0x442ca5) * (_0x1e3cbd - _0x2365c9) >= (_0x4357c4 - _0x442ca5) * (_0x3f4a94 - _0x2365c9) &&
    (_0x4357c4 - _0x442ca5) * (_0x507dec - _0x2365c9) >= (_0x28fb2f - _0x442ca5) * (_0x1e3cbd - _0x2365c9)
  );
}
function pointInTriangleExceptFirst(
  _0x388313,
  _0x3b5780,
  _0x482240,
  _0x5deef0,
  _0x21f4d6,
  _0x381d1c,
  _0x33aa59,
  _0x124815,
) {
  return (
    !(_0x388313 === _0x33aa59 && _0x3b5780 === _0x124815) &&
    pointInTriangle(_0x388313, _0x3b5780, _0x482240, _0x5deef0, _0x21f4d6, _0x381d1c, _0x33aa59, _0x124815)
  );
}
function isValidDiagonal(_0x356c51, _0x20888e) {
  return (
    _0x356c51.next.i !== _0x20888e.i &&
    _0x356c51.prev.i !== _0x20888e.i &&
    !intersectsPolygon(_0x356c51, _0x20888e) &&
    ((locallyInside(_0x356c51, _0x20888e) &&
      locallyInside(_0x20888e, _0x356c51) &&
      middleInside(_0x356c51, _0x20888e) &&
      (area(_0x356c51.prev, _0x356c51, _0x20888e.prev) || area(_0x356c51, _0x20888e.prev, _0x20888e))) ||
      (equals(_0x356c51, _0x20888e) &&
        area(_0x356c51.prev, _0x356c51, _0x356c51.next) > 0 &&
        area(_0x20888e.prev, _0x20888e, _0x20888e.next) > 0))
  );
}
function area(_0x3f1d03, _0x19cca9, _0x58dabf) {
  return (
    (_0x19cca9.y - _0x3f1d03.y) * (_0x58dabf.x - _0x19cca9.x) -
    (_0x19cca9.x - _0x3f1d03.x) * (_0x58dabf.y - _0x19cca9.y)
  );
}
function equals(_0x48f204, _0x2f6a6d) {
  return _0x48f204.x === _0x2f6a6d.x && _0x48f204.y === _0x2f6a6d.y;
}
function intersects(_0x37f8a9, _0x480822, _0x303564, _0x7a9ddd) {
  const _0x46c466 = sign(area(_0x37f8a9, _0x480822, _0x303564)),
    _0x303daf = sign(area(_0x37f8a9, _0x480822, _0x7a9ddd)),
    _0x3cf9f6 = sign(area(_0x303564, _0x7a9ddd, _0x37f8a9)),
    _0x26e13a = sign(area(_0x303564, _0x7a9ddd, _0x480822));
  if (_0x46c466 !== _0x303daf && _0x3cf9f6 !== _0x26e13a) return true;
  if (_0x46c466 === 0 && onSegment(_0x37f8a9, _0x303564, _0x480822)) return true;
  if (_0x303daf === 0 && onSegment(_0x37f8a9, _0x7a9ddd, _0x480822)) return true;
  if (_0x3cf9f6 === 0 && onSegment(_0x303564, _0x37f8a9, _0x7a9ddd)) return true;
  if (_0x26e13a === 0 && onSegment(_0x303564, _0x480822, _0x7a9ddd)) return true;
  return false;
}
function onSegment(_0x258a8d, _0x328245, _0x589b86) {
  return (
    _0x328245.x <= Math.max(_0x258a8d.x, _0x589b86.x) &&
    _0x328245.x >= Math.min(_0x258a8d.x, _0x589b86.x) &&
    _0x328245.y <= Math.max(_0x258a8d.y, _0x589b86.y) &&
    _0x328245.y >= Math.min(_0x258a8d.y, _0x589b86.y)
  );
}
function sign(_0x1e4f3d) {
  return _0x1e4f3d > 0 ? 1 : _0x1e4f3d < 0 ? -1 : 0;
}
function intersectsPolygon(_0x5f153b, _0x31ec4f) {
  let _0xe1146 = _0x5f153b;
  do {
    if (
      _0xe1146.i !== _0x5f153b.i &&
      _0xe1146.next.i !== _0x5f153b.i &&
      _0xe1146.i !== _0x31ec4f.i &&
      _0xe1146.next.i !== _0x31ec4f.i &&
      intersects(_0xe1146, _0xe1146.next, _0x5f153b, _0x31ec4f)
    )
      return true;
    _0xe1146 = _0xe1146.next;
  } while (_0xe1146 !== _0x5f153b);
  return false;
}
function locallyInside(_0x694c63, _0x447bd4) {
  return area(_0x694c63.prev, _0x694c63, _0x694c63.next) < 0
    ? area(_0x694c63, _0x447bd4, _0x694c63.next) >= 0 && area(_0x694c63, _0x694c63.prev, _0x447bd4) >= 0
    : area(_0x694c63, _0x447bd4, _0x694c63.prev) < 0 || area(_0x694c63, _0x694c63.next, _0x447bd4) < 0;
}
function middleInside(_0x50c2d9, _0xe2938c) {
  let _0x2ee08f = _0x50c2d9,
    _0x2dbd4a = false;
  const _0x4ab099 = (_0x50c2d9.x + _0xe2938c.x) / 2,
    _0x3a2432 = (_0x50c2d9.y + _0xe2938c.y) / 2;
  do {
    if (
      _0x2ee08f.y > _0x3a2432 !== _0x2ee08f.next.y > _0x3a2432 &&
      _0x2ee08f.next.y !== _0x2ee08f.y &&
      _0x4ab099 <
        ((_0x2ee08f.next.x - _0x2ee08f.x) * (_0x3a2432 - _0x2ee08f.y)) / (_0x2ee08f.next.y - _0x2ee08f.y) +
          _0x2ee08f.x
    )
      _0x2dbd4a = !_0x2dbd4a;
    _0x2ee08f = _0x2ee08f.next;
  } while (_0x2ee08f !== _0x50c2d9);
  return _0x2dbd4a;
}
function splitPolygon(_0xb76cf7, _0x357232) {
  const _0x3d3672 = createNode(_0xb76cf7.i, _0xb76cf7.x, _0xb76cf7.y),
    _0x4d301d = createNode(_0x357232.i, _0x357232.x, _0x357232.y),
    _0x256deb = _0xb76cf7.next,
    _0x1e3e43 = _0x357232.prev;
  return (
    (_0xb76cf7.next = _0x357232),
    (_0x357232.prev = _0xb76cf7),
    (_0x3d3672.next = _0x256deb),
    (_0x256deb.prev = _0x3d3672),
    (_0x4d301d.next = _0x3d3672),
    (_0x3d3672.prev = _0x4d301d),
    (_0x1e3e43.next = _0x4d301d),
    (_0x4d301d.prev = _0x1e3e43),
    _0x4d301d
  );
}
function insertNode(_0x423a2e, _0x4f8b2b, _0x268a62, _0x309180) {
  const _0x450926 = createNode(_0x423a2e, _0x4f8b2b, _0x268a62);
  return (
    !_0x309180
      ? ((_0x450926.prev = _0x450926), (_0x450926.next = _0x450926))
      : ((_0x450926.next = _0x309180.next),
        (_0x450926.prev = _0x309180),
        (_0x309180.next.prev = _0x450926),
        (_0x309180.next = _0x450926)),
    _0x450926
  );
}
function removeNode(_0x5d27ac) {
  ((_0x5d27ac.next.prev = _0x5d27ac.prev), (_0x5d27ac.prev.next = _0x5d27ac.next));
  if (_0x5d27ac.prevZ) _0x5d27ac.prevZ.nextZ = _0x5d27ac.nextZ;
  if (_0x5d27ac.nextZ) _0x5d27ac.nextZ.prevZ = _0x5d27ac.prevZ;
}
function createNode(_0x44b96a, _0x545bda, _0x1b0eb4) {
  return {
    i: _0x44b96a,
    x: _0x545bda,
    y: _0x1b0eb4,
    prev: null,
    next: null,
    z: 0,
    prevZ: null,
    nextZ: null,
    steiner: false,
  };
}
function signedArea(_0x25502d, _0x550d5a, _0x16cc24, _0x8af360) {
  let _0x15f9a3 = 0;
  for (
    let _0x107dc0 = _0x550d5a, _0x1c795a = _0x16cc24 - _0x8af360;
    _0x107dc0 < _0x16cc24;
    _0x107dc0 += _0x8af360
  ) {
    ((_0x15f9a3 +=
      (_0x25502d[_0x1c795a] - _0x25502d[_0x107dc0]) * (_0x25502d[_0x107dc0 + 1] + _0x25502d[_0x1c795a + 1])),
      (_0x1c795a = _0x107dc0));
  }
  return _0x15f9a3;
}
class Earcut {
  static ['triangulate'](_0x137a91, _0x546530, _0x3ae23f = 2) {
    return earcut(_0x137a91, _0x546530, _0x3ae23f);
  }
}
class ShapeUtils {
  static ['area'](_0x398b26) {
    const _0x193a94 = _0x398b26.length;
    let _0x389a75 = 0;
    for (let _0x3790e2 = _0x193a94 - 1, _0x1d7a9f = 0; _0x1d7a9f < _0x193a94; _0x3790e2 = _0x1d7a9f++) {
      _0x389a75 +=
        _0x398b26[_0x3790e2].x * _0x398b26[_0x1d7a9f].y - _0x398b26[_0x1d7a9f].x * _0x398b26[_0x3790e2].y;
    }
    return _0x389a75 * 0.5;
  }
  static ['isClockWise'](_0x45442b) {
    return ShapeUtils.area(_0x45442b) < 0;
  }
  static ['triangulateShape'](_0x14f9c4, _0x2f6c06) {
    const _0x24b64a = [],
      _0x20ed22 = [],
      _0x43d8a8 = [];
    (removeDupEndPts(_0x14f9c4), addContour(_0x24b64a, _0x14f9c4));
    let _0x3d813b = _0x14f9c4.length;
    _0x2f6c06.forEach(removeDupEndPts);
    for (let _0x36abcb = 0; _0x36abcb < _0x2f6c06.length; _0x36abcb++) {
      (_0x20ed22.push(_0x3d813b),
        (_0x3d813b += _0x2f6c06[_0x36abcb].length),
        addContour(_0x24b64a, _0x2f6c06[_0x36abcb]));
    }
    const _0x98d699 = Earcut.triangulate(_0x24b64a, _0x20ed22);
    for (let _0x33e5d5 = 0; _0x33e5d5 < _0x98d699.length; _0x33e5d5 += 3) {
      _0x43d8a8.push(_0x98d699.slice(_0x33e5d5, _0x33e5d5 + 3));
    }
    return _0x43d8a8;
  }
}
function removeDupEndPts(_0x29fc47) {
  const _0x4ece58 = _0x29fc47.length;
  _0x4ece58 > 2 && _0x29fc47[_0x4ece58 - 1].equals(_0x29fc47[0]) && _0x29fc47.pop();
}
function addContour(_0x5ec6c3, _0x2c1d91) {
  for (let _0x326f56 = 0; _0x326f56 < _0x2c1d91.length; _0x326f56++) {
    (_0x5ec6c3.push(_0x2c1d91[_0x326f56].x), _0x5ec6c3.push(_0x2c1d91[_0x326f56].y));
  }
}
class ExtrudeGeometry extends BufferGeometry {
  constructor(
    _0x39998a = new Shape([
      new Vector2(0.5, 0.5),
      new Vector2(-0.5, 0.5),
      new Vector2(-0.5, -0.5),
      new Vector2(0.5, -0.5),
    ]),
    _0x273a61 = {},
  ) {
    (super(),
      (this.type = 'ExtrudeGeometry'),
      (this.parameters = { shapes: _0x39998a, options: _0x273a61 }),
      (_0x39998a = Array.isArray(_0x39998a) ? _0x39998a : [_0x39998a]));
    const _0x979a3d = this,
      _0x5bb96c = [],
      _0x5e98a9 = [];
    for (let _0x2a4a99 = 0, _0x21981d = _0x39998a.length; _0x2a4a99 < _0x21981d; _0x2a4a99++) {
      const _0x4a7fbb = _0x39998a[_0x2a4a99];
      _0x1d167a(_0x4a7fbb);
    }
    (this.setAttribute('position', new Float32BufferAttribute(_0x5bb96c, 3)),
      this.setAttribute('uv', new Float32BufferAttribute(_0x5e98a9, 2)),
      this.computeVertexNormals());
    function _0x1d167a(_0x457d00) {
      const _0x16ee64 = [],
        _0x487ded = _0x273a61.curveSegments !== undefined ? _0x273a61.curveSegments : 12,
        _0x4aba74 = _0x273a61.steps !== undefined ? _0x273a61.steps : 1,
        _0x1f2a9d = _0x273a61.depth !== undefined ? _0x273a61.depth : 1;
      let _0x289f9f = _0x273a61.bevelEnabled !== undefined ? _0x273a61.bevelEnabled : true,
        _0x433ca8 = _0x273a61.bevelThickness !== undefined ? _0x273a61.bevelThickness : 0.2,
        _0x21b06e = _0x273a61.bevelSize !== undefined ? _0x273a61.bevelSize : _0x433ca8 - 0.1,
        _0x3018f5 = _0x273a61.bevelOffset !== undefined ? _0x273a61.bevelOffset : 0,
        _0x5d8671 = _0x273a61.bevelSegments !== undefined ? _0x273a61.bevelSegments : 3;
      const _0x333fb1 = _0x273a61.extrudePath,
        _0x5c36c3 = _0x273a61.UVGenerator !== undefined ? _0x273a61.UVGenerator : WorldUVGenerator;
      let _0x4ad748,
        _0x559f1b = false,
        _0x49a431,
        _0x15f3a6,
        _0x93d106,
        _0x5e188b;
      _0x333fb1 &&
        ((_0x4ad748 = _0x333fb1.getSpacedPoints(_0x4aba74)),
        (_0x559f1b = true),
        (_0x289f9f = false),
        (_0x49a431 = _0x333fb1.computeFrenetFrames(_0x4aba74, false)),
        (_0x15f3a6 = new Vector3()),
        (_0x93d106 = new Vector3()),
        (_0x5e188b = new Vector3()));
      !_0x289f9f && ((_0x5d8671 = 0), (_0x433ca8 = 0), (_0x21b06e = 0), (_0x3018f5 = 0));
      const _0x25d561 = _0x457d00.extractPoints(_0x487ded);
      let _0x2731c3 = _0x25d561.shape;
      const _0x134561 = _0x25d561.holes,
        _0x3369d7 = !ShapeUtils.isClockWise(_0x2731c3);
      if (_0x3369d7) {
        _0x2731c3 = _0x2731c3.reverse();
        for (let _0x150435 = 0, _0x6a878 = _0x134561.length; _0x150435 < _0x6a878; _0x150435++) {
          const _0x3cf614 = _0x134561[_0x150435];
          ShapeUtils.isClockWise(_0x3cf614) && (_0x134561[_0x150435] = _0x3cf614.reverse());
        }
      }
      function _0x2de769(_0x546566) {
        const _0x55b62b = 1e-10,
          _0x3044ac = _0x55b62b * _0x55b62b;
        let _0x53128d = _0x546566[0];
        for (let _0x416617 = 1; _0x416617 <= _0x546566.length; _0x416617++) {
          const _0x344c63 = _0x416617 % _0x546566.length,
            _0xea4805 = _0x546566[_0x344c63],
            _0x21cb2c = _0xea4805.x - _0x53128d.x,
            _0x2bf3d6 = _0xea4805.y - _0x53128d.y,
            _0x479d75 = _0x21cb2c * _0x21cb2c + _0x2bf3d6 * _0x2bf3d6,
            _0x168387 = Math.max(
              Math.abs(_0xea4805.x),
              Math.abs(_0xea4805.y),
              Math.abs(_0x53128d.x),
              Math.abs(_0x53128d.y),
            ),
            _0x25ebc1 = _0x3044ac * _0x168387 * _0x168387;
          if (_0x479d75 <= _0x25ebc1) {
            (_0x546566.splice(_0x344c63, 1), _0x416617--);
            continue;
          }
          _0x53128d = _0xea4805;
        }
      }
      (_0x2de769(_0x2731c3), _0x134561.forEach(_0x2de769));
      const _0x2c1c74 = _0x134561.length,
        _0x282de9 = _0x2731c3;
      for (let _0x4d24f2 = 0; _0x4d24f2 < _0x2c1c74; _0x4d24f2++) {
        const _0x42828b = _0x134561[_0x4d24f2];
        _0x2731c3 = _0x2731c3.concat(_0x42828b);
      }
      function _0x4260da(_0x3b5fbc, _0x48b466, _0x2a2fcc) {
        if (!_0x48b466) console.error('THREE.ExtrudeGeometry: vec does not exist');
        return _0x3b5fbc.clone().addScaledVector(_0x48b466, _0x2a2fcc);
      }
      const _0xd89016 = _0x2731c3.length;
      function _0x2dd4fc(_0x56a61e, _0x416ce1, _0xa1ef4d) {
        let _0x2c411e, _0x5a3494, _0x449413;
        const _0x3dd8bc = _0x56a61e.x - _0x416ce1.x,
          _0x527668 = _0x56a61e.y - _0x416ce1.y,
          _0xc5f0cc = _0xa1ef4d.x - _0x56a61e.x,
          _0x4548d8 = _0xa1ef4d.y - _0x56a61e.y,
          _0x6659f5 = _0x3dd8bc * _0x3dd8bc + _0x527668 * _0x527668,
          _0x373623 = _0x3dd8bc * _0x4548d8 - _0x527668 * _0xc5f0cc;
        if (Math.abs(_0x373623) > Number.EPSILON) {
          const _0xfcebef = Math.sqrt(_0x6659f5),
            _0x275fa2 = Math.sqrt(_0xc5f0cc * _0xc5f0cc + _0x4548d8 * _0x4548d8),
            _0x44ec91 = _0x416ce1.x - _0x527668 / _0xfcebef,
            _0x34ece6 = _0x416ce1.y + _0x3dd8bc / _0xfcebef,
            _0x3448e4 = _0xa1ef4d.x - _0x4548d8 / _0x275fa2,
            _0x124cf = _0xa1ef4d.y + _0xc5f0cc / _0x275fa2,
            _0x4a05fd =
              ((_0x3448e4 - _0x44ec91) * _0x4548d8 - (_0x124cf - _0x34ece6) * _0xc5f0cc) /
              (_0x3dd8bc * _0x4548d8 - _0x527668 * _0xc5f0cc);
          ((_0x2c411e = _0x44ec91 + _0x3dd8bc * _0x4a05fd - _0x56a61e.x),
            (_0x5a3494 = _0x34ece6 + _0x527668 * _0x4a05fd - _0x56a61e.y));
          const _0x49fdef = _0x2c411e * _0x2c411e + _0x5a3494 * _0x5a3494;
          if (_0x49fdef <= 2) return new Vector2(_0x2c411e, _0x5a3494);
          else _0x449413 = Math.sqrt(_0x49fdef / 2);
        } else {
          let _0x1cea9e = false;
          (_0x3dd8bc > Number.EPSILON
            ? _0xc5f0cc > Number.EPSILON && (_0x1cea9e = true)
            : _0x3dd8bc < -Number.EPSILON
              ? _0xc5f0cc < -Number.EPSILON && (_0x1cea9e = true)
              : Math.sign(_0x527668) === Math.sign(_0x4548d8) && (_0x1cea9e = true),
            _0x1cea9e
              ? ((_0x2c411e = -_0x527668), (_0x5a3494 = _0x3dd8bc), (_0x449413 = Math.sqrt(_0x6659f5)))
              : ((_0x2c411e = _0x3dd8bc), (_0x5a3494 = _0x527668), (_0x449413 = Math.sqrt(_0x6659f5 / 2))));
        }
        return new Vector2(_0x2c411e / _0x449413, _0x5a3494 / _0x449413);
      }
      const _0xc35628 = [];
      for (
        let _0x57857b = 0, _0x12f743 = _0x282de9.length, _0x496459 = _0x12f743 - 1, _0x16d8b3 = _0x57857b + 1;
        _0x57857b < _0x12f743;
        _0x57857b++, _0x496459++, _0x16d8b3++
      ) {
        if (_0x496459 === _0x12f743) _0x496459 = 0;
        if (_0x16d8b3 === _0x12f743) _0x16d8b3 = 0;
        _0xc35628[_0x57857b] = _0x2dd4fc(_0x282de9[_0x57857b], _0x282de9[_0x496459], _0x282de9[_0x16d8b3]);
      }
      const _0x3dfa28 = [];
      let _0x4f610b,
        _0x44664d = _0xc35628.concat();
      for (let _0x34c078 = 0, _0x392846 = _0x2c1c74; _0x34c078 < _0x392846; _0x34c078++) {
        const _0x3ea3ad = _0x134561[_0x34c078];
        _0x4f610b = [];
        for (
          let _0x120e86 = 0,
            _0x3f0253 = _0x3ea3ad.length,
            _0x4c4e78 = _0x3f0253 - 1,
            _0x3ab956 = _0x120e86 + 1;
          _0x120e86 < _0x3f0253;
          _0x120e86++, _0x4c4e78++, _0x3ab956++
        ) {
          if (_0x4c4e78 === _0x3f0253) _0x4c4e78 = 0;
          if (_0x3ab956 === _0x3f0253) _0x3ab956 = 0;
          _0x4f610b[_0x120e86] = _0x2dd4fc(_0x3ea3ad[_0x120e86], _0x3ea3ad[_0x4c4e78], _0x3ea3ad[_0x3ab956]);
        }
        (_0x3dfa28.push(_0x4f610b), (_0x44664d = _0x44664d.concat(_0x4f610b)));
      }
      let _0x202b0e;
      if (_0x5d8671 === 0) _0x202b0e = ShapeUtils.triangulateShape(_0x282de9, _0x134561);
      else {
        const _0x45481f = [],
          _0x3452bd = [];
        for (let _0x3b4958 = 0; _0x3b4958 < _0x5d8671; _0x3b4958++) {
          const _0x1bf220 = _0x3b4958 / _0x5d8671,
            _0x2c4596 = _0x433ca8 * Math.cos((_0x1bf220 * Math.PI) / 2),
            _0x55083e = _0x21b06e * Math.sin((_0x1bf220 * Math.PI) / 2) + _0x3018f5;
          for (let _0x5ad297 = 0, _0x214cb6 = _0x282de9.length; _0x5ad297 < _0x214cb6; _0x5ad297++) {
            const _0x11ef15 = _0x4260da(_0x282de9[_0x5ad297], _0xc35628[_0x5ad297], _0x55083e);
            _0x56cc05(_0x11ef15.x, _0x11ef15.y, -_0x2c4596);
            if (_0x1bf220 === 0) _0x45481f.push(_0x11ef15);
          }
          for (let _0x15d517 = 0, _0xbf5e81 = _0x2c1c74; _0x15d517 < _0xbf5e81; _0x15d517++) {
            const _0x1eaa29 = _0x134561[_0x15d517];
            _0x4f610b = _0x3dfa28[_0x15d517];
            const _0x36f70c = [];
            for (let _0x3a2409 = 0, _0x5b497e = _0x1eaa29.length; _0x3a2409 < _0x5b497e; _0x3a2409++) {
              const _0x24b1f9 = _0x4260da(_0x1eaa29[_0x3a2409], _0x4f610b[_0x3a2409], _0x55083e);
              _0x56cc05(_0x24b1f9.x, _0x24b1f9.y, -_0x2c4596);
              if (_0x1bf220 === 0) _0x36f70c.push(_0x24b1f9);
            }
            if (_0x1bf220 === 0) _0x3452bd.push(_0x36f70c);
          }
        }
        _0x202b0e = ShapeUtils.triangulateShape(_0x45481f, _0x3452bd);
      }
      const _0x6e9634 = _0x202b0e.length,
        _0x52bba4 = _0x21b06e + _0x3018f5;
      for (let _0x1d6cbb = 0; _0x1d6cbb < _0xd89016; _0x1d6cbb++) {
        const _0x56e5f8 = _0x289f9f
          ? _0x4260da(_0x2731c3[_0x1d6cbb], _0x44664d[_0x1d6cbb], _0x52bba4)
          : _0x2731c3[_0x1d6cbb];
        !_0x559f1b
          ? _0x56cc05(_0x56e5f8.x, _0x56e5f8.y, 0)
          : (_0x93d106.copy(_0x49a431.normals[0]).multiplyScalar(_0x56e5f8.x),
            _0x15f3a6.copy(_0x49a431.binormals[0]).multiplyScalar(_0x56e5f8.y),
            _0x5e188b.copy(_0x4ad748[0]).add(_0x93d106).add(_0x15f3a6),
            _0x56cc05(_0x5e188b.x, _0x5e188b.y, _0x5e188b.z));
      }
      for (let _0x1cbb95 = 1; _0x1cbb95 <= _0x4aba74; _0x1cbb95++) {
        for (let _0x399619 = 0; _0x399619 < _0xd89016; _0x399619++) {
          const _0x562d97 = _0x289f9f
            ? _0x4260da(_0x2731c3[_0x399619], _0x44664d[_0x399619], _0x52bba4)
            : _0x2731c3[_0x399619];
          !_0x559f1b
            ? _0x56cc05(_0x562d97.x, _0x562d97.y, (_0x1f2a9d / _0x4aba74) * _0x1cbb95)
            : (_0x93d106.copy(_0x49a431.normals[_0x1cbb95]).multiplyScalar(_0x562d97.x),
              _0x15f3a6.copy(_0x49a431.binormals[_0x1cbb95]).multiplyScalar(_0x562d97.y),
              _0x5e188b.copy(_0x4ad748[_0x1cbb95]).add(_0x93d106).add(_0x15f3a6),
              _0x56cc05(_0x5e188b.x, _0x5e188b.y, _0x5e188b.z));
        }
      }
      for (let _0x588ade = _0x5d8671 - 1; _0x588ade >= 0; _0x588ade--) {
        const _0x2f293b = _0x588ade / _0x5d8671,
          _0x4b02f9 = _0x433ca8 * Math.cos((_0x2f293b * Math.PI) / 2),
          _0x336a84 = _0x21b06e * Math.sin((_0x2f293b * Math.PI) / 2) + _0x3018f5;
        for (let _0x8826ed = 0, _0x5f095b = _0x282de9.length; _0x8826ed < _0x5f095b; _0x8826ed++) {
          const _0x446d5c = _0x4260da(_0x282de9[_0x8826ed], _0xc35628[_0x8826ed], _0x336a84);
          _0x56cc05(_0x446d5c.x, _0x446d5c.y, _0x1f2a9d + _0x4b02f9);
        }
        for (let _0x2785a6 = 0, _0x7118c0 = _0x134561.length; _0x2785a6 < _0x7118c0; _0x2785a6++) {
          const _0x3029f3 = _0x134561[_0x2785a6];
          _0x4f610b = _0x3dfa28[_0x2785a6];
          for (let _0x2c0ad8 = 0, _0x18f43e = _0x3029f3.length; _0x2c0ad8 < _0x18f43e; _0x2c0ad8++) {
            const _0x164bd1 = _0x4260da(_0x3029f3[_0x2c0ad8], _0x4f610b[_0x2c0ad8], _0x336a84);
            !_0x559f1b
              ? _0x56cc05(_0x164bd1.x, _0x164bd1.y, _0x1f2a9d + _0x4b02f9)
              : _0x56cc05(
                  _0x164bd1.x,
                  _0x164bd1.y + _0x4ad748[_0x4aba74 - 1].y,
                  _0x4ad748[_0x4aba74 - 1].x + _0x4b02f9,
                );
          }
        }
      }
      (_0xadc072(), _0x3bfa27());
      function _0xadc072() {
        const _0xf369b = _0x5bb96c.length / 3;
        if (_0x289f9f) {
          let _0xa6c234 = 0,
            _0x8ee995 = _0xd89016 * _0xa6c234;
          for (let _0x40def0 = 0; _0x40def0 < _0x6e9634; _0x40def0++) {
            const _0x3abc6d = _0x202b0e[_0x40def0];
            _0x1ef219(_0x3abc6d[2] + _0x8ee995, _0x3abc6d[1] + _0x8ee995, _0x3abc6d[0] + _0x8ee995);
          }
          ((_0xa6c234 = _0x4aba74 + _0x5d8671 * 2), (_0x8ee995 = _0xd89016 * _0xa6c234));
          for (let _0x506897 = 0; _0x506897 < _0x6e9634; _0x506897++) {
            const _0x36ce31 = _0x202b0e[_0x506897];
            _0x1ef219(_0x36ce31[0] + _0x8ee995, _0x36ce31[1] + _0x8ee995, _0x36ce31[2] + _0x8ee995);
          }
        } else {
          for (let _0x5f0545 = 0; _0x5f0545 < _0x6e9634; _0x5f0545++) {
            const _0x2bcbb0 = _0x202b0e[_0x5f0545];
            _0x1ef219(_0x2bcbb0[2], _0x2bcbb0[1], _0x2bcbb0[0]);
          }
          for (let _0x27e3aa = 0; _0x27e3aa < _0x6e9634; _0x27e3aa++) {
            const _0x1cac2b = _0x202b0e[_0x27e3aa];
            _0x1ef219(
              _0x1cac2b[0] + _0xd89016 * _0x4aba74,
              _0x1cac2b[1] + _0xd89016 * _0x4aba74,
              _0x1cac2b[2] + _0xd89016 * _0x4aba74,
            );
          }
        }
        _0x979a3d.addGroup(_0xf369b, _0x5bb96c.length / 3 - _0xf369b, 0);
      }
      function _0x3bfa27() {
        const _0x5b39d0 = _0x5bb96c.length / 3;
        let _0x3787f2 = 0;
        (_0x4f7a88(_0x282de9, _0x3787f2), (_0x3787f2 += _0x282de9.length));
        for (let _0x1ec703 = 0, _0x4b5d00 = _0x134561.length; _0x1ec703 < _0x4b5d00; _0x1ec703++) {
          const _0x2bab3c = _0x134561[_0x1ec703];
          (_0x4f7a88(_0x2bab3c, _0x3787f2), (_0x3787f2 += _0x2bab3c.length));
        }
        _0x979a3d.addGroup(_0x5b39d0, _0x5bb96c.length / 3 - _0x5b39d0, 1);
      }
      function _0x4f7a88(_0x4e9dd4, _0x41b103) {
        let _0x40a6d1 = _0x4e9dd4.length;
        while (--_0x40a6d1 >= 0) {
          const _0x36dbbc = _0x40a6d1;
          let _0x41474f = _0x40a6d1 - 1;
          if (_0x41474f < 0) _0x41474f = _0x4e9dd4.length - 1;
          for (let _0x5466c7 = 0, _0x28425c = _0x4aba74 + _0x5d8671 * 2; _0x5466c7 < _0x28425c; _0x5466c7++) {
            const _0x26f9c2 = _0xd89016 * _0x5466c7,
              _0x263703 = _0xd89016 * (_0x5466c7 + 1),
              _0x4202fe = _0x41b103 + _0x36dbbc + _0x26f9c2,
              _0x1013f7 = _0x41b103 + _0x41474f + _0x26f9c2,
              _0x8a4e3d = _0x41b103 + _0x41474f + _0x263703,
              _0x26f15f = _0x41b103 + _0x36dbbc + _0x263703;
            _0x38b6f8(_0x4202fe, _0x1013f7, _0x8a4e3d, _0x26f15f);
          }
        }
      }
      function _0x56cc05(_0xb6a317, _0x112f32, _0x46a7fa) {
        (_0x16ee64.push(_0xb6a317), _0x16ee64.push(_0x112f32), _0x16ee64.push(_0x46a7fa));
      }
      function _0x1ef219(_0x48a11c, _0x271f32, _0x5b9099) {
        (_0x21ac8f(_0x48a11c), _0x21ac8f(_0x271f32), _0x21ac8f(_0x5b9099));
        const _0x30966c = _0x5bb96c.length / 3,
          _0x10088f = _0x5c36c3.generateTopUV(
            _0x979a3d,
            _0x5bb96c,
            _0x30966c - 3,
            _0x30966c - 2,
            _0x30966c - 1,
          );
        (_0x249954(_0x10088f[0]), _0x249954(_0x10088f[1]), _0x249954(_0x10088f[2]));
      }
      function _0x38b6f8(_0x23a37c, _0x5c6b3d, _0x48c119, _0x10097b) {
        (_0x21ac8f(_0x23a37c),
          _0x21ac8f(_0x5c6b3d),
          _0x21ac8f(_0x10097b),
          _0x21ac8f(_0x5c6b3d),
          _0x21ac8f(_0x48c119),
          _0x21ac8f(_0x10097b));
        const _0x1bef2f = _0x5bb96c.length / 3,
          _0x305272 = _0x5c36c3.generateSideWallUV(
            _0x979a3d,
            _0x5bb96c,
            _0x1bef2f - 6,
            _0x1bef2f - 3,
            _0x1bef2f - 2,
            _0x1bef2f - 1,
          );
        (_0x249954(_0x305272[0]),
          _0x249954(_0x305272[1]),
          _0x249954(_0x305272[3]),
          _0x249954(_0x305272[1]),
          _0x249954(_0x305272[2]),
          _0x249954(_0x305272[3]));
      }
      function _0x21ac8f(_0xf048d9) {
        (_0x5bb96c.push(_0x16ee64[_0xf048d9 * 3 + 0]),
          _0x5bb96c.push(_0x16ee64[_0xf048d9 * 3 + 1]),
          _0x5bb96c.push(_0x16ee64[_0xf048d9 * 3 + 2]));
      }
      function _0x249954(_0x582641) {
        (_0x5e98a9.push(_0x582641.x), _0x5e98a9.push(_0x582641.y));
      }
    }
  }
  ['copy'](_0xcb53cb) {
    return (super.copy(_0xcb53cb), (this.parameters = Object.assign({}, _0xcb53cb.parameters)), this);
  }
  ['toJSON']() {
    const _0x29775d = super.toJSON(),
      _0x1c41f4 = this.parameters.shapes,
      _0x534131 = this.parameters.options;
    return toJSON$1(_0x1c41f4, _0x534131, _0x29775d);
  }
  static ['fromJSON'](_0x4c99a7, _0x18c45f) {
    const _0x2c563d = [];
    for (let _0x548884 = 0, _0x4f9c45 = _0x4c99a7.shapes.length; _0x548884 < _0x4f9c45; _0x548884++) {
      const _0xc87e0c = _0x18c45f[_0x4c99a7.shapes[_0x548884]];
      _0x2c563d.push(_0xc87e0c);
    }
    const _0xfe13ac = _0x4c99a7.options.extrudePath;
    return (
      _0xfe13ac !== undefined &&
        (_0x4c99a7.options.extrudePath = new Curves[_0xfe13ac['type']]().fromJSON(_0xfe13ac)),
      new ExtrudeGeometry(_0x2c563d, _0x4c99a7.options)
    );
  }
}
const WorldUVGenerator = {
  generateTopUV: function (_0x394ad9, _0x5388ef, _0x4acf18, _0x28382b, _0x11a680) {
    const _0x518628 = _0x5388ef[_0x4acf18 * 3],
      _0x284209 = _0x5388ef[_0x4acf18 * 3 + 1],
      _0x43755d = _0x5388ef[_0x28382b * 3],
      _0x209be6 = _0x5388ef[_0x28382b * 3 + 1],
      _0x11f2fd = _0x5388ef[_0x11a680 * 3],
      _0x54d0ee = _0x5388ef[_0x11a680 * 3 + 1];
    return [
      new Vector2(_0x518628, _0x284209),
      new Vector2(_0x43755d, _0x209be6),
      new Vector2(_0x11f2fd, _0x54d0ee),
    ];
  },
  generateSideWallUV: function (_0x436095, _0x52bc53, _0x32648a, _0x4e0657, _0x3a40e6, _0x3e886b) {
    const _0x287b15 = _0x52bc53[_0x32648a * 3],
      _0x1ad119 = _0x52bc53[_0x32648a * 3 + 1],
      _0xe78a47 = _0x52bc53[_0x32648a * 3 + 2],
      _0x25f747 = _0x52bc53[_0x4e0657 * 3],
      _0xb9f34a = _0x52bc53[_0x4e0657 * 3 + 1],
      _0x577224 = _0x52bc53[_0x4e0657 * 3 + 2],
      _0x39c0b7 = _0x52bc53[_0x3a40e6 * 3],
      _0x4c1ddd = _0x52bc53[_0x3a40e6 * 3 + 1],
      _0x24e41e = _0x52bc53[_0x3a40e6 * 3 + 2],
      _0x3e9270 = _0x52bc53[_0x3e886b * 3],
      _0x4730a1 = _0x52bc53[_0x3e886b * 3 + 1],
      _0x2fdbd3 = _0x52bc53[_0x3e886b * 3 + 2];
    return Math.abs(_0x1ad119 - _0xb9f34a) < Math.abs(_0x287b15 - _0x25f747)
      ? [
          new Vector2(_0x287b15, 1 - _0xe78a47),
          new Vector2(_0x25f747, 1 - _0x577224),
          new Vector2(_0x39c0b7, 1 - _0x24e41e),
          new Vector2(_0x3e9270, 1 - _0x2fdbd3),
        ]
      : [
          new Vector2(_0x1ad119, 1 - _0xe78a47),
          new Vector2(_0xb9f34a, 1 - _0x577224),
          new Vector2(_0x4c1ddd, 1 - _0x24e41e),
          new Vector2(_0x4730a1, 1 - _0x2fdbd3),
        ];
  },
};
function toJSON$1(_0x2b3aa8, _0x5c95d9, _0x5bfc00) {
  _0x5bfc00.shapes = [];
  if (Array.isArray(_0x2b3aa8))
    for (let _0x2f141c = 0, _0x5eb96a = _0x2b3aa8.length; _0x2f141c < _0x5eb96a; _0x2f141c++) {
      const _0x3e5452 = _0x2b3aa8[_0x2f141c];
      _0x5bfc00.shapes.push(_0x3e5452.uuid);
    }
  else _0x5bfc00.shapes.push(_0x2b3aa8.uuid);
  _0x5bfc00.options = Object.assign({}, _0x5c95d9);
  if (_0x5c95d9.extrudePath !== undefined) _0x5bfc00.options.extrudePath = _0x5c95d9.extrudePath.toJSON();
  return _0x5bfc00;
}
class IcosahedronGeometry extends PolyhedronGeometry {
  constructor(_0x5a6d41 = 1, _0x3e783c = 0) {
    const _0x36e40c = (1 + Math.sqrt(5)) / 2,
      _0x1afe15 = [
        -1,
        _0x36e40c,
        0,
        1,
        _0x36e40c,
        0,
        -1,
        -_0x36e40c,
        0,
        1,
        -_0x36e40c,
        0,
        0,
        -1,
        _0x36e40c,
        0,
        1,
        _0x36e40c,
        0,
        -1,
        -_0x36e40c,
        0,
        1,
        -_0x36e40c,
        _0x36e40c,
        0,
        -1,
        _0x36e40c,
        0,
        1,
        -_0x36e40c,
        0,
        -1,
        -_0x36e40c,
        0,
        1,
      ],
      _0x2869c5 = [
        0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11, 1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8, 3,
        9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9, 4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1,
      ];
    (super(_0x1afe15, _0x2869c5, _0x5a6d41, _0x3e783c),
      (this.type = 'IcosahedronGeometry'),
      (this.parameters = { radius: _0x5a6d41, detail: _0x3e783c }));
  }
  static ['fromJSON'](_0x551c7f) {
    return new IcosahedronGeometry(_0x551c7f.radius, _0x551c7f.detail);
  }
}
class LatheGeometry extends BufferGeometry {
  constructor(
    _0x4c2bd5 = [new Vector2(0, -0.5), new Vector2(0.5, 0), new Vector2(0, 0.5)],
    _0x32edac = 12,
    _0x11d011 = 0,
    _0x214dcc = Math.PI * 2,
  ) {
    (super(),
      (this.type = 'LatheGeometry'),
      (this.parameters = {
        points: _0x4c2bd5,
        segments: _0x32edac,
        phiStart: _0x11d011,
        phiLength: _0x214dcc,
      }),
      (_0x32edac = Math.floor(_0x32edac)),
      (_0x214dcc = clamp(_0x214dcc, 0, Math.PI * 2)));
    const _0x5501c0 = [],
      _0x33d05f = [],
      _0x3ed086 = [],
      _0x365c50 = [],
      _0x3a19df = [],
      _0xcb509d = 1 / _0x32edac,
      _0x4fd590 = new Vector3(),
      _0x511290 = new Vector2(),
      _0x4c9ead = new Vector3(),
      _0x35cef7 = new Vector3(),
      _0x351a04 = new Vector3();
    let _0x1edc42 = 0,
      _0x28e25e = 0;
    for (let _0x48474e = 0; _0x48474e <= _0x4c2bd5.length - 1; _0x48474e++) {
      switch (_0x48474e) {
        case 0:
          ((_0x1edc42 = _0x4c2bd5[_0x48474e + 1].x - _0x4c2bd5[_0x48474e].x),
            (_0x28e25e = _0x4c2bd5[_0x48474e + 1].y - _0x4c2bd5[_0x48474e].y),
            (_0x4c9ead.x = _0x28e25e * 1),
            (_0x4c9ead.y = -_0x1edc42),
            (_0x4c9ead.z = _0x28e25e * 0),
            _0x351a04.copy(_0x4c9ead),
            _0x4c9ead.normalize(),
            _0x365c50.push(_0x4c9ead.x, _0x4c9ead.y, _0x4c9ead.z));
          break;
        case _0x4c2bd5.length - 1:
          _0x365c50.push(_0x351a04.x, _0x351a04.y, _0x351a04.z);
          break;
        default:
          ((_0x1edc42 = _0x4c2bd5[_0x48474e + 1].x - _0x4c2bd5[_0x48474e].x),
            (_0x28e25e = _0x4c2bd5[_0x48474e + 1].y - _0x4c2bd5[_0x48474e].y),
            (_0x4c9ead.x = _0x28e25e * 1),
            (_0x4c9ead.y = -_0x1edc42),
            (_0x4c9ead.z = _0x28e25e * 0),
            _0x35cef7.copy(_0x4c9ead),
            (_0x4c9ead.x += _0x351a04.x),
            (_0x4c9ead.y += _0x351a04.y),
            (_0x4c9ead.z += _0x351a04.z),
            _0x4c9ead.normalize(),
            _0x365c50.push(_0x4c9ead.x, _0x4c9ead.y, _0x4c9ead.z),
            _0x351a04.copy(_0x35cef7));
      }
    }
    for (let _0x1f667d = 0; _0x1f667d <= _0x32edac; _0x1f667d++) {
      const _0x43cb80 = _0x11d011 + _0x1f667d * _0xcb509d * _0x214dcc,
        _0x2a9746 = Math.sin(_0x43cb80),
        _0x40ed1c = Math.cos(_0x43cb80);
      for (let _0x170a99 = 0; _0x170a99 <= _0x4c2bd5.length - 1; _0x170a99++) {
        ((_0x4fd590.x = _0x4c2bd5[_0x170a99].x * _0x2a9746),
          (_0x4fd590.y = _0x4c2bd5[_0x170a99].y),
          (_0x4fd590.z = _0x4c2bd5[_0x170a99].x * _0x40ed1c),
          _0x33d05f.push(_0x4fd590.x, _0x4fd590.y, _0x4fd590.z),
          (_0x511290.x = _0x1f667d / _0x32edac),
          (_0x511290.y = _0x170a99 / (_0x4c2bd5.length - 1)),
          _0x3ed086.push(_0x511290.x, _0x511290.y));
        const _0x5b0515 = _0x365c50[3 * _0x170a99 + 0] * _0x2a9746,
          _0x44f2cf = _0x365c50[3 * _0x170a99 + 1],
          _0x17d045 = _0x365c50[3 * _0x170a99 + 0] * _0x40ed1c;
        _0x3a19df.push(_0x5b0515, _0x44f2cf, _0x17d045);
      }
    }
    for (let _0x3c693d = 0; _0x3c693d < _0x32edac; _0x3c693d++) {
      for (let _0x4b844d = 0; _0x4b844d < _0x4c2bd5.length - 1; _0x4b844d++) {
        const _0x6e399e = _0x4b844d + _0x3c693d * _0x4c2bd5.length,
          _0x55e45d = _0x6e399e,
          _0x2d8f72 = _0x6e399e + _0x4c2bd5.length,
          _0x13286d = _0x6e399e + _0x4c2bd5.length + 1,
          _0x2b5b7d = _0x6e399e + 1;
        (_0x5501c0.push(_0x55e45d, _0x2d8f72, _0x2b5b7d), _0x5501c0.push(_0x13286d, _0x2b5b7d, _0x2d8f72));
      }
    }
    (this.setIndex(_0x5501c0),
      this.setAttribute('position', new Float32BufferAttribute(_0x33d05f, 3)),
      this.setAttribute('uv', new Float32BufferAttribute(_0x3ed086, 2)),
      this.setAttribute('normal', new Float32BufferAttribute(_0x3a19df, 3)));
  }
  ['copy'](_0x348015) {
    return (super.copy(_0x348015), (this.parameters = Object.assign({}, _0x348015.parameters)), this);
  }
  static ['fromJSON'](_0x2073d4) {
    return new LatheGeometry(_0x2073d4.points, _0x2073d4.segments, _0x2073d4.phiStart, _0x2073d4.phiLength);
  }
}
class OctahedronGeometry extends PolyhedronGeometry {
  constructor(_0xa0652b = 1, _0x4d74b7 = 0) {
    const _0x507950 = [1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1],
      _0x6f4462 = [0, 2, 4, 0, 4, 3, 0, 3, 5, 0, 5, 2, 1, 2, 5, 1, 5, 3, 1, 3, 4, 1, 4, 2];
    (super(_0x507950, _0x6f4462, _0xa0652b, _0x4d74b7),
      (this.type = 'OctahedronGeometry'),
      (this.parameters = { radius: _0xa0652b, detail: _0x4d74b7 }));
  }
  static ['fromJSON'](_0x34c87b) {
    return new OctahedronGeometry(_0x34c87b.radius, _0x34c87b.detail);
  }
}
class PlaneGeometry extends BufferGeometry {
  constructor(_0x2a2320 = 1, _0x10f61a = 1, _0x3f9df0 = 1, _0x1d0ec7 = 1) {
    (super(),
      (this.type = 'PlaneGeometry'),
      (this.parameters = {
        width: _0x2a2320,
        height: _0x10f61a,
        widthSegments: _0x3f9df0,
        heightSegments: _0x1d0ec7,
      }));
    const _0x572874 = _0x2a2320 / 2,
      _0xd9abb7 = _0x10f61a / 2,
      _0x58e46a = Math.floor(_0x3f9df0),
      _0x3f406e = Math.floor(_0x1d0ec7),
      _0x142142 = _0x58e46a + 1,
      _0x17e27c = _0x3f406e + 1,
      _0xd76110 = _0x2a2320 / _0x58e46a,
      _0x2b0264 = _0x10f61a / _0x3f406e,
      _0x51d584 = [],
      _0x58127d = [],
      _0xe41a1d = [],
      _0x1a37dc = [];
    for (let _0x45a59e = 0; _0x45a59e < _0x17e27c; _0x45a59e++) {
      const _0x1ef1ae = _0x45a59e * _0x2b0264 - _0xd9abb7;
      for (let _0x5eaba2 = 0; _0x5eaba2 < _0x142142; _0x5eaba2++) {
        const _0x2c95e9 = _0x5eaba2 * _0xd76110 - _0x572874;
        (_0x58127d.push(_0x2c95e9, -_0x1ef1ae, 0),
          _0xe41a1d.push(0, 0, 1),
          _0x1a37dc.push(_0x5eaba2 / _0x58e46a),
          _0x1a37dc.push(1 - _0x45a59e / _0x3f406e));
      }
    }
    for (let _0x141220 = 0; _0x141220 < _0x3f406e; _0x141220++) {
      for (let _0x2909b9 = 0; _0x2909b9 < _0x58e46a; _0x2909b9++) {
        const _0x5b7931 = _0x2909b9 + _0x142142 * _0x141220,
          _0xe0033c = _0x2909b9 + _0x142142 * (_0x141220 + 1),
          _0x2fbbee = _0x2909b9 + 1 + _0x142142 * (_0x141220 + 1),
          _0x452184 = _0x2909b9 + 1 + _0x142142 * _0x141220;
        (_0x51d584.push(_0x5b7931, _0xe0033c, _0x452184), _0x51d584.push(_0xe0033c, _0x2fbbee, _0x452184));
      }
    }
    (this.setIndex(_0x51d584),
      this.setAttribute('position', new Float32BufferAttribute(_0x58127d, 3)),
      this.setAttribute('normal', new Float32BufferAttribute(_0xe41a1d, 3)),
      this.setAttribute('uv', new Float32BufferAttribute(_0x1a37dc, 2)));
  }
  ['copy'](_0x333433) {
    return (super.copy(_0x333433), (this.parameters = Object.assign({}, _0x333433.parameters)), this);
  }
  static ['fromJSON'](_0x3e4ded) {
    return new PlaneGeometry(
      _0x3e4ded.width,
      _0x3e4ded.height,
      _0x3e4ded.widthSegments,
      _0x3e4ded.heightSegments,
    );
  }
}
class RingGeometry extends BufferGeometry {
  constructor(
    _0x3e9213 = 0.5,
    _0x30697d = 1,
    _0x14db78 = 32,
    _0x22a788 = 1,
    _0xae23a8 = 0,
    _0xc1986a = Math.PI * 2,
  ) {
    (super(),
      (this.type = 'RingGeometry'),
      (this.parameters = {
        innerRadius: _0x3e9213,
        outerRadius: _0x30697d,
        thetaSegments: _0x14db78,
        phiSegments: _0x22a788,
        thetaStart: _0xae23a8,
        thetaLength: _0xc1986a,
      }),
      (_0x14db78 = Math.max(3, _0x14db78)),
      (_0x22a788 = Math.max(1, _0x22a788)));
    const _0x4eced4 = [],
      _0x357033 = [],
      _0x5488f9 = [],
      _0x4cf134 = [];
    let _0x26f7a3 = _0x3e9213;
    const _0x143650 = (_0x30697d - _0x3e9213) / _0x22a788,
      _0x15ed54 = new Vector3(),
      _0x2e2255 = new Vector2();
    for (let _0x1d383d = 0; _0x1d383d <= _0x22a788; _0x1d383d++) {
      for (let _0x99aad4 = 0; _0x99aad4 <= _0x14db78; _0x99aad4++) {
        const _0x56ca56 = _0xae23a8 + (_0x99aad4 / _0x14db78) * _0xc1986a;
        ((_0x15ed54.x = _0x26f7a3 * Math.cos(_0x56ca56)),
          (_0x15ed54.y = _0x26f7a3 * Math.sin(_0x56ca56)),
          _0x357033.push(_0x15ed54.x, _0x15ed54.y, _0x15ed54.z),
          _0x5488f9.push(0, 0, 1),
          (_0x2e2255.x = (_0x15ed54.x / _0x30697d + 1) / 2),
          (_0x2e2255.y = (_0x15ed54.y / _0x30697d + 1) / 2),
          _0x4cf134.push(_0x2e2255.x, _0x2e2255.y));
      }
      _0x26f7a3 += _0x143650;
    }
    for (let _0x15e3e1 = 0; _0x15e3e1 < _0x22a788; _0x15e3e1++) {
      const _0x15092c = _0x15e3e1 * (_0x14db78 + 1);
      for (let _0x14edd5 = 0; _0x14edd5 < _0x14db78; _0x14edd5++) {
        const _0x1762fb = _0x14edd5 + _0x15092c,
          _0x4dd566 = _0x1762fb,
          _0x17bee5 = _0x1762fb + _0x14db78 + 1,
          _0x36420c = _0x1762fb + _0x14db78 + 2,
          _0x100ef5 = _0x1762fb + 1;
        (_0x4eced4.push(_0x4dd566, _0x17bee5, _0x100ef5), _0x4eced4.push(_0x17bee5, _0x36420c, _0x100ef5));
      }
    }
    (this.setIndex(_0x4eced4),
      this.setAttribute('position', new Float32BufferAttribute(_0x357033, 3)),
      this.setAttribute('normal', new Float32BufferAttribute(_0x5488f9, 3)),
      this.setAttribute('uv', new Float32BufferAttribute(_0x4cf134, 2)));
  }
  ['copy'](_0x51e930) {
    return (super.copy(_0x51e930), (this.parameters = Object.assign({}, _0x51e930.parameters)), this);
  }
  static ['fromJSON'](_0x3e5375) {
    return new RingGeometry(
      _0x3e5375.innerRadius,
      _0x3e5375.outerRadius,
      _0x3e5375.thetaSegments,
      _0x3e5375.phiSegments,
      _0x3e5375.thetaStart,
      _0x3e5375.thetaLength,
    );
  }
}
class ShapeGeometry extends BufferGeometry {
  constructor(
    _0x1bb02f = new Shape([new Vector2(0, 0.5), new Vector2(-0.5, -0.5), new Vector2(0.5, -0.5)]),
    _0xba79e0 = 12,
  ) {
    (super(),
      (this.type = 'ShapeGeometry'),
      (this.parameters = { shapes: _0x1bb02f, curveSegments: _0xba79e0 }));
    const _0x3551c7 = [],
      _0x4c8946 = [],
      _0xef5f08 = [],
      _0x33eaf8 = [];
    let _0x3cb9e0 = 0,
      _0x5ed39e = 0;
    if (Array.isArray(_0x1bb02f) === false) _0x55738d(_0x1bb02f);
    else
      for (let _0x2c32b7 = 0; _0x2c32b7 < _0x1bb02f.length; _0x2c32b7++) {
        (_0x55738d(_0x1bb02f[_0x2c32b7]),
          this.addGroup(_0x3cb9e0, _0x5ed39e, _0x2c32b7),
          (_0x3cb9e0 += _0x5ed39e),
          (_0x5ed39e = 0));
      }
    (this.setIndex(_0x3551c7),
      this.setAttribute('position', new Float32BufferAttribute(_0x4c8946, 3)),
      this.setAttribute('normal', new Float32BufferAttribute(_0xef5f08, 3)),
      this.setAttribute('uv', new Float32BufferAttribute(_0x33eaf8, 2)));
    function _0x55738d(_0x275412) {
      const _0x859f79 = _0x4c8946.length / 3,
        _0x551baa = _0x275412.extractPoints(_0xba79e0);
      let _0x779434 = _0x551baa.shape;
      const _0x1d2861 = _0x551baa.holes;
      ShapeUtils.isClockWise(_0x779434) === false && (_0x779434 = _0x779434.reverse());
      for (let _0x552662 = 0, _0x370241 = _0x1d2861.length; _0x552662 < _0x370241; _0x552662++) {
        const _0x33b867 = _0x1d2861[_0x552662];
        ShapeUtils.isClockWise(_0x33b867) === true && (_0x1d2861[_0x552662] = _0x33b867.reverse());
      }
      const _0x3781ab = ShapeUtils.triangulateShape(_0x779434, _0x1d2861);
      for (let _0x5e15e5 = 0, _0x254f18 = _0x1d2861.length; _0x5e15e5 < _0x254f18; _0x5e15e5++) {
        const _0x55e9e6 = _0x1d2861[_0x5e15e5];
        _0x779434 = _0x779434.concat(_0x55e9e6);
      }
      for (let _0x2b7e21 = 0, _0x4261f6 = _0x779434.length; _0x2b7e21 < _0x4261f6; _0x2b7e21++) {
        const _0x5c2ac2 = _0x779434[_0x2b7e21];
        (_0x4c8946.push(_0x5c2ac2.x, _0x5c2ac2.y, 0),
          _0xef5f08.push(0, 0, 1),
          _0x33eaf8.push(_0x5c2ac2.x, _0x5c2ac2.y));
      }
      for (let _0x33eee4 = 0, _0x5407c0 = _0x3781ab.length; _0x33eee4 < _0x5407c0; _0x33eee4++) {
        const _0x5544cf = _0x3781ab[_0x33eee4],
          _0x4b3ae6 = _0x5544cf[0] + _0x859f79,
          _0x4c25fb = _0x5544cf[1] + _0x859f79,
          _0x4061f8 = _0x5544cf[2] + _0x859f79;
        (_0x3551c7.push(_0x4b3ae6, _0x4c25fb, _0x4061f8), (_0x5ed39e += 3));
      }
    }
  }
  ['copy'](_0x531088) {
    return (super.copy(_0x531088), (this.parameters = Object.assign({}, _0x531088.parameters)), this);
  }
  ['toJSON']() {
    const _0x4c79f4 = super.toJSON(),
      _0x35c155 = this.parameters.shapes;
    return toJSON(_0x35c155, _0x4c79f4);
  }
  static ['fromJSON'](_0x1d00d0, _0x557653) {
    const _0x208c4b = [];
    for (let _0x955e43 = 0, _0x5f6cfd = _0x1d00d0.shapes.length; _0x955e43 < _0x5f6cfd; _0x955e43++) {
      const _0x29b235 = _0x557653[_0x1d00d0.shapes[_0x955e43]];
      _0x208c4b.push(_0x29b235);
    }
    return new ShapeGeometry(_0x208c4b, _0x1d00d0.curveSegments);
  }
}
function toJSON(_0x1afe26, _0x210a20) {
  _0x210a20.shapes = [];
  if (Array.isArray(_0x1afe26))
    for (let _0x2604b5 = 0, _0x5e8cac = _0x1afe26.length; _0x2604b5 < _0x5e8cac; _0x2604b5++) {
      const _0x241540 = _0x1afe26[_0x2604b5];
      _0x210a20.shapes.push(_0x241540.uuid);
    }
  else _0x210a20.shapes.push(_0x1afe26.uuid);
  return _0x210a20;
}
class SphereGeometry extends BufferGeometry {
  constructor(
    _0x5eeb52 = 1,
    _0x224259 = 32,
    _0x4c3c36 = 16,
    _0x194f4e = 0,
    _0x1561ca = Math.PI * 2,
    _0x42f06a = 0,
    _0x1d5bc3 = Math.PI,
  ) {
    (super(),
      (this.type = 'SphereGeometry'),
      (this.parameters = {
        radius: _0x5eeb52,
        widthSegments: _0x224259,
        heightSegments: _0x4c3c36,
        phiStart: _0x194f4e,
        phiLength: _0x1561ca,
        thetaStart: _0x42f06a,
        thetaLength: _0x1d5bc3,
      }),
      (_0x224259 = Math.max(3, Math.floor(_0x224259))),
      (_0x4c3c36 = Math.max(2, Math.floor(_0x4c3c36))));
    const _0x1c104c = Math.min(_0x42f06a + _0x1d5bc3, Math.PI);
    let _0x2f2955 = 0;
    const _0x3e8bcf = [],
      _0x5bc254 = new Vector3(),
      _0x58766d = new Vector3(),
      _0x2cbe39 = [],
      _0xe21cd1 = [],
      _0x1c3bcd = [],
      _0x345e80 = [];
    for (let _0x17d2e1 = 0; _0x17d2e1 <= _0x4c3c36; _0x17d2e1++) {
      const _0x4d4e40 = [],
        _0x3adf37 = _0x17d2e1 / _0x4c3c36;
      let _0x4039b4 = 0;
      if (_0x17d2e1 === 0 && _0x42f06a === 0) _0x4039b4 = 0.5 / _0x224259;
      else _0x17d2e1 === _0x4c3c36 && _0x1c104c === Math.PI && (_0x4039b4 = -0.5 / _0x224259);
      for (let _0x21f92c = 0; _0x21f92c <= _0x224259; _0x21f92c++) {
        const _0x22c60f = _0x21f92c / _0x224259;
        ((_0x5bc254.x =
          -_0x5eeb52 *
          Math.cos(_0x194f4e + _0x22c60f * _0x1561ca) *
          Math.sin(_0x42f06a + _0x3adf37 * _0x1d5bc3)),
          (_0x5bc254.y = _0x5eeb52 * Math.cos(_0x42f06a + _0x3adf37 * _0x1d5bc3)),
          (_0x5bc254.z =
            _0x5eeb52 *
            Math.sin(_0x194f4e + _0x22c60f * _0x1561ca) *
            Math.sin(_0x42f06a + _0x3adf37 * _0x1d5bc3)),
          _0xe21cd1.push(_0x5bc254.x, _0x5bc254.y, _0x5bc254.z),
          _0x58766d.copy(_0x5bc254).normalize(),
          _0x1c3bcd.push(_0x58766d.x, _0x58766d.y, _0x58766d.z),
          _0x345e80.push(_0x22c60f + _0x4039b4, 1 - _0x3adf37),
          _0x4d4e40.push(_0x2f2955++));
      }
      _0x3e8bcf.push(_0x4d4e40);
    }
    for (let _0x1b030f = 0; _0x1b030f < _0x4c3c36; _0x1b030f++) {
      for (let _0x58ca6e = 0; _0x58ca6e < _0x224259; _0x58ca6e++) {
        const _0x137c8a = _0x3e8bcf[_0x1b030f][_0x58ca6e + 1],
          _0x1f8374 = _0x3e8bcf[_0x1b030f][_0x58ca6e],
          _0x169561 = _0x3e8bcf[_0x1b030f + 1][_0x58ca6e],
          _0x4504bc = _0x3e8bcf[_0x1b030f + 1][_0x58ca6e + 1];
        if (_0x1b030f !== 0 || _0x42f06a > 0) _0x2cbe39.push(_0x137c8a, _0x1f8374, _0x4504bc);
        if (_0x1b030f !== _0x4c3c36 - 1 || _0x1c104c < Math.PI)
          _0x2cbe39.push(_0x1f8374, _0x169561, _0x4504bc);
      }
    }
    (this.setIndex(_0x2cbe39),
      this.setAttribute('position', new Float32BufferAttribute(_0xe21cd1, 3)),
      this.setAttribute('normal', new Float32BufferAttribute(_0x1c3bcd, 3)),
      this.setAttribute('uv', new Float32BufferAttribute(_0x345e80, 2)));
  }
  ['copy'](_0x1efeba) {
    return (super.copy(_0x1efeba), (this.parameters = Object.assign({}, _0x1efeba.parameters)), this);
  }
  static ['fromJSON'](_0x3d6755) {
    return new SphereGeometry(
      _0x3d6755.radius,
      _0x3d6755.widthSegments,
      _0x3d6755.heightSegments,
      _0x3d6755.phiStart,
      _0x3d6755.phiLength,
      _0x3d6755.thetaStart,
      _0x3d6755.thetaLength,
    );
  }
}
class TetrahedronGeometry extends PolyhedronGeometry {
  constructor(_0xca427b = 1, _0x1e9952 = 0) {
    const _0x51f3c0 = [1, 1, 1, -1, -1, 1, -1, 1, -1, 1, -1, -1],
      _0x565bb2 = [2, 1, 0, 0, 3, 2, 1, 3, 0, 2, 3, 1];
    (super(_0x51f3c0, _0x565bb2, _0xca427b, _0x1e9952),
      (this.type = 'TetrahedronGeometry'),
      (this.parameters = { radius: _0xca427b, detail: _0x1e9952 }));
  }
  static ['fromJSON'](_0x3845a3) {
    return new TetrahedronGeometry(_0x3845a3.radius, _0x3845a3.detail);
  }
}
class TorusGeometry extends BufferGeometry {
  constructor(_0x157a19 = 1, _0x4ee9a7 = 0.4, _0x9fbb8e = 12, _0x14dd11 = 48, _0x3ee390 = Math.PI * 2) {
    (super(),
      (this.type = 'TorusGeometry'),
      (this.parameters = {
        radius: _0x157a19,
        tube: _0x4ee9a7,
        radialSegments: _0x9fbb8e,
        tubularSegments: _0x14dd11,
        arc: _0x3ee390,
      }),
      (_0x9fbb8e = Math.floor(_0x9fbb8e)),
      (_0x14dd11 = Math.floor(_0x14dd11)));
    const _0x511f55 = [],
      _0x9ce6c2 = [],
      _0x36aebd = [],
      _0x53498b = [],
      _0x8baf28 = new Vector3(),
      _0x25cd82 = new Vector3(),
      _0x4da96f = new Vector3();
    for (let _0x26326d = 0; _0x26326d <= _0x9fbb8e; _0x26326d++) {
      for (let _0x1f6952 = 0; _0x1f6952 <= _0x14dd11; _0x1f6952++) {
        const _0x55f3e3 = (_0x1f6952 / _0x14dd11) * _0x3ee390,
          _0x260958 = (_0x26326d / _0x9fbb8e) * Math.PI * 2;
        ((_0x25cd82.x = (_0x157a19 + _0x4ee9a7 * Math.cos(_0x260958)) * Math.cos(_0x55f3e3)),
          (_0x25cd82.y = (_0x157a19 + _0x4ee9a7 * Math.cos(_0x260958)) * Math.sin(_0x55f3e3)),
          (_0x25cd82.z = _0x4ee9a7 * Math.sin(_0x260958)),
          _0x9ce6c2.push(_0x25cd82.x, _0x25cd82.y, _0x25cd82.z),
          (_0x8baf28.x = _0x157a19 * Math.cos(_0x55f3e3)),
          (_0x8baf28.y = _0x157a19 * Math.sin(_0x55f3e3)),
          _0x4da96f.subVectors(_0x25cd82, _0x8baf28).normalize(),
          _0x36aebd.push(_0x4da96f.x, _0x4da96f.y, _0x4da96f.z),
          _0x53498b.push(_0x1f6952 / _0x14dd11),
          _0x53498b.push(_0x26326d / _0x9fbb8e));
      }
    }
    for (let _0x10c4fc = 1; _0x10c4fc <= _0x9fbb8e; _0x10c4fc++) {
      for (let _0x5c5093 = 1; _0x5c5093 <= _0x14dd11; _0x5c5093++) {
        const _0x3241fb = (_0x14dd11 + 1) * _0x10c4fc + _0x5c5093 - 1,
          _0x29b7e6 = (_0x14dd11 + 1) * (_0x10c4fc - 1) + _0x5c5093 - 1,
          _0x39aca2 = (_0x14dd11 + 1) * (_0x10c4fc - 1) + _0x5c5093,
          _0xeb5994 = (_0x14dd11 + 1) * _0x10c4fc + _0x5c5093;
        (_0x511f55.push(_0x3241fb, _0x29b7e6, _0xeb5994), _0x511f55.push(_0x29b7e6, _0x39aca2, _0xeb5994));
      }
    }
    (this.setIndex(_0x511f55),
      this.setAttribute('position', new Float32BufferAttribute(_0x9ce6c2, 3)),
      this.setAttribute('normal', new Float32BufferAttribute(_0x36aebd, 3)),
      this.setAttribute('uv', new Float32BufferAttribute(_0x53498b, 2)));
  }
  ['copy'](_0x307b0d) {
    return (super.copy(_0x307b0d), (this.parameters = Object.assign({}, _0x307b0d.parameters)), this);
  }
  static ['fromJSON'](_0x52027c) {
    return new TorusGeometry(
      _0x52027c.radius,
      _0x52027c.tube,
      _0x52027c.radialSegments,
      _0x52027c.tubularSegments,
      _0x52027c.arc,
    );
  }
}
class TorusKnotGeometry extends BufferGeometry {
  constructor(_0x39e211 = 1, _0x43cc2b = 0.4, _0x290bfd = 64, _0xae29f8 = 8, _0x171a23 = 2, _0x10f359 = 3) {
    (super(),
      (this.type = 'TorusKnotGeometry'),
      (this.parameters = {
        radius: _0x39e211,
        tube: _0x43cc2b,
        tubularSegments: _0x290bfd,
        radialSegments: _0xae29f8,
        p: _0x171a23,
        q: _0x10f359,
      }),
      (_0x290bfd = Math.floor(_0x290bfd)),
      (_0xae29f8 = Math.floor(_0xae29f8)));
    const _0x4b82a4 = [],
      _0x46ec35 = [],
      _0x458d98 = [],
      _0x1ecdb2 = [],
      _0x10459a = new Vector3(),
      _0x3a37db = new Vector3(),
      _0x442a9c = new Vector3(),
      _0x4be742 = new Vector3(),
      _0x26a5b8 = new Vector3(),
      _0x4e8da9 = new Vector3(),
      _0x2663ba = new Vector3();
    for (let _0x2432e8 = 0; _0x2432e8 <= _0x290bfd; ++_0x2432e8) {
      const _0x3a01f7 = (_0x2432e8 / _0x290bfd) * _0x171a23 * Math.PI * 2;
      (_0xab8f56(_0x3a01f7, _0x171a23, _0x10f359, _0x39e211, _0x442a9c),
        _0xab8f56(_0x3a01f7 + 0.01, _0x171a23, _0x10f359, _0x39e211, _0x4be742),
        _0x4e8da9.subVectors(_0x4be742, _0x442a9c),
        _0x2663ba.addVectors(_0x4be742, _0x442a9c),
        _0x26a5b8.crossVectors(_0x4e8da9, _0x2663ba),
        _0x2663ba.crossVectors(_0x26a5b8, _0x4e8da9),
        _0x26a5b8.normalize(),
        _0x2663ba.normalize());
      for (let _0x420373 = 0; _0x420373 <= _0xae29f8; ++_0x420373) {
        const _0x5caf89 = (_0x420373 / _0xae29f8) * Math.PI * 2,
          _0x2baa03 = -_0x43cc2b * Math.cos(_0x5caf89),
          _0x3ea7c1 = _0x43cc2b * Math.sin(_0x5caf89);
        ((_0x10459a.x = _0x442a9c.x + (_0x2baa03 * _0x2663ba.x + _0x3ea7c1 * _0x26a5b8.x)),
          (_0x10459a.y = _0x442a9c.y + (_0x2baa03 * _0x2663ba.y + _0x3ea7c1 * _0x26a5b8.y)),
          (_0x10459a.z = _0x442a9c.z + (_0x2baa03 * _0x2663ba.z + _0x3ea7c1 * _0x26a5b8.z)),
          _0x46ec35.push(_0x10459a.x, _0x10459a.y, _0x10459a.z),
          _0x3a37db.subVectors(_0x10459a, _0x442a9c).normalize(),
          _0x458d98.push(_0x3a37db.x, _0x3a37db.y, _0x3a37db.z),
          _0x1ecdb2.push(_0x2432e8 / _0x290bfd),
          _0x1ecdb2.push(_0x420373 / _0xae29f8));
      }
    }
    for (let _0x3a48ec = 1; _0x3a48ec <= _0x290bfd; _0x3a48ec++) {
      for (let _0x45321a = 1; _0x45321a <= _0xae29f8; _0x45321a++) {
        const _0x5d7f0e = (_0xae29f8 + 1) * (_0x3a48ec - 1) + (_0x45321a - 1),
          _0x3a455a = (_0xae29f8 + 1) * _0x3a48ec + (_0x45321a - 1),
          _0x546de8 = (_0xae29f8 + 1) * _0x3a48ec + _0x45321a,
          _0x387236 = (_0xae29f8 + 1) * (_0x3a48ec - 1) + _0x45321a;
        (_0x4b82a4.push(_0x5d7f0e, _0x3a455a, _0x387236), _0x4b82a4.push(_0x3a455a, _0x546de8, _0x387236));
      }
    }
    (this.setIndex(_0x4b82a4),
      this.setAttribute('position', new Float32BufferAttribute(_0x46ec35, 3)),
      this.setAttribute('normal', new Float32BufferAttribute(_0x458d98, 3)),
      this.setAttribute('uv', new Float32BufferAttribute(_0x1ecdb2, 2)));
    function _0xab8f56(_0x16ddb4, _0x5522ef, _0x239dc2, _0x36772f, _0x3a7827) {
      const _0x41a363 = Math.cos(_0x16ddb4),
        _0x302101 = Math.sin(_0x16ddb4),
        _0x5232dc = (_0x239dc2 / _0x5522ef) * _0x16ddb4,
        _0xef05a7 = Math.cos(_0x5232dc);
      ((_0x3a7827.x = _0x36772f * (2 + _0xef05a7) * 0.5 * _0x41a363),
        (_0x3a7827.y = _0x36772f * (2 + _0xef05a7) * _0x302101 * 0.5),
        (_0x3a7827.z = _0x36772f * Math.sin(_0x5232dc) * 0.5));
    }
  }
  ['copy'](_0x3bea7b) {
    return (super.copy(_0x3bea7b), (this.parameters = Object.assign({}, _0x3bea7b.parameters)), this);
  }
  static ['fromJSON'](_0x24d956) {
    return new TorusKnotGeometry(
      _0x24d956.radius,
      _0x24d956.tube,
      _0x24d956.tubularSegments,
      _0x24d956.radialSegments,
      _0x24d956.p,
      _0x24d956.q,
    );
  }
}
class TubeGeometry extends BufferGeometry {
  constructor(
    _0x3a02c5 = new QuadraticBezierCurve3(
      new Vector3(-1, -1, 0),
      new Vector3(-1, 1, 0),
      new Vector3(1, 1, 0),
    ),
    _0x581711 = 64,
    _0x3d013e = 1,
    _0x1a4e7b = 8,
    _0x2d0df8 = false,
  ) {
    (super(),
      (this.type = 'TubeGeometry'),
      (this.parameters = {
        path: _0x3a02c5,
        tubularSegments: _0x581711,
        radius: _0x3d013e,
        radialSegments: _0x1a4e7b,
        closed: _0x2d0df8,
      }));
    const _0x19a3f4 = _0x3a02c5.computeFrenetFrames(_0x581711, _0x2d0df8);
    ((this.tangents = _0x19a3f4.tangents),
      (this.normals = _0x19a3f4.normals),
      (this.binormals = _0x19a3f4.binormals));
    const _0x738db5 = new Vector3(),
      _0x2d0cef = new Vector3(),
      _0x43ea27 = new Vector2();
    let _0x222880 = new Vector3();
    const _0x30a571 = [],
      _0x32a8d0 = [],
      _0x2596e2 = [],
      _0x49edb7 = [];
    (_0x3b2334(),
      this.setIndex(_0x49edb7),
      this.setAttribute('position', new Float32BufferAttribute(_0x30a571, 3)),
      this.setAttribute('normal', new Float32BufferAttribute(_0x32a8d0, 3)),
      this.setAttribute('uv', new Float32BufferAttribute(_0x2596e2, 2)));
    function _0x3b2334() {
      for (let _0x32c3fb = 0; _0x32c3fb < _0x581711; _0x32c3fb++) {
        _0x31544e(_0x32c3fb);
      }
      (_0x31544e(_0x2d0df8 === false ? _0x581711 : 0), _0x58f630(), _0x28cb38());
    }
    function _0x31544e(_0x261231) {
      _0x222880 = _0x3a02c5.getPointAt(_0x261231 / _0x581711, _0x222880);
      const _0x493e93 = _0x19a3f4.normals[_0x261231],
        _0x1ca598 = _0x19a3f4.binormals[_0x261231];
      for (let _0x54a792 = 0; _0x54a792 <= _0x1a4e7b; _0x54a792++) {
        const _0xb10b4d = (_0x54a792 / _0x1a4e7b) * Math.PI * 2,
          _0x2cf607 = Math.sin(_0xb10b4d),
          _0x1f0be8 = -Math.cos(_0xb10b4d);
        ((_0x2d0cef.x = _0x1f0be8 * _0x493e93.x + _0x2cf607 * _0x1ca598.x),
          (_0x2d0cef.y = _0x1f0be8 * _0x493e93.y + _0x2cf607 * _0x1ca598.y),
          (_0x2d0cef.z = _0x1f0be8 * _0x493e93.z + _0x2cf607 * _0x1ca598.z),
          _0x2d0cef.normalize(),
          _0x32a8d0.push(_0x2d0cef.x, _0x2d0cef.y, _0x2d0cef.z),
          (_0x738db5.x = _0x222880.x + _0x3d013e * _0x2d0cef.x),
          (_0x738db5.y = _0x222880.y + _0x3d013e * _0x2d0cef.y),
          (_0x738db5.z = _0x222880.z + _0x3d013e * _0x2d0cef.z),
          _0x30a571.push(_0x738db5.x, _0x738db5.y, _0x738db5.z));
      }
    }
    function _0x28cb38() {
      for (let _0x1f395b = 1; _0x1f395b <= _0x581711; _0x1f395b++) {
        for (let _0x4c87e0 = 1; _0x4c87e0 <= _0x1a4e7b; _0x4c87e0++) {
          const _0x167ee5 = (_0x1a4e7b + 1) * (_0x1f395b - 1) + (_0x4c87e0 - 1),
            _0x43b3fd = (_0x1a4e7b + 1) * _0x1f395b + (_0x4c87e0 - 1),
            _0x22b282 = (_0x1a4e7b + 1) * _0x1f395b + _0x4c87e0,
            _0x57652a = (_0x1a4e7b + 1) * (_0x1f395b - 1) + _0x4c87e0;
          (_0x49edb7.push(_0x167ee5, _0x43b3fd, _0x57652a), _0x49edb7.push(_0x43b3fd, _0x22b282, _0x57652a));
        }
      }
    }
    function _0x58f630() {
      for (let _0x5a0f87 = 0; _0x5a0f87 <= _0x581711; _0x5a0f87++) {
        for (let _0x2fdab4 = 0; _0x2fdab4 <= _0x1a4e7b; _0x2fdab4++) {
          ((_0x43ea27.x = _0x5a0f87 / _0x581711),
            (_0x43ea27.y = _0x2fdab4 / _0x1a4e7b),
            _0x2596e2.push(_0x43ea27.x, _0x43ea27.y));
        }
      }
    }
  }
  ['copy'](_0x5d7d49) {
    return (super.copy(_0x5d7d49), (this.parameters = Object.assign({}, _0x5d7d49.parameters)), this);
  }
  ['toJSON']() {
    const _0x304c24 = super.toJSON();
    return ((_0x304c24.path = this.parameters.path.toJSON()), _0x304c24);
  }
  static ['fromJSON'](_0x3014d1) {
    return new TubeGeometry(
      new Curves[_0x3014d1['path'].type]().fromJSON(_0x3014d1.path),
      _0x3014d1.tubularSegments,
      _0x3014d1.radius,
      _0x3014d1.radialSegments,
      _0x3014d1.closed,
    );
  }
}
class WireframeGeometry extends BufferGeometry {
  constructor(_0x4955a6 = null) {
    (super(), (this.type = 'WireframeGeometry'), (this.parameters = { geometry: _0x4955a6 }));
    if (_0x4955a6 !== null) {
      const _0x514122 = [],
        _0x3c3dfe = new Set(),
        _0x18b31f = new Vector3(),
        _0x512a91 = new Vector3();
      if (_0x4955a6.index !== null) {
        const _0x21985d = _0x4955a6.attributes.position,
          _0x1e2007 = _0x4955a6.index;
        let _0x12fb8f = _0x4955a6.groups;
        _0x12fb8f.length === 0 && (_0x12fb8f = [{ start: 0, count: _0x1e2007.count, materialIndex: 0 }]);
        for (let _0x3b47ed = 0, _0x1097ab = _0x12fb8f.length; _0x3b47ed < _0x1097ab; ++_0x3b47ed) {
          const _0x5473f5 = _0x12fb8f[_0x3b47ed],
            _0x442dd9 = _0x5473f5.start,
            _0x535c8d = _0x5473f5.count;
          for (
            let _0x593fc1 = _0x442dd9, _0xbb6374 = _0x442dd9 + _0x535c8d;
            _0x593fc1 < _0xbb6374;
            _0x593fc1 += 3
          ) {
            for (let _0x579b44 = 0; _0x579b44 < 3; _0x579b44++) {
              const _0x38f062 = _0x1e2007.getX(_0x593fc1 + _0x579b44),
                _0x4ea844 = _0x1e2007.getX(_0x593fc1 + ((_0x579b44 + 1) % 3));
              (_0x18b31f.fromBufferAttribute(_0x21985d, _0x38f062),
                _0x512a91.fromBufferAttribute(_0x21985d, _0x4ea844),
                isUniqueEdge(_0x18b31f, _0x512a91, _0x3c3dfe) === true &&
                  (_0x514122.push(_0x18b31f.x, _0x18b31f.y, _0x18b31f.z),
                  _0x514122.push(_0x512a91.x, _0x512a91.y, _0x512a91.z)));
            }
          }
        }
      } else {
        const _0x8aaa10 = _0x4955a6.attributes.position;
        for (let _0x833c47 = 0, _0x204b10 = _0x8aaa10.count / 3; _0x833c47 < _0x204b10; _0x833c47++) {
          for (let _0x567b3a = 0; _0x567b3a < 3; _0x567b3a++) {
            const _0x2dcc4f = 3 * _0x833c47 + _0x567b3a,
              _0x3ed816 = 3 * _0x833c47 + ((_0x567b3a + 1) % 3);
            (_0x18b31f.fromBufferAttribute(_0x8aaa10, _0x2dcc4f),
              _0x512a91.fromBufferAttribute(_0x8aaa10, _0x3ed816),
              isUniqueEdge(_0x18b31f, _0x512a91, _0x3c3dfe) === true &&
                (_0x514122.push(_0x18b31f.x, _0x18b31f.y, _0x18b31f.z),
                _0x514122.push(_0x512a91.x, _0x512a91.y, _0x512a91.z)));
          }
        }
      }
      this.setAttribute('position', new Float32BufferAttribute(_0x514122, 3));
    }
  }
  ['copy'](_0x4c1adc) {
    return (super.copy(_0x4c1adc), (this.parameters = Object.assign({}, _0x4c1adc.parameters)), this);
  }
}
function isUniqueEdge(_0x49a172, _0x478ac4, _0x1526ac) {
  const _0x4fa22a =
      _0x49a172.x +
      ',' +
      _0x49a172.y +
      ',' +
      _0x49a172.z +
      '-' +
      _0x478ac4.x +
      ',' +
      _0x478ac4.y +
      ',' +
      _0x478ac4.z,
    _0x236f92 =
      _0x478ac4.x +
      ',' +
      _0x478ac4.y +
      ',' +
      _0x478ac4.z +
      '-' +
      _0x49a172.x +
      ',' +
      _0x49a172.y +
      ',' +
      _0x49a172.z;
  return _0x1526ac.has(_0x4fa22a) === true || _0x1526ac.has(_0x236f92) === true
    ? false
    : (_0x1526ac.add(_0x4fa22a), _0x1526ac.add(_0x236f92), true);
}
var Geometries = Object.freeze({
  __proto__: null,
  BoxGeometry: BoxGeometry,
  CapsuleGeometry: CapsuleGeometry,
  CircleGeometry: CircleGeometry,
  ConeGeometry: ConeGeometry,
  CylinderGeometry: CylinderGeometry,
  DodecahedronGeometry: DodecahedronGeometry,
  EdgesGeometry: EdgesGeometry,
  ExtrudeGeometry: ExtrudeGeometry,
  IcosahedronGeometry: IcosahedronGeometry,
  LatheGeometry: LatheGeometry,
  OctahedronGeometry: OctahedronGeometry,
  PlaneGeometry: PlaneGeometry,
  PolyhedronGeometry: PolyhedronGeometry,
  RingGeometry: RingGeometry,
  ShapeGeometry: ShapeGeometry,
  SphereGeometry: SphereGeometry,
  TetrahedronGeometry: TetrahedronGeometry,
  TorusGeometry: TorusGeometry,
  TorusKnotGeometry: TorusKnotGeometry,
  TubeGeometry: TubeGeometry,
  WireframeGeometry: WireframeGeometry,
});
class ShadowMaterial extends Material {
  constructor(_0x138960) {
    (super(),
      (this.isShadowMaterial = true),
      (this.type = 'ShadowMaterial'),
      (this.color = new Color(0)),
      (this.transparent = true),
      (this.fog = true),
      this.setValues(_0x138960));
  }
  ['copy'](_0x196bd9) {
    return (super.copy(_0x196bd9), this.color.copy(_0x196bd9.color), (this.fog = _0x196bd9.fog), this);
  }
}
class RawShaderMaterial extends ShaderMaterial {
  constructor(_0x2b8190) {
    (super(_0x2b8190), (this.isRawShaderMaterial = true), (this.type = 'RawShaderMaterial'));
  }
}
class MeshStandardMaterial extends Material {
  constructor(_0x150fff) {
    (super(),
      (this.isMeshStandardMaterial = true),
      (this.type = 'MeshStandardMaterial'),
      (this.defines = { STANDARD: '' }),
      (this.color = new Color(0xffffff)),
      (this.roughness = 1),
      (this.metalness = 0),
      (this.map = null),
      (this.lightMap = null),
      (this.lightMapIntensity = 1),
      (this.aoMap = null),
      (this.aoMapIntensity = 1),
      (this.emissive = new Color(0)),
      (this.emissiveIntensity = 1),
      (this.emissiveMap = null),
      (this.bumpMap = null),
      (this.bumpScale = 1),
      (this.normalMap = null),
      (this.normalMapType = TangentSpaceNormalMap),
      (this.normalScale = new Vector2(1, 1)),
      (this.displacementMap = null),
      (this.displacementScale = 1),
      (this.displacementBias = 0),
      (this.roughnessMap = null),
      (this.metalnessMap = null),
      (this.alphaMap = null),
      (this.envMap = null),
      (this.envMapRotation = new Euler()),
      (this.envMapIntensity = 1),
      (this.wireframe = false),
      (this.wireframeLinewidth = 1),
      (this.wireframeLinecap = 'round'),
      (this.wireframeLinejoin = 'round'),
      (this.flatShading = false),
      (this.fog = true),
      this.setValues(_0x150fff));
  }
  ['copy'](_0x11bd47) {
    return (
      super.copy(_0x11bd47),
      (this.defines = { STANDARD: '' }),
      this.color.copy(_0x11bd47.color),
      (this.roughness = _0x11bd47.roughness),
      (this.metalness = _0x11bd47.metalness),
      (this.map = _0x11bd47.map),
      (this.lightMap = _0x11bd47.lightMap),
      (this.lightMapIntensity = _0x11bd47.lightMapIntensity),
      (this.aoMap = _0x11bd47.aoMap),
      (this.aoMapIntensity = _0x11bd47.aoMapIntensity),
      this.emissive.copy(_0x11bd47.emissive),
      (this.emissiveMap = _0x11bd47.emissiveMap),
      (this.emissiveIntensity = _0x11bd47.emissiveIntensity),
      (this.bumpMap = _0x11bd47.bumpMap),
      (this.bumpScale = _0x11bd47.bumpScale),
      (this.normalMap = _0x11bd47.normalMap),
      (this.normalMapType = _0x11bd47.normalMapType),
      this.normalScale.copy(_0x11bd47.normalScale),
      (this.displacementMap = _0x11bd47.displacementMap),
      (this.displacementScale = _0x11bd47.displacementScale),
      (this.displacementBias = _0x11bd47.displacementBias),
      (this.roughnessMap = _0x11bd47.roughnessMap),
      (this.metalnessMap = _0x11bd47.metalnessMap),
      (this.alphaMap = _0x11bd47.alphaMap),
      (this.envMap = _0x11bd47.envMap),
      this.envMapRotation.copy(_0x11bd47.envMapRotation),
      (this.envMapIntensity = _0x11bd47.envMapIntensity),
      (this.wireframe = _0x11bd47.wireframe),
      (this.wireframeLinewidth = _0x11bd47.wireframeLinewidth),
      (this.wireframeLinecap = _0x11bd47.wireframeLinecap),
      (this.wireframeLinejoin = _0x11bd47.wireframeLinejoin),
      (this.flatShading = _0x11bd47.flatShading),
      (this.fog = _0x11bd47.fog),
      this
    );
  }
}
class MeshPhysicalMaterial extends MeshStandardMaterial {
  constructor(_0x52de7a) {
    (super(),
      (this.isMeshPhysicalMaterial = true),
      (this.defines = { STANDARD: '', PHYSICAL: '' }),
      (this.type = 'MeshPhysicalMaterial'),
      (this.anisotropyRotation = 0),
      (this.anisotropyMap = null),
      (this.clearcoatMap = null),
      (this.clearcoatRoughness = 0),
      (this.clearcoatRoughnessMap = null),
      (this.clearcoatNormalScale = new Vector2(1, 1)),
      (this.clearcoatNormalMap = null),
      (this.ior = 1.5),
      Object.defineProperty(this, 'reflectivity', {
        get: function () {
          return clamp((2.5 * (this.ior - 1)) / (this.ior + 1), 0, 1);
        },
        set: function (_0x32c8ab) {
          this.ior = (1 + 0.4 * _0x32c8ab) / (1 - 0.4 * _0x32c8ab);
        },
      }),
      (this.iridescenceMap = null),
      (this.iridescenceIOR = 1.3),
      (this.iridescenceThicknessRange = [100, 0x190]),
      (this.iridescenceThicknessMap = null),
      (this.sheenColor = new Color(0)),
      (this.sheenColorMap = null),
      (this.sheenRoughness = 1),
      (this.sheenRoughnessMap = null),
      (this.transmissionMap = null),
      (this.thickness = 0),
      (this.thicknessMap = null),
      (this.attenuationDistance = Infinity),
      (this.attenuationColor = new Color(1, 1, 1)),
      (this.specularIntensity = 1),
      (this.specularIntensityMap = null),
      (this.specularColor = new Color(1, 1, 1)),
      (this.specularColorMap = null),
      (this._anisotropy = 0),
      (this._clearcoat = 0),
      (this._dispersion = 0),
      (this._iridescence = 0),
      (this._sheen = 0),
      (this._transmission = 0),
      this.setValues(_0x52de7a));
  }
  get ['anisotropy']() {
    return this._anisotropy;
  }
  set ['anisotropy'](_0x392bfc) {
    (this._anisotropy > 0 !== _0x392bfc > 0 && this.version++, (this._anisotropy = _0x392bfc));
  }
  get ['clearcoat']() {
    return this._clearcoat;
  }
  set ['clearcoat'](_0xccc3d) {
    (this._clearcoat > 0 !== _0xccc3d > 0 && this.version++, (this._clearcoat = _0xccc3d));
  }
  get ['iridescence']() {
    return this._iridescence;
  }
  set ['iridescence'](_0x1c8b2c) {
    (this._iridescence > 0 !== _0x1c8b2c > 0 && this.version++, (this._iridescence = _0x1c8b2c));
  }
  get ['dispersion']() {
    return this._dispersion;
  }
  set ['dispersion'](_0x282bdf) {
    (this._dispersion > 0 !== _0x282bdf > 0 && this.version++, (this._dispersion = _0x282bdf));
  }
  get ['sheen']() {
    return this._sheen;
  }
  set ['sheen'](_0x581884) {
    (this._sheen > 0 !== _0x581884 > 0 && this.version++, (this._sheen = _0x581884));
  }
  get ['transmission']() {
    return this._transmission;
  }
  set ['transmission'](_0x1f8975) {
    (this._transmission > 0 !== _0x1f8975 > 0 && this.version++, (this._transmission = _0x1f8975));
  }
  ['copy'](_0xcf5fce) {
    return (
      super.copy(_0xcf5fce),
      (this.defines = { STANDARD: '', PHYSICAL: '' }),
      (this.anisotropy = _0xcf5fce.anisotropy),
      (this.anisotropyRotation = _0xcf5fce.anisotropyRotation),
      (this.anisotropyMap = _0xcf5fce.anisotropyMap),
      (this.clearcoat = _0xcf5fce.clearcoat),
      (this.clearcoatMap = _0xcf5fce.clearcoatMap),
      (this.clearcoatRoughness = _0xcf5fce.clearcoatRoughness),
      (this.clearcoatRoughnessMap = _0xcf5fce.clearcoatRoughnessMap),
      (this.clearcoatNormalMap = _0xcf5fce.clearcoatNormalMap),
      this.clearcoatNormalScale.copy(_0xcf5fce.clearcoatNormalScale),
      (this.dispersion = _0xcf5fce.dispersion),
      (this.ior = _0xcf5fce.ior),
      (this.iridescence = _0xcf5fce.iridescence),
      (this.iridescenceMap = _0xcf5fce.iridescenceMap),
      (this.iridescenceIOR = _0xcf5fce.iridescenceIOR),
      (this.iridescenceThicknessRange = [..._0xcf5fce.iridescenceThicknessRange]),
      (this.iridescenceThicknessMap = _0xcf5fce.iridescenceThicknessMap),
      (this.sheen = _0xcf5fce.sheen),
      this.sheenColor.copy(_0xcf5fce.sheenColor),
      (this.sheenColorMap = _0xcf5fce.sheenColorMap),
      (this.sheenRoughness = _0xcf5fce.sheenRoughness),
      (this.sheenRoughnessMap = _0xcf5fce.sheenRoughnessMap),
      (this.transmission = _0xcf5fce.transmission),
      (this.transmissionMap = _0xcf5fce.transmissionMap),
      (this.thickness = _0xcf5fce.thickness),
      (this.thicknessMap = _0xcf5fce.thicknessMap),
      (this.attenuationDistance = _0xcf5fce.attenuationDistance),
      this.attenuationColor.copy(_0xcf5fce.attenuationColor),
      (this.specularIntensity = _0xcf5fce.specularIntensity),
      (this.specularIntensityMap = _0xcf5fce.specularIntensityMap),
      this.specularColor.copy(_0xcf5fce.specularColor),
      (this.specularColorMap = _0xcf5fce.specularColorMap),
      this
    );
  }
}
class MeshPhongMaterial extends Material {
  constructor(_0x15b784) {
    (super(),
      (this.isMeshPhongMaterial = true),
      (this.type = 'MeshPhongMaterial'),
      (this.color = new Color(0xffffff)),
      (this.specular = new Color(0x111111)),
      (this.shininess = 30),
      (this.map = null),
      (this.lightMap = null),
      (this.lightMapIntensity = 1),
      (this.aoMap = null),
      (this.aoMapIntensity = 1),
      (this.emissive = new Color(0)),
      (this.emissiveIntensity = 1),
      (this.emissiveMap = null),
      (this.bumpMap = null),
      (this.bumpScale = 1),
      (this.normalMap = null),
      (this.normalMapType = TangentSpaceNormalMap),
      (this.normalScale = new Vector2(1, 1)),
      (this.displacementMap = null),
      (this.displacementScale = 1),
      (this.displacementBias = 0),
      (this.specularMap = null),
      (this.alphaMap = null),
      (this.envMap = null),
      (this.envMapRotation = new Euler()),
      (this.combine = MultiplyOperation),
      (this.reflectivity = 1),
      (this.refractionRatio = 0.98),
      (this.wireframe = false),
      (this.wireframeLinewidth = 1),
      (this.wireframeLinecap = 'round'),
      (this.wireframeLinejoin = 'round'),
      (this.flatShading = false),
      (this.fog = true),
      this.setValues(_0x15b784));
  }
  ['copy'](_0x293a29) {
    return (
      super.copy(_0x293a29),
      this.color.copy(_0x293a29.color),
      this.specular.copy(_0x293a29.specular),
      (this.shininess = _0x293a29.shininess),
      (this.map = _0x293a29.map),
      (this.lightMap = _0x293a29.lightMap),
      (this.lightMapIntensity = _0x293a29.lightMapIntensity),
      (this.aoMap = _0x293a29.aoMap),
      (this.aoMapIntensity = _0x293a29.aoMapIntensity),
      this.emissive.copy(_0x293a29.emissive),
      (this.emissiveMap = _0x293a29.emissiveMap),
      (this.emissiveIntensity = _0x293a29.emissiveIntensity),
      (this.bumpMap = _0x293a29.bumpMap),
      (this.bumpScale = _0x293a29.bumpScale),
      (this.normalMap = _0x293a29.normalMap),
      (this.normalMapType = _0x293a29.normalMapType),
      this.normalScale.copy(_0x293a29.normalScale),
      (this.displacementMap = _0x293a29.displacementMap),
      (this.displacementScale = _0x293a29.displacementScale),
      (this.displacementBias = _0x293a29.displacementBias),
      (this.specularMap = _0x293a29.specularMap),
      (this.alphaMap = _0x293a29.alphaMap),
      (this.envMap = _0x293a29.envMap),
      this.envMapRotation.copy(_0x293a29.envMapRotation),
      (this.combine = _0x293a29.combine),
      (this.reflectivity = _0x293a29.reflectivity),
      (this.refractionRatio = _0x293a29.refractionRatio),
      (this.wireframe = _0x293a29.wireframe),
      (this.wireframeLinewidth = _0x293a29.wireframeLinewidth),
      (this.wireframeLinecap = _0x293a29.wireframeLinecap),
      (this.wireframeLinejoin = _0x293a29.wireframeLinejoin),
      (this.flatShading = _0x293a29.flatShading),
      (this.fog = _0x293a29.fog),
      this
    );
  }
}
class MeshToonMaterial extends Material {
  constructor(_0x307e41) {
    (super(),
      (this.isMeshToonMaterial = true),
      (this.defines = { TOON: '' }),
      (this.type = 'MeshToonMaterial'),
      (this.color = new Color(0xffffff)),
      (this.map = null),
      (this.gradientMap = null),
      (this.lightMap = null),
      (this.lightMapIntensity = 1),
      (this.aoMap = null),
      (this.aoMapIntensity = 1),
      (this.emissive = new Color(0)),
      (this.emissiveIntensity = 1),
      (this.emissiveMap = null),
      (this.bumpMap = null),
      (this.bumpScale = 1),
      (this.normalMap = null),
      (this.normalMapType = TangentSpaceNormalMap),
      (this.normalScale = new Vector2(1, 1)),
      (this.displacementMap = null),
      (this.displacementScale = 1),
      (this.displacementBias = 0),
      (this.alphaMap = null),
      (this.wireframe = false),
      (this.wireframeLinewidth = 1),
      (this.wireframeLinecap = 'round'),
      (this.wireframeLinejoin = 'round'),
      (this.fog = true),
      this.setValues(_0x307e41));
  }
  ['copy'](_0x50e8ec) {
    return (
      super.copy(_0x50e8ec),
      this.color.copy(_0x50e8ec.color),
      (this.map = _0x50e8ec.map),
      (this.gradientMap = _0x50e8ec.gradientMap),
      (this.lightMap = _0x50e8ec.lightMap),
      (this.lightMapIntensity = _0x50e8ec.lightMapIntensity),
      (this.aoMap = _0x50e8ec.aoMap),
      (this.aoMapIntensity = _0x50e8ec.aoMapIntensity),
      this.emissive.copy(_0x50e8ec.emissive),
      (this.emissiveMap = _0x50e8ec.emissiveMap),
      (this.emissiveIntensity = _0x50e8ec.emissiveIntensity),
      (this.bumpMap = _0x50e8ec.bumpMap),
      (this.bumpScale = _0x50e8ec.bumpScale),
      (this.normalMap = _0x50e8ec.normalMap),
      (this.normalMapType = _0x50e8ec.normalMapType),
      this.normalScale.copy(_0x50e8ec.normalScale),
      (this.displacementMap = _0x50e8ec.displacementMap),
      (this.displacementScale = _0x50e8ec.displacementScale),
      (this.displacementBias = _0x50e8ec.displacementBias),
      (this.alphaMap = _0x50e8ec.alphaMap),
      (this.wireframe = _0x50e8ec.wireframe),
      (this.wireframeLinewidth = _0x50e8ec.wireframeLinewidth),
      (this.wireframeLinecap = _0x50e8ec.wireframeLinecap),
      (this.wireframeLinejoin = _0x50e8ec.wireframeLinejoin),
      (this.fog = _0x50e8ec.fog),
      this
    );
  }
}
class MeshNormalMaterial extends Material {
  constructor(_0xfb33e6) {
    (super(),
      (this.isMeshNormalMaterial = true),
      (this.type = 'MeshNormalMaterial'),
      (this.bumpMap = null),
      (this.bumpScale = 1),
      (this.normalMap = null),
      (this.normalMapType = TangentSpaceNormalMap),
      (this.normalScale = new Vector2(1, 1)),
      (this.displacementMap = null),
      (this.displacementScale = 1),
      (this.displacementBias = 0),
      (this.wireframe = false),
      (this.wireframeLinewidth = 1),
      (this.flatShading = false),
      this.setValues(_0xfb33e6));
  }
  ['copy'](_0x1bb56c) {
    return (
      super.copy(_0x1bb56c),
      (this.bumpMap = _0x1bb56c.bumpMap),
      (this.bumpScale = _0x1bb56c.bumpScale),
      (this.normalMap = _0x1bb56c.normalMap),
      (this.normalMapType = _0x1bb56c.normalMapType),
      this.normalScale.copy(_0x1bb56c.normalScale),
      (this.displacementMap = _0x1bb56c.displacementMap),
      (this.displacementScale = _0x1bb56c.displacementScale),
      (this.displacementBias = _0x1bb56c.displacementBias),
      (this.wireframe = _0x1bb56c.wireframe),
      (this.wireframeLinewidth = _0x1bb56c.wireframeLinewidth),
      (this.flatShading = _0x1bb56c.flatShading),
      this
    );
  }
}
class MeshLambertMaterial extends Material {
  constructor(_0xaa499f) {
    (super(),
      (this.isMeshLambertMaterial = true),
      (this.type = 'MeshLambertMaterial'),
      (this.color = new Color(0xffffff)),
      (this.map = null),
      (this.lightMap = null),
      (this.lightMapIntensity = 1),
      (this.aoMap = null),
      (this.aoMapIntensity = 1),
      (this.emissive = new Color(0)),
      (this.emissiveIntensity = 1),
      (this.emissiveMap = null),
      (this.bumpMap = null),
      (this.bumpScale = 1),
      (this.normalMap = null),
      (this.normalMapType = TangentSpaceNormalMap),
      (this.normalScale = new Vector2(1, 1)),
      (this.displacementMap = null),
      (this.displacementScale = 1),
      (this.displacementBias = 0),
      (this.specularMap = null),
      (this.alphaMap = null),
      (this.envMap = null),
      (this.envMapRotation = new Euler()),
      (this.combine = MultiplyOperation),
      (this.reflectivity = 1),
      (this.refractionRatio = 0.98),
      (this.wireframe = false),
      (this.wireframeLinewidth = 1),
      (this.wireframeLinecap = 'round'),
      (this.wireframeLinejoin = 'round'),
      (this.flatShading = false),
      (this.fog = true),
      this.setValues(_0xaa499f));
  }
  ['copy'](_0x1a1304) {
    return (
      super.copy(_0x1a1304),
      this.color.copy(_0x1a1304.color),
      (this.map = _0x1a1304.map),
      (this.lightMap = _0x1a1304.lightMap),
      (this.lightMapIntensity = _0x1a1304.lightMapIntensity),
      (this.aoMap = _0x1a1304.aoMap),
      (this.aoMapIntensity = _0x1a1304.aoMapIntensity),
      this.emissive.copy(_0x1a1304.emissive),
      (this.emissiveMap = _0x1a1304.emissiveMap),
      (this.emissiveIntensity = _0x1a1304.emissiveIntensity),
      (this.bumpMap = _0x1a1304.bumpMap),
      (this.bumpScale = _0x1a1304.bumpScale),
      (this.normalMap = _0x1a1304.normalMap),
      (this.normalMapType = _0x1a1304.normalMapType),
      this.normalScale.copy(_0x1a1304.normalScale),
      (this.displacementMap = _0x1a1304.displacementMap),
      (this.displacementScale = _0x1a1304.displacementScale),
      (this.displacementBias = _0x1a1304.displacementBias),
      (this.specularMap = _0x1a1304.specularMap),
      (this.alphaMap = _0x1a1304.alphaMap),
      (this.envMap = _0x1a1304.envMap),
      this.envMapRotation.copy(_0x1a1304.envMapRotation),
      (this.combine = _0x1a1304.combine),
      (this.reflectivity = _0x1a1304.reflectivity),
      (this.refractionRatio = _0x1a1304.refractionRatio),
      (this.wireframe = _0x1a1304.wireframe),
      (this.wireframeLinewidth = _0x1a1304.wireframeLinewidth),
      (this.wireframeLinecap = _0x1a1304.wireframeLinecap),
      (this.wireframeLinejoin = _0x1a1304.wireframeLinejoin),
      (this.flatShading = _0x1a1304.flatShading),
      (this.fog = _0x1a1304.fog),
      this
    );
  }
}
class MeshDepthMaterial extends Material {
  constructor(_0x2cb8b0) {
    (super(),
      (this.isMeshDepthMaterial = true),
      (this.type = 'MeshDepthMaterial'),
      (this.depthPacking = BasicDepthPacking),
      (this.map = null),
      (this.alphaMap = null),
      (this.displacementMap = null),
      (this.displacementScale = 1),
      (this.displacementBias = 0),
      (this.wireframe = false),
      (this.wireframeLinewidth = 1),
      this.setValues(_0x2cb8b0));
  }
  ['copy'](_0x1a1381) {
    return (
      super.copy(_0x1a1381),
      (this.depthPacking = _0x1a1381.depthPacking),
      (this.map = _0x1a1381.map),
      (this.alphaMap = _0x1a1381.alphaMap),
      (this.displacementMap = _0x1a1381.displacementMap),
      (this.displacementScale = _0x1a1381.displacementScale),
      (this.displacementBias = _0x1a1381.displacementBias),
      (this.wireframe = _0x1a1381.wireframe),
      (this.wireframeLinewidth = _0x1a1381.wireframeLinewidth),
      this
    );
  }
}
class MeshDistanceMaterial extends Material {
  constructor(_0x24672c) {
    (super(),
      (this.isMeshDistanceMaterial = true),
      (this.type = 'MeshDistanceMaterial'),
      (this.map = null),
      (this.alphaMap = null),
      (this.displacementMap = null),
      (this.displacementScale = 1),
      (this.displacementBias = 0),
      this.setValues(_0x24672c));
  }
  ['copy'](_0x1454ee) {
    return (
      super.copy(_0x1454ee),
      (this.map = _0x1454ee.map),
      (this.alphaMap = _0x1454ee.alphaMap),
      (this.displacementMap = _0x1454ee.displacementMap),
      (this.displacementScale = _0x1454ee.displacementScale),
      (this.displacementBias = _0x1454ee.displacementBias),
      this
    );
  }
}
class MeshMatcapMaterial extends Material {
  constructor(_0x3c65cb) {
    (super(),
      (this.isMeshMatcapMaterial = true),
      (this.defines = { MATCAP: '' }),
      (this.type = 'MeshMatcapMaterial'),
      (this.color = new Color(0xffffff)),
      (this.matcap = null),
      (this.map = null),
      (this.bumpMap = null),
      (this.bumpScale = 1),
      (this.normalMap = null),
      (this.normalMapType = TangentSpaceNormalMap),
      (this.normalScale = new Vector2(1, 1)),
      (this.displacementMap = null),
      (this.displacementScale = 1),
      (this.displacementBias = 0),
      (this.alphaMap = null),
      (this.flatShading = false),
      (this.fog = true),
      this.setValues(_0x3c65cb));
  }
  ['copy'](_0x5b37ca) {
    return (
      super.copy(_0x5b37ca),
      (this.defines = { MATCAP: '' }),
      this.color.copy(_0x5b37ca.color),
      (this.matcap = _0x5b37ca.matcap),
      (this.map = _0x5b37ca.map),
      (this.bumpMap = _0x5b37ca.bumpMap),
      (this.bumpScale = _0x5b37ca.bumpScale),
      (this.normalMap = _0x5b37ca.normalMap),
      (this.normalMapType = _0x5b37ca.normalMapType),
      this.normalScale.copy(_0x5b37ca.normalScale),
      (this.displacementMap = _0x5b37ca.displacementMap),
      (this.displacementScale = _0x5b37ca.displacementScale),
      (this.displacementBias = _0x5b37ca.displacementBias),
      (this.alphaMap = _0x5b37ca.alphaMap),
      (this.flatShading = _0x5b37ca.flatShading),
      (this.fog = _0x5b37ca.fog),
      this
    );
  }
}
class LineDashedMaterial extends LineBasicMaterial {
  constructor(_0x357f9c) {
    (super(),
      (this.isLineDashedMaterial = true),
      (this.type = 'LineDashedMaterial'),
      (this.scale = 1),
      (this.dashSize = 3),
      (this.gapSize = 1),
      this.setValues(_0x357f9c));
  }
  ['copy'](_0x22c347) {
    return (
      super.copy(_0x22c347),
      (this.scale = _0x22c347.scale),
      (this.dashSize = _0x22c347.dashSize),
      (this.gapSize = _0x22c347.gapSize),
      this
    );
  }
}
function convertArray(_0x5abd72, _0x5a1fca) {
  if (!_0x5abd72 || _0x5abd72.constructor === _0x5a1fca) return _0x5abd72;
  if (typeof _0x5a1fca.BYTES_PER_ELEMENT === 'number') return new _0x5a1fca(_0x5abd72);
  return Array.prototype.slice.call(_0x5abd72);
}
function isTypedArray(_0x32dd4c) {
  return ArrayBuffer.isView(_0x32dd4c) && !(_0x32dd4c instanceof DataView);
}
function getKeyframeOrder(_0x5d8997) {
  function _0x100eca(_0x9c3b91, _0xd8cc2) {
    return _0x5d8997[_0x9c3b91] - _0x5d8997[_0xd8cc2];
  }
  const _0x434974 = _0x5d8997.length,
    _0x2604d8 = new Array(_0x434974);
  for (let _0x2b3787 = 0; _0x2b3787 !== _0x434974; ++_0x2b3787) _0x2604d8[_0x2b3787] = _0x2b3787;
  return (_0x2604d8.sort(_0x100eca), _0x2604d8);
}
function sortedArray(_0x2dded7, _0x4c3ff1, _0x4c795f) {
  const _0x217c86 = _0x2dded7.length,
    _0x44e31b = new _0x2dded7.constructor(_0x217c86);
  for (let _0x4ba23f = 0, _0x22e0d7 = 0; _0x22e0d7 !== _0x217c86; ++_0x4ba23f) {
    const _0xba75ef = _0x4c795f[_0x4ba23f] * _0x4c3ff1;
    for (let _0x42874b = 0; _0x42874b !== _0x4c3ff1; ++_0x42874b) {
      _0x44e31b[_0x22e0d7++] = _0x2dded7[_0xba75ef + _0x42874b];
    }
  }
  return _0x44e31b;
}
function flattenJSON(_0x1e0ab3, _0x58bea8, _0x125e96, _0x299bb0) {
  let _0x40e589 = 1,
    _0x1fef2a = _0x1e0ab3[0];
  while (_0x1fef2a !== undefined && _0x1fef2a[_0x299bb0] === undefined) {
    _0x1fef2a = _0x1e0ab3[_0x40e589++];
  }
  if (_0x1fef2a === undefined) return;
  let _0x133e2c = _0x1fef2a[_0x299bb0];
  if (_0x133e2c === undefined) return;
  if (Array.isArray(_0x133e2c))
    do {
      ((_0x133e2c = _0x1fef2a[_0x299bb0]),
        _0x133e2c !== undefined && (_0x58bea8.push(_0x1fef2a.time), _0x125e96.push(..._0x133e2c)),
        (_0x1fef2a = _0x1e0ab3[_0x40e589++]));
    } while (_0x1fef2a !== undefined);
  else {
    if (_0x133e2c.toArray !== undefined)
      do {
        ((_0x133e2c = _0x1fef2a[_0x299bb0]),
          _0x133e2c !== undefined &&
            (_0x58bea8.push(_0x1fef2a.time), _0x133e2c.toArray(_0x125e96, _0x125e96.length)),
          (_0x1fef2a = _0x1e0ab3[_0x40e589++]));
      } while (_0x1fef2a !== undefined);
    else
      do {
        ((_0x133e2c = _0x1fef2a[_0x299bb0]),
          _0x133e2c !== undefined && (_0x58bea8.push(_0x1fef2a.time), _0x125e96.push(_0x133e2c)),
          (_0x1fef2a = _0x1e0ab3[_0x40e589++]));
      } while (_0x1fef2a !== undefined);
  }
}
function subclip(_0x41a56e, _0x1d6d36, _0x4b7e1c, _0x2a3dca, _0x4f56c8 = 30) {
  const _0x8201f = _0x41a56e.clone();
  _0x8201f.name = _0x1d6d36;
  const _0x59d565 = [];
  for (let _0x19cd2e = 0; _0x19cd2e < _0x8201f.tracks.length; ++_0x19cd2e) {
    const _0x508f08 = _0x8201f.tracks[_0x19cd2e],
      _0xc2d220 = _0x508f08.getValueSize(),
      _0x1eb702 = [],
      _0x5e8ec1 = [];
    for (let _0x4d423d = 0; _0x4d423d < _0x508f08.times.length; ++_0x4d423d) {
      const _0x5d3e46 = _0x508f08.times[_0x4d423d] * _0x4f56c8;
      if (_0x5d3e46 < _0x4b7e1c || _0x5d3e46 >= _0x2a3dca) continue;
      _0x1eb702.push(_0x508f08.times[_0x4d423d]);
      for (let _0x341762 = 0; _0x341762 < _0xc2d220; ++_0x341762) {
        _0x5e8ec1.push(_0x508f08.values[_0x4d423d * _0xc2d220 + _0x341762]);
      }
    }
    if (_0x1eb702.length === 0) continue;
    ((_0x508f08.times = convertArray(_0x1eb702, _0x508f08.times.constructor)),
      (_0x508f08.values = convertArray(_0x5e8ec1, _0x508f08.values.constructor)),
      _0x59d565.push(_0x508f08));
  }
  _0x8201f.tracks = _0x59d565;
  let _0x404963 = Infinity;
  for (let _0xda55f2 = 0; _0xda55f2 < _0x8201f.tracks.length; ++_0xda55f2) {
    _0x404963 > _0x8201f.tracks[_0xda55f2].times[0] && (_0x404963 = _0x8201f.tracks[_0xda55f2].times[0]);
  }
  for (let _0x393025 = 0; _0x393025 < _0x8201f.tracks.length; ++_0x393025) {
    _0x8201f.tracks[_0x393025].shift(-1 * _0x404963);
  }
  return (_0x8201f.resetDuration(), _0x8201f);
}
function makeClipAdditive(_0x56f9dc, _0x3c2173 = 0, _0x4ba9ec = _0x56f9dc, _0x20180c = 30) {
  if (_0x20180c <= 0) _0x20180c = 30;
  const _0x18e90e = _0x4ba9ec.tracks.length,
    _0x3f6fb2 = _0x3c2173 / _0x20180c;
  for (let _0x5599bd = 0; _0x5599bd < _0x18e90e; ++_0x5599bd) {
    const _0x4afb51 = _0x4ba9ec.tracks[_0x5599bd],
      _0xee00e2 = _0x4afb51.ValueTypeName;
    if (_0xee00e2 === 'bool' || _0xee00e2 === 'string') continue;
    const _0x335fea = _0x56f9dc.tracks.find(function (_0x372b00) {
      return _0x372b00.name === _0x4afb51.name && _0x372b00.ValueTypeName === _0xee00e2;
    });
    if (_0x335fea === undefined) continue;
    let _0x5a902e = 0;
    const _0x4c4d7a = _0x4afb51.getValueSize();
    _0x4afb51.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline && (_0x5a902e = _0x4c4d7a / 3);
    let _0x10e90b = 0;
    const _0x30bf84 = _0x335fea.getValueSize();
    _0x335fea.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline && (_0x10e90b = _0x30bf84 / 3);
    const _0x204293 = _0x4afb51.times.length - 1;
    let _0x381928;
    if (_0x3f6fb2 <= _0x4afb51.times[0]) {
      const _0x94e4f2 = _0x5a902e,
        _0x535a63 = _0x4c4d7a - _0x5a902e;
      _0x381928 = _0x4afb51.values.slice(_0x94e4f2, _0x535a63);
    } else {
      if (_0x3f6fb2 >= _0x4afb51.times[_0x204293]) {
        const _0x2040e0 = _0x204293 * _0x4c4d7a + _0x5a902e,
          _0x2a30ba = _0x2040e0 + _0x4c4d7a - _0x5a902e;
        _0x381928 = _0x4afb51.values.slice(_0x2040e0, _0x2a30ba);
      } else {
        const _0x30d55e = _0x4afb51.createInterpolant(),
          _0x2604df = _0x5a902e,
          _0x1cbfaa = _0x4c4d7a - _0x5a902e;
        (_0x30d55e.evaluate(_0x3f6fb2), (_0x381928 = _0x30d55e.resultBuffer.slice(_0x2604df, _0x1cbfaa)));
      }
    }
    if (_0xee00e2 === 'quaternion') {
      const _0x3db8e7 = new Quaternion().fromArray(_0x381928).normalize().conjugate();
      _0x3db8e7.toArray(_0x381928);
    }
    const _0x9504fb = _0x335fea.times.length;
    for (let _0x553412 = 0; _0x553412 < _0x9504fb; ++_0x553412) {
      const _0x2b078e = _0x553412 * _0x30bf84 + _0x10e90b;
      if (_0xee00e2 === 'quaternion')
        Quaternion.multiplyQuaternionsFlat(
          _0x335fea.values,
          _0x2b078e,
          _0x381928,
          0,
          _0x335fea.values,
          _0x2b078e,
        );
      else {
        const _0x2a5557 = _0x30bf84 - _0x10e90b * 2;
        for (let _0x439d7f = 0; _0x439d7f < _0x2a5557; ++_0x439d7f) {
          _0x335fea.values[_0x2b078e + _0x439d7f] -= _0x381928[_0x439d7f];
        }
      }
    }
  }
  return ((_0x56f9dc.blendMode = AdditiveAnimationBlendMode), _0x56f9dc);
}
class AnimationUtils {
  static ['convertArray'](_0x4ee2ec, _0x2795e3) {
    return convertArray(_0x4ee2ec, _0x2795e3);
  }
  static ['isTypedArray'](_0x411a3d) {
    return isTypedArray(_0x411a3d);
  }
  static ['getKeyframeOrder'](_0x148eb2) {
    return getKeyframeOrder(_0x148eb2);
  }
  static ['sortedArray'](_0x44fc93, _0x443635, _0x126ef1) {
    return sortedArray(_0x44fc93, _0x443635, _0x126ef1);
  }
  static ['flattenJSON'](_0x210c5a, _0x24e12c, _0x2e96e7, _0x3f89be) {
    flattenJSON(_0x210c5a, _0x24e12c, _0x2e96e7, _0x3f89be);
  }
  static ['subclip'](_0x139134, _0x503a8a, _0x355f87, _0x6a01f5, _0x216d62 = 30) {
    return subclip(_0x139134, _0x503a8a, _0x355f87, _0x6a01f5, _0x216d62);
  }
  static ['makeClipAdditive'](_0xbf8cef, _0x3c298e = 0, _0x3e88c2 = _0xbf8cef, _0x1095d4 = 30) {
    return makeClipAdditive(_0xbf8cef, _0x3c298e, _0x3e88c2, _0x1095d4);
  }
}
class Interpolant {
  constructor(_0x2cf4da, _0x25743d, _0x31a5f7, _0x59b3b3) {
    ((this.parameterPositions = _0x2cf4da),
      (this._cachedIndex = 0),
      (this.resultBuffer = _0x59b3b3 !== undefined ? _0x59b3b3 : new _0x25743d.constructor(_0x31a5f7)),
      (this.sampleValues = _0x25743d),
      (this.valueSize = _0x31a5f7),
      (this.settings = null),
      (this.DefaultSettings_ = {}));
  }
  ['evaluate'](_0x58a1b9) {
    const _0x4ceb72 = this.parameterPositions;
    let _0x1bea15 = this._cachedIndex,
      _0x21e8ce = _0x4ceb72[_0x1bea15],
      _0x297c14 = _0x4ceb72[_0x1bea15 - 1];
    _0x3b1913: {
      _0x56a857: {
        let _0x44d166;
        _0x588611: {
          _0x78e36c: if (!(_0x58a1b9 < _0x21e8ce)) {
            for (let _0x48659b = _0x1bea15 + 2; ;) {
              if (_0x21e8ce === undefined) {
                if (_0x58a1b9 < _0x297c14) break _0x78e36c;
                return (
                  (_0x1bea15 = _0x4ceb72.length),
                  (this._cachedIndex = _0x1bea15),
                  this.copySampleValue_(_0x1bea15 - 1)
                );
              }
              if (_0x1bea15 === _0x48659b) break;
              ((_0x297c14 = _0x21e8ce), (_0x21e8ce = _0x4ceb72[++_0x1bea15]));
              if (_0x58a1b9 < _0x21e8ce) break _0x56a857;
            }
            _0x44d166 = _0x4ceb72.length;
            break _0x588611;
          }
          if (!(_0x58a1b9 >= _0x297c14)) {
            const _0x8487f7 = _0x4ceb72[1];
            _0x58a1b9 < _0x8487f7 && ((_0x1bea15 = 2), (_0x297c14 = _0x8487f7));
            for (let _0x32936d = _0x1bea15 - 2; ;) {
              if (_0x297c14 === undefined) return ((this._cachedIndex = 0), this.copySampleValue_(0));
              if (_0x1bea15 === _0x32936d) break;
              ((_0x21e8ce = _0x297c14), (_0x297c14 = _0x4ceb72[--_0x1bea15 - 1]));
              if (_0x58a1b9 >= _0x297c14) break _0x56a857;
            }
            ((_0x44d166 = _0x1bea15), (_0x1bea15 = 0));
            break _0x588611;
          }
          break _0x3b1913;
        }
        while (_0x1bea15 < _0x44d166) {
          const _0x16ec52 = (_0x1bea15 + _0x44d166) >>> 1;
          _0x58a1b9 < _0x4ceb72[_0x16ec52] ? (_0x44d166 = _0x16ec52) : (_0x1bea15 = _0x16ec52 + 1);
        }
        ((_0x21e8ce = _0x4ceb72[_0x1bea15]), (_0x297c14 = _0x4ceb72[_0x1bea15 - 1]));
        if (_0x297c14 === undefined) return ((this._cachedIndex = 0), this.copySampleValue_(0));
        if (_0x21e8ce === undefined)
          return (
            (_0x1bea15 = _0x4ceb72.length),
            (this._cachedIndex = _0x1bea15),
            this.copySampleValue_(_0x1bea15 - 1)
          );
      }
      ((this._cachedIndex = _0x1bea15), this.intervalChanged_(_0x1bea15, _0x297c14, _0x21e8ce));
    }
    return this.interpolate_(_0x1bea15, _0x297c14, _0x58a1b9, _0x21e8ce);
  }
  ['getSettings_']() {
    return this.settings || this.DefaultSettings_;
  }
  ['copySampleValue_'](_0x13bc6b) {
    const _0x33cf7a = this.resultBuffer,
      _0x201753 = this.sampleValues,
      _0x2a20e0 = this.valueSize,
      _0x1b897c = _0x13bc6b * _0x2a20e0;
    for (let _0x1e0669 = 0; _0x1e0669 !== _0x2a20e0; ++_0x1e0669) {
      _0x33cf7a[_0x1e0669] = _0x201753[_0x1b897c + _0x1e0669];
    }
    return _0x33cf7a;
  }
  ['interpolate_']() {
    throw new Error('call to abstract method');
  }
  ['intervalChanged_']() {}
}
class CubicInterpolant extends Interpolant {
  constructor(_0x340a8f, _0x2185f5, _0x44ae84, _0x51fb41) {
    (super(_0x340a8f, _0x2185f5, _0x44ae84, _0x51fb41),
      (this._weightPrev = -0),
      (this._offsetPrev = -0),
      (this._weightNext = -0),
      (this._offsetNext = -0),
      (this.DefaultSettings_ = { endingStart: ZeroCurvatureEnding, endingEnd: ZeroCurvatureEnding }));
  }
  ['intervalChanged_'](_0x4c9ce1, _0x5ba593, _0x392d53) {
    const _0x4bd02c = this.parameterPositions;
    let _0x5662d4 = _0x4c9ce1 - 2,
      _0x4771da = _0x4c9ce1 + 1,
      _0xe6aff2 = _0x4bd02c[_0x5662d4],
      _0x2b1661 = _0x4bd02c[_0x4771da];
    if (_0xe6aff2 === undefined)
      switch (this.getSettings_().endingStart) {
        case ZeroSlopeEnding:
          ((_0x5662d4 = _0x4c9ce1), (_0xe6aff2 = 2 * _0x5ba593 - _0x392d53));
          break;
        case WrapAroundEnding:
          ((_0x5662d4 = _0x4bd02c.length - 2),
            (_0xe6aff2 = _0x5ba593 + _0x4bd02c[_0x5662d4] - _0x4bd02c[_0x5662d4 + 1]));
          break;
        default:
          ((_0x5662d4 = _0x4c9ce1), (_0xe6aff2 = _0x392d53));
      }
    if (_0x2b1661 === undefined)
      switch (this.getSettings_().endingEnd) {
        case ZeroSlopeEnding:
          ((_0x4771da = _0x4c9ce1), (_0x2b1661 = 2 * _0x392d53 - _0x5ba593));
          break;
        case WrapAroundEnding:
          ((_0x4771da = 1), (_0x2b1661 = _0x392d53 + _0x4bd02c[1] - _0x4bd02c[0]));
          break;
        default:
          ((_0x4771da = _0x4c9ce1 - 1), (_0x2b1661 = _0x5ba593));
      }
    const _0x4ac091 = (_0x392d53 - _0x5ba593) * 0.5,
      _0xa235b4 = this.valueSize;
    ((this._weightPrev = _0x4ac091 / (_0x5ba593 - _0xe6aff2)),
      (this._weightNext = _0x4ac091 / (_0x2b1661 - _0x392d53)),
      (this._offsetPrev = _0x5662d4 * _0xa235b4),
      (this._offsetNext = _0x4771da * _0xa235b4));
  }
  ['interpolate_'](_0x29d460, _0x44cc7c, _0x963979, _0x41f32a) {
    const _0x1eb4f7 = this.resultBuffer,
      _0x27eb70 = this.sampleValues,
      _0x57fff2 = this.valueSize,
      _0x34dfd6 = _0x29d460 * _0x57fff2,
      _0xf9225f = _0x34dfd6 - _0x57fff2,
      _0x13f3db = this._offsetPrev,
      _0xfa9c8e = this._offsetNext,
      _0x48d25f = this._weightPrev,
      _0xdd6c9f = this._weightNext,
      _0x4de497 = (_0x963979 - _0x44cc7c) / (_0x41f32a - _0x44cc7c),
      _0x25e866 = _0x4de497 * _0x4de497,
      _0xb08ace = _0x25e866 * _0x4de497,
      _0x3cea16 = -_0x48d25f * _0xb08ace + 2 * _0x48d25f * _0x25e866 - _0x48d25f * _0x4de497,
      _0x3d9aaf =
        (1 + _0x48d25f) * _0xb08ace + (-1.5 - 2 * _0x48d25f) * _0x25e866 + (-0.5 + _0x48d25f) * _0x4de497 + 1,
      _0x36e711 = (-1 - _0xdd6c9f) * _0xb08ace + (1.5 + _0xdd6c9f) * _0x25e866 + 0.5 * _0x4de497,
      _0x3f92b2 = _0xdd6c9f * _0xb08ace - _0xdd6c9f * _0x25e866;
    for (let _0x5f334b = 0; _0x5f334b !== _0x57fff2; ++_0x5f334b) {
      _0x1eb4f7[_0x5f334b] =
        _0x3cea16 * _0x27eb70[_0x13f3db + _0x5f334b] +
        _0x3d9aaf * _0x27eb70[_0xf9225f + _0x5f334b] +
        _0x36e711 * _0x27eb70[_0x34dfd6 + _0x5f334b] +
        _0x3f92b2 * _0x27eb70[_0xfa9c8e + _0x5f334b];
    }
    return _0x1eb4f7;
  }
}
class LinearInterpolant extends Interpolant {
  constructor(_0x7bc955, _0x293521, _0x6cb054, _0x2c991e) {
    super(_0x7bc955, _0x293521, _0x6cb054, _0x2c991e);
  }
  ['interpolate_'](_0x25f21c, _0x2fc593, _0x3509b6, _0x3c83c6) {
    const _0x147d05 = this.resultBuffer,
      _0x2e54b3 = this.sampleValues,
      _0x338b94 = this.valueSize,
      _0x4e8eb2 = _0x25f21c * _0x338b94,
      _0x1de4a3 = _0x4e8eb2 - _0x338b94,
      _0x3163f1 = (_0x3509b6 - _0x2fc593) / (_0x3c83c6 - _0x2fc593),
      _0x204ed6 = 1 - _0x3163f1;
    for (let _0x4ac774 = 0; _0x4ac774 !== _0x338b94; ++_0x4ac774) {
      _0x147d05[_0x4ac774] =
        _0x2e54b3[_0x1de4a3 + _0x4ac774] * _0x204ed6 + _0x2e54b3[_0x4e8eb2 + _0x4ac774] * _0x3163f1;
    }
    return _0x147d05;
  }
}
class DiscreteInterpolant extends Interpolant {
  constructor(_0x3682b4, _0x5af4e8, _0x1fb2d0, _0xaa7551) {
    super(_0x3682b4, _0x5af4e8, _0x1fb2d0, _0xaa7551);
  }
  ['interpolate_'](_0x512024) {
    return this.copySampleValue_(_0x512024 - 1);
  }
}
class KeyframeTrack {
  constructor(_0x1b89b0, _0x59bede, _0x2e00a5, _0x58f6c4) {
    if (_0x1b89b0 === undefined) throw new Error('THREE.KeyframeTrack: track name is undefined');
    if (_0x59bede === undefined || _0x59bede.length === 0)
      throw new Error('THREE.KeyframeTrack: no keyframes in track named ' + _0x1b89b0);
    ((this.name = _0x1b89b0),
      (this.times = convertArray(_0x59bede, this.TimeBufferType)),
      (this.values = convertArray(_0x2e00a5, this.ValueBufferType)),
      this.setInterpolation(_0x58f6c4 || this.DefaultInterpolation));
  }
  static ['toJSON'](_0x554d48) {
    const _0x1375eb = _0x554d48.constructor;
    let _0x28b612;
    if (_0x1375eb.toJSON !== this.toJSON) _0x28b612 = _0x1375eb.toJSON(_0x554d48);
    else {
      _0x28b612 = {
        name: _0x554d48.name,
        times: convertArray(_0x554d48.times, Array),
        values: convertArray(_0x554d48.values, Array),
      };
      const _0xe1d390 = _0x554d48.getInterpolation();
      _0xe1d390 !== _0x554d48.DefaultInterpolation && (_0x28b612.interpolation = _0xe1d390);
    }
    return ((_0x28b612.type = _0x554d48.ValueTypeName), _0x28b612);
  }
  ['InterpolantFactoryMethodDiscrete'](_0x12ae8c) {
    return new DiscreteInterpolant(this.times, this.values, this.getValueSize(), _0x12ae8c);
  }
  ['InterpolantFactoryMethodLinear'](_0x15cfc9) {
    return new LinearInterpolant(this.times, this.values, this.getValueSize(), _0x15cfc9);
  }
  ['InterpolantFactoryMethodSmooth'](_0x41d0b9) {
    return new CubicInterpolant(this.times, this.values, this.getValueSize(), _0x41d0b9);
  }
  ['setInterpolation'](_0x548194) {
    let _0x217ffa;
    switch (_0x548194) {
      case InterpolateDiscrete:
        _0x217ffa = this.InterpolantFactoryMethodDiscrete;
        break;
      case InterpolateLinear:
        _0x217ffa = this.InterpolantFactoryMethodLinear;
        break;
      case InterpolateSmooth:
        _0x217ffa = this.InterpolantFactoryMethodSmooth;
        break;
    }
    if (_0x217ffa === undefined) {
      const _0x5dd426 =
        'unsupported interpolation for ' + this.ValueTypeName + ' keyframe track named ' + this.name;
      if (this.createInterpolant === undefined) {
        if (_0x548194 !== this.DefaultInterpolation) this.setInterpolation(this.DefaultInterpolation);
        else throw new Error(_0x5dd426);
      }
      return (console.warn('THREE.KeyframeTrack:', _0x5dd426), this);
    }
    return ((this.createInterpolant = _0x217ffa), this);
  }
  ['getInterpolation']() {
    switch (this.createInterpolant) {
      case this.InterpolantFactoryMethodDiscrete:
        return InterpolateDiscrete;
      case this.InterpolantFactoryMethodLinear:
        return InterpolateLinear;
      case this.InterpolantFactoryMethodSmooth:
        return InterpolateSmooth;
    }
  }
  ['getValueSize']() {
    return this.values.length / this.times.length;
  }
  ['shift'](_0x31b23f) {
    if (_0x31b23f !== 0) {
      const _0x5257c9 = this.times;
      for (let _0x54ba5c = 0, _0x28a835 = _0x5257c9.length; _0x54ba5c !== _0x28a835; ++_0x54ba5c) {
        _0x5257c9[_0x54ba5c] += _0x31b23f;
      }
    }
    return this;
  }
  ['scale'](_0x10e0f5) {
    if (_0x10e0f5 !== 1) {
      const _0x2ab14b = this.times;
      for (let _0x4f7a26 = 0, _0x3604b0 = _0x2ab14b.length; _0x4f7a26 !== _0x3604b0; ++_0x4f7a26) {
        _0x2ab14b[_0x4f7a26] *= _0x10e0f5;
      }
    }
    return this;
  }
  ['trim'](_0x574e21, _0x5130fb) {
    const _0x54992b = this.times,
      _0x2054d0 = _0x54992b.length;
    let _0x4b8a93 = 0,
      _0x57e24c = _0x2054d0 - 1;
    while (_0x4b8a93 !== _0x2054d0 && _0x54992b[_0x4b8a93] < _0x574e21) {
      ++_0x4b8a93;
    }
    while (_0x57e24c !== -1 && _0x54992b[_0x57e24c] > _0x5130fb) {
      --_0x57e24c;
    }
    ++_0x57e24c;
    if (_0x4b8a93 !== 0 || _0x57e24c !== _0x2054d0) {
      _0x4b8a93 >= _0x57e24c && ((_0x57e24c = Math.max(_0x57e24c, 1)), (_0x4b8a93 = _0x57e24c - 1));
      const _0x1523c2 = this.getValueSize();
      ((this.times = _0x54992b.slice(_0x4b8a93, _0x57e24c)),
        (this.values = this.values.slice(_0x4b8a93 * _0x1523c2, _0x57e24c * _0x1523c2)));
    }
    return this;
  }
  ['validate']() {
    let _0x592b97 = true;
    const _0x4177d6 = this.getValueSize();
    _0x4177d6 - Math.floor(_0x4177d6) !== 0 &&
      (console.error('THREE.KeyframeTrack: Invalid value size in track.', this), (_0x592b97 = false));
    const _0x565bad = this.times,
      _0x2baf49 = this.values,
      _0x10d7b0 = _0x565bad.length;
    _0x10d7b0 === 0 && (console.error('THREE.KeyframeTrack: Track is empty.', this), (_0x592b97 = false));
    let _0x49d73e = null;
    for (let _0x39f611 = 0; _0x39f611 !== _0x10d7b0; _0x39f611++) {
      const _0x1143ff = _0x565bad[_0x39f611];
      if (typeof _0x1143ff === 'number' && isNaN(_0x1143ff)) {
        (console.error('THREE.KeyframeTrack: Time is not a valid number.', this, _0x39f611, _0x1143ff),
          (_0x592b97 = false));
        break;
      }
      if (_0x49d73e !== null && _0x49d73e > _0x1143ff) {
        (console.error('THREE.KeyframeTrack: Out of order keys.', this, _0x39f611, _0x1143ff, _0x49d73e),
          (_0x592b97 = false));
        break;
      }
      _0x49d73e = _0x1143ff;
    }
    if (_0x2baf49 !== undefined) {
      if (isTypedArray(_0x2baf49))
        for (let _0x407879 = 0, _0x24b744 = _0x2baf49.length; _0x407879 !== _0x24b744; ++_0x407879) {
          const _0x173175 = _0x2baf49[_0x407879];
          if (isNaN(_0x173175)) {
            (console.error('THREE.KeyframeTrack: Value is not a valid number.', this, _0x407879, _0x173175),
              (_0x592b97 = false));
            break;
          }
        }
    }
    return _0x592b97;
  }
  ['optimize']() {
    const _0x531326 = this.times.slice(),
      _0x36f963 = this.values.slice(),
      _0x26e8f5 = this.getValueSize(),
      _0x56c3dc = this.getInterpolation() === InterpolateSmooth,
      _0x154ea1 = _0x531326.length - 1;
    let _0x3cdb36 = 1;
    for (let _0x57217b = 1; _0x57217b < _0x154ea1; ++_0x57217b) {
      let _0x5e0dca = false;
      const _0x1d765a = _0x531326[_0x57217b],
        _0xa9e95e = _0x531326[_0x57217b + 1];
      if (_0x1d765a !== _0xa9e95e && (_0x57217b !== 1 || _0x1d765a !== _0x531326[0])) {
        if (!_0x56c3dc) {
          const _0x5dc97a = _0x57217b * _0x26e8f5,
            _0x220841 = _0x5dc97a - _0x26e8f5,
            _0x376b11 = _0x5dc97a + _0x26e8f5;
          for (let _0xcb1224 = 0; _0xcb1224 !== _0x26e8f5; ++_0xcb1224) {
            const _0x1be8fa = _0x36f963[_0x5dc97a + _0xcb1224];
            if (
              _0x1be8fa !== _0x36f963[_0x220841 + _0xcb1224] ||
              _0x1be8fa !== _0x36f963[_0x376b11 + _0xcb1224]
            ) {
              _0x5e0dca = true;
              break;
            }
          }
        } else _0x5e0dca = true;
      }
      if (_0x5e0dca) {
        if (_0x57217b !== _0x3cdb36) {
          _0x531326[_0x3cdb36] = _0x531326[_0x57217b];
          const _0x5d3537 = _0x57217b * _0x26e8f5,
            _0x61da9f = _0x3cdb36 * _0x26e8f5;
          for (let _0x24a986 = 0; _0x24a986 !== _0x26e8f5; ++_0x24a986) {
            _0x36f963[_0x61da9f + _0x24a986] = _0x36f963[_0x5d3537 + _0x24a986];
          }
        }
        ++_0x3cdb36;
      }
    }
    if (_0x154ea1 > 0) {
      _0x531326[_0x3cdb36] = _0x531326[_0x154ea1];
      for (
        let _0x17c4fa = _0x154ea1 * _0x26e8f5, _0x31c0ad = _0x3cdb36 * _0x26e8f5, _0x52937d = 0;
        _0x52937d !== _0x26e8f5;
        ++_0x52937d
      ) {
        _0x36f963[_0x31c0ad + _0x52937d] = _0x36f963[_0x17c4fa + _0x52937d];
      }
      ++_0x3cdb36;
    }
    return (
      _0x3cdb36 !== _0x531326.length
        ? ((this.times = _0x531326.slice(0, _0x3cdb36)),
          (this.values = _0x36f963.slice(0, _0x3cdb36 * _0x26e8f5)))
        : ((this.times = _0x531326), (this.values = _0x36f963)),
      this
    );
  }
  ['clone']() {
    const _0x417a8f = this.times.slice(),
      _0x41d0f6 = this.values.slice(),
      _0x5e339a = this.constructor,
      _0x245d86 = new _0x5e339a(this.name, _0x417a8f, _0x41d0f6);
    return ((_0x245d86.createInterpolant = this.createInterpolant), _0x245d86);
  }
}
((KeyframeTrack.prototype.ValueTypeName = ''),
  (KeyframeTrack.prototype.TimeBufferType = Float32Array),
  (KeyframeTrack.prototype.ValueBufferType = Float32Array),
  (KeyframeTrack.prototype.DefaultInterpolation = InterpolateLinear));
class BooleanKeyframeTrack extends KeyframeTrack {
  constructor(_0x13eb40, _0x3d6fdc, _0x5e4257) {
    super(_0x13eb40, _0x3d6fdc, _0x5e4257);
  }
}
((BooleanKeyframeTrack.prototype.ValueTypeName = 'bool'),
  (BooleanKeyframeTrack.prototype.ValueBufferType = Array),
  (BooleanKeyframeTrack.prototype.DefaultInterpolation = InterpolateDiscrete),
  (BooleanKeyframeTrack.prototype.InterpolantFactoryMethodLinear = undefined),
  (BooleanKeyframeTrack.prototype.InterpolantFactoryMethodSmooth = undefined));
class ColorKeyframeTrack extends KeyframeTrack {
  constructor(_0x4d6b80, _0x46ab4a, _0x456369, _0xbdee59) {
    super(_0x4d6b80, _0x46ab4a, _0x456369, _0xbdee59);
  }
}
ColorKeyframeTrack.prototype.ValueTypeName = 'color';
class NumberKeyframeTrack extends KeyframeTrack {
  constructor(_0x11f047, _0x20322a, _0x25dee9, _0xe3b262) {
    super(_0x11f047, _0x20322a, _0x25dee9, _0xe3b262);
  }
}
NumberKeyframeTrack.prototype.ValueTypeName = 'number';
class QuaternionLinearInterpolant extends Interpolant {
  constructor(_0x431f3d, _0x2a6976, _0x176e66, _0x5b2cce) {
    super(_0x431f3d, _0x2a6976, _0x176e66, _0x5b2cce);
  }
  ['interpolate_'](_0x5ddf2c, _0x142bd5, _0x36d70d, _0x1d745b) {
    const _0xdfa862 = this.resultBuffer,
      _0x4fc263 = this.sampleValues,
      _0x2607d3 = this.valueSize,
      _0x49ccf2 = (_0x36d70d - _0x142bd5) / (_0x1d745b - _0x142bd5);
    let _0x40c3cf = _0x5ddf2c * _0x2607d3;
    for (let _0x5def2e = _0x40c3cf + _0x2607d3; _0x40c3cf !== _0x5def2e; _0x40c3cf += 4) {
      Quaternion.slerpFlat(_0xdfa862, 0, _0x4fc263, _0x40c3cf - _0x2607d3, _0x4fc263, _0x40c3cf, _0x49ccf2);
    }
    return _0xdfa862;
  }
}
class QuaternionKeyframeTrack extends KeyframeTrack {
  constructor(_0x445522, _0x127d0c, _0x1a65d8, _0xd84048) {
    super(_0x445522, _0x127d0c, _0x1a65d8, _0xd84048);
  }
  ['InterpolantFactoryMethodLinear'](_0x362083) {
    return new QuaternionLinearInterpolant(this.times, this.values, this.getValueSize(), _0x362083);
  }
}
((QuaternionKeyframeTrack.prototype.ValueTypeName = 'quaternion'),
  (QuaternionKeyframeTrack.prototype.InterpolantFactoryMethodSmooth = undefined));
class StringKeyframeTrack extends KeyframeTrack {
  constructor(_0x2936dc, _0xaaeade, _0xde3282) {
    super(_0x2936dc, _0xaaeade, _0xde3282);
  }
}
((StringKeyframeTrack.prototype.ValueTypeName = 'string'),
  (StringKeyframeTrack.prototype.ValueBufferType = Array),
  (StringKeyframeTrack.prototype.DefaultInterpolation = InterpolateDiscrete),
  (StringKeyframeTrack.prototype.InterpolantFactoryMethodLinear = undefined),
  (StringKeyframeTrack.prototype.InterpolantFactoryMethodSmooth = undefined));
class VectorKeyframeTrack extends KeyframeTrack {
  constructor(_0x5f3166, _0x5d08aa, _0x44bbdd, _0x3cc8db) {
    super(_0x5f3166, _0x5d08aa, _0x44bbdd, _0x3cc8db);
  }
}
VectorKeyframeTrack.prototype.ValueTypeName = 'vector';
class AnimationClip {
  constructor(_0x2cb935 = '', _0xbbc6c0 = -1, _0x3b15fa = [], _0x505a3f = NormalAnimationBlendMode) {
    ((this.name = _0x2cb935),
      (this.tracks = _0x3b15fa),
      (this.duration = _0xbbc6c0),
      (this.blendMode = _0x505a3f),
      (this.uuid = generateUUID()),
      (this.userData = {}),
      this.duration < 0 && this.resetDuration());
  }
  static ['parse'](_0x24ff67) {
    const _0x19f35d = [],
      _0x20805a = _0x24ff67.tracks,
      _0x36e838 = 1 / (_0x24ff67.fps || 1);
    for (let _0x5f3e58 = 0, _0x19b574 = _0x20805a.length; _0x5f3e58 !== _0x19b574; ++_0x5f3e58) {
      _0x19f35d.push(parseKeyframeTrack(_0x20805a[_0x5f3e58]).scale(_0x36e838));
    }
    const _0x66648d = new this(_0x24ff67.name, _0x24ff67.duration, _0x19f35d, _0x24ff67.blendMode);
    return (
      (_0x66648d.uuid = _0x24ff67.uuid),
      (_0x66648d.userData = JSON.parse(_0x24ff67.userData || '{}')),
      _0x66648d
    );
  }
  static ['toJSON'](_0x2334ac) {
    const _0x3c1567 = [],
      _0x2a7857 = _0x2334ac.tracks,
      _0x5769b1 = {
        name: _0x2334ac.name,
        duration: _0x2334ac.duration,
        tracks: _0x3c1567,
        uuid: _0x2334ac.uuid,
        blendMode: _0x2334ac.blendMode,
        userData: JSON.stringify(_0x2334ac.userData),
      };
    for (let _0x28b28e = 0, _0x364b44 = _0x2a7857.length; _0x28b28e !== _0x364b44; ++_0x28b28e) {
      _0x3c1567.push(KeyframeTrack.toJSON(_0x2a7857[_0x28b28e]));
    }
    return _0x5769b1;
  }
  static ['CreateFromMorphTargetSequence'](_0x3cae5c, _0x5a8fea, _0x31ff05, _0x14572c) {
    const _0x1053c4 = _0x5a8fea.length,
      _0x2fc239 = [];
    for (let _0x36169d = 0; _0x36169d < _0x1053c4; _0x36169d++) {
      let _0x32f3cf = [],
        _0x33364a = [];
      (_0x32f3cf.push((_0x36169d + _0x1053c4 - 1) % _0x1053c4, _0x36169d, (_0x36169d + 1) % _0x1053c4),
        _0x33364a.push(0, 1, 0));
      const _0x58b8be = getKeyframeOrder(_0x32f3cf);
      ((_0x32f3cf = sortedArray(_0x32f3cf, 1, _0x58b8be)),
        (_0x33364a = sortedArray(_0x33364a, 1, _0x58b8be)),
        !_0x14572c && _0x32f3cf[0] === 0 && (_0x32f3cf.push(_0x1053c4), _0x33364a.push(_0x33364a[0])),
        _0x2fc239.push(
          new NumberKeyframeTrack(
            '.morphTargetInfluences[' + _0x5a8fea[_0x36169d].name + ']',
            _0x32f3cf,
            _0x33364a,
          ).scale(1 / _0x31ff05),
        ));
    }
    return new this(_0x3cae5c, -1, _0x2fc239);
  }
  static ['findByName'](_0xd32b60, _0x408eba) {
    let _0xd6e6b6 = _0xd32b60;
    if (!Array.isArray(_0xd32b60)) {
      const _0xd26a26 = _0xd32b60;
      _0xd6e6b6 = (_0xd26a26.geometry && _0xd26a26.geometry.animations) || _0xd26a26.animations;
    }
    for (let _0x3f03cb = 0; _0x3f03cb < _0xd6e6b6.length; _0x3f03cb++) {
      if (_0xd6e6b6[_0x3f03cb].name === _0x408eba) return _0xd6e6b6[_0x3f03cb];
    }
    return null;
  }
  static ['CreateClipsFromMorphTargetSequences'](_0x160f17, _0x4a69ad, _0x53ac3b) {
    const _0x1dcc80 = {},
      _0x4aff64 = /^([\w-]*?)([\d]+)$/;
    for (let _0x52af4c = 0, _0x4c8b9f = _0x160f17.length; _0x52af4c < _0x4c8b9f; _0x52af4c++) {
      const _0xfdb250 = _0x160f17[_0x52af4c],
        _0x2f8f45 = _0xfdb250.name.match(_0x4aff64);
      if (_0x2f8f45 && _0x2f8f45.length > 1) {
        const _0x400fea = _0x2f8f45[1];
        let _0x56d3da = _0x1dcc80[_0x400fea];
        (!_0x56d3da && (_0x1dcc80[_0x400fea] = _0x56d3da = []), _0x56d3da.push(_0xfdb250));
      }
    }
    const _0x4ef323 = [];
    for (const _0x1763c1 in _0x1dcc80) {
      _0x4ef323.push(
        this.CreateFromMorphTargetSequence(_0x1763c1, _0x1dcc80[_0x1763c1], _0x4a69ad, _0x53ac3b),
      );
    }
    return _0x4ef323;
  }
  static ['parseAnimation'](_0x551911, _0x4df385) {
    console.warn('THREE.AnimationClip: parseAnimation() is deprecated and will be removed with r185');
    if (!_0x551911) return (console.error('THREE.AnimationClip: No animation in JSONLoader data.'), null);
    const _0x3ba01e = function (_0x9deed4, _0xf3b334, _0x3c1366, _0x570f5b, _0x4d824f) {
        if (_0x3c1366.length !== 0) {
          const _0x3173b6 = [],
            _0x4c0981 = [];
          (flattenJSON(_0x3c1366, _0x3173b6, _0x4c0981, _0x570f5b),
            _0x3173b6.length !== 0 && _0x4d824f.push(new _0x9deed4(_0xf3b334, _0x3173b6, _0x4c0981)));
        }
      },
      _0xf9bbcc = [],
      _0x1fa42a = _0x551911.name || 'default',
      _0x539c2b = _0x551911.fps || 30,
      _0x21bfde = _0x551911.blendMode;
    let _0x337123 = _0x551911.length || -1;
    const _0x38ee04 = _0x551911.hierarchy || [];
    for (let _0x5a6d54 = 0; _0x5a6d54 < _0x38ee04.length; _0x5a6d54++) {
      const _0x35bdbd = _0x38ee04[_0x5a6d54].keys;
      if (!_0x35bdbd || _0x35bdbd.length === 0) continue;
      if (_0x35bdbd[0].morphTargets) {
        const _0x53ca22 = {};
        let _0x3fd31a;
        for (_0x3fd31a = 0; _0x3fd31a < _0x35bdbd.length; _0x3fd31a++) {
          if (_0x35bdbd[_0x3fd31a].morphTargets)
            for (let _0x492345 = 0; _0x492345 < _0x35bdbd[_0x3fd31a].morphTargets.length; _0x492345++) {
              _0x53ca22[_0x35bdbd[_0x3fd31a].morphTargets[_0x492345]] = -1;
            }
        }
        for (const _0x24bded in _0x53ca22) {
          const _0x4b90c7 = [],
            _0x5b81e4 = [];
          for (let _0x359adc = 0; _0x359adc !== _0x35bdbd[_0x3fd31a].morphTargets.length; ++_0x359adc) {
            const _0x4efa69 = _0x35bdbd[_0x3fd31a];
            (_0x4b90c7.push(_0x4efa69.time), _0x5b81e4.push(_0x4efa69.morphTarget === _0x24bded ? 1 : 0));
          }
          _0xf9bbcc.push(
            new NumberKeyframeTrack('.morphTargetInfluence[' + _0x24bded + ']', _0x4b90c7, _0x5b81e4),
          );
        }
        _0x337123 = _0x53ca22.length * _0x539c2b;
      } else {
        const _0x5a8d1d = '.bones[' + _0x4df385[_0x5a6d54].name + ']';
        (_0x3ba01e(VectorKeyframeTrack, _0x5a8d1d + '.position', _0x35bdbd, 'pos', _0xf9bbcc),
          _0x3ba01e(QuaternionKeyframeTrack, _0x5a8d1d + '.quaternion', _0x35bdbd, 'rot', _0xf9bbcc),
          _0x3ba01e(VectorKeyframeTrack, _0x5a8d1d + '.scale', _0x35bdbd, 'scl', _0xf9bbcc));
      }
    }
    if (_0xf9bbcc.length === 0) return null;
    const _0x4c47bc = new this(_0x1fa42a, _0x337123, _0xf9bbcc, _0x21bfde);
    return _0x4c47bc;
  }
  ['resetDuration']() {
    const _0x4ae8b8 = this.tracks;
    let _0x423520 = 0;
    for (let _0x26eee4 = 0, _0x3f62c0 = _0x4ae8b8.length; _0x26eee4 !== _0x3f62c0; ++_0x26eee4) {
      const _0x4c3cf0 = this.tracks[_0x26eee4];
      _0x423520 = Math.max(_0x423520, _0x4c3cf0.times[_0x4c3cf0.times.length - 1]);
    }
    return ((this.duration = _0x423520), this);
  }
  ['trim']() {
    for (let _0x4cee60 = 0; _0x4cee60 < this.tracks.length; _0x4cee60++) {
      this.tracks[_0x4cee60].trim(0, this.duration);
    }
    return this;
  }
  ['validate']() {
    let _0x9245dd = true;
    for (let _0x25cb36 = 0; _0x25cb36 < this.tracks.length; _0x25cb36++) {
      _0x9245dd = _0x9245dd && this.tracks[_0x25cb36].validate();
    }
    return _0x9245dd;
  }
  ['optimize']() {
    for (let _0x121fbc = 0; _0x121fbc < this.tracks.length; _0x121fbc++) {
      this.tracks[_0x121fbc].optimize();
    }
    return this;
  }
  ['clone']() {
    const _0x400f3c = [];
    for (let _0x42ba84 = 0; _0x42ba84 < this.tracks.length; _0x42ba84++) {
      _0x400f3c.push(this.tracks[_0x42ba84].clone());
    }
    const _0x5ced36 = new this.constructor(this.name, this.duration, _0x400f3c, this.blendMode);
    return ((_0x5ced36.userData = JSON.parse(JSON.stringify(this.userData))), _0x5ced36);
  }
  ['toJSON']() {
    return this.constructor.toJSON(this);
  }
}
function getTrackTypeForValueTypeName(_0x1b1662) {
  switch (_0x1b1662.toLowerCase()) {
    case 'scalar':
    case 'double':
    case 'float':
    case 'number':
    case 'integer':
      return NumberKeyframeTrack;
    case 'vector':
    case 'vector2':
    case 'vector3':
    case 'vector4':
      return VectorKeyframeTrack;
    case 'color':
      return ColorKeyframeTrack;
    case 'quaternion':
      return QuaternionKeyframeTrack;
    case 'bool':
    case 'boolean':
      return BooleanKeyframeTrack;
    case 'string':
      return StringKeyframeTrack;
  }
  throw new Error('THREE.KeyframeTrack: Unsupported typeName: ' + _0x1b1662);
}
function parseKeyframeTrack(_0x4db28d) {
  if (_0x4db28d.type === undefined)
    throw new Error('THREE.KeyframeTrack: track type undefined, can not parse');
  const _0x567f9a = getTrackTypeForValueTypeName(_0x4db28d.type);
  if (_0x4db28d.times === undefined) {
    const _0x27f83c = [],
      _0x25df3e = [];
    (flattenJSON(_0x4db28d.keys, _0x27f83c, _0x25df3e, 'value'),
      (_0x4db28d.times = _0x27f83c),
      (_0x4db28d.values = _0x25df3e));
  }
  return _0x567f9a.parse !== undefined
    ? _0x567f9a.parse(_0x4db28d)
    : new _0x567f9a(_0x4db28d.name, _0x4db28d.times, _0x4db28d.values, _0x4db28d.interpolation);
}
const Cache = {
  enabled: false,
  files: {},
  add: function (_0x29c79b, _0x1567b5) {
    if (this.enabled === false) return;
    this.files[_0x29c79b] = _0x1567b5;
  },
  get: function (_0x33aed2) {
    if (this.enabled === false) return;
    return this.files[_0x33aed2];
  },
  remove: function (_0x54515e) {
    delete this.files[_0x54515e];
  },
  clear: function () {
    this.files = {};
  },
};
class LoadingManager {
  constructor(_0xcd5914, _0x19bfd6, _0xa167ce) {
    const _0x1d8c77 = this;
    let _0x4e9286 = false,
      _0xbba8e4 = 0,
      _0x1bc124 = 0,
      _0x3c6883 = undefined;
    const _0x11587d = [];
    ((this.onStart = undefined),
      (this.onLoad = _0xcd5914),
      (this.onProgress = _0x19bfd6),
      (this.onError = _0xa167ce),
      (this.abortController = new AbortController()),
      (this.itemStart = function (_0x5765bc) {
        (_0x1bc124++,
          _0x4e9286 === false &&
            _0x1d8c77.onStart !== undefined &&
            _0x1d8c77.onStart(_0x5765bc, _0xbba8e4, _0x1bc124),
          (_0x4e9286 = true));
      }),
      (this.itemEnd = function (_0xfd0853) {
        (_0xbba8e4++,
          _0x1d8c77.onProgress !== undefined && _0x1d8c77.onProgress(_0xfd0853, _0xbba8e4, _0x1bc124),
          _0xbba8e4 === _0x1bc124 &&
            ((_0x4e9286 = false), _0x1d8c77.onLoad !== undefined && _0x1d8c77.onLoad()));
      }),
      (this.itemError = function (_0x7e65d9) {
        _0x1d8c77.onError !== undefined && _0x1d8c77.onError(_0x7e65d9);
      }),
      (this.resolveURL = function (_0x79dba2) {
        if (_0x3c6883) return _0x3c6883(_0x79dba2);
        return _0x79dba2;
      }),
      (this.setURLModifier = function (_0x16ef09) {
        return ((_0x3c6883 = _0x16ef09), this);
      }),
      (this.addHandler = function (_0x3224ff, _0x391255) {
        return (_0x11587d.push(_0x3224ff, _0x391255), this);
      }),
      (this.removeHandler = function (_0x53a7d0) {
        const _0x2a9372 = _0x11587d.indexOf(_0x53a7d0);
        return (_0x2a9372 !== -1 && _0x11587d.splice(_0x2a9372, 2), this);
      }),
      (this.getHandler = function (_0x197349) {
        for (let _0x23364c = 0, _0x32d607 = _0x11587d.length; _0x23364c < _0x32d607; _0x23364c += 2) {
          const _0x5a3da4 = _0x11587d[_0x23364c],
            _0x17b432 = _0x11587d[_0x23364c + 1];
          if (_0x5a3da4.global) _0x5a3da4.lastIndex = 0;
          if (_0x5a3da4.test(_0x197349)) return _0x17b432;
        }
        return null;
      }),
      (this.abort = function () {
        return (this.abortController.abort(), (this.abortController = new AbortController()), this);
      }));
  }
}
const DefaultLoadingManager = new LoadingManager();
class Loader {
  constructor(_0x254b60) {
    ((this.manager = _0x254b60 !== undefined ? _0x254b60 : DefaultLoadingManager),
      (this.crossOrigin = 'anonymous'),
      (this.withCredentials = false),
      (this.path = ''),
      (this.resourcePath = ''),
      (this.requestHeader = {}));
  }
  ['load']() {}
  ['loadAsync'](_0x2a9176, _0x1a8021) {
    const _0x225a00 = this;
    return new Promise(function (_0x2f6349, _0x328a17) {
      _0x225a00.load(_0x2a9176, _0x2f6349, _0x1a8021, _0x328a17);
    });
  }
  ['parse']() {}
  ['setCrossOrigin'](_0x19ce83) {
    return ((this.crossOrigin = _0x19ce83), this);
  }
  ['setWithCredentials'](_0x2165e5) {
    return ((this.withCredentials = _0x2165e5), this);
  }
  ['setPath'](_0x4262a6) {
    return ((this.path = _0x4262a6), this);
  }
  ['setResourcePath'](_0x41dbcf) {
    return ((this.resourcePath = _0x41dbcf), this);
  }
  ['setRequestHeader'](_0x484724) {
    return ((this.requestHeader = _0x484724), this);
  }
  ['abort']() {
    return this;
  }
}
Loader.DEFAULT_MATERIAL_NAME = '__DEFAULT';
const loading = {};
class HttpError extends Error {
  constructor(_0x5dda38, _0x5eb045) {
    (super(_0x5dda38), (this.response = _0x5eb045));
  }
}
class FileLoader extends Loader {
  constructor(_0x489eb8) {
    (super(_0x489eb8),
      (this.mimeType = ''),
      (this.responseType = ''),
      (this._abortController = new AbortController()));
  }
  ['load'](_0x36fcd6, _0x221d58, _0x55fde4, _0x1be034) {
    if (_0x36fcd6 === undefined) _0x36fcd6 = '';
    if (this.path !== undefined) _0x36fcd6 = this.path + _0x36fcd6;
    _0x36fcd6 = this.manager.resolveURL(_0x36fcd6);
    const _0x59f5af = Cache.get('file:' + _0x36fcd6);
    if (_0x59f5af !== undefined)
      return (
        this.manager.itemStart(_0x36fcd6),
        setTimeout(() => {
          if (_0x221d58) _0x221d58(_0x59f5af);
          this.manager.itemEnd(_0x36fcd6);
        }, 0),
        _0x59f5af
      );
    if (loading[_0x36fcd6] !== undefined) {
      loading[_0x36fcd6].push({ onLoad: _0x221d58, onProgress: _0x55fde4, onError: _0x1be034 });
      return;
    }
    ((loading[_0x36fcd6] = []),
      loading[_0x36fcd6].push({ onLoad: _0x221d58, onProgress: _0x55fde4, onError: _0x1be034 }));
    const _0x2bee5d = new Request(_0x36fcd6, {
        headers: new Headers(this.requestHeader),
        credentials: this.withCredentials ? 'include' : 'same-origin',
        signal:
          typeof AbortSignal.any === 'function'
            ? AbortSignal.any([this._abortController.signal, this.manager.abortController.signal])
            : this._abortController.signal,
      }),
      _0x388c3e = this.mimeType,
      _0x56c137 = this.responseType;
    (fetch(_0x2bee5d)
      .then((_0x132972) => {
        if (_0x132972.status === 200 || _0x132972.status === 0) {
          _0x132972.status === 0 && console.warn('THREE.FileLoader: HTTP Status 0 received.');
          if (
            typeof ReadableStream === 'undefined' ||
            _0x132972.body === undefined ||
            _0x132972.body.getReader === undefined
          )
            return _0x132972;
          const _0x39282b = loading[_0x36fcd6],
            _0x2e6335 = _0x132972.body.getReader(),
            _0x976f30 = _0x132972.headers.get('X-File-Size') || _0x132972.headers.get('Content-Length'),
            _0x4b1995 = _0x976f30 ? parseInt(_0x976f30) : 0,
            _0x1c82db = _0x4b1995 !== 0;
          let _0x4f1296 = 0;
          const _0x371dbf = new ReadableStream({
            start(_0x50d29e) {
              _0x33639f();
              function _0x33639f() {
                _0x2e6335.read().then(
                  ({ done: _0x1a4c0c, value: _0x51c6b6 }) => {
                    if (_0x1a4c0c) _0x50d29e.close();
                    else {
                      _0x4f1296 += _0x51c6b6.byteLength;
                      const _0x4b6935 = new ProgressEvent('progress', {
                        lengthComputable: _0x1c82db,
                        loaded: _0x4f1296,
                        total: _0x4b1995,
                      });
                      for (
                        let _0x3f3474 = 0, _0x399d38 = _0x39282b.length;
                        _0x3f3474 < _0x399d38;
                        _0x3f3474++
                      ) {
                        const _0x49fcf4 = _0x39282b[_0x3f3474];
                        if (_0x49fcf4.onProgress) _0x49fcf4.onProgress(_0x4b6935);
                      }
                      (_0x50d29e.enqueue(_0x51c6b6), _0x33639f());
                    }
                  },
                  (_0x5e276f) => {
                    _0x50d29e.error(_0x5e276f);
                  },
                );
              }
            },
          });
          return new Response(_0x371dbf);
        } else
          throw new HttpError(
            'fetch for "' +
              _0x132972.url +
              '" responded with ' +
              _0x132972.status +
              ': ' +
              _0x132972.statusText,
            _0x132972,
          );
      })
      .then((_0x42a434) => {
        switch (_0x56c137) {
          case 'arraybuffer':
            return _0x42a434.arrayBuffer();
          case 'blob':
            return _0x42a434.blob();
          case 'document':
            return _0x42a434.text().then((_0x692e1f) => {
              const _0x12bc4d = new DOMParser();
              return _0x12bc4d.parseFromString(_0x692e1f, _0x388c3e);
            });
          case 'json':
            return _0x42a434.json();
          default:
            if (_0x388c3e === '') return _0x42a434.text();
            else {
              const _0x4aafa2 = /charset="?([^;"\s]*)"?/i,
                _0x479f11 = _0x4aafa2.exec(_0x388c3e),
                _0x5636b0 = _0x479f11 && _0x479f11[1] ? _0x479f11[1].toLowerCase() : undefined,
                _0x34bd8a = new TextDecoder(_0x5636b0);
              return _0x42a434.arrayBuffer().then((_0x29e4b4) => _0x34bd8a.decode(_0x29e4b4));
            }
        }
      })
      .then((_0xa9617b) => {
        Cache.add('file:' + _0x36fcd6, _0xa9617b);
        const _0x4c8122 = loading[_0x36fcd6];
        delete loading[_0x36fcd6];
        for (let _0x1b1520 = 0, _0x141f1c = _0x4c8122.length; _0x1b1520 < _0x141f1c; _0x1b1520++) {
          const _0x468e01 = _0x4c8122[_0x1b1520];
          if (_0x468e01.onLoad) _0x468e01.onLoad(_0xa9617b);
        }
      })
      .catch((_0x37f5f3) => {
        const _0xbbdbfa = loading[_0x36fcd6];
        if (_0xbbdbfa === undefined) {
          this.manager.itemError(_0x36fcd6);
          throw _0x37f5f3;
        }
        delete loading[_0x36fcd6];
        for (let _0x14eee1 = 0, _0x3ab86a = _0xbbdbfa.length; _0x14eee1 < _0x3ab86a; _0x14eee1++) {
          const _0xbb521f = _0xbbdbfa[_0x14eee1];
          if (_0xbb521f.onError) _0xbb521f.onError(_0x37f5f3);
        }
        this.manager.itemError(_0x36fcd6);
      })
      .finally(() => {
        this.manager.itemEnd(_0x36fcd6);
      }),
      this.manager.itemStart(_0x36fcd6));
  }
  ['setResponseType'](_0x40fc8b) {
    return ((this.responseType = _0x40fc8b), this);
  }
  ['setMimeType'](_0x254085) {
    return ((this.mimeType = _0x254085), this);
  }
  ['abort']() {
    return (this._abortController.abort(), (this._abortController = new AbortController()), this);
  }
}
class AnimationLoader extends Loader {
  constructor(_0x2acbfb) {
    super(_0x2acbfb);
  }
  ['load'](_0x18806c, _0x38af86, _0x46bf0c, _0x5a4e56) {
    const _0xc10fbd = this,
      _0x203048 = new FileLoader(this.manager);
    (_0x203048.setPath(this.path),
      _0x203048.setRequestHeader(this.requestHeader),
      _0x203048.setWithCredentials(this.withCredentials),
      _0x203048.load(
        _0x18806c,
        function (_0x1bbcd7) {
          try {
            _0x38af86(_0xc10fbd.parse(JSON.parse(_0x1bbcd7)));
          } catch (_0xe6dfc5) {
            (_0x5a4e56 ? _0x5a4e56(_0xe6dfc5) : console.error(_0xe6dfc5),
              _0xc10fbd.manager.itemError(_0x18806c));
          }
        },
        _0x46bf0c,
        _0x5a4e56,
      ));
  }
  ['parse'](_0x33af75) {
    const _0x31d3d4 = [];
    for (let _0x4fb4b3 = 0; _0x4fb4b3 < _0x33af75.length; _0x4fb4b3++) {
      const _0x1708be = AnimationClip.parse(_0x33af75[_0x4fb4b3]);
      _0x31d3d4.push(_0x1708be);
    }
    return _0x31d3d4;
  }
}
class CompressedTextureLoader extends Loader {
  constructor(_0x5e1a54) {
    super(_0x5e1a54);
  }
  ['load'](_0xfb1c61, _0x2e85fb, _0x332629, _0x21bd53) {
    const _0x11aa5f = this,
      _0x3f5486 = [],
      _0x38ee45 = new CompressedTexture(),
      _0x41deb0 = new FileLoader(this.manager);
    (_0x41deb0.setPath(this.path),
      _0x41deb0.setResponseType('arraybuffer'),
      _0x41deb0.setRequestHeader(this.requestHeader),
      _0x41deb0.setWithCredentials(_0x11aa5f.withCredentials));
    let _0x4bfaae = 0;
    function _0x11a6fd(_0x8dc502) {
      _0x41deb0.load(
        _0xfb1c61[_0x8dc502],
        function (_0x2c1846) {
          const _0x334cee = _0x11aa5f.parse(_0x2c1846, true);
          ((_0x3f5486[_0x8dc502] = {
            width: _0x334cee.width,
            height: _0x334cee.height,
            format: _0x334cee.format,
            mipmaps: _0x334cee.mipmaps,
          }),
            (_0x4bfaae += 1));
          if (_0x4bfaae === 6) {
            if (_0x334cee.mipmapCount === 1) _0x38ee45.minFilter = LinearFilter;
            ((_0x38ee45.image = _0x3f5486),
              (_0x38ee45.format = _0x334cee.format),
              (_0x38ee45.needsUpdate = true));
            if (_0x2e85fb) _0x2e85fb(_0x38ee45);
          }
        },
        _0x332629,
        _0x21bd53,
      );
    }
    if (Array.isArray(_0xfb1c61))
      for (let _0x55eef7 = 0, _0xab8e94 = _0xfb1c61.length; _0x55eef7 < _0xab8e94; ++_0x55eef7) {
        _0x11a6fd(_0x55eef7);
      }
    else
      _0x41deb0.load(
        _0xfb1c61,
        function (_0x56ed31) {
          const _0x510e60 = _0x11aa5f.parse(_0x56ed31, true);
          if (_0x510e60.isCubemap) {
            const _0x30c86f = _0x510e60.mipmaps.length / _0x510e60.mipmapCount;
            for (let _0x14a2d9 = 0; _0x14a2d9 < _0x30c86f; _0x14a2d9++) {
              _0x3f5486[_0x14a2d9] = { mipmaps: [] };
              for (let _0x5de0d1 = 0; _0x5de0d1 < _0x510e60.mipmapCount; _0x5de0d1++) {
                (_0x3f5486[_0x14a2d9].mipmaps.push(
                  _0x510e60.mipmaps[_0x14a2d9 * _0x510e60.mipmapCount + _0x5de0d1],
                ),
                  (_0x3f5486[_0x14a2d9].format = _0x510e60.format),
                  (_0x3f5486[_0x14a2d9].width = _0x510e60.width),
                  (_0x3f5486[_0x14a2d9].height = _0x510e60.height));
              }
            }
            _0x38ee45.image = _0x3f5486;
          } else
            ((_0x38ee45.image.width = _0x510e60.width),
              (_0x38ee45.image.height = _0x510e60.height),
              (_0x38ee45.mipmaps = _0x510e60.mipmaps));
          _0x510e60.mipmapCount === 1 && (_0x38ee45.minFilter = LinearFilter);
          ((_0x38ee45.format = _0x510e60.format), (_0x38ee45.needsUpdate = true));
          if (_0x2e85fb) _0x2e85fb(_0x38ee45);
        },
        _0x332629,
        _0x21bd53,
      );
    return _0x38ee45;
  }
}
const _loading = new WeakMap();
class ImageLoader extends Loader {
  constructor(_0x4bc0ef) {
    super(_0x4bc0ef);
  }
  ['load'](_0x2096f7, _0x4ad252, _0x502187, _0x7204fa) {
    if (this.path !== undefined) _0x2096f7 = this.path + _0x2096f7;
    _0x2096f7 = this.manager.resolveURL(_0x2096f7);
    const _0x45a9bb = this,
      _0x59b90b = Cache.get('image:' + _0x2096f7);
    if (_0x59b90b !== undefined) {
      if (_0x59b90b.complete === true)
        (_0x45a9bb.manager.itemStart(_0x2096f7),
          setTimeout(function () {
            if (_0x4ad252) _0x4ad252(_0x59b90b);
            _0x45a9bb.manager.itemEnd(_0x2096f7);
          }, 0));
      else {
        let _0x5e4a01 = _loading.get(_0x59b90b);
        (_0x5e4a01 === undefined && ((_0x5e4a01 = []), _loading.set(_0x59b90b, _0x5e4a01)),
          _0x5e4a01.push({ onLoad: _0x4ad252, onError: _0x7204fa }));
      }
      return _0x59b90b;
    }
    const _0x3f381d = createElementNS('img');
    function _0x551087() {
      _0x107267();
      if (_0x4ad252) _0x4ad252(this);
      const _0x2eea06 = _loading.get(this) || [];
      for (let _0x415b6a = 0; _0x415b6a < _0x2eea06.length; _0x415b6a++) {
        const _0x1a7b38 = _0x2eea06[_0x415b6a];
        if (_0x1a7b38.onLoad) _0x1a7b38.onLoad(this);
      }
      (_loading.delete(this), _0x45a9bb.manager.itemEnd(_0x2096f7));
    }
    function _0x456141(_0x3a32ce) {
      _0x107267();
      if (_0x7204fa) _0x7204fa(_0x3a32ce);
      Cache.remove('image:' + _0x2096f7);
      const _0x36dbf7 = _loading.get(this) || [];
      for (let _0x2b04fb = 0; _0x2b04fb < _0x36dbf7.length; _0x2b04fb++) {
        const _0x537837 = _0x36dbf7[_0x2b04fb];
        if (_0x537837.onError) _0x537837.onError(_0x3a32ce);
      }
      (_loading.delete(this), _0x45a9bb.manager.itemError(_0x2096f7), _0x45a9bb.manager.itemEnd(_0x2096f7));
    }
    function _0x107267() {
      (_0x3f381d.removeEventListener('load', _0x551087, false),
        _0x3f381d.removeEventListener('error', _0x456141, false));
    }
    (_0x3f381d.addEventListener('load', _0x551087, false),
      _0x3f381d.addEventListener('error', _0x456141, false));
    if (_0x2096f7.slice(0, 5) !== 'data:') {
      if (this.crossOrigin !== undefined) _0x3f381d.crossOrigin = this.crossOrigin;
    }
    return (
      Cache.add('image:' + _0x2096f7, _0x3f381d),
      _0x45a9bb.manager.itemStart(_0x2096f7),
      (_0x3f381d.src = _0x2096f7),
      _0x3f381d
    );
  }
}
class CubeTextureLoader extends Loader {
  constructor(_0x25e824) {
    super(_0x25e824);
  }
  ['load'](_0x1fc8d6, _0x323b5d, _0x2e74cc, _0x197d3f) {
    const _0x532bfb = new CubeTexture();
    _0x532bfb.colorSpace = SRGBColorSpace;
    const _0x330c66 = new ImageLoader(this.manager);
    (_0x330c66.setCrossOrigin(this.crossOrigin), _0x330c66.setPath(this.path));
    let _0x29e65e = 0;
    function _0x383413(_0x361a2a) {
      _0x330c66.load(
        _0x1fc8d6[_0x361a2a],
        function (_0x4c7bb0) {
          ((_0x532bfb.images[_0x361a2a] = _0x4c7bb0), _0x29e65e++);
          if (_0x29e65e === 6) {
            _0x532bfb.needsUpdate = true;
            if (_0x323b5d) _0x323b5d(_0x532bfb);
          }
        },
        undefined,
        _0x197d3f,
      );
    }
    for (let _0x47f081 = 0; _0x47f081 < _0x1fc8d6.length; ++_0x47f081) {
      _0x383413(_0x47f081);
    }
    return _0x532bfb;
  }
}
class DataTextureLoader extends Loader {
  constructor(_0xafc081) {
    super(_0xafc081);
  }
  ['load'](_0x47f06e, _0x4b7102, _0x3a4412, _0x154bca) {
    const _0x4c093d = this,
      _0x32d553 = new DataTexture(),
      _0xf42d24 = new FileLoader(this.manager);
    return (
      _0xf42d24.setResponseType('arraybuffer'),
      _0xf42d24.setRequestHeader(this.requestHeader),
      _0xf42d24.setPath(this.path),
      _0xf42d24.setWithCredentials(_0x4c093d.withCredentials),
      _0xf42d24.load(
        _0x47f06e,
        function (_0x154e2c) {
          let _0x43a170;
          try {
            _0x43a170 = _0x4c093d.parse(_0x154e2c);
          } catch (_0x517e03) {
            if (_0x154bca !== undefined) _0x154bca(_0x517e03);
            else {
              console.error(_0x517e03);
              return;
            }
          }
          if (_0x43a170.image !== undefined) _0x32d553.image = _0x43a170.image;
          else
            _0x43a170.data !== undefined &&
              ((_0x32d553.image.width = _0x43a170.width),
              (_0x32d553.image.height = _0x43a170.height),
              (_0x32d553.image.data = _0x43a170.data));
          ((_0x32d553.wrapS = _0x43a170.wrapS !== undefined ? _0x43a170.wrapS : ClampToEdgeWrapping),
            (_0x32d553.wrapT = _0x43a170.wrapT !== undefined ? _0x43a170.wrapT : ClampToEdgeWrapping),
            (_0x32d553.magFilter = _0x43a170.magFilter !== undefined ? _0x43a170.magFilter : LinearFilter),
            (_0x32d553.minFilter = _0x43a170.minFilter !== undefined ? _0x43a170.minFilter : LinearFilter),
            (_0x32d553.anisotropy = _0x43a170.anisotropy !== undefined ? _0x43a170.anisotropy : 1));
          _0x43a170.colorSpace !== undefined && (_0x32d553.colorSpace = _0x43a170.colorSpace);
          _0x43a170.flipY !== undefined && (_0x32d553.flipY = _0x43a170.flipY);
          _0x43a170.format !== undefined && (_0x32d553.format = _0x43a170.format);
          _0x43a170.type !== undefined && (_0x32d553.type = _0x43a170.type);
          _0x43a170.mipmaps !== undefined &&
            ((_0x32d553.mipmaps = _0x43a170.mipmaps), (_0x32d553.minFilter = LinearMipmapLinearFilter));
          _0x43a170.mipmapCount === 1 && (_0x32d553.minFilter = LinearFilter);
          _0x43a170.generateMipmaps !== undefined && (_0x32d553.generateMipmaps = _0x43a170.generateMipmaps);
          _0x32d553.needsUpdate = true;
          if (_0x4b7102) _0x4b7102(_0x32d553, _0x43a170);
        },
        _0x3a4412,
        _0x154bca,
      ),
      _0x32d553
    );
  }
}
class TextureLoader extends Loader {
  constructor(_0xcf2e67) {
    super(_0xcf2e67);
  }
  ['load'](_0x5e586f, _0x3d1517, _0x54da26, _0x2a031f) {
    const _0x79cc85 = new Texture(),
      _0x29cab9 = new ImageLoader(this.manager);
    return (
      _0x29cab9.setCrossOrigin(this.crossOrigin),
      _0x29cab9.setPath(this.path),
      _0x29cab9.load(
        _0x5e586f,
        function (_0x3cc9d9) {
          ((_0x79cc85.image = _0x3cc9d9),
            (_0x79cc85.needsUpdate = true),
            _0x3d1517 !== undefined && _0x3d1517(_0x79cc85));
        },
        _0x54da26,
        _0x2a031f,
      ),
      _0x79cc85
    );
  }
}
class Light extends Object3D {
  constructor(_0x441ac2, _0x34fdfe = 1) {
    (super(),
      (this.isLight = true),
      (this.type = 'Light'),
      (this.color = new Color(_0x441ac2)),
      (this.intensity = _0x34fdfe));
  }
  ['dispose']() {}
  ['copy'](_0x33b2e7, _0x4371a9) {
    return (
      super.copy(_0x33b2e7, _0x4371a9),
      this.color.copy(_0x33b2e7.color),
      (this.intensity = _0x33b2e7.intensity),
      this
    );
  }
  ['toJSON'](_0x511242) {
    const _0x2e8318 = super.toJSON(_0x511242);
    ((_0x2e8318.object.color = this.color.getHex()), (_0x2e8318.object.intensity = this.intensity));
    if (this.groundColor !== undefined) _0x2e8318.object.groundColor = this.groundColor.getHex();
    if (this.distance !== undefined) _0x2e8318.object.distance = this.distance;
    if (this.angle !== undefined) _0x2e8318.object.angle = this.angle;
    if (this.decay !== undefined) _0x2e8318.object.decay = this.decay;
    if (this.penumbra !== undefined) _0x2e8318.object.penumbra = this.penumbra;
    if (this.shadow !== undefined) _0x2e8318.object.shadow = this.shadow.toJSON();
    if (this.target !== undefined) _0x2e8318.object.target = this.target.uuid;
    return _0x2e8318;
  }
}
class HemisphereLight extends Light {
  constructor(_0x10d864, _0x413c47, _0x9a7167) {
    (super(_0x10d864, _0x9a7167),
      (this.isHemisphereLight = true),
      (this.type = 'HemisphereLight'),
      this.position.copy(Object3D.DEFAULT_UP),
      this.updateMatrix(),
      (this.groundColor = new Color(_0x413c47)));
  }
  ['copy'](_0x31a302, _0x25a50b) {
    return (super.copy(_0x31a302, _0x25a50b), this.groundColor.copy(_0x31a302.groundColor), this);
  }
}
const _projScreenMatrix$1 = new Matrix4(),
  _lightPositionWorld$1 = new Vector3(),
  _lookTarget$1 = new Vector3();
class LightShadow {
  constructor(_0x225f54) {
    ((this.camera = _0x225f54),
      (this.intensity = 1),
      (this.bias = 0),
      (this.normalBias = 0),
      (this.radius = 1),
      (this.blurSamples = 8),
      (this.mapSize = new Vector2(0x200, 0x200)),
      (this.mapType = UnsignedByteType),
      (this.map = null),
      (this.mapPass = null),
      (this.matrix = new Matrix4()),
      (this.autoUpdate = true),
      (this.needsUpdate = false),
      (this._frustum = new Frustum()),
      (this._frameExtents = new Vector2(1, 1)),
      (this._viewportCount = 1),
      (this._viewports = [new Vector4(0, 0, 1, 1)]));
  }
  ['getViewportCount']() {
    return this._viewportCount;
  }
  ['getFrustum']() {
    return this._frustum;
  }
  ['updateMatrices'](_0x489dcb) {
    const _0x19ba18 = this.camera,
      _0x5d671a = this.matrix;
    (_lightPositionWorld$1.setFromMatrixPosition(_0x489dcb.matrixWorld),
      _0x19ba18.position.copy(_lightPositionWorld$1),
      _lookTarget$1.setFromMatrixPosition(_0x489dcb.target.matrixWorld),
      _0x19ba18.lookAt(_lookTarget$1),
      _0x19ba18.updateMatrixWorld(),
      _projScreenMatrix$1.multiplyMatrices(_0x19ba18.projectionMatrix, _0x19ba18.matrixWorldInverse),
      this._frustum.setFromProjectionMatrix(
        _projScreenMatrix$1,
        _0x19ba18.coordinateSystem,
        _0x19ba18.reversedDepth,
      ),
      _0x19ba18.reversedDepth
        ? _0x5d671a.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 1, 0, 0, 0, 0, 1)
        : _0x5d671a.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1),
      _0x5d671a.multiply(_projScreenMatrix$1));
  }
  ['getViewport'](_0x1ef3d7) {
    return this._viewports[_0x1ef3d7];
  }
  ['getFrameExtents']() {
    return this._frameExtents;
  }
  ['dispose']() {
    (this.map && this.map.dispose(), this.mapPass && this.mapPass.dispose());
  }
  ['copy'](_0x5dffc2) {
    return (
      (this.camera = _0x5dffc2.camera.clone()),
      (this.intensity = _0x5dffc2.intensity),
      (this.bias = _0x5dffc2.bias),
      (this.radius = _0x5dffc2.radius),
      (this.autoUpdate = _0x5dffc2.autoUpdate),
      (this.needsUpdate = _0x5dffc2.needsUpdate),
      (this.normalBias = _0x5dffc2.normalBias),
      (this.blurSamples = _0x5dffc2.blurSamples),
      this.mapSize.copy(_0x5dffc2.mapSize),
      this
    );
  }
  ['clone']() {
    return new this.constructor().copy(this);
  }
  ['toJSON']() {
    const _0x655f90 = {};
    if (this.intensity !== 1) _0x655f90.intensity = this.intensity;
    if (this.bias !== 0) _0x655f90.bias = this.bias;
    if (this.normalBias !== 0) _0x655f90.normalBias = this.normalBias;
    if (this.radius !== 1) _0x655f90.radius = this.radius;
    if (this.mapSize.x !== 0x200 || this.mapSize.y !== 0x200) _0x655f90.mapSize = this.mapSize.toArray();
    return ((_0x655f90.camera = this.camera.toJSON(false).object), delete _0x655f90.camera.matrix, _0x655f90);
  }
}
class SpotLightShadow extends LightShadow {
  constructor() {
    (super(new PerspectiveCamera(50, 1, 0.5, 0x1f4)),
      (this.isSpotLightShadow = true),
      (this.focus = 1),
      (this.aspect = 1));
  }
  ['updateMatrices'](_0x13a19b) {
    const _0x84ab2f = this.camera,
      _0x14ba62 = RAD2DEG * 2 * _0x13a19b.angle * this.focus,
      _0x44602f = (this.mapSize.width / this.mapSize.height) * this.aspect,
      _0x33e74b = _0x13a19b.distance || _0x84ab2f.far;
    ((_0x14ba62 !== _0x84ab2f.fov || _0x44602f !== _0x84ab2f.aspect || _0x33e74b !== _0x84ab2f.far) &&
      ((_0x84ab2f.fov = _0x14ba62),
      (_0x84ab2f.aspect = _0x44602f),
      (_0x84ab2f.far = _0x33e74b),
      _0x84ab2f.updateProjectionMatrix()),
      super.updateMatrices(_0x13a19b));
  }
  ['copy'](_0x20434c) {
    return (super.copy(_0x20434c), (this.focus = _0x20434c.focus), this);
  }
}
class SpotLight extends Light {
  constructor(_0x2249ae, _0x4851ba, _0x39005f = 0, _0x227828 = Math.PI / 3, _0x288822 = 0, _0x2357ef = 2) {
    (super(_0x2249ae, _0x4851ba),
      (this.isSpotLight = true),
      (this.type = 'SpotLight'),
      this.position.copy(Object3D.DEFAULT_UP),
      this.updateMatrix(),
      (this.target = new Object3D()),
      (this.distance = _0x39005f),
      (this.angle = _0x227828),
      (this.penumbra = _0x288822),
      (this.decay = _0x2357ef),
      (this.map = null),
      (this.shadow = new SpotLightShadow()));
  }
  get ['power']() {
    return this.intensity * Math.PI;
  }
  set ['power'](_0x5158d7) {
    this.intensity = _0x5158d7 / Math.PI;
  }
  ['dispose']() {
    this.shadow.dispose();
  }
  ['copy'](_0x38bb4a, _0x5e4d6d) {
    return (
      super.copy(_0x38bb4a, _0x5e4d6d),
      (this.distance = _0x38bb4a.distance),
      (this.angle = _0x38bb4a.angle),
      (this.penumbra = _0x38bb4a.penumbra),
      (this.decay = _0x38bb4a.decay),
      (this.target = _0x38bb4a.target.clone()),
      (this.shadow = _0x38bb4a.shadow.clone()),
      this
    );
  }
}
const _projScreenMatrix = new Matrix4(),
  _lightPositionWorld = new Vector3(),
  _lookTarget = new Vector3();
class PointLightShadow extends LightShadow {
  constructor() {
    (super(new PerspectiveCamera(90, 1, 0.5, 0x1f4)),
      (this.isPointLightShadow = true),
      (this._frameExtents = new Vector2(4, 2)),
      (this._viewportCount = 6),
      (this._viewports = [
        new Vector4(2, 1, 1, 1),
        new Vector4(0, 1, 1, 1),
        new Vector4(3, 1, 1, 1),
        new Vector4(1, 1, 1, 1),
        new Vector4(3, 0, 1, 1),
        new Vector4(1, 0, 1, 1),
      ]),
      (this._cubeDirections = [
        new Vector3(1, 0, 0),
        new Vector3(-1, 0, 0),
        new Vector3(0, 0, 1),
        new Vector3(0, 0, -1),
        new Vector3(0, 1, 0),
        new Vector3(0, -1, 0),
      ]),
      (this._cubeUps = [
        new Vector3(0, 1, 0),
        new Vector3(0, 1, 0),
        new Vector3(0, 1, 0),
        new Vector3(0, 1, 0),
        new Vector3(0, 0, 1),
        new Vector3(0, 0, -1),
      ]));
  }
  ['updateMatrices'](_0x46cab1, _0x1b9e17 = 0) {
    const _0x582f3c = this.camera,
      _0x3ac985 = this.matrix,
      _0x4913cc = _0x46cab1.distance || _0x582f3c.far;
    (_0x4913cc !== _0x582f3c.far && ((_0x582f3c.far = _0x4913cc), _0x582f3c.updateProjectionMatrix()),
      _lightPositionWorld.setFromMatrixPosition(_0x46cab1.matrixWorld),
      _0x582f3c.position.copy(_lightPositionWorld),
      _lookTarget.copy(_0x582f3c.position),
      _lookTarget.add(this._cubeDirections[_0x1b9e17]),
      _0x582f3c.up.copy(this._cubeUps[_0x1b9e17]),
      _0x582f3c.lookAt(_lookTarget),
      _0x582f3c.updateMatrixWorld(),
      _0x3ac985.makeTranslation(-_lightPositionWorld.x, -_lightPositionWorld.y, -_lightPositionWorld.z),
      _projScreenMatrix.multiplyMatrices(_0x582f3c.projectionMatrix, _0x582f3c.matrixWorldInverse),
      this._frustum.setFromProjectionMatrix(
        _projScreenMatrix,
        _0x582f3c.coordinateSystem,
        _0x582f3c.reversedDepth,
      ));
  }
}
class PointLight extends Light {
  constructor(_0x23d1b9, _0x3c191d, _0x1b9897 = 0, _0x27b897 = 2) {
    (super(_0x23d1b9, _0x3c191d),
      (this.isPointLight = true),
      (this.type = 'PointLight'),
      (this.distance = _0x1b9897),
      (this.decay = _0x27b897),
      (this.shadow = new PointLightShadow()));
  }
  get ['power']() {
    return this.intensity * 4 * Math.PI;
  }
  set ['power'](_0x2b6a34) {
    this.intensity = _0x2b6a34 / (4 * Math.PI);
  }
  ['dispose']() {
    this.shadow.dispose();
  }
  ['copy'](_0x5df164, _0x5196dd) {
    return (
      super.copy(_0x5df164, _0x5196dd),
      (this.distance = _0x5df164.distance),
      (this.decay = _0x5df164.decay),
      (this.shadow = _0x5df164.shadow.clone()),
      this
    );
  }
}
class OrthographicCamera extends Camera {
  constructor(
    _0x1ddb33 = -1,
    _0x946b80 = 1,
    _0x347e81 = 1,
    _0x1f0c67 = -1,
    _0x3fef39 = 0.1,
    _0x4581ea = 0x7d0,
  ) {
    (super(),
      (this.isOrthographicCamera = true),
      (this.type = 'OrthographicCamera'),
      (this.zoom = 1),
      (this.view = null),
      (this.left = _0x1ddb33),
      (this.right = _0x946b80),
      (this.top = _0x347e81),
      (this.bottom = _0x1f0c67),
      (this.near = _0x3fef39),
      (this.far = _0x4581ea),
      this.updateProjectionMatrix());
  }
  ['copy'](_0x17c7e8, _0x732988) {
    return (
      super.copy(_0x17c7e8, _0x732988),
      (this.left = _0x17c7e8.left),
      (this.right = _0x17c7e8.right),
      (this.top = _0x17c7e8.top),
      (this.bottom = _0x17c7e8.bottom),
      (this.near = _0x17c7e8.near),
      (this.far = _0x17c7e8.far),
      (this.zoom = _0x17c7e8.zoom),
      (this.view = _0x17c7e8.view === null ? null : Object.assign({}, _0x17c7e8.view)),
      this
    );
  }
  ['setViewOffset'](_0x3c5423, _0x46d7c2, _0x50da16, _0x56e11a, _0x1ae470, _0x1e2a30) {
    (this.view === null &&
      (this.view = {
        enabled: true,
        fullWidth: 1,
        fullHeight: 1,
        offsetX: 0,
        offsetY: 0,
        width: 1,
        height: 1,
      }),
      (this.view.enabled = true),
      (this.view.fullWidth = _0x3c5423),
      (this.view.fullHeight = _0x46d7c2),
      (this.view.offsetX = _0x50da16),
      (this.view.offsetY = _0x56e11a),
      (this.view.width = _0x1ae470),
      (this.view.height = _0x1e2a30),
      this.updateProjectionMatrix());
  }
  ['clearViewOffset']() {
    (this.view !== null && (this.view.enabled = false), this.updateProjectionMatrix());
  }
  ['updateProjectionMatrix']() {
    const _0x20de3a = (this.right - this.left) / (2 * this.zoom),
      _0x12d9b5 = (this.top - this.bottom) / (2 * this.zoom),
      _0x1bd71e = (this.right + this.left) / 2,
      _0x11839c = (this.top + this.bottom) / 2;
    let _0x31f5cb = _0x1bd71e - _0x20de3a,
      _0x325514 = _0x1bd71e + _0x20de3a,
      _0x476dcc = _0x11839c + _0x12d9b5,
      _0x70bfd4 = _0x11839c - _0x12d9b5;
    if (this.view !== null && this.view.enabled) {
      const _0x3a7ede = (this.right - this.left) / this.view.fullWidth / this.zoom,
        _0x1c4f0f = (this.top - this.bottom) / this.view.fullHeight / this.zoom;
      ((_0x31f5cb += _0x3a7ede * this.view.offsetX),
        (_0x325514 = _0x31f5cb + _0x3a7ede * this.view.width),
        (_0x476dcc -= _0x1c4f0f * this.view.offsetY),
        (_0x70bfd4 = _0x476dcc - _0x1c4f0f * this.view.height));
    }
    (this.projectionMatrix.makeOrthographic(
      _0x31f5cb,
      _0x325514,
      _0x476dcc,
      _0x70bfd4,
      this.near,
      this.far,
      this.coordinateSystem,
      this.reversedDepth,
    ),
      this.projectionMatrixInverse.copy(this.projectionMatrix).invert());
  }
  ['toJSON'](_0x4f6567) {
    const _0x46f3c0 = super.toJSON(_0x4f6567);
    ((_0x46f3c0.object.zoom = this.zoom),
      (_0x46f3c0.object.left = this.left),
      (_0x46f3c0.object.right = this.right),
      (_0x46f3c0.object.top = this.top),
      (_0x46f3c0.object.bottom = this.bottom),
      (_0x46f3c0.object.near = this.near),
      (_0x46f3c0.object.far = this.far));
    if (this.view !== null) _0x46f3c0.object.view = Object.assign({}, this.view);
    return _0x46f3c0;
  }
}
class DirectionalLightShadow extends LightShadow {
  constructor() {
    (super(new OrthographicCamera(-5, 5, 5, -5, 0.5, 0x1f4)), (this.isDirectionalLightShadow = true));
  }
}
class DirectionalLight extends Light {
  constructor(_0x476f7b, _0x367b4c) {
    (super(_0x476f7b, _0x367b4c),
      (this.isDirectionalLight = true),
      (this.type = 'DirectionalLight'),
      this.position.copy(Object3D.DEFAULT_UP),
      this.updateMatrix(),
      (this.target = new Object3D()),
      (this.shadow = new DirectionalLightShadow()));
  }
  ['dispose']() {
    this.shadow.dispose();
  }
  ['copy'](_0x50945e) {
    return (
      super.copy(_0x50945e),
      (this.target = _0x50945e.target.clone()),
      (this.shadow = _0x50945e.shadow.clone()),
      this
    );
  }
}
class AmbientLight extends Light {
  constructor(_0x41f763, _0x3ac6d3) {
    (super(_0x41f763, _0x3ac6d3), (this.isAmbientLight = true), (this.type = 'AmbientLight'));
  }
}
class RectAreaLight extends Light {
  constructor(_0x5b67c1, _0x10387a, _0x3185ed = 10, _0x24a790 = 10) {
    (super(_0x5b67c1, _0x10387a),
      (this.isRectAreaLight = true),
      (this.type = 'RectAreaLight'),
      (this.width = _0x3185ed),
      (this.height = _0x24a790));
  }
  get ['power']() {
    return this.intensity * this.width * this.height * Math.PI;
  }
  set ['power'](_0x5a5c07) {
    this.intensity = _0x5a5c07 / (this.width * this.height * Math.PI);
  }
  ['copy'](_0x364c06) {
    return (super.copy(_0x364c06), (this.width = _0x364c06.width), (this.height = _0x364c06.height), this);
  }
  ['toJSON'](_0x337909) {
    const _0x36654b = super.toJSON(_0x337909);
    return ((_0x36654b.object.width = this.width), (_0x36654b.object.height = this.height), _0x36654b);
  }
}
class SphericalHarmonics3 {
  constructor() {
    ((this.isSphericalHarmonics3 = true), (this.coefficients = []));
    for (let _0x5077b5 = 0; _0x5077b5 < 9; _0x5077b5++) {
      this.coefficients.push(new Vector3());
    }
  }
  ['set'](_0x1e17be) {
    for (let _0x2bef2e = 0; _0x2bef2e < 9; _0x2bef2e++) {
      this.coefficients[_0x2bef2e].copy(_0x1e17be[_0x2bef2e]);
    }
    return this;
  }
  ['zero']() {
    for (let _0x7945ee = 0; _0x7945ee < 9; _0x7945ee++) {
      this.coefficients[_0x7945ee].set(0, 0, 0);
    }
    return this;
  }
  ['getAt'](_0x513cc0, _0x3f15ab) {
    const _0x1dd085 = _0x513cc0.x,
      _0x2299b5 = _0x513cc0.y,
      _0x547214 = _0x513cc0.z,
      _0x4bbcd1 = this.coefficients;
    return (
      _0x3f15ab.copy(_0x4bbcd1[0]).multiplyScalar(0.282095),
      _0x3f15ab.addScaledVector(_0x4bbcd1[1], 0.488603 * _0x2299b5),
      _0x3f15ab.addScaledVector(_0x4bbcd1[2], 0.488603 * _0x547214),
      _0x3f15ab.addScaledVector(_0x4bbcd1[3], 0.488603 * _0x1dd085),
      _0x3f15ab.addScaledVector(_0x4bbcd1[4], 1.092548 * (_0x1dd085 * _0x2299b5)),
      _0x3f15ab.addScaledVector(_0x4bbcd1[5], 1.092548 * (_0x2299b5 * _0x547214)),
      _0x3f15ab.addScaledVector(_0x4bbcd1[6], 0.315392 * (3 * _0x547214 * _0x547214 - 1)),
      _0x3f15ab.addScaledVector(_0x4bbcd1[7], 1.092548 * (_0x1dd085 * _0x547214)),
      _0x3f15ab.addScaledVector(_0x4bbcd1[8], 0.546274 * (_0x1dd085 * _0x1dd085 - _0x2299b5 * _0x2299b5)),
      _0x3f15ab
    );
  }
  ['getIrradianceAt'](_0x3f84a8, _0x526129) {
    const _0x5481d1 = _0x3f84a8.x,
      _0x2cd236 = _0x3f84a8.y,
      _0x2ebd47 = _0x3f84a8.z,
      _0xec40dc = this.coefficients;
    return (
      _0x526129.copy(_0xec40dc[0]).multiplyScalar(0.886227),
      _0x526129.addScaledVector(_0xec40dc[1], 2 * 0.511664 * _0x2cd236),
      _0x526129.addScaledVector(_0xec40dc[2], 2 * 0.511664 * _0x2ebd47),
      _0x526129.addScaledVector(_0xec40dc[3], 2 * 0.511664 * _0x5481d1),
      _0x526129.addScaledVector(_0xec40dc[4], 2 * 0.429043 * _0x5481d1 * _0x2cd236),
      _0x526129.addScaledVector(_0xec40dc[5], 2 * 0.429043 * _0x2cd236 * _0x2ebd47),
      _0x526129.addScaledVector(_0xec40dc[6], 0.743125 * _0x2ebd47 * _0x2ebd47 - 0.247708),
      _0x526129.addScaledVector(_0xec40dc[7], 2 * 0.429043 * _0x5481d1 * _0x2ebd47),
      _0x526129.addScaledVector(_0xec40dc[8], 0.429043 * (_0x5481d1 * _0x5481d1 - _0x2cd236 * _0x2cd236)),
      _0x526129
    );
  }
  ['add'](_0x2476f5) {
    for (let _0xc28bcf = 0; _0xc28bcf < 9; _0xc28bcf++) {
      this.coefficients[_0xc28bcf].add(_0x2476f5.coefficients[_0xc28bcf]);
    }
    return this;
  }
  ['addScaledSH'](_0x67a16f, _0x34ffb5) {
    for (let _0x532816 = 0; _0x532816 < 9; _0x532816++) {
      this.coefficients[_0x532816].addScaledVector(_0x67a16f.coefficients[_0x532816], _0x34ffb5);
    }
    return this;
  }
  ['scale'](_0x53f92e) {
    for (let _0x390460 = 0; _0x390460 < 9; _0x390460++) {
      this.coefficients[_0x390460].multiplyScalar(_0x53f92e);
    }
    return this;
  }
  ['lerp'](_0x426b0f, _0x1c0135) {
    for (let _0x338b7c = 0; _0x338b7c < 9; _0x338b7c++) {
      this.coefficients[_0x338b7c].lerp(_0x426b0f.coefficients[_0x338b7c], _0x1c0135);
    }
    return this;
  }
  ['equals'](_0x546010) {
    for (let _0x1db68e = 0; _0x1db68e < 9; _0x1db68e++) {
      if (!this.coefficients[_0x1db68e].equals(_0x546010.coefficients[_0x1db68e])) return false;
    }
    return true;
  }
  ['copy'](_0xcf5e42) {
    return this.set(_0xcf5e42.coefficients);
  }
  ['clone']() {
    return new this['constructor']().copy(this);
  }
  ['fromArray'](_0x5dad19, _0x28ee6a = 0) {
    const _0x4847a9 = this.coefficients;
    for (let _0x39e132 = 0; _0x39e132 < 9; _0x39e132++) {
      _0x4847a9[_0x39e132].fromArray(_0x5dad19, _0x28ee6a + _0x39e132 * 3);
    }
    return this;
  }
  ['toArray'](_0x13654e = [], _0xe96c48 = 0) {
    const _0x19c6cf = this.coefficients;
    for (let _0x270e23 = 0; _0x270e23 < 9; _0x270e23++) {
      _0x19c6cf[_0x270e23].toArray(_0x13654e, _0xe96c48 + _0x270e23 * 3);
    }
    return _0x13654e;
  }
  static ['getBasisAt'](_0x34c124, _0x3ff36b) {
    const _0x4ad8e8 = _0x34c124.x,
      _0x4603c9 = _0x34c124.y,
      _0x5e7785 = _0x34c124.z;
    ((_0x3ff36b[0] = 0.282095),
      (_0x3ff36b[1] = 0.488603 * _0x4603c9),
      (_0x3ff36b[2] = 0.488603 * _0x5e7785),
      (_0x3ff36b[3] = 0.488603 * _0x4ad8e8),
      (_0x3ff36b[4] = 1.092548 * _0x4ad8e8 * _0x4603c9),
      (_0x3ff36b[5] = 1.092548 * _0x4603c9 * _0x5e7785),
      (_0x3ff36b[6] = 0.315392 * (3 * _0x5e7785 * _0x5e7785 - 1)),
      (_0x3ff36b[7] = 1.092548 * _0x4ad8e8 * _0x5e7785),
      (_0x3ff36b[8] = 0.546274 * (_0x4ad8e8 * _0x4ad8e8 - _0x4603c9 * _0x4603c9)));
  }
}
class LightProbe extends Light {
  constructor(_0x147630 = new SphericalHarmonics3(), _0x30bced = 1) {
    (super(undefined, _0x30bced), (this.isLightProbe = true), (this.sh = _0x147630));
  }
  ['copy'](_0x3d69ef) {
    return (super.copy(_0x3d69ef), this.sh.copy(_0x3d69ef.sh), this);
  }
  ['fromJSON'](_0x166763) {
    return ((this.intensity = _0x166763.intensity), this.sh.fromArray(_0x166763.sh), this);
  }
  ['toJSON'](_0x1c2bfa) {
    const _0x196aac = super.toJSON(_0x1c2bfa);
    return ((_0x196aac.object.sh = this.sh.toArray()), _0x196aac);
  }
}
class MaterialLoader extends Loader {
  constructor(_0x58b59a) {
    (super(_0x58b59a), (this.textures = {}));
  }
  ['load'](_0x12098a, _0x26f0c8, _0xa35fb1, _0x5933c2) {
    const _0x10994b = this,
      _0x341806 = new FileLoader(_0x10994b.manager);
    (_0x341806.setPath(_0x10994b.path),
      _0x341806.setRequestHeader(_0x10994b.requestHeader),
      _0x341806.setWithCredentials(_0x10994b.withCredentials),
      _0x341806.load(
        _0x12098a,
        function (_0x431768) {
          try {
            _0x26f0c8(_0x10994b.parse(JSON.parse(_0x431768)));
          } catch (_0x38659d) {
            (_0x5933c2 ? _0x5933c2(_0x38659d) : console.error(_0x38659d),
              _0x10994b.manager.itemError(_0x12098a));
          }
        },
        _0xa35fb1,
        _0x5933c2,
      ));
  }
  ['parse'](_0x21f019) {
    const _0x12d2ec = this.textures;
    function _0x7b4070(_0xab0ce4) {
      return (
        _0x12d2ec[_0xab0ce4] === undefined &&
          console.warn('THREE.MaterialLoader: Undefined texture', _0xab0ce4),
        _0x12d2ec[_0xab0ce4]
      );
    }
    const _0x42d30f = this.createMaterialFromType(_0x21f019.type);
    if (_0x21f019.uuid !== undefined) _0x42d30f.uuid = _0x21f019.uuid;
    if (_0x21f019.name !== undefined) _0x42d30f.name = _0x21f019.name;
    if (_0x21f019.color !== undefined && _0x42d30f.color !== undefined)
      _0x42d30f.color.setHex(_0x21f019.color);
    if (_0x21f019.roughness !== undefined) _0x42d30f.roughness = _0x21f019.roughness;
    if (_0x21f019.metalness !== undefined) _0x42d30f.metalness = _0x21f019.metalness;
    if (_0x21f019.sheen !== undefined) _0x42d30f.sheen = _0x21f019.sheen;
    if (_0x21f019.sheenColor !== undefined) _0x42d30f.sheenColor = new Color().setHex(_0x21f019.sheenColor);
    if (_0x21f019.sheenRoughness !== undefined) _0x42d30f.sheenRoughness = _0x21f019.sheenRoughness;
    if (_0x21f019.emissive !== undefined && _0x42d30f.emissive !== undefined)
      _0x42d30f.emissive.setHex(_0x21f019.emissive);
    if (_0x21f019.specular !== undefined && _0x42d30f.specular !== undefined)
      _0x42d30f.specular.setHex(_0x21f019.specular);
    if (_0x21f019.specularIntensity !== undefined) _0x42d30f.specularIntensity = _0x21f019.specularIntensity;
    if (_0x21f019.specularColor !== undefined && _0x42d30f.specularColor !== undefined)
      _0x42d30f.specularColor.setHex(_0x21f019.specularColor);
    if (_0x21f019.shininess !== undefined) _0x42d30f.shininess = _0x21f019.shininess;
    if (_0x21f019.clearcoat !== undefined) _0x42d30f.clearcoat = _0x21f019.clearcoat;
    if (_0x21f019.clearcoatRoughness !== undefined)
      _0x42d30f.clearcoatRoughness = _0x21f019.clearcoatRoughness;
    if (_0x21f019.dispersion !== undefined) _0x42d30f.dispersion = _0x21f019.dispersion;
    if (_0x21f019.iridescence !== undefined) _0x42d30f.iridescence = _0x21f019.iridescence;
    if (_0x21f019.iridescenceIOR !== undefined) _0x42d30f.iridescenceIOR = _0x21f019.iridescenceIOR;
    if (_0x21f019.iridescenceThicknessRange !== undefined)
      _0x42d30f.iridescenceThicknessRange = _0x21f019.iridescenceThicknessRange;
    if (_0x21f019.transmission !== undefined) _0x42d30f.transmission = _0x21f019.transmission;
    if (_0x21f019.thickness !== undefined) _0x42d30f.thickness = _0x21f019.thickness;
    if (_0x21f019.attenuationDistance !== undefined)
      _0x42d30f.attenuationDistance = _0x21f019.attenuationDistance;
    if (_0x21f019.attenuationColor !== undefined && _0x42d30f.attenuationColor !== undefined)
      _0x42d30f.attenuationColor.setHex(_0x21f019.attenuationColor);
    if (_0x21f019.anisotropy !== undefined) _0x42d30f.anisotropy = _0x21f019.anisotropy;
    if (_0x21f019.anisotropyRotation !== undefined)
      _0x42d30f.anisotropyRotation = _0x21f019.anisotropyRotation;
    if (_0x21f019.fog !== undefined) _0x42d30f.fog = _0x21f019.fog;
    if (_0x21f019.flatShading !== undefined) _0x42d30f.flatShading = _0x21f019.flatShading;
    if (_0x21f019.blending !== undefined) _0x42d30f.blending = _0x21f019.blending;
    if (_0x21f019.combine !== undefined) _0x42d30f.combine = _0x21f019.combine;
    if (_0x21f019.side !== undefined) _0x42d30f.side = _0x21f019.side;
    if (_0x21f019.shadowSide !== undefined) _0x42d30f.shadowSide = _0x21f019.shadowSide;
    if (_0x21f019.opacity !== undefined) _0x42d30f.opacity = _0x21f019.opacity;
    if (_0x21f019.transparent !== undefined) _0x42d30f.transparent = _0x21f019.transparent;
    if (_0x21f019.alphaTest !== undefined) _0x42d30f.alphaTest = _0x21f019.alphaTest;
    if (_0x21f019.alphaHash !== undefined) _0x42d30f.alphaHash = _0x21f019.alphaHash;
    if (_0x21f019.depthFunc !== undefined) _0x42d30f.depthFunc = _0x21f019.depthFunc;
    if (_0x21f019.depthTest !== undefined) _0x42d30f.depthTest = _0x21f019.depthTest;
    if (_0x21f019.depthWrite !== undefined) _0x42d30f.depthWrite = _0x21f019.depthWrite;
    if (_0x21f019.colorWrite !== undefined) _0x42d30f.colorWrite = _0x21f019.colorWrite;
    if (_0x21f019.blendSrc !== undefined) _0x42d30f.blendSrc = _0x21f019.blendSrc;
    if (_0x21f019.blendDst !== undefined) _0x42d30f.blendDst = _0x21f019.blendDst;
    if (_0x21f019.blendEquation !== undefined) _0x42d30f.blendEquation = _0x21f019.blendEquation;
    if (_0x21f019.blendSrcAlpha !== undefined) _0x42d30f.blendSrcAlpha = _0x21f019.blendSrcAlpha;
    if (_0x21f019.blendDstAlpha !== undefined) _0x42d30f.blendDstAlpha = _0x21f019.blendDstAlpha;
    if (_0x21f019.blendEquationAlpha !== undefined)
      _0x42d30f.blendEquationAlpha = _0x21f019.blendEquationAlpha;
    if (_0x21f019.blendColor !== undefined && _0x42d30f.blendColor !== undefined)
      _0x42d30f.blendColor.setHex(_0x21f019.blendColor);
    if (_0x21f019.blendAlpha !== undefined) _0x42d30f.blendAlpha = _0x21f019.blendAlpha;
    if (_0x21f019.stencilWriteMask !== undefined) _0x42d30f.stencilWriteMask = _0x21f019.stencilWriteMask;
    if (_0x21f019.stencilFunc !== undefined) _0x42d30f.stencilFunc = _0x21f019.stencilFunc;
    if (_0x21f019.stencilRef !== undefined) _0x42d30f.stencilRef = _0x21f019.stencilRef;
    if (_0x21f019.stencilFuncMask !== undefined) _0x42d30f.stencilFuncMask = _0x21f019.stencilFuncMask;
    if (_0x21f019.stencilFail !== undefined) _0x42d30f.stencilFail = _0x21f019.stencilFail;
    if (_0x21f019.stencilZFail !== undefined) _0x42d30f.stencilZFail = _0x21f019.stencilZFail;
    if (_0x21f019.stencilZPass !== undefined) _0x42d30f.stencilZPass = _0x21f019.stencilZPass;
    if (_0x21f019.stencilWrite !== undefined) _0x42d30f.stencilWrite = _0x21f019.stencilWrite;
    if (_0x21f019.wireframe !== undefined) _0x42d30f.wireframe = _0x21f019.wireframe;
    if (_0x21f019.wireframeLinewidth !== undefined)
      _0x42d30f.wireframeLinewidth = _0x21f019.wireframeLinewidth;
    if (_0x21f019.wireframeLinecap !== undefined) _0x42d30f.wireframeLinecap = _0x21f019.wireframeLinecap;
    if (_0x21f019.wireframeLinejoin !== undefined) _0x42d30f.wireframeLinejoin = _0x21f019.wireframeLinejoin;
    if (_0x21f019.rotation !== undefined) _0x42d30f.rotation = _0x21f019.rotation;
    if (_0x21f019.linewidth !== undefined) _0x42d30f.linewidth = _0x21f019.linewidth;
    if (_0x21f019.dashSize !== undefined) _0x42d30f.dashSize = _0x21f019.dashSize;
    if (_0x21f019.gapSize !== undefined) _0x42d30f.gapSize = _0x21f019.gapSize;
    if (_0x21f019.scale !== undefined) _0x42d30f.scale = _0x21f019.scale;
    if (_0x21f019.polygonOffset !== undefined) _0x42d30f.polygonOffset = _0x21f019.polygonOffset;
    if (_0x21f019.polygonOffsetFactor !== undefined)
      _0x42d30f.polygonOffsetFactor = _0x21f019.polygonOffsetFactor;
    if (_0x21f019.polygonOffsetUnits !== undefined)
      _0x42d30f.polygonOffsetUnits = _0x21f019.polygonOffsetUnits;
    if (_0x21f019.dithering !== undefined) _0x42d30f.dithering = _0x21f019.dithering;
    if (_0x21f019.alphaToCoverage !== undefined) _0x42d30f.alphaToCoverage = _0x21f019.alphaToCoverage;
    if (_0x21f019.premultipliedAlpha !== undefined)
      _0x42d30f.premultipliedAlpha = _0x21f019.premultipliedAlpha;
    if (_0x21f019.forceSinglePass !== undefined) _0x42d30f.forceSinglePass = _0x21f019.forceSinglePass;
    if (_0x21f019.visible !== undefined) _0x42d30f.visible = _0x21f019.visible;
    if (_0x21f019.toneMapped !== undefined) _0x42d30f.toneMapped = _0x21f019.toneMapped;
    if (_0x21f019.userData !== undefined) _0x42d30f.userData = _0x21f019.userData;
    _0x21f019.vertexColors !== undefined &&
      (typeof _0x21f019.vertexColors === 'number'
        ? (_0x42d30f.vertexColors = _0x21f019.vertexColors > 0 ? true : false)
        : (_0x42d30f.vertexColors = _0x21f019.vertexColors));
    if (_0x21f019.uniforms !== undefined)
      for (const _0x2de295 in _0x21f019.uniforms) {
        const _0x238c04 = _0x21f019.uniforms[_0x2de295];
        _0x42d30f.uniforms[_0x2de295] = {};
        switch (_0x238c04.type) {
          case 't':
            _0x42d30f.uniforms[_0x2de295].value = _0x7b4070(_0x238c04.value);
            break;
          case 'c':
            _0x42d30f.uniforms[_0x2de295].value = new Color().setHex(_0x238c04.value);
            break;
          case 'v2':
            _0x42d30f.uniforms[_0x2de295].value = new Vector2().fromArray(_0x238c04.value);
            break;
          case 'v3':
            _0x42d30f.uniforms[_0x2de295].value = new Vector3().fromArray(_0x238c04.value);
            break;
          case 'v4':
            _0x42d30f.uniforms[_0x2de295].value = new Vector4().fromArray(_0x238c04.value);
            break;
          case 'm3':
            _0x42d30f.uniforms[_0x2de295].value = new Matrix3().fromArray(_0x238c04.value);
            break;
          case 'm4':
            _0x42d30f.uniforms[_0x2de295].value = new Matrix4().fromArray(_0x238c04.value);
            break;
          default:
            _0x42d30f.uniforms[_0x2de295].value = _0x238c04.value;
        }
      }
    if (_0x21f019.defines !== undefined) _0x42d30f.defines = _0x21f019.defines;
    if (_0x21f019.vertexShader !== undefined) _0x42d30f.vertexShader = _0x21f019.vertexShader;
    if (_0x21f019.fragmentShader !== undefined) _0x42d30f.fragmentShader = _0x21f019.fragmentShader;
    if (_0x21f019.glslVersion !== undefined) _0x42d30f.glslVersion = _0x21f019.glslVersion;
    if (_0x21f019.extensions !== undefined)
      for (const _0xf2e3fd in _0x21f019.extensions) {
        _0x42d30f.extensions[_0xf2e3fd] = _0x21f019.extensions[_0xf2e3fd];
      }
    if (_0x21f019.lights !== undefined) _0x42d30f.lights = _0x21f019.lights;
    if (_0x21f019.clipping !== undefined) _0x42d30f.clipping = _0x21f019.clipping;
    if (_0x21f019.size !== undefined) _0x42d30f.size = _0x21f019.size;
    if (_0x21f019.sizeAttenuation !== undefined) _0x42d30f.sizeAttenuation = _0x21f019.sizeAttenuation;
    if (_0x21f019.map !== undefined) _0x42d30f.map = _0x7b4070(_0x21f019.map);
    if (_0x21f019.matcap !== undefined) _0x42d30f.matcap = _0x7b4070(_0x21f019.matcap);
    if (_0x21f019.alphaMap !== undefined) _0x42d30f.alphaMap = _0x7b4070(_0x21f019.alphaMap);
    if (_0x21f019.bumpMap !== undefined) _0x42d30f.bumpMap = _0x7b4070(_0x21f019.bumpMap);
    if (_0x21f019.bumpScale !== undefined) _0x42d30f.bumpScale = _0x21f019.bumpScale;
    if (_0x21f019.normalMap !== undefined) _0x42d30f.normalMap = _0x7b4070(_0x21f019.normalMap);
    if (_0x21f019.normalMapType !== undefined) _0x42d30f.normalMapType = _0x21f019.normalMapType;
    if (_0x21f019.normalScale !== undefined) {
      let _0x2749d3 = _0x21f019.normalScale;
      (Array.isArray(_0x2749d3) === false && (_0x2749d3 = [_0x2749d3, _0x2749d3]),
        (_0x42d30f.normalScale = new Vector2().fromArray(_0x2749d3)));
    }
    if (_0x21f019.displacementMap !== undefined)
      _0x42d30f.displacementMap = _0x7b4070(_0x21f019.displacementMap);
    if (_0x21f019.displacementScale !== undefined) _0x42d30f.displacementScale = _0x21f019.displacementScale;
    if (_0x21f019.displacementBias !== undefined) _0x42d30f.displacementBias = _0x21f019.displacementBias;
    if (_0x21f019.roughnessMap !== undefined) _0x42d30f.roughnessMap = _0x7b4070(_0x21f019.roughnessMap);
    if (_0x21f019.metalnessMap !== undefined) _0x42d30f.metalnessMap = _0x7b4070(_0x21f019.metalnessMap);
    if (_0x21f019.emissiveMap !== undefined) _0x42d30f.emissiveMap = _0x7b4070(_0x21f019.emissiveMap);
    if (_0x21f019.emissiveIntensity !== undefined) _0x42d30f.emissiveIntensity = _0x21f019.emissiveIntensity;
    if (_0x21f019.specularMap !== undefined) _0x42d30f.specularMap = _0x7b4070(_0x21f019.specularMap);
    if (_0x21f019.specularIntensityMap !== undefined)
      _0x42d30f.specularIntensityMap = _0x7b4070(_0x21f019.specularIntensityMap);
    if (_0x21f019.specularColorMap !== undefined)
      _0x42d30f.specularColorMap = _0x7b4070(_0x21f019.specularColorMap);
    if (_0x21f019.envMap !== undefined) _0x42d30f.envMap = _0x7b4070(_0x21f019.envMap);
    if (_0x21f019.envMapRotation !== undefined) _0x42d30f.envMapRotation.fromArray(_0x21f019.envMapRotation);
    if (_0x21f019.envMapIntensity !== undefined) _0x42d30f.envMapIntensity = _0x21f019.envMapIntensity;
    if (_0x21f019.reflectivity !== undefined) _0x42d30f.reflectivity = _0x21f019.reflectivity;
    if (_0x21f019.refractionRatio !== undefined) _0x42d30f.refractionRatio = _0x21f019.refractionRatio;
    if (_0x21f019.lightMap !== undefined) _0x42d30f.lightMap = _0x7b4070(_0x21f019.lightMap);
    if (_0x21f019.lightMapIntensity !== undefined) _0x42d30f.lightMapIntensity = _0x21f019.lightMapIntensity;
    if (_0x21f019.aoMap !== undefined) _0x42d30f.aoMap = _0x7b4070(_0x21f019.aoMap);
    if (_0x21f019.aoMapIntensity !== undefined) _0x42d30f.aoMapIntensity = _0x21f019.aoMapIntensity;
    if (_0x21f019.gradientMap !== undefined) _0x42d30f.gradientMap = _0x7b4070(_0x21f019.gradientMap);
    if (_0x21f019.clearcoatMap !== undefined) _0x42d30f.clearcoatMap = _0x7b4070(_0x21f019.clearcoatMap);
    if (_0x21f019.clearcoatRoughnessMap !== undefined)
      _0x42d30f.clearcoatRoughnessMap = _0x7b4070(_0x21f019.clearcoatRoughnessMap);
    if (_0x21f019.clearcoatNormalMap !== undefined)
      _0x42d30f.clearcoatNormalMap = _0x7b4070(_0x21f019.clearcoatNormalMap);
    if (_0x21f019.clearcoatNormalScale !== undefined)
      _0x42d30f.clearcoatNormalScale = new Vector2().fromArray(_0x21f019.clearcoatNormalScale);
    if (_0x21f019.iridescenceMap !== undefined)
      _0x42d30f.iridescenceMap = _0x7b4070(_0x21f019.iridescenceMap);
    if (_0x21f019.iridescenceThicknessMap !== undefined)
      _0x42d30f.iridescenceThicknessMap = _0x7b4070(_0x21f019.iridescenceThicknessMap);
    if (_0x21f019.transmissionMap !== undefined)
      _0x42d30f.transmissionMap = _0x7b4070(_0x21f019.transmissionMap);
    if (_0x21f019.thicknessMap !== undefined) _0x42d30f.thicknessMap = _0x7b4070(_0x21f019.thicknessMap);
    if (_0x21f019.anisotropyMap !== undefined) _0x42d30f.anisotropyMap = _0x7b4070(_0x21f019.anisotropyMap);
    if (_0x21f019.sheenColorMap !== undefined) _0x42d30f.sheenColorMap = _0x7b4070(_0x21f019.sheenColorMap);
    if (_0x21f019.sheenRoughnessMap !== undefined)
      _0x42d30f.sheenRoughnessMap = _0x7b4070(_0x21f019.sheenRoughnessMap);
    return _0x42d30f;
  }
  ['setTextures'](_0x131a21) {
    return ((this.textures = _0x131a21), this);
  }
  ['createMaterialFromType'](_0x1edc41) {
    return MaterialLoader.createMaterialFromType(_0x1edc41);
  }
  static ['createMaterialFromType'](_0x157e2f) {
    const _0x572ddd = {
      ShadowMaterial: ShadowMaterial,
      SpriteMaterial: SpriteMaterial,
      RawShaderMaterial: RawShaderMaterial,
      ShaderMaterial: ShaderMaterial,
      PointsMaterial: PointsMaterial,
      MeshPhysicalMaterial: MeshPhysicalMaterial,
      MeshStandardMaterial: MeshStandardMaterial,
      MeshPhongMaterial: MeshPhongMaterial,
      MeshToonMaterial: MeshToonMaterial,
      MeshNormalMaterial: MeshNormalMaterial,
      MeshLambertMaterial: MeshLambertMaterial,
      MeshDepthMaterial: MeshDepthMaterial,
      MeshDistanceMaterial: MeshDistanceMaterial,
      MeshBasicMaterial: MeshBasicMaterial,
      MeshMatcapMaterial: MeshMatcapMaterial,
      LineDashedMaterial: LineDashedMaterial,
      LineBasicMaterial: LineBasicMaterial,
      Material: Material,
    };
    return new _0x572ddd[_0x157e2f]();
  }
}
class LoaderUtils {
  static ['extractUrlBase'](_0x27408b) {
    const _0x2604ba = _0x27408b.lastIndexOf('/');
    if (_0x2604ba === -1) return './';
    return _0x27408b.slice(0, _0x2604ba + 1);
  }
  static ['resolveURL'](_0x4f3990, _0x4f7098) {
    if (typeof _0x4f3990 !== 'string' || _0x4f3990 === '') return '';
    /^https?:\/\//i.test(_0x4f7098) &&
      /^\//.test(_0x4f3990) &&
      (_0x4f7098 = _0x4f7098.replace(/(^https?:\/\/[^\/]+).*/i, '$1'));
    if (/^(https?:)?\/\//i.test(_0x4f3990)) return _0x4f3990;
    if (/^data:.*,.*$/i.test(_0x4f3990)) return _0x4f3990;
    if (/^blob:.*$/i.test(_0x4f3990)) return _0x4f3990;
    return _0x4f7098 + _0x4f3990;
  }
}
class InstancedBufferGeometry extends BufferGeometry {
  constructor() {
    (super(),
      (this.isInstancedBufferGeometry = true),
      (this.type = 'InstancedBufferGeometry'),
      (this.instanceCount = Infinity));
  }
  ['copy'](_0x3f8e99) {
    return (super.copy(_0x3f8e99), (this.instanceCount = _0x3f8e99.instanceCount), this);
  }
  ['toJSON']() {
    const _0x3b3b50 = super.toJSON();
    return (
      (_0x3b3b50.instanceCount = this.instanceCount),
      (_0x3b3b50.isInstancedBufferGeometry = true),
      _0x3b3b50
    );
  }
}
class BufferGeometryLoader extends Loader {
  constructor(_0x4a3b56) {
    super(_0x4a3b56);
  }
  ['load'](_0x2f99b4, _0x44e355, _0x5926ae, _0x21ef73) {
    const _0x5d78c6 = this,
      _0x4deb36 = new FileLoader(_0x5d78c6.manager);
    (_0x4deb36.setPath(_0x5d78c6.path),
      _0x4deb36.setRequestHeader(_0x5d78c6.requestHeader),
      _0x4deb36.setWithCredentials(_0x5d78c6.withCredentials),
      _0x4deb36.load(
        _0x2f99b4,
        function (_0x278ce0) {
          try {
            _0x44e355(_0x5d78c6.parse(JSON.parse(_0x278ce0)));
          } catch (_0x5a222b) {
            (_0x21ef73 ? _0x21ef73(_0x5a222b) : console.error(_0x5a222b),
              _0x5d78c6.manager.itemError(_0x2f99b4));
          }
        },
        _0x5926ae,
        _0x21ef73,
      ));
  }
  ['parse'](_0x145e6a) {
    const _0x8a0715 = {},
      _0x3f0449 = {};
    function _0x5e1390(_0x420ac5, _0x2df564) {
      if (_0x8a0715[_0x2df564] !== undefined) return _0x8a0715[_0x2df564];
      const _0x1ba927 = _0x420ac5.interleavedBuffers,
        _0x3174b6 = _0x1ba927[_0x2df564],
        _0x491471 = _0x27af55(_0x420ac5, _0x3174b6.buffer),
        _0x34b205 = getTypedArray(_0x3174b6.type, _0x491471),
        _0x27cbe7 = new InterleavedBuffer(_0x34b205, _0x3174b6.stride);
      return ((_0x27cbe7.uuid = _0x3174b6.uuid), (_0x8a0715[_0x2df564] = _0x27cbe7), _0x27cbe7);
    }
    function _0x27af55(_0x5428f1, _0x29036f) {
      if (_0x3f0449[_0x29036f] !== undefined) return _0x3f0449[_0x29036f];
      const _0x26bfa5 = _0x5428f1.arrayBuffers,
        _0x5ddc1d = _0x26bfa5[_0x29036f],
        _0x189eee = new Uint32Array(_0x5ddc1d).buffer;
      return ((_0x3f0449[_0x29036f] = _0x189eee), _0x189eee);
    }
    const _0x37fa5c = _0x145e6a.isInstancedBufferGeometry
        ? new InstancedBufferGeometry()
        : new BufferGeometry(),
      _0x4010f3 = _0x145e6a.data.index;
    if (_0x4010f3 !== undefined) {
      const _0x543244 = getTypedArray(_0x4010f3.type, _0x4010f3.array);
      _0x37fa5c.setIndex(new BufferAttribute(_0x543244, 1));
    }
    const _0x2d0ae6 = _0x145e6a.data.attributes;
    for (const _0x549703 in _0x2d0ae6) {
      const _0x17e15c = _0x2d0ae6[_0x549703];
      let _0x5be8f7;
      if (_0x17e15c.isInterleavedBufferAttribute) {
        const _0x46874d = _0x5e1390(_0x145e6a.data, _0x17e15c.data);
        _0x5be8f7 = new InterleavedBufferAttribute(
          _0x46874d,
          _0x17e15c.itemSize,
          _0x17e15c.offset,
          _0x17e15c.normalized,
        );
      } else {
        const _0x1c66c0 = getTypedArray(_0x17e15c.type, _0x17e15c.array),
          _0x2b8c62 = _0x17e15c.isInstancedBufferAttribute ? InstancedBufferAttribute : BufferAttribute;
        _0x5be8f7 = new _0x2b8c62(_0x1c66c0, _0x17e15c.itemSize, _0x17e15c.normalized);
      }
      if (_0x17e15c.name !== undefined) _0x5be8f7.name = _0x17e15c.name;
      if (_0x17e15c.usage !== undefined) _0x5be8f7.setUsage(_0x17e15c.usage);
      _0x37fa5c.setAttribute(_0x549703, _0x5be8f7);
    }
    const _0x2fc0d9 = _0x145e6a.data.morphAttributes;
    if (_0x2fc0d9)
      for (const _0xfca075 in _0x2fc0d9) {
        const _0x39ae5a = _0x2fc0d9[_0xfca075],
          _0x946bbf = [];
        for (let _0x49e761 = 0, _0x56bdaf = _0x39ae5a.length; _0x49e761 < _0x56bdaf; _0x49e761++) {
          const _0x4937ec = _0x39ae5a[_0x49e761];
          let _0x13df17;
          if (_0x4937ec.isInterleavedBufferAttribute) {
            const _0x642b2c = _0x5e1390(_0x145e6a.data, _0x4937ec.data);
            _0x13df17 = new InterleavedBufferAttribute(
              _0x642b2c,
              _0x4937ec.itemSize,
              _0x4937ec.offset,
              _0x4937ec.normalized,
            );
          } else {
            const _0x3a59f9 = getTypedArray(_0x4937ec.type, _0x4937ec.array);
            _0x13df17 = new BufferAttribute(_0x3a59f9, _0x4937ec.itemSize, _0x4937ec.normalized);
          }
          if (_0x4937ec.name !== undefined) _0x13df17.name = _0x4937ec.name;
          _0x946bbf.push(_0x13df17);
        }
        _0x37fa5c.morphAttributes[_0xfca075] = _0x946bbf;
      }
    const _0x22f603 = _0x145e6a.data.morphTargetsRelative;
    _0x22f603 && (_0x37fa5c.morphTargetsRelative = true);
    const _0x54c143 = _0x145e6a.data.groups || _0x145e6a.data.drawcalls || _0x145e6a.data.offsets;
    if (_0x54c143 !== undefined)
      for (let _0x587f4b = 0, _0x1fa895 = _0x54c143.length; _0x587f4b !== _0x1fa895; ++_0x587f4b) {
        const _0x200d8e = _0x54c143[_0x587f4b];
        _0x37fa5c.addGroup(_0x200d8e.start, _0x200d8e.count, _0x200d8e.materialIndex);
      }
    const _0x249323 = _0x145e6a.data.boundingSphere;
    _0x249323 !== undefined && (_0x37fa5c.boundingSphere = new Sphere().fromJSON(_0x249323));
    if (_0x145e6a.name) _0x37fa5c.name = _0x145e6a.name;
    if (_0x145e6a.userData) _0x37fa5c.userData = _0x145e6a.userData;
    return _0x37fa5c;
  }
}
class ObjectLoader extends Loader {
  constructor(_0xcd29fb) {
    super(_0xcd29fb);
  }
  ['load'](_0x68a90c, _0x45f9aa, _0x153e21, _0x3db49a) {
    const _0x833da1 = this,
      _0x29117b = this.path === '' ? LoaderUtils.extractUrlBase(_0x68a90c) : this.path;
    this.resourcePath = this.resourcePath || _0x29117b;
    const _0x4bad4f = new FileLoader(this.manager);
    (_0x4bad4f.setPath(this.path),
      _0x4bad4f.setRequestHeader(this.requestHeader),
      _0x4bad4f.setWithCredentials(this.withCredentials),
      _0x4bad4f.load(
        _0x68a90c,
        function (_0x487347) {
          let _0x30b285 = null;
          try {
            _0x30b285 = JSON.parse(_0x487347);
          } catch (_0x27c420) {
            if (_0x3db49a !== undefined) _0x3db49a(_0x27c420);
            console.error("THREE:ObjectLoader: Can't parse " + _0x68a90c + '.', _0x27c420.message);
            return;
          }
          const _0x14739b = _0x30b285.metadata;
          if (
            _0x14739b === undefined ||
            _0x14739b.type === undefined ||
            _0x14739b.type.toLowerCase() === 'geometry'
          ) {
            if (_0x3db49a !== undefined) _0x3db49a(new Error("THREE.ObjectLoader: Can't load " + _0x68a90c));
            console.error("THREE.ObjectLoader: Can't load " + _0x68a90c);
            return;
          }
          _0x833da1.parse(_0x30b285, _0x45f9aa);
        },
        _0x153e21,
        _0x3db49a,
      ));
  }
  async ['loadAsync'](_0x26b910, _0x126bf9) {
    const _0x56882c = this,
      _0x20ec6c = this.path === '' ? LoaderUtils.extractUrlBase(_0x26b910) : this.path;
    this.resourcePath = this.resourcePath || _0x20ec6c;
    const _0x2529f3 = new FileLoader(this.manager);
    (_0x2529f3.setPath(this.path),
      _0x2529f3.setRequestHeader(this.requestHeader),
      _0x2529f3.setWithCredentials(this.withCredentials));
    const _0x540d28 = await _0x2529f3.loadAsync(_0x26b910, _0x126bf9),
      _0x2fb58d = JSON.parse(_0x540d28),
      _0x54f5dc = _0x2fb58d.metadata;
    if (
      _0x54f5dc === undefined ||
      _0x54f5dc.type === undefined ||
      _0x54f5dc.type.toLowerCase() === 'geometry'
    )
      throw new Error("THREE.ObjectLoader: Can't load " + _0x26b910);
    return await _0x56882c.parseAsync(_0x2fb58d);
  }
  ['parse'](_0x5ca63d, _0x255a61) {
    const _0x33b0c8 = this.parseAnimations(_0x5ca63d.animations),
      _0x4f3867 = this.parseShapes(_0x5ca63d.shapes),
      _0x110ace = this.parseGeometries(_0x5ca63d.geometries, _0x4f3867),
      _0x3999f0 = this.parseImages(_0x5ca63d.images, function () {
        if (_0x255a61 !== undefined) _0x255a61(_0x44dcf7);
      }),
      _0x3be14e = this.parseTextures(_0x5ca63d.textures, _0x3999f0),
      _0x24feb2 = this.parseMaterials(_0x5ca63d.materials, _0x3be14e),
      _0x44dcf7 = this.parseObject(_0x5ca63d.object, _0x110ace, _0x24feb2, _0x3be14e, _0x33b0c8),
      _0xc03f63 = this.parseSkeletons(_0x5ca63d.skeletons, _0x44dcf7);
    (this.bindSkeletons(_0x44dcf7, _0xc03f63), this.bindLightTargets(_0x44dcf7));
    if (_0x255a61 !== undefined) {
      let _0x527f7f = false;
      for (const _0x4209e6 in _0x3999f0) {
        if (_0x3999f0[_0x4209e6].data instanceof HTMLImageElement) {
          _0x527f7f = true;
          break;
        }
      }
      if (_0x527f7f === false) _0x255a61(_0x44dcf7);
    }
    return _0x44dcf7;
  }
  async ['parseAsync'](_0x2b50de) {
    const _0x222497 = this.parseAnimations(_0x2b50de.animations),
      _0x29fa81 = this.parseShapes(_0x2b50de.shapes),
      _0x4cb55d = this.parseGeometries(_0x2b50de.geometries, _0x29fa81),
      _0x2ac00b = await this.parseImagesAsync(_0x2b50de.images),
      _0x3fb79f = this.parseTextures(_0x2b50de.textures, _0x2ac00b),
      _0xe71423 = this.parseMaterials(_0x2b50de.materials, _0x3fb79f),
      _0x1892ca = this.parseObject(_0x2b50de.object, _0x4cb55d, _0xe71423, _0x3fb79f, _0x222497),
      _0x3b1646 = this.parseSkeletons(_0x2b50de.skeletons, _0x1892ca);
    return (this.bindSkeletons(_0x1892ca, _0x3b1646), this.bindLightTargets(_0x1892ca), _0x1892ca);
  }
  ['parseShapes'](_0x2bcd76) {
    const _0x38e702 = {};
    if (_0x2bcd76 !== undefined)
      for (let _0x399e0f = 0, _0xf5778f = _0x2bcd76.length; _0x399e0f < _0xf5778f; _0x399e0f++) {
        const _0x497b33 = new Shape().fromJSON(_0x2bcd76[_0x399e0f]);
        _0x38e702[_0x497b33.uuid] = _0x497b33;
      }
    return _0x38e702;
  }
  ['parseSkeletons'](_0xf69676, _0x16ca93) {
    const _0xa9e2a6 = {},
      _0x3d7632 = {};
    _0x16ca93.traverse(function (_0x108850) {
      if (_0x108850.isBone) _0x3d7632[_0x108850.uuid] = _0x108850;
    });
    if (_0xf69676 !== undefined)
      for (let _0x4b0d7f = 0, _0xd5a4c7 = _0xf69676.length; _0x4b0d7f < _0xd5a4c7; _0x4b0d7f++) {
        const _0x2338f2 = new Skeleton().fromJSON(_0xf69676[_0x4b0d7f], _0x3d7632);
        _0xa9e2a6[_0x2338f2.uuid] = _0x2338f2;
      }
    return _0xa9e2a6;
  }
  ['parseGeometries'](_0x4724e2, _0x458e76) {
    const _0x31964f = {};
    if (_0x4724e2 !== undefined) {
      const _0x19da11 = new BufferGeometryLoader();
      for (let _0x258797 = 0, _0x2a8601 = _0x4724e2.length; _0x258797 < _0x2a8601; _0x258797++) {
        let _0x529aac;
        const _0x59e042 = _0x4724e2[_0x258797];
        switch (_0x59e042.type) {
          case 'BufferGeometry':
          case 'InstancedBufferGeometry':
            _0x529aac = _0x19da11.parse(_0x59e042);
            break;
          default:
            _0x59e042.type in Geometries
              ? (_0x529aac = Geometries[_0x59e042.type].fromJSON(_0x59e042, _0x458e76))
              : console.warn('THREE.ObjectLoader: Unsupported geometry type "' + _0x59e042.type + '"');
        }
        _0x529aac.uuid = _0x59e042.uuid;
        if (_0x59e042.name !== undefined) _0x529aac.name = _0x59e042.name;
        if (_0x59e042.userData !== undefined) _0x529aac.userData = _0x59e042.userData;
        _0x31964f[_0x59e042.uuid] = _0x529aac;
      }
    }
    return _0x31964f;
  }
  ['parseMaterials'](_0x3756a5, _0x506d92) {
    const _0x562ff9 = {},
      _0x39bb61 = {};
    if (_0x3756a5 !== undefined) {
      const _0x1d49c3 = new MaterialLoader();
      _0x1d49c3.setTextures(_0x506d92);
      for (let _0x34a6f6 = 0, _0x55c596 = _0x3756a5.length; _0x34a6f6 < _0x55c596; _0x34a6f6++) {
        const _0x3db233 = _0x3756a5[_0x34a6f6];
        (_0x562ff9[_0x3db233.uuid] === undefined && (_0x562ff9[_0x3db233.uuid] = _0x1d49c3.parse(_0x3db233)),
          (_0x39bb61[_0x3db233.uuid] = _0x562ff9[_0x3db233.uuid]));
      }
    }
    return _0x39bb61;
  }
  ['parseAnimations'](_0x507e58) {
    const _0x4d4a73 = {};
    if (_0x507e58 !== undefined)
      for (let _0x244d58 = 0; _0x244d58 < _0x507e58.length; _0x244d58++) {
        const _0x178e47 = _0x507e58[_0x244d58],
          _0x518b1f = AnimationClip.parse(_0x178e47);
        _0x4d4a73[_0x518b1f.uuid] = _0x518b1f;
      }
    return _0x4d4a73;
  }
  ['parseImages'](_0x5ee1cb, _0x37bde6) {
    const _0x569a4f = this,
      _0x1bd9bc = {};
    let _0x2a2df2;
    function _0x37d7e0(_0x39aa22) {
      return (
        _0x569a4f.manager.itemStart(_0x39aa22),
        _0x2a2df2.load(
          _0x39aa22,
          function () {
            _0x569a4f.manager.itemEnd(_0x39aa22);
          },
          undefined,
          function () {
            (_0x569a4f.manager.itemError(_0x39aa22), _0x569a4f.manager.itemEnd(_0x39aa22));
          },
        )
      );
    }
    function _0x1d798e(_0x3457ea) {
      if (typeof _0x3457ea === 'string') {
        const _0x46a39e = _0x3457ea,
          _0x21a73b = /^(\/\/)|([a-z]+:(\/\/)?)/i.test(_0x46a39e)
            ? _0x46a39e
            : _0x569a4f.resourcePath + _0x46a39e;
        return _0x37d7e0(_0x21a73b);
      } else
        return _0x3457ea.data
          ? {
              data: getTypedArray(_0x3457ea.type, _0x3457ea.data),
              width: _0x3457ea.width,
              height: _0x3457ea.height,
            }
          : null;
    }
    if (_0x5ee1cb !== undefined && _0x5ee1cb.length > 0) {
      const _0xa8dd2d = new LoadingManager(_0x37bde6);
      ((_0x2a2df2 = new ImageLoader(_0xa8dd2d)), _0x2a2df2.setCrossOrigin(this.crossOrigin));
      for (let _0x5d68c9 = 0, _0x3a7e8b = _0x5ee1cb.length; _0x5d68c9 < _0x3a7e8b; _0x5d68c9++) {
        const _0x438a5c = _0x5ee1cb[_0x5d68c9],
          _0x33d079 = _0x438a5c.url;
        if (Array.isArray(_0x33d079)) {
          const _0x517669 = [];
          for (let _0x18c494 = 0, _0x3528c6 = _0x33d079.length; _0x18c494 < _0x3528c6; _0x18c494++) {
            const _0x1c1e30 = _0x33d079[_0x18c494],
              _0x3e08d5 = _0x1d798e(_0x1c1e30);
            _0x3e08d5 !== null &&
              (_0x3e08d5 instanceof HTMLImageElement
                ? _0x517669.push(_0x3e08d5)
                : _0x517669.push(new DataTexture(_0x3e08d5.data, _0x3e08d5.width, _0x3e08d5.height)));
          }
          _0x1bd9bc[_0x438a5c.uuid] = new Source(_0x517669);
        } else {
          const _0x3ef1fa = _0x1d798e(_0x438a5c.url);
          _0x1bd9bc[_0x438a5c.uuid] = new Source(_0x3ef1fa);
        }
      }
    }
    return _0x1bd9bc;
  }
  async ['parseImagesAsync'](_0x20f936) {
    const _0x5652b2 = this,
      _0x38a0f7 = {};
    let _0x12a9bb;
    async function _0x446100(_0x353bca) {
      if (typeof _0x353bca === 'string') {
        const _0x35b81b = _0x353bca,
          _0x43a0c6 = /^(\/\/)|([a-z]+:(\/\/)?)/i.test(_0x35b81b)
            ? _0x35b81b
            : _0x5652b2.resourcePath + _0x35b81b;
        return await _0x12a9bb.loadAsync(_0x43a0c6);
      } else
        return _0x353bca.data
          ? {
              data: getTypedArray(_0x353bca.type, _0x353bca.data),
              width: _0x353bca.width,
              height: _0x353bca.height,
            }
          : null;
    }
    if (_0x20f936 !== undefined && _0x20f936.length > 0) {
      ((_0x12a9bb = new ImageLoader(this.manager)), _0x12a9bb.setCrossOrigin(this.crossOrigin));
      for (let _0x18db24 = 0, _0x41e282 = _0x20f936.length; _0x18db24 < _0x41e282; _0x18db24++) {
        const _0x349dee = _0x20f936[_0x18db24],
          _0x40c580 = _0x349dee.url;
        if (Array.isArray(_0x40c580)) {
          const _0x2f5ad1 = [];
          for (let _0x2c81f6 = 0, _0x4dad8d = _0x40c580.length; _0x2c81f6 < _0x4dad8d; _0x2c81f6++) {
            const _0x1fd92e = _0x40c580[_0x2c81f6],
              _0x36a40c = await _0x446100(_0x1fd92e);
            _0x36a40c !== null &&
              (_0x36a40c instanceof HTMLImageElement
                ? _0x2f5ad1.push(_0x36a40c)
                : _0x2f5ad1.push(new DataTexture(_0x36a40c.data, _0x36a40c.width, _0x36a40c.height)));
          }
          _0x38a0f7[_0x349dee.uuid] = new Source(_0x2f5ad1);
        } else {
          const _0x43468c = await _0x446100(_0x349dee.url);
          _0x38a0f7[_0x349dee.uuid] = new Source(_0x43468c);
        }
      }
    }
    return _0x38a0f7;
  }
  ['parseTextures'](_0xc58a32, _0x303ae7) {
    function _0x5b0978(_0x11e8ab, _0x1fd355) {
      if (typeof _0x11e8ab === 'number') return _0x11e8ab;
      return (
        console.warn('THREE.ObjectLoader.parseTexture: Constant should be in numeric form.', _0x11e8ab),
        _0x1fd355[_0x11e8ab]
      );
    }
    const _0x8d9ccb = {};
    if (_0xc58a32 !== undefined)
      for (let _0x2a616b = 0, _0x514afe = _0xc58a32.length; _0x2a616b < _0x514afe; _0x2a616b++) {
        const _0x1b8a10 = _0xc58a32[_0x2a616b];
        _0x1b8a10.image === undefined &&
          console.warn('THREE.ObjectLoader: No "image" specified for', _0x1b8a10.uuid);
        _0x303ae7[_0x1b8a10.image] === undefined &&
          console.warn('THREE.ObjectLoader: Undefined image', _0x1b8a10.image);
        const _0x3b4291 = _0x303ae7[_0x1b8a10.image],
          _0x367e88 = _0x3b4291.data;
        let _0x362597;
        if (Array.isArray(_0x367e88)) {
          _0x362597 = new CubeTexture();
          if (_0x367e88.length === 6) _0x362597.needsUpdate = true;
        } else {
          _0x367e88 && _0x367e88.data ? (_0x362597 = new DataTexture()) : (_0x362597 = new Texture());
          if (_0x367e88) _0x362597.needsUpdate = true;
        }
        ((_0x362597.source = _0x3b4291), (_0x362597.uuid = _0x1b8a10.uuid));
        if (_0x1b8a10.name !== undefined) _0x362597.name = _0x1b8a10.name;
        if (_0x1b8a10.mapping !== undefined)
          _0x362597.mapping = _0x5b0978(_0x1b8a10.mapping, TEXTURE_MAPPING);
        if (_0x1b8a10.channel !== undefined) _0x362597.channel = _0x1b8a10.channel;
        if (_0x1b8a10.offset !== undefined) _0x362597.offset.fromArray(_0x1b8a10.offset);
        if (_0x1b8a10.repeat !== undefined) _0x362597.repeat.fromArray(_0x1b8a10.repeat);
        if (_0x1b8a10.center !== undefined) _0x362597.center.fromArray(_0x1b8a10.center);
        if (_0x1b8a10.rotation !== undefined) _0x362597.rotation = _0x1b8a10.rotation;
        _0x1b8a10.wrap !== undefined &&
          ((_0x362597.wrapS = _0x5b0978(_0x1b8a10.wrap[0], TEXTURE_WRAPPING)),
          (_0x362597.wrapT = _0x5b0978(_0x1b8a10.wrap[1], TEXTURE_WRAPPING)));
        if (_0x1b8a10.format !== undefined) _0x362597.format = _0x1b8a10.format;
        if (_0x1b8a10.internalFormat !== undefined) _0x362597.internalFormat = _0x1b8a10.internalFormat;
        if (_0x1b8a10.type !== undefined) _0x362597.type = _0x1b8a10.type;
        if (_0x1b8a10.colorSpace !== undefined) _0x362597.colorSpace = _0x1b8a10.colorSpace;
        if (_0x1b8a10.minFilter !== undefined)
          _0x362597.minFilter = _0x5b0978(_0x1b8a10.minFilter, TEXTURE_FILTER);
        if (_0x1b8a10.magFilter !== undefined)
          _0x362597.magFilter = _0x5b0978(_0x1b8a10.magFilter, TEXTURE_FILTER);
        if (_0x1b8a10.anisotropy !== undefined) _0x362597.anisotropy = _0x1b8a10.anisotropy;
        if (_0x1b8a10.flipY !== undefined) _0x362597.flipY = _0x1b8a10.flipY;
        if (_0x1b8a10.generateMipmaps !== undefined) _0x362597.generateMipmaps = _0x1b8a10.generateMipmaps;
        if (_0x1b8a10.premultiplyAlpha !== undefined) _0x362597.premultiplyAlpha = _0x1b8a10.premultiplyAlpha;
        if (_0x1b8a10.unpackAlignment !== undefined) _0x362597.unpackAlignment = _0x1b8a10.unpackAlignment;
        if (_0x1b8a10.compareFunction !== undefined) _0x362597.compareFunction = _0x1b8a10.compareFunction;
        if (_0x1b8a10.userData !== undefined) _0x362597.userData = _0x1b8a10.userData;
        _0x8d9ccb[_0x1b8a10.uuid] = _0x362597;
      }
    return _0x8d9ccb;
  }
  ['parseObject'](_0xa37eca, _0x1ded3f, _0x509422, _0x26cb12, _0x58136f) {
    let _0x1c1ef4;
    function _0x3b187c(_0x3e9f6f) {
      return (
        _0x1ded3f[_0x3e9f6f] === undefined &&
          console.warn('THREE.ObjectLoader: Undefined geometry', _0x3e9f6f),
        _0x1ded3f[_0x3e9f6f]
      );
    }
    function _0x161e9e(_0x43f534) {
      if (_0x43f534 === undefined) return undefined;
      if (Array.isArray(_0x43f534)) {
        const _0x59c32b = [];
        for (let _0x1798ce = 0, _0x5c3ddb = _0x43f534.length; _0x1798ce < _0x5c3ddb; _0x1798ce++) {
          const _0x2c69fb = _0x43f534[_0x1798ce];
          (_0x509422[_0x2c69fb] === undefined &&
            console.warn('THREE.ObjectLoader: Undefined material', _0x2c69fb),
            _0x59c32b.push(_0x509422[_0x2c69fb]));
        }
        return _0x59c32b;
      }
      return (
        _0x509422[_0x43f534] === undefined &&
          console.warn('THREE.ObjectLoader: Undefined material', _0x43f534),
        _0x509422[_0x43f534]
      );
    }
    function _0x1a3687(_0x484e13) {
      return (
        _0x26cb12[_0x484e13] === undefined &&
          console.warn('THREE.ObjectLoader: Undefined texture', _0x484e13),
        _0x26cb12[_0x484e13]
      );
    }
    let _0x3fe8e5, _0x5765df;
    switch (_0xa37eca.type) {
      case 'Scene':
        _0x1c1ef4 = new Scene();
        _0xa37eca.background !== undefined &&
          (Number.isInteger(_0xa37eca.background)
            ? (_0x1c1ef4.background = new Color(_0xa37eca.background))
            : (_0x1c1ef4.background = _0x1a3687(_0xa37eca.background)));
        _0xa37eca.environment !== undefined && (_0x1c1ef4.environment = _0x1a3687(_0xa37eca.environment));
        if (_0xa37eca.fog !== undefined) {
          if (_0xa37eca.fog.type === 'Fog')
            _0x1c1ef4.fog = new Fog(_0xa37eca.fog.color, _0xa37eca.fog.near, _0xa37eca.fog.far);
          else
            _0xa37eca.fog.type === 'FogExp2' &&
              (_0x1c1ef4.fog = new FogExp2(_0xa37eca.fog.color, _0xa37eca.fog.density));
          _0xa37eca.fog.name !== '' && (_0x1c1ef4.fog.name = _0xa37eca.fog.name);
        }
        if (_0xa37eca.backgroundBlurriness !== undefined)
          _0x1c1ef4.backgroundBlurriness = _0xa37eca.backgroundBlurriness;
        if (_0xa37eca.backgroundIntensity !== undefined)
          _0x1c1ef4.backgroundIntensity = _0xa37eca.backgroundIntensity;
        if (_0xa37eca.backgroundRotation !== undefined)
          _0x1c1ef4.backgroundRotation.fromArray(_0xa37eca.backgroundRotation);
        if (_0xa37eca.environmentIntensity !== undefined)
          _0x1c1ef4.environmentIntensity = _0xa37eca.environmentIntensity;
        if (_0xa37eca.environmentRotation !== undefined)
          _0x1c1ef4.environmentRotation.fromArray(_0xa37eca.environmentRotation);
        break;
      case 'PerspectiveCamera':
        _0x1c1ef4 = new PerspectiveCamera(_0xa37eca.fov, _0xa37eca.aspect, _0xa37eca.near, _0xa37eca.far);
        if (_0xa37eca.focus !== undefined) _0x1c1ef4.focus = _0xa37eca.focus;
        if (_0xa37eca.zoom !== undefined) _0x1c1ef4.zoom = _0xa37eca.zoom;
        if (_0xa37eca.filmGauge !== undefined) _0x1c1ef4.filmGauge = _0xa37eca.filmGauge;
        if (_0xa37eca.filmOffset !== undefined) _0x1c1ef4.filmOffset = _0xa37eca.filmOffset;
        if (_0xa37eca.view !== undefined) _0x1c1ef4.view = Object.assign({}, _0xa37eca.view);
        break;
      case 'OrthographicCamera':
        _0x1c1ef4 = new OrthographicCamera(
          _0xa37eca.left,
          _0xa37eca.right,
          _0xa37eca.top,
          _0xa37eca.bottom,
          _0xa37eca.near,
          _0xa37eca.far,
        );
        if (_0xa37eca.zoom !== undefined) _0x1c1ef4.zoom = _0xa37eca.zoom;
        if (_0xa37eca.view !== undefined) _0x1c1ef4.view = Object.assign({}, _0xa37eca.view);
        break;
      case 'AmbientLight':
        _0x1c1ef4 = new AmbientLight(_0xa37eca.color, _0xa37eca.intensity);
        break;
      case 'DirectionalLight':
        ((_0x1c1ef4 = new DirectionalLight(_0xa37eca.color, _0xa37eca.intensity)),
          (_0x1c1ef4.target = _0xa37eca.target || ''));
        break;
      case 'PointLight':
        _0x1c1ef4 = new PointLight(_0xa37eca.color, _0xa37eca.intensity, _0xa37eca.distance, _0xa37eca.decay);
        break;
      case 'RectAreaLight':
        _0x1c1ef4 = new RectAreaLight(
          _0xa37eca.color,
          _0xa37eca.intensity,
          _0xa37eca.width,
          _0xa37eca.height,
        );
        break;
      case 'SpotLight':
        ((_0x1c1ef4 = new SpotLight(
          _0xa37eca.color,
          _0xa37eca.intensity,
          _0xa37eca.distance,
          _0xa37eca.angle,
          _0xa37eca.penumbra,
          _0xa37eca.decay,
        )),
          (_0x1c1ef4.target = _0xa37eca.target || ''));
        break;
      case 'HemisphereLight':
        _0x1c1ef4 = new HemisphereLight(_0xa37eca.color, _0xa37eca.groundColor, _0xa37eca.intensity);
        break;
      case 'LightProbe':
        _0x1c1ef4 = new LightProbe().fromJSON(_0xa37eca);
        break;
      case 'SkinnedMesh':
        ((_0x3fe8e5 = _0x3b187c(_0xa37eca.geometry)),
          (_0x5765df = _0x161e9e(_0xa37eca.material)),
          (_0x1c1ef4 = new SkinnedMesh(_0x3fe8e5, _0x5765df)));
        if (_0xa37eca.bindMode !== undefined) _0x1c1ef4.bindMode = _0xa37eca.bindMode;
        if (_0xa37eca.bindMatrix !== undefined) _0x1c1ef4.bindMatrix.fromArray(_0xa37eca.bindMatrix);
        if (_0xa37eca.skeleton !== undefined) _0x1c1ef4.skeleton = _0xa37eca.skeleton;
        break;
      case 'Mesh':
        ((_0x3fe8e5 = _0x3b187c(_0xa37eca.geometry)),
          (_0x5765df = _0x161e9e(_0xa37eca.material)),
          (_0x1c1ef4 = new Mesh(_0x3fe8e5, _0x5765df)));
        break;
      case 'InstancedMesh':
        ((_0x3fe8e5 = _0x3b187c(_0xa37eca.geometry)), (_0x5765df = _0x161e9e(_0xa37eca.material)));
        const _0x599add = _0xa37eca.count,
          _0x50684d = _0xa37eca.instanceMatrix,
          _0x3d2918 = _0xa37eca.instanceColor;
        ((_0x1c1ef4 = new InstancedMesh(_0x3fe8e5, _0x5765df, _0x599add)),
          (_0x1c1ef4.instanceMatrix = new InstancedBufferAttribute(new Float32Array(_0x50684d.array), 16)));
        if (_0x3d2918 !== undefined)
          _0x1c1ef4.instanceColor = new InstancedBufferAttribute(
            new Float32Array(_0x3d2918.array),
            _0x3d2918.itemSize,
          );
        break;
      case 'BatchedMesh':
        ((_0x3fe8e5 = _0x3b187c(_0xa37eca.geometry)),
          (_0x5765df = _0x161e9e(_0xa37eca.material)),
          (_0x1c1ef4 = new BatchedMesh(
            _0xa37eca.maxInstanceCount,
            _0xa37eca.maxVertexCount,
            _0xa37eca.maxIndexCount,
            _0x5765df,
          )),
          (_0x1c1ef4.geometry = _0x3fe8e5),
          (_0x1c1ef4.perObjectFrustumCulled = _0xa37eca.perObjectFrustumCulled),
          (_0x1c1ef4.sortObjects = _0xa37eca.sortObjects),
          (_0x1c1ef4._drawRanges = _0xa37eca.drawRanges),
          (_0x1c1ef4._reservedRanges = _0xa37eca.reservedRanges),
          (_0x1c1ef4._geometryInfo = _0xa37eca.geometryInfo.map((_0x3a23ce) => {
            let _0x5962a5 = null,
              _0x4a306b = null;
            return (
              _0x3a23ce.boundingBox !== undefined && (_0x5962a5 = new Box3().fromJSON(_0x3a23ce.boundingBox)),
              _0x3a23ce.boundingSphere !== undefined &&
                (_0x4a306b = new Sphere().fromJSON(_0x3a23ce.boundingSphere)),
              { ..._0x3a23ce, boundingBox: _0x5962a5, boundingSphere: _0x4a306b }
            );
          })),
          (_0x1c1ef4._instanceInfo = _0xa37eca.instanceInfo),
          (_0x1c1ef4._availableInstanceIds = _0xa37eca._availableInstanceIds),
          (_0x1c1ef4._availableGeometryIds = _0xa37eca._availableGeometryIds),
          (_0x1c1ef4._nextIndexStart = _0xa37eca.nextIndexStart),
          (_0x1c1ef4._nextVertexStart = _0xa37eca.nextVertexStart),
          (_0x1c1ef4._geometryCount = _0xa37eca.geometryCount),
          (_0x1c1ef4._maxInstanceCount = _0xa37eca.maxInstanceCount),
          (_0x1c1ef4._maxVertexCount = _0xa37eca.maxVertexCount),
          (_0x1c1ef4._maxIndexCount = _0xa37eca.maxIndexCount),
          (_0x1c1ef4._geometryInitialized = _0xa37eca.geometryInitialized),
          (_0x1c1ef4._matricesTexture = _0x1a3687(_0xa37eca.matricesTexture.uuid)),
          (_0x1c1ef4._indirectTexture = _0x1a3687(_0xa37eca.indirectTexture.uuid)));
        _0xa37eca.colorsTexture !== undefined &&
          (_0x1c1ef4._colorsTexture = _0x1a3687(_0xa37eca.colorsTexture.uuid));
        _0xa37eca.boundingSphere !== undefined &&
          (_0x1c1ef4.boundingSphere = new Sphere().fromJSON(_0xa37eca.boundingSphere));
        _0xa37eca.boundingBox !== undefined &&
          (_0x1c1ef4.boundingBox = new Box3().fromJSON(_0xa37eca.boundingBox));
        break;
      case 'LOD':
        _0x1c1ef4 = new LOD();
        break;
      case 'Line':
        _0x1c1ef4 = new Line(_0x3b187c(_0xa37eca.geometry), _0x161e9e(_0xa37eca.material));
        break;
      case 'LineLoop':
        _0x1c1ef4 = new LineLoop(_0x3b187c(_0xa37eca.geometry), _0x161e9e(_0xa37eca.material));
        break;
      case 'LineSegments':
        _0x1c1ef4 = new LineSegments(_0x3b187c(_0xa37eca.geometry), _0x161e9e(_0xa37eca.material));
        break;
      case 'PointCloud':
      case 'Points':
        _0x1c1ef4 = new Points(_0x3b187c(_0xa37eca.geometry), _0x161e9e(_0xa37eca.material));
        break;
      case 'Sprite':
        _0x1c1ef4 = new Sprite(_0x161e9e(_0xa37eca.material));
        break;
      case 'Group':
        _0x1c1ef4 = new Group();
        break;
      case 'Bone':
        _0x1c1ef4 = new Bone();
        break;
      default:
        _0x1c1ef4 = new Object3D();
    }
    _0x1c1ef4.uuid = _0xa37eca.uuid;
    if (_0xa37eca.name !== undefined) _0x1c1ef4.name = _0xa37eca.name;
    if (_0xa37eca.matrix !== undefined) {
      _0x1c1ef4.matrix.fromArray(_0xa37eca.matrix);
      if (_0xa37eca.matrixAutoUpdate !== undefined) _0x1c1ef4.matrixAutoUpdate = _0xa37eca.matrixAutoUpdate;
      if (_0x1c1ef4.matrixAutoUpdate)
        _0x1c1ef4.matrix.decompose(_0x1c1ef4.position, _0x1c1ef4.quaternion, _0x1c1ef4.scale);
    } else {
      if (_0xa37eca.position !== undefined) _0x1c1ef4.position.fromArray(_0xa37eca.position);
      if (_0xa37eca.rotation !== undefined) _0x1c1ef4.rotation.fromArray(_0xa37eca.rotation);
      if (_0xa37eca.quaternion !== undefined) _0x1c1ef4.quaternion.fromArray(_0xa37eca.quaternion);
      if (_0xa37eca.scale !== undefined) _0x1c1ef4.scale.fromArray(_0xa37eca.scale);
    }
    if (_0xa37eca.up !== undefined) _0x1c1ef4.up.fromArray(_0xa37eca.up);
    if (_0xa37eca.castShadow !== undefined) _0x1c1ef4.castShadow = _0xa37eca.castShadow;
    if (_0xa37eca.receiveShadow !== undefined) _0x1c1ef4.receiveShadow = _0xa37eca.receiveShadow;
    if (_0xa37eca.shadow) {
      if (_0xa37eca.shadow.intensity !== undefined) _0x1c1ef4.shadow.intensity = _0xa37eca.shadow.intensity;
      if (_0xa37eca.shadow.bias !== undefined) _0x1c1ef4.shadow.bias = _0xa37eca.shadow.bias;
      if (_0xa37eca.shadow.normalBias !== undefined)
        _0x1c1ef4.shadow.normalBias = _0xa37eca.shadow.normalBias;
      if (_0xa37eca.shadow.radius !== undefined) _0x1c1ef4.shadow.radius = _0xa37eca.shadow.radius;
      if (_0xa37eca.shadow.mapSize !== undefined)
        _0x1c1ef4.shadow.mapSize.fromArray(_0xa37eca.shadow.mapSize);
      if (_0xa37eca.shadow.camera !== undefined)
        _0x1c1ef4.shadow.camera = this.parseObject(_0xa37eca.shadow.camera);
    }
    if (_0xa37eca.visible !== undefined) _0x1c1ef4.visible = _0xa37eca.visible;
    if (_0xa37eca.frustumCulled !== undefined) _0x1c1ef4.frustumCulled = _0xa37eca.frustumCulled;
    if (_0xa37eca.renderOrder !== undefined) _0x1c1ef4.renderOrder = _0xa37eca.renderOrder;
    if (_0xa37eca.userData !== undefined) _0x1c1ef4.userData = _0xa37eca.userData;
    if (_0xa37eca.layers !== undefined) _0x1c1ef4.layers.mask = _0xa37eca.layers;
    if (_0xa37eca.children !== undefined) {
      const _0x25fe39 = _0xa37eca.children;
      for (let _0x122aa6 = 0; _0x122aa6 < _0x25fe39.length; _0x122aa6++) {
        _0x1c1ef4.add(this.parseObject(_0x25fe39[_0x122aa6], _0x1ded3f, _0x509422, _0x26cb12, _0x58136f));
      }
    }
    if (_0xa37eca.animations !== undefined) {
      const _0x401cc2 = _0xa37eca.animations;
      for (let _0x3b847f = 0; _0x3b847f < _0x401cc2.length; _0x3b847f++) {
        const _0x5935f9 = _0x401cc2[_0x3b847f];
        _0x1c1ef4.animations.push(_0x58136f[_0x5935f9]);
      }
    }
    if (_0xa37eca.type === 'LOD') {
      if (_0xa37eca.autoUpdate !== undefined) _0x1c1ef4.autoUpdate = _0xa37eca.autoUpdate;
      const _0x21ac27 = _0xa37eca.levels;
      for (let _0x5dbf28 = 0; _0x5dbf28 < _0x21ac27.length; _0x5dbf28++) {
        const _0x4b26da = _0x21ac27[_0x5dbf28],
          _0x66a7db = _0x1c1ef4.getObjectByProperty('uuid', _0x4b26da.object);
        _0x66a7db !== undefined && _0x1c1ef4.addLevel(_0x66a7db, _0x4b26da.distance, _0x4b26da.hysteresis);
      }
    }
    return _0x1c1ef4;
  }
  ['bindSkeletons'](_0xdf7fda, _0x4d8696) {
    if (Object.keys(_0x4d8696).length === 0) return;
    _0xdf7fda.traverse(function (_0x4d35de) {
      if (_0x4d35de.isSkinnedMesh === true && _0x4d35de.skeleton !== undefined) {
        const _0xdc21cd = _0x4d8696[_0x4d35de.skeleton];
        _0xdc21cd === undefined
          ? console.warn('THREE.ObjectLoader: No skeleton found with UUID:', _0x4d35de.skeleton)
          : _0x4d35de.bind(_0xdc21cd, _0x4d35de.bindMatrix);
      }
    });
  }
  ['bindLightTargets'](_0x2428ea) {
    _0x2428ea.traverse(function (_0x11de61) {
      if (_0x11de61.isDirectionalLight || _0x11de61.isSpotLight) {
        const _0x23410f = _0x11de61.target,
          _0x127801 = _0x2428ea.getObjectByProperty('uuid', _0x23410f);
        _0x127801 !== undefined ? (_0x11de61.target = _0x127801) : (_0x11de61.target = new Object3D());
      }
    });
  }
}
const TEXTURE_MAPPING = {
    UVMapping: UVMapping,
    CubeReflectionMapping: CubeReflectionMapping,
    CubeRefractionMapping: CubeRefractionMapping,
    EquirectangularReflectionMapping: EquirectangularReflectionMapping,
    EquirectangularRefractionMapping: EquirectangularRefractionMapping,
    CubeUVReflectionMapping: CubeUVReflectionMapping,
  },
  TEXTURE_WRAPPING = {
    RepeatWrapping: RepeatWrapping,
    ClampToEdgeWrapping: ClampToEdgeWrapping,
    MirroredRepeatWrapping: MirroredRepeatWrapping,
  },
  TEXTURE_FILTER = {
    NearestFilter: NearestFilter,
    NearestMipmapNearestFilter: NearestMipmapNearestFilter,
    NearestMipmapLinearFilter: NearestMipmapLinearFilter,
    LinearFilter: LinearFilter,
    LinearMipmapNearestFilter: LinearMipmapNearestFilter,
    LinearMipmapLinearFilter: LinearMipmapLinearFilter,
  },
  _errorMap = new WeakMap();
class ImageBitmapLoader extends Loader {
  constructor(_0x3c529e) {
    (super(_0x3c529e),
      (this.isImageBitmapLoader = true),
      typeof createImageBitmap === 'undefined' &&
        console.warn('THREE.ImageBitmapLoader: createImageBitmap() not supported.'),
      typeof fetch === 'undefined' && console.warn('THREE.ImageBitmapLoader: fetch() not supported.'),
      (this.options = { premultiplyAlpha: 'none' }),
      (this._abortController = new AbortController()));
  }
  ['setOptions'](_0xaafd01) {
    return ((this.options = _0xaafd01), this);
  }
  ['load'](_0x433fd4, _0x48d75c, _0x1e77f8, _0x24b23f) {
    if (_0x433fd4 === undefined) _0x433fd4 = '';
    if (this.path !== undefined) _0x433fd4 = this.path + _0x433fd4;
    _0x433fd4 = this.manager.resolveURL(_0x433fd4);
    const _0x13d2f8 = this,
      _0x4105b9 = Cache.get('image-bitmap:' + _0x433fd4);
    if (_0x4105b9 !== undefined) {
      _0x13d2f8.manager.itemStart(_0x433fd4);
      if (_0x4105b9.then) {
        _0x4105b9.then((_0x7296be) => {
          if (_errorMap.has(_0x4105b9) === true) {
            if (_0x24b23f) _0x24b23f(_errorMap.get(_0x4105b9));
            (_0x13d2f8.manager.itemError(_0x433fd4), _0x13d2f8.manager.itemEnd(_0x433fd4));
          } else {
            if (_0x48d75c) _0x48d75c(_0x7296be);
            return (_0x13d2f8.manager.itemEnd(_0x433fd4), _0x7296be);
          }
        });
        return;
      }
      return (
        setTimeout(function () {
          if (_0x48d75c) _0x48d75c(_0x4105b9);
          _0x13d2f8.manager.itemEnd(_0x433fd4);
        }, 0),
        _0x4105b9
      );
    }
    const _0x527ba3 = {};
    ((_0x527ba3.credentials = this.crossOrigin === 'anonymous' ? 'same-origin' : 'include'),
      (_0x527ba3.headers = this.requestHeader),
      (_0x527ba3.signal =
        typeof AbortSignal.any === 'function'
          ? AbortSignal.any([this._abortController.signal, this.manager.abortController.signal])
          : this._abortController.signal));
    const _0x2303ca = fetch(_0x433fd4, _0x527ba3)
      .then(function (_0x168aac) {
        return _0x168aac.blob();
      })
      .then(function (_0x4e38bd) {
        return createImageBitmap(
          _0x4e38bd,
          Object.assign(_0x13d2f8.options, { colorSpaceConversion: 'none' }),
        );
      })
      .then(function (_0x1f35f7) {
        Cache.add('image-bitmap:' + _0x433fd4, _0x1f35f7);
        if (_0x48d75c) _0x48d75c(_0x1f35f7);
        return (_0x13d2f8.manager.itemEnd(_0x433fd4), _0x1f35f7);
      })
      .catch(function (_0x57070b) {
        if (_0x24b23f) _0x24b23f(_0x57070b);
        (_errorMap.set(_0x2303ca, _0x57070b),
          Cache.remove('image-bitmap:' + _0x433fd4),
          _0x13d2f8.manager.itemError(_0x433fd4),
          _0x13d2f8.manager.itemEnd(_0x433fd4));
      });
    (Cache.add('image-bitmap:' + _0x433fd4, _0x2303ca), _0x13d2f8.manager.itemStart(_0x433fd4));
  }
  ['abort']() {
    return (this._abortController.abort(), (this._abortController = new AbortController()), this);
  }
}
let _context;
class AudioContext {
  static ['getContext']() {
    return (
      _context === undefined && (_context = new (window['AudioContext'] || window['webkitAudioContext'])()),
      _context
    );
  }
  static ['setContext'](_0x2abaaf) {
    _context = _0x2abaaf;
  }
}
class AudioLoader extends Loader {
  constructor(_0x306a39) {
    super(_0x306a39);
  }
  ['load'](_0x816a87, _0x57e050, _0x53d1a5, _0x181403) {
    const _0x4aa53d = this,
      _0x530676 = new FileLoader(this.manager);
    (_0x530676.setResponseType('arraybuffer'),
      _0x530676.setPath(this.path),
      _0x530676.setRequestHeader(this.requestHeader),
      _0x530676.setWithCredentials(this.withCredentials),
      _0x530676.load(
        _0x816a87,
        function (_0x4606a4) {
          try {
            const _0x4b85a3 = _0x4606a4.slice(0),
              _0x50eabb = AudioContext.getContext();
            _0x50eabb
              .decodeAudioData(_0x4b85a3, function (_0x49b05c) {
                _0x57e050(_0x49b05c);
              })
              .catch(_0x348195);
          } catch (_0xbb20dc) {
            _0x348195(_0xbb20dc);
          }
        },
        _0x53d1a5,
        _0x181403,
      ));
    function _0x348195(_0x146cc1) {
      (_0x181403 ? _0x181403(_0x146cc1) : console.error(_0x146cc1), _0x4aa53d.manager.itemError(_0x816a87));
    }
  }
}
const _eyeRight = new Matrix4(),
  _eyeLeft = new Matrix4(),
  _projectionMatrix = new Matrix4();
class StereoCamera {
  constructor() {
    ((this.type = 'StereoCamera'),
      (this.aspect = 1),
      (this.eyeSep = 0.064),
      (this.cameraL = new PerspectiveCamera()),
      this.cameraL.layers.enable(1),
      (this.cameraL.matrixAutoUpdate = false),
      (this.cameraR = new PerspectiveCamera()),
      this.cameraR.layers.enable(2),
      (this.cameraR.matrixAutoUpdate = false),
      (this._cache = {
        focus: null,
        fov: null,
        aspect: null,
        near: null,
        far: null,
        zoom: null,
        eyeSep: null,
      }));
  }
  ['update'](_0x574ffe) {
    const _0x2b9ed = this._cache,
      _0x3c875b =
        _0x2b9ed.focus !== _0x574ffe.focus ||
        _0x2b9ed.fov !== _0x574ffe.fov ||
        _0x2b9ed.aspect !== _0x574ffe.aspect * this.aspect ||
        _0x2b9ed.near !== _0x574ffe.near ||
        _0x2b9ed.far !== _0x574ffe.far ||
        _0x2b9ed.zoom !== _0x574ffe.zoom ||
        _0x2b9ed.eyeSep !== this.eyeSep;
    if (_0x3c875b) {
      ((_0x2b9ed.focus = _0x574ffe.focus),
        (_0x2b9ed.fov = _0x574ffe.fov),
        (_0x2b9ed.aspect = _0x574ffe.aspect * this.aspect),
        (_0x2b9ed.near = _0x574ffe.near),
        (_0x2b9ed.far = _0x574ffe.far),
        (_0x2b9ed.zoom = _0x574ffe.zoom),
        (_0x2b9ed.eyeSep = this.eyeSep),
        _projectionMatrix.copy(_0x574ffe.projectionMatrix));
      const _0x255f69 = _0x2b9ed.eyeSep / 2,
        _0x33fa67 = (_0x255f69 * _0x2b9ed.near) / _0x2b9ed.focus,
        _0x2f66a0 = (_0x2b9ed.near * Math.tan(DEG2RAD * _0x2b9ed.fov * 0.5)) / _0x2b9ed.zoom;
      let _0x230356, _0x32fb60;
      ((_eyeLeft.elements[12] = -_0x255f69),
        (_eyeRight.elements[12] = _0x255f69),
        (_0x230356 = -_0x2f66a0 * _0x2b9ed.aspect + _0x33fa67),
        (_0x32fb60 = _0x2f66a0 * _0x2b9ed.aspect + _0x33fa67),
        (_projectionMatrix.elements[0] = (2 * _0x2b9ed.near) / (_0x32fb60 - _0x230356)),
        (_projectionMatrix.elements[8] = (_0x32fb60 + _0x230356) / (_0x32fb60 - _0x230356)),
        this.cameraL.projectionMatrix.copy(_projectionMatrix),
        (_0x230356 = -_0x2f66a0 * _0x2b9ed.aspect - _0x33fa67),
        (_0x32fb60 = _0x2f66a0 * _0x2b9ed.aspect - _0x33fa67),
        (_projectionMatrix.elements[0] = (2 * _0x2b9ed.near) / (_0x32fb60 - _0x230356)),
        (_projectionMatrix.elements[8] = (_0x32fb60 + _0x230356) / (_0x32fb60 - _0x230356)),
        this.cameraR.projectionMatrix.copy(_projectionMatrix));
    }
    (this.cameraL.matrixWorld.copy(_0x574ffe.matrixWorld).multiply(_eyeLeft),
      this.cameraR.matrixWorld.copy(_0x574ffe.matrixWorld).multiply(_eyeRight));
  }
}
class ArrayCamera extends PerspectiveCamera {
  constructor(_0x46722f = []) {
    (super(), (this.isArrayCamera = true), (this.isMultiViewCamera = false), (this.cameras = _0x46722f));
  }
}
class Clock {
  constructor(_0x1fbc28 = true) {
    ((this.autoStart = _0x1fbc28),
      (this.startTime = 0),
      (this.oldTime = 0),
      (this.elapsedTime = 0),
      (this.running = false));
  }
  ['start']() {
    ((this.startTime = performance.now()),
      (this.oldTime = this.startTime),
      (this.elapsedTime = 0),
      (this.running = true));
  }
  ['stop']() {
    (this.getElapsedTime(), (this.running = false), (this.autoStart = false));
  }
  ['getElapsedTime']() {
    return (this.getDelta(), this.elapsedTime);
  }
  ['getDelta']() {
    let _0x3276e8 = 0;
    if (this.autoStart && !this.running) return (this.start(), 0);
    if (this.running) {
      const _0x42e009 = performance.now();
      ((_0x3276e8 = (_0x42e009 - this.oldTime) / 0x3e8),
        (this.oldTime = _0x42e009),
        (this.elapsedTime += _0x3276e8));
    }
    return _0x3276e8;
  }
}
const _position$1 = new Vector3(),
  _quaternion$1 = new Quaternion(),
  _scale$1 = new Vector3(),
  _forward = new Vector3(),
  _up = new Vector3();
class AudioListener extends Object3D {
  constructor() {
    (super(),
      (this.type = 'AudioListener'),
      (this.context = AudioContext.getContext()),
      (this.gain = this.context.createGain()),
      this.gain.connect(this.context.destination),
      (this.filter = null),
      (this.timeDelta = 0),
      (this._clock = new Clock()));
  }
  ['getInput']() {
    return this.gain;
  }
  ['removeFilter']() {
    return (
      this.filter !== null &&
        (this.gain.disconnect(this.filter),
        this.filter.disconnect(this.context.destination),
        this.gain.connect(this.context.destination),
        (this.filter = null)),
      this
    );
  }
  ['getFilter']() {
    return this.filter;
  }
  ['setFilter'](_0x241f41) {
    return (
      this.filter !== null
        ? (this.gain.disconnect(this.filter), this.filter.disconnect(this.context.destination))
        : this.gain.disconnect(this.context.destination),
      (this.filter = _0x241f41),
      this.gain.connect(this.filter),
      this.filter.connect(this.context.destination),
      this
    );
  }
  ['getMasterVolume']() {
    return this.gain.gain.value;
  }
  ['setMasterVolume'](_0x1ca9f6) {
    return (this.gain.gain.setTargetAtTime(_0x1ca9f6, this.context.currentTime, 0.01), this);
  }
  ['updateMatrixWorld'](_0x88780d) {
    super.updateMatrixWorld(_0x88780d);
    const _0x58bb70 = this.context.listener;
    ((this.timeDelta = this._clock.getDelta()),
      this.matrixWorld.decompose(_position$1, _quaternion$1, _scale$1),
      _forward.set(0, 0, -1).applyQuaternion(_quaternion$1),
      _up.set(0, 1, 0).applyQuaternion(_quaternion$1));
    if (_0x58bb70.positionX) {
      const _0x62e5e4 = this.context.currentTime + this.timeDelta;
      (_0x58bb70.positionX.linearRampToValueAtTime(_position$1.x, _0x62e5e4),
        _0x58bb70.positionY.linearRampToValueAtTime(_position$1.y, _0x62e5e4),
        _0x58bb70.positionZ.linearRampToValueAtTime(_position$1.z, _0x62e5e4),
        _0x58bb70.forwardX.linearRampToValueAtTime(_forward.x, _0x62e5e4),
        _0x58bb70.forwardY.linearRampToValueAtTime(_forward.y, _0x62e5e4),
        _0x58bb70.forwardZ.linearRampToValueAtTime(_forward.z, _0x62e5e4),
        _0x58bb70.upX.linearRampToValueAtTime(_up.x, _0x62e5e4),
        _0x58bb70.upY.linearRampToValueAtTime(_up.y, _0x62e5e4),
        _0x58bb70.upZ.linearRampToValueAtTime(_up.z, _0x62e5e4));
    } else
      (_0x58bb70.setPosition(_position$1.x, _position$1.y, _position$1.z),
        _0x58bb70.setOrientation(_forward.x, _forward.y, _forward.z, _up.x, _up.y, _up.z));
  }
}
class Audio extends Object3D {
  constructor(_0x6caa9a) {
    (super(),
      (this.type = 'Audio'),
      (this.listener = _0x6caa9a),
      (this.context = _0x6caa9a.context),
      (this.gain = this.context.createGain()),
      this.gain.connect(_0x6caa9a.getInput()),
      (this.autoplay = false),
      (this.buffer = null),
      (this.detune = 0),
      (this.loop = false),
      (this.loopStart = 0),
      (this.loopEnd = 0),
      (this.offset = 0),
      (this.duration = undefined),
      (this.playbackRate = 1),
      (this.isPlaying = false),
      (this.hasPlaybackControl = true),
      (this.source = null),
      (this.sourceType = 'empty'),
      (this._startedAt = 0),
      (this._progress = 0),
      (this._connected = false),
      (this.filters = []));
  }
  ['getOutput']() {
    return this.gain;
  }
  ['setNodeSource'](_0x574774) {
    return (
      (this.hasPlaybackControl = false),
      (this.sourceType = 'audioNode'),
      (this.source = _0x574774),
      this.connect(),
      this
    );
  }
  ['setMediaElementSource'](_0x3e6c88) {
    return (
      (this.hasPlaybackControl = false),
      (this.sourceType = 'mediaNode'),
      (this.source = this.context.createMediaElementSource(_0x3e6c88)),
      this.connect(),
      this
    );
  }
  ['setMediaStreamSource'](_0x859e42) {
    return (
      (this.hasPlaybackControl = false),
      (this.sourceType = 'mediaStreamNode'),
      (this.source = this.context.createMediaStreamSource(_0x859e42)),
      this.connect(),
      this
    );
  }
  ['setBuffer'](_0x29e4c6) {
    ((this.buffer = _0x29e4c6), (this.sourceType = 'buffer'));
    if (this.autoplay) this.play();
    return this;
  }
  ['play'](_0x4fedfe = 0) {
    if (this.isPlaying === true) {
      console.warn('THREE.Audio: Audio is already playing.');
      return;
    }
    if (this.hasPlaybackControl === false) {
      console.warn('THREE.Audio: this Audio has no playback control.');
      return;
    }
    this._startedAt = this.context.currentTime + _0x4fedfe;
    const _0x151b86 = this.context.createBufferSource();
    return (
      (_0x151b86.buffer = this.buffer),
      (_0x151b86.loop = this.loop),
      (_0x151b86.loopStart = this.loopStart),
      (_0x151b86.loopEnd = this.loopEnd),
      (_0x151b86.onended = this.onEnded.bind(this)),
      _0x151b86.start(this._startedAt, this._progress + this.offset, this.duration),
      (this.isPlaying = true),
      (this.source = _0x151b86),
      this.setDetune(this.detune),
      this.setPlaybackRate(this.playbackRate),
      this.connect()
    );
  }
  ['pause']() {
    if (this.hasPlaybackControl === false) {
      console.warn('THREE.Audio: this Audio has no playback control.');
      return;
    }
    return (
      this.isPlaying === true &&
        ((this._progress += Math.max(this.context.currentTime - this._startedAt, 0) * this.playbackRate),
        this.loop === true && (this._progress = this._progress % (this.duration || this.buffer.duration)),
        this.source.stop(),
        (this.source.onended = null),
        (this.isPlaying = false)),
      this
    );
  }
  ['stop'](_0x326037 = 0) {
    if (this.hasPlaybackControl === false) {
      console.warn('THREE.Audio: this Audio has no playback control.');
      return;
    }
    return (
      (this._progress = 0),
      this.source !== null &&
        (this.source.stop(this.context.currentTime + _0x326037), (this.source.onended = null)),
      (this.isPlaying = false),
      this
    );
  }
  ['connect']() {
    if (this.filters.length > 0) {
      this.source.connect(this.filters[0]);
      for (let _0x2bf5ff = 1, _0x307256 = this.filters.length; _0x2bf5ff < _0x307256; _0x2bf5ff++) {
        this.filters[_0x2bf5ff - 1].connect(this.filters[_0x2bf5ff]);
      }
      this.filters[this.filters.length - 1].connect(this.getOutput());
    } else this.source.connect(this.getOutput());
    return ((this._connected = true), this);
  }
  ['disconnect']() {
    if (this._connected === false) return;
    if (this.filters.length > 0) {
      this.source.disconnect(this.filters[0]);
      for (let _0x17d358 = 1, _0x333833 = this.filters.length; _0x17d358 < _0x333833; _0x17d358++) {
        this.filters[_0x17d358 - 1].disconnect(this.filters[_0x17d358]);
      }
      this.filters[this.filters.length - 1].disconnect(this.getOutput());
    } else this.source.disconnect(this.getOutput());
    return ((this._connected = false), this);
  }
  ['getFilters']() {
    return this.filters;
  }
  ['setFilters'](_0x3f5b51) {
    if (!_0x3f5b51) _0x3f5b51 = [];
    return (
      this._connected === true
        ? (this.disconnect(), (this.filters = _0x3f5b51.slice()), this.connect())
        : (this.filters = _0x3f5b51.slice()),
      this
    );
  }
  ['setDetune'](_0x34eed9) {
    return (
      (this.detune = _0x34eed9),
      this.isPlaying === true &&
        this.source.detune !== undefined &&
        this.source.detune.setTargetAtTime(this.detune, this.context.currentTime, 0.01),
      this
    );
  }
  ['getDetune']() {
    return this.detune;
  }
  ['getFilter']() {
    return this.getFilters()[0];
  }
  ['setFilter'](_0x5ae517) {
    return this.setFilters(_0x5ae517 ? [_0x5ae517] : []);
  }
  ['setPlaybackRate'](_0x2e6278) {
    if (this.hasPlaybackControl === false) {
      console.warn('THREE.Audio: this Audio has no playback control.');
      return;
    }
    return (
      (this.playbackRate = _0x2e6278),
      this.isPlaying === true &&
        this.source.playbackRate.setTargetAtTime(this.playbackRate, this.context.currentTime, 0.01),
      this
    );
  }
  ['getPlaybackRate']() {
    return this.playbackRate;
  }
  ['onEnded']() {
    ((this.isPlaying = false), (this._progress = 0));
  }
  ['getLoop']() {
    if (this.hasPlaybackControl === false)
      return (console.warn('THREE.Audio: this Audio has no playback control.'), false);
    return this.loop;
  }
  ['setLoop'](_0x1fd188) {
    if (this.hasPlaybackControl === false) {
      console.warn('THREE.Audio: this Audio has no playback control.');
      return;
    }
    return ((this.loop = _0x1fd188), this.isPlaying === true && (this.source.loop = this.loop), this);
  }
  ['setLoopStart'](_0x512b18) {
    return ((this.loopStart = _0x512b18), this);
  }
  ['setLoopEnd'](_0xa97920) {
    return ((this.loopEnd = _0xa97920), this);
  }
  ['getVolume']() {
    return this.gain.gain.value;
  }
  ['setVolume'](_0x56b172) {
    return (this.gain.gain.setTargetAtTime(_0x56b172, this.context.currentTime, 0.01), this);
  }
  ['copy'](_0x2cda2d, _0xed7d93) {
    super.copy(_0x2cda2d, _0xed7d93);
    if (_0x2cda2d.sourceType !== 'buffer')
      return (console.warn('THREE.Audio: Audio source type cannot be copied.'), this);
    return (
      (this.autoplay = _0x2cda2d.autoplay),
      (this.buffer = _0x2cda2d.buffer),
      (this.detune = _0x2cda2d.detune),
      (this.loop = _0x2cda2d.loop),
      (this.loopStart = _0x2cda2d.loopStart),
      (this.loopEnd = _0x2cda2d.loopEnd),
      (this.offset = _0x2cda2d.offset),
      (this.duration = _0x2cda2d.duration),
      (this.playbackRate = _0x2cda2d.playbackRate),
      (this.hasPlaybackControl = _0x2cda2d.hasPlaybackControl),
      (this.sourceType = _0x2cda2d.sourceType),
      (this.filters = _0x2cda2d.filters.slice()),
      this
    );
  }
  ['clone'](_0x5835ed) {
    return new this['constructor'](this.listener).copy(this, _0x5835ed);
  }
}
const _position = new Vector3(),
  _quaternion = new Quaternion(),
  _scale = new Vector3(),
  _orientation = new Vector3();
class PositionalAudio extends Audio {
  constructor(_0x3c5e0c) {
    (super(_0x3c5e0c),
      (this.panner = this.context.createPanner()),
      (this.panner.panningModel = 'HRTF'),
      this.panner.connect(this.gain));
  }
  ['connect']() {
    return (super.connect(), this.panner.connect(this.gain), this);
  }
  ['disconnect']() {
    return (super.disconnect(), this.panner.disconnect(this.gain), this);
  }
  ['getOutput']() {
    return this.panner;
  }
  ['getRefDistance']() {
    return this.panner.refDistance;
  }
  ['setRefDistance'](_0x264ae8) {
    return ((this.panner.refDistance = _0x264ae8), this);
  }
  ['getRolloffFactor']() {
    return this.panner.rolloffFactor;
  }
  ['setRolloffFactor'](_0x10b094) {
    return ((this.panner.rolloffFactor = _0x10b094), this);
  }
  ['getDistanceModel']() {
    return this.panner.distanceModel;
  }
  ['setDistanceModel'](_0x3fb46b) {
    return ((this.panner.distanceModel = _0x3fb46b), this);
  }
  ['getMaxDistance']() {
    return this.panner.maxDistance;
  }
  ['setMaxDistance'](_0x2919b7) {
    return ((this.panner.maxDistance = _0x2919b7), this);
  }
  ['setDirectionalCone'](_0xb7778f, _0x2cd604, _0x3af5dd) {
    return (
      (this.panner.coneInnerAngle = _0xb7778f),
      (this.panner.coneOuterAngle = _0x2cd604),
      (this.panner.coneOuterGain = _0x3af5dd),
      this
    );
  }
  ['updateMatrixWorld'](_0x371975) {
    super.updateMatrixWorld(_0x371975);
    if (this.hasPlaybackControl === true && this.isPlaying === false) return;
    (this.matrixWorld.decompose(_position, _quaternion, _scale),
      _orientation.set(0, 0, 1).applyQuaternion(_quaternion));
    const _0x29cbc7 = this.panner;
    if (_0x29cbc7.positionX) {
      const _0x50ceae = this.context.currentTime + this.listener.timeDelta;
      (_0x29cbc7.positionX.linearRampToValueAtTime(_position.x, _0x50ceae),
        _0x29cbc7.positionY.linearRampToValueAtTime(_position.y, _0x50ceae),
        _0x29cbc7.positionZ.linearRampToValueAtTime(_position.z, _0x50ceae),
        _0x29cbc7.orientationX.linearRampToValueAtTime(_orientation.x, _0x50ceae),
        _0x29cbc7.orientationY.linearRampToValueAtTime(_orientation.y, _0x50ceae),
        _0x29cbc7.orientationZ.linearRampToValueAtTime(_orientation.z, _0x50ceae));
    } else
      (_0x29cbc7.setPosition(_position.x, _position.y, _position.z),
        _0x29cbc7.setOrientation(_orientation.x, _orientation.y, _orientation.z));
  }
}
class AudioAnalyser {
  constructor(_0x2912f6, _0x523b16 = 0x800) {
    ((this.analyser = _0x2912f6.context.createAnalyser()),
      (this.analyser.fftSize = _0x523b16),
      (this.data = new Uint8Array(this.analyser.frequencyBinCount)),
      _0x2912f6.getOutput().connect(this.analyser));
  }
  ['getFrequencyData']() {
    return (this.analyser.getByteFrequencyData(this.data), this.data);
  }
  ['getAverageFrequency']() {
    let _0x4cbc48 = 0;
    const _0x270a8a = this.getFrequencyData();
    for (let _0xac572b = 0; _0xac572b < _0x270a8a.length; _0xac572b++) {
      _0x4cbc48 += _0x270a8a[_0xac572b];
    }
    return _0x4cbc48 / _0x270a8a.length;
  }
}
class PropertyMixer {
  constructor(_0x43806f, _0x1f3a03, _0x422837) {
    ((this.binding = _0x43806f), (this.valueSize = _0x422837));
    let _0x39cba8, _0x473426, _0x1378c9;
    switch (_0x1f3a03) {
      case 'quaternion':
        ((_0x39cba8 = this._slerp),
          (_0x473426 = this._slerpAdditive),
          (_0x1378c9 = this._setAdditiveIdentityQuaternion),
          (this.buffer = new Float64Array(_0x422837 * 6)),
          (this._workIndex = 5));
        break;
      case 'string':
      case 'bool':
        ((_0x39cba8 = this._select),
          (_0x473426 = this._select),
          (_0x1378c9 = this._setAdditiveIdentityOther),
          (this.buffer = new Array(_0x422837 * 5)));
        break;
      default:
        ((_0x39cba8 = this._lerp),
          (_0x473426 = this._lerpAdditive),
          (_0x1378c9 = this._setAdditiveIdentityNumeric),
          (this.buffer = new Float64Array(_0x422837 * 5)));
    }
    ((this._mixBufferRegion = _0x39cba8),
      (this._mixBufferRegionAdditive = _0x473426),
      (this._setIdentity = _0x1378c9),
      (this._origIndex = 3),
      (this._addIndex = 4),
      (this.cumulativeWeight = 0),
      (this.cumulativeWeightAdditive = 0),
      (this.useCount = 0),
      (this.referenceCount = 0));
  }
  ['accumulate'](_0x57040a, _0x471f57) {
    const _0x2db05e = this.buffer,
      _0x52e528 = this.valueSize,
      _0x4a50d1 = _0x57040a * _0x52e528 + _0x52e528;
    let _0x449696 = this.cumulativeWeight;
    if (_0x449696 === 0) {
      for (let _0x1befa8 = 0; _0x1befa8 !== _0x52e528; ++_0x1befa8) {
        _0x2db05e[_0x4a50d1 + _0x1befa8] = _0x2db05e[_0x1befa8];
      }
      _0x449696 = _0x471f57;
    } else {
      _0x449696 += _0x471f57;
      const _0x343e19 = _0x471f57 / _0x449696;
      this._mixBufferRegion(_0x2db05e, _0x4a50d1, 0, _0x343e19, _0x52e528);
    }
    this.cumulativeWeight = _0x449696;
  }
  ['accumulateAdditive'](_0x471aef) {
    const _0x41307e = this.buffer,
      _0x1bec37 = this.valueSize,
      _0x5a791d = _0x1bec37 * this._addIndex;
    (this.cumulativeWeightAdditive === 0 && this._setIdentity(),
      this._mixBufferRegionAdditive(_0x41307e, _0x5a791d, 0, _0x471aef, _0x1bec37),
      (this.cumulativeWeightAdditive += _0x471aef));
  }
  ['apply'](_0x24c148) {
    const _0x261450 = this.valueSize,
      _0x39cb9f = this.buffer,
      _0x59a712 = _0x24c148 * _0x261450 + _0x261450,
      _0x26791f = this.cumulativeWeight,
      _0x3297c5 = this.cumulativeWeightAdditive,
      _0x4befb5 = this.binding;
    ((this.cumulativeWeight = 0), (this.cumulativeWeightAdditive = 0));
    if (_0x26791f < 1) {
      const _0x32497f = _0x261450 * this._origIndex;
      this._mixBufferRegion(_0x39cb9f, _0x59a712, _0x32497f, 1 - _0x26791f, _0x261450);
    }
    _0x3297c5 > 0 &&
      this._mixBufferRegionAdditive(_0x39cb9f, _0x59a712, this._addIndex * _0x261450, 1, _0x261450);
    for (let _0x3aa631 = _0x261450, _0x15fa27 = _0x261450 + _0x261450; _0x3aa631 !== _0x15fa27; ++_0x3aa631) {
      if (_0x39cb9f[_0x3aa631] !== _0x39cb9f[_0x3aa631 + _0x261450]) {
        _0x4befb5.setValue(_0x39cb9f, _0x59a712);
        break;
      }
    }
  }
  ['saveOriginalState']() {
    const _0x34f1c7 = this.binding,
      _0x38e9b7 = this.buffer,
      _0x4606ae = this.valueSize,
      _0x94446e = _0x4606ae * this._origIndex;
    _0x34f1c7.getValue(_0x38e9b7, _0x94446e);
    for (let _0x19933f = _0x4606ae, _0x312548 = _0x94446e; _0x19933f !== _0x312548; ++_0x19933f) {
      _0x38e9b7[_0x19933f] = _0x38e9b7[_0x94446e + (_0x19933f % _0x4606ae)];
    }
    (this._setIdentity(), (this.cumulativeWeight = 0), (this.cumulativeWeightAdditive = 0));
  }
  ['restoreOriginalState']() {
    const _0x5c465 = this.valueSize * 3;
    this.binding.setValue(this.buffer, _0x5c465);
  }
  ['_setAdditiveIdentityNumeric']() {
    const _0x26265b = this._addIndex * this.valueSize,
      _0x414349 = _0x26265b + this.valueSize;
    for (let _0x2d5c2e = _0x26265b; _0x2d5c2e < _0x414349; _0x2d5c2e++) {
      this.buffer[_0x2d5c2e] = 0;
    }
  }
  ['_setAdditiveIdentityQuaternion']() {
    (this._setAdditiveIdentityNumeric(), (this.buffer[this._addIndex * this.valueSize + 3] = 1));
  }
  ['_setAdditiveIdentityOther']() {
    const _0x508c1a = this._origIndex * this.valueSize,
      _0x1ca465 = this._addIndex * this.valueSize;
    for (let _0x28585f = 0; _0x28585f < this.valueSize; _0x28585f++) {
      this.buffer[_0x1ca465 + _0x28585f] = this.buffer[_0x508c1a + _0x28585f];
    }
  }
  ['_select'](_0x352e0e, _0x1edf57, _0x48a351, _0x5b31e0, _0x1e658b) {
    if (_0x5b31e0 >= 0.5)
      for (let _0x44d97c = 0; _0x44d97c !== _0x1e658b; ++_0x44d97c) {
        _0x352e0e[_0x1edf57 + _0x44d97c] = _0x352e0e[_0x48a351 + _0x44d97c];
      }
  }
  ['_slerp'](_0x3d836f, _0x5e0fe4, _0x397ed0, _0x42d9d7) {
    Quaternion.slerpFlat(_0x3d836f, _0x5e0fe4, _0x3d836f, _0x5e0fe4, _0x3d836f, _0x397ed0, _0x42d9d7);
  }
  ['_slerpAdditive'](_0x8aa038, _0x247fa6, _0x53a710, _0x400066, _0x1312e7) {
    const _0x1eceb2 = this._workIndex * _0x1312e7;
    (Quaternion.multiplyQuaternionsFlat(_0x8aa038, _0x1eceb2, _0x8aa038, _0x247fa6, _0x8aa038, _0x53a710),
      Quaternion.slerpFlat(_0x8aa038, _0x247fa6, _0x8aa038, _0x247fa6, _0x8aa038, _0x1eceb2, _0x400066));
  }
  ['_lerp'](_0x33006d, _0x3458a9, _0x3c6a35, _0x226e20, _0x269594) {
    const _0x4b0169 = 1 - _0x226e20;
    for (let _0x185524 = 0; _0x185524 !== _0x269594; ++_0x185524) {
      const _0x5e4d31 = _0x3458a9 + _0x185524;
      _0x33006d[_0x5e4d31] = _0x33006d[_0x5e4d31] * _0x4b0169 + _0x33006d[_0x3c6a35 + _0x185524] * _0x226e20;
    }
  }
  ['_lerpAdditive'](_0x8a6b8a, _0x40553b, _0x435915, _0x17c3f1, _0x3767ab) {
    for (let _0x46e41d = 0; _0x46e41d !== _0x3767ab; ++_0x46e41d) {
      const _0x2c874a = _0x40553b + _0x46e41d;
      _0x8a6b8a[_0x2c874a] = _0x8a6b8a[_0x2c874a] + _0x8a6b8a[_0x435915 + _0x46e41d] * _0x17c3f1;
    }
  }
}
const _RESERVED_CHARS_RE = '\\[\\]\\.:\\/',
  _reservedRe = new RegExp('[' + _RESERVED_CHARS_RE + ']', 'g'),
  _wordChar = '[^' + _RESERVED_CHARS_RE + ']',
  _wordCharOrDot = '[^' + _RESERVED_CHARS_RE.replace('\\.', '') + ']',
  _directoryRe = /((?:WC+[\/:])*)/.source.replace('WC', _wordChar),
  _nodeRe = /(WCOD+)?/.source.replace('WCOD', _wordCharOrDot),
  _objectRe = /(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace('WC', _wordChar),
  _propertyRe = /\.(WC+)(?:\[(.+)\])?/.source.replace('WC', _wordChar),
  _trackRe = new RegExp('' + '^' + _directoryRe + _nodeRe + _objectRe + _propertyRe + '$'),
  _supportedObjectNames = ['material', 'materials', 'bones', 'map'];
class Composite {
  constructor(_0x5e372a, _0xcfce25, _0x51de83) {
    const _0x2b0f88 = _0x51de83 || PropertyBinding.parseTrackName(_0xcfce25);
    ((this._targetGroup = _0x5e372a), (this._bindings = _0x5e372a.subscribe_(_0xcfce25, _0x2b0f88)));
  }
  ['getValue'](_0x462765, _0x44fba7) {
    this.bind();
    const _0x1b926f = this._targetGroup.nCachedObjects_,
      _0x29cf6f = this._bindings[_0x1b926f];
    if (_0x29cf6f !== undefined) _0x29cf6f.getValue(_0x462765, _0x44fba7);
  }
  ['setValue'](_0x22d94a, _0x512286) {
    const _0x33f7bd = this._bindings;
    for (
      let _0x11a73a = this._targetGroup.nCachedObjects_, _0x1339a2 = _0x33f7bd.length;
      _0x11a73a !== _0x1339a2;
      ++_0x11a73a
    ) {
      _0x33f7bd[_0x11a73a].setValue(_0x22d94a, _0x512286);
    }
  }
  ['bind']() {
    const _0x3536f5 = this._bindings;
    for (
      let _0x5b483d = this._targetGroup.nCachedObjects_, _0xf7c47f = _0x3536f5.length;
      _0x5b483d !== _0xf7c47f;
      ++_0x5b483d
    ) {
      _0x3536f5[_0x5b483d].bind();
    }
  }
  ['unbind']() {
    const _0x49ea4f = this._bindings;
    for (
      let _0x96447a = this._targetGroup.nCachedObjects_, _0x4d9472 = _0x49ea4f.length;
      _0x96447a !== _0x4d9472;
      ++_0x96447a
    ) {
      _0x49ea4f[_0x96447a].unbind();
    }
  }
}
class PropertyBinding {
  constructor(_0x230965, _0x9eb12b, _0x4c3529) {
    ((this.path = _0x9eb12b),
      (this.parsedPath = _0x4c3529 || PropertyBinding.parseTrackName(_0x9eb12b)),
      (this.node = PropertyBinding.findNode(_0x230965, this.parsedPath.nodeName)),
      (this.rootNode = _0x230965),
      (this.getValue = this._getValue_unbound),
      (this.setValue = this._setValue_unbound));
  }
  static ['create'](_0x1d3588, _0x25c231, _0x4a7df2) {
    return !(_0x1d3588 && _0x1d3588.isAnimationObjectGroup)
      ? new PropertyBinding(_0x1d3588, _0x25c231, _0x4a7df2)
      : new PropertyBinding.Composite(_0x1d3588, _0x25c231, _0x4a7df2);
  }
  static ['sanitizeNodeName'](_0x524c99) {
    return _0x524c99.replace(/\s/g, '_').replace(_reservedRe, '');
  }
  static ['parseTrackName'](_0x278c74) {
    const _0x4d126b = _trackRe.exec(_0x278c74);
    if (_0x4d126b === null) throw new Error('PropertyBinding: Cannot parse trackName: ' + _0x278c74);
    const _0x300c3a = {
        nodeName: _0x4d126b[2],
        objectName: _0x4d126b[3],
        objectIndex: _0x4d126b[4],
        propertyName: _0x4d126b[5],
        propertyIndex: _0x4d126b[6],
      },
      _0x52f03f = _0x300c3a.nodeName && _0x300c3a.nodeName.lastIndexOf('.');
    if (_0x52f03f !== undefined && _0x52f03f !== -1) {
      const _0x2c8d15 = _0x300c3a.nodeName.substring(_0x52f03f + 1);
      _supportedObjectNames.indexOf(_0x2c8d15) !== -1 &&
        ((_0x300c3a.nodeName = _0x300c3a.nodeName.substring(0, _0x52f03f)),
        (_0x300c3a.objectName = _0x2c8d15));
    }
    if (_0x300c3a.propertyName === null || _0x300c3a.propertyName.length === 0)
      throw new Error('PropertyBinding: can not parse propertyName from trackName: ' + _0x278c74);
    return _0x300c3a;
  }
  static ['findNode'](_0xfd5b7, _0x1a087b) {
    if (
      _0x1a087b === undefined ||
      _0x1a087b === '' ||
      _0x1a087b === '.' ||
      _0x1a087b === -1 ||
      _0x1a087b === _0xfd5b7.name ||
      _0x1a087b === _0xfd5b7.uuid
    )
      return _0xfd5b7;
    if (_0xfd5b7.skeleton) {
      const _0x2e2557 = _0xfd5b7.skeleton.getBoneByName(_0x1a087b);
      if (_0x2e2557 !== undefined) return _0x2e2557;
    }
    if (_0xfd5b7.children) {
      const _0x9d6a29 = function (_0x47c8af) {
          for (let _0x50f64a = 0; _0x50f64a < _0x47c8af.length; _0x50f64a++) {
            const _0x2f8f43 = _0x47c8af[_0x50f64a];
            if (_0x2f8f43.name === _0x1a087b || _0x2f8f43.uuid === _0x1a087b) return _0x2f8f43;
            const _0x364fa7 = _0x9d6a29(_0x2f8f43.children);
            if (_0x364fa7) return _0x364fa7;
          }
          return null;
        },
        _0x3b6c02 = _0x9d6a29(_0xfd5b7.children);
      if (_0x3b6c02) return _0x3b6c02;
    }
    return null;
  }
  ['_getValue_unavailable']() {}
  ['_setValue_unavailable']() {}
  ['_getValue_direct'](_0x415e54, _0x5cff44) {
    _0x415e54[_0x5cff44] = this.targetObject[this.propertyName];
  }
  ['_getValue_array'](_0x19be98, _0x582af0) {
    const _0x5c3f9c = this.resolvedProperty;
    for (let _0x81741d = 0, _0x541b9e = _0x5c3f9c.length; _0x81741d !== _0x541b9e; ++_0x81741d) {
      _0x19be98[_0x582af0++] = _0x5c3f9c[_0x81741d];
    }
  }
  ['_getValue_arrayElement'](_0x4d6e0b, _0x43e12b) {
    _0x4d6e0b[_0x43e12b] = this.resolvedProperty[this.propertyIndex];
  }
  ['_getValue_toArray'](_0x177c02, _0x208a69) {
    this.resolvedProperty.toArray(_0x177c02, _0x208a69);
  }
  ['_setValue_direct'](_0x343ad2, _0x43a9f0) {
    this.targetObject[this.propertyName] = _0x343ad2[_0x43a9f0];
  }
  ['_setValue_direct_setNeedsUpdate'](_0x3f2435, _0x3f84de) {
    ((this.targetObject[this.propertyName] = _0x3f2435[_0x3f84de]), (this.targetObject.needsUpdate = true));
  }
  ['_setValue_direct_setMatrixWorldNeedsUpdate'](_0x958c4d, _0x12c6b4) {
    ((this.targetObject[this.propertyName] = _0x958c4d[_0x12c6b4]),
      (this.targetObject.matrixWorldNeedsUpdate = true));
  }
  ['_setValue_array'](_0xc3412b, _0x5b05c8) {
    const _0x5021d8 = this.resolvedProperty;
    for (let _0xc37ab1 = 0, _0x59547f = _0x5021d8.length; _0xc37ab1 !== _0x59547f; ++_0xc37ab1) {
      _0x5021d8[_0xc37ab1] = _0xc3412b[_0x5b05c8++];
    }
  }
  ['_setValue_array_setNeedsUpdate'](_0x3bbf9f, _0x1cada8) {
    const _0xcc79ca = this.resolvedProperty;
    for (let _0x41cb57 = 0, _0x2d9375 = _0xcc79ca.length; _0x41cb57 !== _0x2d9375; ++_0x41cb57) {
      _0xcc79ca[_0x41cb57] = _0x3bbf9f[_0x1cada8++];
    }
    this.targetObject.needsUpdate = true;
  }
  ['_setValue_array_setMatrixWorldNeedsUpdate'](_0x2c4f04, _0x33dbdd) {
    const _0x1d0260 = this.resolvedProperty;
    for (let _0x398eb9 = 0, _0x2397b4 = _0x1d0260.length; _0x398eb9 !== _0x2397b4; ++_0x398eb9) {
      _0x1d0260[_0x398eb9] = _0x2c4f04[_0x33dbdd++];
    }
    this.targetObject.matrixWorldNeedsUpdate = true;
  }
  ['_setValue_arrayElement'](_0x3713c4, _0x47fdab) {
    this.resolvedProperty[this.propertyIndex] = _0x3713c4[_0x47fdab];
  }
  ['_setValue_arrayElement_setNeedsUpdate'](_0x4151f8, _0x21eb49) {
    ((this.resolvedProperty[this.propertyIndex] = _0x4151f8[_0x21eb49]),
      (this.targetObject.needsUpdate = true));
  }
  ['_setValue_arrayElement_setMatrixWorldNeedsUpdate'](_0x89ef7c, _0x20789c) {
    ((this.resolvedProperty[this.propertyIndex] = _0x89ef7c[_0x20789c]),
      (this.targetObject.matrixWorldNeedsUpdate = true));
  }
  ['_setValue_fromArray'](_0x4923ab, _0x25dfa7) {
    this.resolvedProperty.fromArray(_0x4923ab, _0x25dfa7);
  }
  ['_setValue_fromArray_setNeedsUpdate'](_0x4c7a45, _0x2f6b33) {
    (this.resolvedProperty.fromArray(_0x4c7a45, _0x2f6b33), (this.targetObject.needsUpdate = true));
  }
  ['_setValue_fromArray_setMatrixWorldNeedsUpdate'](_0x5b0e63, _0x2bd11c) {
    (this.resolvedProperty.fromArray(_0x5b0e63, _0x2bd11c),
      (this.targetObject.matrixWorldNeedsUpdate = true));
  }
  ['_getValue_unbound'](_0x46d9c9, _0x287eaf) {
    (this.bind(), this.getValue(_0x46d9c9, _0x287eaf));
  }
  ['_setValue_unbound'](_0x11706a, _0x5cf393) {
    (this.bind(), this.setValue(_0x11706a, _0x5cf393));
  }
  ['bind']() {
    let _0x4a202d = this.node;
    const _0x4a110c = this.parsedPath,
      _0x548181 = _0x4a110c.objectName,
      _0x183c97 = _0x4a110c.propertyName;
    let _0x5ed42e = _0x4a110c.propertyIndex;
    !_0x4a202d &&
      ((_0x4a202d = PropertyBinding.findNode(this.rootNode, _0x4a110c.nodeName)), (this.node = _0x4a202d));
    ((this.getValue = this._getValue_unavailable), (this.setValue = this._setValue_unavailable));
    if (!_0x4a202d) {
      console.warn('THREE.PropertyBinding: No target node found for track: ' + this.path + '.');
      return;
    }
    if (_0x548181) {
      let _0x42e3b7 = _0x4a110c.objectIndex;
      switch (_0x548181) {
        case 'materials':
          if (!_0x4a202d.material) {
            console.error(
              'THREE.PropertyBinding: Can not bind to material as node does not have a material.',
              this,
            );
            return;
          }
          if (!_0x4a202d.material.materials) {
            console.error(
              'THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.',
              this,
            );
            return;
          }
          _0x4a202d = _0x4a202d.material.materials;
          break;
        case 'bones':
          if (!_0x4a202d.skeleton) {
            console.error(
              'THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.',
              this,
            );
            return;
          }
          _0x4a202d = _0x4a202d.skeleton.bones;
          for (let _0x3a76ee = 0; _0x3a76ee < _0x4a202d.length; _0x3a76ee++) {
            if (_0x4a202d[_0x3a76ee].name === _0x42e3b7) {
              _0x42e3b7 = _0x3a76ee;
              break;
            }
          }
          break;
        case 'map':
          if ('map' in _0x4a202d) {
            _0x4a202d = _0x4a202d.map;
            break;
          }
          if (!_0x4a202d.material) {
            console.error(
              'THREE.PropertyBinding: Can not bind to material as node does not have a material.',
              this,
            );
            return;
          }
          if (!_0x4a202d.material.map) {
            console.error(
              'THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.',
              this,
            );
            return;
          }
          _0x4a202d = _0x4a202d.material.map;
          break;
        default:
          if (_0x4a202d[_0x548181] === undefined) {
            console.error('THREE.PropertyBinding: Can not bind to objectName of node undefined.', this);
            return;
          }
          _0x4a202d = _0x4a202d[_0x548181];
      }
      if (_0x42e3b7 !== undefined) {
        if (_0x4a202d[_0x42e3b7] === undefined) {
          console.error(
            'THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.',
            this,
            _0x4a202d,
          );
          return;
        }
        _0x4a202d = _0x4a202d[_0x42e3b7];
      }
    }
    const _0x3c99d1 = _0x4a202d[_0x183c97];
    if (_0x3c99d1 === undefined) {
      const _0x442552 = _0x4a110c.nodeName;
      console.error(
        'THREE.PropertyBinding: Trying to update property for track: ' +
          _0x442552 +
          '.' +
          _0x183c97 +
          " but it wasn't found.",
        _0x4a202d,
      );
      return;
    }
    let _0x5c8716 = this.Versioning.None;
    this.targetObject = _0x4a202d;
    if (_0x4a202d.isMaterial === true) _0x5c8716 = this.Versioning.NeedsUpdate;
    else _0x4a202d.isObject3D === true && (_0x5c8716 = this.Versioning.MatrixWorldNeedsUpdate);
    let _0x31b8f1 = this.BindingType.Direct;
    if (_0x5ed42e !== undefined) {
      if (_0x183c97 === 'morphTargetInfluences') {
        if (!_0x4a202d.geometry) {
          console.error(
            'THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.',
            this,
          );
          return;
        }
        if (!_0x4a202d.geometry.morphAttributes) {
          console.error(
            'THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.',
            this,
          );
          return;
        }
        _0x4a202d.morphTargetDictionary[_0x5ed42e] !== undefined &&
          (_0x5ed42e = _0x4a202d.morphTargetDictionary[_0x5ed42e]);
      }
      ((_0x31b8f1 = this.BindingType.ArrayElement),
        (this.resolvedProperty = _0x3c99d1),
        (this.propertyIndex = _0x5ed42e));
    } else {
      if (_0x3c99d1.fromArray !== undefined && _0x3c99d1.toArray !== undefined)
        ((_0x31b8f1 = this.BindingType.HasFromToArray), (this.resolvedProperty = _0x3c99d1));
      else
        Array.isArray(_0x3c99d1)
          ? ((_0x31b8f1 = this.BindingType.EntireArray), (this.resolvedProperty = _0x3c99d1))
          : (this.propertyName = _0x183c97);
    }
    ((this.getValue = this.GetterByBindingType[_0x31b8f1]),
      (this.setValue = this.SetterByBindingTypeAndVersioning[_0x31b8f1][_0x5c8716]));
  }
  ['unbind']() {
    ((this.node = null), (this.getValue = this._getValue_unbound), (this.setValue = this._setValue_unbound));
  }
}
((PropertyBinding.Composite = Composite),
  (PropertyBinding.prototype.BindingType = { Direct: 0, EntireArray: 1, ArrayElement: 2, HasFromToArray: 3 }),
  (PropertyBinding.prototype.Versioning = { None: 0, NeedsUpdate: 1, MatrixWorldNeedsUpdate: 2 }),
  (PropertyBinding.prototype.GetterByBindingType = [
    PropertyBinding.prototype._getValue_direct,
    PropertyBinding.prototype._getValue_array,
    PropertyBinding.prototype._getValue_arrayElement,
    PropertyBinding.prototype._getValue_toArray,
  ]),
  (PropertyBinding.prototype.SetterByBindingTypeAndVersioning = [
    [
      PropertyBinding.prototype._setValue_direct,
      PropertyBinding.prototype._setValue_direct_setNeedsUpdate,
      PropertyBinding.prototype._setValue_direct_setMatrixWorldNeedsUpdate,
    ],
    [
      PropertyBinding.prototype._setValue_array,
      PropertyBinding.prototype._setValue_array_setNeedsUpdate,
      PropertyBinding.prototype._setValue_array_setMatrixWorldNeedsUpdate,
    ],
    [
      PropertyBinding.prototype._setValue_arrayElement,
      PropertyBinding.prototype._setValue_arrayElement_setNeedsUpdate,
      PropertyBinding.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate,
    ],
    [
      PropertyBinding.prototype._setValue_fromArray,
      PropertyBinding.prototype._setValue_fromArray_setNeedsUpdate,
      PropertyBinding.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate,
    ],
  ]));
class AnimationObjectGroup {
  constructor() {
    ((this.isAnimationObjectGroup = true),
      (this.uuid = generateUUID()),
      (this._objects = Array.prototype.slice.call(arguments)),
      (this.nCachedObjects_ = 0));
    const _0x364c9f = {};
    this._indicesByUUID = _0x364c9f;
    for (let _0x52dfcc = 0, _0x424d0f = arguments.length; _0x52dfcc !== _0x424d0f; ++_0x52dfcc) {
      _0x364c9f[arguments[_0x52dfcc].uuid] = _0x52dfcc;
    }
    ((this._paths = []), (this._parsedPaths = []), (this._bindings = []), (this._bindingsIndicesByPath = {}));
    const _0x42e2b4 = this;
    this.stats = {
      objects: {
        get total() {
          return _0x42e2b4._objects.length;
        },
        get inUse() {
          return this.total - _0x42e2b4.nCachedObjects_;
        },
      },
      get bindingsPerObject() {
        return _0x42e2b4._bindings.length;
      },
    };
  }
  ['add']() {
    const _0x37fe76 = this._objects,
      _0x13e7a3 = this._indicesByUUID,
      _0x55c7a4 = this._paths,
      _0x328b28 = this._parsedPaths,
      _0x3cfd4a = this._bindings,
      _0x4f0e38 = _0x3cfd4a.length;
    let _0x12ce62 = undefined,
      _0x15e188 = _0x37fe76.length,
      _0x22673e = this.nCachedObjects_;
    for (let _0x56121f = 0, _0x2a64b6 = arguments.length; _0x56121f !== _0x2a64b6; ++_0x56121f) {
      const _0x3de659 = arguments[_0x56121f],
        _0x4fbce8 = _0x3de659.uuid;
      let _0x3bd145 = _0x13e7a3[_0x4fbce8];
      if (_0x3bd145 === undefined) {
        ((_0x3bd145 = _0x15e188++), (_0x13e7a3[_0x4fbce8] = _0x3bd145), _0x37fe76.push(_0x3de659));
        for (let _0x27f817 = 0, _0x4b64ac = _0x4f0e38; _0x27f817 !== _0x4b64ac; ++_0x27f817) {
          _0x3cfd4a[_0x27f817].push(
            new PropertyBinding(_0x3de659, _0x55c7a4[_0x27f817], _0x328b28[_0x27f817]),
          );
        }
      } else {
        if (_0x3bd145 < _0x22673e) {
          _0x12ce62 = _0x37fe76[_0x3bd145];
          const _0x3d33f8 = --_0x22673e,
            _0xd40bf1 = _0x37fe76[_0x3d33f8];
          ((_0x13e7a3[_0xd40bf1.uuid] = _0x3bd145),
            (_0x37fe76[_0x3bd145] = _0xd40bf1),
            (_0x13e7a3[_0x4fbce8] = _0x3d33f8),
            (_0x37fe76[_0x3d33f8] = _0x3de659));
          for (let _0x59c87a = 0, _0x11fe9f = _0x4f0e38; _0x59c87a !== _0x11fe9f; ++_0x59c87a) {
            const _0xef2d8d = _0x3cfd4a[_0x59c87a],
              _0xc66513 = _0xef2d8d[_0x3d33f8];
            let _0x33321 = _0xef2d8d[_0x3bd145];
            ((_0xef2d8d[_0x3bd145] = _0xc66513),
              _0x33321 === undefined &&
                (_0x33321 = new PropertyBinding(_0x3de659, _0x55c7a4[_0x59c87a], _0x328b28[_0x59c87a])),
              (_0xef2d8d[_0x3d33f8] = _0x33321));
          }
        } else
          _0x37fe76[_0x3bd145] !== _0x12ce62 &&
            console.error(
              'THREE.AnimationObjectGroup: Different objects with the same UUID ' +
                'detected. Clean the caches or recreate your infrastructure when reloading scenes.',
            );
      }
    }
    this.nCachedObjects_ = _0x22673e;
  }
  ['remove']() {
    const _0x200538 = this._objects,
      _0x400491 = this._indicesByUUID,
      _0x481c7f = this._bindings,
      _0x3e9da7 = _0x481c7f.length;
    let _0x4cf0b7 = this.nCachedObjects_;
    for (let _0x224c31 = 0, _0x5ccd3f = arguments.length; _0x224c31 !== _0x5ccd3f; ++_0x224c31) {
      const _0x2b1fa1 = arguments[_0x224c31],
        _0x385ac6 = _0x2b1fa1.uuid,
        _0x1f6a87 = _0x400491[_0x385ac6];
      if (_0x1f6a87 !== undefined && _0x1f6a87 >= _0x4cf0b7) {
        const _0x17c8ba = _0x4cf0b7++,
          _0x44b884 = _0x200538[_0x17c8ba];
        ((_0x400491[_0x44b884.uuid] = _0x1f6a87),
          (_0x200538[_0x1f6a87] = _0x44b884),
          (_0x400491[_0x385ac6] = _0x17c8ba),
          (_0x200538[_0x17c8ba] = _0x2b1fa1));
        for (let _0x260953 = 0, _0x40fc81 = _0x3e9da7; _0x260953 !== _0x40fc81; ++_0x260953) {
          const _0x13285b = _0x481c7f[_0x260953],
            _0x3daecb = _0x13285b[_0x17c8ba],
            _0xc42ffb = _0x13285b[_0x1f6a87];
          ((_0x13285b[_0x1f6a87] = _0x3daecb), (_0x13285b[_0x17c8ba] = _0xc42ffb));
        }
      }
    }
    this.nCachedObjects_ = _0x4cf0b7;
  }
  ['uncache']() {
    const _0x1e1021 = this._objects,
      _0x4fcd4d = this._indicesByUUID,
      _0x154777 = this._bindings,
      _0x52ee67 = _0x154777.length;
    let _0x2d0912 = this.nCachedObjects_,
      _0xc6ebc0 = _0x1e1021.length;
    for (let _0x74c58c = 0, _0x1db4bc = arguments.length; _0x74c58c !== _0x1db4bc; ++_0x74c58c) {
      const _0x334d5b = arguments[_0x74c58c],
        _0x12a28a = _0x334d5b.uuid,
        _0x43fe89 = _0x4fcd4d[_0x12a28a];
      if (_0x43fe89 !== undefined) {
        delete _0x4fcd4d[_0x12a28a];
        if (_0x43fe89 < _0x2d0912) {
          const _0x164750 = --_0x2d0912,
            _0x42a1e3 = _0x1e1021[_0x164750],
            _0x1a9eba = --_0xc6ebc0,
            _0x1aaac7 = _0x1e1021[_0x1a9eba];
          ((_0x4fcd4d[_0x42a1e3.uuid] = _0x43fe89),
            (_0x1e1021[_0x43fe89] = _0x42a1e3),
            (_0x4fcd4d[_0x1aaac7.uuid] = _0x164750),
            (_0x1e1021[_0x164750] = _0x1aaac7),
            _0x1e1021.pop());
          for (let _0x3c0dfd = 0, _0x192f92 = _0x52ee67; _0x3c0dfd !== _0x192f92; ++_0x3c0dfd) {
            const _0x45bc00 = _0x154777[_0x3c0dfd],
              _0x22abba = _0x45bc00[_0x164750],
              _0x340ac2 = _0x45bc00[_0x1a9eba];
            ((_0x45bc00[_0x43fe89] = _0x22abba), (_0x45bc00[_0x164750] = _0x340ac2), _0x45bc00.pop());
          }
        } else {
          const _0x256b9b = --_0xc6ebc0,
            _0x5a6bff = _0x1e1021[_0x256b9b];
          _0x256b9b > 0 && (_0x4fcd4d[_0x5a6bff.uuid] = _0x43fe89);
          ((_0x1e1021[_0x43fe89] = _0x5a6bff), _0x1e1021.pop());
          for (let _0x389394 = 0, _0x822810 = _0x52ee67; _0x389394 !== _0x822810; ++_0x389394) {
            const _0x451636 = _0x154777[_0x389394];
            ((_0x451636[_0x43fe89] = _0x451636[_0x256b9b]), _0x451636.pop());
          }
        }
      }
    }
    this.nCachedObjects_ = _0x2d0912;
  }
  ['subscribe_'](_0x2a2706, _0x2fb046) {
    const _0x429432 = this._bindingsIndicesByPath;
    let _0x518b73 = _0x429432[_0x2a2706];
    const _0x2be9d4 = this._bindings;
    if (_0x518b73 !== undefined) return _0x2be9d4[_0x518b73];
    const _0x2467ea = this._paths,
      _0x360648 = this._parsedPaths,
      _0x3b5efe = this._objects,
      _0x15f13b = _0x3b5efe.length,
      _0x13def4 = this.nCachedObjects_,
      _0x21be0b = new Array(_0x15f13b);
    ((_0x518b73 = _0x2be9d4.length),
      (_0x429432[_0x2a2706] = _0x518b73),
      _0x2467ea.push(_0x2a2706),
      _0x360648.push(_0x2fb046),
      _0x2be9d4.push(_0x21be0b));
    for (let _0x4e8240 = _0x13def4, _0x40aed4 = _0x3b5efe.length; _0x4e8240 !== _0x40aed4; ++_0x4e8240) {
      const _0x536dd8 = _0x3b5efe[_0x4e8240];
      _0x21be0b[_0x4e8240] = new PropertyBinding(_0x536dd8, _0x2a2706, _0x2fb046);
    }
    return _0x21be0b;
  }
  ['unsubscribe_'](_0x1e903e) {
    const _0x29514b = this._bindingsIndicesByPath,
      _0x42a447 = _0x29514b[_0x1e903e];
    if (_0x42a447 !== undefined) {
      const _0x1dd764 = this._paths,
        _0x44c879 = this._parsedPaths,
        _0x4049fc = this._bindings,
        _0xa0ebf8 = _0x4049fc.length - 1,
        _0x58ac67 = _0x4049fc[_0xa0ebf8],
        _0x434403 = _0x1e903e[_0xa0ebf8];
      ((_0x29514b[_0x434403] = _0x42a447),
        (_0x4049fc[_0x42a447] = _0x58ac67),
        _0x4049fc.pop(),
        (_0x44c879[_0x42a447] = _0x44c879[_0xa0ebf8]),
        _0x44c879.pop(),
        (_0x1dd764[_0x42a447] = _0x1dd764[_0xa0ebf8]),
        _0x1dd764.pop());
    }
  }
}
class AnimationAction {
  constructor(_0x5b5f73, _0x177047, _0x4a8fe8 = null, _0x142337 = _0x177047.blendMode) {
    ((this._mixer = _0x5b5f73),
      (this._clip = _0x177047),
      (this._localRoot = _0x4a8fe8),
      (this.blendMode = _0x142337));
    const _0x36fd20 = _0x177047.tracks,
      _0x2cdfc1 = _0x36fd20.length,
      _0x1647bf = new Array(_0x2cdfc1),
      _0xaed6a9 = { endingStart: ZeroCurvatureEnding, endingEnd: ZeroCurvatureEnding };
    for (let _0x4b0310 = 0; _0x4b0310 !== _0x2cdfc1; ++_0x4b0310) {
      const _0x1859fb = _0x36fd20[_0x4b0310].createInterpolant(null);
      ((_0x1647bf[_0x4b0310] = _0x1859fb), (_0x1859fb.settings = _0xaed6a9));
    }
    ((this._interpolantSettings = _0xaed6a9),
      (this._interpolants = _0x1647bf),
      (this._propertyBindings = new Array(_0x2cdfc1)),
      (this._cacheIndex = null),
      (this._byClipCacheIndex = null),
      (this._timeScaleInterpolant = null),
      (this._weightInterpolant = null),
      (this.loop = LoopRepeat),
      (this._loopCount = -1),
      (this._startTime = null),
      (this.time = 0),
      (this.timeScale = 1),
      (this._effectiveTimeScale = 1),
      (this.weight = 1),
      (this._effectiveWeight = 1),
      (this.repetitions = Infinity),
      (this.paused = false),
      (this.enabled = true),
      (this.clampWhenFinished = false),
      (this.zeroSlopeAtStart = true),
      (this.zeroSlopeAtEnd = true));
  }
  ['play']() {
    return (this._mixer._activateAction(this), this);
  }
  ['stop']() {
    return (this._mixer._deactivateAction(this), this.reset());
  }
  ['reset']() {
    return (
      (this.paused = false),
      (this.enabled = true),
      (this.time = 0),
      (this._loopCount = -1),
      (this._startTime = null),
      this.stopFading().stopWarping()
    );
  }
  ['isRunning']() {
    return (
      this.enabled &&
      !this.paused &&
      this.timeScale !== 0 &&
      this._startTime === null &&
      this._mixer._isActiveAction(this)
    );
  }
  ['isScheduled']() {
    return this._mixer._isActiveAction(this);
  }
  ['startAt'](_0x22483f) {
    return ((this._startTime = _0x22483f), this);
  }
  ['setLoop'](_0x350bcf, _0x1a003e) {
    return ((this.loop = _0x350bcf), (this.repetitions = _0x1a003e), this);
  }
  ['setEffectiveWeight'](_0x28a4b1) {
    return (
      (this.weight = _0x28a4b1),
      (this._effectiveWeight = this.enabled ? _0x28a4b1 : 0),
      this.stopFading()
    );
  }
  ['getEffectiveWeight']() {
    return this._effectiveWeight;
  }
  ['fadeIn'](_0x3e6895) {
    return this._scheduleFading(_0x3e6895, 0, 1);
  }
  ['fadeOut'](_0x58e9db) {
    return this._scheduleFading(_0x58e9db, 1, 0);
  }
  ['crossFadeFrom'](_0x312044, _0x1cb9dd, _0x274f5d = false) {
    (_0x312044.fadeOut(_0x1cb9dd), this.fadeIn(_0x1cb9dd));
    if (_0x274f5d === true) {
      const _0x490ded = this._clip.duration,
        _0x2dfe2d = _0x312044._clip.duration,
        _0x6d69e8 = _0x2dfe2d / _0x490ded,
        _0x598d69 = _0x490ded / _0x2dfe2d;
      (_0x312044.warp(1, _0x6d69e8, _0x1cb9dd), this.warp(_0x598d69, 1, _0x1cb9dd));
    }
    return this;
  }
  ['crossFadeTo'](_0x179d92, _0x485ab3, _0x2a471c = false) {
    return _0x179d92.crossFadeFrom(this, _0x485ab3, _0x2a471c);
  }
  ['stopFading']() {
    const _0x434f2b = this._weightInterpolant;
    return (
      _0x434f2b !== null &&
        ((this._weightInterpolant = null), this._mixer._takeBackControlInterpolant(_0x434f2b)),
      this
    );
  }
  ['setEffectiveTimeScale'](_0x19250e) {
    return (
      (this.timeScale = _0x19250e),
      (this._effectiveTimeScale = this.paused ? 0 : _0x19250e),
      this.stopWarping()
    );
  }
  ['getEffectiveTimeScale']() {
    return this._effectiveTimeScale;
  }
  ['setDuration'](_0x40790f) {
    return ((this.timeScale = this._clip.duration / _0x40790f), this.stopWarping());
  }
  ['syncWith'](_0x336548) {
    return ((this.time = _0x336548.time), (this.timeScale = _0x336548.timeScale), this.stopWarping());
  }
  ['halt'](_0x2735f0) {
    return this.warp(this._effectiveTimeScale, 0, _0x2735f0);
  }
  ['warp'](_0x5e9b97, _0x28eb51, _0x535514) {
    const _0x249d65 = this._mixer,
      _0x304ce0 = _0x249d65.time,
      _0x5d51f1 = this.timeScale;
    let _0x396820 = this._timeScaleInterpolant;
    _0x396820 === null &&
      ((_0x396820 = _0x249d65._lendControlInterpolant()), (this._timeScaleInterpolant = _0x396820));
    const _0x294173 = _0x396820.parameterPositions,
      _0x3ae574 = _0x396820.sampleValues;
    return (
      (_0x294173[0] = _0x304ce0),
      (_0x294173[1] = _0x304ce0 + _0x535514),
      (_0x3ae574[0] = _0x5e9b97 / _0x5d51f1),
      (_0x3ae574[1] = _0x28eb51 / _0x5d51f1),
      this
    );
  }
  ['stopWarping']() {
    const _0x336f36 = this._timeScaleInterpolant;
    return (
      _0x336f36 !== null &&
        ((this._timeScaleInterpolant = null), this._mixer._takeBackControlInterpolant(_0x336f36)),
      this
    );
  }
  ['getMixer']() {
    return this._mixer;
  }
  ['getClip']() {
    return this._clip;
  }
  ['getRoot']() {
    return this._localRoot || this._mixer._root;
  }
  ['_update'](_0x380596, _0x4ab357, _0x33d595, _0x577cd7) {
    if (!this.enabled) {
      this._updateWeight(_0x380596);
      return;
    }
    const _0x11a759 = this._startTime;
    if (_0x11a759 !== null) {
      const _0x9c51d7 = (_0x380596 - _0x11a759) * _0x33d595;
      _0x9c51d7 < 0 || _0x33d595 === 0
        ? (_0x4ab357 = 0)
        : ((this._startTime = null), (_0x4ab357 = _0x33d595 * _0x9c51d7));
    }
    _0x4ab357 *= this._updateTimeScale(_0x380596);
    const _0x4fa3a9 = this._updateTime(_0x4ab357),
      _0x27fb69 = this._updateWeight(_0x380596);
    if (_0x27fb69 > 0) {
      const _0x525a68 = this._interpolants,
        _0x661dbb = this._propertyBindings;
      switch (this.blendMode) {
        case AdditiveAnimationBlendMode:
          for (let _0x34aef3 = 0, _0x2f06d6 = _0x525a68.length; _0x34aef3 !== _0x2f06d6; ++_0x34aef3) {
            (_0x525a68[_0x34aef3].evaluate(_0x4fa3a9), _0x661dbb[_0x34aef3].accumulateAdditive(_0x27fb69));
          }
          break;
        case NormalAnimationBlendMode:
        default:
          for (let _0xbb282d = 0, _0x419166 = _0x525a68.length; _0xbb282d !== _0x419166; ++_0xbb282d) {
            (_0x525a68[_0xbb282d].evaluate(_0x4fa3a9), _0x661dbb[_0xbb282d].accumulate(_0x577cd7, _0x27fb69));
          }
      }
    }
  }
  ['_updateWeight'](_0x30f3fa) {
    let _0x401c83 = 0;
    if (this.enabled) {
      _0x401c83 = this.weight;
      const _0x343783 = this._weightInterpolant;
      if (_0x343783 !== null) {
        const _0x2e7149 = _0x343783.evaluate(_0x30f3fa)[0];
        ((_0x401c83 *= _0x2e7149),
          _0x30f3fa > _0x343783.parameterPositions[1] &&
            (this.stopFading(), _0x2e7149 === 0 && (this.enabled = false)));
      }
    }
    return ((this._effectiveWeight = _0x401c83), _0x401c83);
  }
  ['_updateTimeScale'](_0xfd518c) {
    let _0x130696 = 0;
    if (!this.paused) {
      _0x130696 = this.timeScale;
      const _0x525b89 = this._timeScaleInterpolant;
      if (_0x525b89 !== null) {
        const _0x4b7ccb = _0x525b89.evaluate(_0xfd518c)[0];
        ((_0x130696 *= _0x4b7ccb),
          _0xfd518c > _0x525b89.parameterPositions[1] &&
            (this.stopWarping(), _0x130696 === 0 ? (this.paused = true) : (this.timeScale = _0x130696)));
      }
    }
    return ((this._effectiveTimeScale = _0x130696), _0x130696);
  }
  ['_updateTime'](_0x1723eb) {
    const _0xe5a52e = this._clip.duration,
      _0x37295c = this.loop;
    let _0x506b58 = this.time + _0x1723eb,
      _0x852aa6 = this._loopCount;
    const _0x5a3fc6 = _0x37295c === LoopPingPong;
    if (_0x1723eb === 0) {
      if (_0x852aa6 === -1) return _0x506b58;
      return _0x5a3fc6 && (_0x852aa6 & 1) === 1 ? _0xe5a52e - _0x506b58 : _0x506b58;
    }
    if (_0x37295c === LoopOnce) {
      _0x852aa6 === -1 && ((this._loopCount = 0), this._setEndings(true, true, false));
      _0x47daa6: {
        if (_0x506b58 >= _0xe5a52e) _0x506b58 = _0xe5a52e;
        else {
          if (_0x506b58 < 0) _0x506b58 = 0;
          else {
            this.time = _0x506b58;
            break _0x47daa6;
          }
        }
        if (this.clampWhenFinished) this.paused = true;
        else this.enabled = false;
        ((this.time = _0x506b58),
          this._mixer.dispatchEvent({ type: 'finished', action: this, direction: _0x1723eb < 0 ? -1 : 1 }));
      }
    } else {
      _0x852aa6 === -1 &&
        (_0x1723eb >= 0
          ? ((_0x852aa6 = 0), this._setEndings(true, this.repetitions === 0, _0x5a3fc6))
          : this._setEndings(this.repetitions === 0, true, _0x5a3fc6));
      if (_0x506b58 >= _0xe5a52e || _0x506b58 < 0) {
        const _0x45fe51 = Math.floor(_0x506b58 / _0xe5a52e);
        ((_0x506b58 -= _0xe5a52e * _0x45fe51), (_0x852aa6 += Math.abs(_0x45fe51)));
        const _0x5391e3 = this.repetitions - _0x852aa6;
        if (_0x5391e3 <= 0) {
          if (this.clampWhenFinished) this.paused = true;
          else this.enabled = false;
          ((_0x506b58 = _0x1723eb > 0 ? _0xe5a52e : 0),
            (this.time = _0x506b58),
            this._mixer.dispatchEvent({ type: 'finished', action: this, direction: _0x1723eb > 0 ? 1 : -1 }));
        } else {
          if (_0x5391e3 === 1) {
            const _0x83485b = _0x1723eb < 0;
            this._setEndings(_0x83485b, !_0x83485b, _0x5a3fc6);
          } else this._setEndings(false, false, _0x5a3fc6);
          ((this._loopCount = _0x852aa6),
            (this.time = _0x506b58),
            this._mixer.dispatchEvent({ type: 'loop', action: this, loopDelta: _0x45fe51 }));
        }
      } else this.time = _0x506b58;
      if (_0x5a3fc6 && (_0x852aa6 & 1) === 1) return _0xe5a52e - _0x506b58;
    }
    return _0x506b58;
  }
  ['_setEndings'](_0x3dc900, _0x569d3b, _0x3af18e) {
    const _0x12d89d = this._interpolantSettings;
    _0x3af18e
      ? ((_0x12d89d.endingStart = ZeroSlopeEnding), (_0x12d89d.endingEnd = ZeroSlopeEnding))
      : (_0x3dc900
          ? (_0x12d89d.endingStart = this.zeroSlopeAtStart ? ZeroSlopeEnding : ZeroCurvatureEnding)
          : (_0x12d89d.endingStart = WrapAroundEnding),
        _0x569d3b
          ? (_0x12d89d.endingEnd = this.zeroSlopeAtEnd ? ZeroSlopeEnding : ZeroCurvatureEnding)
          : (_0x12d89d.endingEnd = WrapAroundEnding));
  }
  ['_scheduleFading'](_0x85faa3, _0xd5f72e, _0x7af9fb) {
    const _0x483f3e = this._mixer,
      _0x4f2dce = _0x483f3e.time;
    let _0x5121e0 = this._weightInterpolant;
    _0x5121e0 === null &&
      ((_0x5121e0 = _0x483f3e._lendControlInterpolant()), (this._weightInterpolant = _0x5121e0));
    const _0x498780 = _0x5121e0.parameterPositions,
      _0x4fd613 = _0x5121e0.sampleValues;
    return (
      (_0x498780[0] = _0x4f2dce),
      (_0x4fd613[0] = _0xd5f72e),
      (_0x498780[1] = _0x4f2dce + _0x85faa3),
      (_0x4fd613[1] = _0x7af9fb),
      this
    );
  }
}
const _controlInterpolantsResultBuffer = new Float32Array(1);
class AnimationMixer extends EventDispatcher {
  constructor(_0x345565) {
    (super(),
      (this._root = _0x345565),
      this._initMemoryManager(),
      (this._accuIndex = 0),
      (this.time = 0),
      (this.timeScale = 1));
  }
  ['_bindAction'](_0x3d1c9d, _0x46e994) {
    const _0x4d42c3 = _0x3d1c9d._localRoot || this._root,
      _0x4af7cc = _0x3d1c9d._clip.tracks,
      _0x307940 = _0x4af7cc.length,
      _0x178406 = _0x3d1c9d._propertyBindings,
      _0x7ddeaa = _0x3d1c9d._interpolants,
      _0x55e44b = _0x4d42c3.uuid,
      _0x173be5 = this._bindingsByRootAndName;
    let _0x100899 = _0x173be5[_0x55e44b];
    _0x100899 === undefined && ((_0x100899 = {}), (_0x173be5[_0x55e44b] = _0x100899));
    for (let _0x5e0361 = 0; _0x5e0361 !== _0x307940; ++_0x5e0361) {
      const _0x4909ac = _0x4af7cc[_0x5e0361],
        _0x3afa8e = _0x4909ac.name;
      let _0x5997b7 = _0x100899[_0x3afa8e];
      if (_0x5997b7 !== undefined) (++_0x5997b7.referenceCount, (_0x178406[_0x5e0361] = _0x5997b7));
      else {
        _0x5997b7 = _0x178406[_0x5e0361];
        if (_0x5997b7 !== undefined) {
          _0x5997b7._cacheIndex === null &&
            (++_0x5997b7.referenceCount, this._addInactiveBinding(_0x5997b7, _0x55e44b, _0x3afa8e));
          continue;
        }
        const _0x1630b3 = _0x46e994 && _0x46e994._propertyBindings[_0x5e0361].binding.parsedPath;
        ((_0x5997b7 = new PropertyMixer(
          PropertyBinding.create(_0x4d42c3, _0x3afa8e, _0x1630b3),
          _0x4909ac.ValueTypeName,
          _0x4909ac.getValueSize(),
        )),
          ++_0x5997b7.referenceCount,
          this._addInactiveBinding(_0x5997b7, _0x55e44b, _0x3afa8e),
          (_0x178406[_0x5e0361] = _0x5997b7));
      }
      _0x7ddeaa[_0x5e0361].resultBuffer = _0x5997b7.buffer;
    }
  }
  ['_activateAction'](_0x2ac4ca) {
    if (!this._isActiveAction(_0x2ac4ca)) {
      if (_0x2ac4ca._cacheIndex === null) {
        const _0x3b8b39 = (_0x2ac4ca._localRoot || this._root).uuid,
          _0x123a93 = _0x2ac4ca._clip.uuid,
          _0x328dfb = this._actionsByClip[_0x123a93];
        (this._bindAction(_0x2ac4ca, _0x328dfb && _0x328dfb.knownActions[0]),
          this._addInactiveAction(_0x2ac4ca, _0x123a93, _0x3b8b39));
      }
      const _0x29384b = _0x2ac4ca._propertyBindings;
      for (let _0x42f0c8 = 0, _0x478de8 = _0x29384b.length; _0x42f0c8 !== _0x478de8; ++_0x42f0c8) {
        const _0x98e4a7 = _0x29384b[_0x42f0c8];
        _0x98e4a7.useCount++ === 0 && (this._lendBinding(_0x98e4a7), _0x98e4a7.saveOriginalState());
      }
      this._lendAction(_0x2ac4ca);
    }
  }
  ['_deactivateAction'](_0x1cb538) {
    if (this._isActiveAction(_0x1cb538)) {
      const _0x184c0d = _0x1cb538._propertyBindings;
      for (let _0x8fbe5d = 0, _0x5c00fa = _0x184c0d.length; _0x8fbe5d !== _0x5c00fa; ++_0x8fbe5d) {
        const _0x5753a0 = _0x184c0d[_0x8fbe5d];
        --_0x5753a0.useCount === 0 && (_0x5753a0.restoreOriginalState(), this._takeBackBinding(_0x5753a0));
      }
      this._takeBackAction(_0x1cb538);
    }
  }
  ['_initMemoryManager']() {
    ((this._actions = []),
      (this._nActiveActions = 0),
      (this._actionsByClip = {}),
      (this._bindings = []),
      (this._nActiveBindings = 0),
      (this._bindingsByRootAndName = {}),
      (this._controlInterpolants = []),
      (this._nActiveControlInterpolants = 0));
    const _0xa636dd = this;
    this.stats = {
      actions: {
        get total() {
          return _0xa636dd._actions.length;
        },
        get inUse() {
          return _0xa636dd._nActiveActions;
        },
      },
      bindings: {
        get total() {
          return _0xa636dd._bindings.length;
        },
        get inUse() {
          return _0xa636dd._nActiveBindings;
        },
      },
      controlInterpolants: {
        get total() {
          return _0xa636dd._controlInterpolants.length;
        },
        get inUse() {
          return _0xa636dd._nActiveControlInterpolants;
        },
      },
    };
  }
  ['_isActiveAction'](_0x2f17bc) {
    const _0x3becf1 = _0x2f17bc._cacheIndex;
    return _0x3becf1 !== null && _0x3becf1 < this._nActiveActions;
  }
  ['_addInactiveAction'](_0x2677e7, _0x2696de, _0x2b8794) {
    const _0xc1a761 = this._actions,
      _0x5e5f1a = this._actionsByClip;
    let _0x2c679e = _0x5e5f1a[_0x2696de];
    if (_0x2c679e === undefined)
      ((_0x2c679e = { knownActions: [_0x2677e7], actionByRoot: {} }),
        (_0x2677e7._byClipCacheIndex = 0),
        (_0x5e5f1a[_0x2696de] = _0x2c679e));
    else {
      const _0x34cd80 = _0x2c679e.knownActions;
      ((_0x2677e7._byClipCacheIndex = _0x34cd80.length), _0x34cd80.push(_0x2677e7));
    }
    ((_0x2677e7._cacheIndex = _0xc1a761.length),
      _0xc1a761.push(_0x2677e7),
      (_0x2c679e.actionByRoot[_0x2b8794] = _0x2677e7));
  }
  ['_removeInactiveAction'](_0x5f20a2) {
    const _0x44a911 = this._actions,
      _0x2f431e = _0x44a911[_0x44a911.length - 1],
      _0x1582ea = _0x5f20a2._cacheIndex;
    ((_0x2f431e._cacheIndex = _0x1582ea),
      (_0x44a911[_0x1582ea] = _0x2f431e),
      _0x44a911.pop(),
      (_0x5f20a2._cacheIndex = null));
    const _0x6bed1d = _0x5f20a2._clip.uuid,
      _0x312be6 = this._actionsByClip,
      _0x26069b = _0x312be6[_0x6bed1d],
      _0x461b3d = _0x26069b.knownActions,
      _0x64f85 = _0x461b3d[_0x461b3d.length - 1],
      _0x436a87 = _0x5f20a2._byClipCacheIndex;
    ((_0x64f85._byClipCacheIndex = _0x436a87),
      (_0x461b3d[_0x436a87] = _0x64f85),
      _0x461b3d.pop(),
      (_0x5f20a2._byClipCacheIndex = null));
    const _0x2247c3 = _0x26069b.actionByRoot,
      _0x4fd1ab = (_0x5f20a2._localRoot || this._root).uuid;
    (delete _0x2247c3[_0x4fd1ab],
      _0x461b3d.length === 0 && delete _0x312be6[_0x6bed1d],
      this._removeInactiveBindingsForAction(_0x5f20a2));
  }
  ['_removeInactiveBindingsForAction'](_0x2fa93a) {
    const _0xb88e12 = _0x2fa93a._propertyBindings;
    for (let _0x27665d = 0, _0x94932c = _0xb88e12.length; _0x27665d !== _0x94932c; ++_0x27665d) {
      const _0x326c8f = _0xb88e12[_0x27665d];
      --_0x326c8f.referenceCount === 0 && this._removeInactiveBinding(_0x326c8f);
    }
  }
  ['_lendAction'](_0x176c1f) {
    const _0x2ea1e8 = this._actions,
      _0x457496 = _0x176c1f._cacheIndex,
      _0x272039 = this._nActiveActions++,
      _0x39aed5 = _0x2ea1e8[_0x272039];
    ((_0x176c1f._cacheIndex = _0x272039),
      (_0x2ea1e8[_0x272039] = _0x176c1f),
      (_0x39aed5._cacheIndex = _0x457496),
      (_0x2ea1e8[_0x457496] = _0x39aed5));
  }
  ['_takeBackAction'](_0x26994a) {
    const _0x1547ea = this._actions,
      _0x298fc2 = _0x26994a._cacheIndex,
      _0x44ea53 = --this._nActiveActions,
      _0x59c31d = _0x1547ea[_0x44ea53];
    ((_0x26994a._cacheIndex = _0x44ea53),
      (_0x1547ea[_0x44ea53] = _0x26994a),
      (_0x59c31d._cacheIndex = _0x298fc2),
      (_0x1547ea[_0x298fc2] = _0x59c31d));
  }
  ['_addInactiveBinding'](_0x2637d3, _0x270312, _0x44b26d) {
    const _0x53edb5 = this._bindingsByRootAndName,
      _0x321303 = this._bindings;
    let _0x751e58 = _0x53edb5[_0x270312];
    (_0x751e58 === undefined && ((_0x751e58 = {}), (_0x53edb5[_0x270312] = _0x751e58)),
      (_0x751e58[_0x44b26d] = _0x2637d3),
      (_0x2637d3._cacheIndex = _0x321303.length),
      _0x321303.push(_0x2637d3));
  }
  ['_removeInactiveBinding'](_0x578884) {
    const _0x2c30b7 = this._bindings,
      _0x479313 = _0x578884.binding,
      _0xc80e25 = _0x479313.rootNode.uuid,
      _0x54b54c = _0x479313.path,
      _0x22ccd5 = this._bindingsByRootAndName,
      _0x401f82 = _0x22ccd5[_0xc80e25],
      _0x27c5ff = _0x2c30b7[_0x2c30b7.length - 1],
      _0x148929 = _0x578884._cacheIndex;
    ((_0x27c5ff._cacheIndex = _0x148929),
      (_0x2c30b7[_0x148929] = _0x27c5ff),
      _0x2c30b7.pop(),
      delete _0x401f82[_0x54b54c],
      Object.keys(_0x401f82).length === 0 && delete _0x22ccd5[_0xc80e25]);
  }
  ['_lendBinding'](_0x1cc0d7) {
    const _0x5690aa = this._bindings,
      _0x11d401 = _0x1cc0d7._cacheIndex,
      _0x238a5f = this._nActiveBindings++,
      _0x45076a = _0x5690aa[_0x238a5f];
    ((_0x1cc0d7._cacheIndex = _0x238a5f),
      (_0x5690aa[_0x238a5f] = _0x1cc0d7),
      (_0x45076a._cacheIndex = _0x11d401),
      (_0x5690aa[_0x11d401] = _0x45076a));
  }
  ['_takeBackBinding'](_0x18585d) {
    const _0x493d1d = this._bindings,
      _0x4ceee6 = _0x18585d._cacheIndex,
      _0x531091 = --this._nActiveBindings,
      _0x5808f1 = _0x493d1d[_0x531091];
    ((_0x18585d._cacheIndex = _0x531091),
      (_0x493d1d[_0x531091] = _0x18585d),
      (_0x5808f1._cacheIndex = _0x4ceee6),
      (_0x493d1d[_0x4ceee6] = _0x5808f1));
  }
  ['_lendControlInterpolant']() {
    const _0x3adb62 = this._controlInterpolants,
      _0x319cc3 = this._nActiveControlInterpolants++;
    let _0x4e700e = _0x3adb62[_0x319cc3];
    return (
      _0x4e700e === undefined &&
        ((_0x4e700e = new LinearInterpolant(
          new Float32Array(2),
          new Float32Array(2),
          1,
          _controlInterpolantsResultBuffer,
        )),
        (_0x4e700e.__cacheIndex = _0x319cc3),
        (_0x3adb62[_0x319cc3] = _0x4e700e)),
      _0x4e700e
    );
  }
  ['_takeBackControlInterpolant'](_0x5dadf5) {
    const _0x3a2266 = this._controlInterpolants,
      _0x5c7291 = _0x5dadf5.__cacheIndex,
      _0x14caf4 = --this._nActiveControlInterpolants,
      _0x3c4481 = _0x3a2266[_0x14caf4];
    ((_0x5dadf5.__cacheIndex = _0x14caf4),
      (_0x3a2266[_0x14caf4] = _0x5dadf5),
      (_0x3c4481.__cacheIndex = _0x5c7291),
      (_0x3a2266[_0x5c7291] = _0x3c4481));
  }
  ['clipAction'](_0x4a4d35, _0x1309f0, _0x528a5a) {
    const _0x227617 = _0x1309f0 || this._root,
      _0x195d93 = _0x227617.uuid;
    let _0x3c88d2 =
      typeof _0x4a4d35 === 'string' ? AnimationClip.findByName(_0x227617, _0x4a4d35) : _0x4a4d35;
    const _0x1a630e = _0x3c88d2 !== null ? _0x3c88d2.uuid : _0x4a4d35,
      _0xe7112b = this._actionsByClip[_0x1a630e];
    let _0x591b47 = null;
    _0x528a5a === undefined &&
      (_0x3c88d2 !== null ? (_0x528a5a = _0x3c88d2.blendMode) : (_0x528a5a = NormalAnimationBlendMode));
    if (_0xe7112b !== undefined) {
      const _0x3fa435 = _0xe7112b.actionByRoot[_0x195d93];
      if (_0x3fa435 !== undefined && _0x3fa435.blendMode === _0x528a5a) return _0x3fa435;
      _0x591b47 = _0xe7112b.knownActions[0];
      if (_0x3c88d2 === null) _0x3c88d2 = _0x591b47._clip;
    }
    if (_0x3c88d2 === null) return null;
    const _0x1397f3 = new AnimationAction(this, _0x3c88d2, _0x1309f0, _0x528a5a);
    return (
      this._bindAction(_0x1397f3, _0x591b47),
      this._addInactiveAction(_0x1397f3, _0x1a630e, _0x195d93),
      _0x1397f3
    );
  }
  ['existingAction'](_0x26f9b2, _0x22ab90) {
    const _0x57390f = _0x22ab90 || this._root,
      _0x1555bd = _0x57390f.uuid,
      _0x51618f = typeof _0x26f9b2 === 'string' ? AnimationClip.findByName(_0x57390f, _0x26f9b2) : _0x26f9b2,
      _0x1e2f8b = _0x51618f ? _0x51618f.uuid : _0x26f9b2,
      _0x4c0919 = this._actionsByClip[_0x1e2f8b];
    if (_0x4c0919 !== undefined) return _0x4c0919.actionByRoot[_0x1555bd] || null;
    return null;
  }
  ['stopAllAction']() {
    const _0x3b3260 = this._actions,
      _0x47cbf8 = this._nActiveActions;
    for (let _0x464f8b = _0x47cbf8 - 1; _0x464f8b >= 0; --_0x464f8b) {
      _0x3b3260[_0x464f8b].stop();
    }
    return this;
  }
  ['update'](_0x4072a9) {
    _0x4072a9 *= this.timeScale;
    const _0x2bf52d = this._actions,
      _0x6f78a6 = this._nActiveActions,
      _0x1cc901 = (this.time += _0x4072a9),
      _0x5628f1 = Math.sign(_0x4072a9),
      _0x346126 = (this._accuIndex ^= 1);
    for (let _0x54a87b = 0; _0x54a87b !== _0x6f78a6; ++_0x54a87b) {
      const _0x48ab04 = _0x2bf52d[_0x54a87b];
      _0x48ab04._update(_0x1cc901, _0x4072a9, _0x5628f1, _0x346126);
    }
    const _0x12dee4 = this._bindings,
      _0x5d78f8 = this._nActiveBindings;
    for (let _0x13dd9a = 0; _0x13dd9a !== _0x5d78f8; ++_0x13dd9a) {
      _0x12dee4[_0x13dd9a].apply(_0x346126);
    }
    return this;
  }
  ['setTime'](_0x106d18) {
    this.time = 0;
    for (let _0x58c11c = 0; _0x58c11c < this._actions.length; _0x58c11c++) {
      this._actions[_0x58c11c].time = 0;
    }
    return this.update(_0x106d18);
  }
  ['getRoot']() {
    return this._root;
  }
  ['uncacheClip'](_0x545538) {
    const _0x1f0c51 = this._actions,
      _0x69a040 = _0x545538.uuid,
      _0x35ed2f = this._actionsByClip,
      _0x282707 = _0x35ed2f[_0x69a040];
    if (_0x282707 !== undefined) {
      const _0x2e810d = _0x282707.knownActions;
      for (let _0x101c90 = 0, _0x2bf5bc = _0x2e810d.length; _0x101c90 !== _0x2bf5bc; ++_0x101c90) {
        const _0x5490ec = _0x2e810d[_0x101c90];
        this._deactivateAction(_0x5490ec);
        const _0x16081d = _0x5490ec._cacheIndex,
          _0x2fad3c = _0x1f0c51[_0x1f0c51.length - 1];
        ((_0x5490ec._cacheIndex = null),
          (_0x5490ec._byClipCacheIndex = null),
          (_0x2fad3c._cacheIndex = _0x16081d),
          (_0x1f0c51[_0x16081d] = _0x2fad3c),
          _0x1f0c51.pop(),
          this._removeInactiveBindingsForAction(_0x5490ec));
      }
      delete _0x35ed2f[_0x69a040];
    }
  }
  ['uncacheRoot'](_0x3e2f93) {
    const _0x527c38 = _0x3e2f93.uuid,
      _0x50ccd8 = this._actionsByClip;
    for (const _0xe726ee in _0x50ccd8) {
      const _0x3ec4b8 = _0x50ccd8[_0xe726ee].actionByRoot,
        _0x5e4d88 = _0x3ec4b8[_0x527c38];
      _0x5e4d88 !== undefined && (this._deactivateAction(_0x5e4d88), this._removeInactiveAction(_0x5e4d88));
    }
    const _0x4d970a = this._bindingsByRootAndName,
      _0x173564 = _0x4d970a[_0x527c38];
    if (_0x173564 !== undefined)
      for (const _0x145ec5 in _0x173564) {
        const _0xc79fb = _0x173564[_0x145ec5];
        (_0xc79fb.restoreOriginalState(), this._removeInactiveBinding(_0xc79fb));
      }
  }
  ['uncacheAction'](_0x33b5d9, _0x2497bc) {
    const _0x246209 = this.existingAction(_0x33b5d9, _0x2497bc);
    _0x246209 !== null && (this._deactivateAction(_0x246209), this._removeInactiveAction(_0x246209));
  }
}
class RenderTarget3D extends RenderTarget {
  constructor(_0x10c14d = 1, _0x3cad18 = 1, _0xeb91ae = 1, _0x34648b = {}) {
    (super(_0x10c14d, _0x3cad18, _0x34648b),
      (this.isRenderTarget3D = true),
      (this.depth = _0xeb91ae),
      (this.texture = new Data3DTexture(null, _0x10c14d, _0x3cad18, _0xeb91ae)),
      this._setTextureOptions(_0x34648b),
      (this.texture.isRenderTargetTexture = true));
  }
}
class Uniform {
  constructor(_0x1e3d31) {
    this.value = _0x1e3d31;
  }
  ['clone']() {
    return new Uniform(this.value.clone === undefined ? this.value : this.value.clone());
  }
}
let _id = 0;
class UniformsGroup extends EventDispatcher {
  constructor() {
    (super(),
      (this.isUniformsGroup = true),
      Object.defineProperty(this, 'id', { value: _id++ }),
      (this.name = ''),
      (this.usage = StaticDrawUsage),
      (this.uniforms = []));
  }
  ['add'](_0x2eb730) {
    return (this.uniforms.push(_0x2eb730), this);
  }
  ['remove'](_0x1fe012) {
    const _0x2f6f08 = this.uniforms.indexOf(_0x1fe012);
    if (_0x2f6f08 !== -1) this.uniforms.splice(_0x2f6f08, 1);
    return this;
  }
  ['setName'](_0x18d2b7) {
    return ((this.name = _0x18d2b7), this);
  }
  ['setUsage'](_0x3078ae) {
    return ((this.usage = _0x3078ae), this);
  }
  ['dispose']() {
    this.dispatchEvent({ type: 'dispose' });
  }
  ['copy'](_0x89fe15) {
    ((this.name = _0x89fe15.name), (this.usage = _0x89fe15.usage));
    const _0x163cf = _0x89fe15.uniforms;
    this.uniforms.length = 0;
    for (let _0x16bd80 = 0, _0x4b0a55 = _0x163cf.length; _0x16bd80 < _0x4b0a55; _0x16bd80++) {
      const _0x6139fa = Array.isArray(_0x163cf[_0x16bd80]) ? _0x163cf[_0x16bd80] : [_0x163cf[_0x16bd80]];
      for (let _0x5b88ec = 0; _0x5b88ec < _0x6139fa.length; _0x5b88ec++) {
        this.uniforms.push(_0x6139fa[_0x5b88ec].clone());
      }
    }
    return this;
  }
  ['clone']() {
    return new this['constructor']().copy(this);
  }
}
class InstancedInterleavedBuffer extends InterleavedBuffer {
  constructor(_0xd0f611, _0x5e6e66, _0x1645e7 = 1) {
    (super(_0xd0f611, _0x5e6e66),
      (this.isInstancedInterleavedBuffer = true),
      (this.meshPerAttribute = _0x1645e7));
  }
  ['copy'](_0x3eea03) {
    return (super.copy(_0x3eea03), (this.meshPerAttribute = _0x3eea03.meshPerAttribute), this);
  }
  ['clone'](_0x297e78) {
    const _0x2d0457 = super.clone(_0x297e78);
    return ((_0x2d0457.meshPerAttribute = this.meshPerAttribute), _0x2d0457);
  }
  ['toJSON'](_0x38e933) {
    const _0x53293e = super.toJSON(_0x38e933);
    return (
      (_0x53293e.isInstancedInterleavedBuffer = true),
      (_0x53293e.meshPerAttribute = this.meshPerAttribute),
      _0x53293e
    );
  }
}
class GLBufferAttribute {
  constructor(_0x2dbc3c, _0x100a7c, _0xec38d, _0x40e3e7, _0x329239, _0x41abc7 = false) {
    ((this.isGLBufferAttribute = true),
      (this.name = ''),
      (this.buffer = _0x2dbc3c),
      (this.type = _0x100a7c),
      (this.itemSize = _0xec38d),
      (this.elementSize = _0x40e3e7),
      (this.count = _0x329239),
      (this.normalized = _0x41abc7),
      (this.version = 0));
  }
  set ['needsUpdate'](_0x53de02) {
    if (_0x53de02 === true) this.version++;
  }
  ['setBuffer'](_0x3757a4) {
    return ((this.buffer = _0x3757a4), this);
  }
  ['setType'](_0x346a55, _0xeb145) {
    return ((this.type = _0x346a55), (this.elementSize = _0xeb145), this);
  }
  ['setItemSize'](_0x31fa5c) {
    return ((this.itemSize = _0x31fa5c), this);
  }
  ['setCount'](_0x5b79a7) {
    return ((this.count = _0x5b79a7), this);
  }
}
const _matrix = new Matrix4();
class Raycaster {
  constructor(_0xe25523, _0x286cc1, _0x97fb07 = 0, _0x512700 = Infinity) {
    ((this.ray = new Ray(_0xe25523, _0x286cc1)),
      (this.near = _0x97fb07),
      (this.far = _0x512700),
      (this.camera = null),
      (this.layers = new Layers()),
      (this.params = { Mesh: {}, Line: { threshold: 1 }, LOD: {}, Points: { threshold: 1 }, Sprite: {} }));
  }
  ['set'](_0x43d452, _0x3b0d7e) {
    this.ray.set(_0x43d452, _0x3b0d7e);
  }
  ['setFromCamera'](_0x24b942, _0x427fc7) {
    if (_0x427fc7.isPerspectiveCamera)
      (this.ray.origin.setFromMatrixPosition(_0x427fc7.matrixWorld),
        this.ray.direction
          .set(_0x24b942.x, _0x24b942.y, 0.5)
          .unproject(_0x427fc7)
          .sub(this.ray.origin)
          .normalize(),
        (this.camera = _0x427fc7));
    else
      _0x427fc7.isOrthographicCamera
        ? (this.ray.origin
            .set(
              _0x24b942.x,
              _0x24b942.y,
              (_0x427fc7.near + _0x427fc7.far) / (_0x427fc7.near - _0x427fc7.far),
            )
            .unproject(_0x427fc7),
          this.ray.direction.set(0, 0, -1).transformDirection(_0x427fc7.matrixWorld),
          (this.camera = _0x427fc7))
        : console.error('THREE.Raycaster: Unsupported camera type: ' + _0x427fc7.type);
  }
  ['setFromXRController'](_0x20a92e) {
    return (
      _matrix.identity().extractRotation(_0x20a92e.matrixWorld),
      this.ray.origin.setFromMatrixPosition(_0x20a92e.matrixWorld),
      this.ray.direction.set(0, 0, -1).applyMatrix4(_matrix),
      this
    );
  }
  ['intersectObject'](_0x2ad87c, _0x415155 = true, _0x195a9a = []) {
    return (intersect(_0x2ad87c, this, _0x195a9a, _0x415155), _0x195a9a.sort(ascSort), _0x195a9a);
  }
  ['intersectObjects'](_0x59ccd7, _0x5533a9 = true, _0xd2ff77 = []) {
    for (let _0x9abc5e = 0, _0x32ea60 = _0x59ccd7.length; _0x9abc5e < _0x32ea60; _0x9abc5e++) {
      intersect(_0x59ccd7[_0x9abc5e], this, _0xd2ff77, _0x5533a9);
    }
    return (_0xd2ff77.sort(ascSort), _0xd2ff77);
  }
}
function ascSort(_0x279f0f, _0x5871b1) {
  return _0x279f0f.distance - _0x5871b1.distance;
}
function intersect(_0x263e56, _0x2c66d9, _0x5ef7e6, _0x536c6e) {
  let _0xc26c17 = true;
  if (_0x263e56.layers.test(_0x2c66d9.layers)) {
    const _0x1f2df3 = _0x263e56.raycast(_0x2c66d9, _0x5ef7e6);
    if (_0x1f2df3 === false) _0xc26c17 = false;
  }
  if (_0xc26c17 === true && _0x536c6e === true) {
    const _0x5e5a41 = _0x263e56.children;
    for (let _0x30596f = 0, _0x2a7072 = _0x5e5a41.length; _0x30596f < _0x2a7072; _0x30596f++) {
      intersect(_0x5e5a41[_0x30596f], _0x2c66d9, _0x5ef7e6, true);
    }
  }
}
class Timer {
  constructor() {
    ((this._previousTime = 0),
      (this._currentTime = 0),
      (this._startTime = performance.now()),
      (this._delta = 0),
      (this._elapsed = 0),
      (this._timescale = 1),
      (this._document = null),
      (this._pageVisibilityHandler = null));
  }
  ['connect'](_0x3dd0e0) {
    ((this._document = _0x3dd0e0),
      _0x3dd0e0.hidden !== undefined &&
        ((this._pageVisibilityHandler = handleVisibilityChange.bind(this)),
        _0x3dd0e0.addEventListener('visibilitychange', this._pageVisibilityHandler, false)));
  }
  ['disconnect']() {
    (this._pageVisibilityHandler !== null &&
      (this._document.removeEventListener('visibilitychange', this._pageVisibilityHandler),
      (this._pageVisibilityHandler = null)),
      (this._document = null));
  }
  ['getDelta']() {
    return this._delta / 0x3e8;
  }
  ['getElapsed']() {
    return this._elapsed / 0x3e8;
  }
  ['getTimescale']() {
    return this._timescale;
  }
  ['setTimescale'](_0x3e1b53) {
    return ((this._timescale = _0x3e1b53), this);
  }
  ['reset']() {
    return ((this._currentTime = performance.now() - this._startTime), this);
  }
  ['dispose']() {
    this.disconnect();
  }
  ['update'](_0x3625da) {
    return (
      this._pageVisibilityHandler !== null && this._document.hidden === true
        ? (this._delta = 0)
        : ((this._previousTime = this._currentTime),
          (this._currentTime = (_0x3625da !== undefined ? _0x3625da : performance.now()) - this._startTime),
          (this._delta = (this._currentTime - this._previousTime) * this._timescale),
          (this._elapsed += this._delta)),
      this
    );
  }
}
function handleVisibilityChange() {
  if (this._document.hidden === false) this.reset();
}
class Spherical {
  constructor(_0x1dda1d = 1, _0x16cf87 = 0, _0x244d81 = 0) {
    ((this.radius = _0x1dda1d), (this.phi = _0x16cf87), (this.theta = _0x244d81));
  }
  ['set'](_0x3f274a, _0x380140, _0x4614a3) {
    return ((this.radius = _0x3f274a), (this.phi = _0x380140), (this.theta = _0x4614a3), this);
  }
  ['copy'](_0x57f9ed) {
    return (
      (this.radius = _0x57f9ed.radius),
      (this.phi = _0x57f9ed.phi),
      (this.theta = _0x57f9ed.theta),
      this
    );
  }
  ['makeSafe']() {
    const _0x460066 = 0.000001;
    return ((this.phi = clamp(this.phi, _0x460066, Math.PI - _0x460066)), this);
  }
  ['setFromVector3'](_0x34c9b2) {
    return this.setFromCartesianCoords(_0x34c9b2.x, _0x34c9b2.y, _0x34c9b2.z);
  }
  ['setFromCartesianCoords'](_0x39d119, _0x293460, _0x257d1d) {
    return (
      (this.radius = Math.sqrt(_0x39d119 * _0x39d119 + _0x293460 * _0x293460 + _0x257d1d * _0x257d1d)),
      this.radius === 0
        ? ((this.theta = 0), (this.phi = 0))
        : ((this.theta = Math.atan2(_0x39d119, _0x257d1d)),
          (this.phi = Math.acos(clamp(_0x293460 / this.radius, -1, 1)))),
      this
    );
  }
  ['clone']() {
    return new this['constructor']().copy(this);
  }
}
class Cylindrical {
  constructor(_0x5ab240 = 1, _0x3e75a4 = 0, _0x1b52d3 = 0) {
    ((this.radius = _0x5ab240), (this.theta = _0x3e75a4), (this.y = _0x1b52d3));
  }
  ['set'](_0x27b511, _0x335ac7, _0x306372) {
    return ((this.radius = _0x27b511), (this.theta = _0x335ac7), (this.y = _0x306372), this);
  }
  ['copy'](_0x41b514) {
    return ((this.radius = _0x41b514.radius), (this.theta = _0x41b514.theta), (this.y = _0x41b514.y), this);
  }
  ['setFromVector3'](_0x1b8ff0) {
    return this.setFromCartesianCoords(_0x1b8ff0.x, _0x1b8ff0.y, _0x1b8ff0.z);
  }
  ['setFromCartesianCoords'](_0x12b46a, _0xf58ff8, _0x282e20) {
    return (
      (this.radius = Math.sqrt(_0x12b46a * _0x12b46a + _0x282e20 * _0x282e20)),
      (this.theta = Math.atan2(_0x12b46a, _0x282e20)),
      (this.y = _0xf58ff8),
      this
    );
  }
  ['clone']() {
    return new this['constructor']().copy(this);
  }
}
class Matrix2 {
  constructor(_0x24739c, _0x4042d9, _0x5e97e3, _0x1566e6) {
    ((Matrix2.prototype.isMatrix2 = true),
      (this.elements = [1, 0, 0, 1]),
      _0x24739c !== undefined && this.set(_0x24739c, _0x4042d9, _0x5e97e3, _0x1566e6));
  }
  ['identity']() {
    return (this.set(1, 0, 0, 1), this);
  }
  ['fromArray'](_0x4c2690, _0x397bd2 = 0) {
    for (let _0x553513 = 0; _0x553513 < 4; _0x553513++) {
      this.elements[_0x553513] = _0x4c2690[_0x553513 + _0x397bd2];
    }
    return this;
  }
  ['set'](_0x44aff5, _0x2448e3, _0x5076f5, _0x14c8c6) {
    const _0x5b3bf7 = this.elements;
    return (
      (_0x5b3bf7[0] = _0x44aff5),
      (_0x5b3bf7[2] = _0x2448e3),
      (_0x5b3bf7[1] = _0x5076f5),
      (_0x5b3bf7[3] = _0x14c8c6),
      this
    );
  }
}
const _vector$4 = new Vector2();
class Box2 {
  constructor(_0x208cc9 = new Vector2(+Infinity, +Infinity), _0x38af97 = new Vector2(-Infinity, -Infinity)) {
    ((this.isBox2 = true), (this.min = _0x208cc9), (this.max = _0x38af97));
  }
  ['set'](_0x4a8ee8, _0x166f9b) {
    return (this.min.copy(_0x4a8ee8), this.max.copy(_0x166f9b), this);
  }
  ['setFromPoints'](_0x15b0d3) {
    this.makeEmpty();
    for (let _0x39da02 = 0, _0x466089 = _0x15b0d3.length; _0x39da02 < _0x466089; _0x39da02++) {
      this.expandByPoint(_0x15b0d3[_0x39da02]);
    }
    return this;
  }
  ['setFromCenterAndSize'](_0x8b8b55, _0x4033fe) {
    const _0x22b473 = _vector$4.copy(_0x4033fe).multiplyScalar(0.5);
    return (this.min.copy(_0x8b8b55).sub(_0x22b473), this.max.copy(_0x8b8b55).add(_0x22b473), this);
  }
  ['clone']() {
    return new this['constructor']().copy(this);
  }
  ['copy'](_0x1d29dd) {
    return (this.min.copy(_0x1d29dd.min), this.max.copy(_0x1d29dd.max), this);
  }
  ['makeEmpty']() {
    return ((this.min.x = this.min.y = +Infinity), (this.max.x = this.max.y = -Infinity), this);
  }
  ['isEmpty']() {
    return this.max.x < this.min.x || this.max.y < this.min.y;
  }
  ['getCenter'](_0x21ba7f) {
    return this.isEmpty()
      ? _0x21ba7f.set(0, 0)
      : _0x21ba7f.addVectors(this.min, this.max).multiplyScalar(0.5);
  }
  ['getSize'](_0xeb4b12) {
    return this.isEmpty() ? _0xeb4b12.set(0, 0) : _0xeb4b12.subVectors(this.max, this.min);
  }
  ['expandByPoint'](_0x18d5ce) {
    return (this.min.min(_0x18d5ce), this.max.max(_0x18d5ce), this);
  }
  ['expandByVector'](_0x2c6d2c) {
    return (this.min.sub(_0x2c6d2c), this.max.add(_0x2c6d2c), this);
  }
  ['expandByScalar'](_0x4796f7) {
    return (this.min.addScalar(-_0x4796f7), this.max.addScalar(_0x4796f7), this);
  }
  ['containsPoint'](_0x342dcf) {
    return (
      _0x342dcf.x >= this.min.x &&
      _0x342dcf.x <= this.max.x &&
      _0x342dcf.y >= this.min.y &&
      _0x342dcf.y <= this.max.y
    );
  }
  ['containsBox'](_0xc3f834) {
    return (
      this.min.x <= _0xc3f834.min.x &&
      _0xc3f834.max.x <= this.max.x &&
      this.min.y <= _0xc3f834.min.y &&
      _0xc3f834.max.y <= this.max.y
    );
  }
  ['getParameter'](_0x3090f5, _0x7bc448) {
    return _0x7bc448.set(
      (_0x3090f5.x - this.min.x) / (this.max.x - this.min.x),
      (_0x3090f5.y - this.min.y) / (this.max.y - this.min.y),
    );
  }
  ['intersectsBox'](_0x1860b8) {
    return (
      _0x1860b8.max.x >= this.min.x &&
      _0x1860b8.min.x <= this.max.x &&
      _0x1860b8.max.y >= this.min.y &&
      _0x1860b8.min.y <= this.max.y
    );
  }
  ['clampPoint'](_0x4cc38c, _0x3a8a7e) {
    return _0x3a8a7e.copy(_0x4cc38c).clamp(this.min, this.max);
  }
  ['distanceToPoint'](_0x3916eb) {
    return this.clampPoint(_0x3916eb, _vector$4).distanceTo(_0x3916eb);
  }
  ['intersect'](_0x456f74) {
    (this.min.max(_0x456f74.min), this.max.min(_0x456f74.max));
    if (this.isEmpty()) this.makeEmpty();
    return this;
  }
  ['union'](_0x58dca8) {
    return (this.min.min(_0x58dca8.min), this.max.max(_0x58dca8.max), this);
  }
  ['translate'](_0x3ac07f) {
    return (this.min.add(_0x3ac07f), this.max.add(_0x3ac07f), this);
  }
  ['equals'](_0x383dd8) {
    return _0x383dd8.min.equals(this.min) && _0x383dd8.max.equals(this.max);
  }
}
const _startP = new Vector3(),
  _startEnd = new Vector3(),
  _d1 = new Vector3(),
  _d2 = new Vector3(),
  _r = new Vector3(),
  _c1 = new Vector3(),
  _c2 = new Vector3();
class Line3 {
  constructor(_0x5e4444 = new Vector3(), _0x4996d3 = new Vector3()) {
    ((this.start = _0x5e4444), (this.end = _0x4996d3));
  }
  ['set'](_0x116ecf, _0x56a83b) {
    return (this.start.copy(_0x116ecf), this.end.copy(_0x56a83b), this);
  }
  ['copy'](_0x198496) {
    return (this.start.copy(_0x198496.start), this.end.copy(_0x198496.end), this);
  }
  ['getCenter'](_0x4ef226) {
    return _0x4ef226.addVectors(this.start, this.end).multiplyScalar(0.5);
  }
  ['delta'](_0x186e20) {
    return _0x186e20.subVectors(this.end, this.start);
  }
  ['distanceSq']() {
    return this.start.distanceToSquared(this.end);
  }
  ['distance']() {
    return this.start.distanceTo(this.end);
  }
  ['at'](_0x355384, _0x54a8a6) {
    return this.delta(_0x54a8a6).multiplyScalar(_0x355384).add(this.start);
  }
  ['closestPointToPointParameter'](_0x58e0c5, _0x513904) {
    (_startP.subVectors(_0x58e0c5, this.start), _startEnd.subVectors(this.end, this.start));
    const _0x2a00ab = _startEnd.dot(_startEnd),
      _0x1c7600 = _startEnd.dot(_startP);
    let _0x158c10 = _0x1c7600 / _0x2a00ab;
    return (_0x513904 && (_0x158c10 = clamp(_0x158c10, 0, 1)), _0x158c10);
  }
  ['closestPointToPoint'](_0x1de854, _0x3d83a4, _0x2630b5) {
    const _0x39d4a3 = this.closestPointToPointParameter(_0x1de854, _0x3d83a4);
    return this.delta(_0x2630b5).multiplyScalar(_0x39d4a3).add(this.start);
  }
  ['distanceSqToLine3'](_0x382ef3, _0x4be0d9 = _c1, _0x54fbc1 = _c2) {
    const _0xb24bc5 = 1e-8 * 1e-8;
    let _0x26784c, _0x575410;
    const _0x10be5b = this.start,
      _0x3df52a = _0x382ef3.start,
      _0x5c5a22 = this.end,
      _0x3ce291 = _0x382ef3.end;
    (_d1.subVectors(_0x5c5a22, _0x10be5b),
      _d2.subVectors(_0x3ce291, _0x3df52a),
      _r.subVectors(_0x10be5b, _0x3df52a));
    const _0x3dda68 = _d1.dot(_d1),
      _0x548e = _d2.dot(_d2),
      _0x329b01 = _d2.dot(_r);
    if (_0x3dda68 <= _0xb24bc5 && _0x548e <= _0xb24bc5)
      return (
        _0x4be0d9.copy(_0x10be5b),
        _0x54fbc1.copy(_0x3df52a),
        _0x4be0d9.sub(_0x54fbc1),
        _0x4be0d9.dot(_0x4be0d9)
      );
    if (_0x3dda68 <= _0xb24bc5)
      ((_0x26784c = 0), (_0x575410 = _0x329b01 / _0x548e), (_0x575410 = clamp(_0x575410, 0, 1)));
    else {
      const _0x5d9620 = _d1.dot(_r);
      if (_0x548e <= _0xb24bc5) ((_0x575410 = 0), (_0x26784c = clamp(-_0x5d9620 / _0x3dda68, 0, 1)));
      else {
        const _0x37cbd2 = _d1.dot(_d2),
          _0x4778f8 = _0x3dda68 * _0x548e - _0x37cbd2 * _0x37cbd2;
        _0x4778f8 !== 0
          ? (_0x26784c = clamp((_0x37cbd2 * _0x329b01 - _0x5d9620 * _0x548e) / _0x4778f8, 0, 1))
          : (_0x26784c = 0);
        _0x575410 = (_0x37cbd2 * _0x26784c + _0x329b01) / _0x548e;
        if (_0x575410 < 0) ((_0x575410 = 0), (_0x26784c = clamp(-_0x5d9620 / _0x3dda68, 0, 1)));
        else
          _0x575410 > 1 && ((_0x575410 = 1), (_0x26784c = clamp((_0x37cbd2 - _0x5d9620) / _0x3dda68, 0, 1)));
      }
    }
    return (
      _0x4be0d9.copy(_0x10be5b).add(_d1.multiplyScalar(_0x26784c)),
      _0x54fbc1.copy(_0x3df52a).add(_d2.multiplyScalar(_0x575410)),
      _0x4be0d9.sub(_0x54fbc1),
      _0x4be0d9.dot(_0x4be0d9)
    );
  }
  ['applyMatrix4'](_0xc0b19b) {
    return (this.start.applyMatrix4(_0xc0b19b), this.end.applyMatrix4(_0xc0b19b), this);
  }
  ['equals'](_0x4bca97) {
    return _0x4bca97.start.equals(this.start) && _0x4bca97.end.equals(this.end);
  }
  ['clone']() {
    return new this['constructor']().copy(this);
  }
}
const _vector$3 = new Vector3();
class SpotLightHelper extends Object3D {
  constructor(_0x371e72, _0x5c1415) {
    (super(),
      (this.light = _0x371e72),
      (this.matrixAutoUpdate = false),
      (this.color = _0x5c1415),
      (this.type = 'SpotLightHelper'));
    const _0x74ee42 = new BufferGeometry(),
      _0x3ed447 = [
        0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, -1, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, -1, 1,
      ];
    for (let _0x5b4858 = 0, _0x1ef51f = 1, _0x3defe6 = 32; _0x5b4858 < _0x3defe6; _0x5b4858++, _0x1ef51f++) {
      const _0x2bcf47 = (_0x5b4858 / _0x3defe6) * Math.PI * 2,
        _0x28c6f6 = (_0x1ef51f / _0x3defe6) * Math.PI * 2;
      _0x3ed447.push(
        Math.cos(_0x2bcf47),
        Math.sin(_0x2bcf47),
        1,
        Math.cos(_0x28c6f6),
        Math.sin(_0x28c6f6),
        1,
      );
    }
    _0x74ee42.setAttribute('position', new Float32BufferAttribute(_0x3ed447, 3));
    const _0x222466 = new LineBasicMaterial({ fog: false, toneMapped: false });
    ((this.cone = new LineSegments(_0x74ee42, _0x222466)), this.add(this.cone), this.update());
  }
  ['dispose']() {
    (this.cone.geometry.dispose(), this.cone.material.dispose());
  }
  ['update']() {
    (this.light.updateWorldMatrix(true, false), this.light.target.updateWorldMatrix(true, false));
    this.parent
      ? (this.parent.updateWorldMatrix(true),
        this.matrix.copy(this.parent.matrixWorld).invert().multiply(this.light.matrixWorld))
      : this.matrix.copy(this.light.matrixWorld);
    this.matrixWorld.copy(this.light.matrixWorld);
    const _0x22f227 = this.light.distance ? this.light.distance : 0x3e8,
      _0x24a9c4 = _0x22f227 * Math.tan(this.light.angle);
    (this.cone.scale.set(_0x24a9c4, _0x24a9c4, _0x22f227),
      _vector$3.setFromMatrixPosition(this.light.target.matrixWorld),
      this.cone.lookAt(_vector$3),
      this.color !== undefined
        ? this.cone.material.color.set(this.color)
        : this.cone.material.color.copy(this.light.color));
  }
}
const _vector$2 = new Vector3(),
  _boneMatrix = new Matrix4(),
  _matrixWorldInv = new Matrix4();
class SkeletonHelper extends LineSegments {
  constructor(_0x339c63) {
    const _0x1cb28c = getBoneList(_0x339c63),
      _0x58047b = new BufferGeometry(),
      _0x49fdc9 = [],
      _0x17138b = [];
    for (let _0xa89b7a = 0; _0xa89b7a < _0x1cb28c.length; _0xa89b7a++) {
      const _0x3a8746 = _0x1cb28c[_0xa89b7a];
      _0x3a8746.parent &&
        _0x3a8746.parent.isBone &&
        (_0x49fdc9.push(0, 0, 0), _0x49fdc9.push(0, 0, 0), _0x17138b.push(0, 0, 0), _0x17138b.push(0, 0, 0));
    }
    (_0x58047b.setAttribute('position', new Float32BufferAttribute(_0x49fdc9, 3)),
      _0x58047b.setAttribute('color', new Float32BufferAttribute(_0x17138b, 3)));
    const _0x527644 = new LineBasicMaterial({
      vertexColors: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      transparent: true,
    });
    (super(_0x58047b, _0x527644),
      (this.isSkeletonHelper = true),
      (this.type = 'SkeletonHelper'),
      (this.root = _0x339c63),
      (this.bones = _0x1cb28c),
      (this.matrix = _0x339c63.matrixWorld),
      (this.matrixAutoUpdate = false));
    const _0x16446d = new Color(255),
      _0x535946 = new Color(0xff00);
    this.setColors(_0x16446d, _0x535946);
  }
  ['updateMatrixWorld'](_0x2524b8) {
    const _0x5d9471 = this.bones,
      _0x2badcc = this.geometry,
      _0x1b8106 = _0x2badcc.getAttribute('position');
    _matrixWorldInv.copy(this.root.matrixWorld).invert();
    for (let _0x12b144 = 0, _0x10674d = 0; _0x12b144 < _0x5d9471.length; _0x12b144++) {
      const _0x3c0459 = _0x5d9471[_0x12b144];
      _0x3c0459.parent &&
        _0x3c0459.parent.isBone &&
        (_boneMatrix.multiplyMatrices(_matrixWorldInv, _0x3c0459.matrixWorld),
        _vector$2.setFromMatrixPosition(_boneMatrix),
        _0x1b8106.setXYZ(_0x10674d, _vector$2.x, _vector$2.y, _vector$2.z),
        _boneMatrix.multiplyMatrices(_matrixWorldInv, _0x3c0459.parent.matrixWorld),
        _vector$2.setFromMatrixPosition(_boneMatrix),
        _0x1b8106.setXYZ(_0x10674d + 1, _vector$2.x, _vector$2.y, _vector$2.z),
        (_0x10674d += 2));
    }
    ((_0x2badcc.getAttribute('position').needsUpdate = true), super.updateMatrixWorld(_0x2524b8));
  }
  ['setColors'](_0x532656, _0x19d7bc) {
    const _0x1975d5 = this.geometry,
      _0x2bab54 = _0x1975d5.getAttribute('color');
    for (let _0x139012 = 0; _0x139012 < _0x2bab54.count; _0x139012 += 2) {
      (_0x2bab54.setXYZ(_0x139012, _0x532656.r, _0x532656.g, _0x532656.b),
        _0x2bab54.setXYZ(_0x139012 + 1, _0x19d7bc.r, _0x19d7bc.g, _0x19d7bc.b));
    }
    return ((_0x2bab54.needsUpdate = true), this);
  }
  ['dispose']() {
    (this.geometry.dispose(), this.material.dispose());
  }
}
function getBoneList(_0x52ed96) {
  const _0x55c8d = [];
  _0x52ed96.isBone === true && _0x55c8d.push(_0x52ed96);
  for (let _0x1cdb7b = 0; _0x1cdb7b < _0x52ed96.children.length; _0x1cdb7b++) {
    _0x55c8d.push(...getBoneList(_0x52ed96.children[_0x1cdb7b]));
  }
  return _0x55c8d;
}
class PointLightHelper extends Mesh {
  constructor(_0x8c80cb, _0x2afb49, _0x87eeff) {
    const _0x2c5d9d = new SphereGeometry(_0x2afb49, 4, 2),
      _0x67097 = new MeshBasicMaterial({ wireframe: true, fog: false, toneMapped: false });
    (super(_0x2c5d9d, _0x67097),
      (this.light = _0x8c80cb),
      (this.color = _0x87eeff),
      (this.type = 'PointLightHelper'),
      (this.matrix = this.light.matrixWorld),
      (this.matrixAutoUpdate = false),
      this.update());
  }
  ['dispose']() {
    (this.geometry.dispose(), this.material.dispose());
  }
  ['update']() {
    (this.light.updateWorldMatrix(true, false),
      this.color !== undefined
        ? this.material.color.set(this.color)
        : this.material.color.copy(this.light.color));
  }
}
const _vector$1 = new Vector3(),
  _color1 = new Color(),
  _color2 = new Color();
class HemisphereLightHelper extends Object3D {
  constructor(_0x5d78ef, _0x5cc956, _0x30a34a) {
    (super(),
      (this.light = _0x5d78ef),
      (this.matrix = _0x5d78ef.matrixWorld),
      (this.matrixAutoUpdate = false),
      (this.color = _0x30a34a),
      (this.type = 'HemisphereLightHelper'));
    const _0x407b4c = new OctahedronGeometry(_0x5cc956);
    (_0x407b4c.rotateY(Math.PI * 0.5),
      (this.material = new MeshBasicMaterial({ wireframe: true, fog: false, toneMapped: false })));
    if (this.color === undefined) this.material.vertexColors = true;
    const _0x4cac83 = _0x407b4c.getAttribute('position'),
      _0x11f5fc = new Float32Array(_0x4cac83.count * 3);
    (_0x407b4c.setAttribute('color', new BufferAttribute(_0x11f5fc, 3)),
      this.add(new Mesh(_0x407b4c, this.material)),
      this.update());
  }
  ['dispose']() {
    (this.children[0].geometry.dispose(), this.children[0].material.dispose());
  }
  ['update']() {
    const _0x43e3c2 = this.children[0];
    if (this.color !== undefined) this.material.color.set(this.color);
    else {
      const _0x57c371 = _0x43e3c2.geometry.getAttribute('color');
      (_color1.copy(this.light.color), _color2.copy(this.light.groundColor));
      for (let _0x3c43f2 = 0, _0x5b7793 = _0x57c371.count; _0x3c43f2 < _0x5b7793; _0x3c43f2++) {
        const _0x439f36 = _0x3c43f2 < _0x5b7793 / 2 ? _color1 : _color2;
        _0x57c371.setXYZ(_0x3c43f2, _0x439f36.r, _0x439f36.g, _0x439f36.b);
      }
      _0x57c371.needsUpdate = true;
    }
    (this.light.updateWorldMatrix(true, false),
      _0x43e3c2.lookAt(_vector$1.setFromMatrixPosition(this.light.matrixWorld).negate()));
  }
}
class GridHelper extends LineSegments {
  constructor(_0x5bf0b7 = 10, _0x5dee0c = 10, _0x4a1666 = 0x444444, _0x1b28f4 = 0x888888) {
    ((_0x4a1666 = new Color(_0x4a1666)), (_0x1b28f4 = new Color(_0x1b28f4)));
    const _0x5c7faf = _0x5dee0c / 2,
      _0x5deab6 = _0x5bf0b7 / _0x5dee0c,
      _0x400d4a = _0x5bf0b7 / 2,
      _0x2fa207 = [],
      _0x4a53c4 = [];
    for (
      let _0x4125a8 = 0, _0x2e17a9 = 0, _0x4a6bf0 = -_0x400d4a;
      _0x4125a8 <= _0x5dee0c;
      _0x4125a8++, _0x4a6bf0 += _0x5deab6
    ) {
      (_0x2fa207.push(-_0x400d4a, 0, _0x4a6bf0, _0x400d4a, 0, _0x4a6bf0),
        _0x2fa207.push(_0x4a6bf0, 0, -_0x400d4a, _0x4a6bf0, 0, _0x400d4a));
      const _0x218db7 = _0x4125a8 === _0x5c7faf ? _0x4a1666 : _0x1b28f4;
      (_0x218db7.toArray(_0x4a53c4, _0x2e17a9),
        (_0x2e17a9 += 3),
        _0x218db7.toArray(_0x4a53c4, _0x2e17a9),
        (_0x2e17a9 += 3),
        _0x218db7.toArray(_0x4a53c4, _0x2e17a9),
        (_0x2e17a9 += 3),
        _0x218db7.toArray(_0x4a53c4, _0x2e17a9),
        (_0x2e17a9 += 3));
    }
    const _0x8846bf = new BufferGeometry();
    (_0x8846bf.setAttribute('position', new Float32BufferAttribute(_0x2fa207, 3)),
      _0x8846bf.setAttribute('color', new Float32BufferAttribute(_0x4a53c4, 3)));
    const _0xb8878b = new LineBasicMaterial({ vertexColors: true, toneMapped: false });
    (super(_0x8846bf, _0xb8878b), (this.type = 'GridHelper'));
  }
  ['dispose']() {
    (this.geometry.dispose(), this.material.dispose());
  }
}
class PolarGridHelper extends LineSegments {
  constructor(
    _0xa32e78 = 10,
    _0x46fa53 = 16,
    _0x33faab = 8,
    _0x583c7c = 64,
    _0xeeef13 = 0x444444,
    _0x217f27 = 0x888888,
  ) {
    ((_0xeeef13 = new Color(_0xeeef13)), (_0x217f27 = new Color(_0x217f27)));
    const _0x4a454a = [],
      _0x465512 = [];
    if (_0x46fa53 > 1)
      for (let _0x4dd6a0 = 0; _0x4dd6a0 < _0x46fa53; _0x4dd6a0++) {
        const _0x57cb1a = (_0x4dd6a0 / _0x46fa53) * (Math.PI * 2),
          _0xee1913 = Math.sin(_0x57cb1a) * _0xa32e78,
          _0x4a24ad = Math.cos(_0x57cb1a) * _0xa32e78;
        (_0x4a454a.push(0, 0, 0), _0x4a454a.push(_0xee1913, 0, _0x4a24ad));
        const _0x2d9800 = _0x4dd6a0 & 1 ? _0xeeef13 : _0x217f27;
        (_0x465512.push(_0x2d9800.r, _0x2d9800.g, _0x2d9800.b),
          _0x465512.push(_0x2d9800.r, _0x2d9800.g, _0x2d9800.b));
      }
    for (let _0x37168e = 0; _0x37168e < _0x33faab; _0x37168e++) {
      const _0x39d269 = _0x37168e & 1 ? _0xeeef13 : _0x217f27,
        _0x1dc944 = _0xa32e78 - (_0xa32e78 / _0x33faab) * _0x37168e;
      for (let _0x48ace0 = 0; _0x48ace0 < _0x583c7c; _0x48ace0++) {
        let _0x159e39 = (_0x48ace0 / _0x583c7c) * (Math.PI * 2),
          _0x66b5b3 = Math.sin(_0x159e39) * _0x1dc944,
          _0x492830 = Math.cos(_0x159e39) * _0x1dc944;
        (_0x4a454a.push(_0x66b5b3, 0, _0x492830),
          _0x465512.push(_0x39d269.r, _0x39d269.g, _0x39d269.b),
          (_0x159e39 = ((_0x48ace0 + 1) / _0x583c7c) * (Math.PI * 2)),
          (_0x66b5b3 = Math.sin(_0x159e39) * _0x1dc944),
          (_0x492830 = Math.cos(_0x159e39) * _0x1dc944),
          _0x4a454a.push(_0x66b5b3, 0, _0x492830),
          _0x465512.push(_0x39d269.r, _0x39d269.g, _0x39d269.b));
      }
    }
    const _0x4ed752 = new BufferGeometry();
    (_0x4ed752.setAttribute('position', new Float32BufferAttribute(_0x4a454a, 3)),
      _0x4ed752.setAttribute('color', new Float32BufferAttribute(_0x465512, 3)));
    const _0x1922ea = new LineBasicMaterial({ vertexColors: true, toneMapped: false });
    (super(_0x4ed752, _0x1922ea), (this.type = 'PolarGridHelper'));
  }
  ['dispose']() {
    (this.geometry.dispose(), this.material.dispose());
  }
}
const _v1 = new Vector3(),
  _v2 = new Vector3(),
  _v3 = new Vector3();
class DirectionalLightHelper extends Object3D {
  constructor(_0x555780, _0x291ed9, _0x5a3f59) {
    (super(),
      (this.light = _0x555780),
      (this.matrix = _0x555780.matrixWorld),
      (this.matrixAutoUpdate = false),
      (this.color = _0x5a3f59),
      (this.type = 'DirectionalLightHelper'));
    if (_0x291ed9 === undefined) _0x291ed9 = 1;
    let _0x2ac120 = new BufferGeometry();
    _0x2ac120.setAttribute(
      'position',
      new Float32BufferAttribute(
        [
          -_0x291ed9,
          _0x291ed9,
          0,
          _0x291ed9,
          _0x291ed9,
          0,
          _0x291ed9,
          -_0x291ed9,
          0,
          -_0x291ed9,
          -_0x291ed9,
          0,
          -_0x291ed9,
          _0x291ed9,
          0,
        ],
        3,
      ),
    );
    const _0x2d5420 = new LineBasicMaterial({ fog: false, toneMapped: false });
    ((this.lightPlane = new Line(_0x2ac120, _0x2d5420)),
      this.add(this.lightPlane),
      (_0x2ac120 = new BufferGeometry()),
      _0x2ac120.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 0, 0, 1], 3)),
      (this.targetLine = new Line(_0x2ac120, _0x2d5420)),
      this.add(this.targetLine),
      this.update());
  }
  ['dispose']() {
    (this.lightPlane.geometry.dispose(),
      this.lightPlane.material.dispose(),
      this.targetLine.geometry.dispose(),
      this.targetLine.material.dispose());
  }
  ['update']() {
    (this.light.updateWorldMatrix(true, false),
      this.light.target.updateWorldMatrix(true, false),
      _v1.setFromMatrixPosition(this.light.matrixWorld),
      _v2.setFromMatrixPosition(this.light.target.matrixWorld),
      _v3.subVectors(_v2, _v1),
      this.lightPlane.lookAt(_v2),
      this.color !== undefined
        ? (this.lightPlane.material.color.set(this.color), this.targetLine.material.color.set(this.color))
        : (this.lightPlane.material.color.copy(this.light.color),
          this.targetLine.material.color.copy(this.light.color)),
      this.targetLine.lookAt(_v2),
      (this.targetLine.scale.z = _v3.length()));
  }
}
const _vector = new Vector3(),
  _camera = new Camera();
class CameraHelper extends LineSegments {
  constructor(_0x104f46) {
    const _0x262200 = new BufferGeometry(),
      _0x35853a = new LineBasicMaterial({ color: 0xffffff, vertexColors: true, toneMapped: false }),
      _0x3fc780 = [],
      _0x22fcb0 = [],
      _0x3f4460 = {};
    (_0x25864c('n1', 'n2'),
      _0x25864c('n2', 'n4'),
      _0x25864c('n4', 'n3'),
      _0x25864c('n3', 'n1'),
      _0x25864c('f1', 'f2'),
      _0x25864c('f2', 'f4'),
      _0x25864c('f4', 'f3'),
      _0x25864c('f3', 'f1'),
      _0x25864c('n1', 'f1'),
      _0x25864c('n2', 'f2'),
      _0x25864c('n3', 'f3'),
      _0x25864c('n4', 'f4'),
      _0x25864c('p', 'n1'),
      _0x25864c('p', 'n2'),
      _0x25864c('p', 'n3'),
      _0x25864c('p', 'n4'),
      _0x25864c('u1', 'u2'),
      _0x25864c('u2', 'u3'),
      _0x25864c('u3', 'u1'),
      _0x25864c('c', 't'),
      _0x25864c('p', 'c'),
      _0x25864c('cn1', 'cn2'),
      _0x25864c('cn3', 'cn4'),
      _0x25864c('cf1', 'cf2'),
      _0x25864c('cf3', 'cf4'));
    function _0x25864c(_0x360ac8, _0x5c3425) {
      (_0x534363(_0x360ac8), _0x534363(_0x5c3425));
    }
    function _0x534363(_0x211f31) {
      (_0x3fc780.push(0, 0, 0),
        _0x22fcb0.push(0, 0, 0),
        _0x3f4460[_0x211f31] === undefined && (_0x3f4460[_0x211f31] = []),
        _0x3f4460[_0x211f31].push(_0x3fc780.length / 3 - 1));
    }
    (_0x262200.setAttribute('position', new Float32BufferAttribute(_0x3fc780, 3)),
      _0x262200.setAttribute('color', new Float32BufferAttribute(_0x22fcb0, 3)),
      super(_0x262200, _0x35853a),
      (this.type = 'CameraHelper'),
      (this.camera = _0x104f46));
    if (this.camera.updateProjectionMatrix) this.camera.updateProjectionMatrix();
    ((this.matrix = _0x104f46.matrixWorld),
      (this.matrixAutoUpdate = false),
      (this.pointMap = _0x3f4460),
      this.update());
    const _0x36e293 = new Color(0xffaa00),
      _0x989900 = new Color(0xff0000),
      _0x37195d = new Color(0xaaff),
      _0x49f3db = new Color(0xffffff),
      _0x5ea8aa = new Color(0x333333);
    this.setColors(_0x36e293, _0x989900, _0x37195d, _0x49f3db, _0x5ea8aa);
  }
  ['setColors'](_0x2f2952, _0x42b49c, _0x514242, _0x9cdf95, _0x3252c7) {
    const _0x51f2dc = this.geometry,
      _0x4342a2 = _0x51f2dc.getAttribute('color');
    return (
      _0x4342a2.setXYZ(0, _0x2f2952.r, _0x2f2952.g, _0x2f2952.b),
      _0x4342a2.setXYZ(1, _0x2f2952.r, _0x2f2952.g, _0x2f2952.b),
      _0x4342a2.setXYZ(2, _0x2f2952.r, _0x2f2952.g, _0x2f2952.b),
      _0x4342a2.setXYZ(3, _0x2f2952.r, _0x2f2952.g, _0x2f2952.b),
      _0x4342a2.setXYZ(4, _0x2f2952.r, _0x2f2952.g, _0x2f2952.b),
      _0x4342a2.setXYZ(5, _0x2f2952.r, _0x2f2952.g, _0x2f2952.b),
      _0x4342a2.setXYZ(6, _0x2f2952.r, _0x2f2952.g, _0x2f2952.b),
      _0x4342a2.setXYZ(7, _0x2f2952.r, _0x2f2952.g, _0x2f2952.b),
      _0x4342a2.setXYZ(8, _0x2f2952.r, _0x2f2952.g, _0x2f2952.b),
      _0x4342a2.setXYZ(9, _0x2f2952.r, _0x2f2952.g, _0x2f2952.b),
      _0x4342a2.setXYZ(10, _0x2f2952.r, _0x2f2952.g, _0x2f2952.b),
      _0x4342a2.setXYZ(11, _0x2f2952.r, _0x2f2952.g, _0x2f2952.b),
      _0x4342a2.setXYZ(12, _0x2f2952.r, _0x2f2952.g, _0x2f2952.b),
      _0x4342a2.setXYZ(13, _0x2f2952.r, _0x2f2952.g, _0x2f2952.b),
      _0x4342a2.setXYZ(14, _0x2f2952.r, _0x2f2952.g, _0x2f2952.b),
      _0x4342a2.setXYZ(15, _0x2f2952.r, _0x2f2952.g, _0x2f2952.b),
      _0x4342a2.setXYZ(16, _0x2f2952.r, _0x2f2952.g, _0x2f2952.b),
      _0x4342a2.setXYZ(17, _0x2f2952.r, _0x2f2952.g, _0x2f2952.b),
      _0x4342a2.setXYZ(18, _0x2f2952.r, _0x2f2952.g, _0x2f2952.b),
      _0x4342a2.setXYZ(19, _0x2f2952.r, _0x2f2952.g, _0x2f2952.b),
      _0x4342a2.setXYZ(20, _0x2f2952.r, _0x2f2952.g, _0x2f2952.b),
      _0x4342a2.setXYZ(21, _0x2f2952.r, _0x2f2952.g, _0x2f2952.b),
      _0x4342a2.setXYZ(22, _0x2f2952.r, _0x2f2952.g, _0x2f2952.b),
      _0x4342a2.setXYZ(23, _0x2f2952.r, _0x2f2952.g, _0x2f2952.b),
      _0x4342a2.setXYZ(24, _0x42b49c.r, _0x42b49c.g, _0x42b49c.b),
      _0x4342a2.setXYZ(25, _0x42b49c.r, _0x42b49c.g, _0x42b49c.b),
      _0x4342a2.setXYZ(26, _0x42b49c.r, _0x42b49c.g, _0x42b49c.b),
      _0x4342a2.setXYZ(27, _0x42b49c.r, _0x42b49c.g, _0x42b49c.b),
      _0x4342a2.setXYZ(28, _0x42b49c.r, _0x42b49c.g, _0x42b49c.b),
      _0x4342a2.setXYZ(29, _0x42b49c.r, _0x42b49c.g, _0x42b49c.b),
      _0x4342a2.setXYZ(30, _0x42b49c.r, _0x42b49c.g, _0x42b49c.b),
      _0x4342a2.setXYZ(31, _0x42b49c.r, _0x42b49c.g, _0x42b49c.b),
      _0x4342a2.setXYZ(32, _0x514242.r, _0x514242.g, _0x514242.b),
      _0x4342a2.setXYZ(33, _0x514242.r, _0x514242.g, _0x514242.b),
      _0x4342a2.setXYZ(34, _0x514242.r, _0x514242.g, _0x514242.b),
      _0x4342a2.setXYZ(35, _0x514242.r, _0x514242.g, _0x514242.b),
      _0x4342a2.setXYZ(36, _0x514242.r, _0x514242.g, _0x514242.b),
      _0x4342a2.setXYZ(37, _0x514242.r, _0x514242.g, _0x514242.b),
      _0x4342a2.setXYZ(38, _0x9cdf95.r, _0x9cdf95.g, _0x9cdf95.b),
      _0x4342a2.setXYZ(39, _0x9cdf95.r, _0x9cdf95.g, _0x9cdf95.b),
      _0x4342a2.setXYZ(40, _0x3252c7.r, _0x3252c7.g, _0x3252c7.b),
      _0x4342a2.setXYZ(41, _0x3252c7.r, _0x3252c7.g, _0x3252c7.b),
      _0x4342a2.setXYZ(42, _0x3252c7.r, _0x3252c7.g, _0x3252c7.b),
      _0x4342a2.setXYZ(43, _0x3252c7.r, _0x3252c7.g, _0x3252c7.b),
      _0x4342a2.setXYZ(44, _0x3252c7.r, _0x3252c7.g, _0x3252c7.b),
      _0x4342a2.setXYZ(45, _0x3252c7.r, _0x3252c7.g, _0x3252c7.b),
      _0x4342a2.setXYZ(46, _0x3252c7.r, _0x3252c7.g, _0x3252c7.b),
      _0x4342a2.setXYZ(47, _0x3252c7.r, _0x3252c7.g, _0x3252c7.b),
      _0x4342a2.setXYZ(48, _0x3252c7.r, _0x3252c7.g, _0x3252c7.b),
      _0x4342a2.setXYZ(49, _0x3252c7.r, _0x3252c7.g, _0x3252c7.b),
      (_0x4342a2.needsUpdate = true),
      this
    );
  }
  ['update']() {
    const _0x19e942 = this.geometry,
      _0x3b7852 = this.pointMap,
      _0x3f5fe5 = 1,
      _0x5adce3 = 1;
    let _0x32f5d4, _0x51239e;
    _camera.projectionMatrixInverse.copy(this.camera.projectionMatrixInverse);
    if (this.camera.reversedDepth === true) ((_0x32f5d4 = 1), (_0x51239e = 0));
    else {
      if (this.camera.coordinateSystem === WebGLCoordinateSystem) ((_0x32f5d4 = -1), (_0x51239e = 1));
      else {
        if (this.camera.coordinateSystem === WebGPUCoordinateSystem) ((_0x32f5d4 = 0), (_0x51239e = 1));
        else
          throw new Error(
            'THREE.CameraHelper.update(): Invalid coordinate system: ' + this.camera.coordinateSystem,
          );
      }
    }
    (setPoint('c', _0x3b7852, _0x19e942, _camera, 0, 0, _0x32f5d4),
      setPoint('t', _0x3b7852, _0x19e942, _camera, 0, 0, _0x51239e),
      setPoint('n1', _0x3b7852, _0x19e942, _camera, -_0x3f5fe5, -_0x5adce3, _0x32f5d4),
      setPoint('n2', _0x3b7852, _0x19e942, _camera, _0x3f5fe5, -_0x5adce3, _0x32f5d4),
      setPoint('n3', _0x3b7852, _0x19e942, _camera, -_0x3f5fe5, _0x5adce3, _0x32f5d4),
      setPoint('n4', _0x3b7852, _0x19e942, _camera, _0x3f5fe5, _0x5adce3, _0x32f5d4),
      setPoint('f1', _0x3b7852, _0x19e942, _camera, -_0x3f5fe5, -_0x5adce3, _0x51239e),
      setPoint('f2', _0x3b7852, _0x19e942, _camera, _0x3f5fe5, -_0x5adce3, _0x51239e),
      setPoint('f3', _0x3b7852, _0x19e942, _camera, -_0x3f5fe5, _0x5adce3, _0x51239e),
      setPoint('f4', _0x3b7852, _0x19e942, _camera, _0x3f5fe5, _0x5adce3, _0x51239e),
      setPoint('u1', _0x3b7852, _0x19e942, _camera, _0x3f5fe5 * 0.7, _0x5adce3 * 1.1, _0x32f5d4),
      setPoint('u2', _0x3b7852, _0x19e942, _camera, -_0x3f5fe5 * 0.7, _0x5adce3 * 1.1, _0x32f5d4),
      setPoint('u3', _0x3b7852, _0x19e942, _camera, 0, _0x5adce3 * 2, _0x32f5d4),
      setPoint('cf1', _0x3b7852, _0x19e942, _camera, -_0x3f5fe5, 0, _0x51239e),
      setPoint('cf2', _0x3b7852, _0x19e942, _camera, _0x3f5fe5, 0, _0x51239e),
      setPoint('cf3', _0x3b7852, _0x19e942, _camera, 0, -_0x5adce3, _0x51239e),
      setPoint('cf4', _0x3b7852, _0x19e942, _camera, 0, _0x5adce3, _0x51239e),
      setPoint('cn1', _0x3b7852, _0x19e942, _camera, -_0x3f5fe5, 0, _0x32f5d4),
      setPoint('cn2', _0x3b7852, _0x19e942, _camera, _0x3f5fe5, 0, _0x32f5d4),
      setPoint('cn3', _0x3b7852, _0x19e942, _camera, 0, -_0x5adce3, _0x32f5d4),
      setPoint('cn4', _0x3b7852, _0x19e942, _camera, 0, _0x5adce3, _0x32f5d4),
      (_0x19e942.getAttribute('position').needsUpdate = true));
  }
  ['dispose']() {
    (this.geometry.dispose(), this.material.dispose());
  }
}
function setPoint(_0x44faad, _0x1cbf6d, _0x127c3c, _0x5c200f, _0x2bb038, _0x39051f, _0x175a57) {
  _vector.set(_0x2bb038, _0x39051f, _0x175a57).unproject(_0x5c200f);
  const _0x6b324e = _0x1cbf6d[_0x44faad];
  if (_0x6b324e !== undefined) {
    const _0x7d5e53 = _0x127c3c.getAttribute('position');
    for (let _0x5ef150 = 0, _0x1b7288 = _0x6b324e.length; _0x5ef150 < _0x1b7288; _0x5ef150++) {
      _0x7d5e53.setXYZ(_0x6b324e[_0x5ef150], _vector.x, _vector.y, _vector.z);
    }
  }
}
const _box = new Box3();
class BoxHelper extends LineSegments {
  constructor(_0x1c4c50, _0x23719f = 0xffff00) {
    const _0xb72597 = new Uint16Array([
        0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7,
      ]),
      _0x1cb20a = new Float32Array(8 * 3),
      _0x201140 = new BufferGeometry();
    (_0x201140.setIndex(new BufferAttribute(_0xb72597, 1)),
      _0x201140.setAttribute('position', new BufferAttribute(_0x1cb20a, 3)),
      super(_0x201140, new LineBasicMaterial({ color: _0x23719f, toneMapped: false })),
      (this.object = _0x1c4c50),
      (this.type = 'BoxHelper'),
      (this.matrixAutoUpdate = false),
      this.update());
  }
  ['update']() {
    this.object !== undefined && _box.setFromObject(this.object);
    if (_box.isEmpty()) return;
    const _0x3ff927 = _box.min,
      _0x5b8042 = _box.max,
      _0x211f03 = this.geometry.attributes.position,
      _0x1eb8bb = _0x211f03.array;
    ((_0x1eb8bb[0] = _0x5b8042.x),
      (_0x1eb8bb[1] = _0x5b8042.y),
      (_0x1eb8bb[2] = _0x5b8042.z),
      (_0x1eb8bb[3] = _0x3ff927.x),
      (_0x1eb8bb[4] = _0x5b8042.y),
      (_0x1eb8bb[5] = _0x5b8042.z),
      (_0x1eb8bb[6] = _0x3ff927.x),
      (_0x1eb8bb[7] = _0x3ff927.y),
      (_0x1eb8bb[8] = _0x5b8042.z),
      (_0x1eb8bb[9] = _0x5b8042.x),
      (_0x1eb8bb[10] = _0x3ff927.y),
      (_0x1eb8bb[11] = _0x5b8042.z),
      (_0x1eb8bb[12] = _0x5b8042.x),
      (_0x1eb8bb[13] = _0x5b8042.y),
      (_0x1eb8bb[14] = _0x3ff927.z),
      (_0x1eb8bb[15] = _0x3ff927.x),
      (_0x1eb8bb[16] = _0x5b8042.y),
      (_0x1eb8bb[17] = _0x3ff927.z),
      (_0x1eb8bb[18] = _0x3ff927.x),
      (_0x1eb8bb[19] = _0x3ff927.y),
      (_0x1eb8bb[20] = _0x3ff927.z),
      (_0x1eb8bb[21] = _0x5b8042.x),
      (_0x1eb8bb[22] = _0x3ff927.y),
      (_0x1eb8bb[23] = _0x3ff927.z),
      (_0x211f03.needsUpdate = true),
      this.geometry.computeBoundingSphere());
  }
  ['setFromObject'](_0x15c41b) {
    return ((this.object = _0x15c41b), this.update(), this);
  }
  ['copy'](_0xb4da5c, _0x1390a3) {
    return (super.copy(_0xb4da5c, _0x1390a3), (this.object = _0xb4da5c.object), this);
  }
  ['dispose']() {
    (this.geometry.dispose(), this.material.dispose());
  }
}
class Box3Helper extends LineSegments {
  constructor(_0x405afb, _0x503e01 = 0xffff00) {
    const _0x5ebc01 = new Uint16Array([
        0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7,
      ]),
      _0x502851 = [1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1],
      _0x1dd107 = new BufferGeometry();
    (_0x1dd107.setIndex(new BufferAttribute(_0x5ebc01, 1)),
      _0x1dd107.setAttribute('position', new Float32BufferAttribute(_0x502851, 3)),
      super(_0x1dd107, new LineBasicMaterial({ color: _0x503e01, toneMapped: false })),
      (this.box = _0x405afb),
      (this.type = 'Box3Helper'),
      this.geometry.computeBoundingSphere());
  }
  ['updateMatrixWorld'](_0x5b4fc0) {
    const _0x5bd7fd = this.box;
    if (_0x5bd7fd.isEmpty()) return;
    (_0x5bd7fd.getCenter(this.position),
      _0x5bd7fd.getSize(this.scale),
      this.scale.multiplyScalar(0.5),
      super.updateMatrixWorld(_0x5b4fc0));
  }
  ['dispose']() {
    (this.geometry.dispose(), this.material.dispose());
  }
}
class PlaneHelper extends Line {
  constructor(_0x84bf1a, _0x53a9df = 1, _0x430d0e = 0xffff00) {
    const _0xc993a3 = _0x430d0e,
      _0xed8657 = [1, -1, 0, -1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0, -1, -1, 0, 1, -1, 0, 1, 1, 0],
      _0x2a7282 = new BufferGeometry();
    (_0x2a7282.setAttribute('position', new Float32BufferAttribute(_0xed8657, 3)),
      _0x2a7282.computeBoundingSphere(),
      super(_0x2a7282, new LineBasicMaterial({ color: _0xc993a3, toneMapped: false })),
      (this.type = 'PlaneHelper'),
      (this.plane = _0x84bf1a),
      (this.size = _0x53a9df));
    const _0x1dc288 = [1, 1, 0, -1, 1, 0, -1, -1, 0, 1, 1, 0, -1, -1, 0, 1, -1, 0],
      _0x35a26e = new BufferGeometry();
    (_0x35a26e.setAttribute('position', new Float32BufferAttribute(_0x1dc288, 3)),
      _0x35a26e.computeBoundingSphere(),
      this.add(
        new Mesh(
          _0x35a26e,
          new MeshBasicMaterial({
            color: _0xc993a3,
            opacity: 0.2,
            transparent: true,
            depthWrite: false,
            toneMapped: false,
          }),
        ),
      ));
  }
  ['updateMatrixWorld'](_0x342d24) {
    (this.position.set(0, 0, 0),
      this.scale.set(0.5 * this.size, 0.5 * this.size, 1),
      this.lookAt(this.plane.normal),
      this.translateZ(-this.plane.constant),
      super.updateMatrixWorld(_0x342d24));
  }
  ['dispose']() {
    (this.geometry.dispose(),
      this.material.dispose(),
      this.children[0].geometry.dispose(),
      this.children[0].material.dispose());
  }
}
const _axis = new Vector3();
let _lineGeometry, _coneGeometry;
class ArrowHelper extends Object3D {
  constructor(
    _0x1e3cfe = new Vector3(0, 0, 1),
    _0x188e5e = new Vector3(0, 0, 0),
    _0x542e40 = 1,
    _0x5a8d86 = 0xffff00,
    _0x2aa8f6 = _0x542e40 * 0.2,
    _0x456d64 = _0x2aa8f6 * 0.2,
  ) {
    (super(),
      (this.type = 'ArrowHelper'),
      _lineGeometry === undefined &&
        ((_lineGeometry = new BufferGeometry()),
        _lineGeometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 0, 1, 0], 3)),
        (_coneGeometry = new ConeGeometry(0.5, 1, 5, 1)),
        _coneGeometry.translate(0, -0.5, 0)),
      this.position.copy(_0x188e5e),
      (this.line = new Line(_lineGeometry, new LineBasicMaterial({ color: _0x5a8d86, toneMapped: false }))),
      (this.line.matrixAutoUpdate = false),
      this.add(this.line),
      (this.cone = new Mesh(_coneGeometry, new MeshBasicMaterial({ color: _0x5a8d86, toneMapped: false }))),
      (this.cone.matrixAutoUpdate = false),
      this.add(this.cone),
      this.setDirection(_0x1e3cfe),
      this.setLength(_0x542e40, _0x2aa8f6, _0x456d64));
  }
  ['setDirection'](_0xb388fc) {
    if (_0xb388fc.y > 0.99999) this.quaternion.set(0, 0, 0, 1);
    else {
      if (_0xb388fc.y < -0.99999) this.quaternion.set(1, 0, 0, 0);
      else {
        _axis.set(_0xb388fc.z, 0, -_0xb388fc.x).normalize();
        const _0x226f42 = Math.acos(_0xb388fc.y);
        this.quaternion.setFromAxisAngle(_axis, _0x226f42);
      }
    }
  }
  ['setLength'](_0x149223, _0x127857 = _0x149223 * 0.2, _0x1af219 = _0x127857 * 0.2) {
    (this.line.scale.set(1, Math.max(0.0001, _0x149223 - _0x127857), 1),
      this.line.updateMatrix(),
      this.cone.scale.set(_0x1af219, _0x127857, _0x1af219),
      (this.cone.position.y = _0x149223),
      this.cone.updateMatrix());
  }
  ['setColor'](_0x4e6832) {
    (this.line.material.color.set(_0x4e6832), this.cone.material.color.set(_0x4e6832));
  }
  ['copy'](_0x13a23c) {
    return (
      super.copy(_0x13a23c, false),
      this.line.copy(_0x13a23c.line),
      this.cone.copy(_0x13a23c.cone),
      this
    );
  }
  ['dispose']() {
    (this.line.geometry.dispose(),
      this.line.material.dispose(),
      this.cone.geometry.dispose(),
      this.cone.material.dispose());
  }
}
class AxesHelper extends LineSegments {
  constructor(_0x5be2cc = 1) {
    const _0x8c30b0 = [0, 0, 0, _0x5be2cc, 0, 0, 0, 0, 0, 0, _0x5be2cc, 0, 0, 0, 0, 0, 0, _0x5be2cc],
      _0x398e46 = [1, 0, 0, 1, 0.6, 0, 0, 1, 0, 0.6, 1, 0, 0, 0, 1, 0, 0.6, 1],
      _0x548584 = new BufferGeometry();
    (_0x548584.setAttribute('position', new Float32BufferAttribute(_0x8c30b0, 3)),
      _0x548584.setAttribute('color', new Float32BufferAttribute(_0x398e46, 3)));
    const _0x2b243e = new LineBasicMaterial({ vertexColors: true, toneMapped: false });
    (super(_0x548584, _0x2b243e), (this.type = 'AxesHelper'));
  }
  ['setColors'](_0xdb058e, _0x5b13aa, _0x5820f2) {
    const _0x2563a9 = new Color(),
      _0x3cc274 = this.geometry.attributes.color.array;
    return (
      _0x2563a9.set(_0xdb058e),
      _0x2563a9.toArray(_0x3cc274, 0),
      _0x2563a9.toArray(_0x3cc274, 3),
      _0x2563a9.set(_0x5b13aa),
      _0x2563a9.toArray(_0x3cc274, 6),
      _0x2563a9.toArray(_0x3cc274, 9),
      _0x2563a9.set(_0x5820f2),
      _0x2563a9.toArray(_0x3cc274, 12),
      _0x2563a9.toArray(_0x3cc274, 15),
      (this.geometry.attributes.color.needsUpdate = true),
      this
    );
  }
  ['dispose']() {
    (this.geometry.dispose(), this.material.dispose());
  }
}
class ShapePath {
  constructor() {
    ((this.type = 'ShapePath'), (this.color = new Color()), (this.subPaths = []), (this.currentPath = null));
  }
  ['moveTo'](_0x2e22ed, _0x551f86) {
    return (
      (this.currentPath = new Path()),
      this.subPaths.push(this.currentPath),
      this.currentPath.moveTo(_0x2e22ed, _0x551f86),
      this
    );
  }
  ['lineTo'](_0x3bd597, _0x50a27e) {
    return (this.currentPath.lineTo(_0x3bd597, _0x50a27e), this);
  }
  ['quadraticCurveTo'](_0x4de5a1, _0x3dcc74, _0x50b637, _0x103e38) {
    return (this.currentPath.quadraticCurveTo(_0x4de5a1, _0x3dcc74, _0x50b637, _0x103e38), this);
  }
  ['bezierCurveTo'](_0x2fe69f, _0x4a2375, _0x5aff93, _0xf62d48, _0x419703, _0x212530) {
    return (
      this.currentPath.bezierCurveTo(_0x2fe69f, _0x4a2375, _0x5aff93, _0xf62d48, _0x419703, _0x212530),
      this
    );
  }
  ['splineThru'](_0x4f7928) {
    return (this.currentPath.splineThru(_0x4f7928), this);
  }
  ['toShapes'](_0x839eac) {
    function _0x86f964(_0x568dce) {
      const _0x4b2029 = [];
      for (let _0x232ec1 = 0, _0x1fcc82 = _0x568dce.length; _0x232ec1 < _0x1fcc82; _0x232ec1++) {
        const _0x52af9b = _0x568dce[_0x232ec1],
          _0x1eff64 = new Shape();
        ((_0x1eff64.curves = _0x52af9b.curves), _0x4b2029.push(_0x1eff64));
      }
      return _0x4b2029;
    }
    function _0xb2b9df(_0x2abc01, _0x223fe6) {
      const _0x20b512 = _0x223fe6.length;
      let _0x204ed3 = false;
      for (let _0x5666e2 = _0x20b512 - 1, _0x28ff08 = 0; _0x28ff08 < _0x20b512; _0x5666e2 = _0x28ff08++) {
        let _0xa90764 = _0x223fe6[_0x5666e2],
          _0x35e674 = _0x223fe6[_0x28ff08],
          _0x43513e = _0x35e674.x - _0xa90764.x,
          _0x35201d = _0x35e674.y - _0xa90764.y;
        if (Math.abs(_0x35201d) > Number.EPSILON) {
          _0x35201d < 0 &&
            ((_0xa90764 = _0x223fe6[_0x28ff08]),
            (_0x43513e = -_0x43513e),
            (_0x35e674 = _0x223fe6[_0x5666e2]),
            (_0x35201d = -_0x35201d));
          if (_0x2abc01.y < _0xa90764.y || _0x2abc01.y > _0x35e674.y) continue;
          if (_0x2abc01.y === _0xa90764.y) {
            if (_0x2abc01.x === _0xa90764.x) return true;
          } else {
            const _0x3fc895 =
              _0x35201d * (_0x2abc01.x - _0xa90764.x) - _0x43513e * (_0x2abc01.y - _0xa90764.y);
            if (_0x3fc895 === 0) return true;
            if (_0x3fc895 < 0) continue;
            _0x204ed3 = !_0x204ed3;
          }
        } else {
          if (_0x2abc01.y !== _0xa90764.y) continue;
          if (
            (_0x35e674.x <= _0x2abc01.x && _0x2abc01.x <= _0xa90764.x) ||
            (_0xa90764.x <= _0x2abc01.x && _0x2abc01.x <= _0x35e674.x)
          )
            return true;
        }
      }
      return _0x204ed3;
    }
    const _0x529986 = ShapeUtils.isClockWise,
      _0x367c9e = this.subPaths;
    if (_0x367c9e.length === 0) return [];
    let _0x1ffabe, _0x558ad3, _0x23dedb;
    const _0x3bc774 = [];
    if (_0x367c9e.length === 1)
      return (
        (_0x558ad3 = _0x367c9e[0]),
        (_0x23dedb = new Shape()),
        (_0x23dedb.curves = _0x558ad3.curves),
        _0x3bc774.push(_0x23dedb),
        _0x3bc774
      );
    let _0x22d45d = !_0x529986(_0x367c9e[0].getPoints());
    _0x22d45d = _0x839eac ? !_0x22d45d : _0x22d45d;
    const _0x3482d5 = [],
      _0xd8dc18 = [];
    let _0x274b98 = [],
      _0x45c198 = 0,
      _0x23d1ca;
    ((_0xd8dc18[_0x45c198] = undefined), (_0x274b98[_0x45c198] = []));
    for (let _0x3ef007 = 0, _0x4ade3c = _0x367c9e.length; _0x3ef007 < _0x4ade3c; _0x3ef007++) {
      ((_0x558ad3 = _0x367c9e[_0x3ef007]),
        (_0x23d1ca = _0x558ad3.getPoints()),
        (_0x1ffabe = _0x529986(_0x23d1ca)),
        (_0x1ffabe = _0x839eac ? !_0x1ffabe : _0x1ffabe));
      if (_0x1ffabe) {
        if (!_0x22d45d && _0xd8dc18[_0x45c198]) _0x45c198++;
        ((_0xd8dc18[_0x45c198] = { s: new Shape(), p: _0x23d1ca }),
          (_0xd8dc18[_0x45c198].s.curves = _0x558ad3.curves));
        if (_0x22d45d) _0x45c198++;
        _0x274b98[_0x45c198] = [];
      } else _0x274b98[_0x45c198].push({ h: _0x558ad3, p: _0x23d1ca[0] });
    }
    if (!_0xd8dc18[0]) return _0x86f964(_0x367c9e);
    if (_0xd8dc18.length > 1) {
      let _0x179a7c = false,
        _0x4264a3 = 0;
      for (let _0x237510 = 0, _0x48f21b = _0xd8dc18.length; _0x237510 < _0x48f21b; _0x237510++) {
        _0x3482d5[_0x237510] = [];
      }
      for (let _0x459d0e = 0, _0x4c3a02 = _0xd8dc18.length; _0x459d0e < _0x4c3a02; _0x459d0e++) {
        const _0x3969eb = _0x274b98[_0x459d0e];
        for (let _0x42df86 = 0; _0x42df86 < _0x3969eb.length; _0x42df86++) {
          const _0x321212 = _0x3969eb[_0x42df86];
          let _0x431b5d = true;
          for (let _0x551eb9 = 0; _0x551eb9 < _0xd8dc18.length; _0x551eb9++) {
            if (_0xb2b9df(_0x321212.p, _0xd8dc18[_0x551eb9].p)) {
              if (_0x459d0e !== _0x551eb9) _0x4264a3++;
              _0x431b5d ? ((_0x431b5d = false), _0x3482d5[_0x551eb9].push(_0x321212)) : (_0x179a7c = true);
            }
          }
          _0x431b5d && _0x3482d5[_0x459d0e].push(_0x321212);
        }
      }
      _0x4264a3 > 0 && _0x179a7c === false && (_0x274b98 = _0x3482d5);
    }
    let _0x43e421;
    for (let _0x47bed7 = 0, _0x23a513 = _0xd8dc18.length; _0x47bed7 < _0x23a513; _0x47bed7++) {
      ((_0x23dedb = _0xd8dc18[_0x47bed7].s), _0x3bc774.push(_0x23dedb), (_0x43e421 = _0x274b98[_0x47bed7]));
      for (let _0x3a4ad0 = 0, _0xef3c16 = _0x43e421.length; _0x3a4ad0 < _0xef3c16; _0x3a4ad0++) {
        _0x23dedb.holes.push(_0x43e421[_0x3a4ad0].h);
      }
    }
    return _0x3bc774;
  }
}
class Controls extends EventDispatcher {
  constructor(_0x3ddabf, _0x6a13c6 = null) {
    (super(),
      (this.object = _0x3ddabf),
      (this.domElement = _0x6a13c6),
      (this.enabled = true),
      (this.state = -1),
      (this.keys = {}),
      (this.mouseButtons = { LEFT: null, MIDDLE: null, RIGHT: null }),
      (this.touches = { ONE: null, TWO: null }));
  }
  ['connect'](_0x7d8165) {
    if (_0x7d8165 === undefined) {
      console.warn('THREE.Controls: connect() now requires an element.');
      return;
    }
    if (this.domElement !== null) this.disconnect();
    this.domElement = _0x7d8165;
  }
  ['disconnect']() {}
  ['dispose']() {}
  ['update']() {}
}
function contain(_0x15eb0a, _0x2eb017) {
  const _0x2e06a8 =
    _0x15eb0a.image && _0x15eb0a.image.width ? _0x15eb0a.image.width / _0x15eb0a.image.height : 1;
  return (
    _0x2e06a8 > _0x2eb017
      ? ((_0x15eb0a.repeat.x = 1),
        (_0x15eb0a.repeat.y = _0x2e06a8 / _0x2eb017),
        (_0x15eb0a.offset.x = 0),
        (_0x15eb0a.offset.y = (1 - _0x15eb0a.repeat.y) / 2))
      : ((_0x15eb0a.repeat.x = _0x2eb017 / _0x2e06a8),
        (_0x15eb0a.repeat.y = 1),
        (_0x15eb0a.offset.x = (1 - _0x15eb0a.repeat.x) / 2),
        (_0x15eb0a.offset.y = 0)),
    _0x15eb0a
  );
}
function cover(_0x41924c, _0x4687bc) {
  const _0x16d303 =
    _0x41924c.image && _0x41924c.image.width ? _0x41924c.image.width / _0x41924c.image.height : 1;
  return (
    _0x16d303 > _0x4687bc
      ? ((_0x41924c.repeat.x = _0x4687bc / _0x16d303),
        (_0x41924c.repeat.y = 1),
        (_0x41924c.offset.x = (1 - _0x41924c.repeat.x) / 2),
        (_0x41924c.offset.y = 0))
      : ((_0x41924c.repeat.x = 1),
        (_0x41924c.repeat.y = _0x16d303 / _0x4687bc),
        (_0x41924c.offset.x = 0),
        (_0x41924c.offset.y = (1 - _0x41924c.repeat.y) / 2)),
    _0x41924c
  );
}
function fill(_0x50ec77) {
  return (
    (_0x50ec77.repeat.x = 1),
    (_0x50ec77.repeat.y = 1),
    (_0x50ec77.offset.x = 0),
    (_0x50ec77.offset.y = 0),
    _0x50ec77
  );
}
function getByteLength(_0x4b6af1, _0x5cea84, _0x454eaf, _0x5986f4) {
  const _0x104feb = getTextureTypeByteLength(_0x5986f4);
  switch (_0x454eaf) {
    case AlphaFormat:
      return _0x4b6af1 * _0x5cea84;
    case RedFormat:
      return ((_0x4b6af1 * _0x5cea84) / _0x104feb.components) * _0x104feb.byteLength;
    case RedIntegerFormat:
      return ((_0x4b6af1 * _0x5cea84) / _0x104feb.components) * _0x104feb.byteLength;
    case RGFormat:
      return ((_0x4b6af1 * _0x5cea84 * 2) / _0x104feb.components) * _0x104feb.byteLength;
    case RGIntegerFormat:
      return ((_0x4b6af1 * _0x5cea84 * 2) / _0x104feb.components) * _0x104feb.byteLength;
    case RGBFormat:
      return ((_0x4b6af1 * _0x5cea84 * 3) / _0x104feb.components) * _0x104feb.byteLength;
    case RGBAFormat:
      return ((_0x4b6af1 * _0x5cea84 * 4) / _0x104feb.components) * _0x104feb.byteLength;
    case RGBAIntegerFormat:
      return ((_0x4b6af1 * _0x5cea84 * 4) / _0x104feb.components) * _0x104feb.byteLength;
    case RGB_S3TC_DXT1_Format:
    case RGBA_S3TC_DXT1_Format:
      return Math.floor((_0x4b6af1 + 3) / 4) * Math.floor((_0x5cea84 + 3) / 4) * 8;
    case RGBA_S3TC_DXT3_Format:
    case RGBA_S3TC_DXT5_Format:
      return Math.floor((_0x4b6af1 + 3) / 4) * Math.floor((_0x5cea84 + 3) / 4) * 16;
    case RGB_PVRTC_2BPPV1_Format:
    case RGBA_PVRTC_2BPPV1_Format:
      return (Math.max(_0x4b6af1, 16) * Math.max(_0x5cea84, 8)) / 4;
    case RGB_PVRTC_4BPPV1_Format:
    case RGBA_PVRTC_4BPPV1_Format:
      return (Math.max(_0x4b6af1, 8) * Math.max(_0x5cea84, 8)) / 2;
    case RGB_ETC1_Format:
    case RGB_ETC2_Format:
      return Math.floor((_0x4b6af1 + 3) / 4) * Math.floor((_0x5cea84 + 3) / 4) * 8;
    case RGBA_ETC2_EAC_Format:
      return Math.floor((_0x4b6af1 + 3) / 4) * Math.floor((_0x5cea84 + 3) / 4) * 16;
    case RGBA_ASTC_4x4_Format:
      return Math.floor((_0x4b6af1 + 3) / 4) * Math.floor((_0x5cea84 + 3) / 4) * 16;
    case RGBA_ASTC_5x4_Format:
      return Math.floor((_0x4b6af1 + 4) / 5) * Math.floor((_0x5cea84 + 3) / 4) * 16;
    case RGBA_ASTC_5x5_Format:
      return Math.floor((_0x4b6af1 + 4) / 5) * Math.floor((_0x5cea84 + 4) / 5) * 16;
    case RGBA_ASTC_6x5_Format:
      return Math.floor((_0x4b6af1 + 5) / 6) * Math.floor((_0x5cea84 + 4) / 5) * 16;
    case RGBA_ASTC_6x6_Format:
      return Math.floor((_0x4b6af1 + 5) / 6) * Math.floor((_0x5cea84 + 5) / 6) * 16;
    case RGBA_ASTC_8x5_Format:
      return Math.floor((_0x4b6af1 + 7) / 8) * Math.floor((_0x5cea84 + 4) / 5) * 16;
    case RGBA_ASTC_8x6_Format:
      return Math.floor((_0x4b6af1 + 7) / 8) * Math.floor((_0x5cea84 + 5) / 6) * 16;
    case RGBA_ASTC_8x8_Format:
      return Math.floor((_0x4b6af1 + 7) / 8) * Math.floor((_0x5cea84 + 7) / 8) * 16;
    case RGBA_ASTC_10x5_Format:
      return Math.floor((_0x4b6af1 + 9) / 10) * Math.floor((_0x5cea84 + 4) / 5) * 16;
    case RGBA_ASTC_10x6_Format:
      return Math.floor((_0x4b6af1 + 9) / 10) * Math.floor((_0x5cea84 + 5) / 6) * 16;
    case RGBA_ASTC_10x8_Format:
      return Math.floor((_0x4b6af1 + 9) / 10) * Math.floor((_0x5cea84 + 7) / 8) * 16;
    case RGBA_ASTC_10x10_Format:
      return Math.floor((_0x4b6af1 + 9) / 10) * Math.floor((_0x5cea84 + 9) / 10) * 16;
    case RGBA_ASTC_12x10_Format:
      return Math.floor((_0x4b6af1 + 11) / 12) * Math.floor((_0x5cea84 + 9) / 10) * 16;
    case RGBA_ASTC_12x12_Format:
      return Math.floor((_0x4b6af1 + 11) / 12) * Math.floor((_0x5cea84 + 11) / 12) * 16;
    case RGBA_BPTC_Format:
    case RGB_BPTC_SIGNED_Format:
    case RGB_BPTC_UNSIGNED_Format:
      return Math.ceil(_0x4b6af1 / 4) * Math.ceil(_0x5cea84 / 4) * 16;
    case RED_RGTC1_Format:
    case SIGNED_RED_RGTC1_Format:
      return Math.ceil(_0x4b6af1 / 4) * Math.ceil(_0x5cea84 / 4) * 8;
    case RED_GREEN_RGTC2_Format:
    case SIGNED_RED_GREEN_RGTC2_Format:
      return Math.ceil(_0x4b6af1 / 4) * Math.ceil(_0x5cea84 / 4) * 16;
  }
  throw new Error('Unable to determine texture byte length for ' + _0x454eaf + ' format.');
}
function getTextureTypeByteLength(_0x448c34) {
  switch (_0x448c34) {
    case UnsignedByteType:
    case ByteType:
      return { byteLength: 1, components: 1 };
    case UnsignedShortType:
    case ShortType:
    case HalfFloatType:
      return { byteLength: 2, components: 1 };
    case UnsignedShort4444Type:
    case UnsignedShort5551Type:
      return { byteLength: 2, components: 4 };
    case UnsignedIntType:
    case IntType:
    case FloatType:
      return { byteLength: 4, components: 1 };
    case UnsignedInt5999Type:
    case UnsignedInt101111Type:
      return { byteLength: 4, components: 3 };
  }
  throw new Error('Unknown texture type ' + _0x448c34 + '.');
}
class TextureUtils {
  static ['contain'](_0x58648a, _0xb71404) {
    return contain(_0x58648a, _0xb71404);
  }
  static ['cover'](_0x37fd33, _0x2b6077) {
    return cover(_0x37fd33, _0x2b6077);
  }
  static ['fill'](_0x54a9ec) {
    return fill(_0x54a9ec);
  }
  static ['getByteLength'](_0x220f13, _0x5b64e1, _0x225117, _0x4b75ec) {
    return getByteLength(_0x220f13, _0x5b64e1, _0x225117, _0x4b75ec);
  }
}
typeof __THREE_DEVTOOLS__ !== 'undefined' &&
  __THREE_DEVTOOLS__.dispatchEvent(new CustomEvent('register', { detail: { revision: REVISION } }));
typeof window !== 'undefined' &&
  (window.__THREE__
    ? console.warn('WARNING: Multiple instances of Three.js being imported.')
    : (window.__THREE__ = REVISION));
export {
  ACESFilmicToneMapping,
  AddEquation,
  AddOperation,
  AdditiveAnimationBlendMode,
  AdditiveBlending,
  AgXToneMapping,
  AlphaFormat,
  AlwaysCompare,
  AlwaysDepth,
  AlwaysStencilFunc,
  AmbientLight,
  AnimationAction,
  AnimationClip,
  AnimationLoader,
  AnimationMixer,
  AnimationObjectGroup,
  AnimationUtils,
  ArcCurve,
  ArrayCamera,
  ArrowHelper,
  AttachedBindMode,
  Audio,
  AudioAnalyser,
  AudioContext,
  AudioListener,
  AudioLoader,
  AxesHelper,
  BackSide,
  BasicDepthPacking,
  BasicShadowMap,
  BatchedMesh,
  Bone,
  BooleanKeyframeTrack,
  Box2,
  Box3,
  Box3Helper,
  BoxGeometry,
  BoxHelper,
  BufferAttribute,
  BufferGeometry,
  BufferGeometryLoader,
  ByteType,
  Cache,
  Camera,
  CameraHelper,
  CanvasTexture,
  CapsuleGeometry,
  CatmullRomCurve3,
  CineonToneMapping,
  CircleGeometry,
  ClampToEdgeWrapping,
  Clock,
  Color,
  ColorKeyframeTrack,
  ColorManagement,
  CompressedArrayTexture,
  CompressedCubeTexture,
  CompressedTexture,
  CompressedTextureLoader,
  ConeGeometry,
  ConstantAlphaFactor,
  ConstantColorFactor,
  Controls,
  CubeCamera,
  CubeReflectionMapping,
  CubeRefractionMapping,
  CubeTexture,
  CubeTextureLoader,
  CubeUVReflectionMapping,
  CubicBezierCurve,
  CubicBezierCurve3,
  CubicInterpolant,
  CullFaceBack,
  CullFaceFront,
  CullFaceFrontBack,
  CullFaceNone,
  Curve,
  CurvePath,
  CustomBlending,
  CustomToneMapping,
  CylinderGeometry,
  Cylindrical,
  Data3DTexture,
  DataArrayTexture,
  DataTexture,
  DataTextureLoader,
  DataUtils,
  DecrementStencilOp,
  DecrementWrapStencilOp,
  DefaultLoadingManager,
  DepthFormat,
  DepthStencilFormat,
  DepthTexture,
  DetachedBindMode,
  DirectionalLight,
  DirectionalLightHelper,
  DiscreteInterpolant,
  DodecahedronGeometry,
  DoubleSide,
  DstAlphaFactor,
  DstColorFactor,
  DynamicCopyUsage,
  DynamicDrawUsage,
  DynamicReadUsage,
  EdgesGeometry,
  EllipseCurve,
  EqualCompare,
  EqualDepth,
  EqualStencilFunc,
  EquirectangularReflectionMapping,
  EquirectangularRefractionMapping,
  Euler,
  EventDispatcher,
  ExternalTexture,
  ExtrudeGeometry,
  FileLoader,
  Float16BufferAttribute,
  Float32BufferAttribute,
  FloatType,
  Fog,
  FogExp2,
  FramebufferTexture,
  FrontSide,
  Frustum,
  FrustumArray,
  GLBufferAttribute,
  GLSL1,
  GLSL3,
  GreaterCompare,
  GreaterDepth,
  GreaterEqualCompare,
  GreaterEqualDepth,
  GreaterEqualStencilFunc,
  GreaterStencilFunc,
  GridHelper,
  Group,
  HalfFloatType,
  HemisphereLight,
  HemisphereLightHelper,
  IcosahedronGeometry,
  ImageBitmapLoader,
  ImageLoader,
  ImageUtils,
  IncrementStencilOp,
  IncrementWrapStencilOp,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  InstancedInterleavedBuffer,
  InstancedMesh,
  Int16BufferAttribute,
  Int32BufferAttribute,
  Int8BufferAttribute,
  IntType,
  InterleavedBuffer,
  InterleavedBufferAttribute,
  Interpolant,
  InterpolateDiscrete,
  InterpolateLinear,
  InterpolateSmooth,
  InterpolationSamplingMode,
  InterpolationSamplingType,
  InvertStencilOp,
  KeepStencilOp,
  KeyframeTrack,
  LOD,
  LatheGeometry,
  Layers,
  LessCompare,
  LessDepth,
  LessEqualCompare,
  LessEqualDepth,
  LessEqualStencilFunc,
  LessStencilFunc,
  Light,
  LightProbe,
  Line,
  Line3,
  LineBasicMaterial,
  LineCurve,
  LineCurve3,
  LineDashedMaterial,
  LineLoop,
  LineSegments,
  LinearFilter,
  LinearInterpolant,
  LinearMipMapLinearFilter,
  LinearMipMapNearestFilter,
  LinearMipmapLinearFilter,
  LinearMipmapNearestFilter,
  LinearSRGBColorSpace,
  LinearToneMapping,
  LinearTransfer,
  Loader,
  LoaderUtils,
  LoadingManager,
  LoopOnce,
  LoopPingPong,
  LoopRepeat,
  MOUSE,
  Material,
  MaterialLoader,
  MathUtils,
  Matrix2,
  Matrix3,
  Matrix4,
  MaxEquation,
  Mesh,
  MeshBasicMaterial,
  MeshDepthMaterial,
  MeshDistanceMaterial,
  MeshLambertMaterial,
  MeshMatcapMaterial,
  MeshNormalMaterial,
  MeshPhongMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  MeshToonMaterial,
  MinEquation,
  MirroredRepeatWrapping,
  MixOperation,
  MultiplyBlending,
  MultiplyOperation,
  NearestFilter,
  NearestMipMapLinearFilter,
  NearestMipMapNearestFilter,
  NearestMipmapLinearFilter,
  NearestMipmapNearestFilter,
  NeutralToneMapping,
  NeverCompare,
  NeverDepth,
  NeverStencilFunc,
  NoBlending,
  NoColorSpace,
  NoToneMapping,
  NormalAnimationBlendMode,
  NormalBlending,
  NotEqualCompare,
  NotEqualDepth,
  NotEqualStencilFunc,
  NumberKeyframeTrack,
  Object3D,
  ObjectLoader,
  ObjectSpaceNormalMap,
  OctahedronGeometry,
  OneFactor,
  OneMinusConstantAlphaFactor,
  OneMinusConstantColorFactor,
  OneMinusDstAlphaFactor,
  OneMinusDstColorFactor,
  OneMinusSrcAlphaFactor,
  OneMinusSrcColorFactor,
  OrthographicCamera,
  PCFShadowMap,
  PCFSoftShadowMap,
  Path,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  PlaneHelper,
  PointLight,
  PointLightHelper,
  Points,
  PointsMaterial,
  PolarGridHelper,
  PolyhedronGeometry,
  PositionalAudio,
  PropertyBinding,
  PropertyMixer,
  QuadraticBezierCurve,
  QuadraticBezierCurve3,
  Quaternion,
  QuaternionKeyframeTrack,
  QuaternionLinearInterpolant,
  RAD2DEG,
  RED_GREEN_RGTC2_Format,
  RED_RGTC1_Format,
  REVISION,
  RGBADepthPacking,
  RGBAFormat,
  RGBAIntegerFormat,
  RGBA_ASTC_10x10_Format,
  RGBA_ASTC_10x5_Format,
  RGBA_ASTC_10x6_Format,
  RGBA_ASTC_10x8_Format,
  RGBA_ASTC_12x10_Format,
  RGBA_ASTC_12x12_Format,
  RGBA_ASTC_4x4_Format,
  RGBA_ASTC_5x4_Format,
  RGBA_ASTC_5x5_Format,
  RGBA_ASTC_6x5_Format,
  RGBA_ASTC_6x6_Format,
  RGBA_ASTC_8x5_Format,
  RGBA_ASTC_8x6_Format,
  RGBA_ASTC_8x8_Format,
  RGBA_BPTC_Format,
  RGBA_ETC2_EAC_Format,
  RGBA_PVRTC_2BPPV1_Format,
  RGBA_PVRTC_4BPPV1_Format,
  RGBA_S3TC_DXT1_Format,
  RGBA_S3TC_DXT3_Format,
  RGBA_S3TC_DXT5_Format,
  RGBDepthPacking,
  RGBFormat,
  RGBIntegerFormat,
  RGB_BPTC_SIGNED_Format,
  RGB_BPTC_UNSIGNED_Format,
  RGB_ETC1_Format,
  RGB_ETC2_Format,
  RGB_PVRTC_2BPPV1_Format,
  RGB_PVRTC_4BPPV1_Format,
  RGB_S3TC_DXT1_Format,
  RGDepthPacking,
  RGFormat,
  RGIntegerFormat,
  RawShaderMaterial,
  Ray,
  Raycaster,
  RectAreaLight,
  RedFormat,
  RedIntegerFormat,
  ReinhardToneMapping,
  RenderTarget,
  RenderTarget3D,
  RepeatWrapping,
  ReplaceStencilOp,
  ReverseSubtractEquation,
  RingGeometry,
  SIGNED_RED_GREEN_RGTC2_Format,
  SIGNED_RED_RGTC1_Format,
  SRGBColorSpace,
  SRGBTransfer,
  Scene,
  ShaderMaterial,
  ShadowMaterial,
  Shape,
  ShapeGeometry,
  ShapePath,
  ShapeUtils,
  ShortType,
  Skeleton,
  SkeletonHelper,
  SkinnedMesh,
  Source,
  Sphere,
  SphereGeometry,
  Spherical,
  SphericalHarmonics3,
  SplineCurve,
  SpotLight,
  SpotLightHelper,
  Sprite,
  SpriteMaterial,
  SrcAlphaFactor,
  SrcAlphaSaturateFactor,
  SrcColorFactor,
  StaticCopyUsage,
  StaticDrawUsage,
  StaticReadUsage,
  StereoCamera,
  StreamCopyUsage,
  StreamDrawUsage,
  StreamReadUsage,
  StringKeyframeTrack,
  SubtractEquation,
  SubtractiveBlending,
  TOUCH,
  TangentSpaceNormalMap,
  TetrahedronGeometry,
  Texture,
  TextureLoader,
  TextureUtils,
  Timer,
  TimestampQuery,
  TorusGeometry,
  TorusKnotGeometry,
  Triangle,
  TriangleFanDrawMode,
  TriangleStripDrawMode,
  TrianglesDrawMode,
  TubeGeometry,
  UVMapping,
  Uint16BufferAttribute,
  Uint32BufferAttribute,
  Uint8BufferAttribute,
  Uint8ClampedBufferAttribute,
  Uniform,
  UniformsGroup,
  UniformsUtils,
  UnsignedByteType,
  UnsignedInt101111Type,
  UnsignedInt248Type,
  UnsignedInt5999Type,
  UnsignedIntType,
  UnsignedShort4444Type,
  UnsignedShort5551Type,
  UnsignedShortType,
  VSMShadowMap,
  Vector2,
  Vector3,
  Vector4,
  VectorKeyframeTrack,
  VideoFrameTexture,
  VideoTexture,
  WebGL3DRenderTarget,
  WebGLArrayRenderTarget,
  WebGLCoordinateSystem,
  WebGLCubeRenderTarget,
  WebGLRenderTarget,
  WebGPUCoordinateSystem,
  WebXRController,
  WireframeGeometry,
  WrapAroundEnding,
  ZeroCurvatureEnding,
  ZeroFactor,
  ZeroSlopeEnding,
  ZeroStencilOp,
  arrayNeedsUint32,
  cloneUniforms,
  createCanvasElement,
  createElementNS,
  getByteLength,
  getUnlitUniformColorSpace,
  mergeUniforms,
  probeAsync,
  warnOnce,
};
