import {
  AnimationClip,
  Bone,
  Box3,
  BufferAttribute,
  BufferGeometry,
  ClampToEdgeWrapping,
  Color,
  ColorManagement,
  DirectionalLight,
  DoubleSide,
  FileLoader,
  FrontSide,
  Group,
  ImageBitmapLoader,
  InstancedMesh,
  InterleavedBuffer,
  InterleavedBufferAttribute,
  Interpolant,
  InterpolateDiscrete,
  InterpolateLinear,
  Line,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  LinearFilter,
  LinearMipmapLinearFilter,
  LinearMipmapNearestFilter,
  LinearSRGBColorSpace,
  Loader,
  LoaderUtils,
  Material,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  MirroredRepeatWrapping,
  NearestFilter,
  NearestMipmapLinearFilter,
  NearestMipmapNearestFilter,
  NumberKeyframeTrack,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  PointLight,
  Points,
  PointsMaterial,
  PropertyBinding,
  Quaternion,
  QuaternionKeyframeTrack,
  RepeatWrapping,
  Skeleton,
  SkinnedMesh,
  Sphere,
  SpotLight,
  Texture,
  TextureLoader,
  TriangleFanDrawMode,
  TriangleStripDrawMode,
  Vector2,
  Vector3,
  VectorKeyframeTrack,
  SRGBColorSpace,
  InstancedBufferAttribute,
} from '../../../three.module.js';
import { toTrianglesDrawMode } from '../utils/BufferGeometryUtils.js';
class GLTFLoader extends Loader {
  constructor(_0x8e5e68) {
    (super(_0x8e5e68),
      (this.dracoLoader = null),
      (this.ktx2Loader = null),
      (this.meshoptDecoder = null),
      (this.pluginCallbacks = []),
      this.register(function (_0x1571c0) {
        return new GLTFMaterialsClearcoatExtension(_0x1571c0);
      }),
      this.register(function (_0x17f459) {
        return new GLTFMaterialsDispersionExtension(_0x17f459);
      }),
      this.register(function (_0xbdf741) {
        return new GLTFTextureBasisUExtension(_0xbdf741);
      }),
      this.register(function (_0x44fcf6) {
        return new GLTFTextureWebPExtension(_0x44fcf6);
      }),
      this.register(function (_0x231267) {
        return new GLTFTextureAVIFExtension(_0x231267);
      }),
      this.register(function (_0xa6719e) {
        return new GLTFMaterialsSheenExtension(_0xa6719e);
      }),
      this.register(function (_0x4161ec) {
        return new GLTFMaterialsTransmissionExtension(_0x4161ec);
      }),
      this.register(function (_0x3fec15) {
        return new GLTFMaterialsVolumeExtension(_0x3fec15);
      }),
      this.register(function (_0x42aea5) {
        return new GLTFMaterialsIorExtension(_0x42aea5);
      }),
      this.register(function (_0x433b91) {
        return new GLTFMaterialsEmissiveStrengthExtension(_0x433b91);
      }),
      this.register(function (_0x4f95f5) {
        return new GLTFMaterialsSpecularExtension(_0x4f95f5);
      }),
      this.register(function (_0xc709df) {
        return new GLTFMaterialsIridescenceExtension(_0xc709df);
      }),
      this.register(function (_0xc738ec) {
        return new GLTFMaterialsAnisotropyExtension(_0xc738ec);
      }),
      this.register(function (_0x14e89b) {
        return new GLTFMaterialsBumpExtension(_0x14e89b);
      }),
      this.register(function (_0x20a794) {
        return new GLTFLightsExtension(_0x20a794);
      }),
      this.register(function (_0x5ea32b) {
        return new GLTFMeshoptCompression(_0x5ea32b);
      }),
      this.register(function (_0x2ddb73) {
        return new GLTFMeshGpuInstancing(_0x2ddb73);
      }));
  }
  ['load'](_0x42471f, _0x17c3e6, _0x5077d0, _0x2ddc1a) {
    const _0xef1316 = this;
    let _0x4a2138;
    if (this.resourcePath !== '') _0x4a2138 = this.resourcePath;
    else {
      if (this.path !== '') {
        const _0x2c4500 = LoaderUtils.extractUrlBase(_0x42471f);
        _0x4a2138 = LoaderUtils.resolveURL(_0x2c4500, this.path);
      } else _0x4a2138 = LoaderUtils.extractUrlBase(_0x42471f);
    }
    this.manager.itemStart(_0x42471f);
    const _0x1a10ad = function (_0x33af30) {
        (_0x2ddc1a ? _0x2ddc1a(_0x33af30) : console.error(_0x33af30),
          _0xef1316.manager.itemError(_0x42471f),
          _0xef1316.manager.itemEnd(_0x42471f));
      },
      _0x1b1dfa = new FileLoader(this.manager);
    (_0x1b1dfa.setPath(this.path),
      _0x1b1dfa.setResponseType('arraybuffer'),
      _0x1b1dfa.setRequestHeader(this.requestHeader),
      _0x1b1dfa.setWithCredentials(this.withCredentials),
      _0x1b1dfa.load(
        _0x42471f,
        function (_0x4027ad) {
          try {
            _0xef1316.parse(
              _0x4027ad,
              _0x4a2138,
              function (_0xfa1ec3) {
                (_0x17c3e6(_0xfa1ec3), _0xef1316.manager.itemEnd(_0x42471f));
              },
              _0x1a10ad,
            );
          } catch (_0x38f95f) {
            _0x1a10ad(_0x38f95f);
          }
        },
        _0x5077d0,
        _0x1a10ad,
      ));
  }
  ['setDRACOLoader'](_0x174538) {
    return ((this.dracoLoader = _0x174538), this);
  }
  ['setKTX2Loader'](_0x408ed2) {
    return ((this.ktx2Loader = _0x408ed2), this);
  }
  ['setMeshoptDecoder'](_0x7e4904) {
    return ((this.meshoptDecoder = _0x7e4904), this);
  }
  ['register'](_0x5b4c98) {
    return (this.pluginCallbacks.indexOf(_0x5b4c98) === -1 && this.pluginCallbacks.push(_0x5b4c98), this);
  }
  ['unregister'](_0x31e9dd) {
    return (
      this.pluginCallbacks.indexOf(_0x31e9dd) !== -1 &&
        this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(_0x31e9dd), 1),
      this
    );
  }
  ['parse'](_0x19fdb, _0x5b73a9, _0x201821, _0x2f5415) {
    let _0x540322;
    const _0x177651 = {},
      _0x211e9e = {},
      _0x1c8844 = new TextDecoder();
    if (typeof _0x19fdb === 'string') _0x540322 = JSON.parse(_0x19fdb);
    else {
      if (_0x19fdb instanceof ArrayBuffer) {
        const _0x48cdfd = _0x1c8844.decode(new Uint8Array(_0x19fdb, 0, 4));
        if (_0x48cdfd === BINARY_EXTENSION_HEADER_MAGIC) {
          try {
            _0x177651[EXTENSIONS.KHR_BINARY_GLTF] = new GLTFBinaryExtension(_0x19fdb);
          } catch (_0x5641f5) {
            if (_0x2f5415) _0x2f5415(_0x5641f5);
            return;
          }
          _0x540322 = JSON.parse(_0x177651[EXTENSIONS.KHR_BINARY_GLTF].content);
        } else _0x540322 = JSON.parse(_0x1c8844.decode(_0x19fdb));
      } else _0x540322 = _0x19fdb;
    }
    if (_0x540322.asset === undefined || _0x540322.asset.version[0] < 2) {
      if (_0x2f5415)
        _0x2f5415(new Error('THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported.'));
      return;
    }
    const _0xb3606a = new GLTFParser(_0x540322, {
      path: _0x5b73a9 || this.resourcePath || '',
      crossOrigin: this.crossOrigin,
      requestHeader: this.requestHeader,
      manager: this.manager,
      ktx2Loader: this.ktx2Loader,
      meshoptDecoder: this.meshoptDecoder,
    });
    _0xb3606a.fileLoader.setRequestHeader(this.requestHeader);
    for (let _0x5de284 = 0; _0x5de284 < this.pluginCallbacks.length; _0x5de284++) {
      const _0xa86a44 = this.pluginCallbacks[_0x5de284](_0xb3606a);
      if (!_0xa86a44.name) console.error('THREE.GLTFLoader: Invalid plugin found: missing name');
      ((_0x211e9e[_0xa86a44.name] = _0xa86a44), (_0x177651[_0xa86a44.name] = true));
    }
    if (_0x540322.extensionsUsed)
      for (let _0x3bdde7 = 0; _0x3bdde7 < _0x540322.extensionsUsed.length; ++_0x3bdde7) {
        const _0x29671d = _0x540322.extensionsUsed[_0x3bdde7],
          _0x2bbd1c = _0x540322.extensionsRequired || [];
        switch (_0x29671d) {
          case EXTENSIONS.KHR_MATERIALS_UNLIT:
            _0x177651[_0x29671d] = new GLTFMaterialsUnlitExtension();
            break;
          case EXTENSIONS.KHR_DRACO_MESH_COMPRESSION:
            _0x177651[_0x29671d] = new GLTFDracoMeshCompressionExtension(_0x540322, this.dracoLoader);
            break;
          case EXTENSIONS.KHR_TEXTURE_TRANSFORM:
            _0x177651[_0x29671d] = new GLTFTextureTransformExtension();
            break;
          case EXTENSIONS.KHR_MESH_QUANTIZATION:
            _0x177651[_0x29671d] = new GLTFMeshQuantizationExtension();
            break;
          default:
            _0x2bbd1c.indexOf(_0x29671d) >= 0 &&
              _0x211e9e[_0x29671d] === undefined &&
              console.warn('THREE.GLTFLoader: Unknown extension "' + _0x29671d + '".');
        }
      }
    (_0xb3606a.setExtensions(_0x177651),
      _0xb3606a.setPlugins(_0x211e9e),
      _0xb3606a.parse(_0x201821, _0x2f5415));
  }
  ['parseAsync'](_0xde2225, _0x1e4c1c) {
    const _0x2afe38 = this;
    return new Promise(function (_0x181832, _0x3b3542) {
      _0x2afe38.parse(_0xde2225, _0x1e4c1c, _0x181832, _0x3b3542);
    });
  }
}
function GLTFRegistry() {
  let _0x123a7b = {};
  return {
    get: function (_0x19e0d7) {
      return _0x123a7b[_0x19e0d7];
    },
    add: function (_0x3a8478, _0x41b5cc) {
      _0x123a7b[_0x3a8478] = _0x41b5cc;
    },
    remove: function (_0xb4727c) {
      delete _0x123a7b[_0xb4727c];
    },
    removeAll: function () {
      _0x123a7b = {};
    },
  };
}
const EXTENSIONS = {
  KHR_BINARY_GLTF: 'KHR_binary_glTF',
  KHR_DRACO_MESH_COMPRESSION: 'KHR_draco_mesh_compression',
  KHR_LIGHTS_PUNCTUAL: 'KHR_lights_punctual',
  KHR_MATERIALS_CLEARCOAT: 'KHR_materials_clearcoat',
  KHR_MATERIALS_DISPERSION: 'KHR_materials_dispersion',
  KHR_MATERIALS_IOR: 'KHR_materials_ior',
  KHR_MATERIALS_SHEEN: 'KHR_materials_sheen',
  KHR_MATERIALS_SPECULAR: 'KHR_materials_specular',
  KHR_MATERIALS_TRANSMISSION: 'KHR_materials_transmission',
  KHR_MATERIALS_IRIDESCENCE: 'KHR_materials_iridescence',
  KHR_MATERIALS_ANISOTROPY: 'KHR_materials_anisotropy',
  KHR_MATERIALS_UNLIT: 'KHR_materials_unlit',
  KHR_MATERIALS_VOLUME: 'KHR_materials_volume',
  KHR_TEXTURE_BASISU: 'KHR_texture_basisu',
  KHR_TEXTURE_TRANSFORM: 'KHR_texture_transform',
  KHR_MESH_QUANTIZATION: 'KHR_mesh_quantization',
  KHR_MATERIALS_EMISSIVE_STRENGTH: 'KHR_materials_emissive_strength',
  EXT_MATERIALS_BUMP: 'EXT_materials_bump',
  EXT_TEXTURE_WEBP: 'EXT_texture_webp',
  EXT_TEXTURE_AVIF: 'EXT_texture_avif',
  EXT_MESHOPT_COMPRESSION: 'EXT_meshopt_compression',
  EXT_MESH_GPU_INSTANCING: 'EXT_mesh_gpu_instancing',
};
class GLTFLightsExtension {
  constructor(_0x2bd181) {
    ((this.parser = _0x2bd181),
      (this.name = EXTENSIONS.KHR_LIGHTS_PUNCTUAL),
      (this.cache = { refs: {}, uses: {} }));
  }
  ['_markDefs']() {
    const _0x3bb1fb = this.parser,
      _0x5ccdc2 = this.parser.json.nodes || [];
    for (let _0x59c5e8 = 0, _0x3674ab = _0x5ccdc2.length; _0x59c5e8 < _0x3674ab; _0x59c5e8++) {
      const _0x54f223 = _0x5ccdc2[_0x59c5e8];
      _0x54f223.extensions &&
        _0x54f223.extensions[this.name] &&
        _0x54f223.extensions[this.name].light !== undefined &&
        _0x3bb1fb._addNodeRef(this.cache, _0x54f223.extensions[this.name].light);
    }
  }
  ['_loadLight'](_0x489c37) {
    const _0x394f8a = this.parser,
      _0x1f8c8f = 'light:' + _0x489c37;
    let _0x587445 = _0x394f8a.cache.get(_0x1f8c8f);
    if (_0x587445) return _0x587445;
    const _0x2a9d38 = _0x394f8a.json,
      _0xef8696 = (_0x2a9d38.extensions && _0x2a9d38.extensions[this.name]) || {},
      _0x2df7e8 = _0xef8696.lights || [],
      _0x468d66 = _0x2df7e8[_0x489c37];
    let _0x5c0b08;
    const _0x3a662c = new Color(0xffffff);
    if (_0x468d66.color !== undefined)
      _0x3a662c.setRGB(_0x468d66.color[0], _0x468d66.color[1], _0x468d66.color[2], LinearSRGBColorSpace);
    const _0x1ac9e4 = _0x468d66.range !== undefined ? _0x468d66.range : 0;
    switch (_0x468d66.type) {
      case 'directional':
        ((_0x5c0b08 = new DirectionalLight(_0x3a662c)),
          _0x5c0b08.target.position.set(0, 0, -1),
          _0x5c0b08.add(_0x5c0b08.target));
        break;
      case 'point':
        ((_0x5c0b08 = new PointLight(_0x3a662c)), (_0x5c0b08.distance = _0x1ac9e4));
        break;
      case 'spot':
        ((_0x5c0b08 = new SpotLight(_0x3a662c)),
          (_0x5c0b08.distance = _0x1ac9e4),
          (_0x468d66.spot = _0x468d66.spot || {}),
          (_0x468d66.spot.innerConeAngle =
            _0x468d66.spot.innerConeAngle !== undefined ? _0x468d66.spot.innerConeAngle : 0),
          (_0x468d66.spot.outerConeAngle =
            _0x468d66.spot.outerConeAngle !== undefined ? _0x468d66.spot.outerConeAngle : Math.PI / 4),
          (_0x5c0b08.angle = _0x468d66.spot.outerConeAngle),
          (_0x5c0b08.penumbra = 1 - _0x468d66.spot.innerConeAngle / _0x468d66.spot.outerConeAngle),
          _0x5c0b08.target.position.set(0, 0, -1),
          _0x5c0b08.add(_0x5c0b08.target));
        break;
      default:
        throw new Error('THREE.GLTFLoader: Unexpected light type: ' + _0x468d66.type);
    }
    (_0x5c0b08.position.set(0, 0, 0), assignExtrasToUserData(_0x5c0b08, _0x468d66));
    if (_0x468d66.intensity !== undefined) _0x5c0b08.intensity = _0x468d66.intensity;
    return (
      (_0x5c0b08.name = _0x394f8a.createUniqueName(_0x468d66.name || 'light_' + _0x489c37)),
      (_0x587445 = Promise.resolve(_0x5c0b08)),
      _0x394f8a.cache.add(_0x1f8c8f, _0x587445),
      _0x587445
    );
  }
  ['getDependency'](_0x8a1889, _0x5d56fa) {
    if (_0x8a1889 !== 'light') return;
    return this._loadLight(_0x5d56fa);
  }
  ['createNodeAttachment'](_0x3b3156) {
    const _0x2af752 = this,
      _0x1b2852 = this.parser,
      _0x435572 = _0x1b2852.json,
      _0x48ac62 = _0x435572.nodes[_0x3b3156],
      _0x577f3e = (_0x48ac62.extensions && _0x48ac62.extensions[this.name]) || {},
      _0x5b5829 = _0x577f3e.light;
    if (_0x5b5829 === undefined) return null;
    return this._loadLight(_0x5b5829).then(function (_0x56629c) {
      return _0x1b2852._getNodeRef(_0x2af752.cache, _0x5b5829, _0x56629c);
    });
  }
}
class GLTFMaterialsUnlitExtension {
  constructor() {
    this.name = EXTENSIONS.KHR_MATERIALS_UNLIT;
  }
  ['getMaterialType']() {
    return MeshBasicMaterial;
  }
  ['extendParams'](_0x1fd7cf, _0x3f5267, _0x1b48d5) {
    const _0x35795c = [];
    ((_0x1fd7cf.color = new Color(1, 1, 1)), (_0x1fd7cf.opacity = 1));
    const _0xb2ca9d = _0x3f5267.pbrMetallicRoughness;
    if (_0xb2ca9d) {
      if (Array.isArray(_0xb2ca9d.baseColorFactor)) {
        const _0x50cdea = _0xb2ca9d.baseColorFactor;
        (_0x1fd7cf.color.setRGB(_0x50cdea[0], _0x50cdea[1], _0x50cdea[2], LinearSRGBColorSpace),
          (_0x1fd7cf.opacity = _0x50cdea[3]));
      }
      _0xb2ca9d.baseColorTexture !== undefined &&
        _0x35795c.push(_0x1b48d5.assignTexture(_0x1fd7cf, 'map', _0xb2ca9d.baseColorTexture, SRGBColorSpace));
    }
    return Promise.all(_0x35795c);
  }
}
class GLTFMaterialsEmissiveStrengthExtension {
  constructor(_0x3e81f) {
    ((this.parser = _0x3e81f), (this.name = EXTENSIONS.KHR_MATERIALS_EMISSIVE_STRENGTH));
  }
  ['extendMaterialParams'](_0x2fedae, _0x21e0e8) {
    const _0x137efa = this.parser,
      _0x21a194 = _0x137efa.json.materials[_0x2fedae];
    if (!_0x21a194.extensions || !_0x21a194.extensions[this.name]) return Promise.resolve();
    const _0x5e75e8 = _0x21a194.extensions[this.name].emissiveStrength;
    return (_0x5e75e8 !== undefined && (_0x21e0e8.emissiveIntensity = _0x5e75e8), Promise.resolve());
  }
}
class GLTFMaterialsClearcoatExtension {
  constructor(_0x492bb7) {
    ((this.parser = _0x492bb7), (this.name = EXTENSIONS.KHR_MATERIALS_CLEARCOAT));
  }
  ['getMaterialType'](_0x5aca8d) {
    const _0x272cf5 = this.parser,
      _0x48060f = _0x272cf5.json.materials[_0x5aca8d];
    if (!_0x48060f.extensions || !_0x48060f.extensions[this.name]) return null;
    return MeshPhysicalMaterial;
  }
  ['extendMaterialParams'](_0x56eacc, _0x19b14c) {
    const _0x10383f = this.parser,
      _0x58338d = _0x10383f.json.materials[_0x56eacc];
    if (!_0x58338d.extensions || !_0x58338d.extensions[this.name]) return Promise.resolve();
    const _0x48bfd6 = [],
      _0x5d0db6 = _0x58338d.extensions[this.name];
    _0x5d0db6.clearcoatFactor !== undefined && (_0x19b14c.clearcoat = _0x5d0db6.clearcoatFactor);
    _0x5d0db6.clearcoatTexture !== undefined &&
      _0x48bfd6.push(_0x10383f.assignTexture(_0x19b14c, 'clearcoatMap', _0x5d0db6.clearcoatTexture));
    _0x5d0db6.clearcoatRoughnessFactor !== undefined &&
      (_0x19b14c.clearcoatRoughness = _0x5d0db6.clearcoatRoughnessFactor);
    _0x5d0db6.clearcoatRoughnessTexture !== undefined &&
      _0x48bfd6.push(
        _0x10383f.assignTexture(_0x19b14c, 'clearcoatRoughnessMap', _0x5d0db6.clearcoatRoughnessTexture),
      );
    if (_0x5d0db6.clearcoatNormalTexture !== undefined) {
      _0x48bfd6.push(
        _0x10383f.assignTexture(_0x19b14c, 'clearcoatNormalMap', _0x5d0db6.clearcoatNormalTexture),
      );
      if (_0x5d0db6.clearcoatNormalTexture.scale !== undefined) {
        const _0x57f4d0 = _0x5d0db6.clearcoatNormalTexture.scale;
        _0x19b14c.clearcoatNormalScale = new Vector2(_0x57f4d0, _0x57f4d0);
      }
    }
    return Promise.all(_0x48bfd6);
  }
}
class GLTFMaterialsDispersionExtension {
  constructor(_0x2e278f) {
    ((this.parser = _0x2e278f), (this.name = EXTENSIONS.KHR_MATERIALS_DISPERSION));
  }
  ['getMaterialType'](_0x16aa67) {
    const _0x118986 = this.parser,
      _0x4ee689 = _0x118986.json.materials[_0x16aa67];
    if (!_0x4ee689.extensions || !_0x4ee689.extensions[this.name]) return null;
    return MeshPhysicalMaterial;
  }
  ['extendMaterialParams'](_0x2e8202, _0x38cf39) {
    const _0x3d7097 = this.parser,
      _0x2ddd9e = _0x3d7097.json.materials[_0x2e8202];
    if (!_0x2ddd9e.extensions || !_0x2ddd9e.extensions[this.name]) return Promise.resolve();
    const _0x12dc18 = _0x2ddd9e.extensions[this.name];
    return (
      (_0x38cf39.dispersion = _0x12dc18.dispersion !== undefined ? _0x12dc18.dispersion : 0),
      Promise.resolve()
    );
  }
}
class GLTFMaterialsIridescenceExtension {
  constructor(_0x143b50) {
    ((this.parser = _0x143b50), (this.name = EXTENSIONS.KHR_MATERIALS_IRIDESCENCE));
  }
  ['getMaterialType'](_0x23db9c) {
    const _0x513f9a = this.parser,
      _0x2ff983 = _0x513f9a.json.materials[_0x23db9c];
    if (!_0x2ff983.extensions || !_0x2ff983.extensions[this.name]) return null;
    return MeshPhysicalMaterial;
  }
  ['extendMaterialParams'](_0x3bc2f5, _0x31c6f9) {
    const _0x459c75 = this.parser,
      _0x6db705 = _0x459c75.json.materials[_0x3bc2f5];
    if (!_0x6db705.extensions || !_0x6db705.extensions[this.name]) return Promise.resolve();
    const _0x5caa73 = [],
      _0x235101 = _0x6db705.extensions[this.name];
    return (
      _0x235101.iridescenceFactor !== undefined && (_0x31c6f9.iridescence = _0x235101.iridescenceFactor),
      _0x235101.iridescenceTexture !== undefined &&
        _0x5caa73.push(_0x459c75.assignTexture(_0x31c6f9, 'iridescenceMap', _0x235101.iridescenceTexture)),
      _0x235101.iridescenceIor !== undefined && (_0x31c6f9.iridescenceIOR = _0x235101.iridescenceIor),
      _0x31c6f9.iridescenceThicknessRange === undefined &&
        (_0x31c6f9.iridescenceThicknessRange = [100, 0x190]),
      _0x235101.iridescenceThicknessMinimum !== undefined &&
        (_0x31c6f9.iridescenceThicknessRange[0] = _0x235101.iridescenceThicknessMinimum),
      _0x235101.iridescenceThicknessMaximum !== undefined &&
        (_0x31c6f9.iridescenceThicknessRange[1] = _0x235101.iridescenceThicknessMaximum),
      _0x235101.iridescenceThicknessTexture !== undefined &&
        _0x5caa73.push(
          _0x459c75.assignTexture(
            _0x31c6f9,
            'iridescenceThicknessMap',
            _0x235101.iridescenceThicknessTexture,
          ),
        ),
      Promise.all(_0x5caa73)
    );
  }
}
class GLTFMaterialsSheenExtension {
  constructor(_0x57775c) {
    ((this.parser = _0x57775c), (this.name = EXTENSIONS.KHR_MATERIALS_SHEEN));
  }
  ['getMaterialType'](_0x4739f4) {
    const _0x126e86 = this.parser,
      _0x591370 = _0x126e86.json.materials[_0x4739f4];
    if (!_0x591370.extensions || !_0x591370.extensions[this.name]) return null;
    return MeshPhysicalMaterial;
  }
  ['extendMaterialParams'](_0xf7dd6c, _0xef1584) {
    const _0x89bc = this.parser,
      _0x8f9af3 = _0x89bc.json.materials[_0xf7dd6c];
    if (!_0x8f9af3.extensions || !_0x8f9af3.extensions[this.name]) return Promise.resolve();
    const _0x32320f = [];
    ((_0xef1584.sheenColor = new Color(0, 0, 0)), (_0xef1584.sheenRoughness = 0), (_0xef1584.sheen = 1));
    const _0x1677fa = _0x8f9af3.extensions[this.name];
    if (_0x1677fa.sheenColorFactor !== undefined) {
      const _0x25a87b = _0x1677fa.sheenColorFactor;
      _0xef1584.sheenColor.setRGB(_0x25a87b[0], _0x25a87b[1], _0x25a87b[2], LinearSRGBColorSpace);
    }
    return (
      _0x1677fa.sheenRoughnessFactor !== undefined &&
        (_0xef1584.sheenRoughness = _0x1677fa.sheenRoughnessFactor),
      _0x1677fa.sheenColorTexture !== undefined &&
        _0x32320f.push(
          _0x89bc.assignTexture(_0xef1584, 'sheenColorMap', _0x1677fa.sheenColorTexture, SRGBColorSpace),
        ),
      _0x1677fa.sheenRoughnessTexture !== undefined &&
        _0x32320f.push(
          _0x89bc.assignTexture(_0xef1584, 'sheenRoughnessMap', _0x1677fa.sheenRoughnessTexture),
        ),
      Promise.all(_0x32320f)
    );
  }
}
class GLTFMaterialsTransmissionExtension {
  constructor(_0x972ae2) {
    ((this.parser = _0x972ae2), (this.name = EXTENSIONS.KHR_MATERIALS_TRANSMISSION));
  }
  ['getMaterialType'](_0x35d489) {
    const _0x5b4ba6 = this.parser,
      _0x5a0c7d = _0x5b4ba6.json.materials[_0x35d489];
    if (!_0x5a0c7d.extensions || !_0x5a0c7d.extensions[this.name]) return null;
    return MeshPhysicalMaterial;
  }
  ['extendMaterialParams'](_0x286bba, _0x155ae7) {
    const _0x4f8426 = this.parser,
      _0x4f8ad1 = _0x4f8426.json.materials[_0x286bba];
    if (!_0x4f8ad1.extensions || !_0x4f8ad1.extensions[this.name]) return Promise.resolve();
    const _0x49cee3 = [],
      _0x50f3f3 = _0x4f8ad1.extensions[this.name];
    return (
      _0x50f3f3.transmissionFactor !== undefined && (_0x155ae7.transmission = _0x50f3f3.transmissionFactor),
      _0x50f3f3.transmissionTexture !== undefined &&
        _0x49cee3.push(_0x4f8426.assignTexture(_0x155ae7, 'transmissionMap', _0x50f3f3.transmissionTexture)),
      Promise.all(_0x49cee3)
    );
  }
}
class GLTFMaterialsVolumeExtension {
  constructor(_0x3026a7) {
    ((this.parser = _0x3026a7), (this.name = EXTENSIONS.KHR_MATERIALS_VOLUME));
  }
  ['getMaterialType'](_0x69a5) {
    const _0x4354e1 = this.parser,
      _0x5e0de6 = _0x4354e1.json.materials[_0x69a5];
    if (!_0x5e0de6.extensions || !_0x5e0de6.extensions[this.name]) return null;
    return MeshPhysicalMaterial;
  }
  ['extendMaterialParams'](_0x4fe349, _0x4ce5a8) {
    const _0x4a2d91 = this.parser,
      _0x1ea465 = _0x4a2d91.json.materials[_0x4fe349];
    if (!_0x1ea465.extensions || !_0x1ea465.extensions[this.name]) return Promise.resolve();
    const _0x5170a4 = [],
      _0x3d1d99 = _0x1ea465.extensions[this.name];
    _0x4ce5a8.thickness = _0x3d1d99.thicknessFactor !== undefined ? _0x3d1d99.thicknessFactor : 0;
    _0x3d1d99.thicknessTexture !== undefined &&
      _0x5170a4.push(_0x4a2d91.assignTexture(_0x4ce5a8, 'thicknessMap', _0x3d1d99.thicknessTexture));
    _0x4ce5a8.attenuationDistance = _0x3d1d99.attenuationDistance || Infinity;
    const _0x418d5d = _0x3d1d99.attenuationColor || [1, 1, 1];
    return (
      (_0x4ce5a8.attenuationColor = new Color().setRGB(
        _0x418d5d[0],
        _0x418d5d[1],
        _0x418d5d[2],
        LinearSRGBColorSpace,
      )),
      Promise.all(_0x5170a4)
    );
  }
}
class GLTFMaterialsIorExtension {
  constructor(_0x4b23f2) {
    ((this.parser = _0x4b23f2), (this.name = EXTENSIONS.KHR_MATERIALS_IOR));
  }
  ['getMaterialType'](_0x2a8332) {
    const _0x38fb1e = this.parser,
      _0x81c750 = _0x38fb1e.json.materials[_0x2a8332];
    if (!_0x81c750.extensions || !_0x81c750.extensions[this.name]) return null;
    return MeshPhysicalMaterial;
  }
  ['extendMaterialParams'](_0x24a895, _0x3b9b9d) {
    const _0x3a03d4 = this.parser,
      _0x23914a = _0x3a03d4.json.materials[_0x24a895];
    if (!_0x23914a.extensions || !_0x23914a.extensions[this.name]) return Promise.resolve();
    const _0x170dcf = _0x23914a.extensions[this.name];
    return ((_0x3b9b9d.ior = _0x170dcf.ior !== undefined ? _0x170dcf.ior : 1.5), Promise.resolve());
  }
}
class GLTFMaterialsSpecularExtension {
  constructor(_0x894041) {
    ((this.parser = _0x894041), (this.name = EXTENSIONS.KHR_MATERIALS_SPECULAR));
  }
  ['getMaterialType'](_0x388b11) {
    const _0x539998 = this.parser,
      _0x3732ad = _0x539998.json.materials[_0x388b11];
    if (!_0x3732ad.extensions || !_0x3732ad.extensions[this.name]) return null;
    return MeshPhysicalMaterial;
  }
  ['extendMaterialParams'](_0x42d8a2, _0x5dccb9) {
    const _0x4ceb42 = this.parser,
      _0x5b5105 = _0x4ceb42.json.materials[_0x42d8a2];
    if (!_0x5b5105.extensions || !_0x5b5105.extensions[this.name]) return Promise.resolve();
    const _0x5071dd = [],
      _0x3feaaa = _0x5b5105.extensions[this.name];
    _0x5dccb9.specularIntensity = _0x3feaaa.specularFactor !== undefined ? _0x3feaaa.specularFactor : 1;
    _0x3feaaa.specularTexture !== undefined &&
      _0x5071dd.push(_0x4ceb42.assignTexture(_0x5dccb9, 'specularIntensityMap', _0x3feaaa.specularTexture));
    const _0x4aab06 = _0x3feaaa.specularColorFactor || [1, 1, 1];
    return (
      (_0x5dccb9.specularColor = new Color().setRGB(
        _0x4aab06[0],
        _0x4aab06[1],
        _0x4aab06[2],
        LinearSRGBColorSpace,
      )),
      _0x3feaaa.specularColorTexture !== undefined &&
        _0x5071dd.push(
          _0x4ceb42.assignTexture(
            _0x5dccb9,
            'specularColorMap',
            _0x3feaaa.specularColorTexture,
            SRGBColorSpace,
          ),
        ),
      Promise.all(_0x5071dd)
    );
  }
}
class GLTFMaterialsBumpExtension {
  constructor(_0x309f25) {
    ((this.parser = _0x309f25), (this.name = EXTENSIONS.EXT_MATERIALS_BUMP));
  }
  ['getMaterialType'](_0x2cc2fd) {
    const _0x7adf11 = this.parser,
      _0x2d45d4 = _0x7adf11.json.materials[_0x2cc2fd];
    if (!_0x2d45d4.extensions || !_0x2d45d4.extensions[this.name]) return null;
    return MeshPhysicalMaterial;
  }
  ['extendMaterialParams'](_0x57c9e4, _0xc57850) {
    const _0x1910c8 = this.parser,
      _0x4f8801 = _0x1910c8.json.materials[_0x57c9e4];
    if (!_0x4f8801.extensions || !_0x4f8801.extensions[this.name]) return Promise.resolve();
    const _0x36ba24 = [],
      _0xe94281 = _0x4f8801.extensions[this.name];
    return (
      (_0xc57850.bumpScale = _0xe94281.bumpFactor !== undefined ? _0xe94281.bumpFactor : 1),
      _0xe94281.bumpTexture !== undefined &&
        _0x36ba24.push(_0x1910c8.assignTexture(_0xc57850, 'bumpMap', _0xe94281.bumpTexture)),
      Promise.all(_0x36ba24)
    );
  }
}
class GLTFMaterialsAnisotropyExtension {
  constructor(_0x207264) {
    ((this.parser = _0x207264), (this.name = EXTENSIONS.KHR_MATERIALS_ANISOTROPY));
  }
  ['getMaterialType'](_0x39b49f) {
    const _0x2f7243 = this.parser,
      _0x1a5db9 = _0x2f7243.json.materials[_0x39b49f];
    if (!_0x1a5db9.extensions || !_0x1a5db9.extensions[this.name]) return null;
    return MeshPhysicalMaterial;
  }
  ['extendMaterialParams'](_0x52792d, _0x530a67) {
    const _0x455e8f = this.parser,
      _0x4a930e = _0x455e8f.json.materials[_0x52792d];
    if (!_0x4a930e.extensions || !_0x4a930e.extensions[this.name]) return Promise.resolve();
    const _0x4ac357 = [],
      _0x5dff9d = _0x4a930e.extensions[this.name];
    return (
      _0x5dff9d.anisotropyStrength !== undefined && (_0x530a67.anisotropy = _0x5dff9d.anisotropyStrength),
      _0x5dff9d.anisotropyRotation !== undefined &&
        (_0x530a67.anisotropyRotation = _0x5dff9d.anisotropyRotation),
      _0x5dff9d.anisotropyTexture !== undefined &&
        _0x4ac357.push(_0x455e8f.assignTexture(_0x530a67, 'anisotropyMap', _0x5dff9d.anisotropyTexture)),
      Promise.all(_0x4ac357)
    );
  }
}
class GLTFTextureBasisUExtension {
  constructor(_0x1a3b30) {
    ((this.parser = _0x1a3b30), (this.name = EXTENSIONS.KHR_TEXTURE_BASISU));
  }
  ['loadTexture'](_0x475467) {
    const _0x3b99e6 = this.parser,
      _0x5c0a51 = _0x3b99e6.json,
      _0x2379a3 = _0x5c0a51.textures[_0x475467];
    if (!_0x2379a3.extensions || !_0x2379a3.extensions[this.name]) return null;
    const _0x452a00 = _0x2379a3.extensions[this.name],
      _0x1de351 = _0x3b99e6.options.ktx2Loader;
    if (!_0x1de351) {
      if (_0x5c0a51.extensionsRequired && _0x5c0a51.extensionsRequired.indexOf(this.name) >= 0)
        throw new Error('THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures');
      else return null;
    }
    return _0x3b99e6.loadTextureImage(_0x475467, _0x452a00.source, _0x1de351);
  }
}
class GLTFTextureWebPExtension {
  constructor(_0x30a378) {
    ((this.parser = _0x30a378), (this.name = EXTENSIONS.EXT_TEXTURE_WEBP));
  }
  ['loadTexture'](_0x49d84a) {
    const _0x53d103 = this.name,
      _0x2cc45c = this.parser,
      _0x9ee3b9 = _0x2cc45c.json,
      _0x2081b4 = _0x9ee3b9.textures[_0x49d84a];
    if (!_0x2081b4.extensions || !_0x2081b4.extensions[_0x53d103]) return null;
    const _0x202bbd = _0x2081b4.extensions[_0x53d103],
      _0x95e9bb = _0x9ee3b9.images[_0x202bbd.source];
    let _0x24993e = _0x2cc45c.textureLoader;
    if (_0x95e9bb.uri) {
      const _0x28beb3 = _0x2cc45c.options.manager.getHandler(_0x95e9bb.uri);
      if (_0x28beb3 !== null) _0x24993e = _0x28beb3;
    }
    return _0x2cc45c.loadTextureImage(_0x49d84a, _0x202bbd.source, _0x24993e);
  }
}
class GLTFTextureAVIFExtension {
  constructor(_0x45e58a) {
    ((this.parser = _0x45e58a), (this.name = EXTENSIONS.EXT_TEXTURE_AVIF));
  }
  ['loadTexture'](_0x247e3b) {
    const _0x5596a7 = this.name,
      _0x16fdb4 = this.parser,
      _0x4b2428 = _0x16fdb4.json,
      _0x54da37 = _0x4b2428.textures[_0x247e3b];
    if (!_0x54da37.extensions || !_0x54da37.extensions[_0x5596a7]) return null;
    const _0xc88a0 = _0x54da37.extensions[_0x5596a7],
      _0x3ddda6 = _0x4b2428.images[_0xc88a0.source];
    let _0x1c708e = _0x16fdb4.textureLoader;
    if (_0x3ddda6.uri) {
      const _0xd3c8f2 = _0x16fdb4.options.manager.getHandler(_0x3ddda6.uri);
      if (_0xd3c8f2 !== null) _0x1c708e = _0xd3c8f2;
    }
    return _0x16fdb4.loadTextureImage(_0x247e3b, _0xc88a0.source, _0x1c708e);
  }
}
class GLTFMeshoptCompression {
  constructor(_0x2fffd3) {
    ((this.name = EXTENSIONS.EXT_MESHOPT_COMPRESSION), (this.parser = _0x2fffd3));
  }
  ['loadBufferView'](_0x3423bc) {
    const _0x30f876 = this.parser.json,
      _0x452588 = _0x30f876.bufferViews[_0x3423bc];
    if (_0x452588.extensions && _0x452588.extensions[this.name]) {
      const _0x2870c3 = _0x452588.extensions[this.name],
        _0x48c91d = this.parser.getDependency('buffer', _0x2870c3.buffer),
        _0x95bae7 = this.parser.options.meshoptDecoder;
      if (!_0x95bae7 || !_0x95bae7.supported) {
        if (_0x30f876.extensionsRequired && _0x30f876.extensionsRequired.indexOf(this.name) >= 0)
          throw new Error(
            'THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files',
          );
        else return null;
      }
      return _0x48c91d.then(function (_0x3eb154) {
        const _0xdf1ca7 = _0x2870c3.byteOffset || 0,
          _0x1dcfa5 = _0x2870c3.byteLength || 0,
          _0x94e586 = _0x2870c3.count,
          _0x250b44 = _0x2870c3.byteStride,
          _0x5838a9 = new Uint8Array(_0x3eb154, _0xdf1ca7, _0x1dcfa5);
        return _0x95bae7.decodeGltfBufferAsync
          ? _0x95bae7
              .decodeGltfBufferAsync(_0x94e586, _0x250b44, _0x5838a9, _0x2870c3.mode, _0x2870c3.filter)
              .then(function (_0x4e58d1) {
                return _0x4e58d1.buffer;
              })
          : _0x95bae7.ready.then(function () {
              const _0x5c4302 = new ArrayBuffer(_0x94e586 * _0x250b44);
              return (
                _0x95bae7.decodeGltfBuffer(
                  new Uint8Array(_0x5c4302),
                  _0x94e586,
                  _0x250b44,
                  _0x5838a9,
                  _0x2870c3.mode,
                  _0x2870c3.filter,
                ),
                _0x5c4302
              );
            });
      });
    } else return null;
  }
}
class GLTFMeshGpuInstancing {
  constructor(_0x29bf6c) {
    ((this.name = EXTENSIONS.EXT_MESH_GPU_INSTANCING), (this.parser = _0x29bf6c));
  }
  ['createNodeMesh'](_0x11cf73) {
    const _0x3b37fd = this.parser.json,
      _0x4bf133 = _0x3b37fd.nodes[_0x11cf73];
    if (!_0x4bf133.extensions || !_0x4bf133.extensions[this.name] || _0x4bf133.mesh === undefined)
      return null;
    const _0x1e6454 = _0x3b37fd.meshes[_0x4bf133.mesh];
    for (const _0x315598 of _0x1e6454.primitives) {
      if (
        _0x315598.mode !== WEBGL_CONSTANTS.TRIANGLES &&
        _0x315598.mode !== WEBGL_CONSTANTS.TRIANGLE_STRIP &&
        _0x315598.mode !== WEBGL_CONSTANTS.TRIANGLE_FAN &&
        _0x315598.mode !== undefined
      )
        return null;
    }
    const _0x388a1c = _0x4bf133.extensions[this.name],
      _0xb2e3eb = _0x388a1c.attributes,
      _0x2d8bdd = [],
      _0x351e22 = {};
    for (const _0x5aa597 in _0xb2e3eb) {
      _0x2d8bdd.push(
        this.parser.getDependency('accessor', _0xb2e3eb[_0x5aa597]).then((_0x9fe799) => {
          return ((_0x351e22[_0x5aa597] = _0x9fe799), _0x351e22[_0x5aa597]);
        }),
      );
    }
    if (_0x2d8bdd.length < 1) return null;
    return (
      _0x2d8bdd.push(this.parser.createNodeMesh(_0x11cf73)),
      Promise.all(_0x2d8bdd).then((_0x3719dc) => {
        const _0xbc9292 = _0x3719dc.pop(),
          _0x548b69 = _0xbc9292.isGroup ? _0xbc9292.children : [_0xbc9292],
          _0x4f5b89 = _0x3719dc[0].count,
          _0x27656b = [];
        for (const _0xbd2872 of _0x548b69) {
          const _0x3a4406 = new Matrix4(),
            _0x1b0ea0 = new Vector3(),
            _0x18ea2d = new Quaternion(),
            _0x4cd3de = new Vector3(1, 1, 1),
            _0x144782 = new InstancedMesh(_0xbd2872.geometry, _0xbd2872.material, _0x4f5b89);
          for (let _0x595dd6 = 0; _0x595dd6 < _0x4f5b89; _0x595dd6++) {
            (_0x351e22.TRANSLATION && _0x1b0ea0.fromBufferAttribute(_0x351e22.TRANSLATION, _0x595dd6),
              _0x351e22.ROTATION && _0x18ea2d.fromBufferAttribute(_0x351e22.ROTATION, _0x595dd6),
              _0x351e22.SCALE && _0x4cd3de.fromBufferAttribute(_0x351e22.SCALE, _0x595dd6),
              _0x144782.setMatrixAt(_0x595dd6, _0x3a4406.compose(_0x1b0ea0, _0x18ea2d, _0x4cd3de)));
          }
          for (const _0x108acc in _0x351e22) {
            if (_0x108acc === '_COLOR_0') {
              const _0x4f2031 = _0x351e22[_0x108acc];
              _0x144782.instanceColor = new InstancedBufferAttribute(
                _0x4f2031.array,
                _0x4f2031.itemSize,
                _0x4f2031.normalized,
              );
            } else
              _0x108acc !== 'TRANSLATION' &&
                _0x108acc !== 'ROTATION' &&
                _0x108acc !== 'SCALE' &&
                _0xbd2872.geometry.setAttribute(_0x108acc, _0x351e22[_0x108acc]);
          }
          (Object3D.prototype.copy.call(_0x144782, _0xbd2872),
            this.parser.assignFinalMaterial(_0x144782),
            _0x27656b.push(_0x144782));
        }
        if (_0xbc9292.isGroup) return (_0xbc9292.clear(), _0xbc9292.add(..._0x27656b), _0xbc9292);
        return _0x27656b[0];
      })
    );
  }
}
const BINARY_EXTENSION_HEADER_MAGIC = 'glTF',
  BINARY_EXTENSION_HEADER_LENGTH = 12,
  BINARY_EXTENSION_CHUNK_TYPES = { JSON: 0x4e4f534a, BIN: 0x4e4942 };
