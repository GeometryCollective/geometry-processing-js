import Module from './linear-algebra-asm.js';
import { memoryManager } from './emscripten-memory-manager.js';
import DenseMatrix from './dense-matrix.js';

class SparseMatrix {
	/**
	 * This class represents a m by n real matrix where only nonzero entries
	 * are stored explicitly. Do not create a SparseMatrix from its constructor,
	 * instead use static factory methods such as fromTriplet, identity and diag.
	 * @constructor module:LinearAlgebra.SparseMatrix
	 * @example
	 * let T = new Triplet(100, 100);
	 * T.addEntry(3.4, 11, 43);
	 * T.addEntry(6.4, 99, 99);
	 * let A = SparseMatrix.fromTriplet(T);
	 *
	 * let B = SparseMatrix.identity(10, 10);
	 *
	 * let d = DenseMatrix.ones(100, 1);
	 * let C = SparseMatrix.diag(d);
	 */
	constructor(data) {
		this.data = data;
		memoryManager.objectList.push(this);
	}

	/**
	 * Deletes the emscripten heap allocated data of this sparse matrix.
	 * @ignore
	 * @method module:LinearAlgebra.SparseMatrix#delete
	 */
	delete() {
		this.data.delete();
	}

	/**
	 * Initializes a sparse matrix from a {@link module:LinearAlgebra.Triplet Triplet} object.
	 * @method module:LinearAlgebra.SparseMatrix.fromTriplet
	 * @param {module:LinearAlgebra.Triplet} T A triplet object containing only the nonzero entries that
	 * need to be stored in this sparse matrix.
	 * @returns {module:LinearAlgebra.SparseMatrix}
	 */
	static fromTriplet(T) {
		return new SparseMatrix(new Module.SparseMatrix(T.data));
	}

	/**
	 * Initializes a m by n sparse identity matrix.
	 * @method module:LinearAlgebra.SparseMatrix.identity
	 * @param {number} m The number of rows in this sparse matrix.
	 * @param {number} n The number of columns in this sparse matrix.
	 * @returns {module:LinearAlgebra.SparseMatrix}
	 */
	static identity(m, n) {
		return new SparseMatrix(Module.SparseMatrix.identity(m, n));
	}

	/**
	 * Initializes a sparse diagonal matrix.
	 * @method module:LinearAlgebra.SparseMatrix.diag
	 * @param {module:LinearAlgebra.DenseMatrix} d The dense vector (d.nCols() == 1) used to initialize
	 * this sparse diagonal matrix.
	 * @returns {module:LinearAlgebra.SparseMatrix}
	 */
	static diag(d) {
		return new SparseMatrix(Module.SparseMatrix.diag(d.data));
	}

	/**
	 * Returns the transpose of this sparse matrix.
	 * @method module:LinearAlgebra.SparseMatrix#transpose
	 * @returns {module:LinearAlgebra.SparseMatrix}
	 */
	transpose() {
		return new SparseMatrix(this.data.transpose());
	}

	/**
	 * Returns the inverse of this diagonal sparse matrix.
	 * @method module:LinearAlgebra.SparseMatrix#invertDiagonal
	 * @returns {module:LinearAlgebra.SparseMatrix}
	 */
	invertDiagonal() {
		let N = this.nRows();
		let X = this.timesDense(DenseMatrix.ones(N, 1));
		let T = new Triplet(N, N);
		for (let i = 0; i < N; i++) {
			T.addEntry(1 / X.get(i, 0), i, i);
		}

		return SparseMatrix.fromTriplet(T);
	}

	/**
	 * Returns the number of rows in this sparse matrix.
	 * @method module:LinearAlgebra.SparseMatrix#nRows
	 * @returns {number}
	 */
	nRows() {
		return this.data.nRows();
	}

	/**
	 * Returns the number of columns in this sparse matrix.
	 * @method module:LinearAlgebra.SparseMatrix#nCols
	 * @returns {number}
	 */
	nCols() {
		return this.data.nCols();
	}

	/**
	 * Returns the number of nonzero entries in this sparse matrix.
	 * @method module:LinearAlgebra.SparseMatrix#nnz
	 * @returns {number}
	 */
	nnz() {
		return this.data.nnz();
	}

	/**
	 * Computes the frobenius norm of this sparse matrix.
	 * @method module:LinearAlgebra.SparseMatrix#frobeniusNorm
	 * @returns {number}
	 */
	frobeniusNorm() {
		return this.data.frobeniusNorm();
	}

	/**
	 * Extracts a sparse sub-matrix in the range [r0, r1) x [c0, c1), i.e., a matrix
	 * of size (r1 - r0) x (c1 - c0) starting at indices (r0, c0).
	 * @method module:LinearAlgebra.SparseMatrix#subMatrix
	 * @param {number} r0 The start row index.
	 * @param {number} r1 The end row index (not included).
	 * @param {number} c0 The start column index.
	 * @param {number} c1 The end column index (not included).
	 * @returns {module:LinearAlgebra.SparseMatrix}
	 */
	subMatrix(r0, r1, c0, c1) {
		return new SparseMatrix(this.data.subMatrix(r0, r1, c0, c1));
	}

