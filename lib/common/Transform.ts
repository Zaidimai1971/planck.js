/*
 * Planck.js
 * The MIT License
 * Copyright (c) 2021 Erin Catto, Ali Shakiba
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


// @ts-ignore
const _DEBUG = typeof DEBUG === 'undefined' ? false : DEBUG;
// @ts-ignore
const _ASSERT = typeof ASSERT === 'undefined' ? false : ASSERT;

import common from '../util/common';
import Vec2 from './Vec2';
import Rot from './Rot';


/**
 * A transform contains translation and rotation. It is used to represent the
 * position and orientation of rigid frames. Initialize using a position vector
 * and a rotation.
 */
export default class Transform {
  /** position */
  p: Vec2;

  /** rotation */
  q: Rot;

  constructor(position?: Vec2, rotation?: number) {
    if (!(this instanceof Transform)) {
      return new Transform(position, rotation);
    }
    this.p = Vec2.zero();
    this.q = Rot.identity();
    if (typeof position !== 'undefined') {
      this.p.set(position);
    }
    if (typeof rotation !== 'undefined') {
      this.q.set(rotation);
    }
  }

  static clone(xf: Transform): Transform {
    const obj = Object.create(Transform.prototype);
    obj.p = Vec2.clone(xf.p);
    obj.q = Rot.clone(xf.q);
    return obj;
  }

  /** @internal */
  static neo(position: Vec2, rotation: Rot): Transform {
    const obj = Object.create(Transform.prototype);
    obj.p = Vec2.clone(position);
    obj.q = Rot.clone(rotation);
    return obj;
  }

  static identity(): Transform {
    const obj = Object.create(Transform.prototype);
    obj.p = Vec2.zero();
    obj.q = Rot.identity();
    return obj;
  }

  /**
   * Set this to the identity transform.
   */
  setIdentity(): void {
    this.p.setZero();
    this.q.setIdentity();
  }

  set(position: Vec2, rotation: number): void;
  set(xf: Transform): void;
  /**
   * Set this based on the position and angle.
   */
  set(a, b?) {
    if (typeof b === 'undefined') {
      this.p.set(a.p);
      this.q.set(a.q);
    } else {
      this.p.set(a);
      this.q.set(b);
    }
  }

  static isValid(o: any): boolean {
    return o && Vec2.isValid(o.p) && Rot.isValid(o.q);
  }

  static assert(o: any): void {
    if (!_ASSERT) return;
    if (!Transform.isValid(o)) {
      _DEBUG && common.debug(o);
      throw new Error('Invalid Transform!');
    }
  }

  static mul(a: Transform, b: Vec2): Vec2;
  static mul(a: Transform, b: Transform): Transform;
  static mul(a: Transform, b: Vec2[]): Vec2[];
  static mul(a: Transform, b: Transform[]): Transform[];
  /**
   * @param {Transform} a
   * @param {Vec2} b
   * @returns {Vec2}
   *
   * @param {Transform} a
   * @param {Transform} b
   * @returns {Transform}
   */
  static mul(a, b) {
    _ASSERT && Transform.assert(a);
    if (Array.isArray(b)) {
      const arr = [];
      for (let i = 0; i < b.length; i++) {
        arr[i] = Transform.mul(a, b[i]);
      }
      return arr;

    } else if ('x' in b && 'y' in b) {
      _ASSERT && Vec2.assert(b);
      const x = (a.q.c * b.x - a.q.s * b.y) + a.p.x;
      const y = (a.q.s * b.x + a.q.c * b.y) + a.p.y;
      return Vec2.neo(x, y);

    } else if ('p' in b && 'q' in b) {
      _ASSERT && Transform.assert(b);
      // v2 = A.q.Rot(B.q.Rot(v1) + B.p) + A.p
      // = (A.q * B.q).Rot(v1) + A.q.Rot(B.p) + A.p
      const xf = Transform.identity();
      xf.q = Rot.mulRot(a.q, b.q);
      xf.p = Vec2.add(Rot.mulVec2(a.q, b.p), a.p);
      return xf;
    }
  }


