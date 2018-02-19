let LinearAlgebra = require('../../linear-algebra/linear-algebra.js');
let DenseMatrix = LinearAlgebra.DenseMatrix;
let SparseMatrix = LinearAlgebra.SparseMatrix;
let Triplet = LinearAlgebra.Triplet;
let HodgeDecomposition = require('../vector-field-decomposition/hodge-decomposition.js');
let TreeCotree = require('../vector-field-decomposition/tree-cotree.js');
let HarmonicBases = require('../vector-field-decomposition/harmonic-bases.js');
let indexElements = require('../../core/mesh.js')[1];

class TrivialConnections {
	/**
	 * This class implements the {@link https://www.cs.cmu.edu/~kmcrane/Projects/DDG/paper.pdf trivial connections} algorithm to compute a smooth
	 * 1-form vector fields on a surface mesh.
	 * @constructor module:Projects.TrivialConnections
	 * @param {module:Core.Geometry} geometry The input geometry of the mesh this class acts on.
	 * @property {Object} vertexIndex A dictionary mapping each vertex of the input mesh to a unique index.
	 * @property {Object} edgeIndex A dictionary mapping each edge of the input mesh to a unique index.
	 * @property {module:LinearAlgebra.DenseMatrix[]} bases The harmonic bases [γ1, γ2 ... γn] of the input mesh.
	 * @property {module:LinearAlgebra.SparseMatrix} P The period matrix of the input mesh.
	 * @property {module:LinearAlgebra.SparseMatrix} A The 0-form laplace matrix d0^T star1 d0 of the input mesh.
	 * @property {module:LinearAlgebra.SparseMatrix} hodge1 The hodge star 1-form matrix of the input mesh.
	 * @property {module:LinearAlgebra.SparseMatrix} d0 The exterior derivaitve 0-form matrix of the input mesh.
	 */
	constructor(geometry) {
		this.geometry = geometry;
		this.vertexIndex = indexElements(geometry.mesh.vertices);
		this.edgeIndex = indexElements(geometry.mesh.edges);

		// initialize hodge decomposition
		let hodgeDecomposition = new HodgeDecomposition(geometry);

		// build generators
		let treeCotree = new TreeCotree(geometry.mesh);
		treeCotree.buildGenerators();

		// build harmonic bases
		let harmonicBases = new HarmonicBases(geometry);
		this.bases = harmonicBases.compute(hodgeDecomposition);

		// build period matrix and store relevant DEC operators
		this.P = this.buildPeriodMatrix();
		this.A = hodgeDecomposition.A;
		this.hodge1 = hodgeDecomposition.hodge1;
		this.d0 = hodgeDecomposition.d0;
	}

	/**
	 * Builds the period matrix Pij = ∑_{ek ∈ li} (ξj)k, where li is the ith homology generator,
	 * ek is a dual edge in li and ξj is the jth harmonic 1-form basis.
	 * @private
	 * @method module:Projects.TrivialConnections#buildPeriodMatrix
	 * @returns {module:LinearAlgebra.SparseMatrix}
	 */
	buildPeriodMatrix() {
		let N = this.bases.length;
		let T = new Triplet(N, N);

		for (let i = 0; i < N; i++) {
			let generator = this.geometry.mesh.generators[i];

			for (let j = 0; j < N; j++) {
				let basis = this.bases[j];
				let sum = 0;

				for (let h of generator) {
					let k = this.edgeIndex[h.edge];
					let sign = h.edge.halfedge === h ? 1 : -1;

					sum += sign * basis.get(k, 0);
				}

				T.addEntry(sum, i, j);
			}
		}

		return SparseMatrix.fromTriplet(T);
	}

	/**
	 * Checks whether Gauss Bonnet is satisfied, i.e., ∑singularity = χ.
	 * @private
	 * @method module:Projects.TrivialConnections#satisfyGaussBonnet
	 * @param {Object} singularity A dictionary mapping each vertex of the input mesh
	 * to either 0 or 1, where 1 indicates that the vertex is a singularity and 0
	 * indicates that it is not.
	 * @returns {boolean}
	 */
	satisfyGaussBonnet(singularity) {
		let sum = 0;
		let mesh = this.geometry.mesh;
		for (let v of mesh.vertices) {
			sum += singularity[v];
		}

		return Math.abs(mesh.eulerCharacteristic() - sum) < 1e-8;
	}

