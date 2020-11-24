import Transformation from './Transformation';
//import TextPageView from '../../components/debug/TextPageView.jsx';
import ParseResult from '../ParseResult';
import { blockToText } from '../markdown/BlockType';

export default class ToTextBlocks implements Transformation {

    constructor( public name = "To Text Blocks", public itemType ="TextBlock" ) {}
    
    
    // showModificationCheckbox(): boolean {  
    //     throw new Error('Method not implemented.');
    // }

    completeTransform(parseResult: ParseResult): ParseResult { return parseResult }

    // createPageView(page:Page, modificationsOnly:boolean) { 
    //     return <TextPageView key={ page.index } page={ page } />;
    // }

    transform(parseResult:ParseResult):ParseResult {
        parseResult.pages.forEach(page => {
            const textItems:any = []
            page.items.forEach(block => {
                //TODO category to type (before have no unknowns, have paragraph)
                const category = block.type ? block.type.name : 'Unknown'; 
                textItems.push({
                    category: category,
                    text: blockToText(block)
                });
            });
            page.items = textItems;
        });
        return { ...parseResult } 
    }

}