  // mulAll(a: Transform, b: Vec2[]): Vec2[];
  // mulAll(a: Transform, b: Transform[]): Transform[];
  /** @deprecated Use mulFn instead. */
  static mulAll(a, b) {
    _ASSERT && Transform.assert(a);
    const arr = [];
    for (let i = 0; i < b.length; i++) {
      arr[i] = Transform.mul(a, b[i]);
    }
    return arr;
  }

  /**
   * @experimental
   */
  static mulFn(a) {
    _ASSERT && Transform.assert(a);
    return function(b) {
      return Transform.mul(a, b);
    };
  }

  static mulVec2(a, b) {
    _ASSERT && Transform.assert(a);
    _ASSERT && Vec2.assert(b);
    const x = (a.q.c * b.x - a.q.s * b.y) + a.p.x;
    const y = (a.q.s * b.x + a.q.c * b.y) + a.p.y;
    return Vec2.neo(x, y);
  }

  // static mulVec2(a: Transform, b: Vec2): Vec2;
  // static mulXf(a: Transform, b: Transform): Transform;
  static mulXf(a, b) {
    _ASSERT && Transform.assert(a);
    _ASSERT && Transform.assert(b);
    // v2 = A.q.Rot(B.q.Rot(v1) + B.p) + A.p
    // = (A.q * B.q).Rot(v1) + A.q.Rot(B.p) + A.p
    const xf = Transform.identity();
    xf.q = Rot.mulRot(a.q, b.q);
    xf.p = Vec2.add(Rot.mulVec2(a.q, b.p), a.p);
    return xf;
  }

  static mulT(a: Transform, b: Vec2): Vec2;
  static mulT(a: Transform, b: Transform): Transform;
  /**
   * @param {Transform} a
   * @param {Vec2} b
   * @returns {Vec2}
   *
   * @param {Transform} a
   * @param {Transform} b
   * @returns {Transform}
   */
  static mulT(a, b) {
    _ASSERT && Transform.assert(a);
    if ('x' in b && 'y' in b) {
      _ASSERT && Vec2.assert(b);
      const px = b.x - a.p.x;
      const py = b.y - a.p.y;
      const x = (a.q.c * px + a.q.s * py);
      const y = (-a.q.s * px + a.q.c * py);
      return Vec2.neo(x, y);

    } else if ('p' in b && 'q' in b) {
      _ASSERT && Transform.assert(b);
      // v2 = A.q' * (B.q * v1 + B.p - A.p)
      // = A.q' * B.q * v1 + A.q' * (B.p - A.p)
      const xf = Transform.identity();
      xf.q.set(Rot.mulTRot(a.q, b.q));
      xf.p.set(Rot.mulTVec2(a.q, Vec2.sub(b.p, a.p)));
      return xf;
    }
  }

  static mulTVec2(a: Transform, b: Vec2): Vec2 {
    _ASSERT && Transform.assert(a);
    _ASSERT && Vec2.assert(b);
    const px = b.x - a.p.x;
    const py = b.y - a.p.y;
    const x = (a.q.c * px + a.q.s * py);
    const y = (-a.q.s * px + a.q.c * py);
    return Vec2.neo(x, y);
  }

  static mulTXf(a: Transform, b: Transform): Transform {
    _ASSERT && Transform.assert(a);
    _ASSERT && Transform.assert(b);
    // v2 = A.q' * (B.q * v1 + B.p - A.p)
    // = A.q' * B.q * v1 + A.q' * (B.p - A.p)
    const xf = Transform.identity();
    xf.q.set(Rot.mulTRot(a.q, b.q));
    xf.p.set(Rot.mulTVec2(a.q, Vec2.sub(b.p, a.p)));
    return xf;
  }
}
