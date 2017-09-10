"use strict";

/**
 * This class implements frequently used numerical algorithms such as the inverse power method.
 * @memberof module:Utils
 */
class Solvers {
	/**
	 * Computes the residual of Ax - λx, where x has unit norm and λ = x.Ax.
	 * @param {module:LinearAlgebra.ComplexSparseMatrix} A The complex sparse matrix whose eigen decomposition
	 * is being computed.
	 * @param {module:LinearAlgebra.ComplexDenseMatrix} x The current guess for the smallest eigenvector
	 * (corresponding to the smallest eigenvalue λ) of A.
	 * @returns {number}
	 */
	static residual(A, x) {
		let Ax = A.timesDense(x);
		let xH = x.transpose().conjugate();
		let xHAx = xH.timesDense(Ax).get(0, 0);
		let xHx = xH.timesDense(x).get(0, 0);
		let lambda = xHAx.overComplex(xHx);

		return Ax.minus(x.timesComplex(lambda)).get(0, 0).norm(2) / x.norm(2);
	}

	/**
	 * Solves Ax = λx, where λ is the smallest nonzero eigenvalue of A and x is the
	 * corresponding eigenvector. x should be initialized to a random complex dense
	 * vector (i.e., x.nCols() == 1).
	 * @param {module:LinearAlgebra.ComplexSparseMatrix} A The complex positive definite sparse matrix
	 * whose eigen decomposition needs to be computed.
	 * @returns {module:LinearAlgebra.ComplexDenseMatrix} The smallest eigenvector (corresponding to the
	 * smallest eigenvalue λ) of A.
	 */
	static solveInversePowerMethod(A) {
		// compute prefactorization
		let N = A.nRows();
		let llt = A.chol();
		let ones = ComplexDenseMatrix.ones(N, 1);
		let x = ComplexDenseMatrix.random(N, 1);

		while (Solvers.residual(A, x) > 1e-10) {
			x = llt.solvePositiveDefinite(x);

			// subtract mean
			let mean = x.sum().overReal(N);
			x.decrementBy(ones.timesComplex(mean));

			// normalize
			x.scaleBy(new Complex(1.0 / x.norm(2)));
		}

		return x;
	}

	/**
	 * Inverts a 2x2 matrix.
	 * @param {module:LinearAlgebra.DenseMatrix} m The matrix to be inverted.
	 * @returns {module:LinearAlgebra.DenseMatrix} 
	 */
	static invert2x2(m) {
		let m00 = m.get(0, 0);
		let m01 = m.get(0, 1);
		let m10 = m.get(1, 0);
		let m11 = m.get(1, 1);

		let det = m00 * m11 - m01 * m10;
		m.set(m11, 0, 0);
		m.set(m00, 1, 1);
		m.set(-m01, 0, 1);
		m.set(-m10, 1, 0);
		m.scaleBy(1.0 / det);

		return m;
	}
}
