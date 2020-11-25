// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"FrYy":[function(require,module,exports) {
"use strict";

var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.globals = void 0;

const assert = require("assert");

const path_1 = __importDefault(require("path"));

const fs_1 = __importDefault(require("fs"));

const util_1 = require("util");

const checkFileExistsAsync = util_1.promisify(fs_1.default.access);
const readFileAsync = util_1.promisify(fs_1.default.readFile);
const writeFileAsync = util_1.promisify(fs_1.default.writeFile);

class Globals {
  constructor() {
    this._fontMap = new Map();
    this._textHeights = new Map();
    this.isFillerEnabled = false;
    this._stats = null;
    this.outDir = path_1.default.join(process.cwd(), 'out');
    this.imageUrlPrefix = process.env['IMAGE_URL'] || '';
  }

  addFont(fontId, font) {
    assert(font, `font ${fontId} is not valid ${font}`);
    let value = this._fontMap.get(fontId) || Object.assign(Object.assign({}, font), {
      occurrence: 0
    });
    value.occurrence++;

    this._fontMap.set(fontId, value);
  }

  getFont(fontId) {
    return this._fontMap.get(fontId);
  }

  addTextHeight(height) {
    let occurrence = this._textHeights.get(height) || 0;

    this._textHeights.set(height, ++occurrence);
  }

  get stats() {
    if (!this._stats) {
      const calculateMostUsedFont = () => {
        const [k, _] = Array.from(this._fontMap.entries()).reduce(([k1, v1], [k, v]) => v.occurrence > v1.occurrence ? [k, v] : [k1, v1], ['', {
          occurrence: 0
        }]);
        return k;
      };

      const calculateMaxTextHeight = () => Array.from(this._textHeights.keys()).reduce((result, h) => h > result ? h : result);

      const calculateMostUsedTextHeight = () => {
        const [k, _] = Array.from(this._textHeights.entries()).reduce(([k1, v1], [k, v]) => v > v1 ? [k, v] : [k1, v1], [0, -1]);
        return k;
      };

      this._stats = {
        maxTextHeight: calculateMaxTextHeight(),
        maxHeightFont: null,
        mostUsedFont: calculateMostUsedFont(),
        mostUsedTextHeight: calculateMostUsedTextHeight(),
        textHeigths: Array.from(this._textHeights.keys()).sort((a, b) => b - a),
        mostUsedTextDistanceY: -1
      };
    }

    return this._stats;
  }

  async loadLocalFonts(fontsFile) {
    try {
      await checkFileExistsAsync(fontsFile);
    } catch (e) {
      console.warn(`WARN: file ${fontsFile} doesn't exists!`);
      return;
    }

    try {
      const contents = await readFileAsync(fontsFile);
      const fonts = JSON.parse(contents.toString());
      Object.entries(fonts).forEach(([k, v]) => this.addFont(k, v));
    } catch (e) {
      console.warn(`WARN: error loading and evaluating ${fontsFile}! - ${e.message}`);
    }
  }

  async saveFonts(fontsFile) {
    try {
      await checkFileExistsAsync(fontsFile);
      console.warn(`WARN: file ${fontsFile} already exists!`);
      return;
    } catch (e) {}

    try {
      const init = {};
      const contents = Array.from(this._fontMap.entries()).sort((e1, e2) => e1[1].occurrence - e2[1].occurrence).reduce((result, e) => {
        result[e[0]] = e[1];
        return result;
      }, init);
      await writeFileAsync(fontsFile, JSON.stringify(contents));
    } catch (e) {
      console.warn(`WARN: error writing ${fontsFile}! - ${e.message}`);
    }
  }

}

