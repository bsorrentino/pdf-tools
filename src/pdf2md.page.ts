import assert from "assert";
import { OPS, PDFImage, PDFPageProxy, Util } from "pdfjs-dist";
import { EnhancedText, Rect, Word, Image } from "./pdf2md.model";

type TransformationMatrix = [
    scalex: number,
    skevX: number,
    skevY: number,
    scaleY: number,
    transformX: number,
    transformY: number]



class Row {
    y: number
    image?: Image
    words?: Array<Word>

    constructor(args: { y: number, words?: Array<Word>, image?: Image }) {
        this.y = args.y
        this.words = args.words
        this.image = args.image
    }

    get containsImage() { return this.image !== undefined }
    get containsWords() { return this.words !== undefined }

    get enhancedText() {
        assert(this.words, 'enhanceText works only for text Row!')
        const init = {
            lastFont: '',
            lastHeight: 0,
            lastIndex: -1,
            result: Array<EnhancedText>()
        }

        return this.words?.reduce((state, w) => {

            if (state.lastIndex < 0) {
                state.result.push(new EnhancedText(w))
                state.lastIndex = 0
            }
            else {
                const enhancedText = state.result[state.lastIndex]

                if (!enhancedText.appendWord(w)) {
                    state.result.push(new EnhancedText(w))
                    state.lastIndex++
                }

            }
            return state

        }, init).result
    }
}

class Rows {
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
        let si = this.rows.findIndex(s => s.y == img.y)
        assert(si < 0, `row ${si} already exists! `)
        this.rows.push(new Row({ y: img.y, image: img }))
    }

    private processWord(w: Word) {
        let si = this.rows.findIndex(s => s.y == w.y)
        let s: Row
        if (si < 0) {
            s = new Row({ y: w.y, words: Array<Word>() })
            this.rows.push(s)
        }
        else {
            s = this.rows[si]
        }

        //assert( s.containsWords, `row ${si} not containing words! is it contain image?` )
        if (s.containsWords) {
            s.words?.push(w)
        }
        return this
    }

}

type ConsoleFormat = {
    x?:number
    y?:number
    width?:number
    height?:number
    image?:string
    font?:string
    text?:string
}

class ConsoleOutput {

    lines = Array<ConsoleFormat>()

    appendRow( row:Row ) {

        if (row.containsImage) {
            const v = row.image
            this.lines.push( { x:v?.x, y:v?.y, width:v?.width, height:v?.height, image:v?.url||'undefined' } )
        }
        if (row.containsWords) {
            const v = row.words![0]
            const e = row.enhancedText
            const maxw = row.words?.reduce( (result, word) => result += word.width, 0 )
            const maxh = e.reduce( (result, etext) => result += etext.height, 0 )
            
            const formats = e.map( (etext, i) => {
                const text = etext.text.replace(/(.{80})..+/, "$1…")
                const common = { image:undefined, text:text, font:etext.font }
                if( i == 0 ) {
                    return { x:v?.x, y:v?.y, width:maxw, height:maxh, ...common  }
                }
                return common
            })
            
            this.lines.push( ...formats )
            
        }

    }
    
}

function mergeItemsArray(a: Array<Rect>, b: Array<Rect>): Array<Rect> {
    return a.concat(b)
}

// A page which holds PageItems displayable via PdfPageView
export async function processPage(proxy: PDFPageProxy, fontMap:Map<string, FONT> ) {

    const ops = await proxy.getOperatorList()

    // console.log( 'transform', OPS.transform )

    let imageMatrix: TransformationMatrix | null = null

    const images = Array<Image>()

    ops.fnArray.forEach((fn, j) => {

        // const s = Object.entries(OPS).find( ([_,v]) => v === fn )
        // if( s ) console.log( `Operation: ${fn}: ${s[0]} at ${j}` )

        let args = ops.argsArray[j]

        switch (fn) {
            case OPS.setFont:

                const fontId = args[0];

                if (!fontMap.has(fontId)) {

                    let font: FONT | null
                    try {
                        font = proxy.objs.get<FONT>(fontId)
                        if (font)
                            fontMap.set(fontId, font)
                    }
                    catch (e) {
                        console.debug(e.message)
                    }

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

                const op = args[0];

                const img = proxy.objs.get<PDFImage>(op);

                // console.log( `${position.x},${position.y},${img?.width},${img?.height}` )
                if (img)
                    images.push(
                        {
                            y: position.y,
                            x: position.x,
                            width: img.width,
                            height: img.height,
                            url: op
                        }
                    )

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

        return <Word>{ text: item.str, font: item.fontName, ...textRect }

    });

    const items = mergeItemsArray(words, images)

    const page = items.sort((a, b) => {
        const r = b.y - a.y
        return (r === 0) ? a.x - b.x : r
    })
    .reduce((rows, item) => rows.process(item), new Rows())

    // Debug
    const consoleOutput = new ConsoleOutput()
    page.rows.forEach( row => consoleOutput.appendRow(row) )
    console.table( consoleOutput.lines )

}


