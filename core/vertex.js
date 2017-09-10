"use strict";

class Vertex {
	/**
	 * This class represents a vertex in a {@link module:Core.Mesh Mesh}.
	 * @constructor module:Core.Vertex
	 * @property {module:Core.Halfedge} halfedge One of the outgoing halfedges associated with this vertex.
	 */
	constructor() {
		this.halfedge = undefined;
		this.index = -1; // an ID between 0 and |V| - 1, where |V| is the number of vertices in a mesh
	}

	/**
	 * Counts the number of edges adjacent to this vertex.
	 * @method module:Core.Vertex#degree
	 * @returns {number}
	 */
	degree() {
		let k = 0;
		for (let e of this.adjacentEdges()) {
			k++;
		}

		return k;
	}

	/**
	 * Checks whether this vertex is isolated, i.e., it has no neighboring vertices.
	 * @method module:Core.Vertex#isIsolated
	 * @returns {boolean}
	 */
	isIsolated() {
		return this.halfedge === undefined;
	}

	/**
	 * Checks whether this vertex lies on a boundary.
	 * @method module:Core.Vertex#onBoundary
	 * @returns {boolean}
	 */
	onBoundary() {
		for (let h of this.adjacentHalfedges()) {
			if (h.onBoundary) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Convenience function to iterate over the vertices neighboring this vertex.
	 * @method module:Core.Vertex#adjacentVertices
	 * @returns {module:Core.Vertex}
	 * @example
	 * let v = mesh.vertices[0];
	 * for (let u of v.adjacentVertices()) {
	 *     // Do something with u
	 * }
	 */
	adjacentVertices() {
		return new VertexVertexIterator(this.halfedge);
	}

	/**
	 * Convenience function to iterate over the edges adjacent to this vertex.
	 * @method module:Core.Vertex#adjacentEdges
	 * @returns {module:Core.Edge}
	 * @example
	 * let v = mesh.vertices[0];
	 * for (let e of v.adjacentEdges()) {
	 *     // Do something with e
	 * }
	 */
	adjacentEdges() {
		return new VertexEdgeIterator(this.halfedge);
	}

	/**
	 * Convenience function to iterate over the faces adjacent to this vertex.
	 * @method module:Core.Vertex#adjacentFaces
	 * @returns {module:Core.Face}
	 * @example
	 * let v = mesh.vertices[0];
	 * for (let f of v.adjacentFaces()) {
	 *     // Do something with f
	 * }
	 */
	adjacentFaces() {
		return new VertexFaceIterator(this.halfedge);
	}

	/**
	 * Convenience function to iterate over the halfedges adjacent to this vertex.
	 * @method module:Core.Vertex#adjacentHalfedges
	 * @returns {module:Core.Halfedge}
	 * @example
	 * let v = mesh.vertices[0];
	 * for (let h of v.adjacentHalfedges()) {
	 *     // Do something with h
	 * }
	 */
	adjacentHalfedges() {
		return new VertexHalfedgeIterator(this.halfedge); // outgoing halfedges
	}

	/**
	 * Convenience function to iterate over the corners adjacent to this vertex.
	 * @method module:Core.Vertex#adjacentCorners
	 * @returns {module:Core.Corner}
	 * @example
	 * let v = mesh.vertices[0];
	 * for (let c of v.adjacentCorners()) {
	 *     // Do something with c
	 * }
	 */
	adjacentCorners() {
		return new VertexCornerIterator(this.halfedge);
	}

	/**
	 * Defines a string representation for this vertex as its index.
	 * @ignore
	 * @method module:Core.Vertex#toString
	 * @returns {string}
	 */
	toString() {
		return this.index;
	}
}

/**
 * This class represents an adjacent vertex iterator for a {@link module:Core.Vertex Vertex}.
 * @ignore
 * @memberof module:Core
 */
class VertexVertexIterator {
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
					let vertex = this.current.twin.vertex;
					this.current = this.current.twin.next;
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
 * This class represents an adjacent edge iterator for a {@link module:Core.Vertex Vertex}.
 * @ignore
 * @memberof module:Core
 */
class VertexEdgeIterator {
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
					this.current = this.current.twin.next;
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
 * This class represents an adjacent face iterator for a {@link module:Core.Vertex Vertex}.
 * @ignore
 * @memberof module:Core
 */
class VertexFaceIterator {
	// constructor
	constructor(halfedge) {
		while (halfedge.onBoundary) {
			halfedge = halfedge.twin.next;
		} // halfedge must not be on the boundary
		this._halfedge = halfedge;
	}

	[Symbol.iterator]() {
		return {
			current: this._halfedge,
			end: this._halfedge,
			justStarted: true,
			next() {
				while (this.current.onBoundary) {
					this.current = this.current.twin.next;
				} // halfedge must not be on the boundary
				if (!this.justStarted && this.current === this.end) {
					return {
						done: true
					};

				} else {
					this.justStarted = false;
					let face = this.current.face;
					this.current = this.current.twin.next;
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
 * This class represents an adjacent halfedge iterator for a {@link module:Core.Vertex Vertex}.
 * @ignore
 * @memberof module:Core
 */
class VertexHalfedgeIterator {
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
					this.current = this.current.twin.next;
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
 * This class represents an adjacent corner iterator for a {@link module:Core.Vertex Vertex}.
 * @ignore
 * @memberof module:Core
 */
class VertexCornerIterator {
	// constructor
	constructor(halfedge) {
		while (halfedge.onBoundary) {
			halfedge = halfedge.twin.next;
		} // halfedge must not be on the boundary
		this._halfedge = halfedge;
	}

	[Symbol.iterator]() {
		return {
			current: this._halfedge,
			end: this._halfedge,
			justStarted: true,
			next() {
				while (this.current.onBoundary) {
					this.current = this.current.twin.next;
				} // halfedge must not be on the boundary
				if (!this.justStarted && this.current === this.end) {
					return {
						done: true
					};

				} else {
					this.justStarted = false;
					let corner = this.current.next.corner;
					this.current = this.current.twin.next;
					return {
						done: false,
						value: corner
					}
				}
			}
		}
	}
}
