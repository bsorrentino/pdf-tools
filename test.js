//var PDFJS = require('pdfjs-dist');
const PDFJS = require('pdfjs-dist/es5/build/pdf.js')
const { createCanvas } = require('canvas');
const {promisify} = require('util');
const fs = require('fs');
var assert = require("assert").strict;

const writeFile = promisify(fs.writeFile); 
const readFile = promisify(fs.readFile); 

function NodeCanvasFactory() {}
NodeCanvasFactory.prototype = {

  create: function NodeCanvasFactory_create(width, height) {
    assert(width > 0 && height > 0, "Invalid canvas size");
    var canvas = createCanvas(width, height);
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

async function saveImage( params ) {
	let { page, scale } = params

	let viewport = page.getViewport({ scale: scale })

	let canvasFactory = new NodeCanvasFactory();

	let canvasAndContext = canvasFactory.create(
		viewport.width,
		viewport.height
	);

	await page.render({
		canvasContext: canvasAndContext.context,
		viewport,
		canvasFactory
	});
	
	const imageData = canvasAndContext.canvas.toBuffer();

	const ordinal = ('00' + (page._pageIndex+1) ).slice(-3);
	await writeFile('image-'+ordinal+'.png', imageData);

} 


async function proc(filename) {

	let content = await readFile( filename )

	let options = {
		data: new Uint8Array(content), 
		//nativeImageDecoderSupport: 'none', 
		//disableFontFace: true,
		cMapUrl: '../../../node_modules/pdfjs-dist/cmaps/',
		cMapPacked: true
	}
	
	let doc = await PDFJS.getDocument(options).promise

	var page = await doc.getPage(25);

	await saveImage( { page:page, scale:1.0 } )


	// let pages = doc._pdfInfo.numPages;

	// for (let i=1; i <= pages; i++) {
	// 	var page = await doc.getPage(i);

	// 	saveImage( page.getViewport({ scale: 1.0 }), i )

	// 	var ops = await page.getOperatorList();
		
	// 	for (let j=0; j < ops.fnArray.length; j++) {
			
	// 		if (ops.fnArray[j] == PDFJS.OPS.paintJpegXObject || ops.fnArray[j] == PDFJS.OPS.paintImageXObject) {
				
	// 			var op = ops.argsArray[j][0];

	// 			var img = page.objs.get(op);

	// 			var scale = img.width / page._pageInfo.view[2];

	// 			console.log( img.width, img.height, scale )

	// 			saveImage( page.getViewport({ scale: scale }), i )
	// 		}
	// 	}
	// }
	
}


( async () => {

	try {
		console.log( 'START!')
		await proc('guidelines.pdf') 
		console.log( 'DONE!')
	
	}
	catch( e ) {
		console.error(e)
	}
	
})();
 
