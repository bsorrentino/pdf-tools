import { Enumify } from 'enumify';

// The format of a word element
export default class WordFormat extends Enumify {
    constructor(public startSymbol: string, public endSymbol: string) { super() }

    static BOLD = new WordFormat('**', '**')
    static OBLIQUE = new WordFormat('_', '_')
    static BOLD_OBLIQUE = new WordFormat('**_', '_**')
    static _ = WordFormat.closeEnum()
}