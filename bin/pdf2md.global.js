"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globals = void 0;
const assert_1 = __importDefault(require("assert"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const checkFileExistsAsync = util_1.promisify(fs_1.default.access);
const readFileAsync = util_1.promisify(fs_1.default.readFile);
const writeFileAsync = util_1.promisify(fs_1.default.writeFile);
class Globals {
    constructor() {
        this._fontMap = new Map();
        this._textHeights = new Map();
        this._imageUrlPrefix = process.env['IMAGE_URL'] || '';
        this._options = {
            filler: false,
            debug: false,
            stats: false
        };
        this._stats = null;
        this.outDir = path_1.default.join(process.cwd(), 'out');
    }
    get useImageDuplicateDetection() { return true; }
    get options() { return this._options; }
    addFont(fontId, font) {
        assert_1.default(font, `font ${fontId} is not valid ${font}`);
        let value = this._fontMap.get(fontId) || Object.assign(Object.assign({}, font), { occurrence: 0 });
        value.occurrence++;
        this._fontMap.set(fontId, value);
    }
    getFont(fontId) {
        return this._fontMap.get(fontId);
    }
    getFontIdByName(name) {
        for (const [k, f] of this._fontMap.entries())
            if (f.name == name)
                return k;
    }
    addTextHeight(height) {
        let occurrence = this._textHeights.get(height) || 0;
        this._textHeights.set(height, ++occurrence);
    }
    get stats() {
        if (!this._stats) {
            const calculateMostUsedFont = () => {
                const [k, _] = Array.from(this._fontMap.entries()).reduce(([k1, v1], [k, v]) => (v.occurrence > v1.occurrence) ? [k, v] : [k1, v1], ['', { occurrence: 0 }]);
                return k;
            };
            const calculateMaxTextHeight = () => Array.from(this._textHeights.keys()).reduce((result, h) => (h > result) ? h : result);
            const calculateMostUsedTextHeight = () => {
                const [k, _] = Array.from(this._textHeights.entries()).reduce(([k1, v1], [k, v]) => (v > v1) ? [k, v] : [k1, v1], [0, -1]);
                return k;
            };
            this._stats = {
                maxTextHeight: calculateMaxTextHeight(),
                maxHeightFont: null,
                mostUsedFont: calculateMostUsedFont(),
                mostUsedTextHeight: calculateMostUsedTextHeight(),
                textHeigths: Array.from(this._textHeights.keys()).sort((a, b) => b - a),
                mostUsedTextDistanceY: -1,
            };
        }
        return this._stats;
    }
    async loadLocalFonts(fontsFile) {
        try {
            await checkFileExistsAsync(fontsFile);
        }
        catch (e) {
            console.warn(`WARN: file ${fontsFile} doesn't exists!`);
            return;
        }
        try {
            const contents = await readFileAsync(fontsFile);
            const fonts = JSON.parse(contents.toString());
            Object.entries(fonts).forEach(([k, v]) => this.addFont(k, v));
        }
        catch (e) {
            console.warn(`WARN: error loading and evaluating ${fontsFile}! - ${e.message}`);
        }
    }
    async saveFonts(fontsFile) {
        try {
            await checkFileExistsAsync(fontsFile);
            console.warn(`WARN: file ${fontsFile} already exists!`);
            return;
        }
        catch (e) {
        }
        try {
            const init = {};
            const contents = Array.from(this._fontMap.entries())
                .sort((e1, e2) => e1[1].occurrence - e2[1].occurrence)
                .reduce((result, e) => { result[e[0]] = e[1]; return result; }, init);
            await writeFileAsync(fontsFile, JSON.stringify(contents));
        }
        catch (e) {
            console.warn(`WARN: error writing ${fontsFile}! - ${e.message}`);
        }
    }
    get imageUrlPrefix() {
        return this._imageUrlPrefix;
    }
    set imageUrlPrefix(value) {
        if (!value || value.trim().length === 0)
            return;
        this._imageUrlPrefix = value.endsWith('/') ? value : value.concat('/');
    }
    consoleLog() {
        const log = [Object.assign(Object.assign({}, this.stats), { textHeigths: JSON.stringify(this.stats.textHeigths) })];
        console.table(log);
    }
}
exports.globals = new Globals();
