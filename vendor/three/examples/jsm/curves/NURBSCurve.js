import { Curve, Vector3, Vector4 } from '../../../three.module.js';
import * as NURBSUtils from '../curves/NURBSUtils.js';
class NURBSCurve extends Curve {
  constructor(_0x5904f7, _0x5b3762, _0x745c3b, _0x674fc8, _0x354b58) {
    super();
    const _0x5eb4f5 = _0x5b3762 ? _0x5b3762['length'] - 0x1 : 0x0,
      _0x3180b3 = _0x745c3b ? _0x745c3b['length'] : 0x0;
    ((this['degree'] = _0x5904f7),
      (this['knots'] = _0x5b3762),
      (this['controlPoints'] = []),
      (this['startKnot'] = _0x674fc8 || 0x0),
      (this['endKnot'] = _0x354b58 || _0x5eb4f5));
    for (let _0x515602 = 0x0; _0x515602 < _0x3180b3; ++_0x515602) {
      const _0x52caee = _0x745c3b[_0x515602];
      this['controlPoints'][_0x515602] = new Vector4(
        _0x52caee['x'],
        _0x52caee['y'],
        _0x52caee['z'],
        _0x52caee['w'],
      );
    }
  }
  ['getPoint'](_0x1a5cec, _0x371296 = new Vector3()) {
    const _0x34eea8 = _0x371296,
      _0x4a1612 =
        this['knots'][this['startKnot']] +
        _0x1a5cec * (this['knots'][this['endKnot']] - this['knots'][this['startKnot']]),
      _0x128046 = NURBSUtils['calcBSplinePoint'](
        this['degree'],
        this['knots'],
        this['controlPoints'],
        _0x4a1612,
      );
    return (
      _0x128046['w'] !== 0x1 && _0x128046['divideScalar'](_0x128046['w']),
      _0x34eea8['set'](_0x128046['x'], _0x128046['y'], _0x128046['z'])
    );
  }
  ['getTangent'](_0x4a43d0, _0x46d1dd = new Vector3()) {
    const _0x482aff = _0x46d1dd,
      _0x3b7f81 =
        this['knots'][0x0] + _0x4a43d0 * (this['knots'][this['knots']['length'] - 0x1] - this['knots'][0x0]),
      _0x1b0231 = NURBSUtils['calcNURBSDerivatives'](
        this['degree'],
        this['knots'],
        this['controlPoints'],
        _0x3b7f81,
        0x1,
      );
    return (_0x482aff['copy'](_0x1b0231[0x1])['normalize'](), _0x482aff);
  }
  ['toJSON']() {
    const _0x1ea71c = super['toJSON']();
    return (
      (_0x1ea71c['degree'] = this['degree']),
      (_0x1ea71c['knots'] = [...this['knots']]),
      (_0x1ea71c['controlPoints'] = this['controlPoints']['map']((_0x3771ee) => _0x3771ee['toArray']())),
      (_0x1ea71c['startKnot'] = this['startKnot']),
      (_0x1ea71c['endKnot'] = this['endKnot']),
      _0x1ea71c
    );
  }
  ['fromJSON'](_0x39efbf) {
    return (
      super['fromJSON'](_0x39efbf),
      (this['degree'] = _0x39efbf['degree']),
      (this['knots'] = [..._0x39efbf['knots']]),
      (this['controlPoints'] = _0x39efbf['controlPoints']['map'](
        (_0x53c7e4) => new Vector4(_0x53c7e4[0x0], _0x53c7e4[0x1], _0x53c7e4[0x2], _0x53c7e4[0x3]),
      )),
      (this['startKnot'] = _0x39efbf['startKnot']),
      (this['endKnot'] = _0x39efbf['endKnot']),
      this
    );
  }
}
export { NURBSCurve };
