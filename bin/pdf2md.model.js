"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedWord = void 0;
const pdf2md_global_1 = require("./pdf2md.global");
const FILLER = ' ¶ ';
class EnhancedWord {
    constructor(w) {
        this.x = w.x;
        this.y = w.y;
        this.width = w.width;
        this.height = w.height;
        this.text = w.text;
        this.font = w.font;
    }
    appendWord(w, isLastWord) {
        let result = false;
        const endX = this.x + this.width;
        const canConcatFilter = (endX < w.x);
        const canAppendWord = this.height === w.height && this.font === w.font;
        const fillerWidth = w.x - endX;
        const isWordTextBlank = w.text.trim().length === 0;
        if (canAppendWord) {
            if (canConcatFilter && !isWordTextBlank && pdf2md_global_1.globals.options.filler) {
                this.text += FILLER.concat(w.text);
                this.width += w.width + fillerWidth;
            }
            else {
                this.text += w.text;
                this.width += w.width;
            }
            result = true;
        }
        else if (isLastWord && canConcatFilter && !isWordTextBlank && pdf2md_global_1.globals.options.filler) {
            this.text += FILLER.concat(w.text);
            this.width += w.width + fillerWidth;
        }
        return result;
    }
    addTransformer(transformer) {
        const prev = this._transformer;
        this._transformer = (prev) ?
            (text) => transformer(prev(text)) :
            transformer;
    }
    toMarkdown() {
        const processedResult = (this._transformer) ?
            this._transformer(this.text) : this.text;
        const result = (processedResult && pdf2md_global_1.globals.options.debug) ?
            `<!--${this.font}-->${processedResult}` :
            processedResult;
        return result;
    }
}
exports.EnhancedWord = EnhancedWord;
