import 'pdfjs-dist/es5/build/pdf.js';
import fs from 'fs'
import path from 'path'

import { promisify } from 'util'

import { getDocument } from 'pdfjs-dist'

import { processPage, Page } from './pdf2md.page';
import { loadLocalFonts } from './pdf2md.font';
import { Globals } from './pdf2md.model';
import { toMarkdown } from './pdf2md.markdown';

// Some PDFs need external cmaps.
const CMAP_URL = "../../../node_modules/pdfjs-dist/cmaps/";
const CMAP_PACKED = true;

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

/**
 * 
 * @param pdfPath 
 */
async function main(pdfPath: string) {

  try {

    const globals = new Globals()

    
    const data = new Uint8Array(await readFile(pdfPath))

    const pdfDocument = await getDocument({
      data: data,
      cMapUrl: CMAP_URL,
      cMapPacked: CMAP_PACKED
    }).promise

    const numPages = pdfDocument.numPages

    const pages = Array<Page>(numPages)
    
    //const originalMetadata = await pdfDocument.getMetadata()

    for (let i = 1; i <= numPages; i++) {
    //for (let i = 9; i <= 9; i++) {

      // Get the first page.
      const pdfPage = await pdfDocument.getPage(i)

      const page = await processPage( pdfPage , globals )

      pages.push( page )

    }

    const content = pages.map( page => toMarkdown( page, globals ) )
                          .reduce( (result, pageText ) => result.concat(pageText), '')

    await writeFile( path.join( globals.outDir, 'out.md'), content )

    pages.forEach( p => p.consoleLog() )
    console.table( [{ 
      maxTextHeight:globals.maxTextHeight,
      mostUsedTextHeight:globals.mostUsedTextHeight,
      mostUsedFont:globals.mostUsedFont 
    }] )

  }
  catch (reason) {
    console.log(reason)
  }
}


// STARTUP CODE

(async () => {
  const pdfPath = process.argv[2] || "guidelines.pdf";

  await main(pdfPath)
})()