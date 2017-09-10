"use strict";

/**
 * This module implements a halfedge mesh data structure and its associated geometry.
 * A halfedge mesh stores mesh elements such as vertices, edges and faces as well as
 * their connectivity information. The latter is particulary important in geometry
 * processing, as algorithms often exploit local connectivity of mesh elements. At
 * the cost of slightly higher memory consumption compared to other data structures,
 * a halfedge mesh enables quick access of mesh elements. For example, it is possible to
 * enumerate the vertices and edges contained in and faces adjacent to any single face
 * in a mesh. Similar enumerations are also possible for any vertex or edge in a mesh.
 * Additionally, its possible to perform global traversals that enumerate over all mesh
 * vertices, edges and faces in an unspecified but fixed order.
 *
 * <img src="../imgs/halfedge.png">
 *
 * The diagram above illustrates how connectivity information is stored locally in a
 * halfedge mesh. The key idea is to split a edge into two directed halfedges. Each
 * halfedge stores a reference to the vertex at its base, the edge it lies on, the
 * face adjacent to it, the next halfedge in counter clockwise order, and the opposite
 * (or twin) halfedge. Each vertex, edge and face of a mesh in turn stores a reference
 * to one of the halfedges (outgoing in the case of a vertex) its incident on.
 *
 * @module Core
 */
class Halfedge {
	/**
	 * This class defines the connectivity of a {@link module:Core.Mesh Mesh}.
	 * @constructor module:Core.Halfedge
	 * @property {module:Core.Vertex} vertex The vertex at the base of this halfedge.
	 * @property {module:Core.Edge} edge The edge associated with this halfedge.
	 * @property {module:Core.Face} face The face associated with this halfedge.
	 * @property {module:Core.Corner} corner The corner opposite to this halfedge. Undefined if this halfedge is on the boundary.
	 * @property {module:Core.Halfedge} next The next halfedge (in CCW order) in this halfedge's face.
	 * @property {module:Core.Halfedge} prev The previous halfedge (in CCW order) in this halfedge's face.
	 * @property {module:Core.Halfedge} twin The other halfedge associated with this halfedge's edge.
	 * @property {boolean} onBoundary A flag that indicates whether this halfedge is on a boundary.
	 */
	constructor() {
		this.vertex = undefined;
		this.edge = undefined;
		this.face = undefined;
		this.corner = undefined;
		this.next = undefined;
		this.prev = undefined;
		this.twin = undefined;
		this.onBoundary = undefined;
		this.index = -1; // an ID between 0 and |H| - 1, where |H| is the number of halfedges in a mesh
	}

	/**
	 * Defines a string representation for this halfedge as its index.
	 * @ignore
	 * @method module:Core.Halfedge#toString
	 * @returns {string}
	 */
	toString() {
		return this.index;
	}
}
