import ToLineItemTransformation from '../ToLineItemTransformation';
import ParseResult from '../../ParseResult';
import LineItem from '../../LineItem';
import { REMOVED_ANNOTATION, ADDED_ANNOTATION, DETECTED_ANNOTATION } from '../../Annotation';
import BlockType from '../../markdown/BlockType';
import { isListItemCharacter, isNumberedListItem } from '../../../stringFunctions';
import { wordOf } from '../../Word';

//Detect items starting with -, •, etc...
export default class DetectListItems extends ToLineItemTransformation {
  
    constructor() {
        super("Detect List Items");
    }

    transform(parseResult:ParseResult) {
        var foundListItems = 0;
        var foundNumberedItems = 0;
        parseResult.pages.forEach(page => {
            
            const newItems:Array<any> = [];

            page.items.forEach( (_item:any) => {

                newItems.push(_item);

                if (!_item.type) {
                    const item = _item as LineItem

                    const text = item.text();
                    if (isListItemCharacter(item.words[0].string)) {
                        foundListItems++
                        if (item.words[0].string === '-') {
                            item.annotation = DETECTED_ANNOTATION;
                            item.type = BlockType.LIST;
                        } else {
                            item.annotation = REMOVED_ANNOTATION;
                            const newWords = item.words.map(word => wordOf(word) );
                            newWords[0].string = '-';
                            newItems.push(new LineItem({
                                ...item,
                                words: newWords,
                                annotation: ADDED_ANNOTATION,
                                type: BlockType.LIST
                            }));
                        }
                    } else if (isNumberedListItem(text)) { //TODO check that starts with 1 (kala chakra)
                        foundNumberedItems++;
                        item.annotation = DETECTED_ANNOTATION;
                        item.type = BlockType.LIST;
                    }
                }
            });
            page.items = newItems;
        });

        return {
            ...parseResult,
            messages: [
                'Detected ' + foundListItems + ' plain list items.',
                'Detected ' + foundNumberedItems + ' numbered list items.'
            ]
        }

    }

}
