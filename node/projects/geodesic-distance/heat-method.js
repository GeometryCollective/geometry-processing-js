let LinearAlgebra = require('../../linear-algebra/linear-algebra.js');
let Vector = LinearAlgebra.Vector;
let DenseMatrix = LinearAlgebra.DenseMatrix;
let indexElements = require('../../core/mesh.js')[1];

class HeatMethod {
	/**
	 * This class implements the {@link http://www.cs.cmu.edu/~kmcrane/Projects/HeatMethod/ heat method} to compute geodesic distance
	 * on a surface mesh.
	 * @constructor module:Projects.HeatMethod
	 * @param {module:Core.Geometry} geometry The input geometry of the mesh this class acts on.
	 * @property {module:Core.Geometry} geometry The input geometry of the mesh this class acts on.
	 * @property {Object} vertexIndex A dictionary mapping each vertex of the input mesh to a unique index.
	 * @property {module:LinearAlgebra.SparseMatrix} A The laplace matrix of the input mesh.
	 * @property {module:LinearAlgebra.SparseMatrix} F The mean curvature flow operator built on the input mesh.
	 */
	constructor(geometry) {
		this.geometry = geometry;
		this.vertexIndex = indexElements(geometry.mesh.vertices);

		// build laplace and flow matrices
		let t = Math.pow(geometry.meanEdgeLength(), 2);
		let M = geometry.massMatrix(this.vertexIndex);
		this.A = geometry.laplaceMatrix(this.vertexIndex);
		this.F = M.plus(this.A.timesReal(t));
	}

	/**
	 * Computes the vector field X = -∇u / |∇u|.
	 * @private
	 * @method module:Projects.HeatMethod#computeVectorField
	 * @param {module:LinearAlgebra.DenseMatrix} u A dense vector (i.e., u.nCols() == 1) representing the
	 * heat that is allowed to diffuse on the input mesh for a brief period of time.
	 * @returns {Object} A dictionary mapping each face of the input mesh to a {@link module:LinearAlgebra.Vector Vector}.
	 */
	computeVectorField(u) {
		let X = {};
		for (let f of this.geometry.mesh.faces) {
			let normal = this.geometry.faceNormal(f);
			let area = this.geometry.area(f);
			let gradU = new Vector();

			for (let h of f.adjacentHalfedges()) {
				let i = this.vertexIndex[h.prev.vertex];
				let ui = u.get(i, 0);
				let ei = this.geometry.vector(h);

				gradU.incrementBy(normal.cross(ei).times(ui));
			}

			gradU.divideBy(2 * area);
			gradU.normalize();

			X[f] = gradU.negated();
		}

		return X;
	}

	/**
	 * Computes the integrated divergence ∇.X.
	 * @private
	 * @method module:Projects.HeatMethod#computeDivergence
	 * @param {Object} X The vector field -∇u / |∇u| represented by a dictionary
	 * mapping each face of the input mesh to a {@link module:LinearAlgebra.Vector Vector}.
	 * @returns {module:LinearAlgebra.DenseMatrix}
	 */
	computeDivergence(X) {
		let vertices = this.geometry.mesh.vertices;
		let V = vertices.length;
		let div = DenseMatrix.zeros(V, 1);

		for (let v of vertices) {
			let i = this.vertexIndex[v];
			let sum = 0;

			for (let h of v.adjacentHalfedges()) {
				if (!h.onBoundary) {
					let Xj = X[h.face];
					let e1 = this.geometry.vector(h);
					let e2 = this.geometry.vector(h.prev.twin);
					let cotTheta1 = this.geometry.cotan(h);
					let cotTheta2 = this.geometry.cotan(h.prev);

					sum += (cotTheta1 * e1.dot(Xj) + cotTheta2 * e2.dot(Xj));
				}
			}

			div.set(0.5 * sum, i, 0);
		}

		return div;
	}

	/**
	 * Shifts φ such that its minimum value is zero.
	 * @private
	 * @method module:Projects.HeatMethod#subtractMinimumDistance
	 * @param {module:LinearAlgebra.DenseMatrix} phi The (minimum 0) solution to the poisson equation Δφ = ∇.X.
	 */
	subtractMinimumDistance(phi) {
		let min = Infinity;
		for (let i = 0; i < phi.nRows(); i++) {
			min = Math.min(phi.get(i, 0), min);
		}

		for (let i = 0; i < phi.nRows(); i++) {
			phi.set(phi.get(i, 0) - min, i, 0);
		}
	}

	/**
	 * Computes the geodesic distances φ using the heat method.
	 * @method module:Projects.HeatMethod#compute
	 * @param {module:LinearAlgebra.DenseMatrix} delta A dense vector (i.e., delta.nCols() == 1) containing
	 * heat sources, i.e., u0 = δ(x).
	 * @returns {module:LinearAlgebra.DenseMatrix}
	 */
	compute(delta) {
		// integrate heat flow
		let llt = this.F.chol();
		let u = llt.solvePositiveDefinite(delta);

		// compute unit vector field X and divergence ∇.X
		let X = this.computeVectorField(u);
		let div = this.computeDivergence(X);

		// solve poisson equation Δφ = ∇.X
		llt = this.A.chol();
		let phi = llt.solvePositiveDefinite(div.negated());

		// since φ is unique up to an additive constant, it should
		// be shifted such that the smallest distance is zero
		this.subtractMinimumDistance(phi);

		return phi;
	}
}

module.exports = HeatMethod