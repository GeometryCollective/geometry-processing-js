"use strict";

function subsetElementsGivenByList(subset, simplexList, indices) {
        if(subset.size != indices.length) {
                return false;
        }
        for (let i of indices) {
                if (!subset.has(simplexList[i])) {
                        return false;
                }
        }
        return true;
}

describe("Simplicial Complex Operators", function() {
        let polygonSoup = MeshIO.readOBJ(small_bunny);
        let mesh = new Mesh();
        mesh.build(polygonSoup);

        describe("isComplex", function() {
                it("A vertex", SubcomplexFunctionTest.testFunction(chai, mesh, vertexComplexTest));
                it("An edge",  SubcomplexFunctionTest.testFunction(chai, mesh, edgeComplexTest));
                it("A closed edge",  SubcomplexFunctionTest.testFunction(chai, mesh, closedEdgeComplexTest));
                it("A face",  SubcomplexFunctionTest.testFunction(chai, mesh, faceComplexTest));
                it("A face with its edges",  SubcomplexFunctionTest.testFunction(chai, mesh, faceEdgesComplexTest));
                it("A closed face",  SubcomplexFunctionTest.testFunction(chai, mesh, closedFaceComplexTest));
        });

        describe("pureDegree", function() {
                it("A vertex", SubcomplexFunctionTest.testFunction(chai, mesh, vertexDegreeTest));
                it("An edge",  SubcomplexFunctionTest.testFunction(chai, mesh, edgeDegreeTest));
                it("A closed edge",  SubcomplexFunctionTest.testFunction(chai, mesh, closedEdgeDegreeTest));
                it("A face",  SubcomplexFunctionTest.testFunction(chai, mesh, faceDegreeTest));
                it("A face with its edges",  SubcomplexFunctionTest.testFunction(chai, mesh, faceEdgesDegreeTest));
                it("A closed face",  SubcomplexFunctionTest.testFunction(chai, mesh, closedFaceDegreeTest));
                it("A closed face and closed edge",  SubcomplexFunctionTest.testFunction(chai, mesh, impureDegreeTest));
        });

        describe("A0", function() {
                it("Has |E| rows", function() {
                        let simplicialComplexOperators = new SimplicialComplexOperators(mesh);
                        chai.assert.strictEqual(simplicialComplexOperators.A0.nRows(), mesh.edges.length, "A0 does not have |E| rows");
                });
                it("Has |V| columns", function() {
                        let simplicialComplexOperators = new SimplicialComplexOperators(mesh);
                        chai.assert.strictEqual(simplicialComplexOperators.A0.nCols(), mesh.vertices.length, "A0 does not have |V| columns");
                });
                it("Rows sum to two", function() {
                        let selectedSimplices = new MeshSubset();
                        let simplicialComplexOperators = new SimplicialComplexOperators(mesh);
                        let ones = DenseMatrix.ones(mesh.vertices.length, 1);
                        let colSums = simplicialComplexOperators.A0.timesDense(ones);

                        let colSumsAllTwo = true;
                        for (let i = 0; i < mesh.vertices.length; i++) {
                                colSumsAllTwo = colSumsAllTwo && (colSums.get(i, 0) == 2);
                        }
                        chai.assert(colSumsAllTwo, "There is a row in your A0 which does not sum to 2.\n");

                });
                it("Columns sum to degrees", function() {
                        let selectedSimplices = new MeshSubset();
                        let simplicialComplexOperators = new SimplicialComplexOperators(mesh);
                        let ones = DenseMatrix.ones(mesh.edges.length, 1);
                        let rowSums = simplicialComplexOperators.A0.transpose().timesDense(ones);

                        let degrees = new Array(mesh.vertices.length);
                        for (let v of mesh.vertices) {
                                degrees[v.index] = v.degree();
                        }

                        let rowSumsAllCorrect = true;
                        for (let i = 0; i < mesh.vertices.length; i++) {
                                rowSumsAllCorrect = rowSumsAllCorrect && (rowSums.get(i, 0) == degrees[i]);
                        }
                        chai.assert(rowSumsAllCorrect, "There is a column in your A0 which does not sum to the degree of the corresponding vertex.\n");

                });
        });

        describe("A1", function() {
                it("Has |F| rows", function() {
                        let simplicialComplexOperators = new SimplicialComplexOperators(mesh);
                        chai.assert.strictEqual(simplicialComplexOperators.A1.nRows(), mesh.faces.length, "A1 does not have |F| rows");
                });

                it("Has |E| columns", function() {
                        let simplicialComplexOperators = new SimplicialComplexOperators(mesh);
                        chai.assert.strictEqual(simplicialComplexOperators.A1.nCols(), mesh.edges.length, "A1 does not have |E| columns");
                });
                it("Rows sum to number of faces", function() {
                        let selectedSimplices = new MeshSubset();
                        let simplicialComplexOperators = new SimplicialComplexOperators(mesh);
                        let ones = DenseMatrix.ones(mesh.edges.length, 1);
                        let colSums = simplicialComplexOperators.A1.timesDense(ones);

                        let nEdges = new Array(mesh.faces.length);
                        for (let f of mesh.faces) {
                                let es = Array.from(f.adjacentEdges());
                                nEdges[f.index] = es.length;
                        }

                        let colSumsAllCorrect = true;
                        for (let i = 0; i < mesh.vertices.length; i++) {
                                colSumsAllCorrect = colSumsAllCorrect && (colSums.get(i, 0) == nEdges[i]);
                        }
                        chai.assert(colSumsAllCorrect, "There is a row in your A1 which does not sum to the number of edges of the corresponding face.\n");

                });
                it("Columns sum to two", function() {
                        let selectedSimplices = new MeshSubset();
                        let simplicialComplexOperators = new SimplicialComplexOperators(mesh);
                        let ones = DenseMatrix.ones(mesh.faces.length, 1);
                        let rowSums = simplicialComplexOperators.A1.transpose().timesDense(ones);

                        let rowSumsAllTwo = true;
                        for (let i = 0; i < mesh.vertices.length; i++) {
                                rowSumsAllTwo = rowSumsAllTwo && (rowSums.get(i, 0) == 2);
                        }
                        chai.assert(rowSumsAllTwo, "There is a column in your A1 which does not sum to 2.\n");

                });
        });

        describe("buildVertexVector", function() {
                it("Correct size", function() {
                        let selectedSimplices = new MeshSubset();
                        selectedSimplices.addVertices([1,2,3]);
                        let simplicialComplexOperators = new SimplicialComplexOperators(mesh);
                        let vec = simplicialComplexOperators.buildVertexVector(selectedSimplices);
                        chai.assert.strictEqual(vec.nRows(), mesh.vertices.length, "You build a vector with the wrong number of entries.\n");
                        chai.assert.strictEqual(vec.nCols(), 1, "You build a vector with more than one column.\n");
                });
                it("All entries 0 or 1", function() {
                        let selectedSimplices = new MeshSubset();
                        selectedSimplices.addVertices([1,2,3]);
                        let simplicialComplexOperators = new SimplicialComplexOperators(mesh);
                        let vec = simplicialComplexOperators.buildVertexVector(selectedSimplices);
                        let binaryEntries = true;
                        for (let i = 0; i < mesh.vertices.length; i++) {
                                binaryEntries = binaryEntries && (vec.get(i, 0) == 0 || vec.get(i, 0) == 1);
                        }
                        chai.assert(binaryEntries, "You put an entry in your vertex vector which is neither 0 nor 1.\n");
                });
        });

        describe("buildEdgeVector", function() {
                it("Correct size", function() {
                        let selectedSimplices = new MeshSubset();
                        selectedSimplices.addVertices([1,2,3]);
                        let simplicialComplexOperators = new SimplicialComplexOperators(mesh);
                        let vec = simplicialComplexOperators.buildEdgeVector(selectedSimplices);
                        chai.assert.strictEqual(vec.nRows(), mesh.edges.length, "You build a vector with the wrong number of entries.\n");
                        chai.assert.strictEqual(vec.nCols(), 1, "You build a vector with more than one column.\n");
                });
                it("All entries 0 or 1", function() {
                        let selectedSimplices = new MeshSubset();
                        selectedSimplices.addVertices([1,2,3]);
                        let simplicialComplexOperators = new SimplicialComplexOperators(mesh);
                        let vec = simplicialComplexOperators.buildEdgeVector(selectedSimplices);
                        let binaryEntries = true;
                        for (let i = 0; i < mesh.edges.length; i++) {
                                binaryEntries = binaryEntries && (vec.get(i, 0) == 0 || vec.get(i, 0) == 1);
                        }
                        chai.assert(binaryEntries, "You put an entry in your edge vector which is neither 0 nor 1.\n");
                });
        });

        describe("buildFaceVector", function() {
                it("Correct size", function() {
                        let selectedSimplices = new MeshSubset();
                        selectedSimplices.addVertices([1,2,3]);
                        let simplicialComplexOperators = new SimplicialComplexOperators(mesh);
                        let vec = simplicialComplexOperators.buildFaceVector(selectedSimplices);
                        chai.assert.strictEqual(vec.nRows(), mesh.faces.length, "You build a vector with the wrong number of entries.\n");
                        chai.assert.strictEqual(vec.nCols(), 1, "You build a vector with more than one column.\n");
                });
                it("All entries 0 or 1", function() {
                        let selectedSimplices = new MeshSubset();
                        selectedSimplices.addVertices([1,2,3]);
                        let simplicialComplexOperators = new SimplicialComplexOperators(mesh);
                        let vec = simplicialComplexOperators.buildFaceVector(selectedSimplices);
                        let binaryEntries = true;
                        for (let i = 0; i < mesh.faces.length; i++) {
                                binaryEntries = binaryEntries && (vec.get(i, 0) == 0 || vec.get(i, 0) == 1);
                        }
                        chai.assert(binaryEntries, "You put an entry in your face vector which is neither 0 nor 1.\n");
                });
        });

        describe("Boundary", function() {
                it("Squares to zero", function() {
                        let selectedSimplices = new MeshSubset();
                        selectedSimplices.addVertices([473, 492, 547, 605, 649, 650, 731, 792, 793, 1012, 1064, 1135, 1231, 1232]);
                        selectedSimplices.addEdges([2118, 2513, 1010, 1011, 1012, 1191, 1335, 1968, 1969, 2117, 2179, 2374, 2375, 2526, 2565, 3960]);
                        selectedSimplices.addFaces([916, 841, 1207, 2833, 398, 1049]);
                        let simplicialComplexOperators = new SimplicialComplexOperators(mesh);
                        let result = simplicialComplexOperators.boundary(simplicialComplexOperators.boundary(selectedSimplices));
                        chai.assert(result.vertices.size == 0, "Your double boundary of a set contains extra vertices.");
                        chai.assert(result.edges.size == 0, "Your double boundary of a set contains extra edges.");
                        chai.assert(result.faces.size == 0, "Your double boundary of a set contains extra faces.");
                });
                it("Boundary of a vertex",       SubcomplexOperationTest.testFunction(chai, mesh, vertexBoundaryTest));
                it("Boundary of an edge",        SubcomplexOperationTest.testFunction(chai, mesh, edgeBoundaryTest));
                it("Boundary of a face",         SubcomplexOperationTest.testFunction(chai, mesh, faceBoundaryTest));
                it("Boundary of adjacent faces", SubcomplexOperationTest.testFunction(chai, mesh, facesBoundaryTest));
        });

        describe("Star", function() {
                it("Star of a vertex",     SubcomplexOperationTest.testFunction(chai, mesh, vertexStarTest));
                it("Star of two vertices", SubcomplexOperationTest.testFunction(chai, mesh, verticesStarTest));
                it("Star of an edge",      SubcomplexOperationTest.testFunction(chai, mesh, edgeStarTest));
                it("Star of a face",       SubcomplexOperationTest.testFunction(chai, mesh, faceStarTest));
                it("Squares to itself", function() {
                        let selectedSimplices = new MeshSubset();
                        selectedSimplices.addVertices([1,2,3]);
                        selectedSimplices.addEdges([1,2,3]);
                        selectedSimplices.addFaces([1,2,3]);
                        let simplicialComplexOperators = new SimplicialComplexOperators(mesh);
                        let resultOne = simplicialComplexOperators.star(selectedSimplices);
                        let resultTwo = simplicialComplexOperators.star(resultOne);
                        chai.assert(SubcomplexOperationTest.subsetsEqual(resultOne, resultTwo), "Your star does not square to itself.");
                });
        });

        describe("Closure", function() {
                it("Closure of a vertex",     SubcomplexOperationTest.testFunction(chai, mesh, vertexClosureTest));
                it("Closure of two vertices", SubcomplexOperationTest.testFunction(chai, mesh, verticesClosureTest));
                it("Closure of an edge",      SubcomplexOperationTest.testFunction(chai, mesh, edgeClosureTest));
                it("Closure of a face",       SubcomplexOperationTest.testFunction(chai, mesh, faceClosureTest));
                it("Squares to itself", function() {
                        let selectedSimplices = new MeshSubset();
                        selectedSimplices.addVertices([1,2,3]);
                        selectedSimplices.addEdges([1,2,3]);
                        selectedSimplices.addFaces([1,2,3]);
                        let simplicialComplexOperators = new SimplicialComplexOperators(mesh);
                        let resultOne = simplicialComplexOperators.closure(selectedSimplices);
                        let resultTwo = simplicialComplexOperators.closure(resultOne);
                        chai.assert(SubcomplexOperationTest.subsetsEqual(resultOne, resultTwo), "Your closure does not square to itself.");
                });
        });

        describe("Link", function() {
                it("Link of a vertex",     SubcomplexOperationTest.testFunction(chai, mesh, vertexLinkTest));
                it("Link of two vertices", SubcomplexOperationTest.testFunction(chai, mesh, verticesLinkTest));
                it("Link of an edge",      SubcomplexOperationTest.testFunction(chai, mesh, edgeLinkTest));
                it("Link of a face",       SubcomplexOperationTest.testFunction(chai, mesh, faceLinkTest));
        });
});
