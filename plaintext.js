import {JSDOM as Dom} from "jsdom"
import strim from "string-slurp"

const parseHtml = function(value) {
    const html = new Dom("<!doctype html>")
    return new html.window.DOMParser().parseFromString(value, "text/html")
}

export default function plaintext(value) {
    const {body} = parseHtml(value)
    if(Array.from(body.childNodes).some(({nodeType}) => nodeType === 1)) {
        return strim(body.textContent || body.innerText)
    }
    return value
}
