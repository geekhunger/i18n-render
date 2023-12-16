import {assert, type} from "type-approve"
import {has, add} from "i18n-patch"
import decorator from "./renderer.js"

export const renderer = function(options) {
    if(!type({object: options})) {
        options = {}
    }

    if(!type({string: options.decorator_name})) {
        options.decorator_name = "return"
    }

    switch(typeof options.default_template) {
        case "function":
        case "string":
            break
        default:
            options.default_template = req => req?.app?.get("default view template") || "error"
    }

    switch(typeof options.preferred_language) {
        case "function":
        case "string":
            break
        default:
            options.preferred_language = req => req?.app?.get("preferred language") || "en"
    }

    if(!type({string: options.default_response_title})) {
        options.default_response_title = "Request Not Matching (Default Title)"
        add({
            [options.default_response_title]: {
                "en": "Invalid request",
                "de": "Ungültige Anfrage",
                "ru": "Непонятный запрос"
            }
        })
    }

    if(!type({string: options.default_response_message})) {
        options.default_response_message = "Request Not Matching (Default Message)"
        add({
            [options.default_response_message]: {
                "en": "Are you looking for something special? Sorry, but there is nothing matching your request.",
                "de": "Hälst du nach etwas besonderem Ausschau? Tschuldige, aber hier gibt es nichts passendes zu deiner Anfrage.",
                "ru": "Ищешь что-то особенное? Извини, но здесь нет ничего подходящего под твой запрос."
            }
        })
    }

    const preferred_language = type({function: options.preferred_language})
        ? options.preferred_language()
        : options.preferred_language
    assert(
        has(preferred_language, options.default_response_title) &&
        has(preferred_language, options.default_response_message),
        `Response renderer is missing a translation ('${preferred_language}') for the default response title or message!`
    )

    return function setupRendererMiddleware(...event_arguments) {
        return decorator(options, ...event_arguments)
    }
}

import slug from "./slug.js"
export * from "./slug.js"

export default {
    slug,
    renderer
}