	/**
	 * Returns a sparse {@link module:LinearAlgebra.Cholesky Cholesky} factorization of this sparse matrix.
	 * @method module:LinearAlgebra.SparseMatrix#chol
	 * @returns {module:LinearAlgebra.Cholesky}
	 */
	chol() {
		return new Cholesky(this.data.chol());
	}

	/**
	 * Returns a sparse {@link module:LinearAlgebra.LU LU} factorization of this sparse matrix.
	 * @method module:LinearAlgebra.SparseMatrix#lu
	 * @returns {module:LinearAlgebra.LU}
	 */
	lu() {
		return new LU(this.data.lu());
	}

	/**
	 * Returns a sparse {@link module:LinearAlgebra.QR QR} factorization of this sparse matrix.
	 * @method module:LinearAlgebra.SparseMatrix#qr
	 * @returns {module:LinearAlgebra.QR}
	 */
	qr() {
		return new QR(this.data.qr());
	}

	/**
	 * Returns a dense copy of this sparse matrix.
	 * @method module:LinearAlgebra.SparseMatrix#toDense
	 * @returns {module:LinearAlgebra.DenseMatrix}
	 */
	toDense() {
		return new DenseMatrix(this.data.toDense());
	}

	/**
	 * A += B
	 * @method module:LinearAlgebra.SparseMatrix#incrementBy
	 * @param {module:LinearAlgebra.SparseMatrix} B The sparse matrix added to this sparse matrix.
	 */
	incrementBy(B) {
		this.data.incrementBy(B.data);
	}

	/**
	 * A -= B
	 * @method module:LinearAlgebra.SparseMatrix#decrementBy
	 * @param {module:LinearAlgebra.SparseMatrix} B The sparse matrix subtracted from this sparse matrix.
	 */
	decrementBy(B) {
		this.data.decrementBy(B.data);
	}

	/**
	 * A *= s
	 * @method module:LinearAlgebra.SparseMatrix#scaleBy
	 * @param {number} s The number this sparse matrix is scaled by.
	 */
	scaleBy(s) {
		this.data.scaleBy(s);
	}

	/**
	 * Returns A + B
	 * @method module:LinearAlgebra.SparseMatrix#plus
	 * @param {module:LinearAlgebra.SparseMatrix} B The sparse matrix added to this sparse matrix.
	 * @returns {module:LinearAlgebra.SparseMatrix}
	 */
	plus(B) {
		return new SparseMatrix(this.data.plus(B.data));
	}

	/**
	 * Returns A - B
	 * @method module:LinearAlgebra.SparseMatrix#minus
	 * @param {module:LinearAlgebra.SparseMatrix} B The sparse matrix subtracted from this sparse matrix.
	 * @returns {module:LinearAlgebra.SparseMatrix}
	 */
	minus(B) {
		return new SparseMatrix(this.data.minus(B.data));
	}

	/**
	 * Returns A * s
	 * @method module:LinearAlgebra.SparseMatrix#timesReal
	 * @param {number} s The number this sparse matrix is multiplied by.
	 * @returns {module:LinearAlgebra.SparseMatrix}
	 */
	timesReal(s) {
		return new SparseMatrix(this.data.timesReal(s));
	}

	/**
	 * Returns A * X
	 * @method module:LinearAlgebra.SparseMatrix#timesDense
	 * @param {module:LinearAlgebra.DenseMatrix} X The dense matrix this sparse matrix is multiplied by.
	 * @returns {module:LinearAlgebra.DenseMatrix}
	 */
	timesDense(X) {
		return new DenseMatrix(this.data.timesDense(X.data));
	}

	/**
	 * Returns A * B
	 * @method module:LinearAlgebra.SparseMatrix#timesSparse
	 * @param {module:LinearAlgebra.SparseMatrix} B The sparse matrix this sparse matrix is multiplied by.
	 * @returns {module:LinearAlgebra.SparseMatrix}
	 */
	timesSparse(B) {
		return new SparseMatrix(this.data.timesSparse(B.data));
	}
}

class Triplet {
	/**
	 * This class represents a small structure to hold nonzero entries in a {@link module:LinearAlgebra.SparseMatrix SparseMatrix}.
	 * Each entry is a triplet of a value and the (i, j)th indices, i.e., (x, i, j).
	 * @constructor module:LinearAlgebra.Triplet
	 * @param {number} m The number of rows in the sparse matrix that will be initialized
	 * from this triplet.
	 * @param {number} n The number of columns in the sparse matrix that will be initialized
	 * from this triplet.
	 * @example
	 * let T = new Triplet(100, 100);
	 * T.addEntry(3.4, 11, 43);
	 * T.addEntry(6.4, 99, 99);
	 *
	 * let A = SparseMatrix.fromTriplet(T);
	 */
	constructor(m, n) {
		this.data = new Module.Triplet(m, n);
		memoryManager.objectList.push(this);
	}

	/**
	 * Deletes the emscripten heap allocated data of this sparse matrix.
	 * @method module:LinearAlgebra.Triplet#delete
	 * @ignore
	 */
	delete() {
		this.data.delete();
	}

