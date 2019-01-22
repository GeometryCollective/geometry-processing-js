if (!Detector.webgl) Detector.addGetWebGLMessage();

let input = document.getElementById("fileInput");
let renderer = undefined;
let camera = undefined;
let controls = undefined;
let shiftClick = false;
let scene = undefined;
let threeMesh = undefined;
let threeGeometry = undefined;
let wireframe = undefined;
let pickRenderer = undefined;
let pickScene = undefined;
let threePickMesh = undefined;
let materialSettings = {
        vertexColors: THREE.VertexColors,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
        side: THREE.DoubleSide,
        flatShading: true,
        specular: new THREE.Color(0.0, 0.0, 0.0),
};

let positions = undefined;
let uvs = undefined;
let normals = undefined;
let colors = undefined;
let indices = undefined;

let memoryManager = new EmscriptenMemoryManager();
let mesh = undefined;
let geometry = undefined;
let lengthScale = undefined;

let selectedSimplices = undefined;
let vertexMeshMap = new Map();
let edgeMeshMap   = new Map();
let faceMeshMap   = new Map();
let vertexIndexMap = new Map();
let edgeIndexMap   = new Map();
let faceIndexMap   = new Map();
let simplicialComplexOperators = undefined;

let filename = "small_disk.obj";

const plainColor    = new THREE.Color(0.64, 0.64, 0.81);
const selectedColor = new THREE.Color(1.0, 0.5, 0.0);

let ops = null;
let guiFields = {
        "Load Mesh": function() {
                input.click();
        },
        "Export Mesh": function() {
                exportFile(MeshIO.writeOBJ({
                        "v": positions,
                        "vt": uvs,
                        "vn": normals,
                        "f": indices
                }));
        },
        "Reset": function() {
                selectedSimplices.reset();
                displayMeshSubset();
                setDisabledButtons();
        },
        "isComplex": function() {
                console.log(simplicialComplexOperators.isComplex(selectedSimplices));
        },
        "isPureComplex": function() {
                console.log(simplicialComplexOperators.isPureComplex(selectedSimplices));
        },
        "Boundary": function() {
                if (simplicialComplexOperators.isPureComplex(selectedSimplices) >= 0) {
                        selectedSimplices = simplicialComplexOperators.boundary(selectedSimplices);
                        displayMeshSubset();
                }
                setDisabledButtons();
        },
        "Star": function() {
                selectedSimplices = simplicialComplexOperators.star(selectedSimplices);
                displayMeshSubset();
                setDisabledButtons();
        },
        "Closure": function() {
                selectedSimplices = simplicialComplexOperators.closure(selectedSimplices);
                displayMeshSubset();
                setDisabledButtons();
        },
        "Link": function() {
                selectedSimplices = simplicialComplexOperators.link(selectedSimplices);
                displayMeshSubset();
                setDisabledButtons();
        }
};

function setDisabledButtons() {
        if (simplicialComplexOperators.isPureComplex(selectedSimplices) >= 0) {
                getController("Boundary").domElement.parentNode.removeAttribute("disabled");
        } else {
                getController("Boundary").domElement.parentNode.setAttribute("disabled", "");
        }
}

function getController(name) {
        for (let c of ops.__controllers) {
                if (c.object == guiFields && c.property == name) {
                        return c;
                }
        }
        return null;
}


init();
animate();

function init() {
        let container = document.createElement("div");
        document.body.appendChild(container);

        initRenderer(container);
        initGUI();
        initCamera();
        initScene();
        initLights();
        initMesh(small_disk);
        initControls();
        addEventListeners();
}

function initRenderer(container) {
        renderer = new THREE.WebGLRenderer({
                antialias: true
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0xffffff, 1.0);
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);

        pickRenderer = new THREE.WebGLRenderer({
                antialias: false // turn antialiasing off for color based picking
        });
        pickRenderer.setPixelRatio(window.devicePixelRatio);
        pickRenderer.setClearColor(0xffffff, 1.0);
        pickRenderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(pickRenderer.domElement);
}

function initGUI() {
        let gui = new dat.GUI();

        let io = gui.addFolder("IO");
        io.add(guiFields, "Load Mesh");
        io.add(guiFields, "Export Mesh");
        io.open();

        gui.add(guiFields, "Reset");

        ops = gui.addFolder("Operations");
        ops.add(guiFields, "isComplex");
        ops.add(guiFields, "isPureComplex");
        ops.add(guiFields, "Boundary");
        ops.add(guiFields, "Star");
        ops.add(guiFields, "Closure");
        ops.add(guiFields, "Link");
        ops.open();
}

