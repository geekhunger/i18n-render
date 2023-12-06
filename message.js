import {add} from "i18n-patch"

try {
    add({
        "XXX: Request Not Matching (Default Message Title)": {
            "en": "Invalid request",
            "de": "Ungültige Anfrage",
            "ru": "Непонятный запрос"
        },
        "XXX: Request Not Matching (Default Status Message)": {
            "en": "Are you looking for something special? Sorry, but there is nothing matching your request.",
            "de": "Hälst du nach etwas besonderem Ausschau? Tschuldige, aber hier gibt es nichts passendes zu deiner Anfrage.",
            "ru": "Ищешь что-то особенное? Извини, но здесь нет ничего подходящего под твой запрос."
        }
    })
} catch(_) {
}
