"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLinks = exports.matchLink = void 0;
const matchLink = (rect, link) => (rect.x >= link.x1 && rect.x + rect.width <= link.x2) &&
    (rect.y >= link.y1 && rect.y + rect.height <= link.y2);
exports.matchLink = matchLink;
async function getLinks(page) {
    const annotations = await page.getAnnotations();
    return annotations.filter(ann => ann.subtype == 'Link').map(link => ({
        x1: Math.round(link.rect[0]), y1: Math.round(link.rect[1]),
        x2: Math.round(link.rect[2]), y2: Math.round(link.rect[3]),
        url: link.url
    }));
}
exports.getLinks = getLinks;
