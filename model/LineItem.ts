import PageItem from './PageItem'
import Word from './Word'

//A line within a page
export default class LineItem extends PageItem {

    x:number
    y:number
    width:number
    height:number
    words:Array<Word>

    constructor(options:any) {
        super(options);
        this.x = options.x;
        this.y = options.y;
        this.width = options.width;
        this.height = options.height;
        this.words = options.words || [];
        if (options.text && !options.words) {
            this.words = options.text.split(" ")
                            .filter( (str:string) => str.trim().length > 0)
                            .map( (wordAsString:string) => { string: wordAsString} );
        }
    }

    text() {
        return this.wordStrings().join(" ");
    }

    wordStrings() {
        return this.words.map(word => word.string);
    }

}
