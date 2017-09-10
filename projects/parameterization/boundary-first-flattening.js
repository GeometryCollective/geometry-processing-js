"use strict";

class BoundaryFirstFlattening {
	/**
	 * This class implements the {@link https://arxiv.org/pdf/1704.06873.pdf boundary first flattening} algorithm to flatten
	 * surface meshes with a single boundary conformally.
	 * @constructor module:Projects.BoundaryFirstFlattening
	 * @param {module:Core.Geometry} geometry The input geometry of the mesh this class acts on.
	 * @property {module:Core.Geometry} geometry The input geometry of the mesh this class acts on.
	 * @property {module:Core.Face[]} boundary The boundary of the input mesh.
	 * @property {number} nV The number of vertices in the input mesh.
	 * @property {number} nI The number of interior vertices in the input mesh.
	 * @property {number} nB The number of boundary vertices in the input mesh.
	 * @property {Object} vertexIndex A dictionary mapping each vertex of the input mesh to a unique index.
	 * @property {Object} bVertexIndex A dictionary mapping each boundary vertex of the input mesh to a unique index.
	 * @property {module:LinearAlgebra.DenseMatrix} K The integrated gaussian curvatures of the input mesh.
	 * @property {module:LinearAlgebra.DenseMatrix} k The integrated geodesic curvatures of the input mesh.
	 * @property {module:LinearAlgebra.DenseMatrix} l The boundary edge lengths of the input mesh.
	 * @property {module:LinearAlgebra.SparseMatrix} A The laplace matrix of the input mesh partitioned by interior and boundary vertices.
	 * @property {module:LinearAlgebra.SparseMatrix} Aii The upper left block of the partitioned laplace matrix.
	 * @property {module:LinearAlgebra.SparseMatrix} Aib The upper right block of the partitioned laplace matrix.
	 * @property {module:LinearAlgebra.SparseMatrix} Abb The lower right block of the partitioned laplace matrix.
	 */
	constructor(geometry) {
		this.geometry = geometry;
		this.boundary = geometry.mesh.boundaries[0];

		this.indexVertices();
		this.computeIntegratedCurvatures();
		this.computeBoundaryLengths();

		this.A = geometry.laplaceMatrix(this.vertexIndex);
		this.Aii = this.A.subMatrix(0, this.nI, 0, this.nI);
		this.Aib = this.A.subMatrix(0, this.nI, this.nI, this.nV);
		this.Abb = this.A.subMatrix(this.nI, this.nV, this.nI, this.nV);
	}

	/**
	 * Counts the number of interior and boundary vertices in the input mesh and assigns
	 * unique indices to each vertex.
	 * @private
	 * @method module:Projects.BoundaryFirstFlattening#indexVertices
	 */
	indexVertices() {
		let vertices = geometry.mesh.vertices;
		this.nV = vertices.length;
		this.nI = 0;
		this.nB = 0;
		this.vertexIndex = {};
		this.bVertexIndex = {};

		// count interior vertices and map them to a unique index
		for (let v of vertices) {
			if (!v.onBoundary()) {
				this.vertexIndex[v] = this.nI;
				this.nI++;
			}
		}

		// count boundary vertices and map them to unique indices
		for (let v of vertices) {
			if (v.onBoundary()) {
				this.bVertexIndex[v] = this.nB;
				this.vertexIndex[v] = this.nI + this.nB;
				this.nB++;
			}
		}
	}

	/**
	 * Computes the integrated gaussian and geodesic curvatures of the input mesh.
	 * @private
	 * @method module:Projects.BoundaryFirstFlattening#computeIntegratedCurvatures
	 */
	computeIntegratedCurvatures() {
		this.K = DenseMatrix.zeros(this.nI, 1);
		this.k = DenseMatrix.zeros(this.nB, 1);
		for (let v of geometry.mesh.vertices) {
			let angleDefect = geometry.angleDefect(v);

			if (v.onBoundary()) {
				// set the integrated geodesic curvature at this boundary vertex
				let i = this.bVertexIndex[v];
				this.k.set(angleDefect, i, 0);

			} else {
				// set the integrated gaussian curvature at this interior vertex
				let i = this.vertexIndex[v];
				this.K.set(angleDefect, i, 0);
			}
		}
	}

