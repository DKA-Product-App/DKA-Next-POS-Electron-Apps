import axios from "axios";


export const ApiRequestInstance = axios.create({
    baseURL : "http://127.0.0.1:8083",
    headers: {
        "Cache-Control": "no-cache",   // minta revalidate
        "Pragma": "no-cache",          // HTTP/1.0 legacy
        "Expires": "0",
    },
    params: { _ts: Date.now() },     // cache-buster
})