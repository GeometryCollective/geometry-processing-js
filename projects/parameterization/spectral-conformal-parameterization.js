"use strict";

class SpectralConformalParameterization {
	/**
	 * This class implements the {@link https://cs.cmu.edu/~kmcrane/Projects/DDG/paper.pdf spectral conformal parameterization} algorithm to flatten
	 * surface meshes with boundaries conformally.
	 * @constructor module:Projects.SpectralConformalParameterization
	 * @param {module:Core.Geometry} geometry The input geometry of the mesh this class acts on.
	 * @property {module:Core.Geometry} geometry The input geometry of the mesh this class acts on.
	 * @property {Object} vertexIndex A dictionary mapping each vertex of the input mesh to a unique index.
	 */
	constructor(geometry) {
		this.geometry = geometry;
		this.vertexIndex = indexElements(geometry.mesh.vertices);
	}

	/**
	 * Builds the complex conformal energy matrix EC = ED - A.
	 * @private
	 * @method module:Projects.SpectralConformalParameterization#buildConformalEnergy
	 * @returns {module:LinearAlgebra.ComplexSparseMatrix}
	 */
	buildConformalEnergy() {
		// build the dirichlet energy matrix
		let ED = this.geometry.complexLaplaceMatrix(this.vertexIndex);
		ED.scaleBy(new Complex(0.5));

		// build the area term
		let ii = new Complex(0, 1);
		let T = new ComplexTriplet(ED.nRows(), ED.nCols());
		for (let b of this.geometry.mesh.boundaries) {
			for (let h of b.adjacentHalfedges()) {
				let i = this.vertexIndex[h.vertex];
				let j = this.vertexIndex[h.twin.vertex];

				T.addEntry(ii.timesReal(0.25), i, j);
				T.addEntry(ii.timesReal(-0.25), j, i);
			}
		}

		let A = ComplexSparseMatrix.fromTriplet(T);

		return ED.minus(A);
	}

	/**
	 * Flattens the input surface mesh with 1 or more boundaries conformally.
	 * @method module:Projects.SpectralConformalParameterization#flatten
	 * @returns {Object} A dictionary mapping each vertex to a vector of planar coordinates.
	 */
	flatten() {
		let vertices = this.geometry.mesh.vertices;
		let flattening = {};

		// build the conformal energy matrix
		let EC = this.buildConformalEnergy();

		// find the eigenvector corresponding to the smallest eigenvalue of EC
		let z = Solvers.solveInversePowerMethod(EC);

		// assign flattening
		for (let v of vertices) {
			let i = this.vertexIndex[v];
			let zi = z.get(i, 0);

			flattening[v] = new Vector(zi.re, zi.im);
		}

		// normalize flattening
		normalize(flattening, vertices);

		return flattening;
	}
}
