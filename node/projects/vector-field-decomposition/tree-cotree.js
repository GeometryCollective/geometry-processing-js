class TreeCotree {
	/**
	 * This class computes the {@link https://www.cs.cmu.edu/~kmcrane/Projects/DDG/paper.pdf tree cotree} decomposition of a surface mesh
	 * to build its {@link https://en.wikipedia.org/wiki/Homology_(mathematics)#Surfaces homology generators}.
	 * @constructor module:Projects.TreeCotree
	 * @param {module:Core.Mesh} mesh The input mesh this class acts on.
	 * @property {module:Core.Mesh} mesh The input mesh this class acts on.
	 * @property {vertexParent} vertexParent A dictionary mapping each vertex of the input mesh to
	 * its parent in the primal spanning tree.
	 * @property {faceParent} faceParent A dictionary mapping each face of the input mesh to
	 * its parent in the dual spanning tree.
	 */
	constructor(mesh) {
		this.mesh = mesh;
		this.vertexParent = {};
		this.faceParent = {};
	}

	/**
	 * Builds a primal spanning tree on a boundaryless mesh.
	 * @private
	 * @method module:Projects.TreeCotree#buildPrimalSpanningTree
	 */
	buildPrimalSpanningTree() {
		// mark each vertex as its own parent
		for (let v of this.mesh.vertices) {
			this.vertexParent[v] = v;
		}

		// build spanning tree
		let root = this.mesh.vertices[0];
		let queue = [root];
		while (queue.length !== 0) {
			let u = queue.shift();

			for (let v of u.adjacentVertices()) {
				if (this.vertexParent[v] === v && v !== root) {
					this.vertexParent[v] = u;
					queue.push(v);
				}
			}
		}
	}

	/**
	 * Checks whether a halfedge is in the primal spanning tree.
	 * @private
	 * @method module:Projects.TreeCotree#inPrimalSpanningTree
	 * @param {module:Core.Halfedge} h A halfedge on the input mesh.
	 * @returns {boolean}
	 */
	inPrimalSpanningTree(h) {
		let u = h.vertex;
		let v = h.twin.vertex;

		return this.vertexParent[u] === v || this.vertexParent[v] === u;
	}

	/**
	 * Builds a dual spanning tree on a boundaryless mesh.
	 * @private
	 * @method module:Projects.TreeCotree#buildDualSpanningCotree
	 */
	buildDualSpanningCotree() {
		// mark each face as its own parent
		for (let f of this.mesh.faces) {
			this.faceParent[f] = f;
		}

		// build dual spanning tree
		let root = this.mesh.faces[0];
		let queue = [root];
		while (queue.length !== 0) {
			let f = queue.shift();

			for (let h of f.adjacentHalfedges()) {
				if (!this.inPrimalSpanningTree(h)) {
					let g = h.twin.face;

					if (this.faceParent[g] === g && g !== root) {
						this.faceParent[g] = f;
						queue.push(g);
					}
				}
			}
		}
	}

	/**
	 * Checks whether a halfedge is in the dual spanning tree.
	 * @private
	 * @method module:Projects.TreeCotree#inDualSpanningTree
	 * @param {module:Core.Halfedge} h A halfedge on the input mesh.
	 * @returns {boolean}
	 */
	inDualSpanningTree(h) {
		let f = h.face;
		let g = h.twin.face;

		return this.faceParent[f] === g || this.faceParent[g] === f;
	}

	/**
	 * Returns a halfedge lying on the shared edge between face f and g.
	 * @private
	 * @method module:Projects.TreeCotree#sharedHalfedge
	 * @param {module:Core.Face} f A face on the input mesh.
	 * @param {module:Core.Face} g A neighboring face to f on the input mesh.
	 * @returns {module:Core.Halfedge}
	 */
	sharedHalfedge(f, g) {
		for (let h of f.adjacentHalfedges()) {
			if (h.twin.face === g) {
				return h;
			}
		}

		alert("Line 120, sharedHalfedge, tree-cotree.js: Code should not reach here!");
		return new Halfedge();
	}

	/**
	 * Computes the {@link https://en.wikipedia.org/wiki/Homology_(mathematics)#Surfaces homology generators} of the input mesh and stores them
	 * in the {@link module:Core.Mesh Mesh}'s generators property.
	 * @method module:Projects.TreeCotree#buildGenerators
	 */
	buildGenerators() {
		// build spanning trees
		this.buildPrimalSpanningTree();
		this.buildDualSpanningCotree();

		// collect dual edges that are neither in primal spanning tree nor in dual spanning cotree
		for (let e of this.mesh.edges) {
			let h = e.halfedge;

			if (!this.inPrimalSpanningTree(h) && !this.inDualSpanningTree(h)) {
				// trace faces back to root
				let tempGenerator1 = [];
				let f = h.face;
				while (this.faceParent[f] !== f) {
					let parent = this.faceParent[f];
					tempGenerator1.push(this.sharedHalfedge(f, parent));
					f = parent;
				}

				let tempGenerator2 = [];
				f = h.twin.face;
				while (this.faceParent[f] !== f) {
					let parent = this.faceParent[f];
					tempGenerator2.push(this.sharedHalfedge(f, parent));
					f = parent;
				}

				// remove common halfedges
				let m = tempGenerator1.length - 1;
				let n = tempGenerator2.length - 1;
				while (tempGenerator1[m] === tempGenerator2[n]) {
					m--;
					n--;
				}

				let generator = [h];
				for (let i = 0; i <= m; i++) generator.push(tempGenerator1[i].twin);
				for (let i = n; i >= 0; i--) generator.push(tempGenerator2[i]);

				this.mesh.generators.push(generator);
			}
		}
	}
}

module.exports = TreeCotree