class GLTFBinaryExtension {
  constructor(_0xe67d44) {
    ((this.name = EXTENSIONS.KHR_BINARY_GLTF), (this.content = null), (this.body = null));
    const _0x189a8c = new DataView(_0xe67d44, 0, BINARY_EXTENSION_HEADER_LENGTH),
      _0x5ead7f = new TextDecoder();
    this.header = {
      magic: _0x5ead7f.decode(new Uint8Array(_0xe67d44.slice(0, 4))),
      version: _0x189a8c.getUint32(4, true),
      length: _0x189a8c.getUint32(8, true),
    };
    if (this.header.magic !== BINARY_EXTENSION_HEADER_MAGIC)
      throw new Error('THREE.GLTFLoader: Unsupported glTF-Binary header.');
    else {
      if (this.header.version < 2) throw new Error('THREE.GLTFLoader: Legacy binary file detected.');
    }
    const _0x2888c2 = this.header.length - BINARY_EXTENSION_HEADER_LENGTH,
      _0x4d50cc = new DataView(_0xe67d44, BINARY_EXTENSION_HEADER_LENGTH);
    let _0x809ad4 = 0;
    while (_0x809ad4 < _0x2888c2) {
      const _0xb0a950 = _0x4d50cc.getUint32(_0x809ad4, true);
      _0x809ad4 += 4;
      const _0xcc655 = _0x4d50cc.getUint32(_0x809ad4, true);
      _0x809ad4 += 4;
      if (_0xcc655 === BINARY_EXTENSION_CHUNK_TYPES.JSON) {
        const _0x5898ac = new Uint8Array(_0xe67d44, BINARY_EXTENSION_HEADER_LENGTH + _0x809ad4, _0xb0a950);
        this.content = _0x5ead7f.decode(_0x5898ac);
      } else {
        if (_0xcc655 === BINARY_EXTENSION_CHUNK_TYPES.BIN) {
          const _0x68383 = BINARY_EXTENSION_HEADER_LENGTH + _0x809ad4;
          this.body = _0xe67d44.slice(_0x68383, _0x68383 + _0xb0a950);
        }
      }
      _0x809ad4 += _0xb0a950;
    }
    if (this.content === null) throw new Error('THREE.GLTFLoader: JSON content not found.');
  }
}
class GLTFDracoMeshCompressionExtension {
  constructor(_0x5c9b3d, _0x341f7e) {
    if (!_0x341f7e) throw new Error('THREE.GLTFLoader: No DRACOLoader instance provided.');
    ((this.name = EXTENSIONS.KHR_DRACO_MESH_COMPRESSION),
      (this.json = _0x5c9b3d),
      (this.dracoLoader = _0x341f7e),
      this.dracoLoader.preload());
  }
  ['decodePrimitive'](_0x431f1c, _0x3ff8b9) {
    const _0x2a51f0 = this.json,
      _0xf2235d = this.dracoLoader,
      _0x584d1b = _0x431f1c.extensions[this.name].bufferView,
      _0x80dc39 = _0x431f1c.extensions[this.name].attributes,
      _0x13a2e6 = {},
      _0x113b5d = {},
      _0x106752 = {};
    for (const _0x34201c in _0x80dc39) {
      const _0x2992e3 = ATTRIBUTES[_0x34201c] || _0x34201c.toLowerCase();
      _0x13a2e6[_0x2992e3] = _0x80dc39[_0x34201c];
    }
    for (const _0x3d022b in _0x431f1c.attributes) {
      const _0x22894a = ATTRIBUTES[_0x3d022b] || _0x3d022b.toLowerCase();
      if (_0x80dc39[_0x3d022b] !== undefined) {
        const _0xcb192f = _0x2a51f0.accessors[_0x431f1c.attributes[_0x3d022b]],
          _0x3a4de7 = WEBGL_COMPONENT_TYPES[_0xcb192f.componentType];
        ((_0x106752[_0x22894a] = _0x3a4de7.name), (_0x113b5d[_0x22894a] = _0xcb192f.normalized === true));
      }
    }
    return _0x3ff8b9.getDependency('bufferView', _0x584d1b).then(function (_0x3023cd) {
      return new Promise(function (_0x25ed8b, _0x523bee) {
        _0xf2235d.decodeDracoFile(
          _0x3023cd,
          function (_0x515f1c) {
            for (const _0x32a0ad in _0x515f1c.attributes) {
              const _0x36a7a1 = _0x515f1c.attributes[_0x32a0ad],
                _0x390058 = _0x113b5d[_0x32a0ad];
              if (_0x390058 !== undefined) _0x36a7a1.normalized = _0x390058;
            }
            _0x25ed8b(_0x515f1c);
          },
          _0x13a2e6,
          _0x106752,
          LinearSRGBColorSpace,
          _0x523bee,
        );
      });
    });
  }
}
class GLTFTextureTransformExtension {
  constructor() {
    this.name = EXTENSIONS.KHR_TEXTURE_TRANSFORM;
  }
  ['extendTexture'](_0x2d93d8, _0x8c8aa7) {
    if (
      (_0x8c8aa7.texCoord === undefined || _0x8c8aa7.texCoord === _0x2d93d8.channel) &&
      _0x8c8aa7.offset === undefined &&
      _0x8c8aa7.rotation === undefined &&
      _0x8c8aa7.scale === undefined
    )
      return _0x2d93d8;
    return (
      (_0x2d93d8 = _0x2d93d8.clone()),
      _0x8c8aa7.texCoord !== undefined && (_0x2d93d8.channel = _0x8c8aa7.texCoord),
      _0x8c8aa7.offset !== undefined && _0x2d93d8.offset.fromArray(_0x8c8aa7.offset),
      _0x8c8aa7.rotation !== undefined && (_0x2d93d8.rotation = _0x8c8aa7.rotation),
      _0x8c8aa7.scale !== undefined && _0x2d93d8.repeat.fromArray(_0x8c8aa7.scale),
      (_0x2d93d8.needsUpdate = true),
      _0x2d93d8
    );
  }
}
class GLTFMeshQuantizationExtension {
  constructor() {
    this.name = EXTENSIONS.KHR_MESH_QUANTIZATION;
  }
}
class GLTFCubicSplineInterpolant extends Interpolant {
  constructor(_0x2e6961, _0x45b8a4, _0x463c88, _0x2d29d5) {
    super(_0x2e6961, _0x45b8a4, _0x463c88, _0x2d29d5);
  }
  ['copySampleValue_'](_0x52ebdd) {
    const _0xe69267 = this.resultBuffer,
      _0x102332 = this.sampleValues,
      _0x2d11b3 = this.valueSize,
      _0x1b4d72 = _0x52ebdd * _0x2d11b3 * 3 + _0x2d11b3;
    for (let _0x309e0b = 0; _0x309e0b !== _0x2d11b3; _0x309e0b++) {
      _0xe69267[_0x309e0b] = _0x102332[_0x1b4d72 + _0x309e0b];
    }
    return _0xe69267;
  }
  ['interpolate_'](_0x1bbba4, _0x284f3b, _0x433c63, _0xb4b009) {
    const _0x14c409 = this.resultBuffer,
      _0x505e2d = this.sampleValues,
      _0x1d24da = this.valueSize,
      _0x1c1309 = _0x1d24da * 2,
      _0x26cfee = _0x1d24da * 3,
      _0x113c22 = _0xb4b009 - _0x284f3b,
      _0x34d59e = (_0x433c63 - _0x284f3b) / _0x113c22,
      _0x5a013b = _0x34d59e * _0x34d59e,
      _0x4ce94b = _0x5a013b * _0x34d59e,
      _0x1a97d9 = _0x1bbba4 * _0x26cfee,
      _0x19bc97 = _0x1a97d9 - _0x26cfee,
      _0x10924f = -2 * _0x4ce94b + 3 * _0x5a013b,
      _0x489327 = _0x4ce94b - _0x5a013b,
      _0x56658f = 1 - _0x10924f,
      _0x1725f0 = _0x489327 - _0x5a013b + _0x34d59e;
    for (let _0x46dbab = 0; _0x46dbab !== _0x1d24da; _0x46dbab++) {
      const _0x1b5469 = _0x505e2d[_0x19bc97 + _0x46dbab + _0x1d24da],
        _0x18399d = _0x505e2d[_0x19bc97 + _0x46dbab + _0x1c1309] * _0x113c22,
        _0x392139 = _0x505e2d[_0x1a97d9 + _0x46dbab + _0x1d24da],
        _0x55b5a7 = _0x505e2d[_0x1a97d9 + _0x46dbab] * _0x113c22;
      _0x14c409[_0x46dbab] =
        _0x56658f * _0x1b5469 + _0x1725f0 * _0x18399d + _0x10924f * _0x392139 + _0x489327 * _0x55b5a7;
    }
    return _0x14c409;
  }
}
const _quaternion = new Quaternion();
class GLTFCubicSplineQuaternionInterpolant extends GLTFCubicSplineInterpolant {
  ['interpolate_'](_0x5d5b01, _0x197e2d, _0x1249ab, _0x4a0410) {
    const _0x36c66b = super.interpolate_(_0x5d5b01, _0x197e2d, _0x1249ab, _0x4a0410);
    return (_quaternion.fromArray(_0x36c66b).normalize().toArray(_0x36c66b), _0x36c66b);
  }
}
const WEBGL_CONSTANTS = {
    FLOAT: 0x1406,
    FLOAT_MAT3: 0x8b5b,
    FLOAT_MAT4: 0x8b5c,
    FLOAT_VEC2: 0x8b50,
    FLOAT_VEC3: 0x8b51,
    FLOAT_VEC4: 0x8b52,
    LINEAR: 0x2601,
    REPEAT: 0x2901,
    SAMPLER_2D: 0x8b5e,
    POINTS: 0,
    LINES: 1,
    LINE_LOOP: 2,
    LINE_STRIP: 3,
    TRIANGLES: 4,
    TRIANGLE_STRIP: 5,
    TRIANGLE_FAN: 6,
    UNSIGNED_BYTE: 0x1401,
    UNSIGNED_SHORT: 0x1403,
  },
  WEBGL_COMPONENT_TYPES = {
    0x1400: Int8Array,
    0x1401: Uint8Array,
    0x1402: Int16Array,
    0x1403: Uint16Array,
    0x1405: Uint32Array,
    0x1406: Float32Array,
  },
  WEBGL_FILTERS = {
    0x2600: NearestFilter,
    0x2601: LinearFilter,
    0x2700: NearestMipmapNearestFilter,
    0x2701: LinearMipmapNearestFilter,
    0x2702: NearestMipmapLinearFilter,
    0x2703: LinearMipmapLinearFilter,
  },
  WEBGL_WRAPPINGS = { 0x812f: ClampToEdgeWrapping, 0x8370: MirroredRepeatWrapping, 0x2901: RepeatWrapping },
  WEBGL_TYPE_SIZES = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 },
  ATTRIBUTES = {
    POSITION: 'position',
    NORMAL: 'normal',
    TANGENT: 'tangent',
    TEXCOORD_0: 'uv',
    TEXCOORD_1: 'uv1',
    TEXCOORD_2: 'uv2',
    TEXCOORD_3: 'uv3',
    COLOR_0: 'color',
    WEIGHTS_0: 'skinWeight',
    JOINTS_0: 'skinIndex',
  },
  PATH_PROPERTIES = {
    scale: 'scale',
    translation: 'position',
    rotation: 'quaternion',
    weights: 'morphTargetInfluences',
  },
  INTERPOLATION = { CUBICSPLINE: undefined, LINEAR: InterpolateLinear, STEP: InterpolateDiscrete },
  ALPHA_MODES = { OPAQUE: 'OPAQUE', MASK: 'MASK', BLEND: 'BLEND' };
