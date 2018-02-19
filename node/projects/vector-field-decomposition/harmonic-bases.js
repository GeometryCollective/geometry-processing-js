let LinearAlgebra = require('../../linear-algebra/linear-algebra.js');
let DenseMatrix = LinearAlgebra.DenseMatrix;
let indexElements = require('../../core/mesh.js')[1];

class HarmonicBases {
	/**
	 * This class computes the {@link https://www.cs.cmu.edu/~kmcrane/Projects/DDG/paper.pdf harmonic bases} of a surface mesh.
	 * @constructor module:Projects.HarmonicBases
	 * @param {module:Core.Geometry} geometry The input geometry of the mesh this class acts on.
	 */
	constructor(geometry) {
		this.geometry = geometry;
	}

	/**
	 * Builds a closed, but not exact, primal 1-form ω.
	 * @private
	 * @method module:Projects.HarmonicBases#buildClosedPrimalOneForm
	 * @param {module:Core.Halfedge[]} generator An array of halfedges representing a
	 * {@link https://en.wikipedia.org/wiki/Homology_(mathematics)#Surfaces homology generator}
	 * of the input mesh.
	 * @param {Object} edgeIndex A dictionary mapping each edge of the input mesh
	 * to a unique index.
	 * @returns {module:LinearAlgebra.DenseMatrix}
	 */
	buildClosedPrimalOneForm(generator, edgeIndex) {
		let E = this.geometry.mesh.edges.length;
		let omega = DenseMatrix.zeros(E, 1);
		for (let h of generator) {
			let i = edgeIndex[h.edge];
			let sign = h.edge.halfedge === h ? 1 : -1;

			omega.set(sign, i, 0);
		}

		return omega;
	}

	/**
	 * Computes the harmonic bases [γ1, γ2 ... γn] of the input mesh.
	 * @method module:Projects.HarmonicBases#compute
	 * @param {module:Projects.HodgeDecomposition} hodgeDecomposition A hodge decomposition object that
	 * can be used to compute the exact component of the closed, but not exact, primal
	 * 1-form ω.
	 * @returns {module:LinearAlgebra.DenseMatrix[]}
	 */
	compute(hodgeDecomposition) {
		let gammas = [];
		let generators = this.geometry.mesh.generators;

		if (generators.length > 0) {
			// index edges
			let edgeIndex = indexElements(this.geometry.mesh.edges);

			// build bases with generators
			for (let generator of generators) {
				// build closed primal one form
				let omega = this.buildClosedPrimalOneForm(generator, edgeIndex);

				// compute exact component dα
				let dAlpha = hodgeDecomposition.computeExactComponent(omega);

				// extract harmonic component
				gammas.push(omega.minus(dAlpha));
			}
		}

		return gammas;
	}
}

module.exports = HarmonicBases