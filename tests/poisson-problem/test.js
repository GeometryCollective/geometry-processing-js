"use strict";

describe("ScalarPoissonProblem", function() {
	let polygonSoup = MeshIO.readOBJ(solution);
	let mesh = new Mesh();
	mesh.build(polygonSoup);
	let V = polygonSoup["v"].length;
	let geometry = new Geometry(mesh, polygonSoup["v"], false);

	describe("solve", function() {
		it("computes the solution of a scalar poisson problem", function() {
			let loadDensitiesAndSolution = function() {
				let rho = DenseMatrix.zeros(V, 1);
				let phi = DenseMatrix.zeros(V, 1);

				let v = 0;
				let lines = solution.split("\n");
				for (let line of lines) {
					line = line.trim();
					let tokens = line.split(" ");
					let identifier = tokens[0].trim();

					if (identifier === "rho") {
						rho.set(parseFloat(tokens[1]), v, 0);

					} else if (identifier === "phi") {
						phi.set(parseFloat(tokens[1]), v, 0);
						v++;
					}
				}

				return [rho, phi];
			}

			let [rho, phi_sol] = loadDensitiesAndSolution();
			let scalarPoissonProblem = new ScalarPoissonProblem(geometry);
			let phi = scalarPoissonProblem.solve(rho);

			chai.assert.strictEqual(phi.minus(phi_sol).norm() < 1e-6, true);
			memoryManager.deleteExcept([]);
		});
	});
});
