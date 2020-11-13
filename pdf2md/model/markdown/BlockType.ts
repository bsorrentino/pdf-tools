import { Enumify } from 'enumify';
import { linesToText } from './WordType';
import LineItemBlock from '../LineItemBlock';

type ToText = ( block:LineItemBlock ) => string
// An Markdown block
export default class BlockType extends Enumify {

    headline: boolean
    headlineLevel?: number
    toText:ToText
    mergeToBlock:boolean
    mergeFollowingNonTypedItems:boolean
    mergeFollowingNonTypedItemsWithSmallDistance:boolean

    constructor( options: { 
        headline?:boolean,
        headlineLevel?:number, 
        mergeToBlock?:boolean, 
        mergeFollowingNonTypedItems?:boolean, 
        mergeFollowingNonTypedItemsWithSmallDistance?:boolean
        toText:ToText }) 
    { 
        super() 
        this.headline = options.headline || false
        this.headlineLevel = options.headlineLevel
        this.mergeToBlock = options.mergeToBlock || false
        this.toText = options.toText
        this.mergeFollowingNonTypedItems = options.mergeFollowingNonTypedItems || false
        this.mergeFollowingNonTypedItemsWithSmallDistance = options.mergeFollowingNonTypedItemsWithSmallDistance || false
    }

    static H1 = new BlockType( {
        headline: true,
        headlineLevel: 1,
        toText(block:LineItemBlock) {
            return '# ' + linesToText(block.items, true);
        }
    })
    static H2 = new BlockType({
        headline: true,
        headlineLevel: 2,
        toText(block:LineItemBlock) {
            return '## ' + linesToText(block.items, true);
        }
    })
    static H3 = new BlockType( {
        headline: true,
        headlineLevel: 3,
        toText(block:LineItemBlock) {
            return '### ' + linesToText(block.items, true);
        }
    })
    static H4 = new BlockType( {
        headline: true,
        headlineLevel: 4,
        toText(block:LineItemBlock) {
            return '#### ' + linesToText(block.items, true);
        }
    })
    static H5 = new BlockType( {
        headline: true,
        headlineLevel: 5,
        toText(block:LineItemBlock) {
            return '##### ' + linesToText(block.items, true);
        }
    })
    static H6 = new BlockType( {
        headline: true,
        headlineLevel: 6,
        toText(block:LineItemBlock) {
            return '###### ' + linesToText(block.items, true);
        }
    })
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
    static _ = BlockType.closeEnum()
}


export function isHeadline(type: BlockType) {
    return type && type.enumKey.length == 2 && type.enumKey[0] === 'H'
}

export function blockToText(block: LineItemBlock) {
    if (!block.type) {
        return linesToText(block.items, false);
    }
    return block.type.toText(block);
}

export function headlineByLevel(level:number) {
    if (level == 1) {
        return BlockType.H1;
    } else if (level == 2) {
        return BlockType.H2;
    } else if (level == 3) {
        return BlockType.H3;
    } else if (level == 4) {
        return BlockType.H4;
    } else if (level == 5) {
        return BlockType.H5;
    } else if (level == 6) {
        return BlockType.H6;
    }
    throw "Unsupported headline level: " + level + " (supported are 1-6)";
}