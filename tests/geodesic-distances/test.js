"use strict";

describe("GeodesicsInHeat", function() {
	let polygonSoup = MeshIO.readOBJ(solution);
	let mesh = new Mesh();
	mesh.build(polygonSoup);
	let V = polygonSoup["v"].length;
	let geometry = new Geometry(mesh, polygonSoup["v"], false);
	let geodesicsInHeat, delta, X, div;

	describe("computeVectorField", function() {
		it("computes the vector field", function() {
			let loadSourcesAndField = function() {
				let delta = DenseMatrix.zeros(V, 1);
				let X = {};

				let v = 0;
				let f = 0;
				let lines = solution.split("\n");
				for (let line of lines) {
					line = line.trim();
					let tokens = line.split(" ");
					let identifier = tokens[0].trim();

					if (identifier === "delta") {
						delta.set(parseFloat(tokens[1]), v, 0);
						v++;

					} else if (identifier === "X") {
						X[f] = new Vector(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]));
						f++;
					}
				}

				return [delta, X];
			}

			let [delta, X_sol] = loadSourcesAndField();
			geodesicsInHeat = new GeodesicsInHeat(geometry);
			let llt = geodesicsInHeat.F.chol();
			let u = llt.solvePositiveDefinite(delta);
			X = geodesicsInHeat.computeVectorField(u);

			let success = true;
			for (let f of mesh.faces) {
				if (!X[f].isValid() || X[f].minus(X_sol[f]).norm() > 1e-5) {
					success = false;
					break;
				}
			}

			chai.assert.strictEqual(success, true);
			memoryManager.deleteExcept([geodesicsInHeat.A]);
		});
	});

	describe("computeDivergence", function() {
		it("computes the integrated divergence", function() {
			let loadDivergence = function() {
				div = DenseMatrix.zeros(V, 1);

				let v = 0;
				let lines = solution.split("\n");
				for (let line of lines) {
					line = line.trim();
					let tokens = line.split(" ");
					let identifier = tokens[0].trim();

					if (identifier === "div") {
						div.set(parseFloat(tokens[1]), v, 0);
						v++
					}
				}

				return div;
			}

			let div_sol = loadDivergence();
			div = geodesicsInHeat.computeDivergence(X);

			chai.assert.strictEqual(div.minus(div_sol).norm() < 1e-5, true);
			memoryManager.deleteExcept([geodesicsInHeat.A, div]);
		});
	});

	describe("compute", function() {
		it("computes geodesic distances using the heat method", function() {
			let loadGeodesicDistances = function() {
				let phi = DenseMatrix.zeros(V, 1);

				let v = 0;
				let lines = solution.split("\n");
				for (let line of lines) {
					line = line.trim();
					let tokens = line.split(" ");
					let identifier = tokens[0].trim();

					if (identifier === "phi") {
						phi.set(parseFloat(tokens[1]), v, 0);
						v++
					}
				}

				return phi;
			}

			let phi_sol = loadGeodesicDistances();
			let llt = geodesicsInHeat.A.chol();
			let phi = llt.solvePositiveDefinite(div);
			geodesicsInHeat.subtractMinimumDistance(phi);

			chai.assert.strictEqual(phi.minus(phi_sol).norm() < 1e-5, true);
			memoryManager.deleteExcept([]);
		});
	});
});
