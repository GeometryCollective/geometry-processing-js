let LinearAlgebra = require('../../linear-algebra/linear-algebra.js');
let DenseMatrix = LinearAlgebra.DenseMatrix;
let indexElements = require('../../core/mesh.js')[1];

/**
 * @module Projects
 */
class ScalarPoissonProblem {
	/**
	 * This class solves a {@link https://www.cs.cmu.edu/~kmcrane/Projects/DDG/paper.pdf scalar poisson problem} on a surface mesh.
	 * @constructor module:Projects.ScalarPoissonProblem
	 * @param {module:Core.Geometry} geometry The input geometry of the mesh this class acts on.
	 * @property {Object} vertexIndex A dictionary mapping each vertex of the input mesh to a unique index.
	 * @property {module:LinearAlgebra.SparseMatrix} A The laplace matrix of the input mesh.
	 * @property {module:LinearAlgebra.SparseMatrix} M The mass matrix of the input mesh.
	 * @property {number} totalArea The total surface area of the input mesh.
	 */
	constructor(geometry) {
		// index vertices
		this.vertexIndex = indexElements(geometry.mesh.vertices);

		// build laplace and mass matrices
		this.A = geometry.laplaceMatrix(this.vertexIndex);
		this.M = geometry.massMatrix(this.vertexIndex);
		this.totalArea = geometry.totalArea();
	}

	/**
	 * Computes the solution of the poisson problem Ax = -M(rho - rhoBar), where A
	 * is the positive definite laplace matrix and M is the mass matrix.
	 * @method module:Projects.ScalarPoissonProblem#solve
	 * @param {module:LinearAlgebra.DenseMatrix} rho A scalar density of vertices of the input mesh.
	 * @returns {module:LinearAlgebra.DenseMatrix}
	 */
	solve(rho) {
		// construct right hand side
		let V = this.M.nRows();
		let totalRho = this.M.timesDense(rho).sum();
		let rhoBar = DenseMatrix.ones(V, 1).timesReal(totalRho / this.totalArea);
		let rhs = this.M.timesDense(rhoBar.minus(rho));

		// solve linear system
		let llt = this.A.chol();
		let phi = llt.solvePositiveDefinite(rhs);

		return phi;
	}
}

module.exports = ScalarPoissonProblem