import './style.css'
import { Viewer, TreeViewPlugin, XKTLoaderPlugin} from "@xeokit/xeokit-sdk";
import { XktConverter } from './xktConverter';

const viewer = new Viewer({
  canvasId: "myCanvas"
});
//@ts-ignore
const treeView = new TreeViewPlugin(viewer, {
  containerElement: document.getElementById("myTreeView") as HTMLElement
});

var metaDataGlobal = {};
const XKTs : Uint8Array[] = [];
const xktLoader = new XKTLoaderPlugin(viewer);
const xktConverter = await XktConverter.create();
async function allGltfsCompleted() {
  loadAllToViewer();
}
xktConverter.registerAllReadyCallback(allGltfsCompleted);
async function handleMetaData(metaData : { [key: string]: any }) {
  metaDataGlobal = metaData;
}
xktConverter.registerMetaDataCallback(handleMetaData);
async function handleXKT(xkt : Uint8Array) {
  XKTs.push(xkt);
}
xktConverter.registerXKTCallback(handleXKT);

function progressCallback(progress : number) {
  const progressPercentage = document.getElementById("progressPercentage");
  progressPercentage!.innerText = progress.toFixed(1) + "%";
}
xktConverter.registerProgressCallback(progressCallback);

function progressTextCallback(progressText : string) {
  const progressTextElement = document.getElementById("progressText");
  progressTextElement!.innerText = progressText;
}
xktConverter.registerProgressTextCallback(progressTextCallback);

async function loadAllToViewer() {
  for (let idx = 0; idx < XKTs.length; idx++) {
    const currentXKT = XKTs[idx];
    xktLoader.load({ xkt: currentXKT });
  }
  viewer.metaScene.createMetaModel("metaModel", metaDataGlobal);
  viewer.cameraFlight.flyTo();
}


async function fileInputChanged() {
  let fileInput = document.getElementById("finput")  as HTMLInputElement;;
  if (fileInput.files!.length == 0) return console.log("No files selected!");
  const file = fileInput.files![0];
  const reader = new FileReader();
  reader.onload = async () => {
    const dataUint8Array = new Uint8Array(reader.result as ArrayBuffer);
    const data = new TextDecoder().decode(dataUint8Array);

      try {
          const ext = file.name.split('.').pop();
          if (ext == "ifc" || ext == "ifczip") {
              const loadOptions = {
                  "maxFileSizeInMegaBytes": 15
              };
              //@ts-ignore
              const loadResult = xktConverter.ifcToXKTs(data, loadOptions);
          }
      }
      catch (e) {
          console.log("loadModel failed: " + e)
      }

      //fileInput.value = "";
  };
  reader.readAsArrayBuffer(file);
}

document!.getElementById("finput")!.addEventListener("change", fileInputChanged);
