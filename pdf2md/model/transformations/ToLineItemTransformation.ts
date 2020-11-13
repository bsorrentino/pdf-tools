import Transformation from './Transformation';
import ParseResult from '../ParseResult';
import LineItem from '../LineItem';
//import LineItemPageView from '../../components/debug/LineItemPageView.jsx';
import { REMOVED_ANNOTATION } from '../Annotation.js';

// Abstract class for transformations producing LineItem(s) to be shown in the LineItemPageView
export default class ToLineItemTransformation implements Transformation {

    constructor( public name:string, public itemType = LineItem.name, public showWhitespaces = false ) {}
    
    transform(parseResult: ParseResult) { return parseResult }

    // showModificationCheckbox() {
    //     return true;
    // }

    // createPageView(page, modificationsOnly) {
    //     return <LineItemPageView
    //                              key={ page.index }
    //                              page={ page }
    //                              modificationsOnly={ modificationsOnly }
    //                              showWhitespaces={ this.showWhitespaces } />;
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