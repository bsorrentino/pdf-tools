"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pdfToMarkdown = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const pdf2md_page_1 = require("./pdf2md.page");
const pdf2md_markdown_1 = require("./pdf2md.markdown");
const pdf2md_global_1 = require("./pdf2md.global");
const pdfjs_dist_1 = require("pdfjs-dist");
const CMAP_URL = "../../../node_modules/pdfjs-dist/cmaps/";
const CMAP_PACKED = true;
const readFile = util_1.promisify(fs_1.default.readFile);
const writeFile = util_1.promisify(fs_1.default.writeFile);
async function pdfToMarkdown(pdfPath) {
    try {
        const basename = path_1.default.basename(pdfPath, '.pdf');
        const fontFile = path_1.default.join(pdf2md_global_1.globals.outDir, `${basename}.fonts.json`);
        const outFile = path_1.default.join(pdf2md_global_1.globals.outDir, `${basename}.md`);
        pdf2md_global_1.globals.loadLocalFonts(fontFile);
        const data = new Uint8Array(await readFile(pdfPath));
        const pdfDocument = await pdfjs_dist_1.getDocument({
            data: data,
            cMapUrl: CMAP_URL,
            cMapPacked: CMAP_PACKED
        }).promise;
        const numPages = pdfDocument.numPages;
        const pages = Array(numPages);
        for (let i = 1; i <= numPages; i++) {
            const pdfPage = await pdfDocument.getPage(i);
            const page = await pdf2md_page_1.processPage(pdfPage);
            pages.push(page);
        }
        const content = pages.map(page => pdf2md_markdown_1.toMarkdown(page))
            .reduce((result, pageText) => result.concat(pageText), '');
        await writeFile(outFile, content);
        pdf2md_global_1.globals.saveFonts(fontFile);
        if (pdf2md_global_1.globals.options.debug) {
            pages.forEach(p => p.consoleLog());
        }
        if (pdf2md_global_1.globals.options.stats) {
            pdf2md_global_1.globals.consoleLog();
        }
    }
    catch (reason) {
        console.log(reason);
    }
}
exports.pdfToMarkdown = pdfToMarkdown;
