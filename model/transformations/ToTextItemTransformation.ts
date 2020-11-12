import Transformation from './Transformation';
import ParseResult from '../ParseResult';
import TextItem from '../TextItem';
//import TextItemPageView from '../../components/debug/TextItemPageView';
import { REMOVED_ANNOTATION } from '../Annotation';

// Abstract class for transformations producing TextItem(s) to be shown in the TextItemPageView
export default class ToTextItemTransformation implements Transformation {

    constructor( public name:string, public itemType = TextItem.name, public showWhitespaces = false ) {}

    transform(parseResult: ParseResult) { return parseResult }

    //showModificationCheckbox() { return true; }

    // createPageView(page:any, modificationsOnly:any):any {
    //     return <TextItemPageView
    //                              key={ page.index }
    //                              page={ page }
    //                              modificationsOnly={ modificationsOnly }
    //                              showWhitespaces={ this.showWhitespaces } />;
    // }

    completeTransform(parseResult:ParseResult) {
        // The usual cleanup
        parseResult.messages = [];
        parseResult.pages.forEach(page => 
            page.items = 
                page.items.filter(item => !item.annotation || item.annotation !== REMOVED_ANNOTATION)
                            .map(item => { item.annotation = null; return item } )
        )
        return parseResult
    }


}