import { promisify } from "util"
import fs from 'fs'

const checkFileExistsAsync = promisify(fs.access)
const readFileAsync = promisify(fs.readFile)

/**
 * 
 * @param fontMap 
 */
export async function loadLocalFonts(fontMap: Map<string, FONT>) {
    const fontsFile = 'fonts.json'
  
    try {
      await checkFileExistsAsync(fontsFile)
    }
    catch (e) {
      console.warn(`WARN: file ${fontsFile} doesn't exists!`)
    }
  
    try {
      const contents = await readFileAsync(fontsFile)
  
      const fonts: { [name: string]: FONT } = JSON.parse(contents.toString())
  
      Object.entries(fonts).forEach(([k, v]) => fontMap.set(k, v))
  
    }
    catch (e) {
      console.warn(`WARN: error loading and evaluating ${fontsFile}! - ${e.message}`)
    }
  
    return fontMap
  }
  