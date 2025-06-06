# cx-converter WebAssembly Demo

![screenshot](public/screenshot.png)

## Purpose
This demo* presents how to make use of the Creoox WebAssembly converter (IFC to GLTF) from [npm package @creooxag/cx-converter](https://www.npmjs.com/package/@creooxag/cx-converter).
The GLTF file is presented with [npm package @xeokit/xeokit-sdk](https://www.npmjs.com/package/@xeokit/xeokit-sdk). [Vite](https://www.npmjs.com/package/vite) was used as a bundler. 
<BR><BR>
(*) on the site which is loaded by default. For another variant, see [Code examples](#Code-examples)

## Run demo
To run demo example just call:
```bash
npm install
npm run dev
```
and click the url specified by Vite.

## Description
You can choose IFC file from your disk and upload it to see the preview and IFC meta data in the viewer/treeview.

## Code explanation
### Conversion
The conversion is done by code (see index.ts):
```js
const { gltf, metaData } = await ifc2gltf(data);
```
which extracts gltf together with metaData.
### Importing of wasm
By default, wasm file from CDN is used. To use local file, following syntax should be used:
```js
const { gltf, metaData } = await ifc2gltf(data,
    {
        remote: false,
        urlPath: "./dist/",
    });
```
### Code examples
#### index.html
index.html site (and its script implemented in index.ts) uses simple 'ifc2gltf' function mentioned above. 
#### indexXKT.html
However, if you want to have more control over the conversion process, you should take a look at indexXKT.html (you can choose between pages by clicking a proper link at the top), which bases on indexXKT.ts. <BR>
It demonstrates how to work with ifcConverter class by using it to convert IFC to XKT first with [npm package @xeokit/xeokit-convert](https://www.npmjs.com/package/@xeokit/xeokit-convert) and then to load it into xeokit-viewer.



