import { run } from '../index'
import path from 'path'
import fs from 'fs/promises'
import { constants } from 'fs';
const os = require('os');

const tempDir = os.tmpdir();

console.log(`Temporary directory: ${tempDir}`);

async function fileExists( filePath: string ) {
    try {
      await fs.access(filePath, constants.F_OK);
      return true;
    } catch (error) {
      return false;
    }
}

test( 'check custom outdir 1', async () => {
    const outpath = path.join(tempDir, 'toc_1')
    //pdftools -o ./custom-folder pdf2md some-document.pdf
    process.argv = ['node', './cli.js', 'pdf2md', path.join( 'src', '__tests__', 'toc.pdf'), '--outdir', outpath ]

    await run()

    expect( await fileExists(outpath) ).toBe( true )

    await fs.rm( outpath, { recursive: true, force: true } )
})

test( 'check custom outdir 2', async () => {
    const outpath = path.join(tempDir, 'toc_2')
    //pdftools -o ./custom-folder pdf2md some-document.pdf
    process.argv = ['node', './cli.js', 'pdf2md', path.join( 'src', '__tests__', 'toc.pdf'), '-o', outpath, '-ps', '***' ]

    await run()

    expect( await fileExists(outpath) ).toBe( true )

    await fs.rm( outpath, { recursive: true, force: true } )
})