function createDefaultMaterial(_0x178cff) {
  return (
    _0x178cff.DefaultMaterial === undefined &&
      (_0x178cff.DefaultMaterial = new MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0,
        metalness: 1,
        roughness: 1,
        transparent: false,
        depthTest: true,
        side: FrontSide,
      })),
    _0x178cff.DefaultMaterial
  );
}
function addUnknownExtensionsToUserData(_0x487d09, _0x3eb08c, _0x46e435) {
  for (const _0x2ea137 in _0x46e435.extensions) {
    _0x487d09[_0x2ea137] === undefined &&
      ((_0x3eb08c.userData.gltfExtensions = _0x3eb08c.userData.gltfExtensions || {}),
      (_0x3eb08c.userData.gltfExtensions[_0x2ea137] = _0x46e435.extensions[_0x2ea137]));
  }
}
function assignExtrasToUserData(_0x5c4476, _0x186957) {
  _0x186957.extras !== undefined &&
    (typeof _0x186957.extras === 'object'
      ? Object.assign(_0x5c4476.userData, _0x186957.extras)
      : console.warn('THREE.GLTFLoader: Ignoring primitive type .extras, ' + _0x186957.extras));
}
function addMorphTargets(_0x3aae67, _0x4a3aa7, _0xb4fe7) {
  let _0x1b54c7 = false,
    _0x57fed5 = false,
    _0x3c25f9 = false;
  for (let _0x40372a = 0, _0x59c3ab = _0x4a3aa7.length; _0x40372a < _0x59c3ab; _0x40372a++) {
    const _0x32b717 = _0x4a3aa7[_0x40372a];
    if (_0x32b717.POSITION !== undefined) _0x1b54c7 = true;
    if (_0x32b717.NORMAL !== undefined) _0x57fed5 = true;
    if (_0x32b717.COLOR_0 !== undefined) _0x3c25f9 = true;
    if (_0x1b54c7 && _0x57fed5 && _0x3c25f9) break;
  }
  if (!_0x1b54c7 && !_0x57fed5 && !_0x3c25f9) return Promise.resolve(_0x3aae67);
  const _0x33391c = [],
    _0x1bb273 = [],
    _0x221151 = [];
  for (let _0x3078c7 = 0, _0x258410 = _0x4a3aa7.length; _0x3078c7 < _0x258410; _0x3078c7++) {
    const _0x3202ed = _0x4a3aa7[_0x3078c7];
    if (_0x1b54c7) {
      const _0x303e9d =
        _0x3202ed.POSITION !== undefined
          ? _0xb4fe7.getDependency('accessor', _0x3202ed.POSITION)
          : _0x3aae67.attributes.position;
      _0x33391c.push(_0x303e9d);
    }
    if (_0x57fed5) {
      const _0xfc4999 =
        _0x3202ed.NORMAL !== undefined
          ? _0xb4fe7.getDependency('accessor', _0x3202ed.NORMAL)
          : _0x3aae67.attributes.normal;
      _0x1bb273.push(_0xfc4999);
    }
    if (_0x3c25f9) {
      const _0x343da4 =
        _0x3202ed.COLOR_0 !== undefined
          ? _0xb4fe7.getDependency('accessor', _0x3202ed.COLOR_0)
          : _0x3aae67.attributes.color;
      _0x221151.push(_0x343da4);
    }
  }
  return Promise.all([Promise.all(_0x33391c), Promise.all(_0x1bb273), Promise.all(_0x221151)]).then(
    function (_0x9347b) {
      const _0x47bc7d = _0x9347b[0],
        _0xd4907e = _0x9347b[1],
        _0x3a1065 = _0x9347b[2];
      if (_0x1b54c7) _0x3aae67.morphAttributes.position = _0x47bc7d;
      if (_0x57fed5) _0x3aae67.morphAttributes.normal = _0xd4907e;
      if (_0x3c25f9) _0x3aae67.morphAttributes.color = _0x3a1065;
      return ((_0x3aae67.morphTargetsRelative = true), _0x3aae67);
    },
  );
}
function updateMorphTargets(_0x54dec5, _0x282e5c) {
  _0x54dec5.updateMorphTargets();
  if (_0x282e5c.weights !== undefined)
    for (let _0x379193 = 0, _0x533147 = _0x282e5c.weights.length; _0x379193 < _0x533147; _0x379193++) {
      _0x54dec5.morphTargetInfluences[_0x379193] = _0x282e5c.weights[_0x379193];
    }
  if (_0x282e5c.extras && Array.isArray(_0x282e5c.extras.targetNames)) {
    const _0x5ac369 = _0x282e5c.extras.targetNames;
    if (_0x54dec5.morphTargetInfluences.length === _0x5ac369.length) {
      _0x54dec5.morphTargetDictionary = {};
      for (let _0x221eb5 = 0, _0x38db57 = _0x5ac369.length; _0x221eb5 < _0x38db57; _0x221eb5++) {
        _0x54dec5.morphTargetDictionary[_0x5ac369[_0x221eb5]] = _0x221eb5;
      }
    } else console.warn('THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.');
  }
}
function createPrimitiveKey(_0x486197) {
  let _0x22acde;
  const _0x5485cf = _0x486197.extensions && _0x486197.extensions[EXTENSIONS.KHR_DRACO_MESH_COMPRESSION];
  _0x5485cf
    ? (_0x22acde =
        'draco:' +
        _0x5485cf.bufferView +
        ':' +
        _0x5485cf.indices +
        ':' +
        createAttributesKey(_0x5485cf.attributes))
    : (_0x22acde =
        _0x486197.indices + ':' + createAttributesKey(_0x486197.attributes) + ':' + _0x486197.mode);
  if (_0x486197.targets !== undefined)
    for (let _0x445e78 = 0, _0x2af463 = _0x486197.targets.length; _0x445e78 < _0x2af463; _0x445e78++) {
      _0x22acde += ':' + createAttributesKey(_0x486197.targets[_0x445e78]);
    }
  return _0x22acde;
}
function createAttributesKey(_0x52bb95) {
  let _0xf30752 = '';
  const _0x9bb7c9 = Object.keys(_0x52bb95).sort();
  for (let _0x2b5d90 = 0, _0x309842 = _0x9bb7c9.length; _0x2b5d90 < _0x309842; _0x2b5d90++) {
    _0xf30752 += _0x9bb7c9[_0x2b5d90] + ':' + _0x52bb95[_0x9bb7c9[_0x2b5d90]] + ';';
  }
  return _0xf30752;
}
function getNormalizedComponentScale(_0x39975a) {
  switch (_0x39975a) {
    case Int8Array:
      return 1 / 127;
    case Uint8Array:
      return 1 / 255;
    case Int16Array:
      return 1 / 0x7fff;
    case Uint16Array:
      return 1 / 0xffff;
    default:
      throw new Error('THREE.GLTFLoader: Unsupported normalized accessor component type.');
  }
}
function getImageURIMimeType(_0x528ef9) {
  if (_0x528ef9.search(/\.jpe?g($|\?)/i) > 0 || _0x528ef9.search(/^data\:image\/jpeg/) === 0)
    return 'image/jpeg';
  if (_0x528ef9.search(/\.webp($|\?)/i) > 0 || _0x528ef9.search(/^data\:image\/webp/) === 0)
    return 'image/webp';
  if (_0x528ef9.search(/\.ktx2($|\?)/i) > 0 || _0x528ef9.search(/^data\:image\/ktx2/) === 0)
    return 'image/ktx2';
  return 'image/png';
}
const _identityMatrix = new Matrix4();
class GLTFParser {
  constructor(_0x265551 = {}, _0x11bc54 = {}) {
    ((this.json = _0x265551),
      (this.extensions = {}),
      (this.plugins = {}),
      (this.options = _0x11bc54),
      (this.cache = new GLTFRegistry()),
      (this.associations = new Map()),
      (this.primitiveCache = {}),
      (this.nodeCache = {}),
      (this.meshCache = { refs: {}, uses: {} }),
      (this.cameraCache = { refs: {}, uses: {} }),
      (this.lightCache = { refs: {}, uses: {} }),
      (this.sourceCache = {}),
      (this.textureCache = {}),
      (this.nodeNamesUsed = {}));
    let _0x2c4c45 = false,
      _0x3f6af9 = -1,
      _0x29c3ab = false,
      _0x4f6825 = -1;
    if (typeof navigator !== 'undefined') {
      const _0xfdef86 = navigator.userAgent;
      _0x2c4c45 = /^((?!chrome|android).)*safari/i.test(_0xfdef86) === true;
      const _0x3f7c56 = _0xfdef86.match(/Version\/(\d+)/);
      ((_0x3f6af9 = _0x2c4c45 && _0x3f7c56 ? parseInt(_0x3f7c56[1], 10) : -1),
        (_0x29c3ab = _0xfdef86.indexOf('Firefox') > -1),
        (_0x4f6825 = _0x29c3ab ? _0xfdef86.match(/Firefox\/([0-9]+)\./)[1] : -1));
    }
    (typeof createImageBitmap === 'undefined' ||
    (_0x2c4c45 && _0x3f6af9 < 17) ||
    (_0x29c3ab && _0x4f6825 < 98)
      ? (this.textureLoader = new TextureLoader(this.options.manager))
      : (this.textureLoader = new ImageBitmapLoader(this.options.manager)),
      this.textureLoader.setCrossOrigin(this.options.crossOrigin),
      this.textureLoader.setRequestHeader(this.options.requestHeader),
      (this.fileLoader = new FileLoader(this.options.manager)),
      this.fileLoader.setResponseType('arraybuffer'),
      this.options.crossOrigin === 'use-credentials' && this.fileLoader.setWithCredentials(true));
  }
  ['setExtensions'](_0x38acb8) {
    this.extensions = _0x38acb8;
  }
  ['setPlugins'](_0x263474) {
    this.plugins = _0x263474;
  }
  ['parse'](_0x267967, _0x336a49) {
    const _0x45c132 = this,
      _0x1ee763 = this.json,
      _0x5d7f4c = this.extensions;
    (this.cache.removeAll(),
      (this.nodeCache = {}),
      this._invokeAll(function (_0x334b26) {
        return _0x334b26._markDefs && _0x334b26._markDefs();
      }),
      Promise.all(
        this._invokeAll(function (_0x4263f5) {
          return _0x4263f5.beforeRoot && _0x4263f5.beforeRoot();
        }),
      )
        .then(function () {
          return Promise.all([
            _0x45c132.getDependencies('scene'),
            _0x45c132.getDependencies('animation'),
            _0x45c132.getDependencies('camera'),
          ]);
        })
        .then(function (_0x1255d) {
          const _0x5e033d = {
            scene: _0x1255d[0][_0x1ee763.scene || 0],
            scenes: _0x1255d[0],
            animations: _0x1255d[1],
            cameras: _0x1255d[2],
            asset: _0x1ee763.asset,
            parser: _0x45c132,
            userData: {},
          };
          return (
            addUnknownExtensionsToUserData(_0x5d7f4c, _0x5e033d, _0x1ee763),
            assignExtrasToUserData(_0x5e033d, _0x1ee763),
            Promise.all(
              _0x45c132._invokeAll(function (_0x391095) {
                return _0x391095.afterRoot && _0x391095.afterRoot(_0x5e033d);
              }),
            ).then(function () {
              for (const _0x3bfb25 of _0x5e033d.scenes) {
                _0x3bfb25.updateMatrixWorld();
              }
              _0x267967(_0x5e033d);
            })
          );
        })
        .catch(_0x336a49));
  }
  ['_markDefs']() {
    const _0x4761e4 = this.json.nodes || [],
      _0x29bcdf = this.json.skins || [],
      _0x1d8c95 = this.json.meshes || [];
    for (let _0x3cb466 = 0, _0x116ceb = _0x29bcdf.length; _0x3cb466 < _0x116ceb; _0x3cb466++) {
      const _0x54de63 = _0x29bcdf[_0x3cb466].joints;
      for (let _0x3ac39d = 0, _0x586436 = _0x54de63.length; _0x3ac39d < _0x586436; _0x3ac39d++) {
        _0x4761e4[_0x54de63[_0x3ac39d]].isBone = true;
      }
    }
    for (let _0x3a6e7c = 0, _0x4e75b5 = _0x4761e4.length; _0x3a6e7c < _0x4e75b5; _0x3a6e7c++) {
      const _0x370f6d = _0x4761e4[_0x3a6e7c];
      (_0x370f6d.mesh !== undefined &&
        (this._addNodeRef(this.meshCache, _0x370f6d.mesh),
        _0x370f6d.skin !== undefined && (_0x1d8c95[_0x370f6d.mesh].isSkinnedMesh = true)),
        _0x370f6d.camera !== undefined && this._addNodeRef(this.cameraCache, _0x370f6d.camera));
    }
  }
  ['_addNodeRef'](_0x54b23c, _0x3dd203) {
    if (_0x3dd203 === undefined) return;
    (_0x54b23c.refs[_0x3dd203] === undefined && (_0x54b23c.refs[_0x3dd203] = _0x54b23c.uses[_0x3dd203] = 0),
      _0x54b23c.refs[_0x3dd203]++);
  }
  ['_getNodeRef'](_0x3e94ea, _0xfa8713, _0x47bcb4) {
    if (_0x3e94ea.refs[_0xfa8713] <= 1) return _0x47bcb4;
    const _0x8393f8 = _0x47bcb4.clone(),
      _0x2f7916 = (_0x2c4409, _0x147b56) => {
        const _0x4500de = this.associations.get(_0x2c4409);
        _0x4500de != null && this.associations.set(_0x147b56, _0x4500de);
        for (const [_0x207a4d, _0x50e481] of _0x2c4409.children.entries()) {
          _0x2f7916(_0x50e481, _0x147b56.children[_0x207a4d]);
        }
      };
    return (
      _0x2f7916(_0x47bcb4, _0x8393f8),
      (_0x8393f8.name += '_instance_' + _0x3e94ea.uses[_0xfa8713]++),
      _0x8393f8
    );
  }
  ['_invokeOne'](_0x13c865) {
    const _0x30d35e = Object.values(this.plugins);
    _0x30d35e.push(this);
    for (let _0x6b695d = 0; _0x6b695d < _0x30d35e.length; _0x6b695d++) {
      const _0x1782db = _0x13c865(_0x30d35e[_0x6b695d]);
      if (_0x1782db) return _0x1782db;
    }
    return null;
  }
  ['_invokeAll'](_0x260e9c) {
    const _0x4effce = Object.values(this.plugins);
    _0x4effce.unshift(this);
    const _0x193e2c = [];
    for (let _0x171145 = 0; _0x171145 < _0x4effce.length; _0x171145++) {
      const _0x36070e = _0x260e9c(_0x4effce[_0x171145]);
      if (_0x36070e) _0x193e2c.push(_0x36070e);
    }
    return _0x193e2c;
  }
  ['getDependency'](_0x2da441, _0x4e3580) {
    const _0x105c20 = _0x2da441 + ':' + _0x4e3580;
    let _0x122a79 = this.cache.get(_0x105c20);
    if (!_0x122a79) {
      switch (_0x2da441) {
        case 'scene':
          _0x122a79 = this.loadScene(_0x4e3580);
          break;
        case 'node':
          _0x122a79 = this._invokeOne(function (_0x42df0e) {
            return _0x42df0e.loadNode && _0x42df0e.loadNode(_0x4e3580);
          });
          break;
        case 'mesh':
          _0x122a79 = this._invokeOne(function (_0x53b97c) {
            return _0x53b97c.loadMesh && _0x53b97c.loadMesh(_0x4e3580);
          });
          break;
        case 'accessor':
          _0x122a79 = this.loadAccessor(_0x4e3580);
          break;
        case 'bufferView':
          _0x122a79 = this._invokeOne(function (_0x1828fa) {
            return _0x1828fa.loadBufferView && _0x1828fa.loadBufferView(_0x4e3580);
          });
          break;
        case 'buffer':
          _0x122a79 = this.loadBuffer(_0x4e3580);
          break;
        case 'material':
          _0x122a79 = this._invokeOne(function (_0x2f5062) {
            return _0x2f5062.loadMaterial && _0x2f5062.loadMaterial(_0x4e3580);
          });
          break;
        case 'texture':
          _0x122a79 = this._invokeOne(function (_0x28eb49) {
            return _0x28eb49.loadTexture && _0x28eb49.loadTexture(_0x4e3580);
          });
          break;
        case 'skin':
          _0x122a79 = this.loadSkin(_0x4e3580);
          break;
        case 'animation':
          _0x122a79 = this._invokeOne(function (_0x2c0aa3) {
            return _0x2c0aa3.loadAnimation && _0x2c0aa3.loadAnimation(_0x4e3580);
          });
          break;
        case 'camera':
          _0x122a79 = this.loadCamera(_0x4e3580);
          break;
        default:
          _0x122a79 = this._invokeOne(function (_0x3ffd71) {
            return (
              _0x3ffd71 != this && _0x3ffd71.getDependency && _0x3ffd71.getDependency(_0x2da441, _0x4e3580)
            );
          });
          if (!_0x122a79) throw new Error('Unknown type: ' + _0x2da441);
          break;
      }
      this.cache.add(_0x105c20, _0x122a79);
    }
    return _0x122a79;
  }
  ['getDependencies'](_0x3bbc1c) {
    let _0x2735b8 = this.cache.get(_0x3bbc1c);
    if (!_0x2735b8) {
      const _0x49c3cf = this,
        _0x2324ec = this.json[_0x3bbc1c + (_0x3bbc1c === 'mesh' ? 'es' : 's')] || [];
      ((_0x2735b8 = Promise.all(
        _0x2324ec.map(function (_0x2ce956, _0x5e972f) {
          return _0x49c3cf.getDependency(_0x3bbc1c, _0x5e972f);
        }),
      )),
        this.cache.add(_0x3bbc1c, _0x2735b8));
    }
    return _0x2735b8;
  }
  ['loadBuffer'](_0x234025) {
    const _0x27b046 = this.json.buffers[_0x234025],
      _0x3f5519 = this.fileLoader;
    if (_0x27b046.type && _0x27b046.type !== 'arraybuffer')
      throw new Error('THREE.GLTFLoader: ' + _0x27b046.type + ' buffer type is not supported.');
    if (_0x27b046.uri === undefined && _0x234025 === 0)
      return Promise.resolve(this.extensions[EXTENSIONS.KHR_BINARY_GLTF].body);
    const _0x11b3ec = this.options;
    return new Promise(function (_0x589fad, _0x4c6d50) {
      _0x3f5519.load(
        LoaderUtils.resolveURL(_0x27b046.uri, _0x11b3ec.path),
        _0x589fad,
        undefined,
        function () {
          _0x4c6d50(new Error('THREE.GLTFLoader: Failed to load buffer "' + _0x27b046.uri + '".'));
        },
      );
    });
  }
  ['loadBufferView'](_0x198781) {
    const _0x55e1f6 = this.json.bufferViews[_0x198781];
    return this.getDependency('buffer', _0x55e1f6.buffer).then(function (_0x2bb4a4) {
      const _0x144968 = _0x55e1f6.byteLength || 0,
        _0x523223 = _0x55e1f6.byteOffset || 0;
      return _0x2bb4a4.slice(_0x523223, _0x523223 + _0x144968);
    });
  }
  ['loadAccessor'](_0x437142) {
    const _0xb312f3 = this,
      _0x4fc8d8 = this.json,
      _0x3b4a20 = this.json.accessors[_0x437142];
    if (_0x3b4a20.bufferView === undefined && _0x3b4a20.sparse === undefined) {
      const _0x52ba82 = WEBGL_TYPE_SIZES[_0x3b4a20.type],
        _0x53215c = WEBGL_COMPONENT_TYPES[_0x3b4a20.componentType],
        _0x352fb7 = _0x3b4a20.normalized === true,
        _0x4656af = new _0x53215c(_0x3b4a20.count * _0x52ba82);
      return Promise.resolve(new BufferAttribute(_0x4656af, _0x52ba82, _0x352fb7));
    }
    const _0xc9bdd7 = [];
    return (
      _0x3b4a20.bufferView !== undefined
        ? _0xc9bdd7.push(this.getDependency('bufferView', _0x3b4a20.bufferView))
        : _0xc9bdd7.push(null),
      _0x3b4a20.sparse !== undefined &&
        (_0xc9bdd7.push(this.getDependency('bufferView', _0x3b4a20.sparse.indices.bufferView)),
        _0xc9bdd7.push(this.getDependency('bufferView', _0x3b4a20.sparse.values.bufferView))),
      Promise.all(_0xc9bdd7).then(function (_0xa99742) {
        const _0x81f80c = _0xa99742[0],
          _0x28ce62 = WEBGL_TYPE_SIZES[_0x3b4a20.type],
          _0x29f681 = WEBGL_COMPONENT_TYPES[_0x3b4a20.componentType],
          _0x954eed = _0x29f681.BYTES_PER_ELEMENT,
          _0x1af7d0 = _0x954eed * _0x28ce62,
          _0x732ee9 = _0x3b4a20.byteOffset || 0,
          _0x188a94 =
            _0x3b4a20.bufferView !== undefined
              ? _0x4fc8d8.bufferViews[_0x3b4a20.bufferView].byteStride
              : undefined,
          _0x2eece6 = _0x3b4a20.normalized === true;
        let _0xfc749e, _0x510210;
        if (_0x188a94 && _0x188a94 !== _0x1af7d0) {
          const _0x43de8b = Math.floor(_0x732ee9 / _0x188a94),
            _0xa6b550 =
              'InterleavedBuffer:' +
              _0x3b4a20.bufferView +
              ':' +
              _0x3b4a20.componentType +
              ':' +
              _0x43de8b +
              ':' +
              _0x3b4a20.count;
          let _0x36056b = _0xb312f3.cache.get(_0xa6b550);
          (!_0x36056b &&
            ((_0xfc749e = new _0x29f681(
              _0x81f80c,
              _0x43de8b * _0x188a94,
              (_0x3b4a20.count * _0x188a94) / _0x954eed,
            )),
            (_0x36056b = new InterleavedBuffer(_0xfc749e, _0x188a94 / _0x954eed)),
            _0xb312f3.cache.add(_0xa6b550, _0x36056b)),
            (_0x510210 = new InterleavedBufferAttribute(
              _0x36056b,
              _0x28ce62,
              (_0x732ee9 % _0x188a94) / _0x954eed,
              _0x2eece6,
            )));
        } else
          (_0x81f80c === null
            ? (_0xfc749e = new _0x29f681(_0x3b4a20.count * _0x28ce62))
            : (_0xfc749e = new _0x29f681(_0x81f80c, _0x732ee9, _0x3b4a20.count * _0x28ce62)),
            (_0x510210 = new BufferAttribute(_0xfc749e, _0x28ce62, _0x2eece6)));
        if (_0x3b4a20.sparse !== undefined) {
          const _0x109228 = WEBGL_TYPE_SIZES.SCALAR,
            _0x15464c = WEBGL_COMPONENT_TYPES[_0x3b4a20.sparse.indices.componentType],
            _0x32e53c = _0x3b4a20.sparse.indices.byteOffset || 0,
            _0x186afd = _0x3b4a20.sparse.values.byteOffset || 0,
            _0x5142e1 = new _0x15464c(_0xa99742[1], _0x32e53c, _0x3b4a20.sparse.count * _0x109228),
            _0x3e0878 = new _0x29f681(_0xa99742[2], _0x186afd, _0x3b4a20.sparse.count * _0x28ce62);
          _0x81f80c !== null &&
            (_0x510210 = new BufferAttribute(
              _0x510210.array.slice(),
              _0x510210.itemSize,
              _0x510210.normalized,
            ));
          _0x510210.normalized = false;
          for (let _0x4c9a97 = 0, _0x3beb83 = _0x5142e1.length; _0x4c9a97 < _0x3beb83; _0x4c9a97++) {
            const _0x35fe3a = _0x5142e1[_0x4c9a97];
            _0x510210.setX(_0x35fe3a, _0x3e0878[_0x4c9a97 * _0x28ce62]);
            if (_0x28ce62 >= 2) _0x510210.setY(_0x35fe3a, _0x3e0878[_0x4c9a97 * _0x28ce62 + 1]);
            if (_0x28ce62 >= 3) _0x510210.setZ(_0x35fe3a, _0x3e0878[_0x4c9a97 * _0x28ce62 + 2]);
            if (_0x28ce62 >= 4) _0x510210.setW(_0x35fe3a, _0x3e0878[_0x4c9a97 * _0x28ce62 + 3]);
            if (_0x28ce62 >= 5)
              throw new Error('THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.');
          }
          _0x510210.normalized = _0x2eece6;
        }
        return _0x510210;
      })
    );
  }
  ['loadTexture'](_0x4f2cf7) {
    const _0x505dd1 = this.json,
      _0xe956e = this.options,
      _0x4f07c7 = _0x505dd1.textures[_0x4f2cf7],
      _0x20b152 = _0x4f07c7.source,
      _0x875b17 = _0x505dd1.images[_0x20b152];
    let _0x2b1485 = this.textureLoader;
    if (_0x875b17.uri) {
      const _0x12b4f7 = _0xe956e.manager.getHandler(_0x875b17.uri);
      if (_0x12b4f7 !== null) _0x2b1485 = _0x12b4f7;
    }
    return this.loadTextureImage(_0x4f2cf7, _0x20b152, _0x2b1485);
  }
  ['loadTextureImage'](_0x107ee8, _0x29b9cc, _0x3d7444) {
    const _0x311d87 = this,
      _0x48f49a = this.json,
      _0x457251 = _0x48f49a.textures[_0x107ee8],
      _0x275d23 = _0x48f49a.images[_0x29b9cc],
      _0x56da90 = (_0x275d23.uri || _0x275d23.bufferView) + ':' + _0x457251.sampler;
    if (this.textureCache[_0x56da90]) return this.textureCache[_0x56da90];
    const _0x1e3da0 = this.loadImageSource(_0x29b9cc, _0x3d7444)
      .then(function (_0x118a34) {
        ((_0x118a34.flipY = false), (_0x118a34.name = _0x457251.name || _0x275d23.name || ''));
        _0x118a34.name === '' &&
          typeof _0x275d23.uri === 'string' &&
          _0x275d23.uri.startsWith('data:image/') === false &&
          (_0x118a34.name = _0x275d23.uri);
        const _0x18cebc = _0x48f49a.samplers || {},
          _0x58fcd6 = _0x18cebc[_0x457251.sampler] || {};
        return (
          (_0x118a34.magFilter = WEBGL_FILTERS[_0x58fcd6.magFilter] || LinearFilter),
          (_0x118a34.minFilter = WEBGL_FILTERS[_0x58fcd6.minFilter] || LinearMipmapLinearFilter),
          (_0x118a34.wrapS = WEBGL_WRAPPINGS[_0x58fcd6.wrapS] || RepeatWrapping),
          (_0x118a34.wrapT = WEBGL_WRAPPINGS[_0x58fcd6.wrapT] || RepeatWrapping),
          (_0x118a34.generateMipmaps =
            !_0x118a34.isCompressedTexture &&
            _0x118a34.minFilter !== NearestFilter &&
            _0x118a34.minFilter !== LinearFilter),
          _0x311d87.associations.set(_0x118a34, { textures: _0x107ee8 }),
          _0x118a34
        );
      })
      .catch(function () {
        return null;
      });
    return ((this.textureCache[_0x56da90] = _0x1e3da0), _0x1e3da0);
  }
  ['loadImageSource'](_0x4374ef, _0x5c7be1) {
    const _0x5b6d83 = this,
      _0x31715e = this.json,
      _0x182111 = this.options;
    if (this.sourceCache[_0x4374ef] !== undefined)
      return this.sourceCache[_0x4374ef].then((_0x528e14) => _0x528e14.clone());
    const _0x334966 = _0x31715e.images[_0x4374ef],
      _0x484326 = self.URL || self.webkitURL;
    let _0x114771 = _0x334966.uri || '',
      _0x36fd10 = false;
    if (_0x334966.bufferView !== undefined)
      _0x114771 = _0x5b6d83.getDependency('bufferView', _0x334966.bufferView).then(function (_0x150504) {
        _0x36fd10 = true;
        const _0x251c7b = new Blob([_0x150504], { type: _0x334966.mimeType });
        return ((_0x114771 = _0x484326.createObjectURL(_0x251c7b)), _0x114771);
      });
    else {
      if (_0x334966.uri === undefined)
        throw new Error('THREE.GLTFLoader: Image ' + _0x4374ef + ' is missing URI and bufferView');
    }
    const _0x2e5396 = Promise.resolve(_0x114771)
      .then(function (_0x50dcc7) {
        return new Promise(function (_0x19680c, _0x2ffa34) {
          let _0x559da7 = _0x19680c;
          (_0x5c7be1.isImageBitmapLoader === true &&
            (_0x559da7 = function (_0x1cf721) {
              const _0x1902d3 = new Texture(_0x1cf721);
              ((_0x1902d3.needsUpdate = true), _0x19680c(_0x1902d3));
            }),
            _0x5c7be1.load(
              LoaderUtils.resolveURL(_0x50dcc7, _0x182111.path),
              _0x559da7,
              undefined,
              _0x2ffa34,
            ));
        });
      })
      .then(function (_0x3af44f) {
        return (
          _0x36fd10 === true && _0x484326.revokeObjectURL(_0x114771),
          assignExtrasToUserData(_0x3af44f, _0x334966),
          (_0x3af44f.userData.mimeType = _0x334966.mimeType || getImageURIMimeType(_0x334966.uri)),
          _0x3af44f
        );
      })
      .catch(function (_0x324a60) {
        console.error("THREE.GLTFLoader: Couldn't load texture", _0x114771);
        throw _0x324a60;
      });
    return ((this.sourceCache[_0x4374ef] = _0x2e5396), _0x2e5396);
  }
  ['assignTexture'](_0x3e688b, _0x37ba49, _0x509d94, _0x22ead5) {
    const _0x401373 = this;
    return this.getDependency('texture', _0x509d94.index).then(function (_0x41684f) {
      if (!_0x41684f) return null;
      _0x509d94.texCoord !== undefined &&
        _0x509d94.texCoord > 0 &&
        ((_0x41684f = _0x41684f.clone()), (_0x41684f.channel = _0x509d94.texCoord));
      if (_0x401373.extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM]) {
        const _0xdf0354 =
          _0x509d94.extensions !== undefined
            ? _0x509d94.extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM]
            : undefined;
        if (_0xdf0354) {
          const _0x5d5bc4 = _0x401373.associations.get(_0x41684f);
          ((_0x41684f = _0x401373.extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM].extendTexture(
            _0x41684f,
            _0xdf0354,
          )),
            _0x401373.associations.set(_0x41684f, _0x5d5bc4));
        }
      }
      return (
        _0x22ead5 !== undefined && (_0x41684f.colorSpace = _0x22ead5),
        (_0x3e688b[_0x37ba49] = _0x41684f),
        _0x41684f
      );
    });
  }
  ['assignFinalMaterial'](_0x10a6a5) {
    const _0x393132 = _0x10a6a5.geometry;
    let _0xcf3fae = _0x10a6a5.material;
    const _0x5be30e = _0x393132.attributes.tangent === undefined,
      _0x3f932b = _0x393132.attributes.color !== undefined,
      _0xdce494 = _0x393132.attributes.normal === undefined;
    if (_0x10a6a5.isPoints) {
      const _0x297349 = 'PointsMaterial:' + _0xcf3fae.uuid;
      let _0x395e76 = this.cache.get(_0x297349);
      (!_0x395e76 &&
        ((_0x395e76 = new PointsMaterial()),
        Material.prototype.copy.call(_0x395e76, _0xcf3fae),
        _0x395e76.color.copy(_0xcf3fae.color),
        (_0x395e76.map = _0xcf3fae.map),
        (_0x395e76.sizeAttenuation = false),
        this.cache.add(_0x297349, _0x395e76)),
        (_0xcf3fae = _0x395e76));
    } else {
      if (_0x10a6a5.isLine) {
        const _0x55da79 = 'LineBasicMaterial:' + _0xcf3fae.uuid;
        let _0x52805b = this.cache.get(_0x55da79);
        (!_0x52805b &&
          ((_0x52805b = new LineBasicMaterial()),
          Material.prototype.copy.call(_0x52805b, _0xcf3fae),
          _0x52805b.color.copy(_0xcf3fae.color),
          (_0x52805b.map = _0xcf3fae.map),
          this.cache.add(_0x55da79, _0x52805b)),
          (_0xcf3fae = _0x52805b));
      }
    }
    if (_0x5be30e || _0x3f932b || _0xdce494) {
      let _0x1ed623 = 'ClonedMaterial:' + _0xcf3fae.uuid + ':';
      if (_0x5be30e) _0x1ed623 += 'derivative-tangents:';
      if (_0x3f932b) _0x1ed623 += 'vertex-colors:';
      if (_0xdce494) _0x1ed623 += 'flat-shading:';
      let _0x539353 = this.cache.get(_0x1ed623);
      if (!_0x539353) {
        _0x539353 = _0xcf3fae.clone();
        if (_0x3f932b) _0x539353.vertexColors = true;
        if (_0xdce494) _0x539353.flatShading = true;
        if (_0x5be30e) {
          if (_0x539353.normalScale) _0x539353.normalScale.y *= -1;
          if (_0x539353.clearcoatNormalScale) _0x539353.clearcoatNormalScale.y *= -1;
        }
        (this.cache.add(_0x1ed623, _0x539353),
          this.associations.set(_0x539353, this.associations.get(_0xcf3fae)));
      }
      _0xcf3fae = _0x539353;
    }
    _0x10a6a5.material = _0xcf3fae;
  }
  ['getMaterialType']() {
    return MeshStandardMaterial;
  }
  ['loadMaterial'](_0x2b3114) {
    const _0x2cc57e = this,
      _0x1f4902 = this.json,
      _0x1f8a2c = this.extensions,
      _0x3b12f9 = _0x1f4902.materials[_0x2b3114];
    let _0x10f186;
    const _0x30172a = {},
      _0x76bbfd = _0x3b12f9.extensions || {},
      _0x2bcfb6 = [];
    if (_0x76bbfd[EXTENSIONS.KHR_MATERIALS_UNLIT]) {
      const _0x19c153 = _0x1f8a2c[EXTENSIONS.KHR_MATERIALS_UNLIT];
      ((_0x10f186 = _0x19c153.getMaterialType()),
        _0x2bcfb6.push(_0x19c153.extendParams(_0x30172a, _0x3b12f9, _0x2cc57e)));
    } else {
      const _0x1903bd = _0x3b12f9.pbrMetallicRoughness || {};
      ((_0x30172a.color = new Color(1, 1, 1)), (_0x30172a.opacity = 1));
      if (Array.isArray(_0x1903bd.baseColorFactor)) {
        const _0x46f0f8 = _0x1903bd.baseColorFactor;
        (_0x30172a.color.setRGB(_0x46f0f8[0], _0x46f0f8[1], _0x46f0f8[2], LinearSRGBColorSpace),
          (_0x30172a.opacity = _0x46f0f8[3]));
      }
      (_0x1903bd.baseColorTexture !== undefined &&
        _0x2bcfb6.push(_0x2cc57e.assignTexture(_0x30172a, 'map', _0x1903bd.baseColorTexture, SRGBColorSpace)),
        (_0x30172a.metalness = _0x1903bd.metallicFactor !== undefined ? _0x1903bd.metallicFactor : 1),
        (_0x30172a.roughness = _0x1903bd.roughnessFactor !== undefined ? _0x1903bd.roughnessFactor : 1),
        _0x1903bd.metallicRoughnessTexture !== undefined &&
          (_0x2bcfb6.push(
            _0x2cc57e.assignTexture(_0x30172a, 'metalnessMap', _0x1903bd.metallicRoughnessTexture),
          ),
          _0x2bcfb6.push(
            _0x2cc57e.assignTexture(_0x30172a, 'roughnessMap', _0x1903bd.metallicRoughnessTexture),
          )),
        (_0x10f186 = this._invokeOne(function (_0x502255) {
          return _0x502255.getMaterialType && _0x502255.getMaterialType(_0x2b3114);
        })),
        _0x2bcfb6.push(
          Promise.all(
            this._invokeAll(function (_0x182ece) {
              return _0x182ece.extendMaterialParams && _0x182ece.extendMaterialParams(_0x2b3114, _0x30172a);
            }),
          ),
        ));
    }
    _0x3b12f9.doubleSided === true && (_0x30172a.side = DoubleSide);
    const _0xca1b60 = _0x3b12f9.alphaMode || ALPHA_MODES.OPAQUE;
    _0xca1b60 === ALPHA_MODES.BLEND
      ? ((_0x30172a.transparent = true), (_0x30172a.depthWrite = false))
      : ((_0x30172a.transparent = false),
        _0xca1b60 === ALPHA_MODES.MASK &&
          (_0x30172a.alphaTest = _0x3b12f9.alphaCutoff !== undefined ? _0x3b12f9.alphaCutoff : 0.5));
    if (_0x3b12f9.normalTexture !== undefined && _0x10f186 !== MeshBasicMaterial) {
      (_0x2bcfb6.push(_0x2cc57e.assignTexture(_0x30172a, 'normalMap', _0x3b12f9.normalTexture)),
        (_0x30172a.normalScale = new Vector2(1, 1)));
      if (_0x3b12f9.normalTexture.scale !== undefined) {
        const _0x29e177 = _0x3b12f9.normalTexture.scale;
        _0x30172a.normalScale.set(_0x29e177, _0x29e177);
      }
    }
    _0x3b12f9.occlusionTexture !== undefined &&
      _0x10f186 !== MeshBasicMaterial &&
      (_0x2bcfb6.push(_0x2cc57e.assignTexture(_0x30172a, 'aoMap', _0x3b12f9.occlusionTexture)),
      _0x3b12f9.occlusionTexture.strength !== undefined &&
        (_0x30172a.aoMapIntensity = _0x3b12f9.occlusionTexture.strength));
    if (_0x3b12f9.emissiveFactor !== undefined && _0x10f186 !== MeshBasicMaterial) {
      const _0x5dcfc5 = _0x3b12f9.emissiveFactor;
      _0x30172a.emissive = new Color().setRGB(_0x5dcfc5[0], _0x5dcfc5[1], _0x5dcfc5[2], LinearSRGBColorSpace);
    }
    return (
      _0x3b12f9.emissiveTexture !== undefined &&
        _0x10f186 !== MeshBasicMaterial &&
        _0x2bcfb6.push(
          _0x2cc57e.assignTexture(_0x30172a, 'emissiveMap', _0x3b12f9.emissiveTexture, SRGBColorSpace),
        ),
      Promise.all(_0x2bcfb6).then(function () {
        const _0x4318dd = new _0x10f186(_0x30172a);
        if (_0x3b12f9.name) _0x4318dd.name = _0x3b12f9.name;
        (assignExtrasToUserData(_0x4318dd, _0x3b12f9),
          _0x2cc57e.associations.set(_0x4318dd, { materials: _0x2b3114 }));
        if (_0x3b12f9.extensions) addUnknownExtensionsToUserData(_0x1f8a2c, _0x4318dd, _0x3b12f9);
        return _0x4318dd;
      })
    );
  }
  ['createUniqueName'](_0x588206) {
    const _0x2b1c71 = PropertyBinding.sanitizeNodeName(_0x588206 || '');
    return _0x2b1c71 in this.nodeNamesUsed
      ? _0x2b1c71 + '_' + ++this.nodeNamesUsed[_0x2b1c71]
      : ((this.nodeNamesUsed[_0x2b1c71] = 0), _0x2b1c71);
  }
  ['loadGeometries'](_0x4c518b) {
    const _0x1ddb3e = this,
      _0x28eeb3 = this.extensions,
      _0x5932b3 = this.primitiveCache;
    function _0x164199(_0x2826b6) {
      return _0x28eeb3[EXTENSIONS.KHR_DRACO_MESH_COMPRESSION]
        .decodePrimitive(_0x2826b6, _0x1ddb3e)
        .then(function (_0x46a9df) {
          return addPrimitiveAttributes(_0x46a9df, _0x2826b6, _0x1ddb3e);
        });
    }
    const _0x3b447b = [];
    for (let _0x3aaced = 0, _0x4b62ef = _0x4c518b.length; _0x3aaced < _0x4b62ef; _0x3aaced++) {
      const _0x5687b9 = _0x4c518b[_0x3aaced],
        _0x5ca7db = createPrimitiveKey(_0x5687b9),
        _0x6e5430 = _0x5932b3[_0x5ca7db];
      if (_0x6e5430) _0x3b447b.push(_0x6e5430.promise);
      else {
        let _0x48e63a;
        (_0x5687b9.extensions && _0x5687b9.extensions[EXTENSIONS.KHR_DRACO_MESH_COMPRESSION]
          ? (_0x48e63a = _0x164199(_0x5687b9))
          : (_0x48e63a = addPrimitiveAttributes(new BufferGeometry(), _0x5687b9, _0x1ddb3e)),
          (_0x5932b3[_0x5ca7db] = { primitive: _0x5687b9, promise: _0x48e63a }),
          _0x3b447b.push(_0x48e63a));
      }
    }
    return Promise.all(_0x3b447b);
  }
  ['loadMesh'](_0x54375b) {
    const _0x2be6fc = this,
      _0x49be1b = this.json,
      _0x4724d5 = this.extensions,
      _0xbf8db = _0x49be1b.meshes[_0x54375b],
      _0x49b134 = _0xbf8db.primitives,
      _0x57fac3 = [];
    for (let _0x9bbdd3 = 0, _0x56265c = _0x49b134.length; _0x9bbdd3 < _0x56265c; _0x9bbdd3++) {
      const _0x322ee7 =
        _0x49b134[_0x9bbdd3].material === undefined
          ? createDefaultMaterial(this.cache)
          : this.getDependency('material', _0x49b134[_0x9bbdd3].material);
      _0x57fac3.push(_0x322ee7);
    }
    return (
      _0x57fac3.push(_0x2be6fc.loadGeometries(_0x49b134)),
      Promise.all(_0x57fac3).then(function (_0xa6b798) {
        const _0x531e4c = _0xa6b798.slice(0, _0xa6b798.length - 1),
          _0x35b481 = _0xa6b798[_0xa6b798.length - 1],
          _0x415f1d = [];
        for (let _0x8876cc = 0, _0xc3bbb8 = _0x35b481.length; _0x8876cc < _0xc3bbb8; _0x8876cc++) {
          const _0xc47bad = _0x35b481[_0x8876cc],
            _0x3108c6 = _0x49b134[_0x8876cc];
          let _0x575d6d;
          const _0xa2579a = _0x531e4c[_0x8876cc];
          if (
            _0x3108c6.mode === WEBGL_CONSTANTS.TRIANGLES ||
            _0x3108c6.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP ||
            _0x3108c6.mode === WEBGL_CONSTANTS.TRIANGLE_FAN ||
            _0x3108c6.mode === undefined
          ) {
            _0x575d6d =
              _0xbf8db.isSkinnedMesh === true
                ? new SkinnedMesh(_0xc47bad, _0xa2579a)
                : new Mesh(_0xc47bad, _0xa2579a);
            _0x575d6d.isSkinnedMesh === true && _0x575d6d.normalizeSkinWeights();
            if (_0x3108c6.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP)
              _0x575d6d.geometry = toTrianglesDrawMode(_0x575d6d.geometry, TriangleStripDrawMode);
            else
              _0x3108c6.mode === WEBGL_CONSTANTS.TRIANGLE_FAN &&
                (_0x575d6d.geometry = toTrianglesDrawMode(_0x575d6d.geometry, TriangleFanDrawMode));
          } else {
            if (_0x3108c6.mode === WEBGL_CONSTANTS.LINES) _0x575d6d = new LineSegments(_0xc47bad, _0xa2579a);
            else {
              if (_0x3108c6.mode === WEBGL_CONSTANTS.LINE_STRIP) _0x575d6d = new Line(_0xc47bad, _0xa2579a);
              else {
                if (_0x3108c6.mode === WEBGL_CONSTANTS.LINE_LOOP)
                  _0x575d6d = new LineLoop(_0xc47bad, _0xa2579a);
                else {
                  if (_0x3108c6.mode === WEBGL_CONSTANTS.POINTS) _0x575d6d = new Points(_0xc47bad, _0xa2579a);
                  else throw new Error('THREE.GLTFLoader: Primitive mode unsupported: ' + _0x3108c6.mode);
                }
              }
            }
          }
          Object.keys(_0x575d6d.geometry.morphAttributes).length > 0 &&
            updateMorphTargets(_0x575d6d, _0xbf8db);
          ((_0x575d6d.name = _0x2be6fc.createUniqueName(_0xbf8db.name || 'mesh_' + _0x54375b)),
            assignExtrasToUserData(_0x575d6d, _0xbf8db));
          if (_0x3108c6.extensions) addUnknownExtensionsToUserData(_0x4724d5, _0x575d6d, _0x3108c6);
          (_0x2be6fc.assignFinalMaterial(_0x575d6d), _0x415f1d.push(_0x575d6d));
        }
        for (let _0x9efc39 = 0, _0x46a997 = _0x415f1d.length; _0x9efc39 < _0x46a997; _0x9efc39++) {
          _0x2be6fc.associations.set(_0x415f1d[_0x9efc39], { meshes: _0x54375b, primitives: _0x9efc39 });
        }
        if (_0x415f1d.length === 1) {
          if (_0xbf8db.extensions) addUnknownExtensionsToUserData(_0x4724d5, _0x415f1d[0], _0xbf8db);
          return _0x415f1d[0];
        }
        const _0x1c95d7 = new Group();
        if (_0xbf8db.extensions) addUnknownExtensionsToUserData(_0x4724d5, _0x1c95d7, _0xbf8db);
        _0x2be6fc.associations.set(_0x1c95d7, { meshes: _0x54375b });
        for (let _0x5ee1db = 0, _0x567ee1 = _0x415f1d.length; _0x5ee1db < _0x567ee1; _0x5ee1db++) {
          _0x1c95d7.add(_0x415f1d[_0x5ee1db]);
        }
        return _0x1c95d7;
      })
    );
  }
  ['loadCamera'](_0x8540e2) {
    let _0x536f3c;
    const _0x5d1d9b = this.json.cameras[_0x8540e2],
      _0x437c2c = _0x5d1d9b[_0x5d1d9b.type];
    if (!_0x437c2c) {
      console.warn('THREE.GLTFLoader: Missing camera parameters.');
      return;
    }
    if (_0x5d1d9b.type === 'perspective')
      _0x536f3c = new PerspectiveCamera(
        MathUtils.radToDeg(_0x437c2c.yfov),
        _0x437c2c.aspectRatio || 1,
        _0x437c2c.znear || 1,
        _0x437c2c.zfar || 0x1e8480,
      );
    else
      _0x5d1d9b.type === 'orthographic' &&
        (_0x536f3c = new OrthographicCamera(
          -_0x437c2c.xmag,
          _0x437c2c.xmag,
          _0x437c2c.ymag,
          -_0x437c2c.ymag,
          _0x437c2c.znear,
          _0x437c2c.zfar,
        ));
    if (_0x5d1d9b.name) _0x536f3c.name = this.createUniqueName(_0x5d1d9b.name);
    return (assignExtrasToUserData(_0x536f3c, _0x5d1d9b), Promise.resolve(_0x536f3c));
  }
  ['loadSkin'](_0x2a0805) {
    const _0x3a3a1b = this.json.skins[_0x2a0805],
      _0x3b322f = [];
    for (let _0x53479a = 0, _0x148b89 = _0x3a3a1b.joints.length; _0x53479a < _0x148b89; _0x53479a++) {
      _0x3b322f.push(this._loadNodeShallow(_0x3a3a1b.joints[_0x53479a]));
    }
    return (
      _0x3a3a1b.inverseBindMatrices !== undefined
        ? _0x3b322f.push(this.getDependency('accessor', _0x3a3a1b.inverseBindMatrices))
        : _0x3b322f.push(null),
      Promise.all(_0x3b322f).then(function (_0x506f18) {
        const _0x4cdd36 = _0x506f18.pop(),
          _0x233657 = _0x506f18,
          _0x370682 = [],
          _0x3edf31 = [];
        for (let _0x311857 = 0, _0x15ecd2 = _0x233657.length; _0x311857 < _0x15ecd2; _0x311857++) {
          const _0x1586df = _0x233657[_0x311857];
          if (_0x1586df) {
            _0x370682.push(_0x1586df);
            const _0x353584 = new Matrix4();
            (_0x4cdd36 !== null && _0x353584.fromArray(_0x4cdd36.array, _0x311857 * 16),
              _0x3edf31.push(_0x353584));
          } else
            console.warn('THREE.GLTFLoader: Joint "%s" could not be found.', _0x3a3a1b.joints[_0x311857]);
        }
        return new Skeleton(_0x370682, _0x3edf31);
      })
    );
  }
  ['loadAnimation'](_0x332e81) {
    const _0x4fd19a = this.json,
      _0x571d73 = this,
      _0x422868 = _0x4fd19a.animations[_0x332e81],
      _0x5bd4c9 = _0x422868.name ? _0x422868.name : 'animation_' + _0x332e81,
      _0x90da4d = [],
      _0x327fc6 = [],
      _0x4d9e48 = [],
      _0x1e1c91 = [],
      _0x1607dc = [];
    for (let _0x20284d = 0, _0x396328 = _0x422868.channels.length; _0x20284d < _0x396328; _0x20284d++) {
      const _0x32dd7c = _0x422868.channels[_0x20284d],
        _0x400868 = _0x422868.samplers[_0x32dd7c.sampler],
        _0x8ad9b9 = _0x32dd7c.target,
        _0x8e266f = _0x8ad9b9.node,
        _0x17268a =
          _0x422868.parameters !== undefined ? _0x422868.parameters[_0x400868.input] : _0x400868.input,
        _0xc38605 =
          _0x422868.parameters !== undefined ? _0x422868.parameters[_0x400868.output] : _0x400868.output;
      if (_0x8ad9b9.node === undefined) continue;
      (_0x90da4d.push(this.getDependency('node', _0x8e266f)),
        _0x327fc6.push(this.getDependency('accessor', _0x17268a)),
        _0x4d9e48.push(this.getDependency('accessor', _0xc38605)),
        _0x1e1c91.push(_0x400868),
        _0x1607dc.push(_0x8ad9b9));
    }
    return Promise.all([
      Promise.all(_0x90da4d),
      Promise.all(_0x327fc6),
      Promise.all(_0x4d9e48),
      Promise.all(_0x1e1c91),
      Promise.all(_0x1607dc),
    ]).then(function (_0x499324) {
      const _0x268187 = _0x499324[0],
        _0x1e0e61 = _0x499324[1],
        _0x308c12 = _0x499324[2],
        _0x596db7 = _0x499324[3],
        _0x30c04e = _0x499324[4],
        _0x5bd5a3 = [];
      for (let _0x1b9039 = 0, _0x870700 = _0x268187.length; _0x1b9039 < _0x870700; _0x1b9039++) {
        const _0x240305 = _0x268187[_0x1b9039],
          _0x4b785f = _0x1e0e61[_0x1b9039],
          _0xfed50c = _0x308c12[_0x1b9039],
          _0x11cbee = _0x596db7[_0x1b9039],
          _0x44855e = _0x30c04e[_0x1b9039];
        if (_0x240305 === undefined) continue;
        _0x240305.updateMatrix && _0x240305.updateMatrix();
        const _0xfd2f5d = _0x571d73._createAnimationTracks(
          _0x240305,
          _0x4b785f,
          _0xfed50c,
          _0x11cbee,
          _0x44855e,
        );
        if (_0xfd2f5d)
          for (let _0x1cf25d = 0; _0x1cf25d < _0xfd2f5d.length; _0x1cf25d++) {
            _0x5bd5a3.push(_0xfd2f5d[_0x1cf25d]);
          }
      }
      const _0x22dcaf = new AnimationClip(_0x5bd4c9, undefined, _0x5bd5a3);
      return (assignExtrasToUserData(_0x22dcaf, _0x422868), _0x22dcaf);
    });
  }
  ['createNodeMesh'](_0x668438) {
    const _0x1b5364 = this.json,
      _0x2e83ec = this,
      _0xc41b39 = _0x1b5364.nodes[_0x668438];
    if (_0xc41b39.mesh === undefined) return null;
    return _0x2e83ec.getDependency('mesh', _0xc41b39.mesh).then(function (_0x46985d) {
      const _0x5572cf = _0x2e83ec._getNodeRef(_0x2e83ec.meshCache, _0xc41b39.mesh, _0x46985d);
      return (
        _0xc41b39.weights !== undefined &&
          _0x5572cf.traverse(function (_0x3ce473) {
            if (!_0x3ce473.isMesh) return;
            for (
              let _0x2790c0 = 0, _0x393dba = _0xc41b39.weights.length;
              _0x2790c0 < _0x393dba;
              _0x2790c0++
            ) {
              _0x3ce473.morphTargetInfluences[_0x2790c0] = _0xc41b39.weights[_0x2790c0];
            }
          }),
        _0x5572cf
      );
    });
  }
  ['loadNode'](_0xef751b) {
    const _0x5a8c5f = this.json,
      _0x18074a = this,
      _0x3cb78e = _0x5a8c5f.nodes[_0xef751b],
      _0x31c7cf = _0x18074a._loadNodeShallow(_0xef751b),
      _0x188961 = [],
      _0x5d9384 = _0x3cb78e.children || [];
    for (let _0xfdcf50 = 0, _0x302e0f = _0x5d9384.length; _0xfdcf50 < _0x302e0f; _0xfdcf50++) {
      _0x188961.push(_0x18074a.getDependency('node', _0x5d9384[_0xfdcf50]));
    }
    const _0x29d31c =
      _0x3cb78e.skin === undefined ? Promise.resolve(null) : _0x18074a.getDependency('skin', _0x3cb78e.skin);
    return Promise.all([_0x31c7cf, Promise.all(_0x188961), _0x29d31c]).then(function (_0xed79b7) {
      const _0x3b723a = _0xed79b7[0],
        _0x42a581 = _0xed79b7[1],
        _0x2b2705 = _0xed79b7[2];
      _0x2b2705 !== null &&
        _0x3b723a.traverse(function (_0x3b0d15) {
          if (!_0x3b0d15.isSkinnedMesh) return;
          _0x3b0d15.bind(_0x2b2705, _identityMatrix);
        });
      for (let _0x41be5c = 0, _0x4d47d2 = _0x42a581.length; _0x41be5c < _0x4d47d2; _0x41be5c++) {
        _0x3b723a.add(_0x42a581[_0x41be5c]);
      }
      return _0x3b723a;
    });
  }
  ['_loadNodeShallow'](_0x4dbc8e) {
    const _0x448b66 = this.json,
      _0x24e880 = this.extensions,
      _0x35acf5 = this;
    if (this.nodeCache[_0x4dbc8e] !== undefined) return this.nodeCache[_0x4dbc8e];
    const _0x34b939 = _0x448b66.nodes[_0x4dbc8e],
      _0x3ae53e = _0x34b939.name ? _0x35acf5.createUniqueName(_0x34b939.name) : '',
      _0x2ffd63 = [],
      _0x49de3d = _0x35acf5._invokeOne(function (_0x23cf85) {
        return _0x23cf85.createNodeMesh && _0x23cf85.createNodeMesh(_0x4dbc8e);
      });
    return (
      _0x49de3d && _0x2ffd63.push(_0x49de3d),
      _0x34b939.camera !== undefined &&
        _0x2ffd63.push(
          _0x35acf5.getDependency('camera', _0x34b939.camera).then(function (_0x13e43c) {
            return _0x35acf5._getNodeRef(_0x35acf5.cameraCache, _0x34b939.camera, _0x13e43c);
          }),
        ),
      _0x35acf5
        ._invokeAll(function (_0x14e46c) {
          return _0x14e46c.createNodeAttachment && _0x14e46c.createNodeAttachment(_0x4dbc8e);
        })
        .forEach(function (_0x661c9a) {
          _0x2ffd63.push(_0x661c9a);
        }),
      (this.nodeCache[_0x4dbc8e] = Promise.all(_0x2ffd63).then(function (_0x2fa28d) {
        let _0x5d2384;
        if (_0x34b939.isBone === true) _0x5d2384 = new Bone();
        else {
          if (_0x2fa28d.length > 1) _0x5d2384 = new Group();
          else _0x2fa28d.length === 1 ? (_0x5d2384 = _0x2fa28d[0]) : (_0x5d2384 = new Object3D());
        }
        if (_0x5d2384 !== _0x2fa28d[0])
          for (let _0x3369ae = 0, _0x2340dc = _0x2fa28d.length; _0x3369ae < _0x2340dc; _0x3369ae++) {
            _0x5d2384.add(_0x2fa28d[_0x3369ae]);
          }
        _0x34b939.name && ((_0x5d2384.userData.name = _0x34b939.name), (_0x5d2384.name = _0x3ae53e));
        assignExtrasToUserData(_0x5d2384, _0x34b939);
        if (_0x34b939.extensions) addUnknownExtensionsToUserData(_0x24e880, _0x5d2384, _0x34b939);
        if (_0x34b939.matrix !== undefined) {
          const _0x5ae5a4 = new Matrix4();
          (_0x5ae5a4.fromArray(_0x34b939.matrix), _0x5d2384.applyMatrix4(_0x5ae5a4));
        } else
          (_0x34b939.translation !== undefined && _0x5d2384.position.fromArray(_0x34b939.translation),
            _0x34b939.rotation !== undefined && _0x5d2384.quaternion.fromArray(_0x34b939.rotation),
            _0x34b939.scale !== undefined && _0x5d2384.scale.fromArray(_0x34b939.scale));
        if (!_0x35acf5.associations.has(_0x5d2384)) _0x35acf5.associations.set(_0x5d2384, {});
        else {
          if (_0x34b939.mesh !== undefined && _0x35acf5.meshCache.refs[_0x34b939.mesh] > 1) {
            const _0x28d800 = _0x35acf5.associations.get(_0x5d2384);
            _0x35acf5.associations.set(_0x5d2384, { ..._0x28d800 });
          }
        }
        return ((_0x35acf5.associations.get(_0x5d2384).nodes = _0x4dbc8e), _0x5d2384);
      })),
      this.nodeCache[_0x4dbc8e]
    );
  }
  ['loadScene'](_0x4ede1b) {
    const _0x5a7226 = this.extensions,
      _0x5d716a = this.json.scenes[_0x4ede1b],
      _0x224ee6 = this,
      _0x24c900 = new Group();
    if (_0x5d716a.name) _0x24c900.name = _0x224ee6.createUniqueName(_0x5d716a.name);
    assignExtrasToUserData(_0x24c900, _0x5d716a);
    if (_0x5d716a.extensions) addUnknownExtensionsToUserData(_0x5a7226, _0x24c900, _0x5d716a);
    const _0x1aa931 = _0x5d716a.nodes || [],
      _0x62a19f = [];
    for (let _0x344689 = 0, _0x322d8c = _0x1aa931.length; _0x344689 < _0x322d8c; _0x344689++) {
      _0x62a19f.push(_0x224ee6.getDependency('node', _0x1aa931[_0x344689]));
    }
    return Promise.all(_0x62a19f).then(function (_0x4fd988) {
      for (let _0x395ae5 = 0, _0x119a51 = _0x4fd988.length; _0x395ae5 < _0x119a51; _0x395ae5++) {
        _0x24c900.add(_0x4fd988[_0x395ae5]);
      }
      const _0x59e566 = (_0x30ec6f) => {
        const _0x16e549 = new Map();
        for (const [_0x7108b1, _0x552407] of _0x224ee6.associations) {
          (_0x7108b1 instanceof Material || _0x7108b1 instanceof Texture) &&
            _0x16e549.set(_0x7108b1, _0x552407);
        }
        return (
          _0x30ec6f.traverse((_0x1a9170) => {
            const _0x267cd0 = _0x224ee6.associations.get(_0x1a9170);
            _0x267cd0 != null && _0x16e549.set(_0x1a9170, _0x267cd0);
          }),
          _0x16e549
        );
      };
      return ((_0x224ee6.associations = _0x59e566(_0x24c900)), _0x24c900);
    });
  }
  ['_createAnimationTracks'](_0x1ab6f2, _0x33d6da, _0x1e3c33, _0x3c392e, _0x46a594) {
    const _0x387487 = [],
      _0x47a5d7 = _0x1ab6f2.name ? _0x1ab6f2.name : _0x1ab6f2.uuid,
      _0x12239a = [];
    PATH_PROPERTIES[_0x46a594.path] === PATH_PROPERTIES.weights
      ? _0x1ab6f2.traverse(function (_0x7094ce) {
          _0x7094ce.morphTargetInfluences && _0x12239a.push(_0x7094ce.name ? _0x7094ce.name : _0x7094ce.uuid);
        })
      : _0x12239a.push(_0x47a5d7);
    let _0x339a7e;
    switch (PATH_PROPERTIES[_0x46a594.path]) {
      case PATH_PROPERTIES.weights:
        _0x339a7e = NumberKeyframeTrack;
        break;
      case PATH_PROPERTIES.rotation:
        _0x339a7e = QuaternionKeyframeTrack;
        break;
      case PATH_PROPERTIES.translation:
      case PATH_PROPERTIES.scale:
        _0x339a7e = VectorKeyframeTrack;
        break;
      default:
        switch (_0x1e3c33.itemSize) {
          case 1:
            _0x339a7e = NumberKeyframeTrack;
            break;
          case 2:
          case 3:
          default:
            _0x339a7e = VectorKeyframeTrack;
            break;
        }
        break;
    }
    const _0x61e2cd =
        _0x3c392e.interpolation !== undefined ? INTERPOLATION[_0x3c392e.interpolation] : InterpolateLinear,
      _0x53b7fd = this._getArrayFromAccessor(_0x1e3c33);
    for (let _0x4e2f6b = 0, _0x178bb4 = _0x12239a.length; _0x4e2f6b < _0x178bb4; _0x4e2f6b++) {
      const _0x16220e = new _0x339a7e(
        _0x12239a[_0x4e2f6b] + '.' + PATH_PROPERTIES[_0x46a594.path],
        _0x33d6da.array,
        _0x53b7fd,
        _0x61e2cd,
      );
      (_0x3c392e.interpolation === 'CUBICSPLINE' && this._createCubicSplineTrackInterpolant(_0x16220e),
        _0x387487.push(_0x16220e));
    }
    return _0x387487;
  }
  ['_getArrayFromAccessor'](_0xbdb43f) {
    let _0x3c7377 = _0xbdb43f.array;
    if (_0xbdb43f.normalized) {
      const _0x376364 = getNormalizedComponentScale(_0x3c7377.constructor),
        _0xb69798 = new Float32Array(_0x3c7377.length);
      for (let _0xbfd804 = 0, _0x43f260 = _0x3c7377.length; _0xbfd804 < _0x43f260; _0xbfd804++) {
        _0xb69798[_0xbfd804] = _0x3c7377[_0xbfd804] * _0x376364;
      }
      _0x3c7377 = _0xb69798;
    }
    return _0x3c7377;
  }
  ['_createCubicSplineTrackInterpolant'](_0x44d54f) {
    ((_0x44d54f.createInterpolant = function _0x279cd9(_0x36e23b) {
      const _0xc34457 =
        this instanceof QuaternionKeyframeTrack
          ? GLTFCubicSplineQuaternionInterpolant
          : GLTFCubicSplineInterpolant;
      return new _0xc34457(this.times, this.values, this.getValueSize() / 3, _0x36e23b);
    }),
      (_0x44d54f.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline = true));
  }
}
function computeBounds(_0xd69bd6, _0x405acf, _0x5c568a) {
  const _0x4e04ad = _0x405acf.attributes,
    _0xe694c9 = new Box3();
  if (_0x4e04ad.POSITION !== undefined) {
    const _0x574d9d = _0x5c568a.json.accessors[_0x4e04ad.POSITION],
      _0xd1d651 = _0x574d9d.min,
      _0x4e3384 = _0x574d9d.max;
    if (_0xd1d651 !== undefined && _0x4e3384 !== undefined) {
      _0xe694c9.set(
        new Vector3(_0xd1d651[0], _0xd1d651[1], _0xd1d651[2]),
        new Vector3(_0x4e3384[0], _0x4e3384[1], _0x4e3384[2]),
      );
      if (_0x574d9d.normalized) {
        const _0x1485a8 = getNormalizedComponentScale(WEBGL_COMPONENT_TYPES[_0x574d9d.componentType]);
        (_0xe694c9.min.multiplyScalar(_0x1485a8), _0xe694c9.max.multiplyScalar(_0x1485a8));
      }
    } else {
      console.warn('THREE.GLTFLoader: Missing min/max properties for accessor POSITION.');
      return;
    }
  } else return;
  const _0x1ef07d = _0x405acf.targets;
  if (_0x1ef07d !== undefined) {
    const _0x448504 = new Vector3(),
      _0x5e8eb1 = new Vector3();
    for (let _0x4cd050 = 0, _0x199fdf = _0x1ef07d.length; _0x4cd050 < _0x199fdf; _0x4cd050++) {
      const _0x1ae7a = _0x1ef07d[_0x4cd050];
      if (_0x1ae7a.POSITION !== undefined) {
        const _0x3dda65 = _0x5c568a.json.accessors[_0x1ae7a.POSITION],
          _0x2f626d = _0x3dda65.min,
          _0x26292c = _0x3dda65.max;
        if (_0x2f626d !== undefined && _0x26292c !== undefined) {
          (_0x5e8eb1.setX(Math.max(Math.abs(_0x2f626d[0]), Math.abs(_0x26292c[0]))),
            _0x5e8eb1.setY(Math.max(Math.abs(_0x2f626d[1]), Math.abs(_0x26292c[1]))),
            _0x5e8eb1.setZ(Math.max(Math.abs(_0x2f626d[2]), Math.abs(_0x26292c[2]))));
          if (_0x3dda65.normalized) {
            const _0x3f1efc = getNormalizedComponentScale(WEBGL_COMPONENT_TYPES[_0x3dda65.componentType]);
            _0x5e8eb1.multiplyScalar(_0x3f1efc);
          }
          _0x448504.max(_0x5e8eb1);
        } else console.warn('THREE.GLTFLoader: Missing min/max properties for accessor POSITION.');
      }
    }
    _0xe694c9.expandByVector(_0x448504);
  }
  _0xd69bd6.boundingBox = _0xe694c9;
  const _0x57879f = new Sphere();
  (_0xe694c9.getCenter(_0x57879f.center),
    (_0x57879f.radius = _0xe694c9.min.distanceTo(_0xe694c9.max) / 2),
    (_0xd69bd6.boundingSphere = _0x57879f));
}
function addPrimitiveAttributes(_0x1251f8, _0x306665, _0xf9c0c9) {
  const _0x23d333 = _0x306665.attributes,
    _0x58f4ab = [];
  function _0x431b22(_0x296d46, _0x1f369e) {
    return _0xf9c0c9.getDependency('accessor', _0x296d46).then(function (_0xa36c54) {
      _0x1251f8.setAttribute(_0x1f369e, _0xa36c54);
    });
  }
  for (const _0x2015af in _0x23d333) {
    const _0x48351b = ATTRIBUTES[_0x2015af] || _0x2015af.toLowerCase();
    if (_0x48351b in _0x1251f8.attributes) continue;
    _0x58f4ab.push(_0x431b22(_0x23d333[_0x2015af], _0x48351b));
  }
  if (_0x306665.indices !== undefined && !_0x1251f8.index) {
    const _0x3a6a3d = _0xf9c0c9.getDependency('accessor', _0x306665.indices).then(function (_0x18cc5e) {
      _0x1251f8.setIndex(_0x18cc5e);
    });
    _0x58f4ab.push(_0x3a6a3d);
  }
  return (
    ColorManagement.workingColorSpace !== LinearSRGBColorSpace &&
      'COLOR_0' in _0x23d333 &&
      console.warn(
        'THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "' +
          ColorManagement.workingColorSpace +
          '" not supported.',
      ),
    assignExtrasToUserData(_0x1251f8, _0x306665),
    computeBounds(_0x1251f8, _0x306665, _0xf9c0c9),
    Promise.all(_0x58f4ab).then(function () {
      return _0x306665.targets !== undefined
        ? addMorphTargets(_0x1251f8, _0x306665.targets, _0xf9c0c9)
        : _0x1251f8;
    })
  );
}
export { GLTFLoader };
