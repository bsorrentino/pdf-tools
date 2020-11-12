import WordFormat from "./markdown/WordFormat";
import WordType from "./markdown/WordType";

export default interface Word {
    string:string
    type:WordType // WordType
    format?:WordFormat // WordFormat

}