"use strict";

class ComplexDenseMatrix {
	/**
	 * This class represents a m by n complex matrix where every entry, including
	 * zero-valued entries, is stored explicitly. Do not create a ComplexDenseMatrix
	 * from its constructor, instead use static factory methods such as zeros,
	 * identity, ones, constant and random.
	 * @constructor module:LinearAlgebra.ComplexDenseMatrix
	 * @example
	 * let A = ComplexDenseMatrix.zeros(20, 5);
	 * let B = ComplexDenseMatrix.identity(10, 10);
	 * let C = ComplexDenseMatrix.ones(100, 1);
	 * let D = ComplexDenseMatrix.constant(new Complex(1, 2), 5, 5);
	 * let E = ComplexDenseMatrix.random(5, 20);
	 */
	constructor(data) {
		this.data = data;
		memoryManager.objectList.push(this);
	}

	/**
	 * Deletes the emscripten heap allocated data of this dense matrix.
	 * @ignore
	 * @method module:LinearAlgebra.ComplexDenseMatrix#delete
	 */
	delete() {
		this.data.delete();
	}

	/**
	 * Initializes a m by n matrix of zeros.
	 * @method module:LinearAlgebra.ComplexDenseMatrix.zeros
	 * @param {number} m The number of rows in this complex dense matrix.
	 * @param {number} n The number of columns in this complex dense matrix.
	 * @returns {module:LinearAlgebra.ComplexDenseMatrix}
	 */
	static zeros(m, n = 1) {
		return new ComplexDenseMatrix(new Module.ComplexDenseMatrix(m, n));
	}

	/**
	 * Initializes a m by n identity matrix.
	 * @method module:LinearAlgebra.ComplexDenseMatrix.identity
	 * @param {number} m The number of rows in this complex dense matrix.
	 * @param {number} n The number of columns in this complex dense matrix.
	 * @returns {module:LinearAlgebra.ComplexDenseMatrix}
	 */
	static identity(m, n = 1) {
		return new ComplexDenseMatrix(Module.ComplexDenseMatrix.identity(m, n));
	}

	/**
	 * Initializes a m by n matrix of ones.
	 * @method module:LinearAlgebra.ComplexDenseMatrix.ones
	 * @param {number} m The number of rows in this complex dense matrix.
	 * @param {number} n The number of columns in this complex dense matrix.
	 * @returns {module:LinearAlgebra.ComplexDenseMatrix}
	 */
	static ones(m, n = 1) {
		return new ComplexDenseMatrix(Module.ComplexDenseMatrix.ones(m, n));
	}

	/**
	 * Initializes a m by n constant matrix.
	 * @method module:LinearAlgebra.ComplexDenseMatrix.constant
	 * @param {module:LinearAlgebra.Complex} x The constant value stored in every entry of this complex dense matrix.
	 * @param {number} m The number of rows in this complex dense matrix.
	 * @param {number} n The number of columns in this complex dense matrix.
	 * @returns {module:LinearAlgebra.ComplexDenseMatrix}
	 */
	static constant(x, m, n = 1) {
		return new ComplexDenseMatrix(Module.ComplexDenseMatrix.constant(m, n, x.data));
	}

	/**
	 * Initializes a m by n random matrix.
	 * @method module:LinearAlgebra.ComplexDenseMatrix.random
	 * @param {number} m The number of rows in this complex dense matrix.
	 * @param {number} n The number of columns in this complex dense matrix.
	 * @returns {module:LinearAlgebra.ComplexDenseMatrix}
	 */
	static random(m, n = 1) {
		return new ComplexDenseMatrix(Module.ComplexDenseMatrix.random(m, n));
	}

	/**
	 * Returns the transpose of this complex dense matrix.
	 * @method module:LinearAlgebra.ComplexDenseMatrix#transpose
	 * @returns {module:LinearAlgebra.ComplexDenseMatrix}
	 */
	transpose() {
		return new ComplexDenseMatrix(this.data.transpose());
	}

	/**
	 * Returns the conjugate of this complex dense matrix.
	 * @method module:LinearAlgebra.ComplexDenseMatrix#conjugate
	 * @returns {module:LinearAlgebra.ComplexDenseMatrix}
	 */
	conjugate() {
		return new ComplexDenseMatrix(this.data.conjugate());
	}

	/**
	 * Returns the number of rows in this complex dense matrix.
	 * @method module:LinearAlgebra.ComplexDenseMatrix#nRows
	 * @returns {number}
	 */
	nRows() {
		return this.data.nRows();
	}

	/**
	 * Returns the number of columns in this complex dense matrix.
	 * @method module:LinearAlgebra.ComplexDenseMatrix#nCols
	 * @returns {number}
	 */
	nCols() {
		return this.data.nCols();
	}

	/**
	 * Computes the lInfinity, l1 or l2 norm of this complex dense matrix.
	 * @method module:LinearAlgebra.ComplexDenseMatrix#norm
	 * @param {number} n Computes the lInfinity norm if n = 0, l1 norm if n = 1
	 * and l2 norm if n = 2.
	 * @returns {number}
	 */
	norm(n = 2) {
		return this.data.norm(n);
	}

	/**
	 * Returns the rank of this complex dense matrix.
	 * @method module:LinearAlgebra.ComplexDenseMatrix#rank
	 * @returns {number}
	 */
	rank() {
		return this.data.rank();
	}

	/**
	 * Sums all the entries in this complex dense matrix.
	 * @method module:LinearAlgebra.ComplexDenseMatrix#sum
	 * @returns {module:LinearAlgebra.Complex}
	 */
	sum() {
		let u = this.data.sum();
		return new Complex(Module.real(u), Module.imag(u));
	}