	/**
	 * A(i, j) += x
	 * @method module:LinearAlgebra.Triplet#addEntry
	 * @param {number} x The value of the nonzero entry being inserted into this triplet.
	 * @param {number} i The ith row of the sparse matrix that will be initialized
	 * from this triplet.
	 * @param {number} j The jth column of the sparse matrix that will be initialized
	 * from this triplet.
	 */
	addEntry(x, i, j) {
		this.data.addEntry(i, j, x);
	}
}

class Cholesky {
	/**
	 * This class represents a Choleksy LL^T factorization of a square positive definite
	 * {@link module:LinearAlgebra.SparseMatrix SparseMatrix}. The factorization is computed on the first call to solvePositiveDefinite,
	 * and is reused in subsequent calls to solvePositiveDefinite (e.g. when only the
	 * right hand side b of the linear system Ax = b changes) unless the sparse matrix
	 * itself is altered through operations such as *=, += and -=. Do not use the constructor
	 * to initialize this class, instead access the Choleksy factorization of a sparse
	 * matrix directly from the matrix itself.
	 * @constructor module:LinearAlgebra.Cholesky
	 * @example
	 * // solve the linear system Ax = b, where A is a square positive definite sparse matrix
	 * let A = SparseMatrix.identity(5, 5);
	 * let b = DenseMatrix.ones(5, 1);
	 *
	 * let llt = A.chol();
	 * let x = llt.solvePositiveDefinite(b);
	 *
	 * b.scaleBy(5);
	 * x = llt.solvePositiveDefinite(b); // factorization is reused
	 */
	constructor(data) {
		this.data = data;
	}

	/**
	 * Solves the linear system Ax = b, where A is a square positive definite sparse matrix.
	 * @method module:LinearAlgebra.Cholesky#solvePositiveDefinite
	 * @param {module:LinearAlgebra.DenseMatrix} b The dense right hand side of the linear system Ax = b.
	 * @returns {module:LinearAlgebra.DenseMatrix}
	 */
	solvePositiveDefinite(b) {
		return new DenseMatrix(this.data.solvePositiveDefinite(b.data));
	}
}

class LU {
	/**
	 * This class represents a LU factorization of a square {@link module:LinearAlgebra.SparseMatrix SparseMatrix}. The factorization
	 * is computed on the first call to solveSquare, and is reused in subsequent calls
	 * to solveSquare (e.g. when only the right hand side b of the linear system Ax = b
	 * changes) unless the sparse matrix itself is altered through operations such as
	 * *=, += and -=. Do not use the constructor to initialize this class, instead
	 * access the LU factorization of a sparse matrix directly from the matrix itself.
	 * @constructor module:LinearAlgebra.LU
	 * @example
	 * // solve the linear system Ax = b, where A is a square sparse matrix
	 * let A = SparseMatrix.identity(5, 5);
	 * let b = DenseMatrix.ones(5, 1);
	 *
	 * let lu = A.lu();
	 * let x = lu.solveSquare(b);
	 *
	 * b.scaleBy(5);
	 * x = lu.solveSquare(b); // factorization is reused
	 */
	constructor(data) {
		this.data = data;
	}

	/**
	 * Solves the linear system Ax = b, where A is a square sparse matrix.
	 * @method module:LinearAlgebra.LU#solveSquare
	 * @param {module:LinearAlgebra.DenseMatrix} b The dense right hand side of the linear system Ax = b.
	 * @returns {module:LinearAlgebra.DenseMatrix}
	 */
	solveSquare(b) {
		return new DenseMatrix(this.data.solveSquare(b.data));
	}
}

class QR {
	/**
	 * This class represents a QR factorization of a rectangular {@link module:LinearAlgebra.SparseMatrix SparseMatrix}.
	 * The factorization is computed on the first call to solve, and is reused in
	 * subsequent calls to solve (e.g. when only the right hand side b of the linear
	 * system Ax = b changes) unless the sparse matrix itself is altered through
	 * operations such as *=, += and -=. Do not use the constructor to initialize
	 * this class, instead access the QR factorization of a sparse matrix directly
	 * from the matrix itself.
	 * @constructor module:LinearAlgebra.QR
	 * @example
	 * // solve the linear system Ax = b, where A is a rectangular sparse matrix
	 * let A = SparseMatrix.identity(5, 5);
	 * let b = DenseMatrix.ones(5, 1);
	 *
	 * let qr = A.qr();
	 * let x = qr.solve(b);
	 *
	 * b.scaleBy(5);
	 * x = qr.solve(b); // factorization is reused
	 */
	constructor(data) {
		this.data = data;
	}

	/**
	 * Solves the linear system Ax = b, where A is a rectangular sparse matrix.
	 * @method module:LinearAlgebra.QR#solve
	 * @param {module:LinearAlgebra.DenseMatrix} b The dense right hand side of the linear system Ax = b.
	 * @returns {module:LinearAlgebra.DenseMatrix}
	 */
	solve(b) {
		return new DenseMatrix(this.data.solve(b.data));
	}
}