window.onload = function() {
        input.addEventListener("change", function(e) {
                let file = input.files[0];
                filename = file.name;

                if (filename.endsWith(".obj")) {
                        let reader = new FileReader();
                        reader.onload = function(e) {
                                initMesh(reader.result);
                        }

                        reader.onerror = function(e) {
                                alert("Unable to load OBJ file");
                        }

                        reader.readAsText(file);

                } else {
                        alert("Please load an OBJ file");
                }
        });
}

function exportFile(text) {
        let element = document.createElement("a");
        element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
        element.setAttribute("download", filename);

        element.style.display = "none";
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
}

function toggleSimplex(type, id) {
        if (!shiftClick) {
            if (type == "v") {
                initVertexMesh(id);
                selectedSimplices.addVertex(mesh.vertices[id].index);
            } else if (type == "e") {
                initEdgeMesh(id);
                selectedSimplices.addEdge(mesh.edges[id].index);
            } else if (type == "f") {
                initFaceMesh(id);
                selectedSimplices.addFace(mesh.faces[id].index);
            }
        } else {
            if (type == "v") {
                deleteVertexMesh(id);
                selectedSimplices.deleteVertex(mesh.vertices[id].index);
            } else if (type == "e") {
                deleteEdgeMesh(id);
                selectedSimplices.deleteEdge(mesh.edges[id].index);
            } else if (type == "f") {
                deleteFaceMesh(id);
                selectedSimplices.deleteFace(mesh.faces[id].index);
            }

        }
}

function toggleWireframe(checked) {
        showWireframe = checked;
        if (showWireframe) threeMesh.add(wireframe);
        else threeMesh.remove(wireframe);
}

function initCamera() {
        const fov = 45.0;
        const aspect = window.innerWidth / window.innerHeight;
        const near = 0.1;
        const far = 1000;
        const eyeZ = 3.5;

        camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        camera.position.z = eyeZ;
}

function initScene() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff);

        pickScene = new THREE.Scene();
        pickScene.background = new THREE.Color(0xffffff);
}

function initLights() {
        let ambient = new THREE.AmbientLight(0xffffff, 0.35);
        camera.add(ambient);

        let point = new THREE.PointLight(0xffffff);
        point.position.set(2, 20, 15);
        camera.add(point);

        scene.add(camera);
}

function initMesh(text) {
        let polygonSoup = MeshIO.readOBJ(text);
        mesh = new Mesh();
        if (mesh.build(polygonSoup)) {
                // remove any previously loaded mesh from scene
                scene.remove(threeMesh);
                pickScene.remove(threePickMesh);
                memoryManager.deleteExcept([]);

                // create geometry object
                geometry = new Geometry(mesh, polygonSoup["v"]);
                lengthScale = geometry.meanEdgeLength();
                selectedSimplices = new MeshSubset();

                // create a THREE.js mesh (and geometry) object
                initThreeMesh();
                //threeMesh = initThreePickMesh();
                scene.add(threeMesh);

                threePickMesh = initThreePickMesh();
                pickScene.add(threePickMesh);

                for (let v of mesh.vertices) {
                        v.index = -1;
                }
                for (let e of mesh.edges) {
                        e.index = -1;
                }
                for (let f of mesh.faces) {
                        f.index = -1;
                }

                simplicialComplexOperators = new SimplicialComplexOperators(mesh);
                for (let i = 0; i < mesh.vertices.length; i++) {
                        vertexIndexMap.set(mesh.vertices[i].index, i);
                }
                for (let i = 0; i < mesh.edges.length; i++) {
                        edgeIndexMap.set(mesh.edges[i].index, i);
                }
                for (let i = 0; i < mesh.faces.length; i++) {
                        faceIndexMap.set(mesh.faces[i].index, i);
                }

                guiFields["Reset"]();

                // update metadata
                let element = document.getElementById("meta");
                element.textContent = "Click on simplices to select them.";
                element.textContent += "\nShift click on simplices to deselect them.";

        } else {
                alert("Unable to build halfedge mesh");
        }
}

