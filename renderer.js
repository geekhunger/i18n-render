import {assert, type} from "type-approve"
import {translate} from "./translator.js"
import {detect as LanguageParser} from "eld"
import {stringify as yamlify} from "yaml"

const prettify = function(value) {
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

const addResponseMethod = function(decorator, req, res, nxt) {
    /*
        Add a new response decorator `res.return` for rendering responses.
        The renderer can respond automatically with HTML or JSON, depending on the 'Accept' header negotiation sent by the client.

        Both arguments (view, context) are optional. If supplied however, then 'view' must be a string path to the view template you want to use and 'context' must be an object with at least a string 'message'.
        Note: 'context.message' takes precidence before 'res.statusMessage' or the default 'msg' from the getter 'defaultContext().message'. 'context.status' is substituted with 'res.statusCode' when it's missing from the context.
        View templates often accept a 'context.title' too but this property is optional as far as the res.return() handler is concerned.

        Examples:
            res.status(200).return({message: "Welcome back to my homepage!"})
            res.return({title: "Hello World!", message: "This is my new project!"})
            res.status(500)[decorator]("http/msg", {message: "Welcome back to my homepage!"})
            res.return()
    */

    assert(type({nil: res.return}), `Response decorator with name '${decorator}' is already reserved!`)

    let hyperlink = req.protocol + "://" + req.headers.host + req.originalUrl // https://stackoverflow.com/a/10185427/4383587

    console.log(`Server received a request from ${req.ip} to '${req.method.toUpperCase()} ${hyperlink}':`, prettify({
        headers: req.headers,
        params: req.params,
        query: req.query,
        body: req.body
    }))

    res.return = function(view, context) {
        try {
            assert(!res.headersSent, `Server failed to respond to the request '${req.method.toUpperCase()}' from ${req.ip} because RESPONSE HEADERS HAVE ALREADY BEEN SENT! Check your middleware and prevent responding to same request multiple times!`)
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
            return response
        }

        const defaultView = function() {
            if(type({string: view})) {
                return view
            }
            const filepath = req.app.get("default view template")
            assert(type({string: filepath}), "Default view template path is not defined!")
            return filepath
        }

        const defaultContext = function() {
            let lang = context.language?.toLowerCase()?.trim() || req.lang?.selected?.toLowerCase()?.trim()
            let msg = translate(lang || "en", "XXX: request not matching (default status message)")
            
            if(type({string: res.statusMessage})) {
                msg = res.statusMessage
            }

            if(!type({nil: context})) {
                if(type({object: context, string: context?.message})) {
                    msg = context.message
                } else if(type({string: context})) {
                    msg = context
                }
            }

            if(!type({string: lang}) || !lang.match(/^[a-z]{2,2}$/i)) {
                lang = LanguageParser.detect(msg)?.language?.toLowerCase()
            }

            return {
                status: res.statusCode,
                title: context?.title || translate(lang, "XXX: request not matching (default message title)"),
                message: msg,
                language: lang
            }
        }

        const contextRequirements = function() {
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

export default function setupResponseRenderer(decorator = "return") {
    return function(...args) {
        return addResponseMethod(decorator, ...args)
    }
}
