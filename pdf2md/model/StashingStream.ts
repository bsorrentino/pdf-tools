//Abstract stream which allows stash items temporarily
export default class StashingStream {
    results:Array<any> = [];
    stash:Array<any> = [];

    constructor() {}

    consumeAll(items:Array<any>) {
        items.forEach(item => this.consume(item));
    }

    consume(item:any) {
        if (this.shouldStash(item)) {
            if (!this.matchesStash(item)) {
                this.flushStash();
            }
            this.pushOnStash(item);
        } else {
            if (this.stash.length > 0) {
                this.flushStash();
            }
            this.results.push(item);
        }
    }

    pushOnStash(item:any) {
        this.onPushOnStash(item);
        this.stash.push(item);
    }

    complete() {
        if (this.stash.length > 0) {
            this.flushStash();
        }
        return this.results;
    }

    // return true if the item matches the items of the stack
    matchesStash(item:any) {
        if (this.stash.length == 0) {
            return true;
        }
        const lastItem = this.stash[this.stash.length - 1];
        return this.doMatchesStash(lastItem, item);
    }

    flushStash() {
        if (this.stash.length > 0) {
            this.doFlushStash(this.stash, this.results);
            this.stash = [];
        }
    }

    onPushOnStash(item:any) { 
    }

    shouldStash(item:any):boolean {
        throw new TypeError("Do not call abstract method foo from child." + item);
    }

    doMatchesStash(lastItem:any, item:any) {
        throw new TypeError("Do not call abstract method foo from child." + lastItem + item);
    }

    doFlushStash(stash:any, results:any) {
        throw new TypeError("Do not call abstract method foo from child." + stash + results);
    }
}