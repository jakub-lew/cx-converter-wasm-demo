const urlParams = new URLSearchParams(window.location.search);

const xeokitVersion = urlParams.get('xeokit') ?? 'latest';
const xeokitUrl = `https://cdn.jsdelivr.net/npm/@xeokit/xeokit-sdk@${xeokitVersion}/dist/xeokit-sdk.min.es.js`

let ifcModelUrl = urlParams.get('url') ?? 'https://raw.githubusercontent.com/xeokit/xeokit-sdk/refs/heads/master/assets/models/ifc/Duplex.ifc';
ifcModelUrl = decodeURIComponent(ifcModelUrl);

const xeokitRotation = urlParams.get('rotation') ? urlParams.get('rotation').split(',').map(v => parseInt(v)) : [-90, 0, 0];
const xeokitBoundingBox = urlParams.get('boundingBox') ? urlParams.get('boundingBox') === '1' || urlParams.get('boundingBox') === 'true' : false;
const xeokitEdges = urlParams.get('edges') ? urlParams.get('edges') === '1' || urlParams.get('edges') === 'true' : false;
const xeokitColorTextureEnabled = urlParams.get('colorTextureEnabled') ? urlParams.get('colorTextureEnabled') === '1' || urlParams.get('colorTextureEnabled') === 'true' : true;
const xeokitDtxEnabled = urlParams.get('dtxEnabled') ? urlParams.get('dtxEnabled') === '1' || urlParams.get('dtxEnabled') === 'true' : true;
const xeokitTreeViewEnabled = urlParams.get('treeViewEnabled') ? urlParams.get('treeViewEnabled') === '1' || urlParams.get('treeViewEnabled') === 'true' : true;
const xeokitTransparent = urlParams.get('transparent') ? urlParams.get('transparent') === '1' || urlParams.get('transparent') === 'true' : true;
const xeokitBackfaces = urlParams.get('backfaces') ? urlParams.get('backfaces') === '1' || urlParams.get('backfaces') === 'true' : true;
const xeokitTreeViewHierarchy = urlParams.get('treeViewHierarchy') ? urlParams.get('treeViewHierarchy') : "containment"; // containment | types | storeys
const xeokitSaoEnabled = urlParams.get('saoEnabled') ? urlParams.get('saoEnabled') === '1' || urlParams.get('saoEnabled') === 'true' : true;
const xeokitFP64 = urlParams.get('fp64') ? urlParams.get('fp64') === '1' || urlParams.get('fp64') === 'true' : true;
const xeokitCacheBuster = urlParams.get('cacheBuster') ? urlParams.get('cacheBuster') === '1' || urlParams.get('cacheBuster') === 'true' : false;

// stats
const script = document.createElement('script');

script.onload = function () {
    const stats = new Stats({
        trackGPU: true,
        trackHz: true,
        trackCPT: true,
        logsPerSecond: 4,
        graphsPerSecond: 30,
        samplesLog: 40,
        samplesGraph: 100,
        precision: 2,
        horizontal: false,
        minimal: false,
        mode: 1,
    });

    stats.dom.style = 'position: fixed; top: 0px; right: 0px; cursor: pointer; opacity: 0.9; z-index: 10000;'
    const statsElement = document.getElementById('stats');
    statsElement.appendChild(stats.dom);

    requestAnimationFrame(function loop() {
        stats.update();
        requestAnimationFrame(loop);
    });
};

script.src = './stats.min.js';
document.head.appendChild(script);

class ImportError extends Error { }

const loadModule = async (modulePath) => {
    try {
        return await import(/* webpackIgnore: true */  modulePath)
    } catch (e) {
        console.log({ e });
        alert(e.message);
        throw new ImportError(e.message);
    }
}

// xeokit
const {
    Mesh,
    ReadableGeometry,
    PhongMaterial,
    buildBoxLinesGeometryFromAABB,
    NavCubePlugin,
    Viewer,
    GLTFLoaderPlugin,
    TreeViewPlugin,
    ContextMenu,
} = await loadModule(xeokitUrl);

const viewer = new Viewer({
    canvasId: "myCanvas",
    transparent: xeokitTransparent,
    dtxEnabled: xeokitDtxEnabled,
    colorTextureEnabled: xeokitColorTextureEnabled,
});

viewer.scene.camera.eye = [26.543735598689356, 29.295147183337072, 36.20021104566069];
viewer.scene.camera.look = [-23.51624377290216, -8.263137541594404, -21.650089870476542];
viewer.scene.camera.up = [-0.2883721466119999, 0.897656342963939, -0.3332485483764247];