function initThreeMesh() {
        // create geometry object
        threeGeometry = new THREE.BufferGeometry();

        // fill position, normal and color buffers
        let V = mesh.vertices.length;
        positions = new Float32Array(V * 3);
        normals = new Float32Array(V * 3);
        colors = new Float32Array(V * 3);
        for (let v of mesh.vertices) {
                let i = v.index;

                let position = geometry.positions[v];
                positions[3 * i + 0] = position.x;
                positions[3 * i + 1] = position.y;
                positions[3 * i + 2] = position.z;

                let normal = geometry.vertexNormalEquallyWeighted(v);
                normals[3 * i + 0] = normal.x;
                normals[3 * i + 1] = normal.y;
                normals[3 * i + 2] = normal.z;

                colors[3 * i + 0] = plainColor.r;
                colors[3 * i + 1] = plainColor.g;
                colors[3 * i + 2] = plainColor.b;
        }

        // fill index buffer
        let F = mesh.faces.length;
        indices = new Uint32Array(F * 3);
        for (let f of mesh.faces) {
                let i = 0;
                for (let v of f.adjacentVertices()) {
                        indices[3 * f.index + i++] = v.index;
                }
        }

        // set geometry
        threeGeometry.setIndex(new THREE.BufferAttribute(indices, 1));
        threeGeometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));
        threeGeometry.addAttribute("normal", new THREE.BufferAttribute(normals, 3));
        threeGeometry.addAttribute("color", new THREE.BufferAttribute(colors, 3));

        // create material
        let threeMaterial = new THREE.MeshPhongMaterial(materialSettings);

        // create wireframe
        wireframe = new THREE.LineSegments();
        wireframe.geometry = new THREE.WireframeGeometry(threeGeometry);
        wireframe.material = new THREE.LineBasicMaterial({
                color: 0x000000,
                linewidth: 12
        });

        // create mesh
        threeMesh = new THREE.Mesh(threeGeometry, threeMaterial);
        threeMesh.add(wireframe);
}

function decodePickColor(color) {
    let pickId = color[0] + color[1] * 256 + color[2] * 256 * 256;
    if (pickId !== 0 && pickId !== 0x00ffffff) {
            if (pickId <= mesh.vertices.length) {
                    return ["v", pickId - 1];
            } else if (pickId <= mesh.vertices.length + mesh.edges.length) {
                    return ["e", pickId - mesh.vertices.length - 1];
            } else {
                    return ["f", pickId - mesh.edges.length - mesh.vertices.length - 1];
            }
    }

}

