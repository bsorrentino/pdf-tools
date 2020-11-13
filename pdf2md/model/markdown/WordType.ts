import { Enumify } from 'enumify';
import LineItem from '../LineItem';
import WordFormat from './WordFormat';

type ToText = ( string:string ) => string

// An Markdown word element
export default class WordType extends Enumify {
    toText:ToText
    attachWithoutWhitespace:boolean
    plainTextFormat: boolean

    constructor( options:{ toText:ToText, attachWithoutWhitespace?:boolean, plainTextFormat?:boolean} ) {
        super()

        this.toText = options.toText
        this.attachWithoutWhitespace = options.attachWithoutWhitespace || false
        this.plainTextFormat = options.plainTextFormat || false
    
    }
    static LINK = new WordType({
        toText(string) {
            return `[${string}](${string})`
        }
    })
    static FOOTNOTE_LINK = new WordType({
        attachWithoutWhitespace: true,
        plainTextFormat: true,
        toText(string) {
            return `^${string}`
        // return `<sup>[${string}](#${string})</sup>`;
        }
    })
    static FOOTNOTE = new WordType( {
        toText(string) {
            return `(^${string})`
        }
    })

    static _ = WordType.closeEnum()
}

export function linesToText(lineItems:Array<LineItem>, disableInlineFormats:boolean) {
    var text = '';
    let openFormat:WordFormat|null;

    const closeFormat = () => {
        text += openFormat?.endSymbol;
        openFormat = null;
    };

    lineItems.forEach((line:LineItem, lineIndex) => {
        line.words.forEach((word, i) => {
            const wordType = word.type;
            const wordFormat = word.format;
            if (openFormat && (!wordFormat || wordFormat !== openFormat)) {
                closeFormat();
            }

            if (i > 0 && !(wordType && wordType.attachWithoutWhitespace) && !isPunctationCharacter(word.string)) {
                text += ' ';
            }

            if (wordFormat && !openFormat && (!disableInlineFormats)) {
                openFormat = wordFormat;
                text += openFormat.startSymbol;
            }

            if (wordType && (!disableInlineFormats || wordType.plainTextFormat)) {
                text += wordType.toText(word.string);
            } else {
                text += word.string;
            }
        });
        if (openFormat && (lineIndex == lineItems.length - 1 || firstFormat(lineItems[lineIndex + 1]) !== openFormat)) {
            closeFormat();
        }
        text += '\n';
    });
    return text;
}

function firstFormat(lineItem:LineItem) {
    if (lineItem.words.length == 0) {
        return null;
    }
    return lineItem.words[0].format;
}

function isPunctationCharacter(string:string) {
    if (string.length != 1) {
        return false;
    }
    return string[0] === '.' || string[0] === '!' || string[0] === '?';
}