import assert = require('assert')

import { Enumify } from "enumify";
import { EnhancedWord, Globals, ItemTransformer, Stats } from "./pdf2md.model";
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

export default class WordFormat extends Enumify {

    constructor( public toText:ToText ) { super() }

    static BOLD             = new WordFormat( ( text ) => `**${text}**` )
    static OBLIQUE          = new WordFormat( ( text ) => `_${text}_` )
    static BOLD_OBLIQUE     = new WordFormat( ( text ) => `**_${text}_**` )
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
function detectHeaders(row: Row, globals: Globals) {

    if (row.enhancedText.length == 1) {

        const mostUsedHeight = globals.stats.mostUsedTextHeight

        const etext = row.enhancedText[0];

        if( etext.height > mostUsedHeight ) {

            const level = globals.stats.textHeigths.findIndex( v => v == etext.height ) 
            assert( level >=0 , `height ${etext.height} not present in textHeights stats!` )

            const blockType = blockTypeByLevel( level+1 )
            
            etext.addTransformer(blockType.toText);

        }
    }

}

function detectFonts(row: Row, globals: Globals) {

    row.enhancedText.forEach( etext => {

        const fontId    = etext.font
        const font      = globals.getFont( fontId )

        if (font && font.name != null && fontId != globals.stats.mostUsedFont) {

            const fontName = font.name.toLowerCase()
            
            // console.log( `font['${fontId}']=${fontName}` )

            const isBold = () => fontName.includes('bold')
            const isItalic = () => fontName.includes('oblique') || fontName.includes('italic')
            
            if (isBold() && isItalic() ) {
                etext.addTransformer( WordFormat.BOLD_OBLIQUE.toText )              
            } else if (isBold()) {
                etext.addTransformer( WordFormat.BOLD.toText )
            } else if ( isItalic() ) {
                etext.addTransformer( WordFormat.OBLIQUE.toText );
            } else if (fontName === globals.stats.maxHeightFont) {
                etext.addTransformer( WordFormat.BOLD_OBLIQUE.toText )
            } 
        }

    })
}

export function toMarkdown(page: Page, globals: Globals) {
    //const pageContainsMaxHeight = page.rows.filter(row => row.containsWords).findIndex(row => row.containsTextWithHeight(globals.stats.maxTextHeight)) >= 0

    const init = ''

    return page.rows.reduce((result, row, i) => {

        if (row.containsImage) {
            const url = row.image?.url
            result = result.concat(`![${url}](${globals.imageUrlPrefix}${url}.png "")`)
        }
        if (row.containsWords) {

            detectHeaders(row, globals )         
            detectFonts( row, globals )

            result = result.concat(row.enhancedText.reduce((out, etext) => out.concat(etext.toMarkdown()), ''))

        }

        return result.concat('\n')

    }, init)

} 