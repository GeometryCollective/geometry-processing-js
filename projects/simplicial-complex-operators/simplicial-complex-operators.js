"use strict";

class SimplicialComplexOperators {

        /** This class implements various operators (e.g. boundary, star, link) on a mesh.
         * @constructor module:Projects.SimplicialComplexOperators
         * @param {module:Core.Mesh} mesh The input mesh this class acts on.
         * @property {module:Core.Mesh} mesh The input mesh this class acts on.
         * @property {module:LinearAlgebra.SparseMatrix} A0 The vertex-edge adjacency matrix of <code>mesh</code>.
         * @property {module:LinearAlgebra.SparseMatrix} A1 The edge-face adjacency matrix of <code>mesh</code>.
         */
        constructor(mesh) {
                this.mesh = mesh;
                this.assignElementIndices(this.mesh);

                this.A0 = this.buildVertexEdgeAdjacencyMatrix(this.mesh);
                this.A1 = this.buildEdgeFaceAdjacencyMatrix(this.mesh);
        }

        /** Assigns indices to the input mesh's vertices, edges, and faces
         * @method module:Projects.SimplicialComplexOperators#assignElementIndices
         * @param {module:Core.Mesh} mesh The input mesh which we index.
         */
        assignElementIndices(mesh) {
                if (false) {
                        for (let i = 0; i < mesh.vertices.length; i++) {
                                mesh.vertices[i].index = i;
                        }
                        for (let i = 0; i < mesh.edges.length; i++) {
                                mesh.edges[i].index = i;
                        }
                        for (let i = 0; i < mesh.faces.length; i++) {
                                mesh.faces[i].index = i;
                        }
                } else {
                        let permutation = function(n) {
                                let lst = new Array(n);
                                for (let i = 0; i < n; i++) {
                                        lst[i] = i;
                                }

                                for (let i = 0; i < n; i++) {
                                        let swapIndex = i + Math.floor(Math.random() * (lst.length - i));
                                        let tmp = lst[i];
                                        lst[i] = lst[swapIndex];
                                        lst[swapIndex] = tmp;
                                }
                                return lst;
                        };

                        let index = 0;
                        let indices = permutation(mesh.vertices.length);
                        for (let v of mesh.vertices) {
                                v.index = indices[index];
                                index++;
                        }
                        index = 0;
                        indices = permutation(mesh.edges.length);
                        for (let e of mesh.edges) {
                                e.index = indices[index];
                                index++;
                        }
                        index = 0;
                        indices = permutation(mesh.faces.length);
                        for (let f of mesh.faces) {
                                f.index = indices[index];
                                index++;
                        }
                }
        }

        /** Returns the vertex-edge adjacency matrix of the given mesh.
         * @method module:Projects.SimplicialComplexOperators#buildVertexEdgeAdjacencyMatrix
         * @param {module:Core.Mesh} mesh The mesh whose adjacency matrix we compute.
         * @returns {module:LinearAlgebra.SparseMatrix} The vertex-edge adjacency matrix of the given mesh.
         */
        buildVertexEdgeAdjacencyMatrix(mesh) {
                let T = new Triplet(mesh.edges.length, mesh.vertices.length);
                for (let e of mesh.edges) {
                        let v1 = e.halfedge.vertex;
                        let v2 = e.halfedge.next.vertex;
                        T.addEntry(1, e.index, v1.index);
                        T.addEntry(1, e.index, v2.index);
                }
                return SparseMatrix.fromTriplet(T);
        }

        /** Returns the edge-face adjacency matrix.
         * @method module:Projects.SimplicialComplexOperators#buildEdgeFaceAdjacencyMatrix
         * @param {module:Core.Mesh} mesh The mesh whose adjacency matrix we compute.
         * @returns {module:LinearAlgebra.SparseMatrix} The edge-face adjacency matrix of the given mesh.
         */
        buildEdgeFaceAdjacencyMatrix(mesh) {
                let T = new Triplet(mesh.faces.length, mesh.edges.length);
                for (let f of mesh.faces) {
                        for (let e of f.adjacentEdges()) {
                                T.addEntry(1, f.index, e.index);
                        }
                }
                return SparseMatrix.fromTriplet(T);
        }

        /** Returns a column vector representing the vertices of the
         * given subset.
         * @method module:Projects.SimplicialComplexOperators#buildVertexVector
         * @param {module:Core.MeshSubset} subset A subset of our mesh.
         * @returns {module:LinearAlgebra.DenseMatrix} A column vector with |V| entries. The ith entry is 1 if
         *  vertex i is in the given subset and 0 otherwise
         */
        buildVertexVector(subset) {
                let vector = DenseMatrix.zeros(this.mesh.vertices.length, 1);
                for (let v of subset.vertices) {
                        vector.set(1, v, 0);
                }
                return vector;
        }

        /** Returns a column vector representing the edges of the
         * given subset.
         * @method module:Projects.SimplicialComplexOperators#buildEdgeVector
         * @param {module:Core.MeshSubset} subset A subset of our mesh.
         * @returns {module:LinearAlgebra.DenseMatrix} A column vector with |E| entries. The ith entry is 1 if
         *  edge i is in the given subset and 0 otherwise
         */
        buildEdgeVector(subset) {
                let vector = DenseMatrix.zeros(this.mesh.edges.length, 1);
                for (let e of subset.edges) {
                        vector.set(1, e, 0);
                }
                return vector;
        }

