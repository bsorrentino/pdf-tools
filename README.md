# pdf-tools

Tools to extract/transform data from PDF

> inspired by project: [pdf-to-markdown](https://github.com/jzillmann/pdf-to-markdown)


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

__TO DO__