	/**
	 * Computes the dual 0-form potential β by solving the system d𝛿β = -K + 2π * singularity.
	 * @private
	 * @method module:Projects.TrivialConnections#computeCoExactComponent
	 * @param {Object} singularity A dictionary mapping each vertex of the input mesh
	 * to either 0 or 1, where 1 indicates that the vertex is a singularity and 0
	 * indicates that it is not.
	 * @returns {module:LinearAlgebra.DenseMatrix} The coexact component 𝛿β.
	 */
	computeCoExactComponent(singularity) {
		let vertices = this.geometry.mesh.vertices;
		let V = vertices.length;

		// construct right hand side
		let rhs = DenseMatrix.zeros(V, 1);
		for (let v of vertices) {
			let i = this.vertexIndex[v];
			let u = -this.geometry.angleDefect(v) + 2 * Math.PI * singularity[v];

			rhs.set(u, i, 0);
		}

		// solve linear system
		let llt = this.A.chol();
		let betaTilde = llt.solvePositiveDefinite(rhs);

		return this.hodge1.timesDense(this.d0.timesDense(betaTilde));
	}

	/**
	 * Given an initial angle αi in face i, this function computes the new angle
	 * αj in the neighboring face j as αj = αi - θij + θji, where θij and θji are
	 * the angles between the shared edge e and an arbitrary but fixed reference direction
	 * in faces i and j. Repeating this procedure for n consecutive dual edges in a
	 * generator gives a sequence of angles α0 , . . . , αn with a resulting total
	 * angle defect equal to αn - α0. This corresponds to transporting a vector around
	 * a generator by unfolding, sliding and refolding it across neighboring faces
	 * without any extra in plane rotation.
	 * @private
	 * @method module:Projects.TrivialConnections#transportNoRotation
	 * @param {Object} h A halfedge lying on the shared edge between face i and j.
	 * @param {number} alphaI The initial angle αi.
	 * @returns {number}
	 */
	transportNoRotation(h, alphaI = 0) {
		let u = this.geometry.vector(h);

		let [e1, e2] = this.geometry.orthonormalBases(h.face);
		let thetaIJ = Math.atan2(u.dot(e2), u.dot(e1));

		let [f1, f2] = this.geometry.orthonormalBases(h.twin.face);
		let thetaJI = Math.atan2(u.dot(f2), u.dot(f1));

		return alphaI - thetaIJ + thetaJI;
	}

	/**
	 * Computes the harmonic component γ = ∑_{i = 1, ..., 2g} zi ξi by solving
	 * the system Pz = v - ∑𝛿β. v - ∑𝛿β should be normalized to lie between -π and π.
	 * @private
	 * @method module:Projects.TrivialConnections#computeHarmonicComponent
	 * @param {module:LinearAlgebra.DenseMatrix} deltaBeta The coexact component 𝛿β.
	 * @returns {module:LinearAlgebra.DenseMatrix}
	 */
	computeHarmonicComponent(deltaBeta) {
		let N = this.bases.length;
		let E = this.geometry.mesh.edges.length;
		let gamma = DenseMatrix.zeros(E, 1);

		if (N > 0) {
			// construct right hand side
			let rhs = DenseMatrix.zeros(N, 1);
			for (let i = 0; i < N; i++) {
				let generator = this.geometry.mesh.generators[i];
				let sum = 0;

				for (let h of generator) {
					let k = this.edgeIndex[h.edge];
					let sign = h.edge.halfedge === h ? 1 : -1;

					sum += this.transportNoRotation(h);
					sum -= sign * deltaBeta.get(k, 0);
				}

				// normalize sum between -π and π
				while (sum < -Math.PI) sum += 2 * Math.PI;
				while (sum >= Math.PI) sum -= 2 * Math.PI;

				rhs.set(sum, i, 0);
			}

			// solve linear system
			let lu = this.P.lu();
			let z = lu.solveSquare(rhs);

			// compute γ
			for (let i = 0; i < N; i++) {
				let basis = this.bases[i];
				let zi = z.get(i, 0);

				gamma.incrementBy(basis.timesReal(zi));
			}
		}

		return gamma;
	}

	/**
	 * Computes the dual 1-form connections φ = 𝛿β + γ.
	 * @method module:Projects.TrivialConnections#computeConnections
	 * @param {Object} singularity A dictionary mapping each vertex of the input mesh
	 * to either 0 or 1, where 1 indicates that the vertex is a singularity and 0
	 * indicates that it is not.
	 * @returns {module:LinearAlgebra.DenseMatrix}
	 */
	computeConnections(singularity) {
		if (!this.satisfyGaussBonnet(singularity)) {
			alert("Singularities do not add up to the euler characteristic of the mesh");
			return undefined;
		}

		// coexact component 𝛿β
		let deltaBeta = this.computeCoExactComponent(singularity);

		// extract harmonic component
		let gamma = this.computeHarmonicComponent(deltaBeta);

		return deltaBeta.plus(gamma);
	}
}

module.exports = TrivialConnections