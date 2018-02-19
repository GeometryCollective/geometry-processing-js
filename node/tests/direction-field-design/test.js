let chai = require('chai');
let solution = require('../../../tests/direction-field-design/solution.js');
let LinearAlgebra = require('../../linear-algebra/linear-algebra.js');
let memoryManager = LinearAlgebra.memoryManager;
let DenseMatrix = LinearAlgebra.DenseMatrix;
let MeshIO = require('../../utils/meshio.js');
let Mesh = require('../../core/mesh.js')[0];
let Geometry = require('../../core/geometry.js')[0];
let TrivialConnections = require('../../projects/direction-field-design/trivial-connections.js');

describe("TrivialConnections", function() {
	let polygonSoup = MeshIO.readOBJ(solution);
	let mesh = new Mesh();
	mesh.build(polygonSoup);
	let geometry = new Geometry(mesh, polygonSoup["v"], false);
	let E = mesh.edges.length;
	let trivialConnections, singularity, deltaBeta, gamma;

	describe("computeCoExactComponent", function() {
		it("computes the dual 0-form potential", function() {
			let loadSingularitiesAndCoExactComponent = function() {
				let singularity = {};
				let deltaBeta = DenseMatrix.zeros(E, 1);

				let v = 0;
				let e = 0;
				let lines = solution.split("\n");
				for (let line of lines) {
					line = line.trim();
					let tokens = line.split(" ");
					let identifier = tokens[0].trim();

					if (identifier === "singularity") {
						singularity[v] = parseFloat(tokens[1]);
						v++;

					} else if (identifier === "deltaBeta") {
						deltaBeta.set(parseFloat(tokens[1]), e, 0);
						e++;
					}
				}

				return [singularity, deltaBeta];
			}

			let [singularity, deltaBeta_sol] = loadSingularitiesAndCoExactComponent();
			trivialConnections = new TrivialConnections(geometry);
			deltaBeta = trivialConnections.computeCoExactComponent(singularity);

			chai.assert.strictEqual(deltaBeta.minus(deltaBeta_sol).norm() < 1e-6, true);
			let exceptList = [trivialConnections.P, trivialConnections.A,
				trivialConnections.hodge1, trivialConnections.d0, deltaBeta
			];
			exceptList = exceptList.concat(trivialConnections.bases);
			memoryManager.deleteExcept(exceptList);
		});
	});

	describe("computeHarmonicComponent", function() {
		it("computes the harmonic component", function() {
			let loadHarmonicComponent = function() {
				let gamma = DenseMatrix.zeros(E, 1);

				let e = 0;
				let lines = solution.split("\n");
				for (let line of lines) {
					line = line.trim();
					let tokens = line.split(" ");
					let identifier = tokens[0].trim();

					if (identifier === "gamma") {
						gamma.set(parseFloat(tokens[1]), e, 0);
						e++;
					}
				}

				return gamma;
			}

			let gamma_sol = loadHarmonicComponent();
			gamma = trivialConnections.computeHarmonicComponent(deltaBeta);

			chai.assert.strictEqual(gamma.minus(gamma_sol).norm() < 1e-6, true);
			memoryManager.deleteExcept([deltaBeta, gamma]);
		});
	});

	describe("computeConnections", function() {
		it("computes the dual 1-form connections", function() {
			let loadConnections = function() {
				let phi = DenseMatrix.zeros(E, 1);

				let e = 0;
				let lines = solution.split("\n");
				for (let line of lines) {
					line = line.trim();
					let tokens = line.split(" ");
					let identifier = tokens[0].trim();

					if (identifier === "phi") {
						phi.set(parseFloat(tokens[1]), e, 0);
						e++;
					}
				}

				return phi;
			}

			let phi_sol = loadConnections();
			let phi = deltaBeta.plus(gamma);

			chai.assert.strictEqual(phi.minus(phi_sol).norm() < 1e-6, true);
			memoryManager.deleteExcept([]);
		});
	});
});