import Transformation from './Transformation';
import ParseResult from '../ParseResult.js';
import LineItemBlock from '../LineItemBlock';
import { REMOVED_ANNOTATION } from '../Annotation';

// Abstract class for transformations producing LineItemBlock(s) to be shown in the LineItemBlockPageView
export default class ToLineItemBlockTransformation implements Transformation {

    constructor(public name:string, public itemType = LineItemBlock.name, public showWhitespaces = false) {}

    transform(parseResult: ParseResult) { return parseResult }

    // showModificationCheckbox() {
    //     return true;
    // }

    // createPageView(page, modificationsOnly) {
    //     return <LineItemBlockPageView
    //                                   key={ page.index }
    //                                   page={ page }
    //                                   modificationsOnly={ modificationsOnly }
    //                                   showWhitespaces={ this.showWhitespaces } />;
    // }

    completeTransform(parseResult:ParseResult) {
        // The usual cleanup
        parseResult.messages = [];
        parseResult.pages.forEach(page => {
            page.items = page.items.filter(item => !item.annotation || item.annotation !== REMOVED_ANNOTATION);
            page.items.forEach(item => item.annotation = null);
        });
        return parseResult;
    }

}