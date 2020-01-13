## Building the Documentation

This documentation was generated using [jsdoc](http://usejsdoc.org/) and [ink-docstrap](https://www.npmjs.com/package/ink-docstrap). We used a modified version of the [cosmo](http://docstrap.github.io/docstrap/themes/cosmo/) theme. To build the documentation, first instal jsdoc and ink-docstrap with npm in the parent directory of `geometry-processing-js`. Then copy `doc-config/site.cosmo-rohan.css` into `node_modules/ink-docstrap/template/static/styles/`. Now you can build the documentation by running
```
jsdoc -c geometry-processing-js/doc-config/jsdoc.conf.json -t node_modules/ink-docstrap/template/ -R geometry-processing-js/README.md -r -d geometry-processing-js/docs geometry-processing-js/
```
After building the documentation, you have to manually fix some image paths in `docs/index.html`. You need to change `imgs/logo.png` to `../imgs/logo.png`, and `imgs/geometry-collective-production.png` to `../imgs/geometry-collective-production.png`.
