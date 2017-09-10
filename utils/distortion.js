"use strict"

/**
 * This class computes the quasi conformal error and area scaling resulting from
 * a parameterization algorithm.
 * @memberof module:Utils
 */
class Distortion {
	/**
	 * Computes the quasi conformal error on a face.
	 * @private
	 * @param {module:LinearAlgebra.Vector[]} p An array containing the position of each vertex in a face
	 * in the input mesh.
	 * @param {module:LinearAlgebra.Vector[]} q An array containing the position of each vertex in a face
	 * in the parameterized mesh.
	 * @returns {number}
	 */
	static computeQuasiConformalErrorPerFace(p, q) {
		// compute edge vectors
		let u1 = p[1].minus(p[0]);
		let u2 = p[2].minus(p[0]);

		let v1 = q[1].minus(q[0]);
		let v2 = q[2].minus(q[0]);

		// compute orthonormal bases
		let e1 = new Vector(u1.x, u1.y, u1.z);
		e1.normalize();
		let e2 = u2.minus(e1.times(u2.dot(e1)));
		e2.normalize();

		let f1 = new Vector(v1.x, v1.y, v1.z);
		f1.normalize();
		let f2 = v2.minus(f1.times(v2.dot(f1)));
		f2.normalize();

		// project onto bases
		p[0] = new Vector();
		p[1] = new Vector(u1.dot(e1), u1.dot(e2));
		p[2] = new Vector(u2.dot(e1), u2.dot(e2));

		q[0] = new Vector();
		q[1] = new Vector(v1.dot(f1), v1.dot(f2));
		q[2] = new Vector(v2.dot(f1), v2.dot(f2));

		let A = 2.0 * u1.cross(u2).norm();

		let Ss = new Vector();
		for (let i = 0; i < 3; i++) Ss.incrementBy(q[i].times(p[(i + 1) % 3].y - p[(i + 2) % 3].y));
		Ss.divideBy(A);

		let St = new Vector();
		for (let i = 0; i < 3; i++) St.incrementBy(q[i].times(p[(i + 2) % 3].x - p[(i + 1) % 3].x));
		St.divideBy(A);

		let a = Ss.dot(Ss);
		let b = Ss.dot(St);
		let c = St.dot(St);
		let det = Math.sqrt(Math.pow(a - c, 2) + 4.0 * b * b);
		let Gamma = Math.sqrt(0.5 * (a + c + det));
		let gamma = Math.sqrt(0.5 * (a + c - det));

		if (Gamma < gamma) Gamma = [gamma, gamma = Gamma][0];

		return Gamma / gamma;
	}

	/**
	 * Computes the average quasi conformal error resulting from a parameterization algorithm.
	 * Sets a color per face indicating the quasi conformal error.
	 * @param {module:LinearAlgebra.Vector[]} colors An array of colors per face indicating the quasi conformal error.
	 * @param {Object} parameterization A dictionary mapping each vertex to a vector of coordinates.
	 * @param {module:Core.Geometry} geometry The input geometry of the mesh which is parameterized.
	 * @returns {number}
	 */
	static computeQuasiConformalError(colors, parameterization, geometry) {
		// compute total error
		let totalArea = 0.0;
		let totalQcError = 0.0;
		let qcErrors = {};
		for (let f of geometry.mesh.faces) {
			let p = [];
			let q = [];
			for (let v of f.adjacentVertices()) {
				p.push(geometry.positions[v]);
				q.push(parameterization[v]);
			}

			let qcError = Distortion.computeQuasiConformalErrorPerFace(p, q);
			let area = geometry.area(f);
			totalArea += area;
			totalQcError += qcError * area;
			qcErrors[f] = Math.max(1.0, Math.min(1.5, qcError)); // clamp error between [1, 1.5] for viz
		}

		// compute averaged colors
		for (let v of geometry.mesh.vertices) {
			let i = v.index;

			let qcError = 0.0;
			for (let f of v.adjacentFaces()) qcError += qcErrors[f];
			qcError /= v.onBoundary() ? v.degree() - 1 : v.degree();

			let color = hsv((2.0 - 4.0 * (qcError - 1.0)) / 3.0, 0.7, 0.65);
			colors[3 * i + 0] = color.x;
			colors[3 * i + 1] = color.y;
			colors[3 * i + 2] = color.z;
		}

		return totalQcError / totalArea;
	}

