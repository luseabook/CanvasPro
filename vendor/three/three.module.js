/**
 * @license
 * Copyright 2010-2025 Three.js Authors
 * SPDX-License-Identifier: MIT
 */
import {
  Matrix3,
  Vector2,
  Color,
  mergeUniforms,
  Vector3,
  CubeUVReflectionMapping,
  Mesh,
  BoxGeometry,
  ShaderMaterial,
  BackSide,
  cloneUniforms,
  Euler,
  Matrix4,
  ColorManagement,
  SRGBTransfer,
  PlaneGeometry,
  FrontSide,
  getUnlitUniformColorSpace,
  IntType,
  HalfFloatType,
  UnsignedByteType,
  FloatType,
  RGBAFormat,
  Plane,
  EquirectangularReflectionMapping,
  EquirectangularRefractionMapping,
  WebGLCubeRenderTarget,
  CubeReflectionMapping,
  CubeRefractionMapping,
  OrthographicCamera,
  PerspectiveCamera,
  NoToneMapping,
  MeshBasicMaterial,
  NoBlending,
  WebGLRenderTarget,
  BufferGeometry,
  BufferAttribute,
  LinearSRGBColorSpace,
  LinearFilter,
  warnOnce,
  Uint32BufferAttribute,
  Uint16BufferAttribute,
  arrayNeedsUint32,
  Vector4,
  DataArrayTexture,
  CubeTexture,
  Data3DTexture,
  LessEqualCompare,
  DepthTexture,
  Texture,
  GLSL3,
  PCFShadowMap,
  PCFSoftShadowMap,
  VSMShadowMap,
  CustomToneMapping,
  NeutralToneMapping,
  AgXToneMapping,
  ACESFilmicToneMapping,
  CineonToneMapping,
  ReinhardToneMapping,
  LinearToneMapping,
  LinearTransfer,
  AddOperation,
  MixOperation,
  MultiplyOperation,
  UniformsUtils,
  DoubleSide,
  NormalBlending,
  TangentSpaceNormalMap,
  ObjectSpaceNormalMap,
  Layers,
  Frustum,
  MeshDepthMaterial,
  RGBADepthPacking,
  MeshDistanceMaterial,
  NearestFilter,
  LessEqualDepth,
  ReverseSubtractEquation,
  SubtractEquation,
  AddEquation,
  OneMinusConstantAlphaFactor,
  ConstantAlphaFactor,
  OneMinusConstantColorFactor,
  ConstantColorFactor,
  OneMinusDstAlphaFactor,
  OneMinusDstColorFactor,
  OneMinusSrcAlphaFactor,
  OneMinusSrcColorFactor,
  DstAlphaFactor,
  DstColorFactor,
  SrcAlphaSaturateFactor,
  SrcAlphaFactor,
  SrcColorFactor,
  OneFactor,
  ZeroFactor,
  NotEqualDepth,
  GreaterDepth,
  GreaterEqualDepth,
  EqualDepth,
  LessDepth,
  AlwaysDepth,
  NeverDepth,
  CullFaceNone,
  CullFaceBack,
  CullFaceFront,
  CustomBlending,
  MultiplyBlending,
  SubtractiveBlending,
  AdditiveBlending,
  MinEquation,
  MaxEquation,
  MirroredRepeatWrapping,
  ClampToEdgeWrapping,
  RepeatWrapping,
  LinearMipmapLinearFilter,
  LinearMipmapNearestFilter,
  NearestMipmapLinearFilter,
  NearestMipmapNearestFilter,
  NotEqualCompare,
  GreaterCompare,
  GreaterEqualCompare,
  EqualCompare,
  LessCompare,
  AlwaysCompare,
  NeverCompare,
  NoColorSpace,
  DepthStencilFormat,
  getByteLength,
  DepthFormat,
  UnsignedIntType,
  UnsignedInt248Type,
  UnsignedShortType,
  createElementNS,
  UnsignedShort4444Type,
  UnsignedShort5551Type,
  UnsignedInt5999Type,
  UnsignedInt101111Type,
  ByteType,
  ShortType,
  AlphaFormat,
  RGBFormat,
  RedFormat,
  RedIntegerFormat,
  RGFormat,
  RGIntegerFormat,
  RGBAIntegerFormat,
  RGB_S3TC_DXT1_Format,
  RGBA_S3TC_DXT1_Format,
  RGBA_S3TC_DXT3_Format,
  RGBA_S3TC_DXT5_Format,
  RGB_PVRTC_4BPPV1_Format,
  RGB_PVRTC_2BPPV1_Format,
  RGBA_PVRTC_4BPPV1_Format,
  RGBA_PVRTC_2BPPV1_Format,
  RGB_ETC1_Format,
  RGB_ETC2_Format,
  RGBA_ETC2_EAC_Format,
  RGBA_ASTC_4x4_Format,
  RGBA_ASTC_5x4_Format,
  RGBA_ASTC_5x5_Format,
  RGBA_ASTC_6x5_Format,
  RGBA_ASTC_6x6_Format,
  RGBA_ASTC_8x5_Format,
  RGBA_ASTC_8x6_Format,
  RGBA_ASTC_8x8_Format,
  RGBA_ASTC_10x5_Format,
  RGBA_ASTC_10x6_Format,
  RGBA_ASTC_10x8_Format,
  RGBA_ASTC_10x10_Format,
  RGBA_ASTC_12x10_Format,
  RGBA_ASTC_12x12_Format,
  RGBA_BPTC_Format,
  RGB_BPTC_SIGNED_Format,
  RGB_BPTC_UNSIGNED_Format,
  RED_RGTC1_Format,
  SIGNED_RED_RGTC1_Format,
  RED_GREEN_RGTC2_Format,
  SIGNED_RED_GREEN_RGTC2_Format,
  ExternalTexture,
  EventDispatcher,
  ArrayCamera,
  WebXRController,
  RAD2DEG,
  createCanvasElement,
  SRGBColorSpace,
  REVISION,
  WebGLCoordinateSystem,
  probeAsync,
} from './three.core.js';
export {
  AdditiveAnimationBlendMode,
  AlwaysStencilFunc,
  AmbientLight,
  AnimationAction,
  AnimationClip,
  AnimationLoader,
  AnimationMixer,
  AnimationObjectGroup,
  AnimationUtils,
  ArcCurve,
  ArrowHelper,
  AttachedBindMode,
  Audio,
  AudioAnalyser,
  AudioContext,
  AudioListener,
  AudioLoader,
  AxesHelper,
  BasicDepthPacking,
  BasicShadowMap,
  BatchedMesh,
  Bone,
  BooleanKeyframeTrack,
  Box2,
  Box3,
  Box3Helper,
  BoxHelper,
  BufferGeometryLoader,
  Cache,
  Camera,
  CameraHelper,
  CanvasTexture,
  CapsuleGeometry,
  CatmullRomCurve3,
  CircleGeometry,
  Clock,
  ColorKeyframeTrack,
  CompressedArrayTexture,
  CompressedCubeTexture,
  CompressedTexture,
  CompressedTextureLoader,
  ConeGeometry,
  Controls,
  CubeCamera,
  CubeTextureLoader,
  CubicBezierCurve,
  CubicBezierCurve3,
  CubicInterpolant,
  CullFaceFrontBack,
  Curve,
  CurvePath,
  CylinderGeometry,
  Cylindrical,
  DataTexture,
  DataTextureLoader,
  DataUtils,
  DecrementStencilOp,
  DecrementWrapStencilOp,
  DefaultLoadingManager,
  DetachedBindMode,
  DirectionalLight,
  DirectionalLightHelper,
  DiscreteInterpolant,
  DodecahedronGeometry,
  DynamicCopyUsage,
  DynamicDrawUsage,
  DynamicReadUsage,
  EdgesGeometry,
  EllipseCurve,
  EqualStencilFunc,
  ExtrudeGeometry,
  FileLoader,
  Float16BufferAttribute,
  Float32BufferAttribute,
  Fog,
  FogExp2,
  FramebufferTexture,
  FrustumArray,
  GLBufferAttribute,
  GLSL1,
  GreaterEqualStencilFunc,
  GreaterStencilFunc,
  GridHelper,
  Group,
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
  LinearInterpolant,
  LinearMipMapLinearFilter,
  LinearMipMapNearestFilter,
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
  MeshLambertMaterial,
  MeshMatcapMaterial,
  MeshNormalMaterial,
  MeshPhongMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  MeshToonMaterial,
  NearestMipMapLinearFilter,
  NearestMipMapNearestFilter,
  NeverStencilFunc,
  NormalAnimationBlendMode,
  NotEqualStencilFunc,
  NumberKeyframeTrack,
  Object3D,
  ObjectLoader,
  OctahedronGeometry,
  Path,
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
  RGBDepthPacking,
  RGBIntegerFormat,
  RGDepthPacking,
  RawShaderMaterial,
  Ray,
  Raycaster,
  RectAreaLight,
  RenderTarget,
  RenderTarget3D,
  ReplaceStencilOp,
  RingGeometry,
  Scene,
  ShadowMaterial,
  Shape,
  ShapeGeometry,
  ShapePath,
  ShapeUtils,
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
  StaticCopyUsage,
  StaticDrawUsage,
  StaticReadUsage,
  StereoCamera,
  StreamCopyUsage,
  StreamDrawUsage,
  StreamReadUsage,
  StringKeyframeTrack,
  TOUCH,
  TetrahedronGeometry,
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
  Uint8BufferAttribute,
  Uint8ClampedBufferAttribute,
  Uniform,
  UniformsGroup,
  VectorKeyframeTrack,
  VideoFrameTexture,
  VideoTexture,
  WebGL3DRenderTarget,
  WebGLArrayRenderTarget,
  WebGPUCoordinateSystem,
  WireframeGeometry,
  WrapAroundEnding,
  ZeroCurvatureEnding,
  ZeroSlopeEnding,
  ZeroStencilOp,
} from './three.core.js';
function WebGLAnimation() {
  let _0x138e01 = null,
    _0x2f253a = false,
    _0x595d04 = null,
    _0x5445f9 = null;
  function _0x30d501(_0x49603b, _0x4f4d36) {
    (_0x595d04(_0x49603b, _0x4f4d36), (_0x5445f9 = _0x138e01.requestAnimationFrame(_0x30d501)));
  }
  return {
    start: function () {
      if (_0x2f253a === true) return;
      if (_0x595d04 === null) return;
      ((_0x5445f9 = _0x138e01.requestAnimationFrame(_0x30d501)), (_0x2f253a = true));
    },
    stop: function () {
      (_0x138e01.cancelAnimationFrame(_0x5445f9), (_0x2f253a = false));
    },
    setAnimationLoop: function (_0x23f923) {
      _0x595d04 = _0x23f923;
    },
    setContext: function (_0x65a08f) {
      _0x138e01 = _0x65a08f;
    },
  };
}
function WebGLAttributes(_0x549c09) {
  const _0x154d3a = new WeakMap();
  function _0x2fc85f(_0x257efb, _0x986ded) {
    const _0x4e4529 = _0x257efb.array,
      _0x5b317b = _0x257efb.usage,
      _0x4fdd56 = _0x4e4529.byteLength,
      _0x1b8d21 = _0x549c09.createBuffer();
    (_0x549c09.bindBuffer(_0x986ded, _0x1b8d21),
      _0x549c09.bufferData(_0x986ded, _0x4e4529, _0x5b317b),
      _0x257efb.onUploadCallback());
    let _0x533216;
    if (_0x4e4529 instanceof Float32Array) _0x533216 = _0x549c09.FLOAT;
    else {
      if (typeof Float16Array !== 'undefined' && _0x4e4529 instanceof Float16Array)
        _0x533216 = _0x549c09.HALF_FLOAT;
      else {
        if (_0x4e4529 instanceof Uint16Array)
          _0x257efb.isFloat16BufferAttribute
            ? (_0x533216 = _0x549c09.HALF_FLOAT)
            : (_0x533216 = _0x549c09.UNSIGNED_SHORT);
        else {
          if (_0x4e4529 instanceof Int16Array) _0x533216 = _0x549c09.SHORT;
          else {
            if (_0x4e4529 instanceof Uint32Array) _0x533216 = _0x549c09.UNSIGNED_INT;
            else {
              if (_0x4e4529 instanceof Int32Array) _0x533216 = _0x549c09.INT;
              else {
                if (_0x4e4529 instanceof Int8Array) _0x533216 = _0x549c09.BYTE;
                else {
                  if (_0x4e4529 instanceof Uint8Array) _0x533216 = _0x549c09.UNSIGNED_BYTE;
                  else {
                    if (_0x4e4529 instanceof Uint8ClampedArray) _0x533216 = _0x549c09.UNSIGNED_BYTE;
                    else
                      throw new Error('THREE.WebGLAttributes: Unsupported buffer data format: ' + _0x4e4529);
                  }
                }
              }
            }
          }
        }
      }
    }
    return {
      buffer: _0x1b8d21,
      type: _0x533216,
      bytesPerElement: _0x4e4529.BYTES_PER_ELEMENT,
      version: _0x257efb.version,
      size: _0x4fdd56,
    };
  }
  function _0x481f64(_0x4db69d, _0x4433b6, _0x3d8828) {
    const _0x2df804 = _0x4433b6.array,
      _0x25018a = _0x4433b6.updateRanges;
    _0x549c09.bindBuffer(_0x3d8828, _0x4db69d);
    if (_0x25018a.length === 0) _0x549c09.bufferSubData(_0x3d8828, 0, _0x2df804);
    else {
      _0x25018a.sort((_0x3d81c7, _0x7ce78a) => _0x3d81c7.start - _0x7ce78a.start);
      let _0xeab528 = 0;
      for (let _0x231ef4 = 1; _0x231ef4 < _0x25018a.length; _0x231ef4++) {
        const _0x34ceca = _0x25018a[_0xeab528],
          _0x21917b = _0x25018a[_0x231ef4];
        _0x21917b.start <= _0x34ceca.start + _0x34ceca.count + 1
          ? (_0x34ceca.count = Math.max(_0x34ceca.count, _0x21917b.start + _0x21917b.count - _0x34ceca.start))
          : (++_0xeab528, (_0x25018a[_0xeab528] = _0x21917b));
      }
      _0x25018a.length = _0xeab528 + 1;
      for (let _0xd9bb09 = 0, _0x484fee = _0x25018a.length; _0xd9bb09 < _0x484fee; _0xd9bb09++) {
        const _0x15afd9 = _0x25018a[_0xd9bb09];
        _0x549c09.bufferSubData(
          _0x3d8828,
          _0x15afd9.start * _0x2df804.BYTES_PER_ELEMENT,
          _0x2df804,
          _0x15afd9.start,
          _0x15afd9.count,
        );
      }
      _0x4433b6.clearUpdateRanges();
    }
    _0x4433b6.onUploadCallback();
  }
  function _0x4de981(_0x33dcef) {
    if (_0x33dcef.isInterleavedBufferAttribute) _0x33dcef = _0x33dcef.data;
    return _0x154d3a.get(_0x33dcef);
  }
  function _0x539da8(_0x110d1a) {
    if (_0x110d1a.isInterleavedBufferAttribute) _0x110d1a = _0x110d1a.data;
    const _0x368c4a = _0x154d3a.get(_0x110d1a);
    _0x368c4a && (_0x549c09.deleteBuffer(_0x368c4a.buffer), _0x154d3a.delete(_0x110d1a));
  }
  function _0x1bee37(_0x77433e, _0x4343cf) {
    if (_0x77433e.isInterleavedBufferAttribute) _0x77433e = _0x77433e.data;
    if (_0x77433e.isGLBufferAttribute) {
      const _0x142e6a = _0x154d3a.get(_0x77433e);
      (!_0x142e6a || _0x142e6a.version < _0x77433e.version) &&
        _0x154d3a.set(_0x77433e, {
          buffer: _0x77433e.buffer,
          type: _0x77433e.type,
          bytesPerElement: _0x77433e.elementSize,
          version: _0x77433e.version,
        });
      return;
    }
    const _0x44c4ca = _0x154d3a.get(_0x77433e);
    if (_0x44c4ca === undefined) _0x154d3a.set(_0x77433e, _0x2fc85f(_0x77433e, _0x4343cf));
    else {
      if (_0x44c4ca.version < _0x77433e.version) {
        if (_0x44c4ca.size !== _0x77433e.array.byteLength)
          throw new Error(
            "THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.",
          );
        (_0x481f64(_0x44c4ca.buffer, _0x77433e, _0x4343cf), (_0x44c4ca.version = _0x77433e.version));
      }
    }
  }
  return { get: _0x4de981, remove: _0x539da8, update: _0x1bee37 };
}
var alphahash_fragment =
    '#ifdef USE_ALPHAHASH\n\tif ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;\n#endif',
  alphahash_pars_fragment =
    '#ifdef USE_ALPHAHASH\n\tconst float ALPHA_HASH_SCALE = 0.05;\n\tfloat hash2D( vec2 value ) {\n\t\treturn fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );\n\t}\n\tfloat hash3D( vec3 value ) {\n\t\treturn hash2D( vec2( hash2D( value.xy ), value.z ) );\n\t}\n\tfloat getAlphaHashThreshold( vec3 position ) {\n\t\tfloat maxDeriv = max(\n\t\t\tlength( dFdx( position.xyz ) ),\n\t\t\tlength( dFdy( position.xyz ) )\n\t\t);\n\t\tfloat pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );\n\t\tvec2 pixScales = vec2(\n\t\t\texp2( floor( log2( pixScale ) ) ),\n\t\t\texp2( ceil( log2( pixScale ) ) )\n\t\t);\n\t\tvec2 alpha = vec2(\n\t\t\thash3D( floor( pixScales.x * position.xyz ) ),\n\t\t\thash3D( floor( pixScales.y * position.xyz ) )\n\t\t);\n\t\tfloat lerpFactor = fract( log2( pixScale ) );\n\t\tfloat x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;\n\t\tfloat a = min( lerpFactor, 1.0 - lerpFactor );\n\t\tvec3 cases = vec3(\n\t\t\tx * x / ( 2.0 * a * ( 1.0 - a ) ),\n\t\t\t( x - 0.5 * a ) / ( 1.0 - a ),\n\t\t\t1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )\n\t\t);\n\t\tfloat threshold = ( x < ( 1.0 - a ) )\n\t\t\t? ( ( x < a ) ? cases.x : cases.y )\n\t\t\t: cases.z;\n\t\treturn clamp( threshold , 1.0e-6, 1.0 );\n\t}\n#endif',
  alphamap_fragment =
    '#ifdef USE_ALPHAMAP\n\tdiffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;\n#endif',
  alphamap_pars_fragment = '#ifdef USE_ALPHAMAP\n\tuniform sampler2D alphaMap;\n#endif',
  alphatest_fragment =
    '#ifdef USE_ALPHATEST\n\t#ifdef ALPHA_TO_COVERAGE\n\tdiffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );\n\tif ( diffuseColor.a == 0.0 ) discard;\n\t#else\n\tif ( diffuseColor.a < alphaTest ) discard;\n\t#endif\n#endif',
  alphatest_pars_fragment = '#ifdef USE_ALPHATEST\n\tuniform float alphaTest;\n#endif',
  aomap_fragment =
    '#ifdef USE_AOMAP\n\tfloat ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;\n\treflectedLight.indirectDiffuse *= ambientOcclusion;\n\t#if defined( USE_CLEARCOAT ) \n\t\tclearcoatSpecularIndirect *= ambientOcclusion;\n\t#endif\n\t#if defined( USE_SHEEN ) \n\t\tsheenSpecularIndirect *= ambientOcclusion;\n\t#endif\n\t#if defined( USE_ENVMAP ) && defined( STANDARD )\n\t\tfloat dotNV = saturate( dot( geometryNormal, geometryViewDir ) );\n\t\treflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );\n\t#endif\n#endif',
  aomap_pars_fragment =
    '#ifdef USE_AOMAP\n\tuniform sampler2D aoMap;\n\tuniform float aoMapIntensity;\n#endif',
  batching_pars_vertex =
    '#ifdef USE_BATCHING\n\t#if ! defined( GL_ANGLE_multi_draw )\n\t#define gl_DrawID _gl_DrawID\n\tuniform int _gl_DrawID;\n\t#endif\n\tuniform highp sampler2D batchingTexture;\n\tuniform highp usampler2D batchingIdTexture;\n\tmat4 getBatchingMatrix( const in float i ) {\n\t\tint size = textureSize( batchingTexture, 0 ).x;\n\t\tint j = int( i ) * 4;\n\t\tint x = j % size;\n\t\tint y = j / size;\n\t\tvec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );\n\t\tvec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );\n\t\tvec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );\n\t\tvec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );\n\t\treturn mat4( v1, v2, v3, v4 );\n\t}\n\tfloat getIndirectIndex( const in int i ) {\n\t\tint size = textureSize( batchingIdTexture, 0 ).x;\n\t\tint x = i % size;\n\t\tint y = i / size;\n\t\treturn float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );\n\t}\n#endif\n#ifdef USE_BATCHING_COLOR\n\tuniform sampler2D batchingColorTexture;\n\tvec3 getBatchingColor( const in float i ) {\n\t\tint size = textureSize( batchingColorTexture, 0 ).x;\n\t\tint j = int( i );\n\t\tint x = j % size;\n\t\tint y = j / size;\n\t\treturn texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;\n\t}\n#endif',
  batching_vertex =
    '#ifdef USE_BATCHING\n\tmat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );\n#endif',
  begin_vertex =
    'vec3 transformed = vec3( position );\n#ifdef USE_ALPHAHASH\n\tvPosition = vec3( position );\n#endif',
  beginnormal_vertex =
    'vec3 objectNormal = vec3( normal );\n#ifdef USE_TANGENT\n\tvec3 objectTangent = vec3( tangent.xyz );\n#endif',
  bsdfs =
    'float G_BlinnPhong_Implicit( ) {\n\treturn 0.25;\n}\nfloat D_BlinnPhong( const in float shininess, const in float dotNH ) {\n\treturn RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );\n}\nvec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {\n\tvec3 halfDir = normalize( lightDir + viewDir );\n\tfloat dotNH = saturate( dot( normal, halfDir ) );\n\tfloat dotVH = saturate( dot( viewDir, halfDir ) );\n\tvec3 F = F_Schlick( specularColor, 1.0, dotVH );\n\tfloat G = G_BlinnPhong_Implicit( );\n\tfloat D = D_BlinnPhong( shininess, dotNH );\n\treturn F * ( G * D );\n} // validated',
  iridescence_fragment =
    '#ifdef USE_IRIDESCENCE\n\tconst mat3 XYZ_TO_REC709 = mat3(\n\t\t 3.2404542, -0.9692660,  0.0556434,\n\t\t-1.5371385,  1.8760108, -0.2040259,\n\t\t-0.4985314,  0.0415560,  1.0572252\n\t);\n\tvec3 Fresnel0ToIor( vec3 fresnel0 ) {\n\t\tvec3 sqrtF0 = sqrt( fresnel0 );\n\t\treturn ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );\n\t}\n\tvec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {\n\t\treturn pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );\n\t}\n\tfloat IorToFresnel0( float transmittedIor, float incidentIor ) {\n\t\treturn pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));\n\t}\n\tvec3 evalSensitivity( float OPD, vec3 shift ) {\n\t\tfloat phase = 2.0 * PI * OPD * 1.0e-9;\n\t\tvec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );\n\t\tvec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );\n\t\tvec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );\n\t\tvec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );\n\t\txyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );\n\t\txyz /= 1.0685e-7;\n\t\tvec3 rgb = XYZ_TO_REC709 * xyz;\n\t\treturn rgb;\n\t}\n\tvec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {\n\t\tvec3 I;\n\t\tfloat iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );\n\t\tfloat sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );\n\t\tfloat cosTheta2Sq = 1.0 - sinTheta2Sq;\n\t\tif ( cosTheta2Sq < 0.0 ) {\n\t\t\treturn vec3( 1.0 );\n\t\t}\n\t\tfloat cosTheta2 = sqrt( cosTheta2Sq );\n\t\tfloat R0 = IorToFresnel0( iridescenceIOR, outsideIOR );\n\t\tfloat R12 = F_Schlick( R0, 1.0, cosTheta1 );\n\t\tfloat T121 = 1.0 - R12;\n\t\tfloat phi12 = 0.0;\n\t\tif ( iridescenceIOR < outsideIOR ) phi12 = PI;\n\t\tfloat phi21 = PI - phi12;\n\t\tvec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );\t\tvec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );\n\t\tvec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );\n\t\tvec3 phi23 = vec3( 0.0 );\n\t\tif ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;\n\t\tif ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;\n\t\tif ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;\n\t\tfloat OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;\n\t\tvec3 phi = vec3( phi21 ) + phi23;\n\t\tvec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );\n\t\tvec3 r123 = sqrt( R123 );\n\t\tvec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );\n\t\tvec3 C0 = R12 + Rs;\n\t\tI = C0;\n\t\tvec3 Cm = Rs - T121;\n\t\tfor ( int m = 1; m <= 2; ++ m ) {\n\t\t\tCm *= r123;\n\t\t\tvec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );\n\t\t\tI += Cm * Sm;\n\t\t}\n\t\treturn max( I, vec3( 0.0 ) );\n\t}\n#endif',
  bumpmap_pars_fragment =
    '#ifdef USE_BUMPMAP\n\tuniform sampler2D bumpMap;\n\tuniform float bumpScale;\n\tvec2 dHdxy_fwd() {\n\t\tvec2 dSTdx = dFdx( vBumpMapUv );\n\t\tvec2 dSTdy = dFdy( vBumpMapUv );\n\t\tfloat Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;\n\t\tfloat dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;\n\t\tfloat dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;\n\t\treturn vec2( dBx, dBy );\n\t}\n\tvec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {\n\t\tvec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );\n\t\tvec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );\n\t\tvec3 vN = surf_norm;\n\t\tvec3 R1 = cross( vSigmaY, vN );\n\t\tvec3 R2 = cross( vN, vSigmaX );\n\t\tfloat fDet = dot( vSigmaX, R1 ) * faceDirection;\n\t\tvec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );\n\t\treturn normalize( abs( fDet ) * surf_norm - vGrad );\n\t}\n#endif',
  clipping_planes_fragment =
    '#if NUM_CLIPPING_PLANES > 0\n\tvec4 plane;\n\t#ifdef ALPHA_TO_COVERAGE\n\t\tfloat distanceToPlane, distanceGradient;\n\t\tfloat clipOpacity = 1.0;\n\t\t#pragma unroll_loop_start\n\t\tfor ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {\n\t\t\tplane = clippingPlanes[ i ];\n\t\t\tdistanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;\n\t\t\tdistanceGradient = fwidth( distanceToPlane ) / 2.0;\n\t\t\tclipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );\n\t\t\tif ( clipOpacity == 0.0 ) discard;\n\t\t}\n\t\t#pragma unroll_loop_end\n\t\t#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES\n\t\t\tfloat unionClipOpacity = 1.0;\n\t\t\t#pragma unroll_loop_start\n\t\t\tfor ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {\n\t\t\t\tplane = clippingPlanes[ i ];\n\t\t\t\tdistanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;\n\t\t\t\tdistanceGradient = fwidth( distanceToPlane ) / 2.0;\n\t\t\t\tunionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );\n\t\t\t}\n\t\t\t#pragma unroll_loop_end\n\t\t\tclipOpacity *= 1.0 - unionClipOpacity;\n\t\t#endif\n\t\tdiffuseColor.a *= clipOpacity;\n\t\tif ( diffuseColor.a == 0.0 ) discard;\n\t#else\n\t\t#pragma unroll_loop_start\n\t\tfor ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {\n\t\t\tplane = clippingPlanes[ i ];\n\t\t\tif ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;\n\t\t}\n\t\t#pragma unroll_loop_end\n\t\t#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES\n\t\t\tbool clipped = true;\n\t\t\t#pragma unroll_loop_start\n\t\t\tfor ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {\n\t\t\t\tplane = clippingPlanes[ i ];\n\t\t\t\tclipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;\n\t\t\t}\n\t\t\t#pragma unroll_loop_end\n\t\t\tif ( clipped ) discard;\n\t\t#endif\n\t#endif\n#endif',
  clipping_planes_pars_fragment =
    '#if NUM_CLIPPING_PLANES > 0\n\tvarying vec3 vClipPosition;\n\tuniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];\n#endif',
  clipping_planes_pars_vertex = '#if NUM_CLIPPING_PLANES > 0\n\tvarying vec3 vClipPosition;\n#endif',
  clipping_planes_vertex = '#if NUM_CLIPPING_PLANES > 0\n\tvClipPosition = - mvPosition.xyz;\n#endif',
  color_fragment =
    '#if defined( USE_COLOR_ALPHA )\n\tdiffuseColor *= vColor;\n#elif defined( USE_COLOR )\n\tdiffuseColor.rgb *= vColor;\n#endif',
  color_pars_fragment =
    '#if defined( USE_COLOR_ALPHA )\n\tvarying vec4 vColor;\n#elif defined( USE_COLOR )\n\tvarying vec3 vColor;\n#endif',
  color_pars_vertex =
    '#if defined( USE_COLOR_ALPHA )\n\tvarying vec4 vColor;\n#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )\n\tvarying vec3 vColor;\n#endif',
  color_vertex =
    '#if defined( USE_COLOR_ALPHA )\n\tvColor = vec4( 1.0 );\n#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )\n\tvColor = vec3( 1.0 );\n#endif\n#ifdef USE_COLOR\n\tvColor *= color;\n#endif\n#ifdef USE_INSTANCING_COLOR\n\tvColor.xyz *= instanceColor.xyz;\n#endif\n#ifdef USE_BATCHING_COLOR\n\tvec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );\n\tvColor.xyz *= batchingColor.xyz;\n#endif',
  common =
    '#define PI 3.141592653589793\n#define PI2 6.283185307179586\n#define PI_HALF 1.5707963267948966\n#define RECIPROCAL_PI 0.3183098861837907\n#define RECIPROCAL_PI2 0.15915494309189535\n#define EPSILON 1e-6\n#ifndef saturate\n#define saturate( a ) clamp( a, 0.0, 1.0 )\n#endif\n#define whiteComplement( a ) ( 1.0 - saturate( a ) )\nfloat pow2( const in float x ) { return x*x; }\nvec3 pow2( const in vec3 x ) { return x*x; }\nfloat pow3( const in float x ) { return x*x*x; }\nfloat pow4( const in float x ) { float x2 = x*x; return x2*x2; }\nfloat max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }\nfloat average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }\nhighp float rand( const in vec2 uv ) {\n\tconst highp float a = 12.9898, b = 78.233, c = 43758.5453;\n\thighp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );\n\treturn fract( sin( sn ) * c );\n}\n#ifdef HIGH_PRECISION\n\tfloat precisionSafeLength( vec3 v ) { return length( v ); }\n#else\n\tfloat precisionSafeLength( vec3 v ) {\n\t\tfloat maxComponent = max3( abs( v ) );\n\t\treturn length( v / maxComponent ) * maxComponent;\n\t}\n#endif\nstruct IncidentLight {\n\tvec3 color;\n\tvec3 direction;\n\tbool visible;\n};\nstruct ReflectedLight {\n\tvec3 directDiffuse;\n\tvec3 directSpecular;\n\tvec3 indirectDiffuse;\n\tvec3 indirectSpecular;\n};\n#ifdef USE_ALPHAHASH\n\tvarying vec3 vPosition;\n#endif\nvec3 transformDirection( in vec3 dir, in mat4 matrix ) {\n\treturn normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );\n}\nvec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {\n\treturn normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );\n}\nmat3 transposeMat3( const in mat3 m ) {\n\tmat3 tmp;\n\ttmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );\n\ttmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );\n\ttmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );\n\treturn tmp;\n}\nbool isPerspectiveMatrix( mat4 m ) {\n\treturn m[ 2 ][ 3 ] == - 1.0;\n}\nvec2 equirectUv( in vec3 dir ) {\n\tfloat u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;\n\tfloat v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;\n\treturn vec2( u, v );\n}\nvec3 BRDF_Lambert( const in vec3 diffuseColor ) {\n\treturn RECIPROCAL_PI * diffuseColor;\n}\nvec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {\n\tfloat fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );\n\treturn f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );\n}\nfloat F_Schlick( const in float f0, const in float f90, const in float dotVH ) {\n\tfloat fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );\n\treturn f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );\n} // validated',
  cube_uv_reflection_fragment =
    '#ifdef ENVMAP_TYPE_CUBE_UV\n\t#define cubeUV_minMipLevel 4.0\n\t#define cubeUV_minTileSize 16.0\n\tfloat getFace( vec3 direction ) {\n\t\tvec3 absDirection = abs( direction );\n\t\tfloat face = - 1.0;\n\t\tif ( absDirection.x > absDirection.z ) {\n\t\t\tif ( absDirection.x > absDirection.y )\n\t\t\t\tface = direction.x > 0.0 ? 0.0 : 3.0;\n\t\t\telse\n\t\t\t\tface = direction.y > 0.0 ? 1.0 : 4.0;\n\t\t} else {\n\t\t\tif ( absDirection.z > absDirection.y )\n\t\t\t\tface = direction.z > 0.0 ? 2.0 : 5.0;\n\t\t\telse\n\t\t\t\tface = direction.y > 0.0 ? 1.0 : 4.0;\n\t\t}\n\t\treturn face;\n\t}\n\tvec2 getUV( vec3 direction, float face ) {\n\t\tvec2 uv;\n\t\tif ( face == 0.0 ) {\n\t\t\tuv = vec2( direction.z, direction.y ) / abs( direction.x );\n\t\t} else if ( face == 1.0 ) {\n\t\t\tuv = vec2( - direction.x, - direction.z ) / abs( direction.y );\n\t\t} else if ( face == 2.0 ) {\n\t\t\tuv = vec2( - direction.x, direction.y ) / abs( direction.z );\n\t\t} else if ( face == 3.0 ) {\n\t\t\tuv = vec2( - direction.z, direction.y ) / abs( direction.x );\n\t\t} else if ( face == 4.0 ) {\n\t\t\tuv = vec2( - direction.x, direction.z ) / abs( direction.y );\n\t\t} else {\n\t\t\tuv = vec2( direction.x, direction.y ) / abs( direction.z );\n\t\t}\n\t\treturn 0.5 * ( uv + 1.0 );\n\t}\n\tvec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {\n\t\tfloat face = getFace( direction );\n\t\tfloat filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );\n\t\tmipInt = max( mipInt, cubeUV_minMipLevel );\n\t\tfloat faceSize = exp2( mipInt );\n\t\thighp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;\n\t\tif ( face > 2.0 ) {\n\t\t\tuv.y += faceSize;\n\t\t\tface -= 3.0;\n\t\t}\n\t\tuv.x += face * faceSize;\n\t\tuv.x += filterInt * 3.0 * cubeUV_minTileSize;\n\t\tuv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );\n\t\tuv.x *= CUBEUV_TEXEL_WIDTH;\n\t\tuv.y *= CUBEUV_TEXEL_HEIGHT;\n\t\t#ifdef texture2DGradEXT\n\t\t\treturn texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;\n\t\t#else\n\t\t\treturn texture2D( envMap, uv ).rgb;\n\t\t#endif\n\t}\n\t#define cubeUV_r0 1.0\n\t#define cubeUV_m0 - 2.0\n\t#define cubeUV_r1 0.8\n\t#define cubeUV_m1 - 1.0\n\t#define cubeUV_r4 0.4\n\t#define cubeUV_m4 2.0\n\t#define cubeUV_r5 0.305\n\t#define cubeUV_m5 3.0\n\t#define cubeUV_r6 0.21\n\t#define cubeUV_m6 4.0\n\tfloat roughnessToMip( float roughness ) {\n\t\tfloat mip = 0.0;\n\t\tif ( roughness >= cubeUV_r1 ) {\n\t\t\tmip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;\n\t\t} else if ( roughness >= cubeUV_r4 ) {\n\t\t\tmip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;\n\t\t} else if ( roughness >= cubeUV_r5 ) {\n\t\t\tmip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;\n\t\t} else if ( roughness >= cubeUV_r6 ) {\n\t\t\tmip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;\n\t\t} else {\n\t\t\tmip = - 2.0 * log2( 1.16 * roughness );\t\t}\n\t\treturn mip;\n\t}\n\tvec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {\n\t\tfloat mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );\n\t\tfloat mipF = fract( mip );\n\t\tfloat mipInt = floor( mip );\n\t\tvec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );\n\t\tif ( mipF == 0.0 ) {\n\t\t\treturn vec4( color0, 1.0 );\n\t\t} else {\n\t\t\tvec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );\n\t\t\treturn vec4( mix( color0, color1, mipF ), 1.0 );\n\t\t}\n\t}\n#endif',
  defaultnormal_vertex =
    'vec3 transformedNormal = objectNormal;\n#ifdef USE_TANGENT\n\tvec3 transformedTangent = objectTangent;\n#endif\n#ifdef USE_BATCHING\n\tmat3 bm = mat3( batchingMatrix );\n\ttransformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );\n\ttransformedNormal = bm * transformedNormal;\n\t#ifdef USE_TANGENT\n\t\ttransformedTangent = bm * transformedTangent;\n\t#endif\n#endif\n#ifdef USE_INSTANCING\n\tmat3 im = mat3( instanceMatrix );\n\ttransformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );\n\ttransformedNormal = im * transformedNormal;\n\t#ifdef USE_TANGENT\n\t\ttransformedTangent = im * transformedTangent;\n\t#endif\n#endif\ntransformedNormal = normalMatrix * transformedNormal;\n#ifdef FLIP_SIDED\n\ttransformedNormal = - transformedNormal;\n#endif\n#ifdef USE_TANGENT\n\ttransformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;\n\t#ifdef FLIP_SIDED\n\t\ttransformedTangent = - transformedTangent;\n\t#endif\n#endif',
  displacementmap_pars_vertex =
    '#ifdef USE_DISPLACEMENTMAP\n\tuniform sampler2D displacementMap;\n\tuniform float displacementScale;\n\tuniform float displacementBias;\n#endif',
  displacementmap_vertex =
    '#ifdef USE_DISPLACEMENTMAP\n\ttransformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );\n#endif',
  emissivemap_fragment =
    '#ifdef USE_EMISSIVEMAP\n\tvec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );\n\t#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE\n\t\temissiveColor = sRGBTransferEOTF( emissiveColor );\n\t#endif\n\ttotalEmissiveRadiance *= emissiveColor.rgb;\n#endif',
  emissivemap_pars_fragment = '#ifdef USE_EMISSIVEMAP\n\tuniform sampler2D emissiveMap;\n#endif',
  colorspace_fragment = 'gl_FragColor = linearToOutputTexel( gl_FragColor );',
  colorspace_pars_fragment =
    'vec4 LinearTransferOETF( in vec4 value ) {\n\treturn value;\n}\nvec4 sRGBTransferEOTF( in vec4 value ) {\n\treturn vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );\n}\nvec4 sRGBTransferOETF( in vec4 value ) {\n\treturn vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );\n}',
  envmap_fragment =
    '#ifdef USE_ENVMAP\n\t#ifdef ENV_WORLDPOS\n\t\tvec3 cameraToFrag;\n\t\tif ( isOrthographic ) {\n\t\t\tcameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );\n\t\t} else {\n\t\t\tcameraToFrag = normalize( vWorldPosition - cameraPosition );\n\t\t}\n\t\tvec3 worldNormal = inverseTransformDirection( normal, viewMatrix );\n\t\t#ifdef ENVMAP_MODE_REFLECTION\n\t\t\tvec3 reflectVec = reflect( cameraToFrag, worldNormal );\n\t\t#else\n\t\t\tvec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );\n\t\t#endif\n\t#else\n\t\tvec3 reflectVec = vReflect;\n\t#endif\n\t#ifdef ENVMAP_TYPE_CUBE\n\t\tvec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );\n\t#else\n\t\tvec4 envColor = vec4( 0.0 );\n\t#endif\n\t#ifdef ENVMAP_BLENDING_MULTIPLY\n\t\toutgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );\n\t#elif defined( ENVMAP_BLENDING_MIX )\n\t\toutgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );\n\t#elif defined( ENVMAP_BLENDING_ADD )\n\t\toutgoingLight += envColor.xyz * specularStrength * reflectivity;\n\t#endif\n#endif',
  envmap_common_pars_fragment =
    '#ifdef USE_ENVMAP\n\tuniform float envMapIntensity;\n\tuniform float flipEnvMap;\n\tuniform mat3 envMapRotation;\n\t#ifdef ENVMAP_TYPE_CUBE\n\t\tuniform samplerCube envMap;\n\t#else\n\t\tuniform sampler2D envMap;\n\t#endif\n\t\n#endif',
  envmap_pars_fragment =
    '#ifdef USE_ENVMAP\n\tuniform float reflectivity;\n\t#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )\n\t\t#define ENV_WORLDPOS\n\t#endif\n\t#ifdef ENV_WORLDPOS\n\t\tvarying vec3 vWorldPosition;\n\t\tuniform float refractionRatio;\n\t#else\n\t\tvarying vec3 vReflect;\n\t#endif\n#endif',
  envmap_pars_vertex =
    '#ifdef USE_ENVMAP\n\t#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )\n\t\t#define ENV_WORLDPOS\n\t#endif\n\t#ifdef ENV_WORLDPOS\n\t\t\n\t\tvarying vec3 vWorldPosition;\n\t#else\n\t\tvarying vec3 vReflect;\n\t\tuniform float refractionRatio;\n\t#endif\n#endif',
  envmap_vertex =
    '#ifdef USE_ENVMAP\n\t#ifdef ENV_WORLDPOS\n\t\tvWorldPosition = worldPosition.xyz;\n\t#else\n\t\tvec3 cameraToVertex;\n\t\tif ( isOrthographic ) {\n\t\t\tcameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );\n\t\t} else {\n\t\t\tcameraToVertex = normalize( worldPosition.xyz - cameraPosition );\n\t\t}\n\t\tvec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );\n\t\t#ifdef ENVMAP_MODE_REFLECTION\n\t\t\tvReflect = reflect( cameraToVertex, worldNormal );\n\t\t#else\n\t\t\tvReflect = refract( cameraToVertex, worldNormal, refractionRatio );\n\t\t#endif\n\t#endif\n#endif',
  fog_vertex = '#ifdef USE_FOG\n\tvFogDepth = - mvPosition.z;\n#endif',
  fog_pars_vertex = '#ifdef USE_FOG\n\tvarying float vFogDepth;\n#endif',
  fog_fragment =
    '#ifdef USE_FOG\n\t#ifdef FOG_EXP2\n\t\tfloat fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );\n\t#else\n\t\tfloat fogFactor = smoothstep( fogNear, fogFar, vFogDepth );\n\t#endif\n\tgl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );\n#endif',
  fog_pars_fragment =
    '#ifdef USE_FOG\n\tuniform vec3 fogColor;\n\tvarying float vFogDepth;\n\t#ifdef FOG_EXP2\n\t\tuniform float fogDensity;\n\t#else\n\t\tuniform float fogNear;\n\t\tuniform float fogFar;\n\t#endif\n#endif',
  gradientmap_pars_fragment =
    '#ifdef USE_GRADIENTMAP\n\tuniform sampler2D gradientMap;\n#endif\nvec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {\n\tfloat dotNL = dot( normal, lightDirection );\n\tvec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );\n\t#ifdef USE_GRADIENTMAP\n\t\treturn vec3( texture2D( gradientMap, coord ).r );\n\t#else\n\t\tvec2 fw = fwidth( coord ) * 0.5;\n\t\treturn mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );\n\t#endif\n}',
  lightmap_pars_fragment =
    '#ifdef USE_LIGHTMAP\n\tuniform sampler2D lightMap;\n\tuniform float lightMapIntensity;\n#endif',
  lights_lambert_fragment =
    'LambertMaterial material;\nmaterial.diffuseColor = diffuseColor.rgb;\nmaterial.specularStrength = specularStrength;',
  lights_lambert_pars_fragment =
    'varying vec3 vViewPosition;\nstruct LambertMaterial {\n\tvec3 diffuseColor;\n\tfloat specularStrength;\n};\nvoid RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {\n\tfloat dotNL = saturate( dot( geometryNormal, directLight.direction ) );\n\tvec3 irradiance = dotNL * directLight.color;\n\treflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}\nvoid RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {\n\treflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}\n#define RE_Direct\t\t\t\tRE_Direct_Lambert\n#define RE_IndirectDiffuse\t\tRE_IndirectDiffuse_Lambert',
  lights_pars_begin =
    'uniform bool receiveShadow;\nuniform vec3 ambientLightColor;\n#if defined( USE_LIGHT_PROBES )\n\tuniform vec3 lightProbe[ 9 ];\n#endif\nvec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {\n\tfloat x = normal.x, y = normal.y, z = normal.z;\n\tvec3 result = shCoefficients[ 0 ] * 0.886227;\n\tresult += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;\n\tresult += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;\n\tresult += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;\n\tresult += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;\n\tresult += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;\n\tresult += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );\n\tresult += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;\n\tresult += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );\n\treturn result;\n}\nvec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {\n\tvec3 worldNormal = inverseTransformDirection( normal, viewMatrix );\n\tvec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );\n\treturn irradiance;\n}\nvec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {\n\tvec3 irradiance = ambientLightColor;\n\treturn irradiance;\n}\nfloat getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {\n\tfloat distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );\n\tif ( cutoffDistance > 0.0 ) {\n\t\tdistanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );\n\t}\n\treturn distanceFalloff;\n}\nfloat getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {\n\treturn smoothstep( coneCosine, penumbraCosine, angleCosine );\n}\n#if NUM_DIR_LIGHTS > 0\n\tstruct DirectionalLight {\n\t\tvec3 direction;\n\t\tvec3 color;\n\t};\n\tuniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];\n\tvoid getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {\n\t\tlight.color = directionalLight.color;\n\t\tlight.direction = directionalLight.direction;\n\t\tlight.visible = true;\n\t}\n#endif\n#if NUM_POINT_LIGHTS > 0\n\tstruct PointLight {\n\t\tvec3 position;\n\t\tvec3 color;\n\t\tfloat distance;\n\t\tfloat decay;\n\t};\n\tuniform PointLight pointLights[ NUM_POINT_LIGHTS ];\n\tvoid getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {\n\t\tvec3 lVector = pointLight.position - geometryPosition;\n\t\tlight.direction = normalize( lVector );\n\t\tfloat lightDistance = length( lVector );\n\t\tlight.color = pointLight.color;\n\t\tlight.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );\n\t\tlight.visible = ( light.color != vec3( 0.0 ) );\n\t}\n#endif\n#if NUM_SPOT_LIGHTS > 0\n\tstruct SpotLight {\n\t\tvec3 position;\n\t\tvec3 direction;\n\t\tvec3 color;\n\t\tfloat distance;\n\t\tfloat decay;\n\t\tfloat coneCos;\n\t\tfloat penumbraCos;\n\t};\n\tuniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];\n\tvoid getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {\n\t\tvec3 lVector = spotLight.position - geometryPosition;\n\t\tlight.direction = normalize( lVector );\n\t\tfloat angleCos = dot( light.direction, spotLight.direction );\n\t\tfloat spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );\n\t\tif ( spotAttenuation > 0.0 ) {\n\t\t\tfloat lightDistance = length( lVector );\n\t\t\tlight.color = spotLight.color * spotAttenuation;\n\t\t\tlight.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );\n\t\t\tlight.visible = ( light.color != vec3( 0.0 ) );\n\t\t} else {\n\t\t\tlight.color = vec3( 0.0 );\n\t\t\tlight.visible = false;\n\t\t}\n\t}\n#endif\n#if NUM_RECT_AREA_LIGHTS > 0\n\tstruct RectAreaLight {\n\t\tvec3 color;\n\t\tvec3 position;\n\t\tvec3 halfWidth;\n\t\tvec3 halfHeight;\n\t};\n\tuniform sampler2D ltc_1;\tuniform sampler2D ltc_2;\n\tuniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];\n#endif\n#if NUM_HEMI_LIGHTS > 0\n\tstruct HemisphereLight {\n\t\tvec3 direction;\n\t\tvec3 skyColor;\n\t\tvec3 groundColor;\n\t};\n\tuniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];\n\tvec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {\n\t\tfloat dotNL = dot( normal, hemiLight.direction );\n\t\tfloat hemiDiffuseWeight = 0.5 * dotNL + 0.5;\n\t\tvec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );\n\t\treturn irradiance;\n\t}\n#endif',
  envmap_physical_pars_fragment =
    '#ifdef USE_ENVMAP\n\tvec3 getIBLIrradiance( const in vec3 normal ) {\n\t\t#ifdef ENVMAP_TYPE_CUBE_UV\n\t\t\tvec3 worldNormal = inverseTransformDirection( normal, viewMatrix );\n\t\t\tvec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );\n\t\t\treturn PI * envMapColor.rgb * envMapIntensity;\n\t\t#else\n\t\t\treturn vec3( 0.0 );\n\t\t#endif\n\t}\n\tvec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {\n\t\t#ifdef ENVMAP_TYPE_CUBE_UV\n\t\t\tvec3 reflectVec = reflect( - viewDir, normal );\n\t\t\treflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );\n\t\t\treflectVec = inverseTransformDirection( reflectVec, viewMatrix );\n\t\t\tvec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );\n\t\t\treturn envMapColor.rgb * envMapIntensity;\n\t\t#else\n\t\t\treturn vec3( 0.0 );\n\t\t#endif\n\t}\n\t#ifdef USE_ANISOTROPY\n\t\tvec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {\n\t\t\t#ifdef ENVMAP_TYPE_CUBE_UV\n\t\t\t\tvec3 bentNormal = cross( bitangent, viewDir );\n\t\t\t\tbentNormal = normalize( cross( bentNormal, bitangent ) );\n\t\t\t\tbentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );\n\t\t\t\treturn getIBLRadiance( viewDir, bentNormal, roughness );\n\t\t\t#else\n\t\t\t\treturn vec3( 0.0 );\n\t\t\t#endif\n\t\t}\n\t#endif\n#endif',
  lights_toon_fragment = 'ToonMaterial material;\nmaterial.diffuseColor = diffuseColor.rgb;',
  lights_toon_pars_fragment =
    'varying vec3 vViewPosition;\nstruct ToonMaterial {\n\tvec3 diffuseColor;\n};\nvoid RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {\n\tvec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;\n\treflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}\nvoid RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {\n\treflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}\n#define RE_Direct\t\t\t\tRE_Direct_Toon\n#define RE_IndirectDiffuse\t\tRE_IndirectDiffuse_Toon',
  lights_phong_fragment =
    'BlinnPhongMaterial material;\nmaterial.diffuseColor = diffuseColor.rgb;\nmaterial.specularColor = specular;\nmaterial.specularShininess = shininess;\nmaterial.specularStrength = specularStrength;',
  lights_phong_pars_fragment =
    'varying vec3 vViewPosition;\nstruct BlinnPhongMaterial {\n\tvec3 diffuseColor;\n\tvec3 specularColor;\n\tfloat specularShininess;\n\tfloat specularStrength;\n};\nvoid RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {\n\tfloat dotNL = saturate( dot( geometryNormal, directLight.direction ) );\n\tvec3 irradiance = dotNL * directLight.color;\n\treflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n\treflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;\n}\nvoid RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {\n\treflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}\n#define RE_Direct\t\t\t\tRE_Direct_BlinnPhong\n#define RE_IndirectDiffuse\t\tRE_IndirectDiffuse_BlinnPhong',
  lights_physical_fragment =
    'PhysicalMaterial material;\nmaterial.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );\nvec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );\nfloat geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );\nmaterial.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;\nmaterial.roughness = min( material.roughness, 1.0 );\n#ifdef IOR\n\tmaterial.ior = ior;\n\t#ifdef USE_SPECULAR\n\t\tfloat specularIntensityFactor = specularIntensity;\n\t\tvec3 specularColorFactor = specularColor;\n\t\t#ifdef USE_SPECULAR_COLORMAP\n\t\t\tspecularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;\n\t\t#endif\n\t\t#ifdef USE_SPECULAR_INTENSITYMAP\n\t\t\tspecularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;\n\t\t#endif\n\t\tmaterial.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );\n\t#else\n\t\tfloat specularIntensityFactor = 1.0;\n\t\tvec3 specularColorFactor = vec3( 1.0 );\n\t\tmaterial.specularF90 = 1.0;\n\t#endif\n\tmaterial.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );\n#else\n\tmaterial.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );\n\tmaterial.specularF90 = 1.0;\n#endif\n#ifdef USE_CLEARCOAT\n\tmaterial.clearcoat = clearcoat;\n\tmaterial.clearcoatRoughness = clearcoatRoughness;\n\tmaterial.clearcoatF0 = vec3( 0.04 );\n\tmaterial.clearcoatF90 = 1.0;\n\t#ifdef USE_CLEARCOATMAP\n\t\tmaterial.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;\n\t#endif\n\t#ifdef USE_CLEARCOAT_ROUGHNESSMAP\n\t\tmaterial.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;\n\t#endif\n\tmaterial.clearcoat = saturate( material.clearcoat );\tmaterial.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );\n\tmaterial.clearcoatRoughness += geometryRoughness;\n\tmaterial.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );\n#endif\n#ifdef USE_DISPERSION\n\tmaterial.dispersion = dispersion;\n#endif\n#ifdef USE_IRIDESCENCE\n\tmaterial.iridescence = iridescence;\n\tmaterial.iridescenceIOR = iridescenceIOR;\n\t#ifdef USE_IRIDESCENCEMAP\n\t\tmaterial.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;\n\t#endif\n\t#ifdef USE_IRIDESCENCE_THICKNESSMAP\n\t\tmaterial.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;\n\t#else\n\t\tmaterial.iridescenceThickness = iridescenceThicknessMaximum;\n\t#endif\n#endif\n#ifdef USE_SHEEN\n\tmaterial.sheenColor = sheenColor;\n\t#ifdef USE_SHEEN_COLORMAP\n\t\tmaterial.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;\n\t#endif\n\tmaterial.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );\n\t#ifdef USE_SHEEN_ROUGHNESSMAP\n\t\tmaterial.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;\n\t#endif\n#endif\n#ifdef USE_ANISOTROPY\n\t#ifdef USE_ANISOTROPYMAP\n\t\tmat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );\n\t\tvec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;\n\t\tvec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;\n\t#else\n\t\tvec2 anisotropyV = anisotropyVector;\n\t#endif\n\tmaterial.anisotropy = length( anisotropyV );\n\tif( material.anisotropy == 0.0 ) {\n\t\tanisotropyV = vec2( 1.0, 0.0 );\n\t} else {\n\t\tanisotropyV /= material.anisotropy;\n\t\tmaterial.anisotropy = saturate( material.anisotropy );\n\t}\n\tmaterial.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );\n\tmaterial.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;\n\tmaterial.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;\n#endif',
  lights_physical_pars_fragment =
    'struct PhysicalMaterial {\n\tvec3 diffuseColor;\n\tfloat roughness;\n\tvec3 specularColor;\n\tfloat specularF90;\n\tfloat dispersion;\n\t#ifdef USE_CLEARCOAT\n\t\tfloat clearcoat;\n\t\tfloat clearcoatRoughness;\n\t\tvec3 clearcoatF0;\n\t\tfloat clearcoatF90;\n\t#endif\n\t#ifdef USE_IRIDESCENCE\n\t\tfloat iridescence;\n\t\tfloat iridescenceIOR;\n\t\tfloat iridescenceThickness;\n\t\tvec3 iridescenceFresnel;\n\t\tvec3 iridescenceF0;\n\t#endif\n\t#ifdef USE_SHEEN\n\t\tvec3 sheenColor;\n\t\tfloat sheenRoughness;\n\t#endif\n\t#ifdef IOR\n\t\tfloat ior;\n\t#endif\n\t#ifdef USE_TRANSMISSION\n\t\tfloat transmission;\n\t\tfloat transmissionAlpha;\n\t\tfloat thickness;\n\t\tfloat attenuationDistance;\n\t\tvec3 attenuationColor;\n\t#endif\n\t#ifdef USE_ANISOTROPY\n\t\tfloat anisotropy;\n\t\tfloat alphaT;\n\t\tvec3 anisotropyT;\n\t\tvec3 anisotropyB;\n\t#endif\n};\nvec3 clearcoatSpecularDirect = vec3( 0.0 );\nvec3 clearcoatSpecularIndirect = vec3( 0.0 );\nvec3 sheenSpecularDirect = vec3( 0.0 );\nvec3 sheenSpecularIndirect = vec3(0.0 );\nvec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {\n    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );\n    float x2 = x * x;\n    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );\n    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );\n}\nfloat V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {\n\tfloat a2 = pow2( alpha );\n\tfloat gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );\n\tfloat gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );\n\treturn 0.5 / max( gv + gl, EPSILON );\n}\nfloat D_GGX( const in float alpha, const in float dotNH ) {\n\tfloat a2 = pow2( alpha );\n\tfloat denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;\n\treturn RECIPROCAL_PI * a2 / pow2( denom );\n}\n#ifdef USE_ANISOTROPY\n\tfloat V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {\n\t\tfloat gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );\n\t\tfloat gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );\n\t\tfloat v = 0.5 / ( gv + gl );\n\t\treturn saturate(v);\n\t}\n\tfloat D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {\n\t\tfloat a2 = alphaT * alphaB;\n\t\thighp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );\n\t\thighp float v2 = dot( v, v );\n\t\tfloat w2 = a2 / v2;\n\t\treturn RECIPROCAL_PI * a2 * pow2 ( w2 );\n\t}\n#endif\n#ifdef USE_CLEARCOAT\n\tvec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {\n\t\tvec3 f0 = material.clearcoatF0;\n\t\tfloat f90 = material.clearcoatF90;\n\t\tfloat roughness = material.clearcoatRoughness;\n\t\tfloat alpha = pow2( roughness );\n\t\tvec3 halfDir = normalize( lightDir + viewDir );\n\t\tfloat dotNL = saturate( dot( normal, lightDir ) );\n\t\tfloat dotNV = saturate( dot( normal, viewDir ) );\n\t\tfloat dotNH = saturate( dot( normal, halfDir ) );\n\t\tfloat dotVH = saturate( dot( viewDir, halfDir ) );\n\t\tvec3 F = F_Schlick( f0, f90, dotVH );\n\t\tfloat V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );\n\t\tfloat D = D_GGX( alpha, dotNH );\n\t\treturn F * ( V * D );\n\t}\n#endif\nvec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {\n\tvec3 f0 = material.specularColor;\n\tfloat f90 = material.specularF90;\n\tfloat roughness = material.roughness;\n\tfloat alpha = pow2( roughness );\n\tvec3 halfDir = normalize( lightDir + viewDir );\n\tfloat dotNL = saturate( dot( normal, lightDir ) );\n\tfloat dotNV = saturate( dot( normal, viewDir ) );\n\tfloat dotNH = saturate( dot( normal, halfDir ) );\n\tfloat dotVH = saturate( dot( viewDir, halfDir ) );\n\tvec3 F = F_Schlick( f0, f90, dotVH );\n\t#ifdef USE_IRIDESCENCE\n\t\tF = mix( F, material.iridescenceFresnel, material.iridescence );\n\t#endif\n\t#ifdef USE_ANISOTROPY\n\t\tfloat dotTL = dot( material.anisotropyT, lightDir );\n\t\tfloat dotTV = dot( material.anisotropyT, viewDir );\n\t\tfloat dotTH = dot( material.anisotropyT, halfDir );\n\t\tfloat dotBL = dot( material.anisotropyB, lightDir );\n\t\tfloat dotBV = dot( material.anisotropyB, viewDir );\n\t\tfloat dotBH = dot( material.anisotropyB, halfDir );\n\t\tfloat V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );\n\t\tfloat D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );\n\t#else\n\t\tfloat V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );\n\t\tfloat D = D_GGX( alpha, dotNH );\n\t#endif\n\treturn F * ( V * D );\n}\nvec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {\n\tconst float LUT_SIZE = 64.0;\n\tconst float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;\n\tconst float LUT_BIAS = 0.5 / LUT_SIZE;\n\tfloat dotNV = saturate( dot( N, V ) );\n\tvec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );\n\tuv = uv * LUT_SCALE + LUT_BIAS;\n\treturn uv;\n}\nfloat LTC_ClippedSphereFormFactor( const in vec3 f ) {\n\tfloat l = length( f );\n\treturn max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );\n}\nvec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {\n\tfloat x = dot( v1, v2 );\n\tfloat y = abs( x );\n\tfloat a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;\n\tfloat b = 3.4175940 + ( 4.1616724 + y ) * y;\n\tfloat v = a / b;\n\tfloat theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;\n\treturn cross( v1, v2 ) * theta_sintheta;\n}\nvec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {\n\tvec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];\n\tvec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];\n\tvec3 lightNormal = cross( v1, v2 );\n\tif( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );\n\tvec3 T1, T2;\n\tT1 = normalize( V - N * dot( V, N ) );\n\tT2 = - cross( N, T1 );\n\tmat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );\n\tvec3 coords[ 4 ];\n\tcoords[ 0 ] = mat * ( rectCoords[ 0 ] - P );\n\tcoords[ 1 ] = mat * ( rectCoords[ 1 ] - P );\n\tcoords[ 2 ] = mat * ( rectCoords[ 2 ] - P );\n\tcoords[ 3 ] = mat * ( rectCoords[ 3 ] - P );\n\tcoords[ 0 ] = normalize( coords[ 0 ] );\n\tcoords[ 1 ] = normalize( coords[ 1 ] );\n\tcoords[ 2 ] = normalize( coords[ 2 ] );\n\tcoords[ 3 ] = normalize( coords[ 3 ] );\n\tvec3 vectorFormFactor = vec3( 0.0 );\n\tvectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );\n\tvectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );\n\tvectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );\n\tvectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );\n\tfloat result = LTC_ClippedSphereFormFactor( vectorFormFactor );\n\treturn vec3( result );\n}\n#if defined( USE_SHEEN )\nfloat D_Charlie( float roughness, float dotNH ) {\n\tfloat alpha = pow2( roughness );\n\tfloat invAlpha = 1.0 / alpha;\n\tfloat cos2h = dotNH * dotNH;\n\tfloat sin2h = max( 1.0 - cos2h, 0.0078125 );\n\treturn ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );\n}\nfloat V_Neubelt( float dotNV, float dotNL ) {\n\treturn saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );\n}\nvec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {\n\tvec3 halfDir = normalize( lightDir + viewDir );\n\tfloat dotNL = saturate( dot( normal, lightDir ) );\n\tfloat dotNV = saturate( dot( normal, viewDir ) );\n\tfloat dotNH = saturate( dot( normal, halfDir ) );\n\tfloat D = D_Charlie( sheenRoughness, dotNH );\n\tfloat V = V_Neubelt( dotNV, dotNL );\n\treturn sheenColor * ( D * V );\n}\n#endif\nfloat IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {\n\tfloat dotNV = saturate( dot( normal, viewDir ) );\n\tfloat r2 = roughness * roughness;\n\tfloat a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;\n\tfloat b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;\n\tfloat DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );\n\treturn saturate( DG * RECIPROCAL_PI );\n}\nvec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {\n\tfloat dotNV = saturate( dot( normal, viewDir ) );\n\tconst vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );\n\tconst vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );\n\tvec4 r = roughness * c0 + c1;\n\tfloat a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;\n\tvec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;\n\treturn fab;\n}\nvec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {\n\tvec2 fab = DFGApprox( normal, viewDir, roughness );\n\treturn specularColor * fab.x + specularF90 * fab.y;\n}\n#ifdef USE_IRIDESCENCE\nvoid computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {\n#else\nvoid computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {\n#endif\n\tvec2 fab = DFGApprox( normal, viewDir, roughness );\n\t#ifdef USE_IRIDESCENCE\n\t\tvec3 Fr = mix( specularColor, iridescenceF0, iridescence );\n\t#else\n\t\tvec3 Fr = specularColor;\n\t#endif\n\tvec3 FssEss = Fr * fab.x + specularF90 * fab.y;\n\tfloat Ess = fab.x + fab.y;\n\tfloat Ems = 1.0 - Ess;\n\tvec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;\tvec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );\n\tsingleScatter += FssEss;\n\tmultiScatter += Fms * Ems;\n}\n#if NUM_RECT_AREA_LIGHTS > 0\n\tvoid RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {\n\t\tvec3 normal = geometryNormal;\n\t\tvec3 viewDir = geometryViewDir;\n\t\tvec3 position = geometryPosition;\n\t\tvec3 lightPos = rectAreaLight.position;\n\t\tvec3 halfWidth = rectAreaLight.halfWidth;\n\t\tvec3 halfHeight = rectAreaLight.halfHeight;\n\t\tvec3 lightColor = rectAreaLight.color;\n\t\tfloat roughness = material.roughness;\n\t\tvec3 rectCoords[ 4 ];\n\t\trectCoords[ 0 ] = lightPos + halfWidth - halfHeight;\t\trectCoords[ 1 ] = lightPos - halfWidth - halfHeight;\n\t\trectCoords[ 2 ] = lightPos - halfWidth + halfHeight;\n\t\trectCoords[ 3 ] = lightPos + halfWidth + halfHeight;\n\t\tvec2 uv = LTC_Uv( normal, viewDir, roughness );\n\t\tvec4 t1 = texture2D( ltc_1, uv );\n\t\tvec4 t2 = texture2D( ltc_2, uv );\n\t\tmat3 mInv = mat3(\n\t\t\tvec3( t1.x, 0, t1.y ),\n\t\t\tvec3(    0, 1,    0 ),\n\t\t\tvec3( t1.z, 0, t1.w )\n\t\t);\n\t\tvec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );\n\t\treflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );\n\t\treflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );\n\t}\n#endif\nvoid RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {\n\tfloat dotNL = saturate( dot( geometryNormal, directLight.direction ) );\n\tvec3 irradiance = dotNL * directLight.color;\n\t#ifdef USE_CLEARCOAT\n\t\tfloat dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );\n\t\tvec3 ccIrradiance = dotNLcc * directLight.color;\n\t\tclearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );\n\t#endif\n\t#ifdef USE_SHEEN\n\t\tsheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );\n\t#endif\n\treflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );\n\treflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}\nvoid RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {\n\treflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}\nvoid RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {\n\t#ifdef USE_CLEARCOAT\n\t\tclearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );\n\t#endif\n\t#ifdef USE_SHEEN\n\t\tsheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );\n\t#endif\n\tvec3 singleScattering = vec3( 0.0 );\n\tvec3 multiScattering = vec3( 0.0 );\n\tvec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;\n\t#ifdef USE_IRIDESCENCE\n\t\tcomputeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );\n\t#else\n\t\tcomputeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );\n\t#endif\n\tvec3 totalScattering = singleScattering + multiScattering;\n\tvec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );\n\treflectedLight.indirectSpecular += radiance * singleScattering;\n\treflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;\n\treflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;\n}\n#define RE_Direct\t\t\t\tRE_Direct_Physical\n#define RE_Direct_RectArea\t\tRE_Direct_RectArea_Physical\n#define RE_IndirectDiffuse\t\tRE_IndirectDiffuse_Physical\n#define RE_IndirectSpecular\t\tRE_IndirectSpecular_Physical\nfloat computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {\n\treturn saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );\n}',
  lights_fragment_begin =
    '\nvec3 geometryPosition = - vViewPosition;\nvec3 geometryNormal = normal;\nvec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );\nvec3 geometryClearcoatNormal = vec3( 0.0 );\n#ifdef USE_CLEARCOAT\n\tgeometryClearcoatNormal = clearcoatNormal;\n#endif\n#ifdef USE_IRIDESCENCE\n\tfloat dotNVi = saturate( dot( normal, geometryViewDir ) );\n\tif ( material.iridescenceThickness == 0.0 ) {\n\t\tmaterial.iridescence = 0.0;\n\t} else {\n\t\tmaterial.iridescence = saturate( material.iridescence );\n\t}\n\tif ( material.iridescence > 0.0 ) {\n\t\tmaterial.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );\n\t\tmaterial.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );\n\t}\n#endif\nIncidentLight directLight;\n#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )\n\tPointLight pointLight;\n\t#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0\n\tPointLightShadow pointLightShadow;\n\t#endif\n\t#pragma unroll_loop_start\n\tfor ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {\n\t\tpointLight = pointLights[ i ];\n\t\tgetPointLightInfo( pointLight, geometryPosition, directLight );\n\t\t#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )\n\t\tpointLightShadow = pointLightShadows[ i ];\n\t\tdirectLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;\n\t\t#endif\n\t\tRE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n\t}\n\t#pragma unroll_loop_end\n#endif\n#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )\n\tSpotLight spotLight;\n\tvec4 spotColor;\n\tvec3 spotLightCoord;\n\tbool inSpotLightMap;\n\t#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0\n\tSpotLightShadow spotLightShadow;\n\t#endif\n\t#pragma unroll_loop_start\n\tfor ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {\n\t\tspotLight = spotLights[ i ];\n\t\tgetSpotLightInfo( spotLight, geometryPosition, directLight );\n\t\t#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )\n\t\t#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX\n\t\t#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )\n\t\t#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS\n\t\t#else\n\t\t#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )\n\t\t#endif\n\t\t#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )\n\t\t\tspotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;\n\t\t\tinSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );\n\t\t\tspotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );\n\t\t\tdirectLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;\n\t\t#endif\n\t\t#undef SPOT_LIGHT_MAP_INDEX\n\t\t#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )\n\t\tspotLightShadow = spotLightShadows[ i ];\n\t\tdirectLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;\n\t\t#endif\n\t\tRE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n\t}\n\t#pragma unroll_loop_end\n#endif\n#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )\n\tDirectionalLight directionalLight;\n\t#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0\n\tDirectionalLightShadow directionalLightShadow;\n\t#endif\n\t#pragma unroll_loop_start\n\tfor ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {\n\t\tdirectionalLight = directionalLights[ i ];\n\t\tgetDirectionalLightInfo( directionalLight, directLight );\n\t\t#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )\n\t\tdirectionalLightShadow = directionalLightShadows[ i ];\n\t\tdirectLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;\n\t\t#endif\n\t\tRE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n\t}\n\t#pragma unroll_loop_end\n#endif\n#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )\n\tRectAreaLight rectAreaLight;\n\t#pragma unroll_loop_start\n\tfor ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {\n\t\trectAreaLight = rectAreaLights[ i ];\n\t\tRE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n\t}\n\t#pragma unroll_loop_end\n#endif\n#if defined( RE_IndirectDiffuse )\n\tvec3 iblIrradiance = vec3( 0.0 );\n\tvec3 irradiance = getAmbientLightIrradiance( ambientLightColor );\n\t#if defined( USE_LIGHT_PROBES )\n\t\tirradiance += getLightProbeIrradiance( lightProbe, geometryNormal );\n\t#endif\n\t#if ( NUM_HEMI_LIGHTS > 0 )\n\t\t#pragma unroll_loop_start\n\t\tfor ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {\n\t\t\tirradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );\n\t\t}\n\t\t#pragma unroll_loop_end\n\t#endif\n#endif\n#if defined( RE_IndirectSpecular )\n\tvec3 radiance = vec3( 0.0 );\n\tvec3 clearcoatRadiance = vec3( 0.0 );\n#endif',
  lights_fragment_maps =
    '#if defined( RE_IndirectDiffuse )\n\t#ifdef USE_LIGHTMAP\n\t\tvec4 lightMapTexel = texture2D( lightMap, vLightMapUv );\n\t\tvec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;\n\t\tirradiance += lightMapIrradiance;\n\t#endif\n\t#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )\n\t\tiblIrradiance += getIBLIrradiance( geometryNormal );\n\t#endif\n#endif\n#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )\n\t#ifdef USE_ANISOTROPY\n\t\tradiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );\n\t#else\n\t\tradiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );\n\t#endif\n\t#ifdef USE_CLEARCOAT\n\t\tclearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );\n\t#endif\n#endif',
  lights_fragment_end =
    '#if defined( RE_IndirectDiffuse )\n\tRE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n#endif\n#if defined( RE_IndirectSpecular )\n\tRE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n#endif',
  logdepthbuf_fragment =
    '#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )\n\tgl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;\n#endif',
  logdepthbuf_pars_fragment =
    '#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )\n\tuniform float logDepthBufFC;\n\tvarying float vFragDepth;\n\tvarying float vIsPerspective;\n#endif',
  logdepthbuf_pars_vertex =
    '#ifdef USE_LOGARITHMIC_DEPTH_BUFFER\n\tvarying float vFragDepth;\n\tvarying float vIsPerspective;\n#endif',
  logdepthbuf_vertex =
    '#ifdef USE_LOGARITHMIC_DEPTH_BUFFER\n\tvFragDepth = 1.0 + gl_Position.w;\n\tvIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );\n#endif',
  map_fragment =
    '#ifdef USE_MAP\n\tvec4 sampledDiffuseColor = texture2D( map, vMapUv );\n\t#ifdef DECODE_VIDEO_TEXTURE\n\t\tsampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );\n\t#endif\n\tdiffuseColor *= sampledDiffuseColor;\n#endif',
  map_pars_fragment = '#ifdef USE_MAP\n\tuniform sampler2D map;\n#endif',
  map_particle_fragment =
    '#if defined( USE_MAP ) || defined( USE_ALPHAMAP )\n\t#if defined( USE_POINTS_UV )\n\t\tvec2 uv = vUv;\n\t#else\n\t\tvec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;\n\t#endif\n#endif\n#ifdef USE_MAP\n\tdiffuseColor *= texture2D( map, uv );\n#endif\n#ifdef USE_ALPHAMAP\n\tdiffuseColor.a *= texture2D( alphaMap, uv ).g;\n#endif',
  map_particle_pars_fragment =
    '#if defined( USE_POINTS_UV )\n\tvarying vec2 vUv;\n#else\n\t#if defined( USE_MAP ) || defined( USE_ALPHAMAP )\n\t\tuniform mat3 uvTransform;\n\t#endif\n#endif\n#ifdef USE_MAP\n\tuniform sampler2D map;\n#endif\n#ifdef USE_ALPHAMAP\n\tuniform sampler2D alphaMap;\n#endif',
  metalnessmap_fragment =
    'float metalnessFactor = metalness;\n#ifdef USE_METALNESSMAP\n\tvec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );\n\tmetalnessFactor *= texelMetalness.b;\n#endif',
  metalnessmap_pars_fragment = '#ifdef USE_METALNESSMAP\n\tuniform sampler2D metalnessMap;\n#endif',
  morphinstance_vertex =
    '#ifdef USE_INSTANCING_MORPH\n\tfloat morphTargetInfluences[ MORPHTARGETS_COUNT ];\n\tfloat morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;\n\tfor ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {\n\t\tmorphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;\n\t}\n#endif',
  morphcolor_vertex =
    '#if defined( USE_MORPHCOLORS )\n\tvColor *= morphTargetBaseInfluence;\n\tfor ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {\n\t\t#if defined( USE_COLOR_ALPHA )\n\t\t\tif ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];\n\t\t#elif defined( USE_COLOR )\n\t\t\tif ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];\n\t\t#endif\n\t}\n#endif',
  morphnormal_vertex =
    '#ifdef USE_MORPHNORMALS\n\tobjectNormal *= morphTargetBaseInfluence;\n\tfor ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {\n\t\tif ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];\n\t}\n#endif',
  morphtarget_pars_vertex =
    '#ifdef USE_MORPHTARGETS\n\t#ifndef USE_INSTANCING_MORPH\n\t\tuniform float morphTargetBaseInfluence;\n\t\tuniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];\n\t#endif\n\tuniform sampler2DArray morphTargetsTexture;\n\tuniform ivec2 morphTargetsTextureSize;\n\tvec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {\n\t\tint texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;\n\t\tint y = texelIndex / morphTargetsTextureSize.x;\n\t\tint x = texelIndex - y * morphTargetsTextureSize.x;\n\t\tivec3 morphUV = ivec3( x, y, morphTargetIndex );\n\t\treturn texelFetch( morphTargetsTexture, morphUV, 0 );\n\t}\n#endif',
  morphtarget_vertex =
    '#ifdef USE_MORPHTARGETS\n\ttransformed *= morphTargetBaseInfluence;\n\tfor ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {\n\t\tif ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];\n\t}\n#endif',
  normal_fragment_begin =
    'float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;\n#ifdef FLAT_SHADED\n\tvec3 fdx = dFdx( vViewPosition );\n\tvec3 fdy = dFdy( vViewPosition );\n\tvec3 normal = normalize( cross( fdx, fdy ) );\n#else\n\tvec3 normal = normalize( vNormal );\n\t#ifdef DOUBLE_SIDED\n\t\tnormal *= faceDirection;\n\t#endif\n#endif\n#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )\n\t#ifdef USE_TANGENT\n\t\tmat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );\n\t#else\n\t\tmat3 tbn = getTangentFrame( - vViewPosition, normal,\n\t\t#if defined( USE_NORMALMAP )\n\t\t\tvNormalMapUv\n\t\t#elif defined( USE_CLEARCOAT_NORMALMAP )\n\t\t\tvClearcoatNormalMapUv\n\t\t#else\n\t\t\tvUv\n\t\t#endif\n\t\t);\n\t#endif\n\t#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )\n\t\ttbn[0] *= faceDirection;\n\t\ttbn[1] *= faceDirection;\n\t#endif\n#endif\n#ifdef USE_CLEARCOAT_NORMALMAP\n\t#ifdef USE_TANGENT\n\t\tmat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );\n\t#else\n\t\tmat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );\n\t#endif\n\t#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )\n\t\ttbn2[0] *= faceDirection;\n\t\ttbn2[1] *= faceDirection;\n\t#endif\n#endif\nvec3 nonPerturbedNormal = normal;',
  normal_fragment_maps =
    '#ifdef USE_NORMALMAP_OBJECTSPACE\n\tnormal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;\n\t#ifdef FLIP_SIDED\n\t\tnormal = - normal;\n\t#endif\n\t#ifdef DOUBLE_SIDED\n\t\tnormal = normal * faceDirection;\n\t#endif\n\tnormal = normalize( normalMatrix * normal );\n#elif defined( USE_NORMALMAP_TANGENTSPACE )\n\tvec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;\n\tmapN.xy *= normalScale;\n\tnormal = normalize( tbn * mapN );\n#elif defined( USE_BUMPMAP )\n\tnormal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );\n#endif',
  normal_pars_fragment =
    '#ifndef FLAT_SHADED\n\tvarying vec3 vNormal;\n\t#ifdef USE_TANGENT\n\t\tvarying vec3 vTangent;\n\t\tvarying vec3 vBitangent;\n\t#endif\n#endif',
  normal_pars_vertex =
    '#ifndef FLAT_SHADED\n\tvarying vec3 vNormal;\n\t#ifdef USE_TANGENT\n\t\tvarying vec3 vTangent;\n\t\tvarying vec3 vBitangent;\n\t#endif\n#endif',
  normal_vertex =
    '#ifndef FLAT_SHADED\n\tvNormal = normalize( transformedNormal );\n\t#ifdef USE_TANGENT\n\t\tvTangent = normalize( transformedTangent );\n\t\tvBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );\n\t#endif\n#endif',
  normalmap_pars_fragment =
    '#ifdef USE_NORMALMAP\n\tuniform sampler2D normalMap;\n\tuniform vec2 normalScale;\n#endif\n#ifdef USE_NORMALMAP_OBJECTSPACE\n\tuniform mat3 normalMatrix;\n#endif\n#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )\n\tmat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {\n\t\tvec3 q0 = dFdx( eye_pos.xyz );\n\t\tvec3 q1 = dFdy( eye_pos.xyz );\n\t\tvec2 st0 = dFdx( uv.st );\n\t\tvec2 st1 = dFdy( uv.st );\n\t\tvec3 N = surf_norm;\n\t\tvec3 q1perp = cross( q1, N );\n\t\tvec3 q0perp = cross( N, q0 );\n\t\tvec3 T = q1perp * st0.x + q0perp * st1.x;\n\t\tvec3 B = q1perp * st0.y + q0perp * st1.y;\n\t\tfloat det = max( dot( T, T ), dot( B, B ) );\n\t\tfloat scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );\n\t\treturn mat3( T * scale, B * scale, N );\n\t}\n#endif',
  clearcoat_normal_fragment_begin =
    '#ifdef USE_CLEARCOAT\n\tvec3 clearcoatNormal = nonPerturbedNormal;\n#endif',
  clearcoat_normal_fragment_maps =
    '#ifdef USE_CLEARCOAT_NORMALMAP\n\tvec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;\n\tclearcoatMapN.xy *= clearcoatNormalScale;\n\tclearcoatNormal = normalize( tbn2 * clearcoatMapN );\n#endif',
  clearcoat_pars_fragment =
    '#ifdef USE_CLEARCOATMAP\n\tuniform sampler2D clearcoatMap;\n#endif\n#ifdef USE_CLEARCOAT_NORMALMAP\n\tuniform sampler2D clearcoatNormalMap;\n\tuniform vec2 clearcoatNormalScale;\n#endif\n#ifdef USE_CLEARCOAT_ROUGHNESSMAP\n\tuniform sampler2D clearcoatRoughnessMap;\n#endif',
  iridescence_pars_fragment =
    '#ifdef USE_IRIDESCENCEMAP\n\tuniform sampler2D iridescenceMap;\n#endif\n#ifdef USE_IRIDESCENCE_THICKNESSMAP\n\tuniform sampler2D iridescenceThicknessMap;\n#endif',
  opaque_fragment =
    '#ifdef OPAQUE\ndiffuseColor.a = 1.0;\n#endif\n#ifdef USE_TRANSMISSION\ndiffuseColor.a *= material.transmissionAlpha;\n#endif\ngl_FragColor = vec4( outgoingLight, diffuseColor.a );',
  packing =
    'vec3 packNormalToRGB( const in vec3 normal ) {\n\treturn normalize( normal ) * 0.5 + 0.5;\n}\nvec3 unpackRGBToNormal( const in vec3 rgb ) {\n\treturn 2.0 * rgb.xyz - 1.0;\n}\nconst float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;\nconst float Inv255 = 1. / 255.;\nconst vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );\nconst vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );\nconst vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );\nconst vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );\nvec4 packDepthToRGBA( const in float v ) {\n\tif( v <= 0.0 )\n\t\treturn vec4( 0., 0., 0., 0. );\n\tif( v >= 1.0 )\n\t\treturn vec4( 1., 1., 1., 1. );\n\tfloat vuf;\n\tfloat af = modf( v * PackFactors.a, vuf );\n\tfloat bf = modf( vuf * ShiftRight8, vuf );\n\tfloat gf = modf( vuf * ShiftRight8, vuf );\n\treturn vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );\n}\nvec3 packDepthToRGB( const in float v ) {\n\tif( v <= 0.0 )\n\t\treturn vec3( 0., 0., 0. );\n\tif( v >= 1.0 )\n\t\treturn vec3( 1., 1., 1. );\n\tfloat vuf;\n\tfloat bf = modf( v * PackFactors.b, vuf );\n\tfloat gf = modf( vuf * ShiftRight8, vuf );\n\treturn vec3( vuf * Inv255, gf * PackUpscale, bf );\n}\nvec2 packDepthToRG( const in float v ) {\n\tif( v <= 0.0 )\n\t\treturn vec2( 0., 0. );\n\tif( v >= 1.0 )\n\t\treturn vec2( 1., 1. );\n\tfloat vuf;\n\tfloat gf = modf( v * 256., vuf );\n\treturn vec2( vuf * Inv255, gf );\n}\nfloat unpackRGBAToDepth( const in vec4 v ) {\n\treturn dot( v, UnpackFactors4 );\n}\nfloat unpackRGBToDepth( const in vec3 v ) {\n\treturn dot( v, UnpackFactors3 );\n}\nfloat unpackRGToDepth( const in vec2 v ) {\n\treturn v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;\n}\nvec4 pack2HalfToRGBA( const in vec2 v ) {\n\tvec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );\n\treturn vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );\n}\nvec2 unpackRGBATo2Half( const in vec4 v ) {\n\treturn vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );\n}\nfloat viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {\n\treturn ( viewZ + near ) / ( near - far );\n}\nfloat orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {\n\treturn depth * ( near - far ) - near;\n}\nfloat viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {\n\treturn ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );\n}\nfloat perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {\n\treturn ( near * far ) / ( ( far - near ) * depth - far );\n}',
  premultiplied_alpha_fragment = '#ifdef PREMULTIPLIED_ALPHA\n\tgl_FragColor.rgb *= gl_FragColor.a;\n#endif',
  project_vertex =
    'vec4 mvPosition = vec4( transformed, 1.0 );\n#ifdef USE_BATCHING\n\tmvPosition = batchingMatrix * mvPosition;\n#endif\n#ifdef USE_INSTANCING\n\tmvPosition = instanceMatrix * mvPosition;\n#endif\nmvPosition = modelViewMatrix * mvPosition;\ngl_Position = projectionMatrix * mvPosition;',
  dithering_fragment = '#ifdef DITHERING\n\tgl_FragColor.rgb = dithering( gl_FragColor.rgb );\n#endif',
  dithering_pars_fragment =
    '#ifdef DITHERING\n\tvec3 dithering( vec3 color ) {\n\t\tfloat grid_position = rand( gl_FragCoord.xy );\n\t\tvec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );\n\t\tdither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );\n\t\treturn color + dither_shift_RGB;\n\t}\n#endif',
  roughnessmap_fragment =
    'float roughnessFactor = roughness;\n#ifdef USE_ROUGHNESSMAP\n\tvec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );\n\troughnessFactor *= texelRoughness.g;\n#endif',
  roughnessmap_pars_fragment = '#ifdef USE_ROUGHNESSMAP\n\tuniform sampler2D roughnessMap;\n#endif',
  shadowmap_pars_fragment =
    '#if NUM_SPOT_LIGHT_COORDS > 0\n\tvarying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];\n#endif\n#if NUM_SPOT_LIGHT_MAPS > 0\n\tuniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];\n#endif\n#ifdef USE_SHADOWMAP\n\t#if NUM_DIR_LIGHT_SHADOWS > 0\n\t\tuniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];\n\t\tvarying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];\n\t\tstruct DirectionalLightShadow {\n\t\t\tfloat shadowIntensity;\n\t\t\tfloat shadowBias;\n\t\t\tfloat shadowNormalBias;\n\t\t\tfloat shadowRadius;\n\t\t\tvec2 shadowMapSize;\n\t\t};\n\t\tuniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];\n\t#endif\n\t#if NUM_SPOT_LIGHT_SHADOWS > 0\n\t\tuniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];\n\t\tstruct SpotLightShadow {\n\t\t\tfloat shadowIntensity;\n\t\t\tfloat shadowBias;\n\t\t\tfloat shadowNormalBias;\n\t\t\tfloat shadowRadius;\n\t\t\tvec2 shadowMapSize;\n\t\t};\n\t\tuniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];\n\t#endif\n\t#if NUM_POINT_LIGHT_SHADOWS > 0\n\t\tuniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];\n\t\tvarying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];\n\t\tstruct PointLightShadow {\n\t\t\tfloat shadowIntensity;\n\t\t\tfloat shadowBias;\n\t\t\tfloat shadowNormalBias;\n\t\t\tfloat shadowRadius;\n\t\t\tvec2 shadowMapSize;\n\t\t\tfloat shadowCameraNear;\n\t\t\tfloat shadowCameraFar;\n\t\t};\n\t\tuniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];\n\t#endif\n\tfloat texture2DCompare( sampler2D depths, vec2 uv, float compare ) {\n\t\tfloat depth = unpackRGBAToDepth( texture2D( depths, uv ) );\n\t\t#ifdef USE_REVERSED_DEPTH_BUFFER\n\t\t\treturn step( depth, compare );\n\t\t#else\n\t\t\treturn step( compare, depth );\n\t\t#endif\n\t}\n\tvec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {\n\t\treturn unpackRGBATo2Half( texture2D( shadow, uv ) );\n\t}\n\tfloat VSMShadow( sampler2D shadow, vec2 uv, float compare ) {\n\t\tfloat occlusion = 1.0;\n\t\tvec2 distribution = texture2DDistribution( shadow, uv );\n\t\t#ifdef USE_REVERSED_DEPTH_BUFFER\n\t\t\tfloat hard_shadow = step( distribution.x, compare );\n\t\t#else\n\t\t\tfloat hard_shadow = step( compare, distribution.x );\n\t\t#endif\n\t\tif ( hard_shadow != 1.0 ) {\n\t\t\tfloat distance = compare - distribution.x;\n\t\t\tfloat variance = max( 0.00000, distribution.y * distribution.y );\n\t\t\tfloat softness_probability = variance / (variance + distance * distance );\t\t\tsoftness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );\t\t\tocclusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );\n\t\t}\n\t\treturn occlusion;\n\t}\n\tfloat getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {\n\t\tfloat shadow = 1.0;\n\t\tshadowCoord.xyz /= shadowCoord.w;\n\t\tshadowCoord.z += shadowBias;\n\t\tbool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;\n\t\tbool frustumTest = inFrustum && shadowCoord.z <= 1.0;\n\t\tif ( frustumTest ) {\n\t\t#if defined( SHADOWMAP_TYPE_PCF )\n\t\t\tvec2 texelSize = vec2( 1.0 ) / shadowMapSize;\n\t\t\tfloat dx0 = - texelSize.x * shadowRadius;\n\t\t\tfloat dy0 = - texelSize.y * shadowRadius;\n\t\t\tfloat dx1 = + texelSize.x * shadowRadius;\n\t\t\tfloat dy1 = + texelSize.y * shadowRadius;\n\t\t\tfloat dx2 = dx0 / 2.0;\n\t\t\tfloat dy2 = dy0 / 2.0;\n\t\t\tfloat dx3 = dx1 / 2.0;\n\t\t\tfloat dy3 = dy1 / 2.0;\n\t\t\tshadow = (\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )\n\t\t\t) * ( 1.0 / 17.0 );\n\t\t#elif defined( SHADOWMAP_TYPE_PCF_SOFT )\n\t\t\tvec2 texelSize = vec2( 1.0 ) / shadowMapSize;\n\t\t\tfloat dx = texelSize.x;\n\t\t\tfloat dy = texelSize.y;\n\t\t\tvec2 uv = shadowCoord.xy;\n\t\t\tvec2 f = fract( uv * shadowMapSize + 0.5 );\n\t\t\tuv -= f * texelSize;\n\t\t\tshadow = (\n\t\t\t\ttexture2DCompare( shadowMap, uv, shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +\n\t\t\t\tmix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),\n\t\t\t\t\t texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),\n\t\t\t\t\t f.x ) +\n\t\t\t\tmix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),\n\t\t\t\t\t texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),\n\t\t\t\t\t f.x ) +\n\t\t\t\tmix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),\n\t\t\t\t\t texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),\n\t\t\t\t\t f.y ) +\n\t\t\t\tmix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),\n\t\t\t\t\t texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),\n\t\t\t\t\t f.y ) +\n\t\t\t\tmix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),\n\t\t\t\t\t\t  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),\n\t\t\t\t\t\t  f.x ),\n\t\t\t\t\t mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),\n\t\t\t\t\t\t  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),\n\t\t\t\t\t\t  f.x ),\n\t\t\t\t\t f.y )\n\t\t\t) * ( 1.0 / 9.0 );\n\t\t#elif defined( SHADOWMAP_TYPE_VSM )\n\t\t\tshadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );\n\t\t#else\n\t\t\tshadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );\n\t\t#endif\n\t\t}\n\t\treturn mix( 1.0, shadow, shadowIntensity );\n\t}\n\tvec2 cubeToUV( vec3 v, float texelSizeY ) {\n\t\tvec3 absV = abs( v );\n\t\tfloat scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );\n\t\tabsV *= scaleToCube;\n\t\tv *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );\n\t\tvec2 planar = v.xy;\n\t\tfloat almostATexel = 1.5 * texelSizeY;\n\t\tfloat almostOne = 1.0 - almostATexel;\n\t\tif ( absV.z >= almostOne ) {\n\t\t\tif ( v.z > 0.0 )\n\t\t\t\tplanar.x = 4.0 - v.x;\n\t\t} else if ( absV.x >= almostOne ) {\n\t\t\tfloat signX = sign( v.x );\n\t\t\tplanar.x = v.z * signX + 2.0 * signX;\n\t\t} else if ( absV.y >= almostOne ) {\n\t\t\tfloat signY = sign( v.y );\n\t\t\tplanar.x = v.x + 2.0 * signY + 2.0;\n\t\t\tplanar.y = v.z * signY - 2.0;\n\t\t}\n\t\treturn vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );\n\t}\n\tfloat getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {\n\t\tfloat shadow = 1.0;\n\t\tvec3 lightToPosition = shadowCoord.xyz;\n\t\t\n\t\tfloat lightToPositionLength = length( lightToPosition );\n\t\tif ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {\n\t\t\tfloat dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );\t\t\tdp += shadowBias;\n\t\t\tvec3 bd3D = normalize( lightToPosition );\n\t\t\tvec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );\n\t\t\t#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )\n\t\t\t\tvec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;\n\t\t\t\tshadow = (\n\t\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +\n\t\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +\n\t\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +\n\t\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +\n\t\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +\n\t\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +\n\t\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +\n\t\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +\n\t\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )\n\t\t\t\t) * ( 1.0 / 9.0 );\n\t\t\t#else\n\t\t\t\tshadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );\n\t\t\t#endif\n\t\t}\n\t\treturn mix( 1.0, shadow, shadowIntensity );\n\t}\n#endif',
  shadowmap_pars_vertex =
    '#if NUM_SPOT_LIGHT_COORDS > 0\n\tuniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];\n\tvarying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];\n#endif\n#ifdef USE_SHADOWMAP\n\t#if NUM_DIR_LIGHT_SHADOWS > 0\n\t\tuniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];\n\t\tvarying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];\n\t\tstruct DirectionalLightShadow {\n\t\t\tfloat shadowIntensity;\n\t\t\tfloat shadowBias;\n\t\t\tfloat shadowNormalBias;\n\t\t\tfloat shadowRadius;\n\t\t\tvec2 shadowMapSize;\n\t\t};\n\t\tuniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];\n\t#endif\n\t#if NUM_SPOT_LIGHT_SHADOWS > 0\n\t\tstruct SpotLightShadow {\n\t\t\tfloat shadowIntensity;\n\t\t\tfloat shadowBias;\n\t\t\tfloat shadowNormalBias;\n\t\t\tfloat shadowRadius;\n\t\t\tvec2 shadowMapSize;\n\t\t};\n\t\tuniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];\n\t#endif\n\t#if NUM_POINT_LIGHT_SHADOWS > 0\n\t\tuniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];\n\t\tvarying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];\n\t\tstruct PointLightShadow {\n\t\t\tfloat shadowIntensity;\n\t\t\tfloat shadowBias;\n\t\t\tfloat shadowNormalBias;\n\t\t\tfloat shadowRadius;\n\t\t\tvec2 shadowMapSize;\n\t\t\tfloat shadowCameraNear;\n\t\t\tfloat shadowCameraFar;\n\t\t};\n\t\tuniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];\n\t#endif\n#endif',
  shadowmap_vertex =
    '#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )\n\tvec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );\n\tvec4 shadowWorldPosition;\n#endif\n#if defined( USE_SHADOWMAP )\n\t#if NUM_DIR_LIGHT_SHADOWS > 0\n\t\t#pragma unroll_loop_start\n\t\tfor ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {\n\t\t\tshadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );\n\t\t\tvDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;\n\t\t}\n\t\t#pragma unroll_loop_end\n\t#endif\n\t#if NUM_POINT_LIGHT_SHADOWS > 0\n\t\t#pragma unroll_loop_start\n\t\tfor ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {\n\t\t\tshadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );\n\t\t\tvPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;\n\t\t}\n\t\t#pragma unroll_loop_end\n\t#endif\n#endif\n#if NUM_SPOT_LIGHT_COORDS > 0\n\t#pragma unroll_loop_start\n\tfor ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {\n\t\tshadowWorldPosition = worldPosition;\n\t\t#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )\n\t\t\tshadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;\n\t\t#endif\n\t\tvSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;\n\t}\n\t#pragma unroll_loop_end\n#endif',
  shadowmask_pars_fragment =
    'float getShadowMask() {\n\tfloat shadow = 1.0;\n\t#ifdef USE_SHADOWMAP\n\t#if NUM_DIR_LIGHT_SHADOWS > 0\n\tDirectionalLightShadow directionalLight;\n\t#pragma unroll_loop_start\n\tfor ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {\n\t\tdirectionalLight = directionalLightShadows[ i ];\n\t\tshadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;\n\t}\n\t#pragma unroll_loop_end\n\t#endif\n\t#if NUM_SPOT_LIGHT_SHADOWS > 0\n\tSpotLightShadow spotLight;\n\t#pragma unroll_loop_start\n\tfor ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {\n\t\tspotLight = spotLightShadows[ i ];\n\t\tshadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;\n\t}\n\t#pragma unroll_loop_end\n\t#endif\n\t#if NUM_POINT_LIGHT_SHADOWS > 0\n\tPointLightShadow pointLight;\n\t#pragma unroll_loop_start\n\tfor ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {\n\t\tpointLight = pointLightShadows[ i ];\n\t\tshadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;\n\t}\n\t#pragma unroll_loop_end\n\t#endif\n\t#endif\n\treturn shadow;\n}',
  skinbase_vertex =
    '#ifdef USE_SKINNING\n\tmat4 boneMatX = getBoneMatrix( skinIndex.x );\n\tmat4 boneMatY = getBoneMatrix( skinIndex.y );\n\tmat4 boneMatZ = getBoneMatrix( skinIndex.z );\n\tmat4 boneMatW = getBoneMatrix( skinIndex.w );\n#endif',
  skinning_pars_vertex =
    '#ifdef USE_SKINNING\n\tuniform mat4 bindMatrix;\n\tuniform mat4 bindMatrixInverse;\n\tuniform highp sampler2D boneTexture;\n\tmat4 getBoneMatrix( const in float i ) {\n\t\tint size = textureSize( boneTexture, 0 ).x;\n\t\tint j = int( i ) * 4;\n\t\tint x = j % size;\n\t\tint y = j / size;\n\t\tvec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );\n\t\tvec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );\n\t\tvec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );\n\t\tvec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );\n\t\treturn mat4( v1, v2, v3, v4 );\n\t}\n#endif',
  skinning_vertex =
    '#ifdef USE_SKINNING\n\tvec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );\n\tvec4 skinned = vec4( 0.0 );\n\tskinned += boneMatX * skinVertex * skinWeight.x;\n\tskinned += boneMatY * skinVertex * skinWeight.y;\n\tskinned += boneMatZ * skinVertex * skinWeight.z;\n\tskinned += boneMatW * skinVertex * skinWeight.w;\n\ttransformed = ( bindMatrixInverse * skinned ).xyz;\n#endif',
  skinnormal_vertex =
    '#ifdef USE_SKINNING\n\tmat4 skinMatrix = mat4( 0.0 );\n\tskinMatrix += skinWeight.x * boneMatX;\n\tskinMatrix += skinWeight.y * boneMatY;\n\tskinMatrix += skinWeight.z * boneMatZ;\n\tskinMatrix += skinWeight.w * boneMatW;\n\tskinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;\n\tobjectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;\n\t#ifdef USE_TANGENT\n\t\tobjectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;\n\t#endif\n#endif',
  specularmap_fragment =
    'float specularStrength;\n#ifdef USE_SPECULARMAP\n\tvec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );\n\tspecularStrength = texelSpecular.r;\n#else\n\tspecularStrength = 1.0;\n#endif',
  specularmap_pars_fragment = '#ifdef USE_SPECULARMAP\n\tuniform sampler2D specularMap;\n#endif',
  tonemapping_fragment =
    '#if defined( TONE_MAPPING )\n\tgl_FragColor.rgb = toneMapping( gl_FragColor.rgb );\n#endif',
  tonemapping_pars_fragment =
    '#ifndef saturate\n#define saturate( a ) clamp( a, 0.0, 1.0 )\n#endif\nuniform float toneMappingExposure;\nvec3 LinearToneMapping( vec3 color ) {\n\treturn saturate( toneMappingExposure * color );\n}\nvec3 ReinhardToneMapping( vec3 color ) {\n\tcolor *= toneMappingExposure;\n\treturn saturate( color / ( vec3( 1.0 ) + color ) );\n}\nvec3 CineonToneMapping( vec3 color ) {\n\tcolor *= toneMappingExposure;\n\tcolor = max( vec3( 0.0 ), color - 0.004 );\n\treturn pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );\n}\nvec3 RRTAndODTFit( vec3 v ) {\n\tvec3 a = v * ( v + 0.0245786 ) - 0.000090537;\n\tvec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;\n\treturn a / b;\n}\nvec3 ACESFilmicToneMapping( vec3 color ) {\n\tconst mat3 ACESInputMat = mat3(\n\t\tvec3( 0.59719, 0.07600, 0.02840 ),\t\tvec3( 0.35458, 0.90834, 0.13383 ),\n\t\tvec3( 0.04823, 0.01566, 0.83777 )\n\t);\n\tconst mat3 ACESOutputMat = mat3(\n\t\tvec3(  1.60475, -0.10208, -0.00327 ),\t\tvec3( -0.53108,  1.10813, -0.07276 ),\n\t\tvec3( -0.07367, -0.00605,  1.07602 )\n\t);\n\tcolor *= toneMappingExposure / 0.6;\n\tcolor = ACESInputMat * color;\n\tcolor = RRTAndODTFit( color );\n\tcolor = ACESOutputMat * color;\n\treturn saturate( color );\n}\nconst mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(\n\tvec3( 1.6605, - 0.1246, - 0.0182 ),\n\tvec3( - 0.5876, 1.1329, - 0.1006 ),\n\tvec3( - 0.0728, - 0.0083, 1.1187 )\n);\nconst mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(\n\tvec3( 0.6274, 0.0691, 0.0164 ),\n\tvec3( 0.3293, 0.9195, 0.0880 ),\n\tvec3( 0.0433, 0.0113, 0.8956 )\n);\nvec3 agxDefaultContrastApprox( vec3 x ) {\n\tvec3 x2 = x * x;\n\tvec3 x4 = x2 * x2;\n\treturn + 15.5 * x4 * x2\n\t\t- 40.14 * x4 * x\n\t\t+ 31.96 * x4\n\t\t- 6.868 * x2 * x\n\t\t+ 0.4298 * x2\n\t\t+ 0.1191 * x\n\t\t- 0.00232;\n}\nvec3 AgXToneMapping( vec3 color ) {\n\tconst mat3 AgXInsetMatrix = mat3(\n\t\tvec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),\n\t\tvec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),\n\t\tvec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )\n\t);\n\tconst mat3 AgXOutsetMatrix = mat3(\n\t\tvec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),\n\t\tvec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),\n\t\tvec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )\n\t);\n\tconst float AgxMinEv = - 12.47393;\tconst float AgxMaxEv = 4.026069;\n\tcolor *= toneMappingExposure;\n\tcolor = LINEAR_SRGB_TO_LINEAR_REC2020 * color;\n\tcolor = AgXInsetMatrix * color;\n\tcolor = max( color, 1e-10 );\tcolor = log2( color );\n\tcolor = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );\n\tcolor = clamp( color, 0.0, 1.0 );\n\tcolor = agxDefaultContrastApprox( color );\n\tcolor = AgXOutsetMatrix * color;\n\tcolor = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );\n\tcolor = LINEAR_REC2020_TO_LINEAR_SRGB * color;\n\tcolor = clamp( color, 0.0, 1.0 );\n\treturn color;\n}\nvec3 NeutralToneMapping( vec3 color ) {\n\tconst float StartCompression = 0.8 - 0.04;\n\tconst float Desaturation = 0.15;\n\tcolor *= toneMappingExposure;\n\tfloat x = min( color.r, min( color.g, color.b ) );\n\tfloat offset = x < 0.08 ? x - 6.25 * x * x : 0.04;\n\tcolor -= offset;\n\tfloat peak = max( color.r, max( color.g, color.b ) );\n\tif ( peak < StartCompression ) return color;\n\tfloat d = 1. - StartCompression;\n\tfloat newPeak = 1. - d * d / ( peak + d - StartCompression );\n\tcolor *= newPeak / peak;\n\tfloat g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );\n\treturn mix( color, vec3( newPeak ), g );\n}\nvec3 CustomToneMapping( vec3 color ) { return color; }',
  transmission_fragment =
    '#ifdef USE_TRANSMISSION\n\tmaterial.transmission = transmission;\n\tmaterial.transmissionAlpha = 1.0;\n\tmaterial.thickness = thickness;\n\tmaterial.attenuationDistance = attenuationDistance;\n\tmaterial.attenuationColor = attenuationColor;\n\t#ifdef USE_TRANSMISSIONMAP\n\t\tmaterial.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;\n\t#endif\n\t#ifdef USE_THICKNESSMAP\n\t\tmaterial.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;\n\t#endif\n\tvec3 pos = vWorldPosition;\n\tvec3 v = normalize( cameraPosition - pos );\n\tvec3 n = inverseTransformDirection( normal, viewMatrix );\n\tvec4 transmitted = getIBLVolumeRefraction(\n\t\tn, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,\n\t\tpos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,\n\t\tmaterial.attenuationColor, material.attenuationDistance );\n\tmaterial.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );\n\ttotalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );\n#endif',
  transmission_pars_fragment =
    '#ifdef USE_TRANSMISSION\n\tuniform float transmission;\n\tuniform float thickness;\n\tuniform float attenuationDistance;\n\tuniform vec3 attenuationColor;\n\t#ifdef USE_TRANSMISSIONMAP\n\t\tuniform sampler2D transmissionMap;\n\t#endif\n\t#ifdef USE_THICKNESSMAP\n\t\tuniform sampler2D thicknessMap;\n\t#endif\n\tuniform vec2 transmissionSamplerSize;\n\tuniform sampler2D transmissionSamplerMap;\n\tuniform mat4 modelMatrix;\n\tuniform mat4 projectionMatrix;\n\tvarying vec3 vWorldPosition;\n\tfloat w0( float a ) {\n\t\treturn ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );\n\t}\n\tfloat w1( float a ) {\n\t\treturn ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );\n\t}\n\tfloat w2( float a ){\n\t\treturn ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );\n\t}\n\tfloat w3( float a ) {\n\t\treturn ( 1.0 / 6.0 ) * ( a * a * a );\n\t}\n\tfloat g0( float a ) {\n\t\treturn w0( a ) + w1( a );\n\t}\n\tfloat g1( float a ) {\n\t\treturn w2( a ) + w3( a );\n\t}\n\tfloat h0( float a ) {\n\t\treturn - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );\n\t}\n\tfloat h1( float a ) {\n\t\treturn 1.0 + w3( a ) / ( w2( a ) + w3( a ) );\n\t}\n\tvec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {\n\t\tuv = uv * texelSize.zw + 0.5;\n\t\tvec2 iuv = floor( uv );\n\t\tvec2 fuv = fract( uv );\n\t\tfloat g0x = g0( fuv.x );\n\t\tfloat g1x = g1( fuv.x );\n\t\tfloat h0x = h0( fuv.x );\n\t\tfloat h1x = h1( fuv.x );\n\t\tfloat h0y = h0( fuv.y );\n\t\tfloat h1y = h1( fuv.y );\n\t\tvec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;\n\t\tvec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;\n\t\tvec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;\n\t\tvec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;\n\t\treturn g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +\n\t\t\tg1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );\n\t}\n\tvec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {\n\t\tvec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );\n\t\tvec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );\n\t\tvec2 fLodSizeInv = 1.0 / fLodSize;\n\t\tvec2 cLodSizeInv = 1.0 / cLodSize;\n\t\tvec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );\n\t\tvec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );\n\t\treturn mix( fSample, cSample, fract( lod ) );\n\t}\n\tvec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {\n\t\tvec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );\n\t\tvec3 modelScale;\n\t\tmodelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );\n\t\tmodelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );\n\t\tmodelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );\n\t\treturn normalize( refractionVector ) * thickness * modelScale;\n\t}\n\tfloat applyIorToRoughness( const in float roughness, const in float ior ) {\n\t\treturn roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );\n\t}\n\tvec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {\n\t\tfloat lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );\n\t\treturn textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );\n\t}\n\tvec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {\n\t\tif ( isinf( attenuationDistance ) ) {\n\t\t\treturn vec3( 1.0 );\n\t\t} else {\n\t\t\tvec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;\n\t\t\tvec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );\t\t\treturn transmittance;\n\t\t}\n\t}\n\tvec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,\n\t\tconst in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,\n\t\tconst in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,\n\t\tconst in vec3 attenuationColor, const in float attenuationDistance ) {\n\t\tvec4 transmittedLight;\n\t\tvec3 transmittance;\n\t\t#ifdef USE_DISPERSION\n\t\t\tfloat halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;\n\t\t\tvec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );\n\t\t\tfor ( int i = 0; i < 3; i ++ ) {\n\t\t\t\tvec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );\n\t\t\t\tvec3 refractedRayExit = position + transmissionRay;\n\t\t\t\tvec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );\n\t\t\t\tvec2 refractionCoords = ndcPos.xy / ndcPos.w;\n\t\t\t\trefractionCoords += 1.0;\n\t\t\t\trefractionCoords /= 2.0;\n\t\t\t\tvec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );\n\t\t\t\ttransmittedLight[ i ] = transmissionSample[ i ];\n\t\t\t\ttransmittedLight.a += transmissionSample.a;\n\t\t\t\ttransmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];\n\t\t\t}\n\t\t\ttransmittedLight.a /= 3.0;\n\t\t#else\n\t\t\tvec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );\n\t\t\tvec3 refractedRayExit = position + transmissionRay;\n\t\t\tvec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );\n\t\t\tvec2 refractionCoords = ndcPos.xy / ndcPos.w;\n\t\t\trefractionCoords += 1.0;\n\t\t\trefractionCoords /= 2.0;\n\t\t\ttransmittedLight = getTransmissionSample( refractionCoords, roughness, ior );\n\t\t\ttransmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );\n\t\t#endif\n\t\tvec3 attenuatedColor = transmittance * transmittedLight.rgb;\n\t\tvec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );\n\t\tfloat transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;\n\t\treturn vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );\n\t}\n#endif',
  uv_pars_fragment =
    '#if defined( USE_UV ) || defined( USE_ANISOTROPY )\n\tvarying vec2 vUv;\n#endif\n#ifdef USE_MAP\n\tvarying vec2 vMapUv;\n#endif\n#ifdef USE_ALPHAMAP\n\tvarying vec2 vAlphaMapUv;\n#endif\n#ifdef USE_LIGHTMAP\n\tvarying vec2 vLightMapUv;\n#endif\n#ifdef USE_AOMAP\n\tvarying vec2 vAoMapUv;\n#endif\n#ifdef USE_BUMPMAP\n\tvarying vec2 vBumpMapUv;\n#endif\n#ifdef USE_NORMALMAP\n\tvarying vec2 vNormalMapUv;\n#endif\n#ifdef USE_EMISSIVEMAP\n\tvarying vec2 vEmissiveMapUv;\n#endif\n#ifdef USE_METALNESSMAP\n\tvarying vec2 vMetalnessMapUv;\n#endif\n#ifdef USE_ROUGHNESSMAP\n\tvarying vec2 vRoughnessMapUv;\n#endif\n#ifdef USE_ANISOTROPYMAP\n\tvarying vec2 vAnisotropyMapUv;\n#endif\n#ifdef USE_CLEARCOATMAP\n\tvarying vec2 vClearcoatMapUv;\n#endif\n#ifdef USE_CLEARCOAT_NORMALMAP\n\tvarying vec2 vClearcoatNormalMapUv;\n#endif\n#ifdef USE_CLEARCOAT_ROUGHNESSMAP\n\tvarying vec2 vClearcoatRoughnessMapUv;\n#endif\n#ifdef USE_IRIDESCENCEMAP\n\tvarying vec2 vIridescenceMapUv;\n#endif\n#ifdef USE_IRIDESCENCE_THICKNESSMAP\n\tvarying vec2 vIridescenceThicknessMapUv;\n#endif\n#ifdef USE_SHEEN_COLORMAP\n\tvarying vec2 vSheenColorMapUv;\n#endif\n#ifdef USE_SHEEN_ROUGHNESSMAP\n\tvarying vec2 vSheenRoughnessMapUv;\n#endif\n#ifdef USE_SPECULARMAP\n\tvarying vec2 vSpecularMapUv;\n#endif\n#ifdef USE_SPECULAR_COLORMAP\n\tvarying vec2 vSpecularColorMapUv;\n#endif\n#ifdef USE_SPECULAR_INTENSITYMAP\n\tvarying vec2 vSpecularIntensityMapUv;\n#endif\n#ifdef USE_TRANSMISSIONMAP\n\tuniform mat3 transmissionMapTransform;\n\tvarying vec2 vTransmissionMapUv;\n#endif\n#ifdef USE_THICKNESSMAP\n\tuniform mat3 thicknessMapTransform;\n\tvarying vec2 vThicknessMapUv;\n#endif',
  uv_pars_vertex =
    '#if defined( USE_UV ) || defined( USE_ANISOTROPY )\n\tvarying vec2 vUv;\n#endif\n#ifdef USE_MAP\n\tuniform mat3 mapTransform;\n\tvarying vec2 vMapUv;\n#endif\n#ifdef USE_ALPHAMAP\n\tuniform mat3 alphaMapTransform;\n\tvarying vec2 vAlphaMapUv;\n#endif\n#ifdef USE_LIGHTMAP\n\tuniform mat3 lightMapTransform;\n\tvarying vec2 vLightMapUv;\n#endif\n#ifdef USE_AOMAP\n\tuniform mat3 aoMapTransform;\n\tvarying vec2 vAoMapUv;\n#endif\n#ifdef USE_BUMPMAP\n\tuniform mat3 bumpMapTransform;\n\tvarying vec2 vBumpMapUv;\n#endif\n#ifdef USE_NORMALMAP\n\tuniform mat3 normalMapTransform;\n\tvarying vec2 vNormalMapUv;\n#endif\n#ifdef USE_DISPLACEMENTMAP\n\tuniform mat3 displacementMapTransform;\n\tvarying vec2 vDisplacementMapUv;\n#endif\n#ifdef USE_EMISSIVEMAP\n\tuniform mat3 emissiveMapTransform;\n\tvarying vec2 vEmissiveMapUv;\n#endif\n#ifdef USE_METALNESSMAP\n\tuniform mat3 metalnessMapTransform;\n\tvarying vec2 vMetalnessMapUv;\n#endif\n#ifdef USE_ROUGHNESSMAP\n\tuniform mat3 roughnessMapTransform;\n\tvarying vec2 vRoughnessMapUv;\n#endif\n#ifdef USE_ANISOTROPYMAP\n\tuniform mat3 anisotropyMapTransform;\n\tvarying vec2 vAnisotropyMapUv;\n#endif\n#ifdef USE_CLEARCOATMAP\n\tuniform mat3 clearcoatMapTransform;\n\tvarying vec2 vClearcoatMapUv;\n#endif\n#ifdef USE_CLEARCOAT_NORMALMAP\n\tuniform mat3 clearcoatNormalMapTransform;\n\tvarying vec2 vClearcoatNormalMapUv;\n#endif\n#ifdef USE_CLEARCOAT_ROUGHNESSMAP\n\tuniform mat3 clearcoatRoughnessMapTransform;\n\tvarying vec2 vClearcoatRoughnessMapUv;\n#endif\n#ifdef USE_SHEEN_COLORMAP\n\tuniform mat3 sheenColorMapTransform;\n\tvarying vec2 vSheenColorMapUv;\n#endif\n#ifdef USE_SHEEN_ROUGHNESSMAP\n\tuniform mat3 sheenRoughnessMapTransform;\n\tvarying vec2 vSheenRoughnessMapUv;\n#endif\n#ifdef USE_IRIDESCENCEMAP\n\tuniform mat3 iridescenceMapTransform;\n\tvarying vec2 vIridescenceMapUv;\n#endif\n#ifdef USE_IRIDESCENCE_THICKNESSMAP\n\tuniform mat3 iridescenceThicknessMapTransform;\n\tvarying vec2 vIridescenceThicknessMapUv;\n#endif\n#ifdef USE_SPECULARMAP\n\tuniform mat3 specularMapTransform;\n\tvarying vec2 vSpecularMapUv;\n#endif\n#ifdef USE_SPECULAR_COLORMAP\n\tuniform mat3 specularColorMapTransform;\n\tvarying vec2 vSpecularColorMapUv;\n#endif\n#ifdef USE_SPECULAR_INTENSITYMAP\n\tuniform mat3 specularIntensityMapTransform;\n\tvarying vec2 vSpecularIntensityMapUv;\n#endif\n#ifdef USE_TRANSMISSIONMAP\n\tuniform mat3 transmissionMapTransform;\n\tvarying vec2 vTransmissionMapUv;\n#endif\n#ifdef USE_THICKNESSMAP\n\tuniform mat3 thicknessMapTransform;\n\tvarying vec2 vThicknessMapUv;\n#endif',
  uv_vertex =
    '#if defined( USE_UV ) || defined( USE_ANISOTROPY )\n\tvUv = vec3( uv, 1 ).xy;\n#endif\n#ifdef USE_MAP\n\tvMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_ALPHAMAP\n\tvAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_LIGHTMAP\n\tvLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_AOMAP\n\tvAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_BUMPMAP\n\tvBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_NORMALMAP\n\tvNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_DISPLACEMENTMAP\n\tvDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_EMISSIVEMAP\n\tvEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_METALNESSMAP\n\tvMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_ROUGHNESSMAP\n\tvRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_ANISOTROPYMAP\n\tvAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_CLEARCOATMAP\n\tvClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_CLEARCOAT_NORMALMAP\n\tvClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_CLEARCOAT_ROUGHNESSMAP\n\tvClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_IRIDESCENCEMAP\n\tvIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_IRIDESCENCE_THICKNESSMAP\n\tvIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_SHEEN_COLORMAP\n\tvSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_SHEEN_ROUGHNESSMAP\n\tvSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_SPECULARMAP\n\tvSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_SPECULAR_COLORMAP\n\tvSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_SPECULAR_INTENSITYMAP\n\tvSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_TRANSMISSIONMAP\n\tvTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_THICKNESSMAP\n\tvThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;\n#endif',
  worldpos_vertex =
    '#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0\n\tvec4 worldPosition = vec4( transformed, 1.0 );\n\t#ifdef USE_BATCHING\n\t\tworldPosition = batchingMatrix * worldPosition;\n\t#endif\n\t#ifdef USE_INSTANCING\n\t\tworldPosition = instanceMatrix * worldPosition;\n\t#endif\n\tworldPosition = modelMatrix * worldPosition;\n#endif';
const vertex$h =
    'varying vec2 vUv;\nuniform mat3 uvTransform;\nvoid main() {\n\tvUv = ( uvTransform * vec3( uv, 1 ) ).xy;\n\tgl_Position = vec4( position.xy, 1.0, 1.0 );\n}',
  fragment$h =
    'uniform sampler2D t2D;\nuniform float backgroundIntensity;\nvarying vec2 vUv;\nvoid main() {\n\tvec4 texColor = texture2D( t2D, vUv );\n\t#ifdef DECODE_VIDEO_TEXTURE\n\t\ttexColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );\n\t#endif\n\ttexColor.rgb *= backgroundIntensity;\n\tgl_FragColor = texColor;\n\t#include <tonemapping_fragment>\n\t#include <colorspace_fragment>\n}',
  vertex$g =
    'varying vec3 vWorldDirection;\n#include <common>\nvoid main() {\n\tvWorldDirection = transformDirection( position, modelMatrix );\n\t#include <begin_vertex>\n\t#include <project_vertex>\n\tgl_Position.z = gl_Position.w;\n}',
  fragment$g =
    '#ifdef ENVMAP_TYPE_CUBE\n\tuniform samplerCube envMap;\n#elif defined( ENVMAP_TYPE_CUBE_UV )\n\tuniform sampler2D envMap;\n#endif\nuniform float flipEnvMap;\nuniform float backgroundBlurriness;\nuniform float backgroundIntensity;\nuniform mat3 backgroundRotation;\nvarying vec3 vWorldDirection;\n#include <cube_uv_reflection_fragment>\nvoid main() {\n\t#ifdef ENVMAP_TYPE_CUBE\n\t\tvec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );\n\t#elif defined( ENVMAP_TYPE_CUBE_UV )\n\t\tvec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );\n\t#else\n\t\tvec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );\n\t#endif\n\ttexColor.rgb *= backgroundIntensity;\n\tgl_FragColor = texColor;\n\t#include <tonemapping_fragment>\n\t#include <colorspace_fragment>\n}',
  vertex$f =
    'varying vec3 vWorldDirection;\n#include <common>\nvoid main() {\n\tvWorldDirection = transformDirection( position, modelMatrix );\n\t#include <begin_vertex>\n\t#include <project_vertex>\n\tgl_Position.z = gl_Position.w;\n}',
  fragment$f =
    'uniform samplerCube tCube;\nuniform float tFlip;\nuniform float opacity;\nvarying vec3 vWorldDirection;\nvoid main() {\n\tvec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );\n\tgl_FragColor = texColor;\n\tgl_FragColor.a *= opacity;\n\t#include <tonemapping_fragment>\n\t#include <colorspace_fragment>\n}',
  vertex$e =
    '#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvarying vec2 vHighPrecisionZW;\nvoid main() {\n\t#include <uv_vertex>\n\t#include <batching_vertex>\n\t#include <skinbase_vertex>\n\t#include <morphinstance_vertex>\n\t#ifdef USE_DISPLACEMENTMAP\n\t\t#include <beginnormal_vertex>\n\t\t#include <morphnormal_vertex>\n\t\t#include <skinnormal_vertex>\n\t#endif\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <displacementmap_vertex>\n\t#include <project_vertex>\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\tvHighPrecisionZW = gl_Position.zw;\n}',
  fragment$e =
    '#if DEPTH_PACKING == 3200\n\tuniform float opacity;\n#endif\n#include <common>\n#include <packing>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvarying vec2 vHighPrecisionZW;\nvoid main() {\n\tvec4 diffuseColor = vec4( 1.0 );\n\t#include <clipping_planes_fragment>\n\t#if DEPTH_PACKING == 3200\n\t\tdiffuseColor.a = opacity;\n\t#endif\n\t#include <map_fragment>\n\t#include <alphamap_fragment>\n\t#include <alphatest_fragment>\n\t#include <alphahash_fragment>\n\t#include <logdepthbuf_fragment>\n\t#ifdef USE_REVERSED_DEPTH_BUFFER\n\t\tfloat fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];\n\t#else\n\t\tfloat fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;\n\t#endif\n\t#if DEPTH_PACKING == 3200\n\t\tgl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );\n\t#elif DEPTH_PACKING == 3201\n\t\tgl_FragColor = packDepthToRGBA( fragCoordZ );\n\t#elif DEPTH_PACKING == 3202\n\t\tgl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );\n\t#elif DEPTH_PACKING == 3203\n\t\tgl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );\n\t#endif\n}',
  vertex$d =
    '#define DISTANCE\nvarying vec3 vWorldPosition;\n#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\t#include <uv_vertex>\n\t#include <batching_vertex>\n\t#include <skinbase_vertex>\n\t#include <morphinstance_vertex>\n\t#ifdef USE_DISPLACEMENTMAP\n\t\t#include <beginnormal_vertex>\n\t\t#include <morphnormal_vertex>\n\t\t#include <skinnormal_vertex>\n\t#endif\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <displacementmap_vertex>\n\t#include <project_vertex>\n\t#include <worldpos_vertex>\n\t#include <clipping_planes_vertex>\n\tvWorldPosition = worldPosition.xyz;\n}',
  fragment$d =
    '#define DISTANCE\nuniform vec3 referencePosition;\nuniform float nearDistance;\nuniform float farDistance;\nvarying vec3 vWorldPosition;\n#include <common>\n#include <packing>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main () {\n\tvec4 diffuseColor = vec4( 1.0 );\n\t#include <clipping_planes_fragment>\n\t#include <map_fragment>\n\t#include <alphamap_fragment>\n\t#include <alphatest_fragment>\n\t#include <alphahash_fragment>\n\tfloat dist = length( vWorldPosition - referencePosition );\n\tdist = ( dist - nearDistance ) / ( farDistance - nearDistance );\n\tdist = saturate( dist );\n\tgl_FragColor = packDepthToRGBA( dist );\n}',
  vertex$c =
    'varying vec3 vWorldDirection;\n#include <common>\nvoid main() {\n\tvWorldDirection = transformDirection( position, modelMatrix );\n\t#include <begin_vertex>\n\t#include <project_vertex>\n}',
  fragment$c =
    'uniform sampler2D tEquirect;\nvarying vec3 vWorldDirection;\n#include <common>\nvoid main() {\n\tvec3 direction = normalize( vWorldDirection );\n\tvec2 sampleUV = equirectUv( direction );\n\tgl_FragColor = texture2D( tEquirect, sampleUV );\n\t#include <tonemapping_fragment>\n\t#include <colorspace_fragment>\n}',
  vertex$b =
    'uniform float scale;\nattribute float lineDistance;\nvarying float vLineDistance;\n#include <common>\n#include <uv_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\tvLineDistance = scale * lineDistance;\n\t#include <uv_vertex>\n\t#include <color_vertex>\n\t#include <morphinstance_vertex>\n\t#include <morphcolor_vertex>\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <project_vertex>\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\t#include <fog_vertex>\n}',
  fragment$b =
    'uniform vec3 diffuse;\nuniform float opacity;\nuniform float dashSize;\nuniform float totalSize;\nvarying float vLineDistance;\n#include <common>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <fog_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\t#include <clipping_planes_fragment>\n\tif ( mod( vLineDistance, totalSize ) > dashSize ) {\n\t\tdiscard;\n\t}\n\tvec3 outgoingLight = vec3( 0.0 );\n\t#include <logdepthbuf_fragment>\n\t#include <map_fragment>\n\t#include <color_fragment>\n\toutgoingLight = diffuseColor.rgb;\n\t#include <opaque_fragment>\n\t#include <tonemapping_fragment>\n\t#include <colorspace_fragment>\n\t#include <fog_fragment>\n\t#include <premultiplied_alpha_fragment>\n}',
  vertex$a =
    '#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <envmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\t#include <uv_vertex>\n\t#include <color_vertex>\n\t#include <morphinstance_vertex>\n\t#include <morphcolor_vertex>\n\t#include <batching_vertex>\n\t#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )\n\t\t#include <beginnormal_vertex>\n\t\t#include <morphnormal_vertex>\n\t\t#include <skinbase_vertex>\n\t\t#include <skinnormal_vertex>\n\t\t#include <defaultnormal_vertex>\n\t#endif\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <project_vertex>\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\t#include <worldpos_vertex>\n\t#include <envmap_vertex>\n\t#include <fog_vertex>\n}',
  fragment$a =
    'uniform vec3 diffuse;\nuniform float opacity;\n#ifndef FLAT_SHADED\n\tvarying vec3 vNormal;\n#endif\n#include <common>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <envmap_common_pars_fragment>\n#include <envmap_pars_fragment>\n#include <fog_pars_fragment>\n#include <specularmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\t#include <clipping_planes_fragment>\n\t#include <logdepthbuf_fragment>\n\t#include <map_fragment>\n\t#include <color_fragment>\n\t#include <alphamap_fragment>\n\t#include <alphatest_fragment>\n\t#include <alphahash_fragment>\n\t#include <specularmap_fragment>\n\tReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n\t#ifdef USE_LIGHTMAP\n\t\tvec4 lightMapTexel = texture2D( lightMap, vLightMapUv );\n\t\treflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;\n\t#else\n\t\treflectedLight.indirectDiffuse += vec3( 1.0 );\n\t#endif\n\t#include <aomap_fragment>\n\treflectedLight.indirectDiffuse *= diffuseColor.rgb;\n\tvec3 outgoingLight = reflectedLight.indirectDiffuse;\n\t#include <envmap_fragment>\n\t#include <opaque_fragment>\n\t#include <tonemapping_fragment>\n\t#include <colorspace_fragment>\n\t#include <fog_fragment>\n\t#include <premultiplied_alpha_fragment>\n\t#include <dithering_fragment>\n}',
  vertex$9 =
    '#define LAMBERT\nvarying vec3 vViewPosition;\n#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <envmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <normal_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\t#include <uv_vertex>\n\t#include <color_vertex>\n\t#include <morphinstance_vertex>\n\t#include <morphcolor_vertex>\n\t#include <batching_vertex>\n\t#include <beginnormal_vertex>\n\t#include <morphnormal_vertex>\n\t#include <skinbase_vertex>\n\t#include <skinnormal_vertex>\n\t#include <defaultnormal_vertex>\n\t#include <normal_vertex>\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <displacementmap_vertex>\n\t#include <project_vertex>\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\tvViewPosition = - mvPosition.xyz;\n\t#include <worldpos_vertex>\n\t#include <envmap_vertex>\n\t#include <shadowmap_vertex>\n\t#include <fog_vertex>\n}',
  fragment$9 =
    '#define LAMBERT\nuniform vec3 diffuse;\nuniform vec3 emissive;\nuniform float opacity;\n#include <common>\n#include <packing>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n#include <envmap_common_pars_fragment>\n#include <envmap_pars_fragment>\n#include <fog_pars_fragment>\n#include <bsdfs>\n#include <lights_pars_begin>\n#include <normal_pars_fragment>\n#include <lights_lambert_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <specularmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\t#include <clipping_planes_fragment>\n\tReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n\tvec3 totalEmissiveRadiance = emissive;\n\t#include <logdepthbuf_fragment>\n\t#include <map_fragment>\n\t#include <color_fragment>\n\t#include <alphamap_fragment>\n\t#include <alphatest_fragment>\n\t#include <alphahash_fragment>\n\t#include <specularmap_fragment>\n\t#include <normal_fragment_begin>\n\t#include <normal_fragment_maps>\n\t#include <emissivemap_fragment>\n\t#include <lights_lambert_fragment>\n\t#include <lights_fragment_begin>\n\t#include <lights_fragment_maps>\n\t#include <lights_fragment_end>\n\t#include <aomap_fragment>\n\tvec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;\n\t#include <envmap_fragment>\n\t#include <opaque_fragment>\n\t#include <tonemapping_fragment>\n\t#include <colorspace_fragment>\n\t#include <fog_fragment>\n\t#include <premultiplied_alpha_fragment>\n\t#include <dithering_fragment>\n}',
  vertex$8 =
    '#define MATCAP\nvarying vec3 vViewPosition;\n#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <color_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <fog_pars_vertex>\n#include <normal_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\t#include <uv_vertex>\n\t#include <color_vertex>\n\t#include <morphinstance_vertex>\n\t#include <morphcolor_vertex>\n\t#include <batching_vertex>\n\t#include <beginnormal_vertex>\n\t#include <morphnormal_vertex>\n\t#include <skinbase_vertex>\n\t#include <skinnormal_vertex>\n\t#include <defaultnormal_vertex>\n\t#include <normal_vertex>\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <displacementmap_vertex>\n\t#include <project_vertex>\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\t#include <fog_vertex>\n\tvViewPosition = - mvPosition.xyz;\n}',
  fragment$8 =
    '#define MATCAP\nuniform vec3 diffuse;\nuniform float opacity;\nuniform sampler2D matcap;\nvarying vec3 vViewPosition;\n#include <common>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <fog_pars_fragment>\n#include <normal_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\t#include <clipping_planes_fragment>\n\t#include <logdepthbuf_fragment>\n\t#include <map_fragment>\n\t#include <color_fragment>\n\t#include <alphamap_fragment>\n\t#include <alphatest_fragment>\n\t#include <alphahash_fragment>\n\t#include <normal_fragment_begin>\n\t#include <normal_fragment_maps>\n\tvec3 viewDir = normalize( vViewPosition );\n\tvec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );\n\tvec3 y = cross( viewDir, x );\n\tvec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;\n\t#ifdef USE_MATCAP\n\t\tvec4 matcapColor = texture2D( matcap, uv );\n\t#else\n\t\tvec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );\n\t#endif\n\tvec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;\n\t#include <opaque_fragment>\n\t#include <tonemapping_fragment>\n\t#include <colorspace_fragment>\n\t#include <fog_fragment>\n\t#include <premultiplied_alpha_fragment>\n\t#include <dithering_fragment>\n}',
  vertex$7 =
    '#define NORMAL\n#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )\n\tvarying vec3 vViewPosition;\n#endif\n#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <normal_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\t#include <uv_vertex>\n\t#include <batching_vertex>\n\t#include <beginnormal_vertex>\n\t#include <morphinstance_vertex>\n\t#include <morphnormal_vertex>\n\t#include <skinbase_vertex>\n\t#include <skinnormal_vertex>\n\t#include <defaultnormal_vertex>\n\t#include <normal_vertex>\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <displacementmap_vertex>\n\t#include <project_vertex>\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )\n\tvViewPosition = - mvPosition.xyz;\n#endif\n}',
  fragment$7 =
    '#define NORMAL\nuniform float opacity;\n#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )\n\tvarying vec3 vViewPosition;\n#endif\n#include <packing>\n#include <uv_pars_fragment>\n#include <normal_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\tvec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );\n\t#include <clipping_planes_fragment>\n\t#include <logdepthbuf_fragment>\n\t#include <normal_fragment_begin>\n\t#include <normal_fragment_maps>\n\tgl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );\n\t#ifdef OPAQUE\n\t\tgl_FragColor.a = 1.0;\n\t#endif\n}',
  vertex$6 =
    '#define PHONG\nvarying vec3 vViewPosition;\n#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <envmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <normal_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\t#include <uv_vertex>\n\t#include <color_vertex>\n\t#include <morphcolor_vertex>\n\t#include <batching_vertex>\n\t#include <beginnormal_vertex>\n\t#include <morphinstance_vertex>\n\t#include <morphnormal_vertex>\n\t#include <skinbase_vertex>\n\t#include <skinnormal_vertex>\n\t#include <defaultnormal_vertex>\n\t#include <normal_vertex>\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <displacementmap_vertex>\n\t#include <project_vertex>\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\tvViewPosition = - mvPosition.xyz;\n\t#include <worldpos_vertex>\n\t#include <envmap_vertex>\n\t#include <shadowmap_vertex>\n\t#include <fog_vertex>\n}',
  fragment$6 =
    '#define PHONG\nuniform vec3 diffuse;\nuniform vec3 emissive;\nuniform vec3 specular;\nuniform float shininess;\nuniform float opacity;\n#include <common>\n#include <packing>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n#include <envmap_common_pars_fragment>\n#include <envmap_pars_fragment>\n#include <fog_pars_fragment>\n#include <bsdfs>\n#include <lights_pars_begin>\n#include <normal_pars_fragment>\n#include <lights_phong_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <specularmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\t#include <clipping_planes_fragment>\n\tReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n\tvec3 totalEmissiveRadiance = emissive;\n\t#include <logdepthbuf_fragment>\n\t#include <map_fragment>\n\t#include <color_fragment>\n\t#include <alphamap_fragment>\n\t#include <alphatest_fragment>\n\t#include <alphahash_fragment>\n\t#include <specularmap_fragment>\n\t#include <normal_fragment_begin>\n\t#include <normal_fragment_maps>\n\t#include <emissivemap_fragment>\n\t#include <lights_phong_fragment>\n\t#include <lights_fragment_begin>\n\t#include <lights_fragment_maps>\n\t#include <lights_fragment_end>\n\t#include <aomap_fragment>\n\tvec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;\n\t#include <envmap_fragment>\n\t#include <opaque_fragment>\n\t#include <tonemapping_fragment>\n\t#include <colorspace_fragment>\n\t#include <fog_fragment>\n\t#include <premultiplied_alpha_fragment>\n\t#include <dithering_fragment>\n}',
  vertex$5 =
    '#define STANDARD\nvarying vec3 vViewPosition;\n#ifdef USE_TRANSMISSION\n\tvarying vec3 vWorldPosition;\n#endif\n#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <normal_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\t#include <uv_vertex>\n\t#include <color_vertex>\n\t#include <morphinstance_vertex>\n\t#include <morphcolor_vertex>\n\t#include <batching_vertex>\n\t#include <beginnormal_vertex>\n\t#include <morphnormal_vertex>\n\t#include <skinbase_vertex>\n\t#include <skinnormal_vertex>\n\t#include <defaultnormal_vertex>\n\t#include <normal_vertex>\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <displacementmap_vertex>\n\t#include <project_vertex>\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\tvViewPosition = - mvPosition.xyz;\n\t#include <worldpos_vertex>\n\t#include <shadowmap_vertex>\n\t#include <fog_vertex>\n#ifdef USE_TRANSMISSION\n\tvWorldPosition = worldPosition.xyz;\n#endif\n}',
  fragment$5 =
    '#define STANDARD\n#ifdef PHYSICAL\n\t#define IOR\n\t#define USE_SPECULAR\n#endif\nuniform vec3 diffuse;\nuniform vec3 emissive;\nuniform float roughness;\nuniform float metalness;\nuniform float opacity;\n#ifdef IOR\n\tuniform float ior;\n#endif\n#ifdef USE_SPECULAR\n\tuniform float specularIntensity;\n\tuniform vec3 specularColor;\n\t#ifdef USE_SPECULAR_COLORMAP\n\t\tuniform sampler2D specularColorMap;\n\t#endif\n\t#ifdef USE_SPECULAR_INTENSITYMAP\n\t\tuniform sampler2D specularIntensityMap;\n\t#endif\n#endif\n#ifdef USE_CLEARCOAT\n\tuniform float clearcoat;\n\tuniform float clearcoatRoughness;\n#endif\n#ifdef USE_DISPERSION\n\tuniform float dispersion;\n#endif\n#ifdef USE_IRIDESCENCE\n\tuniform float iridescence;\n\tuniform float iridescenceIOR;\n\tuniform float iridescenceThicknessMinimum;\n\tuniform float iridescenceThicknessMaximum;\n#endif\n#ifdef USE_SHEEN\n\tuniform vec3 sheenColor;\n\tuniform float sheenRoughness;\n\t#ifdef USE_SHEEN_COLORMAP\n\t\tuniform sampler2D sheenColorMap;\n\t#endif\n\t#ifdef USE_SHEEN_ROUGHNESSMAP\n\t\tuniform sampler2D sheenRoughnessMap;\n\t#endif\n#endif\n#ifdef USE_ANISOTROPY\n\tuniform vec2 anisotropyVector;\n\t#ifdef USE_ANISOTROPYMAP\n\t\tuniform sampler2D anisotropyMap;\n\t#endif\n#endif\nvarying vec3 vViewPosition;\n#include <common>\n#include <packing>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n#include <iridescence_fragment>\n#include <cube_uv_reflection_fragment>\n#include <envmap_common_pars_fragment>\n#include <envmap_physical_pars_fragment>\n#include <fog_pars_fragment>\n#include <lights_pars_begin>\n#include <normal_pars_fragment>\n#include <lights_physical_pars_fragment>\n#include <transmission_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <clearcoat_pars_fragment>\n#include <iridescence_pars_fragment>\n#include <roughnessmap_pars_fragment>\n#include <metalnessmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\t#include <clipping_planes_fragment>\n\tReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n\tvec3 totalEmissiveRadiance = emissive;\n\t#include <logdepthbuf_fragment>\n\t#include <map_fragment>\n\t#include <color_fragment>\n\t#include <alphamap_fragment>\n\t#include <alphatest_fragment>\n\t#include <alphahash_fragment>\n\t#include <roughnessmap_fragment>\n\t#include <metalnessmap_fragment>\n\t#include <normal_fragment_begin>\n\t#include <normal_fragment_maps>\n\t#include <clearcoat_normal_fragment_begin>\n\t#include <clearcoat_normal_fragment_maps>\n\t#include <emissivemap_fragment>\n\t#include <lights_physical_fragment>\n\t#include <lights_fragment_begin>\n\t#include <lights_fragment_maps>\n\t#include <lights_fragment_end>\n\t#include <aomap_fragment>\n\tvec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;\n\tvec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;\n\t#include <transmission_fragment>\n\tvec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;\n\t#ifdef USE_SHEEN\n\t\tfloat sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );\n\t\toutgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;\n\t#endif\n\t#ifdef USE_CLEARCOAT\n\t\tfloat dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );\n\t\tvec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );\n\t\toutgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;\n\t#endif\n\t#include <opaque_fragment>\n\t#include <tonemapping_fragment>\n\t#include <colorspace_fragment>\n\t#include <fog_fragment>\n\t#include <premultiplied_alpha_fragment>\n\t#include <dithering_fragment>\n}',
  vertex$4 =
    '#define TOON\nvarying vec3 vViewPosition;\n#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <normal_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\t#include <uv_vertex>\n\t#include <color_vertex>\n\t#include <morphinstance_vertex>\n\t#include <morphcolor_vertex>\n\t#include <batching_vertex>\n\t#include <beginnormal_vertex>\n\t#include <morphnormal_vertex>\n\t#include <skinbase_vertex>\n\t#include <skinnormal_vertex>\n\t#include <defaultnormal_vertex>\n\t#include <normal_vertex>\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <displacementmap_vertex>\n\t#include <project_vertex>\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\tvViewPosition = - mvPosition.xyz;\n\t#include <worldpos_vertex>\n\t#include <shadowmap_vertex>\n\t#include <fog_vertex>\n}',
  fragment$4 =
    '#define TOON\nuniform vec3 diffuse;\nuniform vec3 emissive;\nuniform float opacity;\n#include <common>\n#include <packing>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n#include <gradientmap_pars_fragment>\n#include <fog_pars_fragment>\n#include <bsdfs>\n#include <lights_pars_begin>\n#include <normal_pars_fragment>\n#include <lights_toon_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\t#include <clipping_planes_fragment>\n\tReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n\tvec3 totalEmissiveRadiance = emissive;\n\t#include <logdepthbuf_fragment>\n\t#include <map_fragment>\n\t#include <color_fragment>\n\t#include <alphamap_fragment>\n\t#include <alphatest_fragment>\n\t#include <alphahash_fragment>\n\t#include <normal_fragment_begin>\n\t#include <normal_fragment_maps>\n\t#include <emissivemap_fragment>\n\t#include <lights_toon_fragment>\n\t#include <lights_fragment_begin>\n\t#include <lights_fragment_maps>\n\t#include <lights_fragment_end>\n\t#include <aomap_fragment>\n\tvec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;\n\t#include <opaque_fragment>\n\t#include <tonemapping_fragment>\n\t#include <colorspace_fragment>\n\t#include <fog_fragment>\n\t#include <premultiplied_alpha_fragment>\n\t#include <dithering_fragment>\n}',
  vertex$3 =
    'uniform float size;\nuniform float scale;\n#include <common>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\n#ifdef USE_POINTS_UV\n\tvarying vec2 vUv;\n\tuniform mat3 uvTransform;\n#endif\nvoid main() {\n\t#ifdef USE_POINTS_UV\n\t\tvUv = ( uvTransform * vec3( uv, 1 ) ).xy;\n\t#endif\n\t#include <color_vertex>\n\t#include <morphinstance_vertex>\n\t#include <morphcolor_vertex>\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <project_vertex>\n\tgl_PointSize = size;\n\t#ifdef USE_SIZEATTENUATION\n\t\tbool isPerspective = isPerspectiveMatrix( projectionMatrix );\n\t\tif ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );\n\t#endif\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\t#include <worldpos_vertex>\n\t#include <fog_vertex>\n}',
  fragment$3 =
    'uniform vec3 diffuse;\nuniform float opacity;\n#include <common>\n#include <color_pars_fragment>\n#include <map_particle_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <fog_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\t#include <clipping_planes_fragment>\n\tvec3 outgoingLight = vec3( 0.0 );\n\t#include <logdepthbuf_fragment>\n\t#include <map_particle_fragment>\n\t#include <color_fragment>\n\t#include <alphatest_fragment>\n\t#include <alphahash_fragment>\n\toutgoingLight = diffuseColor.rgb;\n\t#include <opaque_fragment>\n\t#include <tonemapping_fragment>\n\t#include <colorspace_fragment>\n\t#include <fog_fragment>\n\t#include <premultiplied_alpha_fragment>\n}',
  vertex$2 =
    '#include <common>\n#include <batching_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <shadowmap_pars_vertex>\nvoid main() {\n\t#include <batching_vertex>\n\t#include <beginnormal_vertex>\n\t#include <morphinstance_vertex>\n\t#include <morphnormal_vertex>\n\t#include <skinbase_vertex>\n\t#include <skinnormal_vertex>\n\t#include <defaultnormal_vertex>\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <project_vertex>\n\t#include <logdepthbuf_vertex>\n\t#include <worldpos_vertex>\n\t#include <shadowmap_vertex>\n\t#include <fog_vertex>\n}',
  fragment$2 =
    'uniform vec3 color;\nuniform float opacity;\n#include <common>\n#include <packing>\n#include <fog_pars_fragment>\n#include <bsdfs>\n#include <lights_pars_begin>\n#include <logdepthbuf_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <shadowmask_pars_fragment>\nvoid main() {\n\t#include <logdepthbuf_fragment>\n\tgl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );\n\t#include <tonemapping_fragment>\n\t#include <colorspace_fragment>\n\t#include <fog_fragment>\n}',
  vertex$1 =
    'uniform float rotation;\nuniform vec2 center;\n#include <common>\n#include <uv_pars_vertex>\n#include <fog_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\t#include <uv_vertex>\n\tvec4 mvPosition = modelViewMatrix[ 3 ];\n\tvec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );\n\t#ifndef USE_SIZEATTENUATION\n\t\tbool isPerspective = isPerspectiveMatrix( projectionMatrix );\n\t\tif ( isPerspective ) scale *= - mvPosition.z;\n\t#endif\n\tvec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;\n\tvec2 rotatedPosition;\n\trotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;\n\trotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;\n\tmvPosition.xy += rotatedPosition;\n\tgl_Position = projectionMatrix * mvPosition;\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\t#include <fog_vertex>\n}',
  fragment$1 =
    'uniform vec3 diffuse;\nuniform float opacity;\n#include <common>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <fog_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\t#include <clipping_planes_fragment>\n\tvec3 outgoingLight = vec3( 0.0 );\n\t#include <logdepthbuf_fragment>\n\t#include <map_fragment>\n\t#include <alphamap_fragment>\n\t#include <alphatest_fragment>\n\t#include <alphahash_fragment>\n\toutgoingLight = diffuseColor.rgb;\n\t#include <opaque_fragment>\n\t#include <tonemapping_fragment>\n\t#include <colorspace_fragment>\n\t#include <fog_fragment>\n}',
  ShaderChunk = {
    alphahash_fragment: alphahash_fragment,
    alphahash_pars_fragment: alphahash_pars_fragment,
    alphamap_fragment: alphamap_fragment,
    alphamap_pars_fragment: alphamap_pars_fragment,
    alphatest_fragment: alphatest_fragment,
    alphatest_pars_fragment: alphatest_pars_fragment,
    aomap_fragment: aomap_fragment,
    aomap_pars_fragment: aomap_pars_fragment,
    batching_pars_vertex: batching_pars_vertex,
    batching_vertex: batching_vertex,
    begin_vertex: begin_vertex,
    beginnormal_vertex: beginnormal_vertex,
    bsdfs: bsdfs,
    iridescence_fragment: iridescence_fragment,
    bumpmap_pars_fragment: bumpmap_pars_fragment,
    clipping_planes_fragment: clipping_planes_fragment,
    clipping_planes_pars_fragment: clipping_planes_pars_fragment,
    clipping_planes_pars_vertex: clipping_planes_pars_vertex,
    clipping_planes_vertex: clipping_planes_vertex,
    color_fragment: color_fragment,
    color_pars_fragment: color_pars_fragment,
    color_pars_vertex: color_pars_vertex,
    color_vertex: color_vertex,
    common: common,
    cube_uv_reflection_fragment: cube_uv_reflection_fragment,
    defaultnormal_vertex: defaultnormal_vertex,
    displacementmap_pars_vertex: displacementmap_pars_vertex,
    displacementmap_vertex: displacementmap_vertex,
    emissivemap_fragment: emissivemap_fragment,
    emissivemap_pars_fragment: emissivemap_pars_fragment,
    colorspace_fragment: colorspace_fragment,
    colorspace_pars_fragment: colorspace_pars_fragment,
    envmap_fragment: envmap_fragment,
    envmap_common_pars_fragment: envmap_common_pars_fragment,
    envmap_pars_fragment: envmap_pars_fragment,
    envmap_pars_vertex: envmap_pars_vertex,
    envmap_physical_pars_fragment: envmap_physical_pars_fragment,
    envmap_vertex: envmap_vertex,
    fog_vertex: fog_vertex,
    fog_pars_vertex: fog_pars_vertex,
    fog_fragment: fog_fragment,
    fog_pars_fragment: fog_pars_fragment,
    gradientmap_pars_fragment: gradientmap_pars_fragment,
    lightmap_pars_fragment: lightmap_pars_fragment,
    lights_lambert_fragment: lights_lambert_fragment,
    lights_lambert_pars_fragment: lights_lambert_pars_fragment,
    lights_pars_begin: lights_pars_begin,
    lights_toon_fragment: lights_toon_fragment,
    lights_toon_pars_fragment: lights_toon_pars_fragment,
    lights_phong_fragment: lights_phong_fragment,
    lights_phong_pars_fragment: lights_phong_pars_fragment,
    lights_physical_fragment: lights_physical_fragment,
    lights_physical_pars_fragment: lights_physical_pars_fragment,
    lights_fragment_begin: lights_fragment_begin,
    lights_fragment_maps: lights_fragment_maps,
    lights_fragment_end: lights_fragment_end,
    logdepthbuf_fragment: logdepthbuf_fragment,
    logdepthbuf_pars_fragment: logdepthbuf_pars_fragment,
    logdepthbuf_pars_vertex: logdepthbuf_pars_vertex,
    logdepthbuf_vertex: logdepthbuf_vertex,
    map_fragment: map_fragment,
    map_pars_fragment: map_pars_fragment,
    map_particle_fragment: map_particle_fragment,
    map_particle_pars_fragment: map_particle_pars_fragment,
    metalnessmap_fragment: metalnessmap_fragment,
    metalnessmap_pars_fragment: metalnessmap_pars_fragment,
    morphinstance_vertex: morphinstance_vertex,
    morphcolor_vertex: morphcolor_vertex,
    morphnormal_vertex: morphnormal_vertex,
    morphtarget_pars_vertex: morphtarget_pars_vertex,
    morphtarget_vertex: morphtarget_vertex,
    normal_fragment_begin: normal_fragment_begin,
    normal_fragment_maps: normal_fragment_maps,
    normal_pars_fragment: normal_pars_fragment,
    normal_pars_vertex: normal_pars_vertex,
    normal_vertex: normal_vertex,
    normalmap_pars_fragment: normalmap_pars_fragment,
    clearcoat_normal_fragment_begin: clearcoat_normal_fragment_begin,
    clearcoat_normal_fragment_maps: clearcoat_normal_fragment_maps,
    clearcoat_pars_fragment: clearcoat_pars_fragment,
    iridescence_pars_fragment: iridescence_pars_fragment,
    opaque_fragment: opaque_fragment,
    packing: packing,
    premultiplied_alpha_fragment: premultiplied_alpha_fragment,
    project_vertex: project_vertex,
    dithering_fragment: dithering_fragment,
    dithering_pars_fragment: dithering_pars_fragment,
    roughnessmap_fragment: roughnessmap_fragment,
    roughnessmap_pars_fragment: roughnessmap_pars_fragment,
    shadowmap_pars_fragment: shadowmap_pars_fragment,
    shadowmap_pars_vertex: shadowmap_pars_vertex,
    shadowmap_vertex: shadowmap_vertex,
    shadowmask_pars_fragment: shadowmask_pars_fragment,
    skinbase_vertex: skinbase_vertex,
    skinning_pars_vertex: skinning_pars_vertex,
    skinning_vertex: skinning_vertex,
    skinnormal_vertex: skinnormal_vertex,
    specularmap_fragment: specularmap_fragment,
    specularmap_pars_fragment: specularmap_pars_fragment,
    tonemapping_fragment: tonemapping_fragment,
    tonemapping_pars_fragment: tonemapping_pars_fragment,
    transmission_fragment: transmission_fragment,
    transmission_pars_fragment: transmission_pars_fragment,
    uv_pars_fragment: uv_pars_fragment,
    uv_pars_vertex: uv_pars_vertex,
    uv_vertex: uv_vertex,
    worldpos_vertex: worldpos_vertex,
    background_vert: vertex$h,
    background_frag: fragment$h,
    backgroundCube_vert: vertex$g,
    backgroundCube_frag: fragment$g,
    cube_vert: vertex$f,
    cube_frag: fragment$f,
    depth_vert: vertex$e,
    depth_frag: fragment$e,
    distanceRGBA_vert: vertex$d,
    distanceRGBA_frag: fragment$d,
    equirect_vert: vertex$c,
    equirect_frag: fragment$c,
    linedashed_vert: vertex$b,
    linedashed_frag: fragment$b,
    meshbasic_vert: vertex$a,
    meshbasic_frag: fragment$a,
    meshlambert_vert: vertex$9,
    meshlambert_frag: fragment$9,
    meshmatcap_vert: vertex$8,
    meshmatcap_frag: fragment$8,
    meshnormal_vert: vertex$7,
    meshnormal_frag: fragment$7,
    meshphong_vert: vertex$6,
    meshphong_frag: fragment$6,
    meshphysical_vert: vertex$5,
    meshphysical_frag: fragment$5,
    meshtoon_vert: vertex$4,
    meshtoon_frag: fragment$4,
    points_vert: vertex$3,
    points_frag: fragment$3,
    shadow_vert: vertex$2,
    shadow_frag: fragment$2,
    sprite_vert: vertex$1,
    sprite_frag: fragment$1,
  },
  UniformsLib = {
    common: {
      diffuse: { value: new Color(0xffffff) },
      opacity: { value: 1 },
      map: { value: null },
      mapTransform: { value: new Matrix3() },
      alphaMap: { value: null },
      alphaMapTransform: { value: new Matrix3() },
      alphaTest: { value: 0 },
    },
    specularmap: { specularMap: { value: null }, specularMapTransform: { value: new Matrix3() } },
    envmap: {
      envMap: { value: null },
      envMapRotation: { value: new Matrix3() },
      flipEnvMap: { value: -1 },
      reflectivity: { value: 1 },
      ior: { value: 1.5 },
      refractionRatio: { value: 0.98 },
    },
    aomap: { aoMap: { value: null }, aoMapIntensity: { value: 1 }, aoMapTransform: { value: new Matrix3() } },
    lightmap: {
      lightMap: { value: null },
      lightMapIntensity: { value: 1 },
      lightMapTransform: { value: new Matrix3() },
    },
    bumpmap: {
      bumpMap: { value: null },
      bumpMapTransform: { value: new Matrix3() },
      bumpScale: { value: 1 },
    },
    normalmap: {
      normalMap: { value: null },
      normalMapTransform: { value: new Matrix3() },
      normalScale: { value: new Vector2(1, 1) },
    },
    displacementmap: {
      displacementMap: { value: null },
      displacementMapTransform: { value: new Matrix3() },
      displacementScale: { value: 1 },
      displacementBias: { value: 0 },
    },
    emissivemap: { emissiveMap: { value: null }, emissiveMapTransform: { value: new Matrix3() } },
    metalnessmap: { metalnessMap: { value: null }, metalnessMapTransform: { value: new Matrix3() } },
    roughnessmap: { roughnessMap: { value: null }, roughnessMapTransform: { value: new Matrix3() } },
    gradientmap: { gradientMap: { value: null } },
    fog: {
      fogDensity: { value: 0.00025 },
      fogNear: { value: 1 },
      fogFar: { value: 0x7d0 },
      fogColor: { value: new Color(0xffffff) },
    },
    lights: {
      ambientLightColor: { value: [] },
      lightProbe: { value: [] },
      directionalLights: { value: [], properties: { direction: {}, color: {} } },
      directionalLightShadows: {
        value: [],
        properties: {
          shadowIntensity: 1,
          shadowBias: {},
          shadowNormalBias: {},
          shadowRadius: {},
          shadowMapSize: {},
        },
      },
      directionalShadowMap: { value: [] },
      directionalShadowMatrix: { value: [] },
      spotLights: {
        value: [],
        properties: {
          color: {},
          position: {},
          direction: {},
          distance: {},
          coneCos: {},
          penumbraCos: {},
          decay: {},
        },
      },
      spotLightShadows: {
        value: [],
        properties: {
          shadowIntensity: 1,
          shadowBias: {},
          shadowNormalBias: {},
          shadowRadius: {},
          shadowMapSize: {},
        },
      },
      spotLightMap: { value: [] },
      spotShadowMap: { value: [] },
      spotLightMatrix: { value: [] },
      pointLights: { value: [], properties: { color: {}, position: {}, decay: {}, distance: {} } },
      pointLightShadows: {
        value: [],
        properties: {
          shadowIntensity: 1,
          shadowBias: {},
          shadowNormalBias: {},
          shadowRadius: {},
          shadowMapSize: {},
          shadowCameraNear: {},
          shadowCameraFar: {},
        },
      },
      pointShadowMap: { value: [] },
      pointShadowMatrix: { value: [] },
      hemisphereLights: { value: [], properties: { direction: {}, skyColor: {}, groundColor: {} } },
      rectAreaLights: { value: [], properties: { color: {}, position: {}, width: {}, height: {} } },
      ltc_1: { value: null },
      ltc_2: { value: null },
    },
    points: {
      diffuse: { value: new Color(0xffffff) },
      opacity: { value: 1 },
      size: { value: 1 },
      scale: { value: 1 },
      map: { value: null },
      alphaMap: { value: null },
      alphaMapTransform: { value: new Matrix3() },
      alphaTest: { value: 0 },
      uvTransform: { value: new Matrix3() },
    },
    sprite: {
      diffuse: { value: new Color(0xffffff) },
      opacity: { value: 1 },
      center: { value: new Vector2(0.5, 0.5) },
      rotation: { value: 0 },
      map: { value: null },
      mapTransform: { value: new Matrix3() },
      alphaMap: { value: null },
      alphaMapTransform: { value: new Matrix3() },
      alphaTest: { value: 0 },
    },
  },
  ShaderLib = {
    basic: {
      uniforms: mergeUniforms([
        UniformsLib.common,
        UniformsLib.specularmap,
        UniformsLib.envmap,
        UniformsLib.aomap,
        UniformsLib.lightmap,
        UniformsLib.fog,
      ]),
      vertexShader: ShaderChunk.meshbasic_vert,
      fragmentShader: ShaderChunk.meshbasic_frag,
    },
    lambert: {
      uniforms: mergeUniforms([
        UniformsLib.common,
        UniformsLib.specularmap,
        UniformsLib.envmap,
        UniformsLib.aomap,
        UniformsLib.lightmap,
        UniformsLib.emissivemap,
        UniformsLib.bumpmap,
        UniformsLib.normalmap,
        UniformsLib.displacementmap,
        UniformsLib.fog,
        UniformsLib.lights,
        { emissive: { value: new Color(0) } },
      ]),
      vertexShader: ShaderChunk.meshlambert_vert,
      fragmentShader: ShaderChunk.meshlambert_frag,
    },
    phong: {
      uniforms: mergeUniforms([
        UniformsLib.common,
        UniformsLib.specularmap,
        UniformsLib.envmap,
        UniformsLib.aomap,
        UniformsLib.lightmap,
        UniformsLib.emissivemap,
        UniformsLib.bumpmap,
        UniformsLib.normalmap,
        UniformsLib.displacementmap,
        UniformsLib.fog,
        UniformsLib.lights,
        {
          emissive: { value: new Color(0) },
          specular: { value: new Color(0x111111) },
          shininess: { value: 30 },
        },
      ]),
      vertexShader: ShaderChunk.meshphong_vert,
      fragmentShader: ShaderChunk.meshphong_frag,
    },
    standard: {
      uniforms: mergeUniforms([
        UniformsLib.common,
        UniformsLib.envmap,
        UniformsLib.aomap,
        UniformsLib.lightmap,
        UniformsLib.emissivemap,
        UniformsLib.bumpmap,
        UniformsLib.normalmap,
        UniformsLib.displacementmap,
        UniformsLib.roughnessmap,
        UniformsLib.metalnessmap,
        UniformsLib.fog,
        UniformsLib.lights,
        {
          emissive: { value: new Color(0) },
          roughness: { value: 1 },
          metalness: { value: 0 },
          envMapIntensity: { value: 1 },
        },
      ]),
      vertexShader: ShaderChunk.meshphysical_vert,
      fragmentShader: ShaderChunk.meshphysical_frag,
    },
    toon: {
      uniforms: mergeUniforms([
        UniformsLib.common,
        UniformsLib.aomap,
        UniformsLib.lightmap,
        UniformsLib.emissivemap,
        UniformsLib.bumpmap,
        UniformsLib.normalmap,
        UniformsLib.displacementmap,
        UniformsLib.gradientmap,
        UniformsLib.fog,
        UniformsLib.lights,
        { emissive: { value: new Color(0) } },
      ]),
      vertexShader: ShaderChunk.meshtoon_vert,
      fragmentShader: ShaderChunk.meshtoon_frag,
    },
    matcap: {
      uniforms: mergeUniforms([
        UniformsLib.common,
        UniformsLib.bumpmap,
        UniformsLib.normalmap,
        UniformsLib.displacementmap,
        UniformsLib.fog,
        { matcap: { value: null } },
      ]),
      vertexShader: ShaderChunk.meshmatcap_vert,
      fragmentShader: ShaderChunk.meshmatcap_frag,
    },
    points: {
      uniforms: mergeUniforms([UniformsLib.points, UniformsLib.fog]),
      vertexShader: ShaderChunk.points_vert,
      fragmentShader: ShaderChunk.points_frag,
    },
    dashed: {
      uniforms: mergeUniforms([
        UniformsLib.common,
        UniformsLib.fog,
        { scale: { value: 1 }, dashSize: { value: 1 }, totalSize: { value: 2 } },
      ]),
      vertexShader: ShaderChunk.linedashed_vert,
      fragmentShader: ShaderChunk.linedashed_frag,
    },
    depth: {
      uniforms: mergeUniforms([UniformsLib.common, UniformsLib.displacementmap]),
      vertexShader: ShaderChunk.depth_vert,
      fragmentShader: ShaderChunk.depth_frag,
    },
    normal: {
      uniforms: mergeUniforms([
        UniformsLib.common,
        UniformsLib.bumpmap,
        UniformsLib.normalmap,
        UniformsLib.displacementmap,
        { opacity: { value: 1 } },
      ]),
      vertexShader: ShaderChunk.meshnormal_vert,
      fragmentShader: ShaderChunk.meshnormal_frag,
    },
    sprite: {
      uniforms: mergeUniforms([UniformsLib.sprite, UniformsLib.fog]),
      vertexShader: ShaderChunk.sprite_vert,
      fragmentShader: ShaderChunk.sprite_frag,
    },
    background: {
      uniforms: {
        uvTransform: { value: new Matrix3() },
        t2D: { value: null },
        backgroundIntensity: { value: 1 },
      },
      vertexShader: ShaderChunk.background_vert,
      fragmentShader: ShaderChunk.background_frag,
    },
    backgroundCube: {
      uniforms: {
        envMap: { value: null },
        flipEnvMap: { value: -1 },
        backgroundBlurriness: { value: 0 },
        backgroundIntensity: { value: 1 },
        backgroundRotation: { value: new Matrix3() },
      },
      vertexShader: ShaderChunk.backgroundCube_vert,
      fragmentShader: ShaderChunk.backgroundCube_frag,
    },
    cube: {
      uniforms: { tCube: { value: null }, tFlip: { value: -1 }, opacity: { value: 1 } },
      vertexShader: ShaderChunk.cube_vert,
      fragmentShader: ShaderChunk.cube_frag,
    },
    equirect: {
      uniforms: { tEquirect: { value: null } },
      vertexShader: ShaderChunk.equirect_vert,
      fragmentShader: ShaderChunk.equirect_frag,
    },
    distanceRGBA: {
      uniforms: mergeUniforms([
        UniformsLib.common,
        UniformsLib.displacementmap,
        {
          referencePosition: { value: new Vector3() },
          nearDistance: { value: 1 },
          farDistance: { value: 0x3e8 },
        },
      ]),
      vertexShader: ShaderChunk.distanceRGBA_vert,
      fragmentShader: ShaderChunk.distanceRGBA_frag,
    },
    shadow: {
      uniforms: mergeUniforms([
        UniformsLib.lights,
        UniformsLib.fog,
        { color: { value: new Color(0) }, opacity: { value: 1 } },
      ]),
      vertexShader: ShaderChunk.shadow_vert,
      fragmentShader: ShaderChunk.shadow_frag,
    },
  };
ShaderLib.physical = {
  uniforms: mergeUniforms([
    ShaderLib.standard.uniforms,
    {
      clearcoat: { value: 0 },
      clearcoatMap: { value: null },
      clearcoatMapTransform: { value: new Matrix3() },
      clearcoatNormalMap: { value: null },
      clearcoatNormalMapTransform: { value: new Matrix3() },
      clearcoatNormalScale: { value: new Vector2(1, 1) },
      clearcoatRoughness: { value: 0 },
      clearcoatRoughnessMap: { value: null },
      clearcoatRoughnessMapTransform: { value: new Matrix3() },
      dispersion: { value: 0 },
      iridescence: { value: 0 },
      iridescenceMap: { value: null },
      iridescenceMapTransform: { value: new Matrix3() },
      iridescenceIOR: { value: 1.3 },
      iridescenceThicknessMinimum: { value: 100 },
      iridescenceThicknessMaximum: { value: 0x190 },
      iridescenceThicknessMap: { value: null },
      iridescenceThicknessMapTransform: { value: new Matrix3() },
      sheen: { value: 0 },
      sheenColor: { value: new Color(0) },
      sheenColorMap: { value: null },
      sheenColorMapTransform: { value: new Matrix3() },
      sheenRoughness: { value: 1 },
      sheenRoughnessMap: { value: null },
      sheenRoughnessMapTransform: { value: new Matrix3() },
      transmission: { value: 0 },
      transmissionMap: { value: null },
      transmissionMapTransform: { value: new Matrix3() },
      transmissionSamplerSize: { value: new Vector2() },
      transmissionSamplerMap: { value: null },
      thickness: { value: 0 },
      thicknessMap: { value: null },
      thicknessMapTransform: { value: new Matrix3() },
      attenuationDistance: { value: 0 },
      attenuationColor: { value: new Color(0) },
      specularColor: { value: new Color(1, 1, 1) },
      specularColorMap: { value: null },
      specularColorMapTransform: { value: new Matrix3() },
      specularIntensity: { value: 1 },
      specularIntensityMap: { value: null },
      specularIntensityMapTransform: { value: new Matrix3() },
      anisotropyVector: { value: new Vector2() },
      anisotropyMap: { value: null },
      anisotropyMapTransform: { value: new Matrix3() },
    },
  ]),
  vertexShader: ShaderChunk.meshphysical_vert,
  fragmentShader: ShaderChunk.meshphysical_frag,
};
const _rgb = { r: 0, b: 0, g: 0 },
  _e1$1 = new Euler(),
  _m1$1 = new Matrix4();
function WebGLBackground(_0x2a1a99, _0x1f93ab, _0x269783, _0x2c952e, _0x1ed549, _0x4d4e5c, _0x321c98) {
  const _0x522d51 = new Color(0);
  let _0x36232b = _0x4d4e5c === true ? 0 : 1,
    _0x589271,
    _0x1bb974,
    _0x4af2a0 = null,
    _0x49cf3c = 0,
    _0x50fc26 = null;
  function _0x1527cf(_0x2db8f3) {
    let _0x11ebf0 = _0x2db8f3.isScene === true ? _0x2db8f3.background : null;
    if (_0x11ebf0 && _0x11ebf0.isTexture) {
      const _0xa2696e = _0x2db8f3.backgroundBlurriness > 0;
      _0x11ebf0 = (_0xa2696e ? _0x269783 : _0x1f93ab).get(_0x11ebf0);
    }
    return _0x11ebf0;
  }
  function _0x12361c(_0x37a44c) {
    let _0x3706fd = false;
    const _0x1568de = _0x1527cf(_0x37a44c);
    if (_0x1568de === null) _0x542807(_0x522d51, _0x36232b);
    else _0x1568de && _0x1568de.isColor && (_0x542807(_0x1568de, 1), (_0x3706fd = true));
    const _0xef28b4 = _0x2a1a99.xr.getEnvironmentBlendMode();
    if (_0xef28b4 === 'additive') _0x2c952e.buffers.color.setClear(0, 0, 0, 1, _0x321c98);
    else _0xef28b4 === 'alpha-blend' && _0x2c952e.buffers.color.setClear(0, 0, 0, 0, _0x321c98);
    (_0x2a1a99.autoClear || _0x3706fd) &&
      (_0x2c952e.buffers.depth.setTest(true),
      _0x2c952e.buffers.depth.setMask(true),
      _0x2c952e.buffers.color.setMask(true),
      _0x2a1a99.clear(_0x2a1a99.autoClearColor, _0x2a1a99.autoClearDepth, _0x2a1a99.autoClearStencil));
  }
  function _0x72c65d(_0x1dc6f2, _0xdccdf8) {
    const _0x35e20a = _0x1527cf(_0xdccdf8);
    if (_0x35e20a && (_0x35e20a.isCubeTexture || _0x35e20a.mapping === CubeUVReflectionMapping))
      (_0x1bb974 === undefined &&
        ((_0x1bb974 = new Mesh(
          new BoxGeometry(1, 1, 1),
          new ShaderMaterial({
            name: 'BackgroundCubeMaterial',
            uniforms: cloneUniforms(ShaderLib.backgroundCube.uniforms),
            vertexShader: ShaderLib.backgroundCube.vertexShader,
            fragmentShader: ShaderLib.backgroundCube.fragmentShader,
            side: BackSide,
            depthTest: false,
            depthWrite: false,
            fog: false,
            allowOverride: false,
          }),
        )),
        _0x1bb974.geometry.deleteAttribute('normal'),
        _0x1bb974.geometry.deleteAttribute('uv'),
        (_0x1bb974.onBeforeRender = function (_0x44ce25, _0x2976a5, _0x1894f0) {
          this.matrixWorld.copyPosition(_0x1894f0.matrixWorld);
        }),
        Object.defineProperty(_0x1bb974.material, 'envMap', {
          get: function () {
            return this.uniforms.envMap.value;
          },
        }),
        _0x1ed549.update(_0x1bb974)),
        _e1$1.copy(_0xdccdf8.backgroundRotation),
        (_e1$1.x *= -1),
        (_e1$1.y *= -1),
        (_e1$1.z *= -1),
        _0x35e20a.isCubeTexture &&
          _0x35e20a.isRenderTargetTexture === false &&
          ((_e1$1.y *= -1), (_e1$1.z *= -1)),
        (_0x1bb974.material.uniforms.envMap.value = _0x35e20a),
        (_0x1bb974.material.uniforms.flipEnvMap.value =
          _0x35e20a.isCubeTexture && _0x35e20a.isRenderTargetTexture === false ? -1 : 1),
        (_0x1bb974.material.uniforms.backgroundBlurriness.value = _0xdccdf8.backgroundBlurriness),
        (_0x1bb974.material.uniforms.backgroundIntensity.value = _0xdccdf8.backgroundIntensity),
        _0x1bb974.material.uniforms.backgroundRotation.value.setFromMatrix4(
          _m1$1.makeRotationFromEuler(_e1$1),
        ),
        (_0x1bb974.material.toneMapped = ColorManagement.getTransfer(_0x35e20a.colorSpace) !== SRGBTransfer),
        (_0x4af2a0 !== _0x35e20a || _0x49cf3c !== _0x35e20a.version || _0x50fc26 !== _0x2a1a99.toneMapping) &&
          ((_0x1bb974.material.needsUpdate = true),
          (_0x4af2a0 = _0x35e20a),
          (_0x49cf3c = _0x35e20a.version),
          (_0x50fc26 = _0x2a1a99.toneMapping)),
        _0x1bb974.layers.enableAll(),
        _0x1dc6f2.unshift(_0x1bb974, _0x1bb974.geometry, _0x1bb974.material, 0, 0, null));
    else
      _0x35e20a &&
        _0x35e20a.isTexture &&
        (_0x589271 === undefined &&
          ((_0x589271 = new Mesh(
            new PlaneGeometry(2, 2),
            new ShaderMaterial({
              name: 'BackgroundMaterial',
              uniforms: cloneUniforms(ShaderLib.background.uniforms),
              vertexShader: ShaderLib.background.vertexShader,
              fragmentShader: ShaderLib.background.fragmentShader,
              side: FrontSide,
              depthTest: false,
              depthWrite: false,
              fog: false,
              allowOverride: false,
            }),
          )),
          _0x589271.geometry.deleteAttribute('normal'),
          Object.defineProperty(_0x589271.material, 'map', {
            get: function () {
              return this.uniforms.t2D.value;
            },
          }),
          _0x1ed549.update(_0x589271)),
        (_0x589271.material.uniforms.t2D.value = _0x35e20a),
        (_0x589271.material.uniforms.backgroundIntensity.value = _0xdccdf8.backgroundIntensity),
        (_0x589271.material.toneMapped = ColorManagement.getTransfer(_0x35e20a.colorSpace) !== SRGBTransfer),
        _0x35e20a.matrixAutoUpdate === true && _0x35e20a.updateMatrix(),
        _0x589271.material.uniforms.uvTransform.value.copy(_0x35e20a.matrix),
        (_0x4af2a0 !== _0x35e20a || _0x49cf3c !== _0x35e20a.version || _0x50fc26 !== _0x2a1a99.toneMapping) &&
          ((_0x589271.material.needsUpdate = true),
          (_0x4af2a0 = _0x35e20a),
          (_0x49cf3c = _0x35e20a.version),
          (_0x50fc26 = _0x2a1a99.toneMapping)),
        _0x589271.layers.enableAll(),
        _0x1dc6f2.unshift(_0x589271, _0x589271.geometry, _0x589271.material, 0, 0, null));
  }
  function _0x542807(_0x26ffd2, _0x58c9e5) {
    (_0x26ffd2.getRGB(_rgb, getUnlitUniformColorSpace(_0x2a1a99)),
      _0x2c952e.buffers.color.setClear(_rgb.r, _rgb.g, _rgb.b, _0x58c9e5, _0x321c98));
  }
  function _0x3c35f5() {
    (_0x1bb974 !== undefined &&
      (_0x1bb974.geometry.dispose(), _0x1bb974.material.dispose(), (_0x1bb974 = undefined)),
      _0x589271 !== undefined &&
        (_0x589271.geometry.dispose(), _0x589271.material.dispose(), (_0x589271 = undefined)));
  }
  return {
    getClearColor: function () {
      return _0x522d51;
    },
    setClearColor: function (_0x4d2291, _0x4f2924 = 1) {
      (_0x522d51.set(_0x4d2291), (_0x36232b = _0x4f2924), _0x542807(_0x522d51, _0x36232b));
    },
    getClearAlpha: function () {
      return _0x36232b;
    },
    setClearAlpha: function (_0x6834ae) {
      ((_0x36232b = _0x6834ae), _0x542807(_0x522d51, _0x36232b));
    },
    render: _0x12361c,
    addToRenderList: _0x72c65d,
    dispose: _0x3c35f5,
  };
}
function WebGLBindingStates(_0x23e9c1, _0x37cff2) {
  const _0x50409d = _0x23e9c1.getParameter(_0x23e9c1.MAX_VERTEX_ATTRIBS),
    _0x292dd5 = {},
    _0x49107a = _0x2d9d28(null);
  let _0x15d02c = _0x49107a,
    _0x4e37b9 = false;
  function _0x153048(_0x1878dd, _0x3e78a5, _0x2824f7, _0x569177, _0x5ef4e0) {
    let _0x3c5144 = false;
    const _0x387899 = _0x4bfe23(_0x569177, _0x2824f7, _0x3e78a5);
    _0x15d02c !== _0x387899 && ((_0x15d02c = _0x387899), _0x51b411(_0x15d02c.object));
    _0x3c5144 = _0x2e60c2(_0x1878dd, _0x569177, _0x2824f7, _0x5ef4e0);
    if (_0x3c5144) _0x5b25df(_0x1878dd, _0x569177, _0x2824f7, _0x5ef4e0);
    (_0x5ef4e0 !== null && _0x37cff2.update(_0x5ef4e0, _0x23e9c1.ELEMENT_ARRAY_BUFFER),
      (_0x3c5144 || _0x4e37b9) &&
        ((_0x4e37b9 = false),
        _0x5ee19c(_0x1878dd, _0x3e78a5, _0x2824f7, _0x569177),
        _0x5ef4e0 !== null &&
          _0x23e9c1.bindBuffer(_0x23e9c1.ELEMENT_ARRAY_BUFFER, _0x37cff2.get(_0x5ef4e0).buffer)));
  }
  function _0x5535ff() {
    return _0x23e9c1.createVertexArray();
  }
  function _0x51b411(_0x1b0698) {
    return _0x23e9c1.bindVertexArray(_0x1b0698);
  }
  function _0x569b06(_0x36d11b) {
    return _0x23e9c1.deleteVertexArray(_0x36d11b);
  }
  function _0x4bfe23(_0x441282, _0x2b88b6, _0x115131) {
    const _0x20d63c = _0x115131.wireframe === true;
    let _0x358910 = _0x292dd5[_0x441282.id];
    _0x358910 === undefined && ((_0x358910 = {}), (_0x292dd5[_0x441282.id] = _0x358910));
    let _0x55909c = _0x358910[_0x2b88b6.id];
    _0x55909c === undefined && ((_0x55909c = {}), (_0x358910[_0x2b88b6.id] = _0x55909c));
    let _0x3844d0 = _0x55909c[_0x20d63c];
    return (
      _0x3844d0 === undefined && ((_0x3844d0 = _0x2d9d28(_0x5535ff())), (_0x55909c[_0x20d63c] = _0x3844d0)),
      _0x3844d0
    );
  }
  function _0x2d9d28(_0x2a0442) {
    const _0x21e919 = [],
      _0x28ada7 = [],
      _0x5d1f1e = [];
    for (let _0x4b98d3 = 0; _0x4b98d3 < _0x50409d; _0x4b98d3++) {
      ((_0x21e919[_0x4b98d3] = 0), (_0x28ada7[_0x4b98d3] = 0), (_0x5d1f1e[_0x4b98d3] = 0));
    }
    return {
      geometry: null,
      program: null,
      wireframe: false,
      newAttributes: _0x21e919,
      enabledAttributes: _0x28ada7,
      attributeDivisors: _0x5d1f1e,
      object: _0x2a0442,
      attributes: {},
      index: null,
    };
  }
  function _0x2e60c2(_0x15c389, _0x1789a0, _0x42c843, _0x336de4) {
    const _0x34b806 = _0x15d02c.attributes,
      _0x41be6a = _0x1789a0.attributes;
    let _0x37fc6a = 0;
    const _0x19e977 = _0x42c843.getAttributes();
    for (const _0x17baf0 in _0x19e977) {
      const _0x1c9add = _0x19e977[_0x17baf0];
      if (_0x1c9add.location >= 0) {
        const _0x180ddd = _0x34b806[_0x17baf0];
        let _0x168e1e = _0x41be6a[_0x17baf0];
        if (_0x168e1e === undefined) {
          if (_0x17baf0 === 'instanceMatrix' && _0x15c389.instanceMatrix)
            _0x168e1e = _0x15c389.instanceMatrix;
          if (_0x17baf0 === 'instanceColor' && _0x15c389.instanceColor) _0x168e1e = _0x15c389.instanceColor;
        }
        if (_0x180ddd === undefined) return true;
        if (_0x180ddd.attribute !== _0x168e1e) return true;
        if (_0x168e1e && _0x180ddd.data !== _0x168e1e.data) return true;
        _0x37fc6a++;
      }
    }
    if (_0x15d02c.attributesNum !== _0x37fc6a) return true;
    if (_0x15d02c.index !== _0x336de4) return true;
    return false;
  }
  function _0x5b25df(_0x3be851, _0x43c3de, _0x1c56a1, _0x209836) {
    const _0x48b710 = {},
      _0x6090a2 = _0x43c3de.attributes;
    let _0x27cb82 = 0;
    const _0x22c757 = _0x1c56a1.getAttributes();
    for (const _0x280f82 in _0x22c757) {
      const _0x42a379 = _0x22c757[_0x280f82];
      if (_0x42a379.location >= 0) {
        let _0x80a398 = _0x6090a2[_0x280f82];
        if (_0x80a398 === undefined) {
          if (_0x280f82 === 'instanceMatrix' && _0x3be851.instanceMatrix)
            _0x80a398 = _0x3be851.instanceMatrix;
          if (_0x280f82 === 'instanceColor' && _0x3be851.instanceColor) _0x80a398 = _0x3be851.instanceColor;
        }
        const _0x2b3010 = {};
        ((_0x2b3010.attribute = _0x80a398),
          _0x80a398 && _0x80a398.data && (_0x2b3010.data = _0x80a398.data),
          (_0x48b710[_0x280f82] = _0x2b3010),
          _0x27cb82++);
      }
    }
    ((_0x15d02c.attributes = _0x48b710),
      (_0x15d02c.attributesNum = _0x27cb82),
      (_0x15d02c.index = _0x209836));
  }
  function _0x356c86() {
    const _0x20e89a = _0x15d02c.newAttributes;
    for (let _0x1525c0 = 0, _0x193254 = _0x20e89a.length; _0x1525c0 < _0x193254; _0x1525c0++) {
      _0x20e89a[_0x1525c0] = 0;
    }
  }
  function _0x42b474(_0x29c670) {
    _0x1cf405(_0x29c670, 0);
  }
  function _0x1cf405(_0x582e6c, _0x63de4d) {
    const _0x2e153a = _0x15d02c.newAttributes,
      _0x14142b = _0x15d02c.enabledAttributes,
      _0x328c4c = _0x15d02c.attributeDivisors;
    ((_0x2e153a[_0x582e6c] = 1),
      _0x14142b[_0x582e6c] === 0 &&
        (_0x23e9c1.enableVertexAttribArray(_0x582e6c), (_0x14142b[_0x582e6c] = 1)),
      _0x328c4c[_0x582e6c] !== _0x63de4d &&
        (_0x23e9c1.vertexAttribDivisor(_0x582e6c, _0x63de4d), (_0x328c4c[_0x582e6c] = _0x63de4d)));
  }
  function _0x50261a() {
    const _0x3f2989 = _0x15d02c.newAttributes,
      _0x14d732 = _0x15d02c.enabledAttributes;
    for (let _0x340796 = 0, _0x11d648 = _0x14d732.length; _0x340796 < _0x11d648; _0x340796++) {
      _0x14d732[_0x340796] !== _0x3f2989[_0x340796] &&
        (_0x23e9c1.disableVertexAttribArray(_0x340796), (_0x14d732[_0x340796] = 0));
    }
  }
  function _0x323471(_0x1c9406, _0x4fe94c, _0x362878, _0x37832d, _0x335cdd, _0x1dc13d, _0x7b522f) {
    _0x7b522f === true
      ? _0x23e9c1.vertexAttribIPointer(_0x1c9406, _0x4fe94c, _0x362878, _0x335cdd, _0x1dc13d)
      : _0x23e9c1.vertexAttribPointer(_0x1c9406, _0x4fe94c, _0x362878, _0x37832d, _0x335cdd, _0x1dc13d);
  }
  function _0x5ee19c(_0x36eb7c, _0x34db6f, _0x4e6f30, _0x4310f2) {
    _0x356c86();
    const _0x77779e = _0x4310f2.attributes,
      _0x9ac455 = _0x4e6f30.getAttributes(),
      _0x58fea6 = _0x34db6f.defaultAttributeValues;
    for (const _0x14f980 in _0x9ac455) {
      const _0x2b4b0a = _0x9ac455[_0x14f980];
      if (_0x2b4b0a.location >= 0) {
        let _0x2cda48 = _0x77779e[_0x14f980];
        if (_0x2cda48 === undefined) {
          if (_0x14f980 === 'instanceMatrix' && _0x36eb7c.instanceMatrix)
            _0x2cda48 = _0x36eb7c.instanceMatrix;
          if (_0x14f980 === 'instanceColor' && _0x36eb7c.instanceColor) _0x2cda48 = _0x36eb7c.instanceColor;
        }
        if (_0x2cda48 !== undefined) {
          const _0x1f5a8d = _0x2cda48.normalized,
            _0x1acc53 = _0x2cda48.itemSize,
            _0x24f71b = _0x37cff2.get(_0x2cda48);
          if (_0x24f71b === undefined) continue;
          const _0x369c67 = _0x24f71b.buffer,
            _0x58d24a = _0x24f71b.type,
            _0x3ac023 = _0x24f71b.bytesPerElement,
            _0x45f0a5 =
              _0x58d24a === _0x23e9c1.INT ||
              _0x58d24a === _0x23e9c1.UNSIGNED_INT ||
              _0x2cda48.gpuType === IntType;
          if (_0x2cda48.isInterleavedBufferAttribute) {
            const _0x3a4806 = _0x2cda48.data,
              _0x5e2844 = _0x3a4806.stride,
              _0x1b604f = _0x2cda48.offset;
            if (_0x3a4806.isInstancedInterleavedBuffer) {
              for (let _0x5f37e4 = 0; _0x5f37e4 < _0x2b4b0a.locationSize; _0x5f37e4++) {
                _0x1cf405(_0x2b4b0a.location + _0x5f37e4, _0x3a4806.meshPerAttribute);
              }
              _0x36eb7c.isInstancedMesh !== true &&
                _0x4310f2._maxInstanceCount === undefined &&
                (_0x4310f2._maxInstanceCount = _0x3a4806.meshPerAttribute * _0x3a4806.count);
            } else
              for (let _0x1f470d = 0; _0x1f470d < _0x2b4b0a.locationSize; _0x1f470d++) {
                _0x42b474(_0x2b4b0a.location + _0x1f470d);
              }
            _0x23e9c1.bindBuffer(_0x23e9c1.ARRAY_BUFFER, _0x369c67);
            for (let _0x303b7e = 0; _0x303b7e < _0x2b4b0a.locationSize; _0x303b7e++) {
              _0x323471(
                _0x2b4b0a.location + _0x303b7e,
                _0x1acc53 / _0x2b4b0a.locationSize,
                _0x58d24a,
                _0x1f5a8d,
                _0x5e2844 * _0x3ac023,
                (_0x1b604f + (_0x1acc53 / _0x2b4b0a.locationSize) * _0x303b7e) * _0x3ac023,
                _0x45f0a5,
              );
            }
          } else {
            if (_0x2cda48.isInstancedBufferAttribute) {
              for (let _0xa1e6b7 = 0; _0xa1e6b7 < _0x2b4b0a.locationSize; _0xa1e6b7++) {
                _0x1cf405(_0x2b4b0a.location + _0xa1e6b7, _0x2cda48.meshPerAttribute);
              }
              _0x36eb7c.isInstancedMesh !== true &&
                _0x4310f2._maxInstanceCount === undefined &&
                (_0x4310f2._maxInstanceCount = _0x2cda48.meshPerAttribute * _0x2cda48.count);
            } else
              for (let _0x5dcc0c = 0; _0x5dcc0c < _0x2b4b0a.locationSize; _0x5dcc0c++) {
                _0x42b474(_0x2b4b0a.location + _0x5dcc0c);
              }
            _0x23e9c1.bindBuffer(_0x23e9c1.ARRAY_BUFFER, _0x369c67);
            for (let _0x2f349e = 0; _0x2f349e < _0x2b4b0a.locationSize; _0x2f349e++) {
              _0x323471(
                _0x2b4b0a.location + _0x2f349e,
                _0x1acc53 / _0x2b4b0a.locationSize,
                _0x58d24a,
                _0x1f5a8d,
                _0x1acc53 * _0x3ac023,
                (_0x1acc53 / _0x2b4b0a.locationSize) * _0x2f349e * _0x3ac023,
                _0x45f0a5,
              );
            }
          }
        } else {
          if (_0x58fea6 !== undefined) {
            const _0x2534ae = _0x58fea6[_0x14f980];
            if (_0x2534ae !== undefined)
              switch (_0x2534ae.length) {
                case 2:
                  _0x23e9c1.vertexAttrib2fv(_0x2b4b0a.location, _0x2534ae);
                  break;
                case 3:
                  _0x23e9c1.vertexAttrib3fv(_0x2b4b0a.location, _0x2534ae);
                  break;
                case 4:
                  _0x23e9c1.vertexAttrib4fv(_0x2b4b0a.location, _0x2534ae);
                  break;
                default:
                  _0x23e9c1.vertexAttrib1fv(_0x2b4b0a.location, _0x2534ae);
              }
          }
        }
      }
    }
    _0x50261a();
  }
  function _0x454f21() {
    _0x3bbbd8();
    for (const _0x4766ef in _0x292dd5) {
      const _0x130b19 = _0x292dd5[_0x4766ef];
      for (const _0x10c2a9 in _0x130b19) {
        const _0x387b42 = _0x130b19[_0x10c2a9];
        for (const _0x1a35d6 in _0x387b42) {
          (_0x569b06(_0x387b42[_0x1a35d6].object), delete _0x387b42[_0x1a35d6]);
        }
        delete _0x130b19[_0x10c2a9];
      }
      delete _0x292dd5[_0x4766ef];
    }
  }
  function _0xa482aa(_0x81d00a) {
    if (_0x292dd5[_0x81d00a.id] === undefined) return;
    const _0x4a2957 = _0x292dd5[_0x81d00a.id];
    for (const _0x4e09ac in _0x4a2957) {
      const _0x4fc2a3 = _0x4a2957[_0x4e09ac];
      for (const _0x4a6057 in _0x4fc2a3) {
        (_0x569b06(_0x4fc2a3[_0x4a6057].object), delete _0x4fc2a3[_0x4a6057]);
      }
      delete _0x4a2957[_0x4e09ac];
    }
    delete _0x292dd5[_0x81d00a.id];
  }
  function _0x282232(_0x504d1b) {
    for (const _0x3ff0d0 in _0x292dd5) {
      const _0x286311 = _0x292dd5[_0x3ff0d0];
      if (_0x286311[_0x504d1b.id] === undefined) continue;
      const _0x1451f7 = _0x286311[_0x504d1b.id];
      for (const _0x898fa5 in _0x1451f7) {
        (_0x569b06(_0x1451f7[_0x898fa5].object), delete _0x1451f7[_0x898fa5]);
      }
      delete _0x286311[_0x504d1b.id];
    }
  }
  function _0x3bbbd8() {
    (_0x4f81aa(), (_0x4e37b9 = true));
    if (_0x15d02c === _0x49107a) return;
    ((_0x15d02c = _0x49107a), _0x51b411(_0x15d02c.object));
  }
  function _0x4f81aa() {
    ((_0x49107a.geometry = null), (_0x49107a.program = null), (_0x49107a.wireframe = false));
  }
  return {
    setup: _0x153048,
    reset: _0x3bbbd8,
    resetDefaultState: _0x4f81aa,
    dispose: _0x454f21,
    releaseStatesOfGeometry: _0xa482aa,
    releaseStatesOfProgram: _0x282232,
    initAttributes: _0x356c86,
    enableAttribute: _0x42b474,
    disableUnusedAttributes: _0x50261a,
  };
}
function WebGLBufferRenderer(_0x52bfe8, _0x3d2e09, _0x3f3fdc) {
  let _0x55086c;
  function _0x7b10d4(_0x5306eb) {
    _0x55086c = _0x5306eb;
  }
  function _0x314f14(_0x316454, _0x59a2b4) {
    (_0x52bfe8.drawArrays(_0x55086c, _0x316454, _0x59a2b4), _0x3f3fdc.update(_0x59a2b4, _0x55086c, 1));
  }
  function _0x36601e(_0xda1f0f, _0x31f2c4, _0x3aade5) {
    if (_0x3aade5 === 0) return;
    (_0x52bfe8.drawArraysInstanced(_0x55086c, _0xda1f0f, _0x31f2c4, _0x3aade5),
      _0x3f3fdc.update(_0x31f2c4, _0x55086c, _0x3aade5));
  }
  function _0x45e37a(_0x1f1957, _0x2f9989, _0x49999f) {
    if (_0x49999f === 0) return;
    const _0x2f0b76 = _0x3d2e09.get('WEBGL_multi_draw');
    _0x2f0b76.multiDrawArraysWEBGL(_0x55086c, _0x1f1957, 0, _0x2f9989, 0, _0x49999f);
    let _0xe82f67 = 0;
    for (let _0x51d2b6 = 0; _0x51d2b6 < _0x49999f; _0x51d2b6++) {
      _0xe82f67 += _0x2f9989[_0x51d2b6];
    }
    _0x3f3fdc.update(_0xe82f67, _0x55086c, 1);
  }
  function _0x43173a(_0x1b8030, _0x1362a3, _0x103b92, _0x1a922f) {
    if (_0x103b92 === 0) return;
    const _0x29db4c = _0x3d2e09.get('WEBGL_multi_draw');
    if (_0x29db4c === null)
      for (let _0x490748 = 0; _0x490748 < _0x1b8030.length; _0x490748++) {
        _0x36601e(_0x1b8030[_0x490748], _0x1362a3[_0x490748], _0x1a922f[_0x490748]);
      }
    else {
      _0x29db4c.multiDrawArraysInstancedWEBGL(_0x55086c, _0x1b8030, 0, _0x1362a3, 0, _0x1a922f, 0, _0x103b92);
      let _0x97b1d4 = 0;
      for (let _0x1cbd3a = 0; _0x1cbd3a < _0x103b92; _0x1cbd3a++) {
        _0x97b1d4 += _0x1362a3[_0x1cbd3a] * _0x1a922f[_0x1cbd3a];
      }
      _0x3f3fdc.update(_0x97b1d4, _0x55086c, 1);
    }
  }
  ((this.setMode = _0x7b10d4),
    (this.render = _0x314f14),
    (this.renderInstances = _0x36601e),
    (this.renderMultiDraw = _0x45e37a),
    (this.renderMultiDrawInstances = _0x43173a));
}
function WebGLCapabilities(_0x2cb1d1, _0x3451f3, _0x2095d1, _0x6d7ca0) {
  let _0x349df3;
  function _0x2b3dcb() {
    if (_0x349df3 !== undefined) return _0x349df3;
    if (_0x3451f3.has('EXT_texture_filter_anisotropic') === true) {
      const _0x1f671b = _0x3451f3.get('EXT_texture_filter_anisotropic');
      _0x349df3 = _0x2cb1d1.getParameter(_0x1f671b.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
    } else _0x349df3 = 0;
    return _0x349df3;
  }
  function _0x2f3021(_0x43a8a2) {
    if (
      _0x43a8a2 !== RGBAFormat &&
      _0x6d7ca0.convert(_0x43a8a2) !== _0x2cb1d1.getParameter(_0x2cb1d1.IMPLEMENTATION_COLOR_READ_FORMAT)
    )
      return false;
    return true;
  }
  function _0x2796fc(_0x3124b2) {
    const _0x3663c0 =
      _0x3124b2 === HalfFloatType &&
      (_0x3451f3.has('EXT_color_buffer_half_float') || _0x3451f3.has('EXT_color_buffer_float'));
    if (
      _0x3124b2 !== UnsignedByteType &&
      _0x6d7ca0.convert(_0x3124b2) !== _0x2cb1d1.getParameter(_0x2cb1d1.IMPLEMENTATION_COLOR_READ_TYPE) &&
      _0x3124b2 !== FloatType &&
      !_0x3663c0
    )
      return false;
    return true;
  }
  function _0x4e03e5(_0x360f2b) {
    if (_0x360f2b === 'highp') {
      if (
        _0x2cb1d1.getShaderPrecisionFormat(_0x2cb1d1.VERTEX_SHADER, _0x2cb1d1.HIGH_FLOAT).precision > 0 &&
        _0x2cb1d1.getShaderPrecisionFormat(_0x2cb1d1.FRAGMENT_SHADER, _0x2cb1d1.HIGH_FLOAT).precision > 0
      )
        return 'highp';
      _0x360f2b = 'mediump';
    }
    if (_0x360f2b === 'mediump') {
      if (
        _0x2cb1d1.getShaderPrecisionFormat(_0x2cb1d1.VERTEX_SHADER, _0x2cb1d1.MEDIUM_FLOAT).precision > 0 &&
        _0x2cb1d1.getShaderPrecisionFormat(_0x2cb1d1.FRAGMENT_SHADER, _0x2cb1d1.MEDIUM_FLOAT).precision > 0
      )
        return 'mediump';
    }
    return 'lowp';
  }
  let _0x5443f2 = _0x2095d1.precision !== undefined ? _0x2095d1.precision : 'highp';
  const _0x4c25eb = _0x4e03e5(_0x5443f2);
  _0x4c25eb !== _0x5443f2 &&
    (console.warn('THREE.WebGLRenderer:', _0x5443f2, 'not supported, using', _0x4c25eb, 'instead.'),
    (_0x5443f2 = _0x4c25eb));
  const _0x1de024 = _0x2095d1.logarithmicDepthBuffer === true,
    _0x229061 = _0x2095d1.reversedDepthBuffer === true && _0x3451f3.has('EXT_clip_control'),
    _0xe0dc9a = _0x2cb1d1.getParameter(_0x2cb1d1.MAX_TEXTURE_IMAGE_UNITS),
    _0x48ddf3 = _0x2cb1d1.getParameter(_0x2cb1d1.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
    _0x1ad365 = _0x2cb1d1.getParameter(_0x2cb1d1.MAX_TEXTURE_SIZE),
    _0x375a0b = _0x2cb1d1.getParameter(_0x2cb1d1.MAX_CUBE_MAP_TEXTURE_SIZE),
    _0x1d7c96 = _0x2cb1d1.getParameter(_0x2cb1d1.MAX_VERTEX_ATTRIBS),
    _0x50e030 = _0x2cb1d1.getParameter(_0x2cb1d1.MAX_VERTEX_UNIFORM_VECTORS),
    _0x3b409e = _0x2cb1d1.getParameter(_0x2cb1d1.MAX_VARYING_VECTORS),
    _0x2e666a = _0x2cb1d1.getParameter(_0x2cb1d1.MAX_FRAGMENT_UNIFORM_VECTORS),
    _0x3bf828 = _0x48ddf3 > 0,
    _0xa29902 = _0x2cb1d1.getParameter(_0x2cb1d1.MAX_SAMPLES);
  return {
    isWebGL2: true,
    getMaxAnisotropy: _0x2b3dcb,
    getMaxPrecision: _0x4e03e5,
    textureFormatReadable: _0x2f3021,
    textureTypeReadable: _0x2796fc,
    precision: _0x5443f2,
    logarithmicDepthBuffer: _0x1de024,
    reversedDepthBuffer: _0x229061,
    maxTextures: _0xe0dc9a,
    maxVertexTextures: _0x48ddf3,
    maxTextureSize: _0x1ad365,
    maxCubemapSize: _0x375a0b,
    maxAttributes: _0x1d7c96,
    maxVertexUniforms: _0x50e030,
    maxVaryings: _0x3b409e,
    maxFragmentUniforms: _0x2e666a,
    vertexTextures: _0x3bf828,
    maxSamples: _0xa29902,
  };
}
function WebGLClipping(_0x5883e2) {
  const _0x383569 = this;
  let _0x5b9da5 = null,
    _0x36c74e = 0,
    _0x3df51 = false,
    _0x3a4191 = false;
  const _0x11353c = new Plane(),
    _0x3499a6 = new Matrix3(),
    _0x1c0eab = { value: null, needsUpdate: false };
  ((this.uniform = _0x1c0eab),
    (this.numPlanes = 0),
    (this.numIntersection = 0),
    (this.init = function (_0x203fe2, _0x46e07c) {
      const _0x2b042a = _0x203fe2.length !== 0 || _0x46e07c || _0x36c74e !== 0 || _0x3df51;
      return ((_0x3df51 = _0x46e07c), (_0x36c74e = _0x203fe2.length), _0x2b042a);
    }),
    (this.beginShadows = function () {
      ((_0x3a4191 = true), _0x3a2a53(null));
    }),
    (this.endShadows = function () {
      _0x3a4191 = false;
    }),
    (this.setGlobalState = function (_0x7469d, _0x5d4d60) {
      _0x5b9da5 = _0x3a2a53(_0x7469d, _0x5d4d60, 0);
    }),
    (this.setState = function (_0x257059, _0x152de7, _0x5c266c) {
      const _0xe22934 = _0x257059.clippingPlanes,
        _0x181e61 = _0x257059.clipIntersection,
        _0x2a99dd = _0x257059.clipShadows,
        _0x473b64 = _0x5883e2.get(_0x257059);
      if (!_0x3df51 || _0xe22934 === null || _0xe22934.length === 0 || (_0x3a4191 && !_0x2a99dd))
        _0x3a4191 ? _0x3a2a53(null) : _0x82cb3();
      else {
        const _0x454637 = _0x3a4191 ? 0 : _0x36c74e,
          _0x2fa4b6 = _0x454637 * 4;
        let _0x392d8d = _0x473b64.clippingState || null;
        ((_0x1c0eab.value = _0x392d8d), (_0x392d8d = _0x3a2a53(_0xe22934, _0x152de7, _0x2fa4b6, _0x5c266c)));
        for (let _0x2b9ba7 = 0; _0x2b9ba7 !== _0x2fa4b6; ++_0x2b9ba7) {
          _0x392d8d[_0x2b9ba7] = _0x5b9da5[_0x2b9ba7];
        }
        ((_0x473b64.clippingState = _0x392d8d),
          (this.numIntersection = _0x181e61 ? this.numPlanes : 0),
          (this.numPlanes += _0x454637));
      }
    }));
  function _0x82cb3() {
    (_0x1c0eab.value !== _0x5b9da5 &&
      ((_0x1c0eab.value = _0x5b9da5), (_0x1c0eab.needsUpdate = _0x36c74e > 0)),
      (_0x383569.numPlanes = _0x36c74e),
      (_0x383569.numIntersection = 0));
  }
  function _0x3a2a53(_0x2ed779, _0x4da784, _0x1d9ea6, _0x56cafb) {
    const _0x1c98bb = _0x2ed779 !== null ? _0x2ed779.length : 0;
    let _0x1c3fef = null;
    if (_0x1c98bb !== 0) {
      _0x1c3fef = _0x1c0eab.value;
      if (_0x56cafb !== true || _0x1c3fef === null) {
        const _0x25b02e = _0x1d9ea6 + _0x1c98bb * 4,
          _0x48bbfc = _0x4da784.matrixWorldInverse;
        _0x3499a6.getNormalMatrix(_0x48bbfc);
        (_0x1c3fef === null || _0x1c3fef.length < _0x25b02e) && (_0x1c3fef = new Float32Array(_0x25b02e));
        for (let _0x19cc2e = 0, _0x1caf10 = _0x1d9ea6; _0x19cc2e !== _0x1c98bb; ++_0x19cc2e, _0x1caf10 += 4) {
          (_0x11353c.copy(_0x2ed779[_0x19cc2e]).applyMatrix4(_0x48bbfc, _0x3499a6),
            _0x11353c.normal.toArray(_0x1c3fef, _0x1caf10),
            (_0x1c3fef[_0x1caf10 + 3] = _0x11353c.constant));
        }
      }
      ((_0x1c0eab.value = _0x1c3fef), (_0x1c0eab.needsUpdate = true));
    }
    return ((_0x383569.numPlanes = _0x1c98bb), (_0x383569.numIntersection = 0), _0x1c3fef);
  }
}
function WebGLCubeMaps(_0x532d00) {
  let _0x265753 = new WeakMap();
  function _0x4656bb(_0x5f01d4, _0x3ff340) {
    if (_0x3ff340 === EquirectangularReflectionMapping) _0x5f01d4.mapping = CubeReflectionMapping;
    else _0x3ff340 === EquirectangularRefractionMapping && (_0x5f01d4.mapping = CubeRefractionMapping);
    return _0x5f01d4;
  }
  function _0x213405(_0x1c91b2) {
    if (_0x1c91b2 && _0x1c91b2.isTexture) {
      const _0x862e1 = _0x1c91b2.mapping;
      if (_0x862e1 === EquirectangularReflectionMapping || _0x862e1 === EquirectangularRefractionMapping) {
        if (_0x265753.has(_0x1c91b2)) {
          const _0x8c3212 = _0x265753.get(_0x1c91b2).texture;
          return _0x4656bb(_0x8c3212, _0x1c91b2.mapping);
        } else {
          const _0x48a608 = _0x1c91b2.image;
          if (_0x48a608 && _0x48a608.height > 0) {
            const _0xf22ca5 = new WebGLCubeRenderTarget(_0x48a608.height);
            return (
              _0xf22ca5.fromEquirectangularTexture(_0x532d00, _0x1c91b2),
              _0x265753.set(_0x1c91b2, _0xf22ca5),
              _0x1c91b2.addEventListener('dispose', _0x35237a),
              _0x4656bb(_0xf22ca5.texture, _0x1c91b2.mapping)
            );
          } else return null;
        }
      }
    }
    return _0x1c91b2;
  }
  function _0x35237a(_0x45c04b) {
    const _0x2833a0 = _0x45c04b.target;
    _0x2833a0.removeEventListener('dispose', _0x35237a);
    const _0x5ee34d = _0x265753.get(_0x2833a0);
    _0x5ee34d !== undefined && (_0x265753.delete(_0x2833a0), _0x5ee34d.dispose());
  }
  function _0x3f0dcd() {
    _0x265753 = new WeakMap();
  }
  return { get: _0x213405, dispose: _0x3f0dcd };
}
const LOD_MIN = 4,
  EXTRA_LOD_SIGMA = [0.125, 0.215, 0.35, 0.446, 0.526, 0.582],
  MAX_SAMPLES = 20,
  _flatCamera = new OrthographicCamera(),
  _clearColor = new Color();
let _oldTarget = null,
  _oldActiveCubeFace = 0,
  _oldActiveMipmapLevel = 0,
  _oldXrEnabled = false;
const PHI = (1 + Math.sqrt(5)) / 2,
  INV_PHI = 1 / PHI,
  _axisDirections = [
    new Vector3(-PHI, INV_PHI, 0),
    new Vector3(PHI, INV_PHI, 0),
    new Vector3(-INV_PHI, 0, PHI),
    new Vector3(INV_PHI, 0, PHI),
    new Vector3(0, PHI, -INV_PHI),
    new Vector3(0, PHI, INV_PHI),
    new Vector3(-1, 1, -1),
    new Vector3(1, 1, -1),
    new Vector3(-1, 1, 1),
    new Vector3(1, 1, 1),
  ],
  _origin = new Vector3();
class PMREMGenerator {
  constructor(_0x5dcc9e) {
    ((this._renderer = _0x5dcc9e),
      (this._pingPongRenderTarget = null),
      (this._lodMax = 0),
      (this._cubeSize = 0),
      (this._lodPlanes = []),
      (this._sizeLods = []),
      (this._sigmas = []),
      (this._blurMaterial = null),
      (this._cubemapMaterial = null),
      (this._equirectMaterial = null),
      this._compileMaterial(this._blurMaterial));
  }
  ['fromScene'](_0x216d6a, _0x4f797c = 0, _0x5e308e = 0.1, _0xb547a1 = 100, _0x5f38e0 = {}) {
    const { size: size = 0x100, position: position = _origin } = _0x5f38e0;
    ((_oldTarget = this._renderer.getRenderTarget()),
      (_oldActiveCubeFace = this._renderer.getActiveCubeFace()),
      (_oldActiveMipmapLevel = this._renderer.getActiveMipmapLevel()),
      (_oldXrEnabled = this._renderer.xr.enabled),
      (this._renderer.xr.enabled = false),
      this._setSize(size));
    const _0x3a2344 = this._allocateTargets();
    return (
      (_0x3a2344.depthBuffer = true),
      this._sceneToCubeUV(_0x216d6a, _0x5e308e, _0xb547a1, _0x3a2344, position),
      _0x4f797c > 0 && this._blur(_0x3a2344, 0, 0, _0x4f797c),
      this._applyPMREM(_0x3a2344),
      this._cleanup(_0x3a2344),
      _0x3a2344
    );
  }
  ['fromEquirectangular'](_0x4911a5, _0x3ac758 = null) {
    return this._fromTexture(_0x4911a5, _0x3ac758);
  }
  ['fromCubemap'](_0x5eb195, _0x9e5765 = null) {
    return this._fromTexture(_0x5eb195, _0x9e5765);
  }
  ['compileCubemapShader']() {
    this._cubemapMaterial === null &&
      ((this._cubemapMaterial = _getCubemapMaterial()), this._compileMaterial(this._cubemapMaterial));
  }
  ['compileEquirectangularShader']() {
    this._equirectMaterial === null &&
      ((this._equirectMaterial = _getEquirectMaterial()), this._compileMaterial(this._equirectMaterial));
  }
  ['dispose']() {
    this._dispose();
    if (this._cubemapMaterial !== null) this._cubemapMaterial.dispose();
    if (this._equirectMaterial !== null) this._equirectMaterial.dispose();
  }
  ['_setSize'](_0x13b9da) {
    ((this._lodMax = Math.floor(Math.log2(_0x13b9da))), (this._cubeSize = Math.pow(2, this._lodMax)));
  }
  ['_dispose']() {
    if (this._blurMaterial !== null) this._blurMaterial.dispose();
    if (this._pingPongRenderTarget !== null) this._pingPongRenderTarget.dispose();
    for (let _0x16a9f6 = 0; _0x16a9f6 < this._lodPlanes.length; _0x16a9f6++) {
      this._lodPlanes[_0x16a9f6].dispose();
    }
  }
  ['_cleanup'](_0x2be095) {
    (this._renderer.setRenderTarget(_oldTarget, _oldActiveCubeFace, _oldActiveMipmapLevel),
      (this._renderer.xr.enabled = _oldXrEnabled),
      (_0x2be095.scissorTest = false),
      _setViewport(_0x2be095, 0, 0, _0x2be095.width, _0x2be095.height));
  }
  ['_fromTexture'](_0x43178e, _0x150dd3) {
    _0x43178e.mapping === CubeReflectionMapping || _0x43178e.mapping === CubeRefractionMapping
      ? this._setSize(
          _0x43178e.image.length === 0 ? 16 : _0x43178e.image[0].width || _0x43178e.image[0].image.width,
        )
      : this._setSize(_0x43178e.image.width / 4);
    ((_oldTarget = this._renderer.getRenderTarget()),
      (_oldActiveCubeFace = this._renderer.getActiveCubeFace()),
      (_oldActiveMipmapLevel = this._renderer.getActiveMipmapLevel()),
      (_oldXrEnabled = this._renderer.xr.enabled),
      (this._renderer.xr.enabled = false));
    const _0x2932ff = _0x150dd3 || this._allocateTargets();
    return (
      this._textureToCubeUV(_0x43178e, _0x2932ff),
      this._applyPMREM(_0x2932ff),
      this._cleanup(_0x2932ff),
      _0x2932ff
    );
  }
  ['_allocateTargets']() {
    const _0x1887e0 = 3 * Math.max(this._cubeSize, 16 * 7),
      _0x80d01a = 4 * this._cubeSize,
      _0x4274a9 = {
        magFilter: LinearFilter,
        minFilter: LinearFilter,
        generateMipmaps: false,
        type: HalfFloatType,
        format: RGBAFormat,
        colorSpace: LinearSRGBColorSpace,
        depthBuffer: false,
      },
      _0x3d50ee = _createRenderTarget(_0x1887e0, _0x80d01a, _0x4274a9);
    if (
      this._pingPongRenderTarget === null ||
      this._pingPongRenderTarget.width !== _0x1887e0 ||
      this._pingPongRenderTarget.height !== _0x80d01a
    ) {
      this._pingPongRenderTarget !== null && this._dispose();
      this._pingPongRenderTarget = _createRenderTarget(_0x1887e0, _0x80d01a, _0x4274a9);
      const { _lodMax: _0xebf592 } = this;
      (({
        sizeLods: this._sizeLods,
        lodPlanes: this._lodPlanes,
        sigmas: this._sigmas,
      } = _createPlanes(_0xebf592)),
        (this._blurMaterial = _getBlurShader(_0xebf592, _0x1887e0, _0x80d01a)));
    }
    return _0x3d50ee;
  }
  ['_compileMaterial'](_0x19cda3) {
    const _0x42b55f = new Mesh(this._lodPlanes[0], _0x19cda3);
    this._renderer.compile(_0x42b55f, _flatCamera);
  }
  ['_sceneToCubeUV'](_0xc21ea2, _0xd5bf69, _0x3df7de, _0x22b43d, _0x83093e) {
    const _0x40c64c = 90,
      _0x861b07 = 1,
      _0x19ac92 = new PerspectiveCamera(_0x40c64c, _0x861b07, _0xd5bf69, _0x3df7de),
      _0x5acfa7 = [1, -1, 1, 1, 1, 1],
      _0x6dfb05 = [1, 1, 1, -1, -1, -1],
      _0x4f1ebc = this._renderer,
      _0x518122 = _0x4f1ebc.autoClear,
      _0x34249b = _0x4f1ebc.toneMapping;
    (_0x4f1ebc.getClearColor(_clearColor),
      (_0x4f1ebc.toneMapping = NoToneMapping),
      (_0x4f1ebc.autoClear = false));
    const _0x5c7c0b = _0x4f1ebc.state.buffers.depth.getReversed();
    _0x5c7c0b &&
      (_0x4f1ebc.setRenderTarget(_0x22b43d), _0x4f1ebc.clearDepth(), _0x4f1ebc.setRenderTarget(null));
    const _0x292187 = new MeshBasicMaterial({
        name: 'PMREM.Background',
        side: BackSide,
        depthWrite: false,
        depthTest: false,
      }),
      _0x40fde7 = new Mesh(new BoxGeometry(), _0x292187);
    let _0x171fcb = false;
    const _0x44377e = _0xc21ea2.background;
    _0x44377e
      ? _0x44377e.isColor &&
        (_0x292187.color.copy(_0x44377e), (_0xc21ea2.background = null), (_0x171fcb = true))
      : (_0x292187.color.copy(_clearColor), (_0x171fcb = true));
    for (let _0x58bb9a = 0; _0x58bb9a < 6; _0x58bb9a++) {
      const _0x2a0b79 = _0x58bb9a % 3;
      if (_0x2a0b79 === 0)
        (_0x19ac92.up.set(0, _0x5acfa7[_0x58bb9a], 0),
          _0x19ac92.position.set(_0x83093e.x, _0x83093e.y, _0x83093e.z),
          _0x19ac92.lookAt(_0x83093e.x + _0x6dfb05[_0x58bb9a], _0x83093e.y, _0x83093e.z));
      else
        _0x2a0b79 === 1
          ? (_0x19ac92.up.set(0, 0, _0x5acfa7[_0x58bb9a]),
            _0x19ac92.position.set(_0x83093e.x, _0x83093e.y, _0x83093e.z),
            _0x19ac92.lookAt(_0x83093e.x, _0x83093e.y + _0x6dfb05[_0x58bb9a], _0x83093e.z))
          : (_0x19ac92.up.set(0, _0x5acfa7[_0x58bb9a], 0),
            _0x19ac92.position.set(_0x83093e.x, _0x83093e.y, _0x83093e.z),
            _0x19ac92.lookAt(_0x83093e.x, _0x83093e.y, _0x83093e.z + _0x6dfb05[_0x58bb9a]));
      const _0x15e9df = this._cubeSize;
      (_setViewport(_0x22b43d, _0x2a0b79 * _0x15e9df, _0x58bb9a > 2 ? _0x15e9df : 0, _0x15e9df, _0x15e9df),
        _0x4f1ebc.setRenderTarget(_0x22b43d),
        _0x171fcb && _0x4f1ebc.render(_0x40fde7, _0x19ac92),
        _0x4f1ebc.render(_0xc21ea2, _0x19ac92));
    }
    (_0x40fde7.geometry.dispose(),
      _0x40fde7.material.dispose(),
      (_0x4f1ebc.toneMapping = _0x34249b),
      (_0x4f1ebc.autoClear = _0x518122),
      (_0xc21ea2.background = _0x44377e));
  }
  ['_textureToCubeUV'](_0x3fd964, _0x127f5a) {
    const _0x23440f = this._renderer,
      _0x996013 = _0x3fd964.mapping === CubeReflectionMapping || _0x3fd964.mapping === CubeRefractionMapping;
    _0x996013
      ? (this._cubemapMaterial === null && (this._cubemapMaterial = _getCubemapMaterial()),
        (this._cubemapMaterial.uniforms.flipEnvMap.value =
          _0x3fd964.isRenderTargetTexture === false ? -1 : 1))
      : this._equirectMaterial === null && (this._equirectMaterial = _getEquirectMaterial());
    const _0x8c36b8 = _0x996013 ? this._cubemapMaterial : this._equirectMaterial,
      _0x3c1d43 = new Mesh(this._lodPlanes[0], _0x8c36b8),
      _0x4675a6 = _0x8c36b8.uniforms;
    _0x4675a6.envMap.value = _0x3fd964;
    const _0x3ceccf = this._cubeSize;
    (_setViewport(_0x127f5a, 0, 0, 3 * _0x3ceccf, 2 * _0x3ceccf),
      _0x23440f.setRenderTarget(_0x127f5a),
      _0x23440f.render(_0x3c1d43, _flatCamera));
  }
  ['_applyPMREM'](_0x1cfe9b) {
    const _0x1ee6cf = this._renderer,
      _0xcd0002 = _0x1ee6cf.autoClear;
    _0x1ee6cf.autoClear = false;
    const _0x289d92 = this._lodPlanes.length;
    for (let _0xf41a16 = 1; _0xf41a16 < _0x289d92; _0xf41a16++) {
      const _0x4bf38a = Math.sqrt(
          this._sigmas[_0xf41a16] * this._sigmas[_0xf41a16] -
            this._sigmas[_0xf41a16 - 1] * this._sigmas[_0xf41a16 - 1],
        ),
        _0x3d0506 = _axisDirections[(_0x289d92 - _0xf41a16 - 1) % _axisDirections.length];
      this._blur(_0x1cfe9b, _0xf41a16 - 1, _0xf41a16, _0x4bf38a, _0x3d0506);
    }
    _0x1ee6cf.autoClear = _0xcd0002;
  }
  ['_blur'](_0x1c71b9, _0x123438, _0x5073b4, _0x1a57dc, _0x5b3cf2) {
    const _0x116bb5 = this._pingPongRenderTarget;
    (this._halfBlur(_0x1c71b9, _0x116bb5, _0x123438, _0x5073b4, _0x1a57dc, 'latitudinal', _0x5b3cf2),
      this._halfBlur(_0x116bb5, _0x1c71b9, _0x5073b4, _0x5073b4, _0x1a57dc, 'longitudinal', _0x5b3cf2));
  }
  ['_halfBlur'](_0x5c9c2d, _0x509869, _0x3b5e5b, _0x46287b, _0x25c34b, _0x503985, _0x5bf935) {
    const _0x90a1f6 = this._renderer,
      _0x385d89 = this._blurMaterial;
    _0x503985 !== 'latitudinal' &&
      _0x503985 !== 'longitudinal' &&
      console.error('blur direction must be either latitudinal or longitudinal!');
    const _0x324b2b = 3,
      _0x33153b = new Mesh(this._lodPlanes[_0x46287b], _0x385d89),
      _0x5527ee = _0x385d89.uniforms,
      _0x44c100 = this._sizeLods[_0x3b5e5b] - 1,
      _0x475c53 = isFinite(_0x25c34b) ? Math.PI / (2 * _0x44c100) : (2 * Math.PI) / (2 * MAX_SAMPLES - 1),
      _0x4db3db = _0x25c34b / _0x475c53,
      _0x283075 = isFinite(_0x25c34b) ? 1 + Math.floor(_0x324b2b * _0x4db3db) : MAX_SAMPLES;
    _0x283075 > MAX_SAMPLES &&
      console.warn(
        'sigmaRadians, ' +
          _0x25c34b +
          ', is too large and will clip, as it requested ' +
          _0x283075 +
          ' samples when the maximum is set to ' +
          MAX_SAMPLES,
      );
    const _0xdcffec = [];
    let _0xc6c8ab = 0;
    for (let _0x10a25c = 0; _0x10a25c < MAX_SAMPLES; ++_0x10a25c) {
      const _0x4e3539 = _0x10a25c / _0x4db3db,
        _0xc3c77b = Math.exp((-_0x4e3539 * _0x4e3539) / 2);
      _0xdcffec.push(_0xc3c77b);
      if (_0x10a25c === 0) _0xc6c8ab += _0xc3c77b;
      else _0x10a25c < _0x283075 && (_0xc6c8ab += 2 * _0xc3c77b);
    }
    for (let _0x401386 = 0; _0x401386 < _0xdcffec.length; _0x401386++) {
      _0xdcffec[_0x401386] = _0xdcffec[_0x401386] / _0xc6c8ab;
    }
    ((_0x5527ee.envMap.value = _0x5c9c2d.texture),
      (_0x5527ee.samples.value = _0x283075),
      (_0x5527ee.weights.value = _0xdcffec),
      (_0x5527ee.latitudinal.value = _0x503985 === 'latitudinal'));
    _0x5bf935 && (_0x5527ee.poleAxis.value = _0x5bf935);
    const { _lodMax: _0x261d97 } = this;
    ((_0x5527ee.dTheta.value = _0x475c53), (_0x5527ee.mipInt.value = _0x261d97 - _0x3b5e5b));
    const _0x39a981 = this._sizeLods[_0x46287b],
      _0x9a2cf7 = 3 * _0x39a981 * (_0x46287b > _0x261d97 - LOD_MIN ? _0x46287b - _0x261d97 + LOD_MIN : 0),
      _0x3f485d = 4 * (this._cubeSize - _0x39a981);
    (_setViewport(_0x509869, _0x9a2cf7, _0x3f485d, 3 * _0x39a981, 2 * _0x39a981),
      _0x90a1f6.setRenderTarget(_0x509869),
      _0x90a1f6.render(_0x33153b, _flatCamera));
  }
}
function _createPlanes(_0x37e0dd) {
  const _0x585bc6 = [],
    _0x21c163 = [],
    _0x3b6488 = [];
  let _0x3bb7d3 = _0x37e0dd;
  const _0x537ef2 = _0x37e0dd - LOD_MIN + 1 + EXTRA_LOD_SIGMA.length;
  for (let _0x411ebd = 0; _0x411ebd < _0x537ef2; _0x411ebd++) {
    const _0xc04a53 = Math.pow(2, _0x3bb7d3);
    _0x21c163.push(_0xc04a53);
    let _0x24a492 = 1 / _0xc04a53;
    if (_0x411ebd > _0x37e0dd - LOD_MIN) _0x24a492 = EXTRA_LOD_SIGMA[_0x411ebd - _0x37e0dd + LOD_MIN - 1];
    else _0x411ebd === 0 && (_0x24a492 = 0);
    _0x3b6488.push(_0x24a492);
    const _0x36f4d3 = 1 / (_0xc04a53 - 2),
      _0x57900e = -_0x36f4d3,
      _0x11f6fe = 1 + _0x36f4d3,
      _0x2d48fa = [
        _0x57900e,
        _0x57900e,
        _0x11f6fe,
        _0x57900e,
        _0x11f6fe,
        _0x11f6fe,
        _0x57900e,
        _0x57900e,
        _0x11f6fe,
        _0x11f6fe,
        _0x57900e,
        _0x11f6fe,
      ],
      _0x5e9547 = 6,
      _0x4fabc0 = 6,
      _0x48a0af = 3,
      _0xc78036 = 2,
      _0xefbb5c = 1,
      _0x59cd38 = new Float32Array(_0x48a0af * _0x4fabc0 * _0x5e9547),
      _0xd396f7 = new Float32Array(_0xc78036 * _0x4fabc0 * _0x5e9547),
      _0x416f78 = new Float32Array(_0xefbb5c * _0x4fabc0 * _0x5e9547);
    for (let _0x39f790 = 0; _0x39f790 < _0x5e9547; _0x39f790++) {
      const _0x28058e = ((_0x39f790 % 3) * 2) / 3 - 1,
        _0x180254 = _0x39f790 > 2 ? 0 : -1,
        _0x40e46b = [
          _0x28058e,
          _0x180254,
          0,
          _0x28058e + 2 / 3,
          _0x180254,
          0,
          _0x28058e + 2 / 3,
          _0x180254 + 1,
          0,
          _0x28058e,
          _0x180254,
          0,
          _0x28058e + 2 / 3,
          _0x180254 + 1,
          0,
          _0x28058e,
          _0x180254 + 1,
          0,
        ];
      (_0x59cd38.set(_0x40e46b, _0x48a0af * _0x4fabc0 * _0x39f790),
        _0xd396f7.set(_0x2d48fa, _0xc78036 * _0x4fabc0 * _0x39f790));
      const _0x40f599 = [_0x39f790, _0x39f790, _0x39f790, _0x39f790, _0x39f790, _0x39f790];
      _0x416f78.set(_0x40f599, _0xefbb5c * _0x4fabc0 * _0x39f790);
    }
    const _0x25150c = new BufferGeometry();
    (_0x25150c.setAttribute('position', new BufferAttribute(_0x59cd38, _0x48a0af)),
      _0x25150c.setAttribute('uv', new BufferAttribute(_0xd396f7, _0xc78036)),
      _0x25150c.setAttribute('faceIndex', new BufferAttribute(_0x416f78, _0xefbb5c)),
      _0x585bc6.push(_0x25150c),
      _0x3bb7d3 > LOD_MIN && _0x3bb7d3--);
  }
  return { lodPlanes: _0x585bc6, sizeLods: _0x21c163, sigmas: _0x3b6488 };
}
function _createRenderTarget(_0x1d572f, _0x3dad19, _0xfd1e68) {
  const _0x41cf3c = new WebGLRenderTarget(_0x1d572f, _0x3dad19, _0xfd1e68);
  return (
    (_0x41cf3c.texture.mapping = CubeUVReflectionMapping),
    (_0x41cf3c.texture.name = 'PMREM.cubeUv'),
    (_0x41cf3c.scissorTest = true),
    _0x41cf3c
  );
}
function _setViewport(_0x2e28aa, _0x5bb26b, _0x420d9a, _0x45ce2e, _0x284f53) {
  (_0x2e28aa.viewport.set(_0x5bb26b, _0x420d9a, _0x45ce2e, _0x284f53),
    _0x2e28aa.scissor.set(_0x5bb26b, _0x420d9a, _0x45ce2e, _0x284f53));
}
function _getBlurShader(_0x48d864, _0x177dc5, _0x406f2a) {
  const _0x19298a = new Float32Array(MAX_SAMPLES),
    _0x58ea60 = new Vector3(0, 1, 0),
    _0x5e0e68 = new ShaderMaterial({
      name: 'SphericalGaussianBlur',
      defines: {
        n: MAX_SAMPLES,
        CUBEUV_TEXEL_WIDTH: 1 / _0x177dc5,
        CUBEUV_TEXEL_HEIGHT: 1 / _0x406f2a,
        CUBEUV_MAX_MIP: _0x48d864 + '.0',
      },
      uniforms: {
        envMap: { value: null },
        samples: { value: 1 },
        weights: { value: _0x19298a },
        latitudinal: { value: false },
        dTheta: { value: 0 },
        mipInt: { value: 0 },
        poleAxis: { value: _0x58ea60 },
      },
      vertexShader: _getCommonVertexShader(),
      fragmentShader:
        "\n\n\t\t\tprecision mediump float;\n\t\t\tprecision mediump int;\n\n\t\t\tvarying vec3 vOutputDirection;\n\n\t\t\tuniform sampler2D envMap;\n\t\t\tuniform int samples;\n\t\t\tuniform float weights[ n ];\n\t\t\tuniform bool latitudinal;\n\t\t\tuniform float dTheta;\n\t\t\tuniform float mipInt;\n\t\t\tuniform vec3 poleAxis;\n\n\t\t\t#define ENVMAP_TYPE_CUBE_UV\n\t\t\t#include <cube_uv_reflection_fragment>\n\n\t\t\tvec3 getSample( float theta, vec3 axis ) {\n\n\t\t\t\tfloat cosTheta = cos( theta );\n\t\t\t\t// Rodrigues' axis-angle rotation\n\t\t\t\tvec3 sampleDirection = vOutputDirection * cosTheta\n\t\t\t\t\t+ cross( axis, vOutputDirection ) * sin( theta )\n\t\t\t\t\t+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );\n\n\t\t\t\treturn bilinearCubeUV( envMap, sampleDirection, mipInt );\n\n\t\t\t}\n\n\t\t\tvoid main() {\n\n\t\t\t\tvec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );\n\n\t\t\t\tif ( all( equal( axis, vec3( 0.0 ) ) ) ) {\n\n\t\t\t\t\taxis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );\n\n\t\t\t\t}\n\n\t\t\t\taxis = normalize( axis );\n\n\t\t\t\tgl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );\n\t\t\t\tgl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );\n\n\t\t\t\tfor ( int i = 1; i < n; i++ ) {\n\n\t\t\t\t\tif ( i >= samples ) {\n\n\t\t\t\t\t\tbreak;\n\n\t\t\t\t\t}\n\n\t\t\t\t\tfloat theta = dTheta * float( i );\n\t\t\t\t\tgl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );\n\t\t\t\t\tgl_FragColor.rgb += weights[ i ] * getSample( theta, axis );\n\n\t\t\t\t}\n\n\t\t\t}\n\t\t",
      blending: NoBlending,
      depthTest: false,
      depthWrite: false,
    });
  return _0x5e0e68;
}
function _getEquirectMaterial() {
  return new ShaderMaterial({
    name: 'EquirectangularToCubeUV',
    uniforms: { envMap: { value: null } },
    vertexShader: _getCommonVertexShader(),
    fragmentShader:
      '\n\n\t\t\tprecision mediump float;\n\t\t\tprecision mediump int;\n\n\t\t\tvarying vec3 vOutputDirection;\n\n\t\t\tuniform sampler2D envMap;\n\n\t\t\t#include <common>\n\n\t\t\tvoid main() {\n\n\t\t\t\tvec3 outputDirection = normalize( vOutputDirection );\n\t\t\t\tvec2 uv = equirectUv( outputDirection );\n\n\t\t\t\tgl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );\n\n\t\t\t}\n\t\t',
    blending: NoBlending,
    depthTest: false,
    depthWrite: false,
  });
}
function _getCubemapMaterial() {
  return new ShaderMaterial({
    name: 'CubemapToCubeUV',
    uniforms: { envMap: { value: null }, flipEnvMap: { value: -1 } },
    vertexShader: _getCommonVertexShader(),
    fragmentShader:
      '\n\n\t\t\tprecision mediump float;\n\t\t\tprecision mediump int;\n\n\t\t\tuniform float flipEnvMap;\n\n\t\t\tvarying vec3 vOutputDirection;\n\n\t\t\tuniform samplerCube envMap;\n\n\t\t\tvoid main() {\n\n\t\t\t\tgl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );\n\n\t\t\t}\n\t\t',
    blending: NoBlending,
    depthTest: false,
    depthWrite: false,
  });
}
function _getCommonVertexShader() {
  return '\n\n\t\tprecision mediump float;\n\t\tprecision mediump int;\n\n\t\tattribute float faceIndex;\n\n\t\tvarying vec3 vOutputDirection;\n\n\t\t// RH coordinate system; PMREM face-indexing convention\n\t\tvec3 getDirection( vec2 uv, float face ) {\n\n\t\t\tuv = 2.0 * uv - 1.0;\n\n\t\t\tvec3 direction = vec3( uv, 1.0 );\n\n\t\t\tif ( face == 0.0 ) {\n\n\t\t\t\tdirection = direction.zyx; // ( 1, v, u ) pos x\n\n\t\t\t} else if ( face == 1.0 ) {\n\n\t\t\t\tdirection = direction.xzy;\n\t\t\t\tdirection.xz *= -1.0; // ( -u, 1, -v ) pos y\n\n\t\t\t} else if ( face == 2.0 ) {\n\n\t\t\t\tdirection.x *= -1.0; // ( -u, v, 1 ) pos z\n\n\t\t\t} else if ( face == 3.0 ) {\n\n\t\t\t\tdirection = direction.zyx;\n\t\t\t\tdirection.xz *= -1.0; // ( -1, v, -u ) neg x\n\n\t\t\t} else if ( face == 4.0 ) {\n\n\t\t\t\tdirection = direction.xzy;\n\t\t\t\tdirection.xy *= -1.0; // ( -u, -1, v ) neg y\n\n\t\t\t} else if ( face == 5.0 ) {\n\n\t\t\t\tdirection.z *= -1.0; // ( u, v, -1 ) neg z\n\n\t\t\t}\n\n\t\t\treturn direction;\n\n\t\t}\n\n\t\tvoid main() {\n\n\t\t\tvOutputDirection = getDirection( uv, faceIndex );\n\t\t\tgl_Position = vec4( position, 1.0 );\n\n\t\t}\n\t';
}
function WebGLCubeUVMaps(_0x28131c) {
  let _0x3eeab8 = new WeakMap(),
    _0x2a7258 = null;
  function _0x11cac9(_0x985664) {
    if (_0x985664 && _0x985664.isTexture) {
      const _0x1ac199 = _0x985664.mapping,
        _0x5b1946 =
          _0x1ac199 === EquirectangularReflectionMapping || _0x1ac199 === EquirectangularRefractionMapping,
        _0x378178 = _0x1ac199 === CubeReflectionMapping || _0x1ac199 === CubeRefractionMapping;
      if (_0x5b1946 || _0x378178) {
        let _0x301a3c = _0x3eeab8.get(_0x985664);
        const _0xcddba6 = _0x301a3c !== undefined ? _0x301a3c.texture.pmremVersion : 0;
        if (_0x985664.isRenderTargetTexture && _0x985664.pmremVersion !== _0xcddba6) {
          if (_0x2a7258 === null) _0x2a7258 = new PMREMGenerator(_0x28131c);
          return (
            (_0x301a3c = _0x5b1946
              ? _0x2a7258.fromEquirectangular(_0x985664, _0x301a3c)
              : _0x2a7258.fromCubemap(_0x985664, _0x301a3c)),
            (_0x301a3c.texture.pmremVersion = _0x985664.pmremVersion),
            _0x3eeab8.set(_0x985664, _0x301a3c),
            _0x301a3c.texture
          );
        } else {
          if (_0x301a3c !== undefined) return _0x301a3c.texture;
          else {
            const _0x23aeb0 = _0x985664.image;
            if (
              (_0x5b1946 && _0x23aeb0 && _0x23aeb0.height > 0) ||
              (_0x378178 && _0x23aeb0 && _0x52f49d(_0x23aeb0))
            ) {
              if (_0x2a7258 === null) _0x2a7258 = new PMREMGenerator(_0x28131c);
              return (
                (_0x301a3c = _0x5b1946
                  ? _0x2a7258.fromEquirectangular(_0x985664)
                  : _0x2a7258.fromCubemap(_0x985664)),
                (_0x301a3c.texture.pmremVersion = _0x985664.pmremVersion),
                _0x3eeab8.set(_0x985664, _0x301a3c),
                _0x985664.addEventListener('dispose', _0x1a0e7b),
                _0x301a3c.texture
              );
            } else return null;
          }
        }
      }
    }
    return _0x985664;
  }
  function _0x52f49d(_0x5232a0) {
    let _0x988920 = 0;
    const _0x4d171b = 6;
    for (let _0x22705c = 0; _0x22705c < _0x4d171b; _0x22705c++) {
      if (_0x5232a0[_0x22705c] !== undefined) _0x988920++;
    }
    return _0x988920 === _0x4d171b;
  }
  function _0x1a0e7b(_0x50dc4e) {
    const _0x4af500 = _0x50dc4e.target;
    _0x4af500.removeEventListener('dispose', _0x1a0e7b);
    const _0x241a44 = _0x3eeab8.get(_0x4af500);
    _0x241a44 !== undefined && (_0x3eeab8.delete(_0x4af500), _0x241a44.dispose());
  }
  function _0x2a5cc2() {
    ((_0x3eeab8 = new WeakMap()), _0x2a7258 !== null && (_0x2a7258.dispose(), (_0x2a7258 = null)));
  }
  return { get: _0x11cac9, dispose: _0x2a5cc2 };
}
function WebGLExtensions(_0x15255f) {
  const _0x4d7af6 = {};
  function _0x5317a9(_0x4b5940) {
    if (_0x4d7af6[_0x4b5940] !== undefined) return _0x4d7af6[_0x4b5940];
    let _0x1f0d6c;
    switch (_0x4b5940) {
      case 'WEBGL_depth_texture':
        _0x1f0d6c =
          _0x15255f.getExtension('WEBGL_depth_texture') ||
          _0x15255f.getExtension('MOZ_WEBGL_depth_texture') ||
          _0x15255f.getExtension('WEBKIT_WEBGL_depth_texture');
        break;
      case 'EXT_texture_filter_anisotropic':
        _0x1f0d6c =
          _0x15255f.getExtension('EXT_texture_filter_anisotropic') ||
          _0x15255f.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
          _0x15255f.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
        break;
      case 'WEBGL_compressed_texture_s3tc':
        _0x1f0d6c =
          _0x15255f.getExtension('WEBGL_compressed_texture_s3tc') ||
          _0x15255f.getExtension('MOZ_WEBGL_compressed_texture_s3tc') ||
          _0x15255f.getExtension('WEBKIT_WEBGL_compressed_texture_s3tc');
        break;
      case 'WEBGL_compressed_texture_pvrtc':
        _0x1f0d6c =
          _0x15255f.getExtension('WEBGL_compressed_texture_pvrtc') ||
          _0x15255f.getExtension('WEBKIT_WEBGL_compressed_texture_pvrtc');
        break;
      default:
        _0x1f0d6c = _0x15255f.getExtension(_0x4b5940);
    }
    return ((_0x4d7af6[_0x4b5940] = _0x1f0d6c), _0x1f0d6c);
  }
  return {
    has: function (_0x50def9) {
      return _0x5317a9(_0x50def9) !== null;
    },
    init: function () {
      (_0x5317a9('EXT_color_buffer_float'),
        _0x5317a9('WEBGL_clip_cull_distance'),
        _0x5317a9('OES_texture_float_linear'),
        _0x5317a9('EXT_color_buffer_half_float'),
        _0x5317a9('WEBGL_multisampled_render_to_texture'),
        _0x5317a9('WEBGL_render_shared_exponent'));
    },
    get: function (_0x561e2c) {
      const _0x49ab96 = _0x5317a9(_0x561e2c);
      return (
        _0x49ab96 === null && warnOnce('THREE.WebGLRenderer: ' + _0x561e2c + ' extension not supported.'),
        _0x49ab96
      );
    },
  };
}
function WebGLGeometries(_0x42dd14, _0x3c7486, _0x6d576b, _0x574e83) {
  const _0x124b62 = {},
    _0x20fd77 = new WeakMap();
  function _0x2d2569(_0x5d6951) {
    const _0x395bf5 = _0x5d6951.target;
    _0x395bf5.index !== null && _0x3c7486.remove(_0x395bf5.index);
    for (const _0x292f4f in _0x395bf5.attributes) {
      _0x3c7486.remove(_0x395bf5.attributes[_0x292f4f]);
    }
    (_0x395bf5.removeEventListener('dispose', _0x2d2569), delete _0x124b62[_0x395bf5.id]);
    const _0x96524f = _0x20fd77.get(_0x395bf5);
    (_0x96524f && (_0x3c7486.remove(_0x96524f), _0x20fd77.delete(_0x395bf5)),
      _0x574e83.releaseStatesOfGeometry(_0x395bf5),
      _0x395bf5.isInstancedBufferGeometry === true && delete _0x395bf5._maxInstanceCount,
      _0x6d576b.memory.geometries--);
  }
  function _0x4e3ee9(_0x56c224, _0x276205) {
    if (_0x124b62[_0x276205.id] === true) return _0x276205;
    return (
      _0x276205.addEventListener('dispose', _0x2d2569),
      (_0x124b62[_0x276205.id] = true),
      _0x6d576b.memory.geometries++,
      _0x276205
    );
  }
  function _0x3b9332(_0x52ea22) {
    const _0x4ce654 = _0x52ea22.attributes;
    for (const _0x20d4eb in _0x4ce654) {
      _0x3c7486.update(_0x4ce654[_0x20d4eb], _0x42dd14.ARRAY_BUFFER);
    }
  }
  function _0x48370f(_0x346f39) {
    const _0x32c116 = [],
      _0x3ac424 = _0x346f39.index,
      _0xb9f1c = _0x346f39.attributes.position;
    let _0x3bdf35 = 0;
    if (_0x3ac424 !== null) {
      const _0x534e8c = _0x3ac424.array;
      _0x3bdf35 = _0x3ac424.version;
      for (let _0x447608 = 0, _0x53a5b6 = _0x534e8c.length; _0x447608 < _0x53a5b6; _0x447608 += 3) {
        const _0x2f40ee = _0x534e8c[_0x447608 + 0],
          _0x3141b7 = _0x534e8c[_0x447608 + 1],
          _0xb1342a = _0x534e8c[_0x447608 + 2];
        _0x32c116.push(_0x2f40ee, _0x3141b7, _0x3141b7, _0xb1342a, _0xb1342a, _0x2f40ee);
      }
    } else {
      if (_0xb9f1c !== undefined) {
        const _0x49563e = _0xb9f1c.array;
        _0x3bdf35 = _0xb9f1c.version;
        for (let _0x3596e2 = 0, _0x2490c7 = _0x49563e.length / 3 - 1; _0x3596e2 < _0x2490c7; _0x3596e2 += 3) {
          const _0x132c6f = _0x3596e2 + 0,
            _0x379df9 = _0x3596e2 + 1,
            _0x3296d2 = _0x3596e2 + 2;
          _0x32c116.push(_0x132c6f, _0x379df9, _0x379df9, _0x3296d2, _0x3296d2, _0x132c6f);
        }
      } else return;
    }
    const _0x18f6bd = new (arrayNeedsUint32(_0x32c116) ? Uint32BufferAttribute : Uint16BufferAttribute)(
      _0x32c116,
      1,
    );
    _0x18f6bd.version = _0x3bdf35;
    const _0x3e9dcd = _0x20fd77.get(_0x346f39);
    if (_0x3e9dcd) _0x3c7486.remove(_0x3e9dcd);
    _0x20fd77.set(_0x346f39, _0x18f6bd);
  }
  function _0x42ed4d(_0x5d5ad9) {
    const _0x22ca26 = _0x20fd77.get(_0x5d5ad9);
    if (_0x22ca26) {
      const _0x384d77 = _0x5d5ad9.index;
      _0x384d77 !== null && _0x22ca26.version < _0x384d77.version && _0x48370f(_0x5d5ad9);
    } else _0x48370f(_0x5d5ad9);
    return _0x20fd77.get(_0x5d5ad9);
  }
  return { get: _0x4e3ee9, update: _0x3b9332, getWireframeAttribute: _0x42ed4d };
}
function WebGLIndexedBufferRenderer(_0x175f5c, _0x505721, _0x150142) {
  let _0x54c234;
  function _0x4ba212(_0x37c430) {
    _0x54c234 = _0x37c430;
  }
  let _0x278a8f, _0x2062dc;
  function _0x560709(_0x372531) {
    ((_0x278a8f = _0x372531.type), (_0x2062dc = _0x372531.bytesPerElement));
  }
  function _0x1fffe0(_0x18aad2, _0x588eee) {
    (_0x175f5c.drawElements(_0x54c234, _0x588eee, _0x278a8f, _0x18aad2 * _0x2062dc),
      _0x150142.update(_0x588eee, _0x54c234, 1));
  }
  function _0x583b73(_0x50c1b8, _0x237dc5, _0x5558b4) {
    if (_0x5558b4 === 0) return;
    (_0x175f5c.drawElementsInstanced(_0x54c234, _0x237dc5, _0x278a8f, _0x50c1b8 * _0x2062dc, _0x5558b4),
      _0x150142.update(_0x237dc5, _0x54c234, _0x5558b4));
  }
  function _0x3e8419(_0x2be92d, _0x400a8f, _0x183842) {
    if (_0x183842 === 0) return;
    const _0x69af6c = _0x505721.get('WEBGL_multi_draw');
    _0x69af6c.multiDrawElementsWEBGL(_0x54c234, _0x400a8f, 0, _0x278a8f, _0x2be92d, 0, _0x183842);
    let _0x45d18b = 0;
    for (let _0x2e8d60 = 0; _0x2e8d60 < _0x183842; _0x2e8d60++) {
      _0x45d18b += _0x400a8f[_0x2e8d60];
    }
    _0x150142.update(_0x45d18b, _0x54c234, 1);
  }
  function _0x3536de(_0x5c3387, _0x5bf9b8, _0x33e5a6, _0x54f33) {
    if (_0x33e5a6 === 0) return;
    const _0x2266d3 = _0x505721.get('WEBGL_multi_draw');
    if (_0x2266d3 === null)
      for (let _0x526191 = 0; _0x526191 < _0x5c3387.length; _0x526191++) {
        _0x583b73(_0x5c3387[_0x526191] / _0x2062dc, _0x5bf9b8[_0x526191], _0x54f33[_0x526191]);
      }
    else {
      _0x2266d3.multiDrawElementsInstancedWEBGL(
        _0x54c234,
        _0x5bf9b8,
        0,
        _0x278a8f,
        _0x5c3387,
        0,
        _0x54f33,
        0,
        _0x33e5a6,
      );
      let _0x12dcb2 = 0;
      for (let _0x13791a = 0; _0x13791a < _0x33e5a6; _0x13791a++) {
        _0x12dcb2 += _0x5bf9b8[_0x13791a] * _0x54f33[_0x13791a];
      }
      _0x150142.update(_0x12dcb2, _0x54c234, 1);
    }
  }
  ((this.setMode = _0x4ba212),
    (this.setIndex = _0x560709),
    (this.render = _0x1fffe0),
    (this.renderInstances = _0x583b73),
    (this.renderMultiDraw = _0x3e8419),
    (this.renderMultiDrawInstances = _0x3536de));
}
function WebGLInfo(_0x1aab99) {
  const _0x2011a5 = { geometries: 0, textures: 0 },
    _0x487a72 = { frame: 0, calls: 0, triangles: 0, points: 0, lines: 0 };
  function _0x223312(_0x52e9e9, _0x39a6f6, _0x50dba8) {
    _0x487a72.calls++;
    switch (_0x39a6f6) {
      case _0x1aab99.TRIANGLES:
        _0x487a72.triangles += _0x50dba8 * (_0x52e9e9 / 3);
        break;
      case _0x1aab99.LINES:
        _0x487a72.lines += _0x50dba8 * (_0x52e9e9 / 2);
        break;
      case _0x1aab99.LINE_STRIP:
        _0x487a72.lines += _0x50dba8 * (_0x52e9e9 - 1);
        break;
      case _0x1aab99.LINE_LOOP:
        _0x487a72.lines += _0x50dba8 * _0x52e9e9;
        break;
      case _0x1aab99.POINTS:
        _0x487a72.points += _0x50dba8 * _0x52e9e9;
        break;
      default:
        console.error('THREE.WebGLInfo: Unknown draw mode:', _0x39a6f6);
        break;
    }
  }
  function _0x3ee04b() {
    ((_0x487a72.calls = 0), (_0x487a72.triangles = 0), (_0x487a72.points = 0), (_0x487a72.lines = 0));
  }
  return {
    memory: _0x2011a5,
    render: _0x487a72,
    programs: null,
    autoReset: true,
    reset: _0x3ee04b,
    update: _0x223312,
  };
}
function WebGLMorphtargets(_0x112267, _0x46bece, _0xada5a1) {
  const _0x22c743 = new WeakMap(),
    _0x4914e9 = new Vector4();
  function _0xa46cf6(_0x30f1ea, _0x10f4d6, _0x3d0bbd) {
    const _0x83e5f = _0x30f1ea.morphTargetInfluences,
      _0x49c65f =
        _0x10f4d6.morphAttributes.position ||
        _0x10f4d6.morphAttributes.normal ||
        _0x10f4d6.morphAttributes.color,
      _0x2900fc = _0x49c65f !== undefined ? _0x49c65f.length : 0;
    let _0x34927a = _0x22c743.get(_0x10f4d6);
    if (_0x34927a === undefined || _0x34927a.count !== _0x2900fc) {
      if (_0x34927a !== undefined) _0x34927a.texture.dispose();
      const _0x2c2b08 = _0x10f4d6.morphAttributes.position !== undefined,
        _0x57dae7 = _0x10f4d6.morphAttributes.normal !== undefined,
        _0x3065b3 = _0x10f4d6.morphAttributes.color !== undefined,
        _0x5cf08d = _0x10f4d6.morphAttributes.position || [],
        _0x568a94 = _0x10f4d6.morphAttributes.normal || [],
        _0x18128c = _0x10f4d6.morphAttributes.color || [];
      let _0x16e646 = 0;
      if (_0x2c2b08 === true) _0x16e646 = 1;
      if (_0x57dae7 === true) _0x16e646 = 2;
      if (_0x3065b3 === true) _0x16e646 = 3;
      let _0x402044 = _0x10f4d6.attributes.position.count * _0x16e646,
        _0x59e39b = 1;
      _0x402044 > _0x46bece.maxTextureSize &&
        ((_0x59e39b = Math.ceil(_0x402044 / _0x46bece.maxTextureSize)),
        (_0x402044 = _0x46bece.maxTextureSize));
      const _0x46a444 = new Float32Array(_0x402044 * _0x59e39b * 4 * _0x2900fc),
        _0x1a3fac = new DataArrayTexture(_0x46a444, _0x402044, _0x59e39b, _0x2900fc);
      ((_0x1a3fac.type = FloatType), (_0x1a3fac.needsUpdate = true));
      const _0x37ff01 = _0x16e646 * 4;
      for (let _0x252674 = 0; _0x252674 < _0x2900fc; _0x252674++) {
        const _0x27180c = _0x5cf08d[_0x252674],
          _0x6408f5 = _0x568a94[_0x252674],
          _0x10fe4c = _0x18128c[_0x252674],
          _0x9f1459 = _0x402044 * _0x59e39b * 4 * _0x252674;
        for (let _0x1b8046 = 0; _0x1b8046 < _0x27180c.count; _0x1b8046++) {
          const _0xeb4561 = _0x1b8046 * _0x37ff01;
          (_0x2c2b08 === true &&
            (_0x4914e9.fromBufferAttribute(_0x27180c, _0x1b8046),
            (_0x46a444[_0x9f1459 + _0xeb4561 + 0] = _0x4914e9.x),
            (_0x46a444[_0x9f1459 + _0xeb4561 + 1] = _0x4914e9.y),
            (_0x46a444[_0x9f1459 + _0xeb4561 + 2] = _0x4914e9.z),
            (_0x46a444[_0x9f1459 + _0xeb4561 + 3] = 0)),
            _0x57dae7 === true &&
              (_0x4914e9.fromBufferAttribute(_0x6408f5, _0x1b8046),
              (_0x46a444[_0x9f1459 + _0xeb4561 + 4] = _0x4914e9.x),
              (_0x46a444[_0x9f1459 + _0xeb4561 + 5] = _0x4914e9.y),
              (_0x46a444[_0x9f1459 + _0xeb4561 + 6] = _0x4914e9.z),
              (_0x46a444[_0x9f1459 + _0xeb4561 + 7] = 0)),
            _0x3065b3 === true &&
              (_0x4914e9.fromBufferAttribute(_0x10fe4c, _0x1b8046),
              (_0x46a444[_0x9f1459 + _0xeb4561 + 8] = _0x4914e9.x),
              (_0x46a444[_0x9f1459 + _0xeb4561 + 9] = _0x4914e9.y),
              (_0x46a444[_0x9f1459 + _0xeb4561 + 10] = _0x4914e9.z),
              (_0x46a444[_0x9f1459 + _0xeb4561 + 11] = _0x10fe4c.itemSize === 4 ? _0x4914e9.w : 1)));
        }
      }
      ((_0x34927a = { count: _0x2900fc, texture: _0x1a3fac, size: new Vector2(_0x402044, _0x59e39b) }),
        _0x22c743.set(_0x10f4d6, _0x34927a));
      function _0x5242e6() {
        (_0x1a3fac.dispose(),
          _0x22c743.delete(_0x10f4d6),
          _0x10f4d6.removeEventListener('dispose', _0x5242e6));
      }
      _0x10f4d6.addEventListener('dispose', _0x5242e6);
    }
    if (_0x30f1ea.isInstancedMesh === true && _0x30f1ea.morphTexture !== null)
      _0x3d0bbd.getUniforms().setValue(_0x112267, 'morphTexture', _0x30f1ea.morphTexture, _0xada5a1);
    else {
      let _0x59acbc = 0;
      for (let _0x5378b1 = 0; _0x5378b1 < _0x83e5f.length; _0x5378b1++) {
        _0x59acbc += _0x83e5f[_0x5378b1];
      }
      const _0x4477c7 = _0x10f4d6.morphTargetsRelative ? 1 : 1 - _0x59acbc;
      (_0x3d0bbd.getUniforms().setValue(_0x112267, 'morphTargetBaseInfluence', _0x4477c7),
        _0x3d0bbd.getUniforms().setValue(_0x112267, 'morphTargetInfluences', _0x83e5f));
    }
    (_0x3d0bbd.getUniforms().setValue(_0x112267, 'morphTargetsTexture', _0x34927a.texture, _0xada5a1),
      _0x3d0bbd.getUniforms().setValue(_0x112267, 'morphTargetsTextureSize', _0x34927a.size));
  }
  return { update: _0xa46cf6 };
}
function WebGLObjects(_0x2a4570, _0x362a65, _0x1b00b5, _0xc965c6) {
  let _0x5d0177 = new WeakMap();
  function _0x20f29b(_0x5bf3db) {
    const _0x374e45 = _0xc965c6.render.frame,
      _0x39b068 = _0x5bf3db.geometry,
      _0x3b0e7b = _0x362a65.get(_0x5bf3db, _0x39b068);
    _0x5d0177.get(_0x3b0e7b) !== _0x374e45 &&
      (_0x362a65.update(_0x3b0e7b), _0x5d0177.set(_0x3b0e7b, _0x374e45));
    _0x5bf3db.isInstancedMesh &&
      (_0x5bf3db.hasEventListener('dispose', _0x1d3ba0) === false &&
        _0x5bf3db.addEventListener('dispose', _0x1d3ba0),
      _0x5d0177.get(_0x5bf3db) !== _0x374e45 &&
        (_0x1b00b5.update(_0x5bf3db.instanceMatrix, _0x2a4570.ARRAY_BUFFER),
        _0x5bf3db.instanceColor !== null && _0x1b00b5.update(_0x5bf3db.instanceColor, _0x2a4570.ARRAY_BUFFER),
        _0x5d0177.set(_0x5bf3db, _0x374e45)));
    if (_0x5bf3db.isSkinnedMesh) {
      const _0x52a724 = _0x5bf3db.skeleton;
      _0x5d0177.get(_0x52a724) !== _0x374e45 && (_0x52a724.update(), _0x5d0177.set(_0x52a724, _0x374e45));
    }
    return _0x3b0e7b;
  }
  function _0xf170d3() {
    _0x5d0177 = new WeakMap();
  }
  function _0x1d3ba0(_0x2986b0) {
    const _0x1b07e3 = _0x2986b0.target;
    (_0x1b07e3.removeEventListener('dispose', _0x1d3ba0), _0x1b00b5.remove(_0x1b07e3.instanceMatrix));
    if (_0x1b07e3.instanceColor !== null) _0x1b00b5.remove(_0x1b07e3.instanceColor);
  }
  return { update: _0x20f29b, dispose: _0xf170d3 };
}
const emptyTexture = new Texture(),
  emptyShadowTexture = new DepthTexture(1, 1),
  emptyArrayTexture = new DataArrayTexture(),
  empty3dTexture = new Data3DTexture(),
  emptyCubeTexture = new CubeTexture(),
  arrayCacheF32 = [],
  arrayCacheI32 = [],
  mat4array = new Float32Array(16),
  mat3array = new Float32Array(9),
  mat2array = new Float32Array(4);
function flatten(_0x1b619f, _0xdd091b, _0x567e82) {
  const _0xc4b47f = _0x1b619f[0];
  if (_0xc4b47f <= 0 || _0xc4b47f > 0) return _0x1b619f;
  const _0x47aea4 = _0xdd091b * _0x567e82;
  let _0x52be85 = arrayCacheF32[_0x47aea4];
  _0x52be85 === undefined &&
    ((_0x52be85 = new Float32Array(_0x47aea4)), (arrayCacheF32[_0x47aea4] = _0x52be85));
  if (_0xdd091b !== 0) {
    _0xc4b47f.toArray(_0x52be85, 0);
    for (let _0x3f2c71 = 1, _0x473490 = 0; _0x3f2c71 !== _0xdd091b; ++_0x3f2c71) {
      ((_0x473490 += _0x567e82), _0x1b619f[_0x3f2c71].toArray(_0x52be85, _0x473490));
    }
  }
  return _0x52be85;
}
function arraysEqual(_0x2eb78d, _0x3cbb67) {
  if (_0x2eb78d.length !== _0x3cbb67.length) return false;
  for (let _0x4b1288 = 0, _0xd3dad5 = _0x2eb78d.length; _0x4b1288 < _0xd3dad5; _0x4b1288++) {
    if (_0x2eb78d[_0x4b1288] !== _0x3cbb67[_0x4b1288]) return false;
  }
  return true;
}
function copyArray(_0x50c421, _0x25895a) {
  for (let _0x2a4b66 = 0, _0x11e4b5 = _0x25895a.length; _0x2a4b66 < _0x11e4b5; _0x2a4b66++) {
    _0x50c421[_0x2a4b66] = _0x25895a[_0x2a4b66];
  }
}
function allocTexUnits(_0x3139bb, _0x13bd40) {
  let _0x1fe753 = arrayCacheI32[_0x13bd40];
  _0x1fe753 === undefined &&
    ((_0x1fe753 = new Int32Array(_0x13bd40)), (arrayCacheI32[_0x13bd40] = _0x1fe753));
  for (let _0x3edc06 = 0; _0x3edc06 !== _0x13bd40; ++_0x3edc06) {
    _0x1fe753[_0x3edc06] = _0x3139bb.allocateTextureUnit();
  }
  return _0x1fe753;
}
function setValueV1f(_0x16ee0e, _0x143828) {
  const _0x1b3615 = this.cache;
  if (_0x1b3615[0] === _0x143828) return;
  (_0x16ee0e.uniform1f(this.addr, _0x143828), (_0x1b3615[0] = _0x143828));
}
function setValueV2f(_0x52fb0c, _0x576d65) {
  const _0x35fe39 = this.cache;
  if (_0x576d65.x !== undefined)
    (_0x35fe39[0] !== _0x576d65.x || _0x35fe39[1] !== _0x576d65.y) &&
      (_0x52fb0c.uniform2f(this.addr, _0x576d65.x, _0x576d65.y),
      (_0x35fe39[0] = _0x576d65.x),
      (_0x35fe39[1] = _0x576d65.y));
  else {
    if (arraysEqual(_0x35fe39, _0x576d65)) return;
    (_0x52fb0c.uniform2fv(this.addr, _0x576d65), copyArray(_0x35fe39, _0x576d65));
  }
}
function setValueV3f(_0x304818, _0x307800) {
  const _0x46f6f6 = this.cache;
  if (_0x307800.x !== undefined)
    (_0x46f6f6[0] !== _0x307800.x || _0x46f6f6[1] !== _0x307800.y || _0x46f6f6[2] !== _0x307800.z) &&
      (_0x304818.uniform3f(this.addr, _0x307800.x, _0x307800.y, _0x307800.z),
      (_0x46f6f6[0] = _0x307800.x),
      (_0x46f6f6[1] = _0x307800.y),
      (_0x46f6f6[2] = _0x307800.z));
  else {
    if (_0x307800.r !== undefined)
      (_0x46f6f6[0] !== _0x307800.r || _0x46f6f6[1] !== _0x307800.g || _0x46f6f6[2] !== _0x307800.b) &&
        (_0x304818.uniform3f(this.addr, _0x307800.r, _0x307800.g, _0x307800.b),
        (_0x46f6f6[0] = _0x307800.r),
        (_0x46f6f6[1] = _0x307800.g),
        (_0x46f6f6[2] = _0x307800.b));
    else {
      if (arraysEqual(_0x46f6f6, _0x307800)) return;
      (_0x304818.uniform3fv(this.addr, _0x307800), copyArray(_0x46f6f6, _0x307800));
    }
  }
}
function setValueV4f(_0x180938, _0x548090) {
  const _0x439961 = this.cache;
  if (_0x548090.x !== undefined)
    (_0x439961[0] !== _0x548090.x ||
      _0x439961[1] !== _0x548090.y ||
      _0x439961[2] !== _0x548090.z ||
      _0x439961[3] !== _0x548090.w) &&
      (_0x180938.uniform4f(this.addr, _0x548090.x, _0x548090.y, _0x548090.z, _0x548090.w),
      (_0x439961[0] = _0x548090.x),
      (_0x439961[1] = _0x548090.y),
      (_0x439961[2] = _0x548090.z),
      (_0x439961[3] = _0x548090.w));
  else {
    if (arraysEqual(_0x439961, _0x548090)) return;
    (_0x180938.uniform4fv(this.addr, _0x548090), copyArray(_0x439961, _0x548090));
  }
}
function setValueM2(_0x38d453, _0x5e831f) {
  const _0x32222a = this.cache,
    _0x4626f5 = _0x5e831f.elements;
  if (_0x4626f5 === undefined) {
    if (arraysEqual(_0x32222a, _0x5e831f)) return;
    (_0x38d453.uniformMatrix2fv(this.addr, false, _0x5e831f), copyArray(_0x32222a, _0x5e831f));
  } else {
    if (arraysEqual(_0x32222a, _0x4626f5)) return;
    (mat2array.set(_0x4626f5),
      _0x38d453.uniformMatrix2fv(this.addr, false, mat2array),
      copyArray(_0x32222a, _0x4626f5));
  }
}
function setValueM3(_0x270fb6, _0x570451) {
  const _0x177757 = this.cache,
    _0x2bb9b2 = _0x570451.elements;
  if (_0x2bb9b2 === undefined) {
    if (arraysEqual(_0x177757, _0x570451)) return;
    (_0x270fb6.uniformMatrix3fv(this.addr, false, _0x570451), copyArray(_0x177757, _0x570451));
  } else {
    if (arraysEqual(_0x177757, _0x2bb9b2)) return;
    (mat3array.set(_0x2bb9b2),
      _0x270fb6.uniformMatrix3fv(this.addr, false, mat3array),
      copyArray(_0x177757, _0x2bb9b2));
  }
}
function setValueM4(_0x470c97, _0x3826c6) {
  const _0x11f6f1 = this.cache,
    _0x346935 = _0x3826c6.elements;
  if (_0x346935 === undefined) {
    if (arraysEqual(_0x11f6f1, _0x3826c6)) return;
    (_0x470c97.uniformMatrix4fv(this.addr, false, _0x3826c6), copyArray(_0x11f6f1, _0x3826c6));
  } else {
    if (arraysEqual(_0x11f6f1, _0x346935)) return;
    (mat4array.set(_0x346935),
      _0x470c97.uniformMatrix4fv(this.addr, false, mat4array),
      copyArray(_0x11f6f1, _0x346935));
  }
}
function setValueV1i(_0x4e5436, _0x4daa35) {
  const _0x103f0f = this.cache;
  if (_0x103f0f[0] === _0x4daa35) return;
  (_0x4e5436.uniform1i(this.addr, _0x4daa35), (_0x103f0f[0] = _0x4daa35));
}
function setValueV2i(_0x5caef4, _0x5bee2a) {
  const _0x3270da = this.cache;
  if (_0x5bee2a.x !== undefined)
    (_0x3270da[0] !== _0x5bee2a.x || _0x3270da[1] !== _0x5bee2a.y) &&
      (_0x5caef4.uniform2i(this.addr, _0x5bee2a.x, _0x5bee2a.y),
      (_0x3270da[0] = _0x5bee2a.x),
      (_0x3270da[1] = _0x5bee2a.y));
  else {
    if (arraysEqual(_0x3270da, _0x5bee2a)) return;
    (_0x5caef4.uniform2iv(this.addr, _0x5bee2a), copyArray(_0x3270da, _0x5bee2a));
  }
}
function setValueV3i(_0x21d1c4, _0x4a2fd7) {
  const _0x110922 = this.cache;
  if (_0x4a2fd7.x !== undefined)
    (_0x110922[0] !== _0x4a2fd7.x || _0x110922[1] !== _0x4a2fd7.y || _0x110922[2] !== _0x4a2fd7.z) &&
      (_0x21d1c4.uniform3i(this.addr, _0x4a2fd7.x, _0x4a2fd7.y, _0x4a2fd7.z),
      (_0x110922[0] = _0x4a2fd7.x),
      (_0x110922[1] = _0x4a2fd7.y),
      (_0x110922[2] = _0x4a2fd7.z));
  else {
    if (arraysEqual(_0x110922, _0x4a2fd7)) return;
    (_0x21d1c4.uniform3iv(this.addr, _0x4a2fd7), copyArray(_0x110922, _0x4a2fd7));
  }
}
function setValueV4i(_0x4ff9a7, _0x3c4098) {
  const _0xd3d81a = this.cache;
  if (_0x3c4098.x !== undefined)
    (_0xd3d81a[0] !== _0x3c4098.x ||
      _0xd3d81a[1] !== _0x3c4098.y ||
      _0xd3d81a[2] !== _0x3c4098.z ||
      _0xd3d81a[3] !== _0x3c4098.w) &&
      (_0x4ff9a7.uniform4i(this.addr, _0x3c4098.x, _0x3c4098.y, _0x3c4098.z, _0x3c4098.w),
      (_0xd3d81a[0] = _0x3c4098.x),
      (_0xd3d81a[1] = _0x3c4098.y),
      (_0xd3d81a[2] = _0x3c4098.z),
      (_0xd3d81a[3] = _0x3c4098.w));
  else {
    if (arraysEqual(_0xd3d81a, _0x3c4098)) return;
    (_0x4ff9a7.uniform4iv(this.addr, _0x3c4098), copyArray(_0xd3d81a, _0x3c4098));
  }
}
function setValueV1ui(_0x10a3fa, _0x5d2f89) {
  const _0x18ade1 = this.cache;
  if (_0x18ade1[0] === _0x5d2f89) return;
  (_0x10a3fa.uniform1ui(this.addr, _0x5d2f89), (_0x18ade1[0] = _0x5d2f89));
}
function setValueV2ui(_0x1a20ee, _0x5332f3) {
  const _0x16a2dd = this.cache;
  if (_0x5332f3.x !== undefined)
    (_0x16a2dd[0] !== _0x5332f3.x || _0x16a2dd[1] !== _0x5332f3.y) &&
      (_0x1a20ee.uniform2ui(this.addr, _0x5332f3.x, _0x5332f3.y),
      (_0x16a2dd[0] = _0x5332f3.x),
      (_0x16a2dd[1] = _0x5332f3.y));
  else {
    if (arraysEqual(_0x16a2dd, _0x5332f3)) return;
    (_0x1a20ee.uniform2uiv(this.addr, _0x5332f3), copyArray(_0x16a2dd, _0x5332f3));
  }
}
function setValueV3ui(_0x44f257, _0x420e99) {
  const _0x138a5b = this.cache;
  if (_0x420e99.x !== undefined)
    (_0x138a5b[0] !== _0x420e99.x || _0x138a5b[1] !== _0x420e99.y || _0x138a5b[2] !== _0x420e99.z) &&
      (_0x44f257.uniform3ui(this.addr, _0x420e99.x, _0x420e99.y, _0x420e99.z),
      (_0x138a5b[0] = _0x420e99.x),
      (_0x138a5b[1] = _0x420e99.y),
      (_0x138a5b[2] = _0x420e99.z));
  else {
    if (arraysEqual(_0x138a5b, _0x420e99)) return;
    (_0x44f257.uniform3uiv(this.addr, _0x420e99), copyArray(_0x138a5b, _0x420e99));
  }
}
function setValueV4ui(_0x69a647, _0x27950f) {
  const _0x4c1eaf = this.cache;
  if (_0x27950f.x !== undefined)
    (_0x4c1eaf[0] !== _0x27950f.x ||
      _0x4c1eaf[1] !== _0x27950f.y ||
      _0x4c1eaf[2] !== _0x27950f.z ||
      _0x4c1eaf[3] !== _0x27950f.w) &&
      (_0x69a647.uniform4ui(this.addr, _0x27950f.x, _0x27950f.y, _0x27950f.z, _0x27950f.w),
      (_0x4c1eaf[0] = _0x27950f.x),
      (_0x4c1eaf[1] = _0x27950f.y),
      (_0x4c1eaf[2] = _0x27950f.z),
      (_0x4c1eaf[3] = _0x27950f.w));
  else {
    if (arraysEqual(_0x4c1eaf, _0x27950f)) return;
    (_0x69a647.uniform4uiv(this.addr, _0x27950f), copyArray(_0x4c1eaf, _0x27950f));
  }
}
function setValueT1(_0x230cf4, _0x1b62fc, _0xae90b2) {
  const _0xb4b7af = this.cache,
    _0x11b9e8 = _0xae90b2.allocateTextureUnit();
  _0xb4b7af[0] !== _0x11b9e8 && (_0x230cf4.uniform1i(this.addr, _0x11b9e8), (_0xb4b7af[0] = _0x11b9e8));
  let _0x4bbbfb;
  (this.type === _0x230cf4.SAMPLER_2D_SHADOW
    ? ((emptyShadowTexture.compareFunction = LessEqualCompare), (_0x4bbbfb = emptyShadowTexture))
    : (_0x4bbbfb = emptyTexture),
    _0xae90b2.setTexture2D(_0x1b62fc || _0x4bbbfb, _0x11b9e8));
}
function setValueT3D1(_0x536d77, _0x48cfa6, _0x38e4e2) {
  const _0x550307 = this.cache,
    _0x440387 = _0x38e4e2.allocateTextureUnit();
  (_0x550307[0] !== _0x440387 && (_0x536d77.uniform1i(this.addr, _0x440387), (_0x550307[0] = _0x440387)),
    _0x38e4e2.setTexture3D(_0x48cfa6 || empty3dTexture, _0x440387));
}
function setValueT6(_0x598aa5, _0x225b93, _0x481436) {
  const _0x52d1a9 = this.cache,
    _0x411b6d = _0x481436.allocateTextureUnit();
  (_0x52d1a9[0] !== _0x411b6d && (_0x598aa5.uniform1i(this.addr, _0x411b6d), (_0x52d1a9[0] = _0x411b6d)),
    _0x481436.setTextureCube(_0x225b93 || emptyCubeTexture, _0x411b6d));
}
function setValueT2DArray1(_0x56b202, _0x141efb, _0x78f836) {
  const _0x4afb73 = this.cache,
    _0x2a7f84 = _0x78f836.allocateTextureUnit();
  (_0x4afb73[0] !== _0x2a7f84 && (_0x56b202.uniform1i(this.addr, _0x2a7f84), (_0x4afb73[0] = _0x2a7f84)),
    _0x78f836.setTexture2DArray(_0x141efb || emptyArrayTexture, _0x2a7f84));
}
function getSingularSetter(_0x389fc7) {
  switch (_0x389fc7) {
    case 0x1406:
      return setValueV1f;
    case 0x8b50:
      return setValueV2f;
    case 0x8b51:
      return setValueV3f;
    case 0x8b52:
      return setValueV4f;
    case 0x8b5a:
      return setValueM2;
    case 0x8b5b:
      return setValueM3;
    case 0x8b5c:
      return setValueM4;
    case 0x1404:
    case 0x8b56:
      return setValueV1i;
    case 0x8b53:
    case 0x8b57:
      return setValueV2i;
    case 0x8b54:
    case 0x8b58:
      return setValueV3i;
    case 0x8b55:
    case 0x8b59:
      return setValueV4i;
    case 0x1405:
      return setValueV1ui;
    case 0x8dc6:
      return setValueV2ui;
    case 0x8dc7:
      return setValueV3ui;
    case 0x8dc8:
      return setValueV4ui;
    case 0x8b5e:
    case 0x8d66:
    case 0x8dca:
    case 0x8dd2:
    case 0x8b62:
      return setValueT1;
    case 0x8b5f:
    case 0x8dcb:
    case 0x8dd3:
      return setValueT3D1;
    case 0x8b60:
    case 0x8dcc:
    case 0x8dd4:
    case 0x8dc5:
      return setValueT6;
    case 0x8dc1:
    case 0x8dcf:
    case 0x8dd7:
    case 0x8dc4:
      return setValueT2DArray1;
  }
}
function setValueV1fArray(_0x10ac4f, _0x49c2f9) {
  _0x10ac4f.uniform1fv(this.addr, _0x49c2f9);
}
function setValueV2fArray(_0x15cbb0, _0x20e573) {
  const _0x1d5940 = flatten(_0x20e573, this.size, 2);
  _0x15cbb0.uniform2fv(this.addr, _0x1d5940);
}
function setValueV3fArray(_0x313cde, _0x372972) {
  const _0x10a60d = flatten(_0x372972, this.size, 3);
  _0x313cde.uniform3fv(this.addr, _0x10a60d);
}
function setValueV4fArray(_0x2389e4, _0x3a199a) {
  const _0x2dcf44 = flatten(_0x3a199a, this.size, 4);
  _0x2389e4.uniform4fv(this.addr, _0x2dcf44);
}
function setValueM2Array(_0x4c5ff2, _0xd6fe56) {
  const _0x580d7b = flatten(_0xd6fe56, this.size, 4);
  _0x4c5ff2.uniformMatrix2fv(this.addr, false, _0x580d7b);
}
function setValueM3Array(_0x3e23bb, _0x5234c5) {
  const _0x55dc0f = flatten(_0x5234c5, this.size, 9);
  _0x3e23bb.uniformMatrix3fv(this.addr, false, _0x55dc0f);
}
function setValueM4Array(_0x45349c, _0x1cfa50) {
  const _0x233386 = flatten(_0x1cfa50, this.size, 16);
  _0x45349c.uniformMatrix4fv(this.addr, false, _0x233386);
}
function setValueV1iArray(_0x12251f, _0x1f61cc) {
  _0x12251f.uniform1iv(this.addr, _0x1f61cc);
}
function setValueV2iArray(_0x2c952c, _0x1dbf53) {
  _0x2c952c.uniform2iv(this.addr, _0x1dbf53);
}
function setValueV3iArray(_0x258a18, _0x27c80a) {
  _0x258a18.uniform3iv(this.addr, _0x27c80a);
}
function setValueV4iArray(_0x1de707, _0x4be5a8) {
  _0x1de707.uniform4iv(this.addr, _0x4be5a8);
}
function setValueV1uiArray(_0x2e6d54, _0x46ae4e) {
  _0x2e6d54.uniform1uiv(this.addr, _0x46ae4e);
}
function setValueV2uiArray(_0x6e304b, _0x4c5915) {
  _0x6e304b.uniform2uiv(this.addr, _0x4c5915);
}
function setValueV3uiArray(_0x365baa, _0x4f6362) {
  _0x365baa.uniform3uiv(this.addr, _0x4f6362);
}
function setValueV4uiArray(_0x3a088a, _0x49bc74) {
  _0x3a088a.uniform4uiv(this.addr, _0x49bc74);
}
function setValueT1Array(_0x1cfee0, _0x2f1b38, _0x25b52c) {
  const _0x1e2b84 = this.cache,
    _0x5b2b6d = _0x2f1b38.length,
    _0x3414ba = allocTexUnits(_0x25b52c, _0x5b2b6d);
  !arraysEqual(_0x1e2b84, _0x3414ba) &&
    (_0x1cfee0.uniform1iv(this.addr, _0x3414ba), copyArray(_0x1e2b84, _0x3414ba));
  for (let _0x4ec21a = 0; _0x4ec21a !== _0x5b2b6d; ++_0x4ec21a) {
    _0x25b52c.setTexture2D(_0x2f1b38[_0x4ec21a] || emptyTexture, _0x3414ba[_0x4ec21a]);
  }
}
function setValueT3DArray(_0xb20620, _0x3d0ba5, _0xb67af9) {
  const _0x2b0fdc = this.cache,
    _0x557228 = _0x3d0ba5.length,
    _0x2b3b0d = allocTexUnits(_0xb67af9, _0x557228);
  !arraysEqual(_0x2b0fdc, _0x2b3b0d) &&
    (_0xb20620.uniform1iv(this.addr, _0x2b3b0d), copyArray(_0x2b0fdc, _0x2b3b0d));
  for (let _0x573ef5 = 0; _0x573ef5 !== _0x557228; ++_0x573ef5) {
    _0xb67af9.setTexture3D(_0x3d0ba5[_0x573ef5] || empty3dTexture, _0x2b3b0d[_0x573ef5]);
  }
}
function setValueT6Array(_0x2cd254, _0x486a72, _0x36da70) {
  const _0x4dfaf4 = this.cache,
    _0x247d27 = _0x486a72.length,
    _0x42988b = allocTexUnits(_0x36da70, _0x247d27);
  !arraysEqual(_0x4dfaf4, _0x42988b) &&
    (_0x2cd254.uniform1iv(this.addr, _0x42988b), copyArray(_0x4dfaf4, _0x42988b));
  for (let _0x495456 = 0; _0x495456 !== _0x247d27; ++_0x495456) {
    _0x36da70.setTextureCube(_0x486a72[_0x495456] || emptyCubeTexture, _0x42988b[_0x495456]);
  }
}
function setValueT2DArrayArray(_0x55a9ae, _0x4972c0, _0x320008) {
  const _0x3a7ab5 = this.cache,
    _0x477be1 = _0x4972c0.length,
    _0x3de6a1 = allocTexUnits(_0x320008, _0x477be1);
  !arraysEqual(_0x3a7ab5, _0x3de6a1) &&
    (_0x55a9ae.uniform1iv(this.addr, _0x3de6a1), copyArray(_0x3a7ab5, _0x3de6a1));
  for (let _0x3cedae = 0; _0x3cedae !== _0x477be1; ++_0x3cedae) {
    _0x320008.setTexture2DArray(_0x4972c0[_0x3cedae] || emptyArrayTexture, _0x3de6a1[_0x3cedae]);
  }
}
function getPureArraySetter(_0x393953) {
  switch (_0x393953) {
    case 0x1406:
      return setValueV1fArray;
    case 0x8b50:
      return setValueV2fArray;
    case 0x8b51:
      return setValueV3fArray;
    case 0x8b52:
      return setValueV4fArray;
    case 0x8b5a:
      return setValueM2Array;
    case 0x8b5b:
      return setValueM3Array;
    case 0x8b5c:
      return setValueM4Array;
    case 0x1404:
    case 0x8b56:
      return setValueV1iArray;
    case 0x8b53:
    case 0x8b57:
      return setValueV2iArray;
    case 0x8b54:
    case 0x8b58:
      return setValueV3iArray;
    case 0x8b55:
    case 0x8b59:
      return setValueV4iArray;
    case 0x1405:
      return setValueV1uiArray;
    case 0x8dc6:
      return setValueV2uiArray;
    case 0x8dc7:
      return setValueV3uiArray;
    case 0x8dc8:
      return setValueV4uiArray;
    case 0x8b5e:
    case 0x8d66:
    case 0x8dca:
    case 0x8dd2:
    case 0x8b62:
      return setValueT1Array;
    case 0x8b5f:
    case 0x8dcb:
    case 0x8dd3:
      return setValueT3DArray;
    case 0x8b60:
    case 0x8dcc:
    case 0x8dd4:
    case 0x8dc5:
      return setValueT6Array;
    case 0x8dc1:
    case 0x8dcf:
    case 0x8dd7:
    case 0x8dc4:
      return setValueT2DArrayArray;
  }
}
class SingleUniform {
  constructor(_0x384a33, _0x19557a, _0x8e7261) {
    ((this.id = _0x384a33),
      (this.addr = _0x8e7261),
      (this.cache = []),
      (this.type = _0x19557a.type),
      (this.setValue = getSingularSetter(_0x19557a.type)));
  }
}
class PureArrayUniform {
  constructor(_0xb81ed3, _0x439654, _0x4e1635) {
    ((this.id = _0xb81ed3),
      (this.addr = _0x4e1635),
      (this.cache = []),
      (this.type = _0x439654.type),
      (this.size = _0x439654.size),
      (this.setValue = getPureArraySetter(_0x439654.type)));
  }
}
class StructuredUniform {
  constructor(_0x42ad57) {
    ((this.id = _0x42ad57), (this.seq = []), (this.map = {}));
  }
  ['setValue'](_0x283e9f, _0x4e22fe, _0x1505d2) {
    const _0xd1e596 = this.seq;
    for (let _0x2aa695 = 0, _0x9c7c83 = _0xd1e596.length; _0x2aa695 !== _0x9c7c83; ++_0x2aa695) {
      const _0x50444f = _0xd1e596[_0x2aa695];
      _0x50444f.setValue(_0x283e9f, _0x4e22fe[_0x50444f.id], _0x1505d2);
    }
  }
}
const RePathPart = /(\w+)(\])?(\[|\.)?/g;
function addUniform(_0x96820c, _0x3c6574) {
  (_0x96820c.seq.push(_0x3c6574), (_0x96820c.map[_0x3c6574.id] = _0x3c6574));
}
function parseUniform(_0x135ebd, _0x19e46f, _0x26dc6b) {
  const _0x258696 = _0x135ebd.name,
    _0x134836 = _0x258696.length;
  RePathPart.lastIndex = 0;
  while (true) {
    const _0x5d5d11 = RePathPart.exec(_0x258696),
      _0x33b678 = RePathPart.lastIndex;
    let _0x2c3666 = _0x5d5d11[1];
    const _0x178299 = _0x5d5d11[2] === ']',
      _0x5258e1 = _0x5d5d11[3];
    if (_0x178299) _0x2c3666 = _0x2c3666 | 0;
    if (_0x5258e1 === undefined || (_0x5258e1 === '[' && _0x33b678 + 2 === _0x134836)) {
      addUniform(
        _0x26dc6b,
        _0x5258e1 === undefined
          ? new SingleUniform(_0x2c3666, _0x135ebd, _0x19e46f)
          : new PureArrayUniform(_0x2c3666, _0x135ebd, _0x19e46f),
      );
      break;
    } else {
      const _0x1f977e = _0x26dc6b.map;
      let _0x36eca3 = _0x1f977e[_0x2c3666];
      (_0x36eca3 === undefined &&
        ((_0x36eca3 = new StructuredUniform(_0x2c3666)), addUniform(_0x26dc6b, _0x36eca3)),
        (_0x26dc6b = _0x36eca3));
    }
  }
}
class WebGLUniforms {
  constructor(_0x337efc, _0x5663f9) {
    ((this.seq = []), (this.map = {}));
    const _0x4a5fc6 = _0x337efc.getProgramParameter(_0x5663f9, _0x337efc.ACTIVE_UNIFORMS);
    for (let _0x4b882b = 0; _0x4b882b < _0x4a5fc6; ++_0x4b882b) {
      const _0x5423bd = _0x337efc.getActiveUniform(_0x5663f9, _0x4b882b),
        _0x1ae776 = _0x337efc.getUniformLocation(_0x5663f9, _0x5423bd.name);
      parseUniform(_0x5423bd, _0x1ae776, this);
    }
  }
  ['setValue'](_0x115a23, _0x5a5b8a, _0x39e7bd, _0x4a3f19) {
    const _0x16b6ec = this.map[_0x5a5b8a];
    if (_0x16b6ec !== undefined) _0x16b6ec.setValue(_0x115a23, _0x39e7bd, _0x4a3f19);
  }
  ['setOptional'](_0x159bf0, _0x56cbfd, _0x20e4c7) {
    const _0x1c6ca4 = _0x56cbfd[_0x20e4c7];
    if (_0x1c6ca4 !== undefined) this.setValue(_0x159bf0, _0x20e4c7, _0x1c6ca4);
  }
  static ['upload'](_0x4b88b1, _0x35d1b9, _0x5af0bc, _0x412321) {
    for (let _0x152cd6 = 0, _0x57a537 = _0x35d1b9.length; _0x152cd6 !== _0x57a537; ++_0x152cd6) {
      const _0x17cc96 = _0x35d1b9[_0x152cd6],
        _0x599fc8 = _0x5af0bc[_0x17cc96.id];
      _0x599fc8.needsUpdate !== false && _0x17cc96.setValue(_0x4b88b1, _0x599fc8.value, _0x412321);
    }
  }
  static ['seqWithValue'](_0x51589a, _0x6ea324) {
    const _0x56abaa = [];
    for (let _0x1f3a8f = 0, _0x55ac17 = _0x51589a.length; _0x1f3a8f !== _0x55ac17; ++_0x1f3a8f) {
      const _0x35f901 = _0x51589a[_0x1f3a8f];
      if (_0x35f901.id in _0x6ea324) _0x56abaa.push(_0x35f901);
    }
    return _0x56abaa;
  }
}
function WebGLShader(_0x18604e, _0x108f65, _0x135b0d) {
  const _0x218ff2 = _0x18604e.createShader(_0x108f65);
  return (_0x18604e.shaderSource(_0x218ff2, _0x135b0d), _0x18604e.compileShader(_0x218ff2), _0x218ff2);
}
const COMPLETION_STATUS_KHR = 0x91b1;
let programIdCount = 0;
function handleSource(_0x581c2, _0x20c7e6) {
  const _0x1731af = _0x581c2.split('\n'),
    _0x177180 = [],
    _0xf05b8e = Math.max(_0x20c7e6 - 6, 0),
    _0x4fda76 = Math.min(_0x20c7e6 + 6, _0x1731af.length);
  for (let _0x2e7790 = _0xf05b8e; _0x2e7790 < _0x4fda76; _0x2e7790++) {
    const _0x5070a5 = _0x2e7790 + 1;
    _0x177180.push((_0x5070a5 === _0x20c7e6 ? '>' : ' ') + ' ' + _0x5070a5 + ': ' + _0x1731af[_0x2e7790]);
  }
  return _0x177180.join('\n');
}
const _m0 = new Matrix3();
function getEncodingComponents(_0x2c0159) {
  ColorManagement._getMatrix(_m0, ColorManagement.workingColorSpace, _0x2c0159);
  const _0x4777e2 = 'mat3( ' + _m0.elements.map((_0x213e1b) => _0x213e1b.toFixed(4)) + ' )';
  switch (ColorManagement.getTransfer(_0x2c0159)) {
    case LinearTransfer:
      return [_0x4777e2, 'LinearTransferOETF'];
    case SRGBTransfer:
      return [_0x4777e2, 'sRGBTransferOETF'];
    default:
      console.warn('THREE.WebGLProgram: Unsupported color space: ', _0x2c0159);
      return [_0x4777e2, 'LinearTransferOETF'];
  }
}
function getShaderErrors(_0x42543a, _0x48c97e, _0x3f7af6) {
  const _0x3134c4 = _0x42543a.getShaderParameter(_0x48c97e, _0x42543a.COMPILE_STATUS),
    _0x25b022 = _0x42543a.getShaderInfoLog(_0x48c97e) || '',
    _0x5954bd = _0x25b022.trim();
  if (_0x3134c4 && _0x5954bd === '') return '';
  const _0x5427e1 = /ERROR: 0:(\d+)/.exec(_0x5954bd);
  if (_0x5427e1) {
    const _0x43b0e3 = parseInt(_0x5427e1[1]);
    return (
      _0x3f7af6.toUpperCase() +
      '\n\n' +
      _0x5954bd +
      '\n\n' +
      handleSource(_0x42543a.getShaderSource(_0x48c97e), _0x43b0e3)
    );
  } else return _0x5954bd;
}
function getTexelEncodingFunction(_0x1cf9d0, _0x5118ce) {
  const _0x436e1a = getEncodingComponents(_0x5118ce);
  return [
    'vec4 ' + _0x1cf9d0 + '( vec4 value ) {',
    '\treturn ' + _0x436e1a[1] + '( vec4( value.rgb * ' + _0x436e1a[0] + ', value.a ) );',
    '}',
  ].join('\n');
}
function getToneMappingFunction(_0x337a1e, _0xdc9749) {
  let _0x424d18;
  switch (_0xdc9749) {
    case LinearToneMapping:
      _0x424d18 = 'Linear';
      break;
    case ReinhardToneMapping:
      _0x424d18 = 'Reinhard';
      break;
    case CineonToneMapping:
      _0x424d18 = 'Cineon';
      break;
    case ACESFilmicToneMapping:
      _0x424d18 = 'ACESFilmic';
      break;
    case AgXToneMapping:
      _0x424d18 = 'AgX';
      break;
    case NeutralToneMapping:
      _0x424d18 = 'Neutral';
      break;
    case CustomToneMapping:
      _0x424d18 = 'Custom';
      break;
    default:
      (console.warn('THREE.WebGLProgram: Unsupported toneMapping:', _0xdc9749), (_0x424d18 = 'Linear'));
  }
  return 'vec3 ' + _0x337a1e + '( vec3 color ) { return ' + _0x424d18 + 'ToneMapping( color ); }';
}
const _v0 = new Vector3();
function getLuminanceFunction() {
  ColorManagement.getLuminanceCoefficients(_v0);
  const _0x52c3e9 = _v0.x.toFixed(4),
    _0x3dc0b5 = _v0.y.toFixed(4),
    _0x38a6fb = _v0.z.toFixed(4);
  return [
    'float luminance( const in vec3 rgb ) {',
    '\tconst vec3 weights = vec3( ' + _0x52c3e9 + ', ' + _0x3dc0b5 + ', ' + _0x38a6fb + ' );',
    '\treturn dot( weights, rgb );',
    '}',
  ].join('\n');
}
function generateVertexExtensions(_0x5f4f39) {
  const _0x2ea237 = [
    _0x5f4f39.extensionClipCullDistance ? '#extension GL_ANGLE_clip_cull_distance : require' : '',
    _0x5f4f39.extensionMultiDraw ? '#extension GL_ANGLE_multi_draw : require' : '',
  ];
  return _0x2ea237.filter(filterEmptyLine).join('\n');
}
function generateDefines(_0x17a031) {
  const _0x16b759 = [];
  for (const _0x1d4e65 in _0x17a031) {
    const _0x4a2740 = _0x17a031[_0x1d4e65];
    if (_0x4a2740 === false) continue;
    _0x16b759.push('#define ' + _0x1d4e65 + ' ' + _0x4a2740);
  }
  return _0x16b759.join('\n');
}
function fetchAttributeLocations(_0x4d2594, _0xb76044) {
  const _0x2ade1f = {},
    _0x2e7b4c = _0x4d2594.getProgramParameter(_0xb76044, _0x4d2594.ACTIVE_ATTRIBUTES);
  for (let _0x3f0b0b = 0; _0x3f0b0b < _0x2e7b4c; _0x3f0b0b++) {
    const _0x306fa9 = _0x4d2594.getActiveAttrib(_0xb76044, _0x3f0b0b),
      _0x22ae5b = _0x306fa9.name;
    let _0x1170dd = 1;
    if (_0x306fa9.type === _0x4d2594.FLOAT_MAT2) _0x1170dd = 2;
    if (_0x306fa9.type === _0x4d2594.FLOAT_MAT3) _0x1170dd = 3;
    if (_0x306fa9.type === _0x4d2594.FLOAT_MAT4) _0x1170dd = 4;
    _0x2ade1f[_0x22ae5b] = {
      type: _0x306fa9.type,
      location: _0x4d2594.getAttribLocation(_0xb76044, _0x22ae5b),
      locationSize: _0x1170dd,
    };
  }
  return _0x2ade1f;
}
function filterEmptyLine(_0x2f06f2) {
  return _0x2f06f2 !== '';
}
function replaceLightNums(_0xc90e0e, _0xb44c0f) {
  const _0x28ccd7 =
    _0xb44c0f.numSpotLightShadows + _0xb44c0f.numSpotLightMaps - _0xb44c0f.numSpotLightShadowsWithMaps;
  return _0xc90e0e
    .replace(/NUM_DIR_LIGHTS/g, _0xb44c0f.numDirLights)
    .replace(/NUM_SPOT_LIGHTS/g, _0xb44c0f.numSpotLights)
    .replace(/NUM_SPOT_LIGHT_MAPS/g, _0xb44c0f.numSpotLightMaps)
    .replace(/NUM_SPOT_LIGHT_COORDS/g, _0x28ccd7)
    .replace(/NUM_RECT_AREA_LIGHTS/g, _0xb44c0f.numRectAreaLights)
    .replace(/NUM_POINT_LIGHTS/g, _0xb44c0f.numPointLights)
    .replace(/NUM_HEMI_LIGHTS/g, _0xb44c0f.numHemiLights)
    .replace(/NUM_DIR_LIGHT_SHADOWS/g, _0xb44c0f.numDirLightShadows)
    .replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g, _0xb44c0f.numSpotLightShadowsWithMaps)
    .replace(/NUM_SPOT_LIGHT_SHADOWS/g, _0xb44c0f.numSpotLightShadows)
    .replace(/NUM_POINT_LIGHT_SHADOWS/g, _0xb44c0f.numPointLightShadows);
}
function replaceClippingPlaneNums(_0x463a82, _0x191db7) {
  return _0x463a82
    .replace(/NUM_CLIPPING_PLANES/g, _0x191db7.numClippingPlanes)
    .replace(/UNION_CLIPPING_PLANES/g, _0x191db7.numClippingPlanes - _0x191db7.numClipIntersection);
}
const includePattern = /^[ \t]*#include +<([\w\d./]+)>/gm;
function resolveIncludes(_0x45d468) {
  return _0x45d468.replace(includePattern, includeReplacer);
}
const shaderChunkMap = new Map();
function includeReplacer(_0x804b44, _0x58399f) {
  let _0x3c4dfb = ShaderChunk[_0x58399f];
  if (_0x3c4dfb === undefined) {
    const _0x4a4b83 = shaderChunkMap.get(_0x58399f);
    if (_0x4a4b83 !== undefined)
      ((_0x3c4dfb = ShaderChunk[_0x4a4b83]),
        console.warn(
          'THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',
          _0x58399f,
          _0x4a4b83,
        ));
    else throw new Error('Can not resolve #include <' + _0x58399f + '>');
  }
  return resolveIncludes(_0x3c4dfb);
}
const unrollLoopPattern =
  /#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;
function unrollLoops(_0x1a1e92) {
  return _0x1a1e92.replace(unrollLoopPattern, loopReplacer);
}
function loopReplacer(_0x12e9de, _0x34af07, _0x3d4089, _0x42ed2a) {
  let _0x381d25 = '';
  for (let _0x3d0bb3 = parseInt(_0x34af07); _0x3d0bb3 < parseInt(_0x3d4089); _0x3d0bb3++) {
    _0x381d25 += _0x42ed2a
      .replace(/\[\s*i\s*\]/g, '[ ' + _0x3d0bb3 + ' ]')
      .replace(/UNROLLED_LOOP_INDEX/g, _0x3d0bb3);
  }
  return _0x381d25;
}
function generatePrecision(_0x710efc) {
  let _0x21878b =
    'precision ' +
    _0x710efc.precision +
    ' float;\n\tprecision ' +
    _0x710efc.precision +
    ' int;\n\tprecision ' +
    _0x710efc.precision +
    ' sampler2D;\n\tprecision ' +
    _0x710efc.precision +
    ' samplerCube;\n\tprecision ' +
    _0x710efc.precision +
    ' sampler3D;\n\tprecision ' +
    _0x710efc.precision +
    ' sampler2DArray;\n\tprecision ' +
    _0x710efc.precision +
    ' sampler2DShadow;\n\tprecision ' +
    _0x710efc.precision +
    ' samplerCubeShadow;\n\tprecision ' +
    _0x710efc.precision +
    ' sampler2DArrayShadow;\n\tprecision ' +
    _0x710efc.precision +
    ' isampler2D;\n\tprecision ' +
    _0x710efc.precision +
    ' isampler3D;\n\tprecision ' +
    _0x710efc.precision +
    ' isamplerCube;\n\tprecision ' +
    _0x710efc.precision +
    ' isampler2DArray;\n\tprecision ' +
    _0x710efc.precision +
    ' usampler2D;\n\tprecision ' +
    _0x710efc.precision +
    ' usampler3D;\n\tprecision ' +
    _0x710efc.precision +
    ' usamplerCube;\n\tprecision ' +
    _0x710efc.precision +
    ' usampler2DArray;\n\t';
  if (_0x710efc.precision === 'highp') _0x21878b += '\n#define HIGH_PRECISION';
  else {
    if (_0x710efc.precision === 'mediump') _0x21878b += '\n#define MEDIUM_PRECISION';
    else _0x710efc.precision === 'lowp' && (_0x21878b += '\n#define LOW_PRECISION');
  }
  return _0x21878b;
}
function generateShadowMapTypeDefine(_0x46d6eb) {
  let _0x23926e = 'SHADOWMAP_TYPE_BASIC';
  if (_0x46d6eb.shadowMapType === PCFShadowMap) _0x23926e = 'SHADOWMAP_TYPE_PCF';
  else {
    if (_0x46d6eb.shadowMapType === PCFSoftShadowMap) _0x23926e = 'SHADOWMAP_TYPE_PCF_SOFT';
    else _0x46d6eb.shadowMapType === VSMShadowMap && (_0x23926e = 'SHADOWMAP_TYPE_VSM');
  }
  return _0x23926e;
}
function generateEnvMapTypeDefine(_0x4902ff) {
  let _0x1d7dbc = 'ENVMAP_TYPE_CUBE';
  if (_0x4902ff.envMap)
    switch (_0x4902ff.envMapMode) {
      case CubeReflectionMapping:
      case CubeRefractionMapping:
        _0x1d7dbc = 'ENVMAP_TYPE_CUBE';
        break;
      case CubeUVReflectionMapping:
        _0x1d7dbc = 'ENVMAP_TYPE_CUBE_UV';
        break;
    }
  return _0x1d7dbc;
}
function generateEnvMapModeDefine(_0x1523d3) {
  let _0x3c0e97 = 'ENVMAP_MODE_REFLECTION';
  if (_0x1523d3.envMap)
    switch (_0x1523d3.envMapMode) {
      case CubeRefractionMapping:
        _0x3c0e97 = 'ENVMAP_MODE_REFRACTION';
        break;
    }
  return _0x3c0e97;
}
function generateEnvMapBlendingDefine(_0x583ba9) {
  let _0x1f526e = 'ENVMAP_BLENDING_NONE';
  if (_0x583ba9.envMap)
    switch (_0x583ba9.combine) {
      case MultiplyOperation:
        _0x1f526e = 'ENVMAP_BLENDING_MULTIPLY';
        break;
      case MixOperation:
        _0x1f526e = 'ENVMAP_BLENDING_MIX';
        break;
      case AddOperation:
        _0x1f526e = 'ENVMAP_BLENDING_ADD';
        break;
    }
  return _0x1f526e;
}
function generateCubeUVSize(_0x5e0252) {
  const _0x119f19 = _0x5e0252.envMapCubeUVHeight;
  if (_0x119f19 === null) return null;
  const _0xcfd92d = Math.log2(_0x119f19) - 2,
    _0x464f83 = 1 / _0x119f19,
    _0x3cc171 = 1 / (3 * Math.max(Math.pow(2, _0xcfd92d), 7 * 16));
  return { texelWidth: _0x3cc171, texelHeight: _0x464f83, maxMip: _0xcfd92d };
}
function WebGLProgram(_0x5a145a, _0x1a3458, _0x41546a, _0x444e55) {
  const _0x51453b = _0x5a145a.getContext(),
    _0x100030 = _0x41546a.defines;
  let _0x19c468 = _0x41546a.vertexShader,
    _0x43dd76 = _0x41546a.fragmentShader;
  const _0x2cf379 = generateShadowMapTypeDefine(_0x41546a),
    _0x1382e8 = generateEnvMapTypeDefine(_0x41546a),
    _0x22ac69 = generateEnvMapModeDefine(_0x41546a),
    _0x58be0d = generateEnvMapBlendingDefine(_0x41546a),
    _0x222bbc = generateCubeUVSize(_0x41546a),
    _0x99b41d = generateVertexExtensions(_0x41546a),
    _0x35d2fc = generateDefines(_0x100030),
    _0x25a2b4 = _0x51453b.createProgram();
  let _0x49f39e,
    _0x43c657,
    _0x451b8f = _0x41546a.glslVersion ? '#version ' + _0x41546a.glslVersion + '\n' : '';
  _0x41546a.isRawShaderMaterial
    ? ((_0x49f39e = [
        '#define SHADER_TYPE ' + _0x41546a.shaderType,
        '#define SHADER_NAME ' + _0x41546a.shaderName,
        _0x35d2fc,
      ]
        .filter(filterEmptyLine)
        .join('\n')),
      _0x49f39e.length > 0 && (_0x49f39e += '\n'),
      (_0x43c657 = [
        '#define SHADER_TYPE ' + _0x41546a.shaderType,
        '#define SHADER_NAME ' + _0x41546a.shaderName,
        _0x35d2fc,
      ]
        .filter(filterEmptyLine)
        .join('\n')),
      _0x43c657.length > 0 && (_0x43c657 += '\n'))
    : ((_0x49f39e = [
        generatePrecision(_0x41546a),
        '#define SHADER_TYPE ' + _0x41546a.shaderType,
        '#define SHADER_NAME ' + _0x41546a.shaderName,
        _0x35d2fc,
        _0x41546a.extensionClipCullDistance ? '#define USE_CLIP_DISTANCE' : '',
        _0x41546a.batching ? '#define USE_BATCHING' : '',
        _0x41546a.batchingColor ? '#define USE_BATCHING_COLOR' : '',
        _0x41546a.instancing ? '#define USE_INSTANCING' : '',
        _0x41546a.instancingColor ? '#define USE_INSTANCING_COLOR' : '',
        _0x41546a.instancingMorph ? '#define USE_INSTANCING_MORPH' : '',
        _0x41546a.useFog && _0x41546a.fog ? '#define USE_FOG' : '',
        _0x41546a.useFog && _0x41546a.fogExp2 ? '#define FOG_EXP2' : '',
        _0x41546a.map ? '#define USE_MAP' : '',
        _0x41546a.envMap ? '#define USE_ENVMAP' : '',
        _0x41546a.envMap ? '#define ' + _0x22ac69 : '',
        _0x41546a.lightMap ? '#define USE_LIGHTMAP' : '',
        _0x41546a.aoMap ? '#define USE_AOMAP' : '',
        _0x41546a.bumpMap ? '#define USE_BUMPMAP' : '',
        _0x41546a.normalMap ? '#define USE_NORMALMAP' : '',
        _0x41546a.normalMapObjectSpace ? '#define USE_NORMALMAP_OBJECTSPACE' : '',
        _0x41546a.normalMapTangentSpace ? '#define USE_NORMALMAP_TANGENTSPACE' : '',
        _0x41546a.displacementMap ? '#define USE_DISPLACEMENTMAP' : '',
        _0x41546a.emissiveMap ? '#define USE_EMISSIVEMAP' : '',
        _0x41546a.anisotropy ? '#define USE_ANISOTROPY' : '',
        _0x41546a.anisotropyMap ? '#define USE_ANISOTROPYMAP' : '',
        _0x41546a.clearcoatMap ? '#define USE_CLEARCOATMAP' : '',
        _0x41546a.clearcoatRoughnessMap ? '#define USE_CLEARCOAT_ROUGHNESSMAP' : '',
        _0x41546a.clearcoatNormalMap ? '#define USE_CLEARCOAT_NORMALMAP' : '',
        _0x41546a.iridescenceMap ? '#define USE_IRIDESCENCEMAP' : '',
        _0x41546a.iridescenceThicknessMap ? '#define USE_IRIDESCENCE_THICKNESSMAP' : '',
        _0x41546a.specularMap ? '#define USE_SPECULARMAP' : '',
        _0x41546a.specularColorMap ? '#define USE_SPECULAR_COLORMAP' : '',
        _0x41546a.specularIntensityMap ? '#define USE_SPECULAR_INTENSITYMAP' : '',
        _0x41546a.roughnessMap ? '#define USE_ROUGHNESSMAP' : '',
        _0x41546a.metalnessMap ? '#define USE_METALNESSMAP' : '',
        _0x41546a.alphaMap ? '#define USE_ALPHAMAP' : '',
        _0x41546a.alphaHash ? '#define USE_ALPHAHASH' : '',
        _0x41546a.transmission ? '#define USE_TRANSMISSION' : '',
        _0x41546a.transmissionMap ? '#define USE_TRANSMISSIONMAP' : '',
        _0x41546a.thicknessMap ? '#define USE_THICKNESSMAP' : '',
        _0x41546a.sheenColorMap ? '#define USE_SHEEN_COLORMAP' : '',
        _0x41546a.sheenRoughnessMap ? '#define USE_SHEEN_ROUGHNESSMAP' : '',
        _0x41546a.mapUv ? '#define MAP_UV ' + _0x41546a.mapUv : '',
        _0x41546a.alphaMapUv ? '#define ALPHAMAP_UV ' + _0x41546a.alphaMapUv : '',
        _0x41546a.lightMapUv ? '#define LIGHTMAP_UV ' + _0x41546a.lightMapUv : '',
        _0x41546a.aoMapUv ? '#define AOMAP_UV ' + _0x41546a.aoMapUv : '',
        _0x41546a.emissiveMapUv ? '#define EMISSIVEMAP_UV ' + _0x41546a.emissiveMapUv : '',
        _0x41546a.bumpMapUv ? '#define BUMPMAP_UV ' + _0x41546a.bumpMapUv : '',
        _0x41546a.normalMapUv ? '#define NORMALMAP_UV ' + _0x41546a.normalMapUv : '',
        _0x41546a.displacementMapUv ? '#define DISPLACEMENTMAP_UV ' + _0x41546a.displacementMapUv : '',
        _0x41546a.metalnessMapUv ? '#define METALNESSMAP_UV ' + _0x41546a.metalnessMapUv : '',
        _0x41546a.roughnessMapUv ? '#define ROUGHNESSMAP_UV ' + _0x41546a.roughnessMapUv : '',
        _0x41546a.anisotropyMapUv ? '#define ANISOTROPYMAP_UV ' + _0x41546a.anisotropyMapUv : '',
        _0x41546a.clearcoatMapUv ? '#define CLEARCOATMAP_UV ' + _0x41546a.clearcoatMapUv : '',
        _0x41546a.clearcoatNormalMapUv
          ? '#define CLEARCOAT_NORMALMAP_UV ' + _0x41546a.clearcoatNormalMapUv
          : '',
        _0x41546a.clearcoatRoughnessMapUv
          ? '#define CLEARCOAT_ROUGHNESSMAP_UV ' + _0x41546a.clearcoatRoughnessMapUv
          : '',
        _0x41546a.iridescenceMapUv ? '#define IRIDESCENCEMAP_UV ' + _0x41546a.iridescenceMapUv : '',
        _0x41546a.iridescenceThicknessMapUv
          ? '#define IRIDESCENCE_THICKNESSMAP_UV ' + _0x41546a.iridescenceThicknessMapUv
          : '',
        _0x41546a.sheenColorMapUv ? '#define SHEEN_COLORMAP_UV ' + _0x41546a.sheenColorMapUv : '',
        _0x41546a.sheenRoughnessMapUv ? '#define SHEEN_ROUGHNESSMAP_UV ' + _0x41546a.sheenRoughnessMapUv : '',
        _0x41546a.specularMapUv ? '#define SPECULARMAP_UV ' + _0x41546a.specularMapUv : '',
        _0x41546a.specularColorMapUv ? '#define SPECULAR_COLORMAP_UV ' + _0x41546a.specularColorMapUv : '',
        _0x41546a.specularIntensityMapUv
          ? '#define SPECULAR_INTENSITYMAP_UV ' + _0x41546a.specularIntensityMapUv
          : '',
        _0x41546a.transmissionMapUv ? '#define TRANSMISSIONMAP_UV ' + _0x41546a.transmissionMapUv : '',
        _0x41546a.thicknessMapUv ? '#define THICKNESSMAP_UV ' + _0x41546a.thicknessMapUv : '',
        _0x41546a.vertexTangents && _0x41546a.flatShading === false ? '#define USE_TANGENT' : '',
        _0x41546a.vertexColors ? '#define USE_COLOR' : '',
        _0x41546a.vertexAlphas ? '#define USE_COLOR_ALPHA' : '',
        _0x41546a.vertexUv1s ? '#define USE_UV1' : '',
        _0x41546a.vertexUv2s ? '#define USE_UV2' : '',
        _0x41546a.vertexUv3s ? '#define USE_UV3' : '',
        _0x41546a.pointsUvs ? '#define USE_POINTS_UV' : '',
        _0x41546a.flatShading ? '#define FLAT_SHADED' : '',
        _0x41546a.skinning ? '#define USE_SKINNING' : '',
        _0x41546a.morphTargets ? '#define USE_MORPHTARGETS' : '',
        _0x41546a.morphNormals && _0x41546a.flatShading === false ? '#define USE_MORPHNORMALS' : '',
        _0x41546a.morphColors ? '#define USE_MORPHCOLORS' : '',
        _0x41546a.morphTargetsCount > 0
          ? '#define MORPHTARGETS_TEXTURE_STRIDE ' + _0x41546a.morphTextureStride
          : '',
        _0x41546a.morphTargetsCount > 0 ? '#define MORPHTARGETS_COUNT ' + _0x41546a.morphTargetsCount : '',
        _0x41546a.doubleSided ? '#define DOUBLE_SIDED' : '',
        _0x41546a.flipSided ? '#define FLIP_SIDED' : '',
        _0x41546a.shadowMapEnabled ? '#define USE_SHADOWMAP' : '',
        _0x41546a.shadowMapEnabled ? '#define ' + _0x2cf379 : '',
        _0x41546a.sizeAttenuation ? '#define USE_SIZEATTENUATION' : '',
        _0x41546a.numLightProbes > 0 ? '#define USE_LIGHT_PROBES' : '',
        _0x41546a.logarithmicDepthBuffer ? '#define USE_LOGARITHMIC_DEPTH_BUFFER' : '',
        _0x41546a.reversedDepthBuffer ? '#define USE_REVERSED_DEPTH_BUFFER' : '',
        'uniform mat4 modelMatrix;',
        'uniform mat4 modelViewMatrix;',
        'uniform mat4 projectionMatrix;',
        'uniform mat4 viewMatrix;',
        'uniform mat3 normalMatrix;',
        'uniform vec3 cameraPosition;',
        'uniform bool isOrthographic;',
        '#ifdef USE_INSTANCING',
        '\tattribute mat4 instanceMatrix;',
        '#endif',
        '#ifdef USE_INSTANCING_COLOR',
        '\tattribute vec3 instanceColor;',
        '#endif',
        '#ifdef USE_INSTANCING_MORPH',
        '\tuniform sampler2D morphTexture;',
        '#endif',
        'attribute vec3 position;',
        'attribute vec3 normal;',
        'attribute vec2 uv;',
        '#ifdef USE_UV1',
        '\tattribute vec2 uv1;',
        '#endif',
        '#ifdef USE_UV2',
        '\tattribute vec2 uv2;',
        '#endif',
        '#ifdef USE_UV3',
        '\tattribute vec2 uv3;',
        '#endif',
        '#ifdef USE_TANGENT',
        '\tattribute vec4 tangent;',
        '#endif',
        '#if defined( USE_COLOR_ALPHA )',
        '\tattribute vec4 color;',
        '#elif defined( USE_COLOR )',
        '\tattribute vec3 color;',
        '#endif',
        '#ifdef USE_SKINNING',
        '\tattribute vec4 skinIndex;',
        '\tattribute vec4 skinWeight;',
        '#endif',
        '\n',
      ]
        .filter(filterEmptyLine)
        .join('\n')),
      (_0x43c657 = [
        generatePrecision(_0x41546a),
        '#define SHADER_TYPE ' + _0x41546a.shaderType,
        '#define SHADER_NAME ' + _0x41546a.shaderName,
        _0x35d2fc,
        _0x41546a.useFog && _0x41546a.fog ? '#define USE_FOG' : '',
        _0x41546a.useFog && _0x41546a.fogExp2 ? '#define FOG_EXP2' : '',
        _0x41546a.alphaToCoverage ? '#define ALPHA_TO_COVERAGE' : '',
        _0x41546a.map ? '#define USE_MAP' : '',
        _0x41546a.matcap ? '#define USE_MATCAP' : '',
        _0x41546a.envMap ? '#define USE_ENVMAP' : '',
        _0x41546a.envMap ? '#define ' + _0x1382e8 : '',
        _0x41546a.envMap ? '#define ' + _0x22ac69 : '',
        _0x41546a.envMap ? '#define ' + _0x58be0d : '',
        _0x222bbc ? '#define CUBEUV_TEXEL_WIDTH ' + _0x222bbc.texelWidth : '',
        _0x222bbc ? '#define CUBEUV_TEXEL_HEIGHT ' + _0x222bbc.texelHeight : '',
        _0x222bbc ? '#define CUBEUV_MAX_MIP ' + _0x222bbc.maxMip + '.0' : '',
        _0x41546a.lightMap ? '#define USE_LIGHTMAP' : '',
        _0x41546a.aoMap ? '#define USE_AOMAP' : '',
        _0x41546a.bumpMap ? '#define USE_BUMPMAP' : '',
        _0x41546a.normalMap ? '#define USE_NORMALMAP' : '',
        _0x41546a.normalMapObjectSpace ? '#define USE_NORMALMAP_OBJECTSPACE' : '',
        _0x41546a.normalMapTangentSpace ? '#define USE_NORMALMAP_TANGENTSPACE' : '',
        _0x41546a.emissiveMap ? '#define USE_EMISSIVEMAP' : '',
        _0x41546a.anisotropy ? '#define USE_ANISOTROPY' : '',
        _0x41546a.anisotropyMap ? '#define USE_ANISOTROPYMAP' : '',
        _0x41546a.clearcoat ? '#define USE_CLEARCOAT' : '',
        _0x41546a.clearcoatMap ? '#define USE_CLEARCOATMAP' : '',
        _0x41546a.clearcoatRoughnessMap ? '#define USE_CLEARCOAT_ROUGHNESSMAP' : '',
        _0x41546a.clearcoatNormalMap ? '#define USE_CLEARCOAT_NORMALMAP' : '',
        _0x41546a.dispersion ? '#define USE_DISPERSION' : '',
        _0x41546a.iridescence ? '#define USE_IRIDESCENCE' : '',
        _0x41546a.iridescenceMap ? '#define USE_IRIDESCENCEMAP' : '',
        _0x41546a.iridescenceThicknessMap ? '#define USE_IRIDESCENCE_THICKNESSMAP' : '',
        _0x41546a.specularMap ? '#define USE_SPECULARMAP' : '',
        _0x41546a.specularColorMap ? '#define USE_SPECULAR_COLORMAP' : '',
        _0x41546a.specularIntensityMap ? '#define USE_SPECULAR_INTENSITYMAP' : '',
        _0x41546a.roughnessMap ? '#define USE_ROUGHNESSMAP' : '',
        _0x41546a.metalnessMap ? '#define USE_METALNESSMAP' : '',
        _0x41546a.alphaMap ? '#define USE_ALPHAMAP' : '',
        _0x41546a.alphaTest ? '#define USE_ALPHATEST' : '',
        _0x41546a.alphaHash ? '#define USE_ALPHAHASH' : '',
        _0x41546a.sheen ? '#define USE_SHEEN' : '',
        _0x41546a.sheenColorMap ? '#define USE_SHEEN_COLORMAP' : '',
        _0x41546a.sheenRoughnessMap ? '#define USE_SHEEN_ROUGHNESSMAP' : '',
        _0x41546a.transmission ? '#define USE_TRANSMISSION' : '',
        _0x41546a.transmissionMap ? '#define USE_TRANSMISSIONMAP' : '',
        _0x41546a.thicknessMap ? '#define USE_THICKNESSMAP' : '',
        _0x41546a.vertexTangents && _0x41546a.flatShading === false ? '#define USE_TANGENT' : '',
        _0x41546a.vertexColors || _0x41546a.instancingColor || _0x41546a.batchingColor
          ? '#define USE_COLOR'
          : '',
        _0x41546a.vertexAlphas ? '#define USE_COLOR_ALPHA' : '',
        _0x41546a.vertexUv1s ? '#define USE_UV1' : '',
        _0x41546a.vertexUv2s ? '#define USE_UV2' : '',
        _0x41546a.vertexUv3s ? '#define USE_UV3' : '',
        _0x41546a.pointsUvs ? '#define USE_POINTS_UV' : '',
        _0x41546a.gradientMap ? '#define USE_GRADIENTMAP' : '',
        _0x41546a.flatShading ? '#define FLAT_SHADED' : '',
        _0x41546a.doubleSided ? '#define DOUBLE_SIDED' : '',
        _0x41546a.flipSided ? '#define FLIP_SIDED' : '',
        _0x41546a.shadowMapEnabled ? '#define USE_SHADOWMAP' : '',
        _0x41546a.shadowMapEnabled ? '#define ' + _0x2cf379 : '',
        _0x41546a.premultipliedAlpha ? '#define PREMULTIPLIED_ALPHA' : '',
        _0x41546a.numLightProbes > 0 ? '#define USE_LIGHT_PROBES' : '',
        _0x41546a.decodeVideoTexture ? '#define DECODE_VIDEO_TEXTURE' : '',
        _0x41546a.decodeVideoTextureEmissive ? '#define DECODE_VIDEO_TEXTURE_EMISSIVE' : '',
        _0x41546a.logarithmicDepthBuffer ? '#define USE_LOGARITHMIC_DEPTH_BUFFER' : '',
        _0x41546a.reversedDepthBuffer ? '#define USE_REVERSED_DEPTH_BUFFER' : '',
        'uniform mat4 viewMatrix;',
        'uniform vec3 cameraPosition;',
        'uniform bool isOrthographic;',
        _0x41546a.toneMapping !== NoToneMapping ? '#define TONE_MAPPING' : '',
        _0x41546a.toneMapping !== NoToneMapping ? ShaderChunk.tonemapping_pars_fragment : '',
        _0x41546a.toneMapping !== NoToneMapping
          ? getToneMappingFunction('toneMapping', _0x41546a.toneMapping)
          : '',
        _0x41546a.dithering ? '#define DITHERING' : '',
        _0x41546a.opaque ? '#define OPAQUE' : '',
        ShaderChunk.colorspace_pars_fragment,
        getTexelEncodingFunction('linearToOutputTexel', _0x41546a.outputColorSpace),
        getLuminanceFunction(),
        _0x41546a.useDepthPacking ? '#define DEPTH_PACKING ' + _0x41546a.depthPacking : '',
        '\n',
      ]
        .filter(filterEmptyLine)
        .join('\n')));
  ((_0x19c468 = resolveIncludes(_0x19c468)),
    (_0x19c468 = replaceLightNums(_0x19c468, _0x41546a)),
    (_0x19c468 = replaceClippingPlaneNums(_0x19c468, _0x41546a)),
    (_0x43dd76 = resolveIncludes(_0x43dd76)),
    (_0x43dd76 = replaceLightNums(_0x43dd76, _0x41546a)),
    (_0x43dd76 = replaceClippingPlaneNums(_0x43dd76, _0x41546a)),
    (_0x19c468 = unrollLoops(_0x19c468)),
    (_0x43dd76 = unrollLoops(_0x43dd76)));
  _0x41546a.isRawShaderMaterial !== true &&
    ((_0x451b8f = '#version 300 es\n'),
    (_0x49f39e =
      [_0x99b41d, '#define attribute in', '#define varying out', '#define texture2D texture'].join('\n') +
      '\n' +
      _0x49f39e),
    (_0x43c657 =
      [
        '#define varying in',
        _0x41546a.glslVersion === GLSL3 ? '' : 'layout(location = 0) out highp vec4 pc_fragColor;',
        _0x41546a.glslVersion === GLSL3 ? '' : '#define gl_FragColor pc_fragColor',
        '#define gl_FragDepthEXT gl_FragDepth',
        '#define texture2D texture',
        '#define textureCube texture',
        '#define texture2DProj textureProj',
        '#define texture2DLodEXT textureLod',
        '#define texture2DProjLodEXT textureProjLod',
        '#define textureCubeLodEXT textureLod',
        '#define texture2DGradEXT textureGrad',
        '#define texture2DProjGradEXT textureProjGrad',
        '#define textureCubeGradEXT textureGrad',
      ].join('\n') +
      '\n' +
      _0x43c657));
  const _0x4db3b2 = _0x451b8f + _0x49f39e + _0x19c468,
    _0x340b5e = _0x451b8f + _0x43c657 + _0x43dd76,
    _0x24d762 = WebGLShader(_0x51453b, _0x51453b.VERTEX_SHADER, _0x4db3b2),
    _0x1f949f = WebGLShader(_0x51453b, _0x51453b.FRAGMENT_SHADER, _0x340b5e);
  (_0x51453b.attachShader(_0x25a2b4, _0x24d762), _0x51453b.attachShader(_0x25a2b4, _0x1f949f));
  if (_0x41546a.index0AttributeName !== undefined)
    _0x51453b.bindAttribLocation(_0x25a2b4, 0, _0x41546a.index0AttributeName);
  else _0x41546a.morphTargets === true && _0x51453b.bindAttribLocation(_0x25a2b4, 0, 'position');
  _0x51453b.linkProgram(_0x25a2b4);
  function _0x29fd2a(_0x1cd67d) {
    if (_0x5a145a.debug.checkShaderErrors) {
      const _0x2c05cf = _0x51453b.getProgramInfoLog(_0x25a2b4) || '',
        _0x2f28ea = _0x51453b.getShaderInfoLog(_0x24d762) || '',
        _0x45b857 = _0x51453b.getShaderInfoLog(_0x1f949f) || '',
        _0x2dda80 = _0x2c05cf.trim(),
        _0x4071c4 = _0x2f28ea.trim(),
        _0x562c46 = _0x45b857.trim();
      let _0x14166c = true,
        _0x254f8c = true;
      if (_0x51453b.getProgramParameter(_0x25a2b4, _0x51453b.LINK_STATUS) === false) {
        _0x14166c = false;
        if (typeof _0x5a145a.debug.onShaderError === 'function')
          _0x5a145a.debug.onShaderError(_0x51453b, _0x25a2b4, _0x24d762, _0x1f949f);
        else {
          const _0x1a42bf = getShaderErrors(_0x51453b, _0x24d762, 'vertex'),
            _0x14678a = getShaderErrors(_0x51453b, _0x1f949f, 'fragment');
          console.error(
            'THREE.WebGLProgram: Shader Error ' +
              _0x51453b.getError() +
              ' - ' +
              'VALIDATE_STATUS ' +
              _0x51453b.getProgramParameter(_0x25a2b4, _0x51453b.VALIDATE_STATUS) +
              '\n\n' +
              'Material Name: ' +
              _0x1cd67d.name +
              '\n' +
              'Material Type: ' +
              _0x1cd67d.type +
              '\n\n' +
              'Program Info Log: ' +
              _0x2dda80 +
              '\n' +
              _0x1a42bf +
              '\n' +
              _0x14678a,
          );
        }
      } else {
        if (_0x2dda80 !== '') console.warn('THREE.WebGLProgram: Program Info Log:', _0x2dda80);
        else (_0x4071c4 === '' || _0x562c46 === '') && (_0x254f8c = false);
      }
      _0x254f8c &&
        (_0x1cd67d.diagnostics = {
          runnable: _0x14166c,
          programLog: _0x2dda80,
          vertexShader: { log: _0x4071c4, prefix: _0x49f39e },
          fragmentShader: { log: _0x562c46, prefix: _0x43c657 },
        });
    }
    (_0x51453b.deleteShader(_0x24d762),
      _0x51453b.deleteShader(_0x1f949f),
      (_0x454c4e = new WebGLUniforms(_0x51453b, _0x25a2b4)),
      (_0xd07c13 = fetchAttributeLocations(_0x51453b, _0x25a2b4)));
  }
  let _0x454c4e;
  this.getUniforms = function () {
    return (_0x454c4e === undefined && _0x29fd2a(this), _0x454c4e);
  };
  let _0xd07c13;
  this.getAttributes = function () {
    return (_0xd07c13 === undefined && _0x29fd2a(this), _0xd07c13);
  };
  let _0x2ab39c = _0x41546a.rendererExtensionParallelShaderCompile === false;
  return (
    (this.isReady = function () {
      return (
        _0x2ab39c === false && (_0x2ab39c = _0x51453b.getProgramParameter(_0x25a2b4, COMPLETION_STATUS_KHR)),
        _0x2ab39c
      );
    }),
    (this.destroy = function () {
      (_0x444e55.releaseStatesOfProgram(this),
        _0x51453b.deleteProgram(_0x25a2b4),
        (this.program = undefined));
    }),
    (this.type = _0x41546a.shaderType),
    (this.name = _0x41546a.shaderName),
    (this.id = programIdCount++),
    (this.cacheKey = _0x1a3458),
    (this.usedTimes = 1),
    (this.program = _0x25a2b4),
    (this.vertexShader = _0x24d762),
    (this.fragmentShader = _0x1f949f),
    this
  );
}
let _id = 0;
class WebGLShaderCache {
  constructor() {
    ((this.shaderCache = new Map()), (this.materialCache = new Map()));
  }
  ['update'](_0x16d789) {
    const _0x121338 = _0x16d789.vertexShader,
      _0x143ae2 = _0x16d789.fragmentShader,
      _0xd2423c = this._getShaderStage(_0x121338),
      _0x40b753 = this._getShaderStage(_0x143ae2),
      _0x42471a = this._getShaderCacheForMaterial(_0x16d789);
    return (
      _0x42471a.has(_0xd2423c) === false && (_0x42471a.add(_0xd2423c), _0xd2423c.usedTimes++),
      _0x42471a.has(_0x40b753) === false && (_0x42471a.add(_0x40b753), _0x40b753.usedTimes++),
      this
    );
  }
  ['remove'](_0x35512d) {
    const _0x3fdb24 = this.materialCache.get(_0x35512d);
    for (const _0x11abc7 of _0x3fdb24) {
      _0x11abc7.usedTimes--;
      if (_0x11abc7.usedTimes === 0) this.shaderCache.delete(_0x11abc7.code);
    }
    return (this.materialCache.delete(_0x35512d), this);
  }
  ['getVertexShaderID'](_0x3528ff) {
    return this._getShaderStage(_0x3528ff.vertexShader).id;
  }
  ['getFragmentShaderID'](_0x4822fe) {
    return this._getShaderStage(_0x4822fe.fragmentShader).id;
  }
  ['dispose']() {
    (this.shaderCache.clear(), this.materialCache.clear());
  }
  ['_getShaderCacheForMaterial'](_0x2fdf63) {
    const _0x42b360 = this.materialCache;
    let _0x2e1be9 = _0x42b360.get(_0x2fdf63);
    return (
      _0x2e1be9 === undefined && ((_0x2e1be9 = new Set()), _0x42b360.set(_0x2fdf63, _0x2e1be9)),
      _0x2e1be9
    );
  }
  ['_getShaderStage'](_0x5b1e19) {
    const _0x548318 = this.shaderCache;
    let _0x2fafa3 = _0x548318.get(_0x5b1e19);
    return (
      _0x2fafa3 === undefined &&
        ((_0x2fafa3 = new WebGLShaderStage(_0x5b1e19)), _0x548318.set(_0x5b1e19, _0x2fafa3)),
      _0x2fafa3
    );
  }
}
class WebGLShaderStage {
  constructor(_0x3a2c5f) {
    ((this.id = _id++), (this.code = _0x3a2c5f), (this.usedTimes = 0));
  }
}
function WebGLPrograms(_0x13ecab, _0x51c21c, _0x2367a7, _0x32b0d5, _0x56e402, _0x389b65, _0x8ef3aa) {
  const _0x49d7c4 = new Layers(),
    _0x204b53 = new WebGLShaderCache(),
    _0x2766ca = new Set(),
    _0x53bb97 = [],
    _0xea4185 = _0x56e402.logarithmicDepthBuffer,
    _0xacab8b = _0x56e402.vertexTextures;
  let _0x1f219c = _0x56e402.precision;
  const _0x14f0bd = {
    MeshDepthMaterial: 'depth',
    MeshDistanceMaterial: 'distanceRGBA',
    MeshNormalMaterial: 'normal',
    MeshBasicMaterial: 'basic',
    MeshLambertMaterial: 'lambert',
    MeshPhongMaterial: 'phong',
    MeshToonMaterial: 'toon',
    MeshStandardMaterial: 'physical',
    MeshPhysicalMaterial: 'physical',
    MeshMatcapMaterial: 'matcap',
    LineBasicMaterial: 'basic',
    LineDashedMaterial: 'dashed',
    PointsMaterial: 'points',
    ShadowMaterial: 'shadow',
    SpriteMaterial: 'sprite',
  };
  function _0x110951(_0x5718fa) {
    _0x2766ca.add(_0x5718fa);
    if (_0x5718fa === 0) return 'uv';
    return 'uv' + _0x5718fa;
  }
  function _0x1f3f2a(_0x3f8bdf, _0xe22441, _0x3cfea4, _0x2c2869, _0x41fe71) {
    const _0x52b3fa = _0x2c2869.fog,
      _0x280cc4 = _0x41fe71.geometry,
      _0x2b23d2 = _0x3f8bdf.isMeshStandardMaterial ? _0x2c2869.environment : null,
      _0x3a31f2 = (_0x3f8bdf.isMeshStandardMaterial ? _0x2367a7 : _0x51c21c).get(
        _0x3f8bdf.envMap || _0x2b23d2,
      ),
      _0x1ec56d =
        !!_0x3a31f2 && _0x3a31f2.mapping === CubeUVReflectionMapping ? _0x3a31f2.image.height : null,
      _0x107724 = _0x14f0bd[_0x3f8bdf.type];
    _0x3f8bdf.precision !== null &&
      ((_0x1f219c = _0x56e402.getMaxPrecision(_0x3f8bdf.precision)),
      _0x1f219c !== _0x3f8bdf.precision &&
        console.warn(
          'THREE.WebGLProgram.getParameters:',
          _0x3f8bdf.precision,
          'not supported, using',
          _0x1f219c,
          'instead.',
        ));
    const _0x5567a2 =
        _0x280cc4.morphAttributes.position ||
        _0x280cc4.morphAttributes.normal ||
        _0x280cc4.morphAttributes.color,
      _0x510286 = _0x5567a2 !== undefined ? _0x5567a2.length : 0;
    let _0x1867ac = 0;
    if (_0x280cc4.morphAttributes.position !== undefined) _0x1867ac = 1;
    if (_0x280cc4.morphAttributes.normal !== undefined) _0x1867ac = 2;
    if (_0x280cc4.morphAttributes.color !== undefined) _0x1867ac = 3;
    let _0x391155, _0x12914b, _0x55e423, _0xb97b8f;
    if (_0x107724) {
      const _0x8df198 = ShaderLib[_0x107724];
      ((_0x391155 = _0x8df198.vertexShader), (_0x12914b = _0x8df198.fragmentShader));
    } else
      ((_0x391155 = _0x3f8bdf.vertexShader),
        (_0x12914b = _0x3f8bdf.fragmentShader),
        _0x204b53.update(_0x3f8bdf),
        (_0x55e423 = _0x204b53.getVertexShaderID(_0x3f8bdf)),
        (_0xb97b8f = _0x204b53.getFragmentShaderID(_0x3f8bdf)));
    const _0x328924 = _0x13ecab.getRenderTarget(),
      _0x530191 = _0x13ecab.state.buffers.depth.getReversed(),
      _0x407866 = _0x41fe71.isInstancedMesh === true,
      _0x34d508 = _0x41fe71.isBatchedMesh === true,
      _0x51db59 = !!_0x3f8bdf.map,
      _0x2cc81e = !!_0x3f8bdf.matcap,
      _0x341919 = !!_0x3a31f2,
      _0x1eb869 = !!_0x3f8bdf.aoMap,
      _0x40a744 = !!_0x3f8bdf.lightMap,
      _0x25b5ee = !!_0x3f8bdf.bumpMap,
      _0x343107 = !!_0x3f8bdf.normalMap,
      _0x3df375 = !!_0x3f8bdf.displacementMap,
      _0x4cbc17 = !!_0x3f8bdf.emissiveMap,
      _0x3e6f92 = !!_0x3f8bdf.metalnessMap,
      _0x409f84 = !!_0x3f8bdf.roughnessMap,
      _0x1ed0c2 = _0x3f8bdf.anisotropy > 0,
      _0x1af18c = _0x3f8bdf.clearcoat > 0,
      _0x1f74b8 = _0x3f8bdf.dispersion > 0,
      _0x5000e4 = _0x3f8bdf.iridescence > 0,
      _0x11762f = _0x3f8bdf.sheen > 0,
      _0x4a1dd9 = _0x3f8bdf.transmission > 0,
      _0x35ee8b = _0x1ed0c2 && !!_0x3f8bdf.anisotropyMap,
      _0x240c96 = _0x1af18c && !!_0x3f8bdf.clearcoatMap,
      _0x8abbce = _0x1af18c && !!_0x3f8bdf.clearcoatNormalMap,
      _0x200e78 = _0x1af18c && !!_0x3f8bdf.clearcoatRoughnessMap,
      _0x81a696 = _0x5000e4 && !!_0x3f8bdf.iridescenceMap,
      _0x2f27f1 = _0x5000e4 && !!_0x3f8bdf.iridescenceThicknessMap,
      _0x5d139d = _0x11762f && !!_0x3f8bdf.sheenColorMap,
      _0x2b3ba0 = _0x11762f && !!_0x3f8bdf.sheenRoughnessMap,
      _0x4c6048 = !!_0x3f8bdf.specularMap,
      _0x525a58 = !!_0x3f8bdf.specularColorMap,
      _0x55792c = !!_0x3f8bdf.specularIntensityMap,
      _0x66a147 = _0x4a1dd9 && !!_0x3f8bdf.transmissionMap,
      _0x139da0 = _0x4a1dd9 && !!_0x3f8bdf.thicknessMap,
      _0x93cafb = !!_0x3f8bdf.gradientMap,
      _0x26da8e = !!_0x3f8bdf.alphaMap,
      _0x32963d = _0x3f8bdf.alphaTest > 0,
      _0xd456a7 = !!_0x3f8bdf.alphaHash,
      _0x523783 = !!_0x3f8bdf.extensions;
    let _0x253a39 = NoToneMapping;
    _0x3f8bdf.toneMapped &&
      (_0x328924 === null || _0x328924.isXRRenderTarget === true) &&
      (_0x253a39 = _0x13ecab.toneMapping);
    const _0x4a0267 = {
      shaderID: _0x107724,
      shaderType: _0x3f8bdf.type,
      shaderName: _0x3f8bdf.name,
      vertexShader: _0x391155,
      fragmentShader: _0x12914b,
      defines: _0x3f8bdf.defines,
      customVertexShaderID: _0x55e423,
      customFragmentShaderID: _0xb97b8f,
      isRawShaderMaterial: _0x3f8bdf.isRawShaderMaterial === true,
      glslVersion: _0x3f8bdf.glslVersion,
      precision: _0x1f219c,
      batching: _0x34d508,
      batchingColor: _0x34d508 && _0x41fe71._colorsTexture !== null,
      instancing: _0x407866,
      instancingColor: _0x407866 && _0x41fe71.instanceColor !== null,
      instancingMorph: _0x407866 && _0x41fe71.morphTexture !== null,
      supportsVertexTextures: _0xacab8b,
      outputColorSpace:
        _0x328924 === null
          ? _0x13ecab.outputColorSpace
          : _0x328924.isXRRenderTarget === true
            ? _0x328924.texture.colorSpace
            : LinearSRGBColorSpace,
      alphaToCoverage: !!_0x3f8bdf.alphaToCoverage,
      map: _0x51db59,
      matcap: _0x2cc81e,
      envMap: _0x341919,
      envMapMode: _0x341919 && _0x3a31f2.mapping,
      envMapCubeUVHeight: _0x1ec56d,
      aoMap: _0x1eb869,
      lightMap: _0x40a744,
      bumpMap: _0x25b5ee,
      normalMap: _0x343107,
      displacementMap: _0xacab8b && _0x3df375,
      emissiveMap: _0x4cbc17,
      normalMapObjectSpace: _0x343107 && _0x3f8bdf.normalMapType === ObjectSpaceNormalMap,
      normalMapTangentSpace: _0x343107 && _0x3f8bdf.normalMapType === TangentSpaceNormalMap,
      metalnessMap: _0x3e6f92,
      roughnessMap: _0x409f84,
      anisotropy: _0x1ed0c2,
      anisotropyMap: _0x35ee8b,
      clearcoat: _0x1af18c,
      clearcoatMap: _0x240c96,
      clearcoatNormalMap: _0x8abbce,
      clearcoatRoughnessMap: _0x200e78,
      dispersion: _0x1f74b8,
      iridescence: _0x5000e4,
      iridescenceMap: _0x81a696,
      iridescenceThicknessMap: _0x2f27f1,
      sheen: _0x11762f,
      sheenColorMap: _0x5d139d,
      sheenRoughnessMap: _0x2b3ba0,
      specularMap: _0x4c6048,
      specularColorMap: _0x525a58,
      specularIntensityMap: _0x55792c,
      transmission: _0x4a1dd9,
      transmissionMap: _0x66a147,
      thicknessMap: _0x139da0,
      gradientMap: _0x93cafb,
      opaque:
        _0x3f8bdf.transparent === false &&
        _0x3f8bdf.blending === NormalBlending &&
        _0x3f8bdf.alphaToCoverage === false,
      alphaMap: _0x26da8e,
      alphaTest: _0x32963d,
      alphaHash: _0xd456a7,
      combine: _0x3f8bdf.combine,
      mapUv: _0x51db59 && _0x110951(_0x3f8bdf.map.channel),
      aoMapUv: _0x1eb869 && _0x110951(_0x3f8bdf.aoMap.channel),
      lightMapUv: _0x40a744 && _0x110951(_0x3f8bdf.lightMap.channel),
      bumpMapUv: _0x25b5ee && _0x110951(_0x3f8bdf.bumpMap.channel),
      normalMapUv: _0x343107 && _0x110951(_0x3f8bdf.normalMap.channel),
      displacementMapUv: _0x3df375 && _0x110951(_0x3f8bdf.displacementMap.channel),
      emissiveMapUv: _0x4cbc17 && _0x110951(_0x3f8bdf.emissiveMap.channel),
      metalnessMapUv: _0x3e6f92 && _0x110951(_0x3f8bdf.metalnessMap.channel),
      roughnessMapUv: _0x409f84 && _0x110951(_0x3f8bdf.roughnessMap.channel),
      anisotropyMapUv: _0x35ee8b && _0x110951(_0x3f8bdf.anisotropyMap.channel),
      clearcoatMapUv: _0x240c96 && _0x110951(_0x3f8bdf.clearcoatMap.channel),
      clearcoatNormalMapUv: _0x8abbce && _0x110951(_0x3f8bdf.clearcoatNormalMap.channel),
      clearcoatRoughnessMapUv: _0x200e78 && _0x110951(_0x3f8bdf.clearcoatRoughnessMap.channel),
      iridescenceMapUv: _0x81a696 && _0x110951(_0x3f8bdf.iridescenceMap.channel),
      iridescenceThicknessMapUv: _0x2f27f1 && _0x110951(_0x3f8bdf.iridescenceThicknessMap.channel),
      sheenColorMapUv: _0x5d139d && _0x110951(_0x3f8bdf.sheenColorMap.channel),
      sheenRoughnessMapUv: _0x2b3ba0 && _0x110951(_0x3f8bdf.sheenRoughnessMap.channel),
      specularMapUv: _0x4c6048 && _0x110951(_0x3f8bdf.specularMap.channel),
      specularColorMapUv: _0x525a58 && _0x110951(_0x3f8bdf.specularColorMap.channel),
      specularIntensityMapUv: _0x55792c && _0x110951(_0x3f8bdf.specularIntensityMap.channel),
      transmissionMapUv: _0x66a147 && _0x110951(_0x3f8bdf.transmissionMap.channel),
      thicknessMapUv: _0x139da0 && _0x110951(_0x3f8bdf.thicknessMap.channel),
      alphaMapUv: _0x26da8e && _0x110951(_0x3f8bdf.alphaMap.channel),
      vertexTangents: !!_0x280cc4.attributes.tangent && (_0x343107 || _0x1ed0c2),
      vertexColors: _0x3f8bdf.vertexColors,
      vertexAlphas:
        _0x3f8bdf.vertexColors === true &&
        !!_0x280cc4.attributes.color &&
        _0x280cc4.attributes.color.itemSize === 4,
      pointsUvs: _0x41fe71.isPoints === true && !!_0x280cc4.attributes.uv && (_0x51db59 || _0x26da8e),
      fog: !!_0x52b3fa,
      useFog: _0x3f8bdf.fog === true,
      fogExp2: !!_0x52b3fa && _0x52b3fa.isFogExp2,
      flatShading: _0x3f8bdf.flatShading === true && _0x3f8bdf.wireframe === false,
      sizeAttenuation: _0x3f8bdf.sizeAttenuation === true,
      logarithmicDepthBuffer: _0xea4185,
      reversedDepthBuffer: _0x530191,
      skinning: _0x41fe71.isSkinnedMesh === true,
      morphTargets: _0x280cc4.morphAttributes.position !== undefined,
      morphNormals: _0x280cc4.morphAttributes.normal !== undefined,
      morphColors: _0x280cc4.morphAttributes.color !== undefined,
      morphTargetsCount: _0x510286,
      morphTextureStride: _0x1867ac,
      numDirLights: _0xe22441.directional.length,
      numPointLights: _0xe22441.point.length,
      numSpotLights: _0xe22441.spot.length,
      numSpotLightMaps: _0xe22441.spotLightMap.length,
      numRectAreaLights: _0xe22441.rectArea.length,
      numHemiLights: _0xe22441.hemi.length,
      numDirLightShadows: _0xe22441.directionalShadowMap.length,
      numPointLightShadows: _0xe22441.pointShadowMap.length,
      numSpotLightShadows: _0xe22441.spotShadowMap.length,
      numSpotLightShadowsWithMaps: _0xe22441.numSpotLightShadowsWithMaps,
      numLightProbes: _0xe22441.numLightProbes,
      numClippingPlanes: _0x8ef3aa.numPlanes,
      numClipIntersection: _0x8ef3aa.numIntersection,
      dithering: _0x3f8bdf.dithering,
      shadowMapEnabled: _0x13ecab.shadowMap.enabled && _0x3cfea4.length > 0,
      shadowMapType: _0x13ecab.shadowMap.type,
      toneMapping: _0x253a39,
      decodeVideoTexture:
        _0x51db59 &&
        _0x3f8bdf.map.isVideoTexture === true &&
        ColorManagement.getTransfer(_0x3f8bdf.map.colorSpace) === SRGBTransfer,
      decodeVideoTextureEmissive:
        _0x4cbc17 &&
        _0x3f8bdf.emissiveMap.isVideoTexture === true &&
        ColorManagement.getTransfer(_0x3f8bdf.emissiveMap.colorSpace) === SRGBTransfer,
      premultipliedAlpha: _0x3f8bdf.premultipliedAlpha,
      doubleSided: _0x3f8bdf.side === DoubleSide,
      flipSided: _0x3f8bdf.side === BackSide,
      useDepthPacking: _0x3f8bdf.depthPacking >= 0,
      depthPacking: _0x3f8bdf.depthPacking || 0,
      index0AttributeName: _0x3f8bdf.index0AttributeName,
      extensionClipCullDistance:
        _0x523783 &&
        _0x3f8bdf.extensions.clipCullDistance === true &&
        _0x32b0d5.has('WEBGL_clip_cull_distance'),
      extensionMultiDraw:
        ((_0x523783 && _0x3f8bdf.extensions.multiDraw === true) || _0x34d508) &&
        _0x32b0d5.has('WEBGL_multi_draw'),
      rendererExtensionParallelShaderCompile: _0x32b0d5.has('KHR_parallel_shader_compile'),
      customProgramCacheKey: _0x3f8bdf.customProgramCacheKey(),
    };
    return (
      (_0x4a0267.vertexUv1s = _0x2766ca.has(1)),
      (_0x4a0267.vertexUv2s = _0x2766ca.has(2)),
      (_0x4a0267.vertexUv3s = _0x2766ca.has(3)),
      _0x2766ca.clear(),
      _0x4a0267
    );
  }
  function _0x2357cf(_0x4323d1) {
    const _0x44afd0 = [];
    _0x4323d1.shaderID
      ? _0x44afd0.push(_0x4323d1.shaderID)
      : (_0x44afd0.push(_0x4323d1.customVertexShaderID), _0x44afd0.push(_0x4323d1.customFragmentShaderID));
    if (_0x4323d1.defines !== undefined)
      for (const _0x201dc3 in _0x4323d1.defines) {
        (_0x44afd0.push(_0x201dc3), _0x44afd0.push(_0x4323d1.defines[_0x201dc3]));
      }
    return (
      _0x4323d1.isRawShaderMaterial === false &&
        (_0x1903d0(_0x44afd0, _0x4323d1),
        _0x1f35c4(_0x44afd0, _0x4323d1),
        _0x44afd0.push(_0x13ecab.outputColorSpace)),
      _0x44afd0.push(_0x4323d1.customProgramCacheKey),
      _0x44afd0.join()
    );
  }
  function _0x1903d0(_0xef12a7, _0x14d3a4) {
    (_0xef12a7.push(_0x14d3a4.precision),
      _0xef12a7.push(_0x14d3a4.outputColorSpace),
      _0xef12a7.push(_0x14d3a4.envMapMode),
      _0xef12a7.push(_0x14d3a4.envMapCubeUVHeight),
      _0xef12a7.push(_0x14d3a4.mapUv),
      _0xef12a7.push(_0x14d3a4.alphaMapUv),
      _0xef12a7.push(_0x14d3a4.lightMapUv),
      _0xef12a7.push(_0x14d3a4.aoMapUv),
      _0xef12a7.push(_0x14d3a4.bumpMapUv),
      _0xef12a7.push(_0x14d3a4.normalMapUv),
      _0xef12a7.push(_0x14d3a4.displacementMapUv),
      _0xef12a7.push(_0x14d3a4.emissiveMapUv),
      _0xef12a7.push(_0x14d3a4.metalnessMapUv),
      _0xef12a7.push(_0x14d3a4.roughnessMapUv),
      _0xef12a7.push(_0x14d3a4.anisotropyMapUv),
      _0xef12a7.push(_0x14d3a4.clearcoatMapUv),
      _0xef12a7.push(_0x14d3a4.clearcoatNormalMapUv),
      _0xef12a7.push(_0x14d3a4.clearcoatRoughnessMapUv),
      _0xef12a7.push(_0x14d3a4.iridescenceMapUv),
      _0xef12a7.push(_0x14d3a4.iridescenceThicknessMapUv),
      _0xef12a7.push(_0x14d3a4.sheenColorMapUv),
      _0xef12a7.push(_0x14d3a4.sheenRoughnessMapUv),
      _0xef12a7.push(_0x14d3a4.specularMapUv),
      _0xef12a7.push(_0x14d3a4.specularColorMapUv),
      _0xef12a7.push(_0x14d3a4.specularIntensityMapUv),
      _0xef12a7.push(_0x14d3a4.transmissionMapUv),
      _0xef12a7.push(_0x14d3a4.thicknessMapUv),
      _0xef12a7.push(_0x14d3a4.combine),
      _0xef12a7.push(_0x14d3a4.fogExp2),
      _0xef12a7.push(_0x14d3a4.sizeAttenuation),
      _0xef12a7.push(_0x14d3a4.morphTargetsCount),
      _0xef12a7.push(_0x14d3a4.morphAttributeCount),
      _0xef12a7.push(_0x14d3a4.numDirLights),
      _0xef12a7.push(_0x14d3a4.numPointLights),
      _0xef12a7.push(_0x14d3a4.numSpotLights),
      _0xef12a7.push(_0x14d3a4.numSpotLightMaps),
      _0xef12a7.push(_0x14d3a4.numHemiLights),
      _0xef12a7.push(_0x14d3a4.numRectAreaLights),
      _0xef12a7.push(_0x14d3a4.numDirLightShadows),
      _0xef12a7.push(_0x14d3a4.numPointLightShadows),
      _0xef12a7.push(_0x14d3a4.numSpotLightShadows),
      _0xef12a7.push(_0x14d3a4.numSpotLightShadowsWithMaps),
      _0xef12a7.push(_0x14d3a4.numLightProbes),
      _0xef12a7.push(_0x14d3a4.shadowMapType),
      _0xef12a7.push(_0x14d3a4.toneMapping),
      _0xef12a7.push(_0x14d3a4.numClippingPlanes),
      _0xef12a7.push(_0x14d3a4.numClipIntersection),
      _0xef12a7.push(_0x14d3a4.depthPacking));
  }
  function _0x1f35c4(_0x2f0356, _0x1539f6) {
    _0x49d7c4.disableAll();
    if (_0x1539f6.supportsVertexTextures) _0x49d7c4.enable(0);
    if (_0x1539f6.instancing) _0x49d7c4.enable(1);
    if (_0x1539f6.instancingColor) _0x49d7c4.enable(2);
    if (_0x1539f6.instancingMorph) _0x49d7c4.enable(3);
    if (_0x1539f6.matcap) _0x49d7c4.enable(4);
    if (_0x1539f6.envMap) _0x49d7c4.enable(5);
    if (_0x1539f6.normalMapObjectSpace) _0x49d7c4.enable(6);
    if (_0x1539f6.normalMapTangentSpace) _0x49d7c4.enable(7);
    if (_0x1539f6.clearcoat) _0x49d7c4.enable(8);
    if (_0x1539f6.iridescence) _0x49d7c4.enable(9);
    if (_0x1539f6.alphaTest) _0x49d7c4.enable(10);
    if (_0x1539f6.vertexColors) _0x49d7c4.enable(11);
    if (_0x1539f6.vertexAlphas) _0x49d7c4.enable(12);
    if (_0x1539f6.vertexUv1s) _0x49d7c4.enable(13);
    if (_0x1539f6.vertexUv2s) _0x49d7c4.enable(14);
    if (_0x1539f6.vertexUv3s) _0x49d7c4.enable(15);
    if (_0x1539f6.vertexTangents) _0x49d7c4.enable(16);
    if (_0x1539f6.anisotropy) _0x49d7c4.enable(17);
    if (_0x1539f6.alphaHash) _0x49d7c4.enable(18);
    if (_0x1539f6.batching) _0x49d7c4.enable(19);
    if (_0x1539f6.dispersion) _0x49d7c4.enable(20);
    if (_0x1539f6.batchingColor) _0x49d7c4.enable(21);
    if (_0x1539f6.gradientMap) _0x49d7c4.enable(22);
    (_0x2f0356.push(_0x49d7c4.mask), _0x49d7c4.disableAll());
    if (_0x1539f6.fog) _0x49d7c4.enable(0);
    if (_0x1539f6.useFog) _0x49d7c4.enable(1);
    if (_0x1539f6.flatShading) _0x49d7c4.enable(2);
    if (_0x1539f6.logarithmicDepthBuffer) _0x49d7c4.enable(3);
    if (_0x1539f6.reversedDepthBuffer) _0x49d7c4.enable(4);
    if (_0x1539f6.skinning) _0x49d7c4.enable(5);
    if (_0x1539f6.morphTargets) _0x49d7c4.enable(6);
    if (_0x1539f6.morphNormals) _0x49d7c4.enable(7);
    if (_0x1539f6.morphColors) _0x49d7c4.enable(8);
    if (_0x1539f6.premultipliedAlpha) _0x49d7c4.enable(9);
    if (_0x1539f6.shadowMapEnabled) _0x49d7c4.enable(10);
    if (_0x1539f6.doubleSided) _0x49d7c4.enable(11);
    if (_0x1539f6.flipSided) _0x49d7c4.enable(12);
    if (_0x1539f6.useDepthPacking) _0x49d7c4.enable(13);
    if (_0x1539f6.dithering) _0x49d7c4.enable(14);
    if (_0x1539f6.transmission) _0x49d7c4.enable(15);
    if (_0x1539f6.sheen) _0x49d7c4.enable(16);
    if (_0x1539f6.opaque) _0x49d7c4.enable(17);
    if (_0x1539f6.pointsUvs) _0x49d7c4.enable(18);
    if (_0x1539f6.decodeVideoTexture) _0x49d7c4.enable(19);
    if (_0x1539f6.decodeVideoTextureEmissive) _0x49d7c4.enable(20);
    if (_0x1539f6.alphaToCoverage) _0x49d7c4.enable(21);
    _0x2f0356.push(_0x49d7c4.mask);
  }
  function _0x1c6ecb(_0x51bcb8) {
    const _0x533abc = _0x14f0bd[_0x51bcb8.type];
    let _0x268057;
    if (_0x533abc) {
      const _0x445072 = ShaderLib[_0x533abc];
      _0x268057 = UniformsUtils.clone(_0x445072.uniforms);
    } else _0x268057 = _0x51bcb8.uniforms;
    return _0x268057;
  }
  function _0x195353(_0x415f59, _0x33cbb6) {
    let _0x2c3724;
    for (let _0x48d83b = 0, _0x17c7d4 = _0x53bb97.length; _0x48d83b < _0x17c7d4; _0x48d83b++) {
      const _0x1f792c = _0x53bb97[_0x48d83b];
      if (_0x1f792c.cacheKey === _0x33cbb6) {
        ((_0x2c3724 = _0x1f792c), ++_0x2c3724.usedTimes);
        break;
      }
    }
    return (
      _0x2c3724 === undefined &&
        ((_0x2c3724 = new WebGLProgram(_0x13ecab, _0x33cbb6, _0x415f59, _0x389b65)),
        _0x53bb97.push(_0x2c3724)),
      _0x2c3724
    );
  }
  function _0x114bcb(_0x19d97f) {
    if (--_0x19d97f.usedTimes === 0) {
      const _0x51c458 = _0x53bb97.indexOf(_0x19d97f);
      ((_0x53bb97[_0x51c458] = _0x53bb97[_0x53bb97.length - 1]), _0x53bb97.pop(), _0x19d97f.destroy());
    }
  }
  function _0x4cc9b8(_0x3ab2e9) {
    _0x204b53.remove(_0x3ab2e9);
  }
  function _0x1184b2() {
    _0x204b53.dispose();
  }
  return {
    getParameters: _0x1f3f2a,
    getProgramCacheKey: _0x2357cf,
    getUniforms: _0x1c6ecb,
    acquireProgram: _0x195353,
    releaseProgram: _0x114bcb,
    releaseShaderCache: _0x4cc9b8,
    programs: _0x53bb97,
    dispose: _0x1184b2,
  };
}
function WebGLProperties() {
  let _0x4dee6b = new WeakMap();
  function _0x51b093(_0x48d7c4) {
    return _0x4dee6b.has(_0x48d7c4);
  }
  function _0x1b8f2f(_0x27c496) {
    let _0x532ecb = _0x4dee6b.get(_0x27c496);
    return (_0x532ecb === undefined && ((_0x532ecb = {}), _0x4dee6b.set(_0x27c496, _0x532ecb)), _0x532ecb);
  }
  function _0x3e2730(_0x358bfb) {
    _0x4dee6b.delete(_0x358bfb);
  }
  function _0xfdbfd2(_0x1a7588, _0x4ffe10, _0x54f931) {
    _0x4dee6b.get(_0x1a7588)[_0x4ffe10] = _0x54f931;
  }
  function _0x2ceb7d() {
    _0x4dee6b = new WeakMap();
  }
  return { has: _0x51b093, get: _0x1b8f2f, remove: _0x3e2730, update: _0xfdbfd2, dispose: _0x2ceb7d };
}
function painterSortStable(_0x1ab3fb, _0x4d8e58) {
  if (_0x1ab3fb.groupOrder !== _0x4d8e58.groupOrder) return _0x1ab3fb.groupOrder - _0x4d8e58.groupOrder;
  else {
    if (_0x1ab3fb.renderOrder !== _0x4d8e58.renderOrder) return _0x1ab3fb.renderOrder - _0x4d8e58.renderOrder;
    else {
      if (_0x1ab3fb.material.id !== _0x4d8e58.material.id)
        return _0x1ab3fb.material.id - _0x4d8e58.material.id;
      else return _0x1ab3fb.z !== _0x4d8e58.z ? _0x1ab3fb.z - _0x4d8e58.z : _0x1ab3fb.id - _0x4d8e58.id;
    }
  }
}
function reversePainterSortStable(_0x14ee95, _0x468884) {
  if (_0x14ee95.groupOrder !== _0x468884.groupOrder) return _0x14ee95.groupOrder - _0x468884.groupOrder;
  else {
    if (_0x14ee95.renderOrder !== _0x468884.renderOrder) return _0x14ee95.renderOrder - _0x468884.renderOrder;
    else return _0x14ee95.z !== _0x468884.z ? _0x468884.z - _0x14ee95.z : _0x14ee95.id - _0x468884.id;
  }
}
function WebGLRenderList() {
  const _0x24e02d = [];
  let _0x505318 = 0;
  const _0x14a952 = [],
    _0x2215f6 = [],
    _0x7d321a = [];
  function _0x35296d() {
    ((_0x505318 = 0), (_0x14a952.length = 0), (_0x2215f6.length = 0), (_0x7d321a.length = 0));
  }
  function _0x34c138(_0x17f7a2, _0x29af11, _0x378a9f, _0x4a0eee, _0x19275c, _0x4e45b6) {
    let _0x35e76e = _0x24e02d[_0x505318];
    return (
      _0x35e76e === undefined
        ? ((_0x35e76e = {
            id: _0x17f7a2.id,
            object: _0x17f7a2,
            geometry: _0x29af11,
            material: _0x378a9f,
            groupOrder: _0x4a0eee,
            renderOrder: _0x17f7a2.renderOrder,
            z: _0x19275c,
            group: _0x4e45b6,
          }),
          (_0x24e02d[_0x505318] = _0x35e76e))
        : ((_0x35e76e.id = _0x17f7a2.id),
          (_0x35e76e.object = _0x17f7a2),
          (_0x35e76e.geometry = _0x29af11),
          (_0x35e76e.material = _0x378a9f),
          (_0x35e76e.groupOrder = _0x4a0eee),
          (_0x35e76e.renderOrder = _0x17f7a2.renderOrder),
          (_0x35e76e.z = _0x19275c),
          (_0x35e76e.group = _0x4e45b6)),
      _0x505318++,
      _0x35e76e
    );
  }
  function _0x4a492(_0x137d9a, _0xc7925, _0x561be6, _0x52148c, _0x15ba77, _0x4d2e35) {
    const _0x4efb54 = _0x34c138(_0x137d9a, _0xc7925, _0x561be6, _0x52148c, _0x15ba77, _0x4d2e35);
    if (_0x561be6.transmission > 0) _0x2215f6.push(_0x4efb54);
    else _0x561be6.transparent === true ? _0x7d321a.push(_0x4efb54) : _0x14a952.push(_0x4efb54);
  }
  function _0x859c47(_0x259fa9, _0x4feb46, _0x3a79a5, _0x1855ac, _0x712527, _0x38346d) {
    const _0x305bc2 = _0x34c138(_0x259fa9, _0x4feb46, _0x3a79a5, _0x1855ac, _0x712527, _0x38346d);
    if (_0x3a79a5.transmission > 0) _0x2215f6.unshift(_0x305bc2);
    else _0x3a79a5.transparent === true ? _0x7d321a.unshift(_0x305bc2) : _0x14a952.unshift(_0x305bc2);
  }
  function _0x13d8b7(_0x445e74, _0x78b650) {
    if (_0x14a952.length > 1) _0x14a952.sort(_0x445e74 || painterSortStable);
    if (_0x2215f6.length > 1) _0x2215f6.sort(_0x78b650 || reversePainterSortStable);
    if (_0x7d321a.length > 1) _0x7d321a.sort(_0x78b650 || reversePainterSortStable);
  }
  function _0x21ea36() {
    for (let _0x285521 = _0x505318, _0x1450a0 = _0x24e02d.length; _0x285521 < _0x1450a0; _0x285521++) {
      const _0x4d0a82 = _0x24e02d[_0x285521];
      if (_0x4d0a82.id === null) break;
      ((_0x4d0a82.id = null),
        (_0x4d0a82.object = null),
        (_0x4d0a82.geometry = null),
        (_0x4d0a82.material = null),
        (_0x4d0a82.group = null));
    }
  }
  return {
    opaque: _0x14a952,
    transmissive: _0x2215f6,
    transparent: _0x7d321a,
    init: _0x35296d,
    push: _0x4a492,
    unshift: _0x859c47,
    finish: _0x21ea36,
    sort: _0x13d8b7,
  };
}
function WebGLRenderLists() {
  let _0x1a9387 = new WeakMap();
  function _0xa1cd5(_0x36522a, _0x1b200d) {
    const _0x234247 = _0x1a9387.get(_0x36522a);
    let _0x3e45ae;
    return (
      _0x234247 === undefined
        ? ((_0x3e45ae = new WebGLRenderList()), _0x1a9387.set(_0x36522a, [_0x3e45ae]))
        : _0x1b200d >= _0x234247.length
          ? ((_0x3e45ae = new WebGLRenderList()), _0x234247.push(_0x3e45ae))
          : (_0x3e45ae = _0x234247[_0x1b200d]),
      _0x3e45ae
    );
  }
  function _0x2c2f34() {
    _0x1a9387 = new WeakMap();
  }
  return { get: _0xa1cd5, dispose: _0x2c2f34 };
}
function UniformsCache() {
  const _0x382420 = {};
  return {
    get: function (_0x16ca82) {
      if (_0x382420[_0x16ca82.id] !== undefined) return _0x382420[_0x16ca82.id];
      let _0x8c660;
      switch (_0x16ca82.type) {
        case 'DirectionalLight':
          _0x8c660 = { direction: new Vector3(), color: new Color() };
          break;
        case 'SpotLight':
          _0x8c660 = {
            position: new Vector3(),
            direction: new Vector3(),
            color: new Color(),
            distance: 0,
            coneCos: 0,
            penumbraCos: 0,
            decay: 0,
          };
          break;
        case 'PointLight':
          _0x8c660 = { position: new Vector3(), color: new Color(), distance: 0, decay: 0 };
          break;
        case 'HemisphereLight':
          _0x8c660 = { direction: new Vector3(), skyColor: new Color(), groundColor: new Color() };
          break;
        case 'RectAreaLight':
          _0x8c660 = {
            color: new Color(),
            position: new Vector3(),
            halfWidth: new Vector3(),
            halfHeight: new Vector3(),
          };
          break;
      }
      return ((_0x382420[_0x16ca82.id] = _0x8c660), _0x8c660);
    },
  };
}
function ShadowUniformsCache() {
  const _0x11c132 = {};
  return {
    get: function (_0x3282ae) {
      if (_0x11c132[_0x3282ae.id] !== undefined) return _0x11c132[_0x3282ae.id];
      let _0x54a7ef;
      switch (_0x3282ae.type) {
        case 'DirectionalLight':
          _0x54a7ef = {
            shadowIntensity: 1,
            shadowBias: 0,
            shadowNormalBias: 0,
            shadowRadius: 1,
            shadowMapSize: new Vector2(),
          };
          break;
        case 'SpotLight':
          _0x54a7ef = {
            shadowIntensity: 1,
            shadowBias: 0,
            shadowNormalBias: 0,
            shadowRadius: 1,
            shadowMapSize: new Vector2(),
          };
          break;
        case 'PointLight':
          _0x54a7ef = {
            shadowIntensity: 1,
            shadowBias: 0,
            shadowNormalBias: 0,
            shadowRadius: 1,
            shadowMapSize: new Vector2(),
            shadowCameraNear: 1,
            shadowCameraFar: 0x3e8,
          };
          break;
      }
      return ((_0x11c132[_0x3282ae.id] = _0x54a7ef), _0x54a7ef);
    },
  };
}
let nextVersion = 0;
function shadowCastingAndTexturingLightsFirst(_0x2bbbc4, _0x4ce06e) {
  return (
    (_0x4ce06e.castShadow ? 2 : 0) -
    (_0x2bbbc4.castShadow ? 2 : 0) +
    (_0x4ce06e.map ? 1 : 0) -
    (_0x2bbbc4.map ? 1 : 0)
  );
}
function WebGLLights(_0x2014d8) {
  const _0x49b6f8 = new UniformsCache(),
    _0x118daa = ShadowUniformsCache(),
    _0x2acc58 = {
      version: 0,
      hash: {
        directionalLength: -1,
        pointLength: -1,
        spotLength: -1,
        rectAreaLength: -1,
        hemiLength: -1,
        numDirectionalShadows: -1,
        numPointShadows: -1,
        numSpotShadows: -1,
        numSpotMaps: -1,
        numLightProbes: -1,
      },
      ambient: [0, 0, 0],
      probe: [],
      directional: [],
      directionalShadow: [],
      directionalShadowMap: [],
      directionalShadowMatrix: [],
      spot: [],
      spotLightMap: [],
      spotShadow: [],
      spotShadowMap: [],
      spotLightMatrix: [],
      rectArea: [],
      rectAreaLTC1: null,
      rectAreaLTC2: null,
      point: [],
      pointShadow: [],
      pointShadowMap: [],
      pointShadowMatrix: [],
      hemi: [],
      numSpotLightShadowsWithMaps: 0,
      numLightProbes: 0,
    };
  for (let _0x283f5c = 0; _0x283f5c < 9; _0x283f5c++) _0x2acc58.probe.push(new Vector3());
  const _0x39700c = new Vector3(),
    _0x1e8739 = new Matrix4(),
    _0x5f3617 = new Matrix4();
  function _0x52f921(_0x89f99a) {
    let _0x10c8ad = 0,
      _0x206fa4 = 0,
      _0x255dfb = 0;
    for (let _0x43f449 = 0; _0x43f449 < 9; _0x43f449++) _0x2acc58.probe[_0x43f449].set(0, 0, 0);
    let _0xcec206 = 0,
      _0x17a3f7 = 0,
      _0x4e90b0 = 0,
      _0x27e928 = 0,
      _0x8f58e = 0,
      _0x234966 = 0,
      _0xb2123f = 0,
      _0x11e44b = 0,
      _0x3d3ad7 = 0,
      _0x2bfc11 = 0,
      _0x5ce01f = 0;
    _0x89f99a.sort(shadowCastingAndTexturingLightsFirst);
    for (let _0x31534e = 0, _0x5c7c69 = _0x89f99a.length; _0x31534e < _0x5c7c69; _0x31534e++) {
      const _0x1999f3 = _0x89f99a[_0x31534e],
        _0x322afa = _0x1999f3.color,
        _0x20fa6b = _0x1999f3.intensity,
        _0x117292 = _0x1999f3.distance,
        _0x2584e7 = _0x1999f3.shadow && _0x1999f3.shadow.map ? _0x1999f3.shadow.map.texture : null;
      if (_0x1999f3.isAmbientLight)
        ((_0x10c8ad += _0x322afa.r * _0x20fa6b),
          (_0x206fa4 += _0x322afa.g * _0x20fa6b),
          (_0x255dfb += _0x322afa.b * _0x20fa6b));
      else {
        if (_0x1999f3.isLightProbe) {
          for (let _0x367681 = 0; _0x367681 < 9; _0x367681++) {
            _0x2acc58.probe[_0x367681].addScaledVector(_0x1999f3.sh.coefficients[_0x367681], _0x20fa6b);
          }
          _0x5ce01f++;
        } else {
          if (_0x1999f3.isDirectionalLight) {
            const _0x404e9f = _0x49b6f8.get(_0x1999f3);
            _0x404e9f.color.copy(_0x1999f3.color).multiplyScalar(_0x1999f3.intensity);
            if (_0x1999f3.castShadow) {
              const _0x58b900 = _0x1999f3.shadow,
                _0x4002b5 = _0x118daa.get(_0x1999f3);
              ((_0x4002b5.shadowIntensity = _0x58b900.intensity),
                (_0x4002b5.shadowBias = _0x58b900.bias),
                (_0x4002b5.shadowNormalBias = _0x58b900.normalBias),
                (_0x4002b5.shadowRadius = _0x58b900.radius),
                (_0x4002b5.shadowMapSize = _0x58b900.mapSize),
                (_0x2acc58.directionalShadow[_0xcec206] = _0x4002b5),
                (_0x2acc58.directionalShadowMap[_0xcec206] = _0x2584e7),
                (_0x2acc58.directionalShadowMatrix[_0xcec206] = _0x1999f3.shadow.matrix),
                _0x234966++);
            }
            ((_0x2acc58.directional[_0xcec206] = _0x404e9f), _0xcec206++);
          } else {
            if (_0x1999f3.isSpotLight) {
              const _0x12a9b0 = _0x49b6f8.get(_0x1999f3);
              (_0x12a9b0.position.setFromMatrixPosition(_0x1999f3.matrixWorld),
                _0x12a9b0.color.copy(_0x322afa).multiplyScalar(_0x20fa6b),
                (_0x12a9b0.distance = _0x117292),
                (_0x12a9b0.coneCos = Math.cos(_0x1999f3.angle)),
                (_0x12a9b0.penumbraCos = Math.cos(_0x1999f3.angle * (1 - _0x1999f3.penumbra))),
                (_0x12a9b0.decay = _0x1999f3.decay),
                (_0x2acc58.spot[_0x4e90b0] = _0x12a9b0));
              const _0x1e8b1c = _0x1999f3.shadow;
              if (_0x1999f3.map) {
                ((_0x2acc58.spotLightMap[_0x3d3ad7] = _0x1999f3.map),
                  _0x3d3ad7++,
                  _0x1e8b1c.updateMatrices(_0x1999f3));
                if (_0x1999f3.castShadow) _0x2bfc11++;
              }
              _0x2acc58.spotLightMatrix[_0x4e90b0] = _0x1e8b1c.matrix;
              if (_0x1999f3.castShadow) {
                const _0x150d90 = _0x118daa.get(_0x1999f3);
                ((_0x150d90.shadowIntensity = _0x1e8b1c.intensity),
                  (_0x150d90.shadowBias = _0x1e8b1c.bias),
                  (_0x150d90.shadowNormalBias = _0x1e8b1c.normalBias),
                  (_0x150d90.shadowRadius = _0x1e8b1c.radius),
                  (_0x150d90.shadowMapSize = _0x1e8b1c.mapSize),
                  (_0x2acc58.spotShadow[_0x4e90b0] = _0x150d90),
                  (_0x2acc58.spotShadowMap[_0x4e90b0] = _0x2584e7),
                  _0x11e44b++);
              }
              _0x4e90b0++;
            } else {
              if (_0x1999f3.isRectAreaLight) {
                const _0x3cc8b7 = _0x49b6f8.get(_0x1999f3);
                (_0x3cc8b7.color.copy(_0x322afa).multiplyScalar(_0x20fa6b),
                  _0x3cc8b7.halfWidth.set(_0x1999f3.width * 0.5, 0, 0),
                  _0x3cc8b7.halfHeight.set(0, _0x1999f3.height * 0.5, 0),
                  (_0x2acc58.rectArea[_0x27e928] = _0x3cc8b7),
                  _0x27e928++);
              } else {
                if (_0x1999f3.isPointLight) {
                  const _0x1c8d91 = _0x49b6f8.get(_0x1999f3);
                  (_0x1c8d91.color.copy(_0x1999f3.color).multiplyScalar(_0x1999f3.intensity),
                    (_0x1c8d91.distance = _0x1999f3.distance),
                    (_0x1c8d91.decay = _0x1999f3.decay));
                  if (_0x1999f3.castShadow) {
                    const _0x4a0c84 = _0x1999f3.shadow,
                      _0xea6edd = _0x118daa.get(_0x1999f3);
                    ((_0xea6edd.shadowIntensity = _0x4a0c84.intensity),
                      (_0xea6edd.shadowBias = _0x4a0c84.bias),
                      (_0xea6edd.shadowNormalBias = _0x4a0c84.normalBias),
                      (_0xea6edd.shadowRadius = _0x4a0c84.radius),
                      (_0xea6edd.shadowMapSize = _0x4a0c84.mapSize),
                      (_0xea6edd.shadowCameraNear = _0x4a0c84.camera.near),
                      (_0xea6edd.shadowCameraFar = _0x4a0c84.camera.far),
                      (_0x2acc58.pointShadow[_0x17a3f7] = _0xea6edd),
                      (_0x2acc58.pointShadowMap[_0x17a3f7] = _0x2584e7),
                      (_0x2acc58.pointShadowMatrix[_0x17a3f7] = _0x1999f3.shadow.matrix),
                      _0xb2123f++);
                  }
                  ((_0x2acc58.point[_0x17a3f7] = _0x1c8d91), _0x17a3f7++);
                } else {
                  if (_0x1999f3.isHemisphereLight) {
                    const _0x25eb71 = _0x49b6f8.get(_0x1999f3);
                    (_0x25eb71.skyColor.copy(_0x1999f3.color).multiplyScalar(_0x20fa6b),
                      _0x25eb71.groundColor.copy(_0x1999f3.groundColor).multiplyScalar(_0x20fa6b),
                      (_0x2acc58.hemi[_0x8f58e] = _0x25eb71),
                      _0x8f58e++);
                  }
                }
              }
            }
          }
        }
      }
    }
    _0x27e928 > 0 &&
      (_0x2014d8.has('OES_texture_float_linear') === true
        ? ((_0x2acc58.rectAreaLTC1 = UniformsLib.LTC_FLOAT_1),
          (_0x2acc58.rectAreaLTC2 = UniformsLib.LTC_FLOAT_2))
        : ((_0x2acc58.rectAreaLTC1 = UniformsLib.LTC_HALF_1),
          (_0x2acc58.rectAreaLTC2 = UniformsLib.LTC_HALF_2)));
    ((_0x2acc58.ambient[0] = _0x10c8ad),
      (_0x2acc58.ambient[1] = _0x206fa4),
      (_0x2acc58.ambient[2] = _0x255dfb));
    const _0x1934a7 = _0x2acc58.hash;
    (_0x1934a7.directionalLength !== _0xcec206 ||
      _0x1934a7.pointLength !== _0x17a3f7 ||
      _0x1934a7.spotLength !== _0x4e90b0 ||
      _0x1934a7.rectAreaLength !== _0x27e928 ||
      _0x1934a7.hemiLength !== _0x8f58e ||
      _0x1934a7.numDirectionalShadows !== _0x234966 ||
      _0x1934a7.numPointShadows !== _0xb2123f ||
      _0x1934a7.numSpotShadows !== _0x11e44b ||
      _0x1934a7.numSpotMaps !== _0x3d3ad7 ||
      _0x1934a7.numLightProbes !== _0x5ce01f) &&
      ((_0x2acc58.directional.length = _0xcec206),
      (_0x2acc58.spot.length = _0x4e90b0),
      (_0x2acc58.rectArea.length = _0x27e928),
      (_0x2acc58.point.length = _0x17a3f7),
      (_0x2acc58.hemi.length = _0x8f58e),
      (_0x2acc58.directionalShadow.length = _0x234966),
      (_0x2acc58.directionalShadowMap.length = _0x234966),
      (_0x2acc58.pointShadow.length = _0xb2123f),
      (_0x2acc58.pointShadowMap.length = _0xb2123f),
      (_0x2acc58.spotShadow.length = _0x11e44b),
      (_0x2acc58.spotShadowMap.length = _0x11e44b),
      (_0x2acc58.directionalShadowMatrix.length = _0x234966),
      (_0x2acc58.pointShadowMatrix.length = _0xb2123f),
      (_0x2acc58.spotLightMatrix.length = _0x11e44b + _0x3d3ad7 - _0x2bfc11),
      (_0x2acc58.spotLightMap.length = _0x3d3ad7),
      (_0x2acc58.numSpotLightShadowsWithMaps = _0x2bfc11),
      (_0x2acc58.numLightProbes = _0x5ce01f),
      (_0x1934a7.directionalLength = _0xcec206),
      (_0x1934a7.pointLength = _0x17a3f7),
      (_0x1934a7.spotLength = _0x4e90b0),
      (_0x1934a7.rectAreaLength = _0x27e928),
      (_0x1934a7.hemiLength = _0x8f58e),
      (_0x1934a7.numDirectionalShadows = _0x234966),
      (_0x1934a7.numPointShadows = _0xb2123f),
      (_0x1934a7.numSpotShadows = _0x11e44b),
      (_0x1934a7.numSpotMaps = _0x3d3ad7),
      (_0x1934a7.numLightProbes = _0x5ce01f),
      (_0x2acc58.version = nextVersion++));
  }
  function _0x51da2f(_0x16cbdf, _0xf49f23) {
    let _0x5af263 = 0,
      _0x4e0282 = 0,
      _0xe1fc9e = 0,
      _0x42f1e4 = 0,
      _0x5e8ca6 = 0;
    const _0x38c898 = _0xf49f23.matrixWorldInverse;
    for (let _0x24a9cd = 0, _0x2012a4 = _0x16cbdf.length; _0x24a9cd < _0x2012a4; _0x24a9cd++) {
      const _0x2c80ca = _0x16cbdf[_0x24a9cd];
      if (_0x2c80ca.isDirectionalLight) {
        const _0x1dfe9b = _0x2acc58.directional[_0x5af263];
        (_0x1dfe9b.direction.setFromMatrixPosition(_0x2c80ca.matrixWorld),
          _0x39700c.setFromMatrixPosition(_0x2c80ca.target.matrixWorld),
          _0x1dfe9b.direction.sub(_0x39700c),
          _0x1dfe9b.direction.transformDirection(_0x38c898),
          _0x5af263++);
      } else {
        if (_0x2c80ca.isSpotLight) {
          const _0x317735 = _0x2acc58.spot[_0xe1fc9e];
          (_0x317735.position.setFromMatrixPosition(_0x2c80ca.matrixWorld),
            _0x317735.position.applyMatrix4(_0x38c898),
            _0x317735.direction.setFromMatrixPosition(_0x2c80ca.matrixWorld),
            _0x39700c.setFromMatrixPosition(_0x2c80ca.target.matrixWorld),
            _0x317735.direction.sub(_0x39700c),
            _0x317735.direction.transformDirection(_0x38c898),
            _0xe1fc9e++);
        } else {
          if (_0x2c80ca.isRectAreaLight) {
            const _0x6035b = _0x2acc58.rectArea[_0x42f1e4];
            (_0x6035b.position.setFromMatrixPosition(_0x2c80ca.matrixWorld),
              _0x6035b.position.applyMatrix4(_0x38c898),
              _0x5f3617.identity(),
              _0x1e8739.copy(_0x2c80ca.matrixWorld),
              _0x1e8739.premultiply(_0x38c898),
              _0x5f3617.extractRotation(_0x1e8739),
              _0x6035b.halfWidth.set(_0x2c80ca.width * 0.5, 0, 0),
              _0x6035b.halfHeight.set(0, _0x2c80ca.height * 0.5, 0),
              _0x6035b.halfWidth.applyMatrix4(_0x5f3617),
              _0x6035b.halfHeight.applyMatrix4(_0x5f3617),
              _0x42f1e4++);
          } else {
            if (_0x2c80ca.isPointLight) {
              const _0x5ce56f = _0x2acc58.point[_0x4e0282];
              (_0x5ce56f.position.setFromMatrixPosition(_0x2c80ca.matrixWorld),
                _0x5ce56f.position.applyMatrix4(_0x38c898),
                _0x4e0282++);
            } else {
              if (_0x2c80ca.isHemisphereLight) {
                const _0x1b27cf = _0x2acc58.hemi[_0x5e8ca6];
                (_0x1b27cf.direction.setFromMatrixPosition(_0x2c80ca.matrixWorld),
                  _0x1b27cf.direction.transformDirection(_0x38c898),
                  _0x5e8ca6++);
              }
            }
          }
        }
      }
    }
  }
  return { setup: _0x52f921, setupView: _0x51da2f, state: _0x2acc58 };
}
function WebGLRenderState(_0x55dc1f) {
  const _0x50081c = new WebGLLights(_0x55dc1f),
    _0x17e75e = [],
    _0x18a0fe = [];
  function _0x43bb0f(_0x44244e) {
    ((_0x329c90.camera = _0x44244e), (_0x17e75e.length = 0), (_0x18a0fe.length = 0));
  }
  function _0xc6fc15(_0x414096) {
    _0x17e75e.push(_0x414096);
  }
  function _0x28b7f7(_0x3ec4da) {
    _0x18a0fe.push(_0x3ec4da);
  }
  function _0x2843e2() {
    _0x50081c.setup(_0x17e75e);
  }
  function _0x46952e(_0x1b4044) {
    _0x50081c.setupView(_0x17e75e, _0x1b4044);
  }
  const _0x329c90 = {
    lightsArray: _0x17e75e,
    shadowsArray: _0x18a0fe,
    camera: null,
    lights: _0x50081c,
    transmissionRenderTarget: {},
  };
  return {
    init: _0x43bb0f,
    state: _0x329c90,
    setupLights: _0x2843e2,
    setupLightsView: _0x46952e,
    pushLight: _0xc6fc15,
    pushShadow: _0x28b7f7,
  };
}
function WebGLRenderStates(_0x7d6e4c) {
  let _0x4975f7 = new WeakMap();
  function _0x5b5f18(_0x3effe0, _0x23c160 = 0) {
    const _0x15c6a2 = _0x4975f7.get(_0x3effe0);
    let _0x332337;
    return (
      _0x15c6a2 === undefined
        ? ((_0x332337 = new WebGLRenderState(_0x7d6e4c)), _0x4975f7.set(_0x3effe0, [_0x332337]))
        : _0x23c160 >= _0x15c6a2.length
          ? ((_0x332337 = new WebGLRenderState(_0x7d6e4c)), _0x15c6a2.push(_0x332337))
          : (_0x332337 = _0x15c6a2[_0x23c160]),
      _0x332337
    );
  }
  function _0x4979b8() {
    _0x4975f7 = new WeakMap();
  }
  return { get: _0x5b5f18, dispose: _0x4979b8 };
}
const vertex = 'void main() {\n\tgl_Position = vec4( position, 1.0 );\n}',
  fragment =
    'uniform sampler2D shadow_pass;\nuniform vec2 resolution;\nuniform float radius;\n#include <packing>\nvoid main() {\n\tconst float samples = float( VSM_SAMPLES );\n\tfloat mean = 0.0;\n\tfloat squared_mean = 0.0;\n\tfloat uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );\n\tfloat uvStart = samples <= 1.0 ? 0.0 : - 1.0;\n\tfor ( float i = 0.0; i < samples; i ++ ) {\n\t\tfloat uvOffset = uvStart + i * uvStride;\n\t\t#ifdef HORIZONTAL_PASS\n\t\t\tvec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );\n\t\t\tmean += distribution.x;\n\t\t\tsquared_mean += distribution.y * distribution.y + distribution.x * distribution.x;\n\t\t#else\n\t\t\tfloat depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );\n\t\t\tmean += depth;\n\t\t\tsquared_mean += depth * depth;\n\t\t#endif\n\t}\n\tmean = mean / samples;\n\tsquared_mean = squared_mean / samples;\n\tfloat std_dev = sqrt( squared_mean - mean * mean );\n\tgl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );\n}';
function WebGLShadowMap(_0x4d6bed, _0x387be3, _0x873bf7) {
  let _0x2a8292 = new Frustum();
  const _0x58ec33 = new Vector2(),
    _0x529644 = new Vector2(),
    _0x1ee34f = new Vector4(),
    _0x6d8632 = new MeshDepthMaterial({ depthPacking: RGBADepthPacking }),
    _0x48652e = new MeshDistanceMaterial(),
    _0x3791f4 = {},
    _0x2bbe74 = _0x873bf7.maxTextureSize,
    _0x12d07d = { [FrontSide]: BackSide, [BackSide]: FrontSide, [DoubleSide]: DoubleSide },
    _0x2d6190 = new ShaderMaterial({
      defines: { VSM_SAMPLES: 8 },
      uniforms: { shadow_pass: { value: null }, resolution: { value: new Vector2() }, radius: { value: 4 } },
      vertexShader: vertex,
      fragmentShader: fragment,
    }),
    _0x5d98d5 = _0x2d6190.clone();
  _0x5d98d5.defines.HORIZONTAL_PASS = 1;
  const _0x358f62 = new BufferGeometry();
  _0x358f62.setAttribute(
    'position',
    new BufferAttribute(new Float32Array([-1, -1, 0.5, 3, -1, 0.5, -1, 3, 0.5]), 3),
  );
  const _0x19a30a = new Mesh(_0x358f62, _0x2d6190),
    _0x5d769d = this;
  ((this.enabled = false), (this.autoUpdate = true), (this.needsUpdate = false), (this.type = PCFShadowMap));
  let _0x22cb68 = this.type;
  this.render = function (_0x307bf8, _0x56a177, _0x54f2d8) {
    if (_0x5d769d.enabled === false) return;
    if (_0x5d769d.autoUpdate === false && _0x5d769d.needsUpdate === false) return;
    if (_0x307bf8.length === 0) return;
    const _0x381ce3 = _0x4d6bed.getRenderTarget(),
      _0x2bc0b8 = _0x4d6bed.getActiveCubeFace(),
      _0x2e664b = _0x4d6bed.getActiveMipmapLevel(),
      _0x440e70 = _0x4d6bed.state;
    _0x440e70.setBlending(NoBlending);
    _0x440e70.buffers.depth.getReversed() === true
      ? _0x440e70.buffers.color.setClear(0, 0, 0, 0)
      : _0x440e70.buffers.color.setClear(1, 1, 1, 1);
    (_0x440e70.buffers.depth.setTest(true), _0x440e70.setScissorTest(false));
    const _0x13c76a = _0x22cb68 !== VSMShadowMap && this.type === VSMShadowMap,
      _0x1b92ba = _0x22cb68 === VSMShadowMap && this.type !== VSMShadowMap;
    for (let _0x45d5a5 = 0, _0x64d8 = _0x307bf8.length; _0x45d5a5 < _0x64d8; _0x45d5a5++) {
      const _0x3c8673 = _0x307bf8[_0x45d5a5],
        _0x106dcb = _0x3c8673.shadow;
      if (_0x106dcb === undefined) {
        console.warn('THREE.WebGLShadowMap:', _0x3c8673, 'has no shadow.');
        continue;
      }
      if (_0x106dcb.autoUpdate === false && _0x106dcb.needsUpdate === false) continue;
      _0x58ec33.copy(_0x106dcb.mapSize);
      const _0x2a63a0 = _0x106dcb.getFrameExtents();
      (_0x58ec33.multiply(_0x2a63a0), _0x529644.copy(_0x106dcb.mapSize));
      (_0x58ec33.x > _0x2bbe74 || _0x58ec33.y > _0x2bbe74) &&
        (_0x58ec33.x > _0x2bbe74 &&
          ((_0x529644.x = Math.floor(_0x2bbe74 / _0x2a63a0.x)),
          (_0x58ec33.x = _0x529644.x * _0x2a63a0.x),
          (_0x106dcb.mapSize.x = _0x529644.x)),
        _0x58ec33.y > _0x2bbe74 &&
          ((_0x529644.y = Math.floor(_0x2bbe74 / _0x2a63a0.y)),
          (_0x58ec33.y = _0x529644.y * _0x2a63a0.y),
          (_0x106dcb.mapSize.y = _0x529644.y)));
      if (_0x106dcb.map === null || _0x13c76a === true || _0x1b92ba === true) {
        const _0x1fe40a =
          this.type !== VSMShadowMap ? { minFilter: NearestFilter, magFilter: NearestFilter } : {};
        (_0x106dcb.map !== null && _0x106dcb.map.dispose(),
          (_0x106dcb.map = new WebGLRenderTarget(_0x58ec33.x, _0x58ec33.y, _0x1fe40a)),
          (_0x106dcb.map.texture.name = _0x3c8673.name + '.shadowMap'),
          _0x106dcb.camera.updateProjectionMatrix());
      }
      (_0x4d6bed.setRenderTarget(_0x106dcb.map), _0x4d6bed.clear());
      const _0x5c900c = _0x106dcb.getViewportCount();
      for (let _0x22cdc2 = 0; _0x22cdc2 < _0x5c900c; _0x22cdc2++) {
        const _0x2cd93c = _0x106dcb.getViewport(_0x22cdc2);
        (_0x1ee34f.set(
          _0x529644.x * _0x2cd93c.x,
          _0x529644.y * _0x2cd93c.y,
          _0x529644.x * _0x2cd93c.z,
          _0x529644.y * _0x2cd93c.w,
        ),
          _0x440e70.viewport(_0x1ee34f),
          _0x106dcb.updateMatrices(_0x3c8673, _0x22cdc2),
          (_0x2a8292 = _0x106dcb.getFrustum()),
          _0x32b2b2(_0x56a177, _0x54f2d8, _0x106dcb.camera, _0x3c8673, this.type));
      }
      (_0x106dcb.isPointLightShadow !== true && this.type === VSMShadowMap && _0x310a78(_0x106dcb, _0x54f2d8),
        (_0x106dcb.needsUpdate = false));
    }
    ((_0x22cb68 = this.type),
      (_0x5d769d.needsUpdate = false),
      _0x4d6bed.setRenderTarget(_0x381ce3, _0x2bc0b8, _0x2e664b));
  };
  function _0x310a78(_0x213fff, _0x52203c) {
    const _0xf5d3fb = _0x387be3.update(_0x19a30a);
    (_0x2d6190.defines.VSM_SAMPLES !== _0x213fff.blurSamples &&
      ((_0x2d6190.defines.VSM_SAMPLES = _0x213fff.blurSamples),
      (_0x5d98d5.defines.VSM_SAMPLES = _0x213fff.blurSamples),
      (_0x2d6190.needsUpdate = true),
      (_0x5d98d5.needsUpdate = true)),
      _0x213fff.mapPass === null && (_0x213fff.mapPass = new WebGLRenderTarget(_0x58ec33.x, _0x58ec33.y)),
      (_0x2d6190.uniforms.shadow_pass.value = _0x213fff.map.texture),
      (_0x2d6190.uniforms.resolution.value = _0x213fff.mapSize),
      (_0x2d6190.uniforms.radius.value = _0x213fff.radius),
      _0x4d6bed.setRenderTarget(_0x213fff.mapPass),
      _0x4d6bed.clear(),
      _0x4d6bed.renderBufferDirect(_0x52203c, null, _0xf5d3fb, _0x2d6190, _0x19a30a, null),
      (_0x5d98d5.uniforms.shadow_pass.value = _0x213fff.mapPass.texture),
      (_0x5d98d5.uniforms.resolution.value = _0x213fff.mapSize),
      (_0x5d98d5.uniforms.radius.value = _0x213fff.radius),
      _0x4d6bed.setRenderTarget(_0x213fff.map),
      _0x4d6bed.clear(),
      _0x4d6bed.renderBufferDirect(_0x52203c, null, _0xf5d3fb, _0x5d98d5, _0x19a30a, null));
  }
  function _0x1f7392(_0x1a20df, _0x3839cd, _0x3f67b, _0x131edc) {
    let _0x1d7b64 = null;
    const _0x514a67 =
      _0x3f67b.isPointLight === true ? _0x1a20df.customDistanceMaterial : _0x1a20df.customDepthMaterial;
    if (_0x514a67 !== undefined) _0x1d7b64 = _0x514a67;
    else {
      _0x1d7b64 = _0x3f67b.isPointLight === true ? _0x48652e : _0x6d8632;
      if (
        (_0x4d6bed.localClippingEnabled &&
          _0x3839cd.clipShadows === true &&
          Array.isArray(_0x3839cd.clippingPlanes) &&
          _0x3839cd.clippingPlanes.length !== 0) ||
        (_0x3839cd.displacementMap && _0x3839cd.displacementScale !== 0) ||
        (_0x3839cd.alphaMap && _0x3839cd.alphaTest > 0) ||
        (_0x3839cd.map && _0x3839cd.alphaTest > 0) ||
        _0x3839cd.alphaToCoverage === true
      ) {
        const _0x371113 = _0x1d7b64.uuid,
          _0x2c1d95 = _0x3839cd.uuid;
        let _0x29308b = _0x3791f4[_0x371113];
        _0x29308b === undefined && ((_0x29308b = {}), (_0x3791f4[_0x371113] = _0x29308b));
        let _0x4df979 = _0x29308b[_0x2c1d95];
        (_0x4df979 === undefined &&
          ((_0x4df979 = _0x1d7b64.clone()),
          (_0x29308b[_0x2c1d95] = _0x4df979),
          _0x3839cd.addEventListener('dispose', _0x17a3ea)),
          (_0x1d7b64 = _0x4df979));
      }
    }
    ((_0x1d7b64.visible = _0x3839cd.visible), (_0x1d7b64.wireframe = _0x3839cd.wireframe));
    _0x131edc === VSMShadowMap
      ? (_0x1d7b64.side = _0x3839cd.shadowSide !== null ? _0x3839cd.shadowSide : _0x3839cd.side)
      : (_0x1d7b64.side = _0x3839cd.shadowSide !== null ? _0x3839cd.shadowSide : _0x12d07d[_0x3839cd.side]);
    ((_0x1d7b64.alphaMap = _0x3839cd.alphaMap),
      (_0x1d7b64.alphaTest = _0x3839cd.alphaToCoverage === true ? 0.5 : _0x3839cd.alphaTest),
      (_0x1d7b64.map = _0x3839cd.map),
      (_0x1d7b64.clipShadows = _0x3839cd.clipShadows),
      (_0x1d7b64.clippingPlanes = _0x3839cd.clippingPlanes),
      (_0x1d7b64.clipIntersection = _0x3839cd.clipIntersection),
      (_0x1d7b64.displacementMap = _0x3839cd.displacementMap),
      (_0x1d7b64.displacementScale = _0x3839cd.displacementScale),
      (_0x1d7b64.displacementBias = _0x3839cd.displacementBias),
      (_0x1d7b64.wireframeLinewidth = _0x3839cd.wireframeLinewidth),
      (_0x1d7b64.linewidth = _0x3839cd.linewidth));
    if (_0x3f67b.isPointLight === true && _0x1d7b64.isMeshDistanceMaterial === true) {
      const _0x48238f = _0x4d6bed.properties.get(_0x1d7b64);
      _0x48238f.light = _0x3f67b;
    }
    return _0x1d7b64;
  }
  function _0x32b2b2(_0x4698c0, _0x3136cc, _0x1f481b, _0x1edb17, _0x4f47ff) {
    if (_0x4698c0.visible === false) return;
    const _0x562d32 = _0x4698c0.layers.test(_0x3136cc.layers);
    if (_0x562d32 && (_0x4698c0.isMesh || _0x4698c0.isLine || _0x4698c0.isPoints)) {
      if (
        (_0x4698c0.castShadow || (_0x4698c0.receiveShadow && _0x4f47ff === VSMShadowMap)) &&
        (!_0x4698c0.frustumCulled || _0x2a8292.intersectsObject(_0x4698c0))
      ) {
        _0x4698c0.modelViewMatrix.multiplyMatrices(_0x1f481b.matrixWorldInverse, _0x4698c0.matrixWorld);
        const _0x29ff39 = _0x387be3.update(_0x4698c0),
          _0x25594b = _0x4698c0.material;
        if (Array.isArray(_0x25594b)) {
          const _0x147dfc = _0x29ff39.groups;
          for (let _0x53ed91 = 0, _0x1b1968 = _0x147dfc.length; _0x53ed91 < _0x1b1968; _0x53ed91++) {
            const _0x1a3be1 = _0x147dfc[_0x53ed91],
              _0x5b5816 = _0x25594b[_0x1a3be1.materialIndex];
            if (_0x5b5816 && _0x5b5816.visible) {
              const _0x578d06 = _0x1f7392(_0x4698c0, _0x5b5816, _0x1edb17, _0x4f47ff);
              (_0x4698c0.onBeforeShadow(
                _0x4d6bed,
                _0x4698c0,
                _0x3136cc,
                _0x1f481b,
                _0x29ff39,
                _0x578d06,
                _0x1a3be1,
              ),
                _0x4d6bed.renderBufferDirect(_0x1f481b, null, _0x29ff39, _0x578d06, _0x4698c0, _0x1a3be1),
                _0x4698c0.onAfterShadow(
                  _0x4d6bed,
                  _0x4698c0,
                  _0x3136cc,
                  _0x1f481b,
                  _0x29ff39,
                  _0x578d06,
                  _0x1a3be1,
                ));
            }
          }
        } else {
          if (_0x25594b.visible) {
            const _0x96d49f = _0x1f7392(_0x4698c0, _0x25594b, _0x1edb17, _0x4f47ff);
            (_0x4698c0.onBeforeShadow(_0x4d6bed, _0x4698c0, _0x3136cc, _0x1f481b, _0x29ff39, _0x96d49f, null),
              _0x4d6bed.renderBufferDirect(_0x1f481b, null, _0x29ff39, _0x96d49f, _0x4698c0, null),
              _0x4698c0.onAfterShadow(
                _0x4d6bed,
                _0x4698c0,
                _0x3136cc,
                _0x1f481b,
                _0x29ff39,
                _0x96d49f,
                null,
              ));
          }
        }
      }
    }
    const _0x191107 = _0x4698c0.children;
    for (let _0x125eb1 = 0, _0x632e5 = _0x191107.length; _0x125eb1 < _0x632e5; _0x125eb1++) {
      _0x32b2b2(_0x191107[_0x125eb1], _0x3136cc, _0x1f481b, _0x1edb17, _0x4f47ff);
    }
  }
  function _0x17a3ea(_0x5b52b5) {
    const _0x2cbe5b = _0x5b52b5.target;
    _0x2cbe5b.removeEventListener('dispose', _0x17a3ea);
    for (const _0x5e6b72 in _0x3791f4) {
      const _0x29854a = _0x3791f4[_0x5e6b72],
        _0x1d17ce = _0x5b52b5.target.uuid;
      if (_0x1d17ce in _0x29854a) {
        const _0x2580b3 = _0x29854a[_0x1d17ce];
        (_0x2580b3.dispose(), delete _0x29854a[_0x1d17ce]);
      }
    }
  }
}
const reversedFuncs = {
  [NeverDepth]: AlwaysDepth,
  [LessDepth]: GreaterDepth,
  [EqualDepth]: NotEqualDepth,
  [LessEqualDepth]: GreaterEqualDepth,
  [AlwaysDepth]: NeverDepth,
  [GreaterDepth]: LessDepth,
  [NotEqualDepth]: EqualDepth,
  [GreaterEqualDepth]: LessEqualDepth,
};
function WebGLState(_0x54d0d8, _0x536540) {
  function _0x53e31a() {
    let _0x444220 = false;
    const _0x230071 = new Vector4();
    let _0x1f47c4 = null;
    const _0x42bb7e = new Vector4(0, 0, 0, 0);
    return {
      setMask: function (_0x5e89d1) {
        _0x1f47c4 !== _0x5e89d1 &&
          !_0x444220 &&
          (_0x54d0d8.colorMask(_0x5e89d1, _0x5e89d1, _0x5e89d1, _0x5e89d1), (_0x1f47c4 = _0x5e89d1));
      },
      setLocked: function (_0x56f8e1) {
        _0x444220 = _0x56f8e1;
      },
      setClear: function (_0x2796a8, _0x37dc3c, _0x1f7899, _0x365878, _0x19304c) {
        (_0x19304c === true && ((_0x2796a8 *= _0x365878), (_0x37dc3c *= _0x365878), (_0x1f7899 *= _0x365878)),
          _0x230071.set(_0x2796a8, _0x37dc3c, _0x1f7899, _0x365878),
          _0x42bb7e.equals(_0x230071) === false &&
            (_0x54d0d8.clearColor(_0x2796a8, _0x37dc3c, _0x1f7899, _0x365878), _0x42bb7e.copy(_0x230071)));
      },
      reset: function () {
        ((_0x444220 = false), (_0x1f47c4 = null), _0x42bb7e.set(-1, 0, 0, 0));
      },
    };
  }
  function _0x320bd9() {
    let _0xef9097 = false,
      _0x2988f9 = false,
      _0x3cb82b = null,
      _0xfd095b = null,
      _0xfd0028 = null;
    return {
      setReversed: function (_0x2a9c83) {
        if (_0x2988f9 !== _0x2a9c83) {
          const _0x1157b3 = _0x536540.get('EXT_clip_control');
          _0x2a9c83
            ? _0x1157b3.clipControlEXT(_0x1157b3.LOWER_LEFT_EXT, _0x1157b3.ZERO_TO_ONE_EXT)
            : _0x1157b3.clipControlEXT(_0x1157b3.LOWER_LEFT_EXT, _0x1157b3.NEGATIVE_ONE_TO_ONE_EXT);
          _0x2988f9 = _0x2a9c83;
          const _0x36ba28 = _0xfd0028;
          ((_0xfd0028 = null), this.setClear(_0x36ba28));
        }
      },
      getReversed: function () {
        return _0x2988f9;
      },
      setTest: function (_0x55bc3b) {
        _0x55bc3b ? _0x19f0da(_0x54d0d8.DEPTH_TEST) : _0x237e33(_0x54d0d8.DEPTH_TEST);
      },
      setMask: function (_0xcea06c) {
        _0x3cb82b !== _0xcea06c && !_0xef9097 && (_0x54d0d8.depthMask(_0xcea06c), (_0x3cb82b = _0xcea06c));
      },
      setFunc: function (_0x268645) {
        if (_0x2988f9) _0x268645 = reversedFuncs[_0x268645];
        if (_0xfd095b !== _0x268645) {
          switch (_0x268645) {
            case NeverDepth:
              _0x54d0d8.depthFunc(_0x54d0d8.NEVER);
              break;
            case AlwaysDepth:
              _0x54d0d8.depthFunc(_0x54d0d8.ALWAYS);
              break;
            case LessDepth:
              _0x54d0d8.depthFunc(_0x54d0d8.LESS);
              break;
            case LessEqualDepth:
              _0x54d0d8.depthFunc(_0x54d0d8.LEQUAL);
              break;
            case EqualDepth:
              _0x54d0d8.depthFunc(_0x54d0d8.EQUAL);
              break;
            case GreaterEqualDepth:
              _0x54d0d8.depthFunc(_0x54d0d8.GEQUAL);
              break;
            case GreaterDepth:
              _0x54d0d8.depthFunc(_0x54d0d8.GREATER);
              break;
            case NotEqualDepth:
              _0x54d0d8.depthFunc(_0x54d0d8.NOTEQUAL);
              break;
            default:
              _0x54d0d8.depthFunc(_0x54d0d8.LEQUAL);
          }
          _0xfd095b = _0x268645;
        }
      },
      setLocked: function (_0x2c0871) {
        _0xef9097 = _0x2c0871;
      },
      setClear: function (_0x243c9e) {
        _0xfd0028 !== _0x243c9e &&
          (_0x2988f9 && (_0x243c9e = 1 - _0x243c9e),
          _0x54d0d8.clearDepth(_0x243c9e),
          (_0xfd0028 = _0x243c9e));
      },
      reset: function () {
        ((_0xef9097 = false),
          (_0x3cb82b = null),
          (_0xfd095b = null),
          (_0xfd0028 = null),
          (_0x2988f9 = false));
      },
    };
  }
  function _0x318808() {
    let _0x491702 = false,
      _0xd9cd31 = null,
      _0x55ef78 = null,
      _0x37f964 = null,
      _0xcc42c1 = null,
      _0x3fd279 = null,
      _0x1c5f86 = null,
      _0x302523 = null,
      _0x45da3c = null;
    return {
      setTest: function (_0x5f13ba) {
        !_0x491702 && (_0x5f13ba ? _0x19f0da(_0x54d0d8.STENCIL_TEST) : _0x237e33(_0x54d0d8.STENCIL_TEST));
      },
      setMask: function (_0x53eb55) {
        _0xd9cd31 !== _0x53eb55 && !_0x491702 && (_0x54d0d8.stencilMask(_0x53eb55), (_0xd9cd31 = _0x53eb55));
      },
      setFunc: function (_0x1aaf20, _0x3184ad, _0x90e5fe) {
        (_0x55ef78 !== _0x1aaf20 || _0x37f964 !== _0x3184ad || _0xcc42c1 !== _0x90e5fe) &&
          (_0x54d0d8.stencilFunc(_0x1aaf20, _0x3184ad, _0x90e5fe),
          (_0x55ef78 = _0x1aaf20),
          (_0x37f964 = _0x3184ad),
          (_0xcc42c1 = _0x90e5fe));
      },
      setOp: function (_0x28e77f, _0x444f87, _0x5ddfb0) {
        (_0x3fd279 !== _0x28e77f || _0x1c5f86 !== _0x444f87 || _0x302523 !== _0x5ddfb0) &&
          (_0x54d0d8.stencilOp(_0x28e77f, _0x444f87, _0x5ddfb0),
          (_0x3fd279 = _0x28e77f),
          (_0x1c5f86 = _0x444f87),
          (_0x302523 = _0x5ddfb0));
      },
      setLocked: function (_0x1dcd6d) {
        _0x491702 = _0x1dcd6d;
      },
      setClear: function (_0x5ccf4d) {
        _0x45da3c !== _0x5ccf4d && (_0x54d0d8.clearStencil(_0x5ccf4d), (_0x45da3c = _0x5ccf4d));
      },
      reset: function () {
        ((_0x491702 = false),
          (_0xd9cd31 = null),
          (_0x55ef78 = null),
          (_0x37f964 = null),
          (_0xcc42c1 = null),
          (_0x3fd279 = null),
          (_0x1c5f86 = null),
          (_0x302523 = null),
          (_0x45da3c = null));
      },
    };
  }
  const _0xb344b7 = new _0x53e31a(),
    _0x5135d3 = new _0x320bd9(),
    _0x298208 = new _0x318808(),
    _0x4ddc14 = new WeakMap(),
    _0x228dfa = new WeakMap();
  let _0x464e66 = {},
    _0xeaa0bd = {},
    _0x357806 = new WeakMap(),
    _0x349223 = [],
    _0x1ae08f = null,
    _0x5c9d56 = false,
    _0xe6ccdb = null,
    _0x271d8a = null,
    _0x59bd1b = null,
    _0x50f9d4 = null,
    _0x112e3d = null,
    _0x10b54e = null,
    _0x3a75b2 = null,
    _0x4a824a = new Color(0, 0, 0),
    _0x10491e = 0,
    _0x4d9c97 = false,
    _0x2a05ae = null,
    _0x16f349 = null,
    _0x543235 = null,
    _0x17ab1d = null,
    _0x470c4d = null;
  const _0x1390b6 = _0x54d0d8.getParameter(_0x54d0d8.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
  let _0x2bb90d = false,
    _0x4daef5 = 0;
  const _0x5bc724 = _0x54d0d8.getParameter(_0x54d0d8.VERSION);
  if (_0x5bc724.indexOf('WebGL') !== -1)
    ((_0x4daef5 = parseFloat(/^WebGL (\d)/.exec(_0x5bc724)[1])), (_0x2bb90d = _0x4daef5 >= 1));
  else
    _0x5bc724.indexOf('OpenGL ES') !== -1 &&
      ((_0x4daef5 = parseFloat(/^OpenGL ES (\d)/.exec(_0x5bc724)[1])), (_0x2bb90d = _0x4daef5 >= 2));
  let _0x5e1ca5 = null,
    _0x14b58f = {};
  const _0x39b4a8 = _0x54d0d8.getParameter(_0x54d0d8.SCISSOR_BOX),
    _0x51ea14 = _0x54d0d8.getParameter(_0x54d0d8.VIEWPORT),
    _0xab9d59 = new Vector4().fromArray(_0x39b4a8),
    _0x266e3c = new Vector4().fromArray(_0x51ea14);
  function _0x170695(_0x5b7738, _0x4fe5c1, _0x2fa321, _0xa05ddd) {
    const _0xd94b6 = new Uint8Array(4),
      _0x18c4bf = _0x54d0d8.createTexture();
    (_0x54d0d8.bindTexture(_0x5b7738, _0x18c4bf),
      _0x54d0d8.texParameteri(_0x5b7738, _0x54d0d8.TEXTURE_MIN_FILTER, _0x54d0d8.NEAREST),
      _0x54d0d8.texParameteri(_0x5b7738, _0x54d0d8.TEXTURE_MAG_FILTER, _0x54d0d8.NEAREST));
    for (let _0x4af0f4 = 0; _0x4af0f4 < _0x2fa321; _0x4af0f4++) {
      _0x5b7738 === _0x54d0d8.TEXTURE_3D || _0x5b7738 === _0x54d0d8.TEXTURE_2D_ARRAY
        ? _0x54d0d8.texImage3D(
            _0x4fe5c1,
            0,
            _0x54d0d8.RGBA,
            1,
            1,
            _0xa05ddd,
            0,
            _0x54d0d8.RGBA,
            _0x54d0d8.UNSIGNED_BYTE,
            _0xd94b6,
          )
        : _0x54d0d8.texImage2D(
            _0x4fe5c1 + _0x4af0f4,
            0,
            _0x54d0d8.RGBA,
            1,
            1,
            0,
            _0x54d0d8.RGBA,
            _0x54d0d8.UNSIGNED_BYTE,
            _0xd94b6,
          );
    }
    return _0x18c4bf;
  }
  const _0xb02955 = {};
  ((_0xb02955[_0x54d0d8.TEXTURE_2D] = _0x170695(_0x54d0d8.TEXTURE_2D, _0x54d0d8.TEXTURE_2D, 1)),
    (_0xb02955[_0x54d0d8.TEXTURE_CUBE_MAP] = _0x170695(
      _0x54d0d8.TEXTURE_CUBE_MAP,
      _0x54d0d8.TEXTURE_CUBE_MAP_POSITIVE_X,
      6,
    )),
    (_0xb02955[_0x54d0d8.TEXTURE_2D_ARRAY] = _0x170695(
      _0x54d0d8.TEXTURE_2D_ARRAY,
      _0x54d0d8.TEXTURE_2D_ARRAY,
      1,
      1,
    )),
    (_0xb02955[_0x54d0d8.TEXTURE_3D] = _0x170695(_0x54d0d8.TEXTURE_3D, _0x54d0d8.TEXTURE_3D, 1, 1)),
    _0xb344b7.setClear(0, 0, 0, 1),
    _0x5135d3.setClear(1),
    _0x298208.setClear(0),
    _0x19f0da(_0x54d0d8.DEPTH_TEST),
    _0x5135d3.setFunc(LessEqualDepth),
    _0xc88699(false),
    _0x596d6f(CullFaceBack),
    _0x19f0da(_0x54d0d8.CULL_FACE),
    _0x5523e3(NoBlending));
  function _0x19f0da(_0x242d54) {
    _0x464e66[_0x242d54] !== true && (_0x54d0d8.enable(_0x242d54), (_0x464e66[_0x242d54] = true));
  }
  function _0x237e33(_0x5689d7) {
    _0x464e66[_0x5689d7] !== false && (_0x54d0d8.disable(_0x5689d7), (_0x464e66[_0x5689d7] = false));
  }
  function _0x2b2224(_0x954d0c, _0x29cbc0) {
    if (_0xeaa0bd[_0x954d0c] !== _0x29cbc0)
      return (
        _0x54d0d8.bindFramebuffer(_0x954d0c, _0x29cbc0),
        (_0xeaa0bd[_0x954d0c] = _0x29cbc0),
        _0x954d0c === _0x54d0d8.DRAW_FRAMEBUFFER && (_0xeaa0bd[_0x54d0d8.FRAMEBUFFER] = _0x29cbc0),
        _0x954d0c === _0x54d0d8.FRAMEBUFFER && (_0xeaa0bd[_0x54d0d8.DRAW_FRAMEBUFFER] = _0x29cbc0),
        true
      );
    return false;
  }
  function _0x57fdfd(_0x447d81, _0x243a73) {
    let _0x17fafd = _0x349223,
      _0x5d74a1 = false;
    if (_0x447d81) {
      _0x17fafd = _0x357806.get(_0x243a73);
      _0x17fafd === undefined && ((_0x17fafd = []), _0x357806.set(_0x243a73, _0x17fafd));
      const _0x1f67d1 = _0x447d81.textures;
      if (_0x17fafd.length !== _0x1f67d1.length || _0x17fafd[0] !== _0x54d0d8.COLOR_ATTACHMENT0) {
        for (let _0x2761c8 = 0, _0x2f6326 = _0x1f67d1.length; _0x2761c8 < _0x2f6326; _0x2761c8++) {
          _0x17fafd[_0x2761c8] = _0x54d0d8.COLOR_ATTACHMENT0 + _0x2761c8;
        }
        ((_0x17fafd.length = _0x1f67d1.length), (_0x5d74a1 = true));
      }
    } else _0x17fafd[0] !== _0x54d0d8.BACK && ((_0x17fafd[0] = _0x54d0d8.BACK), (_0x5d74a1 = true));
    _0x5d74a1 && _0x54d0d8.drawBuffers(_0x17fafd);
  }
  function _0x19a3d3(_0x2a1564) {
    if (_0x1ae08f !== _0x2a1564) return (_0x54d0d8.useProgram(_0x2a1564), (_0x1ae08f = _0x2a1564), true);
    return false;
  }
  const _0x179585 = {
    [AddEquation]: _0x54d0d8.FUNC_ADD,
    [SubtractEquation]: _0x54d0d8.FUNC_SUBTRACT,
    [ReverseSubtractEquation]: _0x54d0d8.FUNC_REVERSE_SUBTRACT,
  };
  ((_0x179585[MinEquation] = _0x54d0d8.MIN), (_0x179585[MaxEquation] = _0x54d0d8.MAX));
  const _0x41275e = {
    [ZeroFactor]: _0x54d0d8.ZERO,
    [OneFactor]: _0x54d0d8.ONE,
    [SrcColorFactor]: _0x54d0d8.SRC_COLOR,
    [SrcAlphaFactor]: _0x54d0d8.SRC_ALPHA,
    [SrcAlphaSaturateFactor]: _0x54d0d8.SRC_ALPHA_SATURATE,
    [DstColorFactor]: _0x54d0d8.DST_COLOR,
    [DstAlphaFactor]: _0x54d0d8.DST_ALPHA,
    [OneMinusSrcColorFactor]: _0x54d0d8.ONE_MINUS_SRC_COLOR,
    [OneMinusSrcAlphaFactor]: _0x54d0d8.ONE_MINUS_SRC_ALPHA,
    [OneMinusDstColorFactor]: _0x54d0d8.ONE_MINUS_DST_COLOR,
    [OneMinusDstAlphaFactor]: _0x54d0d8.ONE_MINUS_DST_ALPHA,
    [ConstantColorFactor]: _0x54d0d8.CONSTANT_COLOR,
    [OneMinusConstantColorFactor]: _0x54d0d8.ONE_MINUS_CONSTANT_COLOR,
    [ConstantAlphaFactor]: _0x54d0d8.CONSTANT_ALPHA,
    [OneMinusConstantAlphaFactor]: _0x54d0d8.ONE_MINUS_CONSTANT_ALPHA,
  };
  function _0x5523e3(
    _0x4f5315,
    _0x2e494c,
    _0x423505,
    _0x69c0fe,
    _0x564d31,
    _0x28b181,
    _0x40ba3a,
    _0x5a138f,
    _0x4e1f23,
    _0x55fa7f,
  ) {
    if (_0x4f5315 === NoBlending) {
      _0x5c9d56 === true && (_0x237e33(_0x54d0d8.BLEND), (_0x5c9d56 = false));
      return;
    }
    _0x5c9d56 === false && (_0x19f0da(_0x54d0d8.BLEND), (_0x5c9d56 = true));
    if (_0x4f5315 !== CustomBlending) {
      if (_0x4f5315 !== _0xe6ccdb || _0x55fa7f !== _0x4d9c97) {
        (_0x271d8a !== AddEquation || _0x112e3d !== AddEquation) &&
          (_0x54d0d8.blendEquation(_0x54d0d8.FUNC_ADD), (_0x271d8a = AddEquation), (_0x112e3d = AddEquation));
        if (_0x55fa7f)
          switch (_0x4f5315) {
            case NormalBlending:
              _0x54d0d8.blendFuncSeparate(
                _0x54d0d8.ONE,
                _0x54d0d8.ONE_MINUS_SRC_ALPHA,
                _0x54d0d8.ONE,
                _0x54d0d8.ONE_MINUS_SRC_ALPHA,
              );
              break;
            case AdditiveBlending:
              _0x54d0d8.blendFunc(_0x54d0d8.ONE, _0x54d0d8.ONE);
              break;
            case SubtractiveBlending:
              _0x54d0d8.blendFuncSeparate(
                _0x54d0d8.ZERO,
                _0x54d0d8.ONE_MINUS_SRC_COLOR,
                _0x54d0d8.ZERO,
                _0x54d0d8.ONE,
              );
              break;
            case MultiplyBlending:
              _0x54d0d8.blendFuncSeparate(
                _0x54d0d8.DST_COLOR,
                _0x54d0d8.ONE_MINUS_SRC_ALPHA,
                _0x54d0d8.ZERO,
                _0x54d0d8.ONE,
              );
              break;
            default:
              console.error('THREE.WebGLState: Invalid blending: ', _0x4f5315);
              break;
          }
        else
          switch (_0x4f5315) {
            case NormalBlending:
              _0x54d0d8.blendFuncSeparate(
                _0x54d0d8.SRC_ALPHA,
                _0x54d0d8.ONE_MINUS_SRC_ALPHA,
                _0x54d0d8.ONE,
                _0x54d0d8.ONE_MINUS_SRC_ALPHA,
              );
              break;
            case AdditiveBlending:
              _0x54d0d8.blendFuncSeparate(_0x54d0d8.SRC_ALPHA, _0x54d0d8.ONE, _0x54d0d8.ONE, _0x54d0d8.ONE);
              break;
            case SubtractiveBlending:
              console.error(
                'THREE.WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true',
              );
              break;
            case MultiplyBlending:
              console.error('THREE.WebGLState: MultiplyBlending requires material.premultipliedAlpha = true');
              break;
            default:
              console.error('THREE.WebGLState: Invalid blending: ', _0x4f5315);
              break;
          }
        ((_0x59bd1b = null),
          (_0x50f9d4 = null),
          (_0x10b54e = null),
          (_0x3a75b2 = null),
          _0x4a824a.set(0, 0, 0),
          (_0x10491e = 0),
          (_0xe6ccdb = _0x4f5315),
          (_0x4d9c97 = _0x55fa7f));
      }
      return;
    }
    ((_0x564d31 = _0x564d31 || _0x2e494c),
      (_0x28b181 = _0x28b181 || _0x423505),
      (_0x40ba3a = _0x40ba3a || _0x69c0fe),
      (_0x2e494c !== _0x271d8a || _0x564d31 !== _0x112e3d) &&
        (_0x54d0d8.blendEquationSeparate(_0x179585[_0x2e494c], _0x179585[_0x564d31]),
        (_0x271d8a = _0x2e494c),
        (_0x112e3d = _0x564d31)),
      (_0x423505 !== _0x59bd1b ||
        _0x69c0fe !== _0x50f9d4 ||
        _0x28b181 !== _0x10b54e ||
        _0x40ba3a !== _0x3a75b2) &&
        (_0x54d0d8.blendFuncSeparate(
          _0x41275e[_0x423505],
          _0x41275e[_0x69c0fe],
          _0x41275e[_0x28b181],
          _0x41275e[_0x40ba3a],
        ),
        (_0x59bd1b = _0x423505),
        (_0x50f9d4 = _0x69c0fe),
        (_0x10b54e = _0x28b181),
        (_0x3a75b2 = _0x40ba3a)),
      (_0x5a138f.equals(_0x4a824a) === false || _0x4e1f23 !== _0x10491e) &&
        (_0x54d0d8.blendColor(_0x5a138f.r, _0x5a138f.g, _0x5a138f.b, _0x4e1f23),
        _0x4a824a.copy(_0x5a138f),
        (_0x10491e = _0x4e1f23)),
      (_0xe6ccdb = _0x4f5315),
      (_0x4d9c97 = false));
  }
  function _0x5b25bb(_0x340d7a, _0x3a3515) {
    _0x340d7a.side === DoubleSide ? _0x237e33(_0x54d0d8.CULL_FACE) : _0x19f0da(_0x54d0d8.CULL_FACE);
    let _0x257580 = _0x340d7a.side === BackSide;
    if (_0x3a3515) _0x257580 = !_0x257580;
    (_0xc88699(_0x257580),
      _0x340d7a.blending === NormalBlending && _0x340d7a.transparent === false
        ? _0x5523e3(NoBlending)
        : _0x5523e3(
            _0x340d7a.blending,
            _0x340d7a.blendEquation,
            _0x340d7a.blendSrc,
            _0x340d7a.blendDst,
            _0x340d7a.blendEquationAlpha,
            _0x340d7a.blendSrcAlpha,
            _0x340d7a.blendDstAlpha,
            _0x340d7a.blendColor,
            _0x340d7a.blendAlpha,
            _0x340d7a.premultipliedAlpha,
          ),
      _0x5135d3.setFunc(_0x340d7a.depthFunc),
      _0x5135d3.setTest(_0x340d7a.depthTest),
      _0x5135d3.setMask(_0x340d7a.depthWrite),
      _0xb344b7.setMask(_0x340d7a.colorWrite));
    const _0x2cf770 = _0x340d7a.stencilWrite;
    (_0x298208.setTest(_0x2cf770),
      _0x2cf770 &&
        (_0x298208.setMask(_0x340d7a.stencilWriteMask),
        _0x298208.setFunc(_0x340d7a.stencilFunc, _0x340d7a.stencilRef, _0x340d7a.stencilFuncMask),
        _0x298208.setOp(_0x340d7a.stencilFail, _0x340d7a.stencilZFail, _0x340d7a.stencilZPass)),
      _0x4ab084(_0x340d7a.polygonOffset, _0x340d7a.polygonOffsetFactor, _0x340d7a.polygonOffsetUnits),
      _0x340d7a.alphaToCoverage === true
        ? _0x19f0da(_0x54d0d8.SAMPLE_ALPHA_TO_COVERAGE)
        : _0x237e33(_0x54d0d8.SAMPLE_ALPHA_TO_COVERAGE));
  }
  function _0xc88699(_0x282646) {
    _0x2a05ae !== _0x282646 &&
      (_0x282646 ? _0x54d0d8.frontFace(_0x54d0d8.CW) : _0x54d0d8.frontFace(_0x54d0d8.CCW),
      (_0x2a05ae = _0x282646));
  }
  function _0x596d6f(_0x4da195) {
    if (_0x4da195 !== CullFaceNone) {
      _0x19f0da(_0x54d0d8.CULL_FACE);
      if (_0x4da195 !== _0x16f349) {
        if (_0x4da195 === CullFaceBack) _0x54d0d8.cullFace(_0x54d0d8.BACK);
        else
          _0x4da195 === CullFaceFront
            ? _0x54d0d8.cullFace(_0x54d0d8.FRONT)
            : _0x54d0d8.cullFace(_0x54d0d8.FRONT_AND_BACK);
      }
    } else _0x237e33(_0x54d0d8.CULL_FACE);
    _0x16f349 = _0x4da195;
  }
  function _0xba09c4(_0x52f98d) {
    if (_0x52f98d !== _0x543235) {
      if (_0x2bb90d) _0x54d0d8.lineWidth(_0x52f98d);
      _0x543235 = _0x52f98d;
    }
  }
  function _0x4ab084(_0x472777, _0x19ff53, _0x181571) {
    _0x472777
      ? (_0x19f0da(_0x54d0d8.POLYGON_OFFSET_FILL),
        (_0x17ab1d !== _0x19ff53 || _0x470c4d !== _0x181571) &&
          (_0x54d0d8.polygonOffset(_0x19ff53, _0x181571), (_0x17ab1d = _0x19ff53), (_0x470c4d = _0x181571)))
      : _0x237e33(_0x54d0d8.POLYGON_OFFSET_FILL);
  }
  function _0x19681e(_0x11c78b) {
    _0x11c78b ? _0x19f0da(_0x54d0d8.SCISSOR_TEST) : _0x237e33(_0x54d0d8.SCISSOR_TEST);
  }
  function _0x2e6ae7(_0x46afbb) {
    if (_0x46afbb === undefined) _0x46afbb = _0x54d0d8.TEXTURE0 + _0x1390b6 - 1;
    _0x5e1ca5 !== _0x46afbb && (_0x54d0d8.activeTexture(_0x46afbb), (_0x5e1ca5 = _0x46afbb));
  }
  function _0x465cd1(_0x4b301c, _0x40b9b7, _0x413ba6) {
    _0x413ba6 === undefined &&
      (_0x5e1ca5 === null ? (_0x413ba6 = _0x54d0d8.TEXTURE0 + _0x1390b6 - 1) : (_0x413ba6 = _0x5e1ca5));
    let _0x304794 = _0x14b58f[_0x413ba6];
    (_0x304794 === undefined &&
      ((_0x304794 = { type: undefined, texture: undefined }), (_0x14b58f[_0x413ba6] = _0x304794)),
      (_0x304794.type !== _0x4b301c || _0x304794.texture !== _0x40b9b7) &&
        (_0x5e1ca5 !== _0x413ba6 && (_0x54d0d8.activeTexture(_0x413ba6), (_0x5e1ca5 = _0x413ba6)),
        _0x54d0d8.bindTexture(_0x4b301c, _0x40b9b7 || _0xb02955[_0x4b301c]),
        (_0x304794.type = _0x4b301c),
        (_0x304794.texture = _0x40b9b7)));
  }
  function _0xdf7f1a() {
    const _0x887eb2 = _0x14b58f[_0x5e1ca5];
    _0x887eb2 !== undefined &&
      _0x887eb2.type !== undefined &&
      (_0x54d0d8.bindTexture(_0x887eb2.type, null),
      (_0x887eb2.type = undefined),
      (_0x887eb2.texture = undefined));
  }
  function _0x169bdf() {
    try {
      _0x54d0d8.compressedTexImage2D(...arguments);
    } catch (_0x3f124d) {
      console.error('THREE.WebGLState:', _0x3f124d);
    }
  }
  function _0x263855() {
    try {
      _0x54d0d8.compressedTexImage3D(...arguments);
    } catch (_0xc99645) {
      console.error('THREE.WebGLState:', _0xc99645);
    }
  }
  function _0x161e1d() {
    try {
      _0x54d0d8.texSubImage2D(...arguments);
    } catch (_0x253572) {
      console.error('THREE.WebGLState:', _0x253572);
    }
  }
  function _0x64c57() {
    try {
      _0x54d0d8.texSubImage3D(...arguments);
    } catch (_0x535c57) {
      console.error('THREE.WebGLState:', _0x535c57);
    }
  }
  function _0x14a7fc() {
    try {
      _0x54d0d8.compressedTexSubImage2D(...arguments);
    } catch (_0x595530) {
      console.error('THREE.WebGLState:', _0x595530);
    }
  }
  function _0x471015() {
    try {
      _0x54d0d8.compressedTexSubImage3D(...arguments);
    } catch (_0x18290) {
      console.error('THREE.WebGLState:', _0x18290);
    }
  }
  function _0x1ecc5a() {
    try {
      _0x54d0d8.texStorage2D(...arguments);
    } catch (_0x210923) {
      console.error('THREE.WebGLState:', _0x210923);
    }
  }
  function _0x39a5c0() {
    try {
      _0x54d0d8.texStorage3D(...arguments);
    } catch (_0x2efc7a) {
      console.error('THREE.WebGLState:', _0x2efc7a);
    }
  }
  function _0x3cb101() {
    try {
      _0x54d0d8.texImage2D(...arguments);
    } catch (_0x16b7cb) {
      console.error('THREE.WebGLState:', _0x16b7cb);
    }
  }
  function _0x1451f8() {
    try {
      _0x54d0d8.texImage3D(...arguments);
    } catch (_0x1a3b66) {
      console.error('THREE.WebGLState:', _0x1a3b66);
    }
  }
  function _0x329dae(_0x317ad6) {
    _0xab9d59.equals(_0x317ad6) === false &&
      (_0x54d0d8.scissor(_0x317ad6.x, _0x317ad6.y, _0x317ad6.z, _0x317ad6.w), _0xab9d59.copy(_0x317ad6));
  }
  function _0x2ed4c3(_0x6c785a) {
    _0x266e3c.equals(_0x6c785a) === false &&
      (_0x54d0d8.viewport(_0x6c785a.x, _0x6c785a.y, _0x6c785a.z, _0x6c785a.w), _0x266e3c.copy(_0x6c785a));
  }
  function _0x567ed4(_0x1211c4, _0x500f29) {
    let _0x39c004 = _0x228dfa.get(_0x500f29);
    _0x39c004 === undefined && ((_0x39c004 = new WeakMap()), _0x228dfa.set(_0x500f29, _0x39c004));
    let _0x123c3d = _0x39c004.get(_0x1211c4);
    _0x123c3d === undefined &&
      ((_0x123c3d = _0x54d0d8.getUniformBlockIndex(_0x500f29, _0x1211c4.name)),
      _0x39c004.set(_0x1211c4, _0x123c3d));
  }
  function _0x1d462f(_0x4b1152, _0x31f4d2) {
    const _0x57cfe6 = _0x228dfa.get(_0x31f4d2),
      _0x265469 = _0x57cfe6.get(_0x4b1152);
    _0x4ddc14.get(_0x31f4d2) !== _0x265469 &&
      (_0x54d0d8.uniformBlockBinding(_0x31f4d2, _0x265469, _0x4b1152.__bindingPointIndex),
      _0x4ddc14.set(_0x31f4d2, _0x265469));
  }
  function _0x4eab02() {
    (_0x54d0d8.disable(_0x54d0d8.BLEND),
      _0x54d0d8.disable(_0x54d0d8.CULL_FACE),
      _0x54d0d8.disable(_0x54d0d8.DEPTH_TEST),
      _0x54d0d8.disable(_0x54d0d8.POLYGON_OFFSET_FILL),
      _0x54d0d8.disable(_0x54d0d8.SCISSOR_TEST),
      _0x54d0d8.disable(_0x54d0d8.STENCIL_TEST),
      _0x54d0d8.disable(_0x54d0d8.SAMPLE_ALPHA_TO_COVERAGE),
      _0x54d0d8.blendEquation(_0x54d0d8.FUNC_ADD),
      _0x54d0d8.blendFunc(_0x54d0d8.ONE, _0x54d0d8.ZERO),
      _0x54d0d8.blendFuncSeparate(_0x54d0d8.ONE, _0x54d0d8.ZERO, _0x54d0d8.ONE, _0x54d0d8.ZERO),
      _0x54d0d8.blendColor(0, 0, 0, 0),
      _0x54d0d8.colorMask(true, true, true, true),
      _0x54d0d8.clearColor(0, 0, 0, 0),
      _0x54d0d8.depthMask(true),
      _0x54d0d8.depthFunc(_0x54d0d8.LESS),
      _0x5135d3.setReversed(false),
      _0x54d0d8.clearDepth(1),
      _0x54d0d8.stencilMask(0xffffffff),
      _0x54d0d8.stencilFunc(_0x54d0d8.ALWAYS, 0, 0xffffffff),
      _0x54d0d8.stencilOp(_0x54d0d8.KEEP, _0x54d0d8.KEEP, _0x54d0d8.KEEP),
      _0x54d0d8.clearStencil(0),
      _0x54d0d8.cullFace(_0x54d0d8.BACK),
      _0x54d0d8.frontFace(_0x54d0d8.CCW),
      _0x54d0d8.polygonOffset(0, 0),
      _0x54d0d8.activeTexture(_0x54d0d8.TEXTURE0),
      _0x54d0d8.bindFramebuffer(_0x54d0d8.FRAMEBUFFER, null),
      _0x54d0d8.bindFramebuffer(_0x54d0d8.DRAW_FRAMEBUFFER, null),
      _0x54d0d8.bindFramebuffer(_0x54d0d8.READ_FRAMEBUFFER, null),
      _0x54d0d8.useProgram(null),
      _0x54d0d8.lineWidth(1),
      _0x54d0d8.scissor(0, 0, _0x54d0d8.canvas.width, _0x54d0d8.canvas.height),
      _0x54d0d8.viewport(0, 0, _0x54d0d8.canvas.width, _0x54d0d8.canvas.height),
      (_0x464e66 = {}),
      (_0x5e1ca5 = null),
      (_0x14b58f = {}),
      (_0xeaa0bd = {}),
      (_0x357806 = new WeakMap()),
      (_0x349223 = []),
      (_0x1ae08f = null),
      (_0x5c9d56 = false),
      (_0xe6ccdb = null),
      (_0x271d8a = null),
      (_0x59bd1b = null),
      (_0x50f9d4 = null),
      (_0x112e3d = null),
      (_0x10b54e = null),
      (_0x3a75b2 = null),
      (_0x4a824a = new Color(0, 0, 0)),
      (_0x10491e = 0),
      (_0x4d9c97 = false),
      (_0x2a05ae = null),
      (_0x16f349 = null),
      (_0x543235 = null),
      (_0x17ab1d = null),
      (_0x470c4d = null),
      _0xab9d59.set(0, 0, _0x54d0d8.canvas.width, _0x54d0d8.canvas.height),
      _0x266e3c.set(0, 0, _0x54d0d8.canvas.width, _0x54d0d8.canvas.height),
      _0xb344b7.reset(),
      _0x5135d3.reset(),
      _0x298208.reset());
  }
  return {
    buffers: { color: _0xb344b7, depth: _0x5135d3, stencil: _0x298208 },
    enable: _0x19f0da,
    disable: _0x237e33,
    bindFramebuffer: _0x2b2224,
    drawBuffers: _0x57fdfd,
    useProgram: _0x19a3d3,
    setBlending: _0x5523e3,
    setMaterial: _0x5b25bb,
    setFlipSided: _0xc88699,
    setCullFace: _0x596d6f,
    setLineWidth: _0xba09c4,
    setPolygonOffset: _0x4ab084,
    setScissorTest: _0x19681e,
    activeTexture: _0x2e6ae7,
    bindTexture: _0x465cd1,
    unbindTexture: _0xdf7f1a,
    compressedTexImage2D: _0x169bdf,
    compressedTexImage3D: _0x263855,
    texImage2D: _0x3cb101,
    texImage3D: _0x1451f8,
    updateUBOMapping: _0x567ed4,
    uniformBlockBinding: _0x1d462f,
    texStorage2D: _0x1ecc5a,
    texStorage3D: _0x39a5c0,
    texSubImage2D: _0x161e1d,
    texSubImage3D: _0x64c57,
    compressedTexSubImage2D: _0x14a7fc,
    compressedTexSubImage3D: _0x471015,
    scissor: _0x329dae,
    viewport: _0x2ed4c3,
    reset: _0x4eab02,
  };
}
function WebGLTextures(_0x47faf7, _0x2076f8, _0x4f9503, _0x4ecfc8, _0xae6c85, _0x1c5738, _0x2ef175) {
  const _0x591282 = _0x2076f8.has('WEBGL_multisampled_render_to_texture')
      ? _0x2076f8.get('WEBGL_multisampled_render_to_texture')
      : null,
    _0x6b5f71 = typeof navigator === 'undefined' ? false : /OculusBrowser/g.test(navigator.userAgent),
    _0x25a4bd = new Vector2(),
    _0x314b10 = new WeakMap();
  let _0xc82fc5;
  const _0x23cfbf = new WeakMap();
  let _0x2c0d0a = false;
  try {
    _0x2c0d0a = typeof OffscreenCanvas !== 'undefined' && new OffscreenCanvas(1, 1).getContext('2d') !== null;
  } catch (_0x4d57d5) {}
  function _0x26725d(_0x925b15, _0x30cc6f) {
    return _0x2c0d0a ? new OffscreenCanvas(_0x925b15, _0x30cc6f) : createElementNS('canvas');
  }
  function _0xb11c21(_0x44df77, _0x325bfc, _0x3fbb00) {
    let _0x1c9442 = 1;
    const _0x45bb00 = _0x2d7e5a(_0x44df77);
    (_0x45bb00.width > _0x3fbb00 || _0x45bb00.height > _0x3fbb00) &&
      (_0x1c9442 = _0x3fbb00 / Math.max(_0x45bb00.width, _0x45bb00.height));
    if (_0x1c9442 < 1) {
      if (
        (typeof HTMLImageElement !== 'undefined' && _0x44df77 instanceof HTMLImageElement) ||
        (typeof HTMLCanvasElement !== 'undefined' && _0x44df77 instanceof HTMLCanvasElement) ||
        (typeof ImageBitmap !== 'undefined' && _0x44df77 instanceof ImageBitmap) ||
        (typeof VideoFrame !== 'undefined' && _0x44df77 instanceof VideoFrame)
      ) {
        const _0x1cdec6 = Math.floor(_0x1c9442 * _0x45bb00.width),
          _0x44661c = Math.floor(_0x1c9442 * _0x45bb00.height);
        if (_0xc82fc5 === undefined) _0xc82fc5 = _0x26725d(_0x1cdec6, _0x44661c);
        const _0x5c3321 = _0x325bfc ? _0x26725d(_0x1cdec6, _0x44661c) : _0xc82fc5;
        ((_0x5c3321.width = _0x1cdec6), (_0x5c3321.height = _0x44661c));
        const _0x2e4d43 = _0x5c3321.getContext('2d');
        return (
          _0x2e4d43.drawImage(_0x44df77, 0, 0, _0x1cdec6, _0x44661c),
          console.warn(
            'THREE.WebGLRenderer: Texture has been resized from (' +
              _0x45bb00.width +
              'x' +
              _0x45bb00.height +
              ') to (' +
              _0x1cdec6 +
              'x' +
              _0x44661c +
              ').',
          ),
          _0x5c3321
        );
      } else
        return (
          'data' in _0x44df77 &&
            console.warn(
              'THREE.WebGLRenderer: Image in DataTexture is too big (' +
                _0x45bb00.width +
                'x' +
                _0x45bb00.height +
                ').',
            ),
          _0x44df77
        );
    }
    return _0x44df77;
  }
  function _0x5a67b2(_0x8cca7a) {
    return _0x8cca7a.generateMipmaps;
  }
  function _0x3ee83c(_0x4d7c5f) {
    _0x47faf7.generateMipmap(_0x4d7c5f);
  }
  function _0x62a732(_0x456da8) {
    if (_0x456da8.isWebGLCubeRenderTarget) return _0x47faf7.TEXTURE_CUBE_MAP;
    if (_0x456da8.isWebGL3DRenderTarget) return _0x47faf7.TEXTURE_3D;
    if (_0x456da8.isWebGLArrayRenderTarget || _0x456da8.isCompressedArrayTexture)
      return _0x47faf7.TEXTURE_2D_ARRAY;
    return _0x47faf7.TEXTURE_2D;
  }
  function _0x33e41a(_0x44fe42, _0x221a02, _0x48b695, _0x421fbb, _0x3e8ffb = false) {
    if (_0x44fe42 !== null) {
      if (_0x47faf7[_0x44fe42] !== undefined) return _0x47faf7[_0x44fe42];
      console.warn(
        "THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '" + _0x44fe42 + "'",
      );
    }
    let _0x358b84 = _0x221a02;
    if (_0x221a02 === _0x47faf7.RED) {
      if (_0x48b695 === _0x47faf7.FLOAT) _0x358b84 = _0x47faf7.R32F;
      if (_0x48b695 === _0x47faf7.HALF_FLOAT) _0x358b84 = _0x47faf7.R16F;
      if (_0x48b695 === _0x47faf7.UNSIGNED_BYTE) _0x358b84 = _0x47faf7.R8;
    }
    if (_0x221a02 === _0x47faf7.RED_INTEGER) {
      if (_0x48b695 === _0x47faf7.UNSIGNED_BYTE) _0x358b84 = _0x47faf7.R8UI;
      if (_0x48b695 === _0x47faf7.UNSIGNED_SHORT) _0x358b84 = _0x47faf7.R16UI;
      if (_0x48b695 === _0x47faf7.UNSIGNED_INT) _0x358b84 = _0x47faf7.R32UI;
      if (_0x48b695 === _0x47faf7.BYTE) _0x358b84 = _0x47faf7.R8I;
      if (_0x48b695 === _0x47faf7.SHORT) _0x358b84 = _0x47faf7.R16I;
      if (_0x48b695 === _0x47faf7.INT) _0x358b84 = _0x47faf7.R32I;
    }
    if (_0x221a02 === _0x47faf7.RG) {
      if (_0x48b695 === _0x47faf7.FLOAT) _0x358b84 = _0x47faf7.RG32F;
      if (_0x48b695 === _0x47faf7.HALF_FLOAT) _0x358b84 = _0x47faf7.RG16F;
      if (_0x48b695 === _0x47faf7.UNSIGNED_BYTE) _0x358b84 = _0x47faf7.RG8;
    }
    if (_0x221a02 === _0x47faf7.RG_INTEGER) {
      if (_0x48b695 === _0x47faf7.UNSIGNED_BYTE) _0x358b84 = _0x47faf7.RG8UI;
      if (_0x48b695 === _0x47faf7.UNSIGNED_SHORT) _0x358b84 = _0x47faf7.RG16UI;
      if (_0x48b695 === _0x47faf7.UNSIGNED_INT) _0x358b84 = _0x47faf7.RG32UI;
      if (_0x48b695 === _0x47faf7.BYTE) _0x358b84 = _0x47faf7.RG8I;
      if (_0x48b695 === _0x47faf7.SHORT) _0x358b84 = _0x47faf7.RG16I;
      if (_0x48b695 === _0x47faf7.INT) _0x358b84 = _0x47faf7.RG32I;
    }
    if (_0x221a02 === _0x47faf7.RGB_INTEGER) {
      if (_0x48b695 === _0x47faf7.UNSIGNED_BYTE) _0x358b84 = _0x47faf7.RGB8UI;
      if (_0x48b695 === _0x47faf7.UNSIGNED_SHORT) _0x358b84 = _0x47faf7.RGB16UI;
      if (_0x48b695 === _0x47faf7.UNSIGNED_INT) _0x358b84 = _0x47faf7.RGB32UI;
      if (_0x48b695 === _0x47faf7.BYTE) _0x358b84 = _0x47faf7.RGB8I;
      if (_0x48b695 === _0x47faf7.SHORT) _0x358b84 = _0x47faf7.RGB16I;
      if (_0x48b695 === _0x47faf7.INT) _0x358b84 = _0x47faf7.RGB32I;
    }
    if (_0x221a02 === _0x47faf7.RGBA_INTEGER) {
      if (_0x48b695 === _0x47faf7.UNSIGNED_BYTE) _0x358b84 = _0x47faf7.RGBA8UI;
      if (_0x48b695 === _0x47faf7.UNSIGNED_SHORT) _0x358b84 = _0x47faf7.RGBA16UI;
      if (_0x48b695 === _0x47faf7.UNSIGNED_INT) _0x358b84 = _0x47faf7.RGBA32UI;
      if (_0x48b695 === _0x47faf7.BYTE) _0x358b84 = _0x47faf7.RGBA8I;
      if (_0x48b695 === _0x47faf7.SHORT) _0x358b84 = _0x47faf7.RGBA16I;
      if (_0x48b695 === _0x47faf7.INT) _0x358b84 = _0x47faf7.RGBA32I;
    }
    if (_0x221a02 === _0x47faf7.RGB) {
      if (_0x48b695 === _0x47faf7.UNSIGNED_INT_5_9_9_9_REV) _0x358b84 = _0x47faf7.RGB9_E5;
      if (_0x48b695 === _0x47faf7.UNSIGNED_INT_10F_11F_11F_REV) _0x358b84 = _0x47faf7.R11F_G11F_B10F;
    }
    if (_0x221a02 === _0x47faf7.RGBA) {
      const _0x309a86 = _0x3e8ffb ? LinearTransfer : ColorManagement.getTransfer(_0x421fbb);
      if (_0x48b695 === _0x47faf7.FLOAT) _0x358b84 = _0x47faf7.RGBA32F;
      if (_0x48b695 === _0x47faf7.HALF_FLOAT) _0x358b84 = _0x47faf7.RGBA16F;
      if (_0x48b695 === _0x47faf7.UNSIGNED_BYTE)
        _0x358b84 = _0x309a86 === SRGBTransfer ? _0x47faf7.SRGB8_ALPHA8 : _0x47faf7.RGBA8;
      if (_0x48b695 === _0x47faf7.UNSIGNED_SHORT_4_4_4_4) _0x358b84 = _0x47faf7.RGBA4;
      if (_0x48b695 === _0x47faf7.UNSIGNED_SHORT_5_5_5_1) _0x358b84 = _0x47faf7.RGB5_A1;
    }
    return (
      (_0x358b84 === _0x47faf7.R16F ||
        _0x358b84 === _0x47faf7.R32F ||
        _0x358b84 === _0x47faf7.RG16F ||
        _0x358b84 === _0x47faf7.RG32F ||
        _0x358b84 === _0x47faf7.RGBA16F ||
        _0x358b84 === _0x47faf7.RGBA32F) &&
        _0x2076f8.get('EXT_color_buffer_float'),
      _0x358b84
    );
  }
  function _0x344caa(_0x2f5a82, _0x1ece17) {
    let _0x1e4c0a;
    if (_0x2f5a82) {
      if (_0x1ece17 === null || _0x1ece17 === UnsignedIntType || _0x1ece17 === UnsignedInt248Type)
        _0x1e4c0a = _0x47faf7.DEPTH24_STENCIL8;
      else {
        if (_0x1ece17 === FloatType) _0x1e4c0a = _0x47faf7.DEPTH32F_STENCIL8;
        else
          _0x1ece17 === UnsignedShortType &&
            ((_0x1e4c0a = _0x47faf7.DEPTH24_STENCIL8),
            console.warn(
              'DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.',
            ));
      }
    } else {
      if (_0x1ece17 === null || _0x1ece17 === UnsignedIntType || _0x1ece17 === UnsignedInt248Type)
        _0x1e4c0a = _0x47faf7.DEPTH_COMPONENT24;
      else {
        if (_0x1ece17 === FloatType) _0x1e4c0a = _0x47faf7.DEPTH_COMPONENT32F;
        else _0x1ece17 === UnsignedShortType && (_0x1e4c0a = _0x47faf7.DEPTH_COMPONENT16);
      }
    }
    return _0x1e4c0a;
  }
  function _0x4fc695(_0x6631f4, _0x193aea) {
    if (
      _0x5a67b2(_0x6631f4) === true ||
      (_0x6631f4.isFramebufferTexture &&
        _0x6631f4.minFilter !== NearestFilter &&
        _0x6631f4.minFilter !== LinearFilter)
    )
      return Math.log2(Math.max(_0x193aea.width, _0x193aea.height)) + 1;
    else {
      if (_0x6631f4.mipmaps !== undefined && _0x6631f4.mipmaps.length > 0) return _0x6631f4.mipmaps.length;
      else
        return _0x6631f4.isCompressedTexture && Array.isArray(_0x6631f4.image) ? _0x193aea.mipmaps.length : 1;
    }
  }
  function _0x4d1cb9(_0x574fa3) {
    const _0x5e9469 = _0x574fa3.target;
    (_0x5e9469.removeEventListener('dispose', _0x4d1cb9),
      _0x1c2d7b(_0x5e9469),
      _0x5e9469.isVideoTexture && _0x314b10.delete(_0x5e9469));
  }
  function _0x42c065(_0x1b53d2) {
    const _0xee7b0 = _0x1b53d2.target;
    (_0xee7b0.removeEventListener('dispose', _0x42c065), _0x57802c(_0xee7b0));
  }
  function _0x1c2d7b(_0x505a8c) {
    const _0x4b10b6 = _0x4ecfc8.get(_0x505a8c);
    if (_0x4b10b6.__webglInit === undefined) return;
    const _0x45cc9c = _0x505a8c.source,
      _0x3795b7 = _0x23cfbf.get(_0x45cc9c);
    if (_0x3795b7) {
      const _0x3d2170 = _0x3795b7[_0x4b10b6.__cacheKey];
      (_0x3d2170.usedTimes--,
        _0x3d2170.usedTimes === 0 && _0x1d03c5(_0x505a8c),
        Object.keys(_0x3795b7).length === 0 && _0x23cfbf.delete(_0x45cc9c));
    }
    _0x4ecfc8.remove(_0x505a8c);
  }
  function _0x1d03c5(_0xeb299a) {
    const _0x16afcb = _0x4ecfc8.get(_0xeb299a);
    _0x47faf7.deleteTexture(_0x16afcb.__webglTexture);
    const _0x27885c = _0xeb299a.source,
      _0x30bf0f = _0x23cfbf.get(_0x27885c);
    (delete _0x30bf0f[_0x16afcb.__cacheKey], _0x2ef175.memory.textures--);
  }
  function _0x57802c(_0x201b1e) {
    const _0x506384 = _0x4ecfc8.get(_0x201b1e);
    _0x201b1e.depthTexture && (_0x201b1e.depthTexture.dispose(), _0x4ecfc8.remove(_0x201b1e.depthTexture));
    if (_0x201b1e.isWebGLCubeRenderTarget)
      for (let _0x14f3ae = 0; _0x14f3ae < 6; _0x14f3ae++) {
        if (Array.isArray(_0x506384.__webglFramebuffer[_0x14f3ae])) {
          for (let _0x212048 = 0; _0x212048 < _0x506384.__webglFramebuffer[_0x14f3ae].length; _0x212048++)
            _0x47faf7.deleteFramebuffer(_0x506384.__webglFramebuffer[_0x14f3ae][_0x212048]);
        } else _0x47faf7.deleteFramebuffer(_0x506384.__webglFramebuffer[_0x14f3ae]);
        if (_0x506384.__webglDepthbuffer)
          _0x47faf7.deleteRenderbuffer(_0x506384.__webglDepthbuffer[_0x14f3ae]);
      }
    else {
      if (Array.isArray(_0x506384.__webglFramebuffer)) {
        for (let _0x1cc7c8 = 0; _0x1cc7c8 < _0x506384.__webglFramebuffer.length; _0x1cc7c8++)
          _0x47faf7.deleteFramebuffer(_0x506384.__webglFramebuffer[_0x1cc7c8]);
      } else _0x47faf7.deleteFramebuffer(_0x506384.__webglFramebuffer);
      if (_0x506384.__webglDepthbuffer) _0x47faf7.deleteRenderbuffer(_0x506384.__webglDepthbuffer);
      if (_0x506384.__webglMultisampledFramebuffer)
        _0x47faf7.deleteFramebuffer(_0x506384.__webglMultisampledFramebuffer);
      if (_0x506384.__webglColorRenderbuffer)
        for (let _0x4b1008 = 0; _0x4b1008 < _0x506384.__webglColorRenderbuffer.length; _0x4b1008++) {
          if (_0x506384.__webglColorRenderbuffer[_0x4b1008])
            _0x47faf7.deleteRenderbuffer(_0x506384.__webglColorRenderbuffer[_0x4b1008]);
        }
      if (_0x506384.__webglDepthRenderbuffer)
        _0x47faf7.deleteRenderbuffer(_0x506384.__webglDepthRenderbuffer);
    }
    const _0x6237c = _0x201b1e.textures;
    for (let _0x31bb76 = 0, _0x1a6f70 = _0x6237c.length; _0x31bb76 < _0x1a6f70; _0x31bb76++) {
      const _0x56917f = _0x4ecfc8.get(_0x6237c[_0x31bb76]);
      (_0x56917f.__webglTexture &&
        (_0x47faf7.deleteTexture(_0x56917f.__webglTexture), _0x2ef175.memory.textures--),
        _0x4ecfc8.remove(_0x6237c[_0x31bb76]));
    }
    _0x4ecfc8.remove(_0x201b1e);
  }
  let _0x5a5ec1 = 0;
  function _0x4a84ba() {
    _0x5a5ec1 = 0;
  }
  function _0x4a0504() {
    const _0x433dfe = _0x5a5ec1;
    return (
      _0x433dfe >= _0xae6c85.maxTextures &&
        console.warn(
          'THREE.WebGLTextures: Trying to use ' +
            _0x433dfe +
            ' texture units while this GPU supports only ' +
            _0xae6c85.maxTextures,
        ),
      (_0x5a5ec1 += 1),
      _0x433dfe
    );
  }
  function _0x3bd5f5(_0x438d1f) {
    const _0x41b2b8 = [];
    return (
      _0x41b2b8.push(_0x438d1f.wrapS),
      _0x41b2b8.push(_0x438d1f.wrapT),
      _0x41b2b8.push(_0x438d1f.wrapR || 0),
      _0x41b2b8.push(_0x438d1f.magFilter),
      _0x41b2b8.push(_0x438d1f.minFilter),
      _0x41b2b8.push(_0x438d1f.anisotropy),
      _0x41b2b8.push(_0x438d1f.internalFormat),
      _0x41b2b8.push(_0x438d1f.format),
      _0x41b2b8.push(_0x438d1f.type),
      _0x41b2b8.push(_0x438d1f.generateMipmaps),
      _0x41b2b8.push(_0x438d1f.premultiplyAlpha),
      _0x41b2b8.push(_0x438d1f.flipY),
      _0x41b2b8.push(_0x438d1f.unpackAlignment),
      _0x41b2b8.push(_0x438d1f.colorSpace),
      _0x41b2b8.join()
    );
  }
  function _0x4e5d7b(_0x588626, _0xb48b08) {
    const _0x286a28 = _0x4ecfc8.get(_0x588626);
    if (_0x588626.isVideoTexture) _0x10f78e(_0x588626);
    if (
      _0x588626.isRenderTargetTexture === false &&
      _0x588626.isExternalTexture !== true &&
      _0x588626.version > 0 &&
      _0x286a28.__version !== _0x588626.version
    ) {
      const _0x2e49f6 = _0x588626.image;
      if (_0x2e49f6 === null)
        console.warn('THREE.WebGLRenderer: Texture marked for update but no image data found.');
      else {
        if (_0x2e49f6.complete === false)
          console.warn('THREE.WebGLRenderer: Texture marked for update but image is incomplete');
        else {
          _0x4f877a(_0x286a28, _0x588626, _0xb48b08);
          return;
        }
      }
    } else
      _0x588626.isExternalTexture &&
        (_0x286a28.__webglTexture = _0x588626.sourceTexture ? _0x588626.sourceTexture : null);
    _0x4f9503.bindTexture(_0x47faf7.TEXTURE_2D, _0x286a28.__webglTexture, _0x47faf7.TEXTURE0 + _0xb48b08);
  }
  function _0x5dddaa(_0x2e4560, _0x35d036) {
    const _0x4e5f14 = _0x4ecfc8.get(_0x2e4560);
    if (
      _0x2e4560.isRenderTargetTexture === false &&
      _0x2e4560.version > 0 &&
      _0x4e5f14.__version !== _0x2e4560.version
    ) {
      _0x4f877a(_0x4e5f14, _0x2e4560, _0x35d036);
      return;
    }
    _0x4f9503.bindTexture(
      _0x47faf7.TEXTURE_2D_ARRAY,
      _0x4e5f14.__webglTexture,
      _0x47faf7.TEXTURE0 + _0x35d036,
    );
  }
  function _0xc43700(_0x511b1a, _0x138350) {
    const _0x3f3458 = _0x4ecfc8.get(_0x511b1a);
    if (
      _0x511b1a.isRenderTargetTexture === false &&
      _0x511b1a.version > 0 &&
      _0x3f3458.__version !== _0x511b1a.version
    ) {
      _0x4f877a(_0x3f3458, _0x511b1a, _0x138350);
      return;
    }
    _0x4f9503.bindTexture(_0x47faf7.TEXTURE_3D, _0x3f3458.__webglTexture, _0x47faf7.TEXTURE0 + _0x138350);
  }
  function _0x49ca3f(_0x26c2c3, _0x4403b3) {
    const _0x3ca944 = _0x4ecfc8.get(_0x26c2c3);
    if (_0x26c2c3.version > 0 && _0x3ca944.__version !== _0x26c2c3.version) {
      _0x42d78a(_0x3ca944, _0x26c2c3, _0x4403b3);
      return;
    }
    _0x4f9503.bindTexture(
      _0x47faf7.TEXTURE_CUBE_MAP,
      _0x3ca944.__webglTexture,
      _0x47faf7.TEXTURE0 + _0x4403b3,
    );
  }
  const _0x691488 = {
      [RepeatWrapping]: _0x47faf7.REPEAT,
      [ClampToEdgeWrapping]: _0x47faf7.CLAMP_TO_EDGE,
      [MirroredRepeatWrapping]: _0x47faf7.MIRRORED_REPEAT,
    },
    _0x1352b3 = {
      [NearestFilter]: _0x47faf7.NEAREST,
      [NearestMipmapNearestFilter]: _0x47faf7.NEAREST_MIPMAP_NEAREST,
      [NearestMipmapLinearFilter]: _0x47faf7.NEAREST_MIPMAP_LINEAR,
      [LinearFilter]: _0x47faf7.LINEAR,
      [LinearMipmapNearestFilter]: _0x47faf7.LINEAR_MIPMAP_NEAREST,
      [LinearMipmapLinearFilter]: _0x47faf7.LINEAR_MIPMAP_LINEAR,
    },
    _0x2d2c32 = {
      [NeverCompare]: _0x47faf7.NEVER,
      [AlwaysCompare]: _0x47faf7.ALWAYS,
      [LessCompare]: _0x47faf7.LESS,
      [LessEqualCompare]: _0x47faf7.LEQUAL,
      [EqualCompare]: _0x47faf7.EQUAL,
      [GreaterEqualCompare]: _0x47faf7.GEQUAL,
      [GreaterCompare]: _0x47faf7.GREATER,
      [NotEqualCompare]: _0x47faf7.NOTEQUAL,
    };
  function _0x5b36f9(_0xa86bd0, _0x4333be) {
    _0x4333be.type === FloatType &&
      _0x2076f8.has('OES_texture_float_linear') === false &&
      (_0x4333be.magFilter === LinearFilter ||
        _0x4333be.magFilter === LinearMipmapNearestFilter ||
        _0x4333be.magFilter === NearestMipmapLinearFilter ||
        _0x4333be.magFilter === LinearMipmapLinearFilter ||
        _0x4333be.minFilter === LinearFilter ||
        _0x4333be.minFilter === LinearMipmapNearestFilter ||
        _0x4333be.minFilter === NearestMipmapLinearFilter ||
        _0x4333be.minFilter === LinearMipmapLinearFilter) &&
      console.warn(
        'THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.',
      );
    (_0x47faf7.texParameteri(_0xa86bd0, _0x47faf7.TEXTURE_WRAP_S, _0x691488[_0x4333be.wrapS]),
      _0x47faf7.texParameteri(_0xa86bd0, _0x47faf7.TEXTURE_WRAP_T, _0x691488[_0x4333be.wrapT]));
    (_0xa86bd0 === _0x47faf7.TEXTURE_3D || _0xa86bd0 === _0x47faf7.TEXTURE_2D_ARRAY) &&
      _0x47faf7.texParameteri(_0xa86bd0, _0x47faf7.TEXTURE_WRAP_R, _0x691488[_0x4333be.wrapR]);
    (_0x47faf7.texParameteri(_0xa86bd0, _0x47faf7.TEXTURE_MAG_FILTER, _0x1352b3[_0x4333be.magFilter]),
      _0x47faf7.texParameteri(_0xa86bd0, _0x47faf7.TEXTURE_MIN_FILTER, _0x1352b3[_0x4333be.minFilter]));
    _0x4333be.compareFunction &&
      (_0x47faf7.texParameteri(_0xa86bd0, _0x47faf7.TEXTURE_COMPARE_MODE, _0x47faf7.COMPARE_REF_TO_TEXTURE),
      _0x47faf7.texParameteri(
        _0xa86bd0,
        _0x47faf7.TEXTURE_COMPARE_FUNC,
        _0x2d2c32[_0x4333be.compareFunction],
      ));
    if (_0x2076f8.has('EXT_texture_filter_anisotropic') === true) {
      if (_0x4333be.magFilter === NearestFilter) return;
      if (
        _0x4333be.minFilter !== NearestMipmapLinearFilter &&
        _0x4333be.minFilter !== LinearMipmapLinearFilter
      )
        return;
      if (_0x4333be.type === FloatType && _0x2076f8.has('OES_texture_float_linear') === false) return;
      if (_0x4333be.anisotropy > 1 || _0x4ecfc8.get(_0x4333be).__currentAnisotropy) {
        const _0xed9bca = _0x2076f8.get('EXT_texture_filter_anisotropic');
        (_0x47faf7.texParameterf(
          _0xa86bd0,
          _0xed9bca.TEXTURE_MAX_ANISOTROPY_EXT,
          Math.min(_0x4333be.anisotropy, _0xae6c85.getMaxAnisotropy()),
        ),
          (_0x4ecfc8.get(_0x4333be).__currentAnisotropy = _0x4333be.anisotropy));
      }
    }
  }
  function _0x546b16(_0x5f312f, _0x32b2b1) {
    let _0x2fff37 = false;
    _0x5f312f.__webglInit === undefined &&
      ((_0x5f312f.__webglInit = true), _0x32b2b1.addEventListener('dispose', _0x4d1cb9));
    const _0x2c9028 = _0x32b2b1.source;
    let _0x39f92a = _0x23cfbf.get(_0x2c9028);
    _0x39f92a === undefined && ((_0x39f92a = {}), _0x23cfbf.set(_0x2c9028, _0x39f92a));
    const _0x5008de = _0x3bd5f5(_0x32b2b1);
    if (_0x5008de !== _0x5f312f.__cacheKey) {
      _0x39f92a[_0x5008de] === undefined &&
        ((_0x39f92a[_0x5008de] = { texture: _0x47faf7.createTexture(), usedTimes: 0 }),
        _0x2ef175.memory.textures++,
        (_0x2fff37 = true));
      _0x39f92a[_0x5008de].usedTimes++;
      const _0x587809 = _0x39f92a[_0x5f312f.__cacheKey];
      (_0x587809 !== undefined &&
        (_0x39f92a[_0x5f312f.__cacheKey].usedTimes--, _0x587809.usedTimes === 0 && _0x1d03c5(_0x32b2b1)),
        (_0x5f312f.__cacheKey = _0x5008de),
        (_0x5f312f.__webglTexture = _0x39f92a[_0x5008de].texture));
    }
    return _0x2fff37;
  }
  function _0x45e51c(_0x513271, _0x3bac72, _0x336bf4) {
    return Math.floor(Math.floor(_0x513271 / _0x336bf4) / _0x3bac72);
  }
  function _0x1cfc77(_0x4706d8, _0x4a9347, _0x403868, _0x24848b) {
    const _0x27c808 = 4,
      _0x9b014a = _0x4706d8.updateRanges;
    if (_0x9b014a.length === 0)
      _0x4f9503.texSubImage2D(
        _0x47faf7.TEXTURE_2D,
        0,
        0,
        0,
        _0x4a9347.width,
        _0x4a9347.height,
        _0x403868,
        _0x24848b,
        _0x4a9347.data,
      );
    else {
      _0x9b014a.sort((_0x218448, _0x235592) => _0x218448.start - _0x235592.start);
      let _0x30fda7 = 0;
      for (let _0x4cf364 = 1; _0x4cf364 < _0x9b014a.length; _0x4cf364++) {
        const _0x274655 = _0x9b014a[_0x30fda7],
          _0x2d1277 = _0x9b014a[_0x4cf364],
          _0x2c00d4 = _0x274655.start + _0x274655.count,
          _0x36eeb7 = _0x45e51c(_0x2d1277.start, _0x4a9347.width, _0x27c808),
          _0x1f6800 = _0x45e51c(_0x274655.start, _0x4a9347.width, _0x27c808);
        _0x2d1277.start <= _0x2c00d4 + 1 &&
        _0x36eeb7 === _0x1f6800 &&
        _0x45e51c(_0x2d1277.start + _0x2d1277.count - 1, _0x4a9347.width, _0x27c808) === _0x36eeb7
          ? (_0x274655.count = Math.max(_0x274655.count, _0x2d1277.start + _0x2d1277.count - _0x274655.start))
          : (++_0x30fda7, (_0x9b014a[_0x30fda7] = _0x2d1277));
      }
      _0x9b014a.length = _0x30fda7 + 1;
      const _0x21bbbc = _0x47faf7.getParameter(_0x47faf7.UNPACK_ROW_LENGTH),
        _0x3d9384 = _0x47faf7.getParameter(_0x47faf7.UNPACK_SKIP_PIXELS),
        _0x5466c7 = _0x47faf7.getParameter(_0x47faf7.UNPACK_SKIP_ROWS);
      _0x47faf7.pixelStorei(_0x47faf7.UNPACK_ROW_LENGTH, _0x4a9347.width);
      for (let _0xb5e390 = 0, _0xc724b0 = _0x9b014a.length; _0xb5e390 < _0xc724b0; _0xb5e390++) {
        const _0x13210b = _0x9b014a[_0xb5e390],
          _0x5c9d1e = Math.floor(_0x13210b.start / _0x27c808),
          _0x3df4a6 = Math.ceil(_0x13210b.count / _0x27c808),
          _0x552686 = _0x5c9d1e % _0x4a9347.width,
          _0x256e22 = Math.floor(_0x5c9d1e / _0x4a9347.width),
          _0x14fd8e = _0x3df4a6,
          _0x291232 = 1;
        (_0x47faf7.pixelStorei(_0x47faf7.UNPACK_SKIP_PIXELS, _0x552686),
          _0x47faf7.pixelStorei(_0x47faf7.UNPACK_SKIP_ROWS, _0x256e22),
          _0x4f9503.texSubImage2D(
            _0x47faf7.TEXTURE_2D,
            0,
            _0x552686,
            _0x256e22,
            _0x14fd8e,
            _0x291232,
            _0x403868,
            _0x24848b,
            _0x4a9347.data,
          ));
      }
      (_0x4706d8.clearUpdateRanges(),
        _0x47faf7.pixelStorei(_0x47faf7.UNPACK_ROW_LENGTH, _0x21bbbc),
        _0x47faf7.pixelStorei(_0x47faf7.UNPACK_SKIP_PIXELS, _0x3d9384),
        _0x47faf7.pixelStorei(_0x47faf7.UNPACK_SKIP_ROWS, _0x5466c7));
    }
  }
  function _0x4f877a(_0x37b765, _0x3fbde6, _0x160b37) {
    let _0x532e07 = _0x47faf7.TEXTURE_2D;
    if (_0x3fbde6.isDataArrayTexture || _0x3fbde6.isCompressedArrayTexture)
      _0x532e07 = _0x47faf7.TEXTURE_2D_ARRAY;
    if (_0x3fbde6.isData3DTexture) _0x532e07 = _0x47faf7.TEXTURE_3D;
    const _0x3635d6 = _0x546b16(_0x37b765, _0x3fbde6),
      _0x566d49 = _0x3fbde6.source;
    _0x4f9503.bindTexture(_0x532e07, _0x37b765.__webglTexture, _0x47faf7.TEXTURE0 + _0x160b37);
    const _0x329562 = _0x4ecfc8.get(_0x566d49);
    if (_0x566d49.version !== _0x329562.__version || _0x3635d6 === true) {
      _0x4f9503.activeTexture(_0x47faf7.TEXTURE0 + _0x160b37);
      const _0x48a1ad = ColorManagement.getPrimaries(ColorManagement.workingColorSpace),
        _0x1e5207 =
          _0x3fbde6.colorSpace === NoColorSpace ? null : ColorManagement.getPrimaries(_0x3fbde6.colorSpace),
        _0x27a500 =
          _0x3fbde6.colorSpace === NoColorSpace || _0x48a1ad === _0x1e5207
            ? _0x47faf7.NONE
            : _0x47faf7.BROWSER_DEFAULT_WEBGL;
      (_0x47faf7.pixelStorei(_0x47faf7.UNPACK_FLIP_Y_WEBGL, _0x3fbde6.flipY),
        _0x47faf7.pixelStorei(_0x47faf7.UNPACK_PREMULTIPLY_ALPHA_WEBGL, _0x3fbde6.premultiplyAlpha),
        _0x47faf7.pixelStorei(_0x47faf7.UNPACK_ALIGNMENT, _0x3fbde6.unpackAlignment),
        _0x47faf7.pixelStorei(_0x47faf7.UNPACK_COLORSPACE_CONVERSION_WEBGL, _0x27a500));
      let _0x5263ef = _0xb11c21(_0x3fbde6.image, false, _0xae6c85.maxTextureSize);
      _0x5263ef = _0x20cbac(_0x3fbde6, _0x5263ef);
      const _0xc6e4a5 = _0x1c5738.convert(_0x3fbde6.format, _0x3fbde6.colorSpace),
        _0x174185 = _0x1c5738.convert(_0x3fbde6.type);
      let _0x216933 = _0x33e41a(
        _0x3fbde6.internalFormat,
        _0xc6e4a5,
        _0x174185,
        _0x3fbde6.colorSpace,
        _0x3fbde6.isVideoTexture,
      );
      _0x5b36f9(_0x532e07, _0x3fbde6);
      let _0x1dc0a4;
      const _0x50c4ae = _0x3fbde6.mipmaps,
        _0x478167 = _0x3fbde6.isVideoTexture !== true,
        _0x21cee0 = _0x329562.__version === undefined || _0x3635d6 === true,
        _0x10cffb = _0x566d49.dataReady,
        _0x5621e0 = _0x4fc695(_0x3fbde6, _0x5263ef);
      if (_0x3fbde6.isDepthTexture)
        ((_0x216933 = _0x344caa(_0x3fbde6.format === DepthStencilFormat, _0x3fbde6.type)),
          _0x21cee0 &&
            (_0x478167
              ? _0x4f9503.texStorage2D(_0x47faf7.TEXTURE_2D, 1, _0x216933, _0x5263ef.width, _0x5263ef.height)
              : _0x4f9503.texImage2D(
                  _0x47faf7.TEXTURE_2D,
                  0,
                  _0x216933,
                  _0x5263ef.width,
                  _0x5263ef.height,
                  0,
                  _0xc6e4a5,
                  _0x174185,
                  null,
                )));
      else {
        if (_0x3fbde6.isDataTexture) {
          if (_0x50c4ae.length > 0) {
            _0x478167 &&
              _0x21cee0 &&
              _0x4f9503.texStorage2D(
                _0x47faf7.TEXTURE_2D,
                _0x5621e0,
                _0x216933,
                _0x50c4ae[0].width,
                _0x50c4ae[0].height,
              );
            for (let _0x5c5751 = 0, _0x31a208 = _0x50c4ae.length; _0x5c5751 < _0x31a208; _0x5c5751++) {
              ((_0x1dc0a4 = _0x50c4ae[_0x5c5751]),
                _0x478167
                  ? _0x10cffb &&
                    _0x4f9503.texSubImage2D(
                      _0x47faf7.TEXTURE_2D,
                      _0x5c5751,
                      0,
                      0,
                      _0x1dc0a4.width,
                      _0x1dc0a4.height,
                      _0xc6e4a5,
                      _0x174185,
                      _0x1dc0a4.data,
                    )
                  : _0x4f9503.texImage2D(
                      _0x47faf7.TEXTURE_2D,
                      _0x5c5751,
                      _0x216933,
                      _0x1dc0a4.width,
                      _0x1dc0a4.height,
                      0,
                      _0xc6e4a5,
                      _0x174185,
                      _0x1dc0a4.data,
                    ));
            }
            _0x3fbde6.generateMipmaps = false;
          } else
            _0x478167
              ? (_0x21cee0 &&
                  _0x4f9503.texStorage2D(
                    _0x47faf7.TEXTURE_2D,
                    _0x5621e0,
                    _0x216933,
                    _0x5263ef.width,
                    _0x5263ef.height,
                  ),
                _0x10cffb && _0x1cfc77(_0x3fbde6, _0x5263ef, _0xc6e4a5, _0x174185))
              : _0x4f9503.texImage2D(
                  _0x47faf7.TEXTURE_2D,
                  0,
                  _0x216933,
                  _0x5263ef.width,
                  _0x5263ef.height,
                  0,
                  _0xc6e4a5,
                  _0x174185,
                  _0x5263ef.data,
                );
        } else {
          if (_0x3fbde6.isCompressedTexture) {
            if (_0x3fbde6.isCompressedArrayTexture) {
              _0x478167 &&
                _0x21cee0 &&
                _0x4f9503.texStorage3D(
                  _0x47faf7.TEXTURE_2D_ARRAY,
                  _0x5621e0,
                  _0x216933,
                  _0x50c4ae[0].width,
                  _0x50c4ae[0].height,
                  _0x5263ef.depth,
                );
              for (let _0x426ec0 = 0, _0x19a360 = _0x50c4ae.length; _0x426ec0 < _0x19a360; _0x426ec0++) {
                _0x1dc0a4 = _0x50c4ae[_0x426ec0];
                if (_0x3fbde6.format !== RGBAFormat) {
                  if (_0xc6e4a5 !== null) {
                    if (_0x478167) {
                      if (_0x10cffb) {
                        if (_0x3fbde6.layerUpdates.size > 0) {
                          const _0x57f00f = getByteLength(
                            _0x1dc0a4.width,
                            _0x1dc0a4.height,
                            _0x3fbde6.format,
                            _0x3fbde6.type,
                          );
                          for (const _0x25a552 of _0x3fbde6.layerUpdates) {
                            const _0x33689 = _0x1dc0a4.data.subarray(
                              (_0x25a552 * _0x57f00f) / _0x1dc0a4.data.BYTES_PER_ELEMENT,
                              ((_0x25a552 + 1) * _0x57f00f) / _0x1dc0a4.data.BYTES_PER_ELEMENT,
                            );
                            _0x4f9503.compressedTexSubImage3D(
                              _0x47faf7.TEXTURE_2D_ARRAY,
                              _0x426ec0,
                              0,
                              0,
                              _0x25a552,
                              _0x1dc0a4.width,
                              _0x1dc0a4.height,
                              1,
                              _0xc6e4a5,
                              _0x33689,
                            );
                          }
                          _0x3fbde6.clearLayerUpdates();
                        } else
                          _0x4f9503.compressedTexSubImage3D(
                            _0x47faf7.TEXTURE_2D_ARRAY,
                            _0x426ec0,
                            0,
                            0,
                            0,
                            _0x1dc0a4.width,
                            _0x1dc0a4.height,
                            _0x5263ef.depth,
                            _0xc6e4a5,
                            _0x1dc0a4.data,
                          );
                      }
                    } else
                      _0x4f9503.compressedTexImage3D(
                        _0x47faf7.TEXTURE_2D_ARRAY,
                        _0x426ec0,
                        _0x216933,
                        _0x1dc0a4.width,
                        _0x1dc0a4.height,
                        _0x5263ef.depth,
                        0,
                        _0x1dc0a4.data,
                        0,
                        0,
                      );
                  } else
                    console.warn(
                      'THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()',
                    );
                } else
                  _0x478167
                    ? _0x10cffb &&
                      _0x4f9503.texSubImage3D(
                        _0x47faf7.TEXTURE_2D_ARRAY,
                        _0x426ec0,
                        0,
                        0,
                        0,
                        _0x1dc0a4.width,
                        _0x1dc0a4.height,
                        _0x5263ef.depth,
                        _0xc6e4a5,
                        _0x174185,
                        _0x1dc0a4.data,
                      )
                    : _0x4f9503.texImage3D(
                        _0x47faf7.TEXTURE_2D_ARRAY,
                        _0x426ec0,
                        _0x216933,
                        _0x1dc0a4.width,
                        _0x1dc0a4.height,
                        _0x5263ef.depth,
                        0,
                        _0xc6e4a5,
                        _0x174185,
                        _0x1dc0a4.data,
                      );
              }
            } else {
              _0x478167 &&
                _0x21cee0 &&
                _0x4f9503.texStorage2D(
                  _0x47faf7.TEXTURE_2D,
                  _0x5621e0,
                  _0x216933,
                  _0x50c4ae[0].width,
                  _0x50c4ae[0].height,
                );
              for (let _0x15d0ea = 0, _0x26f5c8 = _0x50c4ae.length; _0x15d0ea < _0x26f5c8; _0x15d0ea++) {
                ((_0x1dc0a4 = _0x50c4ae[_0x15d0ea]),
                  _0x3fbde6.format !== RGBAFormat
                    ? _0xc6e4a5 !== null
                      ? _0x478167
                        ? _0x10cffb &&
                          _0x4f9503.compressedTexSubImage2D(
                            _0x47faf7.TEXTURE_2D,
                            _0x15d0ea,
                            0,
                            0,
                            _0x1dc0a4.width,
                            _0x1dc0a4.height,
                            _0xc6e4a5,
                            _0x1dc0a4.data,
                          )
                        : _0x4f9503.compressedTexImage2D(
                            _0x47faf7.TEXTURE_2D,
                            _0x15d0ea,
                            _0x216933,
                            _0x1dc0a4.width,
                            _0x1dc0a4.height,
                            0,
                            _0x1dc0a4.data,
                          )
                      : console.warn(
                          'THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()',
                        )
                    : _0x478167
                      ? _0x10cffb &&
                        _0x4f9503.texSubImage2D(
                          _0x47faf7.TEXTURE_2D,
                          _0x15d0ea,
                          0,
                          0,
                          _0x1dc0a4.width,
                          _0x1dc0a4.height,
                          _0xc6e4a5,
                          _0x174185,
                          _0x1dc0a4.data,
                        )
                      : _0x4f9503.texImage2D(
                          _0x47faf7.TEXTURE_2D,
                          _0x15d0ea,
                          _0x216933,
                          _0x1dc0a4.width,
                          _0x1dc0a4.height,
                          0,
                          _0xc6e4a5,
                          _0x174185,
                          _0x1dc0a4.data,
                        ));
              }
            }
          } else {
            if (_0x3fbde6.isDataArrayTexture) {
              if (_0x478167) {
                _0x21cee0 &&
                  _0x4f9503.texStorage3D(
                    _0x47faf7.TEXTURE_2D_ARRAY,
                    _0x5621e0,
                    _0x216933,
                    _0x5263ef.width,
                    _0x5263ef.height,
                    _0x5263ef.depth,
                  );
                if (_0x10cffb) {
                  if (_0x3fbde6.layerUpdates.size > 0) {
                    const _0x10ca10 = getByteLength(
                      _0x5263ef.width,
                      _0x5263ef.height,
                      _0x3fbde6.format,
                      _0x3fbde6.type,
                    );
                    for (const _0x50bff8 of _0x3fbde6.layerUpdates) {
                      const _0x3c6e65 = _0x5263ef.data.subarray(
                        (_0x50bff8 * _0x10ca10) / _0x5263ef.data.BYTES_PER_ELEMENT,
                        ((_0x50bff8 + 1) * _0x10ca10) / _0x5263ef.data.BYTES_PER_ELEMENT,
                      );
                      _0x4f9503.texSubImage3D(
                        _0x47faf7.TEXTURE_2D_ARRAY,
                        0,
                        0,
                        0,
                        _0x50bff8,
                        _0x5263ef.width,
                        _0x5263ef.height,
                        1,
                        _0xc6e4a5,
                        _0x174185,
                        _0x3c6e65,
                      );
                    }
                    _0x3fbde6.clearLayerUpdates();
                  } else
                    _0x4f9503.texSubImage3D(
                      _0x47faf7.TEXTURE_2D_ARRAY,
                      0,
                      0,
                      0,
                      0,
                      _0x5263ef.width,
                      _0x5263ef.height,
                      _0x5263ef.depth,
                      _0xc6e4a5,
                      _0x174185,
                      _0x5263ef.data,
                    );
                }
              } else
                _0x4f9503.texImage3D(
                  _0x47faf7.TEXTURE_2D_ARRAY,
                  0,
                  _0x216933,
                  _0x5263ef.width,
                  _0x5263ef.height,
                  _0x5263ef.depth,
                  0,
                  _0xc6e4a5,
                  _0x174185,
                  _0x5263ef.data,
                );
            } else {
              if (_0x3fbde6.isData3DTexture)
                _0x478167
                  ? (_0x21cee0 &&
                      _0x4f9503.texStorage3D(
                        _0x47faf7.TEXTURE_3D,
                        _0x5621e0,
                        _0x216933,
                        _0x5263ef.width,
                        _0x5263ef.height,
                        _0x5263ef.depth,
                      ),
                    _0x10cffb &&
                      _0x4f9503.texSubImage3D(
                        _0x47faf7.TEXTURE_3D,
                        0,
                        0,
                        0,
                        0,
                        _0x5263ef.width,
                        _0x5263ef.height,
                        _0x5263ef.depth,
                        _0xc6e4a5,
                        _0x174185,
                        _0x5263ef.data,
                      ))
                  : _0x4f9503.texImage3D(
                      _0x47faf7.TEXTURE_3D,
                      0,
                      _0x216933,
                      _0x5263ef.width,
                      _0x5263ef.height,
                      _0x5263ef.depth,
                      0,
                      _0xc6e4a5,
                      _0x174185,
                      _0x5263ef.data,
                    );
              else {
                if (_0x3fbde6.isFramebufferTexture) {
                  if (_0x21cee0) {
                    if (_0x478167)
                      _0x4f9503.texStorage2D(
                        _0x47faf7.TEXTURE_2D,
                        _0x5621e0,
                        _0x216933,
                        _0x5263ef.width,
                        _0x5263ef.height,
                      );
                    else {
                      let _0x5cec9a = _0x5263ef.width,
                        _0x55dab7 = _0x5263ef.height;
                      for (let _0x18cd5f = 0; _0x18cd5f < _0x5621e0; _0x18cd5f++) {
                        (_0x4f9503.texImage2D(
                          _0x47faf7.TEXTURE_2D,
                          _0x18cd5f,
                          _0x216933,
                          _0x5cec9a,
                          _0x55dab7,
                          0,
                          _0xc6e4a5,
                          _0x174185,
                          null,
                        ),
                          (_0x5cec9a >>= 1),
                          (_0x55dab7 >>= 1));
                      }
                    }
                  }
                } else {
                  if (_0x50c4ae.length > 0) {
                    if (_0x478167 && _0x21cee0) {
                      const _0x1067d5 = _0x2d7e5a(_0x50c4ae[0]);
                      _0x4f9503.texStorage2D(
                        _0x47faf7.TEXTURE_2D,
                        _0x5621e0,
                        _0x216933,
                        _0x1067d5.width,
                        _0x1067d5.height,
                      );
                    }
                    for (
                      let _0x548dd2 = 0, _0x2587df = _0x50c4ae.length;
                      _0x548dd2 < _0x2587df;
                      _0x548dd2++
                    ) {
                      ((_0x1dc0a4 = _0x50c4ae[_0x548dd2]),
                        _0x478167
                          ? _0x10cffb &&
                            _0x4f9503.texSubImage2D(
                              _0x47faf7.TEXTURE_2D,
                              _0x548dd2,
                              0,
                              0,
                              _0xc6e4a5,
                              _0x174185,
                              _0x1dc0a4,
                            )
                          : _0x4f9503.texImage2D(
                              _0x47faf7.TEXTURE_2D,
                              _0x548dd2,
                              _0x216933,
                              _0xc6e4a5,
                              _0x174185,
                              _0x1dc0a4,
                            ));
                    }
                    _0x3fbde6.generateMipmaps = false;
                  } else {
                    if (_0x478167) {
                      if (_0x21cee0) {
                        const _0x4c08bb = _0x2d7e5a(_0x5263ef);
                        _0x4f9503.texStorage2D(
                          _0x47faf7.TEXTURE_2D,
                          _0x5621e0,
                          _0x216933,
                          _0x4c08bb.width,
                          _0x4c08bb.height,
                        );
                      }
                      _0x10cffb &&
                        _0x4f9503.texSubImage2D(
                          _0x47faf7.TEXTURE_2D,
                          0,
                          0,
                          0,
                          _0xc6e4a5,
                          _0x174185,
                          _0x5263ef,
                        );
                    } else
                      _0x4f9503.texImage2D(
                        _0x47faf7.TEXTURE_2D,
                        0,
                        _0x216933,
                        _0xc6e4a5,
                        _0x174185,
                        _0x5263ef,
                      );
                  }
                }
              }
            }
          }
        }
      }
      _0x5a67b2(_0x3fbde6) && _0x3ee83c(_0x532e07);
      _0x329562.__version = _0x566d49.version;
      if (_0x3fbde6.onUpdate) _0x3fbde6.onUpdate(_0x3fbde6);
    }
    _0x37b765.__version = _0x3fbde6.version;
  }
  function _0x42d78a(_0x1d3ffc, _0x20c1df, _0x112d8d) {
    if (_0x20c1df.image.length !== 6) return;
    const _0x35d356 = _0x546b16(_0x1d3ffc, _0x20c1df),
      _0x401b2c = _0x20c1df.source;
    _0x4f9503.bindTexture(
      _0x47faf7.TEXTURE_CUBE_MAP,
      _0x1d3ffc.__webglTexture,
      _0x47faf7.TEXTURE0 + _0x112d8d,
    );
    const _0x7f6655 = _0x4ecfc8.get(_0x401b2c);
    if (_0x401b2c.version !== _0x7f6655.__version || _0x35d356 === true) {
      _0x4f9503.activeTexture(_0x47faf7.TEXTURE0 + _0x112d8d);
      const _0xeecf9 = ColorManagement.getPrimaries(ColorManagement.workingColorSpace),
        _0xbf3a5 =
          _0x20c1df.colorSpace === NoColorSpace ? null : ColorManagement.getPrimaries(_0x20c1df.colorSpace),
        _0x246250 =
          _0x20c1df.colorSpace === NoColorSpace || _0xeecf9 === _0xbf3a5
            ? _0x47faf7.NONE
            : _0x47faf7.BROWSER_DEFAULT_WEBGL;
      (_0x47faf7.pixelStorei(_0x47faf7.UNPACK_FLIP_Y_WEBGL, _0x20c1df.flipY),
        _0x47faf7.pixelStorei(_0x47faf7.UNPACK_PREMULTIPLY_ALPHA_WEBGL, _0x20c1df.premultiplyAlpha),
        _0x47faf7.pixelStorei(_0x47faf7.UNPACK_ALIGNMENT, _0x20c1df.unpackAlignment),
        _0x47faf7.pixelStorei(_0x47faf7.UNPACK_COLORSPACE_CONVERSION_WEBGL, _0x246250));
      const _0x39a8ae = _0x20c1df.isCompressedTexture || _0x20c1df.image[0].isCompressedTexture,
        _0x11038e = _0x20c1df.image[0] && _0x20c1df.image[0].isDataTexture,
        _0x2749a7 = [];
      for (let _0x256d25 = 0; _0x256d25 < 6; _0x256d25++) {
        (!_0x39a8ae && !_0x11038e
          ? (_0x2749a7[_0x256d25] = _0xb11c21(_0x20c1df.image[_0x256d25], true, _0xae6c85.maxCubemapSize))
          : (_0x2749a7[_0x256d25] = _0x11038e
              ? _0x20c1df.image[_0x256d25].image
              : _0x20c1df.image[_0x256d25]),
          (_0x2749a7[_0x256d25] = _0x20cbac(_0x20c1df, _0x2749a7[_0x256d25])));
      }
      const _0x39330a = _0x2749a7[0],
        _0x331cef = _0x1c5738.convert(_0x20c1df.format, _0x20c1df.colorSpace),
        _0x2451f6 = _0x1c5738.convert(_0x20c1df.type),
        _0xa92764 = _0x33e41a(_0x20c1df.internalFormat, _0x331cef, _0x2451f6, _0x20c1df.colorSpace),
        _0x573f84 = _0x20c1df.isVideoTexture !== true,
        _0x2cbc71 = _0x7f6655.__version === undefined || _0x35d356 === true,
        _0x12cb9f = _0x401b2c.dataReady;
      let _0x45b0df = _0x4fc695(_0x20c1df, _0x39330a);
      _0x5b36f9(_0x47faf7.TEXTURE_CUBE_MAP, _0x20c1df);
      let _0x5cbc30;
      if (_0x39a8ae) {
        _0x573f84 &&
          _0x2cbc71 &&
          _0x4f9503.texStorage2D(
            _0x47faf7.TEXTURE_CUBE_MAP,
            _0x45b0df,
            _0xa92764,
            _0x39330a.width,
            _0x39330a.height,
          );
        for (let _0x1b1b1c = 0; _0x1b1b1c < 6; _0x1b1b1c++) {
          _0x5cbc30 = _0x2749a7[_0x1b1b1c].mipmaps;
          for (let _0x3d9aa0 = 0; _0x3d9aa0 < _0x5cbc30.length; _0x3d9aa0++) {
            const _0x202411 = _0x5cbc30[_0x3d9aa0];
            _0x20c1df.format !== RGBAFormat
              ? _0x331cef !== null
                ? _0x573f84
                  ? _0x12cb9f &&
                    _0x4f9503.compressedTexSubImage2D(
                      _0x47faf7.TEXTURE_CUBE_MAP_POSITIVE_X + _0x1b1b1c,
                      _0x3d9aa0,
                      0,
                      0,
                      _0x202411.width,
                      _0x202411.height,
                      _0x331cef,
                      _0x202411.data,
                    )
                  : _0x4f9503.compressedTexImage2D(
                      _0x47faf7.TEXTURE_CUBE_MAP_POSITIVE_X + _0x1b1b1c,
                      _0x3d9aa0,
                      _0xa92764,
                      _0x202411.width,
                      _0x202411.height,
                      0,
                      _0x202411.data,
                    )
                : console.warn(
                    'THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()',
                  )
              : _0x573f84
                ? _0x12cb9f &&
                  _0x4f9503.texSubImage2D(
                    _0x47faf7.TEXTURE_CUBE_MAP_POSITIVE_X + _0x1b1b1c,
                    _0x3d9aa0,
                    0,
                    0,
                    _0x202411.width,
                    _0x202411.height,
                    _0x331cef,
                    _0x2451f6,
                    _0x202411.data,
                  )
                : _0x4f9503.texImage2D(
                    _0x47faf7.TEXTURE_CUBE_MAP_POSITIVE_X + _0x1b1b1c,
                    _0x3d9aa0,
                    _0xa92764,
                    _0x202411.width,
                    _0x202411.height,
                    0,
                    _0x331cef,
                    _0x2451f6,
                    _0x202411.data,
                  );
          }
        }
      } else {
        _0x5cbc30 = _0x20c1df.mipmaps;
        if (_0x573f84 && _0x2cbc71) {
          if (_0x5cbc30.length > 0) _0x45b0df++;
          const _0x3552d9 = _0x2d7e5a(_0x2749a7[0]);
          _0x4f9503.texStorage2D(
            _0x47faf7.TEXTURE_CUBE_MAP,
            _0x45b0df,
            _0xa92764,
            _0x3552d9.width,
            _0x3552d9.height,
          );
        }
        for (let _0x487515 = 0; _0x487515 < 6; _0x487515++) {
          if (_0x11038e) {
            _0x573f84
              ? _0x12cb9f &&
                _0x4f9503.texSubImage2D(
                  _0x47faf7.TEXTURE_CUBE_MAP_POSITIVE_X + _0x487515,
                  0,
                  0,
                  0,
                  _0x2749a7[_0x487515].width,
                  _0x2749a7[_0x487515].height,
                  _0x331cef,
                  _0x2451f6,
                  _0x2749a7[_0x487515].data,
                )
              : _0x4f9503.texImage2D(
                  _0x47faf7.TEXTURE_CUBE_MAP_POSITIVE_X + _0x487515,
                  0,
                  _0xa92764,
                  _0x2749a7[_0x487515].width,
                  _0x2749a7[_0x487515].height,
                  0,
                  _0x331cef,
                  _0x2451f6,
                  _0x2749a7[_0x487515].data,
                );
            for (let _0x516d2f = 0; _0x516d2f < _0x5cbc30.length; _0x516d2f++) {
              const _0x17f22c = _0x5cbc30[_0x516d2f],
                _0x252148 = _0x17f22c.image[_0x487515].image;
              _0x573f84
                ? _0x12cb9f &&
                  _0x4f9503.texSubImage2D(
                    _0x47faf7.TEXTURE_CUBE_MAP_POSITIVE_X + _0x487515,
                    _0x516d2f + 1,
                    0,
                    0,
                    _0x252148.width,
                    _0x252148.height,
                    _0x331cef,
                    _0x2451f6,
                    _0x252148.data,
                  )
                : _0x4f9503.texImage2D(
                    _0x47faf7.TEXTURE_CUBE_MAP_POSITIVE_X + _0x487515,
                    _0x516d2f + 1,
                    _0xa92764,
                    _0x252148.width,
                    _0x252148.height,
                    0,
                    _0x331cef,
                    _0x2451f6,
                    _0x252148.data,
                  );
            }
          } else {
            _0x573f84
              ? _0x12cb9f &&
                _0x4f9503.texSubImage2D(
                  _0x47faf7.TEXTURE_CUBE_MAP_POSITIVE_X + _0x487515,
                  0,
                  0,
                  0,
                  _0x331cef,
                  _0x2451f6,
                  _0x2749a7[_0x487515],
                )
              : _0x4f9503.texImage2D(
                  _0x47faf7.TEXTURE_CUBE_MAP_POSITIVE_X + _0x487515,
                  0,
                  _0xa92764,
                  _0x331cef,
                  _0x2451f6,
                  _0x2749a7[_0x487515],
                );
            for (let _0x23f59f = 0; _0x23f59f < _0x5cbc30.length; _0x23f59f++) {
              const _0x5c6dc8 = _0x5cbc30[_0x23f59f];
              _0x573f84
                ? _0x12cb9f &&
                  _0x4f9503.texSubImage2D(
                    _0x47faf7.TEXTURE_CUBE_MAP_POSITIVE_X + _0x487515,
                    _0x23f59f + 1,
                    0,
                    0,
                    _0x331cef,
                    _0x2451f6,
                    _0x5c6dc8.image[_0x487515],
                  )
                : _0x4f9503.texImage2D(
                    _0x47faf7.TEXTURE_CUBE_MAP_POSITIVE_X + _0x487515,
                    _0x23f59f + 1,
                    _0xa92764,
                    _0x331cef,
                    _0x2451f6,
                    _0x5c6dc8.image[_0x487515],
                  );
            }
          }
        }
      }
      _0x5a67b2(_0x20c1df) && _0x3ee83c(_0x47faf7.TEXTURE_CUBE_MAP);
      _0x7f6655.__version = _0x401b2c.version;
      if (_0x20c1df.onUpdate) _0x20c1df.onUpdate(_0x20c1df);
    }
    _0x1d3ffc.__version = _0x20c1df.version;
  }
  function _0x487f49(_0x24f794, _0x538c4b, _0x227d16, _0x319b50, _0xf2bce5, _0x1bd6b5) {
    const _0x399fbf = _0x1c5738.convert(_0x227d16.format, _0x227d16.colorSpace),
      _0x2ef264 = _0x1c5738.convert(_0x227d16.type),
      _0x45a045 = _0x33e41a(_0x227d16.internalFormat, _0x399fbf, _0x2ef264, _0x227d16.colorSpace),
      _0x273c95 = _0x4ecfc8.get(_0x538c4b),
      _0x31dc0a = _0x4ecfc8.get(_0x227d16);
    _0x31dc0a.__renderTarget = _0x538c4b;
    if (!_0x273c95.__hasExternalTextures) {
      const _0x381390 = Math.max(1, _0x538c4b.width >> _0x1bd6b5),
        _0x3ae45a = Math.max(1, _0x538c4b.height >> _0x1bd6b5);
      _0xf2bce5 === _0x47faf7.TEXTURE_3D || _0xf2bce5 === _0x47faf7.TEXTURE_2D_ARRAY
        ? _0x4f9503.texImage3D(
            _0xf2bce5,
            _0x1bd6b5,
            _0x45a045,
            _0x381390,
            _0x3ae45a,
            _0x538c4b.depth,
            0,
            _0x399fbf,
            _0x2ef264,
            null,
          )
        : _0x4f9503.texImage2D(
            _0xf2bce5,
            _0x1bd6b5,
            _0x45a045,
            _0x381390,
            _0x3ae45a,
            0,
            _0x399fbf,
            _0x2ef264,
            null,
          );
    }
    _0x4f9503.bindFramebuffer(_0x47faf7.FRAMEBUFFER, _0x24f794);
    if (_0x69c8b4(_0x538c4b))
      _0x591282.framebufferTexture2DMultisampleEXT(
        _0x47faf7.FRAMEBUFFER,
        _0x319b50,
        _0xf2bce5,
        _0x31dc0a.__webglTexture,
        0,
        _0x49889a(_0x538c4b),
      );
    else
      (_0xf2bce5 === _0x47faf7.TEXTURE_2D ||
        (_0xf2bce5 >= _0x47faf7.TEXTURE_CUBE_MAP_POSITIVE_X &&
          _0xf2bce5 <= _0x47faf7.TEXTURE_CUBE_MAP_NEGATIVE_Z)) &&
        _0x47faf7.framebufferTexture2D(
          _0x47faf7.FRAMEBUFFER,
          _0x319b50,
          _0xf2bce5,
          _0x31dc0a.__webglTexture,
          _0x1bd6b5,
        );
    _0x4f9503.bindFramebuffer(_0x47faf7.FRAMEBUFFER, null);
  }
  function _0x3d2164(_0x35cc50, _0x382dd1, _0x57e1a3) {
    _0x47faf7.bindRenderbuffer(_0x47faf7.RENDERBUFFER, _0x35cc50);
    if (_0x382dd1.depthBuffer) {
      const _0x20f3b4 = _0x382dd1.depthTexture,
        _0xb848c5 = _0x20f3b4 && _0x20f3b4.isDepthTexture ? _0x20f3b4.type : null,
        _0x57ddee = _0x344caa(_0x382dd1.stencilBuffer, _0xb848c5),
        _0x31c9a6 = _0x382dd1.stencilBuffer ? _0x47faf7.DEPTH_STENCIL_ATTACHMENT : _0x47faf7.DEPTH_ATTACHMENT,
        _0x37922a = _0x49889a(_0x382dd1),
        _0x4edee5 = _0x69c8b4(_0x382dd1);
      if (_0x4edee5)
        _0x591282.renderbufferStorageMultisampleEXT(
          _0x47faf7.RENDERBUFFER,
          _0x37922a,
          _0x57ddee,
          _0x382dd1.width,
          _0x382dd1.height,
        );
      else
        _0x57e1a3
          ? _0x47faf7.renderbufferStorageMultisample(
              _0x47faf7.RENDERBUFFER,
              _0x37922a,
              _0x57ddee,
              _0x382dd1.width,
              _0x382dd1.height,
            )
          : _0x47faf7.renderbufferStorage(
              _0x47faf7.RENDERBUFFER,
              _0x57ddee,
              _0x382dd1.width,
              _0x382dd1.height,
            );
      _0x47faf7.framebufferRenderbuffer(_0x47faf7.FRAMEBUFFER, _0x31c9a6, _0x47faf7.RENDERBUFFER, _0x35cc50);
    } else {
      const _0xaae815 = _0x382dd1.textures;
      for (let _0x1c7e9f = 0; _0x1c7e9f < _0xaae815.length; _0x1c7e9f++) {
        const _0x518972 = _0xaae815[_0x1c7e9f],
          _0x2098f4 = _0x1c5738.convert(_0x518972.format, _0x518972.colorSpace),
          _0x4b9379 = _0x1c5738.convert(_0x518972.type),
          _0x1d76f5 = _0x33e41a(_0x518972.internalFormat, _0x2098f4, _0x4b9379, _0x518972.colorSpace),
          _0x118113 = _0x49889a(_0x382dd1);
        if (_0x57e1a3 && _0x69c8b4(_0x382dd1) === false)
          _0x47faf7.renderbufferStorageMultisample(
            _0x47faf7.RENDERBUFFER,
            _0x118113,
            _0x1d76f5,
            _0x382dd1.width,
            _0x382dd1.height,
          );
        else
          _0x69c8b4(_0x382dd1)
            ? _0x591282.renderbufferStorageMultisampleEXT(
                _0x47faf7.RENDERBUFFER,
                _0x118113,
                _0x1d76f5,
                _0x382dd1.width,
                _0x382dd1.height,
              )
            : _0x47faf7.renderbufferStorage(
                _0x47faf7.RENDERBUFFER,
                _0x1d76f5,
                _0x382dd1.width,
                _0x382dd1.height,
              );
      }
    }
    _0x47faf7.bindRenderbuffer(_0x47faf7.RENDERBUFFER, null);
  }
  function _0x41cb0d(_0x57045a, _0x276da1) {
    const _0x357ef8 = _0x276da1 && _0x276da1.isWebGLCubeRenderTarget;
    if (_0x357ef8) throw new Error('Depth Texture with cube render targets is not supported');
    _0x4f9503.bindFramebuffer(_0x47faf7.FRAMEBUFFER, _0x57045a);
    if (!(_0x276da1.depthTexture && _0x276da1.depthTexture.isDepthTexture))
      throw new Error('renderTarget.depthTexture must be an instance of THREE.DepthTexture');
    const _0x1beb90 = _0x4ecfc8.get(_0x276da1.depthTexture);
    _0x1beb90.__renderTarget = _0x276da1;
    (!_0x1beb90.__webglTexture ||
      _0x276da1.depthTexture.image.width !== _0x276da1.width ||
      _0x276da1.depthTexture.image.height !== _0x276da1.height) &&
      ((_0x276da1.depthTexture.image.width = _0x276da1.width),
      (_0x276da1.depthTexture.image.height = _0x276da1.height),
      (_0x276da1.depthTexture.needsUpdate = true));
    _0x4e5d7b(_0x276da1.depthTexture, 0);
    const _0x364d29 = _0x1beb90.__webglTexture,
      _0x30f083 = _0x49889a(_0x276da1);
    if (_0x276da1.depthTexture.format === DepthFormat)
      _0x69c8b4(_0x276da1)
        ? _0x591282.framebufferTexture2DMultisampleEXT(
            _0x47faf7.FRAMEBUFFER,
            _0x47faf7.DEPTH_ATTACHMENT,
            _0x47faf7.TEXTURE_2D,
            _0x364d29,
            0,
            _0x30f083,
          )
        : _0x47faf7.framebufferTexture2D(
            _0x47faf7.FRAMEBUFFER,
            _0x47faf7.DEPTH_ATTACHMENT,
            _0x47faf7.TEXTURE_2D,
            _0x364d29,
            0,
          );
    else {
      if (_0x276da1.depthTexture.format === DepthStencilFormat)
        _0x69c8b4(_0x276da1)
          ? _0x591282.framebufferTexture2DMultisampleEXT(
              _0x47faf7.FRAMEBUFFER,
              _0x47faf7.DEPTH_STENCIL_ATTACHMENT,
              _0x47faf7.TEXTURE_2D,
              _0x364d29,
              0,
              _0x30f083,
            )
          : _0x47faf7.framebufferTexture2D(
              _0x47faf7.FRAMEBUFFER,
              _0x47faf7.DEPTH_STENCIL_ATTACHMENT,
              _0x47faf7.TEXTURE_2D,
              _0x364d29,
              0,
            );
      else throw new Error('Unknown depthTexture format');
    }
  }
  function _0x527344(_0x3fd85b) {
    const _0x59fe42 = _0x4ecfc8.get(_0x3fd85b),
      _0x29d46c = _0x3fd85b.isWebGLCubeRenderTarget === true;
    if (_0x59fe42.__boundDepthTexture !== _0x3fd85b.depthTexture) {
      const _0x21e4cd = _0x3fd85b.depthTexture;
      _0x59fe42.__depthDisposeCallback && _0x59fe42.__depthDisposeCallback();
      if (_0x21e4cd) {
        const _0x147a3a = () => {
          (delete _0x59fe42.__boundDepthTexture,
            delete _0x59fe42.__depthDisposeCallback,
            _0x21e4cd.removeEventListener('dispose', _0x147a3a));
        };
        (_0x21e4cd.addEventListener('dispose', _0x147a3a), (_0x59fe42.__depthDisposeCallback = _0x147a3a));
      }
      _0x59fe42.__boundDepthTexture = _0x21e4cd;
    }
    if (_0x3fd85b.depthTexture && !_0x59fe42.__autoAllocateDepthBuffer) {
      if (_0x29d46c) throw new Error('target.depthTexture not supported in Cube render targets');
      const _0x1c875b = _0x3fd85b.texture.mipmaps;
      _0x1c875b && _0x1c875b.length > 0
        ? _0x41cb0d(_0x59fe42.__webglFramebuffer[0], _0x3fd85b)
        : _0x41cb0d(_0x59fe42.__webglFramebuffer, _0x3fd85b);
    } else {
      if (_0x29d46c) {
        _0x59fe42.__webglDepthbuffer = [];
        for (let _0x231e24 = 0; _0x231e24 < 6; _0x231e24++) {
          _0x4f9503.bindFramebuffer(_0x47faf7.FRAMEBUFFER, _0x59fe42.__webglFramebuffer[_0x231e24]);
          if (_0x59fe42.__webglDepthbuffer[_0x231e24] === undefined)
            ((_0x59fe42.__webglDepthbuffer[_0x231e24] = _0x47faf7.createRenderbuffer()),
              _0x3d2164(_0x59fe42.__webglDepthbuffer[_0x231e24], _0x3fd85b, false));
          else {
            const _0x251a2f = _0x3fd85b.stencilBuffer
                ? _0x47faf7.DEPTH_STENCIL_ATTACHMENT
                : _0x47faf7.DEPTH_ATTACHMENT,
              _0x1fe541 = _0x59fe42.__webglDepthbuffer[_0x231e24];
            (_0x47faf7.bindRenderbuffer(_0x47faf7.RENDERBUFFER, _0x1fe541),
              _0x47faf7.framebufferRenderbuffer(
                _0x47faf7.FRAMEBUFFER,
                _0x251a2f,
                _0x47faf7.RENDERBUFFER,
                _0x1fe541,
              ));
          }
        }
      } else {
        const _0x4f040e = _0x3fd85b.texture.mipmaps;
        _0x4f040e && _0x4f040e.length > 0
          ? _0x4f9503.bindFramebuffer(_0x47faf7.FRAMEBUFFER, _0x59fe42.__webglFramebuffer[0])
          : _0x4f9503.bindFramebuffer(_0x47faf7.FRAMEBUFFER, _0x59fe42.__webglFramebuffer);
        if (_0x59fe42.__webglDepthbuffer === undefined)
          ((_0x59fe42.__webglDepthbuffer = _0x47faf7.createRenderbuffer()),
            _0x3d2164(_0x59fe42.__webglDepthbuffer, _0x3fd85b, false));
        else {
          const _0x4debad = _0x3fd85b.stencilBuffer
              ? _0x47faf7.DEPTH_STENCIL_ATTACHMENT
              : _0x47faf7.DEPTH_ATTACHMENT,
            _0x19b09c = _0x59fe42.__webglDepthbuffer;
          (_0x47faf7.bindRenderbuffer(_0x47faf7.RENDERBUFFER, _0x19b09c),
            _0x47faf7.framebufferRenderbuffer(
              _0x47faf7.FRAMEBUFFER,
              _0x4debad,
              _0x47faf7.RENDERBUFFER,
              _0x19b09c,
            ));
        }
      }
    }
    _0x4f9503.bindFramebuffer(_0x47faf7.FRAMEBUFFER, null);
  }
  function _0x596c9d(_0x12d169, _0x1b68b8, _0x3f47e9) {
    const _0x2c1ff5 = _0x4ecfc8.get(_0x12d169);
    (_0x1b68b8 !== undefined &&
      _0x487f49(
        _0x2c1ff5.__webglFramebuffer,
        _0x12d169,
        _0x12d169.texture,
        _0x47faf7.COLOR_ATTACHMENT0,
        _0x47faf7.TEXTURE_2D,
        0,
      ),
      _0x3f47e9 !== undefined && _0x527344(_0x12d169));
  }
  function _0x5d6546(_0x3140de) {
    const _0x155a0b = _0x3140de.texture,
      _0x5c97d1 = _0x4ecfc8.get(_0x3140de),
      _0x124fc6 = _0x4ecfc8.get(_0x155a0b);
    _0x3140de.addEventListener('dispose', _0x42c065);
    const _0x13010f = _0x3140de.textures,
      _0x34f3d0 = _0x3140de.isWebGLCubeRenderTarget === true,
      _0x82d9c8 = _0x13010f.length > 1;
    !_0x82d9c8 &&
      (_0x124fc6.__webglTexture === undefined && (_0x124fc6.__webglTexture = _0x47faf7.createTexture()),
      (_0x124fc6.__version = _0x155a0b.version),
      _0x2ef175.memory.textures++);
    if (_0x34f3d0) {
      _0x5c97d1.__webglFramebuffer = [];
      for (let _0x594264 = 0; _0x594264 < 6; _0x594264++) {
        if (_0x155a0b.mipmaps && _0x155a0b.mipmaps.length > 0) {
          _0x5c97d1.__webglFramebuffer[_0x594264] = [];
          for (let _0x11e698 = 0; _0x11e698 < _0x155a0b.mipmaps.length; _0x11e698++) {
            _0x5c97d1.__webglFramebuffer[_0x594264][_0x11e698] = _0x47faf7.createFramebuffer();
          }
        } else _0x5c97d1.__webglFramebuffer[_0x594264] = _0x47faf7.createFramebuffer();
      }
    } else {
      if (_0x155a0b.mipmaps && _0x155a0b.mipmaps.length > 0) {
        _0x5c97d1.__webglFramebuffer = [];
        for (let _0xad1849 = 0; _0xad1849 < _0x155a0b.mipmaps.length; _0xad1849++) {
          _0x5c97d1.__webglFramebuffer[_0xad1849] = _0x47faf7.createFramebuffer();
        }
      } else _0x5c97d1.__webglFramebuffer = _0x47faf7.createFramebuffer();
      if (_0x82d9c8)
        for (let _0x1f7324 = 0, _0x4e9dc7 = _0x13010f.length; _0x1f7324 < _0x4e9dc7; _0x1f7324++) {
          const _0x2ae414 = _0x4ecfc8.get(_0x13010f[_0x1f7324]);
          _0x2ae414.__webglTexture === undefined &&
            ((_0x2ae414.__webglTexture = _0x47faf7.createTexture()), _0x2ef175.memory.textures++);
        }
      if (_0x3140de.samples > 0 && _0x69c8b4(_0x3140de) === false) {
        ((_0x5c97d1.__webglMultisampledFramebuffer = _0x47faf7.createFramebuffer()),
          (_0x5c97d1.__webglColorRenderbuffer = []),
          _0x4f9503.bindFramebuffer(_0x47faf7.FRAMEBUFFER, _0x5c97d1.__webglMultisampledFramebuffer));
        for (let _0x2404a0 = 0; _0x2404a0 < _0x13010f.length; _0x2404a0++) {
          const _0x5f4097 = _0x13010f[_0x2404a0];
          ((_0x5c97d1.__webglColorRenderbuffer[_0x2404a0] = _0x47faf7.createRenderbuffer()),
            _0x47faf7.bindRenderbuffer(
              _0x47faf7.RENDERBUFFER,
              _0x5c97d1.__webglColorRenderbuffer[_0x2404a0],
            ));
          const _0x247a74 = _0x1c5738.convert(_0x5f4097.format, _0x5f4097.colorSpace),
            _0x5277e6 = _0x1c5738.convert(_0x5f4097.type),
            _0x1b5209 = _0x33e41a(
              _0x5f4097.internalFormat,
              _0x247a74,
              _0x5277e6,
              _0x5f4097.colorSpace,
              _0x3140de.isXRRenderTarget === true,
            ),
            _0xe76dff = _0x49889a(_0x3140de);
          (_0x47faf7.renderbufferStorageMultisample(
            _0x47faf7.RENDERBUFFER,
            _0xe76dff,
            _0x1b5209,
            _0x3140de.width,
            _0x3140de.height,
          ),
            _0x47faf7.framebufferRenderbuffer(
              _0x47faf7.FRAMEBUFFER,
              _0x47faf7.COLOR_ATTACHMENT0 + _0x2404a0,
              _0x47faf7.RENDERBUFFER,
              _0x5c97d1.__webglColorRenderbuffer[_0x2404a0],
            ));
        }
        (_0x47faf7.bindRenderbuffer(_0x47faf7.RENDERBUFFER, null),
          _0x3140de.depthBuffer &&
            ((_0x5c97d1.__webglDepthRenderbuffer = _0x47faf7.createRenderbuffer()),
            _0x3d2164(_0x5c97d1.__webglDepthRenderbuffer, _0x3140de, true)),
          _0x4f9503.bindFramebuffer(_0x47faf7.FRAMEBUFFER, null));
      }
    }
    if (_0x34f3d0) {
      (_0x4f9503.bindTexture(_0x47faf7.TEXTURE_CUBE_MAP, _0x124fc6.__webglTexture),
        _0x5b36f9(_0x47faf7.TEXTURE_CUBE_MAP, _0x155a0b));
      for (let _0x5095f7 = 0; _0x5095f7 < 6; _0x5095f7++) {
        if (_0x155a0b.mipmaps && _0x155a0b.mipmaps.length > 0)
          for (let _0x390569 = 0; _0x390569 < _0x155a0b.mipmaps.length; _0x390569++) {
            _0x487f49(
              _0x5c97d1.__webglFramebuffer[_0x5095f7][_0x390569],
              _0x3140de,
              _0x155a0b,
              _0x47faf7.COLOR_ATTACHMENT0,
              _0x47faf7.TEXTURE_CUBE_MAP_POSITIVE_X + _0x5095f7,
              _0x390569,
            );
          }
        else
          _0x487f49(
            _0x5c97d1.__webglFramebuffer[_0x5095f7],
            _0x3140de,
            _0x155a0b,
            _0x47faf7.COLOR_ATTACHMENT0,
            _0x47faf7.TEXTURE_CUBE_MAP_POSITIVE_X + _0x5095f7,
            0,
          );
      }
      (_0x5a67b2(_0x155a0b) && _0x3ee83c(_0x47faf7.TEXTURE_CUBE_MAP), _0x4f9503.unbindTexture());
    } else {
      if (_0x82d9c8) {
        for (let _0x414bdd = 0, _0x37a01e = _0x13010f.length; _0x414bdd < _0x37a01e; _0x414bdd++) {
          const _0x3fde35 = _0x13010f[_0x414bdd],
            _0x4ed26e = _0x4ecfc8.get(_0x3fde35);
          let _0x1753fc = _0x47faf7.TEXTURE_2D;
          ((_0x3140de.isWebGL3DRenderTarget || _0x3140de.isWebGLArrayRenderTarget) &&
            (_0x1753fc = _0x3140de.isWebGL3DRenderTarget ? _0x47faf7.TEXTURE_3D : _0x47faf7.TEXTURE_2D_ARRAY),
            _0x4f9503.bindTexture(_0x1753fc, _0x4ed26e.__webglTexture),
            _0x5b36f9(_0x1753fc, _0x3fde35),
            _0x487f49(
              _0x5c97d1.__webglFramebuffer,
              _0x3140de,
              _0x3fde35,
              _0x47faf7.COLOR_ATTACHMENT0 + _0x414bdd,
              _0x1753fc,
              0,
            ),
            _0x5a67b2(_0x3fde35) && _0x3ee83c(_0x1753fc));
        }
        _0x4f9503.unbindTexture();
      } else {
        let _0xd725d5 = _0x47faf7.TEXTURE_2D;
        (_0x3140de.isWebGL3DRenderTarget || _0x3140de.isWebGLArrayRenderTarget) &&
          (_0xd725d5 = _0x3140de.isWebGL3DRenderTarget ? _0x47faf7.TEXTURE_3D : _0x47faf7.TEXTURE_2D_ARRAY);
        (_0x4f9503.bindTexture(_0xd725d5, _0x124fc6.__webglTexture), _0x5b36f9(_0xd725d5, _0x155a0b));
        if (_0x155a0b.mipmaps && _0x155a0b.mipmaps.length > 0)
          for (let _0x23cf0c = 0; _0x23cf0c < _0x155a0b.mipmaps.length; _0x23cf0c++) {
            _0x487f49(
              _0x5c97d1.__webglFramebuffer[_0x23cf0c],
              _0x3140de,
              _0x155a0b,
              _0x47faf7.COLOR_ATTACHMENT0,
              _0xd725d5,
              _0x23cf0c,
            );
          }
        else
          _0x487f49(
            _0x5c97d1.__webglFramebuffer,
            _0x3140de,
            _0x155a0b,
            _0x47faf7.COLOR_ATTACHMENT0,
            _0xd725d5,
            0,
          );
        (_0x5a67b2(_0x155a0b) && _0x3ee83c(_0xd725d5), _0x4f9503.unbindTexture());
      }
    }
    _0x3140de.depthBuffer && _0x527344(_0x3140de);
  }
  function _0x21cffe(_0x2970a5) {
    const _0x55ec84 = _0x2970a5.textures;
    for (let _0x3c1e7e = 0, _0x43730d = _0x55ec84.length; _0x3c1e7e < _0x43730d; _0x3c1e7e++) {
      const _0x1b4df5 = _0x55ec84[_0x3c1e7e];
      if (_0x5a67b2(_0x1b4df5)) {
        const _0x351e89 = _0x62a732(_0x2970a5),
          _0x4e64d6 = _0x4ecfc8.get(_0x1b4df5).__webglTexture;
        (_0x4f9503.bindTexture(_0x351e89, _0x4e64d6), _0x3ee83c(_0x351e89), _0x4f9503.unbindTexture());
      }
    }
  }
  const _0x5e2785 = [],
    _0x16134a = [];
  function _0x2632c1(_0x5a475d) {
    if (_0x5a475d.samples > 0) {
      if (_0x69c8b4(_0x5a475d) === false) {
        const _0x51cb49 = _0x5a475d.textures,
          _0x47e949 = _0x5a475d.width,
          _0x4fe090 = _0x5a475d.height;
        let _0x459015 = _0x47faf7.COLOR_BUFFER_BIT;
        const _0x4f1c77 = _0x5a475d.stencilBuffer
            ? _0x47faf7.DEPTH_STENCIL_ATTACHMENT
            : _0x47faf7.DEPTH_ATTACHMENT,
          _0x29067e = _0x4ecfc8.get(_0x5a475d),
          _0x2b041d = _0x51cb49.length > 1;
        if (_0x2b041d)
          for (let _0x420ad3 = 0; _0x420ad3 < _0x51cb49.length; _0x420ad3++) {
            (_0x4f9503.bindFramebuffer(_0x47faf7.FRAMEBUFFER, _0x29067e.__webglMultisampledFramebuffer),
              _0x47faf7.framebufferRenderbuffer(
                _0x47faf7.FRAMEBUFFER,
                _0x47faf7.COLOR_ATTACHMENT0 + _0x420ad3,
                _0x47faf7.RENDERBUFFER,
                null,
              ),
              _0x4f9503.bindFramebuffer(_0x47faf7.FRAMEBUFFER, _0x29067e.__webglFramebuffer),
              _0x47faf7.framebufferTexture2D(
                _0x47faf7.DRAW_FRAMEBUFFER,
                _0x47faf7.COLOR_ATTACHMENT0 + _0x420ad3,
                _0x47faf7.TEXTURE_2D,
                null,
                0,
              ));
          }
        _0x4f9503.bindFramebuffer(_0x47faf7.READ_FRAMEBUFFER, _0x29067e.__webglMultisampledFramebuffer);
        const _0x5ef646 = _0x5a475d.texture.mipmaps;
        _0x5ef646 && _0x5ef646.length > 0
          ? _0x4f9503.bindFramebuffer(_0x47faf7.DRAW_FRAMEBUFFER, _0x29067e.__webglFramebuffer[0])
          : _0x4f9503.bindFramebuffer(_0x47faf7.DRAW_FRAMEBUFFER, _0x29067e.__webglFramebuffer);
        for (let _0x45616b = 0; _0x45616b < _0x51cb49.length; _0x45616b++) {
          if (_0x5a475d.resolveDepthBuffer) {
            if (_0x5a475d.depthBuffer) _0x459015 |= _0x47faf7.DEPTH_BUFFER_BIT;
            if (_0x5a475d.stencilBuffer && _0x5a475d.resolveStencilBuffer)
              _0x459015 |= _0x47faf7.STENCIL_BUFFER_BIT;
          }
          if (_0x2b041d) {
            _0x47faf7.framebufferRenderbuffer(
              _0x47faf7.READ_FRAMEBUFFER,
              _0x47faf7.COLOR_ATTACHMENT0,
              _0x47faf7.RENDERBUFFER,
              _0x29067e.__webglColorRenderbuffer[_0x45616b],
            );
            const _0xe23d25 = _0x4ecfc8.get(_0x51cb49[_0x45616b]).__webglTexture;
            _0x47faf7.framebufferTexture2D(
              _0x47faf7.DRAW_FRAMEBUFFER,
              _0x47faf7.COLOR_ATTACHMENT0,
              _0x47faf7.TEXTURE_2D,
              _0xe23d25,
              0,
            );
          }
          (_0x47faf7.blitFramebuffer(
            0,
            0,
            _0x47e949,
            _0x4fe090,
            0,
            0,
            _0x47e949,
            _0x4fe090,
            _0x459015,
            _0x47faf7.NEAREST,
          ),
            _0x6b5f71 === true &&
              ((_0x5e2785.length = 0),
              (_0x16134a.length = 0),
              _0x5e2785.push(_0x47faf7.COLOR_ATTACHMENT0 + _0x45616b),
              _0x5a475d.depthBuffer &&
                _0x5a475d.resolveDepthBuffer === false &&
                (_0x5e2785.push(_0x4f1c77),
                _0x16134a.push(_0x4f1c77),
                _0x47faf7.invalidateFramebuffer(_0x47faf7.DRAW_FRAMEBUFFER, _0x16134a)),
              _0x47faf7.invalidateFramebuffer(_0x47faf7.READ_FRAMEBUFFER, _0x5e2785)));
        }
        (_0x4f9503.bindFramebuffer(_0x47faf7.READ_FRAMEBUFFER, null),
          _0x4f9503.bindFramebuffer(_0x47faf7.DRAW_FRAMEBUFFER, null));
        if (_0x2b041d)
          for (let _0x5828d1 = 0; _0x5828d1 < _0x51cb49.length; _0x5828d1++) {
            (_0x4f9503.bindFramebuffer(_0x47faf7.FRAMEBUFFER, _0x29067e.__webglMultisampledFramebuffer),
              _0x47faf7.framebufferRenderbuffer(
                _0x47faf7.FRAMEBUFFER,
                _0x47faf7.COLOR_ATTACHMENT0 + _0x5828d1,
                _0x47faf7.RENDERBUFFER,
                _0x29067e.__webglColorRenderbuffer[_0x5828d1],
              ));
            const _0x310d39 = _0x4ecfc8.get(_0x51cb49[_0x5828d1]).__webglTexture;
            (_0x4f9503.bindFramebuffer(_0x47faf7.FRAMEBUFFER, _0x29067e.__webglFramebuffer),
              _0x47faf7.framebufferTexture2D(
                _0x47faf7.DRAW_FRAMEBUFFER,
                _0x47faf7.COLOR_ATTACHMENT0 + _0x5828d1,
                _0x47faf7.TEXTURE_2D,
                _0x310d39,
                0,
              ));
          }
        _0x4f9503.bindFramebuffer(_0x47faf7.DRAW_FRAMEBUFFER, _0x29067e.__webglMultisampledFramebuffer);
      } else {
        if (_0x5a475d.depthBuffer && _0x5a475d.resolveDepthBuffer === false && _0x6b5f71) {
          const _0xcb27bc = _0x5a475d.stencilBuffer
            ? _0x47faf7.DEPTH_STENCIL_ATTACHMENT
            : _0x47faf7.DEPTH_ATTACHMENT;
          _0x47faf7.invalidateFramebuffer(_0x47faf7.DRAW_FRAMEBUFFER, [_0xcb27bc]);
        }
      }
    }
  }
  function _0x49889a(_0x1b2e5e) {
    return Math.min(_0xae6c85.maxSamples, _0x1b2e5e.samples);
  }
  function _0x69c8b4(_0x146f62) {
    const _0x17397d = _0x4ecfc8.get(_0x146f62);
    return (
      _0x146f62.samples > 0 &&
      _0x2076f8.has('WEBGL_multisampled_render_to_texture') === true &&
      _0x17397d.__useRenderToTexture !== false
    );
  }
  function _0x10f78e(_0x12daf2) {
    const _0x3993f1 = _0x2ef175.render.frame;
    _0x314b10.get(_0x12daf2) !== _0x3993f1 && (_0x314b10.set(_0x12daf2, _0x3993f1), _0x12daf2.update());
  }
  function _0x20cbac(_0x575776, _0x2fb912) {
    const _0x5b0501 = _0x575776.colorSpace,
      _0x54bd73 = _0x575776.format,
      _0x436ba8 = _0x575776.type;
    if (_0x575776.isCompressedTexture === true || _0x575776.isVideoTexture === true) return _0x2fb912;
    return (
      _0x5b0501 !== LinearSRGBColorSpace &&
        _0x5b0501 !== NoColorSpace &&
        (ColorManagement.getTransfer(_0x5b0501) === SRGBTransfer
          ? (_0x54bd73 !== RGBAFormat || _0x436ba8 !== UnsignedByteType) &&
            console.warn(
              'THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.',
            )
          : console.error('THREE.WebGLTextures: Unsupported texture color space:', _0x5b0501)),
      _0x2fb912
    );
  }
  function _0x2d7e5a(_0x452996) {
    if (typeof HTMLImageElement !== 'undefined' && _0x452996 instanceof HTMLImageElement)
      ((_0x25a4bd.width = _0x452996.naturalWidth || _0x452996.width),
        (_0x25a4bd.height = _0x452996.naturalHeight || _0x452996.height));
    else
      typeof VideoFrame !== 'undefined' && _0x452996 instanceof VideoFrame
        ? ((_0x25a4bd.width = _0x452996.displayWidth), (_0x25a4bd.height = _0x452996.displayHeight))
        : ((_0x25a4bd.width = _0x452996.width), (_0x25a4bd.height = _0x452996.height));
    return _0x25a4bd;
  }
  ((this.allocateTextureUnit = _0x4a0504),
    (this.resetTextureUnits = _0x4a84ba),
    (this.setTexture2D = _0x4e5d7b),
    (this.setTexture2DArray = _0x5dddaa),
    (this.setTexture3D = _0xc43700),
    (this.setTextureCube = _0x49ca3f),
    (this.rebindTextures = _0x596c9d),
    (this.setupRenderTarget = _0x5d6546),
    (this.updateRenderTargetMipmap = _0x21cffe),
    (this.updateMultisampleRenderTarget = _0x2632c1),
    (this.setupDepthRenderbuffer = _0x527344),
    (this.setupFrameBufferTexture = _0x487f49),
    (this.useMultisampledRTT = _0x69c8b4));
}
function WebGLUtils(_0x20e325, _0x29bbbb) {
  function _0x3da891(_0x4eb94b, _0x13d780 = NoColorSpace) {
    let _0x15a2cc;
    const _0x26abaf = ColorManagement.getTransfer(_0x13d780);
    if (_0x4eb94b === UnsignedByteType) return _0x20e325.UNSIGNED_BYTE;
    if (_0x4eb94b === UnsignedShort4444Type) return _0x20e325.UNSIGNED_SHORT_4_4_4_4;
    if (_0x4eb94b === UnsignedShort5551Type) return _0x20e325.UNSIGNED_SHORT_5_5_5_1;
    if (_0x4eb94b === UnsignedInt5999Type) return _0x20e325.UNSIGNED_INT_5_9_9_9_REV;
    if (_0x4eb94b === UnsignedInt101111Type) return _0x20e325.UNSIGNED_INT_10F_11F_11F_REV;
    if (_0x4eb94b === ByteType) return _0x20e325.BYTE;
    if (_0x4eb94b === ShortType) return _0x20e325.SHORT;
    if (_0x4eb94b === UnsignedShortType) return _0x20e325.UNSIGNED_SHORT;
    if (_0x4eb94b === IntType) return _0x20e325.INT;
    if (_0x4eb94b === UnsignedIntType) return _0x20e325.UNSIGNED_INT;
    if (_0x4eb94b === FloatType) return _0x20e325.FLOAT;
    if (_0x4eb94b === HalfFloatType) return _0x20e325.HALF_FLOAT;
    if (_0x4eb94b === AlphaFormat) return _0x20e325.ALPHA;
    if (_0x4eb94b === RGBFormat) return _0x20e325.RGB;
    if (_0x4eb94b === RGBAFormat) return _0x20e325.RGBA;
    if (_0x4eb94b === DepthFormat) return _0x20e325.DEPTH_COMPONENT;
    if (_0x4eb94b === DepthStencilFormat) return _0x20e325.DEPTH_STENCIL;
    if (_0x4eb94b === RedFormat) return _0x20e325.RED;
    if (_0x4eb94b === RedIntegerFormat) return _0x20e325.RED_INTEGER;
    if (_0x4eb94b === RGFormat) return _0x20e325.RG;
    if (_0x4eb94b === RGIntegerFormat) return _0x20e325.RG_INTEGER;
    if (_0x4eb94b === RGBAIntegerFormat) return _0x20e325.RGBA_INTEGER;
    if (
      _0x4eb94b === RGB_S3TC_DXT1_Format ||
      _0x4eb94b === RGBA_S3TC_DXT1_Format ||
      _0x4eb94b === RGBA_S3TC_DXT3_Format ||
      _0x4eb94b === RGBA_S3TC_DXT5_Format
    ) {
      if (_0x26abaf === SRGBTransfer) {
        _0x15a2cc = _0x29bbbb.get('WEBGL_compressed_texture_s3tc_srgb');
        if (_0x15a2cc !== null) {
          if (_0x4eb94b === RGB_S3TC_DXT1_Format) return _0x15a2cc.COMPRESSED_SRGB_S3TC_DXT1_EXT;
          if (_0x4eb94b === RGBA_S3TC_DXT1_Format) return _0x15a2cc.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;
          if (_0x4eb94b === RGBA_S3TC_DXT3_Format) return _0x15a2cc.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;
          if (_0x4eb94b === RGBA_S3TC_DXT5_Format) return _0x15a2cc.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT;
        } else return null;
      } else {
        _0x15a2cc = _0x29bbbb.get('WEBGL_compressed_texture_s3tc');
        if (_0x15a2cc !== null) {
          if (_0x4eb94b === RGB_S3TC_DXT1_Format) return _0x15a2cc.COMPRESSED_RGB_S3TC_DXT1_EXT;
          if (_0x4eb94b === RGBA_S3TC_DXT1_Format) return _0x15a2cc.COMPRESSED_RGBA_S3TC_DXT1_EXT;
          if (_0x4eb94b === RGBA_S3TC_DXT3_Format) return _0x15a2cc.COMPRESSED_RGBA_S3TC_DXT3_EXT;
          if (_0x4eb94b === RGBA_S3TC_DXT5_Format) return _0x15a2cc.COMPRESSED_RGBA_S3TC_DXT5_EXT;
        } else return null;
      }
    }
    if (
      _0x4eb94b === RGB_PVRTC_4BPPV1_Format ||
      _0x4eb94b === RGB_PVRTC_2BPPV1_Format ||
      _0x4eb94b === RGBA_PVRTC_4BPPV1_Format ||
      _0x4eb94b === RGBA_PVRTC_2BPPV1_Format
    ) {
      _0x15a2cc = _0x29bbbb.get('WEBGL_compressed_texture_pvrtc');
      if (_0x15a2cc !== null) {
        if (_0x4eb94b === RGB_PVRTC_4BPPV1_Format) return _0x15a2cc.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;
        if (_0x4eb94b === RGB_PVRTC_2BPPV1_Format) return _0x15a2cc.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;
        if (_0x4eb94b === RGBA_PVRTC_4BPPV1_Format) return _0x15a2cc.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;
        if (_0x4eb94b === RGBA_PVRTC_2BPPV1_Format) return _0x15a2cc.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG;
      } else return null;
    }
    if (
      _0x4eb94b === RGB_ETC1_Format ||
      _0x4eb94b === RGB_ETC2_Format ||
      _0x4eb94b === RGBA_ETC2_EAC_Format
    ) {
      _0x15a2cc = _0x29bbbb.get('WEBGL_compressed_texture_etc');
      if (_0x15a2cc !== null) {
        if (_0x4eb94b === RGB_ETC1_Format || _0x4eb94b === RGB_ETC2_Format)
          return _0x26abaf === SRGBTransfer
            ? _0x15a2cc.COMPRESSED_SRGB8_ETC2
            : _0x15a2cc.COMPRESSED_RGB8_ETC2;
        if (_0x4eb94b === RGBA_ETC2_EAC_Format)
          return _0x26abaf === SRGBTransfer
            ? _0x15a2cc.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC
            : _0x15a2cc.COMPRESSED_RGBA8_ETC2_EAC;
      } else return null;
    }
    if (
      _0x4eb94b === RGBA_ASTC_4x4_Format ||
      _0x4eb94b === RGBA_ASTC_5x4_Format ||
      _0x4eb94b === RGBA_ASTC_5x5_Format ||
      _0x4eb94b === RGBA_ASTC_6x5_Format ||
      _0x4eb94b === RGBA_ASTC_6x6_Format ||
      _0x4eb94b === RGBA_ASTC_8x5_Format ||
      _0x4eb94b === RGBA_ASTC_8x6_Format ||
      _0x4eb94b === RGBA_ASTC_8x8_Format ||
      _0x4eb94b === RGBA_ASTC_10x5_Format ||
      _0x4eb94b === RGBA_ASTC_10x6_Format ||
      _0x4eb94b === RGBA_ASTC_10x8_Format ||
      _0x4eb94b === RGBA_ASTC_10x10_Format ||
      _0x4eb94b === RGBA_ASTC_12x10_Format ||
      _0x4eb94b === RGBA_ASTC_12x12_Format
    ) {
      _0x15a2cc = _0x29bbbb.get('WEBGL_compressed_texture_astc');
      if (_0x15a2cc !== null) {
        if (_0x4eb94b === RGBA_ASTC_4x4_Format)
          return _0x26abaf === SRGBTransfer
            ? _0x15a2cc.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR
            : _0x15a2cc.COMPRESSED_RGBA_ASTC_4x4_KHR;
        if (_0x4eb94b === RGBA_ASTC_5x4_Format)
          return _0x26abaf === SRGBTransfer
            ? _0x15a2cc.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR
            : _0x15a2cc.COMPRESSED_RGBA_ASTC_5x4_KHR;
        if (_0x4eb94b === RGBA_ASTC_5x5_Format)
          return _0x26abaf === SRGBTransfer
            ? _0x15a2cc.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR
            : _0x15a2cc.COMPRESSED_RGBA_ASTC_5x5_KHR;
        if (_0x4eb94b === RGBA_ASTC_6x5_Format)
          return _0x26abaf === SRGBTransfer
            ? _0x15a2cc.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR
            : _0x15a2cc.COMPRESSED_RGBA_ASTC_6x5_KHR;
        if (_0x4eb94b === RGBA_ASTC_6x6_Format)
          return _0x26abaf === SRGBTransfer
            ? _0x15a2cc.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR
            : _0x15a2cc.COMPRESSED_RGBA_ASTC_6x6_KHR;
        if (_0x4eb94b === RGBA_ASTC_8x5_Format)
          return _0x26abaf === SRGBTransfer
            ? _0x15a2cc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR
            : _0x15a2cc.COMPRESSED_RGBA_ASTC_8x5_KHR;
        if (_0x4eb94b === RGBA_ASTC_8x6_Format)
          return _0x26abaf === SRGBTransfer
            ? _0x15a2cc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR
            : _0x15a2cc.COMPRESSED_RGBA_ASTC_8x6_KHR;
        if (_0x4eb94b === RGBA_ASTC_8x8_Format)
          return _0x26abaf === SRGBTransfer
            ? _0x15a2cc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR
            : _0x15a2cc.COMPRESSED_RGBA_ASTC_8x8_KHR;
        if (_0x4eb94b === RGBA_ASTC_10x5_Format)
          return _0x26abaf === SRGBTransfer
            ? _0x15a2cc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR
            : _0x15a2cc.COMPRESSED_RGBA_ASTC_10x5_KHR;
        if (_0x4eb94b === RGBA_ASTC_10x6_Format)
          return _0x26abaf === SRGBTransfer
            ? _0x15a2cc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR
            : _0x15a2cc.COMPRESSED_RGBA_ASTC_10x6_KHR;
        if (_0x4eb94b === RGBA_ASTC_10x8_Format)
          return _0x26abaf === SRGBTransfer
            ? _0x15a2cc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR
            : _0x15a2cc.COMPRESSED_RGBA_ASTC_10x8_KHR;
        if (_0x4eb94b === RGBA_ASTC_10x10_Format)
          return _0x26abaf === SRGBTransfer
            ? _0x15a2cc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR
            : _0x15a2cc.COMPRESSED_RGBA_ASTC_10x10_KHR;
        if (_0x4eb94b === RGBA_ASTC_12x10_Format)
          return _0x26abaf === SRGBTransfer
            ? _0x15a2cc.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR
            : _0x15a2cc.COMPRESSED_RGBA_ASTC_12x10_KHR;
        if (_0x4eb94b === RGBA_ASTC_12x12_Format)
          return _0x26abaf === SRGBTransfer
            ? _0x15a2cc.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR
            : _0x15a2cc.COMPRESSED_RGBA_ASTC_12x12_KHR;
      } else return null;
    }
    if (
      _0x4eb94b === RGBA_BPTC_Format ||
      _0x4eb94b === RGB_BPTC_SIGNED_Format ||
      _0x4eb94b === RGB_BPTC_UNSIGNED_Format
    ) {
      _0x15a2cc = _0x29bbbb.get('EXT_texture_compression_bptc');
      if (_0x15a2cc !== null) {
        if (_0x4eb94b === RGBA_BPTC_Format)
          return _0x26abaf === SRGBTransfer
            ? _0x15a2cc.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT
            : _0x15a2cc.COMPRESSED_RGBA_BPTC_UNORM_EXT;
        if (_0x4eb94b === RGB_BPTC_SIGNED_Format) return _0x15a2cc.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;
        if (_0x4eb94b === RGB_BPTC_UNSIGNED_Format) return _0x15a2cc.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT;
      } else return null;
    }
    if (
      _0x4eb94b === RED_RGTC1_Format ||
      _0x4eb94b === SIGNED_RED_RGTC1_Format ||
      _0x4eb94b === RED_GREEN_RGTC2_Format ||
      _0x4eb94b === SIGNED_RED_GREEN_RGTC2_Format
    ) {
      _0x15a2cc = _0x29bbbb.get('EXT_texture_compression_rgtc');
      if (_0x15a2cc !== null) {
        if (_0x4eb94b === RED_RGTC1_Format) return _0x15a2cc.COMPRESSED_RED_RGTC1_EXT;
        if (_0x4eb94b === SIGNED_RED_RGTC1_Format) return _0x15a2cc.COMPRESSED_SIGNED_RED_RGTC1_EXT;
        if (_0x4eb94b === RED_GREEN_RGTC2_Format) return _0x15a2cc.COMPRESSED_RED_GREEN_RGTC2_EXT;
        if (_0x4eb94b === SIGNED_RED_GREEN_RGTC2_Format)
          return _0x15a2cc.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT;
      } else return null;
    }
    if (_0x4eb94b === UnsignedInt248Type) return _0x20e325.UNSIGNED_INT_24_8;
    return _0x20e325[_0x4eb94b] !== undefined ? _0x20e325[_0x4eb94b] : null;
  }
  return { convert: _0x3da891 };
}
const _occlusion_vertex = '\nvoid main() {\n\n\tgl_Position = vec4( position, 1.0 );\n\n}',
  _occlusion_fragment =
    '\nuniform sampler2DArray depthColor;\nuniform float depthWidth;\nuniform float depthHeight;\n\nvoid main() {\n\n\tvec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );\n\n\tif ( coord.x >= 1.0 ) {\n\n\t\tgl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;\n\n\t} else {\n\n\t\tgl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;\n\n\t}\n\n}';
class WebXRDepthSensing {
  constructor() {
    ((this.texture = null), (this.mesh = null), (this.depthNear = 0), (this.depthFar = 0));
  }
  ['init'](_0x344c96, _0xb7638f) {
    if (this.texture === null) {
      const _0x43e657 = new ExternalTexture(_0x344c96.texture);
      ((_0x344c96.depthNear !== _0xb7638f.depthNear || _0x344c96.depthFar !== _0xb7638f.depthFar) &&
        ((this.depthNear = _0x344c96.depthNear), (this.depthFar = _0x344c96.depthFar)),
        (this.texture = _0x43e657));
    }
  }
  ['getMesh'](_0xa3831e) {
    if (this.texture !== null) {
      if (this.mesh === null) {
        const _0x51e849 = _0xa3831e.cameras[0].viewport,
          _0x43d062 = new ShaderMaterial({
            vertexShader: _occlusion_vertex,
            fragmentShader: _occlusion_fragment,
            uniforms: {
              depthColor: { value: this.texture },
              depthWidth: { value: _0x51e849.z },
              depthHeight: { value: _0x51e849.w },
            },
          });
        this.mesh = new Mesh(new PlaneGeometry(20, 20), _0x43d062);
      }
    }
    return this.mesh;
  }
  ['reset']() {
    ((this.texture = null), (this.mesh = null));
  }
  ['getDepthTexture']() {
    return this.texture;
  }
}
class WebXRManager extends EventDispatcher {
  constructor(_0x1277e1, _0x2b0f3d) {
    super();
    const _0x27b56e = this;
    let _0x2509fc = null,
      _0x2d1440 = 1,
      _0x3c8171 = null,
      _0x2713b3 = 'local-floor',
      _0x422285 = 1,
      _0x19c5c7 = null,
      _0x33147b = null,
      _0x2ef42e = null,
      _0x26bdd1 = null,
      _0x360cab = null,
      _0x1b3ad8 = null;
    const _0x5ce662 = typeof XRWebGLBinding !== 'undefined',
      _0x1b467d = new WebXRDepthSensing(),
      _0x2953a6 = {},
      _0x4dc8c9 = _0x2b0f3d.getContextAttributes();
    let _0xee3c8 = null,
      _0x1f4ec5 = null;
    const _0x4e7eb8 = [],
      _0x471372 = [],
      _0x524bae = new Vector2();
    let _0x561848 = null;
    const _0x584c83 = new PerspectiveCamera();
    _0x584c83.viewport = new Vector4();
    const _0x2d853f = new PerspectiveCamera();
    _0x2d853f.viewport = new Vector4();
    const _0x53e1e2 = [_0x584c83, _0x2d853f],
      _0x1efee4 = new ArrayCamera();
    let _0x404e65 = null,
      _0x5003d5 = null;
    ((this.cameraAutoUpdate = true),
      (this.enabled = false),
      (this.isPresenting = false),
      (this.getController = function (_0x392831) {
        let _0x257717 = _0x4e7eb8[_0x392831];
        return (
          _0x257717 === undefined &&
            ((_0x257717 = new WebXRController()), (_0x4e7eb8[_0x392831] = _0x257717)),
          _0x257717.getTargetRaySpace()
        );
      }),
      (this.getControllerGrip = function (_0x518581) {
        let _0x56803d = _0x4e7eb8[_0x518581];
        return (
          _0x56803d === undefined &&
            ((_0x56803d = new WebXRController()), (_0x4e7eb8[_0x518581] = _0x56803d)),
          _0x56803d.getGripSpace()
        );
      }),
      (this.getHand = function (_0x327ae3) {
        let _0x484b83 = _0x4e7eb8[_0x327ae3];
        return (
          _0x484b83 === undefined &&
            ((_0x484b83 = new WebXRController()), (_0x4e7eb8[_0x327ae3] = _0x484b83)),
          _0x484b83.getHandSpace()
        );
      }));
    function _0x19f522(_0x37d0a6) {
      const _0x39b1e1 = _0x471372.indexOf(_0x37d0a6.inputSource);
      if (_0x39b1e1 === -1) return;
      const _0x46787e = _0x4e7eb8[_0x39b1e1];
      _0x46787e !== undefined &&
        (_0x46787e.update(_0x37d0a6.inputSource, _0x37d0a6.frame, _0x19c5c7 || _0x3c8171),
        _0x46787e.dispatchEvent({ type: _0x37d0a6.type, data: _0x37d0a6.inputSource }));
    }
    function _0x3810cf() {
      (_0x2509fc.removeEventListener('select', _0x19f522),
        _0x2509fc.removeEventListener('selectstart', _0x19f522),
        _0x2509fc.removeEventListener('selectend', _0x19f522),
        _0x2509fc.removeEventListener('squeeze', _0x19f522),
        _0x2509fc.removeEventListener('squeezestart', _0x19f522),
        _0x2509fc.removeEventListener('squeezeend', _0x19f522),
        _0x2509fc.removeEventListener('end', _0x3810cf),
        _0x2509fc.removeEventListener('inputsourceschange', _0x455eea));
      for (let _0x3b3382 = 0; _0x3b3382 < _0x4e7eb8.length; _0x3b3382++) {
        const _0x589b58 = _0x471372[_0x3b3382];
        if (_0x589b58 === null) continue;
        ((_0x471372[_0x3b3382] = null), _0x4e7eb8[_0x3b3382].disconnect(_0x589b58));
      }
      ((_0x404e65 = null), (_0x5003d5 = null), _0x1b467d.reset());
      for (const _0x578581 in _0x2953a6) {
        delete _0x2953a6[_0x578581];
      }
      (_0x1277e1.setRenderTarget(_0xee3c8),
        (_0x360cab = null),
        (_0x26bdd1 = null),
        (_0x2ef42e = null),
        (_0x2509fc = null),
        (_0x1f4ec5 = null),
        _0x528963.stop(),
        (_0x27b56e.isPresenting = false),
        _0x1277e1.setPixelRatio(_0x561848),
        _0x1277e1.setSize(_0x524bae.width, _0x524bae.height, false),
        _0x27b56e.dispatchEvent({ type: 'sessionend' }));
    }
    ((this.setFramebufferScaleFactor = function (_0x1ef78e) {
      ((_0x2d1440 = _0x1ef78e),
        _0x27b56e.isPresenting === true &&
          console.warn('THREE.WebXRManager: Cannot change framebuffer scale while presenting.'));
    }),
      (this.setReferenceSpaceType = function (_0x9c6ebc) {
        ((_0x2713b3 = _0x9c6ebc),
          _0x27b56e.isPresenting === true &&
            console.warn('THREE.WebXRManager: Cannot change reference space type while presenting.'));
      }),
      (this.getReferenceSpace = function () {
        return _0x19c5c7 || _0x3c8171;
      }),
      (this.setReferenceSpace = function (_0x5a8fb0) {
        _0x19c5c7 = _0x5a8fb0;
      }),
      (this.getBaseLayer = function () {
        return _0x26bdd1 !== null ? _0x26bdd1 : _0x360cab;
      }),
      (this.getBinding = function () {
        return (
          _0x2ef42e === null && _0x5ce662 && (_0x2ef42e = new XRWebGLBinding(_0x2509fc, _0x2b0f3d)),
          _0x2ef42e
        );
      }),
      (this.getFrame = function () {
        return _0x1b3ad8;
      }),
      (this.getSession = function () {
        return _0x2509fc;
      }),
      (this.setSession = async function (_0x131c2f) {
        _0x2509fc = _0x131c2f;
        if (_0x2509fc !== null) {
          ((_0xee3c8 = _0x1277e1.getRenderTarget()),
            _0x2509fc.addEventListener('select', _0x19f522),
            _0x2509fc.addEventListener('selectstart', _0x19f522),
            _0x2509fc.addEventListener('selectend', _0x19f522),
            _0x2509fc.addEventListener('squeeze', _0x19f522),
            _0x2509fc.addEventListener('squeezestart', _0x19f522),
            _0x2509fc.addEventListener('squeezeend', _0x19f522),
            _0x2509fc.addEventListener('end', _0x3810cf),
            _0x2509fc.addEventListener('inputsourceschange', _0x455eea));
          _0x4dc8c9.xrCompatible !== true && (await _0x2b0f3d.makeXRCompatible());
          ((_0x561848 = _0x1277e1.getPixelRatio()), _0x1277e1.getSize(_0x524bae));
          const _0x524a43 = _0x5ce662 && 'createProjectionLayer' in XRWebGLBinding.prototype;
          if (!_0x524a43) {
            const _0x11e609 = {
              antialias: _0x4dc8c9.antialias,
              alpha: true,
              depth: _0x4dc8c9.depth,
              stencil: _0x4dc8c9.stencil,
              framebufferScaleFactor: _0x2d1440,
            };
            ((_0x360cab = new XRWebGLLayer(_0x2509fc, _0x2b0f3d, _0x11e609)),
              _0x2509fc.updateRenderState({ baseLayer: _0x360cab }),
              _0x1277e1.setPixelRatio(1),
              _0x1277e1.setSize(_0x360cab.framebufferWidth, _0x360cab.framebufferHeight, false),
              (_0x1f4ec5 = new WebGLRenderTarget(_0x360cab.framebufferWidth, _0x360cab.framebufferHeight, {
                format: RGBAFormat,
                type: UnsignedByteType,
                colorSpace: _0x1277e1.outputColorSpace,
                stencilBuffer: _0x4dc8c9.stencil,
                resolveDepthBuffer: _0x360cab.ignoreDepthValues === false,
                resolveStencilBuffer: _0x360cab.ignoreDepthValues === false,
              })));
          } else {
            let _0x544228 = null,
              _0x4714d1 = null,
              _0xdc395f = null;
            _0x4dc8c9.depth &&
              ((_0xdc395f = _0x4dc8c9.stencil ? _0x2b0f3d.DEPTH24_STENCIL8 : _0x2b0f3d.DEPTH_COMPONENT24),
              (_0x544228 = _0x4dc8c9.stencil ? DepthStencilFormat : DepthFormat),
              (_0x4714d1 = _0x4dc8c9.stencil ? UnsignedInt248Type : UnsignedIntType));
            const _0x58c8a0 = {
              colorFormat: _0x2b0f3d.RGBA8,
              depthFormat: _0xdc395f,
              scaleFactor: _0x2d1440,
            };
            ((_0x2ef42e = this.getBinding()),
              (_0x26bdd1 = _0x2ef42e.createProjectionLayer(_0x58c8a0)),
              _0x2509fc.updateRenderState({ layers: [_0x26bdd1] }),
              _0x1277e1.setPixelRatio(1),
              _0x1277e1.setSize(_0x26bdd1.textureWidth, _0x26bdd1.textureHeight, false),
              (_0x1f4ec5 = new WebGLRenderTarget(_0x26bdd1.textureWidth, _0x26bdd1.textureHeight, {
                format: RGBAFormat,
                type: UnsignedByteType,
                depthTexture: new DepthTexture(
                  _0x26bdd1.textureWidth,
                  _0x26bdd1.textureHeight,
                  _0x4714d1,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  _0x544228,
                ),
                stencilBuffer: _0x4dc8c9.stencil,
                colorSpace: _0x1277e1.outputColorSpace,
                samples: _0x4dc8c9.antialias ? 4 : 0,
                resolveDepthBuffer: _0x26bdd1.ignoreDepthValues === false,
                resolveStencilBuffer: _0x26bdd1.ignoreDepthValues === false,
              })));
          }
          ((_0x1f4ec5.isXRRenderTarget = true),
            this.setFoveation(_0x422285),
            (_0x19c5c7 = null),
            (_0x3c8171 = await _0x2509fc.requestReferenceSpace(_0x2713b3)),
            _0x528963.setContext(_0x2509fc),
            _0x528963.start(),
            (_0x27b56e.isPresenting = true),
            _0x27b56e.dispatchEvent({ type: 'sessionstart' }));
        }
      }),
      (this.getEnvironmentBlendMode = function () {
        if (_0x2509fc !== null) return _0x2509fc.environmentBlendMode;
      }),
      (this.getDepthTexture = function () {
        return _0x1b467d.getDepthTexture();
      }));
    function _0x455eea(_0x30a9fd) {
      for (let _0x125981 = 0; _0x125981 < _0x30a9fd.removed.length; _0x125981++) {
        const _0x5dc142 = _0x30a9fd.removed[_0x125981],
          _0x1722d7 = _0x471372.indexOf(_0x5dc142);
        _0x1722d7 >= 0 && ((_0x471372[_0x1722d7] = null), _0x4e7eb8[_0x1722d7].disconnect(_0x5dc142));
      }
      for (let _0xd92bef = 0; _0xd92bef < _0x30a9fd.added.length; _0xd92bef++) {
        const _0x5c41d9 = _0x30a9fd.added[_0xd92bef];
        let _0x9cdc7e = _0x471372.indexOf(_0x5c41d9);
        if (_0x9cdc7e === -1) {
          for (let _0x54d1db = 0; _0x54d1db < _0x4e7eb8.length; _0x54d1db++) {
            if (_0x54d1db >= _0x471372.length) {
              (_0x471372.push(_0x5c41d9), (_0x9cdc7e = _0x54d1db));
              break;
            } else {
              if (_0x471372[_0x54d1db] === null) {
                ((_0x471372[_0x54d1db] = _0x5c41d9), (_0x9cdc7e = _0x54d1db));
                break;
              }
            }
          }
          if (_0x9cdc7e === -1) break;
        }
        const _0x24cdac = _0x4e7eb8[_0x9cdc7e];
        _0x24cdac && _0x24cdac.connect(_0x5c41d9);
      }
    }
    const _0x496a20 = new Vector3(),
      _0x528f1e = new Vector3();
    function _0x22f205(_0x1c5e27, _0x2bd66c, _0x55ffc0) {
      (_0x496a20.setFromMatrixPosition(_0x2bd66c.matrixWorld),
        _0x528f1e.setFromMatrixPosition(_0x55ffc0.matrixWorld));
      const _0x359074 = _0x496a20.distanceTo(_0x528f1e),
        _0x4e6b19 = _0x2bd66c.projectionMatrix.elements,
        _0x2fc5fd = _0x55ffc0.projectionMatrix.elements,
        _0x230ef2 = _0x4e6b19[14] / (_0x4e6b19[10] - 1),
        _0x4af46d = _0x4e6b19[14] / (_0x4e6b19[10] + 1),
        _0x3536e1 = (_0x4e6b19[9] + 1) / _0x4e6b19[5],
        _0x57484b = (_0x4e6b19[9] - 1) / _0x4e6b19[5],
        _0x295885 = (_0x4e6b19[8] - 1) / _0x4e6b19[0],
        _0x3469a5 = (_0x2fc5fd[8] + 1) / _0x2fc5fd[0],
        _0x227283 = _0x230ef2 * _0x295885,
        _0x187f29 = _0x230ef2 * _0x3469a5,
        _0x46ebcc = _0x359074 / (-_0x295885 + _0x3469a5),
        _0x39e729 = _0x46ebcc * -_0x295885;
      (_0x2bd66c.matrixWorld.decompose(_0x1c5e27.position, _0x1c5e27.quaternion, _0x1c5e27.scale),
        _0x1c5e27.translateX(_0x39e729),
        _0x1c5e27.translateZ(_0x46ebcc),
        _0x1c5e27.matrixWorld.compose(_0x1c5e27.position, _0x1c5e27.quaternion, _0x1c5e27.scale),
        _0x1c5e27.matrixWorldInverse.copy(_0x1c5e27.matrixWorld).invert());
      if (_0x4e6b19[10] === -1)
        (_0x1c5e27.projectionMatrix.copy(_0x2bd66c.projectionMatrix),
          _0x1c5e27.projectionMatrixInverse.copy(_0x2bd66c.projectionMatrixInverse));
      else {
        const _0x49bc51 = _0x230ef2 + _0x46ebcc,
          _0x56f72a = _0x4af46d + _0x46ebcc,
          _0x22c1d7 = _0x227283 - _0x39e729,
          _0x4816c7 = _0x187f29 + (_0x359074 - _0x39e729),
          _0x4d612c = ((_0x3536e1 * _0x4af46d) / _0x56f72a) * _0x49bc51,
          _0x2d9182 = ((_0x57484b * _0x4af46d) / _0x56f72a) * _0x49bc51;
        (_0x1c5e27.projectionMatrix.makePerspective(
          _0x22c1d7,
          _0x4816c7,
          _0x4d612c,
          _0x2d9182,
          _0x49bc51,
          _0x56f72a,
        ),
          _0x1c5e27.projectionMatrixInverse.copy(_0x1c5e27.projectionMatrix).invert());
      }
    }
    function _0x36954b(_0x4f3fa1, _0x512a3a) {
      (_0x512a3a === null
        ? _0x4f3fa1.matrixWorld.copy(_0x4f3fa1.matrix)
        : _0x4f3fa1.matrixWorld.multiplyMatrices(_0x512a3a.matrixWorld, _0x4f3fa1.matrix),
        _0x4f3fa1.matrixWorldInverse.copy(_0x4f3fa1.matrixWorld).invert());
    }
    this.updateCamera = function (_0x5671e1) {
      if (_0x2509fc === null) return;
      let _0x4a52d5 = _0x5671e1.near,
        _0x148597 = _0x5671e1.far;
      if (_0x1b467d.texture !== null) {
        if (_0x1b467d.depthNear > 0) _0x4a52d5 = _0x1b467d.depthNear;
        if (_0x1b467d.depthFar > 0) _0x148597 = _0x1b467d.depthFar;
      }
      ((_0x1efee4.near = _0x2d853f.near = _0x584c83.near = _0x4a52d5),
        (_0x1efee4.far = _0x2d853f.far = _0x584c83.far = _0x148597));
      (_0x404e65 !== _0x1efee4.near || _0x5003d5 !== _0x1efee4.far) &&
        (_0x2509fc.updateRenderState({ depthNear: _0x1efee4.near, depthFar: _0x1efee4.far }),
        (_0x404e65 = _0x1efee4.near),
        (_0x5003d5 = _0x1efee4.far));
      ((_0x1efee4.layers.mask = _0x5671e1.layers.mask | 6),
        (_0x584c83.layers.mask = _0x1efee4.layers.mask & 3),
        (_0x2d853f.layers.mask = _0x1efee4.layers.mask & 5));
      const _0x17c877 = _0x5671e1.parent,
        _0x4a4247 = _0x1efee4.cameras;
      _0x36954b(_0x1efee4, _0x17c877);
      for (let _0x267aea = 0; _0x267aea < _0x4a4247.length; _0x267aea++) {
        _0x36954b(_0x4a4247[_0x267aea], _0x17c877);
      }
      (_0x4a4247.length === 2
        ? _0x22f205(_0x1efee4, _0x584c83, _0x2d853f)
        : _0x1efee4.projectionMatrix.copy(_0x584c83.projectionMatrix),
        _0x13217e(_0x5671e1, _0x1efee4, _0x17c877));
    };
    function _0x13217e(_0x23b940, _0x35f307, _0x4ce54b) {
      (_0x4ce54b === null
        ? _0x23b940.matrix.copy(_0x35f307.matrixWorld)
        : (_0x23b940.matrix.copy(_0x4ce54b.matrixWorld),
          _0x23b940.matrix.invert(),
          _0x23b940.matrix.multiply(_0x35f307.matrixWorld)),
        _0x23b940.matrix.decompose(_0x23b940.position, _0x23b940.quaternion, _0x23b940.scale),
        _0x23b940.updateMatrixWorld(true),
        _0x23b940.projectionMatrix.copy(_0x35f307.projectionMatrix),
        _0x23b940.projectionMatrixInverse.copy(_0x35f307.projectionMatrixInverse),
        _0x23b940.isPerspectiveCamera &&
          ((_0x23b940.fov = RAD2DEG * 2 * Math.atan(1 / _0x23b940.projectionMatrix.elements[5])),
          (_0x23b940.zoom = 1)));
    }
    ((this.getCamera = function () {
      return _0x1efee4;
    }),
      (this.getFoveation = function () {
        if (_0x26bdd1 === null && _0x360cab === null) return undefined;
        return _0x422285;
      }),
      (this.setFoveation = function (_0x50f987) {
        ((_0x422285 = _0x50f987),
          _0x26bdd1 !== null && (_0x26bdd1.fixedFoveation = _0x50f987),
          _0x360cab !== null &&
            _0x360cab.fixedFoveation !== undefined &&
            (_0x360cab.fixedFoveation = _0x50f987));
      }),
      (this.hasDepthSensing = function () {
        return _0x1b467d.texture !== null;
      }),
      (this.getDepthSensingMesh = function () {
        return _0x1b467d.getMesh(_0x1efee4);
      }),
      (this.getCameraTexture = function (_0x4d9b7c) {
        return _0x2953a6[_0x4d9b7c];
      }));
    let _0x27a82d = null;
    function _0x52c6d5(_0x51dc99, _0x3b801c) {
      ((_0x33147b = _0x3b801c.getViewerPose(_0x19c5c7 || _0x3c8171)), (_0x1b3ad8 = _0x3b801c));
      if (_0x33147b !== null) {
        const _0x356c04 = _0x33147b.views;
        _0x360cab !== null &&
          (_0x1277e1.setRenderTargetFramebuffer(_0x1f4ec5, _0x360cab.framebuffer),
          _0x1277e1.setRenderTarget(_0x1f4ec5));
        let _0x26e286 = false;
        _0x356c04.length !== _0x1efee4.cameras.length && ((_0x1efee4.cameras.length = 0), (_0x26e286 = true));
        for (let _0x4ba0d0 = 0; _0x4ba0d0 < _0x356c04.length; _0x4ba0d0++) {
          const _0x216dc2 = _0x356c04[_0x4ba0d0];
          let _0x8dc74b = null;
          if (_0x360cab !== null) _0x8dc74b = _0x360cab.getViewport(_0x216dc2);
          else {
            const _0x434f81 = _0x2ef42e.getViewSubImage(_0x26bdd1, _0x216dc2);
            ((_0x8dc74b = _0x434f81.viewport),
              _0x4ba0d0 === 0 &&
                (_0x1277e1.setRenderTargetTextures(
                  _0x1f4ec5,
                  _0x434f81.colorTexture,
                  _0x434f81.depthStencilTexture,
                ),
                _0x1277e1.setRenderTarget(_0x1f4ec5)));
          }
          let _0x43a641 = _0x53e1e2[_0x4ba0d0];
          (_0x43a641 === undefined &&
            ((_0x43a641 = new PerspectiveCamera()),
            _0x43a641.layers.enable(_0x4ba0d0),
            (_0x43a641.viewport = new Vector4()),
            (_0x53e1e2[_0x4ba0d0] = _0x43a641)),
            _0x43a641.matrix.fromArray(_0x216dc2.transform.matrix),
            _0x43a641.matrix.decompose(_0x43a641.position, _0x43a641.quaternion, _0x43a641.scale),
            _0x43a641.projectionMatrix.fromArray(_0x216dc2.projectionMatrix),
            _0x43a641.projectionMatrixInverse.copy(_0x43a641.projectionMatrix).invert(),
            _0x43a641.viewport.set(_0x8dc74b.x, _0x8dc74b.y, _0x8dc74b.width, _0x8dc74b.height),
            _0x4ba0d0 === 0 &&
              (_0x1efee4.matrix.copy(_0x43a641.matrix),
              _0x1efee4.matrix.decompose(_0x1efee4.position, _0x1efee4.quaternion, _0x1efee4.scale)),
            _0x26e286 === true && _0x1efee4.cameras.push(_0x43a641));
        }
        const _0x32685b = _0x2509fc.enabledFeatures,
          _0x98f371 =
            _0x32685b && _0x32685b.includes('depth-sensing') && _0x2509fc.depthUsage == 'gpu-optimized';
        if (_0x98f371 && _0x5ce662) {
          _0x2ef42e = _0x27b56e.getBinding();
          const _0x98ce87 = _0x2ef42e.getDepthInformation(_0x356c04[0]);
          _0x98ce87 &&
            _0x98ce87.isValid &&
            _0x98ce87.texture &&
            _0x1b467d.init(_0x98ce87, _0x2509fc.renderState);
        }
        const _0x2abcb2 = _0x32685b && _0x32685b.includes('camera-access');
        if (_0x2abcb2 && _0x5ce662) {
          (_0x1277e1.state.unbindTexture(), (_0x2ef42e = _0x27b56e.getBinding()));
          for (let _0x37daaa = 0; _0x37daaa < _0x356c04.length; _0x37daaa++) {
            const _0x261ac0 = _0x356c04[_0x37daaa].camera;
            if (_0x261ac0) {
              let _0x407f65 = _0x2953a6[_0x261ac0];
              !_0x407f65 && ((_0x407f65 = new ExternalTexture()), (_0x2953a6[_0x261ac0] = _0x407f65));
              const _0xf0838d = _0x2ef42e.getCameraImage(_0x261ac0);
              _0x407f65.sourceTexture = _0xf0838d;
            }
          }
        }
      }
      for (let _0x2364b0 = 0; _0x2364b0 < _0x4e7eb8.length; _0x2364b0++) {
        const _0x242969 = _0x471372[_0x2364b0],
          _0x1753eb = _0x4e7eb8[_0x2364b0];
        _0x242969 !== null &&
          _0x1753eb !== undefined &&
          _0x1753eb.update(_0x242969, _0x3b801c, _0x19c5c7 || _0x3c8171);
      }
      if (_0x27a82d) _0x27a82d(_0x51dc99, _0x3b801c);
      (_0x3b801c.detectedPlanes && _0x27b56e.dispatchEvent({ type: 'planesdetected', data: _0x3b801c }),
        (_0x1b3ad8 = null));
    }
    const _0x528963 = new WebGLAnimation();
    (_0x528963.setAnimationLoop(_0x52c6d5),
      (this.setAnimationLoop = function (_0x388551) {
        _0x27a82d = _0x388551;
      }),
      (this.dispose = function () {}));
  }
}
const _e1 = new Euler(),
  _m1 = new Matrix4();
function WebGLMaterials(_0x3bb1ea, _0x11003e) {
  function _0x5d8089(_0x860db2, _0x43b532) {
    (_0x860db2.matrixAutoUpdate === true && _0x860db2.updateMatrix(), _0x43b532.value.copy(_0x860db2.matrix));
  }
  function _0x4f959e(_0x462c76, _0x97a710) {
    _0x97a710.color.getRGB(_0x462c76.fogColor.value, getUnlitUniformColorSpace(_0x3bb1ea));
    if (_0x97a710.isFog)
      ((_0x462c76.fogNear.value = _0x97a710.near), (_0x462c76.fogFar.value = _0x97a710.far));
    else _0x97a710.isFogExp2 && (_0x462c76.fogDensity.value = _0x97a710.density);
  }
  function _0x3c7f79(_0x58ae4f, _0x11cd30, _0x447211, _0x375c7e, _0x5c5e79) {
    if (_0x11cd30.isMeshBasicMaterial) _0x2ffc5f(_0x58ae4f, _0x11cd30);
    else {
      if (_0x11cd30.isMeshLambertMaterial) _0x2ffc5f(_0x58ae4f, _0x11cd30);
      else {
        if (_0x11cd30.isMeshToonMaterial) (_0x2ffc5f(_0x58ae4f, _0x11cd30), _0x234fa6(_0x58ae4f, _0x11cd30));
        else {
          if (_0x11cd30.isMeshPhongMaterial)
            (_0x2ffc5f(_0x58ae4f, _0x11cd30), _0x14855c(_0x58ae4f, _0x11cd30));
          else {
            if (_0x11cd30.isMeshStandardMaterial)
              (_0x2ffc5f(_0x58ae4f, _0x11cd30),
                _0x425f42(_0x58ae4f, _0x11cd30),
                _0x11cd30.isMeshPhysicalMaterial && _0x389b33(_0x58ae4f, _0x11cd30, _0x5c5e79));
            else {
              if (_0x11cd30.isMeshMatcapMaterial)
                (_0x2ffc5f(_0x58ae4f, _0x11cd30), _0x58ffb7(_0x58ae4f, _0x11cd30));
              else {
                if (_0x11cd30.isMeshDepthMaterial) _0x2ffc5f(_0x58ae4f, _0x11cd30);
                else {
                  if (_0x11cd30.isMeshDistanceMaterial)
                    (_0x2ffc5f(_0x58ae4f, _0x11cd30), _0x2f946d(_0x58ae4f, _0x11cd30));
                  else {
                    if (_0x11cd30.isMeshNormalMaterial) _0x2ffc5f(_0x58ae4f, _0x11cd30);
                    else {
                      if (_0x11cd30.isLineBasicMaterial)
                        (_0x576bec(_0x58ae4f, _0x11cd30),
                          _0x11cd30.isLineDashedMaterial && _0x3c4e25(_0x58ae4f, _0x11cd30));
                      else {
                        if (_0x11cd30.isPointsMaterial) _0x1da912(_0x58ae4f, _0x11cd30, _0x447211, _0x375c7e);
                        else {
                          if (_0x11cd30.isSpriteMaterial) _0x5ef4bd(_0x58ae4f, _0x11cd30);
                          else {
                            if (_0x11cd30.isShadowMaterial)
                              (_0x58ae4f.color.value.copy(_0x11cd30.color),
                                (_0x58ae4f.opacity.value = _0x11cd30.opacity));
                            else _0x11cd30.isShaderMaterial && (_0x11cd30.uniformsNeedUpdate = false);
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  function _0x2ffc5f(_0x57d73e, _0x4341ca) {
    _0x57d73e.opacity.value = _0x4341ca.opacity;
    _0x4341ca.color && _0x57d73e.diffuse.value.copy(_0x4341ca.color);
    _0x4341ca.emissive &&
      _0x57d73e.emissive.value.copy(_0x4341ca.emissive).multiplyScalar(_0x4341ca.emissiveIntensity);
    _0x4341ca.map &&
      ((_0x57d73e.map.value = _0x4341ca.map), _0x5d8089(_0x4341ca.map, _0x57d73e.mapTransform));
    _0x4341ca.alphaMap &&
      ((_0x57d73e.alphaMap.value = _0x4341ca.alphaMap),
      _0x5d8089(_0x4341ca.alphaMap, _0x57d73e.alphaMapTransform));
    _0x4341ca.bumpMap &&
      ((_0x57d73e.bumpMap.value = _0x4341ca.bumpMap),
      _0x5d8089(_0x4341ca.bumpMap, _0x57d73e.bumpMapTransform),
      (_0x57d73e.bumpScale.value = _0x4341ca.bumpScale),
      _0x4341ca.side === BackSide && (_0x57d73e.bumpScale.value *= -1));
    _0x4341ca.normalMap &&
      ((_0x57d73e.normalMap.value = _0x4341ca.normalMap),
      _0x5d8089(_0x4341ca.normalMap, _0x57d73e.normalMapTransform),
      _0x57d73e.normalScale.value.copy(_0x4341ca.normalScale),
      _0x4341ca.side === BackSide && _0x57d73e.normalScale.value.negate());
    _0x4341ca.displacementMap &&
      ((_0x57d73e.displacementMap.value = _0x4341ca.displacementMap),
      _0x5d8089(_0x4341ca.displacementMap, _0x57d73e.displacementMapTransform),
      (_0x57d73e.displacementScale.value = _0x4341ca.displacementScale),
      (_0x57d73e.displacementBias.value = _0x4341ca.displacementBias));
    _0x4341ca.emissiveMap &&
      ((_0x57d73e.emissiveMap.value = _0x4341ca.emissiveMap),
      _0x5d8089(_0x4341ca.emissiveMap, _0x57d73e.emissiveMapTransform));
    _0x4341ca.specularMap &&
      ((_0x57d73e.specularMap.value = _0x4341ca.specularMap),
      _0x5d8089(_0x4341ca.specularMap, _0x57d73e.specularMapTransform));
    _0x4341ca.alphaTest > 0 && (_0x57d73e.alphaTest.value = _0x4341ca.alphaTest);
    const _0x50279f = _0x11003e.get(_0x4341ca),
      _0xe06719 = _0x50279f.envMap,
      _0x127ae5 = _0x50279f.envMapRotation;
    (_0xe06719 &&
      ((_0x57d73e.envMap.value = _0xe06719),
      _e1.copy(_0x127ae5),
      (_e1.x *= -1),
      (_e1.y *= -1),
      (_e1.z *= -1),
      _0xe06719.isCubeTexture && _0xe06719.isRenderTargetTexture === false && ((_e1.y *= -1), (_e1.z *= -1)),
      _0x57d73e.envMapRotation.value.setFromMatrix4(_m1.makeRotationFromEuler(_e1)),
      (_0x57d73e.flipEnvMap.value =
        _0xe06719.isCubeTexture && _0xe06719.isRenderTargetTexture === false ? -1 : 1),
      (_0x57d73e.reflectivity.value = _0x4341ca.reflectivity),
      (_0x57d73e.ior.value = _0x4341ca.ior),
      (_0x57d73e.refractionRatio.value = _0x4341ca.refractionRatio)),
      _0x4341ca.lightMap &&
        ((_0x57d73e.lightMap.value = _0x4341ca.lightMap),
        (_0x57d73e.lightMapIntensity.value = _0x4341ca.lightMapIntensity),
        _0x5d8089(_0x4341ca.lightMap, _0x57d73e.lightMapTransform)),
      _0x4341ca.aoMap &&
        ((_0x57d73e.aoMap.value = _0x4341ca.aoMap),
        (_0x57d73e.aoMapIntensity.value = _0x4341ca.aoMapIntensity),
        _0x5d8089(_0x4341ca.aoMap, _0x57d73e.aoMapTransform)));
  }
  function _0x576bec(_0x3cef18, _0x3d835d) {
    (_0x3cef18.diffuse.value.copy(_0x3d835d.color),
      (_0x3cef18.opacity.value = _0x3d835d.opacity),
      _0x3d835d.map &&
        ((_0x3cef18.map.value = _0x3d835d.map), _0x5d8089(_0x3d835d.map, _0x3cef18.mapTransform)));
  }
  function _0x3c4e25(_0xa863a8, _0x47bc10) {
    ((_0xa863a8.dashSize.value = _0x47bc10.dashSize),
      (_0xa863a8.totalSize.value = _0x47bc10.dashSize + _0x47bc10.gapSize),
      (_0xa863a8.scale.value = _0x47bc10.scale));
  }
  function _0x1da912(_0x44306e, _0x47753a, _0x538fe0, _0x2febdb) {
    (_0x44306e.diffuse.value.copy(_0x47753a.color),
      (_0x44306e.opacity.value = _0x47753a.opacity),
      (_0x44306e.size.value = _0x47753a.size * _0x538fe0),
      (_0x44306e.scale.value = _0x2febdb * 0.5),
      _0x47753a.map &&
        ((_0x44306e.map.value = _0x47753a.map), _0x5d8089(_0x47753a.map, _0x44306e.uvTransform)),
      _0x47753a.alphaMap &&
        ((_0x44306e.alphaMap.value = _0x47753a.alphaMap),
        _0x5d8089(_0x47753a.alphaMap, _0x44306e.alphaMapTransform)),
      _0x47753a.alphaTest > 0 && (_0x44306e.alphaTest.value = _0x47753a.alphaTest));
  }
  function _0x5ef4bd(_0x321db5, _0xc94cbd) {
    (_0x321db5.diffuse.value.copy(_0xc94cbd.color),
      (_0x321db5.opacity.value = _0xc94cbd.opacity),
      (_0x321db5.rotation.value = _0xc94cbd.rotation),
      _0xc94cbd.map &&
        ((_0x321db5.map.value = _0xc94cbd.map), _0x5d8089(_0xc94cbd.map, _0x321db5.mapTransform)),
      _0xc94cbd.alphaMap &&
        ((_0x321db5.alphaMap.value = _0xc94cbd.alphaMap),
        _0x5d8089(_0xc94cbd.alphaMap, _0x321db5.alphaMapTransform)),
      _0xc94cbd.alphaTest > 0 && (_0x321db5.alphaTest.value = _0xc94cbd.alphaTest));
  }
  function _0x14855c(_0x36bdfd, _0x1f9b6b) {
    (_0x36bdfd.specular.value.copy(_0x1f9b6b.specular),
      (_0x36bdfd.shininess.value = Math.max(_0x1f9b6b.shininess, 0.0001)));
  }
  function _0x234fa6(_0x30293c, _0x80781a) {
    _0x80781a.gradientMap && (_0x30293c.gradientMap.value = _0x80781a.gradientMap);
  }
  function _0x425f42(_0x5bcde8, _0x6ef2e4) {
    ((_0x5bcde8.metalness.value = _0x6ef2e4.metalness),
      _0x6ef2e4.metalnessMap &&
        ((_0x5bcde8.metalnessMap.value = _0x6ef2e4.metalnessMap),
        _0x5d8089(_0x6ef2e4.metalnessMap, _0x5bcde8.metalnessMapTransform)),
      (_0x5bcde8.roughness.value = _0x6ef2e4.roughness),
      _0x6ef2e4.roughnessMap &&
        ((_0x5bcde8.roughnessMap.value = _0x6ef2e4.roughnessMap),
        _0x5d8089(_0x6ef2e4.roughnessMap, _0x5bcde8.roughnessMapTransform)),
      _0x6ef2e4.envMap && (_0x5bcde8.envMapIntensity.value = _0x6ef2e4.envMapIntensity));
  }
  function _0x389b33(_0x2ce335, _0xcc6327, _0x2b6e5e) {
    ((_0x2ce335.ior.value = _0xcc6327.ior),
      _0xcc6327.sheen > 0 &&
        (_0x2ce335.sheenColor.value.copy(_0xcc6327.sheenColor).multiplyScalar(_0xcc6327.sheen),
        (_0x2ce335.sheenRoughness.value = _0xcc6327.sheenRoughness),
        _0xcc6327.sheenColorMap &&
          ((_0x2ce335.sheenColorMap.value = _0xcc6327.sheenColorMap),
          _0x5d8089(_0xcc6327.sheenColorMap, _0x2ce335.sheenColorMapTransform)),
        _0xcc6327.sheenRoughnessMap &&
          ((_0x2ce335.sheenRoughnessMap.value = _0xcc6327.sheenRoughnessMap),
          _0x5d8089(_0xcc6327.sheenRoughnessMap, _0x2ce335.sheenRoughnessMapTransform))),
      _0xcc6327.clearcoat > 0 &&
        ((_0x2ce335.clearcoat.value = _0xcc6327.clearcoat),
        (_0x2ce335.clearcoatRoughness.value = _0xcc6327.clearcoatRoughness),
        _0xcc6327.clearcoatMap &&
          ((_0x2ce335.clearcoatMap.value = _0xcc6327.clearcoatMap),
          _0x5d8089(_0xcc6327.clearcoatMap, _0x2ce335.clearcoatMapTransform)),
        _0xcc6327.clearcoatRoughnessMap &&
          ((_0x2ce335.clearcoatRoughnessMap.value = _0xcc6327.clearcoatRoughnessMap),
          _0x5d8089(_0xcc6327.clearcoatRoughnessMap, _0x2ce335.clearcoatRoughnessMapTransform)),
        _0xcc6327.clearcoatNormalMap &&
          ((_0x2ce335.clearcoatNormalMap.value = _0xcc6327.clearcoatNormalMap),
          _0x5d8089(_0xcc6327.clearcoatNormalMap, _0x2ce335.clearcoatNormalMapTransform),
          _0x2ce335.clearcoatNormalScale.value.copy(_0xcc6327.clearcoatNormalScale),
          _0xcc6327.side === BackSide && _0x2ce335.clearcoatNormalScale.value.negate())),
      _0xcc6327.dispersion > 0 && (_0x2ce335.dispersion.value = _0xcc6327.dispersion),
      _0xcc6327.iridescence > 0 &&
        ((_0x2ce335.iridescence.value = _0xcc6327.iridescence),
        (_0x2ce335.iridescenceIOR.value = _0xcc6327.iridescenceIOR),
        (_0x2ce335.iridescenceThicknessMinimum.value = _0xcc6327.iridescenceThicknessRange[0]),
        (_0x2ce335.iridescenceThicknessMaximum.value = _0xcc6327.iridescenceThicknessRange[1]),
        _0xcc6327.iridescenceMap &&
          ((_0x2ce335.iridescenceMap.value = _0xcc6327.iridescenceMap),
          _0x5d8089(_0xcc6327.iridescenceMap, _0x2ce335.iridescenceMapTransform)),
        _0xcc6327.iridescenceThicknessMap &&
          ((_0x2ce335.iridescenceThicknessMap.value = _0xcc6327.iridescenceThicknessMap),
          _0x5d8089(_0xcc6327.iridescenceThicknessMap, _0x2ce335.iridescenceThicknessMapTransform))),
      _0xcc6327.transmission > 0 &&
        ((_0x2ce335.transmission.value = _0xcc6327.transmission),
        (_0x2ce335.transmissionSamplerMap.value = _0x2b6e5e.texture),
        _0x2ce335.transmissionSamplerSize.value.set(_0x2b6e5e.width, _0x2b6e5e.height),
        _0xcc6327.transmissionMap &&
          ((_0x2ce335.transmissionMap.value = _0xcc6327.transmissionMap),
          _0x5d8089(_0xcc6327.transmissionMap, _0x2ce335.transmissionMapTransform)),
        (_0x2ce335.thickness.value = _0xcc6327.thickness),
        _0xcc6327.thicknessMap &&
          ((_0x2ce335.thicknessMap.value = _0xcc6327.thicknessMap),
          _0x5d8089(_0xcc6327.thicknessMap, _0x2ce335.thicknessMapTransform)),
        (_0x2ce335.attenuationDistance.value = _0xcc6327.attenuationDistance),
        _0x2ce335.attenuationColor.value.copy(_0xcc6327.attenuationColor)),
      _0xcc6327.anisotropy > 0 &&
        (_0x2ce335.anisotropyVector.value.set(
          _0xcc6327.anisotropy * Math.cos(_0xcc6327.anisotropyRotation),
          _0xcc6327.anisotropy * Math.sin(_0xcc6327.anisotropyRotation),
        ),
        _0xcc6327.anisotropyMap &&
          ((_0x2ce335.anisotropyMap.value = _0xcc6327.anisotropyMap),
          _0x5d8089(_0xcc6327.anisotropyMap, _0x2ce335.anisotropyMapTransform))),
      (_0x2ce335.specularIntensity.value = _0xcc6327.specularIntensity),
      _0x2ce335.specularColor.value.copy(_0xcc6327.specularColor),
      _0xcc6327.specularColorMap &&
        ((_0x2ce335.specularColorMap.value = _0xcc6327.specularColorMap),
        _0x5d8089(_0xcc6327.specularColorMap, _0x2ce335.specularColorMapTransform)),
      _0xcc6327.specularIntensityMap &&
        ((_0x2ce335.specularIntensityMap.value = _0xcc6327.specularIntensityMap),
        _0x5d8089(_0xcc6327.specularIntensityMap, _0x2ce335.specularIntensityMapTransform)));
  }
  function _0x58ffb7(_0x557ea9, _0x4cd6cb) {
    _0x4cd6cb.matcap && (_0x557ea9.matcap.value = _0x4cd6cb.matcap);
  }
  function _0x2f946d(_0x1be7ae, _0x3acec3) {
    const _0x3362e1 = _0x11003e.get(_0x3acec3).light;
    (_0x1be7ae.referencePosition.value.setFromMatrixPosition(_0x3362e1.matrixWorld),
      (_0x1be7ae.nearDistance.value = _0x3362e1.shadow.camera.near),
      (_0x1be7ae.farDistance.value = _0x3362e1.shadow.camera.far));
  }
  return { refreshFogUniforms: _0x4f959e, refreshMaterialUniforms: _0x3c7f79 };
}
function WebGLUniformsGroups(_0x11f221, _0x23e6b5, _0x39d4e4, _0x5efc62) {
  let _0x3cd80e = {},
    _0x1f1c94 = {},
    _0x454f1c = [];
  const _0x4fb391 = _0x11f221.getParameter(_0x11f221.MAX_UNIFORM_BUFFER_BINDINGS);
  function _0x13be93(_0x367c0e, _0x43183b) {
    const _0x163dea = _0x43183b.program;
    _0x5efc62.uniformBlockBinding(_0x367c0e, _0x163dea);
  }
  function _0x20c3e3(_0x8da53c, _0x1b0e26) {
    let _0xdfa57 = _0x3cd80e[_0x8da53c.id];
    _0xdfa57 === undefined &&
      (_0x39a3e4(_0x8da53c),
      (_0xdfa57 = _0x542125(_0x8da53c)),
      (_0x3cd80e[_0x8da53c.id] = _0xdfa57),
      _0x8da53c.addEventListener('dispose', _0x18d851));
    const _0x553aff = _0x1b0e26.program;
    _0x5efc62.updateUBOMapping(_0x8da53c, _0x553aff);
    const _0x52b89e = _0x23e6b5.render.frame;
    _0x1f1c94[_0x8da53c.id] !== _0x52b89e && (_0x3b09ea(_0x8da53c), (_0x1f1c94[_0x8da53c.id] = _0x52b89e));
  }
  function _0x542125(_0x134e87) {
    const _0x34e5c2 = _0x3495a0();
    _0x134e87.__bindingPointIndex = _0x34e5c2;
    const _0x468bc8 = _0x11f221.createBuffer(),
      _0x585506 = _0x134e87.__size,
      _0x459344 = _0x134e87.usage;
    return (
      _0x11f221.bindBuffer(_0x11f221.UNIFORM_BUFFER, _0x468bc8),
      _0x11f221.bufferData(_0x11f221.UNIFORM_BUFFER, _0x585506, _0x459344),
      _0x11f221.bindBuffer(_0x11f221.UNIFORM_BUFFER, null),
      _0x11f221.bindBufferBase(_0x11f221.UNIFORM_BUFFER, _0x34e5c2, _0x468bc8),
      _0x468bc8
    );
  }
  function _0x3495a0() {
    for (let _0x146346 = 0; _0x146346 < _0x4fb391; _0x146346++) {
      if (_0x454f1c.indexOf(_0x146346) === -1) return (_0x454f1c.push(_0x146346), _0x146346);
    }
    return (
      console.error('THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached.'),
      0
    );
  }
  function _0x3b09ea(_0x3c1bc1) {
    const _0x5cb1e9 = _0x3cd80e[_0x3c1bc1.id],
      _0x290b72 = _0x3c1bc1.uniforms,
      _0xcaf0e0 = _0x3c1bc1.__cache;
    _0x11f221.bindBuffer(_0x11f221.UNIFORM_BUFFER, _0x5cb1e9);
    for (let _0x44b015 = 0, _0x29b131 = _0x290b72.length; _0x44b015 < _0x29b131; _0x44b015++) {
      const _0x807731 = Array.isArray(_0x290b72[_0x44b015]) ? _0x290b72[_0x44b015] : [_0x290b72[_0x44b015]];
      for (let _0x14f726 = 0, _0x3a7283 = _0x807731.length; _0x14f726 < _0x3a7283; _0x14f726++) {
        const _0x318b8e = _0x807731[_0x14f726];
        if (_0x28e6ab(_0x318b8e, _0x44b015, _0x14f726, _0xcaf0e0) === true) {
          const _0x1aa051 = _0x318b8e.__offset,
            _0x20aeba = Array.isArray(_0x318b8e.value) ? _0x318b8e.value : [_0x318b8e.value];
          let _0x577792 = 0;
          for (let _0x12940b = 0; _0x12940b < _0x20aeba.length; _0x12940b++) {
            const _0x3db8b0 = _0x20aeba[_0x12940b],
              _0x49212a = _0x489323(_0x3db8b0);
            if (typeof _0x3db8b0 === 'number' || typeof _0x3db8b0 === 'boolean')
              ((_0x318b8e.__data[0] = _0x3db8b0),
                _0x11f221.bufferSubData(_0x11f221.UNIFORM_BUFFER, _0x1aa051 + _0x577792, _0x318b8e.__data));
            else
              _0x3db8b0.isMatrix3
                ? ((_0x318b8e.__data[0] = _0x3db8b0.elements[0]),
                  (_0x318b8e.__data[1] = _0x3db8b0.elements[1]),
                  (_0x318b8e.__data[2] = _0x3db8b0.elements[2]),
                  (_0x318b8e.__data[3] = 0),
                  (_0x318b8e.__data[4] = _0x3db8b0.elements[3]),
                  (_0x318b8e.__data[5] = _0x3db8b0.elements[4]),
                  (_0x318b8e.__data[6] = _0x3db8b0.elements[5]),
                  (_0x318b8e.__data[7] = 0),
                  (_0x318b8e.__data[8] = _0x3db8b0.elements[6]),
                  (_0x318b8e.__data[9] = _0x3db8b0.elements[7]),
                  (_0x318b8e.__data[10] = _0x3db8b0.elements[8]),
                  (_0x318b8e.__data[11] = 0))
                : (_0x3db8b0.toArray(_0x318b8e.__data, _0x577792),
                  (_0x577792 += _0x49212a.storage / Float32Array.BYTES_PER_ELEMENT));
          }
          _0x11f221.bufferSubData(_0x11f221.UNIFORM_BUFFER, _0x1aa051, _0x318b8e.__data);
        }
      }
    }
    _0x11f221.bindBuffer(_0x11f221.UNIFORM_BUFFER, null);
  }
  function _0x28e6ab(_0x5b3c3a, _0x23df05, _0x4bece9, _0x5a3b13) {
    const _0x5b01a7 = _0x5b3c3a.value,
      _0x961f4f = _0x23df05 + '_' + _0x4bece9;
    if (_0x5a3b13[_0x961f4f] === undefined)
      return (
        typeof _0x5b01a7 === 'number' || typeof _0x5b01a7 === 'boolean'
          ? (_0x5a3b13[_0x961f4f] = _0x5b01a7)
          : (_0x5a3b13[_0x961f4f] = _0x5b01a7.clone()),
        true
      );
    else {
      const _0xa7166f = _0x5a3b13[_0x961f4f];
      if (typeof _0x5b01a7 === 'number' || typeof _0x5b01a7 === 'boolean') {
        if (_0xa7166f !== _0x5b01a7) return ((_0x5a3b13[_0x961f4f] = _0x5b01a7), true);
      } else {
        if (_0xa7166f.equals(_0x5b01a7) === false) return (_0xa7166f.copy(_0x5b01a7), true);
      }
    }
    return false;
  }
  function _0x39a3e4(_0x31221e) {
    const _0x33e3b1 = _0x31221e.uniforms;
    let _0x2783cd = 0;
    const _0x4e7c7e = 16;
    for (let _0x519835 = 0, _0x16bd6b = _0x33e3b1.length; _0x519835 < _0x16bd6b; _0x519835++) {
      const _0x4ab0c2 = Array.isArray(_0x33e3b1[_0x519835]) ? _0x33e3b1[_0x519835] : [_0x33e3b1[_0x519835]];
      for (let _0x47556f = 0, _0x296703 = _0x4ab0c2.length; _0x47556f < _0x296703; _0x47556f++) {
        const _0x57197a = _0x4ab0c2[_0x47556f],
          _0x200ea0 = Array.isArray(_0x57197a.value) ? _0x57197a.value : [_0x57197a.value];
        for (let _0x9a8030 = 0, _0x383ea9 = _0x200ea0.length; _0x9a8030 < _0x383ea9; _0x9a8030++) {
          const _0x496c15 = _0x200ea0[_0x9a8030],
            _0x33f434 = _0x489323(_0x496c15),
            _0x1eb464 = _0x2783cd % _0x4e7c7e,
            _0x577ad = _0x1eb464 % _0x33f434.boundary,
            _0xb9f7a8 = _0x1eb464 + _0x577ad;
          ((_0x2783cd += _0x577ad),
            _0xb9f7a8 !== 0 &&
              _0x4e7c7e - _0xb9f7a8 < _0x33f434.storage &&
              (_0x2783cd += _0x4e7c7e - _0xb9f7a8),
            (_0x57197a.__data = new Float32Array(_0x33f434.storage / Float32Array.BYTES_PER_ELEMENT)),
            (_0x57197a.__offset = _0x2783cd),
            (_0x2783cd += _0x33f434.storage));
        }
      }
    }
    const _0x310685 = _0x2783cd % _0x4e7c7e;
    if (_0x310685 > 0) _0x2783cd += _0x4e7c7e - _0x310685;
    return ((_0x31221e.__size = _0x2783cd), (_0x31221e.__cache = {}), this);
  }
  function _0x489323(_0x7c34d2) {
    const _0xcfb133 = { boundary: 0, storage: 0 };
    if (typeof _0x7c34d2 === 'number' || typeof _0x7c34d2 === 'boolean')
      ((_0xcfb133.boundary = 4), (_0xcfb133.storage = 4));
    else {
      if (_0x7c34d2.isVector2) ((_0xcfb133.boundary = 8), (_0xcfb133.storage = 8));
      else {
        if (_0x7c34d2.isVector3 || _0x7c34d2.isColor) ((_0xcfb133.boundary = 16), (_0xcfb133.storage = 12));
        else {
          if (_0x7c34d2.isVector4) ((_0xcfb133.boundary = 16), (_0xcfb133.storage = 16));
          else {
            if (_0x7c34d2.isMatrix3) ((_0xcfb133.boundary = 48), (_0xcfb133.storage = 48));
            else {
              if (_0x7c34d2.isMatrix4) ((_0xcfb133.boundary = 64), (_0xcfb133.storage = 64));
              else
                _0x7c34d2.isTexture
                  ? console.warn(
                      'THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group.',
                    )
                  : console.warn('THREE.WebGLRenderer: Unsupported uniform value type.', _0x7c34d2);
            }
          }
        }
      }
    }
    return _0xcfb133;
  }
  function _0x18d851(_0x4115c6) {
    const _0x37f27b = _0x4115c6.target;
    _0x37f27b.removeEventListener('dispose', _0x18d851);
    const _0x682bfe = _0x454f1c.indexOf(_0x37f27b.__bindingPointIndex);
    (_0x454f1c.splice(_0x682bfe, 1),
      _0x11f221.deleteBuffer(_0x3cd80e[_0x37f27b.id]),
      delete _0x3cd80e[_0x37f27b.id],
      delete _0x1f1c94[_0x37f27b.id]);
  }
  function _0x5a7a5a() {
    for (const _0x307b23 in _0x3cd80e) {
      _0x11f221.deleteBuffer(_0x3cd80e[_0x307b23]);
    }
    ((_0x454f1c = []), (_0x3cd80e = {}), (_0x1f1c94 = {}));
  }
  return { bind: _0x13be93, update: _0x20c3e3, dispose: _0x5a7a5a };
}
class WebGLRenderer {
  constructor(_0x502de4 = {}) {
    const {
      canvas: canvas = createCanvasElement(),
      context: context = null,
      depth: depth = true,
      stencil: stencil = false,
      alpha: alpha = false,
      antialias: antialias = false,
      premultipliedAlpha: premultipliedAlpha = true,
      preserveDrawingBuffer: preserveDrawingBuffer = false,
      powerPreference: powerPreference = 'default',
      failIfMajorPerformanceCaveat: failIfMajorPerformanceCaveat = false,
      reversedDepthBuffer: reversedDepthBuffer = false,
    } = _0x502de4;
    this.isWebGLRenderer = true;
    let _0x492239;
    if (context !== null) {
      if (typeof WebGLRenderingContext !== 'undefined' && context instanceof WebGLRenderingContext)
        throw new Error('THREE.WebGLRenderer: WebGL 1 is not supported since r163.');
      _0x492239 = context.getContextAttributes().alpha;
    } else _0x492239 = alpha;
    const _0x2fbb03 = new Uint32Array(4),
      _0x231520 = new Int32Array(4);
    let _0x279c19 = null,
      _0x1015f1 = null;
    const _0x55c3d0 = [],
      _0x2e6240 = [];
    ((this.domElement = canvas),
      (this.debug = { checkShaderErrors: true, onShaderError: null }),
      (this.autoClear = true),
      (this.autoClearColor = true),
      (this.autoClearDepth = true),
      (this.autoClearStencil = true),
      (this.sortObjects = true),
      (this.clippingPlanes = []),
      (this.localClippingEnabled = false),
      (this.toneMapping = NoToneMapping),
      (this.toneMappingExposure = 1),
      (this.transmissionResolutionScale = 1));
    const _0x4debdd = this;
    let _0x4cc705 = false;
    this._outputColorSpace = SRGBColorSpace;
    let _0xfee26f = 0,
      _0x390301 = 0,
      _0x30f183 = null,
      _0x38bc06 = -1,
      _0x26e4c6 = null;
    const _0x4e2d9d = new Vector4(),
      _0x4047d6 = new Vector4();
    let _0x2748d6 = null;
    const _0x54ee1a = new Color(0);
    let _0x54ebd9 = 0,
      _0x303be3 = canvas.width,
      _0x4cb33e = canvas.height,
      _0x57b4f1 = 1,
      _0x21f639 = null,
      _0x1fc3d5 = null;
    const _0x160f25 = new Vector4(0, 0, _0x303be3, _0x4cb33e),
      _0x138c1d = new Vector4(0, 0, _0x303be3, _0x4cb33e);
    let _0x4b4707 = false;
    const _0xa2aad2 = new Frustum();
    let _0x56937d = false,
      _0x38e064 = false;
    const _0x37d41d = new Matrix4(),
      _0xf786c7 = new Vector3(),
      _0x2348ad = new Vector4(),
      _0x23e92f = { background: null, fog: null, environment: null, overrideMaterial: null, isScene: true };
    let _0x478461 = false;
    function _0x487a38() {
      return _0x30f183 === null ? _0x57b4f1 : 1;
    }
    let _0xeced53 = context;
    function _0x13b9c(_0x42e769, _0xa249b4) {
      return canvas.getContext(_0x42e769, _0xa249b4);
    }
    try {
      const _0x5c0785 = {
        alpha: true,
        depth: depth,
        stencil: stencil,
        antialias: antialias,
        premultipliedAlpha: premultipliedAlpha,
        preserveDrawingBuffer: preserveDrawingBuffer,
        powerPreference: powerPreference,
        failIfMajorPerformanceCaveat: failIfMajorPerformanceCaveat,
      };
      if ('setAttribute' in canvas) canvas.setAttribute('data-engine', 'three.js r' + REVISION);
      (canvas.addEventListener('webglcontextlost', _0x263d66, false),
        canvas.addEventListener('webglcontextrestored', _0x191ffd, false),
        canvas.addEventListener('webglcontextcreationerror', _0x5ddb31, false));
      if (_0xeced53 === null) {
        const _0x55afba = 'webgl2';
        _0xeced53 = _0x13b9c(_0x55afba, _0x5c0785);
        if (_0xeced53 === null) {
          if (_0x13b9c(_0x55afba))
            throw new Error('Error creating WebGL context with your selected attributes.');
          else throw new Error('Error creating WebGL context.');
        }
      }
    } catch (_0x5e99eb) {
      console.error('THREE.WebGLRenderer: ' + _0x5e99eb.message);
      throw _0x5e99eb;
    }
    let _0x358e51,
      _0x5391b9,
      _0xd95679,
      _0xb4e970,
      _0x4417b3,
      _0xf6809a,
      _0x2df538,
      _0x190f33,
      _0x337afb,
      _0x3be9d7,
      _0x3a9c24,
      _0x3851b1,
      _0x13ee3c,
      _0x46b79e,
      _0x3805e5,
      _0x138d55,
      _0x331ca6,
      _0x4a43bf,
      _0x1736c0,
      _0x4e6b21,
      _0x3c2196,
      _0x1f2863,
      _0x2c599f,
      _0x21960a;
    function _0x106663() {
      ((_0x358e51 = new WebGLExtensions(_0xeced53)),
        _0x358e51.init(),
        (_0x1f2863 = new WebGLUtils(_0xeced53, _0x358e51)),
        (_0x5391b9 = new WebGLCapabilities(_0xeced53, _0x358e51, _0x502de4, _0x1f2863)),
        (_0xd95679 = new WebGLState(_0xeced53, _0x358e51)),
        _0x5391b9.reversedDepthBuffer && reversedDepthBuffer && _0xd95679.buffers.depth.setReversed(true),
        (_0xb4e970 = new WebGLInfo(_0xeced53)),
        (_0x4417b3 = new WebGLProperties()),
        (_0xf6809a = new WebGLTextures(
          _0xeced53,
          _0x358e51,
          _0xd95679,
          _0x4417b3,
          _0x5391b9,
          _0x1f2863,
          _0xb4e970,
        )),
        (_0x2df538 = new WebGLCubeMaps(_0x4debdd)),
        (_0x190f33 = new WebGLCubeUVMaps(_0x4debdd)),
        (_0x337afb = new WebGLAttributes(_0xeced53)),
        (_0x2c599f = new WebGLBindingStates(_0xeced53, _0x337afb)),
        (_0x3be9d7 = new WebGLGeometries(_0xeced53, _0x337afb, _0xb4e970, _0x2c599f)),
        (_0x3a9c24 = new WebGLObjects(_0xeced53, _0x3be9d7, _0x337afb, _0xb4e970)),
        (_0x1736c0 = new WebGLMorphtargets(_0xeced53, _0x5391b9, _0xf6809a)),
        (_0x138d55 = new WebGLClipping(_0x4417b3)),
        (_0x3851b1 = new WebGLPrograms(
          _0x4debdd,
          _0x2df538,
          _0x190f33,
          _0x358e51,
          _0x5391b9,
          _0x2c599f,
          _0x138d55,
        )),
        (_0x13ee3c = new WebGLMaterials(_0x4debdd, _0x4417b3)),
        (_0x46b79e = new WebGLRenderLists()),
        (_0x3805e5 = new WebGLRenderStates(_0x358e51)),
        (_0x4a43bf = new WebGLBackground(
          _0x4debdd,
          _0x2df538,
          _0x190f33,
          _0xd95679,
          _0x3a9c24,
          _0x492239,
          premultipliedAlpha,
        )),
        (_0x331ca6 = new WebGLShadowMap(_0x4debdd, _0x3a9c24, _0x5391b9)),
        (_0x21960a = new WebGLUniformsGroups(_0xeced53, _0xb4e970, _0x5391b9, _0xd95679)),
        (_0x4e6b21 = new WebGLBufferRenderer(_0xeced53, _0x358e51, _0xb4e970)),
        (_0x3c2196 = new WebGLIndexedBufferRenderer(_0xeced53, _0x358e51, _0xb4e970)),
        (_0xb4e970.programs = _0x3851b1.programs),
        (_0x4debdd.capabilities = _0x5391b9),
        (_0x4debdd.extensions = _0x358e51),
        (_0x4debdd.properties = _0x4417b3),
        (_0x4debdd.renderLists = _0x46b79e),
        (_0x4debdd.shadowMap = _0x331ca6),
        (_0x4debdd.state = _0xd95679),
        (_0x4debdd.info = _0xb4e970));
    }
    _0x106663();
    const _0x15d2b5 = new WebXRManager(_0x4debdd, _0xeced53);
    ((this.xr = _0x15d2b5),
      (this.getContext = function () {
        return _0xeced53;
      }),
      (this.getContextAttributes = function () {
        return _0xeced53.getContextAttributes();
      }),
      (this.forceContextLoss = function () {
        const _0x2edb9b = _0x358e51.get('WEBGL_lose_context');
        if (_0x2edb9b) _0x2edb9b.loseContext();
      }),
      (this.forceContextRestore = function () {
        const _0x3709bb = _0x358e51.get('WEBGL_lose_context');
        if (_0x3709bb) _0x3709bb.restoreContext();
      }),
      (this.getPixelRatio = function () {
        return _0x57b4f1;
      }),
      (this.setPixelRatio = function (_0x3e32c6) {
        if (_0x3e32c6 === undefined) return;
        ((_0x57b4f1 = _0x3e32c6), this.setSize(_0x303be3, _0x4cb33e, false));
      }),
      (this.getSize = function (_0x3c76cc) {
        return _0x3c76cc.set(_0x303be3, _0x4cb33e);
      }),
      (this.setSize = function (_0x9469c7, _0x450419, _0x38ecde = true) {
        if (_0x15d2b5.isPresenting) {
          console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");
          return;
        }
        ((_0x303be3 = _0x9469c7),
          (_0x4cb33e = _0x450419),
          (canvas.width = Math.floor(_0x9469c7 * _0x57b4f1)),
          (canvas.height = Math.floor(_0x450419 * _0x57b4f1)),
          _0x38ecde === true &&
            ((canvas.style.width = _0x9469c7 + 'px'), (canvas.style.height = _0x450419 + 'px')),
          this.setViewport(0, 0, _0x9469c7, _0x450419));
      }),
      (this.getDrawingBufferSize = function (_0x22949e) {
        return _0x22949e.set(_0x303be3 * _0x57b4f1, _0x4cb33e * _0x57b4f1).floor();
      }),
      (this.setDrawingBufferSize = function (_0x555ea5, _0x1bd72a, _0x36de32) {
        ((_0x303be3 = _0x555ea5),
          (_0x4cb33e = _0x1bd72a),
          (_0x57b4f1 = _0x36de32),
          (canvas.width = Math.floor(_0x555ea5 * _0x36de32)),
          (canvas.height = Math.floor(_0x1bd72a * _0x36de32)),
          this.setViewport(0, 0, _0x555ea5, _0x1bd72a));
      }),
      (this.getCurrentViewport = function (_0x13b82f) {
        return _0x13b82f.copy(_0x4e2d9d);
      }),
      (this.getViewport = function (_0x50daa6) {
        return _0x50daa6.copy(_0x160f25);
      }),
      (this.setViewport = function (_0x202cdd, _0x44b3e2, _0x230c4a, _0x5772f0) {
        (_0x202cdd.isVector4
          ? _0x160f25.set(_0x202cdd.x, _0x202cdd.y, _0x202cdd.z, _0x202cdd.w)
          : _0x160f25.set(_0x202cdd, _0x44b3e2, _0x230c4a, _0x5772f0),
          _0xd95679.viewport(_0x4e2d9d.copy(_0x160f25).multiplyScalar(_0x57b4f1).round()));
      }),
      (this.getScissor = function (_0x2eb328) {
        return _0x2eb328.copy(_0x138c1d);
      }),
      (this.setScissor = function (_0x2bdb29, _0x551d17, _0x390c71, _0x3ed4e4) {
        (_0x2bdb29.isVector4
          ? _0x138c1d.set(_0x2bdb29.x, _0x2bdb29.y, _0x2bdb29.z, _0x2bdb29.w)
          : _0x138c1d.set(_0x2bdb29, _0x551d17, _0x390c71, _0x3ed4e4),
          _0xd95679.scissor(_0x4047d6.copy(_0x138c1d).multiplyScalar(_0x57b4f1).round()));
      }),
      (this.getScissorTest = function () {
        return _0x4b4707;
      }),
      (this.setScissorTest = function (_0x14218d) {
        _0xd95679.setScissorTest((_0x4b4707 = _0x14218d));
      }),
      (this.setOpaqueSort = function (_0x229d02) {
        _0x21f639 = _0x229d02;
      }),
      (this.setTransparentSort = function (_0x518e92) {
        _0x1fc3d5 = _0x518e92;
      }),
      (this.getClearColor = function (_0x43dc1f) {
        return _0x43dc1f.copy(_0x4a43bf.getClearColor());
      }),
      (this.setClearColor = function () {
        _0x4a43bf.setClearColor(...arguments);
      }),
      (this.getClearAlpha = function () {
        return _0x4a43bf.getClearAlpha();
      }),
      (this.setClearAlpha = function () {
        _0x4a43bf.setClearAlpha(...arguments);
      }),
      (this.clear = function (_0x5b94a1 = true, _0x2bb9f7 = true, _0x2bb47f = true) {
        let _0x4209e7 = 0;
        if (_0x5b94a1) {
          let _0x444b08 = false;
          if (_0x30f183 !== null) {
            const _0xace747 = _0x30f183.texture.format;
            _0x444b08 =
              _0xace747 === RGBAIntegerFormat ||
              _0xace747 === RGIntegerFormat ||
              _0xace747 === RedIntegerFormat;
          }
          if (_0x444b08) {
            const _0x4e5df5 = _0x30f183.texture.type,
              _0x40225f =
                _0x4e5df5 === UnsignedByteType ||
                _0x4e5df5 === UnsignedIntType ||
                _0x4e5df5 === UnsignedShortType ||
                _0x4e5df5 === UnsignedInt248Type ||
                _0x4e5df5 === UnsignedShort4444Type ||
                _0x4e5df5 === UnsignedShort5551Type,
              _0x4b08a4 = _0x4a43bf.getClearColor(),
              _0x4060a8 = _0x4a43bf.getClearAlpha(),
              _0x310926 = _0x4b08a4.r,
              _0x1e2f1d = _0x4b08a4.g,
              _0x1351a2 = _0x4b08a4.b;
            _0x40225f
              ? ((_0x2fbb03[0] = _0x310926),
                (_0x2fbb03[1] = _0x1e2f1d),
                (_0x2fbb03[2] = _0x1351a2),
                (_0x2fbb03[3] = _0x4060a8),
                _0xeced53.clearBufferuiv(_0xeced53.COLOR, 0, _0x2fbb03))
              : ((_0x231520[0] = _0x310926),
                (_0x231520[1] = _0x1e2f1d),
                (_0x231520[2] = _0x1351a2),
                (_0x231520[3] = _0x4060a8),
                _0xeced53.clearBufferiv(_0xeced53.COLOR, 0, _0x231520));
          } else _0x4209e7 |= _0xeced53.COLOR_BUFFER_BIT;
        }
        (_0x2bb9f7 && (_0x4209e7 |= _0xeced53.DEPTH_BUFFER_BIT),
          _0x2bb47f &&
            ((_0x4209e7 |= _0xeced53.STENCIL_BUFFER_BIT), this.state.buffers.stencil.setMask(0xffffffff)),
          _0xeced53.clear(_0x4209e7));
      }),
      (this.clearColor = function () {
        this.clear(true, false, false);
      }),
      (this.clearDepth = function () {
        this.clear(false, true, false);
      }),
      (this.clearStencil = function () {
        this.clear(false, false, true);
      }),
      (this.dispose = function () {
        (canvas.removeEventListener('webglcontextlost', _0x263d66, false),
          canvas.removeEventListener('webglcontextrestored', _0x191ffd, false),
          canvas.removeEventListener('webglcontextcreationerror', _0x5ddb31, false),
          _0x4a43bf.dispose(),
          _0x46b79e.dispose(),
          _0x3805e5.dispose(),
          _0x4417b3.dispose(),
          _0x2df538.dispose(),
          _0x190f33.dispose(),
          _0x3a9c24.dispose(),
          _0x2c599f.dispose(),
          _0x21960a.dispose(),
          _0x3851b1.dispose(),
          _0x15d2b5.dispose(),
          _0x15d2b5.removeEventListener('sessionstart', _0x591df1),
          _0x15d2b5.removeEventListener('sessionend', _0x13ce87),
          _0x4af746.stop());
      }));
    function _0x263d66(_0x237dee) {
      (_0x237dee.preventDefault(), console.log('THREE.WebGLRenderer: Context Lost.'), (_0x4cc705 = true));
    }
    function _0x191ffd() {
      (console.log('THREE.WebGLRenderer: Context Restored.'), (_0x4cc705 = false));
      const _0x1643f2 = _0xb4e970.autoReset,
        _0x5a2a64 = _0x331ca6.enabled,
        _0x555163 = _0x331ca6.autoUpdate,
        _0x4c679d = _0x331ca6.needsUpdate,
        _0x1fde67 = _0x331ca6.type;
      (_0x106663(),
        (_0xb4e970.autoReset = _0x1643f2),
        (_0x331ca6.enabled = _0x5a2a64),
        (_0x331ca6.autoUpdate = _0x555163),
        (_0x331ca6.needsUpdate = _0x4c679d),
        (_0x331ca6.type = _0x1fde67));
    }
    function _0x5ddb31(_0x5a7a56) {
      console.error(
        'THREE.WebGLRenderer: A WebGL context could not be created. Reason: ',
        _0x5a7a56.statusMessage,
      );
    }
    function _0x34f9ab(_0x513067) {
      const _0x190039 = _0x513067.target;
      (_0x190039.removeEventListener('dispose', _0x34f9ab), _0x349fce(_0x190039));
    }
    function _0x349fce(_0x32b148) {
      (_0x2b9f64(_0x32b148), _0x4417b3.remove(_0x32b148));
    }
    function _0x2b9f64(_0x690388) {
      const _0xa18964 = _0x4417b3.get(_0x690388).programs;
      _0xa18964 !== undefined &&
        (_0xa18964.forEach(function (_0x5d80b6) {
          _0x3851b1.releaseProgram(_0x5d80b6);
        }),
        _0x690388.isShaderMaterial && _0x3851b1.releaseShaderCache(_0x690388));
    }
    this.renderBufferDirect = function (_0x252078, _0x3f443c, _0x1dad3d, _0x15a22c, _0x2d35cc, _0x162cf8) {
      if (_0x3f443c === null) _0x3f443c = _0x23e92f;
      const _0x43a39c = _0x2d35cc.isMesh && _0x2d35cc.matrixWorld.determinant() < 0,
        _0x5f0c57 = _0x482c01(_0x252078, _0x3f443c, _0x1dad3d, _0x15a22c, _0x2d35cc);
      _0xd95679.setMaterial(_0x15a22c, _0x43a39c);
      let _0x6bccf0 = _0x1dad3d.index,
        _0x3662a3 = 1;
      if (_0x15a22c.wireframe === true) {
        _0x6bccf0 = _0x3be9d7.getWireframeAttribute(_0x1dad3d);
        if (_0x6bccf0 === undefined) return;
        _0x3662a3 = 2;
      }
      const _0x8f2fa5 = _0x1dad3d.drawRange,
        _0x25b05a = _0x1dad3d.attributes.position;
      let _0x4160a7 = _0x8f2fa5.start * _0x3662a3,
        _0x244214 = (_0x8f2fa5.start + _0x8f2fa5.count) * _0x3662a3;
      _0x162cf8 !== null &&
        ((_0x4160a7 = Math.max(_0x4160a7, _0x162cf8.start * _0x3662a3)),
        (_0x244214 = Math.min(_0x244214, (_0x162cf8.start + _0x162cf8.count) * _0x3662a3)));
      if (_0x6bccf0 !== null)
        ((_0x4160a7 = Math.max(_0x4160a7, 0)), (_0x244214 = Math.min(_0x244214, _0x6bccf0.count)));
      else
        _0x25b05a !== undefined &&
          _0x25b05a !== null &&
          ((_0x4160a7 = Math.max(_0x4160a7, 0)), (_0x244214 = Math.min(_0x244214, _0x25b05a.count)));
      const _0x413d44 = _0x244214 - _0x4160a7;
      if (_0x413d44 < 0 || _0x413d44 === Infinity) return;
      _0x2c599f.setup(_0x2d35cc, _0x15a22c, _0x5f0c57, _0x1dad3d, _0x6bccf0);
      let _0x2c6ea6,
        _0x38453e = _0x4e6b21;
      _0x6bccf0 !== null &&
        ((_0x2c6ea6 = _0x337afb.get(_0x6bccf0)), (_0x38453e = _0x3c2196), _0x38453e.setIndex(_0x2c6ea6));
      if (_0x2d35cc.isMesh)
        _0x15a22c.wireframe === true
          ? (_0xd95679.setLineWidth(_0x15a22c.wireframeLinewidth * _0x487a38()),
            _0x38453e.setMode(_0xeced53.LINES))
          : _0x38453e.setMode(_0xeced53.TRIANGLES);
      else {
        if (_0x2d35cc.isLine) {
          let _0x3d1474 = _0x15a22c.linewidth;
          if (_0x3d1474 === undefined) _0x3d1474 = 1;
          _0xd95679.setLineWidth(_0x3d1474 * _0x487a38());
          if (_0x2d35cc.isLineSegments) _0x38453e.setMode(_0xeced53.LINES);
          else
            _0x2d35cc.isLineLoop
              ? _0x38453e.setMode(_0xeced53.LINE_LOOP)
              : _0x38453e.setMode(_0xeced53.LINE_STRIP);
        } else {
          if (_0x2d35cc.isPoints) _0x38453e.setMode(_0xeced53.POINTS);
          else _0x2d35cc.isSprite && _0x38453e.setMode(_0xeced53.TRIANGLES);
        }
      }
      if (_0x2d35cc.isBatchedMesh) {
        if (_0x2d35cc._multiDrawInstances !== null)
          (warnOnce(
            'THREE.WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection.',
          ),
            _0x38453e.renderMultiDrawInstances(
              _0x2d35cc._multiDrawStarts,
              _0x2d35cc._multiDrawCounts,
              _0x2d35cc._multiDrawCount,
              _0x2d35cc._multiDrawInstances,
            ));
        else {
          if (!_0x358e51.get('WEBGL_multi_draw')) {
            const _0x1448bc = _0x2d35cc._multiDrawStarts,
              _0x658ba7 = _0x2d35cc._multiDrawCounts,
              _0xc70c89 = _0x2d35cc._multiDrawCount,
              _0x2f3303 = _0x6bccf0 ? _0x337afb.get(_0x6bccf0).bytesPerElement : 1,
              _0x6287ce = _0x4417b3.get(_0x15a22c).currentProgram.getUniforms();
            for (let _0x4ad191 = 0; _0x4ad191 < _0xc70c89; _0x4ad191++) {
              (_0x6287ce.setValue(_0xeced53, '_gl_DrawID', _0x4ad191),
                _0x38453e.render(_0x1448bc[_0x4ad191] / _0x2f3303, _0x658ba7[_0x4ad191]));
            }
          } else
            _0x38453e.renderMultiDraw(
              _0x2d35cc._multiDrawStarts,
              _0x2d35cc._multiDrawCounts,
              _0x2d35cc._multiDrawCount,
            );
        }
      } else {
        if (_0x2d35cc.isInstancedMesh) _0x38453e.renderInstances(_0x4160a7, _0x413d44, _0x2d35cc.count);
        else {
          if (_0x1dad3d.isInstancedBufferGeometry) {
            const _0x138241 =
                _0x1dad3d._maxInstanceCount !== undefined ? _0x1dad3d._maxInstanceCount : Infinity,
              _0x216ff7 = Math.min(_0x1dad3d.instanceCount, _0x138241);
            _0x38453e.renderInstances(_0x4160a7, _0x413d44, _0x216ff7);
          } else _0x38453e.render(_0x4160a7, _0x413d44);
        }
      }
    };
    function _0x597e28(_0x506f21, _0x3218ca, _0x36e1f7) {
      _0x506f21.transparent === true && _0x506f21.side === DoubleSide && _0x506f21.forceSinglePass === false
        ? ((_0x506f21.side = BackSide),
          (_0x506f21.needsUpdate = true),
          _0x342285(_0x506f21, _0x3218ca, _0x36e1f7),
          (_0x506f21.side = FrontSide),
          (_0x506f21.needsUpdate = true),
          _0x342285(_0x506f21, _0x3218ca, _0x36e1f7),
          (_0x506f21.side = DoubleSide))
        : _0x342285(_0x506f21, _0x3218ca, _0x36e1f7);
    }
    ((this.compile = function (_0x2f9eae, _0xde7bf9, _0x2ebf70 = null) {
      if (_0x2ebf70 === null) _0x2ebf70 = _0x2f9eae;
      ((_0x1015f1 = _0x3805e5.get(_0x2ebf70)),
        _0x1015f1.init(_0xde7bf9),
        _0x2e6240.push(_0x1015f1),
        _0x2ebf70.traverseVisible(function (_0x45b8ef) {
          _0x45b8ef.isLight &&
            _0x45b8ef.layers.test(_0xde7bf9.layers) &&
            (_0x1015f1.pushLight(_0x45b8ef), _0x45b8ef.castShadow && _0x1015f1.pushShadow(_0x45b8ef));
        }));
      _0x2f9eae !== _0x2ebf70 &&
        _0x2f9eae.traverseVisible(function (_0x41f00e) {
          _0x41f00e.isLight &&
            _0x41f00e.layers.test(_0xde7bf9.layers) &&
            (_0x1015f1.pushLight(_0x41f00e), _0x41f00e.castShadow && _0x1015f1.pushShadow(_0x41f00e));
        });
      _0x1015f1.setupLights();
      const _0x4e3e4a = new Set();
      return (
        _0x2f9eae.traverse(function (_0x1671cc) {
          if (!(_0x1671cc.isMesh || _0x1671cc.isPoints || _0x1671cc.isLine || _0x1671cc.isSprite)) return;
          const _0x121eb1 = _0x1671cc.material;
          if (_0x121eb1) {
            if (Array.isArray(_0x121eb1))
              for (let _0xeea1d7 = 0; _0xeea1d7 < _0x121eb1.length; _0xeea1d7++) {
                const _0x5d1870 = _0x121eb1[_0xeea1d7];
                (_0x597e28(_0x5d1870, _0x2ebf70, _0x1671cc), _0x4e3e4a.add(_0x5d1870));
              }
            else (_0x597e28(_0x121eb1, _0x2ebf70, _0x1671cc), _0x4e3e4a.add(_0x121eb1));
          }
        }),
        (_0x1015f1 = _0x2e6240.pop()),
        _0x4e3e4a
      );
    }),
      (this.compileAsync = function (_0x9ba677, _0x5e14c3, _0x28bdbf = null) {
        const _0x5a94b1 = this.compile(_0x9ba677, _0x5e14c3, _0x28bdbf);
        return new Promise((_0xe04e42) => {
          function _0x373b18() {
            _0x5a94b1.forEach(function (_0x528d82) {
              const _0xcf05c1 = _0x4417b3.get(_0x528d82),
                _0x850635 = _0xcf05c1.currentProgram;
              _0x850635.isReady() && _0x5a94b1.delete(_0x528d82);
            });
            if (_0x5a94b1.size === 0) {
              _0xe04e42(_0x9ba677);
              return;
            }
            setTimeout(_0x373b18, 10);
          }
          _0x358e51.get('KHR_parallel_shader_compile') !== null ? _0x373b18() : setTimeout(_0x373b18, 10);
        });
      }));
    let _0x2b8a0a = null;
    function _0x74ddb9(_0x21fbba) {
      if (_0x2b8a0a) _0x2b8a0a(_0x21fbba);
    }
    function _0x591df1() {
      _0x4af746.stop();
    }
    function _0x13ce87() {
      _0x4af746.start();
    }
    const _0x4af746 = new WebGLAnimation();
    _0x4af746.setAnimationLoop(_0x74ddb9);
    if (typeof self !== 'undefined') _0x4af746.setContext(self);
    ((this.setAnimationLoop = function (_0x46238e) {
      ((_0x2b8a0a = _0x46238e),
        _0x15d2b5.setAnimationLoop(_0x46238e),
        _0x46238e === null ? _0x4af746.stop() : _0x4af746.start());
    }),
      _0x15d2b5.addEventListener('sessionstart', _0x591df1),
      _0x15d2b5.addEventListener('sessionend', _0x13ce87),
      (this.render = function (_0x59786a, _0x3e320c) {
        if (_0x3e320c !== undefined && _0x3e320c.isCamera !== true) {
          console.error('THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.');
          return;
        }
        if (_0x4cc705 === true) return;
        if (_0x59786a.matrixWorldAutoUpdate === true) _0x59786a.updateMatrixWorld();
        if (_0x3e320c.parent === null && _0x3e320c.matrixWorldAutoUpdate === true)
          _0x3e320c.updateMatrixWorld();
        if (_0x15d2b5.enabled === true && _0x15d2b5.isPresenting === true) {
          if (_0x15d2b5.cameraAutoUpdate === true) _0x15d2b5.updateCamera(_0x3e320c);
          _0x3e320c = _0x15d2b5.getCamera();
        }
        if (_0x59786a.isScene === true) _0x59786a.onBeforeRender(_0x4debdd, _0x59786a, _0x3e320c, _0x30f183);
        ((_0x1015f1 = _0x3805e5.get(_0x59786a, _0x2e6240.length)),
          _0x1015f1.init(_0x3e320c),
          _0x2e6240.push(_0x1015f1),
          _0x37d41d.multiplyMatrices(_0x3e320c.projectionMatrix, _0x3e320c.matrixWorldInverse),
          _0xa2aad2.setFromProjectionMatrix(_0x37d41d, WebGLCoordinateSystem, _0x3e320c.reversedDepth),
          (_0x38e064 = this.localClippingEnabled),
          (_0x56937d = _0x138d55.init(this.clippingPlanes, _0x38e064)),
          (_0x279c19 = _0x46b79e.get(_0x59786a, _0x55c3d0.length)),
          _0x279c19.init(),
          _0x55c3d0.push(_0x279c19));
        if (_0x15d2b5.enabled === true && _0x15d2b5.isPresenting === true) {
          const _0x25de42 = _0x4debdd.xr.getDepthSensingMesh();
          _0x25de42 !== null && _0x1dfb03(_0x25de42, _0x3e320c, -Infinity, _0x4debdd.sortObjects);
        }
        (_0x1dfb03(_0x59786a, _0x3e320c, 0, _0x4debdd.sortObjects), _0x279c19.finish());
        _0x4debdd.sortObjects === true && _0x279c19.sort(_0x21f639, _0x1fc3d5);
        _0x478461 =
          _0x15d2b5.enabled === false ||
          _0x15d2b5.isPresenting === false ||
          _0x15d2b5.hasDepthSensing() === false;
        _0x478461 && _0x4a43bf.addToRenderList(_0x279c19, _0x59786a);
        this.info.render.frame++;
        if (_0x56937d === true) _0x138d55.beginShadows();
        const _0x5ced3e = _0x1015f1.state.shadowsArray;
        _0x331ca6.render(_0x5ced3e, _0x59786a, _0x3e320c);
        if (_0x56937d === true) _0x138d55.endShadows();
        if (this.info.autoReset === true) this.info.reset();
        const _0x29232d = _0x279c19.opaque,
          _0x2407e6 = _0x279c19.transmissive;
        _0x1015f1.setupLights();
        if (_0x3e320c.isArrayCamera) {
          const _0x22e637 = _0x3e320c.cameras;
          if (_0x2407e6.length > 0)
            for (let _0x495b1a = 0, _0xb26f01 = _0x22e637.length; _0x495b1a < _0xb26f01; _0x495b1a++) {
              const _0x5de932 = _0x22e637[_0x495b1a];
              _0x179729(_0x29232d, _0x2407e6, _0x59786a, _0x5de932);
            }
          if (_0x478461) _0x4a43bf.render(_0x59786a);
          for (let _0x27f64f = 0, _0x4be53e = _0x22e637.length; _0x27f64f < _0x4be53e; _0x27f64f++) {
            const _0x19006d = _0x22e637[_0x27f64f];
            _0x1ac579(_0x279c19, _0x59786a, _0x19006d, _0x19006d.viewport);
          }
        } else {
          if (_0x2407e6.length > 0) _0x179729(_0x29232d, _0x2407e6, _0x59786a, _0x3e320c);
          if (_0x478461) _0x4a43bf.render(_0x59786a);
          _0x1ac579(_0x279c19, _0x59786a, _0x3e320c);
        }
        _0x30f183 !== null &&
          _0x390301 === 0 &&
          (_0xf6809a.updateMultisampleRenderTarget(_0x30f183), _0xf6809a.updateRenderTargetMipmap(_0x30f183));
        if (_0x59786a.isScene === true) _0x59786a.onAfterRender(_0x4debdd, _0x59786a, _0x3e320c);
        (_0x2c599f.resetDefaultState(), (_0x38bc06 = -1), (_0x26e4c6 = null), _0x2e6240.pop());
        if (_0x2e6240.length > 0) {
          _0x1015f1 = _0x2e6240[_0x2e6240.length - 1];
          if (_0x56937d === true) _0x138d55.setGlobalState(_0x4debdd.clippingPlanes, _0x1015f1.state.camera);
        } else _0x1015f1 = null;
        (_0x55c3d0.pop(),
          _0x55c3d0.length > 0 ? (_0x279c19 = _0x55c3d0[_0x55c3d0.length - 1]) : (_0x279c19 = null));
      }));
    function _0x1dfb03(_0xdcefd1, _0x6077ea, _0x340d94, _0x4c8311) {
      if (_0xdcefd1.visible === false) return;
      const _0x11bf4b = _0xdcefd1.layers.test(_0x6077ea.layers);
      if (_0x11bf4b) {
        if (_0xdcefd1.isGroup) _0x340d94 = _0xdcefd1.renderOrder;
        else {
          if (_0xdcefd1.isLOD) {
            if (_0xdcefd1.autoUpdate === true) _0xdcefd1.update(_0x6077ea);
          } else {
            if (_0xdcefd1.isLight)
              (_0x1015f1.pushLight(_0xdcefd1), _0xdcefd1.castShadow && _0x1015f1.pushShadow(_0xdcefd1));
            else {
              if (_0xdcefd1.isSprite) {
                if (!_0xdcefd1.frustumCulled || _0xa2aad2.intersectsSprite(_0xdcefd1)) {
                  _0x4c8311 && _0x2348ad.setFromMatrixPosition(_0xdcefd1.matrixWorld).applyMatrix4(_0x37d41d);
                  const _0x110e21 = _0x3a9c24.update(_0xdcefd1),
                    _0xaf07b9 = _0xdcefd1.material;
                  _0xaf07b9.visible &&
                    _0x279c19.push(_0xdcefd1, _0x110e21, _0xaf07b9, _0x340d94, _0x2348ad.z, null);
                }
              } else {
                if (_0xdcefd1.isMesh || _0xdcefd1.isLine || _0xdcefd1.isPoints) {
                  if (!_0xdcefd1.frustumCulled || _0xa2aad2.intersectsObject(_0xdcefd1)) {
                    const _0x48e688 = _0x3a9c24.update(_0xdcefd1),
                      _0x25aa8e = _0xdcefd1.material;
                    if (_0x4c8311) {
                      if (_0xdcefd1.boundingSphere !== undefined) {
                        if (_0xdcefd1.boundingSphere === null) _0xdcefd1.computeBoundingSphere();
                        _0x2348ad.copy(_0xdcefd1.boundingSphere.center);
                      } else {
                        if (_0x48e688.boundingSphere === null) _0x48e688.computeBoundingSphere();
                        _0x2348ad.copy(_0x48e688.boundingSphere.center);
                      }
                      _0x2348ad.applyMatrix4(_0xdcefd1.matrixWorld).applyMatrix4(_0x37d41d);
                    }
                    if (Array.isArray(_0x25aa8e)) {
                      const _0x31eff2 = _0x48e688.groups;
                      for (
                        let _0x226979 = 0, _0x4c7398 = _0x31eff2.length;
                        _0x226979 < _0x4c7398;
                        _0x226979++
                      ) {
                        const _0x414a57 = _0x31eff2[_0x226979],
                          _0x2c8b83 = _0x25aa8e[_0x414a57.materialIndex];
                        _0x2c8b83 &&
                          _0x2c8b83.visible &&
                          _0x279c19.push(_0xdcefd1, _0x48e688, _0x2c8b83, _0x340d94, _0x2348ad.z, _0x414a57);
                      }
                    } else
                      _0x25aa8e.visible &&
                        _0x279c19.push(_0xdcefd1, _0x48e688, _0x25aa8e, _0x340d94, _0x2348ad.z, null);
                  }
                }
              }
            }
          }
        }
      }
      const _0x3ba51a = _0xdcefd1.children;
      for (let _0x4269ea = 0, _0x2fa314 = _0x3ba51a.length; _0x4269ea < _0x2fa314; _0x4269ea++) {
        _0x1dfb03(_0x3ba51a[_0x4269ea], _0x6077ea, _0x340d94, _0x4c8311);
      }
    }
    function _0x1ac579(_0x45e114, _0x425b7a, _0x45c218, _0x2a2953) {
      const _0x1e15d6 = _0x45e114.opaque,
        _0x518aa2 = _0x45e114.transmissive,
        _0x572378 = _0x45e114.transparent;
      _0x1015f1.setupLightsView(_0x45c218);
      if (_0x56937d === true) _0x138d55.setGlobalState(_0x4debdd.clippingPlanes, _0x45c218);
      if (_0x2a2953) _0xd95679.viewport(_0x4e2d9d.copy(_0x2a2953));
      if (_0x1e15d6.length > 0) _0x493cb1(_0x1e15d6, _0x425b7a, _0x45c218);
      if (_0x518aa2.length > 0) _0x493cb1(_0x518aa2, _0x425b7a, _0x45c218);
      if (_0x572378.length > 0) _0x493cb1(_0x572378, _0x425b7a, _0x45c218);
      (_0xd95679.buffers.depth.setTest(true),
        _0xd95679.buffers.depth.setMask(true),
        _0xd95679.buffers.color.setMask(true),
        _0xd95679.setPolygonOffset(false));
    }
    function _0x179729(_0x211acc, _0x392fb0, _0x1a22b6, _0x31d692) {
      const _0x2ae1fa = _0x1a22b6.isScene === true ? _0x1a22b6.overrideMaterial : null;
      if (_0x2ae1fa !== null) return;
      _0x1015f1.state.transmissionRenderTarget[_0x31d692.id] === undefined &&
        (_0x1015f1.state.transmissionRenderTarget[_0x31d692.id] = new WebGLRenderTarget(1, 1, {
          generateMipmaps: true,
          type:
            _0x358e51.has('EXT_color_buffer_half_float') || _0x358e51.has('EXT_color_buffer_float')
              ? HalfFloatType
              : UnsignedByteType,
          minFilter: LinearMipmapLinearFilter,
          samples: 4,
          stencilBuffer: stencil,
          resolveDepthBuffer: false,
          resolveStencilBuffer: false,
          colorSpace: ColorManagement.workingColorSpace,
        }));
      const _0x5a590a = _0x1015f1.state.transmissionRenderTarget[_0x31d692.id],
        _0x13e37d = _0x31d692.viewport || _0x4e2d9d;
      _0x5a590a.setSize(
        _0x13e37d.z * _0x4debdd.transmissionResolutionScale,
        _0x13e37d.w * _0x4debdd.transmissionResolutionScale,
      );
      const _0x249655 = _0x4debdd.getRenderTarget(),
        _0x537af0 = _0x4debdd.getActiveCubeFace(),
        _0x47ee0f = _0x4debdd.getActiveMipmapLevel();
      (_0x4debdd.setRenderTarget(_0x5a590a),
        _0x4debdd.getClearColor(_0x54ee1a),
        (_0x54ebd9 = _0x4debdd.getClearAlpha()));
      if (_0x54ebd9 < 1) _0x4debdd.setClearColor(0xffffff, 0.5);
      _0x4debdd.clear();
      if (_0x478461) _0x4a43bf.render(_0x1a22b6);
      const _0x352aca = _0x4debdd.toneMapping;
      _0x4debdd.toneMapping = NoToneMapping;
      const _0x5ec08c = _0x31d692.viewport;
      if (_0x31d692.viewport !== undefined) _0x31d692.viewport = undefined;
      _0x1015f1.setupLightsView(_0x31d692);
      if (_0x56937d === true) _0x138d55.setGlobalState(_0x4debdd.clippingPlanes, _0x31d692);
      (_0x493cb1(_0x211acc, _0x1a22b6, _0x31d692),
        _0xf6809a.updateMultisampleRenderTarget(_0x5a590a),
        _0xf6809a.updateRenderTargetMipmap(_0x5a590a));
      if (_0x358e51.has('WEBGL_multisampled_render_to_texture') === false) {
        let _0x42e245 = false;
        for (let _0xfd677a = 0, _0xa466ec = _0x392fb0.length; _0xfd677a < _0xa466ec; _0xfd677a++) {
          const _0x4f9f31 = _0x392fb0[_0xfd677a],
            _0x3267e3 = _0x4f9f31.object,
            _0x5a78a9 = _0x4f9f31.geometry,
            _0xe2acd8 = _0x4f9f31.material,
            _0x55c871 = _0x4f9f31.group;
          if (_0xe2acd8.side === DoubleSide && _0x3267e3.layers.test(_0x31d692.layers)) {
            const _0x1fd946 = _0xe2acd8.side;
            ((_0xe2acd8.side = BackSide),
              (_0xe2acd8.needsUpdate = true),
              _0xa2231d(_0x3267e3, _0x1a22b6, _0x31d692, _0x5a78a9, _0xe2acd8, _0x55c871),
              (_0xe2acd8.side = _0x1fd946),
              (_0xe2acd8.needsUpdate = true),
              (_0x42e245 = true));
          }
        }
        _0x42e245 === true &&
          (_0xf6809a.updateMultisampleRenderTarget(_0x5a590a), _0xf6809a.updateRenderTargetMipmap(_0x5a590a));
      }
      (_0x4debdd.setRenderTarget(_0x249655, _0x537af0, _0x47ee0f),
        _0x4debdd.setClearColor(_0x54ee1a, _0x54ebd9));
      if (_0x5ec08c !== undefined) _0x31d692.viewport = _0x5ec08c;
      _0x4debdd.toneMapping = _0x352aca;
    }
    function _0x493cb1(_0x5d21ef, _0x24f5a2, _0x3315a7) {
      const _0x14dd9e = _0x24f5a2.isScene === true ? _0x24f5a2.overrideMaterial : null;
      for (let _0x1bfa6c = 0, _0x96f3d0 = _0x5d21ef.length; _0x1bfa6c < _0x96f3d0; _0x1bfa6c++) {
        const _0x36d454 = _0x5d21ef[_0x1bfa6c],
          _0x350af2 = _0x36d454.object,
          _0x29ac26 = _0x36d454.geometry,
          _0x31bfe6 = _0x36d454.group;
        let _0x312c62 = _0x36d454.material;
        (_0x312c62.allowOverride === true && _0x14dd9e !== null && (_0x312c62 = _0x14dd9e),
          _0x350af2.layers.test(_0x3315a7.layers) &&
            _0xa2231d(_0x350af2, _0x24f5a2, _0x3315a7, _0x29ac26, _0x312c62, _0x31bfe6));
      }
    }
    function _0xa2231d(_0x404a1e, _0x2a0e3f, _0x1e41a9, _0x2fda33, _0x5f9ad5, _0x52c5f5) {
      (_0x404a1e.onBeforeRender(_0x4debdd, _0x2a0e3f, _0x1e41a9, _0x2fda33, _0x5f9ad5, _0x52c5f5),
        _0x404a1e.modelViewMatrix.multiplyMatrices(_0x1e41a9.matrixWorldInverse, _0x404a1e.matrixWorld),
        _0x404a1e.normalMatrix.getNormalMatrix(_0x404a1e.modelViewMatrix),
        _0x5f9ad5.onBeforeRender(_0x4debdd, _0x2a0e3f, _0x1e41a9, _0x2fda33, _0x404a1e, _0x52c5f5),
        _0x5f9ad5.transparent === true && _0x5f9ad5.side === DoubleSide && _0x5f9ad5.forceSinglePass === false
          ? ((_0x5f9ad5.side = BackSide),
            (_0x5f9ad5.needsUpdate = true),
            _0x4debdd.renderBufferDirect(_0x1e41a9, _0x2a0e3f, _0x2fda33, _0x5f9ad5, _0x404a1e, _0x52c5f5),
            (_0x5f9ad5.side = FrontSide),
            (_0x5f9ad5.needsUpdate = true),
            _0x4debdd.renderBufferDirect(_0x1e41a9, _0x2a0e3f, _0x2fda33, _0x5f9ad5, _0x404a1e, _0x52c5f5),
            (_0x5f9ad5.side = DoubleSide))
          : _0x4debdd.renderBufferDirect(_0x1e41a9, _0x2a0e3f, _0x2fda33, _0x5f9ad5, _0x404a1e, _0x52c5f5),
        _0x404a1e.onAfterRender(_0x4debdd, _0x2a0e3f, _0x1e41a9, _0x2fda33, _0x5f9ad5, _0x52c5f5));
    }
    function _0x342285(_0x427045, _0x323d25, _0x81466a) {
      if (_0x323d25.isScene !== true) _0x323d25 = _0x23e92f;
      const _0x46acfb = _0x4417b3.get(_0x427045),
        _0x18c31b = _0x1015f1.state.lights,
        _0x3e07a3 = _0x1015f1.state.shadowsArray,
        _0x53846c = _0x18c31b.state.version,
        _0x5915e8 = _0x3851b1.getParameters(_0x427045, _0x18c31b.state, _0x3e07a3, _0x323d25, _0x81466a),
        _0x194e0d = _0x3851b1.getProgramCacheKey(_0x5915e8);
      let _0x569f5f = _0x46acfb.programs;
      ((_0x46acfb.environment = _0x427045.isMeshStandardMaterial ? _0x323d25.environment : null),
        (_0x46acfb.fog = _0x323d25.fog),
        (_0x46acfb.envMap = (_0x427045.isMeshStandardMaterial ? _0x190f33 : _0x2df538).get(
          _0x427045.envMap || _0x46acfb.environment,
        )),
        (_0x46acfb.envMapRotation =
          _0x46acfb.environment !== null && _0x427045.envMap === null
            ? _0x323d25.environmentRotation
            : _0x427045.envMapRotation));
      _0x569f5f === undefined &&
        (_0x427045.addEventListener('dispose', _0x34f9ab),
        (_0x569f5f = new Map()),
        (_0x46acfb.programs = _0x569f5f));
      let _0xb172e = _0x569f5f.get(_0x194e0d);
      if (_0xb172e !== undefined) {
        if (_0x46acfb.currentProgram === _0xb172e && _0x46acfb.lightsStateVersion === _0x53846c)
          return (_0x28f863(_0x427045, _0x5915e8), _0xb172e);
      } else
        ((_0x5915e8.uniforms = _0x3851b1.getUniforms(_0x427045)),
          _0x427045.onBeforeCompile(_0x5915e8, _0x4debdd),
          (_0xb172e = _0x3851b1.acquireProgram(_0x5915e8, _0x194e0d)),
          _0x569f5f.set(_0x194e0d, _0xb172e),
          (_0x46acfb.uniforms = _0x5915e8.uniforms));
      const _0x5aba2d = _0x46acfb.uniforms;
      return (
        ((!_0x427045.isShaderMaterial && !_0x427045.isRawShaderMaterial) || _0x427045.clipping === true) &&
          (_0x5aba2d.clippingPlanes = _0x138d55.uniform),
        _0x28f863(_0x427045, _0x5915e8),
        (_0x46acfb.needsLights = _0x55aa73(_0x427045)),
        (_0x46acfb.lightsStateVersion = _0x53846c),
        _0x46acfb.needsLights &&
          ((_0x5aba2d.ambientLightColor.value = _0x18c31b.state.ambient),
          (_0x5aba2d.lightProbe.value = _0x18c31b.state.probe),
          (_0x5aba2d.directionalLights.value = _0x18c31b.state.directional),
          (_0x5aba2d.directionalLightShadows.value = _0x18c31b.state.directionalShadow),
          (_0x5aba2d.spotLights.value = _0x18c31b.state.spot),
          (_0x5aba2d.spotLightShadows.value = _0x18c31b.state.spotShadow),
          (_0x5aba2d.rectAreaLights.value = _0x18c31b.state.rectArea),
          (_0x5aba2d.ltc_1.value = _0x18c31b.state.rectAreaLTC1),
          (_0x5aba2d.ltc_2.value = _0x18c31b.state.rectAreaLTC2),
          (_0x5aba2d.pointLights.value = _0x18c31b.state.point),
          (_0x5aba2d.pointLightShadows.value = _0x18c31b.state.pointShadow),
          (_0x5aba2d.hemisphereLights.value = _0x18c31b.state.hemi),
          (_0x5aba2d.directionalShadowMap.value = _0x18c31b.state.directionalShadowMap),
          (_0x5aba2d.directionalShadowMatrix.value = _0x18c31b.state.directionalShadowMatrix),
          (_0x5aba2d.spotShadowMap.value = _0x18c31b.state.spotShadowMap),
          (_0x5aba2d.spotLightMatrix.value = _0x18c31b.state.spotLightMatrix),
          (_0x5aba2d.spotLightMap.value = _0x18c31b.state.spotLightMap),
          (_0x5aba2d.pointShadowMap.value = _0x18c31b.state.pointShadowMap),
          (_0x5aba2d.pointShadowMatrix.value = _0x18c31b.state.pointShadowMatrix)),
        (_0x46acfb.currentProgram = _0xb172e),
        (_0x46acfb.uniformsList = null),
        _0xb172e
      );
    }
    function _0x31e9e0(_0x58c724) {
      if (_0x58c724.uniformsList === null) {
        const _0x4fed4d = _0x58c724.currentProgram.getUniforms();
        _0x58c724.uniformsList = WebGLUniforms.seqWithValue(_0x4fed4d.seq, _0x58c724.uniforms);
      }
      return _0x58c724.uniformsList;
    }
    function _0x28f863(_0x43b799, _0x479821) {
      const _0x81cac7 = _0x4417b3.get(_0x43b799);
      ((_0x81cac7.outputColorSpace = _0x479821.outputColorSpace),
        (_0x81cac7.batching = _0x479821.batching),
        (_0x81cac7.batchingColor = _0x479821.batchingColor),
        (_0x81cac7.instancing = _0x479821.instancing),
        (_0x81cac7.instancingColor = _0x479821.instancingColor),
        (_0x81cac7.instancingMorph = _0x479821.instancingMorph),
        (_0x81cac7.skinning = _0x479821.skinning),
        (_0x81cac7.morphTargets = _0x479821.morphTargets),
        (_0x81cac7.morphNormals = _0x479821.morphNormals),
        (_0x81cac7.morphColors = _0x479821.morphColors),
        (_0x81cac7.morphTargetsCount = _0x479821.morphTargetsCount),
        (_0x81cac7.numClippingPlanes = _0x479821.numClippingPlanes),
        (_0x81cac7.numIntersection = _0x479821.numClipIntersection),
        (_0x81cac7.vertexAlphas = _0x479821.vertexAlphas),
        (_0x81cac7.vertexTangents = _0x479821.vertexTangents),
        (_0x81cac7.toneMapping = _0x479821.toneMapping));
    }
    function _0x482c01(_0xd27064, _0x42f1e0, _0x5e9a67, _0x1f4598, _0x27e6d2) {
      if (_0x42f1e0.isScene !== true) _0x42f1e0 = _0x23e92f;
      _0xf6809a.resetTextureUnits();
      const _0x1a4865 = _0x42f1e0.fog,
        _0x19d857 = _0x1f4598.isMeshStandardMaterial ? _0x42f1e0.environment : null,
        _0x13dda6 =
          _0x30f183 === null
            ? _0x4debdd.outputColorSpace
            : _0x30f183.isXRRenderTarget === true
              ? _0x30f183.texture.colorSpace
              : LinearSRGBColorSpace,
        _0x1c05d6 = (_0x1f4598.isMeshStandardMaterial ? _0x190f33 : _0x2df538).get(
          _0x1f4598.envMap || _0x19d857,
        ),
        _0x4ea239 =
          _0x1f4598.vertexColors === true &&
          !!_0x5e9a67.attributes.color &&
          _0x5e9a67.attributes.color.itemSize === 4,
        _0x23fd2f = !!_0x5e9a67.attributes.tangent && (!!_0x1f4598.normalMap || _0x1f4598.anisotropy > 0),
        _0x164a14 = !!_0x5e9a67.morphAttributes.position,
        _0x5991da = !!_0x5e9a67.morphAttributes.normal,
        _0x41ef02 = !!_0x5e9a67.morphAttributes.color;
      let _0x23b9b9 = NoToneMapping;
      _0x1f4598.toneMapped &&
        (_0x30f183 === null || _0x30f183.isXRRenderTarget === true) &&
        (_0x23b9b9 = _0x4debdd.toneMapping);
      const _0xfdd7d =
          _0x5e9a67.morphAttributes.position ||
          _0x5e9a67.morphAttributes.normal ||
          _0x5e9a67.morphAttributes.color,
        _0x19a637 = _0xfdd7d !== undefined ? _0xfdd7d.length : 0,
        _0x3b8ba4 = _0x4417b3.get(_0x1f4598),
        _0x1bb173 = _0x1015f1.state.lights;
      if (_0x56937d === true) {
        if (_0x38e064 === true || _0xd27064 !== _0x26e4c6) {
          const _0x232b57 = _0xd27064 === _0x26e4c6 && _0x1f4598.id === _0x38bc06;
          _0x138d55.setState(_0x1f4598, _0xd27064, _0x232b57);
        }
      }
      let _0x5c7a0f = false;
      if (_0x1f4598.version === _0x3b8ba4.__version) {
        if (_0x3b8ba4.needsLights && _0x3b8ba4.lightsStateVersion !== _0x1bb173.state.version)
          _0x5c7a0f = true;
        else {
          if (_0x3b8ba4.outputColorSpace !== _0x13dda6) _0x5c7a0f = true;
          else {
            if (_0x27e6d2.isBatchedMesh && _0x3b8ba4.batching === false) _0x5c7a0f = true;
            else {
              if (!_0x27e6d2.isBatchedMesh && _0x3b8ba4.batching === true) _0x5c7a0f = true;
              else {
                if (
                  _0x27e6d2.isBatchedMesh &&
                  _0x3b8ba4.batchingColor === true &&
                  _0x27e6d2.colorTexture === null
                )
                  _0x5c7a0f = true;
                else {
                  if (
                    _0x27e6d2.isBatchedMesh &&
                    _0x3b8ba4.batchingColor === false &&
                    _0x27e6d2.colorTexture !== null
                  )
                    _0x5c7a0f = true;
                  else {
                    if (_0x27e6d2.isInstancedMesh && _0x3b8ba4.instancing === false) _0x5c7a0f = true;
                    else {
                      if (!_0x27e6d2.isInstancedMesh && _0x3b8ba4.instancing === true) _0x5c7a0f = true;
                      else {
                        if (_0x27e6d2.isSkinnedMesh && _0x3b8ba4.skinning === false) _0x5c7a0f = true;
                        else {
                          if (!_0x27e6d2.isSkinnedMesh && _0x3b8ba4.skinning === true) _0x5c7a0f = true;
                          else {
                            if (
                              _0x27e6d2.isInstancedMesh &&
                              _0x3b8ba4.instancingColor === true &&
                              _0x27e6d2.instanceColor === null
                            )
                              _0x5c7a0f = true;
                            else {
                              if (
                                _0x27e6d2.isInstancedMesh &&
                                _0x3b8ba4.instancingColor === false &&
                                _0x27e6d2.instanceColor !== null
                              )
                                _0x5c7a0f = true;
                              else {
                                if (
                                  _0x27e6d2.isInstancedMesh &&
                                  _0x3b8ba4.instancingMorph === true &&
                                  _0x27e6d2.morphTexture === null
                                )
                                  _0x5c7a0f = true;
                                else {
                                  if (
                                    _0x27e6d2.isInstancedMesh &&
                                    _0x3b8ba4.instancingMorph === false &&
                                    _0x27e6d2.morphTexture !== null
                                  )
                                    _0x5c7a0f = true;
                                  else {
                                    if (_0x3b8ba4.envMap !== _0x1c05d6) _0x5c7a0f = true;
                                    else {
                                      if (_0x1f4598.fog === true && _0x3b8ba4.fog !== _0x1a4865)
                                        _0x5c7a0f = true;
                                      else {
                                        if (
                                          _0x3b8ba4.numClippingPlanes !== undefined &&
                                          (_0x3b8ba4.numClippingPlanes !== _0x138d55.numPlanes ||
                                            _0x3b8ba4.numIntersection !== _0x138d55.numIntersection)
                                        )
                                          _0x5c7a0f = true;
                                        else {
                                          if (_0x3b8ba4.vertexAlphas !== _0x4ea239) _0x5c7a0f = true;
                                          else {
                                            if (_0x3b8ba4.vertexTangents !== _0x23fd2f) _0x5c7a0f = true;
                                            else {
                                              if (_0x3b8ba4.morphTargets !== _0x164a14) _0x5c7a0f = true;
                                              else {
                                                if (_0x3b8ba4.morphNormals !== _0x5991da) _0x5c7a0f = true;
                                                else {
                                                  if (_0x3b8ba4.morphColors !== _0x41ef02) _0x5c7a0f = true;
                                                  else {
                                                    if (_0x3b8ba4.toneMapping !== _0x23b9b9) _0x5c7a0f = true;
                                                    else
                                                      _0x3b8ba4.morphTargetsCount !== _0x19a637 &&
                                                        (_0x5c7a0f = true);
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } else ((_0x5c7a0f = true), (_0x3b8ba4.__version = _0x1f4598.version));
      let _0x4eab13 = _0x3b8ba4.currentProgram;
      _0x5c7a0f === true && (_0x4eab13 = _0x342285(_0x1f4598, _0x42f1e0, _0x27e6d2));
      let _0x177611 = false,
        _0x1bdea6 = false,
        _0x5c3f38 = false;
      const _0x2cf7d0 = _0x4eab13.getUniforms(),
        _0x2b10ca = _0x3b8ba4.uniforms;
      _0xd95679.useProgram(_0x4eab13.program) && ((_0x177611 = true), (_0x1bdea6 = true), (_0x5c3f38 = true));
      _0x1f4598.id !== _0x38bc06 && ((_0x38bc06 = _0x1f4598.id), (_0x1bdea6 = true));
      if (_0x177611 || _0x26e4c6 !== _0xd27064) {
        const _0x3b4d2e = _0xd95679.buffers.depth.getReversed();
        _0x3b4d2e &&
          _0xd27064.reversedDepth !== true &&
          ((_0xd27064._reversedDepth = true), _0xd27064.updateProjectionMatrix());
        (_0x2cf7d0.setValue(_0xeced53, 'projectionMatrix', _0xd27064.projectionMatrix),
          _0x2cf7d0.setValue(_0xeced53, 'viewMatrix', _0xd27064.matrixWorldInverse));
        const _0x47752b = _0x2cf7d0.map.cameraPosition;
        (_0x47752b !== undefined &&
          _0x47752b.setValue(_0xeced53, _0xf786c7.setFromMatrixPosition(_0xd27064.matrixWorld)),
          _0x5391b9.logarithmicDepthBuffer &&
            _0x2cf7d0.setValue(_0xeced53, 'logDepthBufFC', 2 / (Math.log(_0xd27064.far + 1) / Math.LN2)),
          (_0x1f4598.isMeshPhongMaterial ||
            _0x1f4598.isMeshToonMaterial ||
            _0x1f4598.isMeshLambertMaterial ||
            _0x1f4598.isMeshBasicMaterial ||
            _0x1f4598.isMeshStandardMaterial ||
            _0x1f4598.isShaderMaterial) &&
            _0x2cf7d0.setValue(_0xeced53, 'isOrthographic', _0xd27064.isOrthographicCamera === true),
          _0x26e4c6 !== _0xd27064 && ((_0x26e4c6 = _0xd27064), (_0x1bdea6 = true), (_0x5c3f38 = true)));
      }
      if (_0x27e6d2.isSkinnedMesh) {
        (_0x2cf7d0.setOptional(_0xeced53, _0x27e6d2, 'bindMatrix'),
          _0x2cf7d0.setOptional(_0xeced53, _0x27e6d2, 'bindMatrixInverse'));
        const _0x597b3d = _0x27e6d2.skeleton;
        if (_0x597b3d) {
          if (_0x597b3d.boneTexture === null) _0x597b3d.computeBoneTexture();
          _0x2cf7d0.setValue(_0xeced53, 'boneTexture', _0x597b3d.boneTexture, _0xf6809a);
        }
      }
      _0x27e6d2.isBatchedMesh &&
        (_0x2cf7d0.setOptional(_0xeced53, _0x27e6d2, 'batchingTexture'),
        _0x2cf7d0.setValue(_0xeced53, 'batchingTexture', _0x27e6d2._matricesTexture, _0xf6809a),
        _0x2cf7d0.setOptional(_0xeced53, _0x27e6d2, 'batchingIdTexture'),
        _0x2cf7d0.setValue(_0xeced53, 'batchingIdTexture', _0x27e6d2._indirectTexture, _0xf6809a),
        _0x2cf7d0.setOptional(_0xeced53, _0x27e6d2, 'batchingColorTexture'),
        _0x27e6d2._colorsTexture !== null &&
          _0x2cf7d0.setValue(_0xeced53, 'batchingColorTexture', _0x27e6d2._colorsTexture, _0xf6809a));
      const _0xda0277 = _0x5e9a67.morphAttributes;
      (_0xda0277.position !== undefined || _0xda0277.normal !== undefined || _0xda0277.color !== undefined) &&
        _0x1736c0.update(_0x27e6d2, _0x5e9a67, _0x4eab13);
      (_0x1bdea6 || _0x3b8ba4.receiveShadow !== _0x27e6d2.receiveShadow) &&
        ((_0x3b8ba4.receiveShadow = _0x27e6d2.receiveShadow),
        _0x2cf7d0.setValue(_0xeced53, 'receiveShadow', _0x27e6d2.receiveShadow));
      _0x1f4598.isMeshGouraudMaterial &&
        _0x1f4598.envMap !== null &&
        ((_0x2b10ca.envMap.value = _0x1c05d6),
        (_0x2b10ca.flipEnvMap.value =
          _0x1c05d6.isCubeTexture && _0x1c05d6.isRenderTargetTexture === false ? -1 : 1));
      _0x1f4598.isMeshStandardMaterial &&
        _0x1f4598.envMap === null &&
        _0x42f1e0.environment !== null &&
        (_0x2b10ca.envMapIntensity.value = _0x42f1e0.environmentIntensity);
      _0x1bdea6 &&
        (_0x2cf7d0.setValue(_0xeced53, 'toneMappingExposure', _0x4debdd.toneMappingExposure),
        _0x3b8ba4.needsLights && _0x1fe5f0(_0x2b10ca, _0x5c3f38),
        _0x1a4865 && _0x1f4598.fog === true && _0x13ee3c.refreshFogUniforms(_0x2b10ca, _0x1a4865),
        _0x13ee3c.refreshMaterialUniforms(
          _0x2b10ca,
          _0x1f4598,
          _0x57b4f1,
          _0x4cb33e,
          _0x1015f1.state.transmissionRenderTarget[_0xd27064.id],
        ),
        WebGLUniforms.upload(_0xeced53, _0x31e9e0(_0x3b8ba4), _0x2b10ca, _0xf6809a));
      _0x1f4598.isShaderMaterial &&
        _0x1f4598.uniformsNeedUpdate === true &&
        (WebGLUniforms.upload(_0xeced53, _0x31e9e0(_0x3b8ba4), _0x2b10ca, _0xf6809a),
        (_0x1f4598.uniformsNeedUpdate = false));
      _0x1f4598.isSpriteMaterial && _0x2cf7d0.setValue(_0xeced53, 'center', _0x27e6d2.center);
      (_0x2cf7d0.setValue(_0xeced53, 'modelViewMatrix', _0x27e6d2.modelViewMatrix),
        _0x2cf7d0.setValue(_0xeced53, 'normalMatrix', _0x27e6d2.normalMatrix),
        _0x2cf7d0.setValue(_0xeced53, 'modelMatrix', _0x27e6d2.matrixWorld));
      if (_0x1f4598.isShaderMaterial || _0x1f4598.isRawShaderMaterial) {
        const _0x217120 = _0x1f4598.uniformsGroups;
        for (let _0x4baf68 = 0, _0x138309 = _0x217120.length; _0x4baf68 < _0x138309; _0x4baf68++) {
          const _0x2976d2 = _0x217120[_0x4baf68];
          (_0x21960a.update(_0x2976d2, _0x4eab13), _0x21960a.bind(_0x2976d2, _0x4eab13));
        }
      }
      return _0x4eab13;
    }
    function _0x1fe5f0(_0x5bad9b, _0x4e518c) {
      ((_0x5bad9b.ambientLightColor.needsUpdate = _0x4e518c),
        (_0x5bad9b.lightProbe.needsUpdate = _0x4e518c),
        (_0x5bad9b.directionalLights.needsUpdate = _0x4e518c),
        (_0x5bad9b.directionalLightShadows.needsUpdate = _0x4e518c),
        (_0x5bad9b.pointLights.needsUpdate = _0x4e518c),
        (_0x5bad9b.pointLightShadows.needsUpdate = _0x4e518c),
        (_0x5bad9b.spotLights.needsUpdate = _0x4e518c),
        (_0x5bad9b.spotLightShadows.needsUpdate = _0x4e518c),
        (_0x5bad9b.rectAreaLights.needsUpdate = _0x4e518c),
        (_0x5bad9b.hemisphereLights.needsUpdate = _0x4e518c));
    }
    function _0x55aa73(_0x5ca87e) {
      return (
        _0x5ca87e.isMeshLambertMaterial ||
        _0x5ca87e.isMeshToonMaterial ||
        _0x5ca87e.isMeshPhongMaterial ||
        _0x5ca87e.isMeshStandardMaterial ||
        _0x5ca87e.isShadowMaterial ||
        (_0x5ca87e.isShaderMaterial && _0x5ca87e.lights === true)
      );
    }
    ((this.getActiveCubeFace = function () {
      return _0xfee26f;
    }),
      (this.getActiveMipmapLevel = function () {
        return _0x390301;
      }),
      (this.getRenderTarget = function () {
        return _0x30f183;
      }),
      (this.setRenderTargetTextures = function (_0xfe1bd6, _0x504d7a, _0x25f68e) {
        const _0x5dff6d = _0x4417b3.get(_0xfe1bd6);
        ((_0x5dff6d.__autoAllocateDepthBuffer = _0xfe1bd6.resolveDepthBuffer === false),
          _0x5dff6d.__autoAllocateDepthBuffer === false && (_0x5dff6d.__useRenderToTexture = false),
          (_0x4417b3.get(_0xfe1bd6.texture).__webglTexture = _0x504d7a),
          (_0x4417b3.get(_0xfe1bd6.depthTexture).__webglTexture = _0x5dff6d.__autoAllocateDepthBuffer
            ? undefined
            : _0x25f68e),
          (_0x5dff6d.__hasExternalTextures = true));
      }),
      (this.setRenderTargetFramebuffer = function (_0x5a9f58, _0x493363) {
        const _0x339ac0 = _0x4417b3.get(_0x5a9f58);
        ((_0x339ac0.__webglFramebuffer = _0x493363),
          (_0x339ac0.__useDefaultFramebuffer = _0x493363 === undefined));
      }));
    const _0xfb9199 = _0xeced53.createFramebuffer();
    ((this.setRenderTarget = function (_0x3f5eab, _0xdde354 = 0, _0x226698 = 0) {
      ((_0x30f183 = _0x3f5eab), (_0xfee26f = _0xdde354), (_0x390301 = _0x226698));
      let _0x19fe5f = true,
        _0x5aaf9b = null,
        _0x217f0e = false,
        _0xc18c9c = false;
      if (_0x3f5eab) {
        const _0x11d38f = _0x4417b3.get(_0x3f5eab);
        if (_0x11d38f.__useDefaultFramebuffer !== undefined)
          (_0xd95679.bindFramebuffer(_0xeced53.FRAMEBUFFER, null), (_0x19fe5f = false));
        else {
          if (_0x11d38f.__webglFramebuffer === undefined) _0xf6809a.setupRenderTarget(_0x3f5eab);
          else {
            if (_0x11d38f.__hasExternalTextures)
              _0xf6809a.rebindTextures(
                _0x3f5eab,
                _0x4417b3.get(_0x3f5eab.texture).__webglTexture,
                _0x4417b3.get(_0x3f5eab.depthTexture).__webglTexture,
              );
            else {
              if (_0x3f5eab.depthBuffer) {
                const _0x486460 = _0x3f5eab.depthTexture;
                if (_0x11d38f.__boundDepthTexture !== _0x486460) {
                  if (
                    _0x486460 !== null &&
                    _0x4417b3.has(_0x486460) &&
                    (_0x3f5eab.width !== _0x486460.image.width || _0x3f5eab.height !== _0x486460.image.height)
                  )
                    throw new Error(
                      'WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.',
                    );
                  _0xf6809a.setupDepthRenderbuffer(_0x3f5eab);
                }
              }
            }
          }
        }
        const _0x1d1637 = _0x3f5eab.texture;
        (_0x1d1637.isData3DTexture || _0x1d1637.isDataArrayTexture || _0x1d1637.isCompressedArrayTexture) &&
          (_0xc18c9c = true);
        const _0x4f4e6e = _0x4417b3.get(_0x3f5eab).__webglFramebuffer;
        if (_0x3f5eab.isWebGLCubeRenderTarget)
          (Array.isArray(_0x4f4e6e[_0xdde354])
            ? (_0x5aaf9b = _0x4f4e6e[_0xdde354][_0x226698])
            : (_0x5aaf9b = _0x4f4e6e[_0xdde354]),
            (_0x217f0e = true));
        else
          _0x3f5eab.samples > 0 && _0xf6809a.useMultisampledRTT(_0x3f5eab) === false
            ? (_0x5aaf9b = _0x4417b3.get(_0x3f5eab).__webglMultisampledFramebuffer)
            : Array.isArray(_0x4f4e6e)
              ? (_0x5aaf9b = _0x4f4e6e[_0x226698])
              : (_0x5aaf9b = _0x4f4e6e);
        (_0x4e2d9d.copy(_0x3f5eab.viewport),
          _0x4047d6.copy(_0x3f5eab.scissor),
          (_0x2748d6 = _0x3f5eab.scissorTest));
      } else
        (_0x4e2d9d.copy(_0x160f25).multiplyScalar(_0x57b4f1).floor(),
          _0x4047d6.copy(_0x138c1d).multiplyScalar(_0x57b4f1).floor(),
          (_0x2748d6 = _0x4b4707));
      _0x226698 !== 0 && (_0x5aaf9b = _0xfb9199);
      const _0x163acf = _0xd95679.bindFramebuffer(_0xeced53.FRAMEBUFFER, _0x5aaf9b);
      _0x163acf && _0x19fe5f && _0xd95679.drawBuffers(_0x3f5eab, _0x5aaf9b);
      (_0xd95679.viewport(_0x4e2d9d), _0xd95679.scissor(_0x4047d6), _0xd95679.setScissorTest(_0x2748d6));
      if (_0x217f0e) {
        const _0x2239a2 = _0x4417b3.get(_0x3f5eab.texture);
        _0xeced53.framebufferTexture2D(
          _0xeced53.FRAMEBUFFER,
          _0xeced53.COLOR_ATTACHMENT0,
          _0xeced53.TEXTURE_CUBE_MAP_POSITIVE_X + _0xdde354,
          _0x2239a2.__webglTexture,
          _0x226698,
        );
      } else {
        if (_0xc18c9c) {
          const _0x1eb6dd = _0xdde354;
          for (let _0x11e2f2 = 0; _0x11e2f2 < _0x3f5eab.textures.length; _0x11e2f2++) {
            const _0x35c506 = _0x4417b3.get(_0x3f5eab.textures[_0x11e2f2]);
            _0xeced53.framebufferTextureLayer(
              _0xeced53.FRAMEBUFFER,
              _0xeced53.COLOR_ATTACHMENT0 + _0x11e2f2,
              _0x35c506.__webglTexture,
              _0x226698,
              _0x1eb6dd,
            );
          }
        } else {
          if (_0x3f5eab !== null && _0x226698 !== 0) {
            const _0x2c3339 = _0x4417b3.get(_0x3f5eab.texture);
            _0xeced53.framebufferTexture2D(
              _0xeced53.FRAMEBUFFER,
              _0xeced53.COLOR_ATTACHMENT0,
              _0xeced53.TEXTURE_2D,
              _0x2c3339.__webglTexture,
              _0x226698,
            );
          }
        }
      }
      _0x38bc06 = -1;
    }),
      (this.readRenderTargetPixels = function (
        _0x141715,
        _0x2d130c,
        _0x5dc655,
        _0x5f8a2d,
        _0x3d26ae,
        _0x37bcdf,
        _0x38cb3f,
        _0x17ec5c = 0,
      ) {
        if (!(_0x141715 && _0x141715.isWebGLRenderTarget)) {
          console.error(
            'THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.',
          );
          return;
        }
        let _0x4358cb = _0x4417b3.get(_0x141715).__webglFramebuffer;
        _0x141715.isWebGLCubeRenderTarget && _0x38cb3f !== undefined && (_0x4358cb = _0x4358cb[_0x38cb3f]);
        if (_0x4358cb) {
          _0xd95679.bindFramebuffer(_0xeced53.FRAMEBUFFER, _0x4358cb);
          try {
            const _0x9265a2 = _0x141715.textures[_0x17ec5c],
              _0x2cd910 = _0x9265a2.format,
              _0x2acd4d = _0x9265a2.type;
            if (!_0x5391b9.textureFormatReadable(_0x2cd910)) {
              console.error(
                'THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.',
              );
              return;
            }
            if (!_0x5391b9.textureTypeReadable(_0x2acd4d)) {
              console.error(
                'THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.',
              );
              return;
            }
            if (
              _0x2d130c >= 0 &&
              _0x2d130c <= _0x141715.width - _0x5f8a2d &&
              _0x5dc655 >= 0 &&
              _0x5dc655 <= _0x141715.height - _0x3d26ae
            ) {
              if (_0x141715.textures.length > 1)
                _0xeced53.readBuffer(_0xeced53.COLOR_ATTACHMENT0 + _0x17ec5c);
              _0xeced53.readPixels(
                _0x2d130c,
                _0x5dc655,
                _0x5f8a2d,
                _0x3d26ae,
                _0x1f2863.convert(_0x2cd910),
                _0x1f2863.convert(_0x2acd4d),
                _0x37bcdf,
              );
            }
          } finally {
            const _0x53c443 = _0x30f183 !== null ? _0x4417b3.get(_0x30f183).__webglFramebuffer : null;
            _0xd95679.bindFramebuffer(_0xeced53.FRAMEBUFFER, _0x53c443);
          }
        }
      }),
      (this.readRenderTargetPixelsAsync = async function (
        _0x7559a9,
        _0x32e623,
        _0x318251,
        _0x2dccbc,
        _0x63acba,
        _0x44ddee,
        _0x1d19f9,
        _0x548208 = 0,
      ) {
        if (!(_0x7559a9 && _0x7559a9.isWebGLRenderTarget))
          throw new Error(
            'THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.',
          );
        let _0x5cb2f1 = _0x4417b3.get(_0x7559a9).__webglFramebuffer;
        _0x7559a9.isWebGLCubeRenderTarget && _0x1d19f9 !== undefined && (_0x5cb2f1 = _0x5cb2f1[_0x1d19f9]);
        if (_0x5cb2f1) {
          if (
            _0x32e623 >= 0 &&
            _0x32e623 <= _0x7559a9.width - _0x2dccbc &&
            _0x318251 >= 0 &&
            _0x318251 <= _0x7559a9.height - _0x63acba
          ) {
            _0xd95679.bindFramebuffer(_0xeced53.FRAMEBUFFER, _0x5cb2f1);
            const _0xabb934 = _0x7559a9.textures[_0x548208],
              _0x4c3c25 = _0xabb934.format,
              _0x1fa010 = _0xabb934.type;
            if (!_0x5391b9.textureFormatReadable(_0x4c3c25))
              throw new Error(
                'THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.',
              );
            if (!_0x5391b9.textureTypeReadable(_0x1fa010))
              throw new Error(
                'THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.',
              );
            const _0x588954 = _0xeced53.createBuffer();
            (_0xeced53.bindBuffer(_0xeced53.PIXEL_PACK_BUFFER, _0x588954),
              _0xeced53.bufferData(_0xeced53.PIXEL_PACK_BUFFER, _0x44ddee.byteLength, _0xeced53.STREAM_READ));
            if (_0x7559a9.textures.length > 1) _0xeced53.readBuffer(_0xeced53.COLOR_ATTACHMENT0 + _0x548208);
            _0xeced53.readPixels(
              _0x32e623,
              _0x318251,
              _0x2dccbc,
              _0x63acba,
              _0x1f2863.convert(_0x4c3c25),
              _0x1f2863.convert(_0x1fa010),
              0,
            );
            const _0x2d9c20 = _0x30f183 !== null ? _0x4417b3.get(_0x30f183).__webglFramebuffer : null;
            _0xd95679.bindFramebuffer(_0xeced53.FRAMEBUFFER, _0x2d9c20);
            const _0x89e390 = _0xeced53.fenceSync(_0xeced53.SYNC_GPU_COMMANDS_COMPLETE, 0);
            return (
              _0xeced53.flush(),
              await probeAsync(_0xeced53, _0x89e390, 4),
              _0xeced53.bindBuffer(_0xeced53.PIXEL_PACK_BUFFER, _0x588954),
              _0xeced53.getBufferSubData(_0xeced53.PIXEL_PACK_BUFFER, 0, _0x44ddee),
              _0xeced53.deleteBuffer(_0x588954),
              _0xeced53.deleteSync(_0x89e390),
              _0x44ddee
            );
          } else
            throw new Error(
              'THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.',
            );
        }
      }),
      (this.copyFramebufferToTexture = function (_0x34cf92, _0x53cc6c = null, _0x18b48e = 0) {
        const _0x1d3bd4 = Math.pow(2, -_0x18b48e),
          _0x263a2 = Math.floor(_0x34cf92.image.width * _0x1d3bd4),
          _0x288252 = Math.floor(_0x34cf92.image.height * _0x1d3bd4),
          _0x505560 = _0x53cc6c !== null ? _0x53cc6c.x : 0,
          _0x43e5d0 = _0x53cc6c !== null ? _0x53cc6c.y : 0;
        (_0xf6809a.setTexture2D(_0x34cf92, 0),
          _0xeced53.copyTexSubImage2D(
            _0xeced53.TEXTURE_2D,
            _0x18b48e,
            0,
            0,
            _0x505560,
            _0x43e5d0,
            _0x263a2,
            _0x288252,
          ),
          _0xd95679.unbindTexture());
      }));
    const _0x12eca1 = _0xeced53.createFramebuffer(),
      _0xb7421b = _0xeced53.createFramebuffer();
    ((this.copyTextureToTexture = function (
      _0x49d034,
      _0x2abf8c,
      _0x57c07f = null,
      _0x24a629 = null,
      _0x5a7f4c = 0,
      _0x10f26e = null,
    ) {
      _0x10f26e === null &&
        (_0x5a7f4c !== 0
          ? (warnOnce(
              'WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels.',
            ),
            (_0x10f26e = _0x5a7f4c),
            (_0x5a7f4c = 0))
          : (_0x10f26e = 0));
      let _0x24d066, _0x8595d9, _0x436aba, _0x428175, _0x437dcb, _0x1411f1, _0x597af5, _0x4bca3e, _0x4b60a1;
      const _0x22db65 = _0x49d034.isCompressedTexture ? _0x49d034.mipmaps[_0x10f26e] : _0x49d034.image;
      if (_0x57c07f !== null)
        ((_0x24d066 = _0x57c07f.max.x - _0x57c07f.min.x),
          (_0x8595d9 = _0x57c07f.max.y - _0x57c07f.min.y),
          (_0x436aba = _0x57c07f.isBox3 ? _0x57c07f.max.z - _0x57c07f.min.z : 1),
          (_0x428175 = _0x57c07f.min.x),
          (_0x437dcb = _0x57c07f.min.y),
          (_0x1411f1 = _0x57c07f.isBox3 ? _0x57c07f.min.z : 0));
      else {
        const _0x5ef464 = Math.pow(2, -_0x5a7f4c);
        ((_0x24d066 = Math.floor(_0x22db65.width * _0x5ef464)),
          (_0x8595d9 = Math.floor(_0x22db65.height * _0x5ef464)));
        if (_0x49d034.isDataArrayTexture) _0x436aba = _0x22db65.depth;
        else
          _0x49d034.isData3DTexture ? (_0x436aba = Math.floor(_0x22db65.depth * _0x5ef464)) : (_0x436aba = 1);
        ((_0x428175 = 0), (_0x437dcb = 0), (_0x1411f1 = 0));
      }
      _0x24a629 !== null
        ? ((_0x597af5 = _0x24a629.x), (_0x4bca3e = _0x24a629.y), (_0x4b60a1 = _0x24a629.z))
        : ((_0x597af5 = 0), (_0x4bca3e = 0), (_0x4b60a1 = 0));
      const _0x3948c6 = _0x1f2863.convert(_0x2abf8c.format),
        _0x4e5f34 = _0x1f2863.convert(_0x2abf8c.type);
      let _0x9b66fc;
      if (_0x2abf8c.isData3DTexture)
        (_0xf6809a.setTexture3D(_0x2abf8c, 0), (_0x9b66fc = _0xeced53.TEXTURE_3D));
      else
        _0x2abf8c.isDataArrayTexture || _0x2abf8c.isCompressedArrayTexture
          ? (_0xf6809a.setTexture2DArray(_0x2abf8c, 0), (_0x9b66fc = _0xeced53.TEXTURE_2D_ARRAY))
          : (_0xf6809a.setTexture2D(_0x2abf8c, 0), (_0x9b66fc = _0xeced53.TEXTURE_2D));
      (_0xeced53.pixelStorei(_0xeced53.UNPACK_FLIP_Y_WEBGL, _0x2abf8c.flipY),
        _0xeced53.pixelStorei(_0xeced53.UNPACK_PREMULTIPLY_ALPHA_WEBGL, _0x2abf8c.premultiplyAlpha),
        _0xeced53.pixelStorei(_0xeced53.UNPACK_ALIGNMENT, _0x2abf8c.unpackAlignment));
      const _0x1ebe25 = _0xeced53.getParameter(_0xeced53.UNPACK_ROW_LENGTH),
        _0x1e93e4 = _0xeced53.getParameter(_0xeced53.UNPACK_IMAGE_HEIGHT),
        _0x1ea9de = _0xeced53.getParameter(_0xeced53.UNPACK_SKIP_PIXELS),
        _0x28cefb = _0xeced53.getParameter(_0xeced53.UNPACK_SKIP_ROWS),
        _0x39d9dc = _0xeced53.getParameter(_0xeced53.UNPACK_SKIP_IMAGES);
      (_0xeced53.pixelStorei(_0xeced53.UNPACK_ROW_LENGTH, _0x22db65.width),
        _0xeced53.pixelStorei(_0xeced53.UNPACK_IMAGE_HEIGHT, _0x22db65.height),
        _0xeced53.pixelStorei(_0xeced53.UNPACK_SKIP_PIXELS, _0x428175),
        _0xeced53.pixelStorei(_0xeced53.UNPACK_SKIP_ROWS, _0x437dcb),
        _0xeced53.pixelStorei(_0xeced53.UNPACK_SKIP_IMAGES, _0x1411f1));
      const _0x303b83 = _0x49d034.isDataArrayTexture || _0x49d034.isData3DTexture,
        _0x3956e8 = _0x2abf8c.isDataArrayTexture || _0x2abf8c.isData3DTexture;
      if (_0x49d034.isDepthTexture) {
        const _0x4b3116 = _0x4417b3.get(_0x49d034),
          _0x46d862 = _0x4417b3.get(_0x2abf8c),
          _0x3d52ff = _0x4417b3.get(_0x4b3116.__renderTarget),
          _0x3d5c97 = _0x4417b3.get(_0x46d862.__renderTarget);
        (_0xd95679.bindFramebuffer(_0xeced53.READ_FRAMEBUFFER, _0x3d52ff.__webglFramebuffer),
          _0xd95679.bindFramebuffer(_0xeced53.DRAW_FRAMEBUFFER, _0x3d5c97.__webglFramebuffer));
        for (let _0x29a474 = 0; _0x29a474 < _0x436aba; _0x29a474++) {
          (_0x303b83 &&
            (_0xeced53.framebufferTextureLayer(
              _0xeced53.READ_FRAMEBUFFER,
              _0xeced53.COLOR_ATTACHMENT0,
              _0x4417b3.get(_0x49d034).__webglTexture,
              _0x5a7f4c,
              _0x1411f1 + _0x29a474,
            ),
            _0xeced53.framebufferTextureLayer(
              _0xeced53.DRAW_FRAMEBUFFER,
              _0xeced53.COLOR_ATTACHMENT0,
              _0x4417b3.get(_0x2abf8c).__webglTexture,
              _0x10f26e,
              _0x4b60a1 + _0x29a474,
            )),
            _0xeced53.blitFramebuffer(
              _0x428175,
              _0x437dcb,
              _0x24d066,
              _0x8595d9,
              _0x597af5,
              _0x4bca3e,
              _0x24d066,
              _0x8595d9,
              _0xeced53.DEPTH_BUFFER_BIT,
              _0xeced53.NEAREST,
            ));
        }
        (_0xd95679.bindFramebuffer(_0xeced53.READ_FRAMEBUFFER, null),
          _0xd95679.bindFramebuffer(_0xeced53.DRAW_FRAMEBUFFER, null));
      } else {
        if (_0x5a7f4c !== 0 || _0x49d034.isRenderTargetTexture || _0x4417b3.has(_0x49d034)) {
          const _0x1f4816 = _0x4417b3.get(_0x49d034),
            _0xcd29a5 = _0x4417b3.get(_0x2abf8c);
          (_0xd95679.bindFramebuffer(_0xeced53.READ_FRAMEBUFFER, _0x12eca1),
            _0xd95679.bindFramebuffer(_0xeced53.DRAW_FRAMEBUFFER, _0xb7421b));
          for (let _0x26c0f2 = 0; _0x26c0f2 < _0x436aba; _0x26c0f2++) {
            _0x303b83
              ? _0xeced53.framebufferTextureLayer(
                  _0xeced53.READ_FRAMEBUFFER,
                  _0xeced53.COLOR_ATTACHMENT0,
                  _0x1f4816.__webglTexture,
                  _0x5a7f4c,
                  _0x1411f1 + _0x26c0f2,
                )
              : _0xeced53.framebufferTexture2D(
                  _0xeced53.READ_FRAMEBUFFER,
                  _0xeced53.COLOR_ATTACHMENT0,
                  _0xeced53.TEXTURE_2D,
                  _0x1f4816.__webglTexture,
                  _0x5a7f4c,
                );
            _0x3956e8
              ? _0xeced53.framebufferTextureLayer(
                  _0xeced53.DRAW_FRAMEBUFFER,
                  _0xeced53.COLOR_ATTACHMENT0,
                  _0xcd29a5.__webglTexture,
                  _0x10f26e,
                  _0x4b60a1 + _0x26c0f2,
                )
              : _0xeced53.framebufferTexture2D(
                  _0xeced53.DRAW_FRAMEBUFFER,
                  _0xeced53.COLOR_ATTACHMENT0,
                  _0xeced53.TEXTURE_2D,
                  _0xcd29a5.__webglTexture,
                  _0x10f26e,
                );
            if (_0x5a7f4c !== 0)
              _0xeced53.blitFramebuffer(
                _0x428175,
                _0x437dcb,
                _0x24d066,
                _0x8595d9,
                _0x597af5,
                _0x4bca3e,
                _0x24d066,
                _0x8595d9,
                _0xeced53.COLOR_BUFFER_BIT,
                _0xeced53.NEAREST,
              );
            else
              _0x3956e8
                ? _0xeced53.copyTexSubImage3D(
                    _0x9b66fc,
                    _0x10f26e,
                    _0x597af5,
                    _0x4bca3e,
                    _0x4b60a1 + _0x26c0f2,
                    _0x428175,
                    _0x437dcb,
                    _0x24d066,
                    _0x8595d9,
                  )
                : _0xeced53.copyTexSubImage2D(
                    _0x9b66fc,
                    _0x10f26e,
                    _0x597af5,
                    _0x4bca3e,
                    _0x428175,
                    _0x437dcb,
                    _0x24d066,
                    _0x8595d9,
                  );
          }
          (_0xd95679.bindFramebuffer(_0xeced53.READ_FRAMEBUFFER, null),
            _0xd95679.bindFramebuffer(_0xeced53.DRAW_FRAMEBUFFER, null));
        } else {
          if (_0x3956e8) {
            if (_0x49d034.isDataTexture || _0x49d034.isData3DTexture)
              _0xeced53.texSubImage3D(
                _0x9b66fc,
                _0x10f26e,
                _0x597af5,
                _0x4bca3e,
                _0x4b60a1,
                _0x24d066,
                _0x8595d9,
                _0x436aba,
                _0x3948c6,
                _0x4e5f34,
                _0x22db65.data,
              );
            else
              _0x2abf8c.isCompressedArrayTexture
                ? _0xeced53.compressedTexSubImage3D(
                    _0x9b66fc,
                    _0x10f26e,
                    _0x597af5,
                    _0x4bca3e,
                    _0x4b60a1,
                    _0x24d066,
                    _0x8595d9,
                    _0x436aba,
                    _0x3948c6,
                    _0x22db65.data,
                  )
                : _0xeced53.texSubImage3D(
                    _0x9b66fc,
                    _0x10f26e,
                    _0x597af5,
                    _0x4bca3e,
                    _0x4b60a1,
                    _0x24d066,
                    _0x8595d9,
                    _0x436aba,
                    _0x3948c6,
                    _0x4e5f34,
                    _0x22db65,
                  );
          } else {
            if (_0x49d034.isDataTexture)
              _0xeced53.texSubImage2D(
                _0xeced53.TEXTURE_2D,
                _0x10f26e,
                _0x597af5,
                _0x4bca3e,
                _0x24d066,
                _0x8595d9,
                _0x3948c6,
                _0x4e5f34,
                _0x22db65.data,
              );
            else
              _0x49d034.isCompressedTexture
                ? _0xeced53.compressedTexSubImage2D(
                    _0xeced53.TEXTURE_2D,
                    _0x10f26e,
                    _0x597af5,
                    _0x4bca3e,
                    _0x22db65.width,
                    _0x22db65.height,
                    _0x3948c6,
                    _0x22db65.data,
                  )
                : _0xeced53.texSubImage2D(
                    _0xeced53.TEXTURE_2D,
                    _0x10f26e,
                    _0x597af5,
                    _0x4bca3e,
                    _0x24d066,
                    _0x8595d9,
                    _0x3948c6,
                    _0x4e5f34,
                    _0x22db65,
                  );
          }
        }
      }
      (_0xeced53.pixelStorei(_0xeced53.UNPACK_ROW_LENGTH, _0x1ebe25),
        _0xeced53.pixelStorei(_0xeced53.UNPACK_IMAGE_HEIGHT, _0x1e93e4),
        _0xeced53.pixelStorei(_0xeced53.UNPACK_SKIP_PIXELS, _0x1ea9de),
        _0xeced53.pixelStorei(_0xeced53.UNPACK_SKIP_ROWS, _0x28cefb),
        _0xeced53.pixelStorei(_0xeced53.UNPACK_SKIP_IMAGES, _0x39d9dc),
        _0x10f26e === 0 && _0x2abf8c.generateMipmaps && _0xeced53.generateMipmap(_0x9b66fc),
        _0xd95679.unbindTexture());
    }),
      (this.initRenderTarget = function (_0x2f9b88) {
        _0x4417b3.get(_0x2f9b88).__webglFramebuffer === undefined && _0xf6809a.setupRenderTarget(_0x2f9b88);
      }),
      (this.initTexture = function (_0x3afc81) {
        if (_0x3afc81.isCubeTexture) _0xf6809a.setTextureCube(_0x3afc81, 0);
        else {
          if (_0x3afc81.isData3DTexture) _0xf6809a.setTexture3D(_0x3afc81, 0);
          else
            _0x3afc81.isDataArrayTexture || _0x3afc81.isCompressedArrayTexture
              ? _0xf6809a.setTexture2DArray(_0x3afc81, 0)
              : _0xf6809a.setTexture2D(_0x3afc81, 0);
        }
        _0xd95679.unbindTexture();
      }),
      (this.resetState = function () {
        ((_0xfee26f = 0), (_0x390301 = 0), (_0x30f183 = null), _0xd95679.reset(), _0x2c599f.reset());
      }),
      typeof __THREE_DEVTOOLS__ !== 'undefined' &&
        __THREE_DEVTOOLS__.dispatchEvent(new CustomEvent('observe', { detail: this })));
  }
  get ['coordinateSystem']() {
    return WebGLCoordinateSystem;
  }
  get ['outputColorSpace']() {
    return this._outputColorSpace;
  }
  set ['outputColorSpace'](_0x25ec8a) {
    this._outputColorSpace = _0x25ec8a;
    const _0x456a5d = this.getContext();
    ((_0x456a5d.drawingBufferColorSpace = ColorManagement._getDrawingBufferColorSpace(_0x25ec8a)),
      (_0x456a5d.unpackColorSpace = ColorManagement._getUnpackColorSpace()));
  }
}
export {
  ACESFilmicToneMapping,
  AddEquation,
  AddOperation,
  AdditiveBlending,
  AgXToneMapping,
  AlphaFormat,
  AlwaysCompare,
  AlwaysDepth,
  ArrayCamera,
  BackSide,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  ByteType,
  CineonToneMapping,
  ClampToEdgeWrapping,
  Color,
  ColorManagement,
  ConstantAlphaFactor,
  ConstantColorFactor,
  CubeReflectionMapping,
  CubeRefractionMapping,
  CubeTexture,
  CubeUVReflectionMapping,
  CullFaceBack,
  CullFaceFront,
  CullFaceNone,
  CustomBlending,
  CustomToneMapping,
  Data3DTexture,
  DataArrayTexture,
  DepthFormat,
  DepthStencilFormat,
  DepthTexture,
  DoubleSide,
  DstAlphaFactor,
  DstColorFactor,
  EqualCompare,
  EqualDepth,
  EquirectangularReflectionMapping,
  EquirectangularRefractionMapping,
  Euler,
  EventDispatcher,
  ExternalTexture,
  FloatType,
  FrontSide,
  Frustum,
  GLSL3,
  GreaterCompare,
  GreaterDepth,
  GreaterEqualCompare,
  GreaterEqualDepth,
  HalfFloatType,
  IntType,
  Layers,
  LessCompare,
  LessDepth,
  LessEqualCompare,
  LessEqualDepth,
  LinearFilter,
  LinearMipmapLinearFilter,
  LinearMipmapNearestFilter,
  LinearSRGBColorSpace,
  LinearToneMapping,
  LinearTransfer,
  Matrix3,
  Matrix4,
  MaxEquation,
  Mesh,
  MeshBasicMaterial,
  MeshDepthMaterial,
  MeshDistanceMaterial,
  MinEquation,
  MirroredRepeatWrapping,
  MixOperation,
  MultiplyBlending,
  MultiplyOperation,
  NearestFilter,
  NearestMipmapLinearFilter,
  NearestMipmapNearestFilter,
  NeutralToneMapping,
  NeverCompare,
  NeverDepth,
  NoBlending,
  NoColorSpace,
  NoToneMapping,
  NormalBlending,
  NotEqualCompare,
  NotEqualDepth,
  ObjectSpaceNormalMap,
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
  PMREMGenerator,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
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
  RGBFormat,
  RGB_BPTC_SIGNED_Format,
  RGB_BPTC_UNSIGNED_Format,
  RGB_ETC1_Format,
  RGB_ETC2_Format,
  RGB_PVRTC_2BPPV1_Format,
  RGB_PVRTC_4BPPV1_Format,
  RGB_S3TC_DXT1_Format,
  RGFormat,
  RGIntegerFormat,
  RedFormat,
  RedIntegerFormat,
  ReinhardToneMapping,
  RepeatWrapping,
  ReverseSubtractEquation,
  SIGNED_RED_GREEN_RGTC2_Format,
  SIGNED_RED_RGTC1_Format,
  SRGBColorSpace,
  SRGBTransfer,
  ShaderChunk,
  ShaderLib,
  ShaderMaterial,
  ShortType,
  SrcAlphaFactor,
  SrcAlphaSaturateFactor,
  SrcColorFactor,
  SubtractEquation,
  SubtractiveBlending,
  TangentSpaceNormalMap,
  Texture,
  Uint16BufferAttribute,
  Uint32BufferAttribute,
  UniformsLib,
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
  WebGLCoordinateSystem,
  WebGLCubeRenderTarget,
  WebGLRenderTarget,
  WebGLRenderer,
  WebGLUtils,
  WebXRController,
  ZeroFactor,
  createCanvasElement,
};
