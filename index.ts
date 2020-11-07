import 'pdfjs-dist/es5/build/pdf.js';
import { getDocument, PDFJS, PDFSource } from 'pdfjs-dist';

interface OperationList {
    fnArray:Int16Array
}


async function main() {

    const source:PDFSource = {
        url: 'guidelines.pdf',
        nativeImageDecoderSupport: 'none'
    } 

    
    const doc = await getDocument( source  ).promise

    console.log( `pages#: ${doc.numPages}` )

    for( let i = 1 ; i <= doc.numPages; ++i ) {
        try {
            const page = await doc.getPage(i)
    
            //const op = await page.getOperatorList()
            
            //console.log( "OP", op )
        }
        catch ( e ) {
            console.error( e.message )
        }
    }
} 

(async () => main())()