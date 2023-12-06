import {assert, type} from "type-approve"
import {DICTIONARY, strip} from "i18n-patch"

export default function slug(translation_identifier, with_param_name = true) {
    /*
        Generate multilingual route paths like `/:lang/?:welcome(hello|hallo|привет)?`
        Route handlers with conditional slugs like this, will respond to any :lang, for example, the above will match "/de/hallo", "/ru/привет" or "/de/привет", but also "/de/привет"!
        @translation_identifier (string) is the reference key to the translation inside the dictionary object and contains an object with localized values like `{"hello": {"en": "hello", "de": "hallo", "ru": "привет"}}`
    */

    assert(type({string: translation_identifier}), "Slug is missing identifier argument!")
    assert(translation_identifier === strip(translation_identifier), `Slug identifier '${translation_identifier}' is not allowed to include special characters!`)
    assert(DICTIONARY.hasOwnProperty(translation_identifier), `Dictionary is missing translations for identifier '${translation_identifier}'!`)
    
    return Object // fetch all translations of an identifier and compile them into one single RegExp string, to use as a path segment (slug) in a route handler
        .values(DICTIONARY[translation_identifier])
        .map(strip)
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
