import assert from "assert";
import { OPS, PDFImage, PDFPageProxy, Util } from "pdfjs-dist";
import { globals } from "./pdf2md.global";
import { writePageImage } from "./pdf2md.image";
import { EnhancedWord, Rect, Word, Image, Font } from "./pdf2md.model";

type TransformationMatrix = [
    scalex: number,
    skevX: number,
    skevY: number,
    scaleY: number,
    transformX: number,
    transformY: number]


type ConsoleFormat = {
    x?: number
    y?: number
    width?: number
    height?: number
    image?: string
    font?: string
    text?: string
}

class ConsoleOutput {

    lines = Array<ConsoleFormat>()

    // private ellipsisText(text: string, maxChars: number) {

    //     const regex = new RegExp(`(.{${maxChars}})..+`)

    //     return text.replace(regex, "$1…")
    // }

    appendRow(row: Row) {

        if (row.containsImages) {
            
            const v = row.images?.map( (img, i) => {

                this.lines.push({ 
                    y: img?.y, 
                    width: img?.width, 
                    x: img?.x,  
                    height: img?.height, 
                    image: img?.url || 'undefined' 
                })

            })
        }
        if (row.containsWords) {
            const e = row.enhancedText

            const formats = e.map((etext, i) => {
                //const text = this.ellipsisText(etext.text, 100)
                const text = etext.text 
                const common = { height: etext.height, image: undefined, text: text, font: etext.font }
                if (i == 0) {
                    return {  y: etext.y, width: etext.width, x: etext.x, ...common }
                }
                return { width: etext.width, x: etext.x, ...common }
            })

            this.lines.push(...formats)

        }

    }

}


export class Row {
    y: number
    private _images?: Array<Image>
    private _words?: Array<Word>
    private _etextArray?:Array<EnhancedWord>

    constructor(args: { y: number , words?: Array<Word>, images?: Array<Image> }) {
        this.y = args.y
        this._words = args.words
        this._images = args.images

        this._updateEnhancedText()
    }

    get containsWords() { return this._words !== undefined }

    addWord( w:Word ) {
        this._words?.push( w )
        this._updateEnhancedText()
    }

    get containsImages() { return this._images !== undefined }

    addImage( img:Image ) {
        this._images?.push( img )
    }

    private _updateEnhancedText() {  
        if( !this._words || this._words.length == 0) return // GUARD
        
        const init = {
            lastIndex: -1,
            result: Array<EnhancedWord>()
        }

        this._etextArray =  this._words.reduce((state, w, index, words ) => {

            if (state.lastIndex < 0) {
                state.result.push(new EnhancedWord(w))
                state.lastIndex = 0
            }
            else {
                const isLastWord = index === words.length-1 

                const enhancedText = state.result[state.lastIndex]

                if (!enhancedText.appendWord(w, isLastWord)) {
                    state.result.push(new EnhancedWord(w))
                    state.lastIndex++    
                }

            }
            return state

        }, init).result
    }
 
    get enhancedText() { 
        //this._updateEnhancedText()        
        return this._etextArray! 
    }

    get images() { return this._images }

    containsTextWithHeight( height:number ) {
        //this._updateEnhancedText()
        assert(this._etextArray, 'text array is undefined!')
        return this._etextArray.findIndex( etext => etext.height == height ) >= 0
    }
}

/**
 * 
 */
export class Page {
    rows = Array<Row>()

    process(arg: Rect) {
        if ('text' in arg) {
            this.processWord(arg as Word)
        }
        if ('url' in arg) {
            this.processImage(arg as Image)
        }
        return this
    }

    private processImage(img: Image) {
        let si = this.rows.findIndex(row => row.y == img.y)
        //assert(si < 0, `row ${si} already exists! it is not possible add an image`)
        let row: Row
        if (si < 0) {
            row = new Row({ y: img.y, images: Array<Image>() })
            this.rows.push(row)
        }
        else {
            row = this.rows[si]
        }
        row.addImage(img)
        return this
    }