// Requires a triangle mesh
function initThreePickMesh() {
        // create geometry object
        let threePickGeometry = new THREE.BufferGeometry();

        let F = mesh.faces.length;
        let nVertexTriangles = 2 * 3 * F;
        let nEdgeTriangles   = 2 * 3 * F;
        let nFaceTriangles   = F;

        let nTriangles = nVertexTriangles + nEdgeTriangles + nFaceTriangles;
        // fill position and color buffers
        // picking region for each vertex is the barycentric dual cell
        let C = mesh.corners.length;

        // 3 dimensions x 3 vertices per triangle
        let pickPositions = new Float32Array(3 * 3 * nTriangles);
        let pickColors    = new Float32Array(3 * 3 * nTriangles);

        let vertexColor = function(vertexId) {
                // Hack! dat gui interferes with picking
                // by returning a pickId of 0 on mouse click, shifting indices by 1 seems to avoid this
                let pickId = vertexId + 1;
                return new Vector(
                        ((pickId & 0x000000ff) >> 0) / 255.0,
                        ((pickId & 0x0000ff00) >> 8) / 255.0,
                        ((pickId & 0x00ff0000) >> 16) / 255.0);
        }

        let edgeColor = function(edgeId) {
                let pickId = edgeId + mesh.vertices.length + 1;
                return new Vector(
                        ((pickId & 0x000000ff) >> 0) / 255.0,
                        ((pickId & 0x0000ff00) >> 8) / 255.0,
                        ((pickId & 0x00ff0000) >> 16) / 255.0);
        }

        let faceColor = function(faceId) {
                let pickId = faceId + mesh.edges.length + mesh.vertices.length + 1;
                return new Vector(
                        ((pickId & 0x000000ff) >> 0) / 255.0,
                        ((pickId & 0x0000ff00) >> 8) / 255.0,
                        ((pickId & 0x00ff0000) >> 16) / 255.0);
        }

        let s = .2;
        let k = 0;
        for (let c of mesh.corners) {
                let v = c.vertex;
                let vColor = vertexColor(v.index);

                let e = undefined;
                for (let he of v.adjacentHalfedges()) {
                        if (he.twin.vertex == c.next.vertex) {
                                e = he.edge;
                                break;
                        }
                }
                let eColor = edgeColor(e.index);

                // get the three vertex positions in the triangle
                let p1 = geometry.positions[v];
                let p2 = geometry.positions[c.next.vertex];
                let p3 = geometry.positions[c.prev.vertex];

                // get the edge and triangle midpoints
                let m12  = p1.times(1-s).plus(p2.times(s));
                let m13  = p1.times(1-s).plus(p3.times(s));
                let m123 = p1.times(1-2*s).plus(p2.times(s)).plus(p3.times(s));

                let m21  = p2.times(1-s).plus(p1.times(s));
                let m231 = p2.times(1-2*s).plus(p3.times(s)).plus(p1.times(s));

                // give all the triangles the same pick color at this corner
                let vTris = [p1, m12, m123, p1, m123, m13];
                for (let j = 0; j < 6; j++) {
                        pickPositions[k + 0] = vTris[j].x;
                        pickPositions[k + 1] = vTris[j].y;
                        pickPositions[k + 2] = vTris[j].z;

                        pickColors[k + 0] = vColor.x;
                        pickColors[k + 1] = vColor.y;
                        pickColors[k + 2] = vColor.z;
                        k += 3;
                }
                // give all the triangles the same pick color at this corner
                let eTris = [m12, m231, m123, m12, m21, m231];
                for (let j = 0; j < 6; j++) {
                        pickPositions[k + 0] = eTris[j].x;
                        pickPositions[k + 1] = eTris[j].y;
                        pickPositions[k + 2] = eTris[j].z;

                        pickColors[k + 0] = eColor.x;
                        pickColors[k + 1] = eColor.y;
                        pickColors[k + 2] = eColor.z;
                        k += 3;
                }
        }

        for (let f of mesh.faces) {
                let vs = Array.from(f.adjacentVertices());
                // get the three vertex positions in the triangle
                let p1 = geometry.positions[vs[0]];
                let p2 = geometry.positions[vs[1]];
                let p3 = geometry.positions[vs[2]];

                let m1 = p1.times(1-2*s).plus(p2.times(s)).plus(p3.times(s));
                let m2 = p2.times(1-2*s).plus(p3.times(s)).plus(p1.times(s));
                let m3 = p3.times(1-2*s).plus(p1.times(s)).plus(p2.times(s));

                let fColor = faceColor(f.index);

                // give all the triangles the same pick color at this corner
                let fTris = [m1, m2, m3];
                for (let j = 0; j < 3; j++) {
                        pickPositions[k + 0] = fTris[j].x;
                        pickPositions[k + 1] = fTris[j].y;
                        pickPositions[k + 2] = fTris[j].z;

                        pickColors[k + 0] = fColor.x;
                        pickColors[k + 1] = fColor.y;
                        pickColors[k + 2] = fColor.z;
                        k += 3;
                }
        }

        // set geometry
        threePickGeometry.addAttribute("position", new THREE.BufferAttribute(pickPositions, 3));
        threePickGeometry.addAttribute("color", new THREE.BufferAttribute(pickColors, 3));

        // create material
        let threePickMaterial = new THREE.MeshBasicMaterial({
                vertexColors: THREE.VertexColors
        });

        // create mesh
        return new THREE.Mesh(threePickGeometry, threePickMaterial);
}

function initVertexMesh(id) {
        if (!vertexMeshMap.has(id)) {
                let material = new THREE.MeshPhongMaterial({color: selectedColor});
                let threeVertexMesh = new THREE.Mesh(new THREE.SphereGeometry(0.1 * lengthScale), material);

                let center = geometry.positions[id];
                threeVertexMesh.position.set(center.x, center.y, center.z);
                threeVertexMesh.material.color.copy(selectedColor);
                scene.add(threeVertexMesh);
                vertexMeshMap.set(id, threeVertexMesh);
        }
}

function initEdgeMesh(id) {
        if (!edgeMeshMap.has(id)) {
                let p1 = geometry.positions[vertexIndexMap.get(mesh.edges[id].halfedge.vertex.index)];
                let p2 = geometry.positions[vertexIndexMap.get(mesh.edges[id].halfedge.twin.vertex.index)];
                let center = p1.plus(p2).over(2);
                let heading = p1.minus(p2);

                let height = heading.norm();
                heading.normalize();
                let r = 0.05 * lengthScale;
                let material = new THREE.MeshPhongMaterial({color: selectedColor});
                let threeEdgeMesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, height, 8, true), material);
                threeEdgeMesh.position.set(center.x, center.y, center.z);

                let axis = heading.plus(new Vector(0, 1, 0)).over(2);
                axis.normalize();
                threeEdgeMesh.setRotationFromAxisAngle(axis, Math.PI);
                edgeMeshMap.set(id, threeEdgeMesh);

                scene.add(threeEdgeMesh);
        }
}

