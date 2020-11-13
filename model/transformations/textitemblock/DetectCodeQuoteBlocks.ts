import ToLineItemBlockTransformation from '../ToLineItemBlockTransformation';
import ParseResult from '../../ParseResult';
import { DETECTED_ANNOTATION } from '../../Annotation';
import BlockType from '../../markdown/BlockType';
import { minXFromBlocks } from '../../pageItemFunctions';

//Detect items which are code/quote blocks
export default class DetectCodeQuoteBlocks extends ToLineItemBlockTransformation {

    constructor() {
        super("Detect Code/Quote Blocks");
    }

    transform(parseResult:ParseResult) {
        const {mostUsedHeight} = parseResult.globals;
        let foundCodeItems = 0;
        parseResult.pages.forEach(page => {
            const minX = minXFromBlocks(page.items);
            page.items.forEach(block => {
                if (!block.type && looksLikeCodeBlock(minX||0, block.items, mostUsedHeight)) {
                    block.annotation = DETECTED_ANNOTATION;
                    block.type = BlockType.CODE;
                    foundCodeItems++;
                }
            });
        });

        return {
            ...parseResult,
            messages: [
                'Detected ' + foundCodeItems + ' code/quote items.',
            ]
        }

    }

}

function looksLikeCodeBlock(minX:number, items:any, mostUsedHeight:number) {
    if (items.length == 0) {
        return false;
    }
    if (items.length == 1) {
        return items[0].x > minX && items[0].height <= mostUsedHeight + 1;
    }
    for ( var item of items ) {
        if (item.x == minX) {
            return false;
        }
    }
    return true;
}
