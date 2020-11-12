// Annotation for a text item
export default interface Annotation {
    category:string
    color:string
}

export const ADDED_ANNOTATION:Annotation = {
    category: 'Added',
    color: 'green'
}

export const REMOVED_ANNOTATION:Annotation = {
    category: 'Removed',
    color: 'red'
}

export const UNCHANGED_ANNOTATION:Annotation = {
    category: 'Unchanged',
    color: 'brown'
}

export const DETECTED_ANNOTATION:Annotation = {
    category: 'Detected',
    color: 'green'
}

export const MODIFIED_ANNOTATION:Annotation = {
    category: 'Modified',
    color: 'green'
}