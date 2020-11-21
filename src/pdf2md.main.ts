import 'pdfjs-dist/es5/build/pdf.js';
import fs from 'fs'
import path from 'path'

import { promisify } from 'util'

import { getDocument } from 'pdfjs-dist'

import { processPage, Page } from './pdf2md.page';
import { toMarkdown } from './pdf2md.markdown';
import { globals } from './pdf2md.global';

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

    const fontFile = path.join('tmp', `${path.basename(pdfPath, '.pdf')}.fonts.json`)

    globals.loadLocalFonts( fontFile )
    
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

      const page = await processPage( pdfPage )

      pages.push( page )

    }

    const content = pages.map( page => toMarkdown( page ) )
                          .reduce( (result, pageText ) => result.concat(pageText), '')

    await writeFile( path.join( globals.outDir, 'out.md'), content )

    globals.saveFonts( fontFile )

    pages.forEach( p => p.consoleLog() )
    console.table( [ globals.stats ] ); console.log( globals.stats.textHeigths)

  }
  catch (reason) {
    console.log(reason)
  }
}


// STARTUP CODE


//const pdfPath = process.argv[2] || "guidelines.pdf";
//const pdfPath = process.argv[2] || path.join('private', 'document1.pdf')
const pdfPath = process.argv[2] || path.join('private', 'document2.pdf')

main(pdfPath).then( () => {} )
