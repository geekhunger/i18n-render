import decorator from "./renderer.js"

import slug from "./slug.js"
export * from "./slug.js"

const getDefaultTemplate = req => req.app.get("default view template")
const getDefaultLanguage = req => req.app.get("preferred language") || "en"

export const renderer = function(default_template = getDefaultTemplate, default_language = getDefaultLanguage, decorator_name = "return") {
    return function setupRendererMiddleware(...event_arguments) {
        return decorator(decorator_name, default_template, default_language, ...event_arguments)
    }
}

export default {
    slug,
    renderer
}
