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

var Canvas = require("canvas");
var assert = require("assert").strict;
import fs from 'fs'
import path from 'path'

function NodeCanvasFactory() {}
NodeCanvasFactory.prototype = {
  create: function NodeCanvasFactory_create(width, height) {
    assert(width > 0 && height > 0, "Invalid canvas size");
    var canvas = Canvas.createCanvas(width, height);
    var context = canvas.getContext("2d");
    return {
      canvas: canvas,
      context: context,
    };
  },

  reset: function NodeCanvasFactory_reset(canvasAndContext, width, height) {
    assert(canvasAndContext.canvas, "Canvas is not specified");
    assert(width > 0 && height > 0, "Invalid canvas size");
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  },

  destroy: function NodeCanvasFactory_destroy(canvasAndContext) {
    assert(canvasAndContext.canvas, "Canvas is not specified");

    // Zeroing the width and height cause Firefox to release graphics
    // resources immediately, which can greatly reduce memory consumption.
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  },
};

function writeFileIndexed( content:any, name:string) {

  fs.writeFile( path.join('bin', `${name}.png`), content, (error) => {
    if (error) {
      console.error( `Error:  ${error}`);
    } else {
      console.log('Finished converting first page of PDF file to a PNG image.');
    }
  });

}

const pdfjsLib = require("pdfjs-dist/es5/build/pdf.js");

// Some PDFs need external cmaps.
const CMAP_URL = "../../../node_modules/pdfjs-dist/cmaps/";
const CMAP_PACKED = true;

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
  .then( pdfDocument => {
    console.log("# PDF document loaded.");

    let pages = pdfDocument._pdfInfo.numPages;

	  for (let i=1; i <= pages; i++) {

    // Get the first page.
      pdfDocument.getPage(i).then( page => {

      	page.getOperatorList().then( ops => {

          for (let j=0; j < ops.fnArray.length; j++) {
			
            if (ops.fnArray[j] == pdfjsLib.OPS.paintJpegXObject || ops.fnArray[j] == pdfjsLib.OPS.paintImageXObject) {
          
              const op = ops.argsArray[j][0];
  
              const img = page.objs.get(op);
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
      
              const renderTask = page.render(renderContext);
              renderTask.promise.then( () => {
                // Convert the canvas to an image buffer.
                const image = canvasAndContext.canvas.toBuffer();
      
                writeFileIndexed( image, op)
      
              });
            }
          }
  
        });

    });
  }
  })
  .catch(function (reason) {
    console.log(reason);
  });