function initFaceMesh(id) {
        if (!faceMeshMap.has(id)) {
                let face = mesh.faces[id];
                let vs = Array.from(face.adjacentVertices());
                let p1 = geometry.positions[vertexIndexMap.get(vs[0].index)];
                let p2 = geometry.positions[vertexIndexMap.get(vs[1].index)];
                let p3 = geometry.positions[vertexIndexMap.get(vs[2].index)];

                let center = p1.plus(p2).plus(p3).over(3);
                let s = 0.15;
                let shrunk_p1 = p1.times(1-s).plus(center.times(s));
                let shrunk_p2 = p2.times(1-s).plus(center.times(s));
                let shrunk_p3 = p3.times(1-s).plus(center.times(s));

                let normal = p3.minus(p1).cross(p2.minus(p1));
                normal.normalize();

                let offset = 0.001;
                let p1Minus = shrunk_p1.minus(normal.times(offset));
                let p2Minus = shrunk_p2.minus(normal.times(offset));
                let p3Minus = shrunk_p3.minus(normal.times(offset));

                let threeGeometry = new THREE.Geometry();
                threeGeometry.vertices.push(toThreeVector(p1Minus));
                threeGeometry.vertices.push(toThreeVector(p2Minus));
                threeGeometry.vertices.push(toThreeVector(p3Minus));
                threeGeometry.faces.push(new THREE.Face3(0, 1, 2));
                threeGeometry.computeFaceNormals();

                // create mesh
                let material = new THREE.MeshPhongMaterial({color: selectedColor});
                threeMesh = new THREE.Mesh(threeGeometry, material);
                faceMeshMap.set(id, threeMesh);

                scene.add(threeMesh);
        }
}

function deleteVertexMesh(id) {
        if (vertexMeshMap.has(id)) {
                let vertexMesh = vertexMeshMap.get(id);
                scene.remove(vertexMesh);
                vertexMeshMap.delete(id);
        }
}

function deleteEdgeMesh(id) {
        if (edgeMeshMap.has(id)) {
                let edgeMesh = edgeMeshMap.get(id);
                scene.remove(edgeMesh);
                edgeMeshMap.delete(id);
        }
}

function deleteFaceMesh(id) {
        if (faceMeshMap.has(id)) {
                let faceMesh = faceMeshMap.get(id);
                scene.remove(faceMesh);
                faceMeshMap.delete(id);
        }
}

function initControls() {
        controls = new THREE.TrackballControls(camera, renderer.domElement);
        controls.rotateSpeed = 5.0;
}

function addEventListeners() {
        window.addEventListener("click", onMouseClick, false);
        window.addEventListener("resize", onWindowResize, false);
}

function onMouseClick(event) {
        if (event.clientX >= 0 && event.clientX <= window.innerWidth &&
                event.clientY >= 0 && event.clientY <= window.innerHeight) {
                shiftClick = event.shiftKey;
                pick(event.clientX, event.clientY);
        }
}

function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);
        controls.handleResize();
        render();
}

function pick(clickX, clickY) {
        // draw
        let pickTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
        pickTarget.texture.generateMipmaps = false;
        pickRenderer.render(pickScene, camera, pickTarget);

        // read color
        let pixelBuffer = new Uint8Array(4);
        pickRenderer.readRenderTargetPixels(pickTarget, clickX, pickTarget.height - clickY, 1, 1, pixelBuffer);

        // convert color to id
        let pickId = pixelBuffer[0] + pixelBuffer[1] * 256 + pixelBuffer[2] * 256 * 256;
        if (pickId !== 0 && pickId !== 0x00ffffff) {
                let [type, id] = decodePickColor(pixelBuffer);
                toggleSimplex(type, id);
                setDisabledButtons();
        }
}

function animate() {
        requestAnimationFrame(animate);
        controls.update();
        render();
}

function render() {
        renderer.render(scene, camera);
}

function displayMeshSubset() {
        for (let i = 0; i < mesh.vertices.length; i++) {
                deleteVertexMesh(i);
        }
        for (let i = 0; i < mesh.edges.length; i++) {
                deleteEdgeMesh(i);
        }
        for (let i = 0; i < mesh.faces.length; i++) {
                deleteFaceMesh(i);
        }

        for (let v of selectedSimplices.vertices) {
                initVertexMesh(vertexIndexMap.get(v));
        }
        for (let e of selectedSimplices.edges) {
                initEdgeMesh(edgeIndexMap.get(e));
        }
        for (let f of selectedSimplices.faces) {
                initFaceMesh(faceIndexMap.get(f));
        }
}

function toThreeVector(v) {
    return new THREE.Vector3(v.x, v.y, v.z);
}
