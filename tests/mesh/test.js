"use strict";

let input = document.getElementById("fileInput");
input.addEventListener("change", function(e) {
	let file = input.files[0];

	if (file.name.endsWith(".obj")) {
		let reader = new FileReader();

		reader.onload = function(e) {
			setupTests(reader.result);
			mocha.run();

			// NOTE: Disabling and hiding input tag because mocha does not
			// allow reruns. Reload page to run tests with different file.
			input.disabled = true;
			input.hidden = true;
		}

		reader.onerror = function(e) {
			alert("Unable to load OBJ file");
		}

		reader.readAsText(file);

	} else {
		alert("Please load an OBJ file");
	}
});

function setupTests(text) {
	let polygonSoup = undefined;
	describe("MeshIO.readOBJ", function() {
		polygonSoup = MeshIO.readOBJ(text);
		it("loads a polygon soup", function() {
			chai.assert.notStrictEqual(polygonSoup, undefined);
		});
	});

	let mesh = new Mesh();
	describe("Mesh.build", function() {
		let success = mesh.build(polygonSoup);
		it("builds a halfedge mesh", function() {
			chai.assert.strictEqual(success, true);
		});
	});

	describe("Mesh.connectivity", function() {
		let success = true;
		vertexOuter: for (let v of mesh.vertices) {
			// vertex vertex iterator
			let h = v.halfedge;
			for (let vv of v.adjacentVertices()) {
				if (h.twin.vertex !== vv) {
					success = false;
					break vertexOuter;
				}
				h = h.twin.next;
			}

			// vertex edge iterator
			h = v.halfedge;
			for (let e of v.adjacentEdges()) {
				if (h.edge !== e) {
					success = false;
					break vertexOuter;
				}
				h = h.twin.next;
			}

			// vertex face iterator
			h = v.halfedge;
			for (let f of v.adjacentFaces()) {
				while (h.onBoundary) {
					h = h.twin.next;
				}
				if (h.face !== f) {
					success = false;
					break vertexOuter;
				}
				h = h.twin.next;
			}

			// vertex halfegde iterator
			h = v.halfedge;
			for (let hh of v.adjacentHalfedges()) {
				if (h !== hh) {
					success = false;
					break vertexOuter;
				}
				h = h.twin.next;
			}

			// vertex corner iterator
			h = v.halfedge;
			for (let c of v.adjacentCorners()) {
				while (h.onBoundary) {
					h = h.twin.next;
				}
				if (h.next.corner !== c) {
					success = false;
					break vertexOuter;
				}
				h = h.twin.next;
			}
		}

		it("is consistent for vertices", function() {
			chai.assert.strictEqual(success, true);
		});

		success = true;
		edgeOuter: for (let e of mesh.edges) {
			if (e.halfedge.edge !== e) {
				success = false;
				break edgeOuter;
			}
		}

		it("is consistent for edges", function() {
			chai.assert.strictEqual(success, true);
		});

		success = true;
		faceOuter: for (let f of mesh.faces) {
			// face vertex iterator
			let h = f.halfedge;
			let p = f.halfedge;
			for (let v of f.adjacentVertices()) {
				if (h.vertex !== v) {
					success = false;
					break faceOuter;
				}
				h = h.next;
				p = p.prev;
			}

			if (p !== h) {
				success = false;
				break faceOuter;
			}

			// face edge iterator
			h = f.halfedge;
			for (let e of f.adjacentEdges()) {
				if (h.edge !== e) {
					success = false;
					break faceOuter;
				}
				h = h.next;
			}

			// face face iterator
			h = f.halfedge;
			for (let ff of f.adjacentFaces()) {
				while (h.twin.onBoundary) {
					h = h.next;
				}
				if (h.twin.face !== ff) {
					success = false;
					break faceOuter;
				}
				h = h.next;
			}

			// face halfegde iterator
			h = f.halfedge;
			for (let hh of f.adjacentHalfedges()) {
				if (h !== hh) {
					success = false;
					break faceOuter;
				}
				h = h.next;
			}

			// face corner iterator
			h = f.halfedge;
			for (let c of f.adjacentCorners()) {
				if (h.next.corner !== c) {
					success = false;
					break faceOuter;
				}
				h = h.next;
			}
		}

		it("is consistent for faces", function() {
			chai.assert.strictEqual(success, true);
		});

		success = true;
		cornerOuter: for (let c of mesh.corners) {
			if (c.halfedge.corner !== c) {
				success = false;
				break cornerOuter;
			}
		}

		it("is consistent for corners", function() {
			chai.assert.strictEqual(success, true);
		});

		success = true;
		boundaryOuter: for (let b of mesh.boundaries) {
			let h = b.halfedge;
			let p = b.halfedge;
			for (let hh of b.adjacentHalfedges()) {
				if (h !== hh) {
					success = false;
					break boundaryOuter;
				}
				h = h.next;
				p = p.prev;
			}

			if (p !== h) {
				success = false;
				break boundaryOuter;
			}
		}

		it("is consistent for boundary", function() {
			chai.assert.strictEqual(success, true);
		});
	});
}
