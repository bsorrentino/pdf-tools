"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
require("pdfjs-dist/legacy/build/pdf.js");
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const path_1 = __importDefault(require("path"));
const pdf2md_image_1 = require("./pdf2md.image");
const pdf2md_global_1 = require("./pdf2md.global");
const commander_1 = require("commander");
const console_1 = require("console");
const pdf2md_main_1 = require("./pdf2md.main");
const pdfjs_dist_1 = require("pdfjs-dist");
const CMAP_URL = "../../../node_modules/pdfjs-dist/cmaps/";
const CMAP_PACKED = true;
const readFile = util_1.promisify(fs_1.default.readFile);
const checkFileExistsAsync = util_1.promisify(fs_1.default.access);
const mkdirAsync = util_1.promisify(fs_1.default.mkdir);
async function createFolderIfDoesntExist(path) {
    console_1.assert(path, `provided path is not valid`);
    try {
        await checkFileExistsAsync(path);
    }
    catch (e) {
        console.log(`folder ${path} doesn't exist, try to create`);
        await mkdirAsync(path);
    }
    return path;
}
async function extractImagesfromPages(pdfPath) {
    try {
        const data = new Uint8Array(await readFile(pdfPath));
        const pdfDocument = await pdfjs_dist_1.getDocument({
            data: data,
            cMapUrl: CMAP_URL,
            cMapPacked: CMAP_PACKED,
        }).promise;
        const pages = pdfDocument.numPages;
        for (let i = 1; i <= pages; i++) {
            const page = await pdfDocument.getPage(i);
            const ops = await page.getOperatorList();
            for (let j = 0; j < ops.fnArray.length; j++) {
                if (ops.fnArray[j] == pdfjs_dist_1.OPS.paintJpegXObject || ops.fnArray[j] == pdfjs_dist_1.OPS.paintImageXObject) {
                    const op = ops.argsArray[j][0];
                    const img = page.objs.get(op);
                    await pdf2md_image_1.writePageImageOrReuseOneFromCache(img, op);
                }
            }
        }
    }
    catch (reason) {
        console.log(reason);
    }
}
async function savePagesAsImages(pdfPath) {
    try {
        const data = new Uint8Array(await readFile(pdfPath));
        const pdfDocument = await pdfjs_dist_1.getDocument({
            data: data,
            cMapUrl: CMAP_URL,
            cMapPacked: CMAP_PACKED,
        }).promise;
        const pages = pdfDocument.numPages;
        for (let i = 1; i <= pages; i++) {
            const page = await pdfDocument.getPage(i);
            await pdf2md_image_1.writePageAsImage(page);
        }
    }
    catch (reason) {
        console.log(reason);
    }
}
async function run() {
    const choosePath = (pdfPath, cmdobj) => (cmdobj.parent.outdir) ?
        cmdobj.parent.outdir :
        path_1.default.basename(pdfPath, '.pdf');
    commander_1.program.version('0.4.0')
        .name('pdftools')
        .option('-o, --outdir [folder]', 'output folder');
    commander_1.program.command('pdfximages <pdf>')
        .description('extract images (as png) from pdf and save it to the given folder')
        .alias('pxi')
        .action(async (pdfPath, cmdobj) => {
        pdf2md_global_1.globals.outDir = await createFolderIfDoesntExist(choosePath(pdfPath, cmdobj));
        return extractImagesfromPages(pdfPath);
    });
    commander_1.program.command('pdf2images <pdf>')
        .description('create an image (as png) for each pdf page')
        .alias('p2i')
        .action(async (pdfPath, cmdobj) => {
        pdf2md_global_1.globals.outDir = await createFolderIfDoesntExist(choosePath(pdfPath, cmdobj));
        return savePagesAsImages(pdfPath);
    });
    commander_1.program.command('pdf2md <pdf>')
        .description('convert pdf to markdown format.')
        .alias('p2md')
        .option('--imageurl [url prefix]', 'imgage url prefix')
        .option('--stats', 'print stats information')
        .option('--debug', 'print debug information')
        .action(async (pdfPath, cmdobj) => {
        pdf2md_global_1.globals.outDir = await createFolderIfDoesntExist(choosePath(pdfPath, cmdobj));
        if (cmdobj.imageurl) {
            pdf2md_global_1.globals.imageUrlPrefix = cmdobj.imageurl;
        }
        pdf2md_global_1.globals.options.debug = cmdobj.debug;
        pdf2md_global_1.globals.options.stats = cmdobj.stats;
        await pdf2md_main_1.pdfToMarkdown(pdfPath);
    });
    return await commander_1.program.parseAsync(process.argv);
}
exports.run = run;
