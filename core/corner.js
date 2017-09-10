"use strict";

class Corner {
	/**
	 * This class represents a corner in a {@link module:Core.Mesh Mesh}. It is a convenience
	 * wrapper around {@link module:Core.Halfedge Halfedge} - each corner stores the halfedge opposite to it.
	 * @constructor module:Core.Corner
	 * @property {module:Core.Halfedge} halfedge The halfedge opposite to this corner.
	 */
	constructor() {
		this.halfedge = undefined;
		this.index = -1; // an ID between 0 and |C| - 1, where |C| is the number of corners in a mesh
	}

	/**
	 * The vertex this corner lies on.
	 * @member module:Core.Corner#vertex
	 * @type {module:Core.Vertex}
	 */
	get vertex() {
		return this.halfedge.prev.vertex;
	}

	/**
	 * The face this corner is contained in.
	 * @member module:Core.Corner#face
	 * @type {module:Core.Face}
	 */
	get face() {
		return this.halfedge.face;
	}

	/**
	 * The next corner (in CCW order) in this corner's face.
	 * @member module:Core.Corner#next
	 * @type {module:Core.Corner}
	 */
	get next() {
		return this.halfedge.next.corner;
	}

	/**
	 * The previous corner (in CCW order) in this corner's face.
	 * @member module:Core.Corner#prev
	 * @type {module:Core.Corner}
	 */
	get prev() {
		return this.halfedge.prev.corner;
	}

	/**
	 * Defines a string representation for this corner as its index.
	 * @ignore
	 * @method module:Core.Corner#toString
	 * @returns {string}
	 */
	toString() {
		return this.index;
	}
}
