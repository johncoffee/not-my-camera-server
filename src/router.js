"use strict";
const url = require("url");
class Router {
    constructor() {
        this.routes = new Map();
    }
    handle(req, res) {
        let key = req.method + url.parse(req.url).pathname;
        console.log(key);
        let routeHandler = this.routes.get(key);
        if (routeHandler) {
            routeHandler(req, res);
        }
        else {
            console.log(`route not found`);
            res.writeHead(404); // no content
            res.end();
        }
    }
    GET(path, handler, placeholder) {
        this.routes.set(`GET${path}`, handler);
    }
    POST(path, handler) {
        this.routes.set(`POST${path}`, handler);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Router;
