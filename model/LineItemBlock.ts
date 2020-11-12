import PageItem from './PageItem'
import LineItem from './LineItem'
import BlockType from './markdown/BlockType';

// A block of LineItem[] within a Page
export default class LineItemBlock extends PageItem<BlockType> {
    items:Array<LineItem> = []

    constructor(options:any) {
        super(options);
        if (options.items) {
            options.items.forEach( (item:LineItem) => this.addItem(item));
        }
    }

    addItem(item:LineItem) {
        if (this.type && item.type && this.type !== item.type) {
            throw `Adding item of type ${item.type} to block of type ${this.type}`
        }
        if (!this.type) {
            this.type = item.type;
        }
        if (item.parsedElements) {
            if (this.parsedElements) {
                this.parsedElements.add(item.parsedElements);
            } else {
                this.parsedElements = item.parsedElements;
            }
        }
        const copiedItem = new LineItem({
            ...item
        });
        copiedItem.type = null;
        this.items.push(copiedItem);
    }

}
