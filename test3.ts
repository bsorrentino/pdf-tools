/* Copyright 2017 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import assert = require('assert')

const Jimp = require('jimp')
const Canvas = require("canvas")
import pdfjsLib = require('pdfjs-dist/es5/build/pdf.js')

// Some PDFs need external cmaps.
const CMAP_URL = "../../../node_modules/pdfjs-dist/cmaps/";
const CMAP_PACKED = true;

interface CanvasObject  { 
  width:number
  height:number
  toBuffer():Buffer 
} 

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

async function writeFileIndexed( img:PdfImage, content:Buffer, name:string) {

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
          const alpha = bytesPerPixel == 3 ? 255 : img.data[index+3]

          const num = (r*256) + (g*256*256) + (b*256*256*256) + alpha;
          jimg.setPixelColor(num, x, y);
      }
    }
    jimg.write(path.join('bin', `${name}.png`))
  }
  catch( error ) {
    console.error( `Error:  ${error}`);
  }

}

// Loading file from file system into typed array.
var pdfPath = process.argv[2] || "guidelines.pdf";

var data = new Uint8Array(fs.readFileSync(pdfPath));

// Load the PDF file.
var loadingTask = pdfjsLib.getDocument({
  data: data,
  cMapUrl: CMAP_URL,
  cMapPacked: CMAP_PACKED,
});
loadingTask.promise
  .then( async pdfDocument => {
    console.log("# PDF document loaded.");

    let pages = pdfDocument._pdfInfo.numPages;

	  for (let i=1; i <= pages; i++) {

    // Get the first page.
      const page = await pdfDocument.getPage(i)

      const ops = await page.getOperatorList()

      for (let j=0; j < ops.fnArray.length; j++) {
    
          if (ops.fnArray[j] == pdfjsLib.OPS.paintJpegXObject || ops.fnArray[j] == pdfjsLib.OPS.paintImageXObject) {
        
            const op = ops.argsArray[j][0];

            const img = page.objs.get(op) as PdfImage;
            //console.log(img.kind)

            const scale = img.width / page._pageInfo.view[2];

              // Render the page on a Node canvas with 100% scale.
            const viewport = page.getViewport({ scale: scale });
            
            const canvasFactory = new NodeCanvasFactory();
            
            const canvasAndContext = canvasFactory.create(
              img.width,
              img.height
            );

            const renderContext = {
              canvasContext: canvasAndContext.context,
              viewport: viewport,
              canvasFactory: canvasFactory,
            };
    
            await page.render(renderContext).promise;
            
            const content = canvasAndContext.canvas.toBuffer();
    
            await writeFileIndexed( img, content, op)
  
        }

      }
    
    }
  })
  .catch( reason => console.log(reason) );