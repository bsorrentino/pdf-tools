import { normalizedCharCodeArray } from '../stringFunctions'
import LineItem from './LineItem';

export default class HeadlineFinder {
    headlineCharCodes:any
    stackedLineItems:Array<LineItem> = [];
    stackedChars = 0;

    constructor( options: { headline:any } ) {
        this.headlineCharCodes = normalizedCharCodeArray(options.headline);
        this.stackedLineItems = [];
        this.stackedChars = 0;
    }

    consume(lineItem:LineItem) {
        //TODO avoid join
        const normalizedCharCodes = normalizedCharCodeArray(lineItem.text());
        const matchAll = this.matchAll(normalizedCharCodes);
        if (matchAll) {
            this.stackedLineItems.push(lineItem);
            this.stackedChars += normalizedCharCodes.length;
            if (this.stackedChars == this.headlineCharCodes.length) {
                return this.stackedLineItems;
            }
        } else {
            if (this.stackedChars > 0) {
                this.stackedChars = 0;
                this.stackedLineItems = [];
                this.consume(lineItem); // test again without stack
            }
        }
        return null;
    }

    matchAll(normalizedCharCodes:number[]) {
        for (var i = 0; i < normalizedCharCodes.length; i++) {
            const headlineChar = this.headlineCharCodes[this.stackedChars + i];
            const textItemChar = normalizedCharCodes[i];
            if (textItemChar != headlineChar) {
                return false;
            }
        }
        return true;
    }
}
