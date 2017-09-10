"use strict";

class Face {
	/**
	 * This class represents a face in a {@link module:Core.Mesh Mesh}.
	 * @constructor module:Core.Face
	 * @property {module:Core.Halfedge} halfedge One of the halfedges associated with this face.
	 */
	constructor() {
		this.halfedge = undefined;
		this.index = -1; // an ID between 0 and |F| - 1 if this face is not a boundary loop
		// or an ID between 0 and |B| - 1 if this face is a boundary loop, where |F| is the
		// number of faces in the mesh and |B| is the number of boundary loops in the mesh
	}

	/**
	 * Checks whether this face is a boundary loop.
	 * @method module:Core.Face#isBoundaryLoop
	 * @returns {boolean}
	 */
	isBoundaryLoop() {
		return this.halfedge.onBoundary;
	}

	/**
	 * Convenience function to iterate over the vertices in this face.
	 * Iterates over the vertices of a boundary loop if this face is a boundary loop.
	 * @method module:Core.Face#adjacentVertices
	 * @returns {module:Core.Vertex}
	 * @example
	 * let f = mesh.faces[0]; // or let b = mesh.boundaries[0]
	 * for (let v of f.adjacentVertices()) {
	 *     // Do something with v
	 * }
	 */
	adjacentVertices() {
		return new FaceVertexIterator(this.halfedge);
	}

	/**
	 * Convenience function to iterate over the edges in this face.
	 * Iterates over the edges of a boundary loop if this face is a boundary loop.
	 * @method module:Core.Face#adjacentEdges
	 * @returns {module:Core.Edge}
	 * @example
	 * let f = mesh.faces[0]; // or let b = mesh.boundaries[0]
	 * for (let e of f.adjacentEdges()) {
	 *     // Do something with e
	 * }
	 */
	adjacentEdges() {
		return new FaceEdgeIterator(this.halfedge);
	}

	/**
	 * Convenience function to iterate over the faces neighboring this face.
	 * @method module:Core.Face#adjacentFaces
	 * @returns {module:Core.Face}
	 * @example
	 * let f = mesh.faces[0]; // or let b = mesh.boundaries[0]
	 * for (let g of f.adjacentFaces()) {
	 *     // Do something with g
	 * }
	 */
	adjacentFaces() {
		return new FaceFaceIterator(this.halfedge);
	}

	/**
	 * Convenience function to iterate over the halfedges in this face.
	 * Iterates over the halfedges of a boundary loop if this face is a boundary loop.
	 * @method module:Core.Face#adjacentHalfedges
	 * @returns {module:Core.Halfedge}
	 * @example
	 * let f = mesh.faces[0]; // or let b = mesh.boundaries[0]
	 * for (let h of f.adjacentHalfedges()) {
	 *     // Do something with h
	 * }
	 */
	adjacentHalfedges() {
		return new FaceHalfedgeIterator(this.halfedge);
	}

	/**
	 * Convenience function to iterate over the corners in this face. Not valid if this face
	 * is a boundary loop.
	 * @method module:Core.Face#adjacentCorners
	 * @returns {module:Core.Corner}
	 * @example
	 * let f = mesh.faces[0];
	 * for (let c of f.adjacentCorners()) {
	 *     // Do something with c
	 * }
	 */
	adjacentCorners() {
		return new FaceCornerIterator(this.halfedge);
	}

	/**
	 * Defines a string representation for this face as its index.
	 * @ignore
	 * @method module:Core.Face#toString
	 * @returns {string}
	 */
	toString() {
		return this.index;
	}
}

/**
 * This class represents an adjacent vertex iterator for a {@link module:Core.Face Face}.
 * @ignore
 * @memberof module:Core
 */
class FaceVertexIterator {
	// constructor
	constructor(halfedge) {
		this._halfedge = halfedge;
	}

	[Symbol.iterator]() {
		return {
			current: this._halfedge,
			end: this._halfedge,
			justStarted: true,
			next() {
				if (!this.justStarted && this.current === this.end) {
					return {
						done: true
					};

				} else {
					this.justStarted = false;
					let vertex = this.current.vertex;
					this.current = this.current.next;
					return {
						done: false,
						value: vertex
					}
				}
			}
		}
	}
}

/**
 * This class represents an adjacent edge iterator for a {@link module:Core.Face Face}.
 * @ignore
 * @memberof module:Core
 */
class FaceEdgeIterator {
	// constructor
	constructor(halfedge) {
		this._halfedge = halfedge;
	}

	[Symbol.iterator]() {
		return {
			current: this._halfedge,
			end: this._halfedge,
			justStarted: true,
			next() {
				if (!this.justStarted && this.current === this.end) {
					return {
						done: true
					};

				} else {
					this.justStarted = false;
					let edge = this.current.edge;
					this.current = this.current.next;
					return {
						done: false,
						value: edge
					}
				}
			}
		}
	}
}

/**
 * This class represents an adjacent face iterator for a {@link module:Core.Face Face}.
 * @ignore
 * @memberof module:Core
 */
class FaceFaceIterator {
	// constructor
	constructor(halfedge) {
		while (halfedge.twin.onBoundary) {
			halfedge = halfedge.next;
		} // twin halfedge must not be on the boundary
		this._halfedge = halfedge;
	}

	[Symbol.iterator]() {
		return {
			current: this._halfedge,
			end: this._halfedge,
			justStarted: true,
			next() {
				while (this.current.twin.onBoundary) {
					this.current = this.current.next;
				} // twin halfedge must not be on the boundary
				if (!this.justStarted && this.current === this.end) {
					return {
						done: true
					};

				} else {
					this.justStarted = false;
					let face = this.current.twin.face;
					this.current = this.current.next;
					return {
						done: false,
						value: face
					}
				}
			}
		}
	}
}

/**
 * This class represents an adjacent halfedge iterator for a {@link module:Core.Face Face}.
 * @ignore
 * @memberof module:Core
 */
class FaceHalfedgeIterator {
	// constructor
	constructor(halfedge) {
		this._halfedge = halfedge;
	}

	[Symbol.iterator]() {
		return {
			current: this._halfedge,
			end: this._halfedge,
			justStarted: true,
			next() {
				if (!this.justStarted && this.current === this.end) {
					return {
						done: true
					};

				} else {
					this.justStarted = false;
					let halfedge = this.current;
					this.current = this.current.next;
					return {
						done: false,
						value: halfedge
					}
				}
			}
		}
	}
}

/**
 * This class represents an adjacent corner iterator for a {@link module:Core.Face Face}.
 * @ignore
 * @memberof module:Core
 */
class FaceCornerIterator {
	// constructor
	constructor(halfedge) {
		this._halfedge = halfedge;
	}

	[Symbol.iterator]() {
		return {
			current: this._halfedge,
			end: this._halfedge,
			justStarted: true,
			next() {
				if (!this.justStarted && this.current === this.end) {
					return {
						done: true
					};

				} else {
					this.justStarted = false;
					this.current = this.current.next;
					let corner = this.current.corner; // corner will be undefined if this face is a boundary loop
					return {
						done: false,
						value: corner
					}
				}
			}
		}
	}
}
