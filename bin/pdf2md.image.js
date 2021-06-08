"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writePageAsImage = exports.writePageImageOrReuseOneFromCache = void 0;
const canvas_1 = require("canvas");
const console_1 = require("console");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const jimp_1 = __importDefault(require("jimp"));
const pdf2md_global_1 = require("./pdf2md.global");
var PDFImageKind;
(function (PDFImageKind) {
    PDFImageKind[PDFImageKind["GRAYSCALE_1BPP"] = 1] = "GRAYSCALE_1BPP";
    PDFImageKind[PDFImageKind["RGB_24BPP"] = 2] = "RGB_24BPP";
    PDFImageKind[PDFImageKind["RGBA_32BPP"] = 3] = "RGBA_32BPP";
})(PDFImageKind || (PDFImageKind = {}));
const writeFileAsync = util_1.promisify(fs_1.default.writeFile);
const imagesCache = new Map();
async function writePageImageOrReuseOneFromCache(img, name) {
    let bytesPerPixel = 0;
    switch (img.kind) {
        case PDFImageKind.RGB_24BPP:
            bytesPerPixel = 3;
            break;
        case PDFImageKind.RGBA_32BPP:
            bytesPerPixel = 4;
            break;
        case PDFImageKind.GRAYSCALE_1BPP:
            console_1.assert(`kind ${img.kind} is not supported yet!`);
            bytesPerPixel = 1;
            break;
        default:
            console_1.assert(`kind ${img.kind} is not supported at all!`);
            break;
    }
    const jimg = new jimp_1.default(img.width, img.height);
    const byteWidth = (img.width * bytesPerPixel);
    for (var x = 0; x < img.width; x++) {
        for (var y = 0; y < img.height; y++) {
            const index = (y * byteWidth) + (x * bytesPerPixel);
            const r = img.data[index];
            const g = img.data[index + 1];
            const b = img.data[index + 2];
            const a = bytesPerPixel == 3 ? 255 : img.data[index + 3];
            const num = jimp_1.default.rgbaToInt(r, g, b, a);
            jimg.setPixelColor(num, x, y);
        }
    }
    let result;
    if (pdf2md_global_1.globals.useImageDuplicateDetection) {
        const imageHash = jimg.hash();
        const cachedItem = imagesCache.get(imageHash);
        if (cachedItem) {
            const equals = cachedItem.find(item => jimp_1.default.diff(jimg, item.jimg).percent == 0);
            if (equals) {
                result = equals.name;
            }
            else {
                cachedItem.push({ name: name, jimg: jimg });
            }
        }
        else {
            imagesCache.set(imageHash, [{ name: name, jimg: jimg }]);
        }
    }
    if (!result) {
        jimg.write(path_1.default.join(pdf2md_global_1.globals.outDir, `${name}.png`));
        return name;
    }
    return result;
}
exports.writePageImageOrReuseOneFromCache = writePageImageOrReuseOneFromCache;
class NodeCanvasFactory {
    create(width, height) {
        console_1.assert(width > 0 && height > 0, "Invalid canvas size");
        var canvas = canvas_1.createCanvas(width, height);
        var context = canvas.getContext("2d");
        return {
            canvas: canvas,
            context: context,
        };
    }
    reset(canvasAndContext, width, height) {
        console_1.assert(canvasAndContext.canvas, "Canvas is not specified");
        console_1.assert(width > 0 && height > 0, "Invalid canvas size");
        canvasAndContext.canvas.width = width;
        canvasAndContext.canvas.height = height;
    }
    destroy(canvasAndContext) {
        console_1.assert(canvasAndContext.canvas, "Canvas is not specified");
        canvasAndContext.canvas.width = 0;
        canvasAndContext.canvas.height = 0;
    }
}
async function writePageAsImage(page) {
    const viewport = page.getViewport({ scale: 1.0 });
    const canvasFactory = new NodeCanvasFactory();
    const canvasAndContext = canvasFactory.create(viewport.width, viewport.height);
    const renderContext = {
        canvasContext: canvasAndContext.context,
        viewport: viewport,
        canvasFactory: canvasFactory,
    };
    await page.render(renderContext).promise;
    const content = canvasAndContext.canvas.toBuffer();
    await writeFileAsync(path_1.default.join(pdf2md_global_1.globals.outDir, `page-${page.pageNumber}.png`), content);
}
exports.writePageAsImage = writePageAsImage;
