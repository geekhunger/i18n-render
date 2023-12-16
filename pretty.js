import util from "util"

export default function prettify(value) {
    return util.inspect(
        type({json: value}) // value
            ? JSON.parse(value)
            : value,
        { // options
            compact: false, // use linebreak and indentation
            showHidden: false,
            depth: null,
            colors: true
        }
    )
}
