//
// extend third-party declaration files
//
// @see https://stackoverflow.com/a/46494277/521197
//
// refer to 'Module Augmentation'  https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation
//

//declare module "pdfjs-dist" {

    // declare enum PDFImageKind {
    //     GRAYSCALE_1BPP = 1,
    //     RGB_24BPP =  2,
    //     RGBA_32BPP = 3
    // }

    // interface PDFJSUtilStatic {
    //     transform( t1:any, t2:any ):number[4]
    // }
   
   declare interface PDFImage  {
        width:number
        height:number
        kind: PDFImageKind
        data:Uint8ClampedArray
    }
    
    // declare class PDFObjects {
    //     fnArray:Array<integer>

    //     argsArray: any[][]
    //     get<T>( op:any , callback?:(v:T) => void): T|null;

    // }

    // interface PDFMetadata {

    //     info:{ 
    //         PDFFormatVersion: string,
    //         IsLinearized: boolean,
    //         IsAcroFormPresent: boolean,
    //         IsXFAPresent: boolean,
    //         IsCollectionPresent: boolean,
    //         Producer: string,
    //         Creator: string,
    //         CreationDate: string,
    //         ModDate: string,
    //         Author?:string
    //         Title?:string
    //     },
    //     contentDispositionFilename: null  
    //     metadata?:any
    // }

    // interface PDFDocumentProxy {
    //     _transport:{
    //         commonObjs: PDFObjects
    //     }
    //     getMetadata():PDFPromise<PDFMetadata>
    // }

    // interface PDFPageViewport {
    //     transform:number[]
    // }

    declare interface PDFAnnotation {
        annotationFlags: number
        borderStyle: {
          width: number,
          style: number,
          dashArray: Array<any>,
          horizontalCornerRadius: number,
          verticalCornerRadius: number
        }
        color: [ number, number, number ]
        contents: string
        hasAppearance: boolean
        id: string
        modificationDate: null
        rect: [ number, number, number, number ]
        subtype: 'Link' | string
        annotationType: number
        url?: string
        unsafeUrl?: string

    }    

    type PDFLink = {
        x1:number
        y1:number
        x2:number
        y2:number
        url?:string
    }

//}