new NavCubePlugin(viewer, {
    canvasId: "myNavCubeCanvas",
    visible: true,
    size: 250,
    alignment: "bottomRight",
    bottomMargin: 100,
    rightMargin: 10
});

viewer.scene.xrayMaterial.fill = true;
viewer.scene.xrayMaterial.fillAlpha = 0.1;
viewer.scene.xrayMaterial.fillColor = [0, 0, 0];
viewer.scene.xrayMaterial.edgeAlpha = 0.3;
viewer.scene.xrayMaterial.edgeColor = [0, 0, 0];

viewer.scene.highlightMaterial.fill = true;
viewer.scene.highlightMaterial.edges = true;
viewer.scene.highlightMaterial.fillAlpha = 0.1;
viewer.scene.highlightMaterial.edgeAlpha = 0.1;
viewer.scene.highlightMaterial.edgeColor = [1, 1, 0];

viewer.scene.selectedMaterial.fill = true;
viewer.scene.selectedMaterial.edges = true;
viewer.scene.selectedMaterial.fillAlpha = 0.5;
viewer.scene.selectedMaterial.edgeAlpha = 0.6;
viewer.scene.selectedMaterial.edgeColor = [0, 1, 1];

viewer.cameraControl.navMode = "orbit";
viewer.cameraControl.followPointer = true;

const getCanvasPosFromEvent = function (event) {
    const canvasPos = [];
    if (!event) {
        event = window.event;
        canvasPos[0] = event.x;
        canvasPos[1] = event.y;
    } else {
        let element = event.target;
        let totalOffsetLeft = 0;
        let totalOffsetTop = 0;
        let totalScrollX = 0;
        let totalScrollY = 0;
        while (element.offsetParent) {
            totalOffsetLeft += element.offsetLeft;
            totalOffsetTop += element.offsetTop;
            totalScrollX += element.scrollLeft;
            totalScrollY += element.scrollTop;
            element = element.offsetParent;
        }
        canvasPos[0] = event.pageX + totalScrollX - totalOffsetLeft;
        canvasPos[1] = event.pageY + totalScrollY - totalOffsetTop;
    }
    return canvasPos;
};

function removeModelBoundingBox(viewer, sceneModelId) {
    if (!viewer) return;

    if (viewer.scene.objects[`${sceneModelId}#boundingBox`]) {
        viewer.scene.objects[`${sceneModelId}#boundingBox`].destroy();
    }
}

function drawModelBoundingBox(viewer, sceneModelId, aabb) {
    if (!viewer) return;

    if (!viewer.scene.objects[`${sceneModelId}#boundingBox`]) {
        new Mesh(viewer.scene, {
            id: `${sceneModelId}#boundingBox`,
            isObject: true,
            geometry: new ReadableGeometry(viewer.scene, buildBoxLinesGeometryFromAABB({ aabb })),
            material: new PhongMaterial(viewer.scene, { ambient: [255, 0, 0] }),
        });
    }
}

async function fetchFile(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
    } catch (error) {
        console.error('Error fetching file:', error);
    }
}

//----------------------------------------------------------------------------------------------------------------------
// Load a BIM model comprised of multiple XKT files
// The manifest of XKT files is given in model.xkt.manifest.json
// This will create a single SceneModel and MetaModel that contains the combined content of all the XKT files
//----------------------------------------------------------------------------------------------------------------------

import { IfcConverter } from '@creooxag/cx-converter';

var metaDataGlobal = {};
const GLTFs = [];
let loader = null;
let sceneModel = null;


const ifcConverter = await IfcConverter.create();

async function loadAllToViewer() {
    console.log("All GLTFs loaded");
    console.log("GLTF chunk loaded", GLTFs.length)
    for (let idx = 0; idx < GLTFs.length; idx++) {
        const currentGLTF = GLTFs[idx];
        loader = new GLTFLoaderPlugin(viewer);
        console.log("Loading GLTF", idx);
        sceneModel = loader.load({
            id: "myModel",
            gltf: currentGLTF,
            colorTextureEnabled: xeokitColorTextureEnabled,
            autoMetaModel: true,
            saoEnabled: xeokitSaoEnabled,
            edges: xeokitEdges,
            dtxEnabled: xeokitDtxEnabled
        });

    }
    viewer.metaScene.createMetaModel("metaModel", metaDataGlobal);
    const t0 = performance.now();

    sceneModel.on("loaded", function () {
        const t1 = performance.now();
        console.log(`Model loaded in ${Math.floor(t1 - t0) / 1000.0} seconds, Objects: ${sceneModel.numEntities}`);

        document.getElementById('footer').innerText = `Model loaded in ${Math.floor(t1 - t0) / 1000.0} seconds, Objects: ${sceneModel.numEntities}`;

        viewer.cameraFlight.jumpTo({
            projection: "perspective",
            aabb: viewer.scene.getAABB({}),
            //duration: 0.5
        });

        if (xeokitBoundingBox) {
            const model = viewer.scene.models['myModel'];
            drawModelBoundingBox(viewer, 'myModel', model.aabb);
        }

    });
}

