import 'pdfjs-dist/es5/build/pdf.js';
import path from 'path'
import { getDocument, Util } from 'pdfjs-dist';
import { PDFPageProxy } from 'pdfjs-dist/types/display/api';
import { getLinks, matchLink } from '../pdf2md.link';
import { Word } from '../pdf2md.model';

const CMAP_URL = "../../../node_modules/pdfjs-dist/cmaps/";
const CMAP_PACKED = true;

async function getText(page:PDFPageProxy):Promise<Word[]> {
    const scale = 1.0;

    const viewport = page.getViewport({ scale: scale });

    const textContent = await page.getTextContent()

    const words = textContent.items.map(item => {

        const tx = Util.transform(viewport.transform, item.transform)

        const fontHeight = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]))

        const dividedHeight = item.height / fontHeight;

        const textRect = {
            x: Math.round(item.transform[4]),
            y: Math.round(item.transform[5]),
            width: Math.round(item.width),
            height: Math.round(dividedHeight <= 1 ? item.height : dividedHeight)
        }

        return <Word>{ text: item.str, font:'' , ...textRect }

    });

    return words
}

test( 'parse link', () => {

    return getDocument({
        url: path.join( 'samples', 'article-with-links.pdf'),
        cMapUrl: CMAP_URL,
        cMapPacked: CMAP_PACKED,
      }).promise
        .then( doc => {        
            expect(doc).not.toBeNull()
            expect(doc.numPages).toEqual(9)        
            return doc.getPage(1)
        .then( page => {
            expect(page).not.toBeUndefined()
            expect(page).not.toBeNull()
            
            return Promise.all( [getText(page), getLinks(page)] )
        }).then( ( [words, links] ) => {
            // console.log( 'words', words )
            expect(links?.length).toEqual(2)

            const dataverseWord = words.find( word => word.text.localeCompare('Dataverse')==0  )
            expect(dataverseWord).not.toBeNull()

            const workdwithlink = words.map( word => {
                    const result = links.find( link => matchLink( word, link ))
                    return [word, result ]
                }).filter( ([ word, link ] ) => link!=null )

            // console.log( workdwithlink )
            expect(workdwithlink?.length).toEqual(4)        

        })
        
      })
})