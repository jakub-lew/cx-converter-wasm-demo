//import * as xeokitConvert from 'xeokit-convert'
//@ts-ignore
import { writeXKTModelToArrayBuffer, XKTModel, parseGLTFIntoXKTModel } from '@xeokit/xeokit-convert/dist/xeokit-convert.es.js';
import { IfcConverter } from '@creooxag/cxconverter';

export class XktConverter {
    private ifcConverter?: IfcConverter;
    private xktClb?: (xktModel: XKTModel) => void;
    private metaDataClb?: (metaData: { [key: string]: any }) => void;
    private allReadyClb?: () => void;
    private constructor() {            }
    private async init(ifcConverterInputOptions: string = IfcConverter.getDefaultInputOptions()){
        this.ifcConverter = await IfcConverter.create(ifcConverterInputOptions);
        this.ifcConverter.registerGltfChunkDoneCallback(this.prepareXKTonlyGeom.bind(this));
        this.ifcConverter.registerMetaDataCompleteCallback(this.handleMetaData.bind(this));
        this.ifcConverter.registerGltfCompleteCallback(this.allChunksReceived.bind(this));        
    } 
    static async create(ifcConverterInputOptions: string = IfcConverter.getDefaultInputOptions()): Promise<XktConverter>{
        let xktConverter = new XktConverter();
        await xktConverter.init(ifcConverterInputOptions);
        return xktConverter;
    }
    registerXKTCallback(xktClb: (xktModel: Uint8Array) => void) {
        this.xktClb = xktClb;
    }
    registerMetaDataCallback(metaDataClb: (metaData: { [key: string]: any }) => void) {
        this.metaDataClb = metaDataClb;
    }
    registerAllReadyCallback(allReadyClb: () => void) {
        this.allReadyClb = allReadyClb;
    }
    registerProgressCallback(progressCallback: (progress: number) => void) {
        this.ifcConverter!.registerProgressCallback(progressCallback);
    }
    registerProgressTextCallback(progressTextCallback: (progressText: string) => void) {
        this.ifcConverter!.registerProgressTextCallback(progressTextCallback);
    }

    async ifcToXKTs(data: string, ifcConverterLoadOptions: any = IfcConverter.getDefaultLoadOptions()) {
        this.ifcConverter!.loadModel(data, ifcConverterLoadOptions);
    }

    private totalChunksCount = 0;
    private chunksProgress = 0;
    private allChunksReceivedFromConverter = false;
    private metaDataLoaded = false;

    async handleMetaData(metaData: { [key: string]: any }) {
        this.metaDataLoaded = true;
        if (this.metaDataClb)
            this.metaDataClb(metaData);
        this.checkIfAllReadyAndLaunchCallback();
    }

    async prepareXKT(gltf: string, metaData?: { [key: string]: any }) {
        let arrayBuf: Uint8Array | undefined = undefined;
        this.totalChunksCount++;
        if (gltf != undefined) {
            const xktModel = new XKTModel();
            // @ts-ignore
            const xkt = await parseGLTFIntoXKTModel({ data: gltf, xktModel: xktModel, log: (msg: any) => { console.log(`parseGLTFIntoXKTModel: ` + msg); } });
            await xktModel.finalize();
            arrayBuf = await writeXKTModelToArrayBuffer(xktModel, metaData, {}, {}, false);            
            this.chunksProgress++;
            if (this.xktClb)
                this.xktClb(arrayBuf);
        }
        this.checkIfAllReadyAndLaunchCallback();
    }

    async prepareXKTonlyGeom(gltf: string) {
        return this.prepareXKT(gltf, undefined);
    }

    async allChunksReceived() {
        this.allChunksReceivedFromConverter = true;
        this.checkIfAllReadyAndLaunchCallback();
    }

    async checkIfAllReadyAndLaunchCallback() {
        if (this.allChunksReceivedFromConverter &&
            this.chunksProgress == this.totalChunksCount &&
            this.metaDataLoaded
        ) {
            if (this.allReadyClb)
                this.allReadyClb();
        }
    }
}