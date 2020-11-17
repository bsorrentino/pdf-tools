export interface Rect {
    x: number
    y: number
    width: number
    height: number
}

export interface Image extends Rect {
    url: string
}

export interface Word extends Rect {
    text: string
    font: string
}

export class EnhancedText {
    height: number
    font: string
    text: string

    constructor(w: Word) {
        this.height = w.height
        this.font = w.font
        this.text = w.text
    }

    canAppendWord(w: Word) {
        return (this.height === w.height && this.font === w.font)
    }

    appendWord(w: Word) {
        if (this.canAppendWord(w)) {
            this.text += w.text
            return true
        }
        return false
    }
}