exports.globals = new Globals();
},{}],"K2lX":[function(require,module,exports) {
"use strict";

var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.writePageAsImage = exports.writePageImage = void 0;

const canvas_1 = require("canvas");

const console_1 = require("console");

const fs_1 = __importDefault(require("fs"));

const path_1 = __importDefault(require("path"));

const util_1 = require("util");

const jimp_1 = __importDefault(require("jimp"));

var PDFImageKind;

(function (PDFImageKind) {
  PDFImageKind[PDFImageKind["GRAYSCALE_1BPP"] = 1] = "GRAYSCALE_1BPP";
  PDFImageKind[PDFImageKind["RGB_24BPP"] = 2] = "RGB_24BPP";
  PDFImageKind[PDFImageKind["RGBA_32BPP"] = 3] = "RGBA_32BPP";
})(PDFImageKind || (PDFImageKind = {}));

const writeFileAsync = util_1.promisify(fs_1.default.writeFile);

async function writePageImage(img, name, globals) {
  try {
    let bytesPerPixel = 0;

    switch (img.kind) {
      case PDFImageKind.RGB_24BPP:
        bytesPerPixel = 3;
        break;

      case PDFImageKind.RGBA_32BPP:
        bytesPerPixel = 4;
        break;

      case PDFImageKind.GRAYSCALE_1BPP:
        console_1.assert(`kind ${img.kind} is not supported yet!`);
        bytesPerPixel = 1;
        break;

      default:
        console_1.assert(`kind ${img.kind} is not supported at all!`);
        break;
    }

    const jimg = new jimp_1.default(img.width, img.height);
    const byteWidth = img.width * bytesPerPixel;

    for (var x = 0; x < img.width; x++) {
      for (var y = 0; y < img.height; y++) {
        const index = y * byteWidth + x * bytesPerPixel;
        const r = img.data[index];
        const g = img.data[index + 1];
        const b = img.data[index + 2];
        const a = bytesPerPixel == 3 ? 255 : img.data[index + 3];
        const num = jimp_1.default.rgbaToInt(r, g, b, a);
        jimg.setPixelColor(num, x, y);
      }
    }

    jimg.write(path_1.default.join(globals.outDir, `${name}.png`));
  } catch (error) {
    console.error(`Error:  ${error}`);
  }
}

exports.writePageImage = writePageImage;

class NodeCanvasFactory {
  create(width, height) {
    console_1.assert(width > 0 && height > 0, "Invalid canvas size");
    var canvas = canvas_1.createCanvas(width, height);
    var context = canvas.getContext("2d");
    return {
      canvas: canvas,
      context: context
    };
  }

  reset(canvasAndContext, width, height) {
    console_1.assert(canvasAndContext.canvas, "Canvas is not specified");
    console_1.assert(width > 0 && height > 0, "Invalid canvas size");
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }

  destroy(canvasAndContext) {
    console_1.assert(canvasAndContext.canvas, "Canvas is not specified");
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
  }

}

async function writePageAsImage(page, globals) {
  const viewport = page.getViewport({
    scale: 1.0
  });
  const canvasFactory = new NodeCanvasFactory();
  const canvasAndContext = canvasFactory.create(viewport.width, viewport.height);
  const renderContext = {
    canvasContext: canvasAndContext.context,
    viewport: viewport,
    canvasFactory: canvasFactory
  };
  await page.render(renderContext).promise;
  const content = canvasAndContext.canvas.toBuffer();
  await writeFileAsync(path_1.default.join(globals.outDir, `page-${page.pageIndex}.png`), content);
}

exports.writePageAsImage = writePageAsImage;
},{}],"FCxD":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EnhancedWord = void 0;

const pdf2md_global_1 = require("./pdf2md.global");

const FILLER = ' ¶ ';

class EnhancedWord {
  constructor(w) {
    this.x = w.x;
    this.y = w.y;
    this.width = w.width;
    this.height = w.height;
    this.text = w.text;
    this.font = w.font;
  }

  appendWord(w, isLastWord) {
    let result = false;
    const endX = this.x + this.width;
    const canConcatFilter = endX < w.x;
    const canAppendWord = this.height === w.height && this.font === w.font;
    const fillerWidth = w.x - endX;
    const isWordTextBlank = w.text.trim().length === 0;

    if (canAppendWord) {
      if (canConcatFilter && !isWordTextBlank && pdf2md_global_1.globals.isFillerEnabled) {
        this.text += FILLER.concat(w.text);
        this.width += w.width + fillerWidth;
      } else {
        this.text += w.text;
        this.width += w.width;
      }

      result = true;
    } else if (isLastWord && canConcatFilter && !isWordTextBlank && pdf2md_global_1.globals.isFillerEnabled) {
      this.text += FILLER.concat(w.text);
      this.width += w.width + fillerWidth;
    }

    return result;
  }

  addTransformer(transformer) {
    if (this._transformer) return false;
    this._transformer = transformer;
  }

  toMarkdown() {
    return this._transformer ? this._transformer(this.text) : this.text;
  }

}

