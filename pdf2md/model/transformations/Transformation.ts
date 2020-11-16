import ParseResult from '../ParseResult';

// A transformation from an PdfPage to an PdfPage
export default interface Transformation {

    name: string;
    itemType: string;

    // Transform an incoming ParseResult into an outgoing ParseResult
    transform(parseResult: ParseResult) :any
    
    // Sometimes the transform() does only visualize a change. This methods then does the actual change.
    completeTransform(parseResult: ParseResult):ParseResult 

}