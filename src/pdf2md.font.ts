import { promisify } from "util"
import fs from 'fs'
import { Font, Globals } from "./pdf2md.model"

const checkFileExistsAsync = promisify(fs.access)
const readFileAsync = promisify(fs.readFile)

/**
 * 
 * @param fontMap 
 */
export async function loadLocalFonts( globals:Globals ) {
    const fontsFile = 'fonts.json'
  
    try {
      await checkFileExistsAsync(fontsFile)
    }
    catch (e) {
      console.warn(`WARN: file ${fontsFile} doesn't exists!`)
    }
  
    try {
      const contents = await readFileAsync(fontsFile)
  
      const fonts: { [name: string]: Font } = JSON.parse(contents.toString())
  
      Object.entries(fonts).forEach(([k, v]) => globals.addFont(k, v))
  
    }
    catch (e) {
      console.warn(`WARN: error loading and evaluating ${fontsFile}! - ${e.message}`)
    }
  }
  