	/**
	 * Computes the area scaling on a face.
	 * @private
	 * @param {module:LinearAlgebra.Vector[]} p An array containing the position of each vertex in a face
	 * in the input mesh.
	 * @param {module:LinearAlgebra.Vector[]} q An array containing the position of each vertex in a face
	 * in the parameterized mesh.
	 * @returns {number}
	 */
	static computeAreaScalingPerFace(p, q) {
		let u1 = p[1].minus(p[0]);
		let u2 = p[2].minus(p[0]);
		let Area = u1.cross(u2).norm();

		let v1 = q[1].minus(q[0]);
		let v2 = q[2].minus(q[0]);
		let area = v1.cross(v2).norm();

		return Math.log(area / Area);
	}

	/**
	 * Computes the average area scaling resulting from a parameterization algorithm.
	 * Sets a color per face indicating the area scaling.
	 * @param {module:LinearAlgebra.Vector[]} colors An array of colors per face indicating the area scaling.
	 * @param {Object} parameterization A dictionary mapping each vertex to a vector of coordinates.
	 * @param {module:Core.Geometry} geometry The input geometry of the mesh which is parameterized.
	 * @returns {number}
	 */
	static computeAreaScaling(colors, parameterization, geometry) {
		// compute total scaling
		let totalArea = 0.0;
		let totalScaling = 0.0;
		let maxScaling = 0.0;
		let scalings = {};
		for (let f of geometry.mesh.faces) {
			let p = [];
			let q = [];
			for (let v of f.adjacentVertices()) {
				p.push(geometry.positions[v]);
				q.push(parameterization[v]);
			}

			let scaling = Distortion.computeAreaScalingPerFace(p, q);
			let area = geometry.area(f);
			totalArea += area;
			totalScaling += scaling * area;
			maxScaling = Math.max(maxScaling, Math.abs(scaling));
			scalings[f] = scaling;
		}

		// compute averaged colors
		for (let v of geometry.mesh.vertices) {
			let i = v.index;

			let scaling = 0.0;
			for (let f of v.adjacentFaces()) scaling += scalings[f];
			scaling /= v.onBoundary() ? v.degree() - 1 : v.degree();

			let color = colormap(scaling, -maxScaling, maxScaling, seismic);
			colors[3 * i + 0] = color.x;
			colors[3 * i + 1] = color.y;
			colors[3 * i + 2] = color.z;
		}

		return totalScaling / totalArea;
	}
}

/**
 * Computes the hue, saturation, and value of the RGB color model.
 * @global
 * @function module:Utils.hsv
 * @param {number} h The hue of the RGB color model.
 * @param {number} s The saturation of the RGB color model.
 * @param {number} v The value of the RGB color model.
 * @returns {module:LinearAlgebra.Vector}
 */
function hsv(h, s, v) {
	let r = 0;
	let g = 0;
	let b = 0;

	if (s == 0) {
		r = v;
		g = v;
		b = v;

	} else {
		h = (h == 1 ? 0 : h) * 6;

		let i = Math.floor(h);

		let f = h - i;
		let p = v * (1 - s);
		let q = v * (1 - (s * f));
		let t = v * (1 - s * (1 - f));

		switch (i) {
			case 0:
				r = v;
				g = t;
				b = p;
				break;

			case 1:
				r = q;
				g = v;
				b = p;
				break;

			case 2:
				r = p;
				g = v;
				b = t;
				break;

			case 3:
				r = p;
				g = q;
				b = v;
				break;

			case 4:
				r = t;
				g = p;
				b = v;
				break;

			case 5:
				r = v;
				g = p;
				b = q;
				break;

			default:
				break;
		}
	}

	return new Vector(r, g, b);
}
