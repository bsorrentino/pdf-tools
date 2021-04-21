import { createCanvas } from "canvas"
import { assert } from "console"
import fs from "fs"
import path from 'path'
import { promisify } from 'util'
import Jimp from 'jimp'
import { PDFImage, PDFPageProxy } from "pdfjs-dist"
import { globals } from "./pdf2md.global"
import { type } from "os"

enum PDFImageKind {
    GRAYSCALE_1BPP = 1,
    RGB_24BPP =  2,
    RGBA_32BPP = 3
}

const writeFileAsync = promisify( fs.writeFile )

type ImageHash = string
type ImageName = string
type ImageData = {
  jimg:Jimp,
  name:ImageName
}
const imagesCache = new Map<ImageHash,Array<ImageData>>();

/**
 * 
 * @param img 
 * @param name 
 */
export async function writePageImageOrReuseOneFromCache(img:PDFImage, name:ImageName):Promise<ImageName> {

    //console.log( `image ${name} - kind: ${img.kind}`)
    let bytesPerPixel = 0 
    switch( img.kind ) {
      case PDFImageKind.RGB_24BPP:
        bytesPerPixel = 3
        break
      case PDFImageKind.RGBA_32BPP:
        bytesPerPixel = 4
        break
      case PDFImageKind.GRAYSCALE_1BPP:
        assert( `kind ${img.kind} is not supported yet!`)
        bytesPerPixel = 1
        break
      default:
        assert( `kind ${img.kind} is not supported at all!`)
        break

    }

    const jimg = new Jimp(img.width, img.height)
    
    const byteWidth = (img.width*bytesPerPixel)

    for (var x=0; x<img.width; x++) {
      for (var y=0; y<img.height; y++) {

          const index = (y * byteWidth) + (x * bytesPerPixel);
          const r = img.data[index];
          const g = img.data[index+1];
          const b = img.data[index+2];    
          const a = bytesPerPixel == 3 ? 255 : img.data[index+3]

          //const num = (r*256) + (g*256*256) + (b*256*256*256) + a;

          const num = Jimp.rgbaToInt( r, g, b, a)
          jimg.setPixelColor(num, x, y);
          
      }
    }

    let result

    if( globals.useImageDuplicateDetection ) {

      const imageHash = jimg.hash();
      const cachedItem = imagesCache.get( imageHash );
  
      if( cachedItem ) {
        const equals = cachedItem.find( item => Jimp.diff( jimg, item.jimg ).percent == 0  )
        if( equals ) {
          result = equals.name
        }
        else {
          cachedItem.push( { name:name, jimg:jimg} )
        }
      }
      else {
        imagesCache.set( imageHash, [{ name:name, jimg:jimg}] );
      }
  
    }

    if( !result ) {
      jimg.write(path.join(globals.outDir, `${name}.png`))
      return name
    }

    return result
  
  }
  
  interface CanvasObject  { 
    width:number
    height:number
    toBuffer():Buffer 
  } 
  
  type CanvasContext2D = any
  
  type CanvasAndContext = {
    canvas: CanvasObject,
    context: CanvasContext2D,
  }
  
  class NodeCanvasFactory {
  
    create(width:number, height:number):CanvasAndContext {
      assert(width > 0 && height > 0, "Invalid canvas size");
      var canvas = createCanvas(width, height);
      var context = canvas.getContext("2d");
      return {
        canvas: canvas,
        context: context,
      };
    }
  
    reset(canvasAndContext:CanvasAndContext, width:number, height:number) {
      assert(canvasAndContext.canvas, "Canvas is not specified");
      assert(width > 0 && height > 0, "Invalid canvas size");
      canvasAndContext.canvas.width = width;
      canvasAndContext.canvas.height = height;
    }
  
    destroy(canvasAndContext:CanvasAndContext) {
      assert(canvasAndContext.canvas, "Canvas is not specified");
  
      // Zeroing the width and height cause Firefox to release graphics
      // resources immediately, which can greatly reduce memory consumption.
      canvasAndContext.canvas.width = 0;
      canvasAndContext.canvas.height = 0;
      //canvasAndContext.canvas = null;
      //canvasAndContext.context = null;
    }
  }
  
  /**
   * 
   * @param page 
   */
  export async function writePageAsImage( page:PDFPageProxy ) {
        // Render the page on a Node canvas with 100% scale.
        const viewport = page.getViewport({ scale: 1.0 });
      
        const canvasFactory = new NodeCanvasFactory();
        
        const canvasAndContext = canvasFactory.create(
          viewport.width,
          viewport.height
        );
  
        const renderContext = {
          canvasContext: canvasAndContext.context,
          viewport: viewport,
          canvasFactory: canvasFactory,
        };
  
        await page.render(renderContext).promise;
        
        const content = canvasAndContext.canvas.toBuffer();
        
        
        //console.dir( page )
        await writeFileAsync( path.join( globals.outDir,  `page-${page.pageNumber}.png`), content )  
  }
  