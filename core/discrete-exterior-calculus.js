"use strict";

/**
 * This class contains methods to build common {@link https://www.cs.cmu.edu/~kmcrane/Projects/DDG/paper.pdf discrete exterior calculus} operators.
 * @memberof module:Core
 */
class DEC {
	/**
	 * Builds a sparse diagonal matrix encoding the Hodge operator on 0-forms.
	 * By convention, the area of a vertex is 1.
	 * @static
	 * @param {module:Core.Geometry} geometry The geometry of a mesh.
	 * @param {Object} vertexIndex A dictionary mapping each vertex of a mesh to a unique index.
	 * @returns {module:LinearAlgebra.SparseMatrix}
	 */
	static buildHodgeStar0Form(geometry, vertexIndex) {
		let vertices = geometry.mesh.vertices;
		let V = vertices.length;
		let T = new Triplet(V, V);
		for (let v of vertices) {
			let i = vertexIndex[v];
			let area = geometry.barycentricDualArea(v);

			T.addEntry(area, i, i);
		}

		return SparseMatrix.fromTriplet(T);
	}

	/**
	 * Builds a sparse diagonal matrix encoding the Hodge operator on 1-forms.
	 * @static
	 * @param {module:Core.Geometry} geometry The geometry of a mesh.
	 * @param {Object} edgeIndex A dictionary mapping each edge of a mesh to a unique index.
	 * @returns {module:LinearAlgebra.SparseMatrix}
	 */
	static buildHodgeStar1Form(geometry, edgeIndex) {
		let edges = geometry.mesh.edges;
		let E = edges.length;
		let T = new Triplet(E, E);
		for (let e of edges) {
			let i = edgeIndex[e];
			let w = (geometry.cotan(e.halfedge) + geometry.cotan(e.halfedge.twin)) / 2;

			T.addEntry(w, i, i);
		}

		return SparseMatrix.fromTriplet(T);
	}

	/**
	 * Builds a sparse diagonal matrix encoding the Hodge operator on 2-forms.
	 * By convention, the area of a vertex is 1.
	 * @static
	 * @param {module:Core.Geometry} geometry The geometry of a mesh.
	 * @param {Object} faceIndex A dictionary mapping each face of a mesh to a unique index.
	 * @returns {module:LinearAlgebra.SparseMatrix}
	 */
	static buildHodgeStar2Form(geometry, faceIndex) {
		let faces = geometry.mesh.faces;
		let F = faces.length;
		let T = new Triplet(F, F);
		for (let f of faces) {
			let i = faceIndex[f];
			let area = geometry.area(f);

			T.addEntry(1 / area, i, i);
		}

		return SparseMatrix.fromTriplet(T);
	}

	/**
	 * Builds a sparse matrix encoding the exterior derivative on 0-forms.
	 * @static
	 * @param {module:Core.Geometry} geometry The geometry of a mesh.
	 * @param {Object} edgeIndex A dictionary mapping each edge of a mesh to a unique index.
	 * @param {Object} vertexIndex A dictionary mapping each vertex of a mesh to a unique index.
	 * @returns {module:LinearAlgebra.SparseMatrix}
	 */
	static buildExteriorDerivative0Form(geometry, edgeIndex, vertexIndex) {
		let edges = geometry.mesh.edges;
		let vertices = geometry.mesh.vertices;
		let E = edges.length;
		let V = vertices.length;
		let T = new Triplet(E, V);
		for (let e of edges) {
			let i = edgeIndex[e];
			let j = vertexIndex[e.halfedge.vertex];
			let k = vertexIndex[e.halfedge.twin.vertex];

			T.addEntry(1, i, j);
			T.addEntry(-1, i, k);
		}

		return SparseMatrix.fromTriplet(T);
	}

	/**
	 * Builds a sparse matrix encoding the exterior derivative on 1-forms.
	 * @static
	 * @param {module:Core.Geometry} geometry The geometry of a mesh.
	 * @param {Object} faceIndex A dictionary mapping each face of a mesh to a unique index.
	 * @param {Object} edgeIndex A dictionary mapping each edge of a mesh to a unique index.
	 * @returns {module:LinearAlgebra.SparseMatrix}
	 */
	static buildExteriorDerivative1Form(geometry, faceIndex, edgeIndex) {
		let faces = geometry.mesh.faces;
		let edges = geometry.mesh.edges;
		let F = faces.length;
		let E = edges.length;
		let T = new Triplet(F, E);
		for (let f of faces) {
			let i = faceIndex[f];

			for (let h of f.adjacentHalfedges()) {
				let j = edgeIndex[h.edge];
				let sign = h.edge.halfedge === h ? 1 : -1;

				T.addEntry(sign, i, j);
			}
		}

		return SparseMatrix.fromTriplet(T);
	}
}
