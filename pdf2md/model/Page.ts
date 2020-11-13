import LineItem from "./LineItem";

type GenericItem = LineItem|string|{
    category: string,
    text: string
}|any

// A page which holds PageItems displayable via PdfPageView
export default class Page {
    index:number
    items:Array<GenericItem>  

    constructor( options:{index:number, items?:Array<GenericItem>} ) {
        this.index = options.index
        this.items = options.items || []
    }

}
