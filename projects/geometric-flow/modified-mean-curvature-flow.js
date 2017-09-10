"use strict";

class ModifiedMeanCurvatureFlow extends MeanCurvatureFlow {
	/**
	 * This class performs a {@link http://www.cs.jhu.edu/~misha/MyPapers/SGP12.pdf modified version} of {@link https://www.cs.cmu.edu/~kmcrane/Projects/DDG/paper.pdf mean curvature flow} on a surface mesh.
	 * @constructor module:Projects.ModifiedMeanCurvatureFlow
	 * @augments module:Projects.MeanCurvatureFlow
	 * @param {module:Core.Geometry} geometry The input geometry of the mesh this class acts on.
	 * @property {module:LinearAlgebra.SparseMatrix} A The laplace matrix of the input mesh.
	 */
	constructor(geometry) {
		super(geometry);
		this.A = geometry.laplaceMatrix(this.vertexIndex);
	}

	/**
	 * @inheritdoc
	 */
	buildFlowOperator(M, h) {
		// F = M + hA
		return M.plus(this.A.timesReal(h));
	}
}
