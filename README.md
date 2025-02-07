# cx-converter-wasm-demo
## Purpose
This demo presents how to make use of the Creoox WebAssembly converter (IFC to GLTF) from [npm package @creooxag/cx-converter](https://www.npmjs.com/package/@creooxag/cx-converter).
The GLTF file is presented with [xeokit SDK](https://xeokit.io/)
## Run demo
To run demo example just call:
```bash
npm install
npm run build
npm run serve
```
and click the url specified by webpack output.

## Description
This is a still-in-development example, but presents that Creoox WebAssembly converter does the job.
You can see full metadata information by calling in console:
```bash
window.ifcConverter.metaDataGlobal
```