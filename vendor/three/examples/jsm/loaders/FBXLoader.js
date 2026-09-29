import {
  AmbientLight,
  AnimationClip,
  Bone,
  BufferGeometry,
  ClampToEdgeWrapping,
  Color,
  ColorManagement,
  DirectionalLight,
  EquirectangularReflectionMapping,
  Euler,
  FileLoader,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
  Loader,
  LoaderUtils,
  MathUtils,
  Matrix3,
  Matrix4,
  Mesh,
  MeshLambertMaterial,
  MeshPhongMaterial,
  NumberKeyframeTrack,
  Object3D,
  PerspectiveCamera,
  PointLight,
  PropertyBinding,
  Quaternion,
  QuaternionKeyframeTrack,
  RepeatWrapping,
  SRGBColorSpace,
  ShapeUtils,
  Skeleton,
  SkinnedMesh,
  SpotLight,
  Texture,
  TextureLoader,
  Uint16BufferAttribute,
  Vector2,
  Vector3,
  Vector4,
  VectorKeyframeTrack,
} from '../../../three.module.js';
import * as fflate_module from '../libs/fflate.module.js';
import { NURBSCurve } from '../curves/NURBSCurve.js';
let fbxTree, connections, sceneGraph;
class FBXLoader extends Loader {
  constructor(_0x1d2960) {
    super(_0x1d2960);
  }
  ['load'](_0x509f9a, _0x2e55c4, _0x466d96, _0x26e95f) {
    const _0x46be83 = this,
      _0x560a0b = _0x46be83['path'] === '' ? LoaderUtils['extractUrlBase'](_0x509f9a) : _0x46be83['path'],
      _0x42015f = new FileLoader(this['manager']);
    (_0x42015f['setPath'](_0x46be83['path']),
      _0x42015f['setResponseType']('arraybuffer'),
      _0x42015f['setRequestHeader'](_0x46be83['requestHeader']),
      _0x42015f['setWithCredentials'](_0x46be83['withCredentials']),
      _0x42015f['load'](
        _0x509f9a,
        function (_0x21cc9c) {
          try {
            _0x2e55c4(_0x46be83['parse'](_0x21cc9c, _0x560a0b));
          } catch (_0x5e9c71) {
            (_0x26e95f ? _0x26e95f(_0x5e9c71) : console['error'](_0x5e9c71),
              _0x46be83['manager']['itemError'](_0x509f9a));
          }
        },
        _0x466d96,
        _0x26e95f,
      ));
  }
  ['parse'](_0xe498a3, _0x4c25a9) {
    if (isFbxFormatBinary(_0xe498a3)) fbxTree = new BinaryParser()['parse'](_0xe498a3);
    else {
      const _0x3f0594 = convertArrayBufferToString(_0xe498a3);
      if (!isFbxFormatASCII(_0x3f0594)) throw new Error('THREE.FBXLoader: Unknown format.');
      if (getFbxVersion(_0x3f0594) < 0x1b58)
        throw new Error(
          'THREE.FBXLoader:\x20FBX\x20version\x20not\x20supported,\x20FileVersion:\x20' +
            getFbxVersion(_0x3f0594),
        );
      fbxTree = new TextParser()['parse'](_0x3f0594);
    }
    const _0xe9f724 = new TextureLoader(this['manager'])
      ['setPath'](this['resourcePath'] || _0x4c25a9)
      ['setCrossOrigin'](this['crossOrigin']);
    return new FBXTreeParser(_0xe9f724, this['manager'])['parse'](fbxTree);
  }
}
class FBXTreeParser {
  constructor(_0x3ced03, _0x8ba2df) {
    ((this['textureLoader'] = _0x3ced03), (this['manager'] = _0x8ba2df));
  }
  ['parse']() {
    connections = this['parseConnections']();
    const _0x22c575 = this['parseImages'](),
      _0x1285a4 = this['parseTextures'](_0x22c575),
      _0x18f563 = this['parseMaterials'](_0x1285a4),
      _0x31f91d = this['parseDeformers'](),
      _0x5a6e26 = new GeometryParser()['parse'](_0x31f91d);
    return (this['parseScene'](_0x31f91d, _0x5a6e26, _0x18f563), sceneGraph);
  }
  ['parseConnections']() {
    const _0x40204b = new Map();
    if ('Connections' in fbxTree) {
      const _0x23b98d = fbxTree['Connections']['connections'];
      _0x23b98d['forEach'](function (_0x8bbaec) {
        const _0x5881aa = _0x8bbaec[0x0],
          _0x2efd84 = _0x8bbaec[0x1],
          _0x2bfecb = _0x8bbaec[0x2];
        !_0x40204b['has'](_0x5881aa) && _0x40204b['set'](_0x5881aa, { parents: [], children: [] });
        const _0x25345b = { ID: _0x2efd84, relationship: _0x2bfecb };
        _0x40204b['get'](_0x5881aa)['parents']['push'](_0x25345b);
        !_0x40204b['has'](_0x2efd84) && _0x40204b['set'](_0x2efd84, { parents: [], children: [] });
        const _0x20d5f1 = { ID: _0x5881aa, relationship: _0x2bfecb };
        _0x40204b['get'](_0x2efd84)['children']['push'](_0x20d5f1);
      });
    }
    return _0x40204b;
  }
  ['parseImages']() {
    const _0x5a272 = {},
      _0x3cc351 = {};
    if ('Video' in fbxTree['Objects']) {
      const _0x7c50fd = fbxTree['Objects']['Video'];
      for (const _0x82f9d7 in _0x7c50fd) {
        const _0x570cfe = _0x7c50fd[_0x82f9d7],
          _0x3ee661 = parseInt(_0x82f9d7);
        _0x5a272[_0x3ee661] = _0x570cfe['RelativeFilename'] || _0x570cfe['Filename'];
        if ('Content' in _0x570cfe) {
          const _0x353439 =
              _0x570cfe['Content'] instanceof ArrayBuffer && _0x570cfe['Content']['byteLength'] > 0x0,
            _0x3980c2 = typeof _0x570cfe['Content'] === 'string' && _0x570cfe['Content'] !== '';
          if (_0x353439 || _0x3980c2) {
            const _0x420ad4 = this['parseImage'](_0x7c50fd[_0x82f9d7]);
            _0x3cc351[_0x570cfe['RelativeFilename'] || _0x570cfe['Filename']] = _0x420ad4;
          }
        }
      }
    }
    for (const _0x6128b2 in _0x5a272) {
      const _0x2545b5 = _0x5a272[_0x6128b2];
      if (_0x3cc351[_0x2545b5] !== undefined) _0x5a272[_0x6128b2] = _0x3cc351[_0x2545b5];
      else _0x5a272[_0x6128b2] = _0x5a272[_0x6128b2]['split']('\x5c')['pop']();
    }
    return _0x5a272;
  }
  ['parseImage'](_0x490fd1) {
    const _0x249ec5 = _0x490fd1['Content'],
      _0x35dbc2 = _0x490fd1['RelativeFilename'] || _0x490fd1['Filename'],
      _0x20960e = _0x35dbc2['slice'](_0x35dbc2['lastIndexOf']('.') + 0x1)['toLowerCase']();
    let _0x2a3fb3;
    switch (_0x20960e) {
      case 'bmp':
        _0x2a3fb3 = 'image/bmp';
        break;
      case 'jpg':
      case 'jpeg':
        _0x2a3fb3 = 'image/jpeg';
        break;
      case 'png':
        _0x2a3fb3 = 'image/png';
        break;
      case 'tif':
        _0x2a3fb3 = 'image/tiff';
        break;
      case 'tga':
        this['manager']['getHandler']('.tga') === null &&
          console['warn']('FBXLoader: TGA loader not found, skipping ', _0x35dbc2);
        _0x2a3fb3 = 'image/tga';
        break;
      case 'webp':
        _0x2a3fb3 = 'image/webp';
        break;
      default:
        console['warn']('FBXLoader: Image type "' + _0x20960e + '\x22\x20is\x20not\x20supported.');
        return;
    }
    if (typeof _0x249ec5 === 'string') return 'data:' + _0x2a3fb3 + ';base64,' + _0x249ec5;
    else {
      const _0xfb01ac = new Uint8Array(_0x249ec5);
      return window['URL']['createObjectURL'](new Blob([_0xfb01ac], { type: _0x2a3fb3 }));
    }
  }
  ['parseTextures'](_0x8438ac) {
    const _0x1b457f = new Map();
    if ('Texture' in fbxTree['Objects']) {
      const _0x12026c = fbxTree['Objects']['Texture'];
      for (const _0x15699d in _0x12026c) {
        const _0x9416d4 = this['parseTexture'](_0x12026c[_0x15699d], _0x8438ac);
        _0x1b457f['set'](parseInt(_0x15699d), _0x9416d4);
      }
    }
    return _0x1b457f;
  }
  ['parseTexture'](_0x368630, _0x21d333) {
    const _0x493f6c = this['loadTexture'](_0x368630, _0x21d333);
    ((_0x493f6c['ID'] = _0x368630['id']), (_0x493f6c['name'] = _0x368630['attrName']));
    const _0x381ef0 = _0x368630['WrapModeU'],
      _0x1ee76a = _0x368630['WrapModeV'],
      _0x2f938c = _0x381ef0 !== undefined ? _0x381ef0['value'] : 0x0,
      _0x54cda2 = _0x1ee76a !== undefined ? _0x1ee76a['value'] : 0x0;
    ((_0x493f6c['wrapS'] = _0x2f938c === 0x0 ? RepeatWrapping : ClampToEdgeWrapping),
      (_0x493f6c['wrapT'] = _0x54cda2 === 0x0 ? RepeatWrapping : ClampToEdgeWrapping));
    if ('Scaling' in _0x368630) {
      const _0x22adfd = _0x368630['Scaling']['value'];
      ((_0x493f6c['repeat']['x'] = _0x22adfd[0x0]), (_0x493f6c['repeat']['y'] = _0x22adfd[0x1]));
    }
    if ('Translation' in _0x368630) {
      const _0x9519ec = _0x368630['Translation']['value'];
      ((_0x493f6c['offset']['x'] = _0x9519ec[0x0]), (_0x493f6c['offset']['y'] = _0x9519ec[0x1]));
    }
    return _0x493f6c;
  }
  ['loadTexture'](_0x3732d8, _0xe2cefc) {
    const _0x58ff5c = _0x3732d8['FileName']['split']('.')['pop']()['toLowerCase']();
    let _0x3ab331 = this['manager']['getHandler']('.' + _0x58ff5c);
    if (_0x3ab331 === null) _0x3ab331 = this['textureLoader'];
    const _0x43fcc1 = _0x3ab331['path'];
    !_0x43fcc1 && _0x3ab331['setPath'](this['textureLoader']['path']);
    const _0xc75dbe = connections['get'](_0x3732d8['id'])['children'];
    let _0x1e0817;
    _0xc75dbe !== undefined &&
      _0xc75dbe['length'] > 0x0 &&
      _0xe2cefc[_0xc75dbe[0x0]['ID']] !== undefined &&
      ((_0x1e0817 = _0xe2cefc[_0xc75dbe[0x0]['ID']]),
      (_0x1e0817['indexOf']('blob:') === 0x0 || _0x1e0817['indexOf']('data:') === 0x0) &&
        _0x3ab331['setPath'](undefined));
    if (_0x1e0817 === undefined)
      return (console['warn']('FBXLoader: Undefined filename, creating placeholder texture.'), new Texture());
    const _0x2ae459 = _0x3ab331['load'](_0x1e0817);
    return (_0x3ab331['setPath'](_0x43fcc1), _0x2ae459);
  }
  ['parseMaterials'](_0x35a452) {
    const _0x2fbb5c = new Map();
    if ('Material' in fbxTree['Objects']) {
      const _0x47d3bd = fbxTree['Objects']['Material'];
      for (const _0x1bc7c1 in _0x47d3bd) {
        const _0x26bad7 = this['parseMaterial'](_0x47d3bd[_0x1bc7c1], _0x35a452);
        if (_0x26bad7 !== null) _0x2fbb5c['set'](parseInt(_0x1bc7c1), _0x26bad7);
      }
    }
    return _0x2fbb5c;
  }
  ['parseMaterial'](_0xe3b696, _0x22ef27) {
    const _0xd22f8a = _0xe3b696['id'],
      _0xc52a22 = _0xe3b696['attrName'];
    let _0x1b4bb3 = _0xe3b696['ShadingModel'];
    typeof _0x1b4bb3 === 'object' && (_0x1b4bb3 = _0x1b4bb3['value']);
    if (!connections['has'](_0xd22f8a)) return null;
    const _0x43ae5f = this['parseParameters'](_0xe3b696, _0x22ef27, _0xd22f8a);
    let _0x3ee343;
    switch (_0x1b4bb3['toLowerCase']()) {
      case 'phong':
        _0x3ee343 = new MeshPhongMaterial();
        break;
      case 'lambert':
        _0x3ee343 = new MeshLambertMaterial();
        break;
      default:
        (console['warn'](
          'THREE.FBXLoader: unknown material type "%s". Defaulting to MeshPhongMaterial.',
          _0x1b4bb3,
        ),
          (_0x3ee343 = new MeshPhongMaterial()));
        break;
    }
    return (_0x3ee343['setValues'](_0x43ae5f), (_0x3ee343['name'] = _0xc52a22), _0x3ee343);
  }
  ['parseParameters'](_0x768f0a, _0x4c5723, _0x5db8a3) {
    const _0x2a2839 = {};
    _0x768f0a['BumpFactor'] && (_0x2a2839['bumpScale'] = _0x768f0a['BumpFactor']['value']);
    if (_0x768f0a['Diffuse'])
      _0x2a2839['color'] = ColorManagement['colorSpaceToWorking'](
        new Color()['fromArray'](_0x768f0a['Diffuse']['value']),
        SRGBColorSpace,
      );
    else
      _0x768f0a['DiffuseColor'] &&
        (_0x768f0a['DiffuseColor']['type'] === 'Color' || _0x768f0a['DiffuseColor']['type'] === 'ColorRGB') &&
        (_0x2a2839['color'] = ColorManagement['colorSpaceToWorking'](
          new Color()['fromArray'](_0x768f0a['DiffuseColor']['value']),
          SRGBColorSpace,
        ));
    _0x768f0a['DisplacementFactor'] &&
      (_0x2a2839['displacementScale'] = _0x768f0a['DisplacementFactor']['value']);
    if (_0x768f0a['Emissive'])
      _0x2a2839['emissive'] = ColorManagement['colorSpaceToWorking'](
        new Color()['fromArray'](_0x768f0a['Emissive']['value']),
        SRGBColorSpace,
      );
    else
      _0x768f0a['EmissiveColor'] &&
        (_0x768f0a['EmissiveColor']['type'] === 'Color' ||
          _0x768f0a['EmissiveColor']['type'] === 'ColorRGB') &&
        (_0x2a2839['emissive'] = ColorManagement['colorSpaceToWorking'](
          new Color()['fromArray'](_0x768f0a['EmissiveColor']['value']),
          SRGBColorSpace,
        ));
    _0x768f0a['EmissiveFactor'] &&
      (_0x2a2839['emissiveIntensity'] = parseFloat(_0x768f0a['EmissiveFactor']['value']));
    _0x2a2839['opacity'] =
      0x1 - (_0x768f0a['TransparencyFactor'] ? parseFloat(_0x768f0a['TransparencyFactor']['value']) : 0x0);
    (_0x2a2839['opacity'] === 0x1 || _0x2a2839['opacity'] === 0x0) &&
      ((_0x2a2839['opacity'] = _0x768f0a['Opacity'] ? parseFloat(_0x768f0a['Opacity']['value']) : null),
      _0x2a2839['opacity'] === null &&
        (_0x2a2839['opacity'] =
          0x1 -
          (_0x768f0a['TransparentColor'] ? parseFloat(_0x768f0a['TransparentColor']['value'][0x0]) : 0x0)));
    _0x2a2839['opacity'] < 0x1 && (_0x2a2839['transparent'] = !![]);
    _0x768f0a['ReflectionFactor'] && (_0x2a2839['reflectivity'] = _0x768f0a['ReflectionFactor']['value']);
    _0x768f0a['Shininess'] && (_0x2a2839['shininess'] = _0x768f0a['Shininess']['value']);
    if (_0x768f0a['Specular'])
      _0x2a2839['specular'] = ColorManagement['colorSpaceToWorking'](
        new Color()['fromArray'](_0x768f0a['Specular']['value']),
        SRGBColorSpace,
      );
    else
      _0x768f0a['SpecularColor'] &&
        _0x768f0a['SpecularColor']['type'] === 'Color' &&
        (_0x2a2839['specular'] = ColorManagement['colorSpaceToWorking'](
          new Color()['fromArray'](_0x768f0a['SpecularColor']['value']),
          SRGBColorSpace,
        ));
    const _0x41f034 = this;
    return (
      connections['get'](_0x5db8a3)['children']['forEach'](function (_0x4e77d1) {
        const _0x3c2143 = _0x4e77d1['relationship'];
        switch (_0x3c2143) {
          case 'Bump':
            _0x2a2839['bumpMap'] = _0x41f034['getTexture'](_0x4c5723, _0x4e77d1['ID']);
            break;
          case 'Maya|TEX_ao_map':
            _0x2a2839['aoMap'] = _0x41f034['getTexture'](_0x4c5723, _0x4e77d1['ID']);
            break;
          case 'DiffuseColor':
          case 'Maya|TEX_color_map':
            _0x2a2839['map'] = _0x41f034['getTexture'](_0x4c5723, _0x4e77d1['ID']);
            _0x2a2839['map'] !== undefined && (_0x2a2839['map']['colorSpace'] = SRGBColorSpace);
            break;
          case 'DisplacementColor':
            _0x2a2839['displacementMap'] = _0x41f034['getTexture'](_0x4c5723, _0x4e77d1['ID']);
            break;
          case 'EmissiveColor':
            _0x2a2839['emissiveMap'] = _0x41f034['getTexture'](_0x4c5723, _0x4e77d1['ID']);
            _0x2a2839['emissiveMap'] !== undefined &&
              (_0x2a2839['emissiveMap']['colorSpace'] = SRGBColorSpace);
            break;
          case 'NormalMap':
          case 'Maya|TEX_normal_map':
            _0x2a2839['normalMap'] = _0x41f034['getTexture'](_0x4c5723, _0x4e77d1['ID']);
            break;
          case 'ReflectionColor':
            _0x2a2839['envMap'] = _0x41f034['getTexture'](_0x4c5723, _0x4e77d1['ID']);
            _0x2a2839['envMap'] !== undefined &&
              ((_0x2a2839['envMap']['mapping'] = EquirectangularReflectionMapping),
              (_0x2a2839['envMap']['colorSpace'] = SRGBColorSpace));
            break;
          case 'SpecularColor':
            _0x2a2839['specularMap'] = _0x41f034['getTexture'](_0x4c5723, _0x4e77d1['ID']);
            _0x2a2839['specularMap'] !== undefined &&
              (_0x2a2839['specularMap']['colorSpace'] = SRGBColorSpace);
            break;
          case 'TransparentColor':
          case 'TransparencyFactor':
            ((_0x2a2839['alphaMap'] = _0x41f034['getTexture'](_0x4c5723, _0x4e77d1['ID'])),
              (_0x2a2839['transparent'] = !![]));
            break;
          case 'AmbientColor':
          case 'ShininessExponent':
          case 'SpecularFactor':
          case 'VectorDisplacementColor':
          default:
            console['warn'](
              'THREE.FBXLoader: %s map is not supported in three.js, skipping texture.',
              _0x3c2143,
            );
            break;
        }
      }),
      _0x2a2839
    );
  }
  ['getTexture'](_0x139a36, _0x51a992) {
    return (
      'LayeredTexture' in fbxTree['Objects'] &&
        _0x51a992 in fbxTree['Objects']['LayeredTexture'] &&
        (console['warn'](
          'THREE.FBXLoader: layered textures are not supported in three.js. Discarding all but first layer.',
        ),
        (_0x51a992 = connections['get'](_0x51a992)['children'][0x0]['ID'])),
      _0x139a36['get'](_0x51a992)
    );
  }
  ['parseDeformers']() {
    const _0x41a94d = {},
      _0x499cfb = {};
    if ('Deformer' in fbxTree['Objects']) {
      const _0x844710 = fbxTree['Objects']['Deformer'];
      for (const _0x1991c4 in _0x844710) {
        const _0x50294c = _0x844710[_0x1991c4],
          _0x498486 = connections['get'](parseInt(_0x1991c4));
        if (_0x50294c['attrType'] === 'Skin') {
          const _0xf75520 = this['parseSkeleton'](_0x498486, _0x844710);
          _0xf75520['ID'] = _0x1991c4;
          if (_0x498486['parents']['length'] > 0x1)
            console['warn'](
              'THREE.FBXLoader:\x20skeleton\x20attached\x20to\x20more\x20than\x20one\x20geometry\x20is\x20not\x20supported.',
            );
          ((_0xf75520['geometryID'] = _0x498486['parents'][0x0]['ID']), (_0x41a94d[_0x1991c4] = _0xf75520));
        } else {
          if (_0x50294c['attrType'] === 'BlendShape') {
            const _0x399e7f = { id: _0x1991c4 };
            ((_0x399e7f['rawTargets'] = this['parseMorphTargets'](_0x498486, _0x844710)),
              (_0x399e7f['id'] = _0x1991c4));
            if (_0x498486['parents']['length'] > 0x1)
              console['warn'](
                'THREE.FBXLoader: morph target attached to more than one geometry is not supported.',
              );
            _0x499cfb[_0x1991c4] = _0x399e7f;
          }
        }
      }
    }
    return { skeletons: _0x41a94d, morphTargets: _0x499cfb };
  }
  ['parseSkeleton'](_0x3ec700, _0x1ca596) {
    const _0x57389f = [];
    return (
      _0x3ec700['children']['forEach'](function (_0x1f0d15) {
        const _0x54f5a8 = _0x1ca596[_0x1f0d15['ID']];
        if (_0x54f5a8['attrType'] !== 'Cluster') return;
        const _0x23e5ee = {
          ID: _0x1f0d15['ID'],
          indices: [],
          weights: [],
          transformLink: new Matrix4()['fromArray'](_0x54f5a8['TransformLink']['a']),
        };
        ('Indexes' in _0x54f5a8 &&
          ((_0x23e5ee['indices'] = _0x54f5a8['Indexes']['a']),
          (_0x23e5ee['weights'] = _0x54f5a8['Weights']['a'])),
          _0x57389f['push'](_0x23e5ee));
      }),
      { rawBones: _0x57389f, bones: [] }
    );
  }
  ['parseMorphTargets'](_0x2d3d86, _0x42d925) {
    const _0x5b10b5 = [];
    for (let _0x57fdf5 = 0x0; _0x57fdf5 < _0x2d3d86['children']['length']; _0x57fdf5++) {
      const _0x3d492c = _0x2d3d86['children'][_0x57fdf5],
        _0xd2d2bb = _0x42d925[_0x3d492c['ID']],
        _0x4b1a5c = {
          name: _0xd2d2bb['attrName'],
          initialWeight: _0xd2d2bb['DeformPercent'],
          id: _0xd2d2bb['id'],
          fullWeights: _0xd2d2bb['FullWeights']['a'],
        };
      if (_0xd2d2bb['attrType'] !== 'BlendShapeChannel') return;
      ((_0x4b1a5c['geoID'] = connections['get'](parseInt(_0x3d492c['ID']))['children']['filter'](
        function (_0x1d3b68) {
          return _0x1d3b68['relationship'] === undefined;
        },
      )[0x0]['ID']),
        _0x5b10b5['push'](_0x4b1a5c));
    }
    return _0x5b10b5;
  }
  ['parseScene'](_0x3440e9, _0x3e7480, _0x35cf22) {
    sceneGraph = new Group();
    const _0x1cf0e7 = this['parseModels'](_0x3440e9['skeletons'], _0x3e7480, _0x35cf22),
      _0x3d9713 = fbxTree['Objects']['Model'],
      _0x2d2ed7 = this;
    (_0x1cf0e7['forEach'](function (_0x471c69) {
      const _0x3c16a3 = _0x3d9713[_0x471c69['ID']];
      _0x2d2ed7['setLookAtProperties'](_0x471c69, _0x3c16a3);
      const _0xd7143d = connections['get'](_0x471c69['ID'])['parents'];
      (_0xd7143d['forEach'](function (_0x2a246b) {
        const _0xf4f02b = _0x1cf0e7['get'](_0x2a246b['ID']);
        if (_0xf4f02b !== undefined) _0xf4f02b['add'](_0x471c69);
      }),
        _0x471c69['parent'] === null && sceneGraph['add'](_0x471c69));
    }),
      this['bindSkeleton'](_0x3440e9['skeletons'], _0x3e7480, _0x1cf0e7),
      this['addGlobalSceneSettings'](),
      sceneGraph['traverse'](function (_0x8428df) {
        if (_0x8428df['userData']['transformData']) {
          _0x8428df['parent'] &&
            ((_0x8428df['userData']['transformData']['parentMatrix'] = _0x8428df['parent']['matrix']),
            (_0x8428df['userData']['transformData']['parentMatrixWorld'] =
              _0x8428df['parent']['matrixWorld']));
          const _0x59287c = generateTransform(_0x8428df['userData']['transformData']);
          (_0x8428df['applyMatrix4'](_0x59287c), _0x8428df['updateWorldMatrix']());
        }
      }));
    const _0x4ad9e8 = new AnimationParser()['parse']();
    (sceneGraph['children']['length'] === 0x1 &&
      sceneGraph['children'][0x0]['isGroup'] &&
      ((sceneGraph['children'][0x0]['animations'] = _0x4ad9e8), (sceneGraph = sceneGraph['children'][0x0])),
      (sceneGraph['animations'] = _0x4ad9e8));
  }
  ['parseModels'](_0x153fd5, _0x2f6f86, _0x2cca6a) {
    const _0x1c741d = new Map(),
      _0x3f6d2b = fbxTree['Objects']['Model'];
    for (const _0x3dd974 in _0x3f6d2b) {
      const _0x56bf7e = parseInt(_0x3dd974),
        _0x1ea327 = _0x3f6d2b[_0x3dd974],
        _0x4df9e4 = connections['get'](_0x56bf7e);
      let _0x410549 = this['buildSkeleton'](_0x4df9e4, _0x153fd5, _0x56bf7e, _0x1ea327['attrName']);
      if (!_0x410549) {
        switch (_0x1ea327['attrType']) {
          case 'Camera':
            _0x410549 = this['createCamera'](_0x4df9e4);
            break;
          case 'Light':
            _0x410549 = this['createLight'](_0x4df9e4);
            break;
          case 'Mesh':
            _0x410549 = this['createMesh'](_0x4df9e4, _0x2f6f86, _0x2cca6a);
            break;
          case 'NurbsCurve':
            _0x410549 = this['createCurve'](_0x4df9e4, _0x2f6f86);
            break;
          case 'LimbNode':
          case 'Root':
            _0x410549 = new Bone();
            break;
          case 'Null':
          default:
            _0x410549 = new Group();
            break;
        }
        ((_0x410549['name'] = _0x1ea327['attrName']
          ? PropertyBinding['sanitizeNodeName'](_0x1ea327['attrName'])
          : ''),
          (_0x410549['userData']['originalName'] = _0x1ea327['attrName']),
          (_0x410549['ID'] = _0x56bf7e));
      }
      (this['getTransformData'](_0x410549, _0x1ea327), _0x1c741d['set'](_0x56bf7e, _0x410549));
    }
    return _0x1c741d;
  }
  ['buildSkeleton'](_0x4f381b, _0x3977fe, _0x4b01aa, _0x40ab5a) {
    let _0x5ab0fd = null;
    return (
      _0x4f381b['parents']['forEach'](function (_0x4efa76) {
        for (const _0x583dba in _0x3977fe) {
          const _0xfe0e44 = _0x3977fe[_0x583dba];
          _0xfe0e44['rawBones']['forEach'](function (_0x3d67ab, _0x4b762a) {
            if (_0x3d67ab['ID'] === _0x4efa76['ID']) {
              const _0x172c84 = _0x5ab0fd;
              ((_0x5ab0fd = new Bone()),
                _0x5ab0fd['matrixWorld']['copy'](_0x3d67ab['transformLink']),
                (_0x5ab0fd['name'] = _0x40ab5a ? PropertyBinding['sanitizeNodeName'](_0x40ab5a) : ''),
                (_0x5ab0fd['userData']['originalName'] = _0x40ab5a),
                (_0x5ab0fd['ID'] = _0x4b01aa),
                (_0xfe0e44['bones'][_0x4b762a] = _0x5ab0fd),
                _0x172c84 !== null && _0x5ab0fd['add'](_0x172c84));
            }
          });
        }
      }),
      _0x5ab0fd
    );
  }
  ['createCamera'](_0x2db618) {
    let _0x26365b, _0xff5e90;
    _0x2db618['children']['forEach'](function (_0x3a24ec) {
      const _0x25bc6c = fbxTree['Objects']['NodeAttribute'][_0x3a24ec['ID']];
      _0x25bc6c !== undefined && (_0xff5e90 = _0x25bc6c);
    });
    if (_0xff5e90 === undefined) _0x26365b = new Object3D();
    else {
      let _0x583dbf = 0x0;
      _0xff5e90['CameraProjectionType'] !== undefined &&
        _0xff5e90['CameraProjectionType']['value'] === 0x1 &&
        (_0x583dbf = 0x1);
      let _0x53bd56 = 0x1;
      _0xff5e90['NearPlane'] !== undefined && (_0x53bd56 = _0xff5e90['NearPlane']['value'] / 0x3e8);
      let _0x4b6ef9 = 0x3e8;
      _0xff5e90['FarPlane'] !== undefined && (_0x4b6ef9 = _0xff5e90['FarPlane']['value'] / 0x3e8);
      let _0x411db3 = window['innerWidth'],
        _0x367e04 = window['innerHeight'];
      _0xff5e90['AspectWidth'] !== undefined &&
        _0xff5e90['AspectHeight'] !== undefined &&
        ((_0x411db3 = _0xff5e90['AspectWidth']['value']), (_0x367e04 = _0xff5e90['AspectHeight']['value']));
      const _0x161391 = _0x411db3 / _0x367e04;
      let _0x51785d = 0x2d;
      _0xff5e90['FieldOfView'] !== undefined && (_0x51785d = _0xff5e90['FieldOfView']['value']);
      const _0x31d924 = _0xff5e90['FocalLength'] ? _0xff5e90['FocalLength']['value'] : null;
      switch (_0x583dbf) {
        case 0x0:
          _0x26365b = new PerspectiveCamera(_0x51785d, _0x161391, _0x53bd56, _0x4b6ef9);
          if (_0x31d924 !== null) _0x26365b['setFocalLength'](_0x31d924);
          break;
        case 0x1:
          (console['warn']('THREE.FBXLoader: Orthographic cameras not supported yet.'),
            (_0x26365b = new Object3D()));
          break;
        default:
          (console['warn']('THREE.FBXLoader: Unknown camera type ' + _0x583dbf + '.'),
            (_0x26365b = new Object3D()));
          break;
      }
    }
    return _0x26365b;
  }
  ['createLight'](_0x5ac384) {
    let _0x9f5053, _0x42851d;
    _0x5ac384['children']['forEach'](function (_0x17971c) {
      const _0x4e0206 = fbxTree['Objects']['NodeAttribute'][_0x17971c['ID']];
      _0x4e0206 !== undefined && (_0x42851d = _0x4e0206);
    });
    if (_0x42851d === undefined) _0x9f5053 = new Object3D();
    else {
      let _0x501e8a;
      _0x42851d['LightType'] === undefined
        ? (_0x501e8a = 0x0)
        : (_0x501e8a = _0x42851d['LightType']['value']);
      let _0x4f8420 = 0xffffff;
      _0x42851d['Color'] !== undefined &&
        (_0x4f8420 = ColorManagement['colorSpaceToWorking'](
          new Color()['fromArray'](_0x42851d['Color']['value']),
          SRGBColorSpace,
        ));
      let _0xcd75d6 = _0x42851d['Intensity'] === undefined ? 0x1 : _0x42851d['Intensity']['value'] / 0x64;
      _0x42851d['CastLightOnObject'] !== undefined &&
        _0x42851d['CastLightOnObject']['value'] === 0x0 &&
        (_0xcd75d6 = 0x0);
      let _0x1cebb7 = 0x0;
      _0x42851d['FarAttenuationEnd'] !== undefined &&
        (_0x42851d['EnableFarAttenuation'] !== undefined && _0x42851d['EnableFarAttenuation']['value'] === 0x0
          ? (_0x1cebb7 = 0x0)
          : (_0x1cebb7 = _0x42851d['FarAttenuationEnd']['value']));
      const _0x4caa0d = 0x1;
      switch (_0x501e8a) {
        case 0x0:
          _0x9f5053 = new PointLight(_0x4f8420, _0xcd75d6, _0x1cebb7, _0x4caa0d);
          break;
        case 0x1:
          _0x9f5053 = new DirectionalLight(_0x4f8420, _0xcd75d6);
          break;
        case 0x2:
          let _0xf79d16 = Math['PI'] / 0x3;
          _0x42851d['InnerAngle'] !== undefined &&
            (_0xf79d16 = MathUtils['degToRad'](_0x42851d['InnerAngle']['value']));
          let _0x23a371 = 0x0;
          _0x42851d['OuterAngle'] !== undefined &&
            ((_0x23a371 = MathUtils['degToRad'](_0x42851d['OuterAngle']['value'])),
            (_0x23a371 = Math['max'](_0x23a371, 0x1)));
          _0x9f5053 = new SpotLight(_0x4f8420, _0xcd75d6, _0x1cebb7, _0xf79d16, _0x23a371, _0x4caa0d);
          break;
        default:
          (console['warn'](
            'THREE.FBXLoader: Unknown light type ' +
              _0x42851d['LightType']['value'] +
              ', defaulting to a PointLight.',
          ),
            (_0x9f5053 = new PointLight(_0x4f8420, _0xcd75d6)));
          break;
      }
      _0x42851d['CastShadows'] !== undefined &&
        _0x42851d['CastShadows']['value'] === 0x1 &&
        (_0x9f5053['castShadow'] = !![]);
    }
    return _0x9f5053;
  }
  ['createMesh'](_0x509233, _0x29f4a7, _0x52b9da) {
    let _0x5104a2,
      _0x1f7601 = null,
      _0x4199d1 = null;
    const _0x36deda = [];
    _0x509233['children']['forEach'](function (_0x8dfe6b) {
      (_0x29f4a7['has'](_0x8dfe6b['ID']) && (_0x1f7601 = _0x29f4a7['get'](_0x8dfe6b['ID'])),
        _0x52b9da['has'](_0x8dfe6b['ID']) && _0x36deda['push'](_0x52b9da['get'](_0x8dfe6b['ID'])));
    });
    if (_0x36deda['length'] > 0x1) _0x4199d1 = _0x36deda;
    else
      _0x36deda['length'] > 0x0
        ? (_0x4199d1 = _0x36deda[0x0])
        : ((_0x4199d1 = new MeshPhongMaterial({ name: Loader['DEFAULT_MATERIAL_NAME'], color: 0xcccccc })),
          _0x36deda['push'](_0x4199d1));
    'color' in _0x1f7601['attributes'] &&
      _0x36deda['forEach'](function (_0x4a498b) {
        _0x4a498b['vertexColors'] = !![];
      });
    if (_0x1f7601['groups']['length'] > 0x0) {
      let _0x20545a = ![];
      for (
        let _0x12c93e = 0x0, _0x2e2198 = _0x1f7601['groups']['length'];
        _0x12c93e < _0x2e2198;
        _0x12c93e++
      ) {
        const _0x1ba354 = _0x1f7601['groups'][_0x12c93e];
        (_0x1ba354['materialIndex'] < 0x0 || _0x1ba354['materialIndex'] >= _0x36deda['length']) &&
          ((_0x1ba354['materialIndex'] = _0x36deda['length']), (_0x20545a = !![]));
      }
      if (_0x20545a) {
        const _0xb7e54a = new MeshPhongMaterial();
        _0x36deda['push'](_0xb7e54a);
      }
    }
    return (
      _0x1f7601['FBX_Deformer']
        ? ((_0x5104a2 = new SkinnedMesh(_0x1f7601, _0x4199d1)), _0x5104a2['normalizeSkinWeights']())
        : (_0x5104a2 = new Mesh(_0x1f7601, _0x4199d1)),
      _0x5104a2
    );
  }
  ['createCurve'](_0x501ce2, _0x5900cc) {
    const _0x59d0fc = _0x501ce2['children']['reduce'](function (_0xd3767d, _0x5cbc87) {
        if (_0x5900cc['has'](_0x5cbc87['ID'])) _0xd3767d = _0x5900cc['get'](_0x5cbc87['ID']);
        return _0xd3767d;
      }, null),
      _0x5d4bc4 = new LineBasicMaterial({
        name: Loader['DEFAULT_MATERIAL_NAME'],
        color: 0x3300ff,
        linewidth: 0x1,
      });
    return new Line(_0x59d0fc, _0x5d4bc4);
  }
  ['getTransformData'](_0x5bd674, _0x5131ae) {
    const _0x559fb6 = {};
    if ('InheritType' in _0x5131ae) _0x559fb6['inheritType'] = parseInt(_0x5131ae['InheritType']['value']);
    if ('RotationOrder' in _0x5131ae)
      _0x559fb6['eulerOrder'] = getEulerOrder(_0x5131ae['RotationOrder']['value']);
    else _0x559fb6['eulerOrder'] = getEulerOrder(0x0);
    if ('Lcl_Translation' in _0x5131ae) _0x559fb6['translation'] = _0x5131ae['Lcl_Translation']['value'];
    if ('PreRotation' in _0x5131ae) _0x559fb6['preRotation'] = _0x5131ae['PreRotation']['value'];
    if ('Lcl_Rotation' in _0x5131ae) _0x559fb6['rotation'] = _0x5131ae['Lcl_Rotation']['value'];
    if ('PostRotation' in _0x5131ae) _0x559fb6['postRotation'] = _0x5131ae['PostRotation']['value'];
    if ('Lcl_Scaling' in _0x5131ae) _0x559fb6['scale'] = _0x5131ae['Lcl_Scaling']['value'];
    if ('ScalingOffset' in _0x5131ae) _0x559fb6['scalingOffset'] = _0x5131ae['ScalingOffset']['value'];
    if ('ScalingPivot' in _0x5131ae) _0x559fb6['scalingPivot'] = _0x5131ae['ScalingPivot']['value'];
    if ('RotationOffset' in _0x5131ae) _0x559fb6['rotationOffset'] = _0x5131ae['RotationOffset']['value'];
    if ('RotationPivot' in _0x5131ae) _0x559fb6['rotationPivot'] = _0x5131ae['RotationPivot']['value'];
    _0x5bd674['userData']['transformData'] = _0x559fb6;
  }
  ['setLookAtProperties'](_0x95a78d, _0x5a0ca4) {
    if ('LookAtProperty' in _0x5a0ca4) {
      const _0x3d7c20 = connections['get'](_0x95a78d['ID'])['children'];
      _0x3d7c20['forEach'](function (_0x11b3f1) {
        if (_0x11b3f1['relationship'] === 'LookAtProperty') {
          const _0x49314e = fbxTree['Objects']['Model'][_0x11b3f1['ID']];
          if ('Lcl_Translation' in _0x49314e) {
            const _0x51732f = _0x49314e['Lcl_Translation']['value'];
            _0x95a78d['target'] !== undefined
              ? (_0x95a78d['target']['position']['fromArray'](_0x51732f),
                sceneGraph['add'](_0x95a78d['target']))
              : _0x95a78d['lookAt'](new Vector3()['fromArray'](_0x51732f));
          }
        }
      });
    }
  }
  ['bindSkeleton'](_0x1db5ca, _0xc6de4b, _0x37dae1) {
    const _0x2bbf1c = this['parsePoseNodes']();
    for (const _0x49a9cd in _0x1db5ca) {
      const _0x15ee53 = _0x1db5ca[_0x49a9cd],
        _0x26201d = connections['get'](parseInt(_0x15ee53['ID']))['parents'];
      _0x26201d['forEach'](function (_0x1a4511) {
        if (_0xc6de4b['has'](_0x1a4511['ID'])) {
          const _0x119837 = _0x1a4511['ID'],
            _0x4f9ab6 = connections['get'](_0x119837);
          _0x4f9ab6['parents']['forEach'](function (_0x9b1811) {
            if (_0x37dae1['has'](_0x9b1811['ID'])) {
              const _0x57beb5 = _0x37dae1['get'](_0x9b1811['ID']);
              _0x57beb5['bind'](new Skeleton(_0x15ee53['bones']), _0x2bbf1c[_0x9b1811['ID']]);
            }
          });
        }
      });
    }
  }
  ['parsePoseNodes']() {
    const _0x5efb21 = {};
    if ('Pose' in fbxTree['Objects']) {
      const _0xf60a4e = fbxTree['Objects']['Pose'];
      for (const _0x42f5ce in _0xf60a4e) {
        if (_0xf60a4e[_0x42f5ce]['attrType'] === 'BindPose' && _0xf60a4e[_0x42f5ce]['NbPoseNodes'] > 0x0) {
          const _0x566aec = _0xf60a4e[_0x42f5ce]['PoseNode'];
          Array['isArray'](_0x566aec)
            ? _0x566aec['forEach'](function (_0x25fbc2) {
                _0x5efb21[_0x25fbc2['Node']] = new Matrix4()['fromArray'](_0x25fbc2['Matrix']['a']);
              })
            : (_0x5efb21[_0x566aec['Node']] = new Matrix4()['fromArray'](_0x566aec['Matrix']['a']));
        }
      }
    }
    return _0x5efb21;
  }
  ['addGlobalSceneSettings']() {
    if ('GlobalSettings' in fbxTree) {
      if ('AmbientColor' in fbxTree['GlobalSettings']) {
        const _0x479a80 = fbxTree['GlobalSettings']['AmbientColor']['value'],
          _0x577e6d = _0x479a80[0x0],
          _0x2185ec = _0x479a80[0x1],
          _0x42e4c5 = _0x479a80[0x2];
        if (_0x577e6d !== 0x0 || _0x2185ec !== 0x0 || _0x42e4c5 !== 0x0) {
          const _0x55f638 = new Color()['setRGB'](_0x577e6d, _0x2185ec, _0x42e4c5, SRGBColorSpace);
          sceneGraph['add'](new AmbientLight(_0x55f638, 0x1));
        }
      }
      'UnitScaleFactor' in fbxTree['GlobalSettings'] &&
        (sceneGraph['userData']['unitScaleFactor'] = fbxTree['GlobalSettings']['UnitScaleFactor']['value']);
    }
  }
}
class GeometryParser {
  constructor() {
    this['negativeMaterialIndices'] = ![];
  }
  ['parse'](_0x20e3ae) {
    const _0x2bdfa1 = new Map();
    if ('Geometry' in fbxTree['Objects']) {
      const _0x14579b = fbxTree['Objects']['Geometry'];
      for (const _0x3b1ce7 in _0x14579b) {
        const _0x3f2452 = connections['get'](parseInt(_0x3b1ce7)),
          _0x4ea5ef = this['parseGeometry'](_0x3f2452, _0x14579b[_0x3b1ce7], _0x20e3ae);
        _0x2bdfa1['set'](parseInt(_0x3b1ce7), _0x4ea5ef);
      }
    }
    return (
      this['negativeMaterialIndices'] === !![] &&
        console['warn'](
          'THREE.FBXLoader: The FBX file contains invalid (negative) material indices. The asset might not render as expected.',
        ),
      _0x2bdfa1
    );
  }
  ['parseGeometry'](_0x5a8219, _0x50cc9d, _0x29e14a) {
    switch (_0x50cc9d['attrType']) {
      case 'Mesh':
        return this['parseMeshGeometry'](_0x5a8219, _0x50cc9d, _0x29e14a);
        break;
      case 'NurbsCurve':
        return this['parseNurbsGeometry'](_0x50cc9d);
        break;
    }
  }
  ['parseMeshGeometry'](_0x4b77aa, _0x2f8447, _0x35c96d) {
    const _0x500f38 = _0x35c96d['skeletons'],
      _0x375339 = [],
      _0x37ace2 = _0x4b77aa['parents']['map'](function (_0x18270a) {
        return fbxTree['Objects']['Model'][_0x18270a['ID']];
      });
    if (_0x37ace2['length'] === 0x0) return;
    const _0x51a90f = _0x4b77aa['children']['reduce'](function (_0x3be108, _0x3fd34c) {
      if (_0x500f38[_0x3fd34c['ID']] !== undefined) _0x3be108 = _0x500f38[_0x3fd34c['ID']];
      return _0x3be108;
    }, null);
    _0x4b77aa['children']['forEach'](function (_0x9b3306) {
      _0x35c96d['morphTargets'][_0x9b3306['ID']] !== undefined &&
        _0x375339['push'](_0x35c96d['morphTargets'][_0x9b3306['ID']]);
    });
    const _0x33427f = _0x37ace2[0x0],
      _0x4fd1a1 = {};
    if ('RotationOrder' in _0x33427f)
      _0x4fd1a1['eulerOrder'] = getEulerOrder(_0x33427f['RotationOrder']['value']);
    if ('InheritType' in _0x33427f) _0x4fd1a1['inheritType'] = parseInt(_0x33427f['InheritType']['value']);
    if ('GeometricTranslation' in _0x33427f)
      _0x4fd1a1['translation'] = _0x33427f['GeometricTranslation']['value'];
    if ('GeometricRotation' in _0x33427f) _0x4fd1a1['rotation'] = _0x33427f['GeometricRotation']['value'];
    if ('GeometricScaling' in _0x33427f) _0x4fd1a1['scale'] = _0x33427f['GeometricScaling']['value'];
    const _0x18b75a = generateTransform(_0x4fd1a1);
    return this['genGeometry'](_0x2f8447, _0x51a90f, _0x375339, _0x18b75a);
  }
  ['genGeometry'](_0x5c185f, _0x278331, _0x21b25f, _0x197420) {
    const _0x22f9f9 = new BufferGeometry();
    if (_0x5c185f['attrName']) _0x22f9f9['name'] = _0x5c185f['attrName'];
    const _0x5e16c6 = this['parseGeoNode'](_0x5c185f, _0x278331),
      _0xc8b8d5 = this['genBuffers'](_0x5e16c6),
      _0x2a8bf8 = new Float32BufferAttribute(_0xc8b8d5['vertex'], 0x3);
    (_0x2a8bf8['applyMatrix4'](_0x197420), _0x22f9f9['setAttribute']('position', _0x2a8bf8));
    _0xc8b8d5['colors']['length'] > 0x0 &&
      _0x22f9f9['setAttribute']('color', new Float32BufferAttribute(_0xc8b8d5['colors'], 0x3));
    _0x278331 &&
      (_0x22f9f9['setAttribute']('skinIndex', new Uint16BufferAttribute(_0xc8b8d5['weightsIndices'], 0x4)),
      _0x22f9f9['setAttribute']('skinWeight', new Float32BufferAttribute(_0xc8b8d5['vertexWeights'], 0x4)),
      (_0x22f9f9['FBX_Deformer'] = _0x278331));
    if (_0xc8b8d5['normal']['length'] > 0x0) {
      const _0x2856e9 = new Matrix3()['getNormalMatrix'](_0x197420),
        _0x549ec1 = new Float32BufferAttribute(_0xc8b8d5['normal'], 0x3);
      (_0x549ec1['applyNormalMatrix'](_0x2856e9), _0x22f9f9['setAttribute']('normal', _0x549ec1));
    }
    _0xc8b8d5['uvs']['forEach'](function (_0x74e5d7, _0xe22aa7) {
      const _0x327c8e = _0xe22aa7 === 0x0 ? 'uv' : 'uv' + _0xe22aa7;
      _0x22f9f9['setAttribute'](_0x327c8e, new Float32BufferAttribute(_0xc8b8d5['uvs'][_0xe22aa7], 0x2));
    });
    if (_0x5e16c6['material'] && _0x5e16c6['material']['mappingType'] !== 'AllSame') {
      let _0x3cd3db = _0xc8b8d5['materialIndex'][0x0],
        _0x3d21ad = 0x0;
      _0xc8b8d5['materialIndex']['forEach'](function (_0x5a01a3, _0x6b44e) {
        _0x5a01a3 !== _0x3cd3db &&
          (_0x22f9f9['addGroup'](_0x3d21ad, _0x6b44e - _0x3d21ad, _0x3cd3db),
          (_0x3cd3db = _0x5a01a3),
          (_0x3d21ad = _0x6b44e));
      });
      if (_0x22f9f9['groups']['length'] > 0x0) {
        const _0x6d21f6 = _0x22f9f9['groups'][_0x22f9f9['groups']['length'] - 0x1],
          _0x5a572 = _0x6d21f6['start'] + _0x6d21f6['count'];
        _0x5a572 !== _0xc8b8d5['materialIndex']['length'] &&
          _0x22f9f9['addGroup'](_0x5a572, _0xc8b8d5['materialIndex']['length'] - _0x5a572, _0x3cd3db);
      }
      _0x22f9f9['groups']['length'] === 0x0 &&
        _0x22f9f9['addGroup'](0x0, _0xc8b8d5['materialIndex']['length'], _0xc8b8d5['materialIndex'][0x0]);
    }
    return (this['addMorphTargets'](_0x22f9f9, _0x5c185f, _0x21b25f, _0x197420), _0x22f9f9);
  }
  ['parseGeoNode'](_0x1a0629, _0x14fbf6) {
    const _0x30ea3b = {};
    ((_0x30ea3b['vertexPositions'] = _0x1a0629['Vertices'] !== undefined ? _0x1a0629['Vertices']['a'] : []),
      (_0x30ea3b['vertexIndices'] =
        _0x1a0629['PolygonVertexIndex'] !== undefined ? _0x1a0629['PolygonVertexIndex']['a'] : []));
    _0x1a0629['LayerElementColor'] &&
      _0x1a0629['LayerElementColor'][0x0]['Colors'] &&
      (_0x30ea3b['color'] = this['parseVertexColors'](_0x1a0629['LayerElementColor'][0x0]));
    _0x1a0629['LayerElementMaterial'] &&
      (_0x30ea3b['material'] = this['parseMaterialIndices'](_0x1a0629['LayerElementMaterial'][0x0]));
    _0x1a0629['LayerElementNormal'] &&
      (_0x30ea3b['normal'] = this['parseNormals'](_0x1a0629['LayerElementNormal'][0x0]));
    if (_0x1a0629['LayerElementUV']) {
      _0x30ea3b['uv'] = [];
      let _0x3bd5ce = 0x0;
      while (_0x1a0629['LayerElementUV'][_0x3bd5ce]) {
        (_0x1a0629['LayerElementUV'][_0x3bd5ce]['UV'] &&
          _0x30ea3b['uv']['push'](this['parseUVs'](_0x1a0629['LayerElementUV'][_0x3bd5ce])),
          _0x3bd5ce++);
      }
    }
    return (
      (_0x30ea3b['weightTable'] = {}),
      _0x14fbf6 !== null &&
        ((_0x30ea3b['skeleton'] = _0x14fbf6),
        _0x14fbf6['rawBones']['forEach'](function (_0x426939, _0x559f00) {
          _0x426939['indices']['forEach'](function (_0x5bfbb0, _0xb1f808) {
            if (_0x30ea3b['weightTable'][_0x5bfbb0] === undefined) _0x30ea3b['weightTable'][_0x5bfbb0] = [];
            _0x30ea3b['weightTable'][_0x5bfbb0]['push']({
              id: _0x559f00,
              weight: _0x426939['weights'][_0xb1f808],
            });
          });
        })),
      _0x30ea3b
    );
  }
  ['genBuffers'](_0x5ef5f1) {
    const _0xb9a123 = {
      vertex: [],
      normal: [],
      colors: [],
      uvs: [],
      materialIndex: [],
      vertexWeights: [],
      weightsIndices: [],
    };
    let _0x18a56d = 0x0,
      _0xf536fa = 0x0,
      _0x48f586 = ![],
      _0x1ded40 = [],
      _0x7a58b5 = [],
      _0xb2ef14 = [],
      _0x1799ef = [],
      _0x2c30a8 = [],
      _0x46e335 = [];
    const _0x388754 = this;
    return (
      _0x5ef5f1['vertexIndices']['forEach'](function (_0x161343, _0x32d594) {
        let _0x395588,
          _0x583a2f = ![];
        _0x161343 < 0x0 && ((_0x161343 = _0x161343 ^ -0x1), (_0x583a2f = !![]));
        let _0x44716d = [],
          _0xfea6d1 = [];
        _0x1ded40['push'](_0x161343 * 0x3, _0x161343 * 0x3 + 0x1, _0x161343 * 0x3 + 0x2);
        if (_0x5ef5f1['color']) {
          const _0x5ce870 = getData(_0x32d594, _0x18a56d, _0x161343, _0x5ef5f1['color']);
          _0xb2ef14['push'](_0x5ce870[0x0], _0x5ce870[0x1], _0x5ce870[0x2]);
        }
        if (_0x5ef5f1['skeleton']) {
          _0x5ef5f1['weightTable'][_0x161343] !== undefined &&
            _0x5ef5f1['weightTable'][_0x161343]['forEach'](function (_0x2a4bff) {
              (_0xfea6d1['push'](_0x2a4bff['weight']), _0x44716d['push'](_0x2a4bff['id']));
            });
          if (_0xfea6d1['length'] > 0x4) {
            !_0x48f586 &&
              (console['warn'](
                'THREE.FBXLoader: Vertex has more than 4 skinning weights assigned to vertex. Deleting additional weights.',
              ),
              (_0x48f586 = !![]));
            const _0x5e4be0 = [0x0, 0x0, 0x0, 0x0],
              _0x2b9c7b = [0x0, 0x0, 0x0, 0x0];
            (_0xfea6d1['forEach'](function (_0x46685c, _0x204620) {
              let _0x2a0c07 = _0x46685c,
                _0x3f94cb = _0x44716d[_0x204620];
              _0x2b9c7b['forEach'](function (_0x1b8838, _0x3f532a, _0x20d195) {
                if (_0x2a0c07 > _0x1b8838) {
                  ((_0x20d195[_0x3f532a] = _0x2a0c07), (_0x2a0c07 = _0x1b8838));
                  const _0x5a9dec = _0x5e4be0[_0x3f532a];
                  ((_0x5e4be0[_0x3f532a] = _0x3f94cb), (_0x3f94cb = _0x5a9dec));
                }
              });
            }),
              (_0x44716d = _0x5e4be0),
              (_0xfea6d1 = _0x2b9c7b));
          }
          while (_0xfea6d1['length'] < 0x4) {
            (_0xfea6d1['push'](0x0), _0x44716d['push'](0x0));
          }
          for (let _0x469755 = 0x0; _0x469755 < 0x4; ++_0x469755) {
            (_0x2c30a8['push'](_0xfea6d1[_0x469755]), _0x46e335['push'](_0x44716d[_0x469755]));
          }
        }
        if (_0x5ef5f1['normal']) {
          const _0x5b53aa = getData(_0x32d594, _0x18a56d, _0x161343, _0x5ef5f1['normal']);
          _0x7a58b5['push'](_0x5b53aa[0x0], _0x5b53aa[0x1], _0x5b53aa[0x2]);
        }
        (_0x5ef5f1['material'] &&
          _0x5ef5f1['material']['mappingType'] !== 'AllSame' &&
          ((_0x395588 = getData(_0x32d594, _0x18a56d, _0x161343, _0x5ef5f1['material'])[0x0]),
          _0x395588 < 0x0 && ((_0x388754['negativeMaterialIndices'] = !![]), (_0x395588 = 0x0))),
          _0x5ef5f1['uv'] &&
            _0x5ef5f1['uv']['forEach'](function (_0x34d42e, _0x3f9912) {
              const _0x548ce3 = getData(_0x32d594, _0x18a56d, _0x161343, _0x34d42e);
              (_0x1799ef[_0x3f9912] === undefined && (_0x1799ef[_0x3f9912] = []),
                _0x1799ef[_0x3f9912]['push'](_0x548ce3[0x0]),
                _0x1799ef[_0x3f9912]['push'](_0x548ce3[0x1]));
            }),
          _0xf536fa++,
          _0x583a2f &&
            (_0x388754['genFace'](
              _0xb9a123,
              _0x5ef5f1,
              _0x1ded40,
              _0x395588,
              _0x7a58b5,
              _0xb2ef14,
              _0x1799ef,
              _0x2c30a8,
              _0x46e335,
              _0xf536fa,
            ),
            _0x18a56d++,
            (_0xf536fa = 0x0),
            (_0x1ded40 = []),
            (_0x7a58b5 = []),
            (_0xb2ef14 = []),
            (_0x1799ef = []),
            (_0x2c30a8 = []),
            (_0x46e335 = [])));
      }),
      _0xb9a123
    );
  }
  ['getNormalNewell'](_0x214c6b) {
    const _0x163473 = new Vector3(0x0, 0x0, 0x0);
    for (let _0x20bb95 = 0x0; _0x20bb95 < _0x214c6b['length']; _0x20bb95++) {
      const _0x3cc4ed = _0x214c6b[_0x20bb95],
        _0x44b994 = _0x214c6b[(_0x20bb95 + 0x1) % _0x214c6b['length']];
      ((_0x163473['x'] += (_0x3cc4ed['y'] - _0x44b994['y']) * (_0x3cc4ed['z'] + _0x44b994['z'])),
        (_0x163473['y'] += (_0x3cc4ed['z'] - _0x44b994['z']) * (_0x3cc4ed['x'] + _0x44b994['x'])),
        (_0x163473['z'] += (_0x3cc4ed['x'] - _0x44b994['x']) * (_0x3cc4ed['y'] + _0x44b994['y'])));
    }
    return (_0x163473['normalize'](), _0x163473);
  }
  ['getNormalTangentAndBitangent'](_0x48447d) {
    const _0x2eef1d = this['getNormalNewell'](_0x48447d),
      _0x3bbae8 = Math['abs'](_0x2eef1d['z']) > 0.5 ? new Vector3(0x0, 0x1, 0x0) : new Vector3(0x0, 0x0, 0x1),
      _0x382b67 = _0x3bbae8['cross'](_0x2eef1d)['normalize'](),
      _0x47d390 = _0x2eef1d['clone']()['cross'](_0x382b67)['normalize']();
    return { normal: _0x2eef1d, tangent: _0x382b67, bitangent: _0x47d390 };
  }
  ['flattenVertex'](_0x558e94, _0x24d6fb, _0x6b6afc) {
    return new Vector2(_0x558e94['dot'](_0x24d6fb), _0x558e94['dot'](_0x6b6afc));
  }
  ['genFace'](
    _0x1ec2a2,
    _0x2838b1,
    _0x41d9ad,
    _0x22dfa1,
    _0x4fd3e2,
    _0x554dbd,
    _0x178cb4,
    _0x4ef7ad,
    _0x598971,
    _0x58def8,
  ) {
    let _0x369997;
    if (_0x58def8 > 0x3) {
      const _0x9965b6 = [],
        _0x28be76 = _0x2838b1['baseVertexPositions'] || _0x2838b1['vertexPositions'];
      for (let _0x453dcf = 0x0; _0x453dcf < _0x41d9ad['length']; _0x453dcf += 0x3) {
        _0x9965b6['push'](
          new Vector3(
            _0x28be76[_0x41d9ad[_0x453dcf]],
            _0x28be76[_0x41d9ad[_0x453dcf + 0x1]],
            _0x28be76[_0x41d9ad[_0x453dcf + 0x2]],
          ),
        );
      }
      const { tangent: _0x4db901, bitangent: _0xc362e7 } = this['getNormalTangentAndBitangent'](_0x9965b6),
        _0x3ca03e = [];
      for (const _0x56c30e of _0x9965b6) {
        _0x3ca03e['push'](this['flattenVertex'](_0x56c30e, _0x4db901, _0xc362e7));
      }
      _0x369997 = ShapeUtils['triangulateShape'](_0x3ca03e, []);
    } else _0x369997 = [[0x0, 0x1, 0x2]];
    for (const [_0x127e7b, _0x117d25, _0x1858a7] of _0x369997) {
      (_0x1ec2a2['vertex']['push'](_0x2838b1['vertexPositions'][_0x41d9ad[_0x127e7b * 0x3]]),
        _0x1ec2a2['vertex']['push'](_0x2838b1['vertexPositions'][_0x41d9ad[_0x127e7b * 0x3 + 0x1]]),
        _0x1ec2a2['vertex']['push'](_0x2838b1['vertexPositions'][_0x41d9ad[_0x127e7b * 0x3 + 0x2]]),
        _0x1ec2a2['vertex']['push'](_0x2838b1['vertexPositions'][_0x41d9ad[_0x117d25 * 0x3]]),
        _0x1ec2a2['vertex']['push'](_0x2838b1['vertexPositions'][_0x41d9ad[_0x117d25 * 0x3 + 0x1]]),
        _0x1ec2a2['vertex']['push'](_0x2838b1['vertexPositions'][_0x41d9ad[_0x117d25 * 0x3 + 0x2]]),
        _0x1ec2a2['vertex']['push'](_0x2838b1['vertexPositions'][_0x41d9ad[_0x1858a7 * 0x3]]),
        _0x1ec2a2['vertex']['push'](_0x2838b1['vertexPositions'][_0x41d9ad[_0x1858a7 * 0x3 + 0x1]]),
        _0x1ec2a2['vertex']['push'](_0x2838b1['vertexPositions'][_0x41d9ad[_0x1858a7 * 0x3 + 0x2]]),
        _0x2838b1['skeleton'] &&
          (_0x1ec2a2['vertexWeights']['push'](_0x4ef7ad[_0x127e7b * 0x4]),
          _0x1ec2a2['vertexWeights']['push'](_0x4ef7ad[_0x127e7b * 0x4 + 0x1]),
          _0x1ec2a2['vertexWeights']['push'](_0x4ef7ad[_0x127e7b * 0x4 + 0x2]),
          _0x1ec2a2['vertexWeights']['push'](_0x4ef7ad[_0x127e7b * 0x4 + 0x3]),
          _0x1ec2a2['vertexWeights']['push'](_0x4ef7ad[_0x117d25 * 0x4]),
          _0x1ec2a2['vertexWeights']['push'](_0x4ef7ad[_0x117d25 * 0x4 + 0x1]),
          _0x1ec2a2['vertexWeights']['push'](_0x4ef7ad[_0x117d25 * 0x4 + 0x2]),
          _0x1ec2a2['vertexWeights']['push'](_0x4ef7ad[_0x117d25 * 0x4 + 0x3]),
          _0x1ec2a2['vertexWeights']['push'](_0x4ef7ad[_0x1858a7 * 0x4]),
          _0x1ec2a2['vertexWeights']['push'](_0x4ef7ad[_0x1858a7 * 0x4 + 0x1]),
          _0x1ec2a2['vertexWeights']['push'](_0x4ef7ad[_0x1858a7 * 0x4 + 0x2]),
          _0x1ec2a2['vertexWeights']['push'](_0x4ef7ad[_0x1858a7 * 0x4 + 0x3]),
          _0x1ec2a2['weightsIndices']['push'](_0x598971[_0x127e7b * 0x4]),
          _0x1ec2a2['weightsIndices']['push'](_0x598971[_0x127e7b * 0x4 + 0x1]),
          _0x1ec2a2['weightsIndices']['push'](_0x598971[_0x127e7b * 0x4 + 0x2]),
          _0x1ec2a2['weightsIndices']['push'](_0x598971[_0x127e7b * 0x4 + 0x3]),
          _0x1ec2a2['weightsIndices']['push'](_0x598971[_0x117d25 * 0x4]),
          _0x1ec2a2['weightsIndices']['push'](_0x598971[_0x117d25 * 0x4 + 0x1]),
          _0x1ec2a2['weightsIndices']['push'](_0x598971[_0x117d25 * 0x4 + 0x2]),
          _0x1ec2a2['weightsIndices']['push'](_0x598971[_0x117d25 * 0x4 + 0x3]),
          _0x1ec2a2['weightsIndices']['push'](_0x598971[_0x1858a7 * 0x4]),
          _0x1ec2a2['weightsIndices']['push'](_0x598971[_0x1858a7 * 0x4 + 0x1]),
          _0x1ec2a2['weightsIndices']['push'](_0x598971[_0x1858a7 * 0x4 + 0x2]),
          _0x1ec2a2['weightsIndices']['push'](_0x598971[_0x1858a7 * 0x4 + 0x3])),
        _0x2838b1['color'] &&
          (_0x1ec2a2['colors']['push'](_0x554dbd[_0x127e7b * 0x3]),
          _0x1ec2a2['colors']['push'](_0x554dbd[_0x127e7b * 0x3 + 0x1]),
          _0x1ec2a2['colors']['push'](_0x554dbd[_0x127e7b * 0x3 + 0x2]),
          _0x1ec2a2['colors']['push'](_0x554dbd[_0x117d25 * 0x3]),
          _0x1ec2a2['colors']['push'](_0x554dbd[_0x117d25 * 0x3 + 0x1]),
          _0x1ec2a2['colors']['push'](_0x554dbd[_0x117d25 * 0x3 + 0x2]),
          _0x1ec2a2['colors']['push'](_0x554dbd[_0x1858a7 * 0x3]),
          _0x1ec2a2['colors']['push'](_0x554dbd[_0x1858a7 * 0x3 + 0x1]),
          _0x1ec2a2['colors']['push'](_0x554dbd[_0x1858a7 * 0x3 + 0x2])),
        _0x2838b1['material'] &&
          _0x2838b1['material']['mappingType'] !== 'AllSame' &&
          (_0x1ec2a2['materialIndex']['push'](_0x22dfa1),
          _0x1ec2a2['materialIndex']['push'](_0x22dfa1),
          _0x1ec2a2['materialIndex']['push'](_0x22dfa1)),
        _0x2838b1['normal'] &&
          (_0x1ec2a2['normal']['push'](_0x4fd3e2[_0x127e7b * 0x3]),
          _0x1ec2a2['normal']['push'](_0x4fd3e2[_0x127e7b * 0x3 + 0x1]),
          _0x1ec2a2['normal']['push'](_0x4fd3e2[_0x127e7b * 0x3 + 0x2]),
          _0x1ec2a2['normal']['push'](_0x4fd3e2[_0x117d25 * 0x3]),
          _0x1ec2a2['normal']['push'](_0x4fd3e2[_0x117d25 * 0x3 + 0x1]),
          _0x1ec2a2['normal']['push'](_0x4fd3e2[_0x117d25 * 0x3 + 0x2]),
          _0x1ec2a2['normal']['push'](_0x4fd3e2[_0x1858a7 * 0x3]),
          _0x1ec2a2['normal']['push'](_0x4fd3e2[_0x1858a7 * 0x3 + 0x1]),
          _0x1ec2a2['normal']['push'](_0x4fd3e2[_0x1858a7 * 0x3 + 0x2])),
        _0x2838b1['uv'] &&
          _0x2838b1['uv']['forEach'](function (_0x212082, _0x38d871) {
            if (_0x1ec2a2['uvs'][_0x38d871] === undefined) _0x1ec2a2['uvs'][_0x38d871] = [];
            (_0x1ec2a2['uvs'][_0x38d871]['push'](_0x178cb4[_0x38d871][_0x127e7b * 0x2]),
              _0x1ec2a2['uvs'][_0x38d871]['push'](_0x178cb4[_0x38d871][_0x127e7b * 0x2 + 0x1]),
              _0x1ec2a2['uvs'][_0x38d871]['push'](_0x178cb4[_0x38d871][_0x117d25 * 0x2]),
              _0x1ec2a2['uvs'][_0x38d871]['push'](_0x178cb4[_0x38d871][_0x117d25 * 0x2 + 0x1]),
              _0x1ec2a2['uvs'][_0x38d871]['push'](_0x178cb4[_0x38d871][_0x1858a7 * 0x2]),
              _0x1ec2a2['uvs'][_0x38d871]['push'](_0x178cb4[_0x38d871][_0x1858a7 * 0x2 + 0x1]));
          }));
    }
  }
  ['addMorphTargets'](_0x195504, _0x3e19b7, _0x20615b, _0x426d34) {
    if (_0x20615b['length'] === 0x0) return;
    ((_0x195504['morphTargetsRelative'] = !![]), (_0x195504['morphAttributes']['position'] = []));
    const _0x41425d = this;
    _0x20615b['forEach'](function (_0xe3762a) {
      _0xe3762a['rawTargets']['forEach'](function (_0x408161) {
        const _0x4cdbb4 = fbxTree['Objects']['Geometry'][_0x408161['geoID']];
        _0x4cdbb4 !== undefined &&
          _0x41425d['genMorphGeometry'](_0x195504, _0x3e19b7, _0x4cdbb4, _0x426d34, _0x408161['name']);
      });
    });
  }
  ['genMorphGeometry'](_0x1b2bd2, _0x24c904, _0x4134e6, _0x8daf3f, _0x3d8f8d) {
    const _0x2ed5b8 = _0x24c904['Vertices'] !== undefined ? _0x24c904['Vertices']['a'] : [],
      _0x207ba3 = _0x24c904['PolygonVertexIndex'] !== undefined ? _0x24c904['PolygonVertexIndex']['a'] : [],
      _0x31fc87 = _0x4134e6['Vertices'] !== undefined ? _0x4134e6['Vertices']['a'] : [],
      _0x9e69b9 = _0x4134e6['Indexes'] !== undefined ? _0x4134e6['Indexes']['a'] : [],
      _0x304f2c = _0x1b2bd2['attributes']['position']['count'] * 0x3,
      _0x92d987 = new Float32Array(_0x304f2c);
    for (let _0x4dbb5a = 0x0; _0x4dbb5a < _0x9e69b9['length']; _0x4dbb5a++) {
      const _0x3e1863 = _0x9e69b9[_0x4dbb5a] * 0x3;
      ((_0x92d987[_0x3e1863] = _0x31fc87[_0x4dbb5a * 0x3]),
        (_0x92d987[_0x3e1863 + 0x1] = _0x31fc87[_0x4dbb5a * 0x3 + 0x1]),
        (_0x92d987[_0x3e1863 + 0x2] = _0x31fc87[_0x4dbb5a * 0x3 + 0x2]));
    }
    const _0x377196 = {
        vertexIndices: _0x207ba3,
        vertexPositions: _0x92d987,
        baseVertexPositions: _0x2ed5b8,
      },
      _0xa57b42 = this['genBuffers'](_0x377196),
      _0x17064e = new Float32BufferAttribute(_0xa57b42['vertex'], 0x3);
    ((_0x17064e['name'] = _0x3d8f8d || _0x4134e6['attrName']),
      _0x17064e['applyMatrix4'](_0x8daf3f),
      _0x1b2bd2['morphAttributes']['position']['push'](_0x17064e));
  }
  ['parseNormals'](_0x679921) {
    const _0x29567a = _0x679921['MappingInformationType'],
      _0x4cc08c = _0x679921['ReferenceInformationType'],
      _0x43ed05 = _0x679921['Normals']['a'];
    let _0xd9c252 = [];
    if (_0x4cc08c === 'IndexToDirect') {
      if ('NormalIndex' in _0x679921) _0xd9c252 = _0x679921['NormalIndex']['a'];
      else 'NormalsIndex' in _0x679921 && (_0xd9c252 = _0x679921['NormalsIndex']['a']);
    }
    return {
      dataSize: 0x3,
      buffer: _0x43ed05,
      indices: _0xd9c252,
      mappingType: _0x29567a,
      referenceType: _0x4cc08c,
    };
  }
  ['parseUVs'](_0x4e881c) {
    const _0x157ba6 = _0x4e881c['MappingInformationType'],
      _0x238e14 = _0x4e881c['ReferenceInformationType'],
      _0x67eb8b = _0x4e881c['UV']['a'];
    let _0x45f5c5 = [];
    return (
      _0x238e14 === 'IndexToDirect' && (_0x45f5c5 = _0x4e881c['UVIndex']['a']),
      {
        dataSize: 0x2,
        buffer: _0x67eb8b,
        indices: _0x45f5c5,
        mappingType: _0x157ba6,
        referenceType: _0x238e14,
      }
    );
  }
  ['parseVertexColors'](_0xc1f9f4) {
    const _0xb0ad9d = _0xc1f9f4['MappingInformationType'],
      _0x2fb315 = _0xc1f9f4['ReferenceInformationType'],
      _0x5752ae = _0xc1f9f4['Colors']['a'];
    let _0x2c2d0a = [];
    _0x2fb315 === 'IndexToDirect' && (_0x2c2d0a = _0xc1f9f4['ColorIndex']['a']);
    for (let _0x408816 = 0x0, _0x2756b7 = new Color(); _0x408816 < _0x5752ae['length']; _0x408816 += 0x4) {
      (_0x2756b7['fromArray'](_0x5752ae, _0x408816),
        ColorManagement['colorSpaceToWorking'](_0x2756b7, SRGBColorSpace),
        _0x2756b7['toArray'](_0x5752ae, _0x408816));
    }
    return {
      dataSize: 0x4,
      buffer: _0x5752ae,
      indices: _0x2c2d0a,
      mappingType: _0xb0ad9d,
      referenceType: _0x2fb315,
    };
  }
  ['parseMaterialIndices'](_0x1b6f11) {
    const _0x1b8282 = _0x1b6f11['MappingInformationType'],
      _0x18164d = _0x1b6f11['ReferenceInformationType'];
    if (_0x1b8282 === 'NoMappingInformation')
      return {
        dataSize: 0x1,
        buffer: [0x0],
        indices: [0x0],
        mappingType: 'AllSame',
        referenceType: _0x18164d,
      };
    const _0x376c37 = _0x1b6f11['Materials']['a'],
      _0x1304e8 = [];
    for (let _0x16d40c = 0x0; _0x16d40c < _0x376c37['length']; ++_0x16d40c) {
      _0x1304e8['push'](_0x16d40c);
    }
    return {
      dataSize: 0x1,
      buffer: _0x376c37,
      indices: _0x1304e8,
      mappingType: _0x1b8282,
      referenceType: _0x18164d,
    };
  }
  ['parseNurbsGeometry'](_0x4d7f6c) {
    const _0x4fc4aa = parseInt(_0x4d7f6c['Order']);
    if (isNaN(_0x4fc4aa))
      return (
        console['error'](
          'THREE.FBXLoader: Invalid Order %s given for geometry ID: %s',
          _0x4d7f6c['Order'],
          _0x4d7f6c['id'],
        ),
        new BufferGeometry()
      );
    const _0x7241 = _0x4fc4aa - 0x1,
      _0x3bbc65 = _0x4d7f6c['KnotVector']['a'],
      _0x1927d6 = [],
      _0x2b8ebf = _0x4d7f6c['Points']['a'];
    for (let _0x1dd8cc = 0x0, _0x2c635a = _0x2b8ebf['length']; _0x1dd8cc < _0x2c635a; _0x1dd8cc += 0x4) {
      _0x1927d6['push'](new Vector4()['fromArray'](_0x2b8ebf, _0x1dd8cc));
    }
    let _0x13fa57, _0x338bb9;
    if (_0x4d7f6c['Form'] === 'Closed') _0x1927d6['push'](_0x1927d6[0x0]);
    else {
      if (_0x4d7f6c['Form'] === 'Periodic') {
        ((_0x13fa57 = _0x7241), (_0x338bb9 = _0x3bbc65['length'] - 0x1 - _0x13fa57));
        for (let _0xb94dfb = 0x0; _0xb94dfb < _0x7241; ++_0xb94dfb) {
          _0x1927d6['push'](_0x1927d6[_0xb94dfb]);
        }
      }
    }
    const _0x1d3b69 = new NURBSCurve(_0x7241, _0x3bbc65, _0x1927d6, _0x13fa57, _0x338bb9),
      _0x4f1ab5 = _0x1d3b69['getPoints'](_0x1927d6['length'] * 0xc);
    return new BufferGeometry()['setFromPoints'](_0x4f1ab5);
  }
}
class AnimationParser {
  ['parse']() {
    const _0x4d535e = [],
      _0x440687 = this['parseClips']();
    if (_0x440687 !== undefined)
      for (const _0x2d33ff in _0x440687) {
        const _0x21dcc1 = _0x440687[_0x2d33ff],
          _0x28b256 = this['addClip'](_0x21dcc1);
        _0x4d535e['push'](_0x28b256);
      }
    return _0x4d535e;
  }
  ['parseClips']() {
    if (fbxTree['Objects']['AnimationCurve'] === undefined) return undefined;
    const _0x4e1a61 = this['parseAnimationCurveNodes']();
    this['parseAnimationCurves'](_0x4e1a61);
    const _0x559707 = this['parseAnimationLayers'](_0x4e1a61),
      _0x4edc6e = this['parseAnimStacks'](_0x559707);
    return _0x4edc6e;
  }
  ['parseAnimationCurveNodes']() {
    const _0xba1f16 = fbxTree['Objects']['AnimationCurveNode'],
      _0x53a417 = new Map();
    for (const _0x1ccb9c in _0xba1f16) {
      const _0x3df767 = _0xba1f16[_0x1ccb9c];
      if (_0x3df767['attrName']['match'](/S|R|T|DeformPercent/) !== null) {
        const _0x2e2c4c = { id: _0x3df767['id'], attr: _0x3df767['attrName'], curves: {} };
        _0x53a417['set'](_0x2e2c4c['id'], _0x2e2c4c);
      }
    }
    return _0x53a417;
  }
  ['parseAnimationCurves'](_0x2c7230) {
    const _0x1a01b5 = fbxTree['Objects']['AnimationCurve'];
    for (const _0x29ebac in _0x1a01b5) {
      const _0x35f4d2 = {
          id: _0x1a01b5[_0x29ebac]['id'],
          times: _0x1a01b5[_0x29ebac]['KeyTime']['a']['map'](convertFBXTimeToSeconds),
          values: _0x1a01b5[_0x29ebac]['KeyValueFloat']['a'],
        },
        _0x4aca95 = connections['get'](_0x35f4d2['id']);
      if (_0x4aca95 !== undefined) {
        const _0x4b5085 = _0x4aca95['parents'][0x0]['ID'],
          _0x5e713c = _0x4aca95['parents'][0x0]['relationship'];
        if (_0x5e713c['match'](/X/)) _0x2c7230['get'](_0x4b5085)['curves']['x'] = _0x35f4d2;
        else {
          if (_0x5e713c['match'](/Y/)) _0x2c7230['get'](_0x4b5085)['curves']['y'] = _0x35f4d2;
          else {
            if (_0x5e713c['match'](/Z/)) _0x2c7230['get'](_0x4b5085)['curves']['z'] = _0x35f4d2;
            else
              _0x5e713c['match'](/DeformPercent/) &&
                _0x2c7230['has'](_0x4b5085) &&
                (_0x2c7230['get'](_0x4b5085)['curves']['morph'] = _0x35f4d2);
          }
        }
      }
    }
  }
  ['parseAnimationLayers'](_0x40fe5c) {
    const _0x5b23eb = fbxTree['Objects']['AnimationLayer'],
      _0x41e117 = new Map();
    for (const _0x4c734c in _0x5b23eb) {
      const _0x43aeb7 = [],
        _0x4da802 = connections['get'](parseInt(_0x4c734c));
      if (_0x4da802 !== undefined) {
        const _0x361648 = _0x4da802['children'];
        (_0x361648['forEach'](function (_0x42f1da, _0x2fd787) {
          if (_0x40fe5c['has'](_0x42f1da['ID'])) {
            const _0x17b0fb = _0x40fe5c['get'](_0x42f1da['ID']);
            if (
              _0x17b0fb['curves']['x'] !== undefined ||
              _0x17b0fb['curves']['y'] !== undefined ||
              _0x17b0fb['curves']['z'] !== undefined
            ) {
              if (_0x43aeb7[_0x2fd787] === undefined) {
                const _0x358c9f = connections['get'](_0x42f1da['ID'])['parents']['filter'](
                  function (_0xacb8bc) {
                    return _0xacb8bc['relationship'] !== undefined;
                  },
                )[0x0]['ID'];
                if (_0x358c9f !== undefined) {
                  const _0x3223ba = fbxTree['Objects']['Model'][_0x358c9f['toString']()];
                  if (_0x3223ba === undefined) {
                    console['warn']('THREE.FBXLoader: Encountered a unused curve.', _0x42f1da);
                    return;
                  }
                  const _0xea02d9 = {
                    modelName: _0x3223ba['attrName']
                      ? PropertyBinding['sanitizeNodeName'](_0x3223ba['attrName'])
                      : '',
                    ID: _0x3223ba['id'],
                    initialPosition: [0x0, 0x0, 0x0],
                    initialRotation: [0x0, 0x0, 0x0],
                    initialScale: [0x1, 0x1, 0x1],
                  };
                  sceneGraph['traverse'](function (_0x19bae9) {
                    if (_0x19bae9['ID'] === _0x3223ba['id']) {
                      _0xea02d9['transform'] = _0x19bae9['matrix'];
                      if (_0x19bae9['userData']['transformData'])
                        _0xea02d9['eulerOrder'] = _0x19bae9['userData']['transformData']['eulerOrder'];
                    }
                  });
                  if (!_0xea02d9['transform']) _0xea02d9['transform'] = new Matrix4();
                  if ('PreRotation' in _0x3223ba)
                    _0xea02d9['preRotation'] = _0x3223ba['PreRotation']['value'];
                  if ('PostRotation' in _0x3223ba)
                    _0xea02d9['postRotation'] = _0x3223ba['PostRotation']['value'];
                  _0x43aeb7[_0x2fd787] = _0xea02d9;
                }
              }
              if (_0x43aeb7[_0x2fd787]) _0x43aeb7[_0x2fd787][_0x17b0fb['attr']] = _0x17b0fb;
            } else {
              if (_0x17b0fb['curves']['morph'] !== undefined) {
                if (_0x43aeb7[_0x2fd787] === undefined) {
                  const _0x57f374 = connections['get'](_0x42f1da['ID'])['parents']['filter'](
                      function (_0x42cb39) {
                        return _0x42cb39['relationship'] !== undefined;
                      },
                    )[0x0]['ID'],
                    _0x3a6330 = connections['get'](_0x57f374)['parents'][0x0]['ID'],
                    _0x5efd20 = connections['get'](_0x3a6330)['parents'][0x0]['ID'],
                    _0xe1a8a3 = connections['get'](_0x5efd20)['parents'][0x0]['ID'],
                    _0x1f779f = fbxTree['Objects']['Model'][_0xe1a8a3],
                    _0x4532b7 = {
                      modelName: _0x1f779f['attrName']
                        ? PropertyBinding['sanitizeNodeName'](_0x1f779f['attrName'])
                        : '',
                      morphName: fbxTree['Objects']['Deformer'][_0x57f374]['attrName'],
                    };
                  _0x43aeb7[_0x2fd787] = _0x4532b7;
                }
                _0x43aeb7[_0x2fd787][_0x17b0fb['attr']] = _0x17b0fb;
              }
            }
          }
        }),
          _0x41e117['set'](parseInt(_0x4c734c), _0x43aeb7));
      }
    }
    return _0x41e117;
  }
  ['parseAnimStacks'](_0x54a1a8) {
    const _0x436145 = fbxTree['Objects']['AnimationStack'],
      _0x3dad2b = {};
    for (const _0x11f3c0 in _0x436145) {
      const _0x212e62 = connections['get'](parseInt(_0x11f3c0))['children'];
      _0x212e62['length'] > 0x1 &&
        console['warn'](
          'THREE.FBXLoader: Encountered an animation stack with multiple layers, this is currently not supported. Ignoring subsequent layers.',
        );
      const _0x2dae0f = _0x54a1a8['get'](_0x212e62[0x0]['ID']);
      _0x3dad2b[_0x11f3c0] = { name: _0x436145[_0x11f3c0]['attrName'], layer: _0x2dae0f };
    }
    return _0x3dad2b;
  }
  ['addClip'](_0x345bf8) {
    let _0x5884ac = [];
    const _0x32d20f = this;
    return (
      _0x345bf8['layer']['forEach'](function (_0x89ddf5) {
        _0x5884ac = _0x5884ac['concat'](_0x32d20f['generateTracks'](_0x89ddf5));
      }),
      new AnimationClip(_0x345bf8['name'], -0x1, _0x5884ac)
    );
  }
  ['generateTracks'](_0x488912) {
    const _0x4995ac = [];
    let _0x547dc9 = new Vector3(),
      _0x3760c3 = new Vector3();
    if (_0x488912['transform']) _0x488912['transform']['decompose'](_0x547dc9, new Quaternion(), _0x3760c3);
    ((_0x547dc9 = _0x547dc9['toArray']()), (_0x3760c3 = _0x3760c3['toArray']()));
    if (_0x488912['T'] !== undefined && Object['keys'](_0x488912['T']['curves'])['length'] > 0x0) {
      const _0x379312 = this['generateVectorTrack'](
        _0x488912['modelName'],
        _0x488912['T']['curves'],
        _0x547dc9,
        'position',
      );
      if (_0x379312 !== undefined) _0x4995ac['push'](_0x379312);
    }
    if (_0x488912['R'] !== undefined && Object['keys'](_0x488912['R']['curves'])['length'] > 0x0) {
      const _0x1c8fa1 = this['generateRotationTrack'](
        _0x488912['modelName'],
        _0x488912['R']['curves'],
        _0x488912['preRotation'],
        _0x488912['postRotation'],
        _0x488912['eulerOrder'],
      );
      if (_0x1c8fa1 !== undefined) _0x4995ac['push'](_0x1c8fa1);
    }
    if (_0x488912['S'] !== undefined && Object['keys'](_0x488912['S']['curves'])['length'] > 0x0) {
      const _0x29990b = this['generateVectorTrack'](
        _0x488912['modelName'],
        _0x488912['S']['curves'],
        _0x3760c3,
        'scale',
      );
      if (_0x29990b !== undefined) _0x4995ac['push'](_0x29990b);
    }
    if (_0x488912['DeformPercent'] !== undefined) {
      const _0xae379f = this['generateMorphTrack'](_0x488912);
      if (_0xae379f !== undefined) _0x4995ac['push'](_0xae379f);
    }
    return _0x4995ac;
  }
  ['generateVectorTrack'](_0x176538, _0xf8f691, _0x209171, _0xa8f61b) {
    const _0x19da67 = this['getTimesForAllAxes'](_0xf8f691),
      _0xd86230 = this['getKeyframeTrackValues'](_0x19da67, _0xf8f691, _0x209171);
    return new VectorKeyframeTrack(_0x176538 + '.' + _0xa8f61b, _0x19da67, _0xd86230);
  }
  ['generateRotationTrack'](_0x371819, _0x20e68c, _0x29ed04, _0x53091c, _0xead896) {
    let _0x242c80, _0x275979;
    if (_0x20e68c['x'] !== undefined && _0x20e68c['y'] !== undefined && _0x20e68c['z'] !== undefined) {
      const _0x58cbe4 = this['interpolateRotations'](
        _0x20e68c['x'],
        _0x20e68c['y'],
        _0x20e68c['z'],
        _0xead896,
      );
      ((_0x242c80 = _0x58cbe4[0x0]), (_0x275979 = _0x58cbe4[0x1]));
    }
    const _0x46b04c = getEulerOrder(0x0);
    _0x29ed04 !== undefined &&
      ((_0x29ed04 = _0x29ed04['map'](MathUtils['degToRad'])),
      _0x29ed04['push'](_0x46b04c),
      (_0x29ed04 = new Euler()['fromArray'](_0x29ed04)),
      (_0x29ed04 = new Quaternion()['setFromEuler'](_0x29ed04)));
    _0x53091c !== undefined &&
      ((_0x53091c = _0x53091c['map'](MathUtils['degToRad'])),
      _0x53091c['push'](_0x46b04c),
      (_0x53091c = new Euler()['fromArray'](_0x53091c)),
      (_0x53091c = new Quaternion()['setFromEuler'](_0x53091c)['invert']()));
    const _0x4bdb8f = new Quaternion(),
      _0x1d2ca4 = new Euler(),
      _0x4b5c4d = [];
    if (!_0x275979 || !_0x242c80) return new QuaternionKeyframeTrack(_0x371819 + '.quaternion', [0x0], [0x0]);
    for (let _0x11651c = 0x0; _0x11651c < _0x275979['length']; _0x11651c += 0x3) {
      (_0x1d2ca4['set'](
        _0x275979[_0x11651c],
        _0x275979[_0x11651c + 0x1],
        _0x275979[_0x11651c + 0x2],
        _0xead896,
      ),
        _0x4bdb8f['setFromEuler'](_0x1d2ca4));
      if (_0x29ed04 !== undefined) _0x4bdb8f['premultiply'](_0x29ed04);
      if (_0x53091c !== undefined) _0x4bdb8f['multiply'](_0x53091c);
      if (_0x11651c > 0x2) {
        const _0x2892ef = new Quaternion()['fromArray'](_0x4b5c4d, ((_0x11651c - 0x3) / 0x3) * 0x4);
        _0x2892ef['dot'](_0x4bdb8f) < 0x0 &&
          _0x4bdb8f['set'](-_0x4bdb8f['x'], -_0x4bdb8f['y'], -_0x4bdb8f['z'], -_0x4bdb8f['w']);
      }
      _0x4bdb8f['toArray'](_0x4b5c4d, (_0x11651c / 0x3) * 0x4);
    }
    return new QuaternionKeyframeTrack(_0x371819 + '.quaternion', _0x242c80, _0x4b5c4d);
  }
  ['generateMorphTrack'](_0xe9d8bc) {
    const _0x20b193 = _0xe9d8bc['DeformPercent']['curves']['morph'],
      _0x3c6191 = _0x20b193['values']['map'](function (_0x28a5d8) {
        return _0x28a5d8 / 0x64;
      }),
      _0x5b14b2 = sceneGraph['getObjectByName'](_0xe9d8bc['modelName'])['morphTargetDictionary'][
        _0xe9d8bc['morphName']
      ];
    return new NumberKeyframeTrack(
      _0xe9d8bc['modelName'] + '.morphTargetInfluences[' + _0x5b14b2 + ']',
      _0x20b193['times'],
      _0x3c6191,
    );
  }
  ['getTimesForAllAxes'](_0x591e4f) {
    let _0x3dcbcd = [];
    if (_0x591e4f['x'] !== undefined) _0x3dcbcd = _0x3dcbcd['concat'](_0x591e4f['x']['times']);
    if (_0x591e4f['y'] !== undefined) _0x3dcbcd = _0x3dcbcd['concat'](_0x591e4f['y']['times']);
    if (_0x591e4f['z'] !== undefined) _0x3dcbcd = _0x3dcbcd['concat'](_0x591e4f['z']['times']);
    _0x3dcbcd = _0x3dcbcd['sort'](function (_0x43df31, _0x37ea1c) {
      return _0x43df31 - _0x37ea1c;
    });
    if (_0x3dcbcd['length'] > 0x1) {
      let _0x3f0ee8 = 0x1,
        _0x338598 = _0x3dcbcd[0x0];
      for (let _0x4b0885 = 0x1; _0x4b0885 < _0x3dcbcd['length']; _0x4b0885++) {
        const _0x27b050 = _0x3dcbcd[_0x4b0885];
        _0x27b050 !== _0x338598 && ((_0x3dcbcd[_0x3f0ee8] = _0x27b050), (_0x338598 = _0x27b050), _0x3f0ee8++);
      }
      _0x3dcbcd = _0x3dcbcd['slice'](0x0, _0x3f0ee8);
    }
    return _0x3dcbcd;
  }
  ['getKeyframeTrackValues'](_0x1910c1, _0x21cdff, _0x20f6a5) {
    const _0xa51b5e = _0x20f6a5,
      _0x468c52 = [];
    let _0xbd3886 = -0x1,
      _0x416485 = -0x1,
      _0x3a56f5 = -0x1;
    return (
      _0x1910c1['forEach'](function (_0x51c608) {
        if (_0x21cdff['x']) _0xbd3886 = _0x21cdff['x']['times']['indexOf'](_0x51c608);
        if (_0x21cdff['y']) _0x416485 = _0x21cdff['y']['times']['indexOf'](_0x51c608);
        if (_0x21cdff['z']) _0x3a56f5 = _0x21cdff['z']['times']['indexOf'](_0x51c608);
        if (_0xbd3886 !== -0x1) {
          const _0x32e49f = _0x21cdff['x']['values'][_0xbd3886];
          (_0x468c52['push'](_0x32e49f), (_0xa51b5e[0x0] = _0x32e49f));
        } else _0x468c52['push'](_0xa51b5e[0x0]);
        if (_0x416485 !== -0x1) {
          const _0x376a5a = _0x21cdff['y']['values'][_0x416485];
          (_0x468c52['push'](_0x376a5a), (_0xa51b5e[0x1] = _0x376a5a));
        } else _0x468c52['push'](_0xa51b5e[0x1]);
        if (_0x3a56f5 !== -0x1) {
          const _0x1bcd51 = _0x21cdff['z']['values'][_0x3a56f5];
          (_0x468c52['push'](_0x1bcd51), (_0xa51b5e[0x2] = _0x1bcd51));
        } else _0x468c52['push'](_0xa51b5e[0x2]);
      }),
      _0x468c52
    );
  }
  ['interpolateRotations'](_0xba64b0, _0x5209f4, _0x45b699, _0xc878cb) {
    const _0x311985 = [],
      _0x5110c7 = [];
    (_0x311985['push'](_0xba64b0['times'][0x0]),
      _0x5110c7['push'](MathUtils['degToRad'](_0xba64b0['values'][0x0])),
      _0x5110c7['push'](MathUtils['degToRad'](_0x5209f4['values'][0x0])),
      _0x5110c7['push'](MathUtils['degToRad'](_0x45b699['values'][0x0])));
    for (let _0xdcdcfe = 0x1; _0xdcdcfe < _0xba64b0['values']['length']; _0xdcdcfe++) {
      const _0x3f97a3 = [
        _0xba64b0['values'][_0xdcdcfe - 0x1],
        _0x5209f4['values'][_0xdcdcfe - 0x1],
        _0x45b699['values'][_0xdcdcfe - 0x1],
      ];
      if (isNaN(_0x3f97a3[0x0]) || isNaN(_0x3f97a3[0x1]) || isNaN(_0x3f97a3[0x2])) continue;
      const _0x2351e9 = _0x3f97a3['map'](MathUtils['degToRad']),
        _0x1e975d = [
          _0xba64b0['values'][_0xdcdcfe],
          _0x5209f4['values'][_0xdcdcfe],
          _0x45b699['values'][_0xdcdcfe],
        ];
      if (isNaN(_0x1e975d[0x0]) || isNaN(_0x1e975d[0x1]) || isNaN(_0x1e975d[0x2])) continue;
      const _0x274c8f = _0x1e975d['map'](MathUtils['degToRad']),
        _0x224d51 = [
          _0x1e975d[0x0] - _0x3f97a3[0x0],
          _0x1e975d[0x1] - _0x3f97a3[0x1],
          _0x1e975d[0x2] - _0x3f97a3[0x2],
        ],
        _0x2a51ed = [Math['abs'](_0x224d51[0x0]), Math['abs'](_0x224d51[0x1]), Math['abs'](_0x224d51[0x2])];
      if (_0x2a51ed[0x0] >= 0xb4 || _0x2a51ed[0x1] >= 0xb4 || _0x2a51ed[0x2] >= 0xb4) {
        const _0x40d274 = Math['max'](..._0x2a51ed),
          _0x5b646a = _0x40d274 / 0xb4,
          _0x367c31 = new Euler(..._0x2351e9, _0xc878cb),
          _0x5be278 = new Euler(..._0x274c8f, _0xc878cb),
          _0x361ed5 = new Quaternion()['setFromEuler'](_0x367c31),
          _0x2732b9 = new Quaternion()['setFromEuler'](_0x5be278);
        _0x361ed5['dot'](_0x2732b9) &&
          _0x2732b9['set'](-_0x2732b9['x'], -_0x2732b9['y'], -_0x2732b9['z'], -_0x2732b9['w']);
        const _0x1a49f4 = _0xba64b0['times'][_0xdcdcfe - 0x1],
          _0x2b5be5 = _0xba64b0['times'][_0xdcdcfe] - _0x1a49f4,
          _0x203cd7 = new Quaternion(),
          _0x140f60 = new Euler();
        for (let _0x3ef94a = 0x0; _0x3ef94a < 0x1; _0x3ef94a += 0x1 / _0x5b646a) {
          (_0x203cd7['copy'](_0x361ed5['clone']()['slerp'](_0x2732b9['clone'](), _0x3ef94a)),
            _0x311985['push'](_0x1a49f4 + _0x3ef94a * _0x2b5be5),
            _0x140f60['setFromQuaternion'](_0x203cd7, _0xc878cb),
            _0x5110c7['push'](_0x140f60['x']),
            _0x5110c7['push'](_0x140f60['y']),
            _0x5110c7['push'](_0x140f60['z']));
        }
      } else
        (_0x311985['push'](_0xba64b0['times'][_0xdcdcfe]),
          _0x5110c7['push'](MathUtils['degToRad'](_0xba64b0['values'][_0xdcdcfe])),
          _0x5110c7['push'](MathUtils['degToRad'](_0x5209f4['values'][_0xdcdcfe])),
          _0x5110c7['push'](MathUtils['degToRad'](_0x45b699['values'][_0xdcdcfe])));
    }
    return [_0x311985, _0x5110c7];
  }
}
class TextParser {
  ['getPrevNode']() {
    return this['nodeStack'][this['currentIndent'] - 0x2];
  }
  ['getCurrentNode']() {
    return this['nodeStack'][this['currentIndent'] - 0x1];
  }
  ['getCurrentProp']() {
    return this['currentProp'];
  }
  ['pushStack'](_0x58495c) {
    (this['nodeStack']['push'](_0x58495c), (this['currentIndent'] += 0x1));
  }
  ['popStack']() {
    (this['nodeStack']['pop'](), (this['currentIndent'] -= 0x1));
  }
  ['setCurrentProp'](_0x5a7cff, _0xd14bd2) {
    ((this['currentProp'] = _0x5a7cff), (this['currentPropName'] = _0xd14bd2));
  }
  ['parse'](_0x146b11) {
    ((this['currentIndent'] = 0x0),
      (this['allNodes'] = new FBXTree()),
      (this['nodeStack'] = []),
      (this['currentProp'] = []),
      (this['currentPropName'] = ''));
    const _0x4d6824 = this,
      _0x3c55b4 = _0x146b11['split'](/[\r\n]+/);
    return (
      _0x3c55b4['forEach'](function (_0x5bccf4, _0xa73976) {
        const _0x4e6448 = _0x5bccf4['match'](/^[\s\t]*;/),
          _0x55138b = _0x5bccf4['match'](/^[\s\t]*$/);
        if (_0x4e6448 || _0x55138b) return;
        const _0x1f48dd = _0x5bccf4['match']('^\x5ct{' + _0x4d6824['currentIndent'] + '}(\\w+):(.*){', ''),
          _0xd17f9a = _0x5bccf4['match'](
            '^\x5ct{' + _0x4d6824['currentIndent'] + '}(\\w+):[\\s\\t\\r\\n](.*)',
          ),
          _0x219951 = _0x5bccf4['match']('^\\t{' + (_0x4d6824['currentIndent'] - 0x1) + '}}');
        if (_0x1f48dd) _0x4d6824['parseNodeBegin'](_0x5bccf4, _0x1f48dd);
        else {
          if (_0xd17f9a) _0x4d6824['parseNodeProperty'](_0x5bccf4, _0xd17f9a, _0x3c55b4[++_0xa73976]);
          else {
            if (_0x219951) _0x4d6824['popStack']();
            else _0x5bccf4['match'](/^[^\s\t}]/) && _0x4d6824['parseNodePropertyContinued'](_0x5bccf4);
          }
        }
      }),
      this['allNodes']
    );
  }
  ['parseNodeBegin'](_0x156fc7, _0x2930d1) {
    const _0x4d4d32 = _0x2930d1[0x1]['trim']()['replace'](/^"/, '')['replace'](/"$/, ''),
      _0x158154 = _0x2930d1[0x2]['split'](',')['map'](function (_0x26a985) {
        return _0x26a985['trim']()['replace'](/^"/, '')['replace'](/"$/, '');
      }),
      _0x3b8ae0 = { name: _0x4d4d32 },
      _0x929a86 = this['parseNodeAttr'](_0x158154),
      _0x51cbc0 = this['getCurrentNode']();
    if (this['currentIndent'] === 0x0) this['allNodes']['add'](_0x4d4d32, _0x3b8ae0);
    else {
      if (_0x4d4d32 in _0x51cbc0) {
        if (_0x4d4d32 === 'PoseNode') _0x51cbc0['PoseNode']['push'](_0x3b8ae0);
        else
          _0x51cbc0[_0x4d4d32]['id'] !== undefined &&
            ((_0x51cbc0[_0x4d4d32] = {}),
            (_0x51cbc0[_0x4d4d32][_0x51cbc0[_0x4d4d32]['id']] = _0x51cbc0[_0x4d4d32]));
        if (_0x929a86['id'] !== '') _0x51cbc0[_0x4d4d32][_0x929a86['id']] = _0x3b8ae0;
      } else {
        if (typeof _0x929a86['id'] === 'number')
          ((_0x51cbc0[_0x4d4d32] = {}), (_0x51cbc0[_0x4d4d32][_0x929a86['id']] = _0x3b8ae0));
        else {
          if (_0x4d4d32 !== 'Properties70') {
            if (_0x4d4d32 === 'PoseNode') _0x51cbc0[_0x4d4d32] = [_0x3b8ae0];
            else _0x51cbc0[_0x4d4d32] = _0x3b8ae0;
          }
        }
      }
    }
    if (typeof _0x929a86['id'] === 'number') _0x3b8ae0['id'] = _0x929a86['id'];
    if (_0x929a86['name'] !== '') _0x3b8ae0['attrName'] = _0x929a86['name'];
    if (_0x929a86['type'] !== '') _0x3b8ae0['attrType'] = _0x929a86['type'];
    this['pushStack'](_0x3b8ae0);
  }
  ['parseNodeAttr'](_0x134488) {
    let _0x1c16c3 = _0x134488[0x0];
    _0x134488[0x0] !== '' &&
      ((_0x1c16c3 = parseInt(_0x134488[0x0])), isNaN(_0x1c16c3) && (_0x1c16c3 = _0x134488[0x0]));
    let _0x7cde33 = '',
      _0x418827 = '';
    return (
      _0x134488['length'] > 0x1 &&
        ((_0x7cde33 = _0x134488[0x1]['replace'](/^(\w+)::/, '')), (_0x418827 = _0x134488[0x2])),
      { id: _0x1c16c3, name: _0x7cde33, type: _0x418827 }
    );
  }
  ['parseNodeProperty'](_0x370604, _0x649e0d, _0x5d6bd3) {
    let _0x1a3831 = _0x649e0d[0x1]['replace'](/^"/, '')['replace'](/"$/, '')['trim'](),
      _0x26f668 = _0x649e0d[0x2]['replace'](/^"/, '')['replace'](/"$/, '')['trim']();
    _0x1a3831 === 'Content' &&
      _0x26f668 === ',' &&
      (_0x26f668 = _0x5d6bd3['replace'](/"/g, '')['replace'](/,$/, '')['trim']());
    const _0x22ff7d = this['getCurrentNode'](),
      _0x21abc1 = _0x22ff7d['name'];
    if (_0x21abc1 === 'Properties70') {
      this['parseNodeSpecialProperty'](_0x370604, _0x1a3831, _0x26f668);
      return;
    }
    if (_0x1a3831 === 'C') {
      const _0x2b4e7d = _0x26f668['split'](',')['slice'](0x1),
        _0x23e317 = parseInt(_0x2b4e7d[0x0]),
        _0x160404 = parseInt(_0x2b4e7d[0x1]);
      let _0x3d3b03 = _0x26f668['split'](',')['slice'](0x3);
      ((_0x3d3b03 = _0x3d3b03['map'](function (_0x2d4ba3) {
        return _0x2d4ba3['trim']()['replace'](/^"/, '');
      })),
        (_0x1a3831 = 'connections'),
        (_0x26f668 = [_0x23e317, _0x160404]),
        append(_0x26f668, _0x3d3b03),
        _0x22ff7d[_0x1a3831] === undefined && (_0x22ff7d[_0x1a3831] = []));
    }
    if (_0x1a3831 === 'Node') _0x22ff7d['id'] = _0x26f668;
    if (_0x1a3831 in _0x22ff7d && Array['isArray'](_0x22ff7d[_0x1a3831]))
      _0x22ff7d[_0x1a3831]['push'](_0x26f668);
    else {
      if (_0x1a3831 !== 'a') _0x22ff7d[_0x1a3831] = _0x26f668;
      else _0x22ff7d['a'] = _0x26f668;
    }
    (this['setCurrentProp'](_0x22ff7d, _0x1a3831),
      _0x1a3831 === 'a' &&
        _0x26f668['slice'](-0x1) !== ',' &&
        (_0x22ff7d['a'] = parseNumberArray(_0x26f668)));
  }
  ['parseNodePropertyContinued'](_0x5c41ea) {
    const _0x37e8d4 = this['getCurrentNode']();
    ((_0x37e8d4['a'] += _0x5c41ea),
      _0x5c41ea['slice'](-0x1) !== ',' && (_0x37e8d4['a'] = parseNumberArray(_0x37e8d4['a'])));
  }
  ['parseNodeSpecialProperty'](_0x2d200c, _0x12bf7c, _0x3b2967) {
    const _0x529168 = _0x3b2967['split']('\x22,')['map'](function (_0x40dbeb) {
        return _0x40dbeb['trim']()['replace'](/^\"/, '')['replace'](/\s/, '_');
      }),
      _0x471849 = _0x529168[0x0],
      _0x3e4157 = _0x529168[0x1],
      _0xbb2a31 = _0x529168[0x2],
      _0x55616e = _0x529168[0x3];
    let _0x5e6e52 = _0x529168[0x4];
    switch (_0x3e4157) {
      case 'int':
      case 'enum':
      case 'bool':
      case 'ULongLong':
      case 'double':
      case 'Number':
      case 'FieldOfView':
        _0x5e6e52 = parseFloat(_0x5e6e52);
        break;
      case 'Color':
      case 'ColorRGB':
      case 'Vector3D':
      case 'Lcl_Translation':
      case 'Lcl_Rotation':
      case 'Lcl_Scaling':
        _0x5e6e52 = parseNumberArray(_0x5e6e52);
        break;
    }
    ((this['getPrevNode']()[_0x471849] = {
      type: _0x3e4157,
      type2: _0xbb2a31,
      flag: _0x55616e,
      value: _0x5e6e52,
    }),
      this['setCurrentProp'](this['getPrevNode'](), _0x471849));
  }
}
class BinaryParser {
  ['parse'](_0xa31069) {
    const _0x196c8e = new BinaryReader(_0xa31069);
    _0x196c8e['skip'](0x17);
    const _0x549172 = _0x196c8e['getUint32']();
    if (_0x549172 < 0x1900)
      throw new Error(
        'THREE.FBXLoader:\x20FBX\x20version\x20not\x20supported,\x20FileVersion:\x20' + _0x549172,
      );
    const _0x4bcb41 = new FBXTree();
    while (!this['endOfContent'](_0x196c8e)) {
      const _0x2e3a85 = this['parseNode'](_0x196c8e, _0x549172);
      if (_0x2e3a85 !== null) _0x4bcb41['add'](_0x2e3a85['name'], _0x2e3a85);
    }
    return _0x4bcb41;
  }
  ['endOfContent'](_0x157cda) {
    return _0x157cda['size']() % 0x10 === 0x0
      ? ((_0x157cda['getOffset']() + 0xa0 + 0x10) & ~0xf) >= _0x157cda['size']()
      : _0x157cda['getOffset']() + 0xa0 + 0x10 >= _0x157cda['size']();
  }
  ['parseNode'](_0x45e3e6, _0x2a7e22) {
    const _0x285204 = {},
      _0x52aebc = _0x2a7e22 >= 0x1d4c ? _0x45e3e6['getUint64']() : _0x45e3e6['getUint32'](),
      _0x5a47cd = _0x2a7e22 >= 0x1d4c ? _0x45e3e6['getUint64']() : _0x45e3e6['getUint32']();
    _0x2a7e22 >= 0x1d4c ? _0x45e3e6['getUint64']() : _0x45e3e6['getUint32']();
    const _0x2a5969 = _0x45e3e6['getUint8'](),
      _0x3694e2 = _0x45e3e6['getString'](_0x2a5969);
    if (_0x52aebc === 0x0) return null;
    const _0xc713f4 = [];
    for (let _0x5a925d = 0x0; _0x5a925d < _0x5a47cd; _0x5a925d++) {
      _0xc713f4['push'](this['parseProperty'](_0x45e3e6));
    }
    const _0x5dfaf8 = _0xc713f4['length'] > 0x0 ? _0xc713f4[0x0] : '',
      _0xbb127b = _0xc713f4['length'] > 0x1 ? _0xc713f4[0x1] : '',
      _0x148f2b = _0xc713f4['length'] > 0x2 ? _0xc713f4[0x2] : '';
    _0x285204['singleProperty'] = _0x5a47cd === 0x1 && _0x45e3e6['getOffset']() === _0x52aebc ? !![] : ![];
    while (_0x52aebc > _0x45e3e6['getOffset']()) {
      const _0x2af960 = this['parseNode'](_0x45e3e6, _0x2a7e22);
      if (_0x2af960 !== null) this['parseSubNode'](_0x3694e2, _0x285204, _0x2af960);
    }
    _0x285204['propertyList'] = _0xc713f4;
    if (typeof _0x5dfaf8 === 'number') _0x285204['id'] = _0x5dfaf8;
    if (_0xbb127b !== '') _0x285204['attrName'] = _0xbb127b;
    if (_0x148f2b !== '') _0x285204['attrType'] = _0x148f2b;
    if (_0x3694e2 !== '') _0x285204['name'] = _0x3694e2;
    return _0x285204;
  }
  ['parseSubNode'](_0x47dbb9, _0xfba489, _0x15891c) {
    if (_0x15891c['singleProperty'] === !![]) {
      const _0x469a9a = _0x15891c['propertyList'][0x0];
      Array['isArray'](_0x469a9a)
        ? ((_0xfba489[_0x15891c['name']] = _0x15891c), (_0x15891c['a'] = _0x469a9a))
        : (_0xfba489[_0x15891c['name']] = _0x469a9a);
    } else {
      if (_0x47dbb9 === 'Connections' && _0x15891c['name'] === 'C') {
        const _0xbc5d30 = [];
        (_0x15891c['propertyList']['forEach'](function (_0x5a8560, _0x38e41a) {
          if (_0x38e41a !== 0x0) _0xbc5d30['push'](_0x5a8560);
        }),
          _0xfba489['connections'] === undefined && (_0xfba489['connections'] = []),
          _0xfba489['connections']['push'](_0xbc5d30));
      } else {
        if (_0x15891c['name'] === 'Properties70') {
          const _0x27747e = Object['keys'](_0x15891c);
          _0x27747e['forEach'](function (_0x51369a) {
            _0xfba489[_0x51369a] = _0x15891c[_0x51369a];
          });
        } else {
          if (_0x47dbb9 === 'Properties70' && _0x15891c['name'] === 'P') {
            let _0x105d48 = _0x15891c['propertyList'][0x0],
              _0x5f74d6 = _0x15891c['propertyList'][0x1];
            const _0x32fc74 = _0x15891c['propertyList'][0x2],
              _0x1471dd = _0x15891c['propertyList'][0x3];
            let _0x4df0ba;
            if (_0x105d48['indexOf']('Lcl ') === 0x0) _0x105d48 = _0x105d48['replace']('Lcl\x20', 'Lcl_');
            if (_0x5f74d6['indexOf']('Lcl ') === 0x0) _0x5f74d6 = _0x5f74d6['replace']('Lcl ', 'Lcl_');
            (_0x5f74d6 === 'Color' ||
            _0x5f74d6 === 'ColorRGB' ||
            _0x5f74d6 === 'Vector' ||
            _0x5f74d6 === 'Vector3D' ||
            _0x5f74d6['indexOf']('Lcl_') === 0x0
              ? (_0x4df0ba = [
                  _0x15891c['propertyList'][0x4],
                  _0x15891c['propertyList'][0x5],
                  _0x15891c['propertyList'][0x6],
                ])
              : (_0x4df0ba = _0x15891c['propertyList'][0x4]),
              (_0xfba489[_0x105d48] = {
                type: _0x5f74d6,
                type2: _0x32fc74,
                flag: _0x1471dd,
                value: _0x4df0ba,
              }));
          } else {
            if (_0xfba489[_0x15891c['name']] === undefined)
              typeof _0x15891c['id'] === 'number'
                ? ((_0xfba489[_0x15891c['name']] = {}),
                  (_0xfba489[_0x15891c['name']][_0x15891c['id']] = _0x15891c))
                : (_0xfba489[_0x15891c['name']] = _0x15891c);
            else {
              if (_0x15891c['name'] === 'PoseNode')
                (!Array['isArray'](_0xfba489[_0x15891c['name']]) &&
                  (_0xfba489[_0x15891c['name']] = [_0xfba489[_0x15891c['name']]]),
                  _0xfba489[_0x15891c['name']]['push'](_0x15891c));
              else
                _0xfba489[_0x15891c['name']][_0x15891c['id']] === undefined &&
                  (_0xfba489[_0x15891c['name']][_0x15891c['id']] = _0x15891c);
            }
          }
        }
      }
    }
  }
  ['parseProperty'](_0xfcca19) {
    const _0x5b81f5 = _0xfcca19['getString'](0x1);
    let _0x186e28;
    switch (_0x5b81f5) {
      case 'C':
        return _0xfcca19['getBoolean']();
      case 'D':
        return _0xfcca19['getFloat64']();
      case 'F':
        return _0xfcca19['getFloat32']();
      case 'I':
        return _0xfcca19['getInt32']();
      case 'L':
        return _0xfcca19['getInt64']();
      case 'R':
        _0x186e28 = _0xfcca19['getUint32']();
        return _0xfcca19['getArrayBuffer'](_0x186e28);
      case 'S':
        _0x186e28 = _0xfcca19['getUint32']();
        return _0xfcca19['getString'](_0x186e28);
      case 'Y':
        return _0xfcca19['getInt16']();
      case 'b':
      case 'c':
      case 'd':
      case 'f':
      case 'i':
      case 'l':
        const _0x22a3f6 = _0xfcca19['getUint32'](),
          _0x451d6a = _0xfcca19['getUint32'](),
          _0xa64d3 = _0xfcca19['getUint32']();
        if (_0x451d6a === 0x0)
          switch (_0x5b81f5) {
            case 'b':
            case 'c':
              return _0xfcca19['getBooleanArray'](_0x22a3f6);
            case 'd':
              return _0xfcca19['getFloat64Array'](_0x22a3f6);
            case 'f':
              return _0xfcca19['getFloat32Array'](_0x22a3f6);
            case 'i':
              return _0xfcca19['getInt32Array'](_0x22a3f6);
            case 'l':
              return _0xfcca19['getInt64Array'](_0x22a3f6);
          }
        const _0xd3032 = fflate_module['unzlibSync'](new Uint8Array(_0xfcca19['getArrayBuffer'](_0xa64d3))),
          _0x54e2a2 = new BinaryReader(_0xd3032['buffer']);
        switch (_0x5b81f5) {
          case 'b':
          case 'c':
            return _0x54e2a2['getBooleanArray'](_0x22a3f6);
          case 'd':
            return _0x54e2a2['getFloat64Array'](_0x22a3f6);
          case 'f':
            return _0x54e2a2['getFloat32Array'](_0x22a3f6);
          case 'i':
            return _0x54e2a2['getInt32Array'](_0x22a3f6);
          case 'l':
            return _0x54e2a2['getInt64Array'](_0x22a3f6);
        }
        break;
      default:
        throw new Error('THREE.FBXLoader: Unknown property type ' + _0x5b81f5);
    }
  }
}
class BinaryReader {
  constructor(_0x3bbc9a, _0x1bb584) {
    ((this['dv'] = new DataView(_0x3bbc9a)),
      (this['offset'] = 0x0),
      (this['littleEndian'] = _0x1bb584 !== undefined ? _0x1bb584 : !![]),
      (this['_textDecoder'] = new TextDecoder()));
  }
  ['getOffset']() {
    return this['offset'];
  }
  ['size']() {
    return this['dv']['buffer']['byteLength'];
  }
  ['skip'](_0x523b87) {
    this['offset'] += _0x523b87;
  }
  ['getBoolean']() {
    return (this['getUint8']() & 0x1) === 0x1;
  }
  ['getBooleanArray'](_0x41863e) {
    const _0x360e08 = [];
    for (let _0x415b8a = 0x0; _0x415b8a < _0x41863e; _0x415b8a++) {
      _0x360e08['push'](this['getBoolean']());
    }
    return _0x360e08;
  }
  ['getUint8']() {
    const _0x9cf902 = this['dv']['getUint8'](this['offset']);
    return ((this['offset'] += 0x1), _0x9cf902);
  }
  ['getInt16']() {
    const _0x30aeca = this['dv']['getInt16'](this['offset'], this['littleEndian']);
    return ((this['offset'] += 0x2), _0x30aeca);
  }
  ['getInt32']() {
    const _0x38cde0 = this['dv']['getInt32'](this['offset'], this['littleEndian']);
    return ((this['offset'] += 0x4), _0x38cde0);
  }
  ['getInt32Array'](_0x31cec5) {
    const _0x1aa65a = [];
    for (let _0x75da38 = 0x0; _0x75da38 < _0x31cec5; _0x75da38++) {
      _0x1aa65a['push'](this['getInt32']());
    }
    return _0x1aa65a;
  }
  ['getUint32']() {
    const _0x3284f2 = this['dv']['getUint32'](this['offset'], this['littleEndian']);
    return ((this['offset'] += 0x4), _0x3284f2);
  }
  ['getInt64']() {
    let _0x4b43a1, _0x604592;
    this['littleEndian']
      ? ((_0x4b43a1 = this['getUint32']()), (_0x604592 = this['getUint32']()))
      : ((_0x604592 = this['getUint32']()), (_0x4b43a1 = this['getUint32']()));
    if (_0x604592 & 0x80000000) {
      ((_0x604592 = ~_0x604592 & 0xffffffff), (_0x4b43a1 = ~_0x4b43a1 & 0xffffffff));
      if (_0x4b43a1 === 0xffffffff) _0x604592 = (_0x604592 + 0x1) & 0xffffffff;
      return ((_0x4b43a1 = (_0x4b43a1 + 0x1) & 0xffffffff), -(_0x604592 * 0x100000000 + _0x4b43a1));
    }
    return _0x604592 * 0x100000000 + _0x4b43a1;
  }
  ['getInt64Array'](_0x6894ae) {
    const _0x3bc3ec = [];
    for (let _0x151764 = 0x0; _0x151764 < _0x6894ae; _0x151764++) {
      _0x3bc3ec['push'](this['getInt64']());
    }
    return _0x3bc3ec;
  }
  ['getUint64']() {
    let _0x77ad21, _0x475bd4;
    return (
      this['littleEndian']
        ? ((_0x77ad21 = this['getUint32']()), (_0x475bd4 = this['getUint32']()))
        : ((_0x475bd4 = this['getUint32']()), (_0x77ad21 = this['getUint32']())),
      _0x475bd4 * 0x100000000 + _0x77ad21
    );
  }
  ['getFloat32']() {
    const _0x183f79 = this['dv']['getFloat32'](this['offset'], this['littleEndian']);
    return ((this['offset'] += 0x4), _0x183f79);
  }
  ['getFloat32Array'](_0x59cd56) {
    const _0x19f1d8 = [];
    for (let _0x7b52fa = 0x0; _0x7b52fa < _0x59cd56; _0x7b52fa++) {
      _0x19f1d8['push'](this['getFloat32']());
    }
    return _0x19f1d8;
  }
  ['getFloat64']() {
    const _0x4e9b29 = this['dv']['getFloat64'](this['offset'], this['littleEndian']);
    return ((this['offset'] += 0x8), _0x4e9b29);
  }
  ['getFloat64Array'](_0x1dff9e) {
    const _0x3832d1 = [];
    for (let _0x456c3e = 0x0; _0x456c3e < _0x1dff9e; _0x456c3e++) {
      _0x3832d1['push'](this['getFloat64']());
    }
    return _0x3832d1;
  }
  ['getArrayBuffer'](_0x234d8a) {
    const _0x2ee8cf = this['dv']['buffer']['slice'](this['offset'], this['offset'] + _0x234d8a);
    return ((this['offset'] += _0x234d8a), _0x2ee8cf);
  }
  ['getString'](_0x55569f) {
    const _0x571134 = this['offset'];
    let _0x1f116c = new Uint8Array(this['dv']['buffer'], _0x571134, _0x55569f);
    this['skip'](_0x55569f);
    const _0x163a3b = _0x1f116c['indexOf'](0x0);
    if (_0x163a3b >= 0x0) _0x1f116c = new Uint8Array(this['dv']['buffer'], _0x571134, _0x163a3b);
    return this['_textDecoder']['decode'](_0x1f116c);
  }
}
class FBXTree {
  ['add'](_0x1e0754, _0x38c9f6) {
    this[_0x1e0754] = _0x38c9f6;
  }
}
function isFbxFormatBinary(_0x23f78d) {
  const _0x398816 = 'Kaydara FBX Binary  \u0000';
  return (
    _0x23f78d['byteLength'] >= _0x398816['length'] &&
    _0x398816 === convertArrayBufferToString(_0x23f78d, 0x0, _0x398816['length'])
  );
}
function isFbxFormatASCII(_0x25a282) {
  const _0x33cc2e = [
    'K',
    'a',
    'y',
    'd',
    'a',
    'r',
    'a',
    '\x5c',
    'F',
    'B',
    'X',
    '\x5c',
    'B',
    'i',
    'n',
    'a',
    'r',
    'y',
    '\x5c',
    '\x5c',
  ];
  let _0x32d70f = 0x0;
  function _0x54f836(_0x35723f) {
    const _0x5e4166 = _0x25a282[_0x35723f - 0x1];
    return ((_0x25a282 = _0x25a282['slice'](_0x32d70f + _0x35723f)), _0x32d70f++, _0x5e4166);
  }
  for (let _0x892ce4 = 0x0; _0x892ce4 < _0x33cc2e['length']; ++_0x892ce4) {
    const _0x45ba48 = _0x54f836(0x1);
    if (_0x45ba48 === _0x33cc2e[_0x892ce4]) return ![];
  }
  return !![];
}
function getFbxVersion(_0x414622) {
  const _0x594ab0 = /FBXVersion: (\d+)/,
    _0x963da5 = _0x414622['match'](_0x594ab0);
  if (_0x963da5) {
    const _0xfa09d3 = parseInt(_0x963da5[0x1]);
    return _0xfa09d3;
  }
  throw new Error('THREE.FBXLoader: Cannot find the version number for the file given.');
}
function convertFBXTimeToSeconds(_0x27e81c) {
  return _0x27e81c / 0xac0e8d7b0;
}
const dataArray = [];
function getData(_0x3b77e5, _0x5def46, _0x1dccca, _0x71560c) {
  let _0x385494;
  switch (_0x71560c['mappingType']) {
    case 'ByPolygonVertex':
      _0x385494 = _0x3b77e5;
      break;
    case 'ByPolygon':
      _0x385494 = _0x5def46;
      break;
    case 'ByVertice':
      _0x385494 = _0x1dccca;
      break;
    case 'AllSame':
      _0x385494 = _0x71560c['indices'][0x0];
      break;
    default:
      console['warn']('THREE.FBXLoader: unknown attribute mapping type ' + _0x71560c['mappingType']);
  }
  if (_0x71560c['referenceType'] === 'IndexToDirect') _0x385494 = _0x71560c['indices'][_0x385494];
  const _0x195f31 = _0x385494 * _0x71560c['dataSize'],
    _0x32c302 = _0x195f31 + _0x71560c['dataSize'];
  return slice(dataArray, _0x71560c['buffer'], _0x195f31, _0x32c302);
}
const tempEuler = new Euler(),
  tempVec = new Vector3();
function generateTransform(_0x131d64) {
  const _0x5349ba = new Matrix4(),
    _0x190183 = new Matrix4(),
    _0x4d0256 = new Matrix4(),
    _0x296759 = new Matrix4(),
    _0x2bd647 = new Matrix4(),
    _0x2e6629 = new Matrix4(),
    _0x438341 = new Matrix4(),
    _0x920c39 = new Matrix4(),
    _0x4692fa = new Matrix4(),
    _0x42d6b4 = new Matrix4(),
    _0x200f6b = new Matrix4(),
    _0x7ab415 = new Matrix4(),
    _0x3dc66c = _0x131d64['inheritType'] ? _0x131d64['inheritType'] : 0x0;
  if (_0x131d64['translation']) _0x5349ba['setPosition'](tempVec['fromArray'](_0x131d64['translation']));
  const _0x4d9c1f = getEulerOrder(0x0);
  if (_0x131d64['preRotation']) {
    const _0x51d208 = _0x131d64['preRotation']['map'](MathUtils['degToRad']);
    (_0x51d208['push'](_0x4d9c1f), _0x190183['makeRotationFromEuler'](tempEuler['fromArray'](_0x51d208)));
  }
  if (_0x131d64['rotation']) {
    const _0x540489 = _0x131d64['rotation']['map'](MathUtils['degToRad']);
    (_0x540489['push'](_0x131d64['eulerOrder'] || _0x4d9c1f),
      _0x4d0256['makeRotationFromEuler'](tempEuler['fromArray'](_0x540489)));
  }
  if (_0x131d64['postRotation']) {
    const _0x23e276 = _0x131d64['postRotation']['map'](MathUtils['degToRad']);
    (_0x23e276['push'](_0x4d9c1f),
      _0x296759['makeRotationFromEuler'](tempEuler['fromArray'](_0x23e276)),
      _0x296759['invert']());
  }
  if (_0x131d64['scale']) _0x2bd647['scale'](tempVec['fromArray'](_0x131d64['scale']));
  if (_0x131d64['scalingOffset']) _0x438341['setPosition'](tempVec['fromArray'](_0x131d64['scalingOffset']));
  if (_0x131d64['scalingPivot']) _0x2e6629['setPosition'](tempVec['fromArray'](_0x131d64['scalingPivot']));
  if (_0x131d64['rotationOffset'])
    _0x920c39['setPosition'](tempVec['fromArray'](_0x131d64['rotationOffset']));
  if (_0x131d64['rotationPivot']) _0x4692fa['setPosition'](tempVec['fromArray'](_0x131d64['rotationPivot']));
  _0x131d64['parentMatrixWorld'] &&
    (_0x200f6b['copy'](_0x131d64['parentMatrix']), _0x42d6b4['copy'](_0x131d64['parentMatrixWorld']));
  const _0x5d60b5 = _0x190183['clone']()['multiply'](_0x4d0256)['multiply'](_0x296759),
    _0x17f36a = new Matrix4();
  _0x17f36a['extractRotation'](_0x42d6b4);
  const _0x226bb8 = new Matrix4();
  _0x226bb8['copyPosition'](_0x42d6b4);
  const _0xb41ced = _0x226bb8['clone']()['invert']()['multiply'](_0x42d6b4),
    _0x383757 = _0x17f36a['clone']()['invert']()['multiply'](_0xb41ced),
    _0x16943c = _0x2bd647,
    _0xa37b2d = new Matrix4();
  if (_0x3dc66c === 0x0)
    _0xa37b2d['copy'](_0x17f36a)['multiply'](_0x5d60b5)['multiply'](_0x383757)['multiply'](_0x16943c);
  else {
    if (_0x3dc66c === 0x1)
      _0xa37b2d['copy'](_0x17f36a)['multiply'](_0x383757)['multiply'](_0x5d60b5)['multiply'](_0x16943c);
    else {
      const _0x4d6bdb = new Matrix4()['scale'](new Vector3()['setFromMatrixScale'](_0x200f6b)),
        _0x50a023 = _0x4d6bdb['clone']()['invert'](),
        _0x184c2d = _0x383757['clone']()['multiply'](_0x50a023);
      _0xa37b2d['copy'](_0x17f36a)['multiply'](_0x5d60b5)['multiply'](_0x184c2d)['multiply'](_0x16943c);
    }
  }
  const _0xb17d96 = _0x4692fa['clone']()['invert'](),
    _0x13ddae = _0x2e6629['clone']()['invert']();
  let _0x3570d4 = _0x5349ba['clone']()
    ['multiply'](_0x920c39)
    ['multiply'](_0x4692fa)
    ['multiply'](_0x190183)
    ['multiply'](_0x4d0256)
    ['multiply'](_0x296759)
    ['multiply'](_0xb17d96)
    ['multiply'](_0x438341)
    ['multiply'](_0x2e6629)
    ['multiply'](_0x2bd647)
    ['multiply'](_0x13ddae);
  const _0x5dfe78 = new Matrix4()['copyPosition'](_0x3570d4),
    _0x4a58bd = _0x42d6b4['clone']()['multiply'](_0x5dfe78);
  return (
    _0x7ab415['copyPosition'](_0x4a58bd),
    (_0x3570d4 = _0x7ab415['clone']()['multiply'](_0xa37b2d)),
    _0x3570d4['premultiply'](_0x42d6b4['invert']()),
    _0x3570d4
  );
}
function getEulerOrder(_0x175be8) {
  _0x175be8 = _0x175be8 || 0x0;
  const _0x2135ae = ['ZYX', 'YZX', 'XZY', 'ZXY', 'YXZ', 'XYZ'];
  if (_0x175be8 === 0x6)
    return (
      console['warn'](
        'THREE.FBXLoader: unsupported Euler Order: Spherical XYZ. Animations and rotations may be incorrect.',
      ),
      _0x2135ae[0x0]
    );
  return _0x2135ae[_0x175be8];
}
function parseNumberArray(_0x186851) {
  const _0x4a3788 = _0x186851['split'](',')['map'](function (_0x151cba) {
    return parseFloat(_0x151cba);
  });
  return _0x4a3788;
}
function convertArrayBufferToString(_0x3441a2, _0xee08f3, _0x4011ba) {
  if (_0xee08f3 === undefined) _0xee08f3 = 0x0;
  if (_0x4011ba === undefined) _0x4011ba = _0x3441a2['byteLength'];
  return new TextDecoder()['decode'](new Uint8Array(_0x3441a2, _0xee08f3, _0x4011ba));
}
function append(_0x134ca7, _0x2bf45b) {
  for (
    let _0x47e8c8 = 0x0, _0x182286 = _0x134ca7['length'], _0x52cfda = _0x2bf45b['length'];
    _0x47e8c8 < _0x52cfda;
    _0x47e8c8++, _0x182286++
  ) {
    _0x134ca7[_0x182286] = _0x2bf45b[_0x47e8c8];
  }
}
function slice(_0x18264c, _0x516a47, _0x86958c, _0x4ccbe4) {
  for (let _0x1ca697 = _0x86958c, _0x24e433 = 0x0; _0x1ca697 < _0x4ccbe4; _0x1ca697++, _0x24e433++) {
    _0x18264c[_0x24e433] = _0x516a47[_0x1ca697];
  }
  return _0x18264c;
}
export { FBXLoader };
