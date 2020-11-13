import ToLineItemTransformation from '../ToLineItemTransformation';
import ParseResult from '../../ParseResult';
import LineItem from '../../LineItem';
import { Word, wordOf } from '../../Word';
import HeadlineFinder from '../../HeadlineFinder';
import { REMOVED_ANNOTATION, ADDED_ANNOTATION } from '../../Annotation';
import BlockType from '../../markdown/BlockType';
import { headlineByLevel } from '../../markdown/BlockType';
import { isDigit, isNumber, wordMatch, hasOnly } from '../../../stringFunctions'
import Page from '../../Page';
import TextItem from '../../TextItem';
import {FONT} from '../../TextItem';

//Detect table of contents pages plus linked headlines
export default class DetectTOC extends ToLineItemTransformation {

    constructor() {
        super("Detect TOC");
    }

    transform(parseResult:ParseResult) {
        const tocPages = Array<number>();
        const maxPagesToEvaluate = Math.min(20, parseResult.pages.length);
        const linkLeveler = new LinkLeveler()


        let tocLinks = Array<TocLink>()
        let lastTocPage:Page|null = null
        let headlineItem:LineItem|null;

        parseResult.pages.slice(0, maxPagesToEvaluate).forEach(page => {
            var lineItemsWithDigits = 0;
            const unknownLines = new Set();
            const pageTocLinks = Array<TocLink>()
            let lastWordsWithoutNumber:Array<Word>|null;
            let lastLine:LineItem;
            //find lines ending with a number per page
            page.items.forEach((line:LineItem) => {
                
                const words = line.words.filter(word => !hasOnly(word.string, '.'))
                const digits = Array<string>()

                while (words.length > 0 && isNumber(words[words.length - 1].string)) {
                    const lastWord = words.pop();
                    if( lastWord )
                        digits.unshift(lastWord.string);
                }

                if (digits.length == 0 && words.length > 0) {
                    const lastWord = words[words.length - 1];
                    while (isDigit(lastWord.string.charCodeAt(lastWord.string.length - 1))) {
                        digits.unshift(lastWord.string.charAt(lastWord.string.length - 1))
                        lastWord.string = lastWord.string.substring(0, lastWord.string.length - 1);
                    }
                }

                let endsWithDigit = digits.length > 0;
                
                if (endsWithDigit) {
                    endsWithDigit = true;
                    if (lastWordsWithoutNumber) { // 2-line item ?
                        words.push(...lastWordsWithoutNumber);
                        lastWordsWithoutNumber = null;
                    }
                    pageTocLinks.push(new TocLink({
                        pageNumber: parseInt(digits.join('')),
                        lineItem: new LineItem({
                            ...line,
                            words: words
                        })
                    }));
                    lineItemsWithDigits++;
                } else {
                    if (!headlineItem) {
                        headlineItem = line;
                    } else {
                        if (lastWordsWithoutNumber) {
                            unknownLines.add(lastLine);
                        }
                        lastWordsWithoutNumber = words;
                        lastLine = line;
                    }
                }
            });

            // page has been processed
            if (lineItemsWithDigits * 100 / page.items.length > 75) {
                tocPages.push(page.index + 1);
                lastTocPage = page;
                linkLeveler.levelPageItems(pageTocLinks);
                tocLinks.push(...pageTocLinks);

                const newBlocks = Array<LineItem>();
                page.items.forEach((line) => {
                    if (!unknownLines.has(line)) {
                        line.annotation = REMOVED_ANNOTATION;
                    }
                    newBlocks.push(line);
                    if (line === headlineItem) {
                        newBlocks.push(new LineItem({
                            ...line,
                            type: BlockType.H2,
                            annotation: ADDED_ANNOTATION
                        }));
                    }
                });
                page.items = newBlocks;
            } else {
                headlineItem = null;
            }
        });

        //all  pages have been processed
        var foundHeadlines = tocLinks.length;
        const notFoundHeadlines = Array<any>()
        const foundBySize = Array<any>()
        const headlineTypeToHeightRange:{ [name:string]:any } = {}; //H1={min:23, max:25}

        if (tocPages.length > 0) {
            // Add TOC items
            
            tocLinks.forEach(tocLink => {
                lastTocPage?.items.push(new LineItem({
                    words: [ wordOf({
                        type:null,
                        string: ' '.repeat(tocLink.level * 3) + '-'
                    })].concat(tocLink.lineItem.words),
                    type: BlockType.TOC,
                    annotation: ADDED_ANNOTATION
                }));
            });

            // Add linked headers
           
            const pageMapping = detectPageMappingNumber(
                                    parseResult.pages.filter(page => page.index > lastTocPage!.index), tocLinks);
            
            tocLinks.forEach(tocLink => {
                let linkedPage = parseResult.pages[tocLink.pageNumber + (pageMapping||0) ];
                var foundHealineItems;
                if (linkedPage) {
                    foundHealineItems = findHeadlineItems(linkedPage, tocLink.lineItem.text());
                    if (!foundHealineItems) { // pages are off by 1 ?
                        linkedPage = parseResult.pages[tocLink.pageNumber + (pageMapping||0) + 1];
                        if (linkedPage) {
                            foundHealineItems = findHeadlineItems(linkedPage, tocLink.lineItem.text());
                        }
                    }
                }
                if (foundHealineItems) {
                    addHeadlineItems(linkedPage, tocLink, foundHealineItems, headlineTypeToHeightRange)
                } else {
                    notFoundHeadlines.push(tocLink);
                }
            });

            // Try to find linked headers by height

            let fromPage = lastTocPage!.index + 2;
            
            let lastNotFound = Array<TocLink>()

            const rollupLastNotFound = (currentPageNumber:number) => {
                if (lastNotFound.length > 0) {
                    lastNotFound.forEach(notFoundTocLink => {
                        const headlineType = headlineByLevel(notFoundTocLink.level + 2);
                        const heightRange = headlineTypeToHeightRange[headlineType.enumKey];
                        if (heightRange) {
                            const [pageIndex, lineIndex] = findPageAndLineFromHeadline(parseResult.pages, notFoundTocLink, heightRange, fromPage, currentPageNumber);
                            if (lineIndex > -1) {
                                const page = parseResult.pages[pageIndex];
                                page.items[lineIndex].annotation = REMOVED_ANNOTATION;
                                page.items.splice(lineIndex + 1, 0, new LineItem({
                                    ...notFoundTocLink.lineItem,
                                    type: headlineType,
                                    annotation: ADDED_ANNOTATION,
                                }));
                                foundBySize.push(notFoundTocLink);
                            }
                        }
                    });
                    lastNotFound = Array<TocLink>();
                }
            }
            if (notFoundHeadlines.length > 0) {
                tocLinks.forEach(tocLink => {
                    if (notFoundHeadlines.includes(tocLink)) {
                        lastNotFound.push(tocLink);
                    } else {
                        rollupLastNotFound(tocLink.pageNumber);
                        fromPage = tocLink.pageNumber;
                    }
                });
                if (lastNotFound.length > 0) {
                    rollupLastNotFound(parseResult.pages.length);
                }
            }
        }



        const messages = [];
        messages.push('Detected ' + tocPages.length + ' table of content pages');
        if (tocPages.length > 0) {
            messages.push('TOC headline heights: ' + JSON.stringify(headlineTypeToHeightRange));
            messages.push('Found TOC headlines: ' + (foundHeadlines - notFoundHeadlines.length + foundBySize.length) + '/' + foundHeadlines);
        }
        if (notFoundHeadlines.length > 0) {
            messages.push('Found TOC headlines (by size): ' + foundBySize.map(tocLink => tocLink.lineItem.text()));
            messages.push('Missing TOC headlines: ' + notFoundHeadlines.filter(fTocLink => !foundBySize.includes(fTocLink)).map(tocLink => tocLink.lineItem.text() + '=>' + tocLink.pageNumber));
        }
        return {
            ...parseResult,
            globals: {
                ...parseResult.globals,
                tocPages: tocPages,
                headlineTypeToHeightRange: headlineTypeToHeightRange
            },
            messages: messages
        }
    }

}

