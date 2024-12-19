import { PDFPageProxy } from 'pdfjs-dist/legacy/build/pdf.js'
import { Rect } from "./pdf2md.model"

export const matchLink = <T extends Rect>(rect:T, link:PDFLink) => 
  (rect.x >= link.x1 && rect.x + rect.width <= link.x2) &&
  (rect.y >= link.y1 && rect.y + rect.height <= link.y2)

  /**
 * Retrieves and processes annotations from a PDFPageProxy to return an array of PDFLink objects.
 * @param {PDFPageProxy} page - The PDFPageProxy object to process.
 * @returns {Promise<PDFLink[]>} A Promise that resolves to an array of PDFLink objects, each representing a link annotation in the page.
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