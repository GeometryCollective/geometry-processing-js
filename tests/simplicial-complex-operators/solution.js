class SubcomplexOperationTest {
        // the lists of mesh elements are given as lists of indices. The indices are the positions of those mesh
        // elements in their corresponding lists in the mesh, not the indices assigned by some SimplicialComplexOperators object
        constructor(operation, initialVertices, initialEdges, initialFaces, finalVertices, finalEdges, finalFaces) {
                this.operation = operation;

                this.initialVertices = initialVertices;
                this.initialEdges    = initialEdges;
                this.initialFaces    = initialFaces;

                this.finalVertices = finalVertices;
                this.finalEdges    = finalEdges;
                this.finalFaces    = finalFaces;
        }

        static setsEqual(as, bs) {
                if (as.size != bs.size) {
                        return false;
                }

                for (let a of as) {
                        if (!bs.has(a)) {
                                return false;
                        }
                }
                return true;
        }

        static subsetsEqual(a, b) {
                return SubcomplexOperationTest.setsEqual(a.vertices, b.vertices)
                        && SubcomplexOperationTest.setsEqual(a.edges, b.edges)
                        && SubcomplexOperationTest.setsEqual(a.faces, b.faces);
        }

        static testFunction(chai, mesh, test) {
                return function() {
                        let selectedSimplices = new MeshSubset();
                        let simplicialComplexOperators = new SimplicialComplexOperators(mesh);
                        let meshVertices = new Set();
                        let result = null;

                        for (let i of test.initialVertices) {
                                // You can't just add i because the SimplicalComplexOperators are allowed to re-index the mesh elements
                                meshVertices.add(mesh.vertices[i].index);
                        }
                        let meshEdges = new Set();
                        for (let i of test.initialEdges) {
                                meshEdges.add(mesh.edges[i].index);
                        }
                        let meshFaces = new Set();
                        for (let i of test.initialFaces) {
                                meshFaces.add(mesh.faces[i].index);
                        }

                        selectedSimplices.addVertices(meshVertices);
                        selectedSimplices.addEdges(meshEdges);
                        selectedSimplices.addFaces(meshFaces);

                        if (test.operation == "star") {
                                result = simplicialComplexOperators.star(selectedSimplices);
                        } else if (test.operation == "link") {
                                result = simplicialComplexOperators.link(selectedSimplices);
                        } else if (test.operation == "closure") {
                                result = simplicialComplexOperators.closure(selectedSimplices);
                        } else if (test.operation == "boundary") {
                                result = simplicialComplexOperators.boundary(selectedSimplices);
                        }

                        if (!SubcomplexOperationTest.subsetElementsGivenByList(result.vertices, mesh.vertices, test.finalVertices)) {
                                console.log(result.vertices, test.finalVertices);
                        }

                        chai.assert(SubcomplexOperationTest.subsetElementsGivenByList(result.vertices, mesh.vertices, test.finalVertices),
                                "The vertices in your " + test.operation + " are wrong\n");

                        chai.assert(SubcomplexOperationTest.subsetElementsGivenByList(result.edges, mesh.edges, test.finalEdges),
                                "The edges in your " + test.operation + " are wrong\n");

                        chai.assert(SubcomplexOperationTest.subsetElementsGivenByList(result.faces, mesh.faces, test.finalFaces),
                                "The faces in your " + test.operation + " are wrong\n");

                        memoryManager.deleteExcept([]);
                };

        }

        // Returns true if the elements of homogeneousSubset are precisely
        // the elements if simplexList given by the indices in indices
        static subsetElementsGivenByList(homogeneousSubset, simplexList, indices) {
                if(homogeneousSubset.size != indices.length) {
                        return false;
                }
                for (let i of indices) {
                        if (!homogeneousSubset.has(simplexList[i].index)) {
                                return false;
                        }
                }
                return true;
        }
}

class SubcomplexFunctionTest {
        // the lists of mesh elements are given as lists of indices. The indices are the positions of those mesh
        // elements in their corresponding lists in the mesh, not the indices assigned by some SimplicialComplexOperators object
        constructor(fn, vertices, edges, faces, result) {
                this.fn = fn;

                this.vertices = vertices;
                this.edges    = edges;
                this.faces    = faces;
                this.result   = result;
        }

        static testFunction(chai, mesh, test) {
                return function() {
                        let selectedSimplices = new MeshSubset();
                        let simplicialComplexOperators = new SimplicialComplexOperators(mesh);
                        let meshVertices = new Set();
                        let result = null;

                        for (let i of test.vertices) {
                                // You can't just add i because the SimplicalComplexOperators are allowed to re-index the mesh elements
                                meshVertices.add(mesh.vertices[i].index);
                        }
                        let meshEdges = new Set();
                        for (let i of test.edges) {
                                meshEdges.add(mesh.edges[i].index);
                        }
                        let meshFaces = new Set();
                        for (let i of test.faces) {
                                meshFaces.add(mesh.faces[i].index);
                        }

                        selectedSimplices.addVertices(meshVertices);
                        selectedSimplices.addEdges(meshEdges);
                        selectedSimplices.addFaces(meshFaces);

                        if (test.fn == "isComplex") {
                                result = simplicialComplexOperators.isComplex(selectedSimplices);
                        } else if (test.fn == "isPureComplex") {
                                result = simplicialComplexOperators.isPureComplex(selectedSimplices);
                        }

                        chai.assert.strictEqual(result, test.result);

                        memoryManager.deleteExcept([]);
                };
        }
}

