import fs from 'fs'
import path from 'path'

import { promisify } from 'util'


import { processPage, Page } from './pdf2md.page';
import { toMarkdown } from './pdf2md.markdown';
import { globals } from './pdf2md.global';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.js'

// Some PDFs need external cmaps.
const CMAP_URL = "../../../node_modules/pdfjs-dist/cmaps/";
const CMAP_PACKED = true;

// Where the standard fonts are located.
const STANDARD_FONT_DATA_URL =
  "../../../node_modules/pdfjs-dist/standard_fonts/";

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)


/**
 * 
 * @param pdfPath 
 */
export async function pdfToMarkdown(pdfPath: string) {

  try {

    const basename = path.basename(pdfPath, '.pdf')

    const fontFile  = path.join(globals.outDir, `${basename}.fonts.json`)
    const outFile   = path.join(globals.outDir, `${basename}.md`)

    globals.loadLocalFonts( fontFile )
    
    const data = new Uint8Array(await readFile(pdfPath))
 
    const pdfDocument = await getDocument({
      data: data,
      cMapUrl: CMAP_URL,
      cMapPacked: CMAP_PACKED,
      standardFontDataUrl: STANDARD_FONT_DATA_URL
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

    await writeFile( outFile, content )

    globals.saveFonts( fontFile )

    if( globals.options.debug ) {
      pages.forEach( p => p.consoleLog() )
    }

    if( globals.options.stats ) {
      globals.consoleLog()
    }

  }
  catch (reason) {
    console.log(reason)
  }
}
