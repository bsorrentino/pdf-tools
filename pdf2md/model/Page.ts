import { PDFImage, PDFPageProxy, PDFPageViewport, TextContentItem, Util } from "pdfjs-dist";
import LineItem from "./LineItem";
import TextItem from "./TextItem";

type GenericItem = LineItem|string|{
    category: string,
    text: string
}|any

// A page which holds PageItems displayable via PdfPageView
export default class Page {
    
    items  = Array<GenericItem>()
    images = Array<PDFImage>()

    static fontMap = new Map<string, FONT>()

    constructor( public index:number ) {}

    static async of( proxy:PDFPageProxy ) {

        const result = new Page( proxy.pageIndex )

        const scale = 1.0;
      
        const viewport = proxy.getViewport({ scale: scale });
  
        const textContent = await proxy.getTextContent()
  
       textContent.items.forEach(item => {
  
          const tx = Util.transform( viewport.transform, item.transform ) 
          
          const fontHeight = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]))
  
          const dividedHeight = item.height / fontHeight;
  
          const position = { x:Math.round(item.transform[4]), y:Math.round(item.transform[5]) }
  
          // console.log( 'text position', position, item.str )
          const textItem = new TextItem({
                x: position.x,
                y: position.y,
                width: Math.round(item.width),
                height: Math.round(dividedHeight <= 1 ? item.height : dividedHeight),
                text: item.str,
                font: item.fontName
            })

            result.items.push( textItem )
  
        });
  
        return result
    }
}