// star of a vertex
let vertexStarTest = new SubcomplexOperationTest(
        "star",                               // operation
        [794],                                // original vertices
        [],                                   // original edges
        [],                                   // original faces
        [794],                                // final vertices
        [1336, 1337, 1641, 2182, 2263, 3201], // final edges
        [544, 677, 948, 989, 1525, 1932]);    // final faces

let verticesStarTest = new SubcomplexOperationTest("star", [445, 473], [], [], [445, 473], [635, 636, 690, 691, 1190, 1191, 1968, 2274, 3853, 4004, 4096], [241, 263, 477, 841, 994, 2131, 2177, 2299, 2406, 2507]);
let edgeStarTest     = new SubcomplexOperationTest("star", [], [2117], [], [], [2117], [916, 1074]);
let faceStarTest     = new SubcomplexOperationTest("star", [], [], [841], [], [], [841]);

let vertexClosureTest   = new SubcomplexOperationTest("closure", [794], [], [], [794], [], []);
let verticesClosureTest = new SubcomplexOperationTest("closure", [731, 1064], [], [], [731, 1064], [], []);
let edgeClosureTest     = new SubcomplexOperationTest("closure", [], [2594], [], [939, 1164], [2594], []);
let faceClosureTest     = new SubcomplexOperationTest("closure", [], [], [1196], [731, 939, 1064], [1639, 1969, 2638], [1196]);

let vertexLinkTest   = new SubcomplexOperationTest("link", [1064], [], [], [445, 473, 731, 794, 939, 940, 1164], [1191, 1639, 1641, 2263, 2274, 2594, 4004], []);
let verticesLinkTest = new SubcomplexOperationTest("link", [794, 1064], [], [], [445, 473, 731, 792, 793, 939, 940, 983, 1164], [1191, 1335, 1639, 1642, 2181, 2264, 2274, 2594, 4004], []);
let edgeLinkTest     = new SubcomplexOperationTest("link", [], [1969], [], [473, 939], [], []);
let faceLinkTest     = new SubcomplexOperationTest("link", [], [], [1261], [], [], []);

let vertexBoundaryTest  = new SubcomplexOperationTest("boundary", [915], [], [], [], [], []);
let edgeBoundaryTest    = new SubcomplexOperationTest("boundary", [731, 850], [1434], [], [731, 850], [], []);
let faceBoundaryTest    = new SubcomplexOperationTest("boundary", [593, 731, 850], [1434, 1638, 2090], [1261], [593, 731, 850], [1434, 1638, 2090], []);
let facesBoundaryTest   = new SubcomplexOperationTest("boundary", [593, 655, 731, 850, 1011], [2090, 1192, 1434, 1435, 1638, 2088, 2089], [902, 1261, 584], [593, 655, 731, 850, 1011], [1192, 1435, 1638, 2088, 2089], []);

let vertexComplexTest     = new SubcomplexFunctionTest("isComplex", [615], [], [], true);
let edgeComplexTest       = new SubcomplexFunctionTest("isComplex", [], [607], [], false);
let closedEdgeComplexTest = new SubcomplexFunctionTest("isComplex", [655, 731], [1192], [], true);
let faceComplexTest       = new SubcomplexFunctionTest("isComplex", [], [], [584], false);
let faceEdgesComplexTest  = new SubcomplexFunctionTest("isComplex", [], [1192, 1434, 1435], [584], false);
let closedFaceComplexTest = new SubcomplexFunctionTest("isComplex", [655, 731, 850], [1192, 1434, 1435], [584], true);

let vertexDegreeTest     = new SubcomplexFunctionTest("isPureComplex", [731], [], [], 0);
let edgeDegreeTest       = new SubcomplexFunctionTest("isPureComplex", [], [1969], [], -1);
let closedEdgeDegreeTest = new SubcomplexFunctionTest("isPureComplex", [731, 1064], [1969], [], 1);
let faceDegreeTest       = new SubcomplexFunctionTest("isPureComplex", [], [], [1261], -1);
let faceEdgesDegreeTest  = new SubcomplexFunctionTest("isPureComplex", [], [1638, 1434, 2090], [1261], -1);
let closedFaceDegreeTest = new SubcomplexFunctionTest("isPureComplex", [593, 731, 850], [1638, 1434, 2090], [1261], 2);
let impureDegreeTest    = new SubcomplexFunctionTest("isPureComplex", [593, 731, 850, 610], [1638, 1434, 2090, 2597], [1261], -1);
