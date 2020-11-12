// A abstract PageItem class, can be TextItem, LineItem or LineItemBlock

import Annotation from "./Annotation";


type PageItemType = {
    name:string
}

export default class PageItem {
    type:PageItemType|null
    annotation:Annotation
    parsedElements:any    

    constructor( options:{
        type:PageItemType,
        annotation:Annotation,
        parsedElements:any        
    }
    ) {
        this.type = options.type,
        this.annotation = options.annotation,
        this.parsedElements = options.parsedElements    
    
    }

}

export class ParsedElements {
    footnoteLinks:any
    footnotes:any
    containLinks:any
    formattedWords:any

    constructor( options:{
        footnoteLinks:Array<number>,
        footnotes:Array<string>,
        containLinks:boolean,
        formattedWords:number}
    ){
        this.footnoteLinks = options.footnoteLinks
        this.footnotes = options.footnotes
        this.containLinks = options.footnotes
        this.formattedWords = options.footnotes
    }

    add(parsedElements:ParsedElements) {
        this.footnoteLinks = this.footnoteLinks.concat(parsedElements.footnoteLinks);
        this.footnotes = this.footnotes.concat(parsedElements.footnotes);
        this.containLinks = this.containLinks || parsedElements.containLinks;
        this.formattedWords += parsedElements.formattedWords;
    }

}