exports.EnhancedWord = EnhancedWord;
},{"./pdf2md.global":"FrYy"}],"GVVa":[function(require,module,exports) {
"use strict";

var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.processPage = exports.Page = exports.Row = void 0;

const assert_1 = __importDefault(require("assert"));

const pdfjs_dist_1 = require("pdfjs-dist");

const pdf2md_global_1 = require("./pdf2md.global");

const pdf2md_image_1 = require("./pdf2md.image");

const pdf2md_model_1 = require("./pdf2md.model");

class ConsoleOutput {
  constructor() {
    this.lines = Array();
  }

  appendRow(row) {
    var _a;

    if (row.containsImages) {
      const v = (_a = row.images) === null || _a === void 0 ? void 0 : _a.map((img, i) => {
        this.lines.push({
          y: img === null || img === void 0 ? void 0 : img.y,
          width: img === null || img === void 0 ? void 0 : img.width,
          x: img === null || img === void 0 ? void 0 : img.x,
          height: img === null || img === void 0 ? void 0 : img.height,
          image: (img === null || img === void 0 ? void 0 : img.url) || 'undefined'
        });
      });
    }

    if (row.containsWords) {
      const e = row.enhancedText;
      const formats = e.map((etext, i) => {
        const text = etext.text;
        const common = {
          height: etext.height,
          image: undefined,
          text: text,
          font: etext.font
        };

        if (i == 0) {
          return Object.assign({
            y: etext.y,
            width: etext.width,
            x: etext.x
          }, common);
        }

        return Object.assign({
          width: etext.width,
          x: etext.x
        }, common);
      });
      this.lines.push(...formats);
    }
  }

}

class Row {
  constructor(args) {
    this.y = args.y;
    this._words = args.words;
    this._images = args.images;

    this._updateEnhancedText();
  }

  get containsWords() {
    return this._words !== undefined;
  }

  addWord(w) {
    var _a;

    (_a = this._words) === null || _a === void 0 ? void 0 : _a.push(w);

    this._updateEnhancedText();
  }

  get containsImages() {
    return this._images !== undefined;
  }

  addImage(img) {
    var _a;

    (_a = this._images) === null || _a === void 0 ? void 0 : _a.push(img);
  }

  _updateEnhancedText() {
    if (!this._words || this._words.length == 0) return;
    const init = {
      lastIndex: -1,
      result: Array()
    };
    this._etextArray = this._words.reduce((state, w, index, words) => {
      if (state.lastIndex < 0) {
        state.result.push(new pdf2md_model_1.EnhancedWord(w));
        state.lastIndex = 0;
      } else {
        const isLastWord = index === words.length - 1;
        const enhancedText = state.result[state.lastIndex];

        if (!enhancedText.appendWord(w, isLastWord)) {
          state.result.push(new pdf2md_model_1.EnhancedWord(w));
          state.lastIndex++;
        }
      }

      return state;
    }, init).result;
  }

  get enhancedText() {
    return this._etextArray;
  }

  get images() {
    return this._images;
  }

  containsTextWithHeight(height) {
    assert_1.default(this._etextArray, 'text array is undefined!');
    return this._etextArray.findIndex(etext => etext.height == height) >= 0;
  }

}

exports.Row = Row;

class Page {
  constructor() {
    this.rows = Array();
  }

  process(arg) {
    if ('text' in arg) {
      this.processWord(arg);
    }

    if ('url' in arg) {
      this.processImage(arg);
    }

    return this;
  }

  processImage(img) {
    let si = this.rows.findIndex(row => row.y == img.y);
    let row;

    if (si < 0) {
      row = new Row({
        y: img.y,
        images: Array()
      });
      this.rows.push(row);
    } else {
      row = this.rows[si];
    }

    row.addImage(img);
    return this;
  }

  processWord(w) {
    let si = this.rows.findIndex(row => row.y === w.y);
    let row;

    if (si < 0) {
      row = new Row({
        y: w.y,
        words: Array()
      });
      this.rows.push(row);
    } else {
      row = this.rows[si];
    }

    if (row.containsWords) {
      row.addWord(w);
    }

    return this;
  }

  consoleLog() {
    const consoleOutput = new ConsoleOutput();
    this.rows.forEach(row => consoleOutput.appendRow(row));
    console.table(consoleOutput.lines);
  }

}

exports.Page = Page;

function mergeItemsArray(a, b) {
  return a.concat(b);
}

async function processPage(proxy) {
  const ops = await proxy.getOperatorList();
  let imageMatrix = null;
  const images = Array();
  ops.fnArray.forEach(async (fn, j) => {
    let args = ops.argsArray[j];

    switch (fn) {
      case pdfjs_dist_1.OPS.setFont:
        const fontId = args[0];
        let font;

        try {
          font = proxy.objs.get(fontId);
          if (font) pdf2md_global_1.globals.addFont(fontId, font);
        } catch (e) {
          pdf2md_global_1.globals.addFont(fontId, {
            name: ''
          });
        }

        break;

      case pdfjs_dist_1.OPS.transform:
        assert_1.default(j < ops.argsArray.length, `index ${j} exceed the argsArray size ${ops.argsArray.length}`);
        imageMatrix = args;
        break;

      case pdfjs_dist_1.OPS.paintJpegXObject:
      case pdfjs_dist_1.OPS.paintImageXObject:
        const position = {
          x: 0,
          y: 0
        };

        if (imageMatrix) {
          position.x = imageMatrix ? Math.round(imageMatrix[4]) : 0;
          position.y = imageMatrix ? Math.round(imageMatrix[5]) : 0;
        }

        const imageName = args[0];
        const img = proxy.objs.get(imageName);

        if (img) {
          await pdf2md_image_1.writePageImage(img, imageName, pdf2md_global_1.globals);
          images.push({
            y: position.y,
            x: position.x,
            width: img.width,
            height: img.height,
            url: imageName
          });
        }

        imageMatrix = null;
        break;

      default:
        break;
    }
  });
  const scale = 1.0;
  const viewport = proxy.getViewport({
    scale: scale
  });
  const textContent = await proxy.getTextContent();
  const words = textContent.items.map(item => {
    const tx = pdfjs_dist_1.Util.transform(viewport.transform, item.transform);
    const fontHeight = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);
    const dividedHeight = item.height / fontHeight;
    const textRect = {
      x: Math.round(item.transform[4]),
      y: Math.round(item.transform[5]),
      width: Math.round(item.width),
      height: Math.round(dividedHeight <= 1 ? item.height : dividedHeight)
    };
    pdf2md_global_1.globals.addTextHeight(textRect.height);
    return Object.assign({
      text: item.str,
      font: item.fontName
    }, textRect);
  });
  const items = mergeItemsArray(words, images);
  const page = items.sort((a, b) => {
    const r = b.y - a.y;
    return r === 0 ? a.x - b.x : r;
  }).reduce((page, item) => page.process(item), new Page());
  return page;
}

exports.processPage = processPage;
},{"./pdf2md.global":"FrYy","./pdf2md.image":"K2lX","./pdf2md.model":"FCxD"}],"WThc":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toMarkdown = exports.isHeadline = void 0;

