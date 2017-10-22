"use strict";

describe("Geometry", function() {
	let polygonSoup = MeshIO.readOBJ(solution);
	let mesh = new Mesh();
	mesh.build(polygonSoup);
	let V = mesh.vertices.length;
	let geometry = new Geometry(mesh, polygonSoup["v"], false);

	let loadVertexQuantities = function() {
		let barycentricDualAreas = [];
		let circumcentricDualAreas = [];
		let angleWeightedNormals = [];
		let sphereInscribedNormals = [];
		let areaWeightedNormals = [];
		let gaussCurvatureNormals = [];
		let meanCurvatureNormals = [];
		let scalarGaussCurvatures = [];
		let scalarMeanCurvatures = [];
		let minPrincipalCurvatures = [];
		let maxPrincipalCurvatures = [];
		let totalAngleDefect = -1;

		let lines = solution.split("\n");
		for (let line of lines) {
			line = line.trim();
			let tokens = line.split(" ");
			let identifier = tokens[0].trim();

			if (identifier === "barycentricDualArea") {
				barycentricDualAreas.push(parseFloat(tokens[1]));

			} else if (identifier === "circumcentricDualArea") {
				circumcentricDualAreas.push(parseFloat(tokens[1]));

			} else if (identifier === "angleWeightedNormal") {
				angleWeightedNormals.push(new Vector(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])));

			} else if (identifier === "sphereInscribedNormal") {
				sphereInscribedNormals.push(new Vector(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])));

			} else if (identifier === "areaWeightedNormal") {
				areaWeightedNormals.push(new Vector(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])));

			} else if (identifier === "gaussCurvatureNormal") {
				gaussCurvatureNormals.push(new Vector(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])));

			} else if (identifier === "meanCurvatureNormal") {
				meanCurvatureNormals.push(new Vector(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])));

			} else if (identifier === "scalarGaussCurvature") {
				scalarGaussCurvatures.push(parseFloat(tokens[1]));

			} else if (identifier === "scalarMeanCurvature") {
				scalarMeanCurvatures.push(parseFloat(tokens[1]));

			} else if (identifier === "k1") {
				minPrincipalCurvatures.push(parseFloat(tokens[1]));

			} else if (identifier === "k2") {
				maxPrincipalCurvatures.push(parseFloat(tokens[1]));

			} else if (identifier === "totalAngleDefect") {
				totalAngleDefect = parseFloat(tokens[1]);
			}
		}

		return [barycentricDualAreas, circumcentricDualAreas, angleWeightedNormals, sphereInscribedNormals,
			areaWeightedNormals, gaussCurvatureNormals, meanCurvatureNormals, scalarGaussCurvatures,
			scalarMeanCurvatures, minPrincipalCurvatures, maxPrincipalCurvatures, totalAngleDefect
		];
	}

	let [barycentricDualAreas_sol, circumcentricDualAreas_sol, angleWeightedNormals_sol,
		sphereInscribedNormals_sol, areaWeightedNormals_sol, gaussCurvatureNormals_sol,
		meanCurvatureNormals_sol, scalarGaussCurvatures_sol, scalarMeanCurvatures_sol,
		minPrincipalCurvatures_sol, maxPrincipalCurvatures_sol, totalAngleDefect_sol
	] = loadVertexQuantities();

	describe("barycentricDualArea", function() {
		it("computes the barycentric dual area of a vertex",
			function() {
				let success = true;
				for (let v of mesh.vertices) {
					if (Math.abs(barycentricDualAreas_sol[v.index] - geometry.barycentricDualArea(v)) > 1e-5) {
						success = false;
						break;
					}
				}

				chai.assert.strictEqual(success, true);
			});
	});

	describe("circumcentricDualArea", function() {
		it("computes the circumcentric dual area of a vertex",
			function() {
				let success = true;
				for (let v of mesh.vertices) {
					if (Math.abs(circumcentricDualAreas_sol[v.index] - geometry.circumcentricDualArea(v)) > 1e-5) {
						success = false;
						break;
					}
				}

				chai.assert.strictEqual(success, true);
			});
	});

	describe("vertexNormalAngleWeighted", function() {
		it("computes the normal at a vertex using the 'tip angle weights' method",
			function() {
				let success = true;
				for (let v of mesh.vertices) {
					let n = geometry.vertexNormalAngleWeighted(v);
					if (n.isValid()) {
						if (angleWeightedNormals_sol[v.index].minus(n).norm() > 1e-5) {
							success = false;
							break;
						}

					} else {
						success = false;
					}
				}

				chai.assert.strictEqual(success, true);
			});
	});

	describe("vertexNormalSphereInscribed", function() {
		it("computes the normal at a vertex using the 'inscribed sphere' method", function() {
			let success = true;
			for (let v of mesh.vertices) {
				let n = geometry.vertexNormalSphereInscribed(v);
				if (n.isValid()) {
					if (sphereInscribedNormals_sol[v.index].minus(n).norm() > 1e-5) {
						success = false;
						break;
					}

				} else {
					success = false;
				}
			}

			chai.assert.strictEqual(success, true);
		});
	});

	describe("vertexNormalAreaWeighted", function() {
		it("computes the normal at a vertex using the 'face area weights' method", function() {
			let success = true;
			for (let v of mesh.vertices) {
				let n = geometry.vertexNormalAreaWeighted(v);
				if (n.isValid()) {
					if (areaWeightedNormals_sol[v.index].minus(n).norm() > 1e-5) {
						success = false;
						break;
					}

				} else {
					success = false;
				}
			}

			chai.assert.strictEqual(success, true);
		});
	});

	describe("vertexNormalGaussCurvature", function() {
		it("computes the normal at a vertex using the 'gauss curvature' method", function() {
			let success = true;
			for (let v of mesh.vertices) {
				let n = geometry.vertexNormalGaussCurvature(v);
				if (n.isValid()) {
					if (gaussCurvatureNormals_sol[v.index].minus(n).norm() > 1e-5 &&
						gaussCurvatureNormals_sol[v.index].minus(n.negated()).norm() > 1e-5) {
						success = false;
						break;
					}

				} else {
					success = false;
				}
			}

			chai.assert.strictEqual(success, true);
		});
	});

	describe("vertexNormalMeanCurvature", function() {
		it("computes the normal at a vertex using the 'mean curvature' method", function() {
			let success = true;
			for (let v of mesh.vertices) {
				let n = geometry.vertexNormalMeanCurvature(v);
				if (n.isValid()) {
					let n = geometry.vertexNormalMeanCurvature(v);
					if (meanCurvatureNormals_sol[v.index].minus(n).norm() > 1e-5 &&
						meanCurvatureNormals_sol[v.index].minus(n.negated()).norm() > 1e-5) {
						success = false;
						break;
					}

				} else {
					success = false;
				}
			}

			chai.assert.strictEqual(success, true);
		});
	});

	describe("scalarGaussCurvature", function() {
		it("computes the angle defect at a vertex", function() {
			let success = true;
			for (let v of mesh.vertices) {
				if (Math.abs(scalarGaussCurvatures_sol[v.index] - geometry.scalarGaussCurvature(v)) > 1e-5) {
					success = false;
					break;
				}
			}

			chai.assert.strictEqual(success, true);
		});
	});

	describe("scalarMeanCurvature", function() {
		it("computes the scalar mean curvature at a vertex", function() {
			let success = true;
			for (let v of mesh.vertices) {
				if (Math.abs(scalarMeanCurvatures_sol[v.index] - geometry.scalarMeanCurvature(v)) > 1e-5) {
					success = false;
					break;
				}
			}

			chai.assert.strictEqual(success, true);
		});
	});

	describe("principalCurvatures", function() {
		it("computes the (pointwise) minimum and maximum principal curvature values at a vertex", function() {
			let success = true;
			for (let v of mesh.vertices) {
				let [k1, k2] = geometry.principalCurvatures(v);

				// Hot fix: some values of k1 and k2 are incorrectly swapped in solution.js
				if (Math.abs(k1) > Math.abs(k2)) k1 = [k2, k2 = k1][0];

				if (Math.abs(minPrincipalCurvatures_sol[v.index] - k1) > 1e-5 ||
					Math.abs(maxPrincipalCurvatures_sol[v.index] - k2) > 1e-5) {
					success = false;
					break;
				}
			}

			chai.assert.strictEqual(success, true);
		});
	});

	describe("totalAngleDefect", function() {
		it("computes the total angle defect", function() {
			chai.assert.strictEqual(Math.abs(totalAngleDefect_sol - geometry.totalAngleDefect()) < 1e-5, true);
		});
	});

	describe("laplaceMatrix", function() {
		it("builds a sparse laplace matrix", function() {
			let loadLaplaceMatrix = function() {
				let T = new Triplet(V, V);

				let lines = solution.split("\n");
				for (let line of lines) {
					line = line.trim();
					let tokens = line.split(" ");
					let identifier = tokens[0].trim();

					if (identifier === "T") {
						T.addEntry(parseFloat(tokens[1]), parseInt(tokens[2]), parseInt(tokens[3]));
					}
				}

				return SparseMatrix.fromTriplet(T);
			}

			let laplaceMatrix_sol = loadLaplaceMatrix();
			let vertexIndex = indexElements(mesh.vertices);
			let laplaceMatrix = geometry.laplaceMatrix(vertexIndex);

			chai.assert.strictEqual(laplaceMatrix_sol.minus(laplaceMatrix).frobeniusNorm() < 1e-5, true);
			memoryManager.deleteExcept([]);
		});
	});

	describe("massMatrix", function() {
		it("builds a sparse diagonal mass matrix", function() {
			let loadMassMatrix = function() {
				let mass = [];

				let lines = solution.split("\n");
				for (let line of lines) {
					line = line.trim();
					let tokens = line.split(" ");
					let identifier = tokens[0].trim();

					if (identifier === "mass") {
						mass.push(parseFloat(tokens[1]));
					}
				}

				return mass;
			}

			let success = true;
			let mass_sol = loadMassMatrix();
			let vertexIndex = indexElements(mesh.vertices);
			let massMatrix = geometry.massMatrix(vertexIndex);
			massMatrix = massMatrix.timesDense(DenseMatrix.ones(V, 1));

			for (let v of mesh.vertices) {
				let i = vertexIndex[v];

				if (Math.abs(massMatrix.get(i, 0) - mass_sol[i]) > 1e-5) {
					success = false;
					break;
				}
			}

			chai.assert.strictEqual(success, true);
			memoryManager.deleteExcept([]);
		});
	});
});
