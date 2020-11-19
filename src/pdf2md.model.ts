import { assert } from 'console'
import path from 'path'

export interface Font {
    name:string
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

export class EnhancedText {
    height: number
    font: string
    text: string

    constructor(w: Word) {
        this.height = w.height
        this.font = w.font
        this.text = w.text
    }

    canAppendWord(w: Word) {
        return (this.height === w.height && this.font === w.font)
    }

    appendWord(w: Word) {
        if (this.canAppendWord(w)) {
            this.text += w.text
            return true
        }
        return false
    }
}


type FontStat = Font & { occurrence:number }

export interface Stats {
    mostUsedFont:string // fontId
    mostUsedTextHeight:number    
    mostUsedTextDistanceY:number
    maxTextHeight:number
}
export class Globals {
    //mostUsedFont: Font|null = null
    //maxHeightFont = 0 
    //mostUsedDistance = 0
    //mostUsedHeight: number = 0
    //maxHeight  = 0

    private _fontMap = new Map<string, FontStat>()
    private _textHeights = new Map<number,number>()
  
    private _itemDistanceY = { 
        lastY:-1,
        rectMap:new Map<number,number>()
    }

    outDir:string
    imageUrlPrefix:string

    addFont( fontId:string, font:Font ) {

        assert( font, `font ${fontId} is not valid ${font}`)

        let value = this._fontMap.get( fontId ) || { ...font, occurrence: 0}   
        
        value.occurrence++

        this._fontMap.set( fontId, value )

    }

    getFont( fontId:string ):Font {
        return this._fontMap.get( fontId ) as Font
    }

    addTextHeight( height:number ) {

        let occurrence = this._textHeights.get( height ) || 0        
        
        this._textHeights.set( height, ++occurrence )    
    
    }
    
    private _stats:Stats|null = null

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
                mostUsedFont: calculateMostUsedFont(),
                mostUsedTextHeight: calculateMostUsedTextHeight(),
                mostUsedTextDistanceY:-1
            }
        }
        
        return this._stats
  
    }

    constructor( ) {

        this.outDir = path.join( process.cwd(), 'out' )
        this.imageUrlPrefix = process.env['IMAGE_URL'] || ''

    }


}