const assert = require("assert");

const enumify_1 = require("enumify");

const pdf2md_global_1 = require("./pdf2md.global");

class BlockType extends enumify_1.Enumify {
  constructor(options) {
    super();
    this.toText = options.toText;
  }

}

BlockType.H1 = new BlockType({
  toText: block => `# ${block}`
});
BlockType.H2 = new BlockType({
  toText: block => `## ${block}`
});
BlockType.H3 = new BlockType({
  toText: block => `### ${block}`
});
BlockType.H4 = new BlockType({
  toText: block => `#### ${block}`
});
BlockType.H5 = new BlockType({
  toText: block => `##### ${block}`
});
BlockType.H6 = new BlockType({
  toText: block => `###### ${block}`
});
BlockType._ = BlockType.closeEnum();

function isHeadline(type) {
  return type && type.enumKey.length == 2 && type.enumKey[0] === 'H';
}

exports.isHeadline = isHeadline;

const formatTextDetectingTrailingSpaces = (text, prefix, suffix) => {
  if (!suffix) suffix = prefix;
  const rx = /^(.+[^\s])(\s*)$/.exec(text);
  return rx ? `${prefix}${rx[1]}${suffix}${rx[2]}` : 'null';
};

class WordFormat extends enumify_1.Enumify {
  constructor(toText) {
    super();
    this.toText = toText;
  }

}

exports.default = WordFormat;
WordFormat.BOLD = new WordFormat(text => formatTextDetectingTrailingSpaces(text, '**'));
WordFormat.OBLIQUE = new WordFormat(text => formatTextDetectingTrailingSpaces(text, '_'));
WordFormat.BOLD_OBLIQUE = new WordFormat(text => formatTextDetectingTrailingSpaces(text, '**_', '_**'));
WordFormat.MONOSPACE = new WordFormat(text => formatTextDetectingTrailingSpaces(text, '`'));
WordFormat._ = WordFormat.closeEnum();

function blockTypeByLevel(level) {
  const blockType = BlockType.enumValues.find(e => e.enumKey == `H${level}`);
  assert(blockType, `Unsupported headline level: ${level} (supported are 1-6)`);
  return blockType;
}

