[![npm](https://img.shields.io/npm/v/@bsorrentino/pdf-tools.svg)](https://www.npmjs.com/package/@bsorrentino/pdf-tools)&nbsp;
<img src="https://img.shields.io/github/forks/bsorrentino/pdf-tools.svg">&nbsp;
<img src="https://img.shields.io/github/stars/bsorrentino/pdf-tools.svg">&nbsp;
<a href="https://github.com/bsorrentino/pdf-tools/issues">
<img src="https://img.shields.io/github/issues/bsorrentino/pdf-tools.svg"></a>&nbsp;
![example workflow](https://github.com/bsorrentino/pdf-tools/actions/workflows/npm-publish.yml/badge.svg)

# pdf-tools

Tools to extract/transform data from PDF

> inspired by project: [pdf-to-markdown](https://github.com/jzillmann/pdf-to-markdown)

## Installation

```
npm install pdf-tools -g
```

## Requirements

* NodeJs >= 16
* Since **pdf-tools** use [`canvas`] that is a [`Cairo`]-backed Canvas implementation for Node.js take a look to its [reqirements]


## pdftools Commands 

**common options**
```
 -o, --outdir [folder]        output folder (default: "out")
```

### pdfximages

extract images (as png) from pdf and save it to the given folder

**Usage:** 
```
pdftools pdfximages|pxi [options] <pdf>
```

### pdf2images

create an image (as png) for each pdf page

**Usage:** 
```
pdftools pdf2images|p2i <pdf>
```

### pdf2md 

convert pdf to markdown format.

**Usage:** 
```
pdftools pdf2md|p2md [options] <pdf>
```

**Options:**
```
  --stats     print stats information
  --debug     print debug information
```

----

## Conversion to Markdown 

### supported features

* Detect headers
* Detect and extract images 
* Extract plain text 
* Extract fonts and allow custom mapping through a generated file `<document name>.font.json`
  > Supported fonts **bold**, _italic_, `monspace`, **_bold+italic_**
* Detect code block ( i.e. ` ``` `)
* Detect external link

### TO DO

* Detect TOC

[`canvas`]: https://www.npmjs.com/package/canvas
[`Cairo`]: http://cairographics.org/
[reqirements]: https://github.com/Automattic/node-canvas#compiling