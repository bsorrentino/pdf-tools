import assert = require('assert')
import path from 'path'
import fs from 'fs'
import { promisify } from 'util'

const checkFileExistsAsync = promisify(fs.access)
const readFileAsync = promisify(fs.readFile)
const writeFileAsync = promisify(fs.writeFile)

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

    addTransformer(transformer: TextTransformer) {
        if (this._transformer) return false

        this._transformer = transformer

        // const prev = this._transformer

        // this._transformer =  ( prev ) ?
        //     ( text:string ) => transformer(prev(text)) :
        //     transformer
    }

    get text() {
        return (this._transformer) ? this._transformer(this._text) : this._text
    }
}


type FontStat = Font & { occurrence: number }

export interface Stats {
    mostUsedFont: string // fontId
    mostUsedTextHeight: number
    mostUsedTextDistanceY: number
    maxTextHeight: number
    maxHeightFont: string | null
    textHeigths: Array<number>
}

export class Globals {

    private _fontMap = new Map<string, FontStat>()
    private _textHeights = new Map<number, number>()

    outDir: string
    imageUrlPrefix: string

    /**
     * 
     * @param fontId 
     * @param font 
     */
    addFont(fontId: string, font: Font) {

        assert(font, `font ${fontId} is not valid ${font}`)

        let value = this._fontMap.get(fontId) || { ...font, occurrence: 0 }

        value.occurrence++

        this._fontMap.set(fontId, value)

    }

    /**
     * 
     * @param fontId 
     */
    getFont(fontId: string): Font | undefined {
        return this._fontMap.get(fontId) as Font
    }

    /**
     * 
     * @param height 
     */
    addTextHeight(height: number) {

        let occurrence = this._textHeights.get(height) || 0

        this._textHeights.set(height, ++occurrence)

    }

    private _stats: Stats | null = null

    /**
     * 
     */
    get stats(): Stats {

        if (!this._stats) {
            const calculateMostUsedFont = () => {
                const [k, _] = Array.from(this._fontMap.entries()).reduce(([k1, v1], [k, v]) => (v.occurrence > v1.occurrence) ? [k, v] : [k1, v1], ['', { occurrence: 0 }])
                return k
            }

            const calculateMaxTextHeight = () =>
                Array.from(this._textHeights.keys()).reduce((result, h) => (h > result) ? h : result)


            const calculateMostUsedTextHeight = () => {
                const [k, _] = Array.from(this._textHeights.entries()).reduce(([k1, v1], [k, v]) => (v > v1) ? [k, v] : [k1, v1], [0, -1])
                return k
            }

            this._stats = {
                maxTextHeight: calculateMaxTextHeight(),
                maxHeightFont: null,
                mostUsedFont: calculateMostUsedFont(),
                mostUsedTextHeight: calculateMostUsedTextHeight(),
                textHeigths: Array.from(this._textHeights.keys()).sort((a, b) => b - a),
                mostUsedTextDistanceY: -1,
            }
        }

        return this._stats

    }


    /**
     * 
     * @param fontsFile 
     * @param globals 
     */
    async loadLocalFonts(fontsFile: string) {

        try {
            await checkFileExistsAsync(fontsFile)
        }
        catch (e) {
            console.warn(`WARN: file ${fontsFile} doesn't exists!`)
            return
        }

        try {
            const contents = await readFileAsync(fontsFile)

            const fonts: { [name: string]: Font } = JSON.parse(contents.toString())

            Object.entries(fonts).forEach(([k, v]) => this.addFont(k, v))

        }
        catch (e) {
            console.warn(`WARN: error loading and evaluating ${fontsFile}! - ${e.message}`)
        }
    }

    /**
     * 
     * @param fontMap 
     */
    async saveFonts(fontsFile: string) {

        try {
            await checkFileExistsAsync(fontsFile)
            console.warn(`WARN: file ${fontsFile} already exists!`)
            return
        }
        catch (e) {
            // correct file doesn't exists
        }

        try {

            const init:{ [fontId:string]:FontStat } = {}

            const contents = Array.from(this._fontMap.entries())
                .sort( (e1,e2) => e1[1].occurrence - e2[1].occurrence )
                .reduce( ( result, e) => { result[ e[0] ] = e[1]; return result } , init )
            
            await writeFileAsync(fontsFile, JSON.stringify(contents) )

        }
        catch (e) {
            console.warn(`WARN: error writing ${fontsFile}! - ${e.message}`)
        }
    }

    constructor() {
        this.outDir = path.join(process.cwd(), 'out')
        this.imageUrlPrefix = process.env['IMAGE_URL'] || ''
    }


}