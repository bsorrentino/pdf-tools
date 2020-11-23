import 'pdfjs-dist/es5/build/pdf.js';
import fs from 'fs'
import { promisify } from 'util'

import { getDocument, OPS, PDFImage } from 'pdfjs-dist'
import { writePageAsImage, writePageImage } from './pdf2md.image';
import { globals } from './pdf2md.global';

// Some PDFs need external cmaps.
const CMAP_URL = "../../../node_modules/pdfjs-dist/cmaps/";
const CMAP_PACKED = true;

const readFile = promisify( fs.readFile )

/**
 * 
 * @param pdfPath 
 */
async function extractImagesfromPages(pdfPath:string) {

  try {

    const data = new Uint8Array( await readFile(pdfPath))

    const pdfDocument = await getDocument({
      data: data,
      cMapUrl: CMAP_URL,
      cMapPacked: CMAP_PACKED,
    }).promise

    // const metadata = await pdfDocument.getMetadata()

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


/**
 * 
 * @param pdfPath 
 */
async function savePagesAsImages(pdfPath:string) {

  try {

    const data = new Uint8Array( await readFile(pdfPath))

    const pdfDocument = await getDocument({
      data: data,
      cMapUrl: CMAP_URL,
      cMapPacked: CMAP_PACKED,
    }).promise

    // const metadata = await pdfDocument.getMetadata()

    const pages = pdfDocument.numPages;

    for (let i=1; i <= pages; i++) {

      // Get the first page.
      const page = await pdfDocument.getPage(i) 

      await writePageAsImage( page )

    
    }
  }
  catch( reason ) {
    console.log(reason) 
  }
}

// STARTUP CODE
import { program } from 'commander'

program.version('1.0.0')
        .name('pdftools')
;

program.command( 'extract-images <pdf>' )
        .description( 'extract images (as png) from pdf and save it to the given folder')
        .alias('xi')
        .option( '-o, --outdir [folder]', 'output folder', 'out')
        .action( (pdfPath, cmdobj) => {

            globals.outDir = cmdobj.outdir

            return extractImagesfromPages( pdfPath )
        })
        ;

program.command( 'page2images <pdf>' )
          .description( 'extract images (as png) from pdf and save it to the given folder')
          .alias('p2i')
          .option( '-o, --outdir [folder]', 'output folder', 'out')
          .action( (pdfPath, cmdobj) => {

              globals.outDir = cmdobj.outdir

              return savePagesAsImages( pdfPath )
          })
          ;

program.parseAsync(process.argv).then( () => {} ).catch( e => console.error(e) );