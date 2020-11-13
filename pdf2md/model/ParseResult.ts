import Page from "./Page";

// The result of a PDF parse respectively a Transformation
export default interface ParseResult {
    pages:Array<Page>, // like Page[]
    globals?:any, // properties accasable for all the following transformations in debug mode
    messages?:Array<string> // something to show only for the transformation in debug mode

}
