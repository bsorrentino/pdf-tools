import type { PDFPageProxy } from 'pdfjs-dist/types/display/api'; 
import { Word } from "./pdf2md.model"

/**
 * 
 * @param word 
 * @param link 
 * @returns 
 */
export const matchLink = (word:Word, link:PDFLink) => 
  (word.x >= link.x1 && word.x + word.width <= link.x2) &&
  (word.y >= link.y1 && word.y + word.height <= link.y2)

/**
 * 
 * @param page 
 * @returns 
 */
export async function getLinks( page:PDFPageProxy ):Promise<PDFLink[]> {

  const annotations = await page.getAnnotations() as Array<PDFAnnotation>

  return annotations.filter( ann => ann.subtype == 'Link').map( link => (
      {
          x1:Math.round( link.rect[0] ),y1:Math.round( link.rect[1] ),
          x2:Math.round( link.rect[2] ),y2:Math.round( link.rect[3] ),
          url:link.url
      }
  ))

}
