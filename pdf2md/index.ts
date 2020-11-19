import 'pdfjs-dist/es5/build/pdf.js';
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import assert from 'assert'

import { getDocument, OPS, PDFDocumentProxy, PDFImage, PDFMetadata, PDFObjects, PDFPageProxy, Util } from 'pdfjs-dist'

import TextItem from './model/TextItem';
import Metadata from './model/Metadata';
import Page from './model/Page';
import ParseResult from './model/ParseResult';
import CompactLines from './model/transformations/lineitem/CompactLines';
import DetectHeaders from './model/transformations/lineitem/DetectHeaders';
import DetectListItems from './model/transformations/lineitem/DetectListItems';
import DetectTOC from './model/transformations/lineitem/DetectTOC';
import RemoveRepetitiveElements from './model/transformations/lineitem/RemoveRepetitiveElements';
import VerticalToHorizontal from './model/transformations/lineitem/VerticalToHorizontal';
import CalculateGlobalStats from './model/transformations/textitem/CalculateGlobalStats';
import DetectCodeQuoteBlocks from './model/transformations/textitemblock/DetectCodeQuoteBlocks';
import DetectListLevels from './model/transformations/textitemblock/DetectListLevels';
import GatherBlocks from './model/transformations/textitemblock/GatherBlocks';
import ToMarkdown from './model/transformations/ToMarkdown';
import ToTextBlocks from './model/transformations/ToTextBlocks';
import Transformation from './model/transformations/Transformation';
import { createHook } from 'async_hooks';

// Some PDFs need external cmaps.
const CMAP_URL = "../../../node_modules/pdfjs-dist/cmaps/";
const CMAP_PACKED = true;

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const checkFileExists = promisify(fs.access)

function metadataParsed(metadata: PDFMetadata) {
  //const metadataStage = this.state.progress.metadataStage();
  //metadataStage.stepsDone++;
  // this.setState({
  //     metadata: new Metadata(metadata),
  // });
  return new Metadata(metadata)
}

/**
 * 
 * @param metadata 
 * @param fontMap 
 * @param pages 
 */
export async function storePdfPages(_: Metadata, pages: Array<Page>) {

  const transformations: Array<Transformation> = [

    new CalculateGlobalStats(Page.fontMap),
    new CompactLines(),
    new RemoveRepetitiveElements(),
    new VerticalToHorizontal(),
    new DetectTOC(),
    new DetectHeaders(),
    new DetectListItems(),

    new GatherBlocks(),
    new DetectCodeQuoteBlocks(),
    new DetectListLevels(),

    new ToTextBlocks(),
    new ToMarkdown()
  ]

  let parseResult: ParseResult = { pages: pages }

  let lastTransformation: Transformation;

  transformations.forEach(transformation => {
    if (lastTransformation) {
      parseResult = lastTransformation.completeTransform(parseResult);
    }
    parseResult = transformation.transform(parseResult);
    lastTransformation = transformation;
  });

  const pageToText = (page: Page, start: string) =>
    page.items.reduce((result, item) => result.concat(`${item}\n`), start)

  const text = parseResult.pages.reduce((result, page) => pageToText(page, result), '')

  const outPath = path.join('bin','out.md')
  await writeFile( outPath, text )
  console.log( `file ${outPath} generated` )

}

/**
 * 
 * @param fontMap 
 */
async function loadLocalFonts(fontMap: Map<string, FONT>) {
  const fontsFile = 'fonts.json'

  try {
    await checkFileExists(fontsFile)
  }
  catch (e) {
    console.warn(`WARN: file ${fontsFile} doesn't exists!`)
  }

  try {
    const contents = await readFile(fontsFile)

    const fonts: { [name: string]: FONT } = JSON.parse(contents.toString())

    Object.entries(fonts).forEach(([k, v]) => fontMap.set(k, v))

  }
  catch (e) {
    console.warn(`WARN: error loading and evaluating ${fontsFile}! - ${e.message}`)
  }

  return fontMap
}

type TransformationMatrix = [ 
  scalex:number, 
  skevX:number, 
  skevY:number, 
  scaleY:number, 
  transformX:number, 
  transformY:number ]

/**
 * 
 * @param pdfPath 
 */
async function main(pdfPath: string) {
  try {
    Page.fontMap = await loadLocalFonts(new Map<string, FONT>())
    
    const data = new Uint8Array(await readFile(pdfPath))

    const pdfDocument = await getDocument({
      data: data,
      cMapUrl: CMAP_URL,
      cMapPacked: CMAP_PACKED
    }).promise

    const pages = Array<Page>()

    const originalMetadata = await pdfDocument.getMetadata()

    // process Components In Page
    //
    // Process Fonts
    // Process Images
    const processComponentsInPage = async (page: PDFPageProxy) => {

      const result = await Page.of( page )

      const ops = await page.getOperatorList()

      // console.log( 'transform', OPS.transform )

      let imageMatrix:TransformationMatrix|null = null

      ops.fnArray.forEach((fn, j) => {

        // const s = Object.entries(OPS).find( ([_,v]) => v === fn )
        // if( s ) console.log( `Operation: ${fn}: ${s[0]} at ${j}` )
        
        let args = ops.argsArray[j]

        switch( fn ) {
          case OPS.setFont:

            const fontId = args[0];

            if( !Page.fontMap.has( fontId ) ) {

              let font: FONT|null
              try {
                font = page.objs.get<FONT>(fontId)
                if( font )
                  Page.fontMap.set(fontId, font)
              }
              catch (e) {
                console.debug(e.message)
              }
    
            }
            break;    
            // @see 
            // https://github.com/mozilla/pdf.js/issues/10498
            // https://github.com/TomasHubelbauer/globus/blob/master/index.mjs#L63
            //
            case OPS.transform:
              assert( j < ops.argsArray.length, `index ${j} exceed the argsArray size ${ops.argsArray.length}`)
 
              imageMatrix = <TransformationMatrix>args
              //console.log( imageMatrix )  

              break;
            case OPS.paintJpegXObject:
            case OPS.paintImageXObject:

              const position = { x:0, y:0 }

              if( imageMatrix ) {
                position.x = imageMatrix ? Math.round(imageMatrix[4]) : 0
                position.y = imageMatrix ? Math.round(imageMatrix[5]) : 0
              }

              // console.log( 'image position', position )

              const op = args[0];

              const img = page.objs.get<PDFImage>(op);

              // console.log( `${position.x},${position.y},${img?.width},${img?.height}` )
              if( img )
                result.images.push( img )

              imageMatrix = null
              break
            default:
              break;
        }

      })

      return result
    }

    const metadata = metadataParsed(originalMetadata);

    console.log("# PDF document loaded.");

    const numPages = pdfDocument.numPages;

    for (let i = 1; i <= numPages; i++) {
    // for (let i = 1; i <= 1; i++) {

      // Get the first page.
      const page = await pdfDocument.getPage(i)

      const pageInfo = await processComponentsInPage(page)

      pages.push( pageInfo )

    }

    storePdfPages(metadata, pages)

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