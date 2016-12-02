import {IncomingMessage} from "http"
import {ServerResponse} from "http"
import * as url from "url"


export default class Router {
    routes = new Map<string, Function>()

    handle(req: IncomingMessage, res: ServerResponse) {
        let key = req.method + url.parse(req.url).pathname
        console.log(key)

        let routeHandler: Function = this.routes.get(key)
        if (routeHandler) {
            routeHandler(req, res)
        }
        else {
            console.log(`route not found`)
            res.writeHead(404) // no content
            res.end()
        }
    }

    GET(path: string, handler: Function, placeholder?: string) {
        this.routes.set(`GET${path}`, handler)
    }

    POST(path: string, handler: Function) {
        this.routes.set(`POST${path}`, handler)
    }
}
