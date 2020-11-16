import ToTextItemTransformation from '../ToTextItemTransformation';
import ParseResult from '../../ParseResult';
import WordFormat from '../../markdown/WordFormat';

export default class CalculateGlobalStats extends ToTextItemTransformation {
    fontMap:Map<string,FONT>

    constructor(fontMap:Map<string,FONT>) {
        super("Calculate Statistics");
        this.fontMap = fontMap;
    }

    transform(parseResult:ParseResult):ParseResult {

        // Parse heights
        const heightToOccurrence:{ [key:string]:any } = {};
        const fontToOccurrence:{ [key:string]:number } = {};
        let maxHeight = 0;
        let maxHeightFont:string|undefined;
        parseResult.pages.forEach(page => {
            page.items.forEach(item => {
                heightToOccurrence[item.height] = heightToOccurrence[item.height] ? heightToOccurrence[item.height] + 1 : 1;
                fontToOccurrence[item.font] = fontToOccurrence[item.font] ? fontToOccurrence[item.font] + 1 : 1;
                if (item.height > maxHeight) {
                    maxHeight = item.height;
                    maxHeightFont = item.font;
                }
            });
        });
        const mostUsedHeight = parseInt(getMostUsedKey(heightToOccurrence));
        const mostUsedFont = getMostUsedKey(fontToOccurrence);

        // Parse line distances
        const distanceToOccurrence = Array<number>();
        parseResult.pages.forEach(page => {
            let lastItemOfMostUsedHeight:any
            page.items.forEach(item => {
                if (item.height == mostUsedHeight && item.text.trim().length > 0) {
                    if (lastItemOfMostUsedHeight && item.y != lastItemOfMostUsedHeight.y) {
                        const distance = lastItemOfMostUsedHeight.y - item.y;
                        if (distance > 0) {
                            distanceToOccurrence[distance] = distanceToOccurrence[distance] ? distanceToOccurrence[distance] + 1 : 1;
                        }
                    }
                    lastItemOfMostUsedHeight = item;
                } else {
                    lastItemOfMostUsedHeight = null;
                }
            });
        });

        const mostUsedDistance = parseInt(getMostUsedKey(distanceToOccurrence));
        const fontIdToName = Array<string>();
        const fontToFormats = new Map<string,string>();

        this.fontMap.forEach( (value:FONT, key:string) => {
            
            fontIdToName.push( `${key}=${value.name}`)

            const fontName = value.name.toLowerCase();
            
            let format:WordFormat|null = null

            const isBold = () => fontName.includes('bold')
            const isItalic = () => fontName.includes('oblique') || fontName.includes('italic')

            if (key == mostUsedFont) {
                format = null;
            } else if (isBold() && isItalic() ) {
                format = WordFormat.BOLD_OBLIQUE;               
            } else if (isBold()) {
                format = WordFormat.BOLD;
            } else if ( isItalic() ) {
                format = WordFormat.OBLIQUE;
            } else if (fontName === maxHeightFont) {
                format = WordFormat.BOLD;
            } 

            if (format) 
                fontToFormats.set(key, format.enumKey);
                
        });
        fontIdToName.sort();

        //Make a copy of the originals so all following transformation don't modify them
        const newPages = parseResult.pages.map(page => {
            return {
                ...page,
                items: page.items.map(textItem => {
                    return { ...textItem, }
                })
            };
        });
        return {
            ...parseResult,
            pages: newPages,
            globals: {
                mostUsedHeight: mostUsedHeight,
                mostUsedFont: mostUsedFont,
                mostUsedDistance: mostUsedDistance,
                maxHeight: maxHeight,
                maxHeightFont: maxHeightFont,
                fontToFormats: fontToFormats
            },
            messages: [
                'Items per height: ' + JSON.stringify(heightToOccurrence),
                'Items per font: ' + JSON.stringify(fontToOccurrence),
                'Items per distance: ' + JSON.stringify(distanceToOccurrence),
                'Fonts:' + JSON.stringify(fontIdToName)
            ]
        }
    }


}

function getMostUsedKey(keyToOccurrence:any) {
    let maxOccurence = 0;
    let maxKey:any;
    Object.keys(keyToOccurrence).map((element) => {
        if (!maxKey || keyToOccurrence[element] > maxOccurence) {
            maxOccurence = keyToOccurrence[element];
            maxKey = element;
        }
    });
    return maxKey;
}