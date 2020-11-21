import { globals } from "./pdf2md.global"


export interface Font {
    name: string | null
}

export interface Rect {
    x: number
    y: number
    width: number
    height: number
}

export interface Image extends Rect {
    url: string
}

export interface Word extends Rect {
    text: string
    font: string

}

export interface ItemTransformer<T> {
    (value: T): T
}

type TextTransformer = ItemTransformer<string>

const FILLER = ' ¶ '

export class EnhancedWord implements Word {
    x: number
    y: number
    width: number
    height: number
    text: string
    font: string

    private _transformer?: TextTransformer

    constructor(w: Word) {
        this.x = w.x
        this.y = w.y
        this.width = w.width
        this.height = w.height
        this.text = w.text
        this.font = w.font
    }
   
    appendWord(w: Word, isLastWord:boolean ) {

        let result = false
        const endX = this.x + this.width

        const canConcatFilter = (endX < w.x)
        const canAppendWord = this.height === w.height && this.font === w.font
        const fillerWidth = w.x - endX    

        const isWordTextBlank = w.text.trim().length === 0

        if (canAppendWord) {

            if( canConcatFilter && !isWordTextBlank && globals.isFillerEnabled ) {
                this.text += FILLER.concat(w.text)
                this.width += w.width + fillerWidth    
            }
            else {
                this.text += w.text
                this.width += w.width          
            }
            result = true  
        }     
        else if( isLastWord && canConcatFilter && !isWordTextBlank && globals.isFillerEnabled)  {
            this.text += FILLER.concat(w.text)
            this.width += w.width + fillerWidth    
        }

        return result
    }

    addTransformer(transformer: TextTransformer) {
        if (this._transformer) return false // GUARD

        this._transformer = transformer

        ////////////////////////////////////
        // SUPPORT TRANSFORMER DEBUG
        ////////////////////////////////////
        // this._transformer = ( text:string ) => {
        //     console.log( `transforming text ${text}`)
        //     const result = transformer( text )
        //     console.log( `transform text ${text} to ${result}`)
        //     return result   
        // }

        ////////////////////////////////////
        // SUPPORT TRANSFORMER CHAIN
        ////////////////////////////////////

        // const prev = this._transformer
        // this._transformer =  ( prev ) ?
        //     ( text:string ) => transformer(prev(text)) :
        //     transformer
        
    }

    toMarkdown() {
        return ( this._transformer ) ? this._transformer(this.text) : this.text
    }

}



