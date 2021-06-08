"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processPage = exports.Page = exports.Row = void 0;
const assert_1 = __importDefault(require("assert"));
const pdf2md_global_1 = require("./pdf2md.global");
const pdf2md_image_1 = require("./pdf2md.image");
const pdf2md_model_1 = require("./pdf2md.model");
const pdfjs_dist_1 = require("pdfjs-dist");
class ConsoleOutput {
    constructor() {
        this.lines = Array();
    }
    appendRow(row) {
        var _a;
        if (row.containsImages) {
            const v = (_a = row.images) === null || _a === void 0 ? void 0 : _a.map((img, i) => {
                this.lines.push({
                    y: img === null || img === void 0 ? void 0 : img.y,
                    width: img === null || img === void 0 ? void 0 : img.width,
                    x: img === null || img === void 0 ? void 0 : img.x,
                    height: img === null || img === void 0 ? void 0 : img.height,
                    image: (img === null || img === void 0 ? void 0 : img.url) || 'undefined'
                });
            });
        }
        if (row.containsWords) {
            const e = row.enhancedText;
            const formats = e.map((etext, i) => {
                const text = etext.text;
                const common = { height: etext.height, image: undefined, text: text, font: etext.font };
                if (i == 0) {
                    return Object.assign({ y: etext.y, width: etext.width, x: etext.x }, common);
                }
                return Object.assign({ width: etext.width, x: etext.x }, common);
            });
            this.lines.push(...formats);
        }
    }
}
class Row {
    constructor(args) {
        this.y = args.y;
        this._words = args.words;
        this._images = args.images;
        this._updateEnhancedText();
    }
    get containsWords() { return this._words !== undefined; }
    addWord(w) {
        var _a;
        (_a = this._words) === null || _a === void 0 ? void 0 : _a.push(w);
        this._updateEnhancedText();
    }
    get containsImages() { return this._images !== undefined; }
    addImage(img) {
        var _a;
        (_a = this._images) === null || _a === void 0 ? void 0 : _a.push(img);
    }
    _updateEnhancedText() {
        if (!this._words || this._words.length == 0)
            return;
        const init = {
            lastIndex: -1,
            result: Array()
        };
        this._etextArray = this._words.reduce((state, w, index, words) => {
            if (state.lastIndex < 0) {
                state.result.push(new pdf2md_model_1.EnhancedWord(w));
                state.lastIndex = 0;
            }
            else {
                const isLastWord = index === words.length - 1;
                const enhancedText = state.result[state.lastIndex];
                if (!enhancedText.appendWord(w, isLastWord)) {
                    state.result.push(new pdf2md_model_1.EnhancedWord(w));
                    state.lastIndex++;
                }
            }
            return state;
        }, init).result;
    }
    get enhancedText() {
        return this._etextArray;
    }
    get images() { return this._images; }
    containsTextWithHeight(height) {
        assert_1.default(this._etextArray, 'text array is undefined!');
        return this._etextArray.findIndex(etext => etext.height == height) >= 0;
    }
}
exports.Row = Row;
class Page {
    constructor() {
        this.rows = Array();
    }
    process(arg) {
        if ('text' in arg) {
            this.processWord(arg);
        }
        if ('url' in arg) {
            this.processImage(arg);
        }
        return this;
    }
    processImage(img) {
        let si = this.rows.findIndex(row => row.y == img.y);
        let row;
        if (si < 0) {
            row = new Row({ y: img.y, images: Array() });
            this.rows.push(row);
        }
        else {
            row = this.rows[si];
        }
        row.addImage(img);
        return this;
    }
    processWord(w) {
        let si = this.rows.findIndex(row => row.y === w.y);
        let row;
        if (si < 0) {
            row = new Row({ y: w.y, words: Array() });
            this.rows.push(row);
        }
        else {
            row = this.rows[si];
        }
        if (row.containsWords) {
            row.addWord(w);
        }
        return this;
    }
    insertRow(atIndex, w) {
        if (atIndex < 0 || atIndex >= this.rows.length)
            throw `atIndex ${atIndex} is out of range!`;
        const row = new Row({ y: w.y, words: [w] });
        this.rows.splice(atIndex, 0, row);
    }
    consoleLog() {
        const consoleOutput = new ConsoleOutput();
        this.rows.forEach(row => consoleOutput.appendRow(row));
        console.table(consoleOutput.lines);
    }
}
exports.Page = Page;
function mergeItemsArray(a, b) {
    return a.concat(b);
}
async function processPage(proxy) {
    const ops = await proxy.getOperatorList();
    let imageMatrix = null;
    const images = Array();
    ops.fnArray.forEach(async (fn, j) => {
        let args = ops.argsArray[j];
        switch (fn) {
            case pdfjs_dist_1.OPS.setFont:
                const fontId = args[0];
                let font;
                try {
                    font = proxy.objs.get(fontId);
                    if (font)
                        pdf2md_global_1.globals.addFont(fontId, font);
                }
                catch (e) {
                    pdf2md_global_1.globals.addFont(fontId, { name: '' });
                }
                break;
            case pdfjs_dist_1.OPS.transform:
                assert_1.default(j < ops.argsArray.length, `index ${j} exceed the argsArray size ${ops.argsArray.length}`);
                imageMatrix = args;
                break;
            case pdfjs_dist_1.OPS.paintJpegXObject:
            case pdfjs_dist_1.OPS.paintImageXObject:
                const position = { x: 0, y: 0 };
                if (imageMatrix) {
                    position.x = imageMatrix ? Math.round(imageMatrix[4]) : 0;
                    position.y = imageMatrix ? Math.round(imageMatrix[5]) : 0;
                }
                const imageName = args[0];
                try {
                    const img = proxy.objs.get(imageName);
                    if (img) {
                        const imageNameUsed = await pdf2md_image_1.writePageImageOrReuseOneFromCache(img, imageName);
                        images.push({
                            y: position.y,
                            x: position.x,
                            width: img.width,
                            height: img.height,
                            url: imageNameUsed
                        });
                    }
                }
                catch (e) {
                    console.warn(`image name ${imageName} not found!`);
                }
                imageMatrix = null;
                break;
            case pdfjs_dist_1.OPS.beginAnnotation:
            case pdfjs_dist_1.OPS.endAnnotation:
                console.log(args);
                break;
            default:
                break;
        }
    });
    const scale = 1.0;
    const viewport = proxy.getViewport({ scale: scale });
    const textContent = await proxy.getTextContent();
    const words = textContent.items.map(item => {
        const tx = pdfjs_dist_1.Util.transform(viewport.transform, item.transform);
        const fontHeight = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));
        const dividedHeight = item.height / fontHeight;
        const textRect = {
            x: Math.round(item.transform[4]),
            y: Math.round(item.transform[5]),
            width: Math.round(item.width),
            height: Math.round(dividedHeight <= 1 ? item.height : dividedHeight)
        };
        pdf2md_global_1.globals.addTextHeight(textRect.height);
        return Object.assign({ text: item.str, font: item.fontName }, textRect);
    });
    const items = mergeItemsArray(words, images);
    const page = items.sort((a, b) => {
        const r = b.y - a.y;
        return (r === 0) ? a.x - b.x : r;
    })
        .reduce((page, item) => page.process(item), new Page());
    return page;
}
exports.processPage = processPage;
