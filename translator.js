/*
    Module for working with multilingual text and translation mappings.
    There are various helpers for filling out text templates with placeholder, build url paths that are fully multilingual or translate text snippets.
    For more information, inspect the `./translations.json` file.
*/

export let DICTIONARY = {}


export const has = function(locale, identifier) { // check if dictionary contains a translation for given identifier and locale
    return (
        typeof identifier === "string" &&
        DICTIONARY.hasOwnProperty(identifier) &&
        DICTIONARY[identifier].hasOwnProperty(locale) &&
        typeof DICTIONARY[identifier][locale] === "string"
    )
}


export const add = function(locale, identifier, text) {
    if(has(locale, identifier)) {
        throw new ReferenceError(`Translation with identifier '${identifier}' and locale '${locale}' already exists!`)
    }
    DICTIONARY[identifier][locale] = text
}


export const patch = function(text, ...values) { // Substitute text placeholders with actual values
    return text.replace(/(\$(\d+))/g, function(match, placeholder, value_id) {
        /*
            For example, `patch("Welcome back, $1. There are $2 messages for you, $1.", "Eric", 2)`
            compiles into "Welcome back, Eric. There are 2 messages for you, Eric."
            See how `$1` got replaces multiple times with the first substitution argument? - Cool, eh?!
        */
        return values[value_id - 1] || placeholder // replacement value or keep placeholder identifier
    })
}


export const translate = function(locale, identifier, ...substitutions) {
    const translation = typeof identifier === "string" && DICTIONARY.hasOwnProperty(identifier)
        ? DICTIONARY[identifier]
        : DICTIONARY.missing_translation
    
    const text = translation.hasOwnProperty(locale)
        ? translation[locale]
        : patch(DICTIONARY.missing_locale.en, locale)

    return patch(text, ...substitutions)
}


export default {
    DICTIONARY,
    has,
    add,
    patch,
    translate
}