//Find out how the TOC page link actualy translates to the page.index
function detectPageMappingNumber(pages:Array<Page>, tocLinks:Array<TocLink>) {
    for ( var tocLink of tocLinks ) {
        const page = findPageWithHeadline(pages, tocLink.lineItem.text());
        if (page) {
            return page.index - tocLink.pageNumber;
        }
    }
    return null;
}

function findPageWithHeadline(pages:Array<Page>, headline:any) {
    for ( var page of pages ) {
        if (findHeadlineItems(page, headline)) {
            return page;
        }
    }
    return null;
}

function findHeadlineItems(page:Page, headline:any) {
    const headlineFinder = new HeadlineFinder({ headline: headline });
    var lineIndex = 0;
    for ( var line of page.items ) {
        const headlineItems = headlineFinder.consume(line);
        if (headlineItems) {
            return {
                lineIndex: lineIndex,
                headlineItems: headlineItems
            };
        }
        lineIndex++;
    }
    return null;
}

function addHeadlineItems(page:Page, tocLink:TocLink, foundItems:any, headlineTypeToHeightRange:any) {

    foundItems.headlineItems.forEach( (item:any) => item.annotation = REMOVED_ANNOTATION);
    
    const headlineType = headlineByLevel(tocLink.level + 2);
    const headlineHeight = foundItems.headlineItems.reduce( (max:number, item:any) => Math.max(max, item.height), 0);

    page.items.splice(foundItems.lineIndex + 1, 0, new LineItem({
        ...foundItems.headlineItems[0],
        words: tocLink.lineItem.words,
        height: headlineHeight,
        type: headlineType,
        annotation: ADDED_ANNOTATION
    }));
    
    let range = headlineTypeToHeightRange[headlineType.enumKey];
    if (range) {
        range.min = Math.min(range.min, headlineHeight);
        range.max = Math.max(range.max, headlineHeight);
    } else {
        range = {
            min: headlineHeight,
            max: headlineHeight
        };
        headlineTypeToHeightRange[headlineType.enumKey] = range;
    }
}