	/**
	 * Computes the boundary edge lengths of the input mesh.
	 * @private
	 * @method module:Projects.BoundaryFirstFlattening#computeBoundaryLengths
	 */
	computeBoundaryLengths() {
		this.l = DenseMatrix.zeros(this.nB, 1);
		for (let he of this.boundary.adjacentHalfedges()) {
			let i = this.bVertexIndex[he.vertex];

			this.l.set(geometry.length(he.edge), i, 0);
		}
	}

	/**
	 * Computes the target boundary edge lengths of the flattening.
	 * @private
	 * @method module:Projects.BoundaryFirstFlattening#computeTargetBoundaryLengths
	 * @param {module:LinearAlgebra.DenseMatrix} u The target boundary scale factors.
	 * @returns {module:LinearAlgebra.DenseMatrix}
	 */
	computeTargetBoundaryLengths(u) {
		let lstar = DenseMatrix.zeros(this.nB, 1);
		for (let he of this.boundary.adjacentHalfedges()) {
			let i = this.bVertexIndex[he.vertex];
			let j = this.bVertexIndex[he.next.vertex];
			let ui = u.get(i, 0);
			let uj = u.get(j, 0);
			let lij = this.l.get(i, 0);

			lstar.set(Math.exp((ui + uj) / 2) * lij, i, 0);
		}

		return lstar;
	}

	/**
	 * Computes the dual boundary edge lengths of the flattening.
	 * @private
	 * @method module:Projects.BoundaryFirstFlattening#computeDualBoundaryLengths
	 * @param {Object} flattening A dictionary mapping each vertex to a vector of planar coordinates.
	 * @returns {module:LinearAlgebra.DenseMatrix}
	 */
	computeDualBoundaryLengths(flattening) {
		let ldual = DenseMatrix.zeros(this.nB, 1);
		for (let he of this.boundary.adjacentHalfedges()) {
			let j = this.bVertexIndex[he.vertex];
			let vi = flattening[he.prev.vertex];
			let vj = flattening[he.vertex];
			let vk = flattening[he.next.vertex];

			ldual.set((vj.minus(vi).norm() + vk.minus(vj).norm()) / 2, j, 0);
		}

		return ldual;
	}

	/**
	 * Evaluates the Dirichlet to Neumann map.
	 * @private
	 * @method module:Projects.BoundaryFirstFlattening#dirichletToNeumann
	 * @param {module:LinearAlgebra.DenseMatrix} phi The source term.
	 * @param {module:LinearAlgebra.DenseMatrix} g The Dirichlet boundary data.
	 * @returns {module:LinearAlgebra.DenseMatrix}
	 */
	dirichletToNeumann(phi, g) {
		let llt = this.Aii.chol();
		let a = llt.solvePositiveDefinite(phi.minus(this.Aib.timesDense(g)));

		return this.Aib.transpose().timesDense(a).plus(this.Abb.timesDense(g)).negated();
	}

	/**
	 * Evaluates the Neumann to Dirichlet map.
	 * @private
	 * @method module:Projects.BoundaryFirstFlattening#neumannToDirichlet
	 * @param {module:LinearAlgebra.DenseMatrix} phi The source term.
	 * @param {module:LinearAlgebra.DenseMatrix} h The Neumann boundary data.
	 * @returns {module:LinearAlgebra.DenseMatrix}
	 */
	neumannToDirichlet(phi, h) {
		let llt = this.A.chol();
		let a = llt.solvePositiveDefinite(phi.vcat(h.negated()));

		return a.subMatrix(this.nI, this.nV);
	}

