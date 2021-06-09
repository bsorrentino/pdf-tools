"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMarkdown = exports.isHeadline = void 0;
const assert_1 = __importDefault(require("assert"));
const enumify_1 = require("enumify");
const pdf2md_global_1 = require("./pdf2md.global");
class BlockType extends enumify_1.Enumify {
    constructor(options) {
        super();
        this.toText = options.toText;
    }
}
BlockType.H1 = new BlockType({
    toText: (block) => `# ${block}`
});
BlockType.H2 = new BlockType({
    toText: (block) => `## ${block}`
});
BlockType.H3 = new BlockType({
    toText: (block) => `### ${block}`
});
BlockType.H4 = new BlockType({
    toText: (block) => `#### ${block}`
});
BlockType.H5 = new BlockType({
    toText: (block) => `##### ${block}`
});
BlockType.H6 = new BlockType({
    toText: (block) => `###### ${block}`
});
BlockType.OVERFLOW = new BlockType({
    toText: (block) => block
});
BlockType._ = BlockType.closeEnum();
function isHeadline(type) {
    return type && type.enumKey.length == 2 && type.enumKey[0] === 'H';
}
exports.isHeadline = isHeadline;
const formatTextDetectingTrailingSpaces = (text, prefix, suffix) => {
    if (!suffix)
        suffix = prefix;
    const rx = /^(.+[^\s]?)(\s*)$/.exec(text);
    return (rx) ? `${prefix}${rx[1]}${suffix}${rx[2]}` : 'null';
};
class WordFormat extends enumify_1.Enumify {
    constructor(toText) {
        super();
        this.toText = toText;
    }
}
exports.default = WordFormat;
WordFormat.BOLD = new WordFormat((text) => formatTextDetectingTrailingSpaces(text, '**'));
WordFormat.OBLIQUE = new WordFormat((text) => formatTextDetectingTrailingSpaces(text, '_'));
WordFormat.BOLD_OBLIQUE = new WordFormat((text) => formatTextDetectingTrailingSpaces(text, '**_', '_**'));
WordFormat.MONOSPACE = new WordFormat((text) => formatTextDetectingTrailingSpaces(text, '`'));
WordFormat._ = WordFormat.closeEnum();
function blockTypeByLevel(level) {
    const blockType = BlockType.enumValues.find(e => e.enumKey == `H${level}`);
    if (!blockType) {
        console.warn(`Unsupported headline level: ${level} (supported are 1-6)`);
        return BlockType.OVERFLOW;
    }
    return blockType;
}
function detectHeaders(row) {
    if (row.enhancedText.length == 1) {
        const mostUsedHeight = pdf2md_global_1.globals.stats.mostUsedTextHeight;
        const etext = row.enhancedText[0];
        if (etext.height != mostUsedHeight || etext.font != pdf2md_global_1.globals.stats.mostUsedFont) {
            const level = pdf2md_global_1.globals.stats.textHeigths.findIndex(v => v == etext.height);
            assert_1.default(level >= 0, `height ${etext.height} not present in textHeights stats!`);
            const blockType = blockTypeByLevel(level + 1);
            etext.addTransformer(blockType.toText);
        }
    }
}
function detectFonts(row) {
    row.enhancedText.forEach(etext => {
        const fontId = etext.font;
        const font = pdf2md_global_1.globals.getFont(fontId);
        if (font && font.name != null) {
            const fontName = font.name.toLowerCase();
            const isBold = () => fontName.includes('bold');
            const isItalic = () => fontName.includes('oblique') || fontName.includes('italic');
            const isCode = () => fontName.includes('monospace') || fontName.includes('code');
            if (isBold() && isItalic()) {
                etext.addTransformer(WordFormat.BOLD_OBLIQUE.toText);
            }
            else if (isBold()) {
                etext.addTransformer(WordFormat.BOLD.toText);
            }
            else if (isItalic()) {
                etext.addTransformer(WordFormat.OBLIQUE.toText);
            }
            else if (isCode()) {
                etext.addTransformer(WordFormat.MONOSPACE.toText);
            }
            else if (fontName === pdf2md_global_1.globals.stats.maxHeightFont) {
                etext.addTransformer(WordFormat.BOLD_OBLIQUE.toText);
            }
        }
    });
}
function detectCodeBlock(page) {
    const codeFontId = pdf2md_global_1.globals.getFontIdByName('monospace') || pdf2md_global_1.globals.getFontIdByName('code');
    if (!codeFontId) {
        console.warn(`monospace or code font doesn't exists!`);
        return;
    }
    const candidateToBeInCodeBlock = (row) => (row.containsWords && row.enhancedText.length == 1 && row.enhancedText[0].font == codeFontId);
    const codeBlocks = Array();
    let currentCodeBlock = null;
    page.rows.forEach((row, index) => {
        if (candidateToBeInCodeBlock(row)) {
            const word = row.enhancedText[0];
            if (currentCodeBlock == null) {
                currentCodeBlock = { start: index, end: index, word: Object.assign(Object.assign({}, word), { text: '`' }) };
            }
            else {
                currentCodeBlock.end = index;
            }
        }
        else {
            if (currentCodeBlock != null && currentCodeBlock.end > currentCodeBlock.start) {
                currentCodeBlock.end = index;
                codeBlocks.push(currentCodeBlock);
            }
            currentCodeBlock = null;
        }
    });
    let offset = 0;
    codeBlocks.forEach(cb => {
        for (let ii = cb.start + offset; ii < cb.end + offset; ++ii) {
            page.rows[ii].enhancedText[0].addTransformer((text) => text);
        }
        page.insertRow(cb.start + offset++, cb.word);
        page.insertRow(cb.end + offset++, cb.word);
    });
}
function toMarkdown(page) {
    detectCodeBlock(page);
    const init = '';
    return page.rows.reduce((result, row, i) => {
        let md = '';
        if (row.images) {
            md = row.images.reduce((out, img) => out.concat(`![${img.url}](${pdf2md_global_1.globals.imageUrlPrefix}${img.url}.png)`), '');
        }
        if (row.containsWords) {
            detectHeaders(row);
            detectFonts(row);
            md += row.enhancedText.reduce((out, etext) => out.concat(etext.toMarkdown()), '');
        }
        return result.concat(md).concat('\n');
    }, init);
}
exports.toMarkdown = toMarkdown;