        /** Returns a column vector representing the faces of the
         * given subset.
         * @method module:Projects.SimplicialComplexOperators#buildFaceVector
         * @param {module:Core.MeshSubset} subset A subset of our mesh.
         * @returns {module:LinearAlgebra.DenseMatrix} A column vector with |F| entries. The ith entry is 1 if
         *  face i is in the given subset and 0 otherwise
         */
        buildFaceVector(subset) {
                let vector = DenseMatrix.zeros(this.mesh.faces.length, 1);
                for (let f of subset.faces) {
                        vector.set(1, f, 0);
                }
                return vector;
        }

        /** Returns the star of a subset.
         * @method module:Projects.SimplicialComplexOperators#star
         * @param {module:Core.MeshSubset} subset A subset of our mesh.
         * @returns {module:Core.MeshSubset} The star of the given subset.
         */
        star(subset) {
                subset = MeshSubset.deepCopy(subset);
                let edgeVector = this.A0.timesDense(this.buildVertexVector(subset));
                let edges = new Set();
                for (let i = 0; i < this.mesh.edges.length; i++) {
                        if (edgeVector.get(i, 0) != 0) {
                                edges.add(i);
                        }
                }

                subset.addEdges(edges);

                let faceVector = this.A1.timesDense(this.buildEdgeVector(subset));
                let faces = new Set()
                for (let i = 0; i < this.mesh.faces.length; i++) {
                        if (faceVector.get(i, 0) != 0) {
                                faces.add(i);
                        }
                }


                subset.addFaces(faces);

                return subset;

        }

        /** Returns the closure of a subset.
         * @method module:Projects.SimplicialComplexOperators#closure
         * @param {module:Core.MeshSubset} subset A subset of our mesh.
         * @returns {module:Core.MeshSubset} The closure of the given subset.
         */
        closure(subset) {
                subset = MeshSubset.deepCopy(subset);
                let edgeVector = this.A1.transpose().timesDense(this.buildFaceVector(subset));
                let edges = new Set();
                for (let i = 0; i < this.mesh.edges.length; i++) {
                        if (edgeVector.get(i, 0) != 0) {
                                edges.add(i);
                        }
                }

                subset.addEdges(edges);

                let vertexVector = this.A0.transpose().timesDense(this.buildEdgeVector(subset));
                let vertices = new Set()
                for (let i = 0; i < this.mesh.vertices.length; i++) {
                        if (vertexVector.get(i, 0) != 0) {
                                vertices.add(i);
                        }
                }


                subset.addVertices(vertices);

                return subset;
        }

        /** Returns the link of a subset.
         * @method module:Projects.SimplicialComplexOperators#link
         * @param {module:Core.MeshSubset} subset A subset of our mesh.
         * @returns {module:Core.MeshSubset} The link of the given subset.
         */
        link(subset) {
                let closureStar = this.closure(this.star(subset));
                let starClosure = this.star(this.closure(subset));

                closureStar.deleteSubset(starClosure);

                return closureStar;
        }

        /** Returns true if the given subset is a subcomplex and false otherwise.
         * @method module:Projects.SimplicialComplexOperators#isComplex
         * @param {module:Core.MeshSubset} subset A subset of our mesh.
         * @returns {boolean} True if the given subset is a subcomplex and false otherwise.
         */
        isComplex(subset) {
                return subset.equals(this.closure(subset));
        }

        /** Returns the degree if the given subset is a pure subcomplex and -1 otherwise.
         * @method module:Projects.SimplicialComplexOperators#isPureComplex
         * @param {module:Core.MeshSubset} subset A subset of our mesh.
         * @returns {number} The degree of the given subset if it is a pure subcomplex and -1 otherwise.
         */
        isPureComplex(subset) {
                if (!this.isComplex(subset)) {
                        return -1;
                }
                let vs = this.buildVertexVector(subset);
                let es = this.buildEdgeVector(subset);
                let fs = this.buildFaceVector(subset);
                if (subset.faces.size > 0) {
                        let faceVertices = this.A0.transpose().timesDense(this.A1.transpose().timesDense(fs));

                        for (let i = 0; i < this.mesh.vertices.length; i++) {
                                if (faceVertices.get(i, 0) == 0 && vs.get(i, 0) != 0) {
                                        return -1;
                                }

                        }
                        return 2;
                } else if (subset.edges.size > 0) {
                        let edgeVertices = this.A0.transpose().timesDense(es);

                        for (let i = 0; i < this.mesh.vertices.length; i++) {
                                if (edgeVertices.get(i, 0) == 0 && vs.get(i, 0) != 0) {
                                        return -1;
                                }

                        }
                        return 1;

                } else if (subset.vertices.size > 0) {
                        return 0;
                } else {
                        return 0;
                }
        }

        /** Returns the boundary of a subset.
         * @method module:Projects.SimplicialComplexOperators#boundary
         * @param {module:Core.MeshSubset} subset A subset of our mesh. We assume <code>subset</code> is a pure subcomplex.
         * @returns {module:Core.MeshSubset} The boundary of the given pure subcomplex.
         */
        boundary(subset) {
                let boundary = new MeshSubset();
                if (subset.faces.size > 0) {
                        let faceEdges = this.A1.transpose().timesDense(this.buildFaceVector(subset));
                        for (let i = 0; i < this.mesh.edges.length; i++) {
                                if (faceEdges.get(i, 0) == 1) {
                                        boundary.addEdge(i);
                                }
                        }
                } else if (subset.edges.size > 0) {
                        let edgeVertices = this.A0.transpose().timesDense(this.buildEdgeVector(subset));
                        for (let i = 0; i < this.mesh.vertices.length; i++) {
                                if (edgeVertices.get(i, 0) == 1) {
                                        boundary.addVertex(i);
                                }
                        }

                }
                return this.closure(boundary);
        }
}
