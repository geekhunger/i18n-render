import {assert, type} from "type-approve"
import {stringify as yamlify} from "yaml"
import plaintext from "./plaintext.js"
import prettify from "./pretty.js"
import {detect as LanguageParser} from "eld"
import {translate} from "i18n-dict"

export default function addResponseDecorator(options, req, res, nxt) {
    assert(
        type({string: options?.decorator_name, nil: res[options?.decorator_name]}),
        `Response decorator with name '${options?.decorator_name}' can't be used!`
    )

    assert(
        type({strings: [options?.default_response_title, options?.default_response_message]}),
        "Response renderer is missing a default value for response title or message!"
    )

    let hyperlink = req.protocol + "://" + req.headers.host + req.originalUrl // https://stackoverflow.com/a/10185427/4383587

    console.log(`Server received a request from ${req.ip} to '${req.method.toUpperCase()} ${hyperlink}':`, prettify({
        headers: req.headers,
        params: req.params,
        query: req.query,
        body: req.body
    }))

    res[options.decorator_name] = function(view, context) { // add decorator to response object
        try {
            assert(!res.headersSent, `Server failed to respond to the request '${req.method.toUpperCase()}' from ${req.ip} because response headers have already been sent! Check your router middleware and prevent repetitive responses to the same requests!`)
        } catch(exception) {
            console.trace(exception.message, prettify({
                headers: res.headers,
                params: res.params,
                query: res.query,
                body: {
                    status: res.statusCode,
                    message: res.statusMessage
                }
            }))
            return res
        }

        const defaultView = () => {
            if(type({string: view})) {
                return view
            }
            assert(
                type({string: options?.default_template}, {function: options?.default_template}),
                "Malformed reference to default view template!"
            )
            const template = type({function: options.default_template})
                ? options.default_template(req) // run template getter delegate function
                : options.default_template
            assert(
                type({string: template}),
                "Invalid reference to default view template!"
            )
            return template
        }

        const defaultContext = () => {
            let title, message, language

            const validLanguage = value => /^[a-z]{2,2}$/i.test(value)
            
            if(type({string: res.statusMessage})) {
                message = res.statusMessage
            }

            if(!type({nil: context})) {
                if(type({object: context, string: context?.message})) {
                    message = context.message
                } else if(type({string: context})) {
                    message = context
                }
            }

            if(type({string: context?.title})) {
                title = context.title
            }

            if(validLanguage(context?.language)) {
                language = context.language
            } else {
                if(type({string: context?.language})) {
                    console.warn(`Template context language was set to '${context.language}' but this is not valid! A language code should be a string of two lowercase letters.`)
                }
                if(type({string: message})) {
                    language = LanguageParser.detect(message)?.language
                }
                if(!validLanguage(language) && type({string: title})) {
                    language = LanguageParser.detect(title)?.language
                }
                if(!validLanguage(language)) {
                    assert(
                        type({string: options?.preferred_language}, {function: options?.preferred_language}),
                        "Malformed reference to default language!"
                    )
                    language = type({function: options.preferred_language})
                        ? options.preferred_language(req) // run language getter delegate function
                        : options.preferred_language
                    assert(
                        validLanguage(language),
                        "Invalid reference to default language!"
                    )
                }
            }

            if(type({nil: title})) {
                title = translate(language, options.default_response_title)
            }

            if(type({nil: message})) {
                message = translate(language, options.default_response_message)
            }

            return {
                status: res.statusCode,
                title,
                message,
                language
            }
        }

        const contextRequirements = () => {
            return (
                !type({nil: context}) &&
                Object.keys(context).every(property => (
                    !type({nil: context[property]}) &&
                    ["status", "message", "language"].includes(property)
                ))
            )
        }

        if(!type({object: context})) {
            if(type({object: view})) {
                context = view
                view = defaultView() // @view and @context are both optional arguments, shift if needed
            }
        }

        if(type({nil: view})) {
            view = defaultView()
        }
        
        if(!contextRequirements()) {
            context = Object.assign(context || {}, defaultContext())
        }

        try {
            assert(type({string: view}), "Missing a view!")
            assert(type({object: context}), `Missing a context for the view '${view}'!`)
            if(res.statusCode >= 400) {
                assert(type({string: context.message}), `Context of the view '${view}' is missing a 'message'!`)
            }

        } catch(failure) {
            console.error(`Server can not respond properly to the request '${req.method.toUpperCase()}' from ${req.ip}`)
            console.error(failure.message, prettify({view, context}))
            
            view = defaultView()
            context = defaultContext()
            context.status = 500 // same as `res.status(500)` but invisible for the public!
            
            console.log(`Server will respond with default view and context settings instead:`, prettify({view, context}))
        }

        context.status = context.status || defaultContext().status
        
        res.format({
            html: () => {
                res.render(view, context, function(error, html) {
                    if(type({string: error})) {
                        console.error(`Failed to render HTML view '${view}'! ${error}`)
                        return nxt(error)
                    }
                    console.log(`Rendered an HTML view '${view}' with context:`, prettify(context))
                    res.type("text/html; charset=utf-8").send(html)
                    console.log(`Server sent a ${res.statusCode} HTML response to the request '${req.method.toUpperCase()} ${hyperlink}' from ${req.ip}:`, prettify({
                        headers: res.headers,
                        params: res.params,
                        query: res.query,
                        body: html
                    }))
                })
            },
            json: () => {
                console.log(`Rendered a JSON object:`, prettify(context))
                res.json(context)
                console.log(`Server sent a ${res.statusCode} JSON response to the request '${req.method.toUpperCase()} ${hyperlink}' from ${req.ip}:`, prettify({
                    headers: res.headers,
                    params: res.params,
                    query: res.query,
                    body: context
                }))
            },
            default: () => {
                context.message = plaintext(context.message)
                const body = yamlify(context, undefined, {strict: false, indent: 4, lineWidth: -1})
                console.log(`Rendered a plain-text string:`, prettify(body))
                res.type("text/plain; charset=utf-8").send(body)
                console.log(`Server sent a ${res.statusCode} plain-text response to the request '${req.method.toUpperCase()} ${hyperlink}' from ${req.ip}:`, prettify({
                    headers: res.headers,
                    params: res.params,
                    query: res.query,
                    body: body
                }))
            }
        })
    }

    nxt()
}
