# cx-converter WebAssembly Demo

![screenshot](public/screenshot.png)

## Purpose
This demo presents how to make use of the Creoox WebAssembly converter (IFC to GLTF) from [npm package @creooxag/cx-converter](https://www.npmjs.com/package/@creooxag/cx-converter).
The GLTF file is presented with [npm package @xeokit/xeokit-sdk](https://www.npmjs.com/package/@xeokit/xeokit-sdk). [Vite](https://www.npmjs.com/package/vite) was used as a bundler. 

## Run demo
To run demo example just call:
```bash
npm install
npm build
npm run preview
```
and click the url specified by Vite.

## Description
You can choose IFC file from your disk and upload it to see the preview and IFC meta data in the viewer/treeview.

## Code explanation
### Conversion
In main.ts the conversion is done in the following line of code:
```js
const { gltf, metaData } = await ifc2gltf(data);
```
which extracts gltf together with metaData.
### Importing of wasm
By default, wasm file from npm-package is used. But you can always import it dynamically, using the following syntax:
```js
const { gltf, metaData } = await ifc2gltf(dataString, "https://cdn.jsdelivr.net/npm/@creooxag/cx-converter@0.0.6-alpha/dist/");
```


