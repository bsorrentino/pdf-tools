
import 'pdfjs-dist/es5/build/pdf.js';
import fs from 'fs'
import { promisify } from 'util'

import { getDocument, Util } from 'pdfjs-dist'
import TextItem from './model/TextItem';

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
    // self.metadataParsed(metadata);

    console.log("# PDF document loaded.", metadata.info.PDFFormatVersion);

    const pages = pdfDocument.numPages;

    for (let i=1; i <= pages; i++) {

      // Get the first page.
      const page = await pdfDocument.getPage(i) 

      const scale = 1.0;
      const viewport = page.getViewport( { scale:scale } );

      const textContent = await page.getTextContent()

      const textItems = textContent.items.map( item => {
        //trigger resolving of fonts

        // const fontId = item.fontName;
        // if (!self.state.fontIds.has(fontId) && fontId.startsWith('g_d0')) {
        //     self.state.document.transport.commonObjs.get(fontId, function(font) {
        //         self.fontParsed(fontId, font);
        //     });
        //     self.state.fontIds.add(fontId);
        //     fontStage.steps = self.state.fontIds.size;
        // }

        const tx = Util.transform( // eslint-disable-line no-undef
            viewport.transform,
            item.transform
        );

        const fontHeight = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));
        const dividedHeight = item.height / fontHeight;
        return new TextItem({
            x: Math.round(item.transform[4]),
            y: Math.round(item.transform[5]),
            width: Math.round(item.width),
            height: Math.round(dividedHeight <= 1 ? item.height : dividedHeight),
            text: item.str,
            font: item.fontName
        });
    });

    textItems.forEach( console.dir )
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