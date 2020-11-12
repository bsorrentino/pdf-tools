import PageItem from "./PageItem";

export type PageItems = Array<PageItem|string|{
    category: string,
    text: string
}|any>

// A page which holds PageItems displayable via PdfPageView
export default class Page {

    constructor( 
        public index:number, 
        public items:PageItems = [])  
        {}

}
