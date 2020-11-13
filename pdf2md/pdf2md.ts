import 'pdfjs-dist/es5/build/pdf.js';
import fs from 'fs'
import { promisify } from 'util'

import { getDocument, PDFDocumentProxy, PDFMetadata, Util } from 'pdfjs-dist'
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

// Some PDFs need external cmaps.
const CMAP_URL = "../../../node_modules/pdfjs-dist/cmaps/";
const CMAP_PACKED = true;

const readFile = promisify(fs.readFile)

function metadataParsed(metadata:PDFMetadata) {
  //const metadataStage = this.state.progress.metadataStage();
  //metadataStage.stepsDone++;
  // this.setState({
  //     metadata: new Metadata(metadata),
  // });
  return new Metadata( metadata )
}

function documentParsed(document:PDFDocumentProxy) {
  // Object.keys( document ).forEach( console.log )

  // const metadataStage = this.state.progress.metadataStage();
  // const pageStage = this.state.progress.pageStage();
  // metadataStage.stepsDone++;

  const numPages = document.numPages
  // pageStage.steps = numPages;
  // pageStage.stepsDone;

  let pages = Array<Page>()

  for (let i = 0; i < numPages; i++) {
      pages.push( new Page({ index: i }))
  }

  // this.setState({
  //     document: document,
  //     pages: pages,
  // });

  return pages
}

function pageParsed( pages:Array<Page>, index:number, textItems:Array<TextItem>) {
  // const pageStage = this.state.progress.pageStage();

  // pageStage.stepsDone = pageStage.stepsDone + 1;
  // this.state.pages[index].items = textItems; 
  // this.setState({
  //     progress: this.state.progress
  // });
  pages[index].items = textItems

}

function fontParsed( fontMap:Map<string,any>, fontId:string, font:any) {
  console.dir( font )
  // const fontStage = this.state.progress.fontStage();
  // this.state.fontMap.set(fontId, font); 
  // fontStage.stepsDone++;
  // if (this.state.progress.activeStage() === fontStage) {
  //     this.setState({ //force rendering
  //         fontMap: this.state.fontMap,
  //     });
  // }
  fontMap.set( fontId, font )
}

/**
 * 
 * @param metadata 
 * @param fontMap 
 * @param pages 
 */
export function storePdfPages( _:Metadata, fontMap:Map<string,FONT>, pages:Array<Page>) {

  const transformations:Array<Transformation> = [

      new CalculateGlobalStats(fontMap),
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

  let parseResult:ParseResult = { pages: pages }

  let lastTransformation:Transformation;

  transformations.forEach(transformation => {
      if (lastTransformation) {
          parseResult = lastTransformation.completeTransform(parseResult);
      }
      parseResult = transformation.transform(parseResult);
      lastTransformation = transformation;
  });

  const pageToText = (page:Page, start:string) => 
          page.items.reduce( (result, item) => result.concat(`${item}\n`), start )
  const text = parseResult.pages.reduce( (result, page) => pageToText(page, result), '' )

  console.log( text )

}

/**
 * 
 * @param pdfPath 
 */
async function main(pdfPath: string) {

  try {
    
    const fontMap = new Map<string,any>()

    const data = new Uint8Array(await readFile(pdfPath))

    const pdfDocument = await getDocument({
      data: data,
      cMapUrl: CMAP_URL,
      cMapPacked: CMAP_PACKED,
    }).promise

    const pages = documentParsed(pdfDocument)

    const originalMetadata = await pdfDocument.getMetadata()
    const metadata = metadataParsed(originalMetadata);

    console.log("# PDF document loaded.");

    const numPages = pdfDocument.numPages;

    for (let i = 1; i <= numPages; i++) {

      // Get the first page.
      const page = await pdfDocument.getPage(i)

      const scale = 1.0;
      const viewport = page.getViewport({ scale: scale });

      const textContent = await page.getTextContent()

      const textItems = textContent.items.map(item => {
        //trigger resolving of fonts

        const fontId = item.fontName;
        
        // if (!self.state.fontIds.has(fontId) && fontId.startsWith('g_d0')) {
        if (!fontMap.has(fontId) && fontId.startsWith('g_d0')) {
          
          pdfDocument._transport.commonObjs.get(fontId,( font:any ) => fontParsed(fontMap, fontId, font) )
        //     self.state.document.transport.commonObjs.get(fontId, function(font) {
        //         self.fontParsed(fontId, font);
        //     });
        //     self.state.fontIds.add(fontId);
        //     fontStage.steps = self.state.fontIds.size;
        }

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

      pageParsed( pages, i-1,  textItems)
    }

    storePdfPages( metadata, fontMap, pages )

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