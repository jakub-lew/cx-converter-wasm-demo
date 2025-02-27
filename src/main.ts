import './style.css'
import { ifc2gltf } from "@creooxag/cx-converter"
import { Viewer, GLTFLoaderPlugin, TreeViewPlugin } from "@xeokit/xeokit-sdk";
const viewer = new Viewer({
  canvasId: "myCanvas"
});
//@ts-ignore
const treeView = new TreeViewPlugin(viewer, {
  containerElement: document.getElementById("myTreeView") as HTMLElement
});
const gltfLoader = new GLTFLoaderPlugin(viewer);

async function fileInputChanged() {
  let fileInput = document.getElementById("finput") as HTMLInputElement;
  if (fileInput!.files!.length == 0) return console.log("No files selected!");
  const file = fileInput!.files![0];
  var reader = await new FileReader();
  reader.onload = async () => {
    var dataUint8Array = new Uint8Array(reader.result as ArrayBuffer);
    try {
      const ext = file.name.split('.').pop();
      if (ext == "ifc" || ext == "ifczip") {
        const progressCallback = (progress: number) => {
          document.getElementById("progressPercentage")!.innerText = progress + "%";
        };
        const progressTextCallback = (progressText: string) => {
          document.getElementById("progressText")!.innerText = progressText;
        };
        const data = new TextDecoder().decode(dataUint8Array);

        // const { gltf, metaData } = await ifc2gltf(dataString, "https://cdn.jsdelivr.net/npm/@creooxag/cx-converter@0.0.6-alpha/dist/", progressCallback, progressTextCallback);
        //const { gltf, metaData } = await ifc2gltf(dataString, "./", progressCallback, progressTextCallback);
        // const { gltf, metaData } = await ifc2gltf(dataString);
        const { gltf, metaData } = await ifc2gltf(
          data,
          {
            remote: true,
            progressCallback: progressCallback,
            progressTextCallback: progressTextCallback,
          });
        const model = await gltfLoader.load({
          id: "myModel",
          gltf: gltf,
          //@ts-ignore
          metaModelJSON: metaData
          // autoMetaModel: true
        });
        model.on("loaded", () => {
          viewer.cameraFlight.flyTo();
          //the following, together with autoMetaModel: true works but flat ID list in treeview is visible
          // viewer.metaScene.createMetaModel("metaModel", metaData);
        });
      }
    }
    catch (e) {
      console.log("loadModel failed: " + e)
    }
  };
  reader.readAsArrayBuffer(file);
}

document!.getElementById("finput")!.addEventListener("change", fileInputChanged);