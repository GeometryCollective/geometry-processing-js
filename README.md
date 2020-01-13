<a href="http://geometry.cs.cmu.edu/js">
<img src="imgs/logo.png" height="64" width="64" align="right" />
</a>

# geometry-processing-js

geometry-processing-js is a fast and flexible framework for 3D geometry processing on the web! Easy integration with HTML/WebGL makes it particularly suitable for things like mobile apps, online demos, and course content. For many tasks, performance comes within striking distance of native (C++) code. Plus, since the framework is pure JavaScript, no **compilation or installation** is necessary: just copy the files and run from any web browser, on any platform (including mobile). Moreover, geometry processing algorithms can be **edited in the browser** (using for instance the [JavaScript Console](https://developers.google.com/web/tools/chrome-devtools/console/) in Chrome). So open up one of the demos and start editing! geometry-processing-js is developed by and maintained by the [Geometry Collective](http://geometry.cs.cmu.edu) at [Carnegie Mellon University](http://www.cs.cmu.edu/).

At a high level, the framework is divided into three parts - a flexible a halfedge mesh data structure, an optimized linear algebra package (based on [Eigen](https://eigen.tuxfamily.org)), and code for various geometry processing algorithms. Each algorithm comes with its own viewer for rendering.

Detailed documentation and unit tests for each of these parts can be found in the docs and tests directories of this [repository](https://github.com/geometrycollective/geometry-processing-js).

*We're just getting rolling here, so stay tuned for more! :-)*

## Code Snippet

Since geometry-processing-js already implements many of the fundamental operations needed for geometry processing, it's easy to get up and running very quickly. Here's a short snippet showing how to solve a Poisson equation on a mesh loaded by the GUI, which uses built-in routines for constructing the Laplace and mass matrices:

```
// assign an index to each vertex of the mesh
let vertexIndex = indexElements(geometry.mesh.vertices);

// build cotan-Laplace and mass matrices
let A = geometry.laplaceMatrix(vertexIndex);
let M = geometry.massMatrix(vertexIndex);
let rhs = M.timesDense(rho);

// solve Poisson equation with a given right-hand side rhs
let llt = A.chol();
let phi = llt.solvePositiveDefinite(rhs);
```

## Getting started

1. Clone the repository and change into the projects directory
```
git clone https://github.com/geometrycollective/geometry-processing-js.git
cd geometry-processing-js/projects
```

2. Open the index.html file in any of the sub directories in a browser of your choice (Chrome and Firefox usually provide better rendering performance than Safari).

## Dependencies (all included)

1. Linear Algebra - A wrapper around the C++ library [Eigen](https://eigen.tuxfamily.org) compiled to [asm.js](http://asmjs.org) with [emscripten](http://emscripten.org). Future updates will compile the more optimized sparse matrix library [Suitesparse](http://faculty.cse.tamu.edu/davis/suitesparse.html) to asm.js. (Note that this wrapper can also be used for other, non-geometric projects which seek to use Eigen on the web; you can find the standalone release [here](https://rohan-sawhney.github.io/linear-algebra-js/))

2. Rendering - [three.js](https://threejs.org)

3. Unit Tests - [Mocha](http://mochajs.org) and [Chai](http://chaijs.com)

## About Javascript

The implementation of geometry-processing-js attempts to minimize the use of obscure Javascript language features. It should not be too difficult for anyone with experience in a dynamic language like Python or familiar with the principles of Object Oriented Programming to get a handle on Javascript syntax by reading through some of the code in this framework. The documentation contains examples specific to this framework which will also be of help. For a more formal introduction to Javascript, checkout this really nice [tutorial](https://javascript.info).

## Building the Documentation
See [guide here](doc-config/build-instructions.md).

## Authors

[Rohan Sawhney](http://rohansawhney.io)

Email: rohansawhney@cs.cmu.edu

[Mark Gillespie](http://markjgillespie.com)

Email: mgillesp@cs.cmu.edu

Design inspiration: [Nick Sharp](http://nmwsharp.com), [Keenan Crane](http://www.cs.cmu.edu/~kmcrane/)

## License

[MIT](https://opensource.org/licenses/MIT)

<p align="center">
<a href="http://geometry.cs.cmu.edu">
  <img src="imgs/geometry-collective-production.png" width="250" height="227.92">
</a>
</p>
