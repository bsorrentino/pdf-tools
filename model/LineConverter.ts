import TextItem from './TextItem';
import Word from './Word';
import WordType from './markdown/WordType';
import WordFormat from './markdown/WordFormat';
import LineItem from './LineItem';
import StashingStream from './StashingStream';
import { ParsedElements } from './PageItem';
import { isNumber, isListItemCharacter } from './stringFunctions'
import { sortByX } from './pageItemFunctions'

// Converts text items which have been grouped to a line (through TextItemLineGrouper) to a single LineItem doing inline transformations like 
//'whitespace removal', bold/emphasis annotation, link-detection, etc..
export default class LineConverter {

    fontToFormats:any
    
    constructor(fontToFormats:any) {
        this.fontToFormats = fontToFormats;
    }

    // returns a CombineResult 
    compact(textItems: TextItem[]) {
        // we can't trust order of occurence, esp. footnoteLinks like to come last
        sortByX(textItems);

        const wordStream = new WordDetectionStream(this.fontToFormats);
        wordStream.consumeAll(textItems.map(item => new TextItem({
            ...item
        })));
        const words = wordStream.complete();

        var maxHeight = 0;
        var widthSum = 0;
        textItems.forEach(item => {
            maxHeight = Math.max(maxHeight, item.height);
            widthSum += item.width;
        });
        return new LineItem({
            x: textItems[0].x,
            y: textItems[0].y,
            height: maxHeight,
            width: widthSum,
            words: words,
            parsedElements: new ParsedElements({
                footnoteLinks: wordStream.footnoteLinks,
                footnotes: wordStream.footnotes,
                containLinks: wordStream.containLinks,
                formattedWords: wordStream.formattedWords
            })
        });

    }

}

class WordDetectionStream extends StashingStream {
    fontToFormats:any
    footnoteLinks:Array<number> = []
    footnotes:Array<string> = []
    formattedWords = 0
    containLinks = false

    firstY = 0
    stashedNumber = false;
    currentItem?:any;

    constructor(fontToFormats:any) {
        super();
        this.fontToFormats = fontToFormats;
    }

    shouldStash(item:any) { 
        if (!this.firstY) {
            this.firstY = item.y;
        }
        this.currentItem = item;
        return true;
    }

    onPushOnStash(item:any) { 
        this.stashedNumber = isNumber(item.text.trim());
    }

    doMatchesStash(lastItem:any, item:any) {
        const lastItemFormat = this.fontToFormats.get(lastItem.font);
        const itemFormat = this.fontToFormats.get(item.font);
        if (lastItemFormat !== itemFormat) {
            return false;
        }
        const itemIsANumber = isNumber(item.text.trim());
        return this.stashedNumber == itemIsANumber;
    }

    doFlushStash(stash:Array<any>, results:Array<Word>) {
        if (this.stashedNumber) {
            const joinedNumber = stash.map(item => item.text).join('').trim();
            if (stash[0].y > this.firstY) { // footnote link
                results.push({
                    string: `${joinedNumber}`,
                    type: WordType.FOOTNOTE_LINK
                });
                this.footnoteLinks.push(parseInt(joinedNumber));
            } else if (this.currentItem && this.currentItem.y < stash[0].y) { // footnote
                results.push({
                    string: `${joinedNumber}`,
                    type: WordType.FOOTNOTE
                });
                this.footnotes.push(joinedNumber);
            } else {
                this.copyStashItemsAsText(stash, results);
            }
        } else {
            this.copyStashItemsAsText(stash, results);
        }
    }

    copyStashItemsAsText(stash:Array<any>, results:Array<Word>) {
        const format = this.fontToFormats.get(stash[0].font);
        results.push(...this.itemsToWords(stash, format));
    }

    itemsToWords(items:Array<any>, formatName:string):Array<Word> {
        const combinedText = combineText(items);
        const words = combinedText.split(' ');
        const format = formatName ? WordFormat.enumValueOf(formatName) : null;
        return words.filter(w => w.trim().length > 0).map(word => {
            var type = null;
            if (word.startsWith('http:')) {
                this.containLinks = true;
                type = WordType.LINK;
            } else if (word.startsWith('www.')) {
                this.containLinks = true;
                word = `http://${word}`
                type = WordType.LINK;
            }

            if (format) {
                this.formattedWords++;
            }
            return {
                string: word,
                type: type,
                format: format
            };
        });
    }
}


function combineText(textItems:Array<any>) {
    var text = '';
    var lastItem:any;
    textItems.forEach(textItem => {
        var textToAdd = textItem.text;
        if (!text.endsWith(' ') && !textToAdd.startsWith(' ')) {
            if (lastItem) {
                const xDistance = textItem.x - lastItem.x - lastItem.width;
                if (xDistance > 5) {
                    text += ' ';
                }
            } else {
                if (isListItemCharacter(textItem.text)) {
                    textToAdd += ' ';
                }
            }
        }
        text += textToAdd;
        lastItem = textItem;
    });
    return text;
}
