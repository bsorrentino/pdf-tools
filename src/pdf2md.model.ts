import assert = require('assert')
import path from 'path'
import { loadLocalFonts } from './pdf2md.font'

export interface Font {
    name:string|null
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
    ( value:T ):T
}

type TextTransformer =  ItemTransformer<string>

export class EnhancedText {
    height: number
    font: string
    private _text: string
    private _transformer?: TextTransformer

    constructor(w: Word) {
        this.height = w.height
        this.font = w.font
        this._text = w.text
    }

    canAppendWord(w: Word) {
        return (this.height === w.height && this.font === w.font)
    }

    appendWord(w: Word) {
        if (this.canAppendWord(w)) {
            this._text += w.text
            return true
        }
        return false
    }

    addTransformer( transformer:TextTransformer ) {
        if( this._transformer ) return false

        this._transformer = transformer
        
        // const prev = this._transformer

        // this._transformer =  ( prev ) ?
        //     ( text:string ) => transformer(prev(text)) :
        //     transformer
    }

    get text() {
        return ( this._transformer ) ? this._transformer( this._text ) : this._text
    }
}


type FontStat = Font & { occurrence:number }

export interface Stats {
    mostUsedFont:string // fontId
    mostUsedTextHeight:number    
    mostUsedTextDistanceY:number
    maxTextHeight:number
    maxHeightFont:string|null
    textHeigths:Array<number>
}

export class Globals {
    //mostUsedFont: Font|null = null
    //maxHeightFont = 0 
    //mostUsedDistance = 0
    //mostUsedHeight: number = 0
    //maxHeight  = 0

    private _fontMap = new Map<string, FontStat>()
    private _textHeights = new Map<number,number>()
  
    outDir:string
    imageUrlPrefix:string

    /**
     * 
     * @param fontId 
     * @param font 
     */
    addFont( fontId:string, font:Font ) {

        assert( font, `font ${fontId} is not valid ${font}`)

        let value = this._fontMap.get( fontId ) || { ...font, occurrence: 0}   
        
        value.occurrence++

        this._fontMap.set( fontId, value )

    }

    /**
     * 
     * @param fontId 
     */
    getFont( fontId:string ):Font|undefined {
        return this._fontMap.get( fontId ) as Font
    }

    /**
     * 
     * @param height 
     */
    addTextHeight( height:number ) {

        let occurrence = this._textHeights.get( height ) || 0        
        
        this._textHeights.set( height, ++occurrence )    
    
    }

    private _stats:Stats|null = null

    /**
     * 
     */
    get stats():Stats {
  
        if( !this._stats) {
            const calculateMostUsedFont = () => {
                const [k,_] =  Array.from(this._fontMap.entries()).reduce( ( [k1,v1], [k,v] ) => (v.occurrence > v1.occurrence) ? [k,v] : [k1,v1], ['',{ occurrence:0 }] )
                return k
            }
    
            const calculateMaxTextHeight = () => 
                Array.from(this._textHeights.keys()).reduce( (result, h) => (h > result) ? h : result  )
            
    
            const calculateMostUsedTextHeight = () => {
                const [k,_] =  Array.from(this._textHeights.entries()).reduce( ( [k1,v1], [k,v] ) => (v > v1) ? [k,v] : [k1,v1], [0,-1] )
                return k
            }
          
            this._stats = {
                maxTextHeight: calculateMaxTextHeight(),
                maxHeightFont:null,
                mostUsedFont: calculateMostUsedFont(),
                mostUsedTextHeight: calculateMostUsedTextHeight(),
                textHeigths:Array.from(this._textHeights.keys()).sort( (a,b) => b - a ),
                mostUsedTextDistanceY:-1,
            }
        }
        
        return this._stats
  
    }

    constructor( ) {
        this.outDir = path.join( process.cwd(), 'out' )
        this.imageUrlPrefix = process.env['IMAGE_URL'] || ''
    }


}