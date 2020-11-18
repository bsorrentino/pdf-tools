import { Globals } from "./pdf2md.model";
import { Page } from "./pdf2md.page";


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