function detectHeaders(row) {
  if (row.enhancedText.length == 1) {
    const mostUsedHeight = pdf2md_global_1.globals.stats.mostUsedTextHeight;
    const etext = row.enhancedText[0];

    if (etext.height != mostUsedHeight || etext.font != pdf2md_global_1.globals.stats.mostUsedFont) {
      const level = pdf2md_global_1.globals.stats.textHeigths.findIndex(v => v == etext.height);
      assert(level >= 0, `height ${etext.height} not present in textHeights stats!`);
      const blockType = blockTypeByLevel(level + 1);
      etext.addTransformer(blockType.toText);
    }
  }
}

function detectFonts(row) {
  row.enhancedText.forEach(etext => {
    const fontId = etext.font;
    const font = pdf2md_global_1.globals.getFont(fontId);

    if (font && font.name != null && fontId != pdf2md_global_1.globals.stats.mostUsedFont) {
      const fontName = font.name.toLowerCase();

      const isBold = () => fontName.includes('bold');

      const isItalic = () => fontName.includes('oblique') || fontName.includes('italic');

      const isCode = () => fontName.includes('monospace') || fontName.includes('code');

      if (isBold() && isItalic()) {
        etext.addTransformer(WordFormat.BOLD_OBLIQUE.toText);
      } else if (isBold()) {
        etext.addTransformer(WordFormat.BOLD.toText);
      } else if (isItalic()) {
        etext.addTransformer(WordFormat.OBLIQUE.toText);
      } else if (isCode()) {
        etext.addTransformer(WordFormat.MONOSPACE.toText);
      } else if (fontName === pdf2md_global_1.globals.stats.maxHeightFont) {
        etext.addTransformer(WordFormat.BOLD_OBLIQUE.toText);
      }
    }
  });
}

function toMarkdown(page) {
  const init = '';
  return page.rows.reduce((result, row, i) => {
    let md = '';

    if (row.images) {
      md = row.images.reduce((out, img) => out.concat(`![${img.url}](${pdf2md_global_1.globals.imageUrlPrefix}${img.url}.png "")`), '');
    }

    if (row.containsWords) {
      detectHeaders(row);
      detectFonts(row);
      md = row.enhancedText.reduce((out, etext) => out.concat(etext.toMarkdown()), '');
    }

    return result.concat(md).concat('\n');
  }, init);
}

exports.toMarkdown = toMarkdown;
},{"./pdf2md.global":"FrYy"}],"OTOl":[function(require,module,exports) {
"use strict";

var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

require("pdfjs-dist/es5/build/pdf.js");

const fs_1 = __importDefault(require("fs"));

const path_1 = __importDefault(require("path"));

const util_1 = require("util");

const pdfjs_dist_1 = require("pdfjs-dist");

const pdf2md_page_1 = require("./pdf2md.page");

const pdf2md_markdown_1 = require("./pdf2md.markdown");

const pdf2md_global_1 = require("./pdf2md.global");

const CMAP_URL = "../../../node_modules/pdfjs-dist/cmaps/";
const CMAP_PACKED = true;
const readFile = util_1.promisify(fs_1.default.readFile);
const writeFile = util_1.promisify(fs_1.default.writeFile);

async function main(pdfPath) {
  try {
    const fontFile = path_1.default.join('tmp', `${path_1.default.basename(pdfPath, '.pdf')}.fonts.json`);
    pdf2md_global_1.globals.loadLocalFonts(fontFile);
    const data = new Uint8Array(await readFile(pdfPath));
    const pdfDocument = await pdfjs_dist_1.getDocument({
      data: data,
      cMapUrl: CMAP_URL,
      cMapPacked: CMAP_PACKED
    }).promise;
    const numPages = pdfDocument.numPages;
    const pages = Array(numPages);

    for (let i = 1; i <= numPages; i++) {
      const pdfPage = await pdfDocument.getPage(i);
      const page = await pdf2md_page_1.processPage(pdfPage);
      pages.push(page);
    }

    const content = pages.map(page => pdf2md_markdown_1.toMarkdown(page)).reduce((result, pageText) => result.concat(pageText), '');
    await writeFile(path_1.default.join(pdf2md_global_1.globals.outDir, 'out.md'), content);
    pdf2md_global_1.globals.saveFonts(fontFile);
    pages.forEach(p => p.consoleLog());
    console.table([pdf2md_global_1.globals.stats]);
    console.log(pdf2md_global_1.globals.stats.textHeigths);
  } catch (reason) {
    console.log(reason);
  }
}

const pdfPath = process.argv[2] || "guidelines.pdf";
main(pdfPath).then(() => {});
},{"./pdf2md.page":"GVVa","./pdf2md.markdown":"WThc","./pdf2md.global":"FrYy"}]},{},["OTOl"], null)
//# sourceMappingURL=/pdf2md.main.js.map