	/**
	 * Constructs a best fit closed conformal loop from the prescribed boundary data.
	 * @private
	 * @method module:Projects.BoundaryFirstFlattening#constructBestFitCurve
	 * @param {module:LinearAlgebra.DenseMatrix} lstar The target boundary edge lengths of the flattening.
	 * @param {module:LinearAlgebra.DenseMatrix} ktilde The target boundary curvatures of the flattening.
	 * @return {Object} A dictionary mapping each boundary vertex of the input mesh to planar coordinates.
	 * The values for each coordinate are stored in a {@link module:LinearAlgebra.DenseMatrix dense matrix}.
	 */
	constructBestFitCurve(lstar, ktilde) {
		// compute tangents to the closed boundary curve
		let phi = 0;
		let T = DenseMatrix.zeros(2, this.nB);
		for (let he of this.boundary.adjacentHalfedges()) {
			let i = this.bVertexIndex[he.vertex];

			phi += ktilde.get(i, 0);
			T.set(Math.cos(phi), 0, i);
			T.set(Math.sin(phi), 1, i);
		}

		// adjust lengths to ensure the curve closes
		let Ninv = SparseMatrix.diag(this.l);
		let TT = T.transpose();
		let m = Solvers.invert2x2(T.timesDense(Ninv.timesDense(TT)));
		let ltilde = lstar.minus(Ninv.timesDense(TT.timesDense(m.timesDense(T.timesDense(lstar)))));

		// build the curve
		let re = 0;
		let im = 0;
		let gammaRe = DenseMatrix.zeros(this.nB, 1);
		let gammaIm = DenseMatrix.zeros(this.nB, 1);
		for (let he of this.boundary.adjacentHalfedges()) {
			let i = this.bVertexIndex[he.vertex];

			gammaRe.set(re, i, 0);
			gammaIm.set(im, i, 0);
			re += ltilde.get(i, 0) * T.get(0, i);
			im += ltilde.get(i, 0) * T.get(1, i);
		}

		return {
			"re": gammaRe,
			"im": gammaIm
		};
	}

	/**
	 * Harmonically extends Dirichlet boundary data.
	 * @private
	 * @method module:Projects.BoundaryFirstFlattening#extendHarmonic
	 * @param {module:LinearAlgebra.DenseMatrix} g The Dirichlet boundary data.
	 * @return {module:LinearAlgebra.DenseMatrix}
	 */
	extendHarmonic(g) {
		let llt = this.Aii.chol();
		let a = llt.solvePositiveDefinite(this.Aib.timesDense(g).negated());

		return a.vcat(g);
	}

	/**
	 * Extends a boundary curve holomorphically or harmonically to the interior.
	 * @private
	 * @method module:Projects.BoundaryFirstFlattening#extendCurve
	 * @param {Object} gamma A dictionary mapping each boundary vertex of the input mesh to planar coordinates.
	 * @param {module:LinearAlgebra.DenseMatrix} gamma.re The real/x component of the planar coordinates.
	 * @param {module:LinearAlgebra.DenseMatrix} gamma.im The imaginary/y component of the planar coordinates.
	 * @param {boolean} extendHolomorphically A flag indicating whether the interior of
	 * the flattened domain should be extended holomorphically or harmonically.
	 * @returns {Object} A dictionary mapping each vertex to a vector of planar coordinates.
	 */
	extendCurve(gamma, extendHolomorphically) {
		// harmonically extend the real component of gamma
		let a = this.extendHarmonic(gamma["re"]);

		let b;
		if (extendHolomorphically) {
			// compute the hilbert transform of the tangential derivative of a
			let h = DenseMatrix.zeros(this.nV, 1);
			for (let he of this.boundary.adjacentHalfedges()) {
				let i = this.vertexIndex[he.prev.vertex];
				let j = this.vertexIndex[he.vertex];
				let k = this.vertexIndex[he.next.vertex];

				h.set(-(a.get(k, 0) - a.get(i, 0)) / 2, j, 0); // minus sign accounts for clockwise boundary traversal
			}

			// holomorphically extend the imaginary component of gamma
			let llt = this.A.chol();
			b = llt.solvePositiveDefinite(h);

		} else {
			// harmonically extend the imaginary component of gamma
			b = this.extendHarmonic(gamma["im"]);
		}

		return {
			"re": a,
			"im": b
		};
	}

