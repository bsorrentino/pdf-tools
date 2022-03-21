/**
 * @link: https://github.com/mozilla/pdf.js/blob/master/examples/node/pdf2png/pdf2png.js
 */
/// <reference path="../pdfjs.d.ts" />

import path from 'path'
import { getDocument, Util, PDFPageProxy } from 'pdfjs-dist/legacy/build/pdf.js';
import { getLinks, matchLink } from '../pdf2md.link';
import { Word } from '../pdf2md.model';
import { TextItem } from 'pdfjs-dist/types/src/display/api';
// import { DH_CHECK_P_NOT_PRIME } from 'constants';

// Some PDFs need external cmaps.
const CMAP_URL = "../../../node_modules/pdfjs-dist/cmaps/";
const CMAP_PACKED = true;

// Where the standard fonts are located.
const STANDARD_FONT_DATA_URL =
  "../../../node_modules/pdfjs-dist/standard_fonts/";

async function getText(page:PDFPageProxy):Promise<Word[]> {
    const scale = 1.0;

    const viewport = page.getViewport({ scale: scale });

    const textContent = await page.getTextContent()

    const words = textContent.items
        .filter( (item:any) => item.transform!==undefined )
        .map( (item:any) => {
        
        item = item as TextItem

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

type WorkWithLinkTuple = [Word,PDFLink|undefined]

test( 'parse link', async () => {

    const doc = await getDocument({
        url: path.join( 'samples', 'article-with-links.pdf'),
        cMapUrl: CMAP_URL,
        cMapPacked: CMAP_PACKED,
        standardFontDataUrl: STANDARD_FONT_DATA_URL
    }).promise


    expect(doc).not.toBeNull()
    expect(doc.numPages).toEqual(9)        

    const page = await doc.getPage(1)

    expect(page).not.toBeUndefined()
    expect(page).not.toBeNull()
            
    const [words, links] = await Promise.all( [getText(page), getLinks(page)] )

    expect(links?.length).toEqual(2)

    const dataverseWord = words.find( word => word.text.localeCompare('Dataverse')==0  )
    expect(dataverseWord).not.toBeNull()

    const workdwithlink = 
            words.map<WorkWithLinkTuple>( word => {
                    const result = links.find( link => matchLink( word, link ))
                    return [word, result] 
                })
                .filter( ([ _, link ] ) => link!=null )

    workdwithlink.forEach( lnk => console.log( 'workdwithlink', lnk) )
    // console.log( workdwithlink )
    expect(workdwithlink.length).toEqual(7)        

})
