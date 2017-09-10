"use strict";

describe("VectorFieldDecomposition", function() {
	let polygonSoup = MeshIO.readOBJ(solution);
	let mesh = new Mesh();
	mesh.build(polygonSoup);
	let E = mesh.edges.length;
	let geometry = new Geometry(mesh, polygonSoup["v"], false);
	let hodgeDecomposition, omega, dAlpha, deltaBeta;

	describe("HodgeDecomposition: computeExactComponent", function() {
		it("computes the exact component of a 1-form", function() {
			let loadOmegaAndExactComponent = function() {
				let omega = DenseMatrix.zeros(E, 1);
				let dAlpha = DenseMatrix.zeros(E, 1);

				let e = 0;
				let lines = solution.split("\n");
				for (let line of lines) {
					line = line.trim();
					let tokens = line.split(" ");
					let identifier = tokens[0].trim();

					if (identifier === "omega") {
						omega.set(parseFloat(tokens[1]), e, 0);

					} else if (identifier === "dAlpha") {
						dAlpha.set(parseFloat(tokens[1]), e, 0);
						e++;
					}
				}

				return [omega, dAlpha];
			}

			let oneForms = loadOmegaAndExactComponent();
			omega = oneForms[0];
			let dAlpha_sol = oneForms[1];
			hodgeDecomposition = new HodgeDecomposition(geometry);
			dAlpha = hodgeDecomposition.computeExactComponent(omega);

			chai.assert.strictEqual(dAlpha.minus(dAlpha_sol).norm() < 1e-6, true);
			memoryManager.deleteExcept([omega, dAlpha, hodgeDecomposition.d1,
				hodgeDecomposition.hodge1Inv, hodgeDecomposition.d1T, hodgeDecomposition.B
			]);
		});
	});

	describe("HodgeDecomposition: computeCoExactComponent", function() {
		it("computes the coexact component of a 1-form", function() {
			let loadCoExactComponent = function() {
				let deltaBeta = DenseMatrix.zeros(E, 1);

				let e = 0;
				let lines = solution.split("\n");
				for (let line of lines) {
					line = line.trim();
					let tokens = line.split(" ");
					let identifier = tokens[0].trim();

					if (identifier === "deltaBeta") {
						deltaBeta.set(parseFloat(tokens[1]), e, 0);
						e++
					}
				}

				return deltaBeta;
			}

			let deltaBeta_sol = loadCoExactComponent();
			deltaBeta = hodgeDecomposition.computeCoExactComponent(omega);

			chai.assert.strictEqual(deltaBeta.minus(deltaBeta_sol).norm() < 1e-6, true);
			memoryManager.deleteExcept([omega, dAlpha, deltaBeta]);
		});
	});

	describe("HodgeDecomposition: computeHarmonicComponent", function() {
		it("computes the harmonic component of a 1-form", function() {
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
						e++
					}
				}

				return gamma;
			}

			let gamma_sol = loadHarmonicComponent();
			let gamma = hodgeDecomposition.computeHarmonicComponent(omega, dAlpha, deltaBeta);

			chai.assert.strictEqual(gamma.minus(gamma_sol).norm() < 1e-6, true);
			memoryManager.deleteExcept([]);
		});
	});

	describe("HarmonicBases: compute", function() {
		it("computes the harmonic component of a 1-form; this test checks whether the bases are linearly independent", function() {
			// build generators
			hodgeDecomposition = new HodgeDecomposition(geometry);
			let treeCotree = new TreeCotree(mesh);
			treeCotree.buildGenerators();

			// build harmonic bases
			let harmonicBases = new HarmonicBases(geometry);
			let bases = harmonicBases.compute(hodgeDecomposition);

			let N = bases.length;
			let rankMatrix = DenseMatrix.zeros(N, N);
			for (let i = 0; i < N; i++) {
				for (let j = 0; j < N; j++) {
					rankMatrix.set(bases[i].transpose().timesDense(bases[j]).get(0, 0), i, j);
				}
			}

			chai.assert.strictEqual(rankMatrix.rank() === N, true);
			memoryManager.deleteExcept([]);
		});
	});
});
