# Readme

Most clients send an 'Accept' header with their requests and your application's response format should adapt to it. ExpressJS has `res.send()` but that's too limited. There's also `res.format()` but it requires you to write custom render functions.

This package provides an ExpressJS middleware that creates a new response handler (with a custom decorator name e.g. `res.return()`).

The `res.return()` renderer will automatically respond with HTML, JSON or Plain-Text (Yaml), based on the 'Accept' header of the client request.

## Install

1. Start by adding this package as a project dependency: `npm i i18n-renderer`
1. Import the libarary inside of your application router: `import ResponseRenderer from "i18n-renderer"`
1. Configure the response renderer: `const settings = []`
1. Finally use the middleware in your router pipeline: `app.use(ResponseRenderer(...settings))`

## Example

Here's a complete example, taken straight from one of my personal projects.

```js
// ~/app.js

import rootpath from "app-root-path"
import ExpressApplication from "express" // https://expressjs.com/en/api.html
import * as TemplateEngine from "eta" // https://eta.js.org/docs/api
import ResponseRenderer from "i18n-renderer"

let app = ExpressApplication()

TemplateEngine.configure({ // https://eta.js.org/docs/learn/configuration
    async: false,
    cache: false, // caches templates if @name or @filename is passed
    varName: "context", // name of the data object (defaults to 'it', e.g. it.foobar)
    useWith: true, // make context data available on the global object instead of varName
    autoTrim: ["slurp", "slurp"] // remove leading and trailing whitespaces and newline. Set "nl" for newlines or "slurp" for whitespaces and newlines. Apply to leading or trailing with signature of [leading option, trailing option]
})

app.engine("html", TemplateEngine.renderFile)
app.set("view engine", "html")
app.set("views", rootpath.resolve("view")) // templates in a 'view' folder
app.set("default view template", "msg") // name of the default (error) html file

app.set("default-response-template", "msg")
app.set("default-response-language", "en")

app.set("strict routing", false)
app.set("case sensitive routing", false)

app.use(ResponseRenderer( // `app` is an ExpressJS Router
    req => req.app.get("default-response-template"),
    req => req.app.get("default-response-language")
))
```

```js
// ~/view/msg.html

<%
    if(typeof language !== 'string') {
        language = "en"
    }
    if(typeof title !== "string") {
        if(typeof status !== "number") {
            title = "Response message"
        } else {
            title = status
        }
    }
    if(typeof message !== "string") {
        message = "Response message without further details..."
    }
%>
<!doctype html>
<html class="viewport-cover" lang="<%= language %>">
<head>
    <title><%= title %></title>
    <meta charset="utf-8">
    <link rel="stylesheet" type="text/css" href="/media/ui/document.css">
</head>
<body class="viewport-cover container-cxcy">
    <p><%~ message %></p>
</body>
</html>
```

## Use

Both arguments (view, context) are optional. If supplied however, then 'view' must be a string path to the view template you want to use and 'context' must be an object with at least a string 'message'.
Note: 'context.message' takes precidence before 'res.statusMessage' or the default 'message' from the getter 'defaultContext().message'. 'context.status' is substituted with 'res.statusCode' when it's missing from the context.
View templates often accept a 'context.title' too but this property is optional as far as the res[decorator_name]() handler is concerned.

Examples:
    res.status(200)[decorator_name]({message: "Welcome back to my homepage!"})
    res[decorator_name]({title: "Hello World!", message: "This is my new project!"})
    res.status(500)[decorator_name]("http/message", {message: "Welcome back to my homepage!"})
    res[decorator_name]()

TODO
