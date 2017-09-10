"use strict";

/**
 * This module contains optimized linear algebra routines for sparse and dense matrices
 * in pure Javascript. Support for the former includes methods to compute {@link https://en.wikipedia.org/wiki/Cholesky_decomposition Cholesky},
 * {@link https://en.wikipedia.org/wiki/LU_decomposition LU}, and {@link https://en.wikipedia.org/wiki/QR_decomposition QR} matrix factorizations.
 *
 * This module is implemented in {@link http://asmjs.org asm.js} to obtain the best possible performance for a
 * Javascript program, and was compiled from a wrapper around the C++ library {@link https://eigen.tuxfamily.org Eigen}
 * with {@link http://emscripten.org emscripten}. Future updates will compile the more optimized sparse matrix
 * library {@link http://faculty.cse.tamu.edu/davis/suitesparse.html Suitesparse} to asm.js.
 *
 * @module LinearAlgebra
 */
class Vector {
	/**
	 * This class represents an element of Euclidean 3-space, along with all the usual
	 * vector space operations (addition, multiplication by scalars, etc.).
	 * @constructor module:LinearAlgebra.Vector
	 * @property {number} x The x component of this vector. Default value is 0.
	 * @property {number} y The y component of this vector. Default value is 0.
	 * @property {number} z The z component of this vector. Default value is 0.
	 */
	constructor(x = 0, y = 0, z = 0) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

	/**
	 * Computes the Euclidean length of this vector.
	 * @method module:LinearAlgebra.Vector#norm
	 * @returns {number}
	 */
	norm() {
		return Math.sqrt(this.norm2());
	}

	/**
	 * Computes the Euclidean length squared of this vector.
	 * @method module:LinearAlgebra.Vector#norm2
	 * @returns {number}
	 */
	norm2() {
		return this.dot(this);
	}

	/**
	 * Divides this vector by its Euclidean length.
	 * @method module:LinearAlgebra.Vector#normalize
	 */
	normalize() {
		let n = this.norm();
		this.x /= n;
		this.y /= n;
		this.z /= n;
	}

	/**
	 * Returns a normalized copy of this vector.
	 * @method module:LinearAlgebra.Vector#unit
	 * @returns {module:LinearAlgebra.Vector}
	 */
	unit() {
		let n = this.norm();
		let x = this.x / n;
		let y = this.y / n;
		let z = this.z / n;

		return new Vector(x, y, z);
	}

	/**
	 * Checks whether this vector's components are finite.
	 * @method module:LinearAlgebra.Vector#isValid
	 * @returns {boolean}
	 */
	isValid() {
		return !isNaN(this.x) && !isNaN(this.y) && !isNaN(this.z) &&
			isFinite(this.x) && isFinite(this.y) && isFinite(this.z);
	}

	/**
	 * u += v
	 * @method module:LinearAlgebra.Vector#incrementBy
	 * @param {module:LinearAlgebra.Vector} v The vector added to this vector.
	 */
	incrementBy(v) {
		this.x += v.x;
		this.y += v.y;
		this.z += v.z;
	}

	/**
	 * u -= v
	 * @method module:LinearAlgebra.Vector#decrementBy
	 * @param {module:LinearAlgebra.Vector} v The vector subtracted from this vector.
	 */
	decrementBy(v) {
		this.x -= v.x;
		this.y -= v.y;
		this.z -= v.z;
	}

	/**
	 * u *= s
	 * @method module:LinearAlgebra.Vector#scaleBy
	 * @param {number} s The number this vector is scaled by.
	 */
	scaleBy(s) {
		this.x *= s;
		this.y *= s;
		this.z *= s;
	}

	/**
	 * u /= s
	 * @method module:LinearAlgebra.Vector#divideBy
	 * @param {number} s The number this vector is divided by.
	 */
	divideBy(s) {
		this.scaleBy(1 / s);
	}

	/**
	 * Returns u + v
	 * @method module:LinearAlgebra.Vector#plus
	 * @param {module:LinearAlgebra.Vector} v The vector added to this vector.
	 * @return {module:LinearAlgebra.Vector}
	 */
	plus(v) {
		return new Vector(this.x + v.x, this.y + v.y, this.z + v.z);
	}

	/**
	 * Returns u - v
	 * @method module:LinearAlgebra.Vector#minus
	 * @param {module:LinearAlgebra.Vector} v The vector subtracted from this vector.
	 * @return {module:LinearAlgebra.Vector}
	 */
	minus(v) {
		return new Vector(this.x - v.x, this.y - v.y, this.z - v.z);
	}

	/**
	 * Returns u * s
	 * @method module:LinearAlgebra.Vector#times
	 * @param {number} s The number this vector is multiplied by.
	 * @return {module:LinearAlgebra.Vector}
	 */
	times(s) {
		return new Vector(this.x * s, this.y * s, this.z * s);
	}

	/**
	 * Returns u / s
	 * @method module:LinearAlgebra.Vector#over
	 * @param {number} s The number this vector is divided by.
	 * @return {module:LinearAlgebra.Vector}
	 */
	over(s) {
		return this.times(1 / s);
	}

	/**
	 * Returns -u
	 * @method module:LinearAlgebra.Vector#negated
	 * @return {module:LinearAlgebra.Vector}
	 */
	negated() {
		return this.times(-1);
	}

	/**
	 * Computes the dot product of this vector and v
	 * @method module:LinearAlgebra.Vector#dot
	 * @param {module:LinearAlgebra.Vector} v The vector this vector is dotted with.
	 * @return {number}
	 */
	dot(v) {
		return this.x * v.x + this.y * v.y + this.z * v.z;
	}

	/**
	 * Computes the cross product of this vector and v
	 * @method module:LinearAlgebra.Vector#cross
	 * @param {module:LinearAlgebra.Vector} v The vector this vector is crossed with.
	 * @return {module:LinearAlgebra.Vector}
	 */
	cross(v) {
		return new Vector(
			this.y * v.z - this.z * v.y,
			this.z * v.x - this.x * v.z,
			this.x * v.y - this.y * v.x);
	}
}