    private processWord(w: Word) {
        let si = this.rows.findIndex(row => row.y === w.y)
        let row: Row
        if (si < 0) {
            row = new Row({ y: w.y, words: Array<Word>() })
            this.rows.push(row)
        }
        else {
            row = this.rows[si]
        }

        //assert( s.containsWords, `row ${si} not containing words! is it contain image?` )
        if (row.containsWords) {
            row.addWord(w)
        }
        return this
    }

    /**
     * 
     */
    consoleLog() {
        // Debug
        const consoleOutput = new ConsoleOutput()
        this.rows.forEach(row => consoleOutput.appendRow(row))
        console.table(consoleOutput.lines)
    }

}

function mergeItemsArray(a: Array<Rect>, b: Array<Rect>): Array<Rect> {
    return a.concat(b)
}

// A page which holds PageItems displayable via PdfPageView
export async function processPage(proxy: PDFPageProxy) {

    const ops = await proxy.getOperatorList()

    // console.log( 'transform', OPS.transform )

    let imageMatrix: TransformationMatrix | null = null

    const images = Array<Image>()

    ops.fnArray.forEach(async (fn, j) => {

        // const s = Object.entries(OPS).find( ([_,v]) => v === fn )
        // if( s ) console.log( `Operation: ${fn}: ${s[0]} at ${j}` )

        let args = ops.argsArray[j]

        switch (fn) {
            case OPS.setFont:

                const fontId = args[0];

                let font: Font | null
                try {
                    font = proxy.objs.get<Font>(fontId)
                    if (font)
                        globals.addFont(fontId, font)
                }
                catch (e) {
                    //console.debug(e.message)
                    globals.addFont(fontId, { name: '' })
                }

                break;
            // @see 
            // https://github.com/mozilla/pdf.js/issues/10498
            // https://github.com/TomasHubelbauer/globus/blob/master/index.mjs#L63
            //
            case OPS.transform:
                assert(j < ops.argsArray.length, `index ${j} exceed the argsArray size ${ops.argsArray.length}`)

                imageMatrix = <TransformationMatrix>args
                //console.log( imageMatrix )  

                break;
            case OPS.paintJpegXObject:
            case OPS.paintImageXObject:

                const position = { x: 0, y: 0 }

                if (imageMatrix) {
                    position.x = imageMatrix ? Math.round(imageMatrix[4]) : 0
                    position.y = imageMatrix ? Math.round(imageMatrix[5]) : 0
                }

                // console.log( 'image position', position )

                const imageName = args[0];

                const img = proxy.objs.get<PDFImage>(imageName);

                // console.log( `${position.x},${position.y},${img?.width},${img?.height}` )
                if (img) {
                    await writePageImage(img, imageName, globals)

                    images.push({
                        y: position.y,
                        x: position.x,
                        width: img.width,
                        height: img.height,
                        url: imageName
                    })
                }

                imageMatrix = null
                break
            default:
                break;
        }

    })

    const scale = 1.0;

    const viewport = proxy.getViewport({ scale: scale });

    const textContent = await proxy.getTextContent()

    const words = textContent.items.map(item => {

        const tx = Util.transform(viewport.transform, item.transform)

        const fontHeight = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]))

        const dividedHeight = item.height / fontHeight;

        const textRect = {
            x: Math.round(item.transform[4]),
            y: Math.round(item.transform[5]),
            width: Math.round(item.width),
            height: Math.round(dividedHeight <= 1 ? item.height : dividedHeight)
        }

        //console.log( { text: item.str, ...textRect } )
        globals.addTextHeight(textRect.height)

        return <Word>{ text: item.str, font: item.fontName, ...textRect }

    });

    const items = mergeItemsArray(words, images)

    const page = items.sort((a, b) => {
        const r = b.y - a.y
        return (r === 0) ? a.x - b.x : r
    })
    .reduce((page, item) => page.process(item), new Page())


    return page
}


