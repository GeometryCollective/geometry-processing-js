"use strict";

describe("SpectralConformalParameterization", function() {
	let polygonSoup = MeshIO.readOBJ(solution);
	let mesh = new Mesh();
	mesh.build(polygonSoup);
	let V = polygonSoup["v"].length;
	let geometry = new Geometry(mesh, polygonSoup["v"], false);
	let spectralConformalParameterization = new SpectralConformalParameterization(geometry);

	describe("buildConformalEnergy", function() {
		it("builds the complex conformal energy matrix EC = ED - A", function() {
			let loadConformalEnergyMatrix = function() {
				let T = new ComplexTriplet(V, V);

				let lines = solution.split("\n");
				for (let line of lines) {
					line = line.trim();
					let tokens = line.split(" ");
					let identifier = tokens[0].trim();

					if (identifier === "T") {
						T.addEntry(new Complex(parseFloat(tokens[1]), parseFloat(tokens[2])),
							parseInt(tokens[3]), parseInt(tokens[4]));
					}
				}

				return ComplexSparseMatrix.fromTriplet(T);
			}

			let EC_sol = loadConformalEnergyMatrix();
			let EC = spectralConformalParameterization.buildConformalEnergy();

			chai.assert.strictEqual(EC_sol.minus(EC).frobeniusNorm() < 1e-6, true);
			memoryManager.deleteExcept([]);
		});
	});

	describe("flatten", function() {
		it("flattens the input surface mesh with 1 or more boundaries conformally", function() {
			let loadFlattening = function() {
				let flattening = {};

				let v = 0;
				let lines = solution.split("\n");
				for (let line of lines) {
					line = line.trim();
					let tokens = line.split(" ");
					let identifier = tokens[0].trim();

					if (identifier === "uv") {
						flattening[v] = new Vector(parseFloat(tokens[1]), parseFloat(tokens[2]));
						v++;
					}
				}

				return flattening;
			}

			let success = true;
			let flattening_sol = loadFlattening();
			let flattening = spectralConformalParameterization.flatten();
			for (let v of mesh.vertices) {
				if (!flattening[v].isValid() || flattening_sol[v].minus(flattening[v]).norm() > 1e-6) {
					success = false;
					break;
				}
			}

			chai.assert.strictEqual(success, true);
			memoryManager.deleteExcept([]);
		});
	});
});
