
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

import assert = require('assert')

import Jimp = require('jimp')
const Canvas = require("canvas")
import pdfjsLib = require('pdfjs-dist/es5/build/pdf.js')

// Some PDFs need external cmaps.
const CMAP_URL = "../../../node_modules/pdfjs-dist/cmaps/";
const CMAP_PACKED = true;

const readFile = promisify( fs.readFile )
const writeFile = promisify( fs.writeFile )

enum PDFImageKind {
  GRAYSCALE_1BPP = 1,
  RGB_24BPP =  2,
  RGBA_32BPP = 3
}

type PdfImage = {
  width:number
  height:number
  kind: PDFImageKind
  data:Uint8ClampedArray
}

type PdfViewport = {
  width: number
  height: number 
}

type AsyncTask<T> = {
  promise:Promise<T>
}

interface PdfPage {
  _pageIndex:number

  objs:any

  getViewport( options:{ scale:number } ):PdfViewport
  
  getOperatorList():Promise<any>
  
  render( params:{
    canvasContext:any,
    viewport:PdfViewport,
    canvasFactory:any,
  }):AsyncTask<void>
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
    var canvas = Canvas.createCanvas(width, height);
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
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}

async function writePageAsImage( page:PdfPage ) {
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
      await writeFile( path.join('bin', `page-${page._pageIndex}.png`), content )  
}

async function writePageImage( img:PdfImage, name:string) {

  //console.log( `image ${name} - kind: ${img.kind}`)
  try {

    let bytesPerPixel:number 
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
    jimg.write(path.join('bin', `${name}.png`))
  }
  catch( error ) {
    console.error( `Error:  ${error}`);
  }

}

/**
 * 
 * @param pdfPath 
 */
async function main(pdfPath:string) {

  try {

    const data = new Uint8Array( await readFile(pdfPath))

    const pdfDocument = await pdfjsLib.getDocument({
      data: data,
      cMapUrl: CMAP_URL,
      cMapPacked: CMAP_PACKED,
    }).promise

    console.log("# PDF document loaded.");

    const pages = pdfDocument._pdfInfo.numPages;

    for (let i=1; i <= pages; i++) {

      // Get the first page.
      const page = await pdfDocument.getPage(i) as PdfPage

      const ops = await page.getOperatorList()

      for (let j=0; j < ops.fnArray.length; j++) {
    
          if (ops.fnArray[j] == pdfjsLib.OPS.paintJpegXObject || ops.fnArray[j] == pdfjsLib.OPS.paintImageXObject) {
        
            const op = ops.argsArray[j][0];

            const img = page.objs.get(op) as PdfImage;

            //const scale = img.width / page._pageInfo.view[2];
            
            await writePageImage( img, op)
            // await writePageAsImage( page )

        }

      }
    
    }
  }
  catch( reason ) {
    console.log(reason) 
  }
}

  // STARTUP CODE

  (async () => {
    const pdfPath = process.argv[2] || "guidelines.pdf";

    await main( pdfPath )
  })()