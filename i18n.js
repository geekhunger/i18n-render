import Polyglot from "i18n-dict"

const lib = new Polyglot()

export default lib
export const has = lib.has
export const add = lib.add
export const patch = lib.patch
export const translate = lib.translate

add({
    ["Request Not Matching (Default Title)"]: {
        "en": "Invalid request",
        "de": "Ungültige Anfrage",
        "ru": "Непонятный запрос"
    },
    ["Request Not Matching (Default Message)"]: {
        "en": "Are you looking for something special? Sorry, but there is nothing matching your request.",
        "de": "Hälst du nach etwas besonderem Ausschau? Tschuldige, aber hier gibt es nichts passendes zu deiner Anfrage.",
        "ru": "Ищешь что-то особенное? Извини, но здесь нет ничего подходящего под твой запрос."
    }
})
