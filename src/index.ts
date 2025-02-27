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
        
        // simplest option:
        // const { gltf, metaData } = await ifc2gltf(data);
        const { gltf, metaData } = await ifc2gltf(
          data,
          {
            progressCallback: progressCallback,
            progressTextCallback: progressTextCallback,
          }
          /** or totally locally:
          {
            remote: false,
            urlPath: "./dist/",
            progressCallback: progressCallback,
            progressTextCallback: progressTextCallback,
          }
          **/
        );
        
         
        const model = await gltfLoader.load({
          id: "myModel",
          gltf: gltf,
          //@ts-ignore
          metaModelJSON: metaData
        });
        model.on("loaded", () => {
          viewer.cameraFlight.flyTo();

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