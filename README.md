# geometry-processing-js

geometry-processing-js is a framework for interactive geometry processing in the web!
It is designed to be fast and easy to work with, which makes it suitable for coursework
and for releasing demos.

At a high level, the framework is divided into three parts - an implementation of
a halfedge mesh data structure, an optimized linear algebra package and skeleton
code for various geometry processing algorithms. Each algorithm comes with its own
viewer for rendering.

Detailed documentation and unit tests for each of these parts can be found in the docs
and tests directories of this [repository](https://github.com/rohan-sawhney/geometry-processing-js).

## Getting started

1. Clone the repository and change into the projects directory
```
git clone https://github.com/rohan-sawhney/geometry-processing-js.git
cd geometry-processing-js/projects
```

2. Open the index.html file in any of the sub directories in a browser of your choice
(Chrome and Firefox usually provide better rendering performance than Safari).

## Dependencies (all included)

1. Linear Algebra - A wrapper around the C++ library [Eigen](https://eigen.tuxfamily.org) compiled
to [asm.js](http://asmjs.org) with [emscripten](http://emscripten.org). Future updates will compile
the more optimized sparse matrix library [Suitesparse](http://faculty.cse.tamu.edu/davis/suitesparse.html) to asm.js.

2. Rendering - [three.js](https://threejs.org)

3. Unit Tests - [Mocha](http://mochajs.org) and [Chai](http://chaijs.com)

## About Javascript

The implementation of geometry-processing-js attempts to minimize the use of obscure
Javascript language features. It should not be too difficult for anyone with experience
in a dynamic language like Python or familiar with the principles of Object Oriented Programming
to get a handle on Javascript syntax by reading through some of the code in this framework.
The documentation contains examples specific to this framework which will also be of help.
For a more formal introduction to Javascript, checkout this really nice [tutorial](https://javascript.info).

## Author

Rohan Sawhney

Email: rohansawhney@cs.cmu.edu

## License

[MIT](https://opensource.org/licenses/MIT)
