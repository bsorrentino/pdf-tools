import { Enumify } from "enumify";
import { Globals, Stats } from "./pdf2md.model";
import { Page } from "./pdf2md.page";


class BlockType extends Enumify {


}

function processFont( fontId:string, globals:Globals ) {

/*    
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
*/
}

export function toMarkdown( page:Page, globals:Globals ) {

    const init = ''

    return page.rows.reduce( ( result, row, i ) => {

        if( row.containsImage ) {
            const url = row.image?.url
            result = result.concat(`![${url}](${globals.imageUrlPrefix}${url}.png "")`)
        }
        if( row.containsWords ) {
            result = result.concat( row.enhancedText.reduce( ( out, etext ) => out.concat(etext.text), '' ) )
        }
        
        return result.concat( '\n')

    }, init )

} 