	/**
	 * Given the target boundary scale factors and the curvatures, flattens the
	 * input surface mesh with a single boundary conformally.
	 * @private
	 * @method module:Projects.BoundaryFirstFlattening#flattenWithScaleFactorsAndCurvatures
	 * @param {module:LinearAlgebra.DenseMatrix} u The target boundary scale factors.
	 * @param {module:LinearAlgebra.DenseMatrix} ktilde The target boundary curvatures.
	 * @param {boolean} extendHolomorphically A flag indicating whether the interior of
	 * the flattened domain should be extended holomorphically or harmonically.
	 * @param {boolean} rescale A flag indicating whether the flattening should be scaled
	 * to unit radius.
	 * @returns {Object} A dictionary mapping each vertex to a vector of planar coordinates.
	 */
	flattenWithScaleFactorsAndCurvatures(u, ktilde, extendHolomorphically, rescale) {
		// compute the target boundary edge lengths of the flattening
		let lstar = this.computeTargetBoundaryLengths(u);

		// construct the best fit conformal boundary curve
		let gamma = this.constructBestFitCurve(lstar, ktilde);

		// extend the curve holomorphically or harmonically to the interior
		let extension = this.extendCurve(gamma, extendHolomorphically);

		// assign flattening
		let flattening = {};
		for (let v of this.geometry.mesh.vertices) {
			let i = this.vertexIndex[v];
			let re = extension["re"].get(i, 0);
			let im = extension["im"].get(i, 0);

			flattening[v] = new Vector(-re, im); // minus sign accounts for clockwise boundary traversal
		}

		// normalize flattening
		normalize(flattening, this.geometry.mesh.vertices, rescale);

		return flattening;
	}

	/**
	 * Given either the target boundary scale factors or the curvatures, flattens the
	 * input surface mesh with a single boundary conformally.
	 * @method module:Projects.BoundaryFirstFlattening#flatten
	 * @param {module:LinearAlgebra.DenseMatrix} target Either the target boundary scale factors
	 * or the curvatures.
	 * @param {boolean} givenScaleFactors A flag indicating whether the input data contains
	 * the target boundary scale factors.
	 * @param {boolean} rescale A flag indicating whether the flattening should be
	 * scaled to unit radius. Default value is true
	 * @returns {Object} A dictionary mapping each vertex to a vector of planar coordinates.
	 */
	flatten(target, givenScaleFactors, rescale = true) {
		let u, ktilde;
		if (givenScaleFactors) {
			// given target boundary scale factors
			u = target;

			// compute the normal derivative of the boundary scale factors
			let h = this.dirichletToNeumann(this.K.negated(), u);

			// compute compatible target boundary curvatures
			ktilde = this.k.minus(h);

		} else {
			// given target boundary curvatures
			ktilde = target;

			// compute the normal derivative of the boundary scale factors
			let h = this.k.minus(ktilde);

			// compute compatible target boundary scale factors
			u = this.neumannToDirichlet(this.K.negated(), h);
		}

		// flatten with target boundary scale factors and curvatures
		return this.flattenWithScaleFactorsAndCurvatures(u, ktilde, givenScaleFactors, rescale);
	}

	/**
	 * Flattens the input surface mesh with a single boundary conformally to a disk.
	 * @method module:Projects.BoundaryFirstFlattening#flattenToDisk
	 * @return {Object} A dictionary mapping each vertex to a vector of planar coordinates.
	 */
	flattenToDisk() {
		let flattening = this.geometry.positions;
		for (let iter = 0; iter < 10; iter++) {
			// compute dual boundary edge lengths of the previous flattening
			let ldual = this.computeDualBoundaryLengths(flattening);
			let L = ldual.sum();

			// set ktilde proportional to the most recent dual boundary edge lengths
			let ktilde = DenseMatrix.zeros(this.nB, 1);
			for (let he of this.boundary.adjacentHalfedges()) {
				let i = this.bVertexIndex[he.vertex];

				ktilde.set(2 * Math.PI * ldual.get(i, 0) / L, i, 0);
			}

			// compute the normal derivative of the boundary scale factors
			let h = this.k.minus(ktilde);

			// compute compatible target boundary scale factors
			let u = this.neumannToDirichlet(this.K.negated(), h);

			// flatten with target boundary scale factors and curvatures
			flattening = this.flattenWithScaleFactorsAndCurvatures(u, ktilde, false, true);
		}

		return flattening;
	}
}
