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


export class Globals {
    
    fontMap = new Map<string, Font>()
    private _textHeights = new Set<number>()

    outDir:string
    imageUrlPrefix:string

    addTextHeight( h:number ) {
        this._textHeights.add(h)
    }
    get textHeights() {
        const result = Array.from(this._textHeights.values()).sort( (a,b) => a - b )
        result.shift() // remove first element (minimum)
        return result
    }

    constructor( ) {

        this.outDir = path.join( process.cwd(), 'out' )
        this.imageUrlPrefix = process.env['IMAGE_URL'] || ''
    }

}