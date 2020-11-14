# extract-pdf-images
Extract images from PDF


inspired by project: [pdf-to-markdown](https://github.com/jzillmann/pdf-to-markdown)


## Font 

Font currently are not supported. 

the mapping is contained in `pdf2md/model/transformations/textitem/CalculateGlobalStats.ts` module

font name shoul containing `bold`, `oblique`, `italic`

** `font.json` sample**
```
{
    "g_d0_f1": {
        "name": "Normal"
    },
    "g_d0_f2": {
        "name": "Bold"
    }

}
```
