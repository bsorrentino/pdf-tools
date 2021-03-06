
import ToLineItemTransformation from '../ToLineItemTransformation';
import ParseResult from '../../ParseResult';
import LineItem from '../../LineItem';
import TextItemLineGrouper from '../../TextItemLineGrouper';
import LineConverter from '../../LineConverter';
import BlockType from '../../markdown/BlockType';
import { REMOVED_ANNOTATION, ADDED_ANNOTATION } from '../../Annotation';


// gathers text items on the same y line to one line item
export default class CompactLines extends ToLineItemTransformation {

    constructor() {
        super("Compact To Lines");
    }

    transform(parseResult:ParseResult) {
        const {mostUsedDistance, fontToFormats} = parseResult.globals;
        const foundFootnotes:Array<any> = [];
        const foundFootnoteLinks:Array<any> = [];
        var linkCount = 0;
        var formattedWords = 0;

        const lineGrouper = new TextItemLineGrouper({
            mostUsedDistance: mostUsedDistance,
        });
        const lineCompactor = new LineConverter(fontToFormats);

        parseResult.pages.forEach(page => {
            if (page.items.length > 0) {
                const lineItems:Array<any> = [];
                const textItemsGroupedByLine = lineGrouper.group(page.items);
                textItemsGroupedByLine.forEach(lineTextItems => {
                    const lineItem = lineCompactor.compact(lineTextItems);
                    if (lineTextItems.length > 1) {
                        lineItem.annotation = ADDED_ANNOTATION;
                        lineTextItems.forEach(item => {
                            item.annotation = REMOVED_ANNOTATION;
                            lineItems.push(new LineItem({
                                ...item
                            }));
                        });
                    }
                    if (lineItem.words.length == 0) {
                        lineItem.annotation = REMOVED_ANNOTATION;
                    }
                    lineItems.push(lineItem);

                    if (lineItem.parsedElements.formattedWords) {
                        formattedWords += lineItem.parsedElements.formattedWords;
                    }
                    if (lineItem.parsedElements.containLinks > 0) {
                        linkCount++;
                    }
                    if (lineItem.parsedElements.footnoteLinks.length > 0) {
                        // const footnoteLinks = lineItem.parsedElements.footnoteLinks.map(() => <span key={ footnoteLink }><a href={ "#Page " + (page.index + 1) }>{ footnoteLink }</a>,</span>);
                        // foundFootnoteLinks.push.apply(foundFootnoteLinks, footnoteLinks);
                    }
                    if (lineItem.parsedElements.footnotes.length > 0) {
                        lineItem.type = BlockType.FOOTNOTES;
                        // const footnotes = lineItem.parsedElements.footnotes.map(() => <span key={ footnote }><a href={ "#Page " + (page.index + 1) }>{ footnote }</a>,</span>);
                        // foundFootnotes.push.apply(foundFootnotes, footnotes);
                    }
                });
                page.items = lineItems;
            }
        });


        return {
            ...parseResult,
            messages: [
                'Detected ' + formattedWords + ' formatted words',
                'Found ' + linkCount + ' links',
                //<span>Detected { foundFootnoteLinks.length } footnotes links: [{ foundFootnoteLinks }]</span>,
                //<span>Detected { foundFootnotes.length } footnotes: [{ foundFootnotes }]</span>,
            ]
        }
    }


}