ifcConverter.registerGltfCompleteCallback(() => {
    console.log("GLTF completed");
    // loadAllToViewer();
});


ifcConverter.registerMetaDataCompleteCallback((metaData) => {
    metaDataGlobal = metaData;
})


ifcConverter.registerGltfChunkDoneCallback((gltf) => {
    GLTFs.push(gltf);
    console.log("GLTF chunk loaded", GLTFs.length);
    loadAllToViewer();
}
);

ifcConverter.registerProgressCallback((progress) => {
    console.log(`Progress: ${progress}`);
});

ifcConverter.loadModel(await fetchFile(ifcModelUrl));



//----------------------------------------------------------------------------------------------------------------------
// Create a tree view
//----------------------------------------------------------------------------------------------------------------------
if (xeokitTreeViewEnabled) {
    const treeView = new TreeViewPlugin(viewer, {
        containerElement: document.getElementById("treeViewContainer"),
        hierarchy: xeokitTreeViewHierarchy,
        autoExpandDepth: 1
    });

    const treeViewContextMenu = new ContextMenu({
        items: [
            [
                {
                    title: "View Fit",
                    doAction: function (context) {
                        const scene = context.viewer.scene;
                        const objectIds = [];
                        context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                            if (treeViewNode.objectId) {
                                objectIds.push(treeViewNode.objectId);
                            }
                        });
                        scene.setObjectsVisible(objectIds, true);
                        scene.setObjectsHighlighted(objectIds, true);
                        context.viewer.cameraFlight.flyTo({
                            projection: "perspective",
                            aabb: scene.getAABB(objectIds),
                            duration: 0.5
                        }, () => {
                            setTimeout(function () {
                                scene.setObjectsHighlighted(scene.highlightedObjectIds, false);
                            }, 500);
                        });
                    }
                },
                {
                    title: "View Fit All",
                    doAction: function (context) {
                        const scene = context.viewer.scene;
                        context.viewer.cameraFlight.flyTo({
                            projection: "perspective",
                            aabb: scene.getAABB({}),
                            duration: 0.5
                        });
                    }
                }
            ],
            [
                {
                    title: "Hide",
                    doAction: function (context) {
                        context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                            if (treeViewNode.objectId) {
                                const entity = context.viewer.scene.objects[treeViewNode.objectId];
                                if (entity) {
                                    entity.visible = false;
                                }
                            }
                        });
                    }
                },
                {
                    title: "Hide Others",
                    doAction: function (context) {
                        const scene = context.viewer.scene;
                        scene.setObjectsVisible(scene.visibleObjectIds, false);
                        scene.setObjectsXRayed(scene.xrayedObjectIds, false);
                        scene.setObjectsSelected(scene.selectedObjectIds, false);
                        scene.setObjectsHighlighted(scene.highlightedObjectIds, false);
                        context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                            if (treeViewNode.objectId) {
                                const entity = scene.objects[treeViewNode.objectId];
                                if (entity) {
                                    entity.visible = true;
                                }
                            }
                        });
                    }
                },
                {
                    title: "Hide All",
                    getEnabled: function (context) {
                        return (context.viewer.scene.visibleObjectIds.length > 0);
                    },
                    doAction: function (context) {
                        context.viewer.scene.setObjectsVisible(context.viewer.scene.visibleObjectIds, false);
                    }
                }
            ],
            [
                {
                    title: "Show",
                    doAction: function (context) {
                        context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                            if (treeViewNode.objectId) {
                                const entity = context.viewer.scene.objects[treeViewNode.objectId];
                                if (entity) {
                                    entity.visible = true;
                                    entity.xrayed = false;
                                    entity.selected = false;
                                }
                            }
                        });
                    }
                },
                {
                    title: "Show Others",
                    doAction: function (context) {
                        const scene = context.viewer.scene;
                        scene.setObjectsVisible(scene.objectIds, true);
                        scene.setObjectsXRayed(scene.xrayedObjectIds, false);
                        scene.setObjectsSelected(scene.selectedObjectIds, false);
                        context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                            if (treeViewNode.objectId) {
                                const entity = scene.objects[treeViewNode.objectId];
                                if (entity) {
                                    entity.visible = false;
                                }
                            }
                        });
                    }
                },
                {
                    title: "Show All",
                    getEnabled: function (context) {
                        const scene = context.viewer.scene;
                        return (scene.numVisibleObjects < scene.numObjects);
                    },
                    doAction: function (context) {
                        const scene = context.viewer.scene;
                        scene.setObjectsVisible(scene.objectIds, true);
                        scene.setObjectsXRayed(scene.xrayedObjectIds, false);
                        scene.setObjectsSelected(scene.selectedObjectIds, false);
                    }
                }
            ],
            [
                {
                    title: "X-Ray",
                    doAction: function (context) {
                        context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                            if (treeViewNode.objectId) {
                                const entity = context.viewer.scene.objects[treeViewNode.objectId];
                                if (entity) {
                                    entity.xrayed = true;
                                    entity.visible = true;
                                }
                            }
                        });
                    }
                },
                {
                    title: "Undo X-Ray",
                    doAction: function (context) {
                        context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                            if (treeViewNode.objectId) {
                                const entity = context.viewer.scene.objects[treeViewNode.objectId];
                                if (entity) {
                                    entity.xrayed = false;
                                }
                            }
                        });
                    }
                },
                {
                    title: "X-Ray Others",
                    doAction: function (context) {
                        const scene = context.viewer.scene;
                        scene.setObjectsVisible(scene.objectIds, true);
                        scene.setObjectsXRayed(scene.objectIds, true);
                        scene.setObjectsSelected(scene.selectedObjectIds, false);
                        scene.setObjectsHighlighted(scene.highlightedObjectIds, false);
                        context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                            if (treeViewNode.objectId) {
                                const entity = scene.objects[treeViewNode.objectId];
                                if (entity) {
                                    entity.xrayed = false;
                                }
                            }
                        });
                    }
                },
                {
                    title: "Reset X-Ray",
                    getEnabled: function (context) {
                        return (context.viewer.scene.numXRayedObjects > 0);
                    },
                    doAction: function (context) {
                        context.viewer.scene.setObjectsXRayed(context.viewer.scene.xrayedObjectIds, false);
                    }
                }
            ],
            [
                {
                    title: "Select",
                    doAction: function (context) {
                        context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                            if (treeViewNode.objectId) {
                                const entity = context.viewer.scene.objects[treeViewNode.objectId];
                                if (entity) {
                                    entity.selected = true;
                                    entity.visible = true;
                                }
                            }
                        });
                    }
                },
                {
                    title: "Deselect",
                    doAction: function (context) {
                        context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                            if (treeViewNode.objectId) {
                                const entity = context.viewer.scene.objects[treeViewNode.objectId];
                                if (entity) {
                                    entity.selected = false;
                                }
                            }
                        });
                    }
                },
                {
                    title: "Clear Selection",
                    getEnabled: function (context) {
                        return (context.viewer.scene.numSelectedObjects > 0);
                    },
                    doAction: function (context) {
                        context.viewer.scene.setObjectsSelected(context.viewer.scene.selectedObjectIds, false);
                    }
                }
            ]
        ]
    });

    // Right-clicking on a tree node shows the context menu for that node
    treeView.on("contextmenu", (e) => {
        treeViewContextMenu.context = { // Must set context before opening menu
            viewer: e.viewer,
            treeViewPlugin: e.treeViewPlugin,
            treeViewNode: e.treeViewNode,
            entity: e.viewer.scene.objects[e.treeViewNode.objectId] // Only defined if tree node is a leaf node
        };

        treeViewContextMenu.show(e.event.pageX, e.event.pageY);
    });

    // Left-clicking on a tree node isolates that object in the 3D view
    treeView.on("nodeTitleClicked", (e) => {
        const scene = viewer.scene;
        const objectIds = [];

        e.treeViewPlugin.withNodeTree(e.treeViewNode, (treeViewNode) => {
            if (treeViewNode.objectId) {
                objectIds.push(treeViewNode.objectId);
            }
        });

        e.treeViewPlugin.unShowNode();
        scene.setObjectsXRayed(scene.objectIds, true);
        scene.setObjectsVisible(scene.objectIds, true);
        scene.setObjectsXRayed(objectIds, false);
        viewer.cameraFlight.flyTo({
            aabb: scene.getAABB(objectIds),
            duration: 0.5
        }, () => {
            setTimeout(function () {
                scene.setObjectsVisible(scene.xrayedObjectIds, false);
                scene.setObjectsXRayed(scene.xrayedObjectIds, false);
            }, 500);
        });
    });
}

window.viewer = viewer;
window.ifcConverter = ifcConverter;