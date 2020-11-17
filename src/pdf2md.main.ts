import 'pdfjs-dist/es5/build/pdf.js';
import fs from 'fs'
import { promisify } from 'util'

import { getDocument } from 'pdfjs-dist'

import { processPage } from './pdf2md.page';
import { loadLocalFonts } from './pdf2md.font';

// Some PDFs need external cmaps.
const CMAP_URL = "../../../node_modules/pdfjs-dist/cmaps/";
const CMAP_PACKED = true;

const readFile = promisify(fs.readFile)

/**
 * 
 * @param pdfPath 
 */
async function main(pdfPath: string) {
  try {
    const fontMap = await loadLocalFonts(new Map<string, FONT>())
    
    const data = new Uint8Array(await readFile(pdfPath))

    const pdfDocument = await getDocument({
      data: data,
      cMapUrl: CMAP_URL,
      cMapPacked: CMAP_PACKED
    }).promise

    //const originalMetadata = await pdfDocument.getMetadata()

    console.log("# PDF document loaded.");


    //for (let i = 1; i <= numPages; i++) {
    for (let i = 9; i <= 9; i++) {

      // Get the first page.
      const page = await pdfDocument.getPage(i)

      await processPage( page, fontMap )

    }

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