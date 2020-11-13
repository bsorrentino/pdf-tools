//import MarkdownPageView from '../../components/debug/MarkdownPageView.jsx';
import Transformation from './Transformation';
import ParseResult from '../ParseResult';

export default class ToMarkdown implements Transformation {

    constructor( public name = "To Markdown", public itemType ="String") {}
    
    completeTransform(parseResult: ParseResult): ParseResult {
        return parseResult
    }

    // createPageView(page, modificationsOnly) { // eslint-disable-line no-unused-vars
    //     return <MarkdownPageView key={ page.index } page={ page } />;
    // }

    transform(parseResult:ParseResult) {
        parseResult.pages.forEach(page => {
            var text = '';
            page.items.forEach(block => {
                text += block.text + '\n';
            });
            page.items = [text];
        });
        return { ...parseResult }
    }

}