"use strict";

class MeanCurvatureFlow {
	/**
	 * This class performs {@link https://www.cs.cmu.edu/~kmcrane/Projects/DDG/paper.pdf mean curvature flow} on a surface mesh.
	 * @constructor module:Projects.MeanCurvatureFlow
	 * @param {module:Core.Geometry} geometry The input geometry of the mesh this class acts on.
	 * @property {module:Core.Geometry} geometry The input geometry of the mesh this class acts on.
	 * @property {Object} vertexIndex A dictionary mapping each vertex of the input mesh to a unique index.
	 */
	constructor(geometry) {
		this.geometry = geometry;
		this.vertexIndex = indexElements(geometry.mesh.vertices);
	}

	/**
	 * Builds the mean curvature flow operator.
	 * @private
	 * @method module:Projects.MeanCurvatureFlow#buildFlowOperator
	 * @param {module:LinearAlgebra.SparseMatrix} M The mass matrix of the input mesh.
	 * @param {number} h The timestep.
	 * @returns {module:LinearAlgebra.SparseMatrix}
	 */
	buildFlowOperator(M, h) {
		let A = this.geometry.laplaceMatrix(this.vertexIndex);

		// F = M + hA
		return M.plus(A.timesReal(h));
	}

	/**
	 * Performs mean curvature flow on the input mesh with timestep h.
	 * @method module:Projects.MeanCurvatureFlow#integrate
	 * @param {number} h The timestep.
	 */
	integrate(h) {
		// build the flow and mass matrices
		let vertices = this.geometry.mesh.vertices;
		let V = vertices.length;
		let M = this.geometry.massMatrix(this.vertexIndex);
		let F = this.buildFlowOperator(M, h);

		// construct right hand side
		let f0 = DenseMatrix.zeros(V, 3);
		for (let v of vertices) {
			let i = this.vertexIndex[v];
			let p = this.geometry.positions[v];

			f0.set(p.x, i, 0);
			f0.set(p.y, i, 1);
			f0.set(p.z, i, 2);
		}

		let rhs = M.timesDense(f0);

		// solve linear system (M - hA)fh = Mf0
		let llt = F.chol();
		let fh = llt.solvePositiveDefinite(rhs);

		// update positions
		for (let v of vertices) {
			let i = this.vertexIndex[v];
			let p = this.geometry.positions[v];

			p.x = fh.get(i, 0);
			p.y = fh.get(i, 1);
			p.z = fh.get(i, 2);
		}

		// center mesh positions around origin
		normalize(this.geometry.positions, vertices, false);
	}
}
