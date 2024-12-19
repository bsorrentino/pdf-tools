import { globals } from "./pdf2md.global"
/**
 * Represents a font with an optional name.
 * @interface Font
 * @property {string | null} name - The name of the font, or null if not available.
 */
export interface Font {
    name: string | null
}
/**
 * Represents a rectangle with position and size.
 * @property {number} x - The x-coordinate of the top-left corner of the rectangle.
 * @property {number} y - The y-coordinate of the top-left corner of the rectangle.
 * @property {number} width - The width of the rectangle.
 * @property {number} height - The height of the rectangle.
 */
export interface Rect {
    x: number
    y: number
    width: number
    height: number
}
/**
 * Represents an image that extends the Rect interface.
 * @property {string} url - The URL of the image.
 */
export interface Image extends Rect {
    url: string
}
/**
 * Interface representing a word with additional properties.
 *
 * @interface Word
 * @extends {Rect}
 * @property {string} text - The text content of the word.
 * @property {string} font - The font style for the text.
 */
export interface Word extends Rect {
    text: string
    font: string
}
/**
 * @typedef {function(T): T} ItemTransformer
 * A function that takes a value of type `T` and returns a value of the same type `T`.
 *
 * @template T - The type of the input and output values.
 */
export interface ItemTransformer<T> {
    (value: T): T
}
/**
 * @typedef {ItemTransformer<string>} TextTransformer
 */
type TextTransformer = ItemTransformer<string>
const FILLER = ' ¶ '
/**
 * @param {TextTransformer} transformer - A function that transforms the text.
 */
export class EnhancedWord implements Word {
    x: number
    y: number
    width: number
    height: number
    text: string
    font: string
    link?:PDFLink

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

            if( canConcatFilter && !isWordTextBlank && globals.options.filler ) {
                this.text += FILLER.concat(w.text)
                this.width += w.width + fillerWidth    
            }
            else {
                this.text += w.text
                this.width += w.width          
            }
            result = true  
        }     
        else if( isLastWord && canConcatFilter && !isWordTextBlank && globals.options.filler)  {
            this.text += FILLER.concat(w.text)
            this.width += w.width + fillerWidth    
        }

        return result
    }

    addTransformer(transformer: TextTransformer) {
        // if (this._transformer) return false // GUARD
        // this._transformer = transformer

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

        const prev = this._transformer
        this._transformer =  ( prev ) ?
            ( text:string ) => transformer( prev(text) ) :
            transformer
        
    }
    
    toMarkdown() {

        const processedResult = (this._transformer) ? 
                    this._transformer(this.text) : this.text

        const result = (processedResult && globals.options.debug) ? 
                                `<!--${this.font}-->${processedResult}` : 
                                processedResult

        // console.log( `toMarkdown:\n\t${this.text}\n\t${result}`)

        return result
    }

}