import LineItem from "./LineItem";

type GenericItem = LineItem|string|{
    category: string,
    text: string
}|any

// A page which holds PageItems displayable via PdfPageView
export default class Page {

    constructor( 
        public index:number, 
        public items:Array<GenericItem> = [])  
        {}

}