	/**
	 * Extracts a sub-matrix in the range [r0, r1) x [c0, c1), i.e., a matrix
	 * of size (r1 - r0) x (c1 - c0) starting at indices (r0, c0).
	 * @method module:LinearAlgebra.ComplexDenseMatrix#subMatrix
	 * @param {number} r0 The start row index.
	 * @param {number} r1 The end row index (not included).
	 * @param {number} c0 The start column index.
	 * @param {number} c1 The end column index (not included).
	 * @returns {module:LinearAlgebra.ComplexDenseMatrix}
	 */
	subMatrix(r0, r1, c0 = 0, c1 = 1) {
		return new ComplexDenseMatrix(this.data.subMatrix(r0, r1, c0, c1));
	}

	/**
	 * A += B
	 * @method module:LinearAlgebra.ComplexDenseMatrix#incrementBy
	 * @param {module:LinearAlgebra.ComplexDenseMatrix} B The complex dense matrix added to this complex dense matrix.
	 */
	incrementBy(B) {
		this.data.incrementBy(B.data);
	}

	/**
	 * A -= B
	 * @method module:LinearAlgebra.ComplexDenseMatrix#decrementBy
	 * @param {module:LinearAlgebra.ComplexDenseMatrix} B The complex dense matrix subtracted from this complex dense matrix.
	 */
	decrementBy(B) {
		this.data.decrementBy(B.data);
	}

	/**
	 * A *= s
	 * @method module:LinearAlgebra.ComplexDenseMatrix#scaleBy
	 * @param {module:LinearAlgebra.Complex} s The complex number this complex dense matrix is scaled by.
	 */
	scaleBy(s) {
		this.data.scaleBy(s.data);
	}

	/**
	 * Returns A + B
	 * @method module:LinearAlgebra.ComplexDenseMatrix#plus
	 * @param {module:LinearAlgebra.ComplexDenseMatrix} B The complex dense matrix added to this complex dense matrix.
	 * @returns {module:LinearAlgebra.ComplexDenseMatrix}
	 */
	plus(B) {
		return new ComplexDenseMatrix(this.data.plus(B.data));
	}

	/**
	 * Returns A - B
	 * @method module:LinearAlgebra.ComplexDenseMatrix#minus
	 * @param {module:LinearAlgebra.ComplexDenseMatrix} B The complex dense matrix subtracted from this
	 * complex dense matrix.
	 * @returns {module:LinearAlgebra.ComplexDenseMatrix}
	 */
	minus(B) {
		return new ComplexDenseMatrix(this.data.minus(B.data));
	}

	/**
	 * Returns A * s
	 * @method module:LinearAlgebra.ComplexDenseMatrix#timesComplex
	 * @param {module:LinearAlgebra.Complex} s The complex number this complex dense matrix is multiplied by.
	 * @returns {module:LinearAlgebra.ComplexDenseMatrix}
	 */
	timesComplex(s) {
		return new ComplexDenseMatrix(this.data.timesComplex(s.data));
	}

	/**
	 * Returns A * B
	 * @method module:LinearAlgebra.ComplexDenseMatrix#timesDense
	 * @param {module:LinearAlgebra.ComplexDenseMatrix} B The complex dense matrix this complex dense matrix
	 * is multiplied by.
	 * @returns {module:LinearAlgebra.ComplexDenseMatrix}
	 */
	timesDense(B) {
		return new ComplexDenseMatrix(this.data.timesDense(B.data));
	}

	/**
	 * Returns -A
	 * @method module:LinearAlgebra.ComplexDenseMatrix#negated
	 * @return {module:LinearAlgebra.ComplexDenseMatrix}
	 */
	negated() {
		return new ComplexDenseMatrix(this.data.negated());
	}

	/**
	 * Returns A(i, j)
	 * @method module:LinearAlgebra.ComplexDenseMatrix#get
	 * @param {number} i The ith row of this complex dense matrix.
	 * @param {number} j The jth column of this complex dense matrix.
	 * @return {module:LinearAlgebra.Complex}
	 */
	get(i, j = 0) {
		let u = this.data.get(i, j);
		return new Complex(Module.real(u), Module.imag(u));
	}

	/**
	 * A(i, j) = x
	 * @method module:LinearAlgebra.ComplexDenseMatrix#set
	 * @param {module:LinearAlgebra.Complex} x The complex value the (i, j)th entry of this complex dense
	 * matrix is set to.
	 * @param {number} i The ith row of this complex dense matrix.
	 * @param {number} j The jth column of this complex dense matrix.
	 */
	set(x, i, j = 0) {
		this.data.set(i, j, x.data);
	}

	/**
	 * Concatenates two complex dense matrices horizontally.
	 * @method module:LinearAlgebra.ComplexDenseMatrix#hcat
	 * @param {module:LinearAlgebra.ComplexDenseMatrix} B The complex dense matrix that is concatenated horizontally
	 * with this complex dense matrix.
	 * @return {module:LinearAlgebra.ComplexDenseMatrix}
	 */
	hcat(B) {
		return new ComplexDenseMatrix(this.data.hcat(B.data));
	}

	/**
	 * Concatenates two complex dense matrices vertically.
	 * @method module:LinearAlgebra.ComplexDenseMatrix#vcat
	 * @param {module:LinearAlgebra.ComplexDenseMatrix} B The complex dense matrix that is concatenated vertically
	 * with this complex dense matrix.
	 * @return {module:LinearAlgebra.ComplexDenseMatrix}
	 */
	vcat(B) {
		return new ComplexDenseMatrix(this.data.vcat(B.data));
	}
}
