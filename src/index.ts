import fs from 'fs'
import { promisify } from 'util'
import path from 'path';

import { writePageAsImage, writePageImageOrReuseOneFromCache } from './pdf2md.image';
import { globals } from './pdf2md.global';

import { Command } from 'commander'
import { assert } from 'console';
import { pdfToMarkdown } from './pdf2md.main';
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.js'

// Some PDFs need external cmaps.
const CMAP_URL = "../../../node_modules/pdfjs-dist/cmaps/";
const CMAP_PACKED = true;

// Where the standard fonts are located.
const STANDARD_FONT_DATA_URL =
  "../../../node_modules/pdfjs-dist/standard_fonts/";

const readFile = promisify(fs.readFile)
const checkFileExistsAsync = promisify(fs.access)
const mkdirAsync = promisify(fs.mkdir)

/**
 * 
 * @param path 
 */
async function createFolderIfDoesntExist(path: string) {

  assert(path, `provided path is not valid`)

  try {
    await checkFileExistsAsync(path)
  }
  catch (e) {
    console.log(`folder ${path} doesn't exist, try to create`)
    await mkdirAsync(path)
  }

  return path
}

/**
 * 
 * @param pdfPath 
 */
async function extractImagesfromPages(pdfPath: string) {

  try {

    const data = new Uint8Array(await readFile(pdfPath))

    const pdfDocument = await getDocument({
      data: data,
      cMapUrl: CMAP_URL,
      cMapPacked: CMAP_PACKED,
    }).promise

    // const metadata = await pdfDocument.getMetadata()

    const pages = pdfDocument.numPages;

    for (let i = 1; i <= pages; i++) {

      // Get the first page.
      const page = await pdfDocument.getPage(i)

      const ops = await page.getOperatorList()

      const ImageFromOp = (op: string):PDFImage => 
        op.startsWith('g_') ?
          page.commonObjs.get(op)  :
          page.objs.get(op);
    

      for (let j = 0; j < ops.fnArray.length; j++) {

        if (ops.fnArray[j] == OPS.paintJpegXObject || ops.fnArray[j] == OPS.paintImageXObject) {

          const op = ops.argsArray[j][0];
          
          const img = ImageFromOp(op);

          //const scale = img.width / page._pageInfo.view[2];

          await writePageImageOrReuseOneFromCache(img, op)
          // await writePageAsImage( page )

        }

      }

    }
  }
  catch (reason) {
    console.log(reason)
  }
}


/**
 * 
 * @param pdfPath 
 */
async function savePagesAsImages(pdfPath: string) {

  try {

    const data = new Uint8Array(await readFile(pdfPath))

    const pdfDocument = await getDocument({
      data: data,
      cMapUrl: CMAP_URL,
      cMapPacked: CMAP_PACKED,
      standardFontDataUrl: STANDARD_FONT_DATA_URL
    }).promise

    // const metadata = await pdfDocument.getMetadata()

    const pages = pdfDocument.numPages;

    for (let i = 1; i <= pages; i++) {

      // Get the first page.
      const page = await pdfDocument.getPage(i)

      await writePageAsImage(page)


    }
  }
  catch (reason) {
    console.log(reason)
  }
}

export async function run(): Promise<Command> {

  const choosePath = ( pdfPath:any, cmdobj:any ) => 
              ( cmdobj?.outdir ) ? 
                            cmdobj.outdir : 
                            path.basename(pdfPath, '.pdf')

    const {version} = require('../package.json')
  
    const program = new Command()

    program
    .name('pdftools')
    .version( version, '-v, --version', 'output the current version' )
    // fix issue #8
    // .option('-o, --outdir [folder]', 'output folder' )

    program.command('pdfximages <pdf>')
      .description('extract images (as png) from pdf and save it to the given folder')
      .alias('pxi')
      .option('-o, --outdir [folder]', 'output folder' ) // fix issue #8
      .action( async (pdfPath, cmdobj) => {

        globals.outDir = await createFolderIfDoesntExist(choosePath( pdfPath, cmdobj))
        
        return extractImagesfromPages(pdfPath)
      })
      ;

    program.command('pdf2images <pdf>')
      .description('create an image (as png) for each pdf page')
      .alias('p2i')
      .option('-o, --outdir [folder]', 'output folder' ) // fix issue #8
      .action(async (pdfPath, cmdobj) => {

        globals.outDir = await createFolderIfDoesntExist(choosePath( pdfPath, cmdobj))

        return savePagesAsImages(pdfPath)
      })
      ;

      program.command('pdf2md <pdf>')
      .description('convert pdf to markdown format.')
      .alias('p2md')
      .option('-o, --outdir [folder]', 'output folder' ) // fix issue #8
      .option('-ps, --pageseparator [separator]', 'add page separator', '---')
      .option('--imageurl [url prefix]', 'imgage url prefix')
      .option('--stats', 'print stats information')
      .option('--debug', 'print debug information')
      .action(async (pdfPath, cmdobj) => {
        console.debug( 'cmdobj:', cmdobj )
        globals.outDir = await createFolderIfDoesntExist(choosePath( pdfPath, cmdobj))

        if( cmdobj.imageurl) {
          globals.imageUrlPrefix = cmdobj.imageurl
        }

        if( cmdobj.pageseparator ) {
          if( typeof(cmdobj.pageseparator) === 'string' ) {
            globals.pageSeparator = cmdobj.pageseparator
          }
          else {
            globals.pageSeparator = '---'
          }
        }

        globals.options.debug = cmdobj.debug
        globals.options.stats = cmdobj.stats
      
        //console.log( options )

        await pdfToMarkdown(pdfPath)
      })
    ;

    // program.on('--help', () => {

    //   program.commands.forEach( cmd => {
    //     console.log( '=========================================================')
    //     cmd.outputHelp()   
    //   })

    // });

  return await program.parseAsync(process.argv)
}
