import 'pdfjs-dist/es5/build/pdf.js';
import fs from 'fs'
import { promisify } from 'util'

import { getDocument, OPS, PDFImage } from 'pdfjs-dist'
import { writePageImage } from './pdf2md.image';

// Some PDFs need external cmaps.
const CMAP_URL = "../../../node_modules/pdfjs-dist/cmaps/";
const CMAP_PACKED = true;

const readFile = promisify( fs.readFile )

/**
 * 
 * @param pdfPath 
 */
async function main(pdfPath:string) {

  try {

    const data = new Uint8Array( await readFile(pdfPath))

    const pdfDocument = await getDocument({
      data: data,
      cMapUrl: CMAP_URL,
      cMapPacked: CMAP_PACKED,
    }).promise

    const metadata = await pdfDocument.getMetadata()

    console.log("# PDF document loaded.", metadata.info.PDFFormatVersion);

    const pages = pdfDocument.numPages;

    for (let i=1; i <= pages; i++) {

      // Get the first page.
      const page = await pdfDocument.getPage(i) 

      const ops = await page.getOperatorList()

      for (let j=0; j < ops.fnArray.length; j++) {
    
          if (ops.fnArray[j] == OPS.paintJpegXObject || ops.fnArray[j] == OPS.paintImageXObject) {
        
            const op = ops.argsArray[j][0];

            const img = page.objs.get(op) as PDFImage;

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