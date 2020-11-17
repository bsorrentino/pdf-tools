/// <reference types="pdfjs-dist" />

import { PDFPageProxy, PDFDocumentProxy, PDFPromise, PDFObjects } from "pdfjs-dist";

//
// extend third-party declaration files
//
// @see https://stackoverflow.com/a/46494277/521197
//
// refer to 'Module Augmentation'  https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation
//
declare module "pdfjs-dist" {

    enum PDFImageKind {
        GRAYSCALE_1BPP = 1,
        RGB_24BPP =  2,
        RGBA_32BPP = 3
    }

    interface PDFJSUtilStatic {
        transform( t1:any, t2:any ):number[4]
    }
    
   interface PDFImage  {
        width:number
        height:number
        kind: PDFImageKind
        data:Uint8ClampedArray
    }
    
    interface PDFObjects {
        fnArray:Array<integer>

        argsArray: any[][]
        get<T>( op:any , callback?:(v:T) => void): T|null;

    }

    interface PDFMetadata {

        info:{ 
            PDFFormatVersion: string,
            IsLinearized: boolean,
            IsAcroFormPresent: boolean,
            IsXFAPresent: boolean,
            IsCollectionPresent: boolean,
            Producer: string,
            Creator: string,
            CreationDate: string,
            ModDate: string,
            Author?:string
            Title?:string
        },
        contentDispositionFilename: null  
        metadata?:any
    }

    interface PDFPageProxy {
        objs: PDFObjects

        getOperatorList(): Promise<PDFObjects>

        commonObjs:PDFObjects 
    }

    interface PDFDocumentProxy {
        _transport:{
            commonObjs: PDFObjects
        }
        getMetadata():PDFPromise<PDFMetadata>
    }

    interface PDFPageViewport {
        transform:number[]
    }

    const OPS = {
        dependency: number,
        setLineWidth: number,
        setLineCap: number,
        setLineJoin: number,
        setMiterLimit: number,
        setDash: number,
        setRenderingIntent: number,
        setFlatness: number,
        setGState: number,
        save: number,
        restore: number,
        transform: number,
        moveTo: number,
        lineTo: number,
        curveTo: number,
        curveTo2: number,
        curveTo3: number,
        closePath: number,
        rectangle: number,
        stroke: number,
        closeStroke: number,
        fill: number,
        eoFill: number,
        fillStroke: number,
        eoFillStroke: number,
        closeFillStroke: number,
        closeEOFillStroke: number,
        endPath: number,
        clip: number,
        eoClip: number,
        beginText: number,
        endText: number,
        setCharSpacing: number,
        setWordSpacing: number,
        setHScale: number,
        setLeading: number,
        setFont: number,
        setTextRenderingMode: number,
        setTextRise: number,
        moveText: number,
        setLeadingMoveText: number,
        setTextMatrix: number,
        nextLine: number,
        showText: number,
        showSpacedText: number,
        nextLineShowText: number,
        nextLineSetSpacingShowText: number,
        setCharWidth: number,
        setCharWidthAndBounds: number,
        setStrokeColorSpace: number,
        setFillColorSpace: number,
        setStrokeColor: number,
        setStrokeColorN: number,
        setFillColor: number,
        setFillColorN: number,
        setStrokeGray: number,
        setFillGray: number,
        setStrokeRGBColor: number,
        setFillRGBColor: number,
        setStrokeCMYKColor: number,
        setFillCMYKColor: number,
        shadingFill: number,
        beginInlineImage: number,
        beginImageData: number,
        endInlineImage: number,
        paintXObject: number,
        markPoint: number,
        markPointProps: number,
        beginMarkedContent: number,
        beginMarkedContentProps: number,
        endMarkedContent: number,
        beginCompat: number,
        endCompat: number,
        paintFormXObjectBegin: number,
        paintFormXObjectEnd: number,
        beginGroup: number,
        endGroup: number,
        beginAnnotations: number,
        endAnnotations: number,
        beginAnnotation: number,
        endAnnotation: number,
        paintJpegXObject: number,
        paintImageMaskXObject: number,
        paintImageMaskXObjectGroup: number,
        paintImageXObject: number,
        paintInlineImageXObject: number,
        paintInlineImageXObjectGroup: number,
        paintImageXObjectRepeat: number,
        paintImageMaskXObjectRepeat: number,
        paintSolidColorImageMask: number,
        constructPath: number
    }


}
