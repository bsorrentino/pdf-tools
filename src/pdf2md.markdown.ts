import assert = require('assert')

import { Enumify } from "enumify";
import { globals } from './pdf2md.global';
import { ItemTransformer } from "./pdf2md.model";
import { Page, Row } from "./pdf2md.page";


type ToText = ItemTransformer<string>

// An Markdown block
class BlockType extends Enumify {

    toText: ToText

    constructor(options: {
        toText: ToText
    }) {
        super()
        this.toText = options.toText
    }

    static H1 = new BlockType({
        toText: (block) => `# ${block}`
    })
    static H2 = new BlockType({
        toText: (block) => `## ${block}`
    })
    static H3 = new BlockType({
        toText: (block) => `### ${block}`
    })
    static H4 = new BlockType({
        toText: (block) => `#### ${block}`

    })
    static H5 = new BlockType({
        toText: (block) => `##### ${block}`
    })
    static H6 = new BlockType({
        toText: (block) => `###### ${block}`
    })
    /*
        static TOC = new BlockType( {
            mergeToBlock: true,
            toText(block:LineItemBlock) {
                return linesToText(block.items, true);
            }
        })
        static FOOTNOTES = new BlockType({
            mergeToBlock: true,
            mergeFollowingNonTypedItems: true,
            toText(block:LineItemBlock) {
                return linesToText(block.items, false);
            }
        })
    
        static CODE = new BlockType( {
            mergeToBlock: true,
            toText(block:LineItemBlock) {
                return '```\n' + linesToText(block.items, true) + '```'
            }
        })
        static LIST = new BlockType( {
            mergeToBlock: true,
            mergeFollowingNonTypedItemsWithSmallDistance: true,
            toText(block:LineItemBlock) {
                return linesToText(block.items, false);
            }
        })
        static PARAGRAPH = new BlockType( {
            toText(block:LineItemBlock) {
                return linesToText(block.items, false);
            }
        })
    */
    static _ = BlockType.closeEnum()
}


export function isHeadline(type: BlockType) {
    return type && type.enumKey.length == 2 && type.enumKey[0] === 'H'
}

const  formatTextDetectingTrailingSpaces = ( text:string, prefix:string, suffix?:string ) =>  {
    if( !suffix ) suffix = prefix
    const rx = /^(.+[^\s])(\s*)$/.exec(text)
    return ( rx ) ? `${prefix}${rx[1]}${suffix}${rx[2]}` : 'null'
}

export default class WordFormat extends Enumify {

    constructor( public toText:ToText ) { super() }

    static BOLD             = new WordFormat( ( text ) => formatTextDetectingTrailingSpaces(text, '**') )

    static OBLIQUE          = new WordFormat( ( text ) => formatTextDetectingTrailingSpaces(text, '_') )

    static BOLD_OBLIQUE     = new WordFormat( ( text ) => formatTextDetectingTrailingSpaces(text, '**_', '_**') )

    static MONOSPACE        = new WordFormat( ( text ) => formatTextDetectingTrailingSpaces(text, '`') )

    static _ = WordFormat.closeEnum()
}

// export function blockToText(block: LineItemBlock) {
//     if (!block.type) {
//         return linesToText(block.items, false);
//     }
//     return block.type.toText(block);
// }

/**
 * 
 * @param level 
 */
function blockTypeByLevel(level: number):BlockType {

    const blockType = BlockType.enumValues.find( e => e.enumKey == `H${level}` ) 

    assert( blockType, `Unsupported headline level: ${level} (supported are 1-6)` )

    return blockType as BlockType
}

/**
 * 
 * @param row 
 * @param globals 
 */
function detectHeaders(row: Row) {

    if (row.enhancedText.length == 1) {

        const mostUsedHeight = globals.stats.mostUsedTextHeight

        const etext = row.enhancedText[0];

        if( etext.height != mostUsedHeight || etext.font != globals.stats.mostUsedFont ) {

            const level = globals.stats.textHeigths.findIndex( v => v == etext.height ) 
            assert( level >=0 , `height ${etext.height} not present in textHeights stats!` )

            const blockType = blockTypeByLevel( level+1 )
            
            etext.addTransformer(blockType.toText);

        }
    }

}

function detectFonts(row: Row ) {

    row.enhancedText.forEach( etext => {

        const fontId    = etext.font
        const font      = globals.getFont( fontId )

        if (font && font.name != null && fontId != globals.stats.mostUsedFont) {

            const fontName = font.name.toLowerCase()
            
            // console.log( `font['${fontId}']=${fontName}` )

            const isBold = () => fontName.includes('bold')
            const isItalic = () => fontName.includes('oblique') || fontName.includes('italic')
            const isCode = () => fontName.includes('monospace') || fontName.includes('code')
            
            if (isBold() && isItalic() ) {
                etext.addTransformer( WordFormat.BOLD_OBLIQUE.toText )              
            } else if (isBold()) {
                etext.addTransformer( WordFormat.BOLD.toText )
            } else if ( isItalic() ) {
                etext.addTransformer( WordFormat.OBLIQUE.toText );
            } else if (isCode()) {
                etext.addTransformer( WordFormat.MONOSPACE.toText )
            } else if (fontName === globals.stats.maxHeightFont) {
                etext.addTransformer( WordFormat.BOLD_OBLIQUE.toText )
            } 
        }

    })
}

export function toMarkdown(page: Page ) {
    //const pageContainsMaxHeight = page.rows.filter(row => row.containsWords).findIndex(row => row.containsTextWithHeight(globals.stats.maxTextHeight)) >= 0

    const init = ''

    return page.rows.reduce((result, row, i) => {

        let md = ''
        if ( row.images ) {
         
            md = row.images.reduce ( (out, img) => 
                    out.concat(`![${img.url}](${globals.imageUrlPrefix}${img.url}.png "")`) , '') 

        }
        if (row.containsWords) {

            detectHeaders(row )         
            detectFonts( row )

            md = row.enhancedText.reduce((out, etext) => out.concat(etext.toMarkdown()), '')

        }

        return result.concat(md).concat('\n')

    }, init)

} 