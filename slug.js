import {assert, type} from "type-approve"
import i18n from "./i18n.js"


export const strip = function(value) { // string trimming that works well with urls
    assert(type({string: value}), "Can't remove special characters from non-string values!")
    return value
        .trim() // remove leading and trailing whitespaces
        .replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]+/g, "") // remove punctation (including unicode, excluding `\s`), for more information, see https://stackoverflow.com/questions/7576945/javascript-regular-expression-for-punctuation-international/7578937#7578937
        .replace(/\s+/g, "-") // replace inner whitespaces
}


export default function slug(translation_identifier, with_param_name = true) {
    /*
        Generate multilingual route paths like `/:lang/?:welcome(hello|hallo|привет)?`
        Route handlers with conditional slugs like this, will respond to any :lang, for example, the above will match "/de/hallo", "/ru/привет" or "/de/привет", but also "/de/привет"!
        @translation_identifier (string) is the reference key to the translation inside the dictionary object and contains an object with localized values like `{"hello": {"en": "hello", "de": "hallo", "ru": "привет"}}`
    */

    assert(type({string: translation_identifier}), "Slug is missing identifier argument!")
    assert(translation_identifier === strip(translation_identifier).toLowerCase(), `Slug identifier '${translation_identifier}' is not allowed to include special characters or uppercase letters!`)
    assert(i18n.DICTIONARY.hasOwnProperty(translation_identifier), `Dictionary is missing translations for identifier '${translation_identifier}'!`)
    
    return Object // fetch all translations of an identifier and compile them into one single RegExp string, to use as a path segment (slug) in a route handler
        .values(i18n.DICTIONARY[translation_identifier])
        .map(lang => strip(lang).toLowerCase())
        .join("|") // {en: "hello", fr: "bon jour", de: "hallo", ru: "привет"} compiles into "hello|bon-jour|hallo|привет"
        .replace(/(.+)/, with_param_name === true ? `:i18n_${translation_identifier}($1)` : "$1") // add prefix and finish :param by wrapping the preceding RegExp into brackets
        /*
            IMPORTANT NOTE There's a bug in outdated version of path-to-regexp@0.1.7 which is still present in express@<=5.0.0-alpha.8
            (For more info, see https://github.com/pillarjs/path-to-regexp/issues/126)
            As of now, wrapping regex expressions like (hello|hey|hi) into another pair of brackets like ((hello|hey|hi)) is not possible!
            Instead, use named :params instead, e.g. :welcome(hello|hey|hi), where `welcome` is the translation identifier from the dictionary.
            (Validation of route path expressions can also be tested with http://forbeslindesay.github.io/express-route-tester)
        */
}