type Range = {
    min:number,
    max:number
}

function findPageAndLineFromHeadline(pages:Array<Page>, tocLink:TocLink, heightRange:Range, fromPage:number, toPage:number) {
    const linkText = tocLink.lineItem.text().toUpperCase();
    for (var i = fromPage; i <= toPage; i++) {
        const page = pages[i - 1];
        const lineIndex = page.items.findIndex(line => {
            if (!line.type && !line.annotation && line.height >= heightRange.min && line.height <= heightRange.max) {
                const match = wordMatch(linkText, line.text());
                return match >= 0.5;
            }
            return false;
        });
        if (lineIndex > -1) return [i - 1, lineIndex];
    }
    return [-1, -1];
}

class LinkLeveler {
    levelByMethod:(( tocLinks:Array<TocLink>) => void)|null = null;
    uniqueFonts = Array<FONT>()
    
    constructor() {
    }

    levelPageItems(tocLinks:TocLink[]) {
        if (!this.levelByMethod) {
            const uniqueX = this.calculateUniqueX(tocLinks);
            if (uniqueX.length > 1) {
                this.levelByMethod = this.levelByXDiff;
            } else {
                const uniqueFonts = this.calculateUniqueFonts(tocLinks);
                if (uniqueFonts.length > 1) {
                    this.uniqueFonts = uniqueFonts;
                    this.levelByMethod = this.levelByFont;
                } else {
                    this.levelByMethod = this.levelToZero;
                }
            }
        }
        this.levelByMethod(tocLinks);
    }

    levelByXDiff(tocLinks:Array<TocLink>) {
        const uniqueX = this.calculateUniqueX(tocLinks);
        tocLinks.forEach(link => {
            link.level = uniqueX.indexOf(link.lineItem.x);
        });
    }

    levelByFont(tocLinks:Array<TocLink>) {
        tocLinks.forEach(link => {
            link.level = this.uniqueFonts.indexOf(link.lineItem.font);
        });
    }

    levelToZero(tocLinks:Array<TocLink>) {
        tocLinks.forEach(link => {
            link.level = 0;
        });
    }

    calculateUniqueX(tocLinks:Array<TocLink>) {
        var uniqueX = tocLinks.reduce(function(uniquesArray, link) {
            if (uniquesArray.indexOf(link.lineItem.x) < 0) uniquesArray.push(link.lineItem.x);
            return uniquesArray;
        }, Array<number>());

        uniqueX.sort((a, b) => {
            return a - b
        });

        return uniqueX;
    }

    calculateUniqueFonts(tocLinks:Array<TocLink>) {
        return tocLinks.reduce((uniquesArray, link) => {
            if (uniquesArray.indexOf(link.lineItem.font) < 0) uniquesArray.push(link.lineItem.font);
            return uniquesArray;
        }, Array<any>() )
    }

}

type ITEM = any
/**
 * 
 */
class TocLink {

    lineItem:ITEM
    pageNumber:number
    level = 0;

    constructor(options: { lineItem:ITEM, pageNumber:number } ) {
        this.lineItem = options.lineItem;
        this.pageNumber = options.pageNumber;
    }
}
