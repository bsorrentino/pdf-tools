import assert = require('assert')

import { Enumify } from "enumify";
import { EnhancedText, Globals, Stats } from "./pdf2md.model";
import { Page, Row } from "./pdf2md.page";


type ToText = (text: string) => string

// An Markdown block
export default class BlockType extends Enumify {

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

    if (row.containsWords && row.enhancedText.length == 1) {

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

function processFont(fontId: string, globals: Globals) {

    /*    
        const isBold = () => fontName.includes('bold')
        const isItalic = () => fontName.includes('oblique') || fontName.includes('italic')
    
        if (key == mostUsedFont) {
            format = null;
        } else if (isBold() && isItalic() ) {
            format = WordFormat.BOLD_OBLIQUE;               
        } else if (isBold()) {
            format = WordFormat.BOLD;
        } else if ( isItalic() ) {
            format = WordFormat.OBLIQUE;
        } else if (fontName === maxHeightFont) {
            format = WordFormat.BOLD;
        } 
    */
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

            result = result.concat(row.enhancedText.reduce((out, etext) => out.concat(etext.text), ''))


        }

        return result.concat('\n')

    }, init)

} 