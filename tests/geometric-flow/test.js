"use strict";

describe("MeanCurvatureFlow", function() {
	let steps, h;

	describe("integrate", function() {
		it("performs mean curvature flow with a fixed timestep", function() {
			let loadTimestepAndMCFSolution = function() {
				let steps = -1;
				let h = -1;
				let positions = [];

				let lines = solution.split("\n");
				for (let line of lines) {
					line = line.trim();
					let tokens = line.split(" ");
					let identifier = tokens[0].trim();

					if (identifier === "steps") {
						steps = parseInt(tokens[1]);

					} else if (identifier === "h") {
						h = parseFloat(tokens[1]);

					} else if (identifier === "mcf") {
						positions.push(new Vector(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])));
					}
				}

				return [steps, h, positions];
			}

			let polygonSoup = MeshIO.readOBJ(solution);
			let mesh = new Mesh();
			mesh.build(polygonSoup);
			let geometry = new Geometry(mesh, polygonSoup["v"], false);

			let data = loadTimestepAndMCFSolution();
			steps = data[0];
			h = data[1];
			let positions = data[2];

			let meanCurvatureFlow = new MeanCurvatureFlow(geometry);
			for (let i = 0; i < steps; i++) meanCurvatureFlow.integrate(h);

			let success = true;
			for (let i = 0; i < positions.length; i++) {
				if (!geometry.positions[i].isValid() || geometry.positions[i].minus(positions[i]).norm() > 1e-6) {
					success = false;
					break;
				}
			}

			chai.assert.strictEqual(success, true);
			memoryManager.deleteExcept([]);
		});
	});

	describe("integrate", function() {
		it("performs modified mean curvature flow with a fixed timestep", function() {
			let loadMMCFSolution = function() {
				let positions = [];

				let lines = solution.split("\n");
				for (let line of lines) {
					line = line.trim();
					let tokens = line.split(" ");
					let identifier = tokens[0].trim();

					if (identifier === "mmcf") {
						positions.push(new Vector(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])));
					}
				}

				return positions;
			}

			let polygonSoup = MeshIO.readOBJ(solution);
			let mesh = new Mesh();
			mesh.build(polygonSoup);
			let geometry = new Geometry(mesh, polygonSoup["v"], false);
			let positions = loadMMCFSolution();

			let modifiedMeanCurvatureFlow = new ModifiedMeanCurvatureFlow(geometry);
			for (let i = 0; i < steps; i++) modifiedMeanCurvatureFlow.integrate(h);

			let success = true;
			for (let i = 0; i < positions.length; i++) {
				if (!geometry.positions[i].isValid() || geometry.positions[i].minus(positions[i]).norm() > 1e-6) {
					success = false;
					break;
				}
			}

			chai.assert.strictEqual(success, true);
			memoryManager.deleteExcept([]);
		});
	});
});
