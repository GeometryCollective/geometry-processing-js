"use strict";

describe("DEC", function() {
	let polygonSoup = MeshIO.readOBJ(solution);
	let mesh = new Mesh();
	mesh.build(polygonSoup);
	let geometry = new Geometry(mesh, polygonSoup["v"], false);
	let V = mesh.vertices.length;
	let E = mesh.edges.length;
	let F = mesh.faces.length;
	let vertexIndex = indexElements(geometry.mesh.vertices);
	let edgeIndex = indexElements(geometry.mesh.edges);
	let faceIndex = indexElements(geometry.mesh.faces);
	let d0, d1;

	describe("buildHodgeStar0Form", function() {
		it("builds the Hodge operator on 0-forms", function() {
			let loadHodge0 = function() {
				let hodge0 = DenseMatrix.zeros(V, 1);

				let v = 0;
				let lines = solution.split("\n");
				for (let line of lines) {
					line = line.trim();
					let tokens = line.split(" ");
					let identifier = tokens[0].trim();

					if (identifier === "hodge0") {
						hodge0.set(parseFloat(tokens[1]), v, 0);
						v++;
					}
				}

				return hodge0;
			}

			let hodge0_sol = loadHodge0();
			let hodge0 = DEC.buildHodgeStar0Form(geometry, vertexIndex);
			hodge0 = hodge0.timesDense(DenseMatrix.ones(V, 1));

			chai.assert.strictEqual(hodge0.minus(hodge0_sol).norm() < 1e-6, true);
			memoryManager.deleteExcept([]);
		});
	});

	describe("buildHodgeStar1Form", function() {
		it("builds the Hodge operator on 1-forms", function() {
			let loadHodge1 = function() {
				let hodge1 = DenseMatrix.zeros(E, 1);

				let e = 0;
				let lines = solution.split("\n");
				for (let line of lines) {
					line = line.trim();
					let tokens = line.split(" ");
					let identifier = tokens[0].trim();

					if (identifier === "hodge1") {
						hodge1.set(parseFloat(tokens[1]), e, 0);
						e++;
					}
				}

				return hodge1;
			}

			let hodge1_sol = loadHodge1();
			let hodge1 = DEC.buildHodgeStar1Form(geometry, edgeIndex);
			hodge1 = hodge1.timesDense(DenseMatrix.ones(E, 1));

			chai.assert.strictEqual(hodge1.minus(hodge1_sol).norm() < 1e-6, true);
			memoryManager.deleteExcept([]);
		});
	});

	describe("buildHodgeStar2Form", function() {
		it("builds the Hodge operator on 2-forms", function() {
			let loadHodge2 = function() {
				let hodge2 = DenseMatrix.zeros(F, 1);

				let f = 0;
				let lines = solution.split("\n");
				for (let line of lines) {
					line = line.trim();
					let tokens = line.split(" ");
					let identifier = tokens[0].trim();

					if (identifier === "hodge2") {
						hodge2.set(parseFloat(tokens[1]), f, 0);
						f++;
					}
				}

				return hodge2;
			}

			let hodge2_sol = loadHodge2();
			let hodge2 = DEC.buildHodgeStar2Form(geometry, faceIndex);
			hodge2 = hodge2.timesDense(DenseMatrix.ones(F, 1));

			chai.assert.strictEqual(hodge2.minus(hodge2_sol).norm() < 1e-3, true);
			memoryManager.deleteExcept([]);
		});
	});

	describe("buildExteriorDerivative0Form", function() {
		it("builds the exterior derivative on 0-forms", function() {
			let loadForms = function() {
				let phi = DenseMatrix.zeros(V, 1);
				let dPhi = DenseMatrix.zeros(E, 1);

				let v = 0;
				let e = 0;
				let lines = solution.split("\n");
				for (let line of lines) {
					line = line.trim();
					let tokens = line.split(" ");
					let identifier = tokens[0].trim();

					if (identifier === "phi") {
						phi.set(parseFloat(tokens[1]), v, 0);
						v++;

					} else if (identifier === "dPhi") {
						dPhi.set(parseFloat(tokens[1]), e, 0);
						e++;
					}
				}

				return [phi, dPhi];
			}

			let forms = loadForms();
			let phi = forms[0];
			let dPhi_sol = forms[1];

			d0 = DEC.buildExteriorDerivative0Form(geometry, edgeIndex, vertexIndex);
			let dPhi = d0.timesDense(phi);

			chai.assert.strictEqual(dPhi.minus(dPhi_sol).norm() < 1e-6 ||
				dPhi.minus(dPhi_sol.negated()).norm() < 1e-6, true);
			memoryManager.deleteExcept([d0]);
		});
	});

	describe("buildExteriorDerivative1Form", function() {
		it("builds the exterior derivative on 1-forms - Assumes all edges have the same orientation as their halfedge or halfedge's twin", function() {
			let loadForms = function() {
				let omega = DenseMatrix.zeros(E, 1);
				let dOmega = DenseMatrix.zeros(F, 1);

				let e = 0;
				let f = 0;
				let lines = solution.split("\n");
				for (let line of lines) {
					line = line.trim();
					let tokens = line.split(" ");
					let identifier = tokens[0].trim();

					if (identifier === "omega") {
						omega.set(parseFloat(tokens[1]), e, 0);
						e++;

					} else if (identifier === "dOmega") {
						dOmega.set(parseFloat(tokens[1]), f, 0);
						f++;
					}
				}

				return [omega, dOmega];
			}

			let forms = loadForms();
			let omega = forms[0];
			let dOmega_sol = forms[1];

			d1 = DEC.buildExteriorDerivative1Form(geometry, faceIndex, edgeIndex);
			let dOmega = d1.timesDense(omega);

			chai.assert.strictEqual(dOmega.minus(dOmega_sol).norm() < 1e-6 ||
				dOmega.minus(dOmega_sol.negated()).norm() < 1e-6, true);
			memoryManager.deleteExcept([d0, d1]);
		});
	});

	describe("d1.d0 = 0", function() {
		it("The discrete exterior applied twice equals 0", function() {
			let d0d1 = d1.timesSparse(d0);

			chai.assert.strictEqual(d0d1.frobeniusNorm() < 1e-6, true);
			memoryManager.deleteExcept([]);
		});
	});
});
