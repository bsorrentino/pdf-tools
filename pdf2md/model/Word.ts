import WordFormat from "./markdown/WordFormat";
import WordType from "./markdown/WordType";


export interface Word {
    string:string
    type?:WordType|null // WordType
    format?:WordFormat|null // WordFormat

}

export function wordOf( options:Word ):Word {
    return { ...options }
}